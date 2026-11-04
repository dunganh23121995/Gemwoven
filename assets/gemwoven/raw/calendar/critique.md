**1. Current row: 5/10.**

The wood, parchment and chest belong to the approved style. But it reads as a countdown to one chest, rather than a daily calendar. The progress bar cannot distinguish claimed, missed or future days, and the daily reward and claim action are absent.

**2. Proposed calendar block**

Use the existing **619-unit content column**, approximately **542 units tall**—225 CSS px on the phone. Keep one shared vertical scroller. The taller block moves weekly quests downward; surrounding artwork and preceding content retain their positions.

| Element | Specification |
|---|---|
| Header, 56 high | Drawn wooden **“Lịch 28 ngày”** plaque left; **“Ngày 3/28”** right; round **ⓘ** at the far right. |
| Gap, 8 | Exposed panel parchment. |
| Reward strip, 64 high | One shallow drawn tray: gold icon **500**, experience-book icon **10**, Ấn icon **80**, ticket icon **1**. Four equal groups; no resource names or repeated rewards inside cells. |
| Gap, 12 | |
| Grid, 320 high | **7 columns × 4 rows**, sequential days 1–28. Cells **81 × 74**, gaps **8** both ways: total width **615**, centred in the column. |
| Gap, 10 | |
| Daily button, 72 high | Wide drawn gold button: **“Nhận hôm nay”**. After claiming: subdued drawn button, **“Đã nhận hôm nay”**. |

Use shallow versions of image 2’s stitched parchment cards: bevelled bronze corners, warm paper and restrained shadows. Image 3 supplies the material richness. Avoid another heavy outer frame.

Day numbers are approximately **30 stage units**; reward quantities and button text **32–34**. Frames, stamps, locks and glow are drawn assets; all words and numbers remain HTML. Populate states and reward quantities from `calendarView()`, including its existing Ấn cap.

| Cell state | Visual treatment |
|---|---|
| Claimed | Warm parchment, drawn green check stamp below the readable day number. |
| Today, claimable | Bright gold rim, restrained amber glow and a small drawn gift icon. The wide button provides the clear claim action. |
| Missed | Muted parchment with a small faded brown crossed stamp. No red warning or glow. |
| Neutral, before account start | Plain parchment and a subdued readable number; no stamp or lock. |
| Future | Cooler, subdued parchment with a small drawn padlock. Number stays legible. |

**Day 28:** retain the same cell dimensions. Put **28** at the top and the purple chest below, with a small HTML **20** badge. Its chest lock, ready sparkle or claimed check is independent of the daily stamp. Claiming the daily reward must leave an available chest visibly available.

**Interaction:**

- Tap today’s ordinary cell or **“Nhận hôm nay”** to claim through the same `claimDaily('login')` used by Quán Bia. Both entrances immediately reflect the claim.
- Day 28’s cell opens chest details; the wide daily button claims that day’s ordinary reward separately.
- Other cells open a small date/status popover: **“Đã nhận”**, **“Đã lỡ”** with **“Không nhận bù”**, **“Trước khi bắt đầu”**, or **“Chưa mở”** with its opening date.
- Chest details show **“Rương ngày 28”**, **“20 mảnh tự chọn”** and its opening date. When available, **“Nhận rương”** opens the existing picker or voucher flow.
- ⓘ holds season dates, reset time, the shared Quán Bia claim and chest eligibility rules. Keep these explanations off the main block. No streak or day-7/14/21 bonuses.

**3. Mockup prompt**

A readable calendar needs more height than the current row. The prompt preserves the rest of the design while allowing weekly quests to flow downward.

```PROMPT_MOCK
Use case: precise-object-edit / high-fidelity game UI mockup.

Input images:
Image 1 is the EDIT TARGET: current-events-phone.png.
Image 2 is a STYLE REFERENCE only: current-events-top-phone.png, especially its approved novice-day cards.
Image 3 is a MATERIAL REFERENCE only: forge-rarity/mockup-2.png, especially painted wood, bronze bevels, parchment, gold buttons and reward sockets.

Edit image 1 so its existing “Lịch 28 ngày” progress-bar-and-chest row becomes the compact calendar specified below.

Preserve the original portrait screenshot dimensions, crop, letterboxing and 941×1672 stage scale. Keep the forest background, HUD, “Sự Kiện” heading, outer panel, back button, preceding novice cards and bottom navigation identical in appearance and position. Only redesign the calendar block. Allow the following weekly-quest content to move downward naturally inside the same existing scroll viewport; retain its original artwork, wording and scale, clipping it at the original panel boundary. Do not move or enlarge the outer panel or navigation.

Layout:
Use the existing content column, stage x≈161..780, width≈619.
Start where the old calendar header begins.
Total calendar height approximately 542 stage units:
- Header 56 high.
- Gap 8.
- Daily reward tray 64 high.
- Gap 12.
- Grid 320 high.
- Gap 10.
- Gold daily-claim button 72 high.

Header:
A shallow painted wooden plaque on the left reading exactly “Lịch 28 ngày”.
On the right, exactly “Ngày 3/28”, followed by a round bronze information button containing italic “i”.
Keep all three on one line without crowding.

Daily reward tray:
ONE shallow hand-painted parchment-and-bronze tray with four equal horizontal groups.
Show, in order:
gold coin icon + “500”;
experience-book icon + “10”;
Ấn resource icon + “80”;
ticket icon + “1”.
Use the game's existing resource identities.
No resource-name captions. No premium crystal reward.
Do not repeat these four rewards inside calendar cells.

Calendar grid:
Exactly FOUR rows and SEVEN columns.
Cells approximately 81 wide × 74 high in stage units.
Horizontal and vertical gaps exactly 8.
Grid width 615, centred in the 619-wide column.
Read left to right:
row 1: 1, 2, 3, 4, 5, 6, 7
row 2: 8, 9, 10, 11, 12, 13, 14
row 3: 15, 16, 17, 18, 19, 20, 21
row 4: 22, 23, 24, 25, 26, 27, 28

Use miniature versions of image 2's parchment day cards: shallow bronze bevels, warm paper, painted corner details and soft contact shadows. Keep the grid orderly and numbers readable.

Coherent example state: season day 3, account started on day 1.
Day 1: claimed, drawn green check stamp below its unobscured number.
Day 2: missed, muted parchment with a small faded brown crossed stamp.
Day 3: claimable today, luminous gold rim, restrained amber glow, small drawn gift icon below its number.
Days 4–27: future, subdued cool parchment and small drawn padlocks.
Day 28: same-sized future cell, number “28” at the top, purple-and-gold chest below, small “20” quantity badge and a small chest lock.
No extra rewards or special treatment on days 7, 14 or 21.

Below the grid:
One wide, richly painted gold button reading exactly “Nhận hôm nay”.
Use the same button material language as image 2.
No separate chest claim button in this screenshot; the chest opens details when tapped.

Typography:
Dark warm-brown Vietnamese serif matching the existing screen.
Day numbers approximately 30 stage units.
Reward quantities and button text approximately 32–34 stage units.
Render all specified text exactly with correct Vietnamese accents.
Words and numbers should look like clean HTML overlays, separate from the painted frames and stamps.

Remove the old progress bar, standalone chest row, “25 ngày” countdown and their calendar captions.
No open tooltip, modal, tutorial hand, explanatory paragraph, legend or additional banner.
No flat modern cards, CSS-like rounded rectangles or oversized new framing.
Preserve the existing hand-painted fantasy RPG finish and readable phone-scale hierarchy.
PROMPT_MOCK
```