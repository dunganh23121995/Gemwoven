"""Re-export the ImageGen art plates. Requires Pillow, numpy and scipy.

Only deterministic extraction, chroma keying and sizing occur here. Source
paintings and the exact generation prompts are preserved in source/<theme>/.
Run from any directory; previews are written to the repository's ignored qa/.
"""
from pathlib import Path
import json

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
QA = ROOT.parents[2] / "qa" / "painted-combat"
SIZE = (1536, 768)
THEMES = {
    "earth": {"groundTop": 342, "frontEdge": 416},
    "fire": {"groundTop": 319, "frontEdge": 402},
    "ice": {"groundTop": 335, "frontEdge": 440},
    "lightning": {"groundTop": 303, "frontEdge": 425},
}


def key_magenta(image):
    pixels = np.array(image.convert("RGBA"))
    rgb = pixels[:, :, :3].astype(np.float32)
    # Pure magenta plus its antialiased border. Preserve slate and blue ice.
    spill = np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]
    key = (spill > 25) & (rgb[:, :, 0] > 80) & (rgb[:, :, 2] > 80)
    pixels[key, 3] = 0
    # Remove residual magenta contamination from the visible one-pixel edge.
    border = ndimage.binary_dilation(key, iterations=2) & ~key
    for channel in (0, 2):
        pixels[:, :, channel][border] = np.minimum(
            pixels[:, :, channel][border],
            pixels[:, :, 1][border].astype(np.int16) + 12,
        )
    pixels[pixels[:, :, 3] == 0, :3] = 0
    return Image.fromarray(pixels)


def ground_layer(panel, top, edge):
    """Register the painted top plane with the agreed safe fighting belt."""
    panel = key_magenta(panel)
    out = Image.new("RGBA", SIZE)
    # Discard the tiny generated chroma seam above the continuous terrace.
    opaque_rows = np.flatnonzero((np.array(panel)[:, :, 3] == 255).all(axis=1))
    top = int(opaque_rows[0]) + 1
    source_y = [0, top, edge, panel.height]
    target_y = [0, round(SIZE[1] * .68), round(SIZE[1] * .92), SIZE[1]]
    for index in (1, 2):
        band = panel.crop((0, source_y[index], panel.width, source_y[index + 1]))
        band = band.resize((SIZE[0], target_y[index + 1] - target_y[index]), Image.Resampling.LANCZOS)
        out.paste(band, (0, target_y[index]))
    return out


def near_layer(panel):
    """Preserve prop proportions while placing every cluster below y=.92."""
    keyed = key_magenta(panel)
    alpha = np.array(keyed)[:, :, 3] > 0
    labels, count = ndimage.label(alpha)
    output = Image.new("RGBA", SIZE)
    max_height = SIZE[1] - int(np.ceil(SIZE[1] * .92))
    for component, slices in enumerate(ndimage.find_objects(labels), 1):
        if slices is None:
            continue
        sy, sx = slices
        mask = labels[sy, sx] == component
        if mask.sum() < 20:
            continue
        patch = np.array(keyed.crop((sx.start, sy.start, sx.stop, sy.stop)))
        patch[:, :, 3] *= mask
        patch = Image.fromarray(patch)
        scale = min(SIZE[0] / panel.width, max_height / patch.height)
        width, height = max(1, round(patch.width * scale)), max(1, round(patch.height * scale))
        patch = patch.resize((width, height), Image.Resampling.LANCZOS)
        center_x = ((sx.start + sx.stop) / 2) / panel.width * SIZE[0]
        x = min(SIZE[0] - width, max(0, round(center_x - width / 2)))
        # A cluster clipped by the original canvas remains at that canvas edge.
        if sx.start == 0:
            x = 0
        elif sx.stop == panel.width:
            x = SIZE[0] - width
        output.alpha_composite(patch, (x, SIZE[1] - height))
    return output


def main():
    QA.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": "gemwoven.painted-combat.v1",
        "generator": "built-in ImageGen",
        "artAgent": {"model": "gpt-6-astra", "reasoningEffort": "high"},
        "mapMode": "side_scroll_mode",
        "visualModel": "parallax_layers",
        "stageSegmentCount": 1,
        "stageKind": "fixed-combat-arena",
        "width": SIZE[0], "height": SIZE[1], "groundY": .82,
        "walkableBelt": {"left": .1, "right": .9, "top": .73, "bottom": .89},
        "groundTop": .68, "frontEdge": .92, "nearTop": .92,
        "repeatPolicy": "overscan-clamp",
        "repeatNote": "Use camera overscan for small motion; paintings are not seamless tiles.",
        "collisionSource": "runtime geometry, never image pixels",
        "renderOrder": ["far", "mid", "actors", "near"],
        "themes": {},
    }
    for theme, geometry in THEMES.items():
        source = ROOT / "source" / theme
        raw = Image.open(source / "raw-sheet.png").convert("RGBA")
        assert raw.size == (1024, 1536), (theme, raw.size)
        far = raw.crop((0, 0, 1024, 512)).resize(SIZE, Image.Resampling.LANCZOS)
        mid = ground_layer(raw.crop((0, 512, 1024, 1024)), geometry["groundTop"], geometry["frontEdge"])
        near = near_layer(raw.crop((0, 1024, 1024, 1536)))
        layers = {}
        for name, image, speed in [("far", far, .18), ("mid", mid, .48), ("near", near, .9)]:
            filename = f"{theme}-{name}.webp"
            image.save(ROOT / filename, "WEBP", quality=94, method=6, exact=True)
            alpha = np.array(image)[:, :, 3]
            assert image.size == SIZE
            if name == "near":
                assert not alpha[:int(np.ceil(.92 * SIZE[1]))].any()
            if name == "mid":
                assert (alpha[round(.82 * SIZE[1]), :] == 255).all()
            layers[name] = {"file": filename, "width": SIZE[0], "height": SIZE[1],
                            "scrollFactor": speed, "alpha": name != "far"}
        composite = Image.alpha_composite(Image.alpha_composite(far, mid), near)
        composite.save(QA / f"{theme}-composite.png")
        metadata = {
            "theme": theme, "raw": "raw-sheet.png", "prompt": "prompt.txt",
            "sourceSize": list(raw.size), "sourcePanels": [[0, 0, 1024, 512],
                [0, 512, 1024, 1024], [0, 1024, 1024, 1536]],
            "sourceGroundGeometry": geometry, "outputSize": list(SIZE),
            "groundY": .82, "layers": layers,
            "postprocess": ["chroma key", "ground plane registration",
                            "foreground component sizing below .92", "WebP export"],
        }
        (source / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        manifest["themes"][theme] = {"layers": layers, "source": f"source/{theme}/metadata.json"}
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Exported 12 layers, 4 source metadata files and manifest. QA: {QA}")


if __name__ == "__main__":
    main()
