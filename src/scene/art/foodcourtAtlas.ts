// Level 3 art: stall signs, menus, posters and the checkerboard floor.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { pbr } from '../../render/materials';
import { QUALITY } from '../../render/quality';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { Atlas, Paint } from '../kit/atlas';
import { paintPhoto } from './photo';

const FONT = '"Bricolage Grotesque", "Arial Black", "Helvetica Neue", sans-serif';

export interface Stall {
  name: string;
  bg: string;
  fg: string;
  stripe: string;
  icon: string;
}

export const STALLS: Stall[] = [
  { name: 'BURGERS', bg: '#d63b2f', fg: '#fff3d0', stripe: '#ffe27a', icon: 'burger' },
  { name: 'PIZZA', bg: '#2f8f4e', fg: '#fff3d0', stripe: '#ffe27a', icon: 'pizza' },
  { name: 'TACOS', bg: '#e8a21e', fg: '#3a1c00', stripe: '#fff3d0', icon: 'taco' },
  { name: 'SUSHI', bg: '#2b4a7a', fg: '#ffffff', stripe: '#7fe0ff', icon: 'sushi' },
  { name: 'ICE CREAM', bg: '#ee7fb0', fg: '#ffffff', stripe: '#fff3d0', icon: 'cone' },
  { name: 'COFFEE', bg: '#6b4630', fg: '#ffe9c8', stripe: '#c98a55', icon: 'cup' },
  { name: 'NOODLES', bg: '#c4302b', fg: '#ffe08a', stripe: '#ffe27a', icon: 'bowl' },
  { name: 'SMOOTHIES', bg: '#7e57c2', fg: '#ffffff', stripe: '#ff8fbf', icon: 'cup2' },
];
export const STALL_COUNT = STALLS.length;

function paintSign(st: Stall): Paint {
  return (ctx, w, h) => {
    ctx.fillStyle = st.bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = st.stripe; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, h - 8, w, 8);
    ctx.fillStyle = st.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.floor(h * 0.52)}px ${FONT}`;
    ctx.fillText(st.name, w / 2, h / 2 + 2, w - 16);
  };
}

function paintMenu(seed: number): Paint {
  return (ctx, w, h) => {
    ctx.fillStyle = '#20232a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe27a'; ctx.font = `800 22px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('MENU', 12, 26);
    const dots = ['#ff6b5a', '#7fd0ff', '#ffd24a', '#7ee08a'];
    for (let r = 0; r < 4; r++) {
      const y = 48 + r * 20;
      ctx.fillStyle = dots[(r + seed) % 4]; ctx.fillRect(12, y - 8, 12, 12);
      ctx.fillStyle = '#6b7280'; ctx.fillRect(32, y - 5, 90 + ((r * 37 + seed * 23) % 70), 6);
      ctx.fillStyle = '#fff'; ctx.font = '700 14px Arial, sans-serif';
      ctx.fillText('$' + (3 + ((r * 2 + seed) % 7)) + '.99', 196, y + 2);
    }
  };
}

export interface FoodCourtKit {
  atlas: Atlas;
  material: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
}

let cached: FoodCourtKit | null = null;

function floorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  paintPhoto(ctx, 128, 128, 'terrazzo', 8);
  ctx.fillStyle = 'rgba(180, 140, 90, 0.22)';
  ctx.fillRect(0, 0, 64, 64); ctx.fillRect(64, 64, 64, 64);
  ctx.fillStyle = 'rgba(140, 110, 70, 0.35)';
  ctx.fillRect(62, 0, 4, 128); ctx.fillRect(0, 62, 128, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = QUALITY.normalMaps ? 4 : 1;
  t.repeat.set((AISLE_W + 10) / 2, SEG_LEN / 2);
  return t;
}

export function foodCourtKit(): FoodCourtKit {
  if (cached) return cached;
  const atlas = new Atlas(1024);
  STALLS.forEach((st, i) => atlas.add('sign' + i, 256, 64, paintSign(st)));
  for (let i = 0; i < 3; i++) atlas.add('menu' + i, 256, 128, paintMenu(i));
  atlas.add('poster', 256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d6402f'; ctx.fillRect(0, 0, w, 7); ctx.fillRect(0, h - 7, w, 7);
    ctx.fillStyle = '#7a1f14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.floor(h * 0.42)}px ${FONT}`;
    ctx.fillText('MEAL DEAL  $5', w / 2, h / 2 + 2, w - 20);
  });
  atlas.add('banner', 384, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d6402f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(0, 0, w, 7); ctx.fillRect(0, h - 7, w, 7);
    ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.floor(h * 0.5)}px ${FONT}`;
    ctx.fillText('★ FOOD COURT ★', w / 2, h / 2 + 2, w - 16);
  });
  atlas.add('wallA', 32, 32, (ctx, w, h) => { paintPhoto(ctx, w, h, 'plaster', 12); ctx.fillStyle = 'rgba(246,227,200,0.4)'; ctx.fillRect(0, 0, w, h); });
  atlas.add('wallB', 32, 32, (ctx, w, h) => { paintPhoto(ctx, w, h, 'plaster', 13); ctx.fillStyle = 'rgba(233,240,224,0.4)'; ctx.fillRect(0, 0, w, h); });
  atlas.add('counter', 32, 32, (ctx, w, h) => {
    paintPhoto(ctx, w, h, 'wood', 14);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  });
  atlas.add('flat', 16, 16, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); });
  cached = {
    atlas,
    material: pbr({ map: atlas.texture, vertexColors: true, roughness: 0.55 }),
    floor: pbr({
      map: floorTexture(),
      roughness: 0.3,
      normalMap: grainNormal('fine', (AISLE_W + 10) / 1.5, SEG_LEN / 1.5),
      normalScale: SUBTLE_NORMAL,
    }),
  };
  return cached;
}
