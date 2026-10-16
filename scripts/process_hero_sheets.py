"""Deterministic extraction and QC of ImageGen hero action sheets.

Artwork is never created here. A whole connected silhouette is assigned to its
authored grid slot before alignment, so a raised sword crossing an empty gutter
is recovered without clipping. Every source cell uses the same magnification;
all actions subsequently reuse one accepted idle scale profile per hero.
"""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from prepare_masters import despill_boundary


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/raw"
OUTPUT = ROOT / "assets/heroes"
PROCESSOR = Path("C:/Users/dungca/.codex/skills/generate2dsprite/scripts/generate2dsprite.py")
HEROES = ("fire", "earth", "ice", "lightning", "shadow")
ACTIONS = ("idle", "attack", "cast", "run")
NORMALIZED_CELL = 512
CELL = 256
FIT_SCALE = 0.88
HERO_FIT_SCALE = {"earth": 0.84}
RAW_FEET = 470
MAX_SCALE_CV = 0.08
MAX_ANCHOR_STD = 0.05
MAX_PROFILE_DRIFT = 0.08
# Reviewed foot roots for two hammer-down poses. The grounded hammer is not a
# foot; using its silhouette would shift the actor sideways. Hash-lock these
# annotations so replacement artwork cannot silently inherit old coordinates.
SOURCE_FOOT_ROOTS = {
    "earth-attack.png": {
        "sha256": "8ac7abdc7c4e99d323e2b70ae64e1112fd568a159c9aa7af03e11ca5f55d6a1c",
        "anchors": {3: (242 / 512, 390 / 512), 4: (245 / 512, 390 / 512)},
    }
}


def processor_module():
    spec = importlib.util.spec_from_file_location("sprite_processor", PROCESSOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def full_silhouette_anchor(image, bbox, align):
    """Keep both boots in a lunge; the generic center crop can omit one boot."""
    if not bbox:
        return image.width / 2, image.height / 2
    if align == "center":
        return (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    ys, xs = np.nonzero(np.asarray(image.getchannel("A")) > 8)
    inside = (xs >= bbox[0]) & (xs < bbox[2]) & (ys >= bbox[1]) & (ys < bbox[3])
    ys, xs = ys[inside], xs[inside]
    if not len(ys):
        return (bbox[0] + bbox[2]) / 2, bbox[3]
    lower = ys >= np.percentile(ys, 85)
    return float(np.median(xs[lower])), float(np.percentile(ys, 98))


def key_background(image: Image.Image) -> Image.Image:
    """Remove exterior key colour and exact key holes; preserve interior colours."""
    data = np.array(image.convert("RGBA"))
    rgb = data[:, :, :3].astype(np.int16)
    red, green, blue = (rgb[:, :, i] for i in range(3))
    candidate = (red > 180) & (blue > 170) & (green < 140) & (np.minimum(red, blue) - green > 85)
    seeds = np.zeros(candidate.shape, bool)
    seeds[0] = candidate[0]
    seeds[-1] = candidate[-1]
    seeds[:, 0] |= candidate[:, 0]
    seeds[:, -1] |= candidate[:, -1]
    outside = ndimage.binary_propagation(seeds, mask=candidate)
    # Exact chroma in enclosed gaps is background; broader purple garment colours
    # are retained and only colour spill right on the alpha boundary is repaired.
    exact_key = np.sum((rgb.astype(np.float32) - np.array([255, 0, 255])) ** 2, axis=2) < 62 ** 2
    data[outside | exact_key] = 0
    return despill_boundary(Image.fromarray(data, "RGBA"))


def extract_canonical(source: Path, output: Path, rows: int, cols: int):
    original = Image.open(source).convert("RGBA")
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    annotation = SOURCE_FOOT_ROOTS.get(source.name, {})
    manual_roots = annotation.get("anchors", {}) if annotation.get("sha256") == source_hash else {}
    cell_width, cell_height = original.width / cols, original.height / rows
    if abs(cell_width / cell_height - 1) > 0.015:
        raise RuntimeError(f"{source.name}: non-square raw cells {cell_width:g} x {cell_height:g}; regenerate at {cols}: {rows} aspect ratio.")
    cleaned = key_background(original)
    pixels = np.array(cleaned)
    labels, count = ndimage.label(pixels[:, :, 3] > 8, structure=np.ones((3, 3), bool))
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    ids = np.argsort(areas)[-(rows * cols):]
    if len(ids) != rows * cols or min(areas[ids]) < original.width * original.height * 0.009:
        raise RuntimeError(f"{source.name}: cannot identify {rows * cols} complete character silhouettes.")
    objects = ndimage.find_objects(labels)
    sheet = Image.new("RGBA", (NORMALIZED_CELL * cols, NORMALIZED_CELL * rows))
    used = set()
    records = []
    magnification = NORMALIZED_CELL / cell_width
    for component_id in ids:
        ys, xs = np.nonzero(labels == component_id)
        row = min(rows - 1, int(np.median(ys) // cell_height))
        col = min(cols - 1, int(np.median(xs) // cell_width))
        if (row, col) in used:
            raise RuntimeError(f"{source.name}: two connected characters assigned to cell {(row, col)}.")
        used.add((row, col))
        y_slice, x_slice = objects[component_id - 1]
        bbox = (x_slice.start, y_slice.start, x_slice.stop, y_slice.stop)
        # The root follows the median of the lower silhouette, never sword/cape width.
        lower = ys >= np.percentile(ys, 85)
        anchor_x = float(np.median(xs[lower]))
        anchor_y = float(np.percentile(ys, 98))
        manual_root = manual_roots.get(row * cols + col)
        if manual_root:
            anchor_x = (col + manual_root[0]) * cell_width
            anchor_y = (row + manual_root[1]) * cell_height
        support = ndimage.binary_dilation(labels == component_id, iterations=2)
        isolated = pixels[y_slice, x_slice].copy()
        isolated[~support[y_slice, x_slice]] = 0
        crop = Image.fromarray(isolated, "RGBA")
        resized = crop.resize((round(crop.width * magnification), round(crop.height * magnification)), Image.Resampling.LANCZOS)
        paste_x = round(NORMALIZED_CELL / 2 - (anchor_x - bbox[0]) * magnification)
        paste_y = round(RAW_FEET - (anchor_y - bbox[1]) * magnification)
        requested_translation = [paste_x, paste_y]
        if resized.width > NORMALIZED_CELL - 6 or resized.height > NORMALIZED_CELL - 6:
            raise RuntimeError(f"{source.name}: frame {row * cols + col} cannot fit at the shared scale: box {(paste_x, paste_y, resized.width, resized.height)}. Regenerate a contained pose.")
        # Extraction is allowed to translate a complete silhouette into its cell.
        # The skill processor performs final foot alignment at the locked scale;
        # no image pixels are clipped and neither dimension is independently fit.
        paste_x = max(3, min(paste_x, NORMALIZED_CELL - 3 - resized.width))
        paste_y = max(3, min(paste_y, NORMALIZED_CELL - 3 - resized.height))
        sheet.alpha_composite(resized, (col * NORMALIZED_CELL + paste_x, row * NORMALIZED_CELL + paste_y))
        source_crossing = bbox[0] < col * cell_width or bbox[2] > (col + 1) * cell_width or bbox[1] < row * cell_height or bbox[3] > (row + 1) * cell_height
        if bbox[0] <= 1 or bbox[1] <= 1 or bbox[2] >= original.width - 1 or bbox[3] >= original.height - 1:
            raise RuntimeError(f"{source.name}: frame {row * cols + col} touches the image boundary; verify/regenerate the original silhouette.")
        records.append({
            "index": row * cols + col,
            "source_bbox": list(bbox),
            "source_anchor": [anchor_x - col * cell_width, anchor_y - row * cell_height],
            "source_anchor_normalized": [(anchor_x - col * cell_width) / cell_width, (anchor_y - row * cell_height) / cell_height],
            "source_grid_boundary_crossing_recovered": bool(source_crossing),
            "canonical_translation": [paste_x, paste_y],
            "canonical_containment_translation": [paste_x - requested_translation[0], paste_y - requested_translation[1]],
            "reviewed_foot_root": bool(manual_root),
            "canonical_anchor": [paste_x + (anchor_x - bbox[0]) * magnification, paste_y + (anchor_y - bbox[1]) * magnification],
            "canonical_size": list(resized.size),
            "shared_raw_magnification": magnification,
            "component_area": int(areas[component_id]),
        })
    records.sort(key=lambda item: item["index"])
    raw_anchor_std = float(np.std([item["source_anchor_normalized"][1] for item in records]))
    metadata = {
        "raw_source": str(source.relative_to(ROOT)).replace("\\", "/"),
        "raw_sha256": source_hash,
        "raw_dimensions": list(original.size),
        "raw_cell_dimensions": [cell_width, cell_height],
        "normalization": "one uniform raw-cell magnification; translation only per frame",
        "normalized_cell_size": NORMALIZED_CELL,
        "canonical_feet_line": RAW_FEET,
        "original_anchor_y_std": raw_anchor_std,
        "interior_color_preservation": "exterior flood key + exact magenta holes + boundary-only despill",
        "frames": records,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, optimize=True)
    (output.parent / "extraction-meta.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    if raw_anchor_std > MAX_ANCHOR_STD:
        raise RuntimeError(f"{source.name}: original anchor Y std {raw_anchor_std:.4f} exceeds {MAX_ANCHOR_STD}; see extraction-meta.json.")
    return metadata


def process_action(hero: str, action: str, refresh_profile: bool = False):
    source = RAW / f"{hero}-{action}.png"
    if not source.exists():
        print(f"PENDING {hero}/{action}: raw sheet has not arrived", flush=True)
        return None
    rows, cols = (2, 2) if action == "idle" else (2, 3)
    action_dir = OUTPUT / hero / action
    profile_path = OUTPUT / hero / "character-scale-profile.json"
    fit_scale = HERO_FIT_SCALE.get(hero, FIT_SCALE)
    if action != "idle" and not profile_path.exists():
        raise RuntimeError(f"{hero}/{action}: process and accept idle before any other action.")
    canonical = action_dir / "normalized-source.png"
    extraction = extract_canonical(source, canonical, rows, cols)
    command = [
        "process", "--input", str(canonical),
        "--target", "player", "--mode", "cast" if action in ("buff", "hover") else action, "--rows", str(rows), "--cols", str(cols),
        "--output-dir", str(action_dir), "--cell-size", str(CELL),
        "--fit-scale", str(fit_scale), "--align", "feet", "--scale-strategy", "preserve", "--shared-scale",
        "--component-mode", "largest", "--component-padding", "0", "--min-component-area", "12",
        "--trim-border", "0", "--edge-clean-depth", "0", "--edge-touch-margin", "2",
        # Input is already RGBA with conservative key cleanup. Do not re-key colours.
        "--threshold", "0", "--edge-threshold", "0", "--strict-qc",
        "--max-body-scale-cv", str(MAX_SCALE_CV), "--max-anchor-y-std", str(MAX_ANCHOR_STD),
        # Unarmed running removes hammer/shield area from the silhouette metric.
        # Keep the same pixel magnification and separately gate subject height.
        # Noct's reviewed low, wide samurai stance has less opaque body area.
        # Keep the SAME pixel magnification; verify its upright bookends below.
        "--max-profile-scale-drift", str(0.15 if action == "run" else 0.09 if hero == "shadow" and action == "cast" else MAX_PROFILE_DRIFT),
        "--duration", "230" if action == "idle" else "150",
    ]
    if profile_path.exists() and not (refresh_profile and action == "idle"):
        command += ["--scale-profile", str(profile_path)]
    else:
        command += ["--write-scale-profile", str(profile_path), "--profile-name", hero]
    engine = processor_module()
    # Full feet geometry is needed for wide lunges. All scale/QC/export behavior
    # remains the skill processor's preserve-scale path and strict thresholds.
    anchor_index = 0
    def annotated_anchor(image, bbox, align):
        nonlocal anchor_index
        record = extraction["frames"][anchor_index]
        anchor_index += 1
        if action in ("run", "hover"):
            # A narrow extended toe lies below the 98th percentile during strides.
            # Anchor to its real contact line, retaining every pixel at locked scale.
            x, _ = full_silhouette_anchor(image, bbox, align)
            return x, bbox[3] - 1
        if record["reviewed_foot_root"]:
            return tuple(record["canonical_anchor"])
        return full_silhouette_anchor(image, bbox, align)
    engine.estimate_anchor = annotated_anchor
    error = None
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            engine.cmd_process(engine.build_parser().parse_args(command))
    except ValueError as exception:
        error = str(exception)
    meta_path = action_dir / "pipeline-meta.json"
    if not meta_path.exists():
        raise RuntimeError(f"{hero}/{action}: processor failed: {error}")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    if error:
        print(f"QC FAILED {hero}/{action}: {error}", flush=True)
        return {"hero": hero, "action": action, "accepted": False, "error": error, "qc": meta.get("qc_summary", {})}
    if action == "run":
        idle_meta = json.loads((OUTPUT / hero / "idle/pipeline-meta.json").read_text(encoding="utf-8"))
        height_ratio = meta["qc_summary"]["output_subject_height_mean"] / idle_meta["qc_summary"]["output_subject_height_mean"]
        if not 0.90 <= height_ratio <= 1.10:
            raise RuntimeError(f"{hero}/run: anatomical height drift {height_ratio:.3f}")
    if hero == "shadow" and action == "cast":
        idle_frame = Image.open(OUTPUT / hero / 'idle/frame-00.png').convert('RGBA')
        idle_box = idle_frame.getchannel('A').getbbox()
        for index in [0, 5]:
            frame = Image.open(action_dir / f"{meta['frame_labels'][index]}.png").convert('RGBA')
            box = frame.getchannel('A').getbbox()
            ratio = (box[3]-box[1]) / (idle_box[3]-idle_box[1])
            if not 0.90 <= ratio <= 1.10:
                raise RuntimeError(f'Noct upright cast frame {index} changes body height: {ratio:.3f}')
    # Reassemble with alpha_composite: avoids multiplying edge alpha a second time.
    atlas = Image.new("RGBA", (cols * CELL, rows * CELL))
    frame_paths = []
    frame_hashes = []
    for index, label in enumerate(meta["frame_labels"]):
        frame = Image.open(action_dir / f"{label}.png").convert("RGBA")
        frame_name = f"frame-{index:02}.png"
        frame.save(action_dir / frame_name, optimize=True)
        frame_paths.append(f"{action}/{frame_name}")
        frame_hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
        atlas.alpha_composite(frame, ((index % cols) * CELL, (index // cols) * CELL))
    if len(set(frame_hashes)) != rows * cols:
        raise RuntimeError(f"{hero}/{action}: duplicate poses detected; regenerate actual animation frames.")
    atlas.save(action_dir / "sheet-transparent.png", optimize=True)
    runtime_path = OUTPUT / hero / f"{action}.webp"
    atlas.save(runtime_path, "WEBP", lossless=True, method=6, exact=True)
    shutil.copyfile(runtime_path, action_dir / "sheet-transparent.webp")
    if source.with_name(source.stem + "-prompt.txt").exists():
        shutil.copyfile(source.with_name(source.stem + "-prompt.txt"), action_dir / "prompt-used.txt")
    runtime = {
        "hero": hero, "action": action, "accepted": True,
        "atlas": f"{action}.webp", "frameWidth": CELL, "frameHeight": CELL,
        "columns": cols, "rows": rows, "frames": rows * cols,
        "frameOrder": "row-major", "loop": action == "idle", "frameDuration": 230 if action == "idle" else 150,
        "origin": meta.get("output_origin", [CELL / 2, CELL - int(CELL * (1 - fit_scale) * .5)]),
        "frameFiles": frame_paths,
        "uniqueFrames": len(set(frame_hashes)), "framePixelHashes": frame_hashes,
        "sharedScaleProfile": "character-scale-profile.json",
        "anchorEstimator": "median of lower silhouette; bottommost toe Y" if action in ("run", "hover") else "median of lower 15% across full silhouette; 98th percentile Y",
        "reviewedFootRootFrames": [item["index"] for item in extraction["frames"] if item["reviewed_foot_root"]],
        "source": extraction["raw_source"], "sourceSha256": extraction["raw_sha256"],
        "qc": meta.get("qc_summary", {}),
        "originalAnchorYStd": extraction["original_anchor_y_std"],
        "recoveredGridCrossings": [item["index"] for item in extraction["frames"] if item["source_grid_boundary_crossing_recovered"]],
    }
    (action_dir / "runtime-meta.json").write_text(json.dumps(runtime, indent=2), encoding="utf-8")
    print(f"ACCEPTED {hero}/{action}: {atlas.width} x {atlas.height}, CV {runtime['qc']['body_scale_cv']:.4f}, drift {runtime['qc'].get('profile_body_scale_drift', 0):.4f}", flush=True)
    return runtime


def update_manifest():
    heroes = {}
    for hero in HEROES:
        actions = {}
        for action in (*ACTIONS, *(("smash",) if hero == "earth" else ("buff", "hover") if hero == "shadow" else ())):
            path = OUTPUT / hero / action / "runtime-meta.json"
            if path.exists():
                actions[action] = json.loads(path.read_text(encoding="utf-8"))
        if actions:
            heroes[hero] = actions
            (OUTPUT / hero / "meta.json").write_text(json.dumps({"hero": hero, "cellSize": CELL, "actions": actions}, indent=2), encoding="utf-8")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "manifest.json").write_text(json.dumps({"version": 1, "cellSize": CELL, "heroes": heroes}, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hero", nargs="+", choices=HEROES, default=list(HEROES))
    parser.add_argument("--action", nargs="+", choices=(*ACTIONS, "smash", "buff", "hover"), default=list(ACTIONS))
    parser.add_argument("--refresh-profile", action="store_true", help="Reaccept idle with the hero-wide safety margin, then reprocess all actions together.")
    args = parser.parse_args()
    if args.refresh_profile and set(args.action) != set(ACTIONS):
        parser.error("--refresh-profile requires all standard actions to preserve the shared-scale contract")
    failed = []
    report_path = OUTPUT / "qc-review-required.json"
    previous = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else []
    unresolved = {(item["hero"], item["action"]): item for item in previous}
    for hero in args.hero:
        for action in (*ACTIONS, *(("smash",) if hero == "earth" else ("buff", "hover") if hero == "shadow" else ())):
            if action not in args.action or (hero == "shadow" and action == "run"):
                continue
            try:
                result = process_action(hero, action, args.refresh_profile)
                if result and not result["accepted"]:
                    failed.append(result)
                    unresolved[(hero, action)] = result
                elif result:
                    unresolved.pop((hero, action), None)
            except Exception as error:
                print(f"QC FAILED {hero}/{action}: {error}", flush=True)
                item = {"hero": hero, "action": action, "error": str(error)}
                failed.append(item)
                unresolved[(hero, action)] = item
    update_manifest()
    report_path.write_text(json.dumps(list(unresolved.values()), indent=2), encoding="utf-8")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
