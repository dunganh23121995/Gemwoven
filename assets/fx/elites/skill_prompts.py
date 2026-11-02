"""Each elite's own skill art: one sheet for the skill it fights with like a boss (src/foe-skills.js ELITE_LOOKS), and a
projectile for those who shoot. Nothing is shared with a chapter boss's kit (assets/fx/bosses/skill_prompts.py): the
staging is the boss's, the art is the elite's.

Sheets are six frames, a 3x2 grid of 512px cells on magenta, packed into 256px horizontal strips:
  burst   a one-shot effect centred in the cell       slash   marks across the cell, centred
  beam    a horizontal band across the cell           streak  a long stab, its narrow end at the right edge
  ground  grows up from a ground line                 pillar  a shaft from the top of the cell down to that line
  bolt    a projectile pointing LEFT, looping         mote    a small piece, looping (spirals, chains)
  spin    one object, seen flat, in all six frames (it is thrown and spun by the staging)

  python skill_prompts.py prompts                     write prompt.txt beside each raw
  python skill_prompts.py batch [--workers N] [--only id,id] [--model m] [--effort e]   draw what is missing, hidden
  python skill_prompts.py gen <id> <fx> [model] [effort]
  python skill_prompts.py export [id ...]             pack raws (all, or just these), measure each ground line, write fx.json
  python skill_prompts.py contact [id ...]            review sheet on a dark ground
"""
import json
import subprocess
import sys
import threading
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
LAYOUT = ROOT / "assets/fx/bosses/earth/skills/layout-3x2.png"
SCRATCH = ROOT / ".build-cache/elite-fx"
DEFAULT = ("gpt-6.1-sol", "low")
NO_WINDOW = 0x08000000
CELL, COUNT = 256, 6

# Each chapter's elites share a palette kept apart from the boss's own kit and from the gold-and-emerald signature burst.
PALETTES = {
    "forest": "LIVING BARK AND LEAF: dark wet bark, fresh bright leaf green, cream splinters, rich brown soil",
    "volcano": "BRIGHT FLAME: bright orange and yellow flame tongues with deep red shadows, small charred flecks",
    "ice": "PALE ICE: pale blue ice crystals, white snow, deep cobalt shadows, silver glints",
    "thunder": "WHITE-YELLOW SPARK: brilliant white and lemon-yellow electric arcs with dark indigo outlines",
    "marsh": "BOG AND TOXIN: dark olive mud, sickly lime-green toxin bubbles, dull brown reeds",
    "desert": "SUN AND SAND: warm amber sand, white-hot sun flares, teal scarab-shell glints",
    "abyss": "REEF AND TIDE: teal sea water, white foam, red-orange coral chips",
    "foundry": "BRASS AND STEAM: polished brass, copper, solid white steam puffs, orange sparks",
    "crystal": "CUT GEM: faceted blue and cyan gem shards with white highlights",
    "haunted": "GHOST LANTERN: cold blue-green ghost flame, dark iron, bone grey",
    "sky": "WIND AND CLOUD: solid white cloud puffs, sky-blue wind streaks, white feathers",
    "thorns": "ROSE THORN: deep crimson rose petals, dark green thorned vines",
    "celestial": "DAWN LIGHT: warm white and soft yellow light, cream light-feathers",
    "void": "STARRY VOID: black-indigo void, tiny white stars, thin deep-blue rims",
    "eldergrove": "BIRCH AND BLOSSOM: pale birch white, cream, peach-white petals, light green",
    "caldera": "BASALT AND LAVA: black basalt, glowing orange lava seams, yellow-hot cores",
    "glacier": "GLACIER: thick solid blue-white ice blocks, white snow, steel-blue shadows",
    "stormspire": "GOLD THUNDER: golden yellow lightning, deep navy shadows, white cores",
    "soulcrypt": "SOUL IRON: dark iron chain, deep violet soul fire",
    "mycelium": "ROT AND SPORE: rust-red caps, cream spots, pale fungal threads, sick yellow-green",
    "geode": "STONE AND CRYSTAL: grey-tan stone blocks, moss, bright blue crystal",
    "hourglass": "GOLDEN SAND: fine gold-beige sand, teal glints, thin brass rings",
    "coralreef": "PEARL SEA: blue-green water, pearl white, orange coral",
    "moonkeep": "SILVER MOON: cold silver crescent light, deep violet shadows",
}
VIOLET = {"soulcrypt", "moonkeep", "void", "thunder"}
GREEN = {"soulcrypt", "moonkeep"}  # their violet is too near the magenta key: drawn on #00FF00 instead

SHAPES = {
    "burst": "LAYOUT: one effect centred on the cell, about 70% of the cell across at its peak.\nTIMING: frame 1 a small bright seed of the effect at the centre; frame 2 it bursts outward to half size; frame 3 almost full size; frame 4 its full size, strongest; frame 5 breaking apart, pieces flying outward; frame 6 only a few small pieces left.",
    "slash": "LAYOUT: the marks run across the cell diagonally from upper right to lower left, centred, about 70% of the cell long.\nTIMING: frame 1 thin bright lines just starting at the upper right; frame 2 the marks tear fully across the cell; frame 3 full width, brightest; frame 4 full width, starting to thin; frame 5 thin and breaking into pieces; frame 6 a few small pieces left.",
    "beam": "LAYOUT: a straight HORIZONTAL beam band running across the whole width of the safe area through the vertical centre of the cell, about 30% of the cell tall at its peak, with its own texture along its whole length (it will be stretched sideways in game).\nTIMING: frame 1 a thin line; frame 2 half thickness; frame 3 full thickness; frame 4 full thickness, brightest; frame 5 thinning; frame 6 a thin fading line.",
    "streak": "LAYOUT: one long horizontal stab across the whole width of the safe area through the vertical centre of the cell: its narrow tip touches the RIGHT side of the safe area and it widens toward the LEFT, ending at the left in the head of the effect.\nTIMING: frame 1 a thin line from the right; frame 2 it shoots to the left end; frame 3 full size; frame 4 full size, brightest; frame 5 breaking up from the right; frame 6 only the head's last pieces at the left.",
    "ground": "LAYOUT: the effect grows up from one flat ground line at 80% of the cell height, centred horizontally, about 75% of the cell wide and up to 65% of the cell tall at its peak, everything rooted on that ground line (nothing below it).\nTIMING: frame 1 small cracks and first tips at the ground line; frame 2 it pushes up to a third of its height; frame 3 two thirds; frame 4 full height, strongest; frame 5 starting to fall apart; frame 6 low remains on the ground line.",
    "pillar": "LAYOUT: one narrow vertical shaft, about 25% of the cell wide, from the top of the safe area straight down to a flat ground line at 80% of the cell height, centred horizontally, ending in a small splash on that line.\nTIMING: frame 1 a thin line coming down from the top; frame 2 it reaches the ground line; frame 3 full width with its splash; frame 4 full width, brightest; frame 5 thinning; frame 6 only the splash's remains on the ground line.",
    "bolt": "LAYOUT: one single projectile, flying level, pointing LEFT (its head at the left, its tail at the right), centred on the cell, about 60% of the cell long and 22% tall.\nTIMING: a looping flight: all six frames show the same projectile at the same place and size; only its small tail and glints flicker from frame to frame, and frame 6 flows into frame 1.",
    "mote": "LAYOUT: one small single piece centred on the cell, about 45% of the cell across.\nTIMING: a looping flicker: all six frames show the same piece at the same place and size; only its small flame or glints change from frame to frame, and frame 6 flows into frame 1.",
    "spin": "LAYOUT: one object seen flat, centred on the cell, about 72% of the cell across.\nTIMING: all six frames show the same object at the same size, turned a sixth of a full spin further each frame.",
}

HEAD = """Image 1 (the first image) is only the identity reference for the fighter "{title}". DO NOT draw the fighter, its face, or any creature or character body.
Image 2 is a layout guide: use it only to understand the 3x2 grid of equal 512x512 frame slots, their centres and the safe area (the inner box). Do not reproduce the guide: no visible boxes, no safe-area rectangles, no centre marks, no lines, no borders, no guide colours.

Create an animated VFX sprite sheet for ONE skill of this fighter. Exactly six frames in a 3 COLUMNS x 2 ROWS grid of equal square cells, landscape 1536x1024 canvas, read left-to-right then next row.

ITS VFX IDENTITY: {palette}.
THE EFFECT: {design}.
{shape}
STYLE: OPAQUE solid painted shapes with crisp edges and cel-shaded highlights, clean HD painterly anime game VFX for a mobile fantasy RPG, NOT pixel art. No translucent haze, no soft smoke, no mist, no blurry glow halos, no semi-transparent gradients fading into the background. No text, no labels.
Everything stays fully inside its own cell with at least 12% magenta padding on all four sides; nothing crosses a cell edge or enters a neighbouring cell. Background 100% solid flat #FF00FF magenta, no gradient. Never use magenta, pink or hot pink anywhere in the effect{violet}.
"""

# elite -> [(fx, shape, design)]; the first is its skill's sheet, a bolt its shot.
FX = {
    "forest-rootknight": [("roots", "ground", "a ring of thick dark bark roots with fresh green leaf buds bursting up through cracked soil and coiling inward as if gripping a target's legs")],
    "forest-leafarcher": [("leafburst", "burst", "a leaf-headed arrow's impact: splinters and a burst of torn green leaves thrown straight outward"), ("leafarrow", "bolt", "a slim arrow of twisted green vine with a broad leaf-shaped head and leaf fletching")],
    "volcano-flamelancer": [("dragonflame", "streak", "a lance-thrust of bright flame whose wide left end is a snapping dragon's head of fire, jaws open")],
    "volcano-ashcultist": [("ashgeyser", "ground", "a geyser of bright flame bursting up through a cracked censer-shaped vent, chunks of charred ash thrown up with it"), ("ashember", "bolt", "a tumbling burning lump of censer coal with a short tail of flame")],
    "ice-frostguard": [("frostwave", "ground", "a low curling crescent wave of ice crystals and thrown snow, sharp blue crystals along its crest")],
    "ice-snowwitch": [("iceburst", "burst", "an ice spear's impact: blue-white crystal shards flying straight outward from a white flash"), ("icelance", "bolt", "a slender spear of pale blue ice with a crescent-shaped head")],
    "thunder-stormblade": [("thunderslash", "slash", "two crossed sword slashes of white and lemon-yellow lightning with branching arcs")],
    "thunder-sparkmage": [("sparkbolt", "pillar", "a jagged forked bolt of white and lemon-yellow lightning striking straight down, a small burst of arcs where it lands"), ("sparkorb", "bolt", "a small crackling ball of white-yellow lightning with a short jagged tail")],
    "marsh-bogstalker": [("mudtrap", "ground", "a bog opening up: dark olive mud heaving up in sharp reed-tipped spikes round a pool of lime-green toxin bubbles")],
    "marsh-sporewitch": [("sporeburst", "burst", "a spore pod bursting open, solid lime-green toxin puffs and brown husk pieces thrown outward"), ("sporedrop", "bolt", "a fat lime-green spore pod with a brown husk and a tail of small spore puffs")],
    "desert-scarabguard": [("sunbreak", "burst", "a shield-charge impact: a jagged flare of white-hot sun light breaking through amber sand, teal shell shards flying")],
    "desert-sandpriest": [("curseglyph", "ground", "a wide circle of amber sand glyphs on the ground rising as thin curved sand blades and pouring sand, teal curse light in the cracks"), ("sandorb", "bolt", "a dense spinning ball of amber sand with a thin teal ring and a tail of sand")],
    "abyss-reefcorsair": [("coralslash", "slash", "two curved cutlass slashes of teal sea water with white foam edges, red-orange coral chips flying")],
    "abyss-tidecaller": [("tidebeam", "beam", "a thick rushing jet of teal sea water with white foam edges and bright bubbles along its length"), ("waterbolt", "bolt", "a drop-shaped bolt of teal water with a white foam tail")],
    "foundry-gearknight": [("pistonsteam", "burst", "a ring of solid white steam jets blasting outward from a brass valve wheel, orange sparks")],
    "foundry-tinkerer": [("wrenchspin", "spin", "one giant open-ended brass wrench seen flat")],
    "crystal-shardblade": [("shardcut", "slash", "one long crystal-sword cut of faceted blue and cyan gem shards with white highlights")],
    "crystal-gemsage": [("prismray", "beam", "a straight ray of cyan light carrying small faceted blue gem shards along it, white core"), ("gemshard", "bolt", "one sharp faceted blue gem shard with a thin white light tail")],
    "haunted-gravewarden": [("ghostwisp", "mote", "one small flame of cold blue-green ghost fire with a pale skull-like face")],
    "haunted-bonepaladin": [("runecrescent", "spin", "one curved crescent of cold blue-green rune light with bone-grey rune marks along it")],
    "sky-windknight": [("galeimpact", "burst", "a spear-dive impact: a cone of sky-blue wind streaks slamming into a ring of white cloud puffs and white feathers")],
    "sky-cloudmonk": [("cloudgust", "ground", "a rolling low wall of solid white cloud puffs with sky-blue wind streaks curling through it")],
    "thorns-briarduelist": [("thornstreak", "streak", "a rapier thrust of a long dark green thorned vine, its wide left end a crimson rose bursting open")],
    "thorns-vinehexer": [("strangler", "ground", "dark green thorned vines lashing up from the ground and curling inward, crimson petals torn among them"), ("thornseed", "bolt", "a dark green thorned seed pod with a tail of crimson petals")],
    "celestial-sunpaladin": [("sunstreak", "streak", "a sword-thrust of warm white light, its wide left end a sharp four-pointed star of soft yellow")],
    "celestial-dawncleric": [("dawnbeam", "pillar", "a clean shaft of warm white dawn light coming straight down, cream light-feathers at its foot"), ("dawnmote", "bolt", "a small warm white sphere of light with a cream feather tail")],
    "void-voidknight": [("voidrift", "slash", "one straight vertical-leaning cut opening into the black-indigo void, tiny white stars inside, thin deep-blue rims")],
    "void-starseer": [("starcrush", "burst", "a dark orb collapsing then bursting into black-indigo fragments and tiny white stars"), ("darkstar", "bolt", "a small black-indigo orb ringed by a thin deep-blue crescent with tiny white stars in its tail")],
    "eldergrove-rootwarden": [("palespears", "ground", "pale birch root spears stabbing up from the ground in a fan, peach-white petals among them")],
    "eldergrove-blossomranger": [("pollenbloom", "ground", "a big cream blossom forcing its way up from the ground and bursting open with solid pale pollen puffs and peach-white petals")],
    "caldera-basaltbrute": [("lavaspike", "ground", "a row of jagged black basalt spikes bursting up from the ground with glowing orange lava seams, yellow-hot sprays at their feet")],
    "caldera-furnacepriest": [("emberburst", "burst", "a white-hot lump of slag bursting into orange lava drops and black basalt chips"), ("ember", "bolt", "a molten orange lump of slag with a dark crust and a short tail of flame")],
    "glacier-rimeknight": [("rimecage", "ground", "tall thick blue-white ice blocks closing inward from both sides into a cage standing on the ground, white snow at their feet, the centre of the cell left empty")],
    "glacier-blizzardmage": [("hailburst", "burst", "a block of ice smashing into blue-white chunks and thrown snow"), ("icedrop", "bolt", "a thick wedge of blue-white ice with a tail of snow")],
    "stormspire-voltlancer": [("goldrush", "burst", "a lance-charge impact: forked golden yellow lightning bursting straight outward from a white core, navy shadow shapes between the forks")],
    "stormspire-stormshaman": [("stormring", "burst", "a hollow ring of golden yellow lightning arcs, looping round an empty centre, small bolts jumping inward"), ("voltorb", "bolt", "a small ball of golden lightning with a white core and a jagged tail")],
    "soulcrypt-cagekeeper": [("chainlink", "mote", "one heavy dark iron chain link wrapped in a small deep-violet soul flame"), ("chainkey", "bolt", "a large dark iron key flying head first, a short length of chain as its tail, small violet soul flames")],
    "soulcrypt-veilassassin": [("veilcut", "slash", "two crossing thin cuts of deep-violet soul fire with shreds of black veil torn off them")],
    "mycelium-plagueherald": [("plagueburst", "burst", "a rust-red spotted cap bursting into sick yellow-green plague puffs and cream fragments"), ("plaguedrop", "bolt", "a fat rust-red cream-spotted spore cap with a sick yellow-green tail")],
    "mycelium-mycoknight": [("rotcrater", "ground", "a crater of rot: rust-red fungal caps and pale threads shoved up round cracked ground, sick yellow-green puffs thrown up")],
    "geode-rampartgolem": [("rockwave", "ground", "a heaved-up wave of grey-tan stone blocks with moss, bright blue crystals jutting from it, dirt thrown up")],
    "geode-prismseer": [("crystalray", "beam", "a thick blue crystal-light cannon ray with sharp crystal facets along its edges and a white core"), ("crystalshard", "bolt", "one long bright blue crystal shard with a white core and a thin tail")],
    "hourglass-dunesentinel": [("sandcut", "burst", "a curved blade of sand shattering into gold-beige sand sprays and teal glints"), ("sandblade", "bolt", "one flying crescent blade of packed gold-beige sand with a thin brass edge")],
    "hourglass-chronoweaver": [("timethread", "mote", "one small thin brass clock ring with a golden thread of sand through it"), ("sandmote", "bolt", "a small golden bead of sand with a thin curling thread as its tail")],
    "coralreef-tidemarshal": [("tidewave", "ground", "a curling wave of blue-green water with pearl-white foam and orange coral pieces in it, rolling along the ground")],
    "coralreef-coraloracle": [("pearlmote", "mote", "one glowing pearl in a small curl of blue-green water"), ("pearlbolt", "bolt", "a bright pearl flying in a teardrop of blue-green water")],
    "moonkeep-lunarknight": [("moonslash", "slash", "three thin cold silver crescent cuts in a row with deep violet shadows")],
    "moonkeep-eclipsehuntress": [("eclipsebite", "burst", "two curved silver crescents snapping shut like fangs on a small dark eclipse disc, deep violet sparks")],
}

# The second wave is designed in assets/gemwoven/elites/roster2.py.
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
from roster2 import ROSTER  # noqa: E402
FX.update({e: [tuple(x) for x in r["fx"]] for e, r in ROSTER.items()})


def names():
    return json.loads((ROOT / "assets/gemwoven/elites/elites.json").read_text(encoding="utf-8"))["elites"]


def prompt(e, fx):
    theme = e.split("-")[0]
    shape, design = next((s, d) for f, s, d in FX[e] if f == fx)
    text = HEAD.format(title=names()[e].get("name", e), palette=PALETTES[theme], design=design, shape=SHAPES[shape], violet="" if theme in VIOLET else ", and no purple or violet")
    if theme in GREEN:
        text = text.replace("#FF00FF magenta", "#00FF00 green").replace("magenta padding", "green padding").replace("Never use magenta, pink or hot pink anywhere", "Never use green anywhere")
    return text


def ref(e):
    out = SCRATCH / e / "ref.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    idle = Image.open(ROOT / "assets/gemwoven/elites" / e / "idle.webp").convert("RGBA").crop((0, 0, 256, 256))
    bg = Image.new("RGBA", idle.size, (255, 0, 255, 255))
    bg.alpha_composite(idle)
    bg.convert("RGB").resize((512, 512)).save(out)
    return out


def gen(e, fx, model=DEFAULT[0], effort=DEFAULT[1], log=print):
    d = HERE / e / fx
    d.mkdir(parents=True, exist_ok=True)
    (d / "prompt.txt").write_text(prompt(e, fx) + "\n", encoding="utf-8")
    cmd = [sys.executable, GEN, "--prompt-file", d / "prompt.txt", "--out", d / "raw-sheet.png", "--ref", ref(e), "--ref", LAYOUT, "--model", model, "--effort", effort, "--timeout", 900]
    r = subprocess.run(list(map(str, cmd)), cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", creationflags=NO_WINDOW)
    if r.returncode:
        log(r.stdout[-800:], r.stderr[-800:])
        raise RuntimeError(f"rc={r.returncode}")


def batch(workers=3, only=None, model=DEFAULT[0], effort=DEFAULT[1]):
    jobs = [(e, f) for e, sheets in FX.items() if not only or e in only for f, _, _ in sheets if not (HERE / e / f / "raw-sheet.png").exists()]
    total, lock, done = len(jobs), threading.Lock(), []
    SCRATCH.mkdir(parents=True, exist_ok=True)

    def log(*a):
        with lock, (SCRATCH / "batch.log").open("a", encoding="utf-8") as f:
            f.write(time.strftime("%H:%M:%S ") + " ".join(map(str, a)) + "\n")

    def worker():
        while True:
            with lock:
                if not jobs:
                    return
                e, f = jobs.pop(0)
            for attempt in range(2):
                try:
                    gen(e, f, model, effort, log)
                    done.append((e, f))
                    log("ok", e, f, f"{len(done)}/{total}")
                    break
                except Exception as err:
                    log("fail", e, f, attempt, repr(err)[:200])
                    time.sleep(20)
    threads = [threading.Thread(target=worker) for _ in range(workers)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    log("batch finished", len(done), "of", total)


def key_green(raw):
    a = np.asarray(raw).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)
    a[..., 3] *= 1 - np.clip((spill - 18) / 70, 0, 1)
    a[..., 1] = np.where(spill > 0, np.maximum(r, b), g)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def ground_line(strip):
    """Where the sheet meets the floor: the foot of its wide band at the peak frame (frame 4)."""
    cell = np.asarray(strip.crop((3 * CELL, 0, 4 * CELL, CELL)).getchannel("A")) > 60
    rows = np.where(cell.sum(1) > CELL * .12)[0]
    return round(float(rows.max() + 1) / CELL, 3) if len(rows) else .8


def export(only=None):
    sys.path.insert(0, str(ROOT / "assets/fx/bosses"))
    sys.path.insert(0, str(Path.home() / ".codex/skills/generate2dsprite/scripts"))
    from generate2dsprite import remove_bg_magenta
    from export_fx import clean
    meta = json.loads((HERE / "fx.json").read_text(encoding="utf-8")) if only else {}
    for e, sheets in FX.items():
        if only and e not in only:
            continue
        theme = e.split("-")[0]
        for fx, shape, _ in sheets:
            path = HERE / e / fx / "raw-sheet.png"
            if not path.exists():
                continue
            raw = Image.open(path).convert("RGBA").resize((1536, 1024), Image.Resampling.LANCZOS)
            keyed = key_green(raw) if theme in GREEN else remove_bg_magenta(raw, 100, 150)
            strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
            for k in range(COUNT):
                col, row = k % 3, k // 3
                frame = keyed.crop((col * 512, row * 512, (col + 1) * 512, (row + 1) * 512)).resize((CELL, CELL), Image.Resampling.LANCZOS)
                strip.alpha_composite(frame if theme in GREEN else clean(frame, "void" if theme in VIOLET else "fire"), (CELL * k, 0))
            out = HERE / e / f"{fx}.webp"
            strip.save(out, "WEBP", lossless=True, method=6, exact=True)
            meta[f"{e}/{fx}"] = {"file": out.relative_to(ROOT).as_posix(), "count": COUNT, "frameDuration": 70, **({"ground": ground_line(strip)} if shape in ("ground", "pillar") else {})}
    (HERE / "fx.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    print(len(meta), "sheets")


def contact(ids=None):
    rows = [(e, f) for e, sheets in FX.items() if not ids or e in ids for f, _, _ in sheets if (HERE / e / f"{f}.webp").exists()]
    cell, per = 100, 2
    font = ImageFont.truetype("arial.ttf", 12)
    canvas = Image.new("RGB", (per * (6 * cell + 8), ((len(rows) + 1) // per) * (cell + 14)), (34, 38, 48))
    draw = ImageDraw.Draw(canvas)
    for k, (e, f) in enumerate(rows):
        x0, y0 = (k % per) * (6 * cell + 8), (k // per) * (cell + 14)
        draw.text((x0 + 3, y0), f"{e} {f}", fill=(255, 255, 210), font=font)
        s = Image.open(HERE / e / f"{f}.webp").convert("RGBA")
        for i in range(COUNT):
            c = s.crop((i * CELL, 0, (i + 1) * CELL, CELL)).resize((cell, cell))
            canvas.paste(c, (x0 + i * cell, y0 + 14), c)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    canvas.save(SCRATCH / "contact.png")
    print(SCRATCH / "contact.png", canvas.size)


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    if cmd == "prompts":
        for e, sheets in FX.items():
            for f, _, _ in sheets:
                (HERE / e / f).mkdir(parents=True, exist_ok=True)
                (HERE / e / f / "prompt.txt").write_text(prompt(e, f) + "\n", encoding="utf-8")
    elif cmd == "gen":
        gen(*rest)
    elif cmd == "export":
        export(rest or None)
    elif cmd == "contact":
        contact(rest or None)
    elif cmd == "batch":
        args = dict(zip(rest[::2], rest[1::2]))
        batch(int(args.get("--workers", 3)), args["--only"].split(",") if "--only" in args else None, args.get("--model", DEFAULT[0]), args.get("--effort", DEFAULT[1]))
