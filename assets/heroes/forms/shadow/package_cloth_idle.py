"""Package Noct's stabilized cloth idle loops (idle-cloth/form-N/frame-00..07.png) for runtime.

The frames come from Codex (gpt-6-astra, high) idle sheets run through stabilize_idle.py: the
hood, face, weapon, legs and boots are the accepted master drawing in every frame, only the
cloak moves. This writes, for 150 ms per frame (the runtime cross-fades between frames):
  form 1: assets/heroes/shadow/idle-cloth.webp (read by build.py) and the hub's
          assets/gemwoven/items/home-idle-shadow.webp (same crop as before, tweened)
  forms 2 and 3: form-N/idle.webp and their idle entries in forms.json
Run after export-assets.py (which calls this at its end).
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
FRAME_MS = 150


def frames(form):
    return [Image.open(ROOT / f"idle-cloth/form-{form}/frame-{i:02d}.png").convert("RGBA") for i in range(8)]


def sheet(items, path):
    out = Image.new("RGBA", (256 * 2, 256 * 4), (0, 0, 0, 0))
    for i, frame in enumerate(items):
        out.alpha_composite(frame, ((i % 2) * 256, (i // 2) * 256))
    out.save(path, lossless=True, method=6)


def tweened(items, steps=3):
    return [a if not k else Image.blend(a, items[(i + 1) % len(items)], k / steps) for i, a in enumerate(items) for k in range(steps)]


catalog_path = ROOT / "forms.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
for form in ("2", "3"):
    sheet(frames(form), ROOT / f"form-{form}/idle.webp")
    idle = catalog["forms"][form]["actions"]["idle"]
    idle.update(file=f"assets/heroes/forms/shadow/form-{form}/idle.webp", cols=2, rows=4, count=8,
                heads=[idle["heads"][0]] * 8, frameDuration=FRAME_MS)
catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

base = frames("1")
sheet(base, REPO / "assets/heroes/shadow/idle-cloth.webp")
manifest = json.loads((REPO / "assets/gemwoven/manifest.json").read_text(encoding="utf-8"))
crop = manifest["home-idle-shadow"]["crop"]
hub = tweened([f.crop(crop) for f in base])
hub[0].save(REPO / "assets/gemwoven/items/home-idle-shadow.webp", save_all=True, append_images=hub[1:],
            duration=round(FRAME_MS / 3), loop=0, lossless=True, method=6)
print("Packaged Noct cloth idle for forms 1-3.")
