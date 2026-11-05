"""Cut the two new status glyphs out of raw-glyphs.png (2x2 on flat magenta) into assets/combat-status/.
iceshard (top-left) stays tightly cropped and portrait, so its fill line runs over the shard's own height;
freezeguard (owner 05/11: "dùng biểu tượng cục đá đóng băng rồi thêm 1 nét gạch chéo màu đỏ") is the left cell of
raw-resist.png (drawn on transparency), padded square like the other glyphs. Re-run after a redraw."""
from pathlib import Path
import numpy as np
from PIL import Image

RAW = Path(__file__).resolve().parent
OUT = RAW.parents[2] / 'combat-status'
PICK = {'iceshard': ('raw-glyphs.png', 2, 0, 0, False), 'freezeguard': ('raw-resist.png', 1, 0, 0, True)}


def key(cell):
    a = np.asarray(cell.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = np.clip((np.minimum(r, b) - g) / 255, 0, 1)
    alpha = np.clip(1 - (mag - .35) / .45, 0, 1)
    spill = np.clip(np.minimum(r, b) - g, 0, None) * (1 - alpha)
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')


for name, (file, rows, col, row, square) in PICK.items():
    sheet = Image.open(RAW / file); W, H = sheet.size
    cell = sheet.crop((col * W // 2, row * H // rows, (col + 1) * W // 2, (row + 1) * H // rows))
    piece = cell.convert('RGBA') if cell.mode == 'RGBA' and cell.getextrema()[3][0] == 0 else key(cell)
    piece = piece.crop(piece.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox())
    if square:
        side = max(piece.size); sq = Image.new('RGBA', (side, side)); sq.paste(piece, ((side - piece.width) // 2, (side - piece.height) // 2)); piece = sq
    s = 128 / max(piece.size)
    piece = piece.resize((round(piece.width * s), round(piece.height * s)), Image.LANCZOS)
    piece.save(OUT / f'{name}.webp', quality=92, method=6); print(name, piece.size)
