# Generates compositions/*.html and index.html for the «Спроси Искру» FAQ carousel (1080x1440).
# Seven 6 s slides: hook, five novice questions answered as a chat by the mascot (product facts only), CTA.
# Every question slide shares one layout: «ты» bubble right, typing dots, answer bubble left, a visual below.
# scripts/export.sh cuts the rendered strip into slides.
#   python3 scripts/build.py
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
SPARK_JS = open(f'{P}/assets/spark.js').read()
W, M, DUR, N = 1080, 90, 6.0, 7
T_TYPE, T_ANS, T_VIS = 0.95, 1.7, 2.4   # typing dots, answer bubble, visual


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
.who{position:absolute;font:600 26px/1 'Inter';color:#8c8b8a;white-space:nowrap}
.qb{position:absolute;padding:26px 34px;border-radius:40px 40px 10px 40px;background:#e9e7e1;color:#161311;font:800 54px/1.12 'Manrope';letter-spacing:-.015em;white-space:nowrap;transform-origin:100% 100%}
.ab{position:absolute;left:90px;top:570px;width:900px;padding:30px 36px 30px 44px;border-radius:10px 40px 40px 40px;background:#fdfdfd;box-shadow:0 16px 50px rgba(22,19,17,.1);border-left:10px solid #de0b1b;color:#161311;font:600 46px/1.32 'Inter';transform-origin:0 0}
.ab b{font-weight:800;font-family:'Manrope';white-space:nowrap}
.typ{position:absolute;left:90px;top:570px;width:170px;height:96px;border-radius:10px 40px 40px 40px;background:#fdfdfd;box-shadow:0 16px 50px rgba(22,19,17,.1);transform-origin:0 0}
.typ i{position:absolute;top:38px;width:20px;height:20px;border-radius:50%;background:#8c8b8a}
.vis{position:absolute;left:90px;top:870px;width:900px;height:300px}
.vis *{position:absolute}
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
    const blink = Math.max(0, ...[2.1, 3.9, 5.3].map((b) => 1 - Math.abs(t - b) / 0.09));
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
    """cur: index of the current question, 'all' or None."""
    s, x0 = '<div class="dts">', W / 2 - 2 * 60
    for i in range(5):
        on = cur == 'all' or cur == i
        big = cur == i
        d = 28 if big else 18
        s += f'<i class="{"dn" if on else ""}" style="{st(1300 + (0 if big else 5), x0 + i * 60 - d / 2, w=d, h=d, extra="border-radius:50%;background:" + ("#de0b1b" if on else "#e2e0da") + ";")}"></i>'
    return s + '</div>'


def dots_js(at=0.2):
    return (f"tl.fromTo(q('.dts'), {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, {at});\n"
            "qa('.dn').forEach((el, i) => tl.fromTo(el, {scale: 0}, {scale: 1, duration: 0.4, ease: 'back.out(3)'}, 0.5 + i * 0.12));\n")


def cx(top, left, w, t, size=26, weight=600, color='#6e6d6b', fam='Inter', cls=''):
    return f'<div class="{cls}" style="{st(top, left, w=w, extra="text-align:center;white-space:nowrap;" + fnt(weight, size, 1, fam) + f"color:{color};")}">{t}</div>'


def chat(q_text, a_html):
    return ('<div class="who" style="top:200px;right:90px">ты</div>'
            f'<div class="qb" style="top:240px;right:90px">{q_text}</div>'
            '<div class="spk" style="left:80px;top:420px;width:130px;height:130px"></div>'
            '<div class="who iw" style="top:470px;left:220px">Искра · ASHYQ</div>'
            '<div class="typ"><i style="left:40px"></i><i style="left:75px"></i><i style="left:110px"></i></div>'
            f'<div class="ab">{a_html}</div>')


CHAT_JS = f"""
tl.fromTo(q('.who'), {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, 0.25);
tl.fromTo(q('.qb'), {{x: 120, opacity: 0, scale: 0.9}}, {{x: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)'}}, 0.3);
tl.fromTo(q('.spk'), {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)'}}, 0.75);
tl.fromTo(q('.iw'), {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, 0.85);
tl.fromTo(q('.typ'), {{scale: 0.6, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)'}}, {T_TYPE});
qa('.typ i').forEach((el, i) => tl.fromTo(el, {{y: 0}}, {{y: -12, duration: 0.18, ease: 'sine.inOut', yoyo: true, repeat: 3}}, {T_TYPE} + 0.1 + i * 0.1));
tl.to(q('.typ'), {{opacity: 0, duration: 0.12}}, {T_ANS - 0.05});
tl.fromTo(q('.ab'), {{scale: 0.92, opacity: 0, y: 16}}, {{scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)'}}, {T_ANS});
"""

THINK_THEN = "(t) => (t < %s ? {name: 'think', lookX: -6 + Math.sin(t * 1.3) * 4} : %s)" % (T_ANS, '%s')


def q_slide(n, idx, q_text, a_html, vis_html, vis_js, answer_pose="{name: 'stand'}", extra_body=''):
    cid = f's0{n}'
    write(cid, scene(cid, '', head(f'ВОПРОС {idx + 1}/5') + chat(q_text, a_html) + f'<div class="vis">{vis_html}</div>' + extra_body + dots(idx),
                     HEAD_JS + SPARK_DRIVER + CHAT_JS + vis_js + dots_js() + f"driveSpark({THINK_THEN % answer_pose});\n", f'{n} faq'))


# ================= 01 hook =================
write('s01', scene('s01', """
.big{position:absolute;left:90px;top:190px;font:800 150px/.95 'Manrope';letter-spacing:-.04em;color:#161311}
.big .ln{display:block;white-space:nowrap}
.sub1{position:absolute;left:90px;right:90px;top:505px;font:600 44px/1.3 'Inter';color:#6e6d6b}
.qh{font-size:60px;line-height:1}
""", head('FAQ') +
    '<div class="big"><span class="ln">' + words('Спроси') + '</span><span class="ln" style="color:#de0b1b">' + words('Искру') + '</span></div>'
    '<div class="sub1">5 честных ответов перед стартом</div>'
    '<div class="qb qh" style="top:700px;right:90px">когда занятия?</div>'
    '<div class="qb qh" style="top:820px;right:90px">к чему готовите?</div>'
    '<div class="qb qh" style="top:940px;right:90px">а бесплатно?</div>'
    '<div class="spk" style="left:40px;top:720px;width:380px;height:380px"></div>'
    '<div class="hand" style="top:1150px;left:90px">листай и спрашивай</div>' + dots(None),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.big .w', [0.25, 0.45], 0.5);
tl.fromTo(q('.sub1'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 0.9);
qa('.qb').forEach((el, i) => tl.fromTo(el, {x: 140, opacity: 0, scale: 0.85}, {x: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)'}, 1.5 + i * 0.35));
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 1.1);
wipe(tl, q('.hand'), 3.0, 4.0);
""" + dots_js(0.3) + "driveSpark((t) => ({name: 'wave', phase: t * 1.6}));\n", '01 hook'))

# ================= 02 level =================
def arc(a0, a1, r, cls, col):
    x0_, y0_ = 450 + r * math.cos(math.radians(a0)), 250 + r * math.sin(math.radians(a0))
    x1_, y1_ = 450 + r * math.cos(math.radians(a1)), 250 + r * math.sin(math.radians(a1))
    return f'<path class="{cls}" d="M{x0_:.1f} {y0_:.1f} A{r} {r} 0 0 1 {x1_:.1f} {y1_:.1f}" pathLength="1" stroke-dasharray="1" fill="none" stroke="{col}" stroke-width="30" stroke-linecap="round"/>'


gauge = (f'<svg style="{st(0, 0, w=900, h=300)}" viewBox="0 0 900 300">{arc(180, 360, 190, "ga", "#e2e0da")}{arc(238, 306, 190, "gg", "#2e5e3a")}'
         f'<line class="needle" x1="450" y1="250" x2="{450 + 150 * math.cos(math.radians(272)):.1f}" y2="{250 + 150 * math.sin(math.radians(272)):.1f}" stroke="#161311" stroke-width="10" stroke-linecap="round"/>'
         f'<circle class="hub" cx="450" cy="250" r="16" fill="#161311"/></svg>' + cx(265, 0, 900, 'диапазон, а не одно число', 28, 500, '#8c8b8a', 'Inter', 'gcap'))
q_slide(2, 0, 'Как узнать свой уровень?',
        'Пройди бесплатную диагностику: <b>~20 минут</b> — и увидишь диапазон балла, сильные и слабые навыки и следующий шаг.', gauge, f"""
tl.fromTo(q('.ga'), {{strokeDashoffset: 1}}, {{strokeDashoffset: 0, duration: 0.7, ease: 'power2.out'}}, {T_VIS});
tl.fromTo(q('.hub'), {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, {T_VIS});
tl.fromTo(q('.needle'), {{rotation: -80, svgOrigin: '450 250', opacity: 0}}, {{rotation: 0, svgOrigin: '450 250', opacity: 1, duration: 1.3, ease: 'elastic.out(1, 0.5)'}}, {T_VIS + 0.3});
tl.fromTo(q('.gg'), {{strokeDashoffset: 1}}, {{strokeDashoffset: 0, duration: 0.6, ease: 'power2.out'}}, {T_VIS + 0.8});
tl.fromTo(q('.gcap'), {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, {T_VIS + 1.4});
""", "{name: 'cheer', mood: 'wow'}")

# ================= 03 schedule =================
week = ''
for i, d in enumerate(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']):
    on = i < 6
    week += (f'<div class="{"wd" if on else "ws"}" style="{st(40, 45 + i * 120, w=100, h=100, extra="border-radius:50%;display:flex;align-items:center;justify-content:center;" + fnt(800, 36, 1, "Manrope") + ("background:#de0b1b;color:#fff;" if on else "background:#efeeea;color:#8c8b8a;"))}">{d}</div>')
week += cx(190, 0, 900, '19:00–23:00 · Астана (UTC+5)', 48, 800, '#161311', 'Manrope', 'wt')
q_slide(3, 1, 'Когда занятия?', 'Понедельник — суббота, <b>19:00–23:00</b> по Астане.', week, f"""
qa('.wd').forEach((el, i) => tl.fromTo(el, {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.6)'}}, {T_VIS} + i * 0.13));
tl.fromTo(q('.ws'), {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, {T_VIS + 0.9});
tl.fromTo(q('.wt'), {{y: 24, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, {T_VIS + 1.1});
""")

# ================= 04 programs =================
tracks = ''
for i, (a, b) in enumerate([('IELTS', 'Academic'), ('Digital SAT', 'экзамен'), ('Менторство', 'по поступлению')]):
    x = 0 + i * 310
    tracks += (f'<div class="tk" style="{st(20, x, w=280, h=240)}">'
               f'<div style="{st(0, 0, w=280, h=240, extra="background:#fcf3f0;border-radius:28px;")}"></div>'
               f'<i style="{st(36, 32, w=44, h=8, extra="background:#de0b1b;border-radius:4px;")}"></i>'
               f'<div style="{st(80, 32, w=240, extra=fnt(800, 38, 1.05, "Manrope") + "letter-spacing:-.02em;white-space:nowrap;color:#161311;")}">{a}</div>'
               f'<div style="{st(150, 32, w=240, extra=fnt(600, 30, 1, "Inter") + "color:#6e6d6b;white-space:nowrap;")}">{b}</div></div>')
q_slide(4, 2, 'К чему готовите?', 'К <b>IELTS</b> и <b>Digital SAT</b>, а ещё есть менторство по поступлению.', tracks, f"""
qa('.tk').forEach((el, i) => tl.fromTo(el, {{y: 80, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)'}}, {T_VIS} + i * 0.25));
""", "{name: 'cheer'}")

# ================= 05 free =================
free = ''
for i, (a, b) in enumerate([('Библиотека', '42 главы · 322 упражнения'), ('Тренажёр Writing', '2 учебных эссе · 4 критерия'), ('Компас', '40 утверждений · 16 профилей')]):
    y = 10 + i * 92
    free += (f'<div class="fr" style="{st(y, 0, w=900, h=76)}">'
             f'<div style="{st(0, 0, w=900, h=76, extra="background:#e8efe2;border-radius:22px;")}"></div>'
             f'<div class="ck" style="{st(20, 28, extra=fnt(800, 36, 1, "Manrope") + "color:#2e5e3a;")}">✓</div>'
             f'<div style="{st(21, 76, extra=fnt(800, 36, 1, "Manrope") + "color:#2e5e3a;white-space:nowrap;")}">{a}</div>'
             f'<div style="{st(25, 440, w=430, extra="text-align:right;" + fnt(600, 30, 1, "Inter") + "color:#2e5e3a;white-space:nowrap;")}">{b}</div></div>')
q_slide(5, 3, 'Можно начать бесплатно?', '<b>Да.</b> Библиотека, тренажёр Writing и Компас открыты бесплатно — заходи и пробуй.', free, f"""
qa('.fr').forEach((el, i) => tl.fromTo(el, {{x: -60, opacity: 0}}, {{x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, {T_VIS} + i * 0.3));
qa('.ck').forEach((el, i) => tl.fromTo(el, {{scale: 0}}, {{scale: 1, duration: 0.35, ease: 'back.out(3)'}}, {T_VIS + 0.3} + i * 0.3));
tl.fromTo(q('.ftn'), {{opacity: 0}}, {{opacity: 1, duration: 0.5}}, {T_VIS + 1.3});
""", "{name: 'cheer'}", f'<div class="ftn" style="{st(1215, M, M, extra=fnt(500, 26, 1.2, "Inter") + "color:#8c8b8a;")}">Компас — ориентир, а не диагноз и не официальный MBTI®</div>')

# ================= 06 no guarantee =================
nog = (f'<div class="ng" style="{st(40, 0, w=900, extra="text-align:center;white-space:nowrap;" + fnt(800, 96, 1, "Manrope") + "color:#8c8b8a;letter-spacing:-.03em;")}" data-layout-allow-overlap>гарантия балла</div>'
       f'<i class="strk" style="{st(90, 110, w=680, h=16, extra="background:#de0b1b;border-radius:8px;transform:rotate(-4deg);transform-origin:0 50%;")}"></i>'
       + cx(200, 0, 900, 'вместо неё — честная карта: где ты сейчас → что дальше', 30, 600, '#161311', 'Inter', 'alt'))
q_slide(6, 4, 'Гарантируете балл?', '<b>Нет.</b> Балл зависит от твоей работы. Мы честно покажем, где ты сейчас и что делать дальше.', nog, f"""
tl.fromTo(q('.ng'), {{y: 20, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}}, {T_VIS});
tl.fromTo(q('.strk'), {{scaleX: 0}}, {{scaleX: 1, rotation: -4, duration: 0.45, ease: 'power2.inOut'}}, {T_VIS + 0.6});
tl.fromTo(q('.alt'), {{y: 20, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, {T_VIS + 1.2});
""")

# ================= 07 CTA =================
write('s07', scene('s07', """
.ttl{position:absolute;left:90px;right:90px;top:190px;font:800 100px/1.02 'Manrope';letter-spacing:-.03em;color:#161311}
.ttl .ln{display:block;white-space:nowrap}
.fx{position:absolute;left:90px;right:90px;top:430px;font:600 42px/1.3 'Inter';color:#6e6d6b}
""", head('ФИНИШ') +
    '<div class="ttl"><span class="ln">' + words('Остались') + '</span><span class="ln">' + words('вопросы?') + '</span></div>'
    '<div class="fx">Бесплатная диагностика · ~20 минут</div>'
    '<div class="pill" style="top:560px;left:90px">ссылка в профиле</div>'
    '<div class="hand" style="top:700px;left:90px">сохрани, чтобы не потерять</div>'
    '<div class="spk" style="left:560px;top:800px;width:400px;height:400px"></div>' + dots('all'),
    HEAD_JS + SPARK_DRIVER + """
rise(tl, S, '.ttl .w', [0.3, 0.5], 0.5);
tl.fromTo(q('.fx'), {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}, 1.1);
tl.fromTo(q('.pill'), {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)'}, 1.7);
tl.to(q('.pill'), {scale: 1.06, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3}, 3.2);
wipe(tl, q('.hand'), 2.3, 3.4);
tl.fromTo(q('.spk'), {y: 120, opacity: 0}, {y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.8)'}, 0.9);
""" + dots_js(0.3) + "driveSpark((t) => ({name: 'cheer', phase: t * 1.5}));\n", '07 cta'))

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
    <title>ASHYQ — Спроси Искру (карусель)</title>
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
