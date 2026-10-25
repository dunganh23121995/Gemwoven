"""Place a single redrawn attack pose into frame 4 of the form-2 attack sheet at the sheet's body scale.
Usage: python place4.py <raw-pose.png> <old-raw-frame4-cell.png> <sheet in> <sheet out>"""
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
def boot_sole(img):
    a=np.asarray(img)[...,3]>100
    lab,k=ndimage.label(a);main=np.argmax(ndimage.sum(a,lab,range(1,k+1)))+1;a=lab==main
    ys=np.nonzero(a.any(1))[0]
    rows=[y for y in ys if ndimage.label(a[y])[1]>=2 and (np.nonzero(a[y])[0].max()-np.nonzero(a[y])[0].min())>a.shape[1]*.25]
    return ys[0],max(rows)
raw,oldcell,sin,sout=sys.argv[1:5]
new=remove_bg_magenta(Image.open(raw).convert('RGBA'),100,150)
old=remove_bg_magenta(Image.open(oldcell).convert('RGBA'),100,150)
tn,sn=boot_sole(new);to,so=boot_sole(old);s=(so-to)/(sn-tn)*0.48
c=new.crop(new.getbbox());c=c.resize((round(c.width*s),round(c.height*s)),Image.Resampling.LANCZOS)
sheet=Image.open(sin).convert('RGBA');bx,sole=boots(sheet.crop((0,0,256,256)));rx=sum(bx)/2
a=np.asarray(c)[...,3]>100;_,s2=boot_sole(c)
band=a[s2-6:s2+1];lab,k=ndimage.label(band);cm=sorted(ndimage.center_of_mass(band,lab,i)[1] for i in range(1,k+1));fx=(cm[0]+cm[-1])/2
cell=Image.new('RGBA',(256,256),(0,0,0,0));cell.alpha_composite(c,(round(rx-fx),round(sole-s2)))
sheet.paste(Image.new('RGBA',(256,256),(0,0,0,0)),(0,256));sheet.paste(cell,(0,256))
print('scale',round(s,4),'bbox',cell.getbbox())
sheet.save(sout,lossless=True,quality=100,method=6) if sout.endswith('.webp') else sheet.save(sout)
