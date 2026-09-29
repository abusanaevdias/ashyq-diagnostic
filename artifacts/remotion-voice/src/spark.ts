// «Искра» (variant A) as an ES module for Remotion. Port of
// artifacts/target-ad-15s-chat/spark/spark.js (logo body only) plus an
// optional headphones prop for the Listening videos. Returns SVG markup for a
// 400×400 viewBox.
export type SparkPose = {
  name?: 'stand' | 'wave' | 'cheer' | 'think' | 'run' | 'fly';
  phase?: number;
  blink?: number;
  lookX?: number;
  lookY?: number;
  mood?: 'wow' | null;
  squash?: number;
  headphones?: boolean;
  limb?: string;
};

const INK = '#161311';
const RED = '#de0b1b';
const PAPER = '#fdfdfd';
const C = {x: 200, y: 196};
const B = {t: 138, r: 158, b: 108, l: 118, k: 44, along: 0.22, round: 10};

function starPath(): string {
  const rays: [number, number, number][] = [[0, -1, B.t], [1, 0, B.r], [0, 1, B.b], [-1, 0, B.l]];
  const tip = ([x, y, len]: [number, number, number]) => [C.x + x * len, C.y + y * len];
  let d = `M${tip(rays[0]).join(' ')}`;
  for (let i = 0; i < 4; i++) {
    const a = rays[i];
    const b = rays[(i + 1) % 4];
    const c1 = [C.x + a[0] * a[2] * B.along + b[0] * B.k, C.y + a[1] * a[2] * B.along + b[1] * B.k];
    const c2 = [C.x + b[0] * b[2] * B.along + a[0] * B.k, C.y + b[1] * b[2] * B.along + a[1] * B.k];
    d += ` C${c1.join(' ')} ${c2.join(' ')} ${tip(b).join(' ')}`;
  }
  return `${d} Z`;
}
const BODY = starPath();

const trail = () => {
  const x = C.x - B.l + 10;
  const y = C.y;
  return `<path d="M${x} ${y - 6} Q${x - 70} ${y - 26} ${x - 200} ${y - 4} Q${x - 70} ${y - 8} ${x} ${y + 8} Z" fill="${RED}"/>` +
    `<path d="M${x + 6} ${y + 14} Q${x - 50} ${y + 6} ${x - 150} ${y + 30} Q${x - 50} ${y + 20} ${x + 6} ${y + 26} Z" fill="${RED}" opacity="0.75"/>`;
};

type Pt = [number, number];
const line = (s: Pt, m: Pt, e: Pt, col: string) =>
  `<path d="M${s[0]} ${s[1]} Q${m[0]} ${m[1]} ${e[0]} ${e[1]}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
const fist = (x: number, y: number, col: string) => `<circle cx="${x}" cy="${y}" r="10" fill="${col}"/>`;
const foot = (x: number, y: number, dir: number, col: string) =>
  `<path d="M${x} ${y} h${dir * 24}" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
const openHand = (x: number, y: number, a: number, col: string) =>
  `<circle cx="${x}" cy="${y}" r="9" fill="${col}"/>` +
  [-0.9, -0.3, 0.3, 0.9].map((o) => {
    const ang = a + o * 0.5;
    return `<path d="M${x} ${y} l${Math.sin(ang) * 16} ${-Math.cos(ang) * 16}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`;
  }).join('');

function limbs(p: Required<SparkPose>): string {
  const col = p.limb;
  const sL: Pt = [C.x - 58, C.y + 14];
  const sR: Pt = [C.x + 58, C.y + 14];
  const hL: Pt = [C.x - 30, C.y + 52];
  const hR: Pt = [C.x + 30, C.y + 52];
  const legs = line(hL, [C.x - 40, 320], [C.x - 46, 362], col) + foot(C.x - 46, 362, -1, col) +
    line(hR, [C.x + 40, 320], [C.x + 46, 362], col) + foot(C.x + 46, 362, 1, col);
  const sw = Math.sin(p.phase * Math.PI * 2);
  switch (p.name) {
    case 'wave': {
      const hx = C.x + 128 + sw * 10;
      const hy = C.y - 88;
      return legs + line(sL, [C.x - 100, C.y + 60], [C.x - 96, C.y + 110], col) + fist(C.x - 96, C.y + 110, col) +
        line(sR, [C.x + 130, C.y + 10], [hx, hy], col) + openHand(hx, hy, 0.25 + sw * 0.3, col);
    }
    case 'cheer':
      return line(hL, [C.x - 58, 318], [C.x - 44, 346], col) + foot(C.x - 44, 346, -1, col) +
        line(hR, [C.x + 58, 318], [C.x + 44, 346], col) + foot(C.x + 44, 346, 1, col) +
        line(sL, [C.x - 118, C.y - 10], [C.x - 112, C.y - 104], col) + fist(C.x - 112, C.y - 104, col) +
        line(sR, [C.x + 118, C.y - 10], [C.x + 112, C.y - 104], col) + fist(C.x + 112, C.y - 104, col);
    case 'think':
      return legs + line(sR, [C.x + 90, C.y + 90], [C.x + 30, C.y + 56], col) + fist(C.x + 30, C.y + 56, col) +
        line(sL, [C.x - 70, C.y + 80], [C.x + 26, C.y + 76], col);
    case 'fly':
      return line(sR, [C.x + 110, C.y - 10], [C.x + 150, C.y - 40], col) + fist(C.x + 150, C.y - 40, col) +
        line(sL, [C.x - 70, C.y + 60], [C.x - 110, C.y + 70], col) + fist(C.x - 110, C.y + 70, col) +
        line(hL, [C.x - 70, C.y + 90], [C.x - 120, C.y + 100], col) + line(hR, [C.x - 20, C.y + 100], [C.x - 70, C.y + 120], col);
    default:
      return legs + line(sL, [C.x - 118, C.y + 40], [C.x - 60, C.y + 62], col) + fist(C.x - 60, C.y + 62, col) +
        line(sR, [C.x + 118, C.y + 40], [C.x + 60, C.y + 62], col) + fist(C.x + 60, C.y + 62, col);
  }
}

function face(p: Required<SparkPose>): string {
  const s = Math.max(0.08, 1 - p.blink);
  if (p.name === 'cheer' && p.mood !== 'wow') {
    return [-26, 26].map((dx) => `<path d="M${C.x + dx - 14} ${C.y - 2} q14 -18 28 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`).join('') +
      `<path d="M${C.x - 16} ${C.y + 18} q16 22 32 0 z" fill="${INK}"/>`;
  }
  const lx = p.lookX;
  const ly = p.lookY;
  const eyes = [-26, 26].map((dx) =>
    `<g transform="translate(${C.x + dx} ${C.y - 6}) scale(1 ${s})"><ellipse rx="17" ry="22" fill="${PAPER}"/><ellipse cx="${lx}" cy="${ly + 3}" rx="8" ry="11" fill="${INK}"/></g>`).join('');
  const mouth = p.mood === 'wow'
    ? `<ellipse cx="${C.x}" cy="${C.y + 28}" rx="9" ry="12" fill="${INK}"/>`
    : p.name === 'think'
      ? `<path d="M${C.x - 8} ${C.y + 26} h16" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
      : `<path d="M${C.x - 10} ${C.y + 24} q10 10 20 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  return eyes + mouth;
}

// headphones: a band over the top ray and two cups beside the eyes
const headphones = () =>
  `<path d="M118 196 C118 70 282 70 282 196" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>` +
  `<rect x="100" y="166" width="34" height="62" rx="15" fill="${INK}"/><rect x="266" y="166" width="34" height="62" rx="15" fill="${INK}"/>`;

export function sparkSvg(pose: SparkPose = {}): string {
  const p: Required<SparkPose> = {
    name: 'stand', phase: 0, blink: 0, lookX: 0, lookY: 0, mood: null, squash: 1, headphones: false, limb: INK, ...pose,
  };
  const tilt = p.name === 'run' ? 10 : p.name === 'fly' ? -14 : p.name === 'think' ? -6 : 0;
  const lift = p.name === 'cheer' ? -16 : 0;
  const inner = (p.name === 'fly' ? trail() : '') + limbs(p) +
    `<path d="${BODY}" fill="${RED}" stroke="${RED}" stroke-width="${B.round}" stroke-linejoin="round"/>` + face(p) +
    (p.headphones ? headphones() : '');
  const sq = `translate(${C.x} 362) scale(${1 / Math.sqrt(p.squash)} ${p.squash}) translate(${-C.x} -362)`;
  return `<svg viewBox="0 0 400 400" overflow="visible" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><g transform="${sq} translate(0 ${lift}) rotate(${tilt} ${C.x} ${C.y + 60})">${inner}</g></svg>`;
}
