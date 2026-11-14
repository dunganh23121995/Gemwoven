"""Hiro's plain redesign (owner 07/11: "hình ảnh cơ bản, không rực rỡ ... hợp nhân vật miễn phí"): new prompts for every
Hiro FX strip, same names, frame counts and grids as before, so src/forms-tan.js and src/forms-hiro.js stage them
unchanged. Plain steel, wood, dust and wind; no gold glow, no jewels lighting up, no crystal prison.
The old jewel-light prompts and sheets are in the Git history (before 07/11).

  python assets/fx/heroes/novice/fx_prompts_plain.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

TAIL6 = ("Exactly 6 frames in a 3 columns x 2 rows grid of equal square 512x512 cells, total image 1536x1024, read left-to-right then next row. "
         "Nothing crosses a cell edge; leave a magenta margin of at least 8% on all sides of every cell. Background 100% solid flat #FF00FF magenta "
         "in every cell, no gradient, no text, no labels, no borders, no gridlines. Clean HD smooth painted anime game VFX, NOT pixel art.")
TAIL8 = ("Exactly 8 frames in a 4 columns x 2 rows grid of equal square 512x512 cells, total image 2048x1024, read left-to-right then next row. "
         "Nothing crosses a cell edge; leave a magenta margin of at least 6% on all sides of every cell. Background 100% solid flat #FF00FF magenta "
         "in every cell, no gradient, no text, no labels, no borders, no gridlines. Clean HD smooth painted anime game VFX, NOT pixel art.")
PLAIN = ("PLAIN and MODEST: this is the free starter hero, so the effect is simple and down to earth. Painted as OPAQUE solid shapes with crisp "
         "edges: no glow halo, no haze, no sparkles, no gold light, no jewels, no rainbow colours, no magic runes. No pink, no purple, no magenta tint.")
REF = {1: "Image 1 is only a palette and art-style reference (Hiro, a humble boy traveler with a wooden sword, brown cloth and a green scarf). "
          "Do NOT draw the character or the sword.",
       2: "Image 1 is only a palette and art-style reference (Hiro the traveling swordsman: brown leather, a dull green cloak, a plain iron sword). "
          "Do NOT draw the character or the sword.",
       3: "Image 1 is only a palette and art-style reference (Hiro the plain hero: grey steel armour over leather, a worn green cloak, a plain steel "
          "longsword with four tiny dull stones in its guard). Do NOT draw the character or the sword."}

PROMPTS = {
    "slash": (1, """Create a 6-frame spell VFX sprite sheet, one continuous sequence: the trail of ONE big earnest overhead chop with a wooden practice sword, a simple crescent swept DOWNWARD from the top of the cell to the lower part, bulging to the right. A plain off-white air trail with a thin light-brown edge and a few wood-dust specks, like a strong swing through the air.
Frame 1: a short line begins at the top. Frame 2: the crescent reaches halfway. Frame 3: the full crescent. Frame 4: it holds, a little thinner. Frame 5: it breaks into fading streaks. Frame 6: faint specks only.""", " Colours only off-white, pale beige, light brown.", TAIL6),
    "burst": (1, """Create a 6-frame spell VFX sprite sheet, one continuous sequence centred in every cell: the IMPACT where a wooden sword lands on an enemy: a short white impact flash, a puff of dust and a few small wood chips and dust specks flying out, then settling.
Frame 1: a small white flash. Frame 2: the flash with short impact lines around it. Frame 3: a dust puff spreading, small chips flying. Frame 4: dust widening, thinner. Frame 5: dust fading. Frame 6: a few specks.""", " Colours only white, pale beige, sandy brown, light grey.", TAIL6),
    "aura": (1, """Create a 6-frame LOOPING spell VFX sprite sheet: a modest swirl of DUST and a little wind rising around the feet of a boy who plants his feet to focus (the boy is NOT drawn; the middle stays empty magenta). Low ground-level dust curls and a few small pebbles and leaves lifting, reaching only to knee height, at the bottom of the cell.""", " Colours only pale beige, sandy brown, light grey and a touch of dull green.", TAIL6),
    "f2-gale": (2, """Create a 6-frame LOOPING spell VFX sprite sheet: a TRAVELLER'S WIND, a gust of wind and a few leaves circling a swordsman who stands at the centre (the swordsman is NOT drawn; the middle stays empty magenta). Seen from the side: low pale wind streaks and a handful of green and brown leaves swirling round his boots and up to his waist, a simple natural breeze.""", " Colours only off-white, pale grey, dull green and leaf brown.", TAIL6),
    "f2-slash": (2, """Create a 6-frame spell VFX sprite sheet, one continuous sequence: a single SWORD SLASH ARC of a plain iron sword, a crisp crescent trail cutting HORIZONTALLY from left to right, bulging slightly upward. A thin sharp off-white steel line with a pale grey trailing edge, plain and clean.
Frame 1: a thin line begins at the left. Frame 2: the crescent extends halfway. Frame 3: the full crescent, about 80% of the cell width. Frame 4: the full arc holds. Frame 5: the arc thins and breaks. Frame 6: faint fading streaks.""", " Colours only white, steel grey, pale grey.", TAIL6),
    "f2-cross": (2, """Create an 8-frame spell VFX sprite sheet, one continuous sequence centred in every cell: the FINISHING CROSS CUT of a swordsman, an X of two crossing plain steel cuts, then a puff of dust and a few leaves. Frame 1: one off-white cut line slashed diagonally. Frame 2: the second line crosses it into an X. Frame 3: the X at its sharpest with short impact lines. Frame 4: a dust puff bursting from the centre. Frame 5: dust spreading, a few leaves flying. Frame 6: the X fading. Frame 7: dust thinning. Frame 8: a few specks and leaves.""", " Colours only white, steel grey, sandy beige, dull green leaves.", TAIL8),
}

if __name__ == "__main__":
    for name, (form, body, colours, tail) in PROMPTS.items():
        d = ROOT / name; d.mkdir(exist_ok=True)
        (d / "prompt-used.txt").write_text(REF[form] + "\n\n" + body + "\n" + PLAIN + colours + "\n" + tail + "\n", encoding="utf-8")
        print("[ok]", name)
