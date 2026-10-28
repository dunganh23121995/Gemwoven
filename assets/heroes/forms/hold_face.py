"""Hold a hero's face steady through a looping sheet (showcase or combat idle).

Codex redraws the face a little differently in every frame of a loop (an eye a shade wider, a
smudged cheek), so a resting hero's face flickers. The face of frame 1 (the accepted rest pose) is
laid into every other frame, following the head wherever that frame carries it (found on the hair
and outline around the face), on a soft-edged oval, so breathing and head bobs keep moving.

  python assets/heroes/forms/hold_face.py <hero> <form> [showcase|combat] [action ...]
      eyes and face size come from assets/heroes/head-scale.json; rewrites the sheet in place.
      With action names (showcase sheets such as neckroll, or neckroll:4-7 for those frames only),
      the resting face of the idle loop is laid into each action frame too, found again by size, tilt
      and place; a frame whose face is acted on purpose (eyes shut, head turned away) keeps its own.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[3]


def sheet_path(hero, form, kind):
    if kind == "showcase":
        return ROOT / f"assets/heroes/forms/{hero}/form-{form}/showcase/idle.webp"
    return ROOT / (f"assets/reimagined/heroes/{hero}/idle.webp" if form == "1" else f"assets/heroes/forms/{hero}/form-{form}/idle.webp")


def cells(sheet):
    c = sheet.width // 2
    return c, [sheet.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)) for i in range(sheet.height // c * 2)]


def paste_back(path, size, c, frames):
    result = Image.new("RGBA", size)
    for i, f in enumerate(frames):
        result.paste(f, ((i % 2) * c, (i // 2) * c))
    result.save(path, lossless=True, method=6)
    print("face held:", path.relative_to(ROOT))


MATCH = .62   # least match (normalised correlation) for a frame's face to count as the resting face


def hold_action(hero, form, name, only=None):
    """The idle's resting face is found again in each action frame (template match over size, tilt
    and place) and laid there in place of the face Codex redrew, so the face keeps one drawing while
    the head moves. A frame whose face is acted on purpose (eyes shut, head turned) matches poorly
    and keeps its own."""
    head = json.loads((ROOT / "assets/heroes/head-scale.json").read_text(encoding="utf-8"))["forms"][f"{hero}-{form}"]["showcase"]
    show = ROOT / f"assets/heroes/forms/{hero}/form-{form}/showcase"
    c, idle = cells(Image.open(show / "idle.webp").convert("RGBA"))
    path = show / f"{name}.webp"
    sheet = Image.open(path).convert("RGBA")
    c2, frames = cells(sheet)
    assert c2 == c, "action and idle cells differ in size"
    scale = c / head["cellPx"]
    (ex, ey), span = [v * scale for v in head["eyes"]], (head.get("eyeSpan") or head["headPx"]) * scale
    # The face patch: a soft oval around the eyes, cheeks and mouth, in its own small square.
    half = int(span * 1.7)
    box = (int(ex) - half, int(ey) - half, int(ex) + half, int(ey) + half)
    oval = Image.new("L", (2 * half, 2 * half), 0)
    ImageDraw.Draw(oval).ellipse((half - span * 1.35, half - span * .7, half + span * 1.35, half + span * 1.45), fill=255)
    oval = oval.filter(ImageFilter.GaussianBlur(span * .12))
    patch = idle[0].crop(box)
    gray = lambda im: cv2.cvtColor(np.asarray(im.convert("RGB")), cv2.COLOR_RGB2GRAY)
    out = []
    for i, frame in enumerate(frames):
        area = gray(frame)
        best = None
        for k in np.arange(.96, 1.041, .02):   # the body keeps its size, so does the face
            for ang in range(-10, 11, 2):
                tp = patch.rotate(ang, Image.Resampling.BICUBIC).resize((round(2 * half * k),) * 2, Image.Resampling.BICUBIC)
                tm = oval.rotate(ang, Image.Resampling.BICUBIC).resize(tp.size, Image.Resampling.BICUBIC)
                w = tp.width
                x0, y0 = max(0, int(ex - w / 2) - 40), max(0, int(ey - w / 2) - 40)
                win = area[y0:y0 + w + 80, x0:x0 + w + 80]
                if win.shape[0] < w or win.shape[1] < w:
                    continue
                res = cv2.matchTemplate(win, gray(tp), cv2.TM_CCORR_NORMED if False else cv2.TM_CCOEFF_NORMED, mask=np.asarray(tm))
                res = np.nan_to_num(res, nan=-1, posinf=-1, neginf=-1)
                _, score, _, (mx, my) = cv2.minMaxLoc(res)
                if best is None or score > best[0]:
                    best = (score, k, ang, x0 + mx, y0 + my, tp, tm)
        score, k, ang, x, y, tp, tm = best
        keep = (i + 1) not in only if only else score < MATCH
        print(f"  frame {i + 1}: match {score:.2f} size x{k:.2f} tilt {ang:+d} at {x - box[0]:+d},{y - box[1]:+d}{'  (acted, kept)' if keep else ''}")
        if not keep:
            frame = frame.copy(); frame.paste(tp, (x, y), tm)
        out.append(frame)
    paste_back(path, sheet.size, c, out)


def hold(hero, form, kind="showcase"):
    head = json.loads((ROOT / "assets/heroes/head-scale.json").read_text(encoding="utf-8"))["forms"][f"{hero}-{form}"][kind]
    path = sheet_path(hero, form, kind)
    sheet = Image.open(path).convert("RGBA")
    c = sheet.width // 2
    frames = [sheet.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)) for i in range(sheet.height // c * 2)]
    scale = c / head["cellPx"]
    (ex, ey), span = [v * scale for v in head["eyes"]], (head.get("eyeSpan") or head["headPx"]) * scale
    oval = Image.new("L", (c, c), 0)
    ImageDraw.Draw(oval).ellipse((ex - span * 1.35, ey - span * .7, ex + span * 1.35, ey + span * 1.45), fill=255)
    oval = oval.filter(ImageFilter.GaussianBlur(span * .12))
    # Where the head is: matched on a ring around the face (hair, ears, outline), not the face.
    ring = np.asarray(oval.filter(ImageFilter.MaxFilter(int(span) | 1)), dtype=np.float32) / 255 - np.asarray(oval, dtype=np.float32) / 255 > .3
    rest = np.asarray(frames[0], dtype=np.float32)
    out = [frames[0]]
    for frame in frames[1:]:
        a = np.asarray(frame, dtype=np.float32)
        best = min(((np.abs(np.roll(rest, (dy, dx), (0, 1)) - a)[ring].mean(), dx, dy) for dy in range(-6, 7) for dx in range(-6, 7)))
        _, dx, dy = best
        face = Image.fromarray(np.roll(rest, (dy, dx), (0, 1)).astype("uint8"), "RGBA")
        mask = oval.transform(oval.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy))
        merged = frame.copy(); merged.paste(face, (0, 0), mask)
        out.append(merged)
    result = Image.new("RGBA", sheet.size)
    for i, f in enumerate(out):
        result.paste(f, ((i % 2) * c, (i // 2) * c))
    result.save(path, lossless=True, method=6)
    print("face held:", path.relative_to(ROOT))


if __name__ == "__main__":
    hero, form, kind, *actions = sys.argv[1:] + ["showcase"][len(sys.argv) > 3:]
    for spec in actions:
        # name or name:2,4-6 (only those frames; the others are acted and keep their own face)
        name, _, frames = spec.partition(":")
        only = {n for part in frames.split(",") if part for n in (range(int(part.split("-")[0]), int(part.split("-")[-1]) + 1))}
        hold_action(hero, form, name, only)
    if not actions:
        hold(hero, form, kind)
