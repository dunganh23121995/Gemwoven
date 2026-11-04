"""Cut the keyed Dẫn Đường pieces sheet (pieces-raw.png -> proc-pieces/raw-sheet-clean.png) into seven webp pieces;
despill pink rims (magenta-hued pixels in the outer band only)."""
import numpy as np
from PIL import Image
from scipy import ndimage
R='D:/Project/Gemwoven/assets/gemwoven/raw/guide/'
OUT='D:/Project/Gemwoven/assets/gemwoven/guide/'
im=np.array(Image.open(R+'proc-pieces/raw-sheet-clean.png').convert('RGBA')).astype(np.float32)
alpha=im[...,3]>8
lab,n=ndimage.label(ndimage.binary_dilation(alpha,iterations=8))
objs=[s for s in ndimage.find_objects(lab) if (s[0].stop-s[0].start)*(s[1].stop-s[1].start)>4000]
# reading order: top row (plaque), then the middle row left->right, then the bottom row left->right
objs.sort(key=lambda s:(round(s[0].start/250),s[1].start))
print([(s[1].start,s[0].start,s[1].stop-s[1].start,s[0].stop-s[0].start) for s in objs])
names=['plaque','count','tab','ring','glove-left','glove-down','swipe']
for name,s in zip(names,objs):
    a=im[s].copy();a[...,3]*=(lab[s]==lab[s][tuple(np.argwhere(lab[s]>0)[0])]) if False else 1
    al=a[...,3]>8
    band=al&~ndimage.binary_erosion(al,iterations=8)
    if name in('ring','swipe'):band=al  # glow pieces: their whole body may carry spill
    r,g,b=a[...,0],a[...,1],a[...,2]
    pink=band&(r-g>45)&(b-g>45)&(np.abs(r-b)<70)
    lum=(r+g+b)/3
    for c,k in ((0,1.25),(1,.95),(2,.7)):a[...,c]=np.where(pink,np.clip(lum*k,0,255),a[...,c])
    pad=4;out=np.zeros((a.shape[0]+2*pad,a.shape[1]+2*pad,4),np.float32);out[pad:-pad,pad:-pad]=a
    Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA').save(OUT+name+'.webp',quality=92,method=6)
    print(name,out.shape[1],out.shape[0],int(pink.sum()))
# The ring's and the swipe's soft glow was painted over magenta: unmix it (pixel = t*amber + (1-t)*magenta, t from green).
for name in ('ring','swipe'):
    a=np.array(Image.open(OUT+name+'.webp').convert('RGBA')).astype(np.float32)
    r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    m=(al>0)&(b>g*0.85)&(r>g+50)
    t=np.clip(g/200,0,1)
    for c,v in ((0,255),(1,200),(2,80)):a[...,c]=np.where(m,v,a[...,c])
    a[...,3]=np.where(m,al*t,al)
    Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA').save(OUT+name+'.webp',quality=92,method=6)
    print('unmixed',name,int(m.sum()))
