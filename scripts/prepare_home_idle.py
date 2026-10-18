"""Package existing combat idle frames for Home; preserve their shared anchor."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/gemwoven'
manifest_path = ART / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for hero in ['novice', 'fire', 'ice', 'earth', 'lightning', 'shadow']:
    sources = sorted((ROOT / 'assets/heroes' / hero / 'idle').glob('frame-*.png'))
    frames = [Image.open(p).convert('RGBA') for p in sources]
    assert len(frames) == 4, hero
    bounds = [im.getchannel('A').getbbox() for im in frames]
    # One union crop for every frame: never resize individual poses independently.
    crop = (min(b[0] for b in bounds)-3, min(b[1] for b in bounds)-3,
            max(b[2] for b in bounds)+3, max(b[3] for b in bounds)+3)
    frames = [im.crop(crop) for im in frames]
    order = [0, 1, 2, 3, 2, 1]
    sequence = [frames[i] for i in order]
    name = f'home-idle-{hero}'
    sequence[0].save(ART / 'items' / f'{name}.webp', save_all=True,
                     append_images=sequence[1:], duration=240, loop=0,
                     lossless=True, method=6)
    frames[0].save(ART / 'items' / f'{name}-poster.webp', lossless=True, method=6)
    shared = dict(width=frames[0].width, height=frames[0].height, transparent=True,
                  sources=[p.relative_to(ROOT).as_posix() for p in sources], crop=list(crop))
    manifest[name] = dict(shared, file=f'assets/gemwoven/items/{name}.webp',
                          frameOrder=order, frameDuration=240, loop=True)
    manifest[name+'-poster'] = dict(shared, file=f'assets/gemwoven/items/{name}-poster.webp')
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Packaged six anchored Home idle animations and reduced-motion posters.')
