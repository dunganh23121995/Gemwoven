"""Prompts for the experience gauge's band textures (owner 08/11: "dùng trang trí gốc làm HUD"): for each season frame, one
straight seamless strip of the ring pattern of the frame as first drawn (original.webp), with no ornaments, wrapped by
scripts/build_gemwoven.py onto the groove of the redrawn frame. Unrolling the original ring itself carried pieces of its ears,
hat and flames into the groove."""
from pathlib import Path

HERE = Path(__file__).parent
PATTERN = {
    'mika': 'deep crimson lacquer with flowing golden-orange fox-fire flame swirls',
    'yuki': 'polished silver with midnight-blue inlay, frost crystal streaks and tiny snowflakes',
    'nori': 'dark mossy forest green with twining golden vines and small leaves',
    'lumi': 'deep royal purple lacquer scattered with small golden four-point stars and tiny sparkles',
    'noct': 'smoky black-violet gunmetal with faint glowing soul-cyan streaks and thin thorny runes',
    'hiro': 'warm polished walnut wood grain with a few small brass rivets',
}
TEMPLATE = """Use case: a texture strip for a game UI ring (portrait fantasy match-3 RPG "Gemwoven", painted hand-drawn style).
Reference image 1 is the avatar frame whose round ring band shows the pattern to copy: {pattern}. Copy only that ring band's surface pattern, colours, painted brushwork and lighting.
Draw ONE long straight horizontal band carrying this pattern, running edge to edge across the whole width of the image, centred vertically, about one sixth of the image height tall, with even height along its length. The band is the ring's surface unrolled flat: no rims, borders or edge lines along its top and bottom, no ornaments at all (no ears, flames, bows, hats, antlers, leaves sticking out, gems, emblems), no text. The pattern repeats evenly along the band and its left end continues seamlessly into its right end.
Above and below the band: solid flat pure magenta #FF00FF. No magenta or pink inside the band.
"""
for key, pattern in PATTERN.items():
    (HERE / key / 'band-prompt.txt').write_text(TEMPLATE.format(pattern=pattern), encoding='utf-8')
print('ok')
