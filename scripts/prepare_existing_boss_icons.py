"""Extract the accepted idle frame for the four existing bosses, for map pins."""
from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parents[1]
items={}
for boss in ['earth','fire','ice','lightning']:
    source=root/f'assets/reimagined/bosses/{boss}/idle/frame-00.png'
    with Image.open(source).convert('RGBA') as im:
        crop=im.crop(im.getchannel('A').getbbox())
        factor=min(400/crop.width,390/crop.height)
        crop=crop.resize((round(crop.width*factor),round(crop.height*factor)),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(crop,((512-crop.width)//2,461-crop.height))
        out=root/f'assets/gemwoven/items/boss-{boss}.webp'
        canvas.save(out,'WEBP',quality=93,alpha_quality=100)
        items['boss-'+boss]={'file':f'items/boss-{boss}.webp','width':512,'height':512,'transparent':True,'sourceFrame':source.relative_to(root).as_posix()}
(root/'assets/gemwoven/existing-boss-items.json').write_text(json.dumps({'items':items},indent=2),encoding='utf-8')
print('Extracted four existing boss icons from accepted animation frames.')
