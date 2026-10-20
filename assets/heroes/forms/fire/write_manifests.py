"""Record inspected face anchors and runtime contracts for Mika/Nori forms."""
from pathlib import Path
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
FORM_ROOT = ROOT / "assets/heroes/forms"
NAMES = {
    "fire": {2: "Kiếm Sư Viêm Miện", 3: "Cửu Vĩ Kiếm Hoàng"},
    "earth": {2: "Thánh Kỵ Cổ Mộc", 3: "Thần Thuẫn Thế Giới"},
}
# Eye/face centers authored in the normalized 512px source-cell coordinate system.
FACE = {
    ("fire", 2, "idle"): [(275,166)] * 8,
    ("fire", 3, "idle"): [(275,190)] * 8,
    ("earth", 2, "idle"): [(276,154)] * 8,
    ("earth", 3, "idle"): [(275,155)] * 8,
    ("fire", 2, "attack"): [(280,174),(280,174),(280,174),(280,186),(280,174),(280,174)],
    ("fire", 2, "cast"): [(295,168),(294,168),(290,168),(292,174),(295,174),(295,174)],
    ("fire", 2, "run"): [(295,173),(299,173),(300,173),(300,173),(300,173),(300,173)],
    ("fire", 3, "attack"): [(290,207),(340,215),(315,235),(325,220),(350,210),(290,200)],
    ("fire", 3, "cast"): [(275,197),(275,197),(275,197),(289,195),(288,195),(275,197)],
    ("fire", 3, "run"): [(305,211),(305,211),(305,211),(305,211),(305,211),(305,211)],
    ("earth", 2, "attack"): [(287,163),(280,190),(315,220),(310,196),(295,166),(285,167)],
    ("earth", 2, "cast"): [(280,165)] * 6,
    ("earth", 2, "run"): [(350,172),(340,172),(340,172),(350,172),(340,172),(340,172)],
    ("earth", 3, "attack"): [(282,170),(305,195),(332,226),(320,205),(300,170),(280,170)],
    ("earth", 3, "cast"): [(282,170),(285,170),(280,200),(285,165),(285,170),(285,170)],
    ("earth", 3, "run"): [(327,187),(327,187),(327,187),(327,187),(327,187),(327,187)],
}
# HUD pins use the crown/ear/antler TOP in the accepted 256px frame, not the
# face center used for portraits. Raised weapons and the nine-tail fan are
# deliberately excluded. Values were reviewed against every clean action grid.
CROWN_Y = {
    ("fire", 2, "idle"): [49,50,49,50,49,49,50,50],
    ("fire", 2, "attack"): [63,63,62,71,62,62],
    ("fire", 2, "cast"): [55,55,55,56,56,56],
    ("fire", 2, "run"): [51,52,55,53,54,59],
    ("fire", 3, "idle"): [72,72,72,72,72,72,72,72],
    ("fire", 3, "attack"): [80,85,89,99,83,82],
    ("fire", 3, "cast"): [80,80,80,79,78,79],
    ("fire", 3, "run"): [81,82,87,83,83,91],
    ("earth", 2, "idle"): [48,48,48,48,48,48,48,48],
    ("earth", 2, "attack"): [51,61,73,76,51,49],
    ("earth", 2, "cast"): [48,50,48,48,48,48],
    ("earth", 2, "run"): [55,54,58,53,57,59],
    ("earth", 3, "idle"): [48,48,48,48,48,48,48,48],
    ("earth", 3, "attack"): [49,62,69,80,55,48],
    ("earth", 3, "cast"): [52,51,66,57,54,52],
    ("earth", 3, "run"): [54,56,59,54,58,69],
}

for hero in ("fire", "earth"):
    payload = {"hero": hero, "forms": {}}
    existing_path = FORM_ROOT / hero / "forms.json"
    existing = json.loads(existing_path.read_text(encoding="utf-8")) if existing_path.exists() else {}
    for form in (2, 3):
        if "--form2-only" in sys.argv and form == 3:
            payload["forms"]["3"] = existing["forms"]["3"]
            continue
        base = FORM_ROOT / hero / f"form-{form}"
        prefix = base.relative_to(ROOT).as_posix()
        info = {"name": NAMES[hero][form], "poster": f"{prefix}/master.png",
                "portrait": f"{prefix}/portrait.png", "actions": {}}
        for action in ("idle", "attack", "cast", "run"):
            if not (base / f"{action}.webp").exists():
                continue
            meta = json.loads((base / action / "pipeline-meta.json").read_text())
            heads = []
            for index, (pos, frame) in enumerate(zip(FACE[hero, form, action], meta["frames"])):
                scale = frame["source_to_output_scale"]
                x, y = frame["anchor_source"]
                tx, ty = frame["anchor_target"]
                heads.append([round(tx + (pos[0]-x)*scale), CROWN_Y[hero, form, action][index]])
            info["actions"][action] = {
                "file": f"{prefix}/{action}.webp", "cols": meta["cols"],
                "rows": meta["rows"], "count": len(heads), "heads": heads,
                "footY": .94, "frameDuration": 120 if action == "idle" else 100,
            }
        if "idle" in info["actions"] and "--landmarks-only" not in sys.argv:
            # Crop the high resolution cleaned source, not the 256px whole-body master.
            x, y = FACE[hero, form, "idle"][0]
            Image.open(base / "idle/raw-sheet-clean.png").crop(
                (x-110,y-100,x+110,y+120)).resize(
                (256,256),Image.Resampling.LANCZOS).save(base / "portrait.png")
        payload["forms"][str(form)] = info
    (FORM_ROOT / hero / "forms.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
