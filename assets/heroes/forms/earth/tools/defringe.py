"""defringe.py <image> [...]: remove the magenta chroma-key fringe left on Nori's outlines.
Only outline pixels (within 3 px of transparency; soft ones, or opaque ones of a saturated key colour) whose colour is key-like
(red and blue both well above green, blue not far below red, so pale pink blossoms are spared) are touched:
their colour is pulled to neutral and their alpha faded by how magenta they were. Nothing is drawn or warped.
--strong also neutralises the milder purple outline tint within 4 px of the edge (for portraits).
Rewrites each file in place (WebP lossless / PNG)."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
strong = '--strong' in sys.argv
for p in [a for a in sys.argv[1:] if not a.startswith('--')]:
    a = np.asarray(Image.open(p).convert('RGBA'), dtype=np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    near = ndimage.binary_dilation(al < 100, iterations=3) & (al > 0)
    # soft outline pixels, or opaque outline pixels of a saturated key colour (dark green channel: pale pink
    # blossoms keep their high green and are never touched)
    key = near & (r - g > 30) & (b - g > 25) & (b > r - 60) & ((al < 235) | ((g < 110) & (b - g > 45)))
    if strong:  # portraits: also the milder purple outline tint (dark green channel, pale blossoms spared)
        key |= ndimage.binary_dilation(al < 100, iterations=4) & (al > 0) & (r - g > 15) & (b - g > 15) & (g < 140)
    k = np.clip((np.minimum(r, b) - g) / 90, 0, 1)
    n = int(key.sum())
    a[..., 0] = np.where(key, g + (r - g) * .2, r)
    a[..., 2] = np.where(key, g + (b - g) * .1, b)
    a[..., 3] = np.where(key, al * (1 - .75 * k), al)
    out = Image.fromarray(a.round().clip(0, 255).astype('uint8'), 'RGBA')
    if p.endswith('.webp'): out.save(p, lossless=True, method=6, exact=True)
    else: out.save(p)
    print(f'{p}: {n} fringe px')
