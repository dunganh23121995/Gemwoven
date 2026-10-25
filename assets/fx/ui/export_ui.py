"""Export the processed combat UI art (key/single-1.png) to trimmed runtime WebPs.

crit-burst.webp  - starburst + slash behind a critical damage number
crit-ribbon.webp - empty red/gold ribbon that carries the 'CHÍ MẠNG' label (text is HTML)
"""
from pathlib import Path
from PIL import Image

here = Path(__file__).resolve().parent
for name, width in [('crit-burst', 320), ('crit-ribbon', 360)]:
    im = Image.open(here / name / 'key' / 'single-1.png').convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(here / f'{name}.webp', 'WEBP', quality=90, method=6)
    print(name, im.size, (here / f'{name}.webp').stat().st_size)
