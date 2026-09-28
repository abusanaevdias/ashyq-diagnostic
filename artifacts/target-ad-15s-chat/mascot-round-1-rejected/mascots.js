// Three original ASHYQ mascot candidates, drawn as flat outlined SVG.
// Each takes a pose and returns SVG markup for a 400×400 viewBox, so the same
// function drives both the comparison sheet and the video frames.
//   pose = { mood: 'hmm' | 'happy' | 'wow', arm: 'down' | 'think' | 'wave' | 'up',
//            phase: 0..1 (wave swing), blink: 0..1, lookX, lookY }
(function () {
  const INK = '#161311', RED = '#de0b1b', DEEP = '#b60916', BLUSH = '#f9e0db', PAPER = '#fdfdfd', CREAM = '#f4efe6', SPOT = '#8c8b8a', DARK = '#1b1512';
  const LOGO = '../../../public/brand/logo-icon.png';
  const P = (o) => Object.assign({ mood: 'happy', arm: 'down', phase: 0, blink: 0, lookX: 0, lookY: 0 }, o || {});
  const swing = (p) => Math.sin(p.phase * Math.PI * 2);

  function eyes(p, x1, x2, y, rx, ry, pupil) {
    const s = Math.max(0.08, 1 - p.blink);
    const one = (x) => pupil
      ? `<g transform="translate(${x} ${y}) scale(1 ${s})"><ellipse rx="${rx}" ry="${ry}" fill="${PAPER}" stroke="${INK}" stroke-width="6"/><circle cx="${p.lookX}" cy="${p.lookY + 4}" r="${pupil}" fill="${INK}"/><circle cx="${p.lookX + 6}" cy="${p.lookY - 4}" r="${pupil * 0.35}" fill="${PAPER}"/></g>`
      : `<g transform="translate(${x + p.lookX} ${y + p.lookY}) scale(1 ${s})"><ellipse rx="${rx}" ry="${ry}" fill="${INK}"/><circle cx="6" cy="-8" r="${rx * 0.34}" fill="${PAPER}"/></g>`;
    return one(x1) + one(x2);
  }
  function mouth(p, x, y, w) {
    if (p.mood === 'wow') return `<ellipse cx="${x}" cy="${y + 6}" rx="${w * 0.35}" ry="${w * 0.45}" fill="${INK}"/>`;
    if (p.mood === 'hmm') return `<path d="M${x - w * 0.6} ${y + 6} q${w * 0.3} -12 ${w * 0.6} 0 t${w * 0.6} 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
    return `<path d="M${x - w} ${y} q${w} ${w * 1.25} ${w * 2} 0 z" fill="${INK}"/><path d="M${x - w * 0.45} ${y + w * 0.55} q${w * 0.45} ${w * 0.35} ${w * 0.9} 0" fill="${DEEP}"/>`;
  }
  function brows(p, x1, x2, y) {
    if (p.mood === 'happy') return '';
    if (p.mood === 'wow') return [x1, x2].map((x) => `<path d="M${x - 20} ${y} q20 -18 40 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`).join('');
    const d = 8;
    return `<path d="M${x1 - 20} ${y + d} L${x1 + 18} ${y - d}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M${x2 - 18} ${y - (p.mood === 'hmm' ? -6 : d)} L${x2 + 20} ${y + (p.mood === 'hmm' ? -8 : d)}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  }
  // rubber-hose arm: shoulder → hand, with a gentle bend
  function hose(sx, sy, hx, hy, bend, hand) {
    const mx = (sx + hx) / 2 + bend, my = (sy + hy) / 2;
    return `<path d="M${sx} ${sy} Q${mx} ${my} ${hx} ${hy}" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
      `<circle cx="${hx}" cy="${hy}" r="17" fill="${hand}" stroke="${INK}" stroke-width="6"/>`;
  }
  function hoseArms(p, L, R, hand, chin) {
    const w = swing(p);
    const left = p.arm === 'up' ? [L[0] - 50, 90] : [L[0] - 20, L[1] + 80];
    let right;
    if (p.arm === 'wave') right = [Math.min(R[0] + 45 + 18 * w, 378), 95 - 8 * Math.abs(w)];
    else if (p.arm === 'up') right = [R[0] + 50, 90];
    else if (p.arm === 'think') right = chin;
    else right = [R[0] + 20, R[1] + 80];
    return hose(L[0], L[1], left[0], left[1], p.arm === 'up' ? -30 : -25, hand) +
      hose(R[0], R[1], right[0], right[1], p.arm === 'think' ? 60 : 25, hand);
  }
  const thinkMark = (p, x, y) => (p.arm === 'think'
    ? `<text x="${x}" y="${y}" font-family="Manrope, sans-serif" font-weight="800" font-size="70" fill="${INK}" transform="rotate(12 ${x} ${y})">?</text>` : '');

  // 1 · «Точка» — the red «точка А» itself, in a graduation cap
  function dot(o) {
    const p = P(o);
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <path d="M172 318 q-4 34 -16 48 M228 318 q4 34 16 48" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="150" cy="370" rx="24" ry="11" fill="${INK}"/><ellipse cx="250" cy="370" rx="24" ry="11" fill="${INK}"/>
      ${hoseArms(p, [88, 220], [312, 220], PAPER, [262, 268])}
      <circle cx="200" cy="210" r="120" fill="${DEEP}" stroke="${INK}" stroke-width="6"/>
      <circle cx="190" cy="198" r="108" fill="${RED}"/>
      <ellipse cx="140" cy="140" rx="28" ry="13" fill="#fff" opacity="0.35" transform="rotate(-35 140 140)"/>
      <ellipse cx="128" cy="252" rx="22" ry="12" fill="${BLUSH}" opacity="0.55"/><ellipse cx="272" cy="252" rx="22" ry="12" fill="${BLUSH}" opacity="0.55"/>
      ${eyes(p, 160, 240, 200, 30, 36, 16)}
      ${brows(p, 160, 240, 150)}
      ${mouth(p, 200, 252, 26)}
      <path d="M148 100 v26 q52 24 104 0 v-26" fill="${INK}"/>
      <polygon points="112,98 200,64 288,98 200,132" fill="${INK}"/>
      <path d="M200 98 L270 116 L270 152" fill="none" stroke="${BLUSH}" stroke-width="6" stroke-linecap="round"/><circle cx="270" cy="158" r="9" fill="${BLUSH}"/>
      ${thinkMark(p, 318, 120)}
    </svg>`;
  }

  // 2 · «Барыс» — a snow-leopard cub (Kazakhstan's own symbol) in an ASHYQ hoodie
  function rosette(x, y, s) {
    return [[-7, -6], [7, -7], [9, 6], [-8, 7]].map(([dx, dy]) => `<ellipse cx="${x + dx * s}" cy="${y + dy * s}" rx="${4.5 * s}" ry="${3.5 * s}" fill="${SPOT}"/>`).join('');
  }
  function leopard(o) {
    const p = P(o);
    const w = swing(p);
    let arm = '';
    const paw = (x, y) => `<circle cx="${x}" cy="${y}" r="24" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><path d="M${x - 8} ${y - 6} v8 M${x} ${y - 9} v8 M${x + 8} ${y - 6} v8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    const sleeve = (sx, sy, hx, hy) => `<path d="M${sx} ${sy} L${hx} ${hy}" stroke="${INK}" stroke-width="54" stroke-linecap="round"/><path d="M${sx} ${sy} L${hx} ${hy}" stroke="${DARK}" stroke-width="42" stroke-linecap="round"/>`;
    if (p.arm === 'wave') arm = sleeve(262, 312, 322 + 14 * w, 222) + paw(322 + 14 * w, 208);
    else if (p.arm === 'up') arm = sleeve(138, 312, 88, 222) + paw(88, 208) + sleeve(262, 312, 312, 222) + paw(312, 208);
    else if (p.arm === 'think') arm = sleeve(262, 318, 246, 262) + paw(240, 250);
    const restPaws = p.arm === 'down' ? paw(140, 360) + paw(260, 360) : p.arm === 'wave' || p.arm === 'think' ? paw(140, 360) : '';
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <path d="M270 372 C350 376 372 300 336 262" fill="none" stroke="${INK}" stroke-width="42" stroke-linecap="round"/>
      <path d="M270 372 C350 376 372 300 336 262" fill="none" stroke="${CREAM}" stroke-width="30" stroke-linecap="round"/>
      <path d="M270 372 C350 376 372 300 336 262" fill="none" stroke="${SPOT}" stroke-width="30" stroke-dasharray="10 26"/>
      <path d="M118 400 L130 305 Q200 262 270 305 L282 400 Z" fill="${DARK}" stroke="${INK}" stroke-width="6"/>
      <path d="M182 300 v34 M218 300 v34" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"/>
      <clipPath id="lp"><rect x="226" y="338" width="38" height="38" rx="9"/></clipPath>
      <image href="${LOGO}" x="214" y="326" width="62" height="62" clip-path="url(#lp)"/>
      <circle cx="126" cy="92" r="36" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><circle cx="126" cy="92" r="18" fill="${BLUSH}"/>
      <circle cx="274" cy="92" r="36" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><circle cx="274" cy="92" r="18" fill="${BLUSH}"/>
      <ellipse cx="200" cy="178" rx="122" ry="106" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>
      ${rosette(118, 150, 1.2)}${rosette(282, 146, 1.2)}${rosette(200, 102, 1)}${rosette(150, 104, 0.9)}${rosette(250, 106, 0.9)}${rosette(104, 205, 0.8)}${rosette(296, 202, 0.8)}
      ${eyes(p, 158, 242, 170, 21, 26, 0)}
      ${brows(p, 158, 242, 128)}
      <ellipse cx="180" cy="222" rx="30" ry="22" fill="${PAPER}"/><ellipse cx="220" cy="222" rx="30" ry="22" fill="${PAPER}"/>
      <path d="M186 204 h28 l-14 14 z" fill="${DEEP}" stroke="${DEEP}" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="128" cy="222" rx="18" ry="10" fill="${BLUSH}"/><ellipse cx="272" cy="222" rx="18" ry="10" fill="${BLUSH}"/>
      <path d="M150 218 h-44 M150 230 l-40 10 M250 218 h44 M250 230 l40 10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      ${p.mood === 'happy' ? `<path d="M186 236 q14 22 28 0 z" fill="${INK}"/>` : p.mood === 'wow' ? `<ellipse cx="200" cy="244" rx="10" ry="13" fill="${INK}"/>` : `<path d="M186 242 q7 -6 14 0 t14 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`}
      ${arm}${restPaws}
      ${thinkMark(p, 312, 120)}
    </svg>`;
  }

  // 3 · «Хабар» — a chat bubble that is itself the message; unread badge on its head
  function bubble(o) {
    const p = P(o);
    const dots = p.arm === 'think'
      ? [0, 1, 2].map((i) => `<circle cx="${170 + i * 30}" cy="${36 - 8 * Math.max(0, Math.sin(p.phase * Math.PI * 4 - i))}" r="10" fill="${SPOT}"/>`).join('') : '';
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="378" rx="90" ry="12" fill="${INK}" opacity="0.1"/>
      ${hoseArms(p, [74, 200], [326, 200], PAPER, [250, 262])}
      <path d="M142 72 H258 A72 72 0 0 1 330 144 V222 A72 72 0 0 1 258 294 H182 L104 352 L122 294 H142 A72 72 0 0 1 70 222 V144 A72 72 0 0 1 142 72 Z" fill="${PAPER}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <ellipse cx="130" cy="232" rx="20" ry="11" fill="${BLUSH}"/><ellipse cx="270" cy="232" rx="20" ry="11" fill="${BLUSH}"/>
      ${eyes(p, 160, 240, 180, 20, 27, 0)}
      ${brows(p, 160, 240, 136)}
      ${mouth(p, 200, 228, 24)}
      <circle cx="318" cy="84" r="32" fill="${RED}" stroke="${INK}" stroke-width="6"/>
      <text x="318" y="100" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="44" fill="#fff">1</text>
      ${dots}
    </svg>`;
  }

  window.MASCOTS = { dot, leopard, bubble };
})();
