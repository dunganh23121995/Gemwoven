"""Normalize accepted ImageGen boss cutouts without repainting their pixels.

Run from any directory. Raw originals and exact prompts remain in assets/gemwoven/raw.
Optional --skill-processor PATH runs generate2dsprite strict QC into ignored QA folders.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/gemwoven"
RAW = ASSETS / "raw/bosses-expansion"
QA = ROOT / "qa/gemwoven/boss-art"
SIZE, HEIGHT, MAX_WIDTH, BASELINE = 512, 390, 440, 461


def package():
    prompts = json.loads((RAW / "prompts.json").read_text(encoding="utf-8"))
    items = {}
    QA.mkdir(parents=True, exist_ok=True)
    preview = Image.new("RGB", (5 * 288, 2 * 320), "#182637")
    draw = ImageDraw.Draw(preview)
    for index, boss in enumerate(prompts["bosses"]):
        slug = "boss-" + boss["id"]
        raw_path = RAW / (slug + "-raw.png")
        raw = Image.open(raw_path).convert("RGBA")
        # ImageGen leaves invisible alpha 1..8 specks beyond the silhouette.
        # Preserve the untouched master; remove only these faint pixels for runtime.
        raw.putalpha(raw.getchannel("A").point(lambda a: 0 if a <= 8 else a))
        cleaned_path = QA / boss["id"] / "alpha-clean-source.png"
        cleaned_path.parent.mkdir(parents=True, exist_ok=True)
        raw.save(cleaned_path)
        bounds = raw.getchannel("A").getbbox()
        assert bounds and min(bounds[:2]) > 0
        assert bounds[2] < raw.width and bounds[3] < raw.height, (slug, bounds)
        subject = raw.crop(bounds)
        scale = min(HEIGHT / subject.height, MAX_WIDTH / subject.width)
        dimensions = tuple(round(value * scale) for value in subject.size)
        subject = subject.resize(dimensions, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE))
        origin = ((SIZE - subject.width) // 2, BASELINE - subject.height)
        canvas.alpha_composite(subject, origin)
        final_bounds = canvas.getchannel("A").getbbox()
        assert final_bounds and final_bounds[3] == BASELINE
        assert min(final_bounds[:2]) >= 30 and final_bounds[2] <= SIZE - 30
        output = ASSETS / "items" / slug
        canvas.save(output.with_suffix(".png"), optimize=True)
        canvas.save(output.with_suffix(".webp"), lossless=True, method=6, exact=True)
        webp = Image.open(output.with_suffix(".webp")).convert("RGBA")
        assert webp.getchannel("A").tobytes() == canvas.getchannel("A").tobytes()
        items[slug] = {
            "name": boss["name"],
            "file": f"items/{slug}.png",
            "webp": f"items/{slug}.webp",
            "width": SIZE, "height": SIZE,
            "alphaBounds": list(final_bounds),
            "facing": "left", "static": True, "transparent": True,
            "baseline": BASELINE,
            "raw": f"raw/bosses-expansion/{slug}-raw.png",
            "sourceSize": list(raw.size), "sourceAlphaBounds": list(bounds),
            "normalizationScale": round(scale, 8),
            "alphaNoiseCutoff": 8,
        }
        x, y = (index % 5) * 288, (index // 5) * 320
        thumb = canvas.resize((280, 280), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 4, y), thumb)
        draw.text((x + 14, y + 286), boss["id"], fill="#f0e5cd")
        print(f"{slug}: {final_bounds}, {output.with_suffix('.webp').stat().st_size} bytes")
    manifest = {
        "version": 1, "generator": "built-in ImageGen", "artModel": "gpt-6-astra",
        "reasoningEffort": "high", "promptFile": "raw/bosses-expansion/prompts.json",
        "coordinateConvention": "alphaBounds are [left,top,right,bottom], right/bottom exclusive",
        "animationNote": "One static authored pose per boss. Runtime movement and VFX are separate.",
        "items": items,
    }
    (ASSETS / "boss-items.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    preview.save(QA / "boss-contact-sheet.png")
    return prompts["bosses"]


def skill_qc(boss, processor):
    slug = "boss-" + boss["id"]
    args = [sys.executable, str(processor), "process", "--input", str(QA / boss["id"] / "alpha-clean-source.png"),
            "--target", "creature", "--mode", "single", "--rows", "1", "--cols", "1",
            "--output-dir", str(QA / boss["id"]), "--cell-size", "512", "--fit-scale", "0.78",
            "--align", "feet", "--component-mode", "all", "--threshold", "0",
            "--edge-threshold", "0", "--trim-border", "0", "--edge-clean-depth", "0", "--strict-qc"]
    # The source has real alpha; zero thresholds preserve purple/blue painted pixels.
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        raise RuntimeError(slug + "\n" + result.stdout + result.stderr)
    return slug + ": strict sprite QC passed"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill-processor", type=Path)
    options = parser.parse_args()
    bosses = package()
    if options.skill_processor:
        with ThreadPoolExecutor(max_workers=3) as executor:
            for result in executor.map(lambda boss: skill_qc(boss, options.skill_processor), bosses):
                print(result)
