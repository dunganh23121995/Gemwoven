"""Pack the hub's ambient sprites (birds, butterflies, leaves, waterfall foam, forge fire,
summon vortex) into horizontal WebP strips plus ambient.json for the hub build."""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
SPRITES = {"bird": (4, 110), "butterfly": (4, 90), "leaf": (4, 160), "foam": (8, 90), "forge": (8, 90), "portal": (8, 95)}
CELL = 192


def despill(frame):
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    a[..., 3] *= 1 - np.clip((spill - 18) / 60, 0, 1)
    a[..., 0] = np.where(spill > 18, np.minimum(r, g + 18 + (r - g) * .3), r)
    a[..., 2] = np.where(spill > 18, np.minimum(b, g + 18 + (b - g) * .3), b)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (count, ms) in SPRITES.items():
    strip = Image.new("RGBA", (CELL * count, CELL), (0, 0, 0, 0))
    for i in range(count):
        strip.alpha_composite(despill(Image.open(ROOT / name / f"{name}-{i + 1}.png").convert("RGBA")), (CELL * i, 0))
    strip.save(ROOT / f"{name}.webp", "WEBP", quality=92, alpha_quality=100, method=6)
    meta[name] = {"file": f"assets/gemwoven/ambient/{name}.webp", "count": count, "frameDuration": ms}
(ROOT / "ambient.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
print("packed", len(meta))
