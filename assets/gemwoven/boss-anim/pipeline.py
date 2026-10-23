"""Boss idle/cast pipeline driver (run from anywhere). Usage:
  python pipeline.py idle <boss> <model> <effort>     (prep + gen + process + stabilize + review image)
  python pipeline.py idleproc <boss>                  (process + stabilize only)
  python pipeline.py cast <boss> <model> <effort>
  python pipeline.py castproc <boss>
"""
import json, subprocess, sys, shutil, os
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path("D:/Project/Gemwoven")
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
STAB = "assets/gemwoven/elites/stabilize_idle.py"
SCRATCH = ROOT / ".build-cache/boss-anim"  # rejected attempts and review images (not tracked)
SCRATCH.mkdir(parents=True, exist_ok=True)
BASE = ["earth", "fire", "ice", "lightning"]
STATIC = "mire scarab leviathan colossus prism reaper roc briar seraph eclipse".split()
DESC = json.loads((Path(__file__).parent / "desc.json").read_text(encoding="utf-8"))


def master_path(b):
    if b in BASE:
        return f"assets/gemwoven/items/boss-{b}.webp"
    if b in STATIC:
        return f"assets/gemwoven/items/boss-{b}.png"
    return f"assets/gemwoven/boss-anim/{b}/master.png"


def run(cmd):
    print(">", " ".join(map(str, cmd)), flush=True)
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    print(r.stdout[-3000:], r.stderr[-3000:], flush=True)
    if r.returncode:
        raise SystemExit(f"failed rc={r.returncode}")
    return r.stdout


def identity(b, d):
    m = Image.open(ROOT / master_path(b)).convert("RGBA")
    bg = Image.new("RGBA", m.size, (255, 0, 255, 255))
    bg.alpha_composite(m)
    bg.convert("RGB").save(d / "identity.png")


IDLE = """Image 1 is the exact character and art reference (a fantasy RPG chapter boss: {desc}). Image 2 repeats that exact character in eight cells and is the template every frame must match.
Create an 8-frame IDLE loop, 2 columns x 4 rows, 1024x2048, read row-major. It stands in place, calm and menacing, facing LEFT exactly like Image 1. The head, face, body, {fixed} and feet stay EXACTLY as in Image 2 in every frame (same position, same shape, same design); feet and hips locked, no whole-body sway. What animates: {motion}, a slow breathing rhythm. Smooth from frame to frame; frame 8 flows back into frame 1.
Same scale, camera and feet line (94% of cell height) in every cell, body centred. Everything drawn is opaque with crisp edges: no translucent smoke, mist, steam, haze, aura or glow halo, no ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""

CAST = """Image 1 is the exact character and art reference (a fantasy RPG chapter boss: {desc}). Image 2 repeats that exact character in six cells and is the template for slot position, scale and feet line.
Create a 6-frame {kind} animation, 3 columns x 2 rows, 1536x1024, read row-major, facing LEFT exactly like Image 1: 1 ready pose (like Image 1); 2 wind-up, gathering power: {windup}; 3 {strike} toward the LEFT; 4 peak of the {kind2}, fully extended toward the left; 5 recoil, pulling back; 6 settling back to the ready pose of frame 1.
Never redesign it: same head, face, colours, markings, armour, accessories and proportions as Image 1 in every frame; only the pose changes. Body only: no detached projectiles, no beams, no slash arcs, no big effects; a small glow attached to the body is fine. Same scale and camera as Image 2 in all six cells: the boss is drawn at exactly the size it has in Image 2, never zoomed in or enlarged; the head, torso and legs have exactly the same pixel size in all six cells (the action frames are not bigger than the ready frames), feet on the same line as Image 2 in every cell. The body stays planted at the same spot as Image 2 in every cell (no stepping or sliding); only the head, arms, weapon, wings and tail move, and the motion is compact: the forward reach stays inside the cell with at least 12% magenta margin on every side; nothing (wings, tail, limbs, weapon) may touch or cross a cell edge. Glows are small and opaque; no orbs, sparkles, smoke or mist.
Background 100% solid flat #FF00FF magenta, no gradient, no ground, no shadow, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""


def review(d, sheet, raw, out):
    s = Image.open(sheet).convert("RGBA")
    r = Image.open(raw).convert("RGB")
    r = r.resize((round(r.width * s.height / r.height), s.height))
    canvas = Image.new("RGB", (s.width + r.width + 10, s.height), (150, 150, 150))
    canvas.paste(s, (0, 0), s)
    canvas.paste(r, (s.width + 10, 0))
    canvas.save(out)


def idle(b, model=None, effort=None):
    d = ROOT / "assets/gemwoven/boss-anim" / b
    rel = f"assets/gemwoven/boss-anim/{b}"
    if model:
        identity(b, d)
        run([sys.executable, ANCHOR, "--input", f"{rel}/identity.png", "--rows", "4", "--cols", "2", "--cell-width", "512",
             "--cell-height", "512", "--subject-height-ratio", "0.8", "--feet-ratio", "0.94", "--output", f"{rel}/anchor.png"])
        e = DESC[b]
        (d / "prompt-idle.txt").write_text(IDLE.format(**e) + "\n", encoding="utf-8")
        run([sys.executable, GEN, "--prompt-file", f"{rel}/prompt-idle.txt", "--out", f"{rel}/raw-idle.png",
             "--ref", f"{rel}/identity.png", "--ref", f"{rel}/anchor.png", "--model", model, "--effort", effort, "--timeout", "900"])
        att = SCRATCH / "attempts"
        att.mkdir(exist_ok=True)
        n = len(list(att.glob(f"{b}-idle-*.png"))) + 1
        shutil.copy2(d / "raw-idle.png", att / f"{b}-idle-{n}-{model}-{effort}.png")
    shutil.rmtree(d / "proc", ignore_errors=True)
    shutil.rmtree(d / "stable", ignore_errors=True)
    run([sys.executable, PROC, "process", "--input", f"{rel}/raw-idle.png", "--target", "creature", "--mode", "idle",
         "--output-dir", f"{rel}/proc", "--rows", "4", "--cols", "2", "--cell-size", "256", "--fit-scale", "0.86",
         "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "largest"])
    run([sys.executable, STAB, master_path(b), f"{rel}/stable"] + [f"{rel}/proc/idle-{i}.png" for i in range(1, 9)] + ["--core", "14"])
    meta = json.loads((d / "stable/stabilize-meta.json").read_text())
    j = meta["jitter"]
    print("MEAN JITTER", round(sum(j) / len(j), 2), "moving", [f["moving_share"] for f in meta["frames"]])
    review(d, d / "stable/idle.webp", d / "raw-idle.png", SCRATCH / f"review-{b}-idle.png")


def finalize_idle(b):
    d = ROOT / "assets/gemwoven/boss-anim" / b
    shutil.copy2(d / "stable/idle.webp", d / "idle.webp")
    shutil.copy2(d / "stable/stabilize-meta.json", d / "stabilize-meta.json")
    for p in ["proc", "stable"]:
        shutil.rmtree(d / p, ignore_errors=True)
    for p in ["anchor.png", "identity.png"]:
        (d / p).unlink(missing_ok=True)


def cast(b, model=None, effort=None):
    d = ROOT / "assets/gemwoven/boss-anim" / b
    rel = f"assets/gemwoven/boss-anim/{b}"
    if model:
        identity(b, d)
        run([sys.executable, ANCHOR, "--input", f"{rel}/identity.png", "--rows", "2", "--cols", "3", "--cell-width", "512",
             "--cell-height", "512", "--subject-height-ratio", "0.72", "--feet-ratio", "0.88", "--output", f"{rel}/anchor.png"])
        e = DESC[b]
        (d / "prompt-cast.txt").write_text(CAST.format(**e) + "\n", encoding="utf-8")
        run([sys.executable, GEN, "--prompt-file", f"{rel}/prompt-cast.txt", "--out", f"{rel}/raw-cast.png",
             "--ref", f"{rel}/identity.png", "--ref", f"{rel}/anchor.png", "--model", model, "--effort", effort, "--timeout", "900"])
        att = SCRATCH / "attempts"
        att.mkdir(exist_ok=True)
        n = len(list(att.glob(f"{b}-cast-*.png"))) + 1
        shutil.copy2(d / "raw-cast.png", att / f"{b}-cast-{n}-{model}-{effort}.png")
    shutil.rmtree(d / "proc-cast", ignore_errors=True)
    run([sys.executable, PROC, "process", "--input", f"{rel}/raw-cast.png", "--target", "creature", "--mode", "cast",
         "--output-dir", f"{rel}/proc-cast", "--rows", "2", "--cols", "3", "--cell-size", "256", "--fit-scale", "0.86",
         "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "largest"])
    review(d, d / "proc-cast/sheet-transparent.png", d / "raw-cast.png", SCRATCH / f"review-{b}-cast.png")


def finalize_cast(b):
    d = ROOT / "assets/gemwoven/boss-anim" / b
    Image.open(d / "proc-cast/sheet-transparent.png").convert("RGBA").save(d / "cast.webp", lossless=True, method=6)
    shutil.rmtree(d / "proc-cast", ignore_errors=True)
    for p in ["anchor.png", "identity.png"]:
        (d / p).unlink(missing_ok=True)


if __name__ == "__main__":
    cmd, b, *rest = sys.argv[1:]
    {"idle": idle, "idleproc": idle, "cast": cast, "castproc": cast, "fidle": finalize_idle, "fcast": finalize_cast}[cmd](b, *rest)
