#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'public/assets/generated/manifest.json');
const failures = [];

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

function detectImage(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      format: 'PNG',
      mime: 'image/png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = jpegDimensions(buffer);
    return { format: 'JPEG', mime: 'image/jpeg', width: dimensions?.width ?? null, height: dimensions?.height ?? null };
  }
  return null;
}

function jpegDimensions(buffer) {
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
  return null;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function publicAssetPath(file) {
  const normalized = file.startsWith('/') ? file.slice(1) : file;
  return normalized.startsWith('assets/') ? path.join(root, 'public', normalized) : path.join(root, normalized);
}

function parseSize(size) {
  const match = String(size ?? '').toLowerCase().match(/^(\d+)x(\d+)$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

function expectedFormatFromExtension(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.png') return 'PNG';
  if (extension === '.jpg' || extension === '.jpeg') return 'JPEG';
  if (extension === '.webp') return 'WEBP_UNSUPPORTED';
  return '';
}

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function validateManifest() {
  if (!existsSync(manifestPath)) {
    fail('Missing public/assets/generated/manifest.json');
    return new Set();
  }
  const manifest = readJson(manifestPath);
  if (!manifest || !Array.isArray(manifest.assets)) {
    fail('Manifest must contain an assets array');
    return new Set();
  }

  const seen = new Set();
  for (const asset of manifest.assets) {
    if (!asset.file) {
      fail('Manifest asset missing file');
      continue;
    }
    if (seen.has(asset.file)) fail(`Duplicate manifest asset: ${asset.file}`);
    seen.add(asset.file);

    const fullPath = publicAssetPath(asset.file);
    if (!existsSync(fullPath)) {
      fail(`Missing asset file: ${asset.file}`);
      continue;
    }

    const buffer = readFileSync(fullPath);
    const detected = detectImage(buffer);
    if (!detected) {
      fail(`Unsupported or invalid magic bytes: ${asset.file}`);
      continue;
    }

    const extensionFormat = expectedFormatFromExtension(asset.file);
    if (!extensionFormat) fail(`Unsupported asset extension: ${asset.file}`);
    else if (extensionFormat === 'WEBP_UNSUPPORTED') fail(`WebP is not supported until dimensions are parsed: ${asset.file}`);
    else if (extensionFormat !== detected.format) fail(`Extension/magic mismatch for ${asset.file}: extension ${extensionFormat}, file ${detected.format}`);

    if (!asset.mime) fail(`Manifest asset missing MIME: ${asset.file}`);
    else if (asset.mime !== detected.mime) fail(`MIME mismatch for ${asset.file}: manifest ${asset.mime}, file ${detected.mime}`);

    const expectedFormat = String(asset.format ?? '').toUpperCase();
    if (!expectedFormat) fail(`Manifest asset missing format: ${asset.file}`);
    else if (expectedFormat !== detected.format) fail(`Format mismatch for ${asset.file}: manifest ${expectedFormat}, file ${detected.format}`);

    const size = parseSize(asset.size);
    if (!size) fail(`Invalid or missing size for ${asset.file}`);
    else if (size.width !== detected.width || size.height !== detected.height) {
      fail(`Dimension mismatch for ${asset.file}: manifest ${asset.size}, file ${detected.width}x${detected.height}`);
    }

    if (!asset.sha256) fail(`Missing sha256 for ${asset.file}`);
    else {
      const actualSha = sha256(buffer);
      if (asset.sha256 !== actualSha) fail(`sha256 mismatch for ${asset.file}: manifest ${asset.sha256}, file ${actualSha}`);
    }
  }
  return seen;
}

function validateGeneratedFiles(manifestFiles) {
  const generatedDir = path.join(root, 'public/assets/generated');
  const imageFiles = walkFiles(generatedDir).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
  for (const file of imageFiles) {
    const publicPath = `/${path.relative(path.join(root, 'public'), file).split(path.sep).join('/')}`;
    if (!manifestFiles.has(publicPath)) fail(`Generated image missing from manifest: ${publicPath}`);
  }
}

function validateCompletedAssetRequests(manifestFiles) {
  const completedDir = path.join(root, '.ai-bridge/assets/completed');
  for (const file of walkFiles(completedDir).filter((candidate) => candidate.endsWith('.json'))) {
    const request = readJson(file);
    if (!request) continue;
    if (request.state !== 'completed') fail(`Completed request has non-completed state: ${path.relative(root, file)}`);
    if (!request.targetPath) {
      fail(`Completed request missing targetPath: ${path.relative(root, file)}`);
      continue;
    }
    const publicPath = `/${request.targetPath.replace(/^public\//, '')}`;
    if (!manifestFiles.has(publicPath)) fail(`Completed request target missing from manifest: ${publicPath}`);
  }
}

const manifestFiles = validateManifest();
validateGeneratedFiles(manifestFiles);
validateCompletedAssetRequests(manifestFiles);

if (failures.length > 0) {
  console.error('Asset validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Asset validation passed for ${manifestFiles.size} manifest asset(s).`);
