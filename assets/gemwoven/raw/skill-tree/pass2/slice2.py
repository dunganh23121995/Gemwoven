"""Second pass: cut the new Kỹ Năng pieces out of the keyed Codex sheets (pass2/proc-*/raw-sheet-clean.png).
Writes assets/gemwoven/skill-tree/*.webp and pass2/slice-meta.json; registration in painted-backgrounds.json is
done by register2.py so the shared manifest is only touched in one place."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = 'D:/Project/Gemwoven/'
RAW = ROOT + 'assets/gemwoven/raw/skill-tree/pass2/'
OUT = ROOT + 'assets/gemwoven/skill-tree/'
SHEETS = {
    'bough2': [('bough2', 920)],
    'sockets': [('socket', 360), ('select-ring', 380), ('gate-plate2', 440)],
    'panel2': [('tray-wide', 1000), ('next-card2', 560)],
}

def despill(c):
    a = np.array(c).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = ((r - g > 14) & (b - g > 14) & (al < 250)) | ((r - g > 40) & (b - g > 40))
    a[..., 0] = np.where(m, np.minimum(r, g + 8), r)
    a[..., 2] = np.where(m, np.minimum(b, g + 4), b)
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
    grouped, cur = [], []
    for s in rows:
        if cur and s[0].start - cur[0][0].start > 160: grouped.append(cur); cur = []
        cur.append(s)
    if cur: grouped.append(cur)
    order = [s for g in grouped for s in sorted(g, key=lambda s: s[1].start)]
    print(sheet, len(order), [(s[1].start, s[0].start, s[1].stop - s[1].start, s[0].stop - s[0].start) for s in order])
    if len(order) != len(names): sys.exit(f'{sheet}: expected {len(names)} pieces')
    for (name, side), s in zip(names, order):
        c = despill(im.crop((s[1].start, s[0].start, s[1].stop, s[0].stop)))
        c = c.crop(c.getbbox())
        if name == 'gate-plate2':
            # The sheet drew a padlock on the plate; the locked medallion frame already carries one, so keep the
            # brass bracket and drop the lock: cut from the first row as wide as the bracket.
            w = (np.array(c)[..., 3] > 60).sum(1)
            top = int(np.argmax(w > 130)) + 14
            c = c.crop((0, top, c.width, c.height))
            meta[name + '-cut'] = top
        k = side / max(c.size)
        if k < 1: c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)
        c.save(OUT + name + '.webp', quality=92, method=6)
        meta[name] = (c.width, c.height, round(k, 4), s[1].start, s[0].start)
        print(' ', name, c.size)
json.dump(meta, open(RAW + 'slice-meta.json', 'w'), indent=1)
print('ok')
