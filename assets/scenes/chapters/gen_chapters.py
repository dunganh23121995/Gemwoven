"""Combat scenery for every chapter (24), in the same three-panel layer sheet as assets/scenes/painted.

Each sheet is drawn by Codex (built-in image_gen) as three separate parallax layers stacked in 1024x512 panels:
layer 3 (top, farthest: sky and distant landmarks), layer 2 (middle, mid-distance scenery on magenta) and layer 1
(bottom, nearest: the stage floor with framing objects at its two ends, on magenta). References: the chapter's
first combat scenery (source/<id>/card-v1.webp, its world and palette), its atlas island and its map painting.
Usage: python gen_chapters.py [chapter-id ...] [--model M --effort E]   -> source/<id>/raw-sheet.png + prompt.txt
Then: python export_chapters.py
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "assets/gemwoven/atlas"))
from pipeline import REGIONS  # chapter id -> (map painting theme, what the region is)

GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROMPT = """Image 1 is this chapter's combat scenery (one composed picture): keep its world, palette, materials and art style. Image 2 shows the chapter's region (its identity) and Image 3 its map painting (rendering).
Chapter region: {what}.
Redraw this combat scenery as THREE SEPARATE PARALLAX LAYERS for a side-view RPG battle (two fighters stand on the stage floor, left and right; when a fighter leaves, the camera pans sideways and each layer slides at its own speed to show depth).
Canvas 1024x1536: exactly three equally sized wide panels stacked vertically, each 1024x512, all with the same camera, horizon at about 55% of a panel and the same lighting, each panel seamless left to right.
DEPTH BY AIR: the farther a layer, the SOFTER, SIMPLER, PALER and LESS CONTRASTED it is (aerial perspective, like a painted theatre backdrop). Only layer 1 has crisp detail.
TOP panel = LAYER 3, the FARTHEST: a calm sky with soft clouds and only a few LARGE, SIMPLE, PALE silhouettes of the region's most distant landmarks and mountains, melting into a light haze near the horizon: soft edges, almost no inner detail, low contrast, colours shifted toward the sky colour. Fully painted to all four edges (no magenta), no floor, no near objects, nothing busy.
MIDDLE panel = LAYER 2, a little NEARER: mid-distance scenery of this region (groves, ruins, cliffs, waterfalls, crystals, machines... as fits) painted SIMPLY in a few big shapes with soft edges and only light detail, a little hazy and paler than layer 1 (clearer than layer 3), spread across the whole width, standing on its own ground that reaches down to the panel's bottom edge, its top silhouette varied; everything above that silhouette perfectly flat solid #FF00FF magenta; no sky, no fighting floor. Not busy: no tiny leaves, no fine patterns.
BOTTOM panel = LAYER 1, the NEAREST: the STAGE: a broad flat fighting floor of this region's material (paving, stone, crystal, sand, metal...) filling the bottom 34% of the panel across the full width with its front edge showing, plus a few large framing objects standing ON the stage at its far LEFT and far RIGHT ends only (trees, rocks, pillars, statues, crystals, lanterns... fitting the region), each within the outer 16% of the width and at most 80% of the panel's height; the middle part above the floor stays perfectly flat solid #FF00FF magenta (the fighters stand there).
Never use magenta or hot pink inside the scenery. Premium hand-painted chibi high-fantasy mobile RPG art like Image 1, clean HD, NOT pixel art. No characters, monsters, text, labels, borders or UI."""


# Each chapter fights in three places that its stages take in turn (its base scene, then variants "b" and "c"),
# and its boss in a lair of its own ("boss"). A variant id is "<chapter>-<variant>"; its world reference is the
# chapter's exported base scene (<chapter>-card.webp).
VARIANTS = {
    "b": "a DIFFERENT PLACE of the same region at SUNSET (warm orange-pink light, long shadows): layer 2 is a wide calm lake or river of the region's liquid with waterfalls falling into it and the region's plants on its banks; the stage is a jetty-like terrace at the water's edge; its framing objects are NEW ones (e.g. big boulders, reeds, a moored boat, a fallen log, a fountain... fitting the region), NOT the arches, trees or pillars of Image 1.",
    "c": "a DIFFERENT PLACE of the same region at a MISTY DAWN (cool pale light, soft mist low in the valleys): high up on a cliff-top plateau, layer 2 is a deep valley seen from above with rolling hills and the region's distant buildings; the stage is a cliff-edge platform; its framing objects are NEW ones (e.g. a wind-bent tree, a signpost, a stone shrine, standing stones, a tent or banner... fitting the region), NOT the arches, trees or pillars of Image 1.",
    "boss": "THE LAIR OF THE CHAPTER BOSS, {boss}, under a DARK STORMY sky in deep crimson and the region's darkest hues: layer 2 is one HUGE ominous landmark of the boss in the centre (its throne, nest, temple, gate or colossal statue, much bigger than anything in Image 1) with smaller ruined shapes around it; the stage is a grand circular arena floor with a carved sigil; its framing objects are NEW ones: tall braziers with fire, broken giant statues, chains, bones or relics fitting the boss. The mood is menacing and epic, clearly unlike Image 1.",
}
BOSSES = json.loads((HERE / "bosses.json").read_text(encoding="utf-8"))


def gen(cid, model="gpt-6.1-sol", effort="low"):
    base, _, variant = cid.partition("-")
    theme, what = REGIONS[base]
    out = HERE / "source" / cid
    out.mkdir(parents=True, exist_ok=True)
    text = PROMPT.format(what=what)
    if variant:
        # Image 1 is then only the chapter's style: the scene, its layout, light and framing objects are new.
        text = text.replace("keep its world, palette, materials and art style.", "use it ONLY for the region's materials and the art style; do NOT reuse its layout, landmarks, lighting or framing objects.")
        text = text.replace("Redraw this combat scenery as", "THIS SCENE: " + VARIANTS[variant].format(boss=BOSSES[base]) + "\nDraw it as")
    # Scenes in crimson and violet melt into a magenta key: they are drawn on green (a "green" marker tells the export).
    if (out / "green").exists():
        text = text.replace("#FF00FF magenta", "#00FF00 green").replace("magenta", "green").replace("Never use green or hot pink", "Never use bright green")
    (out / "prompt.txt").write_text(text + "\n", encoding="utf-8")
    world = HERE / f"{base}-card.webp" if variant else out / "card-v1.webp"
    refs = [world, ROOT / f"assets/gemwoven/atlas/{base}.webp", ROOT / f"assets/gemwoven/backgrounds/chapters/{theme}.webp"]
    cmd = [sys.executable, GEN, "--prompt-file", str(out / "prompt.txt"), "--out", str(out / "raw-sheet.png"),
           "--model", model, "--effort", effort, "--timeout", "900"]
    for r in refs:
        cmd += ["--ref", str(r)]
    r = subprocess.run(cmd, capture_output=True, text=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return cid, r.returncode, r.stderr[-200:]


if __name__ == "__main__":
    args = sys.argv[1:]
    model = args[args.index("--model") + 1] if "--model" in args else "gpt-6.1-sol"
    effort = args[args.index("--effort") + 1] if "--effort" in args else "low"
    ids = [a for a in args if a.partition("-")[0] in REGIONS]
    if "--variants" in args:
        ids = [f"{c}-{v}" for c in REGIONS for v in VARIANTS]
    ids = ids or list(REGIONS)
    with ThreadPoolExecutor(4) as ex:
        for res in ex.map(lambda c: gen(c, model, effort), ids):
            print(res, flush=True)
