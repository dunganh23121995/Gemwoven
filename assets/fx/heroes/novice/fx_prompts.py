"""Write the Codex prompts for Hiro's form 2 and 3 skill FX (src/forms-hiro.js) into <name>/prompt-used.txt.

Each sheet is then drawn by Codex (codex_image_gen.py, gpt-6.1-sol first) with the form's identity picture
(form-N/skill/identity.png) as a palette-only reference, and packed by export_form_fx.py.

  python assets/fx/heroes/novice/fx_prompts.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

TAIL6 = ("Exactly 6 frames in a 3 columns x 2 rows grid of equal square 512x512 cells, total image 1536x1024, read left-to-right then next row. "
         "Nothing crosses a cell edge; leave a magenta margin of at least 8% on all sides of every cell. Background 100% solid flat #FF00FF magenta "
         "in every cell, no gradient, no text, no labels, no borders, no gridlines. Clean HD smooth painted anime game VFX, NOT pixel art.")
TAIL8 = ("Exactly 8 frames in a 4 columns x 2 rows grid of equal square 512x512 cells, total image 2048x1024, read left-to-right then next row. "
         "Nothing crosses a cell edge; leave a magenta margin of at least 6% on all sides of every cell. Background 100% solid flat #FF00FF magenta "
         "in every cell, no gradient, no text, no labels, no borders, no gridlines. Clean HD smooth painted anime game VFX, NOT pixel art.")
OPAQUE = ("Painted as OPAQUE solid shapes with crisp edges: no soft glow halo, no haze, no semi-transparent mist bleeding into the background. "
          "No pink, no purple, no magenta tint anywhere.")
JEWEL_OPAQUE = ("Painted as OPAQUE solid shapes with crisp edges: no soft glow halo, no haze, no semi-transparent mist bleeding into the background. "
                "The violet jewel is a deep blue-violet indigo, never pink or magenta. No magenta tint anywhere.")
REF2 = ("Image 1 is only a palette and art-style reference (Hiro the wandering swordsman: moss-green cloak, brown leather, a straight steel sword "
        "with one small green gem in its brass crossguard): match its clean HD hand-painted anime game art and its moss green, leaf green, steel "
        "white and warm brass palette. Do NOT draw the character or the sword.")
REF3 = ("Image 1 is only a palette and art-style reference (Hiro the jewel hero: white-gold armour, a longsword whose blade holds a strip of red "
        "ruby, blue sapphire, green emerald and amethyst gems, a moss-green cape): match its clean HD hand-painted anime game art and its "
        "white-gold, warm gold and four-jewel palette. Do NOT draw the character or the sword.")

PROMPTS = {
    "f2-gale": (REF2, """Create a 6-frame LOOPING spell VFX sprite sheet: a TRAVELLER'S WIND, a whirling gust of wind and leaves circling a swordsman who stands at the centre (the swordsman is NOT drawn; the middle stays empty magenta). Seen from the side in slight 3/4: a flat horizontal ellipse ring of pale wind streaks lies on the ground at about 90% of the cell height, and curved white-and-pale-green wind ribbons spiral up from it around the empty centre to about 30% of the cell height, with a dozen moss-green and golden-yellow leaves tumbling along the ribbons. The ring is about 70% of the cell wide. Each frame turns the whirl a little further (leaves and ribbon ends advance around the ellipse) so frame 6 flows back into frame 1. The empty centre column (about 35% of the cell wide) has no ribbons crossing its middle, only behind and below it.""",
                OPAQUE + " Colours only white, pale mint, moss green, leaf green and golden yellow.", TAIL6),
    "f2-slash": (REF2, """Create a 6-frame spell VFX sprite sheet, one continuous sequence: a single SWORD SLASH ARC of a straight steel sword, a crisp crescent blade-trail cutting HORIZONTALLY from left to right, bulging slightly upward. The arc is a thin sharp crescent: a bright white leading edge, a polished steel-silver body and a narrow emerald-green rim along its back edge, with a few small green leaves and steel glints shed behind it.
Frame 1: a thin bright line begins at the left. Frame 2: the crescent extends halfway and thickens. Frame 3: the full crescent at its sharpest, spanning about 80% of the cell width. Frame 4: the full arc holds, the white edge flashing. Frame 5: the arc thins and breaks into fine streaks and leaves. Frame 6: only a few fading streaks and leaves remain along the curve.""",
                 OPAQUE + " Colours only white, steel silver, emerald green and leaf green.", TAIL6),
    "f2-cross": (REF2, """Create an 8-frame spell VFX sprite sheet, one continuous sequence centred in every cell: the FINISHING CROSS CUT of a swordsman, an X of two crossing sword cuts that flares and bursts. Frame 1: one bright white-steel cut line slashed diagonally from upper left to lower right through the cell centre, emerald-green rim. Frame 2: a second cut line slashes from lower left to upper right, forming a sharp X. Frame 3: the X glows brighter, both lines thickening into crisp crescent blades. Frame 4: the X flashes at its brightest, a small white star at the crossing. Frame 5: the X bursts outward: steel-white shards and a ring of wind streaks fly out from the crossing, moss-green and golden leaves scatter. Frame 6: the burst widens, the cut lines break into fragments. Frame 7: fading wind streaks and leaves drifting outward. Frame 8: only a few leaves and tiny glints remain. The X spans about 70% of the cell at its largest; the burst stays inside the cell.""",
                 OPAQUE + " Colours only white, steel silver, emerald green, leaf green and golden yellow.", TAIL8),
    "f3-gems": (REF3, """Create a 6-frame spell VFX sprite sheet, one continuous sequence: FOUR JEWEL LIGHTS GATHER INTO A RAISED SWORD (the sword and its bearer are NOT drawn; only the lights). Four large faceted glowing jewels, a red ruby, a blue sapphire, a green emerald and an indigo-violet amethyst, each with a small white-gold sparkle and a short thin gold light trail. Frame 1: the four jewels appear wide apart around the lower half of the cell, like the four corners of a diamond around a standing figure. Frame 2: they rise and begin to circle, trailing gold. Frame 3: they spiral upward and inward. Frame 4: they converge near the top centre of the cell (where a raised sword tip would be), close together. Frame 5: they fuse into one white-gold four-pointed star flash at the top centre with four coloured rays. Frame 6: the star fades to a few white-gold sparkles. Each jewel is about 10% of the cell wide.""",
                JEWEL_OPAQUE, TAIL6),
    "f3-crescent": (REF3, """Create a 6-frame spell VFX sprite sheet, one continuous sequence: a GIANT JEWEL-LIGHT CRESCENT SLASH of a heroic longsword, a huge crescent blade of white-gold light swept DOWNWARD, from the top of the cell curving down to the lower right, bulging to the right. The crescent is thick: a brilliant white leading edge, a warm gold body, and along its back edge four thin parallel bands of jewel colour, ruby red, sapphire blue, emerald green and indigo violet, like light through a prism, with small faceted gem shards and gold sparkles shed along it.
Frame 1: a thin bright white-gold line begins at the top. Frame 2: the crescent extends halfway down and thickens. Frame 3: the full crescent at its thickest, spanning about 80% of the cell height. Frame 4: the full arc holds, the jewel bands glowing. Frame 5: the arc thins and breaks into gold streaks and small gem shards. Frame 6: only scattered gem shards and gold sparkles remain along the curve.""",
                    JEWEL_OPAQUE, TAIL6),
    "f3-crest": (REF3, """Create an 8-frame GROUND spell VFX sprite sheet, one continuous sequence: a JEWEL CREST PRISON that blooms on the ground under an enemy (the enemy is NOT drawn; the middle stays empty magenta). The ground line is fixed at 92% of the cell height in every frame: everything stands on it. Seen from the side in slight 3/4. Frame 1: a thin white-gold ring appears flat on the ground, a wide ellipse about 80% of the cell wide at the ground line. Frame 2: a four-pointed star crest of gold light draws itself inside the ellipse on the ground, with a faceted jewel at each of its four points: ruby red, sapphire blue, emerald green and indigo violet. Frame 3: four tall jewel crystals sprout up from the four points, each crystal in its own jewel colour, about 30% of the cell high. Frame 4: the crystals shoot up into tall slim prismatic crystal spires reaching about 75% of the cell height, leaning slightly inward like a cage around the empty centre, thin gold light lines linking them. Frame 5: the crystal cage at its brightest, a white-gold flash running up each spire. Frame 6: the spires shatter: faceted gem shards in the four colours burst outward and upward with gold sparkles. Frame 7: shards and sparkles fall and scatter, the ground crest fading. Frame 8: only a few small falling gem glints and a faint gold ring remain on the ground line. The empty centre between the spires stays open (about 40% of the cell wide).""",
                 JEWEL_OPAQUE + " No baked ground plate or shadow.", TAIL8),
}

if __name__ == "__main__":
    for name, parts in PROMPTS.items():
        (ROOT / name).mkdir(exist_ok=True)
        (ROOT / name / "prompt-used.txt").write_text("\n\n".join(parts[:2]) + "\n" + "\n".join(parts[2:]) + "\n", encoding="utf-8")
        print("[ok]", name)
