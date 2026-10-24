"""Yuki's four- and six-star ultimate sounds (src/forms-yuki.js), one clip per visual beat.

Every clip is built from real CC0 recordings (Freesound public HQ MP3 previews kept in
assets/audio/sources/freesound/<id>-<slug>/ with source.json): excerpts, resampling for pitch,
band filters, fades, layering and a few short stereo reflections. No synthesis.
Output: assets/audio/hero-forms/ice/*.wav and assets/audio/hero-forms/ice-manifest.json
(merged by build.py into ART.castSounds as ice-<name>).
Rebuild: python scripts/prepare_yuki_form_sounds.py
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
OUT = AUDIO / 'hero-forms/ice'
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


def cut(sid, start, end, pitch=1.0, fade_in=.004, fade_out=.05):
    """An excerpt [start, end) s of a recording; pitch > 1 resamples it higher (and shorter)."""
    x = read(sid)[round(start * RATE):round(end * RATE)].copy()
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


def save(name, x, sources, beat, bright=True):
    # A few short reflections give the dry foley a little air and stereo width.
    stereo = np.column_stack((x.copy(), x.copy()))
    tail = band(x, 300, 9000) if bright else band(x, 80, 2500)
    for at, gain, side in [(.031, .16, 0), (.053, .14, 1), (.097, .10, 0), (.149, .08, 1), (.211, .05, 0)]:
        n = round(at * RATE); stereo[n:, side] += tail[:-n] * gain
    rms = float(np.sqrt(np.mean(stereo ** 2))); peak = float(np.abs(stereo).max())
    # Loudness to the other cast sounds (rms ~.12) with peaks <= .5: transient-heavy ice cracks are
    # brought up and their sharpest peaks rounded by a soft limiter (at most ~7.6 dB of limiting).
    stereo *= min(.12 / max(rms, 1e-6), 1.2 / max(peak, 1e-6))
    stereo = .5 * np.tanh(stereo / .5)
    stereo[-round(RATE * .03):] *= np.linspace(1, 0, round(RATE * .03))[:, None]
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(stereo * 32767).astype(np.int16))
    metas = [(read(s), _cache[s][1])[1] for s in sources]
    USED[f'ice-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'sources': [f"#{s} \"{m['title']}\" by {m['author']}, {m['source_url']}" for s, m in zip(sources, metas)],
        'license': 'CC0-1.0 source recordings (excerpted, filtered, resampled, layered)',
        'peak': round(float(np.abs(stereo).max()), 3), 'rms': round(float(np.sqrt(np.mean(stereo ** 2))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'ice-{name}']['duration'], 's peak', USED[f'ice-{name}']['peak'], 'rms', USED[f'ice-{name}']['rms'])


# ---- Four-star: Nguyệt Sương Băng Giáng -----------------------------------------------------------
# Moonrise (560 ms): a soft shimmering mark-tree glissando with a few crystal sparkles over it.
save('f2-moonrise', mix(1.7,
    (swell(band(cut('271355', 1.0, 2.7, fade_out=.5), 900), .25), 0, 1.0),
    (band(cut('639429', .1, 1.6, pitch=1.12, fade_out=.6), 1500), .12, .35)),
    ['271355', '639429'], 'moon rises behind her (skill frame 2)')
# Moonbeam (1250 ms): a falling air rush that lands on the foe (+0.17 s) with a struck crystal bell.
beam_rush = band(cut('683096', .46, .72, pitch=.9, fade_in=.03, fade_out=.03), 400, 9000)
save('f2-beam', mix(1.6,
    (beam_rush, 0, .8),
    (cut('614832', 0, 1.4, pitch=1.5, fade_out=.5), .08, .9),
    (band(cut('639429', .05, 1.4, pitch=.9, fade_out=.5), 1200), .14, .45)),
    ['683096', '614832', '639429'], 'column of frozen moonlight lands on the foe at +0.17 s')
# Frost spikes (1420 ms): a run of real ice cracks rising for ~0.3 s as the spikes grow.
save('f2-spikes', mix(.8,
    (band(cut('452645', 4.72, 5.40, fade_out=.12), 250), 0, 1.0),
    (band(cut('703115', 0, .45, pitch=1.25), 300), .2, .55)),
    ['452645', '703115'], 'ice spikes crackle up round the foe (seal frames 0-3)')
# Freeze (1700 ms): frost hiss tightening, a hard ice creak and a high glass ping as it locks.
save('f2-freeze', mix(1.0,
    (band(cut('844260', .2, 1.0, fade_in=.03, fade_out=.25), 1800), 0, .45),
    (band(cut('437323', 2.27, 2.6, fade_out=.1), 400), .02, .9),
    (cut('745014', 0, 1.0, pitch=1.35, fade_out=.45), .05, .45)),
    ['844260', '437323', '745014'], 'the ice prison freezes tight (seal frame 4)')
# Shatter (2240 ms): the prison breaks like glass, then shards tinkle down.
save('f2-shatter', mix(1.9,
    (cut('422633', .26, 1.1, fade_in=.002, fade_out=.3), 0, 1.0),
    (band(cut('329744', 1.08, 1.9, fade_in=.002, fade_out=.4), 350), .01, .55),
    (band(cut('789213', .25, 1.9, fade_out=.7), 1500), .12, .5)),
    ['422633', '329744', '789213'], 'glassy shatter of the ice prison (damage beat)', bright=True)

# ---- Six-star: Thiên Nguyệt Tuyết Liên ------------------------------------------------------------
# Aegis (0 ms): ice armour plates clink round her as they spiral up (pings rising in pitch).
ping = lambda p: cut('745014', 0, .6, pitch=p, fade_out=.3)
save('f3-aegis', mix(1.2,
    (band(cut('437323', .2, .5, fade_out=.1), 500), 0, .7),
    (ping(1.0), .08, .35), (ping(1.19), .2, .32), (ping(1.41), .33, .3), (ping(1.68), .46, .28),
    (band(cut('437323', 1.86, 2.1, fade_out=.08), 500), .38, .55)),
    ['437323', '745014'], 'ice armour plates clink as the aegis spirals up her (0-0.56 s)')
# Fan (640 ms): the frost fan snaps open, then a snowy gust carries to the foe (~0.48 s).
save('f3-fan', mix(1.3,
    (cut('805399', 0, .6, fade_out=.15), 0, .9),
    (band(cut('569109', .95, 2.05, fade_in=.08, fade_out=.35), 250, 9000), .08, .9),
    (band(cut('639429', .1, 1.2, pitch=1.3, fade_out=.4), 2500), .25, .3)),
    ['805399', '569109', '639429'], 'fan swish and snowy gust (skill frame 2, gust strip)')
# Bloom (840 ms): crystal growth, ice creaking open while a crystal bell swells under a bell-tree shimmer.
save('f3-bloom', mix(1.5,
    (swell(band(cut('452645', .45, 1.35, fade_out=.25), 300), .2), 0, .55),
    (swell(cut('858114', .0, 1.5, pitch=1.5, fade_out=.5), .35), 0, .5),
    (band(cut('145578', .9, 2.2, fade_out=.5), 1500), .12, .55)),
    ['452645', '858114', '145578'], 'the ice lotus blooms open under the foe (lotus frames 0-2)')
# Halberd (1440 ms; the whoosh peaks at +0.06 s on the crescent cut at 1500 ms).
save('f3-halberd', mix(.8,
    (cut('507466', .2, .9, fade_in=.01, fade_out=.25), 0, 1.0),
    (band(cut('240640', 0, .3, pitch=.9), 1500), .02, .6)),
    ['507466', '240640'], 'moon halberd swish (skill frame 4)')
# Close (1600 ms): petals grind shut in 0.19 s, a final crunch and a frost hiss as it seals.
save('f3-close', mix(1.0,
    (band(cut('452645', 5.20, 5.62, fade_out=.06), 250), 0, .8),
    (cut('703115', .15, .5), .17, .8),
    (band(cut('844260', .3, .9, fade_in=.05, fade_out=.25), 2000), .2, .35)),
    ['452645', '703115', '844260'], 'the lotus closes round the foe (lotus frames 3-4)')
# Burst (2240 ms): a big crystalline break, a second ice blast and a long tinkling fall of shards and snow.
save('f3-burst', mix(2.4,
    (cut('422633', .26, 1.1, fade_in=.002, fade_out=.3), 0, 1.0),
    (band(cut('329744', 6.52, 7.4, fade_in=.002, fade_out=.4), 250), .02, .8),
    (band(cut('789213', .25, 2.2, fade_out=.8), 1200), .1, .6),
    (band(cut('271355', 3.0, 4.6, fade_out=.8), 1500), .35, .5)),
    ['422633', '329744', '789213', '271355'], 'the lotus bursts into snow petals (damage beat)')

(AUDIO / 'hero-forms/ice-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
