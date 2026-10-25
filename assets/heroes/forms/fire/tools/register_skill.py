"""Write the processed skill/dash sheets (process_skill.py) into forms.json."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
# (form, action in forms.json, ms per frame, cols, rows, processed folder/sheet name)
SHEETS = [(2, "skill", 100, 3, 2, "skill"), (2, "press", 100, 2, 2, "press"), (2, "back", 100, 2, 2, "back"),
          (3, "skill", 100, 3, 2, "skill"), (3, "dash", 90, 3, 2, "dash"), (3, "run", 90, 3, 2, "dash"),
          # Six-star's long glaive, one size in every pose: the polearm sweep is both the basic attack
          # ("attack", read through the kit as "slash") and the hurt fallback; "cast2" is the planted-glaive cast.
          (3, "attack", 100, 3, 2, "strike"), (3, "slash", 100, 3, 2, "strike"), (3, "cast", 100, 3, 2, "cast2")]
p = ROOT / "forms.json"
d = json.loads(p.read_text(encoding="utf-8"))
for form, action, ms, cols, rows, sheet in SHEETS:
    m = json.loads((ROOT / f"form-{form}/{sheet}/process-meta.json").read_text())
    head = d["forms"][str(form)]["actions"]["idle"]["heads"][0]
    d["forms"][str(form)]["actions"][action] = {"file": f"assets/heroes/forms/fire/form-{form}/{sheet}.webp", "cols": cols, "rows": rows,
        "count": cols * rows, "heads": [head] * (cols * rows), "footY": m["footY"], "frameDuration": ms, "scale": m["scale"]}
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("ok")
