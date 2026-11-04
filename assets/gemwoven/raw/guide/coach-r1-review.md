| Built view | Score | Decision |
|---|---:|---|
| Phone · 390×844 | **8.4/10** | Below 8.5 |
| Desktop · 1920×911 | **8.3/10** | Below 8.5 |

Against the **9.0 mockup**, the parchment, Vietnamese text and approved Miu bust fit Gemwoven well. Both layouts clear the health bars, combatants and controls. The phone before/after preserves the battlefield composition. Omitting the combat counter and skip is accepted under the updated brief.

The main shortfall is the swap demonstration: the phone capture has no readable glove; desktop shows a translucent hand over the destination gem. The mockup communicates the action more clearly.

Fixes, in priority order:

1. **Keep the glove opaque during the slide and destination hold.** In [combat-coach.css](D:/Project/Gemwoven/src/combat-coach.css:13), opacity is specified only at 100%, so it fades throughout the cycle. Set explicit full opacity through 80%, then fade during the return. Position the existing artwork by its **fingertip**, ensuring it touches A then B while the palm clears the gem faces.

2. **Recalculate visible overlay positions after layout changes.** [combat-coach.js](D:/Project/Gemwoven/src/combat-coach.js:25) measures rectangles only when showing the cue. Rotation or resizing leaves the fixed rings, arrow and plaque at stale coordinates. Refresh their geometry while visible.

3. **Treat a held pointer as active interaction.** The [busy check](D:/Project/Gemwoven/src/combat-coach.js:35) omits the combat `pointer`. A press held beyond six seconds can bring guidance back beneath the finger. Suppress it throughout the gesture and restart idle timing on release/cancel.

4. **Make the rings lighter and more continuous.** Their thick, ornamental corners compete with the shield artwork. Thin the border and retain a clear outline around both cells, closer to the mockup.

These are screenshot and source-review scores. Timing, dismissal and the ultimate message were inspected in code, not exercised live. No files changed.