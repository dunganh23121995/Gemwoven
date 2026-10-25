"""Mika's four- and six-star ultimate sounds (src/forms-mika.js), rebuilt from scratch on her form-1 sound.

Modelled on Yuki's approved set (scripts/prepare_yuki_form_sounds.py): the backbone is Mika's OWN form-1
recordings, hnhnh's fire whoosh (sources/mika-nori/fire-whoosh.mp3: form 1's flame charge and its 3.9 s
flame whoosh) and Taira Komori's katana recordings, so forms 2-3 sound like the same swordswoman, only
bigger; every other cue is the literal sound of the thing on screen (a fire blooming, a fire whoosh for the
spin, a fire explosion for the sun, fireball hits for the spirits). The damage hit is the loudest clip and
form 1's full flame whoosh rings out from it (3.8 s, natural decay).
Each clip is ONE clean real recording, minimally edited: an excerpt with its natural attack and decay, a
gentle high-pass, gain (peak <= 0.82, no limiting or saturation) and short edge fades. No layering, pitch or
time change, no synthesis.
Output: assets/audio/hero-forms/fire/*.wav and assets/audio/hero-forms/fire-manifest.json
(merged by build.py into ART.castSounds as fire-<name>). Rebuild: python scripts/prepare_mika_form_sounds.py
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
OUT = AUDIO / 'hero-forms/fire'
RATE = 32000
KATANA = {'author': 'Taira Komori (TK\'S FREE SOUND FX)', 'source_url': 'https://taira-komori.net/jidaigeki01en.html',
          'license': 'TK\'S FREE SOUND FX terms (free use and processing in games, credit), https://taira-komori.net/freesounden.html'}


def source(ref):
    """('freesound', id) -> its folder's source.json; ('mika-nori'|'katana', file) -> the project's record."""
    kind, key = ref
    if kind == 'freesound':
        folder = next((AUDIO / 'sources/freesound').glob(f'{key}-*'))
        meta = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
        return folder / meta['file'], {'title': meta['title'], 'author': meta['author'], 'source_url': meta['source_url'],
                                       'license': meta['license'], 'sha256': meta['sha256']}
    path = AUDIO / 'sources' / kind / key
    if kind == 'mika-nori':
        meta = next(s for s in json.loads((path.parent / 'sources.json').read_text(encoding='utf-8')) if s['file'] == key)
        return path, {'title': key, 'author': meta['author'], 'source_url': meta['source_url'], 'license': meta['license'], 'sha256': meta['sha256']}
    return path, {'title': key, **KATANA, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def read(path):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                   '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)


USED = {}


def clip(name, ref, start, end, beat, fade_in=.006, fade_out=.12, highpass=45, rms=.11):
    """One recording, [start, end) s, a gentle high-pass, short edge fades, gain to form 1's level."""
    path, meta = source(ref)
    x = read(path)[round(start * RATE):round(end * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
    n_in, n_out = round(fade_in * RATE), round(fade_out * RATE)
    x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    x *= min(.82 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f'{name}.wav'
    wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
    USED[f'fire-{name}'] = {
        'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
        'license': meta['license'], 'sources': [meta],
        'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
        'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    print('[ok]', name, USED[f'fire-{name}']['duration'], 's peak', USED[f'fire-{name}']['peak'], 'rms', USED[f'fire-{name}']['rms'])


WHOOSH = ('mika-nori', 'fire-whoosh.mp3')     # form 1's flame charge and flame whoosh
for old in OUT.glob('*.wav'):
    old.unlink()   # the set is rebuilt whole

# ---- Form 3's backbone: form 1's recordings ------------------------------------------
# The gather, like form 1's flame charge: the fire whoosh catching and swelling (0-1.3 s, fades under
# the swing).
clip('gather', WHOOSH, .03, 1.33, 'fire catching and swelling on the weapon (gather, from 0 ms)', fade_in=.005, fade_out=.35)
# The finale, form 1's full flame whoosh with its own decay, ringing out from the damage hit.
clip('finale', WHOOSH, .05, 3.86, "form 1's full flame whoosh ringing out from the damage hit (3.8 s)", fade_in=.005, fade_out=.3)
# A steel blade drawn and ringing (the glaive drawn back).
clip('draw', ('katana', 'extracting_a_sword1.mp3'), 0, .5, 'a steel blade drawn and ringing', fade_out=.08)
# A blade cutting through (form 3's crescent).
clip('cut', ('katana', 'cutting_with_a_katana1.mp3'), .1, .72, 'a blade cutting through the foe', fade_in=.003, fade_out=.15)

# ---- Four-star: Hồ Diễm Long Trảm (redesigned: tight, nothing rings on after the floor fire) -------
# 0-1170 ms, the sword igniting and the fox-fire blade flaring up and roaring: a fire torch flaring.
clip('f2-blaze', ('freesound', '483316'), .4, 1.6, 'sword ignites, the fox-fire blade flares up and roars (0-1170 ms)', fade_in=.01, fade_out=.25)
# 950-1170 ms, the huge overhead cleave: one low fast swoosh peaking as it lands.
clip('f2-cleave', ('freesound', '507470'), .85, 1.35, 'the huge overhead cleave (950-1170 ms)', fade_in=.005, fade_out=.15)
# 1170 ms, the impact through the foe (damage hit): a short fiery explosion.
clip('f2-impact', ('freesound', '843247'), 0, .74, 'the blade blasts through the foe (damage hit, 1170 ms)', fade_in=.002, fade_out=.12)
# 1280-2700 ms, the cut burning along the floor (visible 1280-1800), then fading out within a second:
# a large fire's steady roar, faded, no reverberant tail.
clip('f2-floor', ('freesound', '483308'), .5, 1.9, 'the cut burns along the floor and fades (1280-2700 ms)', fade_in=.04, fade_out=.7)

# ---- Six-star: Cửu Dương Hồ Diễm --------------------------------------------------------------------
# The nine tails flare into a sun: a fire blooming open.
clip('f3-flare', ('freesound', '761330'), .5, 1.45, 'the nine tails flare into a sun of fire', fade_in=.02, fade_out=.15)
# The flat spinning sweep: a fire whoosh.
clip('f3-sweep', ('freesound', '260555'), .18, .7, 'the glaive spun flat, a ring of fire', fade_in=.003, fade_out=.15)
# The nine-tailed sun bursts on the foe (damage hit): a fire explosion.
clip('f3-sun', ('freesound', '855898'), 0, 1.23, 'the nine-tailed sun bursts on the foe (damage hit)', fade_in=.002, fade_out=.2)
# The three waves of fox-fire spirits bursting on the foe: three distinct deep booms ("thùng, thùng,
# thùng"), each cut short so the next one reads.
clip('f3-boom1', ('freesound', '343451'), 0, .3, 'first spirit wave explodes (deep boom)', fade_in=.002, fade_out=.12)
clip('f3-boom2', ('freesound', '343452'), 0, .3, 'second spirit wave explodes (deep boom)', fade_in=.002, fade_out=.12)
clip('f3-boom3', ('freesound', '758072'), .18, .55, 'third spirit wave explodes (cannon boom)', fade_in=.002, fade_out=.15)

(AUDIO / 'hero-forms/fire-manifest.json').write_text(json.dumps(USED, indent=2, ensure_ascii=False) + chr(10), encoding='utf-8')
