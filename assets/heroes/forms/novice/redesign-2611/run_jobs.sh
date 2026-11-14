#!/bin/bash
# Redraws each old Hiro sheet in the approved plain look (two Codex jobs at a time). Since 12-13/11 the attack, hurt, run and
# skill sheets come from the clip route (clips/); only the cast sheets are left here (jobs.txt).
cd "$(dirname "$0")"
one(){ f=$1; a=$2; old=$3; c=$4; r=$5; n=f$f-$a
  python - "$old" "sheets/$n-old.png" <<'PY'
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');bg=Image.new('RGBA',im.size,(255,0,255,255));bg.alpha_composite(im);bg.convert('RGB').save(sys.argv[2])
PY
  size=$([ $c = $r ] && echo "square 1024x1024" || echo "landscape 1536x1024")
  cat > sheets/$n-prompt.txt <<P
Clean HD painterly chibi 2D RPG animation sheet, NOT pixel art.
Image 1 is HIRO's approved new look for this form: copy his face, messy brown hair, brown eyes, green scarf, outfit, boots and sword EXACTLY from Image 1 (plain, humble, muted earthy colours, no gold, no gems, no glow).
Image 2 is his current "$a" animation sheet: copy EXACTLY its layout ($c columns x $r rows of equal square cells, $size, read left to right then the next row), the number of frames, EVERY pose, the position and angle of every limb and of the sword, the body size and position inside every cell and the foot line. Redraw each frame of Image 2 with the look of Image 1; change nothing about the motion.
Remove every effect that Image 2 may contain: no glow, no sparkles, no flames, no slash trails, no light, no particles, no aura. Body and sword only.
Nothing crosses a cell edge. Uniform pure flat #FF00FF magenta background, no text, no labels, no borders, no grid lines, no floor, no shadows.
P
  python ~/.claude/skills/generate2dsprite/scripts/codex_image_gen.py --prompt-file sheets/$n-prompt.txt --out sheets/$n-raw.png --ref form-$f-master-magenta.png --ref sheets/$n-old.png --model gpt-6.1-sol --effort low --codex-only > sheets/$n.log 2>&1
  echo "$n $(grep -o '"verdict": "[a-z]*"' sheets/$n-raw.png.gen.json 2>/dev/null)"
}
export -f one
while read -r f a old c r; do
  one $f $a $old $c $r &
  while [ $(jobs -r | wc -l) -ge 2 ]; do sleep 5; done
done < jobs.txt
wait
