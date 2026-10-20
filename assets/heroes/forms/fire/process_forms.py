"""Reproduce Mika/Nori form sprite processing from preserved ImageGen sources."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SKILL = Path.home() / ".codex/skills/generate2dsprite/scripts"

def process(hero, form, action, source):
    base = ROOT / "assets/heroes/forms" / hero / f"form-{form}"
    dest = base / action
    dest.mkdir(parents=True, exist_ok=True)
    raw = dest / "raw-original.png"
    if source and Path(source).resolve() != raw.resolve():
        shutil.copy2(source, raw)
    rows, cols = (4, 2) if action == "idle" else (2, 3)
    # Equal square source cells maintain a shared raw-cell coordinate system.
    im = Image.open(raw).convert("RGBA")
    cell_w, cell_h = im.width / cols, im.height / rows
    if abs(cell_w / cell_h - 1) > .01:
        # ImageGen can return a different canvas aspect. Preserve anatomy by
        # extracting its true cells, then use one uniform scale for the sheet.
        sys.path.insert(0, str(SKILL))
        from generate2dsprite import remove_bg_magenta
        import numpy as np
        clean = remove_bg_magenta(im, 100, 150)
        alpha = np.asarray(clean.getchannel("A")) > 10
        def separators(count, span, projection):
            cuts = [0]
            for index in range(1,count):
                expected = round(index*span/count)
                radius = round(span/count*.06)
                candidates = range(max(1,expected-radius),min(span-1,expected+radius)+1)
                cuts.append(min(candidates,key=lambda p:(projection[p],abs(p-expected))))
            return cuts + [span]
        xs = separators(cols,clean.width,alpha.sum(axis=0))
        ys = separators(rows,clean.height,alpha.sum(axis=1))
        subjects = []
        for row in range(rows):
            for col in range(cols):
                cell = clean.crop((xs[col],ys[row],xs[col+1],ys[row+1]))
                subjects.append(cell.crop(cell.getbbox()))
        shared = 480 / max(max(s.width,s.height) for s in subjects)
        im = Image.new("RGBA",(cols*512,rows*512),(0,0,0,0))
        for i, subject in enumerate(subjects):
            subject = subject.resize((round(subject.width*shared),round(subject.height*shared)),
                                     Image.Resampling.LANCZOS)
            im.alpha_composite(subject,((i%cols)*512+(512-subject.width)//2,
                                      (i//cols)*512+496-subject.height))
    elif im.size != (cols*512, rows*512):
        im = im.resize((cols*512, rows*512), Image.Resampling.LANCZOS)
    normalized = dest / "normalized-source.png"
    im.save(normalized)
    profile = base / "character-scale-profile.json"
    cmd = [sys.executable, str(SKILL / "generate2dsprite.py"), "process",
        "--input", str(normalized), "--target", "player", "--mode", action,
        "--output-dir", str(dest), "--rows", str(rows), "--cols", str(cols),
        "--cell-size", "256", "--fit-scale", "0.80", "--align", "feet",
        "--scale-strategy", "preserve", "--component-mode", "largest",
        "--shared-scale", "--trim-border", "0", "--edge-clean-depth", "0",
        "--strict-qc", "--max-body-scale-cv", "0.08", "--max-anchor-y-std", "0.05",
        "--max-profile-scale-drift", "0.08", "--duration", "120" if action == "idle" else "100",
        "--prompt-file", str(dest / "prompt-used.txt")]
    if action == "idle":
        cmd += ["--write-scale-profile", str(profile), "--profile-name", f"{hero}-form-{form}"]
    else:
        cmd += ["--scale-profile", str(profile)]
    subprocess.run(cmd, check=True)
    for i in range(rows*cols):
        shutil.copy2(dest / f"{action}-{i+1}.png", dest / f"frame-{i:02}.png")
    Image.open(dest / "sheet-transparent.png").save(base / f"{action}.webp", lossless=True)
    if action == "idle":
        master = Image.open(dest / "frame-00.png")
        master.save(base / "master.png")
        master.crop((48, 40, 208, 200)).resize((256,256), Image.Resampling.LANCZOS).save(base / "portrait.png")
    meta = json.loads((dest / "pipeline-meta.json").read_text())
    print(json.dumps({"hero":hero,"form":form,"action":action,"qc":meta["qc_summary"]}, indent=2))

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("hero")
    p.add_argument("form", type=int)
    p.add_argument("action")
    p.add_argument("source", nargs="?")
    a = p.parse_args()
    process(a.hero, a.form, a.action, a.source)
