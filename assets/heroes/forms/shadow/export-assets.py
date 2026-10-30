"""Package the accepted built-in ImageGen Noct evolution sheets for runtime."""
import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
NAMES = {"2": "Dạ Ảnh Kiếm Sĩ", "3": "Tử Thần Vô Diện"}
# Tight square head-and-shoulders crops; padded above the hood/crown for circles.
PORTRAIT_BOXES = {"2": (130, 52, 222, 144), "3": (106, 76, 192, 162)}
# Soles of every Noct sheet rest on this row of the 256px cell (footY 0.94 runtime line).
SOLE_Y = 248
# Authored hood-top landmarks in 256px runtime cells, excluding raised weapons.
HEADS = {
    "2": None,  # matched from idle frame 1's face window in register_form2()
    "3": {
        # Grim Reaper hood top: glowing-eye centre + (4, -43), the offset authored on idle.
        "idle": [[148, 84]] * 8,
        "attack": [[149, 96], [161, 97], [151, 94], [148, 93], [150, 111], [147, 97]],
        "cast": [[145, 91], [142, 90], [140, 91], [141, 88], [140, 88], [141, 88]],
        "run": [[185, 116], [176, 102], [196, 97], [192, 113], [174, 105], [179, 107]],
        "hover": [[156, 90], [155, 90], [156, 90], [156, 90], [156, 91], [159, 92]],
    },
}



def alpha(img):
    return np.asarray(img.convert("RGBA"))[..., 3]


def sole(img):
    """Lowest opaque row under the torso (the blade tip may hang lower at the sides)."""
    a = alpha(img)[:, 96:200]
    return int(np.where(a.max(axis=1) > 128)[0].max())


def shift(img, dy):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(img.convert("RGBA"), (0, dy))
    return out


def gray(img):
    """Luma composited on mid grey, so the hood silhouette matters as much as its paint."""
    a = np.asarray(img.convert("RGBA")).astype(float)
    lum = a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11
    return lum * a[..., 3] / 255 + 128 * (1 - a[..., 3] / 255)


# Form-2 face window on lifted idle frame 1 (hood brim, eyes, scarf) and its hood top.
FACE = (150, 76, 206, 124)
HOOD_TOP = (173, 60)


def locate_heads(idle_first, frames):
    """Hood-top landmark per frame by matching idle frame 1's face window (sum of squared differences)."""
    x0, y0, x1, y1 = FACE
    patch = gray(idle_first)[y0:y1, x0:x1]
    h, w = patch.shape
    heads = []
    for frame in frames:
        g = gray(frame)
        best = None
        for y in range(4, 200 - h):
            rows = g[y:y + h]
            for x in range(40, 252 - w, 2):
                d = float(((rows[:, x:x + w] - patch) ** 2).mean())
                if best is None or d < best[0]:
                    best = (d, x, y)
        _, bx, by = best
        for x in (bx - 1, bx + 1):
            d = float(((g[by:by + h, x:x + w] - patch) ** 2).mean())
            if d < best[0]:
                best = (d, x, by)
        heads.append([best[1] + HOOD_TOP[0] - x0, best[2] + HOOD_TOP[1] - y0])
    return heads


def despeckle(img, min_area=40):
    """Drop tiny detached specks (key-colour leftovers from neighbouring raw cells)."""
    from scipy import ndimage
    a = np.asarray(img).copy()
    labels, count = ndimage.label(a[..., 3] > 0)
    sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
    for index, area in enumerate(sizes, 1):
        if area < min_area:
            a[labels == index] = 0
    return Image.fromarray(a, "RGBA")


def register_form2(folder):
    """Place form-2 frames by one fixed transform instead of per-frame foot anchoring.

    Idle frames from the processor are lifted so the soles meet SOLE_Y. Action sheets
    were generated over action-anchor.png (the accepted idle cell repeated at a fixed
    scale and feet line), so one similarity transform maps the anchor subject onto
    idle frame 1 and is applied unchanged to every action cell. Lunges, crouches and
    strides keep their authored positions and the long blade is never clamped.
    """
    idle = [Image.open(folder / f"idle/idle-{i}.png").convert("RGBA") for i in range(1, 9)]
    lift = SOLE_Y - int(np.median([sole(f) for f in idle]))
    idle = [shift(f, lift) for f in idle]
    frames = {"idle": idle}
    anchor = np.asarray(Image.open(folder / "action-anchor.png").convert("RGB")).astype(int)[:512, :512]
    fg = ~((anchor[..., 0] > 200) & (anchor[..., 2] > 200) & (anchor[..., 1] < 80))
    ays, axs = np.where(fg)
    iys, ixs = np.where(alpha(idle[0]) > 128)
    scale = (iys.max() - iys.min()) / (ays.max() - ays.min())
    tx = (ixs.min() + ixs.max()) / 2 - scale * (axs.min() + axs.max()) / 2
    ty = iys.max() - scale * ays.max()
    for action in ("attack", "cast", "run", "hover"):
        clean = Image.open(folder / f"{action}/raw-sheet-clean.png").convert("RGBA")
        cell = clean.width // 3
        size = round(cell * scale)
        frames[action] = []
        for index in range(6):
            col, row = index % 3, index // 3
            src = clean.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell))
            out = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
            out.alpha_composite(src.resize((size, size), Image.Resampling.LANCZOS), (round(tx), round(ty)))
            frames[action].append(despeckle(out))
    for action, items in frames.items():
        for index, frame in enumerate(items):
            a = alpha(frame)
            assert not (a[0].any() or a[-1].any() or a[:, 0].any() or a[:, -1].any()), f"{action} {index + 1} touches the cell edge"
            frame.save(folder / f"{action}/{action}-{index + 1}.png")
    return {action: locate_heads(idle[0], items) for action, items in frames.items()}


PROCESSOR = Path.home() / ".codex/skills/generate2dsprite/scripts/generate2dsprite.py"


def ensure_frames(folder, action):
    """Processor outputs are gitignored intermediates; rebuild them from the raw sheet when missing."""
    source = folder / action
    if (source / f"{action}-1.png").exists() and (source / "raw-sheet-clean.png").exists():
        return
    # Form 3's committed frame-XX.png are the accepted frames; never re-derive them (run is
    # rebuilt from its raw sheet, whose frames 4-6 were redrawn with the legs swapped).
    if folder.name == "form-3" and action != "run" and (source / "frame-00.png").exists():
        return
    import subprocess
    import sys
    rows, cols = (4, 2) if action == "idle" else (2, 3)
    # Form 3's run streams its robe wide: a fixed smaller scale keeps every frame inside the cell.
    scale = ["--cell-size", "256", "--fit-scale", "0.85", "--trim-border", "4", "--edge-clean-depth", "3", "--align", "feet",
             "--scale-strategy", "preserve", "--component-mode", "largest"] if (folder.name, action) == ("form-3", "run")         else ["--scale-profile", str(folder / "character-scale-profile.json")]
    subprocess.run([sys.executable, str(PROCESSOR), "process", "--input", str(source / "raw-sheet.png"), "--target", "player",
                    "--mode", action, "--output-dir", str(source), "--rows", str(rows), "--cols", str(cols),
                    "--duration", "120" if action == "idle" else "100", "--prompt-file", str(source / "prompt-used.txt"),
                    *scale], check=True, capture_output=True)


# Six-star action sheets were drawn smaller than the idle (hood-matched: attack 0.90, cast 0.95,
# run 0.93, hover 0.92). The runtime enlarges them about the feet by these factors so Noct keeps
# his size when he moves from rest into an action.
ACTION_SCALE = {"3": {"attack": 1.111, "cast": 1.053, "run": 1.075, "hover": 1.087}}

parser = argparse.ArgumentParser()
parser.add_argument("--form", choices=("3",), action="append")
# Form 2 was redrawn as the moon ronin (2026-10-30) and is packaged by form-2/build_form2.py.
selected = parser.parse_args().form or ["3"]
manifest_path = ROOT / "forms.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"hero": "shadow", "forms": {}}
for form, name in NAMES.items():
    if form not in selected:
        continue
    folder = ROOT / f"form-{form}"
    for action in ("idle", "attack", "cast", "run", "hover"):
        ensure_frames(folder, action)
    prefix = folder.relative_to(REPO).as_posix()
    form_meta = {
        "name": name,
        "poster": f"{prefix}/master.png",
        "portrait": f"{prefix}/portrait.png",
        "actions": {},
    }
    heads = register_form2(folder) if form == "2" else HEADS[form]
    first = folder / "idle/idle-1.png"
    master = Image.open(first if first.exists() else folder / "idle/frame-00.png").convert("RGBA")
    master.save(folder / "master.png")
    master.crop(PORTRAIT_BOXES[form]).resize((256, 256), Image.Resampling.LANCZOS).save(folder / "portrait.png")
    # hover: the levitation sheet used to travel between stages (it replaces run there).
    for action in ("idle", "attack", "cast", "run", "hover"):
        source = folder / action
        count, cols = (8, 2) if action == "idle" else (6, 3)
        entry = {
            "file": f"{prefix}/{action}.webp", "cols": cols, "rows": count // cols, "count": count,
            "heads": heads[action],
            **({"scale": ACTION_SCALE[form][action]} if action in ACTION_SCALE.get(form, {}) else {}), "footY": 0.94, "frameDuration": 120 if action == "idle" else 100,
        }
        if not (source / f"{action}-1.png").exists():
            # Accepted sheet whose processor intermediates are gone: keep the committed runtime files.
            form_meta["actions"][action] = entry
            continue
        meta = json.loads((source / "pipeline-meta.json").read_text())
        meta["prompt"] = (source / "prompt-used.txt").read_text(encoding="utf-8-sig")
        (source / "pipeline-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        qc = meta["qc_summary"]
        if form == "3":
            # A raw blade tip may graze its source cell (reviewed, --allow-source-edge-touch); output frames may not.
            assert not qc["empty_count"] and not meta["output_edge_touch_frames"] and not qc["paste_clamped_count"], source
        count, cols = (8, 2) if action == "idle" else (6, 3)
        sheet = Image.new("RGBA", (256 * cols, 256 * (count // cols)), (0, 0, 0, 0))
        for index in range(count):
            processed = source / f"{action}-{index + 1}.png"
            frame = Image.open(processed if processed.exists() else source / f"frame-{index:02d}.png").convert("RGBA")
            frame.save(source / f"frame-{index:02d}.png")
            sheet.alpha_composite(frame, (index % cols * 256, index // cols * 256))
        assert sheet.getextrema()[3] == (0, 255), f"Missing alpha: {source}"
        sheet.save(folder / f"{action}.webp", lossless=True, method=6)
        form_meta["actions"][action] = {
            "file": f"{prefix}/{action}.webp",
            "cols": 2 if action == "idle" else 3,
            "rows": 4 if action == "idle" else 2,
            "count": count,
            "heads": heads[action],
            **({"scale": ACTION_SCALE[form][action]} if action in ACTION_SCALE.get(form, {}) else {}),
            "footY": 0.94,
            "frameDuration": 120 if action == "idle" else 100,
        }
        print(form, action, "QC", json.dumps(qc))
    manifest["forms"][form] = form_meta
(ROOT / "forms.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Noct rests on the stabilized cloth idle loops; repackage them over the idle written above.
import runpy  # noqa: E402
runpy.run_path(str(ROOT / "package_cloth_idle.py"))
