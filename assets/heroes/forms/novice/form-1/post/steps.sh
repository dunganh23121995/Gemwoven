#!/bin/bash
# How Tân's (novice) form-1 sheets were finished after Codex drew them (run from the repo root).
# The helper scripts here only pick master pixels or place whole frames; they never draw, warp or scale.
F=assets/gemwoven/elites/fidget.py; P=assets/heroes/forms/novice/form-1/post
CI=assets/heroes/forms/novice/form-1/combat-idle; SC=assets/heroes/forms/novice/form-1/showcase
B=.build-cache/fidgets/assets_heroes_forms_novice_form-1_showcase

# A. combat idle (raw drawn by gpt-6.1-sol medium): rigid body, scarf free, chin edge + legs/sword held from the master
python $F proc $CI idle --as-is --core=3 --free=0.15,0.4,0.41,0.68
python $P/lock.py .build-cache/fidgets/assets_heroes_forms_novice_form-1_combat-idle/idle/fidget.webp "116,104,170,145;0,168,256,256"
python $F accept $CI idle "Nghỉ"; python assets/heroes/forms/combat_idle.py package novice 1

# B. showcase idle (raw-idle.png, gpt-6.1-sol low): master everywhere, Codex drawing only for the scarf and the hair tuft
python $F proc $SC idle --core=3 --cell=384 --fill=.55 --free=0.25,0.42,0.385,0.73 && cp $B/idle/fidget.webp /tmp/idle-core3.webp
python $F proc $SC idle --cell=384 --fill=.55 && cp $B/idle/fidget.webp /tmp/idle-whole.webp
python $P/compose.py /tmp/idle-core3.webp /tmp/idle-whole.webp $B/idle/fidget.webp "95,150,154,282;154,199,164,282;164,228,182,282;198,108,238,138"
python $F accept $SC idle "Nghỉ"

# swing + scratch (gpt-6.1-sol medium): whole frames, legs locked
python $F proc $SC swing --whole --lock-legs --keep --cell=384 --fill=.55 && python $F accept $SC swing "Vung kiếm tập" --whole
python $F proc $SC scratch --whole --lock-legs --keep --cell=384 --fill=.55 && python $F accept $SC scratch "Gãi đầu cười ngượng" --whole

# entrance (raw-entrance.png from prompt-entrance.txt, gpt-6.1-sol high, drawn with codex_image_gen.py directly):
# whole frames centred on the boots, then the run-in frames placed left so he runs in from the side; frame 8 = resting master
python $F proc $SC entrance --all-whole --lock-legs --keep --cell=384 --fill=.55
python $P/shift.py $B/entrance/fidget.webp 1:-10,-70 2:-117,-5 3:-29,8 4:-16 5:-16,-9
python -c "from PIL import Image; c=384; e=Image.open('$B/entrance/fidget.webp').convert('RGBA'); e.paste(Image.open('$SC/idle.webp').convert('RGBA').crop((0,0,c,c)),(c,3*c)); e.save('$B/entrance/fidget.webp',lossless=True,method=6)"
python $F accept $SC entrance "Chạy tới phanh lại"
