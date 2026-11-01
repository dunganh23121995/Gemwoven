"""Moving water and lava on the chapter map paintings (assets/gemwoven/backgrounds/chapters/<theme>.webp).

boxes.json (read off each painting by Codex over a 100px grid): every waterfall ("fall"), stream ("stream", with its
flow direction in degrees, 90 = down) and lava fall/stream, as a box in the painting's 941x1672 pixels.
Inside each box the liquid's own pixels make the mask (water: bright, pale, bluish; lava: bright orange-yellow), so
the hub's flowing texture (atlas/ui/water-flow.webp) moves only over the painted water.

Usage: python flow.py   -> <theme>-<water|lava>-<fall|stream>.webp masks (half size) and assets/gemwoven/chapter-flow-items.json
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]


def liquid(a, lava):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (r + g + b) / 3; sat = (a.max(2) - a.min(2)) / (a.max(2) + 1e-4)
    if lava:
        return (r > .78) & (g > .32) & (b < .55) & (lum > .45)
    # Painted water is cyan-blue; the white clouds behind the falls are not.
    return (lum > .5) & (sat < .6) & (b - r > .06) & (g >= r)


def build():
    boxes = json.loads((HERE / "boxes.json").read_text(encoding="utf-8"))
    items = {}
    for theme, areas in sorted(boxes.items()):
        a = np.asarray(Image.open(HERE.parent / f"{theme}.webp").convert("RGB")).astype(np.float32) / 255
        masks, streams = {}, []
        for e in areas:
            lava = e["kind"].startswith("lava"); kind = "fall" if e["kind"].endswith("fall") else "stream"
            x0, y0, x1, y1 = [int(round(v)) for v in e["box"]]
            x0, y0, x1, y1 = max(0, x0), max(0, y0), min(a.shape[1], x1), min(a.shape[0], y1)
            if x1 - x0 < 4 or y1 - y0 < 4:
                continue
            key = ("lava" if lava else "water", kind)
            m = masks.setdefault(key, np.zeros(a.shape[:2], np.float32))
            # The box's edges taper off (a soft window), so no straight box edge can show.
            h, w = y1 - y0, x1 - x0
            wy = np.clip(np.minimum(np.arange(h), np.arange(h)[::-1]) / max(2, h * .12), 0, 1)
            wx = np.clip(np.minimum(np.arange(w), np.arange(w)[::-1]) / max(2, w * .2), 0, 1)
            win = wy[:, None] * wx[None, :]
            m[y0:y1, x0:x1] = np.maximum(m[y0:y1, x0:x1], liquid(a[y0:y1, x0:x1], lava) * win)
            if kind == "stream":
                streams.append({"material": key[0], "box": [x0, y0, x1, y1], "dir": float(e.get("dir", 90))})
        for (material, kind), m in masks.items():
            soft = ndimage.gaussian_filter(ndimage.grey_opening(m, size=(3, 2)), 1.5)
            alpha = (np.clip(soft * 1.4, 0, 1) * 255).astype("uint8")
            im = Image.fromarray(np.dstack([np.full_like(alpha, 255)] * 3 + [alpha]), "RGBA").resize((471, 836), Image.LANCZOS)
            name = f"{theme}-{material}-{kind}.webp"
            im.save(HERE / name, "WEBP", quality=80, method=6)
            entry = {"file": f"backgrounds/chapters/flow/{name}", "width": 471, "height": 836, "textless": True, "transparent": True}
            if kind == "stream":
                entry["streams"] = [s for s in streams if s["material"] == material]
            items[f"flow-{theme}-{material}-{kind}"] = entry
    out = {"version": 1, "purpose": "Masks of the moving water and lava on each chapter map painting (flow.py)", "items": items}
    (ROOT / "assets/gemwoven/chapter-flow-items.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    return len(items)


if __name__ == "__main__":
    print(build(), "masks")
