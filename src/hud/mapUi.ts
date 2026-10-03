// City map, Your Block plaza, and run-boost UI on the menu.
import { STAGES } from '../config';
import { G } from '../state';
import {
  BLOCK_ITEMS, BOOSTS, buyBlockItem, getOwnedBlock, getSelectedBoosts,
  toggleBoost, type BoostId,
} from '../systems/economy';
import {
  CHAPTER_SHORT, getBestMetres, getStars, getUnlocked, isChapterUnlocked,
} from '../systems/progress';

let selectedChapter = 1;
let elMap: HTMLElement | null = null;
let elBlock: HTMLElement | null = null;
let elBoosts: HTMLElement | null = null;

export function getSelectedChapter(): number {
  return selectedChapter;
}

export function setSelectedChapter(n: number) {
  if (!isChapterUnlocked(n)) return;
  selectedChapter = n;
  paintMap();
}

function starsHtml(n: number): string {
  return [1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');
}

export function paintMap() {
  if (!elMap) return;
  const maxU = getUnlocked();
  elMap.innerHTML = STAGES.map((st, i) => {
    const id = i + 1;
    const locked = id > maxU;
    const sel = id === selectedChapter;
    const short = CHAPTER_SHORT[i] || st.name;
    const best = getBestMetres(id);
    return `<button type="button" class="map-node${locked ? ' locked' : ''}${sel ? ' sel' : ''}"
      data-chap="${id}" ${locked ? 'disabled' : ''}>
      <span class="map-num">${id}</span>
      <span class="map-name">${short}</span>
      <span class="map-stars">${locked ? '<span class="map-lock">LOCK</span>' : starsHtml(getStars(id))}</span>
      <span class="map-best">${locked ? '—' : (best ? best + 'm' : '—')}</span>
    </button>`;
  }).join('<span class="map-rail"></span>');
}

export function paintBlock() {
  if (!elBlock) return;
  const owned = getOwnedBlock();
  const plaza = BLOCK_ITEMS.map((b) =>
    `<div class="block-prop ${b.cls}${owned.has(b.id) ? ' on' : ''}" title="${b.name}"></div>`,
  ).join('');
  const rows = BLOCK_ITEMS.map((b) => {
    const have = owned.has(b.id);
    const action = have
      ? '<span class="shop-eq">BUILT</span>'
      : G.vault >= b.price
        ? `<button type="button" class="shop-btn buy" data-block="${b.id}">${b.price}¢</button>`
        : `<span class="shop-cost">${b.price}¢</span>`;
    return `<div class="shop-row${have ? ' on' : ''}">
      <div class="shop-meta"><b>${b.name}</b><span>${b.blurb}</span></div>${action}
    </div>`;
  }).join('');
  const built = owned.size;
  elBlock.innerHTML = `
    <div class="block-plaza" aria-hidden="true">${plaza}</div>
    <p class="block-status">${built ? built + ' / ' + BLOCK_ITEMS.length + ' built' : 'Spend vault coins. Make it yours.'}</p>
    <div class="shop-list block-list">${rows}</div>`;
}

export function paintBoosts() {
  if (!elBoosts) return;
  const sel = getSelectedBoosts();
  elBoosts.innerHTML = BOOSTS.map((b) => {
    const on = sel.has(b.id);
    return `<button type="button" class="boost-chip${on ? ' on' : ''}" data-boost="${b.id}">
      <b>${b.name}</b><span>${b.price}¢ · ${b.blurb}</span>
    </button>`;
  }).join('');
}

export function paintEconomyUi() {
  paintMap();
  paintBlock();
  paintBoosts();
}

export function initMapUi() {
  elMap = document.getElementById('cityMap');
  elBlock = document.getElementById('yourBlock');
  elBoosts = document.getElementById('runBoosts');
  selectedChapter = Math.min(getUnlocked(), 1);
  // Prefer highest unlocked as a soft default so returning players see progress.
  selectedChapter = getUnlocked() >= 1 ? 1 : 1;

  elMap?.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('[data-chap]') as HTMLElement | null;
    if (!btn) return;
    setSelectedChapter(parseInt(btn.dataset.chap || '1', 10));
  });

  elBoosts?.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('[data-boost]') as HTMLElement | null;
    if (!btn) return;
    toggleBoost(btn.dataset.boost as BoostId);
    paintBoosts();
  });

  elBlock?.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('[data-block]') as HTMLElement | null;
    if (!btn) return;
    const r = buyBlockItem(btn.dataset.block!);
    if (r.ok) paintBlock();
  });

  paintEconomyUi();
}
