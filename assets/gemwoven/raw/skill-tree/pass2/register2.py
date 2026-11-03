"""Register the pass-2 Kỹ Năng pieces in assets/gemwoven/painted-backgrounds.json (path given, default the repo file)."""
import json, sys
from PIL import Image
ROOT = 'D:/Project/Gemwoven/'
NAMES = ['bough2', 'socket', 'select-ring', 'gate-plate2', 'tray-wide', 'next-card2']
p = sys.argv[1] if len(sys.argv) > 1 else ROOT + 'assets/gemwoven/painted-backgrounds.json'
m = json.load(open(p, encoding='utf-8'))
for name in NAMES:
    w, h = Image.open(ROOT + f'assets/gemwoven/skill-tree/{name}.webp').size
    m['skilltree-' + name] = {'file': f'assets/gemwoven/skill-tree/{name}.webp', 'width': w, 'height': h, 'textless': True,
                              'source': 'assets/gemwoven/raw/skill-tree/pass2/',
                              'purpose': 'Kỹ Năng pass 2 pieces drawn by Codex from the approved mockup (skill-tree.js).'}
json.dump(m, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('registered', len(NAMES))
