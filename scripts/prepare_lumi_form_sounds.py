"""Lumi's four- and six-star kit sounds (src/forms-lumi.js), built only from real CC0 recordings.

No thunder roll: forms 2/3 have no storm cloud. Four-star Tinh Lôi Sứ Giả is crystal and spell-magic
(a chime shimmer as she raises her orb, one crystal "kịch" per star rising in pitch, a crystal chord when
the pentagram closes, crisp electric zaps for the bolts); six-star Thiên Tinh Lôi Chủ is space and laser
(a slinky-laser sweep into a wine-glass hum for the galaxy, "tinh tinh" crystal twinkles, laser zaps for
the nine bolts, a singing-bowl ring burst at the end).
Sources: assets/audio/sources/freesound/<id>-*/ (source.json: title, author, URL, licence CC0, SHA-256)
plus the existing thunder source (Simon Spiers #437243, only its first lightning crack).
Processing: excerpts, resampling (pitch and speed together), band filters, layering, fades, gentle peak
limiting and loudness normalisation (rms ~0.12, peak <= 0.5) like the other cast sounds. No synthesis.
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
RATE = 32000
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FS = "sources/freesound/"
SRC = {
    "bell8": FS + "614832-2022-01-14-crystal-bell-08-flac/614832-2022-01-14-crystal-bell-08-flac.mp3",
    "bell1": FS + "614833-2022-01-14-crystal-bell-01-flac/614833-2022-01-14-crystal-bell-01-flac.mp3",
    "clank": FS + "734238-crystal1/734238-crystal1.mp3",
    "bigbell": FS + "326368-crystal-bell/326368-crystal-bell.mp3",
    "bowl": FS + "271370-singing-bowl-strike-sound/271370-singing-bowl-strike-sound.mp3",
    "chimes": FS + "235463-wind-chimes-single-wav/235463-wind-chimes-single-wav.mp3",
    "tesla": FS + "415962-high-voltage-discharge-2-wav/415962-high-voltage-discharge-2-wav.mp3",
    "ladder": FS + "536741-zap-ogg/536741-zap-ogg.mp3",
    "spark": FS + "189630-spark/189630-spark.mp3",
    "glass": FS + "338730-wine-glass-hum/338730-wine-glass-hum.mp3",
    "slinky": FS + "411928-lasers-firing-slinky-m4a/411928-lasers-firing-slinky-m4a.mp3",
    "stick": FS + "352719-woosh-stick-swung-in-the-air/352719-woosh-stick-swung-in-the-air.mp3",
    "crack": "sources/thunder/simon-spiers-437243-hq.mp3",
}
_cache = {}


def load(name, speed=1.0):
    """Mono float at RATE; speed > 1 plays the recording faster (higher and shorter)."""
    key = (name, speed)
    if key not in _cache:
        x = np.frombuffer(subprocess.check_output([FFMPEG, "-v", "error", "-i", str(BASE / SRC[name]), "-f", "f32le", "-ac", "1",
                                                   "-ar", str(round(RATE / speed)), "pipe:1"]), dtype="<f4").astype(np.float64)
        _cache[key] = x / max(1e-4, np.abs(x).max())
    return _cache[key]


def cut(name, start, length, speed=1.0, fade_in=.004, fade_out=.05):
    """An excerpt (seconds in the resampled clip) with short edge fades."""
    x = load(name, speed)[round(start * RATE):round((start + length) * RATE)].copy()
    a, b = max(1, round(fade_in * RATE)), max(1, round(fade_out * RATE))
    x[:a] *= np.linspace(0, 1, a)[:len(x[:a])]
    x[-b:] *= np.linspace(1, 0, b)[-len(x[-b:]):]
    return x


def filt(x, lo=None, hi=None):
    if lo: x = sosfilt(butter(2, lo, btype="highpass", fs=RATE, output="sos"), x)
    if hi: x = sosfilt(butter(2, hi, btype="lowpass", fs=RATE, output="sos"), x)
    return x


def decay(x, seconds):
    """Let a ringing excerpt die away over `seconds` (exponential)."""
    return x * np.exp(-np.arange(len(x)) / RATE * 4.6 / seconds)


def swell(x, attack):
    n = len(x); a = min(n, round(attack * RATE)); e = np.ones(n); e[:a] = np.linspace(0, 1, a) ** 2
    return x * e


def mix(duration, *layers):
    """layers: (signal, start seconds, gain)."""
    out = np.zeros(round(duration * RATE))
    for signal, start, gain in layers:
        a = round(start * RATE); part = signal[:max(0, len(out) - a)]
        out[a:a + len(part)] += part * gain
    return out


def finish(x, rms=.12, peak=.5, tail=.06):
    x = filt(x, lo=40)
    b = round(tail * RATE); x[-b:] *= np.linspace(1, 0, b)
    level = np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1
    gain = min(rms / level, 2 * peak / np.abs(x).max())  # at most 6 dB into the limiter
    y = peak * np.tanh(x * gain / peak)
    return y


manifest = {}


def write(name, x, sources, beat):
    y = finish(x)
    path = OUT / f"{name}.wav"
    wavfile.write(path, RATE, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    data = path.read_bytes()
    manifest[f"lightning-{name}"] = {
        "file": f"hero-forms/lightning/{name}.wav", "duration": round(len(y) / RATE, 3), "beat": beat,
        "sources": sources, "license": "CC0-1.0", "processing": "excerpts, resampling, band filters, layering, fades, peak limiting, loudness normalisation",
        "peak": round(float(np.abs(y).max()), 4), "rms": round(float(np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2))), 4),
        "sha256": hashlib.sha256(data).hexdigest()}
    print(f"{name:16} {len(y) / RATE:.2f}s peak {np.abs(y).max():.2f}")


# --- shared pieces -------------------------------------------------------------------------------------------
def ping(ratio, length=.42, ring=.35):
    """One crystal "kịch": the glass clank's click on top of the crystal bell, tuned by `ratio`."""
    return mix(length, (filt(cut("clank", .0, .09, speed=ratio), lo=1500), 0, .55),
               (decay(filt(cut("bell8", .0, length, speed=ratio, fade_out=.08), lo=900), ring), .004, 1.0))


def crack(length=.32):
    """The first, closest lightning crack of Simon Spiers' recording (no rumble after it)."""
    return decay(filt(cut("crack", 20.815, length, fade_out=.08), lo=380), length * .9)


def zap(start=2.94, length=.32, speed=1.0):
    """A burst of Tesla-coil discharge (start: seconds in the original recording)."""
    return decay(filt(cut("tesla", start / speed, length, speed=speed, fade_out=.06), lo=600), length)


def laser(n=0, speed=1.0, length=.42):
    """One slinky 'pew' (isolated shots of the recording, seconds in the original)."""
    starts = [2.02, 2.66, 6.64, 9.10, 5.46, 4.68]
    return filt(cut("slinky", starts[n % len(starts)] / speed, length, speed=speed, fade_out=.1), lo=180)


SPIERS = "Simon Spiers, Very close lightning strike (#437243), first crack only"
# --- form 2: Tinh Lôi Sứ Giả -----------------------------------------------------------------------------------
write("f2-summon", mix(1.05,
      (swell(filt(cut("chimes", .38, 1.05, fade_out=.35), lo=2500), .25), 0, .9),
      (decay(filt(cut("bell1", .0, .9, speed=.84), lo=700), .8), .12, .55),
      (decay(filt(cut("bell8", .0, .7, speed=1.26), lo=900), .55), .3, .35)),
      ["jcdecha, Wind_Chimes_single.wav (#235463)", "arseniiv, crystal bell 01/08 (#614833, #614832)"],
      "four-star ultimate: she raises her orb and the stars leave it")
for k, ratio in enumerate([.89, 1.0, 1.12, 1.26, 1.335]):   # five stars, rising (a pentatonic run)
    write(f"f2-star{k + 1}", ping(ratio), ["NoisyRedFox, Crystal1 (#734238)", "arseniiv, crystal bell 08 (#614832)"],
          f"four-star ultimate: star {k + 1} reaches its place in the sky")
write("f2-seal", mix(1.6,
      (decay(filt(cut("bigbell", .3, 1.6, fade_out=.3), lo=250), 1.4), 0, .8),
      (decay(filt(cut("bell1", .0, 1.3, speed=1.0), lo=800), 1.0), .0, .5),
      (decay(filt(cut("bell8", .0, 1.3, speed=1.26), lo=800), 1.0), .02, .42),
      (decay(filt(cut("bell1", .0, 1.3, speed=1.5), lo=800), 1.0), .04, .36),
      (filt(cut("ladder", .12, .5, fade_out=.2), lo=1200), .05, .25)),
      ["iospyrakis, crystal bell (#326368)", "arseniiv, crystal bell 01/08 (#614833, #614832)", "egomassive, Zap.ogg (Jacob's ladder, #536741)"],
      "four-star ultimate: the pentagram closes (a crystal major chord with a crackle along its lines)")
write("f2-bolt", mix(.62,
      (crack(.34), 0, .9), (zap(2.94, .3), .0, .55),
      (decay(filt(cut("bell8", .0, .5, speed=1.5), lo=1500), .35), .05, .3)),
      [SPIERS, "follytowers, high-voltage-discharge-2 (Tesla coil, #415962)", "arseniiv, crystal bell 08 (#614832)"],
      "four-star ultimate: one star fires its bolt; sparkle where it lands")
write("f2-finale", mix(1.5,
      (crack(.45), 0, 1.0), (zap(7.36, .45), .0, .6), (filt(cut("ladder", .1, .7, fade_out=.25), lo=700), .02, .5),
      (decay(filt(cut("bigbell", .3, 1.4, speed=1.25, fade_out=.3), lo=300), 1.2), .06, .6),
      (filt(cut("chimes", 4.2, 1.2, fade_out=.5), lo=2500), .15, .45)),
      [SPIERS, "follytowers, high-voltage-discharge-2 (#415962)", "egomassive, Zap.ogg (#536741)", "iospyrakis, crystal bell (#326368)", "jcdecha, Wind_Chimes_single.wav (#235463)"],
      "four-star ultimate: the last bolt and the big star burst")
write("f2-throw", mix(.42,
      (filt(cut("stick", .06, .42, speed=.9, fade_out=.12), lo=250), 0, 1.0),
      (filt(cut("spark", .0, .16), lo=1500), .1, .5), (filt(cut("spark", .0, .16, speed=1.2), lo=1500), .2, .35)),
      ["Dalesome, Woosh (stick swung in the air) (#352719)", "elliott.klein, Spark (#189630)"],
      "four-star basic attack: she flings the crackling star")
write("f2-pop", mix(.55,
      (filt(cut("clank", .0, .09, speed=.8), lo=1200), 0, .7), (filt(cut("spark", .0, .16), lo=1200), 0, .7),
      (decay(filt(cut("bell1", .0, .55, speed=1.12), lo=900), .45), .01, .55)),
      ["NoisyRedFox, Crystal1 (#734238)", "elliott.klein, Spark (#189630)", "arseniiv, crystal bell 01 (#614833)"],
      "four-star basic attack: the star bursts on the foe")
# --- form 3: Thiên Tinh Lôi Chủ ---------------------------------------------------------------------------------
write("f3-galaxy", mix(2.6,
      (filt(cut("slinky", 6.64 / .55, .8, speed=.55, fade_out=.3), lo=120), 0, 1.3),                 # slow laser sweep: the rings spin off
      (filt(cut("slinky", 2.66 / .62, .7, speed=.62, fade_out=.3), lo=120), .3, .9),                 # a second turn as it opens
      (swell(filt(cut("glass", 2.0 / .5, 2.3, speed=.5, fade_out=.8), lo=90, hi=3000), .5), .25, .5),  # spatial hum while it hangs
      (swell(filt(cut("glass", 2.0 / .75, 2.0, speed=.75, fade_out=.8), lo=200), .7), .45, .2)),
      ["SoaringAaronJohnson51397, Lasers Firing (slinky) (#411928)", "omnomducks, Wine glass hum (#338730)"],
      "six-star ultimate: the orbit rings spin off the spear and open into the galaxy (it hums while it hangs)")
write("f3-twinkle", mix(1.0,
      *[(decay(filt(cut("bell8", .0, .45, speed=r), lo=1500), .3), t, g) for t, r, g in
        [(0, 1.5, .55), (.12, 1.68, .5), (.24, 2.0, .5), (.42, 1.78, .4), (.56, 2.24, .35)]],
      (filt(cut("chimes", .5, .9, fade_out=.4), lo=4000), .05, .3)),
      ["arseniiv, crystal bell 08 (#614832)", "jcdecha, Wind_Chimes_single.wav (#235463)"],
      "six-star ultimate: stars stream along the galaxy's arms ('tinh tinh')")
for k, n in enumerate((0, 1)):
    write(f"f3-bolt{k + 1}", mix(.42,
          (laser(n, speed=1.15, length=.34), 0, .9), (zap(9.42 + k * 1.3, .26, speed=1.1), .02, .45),
          (crack(.22), .03, .35)),
          ["SoaringAaronJohnson51397, Lasers Firing (slinky) (#411928)", "follytowers, high-voltage-discharge-2 (#415962)", SPIERS],
          "six-star ultimate: one of the nine star bolts (two takes, alternated)")
write("f3-finale", mix(2.0,
      (decay(filt(cut("bowl", .02, 2.0, fade_out=.4), lo=150), 1.8), 0, 1.0),
      (laser(2, speed=.8, length=.6), 0, .6), (crack(.4), 0, .7), (zap(10.7, .5), .02, .45),
      (decay(filt(cut("bigbell", .3, 1.6, speed=1.5, fade_out=.3), lo=400), 1.3), .05, .4)),
      ["inoshirodesign, singing bowl strike sound (#271370)", "SoaringAaronJohnson51397, Lasers Firing (slinky) (#411928)", SPIERS,
       "follytowers, high-voltage-discharge-2 (#415962)", "iospyrakis, crystal bell (#326368)"],
      "six-star ultimate: the last bolt from the galaxy's heart and the ring burst")
write("f3-shot", mix(.5,
      (laser(3, speed=1.25, length=.34), 0, 1.0), (decay(filt(cut("bell8", .0, .4, speed=1.68), lo=1500), .3), .02, .3)),
      ["SoaringAaronJohnson51397, Lasers Firing (slinky) (#411928)", "arseniiv, crystal bell 08 (#614832)"],
      "six-star basic attack: the orbit-ring bolt leaves the spear")
write("f3-ring", mix(.8,
      (decay(filt(cut("bowl", .02, .8, speed=1.5, fade_out=.25), lo=300), .6), 0, .9), (zap(11.54, .26, speed=1.2), 0, .5),
      (filt(cut("clank", .0, .09), lo=1500), 0, .4)),
      ["inoshirodesign, singing bowl strike sound (#271370)", "follytowers, high-voltage-discharge-2 (#415962)", "NoisyRedFox, Crystal1 (#734238)"],
      "six-star basic attack: the ring shockwave on the foe")
(BASE / "hero-forms/lightning-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(len(manifest), "sounds")
