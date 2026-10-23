"""Re-run the idle post-processing (process -> precenter -> stabilize) for every elite and boss
from its kept raw-idle.png, with no new generations. A result replaces the current idle unless
its mean jitter is clearly worse (> current + 1.5 and > 7).

Usage: python assets/gemwoven/elites/restabilize_all.py [ids...]
"""
import json
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
HERE = ROOT / "assets/gemwoven/elites"
BOSS_DIR = ROOT / "assets/gemwoven/boss-anim"
BASE, STATIC = ["earth", "fire", "ice", "lightning"], "mire scarab leviathan colossus prism reaper roc briar seraph eclipse".split()
THIN_PROPS = {"celestial-dawncleric"}  # a censer on a thin chain: keep every component


def jobs():
    for d in sorted(HERE.iterdir()):
        if (d / "raw-idle.png").exists():
            master = d / "master.png" if (d / "master.png").exists() else ROOT / f"assets/gemwoven/items/creature-{d.name}.png"
            yield d, master, 10
    for d in sorted(BOSS_DIR.iterdir()):
        if (d / "raw-idle.png").exists():
            b = d.name
            master = ROOT / (f"assets/gemwoven/items/boss-{b}.webp" if b in BASE else f"assets/gemwoven/items/boss-{b}.png" if b in STATIC else f"assets/gemwoven/boss-anim/{b}/master.png")
            yield d, master, 14


def mean(meta):
    return sum(meta["jitter"]) / len(meta["jitter"])


def one(job):
    d, master, core = job
    work = ROOT / ".build-cache/restab" / d.name
    shutil.rmtree(work, ignore_errors=True); work.mkdir(parents=True)
    run = lambda *a: subprocess.run([sys.executable, *map(str, a)], cwd=ROOT, check=True, capture_output=True, text=True)
    run(PROC, "process", "--input", d / "raw-idle.png", "--target", "creature", "--mode", "idle", "--output-dir", work / "proc", "--rows", "4", "--cols", "2",
        "--cell-size", "256", "--fit-scale", "0.86", "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "all" if d.name in THIN_PROPS else "largest")
    run(HERE / "precenter.py", master, work / "proc", work / "aligned")
    run(HERE / "stabilize_idle.py", master, work / "stable", *[work / f"aligned/idle-{i}.png" for i in range(1, 9)], "--core", core)
    new = json.loads((work / "stable/stabilize-meta.json").read_text())
    old = json.loads((d / "stabilize-meta.json").read_text()) if (d / "stabilize-meta.json").exists() else None
    worse = old and mean(new) > mean(old) + 1.5 and mean(new) > 7
    if not worse:
        shutil.copy2(work / "stable/idle.webp", d / "idle.webp")
        shutil.copy2(work / "stable/stabilize-meta.json", d / "stabilize-meta.json")
    return d.name, round(mean(old), 2) if old else None, round(mean(new), 2), "kept old" if worse else "updated"


if __name__ == "__main__":
    picked = [j for j in jobs() if not sys.argv[1:] or j[0].name in sys.argv[1:]]
    with ThreadPoolExecutor(6) as pool:
        for row in pool.map(one, picked):
            print(*row, flush=True)
