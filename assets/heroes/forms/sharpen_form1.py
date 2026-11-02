"""Form 1 was cut at 256px cells and looked soft beside the later forms: Codex redraws its resting frames and action
sheets at double resolution, the same poses in the same places, and every frame is checked against the old one.

  python assets/heroes/forms/sharpen_form1.py draw [workers] [job ...]   Codex + key, into <hero>/form-1/sharp/
  python assets/heroes/forms/sharpen_form1.py refit [job ...]            refits the kept raws, no Codex
  python assets/heroes/forms/sharpen_form1.py apply                      copies the accepted sheets over the live ones

The old pixels come from the commit below, so a redraw can be repeated. After apply: rig_idle.py fit + bake + surge
for the resting frames, then the builds.
"""
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage, signal

ROOT = Path(__file__).resolve().parents[3]
FORMS = ROOT / "assets/heroes/forms"
GEN = Path.home() / ".claude/skills/generate2dsprite/scripts/codex_image_gen.py"
OLD = "e0e28c9c"
LADDER = (("gpt-6.1-sol", "low"), ("gpt-6.1-sol", "medium"), ("gpt-6.1-sol", "high"))
CELL = 512
MIN_IOU = .8           # of a frame's silhouette with the old one; thin blades lower it, a moved pose fails it
MAX_FOOT = .02         # the soles' shift, as a share of the cell


def sheet_paths():
    for hero, actions in (("fire", "attack cast hurt run smash"), ("earth", "attack cast hurt run smash"), ("ice", "attack cast hurt run"),
                          ("lightning", "attack cast hurt hover")):
        for action in actions.split():
            yield hero, action, f"assets/reimagined/heroes/{hero}/{action}.webp", 3, 2
    for action in ("attack", "cast", "hover"):
        yield "shadow", action, f"assets/heroes/shadow/{action}.webp", 3, 2
    for action, cols, rows in (("attack", 3, 2), ("cast", 3, 2), ("hurt", 3, 2), ("run", 2, 2), ("skill", 3, 2)):
        yield "novice", action, f"assets/heroes/novice/{action}.webp", cols, rows


def jobs():
    out = {f"{h}-{a}": dict(hero=h, name=a, path=p, cols=c, rows=r, cell=CELL) for h, a, p, c, r in sheet_paths()}
    for hero in ("novice", "fire", "ice", "earth", "lightning", "shadow"):
        out[f"{hero}-rest"] = dict(hero=hero, name="rest", path=f"assets/heroes/forms/{hero}/form-1/rig/combat/rest.png", cols=1, rows=1, cell=512)
        if hero != "fire":     # Mika's town sheet is already 640px
            out[f"{hero}-rest-show"] = dict(hero=hero, name="rest-show", path=f"assets/heroes/forms/{hero}/form-1/rig/show/rest.png", cols=1, rows=1, cell=640)
    return out


RULES = """Keep everything about the character exactly: identity, face, eyes, hair, every part of the costume and every ornament, weapon, palette family, proportions and chibi style. Do not redesign, add or remove anything, and keep any drawn effect that is already there.
Improve only the rendering quality: redraw it as a crisp, high-resolution finished game illustration with clean sharp dark outlines, fine readable detail in hair strands, cloth folds and metal, rich saturated colours and clear highlights. No blur, no soft focus, no painterly smear, no pixelation.
Background 100% solid flat magenta #FF00FF. No gradients in the background, no text, no labels, no shadow on the ground."""


def prompt(job):
    if job["cols"] == 1:
        return f"""Image 1 is a chibi game character sprite that was upscaled from a tiny image and looks blurry. Redraw EXACTLY the same picture at full resolution on a square canvas: the same pose, the same limb and weapon angles, the same size and the same position on the canvas, every outline where it is in Image 1.
{RULES}
The entire character stays inside the canvas with magenta margin."""
    n = job["cols"] * job["rows"]
    return f"""Image 1 is a {job['cols']} by {job['rows']} animation sheet of a chibi game character ({n} equal cells, read left to right, top to bottom) that was upscaled from tiny frames and looks blurry. Redraw EXACTLY the same sheet at full resolution with exactly {n} equal cells: in every cell the same pose, the same limb and weapon angles, the same size and the same position inside the cell as Image 1. Same camera distance in all cells. No borders between cells. Nothing crosses a cell edge.
{RULES}"""


def old_image(job):
    data = subprocess.run(["git", "show", f"{OLD}:{job['path']}"], cwd=ROOT, capture_output=True, check=True).stdout
    return Image.open(BytesIO(data)).convert("RGBA")


def key(raw):
    """Magenta out, keeping what is enclosed: only magenta joined to the canvas edge goes, plus pure magenta pockets."""
    a = np.asarray(raw.convert("RGB"), dtype=np.float32)
    d = np.sqrt(((a - (255, 0, 255)) ** 2).sum(-1))
    near = d < 120
    lab, _ = ndimage.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0]) | (d < 40)
    alpha = np.where(bg, np.clip((d - 60) / 80, 0, 1), 1.)
    alpha = np.minimum(alpha, 1)
    k = alpha[..., None]
    rgb = np.where(k > .02, (a - (1 - k) * np.float32((255, 0, 255))) / np.maximum(k, .02), 0).clip(0, 255)
    # what stays of the backdrop in the outline's soft edge: on the rim, red and blue may not stand above green
    rim = ndimage.binary_dilation(bg, iterations=max(3, a.shape[0] // 256))
    over = np.maximum(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0) * rim
    rgb[..., 0] -= over; rgb[..., 2] -= over
    return Image.fromarray(np.dstack([rgb.clip(0, 255), alpha * 255]).astype("uint8"), "RGBA")


def fit_raw(raw, old, job):
    """Codex keeps the poses but draws them larger, and a foot may cross into the next cell. Each drawn piece goes to the
    cell its centre lies in, one scale serves the whole sheet (no frame is zoomed on its own, so the body keeps one size),
    and each frame then lies where the old frame lay."""
    keyed = np.asarray(key(raw), dtype=np.float32) / 255
    keyed = np.dstack([keyed[..., :3] * keyed[..., 3:], keyed[..., 3]])
    H, W = keyed.shape[:2]
    cw, ch = W / job["cols"], H / job["rows"]
    lab, count = ndimage.label(keyed[..., 3] > .5, structure=np.ones((3, 3)))
    centres = ndimage.center_of_mass(np.ones((H, W)), lab, range(1, count + 1)) if count else []
    owner = np.array([0] + [int(y // ch) * job["cols"] + int(x // cw) + 1 for y, x in centres])
    near = ndimage.distance_transform_edt(lab == 0, return_distances=False, return_indices=True)
    pieces = owner[lab[tuple(near)]]              # the soft edge belongs to the piece next to it
    n = job["cell"]
    olds = [np.asarray(f.resize((n, n), Image.Resampling.LANCZOS)) for f in frames(old, job)]
    drawn, ratios = [], []
    for i, was in enumerate(olds):
        cut = keyed * (pieces == i + 1)[..., None]
        ys, xs = np.where(cut[..., 3] > .5)
        if not len(ys):
            drawn.append(None); continue
        box = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
        drawn.append(cut[box[0]:box[1], box[2]:box[3]])
        wy, wx = np.where(was[..., 3] > 128)
        ratios.append(((wy.max() - wy.min() + 1) * (wx.max() - wx.min() + 1)) / ((box[1] - box[0]) * (box[3] - box[2])))
    scale = float(np.median(ratios)) ** .5
    out = np.zeros((n * job["rows"], n * job["cols"], 4), np.float32)
    for i, (cut, was) in enumerate(zip(drawn, olds)):
        if cut is None:
            continue
        h, w = max(1, round(cut.shape[0] * scale)), max(1, round(cut.shape[1] * scale))
        small = cv2.resize(cut, (w, h), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC).clip(0, 1)
        score = signal.fftconvolve((was[..., 3] > 128).astype(np.float32), (small[::-1, ::-1, 3] > .5).astype(np.float32))
        y, x = np.unravel_index(score.argmax(), score.shape)
        top, left = int(y) - h + 1, int(x) - w + 1
        y0, x0, y1, x1 = max(0, top), max(0, left), min(n, top + h), min(n, left + w)
        ox, oy = (i % job["cols"]) * n, (i // job["cols"]) * n
        out[oy + y0:oy + y1, ox + x0:ox + x1] = small[y0 - top:y1 - top, x0 - left:x1 - left]
    k = out[..., 3:]
    rgba = np.dstack([np.where(k > 1e-3, out[..., :3] / np.maximum(k, 1e-3), 0), k]).clip(0, 1)
    return Image.fromarray((rgba * 255 + .5).astype("uint8"), "RGBA"), scale


def frames(im, job):
    w, h = im.width // job["cols"], im.height // job["rows"]
    return [im.crop((x * w, y * h, (x + 1) * w, (y + 1) * h)) for y in range(job["rows"]) for x in range(job["cols"])]


def check(new, old, job):
    worst, foot = 1., 0.
    for a, b in zip(frames(new, job), frames(old, job)):
        n = job["cell"]
        ma = np.asarray(a.resize((n, n)))[..., 3] > 128
        mb = np.asarray(b.resize((n, n), Image.Resampling.LANCZOS))[..., 3] > 128
        if not ma.any() or not mb.any():
            continue
        worst = min(worst, (ma & mb).sum() / (ma | mb).sum())
        foot = max(foot, abs(int(np.where(ma.any(1))[0].max()) - int(np.where(mb.any(1))[0].max())) / n)
    return worst, foot


def draw(name, job):
    work = FORMS / job["hero"] / "form-1/sharp"; work.mkdir(exist_ok=True)
    old = old_image(job)
    target = (job["cell"] * job["cols"], job["cell"] * job["rows"])
    ref = Image.new("RGBA", old.size, (255, 0, 255, 255)); ref.alpha_composite(old)
    tmp = work / f"{job['name']}-ref.png"
    ref.convert("RGB").resize(target if job["cell"] == CELL else (1024, 1024), Image.Resampling.LANCZOS).save(tmp)
    pf = work / f"{job['name']}-prompt.txt"; pf.write_text(prompt(job) + "\n", encoding="utf-8")
    raw = work / f"{job['name']}-raw.png"
    best = None
    for model, effort in LADDER:
        r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(pf), "--out", str(raw), "--ref", str(tmp), "--model", model, "--effort", effort,
                            "--timeout", "900"], capture_output=True, text=True, encoding="utf-8", errors="replace", creationflags=0x08000000)
        if r.returncode or not raw.exists():
            print(name, effort, "gen failed", r.stderr[-200:].replace("\n", " "), flush=True); continue
        new, _ = fit_raw(Image.open(raw), old, job)
        iou, foot = check(new, old, job)
        if best is None or iou > best[0]:
            best = (iou, foot, effort, new, raw.read_bytes())
        if iou >= MIN_IOU and foot <= MAX_FOOT:
            break
    tmp.unlink(missing_ok=True)
    if best is None:
        print(name, "FAIL no image", flush=True); return
    iou, foot, effort, new, data = best
    raw.write_bytes(data)
    new.save(work / f"{job['name']}.webp", quality=92, alpha_quality=100, method=6)
    print(f"{name:24} iou {iou:.3f} foot {foot:.3f} {effort}{'' if iou >= MIN_IOU and foot <= MAX_FOOT else '  CHECK'}", flush=True)


def refit(name, job):
    work = FORMS / job["hero"] / "form-1/sharp"
    old = old_image(job)
    new, scale = fit_raw(Image.open(work / f"{job['name']}-raw.png"), old, job)
    iou, foot = check(new, old, job)
    new.save(work / f"{job['name']}.webp", quality=92, alpha_quality=100, method=6)
    print(f"{name:24} iou {iou:.3f} foot {foot:.3f} scale {scale:.3f}{'' if iou >= MIN_IOU and foot <= MAX_FOOT else '  CHECK'}", flush=True)


def apply():
    for name, job in jobs().items():
        src = FORMS / job["hero"] / f"form-1/sharp/{job['name']}.webp"
        if not src.exists():
            print("missing", name); continue
        live = ROOT / job["path"]
        if live.suffix == ".png":
            Image.open(src).convert("RGBA").save(live)
        else:
            live.write_bytes(src.read_bytes())


if __name__ == "__main__":
    if sys.argv[1] == "apply":
        apply()
    elif sys.argv[1] == "refit":
        everything = jobs()
        for k in sys.argv[2:] or everything:
            refit(k, everything[k])
    else:
        everything = jobs()
        workers = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        wanted = sys.argv[3:] or list(everything)
        with ThreadPoolExecutor(workers) as e:
            list(e.map(lambda k: draw(k, everything[k]), wanted))
        print("DONE", flush=True)
