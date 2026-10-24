"""Bouncing idle for an elite or boss: the whole body breathes and bobs (knees give, torso sinks
and rises, head and arms follow a beat later), instead of a still body with swaying cloth.

  python bounce_idle.py gen <id> <model> <effort>   identity + 8-cell anchor + Codex sheet (raw-bounce.png)
  python bounce_idle.py proc <id>                    process + band rig -> work/<id>/rig/idle.webp

Codex redraws every frame, so its drawings boil if used as they are. The band rig keeps the
accepted master drawing and only takes the MOTION from the generated frames: the master is cut
into horizontal bands (legs, body, head); for each frame and band the shift and vertical squash
that best match the generated frame are measured, smoothed around the loop, and the master bands
are warped by them and blended. Feet stay planted; the drawing never changes.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
WORK = ROOT / ".build-cache/bounce"
BASE, STATIC = ["earth", "fire", "ice", "lightning"], "mire scarab leviathan colossus prism reaper roc briar seraph eclipse".split()
CELL = 256
AMPLITUDE = 1.7

PROMPT = """Image 1 is the exact character and art reference ({what}). Image 2 repeats that exact character in eight cells and is the template every frame must match.
Create an 8-frame IDLE loop, 2 columns x 4 rows, 1024x2048, read row-major, facing LEFT exactly like Image 1. A lively game-character breathing bounce: the WHOLE body moves. Frames 1-4: the knees give a little and the body sinks about 4% of its height while the chest compresses, the head dips a moment later, arms and {held} swing down slightly with the weight; frames 5-8: the body springs back up, chest rises with an in-breath, head lifts last, arms and {held} come back up. {extra}Feet stay planted on the same spot and the same ground line (94% of cell height) in every frame. The design, colours, proportions, face, armour and every detail stay IDENTICAL to Image 1 in every frame: only the pose bobs. Smooth from frame to frame; frame 8 flows back into frame 1.
Everything opaque: no smoke, mist, steam, haze, glow halos or loose particles. Same scale and camera in every cell, body centred, nothing crossing the cell edges. No ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""


def master_of(cid):
    e = ROOT / f"assets/gemwoven/elites/{cid}/master.png"
    if e.exists():
        return e
    if (ROOT / f"assets/gemwoven/items/creature-{cid}.png").exists():
        return ROOT / f"assets/gemwoven/items/creature-{cid}.png"
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


def gen(cid, model, effort, what="", held="weapon", extra=""):
    d = WORK / cid; d.mkdir(parents=True, exist_ok=True)
    m = Image.open(master_of(cid)).convert("RGBA")
    canvas = Image.new("RGBA", m.size, (255, 0, 255, 255)); canvas.alpha_composite(m); canvas.convert("RGB").save(d / "identity.png")
    run(ANCHOR, "--input", d / "identity.png", "--rows", "4", "--cols", "2", "--cell-width", "512", "--cell-height", "512",
        "--subject-height-ratio", "0.8", "--feet-ratio", "0.94", "--output", d / "anchor.png")
    (d / "prompt-bounce.txt").write_text(PROMPT.format(what=what or cid, held=held, extra=extra) + "\n", encoding="utf-8")
    run(GEN, "--prompt-file", d / "prompt-bounce.txt", "--out", d / "raw-bounce.png", "--ref", d / "identity.png", "--ref", d / "anchor.png",
        "--model", model, "--effort", effort, "--timeout", "900")


def rgba(img):
    return np.asarray(img.convert("RGBA"), dtype=np.float32) / 255


def fit_master(path):
    im = Image.open(path).convert("RGBA"); im = im.crop(im.getbbox())
    s = min(CELL * .8 / im.height, CELL * .92 / im.width)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); out.alpha_composite(im, ((CELL - im.width) // 2, round(CELL * .94) - im.height))
    return rgba(out)


def warp(img, dx, dy, sx, sy, ax, ay):
    """Scale about (ax, ay) then shift, resampled premultiplied."""
    im = Image.fromarray((img * 255).astype("uint8"), "RGBA").convert("RGBa")
    coeffs = (1 / sx, 0, ax - (ax + dx) / sx, 0, 1 / sy, ay - (ay + dy) / sy)
    return np.asarray(im.transform(im.size, Image.AFFINE, coeffs, Image.BICUBIC).convert("RGBA"), dtype=np.float32) / 255


pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)


def proc(cid):
    d = WORK / cid
    shutil.rmtree(d / "proc", ignore_errors=True)
    run(PROC, "process", "--input", d / "raw-bounce.png", "--target", "creature", "--mode", "idle", "--output-dir", d / "proc", "--rows", "4", "--cols", "2",
        "--cell-size", str(CELL), "--fit-scale", "0.86", "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "largest")
    master = fit_master(master_of(cid))
    ys, xs = np.where(master[..., 3] > .5); top, foot = ys.min(), ys.max(); cx = float(np.median(xs)); h = foot - top
    frames = [rgba(Image.open(d / f"proc/idle-{i}.png").resize((CELL, CELL), Image.Resampling.LANCZOS)) for i in range(1, 9)]
    # One shared scale for all frames (the bob changes each frame's height; the median does not).
    heights = [np.where(f[..., 3] > .5)[0] for f in frames]
    s0 = h / float(np.median([r.max() - r.min() for r in heights]))
    aligned = []
    for f, r in zip(frames, heights):
        g = warp(f, 0, 0, s0, s0, CELL / 2, r.max())
        gy, gx = np.where(g[..., 3] > .5)
        feet = gx[gy > gy.max() - h * .12]
        aligned.append(warp(g, cx - float(np.median(feet)), foot - gy.max(), 1, 1, cx, foot))
    # Bands from the feet up: legs, body, head (fractions of the drawn height), blended over ramps.
    bands = [(0, .32), (.26, .72), (.66, 1.05)]
    rows = np.arange(CELL)[:, None]
    def band_mask(lo, hi, ramp=.05):
        u = (foot - rows) / h
        return np.broadcast_to(np.clip(np.minimum((u - lo) / ramp + .5, (hi - u) / ramp + .5), 0, 1), (CELL, CELL))
    weights = [band_mask(lo, hi) for lo, hi in bands]
    params = np.zeros((8, len(bands), 3))  # dx, dy, sy per frame and band
    for i, f in enumerate(aligned):
        fpm = pm(f)
        for b, (lo, hi) in enumerate(bands):
            region = (weights[b] > .5)[:, :, None] & ndimage.binary_dilation((master[..., 3] > .3) | (f[..., 3] > .3), iterations=3)[:, :, None]
            ay = foot - lo * h
            best = None
            for sy in np.arange(.94, 1.061, .01):
                for dy in range(-10 if b else 0, 5 if b else 1):
                    for dx in range(-4, 5):
                        w = warp(master, dx, dy, 1, sy, cx, ay)
                        err = float(np.abs(pm(w) - fpm)[np.broadcast_to(region, fpm.shape)].mean())
                        if best is None or err < best[0]:
                            best = (err, dx, dy, sy)
            params[i, b] = best[1:]
    # Smooth each band's motion around the loop so redraw noise never shows as jitter.
    k = np.array([.25, .5, .25])
    for _ in range(2):
        params = sum(np.roll(params, s, axis=0) * w for s, w in zip((-1, 0, 1), k))
    # Codex draws the bounce timidly; widen it around each band's mean so the bob reads in play.
    mean = params.mean(axis=0, keepdims=True)
    params = mean + (params - mean) * AMPLITUDE
    out = d / "rig"; shutil.rmtree(out, ignore_errors=True); out.mkdir()
    sheet = Image.new("RGBA", (CELL * 2, CELL * 4), (0, 0, 0, 0))
    for i in range(8):
        acc = np.zeros_like(master); wsum = np.zeros((CELL, CELL, 1))
        for b, (lo, hi) in enumerate(bands):
            dx, dy, sy = params[i, b]
            w = weights[b][..., None]
            acc += pm(warp(master, dx, dy, 1, sy, cx, foot - lo * h)) * w; wsum += w
        acc /= np.maximum(wsum, 1e-6)
        a = acc[..., 3:]; col = np.where(a > 1e-4, acc[..., :3] / np.maximum(a, 1e-4), 0)
        frame = Image.fromarray((np.concatenate([col, a], -1).clip(0, 1) * 255).astype("uint8"), "RGBA")
        frame.save(out / f"idle-{i + 1}.png"); sheet.alpha_composite(frame, ((i % 2) * CELL, (i // 2) * CELL))
    sheet.save(out / "idle.webp", lossless=True, method=6)
    (out / "rig.json").write_text(json.dumps({"bands": bands, "params": params.round(3).tolist()}, indent=1), encoding="utf-8")
    print(cid, "bob (body dy per frame):", params[:, 1, 1].round(1).tolist(), "head dy:", params[:, 2, 1].round(1).tolist())


if __name__ == "__main__":
    cmd, cid, *rest = sys.argv[1:]
    if cmd == "gen":
        gen(cid, rest[0], rest[1], *rest[2:])
    else:
        proc(cid)
