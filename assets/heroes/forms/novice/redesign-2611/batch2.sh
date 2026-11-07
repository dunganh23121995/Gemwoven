#!/bin/bash
# Hiro's plain redesign, second batch: showcase sheets (redraw_show.py), pictures (portraits/jobs.py), form 3 aura.
cd "$(dirname "$0")"
python redraw_show.py draw 1 idle swing scratch entrance
python redraw_show.py draw 2 idle map twirl entrance
python redraw_show.py draw 3 idle salute
python portraits/jobs.py
python ~/.claude/skills/generate2dsprite/scripts/codex_image_gen.py --prompt-file ../aura/prompt-used.txt --out ../aura/raw-sheet.png --ref ../aura/raw-ornate.png --ref form-3-master-magenta.png --model gpt-6.1-sol --effort low --codex-only > ../aura/gen.log 2>&1; echo aura $?
