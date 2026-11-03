"""Place the shopkeeper sprite on the plate where the painted girl stood (stage 941x1672 units); writes a comparison."""
import sys
from PIL import Image
sx,sy,k,cut=map(float,sys.argv[1:5])   # top-left in stage units, stage units per sprite px, counter line (stage y)
plate=Image.open('plate-raw.png').convert('RGB').crop((80,0,944,1536)).resize((941,1672),Image.LANCZOS).convert('RGBA')
old=Image.open('../../backgrounds/shop-calm.webp').convert('RGBA')
spr=Image.open('proc/raw-sheet-clean.png').convert('RGBA')
spr=spr.resize((round(spr.width*k),round(spr.height*k)),Image.LANCZOS)
h=int(cut-sy);spr=spr.crop((0,0,spr.width,min(spr.height,h)))
comp=plate.copy();comp.alpha_composite(spr,(round(sx),round(sy)))
box=(220,450,640,800)
out=Image.new('RGB',(840*2,700));out.paste(old.crop(box).resize((840,700)).convert('RGB'),(0,0));out.paste(comp.crop(box).resize((840,700)).convert('RGB'),(840,0))
out.save(sys.argv[5] if len(sys.argv)>5 else 'cmp.png')
