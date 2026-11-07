#!/bin/bash
# Draws Hiro's plain FX strips (fx_prompts_plain.py prompts) with the form master as reference; two at a time.
cd "$(dirname "$0")"
M=../../../heroes/forms/novice/redesign-2611
one(){ n=$1; f=$2
  python ~/.claude/skills/generate2dsprite/scripts/codex_image_gen.py --prompt-file $n/prompt-used.txt --out $n/raw-sheet.png --ref $M/form-$f-master-magenta.png --model gpt-6.1-sol --effort low --codex-only > $n/gen.log 2>&1
  echo "$n $(grep -o '"verdict": "[a-z]*"' $n/raw-sheet.png.gen.json 2>/dev/null)"
}
for job in "slash 1" "burst 1" "aura 1" "f2-gale 2" "f2-slash 2" "f2-cross 2" "f3-gems 3" "f3-crescent 3" "f3-crest 3"; do
  one $job &
  while [ $(jobs -r | wc -l) -ge 2 ]; do sleep 5; done
done
wait
