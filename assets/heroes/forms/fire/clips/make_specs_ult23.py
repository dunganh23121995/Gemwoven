"""Specs for Mika forms 2-3 ultimates on the clip route: clips chained through every approved skill cell, so each old
pose stays a keyframe (its FX grip is the approved one) and the clip fills the in-betweens (owner 12/11)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
B = ROOT / 'assets/heroes/forms/fire/clips'
F = 'assets/heroes/forms/fire/'
STYLE = ("Static locked camera, three-quarter view facing screen-right, matching the reference, the whole body and weapon always inside the frame, "
         "her face visible, the flat solid magenta background never changes. Clean anime game sprite animation, crisp lines. "
         "Hair, cloth and tails keep moving with natural delay and follow-through, never frozen.")
KEEP = (" Arms, shoulders and torso drive the weapon; hair, cloth and tails follow with overlapping motion. Preserve her identity, costume, proportions "
        "and the single rigid weapon, always whole and clearly visible. Feet stay grounded, adjusting only between the given stances. "
        "No added flames, aura, glow or particles.")
W2 = "A chibi fox-girl swordswoman in black and gold plate armour with a red scarf and long red cape tails, holding a big broad greatsword with a wide silver blade. "
W3 = "A chibi nine-tailed fox empress in white and gold armour with very long red hair and nine big fluffy fox tails fanned behind her, holding a long-hafted crescent moon glaive. "


def k(form, i, cols, rows, scale):
    return {'file': F + f'form-{form}/skill.webp', 'cell': [i, cols, rows], 'sheet_scale': scale, 'sheet_foot': .94, 'note': f'ô {i} của sheet tuyệt kỹ đã duyệt'}


def spec(form, pad, keys, segments, game, extra):
    n = round(512 * pad); off = n - 512 - round((n - 512) * .15)
    cid = f'f{form}-ult'; d = B / cid; (d / 'keys').mkdir(parents=True, exist_ok=True)
    p = d / 'spec.json'; old = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    s = {'id': cid, 'hero': 'fire', 'title': f'Mika hình thái {form} · tuyệt kỹ (sheet skill)', 'rest': F + f'form-{form}/rig/combat/rest.png', 'pad': pad,
         'keys': keys, 'style': STYLE, 'segments': segments, 'game': game, 'out': F + f'form-{form}/skill.webp', 'forms': [str(form), 'skill'],
         'cols': 6, 'frameDuration': 40, 'scale': pad, 'footY': round(off / (n - 512), 4), **extra}
    for key in ('pick', 'roles', 'rolesBack', 'gripKeys', 'pick_note', 'stepMs'):
        if key in old:
            s[key] = old[key]
    p.write_text(json.dumps(s, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def main():
    keys2 = {f'k{i}': k(2, i, 4, 3, 1.3117) for i in range(11)}
    moves2 = ["She raises the greatsword up high in both hands.",
              "Holding the greatsword high, she forces the blade down a little in one short heavy dip, straining.",
              "From the dip she begins to swing the blade up past vertical.",
              "The blade keeps swinging back over her head.",
              "The blade swings on back behind her head.",
              "The blade comes to lie straight back behind her head, pointing to screen-left, as she leans back slightly.",
              "From the blade straight back behind her head, she swings it over her head so it rises toward screen-right.",
              "She chops the greatsword down fast to level in front of her at screen-right: the moment of contact.",
              "The chop follows through, the blade driving on down toward the ground at screen-right.",
              "She lifts the greatsword back up into her guard, blade slanting up to screen-right.",
              "She settles smoothly into her calm guard stance, matching the exact sword angle and hand positions of the resting reference."]
    seq2 = [f'k{i}' for i in range(11)] + ['rest']
    spec(2, 1.4, keys2, [{'name': f'S{i + 1}', 'start': seq2[i], 'end': seq2[i + 1], 'length': 9,
                          'prompt': W2 + moves2[i] + " End exactly in the pose of the last frame." + KEEP} for i in range(11)],
        {'code': 'src/forms-mika.js mikaLongCleave: legacy frames 0 draw, 1 raise (300), 2 dip (950), 3-6 backswing by angle (1270-1600), 7 chop, 8 contact (1880), 9 follow (+110), 10 recover (+680); the fox-fire blade grows from MIKA_GRIPS[2] of the shown frame',
         'plan': 'mỗi ô cũ là một khung mốc; clip lấp khung chuyển tiếp; roles ánh xạ khung cũ -> khung mới, gripKeys chỉ khung mốc cho vị trí tay cầm (nội suy cho khung giữa)'},
        {'stepMs': 25})
    keys3 = {f'k{i}': k(3, i, 3, 2, 1.665) for i in range(6)}
    spec(3, 1.75, keys3, [
        {'name': 'S1', 'start': 'k0', 'end': 'k1', 'length': 13, 'prompt': W3 + "She draws the glaive back, gathering herself into the pose of the last frame." + KEEP},
        {'name': 'S2', 'start': 'k1', 'end': 'k2', 'length': 9, 'prompt': W3 + "She whips the glaive from her left side in close to her body, fast, into the pose of the last frame." + KEEP},
        {'name': 'S3', 'start': 'k2', 'end': 'k3', 'length': 9, 'prompt': W3 + "She extends the glaive level out to screen-right in one fast sweep into the pose of the last frame." + KEEP},
        {'name': 'S4', 'start': 'k3', 'end': 'k4', 'length': 9, 'prompt': W3 + "She checks the momentum and draws the glaive slightly back toward her body into the pose of the last frame, the nine tails flaring; no further wide sweep." + KEEP},
        {'name': 'S5', 'start': 'k4', 'end': 'k5', 'length': 13, 'prompt': W3 + "She draws the glaive back toward her and straightens into the pose of the last frame." + KEEP},
        {'name': 'S6', 'start': 'k5', 'end': 'rest', 'length': 13, 'prompt': W3 + "She returns smoothly to her regal resting pose, matching the exact weapon angle and hand positions of the resting reference, tails settling." + KEEP}],
        {'code': 'src/forms-mika.js six-star ultimate: legacy frames 0 (0), 1 draw (650), 2 sweep (1250), 3 (+100), 4 spirits (1550), 5 recover (2350); FX at MIKA_GRIPS[3] of legacy frames 1, 3, 4',
         'plan': 'mỗi ô cũ là một khung mốc; clip lấp khung chuyển tiếp; gripKeys = vị trí các khung mốc'},
        {'stepMs': 25})


if __name__ == '__main__':
    main()
    print('ult specs ok')
