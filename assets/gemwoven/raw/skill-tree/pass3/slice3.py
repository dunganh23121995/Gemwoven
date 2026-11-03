"""Third pass (growing tree): cut the scroll cues and the leafy crown tip out of the keyed Codex sheet
(pass3/proc-pieces/raw-sheet-clean.png), write assets/gemwoven/skill-tree/{cue-up,cue-down,crown-leaves}.webp and
register them in assets/gemwoven/painted-backgrounds.json."""
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = 'D:/Project/Gemwoven/'
RAW = ROOT + 'assets/gemwoven/raw/skill-tree/pass3/'
OUT = ROOT + 'assets/gemwoven/skill-tree/'
NAMES = [('cue-up', 200), ('cue-down', 200), ('crown-leaves', 400)]


def despill(c):
    a = np.array(c).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = ((r - g > 14) & (b - g > 14) & (al < 250)) | ((r - g > 40) & (b - g > 40))
    a[..., 0] = np.where(m, np.minimum(r, g + 8), r)
    a[..., 2] = np.where(m, np.minimum(b, g + 4), b)
    hard = (r > 200) & (b > 200) & (g < 90)
    a[..., 3] = np.where(hard, 0, a[..., 3])
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


im = Image.open(RAW + 'proc-pieces/raw-sheet-clean.png').convert('RGBA')
al = np.array(im)[..., 3] > 24
lab, n = ndimage.label(ndimage.binary_dilation(al, iterations=12))
boxes = sorted([s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 2500],
               key=lambda s: s[1].start)
assert len(boxes) == len(NAMES), [(s[1].start, s[0].start) for s in boxes]
meta = {}
reg = json.load(open(ROOT + 'assets/gemwoven/painted-backgrounds.json', encoding='utf-8'))
for (name, side), s in zip(NAMES, boxes):
    c = despill(im.crop((s[1].start, s[0].start, s[1].stop, s[0].stop)))
    c = c.crop(c.getbbox())
    k = side / max(c.size)
    if k < 1:
        c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)
    c.save(OUT + name + '.webp', quality=92, method=6)
    meta[name] = (c.width, c.height, round(k, 4), s[1].start, s[0].start)
    reg['skilltree-' + name] = {'file': f'assets/gemwoven/skill-tree/{name}.webp', 'width': c.width, 'height': c.height,
                                'textless': True, 'source': 'assets/gemwoven/raw/skill-tree/pass3/pieces-raw.png',
                                'purpose': 'Kỹ Năng pass 3 (growing tree): scroll cues and the leafy tip over a free crown pad (skill-tree.js).'}
    print(name, c.size)
json.dump(meta, open(RAW + 'slice-meta.json', 'w'), indent=1)
json.dump(reg, open(ROOT + 'assets/gemwoven/painted-backgrounds.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok')
