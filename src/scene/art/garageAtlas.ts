// Level 5 art: parking-garage signs, painted stall marks and a pay-station panel.
import { pbr } from '../../render/materials';
import { Atlas } from '../kit/atlas';
import { paintPhoto } from './photo';

const FONT = '"Bricolage Grotesque", "Arial Black", "Helvetica Neue", sans-serif';

export interface GarageKit {
  atlas: Atlas;
  material: ReturnType<typeof pbr>;
}

let cached: GarageKit | null = null;

export function garageKit(): GarageKit {
  if (cached) return cached;
  const atlas = new Atlas(512);
  atlas.add('wall', 64, 64, (ctx, w, h) => {
    paintPhoto(ctx, w, h, 'concrete', 15);
    ctx.fillStyle = 'rgba(40,42,38,0.12)'; ctx.fillRect(0, 0, w, h);
  });
  atlas.add('stripe', 64, 16, (ctx, w, h) => {
    ctx.fillStyle = '#f0c14b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  });
  atlas.add('bumper', 64, 16, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f0c14b' : '#1a1a1a';
      ctx.fillRect(i * (w / 8), 0, w / 8, h);
    }
  });
  atlas.add('signP2', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a2e28'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f0c14b'; ctx.fillRect(0, 0, 10, h); ctx.fillRect(w - 10, 0, 10, h);
    ctx.fillStyle = '#f4f0e6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${h * 0.28}px ${FONT}`; ctx.fillText('LEVEL', w / 2, h * 0.32, w - 28);
    ctx.fillStyle = '#f0c14b'; ctx.font = `800 ${h * 0.52}px ${FONT}`; ctx.fillText('P2', w / 2, h * 0.7, w - 28);
  });
  atlas.add('signExit', 256, 80, (ctx, w, h) => {
    ctx.fillStyle = '#1f6b3a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f0e6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${h * 0.62}px ${FONT}`; ctx.fillText('EXIT', w / 2, h * 0.52, w - 16);
  });
  atlas.add('pay', 192, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a3140'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f0c14b'; ctx.fillRect(0, 0, w, 10); ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = '#f4f0e6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${h * 0.28}px ${FONT}`; ctx.fillText('PAY HERE', w / 2, h * 0.38, w - 16);
    ctx.fillStyle = '#7ec8ff'; ctx.fillRect(w * 0.22, h * 0.55, w * 0.56, h * 0.28);
    ctx.fillStyle = '#1a1a1a'; ctx.font = `800 ${h * 0.16}px ${FONT}`; ctx.fillText('TAP CARD', w / 2, h * 0.7, w * 0.5);
  });
  atlas.add('arrow', 64, 96, (ctx, w, h) => {
    ctx.fillStyle = '#f0c14b';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.08);
    ctx.lineTo(w * 0.88, h * 0.42);
    ctx.lineTo(w * 0.62, h * 0.42);
    ctx.lineTo(w * 0.62, h * 0.92);
    ctx.lineTo(w * 0.38, h * 0.92);
    ctx.lineTo(w * 0.38, h * 0.42);
    ctx.lineTo(w * 0.12, h * 0.42);
    ctx.closePath();
    ctx.fill();
  });
  atlas.add('flat', 16, 16, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); });
  cached = { atlas, material: pbr({ map: atlas.texture, vertexColors: true, roughness: 0.7 }) };
  return cached;
}
