"""Normalize licensed recordings; retain syllable tails and pitch when slowing cries."""
from pathlib import Path
import json, subprocess, hashlib
import numpy as np
from scipy.io import wavfile
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/audio'
OUT=BASE/'voices';OUT.mkdir(exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
manifest={}

def clip(name, files, tempo=1):
    parts=[]
    for file in files:
        command=[FFMPEG,'-v','error','-i',str(BASE/'sources'/file),'-f','f32le','-ac','1','-ar','32000','-af',f'atempo={tempo}','pipe:1']
        samples=np.frombuffer(subprocess.check_output(command),dtype='<f4').copy()
        # Only trim leading/trailing digital silence, preserve breath and consonants.
        active=np.flatnonzero(np.abs(samples)>.0015)
        if len(active):samples=samples[max(0,active[0]-640):min(len(samples),active[-1]+3200)]
        parts.extend([samples,np.zeros(1600,dtype=np.float32)])
    samples=np.concatenate(parts);rms=np.sqrt(np.mean(samples*samples))
    samples*=min(.16/max(.001,rms),.88/max(.001,np.abs(samples).max()))
    fade=min(320,len(samples)//4);samples[:fade]*=np.linspace(0,1,fade);samples[-fade:]*=np.linspace(1,0,fade)
    output=OUT/(name+'.wav');wavfile.write(output,32000,(samples*32767).astype(np.int16))
    manifest[name]={'file':'voices/'+output.name,'duration':round(len(samples)/32000,3),'sources':files,'tempo':tempo,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}

for family,number in [('mika',3),('yuki',2),('lumi',1)]:
    folder=f'female/RPG Voice Starter Pack/Type {number}/'
    for i in range(1,4):
        clip(f'{family}-attack{i}',[folder+f'attack{i}.wav'],.75)
        clip(f'{family}-hurt{i}',[folder+f'damaged{i}.wav'],.78)
    clip(f'{family}-cast',[folder+'healed1.wav',folder+'attack1.wav'],.8)
    clip(f'{family}-release',[folder+'attack2.wav',folder+'attack3.wav'],.75)

folder='fighter/BattleVoice_budouka/wav/'
for i,n in enumerate([7,8,9],1):clip(f'nori-attack{i}',[folder+f'{n:02}_budouka_attack.wav'])
for i,n in enumerate([14,15,16],1):clip(f'nori-hurt{i}',[folder+f'{n:02}_budouka_damage.wav'])
clip('nori-cast',[folder+'12_budouka_attack.wav'])
clip('nori-release',[folder+'11_budouka_attack.wav'])
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(f'{len(manifest)} recorded voice clips; {sum((BASE/v["file"]).stat().st_size for v in manifest.values()):,} bytes')
