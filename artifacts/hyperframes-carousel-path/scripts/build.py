# Generates compositions/*.html and index.html for the «Панорама от точки А» carousel (1080x1440).
# Seven 6 s slides share one world: hills, road and milestones use world coordinates shifted by
# -i*1080 px, and «Искра» leaves slide i at the right edge and enters slide i+1 from the left in the
# same pose, so the swipe reads as one walk. scripts/export.sh cuts the rendered strip into slides.
#   python3 scripts/build.py
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
SPARK_JS = open(f'{P}/assets/spark.js').read()
W, M, DUR, N = 1080, 90, 6.0, 7
ROAD_Y = 1130
SPK = 250                     # mascot box size
STOP_X = 130                  # where she stops at a milestone (box left)
EDGE_R = W - 120              # box left when she is half out on the right
EDGE_L = -120                 # box left when she is half in from the left (same world spot)


def write(name, html):
    open(f'{C}/{name}.html', 'w').write(html)


def st(top=None, left=None, right=None, w=None, h=None, extra=''):
    s = 'position:absolute;'
    for k, v in (('top', top), ('left', left), ('right', right), ('width', w), ('height', h)):
        if v is not None:
            s += f'{k}:{v}px;'
    return s + extra


def fnt(weight, size, lh, fam):
    return f"font:{weight} {size}px/{lh} '{fam}';"


CSS = """
.chip-r{position:absolute;top:96px;left:90px;padding:12px 24px;border-radius:999px;background:#fcf3f0;color:#b60916;font:600 30px/1 'Inter';letter-spacing:.06em;white-space:nowrap}
.wm{position:absolute;top:92px;right:90px;width:150px}
.ttl{position:absolute;left:90px;right:90px;top:200px;font:800 84px/1.05 'Manrope';letter-spacing:-.025em;color:#161311}
.ttl .ln{display:block;white-space:nowrap}
.fx{position:absolute;left:90px;right:90px;font:600 38px/1.3 'Inter';color:#6e6d6b}
.card{position:absolute;left:90px;top:580px;width:900px;height:330px;background:#fdfdfd;border-radius:36px;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.card .ill{position:absolute;left:195px;top:15px;width:510px;height:300px}
.card .ill *{position:absolute}
.ms{position:absolute;left:0;top:0;width:100%;height:100%}
.spk{position:absolute;left:-400px;top:890px;width:250px;height:250px}
.hand{position:absolute;font:700 68px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%;white-space:nowrap}
.pill{position:absolute;padding:18px 34px;border-radius:999px;background:#de0b1b;color:#fff;font:600 40px/1 'Inter';white-space:nowrap}
.sgn{position:absolute;width:100px;height:100px;border-radius:50%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;font:800 56px/1 'Manrope'}
.rt{position:absolute}
"""

PRELUDE = """
const S = document.querySelector('[data-composition-id="%s"]');
const q = (s) => S.querySelector(s);
const qa = (s) => S.querySelectorAll(s);
const tl = gsap.timeline({ paused: true });
function counter(el, to, at, dur) { tl.to({v: 0}, {v: 1, duration: dur, ease: 'power2.out', onUpdate() { el.textContent = Math.round(to * this.targets()[0].v); }}, at); }
"""

# ---- «Искра»: one motion driver per slide; entry / exit pose and speed match across the seam ----
SPARK_DRIVER = SPARK_JS + """
const spk = q('.spk');
let lastSvg = '';
const RUN = (t) => ({name: 'run', phase: t * 3.4});
const bob = (t) => -Math.abs(Math.sin(t * 9)) * 12;
function bounce(f) { const n = 7.5625, d = 2.75; if (f < 1 / d) return n * f * f; if (f < 2 / d) { f -= 1.5 / d; return n * f * f + 0.75; } if (f < 2.5 / d) { f -= 2.25 / d; return n * f * f + 0.9375; } f -= 2.625 / d; return n * f * f + 0.984375; }
function drive(cfg) {
  tl.to({}, {duration: %s, ease: 'none', onUpdate() {
    const t = this.time();
    let x = cfg.stopX, y = 0, pose;
    const blink = Math.max(0, ...[1.6, 3.4, 5.0].map((b) => 1 - Math.abs(t - b) / 0.09));
    if (cfg.drop && t < 0.9) {                       // slide 1: she drops onto the road
      const f = Math.min(1, Math.max(0, (t - 0.2) / 0.7));
      y = -520 * (1 - bounce(f)); pose = {name: 'fly'};
      if (t < 0.2) { y = -520; }
    } else if (cfg.enter && t < cfg.enterEnd) {      // walks in from the left edge
      const f = t / cfg.enterEnd, e = 1 - (1 - f) * (1 - f);
      x = %d + (cfg.stopX - %d) * e; y = bob(t); pose = RUN(t);
    } else if (cfg.exit && t >= cfg.exitAt) {        // walks out through the right edge
      const f = (t - cfg.exitAt) / (%s - cfg.exitAt);
      x = cfg.stopX + (%d - cfg.stopX) * f * f; y = bob(t); pose = RUN(t);
    } else {
      const since = t - (cfg.enter ? cfg.enterEnd : 0.9);
      pose = cfg.stop(t);
      pose.squash = 1 - 0.16 * Math.max(0, 1 - since / 0.3) * (since >= 0 ? 1 : 0);
    }
    pose.blink = blink;
    spk.style.left = x + 'px';
    spk.style.top = (%d + y) + 'px';
    const svg = window.SPARK.spark('logo', pose);
    if (svg !== lastSvg) { spk.innerHTML = svg; lastSvg = svg; }
  }}, 0);
}
""" % (DUR, EDGE_L, EDGE_L, DUR, EDGE_R, ROAD_Y - 240)


def scene(cid, css, body, js, title):
    return sub(cid, CSS + css, body, PRELUDE % cid + js + f"\nwindow.__timelines['{cid}'] = tl;\n", title)


def words(text):
    return ' '.join(f'<span class="m"><span class="w">{w}</span></span>' for w in text.split(' '))


def hills(i):
    pts = ' L'.join(f'{x},{1010 + 30 * math.sin(2 * math.pi * (x + i * W) / 1620):.1f}' for x in range(-20, W + 40, 20))
    return (f'<svg class="ms" data-layout-allow-overflow viewBox="0 0 {W} 1440"><path d="M{pts} L{W + 20},{ROAD_Y} L-20,{ROAD_Y} Z" fill="#fcf3f0"/>'
            f'<path d="M{pts}" fill="none" stroke="#e2e0da" stroke-width="6"/></svg>')


def road(i):
    dash = ''.join(f'<i style="{st(ROAD_Y - 3, k * 120, w=60, h=6, extra="background:#f8f7f3;border-radius:3px;")}"></i>' for k in range(0, 9))
    return f'<div class="rd" style="{st(ROAD_Y - 50, 0, w=W, h=100, extra="background:#161311;transform-origin:0 50%;")}"></div><div class="dsh">{dash}</div>'


def route(cur):
    x0, step = M + 10, 146.67
    s = f'<div style="{st(1303, x0, w=step * 6, h=4, extra="background:#e2e0da;border-radius:2px;")}"></div>'
    if cur > 2:
        s += f'<div style="{st(1303, x0, w=step * (cur - 2), h=4, extra="background:#de0b1b;border-radius:2px;")}"></div>'
    if cur > 1:
        s += f'<div class="rseg" style="{st(1303, x0 + step * (cur - 2), w=step, h=4, extra="background:#de0b1b;border-radius:2px;transform-origin:0 50%;")}"></div>'
    for i in range(7):
        on = i < cur
        cls = 'rdot' if i == cur - 1 else ''
        s += f'<i class="{cls}" style="{st(1295, x0 + i * step - 10, w=20, h=20, extra="border-radius:50%;background:" + ("#de0b1b" if on else "#e2e0da") + ";")}"></i>'
    s += f'<div style="{st(1250, x0 - 12, w=24, extra=fnt(800, 22, 1, "Manrope") + "color:#161311;")}">А</div>'
    s += (f'<svg style="{st(1246, x0 + 6 * step - 8, w=34, h=34)}" viewBox="0 0 34 34"><path d="M6 32V4" stroke="#161311" stroke-width="3" stroke-linecap="round"/>'
          f'<path d="M6 5h20l-6 6 6 6H6z" fill="#de0b1b"/></svg>')
    return s


def route_js(cur):
    j = ''
    if cur > 1:
        j += f"tl.fromTo(q('.rseg'), {{scaleX: 0}}, {{scaleX: 1, duration: 0.6, ease: 'power2.out'}}, 0.25);\n"
    j += "tl.fromTo(q('.rdot'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(3)'}, 0.75);\n"
    return j


def common_html(i, chip):
    return (f'{hills(i)}{road(i)}<span class="chip-r">{chip}</span><img class="wm" src="assets/brand/wordmark-ink.png" alt="ashyq" />' + route(i + 1))


def common_js(cur):
    return ("tl.fromTo(q('.chip-r'), {x: -40, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 0.05);\n"
            "tl.fromTo(q('.wm'), {opacity: 0}, {opacity: 1, duration: 0.4}, 0.1);\n" + route_js(cur))


def title(lines):
    return '<div class="ttl">' + ''.join(f'<span class="ln">{words(l)}</span>' for l in lines) + '</div>'


def fx(top, html, size=38):
    return f'<div class="fx" style="top:{top}px;font-size:{size}px">{html}</div>'


def sign(x, n):
    return (f'<i class="pole" style="{st(1025, x - 4, w=8, h=55, extra="background:#161311;transform-origin:50% 100%;")}"></i>'
            f'<div class="sgn" style="left:{x - 50}px;top:925px">{n}</div>')


def sign_js():
    return ("tl.fromTo(q('.pole'), {scaleY: 0}, {scaleY: 1, duration: 0.3, ease: 'power2.out'}, 0.85);\n"
            "tl.fromTo(q('.sgn'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.4)'}, 1.0);\n")


def card_js(at=1.2):
    return f"tl.fromTo(q('.card'), {{y: 60, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}}, {at});\n"


def title_js(n_words, start=0.3):
    times = [round(start + k * 0.1, 3) for k in range(n_words)]
    return f"rise(tl, S, '.ttl .w', {json.dumps(times)}, 0.4);\n"


def facts_js(at):
    return f"tl.fromTo(q('.fx'), {{y: 20, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, {at});\n"


def drive_js(stop_x, stop_pose, enter=True, exit_=True, drop=False, enter_end=1.0, exit_at=4.8):
    return ("drive({stopX: %d, enter: %s, exit: %s, drop: %s, enterEnd: %s, exitAt: %s, stop: (t) => %s});\n"
            % (stop_x, str(enter).lower(), str(exit_).lower(), str(drop).lower(), enter_end, exit_at, stop_pose))


THINK = "({name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4})"
WOW = "({name: 'cheer', mood: 'wow'})"
CHEER = "({name: 'cheer'})"
WAVE = "({name: 'wave', phase: t * 1.6})"

# ================= 01 start =================
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 110px/1.02 'Manrope';letter-spacing:-.03em;color:#161311}
.bigA{position:absolute;left:90px;top:300px;font:800 300px/.85 'Manrope';letter-spacing:-.04em;color:#de0b1b}
.pinA{position:absolute;left:450px;top:%dpx;width:130px;height:130px;border-radius:50%%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;font:800 84px/1 'Manrope'}
""" % (ROAD_Y - 130), common_html(0, 'СТАРТ') + """
<div class="big"><span class="m"><span class="w">От</span></span> <span class="m"><span class="w">точки</span></span></div>
<div class="bigA" data-layout-allow-overlap>А</div>
<div class="hand" style="top:640px;left:90px">пять остановок до цели</div>
<div class="pinA">А</div>
<div class="spk"></div>
""", common_js(1) + SPARK_DRIVER + """
tl.fromTo(q('.rd'), {scaleX: 0}, {scaleX: 1, duration: 0.9, ease: 'power2.inOut'}, 0.1);
tl.fromTo(q('.dsh'), {opacity: 0}, {opacity: 1, duration: 0.5}, 0.7);
rise(tl, S, '.big .w', [0.3, 0.45], 0.4);
tl.fromTo(q('.bigA'), {scale: 2.4, opacity: 0}, {scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out', transformOrigin: '0% 60%'}, 0.55);
wipe(tl, q('.hand'), 1.4, 2.4);
tl.fromTo(q('.pinA'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.4)'}, 0.9);
""" + drive_js(STOP_X, WAVE, enter=False, drop=True), '01 start'))

# ================= 02 diagnostic =================
def arc(a0, a1, r, cls, col, sw):
    x0_, y0_ = 255 + r * math.cos(math.radians(a0)), 250 + r * math.sin(math.radians(a0))
    x1_, y1_ = 255 + r * math.cos(math.radians(a1)), 250 + r * math.sin(math.radians(a1))
    return f'<path class="{cls}" d="M{x0_:.1f} {y0_:.1f} A{r} {r} 0 0 1 {x1_:.1f} {y1_:.1f}" pathLength="1" stroke-dasharray="1" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round"/>'


gauge = (f'<svg class="ms" viewBox="0 0 510 300">{arc(180, 360, 170, "ga", "#e2e0da", 34)}{arc(238, 306, 170, "gg", "#2e5e3a", 34)}'
         f'<line class="needle" x1="255" y1="250" x2="{255 + 130 * math.cos(math.radians(272)):.1f}" y2="{250 + 130 * math.sin(math.radians(272)):.1f}" stroke="#161311" stroke-width="10" stroke-linecap="round"/>'
         f'<circle class="hub" cx="255" cy="250" r="16" fill="#161311"/></svg>'
         f'<div class="gcap" style="{st(262, 0, w=510, extra="text-align:center;" + fnt(500, 26, 1, "Inter") + "color:#8c8b8a;")}">диапазон, а не одно число</div>')
write('s02', scene('s02', '', common_html(1, 'ОСТАНОВКА 1/5') + title(['Узнай, откуда', 'стартуешь']) +
    fx(412, 'Бесплатная предварительная оценка за 20 минут: диапазон балла, навыки, следующий шаг', 36) +
    f'<div class="card"><div class="ill">{gauge}</div></div>' + sign(470, 1) + '<div class="spk"></div>',
    common_js(2) + title_js(4) + facts_js(1.0) + card_js() + sign_js() + SPARK_DRIVER + """
tl.fromTo(q('.ga'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.7, ease: 'power2.out'}, 1.7);
tl.fromTo(q('.gg'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.6, ease: 'power2.out'}, 2.3);
tl.fromTo(q('.needle'), {rotation: -80, svgOrigin: '255 250'}, {rotation: 0, svgOrigin: '255 250', duration: 1.3, ease: 'elastic.out(1, 0.5)'}, 2.1);
tl.fromTo(q('.hub'), {scale: 0}, {scale: 1, duration: 0.3, svgOrigin: '255 250', ease: 'back.out(3)'}, 1.9);
tl.fromTo(q('.gcap'), {opacity: 0}, {opacity: 1, duration: 0.4}, 3.5);
""" + drive_js(STOP_X, "(t >= 3.4 ? " + WOW + " : " + THINK + ")"), '02 diagnostic'))

# ================= 03 compass =================
ticks = ''.join(f'<line x1="{255 + 118 * math.cos(math.radians(a)):.1f}" y1="{150 + 118 * math.sin(math.radians(a)):.1f}" x2="{255 + 130 * math.cos(math.radians(a)):.1f}" y2="{150 + 130 * math.sin(math.radians(a)):.1f}" stroke="#161311" stroke-width="5" stroke-linecap="round"/>' for a in range(0, 360, 30))
compass = (f'<svg class="ms" viewBox="0 0 510 300"><circle class="cring" cx="255" cy="150" r="130" fill="#fdfdfd" stroke="#161311" stroke-width="8"/>{ticks}'
           f'<g class="cneedle"><path d="M255 60 L285 150 L255 140 L225 150 Z" fill="#de0b1b"/><path d="M255 240 L285 150 L255 160 L225 150 Z" fill="#161311"/></g>'
           f'<circle cx="255" cy="150" r="10" fill="#fdfdfd" stroke="#161311" stroke-width="4"/></svg>')
write('s03', scene('s03', '', common_html(2, 'ОСТАНОВКА 2/5') + title(['Выбери направление']) +
    fx(324, '<span class="cn">40</span> утверждений · <span class="cn">6</span> минут · <span class="cn">16</span> профилей') +
    f'<div class="card"><div class="ill">{compass}</div></div>' +
    f'<div class="ftn" style="{st(1196, M, M, extra=fnt(500, 26, 1.2, "Inter") + "color:#8c8b8a;")}">Ориентир, а не диагноз и не официальный MBTI®</div>' + sign(470, 2) + '<div class="spk"></div>',
    common_js(3) + title_js(2) + facts_js(0.9) + card_js() + sign_js() + SPARK_DRIVER + """
tl.fromTo(q('.cring'), {opacity: 0, svgOrigin: '255 150', scale: 0.6}, {opacity: 1, scale: 1, svgOrigin: '255 150', duration: 0.5, ease: 'back.out(1.8)'}, 1.5);
tl.fromTo(q('.cneedle'), {rotation: -540, svgOrigin: '255 150'}, {rotation: 0, svgOrigin: '255 150', duration: 1.6, ease: 'power3.out'}, 1.9);
const cns = qa('.cn');
[40, 6, 16].forEach((v, i) => counter(cns[i], v, 1.3 + i * 0.15, 1.1));
tl.fromTo(q('.ftn'), {opacity: 0}, {opacity: 1, duration: 0.5}, 3.6);
""" + drive_js(STOP_X, WOW), '03 compass'))

# ================= 04 library =================
books = [(70, '#161311'), (110, '#de0b1b'), (90, '#e2e0da'), (120, '#2e5e3a'), (80, '#f9e0db'), (105, '#161311'), (95, '#b60916')]
shelf = f'<div class="shl" style="{st(250, 50, w=410, h=8, extra="background:#161311;border-radius:4px;transform-origin:0 50%;")}"></div>' + ''.join(
    f'<i class="bk" style="{st(250 - h * 1.6, 60 + i * 55, w=44, h=h * 1.6, extra=f"background:{c};border-radius:6px 6px 0 0;border:3px solid #161311;")}"></i>' for i, (h, c) in enumerate(books))
write('s04', scene('s04', '', common_html(3, 'ОСТАНОВКА 3/5') + title(['Занимайся сам —', 'бесплатно']) +
    fx(412, '<span class="cn">42</span> главы · <span class="cn">24</span> эссе Task 2 · <span class="cn">6</span> отчётов Task 1 · <span class="cn">322</span> упражнения') +
    f'<div class="card"><div class="ill">{shelf}</div></div>' + sign(470, 3) + '<div class="spk"></div>',
    common_js(4) + title_js(4) + facts_js(1.0) + card_js() + sign_js() + SPARK_DRIVER + """
tl.fromTo(q('.shl'), {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.inOut'}, 1.6);
qa('.bk').forEach((el, i) => tl.fromTo(el, {y: 90, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 2.0 + i * 0.13));
const cns = qa('.cn');
[42, 24, 6, 322].forEach((v, i) => counter(cns[i], v, 1.3 + i * 0.12, 1.2));
""" + drive_js(STOP_X, "(t >= 3.2 ? " + CHEER + " : " + WOW + ")"), '04 library'))

# ================= 05 trainer =================
lines = ''.join(f'<i class="tx" style="{st(56 + k * 44, 40, w=210 if k != 3 else 130, h=14, extra="background:#e2e0da;border-radius:7px;transform-origin:0 50%;")}"></i>' for k in range(5))
chips = ''.join(f'<span class="cc" style="{st(28 + k * 62, 290, w=210, extra="padding:12px 0;border-radius:14px;background:#e8efe2;color:#2e5e3a;text-align:center;white-space:nowrap;" + fnt(600, 28, 1, "Inter"))}">{t}</span>' for k, t in enumerate(['Грамматика', 'Ответ на вопрос', 'Связность', 'Лексика']))
sheet = (f'<div class="shp" style="{st(20, 20, w=250, h=260, extra="background:#fcf3f0;border-radius:18px;")}"></div>{lines}'
         f'<svg class="wv" style="{st(112, 40, w=210, h=30)}" viewBox="0 0 210 30"><path class="wvp" d="M0 18 Q13 2 26 18 T52 18 T78 18 T104 18" pathLength="1" stroke-dasharray="1" fill="none" stroke="#de0b1b" stroke-width="5" stroke-linecap="round"/></svg>{chips}')
write('s05', scene('s05', '', common_html(4, 'ОСТАНОВКА 4/5') + title(['Проверь своё эссе']) +
    fx(324, 'Три шага · два учебных эссе · четыре критерия') +
    f'<div class="card"><div class="ill">{sheet}</div></div>' + sign(470, 4) + '<div class="spk"></div>',
    common_js(5) + title_js(3) + facts_js(0.9) + card_js() + sign_js() + SPARK_DRIVER + """
tl.fromTo(q('.shp'), {scale: 0.85, opacity: 0}, {scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)'}, 1.6);
qa('.tx').forEach((el, i) => tl.fromTo(el, {scaleX: 0}, {scaleX: 1, duration: 0.35, ease: 'power2.out'}, 2.0 + i * 0.15));
tl.fromTo(q('.wvp'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut'}, 2.9);
qa('.cc').forEach((el, i) => tl.fromTo(el, {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 3.3 + i * 0.25));
""" + drive_js(STOP_X, "(t >= 4.0 ? " + CHEER + " : " + THINK + ")"), '05 trainer'))

# ================= 06 classes =================
def pt(deg, r):
    a = math.radians(deg - 90)
    return 255 + r * math.cos(a), 150 + r * math.sin(a)


cticks = ''.join(f'<line class="ck" x1="{pt(k * 30, 118)[0]:.1f}" y1="{pt(k * 30, 118)[1]:.1f}" x2="{pt(k * 30, 132)[0]:.1f}" y2="{pt(k * 30, 132)[1]:.1f}" stroke="#161311" stroke-width="6" stroke-linecap="round"/>' for k in range(12))
ax1, ay1 = pt(210, 100); ax2, ay2 = pt(330, 100)
hx, hy = pt(330, 78)
clock = (f'<svg class="ms" viewBox="0 0 510 300"><circle class="cf" cx="255" cy="150" r="138" fill="#fdfdfd" stroke="#161311" stroke-width="8"/>{cticks}'
         f'<path class="carc" d="M{ax1:.1f} {ay1:.1f} A100 100 0 0 1 {ax2:.1f} {ay2:.1f}" pathLength="1" stroke-dasharray="1" fill="none" stroke="#de0b1b" stroke-width="26" stroke-linecap="round"/>'
         f'<line class="chand" x1="255" y1="150" x2="{hx:.1f}" y2="{hy:.1f}" stroke="#161311" stroke-width="9" stroke-linecap="round"/><circle cx="255" cy="150" r="10" fill="#161311"/></svg>')
write('s06', scene('s06', '', common_html(5, 'ОСТАНОВКА 5/5') + title(['Иди с командой']) +
    fx(324, 'Пн–сб · 19:00–23:00 по Астане') +
    f'<div class="card"><div class="ill">{clock}</div></div>' + sign(470, 5) + '<div class="spk"></div>',
    common_js(6) + title_js(3) + facts_js(0.9) + card_js() + sign_js() + SPARK_DRIVER + """
tl.fromTo(q('.cf'), {opacity: 0, svgOrigin: '255 150', scale: 0.6}, {opacity: 1, scale: 1, svgOrigin: '255 150', duration: 0.5, ease: 'back.out(1.8)'}, 1.6);
qa('.ck').forEach((el, i) => tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.2}, 1.9 + i * 0.05));
// the hand sweeps round to seven while the red evening arc is drawn
tl.fromTo(q('.chand'), {rotation: -270, svgOrigin: '255 150'}, {rotation: 0, svgOrigin: '255 150', duration: 1.5, ease: 'power2.inOut'}, 2.4);
tl.fromTo(q('.carc'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.0, ease: 'power1.inOut'}, 2.9);
""" + drive_js(STOP_X, CHEER), '06 classes'))

# ================= 07 goal =================
write('s07', scene('s07', """
.pole7{position:absolute;left:775px;top:%dpx;width:10px;height:280px;background:#161311;transform-origin:50%% 100%%}
.flg{position:absolute;left:785px;top:%dpx;width:190px;height:110px;background:#de0b1b;clip-path:polygon(0 0,100%% 50%%,0 100%%);transform-origin:0 50%%}
""" % (ROAD_Y - 330, ROAD_Y - 330), common_html(6, 'ФИНИШ') + title(['Дорога начинается', 'с точки А']) +
    fx(412, 'Бесплатная диагностика · ~20 минут', 42) +
    '<div class="pill" style="top:505px;left:90px">ссылка в профиле</div>' +
    '<div class="hand" style="top:640px;left:90px">сохрани карту пути</div>' +
    '<i class="pole7"></i><div class="flg"></div><div class="hand goal" style="top:%dpx;left:660px">твоя цель</div>' % (ROAD_Y - 420) +
    '<div class="spk"></div>',
    common_js(7) + title_js(5, 0.9) + facts_js(2.0) + SPARK_DRIVER + """
tl.fromTo(q('.pole7'), {scaleY: 0}, {scaleY: 1, duration: 0.5, ease: 'power2.out'}, 1.4);
tl.fromTo(q('.flg'), {scaleX: 0}, {scaleX: 1, duration: 0.6, ease: 'back.out(1.6)'}, 1.9);
wipe(tl, q('.goal'), 2.4, 3.1);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.6);
wipe(tl, q('.hand:not(.goal)'), 3.1, 4.1);
""" + drive_js(450, CHEER, enter=True, exit_=False, enter_end=1.2), '07 goal'))

# ---------- background (plain paper grid) ----------
write('bg', sub('bg', """
#bg-grid{position:absolute;inset:0;background-color:#f8f7f3;background-image:linear-gradient(#e9e6df 2px,transparent 2px),linear-gradient(90deg,#e9e6df 2px,transparent 2px);background-size:54px 54px}
""", '<div id="bg-grid"></div>', """const tl = gsap.timeline({ paused: true });
tl.fromTo('#bg-grid', {opacity: 0.999}, {opacity: 1, duration: 0.1}, 0);
window.__timelines['bg'] = tl;
""", 'bg'))

# ---------- index.html ----------
TOTAL = DUR * N
slots = [f'      <div id="el-bg" data-composition-id="bg" data-composition-src="compositions/bg.html" data-start="0" data-duration="{TOTAL}" data-track-index="0" data-width="1080" data-height="1440"></div>']
for i in range(N):
    cid = f's0{i + 1}'
    slots.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{i * DUR}" data-duration="{DUR}" data-track-index="1" data-width="1080" data-height="1440"></div>')
open(f'{P}/index.html', 'w').write(f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1440" />
    <title>ASHYQ — Панорама от точки А (карусель)</title>
    <!-- GSAP 3.14.2 vendored: renders must not depend on a CDN -->
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1440px; overflow: hidden; background: #f8f7f3; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #f8f7f3; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
      #el-bg {{ z-index: 0; }}
      #root > div[data-composition-src][data-track-index="1"] {{ z-index: 1; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1440" data-duration="{TOTAL}">
{chr(10).join(slots)}
    </div>
    <script>
      // each slide animates on its own timeline; the root stays empty
      window.__timelines['main'] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")
print('built', TOTAL)
