"""Nạp page pieces (Codex mockup round, assets/gemwoven/raw/topup): cut the keyed pieces sheet into assets/gemwoven/topup
by connected components, named by position (three rows of art, coin piles under the ribbon and plate)."""
import json, numpy as np
from PIL import Image
from scipy import ndimage
ROOT='D:/Project/Gemwoven/'; RAW=ROOT+'assets/gemwoven/raw/topup/'; OUT=ROOT+'assets/gemwoven/topup/'
def despill(a):
    a=a.astype(int); r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    edge=ndimage.binary_dilation(al<200,iterations=3)
    m=(r-g>14)&(b-g>14)&edge
    a[...,0]=np.where(m,np.minimum(r,g+8),r); a[...,2]=np.where(m,np.minimum(b,g+4),b)
    a[...,3]=np.where(m&(al<250),(al*0.5).astype(int),al)
    return a.clip(0,255).astype('uint8')
im=np.array(Image.open(RAW+'proc-pieces/raw-sheet-clean.png').convert('RGBA'))
H,W=im.shape[:2]; mask=im[...,3]>40
# join a piece's loose bits (gems beside a chest, leaves) before labelling
lab,n=ndimage.label(ndimage.binary_closing(ndimage.binary_dilation(mask,iterations=6),iterations=2))
objs=ndimage.find_objects(lab); pieces=[]
for i,sl in enumerate(objs):
    m=(lab[sl]==i+1)&mask[sl]
    if m.sum()<800: continue
    pieces.append((sl,i+1))
def name(sl):
    cy=(sl[0].start+sl[0].stop)/2/H; cx=(sl[1].start+sl[1].stop)/2/W; col=int(cx*3)
    if cy<0.27: return ['pack-1','pack-2','pack-3'][col]
    if cy<0.55: return ['pack-4','pack-5','pack-6'][col]
    if col==0: return None  # portrait card: unused, the mockup chose wide cards (card-raw.png)
    if cy<0.75: return ['card','ribbon','price-plate'][col]
    x=cx; return 'coins-1' if x<0.48 else 'coins-2' if x<0.72 else 'coins-3'
meta={}
for sl,idx in pieces:
    nm=name(sl)
    if nm is None: continue
    m=(lab==idx)&mask
    ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    crop=im[y0:y1,x0:x1].copy(); crop[...,3]=np.where(m[y0:y1,x0:x1],crop[...,3],0)
    crop=despill(crop)
    hole=(crop[...,0]>170)&(crop[...,2]>170)&(crop[...,1]<110); crop[...,3]=np.where(hole,0,crop[...,3])
    out=Image.fromarray(crop)
    if nm.startswith('pack') or nm.startswith('coins'): out.thumbnail((360,360),Image.LANCZOS)
    out.save(OUT+nm+'.webp',quality=92,method=6); meta[nm]=out.size; print(nm,out.size)
json.dump(meta,open(RAW+'slice-meta.json','w'),indent=1)

# Landscape card frame and its bottom strip (card-raw.png, drawn after the mockup showed wide cards), keyed to proc-card.
im=np.array(Image.open(RAW+'proc-card/raw-sheet-clean.png').convert('RGBA'));mask=im[...,3]>40
lab,n=ndimage.label(ndimage.binary_dilation(mask,iterations=4))
for i,sl in enumerate(ndimage.find_objects(lab)):
    m=(lab==i+1)&mask
    if m.sum()<5000: continue
    ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    crop=im[y0:y1,x0:x1].copy();crop[...,3]=np.where(m[y0:y1,x0:x1],crop[...,3],0);crop=despill(crop)
    nm='card-wide' if (y1-y0)>200 else 'total-strip'
    out=Image.fromarray(crop);out.thumbnail((720,720),Image.LANCZOS);out.save(OUT+nm+'.webp',quality=92,method=6);print(nm,out.size)
