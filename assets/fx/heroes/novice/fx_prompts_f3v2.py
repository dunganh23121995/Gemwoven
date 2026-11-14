"""Hiro six-star redo (owner 13/11: "Làm lại cả hiro 3 đi. Âm thanh nghe không hay, xấu." + "Hình ảnh hoạt ảnh cũng sơ sài"):
Codex's design, the weight of a steel longsword: four hilt stones wake, a giant translucent steel blade cleaves down, the
ground splits and a low dust wave throws stones; a compact down-cut with steel sparks for the basic attack. Steel silver,
grey, earth dust; restrained colour, no element of his own. 2 columns x 4 rows, magenta, codex_image_gen.py."""
from pathlib import Path

R = Path(__file__).resolve().parent
LAY = ("LAYOUT: exactly eight frames in a 2 COLUMNS x 4 ROWS grid of equal square cells, tall 1024x2048 canvas, read left-to-right, top-to-bottom, one continuous one-shot effect. "
       "Clean HD painterly anime game VFX matching a chibi fantasy RPG, NOT pixel art; everything painted fully opaque with crisp shapes (no soft haze, no smoke, no translucent fog). "
       "No character, no creature, no hero, no hand, no text, no labels, no borders, no grid lines, no ground plate, no floor, no shadow. Everything stays fully inside its own cell with at least 6% magenta padding on all four sides in every frame. "
       "Background 100% solid flat #FF00FF magenta, no gradient. Never use magenta, pink or purple in the effect.")
P = {
    'f3-hilt': ("Create an animated VFX sprite sheet: FOUR TINY HILT GEMS WAKING in turn on a sword guard (the sword is NOT drawn, only the four small gems and their glints). "
                "GEOMETRY: four small round gems in a short horizontal row centred at 50% x 50% of the cell, the row 40% of the cell width long; each gem a muted stone (dull red, slate blue, amber, pale green). "
                "Frame 1: four dull dark stones. Frame 2: the dull-red gem lights with a small soft glint. Frame 3: the slate-blue gem lights too. Frame 4: the amber gem lights too. Frame 5: the pale-green gem lights too, all four lit with small cross glints. "
                "Frame 6: all four bright, a thin silver glint line joining them. Frame 7: all four dimming to a small core. Frame 8: faint cores only. Restrained, small, not flashy. "),
    'f3-cleave': ("Create an animated VFX sprite sheet: a MASSIVE TRANSLUCENT STEEL BLADE-AURA CLEAVING DIAGONALLY DOWN. Drawn like a giant ghostly longsword blade made of steel light: a sharp bright silver-white rim, a clear pale steel-grey interior, a faint warm reflection, NOT blue, NOT ice. "
                  "The cut sweeps from the upper left corner of the cell down to the lower right, as a broad tapered crescent. "
                  "Frame 1: a thin bright silver line starting at the upper left. Frame 2: the giant blade-aura sweeping halfway down, wide. Frame 3: the full crescent from upper left to lower right, widest and brightest, its rim sharp. Frame 4: at the lower right end a compact heavy contact burst of short warm silver sparks and sharp impact streaks. "
                  "Frame 5: the crescent thinning into a slash afterimage, sparks flying. Frame 6: a thin fading afterimage line. Frame 7: faint line and two sparks. Frame 8: almost gone. "),
    'f3-split': ("Create an animated VFX sprite sheet: the GROUND SPLITS UNDER A HEAVY SWORD BLOW and a low dust wave throws stones. Side-view RPG battle camera, slight 3/4 from the front. GROUND LINE at 86% of the cell height, impact point horizontally centred. "
                 "Palette: grey-brown stone, dark earth seam, sandy dust; no glow, no colour light. "
                 "Frame 1: a narrow diagonal split opens in the ground, its two stone edges slightly displaced. Frame 2: a low ground-hugging dust wave bursts out from the split to both sides, 5-7 heavy stone fragments thrown sideways and low. "
                 "Frame 3: the dust wave widest (95% of the cell width), stones highest (30% of the cell height). Frame 4: stones falling fast. Frame 5: stones landing, dust rolling low. Frame 6: dust thinning. Frame 7: the split seam and a few stones. Frame 8: fading. "),
    'f3-downcut': ("Create an animated VFX sprite sheet: a COMPACT DIAGONAL DOWNWARD STEEL SLASH with contact sparks (a basic sword attack). Silver-white edge, pale steel trail, warm silver sparks with tiny pale-gold roots; not blue. "
                   "The slash runs from the upper middle of the cell down to the lower right, narrow at its origin, a crisp contact sweep, a thin tail. "
                   "Frame 1: a thin bright line at the top. Frame 2: the slash sweeping down, broad in the middle. Frame 3: the full slash, brightest; at its lower end 3-5 short warm silver sparks spray back up and left. Frame 4: the slash thinning, sparks flying. "
                   "Frame 5: a thin tail and fading sparks. Frame 6: tail breaking up. Frame 7: two last sparks. Frame 8: gone except a faint glint. "),
    'f3-dust': ("Create an animated VFX sprite sheet: a SMALL DRY DUST PUFF KICKED BACKWARD BY A HEAVY BOOT. Side-view RPG battle camera. GROUND LINE at 86% of the cell height, the kick point at 60% of the cell width. "
                "Palette: sandy beige and light brown dust, a few grey grit specks. Frame 1: a small burst of grit at the kick point. Frame 2: dust puffing backward to the left, low. Frame 3: the puff widest (60% of the cell width), low (25% of the cell height). "
                "Frame 4: drifting and thinning. Frame 5: settling. Frame 6: thin. Frame 7: faint. Frame 8: gone. "),
}

if __name__ == '__main__':
    for k, v in P.items():
        (R / k).mkdir(exist_ok=True); (R / k / 'prompt-used.txt').write_text(v + LAY, encoding='utf-8')
    print('prompts written', len(P))
