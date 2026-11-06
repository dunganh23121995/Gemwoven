# Spear thrust as the owner describes it (06/11): the LEFT hand stays put in front as a guide, the RIGHT hand pushes the
# butt forward until it is close behind the left hand, sliding the glaive through the left hand into the foe.
# Guide marks only: cyan shaft (butt green dot -> blade tip white dot), blue ring = left hand, red ring = right hand.
import sys
from PIL import Image, ImageDraw
L, Y, BUTT0, LEFT, RIGHT_GAP = 670, 716, 245, 613, 25
def marks(base, out, shift):
    im = Image.open(base).convert('RGB'); d = ImageDraw.Draw(im)
    b = BUTT0 + shift; t = b + L; r = b + RIGHT_GAP
    d.line([(b, Y), (b + .6 * L, Y)], fill=(0, 230, 255), width=7)
    d.ellipse([b - 9, Y - 9, b + 9, Y + 9], fill=(0, 255, 0)); d.ellipse([t - 12, Y - 12, t + 12, Y + 12], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    d.ellipse([LEFT - 22, Y - 22, LEFT + 22, Y + 22], outline=(30, 90, 255), width=7)
    d.ellipse([r - 20, Y - 20, r + 20, Y + 20], outline=(255, 30, 30), width=7)
    im.save(out)
marks(sys.argv[1], 'marks-g2.png', 0)
