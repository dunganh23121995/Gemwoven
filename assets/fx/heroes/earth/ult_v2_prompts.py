"""Prompts for Nori's form 2-3 ultimate v2 effects (ult-v2-design.md, owner 12/11); drawn with codex_image_gen.py into
<name>/raw-sheet.png, packed by export_fx.py."""
from pathlib import Path

R = Path(__file__).resolve().parent
LAY = ("LAYOUT: exactly eight frames in a 2 COLUMNS x 4 ROWS grid of equal square cells, tall 1024x2048 canvas, read left-to-right, top-to-bottom, one continuous one-shot effect. "
       "Clean HD painterly anime game VFX matching a chibi fantasy RPG, NOT pixel art; everything painted fully opaque with crisp shapes (no soft haze, no smoke, no translucent fog). "
       "No character, no creature, no hero, no weapon, no text, no labels, no borders, no grid lines, no ground plate, no floor, no shadow. Everything stays fully inside its own cell with at least 6% magenta padding on all four sides in every frame. "
       "Background 100% solid flat #FF00FF magenta, no gradient. Never use magenta, pink or purple in the effect.")
P = {
    'stomp': ("Create an animated VFX sprite sheet: EARTH STOMP ground burst. A mighty foot has just stomped the ground (the foot is NOT drawn). Side-view RPG battle camera, slight 3/4 from the front. "
              "GROUND ANCHOR (most important): one fixed impact point horizontally centred at 80% of the cell height in every frame; the burst spreads along that ground line as a flat wide oval (low and wide, never a tall column). "
              "Palette: warm brown earth, dust puffs in sandy beige, khaki and ochre yellow-brown (never pink, salmon or peach) drawn as crisp cel-shaded shapes, chunks of brown rock, a few jade-green crystal chips, short glowing golden cracks. "
              "Frame 1: a flat bright golden crack star at the anchor. Frame 2: a low ring of dust puffs and rock chips bursting out sideways, 50% of the cell width. Frame 3: the ring widens to 85% of the cell width, rocks flying low (up to 30% of the cell height above the ground line). Frame 4: widest ring, 95% width, dust curling outward. "
              "Frame 5: rocks falling, dust thinning. Frame 6: dust settling at the edges. Frame 7: a few pebbles and cracks. Frame 8: faint cracks fading. "),
    'jadering': ("Create an animated VFX sprite sheet: JADE HAMMER-SLAM SHOCKWAVE RING. A war hammer has just struck the ground (the hammer is NOT drawn). Side-view RPG battle camera, slight 3/4 from the front. "
                 "GROUND ANCHOR (most important): one fixed impact point horizontally centred at 78% of the cell height in every frame; the ring is a flat ellipse lying on the ground around that point (about 4 times wider than tall). "
                 "Palette: polished jade and emerald green crystal, pale mint highlights, thin golden light, a few brown rock chips. "
                 "Frame 1: a bright jade starburst flash at the anchor. Frame 2: a thin glowing jade ring expands to 40% of the cell width, a few large jade crystal shards pop up. Frame 3: the ring at 75% width, a crown of big jade crystal shards bursting up around it (up to 35% of the cell height). Frame 4: ring at 95% width, shards highest. "
                 "Frame 5: ring thinning, shards falling outward. Frame 6: shards on the ground cracking. Frame 7: shards breaking into small pieces. Frame 8: faint jade cracks fading. Few large shards, not tiny dust. "),
    'spikes': ("Create an animated VFX sprite sheet: JADE CRYSTAL SPIKE ERUPTION. Side-view RPG battle camera, slight 3/4 from the front. "
               "GEOMETRY (most important): one flat ground line at 90% of the cell height. A cluster of sharp polished jade-green crystal spikes erupts from that line: tall spikes on the LEFT and RIGHT thirds of the cell leaning slightly inward, short spikes in front; the MIDDLE third stays mostly clear magenta above 25% of the cell height (an enemy may stand there). Spikes at most 55% of the cell height. "
               "Palette: deep jade to pale mint green crystal, glossy highlights, thin golden veins, brown rock chips at the base. "
               "Frame 1: glowing jade cracks and rock chips burst from the ground line. Frame 2: spikes shoot up halfway. Frame 3: spikes at full height, chips flying. Frame 4: the full cluster holding, bright highlights. Frame 5: the same cluster holding, glowing brighter. "
               "Frame 6: bright cracks split across every spike. Frame 7: the spikes shatter into sharp jade shards flying outward. Frame 8: the last shards falling to the ground line, small pieces only. "),
}
CRACK = ("Create ONE wide VFX image: a long GROUND CRACK running straight across the ground from the far left edge to the far right edge, seen from a low side-view RPG battle camera (slight 3/4 from the front), so the ground plane is a thin flat strip: "
         "the crack is a jagged horizontal fissure lying on the ground, zig-zagging slightly up and down within a band only 12% of the image height tall, centred at 55% of the image height, with a few short side branches. "
         "Inside the fissure: bright glowing emerald-green and pale-gold light shining up; along its edges small chunks of brown rock and jade chips popping up a little (low, never taller than 10% of the image height). "
         "The crack is thick and clearly readable (about 3% of the image height wide), roughly the same along the whole length. "
         "Clean HD painterly anime game VFX matching a chibi fantasy RPG, NOT pixel art, painted fully opaque with crisp shapes, no haze, no smoke, no fog. No character, no text, no labels, no borders, no ground plate or floor surface (only the crack, its glow and the chips). "
         "The crack touches the left and right image edges. Background 100% solid flat #FF00FF magenta everywhere else, no gradient. Never use magenta, pink or purple in the effect.")

# Form 2 v3 (owner 13/11 "không phù hợp, không mạnh mẽ"; Claude + Codex agreed, ult-v2-design.md "Dạng 2 · bản 3"):
# the jade guardian tree behind Nori, jade roots that travel under the ground and grip the foe.
P3 = {
}
# Owner 13/11 (Codex agreed): the form-2 roots wrap the WHOLE foe (a cage from the feet to above the head, gaps showing it),
# the form-3 giant shield charges into the foe and bursts apart.
P4 = {
    'shieldburst': ("Create an animated VFX sprite sheet: a GIANT SPECTRAL SHIELD SHATTERING ON IMPACT. The shield: a tall oval emerald shield seen in three-quarter view facing screen-right, a large golden tree emblem in its centre, its rim framed by pale-ivory roots and fresh green leaves, glowing mint-green, the same shield in frame 1 as a druid knight's giant spectral tree shield. "
                    "GROUND ANCHOR: the shield's bottom rim rests on one fixed point, horizontally centred, at 94% of the cell height; at frame 1 it fills 80% of the cell height. "
                    "Frame 1: the whole shield, leaning forward, bright cracks of white-gold light splitting across its face. Frame 2: it breaks apart explosively into big jade-green crystal shards and leaves, a bright burst of golden light in its centre. "
                    "Frame 3: large emerald shards, leaves and gold motes flying outward in every direction from the centre, the widest burst (90% of the cell width). Frame 4: the pieces flying farther and spinning, the light fading. "
                    "Frame 5: shards falling, leaves fluttering. Frame 6: fewer pieces, falling toward the ground line. Frame 7: small shards and leaves near the ground line. Frame 8: faint motes and a few leaves fading. "),
}

if __name__ == '__main__':
    for k, v in P.items():
        (R / k).mkdir(exist_ok=True); (R / k / 'prompt-used.txt').write_text(v + LAY, encoding='utf-8')
    (R / 'crack').mkdir(exist_ok=True); (R / 'crack' / 'prompt-used.txt').write_text(CRACK, encoding='utf-8')
    for k, v in P3.items():
        (R / k).mkdir(exist_ok=True); (R / k / 'prompt-used.txt').write_text(v + LAY, encoding='utf-8')
    for k, v in P4.items():
        (R / k).mkdir(exist_ok=True); (R / k / 'prompt-used.txt').write_text(v + LAY, encoding='utf-8')
    print('prompts written')
