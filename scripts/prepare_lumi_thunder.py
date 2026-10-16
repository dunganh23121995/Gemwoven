"""Edit a CC0 field recording into Lumi's thunder sequence.

No generated noise, pitch changes, time stretching or artificial echoes.
The public Freesound HQ preview is kept locally for reproducible builds.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import imageio_ffmpeg
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio'
SOURCE = ROOT / 'sources/thunder/seth-m-458015-hq.mp3'
CLOSE_SOURCE = ROOT / 'sources/thunder/simon-spiers-437243-hq.mp3'
RATE = 32000
PROVENANCE = {
    'title': 'big thunder clap', 'author': 'seth-m', 'license': 'CC0-1.0',
    'source_url': 'https://freesound.org/people/seth-m/sounds/458015/',
    'download_url': 'https://cdn.freesound.org/previews/458/458015_3366749-hq.mp3',
    'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'recording': 'Dry thunder, recorded with a Roland Edirol R-09HR',
    'source_format': 'Public HQ MP3 preview, stereo',
}
CLOSE_PROVENANCE = {
    'title': 'Very close lightning strike.', 'author': 'Simon Spiers', 'license': 'CC0-1.0',
    'source_url': 'https://freesound.org/people/Simon%20Spiers/sounds/437243/',
    'download_url': 'https://cdn.freesound.org/previews/437/437243_213249-hq.mp3',
    'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'recording': 'Cloud-to-ground lightning recorded within 100 meters',
    'source_format': 'Public HQ MP3 preview, stereo',
}


def render(raw, kind, start, duration, fade_out):
    x = raw[round(start*RATE):round((start+duration)*RATE)].copy()
    assert len(x) == round(duration*RATE)
    rumble = kind == 'rumble'
    # Keep a soft distant roll for chanting; retain the close strike's abrupt crack.
    x = sosfilt(butter(2, 30 if rumble else 80, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    t = np.arange(len(x))/RATE
    envelope = np.minimum(1, t/(.24 if rumble else .0015)) * np.minimum(1, (duration-t)/fade_out)
    x *= envelope[:, None]
    # Shared gain preserves the recording's balance of crack and rumble.
    x *= .57 if rumble else .48
    assert np.abs(x).max() < .95
    target = ROOT / 'reimagined' / f'lumi-thunder-{kind}.wav'
    wavfile.write(target, RATE, np.round(x*32767).astype(np.int16))
    source = SOURCE if rumble else CLOSE_SOURCE
    return {**(PROVENANCE if rumble else CLOSE_PROVENANCE), 'file': target.relative_to(ROOT).as_posix(),
            'duration': duration, 'category': 'field-recorded-thunder',
            'source_file': source.relative_to(ROOT).as_posix(),
            'source_start': start, 'fade_out': fade_out,
            'processing': f'Trim, {30 if rumble else 80} Hz high-pass, shared gain, edge fades; original pitch and speed',
            'peak': round(float(np.abs(x).max()), 4),
            'rms': round(float(np.sqrt(np.mean(x*x))), 4),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}


if __name__ == '__main__':
    def read(source):
        pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error',
            '-i', str(source), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
        return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2)
    raw, close = read(SOURCE), read(CLOSE_SOURCE)
    manifest = {'lightning-thunder-rumble': render(raw, 'rumble', 1.01, 1.75, .3)}
    manifest.update({f'lightning-thunder-{kind}': render(close, kind, start, duration, fade)
                for kind, start, duration, fade in [
                    # Keep the recorded decay until it reaches background level.
                    # Only fade the quiet edge, never gate the impact's resonance.
                    ('open', 20.815, 4.8, .35), ('crack', 20.82, 4.8, .35),
                    ('tail', 20.815, 4.8, .35)]})
    (ROOT/'lumi-thunder-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    provenance = {**PROVENANCE, 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest()}
    (SOURCE.parent/'source.json').write_text(json.dumps(provenance, indent=2), encoding='utf-8')
    (SOURCE.parent/'simon-source.json').write_text(json.dumps({**CLOSE_PROVENANCE,
        'sha256': hashlib.sha256(CLOSE_SOURCE.read_bytes()).hexdigest()}, indent=2), encoding='utf-8')
    print(json.dumps({key: {k: value[k] for k in ['duration','peak','rms']} for key,value in manifest.items()}, indent=2))
