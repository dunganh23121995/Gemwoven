# Gemwoven development

- Hand image generation, and any deep image processing, to Codex. Climb the model ladder only when the result fails review: `gpt-6.1-sol` low -> medium -> high -> `gpt-6-astra` medium -> high (the ceiling). Keep mechanics, feature design, integration, and ordinary coding on the current model.
- Read the imagegen and applicable sprite skills before generating. Use built-in ImageGen; keep final assets and prompts in this repository. Preserve original raw sheets for reproducibility.
- Start a new account with Hiro only. Premium Đá Ngọc must never be awarded from gameplay, daily quests, offline accumulation, summons, or the event editor. Payment processing is a future server feature.
- Chapter elites fight as drawn (range, body sheets, a boss-staged first skill with art and sounds of their own): `docs/ELITE_SKILLS.md`. Boss kits stay exclusive to their boss, with one exception: a chapter's last elite plays its boss's ultimate on stage 45.
- Progression rules are shared by the hub and combat through `src/gemwoven/progression.js`. Avoid duplicating economy calculations in UI code.
- Keep unreleased features clearly marked Coming soon. Local PvP is not online PvP; local records are not global leaderboards. The event studio is a local configuration prototype, not an authenticated production admin.
- Keep generated hub HTML, ZIPs, QA images, dependency folders, and temporary reports out of Git. `Game.html` is an existing tracked entry point; preserve its current repository convention. Commit useful source art, runtime assets, source, tests, and dependency locks.
- Rebuild combat with `python build.py`; rebuild the hub with `python scripts/build_gemwoven.py`. Run `npm test` in `qa/gemwoven/runtime` after mechanics changes.
- Foes rest and take buffs in baked mesh rigs too: a new creature, elite or boss needs `python assets/gemwoven/rig_foes.py parts <id>` then `make <id>`; without a rig folder it falls back to its drawn sheets.
- New heroes, and new items for every hero, follow `docs/HERO_PIPELINE.md`; the checklist `docs/hero-checklist.json` (run `python scripts/hero_checklist.py`) feeds the hero studio's "Hạng mục tướng" grid.
- Growth, economy, live-ops and arena design lives in `docs/GAME_DESIGN.md` (Studio tab "Thiết kế hệ thống"); live-ops numbers in `src/gemwoven/liveops.js`. Measure balance changes with `node qa/gemwoven/balance-sim.cjs` before and after.
- After adding runtime art or sound, refresh the download packs with `node scripts/build_asset_packs.cjs` (`assets/packs.json`; `src/gemwoven/asset-packs.js` picks packs per account).
- The plaza (Trò Chuyện) talks to the social server `server/social` (Node + ws, port 8091; `npm install && npm test` there); shared rules in `src/gemwoven/social-protocol.js`, protocol in `docs/SOCIAL_PROTOCOL.md`. Contested design waits until Claude and Codex agree (`docs/GAME_DESIGN.md` §20); `docs/REQUEST_TRACKER.md` answers each owner request.
