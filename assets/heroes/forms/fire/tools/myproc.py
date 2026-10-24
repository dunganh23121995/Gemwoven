"""Workaround for fidget.py proc when Codex's rows drift in the raw sheet (a frame drawn low in its cell
gets its probe clipped by --same-transform): same steps, but every frame is registered on its own.
usage: python myproc.py <cid> <name> [--core=N] [--free=...] [--as-is] [--cell=..] [--fill=..]"""
import json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path("D:/Project/Gemwoven")
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
import fidget  # noqa
cid, name, *flags = sys.argv[1:]
opt = {f.split("=")[0]: (f.split("=")[1] if "=" in f else True) for f in flags}
cell = int(opt.get("--cell", 256)); fill = float(opt.get("--fill", .8)); core = opt.get("--core", "9999")
d = fidget.WORK / cid.replace("/", "_") / name
for sub in ["proc", "aligned", "stable", "cells"]:
    shutil.rmtree(d / sub, ignore_errors=True)
fidget.key_cells(d / "raw.png", d / "cells", cell=cell, green=(d / "green").exists())
extra = ["--free", opt["--free"]] if "--free" in opt else []
if "--as-is" in opt: extra.append("--as-is")
if name == "idle" and core == "9999": extra.append("--whole-loop")
r = subprocess.run([sys.executable, str(fidget.HERE / "stabilize_idle.py"), str(fidget.master_of(cid)), str(d / "stable"), *[str(d / f"cells/idle-{i}.png") for i in range(1, 9)],
                    "--core", core, "--grow", "3", "--cell", str(cell), "--fill", str(fill), "--open", "1", "--min-area", "20", *extra], capture_output=True, text=True, cwd=ROOT)
if r.returncode: sys.exit(r.stderr)
meta = json.loads((d / "stable/stabilize-meta.json").read_text())
print([(f["dx"], f["dy"], f["scale"], f["error"]) for f in meta["frames"]])
frames = [Image.open(d / f"stable/idle-{i + 1}.png") for i in range(8)]
sheet = Image.new("RGBA", (cell * 2, cell * 4), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.alpha_composite(f, ((i % 2) * cell, (i // 2) * cell))
sheet.save(d / "fidget.webp", lossless=True, method=6)
print(r.stdout.strip())
