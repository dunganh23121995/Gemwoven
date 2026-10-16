"""Clean generated per-item match-four and match-five artwork.

Each source is a 2x3 pack ordered sword, heart, crystal / snow, shield, unused.
Whole connected silhouettes are extracted before re-packing, retaining art
that extends over a nominal source-cell boundary. No icon art is redrawn.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

from prepare_items import extract_background


ROOT = Path(__file__).resolve().parents[1]
PROCESSOR = Path("C:/Users/dungca/.codex/skills/generate2dsprite/scripts/generate2dsprite.py")
NAMES = ("sword", "heart", "crystal", "snow", "shield")


def prepare_special(source: Path, output: Path, kind: str) -> dict:
    if not source.is_file():
        raise FileNotFoundError(f"The generated {kind} sheet is not ready: {source}")
    working = output / f"processed-{kind}"
    working.mkdir(parents=True, exist_ok=True)
    raw = Image.open(source).convert("RGB")
    rgba, mask = extract_background(np.asarray(raw))
    labels, _ = ndi.label(mask)
    counts = np.bincount(labels.ravel())
    slices = ndi.find_objects(labels)
    groups: dict[int, list] = {i: [] for i in range(6)}
    for component in np.flatnonzero(counts[1:] >= 1000)+1:
        sy, sx = slices[component-1]
        cx, cy = (sx.start+sx.stop)/2, (sy.start+sy.stop)/2
        row = min(1, int(cy/raw.height*2))
        col = min(2, int(cx/raw.width*3))
        groups[row*3+col].append((int(counts[component]), (sx.start, sy.start, sx.stop, sy.stop)))
    clean = Image.fromarray(rgba)
    clean.save(working / "source-clean.png")
    records, crops = [], []
    for i, name in enumerate(NAMES):
        if not groups[i]:
            raise RuntimeError(f"Could not find the {name}-{kind} silhouette in source cell {i}")
        area, bbox = max(groups[i])
        if area < 5000:
            raise RuntimeError(f"Suspiciously small {name}-{kind} silhouette: {area} pixels")
        crop = clean.crop(bbox)
        crops.append(crop)
        records.append({"name": f"{name}-{kind}", "source_bbox": list(bbox), "source_size": list(crop.size), "main_component_area": area})

    # The sixth delivery slot is not a runtime item. Duplicate an accepted
    # subject there so strict processor checks can validate a complete grid.
    padded = crops + [crops[0].copy()]
    max_side = max(max(im.size) for im in padded)
    cell = max(512, max_side+96)
    packed = Image.new("RGBA", (cell*3, cell*2))
    for i, prop in enumerate(padded):
        packed.alpha_composite(prop, ((i%3)*cell+(cell-prop.width)//2, (i//3)*cell+(cell-prop.height)//2))
    packed_path = working / "repacked-source.png"
    packed.save(packed_path)
    subprocess.run([sys.executable, str(PROCESSOR), "process", "--input", str(packed_path),
                    "--target", "asset", "--mode", "prop", "--rows", "2", "--cols", "3",
                    "--component-mode", "largest", "--cell-size", "192", "--scale-strategy", "fit",
                    "--fit-scale", "0.90", "--threshold", "1", "--edge-threshold", "1",
                    "--trim-border", "0", "--edge-clean-depth", "0", "--strict-qc",
                    "--output-dir", str(working)], check=True)
    meta = json.loads((working / "pipeline-meta.json").read_text(encoding="utf-8"))
    if meta["edge_touch_frames"] or meta["empty_frames"] or meta["paste_clamped_frames"]:
        raise RuntimeError(f"The {kind} item grid failed strict containment QC")
    icons = []
    for i, record in enumerate(records):
        icon = Image.open(working / f"prop-{i+1}.png").convert("RGBA")
        icon.save(output / f"{record['name']}.png", optimize=True)
        icon.save(output / f"{record['name']}.webp", lossless=True, method=6)
        record["output_bbox"] = list(icon.getbbox())
        record["png"] = f"{record['name']}.png"
        record["webp"] = f"{record['name']}.webp"
        icons.append(icon)

    preview = Image.new("RGB", (1080, 720), "#17192c")
    draw = ImageDraw.Draw(preview)
    for i, (record, icon) in enumerate(zip(records, icons)):
        x, y = (i%3)*360, (i//3)*240
        draw.rectangle((x+180, y, x+359, y+239), fill="#eee9df")
        small = icon.resize((166,166), Image.Resampling.LANCZOS)
        preview.paste(small, (x+7,y+24), small)
        preview.paste(small, (x+187,y+24), small)
        draw.text((x+18,y+206), record["name"], fill="#f6e7ca")
        draw.text((x+198,y+206), record["name"], fill="#242533")
    draw.text((24,530), f"{kind.upper()} / FIVE ITEM IDENTITIES / LIGHT + DARK BACKGROUND QA", fill="#f6e7ca")
    preview.save(output / f"items-{kind}-qc.png")
    report = {"source": str(source.relative_to(ROOT)), "source_preserved": True, "kind": kind,
              "cell_size": 192, "sixth_slot": "processor padding only; duplicate sword; not exported",
              "items": records, "qc_summary": meta["qc_summary"],
              "edge_touch_frames": meta["edge_touch_frames"], "empty_frames": meta["empty_frames"],
              "paste_clamped_frames": meta["paste_clamped_frames"], "preview": f"items-{kind}-qc.png"}
    (output / f"items-{kind}-meta.json").write_text(json.dumps(report,indent=2)+"\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", choices=("bolt", "bomb", "all"), default="all")
    parser.add_argument("--output", type=Path, default=ROOT/"assets/items")
    args = parser.parse_args()
    kinds = ("bolt", "bomb") if args.kind == "all" else (args.kind,)
    results = []
    for kind in kinds:
        result = prepare_special(ROOT/f"assets/raw/items-{kind}.png", args.output.resolve(), kind)
        results.append({"kind": kind, "items": len(result["items"]), "edge_touch_frames": result["edge_touch_frames"], "preview": result["preview"]})
    print(json.dumps(results, indent=2))
