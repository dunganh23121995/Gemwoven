"""Cut the keyed Nâng Phẩm pieces sheet into icon + plaque, despill pink rims (magenta-hued only, so purple stays)."""
import numpy as np
from PIL import Image
from scipy import ndimage
R='D:/Project/Gemwoven/assets/gemwoven/raw/forge-rarity/'
im=np.array(Image.open(R+'proc-pieces/raw-sheet-clean.png').convert('RGBA')).astype(np.float32)
alpha=im[...,3]>8
lab,n=ndimage.label(ndimage.binary_dilation(alpha,iterations=6))
objs=sorted([(s[1].start,s) for s in ndimage.find_objects(lab)],key=lambda t:t[0])
big=[s for x,s in objs if (s[0].stop-s[0].start)*(s[1].stop-s[1].start)>20000]
print(len(big),[ (s[1].start,s[1].stop,s[0].start,s[0].stop) for s in big])
for name,s in zip(['rarityup-icon','plaque'],big):
    a=im[s].copy();al=a[...,3]>8
    band=al&~ndimage.binary_erosion(al,iterations=6)
    r,g,b=a[...,0],a[...,1],a[...,2]
    pink=band&(r-g>40)&(b-g>40)&(np.abs(r-b)<45)
    lum=(r+g+b)/3
    for c,k in ((0,1.25),(1,.95),(2,.8)):a[...,c]=np.where(pink,np.clip(lum*k,0,255),a[...,c])
    pad=4;out=np.zeros((a.shape[0]+2*pad,a.shape[1]+2*pad,4),np.float32);out[pad:-pad,pad:-pad]=a
    Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA').save(f'D:/Project/Gemwoven/assets/gemwoven/forge/{name}.webp',quality=92,method=6)
    print(name,out.shape,int(pink.sum()))
