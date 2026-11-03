"""Register the second-pass VIP pieces in painted-backgrounds.json and drop entries whose art was removed."""
import json,glob,os
from PIL import Image
p='assets/gemwoven/painted-backgrounds.json';m=json.load(open(p,encoding='utf-8'))
NEW=['head2-free','head2-gold','head2-jewel','cell-free','cell-gold','cell-jewel','lock-band','paid-backing','trunk-tile','trunk-top','gate-tag']
for k in [k for k in m if k.startswith('vip-pass-') and not os.path.exists(m[k]['file'])]: del m[k]
for n in NEW:
    f='assets/gemwoven/vip-pass/'+n+'.webp';w,h=Image.open(f).size
    m['vip-pass-'+n]={'file':f,'width':w,'height':h,'textless':True,'transparent':True,'source':'assets/gemwoven/raw/vip-pass/v2/sheet-c-raw.png','reference':'assets/gemwoven/raw/vip-pass/v2/mockup-1.png',
      'promptFiles':['assets/gemwoven/raw/vip-pass/v2/sheet-c-prompt.txt'],
      'purpose':'VIP second pass (Codex review: wider reward rows, tracks told apart by header and badge, light trays): drawn by Codex gpt-6.1-sol low, cut by raw/vip-pass/v2/slice.py; used by pass-ui.js.'}
json.dump(m,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(len(m))
