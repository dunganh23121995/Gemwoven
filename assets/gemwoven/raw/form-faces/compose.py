"""Round avatars for forms 2 and 3 (owner 08/11: "mỗi form 1 background"): each form's approved portrait
(assets/heroes/forms/<hero>/form-N/portrait.png, untouched) over its own painted background (raw-sheet.png in <hero>/, left
circle form 2, right circle form 3), cut to the circle of the form-1 face-<hero> avatars. Output:
assets/gemwoven/atlas/ui/face-<hero>-<form>.webp (256 x 256)."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
OUT = REPO / 'assets/gemwoven/atlas/ui'
S = 256
ring = Image.new('L', (S * 4, S * 4), 0)
ImageDraw.Draw(ring).ellipse((6, 6, S * 4 - 7, S * 4 - 7), fill=255)
ring = ring.resize((S, S), Image.LANCZOS)
ZOOM = {('fire', 3): (1.38, .12), ('lightning', 3): (1.12, .2), ('fire', 2): (1.15, .08), ('ice', 2): (1.25, .1), ('ice', 3): (1.15, .1), ('earth', 2): (1.25, .08), ('lightning', 2): (1.2, .1)}   # (scale, how far down the crop starts)
for hero in ['novice', 'fire', 'ice', 'earth', 'lightning', 'shadow']:
    a = np.array(Image.open(HERE / hero / 'raw-sheet.png').convert('RGBA'))
    rgb = a[..., :3].astype(int)
    a[(rgb[..., 0] > 200) & (rgb[..., 1] < 90) & (rgb[..., 2] > 200)] = 0   # magenta key
    a[a[..., 3] < 40] = 0
    lab, _ = ndimage.label(ndimage.binary_opening(a[..., 3] > 0, iterations=2))
    boxes = sorted([b for b in ndimage.find_objects(lab) if (b[0].stop - b[0].start) > 200], key=lambda b: b[1].start)
    assert len(boxes) == 2, (hero, len(boxes))
    for form, box in zip((2, 3), boxes):
        bg = Image.fromarray(a[box])
        # Inset a little so the drawn circle's own soft edge never shows, then cover the square.
        w, h = bg.size
        side = int(min(w, h) * .9)
        bg = bg.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2)).resize((S, S), Image.LANCZOS)
        face = Image.new('RGBA', (S, S))
        face.alpha_composite(bg.convert('RGBA'))
        # A few portraits are drawn wider (Mika 3 with her nine tails): zoomed toward the face so every avatar reads the same size.
        zoom, top = ZOOM.get((hero, form), (1, 0))
        z = round(S * zoom)
        pic = Image.open(REPO / f'assets/heroes/forms/{hero}/form-{form}/portrait.png').convert('RGBA').resize((z, z), Image.LANCZOS)
        face.alpha_composite(pic.crop(((z - S) // 2, round((z - S) * top), (z - S) // 2 + S, round((z - S) * top) + S)))
        face.putalpha(Image.fromarray(np.minimum(np.array(face.getchannel('A')), np.array(ring))))
        face.save(OUT / f'face-{hero}-{form}.webp', 'WEBP', quality=90, alpha_quality=90, method=6)
        print(hero, form)
