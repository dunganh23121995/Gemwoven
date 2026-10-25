"""process_sheet.py: green-key a Codex body sheet and lay it out like Lumi's existing combat sheets.

python process_sheet.py <raw.png> <rows> <cols> <out_dir> --form N [--cell 256] [--anchor boots|bottom|sheet] [--scale S]

- Green key (same maths as tools/green_master.py / fidget.key_cells green=True) plus edge despill.
- Each drawing is gathered by connected components over the WHOLE sheet (a raised spear that pokes
  past its grid line still belongs to its own pose) and assigned to the cell that holds most of it.
- One uniform scale for the whole sheet (never per frame): default = form idle body height / frame-1
  body height, so the ready pose matches the accepted idle.
- Translation only per frame: lowest point on footY .94 of the output cell and the boots' midpoint on
  the idle's boots x (anchor=boots), or the whole sheet moved as one (anchor=sheet, keeps Codex's bob).
Writes frame-N.png, sheet.webp (cols x rows of cell), meta.json (scale, offsets, heads in actor 256 units).
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path("D:/Project/Gemwoven")
ap = argparse.ArgumentParser()
ap.add_argument("raw"); ap.add_argument("rows", type=int); ap.add_argument("cols", type=int); ap.add_argument("out")
ap.add_argument("--form", type=int, required=True); ap.add_argument("--cell", type=int, default=256)
ap.add_argument("--anchor", default="boots"); ap.add_argument("--scale", type=float, default=0)
ap.add_argument("--foot", type=float, default=.94); ap.add_argument("--xshift", type=float, default=0)
a = ap.parse_args()
out = Path(a.out); out.mkdir(parents=True, exist_ok=True)


def boots(alpha):
    """(x, y) midpoint of the two boots (solid runs in the lowest 7% of the body) and the sole; else bottom centre."""
    m = alpha >= 128
    ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    h = ys.max() - ys.min(); low = m[ys.max() - int(h * .07):ys.max() + 1]
    cols = low.sum(0); hit = np.where(cols >= max(3, cols.max() * .45))[0]
    runs = [r for r in np.split(hit, np.where(np.diff(hit) > 2)[0] + 1) if len(r) >= 4]
    x = (runs[0].min() + runs[-1].max()) / 2 if runs else (xs.min() + xs.max()) / 2
    return x, ys.max()


# reference: the form's accepted idle, frame 1
idle = Image.open(ROOT / f"assets/heroes/forms/lightning/form-{a.form}/idle.webp").convert("RGBA").crop((0, 0, 256, 256))
ia = np.asarray(idle)[..., 3]
iy = np.where((ia >= 128).any(1))[0]; idle_h = iy.max() - iy.min()
idle_bx, idle_by = boots(ia)

c = np.asarray(Image.open(a.raw).convert("RGB"), dtype=np.float32)
r, g, b = c[..., 0], c[..., 1], c[..., 2]
key = g - np.maximum(r, b)
alpha = np.clip(1 - (key - 60) / 90, 0, 1)
spill = np.clip(key / 255, 0, 1)
c[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
H, W = alpha.shape; ch, cw = H // a.rows, W // a.cols
# components over the whole sheet; nearby specks (dangling stars, hair tips) join their body
solid = alpha > .5
lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=6))
lab = lab * solid
cellmask = [np.zeros_like(solid) for _ in range(a.rows * a.cols)]
for i, sl in enumerate(ndimage.find_objects(lab)):
    if sl is None: continue
    comp = lab[sl] == i + 1; area = comp.sum()
    if area < 150: continue
    yy, xx = np.nonzero(comp); yy = yy + sl[0].start; xx = xx + sl[1].start
    cells = (yy // ch).clip(0, a.rows - 1) * a.cols + (xx // cw).clip(0, a.cols - 1)
    k = np.bincount(cells).argmax(); cellmask[k][yy, xx] = True
rgba = np.concatenate([c, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8")
frames = []
for k in range(a.rows * a.cols):
    m = ndimage.binary_dilation(cellmask[k], iterations=3) & (alpha > 0)
    img = rgba.copy(); img[..., 3] = (img[..., 3] * m).astype("uint8")
    ys, xs = np.where(m); box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    frames.append(Image.fromarray(img).crop(box))
# despill edges (tools/despill.py)
def despill(im):
    """Clamp green to max(red, blue) on the outline band (3 px in, or not fully opaque): no green key fringe."""
    x = np.asarray(im).astype(np.int32); R, G, B, A = x[..., 0], x[..., 1], x[..., 2], x[..., 3]
    edge = (ndimage.distance_transform_edt(A > 128) <= 3.5) | (A < 250); cap = np.maximum(R, B)
    x[..., 1] = np.where(edge & (A > 0) & (G > cap), cap, G)
    return Image.fromarray(x.clip(0, 255).astype("uint8"), "RGBA")
frames = [despill(f) for f in frames]
h0 = np.where((np.asarray(frames[0])[..., 3] >= 128).any(1))[0]; h0 = h0.max() - h0.min()
scale = a.scale or idle_h / h0
cell = a.cell; pad = (cell - 256) / 2
tx, ty = idle_bx + pad + a.xshift, a.foot * cell
meta = {"raw": str(a.raw), "scale": round(scale, 4), "cell": cell, "idle_height": int(idle_h), "frame1_height": int(h0), "frames": []}
sheet = Image.new("RGBA", (cell * a.cols, cell * a.rows), (0, 0, 0, 0))
first = None
for k, f in enumerate(frames):
    # Resample premultiplied ('RGBa'): the key colour still sitting under fully transparent pixels must not
    # bleed into the outline as a green fringe. Then despill the resampled edge once more.
    f = despill(f.convert('RGBa').resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.Resampling.LANCZOS).convert('RGBA'))
    fa = np.asarray(f)[..., 3]; bx, by = boots(fa)
    if a.anchor in ("boots", "bottom"):
        dx = tx - (bx if a.anchor == "boots" else fa.shape[1] / 2); dy = ty - by
    else:
        if first is None: first = (tx - bx, ty - by)
        dx, dy = first
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0)); canvas.paste(f, (round(dx), round(dy)))
    ca = np.asarray(canvas)[..., 3] >= 128; ys = np.where(ca.any(1))[0]; xs = np.where(ca.any(0))[0]
    touch = bool(ca[0].any() or ca[-1].any() or ca[:, 0].any() or ca[:, -1].any())
    lost = int((fa >= 128).sum() - ca.sum())
    # head: centre of the top band of the hat/head region -> actor 256 units
    top = ys.min(); band = ca[top:top + 12]; hx = np.where(band.any(0))[0]
    meta["frames"].append({"bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], "edge_touch": touch, "lost_px": lost, "offset": [round(dx, 1), round(dy, 1)]})
    canvas.save(out / f"frame-{k + 1}.png")
    sheet.alpha_composite(canvas, ((k % a.cols) * cell, (k // a.cols) * cell))
sheet.save(out / "sheet.webp", lossless=True, method=6)
json.dump(meta, open(out / "meta.json", "w"), indent=1)
print(json.dumps({k: meta[k] for k in ("scale", "idle_height", "frame1_height")}), [(f["bbox"], f["edge_touch"], f["lost_px"]) for f in meta["frames"]])
