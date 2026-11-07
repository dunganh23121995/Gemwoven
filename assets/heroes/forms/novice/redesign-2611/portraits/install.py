# Keys the redrawn pictures (portraits/jobs.py) and installs them at the old pictures' sizes and framing; the raw
# sheets the old ones were cut from (atlas/ui raw-avatars.png, summon fragment-puzzle raw-sheet.png) get the new cell
# too, so their export scripts reproduce them.
import json, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, 'D:/Project/Gemwoven/assets/fx/heroes/fire'); from export_fx import key_out
G = Path('D:/Project/Gemwoven/assets/gemwoven'); F = Path('..')


def keyed(name):
    im = key_out(Image.open(f'portraits/{name}-raw.png')); return im.crop(im.getchannel('A').point(lambda a: 255 if a > 60 else 0).getbbox())


def bust(name, size, out):
    # like the old busts: the drawing fills the height (a 10px margin on top), sits on the bottom edge, centred
    im = keyed(name); w, h = size; k = min((h - 10) / im.height, w / im.width)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', size, (0, 0, 0, 0)); canvas.alpha_composite(im, ((w - im.width) // 2, h - im.height)); canvas.save(out, optimize=True)


def patch(raw, index, piece, cols=3, cell=512):
    sheet = Image.open(raw).convert('RGB'); x, y = index % cols * cell, index // cols * cell
    bg = Image.new('RGBA', (cell, cell), (255, 0, 255, 255)); p = piece.copy(); p.thumbnail((int(cell * .9), int(cell * .9)), Image.LANCZOS)
    bg.alpha_composite(p, ((cell - p.width) // 2, (cell - p.height) // 2)); sheet.paste(bg.convert('RGB'), (x, y)); sheet.save(raw)


bust('bust-2', (256, 256), F / 'form-2/portrait.png')
bust('bust-3', (256, 256), F / 'form-3/portrait.png')
bust('bust-1', (210, 256), G / 'items/portrait-novice.png')
face = keyed('face'); patch(G / 'atlas/ui/raw-avatars.png', 0, face)
f = face.copy(); f.thumbnail((256, 256), Image.LANCZOS); f.save(G / 'atlas/ui/face-novice.webp', 'WEBP', quality=92, method=6)
if Path('portraits/fragment-raw.png').exists():
    piece = keyed('fragment'); patch(G / 'summon/fragment-puzzle/raw-sheet.png', 5, piece)
    p = piece.copy(); p.thumbnail((256, 256), Image.LANCZOS); p.save(G / 'summon/runtime/fragment-novice.webp', 'WEBP', quality=90, method=6)
# the full-body picture: form 1 cut from the approved lineup at its own resolution, 6px margin like the old one
line = key_out(Image.open('lineup.png')); w = line.width / 3; cell = line.crop((0, 0, round(w), line.height))
box = cell.getchannel('A').point(lambda a: 255 if a > 60 else 0).getbbox(); hero = cell.crop((box[0] - 6, box[1] - 6, box[2] + 6, box[3] + 6))
hero.save(G / 'items/hero-novice.png', optimize=True)
items = json.loads((G / 'novice-items.json').read_text(encoding='utf-8'))
for name in ('hero-novice', 'portrait-novice'):
    im = Image.open(G / 'items' / f'{name}.png'); items[name].update(width=im.width, height=im.height, source='heroes/forms/novice/redesign-2611')
(G / 'novice-items.json').write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print('ok', hero.size)
