"""Pack Mika's form-2/3 skill FX (raw ImageGen sheets on #FF00FF) into runtime strips.

Each <name>/raw-sheet.png is keyed (soft magenta matte, colour un-mixed from the key), cut into its
grid cells and packed left-to-right into <name>.webp; fx.json (read by build.py as
ART.heroFx.fire.<name>) records the frame count, timing and, for the long weapon strips, where the
weapon's base sits in a frame (the point that is pinned to Mika's hands).

Weapon strips (blade2, glaive3) are aligned per frame on their base flame knot, so a frame drawn
shorter or shifted still grows out of the same point.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
KEY = np.array([255, 0, 255], dtype=np.float32)

# name: (cols, rows, out_w, out_h, frame ms, kind)
FX = {
    "blade2": (1, 3, 768, 230, 70, "weapon"),
    "glaive3": (1, 3, 768, 230, 70, "weapon"),
    "ring3": (1, 4, 768, 128, 70, "fx"),
    "impact2": (2, 2, 384, 384, 80, "fx"),
    "impact3": (2, 2, 384, 384, 85, "fx"),
    "slash2": (2, 2, 320, 320, 45, "fx"),
    "slash3": (2, 2, 320, 320, 45, "fx"),
    "engulf3": (3, 2, 384, 384, 110, "fire"),
    "arc2s": (2, 2, 576, 384, 60, "fire"),
}


def key_out(img):
    """Soft matte: distance from pure magenta -> alpha, then remove the key colour from edges."""
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    dist = np.sqrt(((a - KEY) ** 2).sum(axis=2))
    alpha = np.clip((dist - 95) / 85, 0, 1)
    # Un-mix: observed = alpha * colour + (1 - alpha) * key.
    safe = np.maximum(alpha, 1e-3)[..., None]
    colour = np.clip((a - (1 - alpha[..., None]) * KEY) / safe, 0, 255)
    # Any magenta cast that survives (pink fringe) fades out.
    spill = np.minimum(colour[..., 0], colour[..., 2]) - colour[..., 1]
    alpha *= 1 - np.clip((spill - 40) / 60, 0, 1)
    alpha[alpha < .04] = 0
    return Image.fromarray(np.dstack([colour, alpha * 255]).astype("uint8"), "RGBA")


def fire_only(img):
    """A fire is never greener than it is red: a pink haze the key un-mixed into grey-green is dropped."""
    a = np.asarray(img, dtype=np.float32).copy()
    r, g = a[..., 0], a[..., 1]
    a[..., 3] *= np.clip(1 - (g - r) / 25, 0, 1)   # white-hot cores (r == g) stay
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def base_point(frame):
    """Leftmost solid pixel near the frame's vertical middle: the weapon's base knot."""
    al = np.asarray(frame.getchannel("A")) > 128
    h = al.shape[0]
    band = al[int(h * .3):int(h * .7)]
    cols = np.nonzero(band.any(axis=0))[0]
    x = int(cols.min())
    ys = np.nonzero(al[:, x:x + 6].any(axis=1))[0]
    return x, float(ys.mean())


def main():
    meta = {}
    for name, (cols, rows, ow, oh, ms, kind) in FX.items():
        raw = key_out(Image.open(ROOT / name / "raw-sheet.png"))
        cw, ch = raw.width / cols, raw.height / rows
        frames = []
        if kind == "weapon":
            # A big crescent may spill past its strip: every piece goes to the strip holding its
            # centre and is cut out whole, with room above and below.
            alpha = np.asarray(raw.getchannel("A")) > 10
            labels, count = ndimage.label(alpha)
            centres = ndimage.center_of_mass(alpha, labels, range(1, count + 1))
            pad = round((oh / ow * cw - ch) / 2)
            arr = np.asarray(raw)
            for r in range(rows):
                own = [j + 1 for j, (y, x) in enumerate(centres) if min(rows - 1, int(y // ch)) == r]
                top = round(r * ch) - pad
                cut = np.zeros((round(ch) + 2 * pad, raw.width, 4), dtype=np.uint8)
                y0, y1 = max(0, top), min(raw.height, top + cut.shape[0])
                keep = np.isin(labels[y0:y1], own)
                cut[y0 - top:y1 - top] = np.where(keep[..., None], arr[y0:y1], 0)
                frames.append(Image.fromarray(cut, "RGBA").resize((ow, oh), Image.Resampling.LANCZOS))
        for i in range(cols * rows) if kind != "weapon" else []:
            c, r = i % cols, i // cols
            cell = raw.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            cell = cell.resize((ow, oh), Image.Resampling.LANCZOS)
            frames.append(fire_only(cell) if kind == "fire" else cell)
        entry = {"file": f"assets/fx/heroes/fire/{name}.webp", "count": len(frames), "frameDuration": ms,
                 "width": ow, "height": oh}
        if kind == "weapon":
            # Every frame's base knot on one point (3% in, vertical middle).
            target = (round(ow * .03), oh / 2)
            aligned = []
            for f in frames:
                bx, by = base_point(f)
                out = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
                out.paste(f, (target[0] - bx, round(target[1] - by)), f)
                aligned.append(out)
            frames = aligned
            entry["base"] = [round(target[0] / ow, 4), .5]
        strip = Image.new("RGBA", (ow * len(frames), oh), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            strip.alpha_composite(f, (ow * i, 0))
        strip.save(ROOT / f"{name}.webp", "WEBP", quality=92, alpha_quality=95, method=6)
        meta[name] = entry
        print("[ok]", name, strip.size)
    (ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
