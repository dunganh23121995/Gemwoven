"""Lock Yuki's combat faces to frame 1, without scaling or drawing new pixels.

Run from any directory: python assets/heroes/forms/ice/tools/lock_combat_face.py
Adapted from lightning/tools/lock_face.py. Inputs are 2 x 4 lossless RGBA WebP
sheets. Head polygons exclude the long ears, braid, cape, and staff; their
three-pixel feather lies inside the polygon. QA crops follow the measured head
translation and are enlarged 6x with nearest-neighbor sampling.
"""

from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[5]
CELL = 256
SEARCH = 8
FEATHER = 3.0
FORMS = (
    {
        "form": 1,
        "sheet": "assets/reimagined/heroes/ice/idle.webp",
        "match": (120, 116, 166, 152),
        "head": [(141, 109), (150, 111), (162, 117), (165, 123),
                 (169, 133), (167, 145), (165, 154), (151, 154),
                 (140, 151), (133, 147), (125, 144), (120, 137),
                 (117, 130), (118, 121), (126, 119), (141, 119)],
        "crop": (113, 104, 173, 158),
        "face": (139, 128, 161, 148),
    },
    {
        "form": 2,
        "sheet": "assets/heroes/forms/ice/form-2/idle.webp",
        "match": (118, 84, 168, 121),
        "head": [(140, 74), (148, 76), (163, 83), (166, 90),
                 (171, 101), (169, 114), (165, 124), (150, 124),
                 (139, 121), (132, 117), (124, 114), (118, 109),
                 (115, 101), (116, 88), (125, 85), (140, 84)],
        "crop": (110, 69, 175, 128),
        "face": (138, 95, 162, 117),
    },
)


def premul(rgba):
    out = rgba.astype(np.float64)
    out[..., :3] *= out[..., 3:4] / 255.0
    return out


def shifted(array, dx, dy):
    shift = (dy, dx) if array.ndim == 2 else (dy, dx, 0)
    return ndimage.shift(array, shift, order=0, mode="constant", cval=0,
                         prefilter=False)


def frame(sheet, k):
    x, y = k % 2 * CELL, k // 2 * CELL
    return sheet[y:y + CELL, x:x + CELL]


def contact_sheet(sheet, offsets, config):
    box = config["crop"]
    width, height = (box[2] - box[0]) * 6, (box[3] - box[1]) * 6
    out = Image.new("RGB", (width * 4, (height + 24) * 2), (50, 60, 75))
    draw = ImageDraw.Draw(out)
    for k, (dx, dy) in enumerate(offsets):
        crop = Image.fromarray(frame(sheet, k)).crop(
            (box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy))
        crop = crop.resize((width, height), Image.Resampling.NEAREST)
        x, y = k % 4 * width, k // 4 * (height + 24)
        draw.text((x + 5, y + 5), f"Frame {k + 1} ({dx:+}, {dy:+})", fill="white")
        background = Image.new("RGBA", crop.size, (50, 60, 75, 255))
        background.alpha_composite(crop)
        out.paste(background.convert("RGB"), (x, y + 24))
    qa = ROOT / "qa"
    qa.mkdir(exist_ok=True)
    out.save(qa / f"yuki-face-check-form-{config['form']}.png")


def lock(config):
    path = ROOT / config["sheet"]
    with Image.open(path) as image:
        assert image.size == (512, 1024) and image.mode == "RGBA", path
        original = np.array(image)
    result = original.copy()
    reference = frame(original, 0).copy()
    source = premul(reference)
    polygon = Image.new("L", (CELL, CELL))
    ImageDraw.Draw(polygon).polygon(config["head"], fill=255)
    # A finite feather leaves every pixel outside the head completely untouched.
    mask = np.clip((ndimage.distance_transform_edt(np.array(polygon) > 0) - .5)
                   / FEATHER, 0, 1)
    x0, y0, x1, y1 = config["match"]
    template = source[y0:y1, x0:x1]
    offsets = [(0, 0)]
    report = []
    for k in range(1, 8):
        current = frame(original, k)
        target = premul(current)
        error, dx, dy = min(
            (float(np.abs(target[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
                          - template).mean()), dx, dy)
            for dy in range(-SEARCH, SEARCH + 1)
            for dx in range(-SEARCH, SEARCH + 1)
        )
        offsets.append((dx, dy))
        weight = shifted(mask, dx, dy)[..., None]
        moved_source = shifted(source, dx, dy)
        mixed = moved_source * weight + target * (1 - weight)
        alpha = mixed[..., 3:4]
        rgb = mixed[..., :3] * 255 / np.maximum(alpha, 1e-6)
        rgba = np.rint(np.concatenate((rgb, alpha), axis=-1)).clip(0, 255).astype(np.uint8)
        # Preserve original RGBA outside the mask, including invisible RGB.
        output = current.copy()
        output[weight[..., 0] > 0] = rgba[weight[..., 0] > 0]
        rigid = weight[..., 0] == 1
        moved_reference = shifted(reference, dx, dy)
        output[rigid] = moved_reference[rigid]
        assert np.array_equal(output[rigid], moved_reference[rigid])
        fx0, fy0, fx1, fy1 = config["face"]
        assert np.all(mask[fy0:fy1, fx0:fx1] == 1), "Face must be fully rigid"
        assert np.array_equal(output[fy0 + dy:fy1 + dy, fx0 + dx:fx1 + dx],
                              reference[fy0:fy1, fx0:fx1])
        assert np.array_equal(output[weight[..., 0] == 0],
                              current[weight[..., 0] == 0])
        frame(result, k)[:] = output
        report.append((k + 1, dx, dy, round(error, 3)))
    Image.fromarray(result).save(path, "WEBP", lossless=True, method=6, exact=True)
    with Image.open(path) as image:
        saved = np.array(image.convert("RGBA"))
    assert np.array_equal(saved, result), "WebP must preserve every RGBA pixel"
    assert np.array_equal(frame(saved, 0), reference), "Frame 1 must be unchanged"
    copy = ROOT / f"assets/heroes/forms/ice/form-{config['form']}/combat-idle/idle.webp"
    if copy.exists():
        shutil.copyfile(path, copy)
        assert copy.read_bytes() == path.read_bytes()
    contact_sheet(saved, offsets, config)
    print(f"Form {config['form']}: (frame, dx, dy, mean absolute error) {report}")


if __name__ == "__main__":
    for config in FORMS:
        lock(config)
