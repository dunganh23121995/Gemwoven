"""strip.py <sheet.webp> <out.png> [cols=2] [rows=4]: lay the 8 frames side by side on grey with a
foot line and a centre line, plus an onion-skin (frames 1 and 5 overlaid) at the end, for review."""
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 2; rows = int(sys.argv[4]) if len(sys.argv) > 4 else 4
im = Image.open(src).convert("RGBA"); cw, ch = im.width // cols, im.height // rows
frames = [im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)) for i in range(cols * rows)]
n = len(frames); W = cw * (n + 1)
bg = Image.new("RGBA", (W, ch), (70, 74, 84, 255)); d = ImageDraw.Draw(bg)
for i, f in enumerate(frames):
    bg.alpha_composite(f, (i * cw, 0)); d.line([(i * cw, 0), (i * cw, ch)], fill=(40, 40, 40, 255))
    d.text((i * cw + 4, 4), str(i + 1), fill=(255, 255, 0, 255))
a = frames[0].copy(); a.putalpha(a.getchannel("A").point(lambda v: v // 2)); b = frames[n // 2].copy(); b.putalpha(b.getchannel("A").point(lambda v: v // 2))
bg.alpha_composite(a, (n * cw, 0)); bg.alpha_composite(b, (n * cw, 0))
for y in (int(ch * .94), int(ch * .86)):
    d.line([(0, y), (W, y)], fill=(0, 255, 255, 120))
scale = 2 if cw <= 256 else 1
bg.save(out)
