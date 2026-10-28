"""The studio's sound library (tools/sound-library.html): every sound the game plays, grouped as the
builds load them (build.py, scripts/build_gemwoven.py), and the reference voices kept in
assets/audio/library (library.json). Writes tools/sound-library.json; build.py runs it.

  python scripts/build_sound_library.py
Sounds the game synthesizes in code (combatV3Tone / combatV3Noise) have no file and are not listed.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'assets/audio'
HEROES = {'mika': 'Mika', 'nori': 'Nori', 'yuki': 'Yuki', 'lumi': 'Lumi', 'noct': 'Noct', 'hiro': 'Hiro', 'fire': 'Mika', 'earth': 'Nori',
          'ice': 'Yuki', 'lightning': 'Lumi', 'shadow': 'Noct', 'novice': 'Hiro'}
# (title, manifest files under assets/audio, what they are)
GROUPS = [
    ('Giọng tướng', ['manifest.json', 'hiro-voice-manifest.json', 'noct-manifest.json'], 'combatVoice: đánh, bị đánh, gồng chiêu, tung chiêu'),
    ('Giọng tướng khi gồng chiêu', ['cast-voice-manifest.json'], 'combatVoice cast/release'),
    ('Hiệu ứng kỹ năng tướng', ['cast-sfx-manifest.json', 'lumi-thunder-manifest.json', 'yuki-glacier-manifest.json', 'mika-nori-manifest.json',
                               'form-skill-manifest.json', *sorted(f'hero-forms/{p.name}' for p in (AUDIO / 'hero-forms').glob('*-manifest.json'))],
     'playCastSound: tuyệt kỹ và chiêu theo từng dạng'),
    ('Hiệu ứng Noct', ['noct-sfx-manifest.json'], 'playNoctSound'),
    ('Giọng boss và tinh anh', ['boss-voice-manifest.json'], 'combatVoice phía địch (voice-casting.json chọn giọng)'),
    ('Tiếng quái', ['creature-manifest.json'], 'combatVoice quái thường'),
    ('Nhạc', ['music-manifest.json', 'boss-music-manifest.json'], 'nhạc nền trận và boss'),
    ('Triệu hồi', ['summon/summon-sounds.json'], 'màn triệu hồi ở hub'),
]


def credit(entry):
    """[(text, url)] for whatever source form a manifest entry uses."""
    found = entry.get('sources') or ([entry['source']] if entry.get('source') else [])
    out = []
    for s in found:
        if isinstance(s, dict):
            out.append((' · '.join(x for x in [s.get('title'), s.get('author'), s.get('license')] if x), s.get('source_url') or s.get('url') or ''))
        else:
            out.append((str(s), ''))
    if not out and entry.get('license'):
        out.append((entry['license'], ''))
    if not out and entry.get('original'):
        out.append(('nhạc gốc của dự án', ''))
    return out


def owner(key):
    head = key.split('-')[0]
    return HEROES.get(head) or (HEROES.get(key.split('-')[1]) if head in ('boss', 'creature') and '-' in key else None) or ''


def item(key, entry):
    file = entry['file'] if entry['file'].startswith('assets/') else 'assets/audio/' + entry['file']
    what = entry.get('beat') or entry.get('what') or entry.get('title') or entry.get('category') or ''
    return {'key': key, 'file': file, 'duration': round(float(entry.get('duration') or 0), 2), 'what': what, 'hero': owner(key),
            'credit': [{'text': t, 'url': u} for t, u in credit(entry)]}


def main():
    groups = []
    for title, files, note in GROUPS:
        items = []
        for name in files:
            path = AUDIO / name
            if path.exists():
                items += [item(k, v) for k, v in json.loads(path.read_text(encoding='utf-8')).items() if isinstance(v, dict) and v.get('file')]
        groups.append({'title': title, 'note': note, 'items': items})
    # Files the code plays by path, outside every manifest.
    listed = {i['file'] for g in groups for i in g['items']}
    direct = sorted({m for js in (ROOT / 'src').rglob('*.js') for m in re.findall(r"assets/audio/[\w/.-]+\.(?:wav|ogg|mp3)", js.read_text(encoding='utf-8'))} - listed)
    groups.append({'title': 'Khác (gọi thẳng trong code)', 'note': 'đường dẫn viết trong src/*.js', 'items': [
        {'key': Path(f).stem, 'file': f, 'duration': 0, 'what': '', 'hero': owner(Path(f).stem), 'credit': []} for f in direct if (ROOT / f).exists()]})
    library = json.loads((AUDIO / 'library/library.json').read_text(encoding='utf-8'))
    used = {c['text'].split(' · ')[0] for g in groups for i in g['items'] for c in i['credit']}
    for v in library['voices']:
        v['file'] = 'assets/audio/' + v['file']
        v['inUse'] = v['source']['title'] in used
    out = {'groups': groups, 'library': library}
    (ROOT / 'tools/sound-library.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print('sound library:', sum(len(g['items']) for g in groups), 'sounds in use,', len(library['voices']), 'reference voices')


if __name__ == '__main__':
    main()
