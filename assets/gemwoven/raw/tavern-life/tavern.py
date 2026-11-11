"""Tavern life (owner 08/11: "các nhân vật trong quán bia bao gồm cả động vật cho hoạt ảnh động"): the tavern painting
is redrawn without its guests and with full shelves (plate-raw.png); each guest is drawn alone (Codex, from a crop of
the old painting), keyed, and moves at rest on the hub NPC rig (assets/gemwoven/npc/npc_rig.py), standing where the
painting had it.

  python tavern.py draw <id>     sprite (sprite-raw.png) from the crop of the old painting
  python tavern.py key <id>      proc/raw-sheet-clean.png (magenta keyed, the cut edge kept straight)
  python tavern.py rig <id> step npc_rig steps: rest | parts | make
  python tavern.py place         stage boxes into painted-backgrounds.json + a comparison picture
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'assets/gemwoven/npc'))
import npc_rig as N  # noqa: E402

GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
# box: where the guest is in the old painting (stage units, 941x1672); cut: the stage y of the table or counter line
# that hides the rest of the body (None: the whole figure shows).
GUESTS = {
    'barmaid': dict(box=(108, 505, 398, 727), cut=727,
                    who='a cheerful chibi barmaid with curly brown hair and a white ribbon, raising a foaming beer mug in each hand, eyes closed in a big laugh',
                    edge='the counter line at her waist',
                    parts=dict(held='both beer mugs with their foam, without the hands', back='the long curly hair falling behind her shoulders', front='the white hair ribbon and small hair curls over the face')),
    'mika': dict(box=(105, 770, 320, 1118), cut=None,
                 who='a chibi red-haired fox girl with fox ears and a fluffy fox tail in red and gold armour with a white scarf, sitting on a stool and raising a foaming beer mug, laughing',
                 edge=None,
                 parts=dict(held='the beer mug with its foam, without the hand', back='the long red hair and the fluffy fox tail', front='the white scarf ends and small hair strands over the face')),
    'yuki': dict(box=(330, 752, 505, 1005), cut=1005,
                 who='a chibi girl with long silver-white hair, white rabbit ears and a blue moon hairpin in a blue and white dress, raising a foaming beer mug, smiling',
                 edge='the table line at her chest',
                 parts=dict(held='the beer mug with its foam, without the hand', back='the long silver hair falling down both sides', front='the blue hair ornament and small hair strands over the face')),
    'lumi': dict(box=(525, 735, 790, 1010), cut=1010,
                 who='a chibi blonde witch girl with a big purple pointed hat with a golden moon in a purple dress, raising a foaming beer mug, eyes closed laughing',
                 edge='the table line at her waist',
                 parts=dict(held='the beer mug with its foam, without the hand', back='the long blonde hair', front='the brim and tip of the witch hat and small hair strands over the face')),
    'noct': dict(box=(760, 790, 941, 1032), cut=1032,
                 who='a chibi hooded dark reaper in black armour with a black hood, a shadowed face with two glowing cyan eyes, raising a foaming beer mug, a spear tip behind his shoulder',
                 edge='the table line at his chest',
                 parts=dict(held='the beer mug with its foam and the spear, without the hand', back='the hood tail and the scarf ends', front='the loose cloth edges of the scarf')),
    'fox': dict(box=(8, 948, 196, 1090), cut=None,
                who='a small fluffy orange and white fox with a blue scarf lying asleep curled on its belly, eyes closed in a happy smile',
                edge=None,
                parts=None),
}
FOX_PROMPT = """Image 1 is a {what} on a plain background. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: face, closed eyes, nose, mouth and both ears. The face is never any other colour.
- pure WHITE #FFFFFF: the chest and the front of the body with the blue scarf.
- pure GREEN #00FF00: the belly, the hind legs and the paws lying on the stool: they never move.
- pure RED #FF0000: the big fluffy tail from its base to its tip.
- pure CYAN #00FFFF: the free ends of the blue scarf and small fur tufts.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""
SIT_PROMPT = """Image 1 is a {what} on a plain background{cutnote}. Redraw EXACTLY the same picture as a flat colour-coded PART MAP for skeletal animation: the same canvas, the same pose, size and position, every outline exactly where it is in Image 1, every region filled with one solid flat colour:
- pure BLUE #0000FF: the head: the whole face with eyes, nose and mouth, the ears, the hair on top of the head and the bangs{hat}. The face is never any other colour.
- pure WHITE #FFFFFF: the body: neck, torso, shoulders, both arms and both hands.
- pure GREEN #00FF00: {planted}: it never moves.
- pure YELLOW #FFFF00: {held}.
- pure RED #FF0000: {back}.
- pure CYAN #00FFFF: {front}.
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""
STYLE = dict(T=2.6, bob=.006, sway=.0025, tilt=.8, grip=.9, loose=.2, front=.07, lag=1.1, lean=.4, planted=True, webp=(86, 90))
# Each guest keeps its own pace and size of motion (owner 10/11: "chuyển động cùng lúc nhịp giống nhau quá"): the
# barmaid quick and bright, Mika lively, Yuki slow and soft, Lumi swaying, Noct slow and still, the fox asleep. On the
# hub the loops also start at different frames (PHASE) and the fox lies in front of Mika (LAYER: later = in front).
MOTION = {'barmaid': dict(T=2.1, bob=.008, tilt=1.0, sway=.003), 'mika': dict(T=2.8, bob=.0065, tilt=1.15, sway=.0035),
          'yuki': dict(T=3.15, bob=.0045, tilt=.55, sway=.002), 'lumi': dict(T=2.45, bob=.007, tilt=.9, lean=.65, sway=.003),
          'noct': dict(T=3.9, bob=.004, tilt=.4, sway=.0015, lean=.25), 'fox': {}}
PHASE = {'barmaid': 0, 'mika': 9, 'yuki': 17, 'lumi': 5, 'noct': 13, 'fox': 20}
LAYER = {'barmaid': 0, 'noct': 1, 'lumi': 2, 'yuki': 3, 'mika': 4, 'fox': 5}


def register(key):
    g = GUESTS[key]
    if key == 'fox':
        prompt = FOX_PROMPT
        style = dict(STYLE, T=3.4, bob=.009, sway=.002, tilt=.5, grip=0, loose=.22)
    else:
        p = g['parts']
        prompt = SIT_PROMPT.format(what='{what}', cutnote=', cut off by a straight horizontal edge at the bottom' if g['cut'] else '',
                                   hat=', and the whole witch hat' if key == 'lumi' else ', and the hood' if key == 'noct' else '',
                                   planted='the bottom band of the picture along the straight cut edge (about the lowest tenth of the height)' if g['cut'] else 'the hips, both legs and the boots sitting on the stool',
                                   held=p['held'], back=p['back'], front=p['front'])
        style = dict(STYLE, **MOTION[key])
    N.NPCS['tavern-' + key] = dict(dir=HERE / key, what=g['who'], prompt=prompt, style=style)


def draw(key):
    g = GUESTS[key]
    d = HERE / key; d.mkdir(exist_ok=True)
    x0, y0, x1, y1 = g['box']
    old = Image.open(HERE / 'ref-tavern.png').convert('RGB')
    pad = 30
    old.crop((max(0, x0 - pad), max(0, y0 - pad), min(941, x1 + pad), min(1672, (g['cut'] or y1) + pad))).save(d / 'ref-crop.png')
    cut = f"cut off with a clean straight horizontal edge at {g['edge']}, nothing below it" if g['cut'] else 'the whole figure'
    prompt = f"""Reference image 1 shows {g['who']} in a painted cozy fantasy tavern (chibi anime, warm hand-painted mobile RPG style).
Draw ONLY this same character as a single game sprite: the exact same design, outfit, colours, hair, pose, expression, facing and proportions as reference 1, rendered crisp and clean at high resolution in the same painted style. Show {cut}. No table, no stool, no counter, no other characters, no background objects.
Centered, filling about 80% of the canvas height, square 1:1 canvas, on a solid flat pure magenta #FF00FF background with no shadow, no gradient, no glow, no text. No magenta or pink inside the character."""
    (d / 'sprite-prompt.txt').write_text(prompt, encoding='utf-8')
    env = dict(__import__('os').environ, IMAGEGEN_BACKEND='codex')
    subprocess.run([sys.executable, GEN, '--prompt-file', str(d / 'sprite-prompt.txt'), '--out', str(d / 'sprite-raw.png'),
                    '--ref', str(d / 'ref-crop.png'), '--model', 'gpt-6.1-sol', '--effort', 'low'], env=env, check=True,
                   stdout=subprocess.DEVNULL)


def key_out(key):
    """Magenta keyed (unmixed at soft edges), cropped to the figure, centred in a square with room to sway."""
    d = HERE / key
    a = np.asarray(Image.open(d / 'sprite-raw.png').convert('RGB')).astype(np.float32)
    dist = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    alpha = np.clip((dist - 50) / 90, 0, 1)
    k = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - (1 - k) * np.array([255, 0, 255], np.float32)) / k, 0, 255)
    im = Image.fromarray(np.dstack([rgb, alpha * 255]).astype('uint8'), 'RGBA')
    im = im.crop(im.getbbox())
    n = round(max(im.width / .86, im.height / .86))
    cell = Image.new('RGBA', (n, n))
    # a figure cut at a table stands its cut edge on the cell's bottom, so the planted band never moves off it
    cell.alpha_composite(im, ((n - im.width) // 2, n - im.height if GUESTS[key]['cut'] else round(n * .93) - im.height))
    (d / 'proc').mkdir(exist_ok=True)
    cell.save(d / 'proc/raw-sheet-clean.png')


def stage(key):
    """The cell placed so the figure's box matches where the painting had the guest."""
    g = GUESTS[key]
    cell = Image.open(HERE / key / 'proc/raw-sheet-clean.png')
    b = cell.getbbox()
    x0, y0, x1, y1 = g['box']
    bottom = g['cut'] or y1
    s = (bottom - y0) / (b[3] - b[1])
    return dict(x=round(x0 + (x1 - x0) / 2 - (b[0] + b[2]) / 2 * s, 1), y=round(bottom - b[3] * s, 1), size=round(cell.width * s, 1))


def place():
    p = ROOT / 'assets/gemwoven/painted-backgrounds.json'
    data = json.loads(p.read_text(encoding='utf-8'))
    plate = Image.open(HERE / 'plate-raw.png').convert('RGBA')
    for key in sorted(GUESTS, key=LAYER.get):
        rig = HERE / key / 'rig/show'
        if not (rig / 'idle.webp').exists():
            continue
        st = stage(key)
        meta = json.loads((rig / 'rig.json').read_text(encoding='utf-8'))
        sheet = Image.open(rig / 'idle.webp')
        data['npc-tavern-' + key] = dict(file=(rig / 'idle.webp').relative_to(ROOT).as_posix(), width=sheet.width, height=sheet.height,
                                         cols=meta.get('cols', 6), rows=meta.get('rows', 4), count=meta.get('count', 24),
                                         frameDuration=meta.get('frameDuration', 108), phase=PHASE[key], layer=LAYER[key], stage=st, screen='tavern', textless=True,
                                         source=(HERE / key / 'sprite-raw.png').relative_to(ROOT).as_posix(),
                                         promptFiles=[(HERE / key / 'sprite-prompt.txt').relative_to(ROOT).as_posix()],
                                         script=(HERE / 'tavern.py').relative_to(ROOT).as_posix())
        rest = Image.open(rig / 'rest.png').convert('RGBA').resize((round(st['size']),) * 2, Image.LANCZOS)
        plate.alpha_composite(rest, (round(st['x']), round(st['y'])) if st['x'] >= 0 else (0, round(st['y'])))
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    plate.convert('RGB').save(HERE / 'placed.png')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'draw':
        draw(sys.argv[2])
    elif cmd == 'key':
        key_out(sys.argv[2])
    elif cmd == 'rig':
        key, step = sys.argv[2], sys.argv[3]
        register(key)
        reg = N.register('tavern-' + key)
        if step == 'rest':
            N.rest('tavern-' + key)
        elif step == 'parts':
            N.R.parts('tavern-' + key, 1, 'show', *sys.argv[4:])
        elif step == 'make':
            N.R.fit('tavern-' + key, 1, 'show')
            N.R.Rig('tavern-' + key, 1, 'show').bake()
    elif cmd == 'place':
        place()
