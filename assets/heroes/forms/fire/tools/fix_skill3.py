"""Six-star Mika's ultimate poses ("skill" sheet) at the same body size as her other form-3 sheets, with
the long glaive in every frame.

- Her body was drawn ~12% larger than the long-glaive idle/attack: the sheet's runtime scale (the drawing
  box growth about the feet, sprite-runtime.js) is reduced uniformly; the art itself is untouched.
- Frames 0 (gather) and 5 (recover, back to guard) held the short glaive: they become the long-glaive guard
  pose of the combat idle (frame 0), placed at this sheet's scale on the same feet line.
Frames 1-4 (the drawn-back glaive, the spin and the level cut) keep their grips (MIKA_GRIPS[3]).
usage: python fix_skill3.py   (idempotent: works from skill/sheet-original.webp)
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
F = ROOT / "form-3"
SCALE = 1.665            # was 1.8652 (process_skill.py), body matched to the idle by head size
meta_path = F / "skill/process-meta.json"
meta = json.loads(meta_path.read_text())
original = F / "skill/sheet-original.webp"
if not original.exists():
    Image.open(F / "skill.webp").save(original, lossless=True)
sheet = Image.open(original).convert("RGBA")
cell = sheet.width // 3
idle = Image.open(F / "idle.webp").convert("RGBA").crop((0, 0, 256, 256))
k = cell / (256 * SCALE)                     # idle pixels -> this sheet's pixels at equal on-screen size
guard = idle.resize((round(256 * k), round(256 * k)), Image.Resampling.LANCZOS)
foot = meta.get("footY", .94)
for frame in (0, 5):
    x, y = (frame % 3) * cell, (frame // 3) * cell
    sheet.paste(Image.new("RGBA", (cell, cell), (0, 0, 0, 0)), (x, y))
    sheet.alpha_composite(guard, (x + round(cell / 2 - guard.width / 2), y + round(cell * foot - guard.height * .94)))
sheet.save(F / "skill.webp", lossless=True, method=6)
meta["scale"] = SCALE
meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
print("skill.webp: frames 0 and 5 = long-glaive guard, scale", SCALE)
