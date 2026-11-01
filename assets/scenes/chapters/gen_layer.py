"""Redraw ONE layer of a chapter combat scenery sheet in its own Codex session, when the three-panel sheet keeps
coming back wrong in that panel (the middle panel painted with its own sky, even up the model ladder).

The layer is asked for alone: one wide picture of the mid-distance scenery on the sheet's key colour, with the
rest of the sheet as the reference for its world, light and palette. It replaces that panel of raw-sheet.png (the
sheet as first drawn is kept as raw-sheet-full.png) and the "opaque-mid" marker goes.

Usage: python gen_layer.py <scene-id ...> [--model M --effort E]   (the middle layer)
       python gen_layer.py <scene-id ...|all> --stage [--model M --effort E]   (the stage, kept as raw-stage.png)
Then: python export_chapters.py
"""
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROMPT = """Image 1 is a combat scenery sheet of this game: three stacked panels (top: the far sky; middle: the mid-distance scenery; bottom: the stage). Its MIDDLE panel is wrong: it was painted with a sky. Redraw ONLY that middle layer.
Draw ONE wide landscape picture, twice as wide as it is tall: the MID-DISTANCE scenery of Image 1's middle panel (the same place, landmarks, water, light and palette), standing on its own ground that reaches the picture's bottom edge across the full width, its top silhouette varied, painted simply in a few big soft shapes, a little hazy (it sits between the far sky and the near stage).
Everything above the scenery's silhouette is pure flat {key}, untinted, from the silhouette to the top edge: NO sky, NO clouds, NO sun, NO moon, NO light rays, NO glow, NO gradient in that area. The light colours the scenery only.
Never use {never} inside the scenery. Premium hand-painted chibi high-fantasy mobile RPG art matching Image 1, clean HD, NOT pixel art. No characters, text, borders or UI."""


STAGE = """Image 1 is a combat scenery sheet of this game: three stacked panels; its BOTTOM panel is the stage, drawn too small and soft. Redraw ONLY that stage, far sharper and richer: it is the NEAREST layer of the battle, the crispest thing on screen, right behind the fighters.
Draw ONE wide landscape picture, twice as wide as it is tall, in the same place, materials, palette and light as Image 1's bottom panel, with the same kinds of framing objects at its far left and far right ends:
- The FLOOR fills the bottom 34% of the picture across the full width, seen from a low side camera: clearly drawn individual paving stones (or planks, tiles, plates of the region's material), each with a crisp dark outline, deep dark joints between them, a bright lit top face and shaded edges, visible texture and strong contrast; its back edge is a clean straight line, its front edge a solid thick stone (or matching) ledge with clear carved detail. Never pale, washed out, blurry or watercolour.
- The framing objects stand ON the floor at its two ends only, each within the outer 16% of the width, at most 80% of the picture's height: bold, solid, crisply outlined and fully detailed, with strong light and shadow.
- Everything else above the floor is pure flat {key}, untinted, from the floor's back edge to the top edge: NO sky, NO scenery, NO glow, NO gradient in that area. Fighters will stand in the empty middle.
Never use {never} in the stage. Premium hand-painted chibi high-fantasy mobile RPG art at maximum sharpness: clean bold dark outlines, saturated colours, high contrast, HD, NOT pixel art, NOT soft. No characters, text, borders or UI."""


def gen_stage(cid, model, effort):
    """The stage alone, kept at its own size as raw-stage.png (the export prefers it to the sheet's bottom panel)."""
    d = HERE / "source" / cid
    green = (d / "green").exists()
    key, never = ("#00FF00 green", "bright green") if green else ("#FF00FF magenta", "magenta or hot pink")
    (d / "prompt-stage.txt").write_text(STAGE.format(key=key, never=never) + "\n", encoding="utf-8")
    r = subprocess.run([sys.executable, GEN, "--prompt-file", str(d / "prompt-stage.txt"), "--out", str(d / "raw-stage.png"), "--ref", str(d / "raw-sheet.png"),
                        "--model", model, "--effort", effort, "--timeout", "900"],
                       capture_output=True, text=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return cid, r.returncode, r.stderr[-200:]


def gen(cid, model, effort):
    d = HERE / "source" / cid
    green = (d / "green").exists()
    key, never = ("#00FF00 green", "bright green") if green else ("#FF00FF magenta", "magenta or hot pink")
    full = d / "raw-sheet-full.png"
    if not full.exists():
        Image.open(d / "raw-sheet.png").save(full)
    (d / "prompt-mid.txt").write_text(PROMPT.format(key=key, never=never) + "\n", encoding="utf-8")
    out = d / "raw-mid.png"
    r = subprocess.run([sys.executable, GEN, "--prompt-file", str(d / "prompt-mid.txt"), "--out", str(out), "--ref", str(full),
                        "--model", model, "--effort", effort, "--timeout", "900"],
                       capture_output=True, text=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    if r.returncode:
        return cid, r.returncode, r.stderr[-200:]
    # The picture's bottom 2:1 band (its ground reaches the bottom edge) becomes the sheet's middle panel.
    mid = Image.open(out).convert("RGB")
    band = mid.crop((0, max(0, mid.height - mid.width // 2), mid.width, mid.height)).resize((1024, 512), Image.Resampling.LANCZOS)
    sheet = Image.open(full).convert("RGB").resize((1024, 1536), Image.Resampling.LANCZOS)
    sheet.paste(band, (0, 512))
    sheet.save(d / "raw-sheet.png")
    (d / "opaque-mid").unlink(missing_ok=True)
    return cid, 0, ""


if __name__ == "__main__":
    args = sys.argv[1:]
    model = args[args.index("--model") + 1] if "--model" in args else "gpt-6.1-sol"
    effort = args[args.index("--effort") + 1] if "--effort" in args else "low"
    ids = [a for a in args if (HERE / "source" / a).is_dir()]
    if "all" in args:
        ids = sorted(p.name for p in (HERE / "source").iterdir() if not (p / "raw-stage.png").exists())
    with ThreadPoolExecutor(4) as ex:
        for res in ex.map(lambda c: (gen_stage if "--stage" in args else gen)(c, model, effort), ids):
            print(res, flush=True)
