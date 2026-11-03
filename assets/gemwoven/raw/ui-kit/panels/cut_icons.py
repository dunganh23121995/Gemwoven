import sys, numpy as np
from PIL import Image
from scipy import ndimage
src='assets/gemwoven/raw/ui-kit/panels/proc-icons2/raw-sheet-clean.png'
im=Image.open(src).convert('RGBA');a=np.array(im)
print(im.size)
alpha=a[...,3]>24
lab,n=ndimage.label(ndimage.binary_dilation(alpha,iterations=6))
objs=ndimage.find_objects(lab)
boxes=[]
for i,s in enumerate(objs):
    h=s[0].stop-s[0].start;w=s[1].stop-s[1].start
    if h*w<4000: continue
    boxes.append((s[0].start,s[1].start,s[0].stop,s[1].stop,i+1))
H=a.shape[0]
boxes.sort(key=lambda b:(0 if (b[0]+b[2])/2<H/2 else 1,b[1]))
names=['emblem-trophy','emblem-calendar','emblem-coins','emblem-swords','helm','swords','skull','stairs','gift','trophy','farm','hourglass']
print(len(boxes))
for nm,(y0,x0,y1,x1,li) in zip(names,boxes):
    piece=a[y0:y1,x0:x1].copy()
    mask=(lab[y0:y1,x0:x1]==li)
    piece[~mask]=0
    # despill pink: where r and b high relative to g on semi-transparent edge
    r,g,b,al=[piece[...,k].astype(int) for k in range(4)]
    spill=(r>g+40)&(b>g+40)
    piece[spill&(al<250),3]=0
    m=np.minimum(r,b);
    fix=spill&(al>=250)
    piece[fix,0]=np.minimum(r[fix],g[fix]+40);piece[fix,2]=np.minimum(b[fix],g[fix]+20)
    out=Image.fromarray(piece)
    bb=out.getbbox();out=out.crop(bb)
    w,h=out.size;s=min(1,192/max(w,h))
    out=out.resize((max(1,int(w*s)),max(1,int(h*s))),Image.LANCZOS)
    out.save('assets/gemwoven/ui-kit/icon-%s.webp'%nm,quality=92,method=6)
    print(nm,out.size)
