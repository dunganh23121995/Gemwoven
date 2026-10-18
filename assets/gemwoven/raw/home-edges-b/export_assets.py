"""Deterministically fit built-in ImageGen cutouts to original canvas bounds."""
from pathlib import Path
from PIL import Image
import json
import shutil

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
GENERATED = Path('C:/Users/dungca/.codex/generated_images/01a14fb7-4e6b-7a83-8f9b-353cfe965234')
FILES = {
    'shop': 'exec-ca7827e0-0463-4db8-9b40-e5cc3798b403.png',
    'forge': 'exec-3db6ddc8-09b2-4dc9-8d2d-feff9623a53d.png',
    'tavern': 'exec-4042d0fa-266a-4292-84aa-a50ab518dc4a.png',
}

def export():
    report = {}
    for key, generated in FILES.items():
        raw_path = OUT / f'home-{key}-raw.png'
        if not raw_path.exists():
            shutil.copy2(GENERATED / generated, raw_path)
        raw = Image.open(raw_path).convert('RGBA')
        original = Image.open(ROOT / f'assets/gemwoven/items/home-{key}.png').convert('RGBA')
        source_bbox = original.getchannel('A').getbbox()
        # Ignore nearly invisible isolated generation residue for framing.
        # The original generated alpha remains intact within the subject crop.
        raw_bbox = raw.getchannel('A').point(lambda a: 255 if a >= 4 else 0).getbbox()
        left, top, right, bottom = source_bbox
        crop = raw.crop(raw_bbox).resize((right-left, bottom-top), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', original.size)
        canvas.paste(crop, (left, top))
        target = ROOT / f'assets/gemwoven/items/home-{key}-harmonized.png'
        canvas.save(target)
        canvas.save(target.with_suffix('.webp'), lossless=True, exact=True, method=6)
        restored = Image.open(target.with_suffix('.webp')).convert('RGBA')
        assert restored.tobytes() == canvas.tobytes()
        alpha = canvas.getchannel('A')
        assert canvas.size == original.size
        assert alpha.getextrema() == (0,255)
        assert all(alpha.getpixel(pos) == 0 for pos in [(0,0),(canvas.width-1,0),(0,canvas.height-1),(canvas.width-1,canvas.height-1)])
        report[key] = {'canvas': canvas.size, 'original_bbox': source_bbox, 'raw_size': raw.size, 'raw_alpha_bbox': raw_bbox, 'final_alpha_bbox': alpha.getbbox(), 'alpha_extrema': alpha.getextrema(), 'lossless_webp_equal': True, 'transparent_pixels': alpha.histogram()[0]}
    qa_dir = ROOT / 'qa/gemwoven'
    qa_dir.mkdir(parents=True, exist_ok=True)
    (qa_dir / 'home-edges-b-export-qc.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    export()
