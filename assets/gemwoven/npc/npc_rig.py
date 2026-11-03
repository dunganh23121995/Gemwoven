"""Hub NPCs that move at rest on the hero rig (assets/heroes/forms/rig_idle.py, baked mesh deformation): the approved
NPC picture is cut into parts by a Codex part map and only moved, never redrawn. The painted background has the NPC
removed (plate), the baked sheet stands where the NPC was painted.

  python assets/gemwoven/npc/npc_rig.py rest  <id>             rig/show/rest.png from proc/raw-sheet-clean.png
  python assets/gemwoven/npc/npc_rig.py parts <id> [model effort]
  python assets/gemwoven/npc/npc_rig.py make  <id>             fit + bake (rig/show/idle.webp, rig.json)
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "assets/heroes/forms"))
import rig_idle as R  # noqa: E402

HERE = Path(__file__).resolve().parent
PROMPT = """Image 1 is a {what} on a plain background, cut off by a straight horizontal edge at the bottom. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face, eyes, mouth, cat ears, the hair on top of the head and the bangs. The face is never any other colour.
- pure WHITE #FFFFFF: the body: torso, collar, ribbon tie, shoulders, both arms and both hands (the hand at the cheek too).
- pure GREEN #00FF00: the bottom band of the picture along the straight cut edge (about the lowest tenth of her height): it rests on the counter and never moves.
- pure YELLOW #FFFF00: the quill pen only, without the hand.
- pure RED #FF0000: the long loose hair falling down both sides of her body and the side locks.
- pure CYAN #00FFFF: the orange hair bow, small hair strands over the face and loose sleeve edges.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""
NPCS = {
    "shopkeeper": dict(what="chibi anime shopkeeper girl with white hair and cat ears, upper body only, holding a quill",
                       style=dict(T=2.6, bob=.007, sway=.003, tilt=.7, grip=.6, loose=.16, front=.07, lag=1.1, lean=.5, planted=True, webp=(86, 90)),
                       # where the rest cell stands on the 941x1672 stage, and its size there (place.py)
                       stage=dict(x=295, y=528, size=225.7)),
    "bunny": dict(what="small fluffy white rabbit with an orange bow, sitting",
                  prompt="""Image 1 is a {what} on a plain background. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: face, eyes, nose, mouth, cheeks and the top of the head up to where the ears start. The face is never any other colour.
- pure WHITE #FFFFFF: the round body and chest, the front paws.
- pure GREEN #00FF00: the hind feet and the bottom of the body sitting on the ground: they never move.
- pure RED #FF0000: both long ears, each from its base to its tip.
- pure CYAN #00FFFF: the orange bow, the fluffy tail and small fur tufts.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text.""",
                  style=dict(T=2.2, bob=.008, sway=.003, tilt=.9, grip=0, loose=.2, front=.08, lag=1.0, lean=.4, planted=True, webp=(86, 90)),
                  stage=dict(x=179.6, y=604.5, size=162.6)),
    "librarian": dict(what="chibi anime girl with white hair and cat ears lying on her stomach, reading a book",
                      prompt="""Image 1 is a {what} on a plain background. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face, eyes, mouth, cat ears, the hair on top of the head and the bangs. The face is never any other colour.
- pure WHITE #FFFFFF: the upper body propped on the elbows: chest, shoulders, both arms and both hands.
- pure GREEN #00FF00: everything resting on the floor that never moves: the hips, the skirt, both legs and shoes, and the open book lying flat on the floor.
- pure YELLOW #FFFF00: the closed golden book held in her hands, without the hands.
- pure RED #FF0000: the long loose hair locks hanging down beside her face and shoulders.
- pure CYAN #00FFFF: the flower ornament in her hair and small loose frills at the cuffs.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text.""",
                      style=dict(T=3.0, bob=.006, sway=.002, tilt=.8, grip=.5, loose=.18, front=.08, lag=1.1, lean=.4, planted=True, webp=(86, 90)),
                      stage=dict(x=-8, y=83, size=440)),
}


def register(key):
    d = HERE / key
    R.FOREIGN[key] = dict(dir=d, sheet=d / "rig/show/rest.png", what=NPCS[key]["what"], prompt=NPCS[key].get("prompt", PROMPT))
    R.STYLE[key] = NPCS[key]["style"]
    return d


def rest(key):
    d = register(key)
    work = d / "rig/show"; work.mkdir(parents=True, exist_ok=True)
    spr = Image.open(d / "proc/raw-sheet-clean.png").convert("RGBA")
    n = R.CELL["show"]
    spr.resize((n, n), Image.Resampling.LANCZOS).save(work / "rest.png")


if __name__ == "__main__":
    cmd, key = sys.argv[1], sys.argv[2]
    if cmd == "rest":
        rest(key)
    elif cmd == "parts":
        register(key); R.parts(key, 1, "show", *sys.argv[3:])
    elif cmd == "make":
        d = register(key)
        R.fit(key, 1, "show")
        R.Rig(key, 1, "show").bake()
        meta = json.loads((d / "rig/show/rig.json").read_text(encoding="utf-8"))
        meta["stage"] = NPCS[key]["stage"]
        (d / "rig/show/rig.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
