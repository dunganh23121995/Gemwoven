"""Nori's star-form ultimate sounds (src/forms-nori.js), edited from real CC0 recordings.

Writes assets/audio/hero-forms/earth/*.wav and assets/audio/hero-forms/earth-manifest.json (merged by build.py
into ART.castSounds; played as playCastSound('earth', '<name>')). Sources: assets/audio/sources/freesound/<id>-*/
(source.json: title, author, URL, CC0 licence, SHA-256) and the credited shield bash in sources/mika-nori.
Each sound is fitted to one beat of the staging:
  f2-gather / f3-gather  hammer raised in the healing spiral: leaves stirring, (six stars) a deep trunk creak
  f2-slam   / f3-slam    the hammer hits the ground: heavy stone impact, the shield-bash crunch, soil cracking
  f2-bind                jade sapling and vines burst at the foe's feet: plants shooting up, roots cracking
                         through soil, a ringing jade (crystal glass) tone and glassy chimes
  f3-grow                the world-tree rises: deep wooden groans of a growing trunk, slow creaks, plant growth,
                         roots cracking, leaves rustling as the crown opens
Rebuild: python scripts/prepare_nori_form_sounds.py"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import imageio_ffmpeg
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt, resample_poly

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio'
SOURCES = ROOT / 'sources'
OUT = ROOT / 'hero-forms/earth'
RATE = 32000
TARGET_RMS, PEAK = .12, .5


def source(ref):
    """'fs:<id>' (Freesound folder) or 'mika-nori:<file>' -> (path, credit)"""
    kind, key = ref.split(':', 1)
    if kind == 'fs':
        folder = next((SOURCES / 'freesound').glob(f'{key}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        return folder / meta['file'], {k: meta[k] for k in ('title', 'author', 'source_url', 'license', 'sha256')}
    meta = next(s for s in json.loads((SOURCES / 'mika-nori/sources.json').read_text()) if s['file'] == key)
    return SOURCES / 'mika-nori' / key, {'title': 'Shield Bash Impact', **{k: meta[k] for k in ('author', 'source_url', 'license', 'sha256')}}


_cache = {}
def load(ref):
    if ref not in _cache:
        path, credit = source(ref)
        pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
        x = np.frombuffer(pcm, '<f4').astype(float)
        _cache[ref] = (x - x.mean(), credit)
    return _cache[ref]


def clip(ref, start, end, pitch=1.0, fade_in=.01, fade_out=.08):
    """a window of a recording; pitch != 1 resamples (pitch and length change together)"""
    x, _ = load(ref)
    y = x[int(start * RATE):int(end * RATE)].copy()
    if pitch != 1:
        up, down = int(round(1000 / pitch)), 1000
        y = resample_poly(y, up, down)
    n = len(y); t = np.arange(n) / RATE
    y *= np.minimum(1, t / max(fade_in, 1e-3)) * np.minimum(1, (n / RATE - t) / max(fade_out, 1e-3))
    return y


def band(y, lo=None, hi=None):
    if lo: y = sosfiltfilt(butter(2, lo, btype='highpass', fs=RATE, output='sos'), y)
    if hi: y = sosfiltfilt(butter(2, hi, btype='lowpass', fs=RATE, output='sos'), y)
    return y


def norm(y):
    return y / max(1e-6, np.sqrt(np.mean(y * y)))


def mix(length, layers):
    """layers: (at seconds, signal, gain); each signal is first brought to unit RMS so the gains are a balance"""
    out = np.zeros(int(length * RATE))
    for at, y, gain in layers:
        y = norm(y) * gain; i = int(at * RATE); n = min(len(y), len(out) - i)
        out[i:i + n] += y[:n]
    return out


def swell(y, attack):
    t = np.arange(len(y)) / RATE
    return y * np.clip(t / attack, 0, 1) ** 1.6


SOUNDS = {
    # 0 ms: the hammer rises inside the healing spiral (about 0.95 s before the next beat)
    'f2-gather': (1.0, lambda: [(0, swell(band(clip('fs:368453', 4.6, 5.6, fade_out=.25), 300), .7), 1.0),
                                (.15, swell(band(clip('fs:479160', .2, 1.0, fade_out=.3), 400), .6), .45)]),
    'f3-gather': (1.1, lambda: [(0, swell(band(clip('fs:368453', 4.6, 5.7, fade_out=.25), 250), .7), 1.0),
                                (.05, swell(band(clip('fs:848983', .9, 2.0, pitch=.82, fade_out=.3), 60, 2500), .8), .55)]),
    # the hammer meets the ground (0 = contact)
    'f2-slam': (1.1, lambda: [(0, band(clip('fs:513694', .06, 1.1, fade_in=.002), 40), 1.0),
                              (0, band(clip('mika-nori:shield-bash.mp3', .08, .9, fade_in=.002), 60, 3500), .55),
                              (.05, band(clip('fs:222521', .5, 1.5, fade_out=.4), 80), .45)]),
    'f3-slam': (1.4, lambda: [(0, band(clip('fs:513694', .06, 1.1, pitch=.85, fade_in=.002), 30), 1.0),
                              (0, band(clip('mika-nori:shield-bash.mp3', .08, .9, pitch=.9, fade_in=.002), 50, 3000), .6),
                              (.04, band(clip('fs:222521', .5, 1.8, fade_out=.5), 60), .6)]),
    # 0 = the jade vines burst at the foe's feet; the jade ring blooms as the sapling opens (+0.3 s)
    'f2-bind': (2.0, lambda: [(0, band(clip('fs:735401', 1.5, 2.6, fade_out=.3), 120), .7),
                              (.02, band(clip('fs:479160', 0, 1.55, fade_out=.3), 200), .8),
                              (.25, band(clip('fs:419146', .35, 2.0, pitch=1.5, fade_in=.004, fade_out=.9), 500), .45),
                              (.3, band(clip('fs:707618', 8.65, 10.0, fade_in=.004, fade_out=.6), 900), .3)]),
    # 0 = the roots burst; the trunk groans up through the next two seconds as the crown opens
    'f3-grow': (2.8, lambda: [(0, band(clip('fs:735401', 1.5, 2.8, fade_out=.4), 100), .65),
                              (.05, band(clip('fs:848983', .5, 2.6, pitch=.72, fade_in=.05, fade_out=.5), 40, 2200), 1.0),
                              (.35, band(clip('fs:218163', 4.3, 5.9, pitch=.85, fade_in=.05, fade_out=.4), 40, 2500), .6),
                              (.1, band(clip('fs:648958', 3.4, 5.2, fade_in=.05, fade_out=.4), 150), .45),
                              (.9, band(clip('fs:368453', 5.6, 7.5, fade_in=.25, fade_out=.6), 250), .6)]),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, (length, layers) in SOUNDS.items():
        built = layers()
        y = mix(length, built)
        n = len(y); t = np.arange(n) / RATE
        y *= np.minimum(1, (n / RATE - t) / .12)
        # level like the other cast sounds: toward the target RMS, at most +9.5 dB above a plain peak
        # normalisation, then a soft (tanh) limiter keeps the transients under the peak ceiling
        y *= min(TARGET_RMS / max(1e-6, np.sqrt(np.mean(y * y))), 3 * PEAK / max(1e-6, np.abs(y).max()))
        y = PEAK * np.tanh(y / PEAK)
        file = OUT / f'nori-{name}.wav'
        wavfile.write(file, RATE, np.round(y * 32767).astype(np.int16))
        refs = sorted({ref for ref in SOURCE_REFS[name]})
        manifest['earth-' + name] = {'file': file.relative_to(ROOT).as_posix(), 'duration': round(n / RATE, 3),
                                     'sources': [load(ref)[1] for ref in refs],
                                     'license': ' + '.join(sorted({load(ref)[1]['license'] for ref in refs})),
                                     'peak': round(float(np.abs(y).max()), 4), 'rms': round(float(np.sqrt(np.mean(y * y))), 4),
                                     'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
    (ROOT / 'hero-forms/earth-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({k: {n: v[n] for n in ('duration', 'peak', 'rms')} for k, v in manifest.items()}, indent=1))


SOURCE_REFS = {
    'f2-gather': ['fs:368453', 'fs:479160'], 'f3-gather': ['fs:368453', 'fs:848983'],
    'f2-slam': ['fs:513694', 'mika-nori:shield-bash.mp3', 'fs:222521'], 'f3-slam': ['fs:513694', 'mika-nori:shield-bash.mp3', 'fs:222521'],
    'f2-bind': ['fs:735401', 'fs:479160', 'fs:419146', 'fs:707618'],
    'f3-grow': ['fs:735401', 'fs:848983', 'fs:218163', 'fs:648958', 'fs:368453'],
}

if __name__ == '__main__':
    main()
