"""Board frames whose corner ornaments reached into the gem opening (owner 10/11: "góc dưới bị lỗi"; cut_premium.py cleared
the opening, so the ornament was cut along a straight line). Each is redrawn from <season>/board-frame-ref.png (a
first redraw that kept the frame's size and cleared most corners) with the lower-right ornament smaller and moved out.
Asking for every corner ornament to move out made the mascots hang further off the board, wider than a phone.

  python fix_board.py <season> [<season> ...]
"""
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
GEN = 'C:/Users/dungc/.claude/skills/generate2dsprite/scripts/codex_image_gen.py'
CORNERS = {
    'mika': 'the small fox-mask ornament with short red tassels',
    'yuki': 'the snowflake charm with blue tassels',
    'nori': 'the green shield emblem with the golden tree and its pale leaves',
    'lumi': 'the golden star charm with the violet gem',
    'noct': 'the soul lantern and its ring',
}
PROMPT = """Reference image 1 is a square ornate frame around an empty square opening filled with magenta. Redraw it EXACTLY: the same design, style, colours, band, mascot and ornaments, every one at the same size and the same place on the canvas, with ONE change at the lower-right corner only: {corners} there is drawn about 25 percent smaller and shifted diagonally down and to the right, so it sits on the band's OUTER corner and nothing of it reaches inside the band's inner edge. The opening's lower-right inner corner becomes a plain, sharp right angle: the inner edge of the right band and of the bottom band run straight and unbroken all the way into it. Every other part of the frame stays exactly as in reference image 1. The square opening is empty and filled with pure magenta. Everything stays inside the image with a margin.
Hand-painted fantasy mobile game UI, sculptural depth, crisp clean edges, no pixel art, no text, no letters. Solid flat pure magenta #FF00FF background around the artwork, generous margin, nothing touching the image edges. No magenta or pink inside the artwork.
"""


def main(seasons):
    jobs = []
    for s in seasons:
        d = HERE / s
        ref = d / 'board-frame-ref.png'
        if not ref.exists():
            (d / 'board-frame-raw.png').rename(ref)
            gj = d / 'board-frame-raw.png.gen.json'
            if gj.exists():
                gj.rename(d / 'board-frame-ref.png.gen.json')
        (d / 'board-frame-prompt.txt').write_text(PROMPT.format(corners=CORNERS[s]), encoding='utf-8')
        jobs.append(subprocess.Popen([sys.executable, GEN, '--prompt-file', str(d / 'board-frame-prompt.txt'),
                                      '--out', str(d / 'board-frame-raw.png'), '--ref', str(ref),
                                      '--model', 'gpt-6.1-sol', '--effort', 'low'], env=dict(os.environ)))
    for j in jobs:
        j.wait()


if __name__ == '__main__':
    main(sys.argv[1:])
