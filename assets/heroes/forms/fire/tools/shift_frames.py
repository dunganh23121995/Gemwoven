"""Translate whole frames of a sprite sheet (lossless, in place) so a body lines up with another sheet.
Usage: python shift_frames.py <sheet> <cols> <rows> <frame(1-based)>:<dx>,<dy> [...]
Prints each frame's alpha bbox after the move and warns if anything was pushed off the cell."""
import sys
import numpy as np
from PIL import Image
path, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
im = Image.open(path).convert("RGBA"); cw, ch = im.width // cols, im.height // rows
for spec in sys.argv[4:]:
    n, d = spec.split(":"); dx, dy = (int(v) for v in d.split(",")); i = int(n) - 1
    box = ((i % cols) * cw, (i // cols) * ch); cell = im.crop((*box, box[0] + cw, box[1] + ch))
    before = int((np.asarray(cell)[..., 3] > 0).sum())
    moved = Image.new("RGBA", cell.size, (0, 0, 0, 0)); moved.paste(cell, (dx, dy))
    after = int((np.asarray(moved)[..., 3] > 0).sum())
    im.paste(moved, box)
    print(f"frame {n}: moved {dx},{dy} bbox {moved.getbbox()}" + (f"  WARNING lost {before-after} px" if after < before else ""))
im.save(path, lossless=True, quality=100, method=6) if path.endswith(".webp") else im.save(path)
