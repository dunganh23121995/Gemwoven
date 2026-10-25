"""Summon reveal sounds (src/gemwoven/summon-cinematic.js), meant to feel sacred: one clean real
CC0 recording per cue (a harmonium drone, a soft singing bowl, a deep temple bell, a wordless held
choir "ah", a softened water touch), kept gentle: few cues, low levels, low-passed,
minimally processed (excerpt, gentle high-pass, gain, edge fades; the natural attack and decay are
kept; no layering, pitch/time change, synthesis or limiting).

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

# Gentle and sacred (the round-3 set was too busy and bright): few, soft cues, all low-passed so
# nothing is harsh, under a calm harmonium drone. A card landing is only a soft touch of water.
# cue: (source id, start s, end s, high-pass Hz, low-pass Hz, fade-in ms, fade-out ms, target rms, peak cap, what it is)
CUES = {
    "touch": ("398039", 0.00, 1.40, 120, 3200, 4, 450, .05, .2, "small water splash, softened"),
    "gold": ("170672", 0.00, 4.00, 80, 2600, 60, 1600, .06, .22, "low singing bowl, softly struck"),
    "bell": ("131348", 0.00, 6.50, 50, 2400, 20, 2600, .06, .24, "deep temple bell, Daitokuji"),
    "hero": ("763910", 0.20, 8.10, 120, 3600, 700, 2200, .07, .24, "crowd singing a held 'ah' (wordless)"),
}
# The hero's own ultimate sounds for the spotlight's ultimate showcase: Mika's combat fire swell and
# whoosh (assets/audio/reimagined, credited with her combat set), only softened here.
OWN = {
    "ult-charge": ("assets/audio/reimagined/mika-flame-charge.wav", 3200, 30, 500, .06, .22, "Mika's fire swell (combat)"),
    "ult-whoosh": ("assets/audio/reimagined/mika-flame-whoosh.wav", 3200, 10, 1400, .07, .26, "Mika's flame whoosh (combat)"),
}
# Beds that loop under the screen: a calm harmonium drone and, quieter, the night lake.
BEDS = {
    "drone": ("264442", 30.0, 60, 2200, .04, .16, "harmonium drone"),
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
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(x) / RATE, 3), "what": what, "source": {"file": file, "credits": "assets/audio/mika-nori-manifest.json"},
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
