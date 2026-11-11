"""Premium battle frame kits (owner 08/11: "mất tiền mà chỉ đổi màu thì không xứng đáng"; Codex mockup-mika-v2.png 8.5):
key and crop the drawn pieces of one season (premium/<season>/*-raw.png) into assets/combat-hud/kits/<season>/ and write
kit.json with what build.py writes into src/combat-kits-premium.css: the scene frame's band, margins and 9-slice cuts,
where the board frame's opening lies, the rail's cap width.

  python cut_premium.py <season>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]


def keyed(path):
    im = Image.open(path)
    if im.mode == 'RGBA' and np.asarray(im)[..., 3].min() < 10:
        a = np.asarray(im).astype(np.float32)
    else:
        rgb = np.asarray(im.convert('RGB')).astype(np.float32)
        d = np.sqrt((rgb[..., 0] - 255) ** 2 + rgb[..., 1] ** 2 + (rgb[..., 2] - 255) ** 2)
        al = np.clip((d - 50) / 90, 0, 1)
        k = np.maximum(al, 1e-3)[..., None]
        rgb = np.clip((rgb - (1 - k) * np.array([255, 0, 255], np.float32)) / k, 0, 255)
        a = np.dstack([rgb, al * 255])
    a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])          # drop faint speckles
    # and stray dots (a pixel at the canvas corner would stretch the crop and shift the whole frame's layout)
    lab, n = ndimage.label(a[..., 3] > 0)
    if n:
        sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        a[..., 3][np.isin(lab, np.nonzero(sizes < 30)[0] + 1)] = 0
    out = Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')
    return out.crop(out.getbbox())


def bands(im):
    """The frame band at the middle of each side: where it starts (margin from the image edge, ornaments overflow
    there) and its inner edge; the 9-slice cut is the margin plus 3.4 bands, so every corner ornament stays whole."""
    a = np.asarray(im)[..., 3] > 60
    h, w = a.shape

    def side(v):
        on = np.nonzero(v)[0]
        i = j = on[0]
        while j < len(v) and v[j]:
            j += 1
        return int(i), int(j)
    # measured on several lines across each side (a centre ornament on one line does not move it), the median kept
    med = lambda pairs: tuple(int(np.median([p[i] for p in pairs])) for i in (0, 1))
    xs, ys = [int(w * f) for f in (.3, .38, .45, .55, .62, .7)], [int(h * f) for f in (.3, .38, .45, .55, .62, .7)]
    t0, t1 = med([side(a[:, x]) for x in xs]); b0, b1 = med([side(a[::-1, x]) for x in xs])
    l0, l1 = med([side(a[y]) for y in ys]); r0, r1 = med([side(a[y, ::-1]) for y in ys])
    band = (t1 - t0 + b1 - b0 + l1 - l0 + r1 - r0) / 4
    return dict(band=round(band, 1), margin=[t0, r0, b0, l0], inner=[l1, t1, w - r1, h - b1],
                slice=[round(m + 3.4 * band) for m in (t0, r0, b0, l0)])


def main(season):
    src, out = HERE / season, ROOT / 'assets/combat-hud/kits' / season
    out.mkdir(parents=True, exist_ok=True)
    meta = {}
    sf = keyed(src / 'scene-frame-raw.png')
    sf.save(out / 'scene-frame.webp', quality=90, method=6)
    meta['scene'] = dict(size=list(sf.size), **bands(sf))
    bf = keyed(src / 'board-frame-raw.png')
    bd = bands(bf)
    # nothing of the frame may lie over the gems: inside the opening the picture is cleared (the corner ornaments are
    # drawn outside it, fix_board.py; this only trims the tips of a few top and bottom ornaments)
    il, it, ir, ib = bd['inner']
    a = np.asarray(bf).copy()
    a[it + 2:ib - 2, il + 2:ir - 2, 3] = 0
    bf = Image.fromarray(a, 'RGBA')
    bf.save(out / 'board-frame.webp', quality=90, method=6)
    w, h = bf.size
    # the opening (inner edges at the middle of each side) is laid on the board frame's box
    il, it, ir, ib = bd['inner']
    meta['board'] = dict(size=[w, h], left=round(-il / (ir - il) * 100, 3), top=round(-it / (ib - it) * 100, 3),
                         width=round(w / (ir - il) * 100, 3), height=round(h / (ib - it) * 100, 3))
    cr = keyed(src / 'crest-raw.png')
    cr.thumbnail((900, 400), Image.LANCZOS)
    cr.save(out / 'crest.webp', quality=90, method=6)
    meta['crest'] = list(cr.size)
    rail = keyed(src / 'rail-raw.png')
    rail.save(out / 'rail.webp', quality=90, method=6)
    a = np.asarray(rail)[..., 3] > 128
    h = a.shape[0]
    # the caps: where the bar is taller than its plain middle
    tall = a.sum(0)
    mid = np.median(tall[len(tall) // 3: 2 * len(tall) // 3])
    left = np.nonzero(tall[:len(tall) // 2] > mid * 1.15)[0]
    meta['rail'] = dict(size=list(rail.size), cap=int(left.max() + 4) if len(left) else int(rail.size[0] * .1))
    bb = Image.open(src / 'board-back-raw.png').convert('RGB').resize((640, 640), Image.LANCZOS)
    bb.save(out / 'board-back.webp', quality=86, method=6)
    # the cosmetic's icon in the wardrobe and the pass (season/<season>/combat-corner.webp): the board frame's upper-left
    # corner with its mascot
    w, h = bf.size
    icon = bf.crop((0, 0, round(w * .46), round(h * .42)))
    icon = icon.crop(icon.getbbox())
    icon.thumbnail((400, 364), Image.LANCZOS)
    cell = Image.new('RGBA', (400, 364))
    cell.alpha_composite(icon, ((400 - icon.width) // 2, (364 - icon.height) // 2))
    cell.save(ROOT / 'assets/gemwoven/season' / season / 'combat-corner.webp', quality=90, method=6)
    (out / 'kit.json').write_text(json.dumps(meta, indent=1) + '\n', encoding='utf-8')
    print(json.dumps(meta))


if __name__ == '__main__':
    main(sys.argv[1])
