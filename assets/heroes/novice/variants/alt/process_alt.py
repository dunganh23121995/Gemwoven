"""Process the alternative look of Tân (variants/alt) into 256px runtime atlases + meta.json.

Every raw sheet (Codex gpt-6-astra, high) is cut by the generate2dsprite processor with one uniform
scale per sheet (preserve + feet), chosen so his standing pose has the same height in every action
(STANDING px, close to the current look's 176). The processor runs on a 384 cell so raised swords keep
their headroom; ../../pack_action.py then crops each frame to the 256 cell with the feet on y=244.

  python assets/heroes/novice/variants/alt/process_alt.py [action ...]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))
from pack_action import pack, meta_entry  # noqa: E402

PROCESSOR = 'C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py'
STANDING = 180  # px, hair tips to boot soles, in the 256 cell
WORK = 384
# action: grid (cols, rows), the frame that stands upright (scale reference), ms per frame, loop
ACTIONS = {
    'idle': ((2, 4), 0, 150, True),
    'attack': ((3, 2), 0, 110, False),
    'cast': ((3, 2), 5, 120, False),
    'hurt': ((3, 2), 5, 90, False),
    'run': ((3, 2), 2, 100, True),
}
# The run's feet anchor jumps between the support feet: hold the head still instead.
HEAD_X = {'run': 142}


def standing_height(raw, cols, rows, frame):
    """Hair-to-sole height of one frame, ignoring a thin raised blade (rows narrower than 12% of the cell)."""
    a = np.asarray(Image.open(raw).convert('RGB')).astype(int)
    body = ~((a[..., 0] > 180) & (a[..., 2] > 180) & (a[..., 1] < 90))
    cw, ch = a.shape[1] / cols, a.shape[0] / rows
    x, y = int(frame % cols * cw), int(frame // cols * ch)
    cell = body[y:int(y + ch), x:int(x + cw)]
    wide = np.flatnonzero(cell.sum(axis=1) >= cw * .12)
    rows_any = np.flatnonzero(cell.any(axis=1))
    return rows_any.max() - wide.min(), cw


def run(action):
    (cols, rows), ref, duration, loop = ACTIONS[action]
    folder = HERE / action
    height, cell = standing_height(folder / 'raw-sheet.png', cols, rows, ref)
    scale = STANDING / height  # raw px -> output px
    fit = scale * cell / WORK
    subprocess.run([sys.executable, PROCESSOR, 'process', '--input', str(folder / 'raw-sheet.png'), '--target', 'player', '--mode', action,
                    '--output-dir', str(folder / 'proc'), '--rows', str(rows), '--cols', str(cols), '--cell-size', str(WORK),
                    '--fit-scale', f'{fit:.4f}', '--align', 'feet', '--scale-strategy', 'preserve', '--component-mode', 'largest',
                    '--strict-qc', '--max-body-scale-cv', '0.08', '--max-anchor-y-std', '0.05', '--duration', str(duration)],
                   check=True, capture_output=True)
    report = pack(folder / 'proc', action, cols, rows, HERE / f'{action}.webp', head_x=HEAD_X.get(action))
    qc = json.loads((folder / 'proc/pipeline-meta.json').read_text(encoding='utf-8'))['qc_summary']
    return meta_entry(report, f'{action}.webp', cols, rows, duration, loop, hero='novice', action=action, accepted=True,
                      source=f'assets/heroes/novice/variants/alt/{action}/raw-sheet.png', model='gpt-6-astra (high)',
                      rawStandingHeight=int(height), outputScale=round(scale, 4), qc=qc)


if __name__ == '__main__':
    path = HERE / 'meta.json'
    book = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'hero': 'novice', 'name': 'Tân (bản vẽ mới)', 'cellSize': 256, 'actions': {}}
    for action in sys.argv[1:] or list(ACTIONS):
        book['actions'][action] = run(action)
        print(action, book['actions'][action]['outputScale'], book['actions'][action]['headAnchors'])
    # The skill (Kiếm Nhiệt Huyết) is the cast sheet: wind-up, dash, rise, overhead slash, follow-through.
    if 'cast' in book['actions']:
        book['actions']['skill'] = {**book['actions']['cast'], 'action': 'skill'}
    book['actions'] = {k: book['actions'][k] for k in ['idle', 'attack', 'cast', 'skill', 'hurt', 'run'] if k in book['actions']}
    path.write_text(json.dumps(book, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
