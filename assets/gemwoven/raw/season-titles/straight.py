"""Season title ribbons drawn straight (owner 10/11: "làm cái background thẳng tuột rồi nhét chữ vào cho dễ; làm để sau này đổi
ngôn ngữ được"): each season's ribbon is redrawn from its first version (assets/gemwoven/season/<k>/title.webp, kept as
<k>/ref.png) as a level banner: the same medallion on the left and the same tail on the right, the cloth between them flat,
straight and plain, so the title's name is ordinary text laid straight on it (any language).

  python straight.py draw <season> [<season> ...]   raw drawings (<k>/raw.png + prompt.txt + raw.png.gen.json)
  python straight.py cut <season> [<season> ...]    keyed and cropped into assets/gemwoven/season/<k>/title.webp

build_gemwoven.py measures where the plain cloth lies (title_cloth) for the text.
"""
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
SEASONS = {
    'mika': ('the golden fox-mask medallion with its red cord and red tassels', 'the curling orange flame', 'crimson red silk with gold trim'),
    'yuki': ('the silver crescent-moon and snowflake medallion with its blue bow and white tassels', 'the snow splash with the ice snowflakes', 'navy blue silk with silver trim'),
    'nori': ('the golden antler medallion with the emerald gem, the acorn and oak leaves', 'the golden vine with oak leaves', 'forest green silk with gold trim'),
    'lumi': ('the golden crescent-moon and star medallion with its golden rope and violet crystal drops', 'the golden lightning wisp with three golden stars', 'royal purple silk with gold trim'),
    'noct': ('the dark silver four-point star medallion with the buckled black strap and torn black cloth', 'the cyan soul flame', 'dark violet-black silk with silver trim'),
}
PROMPT = """Reference image 1 is a title ribbon of a fantasy mobile game. Redraw it as a STRAIGHT, LEVEL banner, keeping its identity: {medal} on the left, the same design and size; {tail} at the right end, the same style; the cloth {cloth}.
The cloth band between the medallion and the tail is perfectly straight and horizontal: no wave, no twist, no bend, the same height all along, its top and bottom trims two straight parallel horizontal lines. The cloth is plain, with only a faint soft sheen of the same colour: no stars, snowflakes, vines, flames, runes or any other painting on it, so a name can be written on it later.
Layout: the whole banner about 4 times as wide as tall; the medallion takes about the left fifth, the plain straight cloth runs from about 23 percent to about 85 percent of the width, the tail ornament in the last 15 percent; the tail may rise a little above the band, the medallion's tassels may hang below it.
Hand-painted fantasy game UI, the same finish, palette and quality as reference image 1, crisp clean edges, soft shading, no pixel art, no text, no letters, no numbers.
Solid flat pure magenta #FF00FF background around the banner, generous margin, nothing touching the image edges. No magenta or pink inside the artwork.
"""


def draw(seasons):
    jobs = []
    for k in seasons:
        d = HERE / k
        d.mkdir(exist_ok=True)
        ref = d / 'ref.png'
        if not ref.exists():
            im = Image.open(ROOT / f'assets/gemwoven/season/{k}/title.webp').convert('RGBA')
            bg = Image.new('RGBA', (im.width + 80, im.height + 80), (255, 0, 255, 255))
            bg.alpha_composite(im, (40, 40))
            bg.convert('RGB').save(ref)
        (d / 'prompt.txt').write_text(PROMPT.format(medal=SEASONS[k][0], tail=SEASONS[k][1], cloth=SEASONS[k][2]), encoding='utf-8')
        jobs.append(subprocess.Popen([sys.executable, GEN, '--prompt-file', str(d / 'prompt.txt'), '--out', str(d / 'raw.png'),
                                      '--ref', str(ref), '--model', 'gpt-6.1-sol', '--effort', 'low'], env=dict(os.environ)))
    for j in jobs:
        j.wait()


def cut(seasons):
    for k in seasons:
        im = Image.open(HERE / k / 'raw.png')
        if im.mode == 'RGBA' and np.asarray(im)[..., 3].min() < 10:
            a = np.asarray(im).astype(np.float32)
        else:
            rgb = np.asarray(im.convert('RGB')).astype(np.float32)
            dist = np.sqrt((rgb[..., 0] - 255) ** 2 + rgb[..., 1] ** 2 + (rgb[..., 2] - 255) ** 2)
            al = np.clip((dist - 50) / 90, 0, 1)
            kk = np.maximum(al, 1e-3)[..., None]
            rgb = np.clip((rgb - (1 - kk) * np.array([255, 0, 255], np.float32)) / kk, 0, 255)
            a = np.dstack([rgb, al * 255])
        a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
        lab, n = ndimage.label(a[..., 3] > 0)
        if n:
            sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
            a[..., 3][np.isin(lab, np.nonzero(sizes < 60)[0] + 1)] = 0
        out = Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')
        out = out.crop(out.getbbox())
        out.thumbnail((560, 300), Image.LANCZOS)
        out.save(ROOT / f'assets/gemwoven/season/{k}/title.webp', quality=92, method=6)
        print(k, out.size)


if __name__ == '__main__':
    {'draw': draw, 'cut': cut}[sys.argv[1]](sys.argv[2:])
