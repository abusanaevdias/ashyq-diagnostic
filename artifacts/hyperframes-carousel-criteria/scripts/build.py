# Generates compositions/*.html and index.html for the «Writing по 4 критериям» carousel (1080x1440).
# Seven 6 s slides: hook, the same Task 2 paragraph seen by each of the four official criteria, how the score adds up, CTA.
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




def dots4(cur):
    s, x0 = '<div class="dts">', W / 2 - 1.5 * 60
    for i in range(4):
        on = cur == 'all' or (isinstance(cur, int) and i <= cur)
        big = cur == i
        d = 28 if big else 18
        s += f'<i class="{"dn" if big or cur == "all" else ""}" style="{st(1300 + (0 if big else 5), x0 + i * 60 - d / 2, w=d, h=d, extra="border-radius:50%;background:" + ("#de0b1b" if on else "#e2e0da") + ";")}"></i>'
    return s + '</div>'


def quarters(k, size=150, cls='q4'):
    """Four quarters of a circle; quarter k (or all when k == 'all') red."""
    import math
    r, c = 70, 75
    out = f'<svg class="{cls}" viewBox="0 0 150 150">'
    for i in range(4):
        a0, a1 = math.radians(-90 + i * 90 + 2), math.radians(-90 + (i + 1) * 90 - 2)
        x0, y0, x1, y1 = c + r * math.cos(a0), c + r * math.sin(a0), c + r * math.cos(a1), c + r * math.sin(a1)
        on = k == 'all' or k == i
        out += (f'<path class="qq{i}" d="M{c} {c} L{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f} Z" '
                f'fill="{"#de0b1b" if on else "#efeeea"}" stroke="#f8f7f3" stroke-width="3"/>')
    return out + '</svg>'


QUESTION = 'Task 2 · Should students get homework every day?'
# paragraph with marker spans per criterion: {tag|text}
PARA = ('{task|In my view, daily homework does more harm than good.} {gram|{coh|Although} short tasks can {lex|consolidate} new material, '
        'a heavy {lex|workload} leaves students tired.} {coh|As a result,} schools should set homework only when it {lex|clearly supports} learning.')


def para(active):
    out, stack, i = '', [], 0
    while i < len(PARA):
        ch = PARA[i]
        if ch == '{':
            j = PARA.index('|', i)
            tag = PARA[i + 1:j]
            stack.append(tag)
            out += f'<span class="hl{" on" if tag == active else ""}"{" data-a" if tag == active else ""}>' if tag == active else '<span>'
            i = j + 1
        elif ch == '}':
            stack.pop()
            out += '</span>'
            i += 1
        else:
            out += ch
            i += 1
    return out


CRIT = [
    ('task', 'Ответ на вопрос', 'Task response', 'есть ли <b>ясная позиция</b> и отвечает ли текст на весь вопрос'),
    ('coh', 'Связность', 'Coherence and cohesion', '<b>логика</b> мыслей и <b>связки</b> между ними'),
    ('lex', 'Лексика', 'Lexical resource', '<b>точность</b> и разнообразие слов'),
    ('gram', 'Грамматика', 'Grammatical range and accuracy', '<b>разные конструкции</b> и точность грамматики'),
]
for k, (tag, ru, en, why) in enumerate(CRIT):
    cid = f's0{k + 2}'
    write(cid, scene(cid, '', head(f'КРИТЕРИЙ {k + 1}/4') +
                     f'<div class="cn">{words(ru)}</div><div class="ce">{en}</div>' + quarters(k) +
                     f'<div class="card"><div class="tq">{QUESTION}</div><div class="pp">{para(tag)}</div></div>' +
                     f'<div class="why">{why}</div>' +
                     '<div class="spk" style="left:830px;top:1180px;width:150px;height:150px"></div>' + dots4(k),
                     HEAD_JS + SPARK_DRIVER + f"""
rise(tl, S, '.cn .w', [0.2, 0.3, 0.4], 0.45);
tl.fromTo(q('.ce'), {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, 0.5);
tl.fromTo(q('.q4'), {{scale: 0.5, opacity: 0, rotation: -60}}, {{scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)'}}, 0.6);
tl.fromTo(q('.card'), {{y: 40, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}}, 0.8);
qa('[data-a]').forEach((el, i) => tl.fromTo(el, {{backgroundSize: '0% 45%'}}, {{backgroundSize: '100% 45%', duration: 0.55, ease: 'power2.out'}}, 1.7 + i * 0.35));
tl.fromTo(q('.why'), {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, 3.2);
tl.fromTo(q('.spk'), {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}}, 3.4);
""" + DOTS_JS + "driveSpark((t) => ({name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4}));\n", f'{cid} criterion'))

# ================= 01 hook =================
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 128px/.96 'Manrope';letter-spacing:-.04em;color:#161311}
.big .ln{display:block;white-space:nowrap}
.sub1{position:absolute;left:90px;right:90px;top:470px;font:600 44px/1.3 'Inter';color:#6e6d6b}
.qbig{position:absolute;left:90px;top:640px;width:420px;height:420px}
.lg{position:absolute;left:570px;font:800 40px/1.1 'Manrope';color:#161311;white-space:nowrap}
.lg i{display:inline-block;width:26px;height:26px;border-radius:6px;background:#de0b1b;margin-right:16px;vertical-align:-2px}
""", head('WRITING') +
    '<div class="big"><span class="ln">' + words('Как проверяют') + '</span><span class="ln" style="color:#de0b1b">' + words('Writing') + '</span></div>'
    '<div class="sub1">4 критерия с равным весом — каждый смотрит на своё</div>' +
    quarters('all', cls='qbig') +
    ''.join(f'<div class="lg" style="top:{680 + k * 95}px"><i></i>{ru}</div>' for k, (_t, ru, _e, _w) in enumerate(CRIT)) +
    '<div class="hand" style="top:1110px;left:90px">разберём на одном абзаце</div>' +
    '<div class="spk" style="left:820px;top:1080px;width:170px;height:170px"></div>' + dots4(None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.4, 0.55], 0.5);
tl.fromTo(q('.sub1'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.9);
tl.fromTo(q('.qbig'), {rotation: -90, scale: 0.8, opacity: 0}, {rotation: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.6)'}, 1.1);
[0, 1, 2, 3].forEach((i) => tl.fromTo(q('.qbig .qq' + i), {opacity: 0}, {opacity: 1, duration: 0.3}, 1.3 + i * 0.3));
qa('.lg').forEach((el, i) => tl.fromTo(el, {x: 40, opacity: 0}, {x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}, 1.45 + i * 0.3));
wipe(tl, q('.hand'), 3.2, 4.4);
tl.fromTo(q('.spk'), {y: 80, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 3.0);
""" + DOTS_JS + "driveSpark((t) => ({name: 'wave', phase: t * 1.6}));\n", '01 hook'))

# ================= 06 how it adds up =================
tiles = ''
for k, (_t, ru, en, _w) in enumerate(CRIT):
    x, y = M + (k % 2) * 460, 330 + (k // 2) * 210
    tiles += (f'<div class="tl{k}" style="{st(y, x, w=440, h=190, extra="background:#fdfdfd;border-radius:30px;box-shadow:0 12px 40px rgba(22,19,17,.08);")}">'
              f'<div style="{st(34, 34, extra=fnt(800, 40, 1.1, "Manrope") + "color:#161311;white-space:nowrap;")}">{ru}</div>'
              f'<div style="{st(118, 34, extra=fnt(800, 44, 1, "Manrope") + "color:#de0b1b;")}">¼</div></div>')
write('s06', scene('s06', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 84px/1 'Manrope';letter-spacing:-.025em;color:#161311;white-space:nowrap}
.eq{position:absolute;left:90px;top:790px;width:900px;padding:36px 44px;border-radius:32px;background:#161311;color:#fdfdfd;font:800 50px/1.2 'Manrope';letter-spacing:-.01em}
.eq span{color:#f9e0db}
.t2{position:absolute;left:90px;top:1000px;width:900px;padding:28px 36px 28px 44px;border-radius:30px;background:#fdfdfd;border-left:10px solid #de0b1b;box-shadow:0 12px 40px rgba(22,19,17,.08);font:600 38px/1.3 'Inter';color:#161311}
.t2 b{font-family:'Manrope';font-weight:800}
.src{position:absolute;left:90px;top:1200px;font:500 26px/1 'Inter';color:#8c8b8a}
""", head('ИТОГ') + '<div class="ttl">' + words('Как складывается') + '</div>' + tiles +
    '<div class="eq">оценка за задание = <span>среднее</span> из четырёх</div>'
    '<div class="t2"><b>Task 2</b> весит больше, чем <b>Task 1</b></div>'
    '<div class="src">Источник: ielts.org · IELTS scoring in detail</div>' + dots4('all'),
    HEAD_JS + """
rise(tl, S, '.ttl .w', [0.25, 0.4], 0.5);
[0, 1, 2, 3].forEach((i) => tl.fromTo(q('.tl' + i), {y: 40, opacity: 0, scale: 0.92}, {y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)'}, 0.8 + i * 0.25));
tl.fromTo(q('.eq'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}, 2.1);
tl.fromTo(q('.t2'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 2.9);
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 3.5);
""" + DOTS_JS, '06 total'))

# ================= 07 CTA =================
write('s07', scene('s07', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 96px/1.02 'Manrope';letter-spacing:-.03em;color:#161311}
.ttl .ln{display:block;white-space:nowrap}
.fx{position:absolute;left:90px;right:90px;top:540px;font:600 42px/1.3 'Inter';color:#6e6d6b}
.chips{position:absolute;left:90px;top:700px;width:900px}
.chips span{display:inline-block;margin:0 14px 14px 0;padding:14px 26px;border-radius:18px;background:#e8efe2;color:#2e5e3a;font:600 34px/1 'Inter'}
""", head('ТРЕНАЖЁР') +
    '<div class="ttl"><span class="ln">' + words('Проверь своё') + '</span><span class="ln">' + words('эссе по этим') + '</span><span class="ln" style="color:#de0b1b">' + words('4 критериям') + '</span></div>'
    '<div class="fx">Тренажёр Writing — бесплатно</div>'
    '<div class="chips">' + ''.join(f'<span>{ru}</span>' for _t, ru, _e, _w in CRIT) + '</div>'
    '<div class="pill" style="top:890px;left:90px">ссылка в профиле</div>'
    '<div class="hand" style="top:1010px;left:90px">сохрани, чтобы не забыть</div>'
    '<div class="spk" style="left:700px;top:960px;width:290px;height:290px"></div>' + dots4('all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.25, 0.35, 0.5, 0.6, 0.75, 0.85, 0.95], 0.5);
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.3);
qa('.chips span').forEach((el, i) => tl.fromTo(el, {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.4)'}, 1.7 + i * 0.15));
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.5);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.4);
wipe(tl, q('.hand'), 3.0, 4.0);
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
    <title>ASHYQ — Writing по 4 критериям (карусель)</title>
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
