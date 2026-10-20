"""Postprocess ImageGen originals for Yuki and Lumi transformation forms.

No art is drawn here. Originals and exact prompts live in each form/source.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PROCESSOR = Path("C:/Users/dungca/.codex/skills/generate2dsprite/scripts/generate2dsprite.py")
NAMES = {
    ("ice", 2): "Nguyệt Sương Hộ Vệ",
    ("ice", 3): "Tuyết Nguyệt Nữ Đế",
    ("lightning", 2): "Tinh Lôi Pháp Sư",
    ("lightning", 3): "Thiên Lôi Tinh Chủ",
}

def frame_head(hero, form, action, index, path):
    """Crown/ear landmark, deliberately excluding blue/gold raised weapons."""
    face_x = {
        ("ice", 2): 144, ("ice", 3): 144,
        ("lightning", 2): 141, ("lightning", 3): 128,
    }[(hero, form)]
    arr = np.asarray(Image.open(path).convert("RGBA")).astype(np.int16)
    r, g, b, alpha = (arr[:, :, n] for n in range(4))
    if hero == "ice":
        mask = (r > g + 15) & (r > b + 10) & (g > 70) & (b > 60) & (alpha > 128)
        extra = 3
    else:
        mask = (r < 150) & (g < 105) & (b > g + 8) & (alpha > 128)
        extra = 10 if form == 3 else 2
    ys, _ = np.where(mask[:130, face_x - 45:face_x + 25])
    return [face_x, max(1, int(ys.min()) - extra) if len(ys) else 65]

def export_portrait(hero, form):
    folder = ROOT / f"assets/heroes/forms/{hero}/form-{form}"
    raw = Image.open(folder / "idle" / "raw-sheet-clean.png").convert("RGBA")
    cell_w, cell_h = raw.width // 2, raw.height // 4
    ratios = {
        ("ice", 2): (.27, .04, .75, .62),
        ("ice", 3): (.27, .04, .75, .62),
        ("lightning", 2): (.18, .01, .78, .64),
        ("lightning", 3): (.16, .02, .73, .65),
    }[(hero, form)]
    box = tuple(round(v * (cell_w if i % 2 == 0 else cell_h)) for i, v in enumerate(ratios))
    portrait = raw.crop(box)
    ImageOps.pad(portrait, (320, 400), method=Image.Resampling.LANCZOS,
                 color=(0, 0, 0, 0)).save(folder / "portrait.png")


def process(hero, form, action):
    folder = ROOT / f"assets/heroes/forms/{hero}/form-{form}"
    out = folder / action
    rows, cols = (4, 2) if action == "idle" else (2, 3)
    profile = folder / "character-scale-profile.json"
    original = folder / "source" / f"{action}-raw.png"
    source = original
    raw = Image.open(original).convert("RGB")
    cw, ch = raw.width // cols, raw.height // rows
    if (hero, form, action) == ("lightning", 2, "idle"):
        # Complete boot tips meet invisible raw slots. Add the same empty
        # padding to every cell without resizing or touching the illustration.
        padded = Image.new("RGB", (cols * 480, rows * 480), (255, 0, 255))
        for i in range(rows * cols):
            x0, y0 = round((i % cols) * raw.width / cols), round((i // cols) * raw.height / rows)
            x1, y1 = round((i % cols + 1) * raw.width / cols), round((i // cols + 1) * raw.height / rows)
            cell = raw.crop((x0, y0, x1, y1))
            padded.paste(cell, ((i % cols) * 480 + (480 - cell.width) // 2,
                                (i // cols) * 480 + (480 - cell.height) // 2))
        source = folder / "source" / "idle-padded-grid.png"
        padded.save(source)
        raw = padded
        cw = ch = 480
    recovery_shifts = {
        ("ice", 3, "cast"): {3: 16},
        ("lightning", 3, "attack"): {2: -24},
    }
    if (hero, form, action) in recovery_shifts:
        # Two complete poses cross invisible source slots into empty gutters.
        # Recover complete silhouettes with translation only, at identical scale.
        recovered = Image.new("RGB", raw.size, (255, 0, 255))
        shifts = recovery_shifts[(hero, form, action)]
        for i in range(rows * cols):
            x, y = (i % cols) * cw + shifts.get(i, 0), (i // cols) * ch
            recovered.paste(raw.crop((x, y, x + cw, y + ch)), ((i % cols) * cw, (i // cols) * ch))
        source = folder / "source" / f"{action}-recovered-grid.png"
        recovered.save(source)
        raw = recovered
    # A reviewed ImageGen result may have wider empty cell gutters. Remove only
    # those blank gutters; retain the untouched original alongside this source.
    if cw > ch * 1.05:
        normalized = Image.new("RGB", (cols * ch, rows * ch), (255, 0, 255))
        for i in range(rows * cols):
            offset = 0
            x, y = (i % cols) * cw + (cw - ch) // 2 + offset, (i // cols) * ch
            normalized.paste(raw.crop((x, y, x + ch, y + ch)), ((i % cols) * ch, (i // cols) * ch))
        source = folder / "source" / f"{action}-square-cells.png"
        normalized.save(source)
    cmd = [
        sys.executable, str(PROCESSOR), "process",
        "--input", str(source),
        "--target", "player", "--mode", action, "--output-dir", str(out),
        "--prompt-file", str(folder / "source" / (
            f"{action}-revision-prompt.txt" if (folder / "source" / f"{action}-revision-prompt.txt").exists()
            else f"{action}-prompt.txt")),
        "--rows", str(rows), "--cols", str(cols), "--cell-size", "256",
        "--fit-scale", "0.84", "--align", "center" if hero == "lightning" else "feet",
        "--scale-strategy", "preserve",
        "--component-mode", "largest", "--component-padding", "2", "--shared-scale",
        "--trim-border", "0", "--edge-clean-depth", "0",
        "--strict-qc", "--max-body-scale-cv", "0.08",
        "--max-anchor-y-std", "0.05", "--duration", "120",
    ]
    if action == "idle":
        cmd += ["--write-scale-profile", str(profile), "--profile-name", f"{hero}-form-{form}"]
    else:
        # Sovereign attack is an airborne tuck/lean; its core-area metric changes
        # more than anatomy or head scale. Reviewed height differs by under 8%.
        drift = "0.14" if (hero, form, action) == ("lightning", 3, "attack") else "0.12"
        cmd += ["--scale-profile", str(profile), "--max-profile-scale-drift", drift]
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        print(result.stdout[-1200:], result.stderr[-1200:])
        raise SystemExit(result.returncode)
    sheet = Image.open(out / "sheet-transparent.png").convert("RGBA")
    presentation_offsets = []
    for i in range(rows * cols):
        x, y = (i % cols) * 256, (i // cols) * 256
        frame = sheet.crop((x, y, x + 256, y + 256))
        # Translate the intact, fixed-scale frame to the common visible floor.
        bbox = frame.getbbox()
        dy = 241 - bbox[3]
        canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        canvas.alpha_composite(frame, (0, dy))
        frame = canvas
        final_bbox = frame.getbbox()
        assert min(final_bbox[:2]) > 1 and max(final_bbox[2:]) < 254
        presentation_offsets.append([0, dy])
        sheet.paste(frame, (x, y))
        frame.save(out / f"frame-{i:02}.png")
    if presentation_offsets:
        (out / "presentation-alignment.json").write_text(
            json.dumps({"mode": "visible-bottom-alignment", "bottomY": 241,
                        "offsets": presentation_offsets, "perFrameRescale": False}, indent=2) + "\n")
        sheet.save(out / "sheet-transparent.png")
    sheet.save(folder / f"{action}.webp", lossless=True, method=6)
    if action == "idle":
        first = Image.open(out / "frame-00.png").convert("RGBA")
        first.save(folder / "master.png")
        export_portrait(hero, form)
    update_manifest(hero, form)
    meta = json.loads((out / "pipeline-meta.json").read_text(encoding="utf-8"))
    print(json.dumps({"hero": hero, "form": form, "action": action, "qc": meta.get("qc_summary")}))


def update_manifest(hero, only_form=None):
    base = ROOT / f"assets/heroes/forms/{hero}"
    path = base / "forms.json"
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"hero": hero, "forms": {}}
    for form in (2, 3):
        if only_form is not None and form != only_form:
            continue
        folder = base / f"form-{form}"
        if not (folder / "master.png").exists():
            continue
        prefix = folder.relative_to(ROOT).as_posix()
        entry = data["forms"].setdefault(str(form), {})
        entry.update(name=NAMES[(hero, form)], poster=f"{prefix}/master.png", portrait=f"{prefix}/portrait.png")
        actions = entry.setdefault("actions", {})
        for action in ("idle", "attack", "cast", "run"):
            if not (folder / f"{action}.webp").exists():
                continue
            count = 8 if action == "idle" else 6
            actions[action] = {
                "file": f"{prefix}/{action}.webp", "cols": 2 if action == "idle" else 3,
                "rows": 4 if action == "idle" else 2, "count": count,
                "heads": [frame_head(hero, form, action, i, folder / action / f"frame-{i:02}.png")
                          for i in range(count)],
                "footY": 0.94, "frameDuration": 120 if action == "idle" else 100,
            }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("hero", choices=["ice", "lightning"])
    parser.add_argument("form", type=int, choices=[2, 3])
    parser.add_argument("action", choices=["idle", "attack", "cast", "run"])
    args = parser.parse_args()
    process(args.hero, args.form, args.action)
