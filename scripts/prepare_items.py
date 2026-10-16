"""Extract generated item art without redrawing or changing its design.

The source is a 3x3 generated prop pack. Two complete silhouettes cross the
nominal row boundary, so extract whole connected subjects before repacking.
Only the source background and its antialiased edge spill are removed.
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


NAMES = ("sword", "heart", "crystal", "snow", "shield", "bolt", "bomb", "core", "leaf")
ROOT = Path(__file__).resolve().parents[1]
PROCESSOR = Path("C:/Users/dungca/.codex/skills/generate2dsprite/scripts/generate2dsprite.py")


def extract_background(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Remove connected screen color while protecting purple item facets."""
    color = rgb.astype(np.float64)
    magenta = np.array([255.0, 0.0, 255.0])
    distance = np.linalg.norm(color - magenta, axis=2)
    candidates = distance < 110
    labels, _ = ndi.label(candidates)
    border = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    border = border[border != 0]
    # Near-exact key also removes enclosed cutout gaps, e.g. between ice spikes.
    background = np.isin(labels, border) | (distance < 20)
    foreground = ~background
    alpha = foreground.astype(np.float64)

    # Estimate edge coverage from the nearest confident interior color, then
    # unmix the known magenta matte. Interior pixels remain unchanged.
    inward = ndi.distance_transform_edt(foreground)
    confident = foreground & (inward >= 3) & (distance > 150)
    _, nearest = ndi.distance_transform_edt(~confident, return_indices=True)
    reference = color[nearest[0], nearest[1]]
    delta = reference - magenta
    coverage = np.sum((color-magenta)*delta, axis=2) / np.maximum(1, np.sum(delta*delta, axis=2))
    coverage = np.clip(coverage, 0, 1)
    edge = foreground & (inward <= 2.1) & (coverage < .98)
    alpha[edge] = coverage[edge]
    color[edge] = np.clip((color[edge]-(1-coverage[edge, None])*magenta) / np.maximum(.01, coverage[edge, None]), 0, 255)
    rgba = np.dstack((np.rint(color).astype(np.uint8), np.rint(alpha*255).astype(np.uint8)))
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return rgba, foreground


def prepare(source: Path, output: Path) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    raw = Image.open(source).convert("RGB")
    rgba, mask = extract_background(np.asarray(raw))
    labels, _ = ndi.label(mask)
    counts = np.bincount(labels.ravel())
    major = [int(i) for i in np.argsort(counts[1:])[-9:]+1]
    if len(major) != 9 or min(int(counts[i]) for i in major) < 10000:
        raise RuntimeError("Expected nine clearly separated complete item silhouettes")
    slices = ndi.find_objects(labels)
    boxes = []
    for component in major:
        sy, sx = slices[component-1]
        boxes.append((sx.start, sy.start, sx.stop, sy.stop))
    boxes.sort(key=lambda b: (round(((b[1]+b[3])/2)/raw.height*3-.5), b[0]))
    clean = Image.fromarray(rgba)
    clean.save(output / "source-clean.png")

    cell = 512
    packed = Image.new("RGBA", (cell*3, cell*3))
    records = []
    for i, (name, box) in enumerate(zip(NAMES, boxes)):
        # Keep detached ember details that already lie inside each silhouette's
        # bounding rectangle, without borrowing pixels from neighboring props.
        prop = clean.crop(box)
        x = (i % 3)*cell + (cell-prop.width)//2
        y = (i // 3)*cell + (cell-prop.height)//2
        packed.alpha_composite(prop, (x, y))
        records.append({"name": name, "source_bbox": list(box), "source_size": list(prop.size)})
    packed_path = output / "repacked-source.png"
    packed.save(packed_path)
    processed = output / "processed"
    command = [sys.executable, str(PROCESSOR), "process", "--input", str(packed_path),
               "--target", "asset", "--mode", "prop", "--rows", "3", "--cols", "3",
               "--component-mode", "largest", "--cell-size", "192", "--scale-strategy", "fit",
               "--fit-scale", "0.90", "--threshold", "1", "--edge-threshold", "1",
               "--trim-border", "0", "--edge-clean-depth", "0", "--strict-qc",
               "--output-dir", str(processed)]
    subprocess.run(command, check=True)
    metadata = json.loads((processed / "pipeline-meta.json").read_text(encoding="utf-8"))
    if metadata["edge_touch_frames"] or metadata["empty_frames"] or metadata["paste_clamped_frames"]:
        raise RuntimeError("Item output failed containment QC")
    icons = []
    for i, record in enumerate(records):
        icon = Image.open(processed / f"prop-{i+1}.png").convert("RGBA")
        icon.save(output / f"{record['name']}.png", optimize=True)
        icon.save(output / f"{record['name']}.webp", lossless=True, method=6)
        icons.append(icon)
        record["output_bbox"] = list(icon.getbbox())
        record["png"] = f"{record['name']}.png"
        record["webp"] = f"{record['name']}.webp"

    # QA contact sheet: same extracted art shown against light and dark panels.
    preview = Image.new("RGB", (1080, 720), "#17192c")
    draw = ImageDraw.Draw(preview)
    for i, (record, icon) in enumerate(zip(records, icons)):
        x, y = (i % 3)*360, (i // 3)*240
        draw.rectangle((x+180, y, x+359, y+239), fill="#eee9df")
        small = icon.resize((166, 166), Image.Resampling.LANCZOS)
        preview.paste(small, (x+7, y+24), small)
        preview.paste(small, (x+187, y+24), small)
        draw.text((x+18, y+206), record["name"], fill="#f6e7ca")
        draw.text((x+198, y+206), record["name"], fill="#242533")
    preview.save(output / "items-qc.png")
    report = {"source": str(source.relative_to(ROOT)), "source_preserved": True,
              "method": "Background-connected chroma cleanup; edge matte unmix; whole-silhouette repack; generate2dsprite fit normalization",
              "cell_size": 192, "items": records, "qc_summary": metadata["qc_summary"],
              "edge_touch_frames": metadata["edge_touch_frames"], "empty_frames": metadata["empty_frames"],
              "paste_clamped_frames": metadata["paste_clamped_frames"], "preview": "items-qc.png"}
    (output / "items-meta.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT/"assets/raw/items.png")
    parser.add_argument("--output", type=Path, default=ROOT/"assets/items")
    args = parser.parse_args()
    result = prepare(args.input.resolve(), args.output.resolve())
    print(json.dumps({"items": len(result["items"]), "edge_touch_frames": result["edge_touch_frames"], "empty_frames": result["empty_frames"], "preview": str(args.output/"items-qc.png")}, indent=2))
