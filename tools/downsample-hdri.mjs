// Shrinks a Radiance .hdr equirect panorama (RLE or flat RGBE) to a small flat RGBE file.
// The game only uses these for image-based lighting, so 256x128 is plenty (about 130 KB each).
//
// Usage: node tools/downsample-hdri.mjs <input.hdr> <output.hdr> [factor=4]
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output, factorArg] = process.argv.slice(2);
const factor = Number(factorArg || 4);
const buf = readFileSync(input);

// --- header ---
let pos = 0;
function readLine() {
  let s = '';
  while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++]);
  pos++;
  return s;
}
while (readLine() !== '') { /* skip header lines until the blank line */ }
const res = readLine().match(/-Y (\d+) \+X (\d+)/);
const height = Number(res[1]);
const width = Number(res[2]);

// --- pixels (new-style RLE, one scanline at a time) ---
const rgbe = new Uint8Array(width * height * 4);
for (let y = 0; y < height; y++) {
  if (buf[pos] !== 2 || buf[pos + 1] !== 2 || (buf[pos + 2] & 0x80)) throw new Error('unsupported .hdr encoding');
  pos += 4;
  const line = new Uint8Array(width * 4);
  for (let c = 0; c < 4; c++) {
    let x = 0;
    while (x < width) {
      let count = buf[pos++];
      if (count > 128) {
        count -= 128;
        const v = buf[pos++];
        while (count--) line[(x++) * 4 + c] = v;
      } else {
        while (count--) line[(x++) * 4 + c] = buf[pos++];
      }
    }
  }
  rgbe.set(line, y * width * 4);
}

// --- box downsample in linear float space ---
const w2 = Math.floor(width / factor);
const h2 = Math.floor(height / factor);
const out = Buffer.alloc(w2 * h2 * 4);
for (let y = 0; y < h2; y++) {
  for (let x = 0; x < w2; x++) {
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < factor; dy++) {
      for (let dx = 0; dx < factor; dx++) {
        const i = ((y * factor + dy) * width + (x * factor + dx)) * 4;
        const e = Math.pow(2, rgbe[i + 3] - 136);
        r += rgbe[i] * e; g += rgbe[i + 1] * e; b += rgbe[i + 2] * e;
      }
    }
    const n = factor * factor;
    r /= n; g /= n; b /= n;
    const m = Math.max(r, g, b);
    const o = (y * w2 + x) * 4;
    if (m < 1e-32) continue;
    const exp = Math.ceil(Math.log2(m)) ;
    const scale = 256 / Math.pow(2, exp) ;
    out[o] = Math.min(255, Math.floor(r * scale));
    out[o + 1] = Math.min(255, Math.floor(g * scale));
    out[o + 2] = Math.min(255, Math.floor(b * scale));
    out[o + 3] = exp + 128;
  }
}

const header = '#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ' + h2 + ' +X ' + w2 + '\n';
writeFileSync(output, Buffer.concat([Buffer.from(header, 'ascii'), out]));
console.log(output + ': ' + w2 + 'x' + h2 + ', ' + (out.length / 1024).toFixed(0) + ' KB');
