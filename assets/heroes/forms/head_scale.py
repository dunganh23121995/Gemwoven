"""Head scale: every form of a hero shows its body at one size, measured by the head.

Tails, wings, auras and weapons may reach anywhere; the BODY must be the same size in forms 1, 2
and 3, on every screen. Each form's whole sprite is scaled uniformly so that its head is as large
on screen as form 1's head (form 1 keeps today's size). Nothing is redrawn or stretched.

Data: assets/heroes/head-scale.json, one line per hero form ("fire-3"), for two drawings:
  combat   - first frame of the combat idle sheet (256px cell)
  showcase - first frame of the hub showcase idle (form-N/showcase/idle.webp, the hub poster)
Each entry keeps the raw readings and the result:
  eyes      [x, y] centre between the eyes, in sheet pixels of that frame
  eyeChin   eye line to chin, px (read on zoomed crops; the hero's head measure)
  eyeSpan   centre of one eye to the other, px (Noct's face is hidden: his glowing eyes)
  template  [forward, reverse] face scale against form 1 by multi-scale template matching
  ratio     head size against form 1 = median of every estimate above (eyeChin ratio, eyeSpan
            ratio, template forward, template reverse); form 1 is 1
  headPx    form 1's measure x ratio: the head size in that drawing's pixels
  cellPx    frame size; bodyPx: opaque height of the frame (crown to foot, extras included)

The builds read headPx: build.py -> ART.heroHead (combat --hero-art-scale), and
scripts/build_gemwoven.py -> headFit on every show-<hero>-<form> asset (hub fitBody).

Usage (QA images go to qa/head-scale/, which Git ignores):
  python assets/heroes/forms/head_scale.py crops  [hero]   zoomed 1px-grid crops of each head to read eyes/chin
  python assets/heroes/forms/head_scale.py match  [hero]   template scales of forms 2-3 against form 1 (writes template)
  python assets/heroes/forms/head_scale.py solve           ratio, headPx, cellPx, bodyPx from the readings
  python assets/heroes/forms/head_scale.py review [hero]   heads side by side at display scale, guide lines at eyes
A new hero or form: add its entry (eyes, eyeChin or eyeSpan), run match, solve, review; then rebuild.
"""
import json
import sys
from pathlib import Path
from statistics import median

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "assets/heroes/head-scale.json"
OUT = ROOT / "qa/head-scale"


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


def flat(im):
    bg = Image.new("RGBA", im.size, (128, 128, 128, 255))
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


def entries(data, only=None):
    for name, entry in data["forms"].items():
        hero, form = name.rsplit("-", 1)
        if only in (None, hero):
            yield hero, int(form), entry


def grid(im, box, zoom, out):
    """A zoomed crop with a tick every pixel row and labels every 2px, to read eye line and chin."""
    x0, y0, x1, y1 = box
    crop = flat(im.crop(box)).resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
    pad = 30
    can = Image.new("RGB", (crop.width + pad, crop.height + pad), (255, 255, 255))
    can.paste(crop, (pad, pad))
    d, font = ImageDraw.Draw(can), ImageFont.load_default()
    for y in range(y0, y1 + 1):
        yy = pad + (y - y0) * zoom
        if y % 2 == 0:
            d.text((0, yy - 5), str(y), fill=(0, 0, 0), font=font)
            for xx in range(pad, can.width, 8):
                d.point((xx, yy), fill=(255, 255, 0))
        if y % 10 == 0:
            d.line([(pad, yy), (can.width, yy)], fill=(0, 255, 0))
    for x in range(x0, x1 + 1):
        if x % 10 == 0:
            xx = pad + (x - x0) * zoom
            d.line([(xx, pad), (xx, can.height)], fill=(0, 200, 255))
            d.text((xx - 6, 2), str(x), fill=(0, 0, 0), font=font)
    can.save(out)


def crops(only=None):
    data = load()
    OUT.mkdir(parents=True, exist_ok=True)
    for hero, form, entry in entries(data, only):
        for kind in ("combat", "showcase"):
            e = entry[kind]
            x, y = e["eyes"]
            r = round((22 if kind == "showcase" else 17) * e.get("ratio", 1))
            zoom = max(6, round(440 / (2 * r)))
            grid(frame(hero, form, kind), (round(x - r), round(y - r * .7), round(x + r), round(y + r * 1.3)), zoom, OUT / f"crop-{hero}-{form}-{kind}.png")
    print("crops in", OUT)


def ncc_search(template, image, centre, scales, reach=26):
    """Best (score, scale) of a template in an image resized by 1/scale, near centre."""
    t = np.asarray(template, np.float32) / 255
    t = t - t.mean()
    tn = np.sqrt((t * t).sum())
    h, w = t.shape[:2]
    best = (-2.0, 1.0)
    for s in scales:
        im = image.resize((round(image.width / s), round(image.height / s)), Image.LANCZOS)
        cx, cy = centre[0] / s, centre[1] / s
        box = (int(max(0, cx - w / 2 - reach)), int(max(0, cy - h / 2 - reach)), int(min(im.width, cx + w / 2 + reach)), int(min(im.height, cy + h / 2 + reach)))
        a = np.asarray(im.crop(box), np.float32) / 255
        if a.shape[0] < h or a.shape[1] < w:
            continue
        v = np.lib.stride_tricks.sliding_window_view(a, (h, w), axis=(0, 1))   # (H', W', c, h, w)
        v = np.moveaxis(v, 2, -1)
        v = v - v.mean(axis=(2, 3, 4), keepdims=True)
        score = (v * t).sum(axis=(2, 3, 4)) / (np.sqrt((v * v).sum(axis=(2, 3, 4))) * tn + 1e-9)
        if score.max() > best[0]:
            best = (float(score.max()), float(s))
    return best


def match(only=None):
    """Template scale of each form's face against form 1's (and back), on the same kind of drawing."""
    data = load()
    for hero, form, entry in entries(data, only):
        if form == 1:
            continue
        for kind in ("combat", "showcase"):
            box = data["heroes"][hero]["faceBox"][kind]
            ref, ref_eyes = flat(frame(hero, 1, kind)), data["forms"][f"{hero}-1"][kind]["eyes"]
            tgt, eyes = flat(frame(hero, form, kind)), entry[kind]["eyes"]
            off = ((box[0] + box[2]) / 2 - ref_eyes[0], (box[1] + box[3]) / 2 - ref_eyes[1])
            guess = entry[kind].get("ratio", 1)
            centre = (eyes[0] + off[0] * guess, eyes[1] + off[1] * guess)
            _, fwd = ncc_search(ref.crop(box), tgt, centre, np.arange(.45, 1.9, .01))
            w, h = box[2] - box[0], box[3] - box[1]
            back = (round(centre[0] - w * fwd / 2), round(centre[1] - h * fwd / 2), round(centre[0] + w * fwd / 2), round(centre[1] + h * fwd / 2))
            _, rev = ncc_search(tgt.crop(back), ref, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), np.arange(.45, 1.9, .01))
            entry[kind]["template"] = [round(fwd, 2), round(1 / rev, 2)]
            print(hero, form, kind, entry[kind]["template"])
    save(data)


def solve():
    data = load()
    for hero, form, entry in entries(data):
        measure = data["heroes"][hero]["measure"]
        for kind in ("combat", "showcase"):
            e, base = entry[kind], data["forms"][f"{hero}-1"][kind]
            if form == 1:
                ratio = 1.0
            else:
                est = [e[k] / base[k] for k in ("eyeChin", "eyeSpan") if e.get(k) and base.get(k)] + list(e.get("template") or [])
                ratio = round(median(est), 3)
            im = frame(hero, form, kind)
            box = im.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
            e.update(ratio=ratio, headPx=round(base[measure] * ratio, 2), cellPx=im.height, bodyPx=box[3] - box[1])
    save(data)
    for hero, form, entry in entries(data):
        print(f"{hero}-{form}", {k: (v["ratio"], v["headPx"], v["cellPx"]) for k, v in entry.items()})


def review(only=None):
    """Each hero's heads at one display scale (form 1's), eyes on one green line, a line every
    quarter head; and the three whole bodies on one ground line at that scale."""
    data = load()
    OUT.mkdir(parents=True, exist_ok=True)
    heroes = sorted({h for h, _, _ in entries(data, only)})
    for hero in heroes:
        forms = [(f, e) for h, f, e in entries(data, hero)]
        for kind in ("combat", "showcase"):
            h1 = data["forms"][f"{hero}-1"][kind]["headPx"]
            R, Z = 2.6 * h1, 4
            tiles, bodies = [], []
            for form, e in forms:
                k = e[kind]["headPx"] / h1   # this drawing's pixels per form-1 pixel
                im = frame(hero, form, kind)
                x, y = e[kind]["eyes"]
                tiles.append(flat(im.crop((x - R * k, y - R * k, x + R * k, y + 1.6 * R * k))).resize((round(2 * R * Z), round(2.6 * R * Z)), Image.LANCZOS))
                box = im.getchannel("A").getbbox()
                body = im.crop(box)
                bodies.append(body.resize((max(1, round(body.width / k * 2)), max(1, round(body.height / k * 2))), Image.LANCZOS))
            can = Image.new("RGB", (sum(t.width + 10 for t in tiles), tiles[0].height), (0, 0, 0))
            x = 0
            for t in tiles:
                can.paste(t, (x, 0))
                x += t.width + 10
            d = ImageDraw.Draw(can)
            eye = round(R * Z)
            for i in range(-8, 12):
                yy = eye + round(i * h1 / 4 * Z)
                if 0 <= yy < can.height:
                    d.line([(0, yy), (can.width, yy)], fill=(0, 255, 0) if i == 0 else (0, 160, 255) if i == 4 else (90, 90, 0))
            can.save(OUT / f"heads-{hero}-{kind}.png")
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
    {"crops": crops, "match": match, "solve": solve, "review": review}[cmd](*rest)
