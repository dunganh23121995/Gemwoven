"""Nori form 1 ultimate key (owner 14/11: "Nori1. Khi tung tuyệt kỹ có thu người lại trông không được đẹp"): the gathering
beat before the shield rush no longer sinks into a low crouch hidden behind the shield (CROUCH): a first try stood him tall with
the hammer raised over his shoulder (BRACE, dropped). Codex (Sol low) from the resting
frame -> clips/f1-cast/keys/<name>-raw.png. Owner 14/11 after BRACE: "Tôi vẫn muốn là dùng khiên để huých vào địch ... Tôi muốn tư thế lấy
đà để cầm khiên lao vào địch": the hammer-over-the-shoulder brace read as a hammer blow; WINDUP is the run-up to the shield
charge itself (the rush key and the bash after it are kept).
python f1_cast_keys.py [name ...]"""
import os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
KEYS = Path(__file__).resolve().parent / 'f1-cast' / 'keys'
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
WHO = ("a chibi young knight with messy brown hair, small golden antlers with green leaves and green eyes, in bronze and gold armour with a "
       "white fur collar, a green leaf-pattern tabard and cape, a stone-and-gold war hammer in his right hand and a tall rectangular green "
       "tower shield with a golden tree emblem in his left hand")
POSES = {
    'WINDUP': "gathering momentum to charge his shield into the foe, at his normal standing height (not crouching, not ducking, "
              "not hiding): his weight rocked back onto his bent back leg (screen-left), his front leg stepped forward toward screen-right "
              "with the knee bent, torso leaning slightly forward, his LEFT shoulder pressed against the inside of the tall tower shield "
              "which he holds firmly in front of his chest, angled toward the foe at screen-right, its golden tree emblem facing the viewer; "
              "his head and face clearly visible above and behind the shield's top rim, eyes fixed on the foe, a fierce determined face, "
              "mouth closed; his RIGHT hand holds the war hammer low and back behind his hip, gripped at the end of the handle, the hammer "
              "head trailing behind him near the ground; cape swinging back. Coiled like a sprinter about to burst forward",
}


def prompt(pose):
    return (f"Image 1 is the exact character: {WHO}. Keep his identity, face, costume, colours, proportions, line style and the exact hammer "
            "and shield designs from Image 1, at the same size and camera distance as Image 1, three-quarter view facing screen-right like "
            "Image 1. Do NOT mirror him: the hammer and the shield stay on the same arms as in Image 1, the hammer always ONE whole rigid weapon.\n\n"
            f"Draw ONE single full-body sprite of him {pose}. A clear, readable, powerful silhouette for a small phone screen; the whole "
            "body commits to the pose. Eyes open.\n\n"
            "Background: 100% solid flat magenta #FF00FF, no gradient, no floor, no shadow. Centered, the whole character, hammer and "
            "shield fully inside the image with a wide magenta margin on all four sides. Clean anime game sprite, crisp lines, same "
            "rendering as Image 1. No motion blur, impact flash, dust, cracks, glow, particles, speed lines, text or labels.")


if __name__ == '__main__':
    for name in sys.argv[1:] or list(POSES):
        p = KEYS / f'{name}-prompt.txt'; p.write_text(prompt(POSES[name]), encoding='utf-8')
        r = subprocess.run([sys.executable, GEN, '--prompt-file', str(p), '--out', str(KEYS / f'{name}-raw.png'),
                            '--ref', str(ROOT / 'assets/heroes/forms/earth/form-1/rig/combat/rest.png'), '--model', 'gpt-6.1-sol', '--effort', 'low'],
                           env={**os.environ, 'IMAGEGEN_BACKEND': 'codex'}, capture_output=True, text=True)
        print(name, r.returncode, flush=True)
