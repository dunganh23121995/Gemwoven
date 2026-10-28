"""Mika form 2: one sheet for the whole ultimate (Hồ Diễm Long Trảm).

Codex draws the cleave as two sheets (redraw_form2.py "skill" and "swing", processed by
process_skill.py). This lays the frames the ultimate plays into form-2/skill.webp in the order they
are played, all at the skill sheet's display scale (each frame is resized about the feet, where the
game grows a sheet, so it keeps its size on screen), and drops the swing sheet from forms.json:

  0 skill-0 draw    1 skill-1 raise    2 swing-0 dip     3-6 swing-1..4 backswing (swing-4: blade straight back)
  7 skill-2 chop    8 skill-3 contact  9 skill-4 follow  10 skill-5 recover

  python assets/heroes/forms/fire/tools/merge_ult2.py      (after processing skill and swing; their raw
      sources stay in form-2/skill and form-2/swing)
The hand grips of the merged order (MIKA_GRIPS[2] in src/forms-mika.js) are measured on the result.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[3]
ORDER = [("skill", 0), ("skill", 1), ("swing", 0), ("swing", 1), ("swing", 2), ("swing", 3), ("swing", 4),
         ("skill", 2), ("skill", 3), ("skill", 4), ("skill", 5)]
COLS = 4

book_path = ROOT / "forms.json"
book = json.loads(book_path.read_text(encoding="utf-8"))
actions = book["forms"]["2"]["actions"]
target = actions["skill"]["scale"]
foot = actions["skill"].get("footY", .94)
sheets = {name: Image.open(REPO / actions[name]["file"]).convert("RGBA") for name in ("skill", "swing")}
cell = sheets["skill"].width // actions["skill"]["cols"]
rows = -(-len(ORDER) // COLS)
out = Image.new("RGBA", (COLS * cell, rows * cell))
for i, (name, frame) in enumerate(ORDER):
    a, sheet = actions[name], sheets[name]
    c = sheet.width // a["cols"]
    f = sheet.crop(((frame % a["cols"]) * c, (frame // a["cols"]) * c, (frame % a["cols"] + 1) * c, (frame // a["cols"] + 1) * c))
    k = a["scale"] / target                       # this frame's size on screen, in the skill sheet's box
    size = round(cell * k)
    f = f.resize((size, size), Image.Resampling.LANCZOS)
    placed = Image.new("RGBA", (cell, cell))
    placed.alpha_composite(f, (round(cell * .5 * (1 - k)), round(cell * foot * (1 - k))))
    out.paste(placed, ((i % COLS) * cell, (i // COLS) * cell))
out.save(REPO / actions["skill"]["file"], lossless=True, method=6)
actions["skill"].update(cols=COLS, rows=rows, count=len(ORDER), heads=[actions["skill"]["heads"][0]] * len(ORDER))
(REPO / actions.pop("swing")["file"]).unlink()
book_path.write_text(json.dumps(book, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print("merged", len(ORDER), "frames into", actions["skill"]["file"])
