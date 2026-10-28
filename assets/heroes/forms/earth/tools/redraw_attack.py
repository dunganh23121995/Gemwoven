"""Nori's form 2-3 attack (overhead hammer slam) redrawn with a rigid hammer: the player found the handle
vanishing on the backswing (the head sitting on his fist) and, in form 3, the head lying along the
ground on the slam and parallel to the handle on the recoil.

Keeps the character paragraph and layout of the sheet's earlier prompt; only the motion changes. Image 2
is a make_anchor_layout template of the form's resting pose. Placement is the earlier one
(place_action.py, spec same,boots,boots,sole,boots,fit at K .85, forms.json scale 1.1765).

  python assets/heroes/forms/earth/tools/redraw_attack.py gen <form> [model effort]   -> .build-cache/redo/nori-atk<form>/raw.png
  python assets/heroes/forms/earth/tools/redraw_attack.py place <form>                -> .build-cache/redo/nori-atk<form>/place/sheet.png
  python assets/heroes/forms/earth/tools/redraw_attack.py accept <form>               -> form-N/attack.webp + attack/{raw-original.png,prompt-used.txt}
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
FORMS = ROOT / "assets/heroes/forms/earth"
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
MOTION = """Create a 6-frame ATTACK animation: one heavy, readable overhead HAMMER SLAM. Both feet stay planted on the ground line in exactly the same place and the same wide stance as Image 2 in ALL six frames (the boots never slide, lift or change size); the hips stay in place; the strike comes from the arms, shoulders and a torso twist with a knee bend.
THE HAMMER IS ONE RIGID OBJECT, exactly the hammer of Image 1 in every frame: its handle always shows its FULL length between his fist and the hammer head (never hidden behind the head, never shortened, the head never sits directly on his fist), and the hammer head is always PERPENDICULAR to the handle, like the top bar of a letter T. The hammer only rotates as a whole around his grip.
Frame 1: ready guard, exactly the resting pose of Image 2 (hammer at his side, shield in front).
Frame 2: wind-up: his right arm is raised and drawn back behind his right shoulder, and the hammer is swung back with its handle stretched out straight at full length, pointing up and back behind his head (about 45 degrees behind vertical); the hammer head is far from his fist at the end of the handle, high behind his head, perpendicular to the handle; torso turns slightly back; shield pulled in to his chest.
Frame 3: the hammer comes over the top: the handle points straight up above his head at full length and the hammer head lies horizontal on top of it at the peak of the arc, both shoulders lifted, eyes fierce.
Frame 4: the SLAM: the hammer has swung down in front of him, the handle diagonal from his hands down to the ground in front of his front foot, and the hammer head strikes the ground with its flat striking face pressed squarely DOWN onto the ground (the head stands upright on its face, perpendicular to the handle, never lying on its side along the ground); torso leaning forward, knees bent so the body is a little lower (about 6% of his height), shield held to his left side.
Frame 5: recoil: the hammer lifts back up off the ground to waist height in front of him, the handle about level pointing forward, the hammer head standing UPRIGHT (vertical) at the far end of the handle, perpendicular to it; body rising back up.
Frame 6: back to the ready guard of frame 1, exactly the resting pose of Image 2.
"""


def work(form):
    return ROOT / f".build-cache/redo/nori-atk{form}"


def gen(form, model="gpt-6.1-sol", effort="low"):
    w = work(form); w.mkdir(parents=True, exist_ok=True)
    idle = Image.open(FORMS / f"form-{form}/idle.webp").convert("RGBA"); c = idle.width // 2
    ref = Image.new("RGBA", (c, c), (255, 0, 255, 255)); ref.alpha_composite(idle.crop((0, 0, c, c)))
    ref.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(w / "identity.png")
    subprocess.run([sys.executable, ANCHOR, "--input", str(w / "identity.png"), "--rows", "2", "--cols", "3", "--cell-width", "512", "--cell-height", "512",
                    "--subject-height-ratio", ".62", "--feet-ratio", ".88", "--output", str(w / "anchor.png")], check=True, capture_output=True)
    old = (FORMS / f"form-{form}/attack/prompt-used.txt").read_text(encoding="utf-8")
    head, tail = old.split("Create a 6-frame ATTACK animation")[0], old.split("SMOOTH, STEADY ANIMATION")[1]
    (w / "prompt.txt").write_text(head + MOTION + "SMOOTH, STEADY ANIMATION" + tail, encoding="utf-8")
    subprocess.run([sys.executable, GEN, "--prompt-file", str(w / "prompt.txt"), "--out", str(w / "raw.png"),
                    "--ref", str(w / "identity.png"), "--ref", str(w / "anchor.png"), "--model", model, "--effort", effort, "--timeout", "900"], check=True)


def place(form, spec="same,boots,boots,sole,boots,fit"):
    w = work(form)
    subprocess.run([sys.executable, PROC, "process", "--input", str(w / "raw.png"), "--target", "player", "--mode", "attack", "--output-dir", str(w / "key"),
                    "--rows", "2", "--cols", "3", "--cell-size", "512", "--fit-scale", ".95", "--align", "feet", "--scale-strategy", "preserve",
                    "--component-mode", "largest"], check=True, capture_output=True)
    subprocess.run([sys.executable, str(FORMS / "tools/place_action.py"), str(w / "key/raw-sheet-clean.png"), "3", "2",
                    str(FORMS / f"form-{form}/idle.webp"), str(w / "place"), "attack", spec, "--k=.85"], check=True)


def accept(form):
    w, d = work(form), FORMS / f"form-{form}"
    Image.open(w / "place/sheet.png").save(d / "attack.webp", lossless=True, method=6)
    shutil.copy2(w / "raw.png", d / "attack/raw-original.png")
    shutil.copy2(w / "prompt.txt", d / "attack/prompt-used.txt")
    print("accepted Nori form", form, "attack")


if __name__ == "__main__":
    {"gen": gen, "place": place, "accept": accept}[sys.argv[1]](*sys.argv[2:])
