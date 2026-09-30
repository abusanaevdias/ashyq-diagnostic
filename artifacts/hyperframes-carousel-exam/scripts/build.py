# Generates compositions/*.html and index.html for the «IELTS за 2 минуты» carousel (1080x1440).
# Seven 6 s slides: hook, four IELTS Academic sections (official format numbers only), timeline, CTA.
# A four-segment time bar (30 : 60 : 60 : ~12.5 minutes, to scale) ties the slides together.
# scripts/export.sh cuts the rendered strip into slides.
#   python3 scripts/build.py
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
SPARK_JS = open(f'{P}/assets/spark.js').read()
W, M, DUR, N = 1080, 90, 6.0, 7
BX, BW, BY, GAP = M, 900, 1210, 10
SEG = [('Listening', 30, '30'), ('Reading', 60, '60'), ('Writing', 60, '60'), ('Speaking', 12.5, '11–14')]


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
.bn{position:absolute;left:90px;top:180px;font:800 280px/.85 'Manrope';letter-spacing:-.05em;color:#161311;white-space:nowrap}
.bn .u{font:800 84px/1 'Manrope';color:#de0b1b;letter-spacing:-.01em;margin-left:18px}
.ttl{position:absolute;left:90px;right:90px;top:470px;font:800 92px/1 'Manrope';letter-spacing:-.025em;color:#161311}
.ttl .ln{display:block;white-space:nowrap}
.chs{position:absolute;left:90px;top:590px;width:900px;white-space:nowrap}
.cc2{display:inline-block;margin:0 14px 14px 0;padding:14px 26px;border-radius:20px;background:#fcf3f0;color:#161311;font:600 32px/1 'Inter';white-space:nowrap}
.card{position:absolute;left:90px;top:730px;width:900px;height:400px;background:#fdfdfd;border-radius:36px;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.card *{position:absolute}
.hand{position:absolute;font:700 68px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%;white-space:nowrap}
.pill{position:absolute;padding:18px 34px;border-radius:999px;background:#de0b1b;color:#fff;font:600 40px/1 'Inter';white-space:nowrap}
.dot{position:absolute;display:flex;align-items:center;justify-content:center;background:#de0b1b;color:#fff;font:800 40px/1 'Manrope'}
.tbg{position:absolute;left:0;top:0;width:100%;height:100%}
.spk{position:absolute;left:0;top:0;width:250px;height:250px}
"""

PRELUDE = """
const S = document.querySelector('[data-composition-id="%s"]');
const q = (s) => S.querySelector(s);
const qa = (s) => S.querySelectorAll(s);
const tl = gsap.timeline({ paused: true });
function counter(el, to, at, dur) { tl.to({v: 0}, {v: 1, duration: dur, ease: 'power2.out', onUpdate() { el.textContent = Math.round(to * this.targets()[0].v); }}, at); }
"""

SPARK_DRIVER = SPARK_JS + """
const spk = q('.spk');
let lastSvg = '';
function driveSpark(poseFn) {
  tl.to({}, {duration: __DUR__, ease: 'none', onUpdate() {
    const t = this.time();
    const blink = Math.max(0, ...[1.9, 3.7, 5.2].map((b) => 1 - Math.abs(t - b) / 0.09));
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


def timebar(cur):
    """cur: index of the highlighted segment, 'all' (every segment red) or None."""
    total = sum(s[1] for s in SEG)
    avail = BW - GAP * 3
    x, out = BX, '<div class="tbg">'
    for i, (nm, mins, lab) in enumerate(SEG):
        w = avail * mins / total
        on = cur == 'all' or cur == i
        out += f'<i style="{st(BY, x, w=w, h=26, extra="background:#e2e0da;border-radius:13px;")}"></i>'
        if on:
            out += f'<i class="tbf tbf{i}" style="{st(BY, x, w=w, h=26, extra="background:#de0b1b;border-radius:13px;transform-origin:0 50%;")}"></i>'
        col = '#161311' if on else '#8c8b8a'
        if i < 3:
            box_ = st(BY + 44, x - 20, w=w + 40, extra='text-align:center;')
        else:
            box_ = st(BY + 44, BX + BW - 160, w=160, extra='text-align:right;')
        out += f'<div style="{box_}white-space:nowrap;{fnt(800, 30, 1, "Manrope")}color:{col};">{nm}</div>'
        box2 = box_.replace(f'top:{BY + 44}px', f'top:{BY + 86}px')
        out += f'<div style="{box2}white-space:nowrap;{fnt(600, 26, 1, "Inter")}color:{col};">{lab} мин</div>'
        x += w + GAP
    return out + '</div>'


def bar_js(cur, at=1.0):
    j = "tl.fromTo(q('.tbg'), {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.45, ease: 'power3.out'}, 0.2);\n"
    if cur == 'all':
        for i in range(4):
            j += f"tl.fromTo(q('.tbf{i}'), {{scaleX: 0}}, {{scaleX: 1, duration: 0.4, ease: 'power2.out'}}, {at + i * 0.25});\n"
    elif cur is not None:
        j += f"tl.fromTo(q('.tbf{cur}'), {{scaleX: 0}}, {{scaleX: 1, duration: 0.6, ease: 'power2.out'}}, {at});\n"
    return j


def num_html(inner, size=None):
    sty = f' style="font-size:{size}px"' if size else ''
    return f'<div class="bn" data-layout-allow-overlap{sty}>{inner}<span class="u">мин</span></div>'


def title_html(name):
    return f'<div class="ttl"><span class="ln">{words(name)}</span></div>'


def chips_html(items):
    return '<div class="chs">' + ''.join(f'<span class="cc2">{t}</span>' for t in items) + '</div>'


def common_js(at_title=0.9):
    return (HEAD_JS + f"rise(tl, S, '.ttl .w', [{at_title}], 0.45);\n"
            "qa('.cc2').forEach((el, i) => tl.fromTo(el, {y: 24, opacity: 0, scale: 0.9}, {y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)'}, 1.15 + i * 0.13));\n"
            "tl.fromTo(q('.card'), {y: 60, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}, 1.35);\n")


def cx(top, left, w, t, size=26, weight=600, color='#6e6d6b', fam='Inter', cls=''):
    return f'<div class="{cls}" style="{st(top, left, w=w, extra="text-align:center;white-space:nowrap;" + fnt(weight, size, 1, fam) + f"color:{color};")}">{t}</div>'


# ================= 01 hook =================
circ = ''
for k, (nm, _m, _l) in enumerate(SEG):
    x = M + 25 + k * 225
    circ += (f'<div class="ci" style="{st(740, x, w=170, h=170, extra="border-radius:50%;background:#fdfdfd;box-shadow:0 20px 50px rgba(22,19,17,.1);display:flex;align-items:center;justify-content:center;" + fnt(800, 96, 1, "Manrope"))}">{nm[0]}</div>'
             + cx(935, x - 30, 230, nm, 30, 800, '#161311', 'Manrope', 'cn'))
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:170px;font:800 250px/.9 'Manrope';letter-spacing:-.045em;color:#161311}
.sub1{position:absolute;left:90px;top:420px;font:800 116px/1 'Manrope';letter-spacing:-.03em;color:#161311;white-space:nowrap}
""", head('ШПАРГАЛКА') +
    '<div class="big" data-layout-allow-overlap>IELTS</div>'
    '<div class="sub1"><span class="m"><span class="w">за</span></span> <span class="m"><span class="w" style="color:#de0b1b">2</span></span> <span class="m"><span class="w">минуты</span></span></div>'
    '<span class="pill" style="top:590px;left:90px">Academic</span>' + circ +
    '<div class="hand" style="top:1030px;left:90px">сохрани, пригодится</div>' +
    timebar(None) + '<div class="spk" style="left:800px;top:985px;width:210px;height:210px"></div>',
    HEAD_JS + SPARK_DRIVER + """
tl.fromTo(q('.big'), {scale: 1.35, opacity: 0, y: 30}, {scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', transformOrigin: '0% 60%'}, 0.3);
rise(tl, S, '.sub1 .w', [0.75, 0.9, 1.0], 0.4);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 1.3);
qa('.ci').forEach((el, i) => tl.fromTo(el, {y: 80, scale: 0.6, opacity: 0}, {y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)'}, 1.7 + i * 0.22));
qa('.cn').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.35}, 1.95 + i * 0.22));
wipe(tl, q('.hand'), 3.1, 4.1);
tl.fromTo(q('.spk'), {y: 80, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 3.0);
""" + bar_js(None) + "driveSpark((t) => ({name: 'wave', phase: t * 1.6}));\n", '01 hook'))

# ================= 02 listening =================
bars = ''
for k in range(37):
    hgt = 18 + 120 * abs(math.sin(k * .55)) * (1 - abs(k - 18) / 30)
    bars += f'<i class="br" style="{st(190 - hgt / 2, 90 + k * 20, w=10, h=hgt, extra="background:#161311;border-radius:5px;transform-origin:50% 50%;")}"></i>'
ill2 = (bars + cx(28, 0, 900, 'запись звучит один раз — переслушать нельзя', 30, 600, '#6e6d6b', 'Inter', 'lc') +
        f'<div class="ply" style="{st(300, 350, w=200, h=70, extra="border-radius:35px;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;" + fnt(800, 40, 1, "Manrope"))}">▶ 1 раз</div>')
write('s02', scene('s02', '', head('СЕКЦИЯ 1/4') + num_html('<span class="nv" data-layout-allow-overlap>30</span>') + title_html('Listening') +
    chips_html(['4 записи', '40 вопросов', 'звучит один раз']) + f'<div class="card">{ill2}</div>' + timebar(0),
    common_js() + "counter(q('.nv'), 30, 0.4, 1.2);\n" + """
tl.fromTo(q('.lc'), {opacity: 0}, {opacity: 1, duration: 0.4}, 1.8);
qa('.br').forEach((el, i) => tl.fromTo(el, {scaleY: 0.05, opacity: 0.2}, {scaleY: 1, opacity: 1, duration: 0.25, ease: 'power2.out'}, 1.9 + i * 0.03));
tl.fromTo(q('.ply'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)'}, 3.2);
""" + bar_js(0), '02 listening'))

# ================= 03 reading =================
ill3 = ''
for t in range(3):
    x = 60 + t * 270
    ill3 += f'<div class="pg" style="{st(45, x, w=240, h=300, extra="background:#fcf3f0;border-radius:20px;")}"></div>'
    for k in range(7):
        w = 190 if k % 3 != 2 else 120
        ill3 += f'<i class="ln{t}" style="{st(75 + k * 36, x + 25, w=w, h=14, extra="border-radius:7px;background:#e2e0da;")}"></i>'
        if t == 1 and k in (2, 3):
            ill3 += f'<i class="hl" style="{st(75 + k * 36, x + 25, w=w, h=14, extra="border-radius:7px;background:#de0b1b;transform-origin:0 50%;")}"></i>'
    ill3 += cx(358, x, 240, f'Текст {t + 1}', 26, 800, '#161311', 'Manrope', 'pl')
write('s03', scene('s03', '', head('СЕКЦИЯ 2/4') + num_html('<span class="nv" data-layout-allow-overlap>60</span>') + title_html('Reading') +
    chips_html(['3 текста', '40 вопросов', '2150–2750 слов']) + f'<div class="card">{ill3}</div>' + timebar(1),
    common_js() + "counter(q('.nv'), 60, 0.4, 1.2);\n" + """
qa('.pg').forEach((el, i) => tl.fromTo(el, {y: 70, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)'}, 1.8 + i * 0.2));
qa('.pl').forEach((el, i) => tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.3}, 2.3 + i * 0.2));
qa('.hl').forEach((el, i) => tl.fromTo(el, {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.inOut'}, 3.2 + i * 0.35));
""" + bar_js(1), '03 reading'))

# ================= 04 writing =================
ill4 = f'<div class="t1" style="{st(40, 60, w=380, h=290, extra="background:#fcf3f0;border-radius:22px;")}"></div>'
for k, hgt in enumerate([90, 150, 110, 190]):
    ill4 += f'<i class="vb" style="{st(300 - hgt, 100 + k * 78, w=52, h=hgt, extra="background:#161311;border-radius:8px 8px 0 0;transform-origin:50% 100%;")}"></i>'
ill4 += cx(62, 60, 380, 'Task 1 · описать график', 26, 800, '#161311', 'Manrope', 'tt')
ill4 += cx(355, 60, 380, '≥150 слов', 28, 600, '#6e6d6b', 'Inter', 'tt')
ill4 += f'<div class="t2" style="{st(40, 470, w=380, h=290, extra="background:#fcf3f0;border-radius:22px;")}"></div>'
for k in range(5):
    ill4 += f'<i class="tx" style="{st(120 + k * 40, 505, w=310 if k != 4 else 200, h=14, extra="background:#e2e0da;border-radius:7px;transform-origin:0 50%;")}"></i>'
ill4 += cx(62, 470, 380, 'Task 2 · эссе', 26, 800, '#161311', 'Manrope', 'tt')
ill4 += cx(355, 470, 380, '≥250 слов', 28, 600, '#6e6d6b', 'Inter', 'tt')
ill4 += f'<div class="x2" style="{st(6, 760, w=110, h=70, extra="border-radius:35px;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;" + fnt(800, 40, 1, "Manrope"))}">×2</div>'
write('s04', scene('s04', '', head('СЕКЦИЯ 3/4') + num_html('<span class="nv" data-layout-allow-overlap>60</span>') + title_html('Writing') +
    chips_html(['2 задания', 'Task 2 весит вдвое больше']) + f'<div class="card">{ill4}</div>' + timebar(2),
    common_js() + "counter(q('.nv'), 60, 0.4, 1.2);\n" + """
qa('.t1, .t2').forEach((el, i) => tl.fromTo(el, {scale: 0.9, opacity: 0}, {scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)'}, 1.7 + i * 0.15));
qa('.tt').forEach((el, i) => tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.3}, 2.0 + i * 0.1));
qa('.vb').forEach((el, i) => tl.fromTo(el, {scaleY: 0}, {scaleY: 1, duration: 0.45, ease: 'back.out(1.5)'}, 2.3 + i * 0.15));
qa('.tx').forEach((el, i) => tl.fromTo(el, {scaleX: 0}, {scaleX: 1, duration: 0.35, ease: 'power2.out'}, 2.5 + i * 0.16));
tl.fromTo(q('.x2'), {scale: 0, opacity: 0, rotation: -12}, {scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.6)'}, 3.6);
""" + bar_js(2), '04 writing'))

# ================= 05 speaking =================
ill5 = ''
for k, (n, nm, tm) in enumerate([('1', 'интервью', '4–5 мин'), ('2', 'монолог', '1 + ~2 мин'), ('3', 'обсуждение', '4–5 мин')]):
    x = 40 + k * 285
    ill5 += f'<div class="bb" style="{st(45, x, w=260, h=250, extra="background:#fcf3f0;border-radius:32px 32px 32px 8px;")}"></div>'
    ill5 += f'<div class="bn2" style="{st(70, x + 20, w=64, h=64, extra="border-radius:50%;background:#de0b1b;color:#fff;display:flex;align-items:center;justify-content:center;" + fnt(800, 36, 1, "Manrope"))}">{n}</div>'
    ill5 += cx(150, x, 260, nm, 34, 800, '#161311', 'Manrope', 'bt')
    ill5 += cx(210, x, 260, tm, 32, 600, '#6e6d6b', 'Inter', 'bt')
ill5 += cx(330, 0, 900, 'Часть 2: 1 минута на подготовку, затем ~2 минуты монолога', 28, 600, '#6e6d6b', 'Inter', 'bnote')
write('s05', scene('s05', '', head('СЕКЦИЯ 4/4') + num_html('<span class="nv" data-layout-allow-overlap>11</span>–<span class="nv" data-layout-allow-overlap>14</span>', 230) + title_html('Speaking') +
    chips_html(['3 части', 'разговор с экзаменатором']) + f'<div class="card">{ill5}</div>' + timebar(3),
    common_js() + "const nvs = qa('.nv'); counter(nvs[0], 11, 0.4, 1.1); counter(nvs[1], 14, 0.5, 1.1);\n" + """
qa('.bb').forEach((el, i) => tl.fromTo(el, {y: 60, scale: 0.8, opacity: 0}, {y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)'}, 1.8 + i * 0.35));
qa('.bn2').forEach((el, i) => tl.fromTo(el, {scale: 0}, {scale: 1, duration: 0.35, ease: 'back.out(3)'}, 2.1 + i * 0.35));
qa('.bt').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.35}, 2.2 + Math.floor(i / 2) * 0.35));
tl.fromTo(q('.bnote'), {opacity: 0}, {opacity: 1, duration: 0.5}, 3.6);
""" + bar_js(3), '05 speaking'))

# ================= 06 timeline =================
BIG_Y = 700
tot = 150
avail = 900 - 2 * 8
tl6, x = '', M
names = ['Listening', 'Reading', 'Writing']
for k, m in enumerate([30, 60, 60]):
    w = avail * m / tot
    tl6 += f'<i class="sg" style="{st(BIG_Y, x, w=w, h=90, extra="background:#161311;border-radius:20px;transform-origin:0 50%;")}"></i>'
    tl6 += f'<div class="sgt" style="{st(BIG_Y + 27, x, w=w, extra="text-align:center;color:#fff;white-space:nowrap;" + fnt(800, 30, 1, "Manrope"))}">{names[k]}</div>'
    tl6 += cx(BIG_Y + 108, x, w, f'{m} мин', 32, 600, '#6e6d6b', 'Inter', 'sgm')
    x += w + 8
tl6 += (f'<svg class="brk" style="{st(BIG_Y - 70, M, w=900, h=60)}" viewBox="0 0 900 60"><path class="brp" d="M2 55 L2 20 L898 20 L898 55" pathLength="1" stroke-dasharray="1" fill="none" stroke="#de0b1b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/></svg>')
tl6 += cx(BIG_Y - 130, M, 900, 'подряд, без перерывов', 34, 600, '#6e6d6b', 'Inter', 'nb')
tl6 += (f'<div class="tot" style="{st(BIG_Y + 170, M, w=900, extra="text-align:center;white-space:nowrap;" + fnt(800, 130, 1, "Manrope") + "letter-spacing:-.03em;color:#161311;")}">'
        f'2 ч <span class="tv">44</span> мин</div>')
tl6 += cx(BIG_Y + 320, M, 900, '+ 10 мин на перенос ответов', 34, 600, '#6e6d6b', 'Inter', 'ext')
tl6 += f'<div class="dsh" style="{st(BIG_Y + 400, M, w=900, h=0, extra="border-top:4px dashed #e2e0da;transform-origin:0 50%;")}"></div>'
tl6 += cx(BIG_Y + 425, M, 900, 'Speaking — отдельно · 11–14 мин', 34, 800, '#161311', 'Manrope', 'spk6')
write('s06', scene('s06', '', head('КАК ЭТО ИДЁТ') +
    '<div class="ttl" style="top:190px"><span class="ln">' + words('Один день,') + '</span><span class="ln">' + words('три блока подряд') + '</span></div>' + tl6,
    HEAD_JS + """
rise(tl, S, '.ttl .w', [0.3, 0.45, 0.6, 0.75, 0.9], 0.45);
qa('.sg').forEach((el, i) => tl.fromTo(el, {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.out'}, 1.3 + i * 0.35));
qa('.sgt').forEach((el, i) => tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.3}, 1.6 + i * 0.35));
qa('.sgm').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3}, 1.75 + i * 0.35));
tl.fromTo(q('.brp'), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut'}, 2.5);
tl.fromTo(q('.nb'), {opacity: 0}, {opacity: 1, duration: 0.4}, 2.9);
tl.fromTo(q('.tot'), {opacity: 0, y: 30, scale: 0.94}, {opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out'}, 3.2);
counter(q('.tv'), 44, 3.2, 1.0);
tl.fromTo(q('.ext'), {opacity: 0}, {opacity: 1, duration: 0.4}, 4.0);
tl.fromTo(q('.dsh'), {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.out'}, 4.4);
tl.fromTo(q('.spk6'), {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.4}, 4.7);
""", '06 timeline'))

# ================= 07 CTA =================
write('s07', scene('s07', "", head('ФИНИШ') +
    '<div class="ttl" style="top:190px;font-size:100px;line-height:1.02"><span class="ln">' + words('А какой') + '</span><span class="ln">' + words('у тебя уровень?') + '</span></div>'
    '<div style="' + st(450, M, M, extra=fnt(600, 42, 1.3, 'Inter') + 'color:#6e6d6b;') + '" class="fx">Бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:560px;left:90px">ссылка в профиле</div>'
    '<div class="hand" style="top:700px;left:90px">сохрани шпаргалку</div>' +
    '<div class="spk" style="left:610px;top:800px;width:330px;height:330px"></div>' + timebar('all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.3, 0.45, 0.6, 0.75, 0.9], 0.45);
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.5);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 2.1);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.4);
wipe(tl, q('.hand'), 2.7, 3.7);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.0);
""" + bar_js('all', 1.2) + "driveSpark((t) => ({name: 'cheer', phase: t * 1.5}));\n", '07 cta'))

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
    <title>ASHYQ — IELTS за 2 минуты (карусель)</title>
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
