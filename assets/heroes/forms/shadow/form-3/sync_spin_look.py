"""Noct 3 looks like his "Xoay lưỡi hái" showcase fidget in every state (owner 14/11: "Noct 3 màu vạt áo tôi muốn như của
trạng thái xoay lưỡi hái, không quá sáng. Màu mắt giữ nguyên nhưng hình dáng thì phải sửa giống dáng mắt xoay lưỡi hái.
Đồng bộ tất cả các trạng thái.").

  hems   the soul-cyan cloth (hem tips, tassels) of each picture mapped onto the scythe spin's hue / saturation / brightness
         spread (quantile mapping inside the cyan mask; eyes and the white scythe left out). A sheet gets one mapping for
         all its frames, a rig sheet the mapping of its resting frame, so nothing flickers.
  eyes   the scythe spin's own two eyes (their glow, lifted off the dark hood) laid over each frame's eyes: each eye on the
         old eye's centre, at the old eye's width, turned with the head's tilt; the old glow is inpainted away first and the
         new glow keeps the old eyes' colour.
  check  a contact sheet of every frame's eyes (scratch path as the argument).

Run `hems` then `eyes` once (a rerun would map again); to redo, `git checkout` the pictures first. Sheets rebuilt from raw
drawings need retone_cyan.py file, retone_soul.py, then this.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

F3 = Path(__file__).resolve().parent
SPIN = F3 / 'showcase' / 'scythespin.webp'
SPIN_GRID = (2, 4)
SPIN_EYES_FRAME = 0        # eyes open, head level

# picture: (cols, rows, mapping source). 'rest' = the mapping of the rig's resting frame.
TARGETS = {
    'attack.webp': (3, 2, None), 'cast.webp': (3, 2, None), 'hover.webp': (3, 2, None), 'run.webp': (3, 2, None),
    'rig/combat/rest.png': (1, 1, None), 'rig/combat/idle.webp': ('rig', None, 'rig/combat/rest.png'),
    'rig/buff/buff.webp': ('rig', None, 'rig/combat/rest.png'),
    'rig/show/rest.png': (1, 1, None), 'rig/show/idle.webp': ('rig', None, 'rig/show/rest.png'),
    'hub-idle.webp': (1, 1, None),
}
# Pictures whose cloth already matches the spin (drawn with it) but whose eyes are swapped too; their eyes sit at NEAR.
NEAR = (.653, .439, .07)
EYES_ONLY = {'showcase/idle.webp': (2, 4), 'showcase/darkpalm.webp': (2, 4), 'showcase/emerge.webp': (2, 4),
             'showcase/rift.webp': (2, 4)}


def grid_of(path, spec):
    cols, rows = spec[0], spec[1]
    if cols == 'rig':          # a baked rig sheet: square cells of the resting frame's size
        cell = Image.open(F3 / TARGETS[path][2]).width
        im = Image.open(F3 / path)
        return im.width // cell, im.height // cell
    return cols, rows


def frames(im, cols, rows):
    w, h = im.width // cols, im.height // rows
    return [im.crop((c * w, r * h, (c + 1) * w, (r + 1) * h)) for r in range(rows) for c in range(cols)], (w, h)


def unframes(fr, cols, rows, size, mode):
    out = Image.new(mode, (cols * size[0], rows * size[1]), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        out.paste(f, ((i % cols) * size[0], (i // cols) * size[1]))
    return out


def save(im, path):
    im.save(path, quality=92, method=6) if path.suffix == '.webp' else im.save(path)


def hsv(a):
    rgb = a[..., :3] / 255.0; mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    c = v * s; x = c * (1 - np.abs((h / 60) % 2 - 1)); m = v - c; k = (h // 60).astype(int) % 6
    z = np.zeros_like(h)
    r = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [c, x, z, z, x, c])
    g = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [x, c, c, x, z, z])
    b = np.select([k == 0, k == 1, k == 2, k == 3, k == 4, k == 5], [z, z, x, c, c, x])
    return np.stack([r + m, g + m, b + m], -1) * 255


# ---- eyes -------------------------------------------------------------------------------------------------------------
def eye_blobs(a, near=None):
    """The two glowing eyes: bright cool blobs ringed by the hood's near-black, the biggest such pair. near (x, y, r as
    fractions of the frame width): the pair must lie there (the rift fidget's black tear passed for a hood, 14/11)."""
    W = a.shape[1] / 512
    r, b, al = a[..., 0], a[..., 2], a[..., 3]; v = a[..., :3].max(-1)
    cand = (al > 150) & (v > 140) & (b > r + 15)
    dark = (al > 150) & (v < 45)
    lab, n = ndimage.label(cand); blobs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        comp = lab == i + 1; sz = int(comp.sum())
        if sz < 30 * W * W:
            continue
        ring = ndimage.binary_dilation(comp, iterations=5) & ~ndimage.binary_dilation(comp, iterations=2)
        if dark[ring].mean() > .36:      # (.45 missed the left eye of four rig frames: .44)
            w = v * comp; cy, cx = ndimage.center_of_mass(w)
            blobs.append({'mask': comp, 'size': sz, 'cx': cx, 'cy': cy, 'w': sl[1].stop - sl[1].start})
    best = None
    for i in range(len(blobs)):
        for j in range(len(blobs)):
            p, q = blobs[i], blobs[j]
            if i == j or p['cx'] >= q['cx']:
                continue
            dx, dy = q['cx'] - p['cx'], q['cy'] - p['cy']
            if not (12 * W < dx < 70 * W and abs(dy) < .45 * dx):
                continue
            if near and np.hypot((p['cx'] + q['cx']) / 2 - near[0] * a.shape[1], (p['cy'] + q['cy']) / 2 - near[1] * a.shape[1]) > near[2] * a.shape[1]:
                continue
            score = p['size'] + q['size']
            if best is None or score > best[0]:
                best = (score, p, q)
    return None if best is None else (best[1], best[2])


def glow_mask(a, blobs):
    """The eyes and their soft glow on the hood (dilated, then grown into the surrounding brighter-than-hood pixels)."""
    m = blobs[0]['mask'] | blobs[1]['mask']
    big = ndimage.binary_dilation(m, iterations=11)
    v = a[..., :3].max(-1)
    return ndimage.binary_dilation(m, iterations=3) | (big & (v > 30))   # the old halo too, or the new eye reads thicker


def lift_glow(a, blobs):
    """The eyes' glow alone (RGB above the inpainted hood) and the inpainted picture."""
    gm = glow_mask(a, blobs)
    rgb = np.ascontiguousarray(a[..., :3].astype(np.uint8))
    base = cv2.inpaint(rgb, (gm * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA).astype(np.float32)
    glow = np.clip(a[..., :3] - base, 0, None) * gm[..., None]
    return glow, base


def core_colour(a, blob):
    v = a[..., :3].max(-1); m = blob['mask']; t = np.percentile(v[m], 70)
    return a[..., :3][m & (v >= t)].mean(0)


def spin_eyes():
    im = Image.open(SPIN).convert('RGBA')
    fr, _ = frames(im, *SPIN_GRID)
    a = np.asarray(fr[SPIN_EYES_FRAME]).astype(np.float32)
    blobs = eye_blobs(a)
    glow, _ = lift_glow(a, blobs)
    out = []
    for b in blobs:
        ys, xs = np.where(ndimage.binary_dilation(b['mask'], iterations=8))
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        out.append({'glow': glow[y0:y1, x0:x1], 'cx': b['cx'] - x0, 'cy': b['cy'] - y0, 'w': b['w'],
                    'core': core_colour(a, b)})
    tilt = np.degrees(np.arctan2(blobs[1]['cy'] - blobs[0]['cy'], blobs[1]['cx'] - blobs[0]['cx']))
    return out, tilt


def swap_eyes(frame, src, src_tilt, near=None):
    a = np.asarray(frame.convert('RGBA')).astype(np.float32)
    blobs = eye_blobs(a, near)
    if blobs is None:
        return frame, False
    tilt = np.degrees(np.arctan2(blobs[1]['cy'] - blobs[0]['cy'], blobs[1]['cx'] - blobs[0]['cx']))
    _, base = lift_glow(a, blobs)
    add = np.zeros_like(base)
    for s, b in zip(src, blobs):
        k = b['w'] / s['w']
        gain = np.clip(core_colour(a, b) / np.maximum(s['core'], 1), .75, 1.35)
        M = cv2.getRotationMatrix2D((float(s['cx']), float(s['cy'])), -(tilt - src_tilt), k)
        M[0, 2] += b['cx'] - s['cx']; M[1, 2] += b['cy'] - s['cy']
        warped = cv2.warpAffine(s['glow'].astype(np.float32), M, (a.shape[1], a.shape[0]), flags=cv2.INTER_LINEAR)
        add = np.maximum(add, warped * gain)
    out = a.copy(); out[..., :3] = np.clip(base + add, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGBA'), True


# ---- hems -------------------------------------------------------------------------------------------------------------
def cloth_mask(a, eyes_out=True):
    h, s, v = hsv(a)
    m = (a[..., 3] > 128) & (h > 160) & (h < 225) & (s > .12) & ~((v > .6) & (s < .3))
    if eyes_out:
        bl = eye_blobs(a)
        if bl:
            m &= ~ndimage.binary_dilation(bl[0]['mask'] | bl[1]['mask'], iterations=12)
    return m, (h, s, v)


def quantiles(arrs):
    m = np.concatenate([x[0] for x in arrs]); hh = np.concatenate([x[1] for x in arrs])
    ss = np.concatenate([x[2] for x in arrs]); vv = np.concatenate([x[3] for x in arrs])
    qs = np.linspace(0, 100, 101)
    return [np.percentile(c, qs) for c in (hh, ss, vv)]


def collect(fr):
    out = []
    for f in fr:
        a = np.asarray(f.convert('RGBA')).astype(np.float32)
        m, (h, s, v) = cloth_mask(a)
        out.append((m[m], h[m], s[m], v[m]))
    return out


def apply_map(f, src_q, tgt_q):
    a = np.asarray(f.convert('RGBA')).astype(np.float32)
    m, (h, s, v) = cloth_mask(a)
    # A soft edge: pixels just outside the saturation floor take part of the change.
    wgt = np.clip((s - .07) / .07, 0, 1) * ndimage.gaussian_filter(m.astype(np.float32), 1.0)
    wgt = np.maximum(wgt * (m | ndimage.binary_dilation(m, iterations=2)), m * 1.0)
    h2 = np.interp(h, src_q[0], tgt_q[0]); s2 = np.interp(s, src_q[1], tgt_q[1]); v2 = np.interp(v, src_q[2], tgt_q[2])
    new = hsv_to_rgb(h2, s2, v2)
    out = a.copy(); out[..., :3] = a[..., :3] * (1 - wgt[..., None]) + new * wgt[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')


def cmd_hems():
    spin = Image.open(SPIN).convert('RGBA')
    tgt_q = quantiles(collect(frames(spin, *SPIN_GRID)[0]))
    maps = {}
    for path, spec in TARGETS.items():
        cols, rows = grid_of(path, spec)
        src_path = spec[2] or path
        if src_path not in maps:
            sc, sr = grid_of(src_path, TARGETS[src_path])
            maps[src_path] = quantiles(collect(frames(Image.open(F3 / src_path).convert('RGBA'), sc, sr)[0]))
        im = Image.open(F3 / path).convert('RGBA')
        fr, size = frames(im, cols, rows)
        save(unframes([apply_map(f, maps[src_path], tgt_q) for f in fr], cols, rows, size, 'RGBA'), F3 / path)
        print('hems', path, f'{cols}x{rows}')


def cmd_eyes():
    src, src_tilt = spin_eyes()
    todo = {p: grid_of(p, s) for p, s in TARGETS.items()} | EYES_ONLY
    for path, (cols, rows) in todo.items():
        im = Image.open(F3 / path).convert('RGBA')
        fr, size = frames(im, cols, rows)
        done = [swap_eyes(f, src, src_tilt, NEAR if path in EYES_ONLY else None) for f in fr]
        save(unframes([d[0] for d in done], cols, rows, size, 'RGBA'), F3 / path)
        print('eyes', path, ''.join('x' if d[1] else '.' for d in done))


def cmd_check(out):
    tiles = []
    for path, spec in list(TARGETS.items()) + [(p, s) for p, s in EYES_ONLY.items()] + [('showcase/scythespin.webp', SPIN_GRID)]:
        cols, rows = grid_of(path, spec) if path in TARGETS else spec
        fr, _ = frames(Image.open(F3 / path).convert('RGBA'), cols, rows)
        step = max(1, len(fr) // 6)
        for f in fr[::step]:
            a = np.asarray(f).astype(np.float32); bl = eye_blobs(a)
            if not bl:
                continue
            cx = (bl[0]['cx'] + bl[1]['cx']) / 2; cy = (bl[0]['cy'] + bl[1]['cy']) / 2; h = f.width * .1
            bg = Image.new('RGBA', f.size, (90, 90, 90, 255)); bg.alpha_composite(f)
            tiles.append(bg.convert('RGB').crop((int(cx - h), int(cy - h), int(cx + h), int(cy + h))).resize((160, 160)))
    sheet = Image.new('RGB', (12 * 160, (len(tiles) + 11) // 12 * 160))
    for i, t in enumerate(tiles):
        sheet.paste(t, (i % 12 * 160, i // 12 * 160))
    sheet.save(out, quality=88)
    print('check', len(tiles), out)


if __name__ == '__main__':
    cmd = sys.argv[1]
    {'hems': cmd_hems, 'eyes': cmd_eyes}.get(cmd, lambda: cmd_check(sys.argv[2]))()
