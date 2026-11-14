"""Key poses for Hiro's 13/11 redo (redo-1311.md, Codex-agreed): drawn by Codex (Sol low) from each form's resting frame,
one per file: clips/<id>/keys/<name>-raw.png + <name>-prompt.txt. python redo_keys.py [id/name ...] (default: all)."""
import os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
CLIPS = Path(__file__).resolve().parent
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
WHO = {
    '1': "a chibi young boy adventurer with messy light-brown hair with an ahoge, brown eyes, a green scarf, a brown leather vest over a cream shirt, brown trousers and boots, holding a simple wooden training sword in his right hand",
    '2': "a chibi young boy swordsman with messy light-brown hair with an ahoge, brown eyes, a long tattered olive-green scarf and cape, a steel shoulder guard, a quilted brown leather jerkin, leather bracers, brown trousers and boots, holding a plain steel sword in his right hand",
    '3': "a chibi young boy knight with messy light-brown hair with an ahoge, brown eyes, a tattered olive-green cape, a steel breastplate and steel arm and leg armour over brown leather, holding a long steel longsword in his right hand",
}
KEYS = {
    # basic attack, main chain (form 2: a near-horizontal chest-height cut; form 3: a two-handed overhead cleave)
    ('2', 'f2-attack', 'W'): "winding up a sword cut: his rear leg loaded and knees bent, hips turned away from the enemy, the sword drawn back behind his rear shoulder with the blade pointing up and back, his free hand balancing forward, eyes on the enemy",
    # (owner 14/11 "Động tác đánh thường của Hiro2 làm lại": the level chest cut read as a thrust) a one-handed DIAGONAL
    # down-slash from over the rear shoulder through to low past the front knee; W kept, M (mid-swing) added, C and F redrawn
    ('2', 'f2-attack', 'M'): "halfway through a one-handed diagonal DOWNWARD slash: stepping toward screen-right, his right arm whipping the sword over from behind his shoulder, his sword hand above and in front of his forehead, the blade slanting UP and forward at about 45 degrees above his head (clearly coming down, not thrusting), torso turning hard into the blow, his free hand pulled back for balance, determined face",
    ('2', 'f2-attack', 'C'): "the moment a one-handed diagonal DOWNWARD slash lands: his lead foot planted in a long step toward screen-right, torso twisted hard into the cut, his right arm extended forward at shoulder height, the blade slanting DOWN and forward at about 45 degrees, cutting diagonally down through the space in front of him (clearly a downward slash, never a level thrust), his free hand pulled back, determined face",
    ('2', 'f2-attack', 'F'): "the diagonal slash carried all the way through: the sword swept down and across to low beside his front knee, the blade pointing down and back toward the ground behind his front foot, his sword arm low across his body, his body folded forward over the deeply bent front knee, the cape whipping round after the turn, determined face",
    ('3', 'f3-attack', 'W'): "winding up an overhead cleave: gripping the longsword with BOTH hands, the blade loaded high above and behind his rear shoulder, knees bent, weight on the back leg, eyes on the enemy",
    # the cleave blurred between W and C in every take (13/11): it passes through a drawn mid-swing key
    # (Codex frames review: a level blade read as a thrust) the blade still above, coming down in front of his head
    ('3', 'f3-attack', 'M'): "halfway through an overhead cleave, clearly chopping DOWN (not thrusting): stepping in toward screen-right, both hands on the hilt above his forehead bringing the longsword down from above, the blade slanting up and forward at about 45 degrees in front of and above his head, elbows bent, the body leaning into the downward blow",
    ('3', 'f3-attack', 'C'): "mid-cleave: stepping hard toward screen-right with the front knee bent, both hands driving the longsword down in front of him, the blade slanting forward and down toward the enemy at about 45 degrees, both elbows slightly flexed",
    ('3', 'f3-attack', 'F'): "the cleave finished: a low stance with the front knee deeply bent, both hands on the hilt, the longsword tip just above the ground ahead of him toward screen-right, eyes on the enemy",
    # ultimates (forms-hiro.js beats)
    ('2', 'f2-skill', 's0'): "dropping into a compact low crouch, the sword held low beside his rear hip with the blade trailing back, his free hand forward, both boots and lower legs clearly readable, focused face",
    ('2', 'f2-skill', 's1'): "leaning far forward from the ankles, the rear leg loaded ready to dash toward screen-right, the sword kept low behind his hip, the free arm reaching forward",
    ('2', 'f2-skill', 's2'): "the FOLLOW-THROUGH of a spinning horizontal slash (owner 13/11, second pass: the body must sell the cut): his whole body has spun with the swing so his back is turned three-quarters toward the viewer, the sword arm wrapped across his chest and the blade held level behind him pointing back to screen-left, in a VERY wide and low stance with both knees deeply bent, head turned to look over his shoulder at screen-right, cape whipping around him",
    ('2', 'f2-skill', 's3'): "the FOLLOW-THROUGH of a rising slash that lifts his whole body: his torso arched back, chest open, the sword swept up overhead and back with the arm fully extended, the front knee bent and the rear leg stretched straight behind him with only the toes on the ground, chin up, cape flying upward",
    ('2', 'f2-skill', 's4'): "the FOLLOW-THROUGH of a crushing diagonal downward slash: an extremely deep lunge toward screen-right, his torso bent forward almost level with the ground over the front knee, the sword driven down so its tip touches the ground ahead of his front foot, the rear leg stretched long behind, fierce shouting face, cape billowing forward over his shoulders",
    ('2', 'f2-skill', 's5'): "rising out of the lunge into a controlled low guard, the sword held low beside his hip, calm and focused (not smiling), ready to hop back",
    ('3', 'f3-skill', 's0'): "holding the longsword upright with BOTH hands in front of his chest, the hilt at chest height, the blade standing straight up slightly beside his face so both eyes stay visible and open, looking up at the tip, feet planted",
    ('3', 'f3-skill', 's1'): "the same upright longsword with both hands, the tip at exactly the same place as when held at the chest, shoulders settled and braced, the hilt raised to chin height, eyes open, solemn determined face",
    ('3', 'f3-skill', 's2'): "drawing the longsword with both hands up and behind his rear shoulder, the blade pointing back over his shoulder, hips turned away from the enemy, knees bent, loading a big swing",
    ('3', 'f3-skill', 's3'): "taking a long forward step toward screen-right with the longsword still loaded high behind his shoulder in both hands, body compact and low, the blade clear of his head",
    ('3', 'f3-skill', 's4'): "the great downward crescent cut finished: a low forward stance toward screen-right, front knee deeply bent, both hands on the hilt, the longsword swept down and forward with its tip just above the ground ahead",
    ('3', 'f3-skill', 's5'): "recovered into a firm low guard, the longsword held in both hands low beside his forward leg with the tip off the ground, standing steady, focused",
    # departures: one running stride (the clip makes the cycle)
    ('1', 'f1-run', 'R'): "running fast toward screen-right in a long clear stride, body leaning forward, front foot about to land and rear leg extended behind, the free left arm swinging forward; the wooden sword is held LOW beside his right hip, its blade trailing backward and downward behind him, never raised; scarf streaming back",
    ('2', 'f2-run', 'R'): "running fast toward screen-right in a long clear stride, body leaning forward, front foot about to land and rear leg extended behind, the free left arm swinging forward; the steel sword is held LOW beside his right hip, its blade trailing backward and downward behind him, never raised; scarf and cape streaming back",
    ('3', 'f3-run', 'R'): "running fast toward screen-right in a long clear stride, body leaning forward, front foot about to land and rear leg extended behind, the free left arm swinging forward; the longsword is held LOW beside his right hip, its blade trailing backward and downward behind him with the tip above the ground, never raised; cape streaming back",
}


def prompt(form, pose):
    return (f"Image 1 is the exact character: {WHO[form]}. Keep his identity, face, costume, colours, proportions, line style and the exact sword design from Image 1, "
            "at the same size and camera distance as Image 1, three-quarter view facing screen-right like Image 1. Do NOT mirror him: the sword stays in the same hand as in Image 1 "
            "(both hands on the hilt only where the pose says so), and the sword is always ONE whole rigid blade.\n\n"
            f"Draw ONE single full-body sprite of him {pose}. A clear, readable, powerful silhouette for a small phone screen; the body commits to the action (feet, hips and shoulders), not only the arm. Eyes open.\n\n"
            "Background: 100% solid flat magenta #FF00FF, no gradient, no floor, no shadow. Centered, the whole character and the whole sword fully inside the image with a wide magenta margin on all four sides. "
            "Clean anime game sprite, crisp lines, same rendering as Image 1. No motion blur, slash trail, glow, wind, sparks, particles, speed lines, text or labels.")


def draw(item):
    (form, cid, name), pose = item
    keys = CLIPS / cid / 'keys'; keys.mkdir(parents=True, exist_ok=True)
    p = keys / f'{name}-prompt.txt'; p.write_text(prompt(form, pose), encoding='utf-8')
    rest = ROOT / ('assets/heroes/forms/novice/form-%s/rig/combat/rest.png' % form)
    env = {**os.environ, 'IMAGEGEN_BACKEND': 'codex'}
    r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(keys / f'{name}-raw.png'), '--ref', str(rest),
                        '--model', 'gpt-6.1-sol', '--effort', 'low'], env=env, capture_output=True, text=True)
    return f'{cid}/{name}', r.returncode, (r.stdout + r.stderr)[-300:].replace('\n', ' ') if r.returncode else ''


if __name__ == '__main__':
    want = set(sys.argv[1:])
    items = [kv for kv in KEYS.items() if not want or f'{kv[0][1]}/{kv[0][2]}' in want]
    with ThreadPoolExecutor(3) as ex:
        for res in ex.map(draw, items):
            print(*res, flush=True)
