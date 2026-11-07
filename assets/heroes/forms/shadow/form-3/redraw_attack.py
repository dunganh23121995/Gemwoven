"""Six-star Noct's attack sheet, scythe poses redrawn (owner 07/11: "Ảnh 1 liềm bị cong, ảnh 2 lưỡi liềm sai hướng, 4 và 5
giống nhau và cũng sai tư thế liềm"; then "Ảnh 2 và 5 góc liềm so với cán. Ảnh 4 cán liềm và tư thế tay có vấn đề").
The reap is one clockwise swing: 1 ready, 2 wind-back (shaft level behind him, blade up), 3 over the top, 4 the blade
comes down on the foe (shaft rising forward), 5 the pull through (shaft level, the blade hooked back by the ground),
6 ready again.

Codex cannot keep a scythe's geometry from words (the blade drifts along the shaft, the shaft bends), so the scythe is
the resting frame's own drawing (its rig part map's weapon) moved as one rigid piece:
  guide  each frame's paste-up: the body as last drawn with its scythe cut out, the rigid scythe laid at the planned
         angle with its grip where the hands go;
  draw   Codex redraws the paste-ups, two frames per wide canvas, hands gripping that shaft (rendering from the rest);
  build  each new frame is scaled and placed so its eyes and soles sit where the live frame's did, the rigid scythe is
         laid over it again outside the hands (so its angle and length are exact), frame 1 takes frame 6's drawing
         (the same ready pose), 3 and 6 are kept; then retone_cyan.py (cyan, white blade) and the head anchors.

  python assets/heroes/forms/shadow/form-3/redraw_attack.py guide
  python assets/heroes/forms/shadow/form-3/redraw_attack.py draw [canvas] [model effort]
  python assets/heroes/forms/shadow/form-3/redraw_attack.py build
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1])); from sharpen_heroes import key           # noqa: E402
sys.path.insert(0, str(HERE.parent)); import retone_cyan                           # noqa: E402

GEN = Path.home() / ".claude/skills/generate2dsprite/scripts/codex_image_gen.py"
SHEET = HERE / "attack.webp"
WORK = HERE / "sharp"
BEFORE = WORK / "attack-before-redraw.webp"   # the live sheet (cyan, white blade) when the owner flagged it: eyes and soles
BASE = WORK / "attack-guide-base.webp"        # the first redraw: the bodies the paste-ups start from
N = 512
GREEN = (0, 255, 0)
GRIP = (232., 318.)                           # the upper glove on the resting frame's shaft
# frame: (degrees the rest scythe turns, counter-clockwise; where its grip goes in the 512px cell)
PLAN = {1: (80, (245, 255)), 3: (-45, (300, 345)), 4: (-95, (232, 345))}
RULES = """Keep the character exactly as in Image 2: the black tattered hooded cloak with deep-blue cloak tips, the black hood with a dark face and two glowing cyan eyes, black gloves and boots, the long straight dark scythe shaft with its silver spiked head, and the WHITE silver crescent blade. Chibi proportions, crisp clean dark outlines, sharp detail, the same rendering as Image 2. No violet or purple anywhere.
The character faces RIGHT (the enemy is off to the right). In every cell the body keeps the size, the place and the feet line it has in Image 1, both boots on the ground.
Background 100% solid flat green #00FF00, no gradients, no text, no labels, no borders between cells, no shadow on the ground, no slash trail or effect (the body sheet only). Nothing crosses a cell edge; keep a margin of green around everything."""
PASTE = """Image 1 is a rough paste-up of two animation frames of a grim reaper's scythe attack, side by side (two equal square cells in one row). In each cell the SCYTHE is exactly right and must stay exactly where it is: the same position, the same angle, the same length, the same straight shaft, and the blade at the same angle to the shaft. The body is rough: holes where an old weapon was cut out, arms that do not hold the shaft.
Redraw both cells as clean finished frames on a wide landscape canvas, two equal square cells in one row: keep each scythe exactly as laid in Image 1, and draw his two black-gloved hands firmly wrapped round its shaft (one hand where the shaft crosses his chest or shoulder, the other a little further along the shaft toward its butt end), with the arms joined naturally to his shoulders; fill the holes in the cloak and hood. Where the shaft passes his hood, it passes BEHIND the hood. He holds ONE scythe only: remove any leftover dark stick or fragment that is not part of it."""
CANVAS = {
    "a": ([1, 2], PASTE + """
LEFT cell, the WIND-BACK: the shaft level behind him at shoulder height, the blade standing up at its far left end.
RIGHT cell, OVER THE TOP: keep it exactly as in Image 1."""),
    "b": ([3, 4], PASTE + """
LEFT cell, the STRIKE: he leans into the swing, the shaft rising forward from his hands to the head at the upper right, the blade coming down in front of him onto the enemy.
RIGHT cell, the PULL THROUGH: crouched lower, the shaft level in front of his chest, the blade hanging down at its right end and hooking back toward his feet, the cloak swept back by the swing."""),
}


def cells(path):
    im = Image.open(path).convert("RGBA")
    return [im.crop(((i % 3) * N, (i // 3) * N, (i % 3 + 1) * N, (i // 3 + 1) * N)) for i in range(6)]


def landmarks(rgba):
    """(eye centre x, eye centre y, sole y) of a frame: the glowing eyes are the bright cyan points set in the hood's dark
    (the white blade is bright too, but against the air or steel); the soles are the lowest body pixel near them."""
    a = rgba.astype(np.float32) / 255
    v = a[..., :3].max(-1) * a[..., 3]
    r = max(5, a.shape[0] // 32)
    solid = ndimage.uniform_filter(a[..., 3], 4 * r + 1) > .97
    h, s, _ = retone_cyan.hsv(a[..., :3])
    cyan = (h > 170) & (h < 235) & (s > .12)                                # grey glints on gloves and metal are not eyes
    lit = (v > .6) & cyan & (ndimage.uniform_filter(v, 2 * r + 1) < .32) & solid
    lab, n = ndimage.label(ndimage.binary_dilation(lit, iterations=r // 2))
    if not n:
        raise ValueError("no eyes found")
    sizes = ndimage.sum(lit, lab, range(1, n + 1))
    ey, ex = ndimage.center_of_mass(lit & (lab == int(np.argmax(sizes)) + 1))
    cols = slice(max(0, int(ex - a.shape[1] * .3)), int(ex + a.shape[1] * .18))
    rows = np.where((a[:, cols, 3] > .5).any(1))[0]
    return ex, ey, rows.max()


def scythe_scale():
    """The attack cells draw the body smaller than the 512px resting frame (the sheet is shown grown)."""
    rest = np.asarray(Image.open(HERE / "rig/combat/rest.png").convert("RGBA"))
    _, ry, rs = landmarks(rest)
    _, y, s = landmarks(np.asarray(cells(BEFORE)[2]))
    return (s - y) / (rs - ry)


def rigid(frame):
    """The resting frame's scythe (rig weapon part) turned and scaled about its grip, as a 512px RGBA layer."""
    angle, grip = PLAN[frame]
    rest = np.asarray(Image.open(HERE / "rig/combat/rest.png").convert("RGBA")).copy()
    parts = np.asarray(Image.open(HERE / "rig/combat/parts.png").convert("RGB"))
    rest[~(parts == (255, 255, 0)).all(-1)] = 0
    k, pad = scythe_scale(), N
    big = Image.new("RGBA", (N + 2 * pad,) * 2); big.paste(Image.fromarray(rest), (pad, pad))
    big = big.rotate(angle, resample=Image.Resampling.BICUBIC, center=(GRIP[0] + pad, GRIP[1] + pad))
    big = big.resize((round(big.width * k),) * 2, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (N, N))
    out.paste(big, (round(grip[0] - (GRIP[0] + pad) * k), round(grip[1] - (GRIP[1] + pad) * k)), big)
    return out


def cut_weapon(frame_rgba):
    """The drawn scythe out of a frame (steel and the wooden shaft), leaving the eyes."""
    a = frame_rgba.astype(np.float32) / 255
    h, s, v = retone_cyan.hsv(a[..., :3]); seen = a[..., 3] > .3
    m = (seen & (s < .2) & (v > .42)) | (seen & (h < 45) & (s > .2) & (v > .08) & (v < .5))
    lab, n = ndimage.label(m)
    m = ndimage.binary_dilation(np.isin(lab, np.nonzero(ndimage.sum(m, lab, range(1, n + 1)) > 25)[0] + 1), iterations=3)
    ex, ey, _ = landmarks(frame_rgba)
    yy, xx = np.mgrid[:N, :N]
    out = frame_rgba.copy(); out[m & ~(((xx - ex) / 55) ** 2 + ((yy - ey) / 38) ** 2 < 1)] = 0
    # the old head's dark steel is left in pieces apart from the body: only the body's own piece stays
    lab, n = ndimage.label(out[..., 3] > 76)
    if n > 1:
        out[(lab != int(np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)))) + 1)] = 0
    return out


def guide():
    base = cells(BASE)
    for name, (idx, _) in CANVAS.items():
        sheet = Image.new("RGBA", (N * 2, N), GREEN + (255,))
        for j, i in enumerate(idx):
            if i in PLAN:
                sheet.alpha_composite(Image.fromarray(cut_weapon(np.asarray(base[i]))), (j * N, 0))
                sheet.alpha_composite(rigid(i), (j * N, 0))
            else:
                sheet.alpha_composite(base[i], (j * N, 0))
        sheet.convert("RGB").save(WORK / f"attack-redraw-{name}-guide.png")
    print("guides in", WORK)


def draw(name):
    idx, text = CANVAS[name]
    layout, rest = WORK / f"attack-redraw-{name}-ref.png", WORK / "attack-redraw-rest.png"
    Image.open(WORK / f"attack-redraw-{name}-guide.png").resize((1792, 896), Image.Resampling.LANCZOS).save(layout)
    flat = Image.new("RGBA", (N, N), GREEN + (255,)); flat.alpha_composite(Image.open(HERE / "rig/combat/rest.png").convert("RGBA"))
    flat.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(rest)
    pf = WORK / f"attack-redraw-{name}-prompt.txt"
    pf.write_text(text + "\nImage 2 is the same character drawn crisply in his resting pose: render the frames the way Image 2 is rendered and keep its scythe design exactly.\n" + RULES + "\n", encoding="utf-8")
    raw = WORK / f"attack-redraw-{name}-raw.png"
    env = {**os.environ, "IMAGEGEN_BACKEND": "codex"}   # the API backend paints character sheets on white
    model, effort = (sys.argv[3], sys.argv[4]) if len(sys.argv) > 4 else ("gpt-6.1-sol", "low")
    r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(pf), "--out", str(raw), "--ref", str(layout), "--ref", str(rest),
                        "--model", model, "--effort", effort, "--timeout", "900"], env=env, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", creationflags=0x08000000)
    print(name, "ok" if raw.exists() and not r.returncode else "FAIL " + r.stderr[-300:])


def fit(raw, i_old, j, olds):
    """Cell j of a keyed wide canvas, scaled so eye-to-sole height matches the old frame, eyes and soles on the old ones."""
    keyed = np.asarray(key(Image.open(raw), "shadow"))
    H, W = keyed.shape[:2]
    cell = keyed[:, round(j * W / 2):round((j + 1) * W / 2)]
    ex, ey, sole = landmarks(cell)
    ox, oy, osole = landmarks(np.asarray(olds[i_old]))
    scale = (osole - oy) / (sole - ey)
    im = Image.fromarray(cell, "RGBA")
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (N, N))
    out.paste(im, (round(ox - ex * scale), round(osole - sole * scale)), im)
    return out


def hold(frame, drawn):
    """The rigid scythe laid over the redrawn frame, except round the hands (from 110px behind the grip along the shaft to
    35px past it), where Codex's own fingers wrap the shaft."""
    angle, grip = PLAN[frame]
    layer = np.asarray(rigid(frame)).astype(np.float32) / 255
    t = np.radians(angle)
    up = np.array([-np.sin(t), -np.cos(t)])          # the rest shaft's upward direction, turned
    yy, xx = np.mgrid[:N, :N]
    along = (xx - grip[0]) * up[0] + (yy - grip[1]) * up[1]
    across = np.abs((xx - grip[0]) * up[1] - (yy - grip[1]) * up[0])
    hands = ((along > -110) & (along < 35) & (across < 30)).astype(np.float32)
    hands = ndimage.gaussian_filter(hands, 3)
    w = layer[..., 3] * (1 - hands)
    d = np.asarray(drawn).astype(np.float32) / 255
    rgb = d[..., :3] * d[..., 3:] * (1 - w[..., None]) + layer[..., :3] * w[..., None]
    alpha = d[..., 3] * (1 - w) + w
    rgb = np.where(alpha[..., None] > 1e-3, rgb / np.maximum(alpha[..., None], 1e-3), 0)
    lab, n = ndimage.label(alpha > .1)                  # loose specks Codex left in the air
    alpha[np.isin(lab, np.nonzero(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)) < 60)[0] + 1)] = 0
    return Image.fromarray((np.dstack([rgb, alpha]).clip(0, 1) * 255 + .5).astype("uint8"), "RGBA")


def build():
    olds = cells(BEFORE)
    frames = list(olds)
    frames[0] = olds[5]
    for name, (idx, _) in CANVAS.items():
        raw = WORK / f"attack-redraw-{name}-raw.png"
        for j, i in enumerate(idx):
            if i in PLAN:
                frames[i] = hold(i, fit(raw, i, j, olds))
    sheet = Image.new("RGBA", (N * 3, N * 2))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, ((i % 3) * N, (i // 3) * N))
    sheet.save(SHEET, quality=92, alpha_quality=100, method=6)
    retone_cyan.process(SHEET)
    # head anchors (256px space) follow the eyes: the old sheet's sat 85px above and 9px right of them at 512px
    sheet = np.asarray(Image.open(SHEET).convert("RGBA"))
    heads = []
    for i in range(6):
        ex, ey, _ = landmarks(sheet[(i // 3) * N:(i // 3 + 1) * N, (i % 3) * N:(i % 3 + 1) * N])
        heads.append([round((ex + 9) / 2), round((ey - 85) / 2)])
    forms = HERE.parent / "forms.json"
    data = json.loads(forms.read_text(encoding="utf-8"))
    data["forms"]["3"]["actions"]["attack"]["heads"] = heads
    forms.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("heads", heads)


if __name__ == "__main__":
    {"guide": guide, "build": build}.get(sys.argv[1], lambda: [draw(n) for n in (sys.argv[2:3] or CANVAS)])()
