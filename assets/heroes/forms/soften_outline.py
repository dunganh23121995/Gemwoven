"""Softens the heavy black contour some redrawn hero sheets carry (owner 08/11: Mika form 3 "có viền đen, nét vẽ đen" when
she runs and in the summon entrance, against her soft-edged resting frame).

The sharp pass asked Codex for "clean sharp dark outlines", and a few sheets came back with a black sticker line round the
whole figure that the resting frames (and the rest of each sheet's hero) do not have. Only that outer line changes: a dark
pixel in the outermost band of the silhouette takes the colour of the nearest lit pixel just inside it, kept a little
darker so the figure still has the soft contour its resting frame has. Pixels that are dark for a reason (black boots,
gloves, a dark cloak) have no lit pixel near them and stay as drawn. The band's width is measured per sheet (the line's
thickness in that sheet's pixels). How far each sheet is softened is set by its form's resting frame: the share of near-black pixels round the silhouette is
brought to the resting frame's (a resting frame with a light contour of its own keeps that much on its sheets too). Raw
drawings keep their outlines: a sheet rebuilt from a raw goes through this again.

  python assets/heroes/forms/soften_outline.py <sheet.webp> <cols> <rows> <rest.webp> <cols> <rows> [out.webp]
  python assets/heroes/forms/soften_outline.py apply          # every sheet in SHEETS
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
DARK = .26          # luminance of the drawn contour line
KEEP = .85          # the softened contour keeps this much of the lit colour's brightness
# (sheet, cols, rows, resting sheet, cols, rows): the sheets the sweep of 08/11 measured with a darker outer line than their
# form's resting frame. Mika form 3 (owner's report) first, then Yuki 1-3 and Mika 1 (milder), then every hero sheet (combat
# and hub, entrances too) still darker at the rim than its resting frame by more than .06; Noct (locked, dark by design) is left.
# sheets whose weapons, flames or hair tips still read heavier at the matched level (Codex 08/11): one step lighter
LIGHTER = {p: .8 for p in [
    'assets/heroes/forms/fire/form-1/showcase/entrance.webp', 'assets/heroes/forms/earth/form-2/showcase/entrance.webp',
    'assets/heroes/forms/earth/form-2/showcase/shieldtap.webp', 'assets/heroes/forms/earth/form-2/showcase/leafsprout.webp',
    'assets/heroes/forms/lightning/form-3/hover.webp', 'assets/heroes/forms/lightning/form-3/attack.webp',
    'assets/heroes/forms/lightning/form-3/ride.webp']}
SHEETS = [
    ('assets/heroes/forms/fire/form-3/run.webp', 3, 2, 'assets/heroes/forms/fire/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/fire/form-3/cast.webp', 3, 2, 'assets/heroes/forms/fire/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/fire/form-3/skill.webp', 3, 2, 'assets/heroes/forms/fire/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/fire/form-3/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/fire/form-3/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/fire/form-3/showcase/glaivespin.webp', 2, 4, 'assets/heroes/forms/fire/form-3/showcase/idle.webp', 2, 4),
    ('assets/reimagined/heroes/fire/attack.webp', 3, 2, 'assets/heroes/forms/fire/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/fire/cast.webp', 3, 2, 'assets/heroes/forms/fire/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/fire/hurt.webp', 3, 2, 'assets/heroes/forms/fire/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/fire/run.webp', 3, 2, 'assets/heroes/forms/fire/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/fire/smash.webp', 3, 2, 'assets/heroes/forms/fire/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/fire/form-1/showcase/foxgrin.webp', 2, 4, 'assets/heroes/forms/fire/form-1/showcase/idle.webp', 2, 4),
    ('assets/reimagined/heroes/ice/attack.webp', 3, 2, 'assets/heroes/forms/ice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/ice/cast.webp', 3, 2, 'assets/heroes/forms/ice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/ice/hurt.webp', 3, 2, 'assets/heroes/forms/ice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/ice/run.webp', 3, 2, 'assets/heroes/forms/ice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-2/attack.webp', 3, 2, 'assets/heroes/forms/ice/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-2/run.webp', 3, 2, 'assets/heroes/forms/ice/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-2/skill.webp', 3, 2, 'assets/heroes/forms/ice/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-2/showcase/moonglow.webp', 2, 4, 'assets/heroes/forms/ice/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/ice/form-3/run.webp', 3, 2, 'assets/heroes/forms/ice/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-3/cast.webp', 3, 2, 'assets/heroes/forms/ice/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-3/skill.webp', 3, 2, 'assets/heroes/forms/ice/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/fire/form-1/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/fire/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/ice/form-2/cast.webp', 3, 2, 'assets/heroes/forms/ice/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/ice/form-2/showcase/brushfrost.webp', 2, 4, 'assets/heroes/forms/ice/form-2/showcase/idle.webp', 2, 4),
    ('assets/reimagined/heroes/earth/attack.webp', 3, 2, 'assets/heroes/forms/earth/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/earth/cast.webp', 3, 2, 'assets/heroes/forms/earth/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/earth/hurt.webp', 3, 2, 'assets/heroes/forms/earth/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/earth/run.webp', 3, 2, 'assets/heroes/forms/earth/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/reimagined/heroes/earth/smash.webp', 3, 2, 'assets/heroes/forms/earth/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-1/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/earth/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-1/showcase/neckroll.webp', 2, 4, 'assets/heroes/forms/earth/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-1/showcase/shieldslam.webp', 2, 4, 'assets/heroes/forms/earth/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-2/attack.webp', 3, 2, 'assets/heroes/forms/earth/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-2/cast.webp', 3, 2, 'assets/heroes/forms/earth/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-2/run.webp', 3, 2, 'assets/heroes/forms/earth/form-2/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-2/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/earth/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-2/showcase/leafsprout.webp', 2, 4, 'assets/heroes/forms/earth/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-2/showcase/shieldtap.webp', 2, 4, 'assets/heroes/forms/earth/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-3/attack.webp', 3, 2, 'assets/heroes/forms/earth/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-3/cast.webp', 3, 2, 'assets/heroes/forms/earth/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-3/run.webp', 3, 2, 'assets/heroes/forms/earth/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/earth/form-3/showcase/bloom.webp', 2, 4, 'assets/heroes/forms/earth/form-3/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-3/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/earth/form-3/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/earth/form-3/showcase/shieldbloom.webp', 2, 4, 'assets/heroes/forms/earth/form-3/showcase/idle.webp', 2, 4),
    ('assets/reimagined/heroes/lightning/hurt.webp', 3, 2, 'assets/heroes/forms/lightning/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/lightning/form-2/showcase/startoss.webp', 2, 4, 'assets/heroes/forms/lightning/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/lightning/form-2/showcase/zigzag.webp', 2, 4, 'assets/heroes/forms/lightning/form-2/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/lightning/form-3/attack.webp', 3, 2, 'assets/heroes/forms/lightning/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/lightning/form-3/hover.webp', 3, 2, 'assets/heroes/forms/lightning/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/lightning/form-3/ride.webp', 3, 2, 'assets/heroes/forms/lightning/form-3/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/lightning/form-3/showcase/orbitspin.webp', 2, 4, 'assets/heroes/forms/lightning/form-3/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/lightning/form-3/showcase/wingtwirl.webp', 2, 4, 'assets/heroes/forms/lightning/form-3/showcase/idle.webp', 2, 4),
    ('assets/heroes/novice/attack.webp', 3, 2, 'assets/heroes/forms/novice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/novice/cast.webp', 3, 2, 'assets/heroes/forms/novice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/novice/hurt.webp', 3, 2, 'assets/heroes/forms/novice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/novice/skill.webp', 3, 2, 'assets/heroes/forms/novice/form-1/rig/combat/idle.webp', 6, 4),
    ('assets/heroes/forms/novice/form-1/showcase/scratch.webp', 2, 4, 'assets/heroes/forms/novice/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/lightning/form-1/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/lightning/form-1/showcase/idle.webp', 2, 4),
    ('assets/heroes/forms/ice/form-2/showcase/entrance.webp', 2, 4, 'assets/heroes/forms/ice/form-2/showcase/idle.webp', 2, 4),
]


def lum(rgb):
    return rgb[..., 0] * .299 + rgb[..., 1] * .587 + rgb[..., 2] * .114


def line_width(a):
    """Median thickness of the dark line along the silhouette, in pixels (0 when there is none)."""
    m = a[..., 3] > .5
    dist = ndimage.distance_transform_edt(m)
    dark = m & (lum(a[..., :3]) < DARK)
    edge = m & (dist <= 1.5)
    if not edge.any() or dark[edge].mean() < .25:
        return 0
    # inward run of dark pixels from each edge pixel ~ the deepest dark rim pixel near it
    depth = np.where(dark & (dist <= 12), dist, 0)
    near = ndimage.maximum_filter(depth, size=7)
    return float(np.median(near[edge & dark]))


def soften(cell):
    a = np.asarray(cell).astype(np.float32) / 255
    w = line_width(a)
    if w < 1:
        return cell, 0
    band = w + 2.5
    seen = a[..., 3] > .02
    dist = ndimage.distance_transform_edt(seen)
    rgb = a[..., :3]
    L = lum(rgb)
    lit = (a[..., 3] > .6) & (L >= .35) & (dist > 2)
    d_lit, (iy, ix) = ndimage.distance_transform_edt(~lit, return_indices=True)
    # the lit colour round each contour pixel, averaged so the new edge is as smooth as a drawn one
    sig = max(1., band / 2)
    weight = ndimage.gaussian_filter(lit.astype(np.float32), sig)
    smooth = np.stack([ndimage.gaussian_filter(rgb[..., c] * lit, sig) for c in range(3)], -1) / np.maximum(weight, 1e-4)[..., None]
    near = np.where((weight > .05)[..., None], smooth, rgb[iy, ix])
    # a contour pixel: in the outer band and clearly darker than the lit drawing just inside it
    take = seen & (dist <= band) & (d_lit <= band + 3) & (L < lum(near) * .8)
    out = a.copy()
    out[..., :3][take] = near[take] * KEEP
    return Image.fromarray((out * 255 + .5).clip(0, 255).astype('uint8'), 'RGBA'), float(take.mean())


def grid(im, cols, rows):
    w, h = im.width // cols, im.height // rows
    return [((i % cols) * w, (i // cols) * h, (i % cols + 1) * w, (i // cols + 1) * h) for i in range(cols * rows)]


def dark_rim(im):
    """Share of near-black pixels in the silhouette's outer band (the sweep's measure)."""
    a = np.asarray(im).astype(np.float32) / 255
    m = a[..., 3] > .5
    if m.sum() < 100:
        return None
    rim = m & ~ndimage.binary_erosion(m, iterations=max(2, round(im.width * .006)))
    return float((lum(a[..., :3])[rim] < .16).mean())


def process(path, cols, rows, rest, rcols, rrows, dst=None, lighter=1.):
    im = Image.open(path).convert('RGBA')
    boxes = grid(im, cols, rows)
    orig = [im.crop(b) for b in boxes]
    soft = [soften(c)[0] for c in orig]
    target = dark_rim(Image.open(rest).convert('RGBA').crop(grid(Image.open(rest), rcols, rrows)[0])) * lighter
    med = lambda cs: float(np.median([x for x in (dark_rim(c) for c in cs) if x is not None]))
    # an entrance is measured once the hero has arrived (its second half), where it hands over to the resting loop
    half = len(orig) // 2 if 'entrance' in Path(path).name else 0
    o, s = med(orig[half:]), med(soft[half:])
    t = float(np.clip((o - target) / (o - s), 0, 1)) if o - s > 1e-3 else 0.
    out = Image.new('RGBA', im.size)
    for b, a, c in zip(boxes, orig, soft):
        out.alpha_composite(Image.blend(a, c, t), b[:2])
    out.save(dst or path, quality=92, alpha_quality=100, method=6)
    return o, s, target, t


if __name__ == '__main__':
    if sys.argv[1] == 'apply':
        for p, c, r, rest, rc, rr in SHEETS:
            o, s, target, t = process(ROOT / p, c, r, ROOT / rest, rc, rr, lighter=LIGHTER.get(p, 1.))
            print(f'rim {o:.3f} -> {o + t * (s - o):.3f} (rest {target:.3f}, blend {t:.2f})  {p}')
    else:
        a = sys.argv[1:]
        print(process(a[0], int(a[1]), int(a[2]), a[3], int(a[4]), int(a[5]), a[6] if len(a) > 6 else None))
