"""Key poses for Noct form 2's new basic attack (owner 14/11 "Noct 2 đánh thường làm lại được không?"): the old sheet showed
him from behind while every other sheet shows his front. One battōjutsu draw-cut facing screen-right, three-quarter front like
the resting frame: R ready crouch (the sword turned along his left hip), D the draw (hilt leading), W the blade out sweeping low,
U the rising cut ended high; the noto is the draw played backward (clip U -> D, then D, B, R; owner 14/11: the sword goes home
where it came out). C (an earlier straight cut) stays as a reference. Drawn by Codex (Sol low) from the resting frame, one per file:
clips/f2-attack/keys/<name>-raw.png + <name>-prompt.txt; then clip_pipeline.py placekey shadow/f2-attack --only <name>
--images keys/<name>-raw.png --sheets <mult> (Noct shows no face, so the face match misses: the multiplier brings each key to
the resting hood's size, R .8875 D .949 C .908 F .993 S 1.058).

python assets/heroes/forms/shadow/clips/f2_attack_keys.py [name ...]
"""
import os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
KEYS_DIR = Path(__file__).resolve().parent / 'f2-attack' / 'keys'
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
REST = ROOT / 'assets/heroes/forms/shadow/form-2/rig/combat/rest.png'
WHO = ("a chibi hooded moon ronin swordsman: a black hooded cloak with silver trim and a big silver crescent moon on its long tail, "
       "his face hidden in shadow under the hood with two glowing pale icy-aqua eyes, black samurai armour, wide black hakama trousers, "
       "pale aqua cord tassels at the waist, black armoured boots, a katana with a pale-aqua wrapped hilt and a round guard in a black lacquered scabbard")
KEYS = {
    # (owner 14/11: "Sao không cho đánh thường thì xoay sang phía bên trái để kiếm dọc theo người ... rồi mới dùng tay phải rút kiếm")
    # at rest the sword lies across the front of his waist; before the draw he turns it to his left side, along the body,
    # partly hidden behind it, and only then the right hand draws
    'R': "crouched low, ready for a lightning quick-draw: he has turned the sword to his LEFT side, the black scabbard now lies ALONG his left hip "
         "on the FAR side of his body, slanting backward and down behind him, PARTLY HIDDEN behind his body and cloak; only the pale-aqua hilt shows, "
         "poking forward in front of his belly toward screen-right; his LEFT hand holds the scabbard's mouth at the hip, his RIGHT hand closed on the "
         "hilt; knees deeply bent, body leaning toward screen-right, glowing eyes fixed ahead, the cloak flaring back",
    # (owner 14/11 on the second try: "Tay phải rút. Tay trái vẫn cầm bao bên hông trái. Lưỡi kiếm sẽ chỉ thấy phần người không che
    # thôi": both hands were on the hilt and the whole blade showed across his belly) R is sent as Image 2
    'D': "in the middle of a lightning quick-draw, one instant after Image 2. ONLY his RIGHT hand is on the hilt. His LEFT hand stays down at his "
         "LEFT hip on the FAR side of his body, gripping the mouth of the black scabbard there, the scabbard still pointing backward and down "
         "behind him exactly as in Image 2; the left hand is NOT on the hilt and NOT in front of his belly. His RIGHT arm has pulled the hilt "
         "forward and out toward screen-right, so the blade comes out of the scabbard's mouth at his far left hip and runs BEHIND his body and "
         "forearm: most of the drawn blade is HIDDEN by his body, only the short section of bright steel between the front edge of his body and "
         "his right hand is visible. Stepping forward toward screen-right, shoulders turning into the draw, the cloak swinging back",
    'C': "the quick-draw cut released: a long lunge toward screen-right with the front knee bent and the rear leg stretched behind, his RIGHT arm fully "
         "extended forward, the katana in his right hand ALONE pointing forward and slightly upward (about 25 degrees above level), the whole long blade "
         "clearly visible in front of him, his LEFT hand still holding the EMPTY black scabbard back at his left hip, the cloak and its crescent tail "
         "whipping back behind him",
    # (Codex 14/11 samurai pass, 6.5/10: a straight arm with the blade pointing at the foe read as a THRUST) the cut is an arc from the hip:
    # W the blade just out sweeping low, then up through the foe to U, the blade high (the owner's own "kiếm dài chúc lên cao")
    'W': "the instant the blade clears the scabbard: his right shoulder driving forward, his RIGHT arm swinging the katana forward and DOWN in a "
         "low arc at hip height, the whole blade out and visible, pointing down and forward toward the ground in front of his front foot at about "
         "45 degrees, the short hilt in his right fist; the black scabbard still along his left hip behind him, his left hand hidden behind his "
         "body; the front knee bent in the lunge, the cloak and tassels trailing behind",
    'U': "the end of a rising diagonal cut (kiriage): still in the deep lunge toward screen-right, his body twisted into the cut, his RIGHT arm "
         "swung up and extended forward and UP above his head height, the long katana in his right hand pointing HIGH up toward the upper right "
         "at about 60 degrees above level, the whole long blade clearly visible; the black scabbard along his left hip behind him, his left hand "
         "hidden behind his body; the cloak and tassels whipping up after the cut",
}

# keys drawn as the next instant of an earlier key get it as Image 2 (and Image 3)
EXTRA = {'D': ('R-raw.png',), 'W': ('D-raw.png', 'C-raw.png'), 'U': ('C-raw.png',)}

def prompt(pose):
    return (f"Image 1 is the exact character: {WHO}. Keep his identity, hood, glowing eyes, costume, colours, proportions, line style and the exact "
            "katana and scabbard design from Image 1, at the same size and camera distance as Image 1, three-quarter FRONT view facing screen-right "
            "like Image 1 (we see his front and his glowing eyes, never his back). Do NOT mirror him. The katana is always ONE whole rigid blade.\n\n"
            f"Draw ONE single full-body sprite of him {pose}. A clear, readable, powerful silhouette for a small phone screen; the body commits to the "
            "action (feet, hips and shoulders), not only the arm.\n\n"
            "Background: 100% solid flat magenta #FF00FF, no gradient, no floor, no shadow. Centered, the whole character, the whole katana and the "
            "whole scabbard fully inside the image with a wide magenta margin on all four sides. Clean anime game sprite, crisp lines, same rendering as "
            "Image 1. No motion blur, slash trail, glow effects, wind, sparks, particles, speed lines, text or labels.")


def draw(item):
    name, pose = item
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    p = KEYS_DIR / f'{name}-prompt.txt'; p.write_text(prompt(pose), encoding='utf-8')
    env = {**os.environ, 'IMAGEGEN_BACKEND': 'codex'}
    extra = [x for k in EXTRA.get(name, ()) for x in ('--ref', str(KEYS_DIR / k))]
    r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(KEYS_DIR / f'{name}-raw.png'), '--ref', str(REST), *extra,
                        '--model', 'gpt-6.1-sol', '--effort', 'low'], env=env, capture_output=True, text=True)
    return name, r.returncode, (r.stdout + r.stderr)[-300:].replace('\n', ' ')



# (owner 14/11: "Tay trái bên kia thì làm sao mà thấy được? Cố vẽ tay chỗ này làm gì?") D and C drew a gloved left hand holding the
# scabbard behind his back hip, on the near side of the picture; the left hand is on the FAR side and hidden by his body. Edited
# from the drawn key itself (Image 2): python f2_attack_keys.py --fix D C
FIX = ("Image 2 is the drawing to keep: change NOTHING in it except one thing. Remove the gloved LEFT hand that holds the black scabbard behind "
       "his back hip (on the left side of the picture): his left hand is on the FAR side of his body and must be completely hidden behind his "
       "body and cloak. Behind him only the black scabbard is seen, coming out from behind his body at the hip and slanting back and down; "
       "redraw that spot as cloak, hakama and scabbard. Keep the pose, the right hand on the hilt, the katana, the size, the position, the "
       "lighting and every other line exactly as in Image 2. Same flat solid magenta #FF00FF background, no text.")


def fix(name):
    old = KEYS_DIR / f'{name}-raw.png'; src = KEYS_DIR / f'{name}-before-fix.png'; old.replace(src)
    p = KEYS_DIR / f'{name}-fix-prompt.txt'; p.write_text(FIX, encoding='utf-8')
    env = {**os.environ, 'IMAGEGEN_BACKEND': 'codex'}
    r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(old), '--ref', str(REST), '--ref', str(src),
                        '--model', 'gpt-6.1-sol', '--effort', 'low'], env=env, capture_output=True, text=True)
    if r.returncode or not old.exists():
        src.replace(old)
    else:
        src.unlink()
    return name, r.returncode, (r.stdout + r.stderr)[-200:].replace(chr(10), ' ')

if __name__ == '__main__':
    if sys.argv[1:2] == ['--fix']:
        with ThreadPoolExecutor(2) as ex:
            for res in ex.map(fix, sys.argv[2:]):
                print(*res, flush=True)
        sys.exit()
    want = set(sys.argv[1:])
    with ThreadPoolExecutor(3) as ex:
        for res in ex.map(draw, [kv for kv in KEYS.items() if not want or kv[0] in want]):
            print(*res, flush=True)
