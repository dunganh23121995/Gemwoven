"""Each boss skill's own sounds (src/foe-skills.js, BOSS_SKILL_LOOKS), so no two bosses' kits sound alike.

Like the heroes' form sounds (scripts/prepare_mika_form_sounds.py): every cue is ONE clean real CC0
recording, minimally edited: an excerpt with its natural attack and decay, a gentle high-pass, gain
(peak <= 0.82, no limiting or saturation) and short edge fades. No layering, pitch or time change, no
synthesis. An ultimate's damage hit keeps its long natural tail.
A boss's recordings are its own: none is used by a hero, a creature, an elite or another boss (each is
listed in SOURCES, downloaded once into assets/audio/sources/freesound with its source.json, and the
build stops if any other sound in the game already uses it).
Output: assets/audio/boss-skills/<boss>/*.wav and assets/audio/boss-skills/<boss>-manifest.json, merged by
build.py into ART.castSounds as bossfx-<boss>-<cue> (played with playCastSound('bossfx-<boss>', cue)).
Rebuild: python scripts/prepare_boss_skill_sounds.py [boss ...]
"""
import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

REPO = Path(__file__).resolve().parents[1]
AUDIO = REPO / 'assets/audio'
RATE = 32000
CC0 = {'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/'}


def fs(sid, author, title, preview):
    return {'title': title, 'author': author, 'source_url': f'https://freesound.org/people/{author}/sounds/{sid}/',
            'download_url': f'https://cdn.freesound.org/previews/{sid[:3]}/{sid}_{preview}-hq.mp3', **CC0}


# Freesound id -> provenance (Freesound public HQ MP3 previews, all CC0).
SOURCES = {
    '234547': fs('234547', 'Electroviolence', 'Big Swoosh', '4238641'),
    '183452': fs('183452', 'utsuru', 'Wood Crack 2', '418644'),
    '683956': fs('683956', 'itinerantmonk108', 'Trees rubbing in wind.wav', '2397507'),
    '575904': fs('575904', 'zeteny_zpx', 'Throwing logs', '3036029'),
    '364697': fs('364697', 'alegemaate', 'Tear Foliage Grass', '2531187'),
    '140700': fs('140700', 'afleetingspeck', 'Packaging Paper Tube Air Suck.wav', '2522406'),
    '635053': fs('635053', 'sillygrizzlies', 'Rustling Foliage in Forest', '5756735'),
    '378558': fs('378558', 'CawawaC', 'Asoada impact low tube.wav', '3795104'),
}

# boss -> [(cue, freesound id, start s, end s, what is heard, options)]
CUES = {
    # Thạch Mộc Cự Vệ, the stone-and-wood golem of chapter 1: wood, leaves and earth, no metal or stone clanks.
    'earth': [
        ('claw-swing', '234547', .15, .95, 'Nanh Vuốt: the huge talon swung through the air, a big swoosh', {'fade_out': .2}),
        ('claw-hit', '183452', 1.25, 2.3, 'Nanh Vuốt: the talon rakes the hero, wood splitting with a crack', {'fade_in': .002, 'fade_out': .3}),
        ('guard-grow', '683956', .9, 3.8, 'Giáp Cổ Thụ: the trunks twist up round the boss, old trees creaking', {'fade_in': .15, 'fade_out': .4}),
        ('guard-lock', '575904', 2.35, 3.0, 'Giáp Cổ Thụ: the trunks lock shut, a heavy log thudding down', {'fade_in': .002, 'fade_out': .25}),
        ('snare-roots', '364697', .9, 2.4, 'Hút Linh Lực: roots tear up through the grass and soil', {'fade_in': .05, 'fade_out': .3}),
        ('snare-drain', '140700', .1, 2.3, 'Hút Linh Lực: the roots drink the hero\'s spirit, a long sucking draw', {'fade_in': .05, 'fade_out': .3}),
        ('ult-slam', '378558', .2, 4.44, 'Thần Mộc Bất Tử: the golem crashes down, one deep hollow boom ("uỳnh") with its long natural tail', {'fade_in': .003, 'fade_out': 1.6, 'highpass': 25, 'rms': .16}),
        ('ult-bless', '635053', 2.3, 4.9, 'Thần Mộc Bất Tử: the spirit tree unfurls, a rush of forest leaves', {'fade_in': .1, 'fade_out': .6, 'rms': .08}),
    ],
}

# The other bosses' cues, picked by scripts/pick_boss_skill_sounds.py: boss/fx/cue -> one recording and its
# excerpt, played as bossfx-<boss>-<fx>-<cue>. Each cue kind keeps its own edit: a start or a hit is short
# and clean, a lock is a dry thud, a land keeps its long rumble, a boom (a giant's body or foot meeting the ground) keeps its deep
# hit and tail, a grow swells in and fades out slowly.
KIND = {'start': {'fade_in': .02, 'fade_out': .2}, 'hit': {'fade_in': .002, 'fade_out': .25},
        'lock': {'fade_in': .002, 'fade_out': .2}, 'land': {'fade_in': .005, 'fade_out': 1.2, 'highpass': 25, 'rms': .14},
        'grow': {'fade_in': .12, 'fade_out': .5, 'rms': .09}, 'channel': {'fade_in': .15, 'fade_out': .35, 'rms': .08},
        'boom': {'fade_in': .003, 'fade_out': .9, 'highpass': 25, 'rms': .15}}
PICKS = AUDIO / 'boss-skills/picks.json'
for key, pick in (json.loads(PICKS.read_text(encoding='utf-8')) if PICKS.exists() else {}).items():
    boss, fx, kind = key.split('/')
    SOURCES.setdefault(pick['id'], fs(pick['id'], pick['author'], pick['title'], pick['preview']))
    CUES.setdefault(boss, []).append((f'{fx}-{kind}', pick['id'], pick['start'], pick['end'], f'{fx} {kind}: {pick["title"]}', KIND[kind]))


def used_elsewhere():
    """Freesound ids used by any other sound of the game (manifests, credits and sound scripts)."""
    found = set()
    for path in [*AUDIO.rglob('*.json'), AUDIO / 'CREDITS.txt', *(REPO / 'scripts').glob('*.py')]:
        if 'boss-skills' in path.parts or path.name in ('source.json', Path(__file__).name):
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        text = re.sub(r'Boss skill sounds \(.*?(?:\n\n|\Z)', '', text, flags=re.S)   # the bosses' own credits
        found |= set(re.findall(r'sounds/(\d+)', text))
    return found


def source(sid):
    meta = SOURCES[sid]
    slug = re.sub(r'[^a-z0-9]+', '-', meta['title'].lower())[:48].strip('-')   # short: Windows path limit
    folder = AUDIO / 'sources/freesound' / f'{sid}-{slug}'
    path = folder / f'{sid}-{slug}.mp3'
    if not path.exists():
        folder.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(meta['download_url'], headers={'User-Agent': 'Mozilla/5.0'})
        cached = REPO / '.build-cache/freesound-previews' / f'{sid}.mp3'   # already fetched by the picker
        path.write_bytes(cached.read_bytes() if cached.exists() else urllib.request.urlopen(request, timeout=60).read())
        record = {'file': path.name, **meta, 'source_format': 'Freesound public HQ MP3 preview',
                  'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        (folder / 'source.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
    record = json.loads((folder / 'source.json').read_text(encoding='utf-8'))
    assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256'], path
    return path, {k: record[k] for k in ['title', 'author', 'source_url', 'license', 'sha256']}


def read(path):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                                   '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, dtype='<f4').reshape(-1, 2).astype(float)


def build(boss):
    taken = used_elsewhere() & {sid for _, sid, *_ in CUES[boss]}
    assert not taken, f'{boss}: recordings already used by other sounds: {sorted(taken)}'
    out = AUDIO / 'boss-skills' / boss
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.wav'):
        old.unlink()   # the set is rebuilt whole
    used = {}
    for cue, sid, start, end, beat, o in CUES[boss]:
        fade_in, fade_out, highpass, rms = o.get('fade_in', .006), o.get('fade_out', .12), o.get('highpass', 45), o.get('rms', .11)
        path, meta = source(sid)
        x = read(path)[round(start * RATE):round(end * RATE)].copy()
        clipped = float(np.mean(np.abs(x) > .985))
        if clipped > .0005:
            print('warning:', boss, cue, f'{clipped:.2%} of the excerpt is clipped in the source')
        x = sosfilt(butter(2, highpass, btype='highpass', fs=RATE, output='sos'), x, axis=0)
        n_in, n_out = min(round(fade_in * RATE), len(x) // 4), min(round(fade_out * RATE), len(x) // 2)   # short excerpts keep their attack
        x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
        x[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
        x *= min(.82 / max(1e-4, np.abs(x).max()), rms / max(1e-4, np.sqrt(np.mean(x * x))))
        target = out / f'{cue}.wav'
        wavfile.write(target, RATE, np.round(x * 32767).astype(np.int16))
        used[f'bossfx-{boss}-{cue}'] = {
            'file': target.relative_to(AUDIO).as_posix(), 'duration': round(len(x) / RATE, 3), 'beat': beat,
            'license': meta['license'], 'sources': [meta],
            'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {highpass} Hz high-pass, edge fades, gain',
            'peak': round(float(np.abs(x).max()), 3), 'rms': round(float(np.sqrt(np.mean(x * x))), 3),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        print('[ok]', boss, cue, used[f'bossfx-{boss}-{cue}']['duration'], 's peak', used[f'bossfx-{boss}-{cue}']['peak'])
    (AUDIO / 'boss-skills' / f'{boss}-manifest.json').write_text(json.dumps(used, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


for boss in sys.argv[1:] or CUES:
    build(boss)
