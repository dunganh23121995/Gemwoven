"""Swap picked clip frames that are ghosted for clean ones (12/11, Lumi on green: Wan's last frames of a short clip blur into
double images and their screen colour darkens). A frame whose background is darker than the clip's first frame's is replaced
by the nearest earlier clean frame of the same take that is not picked yet.  python assets/heroes/clip_clean.py <hero>/<id>"""
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import clip_pipeline as cp  # noqa: E402

ref = sys.argv[1]
d, spec = cp.load(ref)


def bg_level(im):
    a = np.asarray(im.resize((96, 96))).astype(int)
    m = ~cp.mask(a.astype(np.uint8))
    return float(a[m][:, 1].mean() if cp.GREEN else a[m][:, [0, 2]].mean()) if m.any() else 0


cache = {}
def level(seg, seed, k):
    if (seg, seed, k) not in cache:
        cache[(seg, seed, k)] = bg_level(cp.clip_frame(d, seg, seed, k))
    return cache[(seg, seed, k)]


pick = spec['pick']; changed = []
for i, p in enumerate(pick):
    if p[0] == 'key':
        continue
    seg, seed, k = p
    ref_level = level(seg, seed, 0)
    if level(seg, seed, k) >= ref_level - 18:
        continue
    used = {q[2] for q in pick if q[0] == seg and q[1] == seed}
    for c in range(k - 1, 0, -1):
        if c not in used and level(seg, seed, c) >= ref_level - 18:
            pick[i] = [seg, seed, c]; changed.append((i, k, c)); break
    else:
        changed.append((i, k, None))
cp.save(d, spec)
print(ref, 'swapped', changed)
