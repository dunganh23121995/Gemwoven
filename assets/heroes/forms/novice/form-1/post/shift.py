"""shift.py <sheet.webp> <frame:dx[,dy]> ... : place whole frames by integer pixel offsets inside their cells
(placement only, like fidget.py --lock-legs; no resampling, scaling or drawing). Overwrites the sheet."""
import sys
from PIL import Image
path = sys.argv[1]
im = Image.open(path).convert("RGBA"); c = im.width // 2
for spec in sys.argv[2:]:
    i, d = spec.split(":"); i = int(i) - 1
    dx, dy = (list(map(int, d.split(","))) + [0])[:2]
    box = ((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)
    f = im.crop(box); out = Image.new("RGBA", f.size, (0, 0, 0, 0)); out.paste(f, (dx, dy))
    assert f.getbbox() is None or out.getchannel("A").getbbox() and sum(out.getchannel("A").histogram()[1:]) >= sum(f.getchannel("A").histogram()[1:]) * .999, f"frame {i+1} would be clipped"
    im.paste(out, box[:2])
im.save(path, lossless=True, method=6); print("shifted", sys.argv[2:])
