"""Lumi's four- and six-star ultimate sounds (src/forms-lumi.js), made the way Yuki's approved set is made.

The star bolts are not made here: they play form 1's own storm clips exactly as form 1 does (lightning-thunder-rumble,
-open, -crack, -tail; see lumiFormThunder in src/forms-lumi.js), as the player asked.
Every other cue is the literal sound of its motion: a mark tree as the stars form (form 2) and stream along the
galaxy (form 3), a tingsha ring as the pentagram locks, a real slinky-laser foley as the orbit rings spin off the
spear, a stick whoosh as a star is thrown (its hit is form 1's own lightning-impact).
ONE clean real recording per clip (checked: no clipping, low noise), minimally processed: an excerpt, a gentle
high-pass, gain and edge fades, so each keeps its natural attack and decay. No layering, pitch or time change,
synthesis, saturation or limiting.
Output: assets/audio/hero-forms/lightning/*.wav and assets/audio/hero-forms/lightning-manifest.json
(merged by build.py into ART.castSounds as lightning-<name>). Rebuild: python scripts/prepare_lumi_form_sounds.py
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
OUT = AUDIO / 'hero-forms/lightning'
RATE = 32000
def source(ref):
    """A Freesound recording kept in sources/freesound/<id>-<slug>/ (source.json: title, author, URL, licence, SHA-256)."""
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
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    MANIFEST[f'lightning-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'sources': [{k: meta[k] for k in ['title', 'author', 'source_url', 'license', 'sha256'] if k in meta}],
        'license': meta['license'],
        'processing': f'excerpt {start:.2f}-{end:.2f} s, {highpass} Hz high-pass, gain, {fade_in * 1000:.0f} ms / {fade_out * 1000:.0f} ms edge fades; natural attack and tail',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print(f'[ok] {name:12s} {len(x) / RATE:.2f}s peak {MANIFEST[f"lightning-{name}"]["peak"]} rms {MANIFEST[f"lightning-{name}"]["rms"]}')


OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob('*.wav'):
    old.unlink()
# Four-star Tinh Lôi Ngũ Phạt
clip('stars', 796546, .0, 1.7, 'four-star: the five stars leave the orb and form in the sky, mark-tree run with its natural decay (0.46-2.2 s)',
     highpass=200, fade_out=.5)
clip('seal', 435074, .0, 1.3, 'four-star: the pentagram locks (1.32 s), one tingsha ring decaying while the seal charges', highpass=250, fade_out=.55)
# Six-star Cửu Thiên Tinh Phạt
clip('laser', 376694, .15, 1.07, 'six-star: the orbit rings spin off the spear and the galaxy appears (0.46 s), slinky-laser foley', highpass=80, fade_out=.3)
clip('stream', 796546, .0, 1.3, 'six-star: stars stream along the galaxy\'s arms as it glides into place (1.0-2.3 s), mark tree', highpass=200, fade_out=.45)
# Basic attacks
clip('throw', 352719, .08, .40, 'four-star basic attack: the star is flung (stick whoosh, 0.17-0.49 s)', highpass=120, fade_out=.1)
clip('shot', 376694, .15, .62, 'six-star basic attack: the orbit-ring bolt fires from the spear (slinky laser, 0.17-0.64 s)', highpass=100, fade_out=.18)
clip('ring', 435074, .0, .7, 'six-star basic attack: the ring shockwave hits (tingsha ring, 0.4-1.1 s)', highpass=250, fade_out=.3)
(AUDIO / 'hero-forms/lightning-manifest.json').write_text(json.dumps(MANIFEST, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(len(MANIFEST), 'clips')
