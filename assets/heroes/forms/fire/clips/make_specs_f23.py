"""Specs for Mika forms 2-3 (attack, cast, hurt, run) on the clip route (assets/heroes/clip_pipeline.py), owner 12/11."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
B = ROOT / 'assets/heroes/forms/fire/clips'
F = 'assets/heroes/forms/fire/'
WHO = {'2': "A chibi fox-girl swordswoman in black and gold plate armour with a red scarf and long red cape tails, wielding a big broad greatsword with a wide silver blade, ",
       '3': "A chibi nine-tailed fox empress in white and gold armour with very long red hair and nine big fluffy fox tails fanned behind her, wielding a long-hafted crescent moon glaive, "}
KEEP = (" Arms, shoulders and torso drive the weapon action; hair, cloth and tails follow with natural overlapping motion. Preserve her identity, costume, "
        "proportions and the single rigid weapon, always drawn whole and clearly visible. No added flames, aura or particles.")
STYLE = ("Static locked camera, three-quarter view facing screen-right, matching the reference, the whole body and weapon always inside the frame with a margin, "
         "her face visible, the flat solid magenta background never changes. Clean anime game sprite animation, crisp lines. "
         "Hair, cloth and tails always keep moving with natural delay and follow-through, never frozen.")
PLANT = " Feet adjust minimally between the supplied endpoint stances, staying grounded without sliding or hopping; no turning or scale change."
PAD = {'2': 1.25, '3': 1.45}


def key(f, sheet, i, cols, rows, scale, note):
    return {'file': F + f'form-{f}/{sheet}', 'cell': [i, cols, rows], 'sheet_scale': scale, 'sheet_foot': .94, 'note': note}


def spec(f, action, title, keys, segments, game, extra=None, pad=None):
    pad = pad or PAD[f]
    n = round(512 * pad); off = n - 512 - round((n - 512) * .15)
    cid = f'f{f}-{action}'; d = B / cid; (d / 'keys').mkdir(parents=True, exist_ok=True)
    p = d / 'spec.json'
    old = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    s = {'id': cid, 'hero': 'fire', 'title': title, 'rest': F + f'form-{f}/rig/combat/rest.png', 'pad': pad, 'keys': keys, 'style': STYLE,
         'segments': segments, 'game': game, 'out': F + f'form-{f}/{action}.webp', 'forms': [f, action], 'cols': 6, 'frameDuration': 40,
         'scale': pad, 'footY': round(off / (n - 512), 4), **(extra or {})}
    for k in ('pick', 'roles', 'loop', 'review', 'pick_note'):
        if k in old:
            s[k] = old[k]
    p.write_text(json.dumps(s, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def main(recoil_dir=None):
    if recoil_dir:
        for f in ('2', '3'):
            d = B / f'f{f}-hurt' / 'keys'; d.mkdir(parents=True, exist_ok=True)
            Image.open(Path(recoil_dir) / f'f{f}-recoil-s21-n13-000.png').convert('RGB').resize((512, 512), Image.LANCZOS).save(d / 'recoil-src.png')
    for f in ('2', '3'):
        W = WHO[f]
        spec(f, 'hurt', f'Mika hình thái {f} · bị đánh (sheet hurt mới)',
             {'recoil': {'file': F + f'clips/f{f}-hurt/keys/recoil-src.png', 'note': 'giật nhắm mắt (Qwen Edit 2511 + Consistency, 12/11)'}},
             [{'name': 'K2', 'start': 'recoil', 'end': 'rest', 'length': 13, 'prompt': W + "already recoiling from a hard hit at the first frame, dazed with eyes shut, immediately begins recovering: no second jolt. She opens her eyes, steadies herself with a slight knee flex and returns smoothly to her guard stance of the last frame; hair, cape and tails swing with one diminishing overshoot." + PLANT + KEEP}],
             {'code': 'setSpriteAction(hero,hurt,~420ms) phát đều; trước đây dạng 2-3 không có sheet hurt (giữ thế nghỉ + đẩy lùi)', 'plan': 'rest -> recoil (giật tức thì) -> K2 hồi phục -> rest'})
        spec(f, 'cast', f'Mika hình thái {f} · gồng chiêu (sheet cast)', {'raise': key(f, 'cast.webp', 3, 3, 2, {'2': .9959, '3': 1.4}[f], 'tư thế gồng chiêu đã duyệt')},
             [{'name': 'T', 'start': 'rest', 'end': 'raise', 'length': 17, 'prompt': W + "from her guard stance smoothly moves into the power stance of the last frame, gathering strength, a rising breeze lifting her hair, cloth and tails." + PLANT + KEEP},
              {'name': 'U', 'start': 'raise', 'end': 'rest', 'length': 17, 'prompt': W + "from the power stance smoothly returns to her calm guard stance of the last frame; hair, cloth and tails settle into a gentle sway, never freezing." + PLANT + KEEP}],
             {'code': 'cast/buff/victory: setSpriteAction duration, phát đều', 'plan': 'T rồi U, khung cuối = rest'})
        run = {'2': "holding the greatsword with its broad blade resting on her right shoulder,", '3': "holding the glaive slanted back over her right shoulder, the crescent blade up behind her,"}[f]
        spec(f, 'run', f'Mika hình thái {f} · vào/rời sân + di chuyển Quảng Trường (sheet run)', {},
             [{'name': 'X', 'start': 'rest', 'length': 49, 'prompt': W + "from her guard stance first settles the rigid weapon, " + run + " then begins a steady run in place toward screen-right: locked stationary camera, no horizontal drift, pan, zoom or turn. Her legs alternate in a clear running gait with clear foot contacts, her free arm pumps and her torso bobs subtly; she keeps the same pace to the end. Hair, cape and tails stream and bounce behind her." + KEEP}],
             {'code': 'departVictoriousHero (vào chạy 1 lần rồi lặp); plaza move dùng cùng sheet (loop)' + (', mikaFoxDash dùng sheet dash = run' if f == '3' else ''), 'plan': '8 khung vào chạy + vòng 16 khung kín'},
             {'frameDuration': 55})
    spec('2', 'attack', 'Mika hình thái 2 · đánh thường (sheet attack)',
         {'raise': key('2', 'attack.webp', 2, 3, 2, .9758, 'kiếm giơ cao thẳng đứng (đã duyệt)'), 'cleave': key('2', 'attack.webp', 3, 3, 2, .9758, 'bổ xuống (đã duyệt)')},
         [{'name': 'P', 'start': 'rest', 'end': 'raise', 'length': 13, 'prompt': WHO['2'] + "from her guard stance lifts the greatsword with both hands straight up high above her head into the raised pose of the last frame. No pause at the endpoint." + PLANT + KEEP},
          {'name': 'Q', 'start': 'raise', 'end': 'cleave', 'length': 9, 'prompt': WHO['2'] + "from the raised pose brings the greatsword down in one heavy, fast cleave toward screen-right into the pose of the last frame, the wide blade clearly visible in every frame." + PLANT + KEEP},
          {'name': 'R', 'start': 'cleave', 'end': 'rest', 'length': 17, 'prompt': WHO['2'] + "after a heavy cleave, the blade follows through a little lower, then she lifts the greatsword back into her guard stance of the last frame. No second attack." + PLANT + KEEP}],
         {'code': 'combat-v3 attack(): roles 0-5, chạm ~427ms; vệt chém slash2 (forms-mika)', 'plan': 'P ~7, Q ~8, R ~8 + rest; roles ánh xạ 6 tư thế'})
    spec('3', 'attack', 'Mika hình thái 3 · đánh thường (đâm đao, sheet attack)',
         {'guard': key('3', 'thrust3.webp', 1, 3, 1, 2.562, 'thế thủ đâm (đã duyệt)'), 'thrust': key('3', 'thrust3.webp', 2, 3, 1, 2.562, 'đâm thẳng (đã duyệt)')},
         [{'name': 'P', 'start': 'rest', 'end': 'guard', 'length': 13, 'prompt': WHO['3'] + "from her resting pose takes the glaive in both hands and levels it into the thrusting guard of the last frame, left hand supporting the shaft in front, right hand on the butt end." + PLANT + KEEP},
          {'name': 'Q', 'start': 'guard', 'end': 'thrust', 'length': 9, 'prompt': WHO['3'] + "from the thrusting guard drives the glaive straight forward in one fast spear thrust toward screen-right into the pose of the last frame, the right hand pushing the shaft through the left hand; the crescent blade clearly visible." + KEEP},
          {'name': 'R', 'start': 'thrust', 'end': 'guard', 'length': 9, 'prompt': WHO['3'] + "after a spear thrust pulls the glaive back smoothly into the thrusting guard of the last frame." + KEEP},
          {'name': 'S', 'start': 'guard', 'end': 'rest', 'length': 13, 'prompt': WHO['3'] + "from the thrusting guard returns to her resting pose with the glaive upright beside her, hair and nine tails settling into a gentle sway." + PLANT + KEEP}],
         {'code': 'forms-mika form 3: thrust3 orders (0 rest, 1 guard, 2 thrust) qua combatV3Frame; pierce3 FX khi chạm', 'plan': 'roles [rest, guard, thrust] ánh xạ sang khung clip; runtime đi qua mọi khung giữa'}, pad=1.9)


if __name__ == '__main__':
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else None)
    print('specs ok')
