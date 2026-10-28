"""Replace a hero form's combat idle with a stable 8-frame loop drawn by Codex (the Noct recipe).

  python assets/heroes/forms/combat_idle.py prep <hero> <form>
      -> assets/heroes/forms/<hero>/form-N/combat-idle/master.png: the resting frame of the
         current combat idle, cell for cell (same scale, same feet), so nothing changes size
  python assets/gemwoven/elites/fidget.py gen  <that dir> idle <model> <effort> "<what>" "<idle>" --loop
  python assets/gemwoven/elites/fidget.py proc <that dir> idle --as-is --core=N
  python assets/gemwoven/elites/fidget.py accept <that dir> idle Nghỉ
  python assets/heroes/forms/combat_idle.py package <hero> <form>
      -> form 1: assets/reimagined/heroes/<hero>/idle.webp + its runtime-meta.json
         forms 2-3: form-N/idle.webp + the idle entry in forms.json
         Tân (novice, one form): assets/heroes/novice/idle.webp + its meta.json entry
         Noct form 1: assets/heroes/shadow/idle-cloth.webp (build.py holds its heads and pace)
The previous sheet stays in Git history; its raw source stays in its own folder.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
FRAME_MS = 150


def paths(hero, form):
    forms = ROOT / "assets/heroes/forms" / hero
    work = forms / f"form-{form}/combat-idle"
    sheet = (ROOT / "assets/heroes/novice/idle.webp" if hero == "novice" else
             ROOT / "assets/heroes/shadow/idle-cloth.webp" if hero == "shadow" and form == "1" else
             ROOT / f"assets/reimagined/heroes/{hero}/idle.webp" if form == "1" else forms / f"form-{form}/idle.webp")
    return forms, work, sheet


def prep(hero, form):
    _, work, sheet = paths(hero, form)
    work.mkdir(parents=True, exist_ok=True)
    Image.open(sheet).convert("RGBA").crop((0, 0, 256, 256)).save(work / "master.png")
    print("master ->", work / "master.png")


def package(hero, form):
    forms, work, sheet = paths(hero, form)
    loop = Image.open(work / "idle.webp").convert("RGBA")
    assert loop.size in [(512, 1024), (1024, 2048)], loop.size   # 256 or 512 px cells (sharper on dense screens)
    loop.save(sheet, lossless=True, method=6)
    if hero == "shadow" and form == "1":
        pass  # build.py reads Noct's form-1 idle sheet as it is (heads and pace are set there)
    elif hero == "novice":
        meta_path = ROOT / "assets/heroes/novice/meta.json"
        book = json.loads(meta_path.read_text(encoding="utf-8"))
        idle = book["actions"]["idle"]
        idle.update(columns=2, cols=2, rows=4, frames=8, count=8, frameDuration=FRAME_MS, headAnchors=[idle["headAnchors"][0]] * 8, frameFiles=[])
        meta_path.write_text(json.dumps(book, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    elif form == "1":
        meta_path = sheet.parent / "idle/runtime-meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        head = meta["headAnchors"][0]
        meta.update(columns=2, rows=4, frames=8, uniqueFrames=8, frameDuration=FRAME_MS, headAnchors=[head] * 8,
                    frameFiles=[], framePixelHashes=[], source=str((work / "raw-idle.png").relative_to(ROOT)).replace("\\", "/"))
        meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    else:
        catalog_path = forms / "forms.json"
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        idle = catalog["forms"][form]["actions"]["idle"]
        idle.update(cols=2, rows=4, count=8, heads=[idle["heads"][0]] * 8, frameDuration=FRAME_MS)
        catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("packaged", hero, "form", form, "->", sheet)


if __name__ == "__main__":
    {"prep": prep, "package": package}[sys.argv[1]](sys.argv[2], sys.argv[3])
