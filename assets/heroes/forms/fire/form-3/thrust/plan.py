# Thrust basic attack (owner 06/11: "không làm tư thế chém nữa, chuyển sang đánh thường là chọc"; colours must match the
# resting pose). One 1536x1024 canvas per pose: the approved resting pose placed big (rest.png), and for every other
# pose that canvas with guide marks (cyan shaft at the resting length, yellow rings: lower = left hand at the butt,
# upper = right hand where it holds the glaive at rest) for Codex to redraw from. Not art: marks only.
import json, math
from PIL import Image, ImageDraw
M = Image.open('combat-idle/master-512.png').convert('RGBA')
F, BODY_X, SOLE = 1.435, 430, 980            # master px -> canvas px; her body centre and soles on the canvas
P = lambda x, y: (BODY_X + (x - 250) * F, SOLE - (475 - y) * F)
L, REAR, FRONT = 415 * F, .05, .38            # the resting glaive (master: butt to blade tip 415 px)
rest = Image.new('RGB', (1536, 1024), (255, 0, 255))
big = M.resize((round(512 * F), round(512 * F)), Image.LANCZOS)
rest.paste(big, (round(BODY_X - 250 * F), round(SOLE - 475 * F)), big); rest.save('thrust/rest.png')
# right hand (master coordinates) and shaft angle per pose
POSES = {'tilt': ((332, 290), 45), 'guard': ((330, 300), 5), 'cock': ((290, 318), 3), 'mid': ((372, 302), 2), 'thrust': ((420, 296), 2)}
plan = {}
for name, (rh, deg) in POSES.items():
    hx, hy = P(*rh); ux, uy = math.cos(math.radians(deg)), -math.sin(math.radians(deg))
    bx, by = hx - FRONT * L * ux, hy - FRONT * L * uy
    Q = lambda t: (bx + t * L * ux, by + t * L * uy)
    plan[name] = {'butt': Q(0), 'left': Q(REAR), 'right': Q(FRONT), 'tip': Q(1), 'deg': deg}
    for base in ['rest']:
        im = Image.open(f'thrust/{base}.png').convert('RGB'); d = ImageDraw.Draw(im)
        d.line([Q(0), Q(.6)], fill=(0, 230, 255), width=7)
        for t, r in [(REAR, 16), (FRONT, 20)]:
            x, y = Q(t); d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 230, 0), width=6)
        x, y = Q(0); d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(0, 255, 0))
        x, y = Q(1); d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
        im.save(f'thrust/marks-{name}.png')
json.dump({'L': L, 'poses': plan}, open('thrust/plan.json', 'w'), indent=1)
print({k: [round(v) for v in p['tip']] for k, p in plan.items()})
