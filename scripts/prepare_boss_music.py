"""Compose original boss-theme loops; the existing Home track is untouched."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import sys
import numpy as np
from scipy.io import wavfile
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
RATE = 32000
THEMES = [
    ('forest', 104, 45, 'flute', 'Tiếng Gọi Cổ Thụ'),
    ('volcano', 124, 40, 'brass', 'Dung Nham Thức Tỉnh'),
    ('ice', 100, 50, 'bell', 'Nguyệt Băng Quyết Chiến'),
    ('thunder', 132, 43, 'brass', 'Ngũ Lôi Thiên Đỉnh'),
    ('marsh', 108, 46, 'pluck', 'Vũ Điệu Bào Tử'),
    ('desert', 116, 45, 'pluck', 'Hoàng Kim Sa Mạc'),
    ('abyss', 98, 42, 'flute', 'Long Triều Vực Thẳm'),
    ('foundry', 128, 41, 'bell', 'Nhịp Tim Bánh Răng'),
    ('crystal', 112, 51, 'bell', 'Lăng Kính Nổi Giận'),
    ('haunted', 102, 44, 'flute', 'Liềm Hồn Dưới Trăng'),
    ('sky', 126, 48, 'flute', 'Thiên Phong Tung Cánh'),
    ('thorns', 110, 47, 'pluck', 'Vương Miện Gai'),
    ('celestial', 120, 48, 'brass', 'Nhật Quang Phán Quyết'),
    ('void', 106, 39, 'brass', 'Long Đế Nhật Thực'),
    ('pine', 114, 52, 'flute', 'Cuồng Phong Tùng Tuyết'),
    ('obsidian', 134, 38, 'brass', 'Hắc Thạch Bạo Phát'),
    ('bamboo', 118, 50, 'pluck', 'Bích Ngọc Trúc Lâm'),
    ('coast', 130, 46, 'bell', 'Hải Phong Lôi Vũ'),
    ('dream', 108, 53, 'bell', 'Mộng Cảnh Rạn Vỡ'),
    ('astral', 122, 43, 'brass', 'Long Tinh Tận Thế'),
    ('eldergrove', 108, 47, 'flute', 'Bạch Hoa Thức Giấc'),
    ('caldera', 136, 39, 'brass', 'Tâm Nham Bạo Phát'),
    ('glacier', 102, 54, 'bell', 'Ngự Giá Băng Tinh'),
    ('stormspire', 140, 45, 'brass', 'Kim Dực Thiên Phạt'),
    ('soulcrypt', 96, 38, 'flute', 'Vong Đăng Thu Hồn'),
    ('mycelium', 112, 44, 'pluck', 'Ôn Bào Nở Rộ'),
    ('geode', 116, 49, 'bell', 'Tinh Thành Chấn Địa'),
    ('hourglass', 120, 43, 'pluck', 'Thời Luân Chung Mạt'),
    ('coralreef', 106, 50, 'flute', 'Châu Triều Nghịch Lưu'),
    ('moonkeep', 130, 40, 'brass', 'Tử Nguyệt Chung Kiếm'),
]


def compose(index, theme):
    key, bpm, tonic, instrument, _ = theme
    rng = np.random.default_rng(8173 + index * 101)
    beat = 60 / bpm
    length = round(64 * beat * RATE)
    mix = np.zeros((length, 2), dtype=np.float32)
    modes = [[0,2,3,5,7,8,10], [0,1,3,5,7,8,10], [0,2,4,6,7,9,11]]
    scale = modes[2 if key in ('sky','celestial','bamboo') else 1 if key in ('desert','void','haunted') else 0]
    roots = [0, -3, -5, -2] if index % 2 else [0, -5, -3, -7]
    phrase = [(index + n*n + 2*n) % 7 for n in range(8)]

    def add(at, midi, duration, volume, kind, pan=0):
        t = np.arange(round(duration*RATE), dtype=np.float32)/RATE
        hz = 440*2**((midi-69)/12)
        phase = 2*np.pi*hz*t
        if kind == 'pad':
            wave = np.sin(phase)+.18*np.sin(phase*2)+.07*np.sin(phase*3)
            env = np.sin(np.pi*t/duration)**2
        elif kind == 'bass':
            wave = np.sin(phase)+.13*np.sin(phase*2)
            env = (1-np.exp(-t/.013))*np.exp(-t/(duration*.42))
        elif kind == 'bell':
            wave = np.sin(phase+1.5*np.exp(-t*6)*np.sin(phase*2.01))+.13*np.sin(phase*3)
            env = (1-np.exp(-t/.005))*np.exp(-t/(duration*.28))
        elif kind == 'brass':
            wave = np.sin(phase)+.33*np.sin(phase*2)+.15*np.sin(phase*3)+.05*np.sin(phase*5)
            env = (1-np.exp(-t/.035))*np.minimum(1,(duration-t)/.05)*np.exp(-t/duration)
        elif kind == 'pluck':
            wave = np.sin(phase)+.35*np.sin(phase*2)*np.exp(-t*5)+.13*np.sin(phase*3)*np.exp(-t*8)
            env = (1-np.exp(-t/.004))*np.exp(-t/(duration*.22))
        else:
            wave = np.sin(phase+.014*np.sin(2*np.pi*5*t))+.08*np.sin(phase*2)
            env = (1-np.exp(-t/.045))*np.minimum(1,(duration-t)/.08)*np.exp(-t/(duration*.75))
        signal = volume*wave*env
        pos = (round(at*RATE)+np.arange(len(t))) % length
        mix[pos] += signal[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])

    def drum(at, kind, volume):
        duration = .27 if kind=='kick' else .16
        t = np.arange(round(duration*RATE),dtype=np.float32)/RATE
        noise = rng.normal(0,1,len(t)).astype(np.float32)
        if kind=='kick':
            signal = np.sin(2*np.pi*(44*t+4*(1-np.exp(-t*25))))*np.exp(-t*17)
        elif kind=='snare':
            signal = (.35*np.sin(2*np.pi*180*t)+.2*(noise-np.roll(noise,1)))*np.exp(-t*26)
        else:
            signal = (noise-np.roll(noise,1))*.2*np.exp(-t*65)
        pos=(round(at*RATE)+np.arange(len(t)))%length
        mix[pos] += signal[:,None]*volume

    for bar in range(16):
        root = tonic+roots[(bar//2)%4]
        at = bar*4*beat
        if bar%2==0:
            for j, interval in enumerate([0,3 if scale is not modes[2] else 4,7]):
                add(at,root+12+interval,8*beat,.045,'pad',(j-1)*.4)
        for pulse in range(8):
            add(at+pulse*.5*beat,root-12+(7 if pulse%4==3 else 0),.7*beat,.10 if pulse%2==0 else .06,'bass')
        for j in range(4):
            degree=phrase[(bar*3+j)%8]
            midi=root+24+scale[degree]+(12 if bar%8>=4 and j==3 else 0)
            add(at+(j+.25*(bar%2))*beat,midi,.8*beat,.075,instrument,(-.28 if j%2 else .28))
        for step in [0,2,3.5] if index%3==0 else [0,2]:drum(at+step*beat,'kick',.13)
        for step in [1,3]:drum(at+step*beat,'snare',.08)
        for step in np.arange(0,4,.5):drum(at+step*beat,'hat',.025)
    dry = mix.copy()
    for delay, level in [(beat*.5,.13),(beat*.75,.08),(beat*1.5,.045)]:mix += np.roll(dry[:,::-1],round(delay*RATE),axis=0)*level
    mix *= .13/np.sqrt(np.mean(mix**2))
    mix *= min(1,.83/np.max(np.abs(mix)))
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .9
    return mix


def main():
    out=ROOT/'assets/audio/music/bosses'
    out.mkdir(parents=True,exist_ok=True)
    manifest_path=ROOT/'assets/audio/boss-music-manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if '--missing' in sys.argv and manifest_path.exists() else {}
    for i,theme in enumerate(THEMES):
        key,bpm,_,_,title=theme
        if '--missing' in sys.argv and 'boss-'+key in manifest and (out/f'{key}.ogg').exists():continue
        audio=compose(i,theme)
        target=out/f'{key}.ogg'
        with tempfile.TemporaryDirectory(prefix='gemwoven-boss-music-') as temp:
            wav=Path(temp)/'loop.wav'
            wavfile.write(wav,RATE,audio)
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','3',str(target)],check=True)
        manifest['boss-'+key]={'file':f'music/bosses/{key}.ogg','title':title,'bpm':bpm,'duration':len(audio)/RATE,'original':True,'loop':True,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'rms':float(np.sqrt(np.mean(audio**2)))}
        print(key,round(len(audio)/RATE,2),'seconds',flush=True)
    (ROOT/'assets/audio/boss-music-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')


if __name__=='__main__':main()
