| View | Score | Verdict |
|---|---:|---|
| Phone, ready + claimed + chest sheet | **8.6/10** | Pass |
| Studio, 1920×911 | **8.5/10** | Pass |

The compact spacing improves the screen: the weekly quest card now fits comfortably, today’s gift stays inside its cell, and the claimed state reads clearly. The uninterrupted reward tray and drawn materials remain consistent with the approved direction. The chest sheet needs no visual rebuild.

One correction remains:

- **Day 28’s lock size is overridden.** In [calendar.css](/D:/Project/Gemwoven/src/gemwoven/calendar.css:26), `.cal-chest img` has higher specificity than `.cal-chest-lock`, so the lock inherits **42×30**, overriding its intended **20×24**. This contributes to the crowded chest/quantity cluster, especially in Studio. Change the lock selector to `.cal-chest > img.cal-chest-lock`, retaining its existing dimensions and position.

The [day-28 handler](/D:/Project/Gemwoven/src/gemwoven/calendar-ui.js:56) now correctly routes directly to chest details before the daily-claim path.

Before closing review, capture day 28 **today and claimable**, **chest ready**, and **chest claimed**. The supplied screenshots establish the locked sheet; the other combinations still need visual verification.

Read-only screenshot and source review; no files changed.