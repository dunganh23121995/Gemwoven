| View | Round 2 | Decision |
|---|---:|---|
| Phone | **8.7/10** | **Pass** |
| Desktop 1920×911 | **8.6/10** | **Pass** |

The opaque glove now communicates the swap clearly, and the thinner rings preserve gem readability. The parchment and Miu remain consistent with the approved art and clear the combat HUD. The ultimate explanation is readable without the name-banner collision.

Source review confirms full opacity through the destination hold, held-pointer suppression, release/cancel idle resets, and explanation timing after the ultimate completes.

Remaining fixes, non-blocking:

1. **Resize the ultimate explanation too.** The [resize handler](D:/Project/Gemwoven/src/combat-coach.js:17) rebuilds only `shown==='move'`; rotating during the 3.2-second explanation leaves its plaque at stale coordinates.
2. **Fine-tune fingertip centering.** It still lands below the gem centre in both captures. The [vertical placement](D:/Project/Gemwoven/src/combat-coach.js:32) targets `.72` of the cell height; calibrate against the artwork’s actual fingertip so both holds touch the centre.

Scores are based on screenshots and source inspection; animation and rotation were not exercised live. No files changed.