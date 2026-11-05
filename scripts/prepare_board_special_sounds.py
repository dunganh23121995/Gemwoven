"""Board special sounds (owner 05/11: the row/column sweep sounds like a hand run over piano keys; the bomb's fire
vortex closes, then booms; the Lõi gathers, then bursts). One real CC0 recording per cue (Freesound HQ previews kept in
assets/audio/sources/board-specials/), only excerpted, high-passed, faded and gained.
Writes assets/audio/board-specials/*.wav and assets/audio/board-specials/manifest.json (keys board-<cue>)."""
import hashlib, json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/audio/sources/board-specials'
OUT = ROOT / 'assets/audio/board-specials'
RATE = 44100
CUES = {
    # cue: (file, start, end, fade-out s, high-pass Hz, peak, beat, title, author, id)
    # The last 420 ms of a real piano glissando (owner 05/11: the barrel piano first tried sounded like a đàn tranh),
    # played as the blades leave the gem, so the keys climb while they cross the board; then the top note's release.
    'bolt-sweep': ('383858.mp3', 0.98, 1.75, .33, 50, .85, 'Sao băng quét: piano miết phím', 'Piano Slide Low Note to High Note Ascending', 'deleted_user_7146007', '383858'),
    'bomb-swirl': ('475879.mp3', 0.0, 0.47, .15, 50, .7, 'Bom: xoáy lửa co lại', 'ESE - WHOOSH - CALM - Fire Flame.wav', 'EpicSoundEffects', '475879'),
    'bomb-boom': ('251759.mp3', 0.03, 2.6, 1.4, 35, .9, 'Bom: bùm', 'BOOMING PUNCHY EXPLOSION - close, big SCHOEPS MK41.wav', 'misosound', '251759'),
    # Lõi (owner 05/11: the wind chimes did not fit): a soft spell swell while its beams reach out and draw the gems in,
    # then a bright crystal cast with its natural tail when it bursts.
    'core-gather': ('876167.mp3', 0.0, 1.23, .45, 60, .75, 'Lõi: tụ lực, hút ngọc', 'Soft Magic Spell Cast Whoosh (Fantasy RPG)', 'Assetsmith', '876167'),
    'core-burst': ('691005.mp3', 0.04, 2.88, 1.6, 60, .85, 'Lõi: bung nổ', 'Icy Magic Cast', 'DustyWind', '691005'),
}


def load(path):
    pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, '<f4').reshape(-1, 2).copy()


def highpass(x, hz):
    # one-pole high-pass per channel
    a = RATE / (RATE + 2 * np.pi * hz); y = np.zeros_like(x); prev_x = np.zeros(2); prev_y = np.zeros(2)
    for i in range(len(x)):
        prev_y = a * (prev_y + x[i] - prev_x); prev_x = x[i]; y[i] = prev_y
    return y


manifest = {}
for cue, (file, start, end, fade, hz, peak, beat, title, author, sid) in CUES.items():
    x = load(SRC / file)[int(start * RATE):int(end * RATE)]
    x = highpass(x, hz)
    n = len(x); fin = int(.006 * RATE); fout = int(fade * RATE)
    env = np.ones(n); env[:fin] = np.linspace(0, 1, fin); env[-fout:] *= np.linspace(1, 0, fout) ** 1.6
    x = x * env[:, None]; x *= peak / max(1e-6, np.abs(x).max())
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    path = OUT / f'{cue}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '2', '-i', 'pipe:0', str(path)], input=pcm.tobytes(), check=True)
    manifest['board-' + cue] = {
        'file': f'board-specials/{cue}.wav', 'duration': round(n / RATE, 2), 'beat': beat, 'license': 'CC0-1.0',
        'sources': [{'title': title, 'author': author, 'source_url': f'https://freesound.org/people/{author}/sounds/{sid}/', 'license': 'CC0-1.0',
                     'sha256': hashlib.sha256((SRC / file).read_bytes()).hexdigest()}],
        'processing': f'excerpt {start:.2f}-{end:.2f} s of one recording, {hz} Hz high-pass, {fade:.2f} s fade-out, gain to peak {peak}',
        'peak': peak}
    print(cue, manifest['board-' + cue]['duration'])
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
