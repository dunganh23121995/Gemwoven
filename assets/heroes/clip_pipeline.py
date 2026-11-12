"""Clip route for hero action sheets (owner 12/11): ComfyUI clip -> 24 frames -> Codex sharpening -> game.

Steps (docs/HERO_PIPELINE.md "Clip route"):
  1. spec.json per action (assets/heroes/forms/<hero>/clips/<id>/): description of every clip segment, its first/last
     keyframes (the resting frame, approved poses), the game's beats. Claude and Codex review it (review <id> spec).
  2. clip <id>      : Wan 2.2 I2V first/last-frame clips on Comfy Cloud, one per segment and seed (clip/ is a cache).
  3. contact <id>   : contact sheets of every take; pick 24 frames into spec "pick"; review <id> frames.
  4. not right -> new seeds / prompt, clip again.
  5. soft <id> + sharpen <id> (Codex redraws 6 frames per sheet with the resting frame as reference) + assemble <id>
     (frames locked to the clip's scale and feet, keyed, one sheet, sockets measured) -> the runtime sheet.
  6. review <id> game after it plays in combat.

python assets/heroes/clip_pipeline.py <command> <hero>/<id> [options]
"""
import argparse, json, math, os, subprocess, sys, threading
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
MAG = (255, 0, 255)
IMAGEGEN = Path.home() / '.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
SIZE = 768        # clip resolution (square)
CELL = 512        # runtime cell
NEG = ('camera movement, zoom, pan, background change, gradient background, scenery, extra characters, text, watermark, '
       'blurry, deformed hands, extra limbs, extra weapon, morphing face, flicker, frozen hair, static cloth')


def folder_of(spec):
    return ROOT / 'assets/heroes/forms' / spec.get('hero', 'fire') / 'clips' / spec['id']


def folder(ref):
    hero, cid = ref.split('/')
    return ROOT / 'assets/heroes/forms' / hero / 'clips' / cid


def load(ref):
    d = folder(ref)
    return d, json.loads((d / 'spec.json').read_text(encoding='utf-8'))


def save(d, spec):
    (d / 'spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


# ---- images ---------------------------------------------------------------------------------------------------
def on_magenta(im):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, MAG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def keyframe(spec, name):
    """A keyframe as a padded magenta square (the clip canvas): 'rest' or spec['keys'][name] = {file, cell:[i,cols,rows]}."""
    k = {'file': spec['rest']} if name == 'rest' else spec['keys'][name]
    if k.get('canvas'):   # a keyframe kept as its clip-canvas image (its source sheet has since been replaced)
        return Image.open(ROOT / k['file']).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    im = Image.open(ROOT / k['file']).convert('RGBA')
    if 'cell' in k:
        i, cols, rows = k['cell']
        cw, ch = im.width // cols, im.height // rows
        im = im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch))
    if 'sheet_scale' in k:
        # A cell of an approved forms.json sheet drawn at its own scale: the game grows its box about (0.5, footY), so a cell
        # pixel (u, v) sits at idle-cell (-g/2 + u*s, -g*foot + v*s), g = s-1. Put it on the padded clip canvas the same way.
        s, foot = k['sheet_scale'], k.get('sheet_foot', .94)
        pad = spec.get('pad', 1.0); n = round(CELL * pad); off_y = n - CELL - round((n - CELL) * .15)
        size = round(CELL * s); cell = im.resize((size, size), Image.LANCZOS)
        canvas = Image.new('RGBA', (n, n), (0, 0, 0, 0))
        canvas.alpha_composite(cell, (round((n - CELL) * spec.get('originX', .5) - (s - 1) * .5 * CELL), round(off_y - (s - 1) * foot * CELL)))
        return on_magenta(canvas).resize((SIZE, SIZE), Image.LANCZOS)
    im = im.resize((CELL, CELL), Image.LANCZOS) if im.size != (CELL, CELL) and 'cell' not in k else im
    pad = spec.get('pad', 1.0)
    if 'cell' in k and k.get('padded'):
        pad = 1.0   # an already padded clip-route sheet
    n = round(im.width * pad)
    canvas = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    canvas.alpha_composite(im, (round((n - im.width) * spec.get('originX', .5)), n - im.height - round((n - im.height) * .15)))
    return on_magenta(canvas).resize((SIZE, SIZE), Image.LANCZOS)


def mask(rgb):
    a = np.asarray(rgb).astype(int)
    return ~((a[..., 0] > 190) & (a[..., 2] > 190) & (a[..., 1] < 80))


def area(rgb):
    a = np.asarray(rgb).astype(int)
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / (mx + 1)
    return int((mask(rgb) & ~((sat < .18) & (mx > 110))).sum())


def back_boot(rgb):
    """The soles' line and the back boot's outer (left) edge: the planted foot that anchors a pose (steel left out)."""
    a = np.asarray(rgb).astype(int)
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / (mx + 1)
    m = mask(rgb) & ~((sat < .25) & (mx > 110)) & (mx < 200)   # boots are dark or gold, the cream tail tip is not
    ys, xs = np.where(m)
    yb = int(np.percentile(ys, 99.5))
    low = ys > yb - 22
    return yb, float(np.percentile(xs[low], 2))


def boots(rgb):
    """Back boot's outer edge and the soles' line: steel (a blade on the ground) left out."""
    a = np.asarray(rgb).astype(int)
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / (mx + 1)
    ys, xs = np.where(mask(rgb) & ~((sat < .25) & (mx > 110)))
    yb = int(np.percentile(ys, 99.5))
    low = ys > yb - 30
    return yb, float(np.median(xs[low]))


def key_magenta(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, b), 1)
    chroma = np.clip((np.minimum(r, b) - g) / mx, 0, 1)
    hue_ok = np.abs(r - b) < .45 * mx
    m = np.where(hue_ok, chroma, 0)
    alpha = np.clip(1 - (m - .30) / .25, 0, 1)
    spill = np.clip(np.minimum(r, b) - g, 0, None) * (1 - alpha) * hue_ok
    out = a.copy(); out[..., 0] -= spill; out[..., 2] -= spill
    return Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')


def contact(frames, path, cols=10, cell=200, labels=None):
    rows = (len(frames) + cols - 1) // cols
    o = Image.new('RGB', (cols * cell, rows * cell), (40, 36, 48))
    d = ImageDraw.Draw(o)
    for i, f in enumerate(frames):
        im = f.convert('RGBA').resize((cell, cell), Image.LANCZOS)
        bg = Image.new('RGBA', (cell, cell), (40, 36, 48, 255)); bg.alpha_composite(im)
        o.paste(bg.convert('RGB'), ((i % cols) * cell, (i // cols) * cell))
        d.text(((i % cols) * cell + 4, (i // cols) * cell + 3), str(labels[i] if labels else i), fill='white')
    o.save(path, quality=86)


# ---- 2. clips ---------------------------------------------------------------------------------------------------
def wan(start, end, prompt, prefix, seed, length):
    w = {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors', 'weight_dtype': 'default'}},
        '3': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors', 'strength_model': 1.0}},
        '4': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['2', 0], 'lora_name': 'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors', 'strength_model': 1.0}},
        '5': {'class_type': 'ModelSamplingSD3', 'inputs': {'model': ['3', 0], 'shift': 5.0}},
        '6': {'class_type': 'ModelSamplingSD3', 'inputs': {'model': ['4', 0], 'shift': 5.0}},
        '7': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', 'type': 'wan'}},
        '8': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'wan_2.1_vae.safetensors'}},
        '9': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['7', 0], 'text': prompt}},
        '10': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['7', 0], 'text': NEG}},
        '11': {'class_type': 'LoadImage', 'inputs': {'image': start}},
        '12': {'class_type': 'WanFirstLastFrameToVideo', 'inputs': {'positive': ['9', 0], 'negative': ['10', 0], 'vae': ['8', 0],
               'width': SIZE, 'height': SIZE, 'length': length, 'batch_size': 1, 'start_image': ['11', 0]}},
        '13': {'class_type': 'KSamplerAdvanced', 'inputs': {'model': ['5', 0], 'add_noise': 'enable', 'noise_seed': seed, 'steps': 8, 'cfg': 1.0,
               'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['12', 0], 'negative': ['12', 1], 'latent_image': ['12', 2],
               'start_at_step': 0, 'end_at_step': 4, 'return_with_leftover_noise': 'enable'}},
        '14': {'class_type': 'KSamplerAdvanced', 'inputs': {'model': ['6', 0], 'add_noise': 'disable', 'noise_seed': seed, 'steps': 8, 'cfg': 1.0,
               'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['12', 0], 'negative': ['12', 1], 'latent_image': ['13', 0],
               'start_at_step': 4, 'end_at_step': 10000, 'return_with_leftover_noise': 'disable'}},
        '15': {'class_type': 'VAEDecode', 'inputs': {'samples': ['14', 0], 'vae': ['8', 0]}},
        '16': {'class_type': 'SaveImage', 'inputs': {'images': ['15', 0], 'filename_prefix': prefix}},
    }
    if end:
        w['17'] = {'class_type': 'LoadImage', 'inputs': {'image': end}}
        w['12']['inputs']['end_image'] = ['17', 0]
    return w


def cmd_clip(ref, seeds, only=None):
    import comfy_cloud as cc
    d, spec = load(ref)
    (d / 'keys').mkdir(exist_ok=True)
    names = {n for s in spec['segments'] for n in (s['start'], s.get('end')) if n}
    uploaded = {}
    for n in sorted(names):
        p = d / 'keys' / f'{n}.png'
        keyframe(spec, n).save(p)
        uploaded[n] = cc.upload(str(p))
    sem = threading.Semaphore(3)
    common = spec.get('style', '')

    def job(seg, seed):
        with sem:
            out = d / 'clip' / f"{seg['name']}-s{seed}"
            cc.run(wan(uploaded[seg['start']], uploaded.get(seg.get('end')), seg['prompt'] + ' ' + common, f"{seg['name']}-s{seed}", seed, seg['length']),
                   str(out), f"{seg['name']}-s{seed}")
            frames = sorted(out.glob('*-n16-*.png'))
            contact([Image.open(f) for f in frames[::2]], d / f"contact-{seg['name']}-s{seed}.jpg", labels=list(range(0, len(frames), 2)))

    ts = [threading.Thread(target=job, args=(s, sd)) for s in spec['segments'] if not only or s['name'] in only for sd in seeds]
    [t.start() for t in ts]
    [t.join() for t in ts]


def clip_frame(d, seg, seed, k):
    return Image.open(sorted((d / 'clip' / f'{seg}-s{seed}').glob('*-n16-*.png'))[k]).convert('RGB')


def loop_pairs(ref, seg, seed, lo, hi, span):
    """Frames i<j (lo<=i, j<=hi, j-i in span) that look alike: where a walk or run cycle closes."""
    d, _ = load(ref)
    fr = [np.asarray(clip_frame(d, seg, seed, k).resize((128, 128))).astype(np.float32) for k in range(lo, hi + 1)]
    out = []
    for i in range(len(fr)):
        for j in range(i + span[0], min(len(fr), i + span[1] + 1)):
            out.append((float(np.abs(fr[i] - fr[j]).mean()), lo + i, lo + j))
    return sorted(out)[:8]


# ---- 3/5. picking, sharpening, assembling -------------------------------------------------------------------------
def picks(d, spec):
    """spec['pick']: [segment, seed, clip frame] or ['key', name] (a keyframe itself, e.g. the resting frame as the last)."""
    return [keyframe(spec, p[1]) if p[0] == 'key' else clip_frame(d, p[0], p[1], p[2]) for p in spec['pick']]


def zoom_box(fr):
    """The union of the bodies in a sheet's frames (clip canvas px), with a margin, shaped 3:4 for the paired redraw."""
    ys, xs = [], []
    from scipy import ndimage
    for f in fr:
        a = np.asarray(f).astype(int)
        body = ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))      # off-magenta (clip edges drift a little)
        body = ndimage.binary_opening(body, iterations=2)
        lab, n = ndimage.label(body)
        if not n:
            continue
        sizes = np.bincount(lab.ravel()); sizes[0] = 0
        keep = np.isin(lab, np.where(sizes > max(400, sizes.max() * .02))[0])
        yy, xx = np.where(keep); ys += [yy.min(), yy.max()]; xs += [xx.min(), xx.max()]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = (x1 - x0) * 1.06 + 8, (y1 - y0) * 1.06 + 8
    w, h = max(w, h * .75), max(h, w / .75)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return [round(cx - w / 2), round(cy - h / 2), round(w), round(h)]


def hires(spec):
    return spec.get('pad', 1.0) >= 1.4


def out_cell(spec):
    """Stored cell: the body at the resting frame's resolution on a phone (384 px x pad), never under 512."""
    return max(CELL, min(1152, round(384 * spec.get('pad', 1.0))))


def cmd_soft(ref):
    d, spec = load(ref)
    fr = picks(d, spec)
    contact(fr, d / 'picked.jpg', cols=12)
    if hires(spec):        # two frames per Codex image, cropped to the bodies: each drawn at 768x1024
        box = spec.get('zoom_box_fixed') or zoom_box(fr); spec['zoom_box'] = box; save(d, spec)   # fixed: keep drawn pairs valid
        for f in d.glob('soft-*.png'):
            f.unlink()
        x, y, w, h = box
        for s in range(math.ceil(len(fr) / 2)):
            sh = Image.new('RGB', (1536, 1024), MAG)
            for i, f in enumerate(fr[s * 2:(s + 1) * 2]):
                c = Image.new('RGB', (w, h), MAG); c.paste(f, (-x, -y))
                sh.paste(c.resize((768, 1024), Image.LANCZOS), (i * 768, 0))
            sh.save(d / f'soft-{s}.png')
        return
    for s in range(math.ceil(len(fr) / 6)):
        sh = Image.new('RGB', (3 * CELL, 2 * CELL), MAG)
        for i, f in enumerate(fr[s * 6:(s + 1) * 6]):
            sh.paste(f.resize((CELL, CELL), Image.LANCZOS), ((i % 3) * CELL, (i // 3) * CELL))
        sh.save(d / f'soft-{s}.png')


SHARPEN = (ROOT / 'assets/heroes/clip_sharpen_prompt.txt')
PAIR = (ROOT / 'assets/heroes/clip_sharpen_pair_prompt.txt')


def cmd_sharpen(ref, sheets=None, model='gpt-6.1-sol', effort='low'):
    d, spec = load(ref)
    ref_img = d / 'keys' / 'rest.png'
    n = len(list(d.glob('soft-*.png')))
    sys.stdout.reconfigure(line_buffering=True)
    prompt = PAIR if hires(spec) else SHARPEN
    if spec.get('sharpen_note'):      # a spec's own extra rule for its frames (hands on a shaft, a held weapon)
        prompt = d / 'sharpen-prompt.txt'
        prompt.write_text((PAIR if hires(spec) else SHARPEN).read_text(encoding='utf-8').rstrip() + chr(10) + spec['sharpen_note'] + chr(10), encoding='utf-8')
    for s in (sheets or range(n)):
        out = d / f'sharp-{s}.png'
        if not sheets and out.exists() and out.stat().st_mtime > (d / f'soft-{s}.png').stat().st_mtime:
            continue     # already drawn from this soft sheet (a resumed run)
        env = {**os.environ, 'IMAGEGEN_BACKEND': 'codex'}
        r = subprocess.run([sys.executable, str(IMAGEGEN), '--prompt-file', str(prompt), '--out', str(d / f'sharp-{s}.png'),
                            '--ref', str(d / f'soft-{s}.png'), '--ref', str(ref_img), '--model', model, '--effort', effort],
                           env=env, capture_output=True, text=True)
        g = json.loads((d / f'sharp-{s}.png.gen.json').read_text(encoding='utf-8')) if (d / f'sharp-{s}.png.gen.json').exists() else {}
        pre = g.get('precheck')
        print(f'sharp-{s}', r.returncode, g.get('backend'), pre.get('verdict') if isinstance(pre, dict) else pre,
              (pre.get('problems') if isinstance(pre, dict) else '') or '')


def cells(path, cols=3, rows=2):
    im = Image.open(path).convert('RGB')
    cw, ch = im.width // cols, im.height // rows
    return [im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)).resize((CELL, CELL), Image.LANCZOS)
            for i in range(cols * rows)]


def body_center(rgb):
    """The soles' line and the body's horizontal centre (steel left out): the anchor for poses whose feet move (a run)."""
    a = np.asarray(rgb).astype(int)
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / (mx + 1)
    ys, xs = np.where(mask(rgb) & ~((sat < .25) & (mx > 110)))
    return int(np.percentile(ys, 99.5)), float(np.median(xs))


def lock(sharp, soft, mode='boot'):
    """The sharpened cell put back on its clip frame: same body area (blades left out) and the same back boot
    (mode 'center': the body's centre, for runs whose feet keep moving)."""
    s = (area(sharp) / max(1, area(soft))) ** .5
    im = sharp.resize((round(sharp.width / s), round(sharp.height / s)), Image.LANCZOS)
    anchor = body_center if mode == 'center' else back_boot
    fy, fx = anchor(np.asarray(soft))
    gy, gx = anchor(np.asarray(im))
    canvas = Image.new('RGB', soft.size, MAG)
    canvas.paste(im, (round(fx - gx), round(fy - gy)))
    return canvas, s


def rest_cell(spec, size=None):
    """The resting frame itself in the sheet's (padded) cell, transparent: what the game's idle shows."""
    im = Image.open(ROOT / spec['rest']).convert('RGBA').resize((CELL, CELL), Image.LANCZOS)
    pad = spec.get('pad', 1.0); n = round(CELL * pad)
    canvas = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    canvas.alpha_composite(im, (round((n - CELL) * spec.get('originX', .5)), n - CELL - round((n - CELL) * .15)))
    return canvas.resize((size or CELL, size or CELL), Image.LANCZOS)


def is_rest(spec, p):
    """A pick that is the resting pose: the rest key, or a clip's own first/last frame where that clip starts/ends at rest."""
    if p[0] == 'key':
        return p[1] == 'rest'
    seg = next((s for s in spec['segments'] if s['name'] == p[0]), None)
    return bool(seg) and ((p[2] == 0 and seg['start'] == 'rest') or (p[2] == seg['length'] - 1 and seg.get('end') == 'rest'))


def shift_rgba(im, dx, dy):
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.alpha_composite(im, (round(dx), round(dy))); return out


def pose_xy(im):
    a = np.asarray(im.convert('RGBA')).astype(int); al = a[..., 3] > 128
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1); sat = (mx - mn) / (mx + 1)
    ys, xs = np.where(al & ~((sat < .25) & (mx > 110)))
    return float(np.median(xs)), float(np.percentile(ys, 99.5))


def smooth_junctions(spec, keyed):
    """Clip frames drift a little from the keyframes they run between: spread each junction's offset over the clip frames
    so nothing jumps at a key (owner 12/11: pops at keys, at the end back to rest)."""
    # In play order (spec order: in-betweens appended after the sheet's numbering was fixed), mapped back at the end.
    order = play_order(spec, len(keyed)); out = keyed
    keyed = [out[f] for f in order]; picks = [spec['pick'][f] for f in order]; n = len(keyed)
    anchor = [p[0] == 'key' or is_rest(spec, p) for p in picks]
    pos = [pose_xy(k) for k in keyed]
    i = 0
    while i < n:
        if anchor[i]:
            j = i + 1
            while j < n and not anchor[j]:
                j += 1
            run = list(range(i + 1, j))
            if run and j < n:
                a0 = (pos[i][0] - pos[run[0]][0], pos[i][1] - pos[run[0]][1])
                b0 = (pos[j][0] - pos[run[-1]][0], pos[j][1] - pos[run[-1]][1])
                for m, k in enumerate(run):
                    u = (m + 1) / (len(run) + 1)
                    dx = a0[0] * (1 - u) + b0[0] * u; dy = a0[1] * (1 - u) + b0[1] * u
                    if abs(dx) > 1 or abs(dy) > 1:
                        keyed[k] = shift_rgba(keyed[k], dx, dy)
            elif run and j >= n:    # clip frames after the last key: carry its offset, fading out
                a0 = (pos[i][0] - pos[run[0]][0], pos[i][1] - pos[run[0]][1])
                for m, k in enumerate(run):
                    u = 1 - m / len(run)
                    keyed[k] = shift_rgba(keyed[k], a0[0] * u, a0[1] * u)
            i = j
        else:
            i += 1
    for f, k in zip(order, keyed):
        out[f] = k
    return out



def even_size(spec, keyed):
    """A clip frame Codex drew bigger or smaller than its neighbours in play order (body area, steel left out, off by more than
    8%) is scaled about its feet to their mean (owner 12/11: a frame that swells for one beat)."""
    order = play_order(spec, len(keyed)); picks = spec['pick']
    def area(k):
        a = np.asarray(k).astype(int); al = a[..., 3] > 128; mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
        return int((al & ~(((mx - mn) / (mx + 1) < .25) & (mx > 110))).sum())
    ar = {f: area(keyed[f]) for f in order}
    for r in range(1, len(order) - 1):
        f = order[r]; p = picks[f]
        if p[0] == 'key' or is_rest(spec, p):
            continue
        want = (ar[order[r - 1]] + ar[order[r + 1]]) / 2; q = ar[f] / max(1, want)
        if abs(q - 1) <= .08:
            continue
        s = q ** -.5; k = keyed[f]; bb = k.getbbox(); fx, fy = (bb[0] + bb[2]) / 2, bb[3]
        im = k.resize((round(k.width * s), round(k.height * s)), Image.LANCZOS)
        out = Image.new('RGBA', k.size, (0, 0, 0, 0)); out.alpha_composite(im, (round(fx - fx * s), round(fy - fy * s)))
        keyed[f] = out; ar[f] = area(out)
        print(f'even_size: frame {f} x{s:.3f}')
    return keyed



def feet_lock(spec, keyed):
    """Planted feet: between two keyframes (play order) every clip frame moves sideways so the middle of its feet lies on the
    line between the keyframes' (owner 12/11: a clip creeps sideways, then snaps back onto the key)."""
    order = play_order(spec, len(keyed)); picks = spec['pick']
    def mid(k):
        a = np.asarray(k)[..., 3] > 128; ys, xs = np.where(a); yb = np.percentile(ys, 99.7); low = xs[ys > yb - k.height * .03]
        return (low.min() + low.max()) / 2
    m = [mid(keyed[f]) for f in order]
    anchor = [picks[f][0] == 'key' or is_rest(spec, picks[f]) for f in order]
    idx = [r for r, a in enumerate(anchor) if a]
    for r0, r1 in zip(idx, idx[1:]):
        for r in range(r0 + 1, r1):
            want = m[r0] + (m[r1] - m[r0]) * (r - r0) / (r1 - r0); dx = want - m[r]
            if abs(dx) > 2:
                keyed[order[r]] = shift_rgba(keyed[order[r]], dx, 0)
    return keyed



def write_chunks(sheet, out, cols, rows, budget=3.0e6):
    """A big sheet is also written in row bands (<out>.r<k>.webp, about 3 megapixels each) that the game draws instead: the
    browser decodes a whole picture before it can show any of it, and a 20-megapixel sheet stalled every strike's first
    frame by ~180 ms (owner 12/11; ~3x that on phones). Returns rows per band, or None when the sheet is small enough."""
    for f in out.parent.glob(out.stem + '.r*' + out.suffix):
        f.unlink()
    cw = sheet.width // cols
    per = max(1, int(budget // (cols * cw * cw)))
    if rows <= per:
        return None
    for k in range(math.ceil(rows / per)):
        band = sheet.crop((0, k * per * cw, sheet.width, min(rows, (k + 1) * per) * cw))
        band.save(out.parent / f'{out.stem}.r{k}{out.suffix}', quality=92, method=6)
    return per


def play_order(spec, n):
    """The frames in the order the game plays them: spec order, else the sheet's own numbering."""
    order = spec.get('order') or list(range(n))
    assert sorted(order) == list(range(n)), 'spec order must list every frame once'
    return order


def head_scale(rest, im):
    """How much bigger im draws the character than rest, by the head: the resting frame's head (ear tips to a third of the
    body down) matched at several scales (a raised arm or weapon must not change the measure, owner 12/11)."""
    import cv2
    def gray(x):
        a = np.asarray(x).astype(np.float32); g = a[..., :3].mean(-1); g[a[..., 3] < 128] = 128; return g.astype(np.uint8)
    from scipy import ndimage
    ra = np.asarray(rest).astype(int); al = ra[..., 3] > 128; ys, xs = np.where(al)
    h = np.percentile(ys, 99.5) - ys.min()
    # The face: the highest sizeable patch of skin (the top of the picture may be a raised weapon or tail tips).
    r, g, b = ra[..., 0], ra[..., 1], ra[..., 2]
    skin = al & (r > 225) & (g > 175) & (b > 145) & (r - b > 25) & (r - b < 110)
    lab, n = ndimage.label(ndimage.binary_opening(skin, iterations=1))
    blobs = [np.where(lab == i) for i in range(1, n + 1)]
    blobs = [bb for bb in blobs if len(bb[0]) > 120]
    face = min(blobs, key=lambda bb: bb[0].mean()) if blobs else None
    if face is None:
        return 1.0
    fy, fx = int(face[0].mean()), int(face[1].mean()); hw = int(h * .16)
    t0 = gray(rest)[max(0, fy - hw):fy + hw, max(0, fx - hw):fx + hw]
    g = gray(im); best = (-1, 1.0)
    for s in np.arange(.84, 1.17, .02):
        tt = cv2.resize(t0, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        if tt.shape[0] >= g.shape[0] or tt.shape[1] >= g.shape[1]:
            continue
        r = cv2.matchTemplate(g, tt, cv2.TM_CCOEFF_NORMED).max()
        if r > best[0]:
            best = (r, s)
    return best[1] if best[0] > .45 else 1.0


def fit_to_rest(rest, im):
    """A frame scaled and moved to overlap the resting frame's silhouette best (a hit reaction stays on its spot)."""
    a = np.asarray(rest)[..., 3] > 128; src = np.asarray(im)[..., 3] > 128; C = im.width; r = C / CELL
    best = (0, 1.0, 0, 0)
    hs = 1 / head_scale(rest, im)      # the size from the head; the silhouette only places it
    for s in (hs,):
        size = round(C * s); ms = np.asarray(Image.fromarray((src * 255).astype(np.uint8)).resize((size, size))) > 127
        step = max(1, round(3 * r)); lim = round(40 * r)
        for dy in range(-lim, lim + 1, step):
            for dx in range(-lim, lim + 1, step):
                x0, y0 = (C - size) // 2 + dx, (C - size) // 2 + dy
                b = np.zeros((C, C), bool)
                xs, ys = slice(max(0, x0), min(C, x0 + size)), slice(max(0, y0), min(C, y0 + size))
                b[ys, xs] = ms[ys.start - y0:ys.stop - y0, xs.start - x0:xs.stop - x0]
                iou = (a & b).sum() / max(1, (a | b).sum())
                if iou > best[0]:
                    best = (iou, s, dx, dy)
    _, s, dx, dy = best; size = round(C * s)
    out = Image.new('RGBA', (C, C), (0, 0, 0, 0)); out.alpha_composite(im.resize((size, size), Image.LANCZOS), ((C - size) // 2 + dx, (C - size) // 2 + dy))
    return out


def color_match(im, rest):
    """Brightness and saturation of the body brought to the resting frame's (owner 12/11: paler frames between states)."""
    a = np.asarray(im).astype(np.float32); r = np.asarray(rest).astype(np.float32)
    def stats(x):
        al = x[..., 3] > 200; rgb = x[..., :3]; mx, mn = rgb.max(-1), rgb.min(-1)
        return mx[al].mean(), ((mx - mn) / (mx + 1))[al].mean()
    (v, s), (rv, rs) = stats(a), stats(r)
    fv, fs = np.clip(rv / v, .9, 1.1), np.clip(rs / s, .85, 1.18)
    if abs(fv - 1) < .03 and abs(fs - 1) < .04:
        return im
    rgb = a[..., :3]; g = rgb.mean(-1, keepdims=True)
    rgb = (g + (rgb - g) * fs) * fv
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a[..., 3]]).astype(np.uint8), 'RGBA')


def match_keys(spec, keyed):
    """A keyframe taken from an older sheet can be drawn at another size than the clip frames around it: scale it (about its
    soles) to their body area, so nothing grows or shrinks at a key (owner 12/11)."""
    def ar(im):
        a = np.asarray(im).astype(int); al = a[..., 3] > 128; mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
        return int((al & ~(((mx - mn) / (mx + 1) < .25) & (mx > 110))).sum())
    picks = spec['pick']
    for i, p in enumerate(picks):
        if p[0] != 'key' or is_rest(spec, p):
            continue
        nb = [keyed[j] for j in (i - 1, i + 1) if 0 <= j < len(picks) and picks[j][0] != 'key']
        if not nb:
            continue
        r = ar(keyed[i]) / (sum(ar(x) for x in nb) / len(nb))
        if abs(r - 1) < .05:
            continue
        s = 1 / r ** .5; im = keyed[i]; W = im.width
        _, sole = pose_xy(im); cx, _ = pose_xy(im)
        big = im.resize((round(W * s), round(W * s)), Image.LANCZOS)
        if s > 1.02:   # grown: give back the edge the resampling softened
            from PIL import ImageFilter
            big = big.filter(ImageFilter.UnsharpMask(radius=1.4, percent=int(60 + 300 * (s - 1)), threshold=2))
        out = Image.new('RGBA', (W, W), (0, 0, 0, 0)); out.alpha_composite(big, (round(cx - cx * s), round(sole - sole * s)))
        keyed[i] = out
    return keyed


def cmd_assemble(ref):
    d, spec = load(ref)
    n = len(spec['pick'])
    CO = out_cell(spec)
    if hires(spec):
        pair = lambda p: [Image.open(p).convert('RGB').resize((1536, 1024), Image.LANCZOS).crop((i * 768, 0, i * 768 + 768, 1024)) for i in (0, 1)]
        soft = sum([pair(d / f'soft-{s}.png') for s in range(math.ceil(n / 2))], [])[:n]
        sharp = sum([pair(d / f'sharp-{s}.png') for s in range(math.ceil(n / 2))], [])[:n]
    else:
        soft = sum([cells(d / f'soft-{s}.png') for s in range(math.ceil(n / 6))], [])[:n]
        sharp = sum([cells(d / f'sharp-{s}.png') for s in range(math.ceil(n / 6))], [])[:n]
    keyed, report = [], []
    for i, (a, b) in enumerate(zip(soft, sharp)):
        im, s = lock(b, a, spec.get('lock', 'boot'))
        if hires(spec):        # the zoomed crop back onto the whole padded canvas, at the stored cell size
            x, y, w, h = spec['zoom_box']; k = CO / SIZE
            k_im = key_magenta(im).resize((round(w * k), round(h * k)), Image.LANCZOS)
            cell = Image.new('RGBA', (CO, CO), (0, 0, 0, 0)); cell.alpha_composite(k_im, (round(x * k), round(y * k)))
            keyed.append(cell)
        else:
            keyed.append(key_magenta(im))
        report.append(round(s, 3))
    # The resting pose is the resting frame itself (the idle shows it): same drawing, colour and sharpness at every switch.
    rest_img = rest_cell(spec, CO)
    for i, p in enumerate(spec['pick']):
        if is_rest(spec, p):
            keyed[i] = rest_img.copy()
    if spec.get('fit_rest'):           # a hit reaction: every frame on the resting frame's spot and size
        keyed = [k if is_rest(spec, p) else fit_to_rest(rest_img, k) for k, p in zip(keyed, spec['pick'])]
    elif spec.get('lock') != 'center':
        if spec.get('match_keys'):
            keyed = match_keys(spec, keyed)
        keyed = smooth_junctions(spec, keyed)
    if spec.get('even_size'):
        keyed = even_size(spec, keyed)
    if spec.get('feet_lock'):
        keyed = feet_lock(spec, keyed)
    # Every frame's boots on the resting frame's line and spot, unless the spec lets the feet travel.
    rest = np.asarray(keyframe(spec, 'rest').resize((CELL, CELL), Image.LANCZOS))
    ry, rx = back_boot(rest)
    # The clip's segments start and end on approved, game-placed poses with a locked camera, so a clip frame already stands
    # where it should: only a spec that asks for it (pin_feet) puts every back boot on the resting frame's spot.
    if spec.get('pin_feet'):
        for i, k in enumerate(keyed):
            gy, gx = back_boot(np.asarray(on_magenta(k)))
            dx, dy = round(rx - gx), round(ry - gy)
            if abs(dx) > 6 or abs(dy) > 4:
                m = Image.new('RGBA', k.size, (0, 0, 0, 0)); m.alpha_composite(k, (dx, dy)); keyed[i] = m
                report[i] = (report[i], dx, dy)
    keyed = [color_match(k, rest_img) if not is_rest(spec, p) else k for k, p in zip(keyed, spec['pick'])]
    # Frames the game jumps between with no step (spec same {"17": 6}: a second thrust starts from the guard it came back
    # to): one drawing, so the jump shows nothing (owner 12/11).
    for i, j in spec.get('same', {}).items():
        keyed[int(i)] = keyed[j].copy()
    cols = spec.get('cols', 6)
    rows = math.ceil(n / cols)
    sheet = Image.new('RGBA', (cols * CO, rows * CO), (0, 0, 0, 0))
    for i, k in enumerate(keyed):
        sheet.paste(k, ((i % cols) * CO, (i // cols) * CO))
    out = ROOT / spec['out']
    sheet.save(out, quality=92, method=6) if out.suffix == '.webp' else sheet.save(out)
    # A held pose's living loop (spec hold_lock {"frames": [first, last]}): Codex redraws each frame a little differently, so
    # the body would shimmer while it should stand still. Keep the first loop frame's body and take from the others only
    # what moves in the soft clip (hair, scarf, tail), feathered in.
    if spec.get('hold_lock'):
        from scipy import ndimage
        spans = spec['hold_lock']['frames']      # [first, last] or several: [[7, 12], [24, 31]]
        for a0, a1 in (spans if isinstance(spans[0], list) else [spans]):
          base = np.asarray(keyed[a0]).astype(np.float32)
          s0 = np.asarray(soft[a0]).astype(np.float32)
          for i in range(a0 + 1, a1 + 1):
            moved = np.abs(np.asarray(soft[i]).astype(np.float32) - s0).max(-1) > 40
            moved = ndimage.binary_opening(moved, iterations=2)
            moved = ndimage.binary_dilation(moved, iterations=10)
            m = ndimage.gaussian_filter(moved.astype(np.float32), 4)[..., None]
            keyed[i] = Image.fromarray((base * (1 - m) + np.asarray(keyed[i]).astype(np.float32) * m).clip(0, 255).astype(np.uint8), 'RGBA')
            report[i] = (report[i], 'hold', round(float(m.mean()), 3))
        sheet = Image.new('RGBA', (cols * CELL, rows * CELL), (0, 0, 0, 0))
        for i, k in enumerate(keyed):
            sheet.paste(k, ((i % cols) * CELL, (i // cols) * CELL))
        sheet.save(out, quality=92, method=6) if out.suffix == '.webp' else sheet.save(out)
    spec['chunkRows'] = write_chunks(sheet, out, cols, rows)
    contact(keyed, d / 'assembled.jpg', cols=12)
    heads = [head_anchor(k) for k in keyed]
    sockets = None
    if spec.get('sockets'):
        flips = set(spec.get('socket_flip', []))
        sockets = [blade_socket(k, i in flips) for i, k in enumerate(keyed)]
        for i, s in (spec.get('socket_fix') or {}).items():
            sockets[int(i)] = s
        socket_check(keyed, sockets, d / 'sockets-check.jpg')
        missing = [i for i, s in enumerate(sockets) if not s]
        if missing:
            raise SystemExit(f'no blade found in frames {missing}: add socket_fix')
    # A keyframe redrawn after the grips were approved (spec grip_measure): its grip measured on the drawing (the blade's
    # guard end and direction, 512 px cell, 0 = right), an anchor for the in-betweens. Kept keys print theirs to compare.
    if spec.get('grip_measure'):
        def grip_of(k):
            s = blade_socket(k); return [s[0] * 2, s[1] * 2, s[2] - 90] if s else None
        spec['_grip_measured'] = {f: grip_of(keyed[f]) for f in spec['grip_measure']}
        print('grip_measure', spec['_grip_measured'], 'check', {f: grip_of(keyed[f]) for f in spec.get('gripKeys', [])[:3]})
    # Frames whose blade direction only is measured on the drawing (spec grip_angle), the grip point staying on the approved
    # table: a staged weapon that turns with the shown frame then turns exactly as the drawn blade does.
    if spec.get('grip_angle'):
        spec['_grip_angle'] = {f: (s[2] - 90 if s else None) for f, s in ((f, blade_socket(keyed[f])) for f in spec['grip_angle'])}
        print('grip_angle', spec['_grip_angle'])
    # A run whose body leans ahead of its feet line (spec plaza_feet): the plaza stands the sheet on the middle of its feet
    # through the cycle (feetX), so going from rest to running or turning round does not shift her sideways.
    if spec.get('plaza_feet') and spec.get('loop'):
        def mid(k):
            a = np.asarray(k)[..., 3] > 128; ys, xs = np.where(a); yb = np.percentile(ys, 99.7); low = xs[ys > yb - k.height * .03]
            return (low.min() + low.max()) / 2 / k.width
        a, b = spec['loop']; spec['_feetX'] = round(float(np.mean([mid(keyed[f]) for f in range(a, b + 1)])), 4)
        print('feetX', spec['_feetX'])
    write_meta(spec, cols, rows, n, heads, sockets)
    print('assembled', out.relative_to(ROOT), f'{cols}x{rows}', 'scale/shift', report)
    print('sockets', sockets)


# ---- sockets and heads ---------------------------------------------------------------------------------------------
def blade_socket(rgba, flip=False):
    """[x, y, angle] of a straight blade in 256px cell units, angle clockwise from up (MIKA_SWORD_SOCKETS' format).
    The blade is the longest thin run of steel; its guard end is the end with more dark glove/hilt pixels around it."""
    from scipy import ndimage
    a = np.asarray(rgba.convert('RGBA')).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / (mx + 1)
    steel = (alpha > 128) & (sat < .22) & (mx > 120) & (rgb[..., 2] >= rgb[..., 0] - 12)
    lab, n = ndimage.label(steel, structure=np.ones((3, 3)))
    best = None
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(xs) < 40:
            continue
        pts = np.stack([xs, ys], 1).astype(np.float32); c = pts.mean(0)
        _, s, vt = np.linalg.svd(pts - c, full_matrices=False); d = vt[0]; pr = (pts - c) @ d
        score = (pr.max() - pr.min()) * (1 - min(s[1] / max(s[0], 1e-6) * 3, .9))
        if best is None or score > best[0]:
            best = (score, c, d, pr.min(), pr.max())
    if best is None:
        return None
    _, c, d, lo, hi = best
    e1, e2 = c + d * lo, c + d * hi
    dark = (alpha > 128) & (mx < 70)
    def near(e):
        x, y = int(e[0]), int(e[1]); return dark[max(0, y - 14):y + 15, max(0, x - 14):x + 15].sum()
    guard, tip = (e1, e2) if near(e1) >= near(e2) else (e2, e1)
    if flip:   # a blade held upright: the dark hilt test can pick the wrong end (spec socket_flip)
        guard, tip = tip, guard
    v = tip - guard
    k = 256 / rgba.width
    return [round(float(guard[0]) * k), round(float(guard[1]) * k), round(float(np.degrees(np.arctan2(v[0], -v[1]))))]


def head_anchor(rgba):
    """The head HUD's anchor in 256px units: centre of the highest body pixels (steel left out), a little below the top."""
    a = np.asarray(rgba.convert('RGBA')).astype(int)
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    sat = (mx - mn) / (mx + 1)
    ys, xs = np.where((a[..., 3] > 128) & ~((sat < .22) & (mx > 120)))
    y0 = ys.min(); band = ys < y0 + 24
    k = 256 / rgba.width
    return [round(float(np.median(xs[band])) * k), round(float(y0 + 14) * k)]


def socket_check(frames, sockets, path):
    out = []
    for f, s in zip(frames, sockets):
        bg = Image.new('RGBA', f.size, (40, 36, 48, 255)); bg.alpha_composite(f.convert('RGBA')); d = ImageDraw.Draw(bg)
        if s:
            x, y, ang = s[0] * 2, s[1] * 2, s[2]
            d.line([(x, y), (x + 160 * math.sin(math.radians(ang)), y - 160 * math.cos(math.radians(ang)))], fill=(0, 255, 255, 255), width=5)
            d.ellipse([x - 9, y - 9, x + 9, y + 9], outline=(255, 255, 0, 255), width=4)
        out.append(bg)
    contact(out, path, cols=12, cell=220)


def convert_grips(spec):
    """The approved skill sheet's grips (x, y in its 512 cell, angle) moved onto the clip sheet's padded cell at the keyframes
    (gripKeys), linearly interpolated for the in-between frames."""
    so, sn, ox = spec['legacy_scale'], spec['scale'], spec.get('originX', .5)
    fn = spec['footY']
    def conv(g):
        X = -(so - 1) * .5 + g[0] / CELL * so; Y = -(so - 1) * .94 + g[1] / CELL * so
        return [round((X + (sn - 1) * ox) / sn * CELL, 1), round((Y + (sn - 1) * fn) / sn * CELL, 1), g[2]]
    keys = spec['gripKeys']; n = len(spec['pick'])
    rank = {f: r for r, f in enumerate(play_order(spec, n))}   # interpolated along the play order
    at = {rank[f]: conv(g) for f, g in zip(keys, spec['legacy_grips'])}
    for f, g in (spec.get('_grip_measured') or {}).items():
        if g:
            at[rank[f]] = g
    out = []
    for f in range(n):
        i = rank[f]
        if i in at:
            out.append(at[i]); continue
        lo = max([r for r in at if r < i], default=None); hi = min([r for r in at if r > i], default=None)
        if lo is None or hi is None:
            out.append(at[lo if hi is None else hi]); continue
        u = (i - lo) / (hi - lo); a, b = at[lo], at[hi]
        out.append([round(a[0] + (b[0] - a[0]) * u, 1), round(a[1] + (b[1] - a[1]) * u, 1), round(a[2] + (b[2] - a[2]) * u, 1)])
    for f, kf in (spec.get('grip_same') or {}).items():   # appended frames (a lead-in) take a keyframe's grip
        out[int(f)] = out[kf]
    for f, a in (spec.get('_grip_angle') or {}).items():
        if a is not None:   # the hilt test can pick the tip of a blade held level: keep the end nearer the table's direction
            a = min((a, a + 180, a - 180, a + 360, a - 360), key=lambda v: abs(v - out[f][2]))
            out[f] = [out[f][0], out[f][1], round(a, 1)]
    return out


def write_meta(spec, cols, rows, n, heads, sockets):
    extra = {k: spec[k] for k in ('clock', 'roles', 'rolesBack', 'gripKeys', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'recoil') if spec.get(k) is not None}
    if spec.get('legacy_grips'):
        extra['grips'] = convert_grips(spec)
    if sockets:
        extra['sockets'] = sockets
    if spec.get('_feetX') is not None:
        extra['feetX'] = spec['_feetX']
    if spec.get('meta'):        # form 1: assets/reimagined/heroes/<hero>/<action>/runtime-meta.json
        p = ROOT / spec['meta']; m = json.loads(p.read_text(encoding='utf-8'))
        for k in ('frameFiles', 'framePixelHashes', 'uniqueFrames', 'sourceSha256', 'qc', 'recoveredGridCrossings', 'originalAnchorYStd',
                  'clock', 'roles', 'sockets', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'recoil'):
            m.pop(k, None)
        m.update(columns=cols, rows=rows, frames=n, frameWidth=CELL // 2, frameHeight=CELL // 2, frameDuration=spec.get('frameDuration', 40),
                 headAnchors=heads, source=folder_of(spec).relative_to(ROOT).as_posix() + '/spec.json', **extra)
        p.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if spec.get('forms'):       # forms 2-3: assets/heroes/forms/<hero>/forms.json [form, action]
        p = ROOT / 'assets/heroes/forms' / spec['hero'] / 'forms.json'; m = json.loads(p.read_text(encoding='utf-8'))
        form, action = spec['forms']
        e = {k: v for k, v in m['forms'][form]['actions'].get(action, {}).items() if k not in ('clock', 'roles', 'rolesBack', 'gripKeys', 'grips', 'sockets', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'note', 'feetX', 'recoil')}
        e.update(file=spec['out'], cols=cols, rows=rows, count=n, heads=heads, frameDuration=spec.get('frameDuration', 40), **extra)
        if spec.get('scale'):
            e['scale'] = spec['scale']
        if spec.get('footY'):
            e['footY'] = spec['footY']
            # footY is the pivot the game grows the padded cell about (feet then land on the resting feet); the feet themselves
            # stand at feetY of the cell, what the plaza places on the ground.
            n = round(CELL * spec['pad']); off = n - CELL - round((n - CELL) * .15)
            e['feetY'] = round((off + .94 * CELL) / n, 4)
        if 'originX' in spec:
            e['originX'] = spec['originX']
        m['forms'][form]['actions'][action] = e
        for other in spec.get('also_actions', []):   # another action played on the same sheet (six-star Mika's dash = run)
            m['forms'][form]['actions'][other] = dict(e)
        p.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


# ---- reviews (Codex, read-only) ----------------------------------------------------------------------------------
def cmd_review(ref, stage, images, ask, effort='medium'):
    d, spec = load(ref)
    prompt = (f"Gemwoven (Codex) — REVIEW bước '{stage}' cho hoạt ảnh {ref} (route clip ComfyUI). Read-only. Tiếng Việt, ngắn gọn.\n"
              f"Spec (mô tả, khung mốc, nhịp trong game):\n{json.dumps({k: spec[k] for k in spec if k not in ('pick',)}, ensure_ascii=False)[:6000]}\n\n"
              f"Ảnh đính kèm: {', '.join(Path(i).name for i in images)}.\n{ask}\n"
              "Trả lời: các lỗi cụ thể (khung số mấy, bộ phận nào), đề xuất sửa, điểm /10 và kết luận DUYỆT (>= 8) hoặc LÀM LẠI.")
    (d / f'review-{stage}-prompt.md').write_text(prompt, encoding='utf-8')
    import shutil
    args = [shutil.which('codex') or 'codex', 'exec', '-m', 'gpt-6.1-sol', '-c', f'model_reasoning_effort={effort}', '-s', 'read-only', '--skip-git-repo-check',
            '-o', str(d / f'review-{stage}.md')]
    for i in images:
        args += ['-i', str(i)]
    args.append('-')
    r = subprocess.run(args, input=prompt, capture_output=True, text=True, encoding='utf-8', cwd=ROOT,
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    out = (d / f'review-{stage}.md')
    print(out.read_text(encoding='utf-8') if out.exists() else r.stderr[-2000:])


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd'); ap.add_argument('ref')
    ap.add_argument('--seeds', default='7'); ap.add_argument('--only', default='')
    ap.add_argument('--stage', default='spec'); ap.add_argument('--images', default=''); ap.add_argument('--ask', default='')
    ap.add_argument('--sheets', default='')
    a = ap.parse_args()
    if a.cmd == 'clip':
        cmd_clip(a.ref, [int(s) for s in a.seeds.split(',')], [s for s in a.only.split(',') if s])
    elif a.cmd == 'soft':
        cmd_soft(a.ref)
    elif a.cmd == 'sharpen':
        cmd_sharpen(a.ref, [int(s) for s in a.sheets.split(',') if s] or None)
    elif a.cmd == 'assemble':
        cmd_assemble(a.ref)
    elif a.cmd == 'review':
        cmd_review(a.ref, a.stage, [p for p in a.images.split(',') if p], a.ask)
    else:
        raise SystemExit('unknown command')
