"""Masks for the living realm scenes on the summon spotlight (living-motion.js, realm specs).

water-<realm>.webp: alpha marks the painted falling water (or lava) that the flow overlay streams.
glow-<realm>-a/-b.webp: alpha marks what breathes with light (lava seams, runes, aurora, sun shafts,
the temple's red glow), split in two by a smooth random field so its halves breathe out of phase.
Also writes each scene.webp (941 x 1672) from its raw painting; masks are computed from it.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
H, W = 1672, 941


def ramp(v, lo, hi):
    return np.clip((v - lo) / (hi - lo), 0, 1)


def rows(mask, top, bottom):
    out = np.zeros_like(mask)
    out[top:bottom] = mask[top:bottom]
    return out


def masks(realm, rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    sat = rgb.max(-1) - rgb.min(-1)
    pale = ramp(lum, 165, 215) * (1 - ramp(sat, 70, 120))   # white falling water
    if realm == "earth":
        return pale * ramp(b - r, -10, 15), rows(ramp(lum, 205, 245) * ramp(r - b, 10, 50), 0, 760)
    if realm == "fire":
        lava = ramp(r, 200, 240) * ramp(g, 90, 160) * (1 - ramp(b, 110, 170))
        falls = ramp(r, 200, 240) * ramp(g, 90, 160)   # the falls' yellow-white cores too
        return falls, rows(lava, 490, H)   # below the sunset horizon (brightened yellow turns green)
    if realm == "ice":
        aurora = ramp(g - r, 40, 90) * ramp(g, 130, 190)
        return pale * ramp(b - r, 0, 30), rows(aurora, 0, 330)
    if realm == "lightning":
        # The sky's clouds share the runes' blue: only the summit floor and the side crystals glow.
        runes = ramp(b, 225, 250) * ramp(b - r, 40, 90) * ramp(lum, 140, 190)
        y, x = np.mgrid[0:H, 0:W]
        return pale, runes * ((y >= 850) | (((x < 200) | (x > 740)) & (y > 450)))
    if realm == "shadow":
        red = ramp(r - b, 30, 80) * ramp(r, 120, 200)   # the temple's red glow (not the banners)
        red[:, :600] = 0
        return ramp(lum, 150, 200) * (1 - ramp(sat, 80, 130)), rows(red, 380, 560)
    raise ValueError(realm)


def save(mask, path):
    a = Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.5))
    out = Image.new("RGBA", a.size, (0, 0, 0, 0))
    out.putalpha(a)
    out.save(path, "WEBP", quality=80, alpha_quality=70, method=6)


def field(seed):
    """A smooth random 0..1 field (patches about 120 px across)."""
    rnd = np.random.default_rng(seed).random((H // 120 + 2, W // 120 + 2)) * 255
    return np.asarray(Image.fromarray(rnd.astype("uint8")).resize((W, H), Image.BICUBIC), dtype=np.float32) / 255


meta = {}
for realm in ("earth", "fire", "ice", "lightning", "shadow"):
    # scene.webp from its raw painting; the storm sky is the calm repaint (no painted bolts: the game strikes its own).
    raw = ROOT / realm / ("calm/raw-scene.png" if realm == "lightning" else "raw-scene.png")
    scene = Image.open(raw).convert("RGB").resize((W, H), Image.LANCZOS)
    scene.save(ROOT / realm / "scene.webp", quality=88, method=6)
    meta[f"summon-scene-{realm}"] = {"file": (ROOT / realm / "scene.webp").relative_to(REPO).as_posix(), "width": W, "height": H}
    rgb = np.asarray(scene, dtype=np.float32)
    water, glow = masks(realm, rgb)
    split = np.clip((field(len(realm)) - .5) * 3 + .5, 0, 1)
    for kind, mask in (("water", water), ("glow-a", glow * split), ("glow-b", glow * (1 - split))):
        path = ROOT / realm / f"{kind}.webp"
        save(mask, path)
        meta[f"summon-{kind}-{realm}"] = {"file": path.relative_to(REPO).as_posix(), "width": W, "height": H}
    print(realm, round(float(water.mean()), 4), round(float(glow.mean()), 4))

for name in ("assets/gemwoven/summon/summon.json", "assets/gemwoven/manifest.json"):
    path = REPO / name
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    data.update(meta)
    nl = "\r\n" if "\r\n" in text else "\n"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False).replace("\n", nl) + nl, encoding="utf-8", newline="")
