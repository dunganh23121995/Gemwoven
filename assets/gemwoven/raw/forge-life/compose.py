"""Forge life (owner 08/11: the smith moves, the furnace burns, weapons and shields on the left wall): the processed
smith and fire frames (smith-proc, fire-proc from generate2dsprite.py) cropped to the union of their frames, so they
keep their alignment, and packed into runtime sheets; the plate (the forge painted without the smith, with the
weapon rack) becomes the forge background. hub-npcs.js plays the sheets where the smith and the fire stand."""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parents[3]
OUT = ROOT / 'assets/gemwoven/forge'


def despill(im):
    """The fire's flame edges kept a pink cast from the magenta key (owner 11/11): wherever blue rises over green the
    blue is pulled back under it, so those edges turn the flame's own red-orange."""
    import numpy as np
    a = np.asarray(im).astype(np.float32)
    g, b = a[..., 1], a[..., 2]
    a[..., 2] = np.where(b > g, g * .55, b)
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


def pack(folder, prefix, name, scale=1.0, clean=False):
    frames = [Image.open(HERE / folder / f'{prefix}-{i}.png').convert('RGBA') for i in range(1, 7)]
    if clean:
        frames = [despill(f) for f in frames]
    box = frames[0].getbbox()
    for f in frames[1:]:
        b = f.getbbox()
        box = (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    pad = 6
    box = (max(0, box[0] - pad), max(0, box[1] - pad), box[2] + pad, box[3] + pad)
    cells = [f.crop(box) for f in frames]
    w, h = cells[0].size
    w, h = round(w * scale), round(h * scale)
    sheet = Image.new('RGBA', (w * 3, h * 2))
    for i, c in enumerate(cells):
        sheet.paste(c.resize((w, h), Image.LANCZOS), ((i % 3) * w, (i // 3) * h))
    sheet.save(OUT / f'{name}.webp', quality=88, method=6)
    return w, h


print('smith', pack('smith-proc', 'idle', 'smith'))
print('fire', pack('fire-proc', 'fx', 'fire', .8, clean=True))
Image.open(HERE / 'plate-raw.png').convert('RGB').save(ROOT / 'assets/gemwoven/backgrounds/forge-calm.webp', quality=90, method=6)
