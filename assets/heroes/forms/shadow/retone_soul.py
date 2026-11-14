"""Noct's soul effects in a reaper's soul aqua (owner 13/11: "Noct các hiệu ứng màu linh hồn. Nhưng linh hồn màu đó có vẻ
không đúng. Kathus trong game liên minh có màu linh hồn đó. Có thể tham khảo"): then his reference picture ("Màu linh hồn đây này"): a pale icy aqua glow round a near-white
core, deep teal in shadow (a first jade-green pass was wrong and was undone), in place of the avatar cyan the effects
took on 07/11 (retone_cyan.py); then (owner 13/11: "Màu linh hồn không chỉ ở tuyệt kỹ mà các hiệu ứng ở vạt áo cũng đổi") the
glow on his cloak hems, eyes and aura too: `body` turns only the LIT cyan (bright, saturated) of every Noct picture
retone_cyan.py covers to the soul aqua (every coloured hem tip, not only the brightest: the owner wants the hems in it); the colourless black cloth stays. The moon keeps its colour.

  soul.webp (the harvested soul he hauls away, nearly colourless): coloured by its lightness along the soul ramp.
  the other effects (the form-2 clone sparks, the cut lines): every cyan/blue hue turned to the soul aqua (paler, a little brighter),
  lightness, saturation, alpha and lines as drawn.
Their raws are violet: an effect rebuilt from a raw goes through retone_cyan.py `file`, then this script `file`.

  python assets/heroes/forms/shadow/retone_soul.py apply             # every listed effect, in place (run once)
  python assets/heroes/forms/shadow/retone_soul.py file <in> [out]   # one file (hue step; --ramp for the soul's ramp)
  python assets/heroes/forms/shadow/retone_soul.py body              # the lit cyan of every Noct picture (run once)
  python assets/heroes/forms/shadow/retone_soul.py body-file <in> [out]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from retone_cyan import hsv, smooth  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
SOUL_HUE, DEEP_HUE = 176.0, 184.0     # the pale aqua of the owner's reference; its shadowed side a touch bluer
SOUL_FADE, SOUL_LIFT = .5, .12        # the soul glow is pale: saturation halved where it turns, lightness lifted a little
BODY_LIFT = .3                        # his eyes and hem glow lifted more, or they sink on a phone (Codex 13/11)
# the soul ramp by lightness: deep teal-black shadow, dark teal, pale aqua glow, near-white core (owner's Karthus reference 13/11)
RAMP = [(0.0, (8, 28, 30)), (.28, (28, 96, 98)), (.55, (112, 208, 204)), (.8, (206, 247, 243)), (1.0, (248, 255, 254))]
RAMPED = ['assets/fx/noct/soul.webp']
# + six-star Noct's basic-attack crescent (assets/fx/heroes/basic: export_fx.py there is not rerun; its output retoned)
HUED = ['assets/fx/heroes/shadow/lines.webp', 'assets/fx/heroes/basic/noct3.webp'] + [f'assets/fx/forms/shadow-2/fx-{i}.png' for i in range(1, 9)]


def to_soul(rgba, body=False):
    """Every cyan/blue (the 07/11 avatar cyan, 182-240 deg) turned to the soul aqua, paler and a little brighter; on a body
    sheet only coloured pixels (near-black and grey cloth stay)."""
    a = rgba.astype(np.float32) / 255
    h, s, mx = hsv(a[..., :3])
    w = smooth(178, 188, h) * (1 - smooth(238, 252, h)) * (smooth(.12, .3, s) * smooth(.08, .26, mx) if body else smooth(.04, .12, s))
    if not (w > 0).any():
        return rgba, 0.0
    target = SOUL_HUE + (DEEP_HUE - SOUL_HUE) * (1 - smooth(.3, .9, mx))
    h2 = (h + w * (target - h)) / 60
    i, f = np.floor(h2) % 6, h2 - np.floor(h2)
    s = s * (1 - SOUL_FADE * w)
    v = np.minimum(1, mx * (1 + (BODY_LIFT if body else SOUL_LIFT) * w))
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    sel = [i == k for k in range(6)]
    out = np.stack([np.select(sel, c) for c in ((v, q, p, p, t, v), (t, v, v, q, p, p), (p, p, t, v, v, q))], -1)
    res = rgba.copy()
    m = w > 0
    res[..., :3][m] = np.clip(np.round(out[m] * 255), 0, 255).astype(np.uint8)
    return res, float((w > .5).mean())


def hue_soul(rgba):
    return to_soul(rgba)[0]


def body_soul(rgba):
    return to_soul(rgba, body=True)


def ramp_soul(rgba, amount=.92):
    a = rgba.astype(np.float32)
    y = (a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114) / 255
    xs = [p for p, _ in RAMP]
    col = np.stack([np.interp(y, xs, [c[k] for _, c in RAMP]) for k in range(3)], -1)
    res = a.copy()
    res[..., :3] = a[..., :3] * (1 - amount) + col * amount
    return np.clip(np.round(res), 0, 255).astype(np.uint8)


def run(path, out=None, ramp=False):
    im = Image.open(path)
    mode = im.mode
    rgba = np.asarray(im.convert('RGBA'))
    res = Image.fromarray(ramp_soul(rgba) if ramp else hue_soul(rgba), 'RGBA')
    out = Path(out or path)
    if out.suffix == '.webp':
        res.save(out, 'WEBP', quality=92, alpha_quality=100, method=6)
    else:
        res.convert(mode if mode in ('RGBA', 'RGB') else 'RGBA').save(out)
    print('retoned', out)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'apply':
        for f in RAMPED:
            run(ROOT / f, ramp=True)
        for f in HUED:
            run(ROOT / f)
    elif cmd in ('body', 'body-file'):
        from retone_cyan import targets, process
        files = [Path(sys.argv[2])] if cmd == 'body-file' else [t for t in targets() if t.name != 'moon.webp' and t.relative_to(ROOT).as_posix() not in RAMPED + HUED]
        out = sys.argv[3] if cmd == 'body-file' and len(sys.argv) > 3 else None
        n = 0
        for t in files:
            share = process(t, out, steps=(body_soul,))
            n += share > 0
        print('body: retoned', n, 'of', len(files))
    elif cmd == 'file':
        args = [x for x in sys.argv[2:] if not x.startswith('--')]
        run(args[0], args[1] if len(args) > 1 else None, ramp='--ramp' in sys.argv)
    else:
        print(__doc__)
