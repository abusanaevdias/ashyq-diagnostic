# Generates compositions/*.html and index.html for the «Speaking Part 2: минута на подготовку» carousel (1080x1440).
# Seven 6 s slides: hook, official Part 2 format, sample cue card, notes in one minute, two-minute plan, bridge phrases, CTA.
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


# ================= 01 hook =================
write('s01', scene('s01', BASE + """
.tm{position:absolute;top:560px;width:400px;height:220px;border-radius:40px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tm .n{font:800 110px/1 'Manrope';letter-spacing:-.03em}
.tm .l{font:600 32px/1 'Inter';margin-top:10px}
.ar{position:absolute;left:505px;top:630px;font:800 80px/1 'Manrope';color:#de0b1b}
""", head('SPEAKING') + title(['Part 2:', 'как не замолчать']) +
    '<div class="tm t1" style="left:90px;background:#fdfdfd;box-shadow:0 20px 60px rgba(22,19,17,.1);color:#161311"><div class="n">1:00</div><div class="l">готовишься</div></div>'
    '<div class="ar">→</div>'
    '<div class="tm t2" style="left:590px;background:#161311;color:#fdfdfd"><div class="n">2:00</div><div class="l" style="color:#f9e0db">говоришь</div></div>'
    '<div class="hand" style="top:880px;left:90px">как потратить минуту с толком</div>'
    '<div class="spk" style="left:720px;top:960px;width:260px;height:260px"></div>' + dotsn(5, None),
    HEAD_JS + SPARK_DRIVER + ttl_js(5) + """
tl.fromTo(q('.t1'), {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 1.1);
tl.fromTo(q('.ar'), {x: -30, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 1.5);
tl.fromTo(q('.t2'), {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 1.7);
wipe(tl, q('.hand'), 2.4, 3.6);
tl.fromTo(q('.spk'), {y: 100, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 2.2);
""" + DOTS_JS + "driveSpark((t) => ({name: 'wave', phase: t * 1.6}));\n", '01 hook'))

# ================= 02 official format =================
rows = ''
for k, (n, t) in enumerate([('1', 'экзаменатор даёт <b>карточку</b> с темой и пунктами'),
                            ('2', '<b>1 минута</b> на подготовку, карандаш и бумага для заметок'),
                            ('3', 'говоришь около <b>2 минут</b> по пунктам'),
                            ('4', 'потом <b>1–2 вопроса</b> по той же теме')]):
    y = 390 + k * 170
    rows += (f'<div class="rw" style="{st(y, M, w=900, h=150, extra="background:#fdfdfd;border-radius:30px;box-shadow:0 12px 40px rgba(22,19,17,.08);")}">'
             f'<div style="{st(35, 34, w=80, h=80, extra="border-radius:50%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;" + fnt(800, 40, 1, "Manrope"))}">{n}</div>'
             f'<div class="rt" style="{st(30, 150, w=720, extra=fnt(600, 36, 1.3, "Inter") + "color:#161311;")}">{t}</div></div>')
write('s02', scene('s02', BASE + ".rt b{font-family:'Manrope';font-weight:800}\n", head('ФОРМАТ') + title(['Как устроена', 'Part 2']) + rows +
    '<div class="src" style="top:1085px">По официальному описанию Speaking на ielts.org</div>' + dotsn(5, 0),
    HEAD_JS + ttl_js(3) + """
qa('.rw').forEach((el, i) => tl.fromTo(el, {x: -60, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.9 + i * 0.4));
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 2.8);
""" + DOTS_JS, '02 format'))

# ================= 03 cue card =================
write('s03', scene('s03', BASE + """
.cc{position:absolute;left:90px;top:360px;width:900px;padding:44px 52px 48px;border-radius:24px;background:#fffdf6;box-shadow:0 24px 60px rgba(22,19,17,.14);transform:rotate(-1.2deg);color:#161311}
.cc .h{font:800 44px/1.25 'Manrope';letter-spacing:-.01em;margin-bottom:22px}
.cc .s{font:600 34px/1 'Inter';color:#6e6d6b;margin-bottom:18px}
.cc .p{font:500 38px/1.5 'Inter'}
.cc .p span{display:block}
.cc .p span::before{content:'—  ';color:#de0b1b;font-weight:800}
""", head('КАРТОЧКА') + title(['Пример карточки']) +
    '<div class="cc"><div class="h">Describe a place in your city that you like to visit.</div><div class="s">You should say:</div>'
    '<div class="p"><span class="pi">where it is</span><span class="pi">how often you go there</span><span class="pi">what you do there</span>'
    '<span class="pi">and explain why you like it.</span></div></div>'
    '<div class="tip" style="top:1010px">четыре пункта = <b>четыре части</b> твоего ответа</div>'
    '<div class="src" style="top:1180px">Карточка — учебный пример, не из реального экзамена</div>' + dotsn(5, 1),
    HEAD_JS + ttl_js(2) + """
tl.fromTo(q('.cc'), {y: 60, opacity: 0, rotation: 4}, {y: 0, opacity: 1, rotation: -1.2, duration: 0.6, ease: 'back.out(1.5)'}, 0.6);
qa('.pi').forEach((el, i) => tl.fromTo(el, {x: -20, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 1.4 + i * 0.3));
tl.fromTo(q('.tip'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 3.0);
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 3.4);
""" + DOTS_JS, '03 card'))

# ================= 04 notes in one minute =================
notes = ''
for k, (h, t) in enumerate([('где', 'Kok-Tobe · hill · cable car'), ('как часто', 'weekends · twice a month'),
                            ('что делаю', 'walk · view · photos'), ('почему', 'calm · city lights')]):
    x, y = M + (k % 2) * 460, 400 + (k // 2) * 250
    notes += (f'<div class="nt" style="{st(y, x, w=440, h=220, extra="background:#fffdf6;border-radius:22px;box-shadow:0 12px 36px rgba(22,19,17,.1);")}">'
              f'<div style="{st(26, 30, extra=fnt(600, 28, 1, "Inter") + "color:#8c8b8a;")}">{h}</div>'
              f'<div class="nw" style="{st(72, 30, w=390, extra=fnt(700, 50, 1.15, "Caveat") + "color:#161311;")}">{t}</div></div>')
RING = ('<svg class="rg" style="position:absolute;left:840px;top:180px;width:150px;height:150px" viewBox="0 0 150 150">'
        '<circle cx="75" cy="75" r="62" fill="#fdfdfd" stroke="#efeeea" stroke-width="12"/>'
        '<path class="ra" d="M75 13 A62 62 0 1 1 74.9 13" fill="none" stroke="#de0b1b" stroke-width="12" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>'
        '<div class="rn" style="position:absolute;left:840px;top:180px;width:150px;height:150px;display:flex;align-items:center;justify-content:center;font:800 40px/1 Manrope;color:#161311">0:00</div>')
write('s04', scene('s04', BASE, head('МИНУТА') + title(['Заметки —', 'только слова']) + RING + notes +
    '<div class="tip" style="top:930px">пиши <b>слова, а не предложения</b> — по 2–3 на каждый пункт</div>' + dotsn(5, 2),
    HEAD_JS + ttl_js(4) + """
qa('.nt').forEach((el, i) => tl.fromTo(el, {scale: 0.85, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)'}, 0.9 + i * 0.55));
qa('.nw').forEach((el, i) => wipe(tl, el, 1.1 + i * 0.55, 1.6 + i * 0.55));
tl.to({v: 0}, {v: 1, duration: 3.2, ease: 'none', onUpdate() {
  const v = this.targets()[0].v;
  q('.ra').setAttribute('stroke-dashoffset', String(1 - v));
  const s = Math.round(60 * v);
  q('.rn').textContent = s >= 60 ? '1:00' : '0:' + String(s).padStart(2, '0');
}}, 0.6);
tl.fromTo(q('.tip'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 3.4);
""" + DOTS_JS, '04 notes'))

# ================= 05 two-minute plan =================
segs = [('вступление', 10), ('где и как часто', 30), ('что делаю', 40), ('почему нравится', 40)]
bar, x = '', M
for k, (t, sec) in enumerate(segs):
    w = 900 * sec / 120 - (8 if k < 3 else 0)
    col = ['#161311', '#6e6d6b', '#b60916', '#de0b1b'][k]
    bar += f'<i class="sg" style="{st(420, x, w=w, h=90, extra=f"background:{col};border-radius:18px;transform-origin:0 50%;")}"></i>'
    bar += (f'<div class="sl" style="{st(540 + k * 110, M, w=900, h=90, extra="background:#fdfdfd;border-radius:24px;box-shadow:0 8px 24px rgba(22,19,17,.06);")}">'
            f'<i style="{st(28, 30, w=34, h=34, extra=f"background:{col};border-radius:8px;")}"></i>'
            f'<div style="{st(26, 90, extra=fnt(600, 38, 1, "Inter") + "color:#161311;white-space:nowrap;")}">{t}</div>'
            f'<div style="{st(24, 700, w=170, extra="text-align:right;" + fnt(800, 40, 1, "Manrope") + "color:#161311;")}">~{sec} с</div></div>')
    x += w + 8
write('s05', scene('s05', BASE, head('2 МИНУТЫ') + title(['План на две минуты']) + bar +
    '<div class="src" style="top:1000px">Пример распределения — не официальное правило</div>'
    '<div class="tip" style="top:1060px">каждый пункт карточки = <b>одна мини-история</b></div>' + dotsn(5, 3),
    HEAD_JS + ttl_js(3) + """
qa('.sg').forEach((el, i) => tl.fromTo(el, {scaleX: 0}, {scaleX: 1, duration: 0.45, ease: 'power2.out'}, 0.8 + i * 0.4));
qa('.sl').forEach((el, i) => tl.fromTo(el, {x: -40, opacity: 0}, {x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}, 1.0 + i * 0.4));
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 2.8);
tl.fromTo(q('.tip'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 3.2);
""" + DOTS_JS, '05 plan'))

# ================= 06 phrases =================
ph = ''
for k, (h, t) in enumerate([('начать', 'The place I’d like to talk about is…'), ('как часто', 'I usually go there…'),
                            ('что делаю', 'What I really enjoy there is…'), ('почему', 'The main reason I like it is…')]):
    y = 340 + k * 170
    ph += (f'<div class="pr" style="{st(y, M, w=900, h=145, extra="background:#fdfdfd;border-radius:30px;box-shadow:0 12px 40px rgba(22,19,17,.08);")}">'
           f'<div style="{st(24, 36, extra=fnt(600, 26, 1, "Inter") + "color:#8c8b8a;")}">{h}</div>'
           f'<div style="{st(66, 36, w=830, extra=fnt(800, 44, 1.1, "Manrope") + "color:#161311;letter-spacing:-.01em;white-space:nowrap;")}">{t}</div></div>')
write('s06', scene('s06', BASE, head('ФРАЗЫ') + title(['Фразы-мостики']) + ph +
    '<div class="tip" style="top:1040px">мостик даёт секунду подумать — <b>без долгих пауз</b></div>'
    '<div class="spk" style="left:860px;top:1190px;width:120px;height:120px"></div>' + dotsn(5, 4),
    HEAD_JS + SPARK_DRIVER + ttl_js(2) + """
qa('.pr').forEach((el, i) => tl.fromTo(el, {x: 60, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.8 + i * 0.4));
tl.fromTo(q('.tip'), {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 2.8);
tl.fromTo(q('.spk'), {scale: 0, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 3.1);
""" + DOTS_JS + "driveSpark((t) => ({name: 'cheer'}));\n", '06 phrases'))

# ================= 07 CTA =================
write('s07', scene('s07', BASE + """
.fx{position:absolute;left:90px;right:90px;top:470px;font:600 42px/1.3 'Inter';color:#6e6d6b}
""", head('ФИНИШ') + title(['Карточка → заметки', '→ план → фразы']) +
    '<div class="fx">Узнай свой уровень: бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:630px;left:90px">ссылка в профиле</div>'
    '<div class="hand" style="top:760px;left:90px">сохрани перед экзаменом</div>'
    '<div class="spk" style="left:640px;top:880px;width:340px;height:340px"></div>' + dotsn(5, 'all'),
    HEAD_JS + SPARK_DRIVER + ttl_js(6) + """
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.3);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 1.8);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.2);
wipe(tl, q('.hand'), 2.4, 3.5);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.2);
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
    <title>ASHYQ — Speaking Part 2 (карусель)</title>
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

