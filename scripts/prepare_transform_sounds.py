"""Biến Thân sounds (docs/GAME_DESIGN.md §2.4, src/transform-fx.js), one hero at a time; Mika first.

Two cues for the whole transformation (Codex plan, assets/gemwoven/raw/transform-fire/critique.md): the flare-up when
BIẾN THÂN is pressed and a short, quiet crackle when the transformed turns end. The turns themselves and the afterglow are
silent. Each clip is ONE clean real recording, minimally edited: an excerpt with its natural attack and decay, a gentle
high-pass, gain (peak <= 0.82, no limiting) and short edge fades. No layering, pitch or time change, no synthesis.
Output: assets/audio/hero-forms/transform/*.wav and assets/audio/hero-forms/transform-manifest.json (merged by build.py
into ART.castSounds as <hero>-transform / <hero>-transform-end). Rebuild: python scripts/prepare_transform_sounds.py
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
OUT = AUDIO / 'hero-forms/transform'
RATE = 32000
USED = {}


def source(key):
    folder = next((AUDIO / 'sources/freesound').glob(f'{key}-*'))
    meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
    return folder / meta['file'], {k: meta[k] for k in ('title', 'author', 'source_url', 'license', 'sha256')}


def clip(name, key, start, end, beat, fade_in=.006, fade_out=.12, highpass=45, rms=.1):
    path, meta = source(key)
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    x = np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    x *= min(.82 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    USED[name] = {'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
                  'license': meta['license'], 'sources': [meta],
                  'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
                  'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[name]['duration'], 's peak', USED[name]['peak'], 'rms', USED[name]['rms'])


# Mika: a flame bursting alight (the fox spirit flaring up), then a quiet crackle as the flames sink to coals.
# Levels sit under her ultimate's damage hit (rms .11-.14): the flare ~5 dB lower, the crackle ~10 dB under the flare.
clip('fire-transform', '637533', 0, .84, 'the fox spirit flares up (BIẾN THÂN pressed, from 80 ms)', fade_in=.004, fade_out=.18, rms=.065)
clip('fire-transform-end', '181563', 1.55, 2.0, 'the flames sink to coals (last transformed turn ends)', fade_in=.03, fade_out=.18, rms=.02)
# The other heroes (Codex five-hero plan, assets/gemwoven/raw/transform-fire/plan-other-heroes.md); each end cue ~10 dB
# under its flare. Hiro: a light whoosh and a cloth flap. Yuki: an arctic breeze rising and one crystal bell. Nori: a single
# wood creak and leaves settling. Lumi: one electric zap and static dying out. Noct: a dark whoosh, and silence at the end.
clip('novice-transform', '701104', .2, .85, "a wayfarer's light rises (BIẾN THÂN pressed)", fade_in=.004, fade_out=.2, rms=.06)
clip('novice-transform-end', '391945', .08, .38, 'a cloth flap settles (last transformed turn ends)', fade_in=.005, fade_out=.1, rms=.02)
clip('ice-transform', '407029', .75, 1.6, 'a cold breeze rises around her (BIẾN THÂN pressed)', fade_in=.2, fade_out=.25, rms=.06)
clip('ice-transform-end', '614832', 0, .55, 'one crystal bell as the frost settles (last transformed turn ends)', fade_in=.003, fade_out=.25, rms=.02)
clip('earth-transform', '506665', .03, .83, 'old wood creaks under load (BIẾN THÂN pressed)', fade_in=.004, fade_out=.2, rms=.06)
clip('earth-transform-end', '765965', 29.05, 29.5, 'leaves settle (last transformed turn ends)', fade_in=.05, fade_out=.15, rms=.02)
clip('lightning-transform', '375168', 0, .45, 'one electric zap (BIẾN THÂN pressed)', fade_in=.003, fade_out=.15, rms=.055)
clip('lightning-transform-end', '245942', 6.0, 6.25, 'static dies out (last transformed turn ends)', fade_in=.02, fade_out=.12, rms=.016)
clip('shadow-transform', '431976', .3, 1.1, 'a dark whoosh (BIẾN THÂN pressed)', fade_in=.02, fade_out=.3, rms=.06)
(AUDIO / 'hero-forms/transform-manifest.json').write_text(json.dumps(USED, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
