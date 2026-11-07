# Usage: redraw_show.py draw <form> <sheet> [<sheet>...]  |  redraw_show.py fit <form> <sheet>
# Hiro's plain redesign of the showcase sheets (assets/heroes/forms/novice/form-N/showcase, 2 columns x 4 rows):
# each 2x2 half of the old sheet (kept in show/fN/) is redrawn with the new master as identity, same poses and
# placing, then aligned on the old half's fullest frame (align_sheet.py) and stacked at the old sheet's size.
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
EXTRA = {'entrance': {1: 'Keep the few drifting green leaves of Image 2 as plain painted leaves, nothing glowing.',
                      2: 'Keep the swirling green leaves of Image 2 as plain painted leaves, nothing glowing.'},
         'swing': {}, 'scratch': {}, 'map': {}, 'twirl': {}, 'salute': {}, 'idle': {}}
PROMPT = """Clean HD painterly chibi 2D RPG animation sheet, NOT pixel art.
Image 1 is HIRO's approved new look for this form: copy his face, messy brown hair, brown eyes, green scarf, outfit, boots and sword EXACTLY from Image 1 (plain, humble, muted earthy colours, no gold trim, no gems, no glow).
Image 2 is four frames of one of his animations: copy EXACTLY its layout (2 columns x 2 rows of equal square cells, square 1024x1024, read left to right then the next row), EVERY pose, the position of every limb, the sword, the scarf and cloth, the body size and position inside every cell and the foot line. Redraw each frame of Image 2 with the look of Image 1; change nothing about the motion. His face stays the same in every frame unless Image 2 shows another expression.
{extra}Nothing crosses a cell edge. Uniform pure flat #FF00FF magenta background, no text, no labels, no borders, no grid lines, no floor, no shadows."""


def halves(form, name):
    old = Image.open(f'show/f{form}/{name}.webp').convert('RGBA'); h = old.height // 2
    return old, [old.crop((0, k * h, old.width, (k + 1) * h)) for k in (0, 1)]


def draw_one(form, name, k, half):
    n = f'show/f{form}/{name}-{k + 1}'
    bg = Image.new('RGBA', half.size, (255, 0, 255, 255)); bg.alpha_composite(half); bg.convert('RGB').resize((1024, 1024), Image.LANCZOS).save(n + '-old.png')
    extra = EXTRA.get(name, {}).get(form, 'No effects, no glow, no particles.')
    open(n + '-prompt.txt', 'w', encoding='utf-8').write(PROMPT.format(extra=extra + '\n') + '\n')
    r = subprocess.run([sys.executable, GEN, '--prompt-file', n + '-prompt.txt', '--out', n + '-raw.png', '--ref', f'form-{form}-master-magenta.png',
                        '--ref', n + '-old.png', '--model', 'gpt-6.1-sol', '--effort', 'low', '--codex-only'], capture_output=True, text=True)
    print(n, 'exit', r.returncode, r.stdout[-200:].replace('\n', ' ') if r.returncode else '', flush=True)


def fit(form, name):
    old, hs = halves(form, name); out = Image.new('RGBA', old.size, (0, 0, 0, 0))
    for k, half in enumerate(hs):
        n = f'show/f{form}/{name}-{k + 1}'; half.save(n + '-oldhalf.png')
        c = half.width // 2
        areas = [(np.asarray(half.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)).getchannel('A')) > 60).sum() for i in range(4)]
        ref = int(np.argmax(areas)) if name == 'entrance' else 0
        subprocess.run([sys.executable, 'align_sheet.py', n + '-oldhalf.png', '2', '2', n + '-raw.png', n + '.webp', str(ref)], check=True)
        out.alpha_composite(Image.open(n + '.webp').convert('RGBA'), (0, k * old.height // 2))
    dest = f'../form-{form}/showcase/{name}.webp'; out.save(dest, lossless=True, method=6); print('->', dest)


if __name__ == '__main__':
    if sys.argv[1] == 'draw':
        form = int(sys.argv[2]); jobs = [(name, k, h) for name in sys.argv[3:] for k, h in enumerate(halves(form, name)[1])]
        with ThreadPoolExecutor(2) as pool: list(pool.map(lambda j: draw_one(form, *j), jobs))
    else:
        fit(int(sys.argv[2]), sys.argv[3])
