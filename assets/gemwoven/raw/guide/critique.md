**First-tap clarity:** Home **5/10**; stage card **7/10**; fight **4/10**.

- **Home:** Khám Phá is prominent, but competes with many illustrated destinations and notification badges. The guide needs one short instruction, one target outline, and one pointing glove.
- **Stage card:** Khiêu Chiến reads clearly as the primary action, but rewards, star conditions, and portraits delay the decision. Place the guide in the blank parchment above the portraits. A real new account must offer Hiro only.
- **Fight:** The board invites interaction, but neither the swap gesture nor a useful first move is explicit. Demonstrate one valid adjacent swap with a compact glove; keep the instruction in the sky above the character bars.

Follow [the agreed Dẫn Đường design](D:/Project/Gemwoven/docs/GAME_DESIGN.md:920): no screen dimming, one target at a time, existing cat art, and drawn parchment/wood/brass pieces. The counter remains **1/8 until stage 1 is won**.

Coordinates below use `[x, y, width, height]`, origin at the upper left. Home/card use the **941×1672 stage**, excluding phone letterboxing. For fight, the taller reference is **normalized to 941×1672 for annotation only**; preserve its actual aspect ratio when rendering.

| Piece | Home: Khám Phá | Stage card: Khiêu Chiến |
|---|---|---|
| Existing cat bust | `[38,1014,166,200]` | `[82,1088,166,200]` |
| Speech plaque | `[202,1040,702,174]` | `[246,1110,610,174]` |
| Main instruction | “Bấm Khám Phá để vào ải đầu tiên”, one line; baseline approximately `1180` | “Bấm Khiêu Chiến”, one line; baseline approximately `1250` |
| Counter badge | `[226,1056,100,60]`, “1/8” | `[270,1126,100,60]`, “1/8” |
| Bỏ qua | Upper-right plaque tab; hit area `[700,1040,200,108]` | Upper-right plaque tab; hit area `[656,1110,200,108]` |
| Target | Supplied nominal rectangle `[190,1260,560,120]` | Approximately `[210,1460,530,76]` |
| Drawn target outline | `[178,1248,584,144]` | Approximately `[198,1448,554,100]` |
| Pointing glove | `[758,1140,110,144]`; index points down-left to the button’s upper-right edge | `[756,1320,110,144]`; index points down-left toward the button’s upper-right edge |

Use a thin, open-center golden outline with restrained glow. Its center must leave the button lettering untouched. Keep the Home navigation clear, approximately `y≥1490`. Crop the existing cat to a bust with a soft lower mask; preserve his face, costume, and raised paw.

These are composition bounds. **Anchor the outline and glove to the actual button bounds**, including scrolling and resizing—the supplied Home target is approximate. In Studio, attach everything to the game frame, using the same scale as its contents. Use approximately **30–32 stage-unit text** and at least **108×108 stage-unit skip hit areas**.

For the fight coach:

| Piece | Normalized stage coordinates / behavior |
|---|---|
| Cat bust | `[26,126,150,180]`, within the upper-left sky |
| Speech plaque | `[182,128,727,174]`, ending above the name/HP bars |
| Instruction | “Đổi 2 ngọc cạnh nhau, xếp 3 cùng màu”, one line in the lower portion of the plaque |
| Counter / skip | Counter `[206,144,100,60]`; skip hit area `[709,128,200,108]` |
| Board protection | Board is approximately `[47,918,847,696]`; no dialogue panel over it |
| Demonstration in this screenshot | **Row 3, column 3 → row 3, column 4**, counting from the top left: blue ice gem swaps right with the shield, forming three blue ice gems vertically in column 4 |
| Glove | Approximately `78×94`; fingertip travels from `(311,1135)` to `(417,1135)` |
| Target marks | Thin drawn outlines inside those two cells; a short amber directional stroke between them, without covering their symbols |

At runtime, use **`legalMoves()[0]`**, rather than hardcoding that screenshot move. Show after 1.5 idle seconds, hide on touch, and repeat after six idle seconds until a successful match. Keep combat running. With reduced motion, show a stationary glove and directional stroke.

The following prompts include lettering for mockup review. Production overlay assets should have blank plaques, with all words and counters rendered as HTML.

```PROMPT_HOME
Create an EDIT MOCKUP of Gemwoven’s first onboarding step.

OUTPUT: portrait 1024x1792, OR match the reference aspect ratio exactly; prefer matching the reference. Preserve the complete screenshot, including its letterboxing, without stretching or cropping.

INPUT ROLES:
- Image 1, current-home-phone.png: the sole edit target.
- Image 5, forge-rarity/mockup-2.png: style reference for the NEW overlay pieces only.
- Image 6, npc-guide.webp: existing character insert. Reuse this exact cat artwork; crop/mask it into a bust. Do not redraw, reinterpret, mirror, or change his face, costume, colors, or raised paw.

KEEP THE HOME SCREEN ART IDENTICAL. Only add the guide overlay pieces. Preserve every existing building, hero, button, label, number, HUD element, navigation item, and background detail. Do not move Khám Phá or modify any underlying screen art.

STYLE: same hand-painted chibi fantasy style as the approved forge and current hub pieces. Warm wood, ivory parchment, small brass fittings, restrained golden light. All frames, plaques, target outlines, and the glove must look like drawn game art, not plain CSS boxes or flat vector UI.

COMPOSITION:
Use the inner game stage, excluding letterboxing, as a conceptual 941x1672 coordinate system.
Place the unchanged cat bust around [38,1014,166,200].
Place a compact parchment speech plaque with a warm wooden rim around [202,1040,702,174], immediately above Khám Phá.
Put a small brass counter badge in its upper-left area and a small parchment skip tab at its upper-right.
Keep the main instruction on one clear line below these small controls.

Add one thin, open-center, hand-painted golden outline around the ACTUAL existing Khám Phá button, with about 12 stage units of clearance. Follow the button’s visible bounds in the reference; do not relocate it to fit nominal coordinates.
Add one ivory pointing glove with a brass cuff just above-right of the target. Its index points down-left to the button’s upper-right edge. Keep the glove outside the button lettering.
Keep the entire bottom navigation unobstructed.

NEW TEXT, EXACTLY:
"Bấm Khám Phá để vào ải đầu tiên"
"1/8"
"Bỏ qua"

Use crisp, dark-brown Vietnamese lettering with all diacritics correct. No additional overlay words. Treat this lettering as the visual proof of a future HTML text layer.

No dimming, dark scrim, full-screen frame, second pointer, extra character, or altered Home painting. Only add the specified overlay pieces.
```

```PROMPT_FIGHT
Create an EDIT MOCKUP of Gemwoven’s stage-1 combat coach.

OUTPUT: portrait 1024x1792, OR match the reference aspect ratio exactly; prefer matching the taller fight reference. Preserve the complete screen without stretching, cropping, or rearranging its contents.

INPUT ROLES:
- Image 3, current-fight-phone.png: the sole edit target.
- Image 5, forge-rarity/mockup-2.png: style reference for the NEW overlay pieces only.
- Image 6, npc-guide.webp: existing cat character insert. Reuse the exact artwork as a cropped bust; do not redraw, mirror, or restyle him.

KEEP THE FIGHT SCREEN ART IDENTICAL. Only add the coach overlay pieces. Preserve Hiro, Slime Rêu, their bars and numbers, every control, the battlefield, and every gem in its original cell. Do not show a completed swap or change the board.

STYLE: same hand-painted chibi fantasy style; warm wood, ivory parchment, brass details, and restrained amber light. Drawn game-art plaques, glove, and outlines, with no plain CSS boxes.

PLACEMENT:
For annotation only, normalize the full fight reference to a conceptual 941x1672 coordinate system; preserve the original aspect ratio in the output.
Place the unchanged cat bust around [26,126,150,180].
Place a slim parchment speech plaque with wooden edging around [182,128,727,174], entirely within the sky below the top toolbar and above both character name/HP/energy bars.
Place a small "1/8" badge at the plaque’s upper-left and a "Bỏ qua" tab at its upper-right. Put the instruction on one clear line in the lower portion.
Keep all character bars, the turn/ultimate/hint controls, and the board unobstructed by the plaque.

GESTURE:
Count board rows from the top and columns from the left.
Demonstrate swapping row 3 column 3, the blue ice gem, RIGHT with row 3 column 4, the blue-and-gold shield. This would complete three blue ice gems vertically in column 4.
Add thin, open-center golden outlines just inside those two cells, preserving symbol visibility.
Show one small ivory glove with a brass cuff, approximately 78x94 normalized units, fingertip near the destination cell center at approximately [417,1135].
A short, delicate amber motion stroke from approximately [311,1135] to [417,1135] communicates the rightward slide. Keep the palm offset below the stroke. One glove only; no duplicate ghost hands and no long arrow across the board.

NEW TEXT, EXACTLY:
"Đổi 2 ngọc cạnh nhau, xếp 3 cùng màu"
"1/8"
"Bỏ qua"

Use crisp dark-brown Vietnamese lettering with correct diacritics. No extra explanation or overlay words. Treat the lettering as the visual proof of a future HTML text layer.

No dimming, scrim, board-covering dialogue, changed gems, added combat effects, or altered underlying screen art. Only add the specified overlay pieces.
```