import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const root = 'public/assets/generated';
const rulerDir = join(root, 'rulers');
const backgroundDir = join(root, 'backgrounds');
mkdirSync(rulerDir, { recursive: true });
mkdirSync(backgroundDir, { recursive: true });

const rulers = [
  { id: 'liubei', robe: '#d8b84c', trim: '#efe4b0', hair: '#2a1a12', face: '#d9a36f', accent: '#705c2a' },
  { id: 'caocao', robe: '#9f3b2f', trim: '#d4a84d', hair: '#17120f', face: '#c99167', accent: '#4d2420' },
  { id: 'sunjian', robe: '#2f8a68', trim: '#e1c25e', hair: '#23140d', face: '#d6a06b', accent: '#1d4c3c' },
  { id: 'yuanshao', robe: '#8d62b0', trim: '#d2b75a', hair: '#2a1820', face: '#d0a077', accent: '#4d365f' },
  { id: 'dongzhuo', robe: '#6d5a35', trim: '#c79a3b', hair: '#16110d', face: '#c58662', accent: '#3b301d' },
  { id: 'liuyan', robe: '#3f7da3', trim: '#d6c06a', hair: '#252018', face: '#d7a173', accent: '#25475c' },
  { id: 'mateng', robe: '#b36a35', trim: '#e3c16c', hair: '#1d1510', face: '#c98b60', accent: '#5a3820' },
];

const manifest = {
  generatedAt: new Date().toISOString(),
  tool: 'procedural-fallback',
  blocker: 'GEMINI_API_KEY unavailable from threejs-game-director credential probe',
  assets: [],
};

for (const ruler of rulers) {
  const png = new PNG({ width: 512, height: 512 });
  fill(png, '#111813');
  checker(png, '#18241c', '#0d120f', 32);
  rect(png, 48, 48, 416, 416, '#0b0d0a');
  rect(png, 64, 64, 384, 384, ruler.accent);
  rect(png, 80, 80, 352, 352, '#1f2119');
  rect(png, 192, 98, 128, 40, ruler.trim);
  rect(png, 160, 128, 192, 74, ruler.hair);
  rect(png, 176, 180, 160, 150, ruler.face);
  rect(png, 144, 306, 224, 128, ruler.robe);
  rect(png, 176, 322, 160, 24, ruler.trim);
  rect(png, 146, 354, 58, 78, ruler.accent);
  rect(png, 308, 354, 58, 78, ruler.accent);
  rect(png, 208, 238, 28, 16, '#12100c');
  rect(png, 276, 238, 28, 16, '#12100c');
  rect(png, 238, 282, 36, 12, '#8a4d3c');
  rect(png, 212, 310, 88, 18, ruler.hair);
  rect(png, 180, 180, 18, 110, shade(ruler.face, -26));
  rect(png, 318, 180, 18, 110, shade(ruler.face, -20));
  dither(png, 3);
  const file = join(rulerDir, `${ruler.id}.png`);
  writeFileSync(file, PNG.sync.write(png));
  manifest.assets.push({
    file: `/assets/generated/rulers/${ruler.id}.png`,
    purpose: `${ruler.id} ruler portrait`,
    size: '512x512',
    promptSummary: 'procedural original 8-bit inspired Three Kingdoms ruler bust, limited palette, no copied source',
  });
}

const bg = new PNG({ width: 1440, height: 900 });
fill(bg, '#101713');
for (let y = 0; y < bg.height; y += 1) {
  for (let x = 0; x < bg.width; x += 1) {
    const band = Math.floor((Math.sin(x * 0.01) + Math.cos(y * 0.008)) * 9);
    setPixel(bg, x, y, band > 0 ? '#15221a' : '#0e1411');
  }
}
for (let i = 0; i < 46; i += 1) {
  const x = (i * 127) % 1440;
  const y = 120 + ((i * 83) % 650);
  rect(bg, x, y, 140 + (i % 4) * 30, 4, '#5e4a2b');
  rect(bg, x + 18, y + 22, 4, 90 + (i % 3) * 36, '#5e4a2b');
}
for (let i = 0; i < 110; i += 1) {
  rect(bg, (i * 61) % 1440, (i * 47) % 900, 3, 3, i % 2 ? '#d3b35d' : '#6d2f26');
}
dither(bg, 5);
writeFileSync(join(backgroundDir, 'ruler-select.png'), PNG.sync.write(bg));
manifest.assets.push({
  file: '/assets/generated/backgrounds/ruler-select.png',
  purpose: 'ruler selection background',
  size: '1440x900',
  promptSummary: 'procedural original retro strategy map texture, deep teal and old gold, no copied source',
});
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));

function fill(png, color) {
  rect(png, 0, 0, png.width, png.height, color);
}

function checker(png, a, b, size) {
  for (let y = 0; y < png.height; y += size) {
    for (let x = 0; x < png.width; x += size) {
      rect(png, x, y, size, size, (x / size + y / size) % 2 ? a : b);
    }
  }
}

function rect(png, x, y, width, height, color) {
  for (let yy = Math.max(0, y); yy < Math.min(png.height, y + height); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(png.width, x + width); xx += 1) {
      setPixel(png, xx, yy, color);
    }
  }
}

function dither(png, strength) {
  for (let y = 0; y < png.height; y += 2) {
    for (let x = (y / 2) % 2; x < png.width; x += 4) {
      const offset = (png.width * y + x) << 2;
      png.data[offset] = Math.max(0, png.data[offset] - strength);
      png.data[offset + 1] = Math.max(0, png.data[offset + 1] - strength);
      png.data[offset + 2] = Math.max(0, png.data[offset + 2] - strength);
    }
  }
}

function setPixel(png, x, y, color) {
  const [r, g, b] = hex(color);
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = 255;
}

function hex(color) {
  const value = color.replace('#', '');
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16));
}

function shade(color, amount) {
  const [r, g, b] = hex(color);
  const toHex = (value) => Math.max(0, Math.min(255, value + amount)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
