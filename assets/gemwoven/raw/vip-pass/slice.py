"""Cut the VIP & Nạp pieces out of the keyed Codex sheets (grid cells, connected components) and the room background."""
import json, numpy as np
from PIL import Image
from scipy import ndimage
ROOT='D:/Project/Gemwoven/'; RAW=ROOT+'assets/gemwoven/raw/vip-pass/'; OUT=ROOT+'assets/gemwoven/vip-pass/'
SHEETS={'sheet-a':(4,3,[['title-sign','vip-strip','season-strip'],['tab-selected','tab-idle','tree-crown'],['tree-row','action-primary','action-secondary'],['vip-trough','activity-trough','activity-fill']]),
 'sheet-b':(4,6,[['header-free','header-gold','header-jewel','reward-free','reward-gold','reward-jewel'],['medal','medal-current','vip-crest','next-vip-tag','claim-button','status-plaque'],
  ['avatar-frame','gift','hourglass','ownership-lock','claimed-check','journey-book'],['calendar','fund-pouch','scroll-rail','scroll-thumb','scroll-arrow','quantity-pill']])}
def despill(a):
    a=a.astype(int); r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    # only the fringe (within 3 px of transparency) is despilled, so painted purples stay purple
    edge=ndimage.binary_dilation(al<200,iterations=3)
    m=(r-g>14)&(b-g>14)&edge
    a[...,0]=np.where(m,np.minimum(r,g+8),r); a[...,2]=np.where(m,np.minimum(b,g+4),b)
    # edge pixels that stay pinkish lose alpha
    a[...,3]=np.where(m&(al<250),(al*0.5).astype(int),al)
    return a.clip(0,255).astype('uint8')
meta={}
for sheet,(rows,cols,names) in SHEETS.items():
    im=np.array(Image.open(RAW+f'proc-{sheet}/raw-sheet-clean.png').convert('RGBA'))
    H,W=im.shape[:2]; mask=im[...,3]>40
    lab,n=ndimage.label(mask); objs=ndimage.find_objects(lab); sizes=ndimage.sum(mask,lab,range(1,n+1))
    cells={}
    for i,sl in enumerate(objs):
        if sizes[i]<60: continue
        cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
        key=(int(cy//(H/rows)),int(cx//(W/cols)))
        cells.setdefault(key,[]).append(i+1)
    for (r,c),ids in sorted(cells.items()):
        name=names[r][c]; m=np.isin(lab,ids)
        ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        crop=im[y0:y1,x0:x1].copy(); crop[...,3]=np.where(m[y0:y1,x0:x1],crop[...,3],0)
        Image.fromarray(despill(crop)).save(OUT+name+'.webp',quality=92,method=6)
        meta[name]=(int(x1-x0),int(y1-y0))
        print(sheet,name,x1-x0,y1-y0,len(ids))
# Room: the central 864 px of the 1024-wide raw, scaled to the 941x1672 stage.
room=Image.open(RAW+'room-raw.png').convert('RGB'); w,h=room.size; cw=round(h*941/1672)
room.crop(((w-cw)//2,0,(w-cw)//2+cw,h)).resize((941,1672),Image.LANCZOS).save(OUT+'room.webp',quality=90,method=6)
json.dump(meta,open(RAW+'slice-meta.json','w'),indent=1)
# The row tile's trunk tapers in its first and last few pixels: trim them so copies join flat.
row=Image.open(OUT+'tree-row.webp'); row.crop((0,5,row.width,row.height-5)).save(OUT+'tree-row.webp',quality=92,method=6)
# The crown's trunk ends in a keyed fringe: trim it (the crown laps over the scroll box, so nothing shows a gap).
crown=Image.open(OUT+'tree-crown.webp'); crown.crop((0,0,crown.width,crown.height-5)).save(OUT+'tree-crown.webp',quality=92,method=6)
