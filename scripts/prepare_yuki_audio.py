"""Yuki glacier: recorded ice/rock foley, frost air and restrained crystal tones.

Source metadata and CC0 provenance live beside the locally cached recordings.
Only Yuki's ultimate uses this palette; shared ice attacks and voices stay intact.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import imageio_ffmpeg
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio'
RATE = 32000
SOURCES = ROOT / 'sources/yuki'


def read(name):
    data = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error',
        '-i', str(SOURCES / name), '-ar', str(RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(data, dtype='<f4').astype(float)


def band(x, low, high):
    return sosfilt(butter(2, [low, high], btype='bandpass', fs=RATE, output='sos'), x)


def place(target, clip, at, gain=1):
    start = round(at*RATE)
    length = min(len(clip), len(target)-start)
    if length > 0:
        target[start:start+length] += clip[:length]*gain


def edges(x, attack=.003, release=.08):
    t = np.arange(len(x))/RATE
    return x*np.minimum(1, t/attack)*np.minimum(1, (len(x)/RATE-t)/release)


def save(kind, x, source_names, description):
    # Impact reflections stay dark; bright ice reflections are only for casting.
    stereo = np.column_stack((x.copy(), x.copy()))
    reflection = band(x, 55, 650) if kind == 'impact' else band(x,160,5800)
    for at, gain, side in [(.047,.13,0),(.079,.11,1),(.173,.08,0),(.257,.065,1)]:
        n = round(at*RATE)
        stereo[n:,side] += reflection[:-n]*gain*(.7 if kind == 'impact' else 1)
    stereo *= min(1, .82/max(.001, np.abs(stereo).max()))
    stereo[-round(RATE*.04):] *= np.linspace(1,0,round(RATE*.04))[:,None]
    target = ROOT / 'reimagined' / f'yuki-glacier-{kind}.wav'
    wavfile.write(target, RATE, np.round(stereo*32767).astype(np.int16))
    sources = json.loads((SOURCES/'sources.json').read_text(encoding='utf-8'))
    return {'file': target.relative_to(ROOT).as_posix(), 'duration': len(x)/RATE,
            'category':'designed-glacier-sfx', 'license':'CC0 source recordings + original synthesis',
            'sources':[s for s in sources if s['file'] in source_names], 'processing':description,
            'peak':round(float(np.abs(stereo).max()),4),
            'rms':round(float(np.sqrt(np.mean(stereo*stereo))),4),
            'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}


if __name__ == '__main__':
    ice = read('ice-crack.mp3')
    rng = np.random.default_rng(20261016)
    # 1.8 seconds of building frost: real microfractures and a quiet staff resonance.
    t = np.arange(round(1.8*RATE))/RATE
    charge = band(rng.normal(0,1,len(t)),900,6200)*.035
    charge *= (t/1.8)**1.5
    for at, frequency in [(.08,1046.5),(.52,1568),(.98,2093)]:
        u = np.maximum(0,t-at)
        chime = (np.sin(2*np.pi*frequency*u)+.22*np.sin(2*np.pi*frequency*2.71*u))
        charge += chime*np.exp(-u/.38)*(1-np.exp(-u/.03))*(t>=at)*.021
    place(charge, ice[round(.3*RATE):], .05, 1.6)
    charge = edges(charge,.08,.18)
    # Falling ice: a brief accelerating air rush, ending precisely at contact.
    t = np.arange(round(.30*RATE))/RATE
    fall = (band(rng.normal(0,1,len(t)),250,1900)*.28+
            band(rng.normal(0,1,len(t)),2200,7200)*.10)*(t/.30)**1.8
    place(fall, ice[round(.61*RATE):round(.72*RATE)], .15, .5)
    fall = edges(fall,.02,.012)
    # A new deep explosion recording supplies the body and natural rolling tail.
    # Darken the sustain further after contact, with no repeated bright debris.
    impact = np.zeros(round(4.4*RATE))
    t = np.arange(len(impact))/RATE
    boom = band(read('deep-boom.mp3'), 35, 1600)
    bt = np.arange(len(boom))/RATE
    dark = sosfilt(butter(3, 650, fs=RATE, output='sos'), boom)
    blend = np.clip((bt-.18)/.5, 0, 1)
    boom = boom*(1-blend)+dark*blend
    place(impact, boom, 0, 1.55)
    # Soft, low reflections extend the source without any metallic ringing.
    place(impact, dark, .37, .16)
    place(impact, dark, .79, .075)
    phase = 2*np.pi*(46*t+60*.055*(1-np.exp(-t/.055)))
    impact += np.sin(phase)*.32*(1-np.exp(-t/.003))*np.exp(-t/.23)
    # One muted fracture at contact preserves the ice identity, never in the tail.
    fracture = band(ice[round(.62*RATE):round(.80*RATE)], 180, 1100)
    place(impact, edges(fracture,.002,.07), .02, .25)
    # Preserve the contact, gently damp the lingering boom instead of cutting it.
    impact *= np.exp(-.38*np.maximum(0,t-.40))
    impact = edges(impact,.002,.55)
    manifest = {
        'ice-glacier-charge':save('charge',charge,['ice-crack.mp3'],'Recorded ice microfractures, original frost air and soft crystal resonance'),
        'ice-glacier-fall':save('fall',fall,['ice-crack.mp3'],'Original accelerating air rush and ice fracture'),
        'ice-glacier-impact':save('impact',impact,['deep-boom.mp3','ice-crack.mp3'],'Za-Games Deep Boom with progressively low-passed sustain, reduced dark reflections and gently damped tail after 400ms, original bass contact pulse and one muted ice fracture; no bright debris repeats'),
    }
    (ROOT/'yuki-glacier-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({k:{n:v[n] for n in ['duration','peak','rms']} for k,v in manifest.items()},indent=2))
