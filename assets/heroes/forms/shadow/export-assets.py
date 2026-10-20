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
        "idle": [[148, 84]] * 8,  # Grim Reaper hood top; measure attack/cast/run after ImageGen
        "attack": [[145, 71], [145, 72], [147, 76], [146, 79], [146, 72], [145, 72]],
        "cast": [[145, 71], [144, 72], [143, 72], [144, 77], [144, 76], [145, 72]],
        "run": [[145, 74], [145, 74], [145, 75], [144, 74], [145, 74], [145, 74]],
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
        assert not qc["empty_count"] and not qc["edge_touch_count"] and not qc["paste_clamped_count"], source
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
