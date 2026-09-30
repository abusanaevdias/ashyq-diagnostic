# Generates compositions/*.html and index.html for «Кальки» from one place.
# Every scene time comes from the voice-over (assets/voice/durations.json and
# *.words.json word timings from `hyperframes transcribe`).
#   python3 scripts/build.py
# index.html is regenerated without the bed carve; re-run it afterwards:
#   node <hyperframes-audio>/scripts/carve.mjs --comp index.html --bed bed
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import sub

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = f'{P}/compositions'
os.makedirs(C, exist_ok=True)
DUR = json.load(open(f'{P}/assets/voice/durations.json'))
SPARK_JS = open(f'{P}/assets/spark.js').read()
GAP, LEAD, TAIL = 0.2, 0.15, 0.6


def words(vid):
    return json.load(open(f'{P}/assets/voice/{vid}.words.json'))


def word_at(vid, prefix):
    """Start time of the first word in a voice file that starts with `prefix` (case-insensitive)."""
    for w in words(vid):
        if w['text'].lower().strip('«».,?!–—').startswith(prefix.lower()):
            return w['start']
    raise KeyError(f'{prefix} not in {vid}')


def seq(pieces, lead=LEAD, tail=TAIL):
    """Lay voice pieces end to end inside a scene; returns ({vid: start}, scene duration)."""
    t, at = lead, {}
    for vid in pieces:
        at[vid] = round(t, 3)
        t += DUR[vid] + GAP
    return at, round(t - GAP + tail, 2)


def write(name, html):
    open(f'{C}/{name}.html', 'w').write(html)


# -------- shared scene CSS / JS --------
LINE_CSS = """
.ru{position:absolute;left:72px;right:72px;top:350px;font:600 62px/1.15 'Inter';color:#161311}
.en{position:absolute;left:72px;right:60px;top:620px;font:800 128px/1.04 'Manrope';letter-spacing:-.03em;color:#161311}
.en.sm{font-size:118px}
.t{display:inline-block;white-space:pre;vertical-align:top;position:relative;overflow:hidden;padding-bottom:.1em;margin-bottom:-.1em}
.t > .w{display:inline-block;position:relative}
.t.ls > .w{margin-left:.26em}
.t.ts > .w{margin-right:.26em}
.w > .st{position:absolute;left:-.02em;right:-.02em;top:50%;height:14px;margin-top:-4px;border-radius:7px;background:#de0b1b;transform-origin:0 50%}
.t.good > .w{color:#2e5e3a;background:#e8efe2;border-radius:18px;padding:0 .08em}
.rule{position:absolute;left:72px;right:300px;top:960px;font:700 84px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%}
"""
LINE_JS = """
// width of a token measured off a canvas (pretext), so it works while the scene is still hidden
function tokWidth(el) {
  const w = el.querySelector('.w');
  const cs = getComputedStyle(w);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const px = parseFloat(cs.fontSize);
  const text = w.textContent;
  const pt = window.__hyperframes && window.__hyperframes.pretext;
  const tw = pt ? pt.measureNaturalWidth(pt.prepareWithSegments(text, font)) : text.length * 0.62 * px;
  const gaps = (el.classList.contains('ls') ? 0.26 : 0) + (el.classList.contains('ts') ? 0.26 : 0);
  return Math.ceil(tw + (gaps + 0.2) * px);
}
// in-place calque fix: bad tokens get struck, then collapse; good tokens grow into the gap
function fixLine(tl, scope, strikeAt, swapAt) {
  scope.querySelectorAll('.t.bad').forEach((el) => {
    const w = tokWidth(el);
    tl.fromTo(el.querySelector('.st'), {scaleX: 0}, {scaleX: 1, duration: 0.3, ease: 'power2.in'}, strikeAt);
    tl.fromTo(el.querySelector('.w'), {color: '#161311'}, {color: '#de0b1b', duration: 0.15}, strikeAt + 0.1);
    tl.fromTo(el, {maxWidth: w, opacity: 1}, {maxWidth: 0, opacity: 0, duration: 0.35, ease: 'power3.inOut', immediateRender: false}, swapAt);
  });
  scope.querySelectorAll('.t.good').forEach((el) => {
    const w = tokWidth(el);
    tl.fromTo(el, {maxWidth: 0, opacity: 0}, {maxWidth: w, opacity: 1, duration: 0.35, ease: 'power3.out'}, swapAt + 0.05);
    tl.fromTo(el.querySelector('.w'), {yPercent: 100}, {yPercent: 0, duration: 0.4, ease: 'back.out(1.8)'}, swapAt + 0.05);
  });
}
"""


def tok(text, kind='', id_=''):
    # word spacing is a margin on the word (no space characters), so wrapped lines never start
    # indented and a collapsing token takes its own gap with it
    core = text.strip(' ')
    cls = ' '.join(c for c in [kind, 'ls' if text.startswith(' ') else '', 'ts' if text.endswith(' ') else ''] if c)
    st = '<i class="st"></i>' if kind == 'bad' else ''
    return f'<span class="t {cls}"{f" id={chr(34)}{id_}{chr(34)}" if id_ else ""}><span class="w">{core}{st}</span></span>'


def scene_script(cid, body_js):
    # build after fonts load so token widths are measured with the real typeface;
    # the timeline is registered only when the build is complete
    return f"""document.fonts.ready.then(() => {{
const S = document.querySelector('[data-composition-id="{cid}"]');
const tl = gsap.timeline({{ paused: true }});
{body_js}
window.__timelines['{cid}'] = tl;
}});
"""


def rise_en(pfx, en_vid, en_at, tokens_in_order):
    """Rise the visible EN tokens on the spoken words of the first EN take."""
    ws = words(en_vid)
    times = [round(en_at + ws[min(i, len(ws) - 1)]['start'], 3) for i in range(len(tokens_in_order))]
    return f"rise(tl, S, '#{pfx}-en .t:not(.good) > .w', {json.dumps(times)}, 0.34);\n"


scenes = []  # (cid, duration, [(vid, local_start)], events)
events = []  # global SFX/pose events: (kind, local_time, cid)

# ---------- c1: frames 01+02 — hook line «I have 17 years.» fixed in place to «I'm 17.» ----------
at, d = seq(['s01-en', 's01-ru', 's02-ru', 's02-en'])
stamp_at = at['s01-ru'] + word_at('s01-ru', 'калька')
strike1 = at['s02-ru'] + word_at('s02-ru', 'быть')
swap1 = at['s02-en']
write('c1', sub('c1', LINE_CSS + """
#c1-stamp{position:absolute;left:470px;top:800px;padding:14px 30px;border:8px solid #de0b1b;border-radius:16px;color:#de0b1b;font:800 64px/1 'Manrope';letter-spacing:.08em;background:rgba(253,253,253,.9)}
#c1-r2{top:960px}
""", f"""
        <div class="ru" id="c1-ru">«Мне 17 лет»</div>
        <div class="en" id="c1-en">{tok('I')}{tok('’m', 'good')}{tok(' have', 'bad')}{tok(' 17')}{tok(' years', 'bad')}{tok('.')}</div>
        <div id="c1-stamp">КАЛЬКА</div>
        <div class="rule" id="c1-r1">звучит знакомо?</div>
        <div class="rule" id="c1-r2">возраст — через to be</div>
""", scene_script('c1', LINE_JS + f"""
tl.fromTo('#c1-ru', {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.4, ease: 'power3.out'}}, 0.1);
{rise_en('c1', 's01-en', at['s01-en'], ['I', 'have', '17', 'years', '.'])}
wipe(tl, '#c1-r1', {at['s01-ru']}, {at['s01-ru'] + 1.0});
tl.fromTo('#c1-stamp', {{scale: 2.2, rotation: -20, opacity: 0}}, {{scale: 1, rotation: -9, opacity: 1, duration: 0.22, ease: 'power4.in'}}, {stamp_at - 0.12});
tl.to(['#c1-stamp', '#c1-r1'], {{opacity: 0, duration: 0.3}}, {at['s02-ru'] - 0.1});
wipe(tl, '#c1-r2', {at['s02-ru'] + 0.1}, {at['s02-ru'] + 1.6});
fixLine(tl, S, {strike1}, {swap1});
"""), '01+02 age'))
scenes.append(('c1', d, at))
events += [('thump', stamp_at, 'c1'), ('marker', strike1, 'c1'), ('ding', swap1 + 0.05, 'c1'),
           ('pose-think', 0, 'c1'), ('pose-wow', stamp_at, 'c1'), ('pose-think', at['s02-ru'], 'c1'),
           ('pose-wow', strike1, 'c1'), ('pose-cheer', swap1, 'c1'), ('count-1', at['s02-ru'], 'c1')]


def fix_scene(cid, n, ru_text, tokens, rule, en1, ru, en2, strike_word, small=False):
    at, d = seq([en1, ru, en2])
    strike = at[ru] + word_at(ru, strike_word)
    swap = at[en2]
    visible = [t for t in tokens if t[1] != 'good']
    write(cid, sub(cid, LINE_CSS, f"""
        <div class="ru" id="{cid}-ru">{ru_text}</div>
        <div class="en{' sm' if small else ''}" id="{cid}-en">{''.join(tok(t, k) for t, k in tokens)}</div>
        <div class="rule" id="{cid}-rule">{rule}</div>
""", scene_script(cid, LINE_JS + f"""
tl.fromTo('#{cid}-ru', {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.4, ease: 'power3.out'}}, 0.05);
{rise_en(cid, en1, at[en1], visible)}
wipe(tl, '#{cid}-rule', {at[ru] + 0.05}, {at[ru] + min(1.8, DUR[ru])});
fixLine(tl, S, {strike}, {swap});
"""), cid))
    scenes.append((cid, d, at))
    events.extend([('marker', strike, cid), ('ding', swap + 0.05, cid), ('pose-think', 0, cid),
                   ('pose-wow', strike, cid), ('pose-cheer', swap, cid), (f'count-{n}', 0, cid)])


fix_scene('c2', 2, '«Я согласен»', [('I ', ''), ('am ', 'bad'), ('agree', ''), ('.', '')],
          'agree — уже глагол', 's03-en1', 's03-ru', 's03-en2', 'лишнее')
fix_scene('c3', 3, '«Это зависит от тебя»', [('It ', ''), ('depends ', ''), ('from ', 'bad'), ('on ', 'good'), ('you', ''), ('.', '')],
          'depends — всегда on', 's04-en1', 's04-ru', 's04-en2', 'он', small=True)
fix_scene('c4', 4, '«Давай обсудим это»', [('Let’s ', ''), ('discuss ', ''), ('about ', 'bad'), ('it', ''), ('.', '')],
          'discuss — без about', 's05-en1', 's05-ru', 's05-en2', 'предлога', small=True)

# ---------- c5: cheat sheet (held frame) ----------
at, d = seq(['s06-ru'], lead=0.7, tail=0.9)
rows = [('I’m 17.', 'I have 17 years'), ('I agree.', 'I am agree'), ('It depends on you.', 'depends from'), ('Let’s discuss it.', 'discuss about')]
rows_html = ''.join(f'<div class="c5-row" style="top:{360 + i * 150}px"><span class="c5-ck">✓</span><b>{g}</b><s>{b}</s></div>' for i, (g, b) in enumerate(rows))
write('c5', sub('c5', """
#c5-lbl{position:absolute;left:72px;top:292px;font:600 30px/1 'Inter';letter-spacing:.14em;color:#6e6d6b}
.c5-row{position:absolute;left:72px;right:72px;display:flex;align-items:center;gap:22px;font:800 58px/1.1 'Manrope';letter-spacing:-.02em;white-space:nowrap}
.c5-ck{width:64px;height:64px;border-radius:50%;background:#2e5e3a;color:#fff;display:flex;align-items:center;justify-content:center;font:800 36px/1 'Manrope';flex:none}
.c5-row s{color:#6e6d6b;font:600 36px/1.2 'Inter';text-decoration-thickness:4px}
#c5-rule{position:absolute;left:72px;right:300px;top:1000px;font:700 84px/1.05 'Caveat';color:#b60916;transform:rotate(-2deg);transform-origin:0 50%}
""", f"""
        <div id="c5-lbl">ШПАРГАЛКА</div>
        {rows_html}
        <div id="c5-rule">экзаменатор это слышит</div>
""", scene_script('c5', f"""
tl.fromTo('#c5-lbl', {{opacity: 0}}, {{opacity: 1, duration: 0.3}}, 0.05);
S.querySelectorAll('.c5-row').forEach((el, i) => tl.fromTo(el, {{x: -80, opacity: 0}}, {{x: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}}, 0.1 + i * 0.14));
wipe(tl, '#c5-rule', {at['s06-ru'] + word_at('s06-ru', 'слышно')}, {at['s06-ru'] + DUR['s06-ru']});
"""), 'cheat sheet'))
scenes.append(('c5', d, at))
events += [('pose-cheer', 0, 'c5'), ('pop', 0.1, 'c5')]

# ---------- c6: CTA ----------
at, d = seq(['s07-ru'], lead=0.3, tail=1.2)
vo = at['s07-ru']
w07 = lambda p: round(vo + word_at('s07-ru', p), 3)
write('c6', sub('c6', """
#c6-spark{position:absolute;left:0;top:0;width:320px;height:320px}
#c6-wm{position:absolute;left:250px;top:600px;width:580px}
#c6-head{position:absolute;left:0;right:0;top:780px;text-align:center;font:800 76px/1.08 'Manrope';letter-spacing:-.02em}
#c6-head .ln{display:block}
#c6-sub{position:absolute;left:0;right:0;top:975px;text-align:center;font:600 44px/1.2 'Inter';color:#6e6d6b}
#c6-pillwrap{position:absolute;left:0;right:0;top:1055px;text-align:center}
#c6-pill{display:inline-block;padding:18px 34px;border-radius:999px;background:#de0b1b;color:#fff;font:600 40px/1 'Inter'}
#c6-ai{position:absolute;left:0;right:0;top:1190px;text-align:center;font:600 26px/1 'Inter';color:#8c8b8a}
""", """
        <div id="c6-spark"></div>
        <img id="c6-wm" src="assets/brand/wordmark-ink.png" alt="ashyq" />
        <div id="c6-head"><span class="ln"><span class="m"><span class="w">Такие</span></span> <span class="m"><span class="w">ошибки</span></span></span><span class="ln"><span class="m"><span class="w">разбираем</span></span> <span class="m"><span class="w">на</span></span> <span class="m"><span class="w">занятиях</span></span></span></div>
        <div id="c6-sub">Начни с бесплатной диагностики</div>
        <div id="c6-pillwrap"><span id="c6-pill">ссылка в профиле</span></div>
        <div id="c6-ai">Голоса в ролике созданы ИИ</div>
""", scene_script('c6', SPARK_JS + f"""
tl.fromTo('#c6-wm', {{y: 420, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.5, ease: 'power3.out'}}, 0);
rise(tl, S, '#c6-head .w', {json.dumps([w07('такие'), w07('ошибки'), w07('разбираем'), w07('на'), w07('занятиях')])}, 0.4);
tl.fromTo('#c6-sub', {{y: 24, opacity: 0}}, {{y: 0, opacity: 1, duration: 0.4, ease: 'power3.out'}}, {w07('начни')});
tl.fromTo('#c6-pill', {{scale: 0.6, opacity: 0}}, {{scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)'}}, {w07('ссылка')});
tl.fromTo('#c6-ai', {{opacity: 0}}, {{opacity: 1, duration: 0.4}}, {w07('ссылка') + 0.4});
// «Искра» flies in on an arc, lands on the wordmark and waves; pose derived from timeline time
const box = document.getElementById('c6-spark');
const land = 0.85;
let last = '';
tl.to({{}}, {{duration: {d}, ease: 'none', onUpdate() {{
  const t = this.time();
  const f = Math.min(1, Math.max(0, (t - 0.15) / (land - 0.15)));
  const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  const x = 740 + (380 - 740) * e;
  const y = 1200 + (300 - 1200) * e - Math.sin(Math.PI * e) * 200;
  const k = Math.min(1, Math.max(0, (t - land) / 0.35));
  const pose = t < land ? {{name: 'fly'}} : t < land + 0.8 ? {{name: 'cheer'}} : {{name: 'wave', phase: (t - land) * 1.6}};
  pose.squash = t >= land ? 1 - 0.2 * Math.sin(Math.PI * k) * (1 - k) : 1;
  pose.blink = Math.max(0, ...[2.4, 5.1].map((b) => 1 - Math.abs(t - b) / 0.09));
  box.style.transform = `translate(${{x}}px, ${{y}}px)`;
  const svg = window.SPARK.spark('logo', pose);
  if (svg !== last) {{ box.innerHTML = svg; last = svg; }}
}}}}, 0);
"""), 'cta'))
scenes.append(('c6', d, at))
events += [('whoosh', -0.15, 'c6'), ('pop', w07('ссылка') - vo + vo, 'c6')]

# ---------- global timing ----------
start, t = {}, 0.0
for cid, d, _ in scenes:
    start[cid] = round(t, 2)
    t += d
TOTAL = round(t, 2)
G = lambda cid, local: round(start[cid] + local, 3)
fix_end = start['c5']            # anchor (labels + counter) covers c1..c4
spark_end = start['c6']          # corner «Искра» covers c1..c5

# ---------- background: notebook grid ----------
write('bg', sub('bg', """
#bg-grid{position:absolute;inset:0;background-color:#f8f7f3;background-image:linear-gradient(#e9e6df 2px,transparent 2px),linear-gradient(90deg,#e9e6df 2px,transparent 2px);background-size:54px 54px}
#bg-margin{position:absolute;top:0;bottom:0;left:40px;width:3px;background:#f3c9c2}
""", """
        <div id="bg-grid"></div>
        <div id="bg-margin"></div>
""", """const tl = gsap.timeline({ paused: true });
// the grid breathes very slowly so the static frames never read as frozen
const cycles = Math.max(0, Math.floor(%s / 8) - 1);
tl.fromTo('#bg-grid', {backgroundPosition: '0px 0px'}, {backgroundPosition: '0px 54px', duration: 8, ease: 'none', repeat: cycles}, 0);
window.__timelines['bg'] = tl;
""" % TOTAL, 'bg'))

# ---------- anchor: ДУМАЕШЬ / ГОВОРИШЬ labels + counter (c1..c4) ----------
counts = sorted((G(cid, lt) - start['c1'], k.split('-')[1]) for k, lt, cid in events if k.startswith('count-'))
write('anchor', sub('anchor', """
.lbl{position:absolute;left:72px;font:600 30px/1 'Inter';letter-spacing:.14em;color:#6e6d6b;white-space:nowrap}
#an-think{top:292px}
#an-say{top:560px}
#an-chip{letter-spacing:0;margin-left:16px;padding:8px 16px;border-radius:999px;background:#efeeea;font:600 24px/1 'Inter'}
#an-stem{position:absolute;left:72px;top:460px;width:4px;height:70px;background:#161311}
#an-head{position:absolute;left:52px;top:524px;width:0;height:0;border-left:22px solid transparent;border-right:22px solid transparent;border-top:26px solid #161311}
#an-count{position:absolute;right:72px;top:292px;font:800 40px/1 'Manrope';color:#6e6d6b;white-space:nowrap}
#an-count span{color:#8c8b8a}
#an-n{display:inline-block}
""", """
        <div class="lbl" id="an-think">ДУМАЕШЬ</div>
        <div id="an-stem"></div><div id="an-head"></div>
        <div class="lbl" id="an-say">ГОВОРИШЬ<span id="an-chip">голос ученика · EN</span></div>
        <div id="an-count"><b id="an-n">1</b><span>/4</span></div>
""", """const tl = gsap.timeline({ paused: true });
tl.fromTo(['#an-think', '#an-say'], {opacity: 0}, {opacity: 1, duration: 0.3}, 0);
tl.fromTo('#an-stem', {scaleY: 0}, {scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '50%% 0%%'}, 0.15);
tl.fromTo('#an-head', {opacity: 0}, {opacity: 1, duration: 0.2}, 0.4);
// counter appears with the first fix and hard-cuts 1→4 at each correction scene
const counts = %s;
const n = document.getElementById('an-n');
tl.fromTo('#an-count', {opacity: 0}, {opacity: 1, duration: 0.3}, counts[0][0]);
tl.to({}, {duration: %s, ease: 'none', onUpdate() {
  const t = this.time();
  let v = counts[0][1];
  for (const [at, label] of counts) if (t >= at) v = label;
  if (n.textContent !== v) n.textContent = v;
}}, 0);
counts.slice(1).forEach(([at]) => tl.fromTo('#an-n', {scale: 1.5}, {scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false}, at));
window.__timelines['anchor'] = tl;
""" % (json.dumps(counts), fix_end), 'anchor'))

# ---------- corner «Искра» reacting to every calque (c1..c5) ----------
poses = sorted((round(G(cid, lt), 3), k.split('-')[1]) for k, lt, cid in events if k.startswith('pose-'))
write('spark', sub('spark', """
#sp-box{position:absolute;left:800px;top:1000px;width:240px;height:240px}
""", """
        <div id="sp-box"></div>
""", """const tl = gsap.timeline({ paused: true });
""" + SPARK_JS + """
const poses = %s;
const box = document.getElementById('sp-box');
let last = '';
tl.fromTo('#sp-box', {y: 300, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)'}, 0.3);
tl.to({}, {duration: %s, ease: 'none', onUpdate() {
  const t = this.time();
  let name = 'think', since = 0;
  for (const [at, p] of poses) if (t >= at) { name = p; since = t - at; }
  const pose = name === 'wow' ? {name: 'cheer', mood: 'wow'} : name === 'cheer' ? {name: 'cheer', squash: 1 - 0.12 * Math.max(0, 1 - since / 0.3)} : {name: 'think', lookX: -6 + Math.sin(t * 1.3) * 3};
  pose.blink = Math.max(0, ...[1.6, 6.2, 12.4, 19.5, 26.8].map((b) => 1 - Math.abs(t - b) / 0.09));
  const svg = window.SPARK.spark('logo', pose);
  if (svg !== last) { box.innerHTML = svg; last = svg; }
}}, 0);
window.__timelines['spark'] = tl;
""" % (json.dumps(poses), spark_end), 'spark'))

# ---------- index.html ----------
slots = [f'      <div id="el-bg" data-composition-id="bg" data-composition-src="compositions/bg.html" data-start="0" data-duration="{TOTAL}" data-track-index="0" data-width="1080" data-height="1920"></div>']
for cid, d, _ in scenes:
    slots.append(f'      <div id="el-{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{start[cid]}" data-duration="{d}" data-track-index="1" data-width="1080" data-height="1920"></div>')
slots.append(f'      <div id="el-anchor" data-composition-id="anchor" data-composition-src="compositions/anchor.html" data-start="0" data-duration="{fix_end}" data-track-index="2" data-width="1080" data-height="1920"></div>')
slots.append(f'      <div id="el-spark" data-composition-id="spark" data-composition-src="compositions/spark.html" data-start="0" data-duration="{spark_end}" data-track-index="3" data-width="1080" data-height="1920"></div>')
audio = []
for cid, d, at in scenes:
    for vid, lt in at.items():
        audio.append(f'      <audio id="vo-{vid}" src="assets/voice/{vid}.mp3" data-start="{G(cid, lt)}" data-duration="{DUR[vid]}" data-track-index="10" data-volume="1" data-audio-group="voiceover"></audio>')
sfx_len = {'thump': 0.35, 'marker': 0.42, 'ding': 0.5, 'pop': 0.14, 'whoosh': 0.5}
sfx_vol = {'thump': 0.8, 'marker': 0.8, 'ding': 0.55, 'pop': 0.6, 'whoosh': 0.7}
i = 0
for k, lt, cid in sorted(events, key=lambda e: G(e[2], e[1])):
    if k in sfx_len:
        audio.append(f'      <audio id="sfx-{i:02d}-{k}" src="assets/sfx/{k}.wav" data-start="{max(0, G(cid, lt))}" data-duration="{sfx_len[k]}" data-track-index="{11 + i % 3}" data-volume="{sfx_vol[k]}"></audio>')
        i += 1
audio.append(f'      <audio id="bed" src="assets/sfx/bed.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="14" data-volume="0.8"></audio>')

open(f'{P}/index.html', 'w').write(f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>ASHYQ — Кальки</title>
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
      #el-spark {{ z-index: 3; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{TOTAL}">
{chr(10).join(slots)}
{chr(10).join(audio)}
    </div>
    <script>
      // scenes, labels, mascot and background animate on their own timelines; the root stays empty
      window.__timelines['main'] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")
print('scenes', {c: (start[c], d) for c, d, _ in scenes}, 'total', TOTAL)
