"""Lumi's four- and six-star kit sounds (src/forms-lumi.js): ONE natural recording per clip.

Like her form-1 sounds, every clip is a single real recording with its own attack and decay: an excerpt, a
gentle high-pass, gain and short edge fades. No layering, pitch or time changes, synthesis or limiting.
No thunder roll (forms 2-3 have no storm cloud), but the hits are at least as heavy as form 1's storm: the bolts
use only the crack portions of the very lightning recordings form 1 uses (Simon Spiers #437243 close strike;
seth-m #458015 big thunder clap for the last, biggest bolt), cut before their rumble, low end kept (40 Hz high-pass).
Sources: assets/audio/sources/freesound/<id>-*/ (source.json: title, author, URL, licence CC0, SHA-256) and
assets/audio/sources/thunder/ (form 1's lightning recording).
Output: assets/audio/hero-forms/lightning/*.wav and assets/audio/hero-forms/lightning-manifest.json.
Run: python scripts/prepare_lumi_form_sounds.py
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
OUT = BASE / "hero-forms/lightning"
OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*.wav"):
    old.unlink()
RATE = 32000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FS = "sources/freesound/"
SRC = {
    "marktree": (FS + "796546-mark-tree-fast-down-scale/796546-mark-tree-fast-down-scale.mp3",
                 "Mark Tree Fast Down Scale", "mbthetd", "https://freesound.org/people/mbthetd/sounds/796546/"),
    "quartz": (FS + "800115-quartz-crystal-tapping-ceramic-plate-004/800115-quartz-crystal-tapping-ceramic-plate-004.mp3",
               "quartz crystal tapping ceramic plate-004.wav", "CVLTIV8R", "https://freesound.org/people/CVLTIV8R/sounds/800115/"),
    "tingsha": (FS + "435074-tingsha-cymbal/435074-tingsha-cymbal.mp3",
                "Tingsha Cymbal", "steffcaffrey", "https://freesound.org/people/steffcaffrey/sounds/435074/"),
    "bowlrub": (FS + "707797-tibetan-singing-bowl-1/707797-tibetan-singing-bowl-1.mp3",
                "Tibetan_Singing_bowl_1", "TheGreenEyedGhost", "https://freesound.org/people/TheGreenEyedGhost/sounds/707797/"),
    "bowlstrike": (FS + "271370-singing-bowl-strike-sound/271370-singing-bowl-strike-sound.mp3",
                   "singing bowl strike sound", "inoshirodesign", "https://freesound.org/people/inoshirodesign/sounds/271370/"),
    "stick": (FS + "352719-woosh-stick-swung-in-the-air/352719-woosh-stick-swung-in-the-air.mp3",
              "Woosh (stick swung in the air)", "Dalesome", "https://freesound.org/people/Dalesome/sounds/352719/"),
    "spark": (FS + "189630-spark/189630-spark.mp3", "Spark", "elliott.klein", "https://freesound.org/people/elliott.klein/sounds/189630/"),
    "sparks": (FS + "396470-electric-sparks-wav/396470-electric-sparks-wav.mp3", "Electric Sparks.wav", "kev_durr",
               "https://freesound.org/people/kev_durr/sounds/396470/"),
    "tesla": (FS + "415962-high-voltage-discharge-2-wav/415962-high-voltage-discharge-2-wav.mp3", "high-voltage-discharge-2.wav",
              "follytowers", "https://freesound.org/people/follytowers/sounds/415962/"),
    "clap": ("sources/thunder/seth-m-458015-hq.mp3", "big thunder clap", "seth-m", "https://freesound.org/people/seth-m/sounds/458015/"),
    "crack": ("sources/thunder/simon-spiers-437243-hq.mp3", "Very close lightning strike.", "Simon Spiers",
              "https://freesound.org/people/Simon%20Spiers/sounds/437243/"),
}
manifest = {}


def load(name):
    return np.frombuffer(subprocess.check_output([FFMPEG, "-v", "error", "-i", str(BASE / SRC[name][0]), "-f", "f32le", "-ac", "1",
                                                  "-ar", str(RATE), "pipe:1"]), dtype="<f4").astype(np.float64)


def clip(out, name, start, length, beat, highpass=80, fade_in=.003, fade_out=.12, rms=.11):
    """One excerpt of one recording: gentle high-pass, short edge fades, gain to rms ~.11 (peaks stay natural, <= .9).
    Hits pass rms=1: they are simply raised to a .9 peak, keeping the crack's full weight."""
    x = load(name)[round(start * RATE):round((start + length) * RATE)].copy()
    x = sosfilt(butter(2, highpass, btype="highpass", fs=RATE, output="sos"), x)
    a, b = round(fade_in * RATE), round(fade_out * RATE)
    x[:a] *= np.linspace(0, 1, a); x[-b:] *= np.linspace(1, 0, b)
    level = np.sqrt(np.mean(x[np.abs(x) > np.abs(x).max() * .01] ** 2))
    x *= min(rms / level, .9 / np.abs(x).max())
    path = OUT / f"{out}.wav"
    wavfile.write(path, RATE, (x * 32767).astype(np.int16))
    src, title, author, url = SRC[name]
    manifest[f"lightning-{out}"] = {
        "file": f"hero-forms/lightning/{out}.wav", "duration": round(len(x) / RATE, 3), "beat": beat,
        "sources": [{"title": title, "author": author, "source_url": url, "file": src, "license": "CC0-1.0",
                     "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                     "sha256": hashlib.sha256((BASE / src).read_bytes()).hexdigest(), "excerpt": [round(start, 3), round(start + length, 3)]}],
        "license": "CC0-1.0", "processing": f"one excerpt, {highpass} Hz high-pass, gain, edge fades; original pitch, speed and tail",
        "peak": round(float(np.abs(x).max()), 4), "rms": round(float(np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2))), 4),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    print(f"{out:12} {len(x) / RATE:.2f}s peak {np.abs(x).max():.2f}  <- {title}")


# Each clip starts on its segment's frame and lasts as long as that segment is on screen (windows in ms on the
# skill clock of src/forms-lumi.js). Continuous effects get a continuous recording, every bolt its own crack.
# Four-star Tinh Lôi Sứ Giả
clip("f2-summon", "marktree", .0, .52, "four-star ultimate 460-980: she raises her orb, the five stars leave it and fly up", fade_out=.18)
clip("f2-star", "quartz", .42, .08, "four-star ultimate 980-1340: one click as each star lands (5 x, 85 ms apart)", highpass=300, fade_out=.025)
clip("f2-arcs", "sparks", .1, 1.51, "four-star ultimate 1320-2830: the pentagram draws itself and crackles with arcs until it fades", highpass=120, fade_in=.06, fade_out=.38)
clip("f2-bolt", "crack", 20.79, .24, "four-star ultimate 1620-2100: each of the first four star bolts and its ground strike (once per bolt)", highpass=40, fade_out=.08, rms=1)
clip("f2-last", "clap", .70, 1.2, "four-star ultimate 2100-3300: the fifth bolt, the big star burst and flash, with the clap's natural tail", highpass=40, fade_in=.005, fade_out=.5, rms=1)
# Both basic attacks (throw: 230 ms of flight)
clip("throw", "stick", .08, .23, "basic attack, forms 2-3: the star / ring bolt leaves the weapon and flies (230 ms)", highpass=120, fade_out=.07)
clip("f2-pop", "spark", .0, .17, "four-star basic attack: the crackling star bursts on the foe (until the recovery frame)", highpass=300, fade_out=.04)
# Six-star Thiên Tinh Lôi Chủ
clip("f3-galaxy", "bowlrub", .2, 2.41, "six-star ultimate 460-2870: the orbit rings spin off, open into the galaxy, it hangs turning and collapses (rubbed singing bowl)", highpass=100, fade_in=.05, fade_out=.42)
clip("f3-twinkle", "tingsha", .0, .45, "six-star ultimate 1000-1450: stars twinkle along the galaxy's arms ('tinh tinh'); also her hop onto the spear", highpass=300, fade_out=.15)
clip("f3-arcs", "tesla", 1.7, 1.0, "six-star ultimate 1450-2450: the galaxy rains bolts, Tesla-coil discharge roaring under them", highpass=60, fade_in=.03, fade_out=.2)
clip("f3-bolt", "crack", 20.79, .32, "six-star ultimate 1450-2230: each of the first eight star bolts and its ground strike (once per bolt, 98 ms apart)", highpass=40, fade_out=.1, rms=1)
clip("f3-last", "clap", .70, 1.5, "six-star ultimate 2230-3730: the ninth bolt from the galaxy's heart, the ring burst and flash, with the clap's natural tail", highpass=35, fade_in=.005, fade_out=.6, rms=1)
clip("f3-ring", "bowlstrike", .02, .35, "six-star basic attack: the orbit-ring shockwave on the foe (until the recovery frame)", highpass=120, fade_out=.15)
(BASE / "hero-forms/lightning-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(len(manifest), "sounds")
