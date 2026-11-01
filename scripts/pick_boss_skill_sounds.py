"""Pick each boss skill's own recordings on Freesound (CC0 only), for scripts/prepare_boss_skill_sounds.py.

For every cue of every boss skill (QUERIES below, cue names as in src/foe-skills.js BOSS_SKILL_LOOKS)
the search walks its queries in order and takes the first recording that no other sound of the game uses
(nor any cue picked before it), is clean in the source (no clipped samples) and has a clear event: the
excerpt starts just before its loudest moment and runs until it has decayed, capped per cue kind.
Picks are written to assets/audio/boss-skills/picks.json (kept: a cue already picked is not searched
again; delete its entry to pick it anew, or pin it by hand with start/end).

  python scripts/pick_boss_skill_sounds.py [boss ...]
"""
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import imageio_ffmpeg
import numpy as np

REPO = Path(__file__).resolve().parents[1]
AUDIO = REPO / 'assets/audio'
PICKS = AUDIO / 'boss-skills/picks.json'
CACHE = REPO / '.build-cache/freesound-previews'
RATE = 16000
# Longest excerpt per cue kind (s): a start sets the move off, a hit lands, a lock closes a ward,
# a land is a quake's crash (it keeps its rumble), a boom is the deep thud of a giant body or foot
# meeting the ground (picked by hand, pinned in picks.json), a grow plays under a bloom, a climax lands with an
# ultimate's finishing set piece (src/foe-skills.js foeUltFinale) and keeps its tail.
LONGEST = {'start': 1.6, 'hit': 1.6, 'lock': 1.0, 'land': 3.5, 'grow': 2.6, 'channel': 1.4, 'boom': 2.6, 'climax': 2.8}

# boss -> fx -> {cue: 'query | query | ...'}
QUERIES = {
    'fire': {'breath': {'start': 'fire whoosh | flame whoosh', 'hit': 'fireball explosion | fire burst'},
             'scales': {'start': 'lava bubbling | magma', 'lock': 'stone slab drop | rock slam'},
             'claws': {'start': 'fire swoosh | torch swing', 'hit': 'sizzle | hot metal water'},
             'firesea': {'start': 'flamethrower | gas flame', 'hit': 'fire burst | fire ignition | fireball'}},
    'ice': {'moonspear': {'start': 'wind whistle | whoosh thin', 'hit': 'ice shatter | ice break'},
            'moonward': {'start': 'ice cracking | frozen lake', 'lock': 'ice block | ice impact'},
            'moonwind': {'start': 'cold wind howl | winter wind', 'hit': 'snow gust | blizzard'},
            'moonseal': {'start': 'spear throw | javelin | throw whoosh | swoosh', 'hit': 'ice freezing crack | ice creak'}},
    'lightning': {'strike': {'start': 'thunder rumble distant', 'hit': 'thunder crack | thunderclap'},
                  'field': {'start': 'electric hum | electricity buzz', 'hit': 'electric zap | spark zap'},
                  'thunderclaw': {'start': 'electric charge | static electricity', 'hit': 'electric shock | arc spark'},
                  'cannon': {'start': 'charging energy | electric charge up | static crackle', 'hit': 'thunder loud | thunder strike'}},
    'mire': {'toadstools': {'start': 'mud bubble | bog bubbles | mud | squelch boots', 'hit': 'puff air | spore puff'},
             'bigcap': {'grow': 'squelch | slime squish'},
             'mycelium': {'start': 'roots creak | squelch mud', 'hit': 'slurp | suck liquid'},
             'dizzy': {'start': 'bubbles pop | popping', 'hit': 'spray hiss | aerosol'}},
    'scarab': {'wingshield': {'start': 'sand pouring | sand falling', 'lock': 'stone door | stone lid'},
               'sawdisc': {'start': 'spinning whoosh | spin whir', 'hit': 'stone grinding | grinding stone | grinding'},
               'sandscythe': {'start': 'sand throw | sand swoosh', 'hit': 'sand hit | gravel impact'},
               'obelisks': {'start': 'stone rumble | rocks rumbling | rocks moving | stone drag', 'land': 'rock crash | stone pillar fall'}},
    'leviathan': {'crusher': {'start': 'water whoosh | water swing', 'hit': 'wave crash | wave splash'},
                  'fountain': {'grow': 'fountain water | water jet'},
                  'whirlpool': {'start': 'water drain | whirlpool', 'hit': 'water splash big | splash'},
                  'reef': {'grow': 'underwater bubbles | bubbles water'}},
    'colossus': {'steamburst': {'start': 'steam hiss | pressure release', 'hit': 'steam release | steam burst'},
                 'hammer': {'start': 'piston | mechanical motion', 'hit': 'anvil | hammer metal'},
                 'ironwall': {'start': 'machine gears | gears turning', 'lock': 'metal clank heavy | metal slam'},
                 'smash': {'start': 'machine wind up | motor start', 'land': 'metal crash | scrap metal fall'}},
    'prism': {'shard': {'start': 'glass whoosh | glass spin', 'hit': 'glass break | glass shatter'},
              'mirrors': {'start': 'wine glass | glass resonance', 'lock': 'glass clink | glass tap'},
              'spectrum': {'start': 'wine glass rub | glass ringing | glass resonance', 'hit': 'glass smash | window break'},
              'prisms': {'start': 'glass scraping | glass scrape', 'hit': 'crystal chime | glass chimes'}},
    'reaper': {'scythe': {'start': 'scythe swish | blade swish | scythe | swish', 'hit': 'sword slash | blade cut'},
               'soulknot': {'start': 'ghost whisper | eerie breath', 'hit': 'chains rattle | chain rattle'},
               'crosscut': {'start': 'sword unsheathe | blade draw', 'hit': 'knife slash | knife stab'},
               'tatters': {'start': 'cloth flap | fabric flutter', 'hit': 'dark whoosh | swoosh deep'}},
    'roc': {'featherblade': {'start': 'wing flap | wings flapping', 'hit': 'air swipe | swish fast'},
            'featherwall': {'start': 'wind gust | gust', 'lock': 'flapping | bird wings'},
            'cyclone': {'start': 'tornado | strong wind | windy | gust wind', 'hit': 'wind howl | wind storm | wind blast | howling'},
            'dive': {'start': 'fly by | flyby whoosh', 'hit': 'body fall | heavy thud'}},
    'briar': {'venomthorns': {'start': 'branch rustle | bush rustle', 'hit': 'stab wood | stabbing'},
              'maw': {'start': 'snap | twig snap', 'hit': 'squish | squelch'},
              'brambles': {'start': 'branches cracking | twigs', 'lock': 'bush | hedge'},
              'thorncrown': {'start': 'vines | plant rustle', 'hit': 'impale | wood break'}},
    'seraph': {'thrust': {'start': 'sword draw | sword unsheath', 'hit': 'sword stab | metal stab'},
               'halo': {'grow': 'wind chimes | chimes | bells'},
               'lightspear': {'start': 'wind chimes | chimes | shimmer', 'hit': 'church bell | bell strike | temple bell'},
               'sealbeam': {'start': 'singing bowl | tibetan bowl', 'hit': 'gong | gong hit'}},
    'eclipse': {'starshards': {'start': 'space whoosh | swoosh magic', 'hit': 'chimes | sparkle'},
                'starbeam': {'start': 'thunder rumble low | rumble distant | earthquake rumble', 'hit': 'explosion distant | far explosion'},
                'nebulafire': {'start': 'gas burner | burner ignite', 'hit': 'explosion | blast'},
                'galaxy': {'start': 'vacuum | suction', 'hit': 'deep boom | sub boom'}},
    'elderbloom': {'rootspears': {'start': 'wood creak | creaking wood', 'hit': 'branch snap | wood snap'},
                   'birchbark': {'start': 'wood rubbing | bark', 'lock': 'wood knock | wooden knock'},
                   'rootcircle': {'grow': 'plant growing | roots'},
                   'pollenbloom': {'start': 'petals | flower', 'hit': 'pop | cork pop'},
                   'springtree': {'grow': 'leaves rustle | leaves'},
                   'rootquake': {'start': 'earth rumble | ground rumble', 'land': 'tree roots ripping | ground crack'}},
    'cinderheart': {'fistwave': {'start': 'punch whoosh | punch swing', 'hit': 'rock smash | rock break'},
                    'columns': {'start': 'rock grinding | stone grind', 'lock': 'rock slam | boulder | rock drop | stone drop'},
                    'vent': {'grow': 'volcano | steam vent'},
                    'spikeline': {'start': 'rock cracking | stone crack', 'land': 'rock explosion | rocks explode'},
                    'pumice': {'start': 'falling whistle | bomb falling', 'hit': 'rock impact | stone hit'},
                    'geyser': {'start': 'magma bubbling | lava', 'hit': 'geyser | eruption | explosion fire | fire explosion'}},
    'frostregent': {'icicle': {'start': 'ice slide | ice sliding', 'hit': 'icicle break | ice break'},
                    'icemirror': {'start': 'ice crack | ice creak', 'lock': 'ice impact | ice hit'},
                    'icepillars': {'grow': 'ice creak | ice cracking | frozen lake'},
                    'aurorabeam': {'start': 'shimmer drone | ethereal pad | shimmer | wind chime', 'hit': 'ice crack big | ice shatter | ice smash | frozen crack'},
                    'hail': {'start': 'hail | hailstorm', 'hit': 'ice cubes | ice cube drop'},
                    'glacierspire': {'start': 'glacier | ice cracking', 'hit': 'ice collapse | ice fall | ice smash | ice break'}},
    'tempestwing': {'plasmaclaw': {'start': 'sparkler | sparks whoosh | welding sparks', 'hit': 'electric spark | sparks'},
                    'stormfeathers': {'start': 'electrical buzz | electric hum | static electricity | transformer hum', 'lock': 'electric arc | arcing | spark | sparks electric'},
                    'windcircle': {'grow': 'wind whirl | whirlwind'},
                    'plasmaball': {'start': 'tesla coil | tesla', 'hit': 'electric shock | short circuit | arc flash | electric spark | electricity | sparks | spark'},
                    'stormeye': {'start': 'storm wind | stormy wind', 'hit': 'zap | electric zap'},
                    'judgement': {'start': 'thunderstorm | storm thunder | thunder distant | thunder roll', 'hit': 'lightning strike | lightning close'}},
    'souljailer': {'ghostscythe': {'start': 'metal swish | metal whoosh', 'hit': 'metal scrape | blade scrape'},
                   'cage': {'start': 'iron gate | gate creak', 'lock': 'cell door | prison door'},
                   'chaincircle': {'grow': 'chains | chain'},
                   'chainknot': {'start': 'chain drag | chains dragging', 'hit': 'chain impact | chain drop'},
                   'ghostpillars': {'start': 'eerie wind | ghostly wind | howling wind', 'hit': 'flame burst | fire ignite'},
                   'cageslam': {'start': 'creaky metal | metal creak', 'hit': 'metal door slam | iron door'}},
    'sporefather': {'rotslam': {'start': 'log creak | tree creak | wood creak', 'land': 'log drop | wood crash | log fall | tree fall'},
                    'shelves': {'start': 'squelch wet | wet squish', 'lock': 'wood thud | wooden thud'},
                    'sprouts': {'grow': 'popping | pops'},
                    'sporepod': {'start': 'puff | blow', 'hit': 'splat | splatter'},
                    'threads': {'start': 'goo | slime', 'hit': 'squeeze | wet squeeze'},
                    'bloomrot': {'start': 'bubbling | boiling', 'hit': 'gas release | hiss gas'}},
    'prismback': {'bricks': {'start': 'earthquake | rumble earthquake | ground rumble', 'land': 'bricks falling | wall collapse | bricks'},
                  'wall': {'start': 'stone grinding | stone sliding', 'lock': 'stone block drop | concrete block'},
                  'towers': {'grow': 'rocks rumble | stones rumble'},
                  'cannonblast': {'start': 'cannon fuse | fuse burning', 'hit': 'cannon shot | cannon'},
                  'quakering': {'start': 'rumble | low rumble', 'hit': 'stone impact | rock hit'},
                  'collapse': {'start': 'stone crumble | crumbling', 'hit': 'rubble | debris crash'}},
    'sandchronarch': {'sandblade': {'start': 'sand whoosh | swish', 'hit': 'sand throw | sand impact | gravel hit | sand spray'},
                      'sandring': {'start': 'hourglass | sand trickle', 'lock': 'clock tick | ticking'},
                      'sandpillar': {'grow': 'sand pour | pouring sand | sand falling | sand'},
                      'reverse': {'grow': 'sand pour | pouring sand'},
                      'clockripple': {'start': 'clock ticking | clockwork', 'hit': 'clock chime | clock bell'},
                      'sandbeam': {'start': 'wind gust | gust | strong wind | desert wind', 'hit': 'sand blast | sandblast | sand impact | sand hit'}},
    'coraltide': {'inkclaws': {'start': 'water swipe | water movement | water whoosh | water swish', 'hit': 'water splash | splash water | splash'},
                  'pearlwall': {'start': 'bubbles | bubbling water', 'lock': 'marble drop | marbles'},
                  'coralgrow': {'grow': 'underwater bubbles | under water bubbles | bubbling'},
                  'inkwhirl': {'start': 'water gurgle | drain gurgle | gurgling water', 'hit': 'water slosh | sloshing'},
                  'pearlspring': {'grow': 'spring water | stream water'},
                  'inkwave': {'start': 'big wave | ocean wave', 'hit': 'wave crash | waves | wave hits | crashing wave'}},
    'moonfang': {'tricut': {'start': 'sword swing | sword whoosh | blade swing', 'hit': 'sword clash | swords'},
                 'steelward': {'start': 'armor clank | chainmail', 'lock': 'metal shield | shield hit'},
                 'twinflames': {'grow': 'fire ignite | ignition'},
                 'shadowx': {'start': 'dash whoosh | quick whoosh | whoosh fast | swoosh fast', 'hit': 'sword slash metal | blade metal'},
                 'fangs': {'start': 'teeth snap | jaw snap', 'hit': 'meat rip | flesh'},
                 'moonblade': {'start': 'sword ring | metal ring', 'hit': 'heavy impact | big impact'}},
}


# Third pass (docs/BOSS_SKILLS.md): body attacks and each caster's channel.
NEW = {
    'fire': {'tail': {'start': 'heavy whoosh | big swoosh | swoosh heavy', 'hit': 'whip crack | whip | bullwhip'},
             'jaws': {'start': 'dog bite | animal bite | jaws snap | teeth clack', 'hit': 'bone crunch | crunch | crunching'},
             'flight': {'start': 'wings flapping | wing flap | large wings', 'hit': 'blowtorch | flamethrower | torch burner'}},
    'ice': {'moonchannel': {'channel': 'crystal bowl | singing glass | glass rub'},
            'bigmoon': {'channel': 'gong rub | deep resonance | bowl rub'}},
    'lightning': {'thunderclaw': {'start': 'static electricity | static', 'hit': 'claw scratch | scratching | scratch'}},
    'mire': {'gillspores': {'channel': 'seed pods | dry seeds | seeds rattle'}},
    'scarab': {'hornstrike': {'start': 'insect legs | crab walking | skitter', 'hit': 'wood smash | crate smash | heavy impact'},
               'mandible': {'start': 'beetle | insect clicking | crab claws', 'hit': 'crunch | crunching | bite crunch'},
               'suncrest': {'channel': 'sand trickle | stone rub | sand shifting'}},
    'leviathan': {'coralglow': {'channel': 'underwater bubbles | bubbling | bubbles'}},
    'colossus': {'coreheat': {'channel': 'steam hiss | pressure release | boiler'}},
    'prism': {'scythecut': {'start': 'blade swish | sword swish | swish', 'hit': 'sword slash flesh | sword hit | slash'},
              'scythetrail': {'start': 'sword whoosh | fast whoosh | whoosh', 'hit': 'sword stab | knife stab | blade stab'},
              'crossglint': {'channel': 'blade scrape | sword scrape | knife sharpen'}},
    'reaper': {'hookcut': {'start': 'blade whoosh | sword whoosh | swish', 'hit': 'cloth tear | fabric rip | tearing'},
               'moonblade': {'channel': 'sword ring | blade ring | sword hum'}},
    'briar': {'vinewhip': {'start': 'stick swing | whip swing | swish stick | whip whoosh', 'hit': 'thorn scratch | bush scratch | branch hit'},
              'rosebloom': {'channel': 'leaves rustle | plant rustle | foliage'},
              'thorncrown': {'channel': 'branches creak | twigs breaking | branch creak'}},
    'seraph': {'swordlight': {'channel': 'sword ring | sword resonance | metal shimmer'}},
    'eclipse': {'voidseam': {'start': 'deep whoosh | low whoosh | whoosh deep', 'hit': 'bone crunch | crunch | bite crunch'},
                'voidorb': {'channel': 'low rumble | deep rumble | rumbling'}},
    'elderbloom': {'sapglow': {'channel': 'wood creak | tree creak | creaking'}},
    'cinderheart': {'corefire': {'channel': 'lava bubbling | magma | bubbling mud'}},
    'frostregent': {'sceptrefrost': {'channel': 'ice crackle | freezing | ice forming'}},
    'souljailer': {'lanternglow': {'channel': 'chain swinging | chain clink | chains'}},
    'sporefather': {'gillglow': {'channel': 'spore puff | puff air | wet squelch'}},
    'prismback': {'crystalglow': {'channel': 'stone grind | stone scrape | rock grinding'}},
    'sandchronarch': {'sandglass': {'channel': 'sand trickle | sand pour | sand falling'}},
    'coraltide': {'pearlglow': {'channel': 'water drops cave | drip cave | water droplet'}},
    'moonfang': {'bloodmoon': {'channel': 'blade sharpen | sharpening | sword sharpen'}},
}
# Hải Long San Hô became the rain-and-thunder dragon king: its own storm recordings.
NEW['leviathan'] = {'jet': {'start': 'water jet | water spray | pressure washer', 'hit': 'water splash | splash big | water impact'},
                    'rainstorm': {'grow': 'heavy rain | rainstorm | rain downpour'},
                    'frostbreath': {'start': 'cold wind | icy wind | winter wind gust', 'hit': 'ice crackle | ice forming | freezing crack'},
                    'thunderstorm': {'start': 'thunder rumble storm | storm approaching | thunderstorm rain', 'hit': 'lightning strike close | thunder crack close | thunderclap'}}
# Each ultimate that ends on its boss's climax sheet (foeUltFinale, cataclysm: a thunderbolt, a tidal wave...) is heard too.
for boss, query in {
        'fire': 'fire explosion large | big fire burst | fireball explosion | gas explosion fire',
        'ice': 'ice break | ice smash | ice shatter | glass break | ice crack',
        'lightning': 'lightning strike close | thunder crack close | thunderclap loud | thunder strike',
        'eclipse': 'explosion close | bomb explosion | blast close | firework explosion | explosion',
        'mire': 'big splash | heavy splash | mud splash | bog splash | rock into water',
        'elderbloom': 'tree falling | tree crack | large branch break | wood crack loud',
        'cinderheart': 'volcano eruption | lava explosion | volcano | volcanic',
        'souljailer': 'iron gate slam | metal gate slam | prison door | metal door slam',
        'tempestwing': 'thunder close strike | lightning bolt crack | thunder clap close | storm thunder crack',
        'sporefather': 'slime burst | gooey splat large | wet explosion | squelch big',
        'prismback': 'glass collapse | glass shatter big | window smash | glass crash | glass break big',
        'coraltide': 'big wave crash | ocean wave crash rocks | wave impact | surf crash',
        'moonfang': 'sword strike | sword slash | sword cut | sword hit | katana'}.items():
    NEW.setdefault(boss, {})['finale'] = {'climax': query}
# Cues a sound review found wrong (Codex reviews 2026-10-31 and 2026-11-01): their own search phrases, each skill with a
# channel of its own (assets/audio/boss-skills/review-queries.json).
for boss, keys in json.loads((AUDIO / 'boss-skills/review-queries.json').read_text(encoding='utf-8')).items():
    for key, cues in keys.items():
        NEW.setdefault(boss, {}).setdefault(key, {}).update(cues)
for boss, cues in NEW.items():
    for key, roles in cues.items():
        QUERIES[boss].setdefault(key, {}).update(roles)


def used_elsewhere():
    """Freesound ids used by any sound of the game other than the boss skills."""
    found = set()
    for path in [*AUDIO.rglob('*.json'), AUDIO / 'CREDITS.txt', *(REPO / 'scripts').glob('*.py')]:
        if 'boss-skills' in path.parts or path.name in ('source.json', Path(__file__).name):
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        text = re.sub(r'Boss skill sounds \(.*?(?:\n\n|\Z)', '', text, flags=re.S)
        found |= set(re.findall(r'sounds/(\d+)', text))
    return found


def get(url):
    for attempt in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
        except Exception:
            time.sleep(3 + attempt * 5)
    return b''


def search(query):
    url = 'https://freesound.org/search/?' + urllib.parse.urlencode({'q': query, 'f': 'license:"Creative Commons 0"'})
    html = get(url).decode('utf-8', 'ignore')
    time.sleep(1)
    for block in html.split('bw-search__result')[1:]:
        m = re.search(r'href="/people/([^/]+)/sounds/(\d+)/" title="([^"]*)"', block)
        mp3 = re.search(r'data-mp3="https://cdn\.freesound\.org/previews/\d+/(\d+)_(\d+)-lq\.mp3"', block)
        dur = re.search(r'data-duration="([\d.]+)"', block)
        if m and mp3:
            title = m.group(3).replace('&#x27;', "'").replace('&amp;', '&').replace('&quot;', '"')
            text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', block)).replace('&#x27;', "'").replace('&amp;', '&').replace('&quot;', '"')
            about = text[text.find(title) + len(title):][:240].strip() if title in text else ''
            yield {'id': m.group(2), 'author': m.group(1), 'title': title, 'about': about,
                   'preview': mp3.group(2), 'duration': float(dur.group(1)) if dur else 0}


# Titles that point to music, loops, voices or long beds rather than one clean event.
SKIP = re.compile(r'\b(loop|music|drum|track|song|beat|synth|voice|vocal|speech|ambien|atmos|soundscape|bgm|melody|guitar|piano|game|8.?bit|retro|ui|notification|cartoon|funny|magic|spell|sci.?fi|scifi|buzzer|laser|lightsaber|cyber|cinematic|analog|monster|growl|cymbal|human|mouth|cat|bicycle|percussion|stinger|power.?up|fashion|robot|kitchen|dishes|domino|pencil|bottle|plastic|flashlight|shovel|fish|spray can|lofi|instrument|choir|pizz|violin|cello|string|pig|garage|sewer|lotion|shower|hose|toilet|door handle|electric scythe|energy wave|train|shaker|hemp|grunt|telephone|phone|fence|bell|bells|chime|chimes|gong|bowl|singing|cymbal|zildjian|whisper|cuckoo|eating|flute|wine glass|solfeggio|shimmer|sparkle|mystery|drum|tone|note)', re.I)


# Recordings heard as wrong for their cue on review (synthetic, or not what the title promised).
BLOCK = {'653650', '642011', '234551', '767546', '661854', '533052', '365137', '462233', '785760', '825806', '273915', '104019', '724716', '712105', '204416', '629977', '492476', '661242', '189219'}


def fits(c, query, cue):
    title = c['title'].lower()
    if c['id'] in BLOCK or SKIP.search(title):
        return False
    words = [w for w in re.findall(r'[a-z]+', query.lower()) if len(w) > 3]
    if words and not any(w[:5] in title for w in words):
        return False
    return .3 <= c['duration'] <= (40 if cue in ('land', 'grow') else 20)


def audio(c):
    path = CACHE / f"{c['id']}.mp3"
    if not path.exists():
        data = get(f"https://cdn.freesound.org/previews/{c['id'][:3]}/{c['id']}_{c['preview']}-hq.mp3")
        if not data:
            return None
        path.write_bytes(data)
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-ar', str(RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(pcm, '<f4')


def excerpt(x, kind):
    """(start, end) around the loudest moment, or None when the recording has no clear event."""
    if len(x) < RATE * .25 or np.mean(np.abs(x) > .985) > .00005:
        return None
    hop = RATE // 50
    frames = x[:len(x) // hop * hop].reshape(-1, hop)
    level = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-7)
    peak = int(level.argmax())
    if level[peak] < -38 or level[peak] - np.percentile(level, 10) < (12 if kind in ('start', 'grow', 'channel') else 18):
        return None
    begin = peak
    while begin > 0 and level[begin - 1] > level[peak] - 24 and peak - begin < (40 if kind in ('start', 'grow', 'channel') else 8):
        begin -= 1
    longest = int(LONGEST[kind] * 50)
    end, quiet = peak, 0
    while end < len(level) - 1 and end - begin < longest:
        end += 1
        quiet = quiet + 1 if level[end] < level[peak] - 36 else 0
        if quiet >= 5:
            break
    if (end - begin) / 50 < (.5 if kind in ('grow', 'land', 'channel') else .35 if kind == 'start' else .25):   # a weapon swing is short
        return None
    return round(max(0, begin / 50 - .02), 2), round(end / 50, 2)


def main(bosses):
    CACHE.mkdir(parents=True, exist_ok=True)
    picks = json.loads(PICKS.read_text(encoding='utf-8')) if PICKS.exists() else {}
    taken = used_elsewhere() | {p['id'] for p in picks.values()}
    for manifest in (AUDIO / 'boss-skills').glob('*-manifest.json'):   # the pilot's hand-picked recordings
        taken |= set(re.findall(r'sounds/(\d+)', manifest.read_text(encoding='utf-8')))
    for boss in bosses:
        for fx, cues in QUERIES[boss].items():
            for cue, queries in cues.items():
                key = f'{boss}/{fx}/{cue}'
                if key in picks:
                    continue
                found = None
                for query in [q.strip() for q in queries.split('|')]:
                    for c in search(query):
                        if c['id'] in taken or not fits(c, query, cue):
                            continue
                        x = audio(c)
                        span = excerpt(x, cue) if x is not None else None
                        if span:
                            found = {**c, 'query': query, 'start': span[0], 'end': span[1]}
                            break
                    if found:
                        break
                if not found:
                    print('[none]', key)
                    continue
                picks[key] = found
                taken.add(found['id'])
                print('[ok]', key, found['id'], found['title'][:50], found['start'], found['end'], flush=True)
                PICKS.write_text(json.dumps(picks, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')


def candidates(keys, out, per=10):
    """Up to `per` usable recordings for each cue (boss/fx/cue), with their titles and descriptions, so a
    reviewer picks the one that fits (choose())."""
    CACHE.mkdir(parents=True, exist_ok=True)
    picks = json.loads(PICKS.read_text(encoding='utf-8')) if PICKS.exists() else {}
    taken = used_elsewhere() | {p['id'] for k, p in picks.items() if k not in keys}
    for manifest in (AUDIO / 'boss-skills').glob('*-manifest.json'):
        taken |= set(re.findall(r'sounds/(\d+)', manifest.read_text(encoding='utf-8')))
    result = {}
    for key in keys:
        boss, fx, cue = key.split('/')
        found, seen = [], set()
        for query in [q.strip() for q in QUERIES[boss][fx][cue].split('|')]:
            for c in search(query):
                if len(found) >= per:
                    break
                if c['id'] in taken or c['id'] in seen or c['id'] in BLOCK or SKIP.search(c['title']) or not (.3 <= c['duration'] <= 60):
                    continue
                seen.add(c['id'])
                x = audio(c)
                span = excerpt(x, cue) if x is not None else None
                if span:
                    found.append({**c, 'query': query, 'start': span[0], 'end': span[1]})
            if len(found) >= per:
                break
        result[key] = found
        print(key, len(found), flush=True)
    Path(out).write_text(json.dumps(result, indent=1, ensure_ascii=False), encoding='utf-8')


def choose(candidates_file, choices_file):
    """Apply a reviewer's choices ({cue: recording id or null}) from candidates()."""
    cands = json.loads(Path(candidates_file).read_text(encoding='utf-8'))
    picks = json.loads(PICKS.read_text(encoding='utf-8')) if PICKS.exists() else {}
    used = set()
    for key, sid in json.loads(Path(choices_file).read_text(encoding='utf-8')).items():
        pick = next((c for c in cands.get(key, []) if c['id'] == str(sid)), None)
        if pick and pick['id'] not in used:
            picks[key] = {k: v for k, v in pick.items() if k != 'about'}
            used.add(pick['id'])
        else:
            print('[no choice]', key)
    PICKS.write_text(json.dumps(picks, indent=1, ensure_ascii=False) + chr(10), encoding='utf-8')


if __name__ == '__main__':
    if sys.argv[1:2] == ['--candidates']:
        candidates(sys.argv[3:], sys.argv[2])
    elif sys.argv[1:2] == ['--choose']:
        choose(sys.argv[2], sys.argv[3])
    else:
        main(sys.argv[1:] or list(QUERIES))
