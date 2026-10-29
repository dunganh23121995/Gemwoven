"""Summon reveal sounds (src/gemwoven/summon-cinematic.js). The dealing stays calm and quiet; a whole
hero arrives in grandeur. One clean real CC0 recording per cue, minimally processed (excerpt, gentle
high/low-pass, gain, edge fades; the natural attack and decay are kept; no layering, pitch/time change,
synthesis or limiting):
- calm: a soft wind-chime touch as a card lands, a tingsha for silver, a small crystal bell for gold,
  over a deep church gong drone and, quieter, the night lake;
- a whole hero: a suspended-cymbal roll swells in the dark, a large tam-tam strikes as its realm
  appears, a held choir "ah" rises under it, and the hero's own element answers (its sting, taken from
  its combat set and credited there).

Sources live in assets/audio/sources/freesound/<id>-<slug>/ (source.json: title, author, licence,
URL, SHA-256). Output: assets/audio/summon/*.ogg and assets/audio/summon/summon-sounds.json, which
scripts/build_gemwoven.py embeds for the offline hub."""
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/audio/sources/freesound"
OUT = ROOT / "assets/audio/summon"
RATE = 44100

# cue: (source id, start s, end s, high-pass Hz, low-pass Hz, fade-in ms, fade-out ms, target rms, peak cap, what it is)
CUES = {
    "touch": ("222893", 53.25, 54.95, 150, 6500, 4, 700, .03, .14, "one soft wind-chime pipe (wooden hammer)"),
    "gold": ("435074", 0.00, 2.80, 220, 7000, 2, 1200, .035, .16, "tingsha, softly rung"),
    "bell": ("614832", 0.00, 1.48, 150, 8000, 2, 500, .04, .2, "small crystal bell"),
    "rise": ("711620", 2.50, 4.75, 50, 9000, 400, 180, .06, .28, "suspended cymbal roll with yarn mallets, swelling"),
    "strike": ("316642", 0.00, 9.00, 35, 5000, 3, 3800, .09, .42, "large tam-tam struck, long decay"),
    "hero": ("763910", 0.20, 8.10, 120, 3600, 700, 2200, .06, .22, "crowd singing a held 'ah' (wordless)"),
}
# A whole hero's own element answers the strike: one cue of its combat set (credited with that set).
OWN = {
    "sting-fire": ("assets/audio/hero-forms/fire/f3-engulf.wav", 9000, 5, 400, .07, .3, "Mika: flames engulf (form 3 combat)"),
    "sting-ice": ("assets/audio/hero-forms/ice/f2-freeze.wav", 9000, 5, 300, .07, .3, "Yuki: ice freezes (form 2 combat)"),
    "sting-earth": ("assets/audio/hero-forms/earth/leaves.wav", 9000, 20, 700, .06, .28, "Nori: leaves rustle (combat)"),
    "sting-lightning": ("assets/audio/reimagined/lumi-thunder-rumble.wav", 9000, 5, 300, .07, .32, "Lumi: thunder clap (combat)"),
    "sting-shadow": ("assets/audio/noct-sfx/mist.wav", 9000, 5, 300, .06, .28, "Noct: shadow mist (combat)"),
}
# Beds that loop under the screen: a deep church gong drone and, quieter, the night lake.
BEDS = {
    "drone": ("647596", 30.0, 40, 2400, .03, .13, "30-inch chau gong drone in a church"),
    "ambience": ("445095", 26.0, 150, 3500, .02, .12, "night lake: crickets, frogs, water"),
}


def source(sid):
    folder = next(SRC.glob(f"{sid}-*"))
    meta = json.loads((folder / "source.json").read_text(encoding="utf-8"))
    return folder / meta["file"], meta


def decode(path, channels=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(channels), "-ar", str(RATE), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    return x.reshape(-1, channels)


def highpass(x, hz):
    """Gentle 2nd-order high-pass (RBJ biquad), applied per channel."""
    w = 2 * np.pi * hz / RATE; alpha = np.sin(w) / (2 * .7071); c = np.cos(w)
    b = np.array([(1 + c) / 2, -(1 + c), (1 + c) / 2]); a = np.array([1 + alpha, -2 * c, 1 - alpha])
    b, a = b / a[0], a / a[0]
    from scipy.signal import lfilter
    return np.stack([lfilter(b, a, x[:, ch]) for ch in range(x.shape[1])], axis=1)


def lowpass(x, hz):
    """Gentle 2nd-order low-pass (RBJ biquad) to take the edge off bright recordings."""
    w = 2 * np.pi * hz / RATE; alpha = np.sin(w) / (2 * .7071); c = np.cos(w)
    b = np.array([(1 - c) / 2, 1 - c, (1 - c) / 2]); a = np.array([1 + alpha, -2 * c, 1 - alpha])
    b, a = b / a[0], a / a[0]
    from scipy.signal import lfilter
    return np.stack([lfilter(b, a, x[:, ch]) for ch in range(x.shape[1])], axis=1)


def fades(x, fin, fout):
    n_in, n_out = int(RATE * fin / 1000), int(RATE * fout / 1000)
    if n_in: x[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    if n_out: x[-n_out:] *= (np.cos(np.linspace(0, np.pi, n_out)) * .5 + .5)[:, None]
    return x


def level(x, rms, peak):
    gain = min(rms / (np.sqrt((x ** 2).mean()) + 1e-9), peak / (np.abs(x).max() + 1e-9))
    return x * gain


def write(x, name):
    path = OUT / f"{name}.ogg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", str(x.shape[1]), "-ar", str(RATE), "-i", "-",
                    "-c:a", "libvorbis", "-q:a", "5", str(path)], input=x.astype(np.float32).tobytes(), check=True)
    return path


def steadiest(x, seconds):
    """Start of the calmest stretch (lowest loudness variation) so the bed has no sudden events."""
    hop = RATE // 2; env = np.sqrt((x[: len(x) // hop * hop, 0].reshape(-1, hop) ** 2).mean(1))
    span = int(seconds * 2); best = min(range(len(env) - span), key=lambda i: env[i:i + span].std() / (env[i:i + span].mean() + 1e-9))
    return best * hop


OUT.mkdir(parents=True, exist_ok=True)
manifest = {}
for name, (sid, start, end, hp, lp, fin, fout, rms, peak, what) in CUES.items():
    path, meta = source(sid)
    x = decode(path)[int(start * RATE):int(end * RATE)]
    x = level(fades(lowpass(highpass(x, hp), lp), fin, fout), rms, peak)
    out = write(x, name)
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(x) / RATE, 3), "what": what,
                      "source": {"id": sid, "title": meta["title"], "author": meta["author"], "license": meta["license"], "url": meta["source_url"], "sha256": meta["sha256"]},
                      "excerpt": [start, end], "peak": round(float(np.abs(x).max()), 3), "rms": round(float(np.sqrt((x ** 2).mean())), 3)}

for name, (file, lp, fin, fout, rms, peak, what) in OWN.items():
    x = level(fades(lowpass(decode(ROOT / file), lp), fin, fout), rms, peak)
    out = write(x, name)
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(x) / RATE, 3), "what": what, "source": {"file": file, "credits": "the hero's combat sound manifest"},
                      "peak": round(float(np.abs(x).max()), 3), "rms": round(float(np.sqrt((x ** 2).mean())), 3)}
# Beds: a calm stretch of each recording, made loopable by a 1.5 s crossfade of its own ends.
for name, (sid, length, hp, lp, rms, peak, what) in BEDS.items():
    path, meta = source(sid)
    x = decode(path, 2); start = steadiest(x, length + 1.5)
    x = lowpass(highpass(x[start:start + int((length + 1.5) * RATE)], hp), lp)
    xf = int(1.5 * RATE); ramp = np.linspace(0, 1, xf)[:, None]
    loop = x[:-xf].copy(); loop[:xf] = x[:xf] * ramp + x[-xf:] * (1 - ramp)
    loop = level(loop, rms, peak)
    out = write(loop, name)
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(loop) / RATE, 3), "what": what, "loop": True,
                      "source": {"id": sid, "title": meta["title"], "author": meta["author"], "license": meta["license"], "url": meta["source_url"], "sha256": meta["sha256"]},
                      "excerpt": [round(start / RATE, 2), round(start / RATE + length + 1.5, 2)], "peak": round(float(np.abs(loop).max()), 3), "rms": round(float(np.sqrt((loop ** 2).mean())), 3)}
(OUT / "summon-sounds.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
for k, v in manifest.items():
    print(f"{k:9} {v['duration']:6.2f}s peak {v['peak']:.2f} rms {v['rms']:.3f}  #{v['source'].get('id', v['source'].get('file'))} {v['what']}")
