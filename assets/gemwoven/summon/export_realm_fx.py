"""Effect strips for the living realm scenes (living-motion.js): lightning bolts and soft wisps.

bolts/raw-sheet.png: 4 bolts painted on black (additive), alpha = brightest channel, colour
un-premultiplied. wisps/raw-sheet.png: 4 white smoke/cloud wisps on black, alpha = brightness,
tinted per scene by CSS (the strip is used as a mask). Output: runtime/bolts.webp, runtime/wisps.webp.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def strip(sheet, count, cell, keyed):
    im = Image.open(ROOT / sheet).convert("RGB")
    w = im.width / count
    cells = [im.crop((round(i * w), 0, round((i + 1) * w), im.height)).resize(cell, Image.LANCZOS) for i in range(count)]
    out = Image.new("RGBA", (cell[0] * count, cell[1]))
    for i, c in enumerate(cells):
        out.paste(keyed(np.asarray(c, dtype=np.float32)), (i * cell[0], 0))
    return out


def additive(rgb):
    a = rgb.max(-1)
    col = np.where(a[..., None] > 0, rgb * 255 / np.maximum(a[..., None], 1), 0)
    return Image.fromarray(np.dstack([col, a]).clip(0, 255).astype("uint8"), "RGBA")


def luminous(rgb):
    a = np.clip((rgb.mean(-1) - 8) * 1.15, 0, 255)
    return Image.fromarray(np.dstack([np.full_like(rgb, 255), a]).astype("uint8"), "RGBA")


meta = {}
for name, sheet, cell, keyed in (("bolts", "bolts/raw-sheet.png", (256, 768), additive),
                                 ("wisps", "wisps/raw-sheet.png", (384, 512), luminous)):
    out = strip(sheet, 4, cell, keyed)
    path = ROOT / "runtime" / f"{name}.webp"
    out.save(path, "WEBP", quality=85, alpha_quality=80, method=6)
    meta[f"summon-{name}"] = {"file": path.relative_to(REPO).as_posix(), "width": out.width, "height": out.height, "count": 4}

for name in ("assets/gemwoven/summon/summon.json", "assets/gemwoven/manifest.json"):
    path = REPO / name
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    data.update(meta)
    nl = "\r\n" if "\r\n" in text else "\n"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False).replace("\n", nl) + nl, encoding="utf-8", newline="")
