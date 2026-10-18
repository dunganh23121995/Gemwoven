"""Reprocess ImageGen Tân run art and align its horizontal body root.

Only chroma cleanup and translation are applied; no art is drawn or resized
per frame. The shared idle profile controls one fixed output scale.
"""
from pathlib import Path
import json
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from prepare_masters import despill_boundary

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/heroes/novice'
OUT = BASE / 'run'
PROCESSOR = Path.home() / '.codex/skills/generate2dsprite/scripts/generate2dsprite.py'


def main():
    subprocess.run([sys.executable, str(PROCESSOR), 'process',
        '--input', str(ROOT / 'assets/gemwoven/raw/novice-run.png'),
        '--target', 'player', '--mode', 'run', '--output-dir', str(OUT),
        '--rows', '2', '--cols', '2', '--scale-profile', str(BASE / 'character-scale-profile.json'),
        '--strict-qc', '--allow-source-edge-touch', '--max-body-scale-cv', '0.08',
        '--max-anchor-y-std', '0.05', '--duration', '100'], check=True)
    path = OUT / 'pipeline-meta.json'
    meta = json.loads(path.read_text())
    frames = []
    contact = Image.new('RGB', (1024, 300), '#233440')
    draw = ImageDraw.Draw(contact)
    atlas = Image.new('RGBA', (512, 512))
    translations = []
    for index, info in enumerate(meta['frames']):
        frame = despill_boundary(Image.open(OUT / f'run-{index+1}.png').convert('RGBA'))
        data = np.array(frame)
        colors = data[:, :, :3].astype(np.int16)
        visible = data[:, :, 3] > 0
        spill = visible & (np.minimum(colors[:, :, 0], colors[:, :, 2]) - colors[:, :, 1] > 35)
        if spill.any():
            _, nearest = ndimage.distance_transform_edt(~(visible & ~spill), return_indices=True)
            data[spill, :3] = data[nearest[0], nearest[1], :3][spill]
            frame = Image.fromarray(data)
        # Anchor x to the shared raw-cell body root, rather than alternating
        # contact boots. Align bottom of boot to the idle's final sole line;
        # different pose heights retain the run's natural vertical bob.
        scale = info['source_to_output_scale']
        raw_center = info['source_frame_size'][0] / 2
        new_x = round(128 - (raw_center - info['crop_bbox'][0]) * scale)
        dx = new_x - info['paste_position'][0]
        aligned = Image.new('RGBA', (256, 256))
        bbox = frame.getbbox()
        assert bbox and 0 < bbox[0] + dx and bbox[2] + dx < 256
        dy = 237 - bbox[3]
        aligned.alpha_composite(frame, (dx, dy))
        aligned.save(OUT / f'run-{index+1}.png', optimize=True)
        translations.append([dx, dy])
        info['postprocess_translation'] = [dx, dy]
        info['aligned_bbox'] = list(aligned.getbbox())
        pixels = np.asarray(aligned)
        rgb = pixels[:, :, :3].astype(np.int16)
        assert not np.any((pixels[:, :, 3] > 0) & (np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1] > 35))
        frames.append(aligned)
        atlas.alpha_composite(aligned, ((index % 2)*256, (index//2)*256))
        # QA preview uses the packer's final floor translation (+13).
        contact.paste(aligned, (index*256, 24+13), aligned)
        draw.text((index*256+8, 8), f'run {index} / 100ms', fill='#f8e5b8')
    atlas.save(OUT / 'sheet-transparent.png', optimize=True)
    frames[0].save(OUT / 'animation.gif', save_all=True, append_images=frames[1:], duration=100, loop=0, disposal=2)
    meta['postprocess'] = {'horizontalAnchor': 'shared raw cell center',
        'translations': translations, 'soleBaseline': 237,
        'naturalPoseHeightPreserved': True,
        'magentaVisiblePixelCount': 0, 'script': 'scripts/prepare_novice_run.py',
        'sourceEdgeReview': 'Frame 3 hair whorl has a complete contour 3px below the raw cell top; profile trim is4px. Visually reviewed source-only edge override; no output contact or clamping.'}
    path.write_text(json.dumps(meta, indent=2), encoding='utf-8')
    qa = ROOT / 'qa/gemwoven/novice-run'
    qa.mkdir(exist_ok=True, parents=True)
    contact.save(qa / 'contact.png')
    print(json.dumps(meta['qc_summary'], indent=2))


if __name__ == '__main__':
    main()
