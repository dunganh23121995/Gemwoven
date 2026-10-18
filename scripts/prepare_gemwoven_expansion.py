"""Slice the approved UI atlases and reuse the combat cast's original artwork.

Only crop/pack finished artwork; no procedural drawing or character repainting.
Run after prepare_gemwoven.py when rebuilding all assets from source.
"""
from pathlib import Path
import json
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/gemwoven'
manifest = json.loads((ART/'manifest.json').read_text(encoding='utf-8'))

def save(name, im, source, box=None):
    im = im.convert('RGBA')
    # Reject disconnected scraps crossing atlas cell borders.
    a = np.array(im)
    labels, _ = ndimage.label(a[:,:,3] > 110)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    if sizes.max():
        keep = sizes >= max(12, sizes.max() * .001)
        edges = np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]))
        for label in edges:
            if label != sizes.argmax(): keep[label] = False
        mask = ndimage.binary_dilation(keep[labels], iterations=3)
        a[:,:,3] = np.where(mask,a[:,:,3],0)
    im = Image.fromarray(a)
    bounds = im.getchannel('A').getbbox()
    if not bounds: raise ValueError(name)
    im = im.crop(bounds)
    padded = Image.new('RGBA',(im.width+12,im.height+12))
    padded.alpha_composite(im,(6,6))
    padded.save(ART/'items'/f'{name}.png',optimize=True)
    manifest[name] = dict(file=f'assets/gemwoven/items/{name}.png',width=padded.width,height=padded.height,source=source,textless=True)
    if box: manifest[name]['crop'] = list(box)

def grid(file,names,cols,rows,xs=None,ys=None):
    im=Image.open(ART/'raw'/file)
    xs=xs or [round(i*im.width/cols) for i in range(cols+1)]
    ys=ys or [round(i*im.height/rows) for i in range(rows+1)]
    for i,name in enumerate(names):
        col,row=i%cols,i//cols
        box=(xs[col],ys[row],xs[col+1],ys[row+1])
        save(name,im.crop(box),'raw/'+file,box)

grid('menu-v2.png',['nav-home','nav-heroes','nav-bag','nav-skills','nav-summon','nav-arena','nav-more','skill-lock','inventory-slot','skill-frame','nameplate','skill-banner'],4,3,ys=[0,387,727,1086])
save('nameplate',Image.open(ART/'raw/menu-v2.png').crop((724,775,1135,1015)),'raw/menu-v2.png',[724,775,1135,1015])
grid('buildings-v2.png',['home-summon','home-arena','home-shop','home-upgrade','home-forge','home-tavern'],3,2)
grid('inventory-v2.png',['exp-book','skill-book','crest','lightning-essence','ice-essence','herbs','wood','ore','cloth','leather','helmet','boots'],4,3,ys=[0,375,727,1086])
grid('skills-v2.png',[f'skill-{hero}-{i}' for hero in ['fire','ice','earth','lightning','shadow'] for i in range(4)],4,5,xs=[140,426,717,1004,1290])
save('panel-parchment',Image.open(ART/'raw/panel-v2.png'),'raw/panel-v2.png')
grid('hud-v2.png',['avatar-ring','coins','mana','icon-mail','icon-settings','hud-plus'],3,2)

for key in ['fire','ice','earth','lightning','shadow']:
    base = f'assets/heroes/{key}/idle' if key=='shadow' else f'assets/reimagined/heroes/{key}/idle'
    source=ROOT/base/'raw-sheet-clean.png'
    im=Image.open(source).convert('RGBA').crop((0,0,512,512))
    bounds=im.getchannel('A').getbbox()
    im=im.crop(bounds)
    save('hero-'+key,im,base+'/raw-sheet-clean.png',[0,0,512,512])
    # Bust cutout keeps the exact hood, ears, hat, face and costume from combat.
    head_boxes={'fire':(193,35,365,245),'ice':(185,25,366,270),'earth':(124,94,283,267),'lightning':(111,43,390,263),'shadow':(192,111,365,289)}
    portrait=Image.open(source).crop(head_boxes[key])
    save('portrait-'+key,portrait,base+'/raw-sheet-clean.png')
    save('gem-'+key,portrait,base+'/raw-sheet-clean.png')
    if key=='fire':
        save('avatar-fire',portrait,base+'/raw-sheet-clean.png')
        save('hero-fragment',portrait,base+'/raw-sheet-clean.png')

# A scenery-only bottom strip is a reusable menu background, separate from icons.
im=Image.open(ART/'backgrounds/inventory.png')
save('footer-wood',im.crop((0,round(im.height*.895),im.width,im.height)),'backgrounds/inventory.png')
for key in ['home','inventory','skills','tavern']:
    Image.open(ART/'backgrounds'/f'{key}.png').convert('RGB').save(ART/'backgrounds'/f'{key}.webp',quality=92)
(ART/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/gemwoven/assets.js').write_text('window.GEMWOVEN_ASSETS = '+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
print(f'Exported {len(manifest)} assets with combat-identical hero artwork.')
