**Keep both features, in that order.** I read the survey and checked the named modules. In-memory engine checks confirmed the costs, rewards, gates, and chest behavior; the existing `check-depth.cjs` passes. No files changed.

Under the owner rule, the fixes marked **Disagree** still need Claude’s acceptance before being recorded as jointly agreed.

**1.1 — Agree.** Keep progression rules and persistent state in `progression.js`, overlays in `guide-ui.js`/`guide.css`, and combat presentation in `combat-coach.js`. `guideView(p)` should be a pure projection; durable progress belongs in engine synchronization/transactions. These guide APIs are new work.

**1.2 — Disagree + the fix.** Keep all eight goals and their order, with these precise semantics:

- Check satisfied predicates throughout the sequence and latch their IDs in `guide.done`. Previously resolved steps never reopen.
- Evaluate optional bypasses **only when that step becomes current**. Otherwise a fresh account’s zero tickets would bypass summoning before the visit/newcomer rewards arrive. Define `done` as *resolved step IDs*, including these optional bypasses.
- **win1:** the actual path includes the **world atlas → chapter 1 → stage-1 seal → Khiêu Chiến**. Home opens the atlas. [Navigation](D:/Project/Gemwoven/src/gemwoven/journey-ui.js:387)
- **visit:** latch any directly recorded successful login claim, including one made before this step becomes current. Preserve that evidence across daily reset. Old saves cannot reliably prove every historical claim.
- **newbie1, level, win3:** agree. Level 1→2 costs **62 gold, 3 books, 7 seals**. Fresh accounts have 1,200 gold and 12 books, but **zero seals**; stage 1 supplies 80 listed seals. Newcomer day 1 supplies 2 tickets, 2,000 gold, and 10 Hiro fragments. [Progression rules](D:/Project/Gemwoven/src/gemwoven/progression.js:125)
- **summon:** guide ×1 only while a ticket is available, including its confirmation. Stop guiding if the quote becomes a gem payment. Existing confirmation automatically offers Đá Ngọc when tickets are insufficient, so highlighting ×1 alone is insufficient protection. [Confirmation](D:/Project/Gemwoven/src/gemwoven/journey-ui.js:284)
- **gear:** require an equipped ID that resolves to a real owned item. The existing slot picker and “Mặc tốt nhất” are valid routes. [Equipment UI](D:/Project/Gemwoven/src/gemwoven/equipment-ui.js:22)
- **win5:** five clears resolves this goal; the guide finishes only after **all eight steps are resolved**. Clearing stage 5 early must not discard unresolved mandatory goals.

**1.3 — Agree.** Apply the silent completion migration only when `p.guide` is absent and `cleared ≥ 5`. Suppress its closing line. Saves below five clears start from their first unresolved goal. Later loads must preserve an already initialized guide.

**1.4 — Disagree + the fix.** Show lessons after natural or migrated completion; suppress them while skipped. During the main guide, queue them so only one instruction appears at a time. Replay clears the skip preference.

Level 10 unlocks passive eligibility, but learning still costs resources: the first passive rank costs **1,800 gold and one skill book**. Select an eligible owned hero and its **passive node** before pointing to “Học”; never point at a disabled button. If already learned, resolve the lesson silently. Forge opens uncommon/Tốt crafting after stage 20, but unlocking does not imply affordability; teaching its preview is sufficient. Record a lesson after dismissal or successful completion. [Skill rules](D:/Project/Gemwoven/src/gemwoven/progression.js:166), [skill UI](D:/Project/Gemwoven/src/gemwoven/art-screens.js:69), [forge rules](D:/Project/Gemwoven/src/gemwoven/progression.js:348)

**1.5 — Disagree + the fix.** Agree with the existing cat, drawn plaque/glove/ring, HTML text, no dim, and one target. There are **eight goals**, so use a fixed `/8` counter, including resolved optional steps.

Replay means **resume from the first unresolved goal**. A completed account has no main steps to resume; show “Hướng dẫn đã hoàn tất” instead of inventing an active replay. Overlays must follow scrolling/resizing, avoid covering controls, and respect reduced motion.

**1.6 — Disagree + the fix.** Keep the concept and delays, but specify:

- Store eligibility on the **pending encounter**, tied to its token; validate campaign stage 1, current `win1`, and skip state when combat loads/resumes.
- Use `legalMoves()[0]`, matching the existing hint button. Do not invoke its click handler, which also changes selection and messages. [Hint implementation](D:/Project/Gemwoven/src/game.js:478)
- Show after 1.5 seconds of eligible idle time: player turn, unlocked board, no drag or modal. Repeat after six seconds until the first successful player match; hide immediately on interaction.
- Observe the first actual energy threshold/ultimate reservation event. Polling `state.energy` can miss it because combat immediately subtracts 100 when queueing an ultimate. [Ultimate queue](D:/Project/Gemwoven/src/live-combat.js:9)
- Use short copy such as “Đổi 2 ngọc cạnh nhau, xếp 3 cùng màu” and “Đủ 100 nộ: tuyệt kỹ tự tung”. The energy message appears once if reached.
- Hooks must add no awaited delay, pause, RNG call, or combat mutation. Defeat/retry remains ordinary gameplay.

**1.7 — Agree.** No guide rewards, premium grants, Hiro changes, hero redraws, or Home/Summon art changes. Guided actions retain their existing costs and rewards.

**1.8 — Disagree + the fix.** Keep the proposed tests, with these additions/corrections:

- Test zero-ticket/no-gear bypass **when reached**, not during initial evaluation.
- Test persisted completion after spending tickets, unequipping gear, and crossing midnight.
- Skip→replay becomes active again only when unresolved main goals remain.
- Compare guided versus manual sequences for identical wallet, materials, fragments, progression, and ordinary reward side effects. “Guide never changes wallet” cannot mean legitimate guided claims/upgrades leave balances unchanged.
- Cover reload, defeat/retry, stale encounter flags, ticket loss before confirmation, and one-shot energy/lesson messages.
- Include the phone path through atlas, stage preview, summon confirmation, and equipment picker.

**1.9 — Agree.** Mockup approval before coding; drawn pieces; score **≥8.5/10** at 390×844 and Studio 1920×911. Include the combat coach and calendar in the review, not just Home.

**2.1 — Agree.** Four rows × seven columns, using `passSeason` and the existing **2 November 2026, 00:00 GMT+7** anchor. These are season days, not days since account creation. Calendar dates/states must come from the engine’s guarded effective time. [Season definition](D:/Project/Gemwoven/src/gemwoven/liveops.js:58)

**2.2 — Agree.** Only **today’s** daily reward is claimable. Both entrances call the same `claimDaily('login')`; that transaction also records today’s calendar stamp. Preserve the existing **500 gold, 10 books, 80 listed seals, one ticket**, seal cap, **one weekly increment, 50 pass points**, and other existing transaction side effects. Use `dailyRewardPreview` for capped reward presentation. [Claim transaction](D:/Project/Gemwoven/src/gemwoven/progression.js:813)

**2.3 — Disagree + the fix.** Preserve the proposal, plus:

- Add tracking-start metadata alongside `{season,days}`. Migration must distinguish **unrecorded history** from known missed days.
- Seed a claim only from reliable saved evidence, such as `daily.date` with `login` claimed. Never infer earlier attendance from progression.
- Day 28 contains **its ordinary daily reward plus a separate seasonal chest claim**. Neither claim consumes the other.
- Preserve existing chest eligibility: 20 fragments for an owned, non-Hiro hero below 6★; otherwise a permanent voucher. No attendance streak requirement.
- Preserve the existing unclaimed-chest rollover-to-voucher behavior exactly. “No catch-up” applies to ordinary daily rewards. [Chest and rollover rules](D:/Project/Gemwoven/src/gemwoven/progression.js:721)

**2.4 — Agree.** Use the drawn states and HTML text. Give unknown history/before-account dates a neutral label rather than a false “missed” stamp. Day 28 must visibly distinguish daily-claim state from chest-claim state.

**2.5 — Disagree + the fix.** Keep these tests and add migration, late joining, GMT+7 midnight, clock rollback, capped seals, weekly/pass side effects, and independent day-28 claims/voucher rollover.

For 28 daily claims, baseline totals remain **14,000 gold, 280 books, 2,240 listed seals subject to caps, and 28 tickets**, plus the unchanged existing chest entitlement. No extra milestone rewards or Đá Ngọc.

For §20, the consolidated rule list to ratify is:

1. Build **Dẫn Đường first, then Lịch 28 ngày**. Neither feature adds rewards or changes combat balance.
2. Guide state is `{v:1,skipped:false,done:[],lessons:[]}`. `done` stores resolved main-step IDs, including optional bypasses. Engine synchronization persists progress; UI reads shared rules.
3. Main order: **win1 → visit → newbie1 → level → win3 → summon → gear → win5**. Predicates respectively require one campaign clear, a recorded login claim, newcomer day-1 claim, any owned hero level ≥2, three clears, one lifetime summon, one valid equipped item, and five clears.
4. Satisfaction is latched regardless of action order. At their turn, bypass summon with zero tickets and gear with no owned gear. Finish after all eight steps resolve; give one closing line and no reward.
5. Existing saves without guide state and with ≥5 clears finish silently. Other saves resume their first unresolved step. Skip suppresses guide and lessons; replay clears skip and resumes unresolved work without resetting gameplay or completion records.
6. Teach passive learning at level 10 and forging after stage 20, one lesson at a time after main-guide completion. Respect eligibility and affordability; dismissal/completion records each lesson once.
7. Use the approved cat and drawn, non-blocking plaque/glove/ring, HTML copy, no dim, one target, and a fixed `/8` counter. Preserve approved hero, Home, and Summon art.
8. Stage-1 combat coaching uses validated pending-encounter eligibility, the existing first legal hint move, 1.5-second initial idle and six-second reminders until a successful match, plus one actual full-energy explanation. It changes no combat state, randomness, or timing.
9. The calendar uses the shared 28-day season and GMT+7 reset. Both claim entrances share today’s single `claimDaily('login')` transaction, reward preview, claim state, calendar stamp, caps, and side effects.
10. Track unique claimed season days and the start of reliable history. Known missed daily rewards remain missed; unknown historical dates remain neutral. Add no catch-up, streak requirement, or day-7/14/21 bonus.
11. Day 28 retains its ordinary daily reward and independent existing 20-fragment chest, eligibility, permanent voucher fallback, and unclaimed-chest rollover behavior.
12. Validate save migration, order independence, bypass timing, reload/retry, duplicate prevention, time boundaries, and economy equivalence. Approve mockups before coding and require ≥8.5/10 phone/Studio review; retain prompts/raw art, rebuild both entries, run the runtime suite, and refresh asset packs after runtime art additions.

**#2 is worth building.** It makes existing daily value and season progress visible without inflating the economy. I would keep it as a compact extension of Sự Kiện rather than swap it for another survey item.