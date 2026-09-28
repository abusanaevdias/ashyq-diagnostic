// «Искра» — ASHYQ mascot built from the four-point spark in the logo.
// spark(variant, pose) returns SVG markup for a 400×400 viewBox; the same
// function drives the exploration sheets and, later, the video frames.
//   variant: 'logo' | 'chubby' | 'sticker'
//   pose: { name: 'stand'|'wave'|'cheer'|'think'|'run'|'peace'|'fly', phase, blink, lookX, lookY }
(function () {
  const INK = '#161311', RED = '#de0b1b', DEEP = '#b60916', PAPER = '#fdfdfd';
  const C = { x: 200, y: 196 };

  const BODIES = {
    // logo proportions: tall vertical rays, long right ray, shorter left ray
    logo: { t: 138, r: 158, b: 108, l: 118, k: 44, along: 0.22, round: 10 },
    // softer, rounder core with short rays: more room for a face
    chubby: { t: 126, r: 132, b: 100, l: 132, k: 66, along: 0.02, round: 22 },
    // outlined sticker version
    sticker: { t: 126, r: 134, b: 96, l: 126, k: 56, along: 0.16, round: 10 },
  };

  // concave four-point spark: each side runs along the rays and turns near the core
  function starPath(b) {
    const rays = [[0, -1, b.t], [1, 0, b.r], [0, 1, b.b], [-1, 0, b.l]];
    const tip = ([x, y, len]) => [C.x + x * len, C.y + y * len];
    let d = `M${tip(rays[0]).join(' ')}`;
    for (let i = 0; i < 4; i++) {
      const A = rays[i], B = rays[(i + 1) % 4];
      const c1 = [C.x + A[0] * A[2] * b.along + B[0] * b.k, C.y + A[1] * A[2] * b.along + B[1] * b.k];
      const c2 = [C.x + B[0] * B[2] * b.along + A[0] * b.k, C.y + B[1] * B[2] * b.along + A[1] * b.k];
      d += ` C${c1.join(' ')} ${c2.join(' ')} ${tip(B).join(' ')}`;
    }
    return d + ' Z';
  }
  // the comet trail from the logo: two tapered blades sweeping back-left
  function trail(b, color) {
    const x = C.x - b.l + 10, y = C.y;
    return `<path d="M${x} ${y - 6} Q${x - 70} ${y - 26} ${x - 200} ${y - 4} Q${x - 70} ${y - 8} ${x} ${y + 8} Z" fill="${color}"/>` +
      `<path d="M${x + 6} ${y + 14} Q${x - 50} ${y + 6} ${x - 150} ${y + 30} Q${x - 50} ${y + 20} ${x + 6} ${y + 26} Z" fill="${color}" opacity="0.75"/>`;
  }

  // ----- limbs (monoline, like the flame reference) -----
  const P = (o) => Object.assign({ name: 'stand', phase: 0, blink: 0, lookX: 0, lookY: 0 }, o || {});
  const line = (pts, w, col) => {
    const [s, m, e] = pts;
    return `<path d="M${s[0]} ${s[1]} Q${m[0]} ${m[1]} ${e[0]} ${e[1]}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const fist = (x, y, col) => `<circle cx="${x}" cy="${y}" r="10" fill="${col}"/>`;
  const openHand = (x, y, a, col) => {
    const f = [-0.9, -0.3, 0.3, 0.9].map((o) => {
      const ang = a + o * 0.5;
      return `<path d="M${x} ${y} l${Math.sin(ang) * 16} ${-Math.cos(ang) * 16}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`;
    }).join('');
    return `<circle cx="${x}" cy="${y}" r="9" fill="${col}"/>` + f;
  };
  const vHand = (x, y, col) => `<circle cx="${x}" cy="${y}" r="9" fill="${col}"/>` +
    `<path d="M${x} ${y} l-9 -22 M${x} ${y} l9 -22" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`;
  const foot = (x, y, dir, col) => `<path d="M${x} ${y} h${dir * 24}" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;

  function limbs(p, col, w) {
    const sL = [C.x - 58, C.y + 14], sR = [C.x + 58, C.y + 14];
    const hL = [C.x - 30, C.y + 52], hR = [C.x + 30, C.y + 52];
    const standLegs = line([hL, [C.x - 40, 320], [C.x - 46, 362]], w, col) + foot(C.x - 46, 362, -1, col) +
      line([hR, [C.x + 40, 320], [C.x + 46, 362]], w, col) + foot(C.x + 46, 362, 1, col);
    const sw = Math.sin(p.phase * Math.PI * 2);
    switch (p.name) {
      case 'wave': {
        const hx = C.x + 128 + sw * 10, hy = C.y - 88;
        return standLegs + line([sL, [C.x - 100, C.y + 60], [C.x - 96, C.y + 110]], w, col) + fist(C.x - 96, C.y + 110, col) +
          line([sR, [C.x + 130, C.y + 10], [hx, hy]], w, col) + openHand(hx, hy, 0.25 + sw * 0.3, col);
      }
      case 'cheer':
        return line([hL, [C.x - 58, 318], [C.x - 44, 346]], w, col) + foot(C.x - 44, 346, -1, col) +
          line([hR, [C.x + 58, 318], [C.x + 44, 346]], w, col) + foot(C.x + 44, 346, 1, col) +
          line([sL, [C.x - 118, C.y - 10], [C.x - 112, C.y - 104]], w, col) + fist(C.x - 112, C.y - 104, col) +
          line([sR, [C.x + 118, C.y - 10], [C.x + 112, C.y - 104]], w, col) + fist(C.x + 112, C.y - 104, col);
      case 'think':
        return standLegs + line([sR, [C.x + 90, C.y + 90], [C.x + 30, C.y + 56]], w, col) + fist(C.x + 30, C.y + 56, col) +
          line([sL, [C.x - 70, C.y + 80], [C.x + 26, C.y + 76]], w, col);
      case 'run':
        return line([hL, [C.x - 90, 300], [C.x - 120, 276]], w, col) + foot(C.x - 120, 276, -1, col) +
          line([hR, [C.x + 70, 300], [C.x + 60, 356]], w, col) + foot(C.x + 60, 356, 1, col) +
          line([sL, [C.x - 110, C.y + 20], [C.x - 118, C.y - 40]], w, col) + fist(C.x - 118, C.y - 40, col) +
          line([sR, [C.x + 100, C.y + 70], [C.x + 140, C.y + 70]], w, col) + fist(C.x + 140, C.y + 70, col);
      case 'peace':
        return standLegs + line([sL, [C.x - 96, C.y + 30], [C.x - 70, C.y + 60]], w, col) + fist(C.x - 70, C.y + 60, col) +
          line([sR, [C.x + 120, C.y + 20], [C.x + 118, C.y - 70]], w, col) + vHand(C.x + 118, C.y - 70, col);
      case 'fly':
        return line([sR, [C.x + 110, C.y - 10], [C.x + 150, C.y - 40]], w, col) + fist(C.x + 150, C.y - 40, col) +
          line([sL, [C.x - 70, C.y + 60], [C.x - 110, C.y + 70]], w, col) + fist(C.x - 110, C.y + 70, col) +
          line([hL, [C.x - 70, C.y + 90], [C.x - 120, C.y + 100]], w, col) + line([hR, [C.x - 20, C.y + 100], [C.x - 70, C.y + 120]], w, col);
      default: // stand, hands on hips
        return standLegs + line([sL, [C.x - 118, C.y + 40], [C.x - 60, C.y + 62]], w, col) + fist(C.x - 60, C.y + 62, col) +
          line([sR, [C.x + 118, C.y + 40], [C.x + 60, C.y + 62]], w, col) + fist(C.x + 60, C.y + 62, col);
    }
  }

  // ----- faces -----
  function bigEyes(p, eyeCol, pupilCol) {
    const s = Math.max(0.08, 1 - p.blink);
    if (p.name === 'cheer') {
      return [-26, 26].map((dx) => `<path d="M${C.x + dx - 14} ${C.y - 2} q14 -18 28 0" fill="none" stroke="${pupilCol}" stroke-width="8" stroke-linecap="round"/>`).join('') +
        `<path d="M${C.x - 16} ${C.y + 18} q16 22 32 0 z" fill="${pupilCol}"/>`;
    }
    const lx = p.name === 'think' ? -5 : p.lookX, ly = p.name === 'think' ? -8 : p.lookY;
    const eyes = [-26, 26].map((dx) => `<g transform="translate(${C.x + dx} ${C.y - 6}) scale(1 ${s})"><ellipse rx="17" ry="22" fill="${eyeCol}"/><ellipse cx="${lx}" cy="${ly + 3}" rx="8" ry="11" fill="${pupilCol}"/></g>`).join('');
    const mouth = p.name === 'think'
      ? `<path d="M${C.x - 8} ${C.y + 26} h16" stroke="${pupilCol}" stroke-width="6" stroke-linecap="round"/>`
      : p.name === 'run' || p.name === 'fly'
        ? `<path d="M${C.x - 12} ${C.y + 22} q12 16 24 0 z" fill="${pupilCol}"/>`
        : `<path d="M${C.x - 10} ${C.y + 24} q10 10 20 0" fill="none" stroke="${pupilCol}" stroke-width="6" stroke-linecap="round"/>`;
    return eyes + mouth;
  }
  function lineFace(p, col) {
    const s = Math.max(0.08, 1 - p.blink);
    const st = `fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round"`;
    let eyes;
    if (p.name === 'cheer') eyes = [-24, 24].map((dx) => `<path d="M${C.x + dx - 12} ${C.y} q12 -14 24 0" ${st}/>`).join('');
    else if (p.name === 'stand') eyes = [-24, 24].map((dx) => `<path d="M${C.x + dx - 13} ${C.y - 12} h26" ${st}/><ellipse cx="${C.x + dx}" cy="${C.y - 4}" rx="9" ry="${7 * s}" fill="${col}"/>`).join('');
    else if (p.name === 'peace') eyes = `<path d="M${C.x - 36} ${C.y - 4} q12 -12 24 0" ${st}/><path d="M${C.x + 12} ${C.y - 12} l20 8 l-20 8" ${st}/>`;
    else eyes = [-24, 24].map((dx) => `<g transform="translate(${C.x + dx} ${C.y - 4}) scale(1 ${s})"><ellipse rx="9" ry="12" fill="${col}"/><circle cx="3" cy="-4" r="3" fill="${PAPER}"/></g>`).join('');
    const brows = p.name === 'think' ? `<path d="M${C.x - 36} ${C.y - 26} l20 -6 M${C.x + 16} ${C.y - 30} l20 2" ${st}/>` : '';
    const mouth = p.name === 'think' ? `<path d="M${C.x - 10} ${C.y + 24} q5 -5 10 0 t10 0" ${st}/>`
      : p.name === 'cheer' || p.name === 'run' || p.name === 'fly' ? `<path d="M${C.x - 14} ${C.y + 18} q14 20 28 0 z" fill="${col}"/>`
        : `<path d="M${C.x - 12} ${C.y + 20} q12 12 24 0" ${st}/>`;
    return eyes + brows + mouth;
  }

  function spark(variant, pose) {
    const p = P(pose);
    const b = BODIES[variant];
    const tilt = p.name === 'run' ? 10 : p.name === 'fly' ? -14 : p.name === 'think' ? -6 : 0;
    const lift = p.name === 'cheer' ? -16 : 0;
    const body = starPath(b);
    const withTrail = p.name === 'fly' || p.name === 'run';
    let inner;
    if (variant === 'sticker') {
      const halo = `<g stroke="${PAPER}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="${PAPER}"><path d="${body}"/>${limbs(p, PAPER, 30).replace(/stroke="#fdfdfd" stroke-width="\d+"/g, '')}</g>`;
      inner = halo + (withTrail ? trail(b, DEEP) : '') + limbs(p, DEEP, 9) +
        `<path d="${body}" fill="${PAPER}" stroke="${DEEP}" stroke-width="${b.round}" stroke-linejoin="round"/>` + lineFace(p, DEEP);
    } else if (variant === 'chubby') {
      inner = (withTrail ? trail(b, RED) : '') + limbs(p, INK, 9) +
        `<path d="${body}" fill="${RED}" stroke="${RED}" stroke-width="${b.round}" stroke-linejoin="round"/>` + lineFace(p, INK);
    } else {
      inner = (withTrail ? trail(b, RED) : '') + limbs(p, INK, 9) +
        `<path d="${body}" fill="${RED}" stroke="${RED}" stroke-width="${b.round}" stroke-linejoin="round"/>` + bigEyes(p, PAPER, INK);
    }
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 ${lift}) rotate(${tilt} ${C.x} ${C.y + 60})">${inner}</g></svg>`;
  }

  window.SPARK = { spark, BODIES };
})();
