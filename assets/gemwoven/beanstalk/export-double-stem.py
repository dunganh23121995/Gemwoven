"""Normalize generated double-stem art; original ImageGen pixels stay in raw/."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parent
SIZE = (384, 512)
ENDPOINT_WIDTH = 114
AXIS = 192
END_BAND = 64


def clean_alpha(image):
    pixels = np.asarray(image.convert("RGBA")).copy()
    regions, _ = label(pixels[:, :, 3] > 16)
    counts = np.bincount(regions.ravel())
    counts[0] = 0
    keep = binary_dilation(regions == counts.argmax(), iterations=2)
    pixels[~keep] = 0
    return Image.fromarray(pixels)


def row_bounds(image, y):
    xs = np.where(np.asarray(image)[y, :, 3] > 128)[0]
    return int(xs[0]), int(xs[-1] + 1)


raw = Image.open(ROOT / "raw/double-stem.png").convert("RGBA")
base = clean_alpha(raw).resize(SIZE, Image.Resampling.LANCZOS)
# Register both strips by row before blending, with a gentle transition out of
# the end bands. Matching silhouettes prevent transparent duplicate edges.
registered = Image.new("RGBA", SIZE)
for y in range(SIZE[1]):
    distance = min(y, SIZE[1] - 1 - y)
    row = base.crop((0, y, SIZE[0], y + 1))
    if distance < END_BAND:
        t = max(0, min(1, (END_BAND - distance) / 32))
        weight = t * t * (3 - 2 * t)
        left, right = row_bounds(base, y)
        center = (left + right) / 2
        scale = 1 + weight * (ENDPOINT_WIDTH / (right - left) - 1)
        translate = center + weight * (AXIS - center) - scale * center
        row = row.transform(
            (SIZE[0], 1), Image.Transform.AFFINE,
            (1 / scale, 0, -translate / scale, 0, 1, 0),
            Image.Resampling.BICUBIC,
        )
    registered.paste(row, (0, y))
base = registered
# Fade generated end strips into one another and remove the duplicated strip.
# This is a deterministic tile seam cleanup, not newly drawn vegetation.
OVERLAP = 32
top_strip = np.asarray(base.crop((0, 0, SIZE[0], OVERLAP))).astype(float)
bottom_strip = np.asarray(
    base.crop((0, SIZE[1] - OVERLAP, SIZE[0], SIZE[1]))
).astype(float)
blend = np.zeros_like(top_strip)
for y in range(OVERLAP):
    t = y / (OVERLAP - 1)
    t = t * t * (3 - 2 * t)
    a = top_strip[y, :, 3:4] / 255
    b = bottom_strip[y, :, 3:4] / 255
    alpha = t * a + (1 - t) * b
    rgb = t * top_strip[y, :, :3] * a + (1 - t) * bottom_strip[y, :, :3] * b
    blend[y, :, :3] = np.divide(rgb, alpha, out=np.zeros_like(rgb), where=alpha > 0)
    blend[y, :, 3:4] = alpha * 255
base.paste(Image.fromarray(np.rint(blend).astype(np.uint8)), (0, SIZE[1] - OVERLAP))
base = base.crop((0, OVERLAP, SIZE[0], SIZE[1])).resize(SIZE, Image.Resampling.LANCZOS)
ends = [row_bounds(base, y) for y in (0, 511)]
result = Image.new("RGBA", SIZE)
for y in range(SIZE[1]):
    edge = 0 if y < END_BAND else 1 if y >= SIZE[1] - END_BAND else None
    if edge is None:
        row = base.crop((0, y, SIZE[0], y + 1))
    else:
        distance = y if edge == 0 else SIZE[1] - 1 - y
        t = max(0, 1 - distance / END_BAND)
        weight = t * t * (3 - 2 * t)
        left, right = ends[edge]
        end_center = (left + right) / 2
        scale = 1 + weight * (ENDPOINT_WIDTH / (right - left) - 1)
        offset = weight * (AXIS - end_center)
        # Local horizontal scale about the source endpoint center plus alignment.
        translate = end_center + offset - scale * end_center
        row = base.crop((0, y, SIZE[0], y + 1)).transform(
            (SIZE[0], 1),
            Image.Transform.AFFINE,
            (1 / scale, 0, -translate / scale, 0, 1, 0),
            Image.Resampling.BICUBIC,
        )
    result.paste(row, (0, y))
result = clean_alpha(result)
result.save(ROOT / "double-stem.png")
result.save(ROOT / "double-stem.webp", lossless=True, method=6)

widths = [row_bounds(result, y) for y in (0, 511)]
metadata = {
    "schema": "gemwoven.beanstalk-double-stem.v1",
    "file": "double-stem.webp",
    "png": "double-stem.png",
    "size": list(SIZE),
    "sockets": {"start": [AXIS, 0], "end": [AXIS, 512]},
    "endpointOpaqueWidths": [right - left for left, right in widths],
    "endpointOpaqueBounds": widths,
    "repeat": {
        "axis": "vertical",
        "overlapSourcePixels": 1,
        "policy": "Align endpoint sockets; 1 source pixel overlap. End-strip crossfade is baked into this seamless export.",
    },
    "renderLayer": "behind-leaves-and-actors, in-front-of-branch-roots",
    "raw": "raw/double-stem.png",
    "rawSize": list(raw.size),
    "prompt": "double-stem.prompt.txt",
    "exporter": "export-double-stem.py",
    "generation": {
        "tool": "built-in image_gen",
        "artAgentModel": "gpt-6-astra",
        "artAgentReasoning": "high",
        "rawPreserved": True,
        "styleReferences": ["stem-segment.png", "leaf-platform.png"],
    },
    "postprocess": "Remove disconnected alpha specks; Lanczos resize384x512; register both32px end strips to114px opaque width centered192 with smooth64px transition bands; crossfade generated strips in premultiplied alpha, remove duplicate32px strip, resize vertically to512; normalize final endpoints114px centered192. Lossless PNG/WebP.",
    "notes": "Exactly two substantial intertwined stems. Source opaque endpoint width is2x the original stem's57px. Two small tendrils; no new leaf platforms or runtime code.",
}
(ROOT / "double-stem.metadata.json").write_text(
    json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
)
assert result.getchannel("A").getextrema() == (0, 255)
decoded = Image.open(ROOT / "double-stem.webp").convert("RGBA")
for color in ((120, 130, 140, 255), (255, 255, 255, 255)):
    left = Image.new("RGBA", SIZE, color)
    right = left.copy()
    left.alpha_composite(result)
    right.alpha_composite(decoded)
    assert np.array_equal(np.asarray(left), np.asarray(right))
print(json.dumps({"size": SIZE, "endpoints": widths, "alphaBounds": result.getbbox()}))
