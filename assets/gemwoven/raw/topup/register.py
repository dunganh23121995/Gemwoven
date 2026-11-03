"""Register the Nạp page pieces in painted-backgrounds.json (run from the repo root)."""
import json
from PIL import Image
p='assets/gemwoven/painted-backgrounds.json';m=json.load(open(p,encoding='utf-8'))
NAMES=['pack-1','pack-2','pack-3','pack-4','pack-5','pack-6','ribbon','price-plate','card-wide','total-strip','coins-1','coins-2','coins-3']
for n in NAMES:
    f='assets/gemwoven/topup/'+n+'.webp';w,h=Image.open(f).size
    src='assets/gemwoven/raw/topup/'+('card-raw.png' if n in ('card-wide','total-strip') else 'pieces-raw.png')
    m['topup-'+n]={'file':f,'width':w,'height':h,'textless':True,'transparent':True,'source':src,'reference':'assets/gemwoven/raw/topup/mockup-page.png',
      'promptFiles':['assets/gemwoven/raw/topup/'+('card-prompt.txt' if n in ('card-wide','total-strip') else 'pieces-prompt.txt')],
      'purpose':'Nạp page and shop gold packs (owner 04/11, Claude + Codex topup round): drawn by Codex gpt-6.1-sol low, cut by raw/topup/slice.py; used by topup-ui.js and art-screens.js.'}
json.dump(m,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(len(m))
