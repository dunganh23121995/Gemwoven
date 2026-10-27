# Gemwoven development

- Hand image generation, and any deep image processing, to Codex. Climb the model ladder only when the result fails review: `gpt-6.1-sol` low -> medium -> high -> `gpt-6-astra` medium -> high (the ceiling). Keep mechanics, feature design, integration, and ordinary coding on the current model.
- Read the imagegen and applicable sprite skills before generating. Use built-in ImageGen; keep final assets and prompts in this repository. Preserve original raw sheets for reproducibility.
- Start a new account with Hiro only. Premium Đá Ngọc must never be awarded from gameplay, daily quests, offline accumulation, summons, or the event editor. Payment processing is a future server feature.
- Progression rules are shared by the hub and combat through `src/gemwoven/progression.js`. Avoid duplicating economy calculations in UI code.
- Keep unreleased features clearly marked Coming soon. Local PvP and practice are not online PvP; local records are not global leaderboards. The event studio is a local configuration prototype, not an authenticated production admin.
- Keep generated hub HTML, ZIPs, QA images, dependency folders, and temporary reports out of Git. `Game.html` is an existing tracked entry point; preserve its current repository convention. Commit useful source art, runtime assets, source, tests, and dependency locks.
- Rebuild combat with `python build.py`; rebuild the hub with `python scripts/build_gemwoven.py`. Run `npm test` in `qa/gemwoven/runtime` after mechanics changes.
- New heroes, and new items for every hero, follow `docs/HERO_PIPELINE.md`; the checklist `docs/hero-checklist.json` (run `python scripts/hero_checklist.py`) feeds the hero studio's "Hạng mục tướng" grid.
