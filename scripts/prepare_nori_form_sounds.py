"""Nori's four- and six-star ultimate sounds (src/forms-nori.js), rebuilt from scratch the way Yuki's approved set is.

Backbone (whole-kit redo 13/11, "khống chế, mạnh mẽ, bộc phát"): Nori's form-1 shield bash (sources/mika-nori/
shield-bash.mp3, Hybrid_V) still plays for the shield blows. Every other cue is the literal sound of its motion, one
clean real recording each (Freesound CC0 HQ previews in sources/freesound/<id>-<slug>/ with source.json): a heavy
swing, the hammer striking, the slam on the ground (the loudest moment), roots tearing the soil, a stressed wooden
hull creaking as the roots or the shield walls clamp, a trunk splitting for the root lock, a small bell for the
renewal. Processing: excerpt, gentle high-pass, gain to ~0.12 RMS with a peak ceiling (never
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
clip('slam', '734629', .46, 1.36, 'the hammer hits the earth: a heavy weight thudding into the ground, natural settle', highpass=35, fade_in=.003, fade_out=.3)
clip('roots', '869103', 3.36, 4.36, 'wood splintering: vines/roots tear up through the soil and lock the foe, natural crackle', highpass=100, fade_in=.02, fade_out=.3)
# Four-star, hammer throw (owner 13/11 second redesign: "ném búa lên trời rơi xuống hóa to vào địch rồi gọi búa về"): the
# swing hurls it up, f2-fall = its rushing descent swelling into the blow, f2-strike = the giant hammer landing (the
# stun), f2-return = it spinning back through the air (each pulse a turn), f2-catch = the handle slapping into his palm.
clip('f2-swing', '244598', 4.18, 4.6, 'the hammer swings down; the swish peaks on the blow', highpass=80, fade_in=.01, fade_out=.12)
clip('f2-strike', '669719', 4.53, 5.35, 'the jade hammer strikes the ground hard: a heavy thump on stone, natural settle (the loudest hit)', highpass=35, fade_in=.002, fade_out=.25)
clip('f2-fall', '431976', .38, .80, 'the thrown hammer rushing down from the sky, the whoosh swelling into the blow', highpass=60, fade_in=.05, fade_out=.03, target_rms=.1)
clip('f2-return', '486234', .82, 1.5, 'the hammer spinning back through the air to his hand, one whoosh a turn', highpass=80, fade_in=.02, fade_out=.12, target_rms=.09)
clip('f2-catch', '454381', .23, .75, 'the hammer handle slapping into his palm: a short solid wooden thunk', highpass=70, fade_in=.002, fade_out=.2, target_rms=.1)
# Six-star: Vạn Mộc Thiên Thành, v2 (owner 12/11, ult-v2-design.md): bash = the shield bites into the ground, slam = the
# stomp, roots = the crack running to the foe, boom (+slam) = the shockwave, leaves = the giant shield falling apart.
# The old charge (rush), hammer whoosh (swing) and world-tree (tree) cues went with the old staging.
# Whole-kit redo (owner 13/11 "khống chế, mạnh mẽ và bộc phát"; Codex's four sources): A = wood under load creaking as he
# gathers force, B = f2-strike (heavy thump on stone) for every lock and impact, D = a small bell for the renewal entering
# him (C, the tree trunk of the root clamp, went with the four-star root staging).
clip('creak', '506665', 0.0, 0.50, 'A: old wood under load creaking short and low as he gathers force', highpass=60, fade_in=.004, fade_out=.15)
clip('bell', '791477', 0.0, 0.60, 'D: a small soft bell as the renewal enters him', highpass=200, fade_in=.003, fade_out=.25, target_rms=.06)
(AUDIO / 'hero-forms/earth-manifest.json').write_text(json.dumps(MANIFEST, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
