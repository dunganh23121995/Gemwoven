"""Head scale: every form of a hero shows its body at one size, measured by the head.

Tails, wings, auras and weapons may reach anywhere; the BODY must be the same size in forms 1, 2
and 3, on every screen. Each form's whole sprite is scaled uniformly so that its head is as large
on screen as form 1's head (form 1 keeps today's size). Nothing is redrawn or stretched.

Data: assets/heroes/head-scale.json, one line per hero form ("fire-3"), for two drawings:
  combat   - first frame of the combat idle sheet (256px cell)
  showcase - first frame of the hub showcase idle (form-N/showcase/idle.webp, the hub poster)

How a head is measured (all in that frame's sheet pixels):
  irisBoxes [[x0,y0,x1,y1], [x0,y0,x1,y1]]  the two irises, read on 1-px grid crops (`crops`);
            x1/y1 exclusive. Their centres are the darkness-weighted centroids inside each box.
  chinY     the first row under the chin that is no longer skin, at the middle of the chin.
  eyes      midpoint of the two iris centres; irisL / irisR the centres themselves
  eyeSpan   distance between the iris centres
  eyeChin   eye line (mean iris y) to chinY
Two independent measures, because each has a weakness: the eye spacing shrinks when a face is
turned further into 3/4 view, and the chin can hide behind a scarf or an open mouth. A form's
size against form 1 (ratio) is the mean of the two ratios (eyeSpan/eyeSpan1, eyeChin/eyeChin1).
When they disagree by more than 5% the pair was inspected by eye (`review`: the three faces
normalised by each candidate, eye lines aligned) and with a Codex second opinion; in every such
case the mean gave the most even faces. A hero whose form-1 far eye is partly hidden (Nori's
shield) sets "spanUsable": false and uses eyeChin alone. Noct (shadow) is locked as approved:
his entries are kept for reference and the builds skip him.
  ratio   head size against form 1 (form 1 is 1)
  headPx  form 1's eyeChin x ratio: the head size in that drawing's pixels
  cellPx  frame size; bodyPx: opaque height of the frame (crown to foot, extras included)

The builds read headPx: build.py -> ART.heroHead (combat --hero-art-scale), and
scripts/build_gemwoven.py -> headFit on every show-<hero>-<form> asset (hub fitBody, summon).

Usage (QA images go to qa/head-scale/, which Git ignores):
  python assets/heroes/forms/head_scale.py crops   [hero]  1-px grid crops of each face (read irisBoxes, chinY)
  python assets/heroes/forms/head_scale.py measure         iris centres, eyeSpan, eyeChin from the readings
  python assets/heroes/forms/head_scale.py solve           ratio, headPx, cellPx, bodyPx
  python assets/heroes/forms/head_scale.py review  [hero]  the faces at equal head size (eyes aligned, chin
                                                           line), iris markers, and the whole bodies
A new hero or form, or a redrawn idle: enter irisBoxes and chinY, run measure, solve, review; rebuild.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "assets/heroes/head-scale.json"
OUT = ROOT / "qa/head-scale"
AGREE = .05


def sheet_of(hero, form, kind):
    """(path, cols, rows) of the drawing measured."""
    if kind == "showcase":
        return ROOT / f"assets/heroes/forms/{hero}/form-{form}/showcase/idle.webp", 2, 4
    if hero == "novice":
        return ROOT / "assets/heroes/novice/idle.webp", 2, 4
    if form == 1:
        return (ROOT / "assets/heroes/shadow/idle-cloth.webp" if hero == "shadow" else ROOT / f"assets/reimagined/heroes/{hero}/idle.webp"), 2, 4
    idle = json.loads((ROOT / f"assets/heroes/forms/{hero}/forms.json").read_text(encoding="utf-8"))["forms"][str(form)]["actions"]["idle"]
    return ROOT / idle["file"], idle["cols"], idle["rows"]


def frame(hero, form, kind):
    path, cols, rows = sheet_of(hero, form, kind)
    with Image.open(path) as im:
        im = im.convert("RGBA")
        return im.crop((0, 0, im.width // cols, im.height // rows))


def flat(im, grey=(70, 70, 80)):
    bg = Image.new("RGBA", im.size, (*grey, 255))
    bg.alpha_composite(im)
    return bg.convert("RGB")


def load():
    return json.loads(DATA.read_text(encoding="utf-8"))


def save(data):
    # One line per hero form, so a diff shows exactly which measurement changed.
    lines = ["{", f'  "_about": {json.dumps(data["_about"], ensure_ascii=False)},', '  "heroes": {']
    lines.append(",\n".join(f"    {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in data["heroes"].items()))
    lines += ["  },", '  "forms": {']
    lines.append(",\n".join(f"    {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in data["forms"].items()))
    lines += ["  }", "}"]
    DATA.write_text("\n".join(lines) + "\n", encoding="utf-8")


def entries(data, only=None, measured=True):
    for name, entry in data["forms"].items():
        hero, form = name.rsplit("-", 1)
        if only not in (None, hero) or (measured and data["heroes"][hero].get("locked")):
            continue
        yield hero, int(form), entry


def grid(im, box, zoom, out):
    """A zoomed crop with every pixel outlined and coordinates every 2px (x printed mod 100)."""
    x0, y0, x1, y1 = box
    crop = flat(im.crop(box)).resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
    pad = 26
    can = Image.new("RGB", (crop.width + pad, crop.height + pad), (255, 255, 255))
    can.paste(crop, (pad, pad))
    d, font = ImageDraw.Draw(can), ImageFont.load_default()
    for y in range(y0, y1 + 1):
        yy = pad + (y - y0) * zoom
        d.line([(pad, yy), (can.width, yy)], fill=(0, 255, 0) if y % 10 == 0 else (40, 40, 40))
        if y % 2 == 0:
            d.text((0, yy + zoom // 2 - 5), str(y), fill=(0, 0, 0), font=font)
    for x in range(x0, x1 + 1):
        xx = pad + (x - x0) * zoom
        d.line([(xx, pad), (xx, can.height)], fill=(0, 200, 255) if x % 10 == 0 else (40, 40, 40))
        if x % 2 == 0:
            d.text((xx + 1, 8 if x % 4 == 0 else 15), str(x % 100), fill=(0, 0, 0), font=font)
    can.save(out)


def crops(only=None):
    data = load()
    OUT.mkdir(parents=True, exist_ok=True)
    for hero, form, entry in entries(data, only):
        for kind in ("combat", "showcase"):
            x, y = entry[kind]["eyes"]
            rx, up, down, zoom = (20, 12, 22, 13) if kind == "showcase" else (15, 10, 18, 16)
            grid(frame(hero, form, kind), (round(x - rx), round(y - up), round(x + rx), round(y + down)), zoom, OUT / f"crop-{hero}-{form}-{kind}.png")
    print("crops in", OUT)


def iris_centre(lum, box):
    """Darkness-weighted centroid inside an iris box: the iris and pupil weigh, skin and sclera do not."""
    x0, y0, x1, y1 = box
    a = lum[y0:y1, x0:x1]
    w = np.clip(np.percentile(a, 90) - a, 0, None)
    ys, xs = np.mgrid[y0:y1, x0:x1]
    return float((w * xs).sum() / w.sum() + .5), float((w * ys).sum() / w.sum() + .5)


def measure():
    data = load()
    for hero, form, entry in entries(data):
        for kind in ("combat", "showcase"):
            e = entry[kind]
            if "irisBoxes" not in e:
                continue
            lum = np.asarray(flat(frame(hero, form, kind)), np.float32) @ [.299, .587, .114] / 255
            (lx, ly), (rx, ry) = (iris_centre(lum, b) for b in e["irisBoxes"])
            e.update(irisL=[round(lx, 2), round(ly, 2)], irisR=[round(rx, 2), round(ry, 2)], eyes=[round((lx + rx) / 2, 2), round((ly + ry) / 2, 2)],
                     eyeSpan=round(float(np.hypot(rx - lx, ry - ly)), 2), eyeChin=round(e["chinY"] - (ly + ry) / 2, 2))
    save(data)


def solve():
    data = load()
    for hero, form, entry in entries(data):
        span_ok = data["heroes"][hero].get("spanUsable", True)
        for kind in ("combat", "showcase"):
            e, base = entry[kind], data["forms"][f"{hero}-1"][kind]
            chin = e["eyeChin"] / base["eyeChin"]
            span = e["eyeSpan"] / base["eyeSpan"] if span_ok and form > 1 else chin
            ratio = 1.0 if form == 1 else round((span + chin) / 2, 3)
            im = frame(hero, form, kind)
            box = im.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
            e.update(ratio=ratio, headPx=round(base["eyeChin"] * ratio, 2), cellPx=im.height, bodyPx=box[3] - box[1])
            flag = "" if abs(span / chin - 1) <= AGREE else "  <- measures disagree: check with review"
            print(f"{hero}-{form} {kind:8} span {span:.3f} chin {chin:.3f} -> {ratio:.3f}{flag}")
    save(data)


def review(only=None):
    """Per hero and drawing: the three faces scaled to one head size (ratio), eye line (cyan) and
    form 1's chin (magenta) across; then the same faces at their raw sheet scale; then the whole
    bodies at one head size on one ground line."""
    data = load()
    OUT.mkdir(parents=True, exist_ok=True)
    for hero in sorted({h for h, _, _ in entries(data, only)}):
        forms = [(f, e) for h, f, e in entries(data, hero)]
        for kind in ("combat", "showcase"):
            base = data["forms"][f"{hero}-1"][kind]
            rows = []
            for scaled in (True, False):
                tiles = []
                for form, e in forms:
                    k = e[kind]["ratio"] if scaled else 1
                    R = base["eyeChin"] * 2.4 * k
                    x, y = e[kind]["eyes"]
                    t = flat(frame(hero, form, kind)).crop((round(x - R), round(y - R * 1.1), round(x + R), round(y + R * .9))).resize((300, 300), Image.LANCZOS)
                    d = ImageDraw.Draw(t)
                    eye = 300 * 1.1 / 2
                    d.line([(0, eye), (300, eye)], fill=(0, 255, 255))
                    d.line([(0, eye + base["eyeChin"] * 300 / (2 * base["eyeChin"] * 2.4)), (300, eye + base["eyeChin"] * 300 / (2 * base["eyeChin"] * 2.4))], fill=(255, 0, 255))
                    for ix, iy in (e[kind].get("irisL"), e[kind].get("irisR")) if "irisL" in e[kind] else ():
                        px, py = (ix - (x - R)) * 300 / (2 * R), (iy - (y - R * 1.1)) * 300 / (2 * R)
                        d.line([(px - 6, py), (px + 6, py)], fill=(0, 255, 0))
                        d.line([(px, py - 6), (px, py + 6)], fill=(0, 255, 0))
                    d.text((4, 4), f"form {form} x{k:.3f}", fill=(255, 255, 255))
                    tiles.append(t)
                rows.append(tiles)
            can = Image.new("RGB", (len(forms) * 306, 612), (0, 0, 0))
            for r, tiles in enumerate(rows):
                for i, t in enumerate(tiles):
                    can.paste(t, (i * 306, r * 312))
            can.save(OUT / f"heads-{hero}-{kind}.png")
            bodies = []
            for form, e in forms:
                im = frame(hero, form, kind)
                body = im.crop(im.getchannel("A").getbbox())
                k = e[kind]["ratio"]
                bodies.append(body.resize((max(1, round(body.width / k * 2)), max(1, round(body.height / k * 2))), Image.LANCZOS))
            H = max(b.height for b in bodies) + 20
            can = Image.new("RGBA", (sum(b.width + 10 for b in bodies) + 10, H), (70, 70, 80, 255))
            x = 10
            for b in bodies:
                can.alpha_composite(b, (x, H - 10 - b.height))
                x += b.width + 10
            can.convert("RGB").save(OUT / f"bodies-{hero}-{kind}.png")
    print("review images in", OUT)


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:] or ["solve"]
    {"crops": crops, "measure": measure, "solve": solve, "review": review}[cmd](*rest)
