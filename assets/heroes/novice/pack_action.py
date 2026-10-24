"""Pack a processed Tân action (generate2dsprite.py process output, preserve/feet) into a 256px atlas.

The processor runs on a larger cell so raised swords keep their headroom; this only crops each
frame to a 256 cell with the feet anchor on the shared floor (y=244 like every Tân sheet) and the
body anchor at x=128 (shifted only as far as needed to keep a wide pose inside the cell).
No art is drawn or resized here.

  python assets/heroes/novice/pack_action.py <proc dir> <prefix> <cols> <rows> <out atlas.webp> [floor]
"""
import json
import sys

import numpy as np
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'scripts'))
from prepare_masters import despill_boundary  # noqa: E402  (same edge despill as every Tân sheet)

FLOOR = 244


def pack(proc, prefix, cols, rows, out, floor=FLOOR, head_x=None):
    """head_x: hold the top of the hair at this x in every frame (a run loop whose feet anchor
    jumps between the support feet), instead of the processor's feet anchor."""
    proc = Path(proc)
    meta = json.loads((proc / 'pipeline-meta.json').read_text(encoding='utf-8'))
    ax, ay = meta['output_origin']
    count = cols * rows
    atlas = Image.new('RGBA', (cols * 256, rows * 256))
    report = []
    for i in range(count):
        frame = despill_boundary(Image.open(proc / f'{prefix}-{i + 1}.png').convert('RGBA'))
        box = frame.getchannel('A').point(lambda a: 255 if a >= 24 else 0).getbbox()
        x0, y0 = round(ax - 128), round(ay - floor)
        if head_x is not None:
            full = np.asarray(frame)[:, :, 3] > 160
            top = int(np.flatnonzero(full.sum(axis=1) >= 14)[0])
            x0 = round(np.median(np.flatnonzero(full[top:top + 12].any(axis=0))) - head_x)
        # Keep wide poses inside the cell: slide the window, never cut the art.
        if box[0] < x0 + 2: x0 = box[0] - 2
        if box[2] > x0 + 254: x0 = box[2] - 254
        if box[1] < y0 + 2: raise SystemExit(f'frame {i + 1}: art above the 256 cell ({box})')
        assert box[0] >= x0 and box[2] <= x0 + 256, (i, box, x0)
        cell = frame.crop((x0, y0, x0 + 256, y0 + 256))
        atlas.alpha_composite(cell, ((i % cols) * 256, (i // cols) * 256))
        # Head anchor: top of the hair (rows at least 14px wide, so a raised wooden blade is skipped).
        mask = np.asarray(cell)[:, :, 3] > 160
        y = int(np.flatnonzero(mask.sum(axis=1) >= 14)[0])
        xs = np.flatnonzero(mask[y:y + 12].any(axis=0))
        report.append({'frame': i + 1, 'window': [x0, y0], 'shiftX': round(ax - 128 - x0), 'head': [int(np.median(xs)), y]})
    atlas.save(out, lossless=True, method=6, exact=True)
    print(json.dumps(report))
    return report


if __name__ == '__main__':
    a = sys.argv
    pack(a[1], a[2], int(a[3]), int(a[4]), a[5], int(a[6]) if len(a) > 6 else FLOOR)


def meta_entry(report, atlas, cols, rows, duration, loop=False, **extra):
    """The meta.json action entry (same fields as Tân's other actions)."""
    count = cols * rows
    return dict(atlas=atlas, frameWidth=256, frameHeight=256, columns=cols, rows=rows, frames=count, count=count, cols=cols,
                frameOrder='row-major', loop=loop, frameDuration=duration, origin=[128, FLOOR],
                headAnchors=[r['head'] for r in report], floorAligned=True, **extra)
