"""Yuki's four- and six-star ultimate sounds (src/forms-yuki.js), made the way her form-1 sounds are:
ONE real recording per clip (every visible segment scored: beds under synced hits), minimally processed (an excerpt, a gentle high-pass, gain and short edge
fades) so each keeps its natural attack and decay tail. No layering, pitch or time change, or synthesis.
Where the beat is the same kind as form 1's, the very recording form 1 uses is reused
(sources/yuki/ice-crack.mp3, j_p_higgins). Other recordings are Freesound CC0 HQ previews kept in
sources/freesound/<id>-<slug>/ with source.json (title, author, URL, licence, SHA-256).
Output: assets/audio/hero-forms/ice/*.wav and assets/audio/hero-forms/ice-manifest.json
(merged by build.py into ART.castSounds as ice-<name>). Rebuild: python scripts/prepare_yuki_form_sounds.py
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
OUT = AUDIO / 'hero-forms/ice'
RATE = 32000


def source(ref):
    """'yuki/ice-crack.mp3' (form 1's own recordings) or a Freesound id."""
    if '/' in ref:
        path = AUDIO / 'sources' / ref
        meta = next(s for s in json.loads((path.parent / 'sources.json').read_text(encoding='utf-8')) if s['file'] == path.name)
        meta = {'title': meta.get('title', path.stem), **meta}
    else:
        folder = next((AUDIO / 'sources/freesound').glob(f'{ref}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        path = folder / meta['file']
    data = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                    '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(data, dtype='<f4').reshape(-1, 2).astype(float), meta


MANIFEST = {}


def clip(name, ref, start, end, beat, highpass=80, fade_in=.006, fade_out=.25, target_rms=.12):
    x, meta = source(ref)
    x = x[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    t = np.arange(len(x)) / RATE
    x *= (np.minimum(1, t / fade_in) * np.minimum(1, (len(x) / RATE - t) / fade_out))[:, None]
    x *= min(.82 / max(1e-6, np.abs(x).max()), target_rms / max(1e-6, float(np.sqrt(np.mean(x * x)))))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    MANIFEST[f'ice-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'sources': [{k: meta[k] for k in ['title', 'author', 'source_url', 'license', 'sha256'] if k in meta}],
        'license': meta['license'],
        'processing': f'excerpt {start:.2f}-{end:.2f} s, {highpass} Hz high-pass, gain, {fade_in * 1000:.0f} ms / {fade_out * 1000:.0f} ms edge fades; natural attack and tail',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print(f'[ok] {name:12s} {len(x) / RATE:.2f}s peak {MANIFEST[f"ice-{name}"]["peak"]} rms {MANIFEST[f"ice-{name}"]["rms"]}')


for old in OUT.glob('*.wav'):
    old.unlink()
# Every visible segment is scored for its whole length: continuous effects get a continuous recording (bed)
# cut to the segment, each visible crack/burst its own synced hit (one clip may play once per hit), big
# moments get weight and their natural tail. Times are the beats in forms-yuki.js, checked in the studio.
# Shared hits (played on several beats):
clip('crack', 'yuki/ice-crack.mp3', .56, .95, "one sharp ice crack, at +0.06 s (prison locks, ice cracks, crescent cut); form 1's ice-crack recording", highpass=120, fade_in=.004, fade_out=.15)
clip('boom', 'yuki/deep-boom.mp3', .44, 1.60, "deep boom under the shatter/burst, peaks at +0.12 s; form 1's deep-boom recording", highpass=35, fade_in=.03, fade_out=.45)
# ---- Four-star: Nguyệt Sương Băng Giáng ------------------------------------------------------------
clip('f2-wind', '700233', 2.00, 3.40, 'bed: icy wind while she chants and the armour spiral wraps her, 0-1.4 s', highpass=150, fade_in=.2, fade_out=.35)
clip('f2-moonrise', '145578', .50, 1.16, 'moon rises behind her: 0.56-1.25 s (until she points the staff)', highpass=300, fade_in=.04, fade_out=.25)
clip('f2-beam', '683096', .75, 1.00, 'moonbeam falls 1.25 s and lands 1.42 s; whoosh peaks at the landing', highpass=150, fade_in=.02, fade_out=.06)
clip('f2-beamhum', '447799', 1.60, 2.30, 'bed: the frozen moonbeam rings while it stands on the foe, 1.32-2.02 s', highpass=200, fade_in=.08, fade_out=.3)
clip('f2-freeze', '452645', .40, 1.22, 'bed: frost spikes grow and the prison holds, crackling, 1.42-2.24 s', highpass=120, fade_in=.02, fade_out=.12)
clip('f2-shatter', '329744', 6.50, 7.40, 'the ice prison shatters (damage) at 2.24 s, natural debris tail', highpass=60, fade_in=.003, fade_out=.35)
clip('f2-tinkle', '789213', .55, 1.35, 'shards rain down and the moon fades, 2.40-3.2 s', highpass=500, fade_in=.05, fade_out=.35)
# ---- Six-star: Thiên Nguyệt Tuyết Liên -------------------------------------------------------------
clip('f3-chimes', '667173', .75, 3.35, 'bed: the crystal aegis turns round her for the whole ultimate, 0-2.6 s', highpass=250, fade_in=.15, fade_out=.4)
clip('f3-aegis', '437323', .15, .77, 'ice armour plates clink as the aegis spirals up: 0-0.64 s', highpass=200, fade_in=.01, fade_out=.15)
clip('f3-fanopen', '805399', 0, .60, 'the frost fan snaps open beside her face: 0.30-0.90 s', highpass=200, fade_in=.004, fade_out=.1)
clip('f3-fan', '569109', .95, 1.59, 'frost fan sweep and snowy gust to the foe: 0.64-1.28 s', highpass=120, fade_in=.03, fade_out=.2)
clip('f3-lotus', '452645', 2.00, 3.40, 'bed: the ice lotus blooms, stands open and closes, creaking: 0.84-2.24 s', highpass=120, fade_in=.05, fade_out=.15)
clip('f3-halberd', '507466', .14, .50, 'moon halberd swing: 1.36-1.72 s, swish peaks on the cut at 1.50 s', highpass=150, fade_in=.01, fade_out=.12)
clip('f3-close', '452645', 5.50, 5.85, 'the petals grind shut: 1.60-1.95 s (crunches at 1.64 and 1.78 s)', highpass=120, fade_in=.005, fade_out=.1)
clip('f3-burst', '789213', .20, 1.30, 'the lotus bursts into glassy shards and snow petals (damage) at 2.24 s, natural tinkling tail', highpass=80, fade_in=.004, fade_out=.4)
(AUDIO / 'hero-forms/ice-manifest.json').write_text(json.dumps(MANIFEST, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
