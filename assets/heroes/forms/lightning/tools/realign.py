"""realign.py <raw.png> <out.png>: Codex sometimes draws the 2x4 rows off the grid (a pose pokes into the
cell above). Per column, cut the sheet at the empty key-colour gaps nearest the nominal row lines and
move each drawing (translation only, nothing redrawn or scaled) so its lowest point sits on 94% of its own cell."""
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; minimal = '--minimal' in sys.argv  # keep each drawing where it is, moved only as far as needed to sit inside its cell
im = Image.open(src).convert("RGB"); a = np.asarray(im).astype(int)
H, W = a.shape[0] // 4, a.shape[1] // 2
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = (g - np.maximum(r, b)) > 60
magenta = (np.minimum(r, b) - g) > 60
bgmask = green if green.mean() > magenta.mean() else magenta
key = (0, 255, 0) if green.mean() > magenta.mean() else (255, 0, 255)
out = Image.new("RGB", im.size, key)
for c in range(2):
    fg = ~bgmask[:, c * W:(c + 1) * W]
    rows = fg.sum(1) > 2
    cuts = [0]
    for k in (1, 2, 3):
        empty = np.where(~rows)[0]
        near = empty[np.abs(empty - k * H) < H * .35]
        if not len(near):
            raise SystemExit(f"no gap near row line {k} in column {c}")
        # the empty run closest to the nominal line; cut at its middle
        best = near[np.argmin(np.abs(near - k * H))]
        lo = hi = best
        while lo - 1 >= 0 and not rows[lo - 1]: lo -= 1
        while hi + 1 < len(rows) and not rows[hi + 1]: hi += 1
        cuts.append((lo + hi) // 2)
    cuts.append(a.shape[0])
    for k in range(4):
        band = fg[cuts[k]:cuts[k + 1]]
        ys = np.where(band.any(1))[0]
        top, bot = cuts[k] + ys.min(), cuts[k] + ys.max()
        piece = im.crop((c * W, top, (c + 1) * W, bot + 1))
        y = k * H + round(H * .94) - piece.height
        if minimal:
            y = min(max(top, k * H + 2), (k + 1) * H - 2 - piece.height)
        y = max(k * H + 2, y)
        if y + piece.height > (k + 1) * H:
            print(f"cell {k * 2 + c + 1}: drawing {piece.height}px taller than the room left, kept touching")
        out.paste(piece, (c * W, y))
        print(f"cell {k * 2 + c + 1}: band {cuts[k]}-{cuts[k + 1]} moved {y - top:+d}px")
out.save(dst)
