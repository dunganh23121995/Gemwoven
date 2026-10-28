"""Hold a rigid prop (a weapon shaft, a staff) steady through a showcase loop or action.

Codex redraws a held weapon a little differently in every frame: when the hand drifts while the
weapon's head rests on the ground, the shaft bends like rope. The prop as drawn in the resting frame
(idle frame 1) is laid into every frame of the given sheets, with a few pixels of margin (all but this
frame's own foliage) so the bent shaft underneath cannot show beside it.

  python assets/heroes/forms/hold_prop.py <hero> <form> x0,y0,x1,y1 <sheet> [sheet ...] [--not-green]
      the box is in 384 px showcase-cell pixels; --not-green leaves the leaves round the prop moving
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
MARGIN = 4   # px round the prop taken from the resting frame too


def cells(sheet):
    c = sheet.width // 2
    return c, [sheet.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)) for i in range(sheet.height // c * 2)]


def hold(hero, form, box, names, not_green=False):
    show = ROOT / f"assets/heroes/forms/{hero}/form-{form}/showcase"
    c, idle = cells(Image.open(show / "idle.webp").convert("RGBA"))
    rest = np.asarray(idle[0]).astype(int)
    k = c / 384
    x0, y0, x1, y1 = [round(v * k) for v in box]
    prop = np.zeros(rest.shape[:2], bool)
    r, g, b, a = (rest[y0:y1, x0:x1, i] for i in range(4))
    prop[y0:y1, x0:x1] = (a > 128) & ~((g > r * 1.05) & (g > b) if not_green else False)
    core = Image.fromarray((prop * 255).astype("uint8"))
    near = np.asarray(core.filter(ImageFilter.MaxFilter(2 * MARGIN + 1))) > 0
    for name in names:
        path = show / f"{name}.webp"
        sheet = Image.open(path).convert("RGBA")
        _, frames = cells(sheet)
        out = Image.new("RGBA", sheet.size)
        for i, frame in enumerate(frames):
            # The prop itself, and round it only what is not foliage in this frame (the bent shaft):
            # leaves moving past it stay as this frame draws them.
            f = np.asarray(frame).astype(int)
            stray = near & (f[..., 3] > 128) & ~(not_green & (f[..., 1] > f[..., 0] * 1.05) & (f[..., 1] > f[..., 2]))
            mask = Image.fromarray(((prop | stray) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0))
            frame = frame.copy()
            frame.paste(idle[0], (0, 0), mask)
            out.paste(frame, ((i % 2) * c, (i // 2) * c))
        out.save(path, lossless=True, method=6)
        print("prop held:", path.relative_to(ROOT))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    hold(args[0], args[1], [int(v) for v in args[2].split(",")], args[3:], "--not-green" in sys.argv)
