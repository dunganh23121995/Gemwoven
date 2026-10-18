"""Reproduce Gemwoven themed creature cutouts from accepted ImageGen sheets.

Raw source art and prompts live in assets/gemwoven/raw/theme-creatures.
Use --reprocess to run the installed generate2dsprite chroma-key/QC processor.
Runtime assets and the dedicated manifest are deterministic; QA stays ignored.
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/gemwoven'
QA = ROOT / 'qa/gemwoven/theme-creatures'
PACKS = [
    ('01', [('volcano', 'Ember imp', 'Lava rockling'), ('ice', 'Snow rabbit', 'Frost wolf'), ('thunder', 'Spark jelly', 'Storm hawk'), ('marsh', 'Toxic slug', 'Spore toad')]),
    ('02', [('desert', 'Sand jackal', 'Sand scorpion'), ('abyss', 'Coral crab', 'Deep jelly'), ('foundry', 'Wind-up beetle', 'Cog drone'), ('crystal', 'Gem spider', 'Crystal ooze')]),
    ('03-v2', [('haunted', 'Ghost lantern', 'Skeletal raven'), ('sky', 'Breeze fox', 'Cloud owl'), ('thorns', 'Thorn boar', 'Vine bud'), ('celestial', 'Sun moth', 'Golden cub')]),
    ('04', [('void', 'Void eye', 'Eclipse hound'), ('pine', 'Pinecone boar', 'Pine owl'), ('obsidian', 'Obsidian hound', 'Lava mite'), ('bamboo', 'Bamboo lizard', 'Jade koi')]),
    ('05', [('coast', 'Storm crab', 'Wave gull'), ('dream', 'Dream moth', 'Pillow phantom'), ('astral', 'Star drake', 'Astral orb')]),
]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reprocess', action='store_true')
    parser.add_argument('--processor', type=Path, default=Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py')
    args = parser.parse_args()
    QA.mkdir(parents=True, exist_ok=True)
    items = {}
    for pack, families in PACKS:
        raw = ART / f'raw/theme-creatures/pack-{pack}.png'
        processed = QA / f'pack-{pack}'
        cols = len(families)
        if args.reprocess:
            subprocess.run([sys.executable, str(args.processor), 'process', '--input', str(raw), '--target', 'creature', '--mode', 'single', '--rows', '2', '--cols', str(cols), '--output-dir', str(processed), '--cell-size', '512', '--fit-scale', '0.76', '--align', 'feet', '--component-mode', 'all', '--trim-border', '0', '--strict-qc'], check=True)
        metadata = json.loads((processed / 'pipeline-meta.json').read_text(encoding='utf-8'))
        for index, (theme, label, name) in enumerate((theme, label, name) for theme, ordinary, elite in families for label, name in [('a', ordinary), ('b', elite)]):
            key = f'creature-{theme}-{label}'
            source = Image.open(processed / f'single-{index + 1}.png').convert('RGBA')
            bounds = source.getbbox()
            if not bounds:
                raise ValueError(f'Empty creature: {key}')
            cutout = source.crop(bounds)
            canvas = Image.new('RGBA', (512, 512))
            canvas.alpha_composite(cutout, ((512 - cutout.width) // 2, 461 - cutout.height))
            final_bounds = canvas.getbbox()
            assert final_bounds[3] == 461 and final_bounds[0] > 0 and final_bounds[2] < 512 and final_bounds[1] > 0, (key, final_bounds)
            canvas.save(ART / f'items/{key}.png', optimize=True)
            canvas.save(ART / f'items/{key}.webp', quality=92, method=6)
            frame_meta = metadata['frames'][index]
            assert not frame_meta['source_edge_touch'] and not frame_meta['output_edge_touch'] and not frame_meta['paste_clamped'], key
            items[key] = {
                'file': f'items/{key}.webp', 'png': f'items/{key}.png',
                'width': 512, 'height': 512, 'name': name, 'theme': theme,
                'role': 'ordinary' if label == 'a' else 'elite',
                'alphaBounds': list(final_bounds), 'origin': [256, 461],
                'facing': 'left', 'static': True, 'transparent': True, 'textless': True,
                'raw': str(raw.relative_to(ART)).replace('\\', '/'),
                'sourceCell': [index // cols, index % cols],
            }
    manifest = {'version': 1, 'generator': 'built-in ImageGen', 'artModel': 'gpt-6-astra', 'reasoningEffort': 'high', 'promptFile': 'raw/theme-creatures/prompts.json', 'coordinateConvention': 'alphaBounds are [left,top,right,bottom], exclusive right/bottom; origin is bottom-center', 'items': items}
    (ART / 'theme-creature-items.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    contact = Image.new('RGB', (8 * 200, 5 * 230), '#13212d')
    draw = ImageDraw.Draw(contact)
    for index, (key, item) in enumerate(items.items()):
        x, y = (index % 8) * 200, (index // 8) * 230
        thumb = Image.open(ART / item['png']).convert('RGBA').resize((200, 200), Image.Resampling.LANCZOS)
        contact.paste(thumb, (x, y), thumb)
        draw.text((x + 7, y + 204), key.removeprefix('creature-'), fill='#f5e8c9')
    contact.save(QA / 'theme-creatures-contact.jpg', quality=94)
    print(f'Packaged {len(items)} themed creature cutouts; all source and output edge checks passed.')

if __name__ == '__main__':
    main()
