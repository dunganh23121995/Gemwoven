"""fidget.py proc with the ghost-outline fix (stabilize_idle.py copy in this folder). Same arguments as fidget.py proc."""
import sys
from pathlib import Path
sys.path.insert(0, "D:/Project/Gemwoven/assets/gemwoven/elites")
import fidget
fidget.HERE = Path(__file__).resolve().parent
cid, name, *rest = sys.argv[1:]
flags = [r for r in rest if r.startswith("--")]
if "--no-refine" in flags:   # place every frame exactly like the last (cells drawn on one template), e.g. a staff tip crossing the feet
    _run = fidget.run
    fidget.run = lambda *cmd: _run(*cmd, "--no-refine") if str(cmd[0]).endswith("stabilize_idle.py") else _run(*cmd)
core = next((int(f.split("=")[1]) for f in flags if f.startswith("--core=")), 9999)
cell = next((int(f.split("=")[1]) for f in flags if f.startswith("--cell=")), 256)
fill = next((float(f.split("=")[1]) for f in flags if f.startswith("--fill=")), .80)
fidget.proc(cid, name, core=core, whole="--whole" in flags, all_whole="--all-whole" in flags, keep="--keep" in flags, cell=cell, fill=fill,
            lock_legs="--lock-legs" in flags, free=next((f.split("=")[1] for f in flags if f.startswith("--free=")), ""), as_is="--as-is" in flags)
