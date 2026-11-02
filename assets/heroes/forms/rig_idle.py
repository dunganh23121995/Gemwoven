"""Hero idles baked from a weighted mesh rig (the Spine manner of the reference clip): the locked resting
frame of a form is cut into parts by a Codex part map and moved, never redrawn, so nothing boils and the
body keeps one size. One image, one soft mesh for the core (body, head, legs, held weapon) with a heavy
bone hierarchy; the long loose pieces behind it ride their own layer and bend from root to tip.

  python assets/heroes/forms/rig_idle.py parts <hero> <form> <combat|show> [model effort]   Codex draws parts-raw.png
  python assets/heroes/forms/rig_idle.py fit   <hero> <form> <combat|show>                  parts.png + overlay.png
  python assets/heroes/forms/rig_idle.py bake  <hero> <form> <combat|show>                  idle.webp + preview.png
  python assets/heroes/forms/rig_idle.py surge <hero> <form>                                 rig/buff/buff.webp, reuses the combat parts
  python assets/heroes/forms/rig_idle.py all                                                 fit + bake of everything drawn

Output: assets/heroes/forms/<hero>/form-N/rig/<combat|show>/ (rest.png, prompt, parts-raw.png, parts.png, idle.webp, rig.json).
The sheet is COLS x ROWS; frame 1 is the resting frame, so feet, head anchors and the head-scale data still hold.
"""
import json
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
FORMS = ROOT / "assets/heroes/forms"
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fidget  # noqa: E402
import combat_idle  # noqa: E402
import wind_idle  # noqa: E402

MODEL, EFFORT = "gpt-6.1-sol", "low"   # the first rung; climb only when a map fails review
COLS, ROWS, COUNT = 6, 4, 24
CELL = {"combat": 512, "show": 640, "foe": 256}    # one frame's pixels; 6 x 640 stays inside a 4096 texture
ITER = 9                               # fixed-point steps of the warp inversion: the tips of long pieces need them
HEROES = ("novice", "fire", "ice", "earth", "lightning", "shadow")
BG, BODY, HEAD, LEGS, WEAPON, BACK, FRONT = range(7)
PALETTE = {BG: (0, 0, 0), BODY: (255, 255, 255), HEAD: (0, 0, 255), LEGS: (0, 255, 0), WEAPON: (255, 255, 0), BACK: (255, 0, 0), FRONT: (0, 255, 255)}

# Each hero moves by its own nature (T seconds per loop; bob, sway as shares of the body height;
# tilt, grip in degrees; loose = bend of the back pieces in radians; front = sway of the pieces on the body).
STYLE = {
    "novice": dict(T=1.6, bob=.013, sway=.003, tilt=1.0, grip=1.2, loose=.24, front=.09, lag=.9, lean=.8, belts=True),  # eager rookie: a springy bounce, the scarf streams
    "fire": dict(T=1.6, bob=.012, sway=.004, tilt=1.0, grip=1.3, loose=.24, front=.09, lag=.9, lean=.9),       # quick fox: tails and ribbons lively
    "ice": dict(T=2.0, bob=.009, sway=.003, tilt=.7, grip=1.0, loose=.17, front=.08, lag=1.1, open=.03, lean=.6),        # calm: robe and braid drift
    "earth": dict(T=2.2, bob=.012, sway=.002, tilt=.6, grip=.5, loose=.14, front=.06, lag=1.2, lean=.6, planted=True, rests=.6),       # heavy: a slow weighted sink, shield barely moves
    "lightning": dict(T=1.6, bob=.022, sway=.005, tilt=1.1, grip=1.5, loose=.2, front=.09, lag=.8, lean=1.0, fly=True, dangle=2.2),  # floats: legs dangle
    "shadow": dict(T=1.8, bob=.012, sway=.004, tilt=.9, grip=1.1, loose=.2, front=.09, lag=1.0, open=.04, lean=.8, planted=True, rests=.7),        # alert assassin: a light ready sway, the cloak trails it; form 3 leans on its grounded scythe
}
SHARE = {"combat": .7, "show": 1.4, "foe": 1}    # like Hiro: a tight guard in combat, a livelier bounce outside it
FOREIGN = {}                           # sprites that are not heroes: id -> dir, sheet, what, prompt (assets/gemwoven/rig_foes.py)

HINTS = {
    "novice": "RED: the long end of the green scarf, the springy cowlick tuft and any hair strand sticking out. CYAN: the tunic hem, its laces, the belt end, the loose sleeve edges and the scarf knot. YELLOW: the wooden sword only. GREEN: both legs with the boots.",
    "fire": "RED: the fox tail or all the fox tails, the long scarf ends, long ribbons and streaming hair locks, the fox ear tips, long banner cloth hanging from the waist. CYAN: tassels, charms, short skirt panels, hair strands over the face, sleeves' loose edges. YELLOW: the sword or glaive only.",
    "ice": "RED: the rabbit ears, the long braid and long hair, the outer cape or robe tails and their hanging crystal drops. CYAN: sleeve edges, skirt hem, hanging ribbons, fur trim tips, hair strands on the chest. YELLOW: the crescent staff and any fan.",
    "earth": "RED: the green cape or leaf cloak behind him, leaf sprays, hanging vines reaching outside the body. CYAN: the tabard panel hanging in front, belt straps, scarf ends, fur trim tips, hair tufts. YELLOW: the hammer and the shield. BLUE also takes the antlers and leaves on his head.",
    "lightning": "RED: the long blonde hair and ponytail, the coat or cape tails, the witch hat's bent tip, hat ribbons, and any star or spark floating apart from her. CYAN: skirt panels, sleeve edges, belt charms, small pouch straps. YELLOW: the staff and anything fixed to it. GREEN: her dangling legs and boots.",
    "shadow": "RED: the whole torn cloak or coat tail behind him and every ragged strip reaching outside the body. CYAN: scarf ends, hanging belts, tassels, hanging cloth strips on the front of the body. YELLOW: the dagger, katana or scythe. BLUE: the hood and head.",
}

PARTS = """Image 1 is a chibi game character on a black background ({what}). Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face with eyes, nose and mouth, the main hair mass, hood, hat brim and crown, helmet. The face is never any other colour.
- pure WHITE #FFFFFF: torso, chest armour, shoulders, arms and hands.
- pure GREEN #00FF00: both legs from the hip down, with the boots.
- pure YELLOW #FFFF00: the held weapon or staff or shield, without the hand.
- pure RED #FF0000: long loose pieces that lie behind the body or stick out of it and move freely.
- pure CYAN #00FFFF: small loose pieces lying on top of the body.
For this character: {hint}
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""


def rig_dir(hero, form, ctx):
    if hero in FOREIGN:
        return FOREIGN[hero]["dir"] / "rig" / ctx
    return FORMS / hero / f"form-{form}/rig/{ctx}"


def source_sheet(hero, form, ctx):
    if hero in FOREIGN:
        return FOREIGN[hero]["sheet"]
    return combat_idle.paths(hero, str(form))[2] if ctx == "combat" else FORMS / hero / f"form-{form}/showcase/idle.webp"


def what(hero, form, ctx):
    if hero in FOREIGN:
        return FOREIGN[hero]["what"]
    if ctx == "combat":
        return wind_idle.what(hero, str(form))
    path = FORMS / hero / f"form-{form}/showcase/prompt-idle.txt"
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    found = re.search(r"reference \((.*?)\)\. Image 2", text, re.S) or re.search(r"reference: (.*?)\.?\nImage 2", text, re.S)
    return found.group(1) if found else wind_idle.what(hero, str(form))


def rest_frame(hero, form, ctx):
    """The first frame of the approved loop at the rig's cell size (LANCZOS only: same drawing, same framing)."""
    sheet = Image.open(source_sheet(hero, form, ctx)).convert("RGBA")
    c = sheet.width // 2
    cell = sheet.crop((0, 0, c, c))
    n = CELL[ctx]
    if c == n:
        return cell
    a = np.asarray(cell, dtype=np.float32) / 255
    a = np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
    a = cv2.resize(a, (n, n), interpolation=cv2.INTER_LANCZOS4 if n > c else cv2.INTER_AREA)
    a = a.clip(0, 1); k = a[..., 3:]
    a = np.concatenate([np.where(k > 1e-4, a[..., :3] / np.maximum(k, 1e-4), 0), k], -1)
    return Image.fromarray((a.clip(0, 1) * 255 + .5).astype("uint8"), "RGBA")


def parts(hero, form, ctx, model=MODEL, effort=EFFORT):
    work = rig_dir(hero, form, ctx); work.mkdir(parents=True, exist_ok=True)
    # a resting frame already there may be a sharper redraw (sharpen_form1.py): keep it
    rest = Image.open(work / "rest.png").convert("RGBA") if (work / "rest.png").exists() else rest_frame(hero, form, ctx)
    rest.save(work / "rest.png")
    grey = np.asarray(rest)[..., :3].mean() < 28 if hero in FOREIGN else hero == "shadow"
    ground = (205, 205, 205, 255) if grey else (0, 0, 0, 255)   # Noct's black would melt into black
    canvas = Image.new("RGBA", rest.size, ground); canvas.alpha_composite(rest)
    canvas.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(work / "parts-ref.png")
    (work / "parts-prompt.txt").write_text(FOREIGN.get(hero, {}).get("prompt", PARTS).format(what=what(hero, form, ctx), hint=HINTS.get(hero, "")) + "\n", encoding="utf-8")
    fidget.run(fidget.GEN, "--prompt-file", work / "parts-prompt.txt", "--out", work / "parts-raw.png", "--ref", work / "parts-ref.png",
               "--model", model, "--effort", effort, "--timeout", "900")


def classify(raw):
    keys = sorted(PALETTE)
    pal = np.array([PALETTE[k] for k in keys], dtype=np.float32)
    d = ((raw[..., None, :] - pal[None, None]) ** 2).sum(-1)
    return np.array(keys, dtype=np.uint8)[d.argmin(-1)]


def fit(hero, form, ctx):
    """Lay the part map over the resting frame (Codex keeps the pose but may shift or scale it a little),
    then give every opaque pixel the label of the nearest coloured one."""
    work = rig_dir(hero, form, ctx)
    rest = np.asarray(Image.open(work / "rest.png").convert("RGBA"))
    n = rest.shape[0]
    body = rest[..., 3] > 127
    raw = np.asarray(Image.open(work / "parts-raw.png").convert("RGB").resize((n, n), Image.Resampling.BICUBIC), dtype=np.float32)
    lab = classify(raw); lab = ndimage.median_filter(lab, 3)
    shape = lab > 0
    if not shape.any():
        raise SystemExit("empty part map")
    ys, xs = np.where(shape); my, mx = np.where(body)
    best = None
    small = 4
    bs = cv2.resize(body.astype(np.uint8), (n // small, n // small), interpolation=cv2.INTER_NEAREST).astype(bool)
    small_shape = cv2.resize(shape.astype(np.uint8), (n // small, n // small), interpolation=cv2.INTER_NEAREST)
    for s in np.linspace(.92, 1.08, 17):
        M0 = np.float32([[s, 0, 0], [0, s, 0]])
        cx, cy = (xs.min() + xs.max()) / 2, ys.max()
        tx = (mx.min() + mx.max()) / 2 - cx * s; ty = my.max() - cy * s
        for dy in range(-16, 17, 4):
            for dx in range(-16, 17, 4):
                M = M0.copy(); M[0, 2] = tx + dx; M[1, 2] = ty + dy
                ms = M.copy(); ms[:, 2] /= small
                w = cv2.warpAffine(small_shape, ms, (n // small, n // small), flags=cv2.INTER_NEAREST).astype(bool)
                iou = (w & bs).sum() / max(1, (w | bs).sum())
                if best is None or iou > best[0]:
                    best = (iou, M)
    iou, M = best
    warped = cv2.warpAffine(lab, M, (n, n), flags=cv2.INTER_NEAREST)
    known = warped > 0
    idx = ndimage.distance_transform_edt(~known, return_distances=False, return_indices=True)
    full = warped[tuple(idx)]
    full[rest[..., 3] < 8] = BG
    out = np.zeros((n, n, 3), np.uint8)
    for k, c in PALETTE.items():
        out[full == k] = c
    Image.fromarray(out).save(work / "parts.png")
    tint = rest[..., :3].astype(np.float32).copy()
    for k, c in PALETTE.items():
        if k:
            tint[full == k] = tint[full == k] * .55 + np.float32(c) * .45
    base = np.full((n, n, 3), 40, np.float32); a = rest[..., 3:].astype(np.float32) / 255
    Image.fromarray((base * (1 - a) + tint * a).astype("uint8")).save(work / "overlay.png")
    counts = {name: int((full == k).sum()) for name, k in [("body", BODY), ("head", HEAD), ("legs", LEGS), ("weapon", WEAPON), ("back", BACK), ("front", FRONT)]}
    print(f"{hero}-{form} {ctx}: fit IoU {iou:.3f} {counts}")
    return iou


def geodesic(mask, seeds, step=2):
    """Steps from the seeds inside the mask (half resolution: long tails, cheap)."""
    m = cv2.resize(mask.astype(np.uint8), None, fx=1 / step, fy=1 / step, interpolation=cv2.INTER_NEAREST).astype(bool)
    s = cv2.resize(seeds.astype(np.uint8), None, fx=1 / step, fy=1 / step, interpolation=cv2.INTER_NEAREST).astype(bool) & m
    dist = np.full(m.shape, -1, np.int32); dist[s] = 0
    kernel = ndimage.generate_binary_structure(2, 2)
    front = s; i = 0
    while front.any():
        i += 1
        front = ndimage.binary_dilation(front, kernel) & m & (dist < 0)
        dist[front] = i
    dist[dist < 0] = max(i, 1)
    return cv2.resize(dist.astype(np.float32), mask.shape[::-1], interpolation=cv2.INTER_LINEAR)


def spread(values, mask, n):
    """Extend a map defined on a piece over the whole canvas with no steps (coarse to fine): the warp is
    inverted where a pixel lands, often outside the piece, and a step there scatters crumbs of colour."""
    m = mask.astype(np.float32); v = np.float32(values) * m
    out = None
    sigma = n / 4
    while sigma >= max(2.5, n * .011):
        weight = cv2.GaussianBlur(m, (0, 0), sigma)
        est = cv2.GaussianBlur(v, (0, 0), sigma) / np.maximum(weight, 1e-5)
        out = est if out is None else out + (est - out) * np.clip(weight * 3, 0, 1)
        sigma /= 2
    return out


class Chain:
    """One loose back piece: pinned along where it meets the body, free at the tip."""
    def __init__(self, mask, core_labels, phase, n):
        self.mask = mask
        near = ndimage.binary_dilation(core_labels > 0, iterations=3) & mask
        self.attached = near.sum() >= 6
        ys, xs = np.where(mask)
        self.area = len(ys)
        if self.attached:
            self.reach = geodesic(mask, near)
            self.length = max(1., float(np.percentile(self.reach[mask], 98)) * 2)
            self.reach = np.clip(self.reach * 2 / self.length, 0, 1)
            ny, nx = np.where(near)
            self.root = (float(nx.mean()), float(ny.mean()))
            around = core_labels[ndimage.binary_dilation(mask, iterations=4) & (core_labels > 0)]
            self.parent = HEAD if (around == HEAD).sum() > .5 * max(1, len(around)) else BODY
        else:
            self.reach = np.ones_like(mask, np.float32); self.length = 0.
            self.root = (float(xs.mean()), float(ys.mean())); self.parent = None
        self.phase = phase


def bone(angle, pivot, xx, yy):
    c, s = math.cos(angle), math.sin(angle)
    x, y = xx - pivot[0], yy - pivot[1]
    return (c - 1) * x - s * y, s * x + (c - 1) * y


def wave(t, shift):
    """Starts at 0 on frame 1 whatever the phase, so frame 1 stays the resting pose."""
    w = 2 * np.pi * t
    a = np.sin(w - shift) - np.sin(-shift)
    b = np.sin(2 * w - 1.7 * shift + .6) - np.sin(-1.7 * shift + .6)
    return a + .22 * b


class Rig:
    plant_all = False      # a grounded prop stays put whatever the hero's style

    def __init__(self, hero, form, ctx):
        self.hero, self.form, self.ctx = hero, form, ctx
        work = rig_dir(hero, form, ctx); self.work = work
        im = np.asarray(Image.open(work / "rest.png").convert("RGBA"), dtype=np.float32) / 255
        self.n = n = im.shape[0]
        self.rest = im
        self.labels = classify(np.asarray(Image.open(work / "parts.png").convert("RGB"), dtype=np.float32))
        self.style = dict(STYLE[hero]); share = SHARE[ctx]
        self.out, self.sheet_name, self.T = work, "idle.webp", self.style["T"]
        for k in ("bob", "sway", "tilt", "lean"):
            self.style[k] = self.style.get(k, 0) * share
        alpha = im[..., 3] > .5
        ys = np.where(alpha.any(axis=1))[0]
        self.top, self.sole = int(ys.min()), int(ys.max())
        self.height = self.sole - self.top
        self.yy, self.xx = np.mgrid[:n, :n].astype(np.float32)
        self.prepare()

    def weights(self):
        """Soft bone weights of the core: every pixel of the canvas has one, so the mesh never tears."""
        core = self.labels.copy()
        core[core == BACK] = 0; core[core == FRONT] = BODY
        known = core > 0
        idx = ndimage.distance_transform_edt(~known, return_distances=False, return_indices=True)
        filled = core[tuple(idx)]
        sigma = max(1.2, self.n * .007)
        w = {k: cv2.GaussianBlur((filled == k).astype(np.float32), (0, 0), sigma) for k in (BODY, HEAD, LEGS, WEAPON)}
        total = sum(w.values()) + 1e-6
        return {k: v / total for k, v in w.items()}, core

    def prepare(self):
        n = self.n
        self.w, core = self.weights()
        self.head_pivot = self.pivot_of(HEAD, BODY)
        self.grips = self.weapon_grips()
        legs = self.labels == LEGS
        if legs.any():
            self.hip = float(np.percentile(np.where(legs)[0], 3))
            self.leg_cx = float(np.where(legs)[1].mean())
        else:
            self.hip, self.leg_cx = self.sole - self.height * .26, n / 2
        # how much of the body's lift a row carries: all of it above the hips, none on the soles
        span = max(4., self.sole - self.hip)
        carry = np.clip((self.sole - span * .1 - self.yy) / (span * .82), 0, 1)
        self.carry = carry * carry * (3 - 2 * carry)
        # what is held never stretches with the row it lies on: a piece moves as its hand moves (one carry for
        # all of it), and a heavy prop resting on the ground (planted) does not move at all
        self.anchor = np.zeros((n, n), np.float32)
        for mask in self.props:
            soft = cv2.GaussianBlur(ndimage.binary_dilation(mask, iterations=max(2, n // 128)).astype(np.float32), (0, 0), max(1., n * .003))
            grounded = np.where(mask)[0].max() >= self.sole - self.height * .05
            if grounded and (self.style.get("planted") or self.plant_all):
                self.anchor = np.maximum(self.anchor, soft)
            elif not grounded:
                touch = mask & ndimage.binary_dilation(self.labels == BODY, iterations=3)
                self.carry = self.carry * (1 - soft) + soft * float(self.carry[touch if touch.sum() >= 5 else mask].mean())
        if self.anchor.max() > .5 and self.style.get("rests"):      # leaning on it: the body sinks less, so the hands stay on it
            for k in ("bob", "sway", "lean"):
                self.style[k] *= self.style["rests"]
        self.knee = np.sin(np.pi * np.clip((self.yy - self.hip) / span, 0, 1)) * np.sign(self.xx - self.leg_cx) * np.clip(np.abs(self.xx - self.leg_cx) / (n * .03), 0, 1)
        # the small loose pieces on the body
        front = self.labels == FRONT
        lab, count = ndimage.label(ndimage.binary_dilation(front, iterations=max(1, n // 256)))
        self.front = []
        for k, sl in enumerate(ndimage.find_objects(lab)):
            y0, y1 = sl[0].start, sl[0].stop
            if y1 - y0 < n * .02 or (self.style.get("belts") and sl[1].stop - sl[1].start > 2.5 * (y1 - y0)):
                continue
            here = cv2.GaussianBlur((lab == k + 1).astype(np.float32), (0, 0), max(1., n * .003))
            reach = np.clip((self.yy - y0) / (y1 - y0), 0, 1) ** 1.3
            amp = min(n * .018, max(n * .006, (y1 - y0) * self.style["front"]))
            self.front.append((here, reach, amp, .3 + (k % 3) * .4))
        # the back pieces: each cut out on its own layer, its colours bled under the core so a moved piece
        # shows no gap; thin strands stay with the piece they hang from
        self.tidy()
        whole = self.labels == BACK
        lab, count = ndimage.label(ndimage.binary_propagation(ndimage.binary_opening(whole, iterations=1), mask=whole, structure=np.ones((3, 3))))
        coreish = (self.labels > 0) & (self.labels != BACK)
        self.chains = []
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, count + 1)) if count else []
        keep = np.zeros_like(whole)
        for rank, i in enumerate(np.argsort(sizes)[::-1]):
            if sizes[i] < (n * .012) ** 2:
                continue
            mask = lab == i + 1
            keep |= mask
            self.chains.append(Chain(mask, np.where(coreish, self.labels, 0), math.pi / 2 + .5 + (rank % 3) * .45, n))
        rest = self.rest
        pm = np.concatenate([rest[..., :3] * rest[..., 3:], rest[..., 3:]], -1)
        if not self.chains:
            self.core = pm
            return
        ids = np.zeros((n, n), np.int32)
        for i, c in enumerate(self.chains):
            ids[c.mask] = i + 1
        # crumbs of a loose piece go with the nearest piece: left in the core they would stay behind as it swings
        crumbs, far = whole & (ids == 0), ndimage.distance_transform_edt(ids == 0, return_indices=True)
        ties = crumbs & (far[0] < n * .03)
        ids[ties] = ids[tuple(far[1])][ties]
        for i, c in enumerate(self.chains):
            grown = ids == i + 1
            near = ndimage.distance_transform_edt(~c.mask, return_distances=False, return_indices=True)
            c.reach = np.where(c.mask, c.reach, c.reach[tuple(near)]) * grown   # a crumb sits as far along as the piece beside it
            c.mask = grown
        keep = ids > 0
        owner = ids[tuple(ndimage.distance_transform_edt(ids == 0, return_distances=False, return_indices=True))]
        cut = cv2.GaussianBlur(ndimage.binary_dilation(keep, iterations=1).astype(np.float32), (0, 0), .7)[..., None]
        self.core = pm * (1 - cut)
        solid = keep & (rest[..., 3] > .95)    # faint edge pixels still hold the chroma key
        bled = rest[..., :3][tuple(ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True))]
        # where the cut is soft the layer holds exactly what the core gave up, so core over layer is the rest pose
        layer = pm * cut / np.maximum(1 - rest[..., 3:] * (1 - cut), 1e-4)
        under = (self.labels > 0) & ~keep & ndimage.binary_dilation(keep, iterations=int(n * .05)) & (rest[..., 3] > .98) & (cut[..., 0] < .002)
        layer[under] = np.concatenate([bled[under], np.ones((under.sum(), 1), np.float32)], -1)
        for i, c in enumerate(self.chains):
            c.layer = layer * (owner == i + 1)[..., None]
            c.reach_full = spread(c.reach, c.mask, n) if c.attached else np.ones((n, n), np.float32)
            ys, xs = np.where(c.mask)
            heading = math.atan2(ys.mean() - c.root[1], xs.mean() - c.root[0])
            turn = np.arctan2(self.yy - c.root[1], self.xx - c.root[0]) - heading
            c.alpha = np.arctan2(np.sin(turn), np.cos(turn))   # measured from the piece's own direction: its cut lies behind the root

    def tidy(self):
        """Thin slivers along a loose piece that the map gave to the core belong to the piece (a ragged
        edge, a stray hair); so does any scrap of the drawing that is not joined to the body."""
        n, labels = self.n, self.labels
        soft = np.isin(labels, (BODY, HEAD, LEGS, FRONT))
        solid = ndimage.binary_opening(soft, iterations=max(2, n // 160))
        lab, count = ndimage.label(soft & ~solid)
        back = labels == BACK
        for k, sl in enumerate(ndimage.find_objects(lab)):
            y0, y1 = max(0, sl[0].start - 3), sl[0].stop + 3
            x0, x1 = max(0, sl[1].start - 3), sl[1].stop + 3
            piece = lab[y0:y1, x0:x1] == k + 1
            ring = ndimage.binary_dilation(piece, iterations=2) & ~piece
            if back[y0:y1, x0:x1][ring].sum() >= solid[y0:y1, x0:x1][ring].sum():
                labels[y0:y1, x0:x1][piece] = BACK
        ink, count = ndimage.label(labels > 0)
        if count > 1:
            sizes = ndimage.sum(np.ones_like(ink), ink, range(1, count + 1))
            scraps = np.isin(ink, 1 + np.where(sizes < (n * .03) ** 2)[0]) & (labels != WEAPON)
            labels[scraps] = BACK

    def pivot_of(self, part, other):
        a = self.labels == part
        if not a.any():
            return (self.n / 2., self.top + self.height * .3)
        touch = a & ndimage.binary_dilation(self.labels == other, iterations=3)
        if touch.sum() < 5:
            ys, xs = np.where(a); return (float(xs.mean()), float(ys.max()))
        ys, xs = np.where(touch); return (float(xs.mean()), float(ys.mean()))

    def weapon_grips(self):
        lab, count = ndimage.label(ndimage.binary_dilation(self.labels == WEAPON, iterations=1))
        grips = []
        self.props = []
        for k in range(1, count + 1):
            mask = lab == k
            if mask.sum() < (self.n * .02) ** 2:
                continue
            self.props.append(mask)
            touch = mask & ndimage.binary_dilation(self.labels == BODY, iterations=3)
            ys, xs = np.where(touch if touch.sum() >= 5 else mask)
            if np.where(mask)[0].max() >= self.sole - self.height * .05 and not self.style.get("fly"):
                continue
            grips.append((mask, (float(xs.mean()), float(ys.mean())), len(grips)))
        return grips

    def body_move(self, t):
        s = self.style
        bob = s["bob"] * self.height
        return (s["sway"] * self.height * math.sin(2 * math.pi * t),
                bob * (1 - math.cos(2 * math.pi * t)) / 2)

    def core_field(self, t):
        s, w = self.style, self.w
        sx, by = self.body_move(t)
        lag = s["lag"]
        late = (t - lag / (2 * math.pi)) % 1
        sx2, by2 = self.body_move(late)
        sx0, by0 = self.body_move(1 - lag / (2 * math.pi))
        fly = s.get("fly")
        carry = 1 if fly else self.carry
        dx = sx * carry * np.ones_like(self.xx); dy = by * carry * np.ones_like(self.xx)
        # the weight shifts first: everything above the hips leans as one rigid piece about them (never a stretch)
        lean = bone(math.radians(s.get("lean", 0)) * wave(t, 0) / 2, (self.leg_cx, self.hip), self.xx, self.yy)
        dx += lean[0] * carry; dy += lean[1] * carry
        if not fly:
            dx += self.knee * by * .35 * w[LEGS]
        else:
            dy += w[LEGS] * (by2 - by0 - by) * .5 * np.clip((self.yy - self.hip) / max(1., self.sole - self.hip), 0, 1)
            lx, ly = bone(math.radians(s["dangle"]) * wave(t, lag * 1.5) / 2, (self.leg_cx, self.hip), self.xx, self.yy)
            dx += w[LEGS] * lx; dy += w[LEGS] * ly
        # the head follows the body a beat late, nods a little
        tilt = math.radians(s["tilt"]) * wave(t, lag) / 2
        hx, hy = bone(tilt, self.head_pivot, self.xx, self.yy)
        dx += w[HEAD] * (hx + (sx2 - sx0 - sx) * .6)
        dy += w[HEAD] * (hy + (by2 - by0 - by) * .6)
        # what is held swings about the hand
        for mask, grip, k in self.grips:
            soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), max(1., self.n * .004)) * w[WEAPON]
            ang = math.radians(s["grip"]) * wave(t, lag * 1.4 + k * .9) / 2
            ax, ay = bone(ang, grip, self.xx, self.yy)
            dx += soft * ax; dy += soft * ay
        for here, reach, amp, shift in self.front:
            ph = 2 * np.pi * t - 2.2 * reach - shift
            sway = (np.cos(-2.2 * reach - shift) - np.cos(ph)) / 2
            dx -= here * amp * reach * sway
            dy -= here * .25 * amp * reach * sway
        return dx * (1 - self.anchor), dy * (1 - self.anchor)

    def chain_field(self, c, t, core):
        n, s = self.n, self.style
        if not c.attached:          # a star or spark floating apart: it drifts on its own beat
            bx, by = self.body_move((t + c.phase) % 1)
            bx0, by0 = self.body_move(c.phase % 1)
            return np.full((n, n), bx - bx0, np.float32), np.full((n, n), (by - by0) * 1.6, np.float32)
        r = c.reach_full
        A = s["loose"] * min(1.5, max(.75, math.sqrt(n * .25 / max(1., c.length))))
        shift = c.phase + 2.3 * r + .9 * c.alpha
        w = 2 * np.pi * t
        sw = (np.sin(w - shift) - np.sin(-shift)) + .22 * (np.sin(2 * w - 1.7 * shift) - np.sin(-1.7 * shift))
        ang = A * r ** 1.15 * sw * .5
        xr, yr = self.xx - c.root[0], self.yy - c.root[1]
        puff = 1 + s.get("open", 0) * r * (1 - np.cos(w - shift + c.phase)) / 2 - s.get("open", 0) * r * (1 - np.cos(-shift + c.phase)) / 2
        xr0, yr0 = xr, yr
        xr, yr = xr * puff, yr * puff
        ca, sa = np.cos(ang), np.sin(ang)
        rx, ry = int(min(n - 1, max(0, c.root[0]))), int(min(n - 1, max(0, c.root[1])))
        return (ca * xr - sa * yr - xr0 + core[0][ry, rx]).astype(np.float32), (sa * xr + ca * yr - yr0 + core[1][ry, rx]).astype(np.float32)

    def warp(self, pm, field):
        dx, dy = field
        ux, uy = self.xx.copy(), self.yy.copy()
        for _ in range(ITER):
            ux = self.xx - cv2.remap(dx, ux, uy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            uy = self.yy - cv2.remap(dy, ux, uy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return cv2.remap(pm, ux, uy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT).clip(0, 1)

    def frame(self, t):
        core = self.core_field(t)
        out = self.warp(self.core, core)
        for c in self.chains:      # the largest piece is nearest the core, the small ones behind it
            piece = self.warp(c.layer, self.chain_field(c, t, core))
            out = out + piece * (1 - out[..., 3:])
        return out

    def time(self, i):
        return i / COUNT

    def bake(self):
        n, work = self.n, self.out
        sheet = np.zeros((n * ROWS, n * COLS, 4), np.float32)
        edge = 0.
        for i in range(COUNT):
            pm = self.frame(self.time(i))
            edge = max(edge, float(max(pm[:2, :, 3].max(), pm[-2:, :, 3].max(), pm[:, :2, 3].max(), pm[:, -2:, 3].max())))
            sheet[(i // COLS) * n:(i // COLS + 1) * n, (i % COLS) * n:(i % COLS + 1) * n] = pm
        k = sheet[..., 3:]
        rgba = np.concatenate([np.where(k > 1e-4, sheet[..., :3] / np.maximum(k, 1e-4), 0), k], -1)
        img = Image.fromarray((rgba.clip(0, 1) * 255 + .5).astype("uint8"), "RGBA")
        quality, alpha_quality = self.style.get("webp", (93, 100))
        img.save(work / self.sheet_name, quality=quality, alpha_quality=alpha_quality, method=6)
        strip = Image.new("RGB", (256 * 8, 256), (58, 84, 62))
        for j, i in enumerate(range(0, COUNT, 3)):
            cell = img.crop(((i % COLS) * n, (i // COLS) * n, (i % COLS + 1) * n, (i // COLS + 1) * n)).resize((256, 256), Image.Resampling.LANCZOS)
            strip.paste(cell, (j * 256, 0), cell)
        strip.save(work / "preview.png")
        frames_ms = round(self.T * 1000 / COUNT)
        (work / "rig.json").write_text(json.dumps({"cols": COLS, "rows": ROWS, "count": COUNT, "frameDuration": frames_ms, "cell": n}, indent=1) + "\n", encoding="utf-8")
        print(f"{self.hero}-{self.form} {self.ctx}: {(work / self.sheet_name).stat().st_size // 1024} KB, {frames_ms} ms, {len(self.chains)} chains, {len(self.front)} front, edge alpha {edge:.2f}")
        return edge


def ramp(t, a, b):
    x = np.clip((t - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


class Surge(Rig):
    """Taking a buff, once, from the resting pose back to it: the weight dips, the chest opens and everything loose
    lifts on the rush. No pose changes hands, so the combat part map serves and the idle joins it without a jump.
    The feet stay on the ground, so the body never rises above rest here: combat lifts the whole sprite (combat-v3.js
    buff). That sequence lasts about .8 of the 1.3 s sheet, so the motion is over by then. Heroes face right in combat,
    foes left (style face=-1)."""
    FLARE, LEAN, NOD, DIP = .3, 3.2, 3., .016
    plant_all = True       # the lean is stronger than any idle's: a staff on the ground would stretch with the rows

    def __init__(self, hero, form):
        super().__init__(hero, form, "foe" if hero in FOREIGN else "combat")
        self.out, self.sheet_name, self.T = self.work.parent / "buff", "buff.webp", 1.3
        self.out.mkdir(exist_ok=True)
        for c in self.chains:
            if c.attached:
                tip = float(self.xx[c.reach_full > .8].mean()) if (c.reach_full > .8).any() else c.root[0]
                c.lift = 1. if (tip - c.root[0] or tip - self.leg_cx) < 0 else -1.
                # a wide cape pinned along a long seam tears if it swings like a scarf, and nothing may reach the cell's edge
                c.give = min(1.4, max(.35, (self.n * .22 / math.sqrt(c.area)) ** 1.2))
                if self.anchor.max() > .5:      # braced on a grounded prop: what hangs from it stirs, it does not fly
                    c.give *= self.style.get("rests") or .7
                ys, xs = np.where(c.mask)
                for _ in range(10):
                    a = c.reach_full[ys, xs] ** 1.15 * c.lift * self.FLARE * c.give * 1.25
                    x, y = (xs - c.root[0]) * 1.05, (ys - c.root[1]) * 1.05
                    x, y = c.root[0] + np.cos(a) * x - np.sin(a) * y, c.root[1] + np.sin(a) * x + np.cos(a) * y
                    if min(x.min(), y.min()) >= 6 and max(x.max(), y.max()) < self.n - 6:
                        break
                    c.give *= .8

    def time(self, i):
        return i / (COUNT - 1)

    @staticmethod
    def rush(t):
        return ramp(t, .08, .3) * (1 - ramp(t, .46, .78))

    @staticmethod
    def dip(t):
        return ramp(t, 0, .1) * (1 - ramp(t, .1, .26)) + .5 * ramp(t, .6, .7) * (1 - ramp(t, .7, .8))

    def core_field(self, t):
        s, w = self.style, self.w
        e = float(self.rush(t))
        leaning = (s.get("rests") or .7) if self.anchor.max() > .5 else 1    # the hands stay on what is planted
        by = self.DIP * self.height * float(self.dip(t)) * leaning
        fly = s.get("fly")
        carry = 1 if fly else self.carry
        dy = by * carry; dx = self.knee * by * .35 * w[LEGS] * (0 if fly else 1)
        face = s.get("face", 1)
        lean = bone(-face * math.radians(self.LEAN) * e * leaning, (self.leg_cx, self.hip), self.xx, self.yy)
        dx = dx + lean[0] * carry; dy = dy + lean[1] * carry
        if fly:                  # no ground to hold them: the legs swing out on the rush
            lx, ly = bone(math.radians(s["dangle"]) * 1.6 * float(self.rush(t - .05)), (self.leg_cx, self.hip), self.xx, self.yy)
            dx += w[LEGS] * lx; dy += w[LEGS] * ly
        hx, hy = bone(-face * math.radians(self.NOD) * float(self.rush(t - .05)), self.head_pivot, self.xx, self.yy)
        dx += w[HEAD] * hx; dy += w[HEAD] * hy
        for mask, grip, k in self.grips:
            soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), max(1., self.n * .004)) * w[WEAPON]
            ax, ay = bone(-face * math.radians(s["grip"]) * 2 * e, grip, self.xx, self.yy)
            dx += soft * ax; dy += soft * ay
        for here, reach, amp, shift in self.front:
            late = self.rush(t - .05 * reach)
            flick = np.sin(2 * np.pi * 3 * t - 2.2 * reach - shift)
            dx -= here * amp * reach * late * flick * 1.4
            dy -= here * amp * reach * late * .8
        return dx * (1 - self.anchor), dy * (1 - self.anchor)

    def chain_field(self, c, t, core):
        n, s = self.n, self.style
        if not c.attached:
            return np.zeros((n, n), np.float32), np.full((n, n), -n * 1.25 * self.DIP * float(self.rush(t)), np.float32)
        r = c.reach_full
        E = self.rush(t - .06 * r)
        A = s["loose"] * min(1.5, max(.75, math.sqrt(n * .25 / max(1., c.length))))
        flick = np.sin(2 * np.pi * 3.2 * t - 2.6 * r - c.phase)
        ang = r ** 1.15 * E * (c.lift * self.FLARE * c.give + A * .4 * min(1, c.give) * flick)
        xr0, yr0 = self.xx - c.root[0], self.yy - c.root[1]
        puff = 1 + .05 * r * E * self.FLARE / .3
        xr, yr = xr0 * puff, yr0 * puff
        ca, sa = np.cos(ang), np.sin(ang)
        rx, ry = int(min(n - 1, max(0, c.root[0]))), int(min(n - 1, max(0, c.root[1])))
        return (ca * xr - sa * yr - xr0 + core[0][ry, rx]).astype(np.float32), (sa * xr + ca * yr - yr0 + core[1][ry, rx]).astype(np.float32)


def bake(hero, form, ctx):
    Rig(hero, form, ctx).bake()


def surge(hero, form):
    Surge(hero, form).bake()


def everything():
    for hero in HEROES:
        for form in (1, 2, 3):
            for ctx in ("combat", "show"):
                if (rig_dir(hero, form, ctx) / "parts-raw.png").exists():
                    fit(hero, form, ctx); bake(hero, form, ctx)
            if (rig_dir(hero, form, "combat") / "parts-raw.png").exists():
                surge(hero, form)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "all":
        everything()
    else:
        if cmd == "surge":
            surge(sys.argv[2], int(sys.argv[3]))
            sys.exit()
        hero, form, ctx, *rest = sys.argv[2:]
        {"parts": parts, "fit": fit, "bake": bake}[cmd](hero, int(form), ctx, *rest)
