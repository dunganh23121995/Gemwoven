"""Embed game code and all production art into an offline portrait game."""
from pathlib import Path
import base64
import json
import sys
import io
from PIL import Image

root = Path(__file__).resolve().parent
draft = '--draft' in sys.argv
keys = ['fire', 'earth', 'ice', 'lightning']


def image(path):
    p = root / path
    mime = 'image/webp' if p.suffix == '.webp' else 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode('ascii')


def compact_image(path):
    """Embed a lossless source sheet as high-quality lossy WebP.

    Star-form atlases would otherwise push the tracked Game.html past GitHub's
    100 MB file limit; the lossless originals stay in the repository.
    """
    buffer = io.BytesIO()
    Image.open(root / path).convert('RGBA').save(buffer, 'WEBP', quality=95, method=6, alpha_quality=100)
    return 'data:image/webp;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')


def atlas(path, cols, rows, count, fallback):
    if not (root / path).exists():
        if not draft:
            raise FileNotFoundError(path)
        return {'src': image(fallback), 'cols': 1, 'rows': 1, 'count': 1}
    return {'src': image(path), 'cols': cols, 'rows': rows, 'count': count}


art = {'heroes': {}, 'enemies': {}, 'items': {}, 'landscape': image('assets/landscape.webp')}
art['skillFx'] = {'yukiBoulder': image('assets/fx/yuki/boulder.webp'), 'mikaBlade': image('assets/fx/mika/blade.webp'), 'mikaWave': image('assets/fx/mika/wave.webp'), 'mikaExplosion': image('assets/fx/mika/explosion.webp')}
art['scenes'] = {key: image(f'assets/scenes/{key}.webp') for key in keys}
art['parallax'] = {key: [image(f'assets/scenes/painted/{key}-{layer}.webp') for layer in ['far', 'mid', 'near']] for key in keys}
voice_manifest=json.loads((root/'assets/audio/manifest.json').read_text(encoding='utf-8'))
voice_manifest.update(json.loads((root/'assets/audio/creature-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/noct-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/cast-voice-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/boss-voice-manifest.json').read_text(encoding='utf-8')))
art['voices']={key:{'src':'data:audio/wav;base64,'+base64.b64encode((root/'assets/audio'/value['file']).read_bytes()).decode('ascii'),'duration':value['duration']} for key,value in voice_manifest.items()}
noct_sfx=json.loads((root/'assets/audio/noct-sfx-manifest.json').read_text(encoding='utf-8'))
art['noctSounds']={key:{'src':'data:audio/wav;base64,'+base64.b64encode((root/'assets/audio'/value['file']).read_bytes()).decode('ascii'),'duration':value['duration']} for key,value in noct_sfx.items()}
cast_sfx=json.loads((root/'assets/audio/cast-sfx-manifest.json').read_text(encoding='utf-8'))
cast_sfx.update(json.loads((root/'assets/audio/lumi-thunder-manifest.json').read_text(encoding='utf-8')))
cast_sfx.update(json.loads((root/'assets/audio/yuki-glacier-manifest.json').read_text(encoding='utf-8')))
cast_sfx.update(json.loads((root/'assets/audio/mika-nori-manifest.json').read_text(encoding='utf-8')))
art['castSounds']={key:{'src':'data:audio/wav;base64,'+base64.b64encode((root/'assets/audio'/value['file']).read_bytes()).decode('ascii'),'duration':value['duration']} for key,value in cast_sfx.items()}
music_manifest=json.loads((root/'assets/audio/music-manifest.json').read_text(encoding='utf-8'))
if (root/'assets/audio/boss-music-manifest.json').exists():music_manifest.update(json.loads((root/'assets/audio/boss-music-manifest.json').read_text(encoding='utf-8')))
art['music']={key:{'src':'data:audio/ogg;base64,'+base64.b64encode((root/'assets/audio'/value['file']).read_bytes()).decode('ascii'),'duration':value['duration'],'title':value['title']} for key,value in music_manifest.items()}
for key in keys:
    art['heroes'][key] = {
        action: atlas(f'assets/heroes/{key}/{action}.webp', 2 if action == 'idle' else 3,
                      2, 4 if action == 'idle' else 6, f'assets/masters/{key}-transparent.png')
        for action in ['idle', 'attack', 'cast']
    }
    art['enemies'][key] = {
        action: atlas(f'assets/monsters/{key}/{action}.webp', 2 if action == 'idle' else 3,
                      1 if action == 'idle' else 2, 2 if action == 'idle' else 6,
                      f'assets/masters/{key}-transparent.png')
        for action in ['idle', 'attack']
    }
    run = atlas(f'assets/heroes/{key}/run.webp', 3, 2, 6, f'assets/masters/{key}-transparent.png')
    run['heads'] = []
    for index in range(6):
        frame = Image.open(root / f'assets/heroes/{key}/run/frame-{index:02}.png').convert('RGBA')
        box = frame.getchannel('A').getbbox()
        top = [(x, y) for y in range(box[1], box[1]+10) for x in range(256) if frame.getpixel((x,y))[3]>128]
        run['heads'].append([round(sum(p[0] for p in top)/max(1,len(top))), box[1]])
    art['heroes'][key]['run'] = run
shadow_heads = {
    'idle': [[140,88],[140,88],[140,89],[140,89]],
    'attack': [[140,89],[156,113],[140,89],[112,90],[134,105],[140,89]],
    'cast': [[139,92],[161,111],[188,114],[189,115],[195,127],[140,92]],
    'buff': [[141,93],[139,94],[140,94],[140,98],[140,94],[142,94]],
    'hover': [[136,49],[138,49],[139,49],[136,49],[137,49],[137,49]],
}
art['heroes']['shadow'] = {}
for action, heads in shadow_heads.items():
    art['heroes']['shadow'][action] = {'src':image(f'assets/heroes/shadow/{action}.webp'),
        'cols':2 if action=='idle' else 3,'rows':2,'count':len(heads),'heads':heads}
art['heroes']['earth']['smash'] = atlas('assets/heroes/earth/smash.webp',3,2,6,'assets/masters/earth-transparent.png')
art['heroes']['earth']['smash']['heads'] = [[144,84],[132,79],[119,86],[140,89],[126,94],[127,87]]
# Reimagined main cast: every action must have passed the shared-scale pipeline.
art['bosses'] = {}
for family in ['heroes', 'bosses']:
    for key in keys:
        actions = ['idle','attack','cast','hurt'] + (['buff','hover' if key=='lightning' else 'run'] if family=='heroes' else [])
        if family=='heroes' and key in ('fire','earth'): actions.append('smash')
        art[family][key] = {}
        for action in actions:
            base = root / f'assets/reimagined/{family}/{key}/{action}'
            meta = json.loads((base/'runtime-meta.json').read_text(encoding='utf-8'))
            if not meta['accepted']: raise ValueError(f'Unaccepted art: {base}')
            sheet = {'src':image(base.parent/f'{action}.webp'), 'cols':meta['columns'],
                     'rows':meta['rows'], 'count':meta['frames'], 'heads':meta['headAnchors']}
            art[family].setdefault(key,{})[action]=sheet
for name in ['sword', 'heart', 'crystal', 'snow', 'shield']:
    for suffix in ['', '-bolt', '-bomb']:
        art['items'][name + suffix] = image(f'assets/items/{name}{suffix}.webp')
art['items']['core'] = image('assets/items/core.webp')
novice_meta=json.loads((root/'assets/heroes/novice/meta.json').read_text(encoding='utf-8'))
art['heroes']['novice']={action:{'src':image(f'assets/heroes/novice/{action}.webp'),'cols':meta['columns'],'rows':meta['rows'],'count':meta['frames'],'heads':meta['headAnchors'],'frameDuration':meta['frameDuration']} for action,meta in novice_meta['actions'].items()}
art['heroes']['novice']['buff']=art['heroes']['novice']['cast']
art['campaignCreatures']={}
journey_items=json.loads((root/'assets/gemwoven/journey-items.json').read_text(encoding='utf-8'))['items']
for creature in ['slime','acorn','bat']:
    meta=journey_items[f'monster-{creature}'];path=root/'assets/gemwoven'/meta['file']
    art['campaignCreatures'][creature]={'src':image(path),'cols':1,'rows':1,'count':1,'heads':[[128,round(meta['alphaBounds'][1]/2)]]}
art['evolution']={piece:image(f'assets/gemwoven/items/evo-{piece}.png') for piece in ['weapon','shoulders','gloves','boots','crest','aura']}
for name in ['theme-creature-items','boss-items']:
    catalog=json.loads((root/f'assets/gemwoven/{name}.json').read_text(encoding='utf-8'))['items']
    art.setdefault('worldBosses',{})
    for key,meta in catalog.items():
        sheet={'src':image(root/'assets/gemwoven'/meta.get('webp',meta['file'])),'cols':1,'rows':1,'count':1,'heads':[[128,round(meta['alphaBounds'][1]/2)]]}
        if key.startswith('creature-'):art['campaignCreatures'][key[9:]]=sheet
        else:art['worldBosses'][key[5:]]={action:sheet for action in ['idle','attack','cast','hurt']}
art['worldScenes']={p.stem:image(p) for p in (root/'assets/gemwoven/backgrounds/battles').glob('*.webp')}
ecosystem_path=root/'assets/gemwoven/chapter-ecosystem-items.json'
art['counterItems']={}
if ecosystem_path.exists():
    for key,meta in json.loads(ecosystem_path.read_text(encoding='utf-8'))['items'].items():
        source=root/'assets/gemwoven'/meta.get('webp',meta['file'])
        if key.startswith('creature-'):art['campaignCreatures'][key[9:]]={'src':image(source),'cols':1,'rows':1,'count':1,'heads':[[128,round(meta['alphaBounds'][1]/2)]]}
        else:art['counterItems'][key[9:]]=image(source)
for name in ['boss-expansion-a','boss-expansion-b']:
    path=root/f'assets/gemwoven/{name}.json'
    if not path.exists():continue
    for key,data in json.loads(path.read_text(encoding='utf-8'))['bosses'].items():
        art['worldBosses'][key]={action:{**data[action],'src':image(data[action]['src'] if data[action]['src'].startswith('assets/') else 'assets/gemwoven/'+data[action]['src'])} for action in ['idle','cast','attack','hurt']}

# Use each idle sheet's opaque feet, rather than the bottom of its transparent canvas.
def register_feet(sheet):
    im=Image.open(io.BytesIO(base64.b64decode(sheet['src'].split(',',1)[1]))).convert('RGBA')
    frame=im.crop((0,0,im.width//sheet['cols'],im.height//sheet['rows']))
    bounds=frame.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    sheet['footY']=round(bounds[3]/frame.height,5) if bounds else .94
    sheet['bodyHeight']=round((bounds[3]-bounds[1])/frame.height,5) if bounds else .75
    if bounds:
        # Crown: the highest opaque pixel of the resting pose, raised weapons and
        # horns included, so the head HUD never sits on top of the painted body.
        # x is the centre of the top fifth of the body (used when heads are guessed).
        band=frame.crop((0,bounds[1],frame.width,bounds[1]+max(4,(bounds[3]-bounds[1])//5))).getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
        cx=(band[0]+band[2])/2 if band else frame.width/2
        sheet['crown']=[round(cx*256/frame.width),round(bounds[1]*256/frame.height)]
        sheet['bodyX']=round((bounds[0]+bounds[2])/2*256/frame.width)

# Horizontal reach of every frame of a sheet (fractions of the frame), so combat
# can keep wind-ups, recoils and wide weapons inside the arena edges.
_span_cache={}
def register_span(sheet):
    key=sheet['src'][-64:]+str(len(sheet['src']))+str(sheet['cols'])+str(sheet['rows'])
    if key not in _span_cache:
        im=Image.open(io.BytesIO(base64.b64decode(sheet['src'].split(',',1)[1]))).convert('RGBA')
        fw,fh=im.width//sheet['cols'],im.height//sheet['rows'];lo,hi=1.0,0.0
        alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
        for i in range(min(sheet.get('count',1),sheet['cols']*sheet['rows'])):
            c,r=i%sheet['cols'],i//sheet['cols'];b=alpha.crop((c*fw,r*fh,(c+1)*fw,(r+1)*fh)).getbbox()
            if b:lo=min(lo,b[0]/fw);hi=max(hi,b[2]/fw)
        _span_cache[key]=[round(lo,4),round(hi,4)] if hi>lo else [0.0,1.0]
    sheet['span']=_span_cache[key]
art['heroForms']={}
art['formAuras']={}
for catalog in sorted((root/'assets/heroes/forms').glob('*/aura.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'))
    art['formAuras'][catalog.parent.name]={**data,'src':compact_image(data['file']),**({'frontSrc':compact_image(data['front'])} if data.get('front') else {})}
for catalog in sorted((root/'assets/heroes/forms').glob('*/forms.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'));forms={}
    for form,entry in data['forms'].items():
        actions={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in entry['actions'].items()}
        actions['buff']=actions['cast'];actions['hover']=actions['run']
        register_feet(actions['idle']);forms[form]=actions
    art['heroForms'][data['hero']]=forms
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():register_feet(character['idle'])
for sheet in art['campaignCreatures'].values():register_feet(sheet)
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():register_span(sheet)
for forms in art['heroForms'].values():
    for actions in forms.values():
        for sheet in actions.values():register_span(sheet)
for sheet in art['campaignCreatures'].values():register_span(sheet)

html = (root / 'src/template.html').read_text(encoding='utf-8')
css = '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                for p in ['game.css', 'theme-v3.css', 'combat-v3.css', 'sprites.css', 'combo-v4.css', 'antique.css', 'combat-stage.css', 'adventure-effects.css', 'cinematic.css', 'restoration.css', 'scene-ambience.css', 'audio-settings.css', 'shadow-combat.css', 'gem-selection.css', 'cast-redesign.css', 'self-buffs.css', 'yuki-ultimate.css', 'mika-ultimate.css'])
css += '\n'+(root/'src/progression-combat.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/expedition-combat.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/gemwoven/hero-forms.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/hero-forms-combat.css').read_text(encoding='utf-8')
extensions = '\n'.join((root/f'src/gemwoven/{name}.js').read_text(encoding='utf-8') for name in ['boss-chapters','boss-tactics','world','progression'])+'\nconst ART=' + json.dumps(art, separators=(',', ':')) + ';\n'
extensions += '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                        for p in ['audio-settings.js', 'sprite-runtime.js', 'combo-v4.js', 'opponent-ai.js', 'opponent-turn.js', 'board-sequence.js', 'combat-v3.js', 'live-combat.js', 'antique-trim.js', 'combat-stage.js', 'adventure-effects.js', 'noct-audio.js', 'recorded-voices.js', 'restoration.js', 'cinematic.js', 'scene-ambience.js', 'shadow-combat.js', 'cast-redesign.js', 'self-buffs.js', 'yuki-ultimate.js', 'mika-ultimate.js'])
extensions += '\n'+(root/'src/progression-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/expedition-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/gemwoven/form-effects.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/hero-forms-combat.js').read_text(encoding='utf-8')
js = (root / 'src/game.js').read_text(encoding='utf-8').replace('/* GAME_EXTENSIONS */', extensions)
html = html.replace('/* GAME_CSS */', css).replace('/* GAME_JS */', js)
(root / 'Game.html').write_text(html, encoding='utf-8')
print(f'Built Game.html ({len(html.encode("utf-8")):,} bytes).')
