# Hiro's plain redesign: the pictures outside the sprite sheets. Each is redrawn from the old one (same framing and
# frame style) with the new look (form master as identity). Codex, two at a time.
#   python portraits/jobs.py [name...]
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
LOOK = {1: 'Hiro form 1: a humble boy traveler, messy brown hair, brown eyes, a dull green scarf, a brown cloth vest over a cream shirt',
        2: 'Hiro form 2: a traveling swordsman, messy brown hair, brown eyes, a dull green scarf and cloak, brown leather jerkin, one plain iron pauldron',
        3: 'Hiro form 3: a plain young knight, messy brown hair, brown eyes, a worn green cloak, plain grey steel breastplate and pauldrons over leather, no gems'}
COMMON = ('Copy his face, hair, colours and outfit EXACTLY from Image 1 (plain, humble, muted earthy colours: no gold trim, no gems, '
          'no glow). Clean HD painterly anime game art, NOT pixel art.')
JOBS = {
    'bust-1': (1, 'old/hub/portrait-novice.png', 'Draw a head-and-shoulders portrait of him like Image 2: same framing, angle (3/4 facing right) and size of the head in the frame, calm friendly smile. ' + COMMON + ' Uniform pure flat #FF00FF magenta background, nothing else.'),
    'bust-2': (2, 'old/hub/f2-portrait.png', 'Draw a head-and-shoulders portrait of him like Image 2: same framing, angle and size of the head in the frame, confident calm look. ' + COMMON + ' Uniform pure flat #FF00FF magenta background, nothing else.'),
    'bust-3': (3, 'old/hub/f3-portrait.png', 'Draw a head-and-shoulders portrait of him like Image 2: same framing, angle and size of the head in the frame, steady determined look; plain steel armour, NO jewel on the chest. ' + COMMON + ' Uniform pure flat #FF00FF magenta background, nothing else.'),
    'face': (1, 'old/hub/face-novice.webp', 'Draw a round avatar exactly like Image 2: the same circle shape, the same soft painted warm sunset sky inside the circle, his head and shoulders framed the same way, but with his new look from Image 1. ' + COMMON + ' Outside the circle: uniform pure flat #FF00FF magenta.'),
    'fragment': (1, 'old/hub/fragment-novice.webp', 'Draw a jigsaw puzzle piece exactly like Image 2: the same piece shape and tabs, the same polished bronze-gold bevelled rim and warm golden painted backdrop, his head and shoulders inside framed the same way, but with his new look from Image 1. ' + COMMON.replace('no gold trim, ', '') + ' Outside the piece: uniform pure flat #FF00FF magenta.'),
}


def one(name):
    form, old, text = JOBS[name]
    im = Image.open(old).convert('RGBA'); s = 1024 / max(im.size)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bg = Image.new('RGBA', (1024, 1024), (255, 0, 255, 255)); bg.alpha_composite(im, ((1024 - im.width) // 2, (1024 - im.height) // 2))
    bg.convert('RGB').save(f'portraits/{name}-old.png')
    prompt = f'Image 1 is the identity: {LOOK[form]}. Image 2 is the old picture to replace.\n{text}\n'
    open(f'portraits/{name}-prompt.txt', 'w', encoding='utf-8').write(prompt)
    r = subprocess.run([sys.executable, GEN, '--prompt-file', f'portraits/{name}-prompt.txt', '--out', f'portraits/{name}-raw.png',
                        '--ref', f'form-{form}-master-magenta.png', '--ref', f'portraits/{name}-old.png', '--model', 'gpt-6.1-sol', '--effort', 'low', '--codex-only'],
                       capture_output=True, text=True)
    print(name, 'exit', r.returncode, r.stdout[-200:].replace('\n', ' ') if r.returncode else '', flush=True)


if __name__ == '__main__':
    with ThreadPoolExecutor(2) as pool: list(pool.map(one, sys.argv[1:] or list(JOBS)))
