"""Second VIP pass (Codex review: wider reward rows, three tracks told apart by header and badge, light trays):
cut the pieces out of the keyed sheet-c (grid cells, connected components) into assets/gemwoven/vip-pass."""
import json, numpy as np
from PIL import Image
from scipy import ndimage
ROOT='D:/Project/Gemwoven/'; RAW=ROOT+'assets/gemwoven/raw/vip-pass/v2/'; OUT=ROOT+'assets/gemwoven/vip-pass/'
NAMES=[['head2-free','head2-gold','head2-jewel'],['cell-free','cell-gold','cell-jewel'],['lock-band','paid-backing','trunk-tile'],['trunk-top','gate-tag',None]]
def despill(a):
    a=a.astype(int); r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    edge=ndimage.binary_dilation(al<200,iterations=3)
    m=(r-g>14)&(b-g>14)&edge
    a[...,0]=np.where(m,np.minimum(r,g+8),r); a[...,2]=np.where(m,np.minimum(b,g+4),b)
    a[...,3]=np.where(m&(al<250),(al*0.5).astype(int),al)
    return a.clip(0,255).astype('uint8')
im=np.array(Image.open(RAW+'proc-sheet-c/raw-sheet-clean.png').convert('RGBA'))
H,W=im.shape[:2]; rows,cols=len(NAMES),len(NAMES[0]); mask=im[...,3]>40
lab,n=ndimage.label(mask); objs=ndimage.find_objects(lab); sizes=ndimage.sum(mask,lab,range(1,n+1))
cells={}
for i,sl in enumerate(objs):
    if sizes[i]<60: continue
    cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
    cells.setdefault((int(cy//(H/rows)),int(cx//(W/cols))),[]).append(i+1)
meta={}
for (r,c),ids in sorted(cells.items()):
    name=NAMES[r][c]
    if name is None: continue  # owned-tag: drawn but not used (the paid slot says 'Đã mở')
    m=np.isin(lab,ids)
    ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    crop=im[y0:y1,x0:x1].copy(); crop[...,3]=np.where(m[y0:y1,x0:x1],crop[...,3],0)
    crop=despill(crop)
    # magenta trapped in closed holes (between leaves) is not reached by the fringe pass
    hole=(crop[...,0]>170)&(crop[...,2]>170)&(crop[...,1]<110)
    if 'jewel' not in name:  # shaded magenta between leaves; violet pieces keep their paint
        c=crop.astype(int); hole|=(c[...,0]-c[...,1]>50)&(c[...,2]-c[...,1]>40)&(c[...,0]>90)
    crop[...,3]=np.where(hole,0,crop[...,3])
    out=Image.fromarray(crop)
    if name=='trunk-tile':
        # keep only the straight middle so copies join flat (the raw ends are cut by the cell edge)
        out=out.crop((0,4,out.width,out.height-4))
        # crossfade the last rows into the first so the tile repeats without a visible seam
        a=np.array(out).astype(float); k=18; h=a.shape[0]
        t=np.linspace(0,1,k)[:,None,None]
        a[:k]=a[h-k:]*(1-t)+a[:k]*t
        out=Image.fromarray(a[:h-k].round().astype('uint8'))
    if name=='trunk-top':
        out=out.crop((0,0,out.width,out.height-3))
    out.save(OUT+name+'.webp',quality=92,method=6)
    meta[name]=out.size
    print(name,out.size,len(ids))
json.dump(meta,open(RAW+'slice-meta.json','w'),indent=1)
