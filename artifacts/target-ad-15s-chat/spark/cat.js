// Cat explorations in the «Искра» family (same red, white eyes, monoline limbs).
// cat(variant, pose) → SVG markup for a 400×400 viewBox.
//   variant: 'sparkcat' (spark turned 45°: upper rays are ears)
//            'kitty'    (full-body cat, spark-shaped ears, spark on the tail)
//            'eared'    (the approved spark A with cat ears, whiskers and a tail)
(function () {
  const { starPath, limbs, trail, C } = window.SPARK;
  const INK = '#161311', RED = '#de0b1b', PAPER = '#fdfdfd';
  const P = (o) => Object.assign({ name: 'stand', phase: 0, blink: 0, lookX: 0, lookY: 0, mood: null, turn: 1 }, o || {});

  // a small upright spark, used as a tail tip and a forehead mark
  function miniSpark(x, y, r, fill) {
    const k = r * 0.2;
    return `<path d="M${x} ${y - r} C${x + k} ${y - k} ${x + k} ${y - k} ${x + r} ${y} C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + r} C${x - k} ${y + k} ${x - k} ${y + k} ${x - r} ${y} C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - r} Z" fill="${fill}"/>`;
  }
  function catFace(p, cx, cy, sc) {
    const s = Math.max(0.08, 1 - p.blink);
    const st = `fill="none" stroke="${INK}" stroke-width="${6 * sc}" stroke-linecap="round" stroke-linejoin="round"`;
    const ex = 27 * sc;
    let eyes;
    if (p.name === 'cheer' && p.mood !== 'wow') {
      eyes = [-ex, ex].map((dx) => `<path d="M${cx + dx - 14 * sc} ${cy} q${14 * sc} ${-18 * sc} ${28 * sc} 0" ${st} stroke-width="${8 * sc}"/>`).join('');
    } else {
      const lx = (p.name === 'think' ? -5 : p.lookX) * sc, ly = (p.name === 'think' ? -8 : p.lookY) * sc;
      eyes = [-ex, ex].map((dx) => `<g transform="translate(${cx + dx} ${cy - 4 * sc}) scale(1 ${s})"><ellipse rx="${18 * sc}" ry="${23 * sc}" fill="${PAPER}"/><ellipse cx="${lx}" cy="${ly + 3 * sc}" rx="${8 * sc}" ry="${12 * sc}" fill="${INK}"/></g>`).join('');
    }
    const ny = cy + 24 * sc;
    const nose = `<path d="M${cx - 7 * sc} ${ny} h${14 * sc} l${-7 * sc} ${8 * sc} z" fill="${INK}" stroke="${INK}" stroke-width="${3 * sc}" stroke-linejoin="round"/>`;
    const mouth = p.mood === 'wow'
      ? `<ellipse cx="${cx}" cy="${ny + 20 * sc}" rx="${8 * sc}" ry="${10 * sc}" fill="${INK}"/>`
      : p.name === 'think'
        ? `<path d="M${cx - 9 * sc} ${ny + 16 * sc} h${18 * sc}" ${st}/>`
        : `<path d="M${cx - 14 * sc} ${ny + 10 * sc} q${7 * sc} ${9 * sc} ${14 * sc} 0 q${7 * sc} ${9 * sc} ${14 * sc} 0" ${st}/>`;
    return eyes + nose + mouth;
  }
  function whiskers(cx, cy, spread, sc) {
    const st = `stroke="${INK}" stroke-width="${5 * sc}" stroke-linecap="round"`;
    return [-1, 1].map((d) => `<path d="M${cx + d * spread} ${cy} l${d * 34 * sc} ${-6 * sc} M${cx + d * spread} ${cy + 14 * sc} l${d * 36 * sc} ${4 * sc}" ${st}/>`).join('');
  }
  function tail(x, y, dir, phase, rise = 110) {
    const w = Math.sin(phase * Math.PI * 2) * 12;
    const ex = x + dir * 70, ey = y - rise + w;
    return `<path d="M${x} ${y} C${x + dir * 90} ${y + 10} ${x + dir * 100} ${y - 60} ${ex} ${ey}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` + miniSpark(ex, ey - 12, 24, RED);
  }

  // 1 · spark turned 45°: the top and left rays become ears, the others cheeks.
  //     pose.turn 0 → plain logo spark, 1 → cat; tweening it is the transformation.
  const SPARKCAT = { t: 150, r: 78, b: 78, l: 150, k: 66, along: 0.12 };
  function sparkcat(p) {
    const rot = 45 * p.turn;
    const b = {
      t: 138 + (SPARKCAT.t - 138) * p.turn, r: 158 + (SPARKCAT.r - 158) * p.turn,
      b: 108 + (SPARKCAT.b - 108) * p.turn, l: 118 + (SPARKCAT.l - 118) * p.turn, k: 44 + 6 * p.turn, along: 0.22 - 0.02 * p.turn,
    };
    const face = p.turn > 0.5
      ? `<g opacity="${Math.min(1, (p.turn - 0.5) * 4)}">${whiskers(C.x, C.y + 22, 58, 1)}${catFace(p, C.x, C.y + 4, 1)}</g>`
      : '';
    const flying = p.name === 'fly';
    return (flying ? trail(SPARKCAT, RED) : '') + limbs(p, INK, 9) + (p.turn > 0.5 && !flying ? tail(C.x + 56, C.y + 86, 1, p.phase, 60) : '') +
      `<path d="${starPath(b)}" transform="rotate(${rot} ${C.x} ${C.y})" fill="${RED}" stroke="${RED}" stroke-width="10" stroke-linejoin="round"/>` + face;
  }

  // 2 · full-body cat: concave spark-like ears, spark on the forehead and tail
  function kitty(p) {
    const head = 'M112 152 C112 110 124 88 138 78 L124 18 C150 40 166 56 174 66 C191 61 209 61 226 66 C234 56 250 40 276 18 L262 78 C276 88 288 110 288 152 C288 206 250 234 200 234 C150 234 112 206 112 152 Z';
    const torso = 'M152 226 C142 262 138 300 144 334 L256 334 C262 300 258 262 248 226 Z';
    const line = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    const fist = (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="${INK}"/>`;
    const sw = Math.sin(p.phase * Math.PI * 2);
    const legs = line('M176 332 L170 366 h-24') + line('M224 332 L230 366 h24');
    let arms;
    if (p.name === 'wave') arms = line('M152 250 Q120 290 122 318') + fist(122, 318) + line(`M248 250 Q300 230 ${316 + sw * 10} ${170}`) + fist(316 + sw * 10, 170);
    else if (p.name === 'cheer') arms = line('M152 250 Q104 220 96 160') + fist(96, 160) + line('M248 250 Q296 220 304 160') + fist(304, 160);
    else if (p.name === 'think') arms = line('M248 252 Q290 290 236 214') + fist(236, 214) + line('M152 252 Q170 300 230 282');
    else arms = line('M152 250 Q108 280 150 300') + fist(150, 300) + line('M248 250 Q292 280 250 300') + fist(250, 300);
    return tail(146, 322, -1, p.phase, 70) + legs +
      `<path d="${torso}" fill="${RED}"/>` + arms +
      `<path d="${head}" fill="${RED}" stroke="${RED}" stroke-width="6" stroke-linejoin="round"/>` +
      miniSpark(200, 96, 14, PAPER) + whiskers(200, 188, 84, 1) + catFace(p, 200, 160, 1);
  }

  // 3 · the approved spark A with cat ears, whiskers and a tail
  function eared(p) {
    const b = Object.assign({}, window.SPARK.BODIES.logo, { t: 70, k: 52 });
    const ear = (x, dir) => `<path d="M${x - dir * 40} ${C.y - 30} L${x + dir * 6} ${C.y - 118} L${x + dir * 40} ${C.y - 22} Z" fill="${RED}" stroke="${RED}" stroke-width="12" stroke-linejoin="round"/>`;
    const flying = p.name === 'fly';
    return (flying ? trail(b, RED) : '') + limbs(p, INK, 9) + (!flying ? tail(C.x + 40, C.y + 70, 1, p.phase, 60) : '') +
      ear(C.x - 48, -1) + ear(C.x + 48, 1) +
      `<path d="${starPath(b)}" fill="${RED}" stroke="${RED}" stroke-width="10" stroke-linejoin="round"/>` +
      whiskers(C.x, C.y + 20, 46, 1) + catFace(p, C.x, C.y, 0.92);
  }

  function cat(variant, pose) {
    const p = P(pose);
    const inner = variant === 'kitty' ? kitty(p) : variant === 'eared' ? eared(p) : sparkcat(p);
    const tilt = p.name === 'think' ? -5 : p.name === 'fly' ? -14 : 0;
    const lift = p.name === 'cheer' ? -14 : 0;
    return `<svg viewBox="0 0 400 400" overflow="visible" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 ${lift}) rotate(${tilt} 200 256)">${inner}</g></svg>`;
  }
  window.CAT = { cat };
})();
