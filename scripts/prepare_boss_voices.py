"""Per-boss and elite combat voices from licensed recordings.

    python scripts/prepare_boss_voices.py

Sources live in assets/audio/sources/freesound/<id>-<slug>/ (one folder per
download, each with source.json: title, author, URL, licence, sha256).
A missing source file is fetched again from its recorded URL and verified.

Monster bosses (MONSTERS) speak with real recordings of what they resemble (bear,
lion, tiger, fox, hawk, eagle, wolf/dog, alligator, crocodile, sea lion, hippo,
camel, moose, gorilla, hissing cockroach, wasp, steam engine and metal) or with
designed dragon roars and performed wraith voices from game-audio uploads. They are
built by the shared engine in scripts/prepare_creature_sfx.py with minimal
processing: one excerpt of one recording per clip, at most -13 % speed for size,
high-pass, trim, fades and loudness. Human-looking bosses and elites (FAMILIES) use
CC0 male/female voice actors who are not used by any hero.

Output: assets/audio/bosses/<family>-<kind>.wav (44.1 kHz mono 16-bit) and
assets/audio/boss-voice-manifest.json. The existing elemental fallback entries
(boss-fire-*, boss-earth-*, boss-ice-*, boss-lightning-*) are kept untouched.
The four original bosses whose ids equal an element name get their own families
(boss-ashdragon, boss-grovewarden, boss-moonfrost, boss-thunderking) so the
fallback names stay free; voice-casting.json lists the family of every boss.
Note: scripts/prepare_cast_audio.py rewrites boss-voice-manifest.json with
the fallback entries only, so run this script after it.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, find_peaks, istft, sosfilt, stft

import prepare_creature_sfx as engine

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/audio'
SOURCES = BASE / 'sources/freesound'
OUT = BASE / 'bosses'
RATE = 44100
KINDS = ['attack1', 'attack2', 'attack3', 'hurt1', 'hurt2', 'hurt3', 'cast', 'release', 'death']
# target length, minimum length (seconds) per kind
LENGTH = {'attack': (.52, .30), 'hurt': (.40, .28), 'cast': (1.15, .62), 'release': (.85, .62), 'death': (1.55, 1.0)}

# --------------------------------------------------------------------------- sources

def source_meta(sid):
    folders = sorted(SOURCES.glob(f'{sid}-*'))
    if not folders:
        raise SystemExit(f'missing source folder for Freesound #{sid}')
    meta = json.loads((folders[0] / 'source.json').read_text(encoding='utf-8'))
    path = folders[0] / meta['file']
    if not path.exists():
        request = urllib.request.Request(meta['download_url'], headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(request, timeout=60).read()
        if hashlib.sha256(data).hexdigest() != meta['sha256']:
            raise SystemExit(f'checksum mismatch for {path}')
        path.write_bytes(data)
    return meta, path

_cache = {}
def load(sid, speed=1.0, mode='rate'):
    """Decode to 44.1 kHz mono. mode 'rate': resample (pitch and duration change
    together, natural for creatures); mode 'pitch': pitch shift, timing kept."""
    key = (sid, speed, mode)
    if key not in _cache:
        meta, path = source_meta(sid)
        chain = f'aresample={RATE},asetrate={RATE}*{speed},aresample={RATE}'
        if mode == 'pitch':
            chain += f',atempo={1 / speed}'
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1',
                                       '-af', chain, '-f', 'f32le', '-ar', str(RATE), 'pipe:1'])
        x = np.frombuffer(raw, dtype='<f4').astype(np.float64)
        x = sosfilt(butter(2, 35, btype='highpass', fs=RATE, output='sos'), x)
        _cache[key] = (x, meta, path)
    return _cache[key]

_noise = {}
def noise_profile(sid, speed, mode):
    """Average spectrum of the quietest 12% of the recording (room/mp3 hiss)."""
    key = (sid, speed, mode)
    if key not in _noise:
        x = load(sid, speed, mode)[0]
        f, t, Z = stft(x, RATE, nperseg=1024)
        mag = np.abs(Z); energy = mag.mean(0)
        quiet = mag[:, energy <= np.percentile(energy, 12)]
        _noise[key] = quiet.mean(1, keepdims=True) if quiet.size else np.zeros((mag.shape[0], 1))
    return _noise[key]

def denoise(x, profile, amount=1.6):
    """Gentle spectral subtraction; keeps 12% of each bin so breath stays natural."""
    if len(x) < 2048:
        return x
    f, t, Z = stft(x, RATE, nperseg=1024)
    mag = np.abs(Z)
    gain = np.maximum(1 - amount * profile / np.maximum(mag, 1e-9), .12)
    _, y = istft(Z * gain, RATE, nperseg=1024)
    return y[:len(x)]

def band(x, lo, hi):
    hi = min(hi, RATE / 2 - 500)
    return sosfilt(butter(3, [lo, hi], btype='bandpass', fs=RATE, output='sos'), x)

# --------------------------------------------------------------------------- events

def events(x, region=None):
    """Onset-aligned vocal events: an envelope peak, the rise before it and its decay."""
    hop = RATE // 100
    n = len(x) // hop
    env = np.sqrt(np.convolve((x[:n * hop] ** 2).reshape(n, hop).mean(1), np.ones(3) / 3, 'same'))
    lo, hi = (0, n) if region is None else (int(region[0] * 100), min(n, int(region[1] * 100)))
    floor, top = np.percentile(env[lo:hi], 20), env[lo:hi].max()
    threshold = max(floor * 3, top * .10)
    peaks, _ = find_peaks(env, height=threshold, distance=22, prominence=threshold * .5)
    found = []
    for p in peaks:
        if not lo <= p < hi:
            continue
        a = p
        while a > lo and env[a - 1] > env[p] * .16 and p - a < 45:
            a -= 1
        b = p
        while b < hi - 1 and env[b + 1] > env[p] * .14 and b - p < 260:
            b += 1
        if found and abs(found[-1]['start'] - a * hop) < .15 * RATE:
            if env[p] > found[-1]['height']:
                found[-1] = dict(start=a * hop, end=(b + 1) * hop, height=env[p])
            continue
        found.append(dict(start=a * hop, end=(b + 1) * hop, height=env[p]))
    for e in found:
        e['dur'] = (e['end'] - e['start']) / RATE
    return found

# --------------------------------------------------------------------------- textures

def texture(name, n, rng):
    """Very quiet elemental air under a recording (never the voice itself)."""
    t = np.arange(n) / RATE
    noise = rng.normal(0, 1, n)
    if name == 'ember':
        return band(noise, 700, 3200) * .5 + band(noise, 2500, 7000) * (rng.random(n) > .9985) * 2.5
    if name == 'frost':
        return band(noise, 4500, 11000) * (.6 + .4 * np.sin(2 * np.pi * 7 * t))
    if name == 'crackle':
        return band(noise, 1800, 8000) * np.maximum(0, np.sin(2 * np.pi * 37 * t + rng.random() * 6)) ** 18 * 4
    if name == 'rumble':
        return band(noise, 30, 140) * 2
    if name == 'sand':
        return band(noise, 2000, 7000) * (rng.random(n) > .996) * 5 + band(noise, 1500, 5000) * .3
    if name == 'void':
        return band(noise, 60, 400) * (.5 + .5 * np.sin(2 * np.pi * 3 * t))
    return np.zeros(n)

# --------------------------------------------------------------------------- families
# pools: kind -> [(freesound id, speed, mode, region)]; 'all' is the default pool.
# layers: (id, speed, relative gain, low Hz, high Hz) mixed under every clip.

def P(*items):
    out = []
    for item in items:
        sid, speed, *rest = item
        mode = rest[0] if rest and isinstance(rest[0], str) else 'rate'
        region = rest[-1] if rest and isinstance(rest[-1], tuple) else None
        out.append((sid, speed, mode, region))
    return out

# ---- monsters: real recordings, minimal processing ------------------------------
# Built with the creature engine (scripts/prepare_creature_sfx.py): one excerpt of one
# recording per clip, speed change at most -13 % for size, high-pass, trim, fades and
# loudness only. No layering, saturation, denoise or added textures.
# pools: kind or 'all' -> [Src(freesound id, speed, region=(s, e), at=(start, length), gap)]
S = engine.Src
MONSTERS = {
    'boss-grovewarden': dict(boss='earth', voice='treant-golem', hp=35, pools={  # bear roars and grizzly growls
        'attack': [S(479825, .9), S(519599, .9), S(763026, .9)], 'hurt': [S(519599, .9), S(479825, .9)],
        'cast': [S(519599, .9)], 'release': [S(479825, .9, at=(0.28, 1.25))], 'death': [S(479825, .9)]}),
    'boss-ashdragon': dict(boss='fire', voice='dragon', hp=35, pools={  # designed dragon roars (real lion/dog/horse/elephant based)
        'attack': [S(546391), S(85568)], 'hurt': [S(546391), S(651817)],
        'cast': [S(546391)], 'release': [S(85568)], 'death': [S(651817)]}),
    'boss-moonfrost': dict(boss='ice', voice='frost-beast', hp=80, pools={  # red fox screams, slightly larger
        'all': [S(634005, .9)]}),
    'boss-thunderking': dict(boss='lightning', voice='storm-lion', hp=35, pools={  # lion roars, tiger snarls
        'attack': [S(69570), S(437980)], 'hurt': [S(69572), S(439280)], 'cast': [S(263115)],
        'release': [S(69572)], 'death': [S(69570)]}),
    'boss-scarab': dict(boss='scarab', voice='insect-beetle', hp=60, pools={  # hissing cockroaches, larger
        'all': [S(459476, .87), S(547898, .87, region=(100, 370))]}),
    'boss-leviathan': dict(boss='leviathan', voice='sea-serpent', hp=35, pools={  # alligator growls, crocodile scream
        'attack': [S(437933, .92), S(527844, .92)], 'hurt': [S(403373, .92)], 'all': [S(437933, .92)]}),
    'boss-colossus': dict(boss='colossus', voice='steam-golem', hp=35, pools={  # steam engine, metal, steam whistle
        'attack': [S(125211), S(741284)], 'hurt': [S(814976), S(741284), S(172411)],
        'cast': [S(438641)], 'release': [S(71778)], 'death': [S(172411)]}),
    'boss-prism': dict(boss='prism', voice='insect-queen', hp=100, pools={  # wasp and yellow-jacket buzz, cicada
        'attack': [S(392458), S(610866)], 'hurt': [S(155968), S(392458)], 'cast': [S(397607)],
        'all': [S(610866)]}),
    'boss-reaper': dict(boss='reaper', voice='undead-wraith', hp=80, pools={  # performed wraith shrieks and moans
        'all': [S(433735)], 'cast': [S(204966)], 'death': [S(400855)]}),
    'boss-roc': dict(boss='roc', voice='giant-bird', hp=120, pools={  # red-tailed hawk screams, larger
        'all': [S(575524, .9), S(479610, .9)]}),
    'boss-eclipse': dict(boss='eclipse', voice='void-dragon', hp=35, pools={  # designed dragon roars, growls and snarls
        'all': [S(479380)], 'release': [S(466830)]}),
    'boss-elderbloom': dict(boss='elderbloom', voice='antlered-treant', hp=35, pools={  # moose/elk bellows
        'all': [S(486554, .92)]}),
    'boss-cinderheart': dict(boss='cinderheart', voice='magma-golem', hp=35, pools={  # lion growls, gorilla roar
        'all': [S(488348, .9)], 'release': [S(397054, .9)]}),
    'boss-tempestwing': dict(boss='tempestwing', voice='thunderbird', hp=150, pools={  # eagle squawks and cries
        'attack': [S(675962)], 'hurt': [S(675962), S(437968)], 'all': [S(675962), S(437968)]}),
    'boss-souljailer': dict(boss='souljailer', voice='undead-jailer', hp=40, pools={  # performed demon/ghost groans (Osiruswaltz)
        'all': [S(362678)]}),
    'boss-sporefather': dict(boss='sporefather', voice='fungal-giant', hp=35, pools={  # camel grunts and groans
        'attack': [S(437937, .92), S(385912, .92)], 'hurt': [S(693564, .92), S(437937, .92)],
        'all': [S(437937, .92)]}),
    'boss-prismback': dict(boss='prismback', voice='crystal-tortoise', hp=35, pools={  # hippo grunts, elephant growl
        'attack': [S(194870, .9)], 'hurt': [S(194870, .9)], 'release': [S(194870, .9)],
        'all': [S(819668, .9), S(527845, .9)]}),
    'boss-coraltide': dict(boss='coraltide', voice='sea-dragon', hp=40, pools={  # designed dragon roar, sea lions
        'attack': [S(320345, .92), S(499564, .9)], 'hurt': [S(499564, .9), S(849186, .9)],
        'cast': [S(320345, .92)], 'release': [S(849186, .9)], 'death': [S(320345, .92)]}),
    'boss-moonfang': dict(boss='moonfang', voice='wolf', hp=45, pools={  # dog snarls, solitary wolf howl
        'all': [S(122183, .92)], 'cast': [S(500646)], 'death': [S(500646)]}),
}

FAMILIES = {
    # ---- human-looking bosses (villain voice actors, none used by heroes) --------
    'boss-mire': dict(boss='mire', voice='female', human=True, pools={'all': P((347346, .92, 'pitch')), 'death': P((218193, .92, 'pitch'))},
        double=(.75, .16), body=.10, presence=.10, band=(110, 9500), drive=1.25),
    'boss-briar': dict(boss='briar', voice='female', human=True, pools={'all': P((482814, .96, 'pitch', (4.8, 23.6))), 'death': P((573096, .95, 'pitch'))},
        double=(.5, .12), body=.12, presence=.12, band=(100, 9500), drive=1.2),
    'boss-frostregent': dict(boss='frostregent', voice='female', human=True,
        pools={'all': P((439515, .94, 'pitch', (36.0, 74.0))), 'cast': P((439515, .94, 'pitch', (0, 35.0))), 'death': P((439515, .92, 'pitch', (75.0, 92.0)))},
        double=(.5, .10), body=.04, presence=.16, band=(170, 10500), drive=1.1, texture=('frost', .035)),
    'boss-seraph': dict(boss='seraph', voice='male', human=True,
        pools={'all': P((511023, .90, 'pitch', (0, 27.0))), 'hurt': P((610998, .90, 'pitch')), 'cast': P((610998, .88, 'pitch')),
               'release': P((610998, .90, 'pitch')), 'death': P((610998, .86, 'pitch'))},
        double=(.75, .14), body=.14, presence=.10, band=(80, 9000), drive=1.2),
    'boss-sandchronarch': dict(boss='sandchronarch', voice='male', human=True,
        pools={'all': P((257358, .86, 'pitch')), 'death': P((556976, .84, 'pitch', (0.4, 3.2)))},
        double=(.7, .18), body=.16, presence=.06, band=(70, 8500), drive=1.3, texture=('sand', .04)),
    # ---- elites (two male and two female villain variants) ----------------------
    'elite-male-a': dict(voice='male', human=True, pools={'all': P((467121, .95, 'pitch')),
        'cast': P((556976, .95, 'pitch', (7.5, 13.5))), 'release': P((556976, .95, 'pitch', (7.5, 13.5))), 'death': P((556976, .93, 'pitch', (3.8, 6.6)))},
        body=.08, presence=.10, band=(90, 9000), drive=1.15),
    'elite-male-b': dict(voice='male', human=True, pools={'all': P((770124, .92, 'pitch'), (218895, .88, 'pitch')),
        'cast': P((621352, .9, 'pitch')), 'death': P((621352, .86, 'pitch'))},
        body=.14, presence=.06, band=(70, 8500), drive=1.25),
    'elite-female-a': dict(voice='female', human=True, pools={'all': P((218908, .97, 'pitch')), 'death': P((845164, .95, 'pitch'))},
        body=.06, presence=.10, band=(120, 10000), drive=1.15),
    'elite-female-b': dict(voice='female', human=True, pools={'attack': P((671353, .95, 'pitch')), 'hurt': P((671354, .97, 'pitch')),
        'all': P((671353, .95, 'pitch'), (671354, .95, 'pitch')), 'death': P((850699, .94, 'pitch', (0, 2.8)))},
        body=.08, presence=.12, band=(120, 10000), drive=1.15),
}

# --------------------------------------------------------------------------- build

def overlaps(used, sid, a, b):
    return any(s == sid and a < y and x < b for s, x, y in used)

def candidates(family, kind):
    spec = FAMILIES[family]['pools']
    pool = spec.get(kind) or spec['all']
    out = []
    for sid, speed, mode, region in pool:
        x, meta, path = load(sid, speed, mode)
        found = events(x, region)
        top = max([e['height'] for e in found] or [1])
        for e in found:  # loudness relative to its own recording, so pooled sources mix
            out.append(dict(e, height=e['height'] / top, sid=sid, speed=speed, mode=mode, x=x))
    return out

def choose(family, kind, used, need):
    """Pick an unused event: deaths/casts prefer long events, attacks the loudest."""
    target, minimum = LENGTH[kind]
    pool = candidates(family, kind)
    if kind in ('death', 'cast'):
        key = lambda e: min(e['dur'], target) * e['height'] ** .5
    elif kind == 'release':
        key = lambda e: e['height'] * min(e['dur'], .8)
    else:
        key = lambda e: e['height'] * min(1, e['dur'] / .32)
    picks = []
    for e in sorted(pool, key=key, reverse=True):
        a = max(0, e['start'] - int(.012 * RATE))
        b = min(len(e['x']), a + int(target * RATE), e['end'] + int(.10 * RATE))
        if b - a < .12 * RATE or overlaps(used, e['sid'], a, b):
            continue
        picks.append((e, a, b))
        used.append((e['sid'], a, b))
        if len(picks) == need:
            break
    if len(picks) < need:
        # Sparse sources: allow a different window of an already used event.
        # Sparse sources: later windows inside long calls, then any unused window.
        for allow_overlap in (False, True):
            for e in sorted(pool, key=key, reverse=True):
                for a in range(e['start'] + int(.3 * RATE), e['end'] - int(.2 * RATE), int(.3 * RATE)):
                    b = min(len(e['x']), a + int(target * RATE), e['end'] + int(.10 * RATE))
                    if b - a < .2 * RATE or (overlaps(used, e['sid'], a, b) if not allow_overlap else
                                             any(s == e['sid'] and abs(x - a) < .1 * RATE for s, x, y in used)):
                        continue
                    picks.append((e, a, b))
                    used.append((e['sid'], a, b))
                    break
                if len(picks) == need:
                    break
            if len(picks) == need:
                break
    if len(picks) < need:
        raise SystemExit(f'{family}: not enough material for {kind}')
    return picks

def segment(e, a, b, kind):
    target, minimum = LENGTH[kind]
    if kind not in ('cast', 'release', 'death') and b - a < minimum * RATE * .8:
        b = min(len(e['x']), a + int(minimum * RATE * .8))
    return e['x'][a:b].copy()

def active(x):
    """Audible length: first to last sample above 3% of the peak."""
    idx = np.flatnonzero(np.abs(x) > np.abs(x).max() * .03)
    return x[idx[0]:idx[-1] + 1] if len(idx) else x

def envelope(x, kind):
    n = len(x); t = np.arange(n) / RATE; d = n / RATE
    rise = {'cast': .11, 'death': .02}.get(kind, .006)
    fall = {'death': .45, 'cast': .22, 'release': .28}.get(kind, .22) * d
    env = np.minimum(1, t / rise) * np.clip((d - t) / max(fall, .03), 0, 1) ** 1.3
    if kind == 'cast':
        env *= .55 + .45 * np.minimum(1, t / (d * .7))
    return x * env

def pitch_drop(x, end_rate=.8):
    """Dying cry: the recording slows and sinks over its length."""
    n = len(x)
    rate = np.linspace(1, end_rate, int(n / ((1 + end_rate) / 2)))
    pos = np.cumsum(rate); pos = pos[pos < n - 1]
    return np.interp(pos, np.arange(n), x)

def finish(x, spec, kind, rng):
    lo, hi = spec['band']
    x = band(x, lo, hi)
    if spec.get('human'):
        x = x + band(x, 130, 380) * spec.get('body', 0) + band(x, 1900, 4500) * spec.get('presence', 0)
    elif spec.get('presence'):
        # Big low creatures still need a mid-range bite to read on small speakers.
        x = x + band(x, 650, 3200) * spec['presence']
    if spec.get('low_cut'):
        x = x - band(x, 35, 240) * spec['low_cut']
    if spec.get('texture'):
        name, gain = spec['texture']
        tex = texture(name, len(x), rng)
        level = np.abs(x)
        follow = np.convolve(level, np.ones(1024) / 1024, 'same')
        x = x + tex / max(1e-6, np.sqrt(np.mean(tex ** 2))) * follow * gain * 1.2
    d = spec.get('drive', 1)
    x = x / max(1e-6, np.abs(x).max())
    x = np.tanh(x * d) / np.tanh(d)
    if kind == 'death':
        x = pitch_drop(x, .8 if not spec.get('human') else .88)
    x = envelope(x, kind)
    if spec.get('human'):
        # A small dark room tail so clipped grunts end naturally (villains, not dry heroes).
        n = int(.2 * RATE)
        ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / (.055 * RATE))
        ir = band(ir, 150, 4500); ir /= np.sqrt(np.sum(ir ** 2))
        wet = np.pad(np.convolve(x, ir), (0, 1))[:len(x) + n]
        x = np.pad(x, (0, n)) + wet * .22
    # trim leading/trailing silence (relative -46 dB), keep 8 ms lead-in
    level = np.abs(x); active = np.flatnonzero(level > level.max() * .005)
    x = x[max(0, active[0] - int(.008 * RATE)): active[-1] + 1]
    fade = min(len(x) // 6, int(.012 * RATE)); x[-fade:] *= np.linspace(1, 0, fade)
    # loudness like the existing clips: rms 0.15, peaks softly held under 0.95
    x *= .15 / max(1e-6, np.sqrt(np.mean(x * x)))
    for _ in range(6):
        if np.abs(x).max() <= .94:
            break
        x = np.where(np.abs(x) > .7, np.sign(x) * (.7 + .24 * np.tanh((np.abs(x) - .7) / .24)), x)
        x *= .15 / max(1e-6, np.sqrt(np.mean(x * x)))
    x *= min(1, .94 / np.abs(x).max())
    return x

def layer(x, spec, kind, index, used_layers):
    out = x.copy()
    main_rms = np.sqrt(np.mean(x * x))
    for li, (sid, speed, gain, lo, hi) in enumerate(spec.get('layers', [])):
        lx, meta, path = load(sid, speed)
        evs = sorted(events(lx), key=lambda e: e['height'], reverse=True) or [dict(start=0, end=len(lx))]
        e = evs[(index * 3 + li) % len(evs)]
        a = max(0, e['start'] - int(.01 * RATE))
        piece = lx[a:a + len(x)]
        piece = np.pad(piece, (0, len(x) - len(piece)))
        piece = band(denoise(piece, noise_profile(sid, speed, 'rate')), lo, hi)
        rms = np.sqrt(np.mean(piece * piece))
        if rms > 1e-5:
            out += piece / rms * main_rms * gain
            used_layers.append((sid, round(a / RATE, 3), speed))
    if spec.get('double'):
        factor, gain = spec['double']
        idx = np.arange(len(x)) * factor
        out += np.interp(idx, np.arange(len(x)), x) * gain
    return out

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = BASE / 'boss-voice-manifest.json'
    existing = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest = {k: v for k, v in existing.items() if k.split('-')[1] in ('fire', 'earth', 'ice', 'lightning')}
    for f in OUT.glob('*.wav'):
        f.unlink()
    for family, spec in FAMILIES.items():
        rng = np.random.default_rng(int(hashlib.sha1(family.encode()).hexdigest()[:8], 16))
        used = []
        plan = {}
        plan['death'] = choose(family, 'death', used, 1)
        plan['cast'] = choose(family, 'cast', used, 1)
        plan['attack'] = choose(family, 'attack', used, 3)
        plan['release'] = choose(family, 'release', used, 1)
        plan['hurt'] = choose(family, 'hurt', used, 3)
        for kind_index, name in enumerate(KINDS):
            kind = name.rstrip('123')
            picks = plan[kind]
            e, a, b = picks[int(name[-1]) - 1] if name[-1].isdigit() else picks[0]
            x = denoise(segment(e, a, b, kind), noise_profile(e['sid'], e['speed'], e['mode']))
            parts = [(e['sid'], a, len(x), e['speed'], e['mode'])]
            target, minimum = LENGTH[kind]
            # Short grunts: join a second (and third) performance, as the hero casts do.
            if kind in ('cast', 'release', 'death'):
                x = active(x)
            while len(x) < minimum * RATE and kind in ('cast', 'release', 'death') and len(parts) < 3:
                (e2, a2, b2), = choose(family, 'hurt' if kind == 'release' else 'attack', [(p[0], p[1], p[1] + p[2]) for p in parts], 1)
                extra = denoise(e2['x'][a2:b2], noise_profile(e2['sid'], e2['speed'], e2['mode']))
                x = np.concatenate([x, np.zeros(int(.045 * RATE)), active(extra)])
                parts.append((e2['sid'], a2, len(extra), e2['speed'], e2['mode']))
            if kind == 'hurt' and not spec.get('human'):
                x = np.interp(np.arange(0, len(x) - 1, 1.07), np.arange(len(x)), x)
            used_layers = []
            x = layer(x, spec, kind, kind_index, used_layers)
            x = finish(x, spec, kind, rng)
            out = OUT / f'{family}-{name}.wav'
            wavfile.write(out, RATE, (x * 32767).astype(np.int16))
            source_ids = [p[0] for p in parts] + [l[0] for l in used_layers]
            metas = {sid: source_meta(sid)[0] for sid in dict.fromkeys(source_ids)}
            paths = {sid: source_meta(sid)[1].relative_to(BASE / 'sources').as_posix() for sid in metas}
            authors = ', '.join(dict.fromkeys(m['author'] for m in metas.values()))
            manifest[f'{family}-{name}'] = {
                'category': 'elite-performance' if family.startswith('elite') else 'boss-performance',
                'voice': spec['voice'],
                **({'boss': spec['boss']} if 'boss' in spec else {}),
                'sources': [f'sources/{paths[sid]}' for sid in metas],
                # times in seconds of the original recording
                'segments': [{'source': f'sources/{paths[p[0]]}', 'start': round(p[1] / RATE * (p[3] if p[4] == 'rate' else 1), 3),
                              'length': round(p[2] / RATE * (p[3] if p[4] == 'rate' else 1), 3),
                              'pitch': p[3], 'tempo': 1.0 if p[4] == 'pitch' else p[3]} for p in parts],
                'license': f'CC0 / {authors} (Freesound)',
                'pitch': parts[0][3],
                'tempo': 1.0 if parts[0][4] == 'pitch' else parts[0][3],
                'file': f'bosses/{out.name}',
                'duration': round(len(x) / RATE, 3),
                'rms': round(float(np.sqrt(np.mean(x * x))), 4),
                'peak': round(float(np.abs(x).max()), 4),
                'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
            }
    for family, spec in MONSTERS.items():
        manifest.update(engine.build_family(family, spec, OUT, 'boss-performance'))
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    new = [v for k, v in manifest.items() if v['file'].startswith('bosses/')]
    size = sum((BASE / v['file']).stat().st_size for v in new)
    print(f'{len(FAMILIES) + len(MONSTERS)} families, {len(new)} clips, {size / 1e6:.2f} MB, {sum(v["duration"] for v in new):.1f} s')

if __name__ == '__main__':
    build()
