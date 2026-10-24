"""proc_reg.py <cid> <name> [core] [extra stabilize flags...]: like fidget.py proc --as-is, but every frame is
registered to the master on its own (scale + shift), for loops where Codex drew the frames at slightly
different sizes (fidget.py places every frame like the last one). Writes the same fidget.webp."""
import json, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path("D:/Project/Gemwoven"); sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
import fidget
cid, name = sys.argv[1], sys.argv[2]; core = sys.argv[3] if len(sys.argv) > 3 else "10"; extra = sys.argv[4:]
d = fidget.WORK / cid.replace("/", "_") / name
import shutil
for sub in ["stable", "cells"]:
    shutil.rmtree(d / sub, ignore_errors=True)
fidget.key_cells(d / "raw.png", d / "cells", cell=256, green=(d / "green").exists())
r = subprocess.run([sys.executable, str(fidget.HERE / "stabilize_idle.py"), str(fidget.master_of(cid)), str(d / "stable"), *[str(d / f"cells/idle-{i}.png") for i in range(1, 9)],
                    "--core", core, "--grow", "3", "--cell", "256", "--open", "1", "--min-area", "20", "--as-is", *extra], capture_output=True, text=True)
print(r.stdout[-600:], r.stderr[-1500:])
meta = json.loads((d / "stable/stabilize-meta.json").read_text())
print("scales", [f["scale"] for f in meta["frames"]], "err", [f["error"] for f in meta["frames"]])
sheet = Image.new("RGBA", (512, 1024), (0, 0, 0, 0))
for i in range(8):
    sheet.alpha_composite(Image.open(d / f"stable/idle-{i + 1}.png"), ((i % 2) * 256, (i // 2) * 256))
sheet.save(d / "fidget.webp", lossless=True, method=6)
