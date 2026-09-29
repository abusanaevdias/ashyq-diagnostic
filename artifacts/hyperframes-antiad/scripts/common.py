FONTS = "\n".join(
    f"@font-face{{font-family:'{fam}';src:url('assets/fonts/{f}.woff2') format('woff2');font-weight:{w};font-display:block}}"
    for fam, f, w in [('Manrope','manrope-800-cyrillic',800),('Manrope','manrope-800-latin',800),
                      ('Inter','inter-500-cyrillic',500),('Inter','inter-500-latin',500),
                      ('Inter','inter-600-cyrillic',600),('Inter','inter-600-latin',600),
                      ('Caveat','caveat-700-cyrillic',700),('Caveat','caveat-700-latin',700)])
TOKENS = ":root{}"
BASE_CSS = """
#root{position:absolute;inset:0;font-family:'Inter',sans-serif;color:#161311}
.m{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em;margin-bottom:-.12em}
.w{display:inline-block}
"""
# JS helpers shared by scenes: word rise synced to voice, caveat wipe
HELPERS = """
function rise(tl, scope, sel, times, dur, ease){
  const els = scope.querySelectorAll(sel);
  els.forEach((el, i) => tl.fromTo(el, {yPercent: 115, opacity: 0}, {yPercent: 0, opacity: 1, duration: dur || 0.38, ease: ease || 'expo.out'}, times[Math.min(i, times.length - 1)]));
}
function wipe(tl, el, from, to){
  tl.fromTo(el, {clipPath: 'inset(-30% 100% -30% -4%)'}, {clipPath: 'inset(-30% -4% -30% -4%)', duration: Math.max(0.3, to - from), ease: 'power1.inOut'}, from);
}
"""
def sub(comp_id, css, body, script, title):
    return f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
  </head>
  <body>
    <template>
      <style>
{FONTS}
{BASE_CSS}
{css}
      </style>
      <div id="root" data-composition-id="{comp_id}" data-width="1080" data-height="1920">
{body}
      </div>
      <script>
{HELPERS}
{script}
      </script>
    </template>
  </body>
</html>
"""
