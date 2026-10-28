"""Re-cut a form's showcase sheets (hero-show.js) from their accepted Codex drawings at a sharper cell.

The showcase sheets were cut at 384 px cells with the figure filling 55% of the cell (about 210 px
tall), well below what Codex drew (about 350 px), so the hub showed them blurred. This processes
each accepted drawing (showcase/raw-<name>.png) again exactly as make_showcase.py does, at CELL px;
the hub sizes every sheet by percentages, so only the sharpness changes. The drawings are not redrawn.

  python assets/heroes/forms/sharpen_showcase.py <hero> <form> [name ...]   (default: every sheet)
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FIDGET = ROOT / "assets/gemwoven/elites/fidget.py"
sys.path.insert(0, str(FIDGET.parent))
import fidget  # noqa: E402

CELL = 640


def main(hero, form, *names):
    rel = f"assets/heroes/forms/{hero}/form-{form}/showcase"
    d = ROOT / rel
    book = json.loads((d / "fidgets.json").read_text(encoding="utf-8"))["fidgets"] if (d / "fidgets.json").exists() else []
    jobs = [("idle", ["--core=12"])] + [(f["name"], ["--all-whole", "--lock-legs", "--keep"] if f["name"] in ("entrance", "rift", "emerge")
                                         else ["--whole", "--lock-legs", "--keep"] if f.get("whole") else []) for f in book]
    for name, flags in jobs:
        if names and name not in names or not (d / f"raw-{name}.png").exists():
            continue
        work = fidget.WORK / rel.replace("/", "_") / name
        work.mkdir(parents=True, exist_ok=True)
        shutil.copy2(d / f"raw-{name}.png", work / "raw.png")
        r = subprocess.run([sys.executable, str(FIDGET), "proc", rel, name, *flags, f"--cell={CELL}", "--fill=.55"], cwd=ROOT, capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])
        shutil.copy2(work / "fidget.webp", d / f"{name}.webp")
        print(hero, form, name, "->", CELL, "px cells")


if __name__ == "__main__":
    main(*sys.argv[1:])
