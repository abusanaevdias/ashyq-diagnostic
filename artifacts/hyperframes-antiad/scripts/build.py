# Generates compositions/*.html and index.html for «Антиреклама» from one place:
# scene timings come from the voice-over (assets/voice/durations.json, *.words.json).
#   python3 scripts/build.py
# After a rebuild, re-run the bed carve (index.html is regenerated without it):
#   node <hyperframes-audio>/scripts/carve.mjs --comp index.html --bed bed
import json, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
spark_js = open(f'{P}/assets/spark.js').read()

def write(name, html):
    open(f'{C}/{name}.html', 'w').write(html)

def scope(cid):
    return f"const S = document.querySelector('[data-composition-id=\"{cid}\"]');\nconst tl = gsap.timeline({{ paused: true }});\n"

def reg(cid):
    return f"window.__timelines['{cid}'] = tl;\n"

# ---------- background: ghost «НЕ» + paper grain (whole film until the CTA) ----------
write('bg', sub('bg', """
#bg-ghost{position:absolute;left:236px;top:1110px;width:1004px;height:696px;opacity:.6}
#bg-grain{position:absolute;inset:0;opacity:.07}
""", """
        <img id="bg-ghost" data-layout-allow-overflow src="assets/brand/ghost-ne.png" alt="" />
        <svg id="bg-grain" viewBox="0 0 1080 1920" preserveAspectRatio="none"><filter id="bg-n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .09 0 0 0 0 .07 0 0 0 0 .06 0 0 0 .9 0"/></filter><rect width="1080" height="1920" filter="url(#bg-n)"/></svg>
""", scope('bg') + """
// slow bounded drift of the ghost word: 30.4 s window, 6 s per cycle
const cycles = Math.max(0, Math.floor(30.4 / 6) - 1);
tl.fromTo('#bg-ghost', {y: 0, x: 0}, {y: -46, x: -18, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: cycles * 2 + 1}, 0);
""" + reg('bg'), 'bg'))

# ---------- the pinned anchor for frames 02–05 ----------
write('anchor', sub('anchor', """
#an-line{position:absolute;left:72px;top:290px;font:800 88px/1 'Manrope';letter-spacing:-.02em;white-space:nowrap}
#an-line .r{color:#de0b1b}
#an-rule{position:absolute;left:72px;right:72px;top:402px;height:5px;background:#161311;transform-origin:0 50%}
#an-count{position:absolute;right:72px;top:436px;font:800 42px/1 'Manrope';color:#6e6d6b;white-space:nowrap}
#an-count b{display:inline-block;color:#161311}
#an-count span{color:#8c8b8a}
""", """
        <div id="an-line"><span class="m"><span class="w r">НЕ</span></span> <span class="m"><span class="w">ПРИХОДИ,</span></span> <span class="m"><span class="w">ЕСЛИ…</span></span></div>
        <div id="an-rule"></div>
        <div id="an-count"><b id="an-n">1</b><span>/4</span></div>
""", scope('anchor') + """
// anchor lands once with the voice («Не приходи, если…») and never moves again
rise(tl, S, '#an-line .w', [0.2, 0.33, 1.17], 0.34);
tl.fromTo('#an-rule', {scaleX: 0}, {scaleX: 1, duration: 0.6, ease: 'power3.inOut'}, 0.3);
tl.fromTo('#an-count', {opacity: 0}, {opacity: 1, duration: 0.3}, 0.3);
// counter hard-cuts 1→2→3→4 at each scene cut (scene starts relative to the anchor slot)
const n = document.getElementById('an-n');
const cuts = [[0, '1'], [6.2, '2'], [12.1, '3'], [18.1, '4']];
tl.to({}, {duration: 24.4, ease: 'none', onUpdate() {
  const t = this.time();
  let v = '1';
  for (const [at, label] of cuts) if (t >= at) v = label;
  if (n.textContent !== v) n.textContent = v;
}}, 0);
cuts.slice(1).forEach(([at]) => tl.fromTo('#an-n', {scale: 1.5}, {scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false}, at));
""" + reg('anchor'), 'anchor'))

# ---------- 01 hook ----------
write('s01', sub('s01', """
#s01-ne{position:absolute;left:62px;top:300px;font:800 300px/.9 'Manrope';letter-spacing:-.04em;color:#de0b1b;transform-origin:0 60%}
#s01-l2{position:absolute;left:72px;top:600px;font:800 124px/1 'Manrope';letter-spacing:-.03em;white-space:nowrap}
#s01-l3{position:absolute;left:72px;top:752px;font:800 210px/1 'Manrope';letter-spacing:-.04em;white-space:nowrap}
#s01-rule{position:absolute;left:72px;top:1010px;width:300px;height:10px;background:#de0b1b;transform-origin:0 50%}
""", """
        <div id="s01-ne">НЕ</div>
        <div id="s01-l2"><span class="m"><span class="w">ЗАПИСЫВАЙСЯ</span></span></div>
        <div id="s01-l3"><span class="m"><span class="w">В</span></span> <span class="m"><span class="w">ASHYQ.</span></span></div>
        <div id="s01-rule"></div>
""", scope('s01') + """
// voice starts at 0.10: «Не»@0.15 «записывайся»@0.23 «Ашык»@1.08
tl.fromTo('#s01-ne', {scale: 1.7, opacity: 0}, {scale: 1, opacity: 1, duration: 0.24, ease: 'power4.out'}, 0.12);
rise(tl, S, '#s01-l2 .w', [0.24], 0.42);
rise(tl, S, '#s01-l3 .w', [1.02, 1.12], 0.4, 'back.out(1.6)');
tl.fromTo('#s01-rule', {scaleX: 0}, {scaleX: 1, duration: 0.45, ease: 'power3.out'}, 1.45);
""" + reg('s01'), '01 hook'))

# shared CSS for the four «если» scenes
COND = """
.cond{position:absolute;left:72px;right:200px;top:432px;font:600 54px/1.22 'Inter';color:#161311}
.ans{position:absolute;left:72px;right:60px;top:1010px;font:700 92px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%}
.pill{position:absolute;display:inline-block;padding:18px 34px;border-radius:999px;font:600 40px/1 'Inter';white-space:nowrap}
.pill.soft{background:#fcf3f0;color:#b60916}
.pill.red{background:#de0b1b;color:#fff}
"""
def cond_html(pfx, words):
    return f'<div class="cond" id="{pfx}-cond">' + ' '.join(f'<span class="m"><span class="w">{w}</span></span>' for w in words) + '</div>'

# ---------- 02 promise ----------
write('s02', sub('s02', COND + """
#s02-st{position:absolute;left:270px;top:590px;width:420px;height:420px;border-radius:50%;border:10px dashed #de0b1b;background:#fdfdfd;display:flex;flex-direction:column;align-items:center;justify-content:center}
#s02-st .k{font:600 34px/1 'Inter';letter-spacing:.2em}
#s02-st .v{font:800 190px/1 'Manrope';letter-spacing:-.04em}
#s02-strike{position:absolute;left:200px;top:560px;width:680px;height:500px;overflow:visible}
""", f"""
        {cond_html('s02', ['тебе', 'нужно', 'обещание', '«восьмёрки»'])}
        <div id="s02-st"><div class="k">ГАРАНТИЯ</div><div class="v">8.0</div></div>
        <svg id="s02-strike" viewBox="0 0 680 500"><path id="s02-path" d="M40 440 C220 330 420 170 640 60" pathLength="1" stroke="#de0b1b" stroke-width="22" stroke-linecap="round" fill="none" stroke-dasharray="1"/></svg>
        <div class="ans" id="s02-ans">баллы мы не обещаем</div>
""", scope('s02') + """
// voice at 0.15: тебе@1.53 нужно@1.90 обещание@2.36 восьмёрки@3.09 · баллы@4.04 не обещаем@4.61–5.63
rise(tl, S, '#s02-cond .w', [1.53, 1.90, 2.36, 3.09]);
tl.fromTo('#s02-st', {y: -520, rotation: -34, opacity: 0}, {y: 0, rotation: -8, opacity: 1, duration: 0.55, ease: 'back.out(1.7)'}, 3.05);
tl.fromTo('#s02-path', {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.34, ease: 'power2.in'}, 4.6);
tl.to('#s02-st', {rotation: -4, scale: 0.96, duration: 0.2, ease: 'power2.out'}, 4.94);
wipe(tl, '#s02-ans', 4.04, 5.6);
""" + reg('s02'), '02 promise'))

# ---------- 03 guess ----------
rnd = random.Random(3)
picks = [rnd.randrange(4) for _ in range(4)]
rows = ''
for r in range(4):
    cells = ''.join(f'<span class="b" id="s03-b{r}{i}">{l}</span>' for i, l in enumerate('ABCD'))
    rows += f'<div class="row"><span class="num">{r+1}</span>{cells}</div>'
write('s03', sub('s03', COND + """
#s03-card{position:absolute;left:72px;top:560px;width:600px;padding:40px 44px;background:#fdfdfd;border-radius:32px;box-shadow:0 20px 60px rgba(22,19,17,.1)}
#s03-card .row{display:flex;align-items:center;gap:24px;margin-top:20px}
#s03-card .row:first-child{margin-top:0}
#s03-card .num{font:800 44px/1 'Manrope';width:60px}
#s03-card .b{width:66px;height:66px;border-radius:50%;border:4px solid #161311;display:flex;align-items:center;justify-content:center;font:600 30px/1 'Inter';color:#6e6d6b}
#s03-die{position:absolute;left:740px;top:600px;width:220px;height:220px;border-radius:40px;border:8px solid #161311;background:#fdfdfd}
#s03-die i{position:absolute;width:40px;height:40px;border-radius:50%;background:#161311}
#s03-q{position:absolute;left:790px;top:850px;font:800 120px/1 'Manrope';color:#de0b1b}
""", f"""
        {cond_html('s03', ['любишь', 'угадывать', 'ответы', 'в', 'Listening'])}
        <div id="s03-card">{rows}</div>
        <div id="s03-die"><i style="top:30px;left:30px"></i><i style="top:30px;right:30px"></i><i style="top:82px;left:82px"></i><i style="bottom:30px;left:30px"></i><i style="bottom:30px;right:30px"></i></div>
        <div id="s03-q">?</div>
        <div class="ans" id="s03-ans">на занятиях разбираем ловушки</div>
""", scope('s03') + f"""
// voice at 0.15: любишь@0.49 угадывать@1.03 ответы@1.72 в@2.19 Listening@2.27 · на занятиях@3.30 … ловушки@4.73–5.29
rise(tl, S, '#s03-cond .w', [0.49, 1.03, 1.72, 2.19, 2.27]);
tl.fromTo('#s03-card', {{x: -60, opacity: 0}}, {{x: 0, opacity: 1, duration: 0.45, ease: 'power3.out'}}, 0.75);
tl.fromTo('#s03-die', {{y: -300, rotation: -200, opacity: 0}}, {{y: 0, rotation: 14, opacity: 1, duration: 0.6, ease: 'back.out(1.4)'}}, 0.85);
// the die keeps tumbling while answers get guessed, then freezes on «на занятиях»
tl.to('#s03-die', {{rotation: 14 + 360 * 3, duration: 2.0, ease: 'none'}}, 1.45);
tl.to('#s03-die', {{rotation: 14 + 360 * 3 + 20, duration: 0.35, ease: 'back.out(3)'}}, 3.45);
tl.fromTo('#s03-q', {{scale: 0, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.5)'}}, 1.2);
const picks = {json.dumps(picks)};
picks.forEach((p, r) => tl.fromTo('#s03-b' + r + p, {{backgroundColor: 'rgba(22,19,17,0)', color: '#6e6d6b', scale: 1}}, {{backgroundColor: '#161311', color: '#f8f7f3', scale: 1.12, duration: 0.12, ease: 'power2.out'}}, 1.1 + r * 0.5));
wipe(tl, '#s03-ans', 3.3, 5.2);
""" + reg('s03'), '03 guess'))

# ---------- 04 evening ----------
def pt(deg, r, cx=260, cy=260):
    a = math.radians(deg - 90)
    return cx + r * math.cos(a), cy + r * math.sin(a)
ticks = ''.join(
    f'<line x1="{pt(i*30,220)[0]:.1f}" y1="{pt(i*30,220)[1]:.1f}" x2="{pt(i*30,196)[0]:.1f}" y2="{pt(i*30,196)[1]:.1f}" stroke="#161311" stroke-width="8" stroke-linecap="round"/>'
    for i in range(12))
x1, y1 = pt(210, 170); x2, y2 = pt(330, 170)
write('s04', sub('s04', COND + """
#s04-clock{position:absolute;left:72px;top:560px;width:460px;height:460px}
#s04-hand{position:absolute;left:295px;top:655px;width:14px;height:135px;border-radius:7px;background:#161311;transform-origin:50% 100%}
#s04-dot{position:absolute;left:287px;top:775px;width:30px;height:30px;border-radius:50%;background:#161311}
.s04-t{position:absolute;left:590px;font:800 110px/1 'Manrope';letter-spacing:-.03em}
#s04-do{position:absolute;left:600px;top:772px;font:600 50px/1 'Inter';color:#6e6d6b}
""", f"""
        {cond_html('s04', ['вечером', 'ты', 'занят'])}
        <svg id="s04-clock" viewBox="0 0 520 520"><circle cx="260" cy="260" r="236" fill="#fdfdfd" stroke="#161311" stroke-width="8"/>{ticks}<path id="s04-arc" d="M{x1:.1f} {y1:.1f} A170 170 0 0 1 {x2:.1f} {y2:.1f}" pathLength="1" stroke="#de0b1b" stroke-width="44" fill="none" stroke-linecap="round" stroke-dasharray="1"/></svg>
        <div id="s04-hand"></div><div id="s04-dot"></div>
        <div class="s04-t" id="s04-t1" style="top:640px">19:00</div>
        <div id="s04-do">до</div>
        <div class="s04-t" id="s04-t2" style="top:842px">23:00</div>
        <div class="pill soft" id="s04-pill" style="left:590px;top:985px">пн–сб · по Астане</div>
        <div class="ans" id="s04-ans" style="top:1080px">как раз после школы</div>
""", scope('s04') + """
// voice at 0.15: вечером@0.50 ты@1.11 занят@1.28 · занятия@1.95 с 7@2.75 до@3.05 11@3.25–3.83 · как раз после школы@4.13–5.47
rise(tl, S, '#s04-cond .w', [0.50, 1.11, 1.28]);
tl.fromTo('#s04-clock', {scale: 0.85, opacity: 0}, {scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)'}, 0.7);
tl.fromTo(['#s04-hand', '#s04-dot'], {opacity: 0}, {opacity: 1, duration: 0.3}, 0.8);
// the hand sweeps to seven, then drags the red arc to eleven with the spoken numbers
tl.fromTo('#s04-hand', {rotation: 60}, {rotation: 210, duration: 0.8, ease: 'power2.inOut'}, 1.95);
tl.fromTo('#s04-arc', {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.08, ease: 'power1.inOut'}, 2.75);
tl.to('#s04-hand', {rotation: 330, duration: 1.08, ease: 'power1.inOut'}, 2.75);
tl.fromTo('#s04-t1', {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)'}, 2.75);
tl.fromTo('#s04-do', {opacity: 0}, {opacity: 1, duration: 0.25}, 3.05);
tl.fromTo('#s04-t2', {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)'}, 3.25);
tl.fromTo('#s04-pill', {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.2)'}, 3.6);
wipe(tl, '#s04-ans', 4.13, 5.45);
""" + reg('s04'), '04 evening'))

# ---------- 05 level ----------
segs = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
seg_html = ''.join(f'<div class="seg{" lit" if i < 3 else ""}">{l}</div>' for i, l in enumerate(segs))
seg_w, gap, x0 = 146, 12, 72
centers = [x0 + i * (seg_w + gap) + seg_w / 2 for i in range(6)]
jumps = [(0.9, 3), (1.25, 0), (1.6, 4), (1.95, 1), (2.3, 5), (2.65, 2)]
write('s05', sub('s05', COND + """
#s05-bar{position:absolute;left:72px;right:72px;top:820px;display:flex;gap:12px}
#s05-bar .seg{flex:1;height:64px;border-radius:14px;background:#e6e4de;display:flex;align-items:center;justify-content:center;font:800 34px/1 'Manrope';color:#6e6d6b}
#s05-bar .seg.lit{background:#f9e0db}
#s05-ptr{position:absolute;left:0;top:600px;width:170px;height:200px}
#s05-bub{position:absolute;left:0;top:0;width:170px;height:170px;border-radius:50%;background:#161311;color:#f8f7f3;display:flex;align-items:center;justify-content:center;font:800 120px/1 'Manrope'}
#s05-tri{position:absolute;left:67px;top:165px;width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:26px solid #161311}
""", f"""
        {cond_html('s05', ['не', 'хочешь', 'знать', 'свой', 'уровень'])}
        <div id="s05-ptr"><div id="s05-bub">?</div><div id="s05-tri"></div></div>
        <div id="s05-bar">{seg_html}</div>
        <div class="pill red" id="s05-pill" style="left:72px;top:935px">бесплатно · ~20 минут</div>
        <div class="ans" id="s05-ans" style="top:1062px">диагностика — бесплатно</div>
""", scope('s05') + f"""
// voice at 0.15: не@0.50 хочешь@0.63 знать@1.10 свой@1.49 уровень@1.81 · диагностика@2.51 … бесплатная@3.68 двадцать минут@4.65–5.75
rise(tl, S, '#s05-cond .w', [0.50, 0.63, 1.10, 1.49, 1.81]);
tl.fromTo('#s05-bar', {{y: 30, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}}, 0.7);
const centers = {json.dumps(centers)};
const jumps = {json.dumps(jumps)};
tl.fromTo('#s05-ptr', {{x: centers[3] - 85, scale: 0, opacity: 0}}, {{x: centers[3] - 85, scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)'}}, 0.8);
// the «?» darts around the scale without landing — you don't know your level
jumps.slice(1).forEach(([at, i]) => tl.to('#s05-ptr', {{x: centers[i] - 85, duration: 0.22, ease: 'power3.out'}}, at));
// «бесплатная»: it settles between B1 and B2 and the free-diagnostic pill drops in
tl.to('#s05-ptr', {{x: (centers[2] + centers[3]) / 2 - 85, duration: 0.5, ease: 'power2.inOut'}}, 3.0);
tl.to('#s05-bub', {{backgroundColor: '#de0b1b', duration: 0.25}}, 3.68);
tl.fromTo('#s05-pill', {{y: -30, scale: 0.7, opacity: 0}}, {{y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)'}}, 3.68);
wipe(tl, '#s05-ans', 2.51, 4.6);
""" + reg('s05'), '05 level'))

# ---------- 06 turn (callback to 01, same coordinates) ----------
write('s06', sub('s06', """
#s06-all{position:absolute;inset:0}
#s06-ne{position:absolute;left:62px;top:300px;font:800 300px/.9 'Manrope';letter-spacing:-.04em;color:#de0b1b}
#s06-strike{position:absolute;left:30px;top:330px;width:560px;height:260px;overflow:visible}
#s06-l2{position:absolute;left:72px;top:600px;font:800 124px/1 'Manrope';letter-spacing:-.03em;white-space:nowrap}
#s06-l3{position:absolute;left:72px;top:752px;font:800 210px/1 'Manrope';letter-spacing:-.04em;white-space:nowrap}
#s06-dot{color:#161311}
#s06-ans{position:absolute;left:72px;top:1040px;font:700 104px/1 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%;white-space:nowrap}
""", """
        <div id="s06-all">
          <div id="s06-ne">НЕ</div>
          <svg id="s06-strike" viewBox="0 0 560 260"><path id="s06-p1" d="M20 190 C140 120 300 150 540 40" pathLength="1" stroke="#de0b1b" stroke-width="30" stroke-linecap="round" fill="none" stroke-dasharray="1"/><path id="s06-p2" d="M60 225 C200 170 360 170 520 110" pathLength="1" stroke="#de0b1b" stroke-width="18" stroke-linecap="round" fill="none" stroke-dasharray="1" opacity=".85"/></svg>
          <div id="s06-l2">ЗАПИСЫВАЙСЯ</div>
          <div id="s06-l3">В ASHYQ<span id="s06-dot">.</span></div>
          <div id="s06-ans">похоже, тебе к нам</div>
        </div>
""", scope('s06') + """
// voice at 0.15: всё ещё смотришь@0.27–1.55 · похоже@1.61 тебе к нам@2.16–2.83. Hard cut back to the hook frame.
tl.fromTo('#s06-p1', {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.3, ease: 'power2.in'}, 0.72);
tl.fromTo('#s06-p2', {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 0.25, ease: 'power2.in'}, 1.02);
tl.fromTo('#s06-ne', {color: '#de0b1b'}, {color: '#b9b7b2', duration: 0.3}, 1.0);
tl.fromTo('#s06-dot', {color: '#161311'}, {color: '#de0b1b', duration: 0.2}, 2.54);
wipe(tl, '#s06-ans', 1.61, 2.8);
// push up into the end card
tl.fromTo('#s06-all', {y: 0, opacity: 1}, {y: -520, opacity: 0, duration: 0.4, ease: 'power3.in'}, 3.3);
""" + reg('s06'), '06 turn'))

# ---------- 07 CTA ----------
write('s07', sub('s07', """
#s07-spark{position:absolute;left:0;top:0;width:320px;height:320px}
#s07-wm{position:absolute;left:250px;top:600px;width:580px}
#s07-head{position:absolute;left:0;right:0;top:800px;text-align:center;font:800 84px/1.08 'Manrope';letter-spacing:-.02em}
#s07-head .ln{display:block}
#s07-pillwrap{position:absolute;left:0;right:0;top:1010px;text-align:center}
#s07-pill{display:inline-block;padding:18px 34px;border-radius:999px;background:#de0b1b;color:#fff;font:600 40px/1 'Inter'}
#s07-ai{position:absolute;left:0;right:0;top:1190px;text-align:center;font:600 26px/1 'Inter';color:#8c8b8a}
""", """
        <div id="s07-spark"></div>
        <img id="s07-wm" src="assets/brand/wordmark-ink.png" alt="ashyq" />
        <div id="s07-head"><span class="ln"><span class="m"><span class="w">Начни</span></span> <span class="m"><span class="w">с</span></span> <span class="m"><span class="w">бесплатной</span></span></span><span class="ln"><span class="m"><span class="w">диагностики</span></span></span></div>
        <div id="s07-pillwrap"><span id="s07-pill">ссылка в профиле</span></div>
        <div id="s07-ai">Голос в ролике создан ИИ</div>
""", scope('s07') + spark_js + """
// voice at 0.20: начни@0.25 с@0.55 бесплатной@0.62 диагностики@1.33 · ссылка в профиле@2.25–3.34
tl.fromTo('#s07-wm', {y: 420, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}, 0);
rise(tl, S, '#s07-head .w', [0.25, 0.55, 0.62, 1.33], 0.4);
tl.fromTo('#s07-pill', {scale: 0.6, opacity: 0}, {scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)'}, 2.25);
tl.fromTo('#s07-ai', {opacity: 0}, {opacity: 1, duration: 0.4}, 2.6);
// «Искра» flies in on an arc and lands on the wordmark, then waves — pose derived from timeline time
const box = document.getElementById('s07-spark');
const land = 0.85;
let last = '';
tl.to({}, {duration: 5, ease: 'none', onUpdate() {
  const t = this.time();
  const f = Math.min(1, Math.max(0, (t - 0.15) / (land - 0.15)));
  const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  const x = -360 + (380 + 360) * e;
  const y = 1300 + (300 - 1300) * e - Math.sin(Math.PI * e) * 260;
  const k = Math.min(1, Math.max(0, (t - land) / 0.35));
  const squash = t >= land ? 1 - 0.2 * Math.sin(Math.PI * k) * (1 - k) : 1;
  let pose;
  if (t < land) pose = {name: 'fly'};
  else if (t < land + 0.8) pose = {name: 'cheer'};
  else pose = {name: 'wave', phase: (t - land) * 1.6};
  pose.squash = squash;
  const blinkAt = [2.2, 4.1];
  pose.blink = Math.max(0, ...blinkAt.map((b) => 1 - Math.abs(t - b) / 0.09));
  box.style.transform = `translate(${x}px, ${y}px)`;
  const svg = window.SPARK.spark('logo', pose);
  if (svg !== last) { box.innerHTML = svg; last = svg; }
}}, 0);
""" + reg('s07'), '07 cta'))
print('scenes written')

# ---------- index.html: slots + audio (all timings global) ----------
scenes = [('s01', 0.0, 2.3, 0.10), ('s02', 2.3, 6.2, 0.15), ('s03', 8.5, 5.9, 0.15), ('s04', 14.4, 6.0, 0.15),
          ('s05', 20.4, 6.3, 0.15), ('s06', 26.7, 3.7, 0.15), ('s07', 30.4, 5.0, 0.20)]
TOTAL = 35.4
dur = json.load(open(f'{P}/assets/voice/durations.json'))
vo_ids = ['01-hook', '02-promise', '03-guess', '04-evening', '05-level', '06-turn', '07-cta']
slots = [f'      <div id="el-bg" data-composition-id="bg" data-composition-src="compositions/bg.html" data-start="0" data-duration="30.4" data-track-index="0" data-width="1080" data-height="1920"></div>']
for cid, st, d, _ in scenes:
    slots.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{st}" data-duration="{d}" data-track-index="1" data-width="1080" data-height="1920"></div>')
slots.append('      <div id="el-anchor" data-composition-id="anchor" data-composition-src="compositions/anchor.html" data-start="2.3" data-duration="24.4" data-track-index="2" data-width="1080" data-height="1920"></div>')
audio = []
for (cid, st, d, vo), vid in zip(scenes, vo_ids):
    audio.append(f'      <audio id="vo-{cid}" src="assets/voice/{vid}.mp3" data-start="{round(st + vo, 3)}" data-duration="{dur[vid]}" data-track-index="10" data-volume="1" data-audio-group="voiceover"></audio>')
sfx = [('thump', 0.12, 0.9), ('thump', 2.5, 0.7), ('pop', 5.38, 0.8), ('marker', 6.88, 0.9),
       ('tick', 9.6, 0.7), ('tick', 10.1, 0.7), ('tick', 10.6, 0.7), ('tick', 11.1, 0.7),
       ('pop', 18.0, 0.7), ('tick', 21.3, 0.6), ('tick', 21.65, 0.6), ('tick', 22.0, 0.6), ('tick', 22.35, 0.6), ('tick', 22.7, 0.6),
       ('pop', 24.08, 0.8), ('marker', 27.42, 0.9), ('marker', 27.72, 0.7), ('whoosh', 29.85, 0.8), ('pop', 32.65, 0.7)]
sfx_len = {'thump': 0.35, 'tick': 0.05, 'pop': 0.14, 'marker': 0.42, 'whoosh': 0.5}
for i, (name, at, vol) in enumerate(sfx):
    ext = 'wav'
    audio.append(f'      <audio id="sfx-{i:02d}-{name}" src="assets/sfx/{name}.{ext}" data-start="{at}" data-duration="{sfx_len[name]}" data-track-index="{11 + i % 3}" data-volume="{vol}"></audio>')
audio.append(f'      <audio id="bed" src="assets/sfx/bed.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="14" data-volume="0.8"></audio>')

index = f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>ASHYQ — Антиреклама</title>
    <!-- GSAP 3.14.2 vendored: renders must not depend on a CDN -->
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #f8f7f3; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #f8f7f3; }}
      #root > div[data-composition-src] {{ position: absolute; inset: 0; }}
      #el-bg {{ z-index: 0; }}
      #root > div[data-composition-src][data-track-index="1"] {{ z-index: 1; }}
      #el-anchor {{ z-index: 2; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{TOTAL}">
{chr(10).join(slots)}
{chr(10).join(audio)}
    </div>
    <script>
      // scenes, anchor and background animate on their own timelines; the root stays empty
      window.__timelines['main'] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
open(f'{P}/index.html', 'w').write(index)
print('index written', TOTAL)
