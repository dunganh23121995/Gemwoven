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
def excerpt(key, start, end, highpass, fade_in, fade_out, lowpass=None):
    """One recording's excerpt at RATE, stereo, gently high-passed (and low-passed when it carries hiss), with edge fades."""
    path, meta = source(key)
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    x = np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    if lowpass:
        x = sosfilt(butter(4, lowpass, btype='lowpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    return x, meta


def surge(name, spec, beat, rms, out=None):  # one recording only (kept for a surge without a boom)
    """One recording: an excerpt (high-passed, low-passed to take its hiss off, faded) at one gain, peak <= 0.89 (-1 dBFS)."""
    x, meta = excerpt(*spec)
    x *= min(.89 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
    folder = out or OUT
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    if out:
        return target
    USED[name] = {'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
                  'license': meta['license'], 'sources': [meta],
                  'processing': f'excerpt {spec[1]:.2f}-{spec[2]:.2f} s of one recording, {spec[3]} Hz high-pass, {spec[6]} Hz low-pass (hiss), edge fades, gain',
                  'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[name]['duration'], 's peak', USED[name]['peak'], 'rms', USED[name]['rms'])


def surge_and_boom(name, surge_spec, boom_spec, at, beat, rms, boom_gain=1.0, out=None, book=None):
    """Two natural recordings, nothing else: a rising surge, then a deep boom laid in at `at` seconds where the spirit reaches
    full size. Each is trimmed, filtered (high-pass, a low-pass against hiss and crunch) and faded; one gain, peak <= 0.89."""
    a, ma = excerpt(*surge_spec)
    b, mb = excerpt(*boom_spec)
    n = max(len(a), round(at * RATE) + len(b))
    x = np.zeros((n, 2))
    x[:len(a)] += a / max(1e-4, np.abs(a).max())
    x[round(at * RATE):round(at * RATE) + len(b)] += b / max(1e-4, np.abs(b).max()) * boom_gain
    x *= min(.89 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
    folder = out or OUT
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    if out and book is None:
        return target
    entry = (USED if book is None else book)
    entry[name] = {'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
                  'license': ma['license'], 'sources': [ma, mb],
                  'processing': f'surge {surge_spec[1]:.2f}-{surge_spec[2]:.2f} s ({surge_spec[3]} Hz high-pass, {surge_spec[6]} Hz low-pass) + boom {boom_spec[1]:.2f}-{boom_spec[2]:.2f} s at {at:.2f} s ({boom_spec[3]} Hz high-pass, {boom_spec[6]} Hz low-pass), edge fades, one gain',
                  'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, entry[name]['duration'], 's peak', entry[name]['peak'], 'rms', entry[name]['rms'])


# Shared by every hero (owner 04/11): the guardian spirit rising. A soft air blow builds up and, as the spirit stands at full
# size, a deep round low-tube impact lands with its long hum (the owner's picks: boom "b", rise "b3"). The fire whoosh tried
# first sounded raspy; both rises here are clean air (no crackle, nothing above ~5 kHz). Two CC0 recordings, trimmed,
# filtered and faded, one gain, no synthesis. Owner previews in assets/gemwoven/raw/transform2-fire/:
#   b3  a soft rising air blow -> the deep boom (in the game)
#   b2  a dark air whoosh -> the same boom (kept in the sound library as a spare, not played: assets/audio/library/spares)
BOOM_B = ('378558', 0.0, 3.6, 25, .003, 1.2, 2500)
RISES = {'b2': (('431976', 0.0, 1.05, 50, .25, .3, 5000), .7), 'b3': (('719560', 0.05, 1.0, 50, .2, .25, 5000), .6)}
rise, at = RISES['b3']
surge_and_boom('spirit-rise', rise, BOOM_B, at, 'the guardian spirit rises (every hero, BIẾN THÂN pressed)', rms=.11, boom_gain=1.0)
# The game plays the owner-approved preview itself, decoded unchanged (owner 04/11: "Tôi cần âm trong link"), under a new
# file name so no cached older take is served. Its boom is loudest at 0.88 s; the spirit dissolves into mist on that beat.
import subprocess
_b3 = AUDIO / 'hero-forms/transform/spirit-rise-b3.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(AUDIO.parent.parent / 'assets/gemwoven/raw/transform2-fire/spirit-sound-preview-b3.mp3'),
                '-ar', '32000', '-ac', '2', '-c:a', 'pcm_s16le', str(_b3)], check=True)
(AUDIO / 'hero-forms/transform/spirit-rise.wav').unlink(missing_ok=True)
USED['spirit-rise'].update(file='hero-forms/transform/spirit-rise-b3.wav', sha256=hashlib.sha256(_b3.read_bytes()).hexdigest(),
                           processing='the owner-approved preview spirit-sound-preview-b3.mp3 decoded as is (boom loudest at 0.88 s)')
SPARES = {}
rise, at = RISES['b2']
surge_and_boom('spirit-rise-gio-vut-tram', rise, BOOM_B, at, 'Linh thần xuất hiện · gió vút trầm (dự phòng)', rms=.11, boom_gain=1.0,
               out=AUDIO / 'library/spares', book=SPARES)
for v in SPARES.values():
    v['file'] = 'library/spares/' + Path(v['file']).name
(AUDIO / 'library/spares-manifest.json').write_text(json.dumps(SPARES, ensure_ascii=False, indent=2) + chr(10), encoding='utf-8')
(AUDIO / 'hero-forms/transform-manifest.json').write_text(json.dumps(USED, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
