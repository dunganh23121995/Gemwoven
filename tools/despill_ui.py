"""Remove the magenta fringe the chroma key left on the outer rim of drawn UI pieces: in a band a few pixels inside the
silhouette, pixels whose red and blue both stand well above green are pulled to a warm dark brown (the kit's outline
colour), keeping their brightness. Interior colours are untouched."""
import glob, sys
import numpy as np
from PIL import Image
from scipy import ndimage

for f in sys.argv[1:] or glob.glob('D:/Project/Gemwoven/assets/gemwoven/ui-kit/*.webp'):
    im = Image.open(f).convert('RGBA')
    a = np.array(im).astype(np.float32)
    alpha = a[..., 3] > 8
    band = alpha & ~ndimage.binary_erosion(alpha, iterations=7)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pink = band & (r - g > 18) & (b - g > 12)
    if not pink.any():
        continue
    lum = (r + g + b) / 3
    # warm brown with the same lightness: r : g : b = 1.25 : 0.95 : 0.8
    a[..., 0] = np.where(pink, np.clip(lum * 1.25, 0, 255), r)
    a[..., 1] = np.where(pink, np.clip(lum * 0.95, 0, 255), g)
    a[..., 2] = np.where(pink, np.clip(lum * 0.80, 0, 255), b)
    Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA').save(f, quality=92, method=6)
    print(f.split('/')[-1].split('\\')[-1], int(pink.sum()))
