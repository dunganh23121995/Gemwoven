"""The elites' shared sound bank (src/foe-skills.js ELITE_SOUNDS), played as elitefx-<cue>.

Elites share three sets by how they fight: a bow, a melee weapon, ranged magic. Each has a cue for a basic blow and a
skill's wind-up, a long charge for the big skill, and a hit heard on every blow that lands; a cue with several takes
plays them in turn, so a flurry never repeats one sound. A guard and a heal are shared by all. Elites have no voices.

Every cue is a file of a pack made for games, "Fantasy SFX Pack Vol 1" by JC Sounds (CC BY 4.0: the credit stays in
assets/audio/CREDITS.txt and belongs in the game's credits). Only edits: mono, a trim of leading silence so it answers at
once, a tail cut where noted, gain to peak 0.82 and short edge fades. The files used are kept in SOURCE.
Output: assets/audio/elite-skills/<cue>.wav and manifest.json, merged by build.py into ART.castSounds.

  python scripts/prepare_elite_sounds.py
"""
import json
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile

REPO = Path(__file__).resolve().parents[1]
AUDIO = REPO / 'assets/audio'
BANK = AUDIO / 'elite-skills'
SOURCE = AUDIO / 'sources/jc-fantasy-sfx'
RATE = 32000
CREDIT_HEAD = 'Elite skill sounds (scripts/prepare_elite_sounds.py)'
PACK = 'Fantasy SFX Pack Vol 1'

# cue: (source file, longest seconds). A list is a cue's takes, written as <cue>-1, <cue>-2, ...
CUES = {
    'bow-draw': ('Bow_Arrow_Draw_01', None),
    'bow-charge': ('Bow_Arrow_Draw_02', None),
    'bow-loose': [('Bow_Arrow_Shoot_01', None), ('Bow_Arrow_Shoot_02', None)],
    'bow-hit': [('Bow_Arrow_Hit_01', None), ('Bow_Arrow_Hit_02', None)],
    'melee-swing': [('_Sword_Swing_01', None), ('_Sword_Swing_02', None), ('_Sword_Swing_03', None)],
    'melee-charge': ('Seq_Fantasy SFX Pack Vol 1_Mana Drain_Start', None),
    'melee-hit': [('_Sword_Hit_Metal_01', None), ('_Sword_Hit_Metal_02', None), ('_Sword_Hit_Metal_03', None)],
    'melee-heavy': [('Heavy Sword_Hit_Metal_01', None), ('Heavy Sword_Hit_Metal_02', None), ('Heavy Sword_Hit_Metal_03', None)],
    'magic-cast': [('Fireball Launch_01', None), ('Fireball Launch_02', None), ('Fireball Launch_03', None)],
    'magic-charge': ('Fireball_Buildup', None),
    'magic-hit': [('Fireball Impact_01', 1.1), ('Fireball Impact_02', 1.1), ('Fireball Impact_03', 1.1)],
    'guard-lock': ('Magic Shield_Activation_01', 1.7),
    'heal-grow': ('Healing Chime_01', 2.6),
}


def source(name):
    found = [p for p in SOURCE.glob('*.wav') if p.stem.endswith(name)]
    assert len(found) == 1, (name, found)
    return found[0]


def clip(name, longest):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(source(name)), '-ar', str(RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    x = np.frombuffer(pcm, '<f4').copy()
    start = max(0, int(np.argmax(np.abs(x) > np.abs(x).max() * .03)) - int(.003 * RATE))
    x = x[start:]
    if longest:
        x = x[:int(longest * RATE)]
    x *= .82 / max(1e-6, np.abs(x).max())
    fade_in, fade_out = int(.002 * RATE), int(min(.25, len(x) / RATE * .3) * RATE)
    x[:fade_in] *= np.linspace(0, 1, fade_in)
    x[-fade_out:] *= np.linspace(1, 0, fade_out) ** 2
    return x


def main():
    for old in [*BANK.glob('*.wav'), *BANK.glob('picks.json')]:
        old.unlink()
    manifest = {}
    for cue, spec in CUES.items():
        takes = spec if isinstance(spec, list) else [spec]
        for i, (name, longest) in enumerate(takes, 1):
            key = f'{cue}-{i}' if isinstance(spec, list) else cue
            x = clip(name, longest)
            wavfile.write(BANK / f'{key}.wav', RATE, (x * 32767).astype('<i2'))
            manifest[f'elitefx-{key}'] = {'file': f'elite-skills/{key}.wav', 'duration': round(len(x) / RATE, 3)}
    (BANK / 'manifest.json').write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')
    credits = AUDIO / 'CREDITS.txt'
    text = re.sub(re.escape(CREDIT_HEAD) + r'.*?(?:\n\n|\Z)', '', credits.read_text(encoding='utf-8'), flags=re.S).rstrip() + '\n\n'
    credits.write_text(text + CREDIT_HEAD + ':\n    "' + PACK + '" by JC Sounds, https://opengameart.org/content/jc-sounds-fantasy-sfx-pack-vol-1 (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/)\n    Changes: mixed to mono, trimmed, gain and fades.\n', encoding='utf-8')
    print(len(manifest), 'takes', round(sum(p.stat().st_size for p in BANK.glob('*.wav')) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
