"""Put every frame of a planted-feet sheet on the first frame's boots (midpoint of the two boots,
sole row): the model sometimes draws a pose a little to the side in its cell, which shows as the whole
body jumping in game. Frames are only translated, never scaled. Prints each frame's shift (cell px) so
the kit's grip tables can be moved by the same amount.
usage: python realign_feet.py <sheet.webp> <cols> <rows> [frames to align, 0-based, comma] [--ref N]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def boots(cell):
    a = np.asarray(cell)[..., 3] > 100
    ys = np.nonzero(a.any(1))[0]; sole = ys.max(); h = sole - ys.min()
    band = a[sole - int(h * .07):sole + 1]
    lab, k = ndimage.label(band)
    comps = sorted(((ndimage.sum(band, lab, i), ndimage.center_of_mass(band, lab, i)[1]) for i in range(1, k + 1)), reverse=True)[:2]
    return float(np.mean([c[1] for c in comps])), int(sole)


def main():
    path, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    pick = [int(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else None
    ref = int(sys.argv[sys.argv.index("--ref") + 1]) if "--ref" in sys.argv else 0
    sheet = Image.open(path).convert("RGBA"); cw, ch = sheet.width // cols, sheet.height // rows
    cells = [sheet.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)) for i in range(cols * rows)]
    rx, rs = boots(cells[ref])
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for i, c in enumerate(cells):
        dx, dy = 0, 0
        if pick is None or i in pick:
            x, s = boots(c); dx, dy = round(rx - x), rs - s
        moved = Image.new("RGBA", c.size, (0, 0, 0, 0)); moved.paste(c, (dx, dy), c)
        out.paste(moved, ((i % cols) * cw, (i // cols) * ch))
        print(f"frame {i}: dx {dx:+d} dy {dy:+d}")
    out.save(path, lossless=True, method=6)


if __name__ == "__main__":
    main()
