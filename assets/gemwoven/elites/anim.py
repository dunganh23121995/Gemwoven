"""Combat body animation of the elites: five 3x2 sheets drawn by Codex over each elite's master (attack, skill,
cast, hurt, defeat), like the chapter bosses' action sheets (assets/gemwoven/boss-anim/pipeline.py).

Frame meaning, shared by every action so src/foe-skills.js can stage them all alike: frame 0 ready, 1 the loaded
wind-up, 2 on the way, 3 the peak (the blow lands or the power leaves), 4 follow-through, 5 coming back to ready.
hurt and defeat play straight through.

  python anim.py prompts                     write prompt-<action>.txt for every elite
  python anim.py gen <id> <action> [model] [effort]     draw one sheet (default gpt-6.1-sol low)
  python anim.py proc <id> <action>          key, slice and align it again from its raw
  python anim.py accept <id> <action>        keep it: <action>.webp next to the raw
  python anim.py batch [--workers N] [--only id,id] [--actions a,b] [--model m] [--effort e]
                                             draw everything still missing, hidden, resumable
  python anim.py qc [id ...]                 measure every processed sheet, flags in .build-cache/elite-anim/qc.json
  python anim.py contact <action> [id ...]   review sheet of one action for many elites
"""
import json
import subprocess
import sys
import shutil
import threading
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
SCRATCH = ROOT / ".build-cache/elite-anim"  # work folders, rejected attempts and review images (not tracked)
ACTIONS = ["attack", "skill", "cast", "hurt", "defeat"]
DEFAULT = ("gpt-6.1-sol", "low")
CELL, WIDE = 320, 1.5  # a figure's scale (cell px per 512 raw px), and the room around it
AIRBORNE = {("sky-windknight", "skill"): (2, 3, 4), ("thunder-stormblade", "skill"): (3,)}  # frames off the ground
NO_WINDOW = 0x08000000

ELITES = json.loads((HERE / "elites.json").read_text(encoding="utf-8"))["elites"]

# The elites of the expansion chapters had no written brief.
BRIEFS = {
    "forest-leafarcher": "a slender living forest spirit whose whole body is overlapping green leaves and twisting vines, with a long drawn-out leaf hood and no visible face, holding a tall longbow of curved vine with a quiver of leaf arrows at the hip",
    "eldergrove-rootwarden": "a burly wooden golem of bark and moss with a glowing green heart crystal, antler branches, one heavy fist and a bark shield set with a green gem",
    "caldera-basaltbrute": "a huge hunched brute of dark basalt rock split by glowing lava seams, with enormous rock fists, a glowing diamond core in its chest and no visible head",
    "caldera-furnacepriest": "a horned hooded priest in dark red and charred robes with glowing lava cracks, one hand aflame, holding a tall staff topped by a burning lantern-brazier",
    "glacier-rimeknight": "a knight in white and pale blue crystal plate with a white fur mantle and tattered ice-blue cape, holding a long ice sword down at his side",
    "soulcrypt-cagekeeper": "a heavily armoured jailer in black and bronze spiked plate whose head and chest are glowing violet soul cages, gripping a large iron key in one hand with chains hanging at his waist",
    "soulcrypt-veilassassin": "a hooded assassin of violet shadow with glowing eyes, in dark spiked armour and a tattered purple cloak, with twin curved violet blades",
    "mycelium-plagueherald": "an old mushroom sage with a great red spotted cap, a long fibrous white beard, mossy shaggy robes and a gnarled staff with a glowing green bulb",
    "geode-rampartgolem": "a huge fortress golem of stone blocks with two small castle towers on its shoulders, blue crystals on its back and in its chest, and enormous square stone fists",
    "geode-prismseer": "a hooded seer in cracked stone-brick robes crusted with blue crystals, holding a tall staff tipped with a blue crystal",
    "hourglass-dunesentinel": "a muscular sand-stone warrior in gold and teal armour with long cream sashes, a pointed crest and a large curved golden sickle blade",
    "hourglass-chronoweaver": "a hooded weaver in cream, teal and gold robes with tassels and floating sashes, holding a staff topped by a large golden hourglass",
    "coralreef-tidemarshal": "a blue dragon-scaled sea marshal in gold-trimmed armour with coral on the shoulders, pearl pauldrons, a fin crest and a golden trident",
    "coralreef-coraloracle": "a mermaid oracle with a long pastel blue and pink fish tail, coral crown, flowing lilac hair and a golden staff topped by a large pearl (she has no legs: she rests on the curve of her tail)",
    "moonkeep-lunarknight": "a silver-grey wolf knight in black and violet armour with a crescent moon on the chest, a bushy wolf tail, a dark cape and a glowing violet longsword",
}

# Blows, by the kind of weapon. {w} is the weapon, {o} what the other hand does.
BLOWS = {
    "blade": "1 ready pose; 2 wind-up: {w} drawn far back over the right shoulder, torso twisted away to the RIGHT, knees bent, weight loaded ({o}); 3 the swing starts: hips and shoulders drive to the LEFT, {w} coming round in a wide arc; 4 impact: the sword arm fully extended to the LEFT, {w} at full reach in a level cut, the body leaning into the blow; 5 follow-through: {w} carried past the target low on the left, shoulders twisted; 6 recovering, coming back toward the ready pose",
    "great": "1 ready pose; 2 wind-up: both hands heave {w} up and back behind the right shoulder, torso arched back, front knee lifted, weight loaded; 3 the heavy swing begins: {w} comes down over the head, the body driving to the LEFT; 4 impact: {w} chopped down in front to the LEFT at full reach, both arms extended, knees deep, the whole body behind it; 5 follow-through: {w} low in front near the ground, back bent, straining to stop it; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "smash": "1 ready pose; 2 wind-up: {w} raised high behind the head, torso leaning back to the RIGHT, weight loaded ({o}); 3 the blow starts: {w} swings over the top with the shoulders driving to the LEFT; 4 impact: {w} crashes down at full reach on the left at waist height, arm straight, the whole body leaning in; 5 follow-through: {w} bounces low, shoulders dropped; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "thrust": "1 ready pose; 2 wind-up: both arms pull {w} far BACK to the RIGHT so its point sits close beside the body (nothing extended yet), tip still aimed LEFT, rear knee bent, shoulders turned away, weight loaded; 3 the thrust begins: hips drive to the LEFT, the front foot sliding out, {w} shooting forward; 4 impact: {w} at full reach to the LEFT, level, arms locked straight, the body in one long line behind it (the point stays inside the cell); 5 pulling {w} back a third, shoulders still forward; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "rapier": "1 ready pose; 2 wind-up: the sword arm drawn back with the elbow bent and the rapier's point aimed LEFT, knees bent in a fencing crouch, free hand raised behind; 3 the lunge begins, front foot sliding out to the LEFT; 4 full fencing lunge: arm and rapier in one straight line to the LEFT, front knee deep, rear leg straight; 5 recovering from the lunge, the rapier flicking up; 6 back toward the ready pose",
    "dual": "1 ready pose; 2 wind-up: both blades of {w} crossed in front of the chest then drawn back, knees bent, torso coiled to the RIGHT; 3 first cut: the right blade slashes out to the LEFT, the left held back; 4 second cut: the left blade slashes through to the LEFT at full reach while the right sweeps back, body fully committed; 5 third cut: both blades sweep outward in an X, arms wide; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "fists": "1 ready pose; 2 wind-up: the right fist pulled far back behind the shoulder, torso twisted away to the RIGHT, weight on the rear leg; 3 the punch begins: hips and shoulder drive to the LEFT; 4 impact: the fist at full reach to the LEFT, arm straight, the whole heavy body behind it; 5 the other fist following through, shoulders rolling; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "palm": "1 ready pose; 2 wind-up: both hands drawn back to the right hip, palms together, torso coiled; 3 the push begins, the body gliding to the LEFT on its cloud; 4 full palm strike: the right palm thrust out to the LEFT at full reach, fingers up, sleeves flying back; 5 the arm sweeping round in a calm circle; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "bow": "1 ready pose; 2 turns sideways to the LEFT, the bow raised level and pointing LEFT, the other hand reaching back to the quiver for an arrow; 3 nocks the arrow on the string, bow arm straight toward the LEFT; 4 full draw: bow arm locked straight to the LEFT, the string pulled back to the cheek, the arrow level, the bow bent deep; 5 release: the arrow is gone, the string snapped back STRAIGHT against the bow with the bow no longer bent, the drawing hand open and empty beside the cheek, bow arm kicking slightly; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "crossbow": "1 ready pose; 2 turns sideways to the LEFT, {w} brought up to the shoulder, one hand on its lever; 3 cranked: the string pulled back to its catch, a bolt laid in; 4 aimed: {w} level to the LEFT, cheek on the stock, the string taut; 5 fired: the bolt is gone, the string snapped forward straight, the weapon kicking back into the shoulder; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "staff": "1 ready pose; 2 wind-up: {w} pulled back and upward with the free hand drawn in to the chest, torso turned away to the RIGHT; 3 {w} swings forward, the head of it glowing brighter; 4 full reach: {w} thrust straight out to the LEFT, head aimed at the target, the free hand behind it, robes blown back (the shot leaves here); 5 {w} kicks up a little from the recoil; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "censer": "1 ready pose; 2 wind-up: {w} swung back on its chain behind the body to the RIGHT, the arm following; 3 the chain whips round low, {w} rising forward; 4 full reach: arm extended to the LEFT, the chain taut and {w} flung out at the end of it, its vents glowing brightest (the shot leaves here); 5 {w} swinging back on its chain; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "orb": "1 ready pose; 2 wind-up: {w} drawn in to the chest with both hands, torso turned away to the RIGHT, head lowered; 3 the hands begin to push forward; 4 full reach: arms extended to the LEFT, {w} held out at arm's length, glowing brightest (the shot leaves here); 5 hands easing back; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
}

# The supporting gesture (guards, heals, gathering power).
GATHERS = {
    "shield": "1 ready pose; 2 {w} coming up in front of the chest, the weapon drawn in behind it; 3 braced behind {w}, shoulder set, knees bent, head low; 4 the guard at its firmest, {w} planted forward to the LEFT, the body solid behind it, small glow along its rim; 5 the same guard holding, chin lifting; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "brace": "1 ready pose; 2 {w} drawn across the body with both hands, chest filling; 3 {w} held upright in front of the chest, feet apart, head bowed; 4 power gathers: {w} braced upright, shoulders squared, eyes lit, small glow along the weapon; 5 the same stance holding, chin lifting; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "raise": "1 ready pose; 2 {w} lifting, the free hand opening at the chest; 3 {w} raised high overhead in one hand, the free hand spread out to the LEFT, robes lifting; 4 the peak: {w} held at full height, its head glowing, the free hand thrust toward the LEFT; 5 the same pose holding, the head tilting back; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "guardfists": "1 ready pose; 2 both arms crossing in front of the chest; 3 arms locked in a cross guard, head lowered behind them, knees bent; 4 the guard at its firmest, the chest core or seams glowing, the body solid; 5 the same guard holding; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "meditate": "1 ready pose; 2 both hands rising, palms together in front of the chest; 3 eyes closed in prayer, the prayer beads swinging, the cloud swelling a little; 4 the peak: both arms opened wide, palms up, chest lifted; 5 the same pose easing; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "bowready": "1 ready pose; 2 {w} held upright in front of the chest, the free hand checking it; 3 one hand runs along {w}, head bowed; 4 the peak: {w} lifted high in front, the free hand spread out to the LEFT, a small glow along it; 5 the same pose easing; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
    "bowguard": "1 ready pose; 2 the bow held upright in front of the chest, the free hand reaching behind to the quiver; 3 one finger traces along the bow, head bowed; 4 the peak: the bow lifted high in front, the free hand spread out to the LEFT, leaves lifting off the cloak; 5 the same pose easing; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1",
}

HURT = "1 ready pose; 2 struck hard from the LEFT: head snapped back, torso jerked to the RIGHT, arms flung out, teeth gritted (the weapon or orb stays in hand, visible in every frame); 3 the recoil's peak: staggering back to the RIGHT, one knee buckling, the weapon dropped low, the head thrown back; 4 hunched forward over the blow, the free hand near the chest; 5 straightening, shaking it off, the weapon coming back up; 6 back in the ready pose exactly like frame 1"
DEFEAT = {
    "fall": "1 reeling, the head dropped, {w} sagging low; 2 the knees buckle, the body starts to sink; 3 down on one knee, {w} slipping, the free hand on the ground; 4 on both knees, the torso sagging forward, the head hanging; 5 toppling over forward to the LEFT, arms loose; 6 lying flat on the ground on its front, completely still, {w} lying beside it, the whole body low and wide on the ground line",
    "crumble": "1 reeling, the head dropped, the heavy arms sagging; 2 cracks running through it, one knee giving way; 3 down on one knee, a fist on the ground, chunks starting to loosen; 4 the torso collapsing forward, pieces breaking off it but staying attached to the heap; 5 slumping into a low heap, the glow fading; 6 a low collapsed heap of its own broken pieces on the ground line, every light gone out, all pieces touching one connected heap",
    "fade": "1 reeling back, the head dropped, the arms sagging; 2 sinking toward the ground, the gown and hair going limp; 3 down on the ground, the held object slipping; 4 slumped forward, the head hanging; 5 collapsing, the gown spreading out; 6 a low limp heap of its gown and hair lying flat on the ground line, completely still, the held object beside it",
    "drift": "1 reeling back, the head dropped, the arms sagging; 2 the cloud under it thinning and sinking; 3 sinking to its knees on the shrinking cloud, one hand down; 4 slumped forward on the cloud, the beads hanging; 5 toppling sideways onto the flat cloud; 6 lying flat on a thin low cloud, completely still, the whole body low and wide on the ground line",
}

# id: brief of the weapon, blow, gather, its signature skill's pose (frames 2-5 of the six; frame 1 ready, frame 6
# recovering), its fall. o: what the other hand does in a blow. reach: fights at range (it never runs in).
BODY = {
    "forest-rootknight": dict(w="the stone-headed mace", o="the round root shield held forward", blow="smash", gather=("shield", "the round wooden root shield"),
        skill="2 the mace lifted overhead in both hands, shield slung to the side, body arched back; 3 the mace swung down hard; 4 the mace head slammed into the ground in front to the LEFT, knees deep, back bent over it, cracks of green light at the mace head; 5 still leaning on the mace buried in the ground, teeth gritted"),
    "forest-leafarcher": dict(reach=True, w="the longbow", o="", blow="bow", gather=("bowguard", "the longbow"),
        skill="2 leans back, the bow tilted up toward the upper LEFT, an arrow drawn from the quiver; 3 full draw aimed steeply up to the upper LEFT, bow arm locked, the string at the cheek; 4 release: the arrow gone, the string snapped back straight, the bow no longer bent, the drawing hand open and empty, still looking up; 5 eyes following the arrows up, the bow lowering a little"),
    "volcano-flamelancer": dict(w="the long flaming lance", o="", blow="thrust", gather=("brace", "the long flaming lance"),
        skill="2 the lance drawn far back in both hands, crouching low, the flames along it flaring; 3 springs forward to the LEFT, the back foot pushing off; 4 maximum lunge: lance and body in one straight line to the LEFT, flames streaming back along the shaft (the point stays inside the cell); 5 the lance held out, its tip still burning, the body rising"),
    "volcano-ashcultist": dict(reach=True, w="the burning censer", o="", blow="censer", gather=("raise", "the burning censer on its chain"),
        skill="2 the censer whirled in a wide circle overhead on its chain; 3 the chain at full stretch above the head, embers at its vents; 4 the censer slammed down onto the ground in front to the LEFT, the free hand raised, knees bent, hood forward; 5 kneeling over the censer on the ground, one hand held over it, its vents blazing"),
    "ice-frostguard": dict(w="the long ice halberd", o="", blow="great", gather=("brace", "the long ice halberd"),
        skill="2 the halberd held out low to the RIGHT in both hands, the body coiled to the RIGHT; 3 the wide sweep begins, the blade skimming the ground; 4 full wide sweep: the halberd level across the front to the LEFT at knee height, the arms extended, cape flaring; 5 the blade carried on past, the body twisted, the cape settling"),
    "ice-snowwitch": dict(reach=True, w="the crescent-moon crystal staff", o="", blow="staff", gather=("raise", "the crescent-moon crystal staff"),
        skill="2 the staff held up in both hands, the crescent turning to the LEFT, the hat tilting back; 3 the staff swings forward, the crescent glowing; 4 the staff thrust to the upper LEFT, the free hand flicking two fingers forward, robes blown back; 5 the same pose easing, the staff lowering a little"),
    "thunder-stormblade": dict(w="the twin curved lightning blades", o="", blow="dual", gather=("brace", "the twin curved lightning blades crossed"),
        skill="2 crouches very low, coiled, both blades swept back, knees deep; 3 the spring: the body low and lengthening to the LEFT; 4 mid-pounce: leaping forward with both blades drawn across, the back leg trailing, feet off the ground; 5 landed in a deep crouch, both blades crossed low to the LEFT"),
    "thunder-sparkmage": dict(reach=True, w="the lightning-rod staff", o="", blow="staff", gather=("raise", "the lightning-rod staff"),
        skill="2 the staff lifted overhead, sparks at its tip, the free hand opening; 3 the staff pointing straight up at the sky at full reach; 4 the staff brought down, pointed to the LEFT at the target, the free hand behind it, the mantle blown back; 5 the staff held out, tip smoking"),
    "marsh-bogstalker": dict(w="the barbed bone spear", o="", blow="thrust", gather=("brace", "the barbed bone spear"),
        skill="2 turning the spear point down, both hands high on the shaft, shoulders over it; 3 the spear raised; 4 the spear driven point-first into the ground in front to the LEFT with both hands, knees deep, head low; 5 still crouched gripping the spear standing in the ground, the free hand beckoning"),
    "marsh-sporewitch": dict(reach=True, w="the gnarled spore staff", o="", blow="staff", gather=("raise", "the gnarled spore staff"),
        skill="2 the staff shaken high overhead, the mushroom cap bobbing; 3 the staff circling, the spore puffs swelling; 4 the staff at full height, the spore puffs bulging, her free hand thrown up, the cap tilted back; 5 the staff shaken, a few spore puffs falling close to it"),
    "desert-scarabguard": dict(w="the curved khopesh", o="the round sun shield held forward", blow="blade", gather=("shield", "the round sun shield"),
        skill="2 the head lowered behind the round shield, the khopesh drawn back low, knees deep; 3 driving forward to the LEFT behind the shield; 4 full rush: the shield shoved out to the LEFT, the khopesh thrusting past it, the whole body low and forward; 5 the khopesh sweeping up through, the body rising"),
    "desert-sandpriest": dict(reach=True, w="the ankh-topped staff", o="", blow="staff", gather=("raise", "the ankh-topped staff"),
        skill="2 the ankh staff raised in both hands, the head bowed in prayer; 3 the staff lifted overhead; 4 the staff planted hard on the ground in front to the LEFT, the free hand spread toward the ground, wrappings flying; 5 still leaning on the planted staff, the free hand rising slowly"),
    "abyss-reefcorsair": dict(w="the curved cutlass", o="the free hand on the hat", blow="blade", gather=("brace", "the curved cutlass held upright before the face"),
        skill="2 the cutlass whirled back behind the body, torso wound up to the RIGHT, coat flaring; 3 unwinding hard to the LEFT, the blade flashing round; 4 full spinning cut: the cutlass at full reach to the LEFT, the coat swirling out, the body leaning in; 5 the free hand reaching out to the LEFT as a grasping claw, the cutlass pulled back"),
    "abyss-tidecaller": dict(reach=True, w="the trident staff", o="", blow="staff", gather=("raise", "the trident staff"),
        skill="2 the trident drawn back with both hands, chest filling, the sleeves lifting; 3 the trident swinging forward; 4 the trident thrust straight out to the LEFT in both hands, tines aimed at the target, robes blown back hard; 5 holding it braced, leaning into it"),
    "foundry-gearknight": dict(w="the piston warhammer", o="", blow="smash", gather=("brace", "the piston warhammer held upright"),
        skill="2 the hammer planted head-down, both hands on it, the shoulders hunched; 3 the chest and pipes swell, the vents glowing hot; 4 chest thrown out, arms wide, the head thrown back, every pipe glowing brightest, the valves blown open; 5 sagging back down, gripping the hammer"),
    "foundry-tinkerer": dict(w="the giant wrench", o="", blow="smash", gather=("brace", "the giant wrench held across the body"),
        skill="2 the giant wrench swung back behind the right shoulder in one hand, the torso wound up, the goggles down; 3 the arm whipping forward; 4 the throw: the arm flung straight out to the LEFT at full reach, the hand still holding the wrench at the fingertips; 5 the hand open and held out, waiting to catch"),
    "crystal-shardblade": dict(w="the long crystal greatsword", o="", blow="great", gather=("brace", "the long crystal greatsword held upright"),
        skill="2 the greatsword drawn across the body low on the right, knees bent; 3 a fast rising cut up to the upper LEFT; 4 a fast falling cut down to the LEFT at full reach; 5 a level cut back across, the sword crossing the body, crystal shards in the armour glinting"),
    "crystal-gemsage": dict(reach=True, w="the crystal orb ringed by cut gems", o="", blow="orb", gather=("raise", "the crystal orb ringed by cut gems"),
        skill="2 the orb lifted to the forehead, eyes shut; 3 the orb held out, the small gems spreading wider round it; 4 the orb thrust straight out to the LEFT in both hands, the eyes wide open and shining, the sleeves blown back; 5 holding it braced, the gems spinning"),
    "haunted-gravewarden": dict(w="the long iron shovel", o="the ghost lantern held behind", blow="great", gather=("raise", "the ghost lantern"),
        skill="2 the ghost lantern lifted out in front to the LEFT, the shovel grounded; 3 the lantern raised to the eyes, glowing brighter; 4 the lantern thrust out to the LEFT at full reach, its door swung open, its flame leaning backward toward him, the hat tipped forward; 5 drawing the lantern back to the chest, the body hunching over it"),
    "haunted-bonepaladin": dict(w="the heavy rune sword", o="", blow="great", gather=("brace", "the heavy rune sword held upright, hilt at the chest"),
        skill="2 the rune sword dragged back low behind the right leg, the shoulders turning; 3 a huge rising swing, the runes along the blade lighting; 4 the cut released at full reach to the LEFT, the blade pointing at the target, the runes blazing; 5 the sword carried on, the body twisted, the eyes burning"),
    "sky-windknight": dict(w="the long wind spear", o="", blow="thrust", gather=("brace", "the long wind spear"),
        skill="1 ready pose; 2 crouches very low, the wings on the helm and shoulders flaring, the spear pulled in; 3 springing straight up, airborne, knees tucked, the cape trailing below; 4 at the top of the leap, airborne, banking, the spear reversed point-down in both hands; 5 stooping on the target, airborne: the whole body stretched in one line pointing down to the lower LEFT, the spear leading; 6 landed in a deep crouch, the spear driven down in front to the LEFT, the cape falling"),
    "sky-cloudmonk": dict(w="the open palms", o="", blow="palm", gather=("meditate", "the prayer beads"),
        skill="2 both arms drawn in a big slow circle to the RIGHT, the sleeves filling with wind; 3 the arms sweeping across, the cloud swelling; 4 both palms thrust low to the LEFT, sleeves streaming, the hair flying back; 5 the arms turning in a continuing circle"),
    "thorns-briarduelist": dict(w="the thin rapier", o="", blow="rapier", gather=("brace", "the thin rapier held upright before the face in salute"),
        skill="2 a deep fencer's crouch, the rapier low, the vines on the coat stirring; 3 a very fast step forward to the LEFT; 4 the longest possible lunge: the arm and rapier in one straight line to the LEFT, the hat feather streaming, the rear leg straight; 5 the rapier flicked upward in a flourish, the coat settling"),
    "thorns-vinehexer": dict(reach=True, w="the twisted vine staff", o="", blow="staff", gather=("raise", "the twisted vine staff"),
        skill="2 the vine staff held across the chest, both hands on it, roses opening on the dress; 3 the staff raised; 4 the staff slammed down on the ground in front to the LEFT, the free hand clawing upward, the thorn crown lit; 5 the free hand closing into a fist, the staff still planted"),
    "celestial-sunpaladin": dict(w="the longsword", o="the tower shield held forward", blow="blade", gather=("shield", "the tall tower shield"),
        skill="2 the longsword lifted level beside the head, point aimed LEFT, the shield swung out of the way, knees bent; 3 the sword hand rising to full height, the blade gleaming; 4 a full straight thrust to the LEFT, the arm and sword in one line at full reach, the body behind it; 5 the blade drawn back, the shield coming up"),
    "celestial-dawncleric": dict(reach=True, w="the censer of warm light", o="", blow="censer", gather=("raise", "the censer of warm light"),
        skill="2 the book on its chain opening in the free hand, the head bowing; 3 the censer lifted high overhead on its chain; 4 the arm stretched straight up, the censer blazing at full height, the head tipped back, the eyes shut; 5 the arm coming down, the free hand held out to the LEFT in blessing"),
    "void-voidknight": dict(w="the void greatsword", o="", blow="great", gather=("brace", "the void greatsword held upright"),
        skill="2 the greatsword lifted high overhead in both hands, the cape lifting, star cracks glowing; 3 falling forward, the sword coming down; 4 the blade brought all the way down in a straight vertical cut to the LEFT at full reach, the knees deep; 5 the blade dragged up and back through the cut, the eyes burning"),
    "void-starseer": dict(reach=True, w="the eclipse-shaped staff", o="", blow="staff", gather=("raise", "the eclipse-shaped staff"),
        skill="2 the staff lifted, the free hand cupped over the small dark orb; 3 the hood lifted, the stars on the robe shining; 4 the free hand flung out to the LEFT with the fingers spread, the staff held high behind, robe flying; 5 the hand closing, drawing back"),
    "eldergrove-rootwarden": dict(w="the heavy wooden fist", o="", blow="fists", gather=("shield", "the bark shield"),
        skill="2 the free fist drawn up high beside the head, knees bent; 3 the arm driving down; 4 the fist punched into the ground in front to the LEFT, the shoulder low, the eyes lit green; 5 slowly rising, the fist pulling up from the ground"),
    "eldergrove-blossomranger": dict(w="the twin blades of polished wood", o="", blow="dual", gather=("brace", "the twin blades crossed"),
        skill="2 both blades stabbed downward, point first, by the feet, the body crouching; 3 the hood opening, blossoms on the armour opening; 4 both hands thrust up and out to the LEFT, fingers spread, petals bursting close around them; 5 the arms lowering, the blades back in hand"),
    "caldera-basaltbrute": dict(w="the huge fists of glowing basalt", o="", blow="fists", gather=("guardfists", ""),
        skill="2 both fists raised high overhead, locked together; 3 the body heaving forward; 4 both fists hammered into the ground in front to the LEFT, shoulders hunched, the cracks glowing brightest; 5 still bent over, pulling the fists up"),
    "caldera-furnacepriest": dict(reach=True, w="the staff topped by a burning lantern-brazier", o="", blow="staff", gather=("raise", "the staff topped by a burning lantern-brazier"),
        skill="2 the staff lifted in both hands, the brazier at its head glowing; 3 the staff thrust straight up, the hood falling back; 4 the staff tilted forward to the LEFT, the brazier blazing at full height, the free hand thrown up; 5 the staff lowering, the free hand held up"),
    "glacier-rimeknight": dict(w="the long ice sword", o="", blow="blade", gather=("brace", "the long ice sword held upright"),
        skill="2 the sword turned point down, gripped in both hands at the chest; 3 lifted up; 4 the sword driven straight down into the ground in front to the LEFT, the frost crackling up the blade, the head bowed; 5 kneeling, both hands on the hilt"),
    "glacier-blizzardmage": dict(reach=True, w="the blizzard orb staff", o="", blow="staff", gather=("raise", "the blizzard orb staff"),
        skill="2 the staff raised, the feather mantle lifting; 3 the staff swung in a big circle overhead; 4 the staff at full height, the orb blazing white, the free hand thrown up to the sky, the cloak flying; 5 the free hand brought down toward the LEFT, palm down"),
    "stormspire-voltlancer": dict(w="the lightning lance", o="", blow="thrust", gather=("brace", "the lightning lance"),
        skill="2 the lance couched under the arm, the body crouching very low, the wings flaring; 3 surging forward to the LEFT; 4 a full charge: leaning far forward, the lance level to the LEFT at full reach, the cape straight out behind; 5 skidding upright, the lance lifting"),
    "stormspire-stormshaman": dict(reach=True, w="the totem staff", o="", blow="staff", gather=("raise", "the totem staff"),
        skill="2 the totem staff held out and turned slowly, the head tilting back; 3 the free hand pointing up, the feathers lifting; 4 both arms stretched wide, the staff at one side, head thrown back, every rune on the robe shining; 5 the free hand pulling down toward the LEFT, fingers hooked"),
    "soulcrypt-cagekeeper": dict(reach=True, w="the large iron key swung on a length of chain", o="", blow="censer", gather=("raise", "the large iron key"),
        skill="2 the chain gathered in loops in the free hand, the key held close, the soul cage in the chest glowing; 3 the chain whirled up overhead; 4 the arm thrown straight out to the LEFT at full reach, the chain paying out; 5 hauling back on it with both hands, heels dug in, the body leaning back to the RIGHT"),
    "soulcrypt-veilassassin": dict(w="the twin curved violet blades", o="", blow="dual", gather=("brace", "the twin curved violet blades crossed in front of the hood"),
        skill="2 sinking down, cloak drawn round the body, only the eyes showing; 3 very low, one foot behind, ready to vanish; 4 a backhand stab to the LEFT with one blade, the body twisted round behind it, the cloak flying; 5 the other blade driving in underneath, the body rising"),
    "mycelium-plagueherald": dict(reach=True, w="the fungal staff with its glowing bulb", o="", blow="staff", gather=("raise", "the fungal staff with its glowing bulb"),
        skill="2 the staff shaken, the great mushroom hat bobbing; 3 the staff held high, the bulb swelling; 4 the staff tilted forward to the LEFT at full height, the bulb glowing brightest, the beard flying; 5 the free hand fanning downward"),
    "mycelium-mycoknight": dict(w="the spore-dripping morning star", o="", blow="smash", gather=("brace", "the spore-dripping morning star held upright"),
        skill="2 the morning star whirled in a full circle by the right side, the body leaning away; 3 lifted overhead in both hands; 4 smashed down onto the ground in front to the LEFT, knees deep, fungal plates flared; 5 still bowed over it, hauling it up"),
    "geode-rampartgolem": dict(w="the huge stone fists", o="", blow="fists", gather=("guardfists", ""),
        skill="2 one great foot lifting high, the body leaning back, both arms out for balance; 3 the foot at its highest, the body rearing; 4 the foot stamped down hard in front to the LEFT, fists swung down, the whole fortress body shaking, the crystals lit; 5 settling on both feet, arms low"),
    "geode-prismseer": dict(reach=True, w="the tall crystal-tipped staff", o="", blow="staff", gather=("raise", "the crystal-tipped staff"),
        skill="2 the staff drawn back in both hands, the crystal crest lit; 3 aiming along it, one eye closed; 4 the staff levelled straight to the LEFT at shoulder height, the crystal tip blazing, braced like a cannon; 5 holding it braced, leaning into the recoil"),
    "hourglass-dunesentinel": dict(w="the large curved golden sickle blade", o="", blow="blade", gather=("brace", "the large curved golden sickle blade held upright"),
        skill="2 the blade wound far back in one hand, the free hand spread forward, the sash flying; 3 the arm coming through; 4 the blade swung out in a full flat cut to the LEFT, releasing, the arm at full reach; 5 turning on through, the sash circling"),
    "hourglass-chronoweaver": dict(reach=True, w="the hourglass staff", o="", blow="staff", gather=("raise", "the hourglass staff"),
        skill="(the staff stays in the same hand in every frame) 2 the hourglass staff held up and tipped over, the sand starting to fall the other way; 3 the free hand pulling invisible threads with hooked fingers; 4 the free hand flung out to the LEFT, fingers spread, the staff held behind, the sashes floating; 5 the hand closing and drawing back, as if pulling a thread in"),
    "coralreef-tidemarshal": dict(w="the trident", o="", blow="thrust", gather=("brace", "the trident"),
        skill="2 the trident lifted high in both hands, the torso arched back; 3 the shaft coming round overhead; 4 the trident swept down and across in a great flat stroke to the LEFT, the tines near the ground, the tail lashing; 5 the body twisted, the trident carried on past"),
    "coralreef-coraloracle": dict(reach=True, w="the golden pearl staff", o="", blow="staff", gather=("raise", "the golden pearl staff"),
        skill="2 the golden pearl staff held out, the free hand circling, the long hair lifting as if underwater; 3 the circle widening, the tail curling; 4 the free hand thrust to the LEFT, palm open, the pearl blazing; 5 the hand pulling back in a slow spiral"),
    "moonkeep-lunarknight": dict(w="the glowing violet longsword", o="", blow="blade", gather=("brace", "the glowing violet longsword held upright"),
        skill="2 the longsword drawn back low with both hands, the head lowered, the wolf tail still; 3 a rising cut to the upper LEFT; 4 a falling cut down to the LEFT at full reach; 5 a level cut back across, the moon crest shining"),
    "moonkeep-eclipsehuntress": dict(w="the twin crescent daggers", o="", blow="dual", gather=("brace", "the twin crescent daggers crossed"),
        skill="2 springing up onto the toes, both daggers drawn wide apart behind the shoulders like opening jaws; 3 leaning forward to the LEFT; 4 both daggers snapped shut together to the LEFT at full reach, crossing like closing fangs; 5 drawing them apart slowly, the head tilted"),
}
FALL = {"caldera-basaltbrute": "crumble", "geode-rampartgolem": "crumble", "sky-cloudmonk": "drift"}

# The second wave is designed in roster2.py.
sys.path.insert(0, str(HERE))
from roster2 import ROSTER  # noqa: E402
for e, r in ROSTER.items():
    BODY[e] = dict(reach=bool(r["shot"]), w=r["w"], o=r["o"], blow=r["blow"], gather=r["gather"], skill=r["skill"])
    BRIEFS[e] = r["brief"]
    if r["fall"]:
        FALL[e] = r["fall"]

ACTION = """Image 1 is the exact character and art reference (a fantasy RPG elite warrior: {brief}). Image 2 repeats that exact character in six cells and is the template for slot position, scale and feet line.
Create a 6-frame combat animation, 3 columns x 2 rows, 1536x1024, read row-major, the character facing LEFT exactly like Image 1. The six frames: {frames}.
Never redesign it: same head, face, colours, markings, armour, weapons, accessories and proportions as Image 1 in every frame, the weapon never changes shape or hand; only the pose changes, with strong readable action poses. Body only: no detached projectiles, no beams, no slash arcs, no fire, no big effects; a small glow attached to the body is fine. Same scale and camera as Image 2 in all six cells: drawn at exactly the size it has in Image 2, never zoomed in or enlarged; the head and torso have the same pixel size in all six cells. {placement} Everything stays inside its own cell with at least 10% magenta margin on every side: nothing (cape, limbs, weapon) may touch or cross a cell edge, so lean and reach within the cell. Glows are small and opaque; no orbs, sparkles, smoke or mist.
Background 100% solid flat #FF00FF magenta, no gradient, no ground, no shadow, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""
PLANTED = "The feet stay on the same line as Image 2 in every cell and the body stays at about the same spot (it may lean, twist and reach)."
LEAP = "The feet stay on the same line as Image 2 unless a frame says it is airborne, and the body stays about the same spot (it may lean, twist and reach)."
LYING = "It stays at the same spot and its lowest point stays on the same line as Image 2's feet in every cell, down to frame 6, where it lies flat on that line."


def folder(e):
    return HERE / e


def frames(e, action):
    b = BODY[e]
    if action == "attack":
        return BLOWS[b["blow"]].format(w=b["w"], o=b["o"] or "the free hand balancing")
    if action == "skill":
        return b["skill"] if b["skill"].startswith("1 ") else "1 ready pose; " + b["skill"] + "; 6 back in the ready pose, exactly like frame 1, the weapon where it rests in frame 1"
    if action == "cast":
        return GATHERS[b["gather"][0]].format(w=b["gather"][1])
    if action == "hurt":
        return HURT
    return DEFEAT[FALL.get(e, "fall")].format(w=b["w"])


def prompt(e, action):
    placement = LYING if action == "defeat" else LEAP if action == "skill" else PLANTED
    return ACTION.format(brief=BRIEFS.get(e) or ELITES[e]["brief"], frames=frames(e, action), placement=placement)


def run(cmd, log=print):
    r = subprocess.run(list(map(str, cmd)), cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", creationflags=NO_WINDOW)
    if r.returncode:
        log(r.stdout[-1500:], r.stderr[-1500:])
        raise RuntimeError(f"failed rc={r.returncode}: {cmd[1] if len(cmd) > 1 else cmd}")
    return r.stdout


def work(e, action):
    d = SCRATCH / e / action
    d.mkdir(parents=True, exist_ok=True)
    return d


def master(e):
    own = folder(e) / "master.png"
    return own if own.exists() else ROOT / f"assets/gemwoven/items/creature-{e}.png"


def identity(e, d):
    m = Image.open(master(e)).convert("RGBA")
    bg = Image.new("RGBA", m.size, (255, 0, 255, 255))
    bg.alpha_composite(m)
    bg.convert("RGB").save(d / "identity.png")


def gen(e, action, model=DEFAULT[0], effort=DEFAULT[1], log=print):
    d, f = work(e, action), folder(e)
    identity(e, d)
    run([sys.executable, ANCHOR, "--input", d / "identity.png", "--rows", 2, "--cols", 3, "--cell-width", 512, "--cell-height", 512,
         "--subject-height-ratio", .72, "--feet-ratio", .88, "--output", d / "anchor.png"], log)
    (f / f"prompt-{action}.txt").write_text(prompt(e, action) + "\n", encoding="utf-8")
    start = time.time()
    run([sys.executable, GEN, "--prompt-file", f / f"prompt-{action}.txt", "--out", d / "raw.png", "--ref", d / "identity.png",
         "--ref", d / "anchor.png", "--model", model, "--effort", effort, "--timeout", 900], log)
    attempts = SCRATCH / "attempts"
    attempts.mkdir(exist_ok=True)
    n = len(list(attempts.glob(f"{e}-{action}-*.png"))) + 1
    shutil.copy2(d / "raw.png", attempts / f"{e}-{action}-{n}-{model}-{effort}.png")
    shutil.copy2(d / "raw.png", f / f"raw-{action}.png")
    proc(e, action, log)
    return time.time() - start


def proc(e, action, log=print):
    """Key the raw and cut it on its grid, every figure exactly where Codex drew it on the template (the shared
    processor re-centres each frame on its own bounds, which slides the body whenever a weapon goes out). Each part is
    given to the cell holding its centre, in cells WIDE times as large, so a lance past its slot is never clipped."""
    from scipy import ndimage
    sys.path.insert(0, str(Path(PROC).parent))
    from generate2dsprite import remove_bg_magenta
    d = work(e, action)
    raw = Image.open(folder(e) / f"raw-{action}.png").convert("RGBA").resize((1536, 1024), Image.Resampling.LANCZOS)
    a = np.asarray(remove_bg_magenta(raw, 100, 150))
    solid = a[..., 3] > 0
    labels, count = ndimage.label(solid)
    centres = ndimage.center_of_mass(solid, labels, range(1, count + 1))
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    big, cell, floor = round(512 * WIDE), round(CELL * WIDE), 0
    ox, oy = (big - 512) // 2, big - 512 - round(.04 * big)
    sheet = Image.new("RGBA", (cell * 3, cell * 2), (0, 0, 0, 0))
    for index in range(6):
        col, row = index % 3, index // 3
        canvas = np.zeros((big, big, 4), np.uint8)
        for label, (cy, cx) in enumerate(centres, 1):
            if int(cx // 512) != col or int(cy // 512) != row or sizes[label - 1] < 40:
                continue
            ys, xs = np.where(labels == label)
            ty, tx = ys - row * 512 + oy, xs - col * 512 + ox
            keep = (ty >= 0) & (ty < big) & (tx >= 0) & (tx < big)
            canvas[ty[keep], tx[keep]] = a[ys[keep], xs[keep]]
        # The feet stay on one line: the generator drifts a little from row to row (a leap keeps its height).
        foot = np.where((canvas[..., 3] >= 128).sum(1) >= 6)[0]
        foot = foot.max() if len(foot) else 0
        floor = floor if index else foot
        if index not in AIRBORNE.get((e, action), ()) and abs(floor - foot) <= big * .16:
            canvas = np.roll(canvas, floor - foot, axis=0)
        sheet.alpha_composite(Image.fromarray(canvas, "RGBA").resize((cell, cell), Image.Resampling.LANCZOS), (col * cell, row * cell))
    (d / "proc").mkdir(exist_ok=True)
    sheet.save(d / "proc/sheet-transparent.png")


def accept(e, action):
    src = work(e, action) / "proc/sheet-transparent.png"
    Image.open(src).convert("RGBA").save(folder(e) / f"{action}.webp", quality=92, alpha_quality=100, method=6)


def measure(e, action):
    """Each frame against the master: its height, its feet line, its centre, what it touches, its colours."""
    sheet = Image.open(work(e, action) / "proc/sheet-transparent.png").convert("RGBA")
    fw, fh = sheet.width // 3, sheet.height // 2
    painting = Image.open(master(e)).convert("RGBA")

    def colours(im):
        a = np.asarray(im.convert("RGBA").resize((96, 96), Image.Resampling.NEAREST)).reshape(-1, 4)
        a = a[a[..., 3] >= 128][..., :3] // 32
        h = np.zeros(512)
        np.add.at(h, a[..., 0] * 64 + a[..., 1] * 8 + a[..., 2], 1)
        return h / max(1, h.sum())
    mc = colours(painting)
    rows = []
    for i in range(6):
        c = sheet.crop((i % 3 * fw, i // 3 * fh, (i % 3 + 1) * fw, (i // 3 + 1) * fh))
        b = c.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
        if not b:
            rows.append(dict(empty=True))
            continue
        alpha = np.asarray(c.getchannel("A")) >= 128
        rows.append(dict(h=round((b[3] - b[1]) / fh, 3), w=round((b[2] - b[0]) / fw, 3), foot=round(b[3] / fh, 3), left=round(b[0] / fw, 3), right=round(b[2] / fw, 3),
                         edge=bool(alpha[0].any() or alpha[-1].any() or alpha[:, 0].any() or alpha[:, -1].any()), colour=round(float(np.minimum(colours(c), mc).sum()), 3)))
    flags = []
    good = [r for r in rows if not r.get("empty")]
    if len(good) < 6:
        flags.append("empty frame")
    if any(r["edge"] for r in good):
        flags.append("touches edge")
    if action != "defeat" and min(r["colour"] for r in good) < .42:
        flags.append("colour drift")
    if action not in ("defeat", "skill"):
        hs = [r["h"] for r in good]
        if good and rows[0].get("h") and rows[0]["h"] < .3:
            flags.append("small")
        if min(r["foot"] for r in good) < max(r["foot"] for r in good) - .05:
            flags.append("feet jump")
        if max(hs) - min(hs) > .42:
            flags.append("height swing")
    return dict(frames=rows, flags=flags)


def contact(action, ids=None, out=None, cell=118):
    """Rows of six frames per elite on a grey ground, so identity and motion can be read fast."""
    ids = ids or list(BODY)
    font = ImageFont.truetype("arial.ttf", 13)
    per = 2
    width = per * (6 * cell + 6)
    rows = (len(ids) + 1) // per
    canvas = Image.new("RGB", (width, rows * (cell + 16)), (120, 124, 132))
    draw = ImageDraw.Draw(canvas)
    for k, e in enumerate(ids):
        x0, y0 = (k % per) * (6 * cell + 6), (k // per) * (cell + 16)
        path = work(e, action) / "proc/sheet-transparent.png"
        draw.text((x0 + 4, y0), f"{e} {action}", fill=(255, 255, 210), font=font)
        if not path.exists():
            continue
        s = Image.open(path).convert("RGBA")
        fw, fh = s.width // 3, s.height // 2
        for i in range(6):
            c = s.crop((i % 3 * fw, i // 3 * fh, (i % 3 + 1) * fw, (i // 3 + 1) * fh)).resize((cell, cell))
            canvas.paste(c, (x0 + i * cell, y0 + 15), c)
    target = out or SCRATCH / f"contact-{action}.png"
    canvas.save(target)
    return target


def chapter(theme):
    """Both elites of a chapter, every action as a row at review size."""
    ids = [e for e in BODY if e.startswith(theme + "-")]
    size, font = 165, ImageFont.truetype("arial.ttf", 15)
    canvas = Image.new("RGB", (len(ids) * (6 * size + 10), 5 * (size + 18)), (120, 124, 132))
    draw = ImageDraw.Draw(canvas)
    for k, e in enumerate(ids):
        for r, a in enumerate(ACTIONS):
            x0, y0 = k * (6 * size + 10), r * (size + 18)
            draw.text((x0 + 4, y0), f"{e} {a}", fill=(255, 255, 210), font=font)
            sheet = Image.open(folder(e) / f"{a}.webp").convert("RGBA")
            fw, fh = sheet.width // 3, sheet.height // 2
            m = round(fw * .04)
            for i in range(6):
                x, y = i % 3 * fw, i // 3 * fh
                c = sheet.crop((x + m, y + m, x + fw - m, y + fh)).resize((size, round(size * (fh - m) / (fw - m * 2))))
                canvas.paste(c, (x0 + i * size, y0 + 17 + size - c.height), c)
    out = SCRATCH / f"chapter-{theme}.png"
    canvas.save(out)
    return out


def batch(workers=3, only=None, actions=None, model=DEFAULT[0], effort=DEFAULT[1], redo=False):
    jobs = [(e, a) for a in (actions or ACTIONS) for e in (only or BODY) if redo or not (folder(e) / f"raw-{a}.png").exists()]
    total, lock, done, fails = len(jobs), threading.Lock(), [], []
    logpath = SCRATCH / "batch.log"
    logpath.parent.mkdir(parents=True, exist_ok=True)

    def log(*a):
        with lock:
            with logpath.open("a", encoding="utf-8") as f:
                f.write(time.strftime("%H:%M:%S ") + " ".join(map(str, a)) + "\n")

    def worker():
        while True:
            with lock:
                if not jobs:
                    return
                e, a = jobs.pop(0)
            for attempt in range(2):
                try:
                    took = gen(e, a, model, effort, log)
                    done.append((e, a))
                    log("ok", e, a, f"{took:.0f}s", f"{len(done)}/{total}")
                    break
                except Exception as err:
                    log("fail", e, a, "attempt", attempt, repr(err)[:300])
                    time.sleep(20)
            else:
                fails.append((e, a))
    threads = [threading.Thread(target=worker) for _ in range(workers)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    log("batch finished", len(done), "ok", len(fails), "failed", fails)


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    if cmd == "prompts":
        for e in BODY:
            for a in ACTIONS:
                (folder(e) / f"prompt-{a}.txt").write_text(prompt(e, a) + "\n", encoding="utf-8")
    elif cmd == "gen":
        print(round(gen(rest[0], rest[1], *rest[2:])), "s")
    elif cmd == "proc":
        proc(*rest)
    elif cmd == "procall":
        for e in rest or BODY:
            for a in ACTIONS:
                if (folder(e) / f"raw-{a}.png").exists():
                    proc(e, a)
    elif cmd == "acceptall":
        for e in rest or BODY:
            for a in ACTIONS:
                accept(e, a)
    elif cmd == "accept":
        accept(*rest)
    elif cmd == "contact":
        print(contact(rest[0], rest[1:] or None))
    elif cmd == "chapters":
        for t in dict.fromkeys(e.split("-")[0] for e in BODY):
            print(chapter(t))
    elif cmd == "qc":
        report = {}
        for e in rest or BODY:
            for a in ACTIONS:
                if (work(e, a) / "proc/sheet-transparent.png").exists():
                    report[f"{e}/{a}"] = measure(e, a)
        (SCRATCH / "qc.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
        for k, v in report.items():
            if v["flags"]:
                print(k, v["flags"])
        print(len(report), "sheets", sum(1 for v in report.values() if v["flags"]), "flagged")
    elif cmd == "batch":
        args = dict(zip(rest[::2], rest[1::2]))
        batch(int(args.get("--workers", 3)), args["--only"].split(",") if "--only" in args else None, args["--actions"].split(",") if "--actions" in args else None,
              args.get("--model", DEFAULT[0]), args.get("--effort", DEFAULT[1]), "--redo" in args)
