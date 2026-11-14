"""Clip-route specs for the heroes after Mika (owner 12/11: "làm lại hết các tướng còn lại"; Noct stays as it is).

One table per hero: who each form is (the clip prompt's subject), and per sheet the chain of approved poses taken from its
older sheet (cells placed on the resting frame by sheet_fit), the motion between them, and how many clip frames each step
gets. Writes assets/heroes/forms/<hero>/clips/<id>/spec.json (keeping picks/reviews already made), auto-picks frames
evenly when a spec has none yet, and lists roles (the old six poses -> clip frames).

python assets/heroes/clip_specs.py <hero> [id ...]
"""
import json, sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from clip_pipeline import sheet_fit, ROOT  # noqa: E402

STYLE = ("Static locked camera, three-quarter view facing screen-right, matching the reference, the whole body, weapon and shield always "
         "inside the frame with a margin, the face visible, the flat solid magenta background never changes. Clean anime game sprite "
         "animation, crisp lines. Hair, cloth, cape and loose pieces always keep moving with natural delay and follow-through, never frozen.")
PLANT = " Feet adjust minimally between the supplied endpoint stances, staying grounded without sliding or hopping; no turning or scale change."


def keep(pron='his', weapon='weapon'):
    return (f" Arms, shoulders and torso drive the action; hair, cloth and cape follow with natural overlapping motion. Preserve {pron} identity, "
            f"costume, proportions and the single rigid {weapon}, always drawn whole and clearly visible. No added effects, aura, glow, dust or particles.")


HEROES = {
    'earth': {
        'name': 'Nori', 'pron': 'his', 'weapon': 'hammer and the single shield',
        'f1sheets': 'assets/reimagined/heroes/earth',
        'who': {
            '1': "A chibi young knight with messy brown hair, small golden antlers with green leaves and green eyes, in bronze and gold armour with a white fur collar, a green leaf-pattern tabard and cape, a stone-and-gold war hammer in his right hand and a tall rectangular green tower shield with a golden tree emblem in his left, ",
            '2': "A chibi young knight with messy brown hair, small golden antlers with green leaves and green eyes, in silver plate armour with gold trim, a green scarf, a green leaf-pattern tabard and cape, a grey stone war hammer with gold bands in his right hand and a green kite shield with a golden tree emblem in his left, ",
            '3': "A chibi young forest knight with messy brown hair, big golden antlers with leaves and green eyes, in ornate white-gold and emerald armour wrapped in pale roots and covered in green leaves, a huge emerald crystal war hammer bound with pale roots in his right hand and a large emerald shield with a golden tree emblem framed by roots and leaves in his left, ",
        },
        'pad': {'1': 1.0, '2': 1.25, '3': 1.3},
        'sheets': [
            # (form, action, source sheet, keys {name: cell}, chain [(from, to, length, motion, frames)], game note)
            ('1', 'attack', 'attack.webp', {'raise': 2, 'slam': 3},
             [('rest', 'raise', 13, "from his guard stance swings the war hammer up and back over his shoulder into the raised pose of the last frame, the shield staying in front of him", 7),
              ('raise', 'slam', 9, "from the raised pose brings the war hammer down in one heavy, fast overhead smash toward screen-right into the pose of the last frame, the hammer head clearly visible in every frame", 5),
              ('slam', 'rest', 17, "after the heavy smash the hammer head rests a moment low in front, then he lifts it back into his guard stance of the last frame. No second attack", 9)],
             'combat-v3 attack(): roles 0 guard, 1 drawn back, 2 swing starts, 3 contact ~427ms, 4 follow-through, 5 recover'),
            ('1', 'cast', 'cast.webp', {'gather': 1, 'rush': 3},
             [('rest', 'gather', 13, "from his guard stance crouches down behind his tower shield and plants the hammer, gathering strength, into the pose of the last frame", 7),
              ('gather', 'rush', 13, "from the crouch drives forward behind the tower shield into the low shield-rush pose of the last frame, shield first, the hammer held back", 7),
              ('rush', 'rest', 17, "after the shield rush rises and steps back into his calm guard stance of the last frame", 8)],
             'self-buffs.js noriRenewalUltimate: cast 0 at 0, 1 at 350, 2 at 750, 3 at 1200 (shield rush), 4 at 1550 (bash, renewal), 5 at 2450 (recover)'),
            ('2', 'attack', 'attack.webp', {'raise': 2, 'slam': 3},
             [('rest', 'raise', 13, "from his guard stance lifts the war hammer straight up high above his head into the raised pose of the last frame, the shield staying at his side", 7),
              ('raise', 'slam', 9, "from the raised pose brings the war hammer down in one heavy, fast overhead smash toward screen-right onto the ground into the pose of the last frame, the hammer head clearly visible in every frame", 5),
              ('slam', 'rest', 17, "after the heavy smash he lifts the hammer from the ground and returns to his guard stance of the last frame. No second attack", 9)],
             'combat-v3 attack() (forms-nori noriHammerAttack): roles 0 guard .. 3 contact .. 5 recover'),
            ('3', 'attack', 'attack.webp', {'raise': 2, 'slam': 3},
             [('rest', 'raise', 13, "from his guard stance lifts the huge crystal hammer straight up high above his head into the raised pose of the last frame, the shield staying at his side", 7),
              ('raise', 'slam', 9, "from the raised pose brings the crystal hammer down in one heavy, fast overhead smash toward screen-right onto the ground into the pose of the last frame, the hammer head clearly visible in every frame", 5),
              ('slam', 'rest', 17, "after the heavy smash he lifts the hammer from the ground and returns to his guard stance of the last frame. No second attack", 9)],
             'combat-v3 attack() (forms-nori noriHammerAttack): roles 0 guard .. 3 contact .. 5 recover'),
        ],
        'hurt': {},
        'run': "first lowers the hammer to his side, then begins a steady jog in place toward screen-right, shield held in front: locked stationary camera, no horizontal drift, pan, zoom or turn. His legs alternate in a clear running gait with clear foot contacts and his torso bobs subtly; he keeps the same pace to the end. Cape and scarf bounce behind him.",
        'recoil': "Change only his pose and expression: he is struck hard from the right side, his eyes squeezed shut in pain, head and shoulders thrown back toward the left, knees bent absorbing the blow, still holding his hammer and his shield. No motion lines, sweat drops, shadow or effects. Keep exactly the same character, costume, colours, hammer and shield design, the same size and position in the picture, flat magenta background.",
    },
    'novice': {
        'name': 'Hiro', 'pron': 'his', 'weapon': 'sword',
        'f1sheets': 'assets/heroes/novice',
        'who': {
            '1': "A chibi young boy adventurer with messy light-brown hair with an ahoge, brown eyes, a green scarf, a brown leather vest over a cream shirt, brown trousers and boots, holding a simple wooden training sword in his right hand, ",
            '2': "A chibi young boy swordsman with messy light-brown hair with an ahoge, brown eyes, a long tattered olive-green scarf and cape, a steel shoulder guard, a quilted brown leather jerkin, leather bracers, brown trousers and boots, holding a plain steel sword in his right hand, ",
            '3': "A chibi young boy knight with messy light-brown hair with an ahoge, brown eyes, a tattered olive-green cape, a steel breastplate and steel arm and leg armour over brown leather, holding a long steel longsword in his right hand, ",
        },
        'pad': {'1': 1.0, '2': 1.0, '3': 1.0},
        'sheets': [
            ('1', 'attack', 'attack.webp', {'back': 1, 'swing': 2, 'low': 3},
             [('rest', 'back', 13, "from his ready stance draws the wooden sword back up over his right shoulder into the pose of the last frame", 6),
              ('back', 'swing', 9, "swings the wooden sword forward in one fast level slash toward screen-right into the pose of the last frame, the blade clearly visible in every frame", 4),
              ('swing', 'low', 9, "carries the slash on down into the low diagonal follow-through of the last frame", 3),
              ('low', 'rest', 13, "after the slash returns to his ready stance of the last frame. No second attack", 6)],
             'combat-v3 attack(): roles 0 guard, 1 drawn back, 2 swing starts, 3 contact ~427ms, 4 follow-through, 5 recover',
             {'roles': ['start', 'back', 'back', 'swing', 'low', 'rest']}),
            ('1', 'skill', 'skill.webp', {'s0': 0, 's1': 1, 's2': 2, 's3': 3, 's4': 4, 's5': 5},
             [('rest', 's0', 9, "raises the wooden sword straight up in front of him, eager, into the pose of the last frame", 3),
              ('s0', 's1', 13, "winds up, dropping into a low crouch with the sword drawn back behind him, into the pose of the last frame", 5),
              ('s1', 's2', 9, "springs forward into a low dash, the sword held back low, into the pose of the last frame", 3),
              ('s2', 's3', 9, "rises up out of the dash, lifting the sword high overhead with both hands, into the pose of the last frame", 3),
              ('s3', 's4', 9, "brings the wooden sword down in one big earnest overhead chop into the low follow-through of the last frame, the blade clearly visible", 3),
              ('s4', 's5', 13, "straightens up and lifts the sword proudly upright beside him into the pose of the last frame", 5),
              ('s5', 'rest', 13, "lowers the sword back into his ready stance of the last frame", 5)],
             'forms-tan.js tanSpiritSword: skill 0 at 0, 1 at 460 (wind-up), 2 at 860 (dash), 3 rise, 4 at 1270 (slash), 5 at 1760',
             # the old skill sheet was drawn bigger and shown at scale 0.88 (meta.json): its cells shrink about the feet
             {'fit': [0.884, 5, 28], 'roles': ['s0', 's1', 's2', 's3', 's4', 's5']}),
            ('2', 'attack', 'attack.webp', {'back': 1, 'swing': 2, 'low': 3},
             [('rest', 'back', 13, "from his ready stance draws the steel sword back up over his right shoulder into the pose of the last frame", 6),
              ('back', 'swing', 9, "swings the steel sword forward in one fast level slash toward screen-right into the pose of the last frame, the blade clearly visible in every frame", 4),
              ('swing', 'low', 9, "carries the slash on down into the low follow-through of the last frame", 3),
              ('low', 'rest', 13, "after the slash returns to his ready stance of the last frame. No second attack", 6)],
             'combat-v3 attack() (forms-hiro hiroStarAttack 2): roles 0 guard .. 3 contact .. 5 recover',
             {'roles': ['start', 'back', 'back', 'swing', 'low', 'rest']}),
            ('2', 'skill', 'skill.webp', {'s0': 0, 's1': 1, 's2': 2, 's3': 3, 's4': 4, 's5': 5},
             [('rest', 's0', 9, "drops into a low stance with the steel sword held low behind him into the pose of the last frame", 3),
              ('s0', 's1', 9, "dashes forward low, the sword sweeping forward level, into the pose of the last frame", 3),
              ('s1', 's2', 9, "cuts across in a fast level slash into the pose of the last frame, the blade clearly visible", 3),
              ('s2', 's3', 9, "cuts upward in a rising slash, the sword ending high up toward screen-right, into the pose of the last frame", 3),
              ('s3', 's4', 9, "brings the sword down in a fast cross cut into the low crouch of the last frame", 3),
              ('s4', 's5', 13, "rises from the crouch into the pose of the last frame", 4),
              ('s5', 'rest', 13, "returns to his ready stance of the last frame", 5)],
             'forms-hiro.js hiroChainSlash: skill 0 at 0, 1 at 420 (ready), 2 at 980 (cut), 3 at 1240 (rise), 4 at 1500 (finish), 5 settle',
             {'fit_from': 'attack.webp', 'roles': ['s0', 's1', 's2', 's3', 's4', 's5'], 'pad': 1.2}),
            ('3', 'attack', 'attack.webp', {'raise': 1, 'front': 2, 'low': 3},
             [('rest', 'raise', 13, "from his ready stance lifts the longsword straight up high in both hands into the pose of the last frame", 6),
              ('raise', 'front', 9, "brings the longsword down in front of him into the pose of the last frame", 3),
              ('front', 'low', 9, "cuts on down in one fast heavy slash toward screen-right into the low pose of the last frame, the long blade clearly visible", 4),
              ('low', 'rest', 13, "after the slash returns to his ready stance of the last frame. No second attack", 6)],
             'combat-v3 attack() (forms-hiro hiroStarAttack 3, hiroBasicSlash): roles 0 guard .. 3 contact .. 5 recover',
             {'roles': ['start', 'raise', 'front', 'low', 'low', 'rest']}),
            ('3', 'skill', 'skill.webp', {'s0': 0, 's1': 1, 's2': 2, 's3': 3, 's4': 4, 's5': 5},
             [('rest', 's0', 9, "raises the longsword straight up high in both hands into the pose of the last frame", 3),
              ('s0', 's1', 13, "lowers the longsword to hold it upright in front of his face in a knightly salute, eyes closed, into the pose of the last frame", 4),
              ('s1', 's2', 9, "coils, swinging the longsword back over his right shoulder, into the pose of the last frame", 3),
              ('s2', 's3', 9, "steps in and raises the longsword high up and back for a big cut into the pose of the last frame", 3),
              ('s3', 's4', 9, "sweeps the longsword down in one big fast crescent cut into the low lunge of the last frame, the long blade clearly visible", 3),
              ('s4', 's5', 13, "rises from the lunge, the sword lowered at his side, into the pose of the last frame", 4),
              ('s5', 'rest', 13, "returns to his ready stance of the last frame", 5)],
             'forms-hiro.js hiroJewelSlash: skill 0 at 0, 1 at 620 (salute), 2 at 900 (coil), 3 at 1150 (step), 4 at 1400 (cut), 5 at 2240 (finish)',
             {'fit_from': 'attack.webp', 'roles': ['s0', 's1', 's2', 's3', 's4', 's5'], 'pad': 1.2}),
        ],
        'hurt': {},
        'run': "first lowers the sword to his side, then begins a steady run in place toward screen-right: locked stationary camera, no horizontal drift, pan, zoom or turn. His legs alternate in a clear running gait with clear foot contacts, his free arm pumps and his torso bobs subtly; he keeps the same pace to the end. Hair, scarf and cape bounce behind him.",
        'recoil': "Change only his pose and expression: he is struck hard from the right side, his eyes squeezed shut in pain, head and shoulders thrown back toward the left, knees bent absorbing the blow, still holding his sword. No motion lines, sweat drops, shadow or effects. Keep exactly the same character, costume, colours and sword design, the same size and position in the picture, flat magenta background.",
    },
    'ice': {
        'name': 'Yuki', 'pron': 'her', 'subj': 'She', 'obj': 'herself', 'weapon': 'staff',
        'f1sheets': 'assets/reimagined/heroes/ice',
        'who': {
            '1': "A chibi bunny-eared girl mage with long silver-lavender hair in a thick braid, blue eyes, a dark navy hood with white rabbit ears and a snowflake ornament, a white fur-trimmed navy and ice-blue robe with a long flowing cape, white stockings and boots, holding a slender silver staff topped with a crescent moon and an ice-blue snowflake in her right hand, ",
            '2': "A chibi bunny-eared girl mage with long silver-lavender hair in a thick braid, blue eyes, a navy hood with tall white rabbit ears and a crescent and snowflake ornament, a white fur-collared navy coat with a long ice-blue snowflake cape, white stockings and boots, holding a tall silver staff topped with a crescent moon and an ice-blue snowflake in her right hand, ",
            '3': "A chibi bunny-eared ice priestess with long silver-lavender braids, blue eyes, a crystal snowflake tiara, a white and ice-blue gown with crystal patterns, a long navy and ice-blue cape, white crystal armoured boots, holding a tall staff topped with a large ice-blue crystal crescent moon in her right hand and a crystal ice fan in her left hand, ",
        },
        'pad': {'1': 1.0, '2': 1.0, '3': 1.1},
        'sheets': [
            ('1', 'attack', 'attack.webp', {'ready': 2, 'push': 3},
             [('rest', 'ready', 9, "brings the staff forward in both hands, ready to strike, into the pose of the last frame", 4),
              ('ready', 'push', 9, "thrusts the staff forward toward screen-right in one quick jab into the pose of the last frame, the staff clearly visible", 4),
              ('push', 'rest', 17, "draws the staff back and returns to her calm stance of the last frame. No second attack", 8)],
             'combat-v3 attack(): roles 0 guard, 1 drawn back, 2 swing starts, 3 contact ~427ms, 4 follow-through, 5 recover',
             {'roles': ['start', 'ready', 'ready', 'push', 'push', 'rest']}),
            ('1', 'cast', 'cast.webp', {'focus': 1, 'open': 2, 'raise': 3, 'point': 4},
             [('rest', 'focus', 9, "closes her eyes and gathers her magic, holding the staff close, into the pose of the last frame", 3),
              ('focus', 'open', 9, "opens her free hand out to the side into the pose of the last frame", 3),
              ('open', 'raise', 13, "raises her free hand high above her head, calling down the cold, into the pose of the last frame", 4),
              ('raise', 'point', 9, "sweeps her hand down to point forward at the enemy toward screen-right into the pose of the last frame", 3),
              ('point', 'rest', 17, "lowers her hand and returns to her calm stance of the last frame", 6)],
             'yuki-ultimate.js yukiGlacierUltimate: cast 0 at 0, 1 at 350, 2 at 800, 3 at 1250, 4 at 1800, 5 at 2500',
             {'fit_from': 'attack.webp', 'roles': ['start', 'focus', 'open', 'raise', 'point', 'rest']}),
            ('2', 'attack', 'attack.webp', {'raise': 1, 'swing': 2, 'low': 3},
             [('rest', 'raise', 13, "lifts the staff up high over her shoulder into the pose of the last frame", 5),
              ('raise', 'swing', 9, "swings the staff down and forward in one fast arc toward screen-right into the pose of the last frame, the crescent head clearly visible", 4),
              ('swing', 'low', 9, "carries the swing on into the low follow-through of the last frame", 3),
              ('low', 'rest', 13, "rises and returns to her calm stance of the last frame. No second attack", 6)],
             'combat-v3 attack(): roles 0 guard .. 3 contact .. 5 recover',
             {'roles': ['start', 'raise', 'raise', 'swing', 'low', 'rest']}),
            ('2', 'skill', 'skill.webp', {'s1': 1, 's2': 2, 's3': 3, 's4': 4},
             [('rest', 's1', 9, "closes her eyes and holds the staff close, gathering moonlight, into the pose of the last frame", 3),
              ('s1', 's2', 13, "raises the staff high above her head and opens her free hand into the pose of the last frame", 5),
              ('s2', 's3', 9, "holds the staff up high to the moon into the pose of the last frame", 3),
              ('s3', 's4', 9, "sweeps the staff down low toward screen-right, sending the moonbeam, into the pose of the last frame", 4),
              ('s4', 'rest', 17, "rises and returns to her calm stance of the last frame", 7)],
             'forms-yuki.js (four stars): skill 0 at 0, 1 at 260, 2 at 560 (moonrise), 3 at 900, 4 at 1250 (moonbeam), 5 at 1600, 0 at 2600 (recover)',
             {'fit_from': 'attack.webp', 'roles': ['start', 's1', 's2', 's3', 's4', 'rest'], 'pad': 1.25, 'back': 'rest'}),
            ('3', 'attack', 'attack.webp', {'up': 1, 'fwd': 2, 'push': 3},
             [('rest', 'up', 9, "lifts the crystal fan up in her left hand into the pose of the last frame", 4),
              ('up', 'fwd', 9, "brings the open fan forward into the pose of the last frame", 3),
              ('fwd', 'push', 9, "sweeps the fan forward toward screen-right in one quick gust into the pose of the last frame, the fan clearly visible", 4),
              ('push', 'rest', 13, "draws the fan back to her chest and returns to her calm stance of the last frame. No second attack", 6)],
             'combat-v3 attack(): roles 0 guard .. 3 contact .. 5 recover',
             {'roles': ['start', 'up', 'fwd', 'push', 'push', 'rest']}),
            ('3', 'skill', 'skill.webp', {'s0': 0, 's1': 1, 's2': 2, 's3': 3, 's4': 4},
             [('rest', 's0', 9, "raises the crystal fan before her face into the pose of the last frame", 3),
              ('s0', 's1', 9, "closes her eyes behind the fan, gathering her power, into the pose of the last frame", 3),
              ('s1', 's2', 9, "flings the fan open with her arm stretched out wide into the pose of the last frame", 3),
              ('s2', 's3', 13, "raises the tall crescent staff high over her head into the pose of the last frame", 5),
              ('s3', 's4', 9, "sweeps the crescent staff down low toward screen-right in one big arc into the pose of the last frame, the crescent clearly visible", 4),
              ('s4', 'rest', 17, "rises and returns to her calm stance of the last frame", 7)],
             'forms-yuki.js (six stars): skill 0 at 0, 1 at 300, 2 at 640 (fan), 3 at 1150 (raise), 4 at 1500 (crescent), 5 at 1960 (bloom-hold)',
             {'fit_from': 'attack.webp', 'roles': ['s0', 's1', 's2', 's3', 's4', 'rest'], 'pad': 1.35}),
        ],
        'hurt': {},
        'run': "first holds the staff upright at her side, then begins a light, quick run in place toward screen-right: locked stationary camera, no horizontal drift, pan, zoom or turn. Her legs alternate in a clear running gait with clear foot contacts and her torso bobs subtly; she keeps the same pace to the end. Hair braid, ears and cape bounce behind her.",
        'recoil': "Change only her pose and expression: she is struck hard from the right side, her eyes squeezed shut in pain, head and shoulders thrown back toward the left, knees bent absorbing the blow, still holding her staff. No motion lines, sweat drops, tears, shadow or effects. Keep exactly the same character, costume, colours and staff design, the same size and position in the picture, flat magenta background.",
    },
    'lightning': {
        'name': 'Lumi', 'pron': 'her', 'subj': 'She', 'obj': 'herself', 'weapon': 'staff', 'bg': 'green',
        'plant': ' She keeps floating in the air on the same spot, feet off the ground, without drifting; no turning or scale change.',
        'f1sheets': 'assets/reimagined/heroes/lightning',
        'who': {
            '1': "A chibi blonde witch girl floating in the air, long golden hair in low braids, violet eyes, a big purple witch hat with a golden crescent moon and stars, a purple and gold star-patterned cape, black shorts and black thigh boots, a spellbook at her hip, holding a dark star-orb staff in her right hand, ",
            '2': "A chibi blonde witch girl floating in the air, long golden hair in low braids, violet eyes, a big purple witch hat with a golden crescent moon and star charms, a purple and gold star-patterned cape, a spellbook on her belt, black shorts and black boots, holding a golden staff topped with a dark star orb in her right hand, ",
            '3': "A chibi blonde star sorceress floating in the air, long golden hair, amber eyes, a white and purple witch hat crowned with golden stars and a crescent moon, small golden wings, a white, gold and purple star gown with a long cape, white armoured boots, holding a tall golden spear-staff topped with a star inside golden orbit rings in her right hand, ",
        },
        'pad': {'1': 1.0, '2': 1.0, '3': 1.0},
        'sheets': [
            ('1', 'attack', 'attack.webp', {'pull': 2, 'thrust': 3},
             [('rest', 'pull', 9, "draws the staff in close, ready to cast, into the pose of the last frame", 4),
              ('pull', 'thrust', 9, "thrusts the staff forward toward screen-right in one quick cast into the pose of the last frame, the staff clearly visible", 4),
              ('thrust', 'rest', 17, "draws the staff back and floats back into her calm pose of the last frame. No second attack", 8)],
             'combat-v3 attack(): roles 0 guard, 1 drawn back, 2 swing starts, 3 contact, 4 follow-through, 5 recover',
             {'roles': ['start', 'pull', 'pull', 'thrust', 'thrust', 'rest']}),
            ('1', 'cast', 'cast.webp', {'book': 1, 'lift': 2, 'high': 3, 'point': 4},
             [('rest', 'book', 9, "opens her spellbook, gathering lightning, into the pose of the last frame", 3),
              ('book', 'lift', 9, "lifts the staff up beside the open book into the pose of the last frame", 3),
              ('lift', 'high', 13, "raises the staff high above her head, calling the storm, into the pose of the last frame", 4),
              ('high', 'point', 9, "swings the staff down to point forward at the enemy toward screen-right into the pose of the last frame", 3),
              ('point', 'rest', 17, "lowers the staff and floats back into her calm pose of the last frame", 6)],
             'combat-v3 rageChoreography (form 1 ultimate): cast 0, 1, 2 during the wind-up, then the attack frames; hits play the cast sheet',
             {'roles': ['start', 'book', 'lift', 'high', 'point', 'rest']}),
            ('1', 'hover', 'hover.webp', {},
             [('rest', 'rest', 25, "floats in the air, bobbing gently up and down on the wind, her hair, braids, hat tip and cape flowing; she stays on the same spot and returns to the pose of the last frame", 22)],
             'rời sân (bay) + Quảng Trường: vòng bay lơ lửng', {'roles': None, 'loop_all': True}),
            ('2', 'attack', 'attack.webp', {'w': 1, 'l': 3, 'f': 4},
             [('rest', 'w', 9, "draws the staff back over her shoulder, winding up, into the pose of the last frame", 4),
              ('w', 'l', 9, "flings the staff forward toward screen-right, throwing a spell, into the pose of the last frame, the staff clearly visible", 4),
              ('l', 'f', 9, "follows through into the pose of the last frame", 3),
              ('f', 'rest', 17, "floats back into her calm pose of the last frame. No second attack", 7)],
             'forms-lumi.js lumiStarAttack form 2: windup 1, launch 3, follow 4, then 5',
             {'roles': ['start', 'w', 'w', 'l', 'f', 'rest']}),
            ('2', 'skill', 'skill.webp', {'s1': 1, 's2': 2, 's3': 3, 's4': 4},
             [('rest', 's1', 9, "lifts the staff and waves her free hand into the pose of the last frame", 3),
              ('s1', 's2', 9, "raises the staff high above her head into the pose of the last frame", 3),
              ('s2', 's3', 13, "holds the staff up to the sky, calling the storm, into the pose of the last frame", 4),
              ('s3', 's4', 9, "swings the staff down to point forward at the enemy toward screen-right into the pose of the last frame", 3),
              ('s4', 'rest', 17, "lowers the staff and floats back into her calm pose of the last frame", 6)],
             'forms-lumi.js (four stars): skill 0, 1 at 200, 2 at 460, 3 at 1100 (channel), 4 at 1500 (release), 5 at 2450',
             {'fit': [1.375, 0, -84], 'roles': ['start', 's1', 's2', 's3', 's4', 'rest'], 'pad': 1.15}),
            ('2', 'hover', 'hover.webp', {},
             [('rest', 'rest', 25, "floats in the air, bobbing gently up and down on the wind, her hair, braids, hat tip and cape flowing; she stays on the same spot and returns to the pose of the last frame", 22)],
             'rời sân (bay) + Quảng Trường: vòng bay lơ lửng', {'roles': None, 'loop_all': True}),
            ('3', 'attack', 'attack.webp', {'w': 1, 'l': 2, 'f': 3},
             [('rest', 'w', 9, "raises the spear-staff up and back, winding up, into the pose of the last frame", 4),
              ('w', 'l', 9, "swings the spear-staff forward toward screen-right, firing a bolt, into the pose of the last frame, the staff clearly visible", 4),
              ('l', 'f', 9, "follows through into the pose of the last frame", 3),
              ('f', 'rest', 17, "floats back into her calm pose of the last frame. No second attack", 7)],
             'forms-lumi.js lumiStarAttack form 3: windup 1, launch 2, follow 3, then 5',
             {'fit': [1.375, 0, -84], 'roles': ['start', 'w', 'l', 'f', 'f', 'rest'], 'pad': 1.2}),
            ('3', 'skill', 'skill.webp', {'s2': 2, 's3': 3, 's4': 4},
             [('rest', 's2', 13, "raises the spear-staff high above her head into the pose of the last frame", 5),
              ('s2', 's3', 13, "holds the spear-staff up to the sky, calling the storm, into the pose of the last frame", 4),
              ('s3', 's4', 9, "levels the spear-staff and thrusts it forward toward screen-right into the pose of the last frame", 3),
              ('s4', 'rest', 17, "lowers the spear-staff and floats back into her calm pose of the last frame", 6)],
             'forms-lumi.js (six stars): skill 0, 1 at 200, 2 at 460, 3 at 1180 (channel), 4 at 1480 (release), 5 at 2450; depart: skill 1 then ride',
             {'fit': [1.375, 0, -84], 'roles': ['start', 'start', 's2', 's3', 's4', 'rest'], 'pad': 1.3}),
            ('3', 'ride', 'ride.webp', {'ride': 0},
             [('ride', 'ride', 25, "rides her spear-staff through the air like a broom toward screen-right, sitting on it, her long hair, cape and hat streaming back in the wind, bobbing slightly; she stays on the same spot and returns to the pose of the last frame", 22)],
             'forms-lumi.js depart form 3: ride frames looped while she flies off', {'fit': [1.375, 0, -84], 'roles': None, 'loop_all': True, 'pad': 1.3, 'start_key': 'ride'}),
        ],
        'hurt': {},
        'run': None,
        'recoil': "Change only her pose and expression: she is struck hard from the right side while floating, a painful grimace with eyebrows knitted and eyes squeezed shut, head and shoulders thrown back toward the left, still holding her staff. No motion lines, sparks, sweat drops, shadow or effects. Keep exactly the same character, costume, colours and staff design, the same size and position in the picture, flat green background.",
    },
}


def out_paths(hero, form, action):
    H = HEROES[hero]
    if form == '1':
        base = H['f1sheets']
        if hero == 'novice':    # Hiro's form 1: one meta.json for every action
            return f'{base}/{action}.webp', {'novice_meta': f'{base}/meta.json'}
        return f'{base}/{action}.webp', {'meta': f'{base}/{action}/runtime-meta.json'}
    return f'assets/heroes/forms/{hero}/form-{form}/{action}.webp', {'forms': [form, action]}


def source(hero, form, name):
    H = HEROES[hero]
    return f"{H['f1sheets']}/{name}" if form == '1' else f'assets/heroes/forms/{hero}/form-{form}/{name}'


def cell_of(path, i, cols=3, rows=2):
    im = Image.open(ROOT / path).convert('RGBA'); cw, ch = im.width // cols, im.height // rows
    return im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)).resize((512, 512), Image.LANCZOS)


FITS = {}


def fit_of(hero, form, sheet):
    """The older sheet's placement on the resting frame, from its resting cell (0, or the last one)."""
    k = (hero, form, sheet)
    if k not in FITS:
        rest = Image.open(ROOT / f'assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png')
        FITS[k] = max((sheet_fit(rest, cell_of(sheet, i)) for i in (0, 5)), key=lambda r: r[1])
        print('fit', sheet, FITS[k])
    return FITS[k][0]


def auto_pick(chain, keys_in_order):
    """Frames evenly from each clip (its own first and last left out: the keys stand there), keys between."""
    pick, roles_at = [['key', 'rest']], {'rest': 0}
    for seg, (a, b, length, _, n) in zip('ABCDEFGHIJ', chain):
        inner = list(range(1, length - 1))
        idx = [inner[round(i * (len(inner) - 1) / max(1, n - 1))] for i in range(n)] if n > 1 else [inner[len(inner) // 2]]
        pick += [[seg, 7, k] for k in sorted(set(idx))]
        pick.append(['key', b]); roles_at.setdefault(b, len(pick) - 1)
    return pick


def write(hero, cid, spec):
    d = ROOT / 'assets/heroes/forms' / hero / 'clips' / cid; (d / 'keys').mkdir(parents=True, exist_ok=True)
    p = d / 'spec.json'
    old = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
    for k in ('pick', 'roles', 'loop', 'review', 'pick_note', 'order', 'clock', 'introTimes', 'loopMs', 'zoom_box', 'zoom_box_fixed', 'recoil',
              'segments', 'same', 'hold_lock', 'edits', 'plaza_feet', 'also_actions'):
        if k in old:
            spec[k] = old[k]
    for n, k in (old.get('keys') or {}).items():   # a key already kept as its clip-canvas image stays (its sheet is replaced)
        if k.get('canvas') or k.get('file', '').startswith(f"assets/heroes/forms/{hero}/clips/"):
            spec.setdefault('keys', {})[n] = k
    p.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('spec', p.relative_to(ROOT))


def base(hero, form, cid, title, action, pad=None):
    H = HEROES[hero]; pad = pad or H['pad'][form]
    out, where = out_paths(hero, form, action)
    s = {'id': cid, 'hero': hero, 'title': title, 'rest': f'assets/heroes/forms/{hero}/form-{form}/rig/combat/rest.png', 'pad': pad,
         'style': STYLE.replace('magenta', 'green') if H.get('bg') == 'green' else STYLE, 'out': out, **where, 'cols': 6, 'frameDuration': 40}
    if H.get('bg'):
        s['bg'] = H['bg']
    if pad > 1:
        n = round(512 * pad); off = n - 512 - round((n - 512) * .15)
        s.update(scale=pad, footY=round(off / (n - 512), 4))
    return s


def main(hero, only=()):
    H = HEROES[hero]; K = keep(H['pron'], H['weapon'])
    for form, action, sheet, keys, chain, game, *opt in H['sheets']:
        opt = opt[0] if opt else {}
        cid = f'f{form}-{action}'
        if only and cid not in only:
            continue
        # a sheet whose cells 0 and 5 are not the resting pose (a skill) is placed like the form's attack sheet
        src = source(hero, form, sheet); fit = opt.get('fit') or fit_of(hero, form, source(hero, form, opt.get('fit_from', sheet))); W = H['who'][form]
        s = base(hero, form, cid, f"{H['name']} hình thái {form} · {action}", action, opt.get('pad'))
        s['keys'] = {n: {'file': src, 'cell': [i, 3, 2], 'fit': fit, 'note': f'ô {i} của sheet cũ (đã duyệt)'} for n, i in keys.items()}
        s['segments'] = [{'name': seg, 'start': a, 'end': b, 'length': L, 'prompt': W + m + '.' + H.get('plant', PLANT) + K}
                         for seg, (a, b, L, m, _) in zip('ABCDEFGHIJ', chain)]
        s['game'] = {'code': game, 'plan': 'chuỗi tư thế đã duyệt của sheet cũ làm khung mốc, clip giữa hai mốc'}
        s['pick'] = auto_pick(chain, keys)
        if opt.get('start_key'):   # a loop on a drawn pose (Lumi's ride), not on the resting frame
            s['pick'][0] = ['key', opt['start_key']]
        if opt.get('loop_all'):    # a floating/riding loop: the clip's frames, its closing frame (= its first) left out
            s['pick'] = s['pick'][:-1]; s['loop'] = [0, len(s['pick']) - 1]; s['frameDuration'] = 70
            write(hero, cid, s); continue
        # roles: the old six poses -> clip frames (guard, between, key 1, key 2, between, rest)
        at = {p[1]: i for i, p in enumerate(s['pick']) if p[0] == 'key'}; names = list(keys)
        if 'roles' in opt and opt['roles'] is None:
            pass
        elif opt.get('roles'):     # the staging's six poses are six keys of the chain (a skill)
            at['start'] = 0
            s['roles'] = [at[n] for n in opt['roles']]
            if opt.get('back'):
                s['rolesBack'] = [len(s['pick']) - 1] + [None] * 5
        else:
            k1, k2 = at[names[0]], at[names[-1]]
            s['roles'] = [0, max(1, k1 // 2), k1, k2, min(len(s['pick']) - 2, k2 + 2), len(s['pick']) - 1]
        s['stepMs'] = 17
        write(hero, cid, s)
    for form in H['who']:
        cid = f'f{form}-hurt'
        if only and cid not in only:
            continue
        W = H['who'][form]
        s = base(hero, form, cid, f"{H['name']} hình thái {form} · bị đánh", 'hurt')
        if form in H.get('hurt', {}):
            sheet, i = H['hurt'][form]; src = source(hero, form, sheet)
            s['keys'] = {'recoil': {'file': src, 'cell': [i, 3, 2], 'fit': fit_of(hero, form, src), 'note': f'ô {i} của sheet hurt cũ'}}
        else:
            s['keys'] = {'recoil': {'file': f'assets/heroes/forms/{hero}/clips/{cid}/keys/recoil-src.png', 'note': 'giật nhắm mắt (Qwen Edit 2511 + Consistency)'}}
            s['edits'] = {'recoil': H['recoil']}
            s['recoil'] = {'deg': -6, 'ms': 360}
        s['segments'] = [{'name': 'K2', 'start': 'recoil', 'end': 'rest', 'length': 13, 'prompt': W + ("already recoiling from a hard hit at the first frame, dazed with eyes shut, immediately begins recovering: no second jolt. {S} opens {P} eyes, steadies {O} with a slight knee flex and returns smoothly to {P} guard stance of the last frame; hair and cape swing with one diminishing overshoot.").format(S=H.get('subj', 'He'), P=H['pron'], O=H.get('obj', 'himself')) + H.get('plant', PLANT) + K}]
        s['game'] = {'code': 'setSpriteAction(hero,hurt,~420ms) phát đều', 'plan': 'rest -> recoil (giật tức thì) -> K2 hồi phục -> rest'}
        s['pick'] = [['key', 'rest'], ['key', 'recoil']] + [['K2', 7, k] for k in range(1, 12)] + [['key', 'rest']]
        s['fit_rest'] = True
        write(hero, cid, s)
    for form in H['who']:
        cid = f'f{form}-run'
        if only and cid not in only or not H.get('run'):
            continue
        s = base(hero, form, cid, f"{H['name']} hình thái {form} · rời sân + Quảng Trường (sheet run)", 'run')
        s['segments'] = [{'name': 'X', 'start': 'rest', 'length': 49, 'prompt': H['who'][form] + 'from ' + H['pron'] + ' guard stance ' + H['run'] + K}]
        s['game'] = {'code': 'rời sân: vào chạy 1 lần rồi lặp; Quảng Trường dùng cùng sheet (loop)', 'plan': 'khung vào chạy + vòng kín (loop_pairs)'}
        s['lock'] = 'center'; s['frameDuration'] = 55
        write(hero, cid, s)


if __name__ == '__main__':
    main(sys.argv[1], set(sys.argv[2:]))
