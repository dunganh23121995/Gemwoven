#!/bin/bash
# The 8-frame resting loops, drawn as two 2x2 halves (frames 1-4, 5-8) in the plain look, two Codex jobs at a time.
cd "$(dirname "$0")"
one(){ f=$1; old=$2; h=$3; n=f$f-idle-$h
  python - "$old" "$h" "sheets/$n-old.png" <<'PY'
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');h=int(sys.argv[2]);half=im.crop((0,(h-1)*im.height//2,im.width,h*im.height//2))
bg=Image.new('RGBA',half.size,(255,0,255,255));bg.alpha_composite(half);bg.convert('RGB').resize((1024,1024)).save(sys.argv[3])
PY
  cat > sheets/$n-prompt.txt <<P
Clean HD painterly chibi 2D RPG animation sheet, NOT pixel art.
Image 1 is HIRO's approved new look for this form: copy his face, messy brown hair, brown eyes, green scarf, outfit, boots and sword EXACTLY from Image 1 (plain, humble, muted earthy colours, no gold, no gems, no glow).
Image 2 is four frames of his current resting loop: copy EXACTLY its layout (2 columns x 2 rows of equal square cells, square 1024x1024, read left to right then the next row), EVERY pose, the position of every limb, the sword, the scarf and cloth, the body size and position inside every cell and the foot line. Redraw each frame of Image 2 with the look of Image 1; change nothing about the motion. His face stays the same in every frame.
No effects, no glow, no particles. Nothing crosses a cell edge. Uniform pure flat #FF00FF magenta background, no text, no labels, no borders, no grid lines, no floor, no shadows.
P
  python ~/.claude/skills/generate2dsprite/scripts/codex_image_gen.py --prompt-file sheets/$n-prompt.txt --out sheets/$n-raw.png --ref form-$f-master-magenta.png --ref sheets/$n-old.png --model gpt-6.1-sol --effort low --codex-only > sheets/$n.log 2>&1
  echo "$n $(grep -o '"verdict": "[a-z]*"' sheets/$n-raw.png.gen.json 2>/dev/null)"
}
for job in "1 old/f1-idle.webp 1" "1 old/f1-idle.webp 2" "2 old/f2-idle.webp 1" "2 old/f2-idle.webp 2" "3 old/f3-idle.webp 1" "3 old/f3-idle.webp 2"; do
  one $job &
  while [ $(jobs -r | wc -l) -ge 2 ]; do sleep 5; done
done
wait
