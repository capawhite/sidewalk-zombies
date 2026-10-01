// Web Audio context, master bus and basic synth voices.
import { rand } from '../util';

// ---------- audio ----------
export let AC: AudioContext | null = null;
let master: DynamicsCompressorNode | null = null;
export let outGain: GainNode | null = null, musicGain: GainNode | null = null;
export let muted = false;
 try { muted = localStorage.getItem('sz_mute') === '1'; } catch (e) {}
export let noiseBuf: AudioBuffer | null = null;
export function audioResume() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = AC.createDynamicsCompressor();
      master.threshold.value = -16;
      master.knee.value = 10;
      master.ratio.value = 6;
      master.attack.value = 0.003;
      master.release.value = 0.14;
      outGain = AC.createGain();
      outGain.gain.value = muted ? 0 : 1;
      master.connect(outGain); outGain.connect(AC.destination);
      musicGain = AC.createGain();
      musicGain.gain.value = 0.55;
      musicGain.connect(master);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = rand() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('sz_mute', muted ? '1' : '0'); } catch (e) {}
  if (outGain) outGain.gain.value = muted ? 0 : 1;
  document.getElementById('mute')!.classList.toggle('off', muted);
  audioResume();
}
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.hidden) AC.suspend(); else AC.resume();
});
function bus() { return master || AC!.destination; }
export function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, freqEnd?: number) {
  if (!AC) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus());
  o.start(t); o.stop(t + dur + 0.03);
}
export function holdTone(
  freq: number, dur: number, type: OscillatorType, vol: number, when = 0,
  filt: BiquadFilterType = 'bandpass', ffreq = 700, q = 3, freqEnd?: number,
) {
  if (!AC) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const f = AC.createBiquadFilter(); f.type = filt; f.Q.value = q;
  f.frequency.setValueAtTime(ffreq, t);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.014);
  g.gain.setValueAtTime(vol, t + Math.max(0.04, dur * 0.62));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(bus());
  o.start(t); o.stop(t + dur + 0.05);
}
export function burst(dur: number, vol: number, ffreq: number, when = 0, kind: BiquadFilterType = 'lowpass', ffreqEnd?: number, q = 1) {
  if (!AC || !noiseBuf) return;
  const t = AC.currentTime + when;
  const src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = kind; f.Q.value = q;
  f.frequency.setValueAtTime(ffreq, t);
  if (ffreqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, ffreqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(bus());
  src.start(t); src.stop(t + dur + 0.03);
}