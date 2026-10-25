"""Package accepted ImageGen novice sprites and wearable overlays, without drawing art."""
from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw
from prepare_masters import despill_boundary

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/heroes/novice'
ART = ROOT / 'assets/gemwoven'
FLOOR = 244


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def main():
    actions = {}
    action_names = ('idle', 'attack', 'cast', 'hurt', 'run')
    contact = Image.new('RGB', (2048, len(action_names) * 280), '#233440')
    draw = ImageDraw.Draw(contact)
    for row, action in enumerate(action_names):
        source_action = 'attack' if action == 'hurt' else action
        source = BASE / source_action
        folder = BASE / action
        folder.mkdir(exist_ok=True)
        pipeline = json.loads((source / 'pipeline-meta.json').read_text())
        count, cols, rows = pipeline['rows'] * pipeline['cols'], pipeline['cols'], pipeline['rows']
        frames, heads, hashes = [], [], []
        atlas = Image.new('RGBA', (cols * 256, rows * 256))
        offset = round(FLOOR - pipeline['output_origin'][1])
        for i in range(count):
            original = despill_boundary(Image.open(source / f'{source_action}-{i+1}.png').convert('RGBA'))
            bbox = original.getchannel('A').getbbox()
            assert bbox and bbox[3] + offset < 255
            frame = Image.new('RGBA', (256, 256))
            frame.alpha_composite(original, (0, offset))
            mask = np.asarray(frame)[:, :, 3] > 160
            y = int(np.flatnonzero(mask[:, 90:176].sum(axis=1) >= 8)[0])
            _, xs = np.nonzero(mask[y:y+12, 90:176])
            head = [int(np.median(xs) + 90), y]
            heads.append(head)
            hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
            frames.append(frame)
            frame.save(folder / f'frame-{i:02}.png', optimize=True)
            atlas.alpha_composite(frame, ((i % cols) * 256, (i // cols) * 256))
            contact.paste(frame, (i * 256, row * 280 + 24), frame)
            draw.text((i * 256 + 8, row * 280 + 6), f'{action} {i}', fill='#f8e5b8')
            x0, y0 = i * 256 + head[0], row * 280 + 24 + head[1]
            draw.ellipse((x0-2, y0-2, x0+2, y0+2), fill='#ffcf66')
        duration = {'idle': 220, 'attack': 110, 'cast': 150, 'hurt': 90, 'run': 100}[action]
        atlas.save(folder / 'sheet-transparent.png', optimize=True)
        atlas.save(folder / 'sheet-transparent.webp', lossless=True, method=6, exact=True)
        atlas.save(BASE / f'{action}.webp', lossless=True, method=6, exact=True)
        frames[0].save(folder / 'animation.gif', save_all=True, append_images=frames[1:], duration=duration, loop=0, disposal=2)
        meta = dict(hero='novice', action=action, accepted=True, atlas=f'{action}.webp',
                    frameWidth=256, frameHeight=256, columns=cols, rows=rows, frames=count,
                    count=count, cols=cols, frameOrder='row-major', loop=action in ('idle', 'run'),
                    frameDuration=duration, origin=[128, FLOOR], headAnchors=heads,
                    frameFiles=[f'{action}/frame-{i:02}.png' for i in range(count)],
                    floorAligned=True, presentationTranslation=[0, offset],
                    sharedScaleProfile='character-scale-profile.json',
                    source=f'assets/gemwoven/raw/novice-{source_action}.png',
                    qc=pipeline['qc_summary'], uniqueFrames=len(set(hashes)), framePixelHashes=hashes)
        if action == 'hurt':
            meta['fallbackOf'] = 'attack'
            meta['note'] = 'Explicit fallback reuse of attack poses; runtime may apply recoil translation/tint.'
            shutil.copyfile(source / 'pipeline-meta.json', folder / 'pipeline-meta.json')
        write_json(folder / 'runtime-meta.json', meta)
        actions[action] = meta
    write_json(BASE / 'meta.json', dict(hero='novice', name='Hiro', cellSize=256, actions=actions))
    contact.save(BASE / 'contact-sheet.jpg', quality=95)

    master = despill_boundary(Image.open(BASE / 'references/master.png').convert('RGBA'))
    bbox = master.getchannel('A').getbbox()
    hero = master.crop((bbox[0]-6, bbox[1]-6, bbox[2]+6, bbox[3]+6))
    hero.save(ART / 'items/hero-novice.png', optimize=True)
    portrait = master.crop((225, 38, 440, 300))
    portrait.thumbnail((256, 256), Image.Resampling.LANCZOS)
    portrait.save(ART / 'items/portrait-novice.png', optimize=True)

    raw = Image.open(ART / 'raw/evolution-overlays.png').convert('RGBA')
    regions = {
        'evo-shoulders': (0, 70, 526, 430),
        'evo-gloves': (540, 70, 1010, 445),
        'evo-boots': (50, 480, 530, 970),
        'evo-weapon': (565, 480, 1010, 977),
        'evo-crest': (40, 1040, 500, 1390),
        'evo-aura': (520, 970, 1024, 1510),
    }
    items = {}
    for name, box in regions.items():
        piece = raw.crop(box)
        # Preserve the ImageGen alpha, including translucent aura details.
        a = np.asarray(piece.getchannel('A'))
        ys, xs = np.nonzero(a > 3)
        bounds = (max(0, int(xs.min())-3), max(0, int(ys.min())-3), min(piece.width, int(xs.max())+4), min(piece.height, int(ys.max())+4))
        piece = piece.crop(bounds)
        padded = Image.new('RGBA', (piece.width+12, piece.height+12))
        padded.alpha_composite(piece, (6, 6))
        padded.save(ART / 'items' / f'{name}.png', optimize=True)
        items[name] = dict(file=f'assets/gemwoven/items/{name}.png', width=padded.width, height=padded.height, source='raw/evolution-overlays.png', crop=list(box), textless=True)
    for name in ('hero-novice', 'portrait-novice'):
        im = Image.open(ART / 'items' / f'{name}.png')
        items[name] = dict(file=f'assets/gemwoven/items/{name}.png', width=im.width, height=im.height, source='raw/novice-idle.png', textless=True)
    write_json(ART / 'novice-items.json', items)
    print(json.dumps({'actions': {k: {'frames':v['frames'], 'columns':v['columns'], 'rows':v['rows'], 'qc':v['qc']} for k,v in actions.items()}}, indent=2))


if __name__ == '__main__':
    main()
