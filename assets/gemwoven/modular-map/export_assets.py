"""Deterministic alpha-preserving exports from the preserved ImageGen sources."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent


def export(name, size):
    source = Image.open(ROOT / "raw" / f"{name}.png").convert("RGBA")
    if name == "bridge":
        source = source.crop(source.getchannel("A").point(lambda value: 255 if value > 16 else 0).getbbox())
        source.thumbnail((380, 80), Image.Resampling.LANCZOS)
    else:
        source.thumbnail(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", size)
    output.alpha_composite(source, ((size[0] - source.width) // 2, (size[1] - source.height) // 2))
    output.putalpha(output.getchannel("A").point(lambda value: 0 if value <= 4 else value))
    output.save(ROOT / f"{name}.png", optimize=True)
    output.save(ROOT / f"{name}.webp", lossless=True, exact=True)
    print(name, output.size, "alpha bounds", output.getchannel("A").getbbox(),
          "alpha extrema", output.getchannel("A").getextrema())


if __name__ == "__main__":
    export("platform-a", (512, 320))
    if (ROOT / "raw" / "bridge.png").exists():
        export("bridge", (400, 100))
