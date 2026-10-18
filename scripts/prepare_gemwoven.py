"""Extract individually reusable RGBA UI assets from generated source atlases."""
from pathlib import Path
import json
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/gemwoven'
manifest = {}

def extract(sheet, name, box):
    source = Image.open(ART / 'raw' / f'{sheet}.png').convert('RGBA')
    piece = source.crop(box)
    a = np.array(piece)
    # Discard detached flecks from neighbouring atlas cells, preserve soft alpha.
    labels, count = ndimage.label(a[:, :, 3] > 100)
    if count:
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        keep = sizes >= max(18, sizes.max() * .002)
        # Cells from generation are not perfectly equal: reject neighbour fragments
        # touching a crop edge, while keeping the main silhouette itself.
        edge_ids=np.unique(np.concatenate([labels[0,:],labels[-1,:],labels[:,0],labels[:,-1]]))
        for label in edge_ids:
            if label != sizes.argmax(): keep[label]=False
        mask = ndimage.binary_dilation(keep[labels], iterations=5)
        a[:, :, 3] = np.where(mask, a[:, :, 3], 0)
    piece = Image.fromarray(a)
    bounds = piece.getchannel('A').getbbox()
    if not bounds:
        raise ValueError(name)
    piece = piece.crop(bounds)
    padded = Image.new('RGBA', (piece.width+12, piece.height+12))
    padded.alpha_composite(piece, (6, 6))
    path = ART / 'items' / f'{name}.png'
    padded.save(path, optimize=True)
    manifest[name] = {'file': f'assets/gemwoven/items/{name}.png', 'width': padded.width,
                      'height': padded.height, 'source': f'raw/{sheet}.png', 'crop': list(box), 'textless': True}

frames = [
 ('title-wood',(0,0,354,252)),('title-parchment',(354,0,648,252)),('button-gold',(648,0,961,252)),('button-blue',(961,0,1254,252)),
 ('tab-wood',(0,252,350,585)),('panel-parchment',(350,252,734,585)),('card-dark',(734,252,989,585)),('side-pennant',(989,252,1254,585)),
 ('nav-tile',(0,585,350,870)),('flag-blue',(350,585,652,870)),('flag-red',(652,585,962,870)),('flag-gold',(962,585,1254,879)),
 ('rank-gold',(0,870,350,1254)),('rank-silver',(350,870,650,1254)),('rank-bronze',(650,870,951,1254)),('avatar-ring',(951,879,1254,1254))]
for name, box in frames: extract('frames', name, box)

def grid(sheet, names, cols, rows, xs=None, ys=None):
    w,h=Image.open(ART/'raw'/f'{sheet}.png').size
    xs=xs or [round(i*w/cols) for i in range(cols+1)]
    ys=ys or [round(i*h/rows) for i in range(rows+1)]
    for i,name in enumerate(names):
        x,y=i%cols,i//cols
        extract(sheet,name,(xs[x],ys[y],xs[x+1],ys[y+1]))

grid('icons',['avatar-fire','icon-home','icon-hero','icon-bag','icon-book','icon-summon','icon-arena','icon-shop','icon-forge','icon-tavern','icon-grid','icon-event','icon-gift','icon-quest','icon-trophy','icon-crown','icon-chat','icon-friends','icon-mail','icon-settings'],5,4,ys=[0,312,605,865,1122])
for name,box in [('hero-fire',(0,0,452,435)),('hero-ice',(452,0,889,435)),('hero-guide',(889,0,1254,435)),('gem-fire',(0,435,432,827)),('gem-ice',(432,435,832,827)),('gem-earth',(832,435,1254,827)),('gem-lightning',(0,827,433,1254)),('gem-shadow',(433,827,834,1254)),('summon-crystal',(834,827,1254,1254))]: extract('heroes',name,box)
grid('items',['coins','mana','fire-essence','amber','scroll','hero-fragment','ticket','chest','hammer','potion','ingot','emerald'],4,3)
for name,box in [('fire-sword',(0,0,660,690)),('stat-heart',(660,0,1254,650)),('stat-attack',(0,690,660,1254)),('stat-shield',(660,650,1254,1254))]: extract('extras',name,box)

# This cropped illustration is a production master; no concept sheet is required.
quest=Image.open(ART/'items/quest-scene.png')
manifest['quest-scene']={'file':'assets/gemwoven/items/quest-scene.png','width':quest.width,'height':quest.height,'textless':True,'source':'items/quest-scene.png'}
for key in ['arena','summon','shop','forge','upgrade','tavern']:
    Image.open(ART/'backgrounds'/f'{key}.png').convert('RGB').save(ART/'backgrounds'/f'{key}.webp',quality=92)
(ART/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/gemwoven/assets.js').write_text('window.GEMWOVEN_ASSETS = '+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
print(f'Exported {len(manifest)} independent items and 6 backgrounds.')
