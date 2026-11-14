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
GREEN = False   # spec "bg": "green": a hero dressed in purple/violet (Lumi) runs the whole route on a #00FF00 background


def set_bg(spec):
    global MAG, GREEN
    GREEN = spec.get('bg') == 'green'
    MAG = (0, 255, 0) if GREEN else (255, 0, 255)
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
    spec = json.loads((d / 'spec.json').read_text(encoding='utf-8'))
    set_bg(spec)
    return d, spec


def save(d, spec):
    (d / 'spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


# ---- images ---------------------------------------------------------------------------------------------------
def on_magenta(im):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, MAG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def put(canvas, im, x, y):
    """im alpha-composited at (x, y), parts outside the canvas (negative offsets too) cut off."""
    x0, y0 = max(0, -x), max(0, -y)
    part = im.crop((x0, y0, min(im.width, canvas.width - x), min(im.height, canvas.height - y)))
    if part.width > 0 and part.height > 0:
        canvas.alpha_composite(part, (x + x0, y + y0))
    return canvas


def sheet_fit(rest, cell):
    """[scale, dx, dy]: how an older sheet's resting cell (512 px) lies on the resting frame (512 px), best silhouette overlap."""
    a = np.asarray(rest.convert('RGBA').resize((CELL, CELL)))[..., 3] > 100
    best = (0, 1, 0, 0)
    for s in np.arange(.70, 1.42, .02):
        size = round(CELL * s); m = np.asarray(cell.convert('RGBA').resize((size, size)))[..., 3] > 100
        for dy in range(-60, 61, 4):
            for dx in range(-60, 61, 4):
                b = np.zeros((CELL, CELL), bool); x, y = round((CELL - size) / 2 + dx), round((CELL - size) / 2 + dy)
                xs, ys = slice(max(0, x), min(CELL, x + size)), slice(max(0, y), min(CELL, y + size))
                b[ys, xs] = m[ys.start - y:ys.stop - y, xs.start - x:xs.stop - x]
                iou = (a & b).sum() / max(1, (a | b).sum())
                if iou > best[0]:
                    best = (iou, s, dx, dy)
    # refine by single pixels
    _, s0, dx0, dy0 = best
    for s in np.arange(s0 - .02, s0 + .021, .005):
        size = round(CELL * s); m = np.asarray(cell.convert('RGBA').resize((size, size)))[..., 3] > 100
        for dy in range(dy0 - 4, dy0 + 5):
            for dx in range(dx0 - 4, dx0 + 5):
                b = np.zeros((CELL, CELL), bool); x, y = round((CELL - size) / 2 + dx), round((CELL - size) / 2 + dy)
                xs, ys = slice(max(0, x), min(CELL, x + size)), slice(max(0, y), min(CELL, y + size))
                b[ys, xs] = m[ys.start - y:ys.stop - y, xs.start - x:xs.stop - x]
                iou = (a & b).sum() / max(1, (a | b).sum())
                if iou > best[0]:
                    best = (iou, s, dx, dy)
    return [round(float(best[1]), 3), int(best[2]), int(best[3])], round(float(best[0]), 3)


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
    if 'fit' in k:
        # A cell of an older sheet placed on the resting frame the way its own resting cell overlaps the resting frame best
        # (sheet_fit: [scale, dx, dy] in the 512 px resting frame), then padded like the resting frame.
        s, dx, dy = k['fit']
        im = im.resize((CELL, CELL), Image.LANCZOS)
        size = round(CELL * s); cell = im.resize((size, size), Image.LANCZOS)
        pad = spec.get('pad', 1.0); n = round(CELL * pad)
        # the cell's own content may reach past the 512 frame (a raised weapon): place the uncropped cell on the padded canvas
        ox, oy = round((n - CELL) * spec.get('originX', .5)), n - CELL - round((n - CELL) * .15)
        canvas = put(Image.new('RGBA', (n, n), (0, 0, 0, 0)), cell, ox + round((CELL - size) / 2 + dx), oy + round((CELL - size) / 2 + dy))
        return on_magenta(canvas).resize((SIZE, SIZE), Image.LANCZOS)
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
    if GREEN:   # green clearly above red and blue (Wan darkens the screen green toward a clip's end)
        return ~((a[..., 1] > 100) & (a[..., 1] - np.maximum(a[..., 0], a[..., 2]) > 70))
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
    if GREEN:   # green screen: chroma of green over the larger of red and blue; spill pulled down to that
        mx = np.maximum(g, 1); chroma = np.clip((g - np.maximum(r, b)) / mx, 0, 1)
        alpha = np.clip(1 - (chroma - .30) / .25, 0, 1)
        spill = np.clip(g - np.maximum(r, b), 0, None) * (1 - alpha)
        # Solid pixels on the cut edge keep a green cast (14/11, Codex: green dots round Lumi's hollow staff ring): within 3 px
        # of the background, green above red/blue is pulled down to them (a green ribbon inside the body is left alone).
        from scipy import ndimage
        edge = ndimage.binary_dilation(alpha < .5, iterations=3)
        spill = np.where(edge, np.clip(g - np.maximum(r, b), 0, None) * .9, spill)
        out = a.copy(); out[..., 1] -= spill
        return Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
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
        # Frozen at once: a key cut from an older sheet becomes its clip-canvas image, since assembling replaces that sheet
        # (12/11: a later clip from the replaced sheet's cell drew a grid of tiny frames).
        k = spec.get('keys', {}).get(n)
        if k and not k.get('canvas') and ('cell' in k or 'fit' in k or 'sheet_scale' in k):
            spec['keys'][n] = {'file': p.relative_to(ROOT).as_posix(), 'canvas': True, 'from': {kk: k[kk] for kk in ('file', 'cell', 'fit', 'sheet_scale') if kk in k}, 'note': k.get('note', '')}
    save(d, spec)
    sem = threading.Semaphore(3)
    common = spec.get('style', '')

    def job(seg, seed):
        with sem:
            out = d / 'clip' / f"{seg['name']}-s{seed}"
            # a re-made segment replaces its old take: a shorter new clip left the old one's last frames behind (13/11)
            for old in out.glob('*-n16-*.png'):
                old.unlink()
            cc.run(wan(uploaded[seg['start']], uploaded.get(seg.get('end')), seg['prompt'] + ' ' + common, f"{seg['name']}-s{seed}", seed, seg['length']),
                   str(out), f"{seg['name']}-s{seed}")
            frames = sorted(out.glob('*-n16-*.png'))
            contact([Image.open(f) for f in frames[::2]], d / f"contact-{seg['name']}-s{seed}.jpg", labels=list(range(0, len(frames), 2)))

    ts = [threading.Thread(target=job, args=(s, sd)) for s in spec['segments'] if not only or s['name'] in only for sd in seeds]
    [t.start() for t in ts]
    [t.join() for t in ts]


def qwen_edit(image, prompt, prefix, seed):
    """Qwen Image Edit 2511 (Lightning 4 steps + Consistency LoRA): one pose change on the same character (a hit recoil, a
    stomp), the picture's size kept. Used for keyframes the old sheets never drew."""
    return {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'qwen_image_edit_2511_fp8mixed.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors', 'strength_model': 1.0}},
        '20': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['2', 0], 'lora_name': 'Qwen-Image-Edit-2511_Consistency.safetensors', 'strength_model': 1.0}},
        '3': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['20', 0], 'shift': 3.0}},
        '4': {'class_type': 'CFGNorm', 'inputs': {'model': ['3', 0], 'strength': 1.0}},
        '5': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_2.5_vl_7b_fp8_scaled.safetensors', 'type': 'qwen_image'}},
        '6': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'qwen_image_vae.safetensors'}},
        '7': {'class_type': 'LoadImage', 'inputs': {'image': image}},
        '8': {'class_type': 'TextEncodeQwenImageEditPlus', 'inputs': {'clip': ['5', 0], 'prompt': prompt, 'vae': ['6', 0], 'image1': ['7', 0]}},
        '9': {'class_type': 'TextEncodeQwenImageEditPlus', 'inputs': {'clip': ['5', 0], 'prompt': '', 'vae': ['6', 0], 'image1': ['7', 0]}},
        '10': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['7', 0], 'vae': ['6', 0]}},
        '11': {'class_type': 'KSampler', 'inputs': {'model': ['4', 0], 'seed': seed, 'steps': 4, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple',
               'positive': ['8', 0], 'negative': ['9', 0], 'latent_image': ['10', 0], 'denoise': 1.0}},
        '12': {'class_type': 'VAEDecode', 'inputs': {'samples': ['11', 0], 'vae': ['6', 0]}},
        '13': {'class_type': 'SaveImage', 'inputs': {'images': ['12', 0], 'filename_prefix': prefix}},
    }


def cmd_edit(ref, name, seeds):
    """A new keyframe drawn by Qwen Edit from the resting frame (spec edits.<name>: prompt): keys/<name>-s<seed>.png at 512 px
    (unpadded, like the resting frame), plus a contact sheet; the chosen take is copied to keys/<name>-src.png."""
    import comfy_cloud as cc
    d, spec = load(ref)
    (d / 'keys').mkdir(exist_ok=True)
    src = d / 'keys' / 'edit-src.png'
    # The body cropped square with a margin (a small body in a big frame makes Qwen zoom in and reframe), edited at 1024 px,
    # then put back on the same box of the 512 px frame.
    rest = Image.open(ROOT / spec['rest']).convert('RGBA').resize((CELL, CELL), Image.LANCZOS)
    x0, y0, x1, y1 = rest.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    side = round(max(x1 - x0, y1 - y0) * 1.22); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box = (round(cx - side / 2), round(cy - side / 2), round(cx - side / 2) + side, round(cy - side / 2) + side)
    crop = put(Image.new('RGBA', (side, side), (0, 0, 0, 0)), rest, -box[0], -box[1])
    on_magenta(crop).resize((1024, 1024), Image.LANCZOS).save(src)
    up = cc.upload(str(src)); prompt = spec['edits'][name]
    def job(seed):
        out = d / 'clip' / f'edit-{name}-s{seed}'
        cc.run(qwen_edit(up, prompt, f'edit-{name}-s{seed}', seed), str(out), f'edit-{name}-s{seed}')
        f = sorted(out.glob('*.png'))[0]
        back = key_magenta(Image.open(f).convert('RGB').resize((side, side), Image.LANCZOS))
        on_magenta(put(Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)), back, box[0], box[1])).save(d / 'keys' / f'{name}-s{seed}.png')
    ts = [threading.Thread(target=job, args=(s,)) for s in seeds]
    [t.start() for t in ts]; [t.join() for t in ts]
    contact([Image.open(src)] + [Image.open(d / 'keys' / f'{name}-s{s}.png') for s in seeds], d / f'edit-{name}.jpg', cols=len(seeds) + 1, cell=320,
            labels=['rest'] + [f's{s}' for s in seeds])


def cmd_placekey(ref, name, raw, dx=0.0, mult=1.0):
    """A key pose Codex drew (magenta background, any size) put on the clip canvas: scaled so its head matches the resting
    frame's (head_scale), soles on the resting soles' line, body centre on the resting body's centre (+dx of the canvas).
    Writes keys/<name>-src.png (clip canvas, 768) and registers spec keys.<name> as a canvas key."""
    d, spec = load(ref)
    rest = Image.open(ROOT / spec['rest']).convert('RGBA').resize((CELL, CELL), Image.LANCZOS)
    n = round(CELL * spec.get('pad', 1.0)); off_y = n - CELL - round((n - CELL) * .15); off_x = round((n - CELL) * spec.get('originX', .5))
    im = key_magenta(Image.open(raw)); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    rb = rest.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    s = (rb[3] - rb[1]) / im.height
    for _ in range(4):
        t = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        k = head_scale(rest, t); s /= k
        if abs(k - 1) < .021:
            break
    s *= mult   # set by eye when the head match misses (a pale face: Yuki)
    t = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    rx, ry = pose_xy(rest); tx, ty = pose_xy(t)
    canvas = put(Image.new('RGBA', (n, n), (0, 0, 0, 0)), t, round(off_x + rx - tx + dx * n), round(off_y + ry - ty))
    out = d / 'keys' / f'{name}-src.png'
    on_magenta(canvas).resize((SIZE, SIZE), Image.LANCZOS).save(out)
    spec.setdefault('keys', {})[name] = {'file': out.relative_to(ROOT).as_posix(), 'canvas': True, 'note': f'tư thế Codex vẽ ({Path(raw).name}), đặt theo cỡ đầu khung nghỉ'}
    save(d, spec)
    print('placed', name, 'scale', round(s, 3), 'size', t.size)


LIVE = (" holds this pose steadily, the body and the weapon staying still; only the hair, ears, scarf, cape and loose cloth keep "
        "moving gently with natural follow-through, then everything settles back into the pose of the last frame.")


def cmd_holds(ref, names, seeds):
    """Living holds for poses the staging holds until its next call (owner 12/11: never a frozen frame): a loop clip from each
    named key back to itself (segment H_<name>), five of its frames appended after the sheet's own sequence, spec holds and end."""
    d, spec = load(ref)
    first = spec['segments'][0]['prompt']
    who = first[:first.index(' from ')] + ', ' if ' from ' in first else ''
    keep = first[first.index(' Arms, shoulders'):] if ' Arms, shoulders' in first else ''
    segs = [g for g in spec['segments'] if not g['name'].startswith('H_')]
    for n in names:
        segs.append({'name': f'H_{n}', 'start': n, 'end': n, 'length': 13, 'prompt': who + LIVE + keep})
    spec['segments'] = segs; save(d, spec)
    cmd_clip(ref, seeds, [f'H_{n}' for n in names])
    d, spec = load(ref)
    main = [p for p in spec['pick'] if not p[0].startswith('H_')]
    end = max(i for i, p in enumerate(main) if p == ['key', 'rest'])
    pick = main[:end + 1]; holds = {}
    for n in names:
        k = next(i for i, p in enumerate(pick) if p == ['key', n]); a = len(pick)
        pick += [[f'H_{n}', seeds[0], f] for f in (2, 4, 6, 8, 10)]; holds[str(k)] = [a, len(pick) - 1]
    spec['pick'] = pick; spec['end'] = end; spec['holds'] = holds; save(d, spec)
    print('holds', holds, 'end', end, 'frames', len(pick))


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
        body = ~((a[..., 1] > 100) & (a[..., 1] - np.maximum(a[..., 0], a[..., 2]) > 60)) if GREEN else ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))      # off the background (clip edges drift a little)
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


def keep_or_save(im, path):
    """A soft sheet rewritten only when its picture changed: its sharpened drawing (sharp-N, newer) stays valid when frames
    are appended to a spec (living holds)."""
    if path.exists() and np.array_equal(np.asarray(Image.open(path).convert('RGB')), np.asarray(im.convert('RGB'))):
        return
    im.save(path)


def cmd_soft(ref):
    d, spec = load(ref)
    fr = picks(d, spec)
    contact(fr, d / 'picked.jpg', cols=12)
    if hires(spec):        # two frames per Codex image, cropped to the bodies: each drawn at 768x1024
        box = spec.get('zoom_box_fixed') or zoom_box(fr); spec['zoom_box'] = box; save(d, spec)   # fixed: keep drawn pairs valid
        x, y, w, h = box
        for s in range(math.ceil(len(fr) / 2)):
            sh = Image.new('RGB', (1536, 1024), MAG)
            for i, f in enumerate(fr[s * 2:(s + 1) * 2]):
                c = Image.new('RGB', (w, h), MAG); c.paste(f, (-x, -y))
                sh.paste(c.resize((768, 1024), Image.LANCZOS), (i * 768, 0))
            keep_or_save(sh, d / f'soft-{s}.png')
        return
    for s in range(math.ceil(len(fr) / 6)):
        sh = Image.new('RGB', (3 * CELL, 2 * CELL), MAG)
        for i, f in enumerate(fr[s * 6:(s + 1) * 6]):
            sh.paste(f.resize((CELL, CELL), Image.LANCZOS), ((i % 3) * CELL, (i // 3) * CELL))
        keep_or_save(sh, d / f'soft-{s}.png')


SHARPEN = (ROOT / 'assets/heroes/clip_sharpen_prompt.txt')
PAIR = (ROOT / 'assets/heroes/clip_sharpen_pair_prompt.txt')


def cmd_sharpen(ref, sheets=None, model='gpt-6.1-sol', effort='low'):
    d, spec = load(ref)
    ref_img = d / 'keys' / 'rest.png'
    if not ref_img.exists():      # a loop on a drawn pose (Lumi's ride) has no rest key: the hero's resting frame
        ref_img = ROOT / spec['rest']
    n = len(list(d.glob('soft-*.png')))
    sys.stdout.reconfigure(line_buffering=True)
    prompt = PAIR if hires(spec) else SHARPEN
    if spec.get('sharpen_note') or GREEN:      # a spec's own extra rule (hands on a shaft), or the green background
        text = (PAIR if hires(spec) else SHARPEN).read_text(encoding='utf-8').rstrip() + chr(10) + spec.get('sharpen_note', '') + chr(10)
        if GREEN:
            text = text.replace('magenta #FF00FF', 'green #00FF00').replace('magenta', 'green')
            text += ('Nothing on the character may be green: keep every gem, orb and jewel in the exact colours of the soft '
                     'frame (a blue-purple orb stays blue-purple; 13/11 a redraw turned Lumi\'s orb green).' + chr(10))
        prompt = d / 'sharpen-prompt.txt'
        prompt.write_text(text, encoding='utf-8')
    # sharpen_refs (owner 14/11, Lumi's staff head and shoulder fans drifted from the resting design): close-ups cut from the
    # resting frame, sent as Image 3, 4... after it; the spec's sharpen_note says what each one shows.
    extra = sum([['--ref', str(ROOT / p)] for p in spec.get('sharpen_refs', [])], [])
    base_prompt = prompt
    for s in (sheets or range(n)):
        out = d / f'sharp-{s}.png'
        if not sheets and out.exists() and out.stat().st_mtime > (d / f'soft-{s}.png').stat().st_mtime:
            continue     # already drawn from this soft sheet (a resumed run)
        # sharpen_sheet_notes {sheet: text} (14/11: Lumi 2's clip dropped her staff mid-swing on one sheet): an extra rule
        # for that sheet only.
        prompt = base_prompt
        if str(s) in spec.get('sharpen_sheet_notes', {}):
            prompt = d / f'sharpen-prompt-{s}.txt'
            prompt.write_text(Path(base_prompt).read_text(encoding='utf-8').rstrip() + chr(10) + spec['sharpen_sheet_notes'][str(s)] + chr(10), encoding='utf-8')
        env = {**os.environ, 'IMAGEGEN_BACKEND': 'codex'}
        r = subprocess.run([sys.executable, str(IMAGEGEN), '--prompt-file', str(prompt), '--out', str(d / f'sharp-{s}.png'),
                            '--ref', str(d / f'soft-{s}.png'), '--ref', str(ref_img)] + extra + ['--model', model, '--effort', effort],
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


def lock(sharp, soft, mode='boot', whole=False):
    """The sharpened cell put back on its clip frame: same body area (blades left out) and the same back boot
    (mode 'center': the body's centre, for runs whose feet keep moving). whole: the whole silhouette's area, for a hero
    dressed in white (Yuki: her white robe and hair read as steel and the body measure flickered by 20-50%, 12/11)."""
    s = ((int(mask(sharp).sum()) / max(1, int(mask(soft).sum()))) if whole else (area(sharp) / max(1, area(soft)))) ** .5
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

    def torso(k):   # feet_lock "torso" (owner 14/11, Lumi floats and her staff hangs below her boots): the body's middle band
        a = np.asarray(k)[..., 3] > 128; ys, xs = np.where(a); top, bot = ys.min(), ys.max()
        band = (ys > top + (bot - top) * .35) & (ys < top + (bot - top) * .6)
        return float(np.median(xs[band]))
    m = [(torso if spec.get('feet_lock') == 'torso' else mid)(keyed[f]) for f in order]
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
    if not .94 <= hs <= 1.06:           # a missed face (Yuki's pale face and white hair): keep the clip frame's own size
        hs = 1.0
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


def hue_match(im, rest, ranges):
    """spec hue_lock [[lo, hi], ...] (hue degrees; owner 14/11, Lumi "bị thay đổi màu sắc giữa các ảnh"): Codex redraws
    each batch of frames on its own and its robe drifted from the approved violet to a brighter red-magenta. Inside each
    hue range only (the robe, not the hat's cyan gems, the gold or the skin), the frame's hue, saturation and brightness
    are mapped onto the resting frame's distributions (quantile matching), feathered over the range's edges."""
    import cv2
    a = np.asarray(im).astype(np.uint8); r = np.asarray(rest).astype(np.uint8)
    hsv = cv2.cvtColor(np.ascontiguousarray(a[..., :3]), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    rh = cv2.cvtColor(np.ascontiguousarray(r[..., :3]), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    deg = lambda x: x[..., 0] * 360 / 256
    q = np.linspace(0, 1, 101)

    def qmap(src, ref):   # value -> the reference's value at the same quantile
        sq, rq = np.quantile(src, q), np.quantile(ref, q)
        return lambda x: np.interp(x, sq, rq)
    for lo, hi in ranges:
        def pick(h, al):
            d = deg(h); return (al > 200) & (h[..., 1] > 60) & (h[..., 2] > 40) & (d >= lo) & (d <= hi)
        m, mr = pick(hsv, a[..., 3]), pick(rh, r[..., 3])
        if m.sum() < 500 or mr.sum() < 500:
            continue
        d = deg(hsv); edge = 12
        w = np.clip(np.minimum(d - (lo - edge), (hi + edge) - d) / edge, 0, 1) * (hsv[..., 1] > 40) * (a[..., 3] > 0)
        fh, fsat, fv = qmap(d[m], deg(rh)[mr]), qmap(hsv[..., 1][m], rh[..., 1][mr]), qmap(hsv[..., 2][m], rh[..., 2][mr])
        inside = w > 0
        nd = d.copy(); nd[inside] = d[inside] + (np.clip(fh(d[inside]), lo - edge, hi + edge) - d[inside]) * w[inside]
        ns = hsv[..., 1].copy(); ns[inside] += (fsat(ns[inside]) - ns[inside]) * w[inside]
        nv = hsv[..., 2].copy(); nv[inside] += (fv(nv[inside]) - nv[inside]) * w[inside]
        hsv[..., 0] = (nd % 360) * 256 / 360; hsv[..., 1] = ns; hsv[..., 2] = nv
    rgb = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB_FULL)
    return Image.fromarray(np.dstack([rgb, a[..., 3]]), 'RGBA')

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


def head_size(ref_cell, im, box):
    """How much bigger im draws the head than ref_cell (box: the head in ref_cell): multi-scale template match on grey,
    returns (score, scale). Works on profile faces where head_scale's skin search finds nothing."""
    import cv2

    def prep(c):
        a = np.asarray(c).astype(np.float32); al = a[..., 3:] / 255
        return cv2.GaussianBlur(cv2.cvtColor((a[..., :3] * al + 128 * (1 - al)).astype(np.uint8), cv2.COLOR_RGB2GRAY), (3, 3), 0)
    t = prep(ref_cell)[box[0]:box[1], box[2]:box[3]]; g = prep(im); best = (-1.0, 1.0)
    for s in np.arange(.80, 1.36, .01):
        tt = cv2.resize(t, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        if tt.shape[0] < g.shape[0] and tt.shape[1] < g.shape[1]:
            r = float(cv2.matchTemplate(g, tt, cv2.TM_CCOEFF_NORMED).max())
            if r > best[0]:
                best = (r, float(s))
    return best


def head_lock(spec, keyed, rest_img, tol=.03, trust=.42):
    """Scale each frame of the sheet's own sequence so its head matches the resting frame's, about its soles; a hold loop
    frame takes its pose's factor. Weak matches (a raised arm over the face) take their neighbours' factor."""
    a = np.asarray(rest_img.getchannel('A')) > 100; ys, xs = np.where(a); top, h = ys.min(), ys.max() - ys.min()
    cx = int(np.median(np.where(a[top:top + int(h * .38)])[1])); w = int(h * .30)
    box = (top, top + int(h * .38), max(0, cx - w), cx + w)
    end = spec.get('end', len(keyed) - 1)
    raw = []
    for i in range(end + 1):
        r, s = (1.0, 1.0) if is_rest(spec, spec['pick'][i]) else head_size(rest_img, keyed[i], box)
        raw.append(s if r >= trust else None)
    known = [i for i, s in enumerate(raw) if s is not None]
    est = [raw[i] if raw[i] is not None else
           np.interp(i, known, [raw[k] for k in known]) for i in range(end + 1)]
    est = [float(np.median(est[max(0, i - 1):i + 2])) for i in range(end + 1)]    # one-frame outliers out
    fac = [1.0 / s if abs(s - 1) > tol else 1.0 for s in est]
    holds = {int(k): v for k, v in (spec.get('holds') or {}).items()}
    full = fac + [1.0] * (len(keyed) - len(fac))
    for k, (h0, h1) in holds.items():
        for i in range(h0, h1 + 1):
            full[i] = fac[k]
    out = []
    for k, f in zip(keyed, full):
        if f == 1.0:
            out.append(k); continue
        al = np.asarray(k.getchannel('A')) > 100; yy, xx = np.where(al)
        fy = yy.max(); fx = float(np.median(xx[yy >= fy - k.height * .02]))
        t = k.resize((round(k.width * f), round(k.height * f)), Image.LANCZOS)
        c = put(Image.new('RGBA', k.size, (0, 0, 0, 0)), t, round(fx - fx * f), round(fy - fy * f))
        out.append(c)
    return out, [round(f, 3) for f in full]


def body_lock(spec, keyed, rest_img, give=.04, trust=18):
    """size_lock "body" (owner 13/11: six-star Mika's ultimate "kích thước loạn": its keys and in-betweens came out ~10%
    apart and her nine-tail fan shrank to ~0.82 in the crouch, while her head is often hidden so head_lock misjudged).
    Each frame: the body's scale from SIFT matches on the resting frame's central column (face, torso, legs; similarity
    transform, RANSAC) and the silhouette's scale (sqrt of the opaque area). It is scaled about its soles so the
    silhouette matches the resting frame's as far as the body may stay within +-give of it. Factors are smoothed along
    the play order (spec order), a weak body match takes its play-order neighbours'."""
    import cv2

    def gray(c):
        a = np.asarray(c).astype(np.float32); al = a[..., 3:] / 255
        return cv2.cvtColor((a[..., :3] * al + 128 * (1 - al)).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    al = np.asarray(rest_img.getchannel('A')) > 100; ys, _ = np.where(al); top, bot = ys.min(), ys.max(); h = bot - top
    cx = int(np.median(np.where(al[top + int(h * .2):top + int(h * .6)])[1])); w = int(h * .22)
    mask = np.zeros(al.shape, np.uint8); mask[top + int(h * .12):bot - int(h * .05), max(0, cx - w):cx + w] = 255
    sift = cv2.SIFT_create(6000, contrastThreshold=.02); kr, dr = sift.detectAndCompute(gray(rest_img), mask)
    bf = cv2.BFMatcher(); a0 = float(al.sum())
    order = [i for i in (spec.get('order') or range(len(spec['pick']))) if i < len(keyed)]
    body, sil = {}, {}
    for i in order:
        if is_rest(spec, spec['pick'][i]):
            body[i], sil[i] = 1.0, 1.0; continue
        sil[i] = float(np.sqrt((np.asarray(keyed[i].getchannel('A')) > 100).sum() / a0))
        k, d = sift.detectAndCompute(gray(keyed[i]), None)
        if d is None or len(k) < 8:
            continue
        good = [m for m, n2 in bf.knnMatch(dr, d, k=2) if m.distance < .8 * n2.distance]
        if len(good) < 8:
            continue
        A, inl = cv2.estimateAffinePartial2D(np.float32([kr[m.queryIdx].pt for m in good]), np.float32([k[m.trainIdx].pt for m in good]),
                                             method=cv2.RANSAC, ransacReprojThreshold=3)
        if A is not None and inl is not None and int(inl.sum()) >= trust:
            body[i] = float(np.hypot(A[0, 0], A[1, 0]))
    known = [j for j, i in enumerate(order) if i in body]
    bseq = [body.get(i) if i in body else float(np.interp(j, known, [body[order[q]] for q in known])) for j, i in enumerate(order)]
    want = []
    for sb, i in zip(bseq, order):
        f = min(max(1 / sil[i], (1 - give) / sb), (1 + give) / sb)
        want.append(f)
    fac = {i: float(np.median(want[max(0, j - 1):j + 2])) for j, i in enumerate(order)}
    for i in order:
        if is_rest(spec, spec['pick'][i]):
            fac[i] = 1.0
    holds = {int(k): v for k, v in (spec.get('holds') or {}).items()}
    for k, (h0, h1) in holds.items():
        for i in range(h0, h1 + 1):
            fac[i] = fac.get(k, 1.0)
    out, full = [], []
    for i, k in enumerate(keyed):
        f = fac.get(i, 1.0)
        if abs(f - 1) < .01:
            out.append(k); full.append(1.0); continue
        a = np.asarray(k.getchannel('A')) > 100; yy, xx = np.where(a)
        fy = yy.max(); fx = float(np.median(xx[yy >= fy - k.height * .02]))
        t = k.resize((round(k.width * f), round(k.height * f)), Image.LANCZOS)
        if f > 1.02:
            from PIL import ImageFilter
            t = t.filter(ImageFilter.UnsharpMask(radius=1.4, percent=int(60 + 300 * (f - 1)), threshold=2))
        out.append(put(Image.new('RGBA', k.size, (0, 0, 0, 0)), t, round(fx - fx * f), round(fy - fy * f))); full.append(round(f, 3))
    return out, full


# ---- thinning: at most 24 frames a sheet (owner 13/11) -------------------------------------------------------------
# "Để max tối đa 24 frame thôi. Giữ frame quan trọng. Áp dụng cho tất cả các tướng": Yuki's six-star ultimate (57 frames,
# one frame a 17 ms step) stuttered. spec keep = the frames kept, in sheet order: every pose the staging names (roles, the
# way back, the end), a clock's segment ends and grip keys, a run's lead-in ends; in-betweens spread evenly over each
# stretch; a run's cycle every other frame (twice the time each); a living hold keeps two of its drawings (one when the
# swings would be left too bare). The game's timings keep their length (step, loop, lead-in, hold pace).
MAX_FRAMES = 24


def _spread(chain, k):
    """k inner frames of a chain (its two ends kept), evenly spaced."""
    inner = chain[1:-1]
    if k >= len(inner):
        return list(inner)
    return [inner[round((j + 1) * (len(inner) + 1) / (k + 1)) - 1] for j in range(k)]


def thin_plan(spec, cap=MAX_FRAMES):
    n = len(spec['pick'])
    if n <= cap:
        return None
    if spec.get('loop'):            # a run: lead-in 0..a-1 once, then the cycle a..b
        a, b = spec['loop']; L = b - a + 1
        cyc = list(range(a, b + 1, 2)) if L % 2 == 0 and L >= 10 else list(range(a, b + 1))
        lead = sorted(set(([0, a - 1] if a > 1 else list(range(a))) + _spread(list(range(a)), cap - len(cyc) - 2)))
        return sorted(set(lead + cyc))
    must, chains, holds = set(), [], []
    if spec.get('clock'):
        for s in spec['clock']:
            if 'seq' in s:
                c = list(s['seq'])
            elif 'loop' in s:
                c = list(range(s['loop'][0], s['loop'][1] + 1)) + [s['loop'][0]]   # a living loop closes on its first frame
            else:
                c = list(range(s['f'][0], s['f'][1] + 1))
            must |= {c[0], c[-1]}; chains.append(c)
    else:
        end = spec.get('end', n - 1)
        must |= {0, end} | set(spec.get('roles', [])) | {r for r in spec.get('rolesBack', []) if r is not None}
        chains.append(list(range(end + 1)))
        holds = [list(range(h0, h1 + 1)) for h0, h1 in (spec.get('holds') or {}).values()]
    must |= set(spec.get('gripKeys', []))
    stretches = []
    for c in chains:
        cut = [i for i, f in enumerate(c) if f in must]
        for i0, i1 in zip(cut, cut[1:]):
            if i1 - i0 > 1:
                stretches.append(c[i0:i1 + 1])
    inner_total = sum(len(s) - 2 for s in stretches)
    per_hold = 0
    if holds:
        # one drawing per hold toggled with its pose read as a nod (owner 13/11: Hiro 3's face "gật gật"): two, or none
        per_hold = 2 if cap - len(must) - 2 * len(holds) >= .4 * inner_total else 0
    budget = cap - len(must) - per_hold * len(holds)
    assert budget >= 0, (spec['id'], len(must), budget)
    want = [(len(s) - 2) * budget / max(1, inner_total) for s in stretches]
    got = [int(w) for w in want]
    for i in sorted(range(len(want)), key=lambda i: got[i] - want[i])[:max(0, min(budget, inner_total) - sum(got))]:
        got[i] += 1
    keep = set(must)
    for s, k in zip(stretches, got):
        keep |= set(_spread(s, k))
    for h in holds:
        keep |= set(_spread([None] + h + [None], per_hold))
    keep = sorted(keep)
    assert len(keep) <= cap, (spec['id'], len(keep))
    return keep


def thin_entry(e, spec, keep):
    """A runtime meta entry (forms.json action, runtime-meta.json, Hiro's meta action) for the kept frames only."""
    n0 = len(spec['pick']); M = {o: i for i, o in enumerate(keep)}
    hi = lambda o: M[max(k for k in keep if k <= o)]
    for key in ('count', 'frames'):
        if key in e:
            e[key] = len(keep)
    cols = e.get('cols') or e.get('columns') or spec.get('cols', 6)
    if 'rows' in e:
        e['rows'] = math.ceil(len(keep) / cols)
    for key in ('heads', 'headAnchors', 'grips', 'sockets'):
        if isinstance(e.get(key), list) and len(e[key]) == n0:
            e[key] = [e[key][o] for o in keep]
    if e.get('roles'):
        e['roles'] = [M[r] for r in e['roles']]
    if e.get('rolesBack'):
        e['rolesBack'] = [None if r is None else M[r] for r in e['rolesBack']]
    main0 = e.get('end', n0 - 1) + 1
    if 'end' in e:
        e['end'] = M[e['end']]
    main1 = e.get('end', len(keep) - 1) + 1
    if e.get('holds'):
        h2, f0, f1 = {}, 0, 0
        for k, (h0, h1) in e['holds'].items():
            kept = [o for o in keep if h0 <= o <= h1]; f0 += h1 - h0 + 2; f1 += len(kept) + 1
            if kept:
                h2[str(M[int(k)])] = [M[kept[0]], M[kept[-1]]]
        e['holds'] = h2
        e['holdMs'] = round(min(140, (e.get('holdMs') or 70) * f0 / max(1, f1)))
    if e.get('stepMs') and e.get('roles'):
        e['stepMs'] = round(e['stepMs'] * main0 / main1)
    if e.get('gripKeys'):
        e['gripKeys'] = [M[g] for g in e['gripKeys']]
    if e.get('clock'):
        c2 = []
        for s in e['clock']:
            s = dict(s)
            if 'seq' in s:
                q = []
                for o in s['seq']:
                    if o in M and (not q or q[-1] != M[o]):
                        q.append(M[o])
                s['seq'] = q
            elif 'loop' in s:
                a, b = s['loop']; L0 = b - a + 1; s['loop'] = [M[a], hi(b)]; L1 = s['loop'][1] - s['loop'][0] + 1
                if L1 < L0:
                    s['step'] = round(min(110, (s.get('step') or 70) * L0 / L1))
            else:
                s['f'] = [M[s['f'][0]], M[s['f'][1]]]
            c2.append(s)
        e['clock'] = c2
    if e.get('loop'):
        a, b = e['loop']; L0 = b - a + 1; e['loop'] = [M[a], hi(b)]; r = L0 / (e['loop'][1] - e['loop'][0] + 1)
        if e.get('loopMs'):
            e['loopMs'] = round(e['loopMs'] * r)
        if e.get('frameDuration'):
            e['frameDuration'] = round(e['frameDuration'] * r)      # the plaza's cycle pace
        if e.get('introTimes'):
            t = e['introTimes']; lead = [o for o in keep if o < a]
            e['introTimes'] = [sum(t[o:(lead[i + 1] if i + 1 < len(lead) else a)]) for i, o in enumerate(lead)]
    return e


def write_kept_sheet(frames, out, cols, CO):
    """The kept frames as the sheet, its row bands written afresh (stale bands of a longer sheet removed)."""
    rows = math.ceil(len(frames) / cols)
    sheet = Image.new('RGBA', (cols * CO, rows * CO), (0, 0, 0, 0))
    for i, k in enumerate(frames):
        sheet.paste(k, ((i % cols) * CO, (i // cols) * CO))
    sheet.save(out, quality=92, method=6) if out.suffix == '.webp' else sheet.save(out)
    for old in out.parent.glob(f'{out.stem}.r*{out.suffix}'):
        if old.stem[len(out.stem) + 2:].isdigit():
            old.unlink()
    return rows, write_chunks(sheet, out, cols, rows)


def meta_entry(spec):
    """(whole meta, the sheet's entry in it, save) of the sheet's runtime meta."""
    if spec.get('meta'):
        p = ROOT / spec['meta']; m = json.loads(p.read_text(encoding='utf-8'))
        return m, m, lambda: p.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if spec.get('novice_meta'):
        p = ROOT / spec['novice_meta']; m = json.loads(p.read_text(encoding='utf-8')); action = spec['out'].rsplit('/', 1)[1].split('.')[0]
        return m, m['actions'][action], lambda: p.write_text(json.dumps(m, ensure_ascii=False, indent=2) + chr(10), encoding='utf-8')
    p = ROOT / 'assets/heroes/forms' / spec['hero'] / 'forms.json'; m = json.loads(p.read_text(encoding='utf-8'))
    form, action = spec['forms']
    return m, m['forms'][form]['actions'][action], lambda: p.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def cmd_thin(ref, cap=MAX_FRAMES):
    """Thin an assembled sheet in place to spec keep (planned when missing): its approved cells cut out, not redrawn."""
    d, spec = load(ref)
    n0 = len(spec['pick'])
    m, e, save_meta = meta_entry(spec)
    count = e.get('count') or e.get('frames')
    if count != n0:
        raise SystemExit(f'{ref}: the sheet has {count} frames, the spec {n0}: thin only a full sheet (assemble first)')
    keep = spec.get('keep') or thin_plan(spec, cap)
    if not keep:
        print(ref, 'already', n0); return
    out = ROOT / spec['out']; cols = e.get('cols') or e.get('columns') or spec.get('cols', 6)
    im = Image.open(out).convert('RGBA'); CO = im.width // cols
    frames = [im.crop(((i % cols) * CO, (i // cols) * CO, (i % cols + 1) * CO, (i // cols + 1) * CO)) for i in range(n0)]
    rows, chunk = write_kept_sheet([frames[i] for i in keep], out, cols, CO)
    thin_entry(e, spec, keep)
    if chunk is None:
        e.pop('chunkRows', None)
    else:
        e['chunkRows'] = chunk
    for other in spec.get('also_actions', []):
        m['forms'][spec['forms'][0]]['actions'][other] = dict(e)
    save_meta()
    spec['keep'] = keep; save(d, spec)
    contact([frames[i] for i in keep], d / 'thinned.jpg', cols=12)
    print(ref, n0, '->', len(keep), keep)



def hold_face_box(spec, rest_img, base):
    """spec hold_face [x0, y0, x1, y1] (fractions of the resting PNG, spec rest): that face found on a hold's pose frame
    (template match of the resting face, at the cell's scale), as a pixel box of the cell, or None."""
    import cv2
    if not spec.get('hold_face'):
        return None
    rest = Image.open(ROOT / spec['rest']).convert('RGBA')
    a = np.asarray(rest_img.getchannel('A')) > 100; b = np.asarray(rest.getchannel('A')) > 100
    ya, xa = np.where(a); yb, xb = np.where(b); k = (ya.max() - ya.min()) / (yb.max() - yb.min())
    x0, y0, x1, y1 = [v * rest.width for v in spec['hold_face']]
    box = [round(xa.min() + (x0 - xb.min()) * k), round(ya.min() + (y0 - yb.min()) * k),
           round(xa.min() + (x1 - xb.min()) * k), round(ya.min() + (y1 - yb.min()) * k)]

    def gray(c):
        q = np.asarray(c).astype(np.float32); al = q[..., 3:] / 255
        return cv2.cvtColor((q[..., :3] * al + 128 * (1 - al)).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    tmpl = gray(rest_img)[box[1]:box[3], box[0]:box[2]]; g = gray(base); best = None
    for sc in (.9, .95, 1.0, 1.05, 1.1):
        t = cv2.resize(tmpl, None, fx=sc, fy=sc)
        if t.shape[0] >= g.shape[0] or t.shape[1] >= g.shape[1]:
            continue
        r = cv2.matchTemplate(g, t, cv2.TM_CCOEFF_NORMED); _, v, _, at = cv2.minMaxLoc(r)
        if best is None or v > best[0]:
            best = (v, at[0], at[1], t.shape[1], t.shape[0])
    if not best or best[0] < .35:
        print('hold_face: no face found', round(best[0], 2) if best else None); return None
    return [best[1], best[2], best[1] + best[3], best[2] + best[4]]

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
        im, s = lock(b, a, spec.get('lock', 'boot'), spec.get('lock_area') == 'all')
        if hires(spec):        # the zoomed crop back onto the whole padded canvas, at the stored cell size
            x, y, w, h = spec['zoom_box']; k = CO / SIZE
            k_im = key_magenta(im).resize((round(w * k), round(h * k)), Image.LANCZOS)
            cell = Image.new('RGBA', (CO, CO), (0, 0, 0, 0)); cell.alpha_composite(k_im, (round(x * k), round(y * k)))
            keyed.append(cell)
        else:   # (a pad between 4/3 and 1.4 stores cells a little over 512 px: every frame at that size, 12/11)
            keyed.append(key_magenta(im) if CO == CELL else key_magenta(im).resize((CO, CO), Image.LANCZOS))
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
    if spec.get('hue_lock'):
        keyed = [hue_match(k, rest_img, spec['hue_lock']) if not is_rest(spec, p) else k for k, p in zip(keyed, spec['pick'])]
    # Frames the game jumps between with no step (spec same {"17": 6}: a second thrust starts from the guard it came back
    # to): one drawing, so the jump shows nothing (owner 12/11).
    for i, j in spec.get('same', {}).items():
        keyed[int(i)] = keyed[j].copy()
    # head_lock: every frame drawn at the resting frame's head size, scaled about its soles (13/11: Nori's six-star skill grew
    # 15-30% through its clips, a drawn key placed too big by a profile face; the owner saw him swell and shrink).
    if spec.get('size_lock') == 'body':
        keyed, factors = body_lock(spec, keyed, rest_img)
        report = [(r, f) if abs(f - 1) > .005 else r for r, f in zip(report, factors)]
        print('body_lock', ' '.join(f'{i}:{f}' for i, f in enumerate(factors) if f != 1.0))
    elif spec.get('head_lock'):
        keyed, factors = head_lock(spec, keyed, rest_img)
        report = [(r, f) if abs(f - 1) > .005 else r for r, f in zip(report, factors)]
    # scale_fix {frame: factor}: a frame the size locks misjudge (a face turned up to the sky, 13/11 Nori's hammer throw),
    # scaled by eye about its soles after them.
    for i, f in (spec.get('scale_fix') or {}).items():
        k = keyed[int(i)]; al = np.asarray(k.getchannel('A')) > 100; yy, xx = np.where(al)
        fy = yy.max(); fx = float(np.median(xx[yy >= fy - k.height * .02]))
        t = k.resize((round(k.width * f), round(k.height * f)), Image.LANCZOS)
        if f > 1.02:
            from PIL import ImageFilter
            t = t.filter(ImageFilter.UnsharpMask(radius=1.4, percent=int(60 + 300 * (f - 1)), threshold=2))
        keyed[int(i)] = put(Image.new('RGBA', k.size, (0, 0, 0, 0)), t, round(fx - fx * f), round(fy - fy * f))
        report[int(i)] = (report[int(i)], 'fix', f)
    # Living holds (spec holds {pose frame: [first, last]}, frames appended after the sheet's own sequence): each loop frame
    # stands where its pose stands, keeps the pose's body and takes from its clip frame only what moves (hair, cloth).
    if spec.get('holds'):
        from scipy import ndimage
        for k, (h0, h1) in spec['holds'].items():
            k = int(k); base = keyed[k]; bx, by = pose_xy(base); s0 = np.asarray(soft[k]).astype(np.float32)
            # hold_face (owner 14/11, Lumi: "ảnh 16, 21 bị sao này?"): the soft clip blinks or ghosts the face while the pose
            # holds, so the moved mask took a smeared, doubled eye from the clip frame; the face always stays the pose's.
            face = hold_face_box(spec, rest_img, base)
            for i in range(h0, h1 + 1):
                hx, hy = pose_xy(keyed[i]); al = shift_rgba(keyed[i], bx - hx, by - hy)
                moved = np.abs(np.asarray(soft[i]).astype(np.float32) - s0).max(-1) > 40
                moved = ndimage.binary_dilation(ndimage.binary_opening(moved, iterations=2), iterations=10)
                if hires(spec):
                    x, y, w, h = spec['zoom_box']; kk = CO / SIZE
                    mm = Image.fromarray((moved * 255).astype(np.uint8)).resize((round(w * kk), round(h * kk)))
                    moved = np.asarray(put(Image.new('L', (CO, CO), 0).convert('RGBA'), mm.convert('RGBA'), round(x * kk), round(y * kk)))[..., 0] > 127
                else:
                    moved = np.asarray(Image.fromarray((moved * 255).astype(np.uint8)).resize((CO, CO))) > 127
                if face:
                    fx0, fy0, fx1, fy1 = face; px, py = round((fx1 - fx0) * .12), round((fy1 - fy0) * .12)
                    moved[max(0, fy0 - py):fy1 + py, max(0, fx0 - px):fx1 + px] = False
                m = ndimage.gaussian_filter(moved.astype(np.float32), 4)[..., None]
                keyed[i] = Image.fromarray((np.asarray(base).astype(np.float32) * (1 - m) + np.asarray(al).astype(np.float32) * m).clip(0, 255).astype(np.uint8), 'RGBA')
    # same_final {frame: frame}: a living-hold frame whose blend still ghosts (two slightly different drawings of a prop laid
    # over each other, 14/11 Lumi's staff ring) shows a clean neighbour of the same loop after the blend.
    for i, j in spec.get('same_final', {}).items():
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
            if hires(spec):   # the soft frame is the zoomed crop: its mask back onto the stored cell
                x, y, w, h = spec['zoom_box']; kk = CO / SIZE
                mm = Image.fromarray((moved * 255).astype(np.uint8)).resize((round(w * kk), round(h * kk)))
                moved = np.asarray(put(Image.new('L', (CO, CO), 0).convert('RGBA'), mm.convert('RGBA'), round(x * kk), round(y * kk)))[..., 0] > 127
            m = ndimage.gaussian_filter(moved.astype(np.float32), 4)[..., None]
            keyed[i] = Image.fromarray((base * (1 - m) + np.asarray(keyed[i]).astype(np.float32) * m).clip(0, 255).astype(np.uint8), 'RGBA')
            report[i] = (report[i], 'hold', round(float(m.mean()), 3))
        sheet = Image.new('RGBA', (cols * CO, rows * CO), (0, 0, 0, 0))
        for i, k in enumerate(keyed):
            sheet.paste(k, ((i % cols) * CO, (i // cols) * CO))
        sheet.save(out, quality=92, method=6) if out.suffix == '.webp' else sheet.save(out)
    if spec.get('keep'):    # thinned to at most 24 frames (cmd_thin, owner 13/11): the kept frames only
        rows, spec['chunkRows'] = write_kept_sheet([keyed[i] for i in spec['keep']], out, cols, CO)
    else:
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
    extra = {k: spec[k] for k in ('clock', 'roles', 'rolesBack', 'gripKeys', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'recoil', 'holds', 'end', 'holdMs') if spec.get(k) is not None}
    if spec.get('legacy_grips'):
        extra['grips'] = convert_grips(spec)
    if sockets:
        extra['sockets'] = sockets
    if spec.get('_feetX') is not None:
        extra['feetX'] = spec['_feetX']
    if spec.get('meta'):        # form 1: assets/reimagined/heroes/<hero>/<action>/runtime-meta.json
        p = ROOT / spec['meta']; m = json.loads(p.read_text(encoding='utf-8'))
        for k in ('frameFiles', 'framePixelHashes', 'uniqueFrames', 'sourceSha256', 'qc', 'recoveredGridCrossings', 'originalAnchorYStd',
                  'clock', 'roles', 'sockets', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'recoil', 'holds', 'end', 'holdMs'):
            m.pop(k, None)
        m.update(columns=cols, rows=rows, frames=n, frameWidth=CELL // 2, frameHeight=CELL // 2, frameDuration=spec.get('frameDuration', 40),
                 headAnchors=heads, source=folder_of(spec).relative_to(ROOT).as_posix() + '/spec.json', **extra)
        for k in ('scale', 'footY', 'feetY', 'feetX'):
            m.pop(k, None)
        if spec.get('pad', 1) > 1:   # a padded form-1 sheet (a wide run): grown about footY like the forms' sheets
            n2 = round(CELL * spec['pad']); off = n2 - CELL - round((n2 - CELL) * .15)
            m.update(scale=spec['pad'], footY=round(off / (n2 - CELL), 4), feetY=round((off + .94 * CELL) / n2, 4))
        if spec.get('_feetX') is not None:
            m['feetX'] = spec['_feetX']
        if spec.get('keep'):
            thin_entry(m, spec, spec['keep'])
        p.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if spec.get('novice_meta'):  # Hiro's form 1: one assets/heroes/novice/meta.json holds every action
        p = ROOT / spec['novice_meta']; m = json.loads(p.read_text(encoding='utf-8')); action = spec['out'].rsplit('/', 1)[1].split('.')[0]
        e = {k: v for k, v in m['actions'].get(action, {}).items() if k not in ('frameFiles', 'framePixelHashes', 'uniqueFrames', 'qc', 'fallbackOf', 'note', 'clock', 'roles',
             'rolesBack', 'sockets', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'recoil', 'feetX', 'scale', 'source', 'holds', 'end', 'holdMs')}
        e.update(hero='novice', action=action, accepted=True, atlas=f'{action}.webp', columns=cols, rows=rows, frames=n, count=n, cols=cols,
                 frameWidth=CELL // 2, frameHeight=CELL // 2, frameDuration=spec.get('frameDuration', 40), headAnchors=heads,
                 source=folder_of(spec).relative_to(ROOT).as_posix() + '/spec.json', **extra)
        if spec.get('pad', 1) > 1:
            e['scale'] = spec['pad']
        if spec.get('keep'):
            thin_entry(e, spec, spec['keep'])
        m['actions'][action] = e
        p.write_text(json.dumps(m, ensure_ascii=False, indent=2) + chr(10), encoding='utf-8')
    if spec.get('forms'):       # forms 2-3: assets/heroes/forms/<hero>/forms.json [form, action]
        p = ROOT / 'assets/heroes/forms' / spec['hero'] / 'forms.json'; m = json.loads(p.read_text(encoding='utf-8'))
        form, action = spec['forms']
        e = {k: v for k, v in m['forms'][form]['actions'].get(action, {}).items() if k not in ('clock', 'roles', 'rolesBack', 'gripKeys', 'grips', 'sockets', 'stepMs', 'loop', 'loopMs', 'introMs', 'introTimes', 'chunkRows', 'note', 'feetX', 'recoil', 'holds', 'end', 'holdMs')}
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
        if spec.get('keep'):
            thin_entry(e, spec, spec['keep'])
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
    elif a.cmd == 'holds':       # holds <hero/id> --only key1,key2 [--seeds 7]
        cmd_holds(a.ref, [n for n in a.only.split(',') if n], [int(x) for x in a.seeds.split(',')])
    elif a.cmd == 'placekey':     # placekey <hero/id> --only <name> --images <raw.png> [--ask dx]
        cmd_placekey(a.ref, a.only, a.images, float(a.ask or 0), float(a.sheets or 1))
    elif a.cmd == 'edit':
        for name in a.only.split(','):
            cmd_edit(a.ref, name, [int(s) for s in a.seeds.split(',')])
    elif a.cmd == 'soft':
        cmd_soft(a.ref)
    elif a.cmd == 'sharpen':
        cmd_sharpen(a.ref, [int(s) for s in a.sheets.split(',') if s] or None)
    elif a.cmd == 'assemble':
        cmd_assemble(a.ref)
    elif a.cmd == 'thin':          # thin <hero/id>: the assembled sheet cut to at most 24 frames (spec keep)
        cmd_thin(a.ref)
    elif a.cmd == 'review':
        cmd_review(a.ref, a.stage, [p for p in a.images.split(',') if p], a.ask)
    else:
        raise SystemExit('unknown command')
