# Hiro's plain six-star aura (owner 07/11 redesign, prompt-used.txt; the old jewel arc is in the Git history): the
# processor's frames (pipeline-meta.json: 2 x 4 sheet, 256px cells) packed into aura.webp. Thin white wind streaks
# drawn over the magenta key keep a pink cast: the FX exporter's despill (fade the key, pink to beige) clears it.
#   python ~/.codex/skills/generate2dsprite/scripts/generate2dsprite.py process --input raw-sheet.png --target asset
#     --mode aura --output-dir proc --rows 4 --cols 2 --cell-size 256 --fit-scale 0.96 --align center
#     --scale-strategy fit --component-mode all --trim-border 4 --edge-clean-depth 3 --threshold 100 --edge-threshold 150
#   python assets/heroes/forms/novice/aura/export_plain.py
import sys
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[4] / 'assets/fx/heroes/novice'))
from export_form_fx import despill  # noqa: E402
strip = Image.new('RGBA', (2048, 256))
for i in range(8):
    f = despill(Image.open(HERE / f'proc/aura-{i + 1}.png').convert('RGBA'), False)
    f.save(HERE / f'aura-{i + 1}.png'); strip.alpha_composite(f, (i * 256, 0))
strip.save(HERE / 'aura.webp', 'WEBP', lossless=True, method=6)
print('ok')
