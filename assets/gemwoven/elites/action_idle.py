"""Character-specific idle drawn frame by frame (elites and bosses).

Each character gets its own resting action written for its body (a knight shifts his weight and
hefts his mace, a dragon breathes and flexes its wings, a witch sways on her staff). Codex draws
the 8 frames; they are used as drawn. Processing only puts every frame at one shared scale with
the feet on the same spot, so nothing is warped and the drawn motion is kept whole.

  python action_idle.py gen <id> <model> <effort> "<what it is>" "<its idle action>"
  python action_idle.py proc <id>      -> .build-cache/action-idle/<id>/idle.webp (+ frames)
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
WORK = ROOT / ".build-cache/action-idle"
BASE, STATIC = ["earth", "fire", "ice", "lightning"], "mire scarab leviathan colossus prism reaper roc briar seraph eclipse".split()
CELL = 256

PROMPT = """Image 1 is the exact character and art reference ({what}). Image 2 shows the eight cells, each with that character at the same size and ground line.
Draw an 8-frame IDLE animation, 2 columns x 4 rows, 1024x2048, read row-major, facing LEFT exactly like Image 1, as a hand-animated 2D game sprite (each frame a real redrawn pose, like a mobile RPG battle idle). The idle action: {action}. The motion is clearly visible but natural, eased in and out; frame 8 flows back into frame 1.
The design, colours, proportions, face, outfit and every detail stay IDENTICAL to Image 1 in every frame; only the pose changes. Feet stay on the same ground line (94% of cell height) and roughly the same spot. Same scale and camera in every cell, body centred, nothing crossing the cell edges.
Everything opaque: no smoke, mist, steam, haze, glow halos, motion lines or loose particles. No ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""


def master_of(cid):
    for p in [ROOT / f"assets/gemwoven/elites/{cid}/master.png", ROOT / f"assets/gemwoven/items/creature-{cid}.png", ROOT / f"assets/gemwoven/items/monster-{cid}.png"]:
        if p.exists():
            return p
    if cid in BASE:
        return ROOT / f"assets/gemwoven/items/boss-{cid}.webp"
    if cid in STATIC:
        return ROOT / f"assets/gemwoven/items/boss-{cid}.png"
    return ROOT / f"assets/gemwoven/boss-anim/{cid}/master.png"


def run(*cmd):
    r = subprocess.run([sys.executable, *map(str, cmd)], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])
    return r.stdout


def gen(cid, model, effort, what, action):
    d = WORK / cid; d.mkdir(parents=True, exist_ok=True)
    m = Image.open(master_of(cid)).convert("RGBA")
    canvas = Image.new("RGBA", m.size, (255, 0, 255, 255)); canvas.alpha_composite(m); canvas.convert("RGB").save(d / "identity.png")
    run(ANCHOR, "--input", d / "identity.png", "--rows", "4", "--cols", "2", "--cell-width", "512", "--cell-height", "512",
        "--subject-height-ratio", "0.8", "--feet-ratio", "0.94", "--output", d / "anchor.png")
    (d / "prompt-idle.txt").write_text(PROMPT.format(what=what, action=action) + "\n", encoding="utf-8")
    run(GEN, "--prompt-file", d / "prompt-idle.txt", "--out", d / "raw-idle.png", "--ref", d / "identity.png", "--ref", d / "anchor.png",
        "--model", model, "--effort", effort, "--timeout", "900")
    (d / "gen.json").write_text(json.dumps({"model": model, "effort": effort}), encoding="utf-8")


def proc(cid, thin=False):
    d = WORK / cid
    shutil.rmtree(d / "proc", ignore_errors=True)
    run(PROC, "process", "--input", d / "raw-idle.png", "--target", "creature", "--mode", "idle", "--output-dir", d / "proc", "--rows", "4", "--cols", "2",
        "--cell-size", str(CELL), "--fit-scale", "0.86", "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "all" if thin else "largest")
    frames = [Image.open(d / f"proc/idle-{i}.png").convert("RGBA") for i in range(1, 9)]
    boxes = [f.getbbox() for f in frames]
    # One scale for the whole loop (from the median height, so a crouch stays a crouch), the master's
    # framing (80% of the cell tall, feet at 94%), feet centred: placement only, never a warp.
    height = float(np.median([b[3] - b[1] for b in boxes]))
    scale = CELL * .8 / height
    out = []
    for f, b in zip(frames, boxes):
        a = np.asarray(f)[..., 3] > 128
        rows = np.where(a.any(axis=1))[0]; foot = rows.max()
        cols = np.where(a[max(0, foot - int(height * .12)):foot + 1].any(axis=0))[0]
        fx = (cols.min() + cols.max()) / 2
        g = f.resize((round(f.width * scale), round(f.height * scale)), Image.Resampling.LANCZOS)
        cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        cell.alpha_composite(g, (round(CELL / 2 - fx * scale), round(CELL * .94 - (foot + 1) * scale)))
        out.append(cell)
    sheet = Image.new("RGBA", (CELL * 2, CELL * 4), (0, 0, 0, 0))
    for i, f in enumerate(out):
        f.save(d / f"frame-{i + 1}.png"); sheet.alpha_composite(f, ((i % 2) * CELL, (i // 2) * CELL))
    sheet.save(d / "idle.webp", lossless=True, method=6)
    print(cid, "scale", round(scale, 3))


if __name__ == "__main__":
    cmd, cid, *rest = sys.argv[1:]
    gen(cid, *rest) if cmd == "gen" else proc(cid, thin="--thin" in rest)
