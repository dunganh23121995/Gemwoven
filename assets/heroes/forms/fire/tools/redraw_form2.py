"""Mika form 2: redraw the combat action sheets with the combat idle as the standard.

Each sheet keeps the action brief it was first drawn with (form-2/<action>/prompt-used.txt); only
the character paragraph is replaced. Image 1 is the full-size approved drawing the combat idle is
made from (form-2/source/raw-master-v2.png, keyed onto magenta), so Codex sees her real proportions
and face sharply (the 256 px master it saw before was soft, and the old paragraph asked for a big head
and short legs, so every action was drawn chibier than the idle). Image 2 is a scale-and-root
template of that drawing (make_anchor_layout.py). "swing" is the ultimate's dip and backswing.

  python assets/heroes/forms/fire/tools/redraw_form2.py gen <action> [model effort]
      -> .build-cache/redo/m2-<action>/{prompt.txt,anchor.png,raw.png}
  python assets/heroes/forms/fire/tools/redraw_form2.py accept <action>
      -> form-2/<action>/{raw-original.png,prompt-used.txt,anchor.png} (then process_skill.py)
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[5]
FORM = ROOT / "assets/heroes/forms/fire/form-2"
WORK = ROOT / ".build-cache/redo"
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
# rows, cols, share of the cell the standing body fills (room above for raised swings)
LAYOUT = {"attack": (2, 3, .62), "cast": (2, 3, .62), "run": (2, 3, .62), "skill": (2, 3, .5), "swing": (2, 3, .5)}
IDENTITY = ("Image 1 is the exact character identity, art and SIZE reference: Mika, stage-two form, a young orange-haired fox girl swordswoman "
            "in clean HD smooth painted game art (NOT pixel art), shown in her combat resting pose. Draw the SAME girl with EXACTLY the proportions of Image 1 "
            "in every frame: her head (ear tips to chin) is about 30% of her full standing height, her eyes sit at about 77% of her height above her soles, and "
            "her torso, legs and boots are exactly as long and as big as in Image 1. Never draw her head bigger, her body or legs shorter, or her chibier or "
            "stockier than Image 1; a crouch only bends her knees. With her arms raised overhead her head stays exactly the size it is in Image 1 "
            "(measure it against her breastplate and boots), and her body keeps its full height. Her face is the face of Image 1 (same eyes, same size, same shape), acting only the "
            "expression each frame asks for. Keep her exactly: amber eyes, long red-orange hair with ONE long braid, two big pointed orange fox ears with "
            "cream inner fur, a red ribbon and a gold flower ornament in her hair, a red scarf at the neck, black plate armour with gold trim and red accents "
            "(pauldrons, breastplate, gauntlets, knee guards), two long red cape tails with gold flame patterns behind her shoulders, a red tabard skirt with "
            "a gold flame crest, black and gold armoured boots, and ONE AND ONLY ONE big fluffy cream-tipped orange fox tail. Her weapon is EXACTLY the big "
            "broad greatsword of Image 1 in every frame: a wide straight silver blade with a gold crossguard set with a red jewel, the same length and width "
            "in every frame (only shortened by perspective, never thinner, never a different sword). No crown, no extra tails, no new armour pieces. "
            "Paint crisp clean lines and a sharp face: the sheet is shown large.")


def identity(path):
    """The approved full-size drawing, keyed and centred on magenta at 1024 px."""
    sys.path.insert(0, str(Path.home() / ".codex/skills/generate2dsprite/scripts"))
    from generate2dsprite import remove_bg_magenta
    clean = remove_bg_magenta(Image.open(FORM / "source/raw-master-v2.png").convert("RGBA"), 100, 150)
    clean = clean.crop(clean.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    side = round(max(clean.size) * 1.12)
    ref = Image.new("RGBA", (side, side), (255, 0, 255, 255))
    ref.alpha_composite(clean, ((side - clean.width) // 2, round(side * .94) - clean.height))
    ref.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(path)


def gen(action, model="gpt-6.1-sol", effort="low"):
    rows, cols, body = LAYOUT[action]
    work = WORK / f"m2-{action}"; work.mkdir(parents=True, exist_ok=True)
    identity(work / "identity.png")
    subprocess.run([sys.executable, ANCHOR, "--input", str(work / "identity.png"), "--rows", str(rows), "--cols", str(cols),
                    "--cell-width", "512", "--cell-height", "512", "--subject-height-ratio", str(body), "--feet-ratio", ".94",
                    "--output", str(work / "anchor.png")], check=True, capture_output=True)
    old = (FORM / action / "prompt-used.txt").read_text(encoding="utf-8").split("\n")
    lines = [IDENTITY if l.startswith("Image 1 is the exact character identity") else l for l in old]
    (work / "prompt.txt").write_text("\n".join(lines), encoding="utf-8")
    subprocess.run([sys.executable, GEN, "--prompt-file", str(work / "prompt.txt"), "--out", str(work / "raw.png"),
                    "--ref", str(work / "identity.png"), "--ref", str(work / "anchor.png"),
                    "--model", model, "--effort", effort, "--timeout", "900"], check=True)


def accept(action):
    work = WORK / f"m2-{action}"
    shutil.copy2(work / "raw.png", FORM / action / "raw-original.png")
    shutil.copy2(work / "prompt.txt", FORM / action / "prompt-used.txt")
    shutil.copy2(work / "anchor.png", FORM / action / "anchor.png")
    print("accepted", action)


if __name__ == "__main__":
    {"gen": gen, "accept": accept}[sys.argv[1]](*sys.argv[2:])
