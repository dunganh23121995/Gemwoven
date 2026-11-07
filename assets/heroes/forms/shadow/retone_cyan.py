"""Noct's violet turned to the cyan of his season avatar (owner 07/11: "Chỗ nào tím chuyển sang tone màu xanh này").

Only the hue of violet pixels moves (hue 208-338 deg, faded in at both ends and on near-grey pixels); lightness, saturation,
alpha and every line stay as drawn, so the locked art keeps its shapes. Red blood, brown leather and silver are untouched.
Raw drawings (*raw*), Codex part maps, masks and QA previews keep their old colours: a sheet rebuilt from a raw comes out
violet and must be passed through `file` again.

Form 3's scythe blade is white, not cyan (owner 07/11: "lưỡi liềm bỏ ánh xanh chuyển sang tông trắng"): in every form-3 picture
the bright, elongated cyan glow lying on the blade's large silver metal is turned to a cool white; the eyes (compact) and the
cloak tips (dark) keep their colour. `scythe` runs only that step on files already retoned (it finds no cyan blade twice).

  python assets/heroes/forms/shadow/retone_cyan.py list            # files it would change, with their violet share
  python assets/heroes/forms/shadow/retone_cyan.py apply           # retone every listed file in place (run once)
  python assets/heroes/forms/shadow/retone_cyan.py file <in> [out] # one file (a rebuilt sheet, a test into scratch)
  python assets/heroes/forms/shadow/retone_cyan.py scythe          # whiten the scythe blade in every form-3 file
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[4]
TARGET_HUE = 197.0  # the avatar's glow (assets/gemwoven/raw/season-noct/avatar/raw.png peaks at 195-200)
DEEP_HUE = 212.0  # the avatar's shadowed flames and cloak tips (210-225)
LIFT = .15
DIRS = ['assets/heroes/shadow', 'assets/heroes/forms/shadow', 'assets/fx/noct', 'assets/fx/heroes/shadow',
        'assets/fx/forms/shadow-2']
# Noct's own pictures outside his folders (hub portraits, idle, skill icons, his ultimate button's emblem). Element-wide art shared with foes
# (board gem, element emblem, relics, summon scene, hall banner) is not his look and stays.
FILES = ['assets/gemwoven/items/hero-shadow.png', 'assets/gemwoven/items/portrait-shadow.png',
         'assets/gemwoven/items/home-idle-shadow.webp', 'assets/gemwoven/items/home-idle-shadow-poster.webp',
         'assets/gemwoven/atlas/ui/face-shadow.webp', 'assets/combat-hud/em-shadow.webp'] + [f'assets/gemwoven/items/skill-shadow-{i}.png' for i in range(4)]
BLADE_WHITE = np.array([.95, .975, 1.0])  # a cool white, so the steel still reads as metal
SKIP = ('raw', 'parts', 'mask', 'overlay', 'preview', 'concept', 'old-')  # matched anywhere in the path


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dd = np.where(d == 0, 1, d)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    return np.where(d == 0, 0, h), np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def retone(rgba):
    a = rgba.astype(np.float32) / 255
    h, s, mx = hsv(a[..., :3])
    w = smooth(208, 236, h) * (1 - smooth(318, 338, h)) * smooth(.05, .16, s)
    if not (w > 0).any():
        return rgba, 0.0
    # like the avatar: lit violet turns cyan, shadowed violet a deeper blue (up to DEEP_HUE) rather than murky teal
    target = TARGET_HUE + (DEEP_HUE - TARGET_HUE) * (1 - smooth(.3, .9, mx))
    h2 = (h + w * (target - h)) / 60
    i = np.floor(h2) % 6
    f = h2 - np.floor(h2)
    # deep violets lift up to LIFT so cloak tips and tassels read as lit cyan like the avatar, not muddy teal (Codex 07/11)
    v = np.minimum(mx * (1 + LIFT * w * smooth(.25, .5, s)), 1)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    sel = [i == k for k in range(6)]
    out = np.stack([np.select(sel, c) for c in ((v, q, p, p, t, v), (t, v, v, q, p, p), (p, p, t, v, v, q))], -1)
    res = rgba.copy()
    moved = w > 0
    res[..., :3][moved] = np.clip(np.round(out[moved] * 255), 0, 255).astype(np.uint8)
    seen = (a[..., 3] > .1) & (s > .15) & (mx > .12)
    return res, float((w[seen] > .5).sum() / max(seen.sum(), 1))


def figure_scale(alpha):
    """Pixel sizes below are tuned on a 512px resting frame, where Noct stands ~400px tall; other cells scale with him."""
    lab, n = nd.label(alpha > .3)
    boxes = [o for o in nd.find_objects(lab) if o[0].stop - o[0].start > 60]
    heights = [o[0].stop - o[0].start for o in boxes]
    return max(.25, float(np.median(heights)) / 400) if heights else 1.0


def whiten_scythe(rgba):
    a = rgba.astype(np.float32) / 255
    h, s, v = hsv(a[..., :3])
    seen = a[..., 3] > .05
    k = figure_scale(a[..., 3])
    cyan = seen & (h > 175) & (h < 235) & (s > .1) & (v > .3)
    # the blade's steel: large near-grey bright areas (the eyes' white cores and boot shine are small)
    silver = seen & (s < .14) & (v > .62)
    sl, sn = nd.label(silver)
    silver = np.isin(sl, np.nonzero(nd.sum(silver, sl, range(1, sn + 1)) >= 40 * k * k)[0] + 1)
    near = nd.binary_dilation(silver, iterations=max(2, int(4 * k)))
    lab, n = nd.label(cyan)
    if not n:
        return rgba, 0.0
    idx = range(1, n + 1)
    size, lit, touch = nd.sum(cyan, lab, idx), nd.sum(cyan & (v > .62), lab, idx), nd.sum(near, lab, idx)
    reach = np.array([max(o[0].stop - o[0].start, o[1].stop - o[1].start) for o in nd.find_objects(lab)])
    # the blade glow is bright and long; it is big on its own or lies on the steel. Eyes are compact, cloak tips dark.
    blade = (lit >= .45 * size) & (reach >= 50 * k) & ((size >= 250 * k * k) | ((size >= 40 * k * k) & (touch >= .5 * size)))
    m = np.isin(lab, np.nonzero(blade)[0] + 1)
    if not m.any():
        return rgba, 0.0
    m = nd.binary_dilation(m, iterations=max(2, int(3 * k))) & cyan  # its dimmer fringe
    w = np.clip(nd.gaussian_filter(m.astype(np.float32), .8) * 1.6, 0, 1)[..., None] * seen[..., None]
    white = np.minimum(v * 1.06, 1)[..., None] * BLADE_WHITE
    res = rgba.copy()
    res[..., :3] = np.clip(np.round((a[..., :3] + w * (white - a[..., :3])) * 255), 0, 255).astype(np.uint8)
    return res, float(m.sum() / max(seen.sum(), 1))


def has_scythe(path):
    return 'form-3' in Path(path).as_posix()


def lossless(path):
    with open(path, 'rb') as fh:
        return b'VP8L' in fh.read(64)


def process(src, dst=None, write=True, steps=(retone,)):
    src, dst = Path(src), Path(dst or src)
    if retone in steps and has_scythe(src):
        steps = tuple(steps) + (whiten_scythe,)
    im = Image.open(src)
    frames, share = [], 0.0
    for k in range(getattr(im, 'n_frames', 1)):
        im.seek(k)
        out, sh = np.asarray(im.convert('RGBA')), 0.0
        for step in steps:
            out, part = step(out)
            sh = max(sh, part)
        frames.append((Image.fromarray(out, 'RGBA'), im.info.get('duration', 100)))
        share = max(share, sh)
    if not write or share == 0:
        return share
    if src.suffix.lower() == '.webp':
        opts = dict(lossless=True) if lossless(src) else dict(quality=92, alpha_quality=100)
        if len(frames) > 1:
            frames[0][0].save(dst, save_all=True, append_images=[f for f, _ in frames[1:]],
                              duration=[d for _, d in frames], loop=im.info.get('loop', 0), method=6, **opts)
        else:
            frames[0][0].save(dst, method=6, **opts)
    else:
        frames[0][0].save(dst, optimize=True)
    return share


def targets():
    found = []
    for d in DIRS:
        for p in sorted((ROOT / d).rglob('*')):
            rel = p.relative_to(ROOT / d).as_posix()
            if p.suffix.lower() in ('.png', '.webp') and not any(k in rel for k in SKIP):
                found.append(p)
    return found + [ROOT / f for f in FILES]


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
    if cmd == 'file':
        print(f'{process(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None):.2f}', sys.argv[2])
    elif cmd == 'scythe':
        done = [p for p in targets() if has_scythe(p) and process(p, steps=(whiten_scythe,)) > 0]
        print('\n'.join(p.relative_to(ROOT).as_posix() for p in done))
        print(len(done), 'files with a whitened scythe')
    else:
        changed = 0
        for p in targets():
            share = process(p, write=cmd == 'apply')
            if share > 0:
                changed += 1
                print(f'{share:.2f}  {p.relative_to(ROOT).as_posix()}')
        print(changed, 'files', 'retoned' if cmd == 'apply' else 'would change')
