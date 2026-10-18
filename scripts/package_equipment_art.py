"""Extract the accepted equipment/relic atlases, retaining raw art and exact prompts.

No painting or model generation occurs here: this is alpha cleanup, crop, fit and export.
Use --skill-processor PATH for additional generate2dsprite strict QC in ignored qa/.
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
RAW = ASSETS / "raw/equipment-expansion"
QA = ROOT / "qa/gemwoven/equipment-art"
SIZE = 512
ALPHA_CUTOFF = 8


def package():
    sheets = json.loads((RAW / "prompts.json").read_text(encoding="utf-8"))["sheets"]
    QA.mkdir(parents=True, exist_ok=True)
    items, previews = {}, {}
    for sheet in sheets:
        source = Image.open(RAW / (sheet["key"] + "-raw.png")).convert("RGBA")
        source.putalpha(source.getchannel("A").point(lambda a: 0 if a <= ALPHA_CUTOFF else a))
        cols, rows = (3, 2) if sheet["key"].startswith("relic-") else ((2, 2) if sheet["key"] == "gear" else (1, 1))
        for index, slug in enumerate(sheet["ids"]):
            col, row = index % cols, index // cols
            rect = [round(col * source.width / cols), round(row * source.height / rows),
                    round((col + 1) * source.width / cols), round((row + 1) * source.height / rows)]
            # Slot 6 is intentionally empty. Include that empty slot for the fifth
            # relic so its full authored halo/tail tips remain intact (fire extends 8px).
            if cols == 3 and index == 4:
                rect[2] = source.width
            cell = source.crop(rect)
            bounds = cell.getchannel("A").getbbox()
            assert bounds, slug + " is empty"
            assert min(bounds[:2]) > 0 and bounds[2] < cell.width and bounds[3] < cell.height, (slug, bounds, cell.size)
            clean_path = QA / slug / "alpha-clean-source.png"
            clean_path.parent.mkdir(parents=True, exist_ok=True)
            cell.save(clean_path)
            cutout = cell.crop(bounds)
            scale = min(424 / cutout.width, 424 / cutout.height)
            cutout = cutout.resize(tuple(round(s * scale) for s in cutout.size), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (SIZE, SIZE))
            canvas.alpha_composite(cutout, ((SIZE - cutout.width) // 2, (SIZE - cutout.height) // 2))
            alpha_bounds = canvas.getchannel("A").getbbox()
            assert min(alpha_bounds[:2]) >= 40 and max(alpha_bounds[2:]) <= 472
            output = ASSETS / "items" / slug
            canvas.save(output.with_suffix(".png"), optimize=True)
            canvas.save(output.with_suffix(".webp"), lossless=True, method=6, exact=True)
            webp = Image.open(output.with_suffix(".webp")).convert("RGBA")
            assert webp.getchannel("A").tobytes() == canvas.getchannel("A").tobytes()
            items[slug] = {
                "file": f"items/{slug}.png", "webp": f"items/{slug}.webp",
                "width": SIZE, "height": SIZE, "alphaBounds": list(alpha_bounds),
                "transparent": True, "static": True,
                "raw": f"raw/equipment-expansion/{sheet['key']}-raw.png",
                "sourceCrop": rect, "sourceAlphaBounds": list(bounds), "alphaNoiseCutoff": ALPHA_CUTOFF,
                "type": "relic" if slug.startswith("relic-") else "equipment",
            }
            if slug.startswith("relic-"):
                items[slug].update(hero=slug.split("-")[1], form=int(slug.split("-")[2]))
            previews[slug] = canvas
            print(slug, alpha_bounds, flush=True)
    manifest = {
        "version": 1, "generator": "built-in ImageGen", "artModel": "gpt-6-astra",
        "reasoningEffort": "high", "promptFile": "raw/equipment-expansion/prompts.json",
        "coordinateConvention": "alphaBounds and sourceCrop are [left,top,right,bottom], right/bottom exclusive",
        "items": items,
    }
    (ASSETS / "equipment-art-items.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    preview = Image.new("RGB", (1100, 7 * 240), "#203040")
    draw = ImageDraw.Draw(preview)
    for row, hero in enumerate(["novice", "fire", "ice", "earth", "lightning", "shadow"]):
        for form in range(1, 6):
            slug = f"relic-{hero}-{form}"
            thumb = previews[slug].resize((208, 208), Image.Resampling.LANCZOS)
            x, y = (form - 1) * 220 + 6, row * 240
            preview.paste(thumb, (x, y), thumb)
            draw.text((x + 10, y + 211), slug, fill="#f8ecd3")
    for column, slug in enumerate(["gear-armor", "gear-helmet", "gear-pants", "gear-glasses"]):
        thumb = previews[slug].resize((208, 208), Image.Resampling.LANCZOS)
        x, y = column * 220 + 6, 6 * 240
        preview.paste(thumb, (x, y), thumb)
        draw.text((x + 10, y + 211), slug, fill="#f8ecd3")
    preview.save(QA / "equipment-contact-sheet.png")
    return list(items)


def skill_qc(slug, processor):
    args = [sys.executable, str(processor), "process", "--input", str(QA / slug / "alpha-clean-source.png"),
            "--target", "asset", "--mode", "single", "--rows", "1", "--cols", "1",
            "--output-dir", str(QA / slug), "--cell-size", "512", "--fit-scale", "0.82",
            "--align", "center", "--component-mode", "all", "--threshold", "0", "--edge-threshold", "0",
            "--trim-border", "0", "--edge-clean-depth", "0", "--strict-qc"]
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        raise RuntimeError(slug + "\n" + result.stdout + result.stderr)
    return slug + ": strict sprite QC passed"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill-processor", type=Path)
    options = parser.parse_args()
    slugs = package()
    if options.skill_processor:
        with ThreadPoolExecutor(max_workers=3) as executor:
            for result in executor.map(lambda slug: skill_qc(slug, options.skill_processor), slugs):
                print(result, flush=True)
