"""fixplace.py <dir> <name> <bad frames e.g. 4,5,6> <ref frame e.g. 7> [stabilize flags...]
After `fidget.py proc`, re-place the frames whose leg-fit was pulled by a moving shield/debris exactly like a good
reference frame of the same Codex sheet (Codex draws every cell on one template), composite them the same way
(core etc. from the flags) and rewrite fidget.webp. Placement only: nothing is drawn, warped or scaled by hand."""
import shutil, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path("D:/Project/Gemwoven")
d, name, bad, ref, *flags = sys.argv[1:]
W = ROOT / ".build-cache/fidgets" / d.replace("/", "_") / name
bad = [int(b) for b in bad.split(",")]; ref = int(ref)
tmp = W / "fix"; shutil.rmtree(tmp, ignore_errors=True)
cells = [W / f"cells/idle-{i}.png" for i in bad] + [W / f"cells/idle-{ref}.png"]
r = subprocess.run([sys.executable, str(ROOT / "assets/gemwoven/elites/stabilize_idle.py"), str(ROOT / d / "master.png"), str(tmp), *map(str, cells),
                    "--same-transform", "--no-refine", "--grow", "3", "--open", "1", "--min-area", "20", *flags], capture_output=True, text=True, cwd=ROOT)
print(r.stdout[-400:], r.stderr[-800:])
sheet = Image.open(W / "fidget.webp").convert("RGBA"); cw = sheet.width // 2
for k, i in enumerate(bad):
    f = Image.open(tmp / f"idle-{k + 1}.png").convert("RGBA")
    x, y = ((i - 1) % 2) * cw, ((i - 1) // 2) * cw
    sheet.paste(Image.new("RGBA", (cw, cw), (0, 0, 0, 0)), (x, y)); sheet.paste(f, (x, y))
sheet.save(W / "fidget.webp", lossless=True, method=6)
print("re-placed", bad, "like", ref)
