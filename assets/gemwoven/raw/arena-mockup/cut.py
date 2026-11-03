"""Cut the Cúp Đấu Trường UI pieces (Codex sheets A/B, keyed by generate2dsprite) into assets/gemwoven/arena."""
import numpy as np
from PIL import Image
from scipy import ndimage
R='D:/Project/Gemwoven/assets/gemwoven/raw/arena-mockup/'
OUT='D:/Project/Gemwoven/assets/gemwoven/arena/'
def pieces(path,min_area=4000):
    im=Image.open(path).convert('RGBA');a=np.array(im)
    mask=a[...,3]>24
    lab,n=ndimage.label(ndimage.binary_dilation(mask,iterations=6))
    boxes=[]
    for sl in ndimage.find_objects(lab):
        h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
        if h*w>=min_area:boxes.append((sl[0].start,sl[1].start,sl[0].stop,sl[1].stop))
    boxes.sort(key=lambda b:(round(b[0]/150),b[1]))
    return im,boxes
def despill(c):
    arr=np.array(c).astype(int);r,g,b,al=arr[...,0],arr[...,1],arr[...,2],arr[...,3]
    m=(r-g>14)&(b-g>14)
    arr[...,0]=np.where(m,np.minimum(r,g+10),r);arr[...,2]=np.where(m,np.minimum(b,g+6),b)
    arr[...,3]=np.where(m&(al<200),(al*.6).astype(int),al)
    return Image.fromarray(arr.clip(0,255).astype('uint8'),'RGBA')
def save(im,box,name,maxw):
    y0,x0,y1,x1=box;c=despill(im.crop((x0,y0,x1,y1)));c=c.crop(c.getbbox())
    if c.width>maxw:c=c.resize((maxw,round(c.height*maxw/c.width)),Image.LANCZOS)
    c.save(OUT+name+'.webp',quality=92,method=6);print(name,c.size)
im,b=pieces(R+'proc-a/raw-sheet-clean.png');print(len(b),b)
for box,(name,w) in zip(b,[('cup-sign',1100),('ribbon',640),('frame-gold',384),('frame-silver',384),('frame-bronze',384),('mode-rack',1400)]):save(im,box,name,w)
im,b=pieces(R+'proc-b/raw-sheet-clean.png');print(len(b),b)
for box,(name,w) in zip(b,[('row',1400),('match',900),('slot',320)]):save(im,box,name,w)
