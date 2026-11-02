"""Hero pictures cut at small cells (256px, some 384px) looked soft beside the sharp ones: Codex redraws them at full
resolution, the same poses in the same places, and every frame is checked against the old one. Combat sheets and
resting frames go to 512px cells, the showcase actions outside combat to 640px.

  python assets/heroes/forms/sharpen_heroes.py draw [workers] [job ...]   Codex + key, into <hero>/form-N/sharp/
  python assets/heroes/forms/sharpen_heroes.py refit [job ...]            refits the kept raws, no Codex
  python assets/heroes/forms/sharpen_heroes.py apply [job ...]            copies the accepted sheets over the live ones
  python assets/heroes/forms/sharpen_heroes.py list

The old pixels come from the commit below, so a redraw can be repeated. A 2 x 4 showcase sheet is drawn as two 2 x 2
halves (Codex's tall canvas holds only ~440px cells).

Second pass (PAIRED): a whole 3 x 2 sheet on one canvas leaves each frame small, so even redrawn it stayed softer than
the resting frame (drawn alone, large). These sheets are drawn two frames at a time on Codex's wide canvas (~880px a
frame), from the live drawings at PAIR_OLD, with the form's crisp resting frame shown for its rendering. After apply: rig_idle.py fit + bake (+ surge for combat) for
the resting frames, then the builds.
"""
import json
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
SHOW = 640
MIN_IOU = .8           # of a frame's silhouette with the old one; thin blades lower it, a moved pose fails it
MAX_FOOT = .02         # the soles' shift, as a share of the cell
# Violet glows and lilac hair (Noct, Yuki, Lumi) take on a magenta backdrop's tint and lose it to the key: green for them
GREEN = ((0, 255, 0), "green #00FF00")
BACKDROP = {"shadow": GREEN, "ice": GREEN, "lightning": GREEN}
MAGENTA = ((255, 0, 255), "magenta #FF00FF")


PAIR_OLD = "609627ff"
# The sheets a detail-per-body audit (and a look at each) found softer or paler than their form's resting frame
PAIRED = """novice-attack novice-cast novice-hurt
fire-attack fire-hurt fire-smash fire-run fire3-skill fire3-attack fire3-run fire3-cast
ice-attack ice-cast ice-hurt ice2-attack ice2-skill ice2-run ice2-cast ice3-show-fanwave ice3-show-twirl
earth-attack earth-cast earth-hurt earth-run earth-smash earth2-attack earth2-cast earth2-run earth3-attack earth3-cast earth3-run
lightning-attack lightning-hover lightning-run lightning-cast lightning2-skill lightning2-hover
lightning3-attack lightning3-cast lightning3-skill lightning3-ride lightning3-run lightning3-show-orbitspin lightning3-show-wingtwirl
shadow-attack shadow-cast shadow2-attack shadow2-attackLeft shadow2-run shadow3-hover shadow3-cast""".split()


def form1_sheets():
    for hero, actions in (("fire", "attack cast hurt run smash"), ("earth", "attack cast hurt run smash"), ("ice", "attack cast hurt run"),
                          ("lightning", "attack cast hurt hover run")):
        for action in actions.split():
            yield hero, action, f"assets/reimagined/heroes/{hero}/{action}.webp", 3, 2
    for action in ("attack", "cast", "hover"):
        yield "shadow", action, f"assets/heroes/shadow/{action}.webp", 3, 2
    for action, cols, rows in (("attack", 3, 2), ("cast", 3, 2), ("hurt", 3, 2), ("run", 2, 2), ("skill", 3, 2)):
        yield "novice", action, f"assets/heroes/novice/{action}.webp", cols, rows


# Forms 2 and 3: the combat sheets below 512px or upscaled into it (the drawn idle sheets rest in their mesh rigs)
FORM_SHEETS = {
    ("earth", 2): "attack cast run", ("earth", 3): "attack cast run",
    ("ice", 2): "attack cast run skill", ("ice", 3): "attack cast run skill",
    ("lightning", 2): "attack cast run hover skill", ("lightning", 3): "run hover",
    ("shadow", 2): "attack attackLeft cast run skill", ("shadow", 3): "attack cast run hover",
    ("fire", 3): "cast",
}
SOFT_RESTS = (("earth", 2), ("earth", 3), ("ice", 2), ("ice", 3), ("lightning", 2), ("lightning", 3), ("shadow", 2), ("shadow", 3))
# Rests drawn pale, with thin light outlines and loose specks (sharp by the measure, unclear in the game): Codex also
# sees a frame of the same form drawn cleanly, (sheet, cols, rows, frame), and takes its rendering
STYLE = {"lightning3-rest": ("assets/heroes/forms/lightning/form-3/hover.webp", 3, 2, 0)}
SHOWCASE_SKIP = {"idle"}     # the showcase rests in its mesh rig; idle.webp gives only the poster
# Noct form 2 fades into his shadow and out again on purpose: the redraw drew the fade sharp, the old sheet stays
KEEP_SHEETS = {"shadow2-show-eyeflare"}
# Frames whose redraw went wrong and that show only for a blink keep the old drawing, upscaled (frame indices)
KEEP_FRAMES = {"lightning2-show-entrance": [2]}   # the glowing outline of Lumi: Codex filled one leg grey


def jobs():
    out = {}
    for h, a, p, c, r in form1_sheets():
        out[f"{h}-{a}"] = dict(hero=h, form=1, name=a, path=p, cols=c, rows=r, cell=CELL)
    for hero in ("novice", "fire", "ice", "earth", "lightning", "shadow"):
        out[f"{hero}-rest"] = dict(hero=hero, form=1, name="rest", path=f"assets/heroes/forms/{hero}/form-1/rig/combat/rest.png", cols=1, rows=1, cell=512)
        if hero != "fire":     # Mika's town sheet is already 640px
            out[f"{hero}-rest-show"] = dict(hero=hero, form=1, name="rest-show", path=f"assets/heroes/forms/{hero}/form-1/rig/show/rest.png", cols=1, rows=1, cell=SHOW)
    for (hero, form), actions in FORM_SHEETS.items():
        for a in actions.split():
            out[f"{hero}{form}-{a}"] = dict(hero=hero, form=form, name=a, path=f"assets/heroes/forms/{hero}/form-{form}/{a}.webp", cols=3, rows=2, cell=CELL)
    for hero, form in SOFT_RESTS:
        out[f"{hero}{form}-rest"] = dict(hero=hero, form=form, name="rest", path=f"assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png", cols=1, rows=1, cell=512)
    for hero in ("fire", "ice", "earth", "lightning", "shadow"):
        for form in (2, 3):
            out[f"{hero}{form}-rest-show"] = dict(hero=hero, form=form, name="rest-show", path=f"assets/heroes/forms/{hero}/form-{form}/rig/show/rest.png", cols=1, rows=1, cell=SHOW)
    for sheet in sorted(FORMS.glob("*/form-*/showcase/*.webp")):
        hero, form = sheet.parents[2].name, int(sheet.parents[1].name.split("-")[1])
        if sheet.stem in SHOWCASE_SKIP or Image.open(sheet).width // 2 >= SHOW and detail(sheet) > 8:
            continue
        out[f"{hero}{form}-show-{sheet.stem}"] = dict(hero=hero, form=form, name=f"show-{sheet.stem}", path=sheet.relative_to(ROOT).as_posix(), cols=2, rows=4, cell=SHOW, split=2)
    for name, style in STYLE.items():
        out[name]["style"] = style
    for hero in ("fire", "ice", "earth", "lightning", "shadow"):
        for form, entry in json.loads((FORMS / hero / "forms.json").read_text(encoding="utf-8"))["forms"].items():
            for a, sh in entry["actions"].items():
                out.setdefault(f"{hero}{form}-{a}", dict(hero=hero, form=int(form), name=a, path=sh["file"], cols=sh["cols"], rows=sh["rows"], cell=CELL))
    for sheet in sorted(FORMS.glob("*/form-*/showcase/*.webp")):
        hero, form = sheet.parents[2].name, int(sheet.parents[1].name.split("-")[1])
        out.setdefault(f"{hero}{form}-show-{sheet.stem}", dict(hero=hero, form=form, name=f"show-{sheet.stem}", path=sheet.relative_to(ROOT).as_posix(), cols=2, rows=4, cell=SHOW))
    for name in PAIRED:
        job = out[name]
        job.update(pair=True, old=PAIR_OLD, cell=SHOW if job["name"].startswith("show-") else CELL,
                   style=(f"assets/heroes/forms/{job['hero']}/form-{job['form']}/rig/combat/rest.png", 1, 1, 0))
        job.pop("split", None); job.pop("keep", None)
    for name in KEEP_SHEETS:
        out.pop(name, None)
    for name, keep in KEEP_FRAMES.items():
        if name in out:       # a sheet redrawn already is sharp and leaves the list
            out[name]["keep"] = keep
    return out


def detail(path):
    """How much a showcase sheet holds beyond 256px (an upscaled 256px picture keeps ~1-3, a sharp one 10-15)."""
    im = Image.open(path).convert("RGBA"); w, h = im.width // 2, im.height // 4
    vals = []
    for i in range(8):
        c = np.asarray(im.crop(((i % 2) * w, (i // 2) * h, (i % 2 + 1) * w, (i // 2 + 1) * h)).resize((512, 512), Image.Resampling.LANCZOS), dtype=np.float32)
        m = c[..., 3] > 128
        if m.sum() < 500:
            continue
        rgb = c[..., :3] * c[..., 3:] / 255
        back = np.asarray(Image.fromarray(rgb.astype("uint8")).resize((256, 256), Image.Resampling.LANCZOS).resize((512, 512), Image.Resampling.LANCZOS), dtype=np.float32)
        vals.append(np.abs(rgb - back)[m].mean())
    return float(np.median(vals)) if vals else 0.


def rules(job):
    return f"""Keep everything about the character exactly: identity, face, eyes, hair, every part of the costume and every ornament, weapon, palette family, proportions and chibi style. Do not redesign, add or remove anything, and keep any drawn effect that is already there.
Improve only the rendering quality: redraw it as a crisp, high-resolution finished game illustration with clean sharp dark outlines, fine readable detail in hair strands, cloth folds and metal, rich saturated colours and clear highlights. No blur, no soft focus, no painterly smear, no pixelation.
Background 100% solid flat {BACKDROP.get(job['hero'], MAGENTA)[1]}. No gradients in the background, no text, no labels, no shadow on the ground."""


def prompt(job, rows):
    if job["cols"] == 1:
        style = """
Image 1 is drawn pale, with thin light outlines and loose pink specks around it. Image 2 is the same character drawn cleanly in another pose: render Image 1's pose the way Image 2 is rendered (its dark outlines, solid saturated colours, crisp metal and hair), with no specks, dust or sparkles floating around her. Take only the rendering from Image 2, never its pose.""" if job.get("style") else ""
        return f"""Image 1 is a chibi game character sprite that was upscaled from a tiny image and looks blurry. Redraw EXACTLY the same picture at full resolution on a square canvas: the same pose, the same limb and weapon angles, the same size and the same position on the canvas, every outline where it is in Image 1.{style}
{rules(job)}
The entire character stays inside the canvas with a margin of background."""
    n = job["cols"] * rows
    if job.get("pair"):
        return f"""Image 1 shows {n} animation frame{'s' if n > 1 else ''} of a chibi game character side by side ({n} equal square cells in one row), drawn small and soft. Redraw EXACTLY the same frames at full resolution on a wide landscape canvas, {n} equal square cells in one row: in every cell the same pose, the same limb and weapon angles, the same size and the same position inside the cell as Image 1, any drawn effect where it is. No borders between cells. Nothing crosses a cell edge.
Image 2 is the same character drawn crisply in its resting pose: render the frames the way Image 2 is rendered (its clean dark outlines, solid saturated colours, crisp metal, fur and hair), with no loose specks or dust floating around. Take only the rendering from Image 2, never its pose.
{rules(job)}"""
    return f"""Image 1 is a {job['cols']} by {rows} animation sheet of a chibi game character ({n} equal cells, read left to right, top to bottom) that was upscaled from small frames and looks blurry. Redraw EXACTLY the same sheet at full resolution with exactly {n} equal cells: in every cell the same pose, the same limb and weapon angles, the same size and the same position inside the cell as Image 1. Same camera distance in all cells. No borders between cells. Nothing crosses a cell edge.
{rules(job)}"""


def old_image(job):
    data = subprocess.run(["git", "show", f"{job.get('old', OLD)}:{job['path']}"], cwd=ROOT, capture_output=True, check=True).stdout
    return Image.open(BytesIO(data)).convert("RGBA")


def key(raw, hero=None):
    """The backdrop out, keeping what is enclosed: only backdrop joined to the canvas edge goes, plus pure pockets."""
    colour = np.float32(BACKDROP.get(hero, MAGENTA)[0])
    a = np.asarray(raw.convert("RGB"), dtype=np.float32)
    d = np.sqrt(((a - colour) ** 2).sum(-1))
    near = d < 120
    lab, _ = ndimage.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0]) | (d < 40)
    alpha = np.where(bg, np.clip((d - 60) / 80, 0, 1), 1.)
    if colour[1] > 0:
        # green shows through the gaps between hair strands, enclosed or not: how far green stands above red and
        # blue is how much backdrop a pixel holds
        spill = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
        alpha = np.minimum(alpha, np.clip(1 - (spill - 40) / 140, 0, 1))
    k = alpha[..., None]
    rgb = np.where(k > .02, (a - (1 - k) * colour) / np.maximum(k, .02), 0).clip(0, 255)
    # what stays of the backdrop in the outline's soft edge: on the rim the backdrop's channels may not stand above the others
    rim = ndimage.binary_dilation(bg, iterations=max(3, a.shape[0] // 256))
    if colour[1] > 0:
        # Codex also tints the gaps between hair strands; nothing green is drawn on these heroes, so green may stand
        # above red and blue nowhere (cyan and teal keep theirs)
        rgb[..., 1] = np.minimum(rgb[..., 1], np.maximum(rgb[..., 0], rgb[..., 2]))
    else:
        over = np.maximum(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0) * rim
        rgb[..., 0] -= over; rgb[..., 2] -= over
    return Image.fromarray(np.dstack([rgb.clip(0, 255), alpha * 255]).astype("uint8"), "RGBA")


def fit_raw(raw, old, job):
    """Codex keeps the poses but draws them larger, and a foot may cross into the next cell. Each drawn piece goes to the
    cell its centre lies in, one scale serves the whole sheet (no frame is zoomed on its own, so the body keeps one size),
    and each frame then lies where the old frame lay."""
    keyed = np.asarray(key(raw, job["hero"]), dtype=np.float32) / 255
    keyed = np.dstack([keyed[..., :3] * keyed[..., 3:], keyed[..., 3]])
    H, W = keyed.shape[:2]
    cw, ch = W / job["cols"], H / job["rows"]
    lab, count = ndimage.label(keyed[..., 3] > .5, structure=np.ones((3, 3)))
    centres = ndimage.center_of_mass(np.ones((H, W)), lab, range(1, count + 1)) if count else []
    owner = np.array([0] + [min(int(y // ch), job["rows"] - 1) * job["cols"] + min(int(x // cw), job["cols"] - 1) + 1 for y, x in centres])
    near = ndimage.distance_transform_edt(lab == 0, return_distances=False, return_indices=True)
    pieces = owner[lab[tuple(near)]]              # the soft edge belongs to the piece next to it
    n = job["cell"]
    olds = [np.asarray(f.resize((n, n), Image.Resampling.LANCZOS)) for f in frames(old, job)]
    drawn, ratios = [], []
    for i, was in enumerate(olds):
        cut = keyed * (pieces == i + 1)[..., None]
        ys, xs = np.where(cut[..., 3] > .5)
        wy, wx = np.where(was[..., 3] > 128)
        if not len(ys) or not len(wy):
            drawn.append(None); continue
        box = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
        drawn.append(cut[box[0]:box[1], box[2]:box[3]])
        ratios.append(((wy.max() - wy.min() + 1) * (wx.max() - wx.min() + 1)) / ((box[1] - box[0]) * (box[3] - box[2])))
    scale = float(np.median(ratios)) ** .5 if ratios else 1.
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
        if ma.sum() < 200 or mb.sum() < 200:      # an empty frame, or a few sparks of an entrance
            continue
        worst = min(worst, (ma & mb).sum() / (ma | mb).sum())
        foot = max(foot, abs(int(np.where(ma.any(1))[0].max()) - int(np.where(mb.any(1))[0].max())) / n)
    return worst, foot


def parts(job):
    """(sub-job, its old pixels, tag, the sheet's frame indices it holds). A tall showcase sheet is drawn in halves of
    `split` rows; a paired sheet two frames at a time, side by side."""
    old = old_image(job)
    count = job["cols"] * job["rows"]
    if job.get("pair"):
        n, olds, out = job["cell"], frames(old, job), []
        for k in range(0, count, 2):
            idx = list(range(k, min(k + 2, count)))
            strip = Image.new("RGBA", (n * len(idx), n))
            for j, i in enumerate(idx):
                strip.alpha_composite(olds[i].resize((n, n), Image.Resampling.LANCZOS), (j * n, 0))
            out.append(({**job, "cols": len(idx), "rows": 1}, strip, f"-p{k // 2}", idx))
        return out
    split = job.get("split")
    if not split:
        return [(job, old, "", list(range(count)))]
    h = old.height // job["rows"]
    return [({**job, "rows": split}, old.crop((0, k * h, old.width, (k + split) * h)), f"-{k // split}",
             list(range(k * job["cols"], (k + split) * job["cols"]))) for k in range(0, job["rows"], split)]


def work_dir(job):
    return FORMS / job["hero"] / f"form-{job['form']}/sharp"


def draw_part(name, job, old, tag):
    work = work_dir(job); work.mkdir(exist_ok=True)
    target = (job["cell"] * job["cols"], job["cell"] * job["rows"])
    ref = Image.new("RGBA", old.size, BACKDROP.get(job["hero"], MAGENTA)[0] + (255,)); ref.alpha_composite(old)
    tmp = work / f"{job['name']}{tag}-ref.png"
    ref.convert("RGB").resize(target if job["cols"] > 1 else (1024, 1024), Image.Resampling.LANCZOS).save(tmp)
    pf = work / f"{job['name']}{tag}-prompt.txt"; pf.write_text(prompt(job, job["rows"]) + "\n", encoding="utf-8")
    raw = work / f"{job['name']}-raw{tag}.png"
    refs = ["--ref", str(tmp)]
    if job.get("style"):
        path, cols, rows, i = job["style"]
        cell = frames(Image.open(ROOT / path).convert("RGBA"), dict(cols=cols, rows=rows))[i]
        sty = work / f"{job['name']}{tag}-style.png"
        flat = Image.new("RGBA", cell.size, BACKDROP.get(job["hero"], MAGENTA)[0] + (255,)); flat.alpha_composite(cell)
        flat.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(sty); refs += ["--ref", str(sty)]
    best = None
    for model, effort in LADDER:
        r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(pf), "--out", str(raw), *refs, "--model", model, "--effort", effort,
                            "--timeout", "900"], capture_output=True, text=True, encoding="utf-8", errors="replace", creationflags=0x08000000)
        if r.returncode or not raw.exists():
            print(name + tag, effort, "gen failed", r.stderr[-200:].replace("\n", " "), flush=True); continue
        new, _ = fit_raw(Image.open(raw), old, job)
        iou, foot = check(new, old, job)
        if best is None or iou > best[0]:
            best = (iou, foot, effort, new, raw.read_bytes())
        if iou >= MIN_IOU and foot <= MAX_FOOT:
            break
    tmp.unlink(missing_ok=True)
    if job.get("style"):
        sty.unlink(missing_ok=True)
    if best is None:
        print(name + tag, "FAIL no image", flush=True); return None
    raw.write_bytes(best[4])
    return best


def save(name, job, results, how):
    """results: (the part's fitted frames as one image, the sheet frame indices they fill)."""
    n = job["cell"]
    new = Image.new("RGBA", (n * job["cols"], n * job["rows"]))
    for part, idx in results:
        w = part.width // n
        for j, i in enumerate(idx):
            new.alpha_composite(part.crop(((j % w) * n, (j // w) * n, (j % w + 1) * n, (j // w + 1) * n)), ((i % job["cols"]) * n, (i // job["cols"]) * n))
    old = old_image(job)
    for i in job.get("keep", []):
        x, y = (i % job["cols"]) * n, (i // job["cols"]) * n
        new.paste(frames(old, job)[i].resize((n, n), Image.Resampling.LANCZOS), (x, y))
    iou, foot = check(new, old, job)
    new.save(work_dir(job) / f"{job['name']}.webp", quality=92, alpha_quality=100, method=6)
    print(f"{name:26} iou {iou:.3f} foot {foot:.3f} {how}{'' if iou >= MIN_IOU and foot <= MAX_FOOT else '  CHECK'}", flush=True)


def draw(name, job):
    results, how = [], []
    for sub, old, tag, idx in parts(job):
        best = draw_part(name, sub, old, tag)
        if best is None:
            return
        results.append((best[3], idx)); how.append(best[2])
    save(name, job, results, "/".join(how))


def refit(name, job):
    results, scales = [], []
    for sub, old, tag, idx in parts(job):
        new, scale = fit_raw(Image.open(work_dir(job) / f"{job['name']}-raw{tag}.png"), old, sub)
        results.append((new, idx)); scales.append(f"{scale:.3f}")
    save(name, job, results, "scale " + "/".join(scales))


def apply(names):
    everything = jobs()
    for name in names or everything:
        job = everything[name]
        src = work_dir(job) / f"{job['name']}.webp"
        if not src.exists():
            print("missing", name); continue
        live = ROOT / job["path"]
        if live.suffix == ".png":
            Image.open(src).convert("RGBA").save(live)
        else:
            live.write_bytes(src.read_bytes())


if __name__ == "__main__":
    everything = jobs()
    if sys.argv[1] == "list":
        for k, j in everything.items():
            print(f"{k:28} {j['path']}")
    elif sys.argv[1] == "apply":
        apply(sys.argv[2:])
    elif sys.argv[1] == "refit":
        for k in sys.argv[2:] or everything:
            refit(k, everything[k])
    else:
        workers = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        wanted = sys.argv[3:] or list(everything)
        with ThreadPoolExecutor(workers) as e:
            list(e.map(lambda k: draw(k, everything[k]), wanted))
        print("DONE", flush=True)
