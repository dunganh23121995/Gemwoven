"""Package Noct's four-star form, the moon ronin "Dạ Ảnh Kiếm Sĩ" (redrawn 2026-10-30), for runtime.

Sources kept beside each sheet (Codex gpt-6-astra high):
  redesign/concept-d/       the chosen design (and the other concepts shown to the player)
  combat-idle/              master.png (the resting frame, 256 px cell, soles on row 248) and its
                            wind idle (wind_idle.py gen/proc/accept -> form-2/idle.webp)
  action-anchor.png         the master repeated in a 3 x 2 grid of 512 px cells: the scale-and-root
                            template every action sheet was drawn over
  <action>/raw-sheet.png    attack, cast, run and skill (the ultimate's iai poses)
Each action cell is keyed and halved to the 256 px cell (the anchor's own scale, so the body keeps
the idle's size and feet), and the hood top of every frame is found by matching the resting face.
Writes <action>.webp, master.png, portrait.png and form 2 in ../forms.json.

  python assets/heroes/forms/shadow/form-2/build_form2.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]
sys.path.insert(0, str(Path.home() / ".codex/skills/generate2dsprite/scripts"))
from generate2dsprite import remove_bg_magenta  # noqa: E402

ACTIONS = ("attack", "attackLeft", "cast", "run", "skill")   # no hover: he runs, he never floats
# The draw-cut is drawn twice: facing right he turns his back to the viewer (attack-back/, the right
# arm that draws is the near one); facing left the viewer sees his front (attack-front/, drawn facing
# left and stored mirrored, since the runtime mirrors a hero who faces left). attackLeft is picked by
# the runtime whenever he faces left (src/forms-noct.js).
SOURCE = {"attack": ("attack-back", False), "attackLeft": ("attack-front", True)}
CELL = 256
FACE = (130, 88, 182, 126)          # eyes and hood brim on the resting frame (eyes at about 146,108 and 160,111)
PORTRAIT = (104, 50, 204, 150)      # head and shoulders on the resting frame


def gray(img):
    a = np.asarray(img.convert("RGBA")).astype(float)
    lum = a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11
    return lum * a[..., 3] / 255 + 128 * (1 - a[..., 3] / 255)


def hood_top(img):
    a = np.asarray(img)[..., 3] > 128
    ys, xs = np.where(a[:, 100:220])
    y = ys.min()
    return [int(np.median(xs[ys == y])) + 100, int(y)]


def locate_heads(rest, frames):
    x0, y0, x1, y1 = FACE
    patch = gray(rest)[y0:y1, x0:x1]
    h, w = patch.shape
    top = hood_top(rest)
    heads = []
    for frame in frames:
        g = gray(frame)
        best = min(((float(((g[y:y + h, x:x + w] - patch) ** 2).mean()), x, y)
                    for y in range(4, CELL - h - 4) for x in range(8, CELL - w - 8, 2)))
        heads.append([best[1] + top[0] - x0, best[2] + top[1] - y0])
    return heads


def head_scale(rest, frame):
    """How large the hood is drawn in `frame` against the resting frame (template match at scales
    0.8-1.25) and how sure the match is."""
    import cv2
    patch = gray(rest)[56:130, 118:190].astype(np.float32)
    g = gray(frame).astype(np.float32)
    best = (-1.0, 1.0)
    for s in np.arange(.8, 1.26, .01):
        p = cv2.resize(patch, None, fx=s, fy=s)
        best = max(best, (float(cv2.matchTemplate(g, p, cv2.TM_CCOEFF_NORMED).max()), float(s)))
    return best[1], best[0]


def resize_about_feet(frame, k):
    """Scale a frame's drawing by k about the feet (cell centre, 94% height), keeping the cell size."""
    w = frame.width
    big = frame.resize((round(w * k),) * 2, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    out.alpha_composite(big, (round(w / 2 - big.width / 2), round(w * .94 - big.height * .94)))
    return out


def sole_row(frame):
    """Lowest row of the boots: the lowest opaque row with a solid run at least 6% of the cell wide."""
    a = np.asarray(frame)[..., 3] > 128
    rows = np.where(a.sum(1) >= frame.width * .06)[0]
    return int(rows.max()) if len(rows) else None


def to_ground(frame, target):
    """Shift a frame (never scale it) so its soles stand on `target`."""
    got = sole_row(frame)
    if got is None or got == target:
        return frame
    out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    out.alpha_composite(frame, (0, target - got)) if target > got else out.alpha_composite(frame.crop((0, got - target, frame.width, frame.height)), (0, 0))
    return out


# Poses that stand on the ground (the rest are mid-dash or mid-stride and keep their drawn height).
GROUNDED = {"attack": range(6), "attackLeft": range(6), "cast": (0, 1, 2, 4, 5), "skill": range(6)}


def despeckle(img, min_area=40):
    a = np.asarray(img).copy()
    labels, count = ndimage.label(a[..., 3] > 0)
    sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
    for index, area in enumerate(sizes, 1):
        if area < min_area:
            a[labels == index] = 0
    return Image.fromarray(a, "RGBA")


def column(action, index):
    """The sheet column of frame `index`: a mirrored sheet reads its rows right to left."""
    return 2 - index % 3 if SOURCE.get(action, ("", False))[1] else index % 3


def cells(action):
    folder, mirror = SOURCE.get(action, (action, False))
    raw = Image.open(HERE / folder / "raw-sheet.png").convert("RGBA")
    if mirror:   # the whole sheet is mirrored (a blade reaching into the next cell stays whole)
        from PIL import ImageOps
        raw = ImageOps.mirror(raw)
    if raw.size != (1536, 1024):
        raw = raw.resize((1536, 1024), Image.Resampling.LANCZOS)
    clean = remove_bg_magenta(raw, 100, 150)
    (HERE / action).mkdir(exist_ok=True)
    clean.save(HERE / action / "raw-sheet-clean.png")
    out = []
    for index in range(6):
        col, row = column(action, index), index // 3
        cell = clean.crop((col * 512, row * 512, (col + 1) * 512, (row + 1) * 512))
        frame = despeckle(cell.resize((CELL, CELL), Image.Resampling.LANCZOS))
        a = np.asarray(frame)[..., 3]
        if action not in WIDE and (a[0].any() or a[-1].any() or a[:, 0].any() or a[:, -1].any()):
            print("warning:", action, index + 1, "touches the cell edge")
        frame.save(HERE / action / f"{action}-{index + 1}.png")
        out.append(frame)
    return out


# The draw-cut flings the blade far out in front: its frames are cut out by figure (each figure
# with its blade, wherever the blade reaches) into cells 1.5 times as large, the body at the same
# pixel size, and the runtime grows those cells about the feet by the same factor (sprite-runtime.js
# sheet.scale), so the body keeps its size and the blade is never clipped.
NO_SIZE_FIX = {"skill"}
WIDE = {"attack": 1.5, "attackLeft": 1.5}


def wide_cells(action, factor):
    clean = Image.open(HERE / action / "raw-sheet-clean.png").convert("RGBA")
    a = np.asarray(clean)
    labels, count = ndimage.label(a[..., 3] > 0)
    centres = ndimage.center_of_mass(a[..., 3] > 0, labels, range(1, count + 1))
    big = round(512 * factor)
    ox, oy = (big - 512) // 2, round(big * .94 - 512 * .94)   # keep the feet at (50%, 94%)
    out = []
    for index in range(6):
        col, row = column(action, index), index // 3
        canvas = np.zeros((big, big, 4), np.uint8)
        for label, (cy, cx) in enumerate(centres, 1):
            if int(cx // 512) != col or int(cy // 512) != row:
                continue
            ys, xs = np.where(labels == label)
            ty, tx = ys - row * 512 + oy, xs - col * 512 + ox
            keep = (ty >= 0) & (ty < big) & (tx >= 0) & (tx < big)
            canvas[ty[keep], tx[keep]] = a[ys[keep], xs[keep]]
        frame = despeckle(Image.fromarray(canvas, "RGBA").resize((round(CELL * factor),) * 2, Image.Resampling.LANCZOS))
        f = np.asarray(frame)[..., 3]
        if f[0].any() or f[-1].any() or f[:, 0].any() or f[:, -1].any():
            print("warning:", action, index + 1, "touches the wide cell edge")
        out.append(frame)
    return out


def sheet(frames, cols, path):
    rows = len(frames) // cols
    cell = frames[0].width
    out = Image.new("RGBA", (cell * cols, cell * rows), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        out.alpha_composite(frame, ((i % cols) * cell, (i // cols) * cell))
    out.save(path, lossless=True, method=6)


rest = Image.open(HERE / "combat-idle/master.png").convert("RGBA")
rest.save(HERE / "master.png")
rest.crop(PORTRAIT).resize((256, 256), Image.Resampling.LANCZOS).save(HERE / "portrait.png")
catalog_path = HERE.parent / "forms.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
prefix = HERE.relative_to(REPO).as_posix()
idle = catalog["forms"]["2"]["actions"]["idle"]
idle.update(file=f"{prefix}/idle.webp", heads=[hood_top(rest)] * 8)
actions = {"idle": idle}
for action in ACTIONS:
    frames = cells(action)   # heads are found on the 256 px cells (the actor box's own coordinates)
    # Codex draws some poses a little larger or smaller than the rest pose: every frame whose hood
    # is found surely is brought back to the rest pose's hood size, about its feet.
    # Not the ultimate's poses: there his back is turned, the face match reads the hood as smaller and
    # would blow him up (their hood widths already match the rest pose's, 53-56 px against 54).
    fixes = []
    for frame in (frames if action not in NO_SIZE_FIX else []):
        size, sure = head_scale(rest, frame)
        fixes.append(1 / size if sure > .6 and abs(size - 1) >= .03 else 1)
    fixes = fixes or [1] * len(frames)
    frames = [resize_about_feet(f, k) if k != 1 else f for f, k in zip(frames, fixes)]
    ground = sole_row(rest)
    frames = [to_ground(f, ground) if i in GROUNDED.get(action, ()) else f for i, f in enumerate(frames)]
    heads = locate_heads(rest, frames)
    if action in WIDE:
        # The same ground in the larger cell: the box grows about (50%, 94%) by the sheet's scale.
        factor = WIDE[action]
        wide_ground = round((ground / CELL + (factor - 1) * .94) / factor * CELL * factor)
        frames = [resize_about_feet(f, k) if k != 1 else f for f, k in zip(wide_cells(action, factor), fixes)]
        frames = [to_ground(f, wide_ground) if i in GROUNDED.get(action, ()) else f for i, f in enumerate(frames)]
    print(action, "size fixes", [round(k, 3) for k in fixes])
    sheet(frames, 3, HERE / f"{action}.webp")
    actions[action] = {"file": f"{prefix}/{action}.webp", "cols": 3, "rows": 2, "count": 6, "heads": heads,
                       **({"scale": WIDE[action]} if action in WIDE else {}), "footY": 0.94, "frameDuration": 100}
catalog["forms"]["2"] = {"name": "Dạ Ảnh Kiếm Sĩ", "poster": f"{prefix}/master.png", "portrait": f"{prefix}/portrait.png", "actions": actions}
catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("packaged Noct form 2:", ", ".join(actions))
