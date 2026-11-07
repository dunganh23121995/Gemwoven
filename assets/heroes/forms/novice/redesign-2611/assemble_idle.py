# Usage: assemble_idle.py <form>
# The 8-frame resting loop comes as two 2x2 redraws (frames 1-4, 5-8): each half is aligned like align_sheet.py on the
# old half's first frame, then the two are stacked into the old 2x4 sheet's size.
import subprocess, sys
from PIL import Image
f = sys.argv[1]; old = Image.open(f'old/f{f}-idle.webp').convert('RGBA'); half = old.height // 2
out = Image.new('RGBA', old.size, (0, 0, 0, 0))
for h in (1, 2):
    old.crop((0, (h - 1) * half, old.width, h * half)).save(f'sheets/f{f}-idle-{h}-oldhalf.png')
    subprocess.run([sys.executable, 'align_sheet.py', f'sheets/f{f}-idle-{h}-oldhalf.png', '2', '2', f'sheets/f{f}-idle-{h}-raw.png', f'sheets/f{f}-idle-{h}.webp'], check=True)
    out.alpha_composite(Image.open(f'sheets/f{f}-idle-{h}.webp').convert('RGBA'), (0, (h - 1) * half))
dest = '../../../novice/idle.webp' if f == '1' else f'../form-{f}/idle.webp'
out.save(dest, lossless=True, method=6); print('->', dest)
