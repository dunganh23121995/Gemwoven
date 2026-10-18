"""Build a portable, offline HTML and the reusable UI kit ZIP. No network needed."""
from pathlib import Path
import base64,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
def data_uri(rel):
    p=ROOT/rel
    mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'}[p.suffix]
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()

# JSON is the canonical editable copy; regenerate its browser script.
copy=json.loads((ROOT/'src/gemwoven/copy.json').read_text(encoding='utf-8'))
(ROOT/'src/gemwoven/copy.js').write_text('/* Generated from copy.json by scripts/build_gemwoven.py */\nwindow.GEMWOVEN_COPY = '+json.dumps(copy,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
html=(ROOT/'Gemwoven.html').read_text(encoding='utf-8')
css=(ROOT/'src/gemwoven/ui.css').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/ui.css">','<style>'+css+'</style>')
html=html.replace('href="assets/gemwoven/items/mana.png"','href="'+data_uri('assets/gemwoven/items/mana.png')+'"')
manifest=json.loads((ROOT/'assets/gemwoven/manifest.json').read_text(encoding='utf-8'))
for a in manifest.values():a['file']=data_uri(a['file'])
backdrops={}
for key in ['arena','summon','shop','forge','upgrade','tavern']:
    backdrops[key]={'background':data_uri(f'assets/gemwoven/backgrounds/{key}.webp')}
for name in ['assets','screens','copy','ui']:
    code='window.GEMWOVEN_ASSETS = '+json.dumps(manifest)+';' if name=='assets' else (ROOT/f'src/gemwoven/{name}.js').read_text(encoding='utf-8')
    if name=='screens':code+='\nfor (const [key,images] of Object.entries('+json.dumps(backdrops)+')) Object.assign(window.GEMWOVEN_LAYOUT.screens[key],images);'
    html=html.replace(f'<script src="src/gemwoven/{name}.js"></script>','<script>'+code.replace('</script','<\\/script')+'</script>')
(ROOT/'Gemwoven_6_Man.html').write_text(html,encoding='utf-8')
# Kit has editable source, separated PNGs and the standalone preview.
# Raw generated sheets remain in the workspace but need not ship with runtime.
paths=[ROOT/n for n in ['Gemwoven.html','Gemwoven_6_Man.html','Gemwoven_Assets.html','GEMWOVEN_README.txt']]
paths+=list((ROOT/'src/gemwoven').glob('*'))
paths+=list((ROOT/'assets/gemwoven/items').glob('*.png'))
paths+=list((ROOT/'assets/gemwoven/backgrounds').glob('*'))
paths+=[ROOT/'assets/gemwoven/manifest.json',ROOT/'assets/gemwoven/prompts.json',Path(__file__)]
with zipfile.ZipFile(ROOT/'Gemwoven_UI_Kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in paths:z.write(p,p.relative_to(ROOT))
print(f'Standalone: {(ROOT/"Gemwoven_6_Man.html").stat().st_size:,} bytes')
print(f'UI kit: {(ROOT/"Gemwoven_UI_Kit.zip").stat().st_size:,} bytes, {len(paths)} files')
