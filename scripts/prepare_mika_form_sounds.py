"""Mika's four- and six-star ultimate sounds (src/forms-mika.js): a few well-spaced cues per ultimate.

Like form 1's sounds (scripts/prepare_mika_nori_audio.py), each clip is ONE clean real recording (checked:
no clipping, low noise floor), minimally edited: an excerpt with its natural attack and decay, a gentle
high-pass, gain (never past a 0.82 peak, no limiting or saturation) and short edge fades. No layering, pitch
shifting, time-stretching or synthesis. Few, long clips; each ultimate ends on a long roaring-fire tail that
starts on the damage hit and rings out with its natural decay, as form 1's 3.9 s flame whoosh does.
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
from scipy.signal import butter, sosfilt

AUDIO = Path(__file__).resolve().parents[1] / 'assets/audio'
OUT = AUDIO / 'hero-forms/fire'
RATE = 32000
KATANA = {'author': 'Taira Komori (TK\'S FREE SOUND FX)', 'source_url': 'https://taira-komori.net/jidaigeki01en.html',
          'license': 'TK\'S FREE SOUND FX terms (free use and processing in games, credit), https://taira-komori.net/freesounden.html'}


def source(ref):
    """('freesound', id) -> its folder's source.json; ('mika-nori'|'katana', file) -> the project's record."""
    kind, key = ref
    if kind == 'freesound':
        folder = next((AUDIO / 'sources/freesound').glob(f'{key}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        return folder / meta['file'], {'title': meta['title'], 'author': meta['author'], 'source_url': meta['source_url'],
                                       'license': meta['license'], 'sha256': meta['sha256']}
    path = AUDIO / 'sources' / kind / key
    if kind == 'mika-nori':
        meta = next(s for s in json.loads((path.parent / 'sources.json').read_text(encoding='utf-8')) if s['file'] == key)
        return path, {'title': key, 'author': meta['author'], 'source_url': meta['source_url'], 'license': meta['license'], 'sha256': meta['sha256']}
    return path, {'title': key, **KATANA, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def read(path):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                   '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)


USED = {}


def clip(name, ref, start, end, beat, fade_in=.006, fade_out=.12, highpass=45, rms=.11):
    """One recording, [start, end) s, a gentle high-pass, short edge fades, gain to form 1's level."""
    path, meta = source(ref)
    x = read(path)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    x *= min(.82 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    USED[f'fire-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'license': meta['license'], 'sources': [meta],
        'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'fire-{name}']['duration'], 's peak', USED[f'fire-{name}']['peak'], 'rms', USED[f'fire-{name}']['rms'])


# Hits are synced to their frames (measured in the studio, src/forms-mika.js); the beds breathe with their
# natural attack and decay; the final tail starts on the damage hit and rings out well past the visuals.

# ---- Four-star: Hồ Diễm Long Trảm (mikaLongCleave, visuals 0-2300 ms) -----------------------------
# 0 ms, the broadsword raised: a steel blade drawn and ringing.
clip('f2-raise', ('katana', 'extracting_a_sword1.mp3'), 0, .3, 'sword raised upright (0-300 ms)', fade_out=.08)
# 0-1300 ms, the fox-fire blade lighting up and towering: a flamethrower igniting and roaring, fading
# under the cleave and the hit.
clip('f2-blaze', ('freesound', '395039'), 2.15, 3.45, 'fox-fire blade ignites and towers (0-1300 ms)', fade_in=.005, fade_out=.3)
# 950-1170 ms, the overhead cleave: a blade cutting the air, peaking as it comes down.
clip('f2-cleave', ('katana', 'sword_attack1.mp3'), 0, .22, 'giant blade swung down (950-1170 ms)', fade_in=.003, fade_out=.05)
# 1170 ms, the slam through the foe: a fire explosion.
clip('f2-impact', ('freesound', '843247'), 0, .74, 'slam through the foe (1170 ms)', fade_in=.002, fade_out=.1)
# From the hit, 4.1 s: the flames roar across the stage, the floor cut burns, and the fire dies away with
# the recording's own shut-off decay (the end of a long flamethrower burst).
clip('f2-tail', ('freesound', '395039'), 9.4, 13.5, 'flames roar across the stage and ring out (from the hit, 1170 ms)', fade_in=.04, fade_out=.25)

# ---- Six-star: Cửu Dương Hồ Diễm (mikaNineSunSweep, visuals 0-2850 ms) ----------------------------
# 0-950 ms, the nine tails flare into a sun: a magic-fire bloom and its natural decay.
clip('f3-flare', ('freesound', '761330'), .5, 1.45, 'nine tails flare into a sun (0-950 ms)', fade_in=.02, fade_out=.15)
# 650-1600 ms, the glaive drawn back and growing: the same recording's second fire movement.
clip('f3-draw', ('freesound', '761330'), 2.65, 3.6, 'glaive drawn back and growing (650-1600 ms)', fade_in=.03, fade_out=.15)
# 1250 ms, the flat spinning sweep and crescent cut: a fire whoosh and its decay.
clip('f3-sweep', ('freesound', '260555'), .18, .7, 'spinning sweep and crescent cut (1250 ms)', fade_in=.003, fade_out=.15)
# 1420 ms, the nine-tailed sun bursts on the foe: a fire explosion.
clip('f3-sun', ('freesound', '855898'), 0, 1.23, 'nine-tailed sun bursts on the foe (1420 ms)', fade_in=.002, fade_out=.2)
# Each wave of fox-fire spirits bursting on the foe (2000, 2240, 2480 ms): one fireball impact per wave.
clip('f3-fireball', ('freesound', '252092'), 0, .5, 'a wave of fox-fire spirits bursts on the foe (once per wave)', fade_in=.002, fade_out=.2)
# From the hit, 5.6 s: a napalm fireball roaring up under the spirits' run and bursts, then dying away
# with its full natural decay.
clip('f3-tail', ('freesound', '674902'), .35, 5.95, 'the fire roars on the foe and rings out (from the hit, 1420 ms)', fade_in=.01, fade_out=.3)

(AUDIO / 'hero-forms/fire-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
