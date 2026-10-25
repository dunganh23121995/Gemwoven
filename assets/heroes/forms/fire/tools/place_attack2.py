"""Place a 3x2 magenta ImageGen attack sheet at a reference sheet's body scale and boot position.
Usage: python place_attack2.py <raw.png> <reference.webp> <out> <scale>"""
import sys,numpy as np
from pathlib import Path
from PIL import Image
from scipy import ndimage
sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from generate2dsprite import remove_bg_magenta
def boots(img):
    a=np.asarray(img)[...,3]>100;ys=np.nonzero(a.any(1))[0];sole=ys.max();h=sole-ys.min()
    band=a[sole-int(h*.07):sole+1];lab,k=ndimage.label(band)
    comps=sorted([(ndimage.sum(band,lab,i),ndimage.center_of_mass(band,lab,i)[1]) for i in range(1,k+1)],reverse=True)[:2]
    return [round(c[1]) for c in sorted(comps,key=lambda c:c[1])],int(sole)
raw,old,out,scale=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4])
def cells(im,cols,rows):
    cw,ch=im.width//cols,im.height//rows
    return [im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)) for r in range(rows) for c in range(cols)]
oldf=cells(Image.open(old).convert('RGBA'),3,2)
ob=[boots(f) for f in oldf];print('old',ob)
ref_x=sum(ob[0][0])/2;ref_sole=ob[0][1]
clean=remove_bg_magenta(Image.open(raw).convert('RGBA'),100,150)
sheet=Image.new('RGBA',(768,512),(0,0,0,0))
for i,c in enumerate(cells(clean,3,2)):
    a=np.asarray(c)[...,3]>10;lab,k=ndimage.label(a)
    if k>1:
        sizes=ndimage.sum(a,lab,range(1,k+1));keep=np.isin(lab,[j+1 for j,s in enumerate(sizes) if s>=40])
        arr=np.asarray(c).copy();arr[...,3]*=keep;c=Image.fromarray(arr)
    c=c.crop(c.getbbox());c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS)
    (bx,sole)=boots(c);fx=sum(bx)/2
    cell=Image.new('RGBA',(256,256),(0,0,0,0))
    cell.alpha_composite(c,(round(ref_x-fx),round(ref_sole-sole)))
    print(i,'bbox',cell.getbbox(),'boots',boots(cell))
    sheet.alpha_composite(cell,((i%3)*256,(i//3)*256))
sheet.save(out,lossless=True) if out.endswith('.webp') else sheet.save(out)
