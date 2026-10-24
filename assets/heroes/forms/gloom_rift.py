"""Pull the violet of a rift entrance sheet toward cold grey (frames 1-7); frame 8 is the rest pose.
The user wants the entrance gloomy, not violet. Usage: python gloom_rift.py <showcase dir>"""
import sys
import numpy as np
from PIL import Image

KEEP = [.25, .25, .25, .3, .35, .45, .65, 1.0]
path = sys.argv[1].rstrip('/') + '/rift.webp'
sh = np.asarray(Image.open(path).convert('RGBA'), dtype=np.float32)
for i, k in enumerate(KEEP):
    y, x = (i // 2) * 256, (i % 2) * 256
    c = sh[y:y + 256, x:x + 256, :3]; grey = c.mean(-1, keepdims=True)
    sh[y:y + 256, x:x + 256, :3] = grey + (c - grey) * k
Image.fromarray(sh.clip(0, 255).astype('uint8'), 'RGBA').save(path, lossless=True, method=6)
