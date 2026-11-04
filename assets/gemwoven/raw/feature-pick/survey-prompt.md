You are Codex, co-designer of Gemwoven (portrait match-3 combat RPG, web prototype, Vietnamese UI). Read-only review. Work from the repo root.

Owner rules that bind every proposal (AGENTS.md, docs/GAME_DESIGN.md §0):
- Premium Đá Ngọc is never awarded from gameplay, quests, events, offline, summons, mail gifts. Payment is a future server feature ("Sắp ra mắt").
- Hiro is the free starter: never buff him. All heroes/forms/bosses are art-locked (no hero redraws).
- Unreleased/online-only parts are marked "Sắp ra mắt"; local results are not global leaderboards; no fake players.
- UI must be drawn art (Codex image_gen) with HTML text on top; less text, pictures, details behind a tap.
- Contested design is built only when Claude and Codex agree.

Task: list features that are DESIGNED in docs/GAME_DESIGN.md (or clearly implied by owner requests in docs/REQUEST_TRACKER.md) but NOT built yet, and that can be built LOCALLY now (no payment, no real online PvP, no global leaderboards, no chat moderation backend, no account server).

1. Read docs/GAME_DESIGN.md and docs/REQUEST_TRACKER.md fully.
2. VERIFY each candidate against the code before listing it: src/gemwoven/progression.js (shared rules, engine at the bottom), src/gemwoven/liveops.js, src/gemwoven/world.js, src/gemwoven/*-ui.js modules, src/gemwoven/screens.js / expansion.js (hub screens), Game.html + src/*.js (combat), qa/gemwoven/check-depth.cjs. Say for each: what exists today (file + function), what is missing.
   Candidates to check at least (add others you find): vũ khí bản mệnh (signature weapon) + its banner + refinement 1–5 (§3, §9; `g.signature` flags exist in progression.js); trang phục / costumes (cosmetic; §10 says paid 199k, §8 says some for gems/events); 28-day login calendar (§11 "lịch đăng nhập 28 ngày"; today Sự Kiện has only a day-28 chest in memory-ui.js and the daily "Ghé thăm" quest); achievements beyond titles (Thành Tích); first-time tutorial / onboarding for a brand-new account (first 10 minutes: what to tap next, highlighted arrow; the plaza already has a Mèo Hướng Dẫn NPC); stage sweep "Quét ải 3★" (§10 monthly card perk, liveops VIP perks "Quét ải 3★ không cần vé quét"); team / second hero; event templates from the event studio running on the calendar (§11 templates; today progression.js saveEvent is coming-soon only); mail with event rewards; foe codex "Bách khoa quái"; bộ hệ set bonus (§3); Túi Đồ "Mở/Dùng" for chests, time cards (§7); sưu tập hình thái (§15); Boss Vô Hạn floor 60+ gems; "Bất lợi hệ" warning on stage card (round 13); anything else.
3. For each verified-missing feature give: player value (1–5, especially for retention of a new free player), effort (S/M/L/XL, counting rules + tests + hub UI + drawn art), local-buildable (yes/partly/no + why), risk against owner rules.
4. Rank by value/effort. Propose the TOP 2 to build now, with concrete rules for each (numbers, gates, where in the hub, what is drawn, what tests prove it, what stays "Sắp ra mắt"). Keep economy additions small and measurable; never Đá Ngọc; Hiro not buffed.
5. Note anything you think Claude would wrongly choose and why.

Output in English, markdown, concise but complete. Cite file:function for every "exists" claim.
