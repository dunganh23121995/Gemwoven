"""Mika's four- and six-star ultimate sounds (src/forms-mika.js): a few well-spaced cues per ultimate.

Like form 1's sounds (scripts/prepare_mika_nori_audio.py), each clip is ONE real recording, minimally
edited: an excerpt with its natural attack and decay, a gentle high-pass, gain and short edge fades.
No layering, pitch shifting, time-stretching or synthesis. Where the beat is the same kind as form 1's,
the same recording is used (hnhnh's fire whoosh, Taira Komori's katana).
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


# Each clip is cut to the visible segment it scores (measured in the studio, src/forms-mika.js), its
# natural attack on the segment's first frame: continuous effects get a continuous bed, each burst its
# own synced hit (one clip, played once per burst), big moments keep their natural tail.

# ---- Four-star: Hồ Diễm Long Trảm (mikaLongCleave, 2300 ms) --------------------------------------
# 0-300 ms, the broadsword raised: a steel blade drawn and ringing (over the fire bed).
clip('f2-raise', ('katana', 'extracting_a_sword1.mp3'), 0, .3, 'sword raised upright (0-300 ms)', fade_out=.08)
# 0-1170 ms, the fox-fire blade igniting and towering until the cleave lands: a flamethrower lighting
# up and roaring.
clip('f2-blaze', ('freesound', '490166'), .9, 2.07, 'fox-fire blade ignites and towers (0-1170 ms)', fade_in=.01, fade_out=.12)
# 950-1170 ms, the overhead cleave: a blade cutting the air, peaking as it comes down.
clip('f2-cleave', ('katana', 'sword_attack1.mp3'), 0, .22, 'giant blade swung down (950-1170 ms)', fade_in=.003, fade_out=.05)
# 1170-1640 ms, the slam through the foe: a fire eruption's whoomph and first roar.
clip('f2-impact', ('freesound', '828433'), .93, 1.4, 'slam through the foe (1170-1640 ms)', fade_in=.003, fade_out=.15)
# 1250-2300 ms, the flames roaring across the stage (blade lying through the foe until ~1670, floor cut
# burning 1280-1820) and dying away: the end of a long flamethrower burst with its natural tail.
clip('f2-roar', ('freesound', '395039'), 12.25, 13.3, 'flames roar across the stage, floor cut burning, dying away (1250-2300 ms)', fade_in=.08, fade_out=.06)

# ---- Six-star: Cửu Dương Hồ Diễm (mikaNineSunSweep, 2850 ms) -------------------------------------
# 0-650 ms, the nine tails flare into a sun behind her: a magic-fire bloom.
clip('f3-flare', ('freesound', '761330'), .5, 1.15, 'nine tails flare into a sun (0-650 ms)', fade_in=.02, fade_out=.15)
# 650-1250 ms, the glaive drawn back and growing: a fire rising toward the sweep.
clip('f3-draw', ('freesound', '186932'), 1.0, 1.6, 'glaive drawn back and growing (650-1250 ms)', fade_in=.08, fade_out=.08)
# 1250-1420 ms, the flat spinning sweep and crescent cut: one fast fire whoosh.
clip('f3-sweep', ('freesound', '260555'), .18, .35, 'spinning sweep and crescent cut (1250-1420 ms)', fade_in=.003, fade_out=.05)
# 1420-2050 ms, the nine-tailed sun bursting on the foe (ring and crescent fading under it): an
# explosion with its rolling tail.
clip('f3-sun', ('freesound', '855898'), 0, .63, 'nine-tailed sun bursts on the foe (1420-2050 ms)', fade_in=.002, fade_out=.15)
# Each wave of fox-fire spirits bursting on the foe (2000, 2240, 2480 ms): one fireball impact per wave.
clip('f3-fireball', ('freesound', '252092'), 0, .3, 'a wave of fox-fire spirits bursts on the foe (once per wave)', fade_in=.002, fade_out=.1)
# 1550-2850 ms, the spirits running in and the foe burning under their bursts: a large fire roaring
# and crackling, faded out with the last flames.
clip('f3-burning', ('freesound', '698209'), .25, 1.55, 'fire spirits run in, the foe burns under their bursts (1550-2850 ms)', fade_in=.12, fade_out=.25)

(AUDIO / 'hero-forms/fire-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
