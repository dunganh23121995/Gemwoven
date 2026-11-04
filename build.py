"""Embed game code and all production art into an offline portrait game."""
from pathlib import Path
import base64
import json
import os
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


# A foe's action sheet redrawn sharper (assets/gemwoven/sharpen_foes.py) keeps its old drawing beside it: every number
# measured off a sheet (feet, body height, reach, front points) is measured on that, so the redraw stands, reaches and
# casts exactly where the approved drawing did.
_sharp_path = root / 'assets/gemwoven/sharp-sheets.json'
sharp_old = json.loads(_sharp_path.read_text(encoding='utf-8')) if _sharp_path.exists() else {}


def load_pil(src):
    """The image behind an ART src (a repository path, or a data URI from older builds), to measure."""
    if src.startswith('data:'):
        return Image.open(io.BytesIO(base64.b64decode(src.split(',', 1)[1])))
    if src in sharp_old:
        return Image.open(root / sharp_old[src])
    return Image.open(root / src)

def atlas(path, cols, rows, count, fallback):
    if not (root / path).exists():
        if not draft:
            raise FileNotFoundError(path)
        return {'src': image(fallback), 'cols': 1, 'rows': 1, 'count': 1}
    return {'src': image(path), 'cols': cols, 'rows': rows, 'count': count}


art = {'heroes': {}, 'enemies': {}, 'items': {}, 'landscape': image('assets/landscape.webp')}
art['skillFx'] = {'yukiBoulder': image('assets/fx/yuki/boulder.webp'), 'mikaBlade': image('assets/fx/mika/blade.webp'), 'mikaWave': image('assets/fx/mika/wave.webp'), 'mikaExplosion': image('assets/fx/mika/explosion.webp')}
# Combat popup art (assets/fx/ui/export_ui.py): the critical-hit starburst and its 'CHÍ MẠNG' ribbon.
art['uiFx'] = {'critBurst': image('assets/fx/ui/crit-burst.webp'), 'critRibbon': image('assets/fx/ui/crit-ribbon.webp')}
art['scenes'] = {key: image(f'assets/scenes/{key}.webp') for key in keys}
art['parallax'] = {key: [image(f'assets/scenes/painted/{key}-{layer}.webp') for layer in ['far', 'mid', 'near']] for key in keys}
voice_manifest=json.loads((root/'assets/audio/manifest.json').read_text(encoding='utf-8'))
voice_manifest.update(json.loads((root/'assets/audio/creature-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/noct-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/cast-voice-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/boss-voice-manifest.json').read_text(encoding='utf-8')))
voice_manifest.update(json.loads((root/'assets/audio/hiro-voice-manifest.json').read_text(encoding='utf-8')))
art['voices']={key:{'src':sound('assets/audio/'+value['file']),'duration':value['duration']} for key,value in voice_manifest.items()}
# Which voice each boss and creature speaks with (assets/audio/voice-casting.json): humans with a
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
# Each hero's own form-kit sounds (src/forms-<hero>.js): assets/audio/hero-forms/<hero>-manifest.json.
for manifest in sorted((root/'assets/audio/hero-forms').glob('*-manifest.json')):cast_sfx.update(json.loads(manifest.read_text(encoding='utf-8')))
# Each boss skill's own recordings (src/foe-skills.js BOSS_SKILL_LOOKS): assets/audio/boss-skills/<boss>-manifest.json.
for manifest in sorted((root/'assets/audio/boss-skills').glob('*-manifest.json')):cast_sfx.update(json.loads(manifest.read_text(encoding='utf-8')))
# The elites' bank (src/foe-skills.js ELITE_LOOKS, scripts/prepare_elite_sounds.py).
elite_sfx=root/'assets/audio/elite-skills/manifest.json'
if elite_sfx.exists():cast_sfx.update(json.loads(elite_sfx.read_text(encoding='utf-8')))
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
        'cols':2 if action=='idle' else 3,'rows':4 if action=='idle' else 2,'count':len(heads),'heads':heads,**({'frameDuration':200} if action=='idle' else {})}
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
# Each hero's drawn Biến Thân look (src/transform-fx.js); a hero without one keeps the plain golden glow.
art['transformLooks']={hero:{name:image(f'assets/heroes/forms/{hero}/transform/{name}.webp') for name in ['spirit','side-left','side-right','ground','mote','mote-2','after']} for hero in sorted(p.parent.parent.name for p in (root/'assets/heroes/forms').glob('*/transform/spirit.webp'))}
# Biến Thân v2 (owner 04/11: a huge see-through spirit rises and fades, then an aura built from the hero's own silhouette
# stays): a hero whose transform folder holds v2.json (assets/heroes/forms/transform_spirit.py) plays the v2 look.
for hero,look in art['transformLooks'].items():
    if (root/f'assets/heroes/forms/{hero}/transform/v2.json').exists():look['v2']=1
# Each form's own body box (top, height, centre as fractions of the cell, from its resting frame) places the look, since
# not every combat sheet carries its body height.
def transform_body(hero,form):
    box=Image.open(root/f'assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png').getchannel('A').point(lambda v:255 if v>40 else 0).getbbox()
    return [round(box[1]/512,4),round((box[3]-box[1])/512,4),round((box[0]+box[2])/1024,4)]
for hero,look in art['transformLooks'].items():look['bodies']={form:transform_body(hero,form) for form in (1,2,3) if (root/f'assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png').exists()}
for name in ['theme-creature-items','boss-items']:
    catalog=json.loads((root/f'assets/gemwoven/{name}.json').read_text(encoding='utf-8'))['items']
    art.setdefault('worldBosses',{})
    for key,meta in catalog.items():
        sheet={'src':image(root/'assets/gemwoven'/meta.get('webp',meta['file'])),'cols':1,'rows':1,'count':1,'heads':[[128,round(meta['alphaBounds'][1]/2)]]}
        if key.startswith('creature-'):art['campaignCreatures'][key[9:]]=sheet
        else:art['worldBosses'][key[5:]]={action:sheet for action in ['idle','attack','cast','hurt']}
art['worldScenes']={p.stem:image(p) for p in (root/'assets/gemwoven/backgrounds/battles').glob('*.webp')}
# Each chapter's own combat scenery (assets/scenes/chapters, gen_chapters.py + export_chapters.py): three layers
# drawn apart (far sky, mid-distance scenery, the stage with its framing objects).
art['chapterParallax']={cid:[image(f'assets/scenes/chapters/{e["layers"][layer]}') for layer in ['far','mid','stage']] for cid,e in json.loads((root/'assets/scenes/chapters/manifest.json').read_text(encoding='utf-8'))['chapters'].items()}
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
def body_height(sheet,frame=0):
    im=load_pil(sheet['src']).convert('RGBA');fw,fh=im.width//sheet['cols'],im.height//sheet['rows']
    b=im.crop(((frame%sheet['cols'])*fw,(frame//sheet['cols'])*fh,(frame%sheet['cols']+1)*fw,(frame//sheet['cols']+1)*fh)).getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    return (b[3]-b[1])/fh if b else 0
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
    entry={'idle':idle,'still':still,'portrait':compact_image(master.relative_to(root).as_posix()) if guard and master.exists() else ''}
    # Its own combat body (assets/gemwoven/elites/anim.py): five 3x2 sheets drawn at one size, sized to the idle by the
    # height of the attack's ready frame and stood on its feet like a chapter boss's poses.
    for action in ['attack','skill','cast','hurt','defeat']:
        sheet_path=folder.with_name(action+'.webp')
        if sheet_path.exists():
            sheet={'src':image(sheet_path),'cols':3,'rows':2,'count':6,'heads':[[128,48]]*6,'frameDuration':110}
            sheet['scale']=entry['attack']['scale'] if 'attack' in entry else round(body_height(idle)/max(1e-6,body_height(sheet)),4)
            entry[action]=sheet
    art['campaignCreatures'][folder.parent.name]=entry
# A new elite whose idle is not drawn yet stands as its master painting.
for master in sorted((root/'assets/gemwoven/elites').glob('*/master.png')):
    if not master.with_name('idle.webp').exists():
        art['campaignCreatures'][master.parent.name]={'src':image(master),'cols':1,'rows':1,'count':1,'heads':[[128,48]]}
# Chapter bosses (assets/gemwoven/boss-anim/<id>/): an 8-frame idle for all 24 and a 3x2 cast
# sheet for the bosses that had only one painting. The new idle is framed on its own, so every
# other action sheet grows about the feet by the ratio of the body heights (one size per boss).
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
    # The same idle loop wearing armour the boss grows itself (src/sprite-runtime.js rests in it while
    # the boss's armour holds).
    armored=folder.with_name('armoridle.webp')
    if armored.exists():
        actions['armoridle']={'src':image(armored),'cols':2,'rows':4,'count':8,'frameDuration':160,'heads':[[128,48]]*8}
        actions['armoridle']['scale']=round(body_height(idle)/max(1e-6,body_height(actions['armoridle'])),4)
    cast=folder.with_name('cast.webp')
    if family=='worldBosses' and cast.exists():
        sheet={'src':image(cast),'cols':3,'rows':2,'count':6,'heads':[[128,48]]*6}
        sheet['scale']=round(body_height(idle)/max(1e-6,body_height(sheet)),4)
        actions['cast']=sheet;actions['attack']=sheet
# Each chapter boss's combat actions for its own skills (assets/gemwoven/boss-anim/actions.json: bites,
# tail lashes, flight, scythe cuts...), 3x2 sheets sized to the boss's idle by its body height (a hover
# loop keeps the idle's scale too); src/foe-skills.js plays them by name (look.pose).
boss_actions=json.loads((root/'assets/gemwoven/boss-anim/actions.json').read_text(encoding='utf-8'))
for key,poses in boss_actions.items():
    if key=='note':continue
    family='bosses' if key in art['bosses'] else 'worldBosses'
    if key not in art.get(family,{}):continue
    idle=art[family][key]['idle']
    for name,spec in poses.items():
        path=root/'assets/gemwoven/boss-anim'/key/f'{name}.webp'
        if not path.exists():continue
        sheet={'src':image(path),'cols':3,'rows':2,'count':6,'heads':[[128,48]]*6,'frameDuration':110}
        sheet['scale']=round(body_height(idle)/max(1e-6,body_height(sheet)),4)
        # A pose whose height is not the body's (wings spread over the head, a tail hanging in flight)
        # takes the scale of a grounded action drawn at the same size (scaleAs).
        if spec.get('scaleAs'):sheet['scaleAs']=spec['scaleAs']
        # Where the mouth is in each cell (fractions), for breath and streams from that pose.
        if spec.get('mouth'):sheet['mouth']=spec['mouth']
        # A flying loop: the boss is airborne, so it is never shrunk to fit a raised pose under the HUD.
        if spec.get('loop'):sheet['airborne']=True
        art[family][key][name]=sheet
    for name,spec in poses.items():
        sheet=art[family][key].get(name)
        if sheet and sheet.get('scaleAs') in art[family][key]:sheet['scale']=art[family][key][sheet.pop('scaleAs')]['scale']
# Use each idle sheet's opaque feet, rather than the bottom of its transparent canvas.
def register_feet(sheet):
    im=load_pil(sheet['src']).convert('RGBA')
    frame=im.crop((0,0,im.width//sheet['cols'],im.height//sheet['rows']))
    # A foe's resting frame redrawn at 512/640px (assets/gemwoven/sharpen_foes.py) is measured at the 256px its
    # poses were placed by, so the boots found (runs >= 8px) and every number stay those of the same picture.
    if '/rig/foe/' in sheet['src'] and frame.width>256:frame=frame.resize((256,256),Image.Resampling.LANCZOS)
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
def rig_idle(sheet,hero=None,form=None,path=None):
    # A form or foe with a baked mesh-rig loop (assets/heroes/forms/rig_idle.py, assets/gemwoven/rig_foes.py) rests in it;
    # frame 1 is the old sheet's frame 1.
    path=path or root/f'assets/heroes/forms/{hero}/form-{form}/rig/combat'
    if not (path/'rig.json').exists():return
    rig=json.loads((path/'rig.json').read_text(encoding='utf-8'))
    sheet.update(src=image(path/'idle.webp'),cols=rig['cols'],rows=rig['rows'],count=rig['count'],frameDuration=rig['frameDuration'],heads=sheet['heads'][:1]*rig['count'])
def rig_buff(character,hero=None,form=None,path=None):
    # A baked one-shot buff (rig_idle.py surge) starts and ends on the resting frame, so it shares the idle's framing.
    path=path or root/f'assets/heroes/forms/{hero}/form-{form}/rig/buff'
    if not (path/'rig.json').exists():return
    rig=json.loads((path/'rig.json').read_text(encoding='utf-8')),character['idle']
    character['buff']={**rig[1],'src':image(path/'buff.webp'),'cols':rig[0]['cols'],'rows':rig[0]['rows'],'count':rig[0]['count'],'frameDuration':rig[0]['frameDuration'],'heads':rig[1]['heads'][:1]*rig[0]['count'],'baked':True}
art['heroForms']={}
form_skill_fx=json.loads((root/'assets/fx/forms/fx.json').read_text(encoding='utf-8'))
art['formSkillFx']={hero:{form:{**sheet,'src':compact_image(sheet['file'])} for form,sheet in forms.items()} for hero,forms in form_skill_fx.items()}
art['scytheGlint']=image('assets/heroes/forms/shadow/form-3/scythe-mask.png')
# Each chapter boss's signature skill effect (also used, smaller, by that chapter's elites).
boss_fx_path=root/'assets/fx/bosses/fx.json'
art['bossFx']={boss:{**sheet,'src':compact_image(sheet['file'])} for boss,sheet in json.loads(boss_fx_path.read_text(encoding='utf-8')).items() if (root/sheet['file']).exists()} if boss_fx_path.exists() else {}
# Where each effect sheet's painting lies in its cells (fractions, the union over its frames): src/foe-skills.js
# foeFx keeps the painting, not the cell's empty margin, inside the stage.
# Each elite's own skill sheets (assets/fx/elites/skill_prompts.py), under "<elite id>/<fx>", with the ground line
# measured at export.
elite_fx_path=root/'assets/fx/elites/fx.json'
if elite_fx_path.exists():art['bossFx'].update({key:{**sheet,'src':compact_image(sheet['file'])} for key,sheet in json.loads(elite_fx_path.read_text(encoding='utf-8')).items() if (root/sheet['file']).exists()})
ground_path=root/'assets/fx/bosses/ground-line.json'
ground_lines=json.loads(ground_path.read_text(encoding='utf-8')) if ground_path.exists() else {}
for sheet_key,sheet in art['bossFx'].items():
    im=Image.open(root/sheet['file']).getchannel('A').point(lambda a:255 if a>=48 else 0)
    n=sheet.get('count',1);fw=im.width//n;fh=im.height;box=None
    for i in range(n):
        b=im.crop((i*fw,0,(i+1)*fw,fh)).getbbox()
        if b:box=b if box is None else (min(box[0],b[0]),min(box[1],b[1]),max(box[2],b[2]),max(box[3],b[3]))
    sheet['box']=[round(box[0]/fw,3),round(box[1]/fh,3),round(box[2]/fw,3),round(box[3]/fh,3)] if box else [0,0,1,1]
    # Its contact line, where it meets the floor (fractions of the cell; null for an effect in the air): read off
    # each grounded sheet by eye (assets/fx/bosses/ground-line.json; loose debris and spray below the base do not
    # count). src/foe-skills.js stands that line on the target's feet, so every effect of a skill meets one floor.
    if ground_lines.get(sheet_key) is not None:sheet['ground']=ground_lines[sheet_key]
reaper_fx=json.loads((root/'assets/fx/noct/fx.json').read_text(encoding='utf-8'))
art['reaperFx']={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in reaper_fx.items()}
# Each hero's own skill art for its forms (src/forms-<hero>.js): assets/fx/heroes/<key>/fx.json.
art['heroFx']={path.parent.name:{name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in json.loads(path.read_text(encoding='utf-8')).items()} for path in sorted((root/'assets/fx/heroes').glob('*/fx.json'))}
# Motes that drift around a hero at rest (embers, snowflakes, leaves, stars): assets/fx/heroes/motes.
art['heroMotes']={hero:[compact_image(f) for f in files] for hero,files in json.loads((root/'assets/fx/heroes/motes/motes.json').read_text(encoding='utf-8')).items()}
# Alternative drawings of a hero for the studio to compare (assets/heroes/<key>/variants/<name>/meta.json).
art['heroVariants']={}
for path in sorted((root/'assets/heroes').glob('*/variants/*/meta.json')):
    meta=json.loads(path.read_text(encoding='utf-8'))
    art['heroVariants'].setdefault(path.parents[2].name,{})[path.parent.name]={action:{'src':image(path.parent/sheet['atlas']),'cols':sheet['columns'],'rows':sheet['rows'],'count':sheet['frames'],'heads':sheet['headAnchors'],'frameDuration':sheet['frameDuration']} for action,sheet in meta['actions'].items()}
depart_fx_path=root/'assets/fx/depart/fx.json'
art['departFx']={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in json.loads(depart_fx_path.read_text(encoding='utf-8')).items()} if depart_fx_path.exists() else {}
art['formAuras']={}
for catalog in sorted((root/'assets/heroes/forms').glob('*/aura.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'))
    art['formAuras'][catalog.parent.name]={**data,'src':compact_image(data['file']),**({'frontSrc':compact_image(data['front'])} if data.get('front') else {}),**({'cometSrc':compact_image(data['comet'])} if data.get('comet') else {}),**({'leafSrcs':[compact_image(f) for f in data['leaves']]} if data.get('leaves') else {})}
for catalog in sorted((root/'assets/heroes/forms').glob('*/forms.json')):
    data=json.loads(catalog.read_text(encoding='utf-8'));forms={}
    for form,entry in data['forms'].items():
        actions={name:{**sheet,'src':compact_image(sheet['file'])} for name,sheet in entry['actions'].items()}
        # Forms have no buff sheet of their own (cast stands in) and only Lumi floats (others run):
        # marked so the studio can tell a borrowed sheet from the hero's own.
        actions['buff']={**actions['cast'],'aliasOf':'cast'}
        if 'hover' not in actions:actions['hover']={**actions['run'],'aliasOf':'run'}
        rig_idle(actions['idle'],data['hero'],form);register_feet(actions['idle']);rig_buff(actions,data['hero'],form);forms[form]=actions
    art['heroForms'][data['hero']]=forms
# One body size in every form, measured by the head (assets/heroes/head-scale.json, head_scale.py):
# the head's share of the combat idle cell per form; combat scales each form's actor by form 1's / its own.
head_scale=json.loads((root/'assets/heroes/head-scale.json').read_text(encoding='utf-8'))['forms']
art['heroHead']={}
for name,entry in head_scale.items():
    hero,form=name.rsplit('-',1);combat=entry['combat']
    if hero=='shadow':continue  # Noct is locked as approved: he keeps his own form sizes
    # combatFit: a form drawn standing straighter than form 1 (same head, longer legs) would tower over
    # it; it shows that much smaller in combat (Mika form 2 upright: .9, still a little taller than form 1).
    art['heroHead'].setdefault(hero,{})[form]=round(combat['headPx']/combat['cellPx']/entry.get('combatFit',1),5)
for hero,character in art['heroes'].items():rig_idle(character['idle'],hero,'1')
# Every foe's rig folder beside its idle sheet (assets/gemwoven/rig_foes.py).
def foes_with_rigs():
    for family,folder in [('campaignCreatures','creatures'),('campaignCreatures','elites'),('bosses','boss-anim'),('worldBosses','boss-anim')]:
        for key,entry in art[family].items():
            if isinstance(entry,dict) and 'idle' in entry and (root/'assets/gemwoven'/folder/key/'rig').exists():yield entry,root/'assets/gemwoven'/folder/key/'rig'
for entry,path in foes_with_rigs():rig_idle(entry['idle'],path=path/'foe')
# A strike or recoil that holds the resting pose shows the rig's frame 1: the resting frame itself, at the rig's size
# (a redrawn foe rests on a 512/640px frame, assets/gemwoven/sharpen_foes.py), not the drawn 256px loop's first cell.
def rig_still(entry,path):
    idle=entry['idle']
    if not (path/'foe'/'rig.json').exists():return
    drawn=image(path.parent/'idle.webp')
    still={k:v for k,v in idle.items() if k!='fidgets'};still.update(count=1,heads=idle['heads'][:1])
    for name,sheet in list(entry.items()):
        if isinstance(sheet,dict) and sheet.get('src')==drawn and sheet.get('count')==1:
            entry[name]={**still,**({'scale':sheet['scale']} if 'scale' in sheet else {})}
for entry,path in foes_with_rigs():rig_still(entry,path)
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():register_feet(character['idle'])
for hero,character in art['heroes'].items():rig_buff(character,hero,'1')
for entry,path in foes_with_rigs():rig_buff(entry,path=path/'buff')
for retired in [k for k in art['campaignCreatures'] if k not in campaign_foes['foes']]:del art['campaignCreatures'][retired]
ELITE_POSES=['attack','skill','cast','hurt','defeat']
def creature_sheets():
    for entry in art['campaignCreatures'].values():yield from ([entry['idle'],entry['still'],*[entry[p] for p in ELITE_POSES if p in entry]] if 'idle' in entry else [entry])
for sheet in creature_sheets():register_feet(sheet)
for family in ['heroes','enemies','bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():register_span(sheet)
for forms in art['heroForms'].values():
    for actions in forms.values():
        for sheet in actions.values():register_span(sheet)
for sheet in creature_sheets():register_span(sheet)
# Alternative drawings stand and reach like the live ones (feet line, drawn height, horizontal span).
for looks in art['heroVariants'].values():
    for actions in looks.values():
        register_feet(actions['idle'])
        for sheet in actions.values():register_span(sheet)
for family in ['bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():
            # Every pose's feet (src/sprite-runtime.js spriteBox stands each pose on the idle's feet).
            if sheet.get('cols') and 'footY' not in sheet:register_feet(sheet)
# Where each boss pose stands against the resting pose: its first frame (the ready pose) is slid sideways,
# at its own scale and on the idle's feet line, until its silhouette covers the idle's best, and feetX
# becomes the point of the pose that lands on the idle's feet. A feet search alone is fooled by a tail
# lying over the hind feet; the silhouette is not. Airborne loops keep their own framing.
_anchor_cache={}
def frame_alpha(sheet,size):
    im=load_pil(sheet['src']).convert('RGBA');fw,fh=im.width//sheet['cols'],im.height//sheet['rows']
    return np.asarray(im.crop((0,0,fw,fh)).getchannel('A').resize((size,size)))>=128
def register_anchor(sheet,idle):
    key=(sheet['src'][-64:],len(sheet['src']),idle['src'][-64:],sheet.get('scale',1))
    if key not in _anchor_cache:
        N=128;k=sheet.get('scale') or 1;M=max(8,round(N*k));base=frame_alpha(idle,N);pose=frame_alpha(sheet,M)
        top=round(((idle.get('footY') or .94)-(sheet.get('footY') or .94)*k)*N)
        rows=[(y,y-top) for y in range(N) if 0<=y-top<M];best,at=-1,0
        if rows:
            a=base[[y for y,_ in rows]];b=pose[[v for _,v in rows]];total=a.sum()+b.sum()
            for x in range(-M+8,N-8):
                lo,hi=max(0,x),min(N,x+M);inter=(a[:,lo:hi]&b[:,lo-x:hi-x]).sum()
                score=inter/max(1,total-inter)
                if score>best:best,at=score,x
        _anchor_cache[key]=round(((idle.get('feetX') or .5)-at/N)/k,4)
    sheet['feetX']=_anchor_cache[key]
for family in ['bosses','worldBosses']:
    for character in art[family].values():
        for name,sheet in character.items():
            if name!='idle' and sheet.get('cols') and not sheet.get('airborne') and sheet is not character['idle']:register_anchor(sheet,character['idle'])
for entry in art['campaignCreatures'].values():
    for pose in ELITE_POSES:
        if pose in entry:register_anchor(entry[pose],entry['idle'])
    # A fall starts in no resting pose to compare: it stands where the others stand.
    if 'defeat' in entry and 'attack' in entry:entry['defeat']['feetX']=entry['attack']['feetX']
# Each boss pose's front point per frame (fractions of the cell): the leftmost opaque point above the
# legs, where a staff tip, sword tip, claw or open mouth reaches toward the hero. Spells leave from it
# (src/foe-skills.js foeAnchorNow); sheets with drawn mouth anchors (actions.json) keep those.
_front_cache={}
def register_front(sheet):
    key=sheet['src'][-64:]+str(len(sheet['src']))+str(sheet['cols'])+str(sheet['rows'])
    if key not in _front_cache:
        im=load_pil(sheet['src']).convert('RGBA');fw,fh=im.width//sheet['cols'],im.height//sheet['rows'];out=[];peak=1
        for i in range(min(sheet.get('count',1),sheet['cols']*sheet['rows'])):
            c,r=i%sheet['cols'],i//sheet['cols'];a=np.asarray(im.crop((c*fw,r*fh,(c+1)*fw,(r+1)*fh)).getchannel('A'))>=128
            ys,xs=np.where(a)
            if not len(xs):out.append([.5,.5]);continue
            top,bottom=ys.min(),ys.max();keep=ys<=top+(bottom-top)*.85;xs2,ys2=xs[keep],ys[keep];x0=xs2.min()
            out.append([round((x0+2)/fw,4),round(float(np.median(ys2[xs2<=x0+4]))/fh,4)])
            peak=min(peak,top/fh) if out[:-1] else top/fh
        _front_cache[key]=(out,round(peak,4))
    sheet['front'],sheet['peak']=_front_cache[key]
for family in ['bosses','worldBosses']:
    for character in art[family].values():
        for sheet in character.values():
            if sheet.get('cols') and sheet.get('src'):register_front(sheet)
for entry in art['campaignCreatures'].values():
    for pose in ELITE_POSES:
        if pose in entry:register_front(entry[pose])

html = (root / 'src/template.html').read_text(encoding='utf-8')
css = '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                for p in ['game.css', 'theme-v3.css', 'combat-v3.css', 'sprites.css', 'combo-v4.css', 'antique.css', 'combat-stage.css', 'adventure-effects.css', 'cinematic.css', 'restoration.css', 'scene-ambience.css', 'audio-settings.css', 'shadow-combat.css', 'hero-departures.css', 'gem-selection.css', 'cast-redesign.css', 'self-buffs.css', 'yuki-ultimate.css', 'mika-ultimate.css', 'foe-skills.css', 'summon-showcase.css'])
css += '\n'+(root/'src/progression-combat.css').read_text(encoding='utf-8')
css += '\n'+(root/'src/transform-fx.css').read_text(encoding='utf-8')
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
# The plaza (src/gemwoven/plaza.js) walks every hero in town: each form's resting loop and run (Lumi hovers),
# with the same feet line and head-based size as combat.
plaza_sprites={}
def plaza_sheet(sheet):return {k:sheet[k] for k in ('src','cols','rows','count','frameDuration','footY','bodyHeight','feetX','scale') if k in sheet}
for hero in art['heroes']:
    looks={'1':art['heroes'][hero],**art['heroForms'].get(hero,{})}
    for form,actions in looks.items():
        move=actions.get('hover') if hero=='lightning' else actions.get('run')
        plaza_sprites.setdefault(hero,{})[form]={'idle':plaza_sheet(actions['idle']),'move':plaza_sheet(move or actions['idle']),'head':art['heroHead'].get(hero,{}).get(form)}
(root/'assets/gemwoven/plaza/sprites.json').write_text(json.dumps(plaza_sprites,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
extensions = '\n'.join((root/f'src/gemwoven/{name}.js').read_text(encoding='utf-8') for name in ['boss-chapters','boss-tactics','world','progression'])+'\nconst ART_BLOBS=' + json.dumps(blobs, separators=(',', ':')) + ';\nconst ART=' + json.dumps(shared_art, separators=(',', ':')) + ';\n' + resolve_blobs
extensions += '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                        for p in ['audio-settings.js', 'hero-kits.js', 'sprite-runtime.js', 'combo-v4.js', 'opponent-ai.js', 'opponent-turn.js', 'board-sequence.js', 'combat-v3.js', 'live-combat.js', 'antique-trim.js', 'combat-stage.js', 'adventure-effects.js', 'noct-audio.js', 'recorded-voices.js', 'restoration.js', 'cinematic.js', 'scene-ambience.js', 'shadow-combat.js', 'hero-departures.js', 'cast-redesign.js', 'self-buffs.js', 'yuki-ultimate.js', 'mika-ultimate.js', 'foe-skills.js', 'summon-showcase.js'])
extensions += '\n'+(root/'src/progression-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/transform-fx.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/expedition-combat.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/gemwoven/form-effects.js').read_text(encoding='utf-8')
extensions += '\n'+(root/'src/hero-forms-combat.js').read_text(encoding='utf-8')
# Each hero's own form staging (hero-kits.js), after the shared form wrappers it builds on.
hero_kit_files=['forms-mika','forms-yuki','forms-nori','forms-lumi','forms-tan','forms-hiro','forms-noct']
extensions += '\n'+'\n'.join((root/f'src/{name}.js').read_text(encoding='utf-8') for name in hero_kit_files)
css += '\n'+'\n'.join((root/f'src/{name}.css').read_text(encoding='utf-8') for name in hero_kit_files)
# The combat HUD's drawn layer (src/combat-hud.js): last, so it wraps every other update and restyles the shared controls.
extensions += '\n'+(root/'src/combat-hud.js').read_text(encoding='utf-8')
css += '\n'+(root/'src/combat-hud.css').read_text(encoding='utf-8')
# Status icons over the fighters and PvP name plaques (src/combat-status.js): after the HUD, which it builds on.
extensions += '\n'+(root/'src/combat-status.js').read_text(encoding='utf-8')
css += '\n'+(root/'src/combat-status.css').read_text(encoding='utf-8')
# Dẫn Đường's coach in the guided stage-1 fight (src/combat-coach.js): after the HUD, read-only.
extensions += '\n'+(root/'src/combat-coach.js').read_text(encoding='utf-8')
css += '\n'+(root/'src/combat-coach.css').read_text(encoding='utf-8')
js = (root / 'src/game.js').read_text(encoding='utf-8').replace('/* GAME_EXTENSIONS */', extensions)
# Skill titles' face (Anton, OFL, subset to Latin and Vietnamese: assets/fonts/anton-vi.woff2)
css = "@font-face{font-family:'Gemwoven Title';src:url(data:font/woff2;base64,"+base64.b64encode((root/'assets/fonts/anton-vi.woff2').read_bytes()).decode()+") format('woff2');font-display:block}\n"+css
html = html.replace('/* GAME_CSS */', css).replace('/* GAME_JS */', js)
# Written whole and swapped in, so a page loading while another build runs never reads half a file.
(root / 'Game.html.tmp').write_text(html, encoding='utf-8'); os.replace(root / 'Game.html.tmp', root / 'Game.html')
print(f'Built Game.html ({len(html.encode("utf-8")):,} bytes).')
# The studio's sound library (tools/sound-library.html) lists every sound loaded above.
subprocess.run([sys.executable, str(root / 'scripts/build_sound_library.py')], check=True)
