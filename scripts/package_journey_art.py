"""Package the accepted ImageGen journey artwork; never draws creative art.

Raw outputs and prompts remain in assets/gemwoven/raw. The optional sprite
processor path defaults to the installed generate2dsprite skill.
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'assets/gemwoven/raw'
ITEMS = ROOT / 'assets/gemwoven/items'
BACKGROUNDS = ROOT / 'assets/gemwoven/backgrounds'
QA = ROOT / 'qa/gemwoven/journey-art'


def suppress_key_spill(image):
    """Neutralize only highly saturated magenta residue at chroma-key edges."""
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a and r > g * 1.7 + 10 and b > g * 1.7 + 10:
                pixels[x, y] = (min(r, g + 25), g, min(b, g + 30), a)
    return image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sprite-processor', type=Path, default=Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py')
    args = parser.parse_args()
    prompts = json.loads((RAW / 'journey-art-prompts.json').read_text(encoding='utf-8'))
    QA.mkdir(parents=True, exist_ok=True)
    entries = {}
    frames = {
        'journey-button': ((1050, 290), {'label': [260, 88, 540, 125]}),
        'chat-frame': ((760, 1100), {'header': [152, 77, 456, 66], 'conversation': [91, 198, 578, 649], 'input': [91, 924, 578, 66]}),
        'settings-frame': ((760, 1000), {'header': [167, 110, 426, 50], 'content': [99, 230, 562, 650]}),
    }
    for name, (size, safe) in frames.items():
        raw = Image.open(RAW / f'{name}-raw.png').convert('RGBA')
        if name == 'journey-button':
            raw = raw.crop(raw.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
            rendered = ImageOps.contain(raw, (size[0] - 12, size[1] - 12), Image.Resampling.LANCZOS)
            out = Image.new('RGBA', size)
            out.alpha_composite(rendered, ((size[0] - rendered.width) // 2, (size[1] - rendered.height) // 2))
        else:
            out = raw.resize(size, Image.Resampling.LANCZOS)
        out.save(ITEMS / f'{name}.png', optimize=True)
        entries[name] = {'file': f'items/{name}.png', 'width': size[0], 'height': size[1], 'textless': True, 'transparent': True, 'safeContentRects': safe, 'raw': f'raw/{name}-raw.png'}

    for name in ['monster-slime', 'monster-acorn', 'monster-bat']:
        output = QA / name
        prompt = QA / f'{name}.prompt.txt'
        prompt.write_text(prompts['prompts'][name], encoding='utf-8')
        subprocess.run([sys.executable, str(args.sprite_processor), 'process', '--input', str(RAW / f'{name}-raw.png'), '--target', 'creature', '--mode', 'idle', '--rows', '1', '--cols', '1', '--output-dir', str(output), '--cell-size', '512', '--fit-scale', '0.80', '--align', 'feet', '--component-mode', 'largest', '--strict-qc', '--prompt-file', str(prompt)], check=True)
        frame = suppress_key_spill(Image.open(output / 'idle-1.png').convert('RGBA'))
        frame.save(ITEMS / f'{name}.png', optimize=True)
        frame.save(ITEMS / f'{name}.webp', quality=94, method=6)
        qc = json.loads((output / 'pipeline-meta.json').read_text(encoding='utf-8'))
        entries[name] = {'file': f'items/{name}.webp', 'png': f'items/{name}.png', 'width': 512, 'height': 512, 'textless': True, 'transparent': True, 'facing': 'left', 'static': True, 'raw': f'raw/{name}-raw.png', 'alphaBounds': list(frame.getchannel('A').getbbox()), 'origin': [256, 461], 'qc': qc['qc_summary']}
        prompt.unlink(missing_ok=True)
        (output / 'prompt-used.txt').unlink(missing_ok=True)

    scenery = Image.open(RAW / 'journey-map-raw.png').convert('RGB')
    scenery.save(BACKGROUNDS / 'journey-map.webp', quality=92, method=6)
    entries['journey-map'] = {'file': 'backgrounds/journey-map.webp', 'width': scenery.width, 'height': scenery.height, 'textless': True, 'transparent': False, 'raw': 'raw/journey-map-raw.png', 'role': 'decorative backdrop; all stage nodes and rewards are DOM objects'}
    manifest = {'version': 1, 'generator': 'built-in ImageGen', 'artModel': 'gpt-6-astra', 'promptFile': 'raw/journey-art-prompts.json', 'coordinateConvention': 'safeContentRects are [x,y,width,height] in final image pixels', 'items': entries}
    (ROOT / 'assets/gemwoven/journey-items.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
