"""Export each chapter's combat scenery sheet (source/<id>/raw-sheet.png, gen_chapters.py) into its three parallax
layers: <id>-far.webp (layer 3, the farthest: sky and distant landmarks, opaque), <id>-mid.webp (layer 2:
mid-distance scenery) and <id>-stage.webp (layer 1, the nearest: the stage floor with its framing objects at both
ends). The combat camera slides them at different speeds when a fighter leaves (src/progression-combat.js).

The stage floor is registered to the combat's ground: its first row (read off the middle of the panel, where no
framing object stands) lands at 68% of the layer's height, so the fighters (feet at 82%) stand on it.
Also writes <id>-card.webp (the three layers composed) for the hub's stage card, and manifest.json.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
SIZE = (1536, 768)
FLOOR = .68


KEY = [255, 0, 255]  # the sheet's key colour: magenta, or green for a sheet marked "green" (set per sheet in main)


def key_magenta(image):
    """Only the flat #FF00FF key goes (by distance to it), so violet crystals, void stone and moonlit purple stay;
    the soft edge is un-mixed from the key colour."""
    a = np.array(image.convert("RGBA")).astype(np.float32)
    d = np.max(np.abs(a[:, :, :3] - KEY), axis=2)
    al = np.clip((d - 45) / 70, 0, 1)
    rgb = np.where(al[..., None] > 0, (a[:, :, :3] - (1 - al[..., None]) * KEY) / np.maximum(al[..., None], 1e-3), 0).clip(0, 255)
    # Near the cut, whatever magenta is left in a pixel (red and blue both above green) is taken out.
    edge = ndimage.binary_dilation(al < .98, iterations=3)
    if KEY[1]:  # green key: green above red and blue is taken out
        spill = np.clip(rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]), 0, None) * edge
        rgb[..., 1] -= spill
    else:
        spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None) * edge
        rgb[..., 0] -= spill; rgb[..., 2] -= spill
    return Image.fromarray(np.dstack([rgb.clip(0, 255), al * 255]).astype("uint8"), "RGBA")


def clear_bleed(keyed):
    """A panel's first rows may carry a few rows of the panel above it (the sheet's grid drifts by a few pixels):
    everything above its first mostly-magenta row goes."""
    a = np.array(keyed)
    opaque = (a[:, :, 3] > 200).mean(axis=1)
    first = int(np.flatnonzero(opaque < .5)[0]) if (opaque < .5).any() else 0
    if first < a.shape[0] * .15:
        a[:first, :, 3] = 0
    return Image.fromarray(a)


def floor_top(keyed):
    """The stage floor's first row: below the magenta, the middle 60% of the panel (between the framing objects)
    nearly opaque."""
    alpha = np.array(keyed)[:, :, 3]
    w = alpha.shape[1]
    centre = (alpha[:, int(w * .2):int(w * .8)] > 200).mean(axis=1)
    start = int(np.flatnonzero(centre < .3)[0])
    return start + int(np.flatnonzero(centre[start:] > .97)[0])


def stage_layer(panel, size=SIZE):
    """The floor's top lands at FLOOR: what stands above it (the framing objects) and the floor below are each scaled
    to their part of the layer."""
    keyed = clear_bleed(key_magenta(panel))
    top = floor_top(keyed)
    out = Image.new("RGBA", size)
    for (y0, y1), (t0, t1) in [((0, top), (0, round(size[1] * FLOOR))), ((top, panel.height), (round(size[1] * FLOOR), size[1]))]:
        band = keyed.crop((0, y0, panel.width, y1)).resize((size[0], t1 - t0), Image.Resampling.LANCZOS)
        out.alpha_composite(band, (0, t0))
    return out, top


def air(image, blur, haze, colour):
    """Aerial perspective for the far layers: a soft blur and a veil of the sky's horizon colour (alpha kept)."""
    # Blurred premultiplied, so the transparent pixels' colour never bleeds into the edges.
    src = np.array(image.convert("RGBA")).astype(np.float32)
    al = src[..., 3:] / 255
    pre = ndimage.gaussian_filter(src[..., :3] * al, (blur, blur, 0))
    wa = ndimage.gaussian_filter(al, (blur, blur, 0))
    rgb = np.where(wa > 1e-3, pre / np.maximum(wa, 1e-3), 0)
    a = np.dstack([rgb * (1 - haze) + np.array(colour, np.float32) * haze, src[..., 3]])
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def well_formed(raw, opaque_mid=False):
    """A sheet drawn as asked: the middle and bottom panels each open on a band of magenta (their sky cut away)."""
    a = np.array(raw.convert("RGB")).astype(int)
    key = np.abs(a - KEY).max(axis=2) < 60
    # (across the whole width: a boss lair's great landmark may rise through the middle of its band)
    return (opaque_mid or key[530:590].mean() > .35) and key[1040:1100, 300:724].mean() > .6


def main():
    out = {}
    bad = []
    for source in sorted((HERE / "source").iterdir()):
        cid = source.name
        KEY[:] = [0, 255, 0] if (source / "green").exists() else [255, 0, 255]
        raw = Image.open(source / "raw-sheet.png").convert("RGBA").resize((1024, 1536), Image.Resampling.LANCZOS)
        # A sheet marked "opaque-mid" (the model painted its own sky into the middle panel, and kept doing so at every
        # model up the ladder) keeps that panel whole: it hides the far layer but still slides slower than the stage.
        opaque_mid = (source / "opaque-mid").exists()
        if not well_formed(raw, opaque_mid):
            bad.append(cid)
            continue
        sky = np.array(raw.crop((0, 0, 1024, 512)).convert("RGB"))
        pink = (np.abs(sky.astype(int) - KEY).max(axis=2) < 60).mean(axis=1) > .3
        for y in range(sky.shape[0] - 1, sky.shape[0] - 16, -1):
            if pink[y]:
                sky[y] = sky[y - 1] if not pink[y - 1] else sky[sky.shape[0] - 17]
        far = Image.fromarray(sky).resize(SIZE, Image.Resampling.LANCZOS)
        # The horizon's colour (the sky band just above 55%) veils the far layers: the farther, the more.
        horizon = np.array(far)[int(SIZE[1] * .45):int(SIZE[1] * .55)].reshape(-1, 3).mean(axis=0)
        far = air(far, 1.6, .22, horizon).convert("RGB")
        mid_panel = raw.crop((0, 512, 1024, 1024))
        mid = air((mid_panel.convert("RGBA") if opaque_mid else clear_bleed(key_magenta(mid_panel))).resize(SIZE, Image.Resampling.LANCZOS), .8, .1, horizon)
        # The stage drawn on its own (gen_layer.py --stage) keeps its full size: it is the sharpest layer.
        own = source / "raw-stage.png"
        if own.exists():
            panel = Image.open(own).convert("RGBA")
            stage, top = stage_layer(panel, panel.size)
        else:
            stage, top = stage_layer(raw.crop((0, 1024, 1024, 1536)))
        layers = {}
        for name, image in [("far", far), ("mid", mid), ("stage", stage)]:
            image.save(HERE / f"{cid}-{name}.webp", "WEBP", quality=90, method=6, exact=True)
            layers[name] = f"{cid}-{name}.webp"
        card = Image.alpha_composite(Image.alpha_composite(far.convert("RGBA"), mid), stage.resize(SIZE, Image.Resampling.LANCZOS)).convert("RGB")
        card.save(HERE / f"{cid}-card.webp", "WEBP", quality=86, method=6)
        out[cid] = {"layers": layers, "card": f"{cid}-card.webp", "floorTop": top, "floor": FLOOR, "groundY": .82}
        print(cid, top)
    if bad:
        print("ill-formed (redraw):", " ".join(bad))
    for old in HERE.glob("*-near.webp"):
        old.unlink()
    (HERE / "manifest.json").write_text(json.dumps({"size": list(SIZE), "chapters": out}, indent=1) + "\n", encoding="utf-8")
    # The hub's stage card shows the same scenery (assets/gemwoven/battle-scene-items.json, battle-card-<id>).
    items = {f"battle-card-{cid}": {"file": f"assets/scenes/chapters/{e['card']}", "width": SIZE[0], "height": SIZE[1], "textless": True}
             for cid, e in out.items()}
    (HERE.parents[1] / "gemwoven/battle-scene-items.json").write_text(
        json.dumps({"version": 1, "purpose": "Each chapter's combat scenery, for the stage card", "items": items}, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
