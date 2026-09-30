# Generates compositions/*.html and index.html for the «Прокачай фразу» carousel (1080x1440).
# Seven 6 s slides: hook, five before/after swaps (old words wave-underlined, new words marker-highlighted, why below), cheat sheet + CTA.
# scripts/export.sh cuts the rendered strip into slides and prepends the 200 ms poster (see ../CAROUSELS.md).
#   python3 scripts/build.py
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
SPARK_JS = open(f'{P}/assets/spark.js').read()
W, M, DUR, N = 1080, 90, 6.0, 7


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
.lab{position:absolute;left:90px;font:600 28px/1 'Inter';letter-spacing:.08em;color:#8c8b8a;text-transform:uppercase}
.was{position:absolute;left:90px;top:250px;width:900px;padding:40px 48px;border-radius:36px;background:#efeeea;color:#6e6d6b;font:600 50px/1.3 'Inter'}
.ow{text-decoration:underline wavy transparent;text-decoration-thickness:4px;text-underline-offset:10px;text-decoration-skip-ink:none}
.arr{position:absolute;left:470px;top:520px;width:140px;height:150px}
.arl{position:absolute;left:640px;top:572px;font:700 54px/1 'Caveat';color:#b60916;white-space:nowrap;transform:rotate(-3deg)}
.now{position:absolute;left:90px;top:720px;width:900px;padding:44px 48px;border-radius:36px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1);color:#161311;font:800 58px/1.25 'Manrope';letter-spacing:-.015em}
.nw{background-image:linear-gradient(#f9e0db,#f9e0db);background-repeat:no-repeat;background-position:0 88%;background-size:0% 42%;padding:0 4px;border-radius:6px}
.why{position:absolute;left:90px;top:1040px;width:900px;padding:28px 36px 28px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #2e5e3a;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 38px/1.3 'Inter';color:#161311}
.why b{font-family:'Manrope';font-weight:800;color:#2e5e3a;white-space:nowrap}
.hand{position:absolute;font:700 68px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%;white-space:nowrap}
.pill{position:absolute;padding:18px 34px;border-radius:999px;background:#de0b1b;color:#fff;font:600 40px/1 'Inter';white-space:nowrap}
.spk{position:absolute}
.dts{position:absolute;left:0;top:0;width:100%;height:100%}
"""

PRELUDE = """
const S = document.querySelector('[data-composition-id="%s"]');
const q = (s) => S.querySelector(s);
const qa = (s) => S.querySelectorAll(s);
const tl = gsap.timeline({ paused: true });
"""

SPARK_DRIVER = SPARK_JS + """
const spk = q('.spk');
let lastSvg = '';
function driveSpark(poseFn) {
  tl.to({}, {duration: __DUR__, ease: 'none', onUpdate() {
    const t = this.time();
    const blink = Math.max(0, ...[1.6, 3.3, 5.3].map((b) => 1 - Math.abs(t - b) / 0.09));
    const pose = poseFn(t); pose.blink = blink;
    const svg = window.SPARK.spark('logo', pose);
    if (svg !== lastSvg) { spk.innerHTML = svg; lastSvg = svg; }
  }}, 0);
}
""".replace('__DUR__', str(DUR))


def scene(cid, css, body, js, title):
    return sub(cid, CSS + css, body, PRELUDE % cid + js + f"\nwindow.__timelines['{cid}'] = tl;\n", title)


def words(text):
    return ' '.join(f'<span class="m"><span class="w">{w}</span></span>' for w in text.split(' '))


def head(chip):
    return f'<span class="chip-r">{chip}</span><img class="wm" src="assets/brand/wordmark-ink.png" alt="ashyq" />'


HEAD_JS = ("tl.fromTo(q('.chip-r'), {x: -40, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 0.05);\n"
           "tl.fromTo(q('.wm'), {opacity: 0}, {opacity: 1, duration: 0.4}, 0.1);\n")


def dots(cur):
    s, x0 = '<div class="dts">', W / 2 - 2 * 60
    for i in range(5):
        on = cur == 'all' or cur == i or (isinstance(cur, int) and i < cur)
        big = cur == i
        d = 28 if big else 18
        s += f'<i class="{"dn" if cur == i or cur == "all" else ""}" style="{st(1300 + (0 if big else 5), x0 + i * 60 - d / 2, w=d, h=d, extra="border-radius:50%;background:" + ("#de0b1b" if on else "#e2e0da") + ";")}"></i>'
    return s + '</div>'


DOTS_JS = ("tl.fromTo(q('.dts'), {opacity: 0}, {opacity: 1, duration: 0.4}, 0.2);\n"
           "qa('.dn').forEach((el, i) => tl.fromTo(el, {scale: 0}, {scale: 1, duration: 0.4, ease: 'back.out(3)'}, 0.5 + i * 0.12));\n")



ARROW = ('<svg class="arr" viewBox="0 0 140 150"><path class="arp" d="M70 6 C 40 50, 100 80, 70 138" pathLength="1" stroke-dasharray="1" '
         'fill="none" stroke="#de0b1b" stroke-width="10" stroke-linecap="round"/><path class="arh" d="M44 112 L70 142 L98 114" fill="none" '
         'stroke="#de0b1b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="arl">прокачка</div>')

ROUND_JS = """
tl.fromTo(q('.l1'), {opacity: 0}, {opacity: 1, duration: 0.3}, 0.2);
tl.fromTo(q('.was'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.3);
qa('.ow').forEach((el) => tl.fromTo(el, {textDecorationColor: 'rgba(222,11,27,0)', color: '#6e6d6b'}, {textDecorationColor: 'rgba(222,11,27,1)', color: '#b60916', duration: 0.4}, 1.1));
tl.fromTo(q('.arp'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut'}, 1.7);
tl.fromTo(q('.arh'), {opacity: 0, y: -10}, {opacity: 1, y: 0, duration: 0.25}, 2.15);
wipe(tl, q('.arl'), 1.9, 2.5);
tl.fromTo(q('.l2'), {opacity: 0}, {opacity: 1, duration: 0.3}, 2.4);
tl.fromTo(q('.now'), {y: 40, opacity: 0, scale: 0.96}, {y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)'}, 2.5);
qa('.nw').forEach((el, i) => tl.fromTo(el, {backgroundSize: '0% 42%'}, {backgroundSize: '100% 42%', duration: 0.5, ease: 'power2.out'}, 3.1 + i * 0.1));
tl.fromTo(q('.why'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 3.8);
tl.fromTo(q('.spk'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.0);
driveSpark((t) => (t < 3.1 ? {name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4} : {name: 'cheer'}));
"""

ROUNDS = [  # was (old words in [..]), now (new words in [..]), why
    ('[I think] school uniforms are useful.', '[In my view,] school uniforms are useful.', 'формальнее вводит твою позицию: <b>In my view,</b>'),
    ('Sport is [very important] for teenagers.', 'Sport is [essential] for teenagers.', 'одно точное слово вместо <b>very + прилагательное</b>'),
    ('[A lot of] students use phones in class.', '[Many] students use phones in class.', '<b>a lot of</b> звучит разговорно — в эссе <b>many</b>'),
    ('[But] this idea has problems.', '[However,] this idea has problems.', 'в начале предложения — <b>However,</b> с запятой'),
    ('Cars [make the air dirty].', 'Cars [pollute the air].', 'точный глагол вместо описания: <b>pollute</b>'),
]


def mark(text, cls):
    return text.replace('[', f'<span class="{cls}">').replace(']', '</span>')


for i, (was, now, why) in enumerate(ROUNDS):
    cid = f's0{i + 2}'
    write(cid, scene(cid, '', head(f'ЗАМЕНА {i + 1}/5') +
                     '<div class="lab l1" style="top:210px">было</div>' + f'<div class="was">{mark(was, "ow")}</div>' + ARROW +
                     '<div class="lab l2" style="top:680px">стало</div>' + f'<div class="now">{mark(now, "nw")}</div>' +
                     f'<div class="why">{why}</div>' +
                     '<div class="spk" style="left:260px;top:520px;width:150px;height:150px"></div>' + dots(i),
                     HEAD_JS + SPARK_DRIVER + ROUND_JS + DOTS_JS, f'{cid} swap'))

# ================= 01 hook =================
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 150px/.95 'Manrope';letter-spacing:-.04em;color:#161311}
.big .ln{display:block;white-space:nowrap}
.sub1{position:absolute;left:90px;right:90px;top:505px;font:600 44px/1.3 'Inter';color:#6e6d6b}
.demo{position:absolute;left:90px;top:680px;width:900px;height:200px;border-radius:36px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.d1{position:absolute;left:150px;top:750px;font:600 48px/1 'Inter';color:#b60916;text-decoration:line-through;text-decoration-thickness:5px;white-space:nowrap}
.d2{position:absolute;left:630px;top:740px;font:800 64px/1 'Manrope';color:#161311;white-space:nowrap}
.da{position:absolute;left:540px;top:738px;font:800 64px/1 'Manrope';color:#de0b1b}
""", head('ESSAY') +
    '<div class="big"><span class="ln">' + words('Прокачай') + '</span><span class="ln" style="color:#de0b1b">' + words('фразу') + '</span></div>'
    '<div class="sub1">5 замен, чтобы эссе звучало точнее</div>'
    '<div class="demo"></div><div class="d1">very important</div><div class="da">→</div><div class="d2"><span class="nw">essential</span></div>'
    '<div class="hand" style="top:960px;left:90px">листай и сохраняй</div>'
    '<div class="spk" style="left:700px;top:950px;width:280px;height:280px"></div>' + dots(None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.45], 0.5);
tl.fromTo(q('.sub1'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.9);
tl.fromTo(q('.demo'), {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.3);
tl.fromTo(q('.d1'), {opacity: 0, textDecorationColor: 'rgba(182,9,22,0)'}, {opacity: 1, duration: 0.4}, 1.6);
tl.to(q('.d1'), {textDecorationColor: 'rgba(182,9,22,1)', duration: 0.3}, 2.2);
tl.fromTo(q('.da'), {x: -30, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 2.4);
tl.fromTo(q('.d2'), {x: 40, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 2.6);
tl.fromTo(q('.nw'), {backgroundSize: '0% 42%'}, {backgroundSize: '100% 42%', duration: 0.5, ease: 'power2.out'}, 3.0);
wipe(tl, q('.hand'), 3.4, 4.3);
tl.fromTo(q('.spk'), {y: 100, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 1.8);
""" + DOTS_JS + "driveSpark((t) => (t < 3.0 ? {name: 'think', lookX: Math.sin(t * 1.4) * 6} : {name: 'cheer', mood: 'wow'}));\n", '01 hook'))

# ================= 07 cheat sheet + CTA =================
rows = ''
for k, (a, b) in enumerate([('I think', 'In my view,'), ('very important', 'essential'), ('a lot of', 'many'), ('But …', 'However, …'), ('make … dirty', 'pollute')]):
    y = 330 + k * 92
    rows += (f'<div class="rw" style="{st(y, M, w=900, h=78)}">'
             f'<div style="{st(0, 0, w=900, h=78, extra="background:#fdfdfd;border-radius:22px;box-shadow:0 8px 24px rgba(22,19,17,.06);")}"></div>'
             f'<div style="{st(22, 32, w=360, extra=fnt(600, 36, 1, "Inter") + "color:#8c8b8a;white-space:nowrap;")}">{a}</div>'
             f'<div style="{st(18, 400, extra=fnt(800, 40, 1, "Manrope") + "color:#de0b1b;")}">→</div>'
             f'<div style="{st(20, 470, w=410, extra=fnt(800, 40, 1, "Manrope") + "color:#161311;white-space:nowrap;")}">{b}</div></div>')
write('s07', scene('s07', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 96px/1 'Manrope';letter-spacing:-.03em;color:#161311;white-space:nowrap}
.fx{position:absolute;left:90px;right:90px;top:840px;font:600 40px/1.3 'Inter';color:#6e6d6b}
""", head('ШПАРГАЛКА') + '<div class="ttl">' + words('Сохрани замены') + '</div>' + rows +
    '<div class="fx">Проверь своё эссе в тренажёре Writing — бесплатно</div>'
    '<div class="pill" style="top:1000px;left:90px">ссылка в профиле</div>'
    '<div class="spk" style="left:700px;top:960px;width:290px;height:290px"></div>' + dots('all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.25, 0.4], 0.5);
qa('.rw').forEach((el, i) => tl.fromTo(el, {x: -50, opacity: 0}, {x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}, 0.8 + i * 0.22));
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 2.2);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.6);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.4);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.6);
""" + DOTS_JS + "driveSpark((t) => ({name: 'cheer', phase: t * 1.5}));\n", '07 cta'))

# ---------- background ----------
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
    <title>ASHYQ — Прокачай фразу (карусель)</title>
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
