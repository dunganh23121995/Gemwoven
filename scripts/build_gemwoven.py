"""Build a portable, offline HTML and the reusable UI kit ZIP. No network needed."""
from pathlib import Path
import base64,json,zipfile
ROOT=Path(__file__).resolve().parents[1]

merged=json.loads((ROOT/'assets/gemwoven/manifest.json').read_text(encoding='utf-8'))
merged.update(json.loads((ROOT/'assets/gemwoven/novice-items.json').read_text(encoding='utf-8')))
for catalog in ['journey-items','chapter-map-items','boss-items','existing-boss-items','theme-creature-items','equipment-art-items','chapter-ecosystem-items']:
    if (ROOT/f'assets/gemwoven/{catalog}.json').exists():
        journey=json.loads((ROOT/f'assets/gemwoven/{catalog}.json').read_text(encoding='utf-8'))
        for key,value in journey['items'].items():merged[key]={**value,'file':'assets/gemwoven/'+value.get('webp',value['file'])}
for name in ['boss-expansion-a','boss-expansion-b']:
    path=ROOT/f'assets/gemwoven/{name}.json'
    if path.exists():
        for key,boss in json.loads(path.read_text(encoding='utf-8'))['bosses'].items():merged['boss-'+key]={'file':boss['portrait'] if boss['portrait'].startswith('assets/') else 'assets/gemwoven/'+boss['portrait'],'width':512,'height':512,'transparent':True}
(ROOT/'assets/gemwoven/manifest.json').write_text(json.dumps(merged,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/gemwoven/assets.js').write_text('window.GEMWOVEN_ASSETS = '+json.dumps(merged,ensure_ascii=False)+';\n',encoding='utf-8')
def data_uri(rel):
    p=ROOT/rel
    mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg'}[p.suffix]
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()

# JSON is the canonical editable copy; regenerate its browser script.
copy=json.loads((ROOT/'src/gemwoven/copy.json').read_text(encoding='utf-8'))
(ROOT/'src/gemwoven/copy.js').write_text('/* Generated from copy.json by scripts/build_gemwoven.py */\nwindow.GEMWOVEN_COPY = '+json.dumps(copy,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
html=(ROOT/'Gemwoven.html').read_text(encoding='utf-8')
css=(ROOT/'src/gemwoven/ui.css').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/ui.css">','<style>'+css+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/progression.css">','<style>'+(ROOT/'src/gemwoven/progression.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/journey.css">','<style>'+(ROOT/'src/gemwoven/journey.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/equipment.css">','<style>'+(ROOT/'src/gemwoven/equipment.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('href="assets/gemwoven/items/mana.png"','href="'+data_uri('assets/gemwoven/items/mana.png')+'"')
manifest=json.loads((ROOT/'assets/gemwoven/manifest.json').read_text(encoding='utf-8'))
for a in manifest.values():a['file']=data_uri(a['file'])
backdrops={}
for key in ['home','inventory','skills','arena','summon','shop','forge','upgrade','tavern']:
    backdrops[key]={'background':data_uri(f'assets/gemwoven/backgrounds/{key}.webp')}
for name in ['assets','screens','expansion','copy','boss-chapters','boss-tactics','world','progression','progression-ui','art-screens','journey-ui','equipment-ui','chapter-guide','ui']:
    code='window.GEMWOVEN_ASSETS = '+json.dumps(manifest)+';' if name=='assets' else (ROOT/f'src/gemwoven/{name}.js').read_text(encoding='utf-8')
    if name=='expansion':code+='\nwindow.GEMWOVEN_BACKDROPS = '+json.dumps(backdrops)+';\nfor (const [key,images] of Object.entries(window.GEMWOVEN_BACKDROPS)) Object.assign(window.GEMWOVEN_LAYOUT.screens[key],images);'
    if name=='journey-ui':code='window.GEMWOVEN_HOME_MUSIC='+json.dumps(data_uri('assets/audio/music/earth.ogg'))+';\n'+code
    html=html.replace(f'<script src="src/gemwoven/{name}.js"></script>','<script>'+code.replace('</script','<\\/script')+'</script>')
(ROOT/'Gemwoven_6_Man.html').write_text(html,encoding='utf-8')
# Kit has editable source, separated PNGs and the standalone preview.
# Raw generated sheets remain in the workspace but need not ship with runtime.
paths=[ROOT/n for n in ['Gemwoven.html','Gemwoven_6_Man.html','Gemwoven_Assets.html','GEMWOVEN_README.txt']]
paths += [ROOT/'Game.html',ROOT/'GEMWOVEN_SYSTEMS.txt',ROOT/'assets/gemwoven/novice-prompts.json',ROOT/'assets/gemwoven/novice-items.json']
paths += [ROOT/'docs/BOSS_CHAPTERS.html',ROOT/'docs/boss-chapters.json',ROOT/'scripts/build_boss_guide.py']
paths+=list((ROOT/'src/gemwoven').glob('*'))
paths+=list((ROOT/'assets/gemwoven/items').glob('*.png'))
paths+=list((ROOT/'assets/gemwoven/items').glob('*.webp'))
paths+=list((ROOT/'assets/gemwoven/backgrounds').rglob('*.webp'))
paths+=list((ROOT/'assets/gemwoven/encounters').rglob('*.webp'))
paths+=[ROOT/f'assets/gemwoven/{name}.json' for name in ['boss-expansion-a','boss-expansion-b'] if (ROOT/f'assets/gemwoven/{name}.json').exists()]
paths+=[ROOT/'assets/audio/music/earth.ogg']
paths+=[ROOT/'assets/gemwoven/manifest.json',ROOT/'assets/gemwoven/prompts.json',Path(__file__)]
paths+=[ROOT/'assets/gemwoven/prompts-v2.json',ROOT/'scripts/prepare_gemwoven_expansion.py']
paths+=[ROOT/'assets/gemwoven/journey-items.json',ROOT/'assets/gemwoven/raw/journey-art-prompts.json',ROOT/'scripts/package_journey_art.py']
paths+=[ROOT/f'assets/gemwoven/{name}.json' for name in ['chapter-map-items','boss-items','existing-boss-items','theme-creature-items','equipment-art-items','chapter-ecosystem-items'] if (ROOT/f'assets/gemwoven/{name}.json').exists()]
with zipfile.ZipFile(ROOT/'Gemwoven_UI_Kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in paths:z.write(p,p.relative_to(ROOT))
print(f'Standalone: {(ROOT/"Gemwoven_6_Man.html").stat().st_size:,} bytes')
print(f'UI kit: {(ROOT/"Gemwoven_UI_Kit.zip").stat().st_size:,} bytes, {len(paths)} files')
