"""Mask of the crowning crest (brass star + blue crystal) at the top of the summon painting.

living-motion.js draws this part of the painting again above the turning rays and sparkles,
so the light spreads from behind the crystal instead of washing over it (owner 08/11).
Output: crest-summon.webp, 941x1672 alpha (the painting's layout size).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
manifest = json.loads((REPO / "assets/gemwoven/manifest.json").read_text(encoding="utf-8"))
source = manifest["background-summon"]["file"]
rgb = np.asarray(Image.open(REPO / source).convert("RGB").resize((941, 1672)), dtype=np.float32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
# The crest's outline, traced on the painting: eight brass points around the crystal.
hull = [(470, 79), (493, 101), (518, 102), (523, 129), (532, 146), (517, 171), (514, 182), (500, 186),
        (473, 214), (443, 186), (428, 182), (424, 171), (409, 146), (419, 129), (422, 102), (446, 101)]
inside = Image.new("L", (941, 1672), 0)
ImageDraw.Draw(inside).polygon(hull, fill=255)
inside = np.asarray(inside) > 0
# Sky, leaves and the dark gaps between them never belong to the crest; the crystal is blue too but is enclosed by brass.
sky = (b - r > 90) & (g > 120)
leaf = ((g > r + 8) & (g > b)) | ((r + g + b) / 3 < 40)
open_ = ~inside | ((sky | leaf) & inside)
lab, _ = ndimage.label(open_)
outside = np.isin(lab, np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
crest = inside & ~outside
crest = ndimage.binary_opening(crest, iterations=1)
lab, n = ndimage.label(crest)
crest = lab == (1 + int(np.argmax(ndimage.sum(crest, lab, range(1, n + 1)))))
crest = ndimage.binary_fill_holes(crest)
mask = Image.fromarray((crest * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.8))
alpha = Image.new("RGBA", mask.size, (0, 0, 0, 0))
alpha.putalpha(mask)
alpha.save(ROOT / "crest-summon.webp", "WEBP", quality=80, alpha_quality=80, method=6)
print(source, crest.sum(), Image.fromarray(crest).getbbox())
