"""Copy a region of one frame into others where they differ (a part that pops: an ear twitch with ghost
outlines, a tail that jumps). Only pixels that differ from the source frame inside the box (grown a few
px for the antialiased rim) are replaced, so neighbouring parts that legitimately move are kept.
usage: python patch_frames.py <sheet> <cols> <rows> <src frame 1-based> <dst frames 1-based,comma> <x0,y0,x1,y1 cell px> [grow]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

path, cols, rows, src, dsts, box = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]) - 1, [int(x) - 1 for x in sys.argv[5].split(",")], [int(v) for v in sys.argv[6].split(",")]
grow = int(sys.argv[7]) if len(sys.argv) > 7 else 3
sheet = np.asarray(Image.open(path).convert("RGBA")).copy()
ch, cw = sheet.shape[0] // rows, sheet.shape[1] // cols
cell = lambda i: sheet[(i // cols) * ch:(i // cols + 1) * ch, (i % cols) * cw:(i % cols + 1) * cw]
s = cell(src).copy()
x0, y0, x1, y1 = box
for d in dsts:
    c = cell(d)
    diff = (np.abs(c.astype(int) - s.astype(int)).sum(axis=2) > 40)
    m = np.zeros_like(diff); m[y0:y1, x0:x1] = diff[y0:y1, x0:x1]
    m = ndimage.binary_dilation(m, iterations=grow); m[:y0, :] = m[y1:, :] = False; m[:, :x0] = m[:, x1:] = False
    c[m] = s[m]
    print(f"frame {d + 1}: {int(m.sum())} px from frame {src + 1}")
Image.fromarray(sheet, "RGBA").save(path, lossless=True, method=6)
