"""zoom.py sheet out [cols rows] [box x0,y0,x1,y1 in cell px] [scale]: frames side by side on grey, enlarged."""
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 2; rows = int(sys.argv[4]) if len(sys.argv) > 4 else 4
im = Image.open(src).convert("RGBA"); cw, ch = im.width // cols, im.height // rows
box = tuple(int(v) for v in sys.argv[5].split(",")) if len(sys.argv) > 5 else (0, 0, cw, ch)
sc = float(sys.argv[6]) if len(sys.argv) > 6 else 2
n = cols * rows; bw, bh = box[2] - box[0], box[3] - box[1]
W, H = int(bw * sc), int(bh * sc)
per = 4 if n > 4 else n
bg = Image.new("RGBA", (W * per, H * ((n + per - 1) // per)), (70, 74, 84, 255)); d = ImageDraw.Draw(bg)
for i in range(n):
    f = im.crop(((i % cols) * cw + box[0], (i // cols) * ch + box[1], (i % cols) * cw + box[2], (i // cols) * ch + box[3])).resize((W, H), Image.LANCZOS)
    x, y = (i % per) * W, (i // per) * H
    bg.alpha_composite(f, (x, y)); d.rectangle([x, y, x + W - 1, y + H - 1], outline=(40, 40, 40, 255)); d.text((x + 4, y + 4), str(i + 1), fill=(255, 255, 0, 255))
bg.save(out)
