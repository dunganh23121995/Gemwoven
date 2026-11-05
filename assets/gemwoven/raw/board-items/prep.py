"""Cut the two board-item sheets (3x2 cells on flat magenta) into transparent pieces for assets/board-items/.
Key: distance from magenta with a soft ramp (keeps glow edges), then the magenta spill is removed from what stays."""
from pathlib import Path
import numpy as np
from PIL import Image

RAW = Path(__file__).resolve().parent
OUT = RAW.parents[2] / 'board-items'
NAMES = {'a': ['launcher', 'cage', 'fuse', 'core', 'core-ring', 'pop'],
         'b': ['ice-pip', 'ice-pip-empty', 'ice-crust', 'guard-arc', 'rage-burst', 'rage-comet']}
# Retired 05/11 (board FX v3, assets/gemwoven/raw/board-fx-v3/): the launcher, cage and fuse gave way to drawn light,
# the boss ice bar and the amber ward to status tiles. They are cut but not kept.
RETIRED = {'launcher', 'cage', 'fuse', 'ice-pip-empty', 'guard-arc'}


def key(cell):
    a = np.asarray(cell.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # how far from pure magenta (255,0,255); magenta-ish pixels have r and b high and g low
    mag = np.clip((np.minimum(r, b) - g) / 255, 0, 1)
    alpha = np.clip(1 - (mag - .35) / .45, 0, 1)
    # remove the magenta tint left in semi-transparent pixels
    spill = np.clip(np.minimum(r, b) - g, 0, None) * (1 - alpha)
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    out = np.dstack([a, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


from scipy import ndimage

for sheet, names in NAMES.items():
    full = key(Image.open(RAW / f'raw-sheet-{sheet}.png'))
    alpha = np.asarray(full.getchannel('A')) > 12
    # pieces are found as clusters (sparks merged into their piece), not by grid cell: a piece may cross a cell line
    labels, n = ndimage.label(ndimage.binary_dilation(alpha, iterations=18))
    boxes = sorted((s for s in ndimage.find_objects(labels)), key=lambda s: -((s[0].stop - s[0].start) * (s[1].stop - s[1].start)))[:len(names)]
    boxes.sort(key=lambda s: (round((s[0].start + s[0].stop) / 2 / (alpha.shape[0] / 2) - .5), (s[1].start + s[1].stop) / 2))
    for name, (ys, xs) in zip(names, boxes):
        piece = full.crop((max(0, xs.start - 4), max(0, ys.start - 4), xs.stop + 4, ys.stop + 4))
        if name in RETIRED:
            continue
        piece.save(OUT / f'{name}.webp', quality=92, method=6)
        print(name, piece.size)
