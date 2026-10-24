"""Nori's star-form ultimate sounds (src/forms-nori.js): ONE natural recording per clip, cut to its motion.

Like his form-1 sounds, few long clips, each a single clean real recording: an excerpt whose natural attack lands
on the motion's frame, a gentle high-pass, gain (never into distortion) and edge fades, natural decay kept; no
layering, pitch or time changes, synthesis, saturation or limiting. Each ultimate ends on a long FINAL clip that
starts on its decisive hit and rings out for 3.5-4.6 s past the visuals.
Writes assets/audio/hero-forms/earth/*.wav and assets/audio/hero-forms/earth-manifest.json (merged by build.py
into ART.castSounds; played as playCastSound('earth', '<name>')).
Sources: form 1's own gather (reimagined/earth-charge.wav) and shield bash recording (sources/mika-nori), and
Freesound CC0 uploads in sources/freesound/<id>-*/ (source.json: title, author, URL, licence, SHA-256).
Rebuild: python scripts/prepare_nori_form_sounds.py"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import imageio_ffmpeg
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio'
OUT = ROOT / 'hero-forms/earth'
RATE = 32000
TARGET_RMS, MAX_PEAK = .12, .85

# name: (source, excerpt start, end (s), high-pass Hz, fade in, fade out, beat on screen)
# the excerpt length is the beat's length (ms in the beat text, measured from the ultimate's start)
CLIPS = {
    # shared by both forms (all real recordings; form 1's synthesized gather/rush textures are not reused)
    'gather': ('fs:368453', 3.0, 4.95, 150, .3, .35, 'the healing spiral rises around him as he lifts the hammer, 0-1100 / 0-1250 ms'),
    'swing': ('fs:475135', .05, .30, 60, .01, .06, 'the hammer swings down into the blow, 770-920 / 1500-1640 ms'),
    # Ngọc Thụ Hộ Thể (four stars)
    'slam': ('fs:513694', .04, 1.10, 35, .002, .3, 'the hammer hits the ground, its weight ringing out, 920-1980 ms'),
    'crack-run': ('fs:735401', 1.1, 1.42, 80, .02, .12, 'the jade crack running along the ground, 990-1310 ms'),
    'sprout': ('fs:479160', 0, 1.58, 120, .02, .3, "jade vines burst at the foe's feet and hold it bound, 1190-2780 ms"),
    'jade-ring': ('fs:448075', 0, 4.6, 80, .002, 1.2, 'FINAL: the jade binding seals the foe and rings out, 1190-5800 ms (natural decay)'),
    'shatter': ('fs:221528', .28, 1.9, 150, .002, .4, 'the vines and sapling shatter into jade shards, 1900-3500 ms'),
    # Vạn Mộc Thiên Thành (six stars)
    'rush': ('fs:475135', 0, .75, 60, .01, .2, 'the shield charge, 970-1720 ms'),
    'f3-bash': ('form1:shield-bash', .08, 1.0, 45, .002, .25, 'shield bash, 1270-2190 ms (form 1 recording, natural decay)'),
    'world-tree': ('fs:494071', 4.52, 8.0, 40, .01, .8, 'FINAL: the hammer brings the world-tree crashing up from the ground, 1630-5110 ms (natural decay)'),
    'roots': ('fs:735401', 1.45, 2.35, 80, .03, .3, 'the roots crack up through the soil and lock the cage, 1700-2600 ms'),
    'leaves': ('fs:368453', 5.6, 6.6, 150, .1, .4, 'the blazing crown sheds its leaves, 2450-3450 ms'),
}


def source(ref):
    kind, key = ref.split(':', 1)
    if kind == 'fs':
        folder = next((ROOT / 'sources/freesound').glob(f'{key}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        return folder / meta['file'], {k: meta[k] for k in ('title', 'author', 'source_url', 'license', 'sha256')}
    if key == 'shield-bash':
        meta = next(s for s in json.loads((ROOT / 'sources/mika-nori/sources.json').read_text()) if s['file'] == 'shield-bash.mp3')
        return ROOT / 'sources/mika-nori/shield-bash.mp3', {'title': 'Shield Bash Impact (form 1 earth-shield-bash source)', **{k: meta[k] for k in ('author', 'source_url', 'license', 'sha256')}}
    cast = json.loads((ROOT / 'cast-sfx-manifest.json').read_text(encoding='utf-8'))[key]
    return ROOT / cast['file'], {'title': f'Nori form 1 {key} (assets/audio/{cast["file"]})', 'license': cast['license'], 'sha256': cast['sha256']}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.wav'):
        old.unlink()
    manifest = {}
    for name, (ref, start, end, hp, fin, fout, beat) in CLIPS.items():
        path, credit = source(ref)
        pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
        y = np.frombuffer(pcm, '<f4').astype(float)[int(start * RATE):int(end * RATE)]
        y = y - y.mean()
        if hp: y = sosfiltfilt(butter(2, hp, btype='highpass', fs=RATE, output='sos'), y)
        t = np.arange(len(y)) / RATE
        y *= np.minimum(1, t / fin) * np.minimum(1, (len(y) / RATE - t) / fout)
        # toward form 1's level; a transient keeps its natural peak under the ceiling instead of being limited
        y *= min(TARGET_RMS / np.sqrt(np.mean(y * y)), MAX_PEAK / np.abs(y).max())
        file = OUT / f'nori-{name}.wav'
        wavfile.write(file, RATE, np.round(y * 32767).astype(np.int16))
        manifest['earth-' + name] = {'file': file.relative_to(ROOT).as_posix(), 'duration': round(len(y) / RATE, 3), 'beat': beat,
                                     'sources': [credit], 'license': credit['license'],
                                     'processing': f'excerpt {start}-{end} s of one recording' + (f', {hp} Hz high-pass' if hp else '') + ', gain, edge fades',
                                     'peak': round(float(np.abs(y).max()), 4), 'rms': round(float(np.sqrt(np.mean(y * y))), 4),
                                     'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
    (ROOT / 'hero-forms/earth-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({k: {n: v[n] for n in ('duration', 'peak', 'rms')} for k, v in manifest.items()}, indent=1))


if __name__ == '__main__':
    main()
