"""Hiro's (key 'novice') four- and six-star ultimate sounds (src/forms-hiro.js), built on his form-1 set.

Form 1 (scripts/prepare_hiro_form_sounds.py, locked) gives the backbone and is played as it is, never
rebuilt here: his battle cry as he plants his feet (novice-charge-cry), his boots on the dirt
(novice-dash-steps) and the rush of his clothes on the dash (novice-dash-rush). The forms add only the
literal sound of what is new on screen, a few cues each:
  four-star Lữ Kiếm Liên Trảm: a gust of wind with leaves as the traveller's wind whirls round him, a real
  sword swing for each of the three cuts (two takes of one swordsman's recording); the cross bursts with no sound of
  its own (owner 13/11: the body thud there "không phải chém", removed);
  six-star Diệu Ngọc Tứ Hệ Trảm, redone 13/11 (owner: "Âm thanh nghe không hay, xấu"; Codex's cues): a long steel
  blade ringing as the four hilt stones wake, a heavy blade tearing the air on the great cut, steel striking rock
  as the blow lands and the ground splits (the damage, loudest); the basic down-cut's own short swing and dry hit.
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
    # six-star redo (owner 13/11 "Âm thanh nghe không hay, xấu"; Codex's cue list): steel ringing, a heavy swing, a hatchet
    # striking rock for the great blow, a sword swing and a dry sword hit for the basic down-cut
    707339: ('unsheathing-sword-slow-dramatic', 'Unsheathing sword, slow, dramatic.wav', 'mht23SD', 15272986),
    367182: ('swing', 'swing.mp3', 'GaussTheWizard', 5065048),
    431019: ('stone-hit', 'Stone hit', 'CamoMano', 5635287),
    471097: ('knifesword-swing', 'Knife/sword swing', 'spycrah', 9856191),
    547042: ('hit-impact-sword-3', 'Hit Impact Sword 3', 'CogFireStudios', 7614679),
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
# dash launches at 760 ms, the three cuts land at about 1000, 1260 and 1520 ms, the cross bursts on the hit (1780) with no cue of its own.
gust = clip('f2-gust', 711441, 0.0, 1.6, 'gust of wind with leaves as the traveller\'s wind whirls round his boots (0-1.6 s)', fade_in=.02, fade_out=.45, highpass=70, peak=.5)
swing1 = clip('f2-swing', 840716, 0.04, 0.62, 'sword swing: the first and the finishing cut (peak 100 ms in)', fade_in=.004, fade_out=.12, highpass=90, peak=.6)
swing2 = clip('f2-swing-up', 840717, 0.04, 0.62, 'second take of the same swordsman: the rising cut (peak 100 ms in)', fade_in=.004, fade_out=.12, highpass=90, peak=.6)
# Six-star Diệu Ngọc Tứ Hệ Trảm, redone 13/11 (Codex's design): the four hilt stones wake with a steel ring (160 ms),
# he steps in (1150, form 1's strides), the heavy swing peaks just before the blow, the blade strikes and the ground
# splits at 1400 (the damage, loudest).
steel = clip('f3-steel', 707339, 0.06, 0.41, 'long steel blade sliding and ringing as the four hilt stones wake (peaks 160 ms in)', fade_in=.004, fade_out=.12, highpass=120, peak=.5)
heavy = clip('f3-heavy', 367182, 0.10, 0.70, 'a heavy blade tearing the air: the great downward cut (peaks 130 ms in)', fade_in=.004, fade_out=.18, highpass=50, peak=.6)
blow = clip('f3-blow', 431019, 0.0, 0.35, 'steel striking rock: the six-star basic down-cut lands (struck 50 ms in; the ultimate had it until 14/11)', fade_in=.002, fade_out=.12, highpass=45, peak=.82)
# Six-star basic attack: the down-cut's short swing and its dry steel hit (the shared attack plays them on contact).
bswing = clip('f3-bswing', 471097, 1.70, 2.20, 'a short sword swing: the basic down-cut (peaks 160 ms in)', fade_in=.004, fade_out=.12, highpass=90, peak=.55)
bhit = clip('f3-bhit', 547042, 0.0, 0.55, 'a ringing steel sword hit: the great blow of the six-star ultimate lands, the damage (struck 90 ms in; the basic cut had it until 14/11)', fade_in=.002, fade_out=.18, highpass=70, peak=.75)

cry, steps, rush = form1('charge-cry'), form1('dash-steps'), form1('dash-rush')
# (sound, ms from the cast, volume) exactly as forms-hiro.js plays them.
PLAYS = {
    2: [(cry, 60, .55), (gust, 0, .5), (steps, 740, .5), (rush, 760, .5), (swing1, 930, .5), (swing2, 1190, .5), (swing1, 1450, .55)],
    3: [(cry, 60, .55), (steel, 0, .45), (steps, 1150, .45), (heavy, 1250, .5), (blow, 1350, .72)],
}
for form, plays in PLAYS.items():
    mix = np.zeros((round(3.5 * RATE), 2)); played = mix.copy()
    for x, at, volume in plays:
        o = round(at / 1000 * RATE); mix[o:o + len(x)] += x; played[o:o + len(x)] += x * volume
    print(f'form {form} mix peak at unity', round(float(np.abs(mix).max()), 3), 'as played', round(float(np.abs(played).max()), 3))
    assert np.abs(played).max() <= .8
MANIFEST.write_text(json.dumps(USED, indent=2, ensure_ascii=False) + chr(10), encoding='utf-8', newline=chr(10))
