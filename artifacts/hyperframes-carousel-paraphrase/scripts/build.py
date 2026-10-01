# Generates compositions/*.html and index.html for the «Перефраз в Reading» carousel (1080x1440).
# Seven 6 s slides: hook, five paraphrase types (question ≈ text with matching markers + tip), cheat sheet + CTA.
# scripts/export.sh cuts the rendered strip into slides and prepends the 200 ms poster (see ../CAROUSELS.md).
#   python3 scripts/build.py
import os, re, sys
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
.cn{position:absolute;left:90px;top:180px;font:800 84px/1 'Manrope';letter-spacing:-.025em;color:#161311;white-space:nowrap}
.ce{position:absolute;left:92px;top:280px;font:600 32px/1 'Inter';color:#8c8b8a;white-space:nowrap}
.q4{position:absolute;right:90px;top:180px;width:150px;height:150px}
.card{position:absolute;left:90px;top:350px;width:900px;padding:40px 48px 44px;border-radius:36px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.card .tq{font:600 28px/1.3 'Inter';color:#8c8b8a;margin-bottom:18px}
.card .pp{font:500 41px/1.5 'Inter';color:#161311}
.hl{background-image:linear-gradient(#f9e0db,#f9e0db);background-repeat:no-repeat;background-position:0 90%;background-size:0% 45%;padding:0 3px;border-radius:6px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.hl.on{font-weight:600}
.why{position:absolute;left:90px;top:910px;width:900px;padding:28px 36px 28px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #2e5e3a;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 38px/1.3 'Inter';color:#161311}
.why b{font-family:'Manrope';font-weight:800;color:#2e5e3a}
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




def dotsn(n, cur):
    s, x0 = '<div class="dts">', W / 2 - (n - 1) / 2 * 60
    for i in range(n):
        on = cur == 'all' or (isinstance(cur, int) and i <= cur)
        big = cur == i
        d = 28 if big else 18
        s += f'<i class="{"dn" if big or cur == "all" else ""}" style="{st(1300 + (0 if big else 5), x0 + i * 60 - d / 2, w=d, h=d, extra="border-radius:50%;background:" + ("#de0b1b" if on else "#e2e0da") + ";")}"></i>'
    return s + '</div>'



BASE = """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 84px/1.02 'Manrope';letter-spacing:-.025em;color:#161311}
.ttl .ln{display:block;white-space:nowrap}
.src{position:absolute;left:90px;font:500 26px/1.3 'Inter';color:#8c8b8a}
.tip{position:absolute;left:90px;width:900px;padding:26px 36px 26px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #2e5e3a;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 36px/1.3 'Inter';color:#161311}
.tip b{font-family:'Manrope';font-weight:800;color:#2e5e3a}
"""


def title(lines):
    return '<div class="ttl">' + ''.join(f'<span class="ln">{words(l)}</span>' for l in lines) + '</div>'


def ttl_js(n, at=0.25):
    return f"rise(tl, S, '.ttl .w', {[round(at + k * 0.12, 2) for k in range(n)]}, 0.5);\n"



PP = """
.qc{position:absolute;left:90px;top:320px;width:900px;padding:30px 44px 36px;border-radius:32px;background:#161311;color:#fdfdfd}
.qc .lb,.tc .lb{font:600 26px/1.2 'Inter';margin-bottom:14px}
.qc .lb{color:#b9b6b0}
.qc .ss{font:800 50px/1.3 'Manrope';letter-spacing:-.01em}
.eq{position:absolute;left:490px;top:585px;width:100px;height:100px;border-radius:50%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;font:800 60px/1 'Manrope'}
.tc{position:absolute;left:90px;top:710px;width:900px;padding:30px 44px 36px;border-radius:32px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.tc .lb{color:#8c8b8a}
.tc .ss{font:500 46px/1.4 'Inter';color:#161311}
.m1,.m2{background-repeat:no-repeat;background-position:0 92%;background-size:0% 46%;padding:0 3px;border-radius:6px}
.qc .m1{background-image:linear-gradient(rgba(222,11,27,.55),rgba(222,11,27,.55))}
.qc .m2{background-image:linear-gradient(rgba(46,94,58,.75),rgba(46,94,58,.75))}
.tc .m1{background-image:linear-gradient(#f9e0db,#f9e0db);font-weight:700}
.tc .m2{background-image:linear-gradient(#d9e8cf,#d9e8cf);font-weight:700}
"""


def mk(s):
    return re.sub(r'\{(\d)\|([^}]*)\}', r'<span class="m\1">\2</span>', s)


PAIRS = [
    ('Синоним', 'The {2|number of visitors} {1|increased}.', '{2|Visitor numbers} {1|rose} sharply last year.',
     'одно и то же разными словами: <b>increased = rose</b>'),
    ('Другая часть речи', 'The museum {1|decided} to {2|expand}.', 'The museum’s {1|decision} to {2|build a new wing} was made in May.',
     'глагол → существительное: <b>decided → decision</b>'),
    ('Общее ↔ конкретное', '{1|Young people} prefer {2|online} news.', '{1|Teenagers and students} tend to read news {2|on their phones}.',
     '<b>young people</b> = teenagers and students'),
    ('Отрицание ↔ антоним', 'The bridge was {1|not expensive} to build.', 'The bridge was built at a {1|low cost}.',
     '<b>not + слово</b> = слово с обратным смыслом'),
    ('Пассив + синонимы', '{1|Scientists} {2|discovered} the virus in 1983.', 'The virus was first {2|identified} by {1|researchers} in 1983.',
     '<b>кто сделал</b> ↔ <b>что было сделано кем</b>'),
]
for k, (ttl, qs, ts, tip) in enumerate(PAIRS):
    cid = f's0{k + 2}'
    write(cid, scene(cid, BASE + PP, head(f'ПЕРЕФРАЗ {k + 1}/5') + title([ttl]) +
                     f'<div class="qc"><div class="lb">В вопросе</div><div class="ss">{mk(qs)}</div></div>'
                     '<div class="eq">≈</div>'
                     f'<div class="tc"><div class="lb">В тексте</div><div class="ss">{mk(ts)}</div></div>'
                     f'<div class="tip" style="top:1010px">{tip}</div>'
                     '<div class="spk" style="left:860px;top:1190px;width:120px;height:120px"></div>' + dotsn(5, k),
                     HEAD_JS + SPARK_DRIVER + ttl_js(len(ttl.split())) + """
tl.fromTo(q('.qc'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.6);
tl.fromTo(q('.eq'), {scale: 0, rotation: -90}, {scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.4)'}, 1.1);
tl.fromTo(q('.tc'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.4);
qa('.m1').forEach((el) => tl.fromTo(el, {backgroundSize: '0% 46%'}, {backgroundSize: '100% 46%', duration: 0.5, ease: 'power2.out'}, 2.2));
qa('.m2').forEach((el) => tl.fromTo(el, {backgroundSize: '0% 46%'}, {backgroundSize: '100% 46%', duration: 0.5, ease: 'power2.out'}, 2.8));
tl.fromTo(q('.tip'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 3.4);
tl.fromTo(q('.spk'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 3.6);
""" + DOTS_JS + "driveSpark((t) => ({name: 'cheer'}));\n", f'{cid} pair'))

# ================= 01 hook =================
write('s01', scene('s01', BASE + PP + """
.big{position:absolute;left:90px;top:190px;font:800 140px/.95 'Manrope';letter-spacing:-.04em;color:#161311}
.big .ln{display:block;white-space:nowrap}
.sub1{position:absolute;left:90px;right:90px;top:490px;font:600 44px/1.3 'Inter';color:#6e6d6b}
.d{position:absolute;top:700px;height:120px;padding:0 40px;border-radius:30px;display:flex;align-items:center;font:800 56px/1 'Manrope';white-space:nowrap}
""", head('READING') +
    '<div class="big"><span class="ln">' + words('Перефраз') + '</span><span class="ln" style="color:#de0b1b">' + words('в Reading') + '</span></div>'
    '<div class="sub1">В вопросе одни слова, в тексте — другие. Смысл тот же</div>'
    '<div class="d d1" style="left:90px;background:#161311;color:#fdfdfd">increased</div>'
    '<div class="eq" style="left:470px;top:710px">≈</div>'
    '<div class="d d2" style="left:640px;background:#fdfdfd;color:#161311;box-shadow:0 20px 60px rgba(22,19,17,.1)">rose</div>'
    '<div class="hand" style="top:900px;left:90px">ищи смысл, а не те же слова</div>'
    '<div class="spk" style="left:740px;top:1010px;width:240px;height:240px"></div>' + dotsn(5, None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.4, 0.55], 0.5);
tl.fromTo(q('.sub1'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.9);
tl.fromTo(q('.d1'), {x: -40, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 1.5);
tl.fromTo(q('.eq'), {scale: 0, rotation: -90}, {scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.4)'}, 1.9);
tl.fromTo(q('.d2'), {x: 40, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 2.2);
wipe(tl, q('.hand'), 2.8, 3.9);
tl.fromTo(q('.spk'), {y: 100, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 2.6);
""" + DOTS_JS + "driveSpark((t) => ({name: 'think', lookX: Math.sin(t * 1.4) * 6}));\n", '01 hook'))

# ================= 07 cheat sheet + CTA =================
rows = ''
for k, (ttl, _q, _t, _tip) in enumerate(PAIRS):
    ex = ['increased ≈ rose', 'decided ≈ decision', 'young people ≈ teenagers', 'not expensive ≈ low cost', 'discovered ≈ was identified'][k]
    y = 330 + k * 92
    rows += (f'<div class="rw" style="{st(y, M, w=900, h=78, extra="background:#fdfdfd;border-radius:22px;box-shadow:0 8px 24px rgba(22,19,17,.06);")}">'
             f'<div style="{st(22, 30, w=400, extra=fnt(600, 32, 1, "Inter") + "color:#6e6d6b;white-space:nowrap;")}">{ttl}</div>'
             f'<div style="{st(21, 420, w=460, extra="text-align:right;" + fnt(800, 34, 1, "Manrope") + "color:#161311;white-space:nowrap;")}">{ex}</div></div>')
write('s07', scene('s07', BASE + """
.fx{position:absolute;left:90px;right:90px;top:820px;font:600 42px/1.3 'Inter';color:#6e6d6b}
""", head('ШПАРГАЛКА') + title(['5 видов перефраза']) + rows +
    '<div class="fx">Проверь свой Reading: бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:990px;left:90px">ссылка в профиле</div>'
    '<div class="spk" style="left:700px;top:980px;width:280px;height:280px"></div>' + dotsn(5, 'all'),
    HEAD_JS + SPARK_DRIVER + ttl_js(3) + """
qa('.rw').forEach((el, i) => tl.fromTo(el, {x: -50, opacity: 0}, {x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}, 0.8 + i * 0.22));
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 2.2);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.7);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.5);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.8);
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
    <title>ASHYQ — Перефраз в Reading (карусель)</title>
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

