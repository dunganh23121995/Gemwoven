"""The popup frame without its crown ornament, and the crown alone (owner 08/11: "khung hình elip bọc biểu tượng tròn ... bị bóp
méo?"). Popups draw settings-frame as a 9-slice: the crown sits in the top-middle slice, which is squeezed in height and stretched
in width, so its round cartouche turned oval. The crown now rides as its own picture at its own proportions (ui.css
.gw-emblem::before) and the frame's top bar is patched with its own plain bar beside it.
Outputs: assets/gemwoven/items/dialog-frame.png, dialog-crown.png. settings-frame.png itself is untouched (Hòm Thư and Cài Đặt
show it whole)."""
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[4]
src = Image.open(REPO / 'assets/gemwoven/items/settings-frame.png').convert('RGBA')
a = np.array(src)
X0, X1, Y1 = 270, 490, 112          # the crown's box (the gear medallion, its two scrolls and leaves)
BAR = 78                            # the bar's top rim starts here; above it the crown stands on the transparent sky
c = a[0:Y1, X0:X1].copy()
yy, xx = np.mgrid[0:Y1, 0:X1 - X0]
c[(yy >= BAR) & (np.hypot(xx - 110, yy - 56) > 45)] = 0   # below the rim only the round medallion stays; the bar is the frame's
crown = Image.fromarray(c)
crown = crown.crop(crown.getbbox())
crown.save(REPO / 'assets/gemwoven/items/dialog-crown.png')
out = a.copy()
out[0:BAR, X0:X1] = 0
strip = a[BAR:Y1, X1:X1 + 60]                   # the plain bar just right of the crown (clear of the leaves)
for x in range(X0, X1, strip.shape[1]):
    w = min(strip.shape[1], X1 - x)
    out[BAR:Y1, x:x + w] = strip[:, :w]
Image.fromarray(out).save(REPO / 'assets/gemwoven/items/dialog-frame.png')
print(crown.size)
