"""Translate accepted sprites to the game's floor and export per-frame head pins.

Translation only: never resize an individual pose. QC contact sheets are review
artifacts assembled from finished ImageGen frames, not generated character art.
"""
from pathlib import Path
import argparse
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/reimagined'
report=[]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--family',choices=['heroes','bosses'])
parser.add_argument('--key',choices=['fire','earth','ice','lightning'])
args=parser.parse_args()
for family in ['heroes','bosses']:
    if args.family and family!=args.family:continue
    for key in ['fire','earth','ice','lightning']:
        if args.key and key!=args.key:continue
        actions=['idle','attack','cast','hurt']+(['buff','hover' if key=='lightning' else 'run'] if family=='heroes' else [])
        if family=='heroes' and key in ('fire','earth'): actions.append('smash')
        # One floor for the WHOLE character, allowing for low claws/staff tips.
        # The same translation applies to every pose; no action is fit separately.
        floor=244
        for action in actions:
            check=BASE/family/key/action/'runtime-meta.json'
            if not check.exists():raise RuntimeError(f'Missing accepted action: {check}')
            info=json.loads(check.read_text())
            lowest=max(Image.open(check.parent/f'frame-{i:02}.png').getchannel('A').getbbox()[3] for i in range(info['frames']))
            floor=min(floor,round(254-lowest+info['origin'][1]))
        contact=Image.new('RGB',(6*180,len(actions)*200),(19,29,36))
        draw=ImageDraw.Draw(contact)
        for row,action in enumerate(actions):
            base=BASE/family/key/action
            metadata=base/'runtime-meta.json'
            if not metadata.exists():raise RuntimeError(f'Missing accepted action: {family}/{key}/{action}')
            meta=json.loads(metadata.read_text())
            if not meta['accepted']:raise RuntimeError(f'Unaccepted: {base}')
            offset=round(floor-meta['origin'][1])
            atlas=Image.new('RGBA',(meta['columns']*256,meta['rows']*256))
            heads=[];hashes=[];frames=[]
            for i in range(meta['frames']):
                path=base/f'frame-{i:02}.png'
                frame=Image.open(path).convert('RGBA')
                bbox=frame.getchannel('A').getbbox()
                if bbox[3]+offset>254:raise RuntimeError(f'Floor translation clips {family}/{key}/{action}/{i}: {bbox}, +{offset}')
                if offset:
                    shifted=Image.new('RGBA',(256,256));shifted.alpha_composite(frame,(0,offset));frame=shifted
                    frame.save(path,optimize=True)
                bbox=frame.getchannel('A').getbbox()
                if family=='heroes':
                    # The crown/ears/hat sit in the central head band. Requiring
                    # a broad opaque run excludes a thin raised katana or staff.
                    mask=np.asarray(frame)[:,:,3]>160
                    rows=np.flatnonzero(mask[:,90:176].sum(axis=1)>=8)
                    y=int(rows[0])
                    ys,xs=np.nonzero(mask[y:y+12,90:176])
                    x=int(np.median(xs)+90)
                    head=[x,y]
                    if key=='fire' and action=='smash':
                        # Raised steel must not be mistaken for the fox ears.
                        head=[[145,108],[145,104],[145,106],[158,117],[175,124],[170,110]][i]
                else:
                    # These creatures have their face in the forward quarter of
                    # the silhouette. Head offsets are per-body, not screen-fixed.
                    ratio={'fire':(.27,.12),'earth':(.28,.20),'ice':(.27,.12),'lightning':(.30,.17)}[key]
                    head=[round(bbox[0]+(bbox[2]-bbox[0])*ratio[0]),round(bbox[1]+(bbox[3]-bbox[1])*ratio[1])]
                heads.append(head);hashes.append(hashlib.sha256(frame.tobytes()).hexdigest());frames.append(frame)
                atlas.alpha_composite(frame,((i%meta['columns'])*256,(i//meta['columns'])*256))
                preview=frame.resize((180,180),Image.Resampling.LANCZOS)
                contact.paste(preview,(i*180,row*200+20),preview)
                draw.text((i*180+6,row*200+4),f'{action} {i}',fill=(232,220,179))
                hx=i*180+head[0]*180/256;hy=row*200+20+head[1]*180/256
                draw.ellipse((hx-2,hy-2,hx+2,hy+2),fill=(255,205,80))
            meta.update(headAnchors=heads,floorAligned=True,origin=[128,floor],
                presentationTranslation=[0,round(floor-json.loads((base/'pipeline-meta.json').read_text())['output_origin'][1])],
                framePixelHashes=hashes,uniqueFrames=len(set(hashes)))
            atlas.save(base/'sheet-transparent.png',optimize=True)
            atlas.save(base.parent/f'{action}.webp','WEBP',lossless=True,method=6,exact=True)
            atlas.save(base/'sheet-transparent.webp','WEBP',lossless=True,method=6,exact=True)
            frames[0].save(base/'animation.gif',save_all=True,append_images=frames[1:],duration=230 if action=='idle' else 150,loop=0,disposal=2)
            metadata.write_text(json.dumps(meta,indent=2),encoding='utf-8')
            report.append({'family':family,'key':key,'action':action,'frames':meta['frames'],'qc':meta['qc']})
        contact.save(ROOT/f'qa/redesign-{family}-{key}-frames.png')
manifest=BASE/'manifest.json'
if (args.family or args.key) and manifest.exists():
    changed={(r['family'],r['key'],r['action']) for r in report}
    unchanged=[r for r in json.loads(manifest.read_text())['actions'] if (r['family'],r['key'],r['action']) not in changed]
    manifest.write_text(json.dumps({'version':2,'actions':unchanged+report},indent=2),encoding='utf-8')
else:
    manifest.write_text(json.dumps({'version':2,'actions':report},indent=2),encoding='utf-8')
print(f'Finalized {len(report)} action sheets, {sum(r["frames"] for r in report)} unique frames.')
