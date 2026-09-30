// A texture atlas painted with the 2D canvas API (no image files).
//
// Everything a scene needs (product fronts, signs, windows, wood, ...) is painted once into one canvas, so
// all the textured scenery of a scene shares one material and merges into a single draw call.
// Tiles are packed left to right in rows. Each tile is padded with a few pixels of its own edge colour
// so that filtering and mip-mapping never pull in a neighbouring tile.
import * as THREE from 'three';
import { renderer } from '../../render/renderer';
import { QUALITY } from '../../render/quality';

export interface Rect { u0: number; v0: number; u1: number; v1: number }

export type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const PAD = 3;

export class Atlas {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly rects = new Map<string, Rect>();
  private cursorX = PAD;
  private cursorY = PAD;
  private rowHeight = 0;
  private tex: THREE.CanvasTexture | null = null;

  constructor(readonly size: number) {
    this.canvas.width = this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Paints a w x h tile with `paint` (origin at the tile's top-left) and remembers its UV rectangle.
  add(name: string, w: number, h: number, paint: Paint): Rect {
    if (this.cursorX + w + PAD > this.size) {
      this.cursorX = PAD;
      this.cursorY += this.rowHeight + PAD * 2;
      this.rowHeight = 0;
    }
    if (this.cursorY + h + PAD > this.size) throw new Error('Atlas is full while adding ' + name);
    const x = this.cursorX, y = this.cursorY;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    paint(ctx, w, h);
    ctx.restore();
    this.padEdges(x, y, w, h);
    this.cursorX += w + PAD * 2;
    this.rowHeight = Math.max(this.rowHeight, h);
    const s = this.size;
    const rect = { u0: x / s, u1: (x + w) / s, v0: 1 - (y + h) / s, v1: 1 - y / s };
    this.rects.set(name, rect);
    return rect;
  }

  rect(name: string): Rect {
    const r = this.rects.get(name);
    if (!r) throw new Error('No atlas tile called ' + name);
    return r;
  }

  // Stretches the outermost pixel row/column of a tile into its padding.
  private padEdges(x: number, y: number, w: number, h: number) {
    const c = this.canvas, ctx = this.ctx;
    ctx.drawImage(c, x, y, 1, h, x - PAD, y, PAD, h);
    ctx.drawImage(c, x + w - 1, y, 1, h, x + w, y, PAD, h);
    ctx.drawImage(c, x - PAD, y, w + PAD * 2, 1, x - PAD, y - PAD, w + PAD * 2, PAD);
    ctx.drawImage(c, x - PAD, y + h - 1, w + PAD * 2, 1, x - PAD, y + h, w + PAD * 2, PAD);
  }

  // The finished texture. Call after all tiles are added.
  get texture(): THREE.CanvasTexture {
    if (!this.tex) {
      const t = new THREE.CanvasTexture(this.canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = QUALITY.normalMaps ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
      this.tex = t;
    }
    return this.tex;
  }

  dispose() {
    this.tex?.dispose();
    this.tex = null;
  }
}

// ---------- UV helpers ----------

// BoxGeometry face order: +x, -x, +y, -y, +z, -z.
export type Face = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
const FACE_ORDER: Face[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

// Points a whole geometry's UVs (assumed 0..1) at one atlas rectangle.
export function mapUv(geo: THREE.BufferGeometry, rect: Rect): THREE.BufferGeometry {
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, rect.u0 + uv.getX(i) * (rect.u1 - rect.u0), rect.v0 + uv.getY(i) * (rect.v1 - rect.v0));
  }
  return geo;
}

// Points each face of a BoxGeometry at its own rectangle; `fallback` is used for faces not listed.
export function mapBoxUv(geo: THREE.BoxGeometry, fallback: Rect, faces: Partial<Record<Face, Rect>> = {}): THREE.BoxGeometry {
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  FACE_ORDER.forEach((face, f) => {
    const r = faces[face] ?? fallback;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
    }
  });
  return geo;
}
