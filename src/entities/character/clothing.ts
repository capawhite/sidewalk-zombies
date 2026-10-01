// Shared clothing / skin atlas for the skinned people.
//
// One material still draws every character. Fabric and skin live in the map; the per-person tint
// (threat-shirt green/amber/red, skin, pants) stays in vertex colours and multiplies with the map.
import * as THREE from 'three';
import { Atlas } from '../../scene/kit/atlas';
import { paintPhoto } from '../../scene/art/photo';
import type { Region } from './kit';

const REPEAT: Record<Region, number> = {
  skin: 1, shirt: 2.4, pants: 2.8, shoes: 2, socks: 3.2, hair: 3.6, eyes: 1,
};

function fract(t: number) {
  return t - Math.floor(t);
}

let atlas: Atlas | null = null;

function blit(ctx: CanvasRenderingContext2D, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  paint(tmp.getContext('2d')!);
  ctx.drawImage(tmp, 0, 0);
}

function paintSkin(ctx: CanvasRenderingContext2D, w: number, h: number) {
  blit(ctx, w, h, (c) => {
    paintPhoto(c, w, h, 'plaster', 11);
    const img = c.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // Near-white so vertex skin colour carries the tone; keep a little warm mottling.
      const k = (d[i] + d[i + 1] + d[i + 2]) / (3 * 255);
      d[i] = 242 + k * 10;
      d[i + 1] = 226 + k * 8;
      d[i + 2] = 214 + k * 6;
    }
    c.putImageData(img, 0, 0);
  });
}

function paintWeave(ctx: CanvasRenderingContext2D, w: number, h: number, diagonal: boolean) {
  blit(ctx, w, h, (c) => {
    paintPhoto(c, w, h, 'plaster', diagonal ? 29 : 17);
    const img = c.getImageData(0, 0, w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const thread = diagonal
          ? ((x + y) % 4 === 0 ? 0.86 : 1)
          : ((x % 3 === 0 ? 0.9 : 1) * (y % 3 === 0 ? 0.92 : 1));
        const wrinkle = 0.94 + 0.06 * Math.sin(x * 0.11 + y * 0.07);
        const v = 230 * thread * wrinkle;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
    c.putImageData(img, 0, 0);
  });
}

function paintLeather(ctx: CanvasRenderingContext2D, w: number, h: number) {
  blit(ctx, w, h, (c) => {
    paintPhoto(c, w, h, 'cardboard', 41);
    const img = c.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i] * 0.45 + 40;
      d[i] = g; d[i + 1] = g * 0.92; d[i + 2] = g * 0.82;
    }
    c.putImageData(img, 0, 0);
  });
}

function paintHair(ctx: CanvasRenderingContext2D, w: number, h: number) {
  blit(ctx, w, h, (c) => {
    const img = c.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const strand = 180 + 50 * Math.sin(x * 0.9 + Math.sin(y * 0.2) * 2);
        const gap = (x * 3 + y) % 5 === 0 ? 0.55 : 1;
        const v = strand * gap;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  });
}

function paintEyes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f2eee8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1c1410';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a4030';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, w * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f4ee';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.4, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function paintSocks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  paintWeave(ctx, w, h, false);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
}

export function clothingAtlas(): Atlas {
  if (atlas) return atlas;
  const a = new Atlas(512);
  a.add('skin', 128, 128, paintSkin);
  a.add('shirt', 128, 128, (ctx, w, h) => paintWeave(ctx, w, h, false));
  a.add('pants', 128, 128, (ctx, w, h) => paintWeave(ctx, w, h, true));
  a.add('shoes', 128, 128, paintLeather);
  a.add('socks', 64, 64, paintSocks);
  a.add('hair', 128, 128, paintHair);
  a.add('eyes', 64, 64, paintEyes);
  atlas = a;
  return a;
}

// Puts each vertex's UV into its region's atlas tile. Shirt/pants wrap around the torso; skin faces forward.
export function applyClothingUvs(geo: THREE.BufferGeometry, regionVerts: Record<Region, Uint32Array>) {
  const a = clothingAtlas();
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  (Object.keys(regionVerts) as Region[]).forEach((region) => {
    const verts = regionVerts[region];
    if (!verts.length) return;
    const rect = a.rect(region);
    let minY = Infinity, maxY = -Infinity;
    for (let k = 0; k < verts.length; k++) {
      const y = pos.getY(verts[k]);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const cylindrical = region === 'shirt' || region === 'pants' || region === 'socks';
    const rep = REPEAT[region];
    for (let k = 0; k < verts.length; k++) {
      const i = verts[k];
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      let tu: number, tv: number;
      if (cylindrical) {
        tu = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
        tv = (y - minY) / (maxY - minY || 1);
      } else if (region === 'shoes') {
        tu = x * 0.45 + 0.5;
        tv = z * 0.45 + 0.5;
      } else {
        tu = x * 0.28 + 0.5;
        tv = (y - minY) / (maxY - minY || 1);
      }
      tu = fract(tu * rep);
      tv = fract(tv * (region === 'skin' || region === 'eyes' ? 1 : rep));
      uv[i * 2] = rect.u0 + (0.02 + tu * 0.96) * (rect.u1 - rect.u0);
      uv[i * 2 + 1] = rect.v0 + (0.02 + tv * 0.96) * (rect.v1 - rect.v0);
    }
  });
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
