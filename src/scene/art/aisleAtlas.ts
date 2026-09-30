// Level 1 art: the supermarket atlas (product fronts, price rails, category headers, hanging sign, cardboard).
// Painted once on first use and kept for the whole session.
import { pbr } from '../../render/materials';
import { Atlas, Paint } from '../kit/atlas';
import { makeRng } from '../kit/parts';

export const PRODUCT_COUNT = 16;
export const HEADER_NAMES = ['CEREAL', 'SNACKS', 'DRINKS', 'PASTA', 'CANNED', 'BAKERY'];
const HEADER_COLORS = ['#7fb5a6', '#e7a65a', '#5b9bd0', '#d9805f', '#9fb26b', '#c98fb4'];
const PRODUCT_COLORS = [
  '#e05a4f', '#f0c14b', '#4a9d6e', '#3d7ea6', '#c46b2d', '#8b5a9f', '#f4f0e6', '#2f6f6a',
  '#d9486a', '#7fb5a6', '#e8884a', '#5f7fc4', '#a8c256', '#f2d9a0', '#b04a3a', '#4b9aa8',
];
const FONT = '"Bricolage Grotesque", "Arial Black", "Helvetica Neue", sans-serif';

function shadeOf(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

// One product front. Four packaging families so the shelves do not read as identical boxes.
function paintProduct(i: number): Paint {
  const base = PRODUCT_COLORS[i];
  const family = i % 4;
  const rnd = makeRng(500 + i);
  return (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    if (family === 0) { // cereal box: header band, big mascot disc, bowl
      ctx.fillStyle = shadeOf(base, 0.72); ctx.fillRect(0, 0, w, h * 0.2);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9; ctx.fillRect(w * 0.16, h * 0.07, w * 0.68, h * 0.06); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(w / 2, h * 0.55, h * 0.27, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shadeOf(base, 0.6);
      ctx.beginPath(); ctx.arc(w * 0.42, h * 0.5, h * 0.05, 0, Math.PI * 2); ctx.arc(w * 0.58, h * 0.5, h * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(w * 0.38, h * 0.63, w * 0.24, h * 0.04);
    } else if (family === 1) { // can: metal rims, label with a wavy band
      ctx.fillStyle = '#c9ced4'; ctx.fillRect(0, 0, w, h * 0.12); ctx.fillRect(0, h * 0.88, w, h * 0.12);
      ctx.fillStyle = '#f7f1e2'; ctx.fillRect(0, h * 0.34, w, h * 0.3);
      ctx.fillStyle = shadeOf(base, 0.7);
      for (let x = 0; x < w; x += 8) ctx.fillRect(x, h * 0.3 + Math.sin(x * 0.4) * 3, 5, 4);
      ctx.fillStyle = shadeOf(base, 0.55); ctx.fillRect(w * 0.2, h * 0.46, w * 0.6, h * 0.05); ctx.fillRect(w * 0.3, h * 0.55, w * 0.4, h * 0.04);
    } else if (family === 2) { // carton: white gable top, colour body, fruit dot
      ctx.fillStyle = '#f2f2ee'; ctx.fillRect(0, 0, w, h * 0.24);
      ctx.fillStyle = shadeOf(base, 0.85); ctx.fillRect(0, h * 0.24, w, h * 0.04);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.6, w * 0.26, h * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = base; ctx.beginPath(); ctx.arc(w / 2, h * 0.6, h * 0.11, 0, Math.PI * 2); ctx.fill();
    } else { // bag: crimped top and bottom, diagonal stripe
      ctx.fillStyle = shadeOf(base, 0.7);
      for (let x = 0; x < w; x += 4) { ctx.fillRect(x, 0, 2, h * 0.1); ctx.fillRect(x, h * 0.9, 2, h * 0.1); }
      ctx.fillStyle = shadeOf(base, 1.25);
      ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.4); ctx.lineTo(w, h * 0.6); ctx.lineTo(0, h * 0.95); ctx.fill();
      ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.4, w * 0.3, h * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    }
    // A few tiny "text" bars, jittered so no two products match exactly.
    ctx.fillStyle = 'rgba(30,30,40,0.35)';
    for (let k = 0; k < 2; k++) ctx.fillRect(w * (0.2 + rnd() * 0.1), h * (0.8 + k * 0.06), w * (0.3 + rnd() * 0.3), h * 0.03);
    // Soft gloss from the fluorescent tubes: bright on the left, shaded to the right and bottom.
    const gloss = ctx.createLinearGradient(0, 0, w, 0);
    gloss.addColorStop(0, 'rgba(255,255,255,0.22)'); gloss.addColorStop(0.35, 'rgba(255,255,255,0)'); gloss.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = gloss; ctx.fillRect(0, 0, w, h);
  };
}

function paintHeader(i: number): Paint {
  return (ctx, w, h) => {
    ctx.fillStyle = HEADER_COLORS[i]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, w, h * 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, h * 0.88, w, h * 0.12);
    ctx.fillStyle = '#fbfaf4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.floor(h * 0.6)}px ${FONT}`;
    ctx.fillText(HEADER_NAMES[i], w / 2, h * 0.52, w - 40);
  };
}

export interface AisleKit {
  atlas: Atlas;
  material: ReturnType<typeof pbr>;
}

let cached: AisleKit | null = null;

export function aisleKit(): AisleKit {
  if (cached) return cached;
  const atlas = new Atlas(1024);
  for (let i = 0; i < PRODUCT_COUNT; i++) atlas.add('prod' + i, 64, 64, paintProduct(i));
  for (let i = 0; i < PRODUCT_COUNT; i++) {
    atlas.add('side' + i, 16, 16, (ctx, w, h) => { ctx.fillStyle = PRODUCT_COLORS[i]; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 0, w, h); });
  }
  atlas.add('plank', 64, 32, (ctx, w, h) => {
    ctx.fillStyle = '#b9bcc0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 2; y < h; y += 5) ctx.fillRect(0, y, w, 1);
  });
  atlas.add('priceRail', 256, 16, (ctx, w, h) => {
    const rnd = makeRng(91);
    ctx.fillStyle = '#f2f1ea'; ctx.fillRect(0, 0, w, h);
    for (let x = 4; x < w - 20; x += 22 + Math.floor(rnd() * 10)) {
      ctx.fillStyle = rnd() < 0.3 ? '#ffd23f' : '#ffffff'; ctx.fillRect(x, 2, 18, h - 5);
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(x + 2, 5, 8 + Math.floor(rnd() * 6), 2); ctx.fillRect(x + 2, 9, 12, 3);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, h - 2, w, 2);
  });
  atlas.add('panel', 32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#5b6d6a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) ctx.fillRect(x, y, 2, 2); // pegboard holes
  });
  atlas.add('upright', 16, 16, (ctx, w, h) => { ctx.fillStyle = '#7fb5a6'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(w * 0.6, 0, w * 0.4, h); });
  atlas.add('kick', 32, 32, (ctx, w, h) => { ctx.fillStyle = '#39443f'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, 0, w, 3); });
  atlas.add('cardboard', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c69a62'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = 3; y < h; y += 6) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = '#e6d3ac'; ctx.fillRect(w * 0.42, 0, w * 0.16, h);
    ctx.fillStyle = '#5a3d1c'; ctx.font = `800 ${w * 0.16}px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('THIS SIDE UP', w / 2, h * 0.82, w - 12);
    ctx.fillRect(w * 0.1, h * 0.14, w * 0.2, h * 0.08);
  });
  HEADER_NAMES.forEach((_, i) => atlas.add('hdr' + i, 384, 64, paintHeader(i)));
  atlas.add('sign', 384, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7f6ef'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7fb5a6'; ctx.fillRect(0, 0, w * 0.28, h);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${h * 0.34}px ${FONT}`; ctx.fillText('AISLE', w * 0.14, h * 0.36, w * 0.24);
    ctx.font = `800 ${h * 0.62}px ${FONT}`; ctx.fillText('7', w * 0.14, h * 0.72, w * 0.24);
    ctx.fillStyle = '#2f3b38'; ctx.textAlign = 'left';
    ctx.font = `800 ${h * 0.3}px ${FONT}`; ctx.fillText('Cereal', w * 0.33, h * 0.32, w * 0.62);
    ctx.fillStyle = '#5b6d6a'; ctx.font = `700 ${h * 0.18}px ${FONT}`;
    ctx.fillText('Breakfast · Oats · Granola', w * 0.33, h * 0.68, w * 0.62);
  });
  cached = { atlas, material: pbr({ map: atlas.texture, vertexColors: true, roughness: 0.55 }) };
  return cached;
}
