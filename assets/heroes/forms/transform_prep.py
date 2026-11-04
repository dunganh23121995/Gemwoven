"""Biến Thân pieces (docs/GAME_DESIGN.md §2.4, src/transform-fx.js): key a hero's Codex raws in
assets/gemwoven/raw/transform-<hero>/ off their flat magenta (or green, for heroes with pink or violet in their palette),
cut each sheet into its pieces, trim, and save transparent webp in assets/heroes/forms/<hero>/transform/.
  raw-spirit.png  one piece: the element spirit that flares up behind the hero (spirit)
  raw-sides.png   two pieces, left half / right half: the side elements of the transformed turns (side-left, side-right)
  raw-small.png   four pieces in one row (four equal columns): ground accent, mote, second mote, afterglow mark (ground, mote, mote-2, after)
Rebuild: python assets/heroes/forms/transform_prep.py <hero> [<hero> ...]   (no argument: every hero with raws)
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
# Per hero: the key colour of its raws and the lightness ramp its spirit is remapped onto, so the spirit reads as one bold
# shape in the hero's own palette (Codex build review 1 on Mika). None keeps the drawn colours.
def ramp(*colours):
    """Five hex colours on the stops Mika's ramp uses (0 / .38 / .66 / .90 / 1)."""
    return tuple((p, tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))) for p, c in zip((0, .38, .66, .9, 1), colours))


# warm: the red-to-magenta pull is corrected (fire only; it would shift blues). Ramps from Codex's five-hero plan
# (assets/gemwoven/raw/transform-fire/plan-other-heroes.md); Mika's darkest stop is a deeper wine than its plan colour.
HEROES = {
    'fire': {'key': 'magenta', 'warm': True, 'ramp': ramp('#3A0E16', '#591923', '#C93628', '#F36338', '#FFB06A')},
    # Hiro's sides on his ramp too: about a quarter less bright gold (Codex fight review 1).
    'novice': {'key': 'magenta', 'sides': True, 'ramp': ramp('#30251D', '#5B4932', '#947246', '#C7A16A', '#F0D6A1')},
    'ice': {'key': 'magenta', 'ramp': ramp('#122C49', '#285A7E', '#518FAF', '#A7D8E5', '#E6F4F3')},
    # Nori keeps the plan ramp (Codex fight review 1: simpler drawn masses, not lighter colours, separate it from the
    # foliage). Noct's crest sank into his own dark aura, so it is lifted one step onto violet-grey.
    'earth': {'key': 'magenta', 'sides': True, 'ramp': ramp('#172B22', '#31513A', '#5C8050', '#9EAA69', '#DBCD92')},
    'lightning': {'key': 'green', 'ramp': ramp('#211A3E', '#4B2D78', '#8A55BD', '#C9AA64', '#F5D98A')},
    'shadow': {'key': 'green', 'sides': True, 'ramp': ramp('#2D2941', '#514367', '#817297', '#B5A7C7', '#E2DAF0')},
}


def key(path, colour, warm=False):
    """Alpha from the distance to the key colour (soft over a narrow band), then the key's spill on the rim is removed."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if colour == 'magenta':
        m = np.minimum(r, b) - g
        alpha = np.clip((150 - m) / 90, 0, 1)
        alpha[m > 150] = 0
        b = np.where(alpha < 1, np.minimum(b, g + 0.25 * (r - g).clip(0)), b)
        r = np.clip((r - 255 * (1 - alpha) * 0.55) / np.maximum(alpha, .35), 0, 255)
        if warm:  # the model leans the deepest reds toward magenta: keep blue near the flame palette everywhere
            b = np.minimum(b, g + 0.3 * (r - g).clip(0) + 12)
    else:  # green #00FF00
        m = g - np.maximum(r, b)
        alpha = np.clip((150 - m) / 90, 0, 1)
        alpha[m > 150] = 0
        g = np.where(alpha < 1, np.minimum(g, np.maximum(r, b) + 8), g)
    rgba = np.dstack([r, g, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    lab, n = ndimage.label(alpha > .5)
    if n:  # drop specks smaller than 40 px
        sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
        rgba[np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s < 40])] = 0
    return Image.fromarray(rgba, 'RGBA')


def palette(im, stops):
    """Remap colours by lightness onto the hero's ramp; the drawn strokes and alpha stay."""
    a = np.asarray(im).astype(np.float32)
    lum = (a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11) / 255
    lo, hi = np.percentile(lum[a[..., 3] > 128], [2, 99.5])
    t = np.clip((lum - lo) / max(1e-3, hi - lo), 0, 1) ** 1.25
    xs = [p for p, _ in stops]
    rgb = np.dstack([np.interp(t, xs, [c[k] for _, c in stops]) for k in range(3)])
    return Image.fromarray(np.dstack([rgb, a[..., 3]]).clip(0, 255).astype(np.uint8), 'RGBA')


def save(im, out, name, pad=6):
    box = im.getbbox()
    im = im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
    im.save(out / f'{name}.webp', quality=94, method=6)
    print(out.parent.name, name, im.size)


def runs(im, count, gap=60):
    """Column runs of a one-row sheet, joining pieces split by gaps narrower than `gap`."""
    cols = np.asarray(im)[..., 3].max(axis=0) > 0
    found, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None:
            start = x
        if not on and start is not None:
            if found and start - found[-1][1] < gap:
                found[-1] = (found[-1][0], x)
            else:
                found.append((start, x))
            start = None
    while len(found) > count:  # join the closest neighbours
        i = min(range(len(found) - 1), key=lambda i: found[i + 1][0] - found[i][1])
        found[i:i + 2] = [(found[i][0], found[i + 1][1])]
    assert len(found) == count, found
    return found


def prepare(hero):
    cfg = HEROES[hero]
    raw, out = ROOT / f'assets/gemwoven/raw/transform-{hero}', ROOT / f'assets/heroes/forms/{hero}/transform'
    out.mkdir(parents=True, exist_ok=True)
    k = lambda name: key(raw / name, cfg['key'], cfg.get('warm', False))
    spirit = k('raw-spirit.png')
    save(palette(spirit, cfg['ramp']) if cfg.get('ramp') else spirit, out, 'spirit')
    sides = k('raw-sides.png')
    if cfg.get('sides'):
        sides = palette(sides, cfg['ramp'])
    save(sides.crop((0, 0, sides.width // 2, sides.height)), out, 'side-left')
    save(sides.crop((sides.width // 2, 0, sides.width, sides.height)), out, 'side-right')
    small = k('raw-small.png')
    # Four pieces in one row. Mika's sheet is cut at its empty columns; the others were drawn in four equal columns
    # (a ground accent's two ends would otherwise read as two pieces).
    cuts = runs(small, 4) if hero == 'fire' else [(round(i * small.width / 4), round((i + 1) * small.width / 4)) for i in range(4)]
    for (x0, x1), name in zip(cuts, ['ground', 'mote', 'mote-2', 'after']):
        save(small.crop((x0, 0, x1, small.height)), out, name)


for hero in sys.argv[1:] or [h for h in HEROES if (ROOT / f'assets/gemwoven/raw/transform-{h}/raw-spirit.png').exists()]:
    prepare(hero)
