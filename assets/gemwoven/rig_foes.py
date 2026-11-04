"""Foe idles and buffs on the hero rig (assets/heroes/forms/rig_idle.py): common creatures, elites and chapter bosses.
Their first idle frame moves, nothing is redrawn; a foe that floats is told from its drawn loop.

  python assets/gemwoven/rig_foes.py parts <id> [model effort]   Codex draws the part map
  python assets/gemwoven/rig_foes.py make  <id>                  fit + bake + surge (rig/foe/idle.webp, rig/buff/buff.webp)
  python assets/gemwoven/rig_foes.py list                        every foe id

Output: <foe folder>/rig/foe/ and rig/buff/. build.py uses them wherever rig.json exists.
The resting frame (rig/foe/rest.png) is first cut at 256px from the drawn loop; sharpen_foes.py redraws it at the size
combat shows it (512px, bosses 640px) and `make` then bakes at that size with the same part map.
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/heroes/forms"))
import rig_idle as R  # noqa: E402

PROMPT = """Image 1 is a fantasy game {what} on a plain background. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face, eyes, mouth, jaw, horns, helmet, hood, the main hair or mane mass. The face is never any other colour. A creature with no separate head has its face area blue.
- pure WHITE #FFFFFF: the body: torso, chest, armour, shoulders, arms, hands, claws on arms, the main mass of a blob or a shell.
- pure GREEN #00FF00: legs and feet that stand on the ground, with boots and paws.
- pure YELLOW #FFFF00: anything held or carried rigid: weapon, staff, shield, lantern, without the hand.
- pure RED #FF0000: long loose pieces that stick out of the body and move freely: wings, tails, tentacles, long fins, capes, cloak tails, long hair, ribbons, vines, chains.
- pure CYAN #00FFFF: small loose pieces lying on the body: tassels, short cloth, fur tufts, leaves, small fins, ear tips.
Use only the colours that fit this subject. Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""

KINDS = {   # how each family stands; a floater (see floats) gains fly on top of its family
    "creature": ("creature", dict(T=1.6, bob=.016, sway=.004, tilt=1.2, grip=1., loose=.24, front=.1, lag=.9, lean=.6, face=-1, webp=(80, 85))),
    "elite": ("humanoid elite warrior or mage", dict(T=1.8, bob=.012, sway=.003, tilt=.8, grip=1., loose=.2, front=.08, lag=1., lean=.7, face=-1, planted=True, rests=.7, webp=(80, 85))),
    "boss": ("towering boss monster", dict(T=2.2, bob=.012, sway=.003, tilt=.7, grip=.8, loose=.18, front=.07, lag=1.2, lean=.5, face=-1, planted=True, rests=.7, webp=(80, 85))),
}
CALM = {"coralreef-foamjelly": .55, "roc": .6, "coralreef-anemonewitch": .7, "souljailer": .7}   # thin pieces that crumble at full swing
BASE = {k: getattr(R.Surge, k) for k in ("FLARE", "LEAN", "NOD", "DIP")}
FOLDERS = (("creature", "assets/gemwoven/creatures"), ("elite", "assets/gemwoven/elites"), ("boss", "assets/gemwoven/boss-anim"))


def floats(sheet):
    """Named as a flyer (the same names lift it in combat, sprite-runtime.js idleMotion), or the drawn loop's soles move."""
    if re.search("bat|roc|wing|wisp|moth|crow|raven|finch|jelly", sheet.parent.name):
        return True
    im = Image.open(sheet).convert("RGBA"); c = im.width // 2
    soles = []
    for i in range(8):
        cell = np.asarray(im.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)))[..., 3] > 128
        ys = np.where(cell.any(axis=1))[0]
        soles.append(ys.max() if len(ys) else 0)
    return max(soles) - min(soles) >= c * .025


def register():
    for kind, folder in FOLDERS:
        what, style = KINDS[kind]
        for sheet in sorted((ROOT / folder).glob("*/idle.webp")):
            key = sheet.parent.name
            R.FOREIGN[key] = dict(dir=sheet.parent, sheet=sheet, what=what, prompt=PROMPT, kind=kind)
            R.STYLE[key] = {**style, **(dict(fly=True, dangle=2., bob=style["bob"] + .012, loose=style["loose"] * 1.8) if floats(sheet) else {})}
    return sorted(R.FOREIGN)


def fitted(build):
    """Bake, and if a piece reached the cell's edge bake again with less motion: a straight cut there reads as a bug."""
    for damp in (1, .75, .55, .4, .3, .2, .1, .05):
        if build(damp).bake() < .15:
            return


def make(key):
    R.fit(key, 1, "foe")
    style = dict(R.STYLE[key])
    calm = CALM.get(key, 1)

    def idle(damp):
        R.STYLE[key] = {**style, **{k: style.get(k, 0) * damp * calm for k in ("loose", "bob", "sway", "tilt", "grip", "lean", "front", "dangle")}}
        return R.Rig(key, 1, "foe")

    def surge(damp):
        R.STYLE[key] = {**style, **{k: style.get(k, 0) * damp * calm for k in ("loose", "grip", "front")}}
        for k in ("FLARE", "LEAN", "NOD", "DIP"):
            setattr(R.Surge, k, BASE[k] * damp * calm)
        return R.Surge(key, 1)

    fitted(idle); fitted(surge)


if __name__ == "__main__":
    ids = register()
    cmd = sys.argv[1]
    if cmd == "list":
        print("\n".join(f"{k} {R.FOREIGN[k]['kind']}{' floats' if R.STYLE[k].get('fly') else ''}" for k in ids))
    elif cmd == "parts":
        R.parts(sys.argv[2], 1, "foe", *sys.argv[3:])
    else:
        make(sys.argv[2])
