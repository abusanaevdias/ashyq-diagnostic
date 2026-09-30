// Shared motion helpers for the product ads. Each ad page defines a #timeline
// JSON block, builds its DOM, then calls K.boot(seek).
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eBack = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const $ = (id) => document.getElementById(id);

  const words = (text) => text.split(' ').map((w) => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' ');
  // headline = plain lines + optional handwritten accent line
  function head(el, h) {
    el.innerHTML = h.lines.map((l) => `<div class="kt"><span class="ln">${words(l)}</span></div>`).join('') +
      (h.acc ? `<div><span class="acc">${esc(h.acc)}</span></div>` : '');
    return el;
  }
  function kt(el, t, tin, tout) {
    const ws = el.querySelectorAll('.wi');
    ws.forEach((w, i) => {
      const a = eOut(prog(t, tin + i * 0.05, tin + i * 0.05 + 0.4));
      const b = tout == null ? 0 : eInOut(prog(t, tout + i * 0.02, tout + i * 0.02 + 0.28));
      w.style.transform = `translateY(${(1 - a) * 118 - b * 118}%)`;
    });
    const acc = el.querySelector('.acc');
    if (!acc) return;
    const s = tin + ws.length * 0.05 + 0.1;
    const a = eOut(prog(t, s, s + 0.4));
    const b = tout == null ? 0 : prog(t, tout, tout + 0.22);
    acc.style.clipPath = `inset(-30% ${(1 - a) * 100}% -30% -5%)`;
    acc.style.opacity = a > 0 ? 1 - b : 0;
    acc.style.transform = `rotate(-3deg) translateY(${-b * 36}px)`;
  }
  function pop(el, t, tin, tout, from = 0.7) {
    const a = eBack(prog(t, tin, tin + 0.35));
    const b = tout == null ? 0 : prog(t, tout, tout + 0.25);
    el.style.opacity = prog(t, tin, tin + 0.08) * (1 - b);
    el.style.transform = `scale(${lerp(from, 1, a) * (1 - 0.1 * b)})`;
  }
  function rise(el, t, tin, tout, dy = 40) {
    const a = eOut(prog(t, tin, tin + 0.45));
    const b = tout == null ? 0 : eInOut(prog(t, tout, tout + 0.35));
    el.style.opacity = a * (1 - b);
    el.style.transform = `translateY(${(1 - a) * dy - b * 60}px)`;
  }
  const panel = (el, t, tin) => { el.style.transform = `translateY(${(1 - eInOut(prog(t, tin - 0.05, tin + 0.4))) * 100}%)`; };
  const blink = (t, times) => Math.max(0, ...times.map((b) => 1 - Math.abs(t - b) / 0.09));
  const spark = (el, pose, opts) => { el.innerHTML = window.SPARK.spark('logo', pose, opts); };
  const timeline = () => JSON.parse(document.getElementById('timeline').textContent);

  function boot(seek) {
    const stage = $('stage');
    const TL = timeline();
    window.seek = seek;
    window.ready = Promise.all([
      document.fonts.ready,
      ...[...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))),
    ]);
    if (!new URLSearchParams(location.search).has('render')) {
      const fit = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); stage.style.transform = `scale(${s})`; stage.style.left = (innerWidth - 1080 * s) / 2 + 'px'; };
      addEventListener('resize', fit); fit();
      window.ready.then(() => {
        const t0 = performance.now();
        const loop = (now) => { seek(((now - t0) / 1000) % TL.duration); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      });
    } else window.ready = window.ready.then(() => seek(0));
  }

  window.K = { clamp, prog, lerp, eOut, eInOut, eBack, esc, $, head, kt, pop, rise, panel, blink, spark, timeline, boot };
})();
