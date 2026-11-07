"""Pack the redrawn basic-attack hit effects (owner 07/11, assets/gemwoven/raw/basic-fx-2611) into runtime strips.

Each <name>/raw-sheet.png (2x2 cells on #FF00FF) is keyed with the fire set's soft matte and packed into a
4-frame strip <name>.webp; fx.json (read by build.py as ART.heroFx.basic.<name>) records frames and timing.
src/basic-fx.js plays them.
"""
import json
import sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'fire')); from export_fx import key_out
FX = {name: (512, ms) for name, ms in [('mika1', 50), ('mika2', 55), ('yuki1', 55), ('yuki2', 60), ('yuki3', 75), ('nori1', 60),
                                       ('nori2', 60), ('nori3', 65), ('lumi1orb', 55), ('lumi1pop', 60)]}
meta = {}
for name, (out, ms) in FX.items():
    raw = key_out(Image.open(ROOT / name / 'raw-sheet.png')); cw, ch = raw.width / 2, raw.height / 2
    strip = Image.new('RGBA', (out * 4, out), (0, 0, 0, 0))
    for i in range(4):
        c, r = i % 2, i // 2
        cell = raw.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))).resize((out, out), Image.Resampling.LANCZOS)
        strip.alpha_composite(cell, (out * i, 0))
    strip.save(ROOT / f'{name}.webp', 'WEBP', quality=92, alpha_quality=95, method=6)
    meta[name] = {'file': f'assets/fx/heroes/basic/{name}.webp', 'count': 4, 'frameDuration': ms, 'width': out, 'height': out}
    print('[ok]', name)
(ROOT / 'fx.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
