"""Compose four original, seamless ambient loops; no downloaded music samples."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import numpy as np
from scipy.io import wavfile
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio/music'
RATE = 32000
THEMES = {
    'fire': (66, [45, 41, 48, 43], [0, 3, 7, 10], [0, 7, 10, 7, 3, 2, 0, 7], 'Tro ấm'),
    'earth': (64, [48, 45, 41, 43], [0, 4, 7, 11], [4, 7, 12, 7, 4, 2, 0, 2], 'Rêu và ánh nắng'),
    'ice': (60, [50, 46, 53, 48], [0, 3, 7, 10], [12, 7, 3, 10, 7, 5, 3, 0], 'Trăng trên tuyết'),
    'lightning': (68, [47, 43, 50, 45], [0, 3, 7, 10], [7, 12, 10, 7, 5, 3, 2, 0], 'Gió trên tháp'),
}


def compose(key, bpm, roots, chord, melody):
    beat = 60 / bpm
    length = round(64 * beat * RATE)
    mix = np.zeros((length, 2), dtype=np.float64)

    def note(at, midi, duration, volume, kind, pan=0):
        t = np.arange(round(duration * RATE)) / RATE
        hz = 440 * 2 ** ((midi - 69) / 12)
        if kind == 'pad':
            envelope = np.sin(np.pi * t / duration) ** 2
            wave = (np.sin(2*np.pi*hz*t) + .22*np.sin(2*np.pi*hz*2*t)
                    + .12*np.sin(2*np.pi*hz*1.002*t)) / 1.34
        else:
            # Soft mallet/breath tones: rounded attack, no percussion transients.
            attack = .055 if key == 'ice' else .10
            envelope = (1-np.exp(-t/attack))*np.exp(-t/(duration*.28))
            envelope *= np.minimum(1, (duration-t)/.25)
            harmonic = .24 if key in ('ice', 'earth') else .12
            wave = (np.sin(2*np.pi*hz*t + .003*np.sin(t*12))
                    + harmonic*np.sin(2*np.pi*hz*2*t)*np.exp(-t*1.5)
                    + .07*np.sin(2*np.pi*hz*3*t)*np.exp(-t*2))
        signal = volume * wave * envelope
        stereo = signal[:, None] * np.array([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)])
        indices = (round(at * RATE) + np.arange(len(t))) % length
        mix[indices] += stereo

    for bar in range(16):
        root = roots[(bar // 2) % 4]
        at = bar*4*beat
        if bar % 2 == 0:
            for index, interval in enumerate(chord):
                note(at, root+12+interval, 10*beat, .10, 'pad', (index-1.5)*.24)
            note(at, root-12, 8*beat, .095, 'pad')
        # Sparse, repeating phrases with space for the combat voices.
        for j, step in enumerate([0, 1.5, 3]):
            interval = melody[(bar*3+j) % len(melody)]
            note(at+step*beat, root+24+interval, 3.8*beat, .075 if j else .10,
                 'bell', (-.35 if j % 2 else .35))
        if bar % 4 == 3:
            note(at+2.5*beat, root+19, 4*beat, .04, 'bell', -.5)
    # Circular stereo room reflections preserve the loop seam, including tails.
    dry = mix.copy()
    for delay, level in [(.27, .14), (.43, .10), (.71, .07), (1.09, .04)]:
        mix += np.roll(dry[:, ::-1], round(delay*RATE), axis=0)*level
    mix *= .115 / np.sqrt(np.mean(mix**2))
    mix *= min(1, .72/np.max(np.abs(mix)))
    return mix.astype(np.float32)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for key, (bpm, roots, chord, melody, title) in THEMES.items():
        audio = compose(key, bpm, roots, chord, melody)
        target = OUT / f'{key}.ogg'
        with tempfile.TemporaryDirectory(prefix='minipuzzle-music-') as temp:
            wav = Path(temp) / 'loop.wav'
            wavfile.write(wav, RATE, audio)
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error',
                            '-y', '-i', str(wav), '-c:a', 'libvorbis', '-q:a', '3', str(target)], check=True)
        manifest[key] = {'file': f'music/{key}.ogg', 'title': title, 'bpm': bpm,
                         'duration': len(audio)/RATE, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                         'rms': float(np.sqrt(np.mean(audio**2))), 'original': True}
        print(key, round(len(audio)/RATE, 2), 'seconds,', target.stat().st_size, 'bytes')
    (ROOT/'assets/audio/music-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
