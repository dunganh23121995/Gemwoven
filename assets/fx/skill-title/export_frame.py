"""The skill-name frame (src/combat-stage.js combatSkillTitle): gold filigree wings round an empty oval where the name
is written. raw-sheet.png (Codex gpt-6.1-sol low, #00FF00 key; prompt-used.txt) -> assets/fx/ui/skill-title.webp,
keyed like Lumi's FX (assets/fx/heroes/lightning/export_fx.py) and cropped to the drawing."""
import importlib.util
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
spec = importlib.util.spec_from_file_location("lumi_fx", ROOT / "assets/fx/heroes/lightning/export_fx.py")
fx = importlib.util.module_from_spec(spec); spec.loader.exec_module(fx)

frame = fx.key_green(Image.open(HERE / "raw-sheet.png"))
box = frame.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
frame = frame.crop((box[0] - 4, box[1] - 4, box[2] + 4, box[3] + 4))
frame = frame.resize((900, round(frame.height * 900 / frame.width)), Image.Resampling.LANCZOS)
frame.save(ROOT / "assets/fx/ui/skill-title.webp", "WEBP", quality=92, alpha_quality=100, method=6)
print(frame.size)
