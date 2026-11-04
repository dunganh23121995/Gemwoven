"""Biến Thân v2 spirit (owner 04/11: a huge see-through guardian spirit rises around the hero and fades; approved for Mika,
weapon removed). Codex draws it on pure black; here it is keyed by brightness so the glow keeps its soft alpha, its faint
fill thins (steeper curve) so the bright lines carry the shape, and its base of flames dissolves at the bottom. The aura
that stays after it is not a drawing: it is built from the hero's own silhouette in src/transform-fx.css.

python assets/heroes/forms/transform_spirit.py <hero>   (reads assets/gemwoven/raw/transform2-<hero>/raw-spirit.png,
writes assets/heroes/forms/<hero>/transform/spirit.webp and v2.json, which switches the hero to the v2 look in build.py)
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]


def luma_key(rgb, floor=.08, gamma=1.3):
    """Black background -> alpha from brightness; colour un-premultiplied so the glow keeps its hue."""
    peak = rgb.max(axis=2)
    a = np.clip((peak / 255.0 - floor) / (1 - floor), 0, 1) ** gamma
    col = np.where(a[..., None] > 1e-3, rgb / np.maximum(peak[..., None], 1) * 255, 0)
    return np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.float32)


def fade_bottom(rgba, start=.86):
    """The spirit's base of flames dissolves instead of ending on a hard bright bar."""
    y = np.linspace(0, 1, rgba.shape[0])[:, None]
    rgba[..., 3] *= np.clip((1 - y) / (1 - start), 0, 1) ** .8
    return rgba


def main(hero):
    raw = ROOT / f'assets/gemwoven/raw/transform2-{hero}'
    out = ROOT / f'assets/heroes/forms/{hero}/transform'
    out.mkdir(parents=True, exist_ok=True)
    spirit = Image.open(raw / 'raw-spirit.png').convert('RGB')
    spirit = spirit.resize((768, round(768 * spirit.height / spirit.width)), Image.LANCZOS)
    rgba = fade_bottom(luma_key(np.asarray(spirit, np.float32)))
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(out / 'spirit.webp', quality=90, method=6)
    (out / 'v2.json').write_text(json.dumps({'v2': True, 'source': f'assets/gemwoven/raw/transform2-{hero}/raw-spirit.png'}) + '\n', encoding='utf-8')
    print(hero, 'spirit', spirit.size)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'fire')
