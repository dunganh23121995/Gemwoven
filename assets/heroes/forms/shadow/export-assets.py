"""Package the accepted built-in ImageGen Noct evolution sheets for runtime."""
import json
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
NAMES = {"2": "Nguyệt Ảnh", "3": "Tử Thần Vô Diện"}
# Tight square head-and-shoulders crops; padded above the hood/crown for circles.
PORTRAIT_BOXES = {"2": (106, 48, 214, 156), "3": (106, 76, 192, 162)}
# Authored hood-top landmarks in 256px runtime cells, excluding raised weapons.
HEADS = {
    "2": {
        "idle": [[163, 60]] * 8,
        "attack": [[163, 60]] * 6,
        "cast": [[163, 60]] * 6,
        "run": [[157, 60]] * 6,
    },
    "3": {
        # Grim Reaper hood top: glowing-eye centre + (4, -43), the offset authored on idle.
        "idle": [[148, 84]] * 8,
        "attack": [[149, 96], [161, 97], [151, 94], [148, 93], [150, 111], [147, 97]],
        "cast": [[145, 91], [142, 90], [140, 91], [141, 88], [140, 88], [141, 88]],
        "run": [[165, 97], [186, 110], [178, 106], [167, 103], [183, 115], [173, 106]],
    },
}

parser = argparse.ArgumentParser()
parser.add_argument("--form", choices=("2", "3"), action="append")
selected = parser.parse_args().form or list(NAMES)
manifest_path = ROOT / "forms.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"hero": "shadow", "forms": {}}
for form, name in NAMES.items():
    if form not in selected:
        continue
    folder = ROOT / f"form-{form}"
    prefix = folder.relative_to(REPO).as_posix()
    form_meta = {
        "name": name,
        "poster": f"{prefix}/master.png",
        "portrait": f"{prefix}/portrait.png",
        "actions": {},
    }
    master = Image.open(folder / "idle/idle-1.png").convert("RGBA")
    master.save(folder / "master.png")
    master.crop(PORTRAIT_BOXES[form]).resize((256, 256), Image.Resampling.LANCZOS).save(folder / "portrait.png")
    for action in ("idle", "attack", "cast", "run"):
        source = folder / action
        meta = json.loads((source / "pipeline-meta.json").read_text())
        meta["prompt"] = (source / "prompt-used.txt").read_text(encoding="utf-8-sig")
        (source / "pipeline-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        sheet = Image.open(source / "sheet-transparent.png").convert("RGBA")
        assert sheet.getextrema()[3] == (0, 255), f"Missing alpha: {source}"
        qc = meta["qc_summary"]
        # A raw blade tip may graze its source cell (reviewed, --allow-source-edge-touch); output frames may not.
        assert not qc["empty_count"] and not meta["output_edge_touch_frames"] and not qc["paste_clamped_count"], source
        sheet.save(folder / f"{action}.webp", lossless=True, method=6)
        count = 8 if action == "idle" else 6
        for index in range(count):
            frame = Image.open(source / f"{action}-{index + 1}.png").convert("RGBA")
            frame.save(source / f"frame-{index:02d}.png")
        form_meta["actions"][action] = {
            "file": f"{prefix}/{action}.webp",
            "cols": 2 if action == "idle" else 3,
            "rows": 4 if action == "idle" else 2,
            "count": count,
            "heads": HEADS[form][action],
            "footY": 0.94,
            "frameDuration": 120 if action == "idle" else 100,
        }
        print(form, action, "QC", json.dumps(qc))
    manifest["forms"][form] = form_meta
(ROOT / "forms.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
