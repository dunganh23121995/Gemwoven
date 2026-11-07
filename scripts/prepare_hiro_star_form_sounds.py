"""Hiro's (key 'novice') four- and six-star ultimate sounds (src/forms-hiro.js), built on his form-1 set.

Form 1 (scripts/prepare_hiro_form_sounds.py, locked) gives the backbone and is played as it is, never
rebuilt here: his battle cry as he plants his feet (novice-charge-cry), his boots on the dirt
(novice-dash-steps) and the rush of his clothes on the dash (novice-dash-rush). The forms add only the
literal sound of what is new on screen, a few cues each:
  four-star Lữ Kiếm Liên Trảm: a gust of wind with leaves as the traveller's wind whirls round him, a real
  sword swing for each of the three cuts (two takes of one swordsman's recording) and a sword striking a
  body on the finishing cross cut (the damage, loudest);
  six-star Diệu Ngọc Tứ Hệ Trảm, plain since the redesign (owner 07/11: "cơ bản, không rực rỡ"): the soft gust
  of the four-star form's wind as plain wind lines draw four dull motes into his blade, a low swoosh for the
  great downward cut, soil cracking as the ground shock spreads under the foe, and the four-star sword striking
  the body (the damage, loudest; the same recording, as the same kind of beat).
Each clip is ONE real recording (Freesound CC0), minimally edited: an excerpt with its natural attack and
decay, a gentle high-pass, plain gain (peak <= 0.82, no limiting or saturation) and short edge fades. No
layering, pitch or time change, no synthesis. None of these recordings is used by another hero, a boss,
an elite or the summon screen (the soil cracking is also a rock creature's).
Output: assets/audio/hero-forms/novice/f2-*.wav, f3-*.wav and assets/audio/hero-forms/novice-stars-manifest.json
(merged by build.py into ART.castSounds as novice-<name>; form 1's novice-manifest.json is left alone).
Sources are kept in assets/audio/sources/freesound/<id>-<slug>/ (source.json); fetched once if missing.
Rebuild: python scripts/prepare_hiro_star_form_sounds.py
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
MANIFEST = AUDIO / 'hero-forms/novice-stars-manifest.json'
RATE = 32000
CC0 = {'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/', 'source_format': 'Freesound public HQ MP3 preview'}
SOURCES = {
    711441: ('a-gust-of-wind-blowing-some-leaves', 'a gust of wind blowing some leaves', 'F3ather', 6401406),
    840716: ('sword-swing-1', 'Sword Swing 1', 'Nomagician', 18136826),
    840717: ('sword-swing-3', 'Sword Swing 3', 'Nomagician', 18136826),
    411122: ('sword-hits-the-body-wav', 'Sword hits the body.wav', 'vdovitsky', 1424100),
    475135: ('fx-swoosh-low-pitch', 'FX - Swoosh - Low Pitch', 'bolkmar', 2927958),
    222521: ('cracking-earthquake-cracking-soil-cracki', 'Cracking Earthquake (cracking soil, cracking stone)', 'uagadugu', 255863),
}


def source(sound_id):
    """The recording's local file (downloaded once, with its source.json) and its provenance record."""
    slug, title, author, user = SOURCES[sound_id]
    folder = AUDIO / 'sources/freesound' / f'{sound_id}-{slug}'
    path = folder / f'{sound_id}-{slug}.mp3'
    if not path.exists():
        folder.mkdir(parents=True, exist_ok=True)
        url = f'https://cdn.freesound.org/previews/{sound_id // 1000}/{sound_id}_{user}-hq.mp3'
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        path.write_bytes(urllib.request.urlopen(request, timeout=60).read())
        record = {'file': path.name, 'title': title, 'author': author,
                  'source_url': f'https://freesound.org/people/{author}/sounds/{sound_id}/', 'download_url': url,
                  **CC0, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        (folder / 'source.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
    record = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
    assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256'], path
    return path, {k: record[k] for k in ['title', 'author', 'source_url', 'license', 'sha256']}


def read(path):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                   '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)


USED = {}


def clip(name, sound_id, start, end, beat, fade_in=.006, fade_out=.1, highpass=60, peak=.6):
    """One recording, [start, end) s, a gentle high-pass, short edge fades, plain gain to `peak`."""
    path, meta = source(sound_id)
    x = read(path)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    x *= min(peak, .82) / max(1e-4, np.abs(x).max())
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    USED[f'novice-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'license': meta['license'], 'sources': [meta],
        'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'novice-{name}']['duration'], 's peak', USED[f'novice-{name}']['peak'], 'rms', USED[f'novice-{name}']['rms'])
    return x


def form1(name):
    """A form-1 clip as it is on disk (played again by the forms, never rebuilt here)."""
    rate, x = wavfile.read(OUT / f'{name}.wav')
    assert rate == RATE
    return x.astype(float) / 32767


# Four-star Lữ Kiếm Liên Trảm (forms-hiro.js hiroChainSlash): the gust whirls up as he plants his feet, the
# dash launches at 760 ms, the three cuts land at about 1000, 1260 and 1520 ms, the cross bursts on the hit (1780).
gust = clip('f2-gust', 711441, 0.0, 1.6, 'gust of wind with leaves as the traveller\'s wind whirls round his boots (0-1.6 s)', fade_in=.02, fade_out=.45, highpass=70, peak=.5)
swing1 = clip('f2-swing', 840716, 0.04, 0.62, 'sword swing: the first and the finishing cut (peak 100 ms in)', fade_in=.004, fade_out=.12, highpass=90, peak=.6)
swing2 = clip('f2-swing-up', 840717, 0.04, 0.62, 'second take of the same swordsman: the rising cut (peak 100 ms in)', fade_in=.004, fade_out=.12, highpass=90, peak=.6)
hit2 = clip('f2-hit', 411122, 0.20, 0.72, 'sword strikes the body on the finishing cross cut, the damage (struck 80 ms in)', fade_in=.004, fade_out=.14, highpass=60, peak=.82)
# Six-star Diệu Ngọc Tứ Hệ Trảm: the motes gather from 0 ms, he steps in at 1150, the crescent sweeps down at
# 1400-1450, the ground cracks from 1000 and its dust ring rises at 1700, the sword lands on the hit (1950).
gather = clip('f3-gather', 711441, 0.30, 1.40, 'soft gust of his wind as plain wind lines draw the four motes into the blade (0-1.1 s)', fade_in=.06, fade_out=.4, highpass=90, peak=.4)
swoosh = clip('f3-swing', 475135, 0.06, 0.86, 'low swoosh of the great downward cut (peaks 160 ms in)', fade_in=.01, fade_out=.2, highpass=50, peak=.6)
crack = clip('f3-crest', 222521, 0.30, 1.30, 'soil cracking as the ground shock spreads under the foe, rising into the dust ring (1460-2460 ms)', fade_in=.02, fade_out=.35, highpass=50, peak=.45)
hit3 = clip('f3-hit', 411122, 0.20, 0.72, 'the four-star sword striking the body: the great cut lands, the damage (struck 80 ms in)', fade_in=.004, fade_out=.14, highpass=60, peak=.82)

cry, steps, rush = form1('charge-cry'), form1('dash-steps'), form1('dash-rush')
# (sound, ms from the cast, volume) exactly as forms-hiro.js plays them.
PLAYS = {
    2: [(cry, 60, .55), (gust, 0, .5), (steps, 740, .5), (rush, 760, .5), (swing1, 930, .5), (swing2, 1190, .5), (swing1, 1450, .55), (hit2, 1700, .8)],
    3: [(cry, 60, .55), (gather, 0, .4), (steps, 1150, .45), (swoosh, 1290, .6), (crack, 1460, .45), (hit3, 1870, .8)],
}
for form, plays in PLAYS.items():
    mix = np.zeros((round(3.5 * RATE), 2)); played = mix.copy()
    for x, at, volume in plays:
        o = round(at / 1000 * RATE); mix[o:o + len(x)] += x; played[o:o + len(x)] += x * volume
    print(f'form {form} mix peak at unity', round(float(np.abs(mix).max()), 3), 'as played', round(float(np.abs(played).max()), 3))
    assert np.abs(played).max() <= .8
MANIFEST.write_text(json.dumps(USED, indent=2, ensure_ascii=False) + chr(10), encoding='utf-8', newline=chr(10))
