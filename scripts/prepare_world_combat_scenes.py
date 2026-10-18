"""Deterministic battle crops from the authored chapter maps; no synthetic art."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
output=root/'assets/gemwoven/backgrounds/battles'
output.mkdir(parents=True,exist_ok=True)
for p in (root/'assets/gemwoven/backgrounds/chapters').glob('*.webp'):
    with Image.open(p) as im:
        im.crop((0,500,941,1140)).resize((960,640),Image.Resampling.LANCZOS).save(output/p.name,'WEBP',quality=86)
print('Battle scenes:',len(list(output.glob('*.webp'))))
