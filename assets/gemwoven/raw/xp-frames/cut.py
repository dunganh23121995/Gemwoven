"""Key the redrawn season avatar frames off magenta (unmixing the magenta from soft edges) and save them as the season
frames. The build measures their opening, hole and gauge groove (scripts/build_gemwoven.py)."""
import sys
import numpy as np
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
SEASON = HERE.parents[1] / 'season'
for key in sys.argv[1:] or ['mika', 'yuki', 'nori', 'lumi', 'noct', 'hiro']:
    a = np.asarray(Image.open(HERE / key / 'raw.png').convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
    alpha = np.clip((d - 50) / 90, 0, 1)
    m = np.array([255, 0, 255], np.float32)
    k = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - (1 - k) * m) / k, 0, 255)                  # unmix the magenta from soft edges
    im = Image.fromarray(np.dstack([rgb, alpha * 255]).astype('uint8'), 'RGBA')
    box = im.getbbox()
    edge = box[0] < 2 or box[1] < 2 or box[2] > im.width - 2 or box[3] > im.height - 2
    im = im.crop(box)
    pad = round(max(im.size) * .02)
    cv = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad))
    cv.alpha_composite(im, (pad, pad))
    cv.thumbnail((460, 500), Image.LANCZOS)
    cv.save(SEASON / key / 'frame.webp', quality=92, method=6)
    print(key, cv.size, 'TOUCHES EDGE' if edge else '')
