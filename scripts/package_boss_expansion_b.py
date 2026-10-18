"""Package ImageGen boss sheets after generate2dsprite strict QC.

Rebuilds temporary frames from committed raw sheets, profiles and QC settings.
Requires Pillow and the generate2dsprite skill processor (override --processor).
Run with selected boss IDs, or no arguments for all five. --verify rebuilds and
compares against accepted runtime images without writing any production files.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IDS = ['sporefather', 'prismback', 'sandchronarch', 'coraltide', 'moonfang']
HEAD_Y = dict(sporefather=112, prismback=135, sandchronarch=83, coraltide=110, moonfang=83)
MIRROR = {'prismback', 'coraltide', 'moonfang'}

def prepare(boss, processor, work_dir):
    raw = ROOT / 'assets/gemwoven/raw/boss-chapters-2026' / boss
    for action in ['idle', 'cast']:
        meta = json.loads((raw / f'{action}-qc.json').read_text())
        prompt = raw / f'{action}-prompt.txt'
        if boss == 'coraltide' and action == 'cast':
            prompt = raw / 'cast-correction-prompt.txt'
        command = [sys.executable, str(processor), 'process',
                   '--input', str(raw / f'{action}.png'),
                   '--target', meta['target'], '--mode', action,
                   '--rows', str(meta['rows']), '--cols', str(meta['cols']),
                   '--output-dir', str(work_dir / boss / action),
                   '--scale-profile', str(raw / 'scale-profile.json'),
                   '--threshold', str(meta['threshold']),
                   '--edge-threshold', str(meta['edge_threshold']),
                   '--duration', str(meta['duration']),
                   '--strict-qc', '--prompt-file', str(prompt)]
        for key in ['max_body_scale_cv', 'max_anchor_y_std', 'max_profile_scale_drift']:
            value = meta.get('qc_config', {}).get(key)
            if value is not None:
                command += ['--' + key.replace('_', '-'), str(value)]
        subprocess.run(command, check=True, cwd=ROOT)

def deliver(image, path, verify):
    if verify:
        accepted = Image.open(path).convert('RGBA')
        assert image.size == accepted.size, f'Size mismatch: {path}'
        assert image.convert('RGBa').tobytes() == accepted.convert('RGBa').tobytes(), f'Pixel mismatch: {path}'
    else:
        image.save(path, lossless=True, method=6)

def package(boss, work_dir, verify=False):
    out = ROOT / 'assets/gemwoven/encounters' / boss
    raw = ROOT / 'assets/gemwoven/raw/boss-chapters-2026' / boss
    out.mkdir(parents=True, exist_ok=True)
    record = {'portrait': f'assets/gemwoven/encounters/{boss}/portrait.webp'}
    qa = {}
    for action in ['idle', 'cast']:
        source = work_dir / boss / action
        meta = json.loads((source / 'pipeline-meta.json').read_text())
        assert meta['qc_summary']['empty_count'] == 0
        assert meta['qc_summary']['edge_touch_count'] == 0
        assert meta['qc_summary']['paste_clamped_count'] == 0
        frames = []
        for i in range(4):
            frame = Image.open(source / f'{action}-{i+1}.png').convert('RGBA')
            if boss in MIRROR:
                frame = ImageOps.mirror(frame)
            # Match the existing bosses' lower grounded presentation.
            final = Image.new('RGBA', (256, 256))
            final.alpha_composite(frame, (0, 8))
            bbox = final.getchannel('A').getbbox()
            assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < 256 and bbox[3] < 256
            frames.append(final)
        atlas = Image.new('RGBA', (512, 512))
        for i, frame in enumerate(frames):
            atlas.alpha_composite(frame, ((i % 2) * 256, (i // 2) * 256))
        deliver(atlas, out / f'{action}.webp', verify)
        record[action] = {'src': f'assets/gemwoven/encounters/{boss}/{action}.webp', 'cols': 2, 'rows': 2, 'count': 4, 'heads': [[128, HEAD_Y[boss]]] * 4, 'frameDuration': 230 if action == 'idle' else 150}
        qa[action] = meta.get('qc_summary', {})
        if action == 'idle':
            clean = Image.open(source / 'raw-sheet-clean.png').convert('RGBA')
            portrait = clean.crop((0, 0, clean.width // 2, clean.height // 2))
            if boss in MIRROR:
                portrait = ImageOps.mirror(portrait)
            portrait = portrait.crop(portrait.getchannel('A').getbbox())
            portrait.thumbnail((460, 460), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (512, 512))
            canvas.alpha_composite(portrait, ((512 - portrait.width) // 2, (512 - portrait.height) // 2))
            deliver(canvas, out / 'portrait.webp', verify)
    record['attack'] = record['cast']
    record['hurt'] = record['idle']
    print(boss, json.dumps(qa))
    return record

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bosses', nargs='*', help='Boss IDs: ' + ', '.join(IDS))
    codex_dir = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex')))
    parser.add_argument('--processor', type=Path, default=codex_dir / 'skills/generate2dsprite/scripts/generate2dsprite.py')
    parser.add_argument('--work-dir', type=Path, default=ROOT / 'tmp/boss-expansion-b')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    unknown = set(args.bosses) - set(IDS)
    if unknown:
        parser.error('Unknown boss IDs: ' + ', '.join(sorted(unknown)))
    if not args.processor.is_file():
        parser.error('generate2dsprite processor not found; install the skill or supply --processor PATH')
    manifest = ROOT / 'assets/gemwoven/boss-expansion-b.json'
    data = json.loads(manifest.read_text()) if manifest.exists() else {'bosses': {}}
    for boss in (args.bosses or IDS):
        prepare(boss, args.processor.resolve(), args.work_dir.resolve())
        record = package(boss, args.work_dir.resolve(), args.verify)
        if args.verify:
            assert record == data['bosses'][boss], f'Manifest mismatch: {boss}'
        else:
            data['bosses'][boss] = record
    if not args.verify:
        manifest.write_text(json.dumps(data, indent=2) + '\n')
    else:
        print('Verified all selected atlases, portraits and manifest records; production files unchanged.')

if __name__ == '__main__':
    main()
