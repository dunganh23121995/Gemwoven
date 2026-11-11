"""Prompts for the premium battle frames of the other seasons, built on the approved Hỏa Hồ pieces (premium/mika: Codex
8.0 in game): reference image 1 is the Hỏa Hồ piece of the same kind (layout, proportions, how much stands outside the
band), reference image 2 the season's avatar frame as first drawn (motif, palette)."""
from pathlib import Path

HERE = Path(__file__).parent
SEASONS = {
    'yuki': dict(name='Tuyết Thỏ — Moon Ice Rabbit', mat='polished silver, frosted midnight-blue lacquer and pale ice crystals',
                 corners='top-left a carved rabbit head with long ears and a crescent moon, top-right a silver crescent moon with icicles, bottom-left and bottom-right small snowflake knots with ice studs',
                 groove='a thin frost-crystal groove',
                 crest='a silver crescent moon crest with two long rabbit ears and spreading wings of ice crystals',
                 mascot='a SMALL sculpted silver-white moon rabbit sits curled ON the frame\'s upper-left corner (its body about 12 percent of the image width, its long ears reaching no more than 8 percent above the top band); flowing ribbons of frosted silk lie flat ALONG the left band and the bottom band, hugging the outside of the band and never reaching more than 6 percent beyond it. A small snowflake charm with short blue tassels sits ON the lower-right corner of the band',
                 caps='silver crescent-moon end caps with a small snowflake', inlay='a faint frost inlay',
                 back='deep midnight blue, with a barely visible tone-on-tone pattern of frost crystals and snowflakes'),
    'nori': dict(name='Lộc Thần — Sacred Forest Deer', mat='aged gold, mossy forest-green lacquer and carved twining vines',
                 corners='top-left a carved deer head with branching golden antlers, top-right a golden antler branch with oak leaves, bottom-left and bottom-right small acorn-and-leaf knots with gold studs',
                 groove='a thin carved vine groove',
                 crest='a crest of golden branching antlers around an emerald gem, with oak leaves',
                 mascot='a SMALL sculpted white sacred deer fawn lies curled ON the frame\'s upper-left corner (its body about 12 percent of the image width, its little antlers reaching no more than 8 percent above the top band); leafy vines with small oak leaves and acorns lie flat ALONG the left band and the bottom band, hugging the outside of the band and never reaching more than 6 percent beyond it. A small green shield emblem with a golden tree sits ON the lower-right corner of the band',
                 caps='golden antler-and-leaf end caps', inlay='a faint vine inlay',
                 back='deep dark forest green, with a barely visible tone-on-tone pattern of leaves and vines'),
    'lumi': dict(name='Tinh Lôi — Star-Thunder Witch', mat='gold and deep royal-purple lacquer with small golden stars and fine lightning lines',
                 corners='top-left a small purple witch hat with a golden crescent moon, top-right a golden lightning bolt with stars, bottom-left and bottom-right small four-point star knots with violet gem studs',
                 groove='a thin groove of tiny stars',
                 crest='a golden four-point star crest with a violet gem and two wings of crackling lightning',
                 mascot='a SMALL purple witch hat with a golden crescent moon rests ON the frame\'s upper-left corner (about 12 percent of the image width, its tip reaching no more than 8 percent above the top band), with a golden star-tipped wand lying flat ALONG the left band and a starry violet ribbon lying flat ALONG the bottom band, hugging the outside of the band and never reaching more than 6 percent beyond it. A small golden star charm with a violet gem sits ON the lower-right corner of the band',
                 caps='golden star end caps with a violet gem', inlay='a faint star inlay',
                 back='deep indigo, with a barely visible tone-on-tone pattern of small stars and constellation lines'),
    'noct': dict(name='Ảnh Nguyệt — Moon Reaper', mat='dark gunmetal and smoky black-violet lacquer with soul-cyan glowing runes and crescent moons',
                 corners='top-left a small hooded shadow with two glowing cyan eyes, top-right a silver crescent-moon blade, bottom-left and bottom-right small thorny rune knots with cyan glow',
                 groove='a thin glowing cyan rune groove',
                 crest='a silver crescent-moon crest with two curved scythe-blade wings and a soft soul-cyan glow',
                 mascot='a SMALL cute hooded reaper spirit with two glowing cyan eyes perches ON the frame\'s upper-left corner (its body about 12 percent of the image width, its hood reaching no more than 8 percent above the top band); a long slim scythe lies flat ALONG the left band and its tattered dark cloak lies flat ALONG the bottom band, hugging the outside of the band and never reaching more than 6 percent beyond it. A small soul lantern with a cyan flame hangs ON the lower-right corner of the band',
                 caps='gunmetal crescent-moon end caps with a cyan rune', inlay='a faint glowing rune inlay',
                 back='deep black-teal, with a barely visible tone-on-tone pattern of mist and faint runes'),
}
STYLE = ("Style: a premium seasonal battle frame '{name}', the same quality and finish as reference image 1 (the approved Hỏa Hồ "
         "frame of the same game) with the motif and palette of reference image 2: hand-painted fantasy mobile game UI, {mat}, "
         "sculptural depth, crisp clean edges, no pixel art, no text, no letters.")
BG = ("Solid flat pure magenta #FF00FF background around the artwork, generous margin, nothing touching the image edges. "
      "No magenta or pink inside the artwork.")
PIECES = {
    'scene-frame': "One ornate rectangular landscape picture frame (3:2), seen straight on, laid out exactly like reference image 1: the frame band about 8 percent of the frame's height thick, four DIFFERENT carved corner pieces ({corners}), each corner ornament within about 14 percent of the frame's height from its corner. Between the corners the four straight edges are one continuous uniform carved molding with {groove}, identical all along so it can repeat. The inside of the frame is empty and filled with the same pure magenta. Nothing at the middle of the top edge.",
    'crest': "One ornament like reference image 1 in size and shape: {crest}, about three times as wide as tall, centred.",
    'board-frame': "One square ornate frame, seen straight on, laid out exactly like reference image 1: an empty square opening (a perfect square, about 86 percent of the image width, centred), the frame band about 4 percent of the opening's width. {mascot}. Nothing inside the opening. Everything stays inside the image with a margin. The square opening is empty and filled with pure magenta.",
    'rail': "One long horizontal bar like reference image 1, about 8 times as wide as tall: a carved plank framed by trim, with ornate {caps}; between the caps a uniform surface with {inlay}, identical along its length so it can repeat.",
    'board-back': "A square seamless background panel for a gem board: {back}, very low contrast, quiet, no bright spots, filling the whole square image edge to edge, hand-painted, no frame, no text.",
}
for key, s in SEASONS.items():
    d = HERE / key
    d.mkdir(exist_ok=True)
    for piece, body in PIECES.items():
        text = body.format(**s)
        if piece != 'board-back':
            text += ' ' + STYLE.format(**s) + ' ' + BG
        (d / f'{piece}-prompt.txt').write_text(text + '\n', encoding='utf-8')
print('ok')
