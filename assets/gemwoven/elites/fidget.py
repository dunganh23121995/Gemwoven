"""Occasional idle actions ("fidgets") for elites and bosses.

A foe rests calmly and, now and then, does something of its own: a knight taps his shield twice
or shoulders his mace, a dragon's chest flares with lava or it spreads its wings. Each fidget is an
8-frame sheet whose first and last frames are the resting pose, so it leaves and rejoins the idle
seamlessly.

Codex draws the action; every frame is then registered to the accepted master (same scale and
feet, so the body never grows or shrinks) and only the parts that really move (arm, weapon,
wings, a glowing chest) are taken from the drawing; the still body is the master itself, so it
never boils.

  python fidget.py gen <id> <fidget> <model> <effort> "<what it is>" "<the action>"
  python fidget.py proc <id> <fidget>     -> .build-cache/fidgets/<id>/<fidget>/fidget.webp
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
WORK = ROOT / ".build-cache/fidgets"
sys.path.insert(0, str(HERE))
from action_idle import master_of  # noqa: E402

PROMPT = """Image 1 is the exact character and art reference ({what}). Image 2 shows the eight cells, each with that character in its resting pose at the same size and ground line.
Draw an 8-frame animation, 2 columns x 4 rows, 1024x2048, read row-major, facing LEFT exactly like Image 1: a short occasional idle action played now and then while the character waits for battle.
Frame 1 and frame 8 are exactly the resting pose of Image 1. Frames 2-7: {action}
Only the parts named above move; everything else (body, legs, feet, head position, size) stays exactly as in Image 1 in every frame. The design, colours, proportions and every detail stay IDENTICAL to Image 1. Same scale and camera in every cell, feet on the same ground line (94% of cell height), nothing crossing the cell edges.
Everything opaque: no smoke, mist, steam, haze, motion lines or loose particles. No ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""


def run(*cmd):
    r = subprocess.run([sys.executable, *map(str, cmd)], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])
    return r.stdout


def gen(cid, name, model, effort, what, action):
    d = WORK / cid / name; d.mkdir(parents=True, exist_ok=True)
    m = Image.open(master_of(cid)).convert("RGBA")
    canvas = Image.new("RGBA", m.size, (255, 0, 255, 255)); canvas.alpha_composite(m); canvas.convert("RGB").save(d / "identity.png")
    run(ANCHOR, "--input", d / "identity.png", "--rows", "4", "--cols", "2", "--cell-width", "512", "--cell-height", "512",
        "--subject-height-ratio", "0.8", "--feet-ratio", "0.94", "--output", d / "anchor.png")
    (d / "prompt.txt").write_text(PROMPT.format(what=what, action=action) + "\n", encoding="utf-8")
    run(GEN, "--prompt-file", d / "prompt.txt", "--out", d / "raw.png", "--ref", d / "identity.png", "--ref", d / "anchor.png",
        "--model", model, "--effort", effort, "--timeout", "900")


def key_cells(raw, out_dir, cell=256):
    """Cut the 2x4 sheet on its grid and key out the magenta, keeping every pose exactly where
    Codex drew it in its cell (the shared processor re-centres each frame on its own bbox, which
    moves the whole body whenever an arm or a weapon goes up)."""
    import numpy as np
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet = np.asarray(Image.open(raw).convert("RGB"), dtype=np.float32)
    h, w = sheet.shape[0] // 4, sheet.shape[1] // 2
    for i in range(8):
        c = sheet[(i // 2) * h:(i // 2 + 1) * h, (i % 2) * w:(i % 2 + 1) * w].copy()
        r, g, b = c[..., 0], c[..., 1], c[..., 2]
        key = np.minimum(r, b) - g                      # how magenta a pixel is
        alpha = np.clip(1 - (key - 60) / 90, 0, 1)
        spill = np.clip(key / 255, 0, 1)[..., None]     # pull the pink fringe back toward neutral
        c[..., 0] = np.where(key > 0, np.minimum(r, g + (r - g) * (1 - spill[..., 0])), r)
        c[..., 2] = np.where(key > 0, np.minimum(b, g + (b - g) * (1 - spill[..., 0])), b)
        img = Image.fromarray(np.concatenate([c, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8"), "RGBA")
        # A pose Codex let run over its cell edge is cut off; it is replaced by the previous good
        # frame (these spill-overs happen at the held peak of an action, so a held frame reads right).
        # The last frames return to rest, so a cut-off one there becomes the resting first frame.
        edge = alpha > .5
        runs = [edge[:2].any(axis=0).mean(), edge[-2:].any(axis=0).mean(), edge[:, :2].any(axis=1).mean(), edge[:, -2:].any(axis=1).mean()]
        if max(runs) > .06 and i:
            source = 1 if i >= 6 else i
            shutil.copy2(out_dir / f"idle-{source}.png", out_dir / f"idle-{i + 1}.png"); print("frame", i + 1, "clipped, uses frame", source)
            continue
        img.resize((cell, round(cell * h / w)), Image.Resampling.LANCZOS).crop((0, 0, cell, cell)).save(out_dir / f"idle-{i + 1}.png")


def proc(cid, name, core=9999):
    d = WORK / cid / name
    for sub in ["proc", "aligned", "stable", "cells"]:
        shutil.rmtree(d / sub, ignore_errors=True)
    key_cells(d / "raw.png", d / "cells")
    # Codex draws all 8 frames at one scale on the template, so every frame is placed exactly like
    # the resting first frame; a per-frame fit would be pulled off the body by spread wings or a
    # raised arm. Only what really moves is taken from the drawing (no rigid core, slivers absorbed).
    master = master_of(cid)
    out = run(HERE / "stabilize_idle.py", master, d / "stable", *[d / f"cells/idle-{i}.png" for i in range(1, 9)], "--core", core, "--same-transform", "--grow", 3)
    # A frame whose legs still do not match the master after placement (Codex moved the whole body)
    # is replaced like a clipped one: by the previous good frame, or by the rest pose near the end.
    import json
    meta = json.loads((d / "stable/stabilize-meta.json").read_text())
    errors = [f["error"] for f in meta["frames"]]
    frames = [Image.open(d / f"stable/idle-{i + 1}.png") for i in range(8)]
    for i in range(1, 8):
        if errors[i] > max(.5, errors[0] * 3):
            frames[i] = frames[0] if i >= 6 else frames[i - 1]; print("frame", i + 1, "off the master's feet, replaced")
    sheet = Image.new("RGBA", (512, 1024), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, ((i % 2) * 256, (i // 2) * 256))
    sheet.save(d / "fidget.webp", lossless=True, method=6)
    print(cid, name, out.strip())

if __name__ == "__main__":
    cmd, cid, name, *rest = sys.argv[1:]
    gen(cid, name, *rest) if cmd == "gen" else proc(cid, name)
