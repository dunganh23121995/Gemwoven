"""Water masks for the flowing-waterfall overlays: alpha marks bright blue-white painted water.

living-motion.js only animates inside its authored waterfall rectangles; this mask keeps
the shimmer off the rocks and leaves inside those rectangles. Output: water-<scene>.webp.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
manifest = json.loads((REPO / "assets/gemwoven/manifest.json").read_text(encoding="utf-8"))
for scene in ("home", "summon", "arena"):
    source = manifest["background-" + scene]["file"]
    rgb = np.asarray(Image.open(REPO / source).convert("RGB").resize((941, 1672)), dtype=np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    water = np.clip((b - 150) / 50, 0, 1) * np.clip((b - r + 5) / 30, 0, 1) * np.clip((g - 120) / 50, 0, 1)
    mask = Image.fromarray((water * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.5))
    alpha = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    alpha.putalpha(mask)
    alpha.save(ROOT / f"water-{scene}.webp", "WEBP", quality=80, alpha_quality=70, method=6)
    print(scene, source, round(float(water.mean()), 3))
