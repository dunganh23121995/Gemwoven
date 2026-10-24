"""Mika's four- and six-star ultimate sounds (src/forms-mika.js), one clip per visual beat.

Every clip is built from real CC0 recordings (Freesound public HQ MP3 previews kept in
assets/audio/sources/freesound/<id>-<slug>/ with source.json): excerpts, resampling for pitch,
band filters, fades, layering and a few short stereo reflections. No synthesis.
Output: assets/audio/hero-forms/fire/*.wav and assets/audio/hero-forms/fire-manifest.json
(merged by build.py into ART.castSounds as fire-<name>).
Rebuild: python scripts/prepare_mika_form_sounds.py
"""
from pathlib import Path
import hashlib
import json
import subprocess

import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, resample, sosfilt

AUDIO = Path(__file__).resolve().parents[1] / 'assets/audio'
SOURCES = AUDIO / 'sources/freesound'
OUT = AUDIO / 'hero-forms/fire'
RATE = 32000
_cache = {}


def folder(sid):
    return next(SOURCES.glob(f'{sid}-*'))


def read(sid):
    if sid not in _cache:
        meta = json.loads((folder(sid) / 'source.json').read_text(encoding='utf-8'))
        data = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(folder(sid) / meta['file']),
                                        '-ar', str(RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
        x = np.frombuffer(data, dtype='<f4').astype(float)
        _cache[sid] = (x / max(1e-6, np.abs(x).max()), meta)
    return _cache[sid][0]


def cut(sid, start, end, pitch=1.0, fade_in=.004, fade_out=.05, reverse=False):
    """An excerpt [start, end) s of a recording; pitch > 1 resamples it higher (and shorter)."""
    x = read(sid)[round(start * RATE):round(end * RATE)].copy()
    if reverse: x = x[::-1].copy()
    if pitch != 1:
        x = resample(x, max(8, round(len(x) / pitch)))
    n_in, n_out = min(len(x), round(fade_in * RATE)), min(len(x), round(fade_out * RATE))
    if n_in: x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out: x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


def band(x, low=None, high=None):
    if low and high: sos = butter(2, [low, high], btype='bandpass', fs=RATE, output='sos')
    elif low: sos = butter(2, low, btype='highpass', fs=RATE, output='sos')
    else: sos = butter(2, high, btype='lowpass', fs=RATE, output='sos')
    return sosfilt(sos, x)


def swell(x, rise):
    """Fade a clip in over `rise` seconds (a growth rather than a hit)."""
    n = min(len(x), round(rise * RATE)); x = x.copy(); x[:n] *= np.linspace(0, 1, n) ** 1.6; return x


def mix(length, *layers):
    """layers: (clip, at seconds, gain)."""
    out = np.zeros(round(length * RATE))
    for clip, at, gain in layers:
        s = round(at * RATE); n = min(len(clip), len(out) - s)
        if n > 0: out[s:s + n] += clip[:n] * gain
    return out


USED = {}


def save(name, x, sources, beat, bright=True, level=1.0):
    # A few short reflections give the dry foley a little air and stereo width.
    stereo = np.column_stack((x.copy(), x.copy()))
    tail = band(x, 300, 9000) if bright else band(x, 80, 2500)
    for at, gain, side in [(.031, .16, 0), (.053, .14, 1), (.097, .10, 0), (.149, .08, 1), (.211, .05, 0)]:
        n = round(at * RATE); stereo[n:, side] += tail[:-n] * gain
    rms = float(np.sqrt(np.mean(stereo ** 2))); peak = float(np.abs(stereo).max())
    # Loudness to the other cast sounds (rms ~.12 x level) with peaks <= .5: transients are brought up
    # and their sharpest peaks rounded by a soft limiter (at most ~7.6 dB of limiting).
    stereo *= min(.12 * level / max(rms, 1e-6), 1.2 / max(peak, 1e-6))
    stereo = .5 * np.tanh(stereo / .5)
    stereo[-round(RATE * .03):] *= np.linspace(1, 0, round(RATE * .03))[:, None]
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(stereo * 32767).astype(np.int16))
    metas = [(read(s), _cache[s][1])[1] for s in sources]
    USED[f'fire-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'sources': [f"#{s} \"{m['title']}\" by {m['author']}, {m['source_url']}" for s, m in zip(sources, metas)],
        'license': 'CC0-1.0 source recordings (excerpted, filtered, resampled, layered)',
        'peak': round(float(np.abs(stereo).max()), 3), 'rms': round(float(np.sqrt(np.mean(stereo ** 2))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'fire-{name}']['duration'], 's peak', USED[f'fire-{name}']['peak'], 'rms', USED[f'fire-{name}']['rms'])


def env(x, attack=.0, release=.0, curve=1.6):
    """Shape a clip's loudness: rise over `attack` s, fall over the last `release` s."""
    x = x.copy(); a = min(len(x), round(attack * RATE)); r = min(len(x), round(release * RATE))
    if a: x[:a] *= np.linspace(0, 1, a) ** curve
    if r: x[-r:] *= np.linspace(1, 0, r) ** curve
    return x


# ---- Four-star: Hồ Diễm Long Trảm (src/forms-mika.js mikaLongCleave) ----------------------------
# 0 ms, the sword raised: a bright steel ring as the blade comes up, and a flame catching on it.
save('f2-raise', mix(1.1,
    (band(cut('786713', 2.74, 3.35, fade_out=.25), 900), 0, .8),
    (band(cut('186374', 1.24, 1.9, fade_in=.01, fade_out=.3), 120), .08, .9)),
    ['786713', '186374'], 'the sword raised upright and set alight (skill frame 0)')
# 300 ms, the blade grows into fox-fire: a roaring fire swell rising to its full height (~0.6 s) and
# holding until the cleave at 950 ms.
save('f2-blaze', mix(.85,
    (env(band(cut('186932', .95, 1.95, pitch=.85), 60), .5, .2), 0, 1.0),
    (env(band(cut('483316', .6, 1.4), 100, 6000), .35, .25), .05, .55)),
    ['186932', '483316'], 'the blade blazes up into a fox-fire sword taller than the sky (300-950 ms)', bright=False)
# 950 ms, the overhead cleave: a huge, heavy flaming blade falling, its whoosh peaking at the hit
# (+0.22 s), a low air rush under the fire.
save('f2-cleave', mix(.55,
    (env(band(cut('244926', .12, .62, pitch=.82), 70), .16, .15), 0, 1.0),
    (env(band(cut('352719', .02, .36, pitch=.7), 60, 3000), .1, .12), .02, .85)),
    ['244926', '352719'], 'the giant blade swung down through the stage (950-1170 ms, peak at the hit)', bright=False)
# 1170 ms, through the foe: a fireball slam with a heavy low thud.
save('f2-impact', mix(1.0,
    (cut('431174', 0, .9, fade_in=.001, fade_out=.35), 0, 1.0),
    (band(cut('513694', .08, .7, pitch=.8, fade_out=.25), None, 900), 0, .8)),
    ['431174', '513694'], 'the cleave slams through the foe (hit at 1170 ms)', bright=False)
# 1250 ms, the burning cut on the ground: flames erupt along the floor, then crackle and die down.
save('f2-floorcut', mix(1.4,
    (band(cut('828433', .86, 1.9, fade_in=.005, fade_out=.45), 120), 0, .8),
    (env(band(cut('181563', 1.2, 2.5), 600), .1, .5), .1, .9)),
    ['828433', '181563'], 'the scorched cut burns along the floor through the foe (from 1250 ms, ~1.1 s)')
# 1850 ms, recovery: the sword settles back to guard with a soft blade slide, embers fizzing out.
save('f2-recover', mix(.9,
    (band(cut('107589', .05, .55, pitch=.9, fade_in=.02, fade_out=.2), 1200), 0, .55),
    (env(band(cut('137262', .25, .95), 1500), .05, .4), .1, .45)),
    ['107589', '137262'], 'the sword settles back to guard, embers fizzing out (skill frame 5)', level=.75)

# ---- Six-star: Cửu Dương Hồ Diễm (src/forms-mika.js mikaNineSunSweep) ----------------------------
# 0 ms, the nine tails flare into a sun: a blooming magic-fire rush, a sparkling shimmer and a soft,
# distant fox cry.
save('f3-flare', mix(1.3,
    (env(band(cut('761330', .35, 1.15), 150), .12, .3), 0, 1.0),
    (band(cut('632344', 0, 1.2, fade_out=.6), 3000), .05, .3),
    (band(cut('832436', 1.0, 1.55, pitch=1.12, fade_in=.02, fade_out=.25), 500, 7000), .18, .3)),
    ['761330', '632344', '832436'], 'the nine tails flare into a sun of fox-fire (0-650 ms)')
# 650 ms, the glaive drawn back and growing: a deep fire swell, pitched low, rising for ~0.5 s.
save('f3-draw', mix(.7,
    (env(band(cut('186932', 1.0, 1.95, pitch=.72), 50, 4000), .4, .2), 0, 1.0),
    (env(band(cut('483316', .7, 1.3, pitch=.85), 80, 4000), .3, .2), .05, .5)),
    ['186932', '483316'], 'the glaive drawn back, growing off-stage behind her (650-1250 ms)', bright=False)
# 1250 ms, the flat spinning sweep: a rope-like spinning whirl and a fire whoosh circling the stage.
save('f3-sweep', mix(.4,
    (env(band(cut('719638', 1.36, 1.66, pitch=1.15), 120), .03, .12), 0, .9),
    (env(band(cut('260555', .1, .5), 100), .04, .2), 0, .8)),
    ['719638', '260555'], 'the glaive spun flat round her, a ring of fire sweeping the stage (1250-1420 ms)')
# 1350 ms, the colossal crescent cut: a bright blade shing over a fast heavy swoosh.
save('f3-crescent', mix(.6,
    (band(cut('507466', .17, .6, pitch=.85, fade_out=.15), 150), 0, .9),
    (band(cut('786713', 2.78, 3.2, pitch=.8, fade_out=.2), 1200), .03, .6)),
    ['507466', '786713'], 'the colossal crescent of fox-fire cuts through the foe (1350 ms)')
# 1420 ms, the nine-tailed sun bursts on the foe: a fire explosion with a long rolling roar.
save('f3-sun', mix(1.6,
    (cut('855898', 0, 1.2, fade_in=.001, fade_out=.4), 0, 1.0),
    (env(band(cut('186932', 1.75, 3.1), 60), .02, .6), .04, .7),
    (band(cut('513694', .08, .6, pitch=.75, fade_out=.2), None, 800), 0, .6)),
    ['855898', '186932', '513694'], 'the nine-tailed sun bursts on the foe (hit at 1420 ms)', bright=False)
# 1550 ms, nine fox-fire spirits race in: light quick padding as they run, then nine small fiery
# pops as each one bursts on the foe (at +0.45 s + i x 0.06 s, as in mikaFoxSpirits).
pop = lambda i: band(cut('431174', 0, .22, pitch=1.5 + .06 * (i % 3), fade_out=.12), 300)
save('f3-spirits', mix(1.25,
    (env(band(cut('827320', 3.7, 4.35, pitch=1.35), 300), .05, .2), 0, .8),
    (band(cut('463766', .1, .38, pitch=1.2, fade_out=.1), 400), .08, .45),
    *[(pop(i), .45 + .06 * i, .45) for i in range(9)]),
    ['827320', '463766', '431174'], 'nine fox-fire spirits run in and burst one by one (1550-2050 ms)')
# ~2350 ms, the burn takes hold: the foe left sizzling.
save('f3-burn', mix(1.0,
    (env(band(cut('137262', .25, 1.2), 800), .03, .45), 0, 1.0),
    (env(band(cut('181563', 3.2, 4.1), 500), .05, .4), .05, .5)),
    ['137262', '181563'], 'the burn takes hold on the foe (recover, before THIÊU ĐỐT)', level=.8)

(AUDIO / 'hero-forms/fire-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
