"""Pack Hiro's form 2/3 skill FX (src/forms-hiro.js) into runtime strips beside form 1's.

Input: <name>/raw-sheet.png, the untouched Codex image_gen sheet (solid #FF00FF background, prompt in
<name>/prompt-used.txt, written by fx_prompts_plain.py). The generate2dsprite processor keys out the magenta;
a despill pass then fades the pink fringe and unpink() takes dust and wind Codex tinted toward the key back to
sandy beige (the plain FX hold no pink or violet). The `jewel` path is kept for jewel-light art (rubies and
indigo amethysts: only rose pixels near the cut edge fade, rose pixels inside go back to warm gold). Every frame of a sheet is cut with
ONE shared box (the union of all frames) so a sequence keeps its own motion and ground line, then the
whole sheet is scaled uniformly to the runtime cell, as Yuki's export_fx.py does.
Output: <name>.webp strips, merged into fx.json (read by build.py as ART.heroFx.novice). Form 1's
entries (slash, burst, aura: export_fx.py) are kept as they are.

  python assets/fx/heroes/novice/export_form_fx.py
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
PROCESSOR = Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py'
spec = importlib.util.spec_from_file_location('generate2dsprite', PROCESSOR)
g2d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g2d)

# name: (cols, rows, frames, runtime cell height, ms per frame, frame whose lowest pixel is the ground line or None, jewel palette)
FX = {
    'f2-gale': (3, 2, 6, 256, 90, 0, False),       # the traveller's wind whirling round his boots (loop)
    'f2-slash': (3, 2, 6, 256, 50, None, False),   # one steel cut of the chain (turned per cut)
    'f2-cross': (4, 2, 8, 320, 70, None, False),   # the finishing cross cut that bursts into wind and leaves
    # plain redesign (owner 07/11): no jewel light left, so no form keeps rose pixels
    # six-star redo (owner 13/11, fx_prompts_f3v2.py): hilt stones, the steel blade-aura, the ground split, the basic
    # down-cut with sparks, the boot dust
    'f3-hilt': (2, 4, 8, 192, 90, None, False),
    'f3-cleave': (2, 4, 8, 448, 45, None, False),
    'f3-split': (2, 4, 8, 384, 70, 0, False),
    'f3-downcut': (2, 4, 8, 320, 40, None, False),
    'f3-dust': (2, 4, 8, 192, 60, 0, False),
}


def unpink(a):
    """Plain redesign: Codex tints the dust and wind of these sheets toward the magenta key (salmon, rose, lilac).
    Pixels that lean pink go to sandy beige at their own brightness; saturated reds (the dull red mote) and
    neutral whites, greys and beiges stay."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    w = np.clip((b - g + 30) / 25, 0, 1) * np.clip((r - g - 10) / 20, 0, 1) * np.clip((g - .5 * r) / 20, 0, 1)
    lum = .299 * r + .587 * g + .114 * b
    for ch, k in enumerate((1.08, 1.0, .84)):
        a[..., ch] = a[..., ch] * (1 - w) + np.minimum(255, lum * k) * w


def despill(frame, jewel):
    a = np.asarray(frame, dtype=np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    spill = np.minimum(r, b) - g
    if jewel:
        edge = ndimage.distance_transform_edt(al > 24) <= 3
        rose = edge & (r > .85 * b) & (spill > 20)
        al *= np.where(rose, 1 - np.clip((spill - 20) / 60, 0, 1), 1)
        a[..., 0] = np.where(rose, np.minimum(r, np.maximum(g, b * .8)), r)
        # a faded gold ring Codex blended toward the key reads pink: it goes back to warm gold at its own brightness
        pink = ~rose & (r > .85 * b) & (spill > 30)
        lum = .299 * r + .587 * g + .114 * b
        for ch, k in enumerate((1.12, .92, .58)):
            a[..., ch] = np.where(pink, np.minimum(255, lum * k), a[..., ch])
    else:
        al *= 1 - np.clip((spill - 10) / 50, 0, 1)
        lift = np.clip(spill, 0, None)       # the magenta share left in a fringe pixel: taken out of red and blue
        a[..., 0], a[..., 2] = r - lift, b - lift
        unpink(a)
    a[..., 3] = al
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


def main():
    meta = json.loads((ROOT / 'fx.json').read_text(encoding='utf-8'))
    for name, (cols, rows, count, cell_h, duration, ground, jewel) in FX.items():
        raw = Image.open(ROOT / name / 'raw-sheet.png').convert('RGBA')
        clean = g2d.remove_bg_magenta(raw.copy(), 100, 150)
        cw, ch = raw.width // cols, raw.height // rows
        frames = [despill(clean.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)), jewel) for i in range(count)]
        boxes = [f.getchannel('A').point(lambda v: 255 if v >= 24 else 0).getbbox() for f in frames]
        box = [min(b[0] for b in boxes if b), min(b[1] for b in boxes if b), max(b[2] for b in boxes if b), max(b[3] for b in boxes if b)]
        pad = round(max(box[2] - box[0], box[3] - box[1]) * .02)
        box = [max(0, box[0] - pad), max(0, box[1] - pad), min(cw, box[2] + pad), min(ch, box[3] + pad)]
        scale = cell_h / (box[3] - box[1])
        out_w, out_h = round((box[2] - box[0]) * scale), cell_h
        strip = Image.new('RGBA', (out_w * count, out_h), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            strip.alpha_composite(f.crop(box).resize((out_w, out_h), Image.Resampling.LANCZOS), (out_w * i, 0))
        strip.save(ROOT / f'{name}.webp', 'WEBP', quality=88, alpha_quality=90, method=6)
        entry = {'file': f'assets/fx/heroes/novice/{name}.webp', 'count': count, 'frameDuration': duration, 'aspect': round(out_w / out_h, 4)}
        if ground is not None:   # ground line as a share of the cell height, measured on the drawn frame
            entry['foot'] = round((boxes[ground][3] - box[1]) / (box[3] - box[1]), 4)
        meta[name] = entry
        print('[ok]', name, entry)
    (ROOT / 'fx.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
