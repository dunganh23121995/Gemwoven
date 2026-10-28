"""Nori's run cycle redrawn as a grounded heavy jog (forms 1 and 3): the player found the earlier
cycle odd, hopping with both feet off the ground and knees raised high.

Keeps the character paragraph of the sheet's earlier prompt; only the motion changes. Image 2 is a
make_anchor_layout template of the form's resting pose.

  python assets/heroes/forms/earth/tools/redraw_run.py gen <form> [model effort]  -> .build-cache/redo/nori-run<form>/raw.png
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
PROMPT = {"1": ROOT / "assets/reimagined/heroes/earth/run/prompt-used.txt", "3": ROOT / "assets/heroes/forms/earth/form-3/run/prompt-used.txt"}
IDLE = {"1": ROOT / "assets/reimagined/heroes/earth/idle.webp", "3": ROOT / "assets/heroes/forms/earth/form-3/idle.webp"}
MOTION = """Create a 6-frame RUN CYCLE to the right: a steady, grounded, heavy armoured jog of a sturdy knight, like a mobile RPG hero jogging across the field. ONE FOOT IS ALWAYS ON THE GROUND (never both feet in the air, no jumping, no hopping), the knees lift only a little (the raised foot stays below his knee height), short quick strides.
He faces right in 3/4 view, so we see his LEFT side: his LEFT leg is the NEAR leg (in front, fully lit), his RIGHT leg is the FAR leg (behind it, partly hidden, painted a little darker).
His upper body, head, hammer and shield are IDENTICAL and at the SAME HEIGHT in all six frames (at most a tiny 1-2% bob): leaning slightly forward, the shield held in front of his chest (its bottom edge above the knees, never hiding the legs), the hammer carried in his right hand angled back over his shoulder, the cape streaming back. Only the legs move:
Frame 1: LEFT (near) foot planted forward, RIGHT (far) leg stretched back on its toes.
Frame 2: LEFT foot flat under the body, RIGHT foot passing forward just above the ground.
Frame 3: RIGHT foot stepping down forward, LEFT leg pushing off behind on its toes.
Frame 4: RIGHT (far) foot planted forward, LEFT (near) leg stretched back on its toes.
Frame 5: RIGHT foot flat under the body, LEFT foot passing forward just above the ground, in front of the body.
Frame 6: LEFT foot stepping down forward, RIGHT leg pushing off behind; flows back into frame 1.
Both boots stay close to the same ground line (feet at about 88% of the cell height) in every frame.
"""


def gen(form, model="gpt-6.1-sol", effort="low"):
    work = ROOT / f".build-cache/redo/nori-run{form}"; work.mkdir(parents=True, exist_ok=True)
    idle = Image.open(IDLE[form]).convert("RGBA"); c = idle.width // 2
    rest = idle.crop((0, 0, c, c))
    ref = Image.new("RGBA", rest.size, (255, 0, 255, 255)); ref.alpha_composite(rest)
    ref.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(work / "identity.png")
    subprocess.run([sys.executable, ANCHOR, "--input", str(work / "identity.png"), "--rows", "2", "--cols", "3", "--cell-width", "512", "--cell-height", "512",
                    "--subject-height-ratio", ".62", "--feet-ratio", ".88", "--output", str(work / "anchor.png")], check=True, capture_output=True)
    old = PROMPT[form].read_text(encoding="utf-8")
    head, tail = old.split("Create a 6-frame RUN CYCLE")[0], old.split("Frames 4-6 are the mirror")[1].split("\n", 1)[1]
    (work / "prompt.txt").write_text(head + MOTION + tail, encoding="utf-8")
    subprocess.run([sys.executable, GEN, "--prompt-file", str(work / "prompt.txt"), "--out", str(work / "raw.png"),
                    "--ref", str(work / "identity.png"), "--ref", str(work / "anchor.png"), "--model", model, "--effort", effort, "--timeout", "900"], check=True)


if __name__ == "__main__":
    {"gen": gen}[sys.argv[1]](*sys.argv[2:])
