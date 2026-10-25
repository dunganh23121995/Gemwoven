"""Summon reveal sounds (src/gemwoven/summon-cinematic.js), meant to feel sacred: one clean real
CC0 recording per cue (temple bells, singing bowls, a wordless humming choir, natural water),
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

# The reveal should feel sacred: temple handbells, singing bowls, a wordless humming choir and deep
# temple bells; the water stays natural.
# cue: (source id, start s, end s, high-pass Hz, fade-in ms, fade-out ms, target rms, peak cap, what it is)
CUES = {
    # Each falling star: a short ring of small temple handbells; four different moments of the recording.
    "star-1": ("271627", 0.60, 1.60, 200, 8, 380, .07, .3, "temple handbells, star 1"),
    "star-2": ("271627", 2.95, 3.90, 200, 8, 380, .07, .3, "temple handbells, star 2"),
    "star-3": ("271627", 5.05, 6.00, 200, 8, 380, .07, .3, "temple handbells, star 3"),
    "star-4": ("271627", 5.95, 6.95, 200, 8, 380, .07, .3, "temple handbells, star 4"),
    # The card hits the lake; it settles into its slot.
    "splash": ("398039", 0.00, 1.60, 80, 2, 300, .12, .5, "small water splash"),
    "pop": ("776443", 0.00, 0.41, 120, 2, 80, .08, .35, "soft bubble pop"),
    # Before the gold and diamond stars: a wordless choir hums a held chord.
    "choir": ("763890", 0.00, 7.20, 90, 60, 1800, .1, .42, "crowd humming one chord (wordless)"),
    # Opening: bronze a plain card flip; gold a struck singing bowl; diamond a rubbed bowl rising
    # into a deep temple bell; the whole hero steps out on a temple bell.
    "flip": ("84322", 0.00, 0.80, 120, 2, 150, .10, .45, "card flip"),
    "gold": ("59159", 0.00, 6.00, 70, 2, 2200, .11, .48, "struck singing bowl"),
    "swell": ("417115", 14.20, 19.30, 90, 900, 600, .11, .45, "singing bowl rim rub, rising"),
    "bell": ("131348", 0.00, 6.50, 40, 2, 2500, .13, .5, "deep temple bell, Daitokuji"),
    "hero": ("668647", 0.00, 7.50, 40, 2, 2800, .13, .5, "temple bell"),
}
# Beds that loop under the screen: a sustained singing bowl (harmonic) and the night lake.
BEDS = {
    "ambience": ("445095", 26.0, 150, .03, .2, "night lake: crickets, frogs, water"),
    "drone": ("573805", 24.0, 80, .05, .25, "sustained rubbed singing bowl"),
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
    y = np.zeros_like(x)
    for ch in range(x.shape[1]):
        x1 = x2 = y1 = y2 = 0.0
        col = x[:, ch]; out = y[:, ch]
        for i, v in enumerate(col):
            o = b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
            x2, x1, y2, y1 = x1, v, y1, o; out[i] = o
    return y


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
for name, (sid, start, end, hp, fin, fout, rms, peak, what) in CUES.items():
    path, meta = source(sid)
    x = decode(path)[int(start * RATE):int(end * RATE)]
    x = level(fades(highpass(x, hp), fin, fout), rms, peak)
    out = write(x, name)
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(x) / RATE, 3), "what": what,
                      "source": {"id": sid, "title": meta["title"], "author": meta["author"], "license": meta["license"], "url": meta["source_url"], "sha256": meta["sha256"]},
                      "excerpt": [start, end], "peak": round(float(np.abs(x).max()), 3), "rms": round(float(np.sqrt((x ** 2).mean())), 3)}

# Beds: a calm stretch of each recording, made loopable by a 1.5 s crossfade of its own ends.
for name, (sid, length, hp, rms, peak, what) in BEDS.items():
    path, meta = source(sid)
    x = decode(path, 2); start = steadiest(x, length + 1.5)
    x = highpass(x[start:start + int((length + 1.5) * RATE)], hp)
    xf = int(1.5 * RATE); ramp = np.linspace(0, 1, xf)[:, None]
    loop = x[:-xf].copy(); loop[:xf] = x[:xf] * ramp + x[-xf:] * (1 - ramp)
    loop = level(loop, rms, peak)
    out = write(loop, name)
    manifest[name] = {"file": out.relative_to(ROOT).as_posix(), "duration": round(len(loop) / RATE, 3), "what": what, "loop": True,
                      "source": {"id": sid, "title": meta["title"], "author": meta["author"], "license": meta["license"], "url": meta["source_url"], "sha256": meta["sha256"]},
                      "excerpt": [round(start / RATE, 2), round(start / RATE + length + 1.5, 2)], "peak": round(float(np.abs(loop).max()), 3), "rms": round(float(np.sqrt((loop ** 2).mean())), 3)}
(OUT / "summon-sounds.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
for k, v in manifest.items():
    print(f"{k:9} {v['duration']:6.2f}s peak {v['peak']:.2f} rms {v['rms']:.3f}  #{v['source']['id']} {v['what']}")
