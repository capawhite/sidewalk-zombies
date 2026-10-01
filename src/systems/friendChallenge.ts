// Stage 8: friend challenge links — lightweight, anonymous, no backend.
//
// URL shape:  /?beat=1482&who=Ruy
// Opening it parks a challenge on the menu. Accept → in-run ghost target.
// Beat it → celebration + revenge share. Create challenges from game-over.
import { flash } from '../hud/hud';
import { G, S } from '../state';
import { lastSharePayload } from './runReport';

export interface FriendChallenge {
  who: string;
  dist: number;
}

const LS_NAME = 'sz_name';
const MAX_NAME = 14;
const MIN_DIST = 50;
const MAX_DIST = 99999;

let incoming: FriendChallenge | null = null;
let active: FriendChallenge | null = null;
let beaten = false;
let flashedBeat = false;

let elBanner: HTMLElement | null = null;
let elHeadline: HTMLElement | null = null;
let elChip: HTMLElement | null = null;
let elChipText: HTMLElement | null = null;
let elOverRival: HTMLElement | null = null;
let elName: HTMLInputElement | null = null;

function sanitizeName(raw: string): string {
  const cleaned = raw.replace(/[^\w\s\-'.]/g, '').trim().replace(/\s+/g, ' ');
  return (cleaned || 'FRIEND').slice(0, MAX_NAME).toUpperCase();
}

function clampDist(n: number): number {
  return Math.max(MIN_DIST, Math.min(MAX_DIST, Math.floor(n)));
}

export function getPlayerName(): string {
  try {
    const stored = localStorage.getItem(LS_NAME);
    if (stored) return sanitizeName(stored);
  } catch { /* ignore */ }
  return 'FRIEND';
}

export function setPlayerName(raw: string) {
  const name = sanitizeName(raw);
  try { localStorage.setItem(LS_NAME, name); } catch { /* ignore */ }
  if (elName && elName.value.toUpperCase() !== name) elName.value = name;
  return name;
}

export function parseChallengeFromUrl(): FriendChallenge | null {
  const p = new URLSearchParams(location.search);
  const dist = parseInt(p.get('beat') || '', 10);
  if (!Number.isFinite(dist) || dist < MIN_DIST) return null;
  return { who: sanitizeName(p.get('who') || 'FRIEND'), dist: clampDist(dist) };
}

export function buildChallengeUrl(dist: number, who = getPlayerName()): string {
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('beat', String(clampDist(dist)));
  u.searchParams.set('who', sanitizeName(who));
  return u.toString();
}

function cleanChallengeParams() {
  const u = new URL(location.href);
  if (!u.searchParams.has('beat') && !u.searchParams.has('who')) return;
  u.searchParams.delete('beat');
  u.searchParams.delete('who');
  history.replaceState(null, '', u.pathname + u.search + u.hash);
}

export function getActiveChallenge(): FriendChallenge | null {
  return active;
}
export function getIncomingChallenge(): FriendChallenge | null {
  return incoming;
}
export function didBeatChallenge(): boolean {
  return beaten;
}

function paintBanner() {
  if (!elBanner || !elHeadline) return;
  if (!incoming) {
    elBanner.classList.add('hide');
    return;
  }
  elHeadline.textContent =
    incoming.who + ' survived ' + incoming.dist.toLocaleString() + 'm. Can you beat it?';
  elBanner.classList.remove('hide');
}

function paintChip() {
  if (!elChip || !elChipText) return;
  if (!active || G.state !== S.play) {
    elChip.classList.add('hide');
    return;
  }
  elChip.classList.remove('hide');
  if (beaten) {
    elChip.classList.add('won');
    elChipText.textContent = 'YOU BEAT ' + active.who + '!';
  } else {
    elChip.classList.remove('won');
    const left = Math.max(0, active.dist - Math.floor(G.dist));
    elChipText.textContent = left.toLocaleString() + 'm TO BEAT ' + active.who;
  }
}

function paintOverRival(ranDist: number) {
  if (!elOverRival) return;
  if (!active) {
    elOverRival.classList.add('hide');
    return;
  }
  elOverRival.classList.remove('hide');
  if (beaten || ranDist >= active.dist) {
    elOverRival.textContent = 'You beat ' + active.who + ' · send a revenge challenge';
    elOverRival.classList.add('won');
  } else {
    const short = active.dist - ranDist;
    elOverRival.textContent =
      short.toLocaleString() + 'm short of ' + active.who + ' · try again or challenge someone else';
    elOverRival.classList.remove('won');
  }
}

export function acceptIncomingChallenge() {
  if (!incoming) return;
  active = incoming;
  incoming = null;
  beaten = false;
  flashedBeat = false;
  cleanChallengeParams();
  paintBanner();
}

export function dismissIncomingChallenge() {
  incoming = null;
  cleanChallengeParams();
  paintBanner();
}

export function clearActiveChallenge() {
  active = null;
  beaten = false;
  flashedBeat = false;
  paintChip();
}

/** Call each play frame. */
export function updateFriendChallenge() {
  if (!active || G.state !== S.play) return;
  if (!beaten && Math.floor(G.dist) >= active.dist) {
    beaten = true;
    if (!flashedBeat) {
      flashedBeat = true;
      flash('YOU BEAT ' + active.who + '!', '#7ee08a');
    }
  }
  paintChip();
}

export function resetFriendChallengeRun() {
  beaten = false;
  flashedBeat = false;
  // Keep `active` across retries so revenge / rematch stays on.
  paintChip();
}

export function hideFriendChallengeChip() {
  if (elChip) elChip.classList.add('hide');
}

export async function shareFriendChallenge(dist: number): Promise<boolean> {
  const name = elName ? setPlayerName(elName.value) : getPlayerName();
  const url = buildChallengeUrl(dist, name);
  const text = name + ' survived ' + clampDist(dist).toLocaleString()
    + 'm in Sidewalk Zombies. Can you beat it?\n' + url;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Sidewalk Zombies challenge', text, url });
      return true;
    }
  } catch {
    // cancelled or unsupported
  }
  try {
    await navigator.clipboard.writeText(text);
    flash('CHALLENGE LINK COPIED', '#ffe27a');
    return true;
  } catch {
    flash('COPY FAILED — LONG-PRESS THE LINK', '#ff6b7a');
    return false;
  }
}

export function fillChallengeOver(ranDist: number) {
  paintOverRival(ranDist);
  const btn = document.getElementById('challengeFriend') as HTMLButtonElement | null;
  if (btn) {
    btn.classList.remove('hide');
    btn.textContent = beaten && active
      ? 'Revenge challenge →'
      : 'Challenge a friend →';
  }
  if (elName) elName.value = getPlayerName() === 'FRIEND' ? '' : getPlayerName();
}

export function initFriendChallenge() {
  elBanner = document.getElementById('rivalBanner');
  elHeadline = document.getElementById('rivalHeadline');
  elChip = document.getElementById('rivalChip');
  elChipText = document.getElementById('rivalChipText');
  elOverRival = document.getElementById('overRival');
  elName = document.getElementById('handleInput') as HTMLInputElement | null;

  incoming = parseChallengeFromUrl();
  paintBanner();
  if (elChip) elChip.classList.add('hide');

  document.getElementById('rivalAccept')?.addEventListener('click', () => {
    acceptIncomingChallenge();
  });
  document.getElementById('rivalSkip')?.addEventListener('click', () => {
    dismissIncomingChallenge();
  });
  document.getElementById('challengeFriend')?.addEventListener('click', () => {
    const snap = lastSharePayload()?.snap;
    const dist = snap?.dist || Math.max(MIN_DIST, Math.floor(G.dist) || active?.dist || 100);
    void shareFriendChallenge(dist);
  });
  elName?.addEventListener('change', () => setPlayerName(elName!.value));
}
