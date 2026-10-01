// Stage 5 locker UI — browse / buy / equip cosmetics from the menu.
import { G } from '../state';
import {
  COSMETICS, buyCosmetic, equipCosmetic, getEquip, getOwned, itemById,
  syncVaultDom, type CosmoKind,
} from '../systems/cosmetics';

let tab: CosmoKind = 'look';
let elList: HTMLElement | null = null;

function rowHtml(id: string): string {
  const item = itemById(id)!;
  const own = getOwned().has(id);
  const eq = getEquip();
  const equipped = (item.kind === 'look' && eq.look === id)
    || (item.kind === 'bonk' && eq.bonk === id)
    || (item.kind === 'horn' && eq.horn === id);
  let action: string;
  if (equipped) action = '<span class="shop-eq">EQUIPPED</span>';
  else if (own) action = `<button type="button" class="shop-btn" data-eq="${id}">Equip</button>`;
  else if (G.vault >= item.price) action = `<button type="button" class="shop-btn buy" data-buy="${id}">${item.price}¢</button>`;
  else action = `<span class="shop-cost">${item.price}¢</span>`;
  return `<div class="shop-row${equipped ? ' on' : ''}" data-id="${id}">
    <div class="shop-meta"><b>${item.name}</b><span>${item.blurb}</span></div>
    ${action}
  </div>`;
}

export function renderShop() {
  if (!elList) return;
  syncVaultDom();
  const items = COSMETICS.filter((c) => c.kind === tab);
  elList.innerHTML = items.map((c) => rowHtml(c.id)).join('');
}

export function initShop() {
  elList = document.getElementById('shopList');
  const root = document.getElementById('shop');
  if (!root || !elList) return;
  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tab = (btn as HTMLElement).dataset.tab as CosmoKind;
      root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b === btn));
      renderShop();
    });
  });
  elList.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const buy = t.closest('[data-buy]') as HTMLElement | null;
    const eq = t.closest('[data-eq]') as HTMLElement | null;
    if (buy) {
      const r = buyCosmetic(buy.dataset.buy!);
      if (r.ok) {
        equipCosmetic(buy.dataset.buy!);
        renderShop();
      }
    } else if (eq) {
      equipCosmetic(eq.dataset.eq!);
      renderShop();
    }
  });
  renderShop();
}
