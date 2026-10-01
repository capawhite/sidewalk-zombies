// Level 4 art: striped umbrellas, towels, a cooler and the wooden bits (boat, chairs).
import * as THREE from 'three';
import { BIKINIS } from '../../config';
import { pbr } from '../../render/materials';
import { Atlas } from '../kit/atlas';
import { paintPhoto } from './photo';

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

export const UMBRELLA_COUNT = BIKINIS.length;
export const TOWEL_COUNT = 4;

export interface BeachKit {
  atlas: Atlas;
  material: THREE.MeshStandardMaterial;
}

let cached: BeachKit | null = null;

export function beachKit(): BeachKit {
  if (cached) return cached;
  const atlas = new Atlas(512);
  BIKINIS.forEach((c, i) => {
    const a = hex(c), b = i % 2 ? '#fbf7ea' : hex(BIKINIS[(i + 3) % BIKINIS.length]);
    atlas.add('umb' + i, 64, 64, (ctx, w, h) => {
      for (let s = 0; s < 8; s++) {
        ctx.fillStyle = s % 2 ? a : b;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.arc(w / 2, h / 2, w / 2, (s / 8) * Math.PI * 2, ((s + 1) / 8) * Math.PI * 2);
        ctx.fill();
      }
    });
    atlas.add('umbSide' + i, 32, 16, (ctx, w, h) => {
      for (let s = 0; s < 8; s++) { ctx.fillStyle = s % 2 ? a : b; ctx.fillRect(s * (w / 8), 0, w / 8, h); }
    });
  });
  const towels = ['#ff4d8a', '#4fd2ff', '#ffef6a', '#ffffff'];
  towels.forEach((c, i) => atlas.add('towel' + i, 64, 128, (ctx, w, h) => {
    ctx.fillStyle = c; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = i === 3 ? '#ee7fb0' : '#ffffff';
    for (let y = 8; y < h; y += 18) ctx.fillRect(0, y, w, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, 4, h); ctx.fillRect(w - 4, 0, 4, h);
  }));
  atlas.add('wood', 64, 64, (ctx, w, h) => {
    paintPhoto(ctx, w, h, 'wood', 21);
  });
  atlas.add('cooler', 32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#3d7ea6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(0, 0, w, h * 0.22);
    ctx.fillStyle = '#2a5a78'; ctx.fillRect(w * 0.35, h * 0.4, w * 0.3, h * 0.2);
  });
  atlas.add('ring', 64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e05a4f'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fbf7ea'; ctx.lineWidth = 12;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.36, k * Math.PI / 2 - 0.25, k * Math.PI / 2 + 0.25); ctx.stroke();
    }
  });
  atlas.add('flat', 16, 16, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); });
  cached = { atlas, material: pbr({ map: atlas.texture, vertexColors: true, roughness: 0.7 }) };
  return cached;
}
