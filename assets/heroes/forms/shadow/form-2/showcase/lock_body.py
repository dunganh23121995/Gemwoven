"""Hold Noct form 2's showcase still where it must not move (in place, run after fidget.py accept).

  python lock_body.py idle       Codex redraws the whole figure in every frame of the resting loop, so
                                  the body boiled and swayed. Each frame is shifted onto frame 1 (phase
                                  correlation on the torso), then everything but the coat tail streaming
                                  out on the left (the body right of x 300 of the 640 px cell, and both
                                  legs and boots below y 465 right of x 262, feathered) is frame 1 itself.
  python lock_body.py slashtear  the draw keeps Codex's poses; the tear is the first version's horizontal one.
  python lock_body.py eyeflare   his eyes flare, then he blurs and melts into black smoke, is gone and
                                  forms again (the resting pose blurred and faded, Codex's wisps and eyes).
"""
import sys
from pathlib import Path

import cv2
from scipy import ndimage
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent


def load(name):
    sheet = np.asarray(Image.open(HERE / f"{name}.webp").convert("RGBA"), dtype=np.float32)
    h, w = sheet.shape[0] // 4, sheet.shape[1] // 2
    return sheet, h, w, [sheet[(i // 2) * h:(i // 2 + 1) * h, (i % 2) * w:(i % 2 + 1) * w].copy() for i in range(8)]


def save(name, sheet, h, w, cells):
    for i, c in enumerate(cells):
        sheet[(i // 2) * h:(i // 2 + 1) * h, (i % 2) * w:(i % 2 + 1) * w] = c
    Image.fromarray(sheet.clip(0, 255).astype("uint8"), "RGBA").save(HERE / f"{name}.webp", lossless=True, method=6)


def align(cell, ref, h, w):
    torso = (slice(round(260 * h / 640), round(480 * h / 640)), slice(round(320 * w / 640), round(480 * w / 640)))
    (dx, dy), _ = cv2.phaseCorrelate(ref[..., 3][torso], cell[..., 3][torso])
    return cv2.warpAffine(cell, np.float32([[1, 0, -dx], [0, 1, -dy]]), (w, h), flags=cv2.INTER_LINEAR)


def ramp(v, lo, hi):
    return np.clip((v - lo) / (hi - lo), 0, 1)


which = sys.argv[1]
sheet, h, w, cells = load(which)
k = w / 640
if which == "idle":
    yy, xx = np.mgrid[0:h, 0:w] / k
    mask = np.maximum(ramp(xx, 285, 315), ramp(xx, 248, 268) * ramp(yy, 450, 470))[..., None]
    first = cells[0]
    cells = [first] + [align(c, first, h, w) * (1 - mask) + first * mask for c in cells[1:]]
elif which == "slashtear":
    # Codex's draw (stance change, draw, hold, flick, sheathe, rise) is kept whole, but its tear was cut
    # by the cell edges: everything apart from the figure is dropped, and the horizontal tear of the
    # first version (old-v3/slashtear.webp (the first version, kept for its tear): the cut line, the open tear, the narrowing line) is laid in
    # front of the blade instead.
    def figure(c):
        labels, count = ndimage.label(c[..., 3] > 20)
        if not count:
            return c
        sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
        out = c.copy(); out[labels != int(np.argmax(sizes)) + 1, 3] = 0
        return out

    def apart(c):
        labels, count = ndimage.label(c[..., 3] > 20)
        if not count:
            return np.zeros_like(c)
        sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
        out = c.copy(); out[labels == int(np.argmax(sizes)) + 1, 3] = 0
        return out

    _, oh, ow, old = load("old-v3/slashtear")
    tears = [apart(cv2.resize(c, (w, h)) if (oh, ow) != (h, w) else c) for c in old]
    cells = [figure(c) for c in cells]
    for frame, source in {2: 2, 3: 3, 4: 4, 5: 5}.items():   # new frame <- old frame (0-based)
        t = tears[source]; a = t[..., 3:] / 255
        c = cells[frame]; c[..., :3] = t[..., :3] * a + c[..., :3] * (1 - a); c[..., 3] = np.maximum(c[..., 3], t[..., 3])
else:
    # Eyes flare, then he blurs and melts into black smoke, is gone, and forms again. Every body frame
    # is the resting pose itself, blurred and faded (nothing redrawn); from Codex's drawing (shifted
    # onto it) come only the wisps clear of his figure; the eyes are his own, made brighter.
    _, ih, iw, idle = load("idle")
    rest = idle[0]
    body = cv2.dilate((rest[..., 3] > 40).astype(np.uint8), np.ones((25, 25), np.uint8))
    yy, xx = np.mgrid[0:h, 0:w] / k
    eyebox = ((xx > 365) & (xx < 425) & (yy > 250) & (yy < 290)).astype(np.float32)
    drawn = [align(c, rest, h, w) for c in cells]

    def wisps(a):
        wisp = (a[..., 3] > 40) & (body == 0)
        labels, count = ndimage.label(wisp)
        sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
        keep = np.isin(labels, [i + 1 for i, area in enumerate(sizes) if area >= 150 * k * k]).astype(np.float32)
        return a * cv2.GaussianBlur(keep, (5, 5), 0)[..., None]

    def eyes(a):
        return (ramp(a[..., :3].mean(-1) - rest[..., :3].mean(-1), 30, 80) * eyebox)[..., None]

    def faded(blur, alpha, base):
        pre = base.copy(); pre[..., :3] *= pre[..., 3:] / 255
        if blur:
            pre = cv2.GaussianBlur(pre, (0, 0), blur * k)
        out = pre.copy(); out[..., :3] = np.where(pre[..., 3:] > 0, pre[..., :3] * 255 / np.maximum(pre[..., 3:], 1), 0)
        out[..., 3] *= alpha
        return out

    def over(top, base):
        a = top[..., 3:] / 255
        out = base.copy(); out[..., :3] = top[..., :3] * a + base[..., :3] * (1 - a); out[..., 3] = np.maximum(top[..., 3], base[..., 3] * (1 - a[..., 0]) + top[..., 3])
        return out

    # The flare is the resting pose's own eyes made brighter, with a soft bloom round them (Codex
    # drew its eyes a little elsewhere, so they are never taken).
    eye = (ramp(rest[..., :3].mean(-1), 150, 220) * eyebox * (rest[..., 3] > 128))
    bloom = cv2.GaussianBlur(eye, (0, 0), 3 * k) * 2.2
    lit = rest.copy()
    lit[..., :3] = np.clip(rest[..., :3] + (255 - rest[..., :3]) * np.clip(eye * .9 + bloom * .6, 0, 1)[..., None] + np.array([30, 10, 60]) * np.clip(bloom, 0, 1)[..., None], 0, 255)
    smoke = [wisps(d) for d in drawn]
    # (blur px, body alpha, smoke frame, smoke strength, eyes lit)
    plan = [(0, 1, None, 0, False), (0, 1, 1, .6, True), (2, .85, 2, 1, True), (6, .5, 3, 1, False),
            (11, .1, 4, .8, False), (6, .45, 5, .6, False), (2, .85, 6, .3, False), (0, 1, None, 0, False)]
    cells = []
    for blur, alpha, wf, ws, lit_eyes in plan:
        base = lit if lit_eyes else rest
        frame = base if (not blur and alpha == 1) else faded(blur, alpha, base)
        if wf is not None:
            w_ = smoke[wf].copy(); w_[..., 3] *= ws
            frame = over(w_, frame)
        cells.append(frame)
save(which, sheet, h, w, cells)
print("held still:", which)
