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


# Each clip is cut to its motion on screen (beat start-end in src/forms-mika.js, measured in the studio):
# its natural attack on the motion's first frame, faded out by the time the next motion starts.

# ---- Four-star: Hồ Diễm Long Trảm (mikaLongCleave) -----------------------------------------------
# 0-300 ms, the broadsword raised: a steel blade drawn and ringing.
clip('f2-raise', ('katana', 'extracting_a_sword1.mp3'), 0, .3, 'sword raised upright (0-300 ms)', fade_out=.08)
# 300-950 ms, the blade blazes up into fox-fire: form 1's fire whoosh, its rising first 0.65 s.
clip('f2-blaze', ('mika-nori', 'fire-whoosh.mp3'), .12, .77, 'blade blazes up into fox-fire (300-950 ms)', fade_in=.03, fade_out=.08)
# 950-1170 ms, the overhead cleave: a blade cutting the air, peaking as it comes down.
clip('f2-cleave', ('katana', 'sword_attack1.mp3'), 0, .22, 'giant blade swung down (950-1170 ms)', fade_in=.003, fade_out=.05)
# 1170-1850 ms, the slam through the foe and the cut burning on the floor: a fire eruption and its
# crackling decay, faded out as she recovers.
clip('f2-impact', ('freesound', '828433'), .93, 1.61, 'slam through the foe, cut burning on the floor (1170-1850 ms)', fade_in=.003, fade_out=.25)

# ---- Six-star: Cửu Dương Hồ Diễm (mikaNineSunSweep) ----------------------------------------------
# 0-650 ms, the nine tails flare into a sun: a magic-fire bloom.
clip('f3-flare', ('freesound', '761330'), .5, 1.15, 'nine tails flare into a sun (0-650 ms)', fade_in=.02, fade_out=.15)
# 650-1250 ms, the glaive drawn back and growing: a fire rising toward the sweep.
clip('f3-draw', ('freesound', '186932'), 1.0, 1.6, 'glaive drawn back and growing (650-1250 ms)', fade_in=.08, fade_out=.08)
# 1250-1420 ms, the flat spinning sweep and crescent cut: one fast fire whoosh.
clip('f3-sweep', ('freesound', '260555'), .18, .35, 'spinning sweep and crescent cut (1250-1420 ms)', fade_in=.003, fade_out=.05)
# 1420-2350 ms, the nine-tailed sun bursts on the foe (the spirits run in under its decay).
clip('f3-sun', ('freesound', '855898'), 0, .93, 'nine-tailed sun bursts on the foe (1420-2350 ms)', fade_in=.002, fade_out=.25)
# 2350-2850 ms, the burn takes hold: the foe left sizzling.
clip('f3-burn', ('freesound', '137262'), .25, .75, 'the burn takes hold (2350-2850 ms)', fade_in=.01, fade_out=.15, highpass=300, rms=.09)

(AUDIO / 'hero-forms/fire-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
