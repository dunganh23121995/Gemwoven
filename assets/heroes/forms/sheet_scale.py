"""Does a hero keep one size through every combat action? Measured by the face.

The resting face of the combat idle (eyes and size from assets/heroes/head-scale.json) is searched
for in every frame of every combat sheet of that form, as it is shown in combat (cell scaled to the
256 px actor box, grown by the sheet's `scale`), over sizes and small tilts. A sheet whose face
shows larger or smaller than the idle's makes the hero swell or shrink when the action starts.

  python assets/heroes/forms/sheet_scale.py [hero ...]           report: face size per sheet against the idle
  python assets/heroes/forms/sheet_scale.py fix <hero> <form>    set each form-2/3 sheet's scale (forms.json) so its face matches
"""
import json
import statistics
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
HEROES = ["fire", "ice", "earth", "lightning"]
GOOD = .55   # least match for a frame to count (a turned or hidden face matches poorly)


def sheets(hero, form):
    if form == "1":
        out = {}
        for meta in sorted((ROOT / f"assets/reimagined/heroes/{hero}").glob("*/runtime-meta.json")):
            m = json.loads(meta.read_text(encoding="utf-8"))
            atlas = meta.parent.parent / m.get("atlas", meta.parent.name + ".webp")
            if atlas.exists():
                out[meta.parent.name] = {"file": atlas, "cols": m.get("columns") or m.get("cols"), "rows": m["rows"], "count": m.get("frames") or m.get("count"), "scale": m.get("scale", 1)}
        return out
    book = json.loads((ROOT / f"assets/heroes/forms/{hero}/forms.json").read_text(encoding="utf-8"))["forms"][form]["actions"]
    return {name: {**s, "file": ROOT / s["file"]} for name, s in book.items()}


def frames(sheet):
    im = Image.open(sheet["file"]).convert("RGBA")
    c = im.width // sheet["cols"]
    k = 256 / c * sheet.get("scale", 1)
    for i in range(sheet["count"]):
        f = im.crop(((i % sheet["cols"]) * c, (i // sheet["cols"]) * c, (i % sheet["cols"] + 1) * c, (i // sheet["cols"] + 1) * c))
        yield f.resize((max(1, round(c * k)),) * 2, Image.Resampling.LANCZOS)


def gray(im):
    flat = Image.new("RGBA", im.size, (70, 70, 80, 255)); flat.alpha_composite(im)
    return cv2.cvtColor(np.asarray(flat.convert("RGB")), cv2.COLOR_RGB2GRAY)


def face_template(hero, form, idle):
    head = json.loads((ROOT / "assets/heroes/head-scale.json").read_text(encoding="utf-8"))["forms"][f"{hero}-{form}"]["combat"]
    (ex, ey), span = head["eyes"], head.get("eyeSpan") or head["headPx"]
    rest = next(frames(idle))
    half = int(span * 1.7)
    patch = rest.crop((int(ex) - half, int(ey) - half, int(ex) + half, int(ey) + half))
    oval = Image.new("L", patch.size, 0)
    ImageDraw.Draw(oval).ellipse((half - span * 1.35, half - span * .8, half + span * 1.35, half + span * 1.45), fill=255)
    return patch, oval.filter(ImageFilter.GaussianBlur(span * .12))


def face_size(frame, patch, oval):
    area, best = gray(frame), (-1, 1)
    for k in np.exp(np.arange(np.log(.4), np.log(2.6), .03)):
        for ang in (-10, -5, 0, 5, 10):
            tp = patch.rotate(ang, Image.Resampling.BICUBIC).resize((max(4, round(patch.width * k)),) * 2, Image.Resampling.BICUBIC)
            if tp.width >= min(area.shape):
                continue
            tm = oval.rotate(ang, Image.Resampling.BICUBIC).resize(tp.size, Image.Resampling.BICUBIC)
            res = np.nan_to_num(cv2.matchTemplate(area, gray(tp), cv2.TM_CCOEFF_NORMED, mask=np.asarray(tm)), nan=-1, posinf=-1, neginf=-1)
            score = float(res.max())
            if score > best[0]:
                best = (score, float(k))
    return best


def measure(hero, form):
    book = sheets(hero, form)
    if "idle" not in book:
        return {}
    patch, oval = face_template(hero, form, book["idle"])
    out = {}
    for name, sheet in book.items():
        found = [face_size(f, patch, oval) for f in frames(sheet)]
        good = [k for s, k in found if s >= GOOD]
        out[name] = (statistics.median(good) if good else None, len(good), len(found))
    return out


def report(heroes):
    for hero in heroes:
        for form in ("1", "2", "3"):
            got = measure(hero, form)
            line = "  ".join(f"{n} {'  -  ' if k is None else f'{k:.2f}'}({g}/{t})" for n, (k, g, t) in got.items())
            print(f"{hero}-{form}: {line}", flush=True)


def fix(hero, form):
    path = ROOT / f"assets/heroes/forms/{hero}/forms.json"
    book = json.loads(path.read_text(encoding="utf-8"))
    actions = book["forms"][form]["actions"]
    for name, (k, good, total) in measure(hero, form).items():
        if name == "idle" or k is None or abs(k - 1) < .03:
            continue
        old = actions[name].get("scale", 1)
        actions[name]["scale"] = round(old / k, 4)
        print(f"{name}: face x{k:.2f} ({good}/{total} frames) -> scale {old} -> {actions[name]['scale']}")
    path.write_text(json.dumps(book, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if sys.argv[1:2] == ["fix"]:
        fix(sys.argv[2], sys.argv[3])
    else:
        report(sys.argv[1:] or HEROES)
