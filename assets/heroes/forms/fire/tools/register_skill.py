"""Write the processed skill/dash sheets (process_skill.py) into forms.json."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SHEETS = [(2, "skill", 100), (3, "skill", 100), (3, "dash", 90)]
p = ROOT / "forms.json"
d = json.loads(p.read_text(encoding="utf-8"))
for form, action, ms in SHEETS:
    m = json.loads((ROOT / f"form-{form}/{action}/process-meta.json").read_text())
    head = d["forms"][str(form)]["actions"]["idle"]["heads"][0]
    d["forms"][str(form)]["actions"][action] = {"file": f"assets/heroes/forms/fire/form-{form}/{action}.webp", "cols": 3, "rows": 2,
        "count": 6, "heads": [head] * 6, "footY": m["footY"], "frameDuration": ms, "scale": m["scale"]}
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("ok")
