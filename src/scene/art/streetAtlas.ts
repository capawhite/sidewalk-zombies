// Level 2 art: boardwalk shop fronts, striped awnings and the plank texture for the walkway.
import * as THREE from 'three';
import { pbr } from '../../render/materials';
import { QUALITY } from '../../render/quality';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { Atlas, Paint } from '../kit/atlas';
import { makeRng } from '../kit/parts';
import { paintPhoto } from './photo';

const FONT = '"Bricolage Grotesque", "Arial Black", "Helvetica Neue", sans-serif';

// A facade tile covers 5 m x 7.2 m at about 51 pixels per metre.
export const FACADE_W = 5, FACADE_H = 7.2;
const PX = 51.2;

interface Shop {
  name: string;
  wall: string;      // stucco
  trim: string;      // cornice and window frames
  sign: string;      // sign background
  signText: string;
  shutter: string;
  goods: string[];   // colours of the things in the window
}

const SHOPS: Shop[] = [
  { name: 'SURF SHOP', wall: '#f0d8bf', trim: '#fff6e8', sign: '#2b8fb3', signText: '#ffffff', shutter: '#2f7f6a', goods: ['#ff6b5a', '#ffd24a', '#4fd2ff', '#ffffff'] },
  { name: 'GELATO', wall: '#f4c7c0', trim: '#fff6e8', sign: '#ee7fb0', signText: '#ffffff', shutter: '#5b9bd0', goods: ['#fff1c8', '#ff8fbf', '#8fe0c0', '#c79bff'] },
  { name: 'BIKE RENTAL', wall: '#d8e4c8', trim: '#fbf7ea', sign: '#d6402f', signText: '#fff3d0', shutter: '#3b4a5a', goods: ['#3b4a5a', '#e05a4f', '#f0c14b', '#4a9d6e'] },
  { name: 'CAFE LUNA', wall: '#e8d5b8', trim: '#fff6e8', sign: '#5a3d2b', signText: '#ffe9c8', shutter: '#8a3a2a', goods: ['#f4efe4', '#c98a55', '#e8b06a', '#8a5a32'] },
  { name: 'SUN & SAND', wall: '#c9e0e6', trim: '#ffffff', sign: '#f0a23a', signText: '#3a1c00', shutter: '#2b8fb3', goods: ['#ffef6a', '#ff4d8a', '#4fd2ff', '#2ad4c8'] },
  { name: 'ARCADE', wall: '#e2cfe6', trim: '#fff6e8', sign: '#2f2a4a', signText: '#7fe0ff', shutter: '#7e57c2', goods: ['#7fe0ff', '#ff4d8a', '#ffd24a', '#7ee08a'] },
];
// Width of the visible boardwalk strip between the curb and the shop fronts.
export const BOARDWALK_W = 1.35;
export const FACADE_COUNT = SHOPS.length;
const AWNING_COLORS = ['#e05a4f', '#2b8fb3', '#f0a23a', '#4a9d6e'];
export const AWNING_COUNT = AWNING_COLORS.length;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Window glass: sky reflection fading to warm evening light, with one soft diagonal streak.
function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const gr = ctx.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, '#8fcbe8'); gr.addColorStop(1, '#f2d7a8');
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.moveTo(x + w * 0.15, y); ctx.lineTo(x + w * 0.4, y); ctx.lineTo(x + w * 0.1, y + h); ctx.lineTo(x - w * 0.1, y + h); ctx.fill();
}

function paintFacade(i: number): Paint {
  const shop = SHOPS[i];
  const rnd = makeRng(700 + i);
  return (ctx, w, h) => {
    const Y = (m: number) => h - m * PX; // y in metres above the ground -> canvas y
    paintPhoto(ctx, w, h, 'plaster', 70 + i);
    ctx.fillStyle = shop.wall; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
    // Stucco mottling.
    for (let k = 0; k < 500; k++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(90,60,30,0.05)';
      ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 6);
    }
    // Ground-floor shop window and door.
    ctx.fillStyle = shop.trim; ctx.fillRect(0.35 * PX, Y(2.55), 3.1 * PX, 2.15 * PX);
    glass(ctx, 0.5 * PX, Y(2.4), 2.8 * PX, 1.85 * PX);
    ctx.fillStyle = 'rgba(40,30,25,0.35)'; ctx.fillRect(0.5 * PX, Y(1.0), 2.8 * PX, 1.0 * PX); // dim interior
    ctx.fillStyle = shop.trim; ctx.fillRect(0.5 * PX, Y(0.95), 2.8 * PX, 0.06 * PX);           // display shelf
    shop.goods.forEach((c, k) => {
      ctx.fillStyle = c; rounded(ctx, (0.75 + k * 0.68) * PX, Y(0.95 + 0.5 + rnd() * 0.25), 0.4 * PX, (0.5 + rnd() * 0.25) * PX, 6); ctx.fill();
    });
    ctx.fillStyle = shop.trim; ctx.fillRect(3.65 * PX, Y(2.6), 1.05 * PX, 2.6 * PX);           // door frame
    glass(ctx, 3.75 * PX, Y(2.5), 0.85 * PX, 2.3 * PX);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(4.45 * PX, Y(1.25), 0.05 * PX, 0.3 * PX);          // handle
    // Sign band with the shop name.
    ctx.fillStyle = shop.sign; ctx.fillRect(0, Y(3.35), w, 0.7 * PX);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, Y(3.35) + 0.66 * PX, w, 0.04 * PX);
    ctx.fillStyle = shop.signText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${0.46 * PX}px ${FONT}`; ctx.fillText(shop.name, w / 2, Y(3.0), w - 24);
    // Cornice band between the floors.
    ctx.fillStyle = shop.trim; ctx.fillRect(0, Y(3.75), w, 0.22 * PX);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, Y(3.75) + 0.2 * PX, w, 0.05 * PX);
    // Upper floors: shuttered windows with flower boxes.
    for (const [y0, wh] of [[4.2, 1.5], [6.0, 1.05]] as const) {
      for (const cx of [1.25, 3.75]) {
        const x0 = (cx - 0.5) * PX, ww = 1.0 * PX, hh = wh * PX, y = Y(y0 + wh);
        ctx.fillStyle = shop.trim; ctx.fillRect(x0 - 5, y - 5, ww + 10, hh + 10);
        glass(ctx, x0, y, ww, hh);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x0 + ww / 2 - 2, y, 4, hh); ctx.fillRect(x0, y + hh / 2 - 2, ww, 4); // mullions
        ctx.fillStyle = shop.shutter;
        ctx.fillRect(x0 - 0.42 * PX, y - 2, 0.36 * PX, hh + 4); ctx.fillRect(x0 + ww + 0.06 * PX, y - 2, 0.36 * PX, hh + 4);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let s = 6; s < hh; s += 8) { ctx.fillRect(x0 - 0.42 * PX, y + s, 0.36 * PX, 2); ctx.fillRect(x0 + ww + 0.06 * PX, y + s, 0.36 * PX, 2); }
        if (y0 < 5) { // flower box under the lower windows
          ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x0 - 4, y + hh + 5, ww + 8, 0.2 * PX);
          for (let f = 0; f < 9; f++) { ctx.fillStyle = ['#ff6b8a', '#ffd24a', '#5cbf6a'][f % 3]; ctx.beginPath(); ctx.arc(x0 + f * (ww / 8), y + hh + 4, 5, 0, Math.PI * 2); ctx.fill(); }
        }
      }
    }
    // Parapet.
    ctx.fillStyle = shop.trim; ctx.fillRect(0, 0, w, 0.32 * PX);
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, 0.3 * PX, w, 0.05 * PX);
    // Baked occlusion under the sign band, cornice and the top: soft dark gradients.
    for (const yy of [Y(3.35) + 0.7 * PX, Y(3.75) + 0.22 * PX]) {
      const gr = ctx.createLinearGradient(0, yy, 0, yy + 0.25 * PX);
      gr.addColorStop(0, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, yy, w, 0.25 * PX);
    }
  };
}

export interface StreetKit {
  atlas: Atlas;
  material: THREE.MeshStandardMaterial;
  boards: THREE.MeshStandardMaterial; // boardwalk planks (tiles, so it needs its own repeating texture)
}

let cached: StreetKit | null = null;

function boardsTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  paintPhoto(ctx, 128, 128, 'wood', 33);
  const rnd = makeRng(33);
  for (let p = 0; p < 4; p++) { // four planks running across the walkway
    ctx.fillStyle = 'rgba(60,40,20,0.55)'; ctx.fillRect(0, p * 32 + 30, 128, 2);          // seam
    ctx.fillStyle = 'rgba(60,40,20,0.5)'; ctx.fillRect(6, p * 32 + 14, 3, 3); ctx.fillRect(121, p * 32 + 14, 3, 3); // nails
    for (let g = 0; g < 8; g++) { ctx.fillStyle = `rgba(90,60,30,${0.04 + rnd() * 0.05})`; ctx.fillRect(rnd() * 128, p * 32 + 2 + rnd() * 26, 20 + rnd() * 50, 1); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = QUALITY.normalMaps ? 4 : 1;
  return t;
}

export function streetKit(): StreetKit {
  if (cached) return cached;
  const atlas = new Atlas(1024);
  for (let i = 0; i < FACADE_COUNT; i++) atlas.add('facade' + i, 256, 368, paintFacade(i));
  // Stripes vary along the tile's height because an awning's top face maps that direction onto its length.
  AWNING_COLORS.forEach((color, i) => atlas.add('awning' + i, 32, 128, (ctx, w, h) => {
    for (let s = 0; s < 8; s++) { ctx.fillStyle = s % 2 ? '#fbf7ea' : color; ctx.fillRect(0, s * (h / 8), w, h / 8); }
  }));
  atlas.add('flat', 16, 16, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); });
  const boardsMap = boardsTexture();
  boardsMap.repeat.set(BOARDWALK_W / 2, 20 / 2);
  cached = {
    atlas,
    material: pbr({ map: atlas.texture, vertexColors: true, roughness: 0.75 }),
    boards: pbr({ map: boardsMap, vertexColors: true, roughness: 0.75, normalMap: grainNormal('fine', BOARDWALK_W / 1.5, 20 / 1.5), normalScale: SUBTLE_NORMAL, color: 0xffffff }),
  };
  return cached;
}
