"""Six-star Mika's run sheet redrawn without the two tails that rose behind her head (owner 08/11: "Mika form 3 khi chạy
có 2 mảnh đuôi ở tóc? Xử lý cho hợp lý"): in the run pose two of the nine tails stood up beside her ears and read as
pieces of hair. Codex redraws the sheet two frames at a time (the sharp pass's rule), shown the live frames for the pose
and place and the resting frame for the rendering (soft edges, no black outline); every tail fans out behind her.
Each frame is fitted back where the live one lay (sharpen_heroes.fit_raw), then soften_outline matches the contour to
the resting frame's.

  python assets/heroes/forms/fire/form-3/redraw_run.py draw [pair ...] [model effort]
  python assets/heroes/forms/fire/form-3/redraw_run.py build
"""
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))
from sharpen_heroes import fit_raw, check, frames   # noqa: E402
import soften_outline                                 # noqa: E402

GEN = Path.home() / ".claude/skills/generate2dsprite/scripts/codex_image_gen.py"
SHEET = HERE / "run.webp"
WORK = HERE / "sharp"
BEFORE = WORK / "run-before-tails.webp"     # the live sheet when the owner flagged it: pose, place and size
MAGENTA = (255, 0, 255)
PROMPT = """Image 1 shows two animation frames of a chibi fox-girl running with her glaive (two equal square cells in one row). Redraw them on a wide landscape canvas, two equal square cells in one row: in every cell the same running pose, the same limb and glaive angles, the same size and the same position inside the cell as Image 1.
Change one thing: her nine big fox tails all fan out BEHIND her, to the left and back, below her shoulders. No tail rises above or beside her head and none shows between her ears and the glaive: behind her head there is only her own hair, her two pointed fox ears (dark-tipped, as in Image 2) and the glaive: no white fur puff, no tuft and no tail tip anywhere near her head or ears.
Image 2 is the same character drawn in her resting pose: render the frames exactly the way Image 2 is rendered (soft clean edges, the same colours and detail, NO black outline around the figure), and keep her face, hair, ears, armour, glaive and tails exactly as designed in Image 2.
Background 100% solid flat magenta #FF00FF, no gradients, no text, no labels, no borders between cells, no shadow on the ground. Nothing crosses a cell edge."""


def live():
    if not BEFORE.exists():
        WORK.mkdir(exist_ok=True); BEFORE.write_bytes(SHEET.read_bytes())
    return frames(Image.open(BEFORE).convert("RGBA"), dict(cols=3, rows=2))


def strip(pair):
    olds = live(); n = olds[0].width
    s = Image.new("RGBA", (2 * n, n))
    for j, i in enumerate(pair):
        s.alpha_composite(olds[i], (j * n, 0))
    return s


PAIRS = {"a": (0, 1), "b": (2, 3), "c": (4, 5)}


def draw(name, model="gpt-6.1-sol", effort="low"):
    s = strip(PAIRS[name])
    ref = Image.new("RGBA", s.size, MAGENTA + (255,)); ref.alpha_composite(s)
    layout = WORK / f"run-tails-{name}-ref.png"; ref.convert("RGB").resize((1792, 896), Image.Resampling.LANCZOS).save(layout)
    rest = WORK / "run-tails-rest.png"
    flat = Image.new("RGBA", (512, 512), MAGENTA + (255,)); flat.alpha_composite(Image.open(HERE / "rig/combat/rest.png").convert("RGBA"))
    flat.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(rest)
    pf = WORK / f"run-tails-{name}-prompt.txt"; pf.write_text(PROMPT + "\n", encoding="utf-8")
    raw = WORK / f"run-tails-{name}-raw.png"
    env = {**os.environ, "IMAGEGEN_BACKEND": "codex"}   # the API backend paints character sheets on white
    r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(pf), "--out", str(raw), "--ref", str(layout), "--ref", str(rest),
                        "--model", model, "--effort", effort, "--timeout", "900"], env=env, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", creationflags=0x08000000)
    layout.unlink(missing_ok=True); rest.unlink(missing_ok=True)
    print(name, "ok" if raw.exists() and not r.returncode else "FAIL " + r.stderr[-300:])


def build():
    olds = live(); n = olds[0].width
    sheet = Image.new("RGBA", (3 * n, 2 * n))
    for name, pair in PAIRS.items():
        job = dict(cols=2, rows=1, cell=n, hero="fire")
        fitted, _ = fit_raw(Image.open(WORK / f"run-tails-{name}-raw.png"), strip(pair), job)
        iou, foot = check(fitted, strip(pair), job)
        print(f"pair {name}: iou {iou:.3f} foot {foot:.3f}")
        for j, i in enumerate(pair):
            sheet.alpha_composite(fitted.crop((j * n, 0, (j + 1) * n, n)), ((i % 3) * n, (i // 3) * n))
    sheet.save(SHEET, quality=92, alpha_quality=100, method=6)
    o, s, target, t = soften_outline.process(SHEET, 3, 2, HERE / "rig/combat/idle.webp", 6, 4)
    print(f"contour {o:.3f} -> {o + t * (s - o):.3f} (rest {target:.3f})")


if __name__ == "__main__":
    if sys.argv[1] == "build":
        build()
    else:
        names = [a for a in sys.argv[2:] if a in PAIRS] or list(PAIRS)
        extra = [a for a in sys.argv[2:] if a not in PAIRS]
        for name in names:
            draw(name, *extra)
