"""lock_face.py <sheet> <cols> <rows> <count> --face cx,cy,rx,ry [--ref N] [--ref-sheet other.webp] [--frames 2,3,..] [--search 10] [--feather 4] [--dry]

Makes Lumi's face rigid in a loop sheet (in place). Codex redraws the face slightly differently in every frame of a
showcase loop, so at rest her eyes, mouth and face outline "morph". For every listed frame, the reference frame's
face (an ellipse around eyes, brows, mouth, cheeks, chin and front bangs; centre cx,cy and radii rx,ry in cell px) is
pasted at that frame's own head position: the best whole-pixel translation within +-search px, found by matching the
reference head region (face plus hat brim and hair around it) against the frame. The paste uses a feathered ellipse
mask and premultiplied blending, so hat tip, hair, cloak, stars and staff keep their own motion. Nothing is drawn.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def arg(name, default=None, cast=str):
    return cast(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


path, cols, rows, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
cx, cy, rx, ry = [float(v) for v in arg('--face').split(',')]
ref = arg('--ref', 1, int) - 1
frames = [int(v) - 1 for v in arg('--frames', ','.join(str(i + 1) for i in range(count))).split(',')]
search, feather = arg('--search', 10, int), arg('--feather', 4.0, float)
im = Image.open(path).convert('RGBA'); A = np.asarray(im).astype(np.float64); cw, ch = im.width // cols, im.height // rows


def cell(k):
    return A[(k // cols) * ch:(k // cols + 1) * ch, (k % cols) * cw:(k % cols + 1) * cw].copy()


def premul(c):
    out = c.copy(); out[..., :3] *= c[..., 3:4] / 255; return out


yy, xx = np.mgrid[0:ch, 0:cw]
d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)            # 1 on the ellipse
mask = np.clip((1 - d) * min(rx, ry) / feather + .5, 0, 1)             # feathered over ~feather px
refsheet = arg('--ref-sheet')
if refsheet:  # take the face from another sheet's frame (e.g. the resting loop), so fidgets wear the idle face
    rim = np.asarray(Image.open(refsheet).convert('RGBA')).astype(np.float64); rcw, rch = rim.shape[1] // cols, rim.shape[0] // rows
    R = premul(rim[(ref // cols) * rch:(ref // cols + 1) * rch, (ref % cols) * rcw:(ref % cols + 1) * rcw]); ref = -1
else:
    R = premul(cell(ref))
# head region used for matching: the face ellipse grown by 60% (brim edge, side hair, bangs)
hy0, hy1 = int(max(0, cy - ry * 1.9)), int(min(ch, cy + ry * 1.5)); hx0, hx1 = int(max(0, cx - rx * 1.7)), int(min(cw, cx + rx * 1.7))
tmpl = R[hy0:hy1, hx0:hx1]
report = []
for k in frames:
    if k == ref: continue
    C = premul(cell(k)); best = None
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            y0, x0 = hy0 + dy, hx0 + dx
            if y0 < 0 or x0 < 0 or y0 + tmpl.shape[0] > ch or x0 + tmpl.shape[1] > cw: continue
            e = np.abs(C[y0:y0 + tmpl.shape[0], x0:x0 + tmpl.shape[1]] - tmpl).mean()
            if best is None or e < best[0]: best = (e, dx, dy)
    e, dx, dy = best
    m = ndimage.shift(mask, (dy, dx), order=0, mode='constant')[..., None]
    src = ndimage.shift(R, (dy, dx, 0), order=0, mode='constant')
    out = src * m + C * (1 - m)                                            # premultiplied
    a = out[..., 3:4]; rgb = np.where(a > 0, out[..., :3] * 255 / np.maximum(a, 1e-6), 0)
    res = np.concatenate([rgb, a], -1).clip(0, 255)
    A[(k // cols) * ch:(k // cols + 1) * ch, (k % cols) * cw:(k % cols + 1) * cw] = res
    report.append((k + 1, dx, dy, round(e, 1)))
print(path.replace('\\', '/').split('/assets/')[-1], 'frame, shift, match error:', report)
if '--dry' not in sys.argv:
    Image.fromarray(A.round().astype(np.uint8), 'RGBA').save(path, 'WEBP', lossless=True, method=6, exact=True)
