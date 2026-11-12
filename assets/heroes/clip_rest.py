"""Resting frames redrawn in the clip route's rendering (owner 12/11: the rest looked softer and paler than the sharpened
action frames, so every switch between rest and action changed the drawing). Codex redraws the approved resting frame
exactly (pose, outline, size, place) in the rendering of a sharpened action sheet; the result is locked back onto the old
rest (body area, back boot) and accepted only if its silhouette overlaps the old one closely. Then rig_idle fit/bake/surge.

python assets/heroes/clip_rest.py draw  <hero> <form> <style-sheet.png>
python assets/heroes/clip_rest.py apply <hero> <form>          replaces rig/combat/rest.png (+ form 1's sharp/rest.webp)
"""
import json, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import clip_pipeline as cp

PROMPT = """Image 1 is the approved resting drawing of a chibi game character on a magenta background. Redraw EXACTLY Image 1: the same pose, the same outline, the same size and the same position on the canvas, every limb, weapon, hair lock, cloth piece and tail exactly where it is in Image 1, the same face and expression.
Image 2 shows the same character drawn in other poses, in the finished rendering of the game's animation frames: render Image 1 the way Image 2 is rendered (its clean dark outlines, line weight, solid saturated colours, shading, highlights and metal shine), so the resting frame matches those animation frames. Take only the rendering from Image 2, never its poses.
Do not redesign, add or remove anything. Crisp, high-resolution finished game illustration, no blur, no smear.
Background 100% solid flat magenta #FF00FF, no gradients, no text, no shadow on the ground. The whole character stays inside the canvas with a magenta margin."""


PAD = {'3': 1.35}   # six-star Mika's fanned tails fill her cell


def rest_path(hero, form):
    return ROOT / f'assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png'


def work(hero, form):
    d = ROOT / f'assets/heroes/forms/{hero}/clips/rest-f{form}'; d.mkdir(parents=True, exist_ok=True); return d


def draw(hero, form, style):
    d = work(hero, form)
    old = Image.open(rest_path(hero, form)).convert('RGBA')
    (d / 'old-rest.png').exists() or old.save(d / 'old-rest.png')
    pad = PAD.get(form, 1.0); n = round(cp.CELL * pad)   # a rest that fills its cell gets a margin, cut back after
    big = Image.new('RGBA', (n, n), (0, 0, 0, 0)); big.alpha_composite(Image.open(d / 'old-rest.png').convert('RGBA').resize((cp.CELL, cp.CELL)), ((n - cp.CELL) // 2, (n - cp.CELL) // 2))
    cp.on_magenta(big).resize((1024, 1024), Image.LANCZOS).save(d / 'ref-rest.png')
    (d / 'prompt.txt').write_text(PROMPT, encoding='utf-8')
    r = subprocess.run([sys.executable, str(cp.IMAGEGEN), '--prompt-file', str(d / 'prompt.txt'), '--out', str(d / 'raw.png'),
                        '--ref', str(d / 'ref-rest.png'), '--ref', str(Path(style).resolve()), '--model', 'gpt-6.1-sol', '--effort', 'low'],
                       env={**os.environ, 'IMAGEGEN_BACKEND': 'codex'}, capture_output=True, text=True)
    print(r.stdout[-400:], r.stderr[-400:])


def fit(img, old):
    """The redraw scaled and moved to overlap the old rest's silhouette best (a boot hidden by tails can't anchor it)."""
    a = cp.mask(np.asarray(old)); m = cp.mask(np.asarray(img)).astype(np.uint8) * 255
    best = (0, 1.0, 0, 0)
    for s in np.arange(.86, 1.15, .02):
        size = round(cp.CELL * s); ms = np.asarray(Image.fromarray(m).resize((size, size))) > 127
        for dy in range(-60, 61, 3):
            for dx in range(-60, 61, 3):
                x0, y0 = (cp.CELL - size) // 2 + dx, (cp.CELL - size) // 2 + dy
                b = np.zeros((cp.CELL, cp.CELL), bool)
                xs, ys = slice(max(0, x0), min(cp.CELL, x0 + size)), slice(max(0, y0), min(cp.CELL, y0 + size))
                b[ys, xs] = ms[ys.start - y0:ys.stop - y0, xs.start - x0:xs.stop - x0]
                iou = (a & b).sum() / max(1, (a | b).sum())
                if iou > best[0]:
                    best = (iou, s, dx, dy)
    iou, s, dx, dy = best; size = round(cp.CELL * s)
    out = Image.new('RGB', (cp.CELL, cp.CELL), cp.MAG)
    out.paste(img.resize((size, size), Image.LANCZOS), ((cp.CELL - size) // 2 + dx, (cp.CELL - size) // 2 + dy))
    return out, s, iou


def apply(hero, form, write=True):
    d = work(hero, form)
    old = cp.on_magenta(Image.open(d / 'old-rest.png')).resize((cp.CELL, cp.CELL), Image.LANCZOS)
    pad = PAD.get(form, 1.0); n = round(cp.CELL * pad)
    new = Image.open(d / 'raw.png').convert('RGB')
    new = new.resize((new.width * n // max(new.size), new.height * n // max(new.size)), Image.LANCZOS)
    big = Image.new('RGB', (n, n), cp.MAG); big.paste(new, ((n - new.width) // 2, (n - new.height) // 2))
    sq = big.crop(((n - cp.CELL) // 2, (n - cp.CELL) // 2, (n - cp.CELL) // 2 + cp.CELL, (n - cp.CELL) // 2 + cp.CELL))
    locked, s, iou = fit(sq, old)
    print(f'form {form}: scale {s:.3f}, silhouette overlap {iou:.3f}')
    keyed = cp.key_magenta(locked)
    keyed.save(d / 'new-rest.png')
    if iou < .85:
        raise SystemExit('silhouette moved too much: not applied (redraw)')
    if write:
        keyed.save(rest_path(hero, form))
        if form == '1':
            keyed.save(ROOT / f'assets/heroes/forms/{hero}/form-1/sharp/rest.webp', quality=95, method=6)


if __name__ == '__main__':
    cmd, hero, form = sys.argv[1:4]
    draw(hero, form, sys.argv[4]) if cmd == 'draw' else apply(hero, form)
