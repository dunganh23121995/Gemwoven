"""Static layer review from DOM snapshots; does not replace browser layout QA."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parents[2]
QA = Path(__file__).resolve().parent
FONT = 'C:/Windows/Fonts/cambriab.ttf'


def paste(canvas, src, box, fit='contain', flip=False):
    im = Image.open(ROOT / src).convert('RGBA')
    if flip:
        im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    x, y, w, h = map(round, box)
    if w <= 0 or h <= 0:
        return
    if fit != 'fill':
        scale = min(w / im.width, h / im.height)
        nw, nh = round(im.width * scale), round(im.height * scale)
        x += (w - nw) // 2
        y += (h - nh) // 2
        w, h = nw, nh
    im = im.resize((w, h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(im, (x, y))


def draw_text(canvas, value, box, size, tone):
    x, y, w, h = box
    draw = ImageDraw.Draw(canvas)
    for size in range(round(size), 11, -1):
        font = ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf' if any(c in value for c in '★☆') else FONT, size)
        lines = []
        for paragraph in value.split('\n'):
            line = ''
            for word in paragraph.split(' '):
                proposed = (line + ' ' + word).strip()
                if draw.textlength(proposed, font=font) > w and line:
                    lines.append(line)
                    line = word
                else:
                    line = proposed
            lines.append(line)
        if len(lines) * size * 1.16 <= h:
            break
    color = {'ink': '#49301a', 'green': '#85dc4c', 'gold': '#ffe9bc'}[tone]
    top = y + (h - len(lines) * size * 1.16) / 2
    for i, line in enumerate(lines):
        width = draw.textlength(line, font=font)
        point = (x + (w - width) / 2, top + i * size * 1.16)
        if tone != 'ink':
            draw.text((point[0]+1, point[1]+2), line, font=font, fill='#27180c')
        draw.text(point, line, font=font, fill=color)


def main():
    captures = json.loads((QA / 'layout.json').read_text(encoding='utf-8'))
    thumbs = Image.new('RGB', (4 * 282, ((len(captures)+3)//4) * 522), '#14251f')
    for index, page in enumerate(captures):
        canvas = Image.open(ROOT / page['background']).convert('RGBA').resize((941, 1672))
        if page.get('map') and page['map'].get('background'):
            data=page['map'];origin=data.get('origin',0);scroll=min(data['scroll'],data.get('height',8360)-1492)
            viewport=Image.new('RGBA',(941,1492))
            profile=data.get('profile',{})
            if profile.get('bands'):
                tile=Image.new('RGBA',(941,round(profile['tileHeight'])))
                for band in profile['bands']:
                    part=Image.new('RGBA',(941,round(band['height']+.4)))
                    paste(part,data['background'],[*band['artOffset'],*band['artSize']],'fill')
                    tile.alpha_composite(part,(0,round(band['top'])))
                tile=ImageEnhance.Brightness(ImageEnhance.Color(tile).enhance(.94)).enhance(.9)
                alpha=tile.getchannel('A')
                for row in range(32):alpha.paste(alpha.crop((0,row,941,row+1)).point(lambda a:round(a*row/32)),(0,row))
                tile.putalpha(alpha)
                absolute=origin+scroll;section=int(absolute//profile['stride'])
                for header_section in [section-1,section]:canvas.alpha_composite(tile,(0,round(180+header_section*profile['stride']-absolute-profile.get('bleed',0))))
                for section in range(data['islands']):viewport.alpha_composite(tile,(0,round(section*profile['stride']-absolute-profile.get('bleed',0))))
            else:
                for section in range(data.get('islands',5)):paste(viewport,data['background'],[0,section*1672-origin-scroll,941,1672],'fill')
            for pin in data['pins']:
                px,py,pw,ph=pin['rect'];py-=scroll
                if py<-250 or py>1450:continue
                for im in pin['images']:
                    rect=[px-pw*.1,py+ph*.57,pw*1.2,ph*.53] if im['platform'] else [px-pw*.07,py-ph*.3,pw*1.14,ph*1.14]
                    if im.get('lock'):rect=[px+pw*.63,py+ph*.5,pw*.44,ph*.44]
                    if im.get('hero'):rect=[px-pw*.15,py-ph*.405,pw*1.3,ph*1.24]
                    paste(viewport,im['src'],rect)
                draw_text(viewport,pin['label'],[px+pw*.32,py+ph*.75,pw*.36,ph*.25],23,'gold')
                if pin.get('name'):
                    rect=[px-pw*.1-174 if pin.get('labelLeft') else px+pw*1.1,py+ph*.08,174,30]
                    ImageDraw.Draw(viewport).rounded_rectangle((rect[0],rect[1],rect[0]+rect[2],rect[1]+rect[3]),radius=18,fill='#253327',outline='#dfc28c')
                    draw_text(viewport,pin['name'],rect,20,'gold')
                draw_text(viewport,pin['stars'],[px-pw*.25,py+ph*1.02,pw*1.5,26],21,'gold')
            for cloud in data.get('clouds',[]):
                x,y,w,h=cloud['rect']
                bank=Image.new('RGBA',(round(w),round(h)))
                for layer in cloud['layers']:paste(bank,layer['src'],layer['rect'],'fill')
                alpha=bank.getchannel('A')
                for row in range(max(0,bank.height-12),bank.height):alpha.paste(alpha.crop((0,row,bank.width,row+1)).point(lambda a:round(a*(bank.height-row)/12)),(0,row))
                bank.putalpha(alpha)
                viewport.alpha_composite(bank,(round(x),round(y-scroll)))
                if h+180-scroll>0:
                    sky=Image.new('RGBA',(941,180))
                    for layer in cloud['layers']:
                        lx,ly,lw,lh=layer['rect'];paste(sky,layer['src'],[lx,ly+180-scroll,lw,lh],'fill')
                    canvas.alpha_composite(sky)
            canvas.alpha_composite(viewport,(0,180))
        stages = sorted((n for n in page['nodes'] if '.stage-' in n['id']), key=lambda n:int(n['id'].rsplit('-',1)[1]))
        for node in page['nodes']:
            if node['id']=='campaign.map':continue
            x, y, w, h = node['rect']
            if '.path-' in node['id'] and node['id'].rsplit('-',1)[1].isdigit():
                i = int(node['id'].rsplit('-',1)[1])
                a, b = stages[i]['rect'], stages[i+1]['rect']
                ImageDraw.Draw(canvas).line((a[0]+a[2]/2,a[1]+a[3]/2,b[0]+b[2]/2,b[1]+b[3]/2),fill='#b99c59',width=8)
            if node['src']:
                paste(canvas, node['src'], node['rect'], 'fill' if any(p in node['id'] for p in ['board','panel','strip','flag']) else 'contain')
            if node['id'].endswith(('-plate','-badge')):
                ImageDraw.Draw(canvas).rounded_rectangle((x,y,x+w,y+h), radius=18, fill='#142025', outline='#a08956', width=3)
            if node['kind'] == 'bar':
                ImageDraw.Draw(canvas).rounded_rectangle((x,y,x+w,y+h), radius=8, fill='#163b3c', outline='#aa915d', width=3)
            for im in node['images']:
                rx, ry, rw, rh = im['rect']
                if None in (rx,ry,rw,rh):
                    continue
                paste(canvas, im['src'], [x+rx,y+ry,rw,rh], im['fit'], node['id']=='arena.fighter-ice')
            for t in node['texts']:
                rx, ry, rw, rh = t['rect']
                draw_text(canvas, t['value'], [x+rx,y+ry,rw,rh], t['size'], t['tone'])
        canvas.convert('RGB').save(QA / ('layers-'+page['key']+'.jpg'), quality=92)
        thumb = canvas.convert('RGB').resize((282,501))
        tx, ty = index % 4 * 282, index // 4 * 522
        thumbs.paste(thumb, (tx,ty+21))
        ImageDraw.Draw(thumbs).text((tx+8,ty+3), page['key'], fill='#ffe0aa')
    thumbs.save(QA / 'layers-contact.jpg', quality=95)
    print('Rendered static layer previews:', len(captures))


if __name__ == '__main__':
    main()
