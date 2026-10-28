"""Mika form 2, second design (upright, form-1 body): key the approved Codex drawing
(form-2/source/raw-master-v2.png) into the 256 px master every form-2 sheet is drawn from.

Placed like the first design: soles on row 240 (footY .94), boots centred on x 133, the body
(ear tips to soles) 190 px tall; the raised blade may reach above the ears.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".codex/skills/generate2dsprite/scripts"))
from generate2dsprite import remove_bg_magenta  # noqa: E402

SOLE, FEET_X, BODY = 240, 133, 190
form = ROOT / "form-2"
clean = remove_bg_magenta(Image.open(form / "source/raw-master-v2.png").convert("RGBA"), 100, 150)
alpha = np.asarray(clean.getchannel("A")) > 24
labels, count = ndimage.label(alpha)
areas = ndimage.sum(alpha, labels, range(1, count + 1))
keep = np.isin(labels, [i + 1 for i, a in enumerate(areas) if a >= 300])
arr = np.asarray(clean).copy(); arr[..., 3] = np.where(keep, arr[..., 3], 0)
clean = Image.fromarray(arr, "RGBA")
ys, xs = np.nonzero(keep)
x0, x1 = xs.min(), xs.max(); w = x1 - x0
# Ear tips: the top of the figure in its middle band (the blade rises on the right).
band = keep[:, int(x0 + w * .3):int(x0 + w * .62)]
crown, sole = np.nonzero(band.any(1))[0][0], ys.max()
# Boots: the bottom 7% of the body.
low = keep[int(sole - (sole - crown) * .07):sole + 1]
feet_x = np.nonzero(low.any(0))[0].mean()
k = BODY / (sole - crown)
small = clean.resize((round(clean.width * k), round(clean.height * k)), Image.Resampling.LANCZOS)
out = Image.new("RGBA", (256, 256))
out.paste(small, (round(FEET_X - feet_x * k), round(SOLE - sole * k)), small)
for path in [form / "master.png", form / "combat-idle/master.png"]:
    out.save(path)
print("master: crown", round(SOLE - BODY), "bbox", out.getbbox())
# The same placement at 512 px for the combat idle (wind_idle.py builds on master-512.png when it
# exists): two sheet pixels per display pixel, sharp on dense screens like form 3.
big = clean.resize((round(clean.width * k * 2), round(clean.height * k * 2)), Image.Resampling.LANCZOS)
hi = Image.new("RGBA", (512, 512))
hi.paste(big, (round(2 * (FEET_X - feet_x * k)), round(2 * (SOLE - sole * k))), big)
hi.save(form / "combat-idle/master-512.png")
# Portrait: the face of the full-size drawing, framed like form 1's (eyes a little above the middle).
EYES = (138, 93.5)   # eye midpoint in the 256 px master (head-scale.json fire-2 combat)
ex, ey = (EYES[0] - (FEET_X - feet_x * k)) / k, (EYES[1] - (SOLE - sole * k)) / k
half = 62 / k   # 124 master px across: head, shoulders and the sword hand, like the other portraits
clean.crop((round(ex - half), round(ey - half * .9), round(ex + half), round(ey + half * 1.1))).resize((256, 256), Image.Resampling.LANCZOS).save(form / "portrait.png")
print("portrait from", round(ex), round(ey))
