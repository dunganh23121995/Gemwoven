# rev.sh <form> <name> [src: cache|asset]: zoom + diff of a showcase sheet
S=C:/Users/dungc/AppData/Local/Temp/claude/d--Project-Gemwoven/3eb0861d-1c9d-43a7-b472-681bd095a67e/scratchpad/nori
cd /d/Project/Gemwoven
F=$1; N=$2
if [ "$3" = cache ]; then W=.build-cache/fidgets/assets_heroes_forms_earth_form-${F}_showcase/$N/fidget.webp; else W=assets/heroes/forms/earth/form-$F/showcase/$N.webp; fi
python $S/zoom.py $W $S/r-$F-$N.png 2 4 20,40,364,350 0.9
python $S/diff.py $W $S/rd-$F-$N.png
