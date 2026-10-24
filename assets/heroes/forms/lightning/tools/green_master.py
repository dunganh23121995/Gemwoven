"""Showcase master for a violet character on the GREEN key (make_showcase.py's master step keys magenta).
python green_master.py <spec.json> <model> <effort> [gen|proc]
Same prompt as make_showcase.MASTER with #00FF00, same 512 cell / 0.86 fit / bottom line as the shared processor output."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = Path("D:/Project/Gemwoven")
sys.path.insert(0, str(ROOT / "assets/heroes/forms"))
from make_showcase import MASTER, GEN
spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")); model, effort = sys.argv[2], sys.argv[3]
step = sys.argv[4] if len(sys.argv) > 4 else "all"
d = ROOT / spec["dir"]; d.mkdir(parents=True, exist_ok=True)
if step in ("all", "gen"):
    im = Image.open(ROOT / spec["identity"]).convert("RGBA")
    bg = Image.new("RGBA", im.size, (0, 255, 0, 255)); bg.alpha_composite(im); bg.convert("RGB").save(d / "identity.png")
    text = MASTER.format(what=spec["what"], pose=spec["pose"]).replace("#FF00FF magenta", "#00FF00 green")
    (d / "prompt-master.txt").write_text(text + "\n", encoding="utf-8")
    r = subprocess.run([sys.executable, GEN, "--prompt-file", d / "prompt-master.txt", "--out", d / "raw-master.png", "--ref", d / "identity.png", "--model", model, "--effort", effort, "--timeout", "900"], capture_output=True, text=True)
    print(r.stdout[-400:], r.stderr[-800:])
    (d / "identity.png").unlink()
if step in ("all", "proc"):
    c = np.asarray(Image.open(d / "raw-master.png").convert("RGB"), dtype=np.float32)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    key = g - np.maximum(r, b)
    alpha = np.clip(1 - (key - 60) / 90, 0, 1)
    spill = np.clip(key / 255, 0, 1)
    c[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
    # largest component group: drop specks far from the body
    lab, n = ndimage.label(alpha > .5)
    sizes = ndimage.sum(alpha > .5, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= max(200, sizes.max() * .002)])
    keep = ndimage.binary_dilation(keep, iterations=3)
    alpha = alpha * keep
    img = Image.fromarray(np.concatenate([c, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8"), "RGBA")
    img = img.crop(img.getbbox())
    s = min(512 * .86 / img.height, 512 * .92 / img.width)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (512, 512), (0, 0, 0, 0)); out.alpha_composite(img, ((512 - img.width) // 2, 477 - img.height))
    out.save(d / "master.png"); print("master", out.getbbox())
