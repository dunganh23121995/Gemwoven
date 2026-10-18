"""Package five accepted ImageGen boss bundles; all transforms preserve anatomy.

Requires Pillow, NumPy, SciPy and the generate2dsprite skill processor. Original
ImageGen outputs and literal prompts are retained under raw/boss-chapters-2026.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/gemwoven'
RAW = ASSETS / 'raw/boss-chapters-2026'
QA = ROOT / 'qa/gemwoven/boss-chapters-a'
IDS = ['elderbloom', 'cinderheart', 'frostregent', 'tempestwing', 'souljailer']
MIRROR = {'elderbloom', 'cinderheart', 'frostregent'}
HEAD_OFFSETS = {'elderbloom': 66, 'cinderheart': 57, 'frostregent': 29, 'tempestwing': 46, 'souljailer': 69}
SOURCE_CELL = 704


def safe_grid(source: Path, processor, mirror: bool):
    """Recover complete connected silhouettes before splitting any grid gutters.

    A complete arm can cross an invisible cell boundary into empty magenta; it
    must not be chopped by naive equal-cell cropping. Components are associated
    with the nearest of the four main bodies, then translated without resizing.
    """
    raw = Image.open(source).convert('RGBA')
    clean = processor.remove_bg_magenta(raw.copy(), 70, 100)
    rgba = np.array(clean)
    labels, count = ndimage.label(rgba[:, :, 3] > 0, np.ones((3, 3)))
    sizes = np.bincount(labels.ravel())
    majors = sorted(np.argsort(sizes[1:])[-4:] + 1,
                    key=lambda label: ndimage.center_of_mass(labels == label)[0])
    top = sorted(majors[:2], key=lambda label: ndimage.center_of_mass(labels == label)[1])
    bottom = sorted(majors[2:], key=lambda label: ndimage.center_of_mass(labels == label)[1])
    majors = top + bottom
    assert all(sizes[label] > 25000 for label in majors), (source, sizes[majors])
    centers = [ndimage.center_of_mass(labels == label) for label in majors]
    owners = np.zeros(count + 1, dtype=np.uint8)
    for label, sl in enumerate(ndimage.find_objects(labels), 1):
        if sl is None or sizes[label] < 5:
            continue
        if label in majors:
            owner = majors.index(label)
        else:
            y = (sl[0].start + sl[0].stop) / 2
            x = (sl[1].start + sl[1].stop) / 2
            owner = min(range(4), key=lambda i: (centers[i][0]-y)**2+(centers[i][1]-x)**2)
        owners[label] = owner + 1
    owner_map = owners[labels]
    grid = Image.new('RGBA', (SOURCE_CELL*2, SOURCE_CELL*2))
    frames, records = [], []
    for index in range(4):
        array = rgba.copy()
        array[owner_map != index+1] = 0
        frame = Image.fromarray(array)
        bounds = frame.getbbox()
        assert bounds and min(bounds[:2]) > 0 and bounds[2] < raw.width and bounds[3] < raw.height, (source, index, bounds)
        frame = frame.crop(bounds)
        assert max(frame.size) < SOURCE_CELL-30, (source, index, frame.size)
        if mirror:
            frame = ImageOps.mirror(frame)
        target = ((SOURCE_CELL-frame.width)//2, SOURCE_CELL-32-frame.height)
        grid.alpha_composite(frame, (index%2*SOURCE_CELL+target[0], index//2*SOURCE_CELL+target[1]))
        frames.append(frame)
        records.append({'originalBounds': list(bounds), 'sourceSize': list(frame.size), 'mirrored': mirror})
    return grid, frames, records


def package(processor_path: Path, selected=None):
    spec = importlib.util.spec_from_file_location('sprite_processor', processor_path)
    processor = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = processor
    spec.loader.exec_module(processor)
    catalog = {'version': 1, 'generator': 'built-in ImageGen', 'artModel': 'gpt-6-astra',
               'reasoningEffort': 'high', 'bosses': {}}
    if selected and (ASSETS/'boss-expansion-a.json').exists():
        catalog = json.loads((ASSETS/'boss-expansion-a.json').read_text(encoding='utf-8'))
    QA.mkdir(parents=True, exist_ok=True)
    preview = Image.new('RGB', (5*512, 2*550), '#1b2635')
    if selected and (QA/'contact-sheet.png').exists():
        preview = Image.open(QA/'contact-sheet.png').convert('RGB')
    draw = ImageDraw.Draw(preview)
    for boss_index, boss in enumerate(IDS):
        if selected and boss not in selected:
            continue
        output = ASSETS / 'encounters' / boss
        output.mkdir(parents=True, exist_ok=True)
        profile = output / 'character-scale-profile.json'
        entry = {'portrait': f'encounters/{boss}/portrait.webp'}
        for row, action in enumerate(['idle', 'cast']):
            source = RAW / boss / f'{action}-raw.png'
            qa = QA / boss / action
            qa.mkdir(parents=True, exist_ok=True)
            grid, original_frames, recovery = safe_grid(source, processor, boss in MIRROR)
            normalized = qa / 'safe-source-grid.png'
            grid.save(normalized)
            if action == 'idle':
                portrait = original_frames[0].copy()
                portrait.thumbnail((430, 430), Image.Resampling.LANCZOS)
                canvas = Image.new('RGBA', (512, 512))
                canvas.alpha_composite(portrait, ((512-portrait.width)//2, 474-portrait.height))
                canvas.save(output / 'portrait.webp', lossless=True, method=6, exact=True)
            command = [sys.executable, str(processor_path), 'process', '--input', str(normalized),
                       '--target', 'creature', '--mode', action, '--rows', '2', '--cols', '2',
                       '--output-dir', str(qa), '--cell-size', '256', '--fit-scale', '0.88',
                       '--align', 'center' if boss in {'frostregent', 'tempestwing', 'souljailer'} else 'feet',
                       '--scale-strategy', 'preserve', '--shared-scale',
                       '--component-mode', 'all', '--threshold', '0', '--edge-threshold', '0',
                       '--trim-border', '0', '--edge-clean-depth', '0', '--strict-qc',
                       '--max-body-scale-cv', '0.08', '--max-anchor-y-std', '0.05',
                       '--max-profile-scale-drift', '0.10', '--duration', '220' if action=='idle' else '135']
            command += ['--write-scale-profile', str(profile), '--profile-name', boss] if action=='idle' else ['--scale-profile', str(profile)]
            result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
            if result.returncode:
                raise RuntimeError(boss+' '+action+'\n'+result.stdout+result.stderr)
            meta = json.loads((qa/'pipeline-meta.json').read_text(encoding='utf-8'))
            sheet = Image.open(qa/'sheet-transparent.png').convert('RGBA')
            if boss in {'frostregent', 'tempestwing', 'souljailer'}:
                # Thin heels and spectral tendrils are below the processor's
                # 98th-percentile feet estimate. Align complete bottoms explicitly.
                anchored = Image.new('RGBA', sheet.size)
                for i in range(4):
                    frame = sheet.crop((i%2*256,i//2*256,i%2*256+256,i//2*256+256))
                    bounds = frame.getbbox()
                    anchored.alpha_composite(frame, (i%2*256, i//2*256+245-bounds[3]))
                sheet = anchored
            sheet.save(output/f'{action}.webp', lossless=True, method=6, exact=True)
            frames = [sheet.crop((i%2*256,i//2*256,i%2*256+256,i//2*256+256)) for i in range(4)]
            hashes = [hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames]
            assert len(set(hashes)) == 4, (boss, action, 'duplicate frames')
            bounds = [frame.getbbox() for frame in frames]
            assert all(b and min(b[:2]) > 3 and max(b[2:]) < 254 for b in bounds), (boss, action, bounds)
            entry[action] = {'src': f'encounters/{boss}/{action}.webp', 'cols': 2, 'rows': 2,
                             'count': 4, 'heads': [[128, max(48, b[1]+HEAD_OFFSETS[boss])] for b in bounds],
                             'frameDuration': 220 if action=='idle' else 135}
            runtime_meta = {'boss': boss, 'action': action, 'accepted': True, 'facing': 'left',
                            'frameWidth': 256, 'frameHeight': 256, 'columns': 2, 'rows': 2,
                            'frames': 4, 'frameOrder': 'row-major', 'loop': action=='idle',
                            'frameDuration': entry[action]['frameDuration'], 'uniqueFrames': 4,
                            'framePixelHashes': hashes, 'alphaBounds': bounds, 'heads': entry[action]['heads'],
                            'sharedScaleProfile': 'character-scale-profile.json', 'qc': meta['qc_summary'],
                            'source': source.relative_to(ROOT).as_posix(),
                            'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                            'safeGridRecovery': recovery, 'processor': 'generate2dsprite preserve-scale strict QC'}
            (output/f'{action}-meta.json').write_text(json.dumps(runtime_meta,indent=2)+'\n',encoding='utf-8')
            preview.paste(sheet, (boss_index*512,row*550), sheet)
            draw.text((boss_index*512+14,row*550+516), boss+' '+action, fill='white')
            print(boss, action, 'PASS', meta['qc_summary'], flush=True)
        entry['attack'] = dict(entry['cast'])
        entry['hurt'] = dict(entry['idle'])
        catalog['bosses'][boss] = entry
        (ASSETS/'boss-expansion-a.json').write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
        preview.save(QA/'contact-sheet.png')
    audit_catalog()
    return catalog


def audit_catalog():
    """Verify final files after presentation alignment and refresh head anchors."""
    path = ASSETS/'boss-expansion-a.json'
    catalog = json.loads(path.read_text(encoding='utf-8'))
    for boss, entry in catalog['bosses'].items():
        for action in ['idle', 'cast']:
            target = ASSETS/entry[action]['src']
            sheet = Image.open(target).convert('RGBA')
            assert sheet.size == (512,512)
            frames = [sheet.crop((i%2*256,i//2*256,i%2*256+256,i//2*256+256)) for i in range(4)]
            bounds = [frame.getbbox() for frame in frames]
            assert all(b and min(b[:2]) > 3 and max(b[2:]) < 254 for b in bounds)
            assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == 4
            heads = [[128,max(48,b[1]+HEAD_OFFSETS[boss])] for b in bounds]
            entry[action]['heads'] = heads
            meta_path = target.with_name(action+'-meta.json')
            meta = json.loads(meta_path.read_text(encoding='utf-8'))
            meta['heads'] = heads
            meta['alphaBounds'] = bounds
            meta['finalOutputEdgeTouchCount'] = 0
            meta['presentationAnchor'] = 'complete silhouette bottom at 245' if boss in {'frostregent','tempestwing','souljailer'} else 'processor feet anchor'
            meta_path.write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
        entry['attack'] = dict(entry['cast'])
        entry['hurt'] = dict(entry['idle'])
    path.write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
    print('Final alpha, edge, unique-frame and head-anchor audit passed:', len(catalog['bosses']), 'bosses')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skill-processor', type=Path,
                        default=Path.home()/'.codex/skills/generate2dsprite/scripts/generate2dsprite.py')
    parser.add_argument('--boss', nargs='+', choices=IDS)
    args = parser.parse_args()
    package(args.skill_processor, args.boss)
