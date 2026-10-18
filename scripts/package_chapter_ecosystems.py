"""Extract static chapter ecosystems from preserved built-in ImageGen source atlases.

Run --reprocess to reproduce chroma-key processing and strict edge QC. Raw sheets
and literal prompts stay in assets; intermediates and review contact sheets in QA.
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/gemwoven'
RAW = ART / 'raw/chapter-ecosystems'
QA = ROOT / 'qa/gemwoven/chapter-ecosystems'
PACKS = {
    'eldergrove': ['sproutling', 'barkmoth', 'vineboar', 'rootwarden', 'thornstag', 'sapbreaker'],
    'caldera': ['emberimp', 'slagbeetle', 'ashhound', 'basaltbrute', 'furnacepriest', 'heatseal'],
    'glacier': ['snowhare', 'iceling', 'frostmoth', 'rimeknight', 'blizzardowl', 'thawflame'],
    'stormspire': ['sparkfinch', 'cloudjelly', 'gustfox', 'voltgryphon', 'stormtotem', 'groundrod'],
    'soulcrypt': ['wisp', 'bonecrow', 'chainrat', 'cagekeeper', 'veilassassin', 'dawnlantern'],
    'mycelium': ['sporecap', 'sludgesnail', 'rottick', 'plagueherald', 'sporetoad', 'antivenom'],
    'geode': ['shardmite', 'stonepup', 'crystalbat', 'rampartgolem', 'prismseer', 'resonancefork'],
    'hourglass': ['dustscarab', 'sandcobra', 'clockmote', 'dunesentinel', 'chronoweaver', 'anchorhourglass'],
    'coralreef': ['reefcrab', 'foamjelly', 'pearleel', 'tidemarshal', 'coraloracle', 'tideanchor'],
    'moonkeep': ['duskfang', 'moonmoth', 'shadowraven', 'lunarknight', 'eclipsestalker', 'moonmirror'],
}
# Visually reviewed empty horizontal gutters, normalized to source height.
# Caldera's lower staff begins just above the mathematical half-way point.
ROW_BREAKS = {'caldera': 480 / 1024, 'glacier': 480 / 1024, 'stormspire': 480 / 1024, 'soulcrypt': 450 / 1024, 'mycelium': 450 / 1024, 'geode': 450 / 1024, 'hourglass': 480 / 1024, 'moonkeep': 480 / 1024}
COLUMN_BREAKS = {'moonkeep': [0, 512 / 1536, 1060 / 1536, 1]}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reprocess', action='store_true')
    parser.add_argument('--available', action='store_true', help='Package only completed raw themes during production')
    parser.add_argument('--only', nargs='+', choices=list(PACKS), help='Process selected themes and retain existing manifest entries')
    parser.add_argument('--processor', type=Path, default=Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py')
    args = parser.parse_args()
    QA.mkdir(parents=True, exist_ok=True)
    manifest_path = ART / 'chapter-ecosystem-items.json'
    items = json.loads(manifest_path.read_text(encoding='utf-8'))['items'] if args.only and manifest_path.exists() else {}
    for theme, names in PACKS.items():
        if args.only and theme not in args.only:
            continue
        raw = RAW / f'{theme}.png'
        if args.available and not raw.exists():
            continue
        output = QA / theme
        if args.reprocess:
            source = Image.open(raw).convert('RGBA')
            row_break = round(source.height * ROW_BREAKS.get(theme, 0.5))
            x_edges = [round(fraction * source.width) for fraction in COLUMN_BREAKS.get(theme, [0, 1/3, 2/3, 1])]
            y_edges = [0, row_break, source.height]
            # Repack source rectangles without scaling or repainting. This makes
            # unequal but empty row gutters explicit before the strict processor.
            cell = max(max(x_edges[i+1] - x_edges[i] for i in range(3)), row_break, source.height-row_break)
            prepared = Image.new('RGBA', (cell*3, cell*2), (255, 0, 255, 255))
            for index in range(6):
                row, col = divmod(index, 3)
                crop = source.crop((x_edges[col], y_edges[row], x_edges[col+1], y_edges[row+1]))
                prepared.paste(crop, (col*cell + (cell-crop.width)//2, row*cell + (cell-crop.height)//2))
            prepared_path = QA / f'{theme}-extraction-grid.png'
            prepared.save(prepared_path)
            # Violet ghosts need a narrower color-key range to preserve their
            # authored lavender body instead of removing it with the background.
            chroma = ['--threshold', '30', '--edge-threshold', '50'] if theme in ('soulcrypt', 'moonkeep') else []
            subprocess.run([sys.executable, str(args.processor), 'process', '--input', str(prepared_path), '--target', 'creature', '--mode', 'single', '--rows', '2', '--cols', '3', '--output-dir', str(output), '--cell-size', '512', '--fit-scale', '0.80', '--align', 'feet', '--component-mode', 'all', '--trim-border', '0', '--strict-qc', *chroma], check=True)
        metadata = json.loads((output / 'pipeline-meta.json').read_text(encoding='utf-8'))
        for index, name in enumerate(names):
            artifact = index == 5
            key = f'artifact-{theme}' if artifact else f'creature-{theme}-{name}'
            frame = Image.open(output / f'single-{index+1}.png').convert('RGBA')
            bounds = frame.getbbox()
            if not bounds:
                raise ValueError(f'Empty sprite: {key}')
            crop = frame.crop(bounds)
            canvas = Image.new('RGBA', (512, 512))
            y = (512-crop.height)//2 if artifact else 461-crop.height
            canvas.alpha_composite(crop, ((512-crop.width)//2, y))
            bounds = canvas.getbbox()
            assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 512 and bounds[3] < 512, (key, bounds)
            qc = metadata['frames'][index]
            assert not qc['source_edge_touch'] and not qc['output_edge_touch'] and not qc['paste_clamped'], key
            png, webp = f'items/{key}.png', f'items/{key}.webp'
            canvas.save(ART / png, optimize=True)
            canvas.save(ART / webp, quality=92, method=6)
            items[key] = {'file': png, 'png': png, 'webp': webp, 'width': 512, 'height': 512, 'alphaBounds': list(bounds), 'theme': theme, 'role': 'artifact' if artifact else ('ordinary' if index < 3 else 'elite'), 'name': name, 'static': True, 'facing': 'left', 'transparent': True, 'textless': True, 'origin': [256, 256 if artifact else 461], 'raw': f'raw/chapter-ecosystems/{theme}.png', 'sourceCell': [index//3, index%3]}
    manifest = {'version': 1, 'generator': 'built-in ImageGen', 'artModel': 'gpt-6-astra', 'reasoningEffort': 'high', 'coordinateConvention': 'alphaBounds use exclusive right/bottom', 'items': items}
    (ART / 'chapter-ecosystem-items.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    contact = Image.new('RGB', (6*200, ((len(items)+5)//6)*225), '#14212d')
    draw = ImageDraw.Draw(contact)
    for index, (key, item) in enumerate(items.items()):
        x, y = (index%6)*200, (index//6)*225
        thumb = Image.open(ART / item['file']).convert('RGBA').resize((200,200), Image.Resampling.LANCZOS)
        contact.paste(thumb, (x,y), thumb)
        draw.text((x+5,y+202), item['name'], fill='#f5e8c9')
    contact.save(QA / 'contact.jpg', quality=94)
    print(f'Packaged {len(items)} static chapter assets with strict edge checks.')

if __name__ == '__main__':
    main()
