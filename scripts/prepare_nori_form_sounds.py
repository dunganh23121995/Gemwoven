"""Nori's four- and six-star ultimate sounds (src/forms-nori.js), rebuilt from scratch the way Yuki's approved set is.

Backbone: Nori's form-1 ultimate has one real recording, the shield bash (sources/mika-nori/shield-bash.mp3,
Hybrid_V); earth-charge, earth-launch and earth-finish are synthesized textures and are not used. The shield bash
plays for the six-star bash as in form 1. Every other cue is the literal sound of its motion, one clean real
recording each (Freesound CC0 HQ previews in sources/freesound/<id>-<slug>/ with source.json): leaves and wind
swirling up, a heavy whoosh, a heavy body falling on the ground for the hammer, a deep stomp boom with its long
natural decay under it (the loudest moment, ringing out ~4 s), splintering wood for vines and roots tearing the
soil, a ceramic shatter for the jade, a stressed wooden hull creaking for the growing tree, falling leaves, armoured
footsteps for the charge. Processing: excerpt, gentle high-pass, gain to ~0.12 RMS with a peak ceiling (never
pushed into distortion), short edge fades; natural attack and tail kept; no layering, pitch/time change,
synthesis, saturation or limiting. Sources were checked for clipping, hiss and noise floor.
Output: assets/audio/hero-forms/earth/*.wav and assets/audio/hero-forms/earth-manifest.json
(merged by build.py into ART.castSounds as earth-<name>). Rebuild: python scripts/prepare_nori_form_sounds.py
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
OUT = AUDIO / 'hero-forms/earth'
RATE = 32000
MANIFEST = {}


def source(ref):
    """'mika-nori/shield-bash.mp3' (form 1's own recording) or a Freesound id."""
    if '/' in ref:
        path = AUDIO / 'sources' / ref
        meta = next(s for s in json.loads((path.parent / 'sources.json').read_text(encoding='utf-8')) if s['file'] == path.name)
        meta = {'title': 'Shield Bash Impact (form 1 earth-shield-bash)', **meta}
    else:
        folder = next((AUDIO / 'sources/freesound').glob(f'{ref}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        path = folder / meta['file']
    data = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(data, dtype='<f4').reshape(-1, 2).astype(float), meta


def clip(name, ref, start, end, beat, highpass=60, fade_in=.006, fade_out=.25, target_rms=.12, ceiling=.82):
    x, meta = source(ref)
    x = x[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    t = np.arange(len(x)) / RATE
    x *= (np.minimum(1, t / fade_in) * np.minimum(1, (len(x) / RATE - t) / fade_out))[:, None]
    x *= min(ceiling / max(1e-6, np.abs(x).max()), target_rms / max(1e-6, float(np.sqrt(np.mean(x * x)))))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    MANIFEST[f'earth-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'sources': [{k: meta[k] for k in ['title', 'author', 'source_url', 'license', 'sha256'] if k in meta}],
        'license': meta['license'],
        'processing': f'excerpt {start:.2f}-{end:.2f} s, {highpass} Hz high-pass, gain, {fade_in * 1000:.0f} ms / {fade_out * 1000:.0f} ms edge fades; natural attack and tail',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print(f'[ok] {name:10s} {len(x) / RATE:.2f}s peak {MANIFEST[f"earth-{name}"]["peak"]} rms {MANIFEST[f"earth-{name}"]["rms"]}')


for old in OUT.glob('*.wav'):
    old.unlink()
# Shared (both forms)
clip('gather', '569786', 2.0, 4.0, 'chant: leaves and wind swirl up around him as the healing spiral rises and he lifts the hammer, 0-2.0 s', highpass=120, fade_in=.25, fade_out=.5)
clip('swing', '427979', .22, .75, 'the hammer swings down; the whoosh peaks on the blow', highpass=80, fade_in=.01, fade_out=.2)
clip('slam', '734629', .46, 1.36, 'the hammer hits the earth: a heavy weight thudding into the ground, natural settle', highpass=35, fade_in=.003, fade_out=.3)
clip('boom', '512483', 0, 4.2, 'deep stomp boom under the slam, ringing out with its natural decay (~4 s), the end of the ultimate', highpass=30, fade_in=.01, fade_out=.9)
clip('roots', '869103', 3.36, 4.36, 'wood splintering: vines/roots tear up through the soil and lock the foe, natural crackle', highpass=100, fade_in=.02, fade_out=.3)
# Four-star: Ngọc Thụ Hộ Thể (rebuilt again on its own; the six-star set above/below is approved and unchanged)
clip('f2-swirl', '397988', 5.3, 7.3, 'chant: the healing spiral, glassy stone wind chimes shimmering (jade), 0-2.0 s', highpass=200, fade_in=.15, fade_out=.6)
clip('f2-swing', '244598', 4.18, 4.6, 'the hammer swings down; the swish peaks on the blow', highpass=80, fade_in=.01, fade_out=.12)
clip('f2-strike', '669719', 4.53, 5.35, 'the jade hammer strikes the ground hard: a heavy thump on stone, natural settle (the loudest hit)', highpass=35, fade_in=.002, fade_out=.25)
clip('f2-rubble', '703247', 0, 4.6, 'under the strike the ground cracks open and the crack runs to the foe: stone debris crashing and crumbling, ringing out with its natural decay to the end', highpass=40, fade_in=.01, fade_out=.9)
clip('f2-vines', '862083', .93, 1.65, 'the jade vines and sapling burst up: a fresh plant stalk snapping and cracking', highpass=120, fade_in=.005, fade_out=.2)
clip('f2-clink', '634154', 4.98, 5.95, 'the vines lock round the foe and the sapling opens: a ringing ceramic/jade clink with its natural ring', highpass=150, fade_in=.002, fade_out=.25)
clip('f2-shatter', '675897', 3.94, 6.6, 'the jade shatters like pottery and its pieces settle: the natural ending', highpass=80, fade_in=.003, fade_out=.6)
# Six-star: Vạn Mộc Thiên Thành
clip('rush', '770083', 36.55, 36.92, 'armoured footsteps: the shield charge', highpass=60, fade_in=.005, fade_out=.1)
clip('bash', 'mika-nori/shield-bash.mp3', .08, 1.0, "the shield bash: form 1's own recording, natural decay", highpass=45, fade_in=.002, fade_out=.25)
clip('tree', '675785', 2.6, 4.6, 'the world-tree grows: a great wooden hull creaking and stressing, natural swell and fall', highpass=50, fade_in=.05, fade_out=.4)
clip('leaves', '489911', 0, 2.45, 'the blazing crown sheds its leaves as it fades', highpass=150, fade_in=.01, fade_out=.5)
(AUDIO / 'hero-forms/earth-manifest.json').write_text(json.dumps(MANIFEST, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
