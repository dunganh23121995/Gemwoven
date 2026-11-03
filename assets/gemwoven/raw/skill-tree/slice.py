"""Cut the Kỹ Năng tree pieces out of the keyed Codex sheets (proc-*/raw-sheet-clean.png) into assets/gemwoven/skill-tree."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = 'D:/Project/Gemwoven/'
RAW = ROOT + 'assets/gemwoven/raw/skill-tree/'
OUT = ROOT + 'assets/gemwoven/skill-tree/'
# Pieces per sheet in reading order (rows top to bottom, left to right) and the longest side kept.
SHEETS = {
    'frames': [('frame-learned', 320), ('frame-selected', 320), ('frame-locked', 320), ('pointer', 120), ('sprout', 100)],
    'plates': [('rank-plate', 360), ('gate-plate', 400), ('bud', 240), ('ribbon', 440)],
    'panel': [('tray', 840), ('next-card', 560), ('header-tag', 400), ('category-plate', 400)],
    'bough': [('bough', 900)],
    'button': [('button-ready', 700), ('button-locked', 700)],
}

def despill(c):
    a = np.array(c).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (r - g > 14) & (b - g > 14) & (al < 250)
    a[..., 0] = np.where(m, np.minimum(r, g + 8), r)
    a[..., 2] = np.where(m, np.minimum(b, g + 4), b)
    # Hard magenta left inside (frame openings): drop it.
    hard = (r > 200) & (b > 200) & (g < 90)
    a[..., 3] = np.where(hard, 0, a[..., 3])
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')

meta = {}
for sheet, names in SHEETS.items():
    im = Image.open(RAW + f'proc-{sheet}/raw-sheet-clean.png').convert('RGBA')
    al = np.array(im)[..., 3] > 24
    lab, n = ndimage.label(ndimage.binary_dilation(al, iterations=12))
    boxes = [s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 2500]
    rows = sorted(boxes, key=lambda s: s[0].start)
    # group by row: start within 120 px of the row's first piece
    grouped, cur = [], []
    for s in rows:
        if cur and s[0].start - cur[0][0].start > 160: grouped.append(cur); cur = []
        cur.append(s)
    if cur: grouped.append(cur)
    order = [s for g in grouped for s in sorted(g, key=lambda s: s[1].start)]
    print(sheet, len(order), [(s[1].start, s[0].start, s[1].stop - s[1].start, s[0].stop - s[0].start) for s in order])
    if len(order) != len(names): sys.exit(f'{sheet}: expected {len(names)} pieces')
    shared = None
    for (name, side), s in zip(names, order):
        c = despill(im.crop((s[1].start, s[0].start, s[1].stop, s[0].stop)))
        c = c.crop(c.getbbox())
        k = side / max(c.size)
        # The three medallion frames share one scale so their rings match (the padlock makes one taller).
        if name.startswith('frame-'):
            shared = shared or side / c.width
            k = shared
        if k < 1: c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)
        c.save(OUT + name + '.webp', quality=92, method=6)
        meta[name] = (c.width, c.height, round(k, 4), s[1].start, s[0].start)
        print(' ', name, c.size)
json.dump(meta, open(RAW + 'slice-meta.json', 'w'), indent=1)
p = ROOT + 'assets/gemwoven/painted-backgrounds.json'
m = json.load(open(p, encoding='utf-8'))
for name, (w, h, *_ ) in meta.items():
    m['skilltree-' + name] = {'file': f'assets/gemwoven/skill-tree/{name}.webp', 'width': w, 'height': h, 'textless': True,
                              'source': 'assets/gemwoven/raw/skill-tree/', 'purpose': 'Kỹ Năng tree pieces drawn by Codex from the approved mockup (skill-tree.js).'}
json.dump(m, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok')
