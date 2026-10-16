"""Author the four elemental sound palettes and refresh licensed performances.

Noct's approved recordings are deliberately independent of this manifest.
All new SFX below are original deterministic synthesis, not downloaded samples.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
import imageio_ffmpeg

BASE = Path(__file__).resolve().parents[1] / 'assets/audio'
OUT = BASE / 'reimagined'
OUT.mkdir(exist_ok=True)
RATE = 32000
manifest = {}

def band(x, lo, hi):
    return sosfilt(butter(3, [lo, hi], btype='bandpass', fs=RATE, output='sos'), x)

def save(name, samples, metadata, target=.14):
    x = np.asarray(samples, dtype=np.float64)
    x -= x.mean()
    x = np.tanh(x / max(.01, np.sqrt(np.mean(x*x))) * .28)
    n = min(320, len(x)//4)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    x *= min(target/max(.001, np.sqrt(np.mean(x*x))), .8/max(.001, np.abs(x).max()))
    output = OUT / (name+'.wav')
    wavfile.write(output, RATE, (x*32767).astype(np.int16))
    return {**metadata, 'file': 'reimagined/'+output.name, 'duration': round(len(x)/RATE, 3),
            'rms': round(float(np.sqrt(np.mean(x*x))), 4), 'peak': round(float(np.abs(x).max()), 4),
            'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}

def read(source, tempo=1, pitch=1):
    # Formant character is retained; only gentle pitch changes, with tempo restored.
    filters=f'aresample=44100,asetrate=44100*{pitch},aresample={RATE},atempo={tempo/pitch}'
    raw=subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v','error','-i',str(source),
        '-ar',str(RATE),'-ac','1','-af',filters,'-f','f32le','pipe:1'])
    x=np.frombuffer(raw,dtype='<f4').copy()
    active=np.flatnonzero(np.abs(x)>.0015)
    if len(active): x=x[max(0,active[0]-int(RATE*.025)):min(len(x),active[-1]+int(RATE*.09))]
    return band(x,90,7400)

voices={}
for family,number,pitch,tempo in [('mika',3,.98,1.02),('yuki',2,.97,.93),('lumi',1,1.00,1.06)]:
    folder=BASE/f'sources/female/RPG Voice Starter Pack/Type {number}'
    clips={**{f'attack{i}':f'attack{i}.wav' for i in range(1,4)},
           **{f'hurt{i}':f'damaged{i}.wav' for i in range(1,4)},
           'cast':{'mika':'fire.wav','yuki':'ice.wav','lumi':'jump2.wav'}[family],
           'release':{'mika':'burn.wav','yuki':'freeze.wav','lumi':'attack3.wav'}[family]}
    for kind,file in clips.items():
        source=folder/file
        x=read(source,tempo,pitch)
        # Clear presence and natural vowel length instead of the old 0.75-speed cries.
        x += band(x,1300,3600)*.12
        voices[f'{family}-{kind}']=save(f'{family}-{kind}',x,{'sources':[str(source.relative_to(BASE))],
            'license':'CC0 / Cici Fyre', 'tempo':tempo,'pitch':pitch})
folder=BASE/'sources/fighter/BattleVoice_budouka/wav'
clips={**{f'attack{i}':f'{n:02}_budouka_attack.wav' for i,n in enumerate([7,9,10],1)},
       **{f'hurt{i}':f'{n:02}_budouka_damage.wav' for i,n in enumerate([14,15,16],1)},
       'cast':'12_budouka_attack.wav','release':'11_budouka_attack.wav'}
for kind,file in clips.items():
    source=folder/file
    x=read(source,.97,.95)
    x += band(x,140,450)*.10 + band(x,1400,3200)*.10
    voices[f'nori-{kind}']=save(f'nori-{kind}',x,{'sources':[str(source.relative_to(BASE))],
        'license':'YouFulca, credited in game', 'tempo':.97,'pitch':.95})
(BASE/'cast-voice-manifest.json').write_text(json.dumps(voices,indent=2),encoding='utf-8')

for element in ['fire','earth','ice','lightning']:
    for kind,duration in [('charge',1.1),('launch',.36),('impact',.44),('finish',.68),('receive',.55)]:
        rng=np.random.default_rng(831+len(manifest)*137)
        t=np.arange(round(duration*RATE))/RATE
        noise=rng.normal(0,1,len(t))
        env=np.minimum(1,t/.018)*np.exp(-t/(duration*.32))
        if kind=='charge':env=np.minimum(1,t/.15)*(0.15+.85*t/duration)*np.minimum(1,(duration-t)/.12)
        elif kind=='receive':env=np.minimum(1,t/.06)*np.exp(-t/(duration*.4))
        if element=='fire':
            # A warm rushing blade, glowing ember crackle, and a rounded flame impact.
            sweep=np.sin(2*np.pi*(650*t-330*t*t/duration))*.14
            crackle=band(noise,2200,6500)*np.maximum(0,np.sin(2*np.pi*37*t))**14
            x=(band(noise,350,3300)*.65+crackle*.14+sweep)*env
            if kind in ('impact','finish'):x+=np.sin(2*np.pi*(95*t-32*t*t/duration))*.22*env
        elif element=='earth':
            # Wooden hammer tension, resonant stone strike, and granular debris.
            x=(band(noise,100,1400)*.5+np.sin(2*np.pi*78*t)*.30+np.sin(2*np.pi*137*t)*.14)*env
            for offset in [.05,.11,.19,.28]:
                u=np.maximum(0,t-offset);x+=band(noise,500,2500)*.12*np.exp(-u/.025)*(t>=offset)
        elif element=='ice':
            # Inharmonic crystal bells and a fine frosty breath; no blunt explosion.
            x=band(noise,2600,7500)*.09*env
            for i,f in enumerate([784,1174.66,1568,2217.46]):
                offset=i*(.085 if kind in ('charge','receive') else .018)
                u=np.maximum(0,t-offset)
                x+=np.sin(2*np.pi*f*u+np.sin(2*np.pi*4*u)*.05)*np.exp(-u/(duration*.3))*(t>=offset)*(.20/(i+1))
        else:
            # A sparkling electrical trill with short crackles, never a harsh drone.
            x=band(noise,1500,6500)*.25*np.maximum(0,np.sin(2*np.pi*47*t))**8*env
            for i,f in enumerate([659.25,987.77,1318.51,1975.53]):
                offset=i*(.07 if kind in ('charge','receive') else .024);u=np.maximum(0,t-offset)
                x+=np.sin(2*np.pi*f*u+1.2*np.sin(2*np.pi*f*2*u))*np.exp(-u/(duration*.22))*(t>=offset)*(.13/(i+1))
            if kind=='finish':x+=band(noise,80,950)*.28*env
        manifest[f'{element}-{kind}']=save(f'{element}-{kind}',x,{'category':'original-elemental-sfx','license':'Project original'},.12)
(BASE/'cast-sfx-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
boss_voices={}
for element,indices,pitch in [('fire',[6,7,4],.84),('earth',[1,5,2],.67),('ice',[8,9,3],1.08),('lightning',[10,4,7],.92)]:
    for kind,duration in [('attack',.38),('hurt',.25),('cast',.6),('release',.65),('death',.95)]:
        for variant in range(3 if kind in ('attack','hurt') else 1):
            index=indices[(variant+(kind=='hurt'))%3]
            source=BASE/f'sources/creatures/pack/monster_sfx_pack/monster-{index}.wav'
            raw=read(source,1,pitch)
            count=round(RATE*(duration+variant*.025))
            candidates=range(0,max(1,len(raw)-count),max(1,count//3))
            start=max(candidates,key=lambda i:np.mean(raw[i:i+count]**2))
            x=raw[start:start+count].copy()
            x=np.pad(x,(0,max(0,count-len(x))))
            t=np.arange(count)/RATE
            if element=='fire':x=band(x,75,4500)+band(x,180,750)*.3
            elif element=='earth':x=band(x,50,2200)*(1+.16*np.sin(2*np.pi*24*t))
            elif element=='ice':x=band(x,350,6300)*(1+.10*np.sin(2*np.pi*13*t))
            else:x=band(x,120,5000)*(1+.12*np.sin(2*np.pi*39*t))
            x*=np.minimum(1,t/(.09 if kind=='cast' else .018))*np.minimum(1,(len(x)/RATE-t)/.09)
            name=f'boss-{element}-{kind}'+(str(variant+1) if kind in ('attack','hurt') else '')
            boss_voices[name]=save(name,x,{'category':'creature-performance','sources':[str(source.relative_to(BASE))],
                'license':'CC0 / Ogrebane','pitch':pitch},.15)
(BASE/'boss-voice-manifest.json').write_text(json.dumps(boss_voices,indent=2),encoding='utf-8')
print(f'Prepared {len(voices)} hero and {len(boss_voices)} boss performances; {len(manifest)} original elemental sounds.')
