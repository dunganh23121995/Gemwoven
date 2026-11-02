# Elites

Each chapter has five elites over its nine elite rounds (`ELITE_ROUNDS`, progression.js): stages 5, 10 the first, 15, 20
the second, 25, 30 the third, 35, 40 the fourth, 45 the last. An elite's first round is weaker (health and attack .9), stage
45 the strongest (1.1). They fight the way they are drawn, like small bosses. Data:
`src/gemwoven/world.js` (`ELITE_SKILLS`, `ELITE_BASIC`); staging, art and sounds: `src/foe-skills.js`
(`ELITE_BODIES`, `ELITE_LOOKS`); review: Studio tab "Tướng", picker "Đối thủ".

## How an elite fights

- **Range.** 55 of the 120 shoot or cast from where they stand (`reach:true`: bows, crossbows, staffs, censers, the gem orb,
  the key on its chain): they play their `attack` sheet in place and their own bolt flies level at the hero (`shot`). The
  other 65 run in with their weapon and strike on its reach (`lunge`), never a pounce. A staging fits the body: no elite
  flies, breathes or dives unless it is drawn to. Without art or with reduced motion a shooter still
  stays home (combat-v3.js `foeShoots`).
- **Basic blow.** Named per elite (`ELITE_BASIC`); the board's chain bonus and armour ledger count as for any attack.
- **Two skills.** The first is staged like a skill of a boss's kit (`echo` names it): same mechanic and staging, the
  elite's own art and sounds, played in its `skill` pose. The second keeps the chapter's signature burst with the elite's
  cast or attack pose. Chapters 1-14 pick by the fight like the bosses do (boss-tactics.js `chooseSkill`: no guard while
  armoured, a heal once hurt, the heavy blow after a charge). Phase fights (15-24) have no board turn, so an elite's
  rotation is blow, first skill, blow, second skill (world.js `tacticalElite`).
- **Weaker than the boss.** Effects at .68 of the hero's measure, statuses at .6, skill power under the boss's.
- **The last elite's ultimate.** On stage 45 alone the chapter's last elite adds its boss's ultimate (every boss has one)
  to its own blow and skills, played with the boss's own art and sounds at the boss's scale (`foeBorrowsUlt`). The body stays the elite's: it stands
  in its own skill pose and never flies, breathes, leaps or vanishes as the boss does (`foeBorrowedLook`); a status the
  ultimate grants still shows on it, so Ảnh Hồn Tiêu Biến's shade tells the hero that blows will miss. This is the
  one exception to a boss's exclusive kit; every other elite skill uses only the staging code, never a boss's sheet or
  recording.

## Art

- **Body** (`assets/gemwoven/elites/anim.py`): five 3x2 sheets over each master: `attack`, `skill`, `cast`, `hurt`,
  `defeat`, with their prompts and raw sheets beside them. Frames: 0 ready, 1 loaded wind-up, 2 on the way, 3 the peak (a
  bow looses at 4), 4 follow-through, 5 back to ready; `hurt` and `defeat` play straight through. Sheets stand on the
  idle's feet at its size (build.py; sprite-runtime.js `spriteBox`, `spriteInset`, as the bosses' poses do). The third to
  fifth elite of each chapter are designed in `assets/gemwoven/elites/roster2.py`, which also draws their master, idle and
  two fidgets; a fidget stays inside the idle's cell, since it plays in the idle's own box.
- **Effects** (`assets/fx/elites/skill_prompts.py`): one sheet per elite for its first skill, a bolt for those who shoot.
  A chapter's elites share a palette kept apart from the boss's kit and the gold-and-emerald signature burst.
  Packed strips and `fx.json` (with each grounded sheet's measured contact line) reach the game as
  `ART.bossFx['<elite>/<fx>']`.
- **Sounds** (`scripts/prepare_elite_sounds.py`, `ELITE_SOUNDS`): elites have no voices and share three sets by how they
  fight: bow, melee weapon, ranged magic. A blow and a skill's wind-up share one cue, a bow is heard drawn, loosed and
  landing, the first skill holds its wind-up through one long charge (`foeGather`), and a hit is heard on every blow that
  lands, so more arrows mean more hits; a cue's takes play in turn. A guard and a heal are shared by all. All from a pack
  made for games, "Fantasy SFX Pack Vol 1" by JC Sounds (CC BY 4.0, credited in the game's help dialog). The whole pack is
  kept in `assets/audio/sources/jc-fantasy-sfx` for later heroes and bosses.

## Kits

Legend: elite · blow · **first skill** (echo) staging · second skill staging. Run
`node -e "const W=require('./src/gemwoven/world.js');for(const [k,l] of Object.entries(W.ELITE_SKILLS))console.log(k,W.ELITE_BASIC[k].name,l.map(s=>s.name+'/'+s.move+(s.echo?'/'+s.echo:'')).join(' · '))"`
for the current table: `world.js` is the source of truth.

## Checks

- `npm test` in `qa/gemwoven/runtime` (check-boss-chapters.cjs: kits, echoes, ranges, every elite has its sheets and looks).
- `node qa/gemwoven/capture-elites.cjs [id ...]` films real fights and reports a shooter that moved or a melee elite
  that did not; `python qa/gemwoven/strip-elites.py <id>` montages the frames.
