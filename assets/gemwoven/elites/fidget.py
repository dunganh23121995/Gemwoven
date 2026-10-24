"""Occasional idle actions ("fidgets") for elites and bosses, and the resting loop of common foes.

A foe rests calmly and, now and then, does something of its own: a knight taps his shield twice
or shoulders his mace, a dragon's chest flares with lava or it spreads its wings. Each fidget is an
8-frame sheet whose first and last frames are the resting pose, so it leaves and rejoins the idle
seamlessly.

Codex draws the action; every frame is then registered to the accepted master (same scale and
feet, so the body never grows or shrinks) and only the parts that really move (arm, weapon,
wings, a glowing chest) are taken from the drawing; the still body is the master itself, so it
never boils. A big action where Codex also shifts the head or body (spread wings) is kept whole
(--whole): placed like the resting frame, never mixed, never stretched.

Common foes use the same pipeline for their whole resting loop (fidget name "idle", --loop):
a lively bounce or sway drawn frame by frame, kept whole.

  python fidget.py gen <id> <fidget> <model> <effort> "<what it is>" "<the action>" [--loop]
  python fidget.py proc <id> <fidget> [--whole]   -> .build-cache/fidgets/<id>/<fidget>/fidget.webp
  python fidget.py accept <id> <fidget> "<label>" [--whole]
      copies raw/prompt/sheet into the foe's asset folder (elites/<id>, boss-anim/<id> or
      creatures/<id>) and records the fidget in that folder's fidgets.json
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
WORK = ROOT / ".build-cache/fidgets"
sys.path.insert(0, str(HERE))
from action_idle import master_of  # noqa: E402

TAIL = """Everything opaque: no smoke, mist, steam, haze, motion lines or loose particles. No ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""

PROMPT = """Image 1 is the exact character and art reference ({what}). Image 2 shows the eight cells, each with that character in its resting pose at the same size and ground line.
Draw an 8-frame animation, 2 columns x 4 rows, 1024x2048, read row-major, facing LEFT exactly like Image 1: a short occasional idle action played now and then while the character waits for battle.
Frame 1 and frame 8 are exactly the resting pose of Image 1. Frames 2-7: {action}
Only the parts named above move; everything else (body, legs, feet, face, head position, size) stays exactly as in Image 1 in every frame. The design, colours, proportions and every detail stay IDENTICAL to Image 1. Same scale and camera in every cell, feet on the same ground line (94% of cell height), nothing crossing the cell edges.
""" + TAIL

LOOP = """Image 1 is the exact character and art reference ({what}). Image 2 shows the eight cells, each with that character in its resting pose at the same size and ground line.
Draw an 8-frame looping IDLE animation, 2 columns x 4 rows, 1024x2048, read row-major, facing LEFT exactly like Image 1, like the lively battle idle of a mobile RPG monster: {action}
Frame 1 is exactly the resting pose of Image 1 and frame 8 flows smoothly back into frame 1. Every frame is a real redrawn pose (squash, stretch, lean), never a copy. The design, colours, proportions and every detail stay IDENTICAL to Image 1; the size stays the same apart from the squash and stretch. Same scale and camera in every cell, the lowest point on the same ground line (94% of cell height), nothing crossing the cell edges.
""" + TAIL


def run(*cmd):
    r = subprocess.run([sys.executable, *map(str, cmd)], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])
    return r.stdout


def gen(cid, name, model, effort, what, action, loop=False, green=False):
    """green: draw on #00FF00 for characters whose own colours are close to magenta (pink/violet)."""
    d = WORK / cid / name; d.mkdir(parents=True, exist_ok=True)
    (d / "green").unlink(missing_ok=True)
    if green:
        (d / "green").write_text("", encoding="utf-8")
    m = Image.open(master_of(cid)).convert("RGBA")
    canvas = Image.new("RGBA", m.size, (0, 255, 0, 255) if green else (255, 0, 255, 255)); canvas.alpha_composite(m); canvas.convert("RGB").save(d / "identity.png")
    run(ANCHOR, "--input", d / "identity.png", "--rows", "4", "--cols", "2", "--cell-width", "512", "--cell-height", "512",
        "--subject-height-ratio", "0.8", "--feet-ratio", "0.94", "--output", d / "anchor.png")
    text = (LOOP if loop else PROMPT).format(what=what, action=action)
    if green:
        text = text.replace("#FF00FF magenta", "#00FF00 green")
    (d / "prompt.txt").write_text(text + "\n", encoding="utf-8")
    run(GEN, "--prompt-file", d / "prompt.txt", "--out", d / "raw.png", "--ref", d / "identity.png", "--ref", d / "anchor.png",
        "--model", model, "--effort", effort, "--timeout", "900")


def key_cells(raw, out_dir, cell=256, green=False):
    """Cut the 2x4 sheet on its grid and key out the magenta, keeping every pose exactly where
    Codex drew it in its cell (the shared processor re-centres each frame on its own bbox, which
    moves the whole body whenever an arm or a weapon goes up)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet = np.asarray(Image.open(raw).convert("RGB"), dtype=np.float32)
    h, w = sheet.shape[0] // 4, sheet.shape[1] // 2
    for i in range(8):
        c = sheet[(i // 2) * h:(i // 2 + 1) * h, (i % 2) * w:(i % 2 + 1) * w].copy()
        r, g, b = c[..., 0], c[..., 1], c[..., 2]
        key = g - np.maximum(r, b) if green else np.minimum(r, b) - g   # how much a pixel looks like the key colour
        alpha = np.clip(1 - (key - 60) / 90, 0, 1)
        spill = np.clip(key / 255, 0, 1)                # pull the pink fringe back toward neutral
        if green:
            c[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
        else:
            c[..., 0] = np.where(key > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
            c[..., 2] = np.where(key > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
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


def proc(cid, name, core=9999, whole=False):
    d = WORK / cid / name
    for sub in ["proc", "aligned", "stable", "cells"]:
        shutil.rmtree(d / sub, ignore_errors=True)
    key_cells(d / "raw.png", d / "cells", green=(d / "green").exists())
    # Codex draws all 8 frames at one scale on the template, so every frame is placed exactly like
    # the resting first frame (feet refined on the legs); a per-frame fit would be pulled off the
    # body by spread wings or a raised arm. Only what really moves is taken from the drawing.
    master = master_of(cid)
    # A common foe's resting loop is Codex's drawing in every frame (no master frame at the seam).
    extra = ["--whole-loop"] if name == "idle" else ["--whole"] if whole else []
    out = run(HERE / "stabilize_idle.py", master, d / "stable", *[d / f"cells/idle-{i}.png" for i in range(1, 9)], "--core", core, "--same-transform", "--grow", 3, "--open", 1, "--min-area", 20, *extra)
    # A frame whose legs still do not match the master after placement (Codex moved the whole body)
    # is replaced like a clipped one: by the previous good frame, or by the rest pose near the end.
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


def home(cid):
    for d in [ROOT / "assets/gemwoven/elites" / cid, ROOT / "assets/gemwoven/boss-anim" / cid]:
        if d.is_dir():
            return d
    return ROOT / "assets/gemwoven/creatures" / cid


def accept(cid, name, label, whole=False):
    src, dst = WORK / cid / name, home(cid)
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src / "raw.png", dst / f"raw-{name}.png")
    shutil.copy2(src / "prompt.txt", dst / f"prompt-{name}.txt")
    shutil.copy2(src / "fidget.webp", dst / f"{name}.webp")
    if name == "idle":
        return print("accepted", cid, "idle ->", dst / "idle.webp")
    book = dst / "fidgets.json"
    data = json.loads(book.read_text(encoding="utf-8")) if book.exists() else {"fidgets": []}
    data["fidgets"] = [f for f in data["fidgets"] if f["name"] != name] + [{"name": name, "label": label, "file": f"{name}.webp", "whole": whole}]
    book.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("accepted", cid, name, "->", dst)


if __name__ == "__main__":
    cmd, cid, name, *rest = sys.argv[1:]
    flags = [r for r in rest if r.startswith("--")]; args = [r for r in rest if not r.startswith("--")]
    if cmd == "gen":
        gen(cid, name, *args, loop="--loop" in flags, green="--green" in flags)
    elif cmd == "proc":
        proc(cid, name, whole="--whole" in flags)
    else:
        accept(cid, name, args[0], whole="--whole" in flags)
