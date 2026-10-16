"""Noct's complete cold-swordsman voice bank from licensed Cool performances.

Use a restrained swordsman delivery, mild warmth and grain, and a tiny pitch
drop. No spectral whisper replacement, voice cloning, or synthesized speech.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

BASE = Path(__file__).resolve().parents[1] / 'assets/audio'
RATE = 32000
PACK = 'cool/BattleVoice_cool/wav/'
SOURCE_URL = 'https://youfulca.com/2022/08/06/cool/'
TERMS_URL = 'https://youfulca.com/kiyaku_jp/'
# One actor, one restrained character performance, no long rising battle cries.
TAKES = {
    'attack1': ('07_cool_attack.wav', 'Haa', 'Short exhaled cut'),
    'attack2': ('08_cool_attack.wav', 'Taa', 'Quick second cut'),
    'attack3': ('11_cool_attack.wav', 'Ima da', 'Decisive quick strike'),
    'hurt1': ('14_cool_damage.wav', 'Gu', 'Restrained pain grunt'),
    'hurt2': ('15_cool_damage.wav', 'Gua', 'Short impact response'),
    'hurt3': ('16_cool_damage.wav', 'Chi', 'Clenched-teeth response'),
    'cast': ('21_cool_avoid.wav', 'Mikitta', 'Calm focused anticipation'),
    'release': ('09_cool_attack.wav', 'Kurae', 'Decisive release'),
}
manifest = {}
for action, (filename, utterance, direction) in TAKES.items():
    source = BASE / 'sources' / PACK / filename
    command = [imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(source),
               '-af', 'asetrate=44100*0.96,aresample=32000,atempo=1.0416667',
               '-f', 'f32le', '-ac', '1', '-ar', str(RATE), 'pipe:1']
    voice = np.frombuffer(subprocess.check_output(command), dtype='<f4').copy()
    # Trim digital silence only, preserving the consonant onset and breath tail.
    active = np.flatnonzero(np.abs(voice) > max(.001, np.max(np.abs(voice)) * .006))
    if len(active):
        voice = voice[max(0, active[0]-640):min(len(voice), active[-1]+2560)]
    voice = sosfilt(butter(2, [80, 7400], btype='bandpass', fs=RATE, output='sos'), voice)
    warmth = sosfilt(butter(2, [140, 420], btype='bandpass', fs=RATE, output='sos'), voice)
    clarity = sosfilt(butter(2, [1200, 3500], btype='bandpass', fs=RATE, output='sos'), voice)
    voice += .12 * warmth + .10 * clarity
    # Gentle, identical peak compression retains the natural vocal pitch/formants.
    voice *= .18 / max(.001, np.sqrt(np.mean(voice**2)))
    voice = np.tanh(voice * 3) / 3
    voice *= min(.15 / max(.001, np.sqrt(np.mean(voice**2))), .78 / max(.001, np.max(np.abs(voice))))
    fade = min(160, len(voice)//4)
    voice[:fade] *= np.linspace(0, 1, fade)
    voice[-fade:] *= np.linspace(1, 0, fade)
    name = 'noct-' + action
    output = BASE / 'voices' / (name + '.wav')
    wavfile.write(output, RATE, (voice * 32767).astype(np.int16))
    manifest[name] = {
        'file': 'voices/' + output.name, 'duration': round(len(voice)/RATE, 3),
        'sources': [PACK + filename], 'sourceUrl': SOURCE_URL, 'termsUrl': TERMS_URL,
        'performer': 'YouFulca', 'bank': 'Cool / Lone Rival',
        'utterance': utterance, 'direction': direction,
        'processing': '0.96 pitch; original timing; warm low mids, clear consonants, soft grain; no synthetic breath',
        'rms': round(float(np.sqrt(np.mean(voice**2))), 4),
        'peak': round(float(np.max(np.abs(voice))), 4),
        'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
    }
(BASE / 'noct-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Prepared {len(manifest)} Noct swordsman voices; warm clear tone; no Fighter recordings.')
for name, item in manifest.items():
    print(f'{name}: {item["duration"]:.3f}s, RMS {item["rms"]:.3f}, peak {item["peak"]:.3f}')
