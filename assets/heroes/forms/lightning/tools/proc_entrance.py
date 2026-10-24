"""proc_entrance.py <cid> <name>: like fidget.py proc --all-whole --lock-legs --keep --cell=384 --fill=.55, but the
frames are placed exactly like the last (resting) frame with no per-frame sole refinement (--no-refine), so
element-only frames (a star high in the sky) keep the height Codex drew them at instead of dropping onto the
feet line. Frames with both boots are then shifted (never scaled) onto the resting frame's boots."""
import json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path("D:/Project/Gemwoven"); sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
import fidget
cid, name = sys.argv[1], sys.argv[2]; cell = 384; whole = "--whole" in sys.argv  # an occasional action: frames 1 and 8 stay the master, no boot shift
d = fidget.WORK / cid.replace("/", "_") / name
for sub in ["stable", "cells"]:
    shutil.rmtree(d / sub, ignore_errors=True)
fidget.key_cells(d / "raw.png", d / "cells", cell=cell, green=(d / "green").exists())
r = subprocess.run([sys.executable, str(fidget.HERE / "stabilize_idle.py"), str(fidget.master_of(cid)), str(d / "stable"), *[str(d / f"cells/idle-{i}.png") for i in range(1, 9)],
                    "--core", "9999", "--same-transform", "--no-refine", "--whole" if whole else "--whole-loop", "--grow", "3", "--cell", str(cell), "--fill", ".55", "--open", "1", "--min-area", "20"], capture_output=True, text=True)
print(r.stdout[-400:], r.stderr[-1500:])
frames = [Image.open(d / f"stable/idle-{i + 1}.png") for i in range(8)]
ref = fidget.boots(frames[-1])
for i, f in enumerate([] if whole else frames[:-1]):
    got = fidget.boots(f)
    if ref and got:
        moved = Image.new("RGBA", f.size, (0, 0, 0, 0)); moved.paste(f, (round(ref[0] - got[0]), round(ref[1] - got[1])), f); frames[i] = moved
        print("frame", i + 1, "boots shift", round(ref[0] - got[0]), round(ref[1] - got[1]))
sheet = Image.new("RGBA", (cell * 2, cell * 4), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.alpha_composite(f, ((i % 2) * cell, (i // 2) * cell))
sheet.save(d / "fidget.webp", lossless=True, method=6)
