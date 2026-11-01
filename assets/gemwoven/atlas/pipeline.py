"""World atlas art (Khám Phá): one floating region island per chapter, packed for the hub's world map.

Usage: python pipeline.py gen <chapter-id ...|all> [model] [effort]   generate raw-<id>.png (Codex image_gen)
       python pipeline.py proc <chapter-id ...|all>                    key out the magenta, write <id>.webp
       (unknown.webp, the unexplored island with a "?" (prompt-unknown.txt): python -c "import pipeline;pipeline.proc('unknown')")
       python pipeline.py sea                                           tile the cloud sea (sea.webp)
       python pipeline.py manifest                                      write assets/gemwoven/atlas-items.json (hub assets)
Raw sheets and prompts stay beside the packed islands (raw-<id>.png, prompt-<id>.txt).
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

ROOT = Path("D:/Project/Gemwoven")
HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
MAPS = ROOT / "assets/gemwoven/backgrounds/chapters"
SCRATCH = ROOT / ".build-cache/atlas"

# chapter id -> (style reference map theme, what the region is)
REGIONS = {
    "forest": ("forest", "an ancient emerald forest: giant old trees, a small golden tree shrine, mossy stone ruins, pink blossom trees, a river and small waterfalls"),
    "volcano": ("volcano", "a volcanic land: red-orange erupting volcano peaks with glowing lava rivers, black basalt cliffs, red autumn trees"),
    "ice": ("ice", "moonlit ice ruins: snowy white peaks, frozen lake, broken pale marble ruins with a crescent moon gate, ice crystals"),
    "thunder": ("thunder", "a sky city of storms: tall stone spires with copper lightning rods, dark storm clouds over terraces, purple-gold banners"),
    "marsh": ("marsh", "a spore swamp: green bog pools, giant spotted mushrooms, twisted mangroves, glowing spores"),
    "desert": ("desert", "a golden desert sanctuary: sand dunes, a sandstone temple with gold scarab pillars, an oasis with palms"),
    "abyss": ("abyss", "a coral sea abyss: turquoise lagoons, pink and orange coral reefs rising out of the water, shell domes, sea arches"),
    "foundry": ("foundry", "a mechanical foundry: brass gear towers, smoking chimneys, bronze pipes, a molten metal channel"),
    "crystal": ("crystal", "a crystal cavern land: huge violet and cyan crystal clusters, a cave mouth, prismatic rocks"),
    "haunted": ("haunted", "a moonlit graveyard: purple fog, dead twisted trees, gothic chapel, tombstones, pale moon light"),
    "sky": ("sky", "a sky wind fortress: white stone towers with blue roofs on cliffs, windmills, flags, eagle nests, swirling wind"),
    "thorns": ("thorns", "a cursed thorn garden: dark red rose bushes, giant black thorn vines, a ruined rose palace"),
    "celestial": ("celestial", "a sun celestial palace: white and gold temple with domes, sunlit terraces, golden statues of winged guardians"),
    "void": ("void", "an eclipse void land: dark violet rocks floating apart, a black-sun eclipse altar, star dust, cosmic cracks"),
    "eldergrove": ("forest", "a white blossom holy forest: silver birch trees with white and pale pink blossoms, a white tree sanctuary, petals"),
    "caldera": ("volcano", "a magma heart caldera: a huge lava crater with an obsidian throne, black obsidian spikes, rivers of bright magma"),
    "glacier": ("ice", "a glacier ice palace: a tall pale-blue ice crystal palace with spires, frozen waterfalls, snow"),
    "stormspire": ("thunder", "a storm tower plateau: a tall bronze lightning tower struck by blue lightning, dark clouds, feathers in the wind"),
    "soulcrypt": ("haunted", "a lantern soul crypt: a dark iron prison crypt with chains and many green ghost lanterns, green spirit fog"),
    "mycelium": ("marsh", "a plague mushroom forest: towering pale mushrooms with green glowing gills, sickly green spores, rotting logs"),
    "geode": ("crystal", "a crystal fortress on the back of a giant stone turtle: a castle of blue crystals built on a huge turtle shell"),
    "hourglass": ("desert", "a time sand palace: a golden sand palace with a giant hourglass tower, floating clock rings, sand falls"),
    "coralreef": ("abyss", "a sea dragon coral palace: a pearl and coral palace in a blue lagoon, giant pearls, jade dragon statues"),
    "moonkeep": ("haunted", "a purple moon citadel: a dark gothic fortress under a huge blood-purple moon, wolf statues, crimson banners"),
}

PROMPT = """Image 1 is only a STYLE reference (palette, rendering, materials, lighting) from this game's chapter map art. Do not copy its layout.

Asset: ONE floating island REGION for a fantasy RPG WORLD ATLAS map, seen from a high three-quarter top-down camera like a small diorama of a country. Region: {what}.
Shape: one broad, roughly round-to-oval landmass about 86% of the canvas wide and about 62% of the canvas tall, its flat top surface covered with the region's terrain, rivers, small buildings and landmarks drawn small and dense like a map (landmarks never taller than 25% of the canvas), a thick rocky underside with hanging roots and two or three small waterfalls falling off its rim, a few wisps of white cloud hugging its lower rim. The island fills the canvas centrally.
Style: premium hand-painted chibi high fantasy mobile game art, crisp charming rounded shapes, rich saturated colours, soft warm light, clean HD painting like Image 1. NOT pixel art.
Containment: everything (island, waterfalls, clouds) stays fully inside the canvas with at least 5% empty margin on every side.
Background 100% solid flat #FF00FF magenta, no gradient, no sky, no sea, no ground plane, no shadow. Never use magenta or hot pink inside the island.
NO text, NO letters, NO numbers, NO labels, NO UI, NO frames, NO characters, NO monsters, NO icons."""


def gen(cid, model="gpt-6.1-sol", effort="low"):
    ref, what = REGIONS[cid]
    (HERE / f"prompt-{cid}.txt").write_text(PROMPT.format(what=what) + "\n", encoding="utf-8")
    r = subprocess.run([sys.executable, GEN, "--prompt-file", str(HERE / f"prompt-{cid}.txt"), "--out", str(HERE / f"raw-{cid}.png"),
                        "--ref", str(MAPS / f"{ref}.webp"), "--model", model, "--effort", effort, "--timeout", "900"],
                       capture_output=True, text=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return cid, r.returncode, r.stderr[-300:]


def despill(im):
    """The key's magenta fringe on the island's rim (cloud wisps): near the edge, pull red and blue down to green."""
    import numpy as np
    from scipy import ndimage
    a = np.asarray(im).astype(np.float32)
    edge = ndimage.binary_dilation(a[..., 3] < 250, iterations=14) & (a[..., 3] > 0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    # Pink-violet on the rim is key light caught in white cloud: it goes back to the cloud's white-grey.
    fix = edge & (spill > 4) & (r - g > 8) & (b - g > 8)
    grey = (r + g + b) / 3
    a[..., 0] = np.where(fix, np.minimum(r, grey + 4), r)
    a[..., 1] = np.where(fix, np.maximum(g, grey + 2), g)
    a[..., 2] = np.where(fix, np.minimum(b, grey + 8), b)
    a[..., 3] = np.where(fix & (a[..., 3] < 200), a[..., 3] * .6, a[..., 3])
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def proc(cid):
    out = SCRATCH / cid
    subprocess.run([sys.executable, PROC, "process", "--input", str(HERE / f"raw-{cid}.png"), "--target", "asset", "--mode", "single",
                    "--output-dir", str(out), "--rows", "1", "--cols", "1", "--cell-size", "768", "--fit-scale", "0.96",
                    "--align", "center", "--component-mode", "all"], check=True, capture_output=True)
    im = despill(Image.open(out / "sheet-transparent.png").convert("RGBA"))
    im = im.crop(im.getbbox())
    im.save(HERE / f"{cid}.webp", "WEBP", quality=90, method=6)
    return cid, im.size


def sea():
    """The cloud sea tiles both ways: its first 200 rows (columns) are cross-faded with its last 200 and the last
    200 dropped, so the tile's last row leads straight into its first."""
    import numpy as np
    a = np.asarray(Image.open(HERE / "raw-sea.png").convert("RGB")).astype(np.float32)
    k = 200
    for axis in (0, 1):
        b = np.moveaxis(a, axis, 0).copy(); n = b.shape[0]; w = np.linspace(0, 1, k)[:, None, None]
        b[:k] = b[:k] * w + b[n - k:] * (1 - w); a = np.moveaxis(b[:n - k], 0, axis)
    Image.fromarray(a.clip(0, 255).astype("uint8")).save(HERE / "sea.webp", "WEBP", quality=88, method=6)


def manifest():
    """Hub asset entries: atlas-<chapter id> islands, the cloud sea (atlas-sea) and the stage pedestals."""
    items = {}
    names = {f"atlas-{c}": f"{c}.webp" for c in REGIONS} | {"atlas-sea": "sea.webp", "atlas-unknown": "unknown.webp"} | {f"pedestal-{k}": f"pedestal-{k}.webp" for k in ("normal", "elite", "boss")} | {"atlas-bridge": "bridge.webp"} | {k: f"ui/{k}.webp" for k in ("node-normal","node-elite","node-boss","node-cleared","node-next","node-locked","ui-ribbon","ui-header","ui-slot","ui-slot-on","ui-row","ui-socket")} | {f"{p}-{k}": f"ui/{p}-{k}.webp" for p in ("ring", "plaque") for k in ("normal", "elite", "boss", "cleared", "next", "locked")} | {f"face-{h}": f"ui/face-{h}.webp" for h in ("novice", "fire", "ice", "earth", "lightning", "shadow")} | {f"btn-{k}": f"ui/btn-{k}.webp" for k in ("primary", "secondary")} | {k: f"ui/{k}.webp" for k in ("reward-star", "icon-battle", "water-flow")}
    for key, name in names.items():
        with Image.open(HERE / name) as im:
            items[key] = {"file": f"atlas/{name}", "width": im.width, "height": im.height, "textless": True, "transparent": key != "atlas-sea"}
    out = {"version": 1, "purpose": "Khám Phá world atlas (one floating region island per chapter) and stage pedestals", "items": items}
    (ROOT / "assets/gemwoven/atlas-items.json").write_text(json.dumps(out, indent=1) + chr(10), encoding="utf-8")
    return len(items)


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    if cmd == "sea":
        sea();sys.exit()
    if cmd == "manifest":
        print(manifest(), "items");sys.exit()
    ids = list(REGIONS) if rest[:1] == ["all"] else [r for r in rest if r in REGIONS]
    extra = [r for r in rest if r not in REGIONS and r != "all"]
    SCRATCH.mkdir(parents=True, exist_ok=True)
    if cmd == "gen":
        with ThreadPoolExecutor(4) as ex:
            for res in ex.map(lambda c: gen(c, *extra), ids):
                print(res, flush=True)
    else:
        for c in ids:
            print(proc(c), flush=True)
