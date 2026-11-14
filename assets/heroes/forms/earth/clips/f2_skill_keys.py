"""Nori form 2 ultimate keys (owner 13/11, second redesign: "dùng búa ném lên trời rơi xuống hóa to vào địch rồi gọi búa
về"): the hammer raised in his right hand alone, the shield arm low (SKY, owner 14/11), hurled straight up (THROW, empty-handed), the empty hand commanding it down
onto the foe (CALL) and catching it overhead (CATCH; he reaches for it in the THROW pose, Codex 13/11); the shield strapped to the left forearm. Codex (Sol low) from the resting frame -> clips/f2-skill/keys/<name>-raw.png.
python f2_skill_keys.py [name ...]"""
import os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
KEYS = Path(__file__).resolve().parent / 'f2-skill' / 'keys'
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
WHO = ("a chibi young knight with messy brown hair, small golden antlers with green leaves and green eyes, in silver plate armour with gold trim, "
       "a green scarf, a green leaf-pattern tabard and cape, a grey stone-and-gold war hammer in his right hand and a green kite shield with a golden tree emblem strapped to his left forearm")
POSES = {
    # the wind-up: the hammer raised high in his RIGHT hand alone (owner 14/11: "2 tay không tay nào cầm khiên mà khiên vẫn ở
    # không trung": the first SKY held it in both hands, so the shield arm went up while the shield stayed at his side)
    'SKY': "winding up to hurl his war hammer into the sky: the stone war hammer raised high in his RIGHT hand ALONE, his right arm cocked up and back above his head gripping the end of the long handle, the hammer head up above and behind his head; his LEFT arm stays LOW and bent in front of his body, holding the kite shield strapped to his left forearm close in front of his chest and belly on the screen-right side exactly as in Image 1 (the left hand never touches the hammer, the shield stays on that forearm); knees bent, leaning back to throw, a fierce determined face with the mouth closed (not smiling)",
    # hammer-throw ultimate (owner 13/11 "dùng búa ném lên trời rơi xuống hóa to vào địch rồi gọi búa về")
    'THROW': "has just hurled his war hammer straight up into the sky: his right arm flung straight up above his head with the hand open and EMPTY, fingers spread, body stretched upward on his toes, chin up looking at the sky, the kite shield still strapped to his left forearm held out to the side; the hammer is NOT in the picture at all (it has flown away above)",
    # His right arm is the far one (screen-left), the shield arm the near one (screen-right): the right hand works ABOVE his
    # head, over the shield's rim, so the shield never changes arm (the first CALL/RECV/CATCH swapped it, 13/11).
    'CALL': "commanding the sky with his EMPTY right hand: his right arm raised high above his head and pointing up and forward toward the upper right, the index finger pointing, the arm passing ABOVE the top rim of the shield; the kite shield stays strapped to his LEFT forearm on the screen-right side in front of his body exactly as in Image 1; feet planted wide and firm, looking up toward the upper right, shouting a command, mouth open; NO hammer anywhere in the picture",
    'CATCH': "has just caught his war hammer above his head: his right hand raised high above his head gripping the long handle, the hammer held upright above and slightly behind his head with its stone-and-gold head at the top, knees bent absorbing the weight; the kite shield stays strapped to his LEFT forearm on the screen-right side in front of his body exactly as in Image 1; a confident grin",
}


def prompt(pose):
    return (f"Image 1 is the exact character: {WHO}. Keep his identity, face, costume, colours, proportions, line style and the exact hammer and shield designs from Image 1, "
            "at the same size and camera distance as Image 1, three-quarter view facing screen-right like Image 1. Do NOT mirror him: the hammer and the shield stay on the same arms as in Image 1, the hammer always ONE whole rigid weapon.\n\n"
            f"Draw ONE single full-body sprite of him {pose}. A clear, readable, powerful silhouette for a small phone screen; the whole body commits to the motion. Eyes open.\n\n"
            "Background: 100% solid flat magenta #FF00FF, no gradient, no floor, no shadow. Centered, the whole character, hammer and shield fully inside the image with a wide magenta margin on all four sides. "
            "Clean anime game sprite, crisp lines, same rendering as Image 1. No motion blur, impact flash, dust, cracks, glow, particles, speed lines, text or labels.")


if __name__ == '__main__':
    for name in sys.argv[1:] or list(POSES):
        p = KEYS / f'{name}-prompt.txt'; p.write_text(prompt(POSES[name]), encoding='utf-8')
        r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(KEYS / f'{name}-raw.png'),
                            '--ref', str(ROOT / 'assets/heroes/forms/earth/form-2/rig/combat/rest.png'), '--model', 'gpt-6.1-sol', '--effort', 'low'],
                           env={**os.environ, 'IMAGEGEN_BACKEND': 'codex'}, capture_output=True, text=True)
        print(name, r.returncode, flush=True)
