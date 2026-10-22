"""Layer licensed katana recordings with original wind textures for Noct."""
from pathlib import Path
import hashlib, json, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
import imageio_ffmpeg

BASE=Path(__file__).resolve().parents[1]/'assets/audio'
OUT=BASE/'noct-sfx';OUT.mkdir(exist_ok=True)
RATE=32000
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
rng=np.random.default_rng(101519)
def band(x,lo,hi):return sosfilt(butter(2,[lo,hi],btype='bandpass',fs=RATE,output='sos'),x)
def take(name,duration):
    source=BASE/'sources/katana'/(name+'.mp3')
    x=np.frombuffer(subprocess.check_output([FFMPEG,'-v','error','-i',str(source),'-f','f32le','-ac','1','-ar',str(RATE),'pipe:1']),dtype='<f4').copy()
    active=np.flatnonzero(abs(x)>max(.001,abs(x).max()*.01))
    if len(active):x=x[max(0,active[0]-160):min(len(x),active[-1]+960)]
    speed=len(x)/RATE/duration;filters=[]
    while speed>2:filters.append('atempo=2');speed/=2
    while speed<.5:filters.append('atempo=0.5');speed/=.5
    filters.append(f'atempo={speed}')
    x=np.frombuffer(subprocess.check_output([FFMPEG,'-v','error','-f','f32le','-ac','1','-ar',str(RATE),'-i','pipe:0','-af',','.join(filters),'-f','f32le','pipe:1'],input=x.astype('<f4').tobytes()),dtype='<f4').copy()
    x=np.pad(x,(0,max(0,round(duration*RATE)-len(x))))[:round(duration*RATE)]
    return x/max(.001,np.sqrt(np.mean(x*x)))
def wind(duration,low=220,high=2300):
    n=round(duration*RATE);t=np.linspace(0,1,n)
    x=band(rng.normal(size=n),low,high)
    x*=np.sin(np.pi*t)**1.5
    return x/max(.001,np.sqrt(np.mean(x*x)))
def save(name,x,sources,rms=.12):
    fade=min(len(x)//4,round(.018*RATE));x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
    x=np.tanh(x*.3)
    x*=min(rms/max(.001,np.sqrt(np.mean(x*x))),.78/max(.001,abs(x).max()))
    output=OUT/(name+'.wav');wavfile.write(output,RATE,(x*32767).astype(np.int16))
    manifest[name]={'file':'noct-sfx/'+output.name,'duration':round(len(x)/RATE,3),'sources':sources,
                    'rms':round(float(np.sqrt(np.mean(x*x))),4),'peak':round(float(abs(x).max()),4),
                    'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
manifest={}
for i,duration in enumerate([.23,.26,.29],1):
    source=f'cutting_with_a_katana{i}'
    save('slash'+str(i),take(source,duration)*.85+wind(duration)*.22,[source+'.mp3','original filtered wind'])
save('hit',take('sword_attack1',.17),['sword_attack1.mp3'],.105)
save('finish',take('cutting_with_a_katana3',.46)*.85+wind(.46,90,1300)*.3,['cutting_with_a_katana3.mp3','original low wind'],.14)
save('draw',take('extracting_a_sword1',.36),['extracting_a_sword1.mp3'],.10)
save('sheath',take('extracting_a_sword1',.24)[::-1].copy(),['extracting_a_sword1.mp3 (reversed)'],.08)
save('dash',wind(.18,180,2100),['original filtered wind'],.09)
charge=wind(1.1,120,1800)*.55
draw=take('extracting_a_sword1',.36)*.35
charge[-len(draw):]+=draw
save('charge',charge,['original filtered wind','extracting_a_sword1.mp3'],.09)
# Six-star Grim Reaper ultimate: cursed fog, hook rip and the ethereal veil.
def swell(n,power=1.6):t=np.linspace(0,1,n);return t**power*np.sin(np.pi*np.clip(t*1.15,0,1))**.5
n=round(1.05*RATE);t=np.arange(n)/RATE
mist=wind(1.05,55,650)*swell(n)+np.sin(2*np.pi*(42+9*t)*t)*swell(n,1.2)*.9
tail=take('cutting_with_a_katana3',.5)[::-1].copy()*.35;mist[-len(tail):]+=tail
save('mist',mist,['original low wind and rumble','cutting_with_a_katana3.mp3 (reversed)'],.12)
n=round(.42*RATE);t=np.linspace(0,1,n)
rise=band(rng.normal(size=n),300,2600)*np.sin(np.pi*t)**1.2*(.4+t)
rip=take('extracting_a_sword1',.42)*.6+take('sword_attack1',.42)*.45
save('hook',rise*.5+rip,['original rising wind','extracting_a_sword1.mp3','sword_attack1.mp3'],.13)
n=round(.75*RATE);t=np.linspace(0,1,n)
veil=band(rng.normal(size=n),1800,7000)*np.sin(np.pi*t)**2*(1+.6*np.sin(2*np.pi*11*t))
veil+=take('cutting_with_a_katana1',.75)[::-1].copy()*.18
save('veil',veil,['original airy shimmer','cutting_with_a_katana1.mp3 (reversed)'],.07)
(BASE/'noct-sfx-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared',len(manifest),'Noct katana/wind effects.')
