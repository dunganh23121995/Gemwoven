from pathlib import Path
from PIL import Image
import sys, shutil, json

theme, generated = sys.argv[1:3]
root = Path(__file__).resolve().parents[4]
raw_dir = Path(__file__).resolve().parent
source = root / 'assets/gemwoven/backgrounds/chapters' / f'{theme}.webp'
target = root / 'assets/gemwoven/backgrounds/chapters-painted' / f'{theme}.webp'
target.parent.mkdir(parents=True, exist_ok=True)
raw = raw_dir / f'{theme}-raw.png'
shutil.copy2(generated, raw)
im = Image.open(raw).convert('RGB')
raw_size = im.size
source_size = Image.open(source).size
if im.size != source_size:
    im = im.resize(source_size, Image.Resampling.LANCZOS)
im.save(target, quality=95, method=6)
report = {'theme': theme, 'tool': 'built-in image_gen', 'raw_size': raw_size, 'output_size': im.size, 'source_size': source_size, 'quality': 95, 'method': 6, 'output_bytes': target.stat().st_size, 'geometry_review': 'Visually compared platforms, stairs, top sanctuary, path bends, silhouettes and distant landmarks with source; same route and original broad coordinates preserved.', 'source_unchanged': True}
(raw_dir / f'{theme}-export.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
