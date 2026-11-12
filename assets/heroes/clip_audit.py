"""Audit of clip-route sheets, frame by frame (owner 12/11: a frame with four bodies and pops between frames slipped through
contact-sheet reviews). For each sheet: bodies per frame (separate large opaque blobs), body size (area, steel left out),
the soles' line and back boot, and the jumps between neighbouring frames; the first/last frame against the resting frame.

python assets/heroes/clip_audit.py            every Mika sheet
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def frame_stats(cell):
    a = np.asarray(cell.convert('RGBA')).astype(int)
    alpha = a[..., 3] > 128
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    sat = (mx - mn) / (mx + 1)
    body = alpha & ~((sat < .25) & (mx > 110))
    lab, n = ndimage.label(ndimage.binary_closing(alpha, iterations=3))
    sizes = sorted(np.bincount(lab.ravel())[1:], reverse=True) if n else []
    big = [s for s in sizes if s > max(1500, (sizes[0] if sizes else 0) * .25)]
    ys, xs = np.where(body)
    if not len(ys):
        return {'bodies': 0}
    yb = int(np.percentile(ys, 99.5)); low = ys > yb - 22
    return {'bodies': len(big), 'area': int(body.sum()), 'sole': yb, 'boot': float(np.percentile(xs[low], 2)), 'cx': float(np.median(xs))}


def sheets():
    yield '1', 'smash', ROOT / 'assets/reimagined/heroes/fire/smash.webp', 6
    for a in ('attack', 'cast', 'hurt', 'run'):
        yield '1', a, ROOT / f'assets/reimagined/heroes/fire/{a}.webp', 6
    forms = json.loads((ROOT / 'assets/heroes/forms/fire/forms.json').read_text(encoding='utf-8'))['forms']
    for f, e in forms.items():
        for a, s in e['actions'].items():
            if a in ('idle', 'dash'):
                continue
            yield f, a, ROOT / s['file'], s['cols']


def audit():
    rest = {'1': ROOT / 'assets/heroes/forms/fire/form-1/sharp/rest.webp', '2': ROOT / 'assets/heroes/forms/fire/form-2/rig/combat/rest.png',
            '3': ROOT / 'assets/heroes/forms/fire/form-3/rig/combat/rest.png'}
    report = []
    orders = {}
    for sp in (ROOT / 'assets/heroes/forms').glob('*/clips/*/spec.json'):
        spec = json.loads(sp.read_text(encoding='utf-8'))
        if spec.get('order') and spec.get('out'):
            orders[(ROOT / spec['out']).resolve()] = spec['order']
    for f, a, path, cols in sheets():
        sh = Image.open(path).convert('RGBA'); cw = sh.width // cols; rows = sh.height // cw
        st = [frame_stats(sh.crop(((i % cols) * cw, (i // cols) * cw, (i % cols + 1) * cw, (i // cols + 1) * cw)).resize((512, 512))) for i in range(cols * rows)]
        order = orders.get(path.resolve())        # in play order (a spec's order: appended in-betweens)
        st = [dict(st[i], n=i) for i in (order or range(len(st))) if i < len(st) and st[i].get('bodies')]
        issues = []
        for i, s in enumerate(st):
            if s['bodies'] != 1:
                issues.append(f'khung {s["n"]}: {s["bodies"]} khối hình')
        for i in range(1, len(st)):
            p, s = st[i - 1], st[i]; i = f'{p["n"]}->{s["n"]}'
            da = s['area'] / max(1, p['area']) - 1
            if abs(da) > .12:
                issues.append(f'{i}: cỡ thân {da:+.0%}')
            if abs(s['sole'] - p['sole']) > 10:
                issues.append(f'{i}: đế giày {s["sole"] - p["sole"]:+d}px')
            if abs(s['cx'] - p['cx']) > 28:
                issues.append(f'{i}: thân dịch {s["cx"] - p["cx"]:+.0f}px')
        report.append((f'dạng {f} {a}', len(st), issues))
    return report


if __name__ == '__main__':
    for name, n, issues in audit():
        print(f'{name} ({n} khung):', 'OK' if not issues else '; '.join(issues))


# ---- transitions between states (owner 12/11: jerks, colour shifts, sharpness gaps between rest and actions) ----------
def look(im):
    """Body brightness, saturation and sharpness (Laplacian energy per body pixel), position and size."""
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    al = a[..., 3] > 200
    rgb = a[..., :3]; mx, mn = rgb.max(-1), rgb.min(-1)
    g = rgb.mean(-1)
    lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
    inner = ndimage.binary_erosion(al, iterations=3)[1:-1, 1:-1]
    st = frame_stats(im)
    if not al.any():
        return st
    return {**st, 'bright': float(mx[al].mean()), 'sat': float(((mx - mn) / (mx + 1))[al].mean()), 'sharp': float(lap[inner].mean())}


DISP = 384   # the idle cell on a phone (≈128 css px x DPR 3)


def transitions():
    sys.path.insert(0, str(Path(__file__).parent))
    import clip_pipeline as cp
    out = []
    for sp in sorted((ROOT / 'assets/heroes/forms/fire/clips').glob('f*/spec.json')):
        spec = json.loads(sp.read_text(encoding='utf-8'))
        rest = look(cp.rest_cell(spec))
        path = ROOT / spec['out']; sh = Image.open(path).convert('RGBA'); cols = spec.get('cols', 6); n = len(spec['pick'])
        cw = sh.width // cols
        fr = [look(sh.crop(((i % cols) * cw, (i // cols) * cw, (i % cols + 1) * cw, (i // cols + 1) * cw)).resize((512, 512), Image.LANCZOS)) for i in range(n)]
        # Sharpness as seen: the game shows the idle cell at the hero's size and grows a padded sheet's cell by its scale, so
        # compare both with the body at the same on-screen size (DISP px for the idle cell, DISP x scale for the sheet cell).
        pad = spec.get('pad', 1.0)
        rest['sharp'] = look(Image.open(ROOT / spec['rest']).convert('RGBA').resize((DISP, DISP), Image.LANCZOS))['sharp']
        for i in range(n):
            c = sh.crop(((i % cols) * cw, (i // cols) * cw, (i % cols + 1) * cw, (i // cols + 1) * cw))
            fr[i]['sharp'] = look(c.resize((round(DISP * pad), round(DISP * pad)), Image.LANCZOS)).get('sharp', 0)
        notes = []
        empty = [i for i, f in enumerate(fr) if 'cx' not in f]
        if empty:
            out.append((spec['id'], [f'khung trống {empty} (sheet chưa ghép lại theo spec)']))
            continue
        order = spec.get('order') or list(range(n))     # the first and last frames played
        for name, f in (('đầu', fr[order[0]]), ('cuối', fr[order[-1]])):
            if spec.get('loop') and name == 'cuối':
                continue      # a run's last frame loops back into its cycle, not to rest
            d = [abs(f['cx'] - rest['cx']), abs(f['sole'] - rest['sole']), f['area'] / rest['area'] - 1]
            if d[0] > 6 or d[1] > 4 or abs(d[2]) > .06:
                notes.append(f'khung {name} lệch nghỉ: x {d[0]:.0f}px, đế {d[1]:.0f}px, cỡ {d[2]:+.0%}')
        for i, f in enumerate(fr):
            db = f['bright'] / rest['bright'] - 1; ds = f['sat'] / rest['sat'] - 1; dk = f['sharp'] / rest['sharp']
            if abs(db) > .08 or abs(ds) > .12:
                notes.append(f'khung {i} màu: sáng {db:+.0%}, bão hòa {ds:+.0%}')
            if dk < .7 or dk > 1.45:
                notes.append(f'khung {i} độ nét x{dk:.2f} so với nghỉ')
        out.append((spec['id'], notes))
    return out


if __name__ == '__main__' and '--transitions' in sys.argv:
    for cid, notes in transitions():
        print(f'{cid}:', 'OK' if not notes else '; '.join(notes))
