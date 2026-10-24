G=C:/Users/dungc/AppData/Local/Temp/claude/d--Project-Gemwoven/3eb0861d-1c9d-43a7-b472-681bd095a67e/scratchpad/nori
sh $G/rev.sh $1 $2 $3
python -c "
from PIL import Image
a=Image.open('$G/r-$1-$2.png'); b=Image.open('$G/rd-$1-$2.png'); b=b.resize((a.width, a.width*b.height//b.width))
o=Image.new('RGB',(a.width,a.height+b.height)); o.paste(a,(0,0)); o.paste(b,(0,a.height)); o.save('$G/rc-$1-$2.png')"
