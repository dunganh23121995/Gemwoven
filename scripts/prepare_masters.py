"""Extract accepted ImageGen characters without cutting across grid midlines.

This is deterministic image cleanup only. All character artwork comes from
assets/raw/heroes.png; the connected silhouettes determine each source crop.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/raw/heroes.png"
OUTPUT = ROOT / "assets/masters"
PROCESSOR = Path("C:/Users/dungca/.codex/skills/generate2dsprite/scripts/generate2dsprite.py")
SIZE = 768
BODY_HEIGHT = 500
FEET_LINE = 630
MAGENTA = (255, 0, 255)


def load_processor():
    spec = importlib.util.spec_from_file_location("sprite_processor", PROCESSOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def despill_boundary(rgba):
    """Replace key-coloured boundary tint with the nearest intact body colour."""
    data = np.array(rgba)
    visible = data[:, :, 3] > 0
    distance = ndimage.distance_transform_edt(visible)
    rgb = data[:, :, :3].astype(np.int16)
    magenta_tint = (np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]) > 35
    edge_spill = visible & (distance <= 2.1) & magenta_tint
    safe = visible & (distance > 2.1) & ~magenta_tint
    if safe.any() and edge_spill.any():
        _, indices = ndimage.distance_transform_edt(~safe, return_indices=True)
        nearest = data[indices[0], indices[1], :3]
        observed = data[edge_spill, :3].astype(np.float32)
        foreground = nearest[edge_spill].astype(np.float32)
        key = np.array(MAGENTA, dtype=np.float32)
        direction = foreground - key
        coverage = np.clip(np.sum((observed - key) * direction, axis=1) / np.maximum(1, np.sum(direction * direction, axis=1)), 0, 1)
        data[edge_spill, :3] = nearest[edge_spill]
        data[edge_spill, 3] = np.round(coverage * data[edge_spill, 3]).astype(np.uint8)
    return Image.fromarray(data, "RGBA")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    processor = load_processor()
    source = Image.open(SOURCE).convert("RGB")
    pixels = np.asarray(source).astype(np.int16)
    r, g, b = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
    background = (r > 170) & (b > 150) & (g < 120) & ((r - g) > 75) & ((b - g) > 65)
    labels, _ = ndimage.label(~background, structure=np.ones((3, 3), dtype=bool))
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    ids = np.argsort(areas)[-4:]
    objects = ndimage.find_objects(labels)
    components = []
    for component_id in ids:
        y, x = objects[component_id - 1]
        components.append({"id": int(component_id), "bbox": [x.start, y.start, x.stop, y.stop], "area": int(areas[component_id])})
    # Label semantic identity by whole-silhouette origin, never by clipping cells.
    components.sort(key=lambda item: item["bbox"][1])
    top = sorted(components[:2], key=lambda item: item["bbox"][0])
    bottom = sorted(components[2:], key=lambda item: item["bbox"][0])
    metadata = {"source": str(SOURCE.relative_to(ROOT)), "cell_size": SIZE, "subject_height": BODY_HEIGHT, "feet_line": FEET_LINE, "characters": {}}

    for key, component in zip(("fire", "earth", "ice", "lightning"), top + bottom):
        x0, y0, x1, y1 = component["bbox"]
        crop_box = (max(0, x0 - 5), max(0, y0 - 5), min(source.width, x1 + 5), min(source.height, y1 + 5))
        support = ndimage.binary_dilation(labels == component["id"], iterations=3)
        crop = source.crop(crop_box).convert("RGBA")
        cropped_support = support[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]]
        crop_array = np.array(crop)
        crop_array[~cropped_support] = (*MAGENTA, 255)
        crop = Image.fromarray(crop_array, "RGBA").copy()
        # Reuse the skill's chroma cleanup; allow a padded boundary for its flood fill.
        cleaned = processor.remove_bg_magenta(crop, threshold=110, edge_threshold=150)
        cleaned_array = np.array(cleaned)
        # The connected-components threshold also catches slightly off-magenta
        # generated pixels that the Euclidean keyer can conservatively retain.
        cr, cg, cb = [cleaned_array[:, :, i].astype(np.int16) for i in range(3)]
        spill = (cr > 170) & (cb > 150) & (cg < 120) & ((cr - cg) > 75) & ((cb - cg) > 65)
        cleaned_array[spill] = 0
        cleaned = despill_boundary(Image.fromarray(cleaned_array, "RGBA"))
        bbox = cleaned.getbbox()
        if bbox is None:
            raise RuntimeError(f"Empty character after cleanup: {key}")
        trimmed = cleaned.crop(bbox)
        width = round(trimmed.width * BODY_HEIGHT / trimmed.height)
        resized = trimmed.resize((width, BODY_HEIGHT), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.alpha_composite(resized, ((SIZE - width) // 2, FEET_LINE - BODY_HEIGHT))
        transparent_path = OUTPUT / f"{key}-transparent.png"
        canvas.save(transparent_path, optimize=True)
        reference = Image.new("RGB", (SIZE, SIZE), MAGENTA)
        reference.paste(canvas, mask=canvas.getchannel("A"))
        reference.save(OUTPUT / f"{key}.png", optimize=True)

        alpha_bbox = canvas.getbbox()
        if alpha_bbox[1] != FEET_LINE - BODY_HEIGHT or alpha_bbox[3] != FEET_LINE:
            raise RuntimeError(f"Unexpected master anchor: {key}: {alpha_bbox}")
        if min(alpha_bbox[0], alpha_bbox[1], SIZE - alpha_bbox[2], SIZE - alpha_bbox[3]) < 60:
            raise RuntimeError(f"Insufficient master padding: {key}: {alpha_bbox}")
        metadata["characters"][key] = {
            **component,
            "source_crop": list(crop_box),
            "output_alpha_bbox": list(alpha_bbox),
            "opaque_area": processor.alpha_area(canvas),
            "reference": f"{key}.png",
            "transparent": f"{key}-transparent.png",
            "qc": {"complete_silhouette": True, "edge_touch": False, "feet_aligned": True},
        }
        print(f"{key}: {OUTPUT / (key + '.png')} | source bbox {component['bbox']} | master bbox {alpha_bbox}", flush=True)

    (OUTPUT / "masters.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
