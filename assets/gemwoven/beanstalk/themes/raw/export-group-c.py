"""Deterministic extraction/normalization of built-in ImageGen material atlases."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[1]
PACKS = [
    ("group-c1", ["tempestwing", "souljailer", "sporefather"],
     [(0, 0, 276, 425), (0, 425, 276, 830), (0, 830, 276, 1254)],
     [(276, 0, 940, 425), (276, 425, 940, 830), (276, 830, 940, 1254)],
     [(918, 0, 1254, 425), (918, 425, 1254, 830), (918, 830, 1254, 1254)]),
    ("group-c2", ["prismback", "sandchronarch", "coraltide"],
     [(0, 0, 247, 420), (0, 420, 247, 834), (0, 834, 247, 1262)],
     [(247, 0, 940, 420), (247, 420, 940, 834), (247, 834, 940, 1262)],
     [(908, 0, 1246, 420), (908, 420, 1246, 834), (908, 834, 1246, 1262)]),
    ("group-c3", ["moonfang"], [(0, 0, 395, 809)],
     [(395, 0, 1420, 809)], [(1420, 0, 1942, 809)]),
]

def clean(image):
    p = np.asarray(image.convert("RGBA")).copy()
    regions, _ = label(p[:, :, 3] > 96)
    counts = np.bincount(regions.ravel())
    counts[0] = 0
    keep = binary_dilation(regions == counts.argmax(), iterations=2)
    p[~keep] = 0
    return Image.fromarray(p)

def bounds(im, y):
    xs = np.where(np.asarray(im)[y, :, 3] > 128)[0]
    return (int(xs[0]), int(xs[-1] + 1))

def normalize_stem(image):
    # Crop inside the painted cut faces so a real stem cross section runs
    # through the repeat boundary. Only original generated pixels are used.
    image = clean(image)
    box = image.getbbox()
    image = image.crop((box[0], box[1]+7, box[2], box[3]-7))
    fitted = image.resize((170, 512), Image.Resampling.LANCZOS)
    base = Image.new("RGBA", (384, 512))
    base.alpha_composite(fitted, (107, 0))
    registered = Image.new("RGBA", base.size)
    for y in range(512):
        row = base.crop((0, y, 384, y+1))
        d = min(y, 511-y)
        if d < 64:
            t = min(1, (64-d)/32)
            weight = t*t*(3-2*t)
            left, right = bounds(base, y)
            center = (left+right)/2
            scale = 1+weight*(114/(right-left)-1)
            tx = center+weight*(192-center)-scale*center
            row = row.transform((384,1),Image.Transform.AFFINE,
                                (1/scale,0,-tx/scale,0,1,0),Image.Resampling.BICUBIC)
        registered.paste(row,(0,y))
    base=registered
    top=np.asarray(base.crop((0,0,384,32))).astype(float)
    bot=np.asarray(base.crop((0,480,384,512))).astype(float)
    blend=np.zeros_like(top)
    for y in range(32):
        t=y/31
        t=t*t*(3-2*t)
        a=top[y,:,3:4]/255
        b=bot[y,:,3:4]/255
        alpha=t*a+(1-t)*b
        rgb=t*top[y,:,:3]*a+(1-t)*bot[y,:,:3]*b
        blend[y,:,:3]=np.divide(rgb,alpha,out=np.zeros_like(rgb),where=alpha>0)
        blend[y,:,3:4]=alpha*255
    base.paste(Image.fromarray(np.rint(blend).astype(np.uint8)),(0,480))
    base=base.crop((0,32,384,512)).resize((384,512),Image.Resampling.LANCZOS)
    ends=[bounds(base,y) for y in (0,511)]
    result=Image.new("RGBA",base.size)
    for y in range(512):
        row=base.crop((0,y,384,y+1))
        edge=0 if y<64 else 1 if y>=448 else None
        if edge is not None:
            d=y if edge==0 else 511-y
            t=max(0,1-d/64)
            weight=t*t*(3-2*t)
            left,right=ends[edge]
            center=(left+right)/2
            scale=1+weight*(114/(right-left)-1)
            tx=center+weight*(192-center)-scale*center
            row=row.transform((384,1),Image.Transform.AFFINE,
                              (1/scale,0,-tx/scale,0,1,0),Image.Resampling.BICUBIC)
        result.paste(row,(0,y))
    return clean(result)

def socket_y(image,x):
    p=np.asarray(image)
    ys=np.where(p[:,x,3]>128)[0]
    return int(round(float(np.median(ys))))

def normalize_leaf(image):
    image=clean(image)
    image=image.crop(image.getbbox()).resize((500,190),Image.Resampling.LANCZOS)
    result=Image.new("RGBA",(512,320))
    result.alpha_composite(image,(6,65))
    return result, {"attach":[14,socket_y(result,14)]}

def normalize_branch(image):
    image=clean(image)
    image=image.crop(image.getbbox()).resize((240,64),Image.Resampling.LANCZOS)
    result=Image.new("RGBA",(256,96))
    result.alpha_composite(image,(8,16))
    return result, {"start":[23,socket_y(result,23)],"end":[242,socket_y(result,242)]}

catalog={"themes":{},"items":{}}
report=[]
for group,names,stems,leaves,branches in PACKS:
    source=Image.open(ROOT/"raw"/group/"raw-sheet.png").convert("RGBA")
    for i,name in enumerate(names):
        out=ROOT/name
        out.mkdir(exist_ok=True)
        stem=normalize_stem(source.crop(stems[i]))
        leaf,leaf_sockets=normalize_leaf(source.crop(leaves[i]))
        branch,branch_sockets=normalize_branch(source.crop(branches[i]))
        catalog["themes"][name]={part:f"bean-{name}-{part}" for part in ("stem","leaf","branch")}
        for part,im,sockets in [
            ("stem",stem,{"start":[192,0],"end":[192,512]}),
            ("leaf",leaf,leaf_sockets),
            ("branch",branch,branch_sockets),
        ]:
            im.save(out/f"{part}.png")
            im.save(out/f"{part}.webp",lossless=True,method=6)
            item={
                "file":f"beanstalk/themes/{name}/{part}.png",
                "width":im.width,"height":im.height,"sockets":sockets,
                "raw":f"beanstalk/themes/raw/{group}/raw-sheet.png",
                "prompt":f"beanstalk/themes/raw/{group}/prompt-used.txt",
                "generation":{"tool":"built-in image_gen","model":"gpt-6-astra","reasoning":"high"},
            }
            if part=="stem":
                item["repeat"]={"axis":"vertical","overlapSourcePixels":1}
                item["endpointOpaqueWidths"]=[bounds(im,y)[1]-bounds(im,y)[0] for y in (0,511)]
            if part=="leaf":
                item["floorAnchor"]=[256,142]
                item["actorSafeArea"]={"shape":"ellipse","center":[256,142],"radii":[110,35]}
                item["occlusionClass"]="low"
                item["occupantPolicy"]="none"
            catalog["items"][f"bean-{name}-{part}"]=item
            assert im.getchannel("A").getextrema()==(0,255)
        report.append({"theme":name,"stemBounds":stem.getbbox(),"stemEndpointWidths":catalog["items"][f"bean-{name}-stem"]["endpointOpaqueWidths"],"leafSockets":leaf_sockets,"branchSockets":branch_sockets,"sourceBoxes":{"stem":stems[i],"leaf":leaves[i],"branch":branches[i]}})
(ROOT/"art-catalog-c.json").write_text(json.dumps(catalog,indent=2)+"\n",encoding="utf-8")
(ROOT/"raw"/"group-c-extraction.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,indent=2))
