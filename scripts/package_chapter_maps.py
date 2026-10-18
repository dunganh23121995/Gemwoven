"""Normalize accepted ImageGen chapter art and emit its runtime manifest.

This script only resizes/crops accepted generated artwork; it does not create art.
Original PNGs and manually authored prompts remain in raw/chapter-maps.
"""
from pathlib import Path
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "gemwoven"
RAW = ASSETS / "raw" / "chapter-maps"
THEMES = (
    "forest", "volcano", "ice", "thunder", "marsh", "desert", "abyss",
    "foundry", "crystal", "haunted", "sky", "thorns", "celestial", "void",
    "pine", "obsidian", "bamboo", "coast", "dream", "astral",
)
STAGE_CENTERS = [
    [350, 1340], [580, 1180], [370, 1030], [600, 900], [360, 760],
    [590, 650], [370, 560], [570, 470], [390, 390], [520, 350],
]
PROPS = {
    "map-back": (256, 256),
    "map-cloud": (1100, 360),
    "stage-platform": (320, 200),
    "chapter-banner": (1100, 240),
}


def metadata(name, destination, size, transparent):
    prompt = RAW / f"{name}.prompt.txt"
    assert prompt.is_file() and prompt.read_text(encoding="utf-8").strip()
    return {
        "file": destination.relative_to(ASSETS).as_posix(),
        "width": size[0], "height": size[1],
        "textless": True, "transparent": transparent,
        "raw": f"raw/chapter-maps/{name}.png",
        "promptFile": f"raw/chapter-maps/{name}.prompt.txt",
    }


def main():
    items = {}
    background_dir = ASSETS / "backgrounds" / "chapters"
    background_dir.mkdir(parents=True, exist_ok=True)
    for theme in THEMES:
        destination = background_dir / f"{theme}.webp"
        with Image.open(RAW / f"{theme}.png") as source:
            source.convert("RGB").resize((941, 1672), Image.Resampling.LANCZOS).save(
                destination, quality=89, method=6,
            )
        entry = metadata(theme, destination, (941, 1672), False)
        entry["stageCenters"] = STAGE_CENTERS
        entry["reference"] = None if theme == "forest" else "raw/chapter-maps/forest.png"
        items[f"chapter-{theme}"] = entry

    for name, size in PROPS.items():
        with Image.open(RAW / f"{name}.png") as source:
            source = source.convert("RGBA")
            alpha = source.getchannel("A")
            assert alpha.getextrema()[0] == 0, f"{name}: no transparency"
            bounds = alpha.point(lambda a: 255 if a > 2 else 0).getbbox()
            assert bounds, f"{name}: empty asset"
            cropped = source.crop(bounds)
            cropped.thumbnail((size[0] - 12, size[1] - 12), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))
            canvas.alpha_composite(cropped, ((size[0] - cropped.width) // 2, (size[1] - cropped.height) // 2))
            destination = ASSETS / "items" / f"{name}.png"
            destination.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(destination, optimize=True)
        entry = metadata(name, destination, size, True)
        if name == "chapter-banner":
            entry["safeContentRects"] = {"label": [180, 65, 740, 110]}
        elif name == "stage-platform":
            entry["safeContentRects"] = {"label": [80, 40, 160, 80]}
        items[name] = entry

    manifest = {
        "version": 1,
        "generator": "built-in ImageGen",
        "artModel": "gpt-6-astra",
        "reasoningEffort": "high",
        "mapMode": "baked_scene_mode",
        "visualModel": "baked_raster",
        "collisionModel": "none",
        "runtimeObjectModel": "independent DOM stage nodes",
        "coordinateConvention": "stageCenters are [x,y], bottom to top; safeContentRects are [x,y,width,height], all in final image pixels",
        "items": items,
    }
    destination = ASSETS / "chapter-map-items.json"
    destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Packaged {len(THEMES)} chapter backgrounds and {len(PROPS)} transparent props: {destination}")


if __name__ == "__main__":
    main()
