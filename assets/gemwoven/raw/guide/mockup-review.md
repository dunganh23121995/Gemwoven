Both pass **as overlay art direction**. Approval excludes changes the generator made to the underlying screens. Files remain unchanged.

| Mockup | Score | Decision | Assessment |
|---|---:|---|---|
| **1 — Home** | **8.6/10** | **Approve** | The instruction, glove, and outline make Khám Phá unmistakable. Parchment, wood, brass, and the friendly cat match the hub. Control clearance must be checked against the real screen: the generator created room by moving the button and removing navigation items. |
| **2 — Fight** | **9.0/10** | **Approve** | The sky plaque clears the character bars and combat controls. Two outlined cells and a short arrow explain the adjacent swap. The glove slightly obscures the destination shield; use a smaller palm offset below the gesture. |

The build must preserve these constraints from [critique.md](/D:/Project/Gemwoven/assets/gemwoven/raw/guide/critique.md):

- **Home:** Keep the complete seven-item navigation, existing Khám Phá position, HUD, scenery, and hero unchanged. Place the compact dialogue above the actual button; anchor its outline and glove to the button’s measured bounds. Reduce the mockup’s neon glow.
- **Fight:** Preserve the battlefield, bars, controls, board geometry, and every gem. Keep the dialogue entirely within the available sky. The illustrated move is **R3C3 → R3C4**; runtime guidance uses `legalMoves()[0]`.
- **Both:** Reuse the existing cat bust. Render Vietnamese text and counters as HTML. Keep **1/8 until stage 1 is won**. No dimming or blocking backdrop; only the skip control receives overlay taps. Verify clearance on the phone and in Studio at **1920×911**.

One production sheet prompt:

```PROMPT_PIECES
Create ONE production asset sheet for Gemwoven’s Dẫn Đường tutorial overlay.

CANVAS: exactly 1536x1024 pixels, landscape.
BACKGROUND: perfectly flat, uniform pure magenta #FF00FF, for chroma-key extraction. No gradient, texture, vignette, floor, or background shadow.

REFERENCES:
Image 1, mockup-home.png, and Image 2, mockup-fight.png: references for the OVERLAY PIECES’ art style only. Do not reproduce either screen, its layout, characters, interface, or lettering.

STYLE:
Hand-painted chibi fantasy game UI matching the references: warm carved wood, softly textured ivory parchment, aged brass fittings, ivory leather gloves, restrained amber highlights. Crisp silhouettes and readable details at phone size. Front-facing UI artwork without perspective tilt. Consistent materials, lighting, and detail scale across all pieces.

Draw exactly SEVEN fully separate pieces. The identifiers below are instructions only and MUST NOT appear in the image.

A — Wide empty speech plaque, approximately 1000x250 pixels, about 4:1:
Ivory parchment with a warm wooden rim and modest brass corner fittings. A small integrated speech tail on its LEFT edge points toward an external cat. Large clean empty writing area. No attached badge, tab, cat, or glove.

B — Small empty brass counter badge, approximately 170x100 pixels, about 1.7:1:
Compact beveled brass frame with a dark warm-brown recessed interior, matching the mockups. Clean empty centre. No digits or symbols.

C — Small empty parchment-and-wood skip tab, approximately 220x100 pixels, about 2.2:1:
Ivory parchment interior, warm wood edging, small brass fittings. Fully independent from the speech plaque. No lettering or icon.

D — Ivory pointing glove with brass cuff, approximately 180x220 pixels:
Match the Home mockup’s soft illustrated glove and cuff. One extended index finger points diagonally DOWN-LEFT; curled remaining fingers, clear fingertip, readable silhouette. No arrow or target attached.

E — Matching ivory pointing glove with brass cuff, approximately 180x220 pixels:
Same hand design, materials, scale, and lighting as D. One extended index finger points straight DOWN for the board demonstration. No arrow or target attached.

F — Square thin golden open-centre target frame, approximately 220x220 pixels:
Rounded corners, uniform narrow border thickness, restrained amber glow. Small decorative details ONLY at the corners. Straight undecorated middle edge sections suitable for 9-slice stretching into a wide button outline. No centre fill, backing plate, crosshair, icon, or interior decoration.
The entire open centre must show exactly the same pure magenta #FF00FF as the surrounding background, so chroma-key removal produces a genuinely transparent hole. No checkerboard or simulated transparency.

G — Short amber curved motion arrow, approximately 240x100 pixels:
A delicate, shallow upward curve travelling LEFT TO RIGHT, ending in one clear right-facing arrowhead. Match the Fight mockup’s gesture stroke, with a small restrained golden glow. No glove, frame, gem, or trail duplicates attached.

LAYOUT:
Place the wide plaque across the upper area and arrange the six smaller pieces below it in a spacious, balanced asset-sheet layout. Keep at least 64 pixels of clear magenta between the complete visible bounds of every piece, including tails and glow, and at least 48 pixels from every canvas edge. Nothing may touch, overlap, merge, or be cropped.

No text, letters, numbers, labels, captions, logos, watermarks, characters, gems, scenery, extra objects, or assembled interface anywhere. All plaque and badge interiors remain empty. No magenta material or reflections on the assets. Preserve clean extraction edges.
```