"""The "Tất cả" roster button icon (owner 08/11: the 3x3 grid repeated the menu's "Thêm"; Codex hero-roster round): three of the
heroes' own round avatars in a small fan, Mika and Yuki behind, Hiro in front, each with a soft shadow so they separate.
Output: assets/gemwoven/hero-roster/icon-all.webp (sits in the kit-round brass ring)."""
from pathlib import Path

from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parents[4]
UI = REPO / 'assets/gemwoven/atlas/ui'
OUT = REPO / 'assets/gemwoven/hero-roster'
OUT.mkdir(exist_ok=True)
S = 256
icon = Image.new('RGBA', (S, S))
for name, size, (x, y) in [('face-fire', 128, (14, 34)), ('face-ice', 128, (114, 34)), ('face-novice', 150, (53, 92))]:
    face = Image.open(UI / f'{name}.webp').convert('RGBA').resize((size, size), Image.LANCZOS)
    shadow = Image.new('RGBA', (size + 16, size + 16))
    shadow.paste((26, 12, 4, 200), (8, 12), face.getchannel('A'))
    icon.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)), (x - 8, y - 8))
    icon.alpha_composite(face, (x, y))
icon.save(OUT / 'icon-all.webp', 'WEBP', quality=90, alpha_quality=90, method=6)
print('ok')
