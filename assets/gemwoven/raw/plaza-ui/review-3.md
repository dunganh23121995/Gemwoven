**Phone: 7/10. Studio: 7.5/10. Neither passes yet.** The main gaps are player separation, readable type, and unfinished composer integration.

Fixes in impact order; sizes below use the **941×1672 frame**:

1. **Separate overlapping players and their labels.** In main/context, the two players merge into one silhouette; bubbles float far above their speakers. Add collision avoidance for nameplates/bubbles, keep tails anchored, and provide selection between stacked players. Keep the context button clear of bodies.

2. **Finish the composer and fully replace it with sheets.** The input appears as a flat cream rectangle spilling over its painted socket; its bottom edge remains visible beneath Friends. Make the HTML input transparent, inset text/counter inside the parchment, and hide the entire composer while any sheet is open.

3. **Raise text sizes across sheets.** Friends statuses, help explanations, board entries and duel terms are substantially smaller than the targets. Use **36–40** for reading text, **40** for names and **46–48** for titles. Shorten copy or scroll instead of shrinking it. Keep **“Đấu bản sao AI · Không thưởng”** immediately readable.

4. **Enforce separate ≥108×108 hit areas.** Current tabs are 96 high, close/composer controls 100, and several actions 104; the channel strip is only 62. Enlarge their interactive bounds without overlaps. Include switches, disclosure rows and duel responses.

5. **Give Friends enough height for that sizing.** Raise its top toward **Y850–900**, with roughly **180–200-high rows** and three **108-square** actions. Preserve real friend counts; extra sample players are unnecessary.

6. **Recompose guild creation.** Stack name/tag fields and arrange emblems **4×3**, replacing the cramped side-by-side fields and **6×2** grid. Make the scrolling guild tab rail visibly discoverable.

7. **Use painted disabled states throughout.** Disabled tiles and switches still rely on grayscale/opacity filters in the stylesheet. Wire separate painted variants for unavailable, already gifted and off states; preserve readable labels.