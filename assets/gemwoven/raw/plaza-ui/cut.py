"""Cut the Codex-drawn plaza UI sheets into separate pieces (assets/gemwoven/plaza/ui/<name>.webp).

Each raw sheet <sheet>-raw.png sits on flat magenta. generate2dsprite.py keys it to sheet-transparent.png;
this script labels the opaque islands (close islands merge), orders them in reading order, names them
from PIECES, crops with a small margin, removes the pink fringe and saves WebP.

  python assets/gemwoven/raw/plaza-ui/cut.py <sheet> [--keep]   (sheet name without -raw.png; 'all' for every sheet)
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = ROOT / 'assets/gemwoven/plaza/ui'
PROC = Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py'

# Names in reading order (rows top to bottom, left to right). None drops an island.
PIECES = {
    'sheet-controls': ['back', 'sign', 'seal', 'strip', 'plaque', 'action'],
    'sheet-composer': ['ledge', 'rail', 'chan', 'field', 'send'],
    'sheet-world': ['plate', 'plate-me', 'npc-tag', 'knot', 'crest', 'lamp-on', 'lamp-wait', 'lamp-off', 'lamp-dark',
                    'bubble', 'bubble-tail', 'stick-ring', 'stick-thumb', 'arrow'],
    'sheet-fittings': ['close', 'socket', 'tile', 'tile-on', 'tab', 'tab-on', 'tag', 'switch', 'knob', 'field-form', 'notice',
                       'trough', 'fill'],
    'sheet-icons': ['i-friends', 'i-guild', 'i-emote', None, 'i-gate', 'i-lantern', 'i-swords', 'i-board', 'i-goto', 'i-letter',
                    'i-heart', 'i-near', 'i-map', 'i-log', 'i-help', 'i-invite', 'i-block', 'i-report', 'i-checkin', None],
    'sheet-emotes': ['e-wave', 'e-laugh', 'e-love', 'e-cheer', 'e-think', 'e-cry', 'e-angry', 'e-duel'],
    'sheet-emblems': ['g-sword', 'g-shield', 'g-crown', 'g-gem', 'g-moon', 'g-sun', 'g-leaf', 'g-flame', 'g-wave', 'g-star', 'g-owl', 'g-fox'],
    'sheet-extras': ['t-red', 't-blue', 't-gold', 'h-walk', 'h-chat', 'h-meet', 'h-spar', 'h-guild', 'x-recruit', 'x-calendar',
                     'x-empty', None],
    'sheet-states': ['tile-off', 'switch-on', 'switch-off', 'knob-off', 'i-goto-off', 'i-heart-done'],
}
# Icon sheets are cut by their grid cells (columns, rows): small marks around an icon stay with it.
GRID = {'sheet-icons': (5, 4), 'sheet-emotes': (4, 2), 'sheet-emblems': (4, 3), 'sheet-extras': (4, 3)}
# Merge distance (px) for islands that belong together (ivy, chains, clasps).
MERGE = {'sheet-controls': 14, 'sheet-composer': 10, 'sheet-world': 8, 'sheet-fittings': 3}
ROWS = {}  # optional explicit row count per sheet


def key(sheet):
    raw = HERE / f'{sheet}-raw.png'
    proc = HERE / f'proc-{sheet}'
    subprocess.run([sys.executable, str(PROC), 'process', '--input', str(raw), '--target', 'asset', '--mode', 'single',
                    '--output-dir', str(proc), '--rows', '1', '--cols', '1', '--scale-strategy', 'preserve',
                    '--allow-source-edge-touch', '--component-mode', 'all'], check=True, capture_output=True)
    return proc / 'raw-sheet-clean.png'


def despill(rgba):
    a = rgba[..., 3].astype(np.float32) / 255
    r, g, b = [rgba[..., i].astype(np.float32) for i in range(3)]
    # Pink fringe: red and blue well above green near the edge. Pull them down to green's level.
    spill = np.clip(np.minimum(r, b) - g, 0, None)
    edge = (a < 1) | (ndimage.binary_erosion(a > .5, iterations=2) == 0)
    k = np.where(edge, 1.0, 0.0) * (spill > 18)
    rgba[..., 0] = np.clip(r - spill * k * .9, 0, 255)
    rgba[..., 2] = np.clip(b - spill * k * .9, 0, 255)
    # Drop nearly transparent specks.
    rgba[..., 3] = np.where(a < .06, 0, rgba[..., 3])
    return rgba


def islands(img, merge):
    alpha = np.array(img)[..., 3] > 24
    grown = ndimage.binary_dilation(alpha, iterations=merge) if merge else alpha
    lab, n = ndimage.label(grown)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        mask = (lab[sl] == i) & alpha[sl]
        if mask.sum() < 400:
            continue
        boxes.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, i))
    # Reading order: group by vertical overlap into rows.
    boxes.sort(key=lambda b: (b[0] + b[1]) / 2)
    rows = []
    for b in boxes:
        cy = (b[0] + b[1]) / 2
        for row in rows:
            top, bot = min(x[0] for x in row), max(x[1] for x in row)
            if top <= cy <= bot:
                row.append(b)
                break
        else:
            rows.append([b])
    order = []
    for row in rows:
        order += sorted(row, key=lambda b: b[2])
    return lab, order


def cut(sheet):
    src = key(sheet)
    img = Image.open(src).convert('RGBA')
    arr = np.array(img)
    if sheet in GRID:
        cols, rows = GRID[sheet]
        alpha = arr[..., 3] > 24
        lab = np.zeros(alpha.shape, np.int32)
        order = []
        H, W = alpha.shape
        for r in range(rows):
            for c in range(cols):
                ys, xs = slice(r * H // rows, (r + 1) * H // rows), slice(c * W // cols, (c + 1) * W // cols)
                cell, n = ndimage.label(alpha[ys, xs])
                if not n:
                    continue
                sizes = ndimage.sum(np.ones_like(cell), cell, range(1, n + 1))
                # Keep the main island and the marks close around it; drop strays bled in from a neighbour cell.
                objs = ndimage.find_objects(cell)
                main = int(np.argmax(sizes))
                my0, my1, mx0, mx1 = objs[main][0].start - 40, objs[main][0].stop + 40, objs[main][1].start - 40, objs[main][1].stop + 40
                big = [i + 1 for i, s in enumerate(sizes) if s >= 150 and objs[i][0].stop > my0 and objs[i][0].start < my1
                       and objs[i][1].stop > mx0 and objs[i][1].start < mx1]
                m = np.isin(cell, big)
                i = len(order) + 1
                lab[ys, xs][m] = i
                yy, xx = np.nonzero(m)
                order.append((ys.start + yy.min(), ys.start + yy.max() + 1, xs.start + xx.min(), xs.start + xx.max() + 1, i))
    else:
        lab, order = islands(img, MERGE.get(sheet, 8))
    names = PIECES[sheet]
    if len(order) != len(names):
        print(f'{sheet}: {len(order)} islands, expected {len(names)}:', [(b[2], b[0], b[3] - b[2], b[1] - b[0]) for b in order])
        return False
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (y0, y1, x0, x1, i) in zip(names, order):
        if not name:
            continue
        m = 3
        y0, x0 = max(0, y0 - m), max(0, x0 - m)
        y1, x1 = min(arr.shape[0], y1 + m), min(arr.shape[1], x1 + m)
        piece = arr[y0:y1, x0:x1].copy()
        keep = ndimage.binary_dilation(lab[y0:y1, x0:x1] == i, iterations=2)
        piece[..., 3] = np.where(keep, piece[..., 3], 0)
        piece = despill(piece)
        im = Image.fromarray(piece)
        cap = 200 if sheet in GRID or name.startswith('i-') else (300 if name.startswith(('tile', 'knob', 'switch')) else 1000)  # stored a little above the largest size shown in frame units
        if max(im.size) > cap:
            k = cap / max(im.size)
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        piece = np.array(im)
        x1, y1 = x0 + im.width, y0 + im.height
        Image.fromarray(piece).save(OUT / f'{name}.webp', 'WEBP', quality=92, method=6)
        meta[name] = {'w': int(x1 - x0), 'h': int(y1 - y0), 'sheet': f'{sheet}-raw.png'}
        print(f'  {name}: {x1 - x0}x{y1 - y0}')
    allm = json.loads((OUT / 'pieces.json').read_text()) if (OUT / 'pieces.json').exists() else {}
    allm.update(meta)
    (OUT / 'pieces.json').write_text(json.dumps(allm, indent=1, sort_keys=True))
    return True




def register():
    """Lists every piece in assets/gemwoven/plaza-ui-items.json as plaza-ui-<name>; scripts/build_gemwoven.py merges
    that catalog into the hub manifest (src/gemwoven/assets.js)."""
    items = {}
    for name, m in sorted(json.loads((OUT / 'pieces.json').read_text()).items()):
        items['plaza-ui-' + name] = {'file': f'assets/gemwoven/plaza/ui/{name}.webp', 'width': m['w'], 'height': m['h'], 'transparent': True,
                                     'textless': True, 'source': 'assets/gemwoven/raw/plaza-ui/' + m['sheet']}
    cat = {'purpose': 'Gặp Gỡ plaza UI pieces drawn by Codex from the approved mockups (assets/gemwoven/raw/plaza-ui, plaza.js).',
           'items': items}
    (ROOT / 'assets/gemwoven/plaza-ui-items.json').write_text(json.dumps(cat, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    targets = list(PIECES) if sys.argv[1] == 'all' else [sys.argv[1]]
    for t in targets:
        print(t)
        cut(t)
    register()
