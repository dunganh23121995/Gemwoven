# Form 3's entrance (fidget.py proc + accept, raw in .build-cache, prompt in showcase/prompt-entrance.txt): Codex tints
# the road dust toward the magenta key (rose, peach); it goes back to sandy beige: the FX exporter's unpink, then the
# peach dust at his feet (lowest 30% of each cell: never his skin or hair). Run after each accept.
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'D:/Project/Gemwoven/assets/fx/heroes/novice')
from export_form_fx import unpink  # noqa: E402
p = 'D:/Project/Gemwoven/assets/heroes/forms/novice/form-3/showcase/entrance.webp'
a = np.asarray(Image.open(p).convert('RGBA'), dtype=np.float32); unpink(a)
cell = a.shape[1] // 2; low = (np.arange(a.shape[0]) % cell > cell * .7)[:, None]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
peach = low & (r - g > 45) & (b > .45 * r) & (g > .55 * r)
lum = .299 * r + .587 * g + .114 * b
for ch, k in enumerate((1.08, 1.0, .84)):
    a[..., ch] = np.where(peach, np.minimum(255, lum * k), a[..., ch])
Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA').save(p, 'WEBP', lossless=True, method=6)
print('ok')
