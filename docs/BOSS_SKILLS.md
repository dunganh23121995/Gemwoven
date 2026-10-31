# Chapter boss skills

Each chapter boss fights with a kit of its own (data: `src/gemwoven/world.js`, `src/gemwoven/boss-chapters.js`;
staging, art and sounds: `src/foe-skills.js` BOSS_SKILL_LOOKS). Rules:

- **Fit the body.** A beast fights with its body: jaws bite, a tail lashes, wings beat, claws and blades cut,
  horns gore, fists punch, it leaps, pounces or takes to the air. The effect sheet draws the body part's trace
  (the jaws closing, the tail's arc, the scythe's cut) and the boss sprite moves with it (lunge, turn, rise, dive).
- **Casters channel.** A mystic boss (witch, queen, empress, jailer, sovereign) first gathers its power at its
  staff, crown, lantern or hands (a channel sheet of its own, with its own sound), then releases the skill.
- **Ultimates are set pieces.** Several beats (rise, gather, unleash, finisher), longer and heavier than the kit.
- **Nothing shared.** No sheet or recording is shared with heroes, creatures, elites (they wield the boss's
  signature sheet) or another boss. No two skills of one kit share a staging or a look; no two bosses share a
  guard staging. Avoid the "three orbs fly at the hero" motif except where the skill really is a volley.
- **Sounds fit the action.** One real recording per cue: a bite snaps and crunches, a blade swishes and slices,
  wings flap, a channel hums or rings. No glassy "ting" for a blade, no synth, no music, no voices.

Stagings (FOE_MOVES): lunge, charge, pounce, gore, bite, tailwhip, flurry, flight (rise, hover, breathe), dive,
punch, volley, fan, rain, column, beam, thrust, breath, tether, spiral, sweep, snare (ground under the hero),
quake (crash down), drop, vanish, roar; guards plates, dome, shutters, orbit, pillars, wings, wrap, sigil, shell,
mirror, crown, cage, spots, rampart, saturn, backdrop, crescent, ring; heals and summons bloom, pour, rise, flank.
`channel` (look.channel) plays before any staging.

## Bodies and channels

Melee bosses have combat action sheets of their own (assets/gemwoven/boss-anim/<boss>/<action>.webp, listed in
assets/gemwoven/boss-anim/actions.json): the skill's look names its pose (look.pose) and the staging plays that pose
instead of the generic attack or cast frames. Casters play their cast pose with a channel sheet of their own
(look.channel) at the staff, crown, lantern or hands before releasing. Later chapters hit harder: every chapter
boss's skill power, shields, heals, drains and status strength grow with the chapter (world.js CHAPTER_POWER).

## Kits

Legend: **Skill** (mechanic change) - pose / channel - staging - sheet - sounds.

1. Thạch Mộc Cự Vệ (pilot, approved; unchanged).
2. Hỏa Long Tro Tàn (dragon): **Long Vĩ Quật** (was Tam Liên Hỏa Tức: one slow, heavy tail lash, same power) - pose tail - tailwhip - tail -
   heavy air sweep, whip crack. Vảy Dung Nham - plates - scale. **Long Nha Thiêu Đốt** (was Tro Tàn Thiêu Đốt, burn) -
   pose bite - bite - jaws - jaw snap, crunch. Long Viêm Diệt Thế - pose fly - flight: takes off, hovers, a 3 s fire
   stream with 5 ticks, the ground burns - flamestream + firesea - wing beats, blowtorch roar.
3. Băng Nguyệt Linh Hồ (moon fox-griffin): Băng Thương - cast + moon channel - two hooked moon spears on curved
   arcs - moonspear. Kết Giới Băng - cast - dome - moondome. Hàn Phong - pose howl - gust rolling over the ground - gust.
   Nguyệt Băng Phong Ấn - cast + full moon behind - three lunar bands lock round the hero, the third freezes -
   lunarlock - stressed ice resonance, deep ice fracture.
4. Lôi Sư Thiên Đỉnh (thunder lion-wolf): Ngũ Lôi - pose roar - five bolts walking up to the hero - strike.
   Điện Trường - pose charge - electric field rolls out - field. **Tụ Điện** - pose pounce - pounce - thunderclaw -
   heavy paw landing, claw scrape. Lôi Thần Quang Pháo - pose charge - beam - cannon.
5. Mẫu Nấm Độc (witch): every skill channels at her cap gills (gillspores). Bào Tử Độc - toadstools inflate and burst
   under the hero. Tán Nấm Hồi Sinh - bloom. Rễ Bào Tử - mycelium creeps to the hero (sweep, creep). Bào Tử Mê Loạn -
   a puffball swells over her and drops (drop).
6. Bọ Vương Hoàng Kim (scarab): Giáp Cát Hoàng Kim - shutters. **Sừng Vàng Xuyên Phá** (was Lưỡi Cưa Sa Mạc) - pose
   gore - gore through the hero - hornstrike - hard-foot skitter, impact. **Hàm Kìm Tam Kẹp** (was Cơn Lốc Cát, 3 hits) -
   pose snap - three mandible pincers - mandible - shell clacks, crunch. Lời Nguyền Pharaoh - cast + sun crest glow -
   quake - obelisks.
7. Hải Long San Hô (sea serpent): Sóng Nghiền - pose snap - surf crashes round the bite (pincer) - wavejaw.
   Dòng Triều Hồi Phục - pour. Xoáy Biển Sâu - whirlpool (snare). Hải Triều Tái Sinh - cast + coral glow - bloom - reef.
8. Cự Tượng Bánh Răng (golem): Nạp Lõi Hơi Nước - roar - steamburst. Búa Tạ Cơ Khí - pose punch - punch - hammer.
   Giáp Bánh Răng - orbit. Trọng Chùy Phá Giáp - pose slam + core heat channel - quake - smash.
9. Bọ Ngựa Lăng Tinh (mantis): **Song Liềm Liên Trảm** (was Lăng Kính Liên Kích, 4 cuts) - pose slash - flurry in
   place - scythecut - blade passes. Vỏ Tinh Thể - pillars. Quang Phổ Rạn Nứt - pose cross + glint - beam - spectrum.
   **Thiên Liềm Loạn Vũ** (was Lăng Kính Suy Nhược: 8 cuts + finisher, weaken) - pose slash - rush: it blinks round
   the hero cutting along changing diagonals with long blade trails, then a closing execution cut - scythetrail, scythex.
10. Tử Thần Nguyệt Ảnh (reaper): Liềm Hồn - pose reap - lunge - scythe. Hút Hồn - cast + moon blade - spiral - soulknot.
    Nguyệt Trảm - pose reap - a hooked cut that catches the hero's shadow - hookcut. Ảnh Hồn Tiêu Biến - cast - vanish - tatters.
11. Đại Bàng Thiên Phong (roc): Phong Vũ - pose beat - fan of three darts at once - featherdart. Lông Vũ Hộ Thể - wings.
    Lốc Cướp Linh - pose beat - downwash sweeping the ground - cyclone. Đại Bàng Bổ Nhào - pose dive - dive: flies out
    of sight, a shadow grows, talons-first strike - dive.
12. Nữ Hoàng Gai (thorn queen): channels a rose bloom on her staff. Gai Độc - pose lash - a thorned vine whips across
    the hero (thrust) - vinewhip. Hoa Ăn Linh - lunge - maw. Rừng Gai - wrap. Vương Miện Gai Phản - crown of thorns -
    spiral - thornspike.
13. Thiên Sứ Nhật Quang (seraph knight): Nhật Kiếm - pose thrust - thrust - sunlance. Ánh Dương Tái Sinh - cast - pour.
    Hào Quang Phán Quyết - cast + sword light - rain - lightspear. Phong Ấn Thánh Quang - takes flight - beam down - sealbeam.
14. Long Đế Hư Không (void dragon): Nhật Thực - pose buffet - roar - starshards. **Hư Không Phán Quyết** - pose bite -
    bite that closes a dark seam - voidseam. Tinh Vân Bạo Phát - pose bite (open jaws) - breath - nebulafire.
    Hố Đen Nuốt Chửng - cast + void orb - tether - galaxy.
15. Thụ Vương Bạch Hoa: root backhand (pose backhand, sweep), birch sigil, root guards (flank), pollen tether,
    spring tree (bloom), ult roots heave under the hero (snare, rootquake); channel sapglow.
16. Bạo Chúa Tâm Nham: hook + hammer (pose punch, lunge x2), obsidian shell, lava jets (flank), spike ridge (sweep),
    hurled pumice (pose punch, volley), ult geyser (snare); channel corefire.
17. Nữ Đế Băng Tinh: everything from her sceptre (cast + sceptrefrost): icicles (volley), mirror, ice pillars,
    aurora beam, hail (rain), ult glacier (drop).
18. Sư Ưng Lôi Hoàng: talon rakes (pose claw, lunge x3), storm crown, wind column (bloom), plasma rush (pose claw,
    charge), storm eye (spiral), ult takes flight and calls nine bolts (pose fly, rain).
19. Cai Ngục Vong Đăng: chain scythe (pose swing, lunge), cage, chain circle (bloom), chain knot (pose swing,
    tether), ghost pillars (snare), ult cage slam (vanish); channel lanternglow.
20. Lão Vương Bào Tử: staff smash (pose smash, punch), fungus spots, sprouts (bloom), spore pods (rain), mycelium
    threads (tether), ult bloom rot (snare); channel gillglow.
21. Huyền Quy Tinh Thành: stomp crack (pose stomp, sweep), rampart, towers (bloom), cannon (beam), quake ring
    (pose stomp, roar), ult tower fall (drop); channel crystalglow.
22. Sa Vương Thời Luân: sand blades (pose sweep, volley), sand ring, sand guards (flank), reverse sand (bloom),
    clock ripple (tether), ult sand beam; channel sandglass.
23. Long Vương Châu Triều: claws (pose rake, lunge x2), clam, coral (bloom), undertow (spiral), pearl spring (rise),
    ult barrel wave (sweep); channel pearlglow.
24. Lang Vương Tử Nguyệt: three heavy cuts (pose cut, lunge x3), crescent guard, twin flames (bloom), shadow draw-cut
    (pose draw, vanish), blood fangs (pose cut, pincer), ult blood-moon blade (charge); channel bloodmoon.

## Locked (2026-10-31)

Every chapter boss's kit, staging, art and sounds are approved and locked; change them only on request. Rules the
approved state relies on:

- **Place.** A boss stands by its resting body close to the outer edge, 4% of the stage from it, as the first
  chapter's golem stands (combat-stage.js `combatKeepInside`); wider poses (wings, a tail lash) may pass the edge for
  a moment. At least 16% of the stage (48px or more) stays clear between hero and boss; on a narrow stage the boss is
  drawn smaller (down to 80%, `combatBossFit`) rather than crowding the hero. Every pose stands on the resting pose's
  feet: build.py slides each sheet's first frame over the idle's silhouette (`feetX`) and sprite-runtime.js
  `spriteBox` draws it there, so a skill's pose never shifts the body. Poses fit under the HUD by their `peak` point,
  except airborne sheets, which keep full size in the air (the fire dragon soars to the top corner, `soar`).
- **Weight.** A giant's body or foot meeting the ground is heard: a deep boom (`boom` cue, one real recording per
  boss, played loud) as a quake lands (Thần Mộc Bất Tử, Lời Nguyền Pharaoh, Trọng Chùy Phá Giáp) and as Huyền Quy
  stomps (Chấn Địa Tinh Nham, Cộng Hưởng Nghịch Chấn).
- **Origins.** Ground skills leave from the boss's front feet; sky skills fall from the top of the screen; breath
  leaves the mouth anchors of the pose (actions.json `mouth`, else the build's `front` points).
- **Armour.** No shell picture pops up: the boss's own plates orbit it without motion blur and a glaze lies on the
  sprite while `enemyArmor` (or an expedition ward) holds. Bosses with armoured sheets (`armoridle`,
  `<action>_armored`) attack in that armour.
- **Board turns stay in the boss's style.** Armour, health or energy a boss gains from gems plays no cast pose,
  hero element emblem or sanctuary; armour puts on its own plates. Its basic pounce uses its body and its own
  recordings, without the heroes' crescent slash, elemental bloom or synthesized sounds (foe-skills.js).
- **States show on the body.** Frenzy (red blaze), stealth (faded shimmer), invulnerable (gold shell), undying
  (violet shell), regen (green motes), thorn crown (reflect).
- **Summons are monsters.** Each cast adds two guards with their own health (boss-tactics.js, up to six); they attack
  on the foe turn, take 40% of each blow aimed at the boss, and stay until killed.
- **Ultimates** darken the stage, warn, play the boss's own climax sheet and end with a flash; stage-sized looks
  (`stage`) may fill half the screen (Vạn Trượng Hải Triều).

## When each skill is cast

Chapters 1-14: the boss casts a skill each time its rage fills (gems it matches), choosing the one that fits the
fight (boss-tactics.js `chooseSkill`, the same rules in the studio's "Kỹ năng địch" line):

- **Ultimate**: from the third cast on, once the boss is at 60% health or less or the hero at 35% or less (or at
  the fifth cast anyway); at most once in three casts.
- **Guard** (armour): only with no armour left, preferably once hurt. **Heal**: at 75% health or less, urgently
  at 50%. **Drain** (rage): when the hero is near an ultimate (60 rage or more). **Burn / poison**: when the hero
  carries none of the boss's yet. **Execute**: below its threshold. **Lifesteal**: once hurt (below 70%).
  **Pierce**: when the hero holds armour. **Charge**: never twice in a row; the next blow is the heavy one.
  **Strike**: the default.
- A skill not cast yet is nudged forward so a fight shows the whole kit; never the same skill twice in a row
  while another fits.

Chapters 15-24: by health phase (boss-tactics.js `nextSkill`): above 70% skills 1-3, 70-35% skills 4-5 join,
35% and below the phase-3 cycle with the ultimate (6); a channelled ultimate warns a turn ahead and can be broken.
