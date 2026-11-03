"""Cut the Codex-drawn combat HUD sheets into separate pieces (assets/combat-hud/<name>.webp).

Each raw sheet <sheet>-raw.png sits on flat magenta. generate2dsprite.py keys it to a transparent sheet; this
script labels the opaque islands, orders them in reading order, names them from PIECES, crops with a small margin,
removes the pink fringe and saves WebP. Rails for the wooden frames are cut from the straight legs of the drawn
corners (same wood, grain along the rail), so the frame joins without a seam.

  python assets/raw/combat-hud/cut.py <sheet ...|all>
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / 'assets/combat-hud'
PROC = Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py'

PIECES = {
    'sheet-a': ['rail-l', 'rail-m', 'rail-r', None, None, None, None, None, None, None, 'strip-l', 'strip-m', 'strip-r'],
    'sheet-b': ['corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'board-back', 'cell'],
    'sheet-c': ['arrow', 'cap-heart', 'cap-spark', 'bulb', 'fill-amber'],
    'sheet-d': ['ult-frame', 'ult-disc', 'ult-ring', 'ult-halo'],
    'sheet-e': ['em-fire', 'em-ice', 'em-earth', 'em-lightning', 'em-shadow', 'em-novice'],
    'sheet-f': ['star'],
}
GRID = {'sheet-d': (2, 2), 'sheet-e': (2, 3)}
MERGE = {'sheet-a': 2, 'sheet-b': 3, 'sheet-c': 6}
CAP = {'rail-m': 1200, 'strip-m': 1200, 'board-back': 700, 'cell': 300, 'fill-amber': 800, 'star': 160}


def backdrop():
    """The desktop backdrop (backdrop-raw.png, a painted plank wall) stored as WebP; it is opaque, so no keying."""
    raw = HERE / 'backdrop-raw.png'
    if raw.exists():
        im = Image.open(raw).convert('RGB')
        im = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
        im.save(OUT / 'backdrop.webp', 'WEBP', quality=82, method=6)
        print(f'  backdrop: {im.width}x{im.height}')


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
    spill = np.clip(np.minimum(r, b) - g, 0, None)
    edge = (a < 1) | (ndimage.binary_erosion(a > .5, iterations=2) == 0)
    k = np.where(edge, 1.0, 0.0) * (spill > 18)
    rgba[..., 0] = np.clip(r - spill * k * .9, 0, 255)
    rgba[..., 2] = np.clip(b - spill * k * .9, 0, 255)
    rgba[..., 3] = np.where(a < .06, 0, rgba[..., 3])
    return rgba


def islands(arr, merge):
    alpha = arr[..., 3] > 24
    grown = ndimage.binary_dilation(alpha, iterations=merge) if merge else alpha
    lab, n = ndimage.label(grown)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None or ((lab[sl] == i) & alpha[sl]).sum() < 400:
            continue
        boxes.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, i))
    boxes.sort(key=lambda b: (b[0] + b[1]) / 2)
    rows = []
    for b in boxes:
        cy = (b[0] + b[1]) / 2
        for row in rows:
            if min(x[0] for x in row) <= cy <= max(x[1] for x in row):
                row.append(b)
                break
        else:
            rows.append([b])
    order = []
    for row in rows:
        order += sorted(row, key=lambda b: b[2])
    return lab, order


def grid(arr, cols, rows):
    alpha = arr[..., 3] > 12
    lab = np.zeros(alpha.shape, np.int32)
    order = []
    H, W = alpha.shape
    for r in range(rows):
        for c in range(cols):
            ys, xs = slice(r * H // rows, (r + 1) * H // rows), slice(c * W // cols, (c + 1) * W // cols)
            m = alpha[ys, xs]
            if not m.any():
                continue
            i = len(order) + 1
            lab[ys, xs][m] = i
            yy, xx = np.nonzero(m)
            order.append((ys.start + yy.min(), ys.start + yy.max() + 1, xs.start + xx.min(), xs.start + xx.max() + 1, i))
    return lab, order


GLOW = ('ult-ring', 'ult-halo')


def unmix(rgb):
    """Glow drawn over magenta: coverage comes from green (magenta has none); the light is repainted from amber at
    its soft edge to warm cream at its core, so the halo stays gold instead of pink, and fades out before the crop."""
    o = rgb.astype(np.float32)
    a = np.clip((o[..., 1] - 6) / 214, 0, 1)
    H, W = a.shape
    yy, xx = np.mgrid[0:H, 0:W]
    edge = np.minimum.reduce([yy, xx, H - 1 - yy, W - 1 - xx]).astype(np.float32)
    a = a * np.clip(edge / 14, 0, 1)
    amber, cream = np.array([255, 150, 20], np.float32), np.array([255, 228, 120], np.float32)
    k = (a ** 3)[..., None]
    f = amber * (1 - k) + cream * k
    a = np.where(a < .03, 0, a)
    return Image.fromarray(np.dstack([f, a * 255]).astype(np.uint8), 'RGBA')


def save(name, im, meta, sheet):
    cap = CAP.get(name, 400)
    if max(im.size) > cap:
        k = cap / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(OUT / f'{name}.webp', 'WEBP', quality=92, method=6)
    meta[name] = {'w': im.width, 'h': im.height, 'sheet': f'{sheet}-raw.png'}
    print(f'  {name}: {im.width}x{im.height}')


def cut(sheet):
    arr = np.array(Image.open(key(sheet)).convert('RGBA'))
    lab, order = grid(arr, *GRID[sheet]) if sheet in GRID else islands(arr, MERGE.get(sheet, 6))
    names = PIECES[sheet]
    if len(order) != len(names):
        print(f'{sheet}: {len(order)} islands, expected {len(names)}:', [(b[2], b[0], b[3] - b[2], b[1] - b[0]) for b in order])
        return
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (y0, y1, x0, x1, i) in zip(names, order):
        if not name:
            continue
        m = 2
        y0, x0 = max(0, y0 - m), max(0, x0 - m)
        y1, x1 = min(arr.shape[0], y1 + m), min(arr.shape[1], x1 + m)
        piece = arr[y0:y1, x0:x1].copy()
        keep = ndimage.binary_dilation(lab[y0:y1, x0:x1] == i, iterations=2)
        piece[..., 3] = np.where(keep, piece[..., 3], 0)
        piece = despill(piece)
        im = Image.fromarray(piece)
        if name in ('rail-m', 'strip-m', 'fill-amber'):
            # Straight middles: trim the soft ends so they stretch without a visible joint.
            a = np.array(im)[..., 3] > 200
            cols = np.nonzero(a.sum(0) > a.shape[0] * .5)[0]
            im = im.crop((cols.min() + 6, 0, cols.max() - 5, im.height))
        if name in GLOW:
            im = unmix(np.array(Image.open(HERE / f'{sheet}-raw.png').convert('RGB'))[y0:y1, x0:x1])
        save(name, im, meta, sheet)
        if name == 'cell':
            # The board's recessed cell: the teal well inside the brass rim (tiled 8 x 8 on the board).
            well = im.crop((40, 42, 261, 249)).resize((160, 160), Image.LANCZOS)
            # Quiet the brass slivers left at the well's rim (warm pixels in the outer band) so the board reads as
            # sunken cells, not a bright lattice; only the darkened points at the junctions remain.
            w = np.array(well).astype(np.float32)
            yy, xx = np.mgrid[0:160, 0:160]
            band = np.minimum.reduce([yy, xx, 159 - yy, 159 - xx]) < 16
            warm = (w[..., 0] > w[..., 2] + 12) & band
            w[..., :3] = np.where(warm[..., None], w[..., :3] * .38 + np.array([9, 22, 24]) * .62, w[..., :3])
            save('cell-in', Image.fromarray(w.astype(np.uint8)), meta, sheet)
        if name in ('corner-tl', 'corner-br'):
            # The corner's straight legs become the frame rails (cut from the far end of each leg).
            a = np.array(im)[..., 3] > 200
            H, W = a.shape
            if name == 'corner-tl':
                rows = np.nonzero(a[:, W - 14])[0]
                save('edge-top', im.crop((W - 44, rows.min() - 2, W - 10, rows.max() + 3)), meta, sheet)
                cols = np.nonzero(a[H - 14, :])[0]
                save('edge-left', im.crop((cols.min() - 2, H - 44, cols.max() + 3, H - 10)), meta, sheet)
            else:
                rows = np.nonzero(a[:, 14])[0]
                save('edge-bottom', im.crop((10, rows.min() - 2, 44, rows.max() + 3)), meta, sheet)
                cols = np.nonzero(a[14, :])[0]
                save('edge-right', im.crop((cols.min() - 2, 10, cols.max() + 3, 44)), meta, sheet)
    allm = json.loads((OUT / 'pieces.json').read_text()) if (OUT / 'pieces.json').exists() else {}
    allm.update(meta)
    (OUT / 'pieces.json').write_text(json.dumps(allm, indent=1, sort_keys=True))


def join(name, parts, trim=10):
    """One plank from its drawn left end, middle and right end (vertically centred, the soft cut ends trimmed),
    so CSS stretches a single picture (border-image) and no joint shows between the pieces."""
    ims = [Image.open(OUT / f'{p}.webp').convert('RGBA') for p in parts]
    l, m, r = ims[0].crop((0, 0, ims[0].width - trim, ims[0].height)), ims[1], ims[2].crop((trim, 0, ims[2].width, ims[2].height))
    H = max(i.height for i in (l, m, r))
    out = Image.new('RGBA', (l.width + m.width + r.width - 4, H))
    x = 0
    for i in (l, m, r):
        out.alpha_composite(i, (x, (H - i.height) // 2))
        x += i.width - 2
    out.save(OUT / f'{name}.webp', 'WEBP', quality=92, method=6)
    meta = json.loads((OUT / 'pieces.json').read_text())
    meta[name] = {'w': out.width, 'h': out.height, 'joined': parts}
    (OUT / 'pieces.json').write_text(json.dumps(meta, indent=1, sort_keys=True))
    print(f'  {name}: {out.width}x{out.height} (joined)')


if __name__ == '__main__':
    for t in (list(PIECES) if sys.argv[1] == 'all' else sys.argv[1:]):
        if (HERE / f'{t}-raw.png').exists():
            print(t)
            cut(t)
    backdrop()
    if (OUT / 'rail-m.webp').exists():
        join('rail', ['rail-l', 'rail-m', 'rail-r'])
        join('strip', ['strip-l', 'strip-m', 'strip-r'])
