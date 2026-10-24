"""profile.py sheet x0 x1 ...: top silhouette y per frame for column bands (ymin,ymax search)"""
import sys, numpy as np
from PIL import Image
im = np.asarray(Image.open(sys.argv[1]).convert("RGBA"))[..., 3] > 128
ch, cw = im.shape[0] // 4, im.shape[1] // 2
ylo = int(sys.argv[2]); bands = [tuple(map(int, b.split("-"))) for b in sys.argv[3:]]
for i in range(8):
    f = im[(i // 2) * ch:(i // 2 + 1) * ch, (i % 2) * cw:(i % 2 + 1) * cw]
    row = []
    for a, b in bands:
        tops = [np.argmax(f[ylo:, x]) + ylo for x in range(a, b)]
        row.append(round(float(np.median(tops)), 1))
    print(i + 1, row)
