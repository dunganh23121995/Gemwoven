"""Export generated painted backgrounds to exact source canvases, losslessly."""
from pathlib import Path
from PIL import Image
import json
import shutil

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
GENERATED = Path('C:/Users/dungca/.codex/generated_images/01a14fb7-4e6b-7a83-8f9b-353cfe965234')
FILES = {
    'shop': 'exec-087d83e6-bd7b-46f0-b5e8-b2ce57711e0f.png',
    'forge': 'exec-a995d9a6-9a89-4372-9c96-cf5d4e2f9d75.png',
    'tavern': 'exec-bb520abb-e888-4d59-b2b7-841aab2bbe5c.png',
}

def export():
    report = {}
    for key, generated in FILES.items():
        raw_path = OUT / f'{key}-raw.png'
        if not raw_path.exists():
            shutil.copy2(GENERATED / generated, raw_path)
        raw = Image.open(raw_path)
        original = Image.open(ROOT / f'assets/gemwoven/backgrounds/{key}.webp')
        rgba = raw.convert('RGBA')
        assert rgba.getchannel('A').getextrema() == (255, 255), 'Background must be fully opaque'
        final = raw.convert('RGB')
        if final.size != original.size:
            final = final.resize(original.size, Image.Resampling.LANCZOS)
        target = ROOT / f'assets/gemwoven/backgrounds/{key}-painted.webp'
        final.save(target, lossless=True, exact=True, method=6)
        restored = Image.open(target).convert('RGB')
        assert restored.tobytes() == final.tobytes()
        assert restored.size == original.size
        report[key] = {'source_size': original.size, 'raw_size': raw.size, 'final_size': restored.size, 'fully_opaque': True, 'lossless_rgb_equal': True, 'file_bytes': target.stat().st_size}
    qa_dir = ROOT / 'qa/gemwoven'
    qa_dir.mkdir(parents=True, exist_ok=True)
    (qa_dir / 'screens-painted-b-export-qc.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    export()
