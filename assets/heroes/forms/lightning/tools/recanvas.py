"""recanvas.py <raw.png> <out.png> <N>: an entrance whose effect (a tall lightning bolt) is taller than Codex's own
2x4 cell. Each drawing is cut out of the sheet at the empty gaps between rows (as realign.py) and pasted, unscaled, into
a bigger N x N cell on a key-coloured canvas, keeping its position relative to its cell's bottom and centre line.
The shared processor then resamples every cell the same way, so the frames keep one common scale."""
import sys, numpy as np
from PIL import Image
src, dst, N = sys.argv[1], sys.argv[2], int(sys.argv[3]); feet = "--feet" in sys.argv  # put every drawing's lowest point on one line (Codex let the rows drift)
im = Image.open(src).convert("RGB"); a = np.asarray(im).astype(int)
H, W = a.shape[0] // 4, a.shape[1] // 2
r, g, b = a[..., 0], a[..., 1], a[..., 2]
bg = (g - np.maximum(r, b)) > 60
out = Image.new("RGB", (2 * N, 4 * N), (0, 255, 0))
for c in range(2):
    rows = (~bg[:, c * W:(c + 1) * W]).sum(1) > 2
    cuts = [0]
    for k in (1, 2, 3):
        empty = np.where(~rows)[0]; near = empty[np.abs(empty - k * H) < H * .35]
        best = near[np.argmin(np.abs(near - k * H))]; lo = hi = best
        while lo - 1 >= 0 and not rows[lo - 1]: lo -= 1
        while hi + 1 < len(rows) and not rows[hi + 1]: hi += 1
        cuts.append((lo + hi) // 2)
    cuts.append(a.shape[0])
    for k in range(4):
        piece = im.crop((c * W, cuts[k], (c + 1) * W, cuts[k + 1]))
        mask = Image.fromarray(((~bg[cuts[k]:cuts[k + 1], c * W:(c + 1) * W]) * 255).astype("uint8"))
        # bottom of the original cell k sits at (k+1)*H; keep each drawing's distance to it
        y = (k + 1) * N - ((k + 1) * H - cuts[k])
        if feet:   # crop the band to the drawing itself, then stand its lowest point on the line
            ys = np.where((~bg[cuts[k]:cuts[k + 1], c * W:(c + 1) * W]).sum(1) > 2)[0]
            t0, t1 = cuts[k] + ys.min(), cuts[k] + ys.max() + 1
            piece = im.crop((c * W, t0, (c + 1) * W, t1))
            mask = Image.fromarray(((~bg[t0:t1, c * W:(c + 1) * W]) * 255).astype("uint8"))
            y = (k + 1) * N - round(H * .06) - piece.height
        y = max(k * N, min(y, (k + 1) * N - piece.height))
        out.paste(piece, (c * N + (N - W) // 2, y), mask)
        print(f"cell {k * 2 + c + 1}: rows {cuts[k]}-{cuts[k + 1]} -> y {y - k * N} in a {N} cell")
out.save(dst)
