"""bobface.py <whole.webp> <master_cell.png> <out.webp> <face box> <boots box> : a resting loop drawn whole by Codex,
with the face held from the master: for each frame the master's face patch is placed (integer shift only, found by
matching the drawn head) where the drawn face bobs to, and the boots are the master's boots in place. Frame 1 = master.
Pixel selection and whole-pixel placement only; nothing is drawn, warped or scaled."""
import sys
import numpy as np
from PIL import Image, ImageFilter
who = np.asarray(Image.open(sys.argv[1]).convert("RGBA")).astype(np.float32) / 255
mas = np.asarray(Image.open(sys.argv[2]).convert("RGBA")).astype(np.float32) / 255
c = who.shape[1] // 2
face = list(map(int, sys.argv[4].split(","))); boots = list(map(int, sys.argv[5].split(",")))
cell = lambda i: (slice((i // 2) * c, (i // 2 + 1) * c), slice((i % 2) * c, (i % 2 + 1) * c))
pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
def mask(b, blur=1.6):
    m = np.zeros((c, c), np.uint8); m[b[1]:b[3], b[0]:b[2]] = 255
    return np.asarray(Image.fromarray(m).filter(ImageFilter.GaussianBlur(blur)), np.float32)[..., None] / 255
def shift(a, dx, dy):
    o = np.zeros_like(a); H, W = a.shape[:2]
    o[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)] = a[max(0, -dy):H - max(0, dy), max(0, -dx):W - max(0, dx)]
    return o
M = pm(mas); out = who.copy(); wf, wb = mask(face), mask(boots)
hx0, hy0, hx1, hy1 = face[0] - 25, face[1] - 40, face[2] + 10, face[3] + 5     # head area used to find the bob
for i in range(8):
    F = pm(who[cell(i)])
    if i == 0:
        res = M
        print(1, "master")
    else:
        best = min(((np.abs(shift(M, dx, dy)[hy0:hy1, hx0:hx1] - F[hy0:hy1, hx0:hx1]).mean(), dx, dy)
                    for dx in range(-4, 5) for dy in range(-8, 9)))
        _, dx, dy = best
        res = F * (1 - wf) + shift(M, dx, dy) * shift(wf, dx, dy) + F * (wf - shift(wf, dx, dy)).clip(0, 1) * 0
        wfs = shift(wf, dx, dy); res = F * (1 - wfs) + shift(M, dx, dy) * wfs
        res = res * (1 - wb) + M * wb
        print(i + 1, "head bob dx", dx, "dy", dy, "err", round(float(best[0]), 4))
    a = res[..., 3:]
    out[cell(i)] = np.concatenate([np.where(a > 1e-4, res[..., :3] / np.maximum(a, 1e-4), 0), a], -1)
Image.fromarray((out.clip(0, 1) * 255).astype("uint8"), "RGBA").save(sys.argv[3], lossless=True, method=6)
