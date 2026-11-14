"""Specs for Hiro's 13/11 redo (redo-1311.md): the drawn keys (redo_keys.py, placed by placekey) chained by clips.
python redo_specs.py [id ...]. Keeps each spec's output fields; rebuilds keys, segments, picks, roles; head_lock on."""
import json, sys
from pathlib import Path

D = Path(__file__).resolve().parent
sys.path.insert(0, str(D.parents[2]))
from clip_specs import keep, HEROES, auto_pick  # noqa: E402

WHO = HEROES['novice']['who']
K = keep('his', 'sword')
CAM = " Locked stationary camera; no turning or scale change; his size stays the same in every frame."
# id: (form, [(from, to, clip length, motion, frames picked)], roles by key name or None, keys)
PLAN = {
    'f2-attack': ('2', [('rest', 'W', 13, "draws the sword back over his rear shoulder, bending his knees and loading his weight onto his back leg, into the pose of the last frame", 5),
                        ('W', 'C', 9, "explodes forward: plants his lead foot in a long step and swings the steel sword in one fast level slash at chest height toward screen-right, the hips turning hard, into the pose of the last frame, the blade clearly visible in every frame", 5),
                        ('C', 'F', 9, "follows through, the blade carrying on forward and down, the front knee bending deeper, into the pose of the last frame", 3),
                        ('F', 'rest', 13, "recovers from the lunge and settles back into his calm guard of the last frame. No second attack", 6)],
                  ['start', 'W', 'W', 'C', 'F', 'rest']),
    'f3-attack': ('3', [('rest', 'W', 13, "raises the longsword with both hands high behind his rear shoulder, bending his knees, into the pose of the last frame", 5),
                        # (13/11: W->C in one clip blurred the blade in every take) through the drawn mid-swing key M
                        ('W', 'M', 9, "steps in hard toward screen-right, both hands driving the longsword forward from high behind his shoulder until the blade is level at shoulder height, into the pose of the last frame, the blade clearly visible in every frame", 4),
                        ('M', 'C', 9, "carries the cleave on down, the longsword slanting forward and down toward the enemy, into the pose of the last frame, the blade clearly visible in every frame", 3),
                        ('C', 'F', 9, "drives the blade on down until its tip is just above the ground ahead, sinking lower, into the pose of the last frame", 3),
                        ('F', 'rest', 13, "rises from the low stance and settles back into his calm guard of the last frame. No second attack", 6)],
                  ['start', 'W', 'W', 'C', 'F', 'rest']),
    'f2-skill': ('2', [('rest', 's0', 9, "drops into a compact low crouch, the sword low beside his rear hip, into the pose of the last frame", 3),
                       ('s0', 's1', 9, "leans far forward ready to dash toward screen-right, into the pose of the last frame", 3),
                       ('s1', 's2', 9, "springs forward and cuts the sword across in one fast horizontal sweep at chest height toward screen-right into the pose of the last frame", 3),
                       ('s2', 's3', 9, "swings the sword up from low to high in front in a fast rising cut into the pose of the last frame", 3),
                       ('s3', 's4', 9, "brings the sword down in a fast diagonal cut into a deep lunge into the pose of the last frame", 3),
                       ('s4', 's5', 13, "rises out of the lunge into a controlled low guard into the pose of the last frame", 4),
                       ('s5', 'rest', 13, "straightens up and settles into his calm guard of the last frame", 5)],
                 ['s0', 's1', 's2', 's3', 's4', 's5']),
    'f3-skill': ('3', [('rest', 's0', 9, "lifts the longsword upright in front of his chest with both hands into the pose of the last frame", 3),
                       ('s0', 's1', 9, "raises the upright longsword a little, bracing his shoulders, the tip staying in place, into the pose of the last frame", 3),
                       ('s1', 's2', 13, "draws the longsword with both hands up and back over his rear shoulder, turning his hips, into the pose of the last frame", 4),
                       ('s2', 's3', 9, "takes a long step forward toward screen-right, the longsword still loaded behind his shoulder, into the pose of the last frame", 3),
                       ('s3', 's4', 13, "sweeps the longsword down and forward in one great crescent cut into a low stance into the pose of the last frame, the blade clearly visible in every frame", 5),
                       ('s4', 's5', 13, "rises into a firm low guard into the pose of the last frame", 4),
                       ('s5', 'rest', 13, "settles back into his calm guard of the last frame", 5)],
                 ['s0', 's1', 's2', 's3', 's4', 's5']),
}
RUN_IN = "from his calm guard starts to run toward screen-right: he lowers the sword beside his hip with the blade trailing back and down, leans forward and breaks into a running stride, ending in the running pose of the last frame. Locked stationary camera, no horizontal drift."
RUN_LOOP = ("runs quickly in place toward screen-right: two long running strides, his two legs clearly alternating with clear foot contacts, his free arm pumping; "
            "the sword stays low beside his hip with the blade trailing back and down the whole time, never raised; scarf and cape streaming back; locked stationary camera, no drift, back to the running pose of the last frame.")


def rebuild(cid):
    p = D / cid / 'spec.json'; old = json.loads(p.read_text(encoding='utf-8'))
    s = {k: old[k] for k in ('id', 'hero', 'title', 'rest', 'pad', 'out', 'forms', 'meta', 'novice_meta', 'cols', 'frameDuration', 'scale', 'footY',
                             'style', 'stepMs', 'lock', 'plaza_feet') if k in old}
    s['head_lock'] = True
    s['redo'] = 'Hiro redo 13/11 (redo-1311.md): Codex-drawn keys, new clips'
    if cid.endswith('-run'):
        form = cid[1]
        s['keys'] = {'R': old['keys']['R']}
        s['segments'] = [{'name': 'A', 'start': 'rest', 'end': 'R', 'length': 17, 'prompt': WHO[form] + RUN_IN + K},
                         {'name': 'F', 'start': 'R', 'end': 'R', 'length': 17, 'prompt': WHO[form] + RUN_LOOP + K}]
        s['pick'] = [['A', 7, i] for i in range(16)] + [['F', 7, i] for i in range(16)]
        s['loop'] = [16, 31]; s['lock'] = 'center'; s['frameDuration'] = 55
        s['game'] = {'code': 'rời sân: vào chạy 1 lần rồi lặp; Quảng Trường dùng cùng sheet (loop)', 'plan': 'A vào chạy (rest→R) + F vòng 2 sải (R→R)'}
    else:
        form, chain, roles = PLAN[cid]
        names = {b for _, b, *_ in chain} - {'rest'}
        s['keys'] = {n: old['keys'][n] for n in names}
        s['segments'] = [{'name': seg, 'start': a, 'end': b, 'length': L, 'prompt': WHO[form] + m + '.' + CAM + K}
                         for seg, (a, b, L, m, _) in zip('ABCDEFGHIJ', chain)]
        s['pick'] = auto_pick(chain, None)
        at = {pk[1]: i for i, pk in enumerate(s['pick']) if pk[0] == 'key'}
        at['start'] = 0; at['rest'] = len(s['pick']) - 1
        s['roles'] = [at[n] for n in roles]
        s['game'] = old.get('game', {})
    p.write_text(json.dumps(s, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(cid, 'frames', len(s['pick']), 'roles', s.get('roles'), 'loop', s.get('loop'))


if __name__ == '__main__':
    for cid in sys.argv[1:] or ['f2-attack', 'f3-attack', 'f2-skill', 'f3-skill', 'f1-run', 'f2-run', 'f3-run']:
        rebuild(cid)
