The workspace is read-only, so I couldn’t save an output file. Below is the complete brief, intended for `assets/gemwoven/raw/plaza-ui/art-direction.md`.

**A. Current-state critique — 4/10 against the approved screens**

The plaza map belongs to Gemwoven. Its interface lacks the painted construction and material hierarchy of Forge, Inventory, and Shop.

- **Rule violations:** CSS draws the header, back button, sidebar tiles, sheets, tabs, rows, inputs, badges, toggles, bubbles, joystick, arrows, ticker, and toasts. Existing illustrated action buttons don’t resolve the surrounding containers. Emoji emotes and guild emblems introduce another visual style.
- **Phone readability:** speech bubbles overlap names and each other; long explanations dominate sheets; chat-log text and metadata become tiny. Forms waste space while crowding labels. The large close button competes with content.
- **Hierarchy:** friends, guild, emotes, and secondary utilities receive identical treatment. Empty states resemble unfinished forms. The composer reads as a brown strip with web controls.
- **Studio:** scaling makes these shortcomings more visible beside the richly illustrated approved screens.

**B. Design direction**

Build a **town messenger’s kit**: honey-brown signboards, aged brass clasps, stitched leather labels, warm parchment, small lantern fittings, and restrained ivy. Stone belongs mainly to the map and sparring symbol. Keep the fountain and walking space visually dominant.

Reuse the **painted leafy settings popup frame** for every sheet. Give it a separate wooden title plank and brass close fitting. Use the same construction for short cards and tall lists; stretch quiet parchment and straight edges, never decorative corners. Avoid commissioning a competing popup style.

| Element | Direction |
|---|---|
| Header | Compact wooden place sign; separate leather channel strip and painted green/amber/red lantern indicator. Brass back medallion. |
| Right column | Four small wooden hanging plaques with separate painted icons: companions, guild crest, smiling guide-cat face, satchel of tools. Short labels and wax-seal count badges. |
| Context action | Brass-ended leather action plate with a separate gate, lantern, crossed practice swords, or notice-board icon. |
| Names | Quiet narrow wooden plates. Own plate: blue clasp; friend: green friendship knot; guild mate: brass crest. Marks can coexist. Gold `[ABC]` remains HTML text. NPCs receive a small parchment `NPC` pennant. Preserve existing rarity title art. |
| Bubbles | Light parchment with a restrained painted rim and separate tail. Maximum two lines; prevent collisions. Longer messages remain in the log. |
| Movement | Thin painted brass joystick ring and leather thumbpiece, shown during dragging. Off-screen directions use painted arrowheads with friendship/guild marks. |
| Ticker/composer | Dark leather-backed message rail above a shallow wooden writing ledge. Separate parchment input, channel tab, and illustrated send plate. |
| Rows/tabs | Reuse cream row plates and wooden tabs. Active tabs use a painted brass clasp; inactive tabs use darker wood. Avoid framing every text fragment. |
| Fields/toggles | Painted recessed parchment fields; transparent HTML inputs above them. Drawn brass switch tracks and movable knobs; selection, error, disabled, and pressed appearances come from art variants. |
| Icon tiles | Reusable leather-backed sockets with separate illustrations. Emotes use the guide cat’s expressions, replacing emoji. |

Retain the shared HUD, map, actors, portraits, lantern artwork, existing title plates, wooden tabs, parchment panel, leafy nameplate, cream row plate, Forge leather tag, and existing illustrated buttons wherever suitable.

Preserve all features through these compact layouts:

- **Profile/my card:** portrait, name, hero, level, stars, power; three primary actions. Keep guild invitation visible when applicable. `Thêm` reveals heart, block, and report. Put the appearance explanation behind a tap.
- **Friends/nearby/channels:** shared portrait or symbol rows, short status, clear action fittings. Requests and blocked players use the same row system.
- **Guild:** find/create tabs; stacked single-line name and tag fields; twelve painted emblem choices. Inside a guild, retain all five tabs in a horizontally scrolling wooden rail, emblem, level meter, notice, check-in, members, applications, activities, and log.
- **Lantern:** large existing lantern illustration, three distinct thread spools with counts, weave actions.
- **Chat log/board:** shared rows and tabs; recruiting notices and illustrated calendar entries. Details open on tap.
- **Help:** guide-cat portrait, six illustrated short rules; tap each for explanation. Three drawn toggles retain their current settings.
- **Name entry:** guide-cat greeting, one field, `Vào Quảng Trường`.
- **Emotes/Thêm:** eight expression tiles / four utility tiles.
- **Duel invite:** paired portraits, practice swords, `Nhận` and `Để sau`; clearly state `Đấu bản sao · Không thưởng`. Toasts use a small leather message plate.

Use approximately **36–40 logical pixels for ordinary text**, 44–48 for sheet titles, and **108-pixel minimum touch targets**. At 390 px wide, these correspond to roughly 15–17 px text and 45 px targets. Long names truncate or expand on tap.

Sheets replace the composer while open. During typing, preserve the existing keyboard behavior: shrink the map, keep the hero visible, and hide competing controls.

**C. Exact ImageGen prompt — Mockup 1**

```text
Use case: ui-mockup.
Create ONE finished art-direction mockup of Gemwoven’s redesigned Gặp Gỡ plaza, a portrait mobile match-3 RPG.

OUTPUT
One opaque 2:3 portrait image, ideally 1200×1800.
Center a complete 941×1672 logical game screen, scaled proportionally to approximately 1013×1800. Extend only plaza scenery into the narrow side margins. Keep all interface elements inside the central screen.
No phone device, browser, Studio toolbar, sidebar, annotations, or alternative designs.

REFERENCES
01-main.png and studio-main.png: existing plaza geography, actors, and shared resource HUD only; replace their plaza interface.
studio-upgrade.png, studio-inventory.png, studio-shop.png, phone-forge.png, forge-mockup.png: strict references for painted craftsmanship and typography.
chrome.png: reusable material and frame vocabulary.
Do not reproduce the current cream web-style boxes.

ART DIRECTION
Cozy hand-painted chibi fantasy. Warm timber signs, worn leather, aged brass, soft parchment, restrained ivy, small lantern fittings. Clear silhouettes, readable surfaces, modest ornament.
Every visible control surface, frame, plate, icon, badge, and bubble must look individually painted.
Words and numbers represent crisp HTML overlays, not lettering engraved into production assets.

STATE
Existing account, online. Your hero and TWO other nearby live players: THREE people total. Preserve the existing shared HUD portrait, level, balances, and mail exactly.
One chat bubble only. Two ticker lines. Composer empty. No keyboard, sheet, bottom navigation, or joystick at rest.
The context action “Sẵn sàng giao hữu” is visible because your hero is beside the sparring ring.

LAYOUT
Coordinates below refer to the central 941×1672 logical screen, origin top-left.

Y 0–150:
Preserve the shared resource HUD.

X 20–130, Y 174–284:
Painted brass-and-wood back medallion with “‹”.

X 144–764, Y 166–294:
Compact wooden sign reading “Gặp Gỡ · Quảng Trường”.
Below it, a separate dark leather channel strip, tiny green lantern light, and “Kênh 1 · 3 người”.
Keep the full place name readable.

X 779–923:
Four separate 144×140 wooden hanging plaques at Y 330, 486, 642, 798.
Generous painted icons above short labels:
“Bạn bè”, paired companions, wax badge “2”;
“Bang hội”, guild crest, wax badge “1”;
“Biểu cảm”, smiling guide-cat face;
“Thêm”, small utility satchel.
Icons share the same painted style. No emoji.

Y 300–1270:
The map remains the main visual.
Recognizable stone fountain centrally, guild gate toward the top, notice board left, practice ring right, market stalls, lanterns, and guide cat lower-left.
Frame the existing square toward its sparring area without changing its geography.
Show your hero near the ring around X 610, Y 1180; nearby players around X 320, Y 1110 and X 700, Y 1060.
Keep bodies, nameplates, and walkable ground readable.
Names: your hero “Lữ Khách Vân”, players “Kiếm Sĩ Lam” and “Hoa Mai”.
Use quiet painted nameplates: your blue clasp, a green friendship knot, and a brass guild crest. Gold “[ABC]” beside a guild member’s name. Preserve existing worn-title plate artwork.
The guide cat has a small “NPC” pennant.
One parchment speech bubble above Kiếm Sĩ Lam: “Chào mọi người!”
Do not overlap names, actors, sidebar, or other text.

X 365–915, Y 1284–1396:
One substantial leather-and-brass action plate, separate painted practice-swords icon, exact text “Sẵn sàng giao hữu”.

X 20–921, Y 1408–1512:
A shallow dark leather ticker rail, two readable lines with separate small parchment channel tags:
“Bang” — “Hoa Mai: Gặp ở Sảnh Bang nhé!”
“Hệ thống” — “Kiếm Sĩ Lam vừa vào.”
Leave text padding and breathing room.

Y 1522–1672:
A shallow painted wooden writing ledge, not a flat brown strip.
At Y 1542–1652:
X 20–204: wooden channel selector “Khu vực” with small downward chevron.
X 220–760: recessed parchment input, placeholder “Nhắn gì đó…”, counter “0/120”.
X 776–921: illustrated brass send plate with folded-letter icon and “Gửi”.
Keep text-entry space quiet and generous.

FINISH
Warm readable serif labels, correct Vietnamese accents, ordinary text approximately 36–40 logical pixels.
All lettering stays inside clean safe areas.
Match the approved screens’ craft without excessive gold, bloom, or decoration.
No repeated cream rounded rectangles, CSS-looking cards, emoji, tiny instructions, oversized panels, or bottom navigation.
```

**D. Exact ImageGen prompt — Mockup 2**

Choose **friends**: it tests the reusable sheet, tabs, portraits, list rows, status marks, and action fittings together.

```text
Use case: ui-mockup.
Create ONE finished Gemwoven plaza mockup with the FRIENDS sheet open.

OUTPUT
One opaque 1200×1800, 2:3 portrait image.
Center the complete 941×1672 logical screen at approximately 1013×1800; extend only scenery into side margins.
No device, browser, Studio chrome, annotations, or alternative panels.

REFERENCES
Use Mockup 1 as the exact plaza, HUD, material, and layout reference.
Use chrome.png’s painted leafy settings popup frame, wooden tabs, and cream row plate.
Match forge-mockup.png and the approved Inventory and Shop screens’ craftsmanship.

PRESERVE
Keep the HUD at Y 0–150 unchanged.
Keep the same online plaza, three people total, header, actors, fountain, and sidebar above the sheet.
Apply only gentle dimming to the exposed map; keep the HUD readable.
The sheet replaces the composer and covers the context action and ticker.

SHEET
Logical bounds: X 18–923, Y 852–1672.
Use the existing painted leafy popup construction: warm parchment center, timber edges, restrained ivy and brass corner fittings.
Keep ornament away from content. The paper must be quiet enough to read.
No plain cream CSS rectangle.

HEADER, Y 874–980
A separate wooden title plank reading “Bạn bè”.
A separate brass close medallion at X 784–892, Y 874–982, with crisp “×”.
Keep title and close control distinct.

TABS, Y 990–1098
Three painted wooden tabs across X 48–893:
“Bạn bè 3/50”, “Lời mời”, “Đã chặn”.
Select the first using a warm brass clasp and lighter wood.
No orange web-form pills.

THREE ROWS
Cream painted row plates at:
X 48–893, Y 1116–1276;
X 48–893, Y 1290–1450;
X 48–893, Y 1464–1624.

Each row has:
A separate brass portrait socket, approximately 96×96, at X 68.
Name and one short status line starting at X 184, kept within X 504.
Three separate 108×108 action fittings at X 534, 654, 774:
painted walking boots with destination pin;
painted sealed letter;
painted heart token.
Use recognizable illustrations, no emoji and no tiny action captions.
A small painted lantern beside status reinforces online/offline state.

Row 1:
Portrait of Kiếm Sĩ Lam.
“Kiếm Sĩ Lam”
“Kênh 1 · Gần bạn”
Green lantern. All three actions available.

Row 2:
Portrait of Hoa Mai.
“Hoa Mai”
“Kênh 2 · Đang chơi”
Green lantern. All three actions available.

Row 3:
Portrait of Mộc Miên.
“Mộc Miên”
“Ngoại tuyến”
Unlit lantern. Walking and letter fittings visibly inactive using subdued painted variants; heart token remains available.
Keep the name and portrait readable.

FINISH
Text is a crisp HTML-overlay simulation; production art will contain no words or numbers.
Names approximately 40 logical pixels, status and tab labels 36, title 48.
Consistent alignment, generous touch targets, fully visible final row.
No explanatory paragraphs, nested cards, oversized empty areas, bottom navigation, or competing dialog.
```

**E. Separate production pieces**

Sizes below are approximate **logical pixels**. Each named piece is exported separately. Generate text-free art with transparent surroundings, generous gutters, and retained raw sheets/prompts. Keep ornaments outside stretch zones.

| Generation group | Separate pieces and purpose | Size / treatment |
|---|---|---|
| **1. Plaza controls** | `place-sign`; `channel-strip` | 620×76; 620×52 — horizontal 9-slice |
| | `back-medallion`; `sidebar-plaque`; `count-seal` | 108²; 144×140; 52² — fixed |
| | `context-plate` | 550×112 — horizontal 9-slice |
| | `ticker-rail`; `composer-ledge` | 901×104; 941×150 — 9-slice |
| | `channel-tab`; `writing-field`; `send-plate` | 184×110; 540×110; 145×110 — 9-slice |
| **2. Shared sheet fittings** | Reuse leafy popup frame, wooden header, cream row plate | Target 905×820; 560×100; 845×160 — 9-slice with fixed ornaments |
| | `close-fitting`; `portrait-socket` | 108²; 112² — fixed |
| | `tab-idle`, `tab-selected`; `action-primary`, `action-secondary`, `action-danger`, `action-disabled` | 270×108; 250×108 — horizontal 9-slice |
| | `icon-socket`; separate `selection-clasp` | 108² — fixed |
| | `form-field`, `form-field-error`; `notice-paper` | 780×108; 780×150 — 9-slice |
| | `switch-track`; `switch-knob` with on/off variants | 128×64; 56² — fixed |
| | `progress-trough`; `progress-fill`; `channel-tag` | 500×36; 440×20; 140×44 — horizontal slice/repeat |
| | `invite-panel`; `toast-plate` | 780×320; 680×108 — reuse parchment frame / leather tag |
| **3. World overlays** | `nameplate` variants: ordinary, own, NPC | 300×56 — horizontal 9-slice |
| | `friend-knot`; `guild-crest`; `npc-pennant`; status lanterns green/amber/unlit | 40²; 40²; 64×32; 32×40 — fixed |
| | `speech-paper`; separate left/right tails | 420×160 — 9-slice; 40×36 — fixed |
| | `joystick-ring`; `joystick-thumb`; `walk-marker` | 190²; 84²; 72×36 — fixed |
| | `direction-arrow`; `arrow-name-tag` | 64² fixed, rotatable; reuse nameplate |
| **4. Social symbols** | Friends, guild, expressions, utilities; gate, lantern, practice swords, notice board | Each 96² — separate fixed icons |
| | Boots/pin, letter, heart, nearby people, channels, chat log, help, invite, block, report, check-in | Each 80² — separate fixed icons |
| | Eight guide-cat emotes: wave, laugh, like, cheer, thinking, sad, angry, challenge | Each 128² — fixed, arrange 4×2 |
| | Twelve guild emblems: sword, shield, crown, gem, moon, sun, leaf, flame, wave, star, owl, fox | Each 96² — fixed, arrange 4×3 |
| **5. Guide and activity details** | Three thread spools matching existing lantern colours | Each 112² — fixed |
| | Six help illustrations: walk, chat, meet, spar, guild, board | Each 128² — fixed |
| | Recruiting pennant; calendar leaf; empty mailbox | 128²; 128²; 200×160 — fixed |

Reuse existing hero faces, guide-cat portrait, weaver, lantern tiers, star art, and rarity title plates. Generate new control states as separate painted variants; keep all labels, counts, notices, and form content in HTML.

Approval target: **at least 8/10 on both a 390×844 phone viewport and Studio at 1920×911**, judged against these mockups and the approved screens.