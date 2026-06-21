#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const contracts = [
  { queue: 'tasks', schema: '.ai-bridge/schemas/task.schema.json' },
  { queue: 'assets', schema: '.ai-bridge/schemas/asset-request.schema.json' },
  { queue: 'reports', schema: '.ai-bridge/schemas/agent-report.schema.json' },
  { queue: 'reviews', schema: '.ai-bridge/schemas/review-request.schema.json' },
];
const states = ['pending', 'in_progress', 'completed', 'failed'];
const heartbeatSchemaPath = '.ai-bridge/schemas/worker-heartbeat.schema.json';

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON ${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
}

function walkJson(dir) {
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    if (statSync(fullPath).isDirectory()) entries.push(...walkJson(fullPath));
    else if (name.endsWith('.json')) entries.push(fullPath);
  }
  return entries;
}

function validateValue(value, schema, at) {
  if (!schema) return;
  if (schema.enum && !schema.enum.includes(value)) fail(`${at} must be one of ${schema.enum.join(', ')}`);
  if (schema.type) validateType(value, schema.type, at);
  if (schema.type === 'object') validateObject(value, schema, at);
  if (schema.type === 'array') validateArray(value, schema, at);
  if (schema.type === 'string') validateString(value, schema, at);
  if (schema.type === 'integer' && Number.isInteger(value) && schema.minimum !== undefined && value < schema.minimum) {
    fail(`${at} must be >= ${schema.minimum}`);
  }
}

function validateType(value, type, at) {
  const ok =
    (type === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value)) ||
    (type === 'array' && Array.isArray(value)) ||
    (type === 'string' && typeof value === 'string') ||
    (type === 'integer' && Number.isInteger(value)) ||
    (type === 'boolean' && typeof value === 'boolean');
  if (!ok) fail(`${at} must be ${type}`);
}

function validateObject(value, schema, at) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of schema.required ?? []) {
    if (!(key in value)) fail(`${at}.${key} is required`);
  }
  const properties = schema.properties ?? {};
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) fail(`${at}.${key} is not allowed`);
    }
  }
  for (const [key, childSchema] of Object.entries(properties)) {
    if (key in value) validateValue(value[key], childSchema, `${at}.${key}`);
  }
}

function validateArray(value, schema, at) {
  if (!Array.isArray(value)) return;
  if (schema.minItems !== undefined && value.length < schema.minItems) fail(`${at} must contain at least ${schema.minItems} item(s)`);
  if (schema.uniqueItems) {
    const seen = new Set(value.map((item) => JSON.stringify(item)));
    if (seen.size !== value.length) fail(`${at} must contain unique items`);
  }
  if (schema.items) value.forEach((item, index) => validateValue(item, schema.items, `${at}[${index}]`));
}

function validateString(value, schema, at) {
  if (typeof value !== 'string') return;
  if (schema.minLength !== undefined && value.length < schema.minLength) fail(`${at} must be at least ${schema.minLength} characters`);
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail(`${at} does not match ${schema.pattern}`);
  if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) fail(`${at} must be a date-time`);
}

function validateQueues() {
  const parsed = { assets: [], heartbeats: new Map() };
  for (const { queue, schema: schemaPath } of contracts) {
    const schemaFullPath = path.join(root, schemaPath);
    const schema = readJson(schemaFullPath);
    if (!schema) continue;
    for (const state of states) {
      const dir = path.join(root, '.ai-bridge', queue, state);
      if (!existsSync(dir)) {
        fail(`Missing queue directory .ai-bridge/${queue}/${state}`);
        continue;
      }
      for (const filePath of walkJson(dir)) {
        const data = readJson(filePath);
        if (!data) continue;
        validateValue(data, schema, path.relative(root, filePath));
        if (queue === 'assets') parsed.assets.push({ data, filePath, dirState: state });
      }
    }
  }
  return parsed;
}

function validateHeartbeats() {
  const schema = readJson(path.join(root, heartbeatSchemaPath));
  const heartbeats = new Map();
  if (!schema) return heartbeats;
  const dir = path.join(root, '.ai-bridge/workers/heartbeats');
  if (!existsSync(dir)) {
    fail('Missing worker heartbeat directory .ai-bridge/workers/heartbeats');
    return heartbeats;
  }
  for (const filePath of walkJson(dir)) {
    const data = readJson(filePath);
    if (!data) continue;
    validateValue(data, schema, path.relative(root, filePath));
    if (heartbeats.has(data.id)) fail(`Duplicate worker heartbeat id: ${data.id}`);
    heartbeats.set(data.id, { data, filePath });
  }
  return heartbeats;
}

function validateAssetWorkflow(assetEntries, heartbeats) {
  for (const { data, filePath } of assetEntries) {
    const rel = path.relative(root, filePath);
    if (data.provider === 'auto' && data.state === 'pending' && data.owner !== 'unassigned') {
      fail(`${rel}: provider=auto pending requests must use owner=unassigned`);
    }
    if (data.provider === 'auto' && ['in_progress', 'completed'].includes(data.state)) {
      for (const field of ['claimedBy', 'claimedAt', 'heartbeatId', 'selectedProvider']) {
        if (!data[field]) fail(`${rel}: provider=auto ${data.state} request missing ${field}`);
      }
      if (data.owner === 'unassigned') fail(`${rel}: claimed provider=auto requests must have owner codex or antigravity`);
    }
    if (data.provider !== 'auto' && data.selectedProvider && data.selectedProvider !== data.provider) {
      fail(`${rel}: selectedProvider must match provider unless provider=auto`);
    }
    if (data.state === 'completed' && !data.result) fail(`${rel}: completed asset requests must include result`);
    if (data.heartbeatId && heartbeats.has(data.heartbeatId)) {
      const heartbeat = heartbeats.get(data.heartbeatId).data;
      const provider = data.selectedProvider ?? (data.provider === 'auto' ? '' : data.provider);
      if (provider && !heartbeat.providers.includes(provider)) fail(`${rel}: heartbeat ${data.heartbeatId} does not support provider ${provider}`);
      if (!heartbeat.assetTypes.includes(data.type)) fail(`${rel}: heartbeat ${data.heartbeatId} does not support asset type ${data.type}`);
    } else if (data.heartbeatId) {
      fail(`${rel}: heartbeat ${data.heartbeatId} was not found`);
    }
  }
}

const parsed = validateQueues();
const heartbeats = validateHeartbeats();
validateAssetWorkflow(parsed.assets, heartbeats);

if (failures.length > 0) {
  console.error('Queue validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Queue validation passed for ${contracts.length} queue contract(s) and ${heartbeats.size} worker heartbeat(s).`);
