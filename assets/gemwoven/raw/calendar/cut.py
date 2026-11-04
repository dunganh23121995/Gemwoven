"""Cut the keyed Lịch 28 ngày sheet (pieces-raw.png -> proc-pieces/raw-sheet-clean.png) into eight webp pieces and
unmix the magenta from glows and soft stamp edges (pixel = t*colour + (1-t)*magenta)."""
import numpy as np
from PIL import Image
from scipy import ndimage
R='D:/Project/Gemwoven/assets/gemwoven/raw/calendar/'
OUT='D:/Project/Gemwoven/assets/gemwoven/calendar/'
im=np.array(Image.open(R+'proc-pieces/raw-sheet-clean.png').convert('RGBA')).astype(np.float32)
lab,n=ndimage.label(ndimage.binary_dilation(im[...,3]>8,iterations=8))
objs=[s for s in ndimage.find_objects(lab) if (s[0].stop-s[0].start)*(s[1].stop-s[1].start)>4000]
objs.sort(key=lambda s:(round(s[0].start/300),s[1].start))
names=['tray','cell','cell-claimed','cell-today','cell-dim','check','cross','lock']
assert len(objs)==8,[(s[1].start,s[0].start) for s in objs]
for name,s in zip(names,objs):
    a=im[s].copy();r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    pink=(al>0)&(r>g+40)&(b>g+40)&(np.abs(r-b)<90)          # magenta-tinted pixels left by the key
    if name=='cell-today':pink|=(al>0)&(b>g*0.85)&(r>g+50)   # its amber glow was painted over magenta
    if name in ('check','cross'):
        # stamps: keep the ink colour, fade by how much magenta remains
        t=np.clip(1-(np.minimum(r,b)-g)/255,0,1);base={'check':(40,140,50),'cross':(130,80,50)}[name]
        for c,v in enumerate(base):a[...,c]=np.where(pink,v,a[...,c])
        a[...,3]=np.where(pink,al*t*0.9,al)
    else:
        t=np.clip(g/200,0,1)
        for c,v in enumerate((255,200,90)):a[...,c]=np.where(pink,v,a[...,c])
        a[...,3]=np.where(pink,al*t,al)
    pad=4;out=np.zeros((a.shape[0]+2*pad,a.shape[1]+2*pad,4),np.float32);out[pad:-pad,pad:-pad]=a
    Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA').save(OUT+name+'.webp',quality=92,method=6)
    print(name,out.shape[1],out.shape[0],int(pink.sum()))
