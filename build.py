"""Embed game code and all production art into an offline portrait game."""
from pathlib import Path
import base64
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parent
draft = '--draft' in sys.argv
keys = ['fire', 'earth', 'ice', 'lightning']


def image(path):
    p = root / path
    mime = 'image/webp' if p.suffix == '.webp' else 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode('ascii')


def atlas(path, cols, rows, count, fallback):
    if not (root / path).exists():
        if not draft:
            raise FileNotFoundError(path)
        return {'src': image(fallback), 'cols': 1, 'rows': 1, 'count': 1}
    return {'src': image(path), 'cols': cols, 'rows': rows, 'count': count}


art = {'heroes': {}, 'enemies': {}, 'items': {}, 'landscape': image('assets/landscape.webp')}
art['skillFx'] = {'yukiBoulder': image('assets/fx/yuki/boulder.webp'), 'mikaBlade': image('assets/fx/mika/blade.webp'), 'mikaWave': image('assets/fx/mika/wave.webp'), 'mikaExplosion': image('assets/fx/mika/explosion.webp')}
art['scenes'] = {key: image(f'assets/scenes/{key}.webp') for key in keys}
art['parallax'] = {key: [image(f'assets/scenes/{key}-{layer}.webp') for layer in ['far', 'mid', 'near']] for key in keys}
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

html = (root / 'src/template.html').read_text(encoding='utf-8')
css = '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                for p in ['game.css', 'theme-v3.css', 'combat-v3.css', 'sprites.css', 'combo-v4.css', 'antique.css', 'combat-stage.css', 'adventure-effects.css', 'cinematic.css', 'restoration.css', 'scene-ambience.css', 'audio-settings.css', 'shadow-combat.css', 'gem-selection.css', 'cast-redesign.css', 'self-buffs.css', 'yuki-ultimate.css', 'mika-ultimate.css'])
extensions = 'const ART=' + json.dumps(art, separators=(',', ':')) + ';\n'
extensions += '\n'.join((root / f'src/{p}').read_text(encoding='utf-8')
                        for p in ['audio-settings.js', 'sprite-runtime.js', 'combo-v4.js', 'opponent-ai.js', 'opponent-turn.js', 'board-sequence.js', 'combat-v3.js', 'live-combat.js', 'antique-trim.js', 'combat-stage.js', 'adventure-effects.js', 'noct-audio.js', 'recorded-voices.js', 'restoration.js', 'cinematic.js', 'scene-ambience.js', 'shadow-combat.js', 'cast-redesign.js', 'self-buffs.js', 'yuki-ultimate.js', 'mika-ultimate.js'])
js = (root / 'src/game.js').read_text(encoding='utf-8').replace('/* GAME_EXTENSIONS */', extensions)
html = html.replace('/* GAME_CSS */', css).replace('/* GAME_JS */', js)
(root / 'Game.html').write_text(html, encoding='utf-8')
print(f'Built Game.html ({len(html.encode("utf-8")):,} bytes).')
