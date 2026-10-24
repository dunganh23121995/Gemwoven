"""Build a portable, offline HTML and the reusable UI kit ZIP. No network needed."""
from pathlib import Path
import base64,json,zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

merged=json.loads((ROOT/'assets/gemwoven/manifest.json').read_text(encoding='utf-8'))
merged.update(json.loads((ROOT/'assets/gemwoven/novice-items.json').read_text(encoding='utf-8')))
# Keep approved scene replacements independent of the regenerated base manifest.
merged.update(json.loads((ROOT/'assets/gemwoven/painted-backgrounds.json').read_text(encoding='utf-8')))
for catalog in ['journey-items','chapter-map-items','boss-items','existing-boss-items','theme-creature-items','equipment-art-items','chapter-ecosystem-items','modular-map-items','hud-items']:
    if (ROOT/f'assets/gemwoven/{catalog}.json').exists():
        journey=json.loads((ROOT/f'assets/gemwoven/{catalog}.json').read_text(encoding='utf-8'))
        for key,value in journey['items'].items():
            file=value.get('webp',value['file'])
            merged[key]={**value,'file':file if file.startswith('assets/') else 'assets/gemwoven/'+file}
for catalog in sorted((ROOT/'assets/gemwoven/beanstalk/themes').glob('art-catalog-*.json')):
    for key,value in json.loads(catalog.read_text(encoding='utf-8'))['items'].items():
        file=value['file']
        merged[key]={**value,'file':file if file.startswith('assets/') else 'assets/gemwoven/'+file}
merged['summon-lake']={'file':'assets/gemwoven/summon-lake/scene.webp','width':941,'height':1672}
for catalog in sorted((ROOT/'assets/heroes/forms').glob('*/forms.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'))
    for form,entry in data['forms'].items():
        hero=data['hero']
        idle=entry['actions']['idle']
        head=idle.get('heads',[[128,48]])[0]
        # Stand the hero on the home plinth by the centre of its feet, not its head: a hero who
        # holds a scythe or a staff out to one side has its head well off the line of its feet.
        with Image.open(ROOT/idle['file']) as sheet:
            first=sheet.crop((0,0,sheet.width//idle['cols'],sheet.height//idle['rows'])).convert('RGBA').getchannel('A').point(lambda a:255 if a>=128 else 0)
            box=first.getbbox();band=first.crop((0,box[3]-max(4,(box[3]-box[1])//8),first.width,box[3])).getbbox()
            feet_x=((band[0]+band[2])/2)/first.width if band else head[0]/256
        anchor={'x':feet_x,'crown':head[1]/256,'foot':box[3]/first.height}  # the drawing's real lowest point (Noct's mist, a hem)
        for prefix,field in [('form','poster'),('form-portrait','portrait')]:
            with Image.open(ROOT/entry[field]) as im:
                bounds=im.convert('RGBA').getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
                merged[f'{prefix}-{hero}-{form}']={'file':entry[field],'width':im.width,'height':im.height,'footBounds':list(bounds) if bounds else [0,0,im.width,im.height]}
                if field=='poster':merged[f'{prefix}-{hero}-{form}']['bodyAnchor']=anchor
        with Image.open(ROOT/idle['file']) as sheet:
            cw,ch=sheet.width//idle['cols'],sheet.height//idle['rows']
            frames=[sheet.crop(((i%idle['cols'])*cw,(i//idle['cols'])*ch,(i%idle['cols']+1)*cw,(i//idle['cols']+1)*ch)).convert('RGBA') for i in range(idle['count'])]
            target=(ROOT/entry['poster']).with_name('hub-idle.webp')
            # Two cross-faded in-betweens per pose pair so the resting loop glides instead of stepping.
            tweened=[f if not k else Image.blend(f,frames[(i+1)%len(frames)],k/3) for i,f in enumerate(frames) for k in range(3)]
            tweened[0].save(target,save_all=True,append_images=tweened[1:],duration=round(idle.get('frameDuration',120)/3),loop=0,lossless=True)
            bounds=frames[0].getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
            merged[f'form-idle-{hero}-{form}']={'file':target.relative_to(ROOT).as_posix(),'width':cw,'height':ch,'bodyAnchor':anchor,'footBounds':list(bounds)}
for name,sheet in json.loads((ROOT/'assets/gemwoven/ambient/ambient.json').read_text(encoding='utf-8')).items():
    merged['ambient-'+name]={**sheet,'width':192*sheet['count'],'height':192}
merged['scythe-mask']={'file':'assets/heroes/forms/shadow/form-3/scythe-mask.png','width':256,'height':256}
for scene in ['home','summon','arena']:merged['ambient-water-'+scene]={'file':f'assets/gemwoven/ambient/water-{scene}.webp','width':941,'height':1672}
for catalog in sorted((ROOT/'assets/heroes/forms').glob('*/aura.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'))
    merged['form-aura-'+catalog.parent.name]={**data,'width':256,'height':256}
for name in ['boss-expansion-a','boss-expansion-b']:
    path=ROOT/f'assets/gemwoven/{name}.json'
    if path.exists():
        for key,boss in json.loads(path.read_text(encoding='utf-8'))['bosses'].items():merged['boss-'+key]={'file':boss['portrait'] if boss['portrait'].startswith('assets/') else 'assets/gemwoven/'+boss['portrait'],'width':512,'height':512,'transparent':True}
# Humanoid elites designed for their chapter boss (assets/gemwoven/elites/<id>/master.png).
for key in [k for k,v in merged.items() if v['file'].startswith('assets/gemwoven/elites/')]:del merged[key]  # manifest.json is also this script's input
for master in sorted((ROOT/'assets/gemwoven/elites').glob('*/master.png')):
    with Image.open(master) as im:merged['creature-'+master.parent.name]={'file':master.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,'transparent':True}
# Foot registration uses the visible sprite, excluding transparent canvas padding.
for key,asset in merged.items():
    if key.startswith(('hero-','home-idle-','creature-','monster-','boss-')) and (ROOT/asset['file']).is_file():
        with Image.open(ROOT/asset['file']) as sprite:
            rgba=sprite.convert('RGBA')
            bounds=rgba.getchannel('A').point(lambda alpha:255 if alpha>=128 else 0).getbbox()
            if bounds:
                asset.update(width=rgba.width,height=rgba.height,footBounds=list(bounds))
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
for name in ['living-scenes','hero-forms']:
    html=html.replace(f'<link rel="stylesheet" href="src/gemwoven/{name}.css">','<style>'+(ROOT/f'src/gemwoven/{name}.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/progression.css">','<style>'+(ROOT/'src/gemwoven/progression.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/journey.css">','<style>'+(ROOT/'src/gemwoven/journey.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<link rel="stylesheet" href="src/gemwoven/equipment.css">','<style>'+(ROOT/'src/gemwoven/equipment.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('href="assets/gemwoven/items/mana.png"','href="'+data_uri('assets/gemwoven/items/mana.png')+'"')
manifest=json.loads((ROOT/'assets/gemwoven/manifest.json').read_text(encoding='utf-8'))
for a in manifest.values():a['file']=data_uri(a['file'])
backdrops={}
for key in ['home','inventory','skills','arena','summon','shop','forge','upgrade','tavern']:
    backdrops[key]={'background':data_uri(merged.get('background-'+key,{}).get('file',f'assets/gemwoven/backgrounds/{key}.webp'))}
for name in ['assets','screens','expansion','copy','boss-chapters','boss-tactics','world','progression','progression-ui','art-screens','journey-ui','equipment-ui','chapter-guide','form-effects','hero-forms','summon-cinematic','living-hub','living-motion','ui']:
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
paths+=[ROOT/'assets/gemwoven/painted-backgrounds.json']
paths+=sorted({ROOT/p for entry in merged.values() for p in entry.get('promptFiles',[])})
paths+=[ROOT/'scripts/prepare_home_idle.py']
paths+=[ROOT/'assets/gemwoven/prompts-v2.json',ROOT/'scripts/prepare_gemwoven_expansion.py']
paths+=[ROOT/'assets/gemwoven/journey-items.json',ROOT/'assets/gemwoven/raw/journey-art-prompts.json',ROOT/'scripts/package_journey_art.py']
paths+=[ROOT/f'assets/gemwoven/{name}.json' for name in ['chapter-map-items','boss-items','existing-boss-items','theme-creature-items','equipment-art-items','chapter-ecosystem-items','modular-map-items','hud-items'] if (ROOT/f'assets/gemwoven/{name}.json').exists()]
# Runtime catalogs can reference modular art outside the original items/ folder.
paths += [ROOT/entry['file'] for entry in merged.values()]
paths += list((ROOT/'assets/gemwoven/beanstalk').glob('*.prompt.txt'))
paths += list((ROOT/'assets/gemwoven/beanstalk').glob('*.metadata.json'))
paths += list((ROOT/'assets/gemwoven/beanstalk/themes').rglob('*.txt'))
paths += list((ROOT/'assets/gemwoven/beanstalk/themes').rglob('*.json'))
paths += list((ROOT/'assets/gemwoven/hud-connections').glob('*.prompt.txt'))
paths += [ROOT/'assets/gemwoven/hud-connections/art-metadata.json']
paths += [ROOT/'assets/gemwoven/beanstalk/manifest.json']
paths += list((ROOT/'assets/gemwoven/summon-lake').glob('*.txt'))
paths += list((ROOT/'assets/heroes/forms').rglob('forms.json'))
paths += list((ROOT/'assets/heroes/forms').rglob('aura.json'))
paths += list((ROOT/'assets/heroes/forms').rglob('*.webp'))
paths += list((ROOT/'assets/heroes/forms').rglob('*.txt'))
paths = list(dict.fromkeys(p.resolve() for p in paths))
with zipfile.ZipFile(ROOT/'Gemwoven_UI_Kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in paths:z.write(p,p.relative_to(ROOT))
print(f'Standalone: {(ROOT/"Gemwoven_6_Man.html").stat().st_size:,} bytes')
print(f'UI kit: {(ROOT/"Gemwoven_UI_Kit.zip").stat().st_size:,} bytes, {len(paths)} files')
