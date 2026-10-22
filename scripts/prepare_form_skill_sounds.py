"""Signature ultimate sounds for the four- and six-star forms.

Each sound layers the licensed recordings already in the repository (element cast
effects, Yuki's ice/boom sources, the thunder recordings, Noct's katana set) with a
few synthesised textures, so every form level has its own voice.
Output: assets/audio/form-skills/<hero>-form<N>.wav and form-skill-manifest.json.
"""
from pathlib import Path
import hashlib
import json
import subprocess

import imageio_ffmpeg
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

BASE = Path(__file__).resolve().parents[1] / "assets/audio"
OUT = BASE / "form-skills"
OUT.mkdir(exist_ok=True)
RATE = 32000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
rng = np.random.default_rng(20261023)


def load(rel, speed=1.0):
    """Decode any repository recording to mono float at RATE; speed > 1 raises pitch and shortens."""
    x = np.frombuffer(subprocess.check_output([FFMPEG, "-v", "error", "-i", str(BASE / rel), "-f", "f32le", "-ac", "1",
                                               "-ar", str(round(RATE * speed)), "pipe:1"]), dtype="<f4").copy()
    return x / max(1e-3, np.abs(x).max())


def band(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="bandpass", fs=RATE, output="sos"), x)


def mix(duration, *layers):
    """layers: (signal, start seconds, gain)."""
    out = np.zeros(round(duration * RATE))
    for signal, start, gain in layers:
        a = round(start * RATE)
        part = signal[: max(0, len(out) - a)]
        out[a:a + len(part)] += part * gain
    return out


def env(n, attack=.02, power=2.0):
    t = np.linspace(0, 1, n)
    return np.minimum(1, t / max(attack, 1e-3)) * (1 - t) ** power


def bells(duration, notes, spacing, decay=1.6):
    n = round(duration * RATE)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for i, f in enumerate(notes):
        start = i * spacing
        tt = np.clip(t - start, 0, None)
        tone = sum(np.sin(2 * np.pi * f * k * tt) / k ** 1.4 for k in (1, 2.01, 3.03))
        out += np.where(t >= start, tone * np.exp(-tt * decay), 0)
    return out / max(1e-3, np.abs(out).max())


def rustle(duration, lo=1800, hi=6500, flutter=17):
    n = round(duration * RATE)
    t = np.linspace(0, 1, n)
    x = band(rng.normal(size=n), lo, hi) * (0.6 + 0.4 * np.sin(2 * np.pi * flutter * t * duration)) * np.sin(np.pi * t) ** 1.5
    return x / max(1e-3, np.abs(x).max())


def rumble(duration, f0=48, f1=36):
    n = round(duration * RATE)
    t = np.arange(n) / RATE
    x = np.sin(2 * np.pi * (f0 + (f1 - f0) * t / duration) * t) * env(n, .08, 1.2)
    return x


manifest = {}


def save(name, x, sources, rms=.13):
    fade = round(.01 * RATE)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade * 4:] *= np.linspace(1, 0, fade * 4)
    x = np.tanh(x * .9)
    x *= min(rms / max(1e-3, np.sqrt(np.mean(x * x))), .85 / max(1e-3, np.abs(x).max()))
    path = OUT / f"{name}.wav"
    wavfile.write(path, RATE, (x * 32767).astype(np.int16))
    manifest[name] = {"file": f"form-skills/{path.name}", "duration": round(len(x) / RATE, 3), "sources": sources,
                      "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


R = "reimagined/"
# Mika: fox-flame wave, then nine converging tails igniting a sun.
save("fire-form2", mix(1.2, (load(R + "fire-launch.wav", .9), 0, .8), (load("sources/mika-nori/fire-whoosh.mp3", .85), .05, .7),
                       (load(R + "fire-impact.wav", .8), .32, 1)), ["fire-launch.wav", "fire-whoosh.mp3", "fire-impact.wav"])
lead = load(R + "fire-finish.wav", .9)[::-1].copy()[:round(.7 * RATE)]
save("fire-form3", mix(2.0, (lead, 0, .6), (load(R + "fire-finish.wav", .78), .65, 1), (load("sources/yuki/deep-boom.mp3", .9), .7, .9),
                       (load("sources/mika-nori/fire-whoosh.mp3", 1.2), .55, .5), (rumble(1.3), .7, .5)),
     ["fire-finish.wav (reversed lead)", "deep-boom.mp3", "fire-whoosh.mp3", "synth rumble"], .15)
# Yuki: moon frost shattering, then a lotus of ice bells opening over a deep boom.
save("ice-form2", mix(1.3, (load(R + "ice-launch.wav"), 0, .6), (load("sources/yuki/ice-crack.mp3", .95), .3, 1),
                      (bells(1.0, [1568, 2093, 2637], .06, 3.2), .32, .35)), ["ice-launch.wav", "ice-crack.mp3", "synth frost bells"])
save("ice-form3", mix(2.2, (bells(2.0, [1046, 1318, 1568, 2093, 2637, 3136], .12, 1.4), 0, .5), (load("sources/yuki/deep-boom.mp3", .85), .6, .9),
                      (load(R + "ice-finish.wav", .9), .62, .9), (load("sources/yuki/ice-crack.mp3", .8), .7, .6)),
     ["synth lotus bells", "deep-boom.mp3", "ice-finish.wav", "ice-crack.mp3"], .14)
# Nori: roots bursting into a jade ward, then the world tree erupting in a storm of leaves.
save("earth-form2", mix(1.3, (load("sources/yuki/rock-impact.mp3", .9), 0, .9), (load(R + "earth-impact.wav", .9), .15, .9),
                        (rumble(.9, 60, 44), .05, .5), (rustle(.8), .3, .25)), ["rock-impact.mp3", "earth-impact.wav", "synth rumble and leaves"])
save("earth-form3", mix(2.2, (rumble(1.6, 40, 30), 0, .7), (load(R + "earth-finish.wav", .85), .5, 1), (load("sources/yuki/deep-boom.mp3", .8), .55, .8),
                        (rustle(1.5, 1500, 7000, 23), .6, .45), (load("sources/yuki/rock-impact.mp3", .75), .5, .7)),
     ["synth rumble", "earth-finish.wav", "deep-boom.mp3", "synth leaf storm", "rock-impact.mp3"], .15)
# Lumi: five star bolts, then a constellation chime and nine meteors in a long roll.
thunder = load("sources/thunder/simon-spiers-437243-hq.mp3")
crack = thunder[np.argmax(np.abs(thunder)) - round(.02 * RATE):][:round(.32 * RATE)] * env(round(.32 * RATE), .005, 2.5)
save("lightning-form2", mix(1.3, *[(crack, .08 + i * .13, .8 - i * .05) for i in range(5)], (load(R + "lightning-impact.wav"), .1, .5)),
     ["simon-spiers-437243-hq.mp3 cracks", "lightning-impact.wav"])
roll = load("sources/thunder/seth-m-458015-hq.mp3")[:round(1.6 * RATE)] * env(round(1.6 * RATE), .03, 1.4)
save("lightning-form3", mix(2.3, (bells(1.0, [1760, 2349, 2637, 3520, 4186], .07, 2.4), 0, .45), *[(crack, .55 + i * .09, .55) for i in range(9)],
                            (roll, .6, .9), (load(R + "lightning-finish.wav"), .7, .7)),
     ["synth constellation chime", "simon-spiers-437243-hq.mp3 cracks", "seth-m-458015-hq.mp3 roll", "lightning-finish.wav"], .15)
# Noct: two crossing moon-blade cuts with a cold wind.
wind = band(rng.normal(size=round(.9 * RATE)), 200, 2200) * env(round(.9 * RATE), .25, 1.5)
save("shadow-form2", mix(1.1, (wind / max(1e-3, np.abs(wind).max()), 0, .35), (load("noct-sfx/slash2.wav", .9), .12, 1),
                         (load("noct-sfx/slash3.wav", .85), .26, 1), (load("noct-sfx/finish.wav", .9), .42, .8)),
     ["noct-sfx slash2/slash3/finish", "synth wind"])
(BASE / "form-skill-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("Prepared", len(manifest), "form skill sounds.")
