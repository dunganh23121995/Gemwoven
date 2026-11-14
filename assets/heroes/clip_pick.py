"""Pick helpers for clip specs: python assets/heroes/clip_pick.py <hero>/<id> seed SEG=SEED ... | frames SEG=i,j,k ...
seed: use another take of a segment; frames: the clip frames a segment gives (keys stay). Rewrites spec pick, keeps roles on keys."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from clip_pipeline import load, save  # noqa: E402

ref, cmd, *args = sys.argv[1:]
d, s = load(ref)
for a in args:
    seg, v = a.split('=')
    if cmd == 'seed':
        s['pick'] = [[p[0], int(v), p[2]] if p[0] == seg else p for p in s['pick']]
    elif cmd == 'frames':
        seed = next((p[1] for p in s['pick'] if p[0] == seg), 7)
        idx = [i for i, p in enumerate(s['pick']) if p[0] == seg]
        new = [[seg, seed, int(k)] for k in v.split(',') if k != '']
        at = idx[0] if idx else None
        if at is None:
            raise SystemExit(f'segment {seg} not in pick')
        s['pick'] = s['pick'][:at] + new + s['pick'][idx[-1] + 1:]
# roles: keys keep their roles; the rest follow the old shape (guard, between, key 1, key 2, between, rest)
keys = [i for i, p in enumerate(s['pick']) if p[0] == 'key']
if s.get('roles') and len(keys) >= 3 and 'clock' not in s:
    k1, k2 = keys[1], keys[-2]
    s['roles'] = [0, max(1, k1 // 2), k1, k2, min(len(s['pick']) - 2, k2 + 2), len(s['pick']) - 1]
save(d, s)
print(len(s['pick']), 'frames', 'roles', s.get('roles'))
