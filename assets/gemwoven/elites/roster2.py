"""The second wave of elites: three more per chapter (third to fifth of the chapter's five), designed here in one place.

anim.py (BODY, FALL) and assets/fx/elites/skill_prompts.py (FX) read this roster; world.js, boss-chapters.js and
foe-skills.js hold the game's copy of the kits. This file also draws what those two do not: the master, the action idle
and the two fidgets of each (recipes: RECIPE.txt, FIDGETS.txt).

  python roster2.py list
  python roster2.py run [--workers N] [--only id,id] [--stages master,idle,fidgets,body,fx] [--model m] [--effort e]
                                        draw everything still missing, hidden, resumable
  python roster2.py replace <id> [...]  place the kept fidget raws again
  python roster2.py reidle <id> [...]   stabilize the kept idle raw again
  python roster2.py review <id> [...]   one review sheet per elite in .build-cache/elite-anim/review-<id>.png
"""
import json
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
GEN = "C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py"
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
SCRATCH = ROOT / ".build-cache/elite-anim"
NO_WINDOW = 0x08000000
DEFAULT = ("gpt-6.1-sol", "low")

# Skill poses: frames 2-5 of the six, shared by what the weapon does.
def bow_up(w):
    return f"2 leans back, {w} tilted up toward the upper LEFT, an arrow drawn from the quiver; 3 full draw aimed steeply up to the upper LEFT, bow arm locked, the string at the cheek; 4 release: the arrow gone, the string snapped back straight, the bow no longer bent, the drawing hand open and empty, still looking up; 5 eyes following the arrows up, the bow lowering a little"
def bow_fan(w):
    return f"2 three arrows nocked at once on {w}, the bow turned flat, knees bent; 3 full draw aimed level to the LEFT, bow arm locked, the string at the cheek; 4 release: the arrows gone, the string snapped back straight, the bow no longer bent, the drawing hand open and empty; 5 the hand already reaching back to the quiver, the bow still aimed"
def xbow_up(w):
    return f"2 {w} shouldered and tilted up to the upper LEFT, one eye closed, knees bent; 3 braced hard, the aim held steady, the string taut; 4 fired: the bowstring snapped forward, the bolt gone, the weapon kicking up and the shoulders pushed back; 5 lowering {w} a little, one hand cranking its lever"
def xbow_level(w):
    return f"2 {w} shouldered and aimed level to the LEFT, rear knee bent, cheek on the stock; 3 braced, the aim held steady, the string taut; 4 fired: the bowstring snapped forward, the bolt gone, the weapon kicking back into the shoulder; 5 one hand cranking its lever, the aim still held"
def staff_ground(w):
    return f"2 {w} raised in both hands, the head bowed; 3 lifted overhead; 4 {w} planted hard on the ground in front to the LEFT, the free hand spread toward the ground, the robes flying; 5 still leaning on it, the free hand rising slowly"
def staff_sky(w):
    return f"2 {w} lifted overhead, its head lit, the free hand opening; 3 pointing straight up at the sky at full reach; 4 {w} brought down and pointed to the LEFT at the target, the free hand behind it, the clothes blown back; 5 held out, its head still lit"
def staff_level(w):
    return f"2 {w} drawn back in both hands, chest filling; 3 swinging forward; 4 {w} levelled straight out to the LEFT at shoulder height, its head blazing, braced, the clothes blown back; 5 holding it braced, leaning into the recoil"
def hand_out(w):
    return f"2 {w} held out, the free hand circling, the clothes lifting; 3 the circle widening; 4 the free hand thrust out to the LEFT, fingers spread, {w} blazing behind it; 5 the hand closing and pulling slowly back"
def orb_cast(w):
    return f"2 {w} lifted to the forehead, eyes shut; 3 {w} held out, the head lifting; 4 {w} thrust straight out to the LEFT in both hands, the eyes wide open and shining, the sleeves blown back; 5 holding it braced"
def two_cuts(w):
    return f"2 {w} drawn back low with both hands, the head lowered; 3 a rising cut to the upper LEFT; 4 a falling cut down to the LEFT at full reach; 5 a level cut back across, the body twisted"
def wide_sweep(w):
    return f"2 {w} held out low to the RIGHT in both hands, the body coiled to the RIGHT; 3 the wide sweep begins, the weapon skimming the ground; 4 full wide sweep: {w} level across the front to the LEFT at knee height, the arms extended; 5 carried on past, the body twisted, the clothes settling"
def ground_slam(w):
    return f"2 {w} lifted overhead in both hands, the body arched back; 3 swung down hard; 4 {w} slammed into the ground in front to the LEFT, knees deep, back bent over it, a small glow at the point of impact; 5 still leaning on it, teeth gritted"
def long_lunge(w):
    return f"2 {w} drawn far back in both hands, crouching low; 3 springing forward to the LEFT, the back foot pushing off; 4 maximum lunge: {w} and body in one straight line to the LEFT at full reach (the point stays inside the cell); 5 {w} held out, the body rising"
def rush(w):
    return f"2 {w} couched under the arm, the body crouching very low; 3 surging forward to the LEFT; 4 a full charge: leaning far forward, {w} level to the LEFT at full reach, the clothes straight out behind; 5 skidding upright, {w} lifting"
def blades_rapid(w):
    return f"2 {w} crossed low, crouching; 3 a fast cut to the upper LEFT; 4 a fast cut down to the LEFT at full reach; 5 a level cut back across, the clothes swirling"
def fence_rapid(w):
    return f"2 a deep fencer's crouch, {w} low; 3 a very fast step forward to the LEFT; 4 the longest possible lunge: the arm and {w} in one straight line to the LEFT, the rear leg straight; 5 {w} flicked upward in a flourish"
def vanish_cut(w):
    return f"2 sinking down, the cloak drawn round the body, only the eyes showing; 3 very low, one foot behind, ready to vanish; 4 a backhand stab to the LEFT with one blade, the body twisted round behind it, the cloak flying; 5 the other blade driving in underneath, the body rising"
def roar_up(w):
    return f"2 {w} planted head down, both hands on it, the shoulders hunched; 3 the chest swelling, every light on the armour brightening; 4 chest thrown out, arms wide, the head thrown back, the lights at their brightest; 5 sagging back down, gripping {w}"

ROSTER = {}


def E(theme, slug, name, en, brief, w, blow, gather, skill, basic, s1, s2, fx, sig=None, shot=None, bowed=False, o="", sway="the cloth and small loose parts", fall=None):
    ROSTER[f"{theme}-{slug}"] = dict(theme=theme, name=name, en=en, brief=brief, w=w, o=o, blow=blow, gather=gather, skill=skill, basic=basic, s1=s1, s2=s2, fx=fx,
                                     sig=sig or {"fx": fx[0][0]}, shot=shot, bowed=bowed, sway=sway, fall=fall)


def guard(name, shield=.06):
    return [name, "guard", 0, {"shield": shield, "move": "aura"}]


def heal(name, amount=.05):
    return [name, "heal", 0, {"heal": amount, "move": "aura"}]


def pierce_shot(name, amount=.3):
    return [name, "pierce", .85, {"pierce": amount, "move": "shot"}]


LIVING_STAFF = "a gnarled staff grown from one root, topped by a glowing green stone"
E("forest", "mossdruid", "Đạo Sĩ Rêu Đá", "Moss Stone Druid",
  "a stooped old druid with a beard and cloak of thick hanging green moss, a stone-slab mask with two glowing amber eyes, bare root-like arms, flat stones strung across the chest, holding " + LIVING_STAFF,
  "the gnarled root staff with its green stone", "staff", ("raise", "the gnarled root staff"), hand_out("the gnarled root staff"),
  "Hạt Rêu", ["Rêu Hút Sinh Khí", "drain", .6, {"drain": 15, "move": "tether", "echo": "Hút Linh Lực"}], heal("Suối Rêu Hồi Sinh"),
  [("mossknot", "mote", "one knot of bright green moss and thin root threads with a small amber light inside"), ("mossball", "bolt", "a spinning ball of wet green moss with a stone core and a tail of small leaves")],
  shot="mossball", sway="the hanging moss of its beard and cloak")
E("forest", "stagchief", "Thủ Lĩnh Gạc Đá", "Stone Antler Chief",
  "a towering broad-shouldered clan chief with a stag skull helm carrying huge antlers of grey stone wrapped in moss, a bear-fur mantle over bark armour, leather straps with green gems, gripping a great two-handed stone axe",
  "the great two-handed stone axe", "great", ("brace", "the great stone axe held upright"), two_cuts("the great stone axe"),
  "Bổ Rìu Đá", ["Gạc Đá Song Trảm", "strike", .9, {"hits": 2, "move": "lunge", "echo": "Nanh Vuốt"}], guard("Giáp Gạc Đá"),
  [("antlercut", "slash", "two heavy curved axe cuts of grey stone chips and dark wet bark, torn green moss and leaves flying")], sway="the bear-fur mantle and straps")

E("volcano", "slagarcher", "Cung Thủ Hắc Diệu", "Obsidian Archer",
  "a lean archer in black obsidian-plate armour with glowing orange seams, a horned half-helm, a short ash-grey cape, a tall bow of black volcanic glass with a string of molten orange, and a quiver of burning arrows on the back",
  "the black glass bow", "bow", ("bowready", "the black glass bow"), bow_up("the black glass bow"),
  "Tên Lửa", ["Mưa Tên Dung Nham", "burn", .6, {"turns": 2, "dot": .14, "hits": 3, "move": "rain", "echo": "Mưa Tro Tàn"}], pierce_shot("Tên Hắc Diệu"),
  [("slagburst", "burst", "a burning arrow's impact: bright orange flame and black glass splinters thrown straight outward"), ("slagarrow", "bolt", "a black glass arrow with a burning orange head and a short tail of flame")],
  sig={"fx": "slagburst", "bolt": "slagarrow"}, shot="slagarrow", bowed=True, sway="the ash-grey cape")
E("volcano", "drakewarlord", "Long Tướng Dung Nham", "Lava Drake Warlord",
  "a huge dragon-blooded warlord with a horned reptile head, red scales, heavy black and bronze plate with lava-glowing seams, a tattered burning cape and a massive jagged obsidian cleaver held in both hands",
  "the massive obsidian cleaver", "great", ("brace", "the massive obsidian cleaver held upright"), wide_sweep("the massive obsidian cleaver"),
  "Bổ Đại Đao", ["Long Trảm Quét Lửa", "burn", .65, {"turns": 2, "dot": .15, "move": "sweep", "echo": "Long Vĩ Quật"}], guard("Giáp Long Lân"),
  [("lavasweep", "ground", "a low wide wave of bright flame and molten orange rock rolling along the ground, jagged black chunks in its crest")], sway="the tattered cape and thick tail")

E("ice", "foxhuntress", "Thợ Săn Hồ Tuyết", "Snow Fox Huntress",
  "a slim huntress wearing a white fox mask with blue markings, a white fox-fur hood and tail, pale blue leather armour, and a long pale-blue ice bow with a silver string",
  "the long ice bow", "bow", ("bowready", "the long ice bow"), bow_fan("the long ice bow"),
  "Tên Sương", ["Tiễn Sương Liên Hoàn", "strike", .85, {"hits": 3, "move": "volley", "echo": "Băng Thương"}], guard("Mặt Nạ Sương", .05),
  [("frostshatter", "burst", "an ice arrow's impact: thin pale blue crystal needles flying straight outward from a white point"), ("frostarrow", "bolt", "a slim arrow of clear pale blue ice with a silver head and white feather fletching")],
  sig={"fx": "frostshatter", "bolt": "frostarrow"}, shot="frostarrow", bowed=True, sway="the fox tail and fur hood")
E("ice", "moonjarl", "Tướng Quân Bạch Nguyệt", "White Moon General",
  "a massive general in white and silver plate with a heavy white bear-fur mantle, a closed helm crowned by a crescent moon, a long pale beard of frost, and a great double-bladed moon axe of blue ice held in both hands",
  "the great double-bladed moon axe", "great", ("brace", "the great moon axe held upright"), wide_sweep("the great moon axe"),
  "Bổ Rìu Trăng", ["Nguyệt Phủ Hàn Trảm", "drain", .7, {"drain": 15, "move": "sweep", "echo": "Hàn Phong"}], guard("Giáp Bạch Nguyệt"),
  [("moonfrost", "ground", "a broad curved crescent of ice crystals tearing along the ground, cobalt shadows under it, snow thrown up in solid clumps")], sway="the white fur mantle")

E("thunder", "boltgunner", "Nỏ Thủ Sấm Sét", "Thunder Crossbowman",
  "a nimble crossbowman in dark indigo leather and copper plates, a wide-brimmed storm hat, goggles lit yellow, a short cape, and a heavy copper crossbow crackling with small yellow sparks along its arms",
  "the heavy copper crossbow", "crossbow", ("bowready", "the heavy copper crossbow"), xbow_level("the heavy copper crossbow"),
  "Bắn Nỏ Sấm", ["Nỏ Sấm Liên Phát", "strike", .8, {"hits": 3, "move": "volley", "echo": "Ngũ Lôi"}], pierce_shot("Mũi Nỏ Xuyên Điện"),
  [("voltburst", "burst", "a charged bolt's impact: white and lemon-yellow forks jumping straight outward from a white point"), ("voltbolt", "bolt", "a short copper crossbow bolt wrapped in crackling white-yellow lightning")],
  sig={"fx": "voltburst", "bolt": "voltbolt"}, shot="voltbolt", bowed=True, sway="the short cape")
E("thunder", "stormmaul", "Đại Tướng Lôi Chùy", "Storm Maul General",
  "a giant warrior in heavy indigo and gold plate with a lion-crested helm, a storm-blue cape, thick gauntlets and a colossal two-handed maul with a yellow glowing core in its head",
  "the colossal two-handed maul", "smash", ("brace", "the colossal maul held upright"), roar_up("the colossal maul"),
  "Nện Chùy Sấm", ["Chấn Động Lôi Trường", "strike", .9, {"move": "roar", "echo": "Điện Trường"}], ["Búa Sấm Truy Kích", "pierce", .9, {"pierce": .35, "move": "charge"}],
  [("thunderring", "burst", "a flat shockwave ring of white and lemon-yellow lightning thrown outward, dark indigo cracks under it")], sig={"fx": "thunderring", "windup": 2, "release": 3}, sway="the storm-blue cape")

E("marsh", "toadshaman", "Pháp Sư Cóc Đầm", "Bog Toad Shaman",
  "a squat toad-headed shaman with wide yellow eyes, warty olive skin, a cloak of dry reeds and rags, strings of bones and small skulls, holding up a big bubbling gourd rattle in both hands",
  "the bubbling gourd rattle", "orb", ("raise", "the bubbling gourd rattle"), orb_cast("the bubbling gourd rattle"),
  "Phun Nhựa Độc", ["Lưỡi Cóc Hút Độc", "drain", .6, {"drain": 15, "move": "tether", "echo": "Rễ Bào Tử"}], heal("Bùn Hồi Sinh"),
  [("toadtongue", "mote", "one thick wet bead of sticky lime-green toxin with a dark olive skin"), ("toadglob", "bolt", "a fat glob of lime-green toxin with a tail of olive mud drops")],
  shot="toadglob", sway="the reed cloak and strings of bones")
E("marsh", "bogwarlord", "Thủ Lĩnh Bùn Đen", "Black Mud Warlord",
  "a huge hulking ogre-like warlord caked in black mud and dripping moss, a crown of reeds and bone, one tusk, rusted chest plate, swinging an enormous waterlogged tree-trunk club bound with iron bands",
  "the enormous tree-trunk club", "smash", ("brace", "the tree-trunk club held upright"), ground_slam("the tree-trunk club"),
  "Nện Khúc Gỗ", ["Bùn Đen Nhấn Chìm", "poison", .6, {"turns": 2, "dot": .13, "move": "snare", "echo": "Bào Tử Độc"}], guard("Giáp Bùn Khô"),
  [("blackmire", "ground", "a pit of black mud heaving up in thick grasping fingers of mud round lime-green toxin bubbles")], sway="the dripping moss and reed crown")

E("desert", "sunarcher", "Cung Thủ Mặt Trời", "Sun Archer",
  "a tall archer in white linen wrappings and gold collar, a falcon-beaked gold mask, a teal sash, and a great curved golden bow shaped like two falcon wings",
  "the great golden wing bow", "bow", ("bowready", "the great golden wing bow"), bow_up("the great golden wing bow"),
  "Tên Vàng", ["Mưa Tên Mặt Trời", "strike", .8, {"hits": 3, "move": "rain", "echo": "Hào Quang Phán Quyết"}], ["Tên Bọ Cạp", "poison", .55, {"turns": 2, "dot": .12, "move": "shot"}],
  [("sunspark", "burst", "a golden arrow's impact: white-hot sun rays and amber sand thrown straight outward"), ("sunarrow", "bolt", "a slim golden arrow with a white-hot head and a teal scarab fletching")],
  sig={"fx": "sunspark", "bolt": "sunarrow"}, shot="sunarrow", bowed=True, sway="the linen wrappings and teal sash")
E("desert", "sphinxguard", "Tướng Nhân Sư", "Sphinx General",
  "a powerful lion-headed general with a thick golden mane, a striped blue and gold royal headdress, gold breastplate and greaves, a pleated white kilt and a long golden glaive with a scarab at its blade, and a thick curled lion tail with a golden tuft, always drawn attached behind the body",
  "the long golden glaive", "thrust", ("brace", "the long golden glaive"), long_lunge("the long golden glaive"),
  "Đâm Trường Đao", ["Nhân Sư Xuyên Thánh", "pierce", .9, {"pierce": .35, "move": "thrust", "echo": "Sừng Vàng Xuyên Phá"}], guard("Khiên Nhân Sư"),
  [("sphinxstreak", "streak", "a glaive thrust of amber sand and white-hot sun light, its wide left end a roaring lion's head of sand")], sway="the mane and tail")

E("abyss", "harpooner", "Thợ Săn Lao Móc", "Reef Harpooner",
  "a wiry sea hunter with grey shark skin, a coral-crusted leather harness, a rope coiled over the shoulder, fins along the arms, aiming a big wooden harpoon crossbow tipped with a barbed bone hook",
  "the big harpoon crossbow", "crossbow", ("bowready", "the big harpoon crossbow"), xbow_level("the big harpoon crossbow"),
  "Phóng Lao", ["Lao Móc Kéo Linh", "drain", .65, {"drain": 15, "move": "tether", "echo": "Thủy Long Tức"}], pierce_shot("Lao Xuyên Giáp"),
  [("harpoonlink", "mote", "one thick wet rope knot with a small barbed red-orange coral hook through it, a little white foam"), ("harpoon", "bolt", "a long barbed bone harpoon with a short tail of wet rope and white foam")],
  shot="harpoon", bowed=True, sway="the coiled rope and harness straps")
E("abyss", "krakenlord", "Thuyền Trưởng Xúc Tu", "Kraken Captain",
  "a huge drowned sea captain with a beard of thick teal octopus tentacles, a barnacled tricorn hat, a long rotting navy coat with gold buttons, and a rusted ship's anchor carried as a two-handed weapon on a chain",
  "the rusted ship's anchor", "great", ("brace", "the rusted anchor held upright"), wide_sweep("the rusted anchor"),
  "Quật Mỏ Neo", ["Xúc Tu Cuộn Sóng", "strike", .95, {"hits": 2, "move": "sweep", "echo": "Hàn Băng Tức"}], guard("Giáp Vỏ Sò"),
  [("krakensurge", "ground", "thick teal tentacles rising and curling out of a rolling wave of sea water, white foam, red-orange coral chips")], sway="the tentacle beard and coat tails")

E("foundry", "steamgunner", "Pháo Thủ Hơi Nước", "Steam Gunner",
  "a stout gunner in a brass diving-style helmet with a round glass visor, a leather apron, thick gloves, brass tanks on the back joined by pipes to a big flared brass steam cannon held at the hip",
  "the big flared brass steam cannon", "staff", ("raise", "the brass steam cannon"), staff_level("the brass steam cannon"),
  "Bắn Đạn Hơi", ["Pháo Hơi Cao Áp", "strike", .8, {"hits": 3, "move": "beam", "echo": "Nạp Lõi Hơi Nước"}], guard("Van Xả Giáp", .05),
  [("steamjet", "beam", "a thick jet of solid white steam with brass rivets and orange sparks carried along it"), ("steamshell", "bolt", "a small brass shell with a tail of solid white steam puffs")],
  shot="steamshell", sway="the pipes and leather apron")
E("foundry", "chiefengineer", "Kỹ Sư Trưởng Tia Lửa", "Chief Spark Engineer",
  "a tall imposing chief engineer in a long brown leather coat with brass plates and a large gear on the back, tall top hat with goggles, a mechanical left arm, and a tall copper coil staff with a glowing orange spark ball at the top",
  "the tall copper coil staff", "staff", ("raise", "the tall copper coil staff"), staff_sky("the tall copper coil staff"),
  "Tia Lửa Cuộn", ["Sét Cuộn Dây", "strike", .85, {"hits": 3, "move": "strikes", "echo": "Búa Tạ Cơ Khí"}], heal("Robot Sửa Giáp"),
  [("teslabolt", "pillar", "a jagged forked bolt of orange and white sparks striking straight down, brass coil rings around it, a small burst of sparks where it lands"), ("coilspark", "bolt", "a small ball of orange sparks inside a spinning copper ring")],
  sig={"fx": "teslabolt", "shaft": {"band": [.12, .3], "cols": [.3, .7]}}, shot="coilspark", sway="the long coat and the slowly turning gear")

E("crystal", "prismarcher", "Cung Thủ Lăng Kính", "Prism Archer",
  "a graceful archer in sleek blue crystal plates over a dark blue bodysuit, a crest of tall cyan shards on the head, a faceted visor, and a long crystal bow with a thin white string of light",
  "the long crystal bow", "bow", ("bowready", "the long crystal bow"), bow_fan("the long crystal bow"),
  "Tên Lăng Kính", ["Tiễn Lăng Kính Tán Xạ", "strike", .85, {"hits": 3, "move": "volley", "echo": "Quang Phổ Rạn Nứt"}], pierce_shot("Tên Kim Cương", .35),
  [("prismsplash", "burst", "a crystal arrow's impact: sharp cyan and blue gem splinters fanning straight outward with white highlights"), ("prismarrow", "bolt", "a slim faceted cyan crystal arrow with a thin white light tail")],
  sig={"fx": "prismsplash", "bolt": "prismarrow"}, shot="prismarrow", bowed=True, sway="the shards of its crest catching the light")
E("crystal", "geodeguard", "Tướng Tinh Giáp", "Geode General",
  "a giant mantis-like humanoid general in thick dark armour split by geodes of bright cyan crystal, four-horned crest, broad shoulders, holding two long curved crystal sickle blades",
  "the two long curved crystal sickles", "dual", ("brace", "the two crystal sickles crossed"), blades_rapid("the two crystal sickles"),
  "Song Liềm Tinh", ["Song Liềm Tinh Giáp", "strike", .9, {"hits": 2, "move": "lunge", "echo": "Song Liềm Liên Trảm"}], guard("Giáp Tinh Động"),
  [("geodecross", "slash", "two crossing curved sickle cuts of cyan gem shards with white highlights, blue splinters flying")], sway="the small crystals glinting in its armour")

E("haunted", "banshee", "Nữ Vong Than Khóc", "Wailing Banshee",
  "a thin floating ghost woman with long white hair streaming upward, a tattered grey burial gown, hollow glowing blue-green eyes, a mouth open in a wail, holding a cracked pale blue spirit lantern-orb in both hands, her hem fading into solid torn cloth strips",
  "the cracked spirit orb", "orb", ("raise", "the cracked spirit orb"), orb_cast("the cracked spirit orb"),
  "Hồn Cầu", ["Tiếng Than Cướp Hồn", "drain", .6, {"drain": 15, "move": "spiral", "echo": "Hút Hồn"}], guard("Màn Sương Vong Hồn", .05),
  [("wailmote", "mote", "one small screaming blue-green ghost face wisp with a thin curling tail"), ("wailorb", "bolt", "a small cold blue-green ghost fire orb with a wailing face and a torn tail")],
  shot="wailorb", sway="the long white hair and torn gown", fall="fade")
E("haunted", "necrolord", "Vu Sư Xương Trắng", "Bone Necromancer",
  "a tall imposing skeletal necromancer in a high-collared black robe with iron bone-trim, a crown of ribs, cold blue-green fire in its eye sockets, holding a tall staff topped with a horned skull and a blue-green flame",
  "the tall horned skull staff", "staff", ("raise", "the tall horned skull staff"), staff_ground("the tall horned skull staff"),
  "Lửa Sọ", ["Cột Hồn Xương Trắng", "strike", .9, {"move": "column", "echo": "Nguyệt Trảm"}], heal("Lễ Hồi Xương"),
  [("bonepillar", "pillar", "a narrow shaft of cold blue-green ghost fire with grey bones turning in it, coming straight down, a splash of ghost flame and bone shards at its foot"), ("skullflame", "bolt", "a small bone-grey skull wrapped in cold blue-green flame flying head first")],
  sig={"fx": "bonepillar", "shaft": {"band": [.12, .3], "cols": [.3, .7]}}, shot="skullflame", sway="the black robe and the skull's flame")

E("sky", "galearcher", "Cung Thủ Phong Vân", "Gale Archer",
  "a light agile archer with small white wings on the back, a sky-blue tunic with white feather shoulders, a beaked half-mask, long scarf, and a slender white bow shaped like a bird's spread wing",
  "the slender white wing bow", "bow", ("bowready", "the slender white wing bow"), bow_up("the slender white wing bow"),
  "Tên Gió", ["Mưa Lông Vũ Tiễn", "strike", .8, {"hits": 3, "move": "rain", "echo": "Phong Vũ"}], pierce_shot("Tiễn Gió Xuyên Mây"),
  [("featherburst", "burst", "a feather arrow's impact: sky-blue wind streaks and white feathers thrown straight outward"), ("featherarrow", "bolt", "a slim white feather-shaped arrow with a short sky-blue wind tail")],
  sig={"fx": "featherburst", "bolt": "featherarrow"}, shot="featherarrow", bowed=True, sway="the long scarf and wing feathers")
E("sky", "tempestmage", "Pháp Sư Bão Cánh", "Tempest Mage",
  "a tall stern storm mage in layered sky-blue and white robes with great feathered shoulders, a hood shaped like an eagle's head, a yellow-eyed face, holding a tall staff with a spinning ring of wind vanes at its head",
  "the tall wind-vane staff", "staff", ("raise", "the tall wind-vane staff"), staff_ground("the tall wind-vane staff"),
  "Cầu Gió", ["Lốc Xoáy Thiên Không", "drain", .65, {"drain": 15, "move": "sweep", "echo": "Lốc Cướp Linh"}], guard("Mây Hộ Thân", .05),
  [("twister", "ground", "a low wide twisting wall of solid white cloud and sky-blue wind bands rolling along the ground with white feathers caught in it"), ("galeorb", "bolt", "a small tight ball of sky-blue wind streaks with a white feather tail")],
  shot="galeorb", sway="the robes and feathers")

E("thorns", "rosearcher", "Cung Thủ Hồng Gai", "Rose Thorn Archer",
  "an elegant archer in dark green leaf-and-thorn armour, a wide hat with a big crimson rose, a short petal cape, and a long dark green bow twisted from one thorned stem with a rose bloom at the grip",
  "the long thorned stem bow", "bow", ("bowready", "the long thorned stem bow"), bow_up("the long thorned stem bow"),
  "Tên Gai", ["Mưa Cánh Hồng Độc", "poison", .55, {"turns": 2, "dot": .12, "hits": 3, "move": "rain", "echo": "Gai Độc"}], ["Mũi Gai Hút Máu", "lifesteal", .75, {"leech": .2, "move": "shot"}],
  [("rosepop", "burst", "a thorn arrow's impact: crimson rose petals and dark green thorn splinters thrown straight outward"), ("rosearrow", "bolt", "a slim dark green thorn arrow with a crimson rosebud head")],
  sig={"fx": "rosepop", "bolt": "rosearrow"}, shot="rosearrow", bowed=True, sway="the petal cape and hat rose")
E("thorns", "bramblewarden", "Thống Lĩnh Bụi Gai", "Bramble Warden",
  "a massive knight in black iron plate overgrown by thick thorned vines and crimson roses, a helm with a rose-shaped visor, a long thorn cape, and a huge greatsword bound in thorns along its blade",
  "the huge thorn-bound greatsword", "great", ("brace", "the huge thorn-bound greatsword held upright"), wide_sweep("the huge thorn-bound greatsword"),
  "Chém Gai", ["Bụi Gai Đại Trảm", "strike", .95, {"move": "sweep", "echo": "Rừng Gai"}], guard("Giáp Bụi Gai"),
  [("brambleline", "ground", "a low line of thick dark green thorned brambles tearing along the ground, crimson petals thrown up")], sway="the thorn cape and vines")

E("celestial", "choirmaid", "Nữ Tu Thánh Ca", "Hymn Sister",
  "a serene temple singer in white and cream robes with gold trim, a small halo ring over a veil, small cream wings at the shoulders, her eyes closed, holding a large golden harp in both hands, its strings glowing warm white",
  "the large golden harp", "orb", ("raise", "the large golden harp"), orb_cast("the large golden harp"),
  "Nốt Thánh", ["Thánh Ca Xuyên Không", "pierce", .8, {"pierce": .3, "move": "beam", "echo": "Hào Quang Phán Quyết"}], heal("Khúc Hồi Sinh"),
  [("hymnray", "beam", "a band of warm white light carrying soft yellow musical rings and small cream feathers along it"), ("hymnnote", "bolt", "a small warm white light ring like a struck harp note with a cream feather tail")],
  shot="hymnnote", sway="the veil and sleeves")
E("celestial", "dawnlegate", "Thiên Tướng Bình Minh", "Dawn Legate",
  "a towering armoured angel general in gold and white plate with four great cream wings, a sun-rayed closed helm, a red plume, and a long golden halberd with a sun-shaped blade held in both hands",
  "the long golden halberd", "thrust", ("brace", "the long golden halberd"), rush("the long golden halberd"),
  "Đâm Kích", ["Thiên Kích Xung Phong", "pierce", .9, {"pierce": .35, "move": "charge", "echo": "Nhật Kiếm"}], guard("Khiên Bình Minh"),
  [("dawnbreak", "burst", "a halberd-charge impact: sharp rays of warm white and soft yellow light breaking outward, cream light-feathers thrown off")], sway="the red plume and wing feathers")

E("void", "riftstalker", "Sát Thủ Khe Nứt", "Rift Stalker",
  "a lean masked assassin in skin-tight black-indigo armour scattered with tiny white stars, a pale smooth mask with one glowing deep-blue slit, a torn star-cloak, and two long thin black daggers with blue edges",
  "the two long thin black daggers", "dual", ("brace", "the two thin black daggers crossed in front of the mask"), vanish_cut("the two thin black daggers"),
  "Song Chủy", ["Ám Bộ Khe Nứt", "execute", .85, {"threshold": .35, "bonus": 1.4, "move": "vanish", "echo": "Hư Không Phán Quyết"}], ["Song Chủy Tinh Vân", "strike", .8, {"hits": 3, "move": "flurry"}],
  [("riftcut", "slash", "two thin crossing cuts opening onto black-indigo void, tiny white stars inside, thin deep-blue rims")], sway="the torn star-cloak")
E("void", "cometlord", "Chúa Tể Sao Chổi", "Comet Lord",
  "a tall ancient sorcerer king in a black and deep-blue star-field robe with a broad collar, a jagged crown of meteor rock, a pale blue face with white eyes, holding a huge staff topped by a captured burning comet",
  "the huge comet staff", "staff", ("raise", "the huge comet staff"), staff_sky("the huge comet staff"),
  "Đạn Sao Chổi", ["Sao Chổi Giáng Thế", "strike", .9, {"hits": 2, "move": "rain", "echo": "Tinh Vân Bạo Phát"}], guard("Hào Quang Hư Không", .05),
  [("cometburst", "burst", "a comet's impact: black-indigo rock fragments and white star sparks bursting from a white core, thin deep-blue rims"), ("cometbolt", "bolt", "a small dark rock comet with a white head and a long deep-blue tail of tiny stars")],
  sig={"fx": "cometburst", "bolt": "cometbolt"}, shot="cometbolt", sway="the star-field robe")

E("eldergrove", "petalarcher", "Cung Thủ Hoa Trắng", "White Blossom Archer",
  "a slender forest ranger in pale birch-bark armour and a cream hooded mantle of white blossoms, a carved pale mask, and a long pale birch bow with small peach-white flowers along it",
  "the long pale birch bow", "bow", ("bowready", "the long pale birch bow"), bow_up("the long pale birch bow"),
  "Tên Bạch Hoa", ["Mưa Tên Phấn Hoa", "poison", .55, {"turns": 2, "dot": .12, "hits": 3, "move": "rain", "echo": "Nở Hoa Ký Sinh"}], pierce_shot("Tên Bạch Dương"),
  [("petalburst", "burst", "a blossom arrow's impact: peach-white petals and solid pale pollen puffs thrown straight outward"), ("petalarrow", "bolt", "a slim pale birch arrow with a white blossom head and petal fletching")],
  sig={"fx": "petalburst", "bolt": "petalarrow"}, shot="petalarrow", bowed=True, sway="the blossom mantle")
E("eldergrove", "birchelder", "Trưởng Lão Bạch Dương", "Birch Elder",
  "a tall old tree elder whose body is pale white birch with black bark marks, a long beard of light green lichen, antler-like branches heavy with white blossoms on its head, holding a long living birch staff with a glowing sap bead",
  "the long living birch staff", "staff", ("raise", "the long living birch staff"), staff_ground("the long living birch staff"),
  "Giọt Nhựa", ["Rễ Bạch Dương Đâm Lên", "drain", .65, {"drain": 15, "move": "snare", "echo": "Chưởng Rễ Đâm Xuyên"}], heal("Mùa Xuân Nhỏ"),
  [("birchspikes", "ground", "pale white birch roots with black marks stabbing up in a ring from the ground and curling inward, light green buds opening among them"), ("sapbead", "bolt", "a bright amber-green drop of tree sap with a tail of peach-white petals")],
  shot="sapbead", sway="the lichen beard and blossoms")

E("caldera", "slagslinger", "Thợ Ném Xỉ Nóng", "Slag Slinger",
  "a stocky furnace worker with a black iron mask, heavy scorched leather apron and gauntlets, burn-scarred arms, swinging a heavy iron ladle-bucket of glowing molten slag on a long chain",
  "the molten slag bucket on its chain", "censer", ("raise", "the molten slag bucket on its chain"), "2 the bucket whirled in a wide circle overhead on its chain; 3 the chain at full stretch above the head, molten slag glowing at the rim; 4 the bucket slammed down onto the ground in front to the LEFT, the free hand raised, knees bent; 5 crouched over the bucket on the ground, its rim blazing",
  "Ném Xỉ", ["Hố Xỉ Sôi", "burn", .6, {"turns": 2, "dot": .14, "move": "snare", "echo": "Nung Chảy Phòng Tuyến"}], ["Xích Xỉ Hút Nhiệt", "drain", .6, {"drain": 12, "move": "tether"}],
  [("slagpit", "ground", "a pit of glowing orange lava seams cracking open in black basalt, molten drops heaving up from it"), ("slagball", "bolt", "a molten orange ball of slag with a black crust and drips in its tail")],
  shot="slagball", sway="the chain and leather apron")
E("caldera", "obsidianlord", "Chúa Hắc Diệu", "Obsidian Lord",
  "an enormous knight of polished black obsidian with orange lava showing through the joints, a horned crown-helm, a ragged charred cape and a giant jagged obsidian greatsword with a molten edge",
  "the giant obsidian greatsword", "great", ("brace", "the giant obsidian greatsword held upright"), two_cuts("the giant obsidian greatsword"),
  "Bổ Hắc Kiếm", ["Hắc Diệu Trọng Trảm", "execute", .9, {"threshold": .35, "bonus": 1.4, "move": "lunge", "echo": "Song Quyền Nham Chấn"}], guard("Giáp Hắc Diệu"),
  [("obsidiancut", "slash", "two heavy cuts of black glass shards with glowing orange lava edges, yellow-hot sparks flying")], sway="the charred cape")

E("glacier", "frostbolter", "Xạ Thủ Hàn Đài", "Frost Tower Bolter",
  "a broad watchman in thick white fur coat and steel-blue plate, a full-face steel helm with ice crusting one side, a wool scarf, and a heavy steel-blue winch crossbow loaded with a thick ice bolt",
  "the heavy winch crossbow", "crossbow", ("bowready", "the heavy winch crossbow"), xbow_up("the heavy winch crossbow"),
  "Bắn Nỏ Băng", ["Nỏ Băng Tam Phát", "strike", .85, {"hits": 3, "move": "volley", "echo": "Băng Thương Tam Liên"}], pierce_shot("Mũi Nỏ Xuyên Băng"),
  [("glacierchip", "burst", "a thick ice bolt's impact: blue-white ice blocks cracking apart with thrown snow"), ("glacierbolt", "bolt", "a thick blunt bolt of blue-white ice with a steel-blue head and a tail of snow")],
  sig={"fx": "glacierchip", "bolt": "glacierbolt"}, shot="glacierbolt", bowed=True, sway="the fur coat and scarf")
E("glacier", "wintergeneral", "Thống Soái Đông Giá", "Winter Marshal",
  "a colossal ice-armoured marshal, plates of thick blue-white glacier ice over dark steel, a tall crown of icicles on a closed helm, a heavy white fur mantle and a huge glacier-ice greatsword as long as its body",
  "the huge glacier-ice greatsword", "great", ("brace", "the huge glacier-ice greatsword held upright"), wide_sweep("the huge glacier-ice greatsword"),
  "Chém Băng Kiếm", ["Đông Chí Đại Trảm", "strike", 1, {"move": "sweep", "echo": "Vương Miện Hàn Ngục"}], guard("Giáp Đông Chí"),
  [("winterwall", "ground", "a low heavy wave of thick blue-white ice blocks shoved along the ground, white snow bursting up behind it")], sway="the fur mantle")

E("stormspire", "galeduelist", "Kiếm Khách Phong Lôi", "Storm Duelist",
  "a tall dashing duelist in a navy long coat with gold trim and a high collar, a feathered gold half-mask, one eagle wing on the right shoulder, and a thin golden rapier crackling with small gold sparks",
  "the thin golden rapier", "rapier", ("brace", "the thin golden rapier held upright before the face in salute"), fence_rapid("the thin golden rapier"),
  "Đâm Lôi Kiếm", ["Lôi Kiếm Liên Đâm", "strike", .85, {"hits": 4, "move": "flurry", "echo": "Lôi Trảo Liên Kích"}], ["Tụ Điện Kiếm", "charge", .5, {"charge": 1.25, "move": "aura"}],
  [("goldstab", "slash", "several straight thin rapier stabs of golden yellow lightning crossing the cell, white cores, navy shadows")], sway="the coat tails and wing feathers")
E("stormspire", "thunderarchon", "Thiên Lôi Chấp Pháp", "Thunder Archon",
  "a towering storm judge in navy and gold ceremonial armour with broad eagle-wing pauldrons, a tall spired helm, a long navy tabard with a gold lightning mark, holding a tall golden sceptre topped by a storm-eagle head",
  "the tall golden sceptre", "staff", ("raise", "the tall golden sceptre"), staff_sky("the tall golden sceptre"),
  "Ấn Lôi", ["Thiên Lôi Chấp Pháp Lệnh", "strike", .85, {"hits": 3, "move": "strikes", "echo": "Sấm Xuyên Tầng Mây"}], guard("Lông Lôi Hộ Thể", .05),
  [("judgebolt", "pillar", "a jagged bolt of golden yellow lightning striking straight down, navy shadow edges, a small burst of gold arcs where it lands"), ("thunderseal", "bolt", "a small golden lightning seal disc with a white core and a jagged tail")],
  sig={"fx": "judgebolt", "shaft": {"band": [.12, .3], "cols": [.3, .7]}}, shot="thunderseal", sway="the long tabard")

E("soulcrypt", "wailbinder", "Nữ Tu Xích Hồn", "Chain Sister",
  "a gaunt prison nun in a black and dark iron habit, the veil held by iron bands, her eyes bound with violet-glowing cloth, long iron rosary chains hanging from her arms, holding a dark iron cage-orb with a violet soul inside in both hands",
  "the iron cage-orb", "orb", ("raise", "the iron cage-orb"), orb_cast("the iron cage-orb"),
  "Hạt Hồn", ["Xích Tràng Hạt Hút Hồn", "drain", .65, {"drain": 15, "move": "tether", "echo": "Xiềng Xích Hút Sinh"}], heal("Hồn Lung Hồi Sinh"),
  [("rosarybead", "mote", "one dark iron prayer bead on a chain link with a small deep-violet soul flame round it"), ("soulbead", "bolt", "a small deep-violet soul flame in a dark iron ring with a short chain tail")],
  shot="soulbead", sway="the veil and rosary chains")
E("soulcrypt", "dreadwarden", "Cai Đội Ngục Thần", "Dread Warden",
  "a huge executioner in spiked dark iron plate, a hood of chainmail, a bronze cage helm with violet fire inside, chains and locks hung at the belt, and a colossal two-handed headsman's axe of black iron",
  "the colossal headsman's axe", "great", ("brace", "the colossal headsman's axe held upright"), two_cuts("the colossal headsman's axe"),
  "Bổ Đầu Rìu", ["Trảm Hồn Đoạn Ngục", "execute", .9, {"threshold": .35, "bonus": 1.4, "move": "lunge", "echo": "Liềm Cắt Hồn"}], guard("Giáp Ngục Thần"),
  [("dreadcleave", "slash", "two huge axe cuts of deep-violet soul fire with dark iron sparks and broken chain links")], sway="the hanging chains and locks")

E("mycelium", "sporearcher", "Cung Thủ Nấm Mục", "Mold Archer",
  "a lean ragged archer with a rust-red spotted mushroom cap as a hat, a pale fungal face with sunken yellow-green eyes, a cloak of rotten leaves and pale threads, and a crooked bow of dead wood strung with white fungal thread",
  "the crooked dead-wood bow", "bow", ("bowready", "the crooked dead-wood bow"), bow_up("the crooked dead-wood bow"),
  "Tên Mốc", ["Mưa Tên Nấm", "poison", .55, {"turns": 3, "dot": .1, "hits": 3, "move": "rain", "echo": "Mưa Bào Tử Lục"}], pierce_shot("Tên Sợi Nấm"),
  [("moldburst", "burst", "a fungal arrow's impact: rust-red cap chips and solid sick yellow-green spore puffs thrown straight outward"), ("moldarrow", "bolt", "a slim dead-wood arrow with a small rust-red mushroom head and pale thread fletching")],
  sig={"fx": "moldburst", "bolt": "moldarrow"}, shot="moldarrow", bowed=True, sway="the ragged cloak and threads")
E("mycelium", "rotchampion", "Đấu Sĩ Mục Rữa", "Rot Champion",
  "a massive armoured champion whose rusted plate has burst open with shelves of rust-red bracket fungus, a helm split by a mushroom, pale threads binding the joints, and a huge rusted cleaver dripping sick yellow-green rot",
  "the huge rusted cleaver", "great", ("brace", "the huge rusted cleaver held upright"), two_cuts("the huge rusted cleaver"),
  "Bổ Dao Rữa", ["Trảm Mục Rữa", "lifesteal", .8, {"leech": .2, "move": "lunge", "echo": "Hấp Thu Hoại Chất"}], guard("Giáp Nấm Thối"),
  [("rotslash", "slash", "two heavy cuts of sick yellow-green rot with rust-red fungal flecks and pale threads torn along them")], sway="the pale threads and fungus shelves")

E("geode", "lodeshooter", "Thợ Mỏ Nỏ Tinh", "Lode Bolter",
  "a short sturdy miner in a dented hard hat with a lantern, a thick stone-dust leather coat with crystal chips, a big mustache, and a heavy stone crossbow firing bolts of bright blue crystal",
  "the heavy stone crossbow", "crossbow", ("bowready", "the heavy stone crossbow"), xbow_level("the heavy stone crossbow"),
  "Bắn Nỏ Tinh", ["Nỏ Tinh Thạch Liên Phát", "strike", .85, {"hits": 2, "move": "volley", "echo": "Pháo Lăng Kính"}], guard("Hào Mỏ Hộ Thân", .05),
  [("oreburst", "burst", "a crystal bolt's impact: grey-tan stone chips and bright blue crystal splinters thrown straight outward"), ("orebolt", "bolt", "a short thick bolt of bright blue crystal in a stone socket with a small dust tail")],
  sig={"fx": "oreburst", "bolt": "orebolt"}, shot="orebolt", bowed=True, sway="the coat and hat lantern")
E("geode", "minechief", "Trưởng Mỏ Tinh Thạch", "Mine Chief",
  "a giant stone-skinned foreman in rough tan plate with bright blue crystals growing from the shoulders, a moss beard, a heavy tool belt, swinging a colossal two-handed pickaxe with a crystal head",
  "the colossal crystal pickaxe", "great", ("brace", "the colossal crystal pickaxe held upright"), ground_slam("the colossal crystal pickaxe"),
  "Bổ Cuốc Đá", ["Cuốc Chấn Động", "strike", 1, {"move": "sweep", "echo": "Chấn Địa Tinh Nham"}], guard("Giáp Thạch Anh", .07),
  [("quakeline", "ground", "a jagged line of grey-tan stone slabs bursting up along the ground, bright blue crystals jutting out, dust thrown up in solid clumps")], sway="the moss beard and tool belt")

E("hourglass", "sandarcher", "Xạ Thủ Cát Chảy", "Flowing Sand Archer",
  "a veiled desert archer in cream and teal robes with brass armbands, golden eyes over a veil, a small brass hourglass at the belt, and a long curved bow of brass and teal wood with a string of flowing gold sand",
  "the long curved brass bow", "bow", ("bowready", "the long curved brass bow"), bow_up("the long curved brass bow"),
  "Tên Cát", ["Mưa Tên Cát Chảy", "strike", .8, {"hits": 3, "move": "rain", "echo": "Sa Nhận Phân Kỳ"}], pierce_shot("Tên Ngưng Thời"),
  [("sandsplash", "burst", "a sand arrow's impact: fine gold-beige sand sprays and thin brass ring shards thrown straight outward"), ("sandarrow", "bolt", "a slim arrow of packed golden sand with a brass head and a thin curling sand tail")],
  sig={"fx": "sandsplash", "bolt": "sandarrow"}, shot="sandarrow", bowed=True, sway="the veil and robes")
E("hourglass", "sandgeneral", "Đại Tướng Hoàng Sa", "Golden Sand General",
  "a huge armoured general of gold and teal plate with a tall sun-disc helm, broad brass clock rings turning on the back, a cream sash, carrying an enormous two-handed sandstone hammer",
  "the enormous sandstone hammer", "smash", ("brace", "the enormous sandstone hammer held upright"), ground_slam("the enormous sandstone hammer"),
  "Nện Búa Cát", ["Đại Chùy Phá Thời", "strike", .95, {"move": "sweep", "echo": "Đảo Chiều Tinh Sa"}], guard("Giáp Hoàng Sa"),
  [("dunewave", "ground", "a heavy wave of gold-beige sand rolling along the ground with thin brass rings and teal glints in its crest")], sway="the sash and slowly turning brass rings")

E("coralreef", "anemonewitch", "Phù Thủy Hải Quỳ", "Anemone Witch",
  "a sly sea witch with a head of long orange and white sea-anemone tentacles instead of hair, teal skin, a dress of dark kelp and shells, holding a crooked driftwood staff tipped with a glowing sea urchin",
  "the crooked driftwood staff", "staff", ("raise", "the crooked driftwood staff"), staff_ground("the crooked driftwood staff"),
  "Gai Nhím Biển", ["Xúc Tu Hải Quỳ", "poison", .55, {"turns": 2, "dot": .13, "move": "snare", "echo": "Nghịch Lưu Rút Linh"}], heal("Nước Thánh Hải Quỳ"),
  [("anemonetrap", "ground", "orange and white anemone tentacles curling up in a ring from the ground, blue-green water splashing at their feet"), ("anemoneorb", "bolt", "a spiky sea urchin with a pearl-white glow and a tail of blue-green water")],
  shot="anemoneorb", sway="the anemone tentacles and kelp")
E("coralreef", "shellgeneral", "Hải Tướng Mai Rùa", "Shell General",
  "a massive turtle-warrior general with a great orange-coral shell on the back, a beaked green head under a pearl-crested helm, blue scale armour, and an enormous two-handed coral hammer",
  "the enormous coral hammer", "smash", ("brace", "the enormous coral hammer held upright"), wide_sweep("the enormous coral hammer"),
  "Nện San Hô", ["Búa San Hô Cuộn Sóng", "strike", .95, {"hits": 2, "move": "sweep", "echo": "Song Trảo Sóng Ngọc"}], guard("Giáp Mai Rùa", .07),
  [("shellwave", "ground", "a rolling wave of blue-green water thick with orange coral chunks and pearl-white foam along the ground")], sway="the small corals on its shell")

E("moonkeep", "crescentarcher", "Cung Thủ Trăng Non", "Crescent Archer",
  "a lean wolf-eared huntress-archer in black and silver scale armour with a short dark cape, a silver half-mask, and a tall curved silver bow shaped like a thin crescent moon",
  "the tall silver crescent bow", "bow", ("bowready", "the tall silver crescent bow"), bow_fan("the tall silver crescent bow"),
  "Tên Trăng", ["Tiễn Trăng Non Liên Hoàn", "strike", .85, {"hits": 3, "move": "volley", "echo": "Kiếm Ảnh Truy Hồn"}], ["Tên Huyết Nguyệt", "lifesteal", .75, {"leech": .2, "move": "shot"}],
  [("moonsplash", "burst", "a silver arrow's impact: thin cold silver crescents thrown straight outward with deep violet sparks"), ("crescentarrow", "bolt", "a slim silver arrow with a crescent head and a thin deep violet tail")],
  sig={"fx": "moonsplash", "bolt": "crescentarrow"}, shot="crescentarrow", bowed=True, sway="the wolf tail and short cape")
E("moonkeep", "bloodseer", "Pháp Sư Huyết Nguyệt", "Blood Moon Seer",
  "a tall gaunt wolf-headed seer in long black and crimson robes with silver moon-phase discs, a high collar, pale fur at the shoulders, holding a tall silver staff ending in a crimson moon orb",
  "the tall silver moon staff", "staff", ("raise", "the tall silver moon staff"), hand_out("the tall silver moon staff"),
  "Cầu Huyết", ["Xoáy Huyết Nguyệt", "drain", .65, {"drain": 15, "move": "spiral", "echo": "Trăng Máu Hút Sinh"}], heal("Nguyệt Quang Hồi Sinh"),
  [("bloodmote", "mote", "one small crimson moon sliver with a thin silver edge in a curl of deep violet"), ("bloodorb", "bolt", "a small crimson moon orb with a silver rim and a thin deep violet tail")],
  shot="bloodorb", sway="the long robes and moon discs")

# The third of the new ones in each chapter: it fights stages 35 and 40, between the third elite and the climax.
def fist_combo(w):
    return f"2 {w} drawn back to the right hip, torso coiled; 3 a fast left jab to the LEFT; 4 a full straight right punch to the LEFT at full reach, the whole body behind it; 5 a rising hook, the body rolling; the feet stay planted"

E("forest", "boarstalker", "Thợ Săn Nanh Lợn", "Boar Tusk Stalker",
  "a stocky wild hunter in a boar-hide cloak with the boar's tusked skull as a hood, a bare bark-brown chest with green war paint, leaf bracers, and a short curved stone hatchet in each hand",
  "the twin stone hatchets", "dual", ("brace", "the twin stone hatchets crossed"), blades_rapid("the twin stone hatchets"),
  "Song Rìu", ["Vết Nanh Rừng Sâu", "lifesteal", .8, {"leech": .2, "move": "flurry", "hits": 2, "echo": "Nanh Vuốt"}], ["Hú Gọi Bầy", "charge", .5, {"charge": 1.25, "move": "aura"}],
  [("tuskrake", "slash", "two ragged curved rakes of dark bark splinters and torn green leaves, cream tusk chips flying")], sway="the boar-hide cloak")
E("volcano", "pyremonk", "Võ Tăng Hỏa Diệm", "Pyre Monk",
  "a muscular bald monk with glowing orange tattoos, a charred saffron sash and baggy trousers, black iron prayer beads, and both fists wrapped in burning bandages",
  "the burning bandaged fists", "fists", ("guardfists", ""), fist_combo("the burning fists"),
  "Hỏa Quyền", ["Liên Quyền Hỏa Long", "burn", .65, {"turns": 2, "dot": .14, "hits": 3, "move": "flurry", "echo": "Long Nha Thiêu Đốt"}], heal("Thiền Lửa Hồi Khí"),
  [("flamefists", "slash", "three short fist-shaped bursts of bright flame streaking across the cell with charred flecks")], sway="the sash and burning bandages")
E("ice", "moonduelist", "Kiếm Khách Hàn Nguyệt", "Cold Moon Duelist",
  "a slim noble duelist in a pale blue and silver long coat with a white fur collar, a silver half-mask shaped like a crescent, long white hair tied back, and a thin rapier of clear ice",
  "the thin ice rapier", "rapier", ("brace", "the thin ice rapier held upright before the face in salute"), long_lunge("the thin ice rapier"),
  "Đâm Băng Kiếm", ["Nhất Thức Hàn Nguyệt", "pierce", .85, {"pierce": .35, "move": "thrust", "echo": "Băng Thương"}], guard("Áo Choàng Sương", .05),
  [("icestab", "streak", "a rapier thrust of clear pale blue ice, its wide left end a sharp crescent of white crystals")], sway="the coat tails and tied hair")
E("thunder", "bellpriest", "Giáo Sĩ Chuông Sấm", "Thunder Bell Priest",
  "a tall hooded priest in dark indigo robes with white-yellow lightning embroidery, a pale mask, and a heavy bronze bell swung on a long chain, sparks jumping from its rim",
  "the bronze bell on its chain", "censer", ("raise", "the bronze bell on its chain"), "2 the bell whirled in a wide circle overhead on its chain; 3 the chain at full stretch above the head, sparks at the rim; 4 the arm brought down, the bell flung out level to the LEFT at the end of the chain, ringing, the robes blown back; 5 the bell swinging back on its chain",
  "Tiếng Chuông Sét", ["Hồi Chuông Giáng Lôi", "strike", .8, {"hits": 3, "move": "strikes", "echo": "Ngũ Lôi"}], ["Chuông Hút Điện", "drain", .6, {"drain": 15, "move": "tether"}],
  [("bellbolt", "pillar", "a jagged forked bolt of white and lemon-yellow lightning striking straight down onto a ring-shaped burst of sound arcs"), ("bellspark", "bolt", "a small bronze bell shape of white-yellow lightning with a short jagged tail")],
  sig={"fx": "bellbolt", "shaft": {"band": [.12, .3], "cols": [.3, .7]}}, shot="bellspark", sway="the robes and chain")
E("marsh", "leechblade", "Sát Thủ Đỉa Đầm", "Leech Assassin",
  "a thin hunched assassin with glossy dark green skin, a leech-like round mouth mask, a tattered reed cloak, and two long wet bone sickles dripping lime-green toxin",
  "the two wet bone sickles", "dual", ("brace", "the two bone sickles crossed"), vanish_cut("the two bone sickles"),
  "Song Liềm Xương", ["Đỉa Độc Ám Tập", "lifesteal", .8, {"leech": .2, "move": "vanish", "echo": "Rễ Bào Tử"}], ["Nhát Cắt Thối Rữa", "poison", .55, {"turns": 2, "dot": .12, "hits": 2, "move": "flurry"}],
  [("leechcut", "slash", "two thin curved cuts of lime-green toxin with dark olive edges and small brown reed shreds")], sway="the tattered reed cloak")
E("desert", "jarmummy", "Xác Ướp Bình Tro", "Canopic Mummy",
  "a tall thin mummy in yellowed wrappings with a gold beard piece, a striped teal headcloth, one glowing amber eye, holding a large alabaster canopic jar with a jackal lid in both hands, sand leaking from it",
  "the large canopic jar", "orb", ("raise", "the large canopic jar"), orb_cast("the large canopic jar"),
  "Bụi Tro Bình", ["Bão Tro Khâm Liệm", "drain", .6, {"drain": 15, "move": "spiral", "echo": "Hàm Kìm Tam Kẹp"}], guard("Băng Quấn Hộ Thân", .05),
  [("ashbandage", "mote", "one short strip of yellowed burial wrapping curling round a small amber sand spark"), ("jarcurse", "bolt", "a tight ball of amber sand with a teal glint and a tail of wrapping strips")],
  shot="jarcurse", sway="the loose wrappings")
E("abyss", "sirenblade", "Nữ Kiếm Hải Yêu", "Siren Blade",
  "a poised sea siren duelist with long dark teal hair, fins at the ears, a fitted armour of red-orange coral and pale scales, and a long thin coral rapier",
  "the long coral rapier", "rapier", ("brace", "the long coral rapier held upright before the face in salute"), fence_rapid("the long coral rapier"),
  "Đâm San Hô", ["Vũ Điệu Hải Yêu", "strike", .85, {"hits": 4, "move": "flurry", "echo": "Thủy Long Tức"}], guard("Màn Nước Hải Yêu", .05),
  [("sirenstab", "slash", "several thin straight stabs of teal sea water crossing the cell with white foam tips and coral chips")], sway="the long hair and fins")
E("foundry", "sawbutcher", "Đao Phủ Lưỡi Cưa", "Saw Butcher",
  "a huge masked factory brute in a stained leather apron and riveted brass pauldrons, a welding mask, pipes on the back, swinging a two-handed cleaver with a spinning brass saw blade along its edge",
  "the two-handed saw cleaver", "great", ("brace", "the saw cleaver held upright"), two_cuts("the saw cleaver"),
  "Bổ Lưỡi Cưa", ["Cưa Máy Liên Hoàn", "pierce", .9, {"pierce": .35, "hits": 2, "move": "lunge", "echo": "Búa Tạ Cơ Khí"}], guard("Tạp Dề Thép"),
  [("sawcut", "slash", "two heavy toothed saw cuts of polished brass and copper, orange sparks thrown off them")], sway="the leather apron and pipes")
E("crystal", "shardmonk", "Võ Tăng Thạch Anh", "Quartz Monk",
  "a broad calm monk whose skin is faceted pale blue crystal, bald with a gem set in the forehead, dark blue trousers and sash, heavy crystal gauntlets on both fists",
  "the heavy crystal gauntlets", "fists", ("guardfists", ""), fist_combo("the crystal gauntlets"),
  "Đấm Tinh Thể", ["Quyền Phá Lăng Kính", "pierce", .85, {"pierce": .35, "move": "lunge", "echo": "Song Liềm Liên Trảm"}], heal("Tĩnh Tâm Tinh Thể", .04),
  [("gemfist", "slash", "one big fist-shaped punch mark of faceted blue and cyan gem shards with white highlights")], sway="the sash")
E("haunted", "scarecrow", "Bù Nhìn Nguyền Rủa", "Cursed Scarecrow",
  "a tall ragged scarecrow with a stitched sack head, glowing blue-green eyes and a torn pointed hat, straw poking from a rotten patched coat, and a long rusted three-tined pitchfork",
  "the long rusted pitchfork", "thrust", ("brace", "the long rusted pitchfork"), long_lunge("the long rusted pitchfork"),
  "Đâm Chĩa", ["Chĩa Hồn Đóng Đinh", "pierce", .85, {"pierce": .3, "move": "thrust", "echo": "Liềm Hồn"}], ["Rơm Hút Hồn", "drain", .6, {"drain": 15, "move": "tether"}],
  [("forkstreak", "streak", "a pitchfork thrust of cold blue-green ghost fire, its wide left end three bone-grey tines of flame")], sway="the torn coat and straw")
E("sky", "fanblade", "Vũ Nữ Quạt Phong", "Wind Fan Dancer",
  "a graceful dancer-warrior in layered white and sky-blue silks with long floating sleeves, a feather headdress, and two large steel war fans with white feather edges",
  "the two large war fans", "dual", ("brace", "the two war fans crossed"), blades_rapid("the two war fans"),
  "Song Quạt", ["Quạt Phong Xé Gió", "strike", .85, {"hits": 3, "move": "flurry", "echo": "Phong Vũ"}], heal("Gió Lành Thổi Tới"),
  [("fancut", "slash", "two sweeping fan-shaped cuts of sky-blue wind streaks edged with white feathers")], sway="the long silk sleeves")
E("thorns", "shearkeeper", "Lão Làm Vườn Nguyền", "Cursed Gardener",
  "a big stooped gardener in a dark green apron and wide straw hat wrapped in thorns, a pale sunken face, rose vines growing out of the sleeves, working a pair of giant black iron garden shears held in both hands",
  "the giant iron shears", "great", ("brace", "the giant iron shears held upright"), wide_sweep("the giant iron shears"),
  "Cắt Kéo Sắt", ["Kéo Tỉa Máu", "lifesteal", .8, {"leech": .2, "hits": 2, "move": "lunge", "echo": "Hoa Ăn Linh"}], guard("Tạp Dề Gai"),
  [("shearcut", "slash", "two closing scissor cuts of dark iron and deep crimson petals, torn thorned vines flying")], sway="the apron and rose vines")
E("celestial", "judgeknight", "Thẩm Phán Thánh Đường", "Temple Judge",
  "a stern broad judge knight in cream robes over gold plate, a tall white and gold mitre helm with a veiled face, a scales emblem on the chest, and a huge golden gavel hammer held in both hands",
  "the huge golden gavel", "smash", ("brace", "the huge golden gavel held upright"), ground_slam("the huge golden gavel"),
  "Nện Búa Xử", ["Phán Quyết Giáng Đòn", "execute", .85, {"threshold": .35, "bonus": 1.4, "move": "sweep", "echo": "Nhật Kiếm"}], guard("Luật Thánh Hộ Thân"),
  [("verdictwave", "ground", "a ring of warm white light cracks running along the ground from a soft yellow scales-shaped sigil, cream light-feathers thrown up")], sway="the robes and veil")
E("void", "gravitymonk", "Tu Sĩ Trọng Lực", "Gravity Monk",
  "a heavy-set masked monk in black-indigo robes scattered with tiny white stars, thin deep-blue rings around the forearms, dark star-metal gauntlets on both fists",
  "the dark star-metal gauntlets", "fists", ("guardfists", ""), fist_combo("the star-metal gauntlets"),
  "Quyền Tinh Thiết", ["Trọng Quyền Hố Sao", "strike", .9, {"move": "lunge", "echo": "Hư Không Phán Quyết"}], heal("Tĩnh Tọa Tinh Không", .04),
  [("gravitycrush", "slash", "one big punch mark caving into black-indigo void, tiny white stars pulled toward it, thin deep-blue rims")], sway="the robes and forearm rings")
E("eldergrove", "honeykeeper", "Người Giữ Mật Hoa", "Honey Keeper",
  "a plump kindly-looking but sinister beekeeper in a cream veiled hat and birch-bark vest, pale green sleeves, swinging a big wooden honey smoker pot on a chain, thick golden nectar dripping from it",
  "the wooden honey pot on its chain", "censer", ("raise", "the wooden honey pot on its chain"), "2 the pot swung back on its chain, the free hand opening; 3 the chain at full stretch overhead; 4 the arm thrown forward to the LEFT, the pot flung out at the end of the chain, nectar at its rim; 5 the pot swinging back",
  "Giọt Mật", ["Mật Dính Ký Sinh", "poison", .55, {"turns": 2, "dot": .12, "move": "snare", "echo": "Nở Hoa Ký Sinh"}], heal("Mật Hoa Hồi Sinh"),
  [("nectartrap", "ground", "a spreading pool of thick pale gold nectar rising in sticky strands from the ground, peach-white petals stuck in it"), ("nectardrop", "bolt", "a heavy drop of pale gold nectar with a tail of small peach-white petals")],
  shot="nectardrop", sway="the veil and vest")
E("caldera", "lavadancer", "Vũ Công Dung Nham", "Lava Dancer",
  "a lean agile dancer in black basalt-scale armour with glowing orange seams, long ribbons of molten orange trailing from the arms, a horned mask, and a curved flame-edged black blade in each hand",
  "the two curved flame-edged blades", "dual", ("brace", "the two curved blades crossed"), blades_rapid("the two curved blades"),
  "Song Đao Lửa", ["Vũ Điệu Dung Nham", "burn", .6, {"turns": 2, "dot": .13, "hits": 3, "move": "flurry", "echo": "Song Quyền Nham Chấn"}], guard("Vòng Xỉ Hộ Thân", .05),
  [("lavaribbon", "slash", "two curling ribbon cuts of glowing orange lava with black basalt chips and yellow-hot sparks")], sway="the molten ribbons")
E("glacier", "mirrorpriestess", "Nữ Tư Tế Gương Băng", "Ice Mirror Priestess",
  "a tall serene priestess in thick layered blue-white robes with a high collar of ice blocks, a blindfold of white silk, holding a large round mirror of polished glacier ice in both hands",
  "the large round ice mirror", "orb", ("raise", "the large round ice mirror"), orb_cast("the large round ice mirror"),
  "Tia Gương Băng", ["Gương Băng Phản Quang", "pierce", .85, {"pierce": .3, "move": "beam", "echo": "Băng Thương Tam Liên"}], heal("Hơi Lạnh Hồi Nguyên"),
  [("mirrorray", "beam", "a straight ray of blue-white light with thick ice facets along its edges and a white core"), ("mirrorshard", "bolt", "one thick wedge-shaped shard of polished ice with a steel-blue edge and a short snow tail")],
  shot="mirrorshard", sway="the layered robes")
E("stormspire", "goldarcher", "Cung Thủ Bão Vàng", "Golden Storm Archer",
  "a tall proud archer in navy feather armour with gold trim, an eagle-crested helm, a short navy cape, and a large golden recurve bow with a bowstring of yellow lightning",
  "the large golden recurve bow", "bow", ("bowready", "the large golden recurve bow"), bow_up("the large golden recurve bow"),
  "Tên Lôi", ["Mưa Tên Bão Vàng", "strike", .8, {"hits": 3, "move": "rain", "echo": "Thiên Phạt Cửu Lôi"}], pierce_shot("Tên Xuyên Tầng Mây"),
  [("goldspark", "burst", "a lightning arrow's impact: forked golden yellow arcs thrown straight outward from a white point"), ("goldarrow", "bolt", "a slim golden arrow wrapped in yellow lightning with a white head")],
  sig={"fx": "goldspark", "bolt": "goldarrow"}, shot="goldarrow", bowed=True, sway="the short cape and crest")
E("soulcrypt", "cellbolter", "Nỏ Thủ Địa Lao", "Dungeon Bolter",
  "a hooded dungeon guard in dark iron scale and bronze buckles, a bucket-like iron helm with a violet glow in its slit, ring of keys at the belt, carrying a heavy black iron crossbow loaded with a violet soul bolt",
  "the heavy black iron crossbow", "crossbow", ("bowready", "the heavy black iron crossbow"), xbow_level("the heavy black iron crossbow"),
  "Bắn Nỏ Hồn", ["Nỏ Hồn Xuyên Ngục", "drain", .65, {"drain": 15, "move": "volley", "echo": "Liềm Cắt Hồn"}], guard("Khiên Song Sắt"),
  [("cellburst", "burst", "a soul bolt's impact: deep-violet soul fire and dark iron splinters thrown straight outward"), ("cellbolt", "bolt", "a short dark iron crossbow bolt wrapped in small deep-violet soul flames")],
  sig={"fx": "cellburst", "bolt": "cellbolt"}, shot="cellbolt", bowed=True, sway="the hood and key ring")
E("mycelium", "sporehag", "Bà Đồng Bào Tử", "Spore Hag",
  "a bent old hag in layered rotten shawls of rust and cream, pale threads in her long grey hair, small mushrooms on her shoulders, swinging a cracked iron lamp full of sick yellow-green spores on a chain",
  "the cracked iron spore lamp on its chain", "censer", ("raise", "the cracked iron spore lamp on its chain"), "2 the lamp swung in a slow circle overhead on its chain; 3 the chain at full stretch above the head, the lamp glowing; 4 the lamp brought down onto the ground in front to the LEFT, the free hand raised, knees bent; 5 crouched over it, one hand fanning",
  "Đèn Bào Tử", ["Hố Sợi Nấm", "poison", .55, {"turns": 3, "dot": .1, "move": "snare", "echo": "Hấp Thu Hoại Chất"}], heal("Nấm Thuốc Bà Đồng"),
  [("threadpit", "ground", "pale fungal threads and small rust-red caps bursting up in a ring from the ground, sick yellow-green puffs among them"), ("sporelamp", "bolt", "a small rust-red spore pod glowing sick yellow-green with a tail of pale threads")],
  shot="sporelamp", sway="the shawls and grey hair")
E("geode", "quartzduelist", "Kiếm Khách Thạch Anh", "Quartz Duelist",
  "a tall slim duelist in tan stone-plate armour with moss at the shoulders, a tricorn hat of grey slate set with a blue crystal, a short mossy cape, and a thin rapier of long blue crystal",
  "the thin blue crystal rapier", "rapier", ("brace", "the thin blue crystal rapier held upright before the face in salute"), fence_rapid("the thin blue crystal rapier"),
  "Đâm Thạch Anh", ["Liên Đâm Thạch Anh", "strike", .85, {"hits": 3, "move": "flurry", "echo": "Chấn Địa Tinh Nham"}], guard("Vỏ Sa Thạch", .05),
  [("quartzstab", "slash", "several thin straight stabs of bright blue crystal crossing the cell with grey-tan stone chips")], sway="the short mossy cape")
E("hourglass", "stormassassin", "Sát Thủ Bão Cát", "Sandstorm Assassin",
  "a lean masked assassin wrapped in cream and gold-beige cloth with only teal eyes showing, brass bands on the arms, a long tattered sash, and two curved brass daggers shaped like hourglass halves",
  "the two curved brass daggers", "dual", ("brace", "the two curved brass daggers crossed"), vanish_cut("the two curved brass daggers"),
  "Song Dao Cát", ["Ám Sát Cát Chảy", "execute", .85, {"threshold": .35, "bonus": 1.4, "move": "vanish", "echo": "Sa Nhận Phân Kỳ"}], ["Lốc Dao Cát", "strike", .8, {"hits": 3, "move": "flurry"}],
  [("dunecut", "slash", "two thin crossing cuts of fine gold-beige sand with thin brass ring chips and teal glints")], sway="the long tattered sash")
E("coralreef", "sharkhunter", "Thợ Săn Cá Mập", "Shark Hunter",
  "a muscular shark-headed hunter with blue-grey skin, pale belly, a pearl and coral necklace, a dorsal fin on the back, a kilt of woven kelp and two wide blades made from shark jaws",
  "the two shark-jaw blades", "dual", ("brace", "the two shark-jaw blades crossed"), blades_rapid("the two shark-jaw blades"),
  "Song Hàm Đao", ["Xé Nát Sóng Ngầm", "lifesteal", .8, {"leech": .2, "hits": 2, "move": "flurry", "echo": "Song Trảo Sóng Ngọc"}], guard("Da Cá Mập", .05),
  [("jawcut", "slash", "two ragged toothed cuts of blue-green water with white tooth chips and pearl foam")], sway="the kelp kilt and necklace")
E("moonkeep", "wolfslayer", "Thợ Săn Ma Sói", "Wolf Slayer",
  "a big grizzled wolf hunter in a black leather long coat and wide hat, wolf pelts on the shoulders, silver studs, a scarred face with one silver eye, and a huge two-handed silver axe",
  "the huge silver axe", "great", ("brace", "the huge silver axe held upright"), two_cuts("the huge silver axe"),
  "Bổ Rìu Bạc", ["Rìu Bạc Trừ Tà", "pierce", .9, {"pierce": .35, "move": "lunge", "echo": "Nguyệt Kiếm Tam Trảm"}], guard("Da Sói Bạc"),
  [("silvercleave", "slash", "two heavy cuts of cold silver light with deep violet shadows and small silver sparks")], sway="the long coat and pelts")

# What each kind of weapon does while it waits and its two fidgets: (name, label, frames 2-7).
RESTS = {
    "bow": ("stands alert with {w} held low, weight shifting slowly from foot to foot, chest breathing, the head turning slightly, {sway} stirring", [
        ("pluck", "Thử dây cung", "the free hand plucks the bowstring twice, the string quivering, then returns"),
        ("quiver", "Sờ ống tên", "the free hand reaches over the shoulder, touches the arrows in the quiver and comes back")]),
    "crossbow": ("stands braced with {w} held across the body, weight shifting slowly, chest breathing, the head turning slightly, {sway} stirring", [
        ("crank", "Lên dây nỏ", "one hand turns the crossbow's lever round twice while the other holds it steady"),
        ("sight", "Ngắm thử", "lifts the crossbow a little and sights along it, then lowers it back")]),
    "staff": ("stands leaning a little on {w}, slow deep breathing, the free hand opening and closing, {sway} stirring, the head of the weapon pulsing softly", [
        ("tapstaff", "Gõ vũ khí xuống đất", "lifts the weapon a little and taps its foot on the ground twice, the head of it pulsing each time"),
        ("flare", "Vuốt ánh sáng", "the free hand passes slowly over the head of the weapon, which flares bright and then cools")]),
    "orb": ("holds {w} before the chest, swaying very slightly, slow deep breathing, {sway} stirring, {w} pulsing softly", [
        ("lift", "Nâng lên ngắm", "raises the held object to eye height, studies it, and lowers it back"),
        ("flare", "Tỏa sáng", "the held object flares bright then cools, the fingers shifting on it")]),
    "censer": ("swings {w} gently, slow deep breathing, weight shifting from foot to foot, {sway} stirring", [
        ("swing", "Lắc xích", "the arm swings the chain in one slow full circle by the side and lets it settle"),
        ("flare", "Lửa bùng lên", "the glow of the held thing flares bright and cools, the free hand raised against the heat")]),
    "great": ("stands heavy and ready with {w} held in both hands, the shoulders rising and falling with slow strong breaths, weight shifting, {sway} stirring", [
        ("shoulder", "Vác vũ khí lên vai", "heaves the weapon up to rest on the shoulder, holds, and lowers it back"),
        ("ground", "Gõ vũ khí xuống đất", "lowers the weapon and taps its end on the ground twice, then raises it back")]),
    "smash": ("stands heavy and ready with {w} held low, the shoulders rising and falling with slow strong breaths, weight shifting, {sway} stirring", [
        ("shoulder", "Vác vũ khí lên vai", "heaves the weapon up to rest on the shoulder, holds, and lowers it back"),
        ("ground", "Gõ vũ khí xuống đất", "lowers the weapon and taps its end on the ground twice, then raises it back")]),
    "thrust": ("stands ready with {w} held upright, slow breathing, weight shifting, the fingers tightening on the shaft, {sway} stirring", [
        ("tapshaft", "Gõ cán xuống đất", "lifts the shaft a little and taps its butt on the ground twice"),
        ("level", "Hạ mũi", "lowers the point toward the LEFT as if testing the reach, holds, and raises it back")]),
    "dual": ("stands low and ready with {w} held at the sides, slow breathing, weight shifting from foot to foot, {sway} stirring", [
        ("tapblades", "Gõ lưỡi vào nhau", "brings the two blades together and taps them twice, then lowers them"),
        ("twirl", "Xoay lưỡi", "one hand twirls its blade in a full turn and catches it")]),
    "fists": ("stands ready with {w} raised, the shoulders rising and falling with slow strong breaths, weight shifting lightly, {sway} stirring", [
        ("cracks", "Bẻ khớp tay", "presses one fist into the other palm and cracks the knuckles twice, then lowers the hands"),
        ("punchair", "Đấm gió", "throws one slow practice punch to the LEFT and draws it back")]),
    "rapier": ("stands poised in a fencer's rest with {w} point down, slow breathing, weight shifting lightly, {sway} stirring", [
        ("salute", "Chào kiếm", "raises the blade upright before the face, holds, and flicks it down"),
        ("flick", "Vẩy kiếm", "flicks the blade side to side twice with the wrist")]),
}


def ids():
    return list(ROSTER)


def what(e):
    return f"a chibi fantasy RPG elite enemy: {ROSTER[e]['brief']}"


def master_prompt(e, style_name, boss_name):
    r = ROSTER[e]
    return f"""Image 1 is a style reference: an existing elite enemy of the same chapter of this game. Match its art style, rendering, outline weight, detail level, proportions, camera, size in the canvas and facing direction, but do NOT copy its design. Image 2 is this chapter's boss. Use Image 2 only for theme, palette and material language; do NOT draw the boss itself.
Draw ONE new elite enemy: {r['name']} ({r['en']}): {r['brief']}.
A HUMANOID elite enemy: bigger, broader and more imposing than an ordinary monster, with the same chibi fantasy RPG proportions as Image 1 (large head, sturdy compact body). Readable at small size: a bold silhouette, few big shapes, clear light and shadow, clearly different from Image 1. Full body from top of the head to the feet, standing ready pose, facing LEFT in 3/4 view exactly like Image 1 (looking and pointing toward the left side of the image). The entire character, including the weapon and anything held, fits inside the image with generous magenta margin on all four sides; nothing is cropped. Clean HD smooth hand-painted game art like Image 1: crisp silhouette, clean dark outlines, soft painted shading, rich detail. NOT pixel art. Never use magenta, hot pink or pink anywhere on the character. Background 100% solid flat #FF00FF magenta, no gradient. No ground, no shadow, no aura, no text, no labels, no border. One single character only, square 1:1 image."""


def run(cmd, log=print, cwd=ROOT):
    r = subprocess.run(list(map(str, cmd)), cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", creationflags=NO_WINDOW)
    if r.returncode:
        log(r.stdout[-1200:], r.stderr[-1200:])
        raise RuntimeError(f"rc={r.returncode}: {cmd[1] if len(cmd) > 1 else cmd}")
    return r.stdout


def draw_master(e, model, effort, log=print):
    sys.path.insert(0, str(HERE))
    from action_idle import master_of
    from PIL import Image
    d, work = HERE / e, SCRATCH / e / "master"
    d.mkdir(exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    theme = ROSTER[e]["theme"]
    book = json.loads((HERE / "elites.json").read_text(encoding="utf-8"))["elites"]
    first = next(k for k, v in book.items() if v.get("theme") == theme and k not in ROSTER)
    boss = book[first]["boss"]
    refs = []
    for name, path in (("style", master_of(first)), ("boss", master_of(boss))):
        m = Image.open(path).convert("RGBA")
        bg = Image.new("RGBA", m.size, (255, 0, 255, 255))
        bg.alpha_composite(m)
        out = work / f"{name}.png"
        bg.convert("RGB").save(out)
        refs += ["--ref", out]
    (d / "prompt-master.txt").write_text(master_prompt(e, first, boss) + "\n", encoding="utf-8")
    run([sys.executable, GEN, "--prompt-file", d / "prompt-master.txt", "--out", d / "raw-master.png", *refs, "--model", model, "--effort", effort, "--timeout", 900], log)
    process_master(e, log)


def process_master(e, log=print):
    d, work = HERE / e, SCRATCH / e / "master"
    shutil.rmtree(work / "proc", ignore_errors=True)
    run([sys.executable, PROC, "process", "--input", d / "raw-master.png", "--target", "creature", "--mode", "idle", "--output-dir", work / "proc", "--rows", 1, "--cols", 1,
         "--cell-size", 512, "--fit-scale", .78, "--align", "feet", "--scale-strategy", "fit", "--component-mode", "largest"], log)
    shutil.copy2(work / "proc/idle-1.png", d / "master.png")


def rest(e):
    r = ROSTER[e]
    action, fidgets = RESTS[r["blow"]]
    return action.format(w=r["w"], sway=r["sway"]), fidgets


IDLE = """Image 1 is the exact character and art reference ({what}). Image 2 repeats that exact character in eight cells and is the template every frame must match.
Create an 8-frame IDLE loop, 2 columns x 4 rows, 1024x2048, read row-major. It stands in place, calm and menacing, facing LEFT exactly like Image 1. The head, face, body, arms, hands, weapon and feet stay EXACTLY as in Image 2 in every frame (same position, same shape). What animates: {sway} sway and flutter gently, any glow pulses softly, a slow breathing rhythm. Smooth from frame to frame; frame 8 flows back into frame 1.
Same scale, camera and feet line (94% of cell height) in every cell, body centred. No aura, no ground, no shadow. Background 100% solid flat #FF00FF magenta, no gradient, no text, no labels, no borders, no grid lines. Clean HD smooth painted game art, NOT pixel art."""


def draw_idle(e, model, effort, log=print):
    """RECIPE.txt: a calm stabilized loop on the master; the two fidgets carry the action."""
    from PIL import Image
    d, work = HERE / e, ROOT / ".build-cache/action-idle" / e
    work.mkdir(parents=True, exist_ok=True)
    m = Image.open(d / "master.png").convert("RGBA")
    bg = Image.new("RGBA", m.size, (255, 0, 255, 255))
    bg.alpha_composite(m)
    bg.convert("RGB").save(work / "identity.png")
    run([sys.executable, ANCHOR, "--input", work / "identity.png", "--rows", 4, "--cols", 2, "--cell-width", 512, "--cell-height", 512,
         "--subject-height-ratio", .8, "--feet-ratio", .94, "--output", work / "anchor.png"], log)
    (d / "prompt-idle.txt").write_text(IDLE.format(what=what(e), sway=ROSTER[e]["sway"]) + chr(10), encoding="utf-8")
    run([sys.executable, GEN, "--prompt-file", d / "prompt-idle.txt", "--out", d / "raw-idle.png", "--ref", work / "identity.png", "--ref", work / "anchor.png",
         "--model", model, "--effort", effort, "--timeout", 900], log)
    process_idle(e, log)


def process_idle(e, log=print):
    d, work = HERE / e, ROOT / ".build-cache/action-idle" / e
    for sub in ("proc", "aligned", "stable"):
        shutil.rmtree(work / sub, ignore_errors=True)
    run([sys.executable, PROC, "process", "--input", d / "raw-idle.png", "--target", "creature", "--mode", "idle", "--output-dir", work / "proc", "--rows", 4, "--cols", 2,
         "--cell-size", 256, "--fit-scale", .86, "--align", "feet", "--scale-strategy", "preserve", "--component-mode", "all" if ROSTER[e]["blow"] == "censer" else "largest"], log)
    run([sys.executable, HERE / "precenter.py", d / "master.png", work / "proc", work / "aligned"], log)
    run([sys.executable, HERE / "stabilize_idle.py", d / "master.png", work / "stable", *[work / f"aligned/idle-{i}.png" for i in range(1, 9)]], log)
    shutil.copy2(work / "stable/idle.webp", d / "idle.webp")
    shutil.copy2(work / "stable/stabilize-meta.json", d / "stabilize-meta.json")
    keep_inside(e)


def keep_inside(e):
    """A cape that sways past one side of the cell: the whole loop moves the other way while there is room there."""
    from PIL import Image
    path, cell = HERE / e / "idle.webp", 256
    sheet = Image.open(path).convert("RGBA")
    frames = [sheet.crop((i % 2 * cell, i // 2 * cell, (i % 2 + 1) * cell, (i // 2 + 1) * cell)) for i in range(8)]
    boxes = [f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox() for f in frames]
    left, right = min(b[0] for b in boxes), max(b[2] for b in boxes)
    dx = 0
    if right >= cell - 1 and left > 3:
        dx = -min(left - 3, right - cell + 8)
    elif left <= 1 and right < cell - 4:
        dx = min(cell - 3 - right, 8)
    if dx:
        out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
        for i, f in enumerate(frames):
            out.paste(f, (i % 2 * cell + dx, i // 2 * cell))
        out.save(path, lossless=True, method=6)
    return dx


RESTING_PART = {"desert-sphinxguard": 205}  # x in the cell from which the idle's rest pose is kept: the sphinx's tail


def place_fidget(e, name, log=print):
    """fidget.py's registration loses wide figures, so a fidget is placed like a body sheet: Codex draws on the template, the
    rest pose it drew (frame 8) gives one scale and place against the idle's first frame, each frame's legs lock it, frames 1
    and 8 are the idle's own first frame so it leaves and rejoins the loop seamlessly, and every frame in between is whole."""
    import numpy as np
    from PIL import Image
    sys.path.insert(0, str(Path(PROC).parent))
    from generate2dsprite import remove_bg_magenta
    from scipy import ndimage
    work, cell = ROOT / ".build-cache/fidgets" / e / name, 256
    raw = np.asarray(remove_bg_magenta(Image.open(work / "raw.png").convert("RGBA").resize((1024, 2048), Image.Resampling.LANCZOS), 100, 150))
    idle = Image.open(HERE / e / "idle.webp").convert("RGBA").crop((0, 0, cell, cell))
    box = lambda im: im.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()
    # The generator's tall sheets do not fill their grid evenly, so the eight figures are found, not cut on a grid.
    solid = raw[..., 3] > 0
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    centres = ndimage.center_of_mass(solid, labels, range(1, count + 1))
    big = sorted(np.argsort(sizes)[-8:], key=lambda k: centres[k][0])
    seeds = [c for r in range(4) for c in sorted(big[r * 2:r * 2 + 2], key=lambda k: centres[k][1])]
    assert sizes[seeds].min() > sizes.max() * .15, f"{e} {name}: not eight figures"
    canvas = 768
    cells = [np.zeros((canvas, canvas, 4), np.uint8) for _ in range(8)]
    feet = [int(np.where(labels == k + 1)[0].max()) for k in seeds]
    for k in range(count):
        if sizes[k] < 30:
            continue
        i = min(range(8), key=lambda j: (centres[k][0] - centres[seeds[j]][0]) ** 2 + (centres[k][1] - centres[seeds[j]][1]) ** 2)
        ys, xs = np.where(labels == k + 1)
        ty, tx = ys - feet[i] + canvas - 120, xs - (i % 2) * 512 + (canvas - 512) // 2
        keep = (ty >= 0) & (ty < canvas) & (tx >= 0) & (tx < canvas)
        cells[i][ty[keep], tx[keep]] = raw[ys[keep], xs[keep]]
    cells = [Image.fromarray(c, "RGBA") for c in cells]
    rest, want = box(cells[7]), box(idle)
    k = (want[3] - want[1]) / (rest[3] - rest[1])
    size = round(canvas * k)
    ox, oy = want[0] - round(rest[0] * k), want[3] - round(rest[3] * k)
    placed, over = [], 0
    for c in cells:
        g = c.resize((size, size), Image.Resampling.LANCZOS)
        f = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        f.paste(g, (ox, oy))
        placed.append(f)
        cut = g.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()
        over = max(over, -(cut[0] + ox), cut[2] + ox - cell, -(cut[1] + oy), cut[3] + oy - cell)
    top = want[3] - round((want[3] - want[1]) * .16)
    legs = np.asarray(idle.getchannel("A"))[top:want[3]] >= 128
    sheet = Image.new("RGBA", (cell * 2, cell * 4), (0, 0, 0, 0))
    for i, f in enumerate(placed):
        if i in (0, 7):
            f = idle
        else:
            a = np.asarray(f.getchannel("A")) >= 128
            best = max(((int((np.roll(np.roll(a, dx, 1), dy, 0)[top:want[3]] & legs).sum()), -abs(dx) - abs(dy), dx, dy) for dx in range(-14, 15, 2) for dy in range(-14, 15, 2)))
            moved = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            moved.paste(f, (best[2], best[3]))
            f = moved
        if e in RESTING_PART:
            # A thin part the template lost (Codex cannot see it to draw it) stays as it rests.
            part = idle.crop((RESTING_PART[e], 0, cell, cell))
            under = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            under.paste(part, (RESTING_PART[e], 0))
            under.alpha_composite(f)
            f = under
        sheet.alpha_composite(f, (i % 2 * cell, i // 2 * cell))
    sheet.save(work / "fidget.webp", lossless=True, method=6)
    return over


def draw_fidget(e, name, label, action, model, effort, log=print):
    run([sys.executable, HERE / "fidget.py", "gen", e, name, model, effort, what(e), action], log)
    place_fidget(e, name, log)
    run([sys.executable, HERE / "fidget.py", "accept", e, name, label, "--whole"], log)


def steps(e, stages, model, effort, log):
    import anim
    d = HERE / e
    if "master" in stages and not (d / "master.png").exists():
        yield "master", lambda: draw_master(e, model, effort, log)
    if "idle" in stages and not (d / "idle.webp").exists():
        yield "idle", lambda: draw_idle(e, model, effort, log)
    if "fidgets" in stages:
        for name, label, action in rest(e)[1]:
            if not (d / f"{name}.webp").exists():
                yield name, lambda name=name, label=label, action=action: draw_fidget(e, name, label, action, model, effort, log)
    if "body" in stages:
        for a in anim.ACTIONS:
            if not (d / f"{a}.webp").exists():
                yield a, lambda a=a: (anim.gen(e, a, model, effort, log), anim.accept(e, a))
    if "fx" in stages:
        sys.path.insert(0, str(ROOT / "assets/fx/elites"))
        import skill_prompts
        for fx, _, _ in ROSTER[e]["fx"]:
            if not (ROOT / "assets/fx/elites" / e / fx / "raw-sheet.png").exists():
                yield fx, lambda fx=fx: skill_prompts.gen(e, fx, model, effort, log)


def batch(workers, only, stages, model, effort):
    jobs = list(only or ids())
    lock, logpath, fails = threading.Lock(), SCRATCH / "roster2.log", []
    logpath.parent.mkdir(parents=True, exist_ok=True)

    def log(*a):
        with lock, logpath.open("a", encoding="utf-8") as f:
            f.write(time.strftime("%H:%M:%S ") + " ".join(map(str, a)) + "\n")

    def worker():
        while True:
            with lock:
                if not jobs:
                    return
                e = jobs.pop(0)
            for name, job in steps(e, stages, model, effort, log):
                for attempt in range(3):
                    try:
                        job()
                        log("ok", e, name)
                        break
                    except Exception as err:
                        log("fail", e, name, attempt, repr(err)[:240])
                        time.sleep(20)
                else:
                    fails.append((e, name))
    threads = [threading.Thread(target=worker) for _ in range(workers)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    log("finished; failed:", fails)
    print("failed:", fails)


def review(e, out=None):
    """Master, idle, fidgets, the five body sheets and the effects of one elite on a grey ground."""
    from PIL import Image, ImageDraw, ImageFont
    import anim
    cell, font = 150, ImageFont.truetype("arial.ttf", 13)
    d, fxdir = HERE / e, ROOT / "assets/fx/elites" / e
    rows = []

    def strip(path, cols, rw, n, inset=0):
        s = Image.open(path).convert("RGBA")
        fw, fh = s.width // cols, s.height // rw
        m = int(fw * inset)
        return [s.crop((i % cols * fw + m, i // cols * fh + m, (i % cols + 1) * fw - m, (i // cols + 1) * fh)).resize((cell, cell)) for i in range(n)]
    rows.append(("master+idle", ([Image.open(d / "master.png").convert("RGBA").resize((cell, cell))] if (d / "master.png").exists() else []) + (strip(d / "idle.webp", 2, 4, 8)[::2] if (d / "idle.webp").exists() else [])))
    for name, _, _ in rest(e)[1]:
        if (d / f"{name}.webp").exists():
            rows.append((name, strip(d / f"{name}.webp", 2, 4, 8)[::2] + []))
    for a in anim.ACTIONS:
        if (d / f"{a}.webp").exists():
            rows.append((a, strip(d / f"{a}.webp", 3, 2, 6, .12)))
    for fx, _, _ in ROSTER[e]["fx"]:
        if (fxdir / f"{fx}.webp").exists():
            rows.append((fx, strip(fxdir / f"{fx}.webp", 6, 1, 6)))
    canvas = Image.new("RGB", (6 * cell, len(rows) * (cell + 16)), (120, 124, 132))
    draw = ImageDraw.Draw(canvas)
    for y, (label, cells) in enumerate(rows):
        draw.text((4, y * (cell + 16)), f"{e} {label}", fill=(255, 255, 210), font=font)
        for x, c in enumerate(cells[:6]):
            canvas.paste(c, (x * cell, y * (cell + 16) + 16), c)
    target = out or SCRATCH / f"review-{e}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target)
    return target


def chapter_sheet(theme, size=88):
    """A chapter's new elites side by side: master and every body action, six frames, for a quick read of each."""
    from PIL import Image, ImageDraw, ImageFont
    import anim
    es = [e for e, r in ROSTER.items() if r["theme"] == theme]
    font = ImageFont.truetype("arial.ttf", 12)
    canvas = Image.new("RGB", (len(es) * (6 * size + 8), 6 * (size + 14)), (120, 124, 132))
    draw = ImageDraw.Draw(canvas)
    for k, e in enumerate(es):
        x0 = k * (6 * size + 8)
        d = HERE / e
        for r, a in enumerate(["master"] + anim.ACTIONS):
            y0 = r * (size + 14)
            draw.text((x0 + 3, y0), f"{e} {a}", fill=(255, 255, 210), font=font)
            if a == "master":
                row = [Image.open(d / "master.png").convert("RGBA").resize((size, size))] if (d / "master.png").exists() else []
                if (d / "idle.webp").exists():
                    s = Image.open(d / "idle.webp").convert("RGBA")
                    fw, fh = s.width // 2, s.height // 4
                    row.append(s.crop((0, 0, fw, fh)).resize((size, size)))
                for n, _, _ in rest(e)[1]:
                    if (d / f"{n}.webp").exists():
                        s = Image.open(d / f"{n}.webp").convert("RGBA")
                        fw, fh = s.width // 2, s.height // 4
                        row += [s.crop((i % 2 * fw, i // 2 * fh, (i % 2 + 1) * fw, (i // 2 + 1) * fh)).resize((size, size)) for i in (3, 4)]
            elif (d / f"{a}.webp").exists():
                s = Image.open(d / f"{a}.webp").convert("RGBA")
                fw, fh = s.width // 3, s.height // 2
                m = round(fw * .1)
                row = [s.crop((i % 3 * fw + m, i // 3 * fh + m, (i % 3 + 1) * fw - m, (i // 3 + 1) * fh)).resize((size, size)) for i in range(6)]
            else:
                row = []
            for i, c in enumerate(row[:6]):
                canvas.paste(c, (x0 + i * size, y0 + 14), c)
    out = SCRATCH / f"chapter2-{theme}.png"
    canvas.save(out)
    return out


if __name__ == "__main__":
    sys.path.insert(0, str(HERE))
    cmd, *rest_args = sys.argv[1:]
    if cmd == "list":
        for e, r in ROSTER.items():
            print(e, r["name"], "xa" if r["shot"] else "gan", r["blow"], r["s1"][3]["move"], r["s2"][3]["move"])
        print(len(ROSTER))
    elif cmd == "run":
        args = dict(zip(rest_args[::2], rest_args[1::2]))
        batch(int(args.get("--workers", 4)), args["--only"].split(",") if "--only" in args else None, args.get("--stages", "master,idle,fidgets,body,fx").split(","), args.get("--model", DEFAULT[0]), args.get("--effort", DEFAULT[1]))
    elif cmd == "replace":
        for e in rest_args:
            for name, label, _ in rest(e)[1]:
                place_fidget(e, name)
                run([sys.executable, HERE / "fidget.py", "accept", e, name, label, "--whole"])
    elif cmd == "reidle":
        for e in rest_args:
            process_idle(e)
    elif cmd == "chapter":
        for t in rest_args:
            print(chapter_sheet(t))
    elif cmd == "review":
        for e in rest_args:
            print(review(e))
