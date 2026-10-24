"""Pack Yuki's form 2/3 skill FX (src/forms-yuki.js) into runtime strips.

Input: <name>/raw-sheet.png, the untouched Codex image_gen sheet (solid #FF00FF background).
The generate2dsprite processor keys out the magenta; a despill pass then fades the pink fringe
(the FX are white, silver and ice blue, so red is never allowed above green). Every frame of a
sheet is cut with ONE shared box (the union of all frames) so a sequence keeps its own motion and
ground line, then the whole sheet is scaled uniformly to the runtime cell.
Output: <name>.webp horizontal strips and fx.json (read by build.py as ART.heroFx.ice).
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
PROCESSOR = Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py'
spec = importlib.util.spec_from_file_location('generate2dsprite', PROCESSOR)
g2d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g2d)

# name: (cols, rows, frames, runtime cell height, ms per frame, frame whose lowest pixel is the ground line or None)
FX = {
    'moon': (2, 2, 4, 256, 120, None),
    'beam': (4, 1, 4, 512, 70, 1),
    'seal': (4, 2, 8, 384, 80, 3),
    'bolt': (2, 2, 4, 160, 60, None),
    'crescent': (3, 2, 6, 320, 55, None),
    'lotus': (4, 2, 8, 384, 90, 2),
    'fan': (3, 2, 6, 320, 60, None),
    'aegis': (3, 2, 6, 384, 110, None),
}


def despill(frame):
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    a[..., 3] *= 1 - np.clip((spill - 10) / 50, 0, 1)
    a[..., 0] = np.minimum(r, g)
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


meta = {}
for name, (cols, rows, count, cell_h, duration, ground) in FX.items():
    raw = Image.open(ROOT / name / 'raw-sheet.png').convert('RGBA')
    clean = despill(g2d.remove_bg_magenta(raw.copy(), 100, 150))
    cw, ch = raw.width // cols, raw.height // rows
    frames = [clean.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)) for i in range(count)]
    boxes = [f.getchannel('A').point(lambda v: 255 if v >= 24 else 0).getbbox() for f in frames]
    box = [min(b[0] for b in boxes if b), min(b[1] for b in boxes if b), max(b[2] for b in boxes if b), max(b[3] for b in boxes if b)]
    pad = round(max(box[2] - box[0], box[3] - box[1]) * .02)
    box = [max(0, box[0] - pad), max(0, box[1] - pad), min(cw, box[2] + pad), min(ch, box[3] + pad)]
    scale = cell_h / (box[3] - box[1])
    out_w, out_h = round((box[2] - box[0]) * scale), cell_h
    strip = Image.new('RGBA', (out_w * count, out_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(f.crop(box).resize((out_w, out_h), Image.Resampling.LANCZOS), (out_w * i, 0))
    strip.save(ROOT / f'{name}.webp', 'WEBP', quality=88, alpha_quality=90, method=6)
    entry = {'file': f'assets/fx/heroes/ice/{name}.webp', 'count': count, 'frameDuration': duration, 'aspect': round(out_w / out_h, 4)}
    if ground is not None:  # ground line as a share of the cell height, measured on the drawn frame
        entry['foot'] = round((boxes[ground][3] - box[1]) / (box[3] - box[1]), 4)
    meta[name] = entry
    print('[ok]', name, entry)
(ROOT / 'fx.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
