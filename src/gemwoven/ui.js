(() => {
  'use strict';
  const layout=window.GEMWOVEN_LAYOUT,assets=window.GEMWOVEN_ASSETS;
  const copy={...window.GEMWOVEN_DEFAULT_COPY,...window.GEMWOVEN_COPY};
  const state={screen:'home',mode:'solo',product:'fire-essence',quantity:1,groups:{},questHidden:false,hero:'fire',skill:0,category:'all',bagItem:'fire-essence',bagPage:0,bagPages:2};
  const editedCopy={};
  const game=window.GEMWOVEN_GAME;
  if(game)state.hero=game.initialHero;
  const $=id=>document.getElementById(id),scene=$('scene'),stage=$('stage'),dialog=$('preview-dialog');
  const iconFor={home:'nav-home',inventory:'nav-bag',skills:'nav-skills',arena:'nav-arena',summon:'nav-summon',shop:'icon-shop',forge:'icon-forge',upgrade:'nav-heroes',tavern:'icon-tavern'};
  if(game)for(const [key,entry]of Object.entries(game.extra))iconFor[key]=entry[1];
  const heroNames={novice:'Tân',fire:'Mika',ice:'Yuki',earth:'Nori',lightning:'Lumi',shadow:'Noct'};
  const idleMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
  idleMotion.addEventListener?.('change',()=>{if(state.screen==='home')render();});
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('page-hidden',document.hidden));
  const itemNames={'fire-essence':'Tinh Hoa Hỏa',coins:'Đồng Vàng',mana:'Đá Ngọc',amber:'Đá Nâng Cấp',scroll:'Sách Kỹ Năng','hero-fragment':'Mảnh Tướng',ticket:'Vé Triệu Hồi',chest:'Rương Hiếm',hammer:'Búa Rèn',potion:'Thuốc Đột Phá',ingot:'Thỏi Sắt',emerald:'Tinh Thạch Mộc','fire-sword':'Kiếm Hỏa Ngục','icon-book':'Sách Kinh Nghiệm','avatar-fire':'Mảnh Tướng Mika'};
  function art(key){const img=document.createElement('img');img.src=(assets[key]||assets['icon-hero']).file;img.alt='';img.draggable=false;return img;}
  function box(el,r){['left','top','width','height'].forEach((p,i)=>el.style[p]=`${r[i]}px`);}
  function setText(el,key,value){el.dataset.copy=key;el.textContent=value??copy[key]??'';}
  function decorateText(el,node){el.style.fontSize=`${node.size||28}px`;if(node.tone)el.classList.add(`tone-${node.tone}`);if(node.align)el.classList.add(`align-${node.align}`);}
  function engravedLabel(el,node){
    // Baselines measured on the actual painted signs, in source-image pixels.
    // The overlay uses the same viewBox/stretch as the artwork, including its perspective.
    const paintedSigns={
      'home.place-summon':{path:'M 170 440 Q 254 426 338 440',width:153,size:32},
      'home.place-arena':{path:'M 177 402 Q 260 387 343 402',width:160,size:31},
      'home.place-shop':{path:'M 182 454 Q 263 443 344 454',width:151,size:33},
      'home.place-upgrade':{path:'M 174 437 Q 257 425 340 437',width:154,size:34},
      'home.place-forge':{path:'M 214 194 Q 275 183 336 193',width:112,size:31},
      'home.place-tavern':{path:'M 218 186 Q 277 177 336 186',width:113,size:30},
      'home.quests':{path:'M 64 143 Q 149 139 234 143',width:160,size:29}
    };
    const painted=paintedSigns[node.id];
    if(painted){
      const asset=assets[node.asset],ns='http://www.w3.org/2000/svg',value=el.textContent;
      const svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path'),type=document.createElementNS(ns,'text'),line=document.createElementNS(ns,'textPath');
      const id='painted-sign-'+node.id.replace(/\W/g,'-');
      box(el,[0,0,node.rect[2],node.rect[3]]);el.classList.add('engraved-label','painted-sign-label');
      svg.setAttribute('viewBox',`0 0 ${asset.width} ${asset.height}`);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
      path.id=id;path.setAttribute('d',painted.path);path.setAttribute('fill','none');
      type.setAttribute('text-anchor','middle');type.style.fontSize=painted.size+'px';
      line.setAttribute('href','#'+id);line.setAttribute('startOffset','50%');line.setAttribute('textLength',painted.width);line.setAttribute('lengthAdjust','spacingAndGlyphs');line.textContent=value;
      type.append(line);svg.append(path,type);el.replaceChildren(svg);return;
    }
    if(node.id.endsWith('.nav-active-label'))el.classList.add('footer-menu-label');
  }
  function ambientScene(){
    const layer=document.createElement('div');layer.className='hub-ambience';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="hub-light"></div>'+Array.from({length:12},(_,i)=>`<i style="--x:${8+(i*29)%85}%;--y:${13+(i*19)%76}%;--delay:${-i*2.3}s;--duration:${17+i%5*3}s"></i>`).join('');
    scene.append(layer);
    const theme=layout.screens[state.screen]?.backgroundKey||state.screen;
    const recipe={
      inventory:['#ffd083',[[9,52,170],[85,58,180]]],skills:['#b8a1ff',[[48,37,260],[20,73,150]]],
      summon:['#8bcfff',[[50,48,250],[50,64,240]]],forge:['#ff8b43',[[50,43,280],[78,68,140]]],
      shop:['#ffe0a0',[[14,35,180],[82,41,180]]],upgrade:['#97dbb6',[[50,38,230],[84,27,130]]],
      tavern:['#ffe2af',[[17,43,180],[83,50,170]]],arena:['#ffb356',[[24,31,150],[77,30,150]]],
      home:['#b4daf9',[[50,58,220]]],campaign:['#c5edff',[[50,40,300]]]
    }[theme]||['#c9e4bb',[[12,35,180],[85,65,160]]];
    if(state.screen!=='home'){
      const life=document.createElement('div');life.className='scene-life';life.dataset.theme=theme;life.setAttribute('aria-hidden','true');
      life.style.setProperty('--color',recipe[0]);
      life.innerHTML=recipe[1].map(([x,y,size])=>`<i class="life-glow" style="--x:calc(${x}% - ${size/2}px);--y:calc(${y}% - ${size/2}px);--size:${size}px"></i>`).join('')+
        '<i class="life-mist" style="--y:62%"></i><i class="life-mist" style="--y:83%;animation-delay:-9s"></i>'+
        Array.from({length:14},(_,i)=>`<i class="life-particle" style="--x:${7+(i*29)%88}%;--y:${20+(i*17)%65}%;--duration:${5+i%5*1.4}s;--delay:${-i*.91}s"></i>`).join('');
      scene.append(life);
    }
    if(state.screen==='home'&&assets['bean-leaf']){
      const leaves=document.createElement('div');leaves.className='home-leaves';leaves.setAttribute('aria-hidden','true');
      for(let i=0;i<7;i++){const leaf=art('bean-leaf');leaf.style.cssText=`left:${12+(i*31)%77}%;top:${12+(i*17)%48}%;--delay:${-i*3.1}s;--duration:${12+i%3*3}s`;leaves.append(leaf);}
      scene.append(leaves);
    }
  }
  function buildingMotion(el,node){
    const kind=node.id.replace('home.place-','');
    if(!['summon','forge','upgrade','arena','tavern'].includes(kind))return;
    const fx=document.createElement('span');fx.className='home-building-fx fx-'+kind;fx.setAttribute('aria-hidden','true');
    fx.innerHTML='<i class="building-glow"></i>';
    if(kind==='summon')fx.innerHTML+='<i class="portal-ripple"></i><i class="portal-ripple second"></i>';
    const count=kind==='arena'?4:5;
    for(let i=0;i<count;i++){const mote=document.createElement('i');mote.className='building-mote';mote.style.setProperty('--i',i);fx.append(mote);}
    el.append(fx);
  }
  function profileNode(node){
    const p=game?.engine.read(),level=p?.heroes[p.selected]?.level||Number(copy[state.screen+'.level'])||1;
    const button=document.createElement('button');button.type='button';button.className='hud-profile';
    button.dataset.action=node.action;button.setAttribute('aria-label',`${copy[node.text]||'Tướng'} · Cấp ${level} / 500`);
    const portrait=document.createElement('span');portrait.className='hud-portrait';portrait.append(art(node.icon));
    const frame=art(node.asset);frame.className='hud-avatar-frame';
    const ns='http://www.w3.org/2000/svg',ring=document.createElementNS(ns,'svg');
    ring.setAttribute('viewBox','0 0 144 144');ring.classList.add('hud-experience');ring.setAttribute('aria-hidden','true');
    // Keep the same level progression as the hero screen; no synthetic XP is awarded.
    const xpArc='M 72 138 A 66 66 0 1 1 118.67 25.33';
    ring.innerHTML=`<path class="xp-bezel" d="${xpArc}"/><path class="xp-track" d="${xpArc}"/><path class="xp-fill" d="${xpArc}" pathLength="100" stroke-dasharray="${Math.min(100,level/500*100)} 100"/>`;
    const badge=document.createElement('span');badge.className='hud-level';badge.textContent=level;badge.setAttribute('aria-hidden','true');
    button.append(portrait,frame,ring,badge);return button;
  }
  function hangingChains(){
    if(!assets['hud-chain']||!assets['hud-side-card'])return;
    const card=assets['hud-side-card'],chain=assets['hud-chain'],cards=[...scene.querySelectorAll('.home-feature-card')];
    const socket=(el,point)=>[parseFloat(el.style.left)+point[0]*parseFloat(el.style.width)/card.width,parseFloat(el.style.top)+point[1]*parseFloat(el.style.height)/card.height];
    cards.forEach((el,index)=>card.sockets.top.forEach((point,side)=>{
      const end=socket(el,point);let start;
      if(index)start=socket(cards[index-1],card.sockets.bottom[side]);
      else{
        const profile=scene.querySelector('.hud-profile');
        if(!profile)return;
        const cx=parseFloat(profile.style.left)+72,cy=parseFloat(profile.style.top)+72;
        const dx=Math.max(-52,Math.min(52,end[0]-cx));start=[cx+dx,cy+Math.sqrt(66*66-dx*dx)];
      }
      const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
      const link=document.createElement('span');link.className='home-chain-link';link.setAttribute('aria-hidden','true');
      link.style.cssText=`left:${start[0]-6}px;top:${start[1]-5}px;height:${length+10}px;transform-origin:6px 5px;transform:rotate(${-Math.atan2(dx,dy)}rad)`;
      const tileHeight=12*chain.height/chain.width;
      for(let top=0;top<length+10;top+=tileHeight-1){const piece=art('hud-chain');piece.style.top=top+'px';piece.style.height=tileHeight+'px';link.append(piece);}
      scene.append(link);
    }));
  }
  function makeNode(node){
    node={...node};
    const hudRects={
      'gold-plate':[215,36,235,48],'gold-icon':[200,25,59,60],'gold':[259,38,151,40],'gold-plus':[412,35,39,43],
      'gem-plate':[490,36,235,48],'gem-icon':[476,22,54,70],'gems':[531,38,154,40],'gems-plus':[687,35,39,43]
    };
    const suffix=node.id.split('.').pop();if(hudRects[suffix])node.rect=hudRects[suffix];
    if(['central-crystal','floating-sword','product-preview'].includes(suffix))node.className=((node.className||'')+' is-living-crystal').trim();
    const displayedHero=game&&node.id==='home.hero'?game.engine.read().selected:state.hero;
    const formBody=['home.hero','upgrade.hero-model','skills.hero-model'].includes(node.id);
    const bodyForm=formBody&&game?window.GemwovenProgression.heroForm(displayedHero,game.engine.read().heroes[displayedHero]):1;
    if(node.id.endsWith('.profile'))node.icon=`portrait-${game?game.engine.read().selected:state.hero}`;
    if(['upgrade.hero-model','home.hero'].includes(node.id)){node.asset=`hero-${displayedHero}`;node.action=`hero:${displayedHero}`;copy[node.text]=heroNames[displayedHero];}
    if(node.id==='home.hero'||formBody&&bodyForm>1){
      const idle=`home-idle-${displayedHero}${idleMotion.matches?'-poster':''}`;
      if(assets[idle])node.asset=idle;
    }
    if(['upgrade.evolution-now','upgrade.evolution-next','upgrade.evolution-locked'].includes(node.id)){node.asset=`portrait-${state.hero}`;if(node.id.endsWith('now'))node.action=`hero:${state.hero}`;}
    let el;
    if(node.id.endsWith('.profile')){node.rect=[20,7,144,144];el=profileNode(node);}
    else if(node.kind==='content'){el=document.createElement('section');el.className='live-panel';el.style.backgroundImage=`url("${assets[node.backgroundAsset||'panel-parchment'].file}")`;el.style.setProperty('--game-button-art',`url("${new URL(assets['button-gold'].file,document.baseURI).href}")`);node.build(el);}
    else if(suffix==='footer-board'){
      el=document.createElement('span');el.className='footer-shell';const board=art(node.asset);board.className='footer-plank';el.append(board);
      if(assets['hud-menu-vine'])for(const side of ['left','right']){const vine=art('hud-menu-vine');vine.className='footer-vine '+side;el.append(vine);}
    }
    else if(node.kind==='image'){
      if(formBody){el=document.createElement('span');const body=art(node.asset);body.className='art';body.style.objectFit=node.fit||'contain';el.append(body);}
      else el=art(node.asset);
    }
    else if(node.kind==='button'){
      el=document.createElement('button');el.type='button';el.dataset.action=node.action;
      if(node.disabled)el.disabled=true;
      for(const [key,value]of Object.entries(node.data||{}))el.dataset[key]=value;
      el.setAttribute('aria-label',copy[node.text]);
      const bg=art(node.asset);bg.className='art';bg.style.objectFit=node.fit||'contain';if(node.id==='home.hero')bg.style.objectPosition='center bottom';el.append(bg);
      if(node.className?.includes('home-place'))buildingMotion(el,node);
      if(node.icon){const icon=art(node.icon);icon.className='icon';box(icon,node.iconRect);el.append(icon);}
      if(node.labelAsset){const plate=art(node.labelAsset);plate.className='label-art';box(plate,node.labelRect);el.append(plate);}
      if(!node.labelHidden){const label=document.createElement('span');label.className='copy-layer';setText(label,node.text);decorateText(label,node);if(node.labelRect)box(label,node.labelRect);engravedLabel(label,node);el.append(label);}
      const selected=node.group?(state.groups[node.group]?state.groups[node.group]===node.id:node.selected):node.selected;
      if(selected)el.classList.add('selected');
      if(node.group){el.dataset.group=node.group;el.setAttribute('aria-pressed',String(!!selected));}
      if(node.role==='nav'&&node.selected)el.setAttribute('aria-current','page');
      if(node.labelHidden)el.title=copy[node.text];
    } else {
      el=document.createElement(node.kind==='text'?'span':'div');
      if(node.kind==='text'){setText(el,node.text);decorateText(el,node);engravedLabel(el,node);}
      if(node.kind==='bar'){const fill=document.createElement('i');fill.style.width=`${node.value*100}%`;el.append(fill);if(node.gold)el.classList.add('gold');}
      if(node.kind==='connector'){el.style.transform=`rotate(${node.angle}deg)`;el.style.background=node.color;el.style.color=node.color;}
      if(node.style)el.classList.add(node.style);
    }
    el.classList.add('node',`node-${node.kind}`);if(node.className)el.classList.add(...node.className.split(' '));
    el.dataset.node=node.id;if(node.asset)el.dataset.asset=node.asset;
    box(el,node.rect);if(node.kind==='image')el.style.objectFit=node.fit||'contain';
    if(formBody&&game){
      const target=node.id==='home.hero'?270:350;
      window.GEMWOVEN_FORMS?.fitBody(el,assets[node.asset],target);
      window.GEMWOVEN_FORMS?.decorateBody(el,displayedHero,bodyForm);
    }
    return el;
  }
  function fit(){
    const mobile=innerWidth<=700;
    const exploring=state.screen==='campaign';
    const availableWidth=mobile||exploring?innerWidth:innerWidth-300;
    const availableHeight=exploring?innerHeight:mobile?Math.max(500,innerHeight-92):innerHeight-24;
    const scale=Math.max(.18,Math.min(availableWidth/941,availableHeight/1672,1));
    stage.style.transform=`scale(${scale})`;$('viewport').style.width=`${941*scale}px`;$('viewport').style.height=`${1672*scale}px`;
  }
  function nodeBy(id){return scene.querySelector(`[data-node="${state.screen}.${id}"]`);}
  function changeText(id,value){const el=scene.querySelector(`[data-copy="${state.screen}.${id}"]`);if(el)el.textContent=value;}
  function render(){
    window.GEMWOVEN_REBUILD?.(state);
    if(game)game.decorate(state);
    // Live values and newly created labels must be copied after decoration.
    // The initial copy snapshot predates menu labels and real wallet values.
    if(game)Object.assign(copy,window.GEMWOVEN_DEFAULT_COPY);
    if(['skills','inventory'].includes(state.screen)){
      const contextual=/^(skills\.(skill-category|skill-level|hero-model|node-\d)|inventory\.(detail-art|item-type|item-action|held-count|page))$/;
      for(const [key,value] of Object.entries(window.GEMWOVEN_DEFAULT_COPY))if(key.startsWith(state.screen+'.'))copy[key]=game||contextual.test(key)?value:(window.GEMWOVEN_COPY?.[key]??value);
    }
    Object.assign(copy,editedCopy);
    document.body.classList.toggle('exploration-open',state.screen==='campaign');stage.dataset.screen=state.screen;
    const screen=layout.screens[state.screen],backgroundKey=screen.backgroundKey||state.screen;
    if(assets['background-'+backgroundKey])screen.background=assets['background-'+backgroundKey].file;
    scene.replaceChildren();scene.style.backgroundImage=`url("${window.GEMWOVEN_BACKDROPS?.[backgroundKey]?.background||screen.background}")`;
      const frag=document.createDocumentFragment();for(const node of screen.nodes){if(/\.(level-plate|level-meter|level-badge|level)$/.test(node.id))continue;frag.append(makeNode(node));}scene.append(frag);hangingChains();ambientScene();
    stage.setAttribute('aria-label',screen.name);
    document.title=`Gemwoven · ${screen.name}`;
    document.querySelectorAll('#screen-menu button').forEach(b=>{if(b.dataset.screen===state.screen)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    scene.classList.remove('scene-enter');void scene.offsetWidth;scene.classList.add('scene-enter');
    if(!game){if(state.screen==='shop')refreshProduct();if(state.screen==='tavern'&&state.questHidden)setQuestHidden(true);
    if(state.screen==='forge'&&state.groups['forge-tab'])changeText('forge-action',['CHẾ TẠO','CƯỜNG HÓA','KHẢM NGỌC'][Number(state.groups['forge-tab'].slice(-1))]);
    if(state.screen==='upgrade'&&state.groups['upgrade-tab'])changeText('upgrade-action',['Tăng Level','Tăng Sao','Tiến Hóa'][Number(state.groups['upgrade-tab'].slice(-1))]);}
    if(game)game.mount(state,{navigate,render,showModal});
    setEditMode($('edit-copy').checked);fit();requestAnimationFrame(fitCopy);
  }
  function fitCopy(){
    // A DOM-only test has zero layout metrics; browsers fit replacement copy.
    scene.querySelectorAll('[data-copy]').forEach(el=>{
      if(!el.clientWidth||el.isContentEditable||el.classList.contains('engraved-label'))return;
      let size=parseFloat(el.style.fontSize)||28;
      while(size>12&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1))el.style.fontSize=`${--size}px`;
    });
  }
  function navigate(key){
    if(!layout.screens[key]){showDirectory();return;}
    if(dialog.open)dialog.close();if(location.hash===`#${key}`){state.screen=key;render();}else location.hash=key;
  }
  function showModal(title,images=[],description='',links=[]){
    $('dialog-title').textContent=title;$('dialog-copy').textContent=description;
    $('dialog-art').replaceChildren(...images.filter(k=>assets[k]).map(art));$('dialog-links').replaceChildren();
    for(const link of links){
      const b=document.createElement(link.href?'a':'button');b.textContent=link.label;
      if(link.href)b.href=link.href;else{b.type='button';b.addEventListener('click',()=>navigate(link.route));}
      if(link.icon)b.prepend(art(link.icon));$('dialog-links').append(b);
    }
    if(!dialog.open)dialog.showModal();
  }
  function showDirectory(){showModal('Khám phá Gemwoven',[],'',(layout.order||Object.keys(layout.screens)).map(key=>({label:layout.names[key],route:key,icon:iconFor[key]})));}
  function chooseGroup(button){
    if(!button.dataset.group)return;state.groups[button.dataset.group]=button.dataset.node;
    scene.querySelectorAll(`[data-group="${button.dataset.group}"]`).forEach(el=>{const selected=el===button;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
  }
  function refreshProduct(){
    const item=layout.screens.shop.products.find(p=>p[0]===state.product),preview=nodeBy('product-preview');
    preview.querySelector('.art').src=assets[state.product].file;preview.dataset.asset=state.product;preview.setAttribute('aria-label',item[1]);
    changeText('product-name',item[1]);changeText('product-description',state.product==='fire-essence'?copy['shop.product-description']:({coins:'Những đồng vàng lấp lánh\ncho hành trình của bạn.',mana:'Ngọc xanh chứa đựng\nánh sáng diệu kỳ.',ticket:'Tấm vé kết nối\nnhững người bạn mới.'}[state.product]||`${item[1]}\nVật phẩm trong cửa hàng.`));
    changeText('quantity',String(state.quantity));const price=Number(item[2].replaceAll(',',''))*state.quantity;changeText('purchase-price',`● ${price.toLocaleString('en-US')}`);
  }
  function setQuestHidden(hidden){
    state.questHidden=hidden;
    for(const n of layout.screens.tavern.nodes){if(n.id.startsWith('tavern.quest-')||n.id==='tavern.reward-heading'){const el=scene.querySelector(`[data-node="${n.id}"]`);if(el)el.hidden=hidden;}}
  }
  function activate(action,button){
    requestAnimationFrame(fitCopy);
    if(game?.handle(action,button,{navigate,render,showModal},state))return;
    const [type,value]=action.split(':');chooseGroup(button);
    if(type==='route')return navigate(value);
    if(type==='select-hero'){state.hero=value;state.skill=0;render();return;}
    if(type==='skill'){state.skill=Number(value);render();return;}
    if(type==='skill-locked')return showModal('Nhánh chưa thức tỉnh',['skill-lock'],'Tiếp tục phát triển tướng để mở thêm nhánh kỹ năng.');
    if(type==='skill-upgrade'){
      const hero=window.GEMWOVEN_HEROES[state.hero],skill=hero.skills[state.skill];
      return showModal(skill[0],[`skill-${state.hero}-${state.skill}`],skill[2]);
    }
    if(type==='bag-item'){state.bagItem=value;render();return;}
    if(type==='bag-page'){state.bagPage=(state.bagPage+Number(value)+state.bagPages)%state.bagPages;render();return;}
    if(type==='bag-category'){
      state.category=value;state.bagPage=0;
      const items=window.GEMWOVEN_INVENTORY.filter(p=>value==='all'||p[3]===value);
      if(!items.some(p=>p[0]===state.bagItem))state.bagItem=items[0]?.[0]||'';render();return;
    }
    if(type==='mode'){state.mode=value;return;}
    if(type==='quantity'){state.quantity=Math.min(99,Math.max(1,state.quantity+Number(value)));refreshProduct();return;}
    if(type==='product'){state.product=value;state.quantity=1;refreshProduct();return;}
    if(type==='item')return showModal(window.GEMWOVEN_INVENTORY?.find(p=>p[0]===value)?.[1]||itemNames[value]||'Trang bị',[value]);
    if(type==='hero'){state.hero=value;state.skill=0;return navigate('upgrade');}
    if(type==='selected-product')return showModal(itemNames[state.product],[state.product]);
    if(type==='battle')return showModal(`Đấu trường ${state.mode==='solo'?'1v1':'3v3'}`,['hero-fire','hero-ice'],'',[{label:'Vào trận',href:'Game.html'}]);
    if(type==='summon')return showModal(value==='ten'?'Triệu Hồi ×10':'Triệu Hồi ×1',['summon-crystal','gem-fire'],'',[{label:'Xem tướng',route:'upgrade'}]);
    if(type==='forge-preview'){const tab=Number((state.groups['forge-tab']||'1').slice(-1));return showModal(['Chế Tạo','Cường Hóa','Khảm Ngọc'][tab],['fire-sword'],tab===1?'+8  →  +9':'Kiếm Hỏa Ngục');}
    if(type==='upgrade-preview'){const tab=Number((state.groups['upgrade-tab']||'0').slice(-1));return showModal(['Tăng Level','Tăng Sao','Tiến Hóa'][tab],[`hero-${state.hero}`],tab===0?'Lv.32  →  Lv.33':heroNames[state.hero]);}
    if(type==='forge-tab'){changeText('forge-action',['CHẾ TẠO','CƯỜNG HÓA','KHẢM NGỌC'][value]);return;}
    if(type==='upgrade-tab'){changeText('upgrade-action',['Tăng Level','Tăng Sao','Tiến Hóa'][value]);return;}
    if(type==='shop-tab')return;
    if(type==='quest-dismiss')return setQuestHidden(true);
    if(type==='tavern-tab'){setQuestHidden(false);changeText('quest-heading',['Tin Đồn','Nhiệm Vụ','Tình Thân','Chiêu Mộ'][value]);return;}
    if(type==='quest-preview')return showModal('Người lữ hành bí ẩn',['quest-scene'],'Một cuộc gặp gỡ mới ở rìa rừng.',[{label:'Triệu hồi',route:'summon'}]);
    const previews={mail:['Hòm Thư','icon-mail'],settings:['Cài Đặt','icon-settings'],event:['Sự Kiện','icon-event'],gift:['Phúc Lợi','icon-gift'],book:['Thẻ Tháng','icon-book'],chat:['Cộng Đồng','icon-chat'],trophy:['Thành Tựu','icon-trophy'],crown:['Bảng Xếp Hạng','icon-crown'],ranking:['Xếp Hạng','rank-gold'],rewards:['Phần Thưởng','chest'],summon:['Triệu Hồi','summon-crystal'],evolution:['Chân Thân','gem-fire']};
    if(type==='preview'){const entry=previews[value]||['Gemwoven','mana'];showModal(entry[0],[entry[1]]);}
  }
  function setEditMode(enabled){stage.classList.toggle('edit-copy',enabled);scene.querySelectorAll('[data-copy]').forEach(el=>{el.contentEditable=enabled?'true':'false';el.spellcheck=false;});if(!enabled)requestAnimationFrame(fitCopy);}
  scene.addEventListener('click',e=>{if($('edit-copy').checked&&e.target.closest('[data-copy]'))return;const b=e.target.closest('button[data-action]');if(b)activate(b.dataset.action,b);});
  scene.addEventListener('input',e=>{const el=e.target.closest('[data-copy]');if(el){copy[el.dataset.copy]=el.textContent;editedCopy[el.dataset.copy]=el.textContent;const button=el.closest('button');if(button)button.setAttribute('aria-label',el.textContent);}});
  for(const key of (layout.order||Object.keys(layout.screens))){
    const button=document.createElement('button');button.type='button';button.dataset.screen=key;button.append(art(iconFor[key]),document.createTextNode(layout.names[key]));button.addEventListener('click',()=>navigate(key));$('screen-menu').append(button);
  }
  $('show-bounds').addEventListener('change',e=>stage.classList.toggle('show-bounds',e.target.checked));
  $('hide-copy').addEventListener('change',e=>stage.classList.toggle('hide-copy',e.target.checked));
  $('edit-copy').addEventListener('change',e=>setEditMode(e.target.checked));
  $('export-copy').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gemwoven-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('close-dialog').addEventListener('click',()=>dialog.close());$('return-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);state.screen=layout.screens[key]?key:'home';render();});
  window.addEventListener('resize',fit);
  const initial=location.hash.slice(1);state.screen=layout.screens[initial]?initial:'home';render();
})();
