// Stage 7: shareable result card — canvas PNG, no external services.
import type { SharePayload } from './runReport';

const W = 1080;
const H = 1350; // 4:5 — solid for chats + IG feed; crops cleanly for stories

let canvas: HTMLCanvasElement | null = null;
let lastUrl = '';
let lastBlob: Blob | null = null;
let lastChallenge = '';

function ctx2d(): CanvasRenderingContext2D {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
  }
  return canvas.getContext('2d')!;
}

function roundRect(
  c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function fitText(
  c: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight = '800',
): number {
  let s = size;
  c.font = weight + ' ' + s + 'px "Bricolage Grotesque", system-ui, sans-serif';
  while (s > 28 && c.measureText(text).width > maxW) {
    s -= 2;
    c.font = weight + ' ' + s + 'px "Bricolage Grotesque", system-ui, sans-serif';
  }
  return s;
}

function drawCard(payload: SharePayload) {
  const c = ctx2d();
  const { snap, title, sub, death } = payload;

  // Atmosphere background
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1410');
  bg.addColorStop(0.45, '#2a221c');
  bg.addColorStop(1, '#0e0c0a');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Soft vignette / aisle glow
  const glow = c.createRadialGradient(W * 0.5, H * 0.28, 40, W * 0.5, H * 0.35, 520);
  glow.addColorStop(0, 'rgba(255,122,47,0.28)');
  glow.addColorStop(1, 'rgba(255,122,47,0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);

  // Frame
  c.strokeStyle = 'rgba(255,255,255,0.14)';
  c.lineWidth = 4;
  roundRect(c, 48, 48, W - 96, H - 96, 36);
  c.stroke();

  // Brand
  c.fillStyle = '#ff9a4a';
  c.font = '700 28px Inter, system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('SIDEWALK ZOMBIES', W / 2, 130);

  if (snap.newBest) {
    c.fillStyle = '#ffe27a';
    c.font = '800 22px "Bricolage Grotesque", system-ui, sans-serif';
    c.fillText('★ NEW BEST ★', W / 2, 178);
  }

  // Classification
  let y = snap.newBest ? 250 : 220;
  fitText(c, title, W - 160, 72);
  c.fillStyle = '#fff6e8';
  c.textAlign = 'center';
  c.fillText(title, W / 2, y);

  c.fillStyle = '#f0d078';
  c.font = '700 26px "Bricolage Grotesque", system-ui, sans-serif';
  y += 48;
  const subLines = wrap(c, sub, W - 180, 26);
  for (const line of subLines) {
    c.fillText(line, W / 2, y);
    y += 34;
  }

  // Death line
  y += 28;
  c.fillStyle = 'rgba(255,255,255,0.72)';
  c.font = '600 28px Inter, system-ui, sans-serif';
  for (const line of wrap(c, death, W - 180, 28)) {
    c.fillText(line, W / 2, y);
    y += 38;
  }

  // Stats panel
  y = Math.max(y + 40, 560);
  roundRect(c, 100, y, W - 200, 420, 28);
  c.fillStyle = 'rgba(12,14,18,0.72)';
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.12)';
  c.lineWidth = 2;
  c.stroke();

  const stats: [string, string][] = [
    ['DISTANCE', snap.dist.toLocaleString() + 'm'],
    ['SCORE', snap.total.toLocaleString()],
    ['BEST COMBO', '×' + snap.bestCombo],
    ['BONKS', String(snap.bonks)],
    ['NEAR MISSES', String(snap.nearMisses)],
    ['CHAINS', String(snap.chains)],
  ];
  const colW = (W - 200) / 2;
  stats.forEach(([k, v], i) => {
    const col = i % 2;
    const row = (i / 2) | 0;
    const sx = 100 + col * colW + colW / 2;
    const sy = y + 70 + row * 120;
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.font = '700 20px Inter, system-ui, sans-serif';
    c.fillText(k, sx, sy);
    c.fillStyle = i === 0 ? '#ffb04a' : '#fff6e8';
    c.font = '800 52px "Bricolage Grotesque", system-ui, sans-serif';
    c.fillText(v, sx, sy + 56);
  });

  // Challenge CTA
  const challenge = 'Can you beat ' + snap.dist.toLocaleString() + 'm?';
  c.fillStyle = '#ffe27a';
  fitText(c, challenge, W - 160, 44);
  c.fillText(challenge, W / 2, H - 120);

  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.font = '600 22px Inter, system-ui, sans-serif';
  c.fillText('sidewalkzombies', W / 2, H - 70);
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number, _size: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (c.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

async function toBlob(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas!.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png');
  });
}

function revoke() {
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = '';
  lastBlob = null;
}

/** Draw the card and refresh the over-screen preview. */
export async function presentShareCard(payload: SharePayload) {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch { /* ignore */ }
  lastChallenge = 'Can you beat ' + payload.snap.dist.toLocaleString() + 'm?';
  drawCard(payload);
  revoke();
  lastBlob = await toBlob();
  lastUrl = URL.createObjectURL(lastBlob);
  const img = document.getElementById('sharePreview') as HTMLImageElement | null;
  if (img) {
    img.src = lastUrl;
    img.classList.remove('hide');
  }
  const row = document.getElementById('shareRow');
  if (row) row.classList.remove('hide');
}

export function downloadShareCard() {
  if (!lastUrl) return;
  const a = document.createElement('a');
  a.href = lastUrl;
  a.download = 'sidewalk-zombies-run.png';
  a.click();
}

export async function shareShareCard() {
  if (!lastBlob) return;
  const file = new File([lastBlob], 'sidewalk-zombies-run.png', { type: 'image/png' });
  const data: ShareData = {
    title: 'Sidewalk Zombies',
    text: lastChallenge || 'Can you beat my Sidewalk Zombies run?',
    files: [file],
  };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return;
    }
  } catch {
    // user cancel or unsupported — fall through to download
  }
  downloadShareCard();
}

export function initShareCardUi() {
  document.getElementById('shareSave')?.addEventListener('click', downloadShareCard);
  document.getElementById('shareSend')?.addEventListener('click', () => { void shareShareCard(); });
}
