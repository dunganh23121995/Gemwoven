"""Pack the summon reveal art (Codex gpt-6-astra raw sheets in this folder) into runtime WebP
files plus summon.json for scripts/build_gemwoven.py.

Opaque art (cards, bricks) is keyed from the raw sheets by removing the flat magenta. Light FX
(sparkle, splash, water glints, halo/streak/orb/ripple, aurora) are glows painted on solid
magenta, which a hard chroma key cuts into blotches, so they are un-mixed here instead: each
pixel's alpha comes from its magenta spill and the colour under the magenta is recovered. Geometry is never stretched: every resize keeps the aspect ratio."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "runtime"
# Three card types (bronze, silver, gold), drawn tall (about 1:2) in one row per sheet: bronze from
# card-backs-calm/ and card-fronts-calm/ (the tall set, card-*-tall/, redrawn in a calm palette),
# silver and gold from card-backs-metal/ and card-fronts-metal/. (sheet suffix, columns, column)
CARDS = {"bronze": ("calm", 3, 1), "silver": ("metal", 2, 1), "gold": ("metal", 2, 2)}


def unmix(img):
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # Magenta spill (min(r,b)-g) is how much background shows through; 1-spill is always a
    # valid alpha (the recovered colour stays in range) and keeps pink and lavender light.
    alpha = np.clip(1 - (np.minimum(r, b) - g), 0, 1)
    alpha = np.where(alpha < .045, 0, alpha)
    alpha[:3], alpha[-3:], alpha[:, :3], alpha[:, -3:] = 0, 0, 0, 0   # grid seams of the raw sheet
    safe = np.maximum(alpha, 1e-4)[..., None]
    colour = (a - (1 - alpha)[..., None] * np.array([1, 0, 1], dtype=np.float32)) / safe
    rgba = np.dstack([np.clip(colour, 0, 1), alpha]) * 255
    return Image.fromarray(rgba.round().astype("uint8"), "RGBA")


def key_outside(img, inside=False):
    """Opaque art with magenta-like colours inside (violet plastic): remove only the magenta
    connected to the cell border (inside=True: every magenta region, e.g. a card's picture
    window), then soften the silhouette edge with the spill un-mix."""
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    near = (r > 170) & (b > 170) & (g < 110) & (np.abs(r - b) < 70)
    labels, _ = ndimage.label(near)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    strict = (r > 215) & (b > 215) & (g < 60)   # windows are flat #FF00FF; pastel opal is not
    outside = (np.isin(labels, edge[edge > 0]) | (strict & near)) if inside else np.isin(labels, edge[edge > 0])
    soft = np.asarray(unmix(img), dtype=np.float32)
    ring = ndimage.binary_dilation(outside, iterations=2) & ~outside
    rgba = np.dstack([a, np.full(r.shape, 255, np.float32)])
    rgba[ring] = soft[ring]
    rgba[outside] = 0
    return Image.fromarray(rgba.round().astype("uint8"), "RGBA")


def cells(raw, rows, cols):
    w, h = raw.width / cols, raw.height / rows
    return [raw.crop((round(c * w), round(r * h), round((c + 1) * w), round((r + 1) * h))) for r in range(rows) for c in range(cols)]


def fit(img, size):
    """Scale uniformly so the longer side is `size` (never stretches)."""
    k = size / max(img.size)
    return img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)


def strip(frames, name):
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * w, 0))
    sheet.save(OUT / f"{name}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    return {"file": f"assets/gemwoven/summon/runtime/{name}.webp", "width": sheet.width, "height": h, "count": len(frames)}


def save(img, name):
    img.save(OUT / f"{name}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    return {"file": f"assets/gemwoven/summon/runtime/{name}.webp", "width": img.width, "height": img.height}


def trim(img, pad=0):
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad))
    return img.crop(box)


def window(front):
    """The open picture window of a card front: the transparent region around the card centre."""
    alpha = np.asarray(front.getchannel("A")) < 40
    h, w = alpha.shape
    cy, cx = h // 2 - h // 10, w // 2
    left = cx
    while left > 0 and alpha[cy, left - 1]:
        left -= 1
    right = cx
    while right < w - 1 and alpha[cy, right + 1]:
        right += 1
    top = cy
    while top > 0 and alpha[top - 1, cx]:
        top -= 1
    bottom = cy
    while bottom < h - 1 and alpha[bottom + 1, cx]:
        bottom += 1
    return [round(left / w, 4), round(top / h, 4), round((right + 1) / w, 4), round((bottom + 1) / h, 4)]


def raw(name):
    return Image.open(ROOT / name / "raw-sheet.png")


OUT.mkdir(exist_ok=True)
meta = {}
for kind, folder in [("back", "card-backs"), ("front", "card-fronts")]:
    for name, (sheet, cols, frame) in CARDS.items():
        card = trim(key_outside(cells(raw(f"{folder}-{sheet}"), 1, cols)[frame - 1], inside=kind == "front"))
        card = fit(card, 520)
        meta[f"summon-{kind}-{name}"] = save(card, f"{kind}-{name}")
        if kind == "front":
            win = window(card)
            # The name plaque sits under the picture window, above the bottom gem.
            meta[f"summon-{kind}-{name}"].update(window=win, plaque=[round(win[3] + .03, 4), .1])
meta["summon-sparkle"] = {**strip([fit(unmix(c), 128) for c in cells(raw("sparkle"), 2, 4)], "sparkle"), "frameDuration": 85}
meta["summon-splash"] = {**strip([fit(unmix(c), 256) for c in cells(raw("splash"), 2, 4)], "splash"), "frameDuration": 75, "waterline": .78}
# Water glints: keep only the horizontal band each cell paints (same band in all four frames).
glints = []
for c in cells(raw("water-glints"), 2, 2):
    band = unmix(c).crop((0, round(c.height * .26), c.width, round(c.height * .74)))
    glints.append(fit(band, 480))
meta["summon-glints"] = {**strip(glints, "glints"), "frameDuration": 260}
for i, name in enumerate(["halo", "streak", "orb", "ripple"]):
    meta[f"summon-{name}"] = save(fit(unmix(cells(raw("fx-pack"), 2, 2)[i]), 384), name)
meta["summon-aurora"] = save(fit(trim(unmix(raw("aurora")), 12), 1400), "aurora")
# Hero fragments as jigsaw puzzle pieces cut from a picture of each hero (fragment-puzzle/), plus
# the generic hero-fragment icon in the same style.
for i, hero in enumerate(["fire", "ice", "earth", "lightning", "shadow", "novice"]):
    piece = fit(trim(key_outside(cells(raw("fragment-puzzle"), 2, 3)[i]), 4), 256)
    meta[f"fragment-{hero}"] = {**save(piece, f"fragment-{hero}"), "fragmentArt": True, "transparent": True}
generic = Image.open(ROOT / "fragment-puzzle" / "raw-generic.png")
meta["hero-fragment"] = {**save(fit(trim(key_outside(generic), 4), 256), "hero-fragment"), "fragmentArt": True, "transparent": True}
# Entries made elsewhere (realm scenes and masks, export_realm_fx.py) are kept.
old = json.loads((ROOT / "summon.json").read_text(encoding="utf-8")) if (ROOT / "summon.json").exists() else {}
old = {k: v for k, v in old.items() if not k.startswith(("summon-back-", "summon-front-"))}
(ROOT / "summon.json").write_text(json.dumps({**old, **meta}, indent=2) + "\n", encoding="utf-8")
print("packed", len(meta))
