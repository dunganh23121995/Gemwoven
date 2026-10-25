"""Remove the magenta keying fringe from Hiro's (key 'novice') sheets, cell by cell, in place.

The chroma key (#FF00FF) left pink/violet rims on hair spikes, scarf tips and fingers. Like
scripts/prepare_masters.despill_boundary, every key-tinted pixel near the silhouette edge (here up to
4 px in, tint min(R,B)-G > 18) takes the colour of the nearest untinted body pixel, and its alpha keeps
only the share of the body colour it really held (how far it sits from pure magenta toward that body
colour). Faint leftovers of an older pose that the idle stabilizer left around the scarf (translucent
pixels more than 2.5 px away from any solid pixel) are cleared. Nothing is drawn, moved or resized;
pixels deeper inside the body are untouched.

  python assets/heroes/novice/despill_fringe.py <sheet> <cols> <rows> [...more triples]
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

KEY = np.array([255, 0, 255], dtype=np.float32)


def despill(cell, depth=4.0, tint=18):
    data = np.array(cell.convert('RGBA'))
    solid = data[:, :, 3] >= 200
    if solid.any():
        data[(data[:, :, 3] < 200) & (ndimage.distance_transform_edt(~solid) > 2.5), 3] = 0
    visible = data[:, :, 3] > 0
    if not visible.any():
        return Image.fromarray(data, 'RGBA')
    distance = ndimage.distance_transform_edt(visible)
    rgb = data[:, :, :3].astype(np.int16)
    tinted = (np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]) > tint
    # Hiro wears no pink or violet: a strongly key-tinted pixel deeper inside (a gap between arm and
    # body keyed half-way) is spill too, and takes the nearest body colour with its alpha unchanged.
    deep = visible & (distance > depth) & ((np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]) > 45)
    # The rim also kept lighter rose tints (blue above green on a brown/cream/green body), only on the
    # outermost 2.5 px so a shouting mouth near the cheek's edge is never touched.
    rose = (rgb[:, :, 2] - rgb[:, :, 1] > 8) & (rgb[:, :, 0] - rgb[:, :, 1] > 8) & (rgb[:, :, 0] > 140)
    spill = visible & (((distance <= depth) & tinted) | ((distance <= 2.5) & rose))
    tinted = tinted | (rose & (distance <= 2.5))
    safe = visible & (distance > 1.5) & ~tinted
    if (spill.any() or deep.any()) and safe.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~safe, return_indices=True)
        nearest = data[iy, ix, :3]
        observed = data[spill, :3].astype(np.float32)
        body = nearest[spill].astype(np.float32)
        direction = body - KEY
        coverage = np.clip(np.sum((observed - KEY) * direction, axis=1) / np.maximum(1, np.sum(direction * direction, axis=1)), 0, 1)
        data[spill, :3] = nearest[spill]
        data[spill, 3] = np.round(coverage * data[spill, 3]).astype(np.uint8)
        data[deep, :3] = nearest[deep]
        # A rose cast painted into the green scarf's tips (key bounce in the raw): rose pixels whose
        # nearest clean neighbour is scarf green take that green. A mouth's nearest is skin: untouched.
        green = (nearest[:, :, 1].astype(np.int16) > nearest[:, :, 0].astype(np.int16) + 4)
        scarf = visible & rose & green & ~spill
        data[scarf, :3] = nearest[scarf]
    return Image.fromarray(data, 'RGBA')


def pink_count(image):
    a = np.asarray(image.convert('RGBA')).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    return int(((al > 20) & (b - g > 25) & (r - g > 25) & (b > 70)).sum())


def run(path, cols, rows):
    sheet = Image.open(path).convert('RGBA')
    cw, ch = sheet.width // cols, sheet.height // rows
    out = Image.new('RGBA', sheet.size)
    for r in range(rows):
        for c in range(cols):
            out.alpha_composite(despill(sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))), (c * cw, r * ch))
    before, after = pink_count(sheet), pink_count(out)
    if path.lower().endswith('.webp'):
        out.save(path, 'WEBP', lossless=True, method=6, exact=True)
    else:
        out.save(path)
    print(f'{path}: key-tinted edge pixels {before} -> {after}')


if __name__ == '__main__':
    args = sys.argv[1:]
    for i in range(0, len(args), 3):
        run(args[i], int(args[i + 1]), int(args[i + 2]))
