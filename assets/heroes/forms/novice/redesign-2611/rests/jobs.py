# Hiro's plain redesign: the crisp resting frames the mesh rigs move (rig_idle.py keeps a rest.png it finds there).
# Each is the first frame of the new loop (combat idle, showcase idle), redrawn alone at full size by Codex with the
# form master as identity, then placed exactly over that frame scaled to the rig's cell (align_sheet.py, 1 x 1).
#   python rests/jobs.py draw [job...]  |  python rests/jobs.py fit [job...]
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
SRC = {'combat': {1: ('../../../novice/idle.webp', 2), 2: ('../form-2/idle.webp', 2), 3: ('../form-3/idle.webp', 2)},
       'show': {f: (f'../form-{f}/showcase/idle.webp', 2) for f in (1, 2, 3)}}
CELL = {'combat': 512, 'show': 640}
JOBS = {f'{ctx}-{f}': (ctx, f) for ctx in ('combat', 'show') for f in (1, 2, 3)}
PROMPT = """Clean HD painterly chibi 2D RPG character art, NOT pixel art.
Image 1 is HIRO's approved look for this form: copy his face, messy brown hair, brown eyes, scarf, outfit, boots and sword EXACTLY from Image 1 (plain, humble, muted earthy colours, no gold, no gems, no glow).
Image 2 is one small, slightly soft frame of him: redraw it SHARP at full resolution with EXACTLY the same pose, the same position of every limb, the sword, the scarf and cloth, the same size and the same place in the square image, the same foot line. Change nothing about the pose; only the drawing becomes crisp and clean.
No effects. Uniform pure flat #FF00FF magenta background, no text, no floor, no shadows."""


def frame(ctx, f):
    path, cols = SRC[ctx][f]; im = Image.open(path).convert('RGBA'); c = im.width // cols
    return im.crop((0, 0, c, c)).resize((CELL[ctx], CELL[ctx]), Image.LANCZOS)


def draw(name):
    ctx, f = JOBS[name]; n = f'rests/{name}'
    fr = frame(ctx, f); fr.save(n + '-frame.png')
    bg = Image.new('RGBA', fr.size, (255, 0, 255, 255)); bg.alpha_composite(fr); bg.convert('RGB').resize((1024, 1024), Image.LANCZOS).save(n + '-old.png')
    open(n + '-prompt.txt', 'w', encoding='utf-8').write(PROMPT + '\n')
    r = subprocess.run([sys.executable, GEN, '--prompt-file', n + '-prompt.txt', '--out', n + '-raw.png', '--ref', f'form-{f}-master-magenta.png', '--ref', n + '-old.png',
                        '--model', 'gpt-6.1-sol', '--effort', 'low', '--codex-only'], capture_output=True, text=True)
    print(name, 'exit', r.returncode, flush=True)


def fit(name):
    n = f'rests/{name}'
    subprocess.run([sys.executable, 'align_sheet.py', n + '-frame.png', '1', '1', n + '-raw.png', n + '.png'], check=True)


if __name__ == '__main__':
    names = sys.argv[2:] or list(JOBS)
    if sys.argv[1] == 'draw':
        with ThreadPoolExecutor(2) as pool: list(pool.map(draw, names))
    else:
        for name in names: fit(name)
