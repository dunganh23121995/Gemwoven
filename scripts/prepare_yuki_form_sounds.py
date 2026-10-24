"""Yuki's four- and six-star ultimate sounds (src/forms-yuki.js), made the way her form-1 sounds are:
ONE real recording per clip, minimally processed (an excerpt, a gentle high-pass, gain and short edge
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
# Each clip is cut to its motion on screen: the natural attack lands on the motion's frame and the
# clip has faded out by the time the next motion starts (times from forms-yuki.js, checked in the studio).
# ---- Four-star: Nguyệt Sương Băng Giáng (4 cues) --------------------------------------------------
clip('f2-moonrise', '145578', .50, 1.16, 'moon rises behind her: 0.56-1.25 s (until she points the staff)', highpass=300, fade_in=.04, fade_out=.25)
clip('f2-beam', '683096', .75, 1.00, 'moonbeam falls 1.25 s and lands 1.42 s; whoosh peaks at the landing, gone by 1.50 s', highpass=150, fade_in=.02, fade_out=.06)
clip('f2-spikes', 'yuki/ice-crack.mp3', .40, 1.15, "frost spikes crack up and lock the prison: 1.42-2.24 s (cracks at 1.54 and 1.94 s); form 1's ice-crack recording", highpass=120, fade_out=.15)
clip('f2-shatter', '329744', 6.50, 7.25, 'the ice prison shatters (damage): 2.24-3.0 s', highpass=60, fade_in=.003, fade_out=.3)
# ---- Six-star: Thiên Nguyệt Tuyết Liên (5 cues) ---------------------------------------------------
clip('f3-aegis', '437323', .15, .77, 'ice armour plates clink as the aegis spirals up: 0-0.64 s', highpass=200, fade_in=.01, fade_out=.15)
clip('f3-fan', '569109', .95, 1.59, 'frost fan sweep and snowy gust to the foe: 0.64-1.28 s', highpass=120, fade_in=.03, fade_out=.2)
clip('f3-halberd', '507466', .14, .50, 'moon halberd swing: 1.36-1.72 s, swish peaks on the cut at 1.50 s', highpass=150, fade_in=.01, fade_out=.12)
clip('f3-close', 'yuki/ice-crack.mp3', .90, 1.45, "the lotus cracks shut round the foe: 1.66-2.21 s (cracks at 1.76 and 1.92 s); form 1's ice-crack recording", highpass=120, fade_in=.01, fade_out=.15)
clip('f3-burst', '789213', .18, .94, 'the lotus bursts into glassy shards and snow petals (damage): 2.24-3.0 s', highpass=80, fade_in=.004, fade_out=.3)
(AUDIO / 'hero-forms/ice-manifest.json').write_text(json.dumps(MANIFEST, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
