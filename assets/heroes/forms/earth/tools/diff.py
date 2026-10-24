import sys, numpy as np
from PIL import Image
im = np.asarray(Image.open(sys.argv[1]).convert("RGBA")).astype(int); im[..., :3] = im[..., :3] * im[..., 3:] // 255; cols=2; rows=4
ch, cw = im.shape[0]//rows, im.shape[1]//cols
fr = [im[(i//cols)*ch:(i//cols+1)*ch, (i%cols)*cw:(i%cols+1)*cw] for i in range(8)]
out = Image.new("RGB", (cw*8, ch))
for i, f in enumerate(fr):
    d = np.abs(f - fr[0]).max(-1) > 40
    base = (fr[i][..., :3] * .35 + 30).astype("uint8")
    base[d] = [255, 60, 60]
    out.paste(Image.fromarray(base), (i*cw, 0))
out.save(sys.argv[2])
