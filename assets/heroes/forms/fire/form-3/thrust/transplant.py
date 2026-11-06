# Gives the full-thrust frame the blade of the frame before it (owner 06/11 + Codex: the glaive must keep one shape and
# length between drive and contact). The blade end lies over the plain background in both, so the part of the glaive
# beyond the right hand is lifted from one and laid at the other's right hand.
import numpy as np
from PIL import Image
def fg(a): return (np.abs(a[..., 0] - 255) + a[..., 1] + np.abs(a[..., 2] - 255)) > 150
src = np.asarray(Image.open('contact-c.png').convert('RGB')).astype(int)   # drive: right hand at x 695, shaft y ~720
dst = np.asarray(Image.open('drive-c.png').convert('RGB')).astype(int)     # full thrust: right hand at x 715, shaft y ~716
SX, SY, DX, DY, HALF = 720, 720, 740, 716, 140
band = np.zeros(src.shape[:2], bool); band[SY - HALF:SY + HALF, SX:] = True
head = band & fg(src)
out = dst.copy(); out[DY - HALF:DY + HALF, DX:] = (255, 0, 255)
ys, xs = np.nonzero(head); ty, tx = ys + (DY - SY), xs + (DX - SX); ok = (tx < out.shape[1]) & (ty >= 0) & (ty < out.shape[0])
out[ty[ok], tx[ok]] = src[ys[ok], xs[ok]]
Image.fromarray(out.astype(np.uint8)).save('thrust-full-c.png')
