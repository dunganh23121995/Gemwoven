"""Register the VIP & Nạp art in painted-backgrounds.json."""
import json,glob,os
from PIL import Image
p='assets/gemwoven/painted-backgrounds.json';m=json.load(open(p,encoding='utf-8'))
m['background-vip']={'file':'assets/gemwoven/vip-pass/room.webp','width':941,'height':1672,'transparent':False,'textless':True,'source':'assets/gemwoven/raw/vip-pass/room-raw.png','reference':'assets/gemwoven/raw/vip-pass/mockup-1.png','promptFiles':['assets/gemwoven/raw/vip-pass/room-prompt.txt'],
 'purpose':'VIP & Nạp reading room (owner 2026-11-04): quiet centre for the Sổ Hành Trình tree. Drawn by Codex gpt-6.1-sol low; the raw 2:3 image is cropped to its central 864 px.'}
for f in sorted(glob.glob('assets/gemwoven/vip-pass/*.webp')):
    n=os.path.basename(f)[:-5]
    if n=='room':continue
    w,h=Image.open(f).size
    m['vip-pass-'+n]={'file':'assets/gemwoven/vip-pass/'+n+'.webp','width':w,'height':h,'textless':True,'source':'assets/gemwoven/raw/vip-pass/','promptFiles':['assets/gemwoven/raw/vip-pass/sheet-a-prompt.txt','assets/gemwoven/raw/vip-pass/sheet-b-prompt.txt'],
      'purpose':'VIP & Nạp pieces drawn by Codex from the approved mockup (pass-ui.js; cut by slice.py).'}
json.dump(m,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(len(m))
