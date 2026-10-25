"""Hiro's (key 'novice') charge sounds for Kiếm Nhiệt Huyết (src/forms-tan.js): the rookie's battle cry
as he launches himself at the foe, and his boots driving him over the dirt on the dash.

Like the approved form sounds, each clip is ONE real recording, minimally edited: an excerpt with its
natural attack and decay, a gentle high-pass, gain and short edge fades. No layering, pitch shifting,
time-stretching, limiting or synthesis. Hiro has no voice bank of his own (combatVoice has no family for
'novice'), so the cry comes from one professional warrior attack-cry recording.
Output: assets/audio/hero-forms/novice/*.wav and assets/audio/hero-forms/novice-manifest.json
(merged by build.py into ART.castSounds as novice-<name>).
Sources are kept in assets/audio/sources/freesound/<id>-<slug>/ (source.json); fetched once if missing.
Rebuild: python scripts/prepare_hiro_form_sounds.py
"""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request

import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

AUDIO = Path(__file__).resolve().parents[1] / 'assets/audio'
OUT = AUDIO / 'hero-forms/novice'
RATE = 32000
SOURCES = {
    695376: {'slug': 'male-attack-cry-1-wav', 'title': 'Male Attack Cry 1.wav', 'author': 'F.M.Audio',
             'source_url': 'https://freesound.org/people/F.M.Audio/sounds/695376/',
             'download_url': 'https://cdn.freesound.org/previews/695/695376_7805242-hq.mp3',
             'license': 'CC-BY-4.0', 'license_url': 'https://creativecommons.org/licenses/by/4.0/',
             'description': 'Attack cry, which can be used as a male warrior attacks an opponent with a melee weapon.'},
    816792: {'slug': 'running-on-dirt-2-edit', 'title': 'running on dirt 2 edit', 'author': 'Luisa_Sanchez',
             'source_url': 'https://freesound.org/people/Luisa_Sanchez/sounds/816792/',
             'download_url': 'https://cdn.freesound.org/previews/816/816792_17552599-hq.mp3',
             'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
             'description': 'Sound of running on dirt Surfaces'},
}


def source(sound_id):
    """The recording's local file (downloaded once, with its source.json) and its provenance record."""
    meta = SOURCES[sound_id]
    folder = AUDIO / 'sources/freesound' / f'{sound_id}-{meta["slug"]}'
    path = folder / f'{sound_id}-{meta["slug"]}.mp3'
    if not path.exists():
        folder.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(meta['download_url'], headers={'User-Agent': 'Mozilla/5.0'})
        path.write_bytes(urllib.request.urlopen(request, timeout=60).read())
        record = {'file': path.name, **{k: v for k, v in meta.items() if k != 'slug'},
                  'source_format': 'Freesound public HQ MP3 preview', 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        (folder / 'source.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
    record = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
    assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256'], path
    return path, {k: record[k] for k in ['title', 'author', 'source_url', 'license', 'sha256']}


def read(path):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                   '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)


USED = {}


def clip(name, sound_id, start, end, beat, plays_at, fade_in=.006, fade_out=.1, highpass=60, peak=.6):
    """One recording, [start, end) s, a gentle high-pass, short edge fades, plain gain to `peak`."""
    path, meta = source(sound_id)
    x = read(path)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    x *= peak / max(1e-4, np.abs(x).max())
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    USED[f'novice-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat, 'playsAt': plays_at,
        'license': meta['license'], 'sources': [meta],
        'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'novice-{name}']['duration'], 's peak', USED[f'novice-{name}']['peak'], 'rms', USED[f'novice-{name}']['rms'])
    return x


# 580 ms (wind-up): the cry's breath-in build (0.14-0.42 s of the take) under the wind-up, so its full-voiced
# body (0.42-0.84 s) lands at 860 ms as he launches into the dash and dies away with its own decay just as
# the sword comes down (1270 ms).
cry = clip('charge-cry', 695376, .14, .96, 'battle cry: builds on the wind-up, full voice from the dash launch (860 ms) to the chop', 580,
           fade_in=.03, fade_out=.08, highpass=90, peak=.6)
# 850 ms (dash): two running strides on dirt, a light push-off then the planted front foot as he arrives
# and rises (about 1150 ms), with the grit settling after it.
steps = clip('dash-steps', 816792, .40, .98, 'running strides on dirt: push-off at the dash, the planted front foot as he arrives', 850,
             fade_out=.12, highpass=50, peak=.42)
# The two overlap (cry 580-1400 ms, steps 850-1430 ms): keep their sum, as played at full volume, under 0.8.
offset = round((850 - 580) / 1000 * RATE)
mix = cry.copy()
mix[offset:offset + len(steps)] += steps[:max(0, len(mix) - offset)]
print('overlap peak', round(float(np.abs(mix).max()), 3))
assert np.abs(mix).max() <= .8
(AUDIO / 'hero-forms/novice-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
