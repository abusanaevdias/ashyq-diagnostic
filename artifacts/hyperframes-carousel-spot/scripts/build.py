# Generates compositions/*.html and index.html for the «Найди ошибку за 3 секунды» carousel (1080x1440).
# Seven 6 s slides: rules, five rounds (phrase → 3 s ring timer → wrong words struck, fix above, rule below), score + CTA.
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
T0, T1 = 0.9, 3.9          # ring timer runs 3 s
T_FIX = 4.0


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
.card{position:absolute;left:90px;top:230px;width:900px;height:520px;background:#fdfdfd;border-radius:40px;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.ph{position:absolute;left:150px;right:150px;top:290px;font:800 66px/1.22 'Manrope';letter-spacing:-.02em;color:#161311}
.ph .in{display:block}
.bm{overflow:visible}
.bad{position:relative;display:inline-block;line-height:1.1}
.bad .strk{position:absolute;left:-6px;right:-6px;top:52%;height:10px;border-radius:5px;background:#de0b1b;transform-origin:0 50%}
.ok{position:absolute;left:130px;right:130px;top:560px;padding:22px 28px;border-radius:24px;background:#e8efe2;color:#2e5e3a;font:600 44px/1.25 'Inter'}
.ok b{font-family:'Manrope';font-weight:800;text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:6px;white-space:nowrap}
.ok .ck{font-family:'Manrope';font-weight:800;margin-right:10px}
.ring{position:absolute;left:440px;top:800px;width:200px;height:200px}
.rnum{position:absolute;left:440px;top:800px;width:200px;height:200px;display:flex;align-items:center;justify-content:center;font:800 96px/1 'Manrope';color:#161311}
.rule{position:absolute;left:90px;top:1060px;width:900px;padding:30px 36px 30px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #2e5e3a;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 40px/1.3 'Inter';color:#161311}
.rule b{font-family:'Manrope';font-weight:800;color:#2e5e3a;white-space:nowrap}
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


def phrase(before, bad, fix, after):
    """Words before/after rise in; the wrong part gets struck; the corrected sentence appears below in green."""
    parts = []
    if before:
        parts.append(words(before))
    parts.append(f'<span class="m bm"><span class="w bad">{bad}<i class="strk"></i></span></span>')
    if after:
        parts.append(words(after))
    good = fix  # the whole corrected sentence, with the changed words in <b>
    return f'<div class="ph"><span class="in">{" ".join(parts)}</span></div><div class="ok"><span class="ck">✓</span>{good}</div>'


RING = ('<svg class="ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="#fdfdfd" stroke="#efeeea" stroke-width="16"/>'
        '<path class="rarc" d="M100 14 A86 86 0 1 1 99.9 14" fill="none" stroke="#de0b1b" stroke-width="16" stroke-linecap="round" '
        'pathLength="1" stroke-dasharray="1"/></svg><div class="rnum">3</div>')

ROUND_JS = f"""
rise(tl, S, '.ph .w:not(.bad)', [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78], 0.45);
tl.fromTo(q('.bad'), {{yPercent: 115, opacity: 0}}, {{yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out'}}, 0.5);
tl.fromTo(q('.card'), {{y: 40, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}}, 0.15);
tl.fromTo(q('.ring'), {{scale: 0.6, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)'}}, 0.6);
tl.fromTo(q('.rnum'), {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, 0.7);
tl.to({{v: 0}}, {{v: 1, duration: {T1 - T0}, ease: 'none', onUpdate() {{
  const v = this.targets()[0].v;
  q('.rnum').textContent = String(Math.max(0, Math.ceil(3 * (1 - v) - 1e-6)));
  q('.rarc').setAttribute('stroke-dashoffset', String(v));
}}}}, {T0});
tl.to([q('.ring'), q('.rnum')], {{opacity: 0.35, duration: 0.3}}, {T1 + 0.05});
tl.to(q('.bad'), {{color: '#de0b1b', duration: 0.2}}, {T_FIX});
tl.fromTo(q('.strk'), {{scaleX: 0}}, {{scaleX: 1, duration: 0.3, ease: 'power2.inOut'}}, {T_FIX + 0.05});
tl.fromTo(q('.ok'), {{y: 24, opacity: 0, scale: 0.94}}, {{y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)'}}, {T_FIX + 0.3});
tl.fromTo(q('.rule'), {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, {T_FIX + 0.7});
tl.fromTo(q('.spk'), {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}}, 0.8);
driveSpark((t) => (t < {T_FIX} ? {{name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4}} : {{name: 'cheer'}}));
"""

ROUNDS = [  # before, wrong part, corrected sentence (changed words in <b>), after, rule
    ('She', "don't", "She <b>doesn't</b> like maths.", 'like maths.', '3-е лицо ед. ч.: she / he / it → <b>does not</b>'),
    ('I', 'am living', 'I <b>have lived</b> in Almaty since 2015.', 'in Almaty since 2015.', '<b>since</b> + до сейчас → Present Perfect'),
    ('He', 'explained me', 'He <b>explained the rule to me</b>.', 'the rule.', 'explain <b>что-то to кому-то</b>'),
    ('Can you give me', 'an advice?', 'Can you give me <b>some advice</b>?', '', '<b>advice</b> — неисчисляемое: без a / an'),
    ('I look forward to', 'see', 'I look forward to <b>seeing</b> you.', 'you.', 'look forward to + <b>-ing</b>'),
]
for i, (b, bad, fix, a, rule) in enumerate(ROUNDS):
    cid = f's0{i + 2}'
    write(cid, scene(cid, '', head(f'ОШИБКА {i + 1}/5') + '<div class="card"></div>' + phrase(b, bad, fix, a) + RING +
                     '<div class="spk" style="left:760px;top:815px;width:170px;height:170px"></div>' +
                     f'<div class="rule">{rule}</div>' + dots(i),
                     HEAD_JS + SPARK_DRIVER + ROUND_JS + DOTS_JS, f'{cid} round'))

# ================= 01 rules =================
steps = ''
for k, (n, t) in enumerate([('1', 'читай фразу'), ('2', 'ищи ошибку, пока идёт таймер'), ('3', 'ответ появится сам — листай дальше')]):
    y = 620 + k * 120
    steps += (f'<div class="stp" style="{st(y, M, w=900, h=100)}">'
              f'<div style="{st(0, 0, w=100, h=100, extra="border-radius:50%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;" + fnt(800, 50, 1, "Manrope"))}">{n}</div>'
              f'<div style="{st(28, 130, extra=fnt(600, 42, 1, "Inter") + "color:#161311;white-space:nowrap;")}">{t}</div></div>')
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 118px/.98 'Manrope';letter-spacing:-.035em;color:#161311}
.big .ln{display:block;white-space:nowrap}
""", head('ИГРА') +
    '<div class="big"><span class="ln">' + words('Найди') + '</span><span class="ln">' + words('ошибку') + '</span><span class="ln">'
    + '<span class="m"><span class="w">за</span></span> <span class="m"><span class="w" style="color:#de0b1b">3</span></span> <span class="m"><span class="w">секунды</span></span></span></div>'
    + steps + '<div class="hand" style="top:1010px;left:90px">считай, сколько нашёл</div>'
    + '<div class="spk" style="left:720px;top:1010px;width:250px;height:250px"></div>' + dots(None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.4, 0.6, 0.7, 0.8], 0.5);
qa('.stp').forEach((el, i) => tl.fromTo(el, {x: -60, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.5 + i * 0.35));
wipe(tl, q('.hand'), 3.0, 4.0);
tl.fromTo(q('.spk'), {y: 100, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 2.6);
""" + DOTS_JS + "driveSpark((t) => ({name: 'think', lookX: Math.sin(t * 1.4) * 6}));\n", '01 rules'))

# ================= 07 score + CTA =================
score = ''
for k in range(6):
    x = M + k * 156
    score += f'<div class="sc" style="{st(430, x, w=120, h=120, extra="border-radius:50%;border:6px solid #161311;display:flex;align-items:center;justify-content:center;" + fnt(800, 60, 1, "Manrope") + "color:#161311;background:#fdfdfd;")}">{k}</div>'
write('s07', scene('s07', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 120px/1 'Manrope';letter-spacing:-.035em;color:#161311;white-space:nowrap}
.fx{position:absolute;left:90px;right:90px;top:760px;font:600 42px/1.3 'Inter';color:#6e6d6b}
""", head('СЧЁТ') + '<div class="ttl">' + words('Сколько из 5?') + '</div>' + score +
    '<div class="hand" style="top:600px;left:90px">напиши счёт в комментариях</div>'
    '<div class="fx">Бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:920px;left:90px">ссылка в профиле</div>'
    '<div class="spk" style="left:640px;top:950px;width:320px;height:320px"></div>' + dots('all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.25, 0.4, 0.55], 0.5);
qa('.sc').forEach((el, i) => tl.fromTo(el, {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.6)'}, 0.9 + i * 0.12));
wipe(tl, q('.hand'), 1.8, 2.9);
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 2.6);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 3.0);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.8);
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
    <title>ASHYQ — Найди ошибку за 3 секунды (карусель)</title>
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
