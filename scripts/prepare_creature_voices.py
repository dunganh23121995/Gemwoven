"""Build four creature sound banks from CC0 monster SFX, never hero voice recordings."""
from pathlib import Path
import subprocess, json, hashlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample
import imageio_ffmpeg

BASE=Path(__file__).resolve().parents[1]/'assets/audio'
SOURCE=BASE/'sources/creatures';OUT=BASE/'creatures';OUT.mkdir(exist_ok=True)
RATE=32000
def read(name):
    args=[imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(SOURCE/name),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']
    return np.frombuffer(subprocess.check_output(args),dtype='<f4').copy()
def band(x,lo,hi):return sosfilt(butter(3,[lo,hi],btype='bandpass',fs=RATE,output='sos'),x)
def excerpt(x,duration,fraction,pitch):
    # Select an energetic growl region; preserve the entire designed envelope.
    need=min(len(x),int(duration*RATE*pitch));start=int((len(x)-need)*fraction)
    segment=x[start:start+need]
    if np.sqrt(np.mean(segment**2))<.035:
        candidates=range(0,max(1,len(x)-need),max(1,need//4))
        start=max(candidates,key=lambda i:np.mean(x[i:i+need]**2));segment=x[start:start+need]
    return resample(segment,int(duration*RATE))

banks={'fire':([6,7,4],.9),'earth':([1,5,2],.68),
       'ice':([8,9,3],1.12),'lightning':([10,4,7],1.03)}
pack='pack/monster_sfx_pack/'
recordings={i:read(pack+f'monster-{i}.wav') for i in range(1,11)}
manifest={}
for element,(choices,pitch) in banks.items():
    for kind,count in [('attack',3),('hurt',3),('cast',1),('release',1),('death',1)]:
        for variant in range(count):
            seed=1000+list(banks).index(element)*100+['attack','hurt','cast','release','death'].index(kind)*10+variant
            rng=np.random.default_rng(seed)
            duration={'attack':.32,'hurt':.22,'cast':.40,'release':.55,'death':.95}[kind]+variant*.03
            fraction={'attack':.12,'hurt':.45,'cast':.25,'release':.1,'death':.08}[kind]+variant*.07
            source_index=choices[(variant+(kind=='hurt'))%len(choices)]
            filename=pack+f'monster-{source_index}.wav';main=recordings[source_index]
            x=excerpt(main,duration,fraction,pitch);n=len(x);t=np.arange(n)/RATE
            noise=rng.normal(0,1,n)
            if element=='fire':
                breath=band(noise,800,3400)*.012
                x=band(x,65,4500)+breath
                x=np.tanh(x*1.65)*.7
            elif element=='earth':
                rubble=band(noise,140,1100)*.035*np.sin(2*np.pi*29*t)**10
                sub=np.sin(2*np.pi*58*t)*.02
                x=band(x,35,1600)+rubble+sub
            elif element=='ice':
                x=band(x,450,5000)*(.9+.1*np.sin(2*np.pi*17*t))
            else:
                crackle=band(noise,2300,6200)*.025*np.sin(2*np.pi*31*t)**16
                x=band(x,180,4700)*(.9+.1*np.sin(2*np.pi*43*t))+crackle
            # Smooth attacks and decaying tails; charge swells rather than barking.
            attack_time=.07 if kind=='cast' else .035 if kind=='death' else .012
            envelope=np.minimum(1,t/attack_time)*np.minimum(1,(duration-t)/(.24 if kind=='death' else .10 if kind=='release' else .065))
            if kind=='cast':envelope*=.35+.65*t/duration
            x*=envelope
            rms=np.sqrt(np.mean(x*x));x*=min(.15/max(rms,.001),.84/max(np.max(np.abs(x)),.001))
            name=f'creature-{element}-{kind}'+(str(variant+1) if count>1 else '')
            file=OUT/(name+'.wav');wavfile.write(file,RATE,(x*32767).astype(np.int16))
            manifest[name]={'file':'creatures/'+file.name,'duration':round(duration,3),'sources':['sources/creatures/'+filename],'category':'creature-sfx','sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
(BASE/'creature-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print(f'Built {len(manifest)} distinct creature sounds from monster roar/snarl sources.')
