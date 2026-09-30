# Generates compositions/*.html and index.html for the «True / False / Not Given» carousel (1080x1440).
# Seven 6 s slides: hook, the official rule, four practice statements on one mini-text, CTA.
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


TF_CSS = """
.tx{position:absolute;left:90px;top:190px;width:900px;padding:34px 44px 38px;border-radius:36px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.tx .lb{font:600 26px/1.2 'Inter';color:#8c8b8a;margin-bottom:14px}
.tx .pp{font:500 40px/1.45 'Inter';color:#161311}
.ev{background-image:linear-gradient(#f9e0db,#f9e0db);background-repeat:no-repeat;background-position:0 90%;background-size:0% 45%;padding:0 3px;border-radius:6px}
.st{position:absolute;left:90px;top:620px;width:900px;padding:30px 44px 34px;border-radius:32px;background:#161311;color:#fdfdfd}
.st .lb{font:600 26px/1.2 'Inter';color:#b9b6b0;margin-bottom:12px}
.st .ss{font:800 48px/1.2 'Manrope';letter-spacing:-.015em}
.bt{position:absolute;top:915px;width:280px;height:110px;border-radius:26px;border:4px solid #161311;background:#fdfdfd;display:flex;align-items:center;justify-content:center;font:800 40px/1 'Manrope';color:#161311;white-space:nowrap}
.why{position:absolute;left:90px;top:1060px;width:900px;padding:26px 36px 26px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #2e5e3a;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 36px/1.3 'Inter';color:#161311}
.why b{font-family:'Manrope';font-weight:800;color:#2e5e3a}
"""
COLORS = {'TRUE': '#2e5e3a', 'FALSE': '#de0b1b', 'NOT GIVEN': '#161311'}
TEXT = 'The Almaty Book Fair opened in 2019. It takes place {a|every autumn} and lasts {b|three days}. {c|Entry is free for students}, but adults pay a small fee.'


def text(active):
    import re
    def rep(m):
        return f'<span class="ev">{m.group(2)}</span>' if m.group(1) == active else m.group(2)
    return re.sub(r'\{(\w)\|([^}]*)\}', rep, TEXT)


ROUNDS = [
    ('The fair takes place in autumn.', 'TRUE', 'a', 'в тексте то же самое: <b>every autumn</b>'),
    ('The fair lasts one week.', 'FALSE', 'b', 'текст <b>спорит</b>: там three days, а не неделя'),
    ('The fair is the largest in Kazakhstan.', 'NOT GIVEN', None, 'о размере ярмарки текст <b>молчит</b> — ни да, ни нет'),
    ('Students do not pay to enter.', 'TRUE', 'c', 'другие слова, тот же смысл: <b>перефраз</b> — тоже TRUE'),
]
for k, (stmt, ans, ev, why) in enumerate(ROUNDS):
    cid = f's0{k + 3}'
    btns = ''
    for j, lab in enumerate(['TRUE', 'FALSE', 'NOT GIVEN']):
        cls = 'bt ok' if lab == ans else 'bt no'
        btns += f'<div class="{cls}" style="left:{M + j * 310}px">{lab}</div>'
    col = COLORS[ans]
    write(cid, scene(cid, TF_CSS, head(f'УТВЕРЖДЕНИЕ {k + 1}/4') +
                     f'<div class="tx"><div class="lb">Текст · учебный пример, ярмарка вымышленная</div><div class="pp">{text(ev)}</div></div>'
                     f'<div class="st"><div class="lb">Утверждение</div><div class="ss">{stmt}</div></div>' + btns +
                     f'<div class="why">{why}</div>' +
                     '<div class="spk" style="left:860px;top:1205px;width:120px;height:120px"></div>' + dotsn(4, k),
                     HEAD_JS + SPARK_DRIVER + f"""
tl.fromTo(q('.tx'), {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, 0.2);
tl.fromTo(q('.st'), {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, 0.9);
qa('.bt').forEach((el, i) => tl.fromTo(el, {{scale: 0.7, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.4)'}}, 1.4 + i * 0.15));
tl.fromTo(q('.spk'), {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}}, 1.6);
tl.to(qa('.bt.no'), {{opacity: 0.3, duration: 0.3}}, 3.4);
tl.to(q('.bt.ok'), {{backgroundColor: '{col}', borderColor: '{col}', color: '#fdfdfd', duration: 0.25}}, 3.4);
tl.fromTo(q('.bt.ok'), {{scale: 1}}, {{scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut'}}, 3.4);
qa('.ev').forEach((el) => tl.fromTo(el, {{backgroundSize: '0% 45%'}}, {{backgroundSize: '100% 45%', duration: 0.5, ease: 'power2.out'}}, 3.7));
tl.fromTo(q('.why'), {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, 4.0);
""" + DOTS_JS + "driveSpark((t) => (t < 3.4 ? {name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4} : {name: 'cheer'}));\n", f'{cid} round'))

# ================= 02 rules =================
rules = ''
for k, (lab, ru, en) in enumerate([('TRUE', 'текст говорит <b>то же самое</b>', 'agrees with the information'),
                                    ('FALSE', 'текст говорит <b>обратное</b>', 'contradicts the information'),
                                    ('NOT GIVEN', 'в тексте об этом <b>нет информации</b>', 'there is no information on this')]):
    y = 330 + k * 250
    rules += (f'<div class="rr" style="{st(y, M, w=900, h=220, extra="background:#fdfdfd;border-radius:32px;box-shadow:0 12px 40px rgba(22,19,17,.08);")}">'
              f'<div style="{st(34, 34, h=66, extra="padding:0 26px;border-radius:18px;display:flex;align-items:center;background:" + COLORS[lab] + ";color:#fdfdfd;" + fnt(800, 36, 1, "Manrope") + "white-space:nowrap;")}">{lab}</div>'
              f'<div class="rt" style="{st(118, 34, w=830, extra=fnt(600, 40, 1.2, "Inter") + "color:#161311;")}">{ru}</div>'
              f'<div style="{st(46, 360, w=510, extra="text-align:right;" + fnt(500, 26, 1, "Inter") + "color:#8c8b8a;white-space:nowrap;font-style:italic;")}">{en}</div></div>')
write('s02', scene('s02', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 84px/1 'Manrope';letter-spacing:-.025em;color:#161311;white-space:nowrap}
.rt b{font-family:'Manrope';font-weight:800}
.src{position:absolute;left:90px;top:1110px;font:500 26px/1.3 'Inter';color:#8c8b8a}
""", head('ПРАВИЛО') + '<div class="ttl">' + words('Три ответа') + '</div>' + rules +
    '<div class="src">Формулировки — из инструкции к заданию IELTS Reading</div>'
    '<div class="hand" style="top:1160px;left:90px">False спорит, Not Given молчит</div>' + dotsn(4, None),
    HEAD_JS + """
rise(tl, S, '.ttl .w', [0.25, 0.4], 0.5);
qa('.rr').forEach((el, i) => tl.fromTo(el, {x: -60, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.8 + i * 0.45));
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 2.5);
wipe(tl, q('.hand'), 3.0, 4.2);
""" + DOTS_JS, '02 rules'))

# ================= 01 hook =================
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 128px/.98 'Manrope';letter-spacing:-.04em;color:#161311}
.big .ln{display:block;white-space:nowrap}
.sub1{position:absolute;left:90px;right:90px;top:610px;font:600 44px/1.3 'Inter';color:#6e6d6b}
.pl{position:absolute;top:780px;height:100px;padding:0 34px;border-radius:26px;display:flex;align-items:center;font:800 42px/1 'Manrope';color:#fdfdfd;white-space:nowrap}
""", head('READING') +
    '<div class="big"><span class="ln">' + words('True, False') + '</span><span class="ln">' + words('или') + '</span><span class="ln" style="color:#de0b1b">' + words('Not Given?') + '</span></div>'
    '<div class="sub1">Правило и 4 утверждения на тренировку</div>'
    '<div class="pl" style="left:90px;background:#2e5e3a">TRUE</div><div class="pl" style="left:320px;background:#de0b1b">FALSE</div><div class="pl" style="left:580px;background:#161311">NOT GIVEN</div>'
    '<div class="hand" style="top:960px;left:90px">листай и отвечай про себя</div>'
    '<div class="spk" style="left:720px;top:960px;width:260px;height:260px"></div>' + dotsn(4, None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.4, 0.55, 0.7, 0.85], 0.5);
tl.fromTo(q('.sub1'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.2);
qa('.pl').forEach((el, i) => tl.fromTo(el, {y: 40, opacity: 0, scale: 0.8}, {y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.2)'}, 1.7 + i * 0.25));
wipe(tl, q('.hand'), 2.8, 3.9);
tl.fromTo(q('.spk'), {y: 100, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 2.4);
""" + DOTS_JS + "driveSpark((t) => ({name: 'think', lookX: Math.sin(t * 1.4) * 6}));\n", '01 hook'))

# ================= 07 CTA =================
write('s07', scene('s07', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 100px/1.02 'Manrope';letter-spacing:-.03em;color:#161311;white-space:nowrap}
.sm{position:absolute;left:90px;top:330px;width:900px;padding:34px 44px;border-radius:32px;background:#161311;color:#fdfdfd;font:600 38px/1.4 'Inter'}
.sm b{font-family:'Manrope';font-weight:800;color:#f9e0db}
.fx{position:absolute;left:90px;right:90px;top:560px;font:600 42px/1.3 'Inter';color:#6e6d6b}
""", head('ИТОГ') + '<div class="ttl">' + words('Сколько из 4?') + '</div>'
    '<div class="sm"><b>FALSE</b> — текст спорит с утверждением.<br><b>NOT GIVEN</b> — текст об этом молчит.</div>'
    '<div class="fx">Узнай свой уровень: бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:720px;left:90px">ссылка в профиле</div>'
    '<div class="hand" style="top:860px;left:90px">напиши счёт в комментариях</div>'
    '<div class="spk" style="left:680px;top:980px;width:300px;height:300px"></div>' + dotsn(4, 'all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.25, 0.4, 0.55], 0.5);
tl.fromTo(q('.sm'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}, 0.8);
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.6);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.1);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.3);
wipe(tl, q('.hand'), 2.6, 3.7);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.4);
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
    <title>ASHYQ — True / False / Not Given (карусель)</title>
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

