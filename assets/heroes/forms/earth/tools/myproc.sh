#!/bin/sh
# myproc.sh <dir rel> <name> [extra stabilize flags...]: like fidget.py proc for a showcase action but placing every
# frame exactly like the last one (--no-refine: Codex draws all cells on one template), so a moving shield or debris
# near the feet cannot pull the placement. Writes .build-cache/fidgets/<id>/<name>/fidget.webp
cd /d/Project/Gemwoven
D=$1; N=$2; shift 2
W=.build-cache/fidgets/$(echo $D | tr / _)/$N
rm -rf $W/stable
python assets/gemwoven/elites/stabilize_idle.py $D/master.png $W/stable $W/cells/idle-1.png $W/cells/idle-2.png $W/cells/idle-3.png $W/cells/idle-4.png $W/cells/idle-5.png $W/cells/idle-6.png $W/cells/idle-7.png $W/cells/idle-8.png --same-transform --no-refine --grow 3 --cell 384 --fill .55 --open 1 --min-area 20 "$@"
cp $W/stable/idle.webp $W/fidget.webp
