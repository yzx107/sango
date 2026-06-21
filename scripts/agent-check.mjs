#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strictAssets = process.argv.includes('--strict-assets');
const failures = [];
const warnings = [];

function relPath(filePath) {
  return path.relative(root, filePath);
}

function exists(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) failures.push(`Missing required file: ${relativePath}`);
  return fullPath;
}

function readText(relativePath) {
  const fullPath = exists(relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function publicPathFromAsset(file) {
  const normalized = file.startsWith('/') ? file.slice(1) : file;
  if (normalized.startsWith('assets/')) return path.join(root, 'public', normalized);
  return path.join(root, normalized);
}

function imageFormat(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return 'unknown';
}

function imageDimensions(buffer, format) {
  if (format === 'png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (format === 'jpeg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) return null;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

function checkRequiredText(relativePath, snippets) {
  const text = readText(relativePath);
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`${relativePath} must mention ${snippet}`);
  }
}

function checkPackageScripts() {
  const pkg = readJson('package.json');
  if (!pkg) return;
  const scripts = pkg.scripts ?? {};
  for (const script of ['build', 'test', 'verify:visual', 'inspect:canvas', 'validate:data', 'agent:check']) {
    if (!scripts[script]) failures.push(`package.json missing script: ${script}`);
  }
}

function checkManifest() {
  const manifest = readJson('public/assets/generated/manifest.json');
  if (!manifest) return;
  if (!Array.isArray(manifest.assets)) {
    failures.push('public/assets/generated/manifest.json must contain an assets array');
    return;
  }

  const requiredFiles = [
    '/assets/generated/rulers/liubei.png',
    '/assets/generated/rulers/caocao.png',
    '/assets/generated/rulers/sunjian.png',
    '/assets/generated/rulers/yuanshao.png',
    '/assets/generated/rulers/dongzhuo.png',
    '/assets/generated/rulers/liuyan.png',
    '/assets/generated/rulers/mateng.png',
    '/assets/generated/backgrounds/ruler-select.png',
  ];
  const manifestFiles = new Set(manifest.assets.map((asset) => asset.file));
  for (const requiredFile of requiredFiles) {
    if (!manifestFiles.has(requiredFile)) failures.push(`Manifest missing asset entry: ${requiredFile}`);
  }

  for (const asset of manifest.assets) {
    if (!asset.file || typeof asset.file !== 'string') {
      failures.push('Manifest asset entry missing string file field');
      continue;
    }
    const fullPath = publicPathFromAsset(asset.file);
    if (!existsSync(fullPath)) {
      failures.push(`Manifest points to missing asset: ${asset.file}`);
      continue;
    }
    const buffer = readFileSync(fullPath);
    const actualFormat = imageFormat(buffer);
    const dimensions = imageDimensions(buffer, actualFormat);
    const extension = path.extname(fullPath).slice(1).toLowerCase();
    if (actualFormat === 'unknown') warnings.push(`Unknown image encoding: ${asset.file}`);
    if (extension && actualFormat !== 'unknown' && extension !== actualFormat) {
      const message = `Image extension/encoding mismatch: ${asset.file} is .${extension} but contains ${actualFormat}`;
      if (strictAssets) failures.push(message);
      else warnings.push(message);
    }
    const declaredFormat = String(asset.format ?? asset.actualFormat ?? asset.mimeType ?? '').toLowerCase();
    if (declaredFormat && actualFormat !== 'unknown' && !declaredFormat.includes(actualFormat)) {
      warnings.push(`Manifest format differs from file encoding: ${asset.file} declares ${declaredFormat}, detected ${actualFormat}`);
    }
    if (asset.size && dimensions) {
      const declaredSize = String(asset.size).toLowerCase();
      const actualSize = `${dimensions.width}x${dimensions.height}`;
      if (declaredSize !== actualSize) failures.push(`Manifest size mismatch: ${asset.file} declares ${asset.size}, detected ${actualSize}`);
    }
  }
}

function main() {
  for (const file of [
    'PROJECT_BRIEF.md',
    'AGENTS.md',
    '.ai-bridge/current-plan.md',
    '.ai-bridge/agent-status.md',
    '.ai-bridge/loop-state.md',
    '.ai-bridge/file-locks.md',
    'public/assets/generated/manifest.json',
    '.github/workflows/ci.yml',
    '.github/ISSUE_TEMPLATE/agent-task.yml',
    '.github/pull_request_template.md',
  ]) {
    exists(file);
  }

  checkRequiredText('PROJECT_BRIEF.md', ['霸王的大陆', '不复刻任何原作资产', 'Antigravity', 'Codex', 'ChatGPT']);
  checkRequiredText('AGENTS.md', ['PROJECT_BRIEF.md', 'Antigravity', 'Codex Game Development Agent']);
  checkRequiredText('.ai-bridge/current-plan.md', ['Owner: Antigravity Local Art/UI Agent', '完成后']);
  checkRequiredText('.ai-bridge/loop-state.md', ['state:', 'current_owner:', 'needs_art']);
  checkRequiredText('.ai-bridge/file-locks.md', ['Current Locks', 'Locked']);
  checkPackageScripts();
  checkManifest();

  if (warnings.length > 0) {
    console.warn('Agent check warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (failures.length > 0) {
    console.error('Agent check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Agent check passed${warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ''}.`);
}

main();
