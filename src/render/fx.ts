// Particles, floating popups and screen flashes.
import * as THREE from 'three';
import { camera, scene, wrap } from './renderer';

// ---------- juice: particles, popups, flashes ----------
const elPops = document.getElementById('pops')!, elFx = document.getElementById('fx')!;
export const parts: any[] = [];
const geoPart = new THREE.BoxGeometry(0.13, 0.13, 0.13);
function getPart(): any {
  for (const p of parts) if (!p.active) return p;
  if (parts.length >= 110) return null;
  const m: any = new THREE.Mesh(geoPart, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  m.active = false; m.visible = false; scene.add(m); parts.push(m); return m;
}
export function fxBurst(x: number, y: number, z: number, color: number, n: number, spd = 4, up = 4.5, life = 0.6) {
  for (let i = 0; i < n; i++) {
    const p = getPart(); if (!p) return;
    p.active = true; p.visible = true; p.life = life * (0.7 + Math.random() * 0.6); p.maxLife = p.life;
    p.position.set(x, y, z);
    const a = Math.random() * 6.283;
    p.userData.vx = Math.cos(a) * spd * Math.random();
    p.userData.vz = Math.sin(a) * spd * Math.random();
    p.userData.vy = up * (0.4 + Math.random() * 0.7);
    p.material.color.setHex(color); p.material.opacity = 1;
    p.scale.setScalar(0.6 + Math.random() * 0.9);
  }
}
export function updateParts(dt: number) {
  for (const p of parts) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; p.visible = false; continue; }
    p.userData.vy -= 14 * dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    if (p.position.y < 0.05) { p.position.y = 0.05; p.userData.vy *= -0.3; }
    p.material.opacity = Math.min(1, p.life / p.maxLife * 1.6);
    p.rotation.x += dt * 9; p.rotation.y += dt * 7;
  }
}
const _pv = new THREE.Vector3();
export function hexCss(n: number) { return '#' + n.toString(16).padStart(6, '0'); }
export function popAt(x: number, y: number, z: number, text: string, color: string, big = false) {
  if (elPops.childElementCount > 9) return;
  _pv.set(x, y, z).project(camera);
  if (_pv.z > 1 || Math.abs(_pv.x) > 1.2) return;
  const d = document.createElement('div');
  d.className = 'pop' + (big ? ' big' : '');
  d.textContent = text;
  d.style.left = ((_pv.x * 0.5 + 0.5) * wrap.clientWidth) + 'px';
  d.style.top = ((-_pv.y * 0.5 + 0.5) * wrap.clientHeight) + 'px';
  d.style.color = color;
  elPops.appendChild(d);
  setTimeout(() => d.remove(), 900);
}
export function screenFlash() {
  elFx.classList.remove('go'); void (elFx as HTMLElement).offsetWidth; elFx.classList.add('go');
}
export const FXC: any = { shove: 0xffffff, cart: 0x7fd0ff, horn: 0xffd24a, gun: 0xff8a2a, bomb: 0xff4466 };
export const FXW: any = { shove: 'BONK!', cart: 'WHACK!', horn: 'HONK!', gun: 'PEW!', bomb: 'BOOM!' };