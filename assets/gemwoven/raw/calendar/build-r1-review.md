| View | Score | Verdict |
|---|---:|---|
| Phone, ready + claimed | **8.3/10** | Below 8.5 |
| Studio, 1920×911 | **8.2/10** | Below 8.5 |

The drawn parchment, bronze edges, uninterrupted reward tray and clear daily action closely match the approved direction. The claimed state reads well. Preserving the real panel geometry and letting weekly quests clip inside its scroller is correct.

Fixes in priority order; dimensions below are **941×1672 stage units**:

1. **Always open chest details when tapping day 28.** The [handler](/D:/Project/Gemwoven/src/gemwoven/calendar-ui.js:57) currently claims the daily reward first when day 28 is today and claimable. Remove that exception; its ordinary reward belongs to the wide daily button. Image 3 demonstrates the correct locked sheet, but doesn’t exercise this case.

2. **Finish day 28’s independent chest state.** Its missing lock repeats an explicitly rejected mockup defect. The small corner “28” and edge-hugging “20” also become cramped in Studio. Within the existing **81×74** cell:
   - Raise “28” from **23 to 28–30**.
   - Reduce the chest from **58×42 to approximately 42×30**.
   - Add a distinct **20×24** lock before opening; retain the ready sparkle and chest-claimed check independently of the daily stamp.
   - Keep the **22-unit** quantity badge fully inside the frame with at least **4 units** clearance.

3. **Restore the specified compact vertical rhythm.** Shared styles override the calendar’s intended dimensions: the header’s summary enforces **88**, and the button enforces **100**. The resulting stack is approximately **612 high**, versus **542 specified**. Apply calendar-scoped overrides for **header 56, tray 64, grid 320, grid-to-button gap 10, button 72**. Preserve the **615-wide grid**, **81×74 cells** and **8-unit gaps**. This recovers roughly **70 units** for weekly content.

4. **Contain today’s gift.** Its current flow requires **77 units inside a 74-unit cell**, letting the gift touch or cross the lower rim. Use approximately **30×30**, positioned at **y=38** within the cell; keep the amber glow contained. Preserve the pale claimed parchment and restrained missed stamp.

The existing chest sheet needs no visual rebuild. These scores reflect screenshot and source review; no files were changed.