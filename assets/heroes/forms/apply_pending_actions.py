"""Keep every star form visually consistent while some action sheets await ImageGen.

When a form's idle has been redrawn but its attack/cast/run sheets still show the
previous design, combat would swap characters mid-attack. Until the matching
sheets are generated, those actions reuse the accepted idle sheet (combat still
supplies lunges and slash FX). The per-hero export scripts rewrite these entries
with real sheets, which drops the `pendingArt` marker automatically.

Also exports Noct's accepted Grim Reaper idle (form 3) for the hub and combat.
No art is drawn here; this only copies and crops accepted ImageGen frames.
"""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent
PENDING = [("fire", "2"), ("earth", "2"), ("ice", "2"), ("lightning", "2"), ("shadow", "3")]
REAPER = ROOT / "shadow/form-3"
# Hood top in the 256px idle frames; the dark scythe spine above it is excluded.
REAPER_HEAD = [148, 84]
# Square head-and-shoulders crop around the hood and the two eyes.
REAPER_PORTRAIT = (106, 76, 192, 162)


def export_reaper_idle(catalog):
    idle = REAPER / "idle"
    meta = json.loads((idle / "pipeline-meta.json").read_text(encoding="utf-8"))
    qc = meta["qc_summary"]
    assert qc["valid_frame_count"] == 8 and not qc["edge_touch_count"] and not qc["paste_clamped_count"], qc
    for index in range(8):
        shutil.copy2(idle / f"idle-{index + 1}.png", idle / f"frame-{index:02d}.png")
    Image.open(idle / "sheet-transparent.png").convert("RGBA").save(REAPER / "idle.webp", lossless=True, method=6)
    master = Image.open(idle / "idle-1.png").convert("RGBA")
    master.save(REAPER / "master.png")
    master.crop(REAPER_PORTRAIT).resize((256, 256), Image.Resampling.LANCZOS).save(REAPER / "portrait.png")
    form = catalog["forms"]["3"]
    form["name"] = "Tử Thần Vô Diện"
    form["actions"]["idle"] = {
        "file": "assets/heroes/forms/shadow/form-3/idle.webp", "cols": 2, "rows": 4, "count": 8,
        "heads": [REAPER_HEAD] * 8, "footY": 0.94, "frameDuration": 120,
    }


for hero, form in PENDING:
    path = ROOT / hero / "forms.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    if (hero, form) == ("shadow", "3"):
        export_reaper_idle(catalog)
    actions = catalog["forms"][form]["actions"]
    for action in ("attack", "cast", "run"):
        actions[action] = {**actions["idle"], "pendingArt": action}
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(hero, form, "actions pending ImageGen: attack, cast, run")
