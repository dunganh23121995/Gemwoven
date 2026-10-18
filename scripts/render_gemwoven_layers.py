"""Independent raster proof of layer coordinates, not a browser screenshot."""
from pathlib import Path
import json,math
import subprocess
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1]
export = subprocess.run(
    ['node', '-e', "global.window={};require('./src/gemwoven/screens.js');require('./src/gemwoven/expansion.js');require('./src/gemwoven/assets.js');console.log(JSON.stringify({layout:window.GEMWOVEN_LAYOUT,copy:window.GEMWOVEN_DEFAULT_COPY,assets:window.GEMWOVEN_ASSETS}));"],
    cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8')
DATA=json.loads(export.stdout)
ASSETS=DATA['assets']; COPY=DATA['copy']
OUT=ROOT/'qa/gemwoven';OUT.mkdir(exist_ok=True)
FONT=Path('C:/Windows/Fonts/cambriab.ttf')
def paste(canvas,key,rect,fit='contain',bottom=False):
    x,y,w,h=map(round,rect);im=Image.open(ROOT/ASSETS[key]['file']).convert('RGBA')
    if fit=='fill':im=im.resize((w,h),Image.Resampling.LANCZOS)
    else:im=ImageOps.contain(im,(w,h),Image.Resampling.LANCZOS);x+=(w-im.width)//2;y+=(h-im.height) if bottom else (h-im.height)//2
    canvas.alpha_composite(im,(x,y))
def text(canvas,value,rect,size,tone='',align='center'):
    x,y,w,h=rect;draw=ImageDraw.Draw(canvas);font=ImageFont.truetype(str(FONT),size)
    def wrap(value,font):
        lines=[]
        for paragraph in value.split('\n'):
            line=''
            for word in paragraph.split(' '):
                attempt=(line+' '+word).strip()
                if line and font.getlength(attempt)>w:lines.append(line);line=word
                else:line=attempt
            lines.append(line)
        return lines
    lines=wrap(value,font)
    while size>12 and (max(font.getlength(line) for line in lines)>w or len(lines)*size*1.16>h):
        size-=1;font=ImageFont.truetype(str(FONT),size);lines=wrap(value,font)
    if value and all(c in '★☆ ' for c in value):font=ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf',size)
    color={'ink':'#49301a','green':'#85dc4c','gold':'#ffde8a'}.get(tone,'#ffe9bc')
    lineheight=size*1.16
    for i,line in enumerate(lines):
        tw=draw.textlength(line,font=font);tx=x if align=='left' else x+(w-tw)/2
        ty=y+(h-lineheight*len(lines))/2+i*lineheight
        draw.text((tx,ty),line,font=font,fill=color,stroke_width=0 if tone=='ink' else 1,stroke_fill='#3c2517')
for key,screen in DATA['layout']['screens'].items():
    canvas=Image.open(ROOT/screen['background']).convert('RGBA').resize((941,1672))
    for n in screen['nodes']:
        rect=n['rect'];x,y,w,h=rect
        if n['kind'] in ['image','button']:
            paste(canvas,n['asset'],rect,n.get('fit','contain'),n.get('className')=='hero-standing')
            if n.get('icon'):
                rx,ry,rw,rh=n['iconRect'];paste(canvas,n['icon'],[x+rx,y+ry,rw,rh])
            if n['kind']=='button' and not n.get('labelHidden'):
                lr=n.get('labelRect',[0,0,w,h])
                if n.get('labelAsset'):paste(canvas,n['labelAsset'],[x+lr[0],y+lr[1],lr[2],lr[3]],'fill')
                text(canvas,COPY[n['text']],[x+lr[0],y+lr[1],lr[2],lr[3]],n.get('size',28),n.get('tone',''))
        elif n['kind']=='text':text(canvas,COPY[n['text']],rect,n.get('size',28),n.get('tone',''),n.get('align','center'))
        elif n['kind']=='surface':
            d=ImageDraw.Draw(canvas);d.rounded_rectangle([x,y,x+w,y+h],radius=24,fill='#f5e9d7' if n.get('style')=='speech' else '#14212a',outline='#927446',width=3)
        elif n['kind']=='connector':
            angle=math.radians(n['angle']);ImageDraw.Draw(canvas).line([x,y,x+math.cos(angle)*w,y+math.sin(angle)*w],fill=n['color'],width=4)
        elif n['kind']=='bar':
            d=ImageDraw.Draw(canvas);d.rounded_rectangle([x,y,x+w,y+h],radius=9,fill='#17232b',outline='#b29760',width=3);d.rounded_rectangle([x+3,y+3,x+w*n['value'],y+h-3],radius=6,fill='#edc04b' if n.get('gold') else '#39c6eb')
    canvas.convert('RGB').save(OUT/f'{key}-layers.jpg',quality=94)
board=Image.new('RGB',(1200,2160),'#12201e')
for i,key in enumerate(DATA['layout']['screens']):
    im=Image.open(OUT/f'{key}-layers.jpg');im.thumbnail((395,702));board.paste(im,((i%3)*400,(i//3)*720))
board.save(OUT/'nine-screens-layers.jpg',quality=94)
print('Rendered all nine layer proofs. These are not browser screenshots.')
