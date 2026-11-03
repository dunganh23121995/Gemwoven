"""Cut the keyed Sảnh Anh Hùng gear sockets and the route/stats medallions; despill pink rims (magenta-hued only, so violet stays)."""
import numpy as np
from PIL import Image
from scipy import ndimage
R='D:/Project/Gemwoven/assets/gemwoven/raw/hall-gear/'
OUT='D:/Project/Gemwoven/assets/gemwoven/hall/'
def cut(sheet,names,order):
    im=np.array(Image.open(R+sheet).convert('RGBA')).astype(np.float32)
    alpha=im[...,3]>8
    lab,n=ndimage.label(ndimage.binary_dilation(alpha,iterations=6))
    objs=[s for s in ndimage.find_objects(lab) if (s[0].stop-s[0].start)*(s[1].stop-s[1].start)>20000]
    objs.sort(key=order)
    print(sheet,len(objs),[(s[1].start,s[0].start,s[1].stop-s[1].start,s[0].stop-s[0].start) for s in objs])
    for name,s in zip(names,objs):
        a=im[s].copy();al=a[...,3]>8
        band=al&~ndimage.binary_erosion(al,iterations=6)
        r,g,b=a[...,0],a[...,1],a[...,2]
        pink=band&(r-g>40)&(b-g>40)&(np.abs(r-b)<45)
        lum=(r+g+b)/3
        for c,k in ((0,1.25),(1,.95),(2,.8)):a[...,c]=np.where(pink,np.clip(lum*k,0,255),a[...,c])
        pad=4;out=np.zeros((a.shape[0]+2*pad,a.shape[1]+2*pad,4),np.float32);out[pad:-pad,pad:-pad]=a
        Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA').save(OUT+name+'.webp',quality=92,method=6)
        print(name,out.shape[1],out.shape[0],int(pink.sum()))
cut('proc-sockets/flood-clean.png',['socket-none','socket-uncommon','socket-rare','socket-epic','socket-legendary','socket-divine'],lambda s:(s[0].start//300,s[1].start))
cut('proc-medallions/raw-sheet-clean.png',['medal-route','medal-stats','label-wood'],lambda s:s[1].start)
