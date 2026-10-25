"""Hiro's (key 'novice') charge sounds for Kiếm Nhiệt Huyết (src/forms-tan.js): the rookie's battle cry
as he launches himself at the foe, his boots driving him over the dirt and the rush of his jacket on the dash.

Like the approved form sounds, each clip is ONE real recording, minimally edited: an excerpt with its
natural attack and decay, a gentle high-pass, gain and short edge fades. No layering, pitch shifting,
time-stretching, limiting or synthesis. Hiro has no voice bank of his own (combatVoice has no family for
'novice'), so the cry is one shout from unfa's CC0 session of a young man's excited shouts (sung at about
420 Hz, his own natural pitch; nothing is pitch-shifted).
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
    270301: {'slug': 'excited-young-male-screams', 'title': 'Excited Young Male Screams', 'author': 'unfa',
             'source_url': 'https://freesound.org/people/unfa/sounds/270301/',
             'download_url': 'https://cdn.freesound.org/previews/270/270301_1038806-hq.mp3',
             'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
             'description': 'Approximately 40 short vocal shouts here in a long stride. Captured with Zoom H2 @ 96kHz / 24-bit.'},
    816792: {'slug': 'running-on-dirt-2-edit', 'title': 'running on dirt 2 edit', 'author': 'Luisa_Sanchez',
             'source_url': 'https://freesound.org/people/Luisa_Sanchez/sounds/816792/',
             'download_url': 'https://cdn.freesound.org/previews/816/816792_17552599-hq.mp3',
             'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
             'description': 'Sound of running on dirt Surfaces'},
    495390: {'slug': 'foley-whoosh-clothes-wav', 'title': 'Foley_Whoosh_Clothes.wav', 'author': 'Nox_Sound',
             'source_url': 'https://freesound.org/people/Nox_Sound/sounds/495390/',
             'download_url': 'https://cdn.freesound.org/previews/495/495390_9250976-hq.mp3',
             'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
             'description': 'Light whoosh sounds (x6) of a jacket. Zoom H5, 48 kHz, 24 bit.'},
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


# Played (ms from the cast) as in src/forms-tan.js; the dash launches at 860 and he arrives at about 1070.
PLAYS = {'charge-cry': (830, .5), 'dash-steps': (850, .55), 'dash-rush': (860, .5)}
# 830 ms: the battle cry, one shout of the take (8.86-9.80 s): an instant attack as he launches, a held
# "yaaah" through the dash and the rise, and its own falling decay through the chop.
cry = clip('charge-cry', 270301, 8.86, 9.80, 'battle cry: from the dash launch (860 ms) through the rise into the chop', PLAYS['charge-cry'][0],
           fade_in=.01, fade_out=.1, highpass=90, peak=.56)
# 850 ms: two running strides on dirt, a light push-off then the planted front foot as he arrives and rises
# (about 1170 ms), ending before the overhead chop (1270 ms) so that no more than three sounds overlap.
steps = clip('dash-steps', 816792, .40, .80, 'running strides on dirt: push-off at the dash, the planted front foot as he arrives', PLAYS['dash-steps'][0],
             fade_out=.08, highpass=50, peak=.4)
# 860 ms (replaces the generic synthesized whoosh): one fast swing of a jacket, the rush of his clothes over
# the 210 ms dash, with its natural tail.
rush = clip('dash-rush', 495390, .06, .46, 'the rush of his jacket and the air over the 210 ms dash', PLAYS['dash-rush'][0],
            fade_in=.004, fade_out=.08, highpass=80, peak=.45)
# At most three of them overlap (830-1250 ms): keep their sum under 0.8, at unity and as played.
start = min(at for at, _ in PLAYS.values())
mix = np.zeros((round(1.2 * RATE), 2)); played = mix.copy()
for name, x in [('charge-cry', cry), ('dash-steps', steps), ('dash-rush', rush)]:
    at, volume = PLAYS[name]; o = round((at - start) / 1000 * RATE)
    mix[o:o + len(x)] += x; played[o:o + len(x)] += x * volume
print('overlap peak', round(float(np.abs(mix).max()), 3), 'as played', round(float(np.abs(played).max()), 3))
assert np.abs(mix).max() <= .8
(AUDIO / 'hero-forms/novice-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + chr(10), encoding='utf-8', newline=chr(10))
