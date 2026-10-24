"""Draw a hero form's showcase set for the hub (hero-show.js), the recipe approved on Noct form 3.

  python assets/heroes/forms/make_showcase.py <spec.json>

spec: {"dir": "assets/heroes/forms/<hero>/form-N/showcase", "identity": "<image of the form>",
       "what": "...", "pose": "...", "idle": "...", "fidgets": [[name, label, action, whole]...], "rift": "..."}
Steps: showcase master pose (Codex) -> resting loop (rigid core) -> fidgets -> rift entrance (whole frames)
-> everything accepted into the showcase folder. Each sheet is drawn by Codex; nothing is stretched.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
FIDGET = ROOT / "assets/gemwoven/elites/fidget.py"

MASTER = """Image 1 is the exact character and art reference: {what}.
Draw ONE full-body showcase pose of exactly this character for a hero screen: his coolest, most iconic stance. {pose} Facing RIGHT in a confident 3/4 view.
Same design, colours, proportions and chibi scale as Image 1. Whole body and weapon inside the image with margin, feet on the ground.
Everything opaque: no smoke clouds, mist, haze, glow halos or loose particles. No ground, no shadow, no text. Background 100% solid flat #FF00FF magenta, no gradient. Clean HD smooth painted game art, NOT pixel art."""


def run(*cmd):
    r = subprocess.run([sys.executable, *map(str, cmd)], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout[-2000:] + r.stderr[-2000:])
    print(r.stdout.strip()[-300:], flush=True)


def main(spec_path, model="gpt-6.1-sol", effort="low"):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    d = ROOT / spec["dir"]; d.mkdir(parents=True, exist_ok=True)
    rel = spec["dir"]
    if not (d / "master.png").exists():
        im = Image.open(ROOT / spec["identity"]).convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 0, 255, 255)); bg.alpha_composite(im); bg.convert("RGB").save(d / "identity.png")
        (d / "prompt-master.txt").write_text(MASTER.format(what=spec["what"], pose=spec["pose"]) + "\n", encoding="utf-8")
        run(GEN, "--prompt-file", d / "prompt-master.txt", "--out", d / "raw-master.png", "--ref", d / "identity.png", "--model", model, "--effort", effort, "--timeout", "900")
        run(PROC, "process", "--input", d / "raw-master.png", "--target", "creature", "--mode", "idle", "--output-dir", d / "proc-master", "--rows", "1", "--cols", "1",
            "--cell-size", "512", "--fit-scale", "0.86", "--align", "feet", "--scale-strategy", "fit", "--component-mode", "largest")
        (d / "proc-master/idle-1.png").replace(d / "master.png")
        (d / "identity.png").unlink()
    what = spec["what"] + ", standing in his showcase pose facing right"
    jobs = [("idle", "Nghỉ", spec["idle"], "--core=12", True)] + [(n, l, a, "--whole" if w else "", False) for n, l, a, w in spec["fidgets"]] + [("rift", "Rạch không gian bước ra", spec["rift"], "--all-whole", False)]
    for name, label, action, flag, loop in jobs:
        run(FIDGET, "gen", rel, name, model, effort, what, action, *(["--loop"] if loop else []))
        run(FIDGET, "proc", rel, name, *([flag] if flag else []))
        run(FIDGET, "accept", rel, name, label, *(["--whole"] if flag == "--whole" else []))


if __name__ == "__main__":
    main(*sys.argv[1:])
