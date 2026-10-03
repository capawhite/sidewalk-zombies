// Stage 6: game-over story — run titles from stats + a bigger death-message library.
import { G } from '../state';

export interface RunSnapshot {
  dist: number;
  chaos: number;
  total: number;
  bonks: number;
  bestCombo: number;
  nearMisses: number;
  chains: number;
  coins: number;
  level: number;
  cause: string;
  newBest: boolean;
  newComboPb: boolean;
  newDistPb: boolean;
}

interface TitleRule {
  title: string;
  sub: string;
  test: (s: RunSnapshot) => boolean;
}

/** First matching rule wins — order is intentional (wildest → calmest → default). */
const TITLE_RULES: TitleRule[] = [
  {
    title: 'GATE AGENT APPROVED',
    sub: 'You cleared the city. The phones did not.',
    test: (s) => s.cause === 'escaped',
  },
  {
    title: 'SOCIETY HAS FAILED',
    sub: 'The sidewalk filed a restraining order',
    test: (s) => s.bonks >= 40 || s.bestCombo >= 14 || s.chaos >= 1200,
  },
  {
    title: 'PUBLIC MENACE',
    sub: 'Local news would like a word',
    test: (s) => s.bonks >= 22 || s.bestCombo >= 10 || s.chaos >= 700,
  },
  {
    title: 'CHAIN REACTIONARY',
    sub: 'One shove. Several regrets. Theirs.',
    test: (s) => s.chains >= 5,
  },
  {
    title: 'NEEDLE THREADER',
    sub: 'Personal space: optional, apparently',
    test: (s) => s.nearMisses >= 14,
  },
  {
    title: 'CRITIC OF MODERN CULTURE',
    sub: 'Reviewed the crowd. Stars withheld.',
    test: (s) => s.nearMisses >= 8 && s.bonks <= 10,
  },
  {
    title: 'HUMAN LAMP POST',
    sub: 'Decorative. Stationary. Bonked zero souls.',
    test: (s) => s.bonks === 0 && s.dist >= 250,
  },
  {
    title: 'COIN HOG',
    sub: 'Fiscal policy: snatch and weave',
    test: (s) => s.coins >= 35,
  },
  {
    title: 'FED UP',
    sub: 'Composure expired. Receipts available.',
    test: (s) => s.bonks >= 10 || s.bestCombo >= 6,
  },
  {
    title: 'CIVILIZED HUMAN',
    sub: 'Mostly polite. Briefly horizontal.',
    test: (s) => s.bonks <= 4 && s.dist >= 200,
  },
  {
    title: 'AISLE TOURIST',
    sub: 'Saw the cereal. Became the cereal.',
    test: (s) => s.level <= 1 && s.dist < 200,
  },
  {
    title: 'SIDEWALK STATISTIC',
    sub: 'Another satisfied customer of gravity',
    test: () => true,
  },
];

const DEATH: Record<string, string[]> = {
  selfie: [
    'You photobombed the wrong shoot. They kept rolling.',
    'Selfie stick: 1. You: a pile.',
    'Congrats — you\'re the crash in someone\'s story.',
    'Someone checking Instagram discovered you. Permanently.',
    'They needed a subject. You volunteered with your face.',
    'Ring light in your eyes. Floor in your future.',
    'Posted. Geotagged. Humiliating.',
  ],
  text: [
    'A texter used you as a bumper. Still typing.',
    'They never looked up. You did. That\'s the joke.',
    'Head down, thumbs up, you down.',
    'Autocorrect couldn\'t save you. Neither could weaving.',
    'Blue bubbles. Red composure. Blackout.',
    'They finished the sentence. You finished the fall.',
    'Unread messages: 0. Unread sidewalk: you.',
  ],
  talk: [
    'A caller took a left through your personal space. Then your face.',
    'They said "can you hear me now?" Loud and clear. With your nose.',
    'Hands-free walking. You were the free part.',
    'Speakerphone etiquette: nonexistent. Your chill: also.',
    'Hold music would\'ve been kinder.',
    'They hung up. You hung in the air. Briefly.',
  ],
  inf: [
    'Ring light, tripod, you. Only one of those wanted to be on the floor.',
    'She filmed the wipeout. It already has a sound on it.',
    'Influencer: 1. Sidewalk: you.',
    'Her followers saw the whole thing.',
    'You became part of someone\'s livestream.',
    'Brand deal pending: gravity.',
    'They asked for engagement. You delivered impact.',
  ],
  nav: [
    'Google Maps said turn left. Unfortunately, you were left.',
    'Recalculating… into your face.',
    'They found a shortcut. Through you.',
    'Arrival time: delayed. Your posture: also.',
    'Blue line. Red flags. Yellow bruise.',
    'Rerouting around the obstacle. The obstacle was their awareness.',
  ],
  photo: [
    'They were walking backward for the shot. You were the background.',
    'Smile! Oh wait — too late.',
    'Perfect framing. You, the floor, and their lens.',
    'Manual focus. Automatic collision.',
    'They got the shot. You got the plot twist.',
    'ISO was fine. IQ was not.',
  ],
  couple: [
    'Two people, one lane, zero awareness. Bad odds.',
    'They were holding hands. You were holding your composure. Briefly.',
    'Couples that block together, bonk together.',
    'Date night special: complimentary wipeout.',
    'PDA: public display of aisle-hogging.',
    'Love is blind. So was their trajectory.',
  ],
  scooter: [
    'Silent scooter. Loud impact.',
    'They hit 12 km/h of oblivion. You hit the floor.',
    'No bell. No brakes. No chill left.',
    'Micromobility. Macro embarrassment.',
    'E-scooter energy. F-tier awareness.',
    'Whir. Thud. Review: would not ride again.',
  ],
  delivery: [
    'Hot bag. Cold awareness. You were the drop-off.',
    'They were going the wrong way. So was your day.',
    'App said "delivered." Reality said "collision."',
    'Five-star rating for speed. Zero for looking up.',
    'Reverse gear. Forward chaos.',
    'Tip: none. Tip into you: absolute.',
  ],
  tour: [
    'Follow the umbrella. Or don\'t. Either way: splat.',
    'Group rate included complimentary wipeout.',
    'They moved as one. You moved as the floor.',
    'Photo stop was optional. Hitting you was not.',
    'Flag in the air. Composure in the dirt.',
    'Guided tour of your personal space.',
  ],
  dog: [
    'The leash was short. Their attention was shorter.',
    'Pup wanted a sniff. You became the hydrant.',
    'Who walks who? Today: the leash decided.',
    'Good boy. Bad spatial awareness.',
    'Zigzag walk. Straight into you.',
    'They stopped for the dog. Physics didn\'t.',
  ],
  mall: [
    'You were the obstacle in someone\'s mall-map walking tour.',
    'Food-court GPS said "you have arrived." You had.',
    'Sale ends today. So did your composure.',
  ],
  escaped: [
    'Boarding group: anyone who still has composure.',
    'You made the gate. The phones made the problem.',
    'City cleared. Sidewalk: undefeated elsewhere.',
    'Passport: ready. Patience: expired at the cereal aisle.',
    'You walked out. They never looked up to wave goodbye.',
  ],
};

const FALLBACK = DEATH.talk;

export function classifyRun(s: RunSnapshot): { title: string; sub: string } {
  for (const rule of TITLE_RULES) {
    if (rule.test(s)) return { title: rule.title, sub: rule.sub };
  }
  return { title: 'SIDEWALK STATISTIC', sub: 'Another satisfied customer of gravity' };
}

export function deathMessage(cause: string, pick: number): string {
  const pool = DEATH[cause] || FALLBACK;
  return pool[Math.abs(pick | 0) % pool.length];
}

export function snapshotRun(cause: string, prevBest: number, prevComboPb: number, prevDistPb: number): RunSnapshot {
  const dist = Math.floor(G.dist);
  const chaos = G.scoreAcc;
  const total = dist + chaos;
  return {
    dist,
    chaos,
    total,
    bonks: G.bonks,
    bestCombo: G.bestCombo,
    nearMisses: G.nearMisses,
    chains: G.chainReactions,
    coins: G.coins,
    level: G.level,
    cause,
    newBest: total > prevBest,
    newComboPb: G.bestCombo > prevComboPb,
    newDistPb: dist > prevDistPb,
  };
}

/** Paint the #over card from a snapshot. `rng` supplies one float for death-line pick. */
export function fillGameOver(s: RunSnapshot, rng: () => number): SharePayload {
  const cls = classifyRun(s);
  const msg = deathMessage(s.cause, (rng() * 1000) | 0);

  const elTitle = document.getElementById('overTitle')!;
  const elVerdict = document.getElementById('verdict')!;
  const elMsg = document.getElementById('overMsg')!;
  const elClass = document.getElementById('overClass')!;

  elTitle.textContent = cls.title;
  elClass.textContent = cls.sub;
  elMsg.textContent = msg;
  elVerdict.textContent = s.cause === 'escaped'
    ? '★ CITY CLEARED ★'
    : s.newBest ? '★ NEW BEST ★' : 'RUN REPORT';

  const set = (id: string, v: string | number, pb = false) => {
    const node = document.getElementById(id)!;
    node.textContent = String(v);
    node.classList.toggle('pb', pb);
  };
  set('fDist', s.dist, s.newDistPb);
  set('fChaos', s.chaos);
  set('fScore', s.total, s.newBest);
  set('fBest', G.best, s.newBest);
  set('fCombo', s.bestCombo, s.newComboPb);
  set('fComboBest', G.bestComboEver, s.newComboPb);
  set('fNear', s.nearMisses);
  set('fChains', s.chains);
  set('fBonks', s.bonks);
  set('fCoins', s.coins);

  const tip = document.getElementById('overTip');
  if (tip) tip.textContent = 'Can you beat ' + s.dist.toLocaleString() + 'm?';

  const payload: SharePayload = { snap: s, title: cls.title, sub: cls.sub, death: msg };
  lastShare = payload;
  return payload;
}

export interface SharePayload {
  snap: RunSnapshot;
  title: string;
  sub: string;
  death: string;
}

let lastShare: SharePayload | null = null;
export function lastSharePayload(): SharePayload | null {
  return lastShare;
}
