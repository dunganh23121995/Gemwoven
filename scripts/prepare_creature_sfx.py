"""Creature voices from real recordings, with minimal processing.

    python scripts/prepare_creature_sfx.py

Run after scripts/prepare_creature_voices.py (which rewrites creature-manifest.json
with the old elemental fallback banks creature-<fire|ice|earth|lightning>-*).

Every common foe gets the voice of what it actually is (a bat squeaks like a bat,
a boar grunts like a pig, a crab clicks, a moth flutters). Each species group is one
family creature-<group>-{attack1..3, hurt1..3, cast, release, death}; each clip is a
single excerpt of one real recording (never a mix of several animals):

  * excerpt an event (or a short phrase of calls) from the source recording
  * optional speed change of at most +-15 % (only where two related voices must differ)
  * 40-90 Hz high-pass against handling rumble, silence trim, short fades
  * loudness like the existing clips: rms ~0.15, peaks below 0.95 through a gentle
    look-ahead peak limiter (at most 10 dB of gain reduction; quieter otherwise)

Sources: assets/audio/sources/freesound/<id>-<slug>/ with source.json (title, author,
URL, licence, sha256); a missing file is fetched again from its recorded URL and
verified. All sources are Freesound uploads under CC0 1.0 or CC BY (credited in
assets/audio/CREDITS.txt).

Output: assets/audio/creatures/creature-<group>-<kind>.wav (44.1 kHz mono 16-bit),
entries added to assets/audio/creature-manifest.json (old elemental entries kept) and
the "creatures" map of assets/audio/voice-casting.json (creature id -> family).

The engine (load, pick, render) is shared with scripts/prepare_boss_voices.py, which
builds the monster boss families the same way.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, sosfiltfilt

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/audio'
SOURCES = BASE / 'sources/freesound'
RATE = 44100
KINDS = ['attack1', 'attack2', 'attack3', 'hurt1', 'hurt2', 'hurt3', 'cast', 'release', 'death']
# (minimum, target, maximum) seconds per kind
LENGTH = {'attack': (.30, .55, .80), 'hurt': (.30, .45, .70), 'cast': (.60, 1.0, 1.40),
          'release': (.60, .90, 1.40), 'death': (.80, 1.4, 2.0)}
TARGET_RMS, PEAK, MAX_REDUCTION_DB = .15, .92, 10.0

# --------------------------------------------------------------------------- sources

def source_meta(sid):
    folders = sorted(SOURCES.glob(f'{sid}-*'))
    if not folders:
        raise SystemExit(f'missing source folder for Freesound #{sid}')
    meta = json.loads((folders[0] / 'source.json').read_text(encoding='utf-8'))
    path = folders[0] / meta['file']
    if not path.exists():
        request = urllib.request.Request(meta['download_url'], headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(request, timeout=90).read()
        if hashlib.sha256(data).hexdigest() != meta['sha256']:
            raise SystemExit(f'checksum mismatch for {path}')
        path.write_bytes(data)
    return meta, path

_cache = {}
def load(sid, speed=1.0):
    """Decode to 44.1 kHz mono. speed != 1 resamples (pitch and length change together,
    like a slightly larger or smaller animal); limited to +-15 %."""
    if not .85 <= speed <= 1.15:
        raise SystemExit(f'#{sid}: speed {speed} outside +-15 %')
    key = (sid, speed)
    if key not in _cache:
        meta, path = source_meta(sid)
        chain = f'aresample={RATE}' + (f',asetrate={RATE * speed:.0f},aresample={RATE}' if speed != 1 else '')
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-af', chain,
                                       '-f', 'f32le', '-ar', str(RATE), 'pipe:1'])
        x = np.frombuffer(raw, dtype='<f4').astype(np.float64)
        _cache[key] = (x - x.mean(), meta, path)
    return _cache[key]

def highpass(x, hz):
    return sosfiltfilt(butter(2, hz, btype='highpass', fs=RATE, output='sos'), x) if hz else x

# --------------------------------------------------------------------------- events

HOP = RATE // 100

def envelope_db(x):
    n = len(x) // HOP
    env = np.sqrt((x[:n * HOP] ** 2).reshape(n, HOP).mean(1) + 1e-12)
    env = np.convolve(env, np.ones(3) / 3, 'same')
    return 20 * np.log10(env / env.max())

def events(x, region=None, merge_gap=.06, rise=24):
    """Sound events (in 10 ms frames): contiguous frames above the noise floor + rise dB
    (or 32 dB under the loudest frame), gaps shorter than merge_gap joined."""
    db = envelope_db(x)
    lo, hi = (0, len(db)) if region is None else (int(region[0] * 100), min(len(db), int(region[1] * 100)))
    floor = np.percentile(db[lo:hi], 10)
    top = db[lo:hi].max()
    threshold = max(floor + rise * .5, top - 32, floor + 9)
    active = np.zeros(len(db), bool)
    active[lo:hi] = db[lo:hi] > threshold
    found, i, gap = [], lo, int(merge_gap * 100)
    while i < hi:
        if not active[i]:
            i += 1
            continue
        j = i
        while j < hi and (active[j] or active[j:min(hi, j + gap)].any()):
            j += 1
        if j - i >= 3:
            found.append(dict(a=i, b=j, peak=float(db[i:j].max()), floor=float(floor), top=float(top)))
        i = j
    if not found and hi - lo < 600:
        # a single cut one-shot (no silence around it): the whole clip is the event
        loud = np.flatnonzero(db[lo:hi] > top - 30)
        if len(loud):
            found.append(dict(a=lo + int(loud[0]), b=lo + int(loud[-1]) + 1, peak=float(top), floor=float(min(floor, top - 40)), top=float(top)))
    return found, db

def phrases(found, gap=.25):
    """Calls closer than gap seconds form one phrase (for cast/release/death)."""
    out = []
    for e in found:
        if out and e['a'] - out[-1]['b'] < gap * 100:
            out[-1] = dict(out[-1], b=e['b'], peak=max(out[-1]['peak'], e['peak']))
        else:
            out.append(dict(e))
    return out

# --------------------------------------------------------------------------- picking

class Src:
    """A pool entry: Freesound id, optional speed, optional region (seconds) to search,
    or at=(start, length) for an exact hand-picked window (source seconds)."""
    def __init__(self, sid, speed=1.0, region=None, at=None, gap=None):
        self.sid, self.speed, self.region, self.at, self.gap = sid, speed, region, at, gap

def window(x, db, e, kind, quiet):
    """Clip window for an event: from its onset, its natural length plus decay, kept
    inside the kind's length range; long sounds end at a quiet point."""
    lo, target, hi = LENGTH[kind]
    a = max(0, e['a'] - 1)
    b = e['b']
    # natural decay: until the envelope falls near the floor (max 0.25 s)
    tail = b
    while tail < len(db) - 1 and tail - b < 25 and db[tail] > quiet:
        tail += 1
    b = tail
    n = b - a
    if n > hi * 100:
        # cut at the quietest frame between target and maximum length
        seg = db[a + int(target * 100 * .8):a + int(hi * 100)]
        b = a + int(target * 100 * .8) + (int(np.argmin(seg)) if len(seg) else 0)
    elif n < lo * 100:
        b = min(len(db), a + int(lo * 100) + 5)
    return a * HOP, min(len(x), b * HOP)

def candidates(pool, kind):
    out = []
    for item in pool:
        x, meta, path = load(item.sid, item.speed)
        if item.at:
            s, length = item.at
            a, b = int(s / item.speed * RATE), int((s + length) / item.speed * RATE)
            out.append(dict(item=item, x=x, start=a, end=min(len(x), b), score=1e6, exact=True))
            continue
        found, db = events(x, item.region)
        if kind in ('cast', 'release', 'death'):
            found = phrases(found, item.gap or .25)
        lo, target, hi = LENGTH[kind]
        for e in found:
            quiet = max(e['floor'] + 6, e['peak'] - 40)
            a, b = window(x, db, e, kind, quiet)
            natural = (e['b'] - e['a']) / 100
            fit = -abs(np.log(max(natural, .05) / target))
            loud = e['peak'] - e['top']          # 0 = loudest in the recording
            snr = e['peak'] - e['floor']
            score = loud * .6 + min(snr, 40) * .5 + fit * 8
            if natural < lo * .35:
                score -= 12                       # clicks and fragments
            out.append(dict(item=item, x=x, start=a, end=b, score=score, exact=False))
            # long calls (moans, rattles, chorus phrases) also offer later windows
            step = int(hi * 100)
            for k, sub in enumerate(range(e['a'] + step, e['b'] - int(lo * 100), step)):
                sa, sb = window(x, db, dict(e, a=sub, b=min(e['b'], sub + step)), kind, quiet)
                out.append(dict(item=item, x=x, start=sa, end=sb, score=score - 3 * (k + 1), exact=False))
    return out

def pick(pool, kind, need, used):
    """Best unused windows, alternating between the pool's recordings for variety."""
    cands = candidates(pool, kind)
    by_source = {}
    for c in sorted(cands, key=lambda c: -c['score']):
        by_source.setdefault(id(c['item']), []).append(c)
    order = list(by_source.values())
    picks = []
    while len(picks) < need and any(order):
        for group in order:
            while group:
                c = group.pop(0)
                sid = c['item'].sid
                if any(s == sid and c['start'] < y and x < c['end'] for s, x, y in used) and not c['exact']:
                    continue
                picks.append(c)
                used.append((sid, c['start'], c['end']))
                break
            if len(picks) == need:
                break
    if len(picks) < need:
        raise SystemExit(f'not enough material for {kind}: {[p.sid for p in pool]}')
    return picks

# --------------------------------------------------------------------------- rendering

def limit(y):
    """Look-ahead peak limiter: 3 ms look-ahead, 60 ms release, block-wise gain."""
    peak = maximum_filter1d(np.abs(y), size=int(.003 * RATE) * 2 + 1)
    need = np.minimum(1, PEAK / np.maximum(peak, 1e-9))
    block = 64
    n = -(-len(y) // block)
    g = np.pad(need, (0, n * block - len(y)), constant_values=1).reshape(n, block).min(1)
    release = np.exp(-block / (.06 * RATE))
    out = np.empty(n)
    level = 1.0
    for i in range(n):
        level = g[i] if g[i] < level else level * release + (1 - release) * g[i]
        out[i] = min(level, g[i])
    gain = np.interp(np.arange(len(y)), np.arange(n) * block + block / 2, out)
    return y * np.minimum(gain, need)

def render(x, kind, hp):
    lo, target, hi = LENGTH[kind]
    x = highpass(x, hp)
    # trim leading/trailing silence (-42 dB under the clip peak), keep 6 ms before onset
    level = np.abs(x)
    idx = np.flatnonzero(level > level.max() * .008)
    start = max(0, idx[0] - int(.006 * RATE))
    # keep the natural decay of very short calls up to the kind's minimum length
    x = x[start: max(idx[-1] + 1, min(len(x), start + int(lo * RATE)))]
    if len(x) > hi * RATE:
        x = x[:int(hi * RATE)]
    # fades: short in, natural-length out (cosine)
    fin = min(len(x) // 8, int(.004 * RATE))
    fout = min(len(x) // 3, int(min(.12, .25 * len(x) / RATE) * RATE))
    x[:fin] *= np.linspace(0, 1, fin)
    x[-fout:] *= .5 + .5 * np.cos(np.linspace(0, np.pi, fout))
    # loudness: rms 0.15 where the limiter needs at most 10 dB, else as loud as allowed
    rms = np.sqrt(np.mean(x * x))
    gain = TARGET_RMS / max(rms, 1e-9)
    crest = np.abs(x).max() * gain / PEAK
    max_crest = 10 ** (MAX_REDUCTION_DB / 20)
    if crest > max_crest:
        gain *= max_crest / crest
    y = limit(x * gain)
    return np.clip(y, -.95, .95)

def build_family(family, spec, out_dir, category):
    """spec: pools {kind or 'all': [Src...]}, optional hp. Returns manifest entries."""
    pools = spec['pools']
    used, plan = [], {}
    for kind, need in (('death', 1), ('cast', 1), ('release', 1), ('attack', 3), ('hurt', 3)):
        plan[kind] = pick(pools.get(kind) or pools['all'], kind, need, used)
    entries = {}
    for name in KINDS:
        kind = name.rstrip('123')
        c = plan[kind][int(name[-1]) - 1 if name[-1].isdigit() else 0]
        item = c['item']
        y = render(c['x'][c['start']:c['end']].copy(), kind, spec.get('hp', 60))
        out = out_dir / f'{family}-{name}.wav'
        wavfile.write(out, RATE, (y * 32767).astype(np.int16))
        meta, path = source_meta(item.sid)
        rel = path.relative_to(BASE).as_posix()
        entries[f'{family}-{name}'] = {
            'category': category,
            'voice': spec['voice'],
            **({'boss': spec['boss']} if 'boss' in spec else {}),
            'sources': [rel],
            # seconds in the original recording
            'segments': [{'source': rel, 'start': round(c['start'] / RATE * item.speed, 3),
                          'length': round((c['end'] - c['start']) / RATE * item.speed, 3),
                          'pitch': item.speed, 'tempo': item.speed}],
            'license': f"{meta['license']} / {meta['author']} (Freesound)",
            'source_url': meta['source_url'],
            'pitch': item.speed,
            'tempo': item.speed,
            'file': f'{out_dir.name}/{out.name}',
            'duration': round(len(y) / RATE, 3),
            'rms': round(float(np.sqrt(np.mean(y * y))), 4),
            'peak': round(float(np.abs(y).max()), 4),
            'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
        }
    return entries

# --------------------------------------------------------------------------- families

S = Src
# group -> creatures (common foe ids), pools per kind ('all' = default), hp = high-pass Hz.
FAMILIES = {
    'slime': dict(  # jelly blobs, snails and slugs: wet squelches (qubodup slime set, rubberduck9999 squishes)
        creatures=['slime', 'crystal-b', 'thunder-a', 'marsh-a', 'mycelium-sludgesnail'],
        pools={'attack': [S(751338), S(751339), S(751341)],
               'hurt': [S(442772), S(751342), S(751340)],
               'all': [S(680447)]}),
    'bat': dict(  # real bat calls: craigsmith G12-35 chirping, a bat in a heating duct, a fruit-bat screech
        creatures=['bat', 'geode-crystalbat'], hp=150,
        pools={'attack': [S(437967), S(455593)], 'hurt': [S(455593), S(437967)],
               'release': [S(667579)], 'all': [S(437967)]}),
    'rodent': dict(  # mouse and pet-rat squeaks
        creatures=['soulcrypt-chainrat'], hp=150,
        pools={'hurt': [S(143125), S(463789)], 'all': [S(463789)]}),
    'songbird': dict(  # caged songbird chirps, one recording per clip (qubodup, Yogyakarta)
        creatures=['stormspire-sparkfinch'], hp=200,
        pools={'attack': [S(812034), S(812033), S(812036)], 'hurt': [S(812008), S(812031), S(812024)],
               'cast': [S(812025)], 'release': [S(812027)], 'death': [S(812026)]}),
    'gull': dict(
        creatures=['coast-b'], hp=150,
        pools={'attack': [S(510917), S(263786)], 'hurt': [S(507380), S(510917)], 'all': [S(510917)]}),
    'owl': dict(  # barn-owl screeches, great horned owl hoots, screech-owl whinny
        creatures=['pine-b', 'sky-b', 'glacier-blizzardowl'], hp=100,
        pools={'attack': [S(181134), S(101344)], 'hurt': [S(101344), S(181134)], 'cast': [S(479588)],
               'release': [S(181134)], 'death': [S(573771)]}),
    'raptor': dict(  # red-shouldered hawk (aviary, very clean); eagle cry for hurt
        creatures=['thunder-b', 'stormspire-voltgryphon'], hp=150,
        pools={'hurt': [S(770032), S(381200)], 'death': [S(770032, gap=.6)], 'cast': [S(770032, gap=.6)],
               'all': [S(770032)]}),
    'crow': dict(  # hooded crow, carrion crows
        creatures=['haunted-b', 'soulcrypt-bonecrow', 'moonkeep-shadowraven'], hp=120,
        pools={'attack': [S(741366), S(361470), S(813115)], 'hurt': [S(855095), S(855096), S(741366)],
               'release': [S(813115)], 'all': [S(741366, gap=.3)]}),
    'rabbit': dict(  # snow hares: guinea-pig squeals and wheeks (rabbits barely vocalise)
        creatures=['ice-a', 'glacier-snowhare'], hp=120,
        pools={'attack': [S(479607), S(583078)], 'hurt': [S(583078), S(479607)], 'all': [S(479607), S(583078)]}),
    'fox': dict(  # red fox screams, close Schoeps recording (felix.blume)
        creatures=['desert-a', 'sky-a', 'stormspire-gustfox'], hp=100,
        pools={'all': [S(832436)]}),
    'wolf': dict(  # dog snarls and barks, wolf-pack howl for the death
        creatures=['ice-b', 'obsidian-a', 'caldera-ashhound', 'void-b', 'moonkeep-duskfang', 'geode-stonepup'], hp=60,
        pools={'attack': [S(439535), S(479633), S(420452)], 'hurt': [S(420447), S(420449), S(439535)],
               'cast': [S(479633)], 'release': [S(439535)], 'death': [S(158780)]}),
    'bigcat': dict(  # lion moans (roman_cgr), tiger hiss and growl (craigsmith), tigress roar
        creatures=['celestial-b', 'moonkeep-eclipsestalker'], hp=50,
        pools={'attack': [S(437978)], 'hurt': [S(437978), S(811790)], 'release': [S(811790)],
               'all': [S(223978)]}),
    'boar': dict(  # angry pig oinks and squeals, grunting pig
        creatures=['pine-a', 'thorns-a', 'eldergrove-vineboar'], hp=60,
        pools={'attack': [S(352698)], 'hurt': [S(352698), S(842313)], 'release': [S(352698)],
               'all': [S(158746)]}),
    'reptile': dict(  # tokay gecko (tắc kè) and house-lizard chirps (thằn lằn)
        creatures=['bamboo-a', 'astral-a'], hp=100,
        pools={'attack': [S(546873), S(686626)], 'hurt': [S(400573), S(351301)],
               'release': [S(677430)], 'all': [S(546873)]}),
    'frog': dict(  # toad distress calls, frog croaks and ribbits
        creatures=['marsh-b', 'mycelium-sporetoad'], hp=80,
        pools={'attack': [S(479816), S(188195), S(397568)], 'hurt': [S(462863), S(536759), S(502531)],
               'release': [S(502531)], 'all': [S(479816, gap=.3), S(397568)]}),
    'serpent': dict(  # snarling cobra, rattlesnake rattle, snake hiss
        creatures=['hourglass-sandcobra', 'coralreef-pearleel'], hp=120,
        pools={'attack': [S(423454), S(268580)], 'hurt': [S(540162), S(423454)], 'cast': [S(268580)],
               'release': [S(423454)], 'death': [S(540162)]}),
    'crab': dict(  # crab legs/claws on a hard surface, crab walking, lobster clicks
        creatures=['coast-a', 'abyss-a', 'coralreef-reefcrab'], hp=150,
        pools={'attack': [S(770031), S(761559)], 'hurt': [S(567727), S(761559)], 'release': [S(761559)],
               'all': [S(770031)]}),
    'aquatic': dict(  # jellyfish and koi: underwater bubbles, gurgles and blups
        creatures=['bamboo-b', 'abyss-b', 'stormspire-cloudjelly', 'coralreef-foamjelly'], hp=80,
        pools={'attack': [S(807392), S(411761)], 'hurt': [S(807392), S(585259)], 'cast': [S(411761)],
               'all': [S(585259)]}),
    'beetle': dict(  # Madagascar hissing cockroach hisses, elephant-beetle squeak
        creatures=['obsidian-b', 'caldera-slagbeetle', 'hourglass-dustscarab'], hp=150,
        pools={'attack': [S(547898, region=(0, 100)), S(811205)], 'hurt': [S(502211), S(547898, region=(0, 100))],
               'all': [S(547898, region=(0, 100)), S(811205)]}),
    'skitter': dict(  # spiders, scorpions, mites, ticks: katydid and cricket stridulation
        creatures=['crystal-a', 'desert-b', 'geode-shardmite', 'mycelium-rottick'], hp=200,
        pools={'attack': [S(829810), S(701180)], 'hurt': [S(829810), S(637065)], 'release': [S(637065)],
               'all': [S(829810, gap=.3), S(701180)]}),
    'moth': dict(  # real moth wing flutter and buzz
        creatures=['dream-a', 'celestial-a', 'eldergrove-barkmoth', 'glacier-frostmoth', 'moonkeep-moonmoth'], hp=100,
        pools={'attack': [S(429899), S(131340)], 'hurt': [S(429899)], 'all': [S(693457)]}),
    'plant': dict(  # acorn, flytrap, sprouts, mushrooms: twig swish, twig snap, leaf and plant noises
        creatures=['acorn', 'thorns-b', 'eldergrove-sproutling', 'mycelium-sporecap', 'eldergrove-thornstag'], hp=80,
        pools={'attack': [S(254871)], 'hurt': [S(552006)], 'cast': [S(59315)],
               'release': [S(672909, at=(6.4, 1.1))], 'death': [S(672909, at=(2.1, 2.0))]}),
    'rock': dict(  # magma and ice golems: stone impact, stone scraping, ice cracks, rockfall
        creatures=['volcano-b', 'glacier-iceling'], hp=50,
        pools={'attack': [S(513694), S(354094)], 'hurt': [S(855116), S(354094)], 'cast': [S(222521)],
               'all': [S(336023)]}),
    'imp': dict(  # fire imps: angry cat hisses and growls, alley-cat fight
        creatures=['volcano-a', 'caldera-emberimp'], hp=80,
        pools={'attack': [S(750495), S(675401)], 'hurt': [S(750495)], 'cast': [S(679954)],
               'all': [S(675401)]}),
    'ghost': dict(  # wisps, lantern ghost, pillow ghost, void eye: performed ghost voices
        creatures=['dream-b', 'haunted-a', 'soulcrypt-wisp', 'void-a'], hp=100,
        pools={'death': [S(643741)], 'cast': [S(329519)], 'all': [S(609783)]}),
    'mech': dict(  # clockwork and gear drones: wind-up toy, toy ratchet, servo motors, air release
        creatures=['foundry-a', 'foundry-b', 'hourglass-clockmote', 'astral-b', 'stormspire-stormtotem'], hp=80,
        pools={'attack': [S(376195, gap=.3), S(118816)], 'hurt': [S(824121)], 'cast': [S(118816)],
               'release': [S(457294)], 'death': [S(723999)]}),
}

# ---------------------------------------------------------------------------- build

def build():
    out_dir = BASE / 'creatures'
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = BASE / 'creature-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest = {k: v for k, v in manifest.items() if k.split('-')[1] in ('fire', 'earth', 'ice', 'lightning')}
    for f in out_dir.glob('creature-*.wav'):
        if f.name.split('-')[1] not in ('fire', 'earth', 'ice', 'lightning'):
            f.unlink()
    casting_path = BASE / 'voice-casting.json'
    casting = json.loads(casting_path.read_text(encoding='utf-8'))
    creatures = {}
    for group, spec in FAMILIES.items():
        family = f'creature-{group}'
        manifest.update(build_family(family, dict(spec, voice=group), out_dir, 'creature-recording'))
        for cid in spec['creatures']:
            creatures[cid] = {'voice': group, 'family': family}
        print(f'{family}: {len(spec["creatures"])} foes')
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    casting['creatures'] = dict(sorted(creatures.items()))
    casting_path.write_text(json.dumps(casting, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    new = [v for k, v in manifest.items() if k.split('-')[1] not in ('fire', 'earth', 'ice', 'lightning')]
    size = sum((BASE / v['file']).stat().st_size for v in new)
    print(f'{len(FAMILIES)} families, {len(new)} clips, {size / 1e6:.2f} MB, {sum(v["duration"] for v in new):.1f} s')

if __name__ == '__main__':
    build()
