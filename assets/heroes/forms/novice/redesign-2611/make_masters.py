# Hiro's plain redesign (owner 07/11, approved lineup.png): one 512px master per form, cut from the lineup, keyed,
# placed like the old form's resting frame (same body height and foot line), as the identity reference for every sheet.
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'D:/Project/Gemwoven/assets/fx/heroes/fire'); from export_fx import key_out
lineup = key_out(Image.open('lineup.png')); w = lineup.width / 3
old = {1: 'D:/Project/Gemwoven/assets/heroes/novice/idle.webp', 2: 'D:/Project/Gemwoven/assets/heroes/forms/novice/form-2/idle.webp',
       3: 'D:/Project/Gemwoven/assets/heroes/forms/novice/form-3/idle.webp'}
def bbox(im): ys, xs = (np.asarray(im.getchannel('A')) > 60).nonzero(); return xs.min(), ys.min(), xs.max(), ys.max()
for f in (1, 2, 3):
    cell = lineup.crop((round((f - 1) * w), 0, round(f * w), lineup.height)); cell = cell.crop(bbox(cell))
    o = Image.open(old[f]).convert('RGBA'); c = o.width // 2; ref = o.crop((0, 0, c, c)).resize((512, 512), Image.LANCZOS)
    x0, y0, x1, y1 = bbox(ref); k = (y1 - y0) / cell.height
    cell = cell.resize((round(cell.width * k), round(cell.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); out.alpha_composite(cell, (round((x0 + x1) / 2 - cell.width / 2), y1 - cell.height))
    out.save(f'form-{f}-master.png'); m = Image.new('RGB', (512, 512), (255, 0, 255)); m.paste(out, (0, 0), out); m.save(f'form-{f}-master-magenta.png')
    print(f, 'height', y1 - y0)
