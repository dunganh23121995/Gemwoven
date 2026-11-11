"""Cut each drawn band strip (band-raw.png) to its painted rows and make its two ends meet without a seam, saved as
band.webp; scripts/build_gemwoven.py wraps it round the frame's groove for the experience gauge."""
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
for key in ['mika', 'yuki', 'nori', 'lumi', 'noct', 'hiro']:
    im = Image.open(HERE / key / 'band-raw.png').convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    magenta = (a[..., 0] > 200) & (a[..., 1] < 70) & (a[..., 2] > 200)
    solid = (a[..., 3] > 230) & ~magenta
    rows = np.flatnonzero(solid.mean(axis=1) > .97)
    top, bot = rows.min(), rows.max()
    trim = round((bot - top) * .06)
    band = a[top + trim:bot - trim + 1, :, :3]
    w = band.shape[1]; k = w // 8                                     # cross-fade the ends into each other
    ramp = np.linspace(0, 1, k)[None, :, None]
    head, tail = band[:, :k], band[:, -k:]
    band = np.concatenate([band[:, k:-k], tail * (1 - ramp) + head * ramp], axis=1)
    Image.fromarray(band.clip(0, 255).astype('uint8'), 'RGB').save(HERE / key / 'band.webp', quality=92, method=6)
    print(key, band.shape)
