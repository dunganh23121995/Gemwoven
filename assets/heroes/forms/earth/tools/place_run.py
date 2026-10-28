"""place.py <raw.png> <idle.webp> <master.png> <K> <out sheet.png>: one transform for the whole sheet: the raw
cells were drawn on make_anchor_layout's template (master at 62% of the 512 cell height, feet at 88%), so map that
template onto the game cell where the idle stands (scaled by K about its feet). Keeps the run's own bob and stride."""
import sys, json, subprocess
import numpy as np
from PIL import Image
raw, idle, master, K, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
key = out.replace('.png', '-key')
subprocess.run([sys.executable, 'C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py', 'process', '--input', raw, '--target', 'player', '--mode', 'run', '--output-dir', key,
                '--rows', '2', '--cols', '3', '--cell-size', '512', '--fit-scale', '.95', '--align', 'feet', '--scale-strategy', 'preserve', '--component-mode', 'largest'], check=True, capture_output=True)
S = Image.open(key + '/raw-sheet-clean.png').convert('RGBA'); W, H = S.width / 3, S.height / 2
I = Image.open(idle).convert('RGBA'); f1 = I.crop((0, 0, I.width // 2, I.height // 4)); n = f1.width
ib = f1.getchannel('A').point(lambda a: 255 if a > 127 else 0).getbbox()
mb = Image.open(master).getchannel('A').point(lambda a: 255 if a > 127 else 0).getbbox()
mh = mb[3] - mb[1]
# template: master height -> .62*W, feet at .88*H, centred on the master's bbox centre at W/2
s = (ib[3] - ib[1]) / (.62 * W) * K
fy = n * .94; feet = fy + (ib[3] - fy) * K; cx = n / 2 + ((ib[0] + ib[2]) / 2 - n / 2) * K
# head-size check: the idle's face patch (scaled by K) searched in each raw cell over sizes; the median ratio
# corrects the template scale so the runner's head is exactly the idle's size
Ia = np.asarray(f1, dtype=np.float32) / 255; hb = ib[3] - ib[1]
cxi = (ib[0] + ib[2]) / 2; top = ib[1]
band = Ia[top:top + int(hb * .1), :, 3] > .5; bx = np.where(band.any(0))[0]; hcx = (bx.min() + bx.max()) / 2
P = f1.crop((int(hcx - hb * .17), int(top + hb * .12), int(hcx + hb * .15), int(top + hb * .36)))
def headratio(c, s0):
    C = c.resize((round(c.width * s0), round(c.height * s0)), Image.LANCZOS); C = np.asarray(C, dtype=np.float32) / 255; best = None
    for m in np.arange(.80, 1.26, .03):
        q = np.asarray(P.resize((max(1, round(P.width * m * K)), max(1, round(P.height * m * K))), Image.LANCZOS), dtype=np.float32) / 255
        qh, qw = q.shape[:2]; pq = q[..., :3] * q[..., 3:]
        for yy in range(0, C.shape[0] - qh, 2):
            for xx in range(0, C.shape[1] - qw, 2):
                Q = C[yy:yy + qh, xx:xx + qw]
                e = np.abs(Q[..., :3] * Q[..., 3:] - pq).mean() + np.abs(Q[..., 3] - q[..., 3]).mean()
                if best is None or e < best[0]: best = (e, m)
    return best[1]
cells = [S.crop((round((i % 3) * W), round((i // 3) * H), round((i % 3 + 1) * W), round((i // 3 + 1) * H))) for i in range(6)]
ratios = [headratio(c, s) for c in cells[:3]]
corr = 1 / float(np.median(ratios)); s *= corr; print('head ratios', [round(r, 2) for r in ratios], 'scale corr', round(corr, 3))
# per row: the contact frames (1 and 4) stand on the idle's feet line; the other frames keep their own lift
lows = []
for c in cells:
    a = np.asarray(c)[..., 3] > 127; lows.append(np.where(a.any(1))[0].max())
rowshift = {0: 0, 1: lows[3] - lows[0]}   # row 2's own contact frame stands on the feet line too
sheet = Image.new('RGBA', (n * 3, n * 2)); heads = []
for i in range(6):
    c = cells[i]
    r = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
    ox = cx - (W / 2) * s; oy = feet - (lows[0] + rowshift[i // 3]) * s
    cell = Image.new('RGBA', (n, n)); cell.paste(r, (int(round(ox)), int(round(oy))), r)
    sheet.alpha_composite(cell, ((i % 3) * n, (i // 3) * n))
    a = np.asarray(cell)[..., 3] > 127; ys, xs = np.where(a)
    # head anchor: where the idle's face patch (at K) sits in this frame, mapped back to the idle's frame
    q = np.asarray(P.resize((max(1, round(P.width * K)), max(1, round(P.height * K))), Image.LANCZOS), dtype=np.float32) / 255; pq = q[..., :3] * q[..., 3:]
    C = np.asarray(cell, dtype=np.float32) / 255; best = None
    for yy in range(0, n - q.shape[0]):
        for xx in range(0, n - q.shape[1], 2):
            Q = C[yy:yy + q.shape[0], xx:xx + q.shape[1]]; e = np.abs(Q[..., :3] * Q[..., 3:] - pq).mean() + np.abs(Q[..., 3] - q[..., 3]).mean()
            if best is None or e < best[0]: best = (e, xx, yy)
    hx = best[1] + q.shape[1] * (hcx - (hcx - hb * .17)) / P.width; hy = best[2] - (hb * .12) * K   # back to the crown above the patch
    heads.append([round(n / 2 + (hx - n / 2) / K), round(fy + (hy - fy) / K)])
    print(i + 1, 'bbox', xs.min(), ys.min(), xs.max(), ys.max(), 'edge', bool(a[0].any() or a[-1].any() or a[:, 0].any() or a[:, -1].any()))
sheet.save(out); json.dump(heads, open(out.replace('.png', '-heads.json'), 'w')); print('heads', heads, 'idle bbox', ib)
