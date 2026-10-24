"""reg2.py <clean sheet RGBA> <cols> <rows> <idle.webp> <outdir> <label> <spec>
Places raw cells (keyed full-res sheet from generate2dsprite process: raw-sheet-clean.png) into 256px game
cells so frame 1 (the rest pose) lands exactly on the idle's first frame; nothing is drawn or warped: one
uniform resize and a whole-pixel shift per frame.
spec (comma list, one per frame):
  same            - frame 1's transform
  boots           - frame 1's scale; shifted so the boots' midpoint and the sole line sit where frame 1's do
  sole            - frame 1's scale and x; y so the sole line sits on frame 1's
  boots/<m>       - like boots but scale x m (a frame the model drew bigger/smaller), about the soles
  ...+dx+dy       - any of the above followed by extra game-pixel offsets, e.g. boots/0.92+3-2
Writes <outdir>/<label>-N.png, <outdir>/sheet.png, <outdir>/onion.png (frames over the idle, 2x), reg.json."""
import sys, os, re, json
import numpy as np
from PIL import Image
from scipy import ndimage
src, cols, rows, idle, out, label, spec = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7]
K = float(next((a.split('=')[1] for a in sys.argv[8:] if a.startswith('--k=')), 1))  # draw at K of the idle size (sheet 'scale' 1/K grows it back about the feet)
os.makedirs(out, exist_ok=True)
S = Image.open(src).convert('RGBA'); W, H = S.width // cols, S.height // rows
I = Image.open(idle).convert('RGBA'); n = I.width // 2; R = np.asarray(I.crop((0, 0, n, n)), dtype=np.float32) / 255
def cell(i):
    c = np.asarray(S.crop(((i % cols) * W, (i // cols) * H, (i % cols + 1) * W, (i // cols + 1) * H)), dtype=np.float32) / 255
    lab, k = ndimage.label(c[..., 3] > .2)
    if k > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, k + 1)); keep = np.isin(lab, 1 + np.where(sizes >= max(60, sizes.max() * .004))[0])
        c[..., 3] *= ndimage.binary_dilation(keep, iterations=2)
    c[:3] = c[:3]; c[..., 3][[0, 1, -2, -1], :] = 0; c[..., 3][:, [0, 1, -2, -1]] = 0
    return c
def boots(c):
    m = c[..., 3] > .5; ys = np.where(m.sum(1) > 3)[0]; bot = ys.max()
    row = m[bot - 16:bot + 1].any(0); xs = np.where(row)[0]
    sp = [s for s in np.split(xs, np.where(np.diff(xs) > 3)[0] + 1) if len(s) > 10]
    return bot, (sp[0].min() + sp[-1].max()) / 2, sp
def render(c, s, ox, oy):
    """resize the raw cell by s, paste with its top-left at (ox, oy) (float -> rounded) in an n cell"""
    im = Image.fromarray((c * 255).astype('uint8'), 'RGBA'); w, h = round(W * s), round(H * s)
    r = im.resize((w, h), Image.LANCZOS); o = Image.new('RGBA', (n, n)); o.paste(r, (int(round(ox)), int(round(oy))), r)
    return o
def despill(o):
    """magenta key spill on the outline (within 3 px of transparency, r~b>g) is pulled to neutral and faded;
    the design's pink blossoms (red well above blue) and interior colours are left alone"""
    a = np.asarray(o, dtype=np.float32).copy(); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    edge = ndimage.binary_dilation(al < 128, iterations=3) & (al > 0)
    sus = edge & (b - g > 10) & (r - g > 22)
    k = np.clip((np.minimum(r, b) - g + 20) / 110, 0, 1)
    a[..., 3] = np.where(sus, al * (1 - .55 * k), al)
    a[..., 0] = np.where(sus, g + (r - g) * .35, r); a[..., 2] = np.where(sus, g + (b - g) * .25, b)
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')
def cost(o, m):
    F = np.asarray(o, dtype=np.float32) / 255
    return (np.abs(F[..., :3] * F[..., 3:] - R[..., :3] * R[..., 3:])[m].mean() + np.abs(F[..., 3] - R[..., 3])[m].mean())
cells = [cell(i) for i in range(len(spec.split(',')))]
# frame 1 -> idle: coarse-to-fine search on scale and offset, whole body
ra = R[..., 3] > .5; ys, xs = np.where(ra); ib, it = ys.max(), ys.min()
def fit(c):
    b1, x1, _ = boots(c); rt = np.where((c[..., 3] > .5).sum(1) > 3)[0].min()
    s = (ib - it) / (b1 - rt); best = None
    for ds in np.linspace(-.04, .04, 9):
        ss = s * (1 + ds)
        for dy in range(-6, 7, 2):
            for dx in range(-12, 13, 2):
                ox = 0 + dx + (np.mean(xs) - 0) - x1 * ss * 0; oy = ib - b1 * ss + dy
                ox = (xs.min() + xs.max()) / 2 - W * ss / 2 + dx
                e = cost(render(c, ss, ox, oy), ra)
                if best is None or e < best[0]: best = (e, ss, ox, oy)
    for _ in range(2):
        e0, ss, ox, oy = best
        for ds in (-.004, 0, .004):
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    e = cost(render(c, ss + ds, ox + dx, oy + dy), ra)
                    if e < best[0]: best = (e, ss + ds, ox + dx, oy + dy)
    return best
b1, x1, _ = boots(cells[0]); rt = np.where((cells[0][..., 3] > .5).sum(1) > 3)[0].min()
best = fit(cells[0])
e0, s0, ox0, oy0 = best
print(f'frame 1 -> idle: scale {s0:.4f} offset {ox0:.1f},{oy0:.1f} err {e0:.3f}')
def headscale(c):
    a0 = cells[0]; m = a0[..., 3] > .5; ys = np.where(m.sum(1) > 3)[0]; tp, bt = ys.min(), ys.max(); hh = bt - tp
    band = m[tp:tp + int(hh * .1)]; bx = np.where(band.any(0))[0]; cx = (bx.min() + bx.max()) / 2
    y0, y1, x0, x1 = int(tp + hh * .1), int(tp + hh * .34), int(cx - hh * .17), int(cx + hh * .15)
    P = Image.fromarray((a0[y0:y1, x0:x1] * 255).astype('uint8'), 'RGBA')
    C = Image.fromarray((c * 255).astype('uint8'), 'RGBA').resize((W // 2, H // 2), Image.LANCZOS); C = np.asarray(C, dtype=np.float32) / 255
    best = None
    for mul in np.arange(.86, 1.26, .02):
        q = np.asarray(P.resize((max(1, round(P.width * mul / 2)), max(1, round(P.height * mul / 2))), Image.LANCZOS), dtype=np.float32) / 255
        qh, qw = q.shape[:2]; pq = q[..., :3] * q[..., 3:]
        for yy in range(0, C.shape[0] - qh, 2):
            for xx in range(0, C.shape[1] - qw, 2):
                Q = C[yy:yy + qh, xx:xx + qw]
                e = np.abs(Q[..., :3] * Q[..., 3:] - pq).mean() + np.abs(Q[..., 3] - q[..., 3]).mean()
                if best is None or e < best[0]: best = (e, mul, xx, yy)
    return 1 / best[1], best[0]
res = []; frames = []
for i, (c, t) in enumerate(zip(cells, spec.split(','))):
    m = re.match(r'(same|boots|sole|fit)(?:/([\d.]+|h))?([+-]\d+)?([+-]\d+)?$', t); mode = m.group(1)
    if m.group(2) == 'h': mul, he = headscale(c); print(f'frame {i + 1}: head scale {mul:.2f} (err {he:.3f})')
    else: mul = float(m.group(2) or 1)
    ex, ey = int(m.group(3) or 0), int(m.group(4) or 0)
    b, x, sp = boots(c)
    s = s0 * mul
    if mode == 'fit': _, s, ox, oy = fit(c)
    elif mode == 'same': ox, oy = ox0, oy0
    else:
        # sole line onto frame 1's sole line (in game px) and, for boots, the boots' midpoint onto frame 1's
        gb = oy0 + b1 * s0; gx = ox0 + x1 * s0
        oy = gb - b * s
        ox = (gx - x * s) if mode == 'boots' else (ox0 + W * s0 / 2 - W * s / 2)
    fy = n * .94; s, ox, oy = s * K, n / 2 + (ox + ex - n / 2) * K, fy + (oy + ey - fy) * K; ex = ey = 0
    o = despill(render(c, s, ox, oy)); frames.append(o); o.save(f'{out}/{label}-{i + 1}.png')
    a = np.asarray(o)[..., 3] > 127; yy, xx = np.where(a)
    res.append(dict(frame=i + 1, spec=t, scale=round(s, 4), ox=round(ox + ex, 1), oy=round(oy + ey, 1), top=int(yy.min()), bottom=int(yy.max()), x=[int(xx.min()), int(xx.max())],
                    edge=bool(a[0].any() or a[-1].any() or a[:, 0].any() or a[:, -1].any()), raw_boots=[[int(q.min()), int(q.max())] for q in sp]))
    print(res[-1])
sheet = Image.new('RGBA', (n * 3, n * ((len(frames) + 2) // 3)))
for i, f in enumerate(frames): sheet.alpha_composite(f, ((i % 3) * n, (i // 3) * n))
sheet.save(f'{out}/sheet.png')
RK = np.asarray(Image.fromarray((R * 255).astype('uint8'), 'RGBA').resize((round(n * K), round(n * K)), Image.LANCZOS), dtype=np.float32) / 255
R2 = np.zeros_like(R); px, py = int(round(n / 2 - n * K / 2)), int(round(n * .94 - n * .94 * K)); R2[py:py + RK.shape[0], px:px + RK.shape[1]] = RK[:n - py, :n - px]; R = R2
tiles = []
for f in frames:
    F = np.asarray(f, dtype=np.float32) / 255; o = np.zeros((n, n, 3), np.float32) + .12
    o[..., 1] += R[..., 3] * .5; o[..., 2] += R[..., 3] * .5; o[..., 0] += F[..., 3] * .7
    tiles.append(Image.fromarray((o.clip(0, 1) * 255).astype('uint8')))
M = Image.new('RGB', (n * len(tiles), n))
for i, t in enumerate(tiles): M.paste(t, (i * n, 0))
M.save(f'{out}/onion.png')
# head anchors (actor coords, like forms.json 'heads'): frame 1's head patch tracked in every frame
A0 = np.asarray(frames[0], dtype=np.float32) / 255; m0 = A0[..., 3] > .5; yy, xx = np.where(m0); t0 = yy.min(); hgt = yy.max() - t0
band = m0[t0:t0 + int(hgt * .12)]; bx = np.where(band.any(0))[0]; cx0 = (bx.min() + bx.max()) / 2
py0, py1, px0, px1 = int(t0 + hgt * .12), int(t0 + hgt * .36), int(cx0 - hgt * .16), int(cx0 + hgt * .16)
P = A0[py0:py1, px0:px1]
heads = []
for f in frames:
    F = np.asarray(f, dtype=np.float32) / 255; best = None
    for dy in range(-50, 51):
        for dx in range(-50, 51, 1):
            y0, x0 = py0 + dy, px0 + dx
            if y0 < 0 or x0 < 0 or y0 + P.shape[0] > n or x0 + P.shape[1] > n: continue
            Q = F[y0:y0 + P.shape[0], x0:x0 + P.shape[1]]
            e = np.abs(Q[..., :3] * Q[..., 3:] - P[..., :3] * P[..., 3:]).mean() + np.abs(Q[..., 3] - P[..., 3]).mean()
            if best is None or e < best[0]: best = (e, dx, dy)
    e, dx, dy = best; fy = n * .94
    hx, hy = cx0 + dx, t0 + dy
    heads.append([round(n / 2 + (hx - n / 2) / K), round(fy + (hy - fy) / K)])
print('heads', json.dumps(heads))
for r, h in zip(res, heads): r['head'] = h
json.dump(res, open(f'{out}/reg.json', 'w'), indent=1)
