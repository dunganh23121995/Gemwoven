"""Cut the round fire vortex (owner 05/11: "xoáy hiện tại hình vuông, sửa lại hình tròn — chỉ là hiệu ứng nổi") out of
raw-vortex.png (black background, keyed by brightness like board-fx-v3/prep.py) into assets/special-fx/vortex.webp,
centred on the disc so it turns about its true centre. Replaces the square vortex of board-fx-v3."""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
a = np.asarray(Image.open(HERE / 'raw-vortex.png').convert('RGB')).astype(np.float32) / 255
alpha = np.clip((a.max(axis=2) - .03) / .97, 0, 1)
rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(a.max(axis=2, keepdims=True), 1e-4), 0, 1), 0)
ys, xs = np.where(alpha > .05)
cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
r = int(max(ys.max() - cy, cy - ys.min(), xs.max() - cx, cx - xs.min())) + 8
out = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').crop((int(cx) - r, int(cy) - r, int(cx) + r, int(cy) + r))
out.resize((640, 640), Image.LANCZOS).save(HERE.parents[3] / 'assets/special-fx/vortex.webp', quality=90, method=6)
print('vortex', out.size)
