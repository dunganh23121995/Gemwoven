"""Embed game code and all production art into an offline portrait game."""
from pathlib import Path
import base64
import json
import sys
import io
import hashlib
import subprocess
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parent
draft = '--draft' in sys.argv
keys = ['fire', 'earth', 'ice', 'lightning']


# Game.html links its art and sounds instead of embedding them (the embedded page had grown past
# GitHub's 100 MB file limit): every src is a path relative to the repository root, where the page
# lives. Serve the repository over HTTP (python tools/dev_server.py) to play.
def rel(path):
    p = Path(path)
    p = p if p.is_absolute() else root / p
    return p.relative_to(root).as_posix()


def image(path):
    return rel(path)


def compact_image(path):
    return rel(path)


def sound(path):
    return rel(path)


def load_pil(src):
    """The image behind an ART src (a repository path, or a data URI from older builds)."""
    if src.startswith('data:'):
        return Image.open(io.BytesIO(base64.b64decode(src.split(',', 1)[1])))
    return Image.open(root / src)

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
art['voices']={key:{'src':sound('assets/audio/'+value['file']),'duration':value['duration']} for key,value in voice_manifest.items()}
# Which voice each boss and elite speaks with (assets/audio/voice-casting.json): humans with a
# clear gender get male/female voices, monsters get their own creature recordings.
casting=json.loads((root/'assets/audio/voice-casting.json').read_text(encoding='utf-8'))
art['voiceCasting']={group:{key:entry['family'] for key,entry in casting[group].items()} for group in ['bosses','elites','creatures'] if group in casting}
noct_sfx=json.loads((root/'assets/audio/noct-sfx-manifest.json').read_text(encoding='utf-8'))
art['noctSounds']={key:{'src':sound('assets/audio/'+value['file']),'duration':value['duration']} for key,value in noct_sfx.items()}
cast_sfx=json.loads((root/'assets/audio/cast-sfx-manifest.json').read_text(encoding='utf-8'))
cast_sfx.update(json.loads((root/'assets/audio/lumi-thunder-manifest.json').read_text(encoding='utf-8')))
cast_sfx.update(json.loads((root/'assets/audio/yuki-glacier-manifest.json').read_text(encoding='utf-8')))
cast_sfx.update(json.loads((root/'assets/audio/mika-nori-manifest.json').read_text(encoding='utf-8')))
cast_sfx.update(json.loads((root/'assets/audio/form-skill-manifest.json').read_text(encoding='utf-8')))
art['castSounds']={key:{'src':sound('assets/audio/'+value['file']),'duration':value['duration']} for key,value in cast_sfx.items()}
music_manifest=json.loads((root/'assets/audio/music-manifest.json').read_text(encoding='utf-8'))
if (root/'assets/audio/boss-music-manifest.json').exists():music_manifest.update(json.loads((root/'assets/audio/boss-music-manifest.json').read_text(encoding='utf-8')))
# Boss themes of chapters folded into another chapter (same boss) are no longer played.
for retired in ['pine','obsidian','bamboo','coast','dream','astral']:music_manifest.pop('boss-'+retired,None)
art['music']={key:{'src':sound('assets/audio/'+value['file']),'duration':value['duration'],'title':value['title']} for key,value in music_manifest.items()}
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
    'idle': [[140,88]]*8,  # idle-cloth.webp: 8 stabilized cloth frames (package_cloth_idle.py)
    'attack': [[140,89],[156,113],[140,89],[112,90],[134,105],[140,89]],
    'cast': [[139,92],[161,111],[188,114],[189,115],[195,127],[140,92]],
    'buff': [[141,93],[139,94],[140,94],[140,98],[140,94],[142,94]],
    'hover': [[136,49],[138,49],[139,49],[136,49],[137,49],[137,49]],
}
art['heroes']['shadow'] = {}
for action, heads in shadow_heads.items():
    art['heroes']['shadow'][action] = {'src':image(f'assets/heroes/shadow/{"idle-cloth" if action=="idle" else action}.webp'),
        'cols':2 if action=='idle' else 3,'rows':4 if action=='idle' else 2,'count':len(heads),'heads':heads,**({'frameDuration':150} if action=='idle' else {})}
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
                     'rows':meta['rows'], 'count':meta['frames'], 'heads':meta['headAnchors'],
                     **({'frameDuration':meta['frameDuration']} if meta['frames'] >= 8 else {})}
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

# The foes the campaign actually fields (world.js), so retired creatures are not embedded.
campaign_foes=json.loads(subprocess.run(['node','-e',"const W=require('./src/gemwoven/world.js');console.log(JSON.stringify({foes:W.CHAPTERS.flatMap(c=>[...c.ordinary,...c.elites]),guards:W.EXPANSION.definitions.map(d=>d.theme)}))"],cwd=root,capture_output=True,text=True,check=True).stdout)
# Occasional idle actions of an elite or boss (fidgets.json next to its idle; fidget.py).
def fidget_sheets(folder):
    book=folder/'fidgets.json'
    if not book.exists():return []
    return [{'src':image(folder/f['file']),'cols':2,'rows':4,'count':8,'frameDuration':130,'heads':[[128,48]]*8,'label':f['label']} for f in json.loads(book.read_text(encoding='utf-8'))['fidgets'] if (folder/f['file']).exists()]
# Common foes rest in a lively 8-frame loop (assets/gemwoven/creatures/<id>/idle.webp, drawn by Codex
# frame by frame); they strike in their resting pose.
for folder in sorted((root/'assets/gemwoven/creatures').glob('*/idle.webp')):
    if folder.parent.name not in campaign_foes['foes']:continue
    idle={'src':image(folder),'cols':2,'rows':4,'count':8,'frameDuration':120,'heads':[[128,48]]*8}
    art['campaignCreatures'][folder.parent.name]={'idle':idle,'still':{**idle,'count':1,'heads':[[128,48]]},'portrait':''}
# Humanoid elites (assets/gemwoven/elites/<id>/): a stabilized 8-frame idle (2x4, 256px cells);
# their strikes hold the first idle pose, since combat supplies the lunge and recoil.
for folder in sorted((root/'assets/gemwoven/elites').glob('*/idle.webp')):
    idle={'src':image(folder),'cols':2,'rows':4,'count':8,'frameDuration':150,'heads':[[128,48]]*8}
    still={**idle,'count':1,'heads':[[128,48]]}
    # Only expansion bosses summon their elites as guards (the HUD shows their portraits).
    master=folder.with_name('master.png')
    if not master.exists():master=root/f'assets/gemwoven/items/creature-{folder.parent.name}.png'
    guard=folder.parent.name.split('-')[0] in campaign_foes['guards']
    idle['fidgets']=fidget_sheets(folder.parent)
    art['campaignCreatures'][folder.parent.name]={'idle':idle,'still':still,'portrait':compact_image(master.relative_to(root).as_posix()) if guard and master.exists() else ''}
# A new elite whose idle is not drawn yet stands as its master painting.
for master in sorted((root/'assets/gemwoven/elites').glob('*/master.png')):
    if not master.with_name('idle.webp').exists():
        art['campaignCreatures'][master.parent.name]={'src':image(master),'cols':1,'rows':1,'count':1,'heads':[[128,48]]}
# Chapter bosses (assets/gemwoven/boss-anim/<id>/): an 8-frame idle for all 24 and a 3x2 cast
# sheet for the bosses that had only one painting. The new idle is framed on its own, so every
# other action sheet grows about the feet by the ratio of the body heights (one size per boss).
def body_height(sheet,frame=0):
    im=load_pil(sheet['src']).convert('RGBA');fw,fh=im.width//sheet['cols'],im.height//sheet['rows']
    b=im.crop(((frame%sheet['cols'])*fw,(frame//sheet['cols'])*fh,(frame%sheet['cols']+1)*fw,(frame//sheet['cols']+1)*fh)).getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    return (b[3]-b[1])/fh if b else 0
for folder in sorted((root/'assets/gemwoven/boss-anim').glob('*/idle.webp')):
    key=folder.parent.name;family='bosses' if key in art['bosses'] else 'worldBosses'
    if key not in art[family]:continue
    actions=art[family][key];old=actions['idle']
    idle={'src':image(folder),'cols':2,'rows':4,'count':8,'frameDuration':160,'heads':[[128,48]]*8}
    if old['count']==1:
        # A boss that was one painting: it now holds its first idle pose to strike and recoil.
        still={**idle,'count':1,'heads':[[128,48]]}
        for action in actions:actions[action]=still
    else:
        ratio=body_height(idle)/max(1e-6,body_height(old))
        sheets={}
        for action,sheet in actions.items():
            if id(sheet) not in sheets:sheets[id(sheet)]={**sheet,'scale':round(sheet.get('scale',1)*ratio,4)}
            actions[action]=sheets[id(sheet)]
    idle['fidgets']=fidget_sheets(folder.parent)
    actions['idle']=idle
    hurt=folder.with_name('hurt.webp')
    if hurt.exists():actions['hurt']={'src':image(hurt),'cols':2,'rows':4,'count':8,'heads':[[128,48]]*8}
    cast=folder.with_name('cast.webp')
    if family=='worldBosses' and cast.exists():
        sheet={'src':image(cast),'cols':3,'rows':2,'count':6,'heads':[[128,48]]*6}
        sheet['scale']=round(body_height(idle)/max(1e-6,body_height(sheet)),4)
        actions['cast']=sheet;actions['attack']=sheet
# Use each idle sheet's opaque feet, rather than the bottom of its transparent canvas.
def register_feet(sheet):
    im=load_pil(sheet['src']).convert('RGBA')
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
        # Centre between the boots (solid runs >= 8px in the lowest 7% of the body), ignoring a
        # scythe tip or blade point on the ground: the form aura's floor cloud sits there.
        a=np.asarray(frame.getchannel('A'))>=128;low=a[bounds[3]-1-int((bounds[3]-bounds[1])*.07):bounds[3]]
        cols=low.sum(0);hit=np.where(cols>=max(3,cols.max()*.45))[0]
        runs=[r for r in np.split(hit,np.where(np.diff(hit)>2)[0]+1) if len(r)>=8]
        sheet['feetX']=round((runs[0].min()+runs[-1].max())/2/frame.width,4) if runs else .5

# Horizontal reach of every frame of a sheet (fractions of the frame), so combat
# can keep wind-ups, recoils and wide weapons inside the arena edges.
_span_cache={}
def register_span(sheet):
    key=sheet['src'][-64:]+str(len(sheet['src']))+str(sheet['cols'])+str(sheet['rows'])
    if key not in _span_cache:
        im=load_pil(sheet['src']).convert('RGBA')
        fw,fh=im.width//sheet['cols'],im.height//sheet['rows'];lo,hi=1.0,0.0
        alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
        for i in range(min(sheet.get('count',1),sheet['cols']*sheet['rows'])):
            c,r=i%sheet['cols'],i//sheet['cols'];b=alpha.crop((c*fw,r*fh,(c+1)*fw,(r+1)*fh)).getbbox()
            if b:lo=min(lo,b[0]/fw);hi=max(hi,b[2]/fw)
        _span_cache[key]=[round(lo,4),round(hi,4)] if hi>lo else [0.0,1.0]
    sheet['span']=_span_cache[key]
art['heroForms']={}
form_skill_fx=json.loads((root/'assets/fx/forms/fx.json').read_text(encoding='utf-8'))
art['formSkillFx']={hero:{form:{**sheet,'src':compact_image(sheet['file'])} for form,sheet in forms.items()} for hero,forms in form_skill_fx.items()}
art['scytheGlint']=image('assets/heroes/forms/shadow/form-3/scythe-mask.png')
# Each chapter boss's signature skill effect (also used, smaller, by that chapter's elites).
boss_fx_path=root/'assets/fx/bosses/fx.json'
art['bossFx']={boss:{**sheet,'src':compact_image(sheet['file'])} for boss,sheet in json.loads(boss_fx_path.read_text(encoding='utf-8')).items() if (root/sheet['file']).exists()} if boss_fx_path.exists() else {}
reaper_fx=json.loads((root/'assets/fx/noct/fx.json').read_text(encoding='utf-8'))
art['reaperFx']={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in reaper_fx.items()}
art['formAuras']={}
for catalog in sorted((root/'assets/heroes/forms').glob('*/aura.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'))
    art['formAuras'][catalog.parent.name]={**data,'src':compact_image(data['file']),**({'frontSrc':compact_image(data['front'])} if data.get('front') else {})}
for catalog in sorted((root/'assets/heroes/forms').glob('*/forms.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'));forms={}
    for form,entry in data['forms'].items():
        actions={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in entry['actions'].items()}
        actions['buff']=actions['cast'];actions.setdefault('hover',actions['run'])
        register_feet(actions['idle']);forms[form]=actions
    art['heroForms'][data['hero']]=forms
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():register_feet(character['idle'])
for retired in [k for k in art['campaignCreatures'] if k not in campaign_foes['foes']]:del art['campaignCreatures'][retired]
def creature_sheets():
    for entry in art['campaignCreatures'].values():yield from ([entry['idle'],entry['still']] if 'idle' in entry else [entry])
for sheet in creature_sheets():register_feet(sheet)
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():register_span(sheet)
for forms in art['heroForms'].values():
    for actions in forms.values():
        for sheet in actions.values():register_span(sheet)
for sheet in creature_sheets():register_span(sheet)
for family in ['bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():
            if sheet.get('scale') and 'footY' not in sheet:register_feet(sheet)

html = (root / 'src/template.html').read_text(encoding='utf-8')
css = '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                for p in ['game.css', 'theme-v3.css', 'combat-v3.css', 'sprites.css', 'combo-v4.css', 'antique.css', 'combat-stage.css', 'adventure-effects.css', 'cinematic.css', 'restoration.css', 'scene-ambience.css', 'audio-settings.css', 'shadow-combat.css', 'gem-selection.css', 'cast-redesign.css', 'self-buffs.css', 'yuki-ultimate.css', 'mika-ultimate.css', 'foe-skills.css'])
css += '\n'+(root/'src/progression-combat.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/expedition-combat.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/gemwoven/hero-forms.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/hero-forms-combat.css').read_text(encoding='utf-8')
# The same picture is often referenced several times (a still pose shares its idle sheet, a
# one-painting boss uses it for every action). Embed each data URI once and resolve the
# references when the page starts.
blobs,blob_index=[],{}
def share_blobs(node):
    if isinstance(node,dict):return {k:share_blobs(v) for k,v in node.items()}
    if isinstance(node,list):return [share_blobs(v) for v in node]
    if isinstance(node,str) and node.startswith('data:') and len(node)>4096:
        if node not in blob_index:blob_index[node]=len(blobs);blobs.append(node)
        return f'@blob:{blob_index[node]}'
    return node
shared_art=share_blobs(art)
resolve_blobs="(function resolve(node){for(const k in node){const v=node[k];if(typeof v==='string'&&v.startsWith('@blob:'))node[k]=ART_BLOBS[+v.slice(6)];else if(v&&typeof v==='object')resolve(v);}})(ART);\n"
extensions = '\n'.join((root/f'src/gemwoven/{name}.js').read_text(encoding='utf-8') for name in ['boss-chapters','boss-tactics','world','progression'])+'\nconst ART_BLOBS=' + json.dumps(blobs, separators=(',', ':')) + ';\nconst ART=' + json.dumps(shared_art, separators=(',', ':')) + ';\n' + resolve_blobs
extensions += '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                        for p in ['audio-settings.js', 'sprite-runtime.js', 'combo-v4.js', 'opponent-ai.js', 'opponent-turn.js', 'board-sequence.js', 'combat-v3.js', 'live-combat.js', 'antique-trim.js', 'combat-stage.js', 'adventure-effects.js', 'noct-audio.js', 'recorded-voices.js', 'restoration.js', 'cinematic.js', 'scene-ambience.js', 'shadow-combat.js', 'cast-redesign.js', 'self-buffs.js', 'yuki-ultimate.js', 'mika-ultimate.js', 'foe-skills.js'])
extensions += '\n'+(root/'src/progression-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/expedition-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/gemwoven/form-effects.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/hero-forms-combat.js').read_text(encoding='utf-8')
js = (root / 'src/game.js').read_text(encoding='utf-8').replace('/* GAME_EXTENSIONS */', extensions)
html = html.replace('/* GAME_CSS */', css).replace('/* GAME_JS */', js)
(root / 'Game.html').write_text(html, encoding='utf-8')
print(f'Built Game.html ({len(html.encode("utf-8")):,} bytes).')
