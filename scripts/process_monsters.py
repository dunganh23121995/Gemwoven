"""Extract and validate genuine ImageGen monster attack frames.

All creative imagery comes from assets/raw/enemy-*.png. This script only keys,
isolates complete silhouettes, aligns them at a shared scale, and exports atlas
and GIF formats through the generate2dsprite processor.
"""
from __future__ import annotations

import argparse
import contextlib
import io
import json
import shutil
from pathlib import Path

from PIL import Image

from process_hero_sheets import extract_canonical, full_silhouette_anchor, processor_module


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/monsters"
ELEMENTS = ("fire", "earth", "ice", "lightning")
NAMES = {"fire": "Rồng Hổ Phách", "earth": "Hộ Vệ Rêu Ngọc", "ice": "Cú Tuyết Pha Lê", "lightning": "Thú Bão Tử Điện"}
CELL = 256
FIT_SCALE = .80
ELEMENT_FIT = {"lightning": .88}
ATTACK_DURATIONS = [220, 250, 160, 190, 210, 270]


def save_atlas(frames, path, columns, rows):
    atlas = Image.new("RGBA", (CELL * columns, CELL * rows))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((index % columns) * CELL, (index // columns) * CELL))
    atlas.save(path.with_suffix(".png"), optimize=True)
    atlas.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6, exact=True)
    return atlas


def process_monster(element):
    raw = ROOT / "assets/raw" / f"enemy-{element}.png"
    action_dir = OUTPUT / element / "attack"
    canonical = action_dir / "normalized-source.png"
    extraction = extract_canonical(raw, canonical, rows=2, cols=3)
    engine = processor_module()
    engine.estimate_anchor = full_silhouette_anchor
    fit_scale = ELEMENT_FIT.get(element, FIT_SCALE)
    command = [
        "process", "--input", str(canonical), "--target", "creature", "--mode", "attack",
        "--rows", "2", "--cols", "3", "--output-dir", str(action_dir),
        "--cell-size", str(CELL), "--fit-scale", str(fit_scale), "--align", "feet",
        "--scale-strategy", "preserve", "--shared-scale", "--component-mode", "largest",
        "--min-component-area", "12", "--trim-border", "0", "--edge-clean-depth", "0",
        "--edge-touch-margin", "2", "--threshold", "0", "--edge-threshold", "0",
        "--duration", "210", "--strict-qc", "--max-anchor-y-std", ".05",
        "--write-scale-profile", str(OUTPUT / element / "creature-scale-profile.json"),
        "--profile-name", f"enemy-{element}",
    ]
    with contextlib.redirect_stdout(io.StringIO()):
        engine.cmd_process(engine.build_parser().parse_args(command))
    meta = json.loads((action_dir / "pipeline-meta.json").read_text(encoding="utf-8"))
    frames = []
    for index, label in enumerate(meta["frame_labels"]):
        frame = Image.open(action_dir / f"{label}.png").convert("RGBA")
        frame.save(action_dir / f"frame-{index:02}.png", optimize=True)
        frames.append(frame)
    save_atlas(frames, OUTPUT / element / "attack", columns=3, rows=2)
    save_atlas(frames, action_dir / "sheet-transparent", columns=3, rows=2)
    shutil.copyfile(raw.with_name(raw.stem + "-prompt.txt"), action_dir / "prompt-used.txt")

    idle_frames = [frames[0], frames[5]]
    idle_dir = OUTPUT / element / "idle"
    idle_dir.mkdir(parents=True, exist_ok=True)
    save_atlas(idle_frames, OUTPUT / element / "idle", columns=2, rows=1)
    save_atlas(idle_frames, idle_dir / "sheet-transparent", columns=2, rows=1)
    engine.save_transparent_gif(idle_frames, idle_dir / "animation.gif", duration=520)
    for index, frame in enumerate(idle_frames):
        frame.save(idle_dir / f"frame-{index:02}.png", optimize=True)
    frames[0].save(OUTPUT / element / "portrait.png", optimize=True)
    frames[0].save(OUTPUT / element / "portrait.webp", "WEBP", lossless=True, method=6, exact=True)

    common = {
        "element": element, "name": NAMES[element], "frameWidth": CELL, "frameHeight": CELL,
        "frameOrder": "row-major", "facing": "left", "accepted": True,
        "origin": meta.get("output_origin", [128, 231]),
        "scaleProfile": "creature-scale-profile.json", "source": extraction["raw_source"],
        "sourceSha256": extraction["raw_sha256"],
    }
    attack = {
        **common, "action": "attack", "atlas": "attack.webp", "columns": 3, "rows": 2,
        "frames": 6, "loop": False, "frameDuration": 210, "frameDurations": ATTACK_DURATIONS,
        "impactFrame": 3, "frameFiles": [f"attack/frame-{index:02}.png" for index in range(6)],
        "qc": meta["qc_summary"],
        "recoveredGridCrossings": [item["index"] for item in extraction["frames"] if item["source_grid_boundary_crossing_recovered"]],
    }
    idle = {
        **common, "action": "idle", "atlas": "idle.webp", "columns": 2, "rows": 1,
        "frames": 2, "loop": True, "frameDuration": 520, "frameDurations": [520, 520],
        "frameFiles": ["idle/frame-00.png", "idle/frame-01.png"],
        "derivedFrom": {"action": "attack", "frames": [0, 5], "method": "reuse accepted ready and recovered authored poses"},
        "qc": {"emptyFrames": [], "edgeTouchFrames": [], "sharedScale": True, "completeSilhouettes": True},
    }
    (action_dir / "runtime-meta.json").write_text(json.dumps(attack, ensure_ascii=False, indent=2), encoding="utf-8")
    (idle_dir / "runtime-meta.json").write_text(json.dumps(idle, ensure_ascii=False, indent=2), encoding="utf-8")
    character = {"element": element, "name": NAMES[element], "portrait": "portrait.webp", "actions": {"idle": idle, "attack": attack}}
    (OUTPUT / element / "meta.json").write_text(json.dumps(character, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ACCEPTED {element}: 6 actual attack poses + 2 ready/rest poses; QC {meta['qc_summary']}", flush=True)
    return character


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--element", nargs="+", choices=ELEMENTS, default=list(ELEMENTS))
    args = parser.parse_args()
    failures = []
    for element in args.element:
        try:
            process_monster(element)
        except Exception as error:
            failures.append({"element": element, "error": str(error)})
            print(f"QC FAILED {element}: {error}", flush=True)
    monsters = {}
    for element in ELEMENTS:
        meta = OUTPUT / element / "meta.json"
        if meta.exists():
            monsters[element] = json.loads(meta.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {"version": 1, "cellSize": CELL, "facing": "left", "monsters": monsters}
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT / "qc-review-required.json").write_text(json.dumps(failures, indent=2), encoding="utf-8")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
