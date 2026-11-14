"""Nori's whole-kit redo (owner 13/11: "làm lại toàn bộ hình ảnh và hiệu ứng của nori ... khống chế, mạnh mẽ và bộc phát"):
Codex's design ("the warden knight": pin the feet -> clamp the body -> wall in the foe), with the owner's own beats kept
(form 3: the giant shield charges into the foe and bursts; form 2: the roots wrap the whole foe). Heavy stone, old wood,
dark jade in the seams, worn gold rims. Drawn with codex_image_gen.py into <name>/raw-sheet.png, packed by export_fx.py."""
from pathlib import Path
from ult_v2_prompts import LAY

R = Path(__file__).resolve().parent
P5 = {
    # basic attack impacts, escalating by form (no plants, no spikes)
    'hit1': ("Create an animated VFX sprite sheet: a HEAVY HAMMER GROUND DENT. Side-view RPG battle camera, slight 3/4 from the front. GROUND LINE at 88% of the cell height, impact point horizontally centred. "
             "Palette: warm brown earth, grey stone, sandy dust. Frame 1: a dark dent punched into the ground. Frame 2: 3-4 flat stone chips and a low flat dust spray thrown sideways (never tall). Frame 3: chips at their highest (25% of the cell height), dust widest (75% of the cell width). "
             "Frame 4: chips falling. Frame 5: chips landing, dust thinning. Frame 6: dust settling. Frame 7: a cracked dent and a few pebbles. Frame 8: faint dent fading. "),
    'hit2': ("Create an animated VFX sprite sheet: an ANGULAR STONE IMPACT WITH JADE SEAMS. Side-view RPG battle camera, slight 3/4 from the front. GROUND LINE at 86% of the cell height, impact point horizontally centred. "
             "Palette: grey-brown angular stone, dark jade-green glowing seams inside the cracks, worn gold sparks, sandy dust. Frame 1: the ground splits under the blow, jade light in the cracks. Frame 2: angular stone blocks burst up and a low flat pressure ring of dust spreads. "
             "Frame 3: blocks highest (32% of the cell height), ring widest (90% of the cell width). Frame 4: blocks falling. Frame 5: blocks landing, ring fading. Frame 6: dust settling, seams dimming. Frame 7: cracked ground with faint seams. Frame 8: fading. "),
    'hit3': ("Create an animated VFX sprite sheet: a TWO-STAGE COMPRESSED EARTH BLAST. Side-view RPG battle camera, slight 3/4 from the front. GROUND LINE at 86% of the cell height, impact point horizontally centred. "
             "Palette: heavy grey stone plates, dark jade-green core, worn gold rims, sandy dust. Frame 1: a bright compressed jade core punched into the ground. Frame 2: a first ring of heavy stone plates bursts up and outward. Frame 3: a second taller ring of plates bursts up a beat later, the jade core flaring (plates up to 40% of the cell height). "
             "Frame 4: the widest burst (95% of the cell width), dust rolling outward low. Frame 5: plates falling. Frame 6: plates crashing down, dust settling. Frame 7: rubble and faint jade seams. Frame 8: fading. "),
    # form 1: pin the feet
    'footlock': ("Create an animated VFX sprite sheet: an EARTH FOOT-LOCK pinning an enemy's feet (the enemy is NOT drawn). Side-view RPG battle camera, slight 3/4 from the front. "
                 "GEOMETRY (most important): ground line at 92% of the cell height; an EMPTY space in the middle (centred, 44% of the cell width wide, from the ground line up to 45% of the cell height) where the enemy stands. "
                 "Two squat heavy wedges of grey stone bound with old dark wood and dark jade veins, one on each side of the space, snap inward to clamp the enemy's feet; a worn-gold forest-shield sigil (a round shield with a tree emblem) stamps flat onto the ground between them. Wedges at most 38% of the cell height. "
                 "Frame 1: the ground cracks on both sides of the space. Frame 2: the wedges burst up, leaning outward. Frame 3: the wedges snap inward against the space, the sigil slamming down glowing. Frame 4: locked tight, dust bursting sideways, the sigil brightest. "
                 "Frame 5: locked, steady. Frame 6: locked, the sigil pulsing once. Frame 7: the wedges sinking back into the ground. Frame 8: only cracked ground and a fading sigil. "),
    # form 3: the monumental planted shield (redrawn heavier), the walls and the antler lock
    'bigshield2': ("Create an animated VFX sprite sheet: a MONUMENTAL SPECTRAL FOREST SHIELD rising from the ground. The shield: a tall heavy kite shield of dark green stone-wood seen in three-quarter view facing screen-right, a worn gold tree crest in its centre, solid gold antler-shaped corners, a glowing jade rim, semi-solid and weighty (not glassy). "
                   "GROUND ANCHOR: its bottom tip rests on one fixed point, horizontally centred, at 94% of the cell height; at full size it fills 86% of the cell height. "
                   "Frame 1: a ring of dust and the shield's top just breaking out of the ground (25% height). Frame 2: rising (60%). Frame 3: full size, dust falling off. Frame 4: full size, the crest shining. Frame 5: full size, steady. Frame 6: full size, a bright pulse through the crest (the stomp). "
                   "Frame 7: full size, leaning forward as if about to charge. Frame 8: full size, leaning forward further, jade light streaming back from its edges. "),
    'citadel': ("Create an animated VFX sprite sheet: THREE SHIELD-RAMPARTS RISING AROUND AN ENEMY (the enemy is NOT drawn). Side-view RPG battle camera, slight 3/4 from the front. "
                "GEOMETRY (most important): ground line at 93% of the cell height; an EMPTY space in the middle (centred, 46% of the cell width wide, from the ground line up to 18% of the cell height) where the enemy stands. "
                "Three massive upright wall slabs shaped like kite shields, dark green stone-wood with worn gold tree crests and gold rims, rise from the ground: one BEHIND the space (centred, taller) and one on each side of it, angled inward; the front stays open. Walls at most 80% of the cell height. "
                "Frame 1: the ground splits in a ring around the space. Frame 2: the three walls burst up halfway, rubble flying. Frame 3: walls at full height. Frame 4: the walls jolt inward one beat, dust blasting out, crests glowing. "
                "Frame 5: the walls holding rigid. Frame 6: holding, crests pulsing. Frame 7: the walls sinking back down. Frame 8: only cracked ground fading. "),
    'antlerlock': ("Create an animated VFX sprite sheet: an ANTLER-SHAPED LOCKING LINTEL SLAMMING DOWN (front layer of a prison; the enemy is NOT drawn). Side-view RPG battle camera, slight 3/4 from the front. "
                   "GEOMETRY (most important): ground line at 93% of the cell height; two short stone-wood buttresses stand at the left and right edges of the middle space (centred, 46% of the cell width apart), up to 30% of the cell height; a heavy horizontal lintel shaped like golden stag antlers slams down onto them at 22% of the cell height from the top. The middle between the buttresses and under the lintel stays EMPTY magenta (the enemy's face and body show there). "
                   "Frame 1: the buttresses burst up from the ground. Frame 2: the antler lintel appears high above, glowing jade. Frame 3: the lintel dropping fast. Frame 4: the lintel SLAMS onto the buttresses, a bright ivory-white flash at the joints, dust bursting. "
                   "Frame 5: locked, steady. Frame 6: locked, jade pulsing in the joints. Frame 7: the lintel and buttresses sinking. Frame 8: fading. "),
    'renewal': ("Create an animated VFX sprite sheet: a THIN STREAM OF EMERALD SAP-LIGHT flowing into a knight's shield (the knight is NOT drawn). "
                "GEOMETRY: the stream enters a target point at 55% of the cell width, 55% of the cell height, coming in from the lower right in a gentle curve, with a few small fresh green leaves riding it. "
                "Frame 1: the first motes of jade light appear at the lower right. Frame 2: a thin curving ribbon of emerald light. Frame 3: the ribbon reaching the target point, leaves along it. Frame 4: the ribbon flowing in, a small soft glow at the target. "
                "Frame 5: the ribbon thinning, the glow strongest. Frame 6: the last of the stream entering. Frame 7: a soft glow and two drifting leaves. Frame 8: fading. "),
}

if __name__ == '__main__':
    for k, v in P5.items():
        (R / k).mkdir(exist_ok=True); (R / k / 'prompt-used.txt').write_text(v + LAY, encoding='utf-8')
    print('prompts written', len(P5))
