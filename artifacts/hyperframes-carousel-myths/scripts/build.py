# Generates compositions/*.html and index.html for the «Миф → факт» carousel (1080x1440).
# Seven slides of 6 s each are laid end to end; scripts/export.sh cuts them into
# seven MP4s and snapshots the held final frame of each slide as a PNG.
#   python3 scripts/build.py
import json, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
SPARK_JS = open(f'{P}/assets/spark.js').read()
DUR = 6.0
N = 7


def write(name, html):
    open(f'{C}/{name}.html', 'w').write(html)


# ---------- shared CSS (identical in every slide so the assembled page has no conflicts) ----------
CSS = """
.chip-r{position:absolute;top:96px;left:90px;padding:12px 24px;border-radius:999px;background:#fcf3f0;color:#b60916;font:600 30px/1 'Inter';letter-spacing:.06em;white-space:nowrap}
.wm{position:absolute;top:92px;right:90px;width:150px}
.seg,.pf{position:absolute;top:1298px;height:10px;width:120px;border-radius:5px}
.seg{background:#e2e0da}
.pf{background:#de0b1b}
.src{position:absolute;left:90px;right:90px;top:1226px;font:500 26px/1.2 'Inter';color:#8c8b8a}
.myth{position:absolute;left:90px;right:90px;top:200px;font:800 80px/1.08 'Manrope';letter-spacing:-.025em;color:#161311}
.myth .ln{display:block;width:fit-content;white-space:nowrap;position:relative}
.myth .st{position:absolute;left:-8px;right:-8px;top:52%;height:10px;margin-top:-5px;border-radius:5px;background:#de0b1b;transform-origin:0 50%}
.stamp{position:absolute;padding:10px 26px;border-radius:14px;font:800 52px/1 'Manrope';letter-spacing:.1em;background:rgba(253,253,253,.92);white-space:nowrap}
.stamp.red{left:700px;top:400px;border:7px solid #de0b1b;color:#de0b1b}
.stamp.ok{left:40px;top:-34px;border:7px solid #2e5e3a;color:#2e5e3a}
.card{position:absolute;left:90px;top:560px;width:900px;height:640px;background:#fdfdfd;border-radius:40px;box-shadow:0 20px 60px rgba(22,19,17,.1)}
.card > *{position:absolute}
.ft{left:44px;right:44px;top:64px;font:600 44px/1.28 'Inter';color:#161311}
.pill{padding:14px 26px;border-radius:999px;background:#e8efe2;color:#2e5e3a;font:600 32px/1 'Inter';white-space:nowrap}
.pill.soft{background:#efeeea;color:#6e6d6b;font-size:28px}
.pill.off{background:#fcf3f0;color:#6e6d6b}
.pill.red{position:absolute;background:#de0b1b;color:#fff;font-size:40px;padding:18px 34px}
.pin{width:124px;text-align:center;padding:10px 0;border-radius:14px;background:#161311;color:#f8f7f3;font:600 28px/1 'Inter';white-space:nowrap}
.good{color:#2e5e3a;background:#e8efe2;border-radius:14px;padding:0 10px}
.tn{width:40px;text-align:center;font:600 26px/1 'Inter';color:#6e6d6b}
.cap{white-space:nowrap;text-align:center;font:600 30px/1 'Inter';color:#6e6d6b}
.hand{position:absolute;font:700 68px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%;white-space:nowrap}
"""

PRELUDE = """
const S = document.querySelector('[data-composition-id="%s"]');
const q = (s) => S.querySelector(s);
const qa = (s) => S.querySelectorAll(s);
const tl = gsap.timeline({ paused: true });
// number/label tickers derive text from timeline time, so seeking is deterministic
function ticker(at, dur, fn) { tl.to({v: 0}, {v: 1, duration: dur, ease: 'power2.out', onUpdate() { fn(this.targets()[0].v); }}, at); }
function labelAt(el, steps) { tl.to({}, {duration: %s, ease: 'none', onUpdate() { const t = this.time(); let s = ''; for (const [at, txt] of steps) if (t >= at) s = txt; if (el.textContent !== s) el.textContent = s; }}, 0); }
"""


def scene(cid, css, body, js, title):
    return sub(cid, CSS + css, body, PRELUDE % (cid, DUR) + js + f"\nwindow.__timelines['{cid}'] = tl;\n", title)


def words(text):
    return ' '.join(f'<span class="m"><span class="w">{w}</span></span>' for w in text.split(' '))


def chrome(n, myth_no=None, wm=True):
    seg = ''.join(f'<i class="seg" style="left:{90 + i * 130}px"></i>' for i in range(N))
    fill = ''.join(f'<i class="pf" style="left:{90 + i * 130}px"></i>' for i in range(n))
    chip = f'<span class="chip-r">МИФ {myth_no}/5</span>' if myth_no else ''
    return chip + ('<img class="wm" src="assets/brand/wordmark-ink.png" alt="ashyq" />' if wm else '') + seg + fill


def chrome_js(n, has_chip=True, wm=True):
    j = ''
    if has_chip:
        j += "tl.fromTo(q('.chip-r'), {x: -40, opacity: 0}, {x: 0, opacity: 1, duration: 0.35, ease: 'power3.out'}, 0.05);\n"
    if wm:
        j += "tl.fromTo(q('.wm'), {opacity: 0}, {opacity: 1, duration: 0.4}, 0.1);\n"
    j += f"tl.fromTo(qa('.pf')[{n - 1}], {{scaleX: 0}}, {{scaleX: 1, duration: 0.5, ease: 'power2.out', transformOrigin: '0% 50%'}}, 0.2);\n"
    return j


def myth_html(lines):
    return ('<div class="myth">' + ''.join(f'<span class="ln">{words(l)}<i class="st" data-layout-allow-occlusion></i></span>' for l in lines) + '</div>'
            '<div class="stamp red">МИФ</div>')


def myth_js(lines, fact_step=0.05):
    n_words = sum(len(l.split(' ')) for l in lines)
    times = [round(0.25 + i * 0.09, 3) for i in range(n_words)]
    return f"""
// 1) myth rises word by word, 2) red «МИФ» stamp lands, 3) marker strikes both lines, 4) fact card arrives
rise(tl, S, '.myth .w', {json.dumps(times)}, 0.36);
tl.fromTo(q('.stamp.red'), {{scale: 2.4, rotation: -24, opacity: 0}}, {{scale: 1, rotation: -8, opacity: 1, duration: 0.26, ease: 'power4.in'}}, 1.05);
qa('.myth .st').forEach((el, i) => tl.fromTo(el, {{scaleX: 0}}, {{scaleX: 1, duration: 0.3, ease: 'power2.in'}}, 1.55 + i * 0.22));
tl.to(qa('.myth .w'), {{color: '#6e6d6b', duration: 0.3}}, 1.7);
tl.fromTo(q('.card'), {{y: 70, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}}, 2.1);
tl.fromTo(q('.stamp.ok'), {{scale: 0.4, rotation: -14, opacity: 0}}, {{scale: 1, rotation: -4, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}}, 2.45);
rise(tl, S, '.ft .w', {json.dumps([round(2.6 + i * fact_step, 3) for i in range(60)])}, 0.34);
"""


def card(fact, inner):
    return f'<div class="card"><span class="stamp ok">ФАКТ</span><div class="ft">{words(fact)}</div>{inner}</div>'


def src(t):
    return f'<div class="src">{t}</div>'


def abs_(cls, top, left, text='', style='', w=None):
    wpx = f'width:{w}px;' if w is not None else ''
    return f'<div class="{cls}" style="top:{top}px;left:{left}px;{wpx}{style}">{text}</div>'


# ================= 01 hook =================
write('s01', scene('s01', """
.big5{position:absolute;left:90px;top:190px;font:800 520px/.85 'Manrope';letter-spacing:-.05em;color:#de0b1b}
.k1{position:absolute;left:90px;top:642px;font:800 110px/1.02 'Manrope';letter-spacing:-.03em;color:#161311;white-space:nowrap}
.k2{top:754px}
.swipe{position:absolute;left:90px;top:1130px;font:600 40px/1 'Inter';color:#6e6d6b;white-space:nowrap}
.arrow{display:inline-block}
.spk{position:absolute;left:800px;top:1010px;width:240px;height:240px}
""", chrome(1) + """
<div class="big5" data-layout-allow-overlap>5</div>
<div class="k1"><span class="m"><span class="w">мифов</span></span></div>
<div class="k1 k2"><span class="m"><span class="w">об</span></span> <span class="m"><span class="w">IELTS</span></span></div>
<div class="hand" style="top:920px;left:90px">сколько из них ты знал?</div>
<div class="swipe">листай <span class="arrow">→</span></div>
<div class="spk"></div>
""", chrome_js(1, False) + SPARK_JS + """
tl.fromTo(q('.big5'), {scale: 2.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out', transformOrigin: '0%% 60%%'}, 0.25);
rise(tl, S, '.k1 .w', [0.95, 1.15, 1.3], 0.4);
wipe(tl, q('.hand'), 1.7, 2.7);
tl.fromTo(q('.swipe'), {opacity: 0}, {opacity: 1, duration: 0.4}, 2.6);
tl.fromTo(q('.arrow'), {x: 0}, {x: 16, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 5}, 3.0);
// «Искра» peeks up from the corner and waves; pose is derived from timeline time
const spk = q('.spk');
let last = '';
tl.fromTo(spk, {y: 320}, {y: 0, duration: 0.6, ease: 'back.out(1.6)'}, 1.1);
tl.to({}, {duration: %s, ease: 'none', onUpdate() {
  const t = this.time();
  const pose = {name: 'wave', phase: t * 1.6, blink: Math.max(0, ...[3.2, 5.0].map((b) => 1 - Math.abs(t - b) / 0.09))};
  const svg = window.SPARK.spark('logo', pose);
  if (svg !== last) { spk.innerHTML = svg; last = svg; }
}}, 0);
""" % DUR, '01 hook'))

# ================= 02 no pass/fail =================
step, x0, ty = 88, 50, 400
ticks = ''.join(f'<i class="tk" style="position:absolute;top:{ty - 13}px;left:{x0 + i * step - 2}px;width:4px;height:26px;background:#161311"></i>'
                f'<div class="tn" style="top:{ty + 30}px;left:{x0 + i * step - 20}px">{i}</div>' for i in range(10))
pins = ''.join(f'<div class="pin" style="top:300px;left:{x0 + v * step - 62}px">{t}</div>'
               f'<i class="stem" style="position:absolute;top:348px;left:{x0 + v * step - 2}px;width:4px;height:{ty - 348}px;background:#161311"></i>'
               for v, t in ((5.4, 'вуз А'), (7.3, 'вуз Б')))
L2 = ['«Нужно набрать', 'проходной балл»']
write('s02', scene('s02', '', chrome(2, 1) + myth_html(L2) + card(
    'В IELTS нет «сдал / не сдал». Вуз или организация сами решают, какой балл им нужен.',
    f'<div class="axis" style="top:{ty - 2}px;left:{x0}px;width:{9 * step}px;height:4px;background:#161311;transform-origin:0 50%"></div>{ticks}{pins}'
    f'<div class="cap" style="top:500px;left:0;width:900px;color:#8c8b8a;font-weight:500;font-size:26px">схема: у каждого свой уровень</div>'
) + src('IDP IELTS'), chrome_js(2) + myth_js(L2) + """
tl.fromTo(q('.axis'), {scaleX: 0}, {scaleX: 1, duration: 0.7, ease: 'power2.inOut'}, 3.2);
qa('.tk').forEach((el, i) => tl.fromTo(el, {scaleY: 0}, {scaleY: 1, duration: 0.25, ease: 'back.out(2)'}, 3.35 + i * 0.045));
qa('.tn').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: 0.3}, 3.4 + i * 0.045));
qa('.pin').forEach((el, i) => tl.fromTo(el, {y: -60, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)'}, 4.1 + i * 0.3));
qa('.stem').forEach((el, i) => tl.fromTo(el, {scaleY: 0}, {scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 0%'}, 4.3 + i * 0.3));
tl.fromTo(q('.cap'), {opacity: 0}, {opacity: 1, duration: 0.4}, 4.8);
""", '02 pass/fail'))

# ================= 03 two essays =================
base = 520
L3 = ['«Оба задания Writing', 'одинаково важны»']
bars = f'<div class="axis" style="top:{base}px;left:90px;width:720px;height:4px;background:#161311;transform-origin:0 50%"></div>'
for x, h, col, task in ((190, 130, '#e2e0da', 'Task 1 · ≥150 слов'), (520, 260, '#2e5e3a', 'Task 2 · ≥250 слов')):
    bars += (f'<div class="bar" style="top:{base - h}px;left:{x}px;width:190px;height:{h}px;background:{col};border-radius:16px 16px 0 0"></div>'
             f'<div class="cap lab" style="top:{base - h - 74}px;left:{x}px;width:190px;font:800 56px/1 Manrope;color:{"#6e6d6b" if col != "#2e5e3a" else "#2e5e3a"}"></div>'
             f'<div class="cap tsk" style="top:{base + 26}px;left:{x - 60}px;width:310px">{task}</div>')
write('s03', scene('s03', '', chrome(3, 2) + myth_html(L3) + card(
    'Task 2 вносит в оценку за Writing вдвое больше, чем Task 1.', bars) + src('ielts.org · Academic Writing'),
    chrome_js(3) + myth_js(L3) + """
tl.fromTo(q('.axis'), {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.inOut'}, 3.0);
const bs = qa('.bar'), lb = qa('.lab');
tl.fromTo(bs[0], {scaleY: 0}, {scaleY: 1, duration: 0.5, ease: 'power3.out', transformOrigin: '50% 100%'}, 3.4);
tl.fromTo(bs[1], {scaleY: 0}, {scaleY: 1, duration: 0.7, ease: 'power3.out', transformOrigin: '50% 100%'}, 3.85);
labelAt(lb[0], [[3.5, '0×'], [3.75, '1×']]);
labelAt(lb[1], [[3.95, '0×'], [4.2, '1×'], [4.45, '2×']]);
qa('.tsk').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.35}, 4.5 + i * 0.2));
""", '03 two essays'))

# ================= 04 Listening once =================
rr = random.Random(4)
hs = [16 + abs(int(96 * math.sin(i / 3.2) * rr.uniform(.5, 1))) for i in range(44)]
wave = ''.join(f'<i class="wv" style="position:absolute;top:{330 - h / 2}px;left:{50 + i * 18}px;width:10px;height:{h}px;border-radius:5px;background:#e2e0da"></i>' for i, h in enumerate(hs))
L4 = ['«Запись в Listening', 'можно переслушать»']
write('s04', scene('s04', '', chrome(4, 3) + myth_html(L4) + card('Запись звучит один раз.',
    wave + '<span class="pill play" style="top:470px;left:50px">▶ 1×</span>'
    '<span class="pill off again" style="top:470px;left:250px">↻ повтор<i class="stk" style="position:absolute;left:-6px;right:-6px;top:50%;height:6px;margin-top:-3px;border-radius:3px;background:#de0b1b;transform-origin:0 50%"></i></span>'
    '<span class="pill soft info" style="top:550px;left:50px">4 части · 40 вопросов · ~30 минут</span>') + src('ielts.org · Academic Listening'),
    chrome_js(4) + myth_js(L4) + """
tl.fromTo(q('.play'), {scale: 0.5, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)'}, 2.95);
// the recording passes once: bars grow and turn green as the playhead moves
qa('.wv').forEach((el, i) => tl.fromTo(el, {scaleY: 0, backgroundColor: '#e2e0da'}, {scaleY: 1, backgroundColor: '#2e5e3a', duration: 0.25, ease: 'power2.out'}, 3.05 + i * 0.03));
tl.fromTo(q('.again'), {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: 0.35}, 4.4);
tl.fromTo(q('.stk'), {scaleX: 0}, {scaleX: 1, duration: 0.3, ease: 'power2.in'}, 4.75);
tl.fromTo(q('.info'), {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: 0.4}, 4.95);
""", '04 listening'))

# ================= 05 rounding =================
L5 = ['«Средний балл 6.25', 'округлят вниз до 6.0»']


def calc_row(top, nums, avg, res, cls):
    return (f'<div class="{cls} nums" style="top:{top}px;left:44px;right:44px;font:600 36px/1.2 Inter;color:#6e6d6b">{nums}</div>'
            f'<div class="{cls} calc" style="top:{top + 48}px;left:44px;right:44px;font:800 64px/1.1 Manrope;letter-spacing:-.02em;white-space:nowrap">{avg} → <span class="good res">{res}</span></div>')


write('s05', scene('s05', '', chrome(5, 4) + myth_html(L5) + card(
    'Среднее из четырёх секций округляют до ближайшей половины: .25 — вверх до .5, .75 — вверх до целого.',
    calc_row(340, '6.0 · 6.0 · 6.5 · 6.5', '25 ÷ 4 = <span class="v">6.25</span>', '6.5', 'r1') + calc_row(475, '6.5 · 7.0 · 7.0 · 6.5', '27 ÷ 4 = <span class="v">6.75</span>', '7.0', 'r2'))
    + src('ielts.org · IELTS scoring in detail'),
    chrome_js(5) + myth_js(L5, 0.035) + """
function row(cls, at, to) {
  const nums = q('.' + cls + '.nums'), calc = q('.' + cls + '.calc'), v = calc.querySelector('.v'), res = calc.querySelector('.res');
  tl.fromTo(nums, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.35, ease: 'power3.out'}, at);
  tl.fromTo(calc, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.35, ease: 'power3.out'}, at + 0.15);
  ticker(at + 0.2, 0.55, (p) => { v.textContent = (to * p).toFixed(2); });
  tl.fromTo(res, {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)', immediateRender: false}, at + 0.85);
}
row('r1', 2.9, 6.25);
row('r2', 3.95, 6.75);
""", '05 rounding'))

# ================= 06 validity =================
L6 = ['«Результат IELTS', 'действует всегда»']
tx0, tln, tyy = 100, 700, 440
tim = (f'<div class="tl0" style="top:{tyy - 3}px;left:{tx0}px;width:{tln}px;height:6px;border-radius:3px;background:#161311;transform-origin:0 50%"></div>'
       f'<div class="tlf" style="top:{tyy - 3}px;left:{tx0}px;width:{tln}px;height:6px;border-radius:3px;background:#2e5e3a;transform-origin:0 50%"></div>')
for x, t in ((0, 'экзамен'), (tln / 2, '1 год'), (tln, '2 года')):
    tim += (f'<i class="tt" style="top:{tyy - 23}px;left:{tx0 + x - 3}px;width:6px;height:46px;border-radius:3px;background:#161311"></i>'
            f'<div class="cap tlab" style="top:{tyy + 40}px;left:{tx0 + x - 70}px;width:140px;font-size:28px">{t}</div>')
tim += '<div class="big" style="top:300px;left:500px;width:300px;text-align:right;white-space:nowrap;font:800 96px/1 Manrope;color:#2e5e3a"></div>'
write('s06', scene('s06', '', chrome(6, 5) + myth_html(L6) + card(
    'Рекомендуют считать результат действительным 2 года после экзамена.', tim) + src('ielts.org · IELTS scoring in detail'),
    chrome_js(6) + myth_js(L6) + """
tl.fromTo(q('.tl0'), {scaleX: 0}, {scaleX: 1, duration: 0.5, ease: 'power2.inOut'}, 3.1);
qa('.tt').forEach((el, i) => tl.fromTo(el, {scaleY: 0}, {scaleY: 1, duration: 0.25, ease: 'back.out(2)'}, 3.25 + i * 0.12));
qa('.tlab').forEach((el, i) => tl.fromTo(el, {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: 0.3}, 3.4 + i * 0.12));
tl.fromTo(q('.tlf'), {scaleX: 0}, {scaleX: 1, duration: 1.0, ease: 'none'}, 3.75);
const big = q('.big');
labelAt(big, [[4.2, '1 год'], [4.75, '2 года']]);
tl.fromTo(big, {scale: 1}, {scale: 1.08, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '100% 50%'}, 4.75);
""", '06 validity'))

# ================= 07 CTA =================
write('s07', scene('s07', """
.spk{position:absolute;left:0;top:0;width:300px;height:300px}
.wm2{position:absolute;left:250px;top:490px;width:580px}
.head{position:absolute;left:0;right:0;top:700px;text-align:center;font:800 76px/1.08 'Manrope';letter-spacing:-.02em;color:#161311}
.head .ln{display:block}
.sub{position:absolute;left:0;right:0;top:930px;text-align:center;font:600 42px/1.25 'Inter';color:#6e6d6b}
.pillwrap{position:absolute;left:0;right:0;top:1010px;text-align:center}
.pillwrap .pill{position:static;display:inline-block}
""", chrome(7, wm=False) + """
<div class="spk"></div>
<img class="wm2" src="assets/brand/wordmark-ink.png" alt="ashyq" />
<div class="head"><span class="ln">""" + words('А какой') + '</span><span class="ln">' + words('у тебя уровень?') + """</span></div>
<div class="sub">Бесплатная диагностика · ~20 минут</div>
<div class="pillwrap"><span class="pill red">ссылка в профиле</span></div>
<div class="hand" style="top:1110px;left:250px">сохрани, чтобы не потерять</div>
<div class="src">Факты: ielts.org, IDP IELTS</div>
""", chrome_js(7, False, wm=False) + SPARK_JS + """
tl.fromTo(q('.wm2'), {y: 300, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}, 0.2);
rise(tl, S, '.head .w', [1.15, 1.3, 1.45, 1.6], 0.4);
tl.fromTo(q('.sub'), {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.4, ease: 'power3.out'}, 2.0);
tl.fromTo(q('.pill.red'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)'}, 2.4);
wipe(tl, q('.hand'), 2.9, 3.9);
tl.fromTo(q('.src'), {opacity: 0}, {opacity: 1, duration: 0.4}, 4.0);
// «Искра» flies in on an arc, lands on the wordmark, cheers, then waves
const spk = q('.spk');
const land = 1.0;
let last = '';
tl.to({}, {duration: %s, ease: 'none', onUpdate() {
  const t = this.time();
  const f = Math.min(1, Math.max(0, (t - 0.25) / (land - 0.25)));
  const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  const x = 1120 + (390 - 1120) * e;
  const y = 1100 + (190 - 1100) * e - Math.sin(Math.PI * e) * 220;
  const k = Math.min(1, Math.max(0, (t - land) / 0.35));
  const pose = t < 0.25 ? {name: 'fly'} : t < land ? {name: 'fly'} : t < land + 0.8 ? {name: 'cheer'} : {name: 'wave', phase: (t - land) * 1.6};
  pose.squash = t >= land ? 1 - 0.2 * Math.sin(Math.PI * k) * (1 - k) : 1;
  pose.blink = Math.max(0, ...[3.0, 5.0].map((b) => 1 - Math.abs(t - b) / 0.09));
  spk.style.transform = `translate(${x}px, ${y}px)`;
  const svg = window.SPARK.spark('logo', pose);
  if (svg !== last) { spk.innerHTML = svg; last = svg; }
}}, 0);
""" % DUR, '07 cta'))

# ---------- background: notebook grid ----------
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
    <title>ASHYQ — Миф → факт (карусель)</title>
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
