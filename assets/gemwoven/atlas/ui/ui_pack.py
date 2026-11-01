"""Stage card and chapter map UI art (Khám Phá), cut from the Codex sheets in this folder.

Usage: python ui_pack.py   (after generate2dsprite.py process wrote .build-cache/atlas/ui-<sheet>/sheet-transparent.png)
Sheets (3 x 2 cells of 512px): raw-avatars.png -> face-<hero>.webp, raw-decals.png -> ring-<state>.webp,
raw-plaques.png -> plaque-<state>.webp. raw-star.png -> reward-star.webp, raw-swords.png -> icon-battle.webp, raw-water.png -> water-flow.webp. raw-buttons.png (two buttons on magenta) -> btn-primary.webp, btn-secondary.webp (their crest removed).
"""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
CACHE = HERE.parents[3] / ".build-cache/atlas"
SHEETS = {
    "avatars": ("face", ["novice", "fire", "ice", "earth", "lightning", "shadow"], 256),
    "decals": ("ring", ["normal", "elite", "boss", "cleared", "next", "locked"], None),
    "plaques": ("plaque", ["normal", "elite", "boss", "cleared", "next", "locked"], 160),
}


def despill(im, tint):
    """Glow drawn over the magenta key keeps a pink cast: semi-transparent pinkish pixels take the glow's tint."""
    a = np.asarray(im).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    pink = (al < 250) & (r - g > 25) & (b - g > 25)
    for i, c in enumerate(tint):
        a[..., i] = np.where(pink, c, a[..., i])
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


TINTS = {"ring-next": (255, 214, 96), "ring-boss": (255, 120, 50), "ring-elite": (200, 160, 255), "plaque-next": (255, 196, 80)}


def cells():
    for sheet, (prefix, names, size) in SHEETS.items():
        im = Image.open(CACHE / f"ui-{sheet}/sheet-transparent.png").convert("RGBA")
        for i, name in enumerate(names):
            key = f"{prefix}-{name}"
            cell = im.crop((i % 3 * 512, i // 3 * 512, i % 3 * 512 + 512, i // 3 * 512 + 512))
            if key in TINTS:
                cell = despill(cell, TINTS[key])
            # Rings keep their whole cell (centred on the ring); avatars and plaques are cut to their drawing.
            if prefix != "ring":
                cell = cell.crop(cell.getbbox())
                cell.thumbnail((size, size), Image.LANCZOS)
            cell.save(HERE / f"{key}.webp", "WEBP", quality=92, method=6)
            print(key, cell.size)


def buttons():
    """Magenta keyed by distance, the key colour un-mixed from the soft edge, each button cut to its drawing."""
    a = np.asarray(Image.open(HERE / "raw-buttons.png").convert("RGB")).astype(np.float32)
    d = np.max(np.abs(a - [255, 0, 255]), axis=2)
    al = np.clip((d - 40) / 80, 0, 1)
    rgb = np.where(al[..., None] > 0, (a - (1 - al[..., None]) * [255, 0, 255]) / np.maximum(al[..., None], 1e-3), 0)
    out = np.dstack([rgb.clip(0, 255), al * 255]).astype("uint8")
    im = Image.fromarray(out, "RGBA")
    h = im.height // 2
    for i, name in enumerate(["primary", "secondary"]):
        half = im.crop((0, i * h, im.width, i * h + h))
        half = np.asarray(half.crop(half.getbbox())).astype(np.float32)
        # No crest on top (asked for 2026-11-01): the wood's columns under it take the plain frame and fill from
        # further left (where the frame runs straight), cross-faded over 24px at both seams; the empty rows above go.
        # The glossy fill is a smooth gradient: there each row is interpolated across the gap instead.
        w = half.shape[1]; c = w // 2; a, b = c - 112, c + 112
        if name == "primary":
            t = np.linspace(0, 1, b - a)[None, :, None]
            half[:, a:b] = half[:, a - 1:a] * (1 - t) + half[:, b:b + 1] * t
        else:
            src = half[:, a - 240:b - 240].copy()
            ramp = np.clip(np.minimum(np.arange(b - a), np.arange(b - a)[::-1]) / 24, 0, 1)[None, :, None]
            half[:, a:b] = src * ramp + half[:, a:b] * (1 - ramp)
        half = Image.fromarray(half.clip(0, 255).astype("uint8"), "RGBA")
        half = half.crop(half.getbbox())
        half.save(HERE / f"btn-{name}.webp", "WEBP", quality=92, method=6)
        print("btn-" + name, half.size)


def star():
    """raw-star.png (one gold star on magenta) -> reward-star.webp, the chapter-star reward icon."""
    im = Image.open(CACHE / "ui-star/sheet-transparent.png").convert("RGBA")
    im = im.crop(im.getbbox())
    im.thumbnail((160, 160), Image.LANCZOS)
    im.save(HERE / "reward-star.webp", "WEBP", quality=92, method=6)
    print("reward-star", im.size)


def swords():
    """raw-swords.png -> icon-battle.webp, the crossed swords on Khiêu Chiến and Đánh tiếp."""
    im = Image.open(CACHE / "ui-swords/sheet-transparent.png").convert("RGBA")
    im = im.crop(im.getbbox())
    im.thumbnail((128, 128), Image.LANCZOS)
    im.save(HERE / "icon-battle.webp", "WEBP", quality=92, method=6)
    print("icon-battle", im.size)


def water():
    """raw-water.png (falling-water streaks on magenta) -> water-flow.webp: the key un-mixed into soft alpha, then
    its top 160 rows cross-faded with its bottom 160 (and those dropped) so it repeats down a waterfall."""
    a = np.asarray(Image.open(HERE / "raw-water.png").convert("RGB")).astype(np.float32)
    d = np.max(np.abs(a - [255, 0, 255]), axis=2)
    al = np.clip((d - 30) / 150, 0, 1)
    rgb = np.where(al[..., None] > 0, (a - (1 - al[..., None]) * [255, 0, 255]) / np.maximum(al[..., None], 1e-3), 0).clip(0, 255)
    # Edges keep a pink cast from the key: they take the water's pale cyan instead.
    pink = (rgb[..., 0] - rgb[..., 1] > 12) & (rgb[..., 2] - rgb[..., 1] > 12)
    rgb[pink] = (rgb[pink].mean(axis=1, keepdims=True) * [.86, .96, 1.04]).clip(0, 255)
    px = np.dstack([rgb, al * 255])
    k = 160; n = px.shape[0]; w = np.linspace(0, 1, k)[:, None, None]
    px[:k] = px[:k] * w + px[n - k:] * (1 - w); px = px[:n - k]
    im = Image.fromarray(px.astype("uint8"), "RGBA")
    im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    im.save(HERE / "water-flow.webp", "WEBP", quality=88, method=6)
    print("water-flow", im.size)


if __name__ == "__main__":
    cells()
    buttons()
    star()
    swords()
    water()
