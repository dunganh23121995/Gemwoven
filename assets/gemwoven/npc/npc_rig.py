"""Hub NPCs that move at rest on the hero rig (assets/heroes/forms/rig_idle.py, baked mesh deformation): the approved
NPC picture is cut into parts by a Codex part map and only moved, never redrawn. The painted background has the NPC
removed (plate), the baked sheet stands where the NPC was painted.

  python assets/gemwoven/npc/npc_rig.py rest  <id>             rig/show/rest.png from proc/raw-sheet-clean.png
  python assets/gemwoven/npc/npc_rig.py parts <id> [model effort]
  python assets/gemwoven/npc/npc_rig.py make  <id>             fit + bake (rig/show/idle.webp, rig.json)

Gặp Gỡ plaza NPCs (plaza-guide, plaza-weaver) walk the same steps; their approved master lives in
assets/gemwoven/raw/plaza-npc/<id>/ and their rig in assets/gemwoven/plaza/npcs/<id>/rig/show/. `rest` stands the
master in the cell with room to sway, `make` also writes where the soles and the crown sit (rig.json "plaza").
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


PLAZA, PLAZA_RAW = ROOT / "assets/gemwoven/plaza/npcs", ROOT / "assets/gemwoven/raw/plaza-npc"
PLAZA_PROMPT = """Image 1 is a {what} on a plain background. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face with eyes, nose and mouth, the ears, the hair on top of the head, the bangs and the hair ornaments on the head. The face is never any other colour.
- pure WHITE #FFFFFF: the body: neck, torso, chest, waist, the upper skirt or coat, shoulders, both arms and both hands.
- pure GREEN #00FF00: both legs below the skirt with the boots: they stand on the ground and never move.
- pure YELLOW #FFFF00: {held}, without the hands.
- pure RED #FF0000: {back}.
- pure CYAN #00FFFF: {front}.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""
# Gặp Gỡ: a lively but calm stand (show share 1.4 on bob/sway/tilt/lean), the feet and the hem never lift.
PLAZA_STYLE = dict(T=2.8, bob=.006, sway=.0025, tilt=.8, grip=.8, loose=.2, front=.06, lag=1.1, lean=.45, planted=True, webp=(96, 100))   # the 640 bake; the plaza sheet is re-encoded by shrink()
NPCS.update({
    "plaza-guide": dict(dir=PLAZA / "guide", master=PLAZA_RAW / "guide/proc/raw-sheet-clean.png",
                        what="young woman guide with cat ears and a cat tail standing, holding a rolled map",
                        prompt=PLAZA_PROMPT.format(what="{what}", held="the rolled map scroll only",
                                                   back="the long cat tail from its base to its tip, the long hair locks falling beside her face and shoulders, the long free ends of the scarf",
                                                   front="the skirt hem and coat-dress tails below the waist, the short shoulder cape edge, the belt pouch, small hair strands over the face"),
                        # Codex rig review 1: more free-tip motion, less whole-body bob and lean
                        style=dict(PLAZA_STYLE, bob=.0045, grip=1.1, loose=.25, front=.07, lean=.35), plaza=190),
    "plaza-weaver": dict(dir=PLAZA / "weaver", master=PLAZA_RAW / "weaver/proc/raw-sheet-clean.png",
                         what="young woman lantern weaver standing, holding a spindle with ribbons and a small lantern",
                         prompt=PLAZA_PROMPT.format(what="{what}", held="the spindle and the small lantern with its handle",
                                                    back="the long ponytail, the long hair locks beside her face, the coloured ribbons hanging from the spindle",
                                                    front="the skirt hem and the over-robe tails below the waist, the apron's lower edge, small hair strands over the face"),
                         style=dict(PLAZA_STYLE, bob=.0045, sway=.002, grip=1.0, loose=.27, front=.07, lean=.3), plaza=185),
})


def register(key):
    d = NPCS[key].get("dir", HERE / key)
    R.FOREIGN[key] = dict(dir=d, sheet=d / "rig/show/rest.png", what=NPCS[key]["what"], prompt=NPCS[key].get("prompt", PROMPT))
    R.STYLE[key] = NPCS[key]["style"]
    return d


def rest(key):
    d = register(key)
    work = d / "rig/show"; work.mkdir(parents=True, exist_ok=True)
    n = R.CELL["show"]
    if "master" in NPCS[key]:
        # the standing master, soles at 95% of the cell, the crown at 13%: room to sway on every side
        spr = Image.open(NPCS[key]["master"]).convert("RGBA")
        spr = spr.crop(spr.getbbox())
        s = min(n * .82 / spr.height, n * .86 / spr.width)
        spr = spr.resize((round(spr.width * s), round(spr.height * s)), Image.Resampling.LANCZOS)
        cell = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        cell.alpha_composite(spr, ((n - spr.width) // 2, round(n * .95) - spr.height))
        cell.save(work / "rest.png")
        return
    spr = Image.open(d / "proc/raw-sheet-clean.png").convert("RGBA")
    spr.resize((n, n), Image.Resampling.LANCZOS).save(work / "rest.png")


class PlazaRig(R.Rig):
    """The hero rig, with one guard for the long hair and scarves lying over a standing body: the colours bled under the
    core for a loose piece (they close the gap where it swings off the body) show only inside the hole the piece left
    in the core, so they never slide out past the body's outline as a dark smudge."""
    def prepare(self):
        super().prepare()
        from scipy import ndimage
        import cv2
        import numpy as np
        for c in self.chains:
            proper = cv2.GaussianBlur(ndimage.binary_dilation(c.mask, iterations=2).astype(np.float32), (0, 0), .8)[..., None]
            c.band, c.layer = c.layer * (1 - proper), c.layer * proper
            c.hole = cv2.GaussianBlur(ndimage.binary_dilation(c.mask, iterations=1).astype(np.float32), (0, 0), .8)

    def frame(self, t):
        core = self.core_field(t)
        out = self.warp(self.core, core)
        for c in self.chains:
            field = self.chain_field(c, t, core)
            piece = self.warp(c.layer, field)
            band = self.warp(c.band, field) * self.warp(c.hole, core)[..., None]
            piece = piece + band * (1 - piece[..., 3:])
            out = out + piece * (1 - out[..., 3:])
        return out


PLAZA_CELL = 400   # runtime cell: about 1.7x what a DPR2 phone shows, a quarter of the 640 bake's weight


def shrink(key):
    """The plaza never shows the 640 bake that large: resample the sheet (premultiplied) to PLAZA_CELL cells."""
    import cv2
    import numpy as np
    d = NPCS[key]["dir"] / "rig/show"
    a = np.asarray(Image.open(d / "idle.webp").convert("RGBA"), dtype=np.float32) / 255
    n = a.shape[1] // R.COLS
    a = np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
    a = cv2.resize(a, (PLAZA_CELL * R.COLS, PLAZA_CELL * R.ROWS), interpolation=cv2.INTER_AREA).clip(0, 1)
    k = a[..., 3:]
    a = np.concatenate([np.where(k > 1e-4, a[..., :3] / np.maximum(k, 1e-4), 0), k], -1)
    q, aq = 88, 92
    Image.fromarray((a * 255 + .5).astype("uint8"), "RGBA").save(d / "idle.webp", quality=q, alpha_quality=aq, method=6)
    return n


def plaza_anchor(key, meta):
    """Where the plaza stands the sheet: soles (footY), the feet's middle (feetX), crown (bodyHeight), all cell shares."""
    import numpy as np
    from scipy import ndimage
    d = NPCS[key]["dir"]
    a = np.asarray(Image.open(d / "rig/show/rest.png").convert("RGBA"))[..., 3] > 127
    n = a.shape[0]
    ys = np.where(a.any(axis=1))[0]
    sole, top = int(ys.max()), int(ys.min())
    legs = np.asarray(Image.open(d / "rig/show/parts.png").convert("RGB"))
    green = (legs[..., 1] > 200) & (legs[..., 0] < 60) & (legs[..., 2] < 60)
    feet = green[sole - n // 20:sole + 1] if green[sole - n // 20:sole + 1].any() else a[sole - n // 40:sole + 1]
    meta["plaza"] = dict(height=NPCS[key]["plaza"], footY=round((sole + 1) / n, 5), feetX=round(float(np.where(feet)[1].mean()) / n, 5),
                         bodyHeight=round((sole - top) / n, 5))


if __name__ == "__main__":
    cmd, key = sys.argv[1], sys.argv[2]
    if cmd == "rest":
        rest(key)
    elif cmd == "parts":
        register(key); R.parts(key, 1, "show", *sys.argv[3:])
    elif cmd == "make":
        d = register(key)
        R.fit(key, 1, "show")
        (PlazaRig if "plaza" in NPCS[key] else R.Rig)(key, 1, "show").bake()
        meta = json.loads((d / "rig/show/rig.json").read_text(encoding="utf-8"))
        if "stage" in NPCS[key]:
            meta["stage"] = NPCS[key]["stage"]
        if "plaza" in NPCS[key]:
            plaza_anchor(key, meta)
            shrink(key); meta["cell"] = PLAZA_CELL
        (d / "rig/show/rig.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
