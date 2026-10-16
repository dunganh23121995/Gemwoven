"""Edit credited shield-bash and fire-whoosh recordings into hero-only SFX."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import imageio_ffmpeg
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio'
SOURCES = ROOT / 'sources/mika-nori'
RATE = 32000


def read(name):
    pcm = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error',
        '-i',str(SOURCES/name),'-ar',str(RATE),'-ac','2','-f','f32le','pipe:1'])
    return np.frombuffer(pcm,dtype='<f4').reshape(-1,2).astype(float)


def filter_audio(x, frequency, kind):
    return sosfilt(butter(2,frequency,btype=kind,fs=RATE,output='sos'),x,axis=0)


def save(name,x,source_name,description,target_rms):
    x *= min(.82/max(.001,np.abs(x).max()),target_rms/max(.001,np.sqrt(np.mean(x*x))))
    source=next(s for s in json.loads((SOURCES/'sources.json').read_text()) if s['file']==source_name)
    file=ROOT/'reimagined'/f'{name}.wav';wavfile.write(file,RATE,np.round(x*32767).astype(np.int16))
    return {'file':file.relative_to(ROOT).as_posix(),'duration':len(x)/RATE,
        'license':source['license'],'sources':[source],'processing':description,
        'peak':round(float(np.abs(x).max()),4),'rms':round(float(np.sqrt(np.mean(x*x))),4),
        'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}


if __name__=='__main__':
    fire=filter_audio(read('fire-whoosh.mp3'),55,'highpass')
    charge=fire[:round(1.7*RATE)].copy();t=np.arange(len(charge))/RATE
    charge*=((.1+.9*(t/1.7)**1.6)*np.minimum(1,t/.12)*np.minimum(1,(1.7-t)/.10))[:,None]
    # Air presence without a pure pitched whistle; retain the actual flame texture.
    whoosh=fire+filter_audio(fire,[1100,4800],'bandpass')*.32
    t=np.arange(len(whoosh))/RATE
    whoosh*=(np.minimum(1,t/.008)*np.minimum(1,(len(whoosh)/RATE-t)/.3))[:,None]
    source=read('shield-bash.mp3')[round(.08*RATE):]
    source=filter_audio(source,45,'highpass')
    shield=np.zeros((round(1.5*RATE),2));shield[:len(source)]=source
    for at,gain in [(.07,.12),(.18,.07),(.32,.035)]:
        n=round(at*RATE);shield[n:n+len(source)]+=filter_audio(source,2400,'lowpass')*gain
    shield[:96]*=np.linspace(0,1,96)[:,None]
    manifest={
        'earth-shield-bash':save('nori-shield-bash',shield,'shield-bash.mp3','Trimmed lead-in, EQ, subtle reflections and gain; edited from Shield Bash Impact by Hybrid_V',.19),
        'fire-flame-charge':save('mika-flame-charge',charge,'fire-whoosh.mp3','Fire swell fitted to the sword charging phase',.10),
        'fire-flame-whoosh':save('mika-flame-whoosh',whoosh,'fire-whoosh.mp3','Air-presence EQ, original flame-whoosh decay, gain and edge fades',.16),
    }
    (ROOT/'mika-nori-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({k:{n:v[n] for n in ['duration','peak','rms']} for k,v in manifest.items()},indent=2))
