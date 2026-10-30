"""Noct four-star (moon ronin) ultimate art, read by the game as ART.heroFx.shadow (src/forms-noct.js).

moon/raw.png           the crescent moon that rises behind the foe (painted on black, additive)
straight-cuts/raw.png  four straight samurai cut lines, one per row (painted on black, additive)
blood-moon/raw.png     the six-star reaper's blood moon behind the foe (painted on black; the moon kept solid)
Black becomes transparent: alpha is the brightest channel, the colour un-premultiplied.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]


def keyed(img):
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
    a = rgb.max(-1)
    a = np.where(a < 6, 0, a)
    col = np.where(a[..., None] > 0, rgb * 255 / np.maximum(a[..., None], 1), 0)
    return Image.fromarray(np.dstack([col, a]).clip(0, 255).astype("uint8"), "RGBA")


fx = {}
moon = keyed(Image.open(HERE / "moon/raw.png").resize((640, 640), Image.Resampling.LANCZOS))
moon.save(HERE / "moon.webp", quality=88, alpha_quality=85, method=6)
fx["moon"] = {"file": "assets/fx/heroes/shadow/moon.webp", "count": 1, "width": 640, "height": 640}

raw = Image.open(HERE / "straight-cuts/raw.png").convert("RGB")
row = raw.height / 4
lines = Image.new("RGBA", (1024, 128 * 4))
for i in range(4):
    part = raw.crop((0, round(i * row), raw.width, round((i + 1) * row))).resize((1024, 128), Image.Resampling.LANCZOS)
    lines.alpha_composite(keyed(part), (0, i * 128))
lines.save(HERE / "lines.webp", quality=90, alpha_quality=90, method=6)
fx["lines"] = {"file": "assets/fx/heroes/shadow/lines.webp", "count": 4, "rows": 4, "width": 1024, "height": 512}

blood = Image.open(HERE / "blood-moon/raw.png").convert("RGB").resize((640, 640), Image.Resampling.LANCZOS)
rgb = np.asarray(blood, dtype=np.float32)
a = np.clip(rgb.max(-1) * 3, 0, 255)   # the glow and the clouds fade out over the black
yy, xx = np.mgrid[0:640, 0:640]
a[np.hypot(yy - 318, xx - 318) < 640 * .392] = 255   # the moon itself is solid
Image.fromarray(np.dstack([rgb, a]).astype("uint8"), "RGBA").save(HERE / "blood.webp", quality=88, alpha_quality=85, method=6)
fx["blood"] = {"file": "assets/fx/heroes/shadow/blood.webp", "count": 1, "width": 640, "height": 640}

(HERE / "fx.json").write_text(json.dumps(fx, indent=2) + "\n", encoding="utf-8")
print("wrote", ", ".join(fx))
