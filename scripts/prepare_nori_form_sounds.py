"""Nori's star-form ultimate sounds (src/forms-nori.js): ONE natural recording per clip, cut to its motion.

Like his form-1 sounds, every clip is a single recording: an excerpt whose natural attack lands on the motion's
frame, a gentle high-pass, gain and edge fades; no layering, pitch or time changes, synthesis or limiting. Each clip
is as long as its motion on screen (measured in the studio, see the beat column) and fades out by the time the
next motion starts, so one motion never rings over the next.
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
    # shared by both forms
    'heal-bed': ('fs:368453', 3.9, 5.15, 150, .25, .3, 'the healing spiral around him (bed), 0-1100 / 0-1250 ms'),
    'swing': ('fs:475135', .05, .30, 60, .01, .06, 'the hammer swings down into the blow, 770-920 / 1500-1640 ms'),
    'slam': ('fs:513694', .04, 1.10, 35, .002, .3, 'the hammer hits the ground; its weight rings on under the quake, 920 / 1640 ms on'),
    'pebble': ('fs:336023', 1.94, 2.12, 80, .002, .06, 'one burst of the running jade crack, played once per burst'),
    # Ngọc Thụ Hộ Thể (four stars)
    'f2-gather': ('form1:earth-charge', .36, 1.10, 0, .02, .2, 'hammer raised in the healing spiral, 0-760 ms'),
    'crack-run': ('fs:222521', 1.0, 1.52, 80, .03, .12, 'the jade crack running along the ground, 990-1510 ms'),
    'sprout': ('fs:479160', 0, .72, 120, .02, .15, "jade vines burst at the foe's feet and hold it bound, 1180-1900 ms"),
    'jade': ('fs:419146', .3, .76, 300, .03, .15, 'the bound jade sapling opens and gleams, 1450-1900 ms'),
    'shatter': ('fs:221528', .28, .95, 150, .002, .2, 'the vines and sapling shatter into jade shards, 1900-2400 ms'),
    # Vạn Mộc Thiên Thành (six stars)
    'f3-gather': ('form1:earth-charge', .17, 1.10, 0, .02, .2, 'hammer raised in the healing spiral, 0-950 ms'),
    'rush': ('form1:earth-launch', 0, .29, 0, .005, .08, 'the shield charge, 970-1260 ms'),
    'f3-bash': ('form1:shield-bash', .08, .33, 45, .002, .1, 'shield bash, 1260-1400 ms'),
    'roots': ('fs:222521', 2.0, 2.72, 80, .03, .15, "the roots crack up through the soil and lock the cage, 1710-2430 ms"),
    'roots-break': ('fs:552006', 4.36, 4.86, 100, .002, .2, 'the root cage snaps and crumbles, 2660-3150 ms'),
    'grow': ('fs:848983', 1.15, 1.9, 50, .05, .15, "the world-tree shoots up from the foe's feet, 1700-2450 ms"),
    'leaves': ('fs:368453', 5.6, 6.3, 150, .08, .25, 'its blazing crown sheds its leaves and fades, 2450-3150 ms'),
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
