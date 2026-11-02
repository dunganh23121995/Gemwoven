/* Home navigation, confirmed summons, exploration and social/audio surfaces. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const img=(key,cls='')=>`<img class="${cls}" src="${esc((A[key]||A['icon-hero']).file)}" alt="" draggable="false">`;
  function text(key,id,value,rect,size=26,tone='gold'){const name=key+'.'+id;C[name]=String(value);return {id:name,kind:'text',text:name,rect,size,tone};}
  function button(key,id,label,asset,rect,action,data={},extra={}){return {...text(key,id,label,rect),kind:'button',asset,action,data,fit:'fill',...extra};}
  function image(key,id,asset,rect){return {id:key+'.'+id,kind:'image',asset,rect,fit:'fill'};}
  const frame=(key,asset,build,cls='')=>({id:key+'.surface',kind:'content',rect:[73,180,795,1278],backgroundAsset:A[asset]?asset:'panel-parchment',className:'crafted-panel '+cls,build});
  const resourceText=reward=>Object.entries(reward).map(([key,n])=>`${fmt(n)} ${M.RESOURCES[key][0]}`).join(' · ');
  L.names.campaign='Khám Phá';L.screens.campaign.name='Khám Phá';L.names.chat='Trò Chuyện';L.screens.chat.name='Trò Chuyện';
  L.names.settings='Âm Thanh';L.screens.settings.name='Âm Thanh';
  function home(nodes,p){
    nodes=nodes.filter(n=>!/^home\.(live|feature-mail|feature-settings)$/.test(n.id));
    // Quests live in the tavern; this board reads the power of the hero standing beside it.
    const power=nodes.find(n=>n.id==='home.power');C[power.text]=`Lực Chiến\n${fmt(M.stats(p,p.selected).power)}`;
    Object.assign(power,{rect:[713,1146,210,173],iconRect:[85,16,40,44],labelRect:[22,62,166,84]});
    const hero=nodes.find(n=>n.id==='home.hero');if(hero){hero.rect=[391,1010,184,270];hero.kind='button';hero.text='home.hero';hero.labelHidden=true;C['home.hero']='Tướng';}
    nodes.push(button('home','feature-monthly','Thẻ Tháng','side-pennant',[10,421,96,109],'journey:monthly',{}, {icon:'icon-book'}));
    nodes.push(button('home','feature-chat','Trò Chuyện','side-pennant',[10,553,96,109],'route:chat',{}, {icon:'icon-chat'}));
    [['offline','Kho Offline','chest'],['boss','Boss Vô Hạn','nav-arena'],['rankings','Xếp Hạng','rank-gold']].forEach(([route,name,asset],i)=>nodes.push(button('home','right-'+route,name,asset,[841,160+i*112,98,104],'route:'+route,{}, {labelHidden:true,fit:'contain',className:'home-right-icon'})));
    nodes.push(button('home','explore','Khám Phá',A['journey-button']?'journey-button':'title-parchment',[215,1338,525,140],'route:campaign',{}, {labelRect:[130,44,265,56],size:43,tone:'ink',className:'explore-entry'}));
    return nodes;
  }
  // One source-art layout for every left hanging menu; its axis is the avatar's.
  function hangingMenu(nodes){
    const card=A['hud-side-card'];if(!card)return;
    const width=128,height=164,center=92;
    const scaleRect=r=>r.map((v,k)=>v*(k%2?height/card.height:width/card.width));
    const cards=nodes.filter(n=>n.kind==='button'&&n.rect[0]<200&&
      (n.id.startsWith('home.feature-')||n.asset==='side-pennant'||n.asset==='hud-side-card'));
    cards.forEach((n,i)=>{
      n.asset='hud-side-card';n.rect=[center-width/2,166+i*162,width,height];n.fit='fill';
      n.iconRect=scaleRect(card.safeRects.icon);n.labelRect=scaleRect(card.safeRects.label);
      // Label spans the plate's full painted width so it can be read on a phone.
      n.labelRect=scaleRect([18,213,220,64]);n.size=23;n.labelHidden=false;n.className='home-feature-card hud-hanging-card';
      if(n.id.endsWith('.side-book'))n.action='journey:monthly';
    });
  }
  // The maps fill the whole screen, under the HUD (its top 180px).
  const mapTop=0,mapViewport=1672,hudHeight=180;
  const rankedHeroes=p=>Object.keys(p.heroes).filter(key=>M.HEROES[key]).map(key=>({key,stats:M.stats(p,key)})).sort((a,b)=>b.stats.power-a.stats.power||p.heroes[b.key].level-p.heroes[a.key].level||a.key.localeCompare(b.key));
  const chapterOpen=(p,n)=>p.campaign.cleared>=(n-1)*50;
  // The hero chosen in town fights the stages and stands on the map (the strongest owned one if none is chosen).
  const fighter=p=>p.heroes[p.selected]&&M.HEROES[p.selected]?p.selected:rankedHeroes(p)[0]?.key;
  // A chapter's painted floating island (assets/gemwoven/backgrounds/chapters, ten stone landings each) stacked
  // five times for its 50 stages; an expansion chapter uses its base theme's painting.
  function mapProfile(chapter){
    const theme=A['chapter-'+chapter.id]?chapter.id:A['chapter-'+chapter.backdrop]?chapter.backdrop:'forest',asset=A['chapter-'+theme];
    // Each painting's empty sky (top 280px) and its footer mist slide under the next one: the islands sit close.
    const tile=asset.height,overlap=480,tiles=5,pitch=tile-overlap;
    return {theme,assetKey:'chapter-'+theme,background:asset.file,centers:asset.stageCenters,tile,overlap,tiles,pitch,height:tiles*pitch+overlap,mode:'island-tiles'};
  }
  // Where stage i (0-based in the chapter) stands: tile 0 (stages 1-10) at the bottom.
  const stagePoint=(profile,i)=>{const k=Math.floor(i/10),[x,y]=profile.centers[i%10];return [x,(profile.tiles-1-k)*profile.pitch+y];};
  // The chapter map is drawn closer than its painting (ZOOM): a screen shows five or six stages, each landing large.
  // Only the painting's middle is in view (its path runs at x 350-600 of 941); the scenery at its sides is cropped.
  // Creatures and the hero keep their size on screen, so next to the enlarged landings they stand smaller.
  const ZOOM=1.5,MAP_W=941*ZOOM,MAP_X=(941-MAP_W)/2;
  // A stage is a flat ring decal (atlas/ui/ring-*, drawn from straight above) laid on the painted landing: squashed
  // to the landings' perspective (FLAT), it lies in their plane. Its number stands on a small plaque at its front.
  const RING={normal:300,elite:300,boss:370},FLAT=.4;
  // A baked rig loop has its own 6x4 grid (journey.css .map-idle[data-rig]); its length comes from the sheet.
  function rigLoop(el,sheet){if(sheet.cols===6){el.dataset.rig='';el.style.setProperty('--rig-ms',sheet.ms+'ms');}return el;}
  // A resting loop (2x4 sheet, 256px cells, feet at 94% of a cell) standing with its feet on a point.
  function idleActor(sheetKey,fallback,height,x,y){
    const sheet=A[sheetKey],cell=height/.78,el=document.createElement('span');el.className='pin-creature map-idle';
    el.style.cssText=`left:${x-cell/2}px;top:${y-cell*.94}px;width:${cell}px;height:${cell}px`;
    if(sheet){el.style.backgroundImage=`url("${new URL(sheet.file,document.baseURI).href}")`;el.dataset.frames=sheet.count;el.style.animationDelay=`${-(x*7+y)%1200}ms`;rigLoop(el,sheet);}
    else el.innerHTML=img(fallback,'pin-creature-still');
    return el;
  }
  // The painting's waterfalls, streams and lava flow (assets/gemwoven/backgrounds/chapters/flow): the flowing streak
  // texture (atlas/ui/water-flow) runs down each fall and along each stream, masked to the painted liquid, over the
  // tile it belongs to (and under the painting overlapping it).
  function flowOn(world,profile,top,z,first){
    const url=key=>`url("${new URL(A[key].file,document.baseURI).href}")`,tex=url('water-flow'),h=profile.tile*ZOOM;
    for(const material of ['water','lava']){
      const fall=A[`flow-${profile.theme}-${material}-fall`],stream=A[`flow-${profile.theme}-${material}-stream`];
      if(fall){const el=document.createElement('div');el.className=`island-flow fall ${material}`+(first?' first':'');el.setAttribute('aria-hidden','true');
        el.style.cssText=`left:${MAP_X}px;top:${top}px;width:${MAP_W}px;height:${h}px;z-index:${z}`;el.style.setProperty('--mask',url(`flow-${profile.theme}-${material}-fall`));el.style.setProperty('--tex',tex);
        el.innerHTML='<i></i>';world.append(el);}
      if(stream)for(const s of stream.streams){
        const [x0,y0,x1,y1]=s.box.map(v=>v*ZOOM),el=document.createElement('div');el.className=`island-flow stream ${material}`;el.setAttribute('aria-hidden','true');
        el.style.cssText=`left:${MAP_X+x0}px;top:${top+y0}px;width:${x1-x0}px;height:${y1-y0}px;z-index:${z};--mask-x:${-x0}px;--mask-y:${-y0}px;--map-w:${MAP_W}px;--map-h:${h}px;--turn:${s.dir-90}deg`;
        el.style.setProperty('--mask',url(`flow-${profile.theme}-${material}-stream`));el.style.setProperty('--tex',tex);el.innerHTML='<i></i>';world.append(el);}
    }
  }
  function mapContent(el,p,state,chapter){
    const start=(chapter.index-1)*50+1,profile=mapProfile(chapter),visible=50,leader=fighter(p);
    const cleared=Math.max(0,Math.min(50,p.campaign.cleared-start+1));
    // A chapter shows all its 50 stages: those not reached yet are locked (their elite and boss already standing
    // on them), never hidden. The map starts a little above stage 50, room for the boss under the HUD.
    const origin=stagePoint(profile,49)[1]-(hudHeight+420)/ZOOM,height=(profile.height-origin)*ZOOM;
    // Painting point -> map point.
    const at=([x,y])=>[x*ZOOM+MAP_X,(y-origin)*ZOOM];
    // Behind an open stage card the map dims, so the card is the one thing in focus.
    if(state.mapStage)el.classList.add('behind-card');
    const shade=document.createElement('div');shade.className='map-hud-shade';shade.setAttribute('aria-hidden','true');el.append(shade);
    const world=document.createElement('div');world.className='map-world island-map';world.style.height=height+'px';world.style.setProperty('--zoom',ZOOM);
    world.dataset.origin=origin;world.dataset.zoom=ZOOM;world.dataset.profile=JSON.stringify(profile);el.append(world);
    const paint=(cls,top,h,z)=>{const tile=document.createElement('img');tile.className=cls;tile.src=profile.background;tile.alt='';tile.draggable=false;
      tile.style.cssText=`left:${MAP_X}px;width:${MAP_W}px;top:${top}px;height:${h}px`+(z?`;z-index:${z}`:'');world.append(tile);};
    // Above the top painting (room for the boss under the HUD) its own sky continues, stretched upward.
    if(origin<0)paint('island-sky',0,(-origin+340)*ZOOM);
    // Each lower painting lies over the one above it, its sky fading into that one's rock.
    for(let k=0;k<profile.tiles;k++){const top=((profile.tiles-1-k)*profile.pitch-origin)*ZOOM;if(top+profile.tile*ZOOM>=0){paint('island-tile'+(k===profile.tiles-1?' first':''),top,profile.tile*ZOOM,profile.tiles-k);flowOn(world,profile,top,profile.tiles-k,k===profile.tiles-1);}}
    // Where one island painting meets the next, a rope bridge climbs from the last landing of the lower island to
    // the first of the upper one.
    for(let k=0;k+1<profile.tiles;k++){
      const [x1,y1]=at(stagePoint(profile,k*10+9)),[x2,y2]=at(stagePoint(profile,k*10+10)),len=Math.hypot(x2-x1,y2-y1),bridge=document.createElement('img');
      bridge.className='island-bridge';bridge.src=A['atlas-bridge'].file;bridge.alt='';bridge.draggable=false;
      bridge.style.cssText=`left:${(x1+x2)/2-len/2}px;top:${(y1+y2)/2-48}px;width:${len}px;height:96px;rotate:${Math.atan2(y2-y1,x2-x1)}rad`;world.append(bridge);
    }
    // A few wisps of cloud drift slowly across the map, the world never still.
    for(let k=0;k<Math.ceil(height/900);k++){const drift=document.createElement('div');drift.className='island-drift';drift.setAttribute('aria-hidden','true');drift.style.cssText=`top:${k*900+200}px;height:360px`;
      const puff=document.createElement('img');puff.src=A['map-cloud'].file;puff.alt='';puff.draggable=false;puff.style.cssText=`top:0;animation-delay:${-k*23}s`;drift.append(puff);world.append(drift);}
    const layer=document.createElement('div');layer.className='map-stages';world.append(layer);
    const points=Array.from({length:50},(_,i)=>at(stagePoint(profile,i)));
    for(let i=0;i<visible;i++){
      const n=start+i,e=M.encounter('campaign',n),open=n<=p.campaign.cleared+1,stars=p.campaign.stars[n]||0,[x,y]=points[i],kind=e.boss?'boss':e.tier==='elite'?'elite':'normal';
      const done=n<=p.campaign.cleared,next=n===p.campaign.cleared+1,look=kind!=='normal'?kind:done?'cleared':next?'next':'locked';
      // Its plaque: the next stage glows, a beaten one is green, elites and bosses keep their colours, the rest are grey.
      const plaque=next?'next':kind!=='normal'?kind:done?'cleared':'locked';
      const pin=document.createElement('button');pin.type='button';pin.className=`world-pin stage-seal ${e.tier} seal-${look}`+(open?'':' locked')+(done?' done':'')+(next?' next-stage':'');
      // Its box (the tap target) holds the ring, what stands on it and the plaque; (--gx, --gy) is the landing.
      // The landings recede up each painting: a ring shrinks a little with each of the painting's ten landings.
      const ring=Math.round(RING[kind]*(1-.025*(i%10))),tall=n>p.campaign.cleared&&(next||kind!=='normal')?(e.boss?220:kind==='elite'?158:122):0,w=ring*.84,top=Math.max(tall,ring*.3),h=top+ring*FLAT*.4+70;
      pin.style.cssText=`left:${x-w/2}px;top:${y-top}px;width:${w}px;height:${h}px;--gx:${w/2}px;--gy:${top}px;--ring:${ring}px;--flat:${FLAT}`;pin.style.setProperty('--plaque',`url("${new URL(A['plaque-'+plaque].file,document.baseURI).href}")`);
      pin.dataset.groundX=x;pin.dataset.groundY=y;pin.dataset.action='journey:stage';pin.dataset.index=n;pin.dataset.node='campaign.stage-'+n;
      pin.setAttribute('aria-label',`Ải ${n-start+1} · ${e.name} · ${n>p.campaign.cleared?(open?'Chưa vượt · Có thể xuất chiến':'Chưa mở khóa'):stars+' sao'} · Xem thông tin`);
      pin.innerHTML=img('ring-'+look,'seal-ring')+`<b class="seal-number">${n-start+1}</b>`+
        (done?`<span class="seal-stars" aria-label="${stars}/3 sao">${'<i>★</i>'.repeat(stars)+'<i class="off">★</i>'.repeat(3-stars)}</span>`:'');
      if(n===p.campaign.cleared&&n>=start)pin.classList.add('hero-here');
      // The next stage's foe and every elite and boss ahead stand on their stage, alive (their resting loop).
      if(tall){
        const id=e.boss?'boss-'+e.bossId:'creature-'+e.creature,still=e.boss?'boss-'+e.bossId:A['creature-'+e.creature]?'creature-'+e.creature:'monster-'+e.creature;
        pin.append(idleActor('idle-'+id,A[still]?still:'nav-arena',tall,w/2,top));pin.style.setProperty('--actor',tall+'px');
      }
      // The next stage's plaque is its Khiêu Chiến button (crossed swords clashing), above everything around it.
      if(next)pin.insertAdjacentHTML('beforeend',`<span class="seal-go"><i>${img(A['icon-battle']?'icon-battle':'icon-arena')}</i>Khiêu Chiến</span>`);
      layer.append(pin);
    }
    // The strongest hero stands on the last stage beaten in this chapter (beside stage 1 at the start), and walks
    // there from where it stood last time.
    if(leader){
      // It stands in the middle of its stage's ring.
      const spot=cleared>0?points[cleared-1]:[points[0][0]-150,points[0][1]+30];
      const hero=document.createElement('div');hero.className='map-hero cleared-hero';hero.dataset.hero=leader;hero.dataset.groundX=spot[0];hero.dataset.groundY=spot[1];
      if(cleared>0)hero.dataset.stage=start+cleared-1;hero.setAttribute('aria-label',M.HEROES[leader].name);
      hero.style.cssText=`left:${spot[0]}px;top:${spot[1]}px`;
      // It faces the foe on the next stage (its art faces right).
      if(cleared<50&&points[cleared][0]<spot[0]){hero.classList.add('facing-left');hero.style.scale='-1 1';}
      // Its combat rest (the form's idle loop) with the form's own effects, as it stands in a fight.
      const form=M.heroForm(leader,p.heroes[leader]),rest=A[`form-idle-${leader}-${form}`]||A['hero-'+leader],body=document.createElement('span');
      body.className='map-hero-body';body.innerHTML=`<img class="art journey-hero" src="${esc(rest.file)}" alt="" draggable="false">`;hero.append(body);
      window.GEMWOVEN_FORMS?.fitBody(body,rest,180);window.GEMWOVEN_FORMS?.decorateRest(body,leader,form);
      const before=state.mapProgress?.[chapter.index];
      if(before!=null&&before<p.campaign.cleared&&before>=start){const from=points[before-start];hero.dataset.walkFrom=JSON.stringify([from[0]-spot[0],from[1]-spot[1]]);}
      layer.append(hero);
    }
    // The camera opens on the hero and the next stage; a remembered scroll (in painting units) is kept until
    // progress moves.
    // The map drags over the stages already beaten and stops at the next one (it and its foe stay in view under the
    // HUD): stages not reached cannot be scrolled to.
    const maxScroll=Math.max(0,height-mapViewport),focus=points[Math.min(49,Math.max(0,cleared))][1];
    const minScroll=cleared>=50?0:Math.max(0,Math.min(maxScroll,focus-(hudHeight+380)));el.dataset.minScroll=minScroll;
    const advanced=state.mapProgress?.[chapter.index]!==p.campaign.cleared,saved=state.mapScroll?.[chapter.index];
    const scroll=Math.max(minScroll,Math.min(maxScroll,!advanced&&saved!=null&&!state.focusNext?(saved-origin)*ZOOM:focus-mapViewport*.62));
    state.mapProgress??={};state.mapProgress[chapter.index]=p.campaign.cleared;
    el.scrollTop=scroll;el.dataset.scrollTarget=scroll;
    // Stages that slide up under the HUD and the chapter banner fade out instead of peeking behind them.
    const pins=[...layer.querySelectorAll('.world-pin')],hideUnderHud=()=>{const top=el.scrollTop+hudHeight+150;for(const pin of pins)pin.classList.toggle('under-hud',Number(pin.dataset.groundY)<top);};
    el.onscroll=()=>{if(el.scrollTop<minScroll||el.scrollTop>maxScroll)el.scrollTop=Math.max(minScroll,Math.min(maxScroll,el.scrollTop));state.mapScroll??={};state.mapScroll[chapter.index]=el.scrollTop/ZOOM+origin;hideUnderHud();};
    el.alignNames=hideUnderHud;
    // Dragged up and down with a mouse too (touch pans natively), within the same range; a drag does not open the
    // stage under the pointer.
    let drag=null;
    el.onpointerdown=e=>{if(e.pointerType!=='mouse')return;drag={y:e.clientY,top:el.scrollTop,moved:false};};
    el.onpointermove=e=>{if(!drag)return;const dy=(e.clientY-drag.y)*mapViewport/el.getBoundingClientRect().height;
      if(Math.abs(dy)>8)drag.moved=true;if(drag.moved){el.scrollTop=drag.top-dy;el.classList.add('dragging');}};
    el.onpointerup=el.onpointerleave=()=>{if(drag?.moved)el.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();},{capture:true,once:true});drag=null;el.classList.remove('dragging');};
  }
  // World atlas: every chapter is one floating region island over a sea of clouds. Three regions stand in each
  // column, staggered left and right, filling the screen's height: the world scrolls only sideways. The road winds
  // up the first column and down the next, so each chapter borders the one before it. Every region not open yet is
  // the unexplored island with a "?": the next one names its chapter (locked), further ones keep it secret, and one
  // more at the road's end waits for chapters still to come.
  // Each column is staggered its own way ([x, y] shift of its bottom, middle and top region; neighbouring columns
  // never share a pattern or overlap).
  const ATLAS_W=540,ATLAS_DX=640,ATLAS_COL=3,ATLAS_X=470,ATLAS_Y=[1372,922,472];
  const ATLAS_STAGGER=[[[-33,-16],[-49,34],[84,-34]],[[-50,15],[40,22],[112,-6]],[[46,9],[-47,45],[122,-2]],[[-48,-20],[122,-29],[75,-21]],
    [[-90,-26],[44,35],[-43,11]],[[25,41],[36,8],[-96,-27]],[[-54,10],[-77,-7],[104,-6]],[[-100,8],[40,16],[48,11]],[[71,16],[-69,-31],[106,-3]]];
  const atlasPoint=i=>{const col=Math.floor(i/ATLAS_COL),r=i%ATLAS_COL,k=col%2?ATLAS_COL-1-r:r,[dx,dy]=ATLAS_STAGGER[col%ATLAS_STAGGER.length][k];
    return [ATLAS_X+col*ATLAS_DX+dx,ATLAS_Y[k]+dy];};
  const atlasSize=()=>[ATLAS_X*2+Math.floor(M.WORLD.CHAPTERS.length/ATLAS_COL)*ATLAS_DX,mapViewport];
  function atlasContent(el,p,state){
    const count=M.WORLD.CHAPTERS.length,[width,height]=atlasSize(),current=Math.min(count,Math.floor(p.campaign.cleared/50)+1);
    // The first chapter not open yet is shown (locked); every one after it stays unexplored.
    const next=M.WORLD.CHAPTERS.findIndex((c,i)=>!chapterOpen(p,i+1))+1||count+1;
    const shade=document.createElement('div');shade.className='map-hud-shade';shade.setAttribute('aria-hidden','true');el.append(shade);
    const world=document.createElement('div');world.className='atlas-world';world.style.cssText=`width:${width}px;height:${height}px`;
    world.style.setProperty('--atlas-sea',`url("${new URL(A['atlas-sea'].file,document.baseURI).href}")`);el.append(world);
    // Rope bridges join each chapter to the next, in order, under the islands, leaving from the islands' sides
    // (clear of the name ribbons); a bridge to a chapter not open yet is faded.
    for(let i=0;i<count;i++){
      const col=Math.floor(i/ATLAS_COL),turn=col!==Math.floor((i+1)/ATLAS_COL),side=turn?0:(col%2?-205:205);
      const [x1,y1]=atlasPoint(i).map((v,j)=>j?v:v+side),[x2,y2]=atlasPoint(i+1).map((v,j)=>j?v:v+side),len=Math.hypot(x2-x1,y2-y1),bridge=document.createElement('img');
      bridge.className='atlas-bridge'+(i+2<=count&&chapterOpen(p,i+2)?'':' locked');bridge.src=A['atlas-bridge'].file;bridge.alt='';bridge.draggable=false;bridge.dataset.from=i+1;
      bridge.style.cssText=`left:${(x1+x2)/2-len/2}px;top:${(y1+y2)/2-44}px;width:${len}px;height:88px;rotate:${Math.atan2(y2-y1,x2-x1)}rad`;world.append(bridge);
    }
    const ribbon=`url("${new URL(A['ui-ribbon'].file,document.baseURI).href}")`,unknown=A['atlas-unknown']?'atlas-unknown':null;
    [...M.WORLD.CHAPTERS,null].forEach((c,i)=>{
      const n=i+1,open=c&&chapterOpen(p,n),hidden=!c||n>next,[x,y]=atlasPoint(i),key=!open&&unknown?unknown:'atlas-'+c.id,art=A[key],w=ATLAS_W,h=w*art.height/art.width;
      const region=document.createElement('button');region.type='button';region.className='atlas-region'+(open?'':' locked')+(hidden?' unexplored':'')+(n===current&&c?' current':'');
      region.dataset.chapter=n;region.dataset.node=c?'campaign.region-'+n:'campaign.region-soon';
      if(c)region.dataset.action='journey:region';else region.disabled=true;
      region.style.cssText=`left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;z-index:${Math.round(y)}`;
      region.style.setProperty('--ribbon',ribbon);region.style.setProperty('--float-delay',`${-(i*1.3)%6}s`);
      const tapped=c&&!open&&state.atlasLocked===n,progress=c&&M.chapterProgress(p,n);
      region.setAttribute('aria-label',!c?'Vùng đất mới · Sắp ra mắt':hidden?`Chương ${n} · Chưa khám phá`:`Chương ${n} · ${c.name} · ${open?progress.total+'/150 sao':'Chưa mở'}`);
      // Its name rides on the clouds under the island, never over the painting (an unexplored one keeps its secret).
      const name=!c?'Sắp ra mắt':hidden?'???':esc(c.name);
      region.innerHTML=img(key,'atlas-island')+`<span class="atlas-plate${tapped?' tapped':''}">${open||!c?'':img('skill-lock','atlas-lock')}<b>${c?`<small>${n}</small>`:''}${name}</b>${open?`<em>${n===current?'Đang chơi · ':''}★ ${progress.total}/150</em>`:tapped?`<em>Vượt hết chương ${n-1} để mở</em>`:!c?'<em>Coming soon</em>':''}</span>`;
      world.append(region);
    });
    // Opens on the chapter being explored (or where the player left it); the world scrolls only sideways.
    const [fx]=atlasPoint(current-1),maxX=Math.max(0,width-941);
    const sx=state.atlasScroll?state.atlasScroll[0]:fx-941/2;
    // (Set again on mount: a detached element keeps no scroll position.)
    const left=Math.round(Math.max(0,Math.min(maxX,sx)));
    el.scrollLeft=left;el.scrollTop=0;el.dataset.scrollTarget=0;el.dataset.scrollLeftTarget=left;
    // A region's name shows only while most of its island is in view (no names cut at the edges).
    const names=()=>{const W=941;for(const r of world.querySelectorAll('.atlas-region')){const x=parseFloat(r.style.left)+parseFloat(r.style.width)/2-el.scrollLeft;r.classList.toggle('far',x<150||x>W-150);}};
    el.onscroll=()=>{state.atlasScroll=[el.scrollLeft,0];names();};requestAnimationFrame(names);el.alignNames=names;
    // Dragged with a mouse too (touch pans natively); a drag does not open the region under the pointer.
    let drag=null;
    el.onpointerdown=e=>{if(e.pointerType!=='mouse')return;drag={x:e.clientX,left:el.scrollLeft,moved:false};};
    el.onpointermove=e=>{if(!drag)return;const dx=(e.clientX-drag.x)*941/el.getBoundingClientRect().width;
      if(Math.abs(dx)>8)drag.moved=true;if(drag.moved){el.scrollLeft=drag.left-dx;el.classList.add('dragging');}};
    el.onpointerup=el.onpointerleave=()=>{if(drag?.moved)el.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();},{capture:true,once:true});drag=null;el.classList.remove('dragging');};
  }
  function campaign(nodes,p,state){
    const key='campaign',chapter=Math.max(1,Math.min(M.WORLD.CHAPTERS.length,state.chapter||Math.floor(p.campaign.cleared/50)+1)),def=M.WORLD.CHAPTERS[chapter-1],progress=M.chapterProgress(p,chapter);
    state.chapter=chapter;nodes=nodes.filter(n=>n.rect[1]<125&&!n.id.endsWith('.settings'));
    // The world atlas (state.mapView 'atlas', opened from the town) or one chapter's stage map (the default,
    // also on returning from a battle).
    if(state.mapView==='atlas'){
      L.screens.campaign.backgroundKey='atlas-sea';L.screens.campaign.background=A['atlas-sea'].file;
      if(state.atlasLocked){const c=M.WORLD.CHAPTERS[state.atlasLocked-1],known=chapterOpen(p,state.atlasLocked-1);nodes.push({...text(key,'atlas-note',`Chương ${state.atlasLocked}${known?' · '+c.name:''} — vượt hết chương ${state.atlasLocked-1} để mở`,[60,200,821,96],30,'ink'),className:'atlas-note'});}
      nodes.unshift({id:'campaign.atlas',kind:'content',rect:[0,mapTop,941,mapViewport],className:'exploration-map atlas-map',backgroundAsset:'panel-parchment',build:el=>atlasContent(el,p,state)});
      nodes.push(button(key,'back','Về Thị Trấn',A['map-back']?'map-back':'journey-button',[787,1512,136,134],'route:home',{}, {labelHidden:true,fit:'contain',className:'exploration-back'}));
      return nodes;
    }
    const profile=mapProfile(def);L.screens.campaign.backgroundKey=profile.assetKey;L.screens.campaign.background=profile.background;
    nodes.unshift({id:'campaign.map',kind:'content',rect:[0,mapTop,941,mapViewport],className:'exploration-map',backgroundAsset:'panel-parchment',build:el=>mapContent(el,p,state,def)});
    // Title stays on one line inside the banner's painted label area (safeContentRects.label); long names shrink.
    nodes.push(image(key,'title-board',A['chapter-banner']?'chapter-banner':'title-wood',[150,96,640,160]),{...text(key,'title',`Chương ${chapter} · ${def.name}`,[244,138,453,76],38),className:'single-line'});
    if(p.campaign.cleared>=chapter*50)nodes.push({...text(key,'conquered','✔ Đã vượt 50/50 ải',[640,268,290,64],26,'ink'),className:'chapter-conquered'});
    nodes.push(button(key,'rewards',`${progress.total}/150`,'button-gold',[318,250,305,100],'journey:rewards',{}, {size:36,icon:A['reward-star']?'reward-star':'chest',iconRect:[40,18,64,64],labelRect:[104,24,170,52],tone:'ink'}));
    // Back from a chapter goes to the world atlas (chapters are chosen there); the atlas's back goes to town.
    nodes.push(button(key,'back','Bản Đồ Thế Giới',A['map-back']?'map-back':'journey-button',[787,1512,136,134],'journey:atlas',{}, {labelHidden:true,fit:'contain',className:'exploration-back'}));
    if(state.mapRewards){
      nodes.push(image(key,'rewards-board','panel-parchment',[46,1078,849,370]),text(key,'rewards-title',`Rương sao · ${progress.total}/150 ★`,[110,1112,721,50],36,'ink'));
      M.STAR_MILESTONES.forEach((milestone,i)=>nodes.push(button(key,'reward-'+milestone,progress.claimed.includes(milestone)?'Đã nhận':milestone+' ★','button-gold',[96+i*254,1180,240,112],'journey:claim-stars',{chapter,milestone},{icon:'chest',iconRect:[26,18,70,66],labelRect:[94,26,128,58],size:33,tone:'ink',disabled:progress.total<milestone||progress.claimed.includes(milestone)})));
      nodes.push(text(key,'reward-note',state.mapMessage||'Tích lũy sao qua 50 ải để mở rương',[96,1318,749,92],31,'ink'));
    }
    if(state.mapStage&&M.WORLD.chapterForStage(state.mapStage).index===chapter){
      nodes=nodes.filter(n=>!['campaign.rewards','campaign.back','campaign.title','campaign.title-board','campaign.conquered'].includes(n.id));
      nodes.push({id:'campaign.encounter-sheet',kind:'content',rect:[6,78,929,1592],backgroundAsset:'panel-parchment',className:'encounter-sheet',build:el=>stagePreview(el,p,state.mapStage,state)});
    }
    return nodes;
  }
  const makeDialog=(id,title)=>window.GemwovenUI.makeDialog(id,title,'journey-dialog');
  function modalButton(modal,label,callback,disabled=false,secondary=false){const b=document.createElement('button');b.type='button';b.className='gw-btn'+(secondary?' secondary':'');b.textContent=label;b.disabled=disabled;b.onclick=callback;modal.actions.append(b);return b;}
  function paragraph(modal,value,cls=''){const p=document.createElement('p');p.textContent=value;if(cls)p.className=cls;modal.body.append(p);return p;}
  const delegate=G.handle;
  function confirmSummon(count,ctx,state){
    const quote=G.engine.summonQuote(count),modal=makeDialog('summon-confirm',`Triệu Hồi ×${count}`);
    const gems=G.engine.read().wallet.gems,gemCost=count*120,art=document.createElement('div');art.className='confirm-cost';
    // Each case states one fact: what will be spent, or exactly what is missing.
    if(quote.enough){
      // One large figure (what this pull costs), then the balance before and after it.
      const tickets=quote.payment==='tickets',have=tickets?quote.tickets:gems;
      art.innerHTML=`<span class="cost-chip">${img(tickets?'ticket':'mana')}<strong>${fmt(quote.cost)}</strong><small>${tickets?'Vé Triệu Hồi':'Đá Ngọc'}</small></span>`;modal.body.append(art);
      paragraph(modal,`Đang có ${fmt(have)} · còn ${fmt(have-quote.cost)} sau lượt này`,'confirm-balance');
      if(!tickets)paragraph(modal,`Chưa đủ vé cho lượt ×${count} (đang có ${fmt(quote.tickets)}), nên lượt này dùng Đá Ngọc.`,'confirm-note');
    }else{
      art.classList.add('short');art.innerHTML=`<span class="cost-chip">${img('ticket')}<span class="cost-text"><strong>${fmt(count)} vé</strong><small>Đang có ${fmt(quote.tickets)}</small></span></span><b>hoặc</b><span class="cost-chip">${img('mana')}<span class="cost-text"><strong>${fmt(gemCost)} Đá Ngọc</strong><small>Đang có ${fmt(gems)}</small></span></span>`;modal.body.append(art);
      paragraph(modal,'Chưa đủ vé hoặc Đá Ngọc cho lượt này. Bạn chưa bị trừ vật phẩm. Vé nhận thêm từ nhiệm vụ ngày và mốc cấp tướng.');
    }
    // Later on the left, the pull itself on the right: two equal buttons on one row.
    modalButton(modal,'Để Sau',()=>modal.close(),false,true);
    const confirm=modalButton(modal,quote.enough?'Triệu Hồi':'Chưa Đủ',()=>{
      const fresh=G.engine.summonQuote(count);
      if(fresh.payment!==quote.payment||fresh.enough!==quote.enough){modal.close();confirmSummon(count,ctx,state);return;}
      confirm.disabled=true;modal.close();delegate('do:summon',{dataset:{count:String(count),payment:quote.payment}},ctx,state);
    },!quote.enough);confirm.id='confirm-summon';if(quote.enough)confirm.setAttribute('autofocus','');modal.present();
  }
  function stagePreview(el,p,index,state){
    const e=M.encounter('campaign',index),open=index<=p.campaign.cleared+1,quote=M.campaignRewardPreview(p,index,1),best=p.campaign.stars[index]||0;
    // The player picks the hero right here (the one chosen in town first); Khiêu Chiến then fights at once.
    const roster=rankedHeroes(p),hero=p.heroes[state.mapHero]?state.mapHero:fighter(p);state.mapHero=hero;
    const chapter=M.WORLD.chapterForStage(index),local=index-(chapter.index-1)*50,tier=e.boss?'Boss Chương':e.tier==='elite'?'Tinh Anh':'Quái Thường';
    const asset=e.boss?'boss-'+e.bossId:A['creature-'+e.creature]?'creature-'+e.creature:'monster-'+e.creature,idle=A['idle-'+(e.boss?'boss-'+e.bossId:'creature-'+e.creature)];
    const url=key=>new URL(A[key].file,document.baseURI).href;
    // The place it is fought in (as in combat: three places in turn, the boss in its lair).
    const scene=A[`battle-card-${chapter.id}${e.boss?'-boss':['','-b','-c'][(local-1)%3]}`]||A['battle-card-'+chapter.id];
    // The foe across the card's whole width on its chapter's combat ground (the scenery it is fought in), alive (its
    // resting loop) when it has one; its drawn body (footBounds) otherwise.
    const tall=e.boss?290:e.tier==='elite'?300:270;let foe;
    if(idle){const cell=tall/.78,rig=A['idle-'+(e.boss?'boss-'+e.bossId:'creature-'+e.creature)];foe=`<span class="sc-foe map-idle"${rig?.cols===6?' data-rig':''} style="width:${cell}px;height:${cell}px;margin-left:${-cell/2}px;bottom:${44-cell*.06}px;--rig-ms:${rig?.ms||0}ms;background-image:url('${url('idle-'+(e.boss?'boss-'+e.bossId:'creature-'+e.creature))}')"></span>`;}
    else{const art=A[asset]||A['icon-hero'],fb=art.footBounds||[0,0,art.width,art.height],k=tall/Math.max(1,fb[3]-fb[1]);
      foe=`<img class="sc-foe" src="${esc(art.file)}" alt="" draggable="false" style="width:${art.width*k}px;height:${art.height*k}px;margin-left:${-(fb[0]+fb[2])/2*k}px;bottom:${44-(art.height-fb[3])*k}px">`;}
    // Each star: its goal on the left, what reaching it brings on the right (four to a row). The first star is the win itself (the
    // stage's loot); the second and third each add a chapter star toward the star chests (an elite's third also
    // brings its chapter's counter shards).
    const loot=(icon,n,title,id='')=>`<span class="sc-loot${id?' res-'+id:''}" title="${esc(title)}">${img(icon)}<b>${n}</b></span>`;
    const winLoot=Object.entries(quote.reward).filter(([,n])=>n>0).map(([id,n])=>loot(M.RESOURCES[id][1],fmt(n),M.RESOURCES[id][0],id))
      .concat(quote.heroFragments?[loot(A['fragment-'+quote.heroFragments.hero]?.fragmentArt?'fragment-'+quote.heroFragments.hero:'portrait-'+quote.heroFragments.hero,'3','Mảnh '+M.HEROES[quote.heroFragments.hero].name)]:[]);
    const goals=[['Chiến thắng',1],['Tướng còn ≥ 50% HP',2],[`Thắng trong tối đa ${e.turnLimit} lượt`,3]].map(([label,stars])=>{
      const q=M.campaignRewardPreview(p,index,stars),got=best>=stars;
      const gain=stars===1?winLoot.join(''):`<span class="sc-star-gain" title="Sao chương · tích lũy để mở rương sao">${img(A['reward-star']?'reward-star':'chest')}<b>+1</b></span>`+(q.counterReward?loot(q.counterReward.key,'+3','Mảnh '+q.counterReward.name):'');
      return `<li class="${got?'done':''}"><span class="sc-goal"><span class="sc-stars" aria-label="${stars} sao">${img(A['reward-star']?'reward-star':'chest').repeat(stars)}</span>${label}${got?'<small class="sc-got">✓ Đã đạt</small>':stars===1?`<small>${quote.first?'Thưởng lần đầu':'Thưởng'}</small>`:''}</span><span class="sc-gain">${gain}</span></li>`;}).join('');
    const own=e.boss||e.tier==='elite';
    el.innerHTML=`<header class="encounter-heading"><h2>Ải ${local} · ${tier}</h2><button type="button" class="encounter-close gw-close" data-action="journey:close-stage" aria-label="Đóng thông tin ải">×</button></header>
      <div class="encounter-body foe-card">
        <section class="sc-stage ${e.tier}${scene?' battle':''}" style="--stage-art:url('${new URL((scene||{file:mapProfile(chapter).background}).file,document.baseURI).href}')">${foe}</section>
        <h3 class="sc-title">${esc(e.enemyName)}</h3>
        <p class="sc-meta">Cấp gợi ý <b>${e.recommended}</b> · Sinh lực <b>${fmt(e.enemyHp)}</b></p>
        ${own?`<p class="sc-skill"><b>Kỹ năng riêng</b> ${e.skills.map(k=>`<span>${esc(k)}</span>`).join(' · ')}</p>`:''}
        ${e.tactical&&e.boss?'<button type="button" class="sc-guide" data-action="guide:open">Xem nội tại và cách khắc chế boss ›</button>':''}
        <ol class="sc-goals">${goals}</ol>
      </div>
      <footer class="sc-foot">${open?`<div class="sc-roster" aria-label="Chọn tướng xuất chiến">${roster.map(({key})=>`<button type="button" data-action="journey:choose-hero" data-hero="${key}" class="${key===hero?'chosen':''}" aria-pressed="${key===hero}" aria-label="Chọn ${esc(M.HEROES[key].name)} · Lực chiến ${fmt(M.stats(p,key).power)}">${img(A['face-'+key]?'face-'+key:'portrait-'+key)}<span>${esc(M.HEROES[key].name)}</span></button>`).join('')}</div>
        <button type="button" class="encounter-deploy gw-btn" data-action="journey:challenge" data-index="${index}">${img(A['icon-battle']?'icon-battle':'icon-arena')}Khiêu Chiến</button>`:`<p class="sc-lock">${img('skill-lock')}Chưa mở — vượt <b>ải ${local-1}</b> trước</p><button type="button" class="encounter-goto gw-btn secondary" data-action="journey:goto-next">Về ải đang đánh</button>`}</footer>`;
  }
  const AUDIO_KEY='mam-phep-audio-v1',MUTE_KEY='gemwoven.audio-muted.v1',CHAT_KEY='gemwoven.chat.v1',audioDefaults={music:10,effects:100,voices:29};
  function readStorage(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
  function audioLevels(){const stored=readStorage(AUDIO_KEY,{});return Object.fromEntries(Object.entries(audioDefaults).map(([key,value])=>[key,Number.isFinite(stored[key])?Math.round(Math.max(0,Math.min(100,stored[key]))):value]));}
  // Other hub screens (the summon reveal) read the same effects volume and mute switch.
  window.GemwovenHubAudio={levels:audioLevels,muted:()=>!!readStorage(MUTE_KEY,false)};
  let homeMusic=null;
  function playHomeMusic(state){
    if(!(window.AudioContext||window.webkitAudioContext))return;
    if(!homeMusic){homeMusic=new Audio(window.GEMWOVEN_HOME_MUSIC||'assets/audio/music/earth.ogg');homeMusic.loop=true;}
    homeMusic.volume=audioLevels().music/100;
    if(readStorage(MUTE_KEY,false)||!['home','settings'].includes(state.screen)||homeMusic.volume===0)homeMusic.pause();else homeMusic.play().catch(()=>{});
  }
  function settings(el){
    const levels=audioLevels(),muted=readStorage(MUTE_KEY,false);
    el.innerHTML=`<header class="crafted-heading"><h2>Âm Thanh</h2><p>Điều chỉnh âm lượng cho cả thị trấn và chiến đấu</p></header><div class="sound-emblem">${img('icon-settings')}</div><form id="home-audio-form"><label class="mute-control"><input type="checkbox" name="muted" ${muted?'checked':''}> Tắt toàn bộ âm thanh</label>${[['music','Nhạc nền','Giai điệu của thị trấn và các vùng đất'],['effects','Hiệu ứng','Ghép ngọc, vũ khí và kỹ năng'],['voices','Lời thoại','Giọng nói của nhân vật trong trận']].map(([key,label,hint])=>`<label class="audio-slider"><span>${label}<output for="home-volume-${key}" id="home-output-${key}">${levels[key]}%</output></span><small>${hint}</small><input id="home-volume-${key}" name="${key}" type="range" min="0" max="100" value="${levels[key]}" aria-label="${label}"></label>`).join('')}<button type="button" class="game-btn secondary" id="home-audio-reset">Mặc Định</button><p class="audio-save-note" role="status">Tự lưu khi điều chỉnh</p></form>`;
  }
  function chatRows(){const rows=readStorage(CHAT_KEY,[]);return Array.isArray(rows)?rows.filter(r=>typeof r.text==='string'&&r.text.trim()&&r.text.length<=240&&Number.isFinite(r.at)&&Math.abs(r.at)<=8.64e15&&M.HEROES[r.hero]).slice(-80):[];}
  function chat(el,p,state){
    const system=state.chatTab==='system',rows=system?p.log.slice(0,40).reverse().map(r=>({text:r.message,at:r.at,system:true})):chatRows();
    el.innerHTML=`<header class="crafted-heading"><h2>Trò Chuyện</h2><p>Thị trấn · Trực tuyến Coming soon</p></header><div class="chat-tabs"><button class="game-btn ${system?'':'active'}" data-action="journey:chat-tab" data-tab="town">Thị Trấn</button><button class="game-btn ${system?'active':''}" data-action="journey:chat-tab" data-tab="system">Hệ Thống</button></div><div class="chat-history" role="log" aria-live="polite"><div class="chat-notice">${img('icon-chat')}<p>Góc trò chuyện trên thiết bị của bạn.<br>Tin nhắn trực tuyến sẽ mở khi máy chủ ra mắt.</p></div>${rows.map(row=>`<article class="chat-message ${row.system?'system':''}">${img(row.system?'icon-event':'portrait-'+row.hero,'chat-avatar')}<div><header><b>${row.system?'Hệ Thống':esc(M.HEROES[row.hero].name)+' · Bạn'}</b><time>${new Date(row.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})}</time></header><p>${esc(row.text)}</p></div></article>`).join('')}</div>${system?'<p class="chat-system-note">Nhật ký hành trình và phần thưởng gần đây</p>':`<form id="town-chat-form"><div class="chat-composer"><button type="button" id="chat-emoji-toggle" aria-label="Biểu cảm">☺</button><textarea name="message" maxlength="240" rows="2" aria-label="Tin nhắn" placeholder="Nhắn điều gì đó…"></textarea><button type="submit" class="game-btn">Gửi</button></div><div class="emoji-tray" hidden>${['✨','🌿','⚔️','❤️','😊','👍'].map(e=>`<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`).join('')}</div><small class="chat-counter">0 / 240</small></form>`}`;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state),key=state.screen;let nodes=L.screens[key].nodes;
    if(key!=='campaign')state.mapStage=null;
    if(key==='home')nodes=home(nodes,p);
    else nodes=nodes.filter(n=>!n.id.endsWith('.settings'));
    nodes=nodes.filter(n=>!n.id.endsWith('.side-mail'));
    for(const n of nodes)if(n.id.endsWith('.side-chat')){n.action='route:chat';C[n.text]='Trò Chuyện';}
    if(key==='campaign')nodes=campaign(nodes,p,state);
    if(key==='settings'||key==='chat'){
      nodes=nodes.filter(n=>n.kind!=='content');nodes.push(frame(key,key==='chat'?'chat-frame':'settings-frame',el=>key==='chat'?chat(el,p,state):settings(el),key==='chat'?'chat-panel':'settings-panel'));
    }
    if(key==='arena'){const enemy=nodes.find(n=>n.id==='arena.fighter-ice');if(enemy)enemy.className=((enemy.className||'')+' facing-left').trim();}
    hangingMenu(nodes);
    L.screens[key].nodes=nodes;playHomeMusic(state);return p;
  };
  G.handle=(action,el,ctx,state)=>{
    if(action.startsWith('route:')&&action!=='route:campaign')state.mapStage=null;
    if(action==='route:campaign'&&state.screen!=='campaign'){state.mapView='atlas';state.mapMessage='';}
    if(action.startsWith('hero:')){state.hero=action.slice(5);state.skill=0;ctx.navigate('upgrade');return true;}
    if(action==='route:upgrade'&&el.dataset.node?.endsWith('.profile')){state.hero=G.engine.read().selected;ctx.navigate('upgrade');return true;}
    if(action==='do:summon'){confirmSummon(Number(el.dataset.count||1),ctx,state);return true;}
    if(!action.startsWith('journey:'))return delegate(action,el,ctx,state);
    const command=action.slice(8),d=el.dataset;
    if(command==='monthly')ctx.showModal('Thẻ Tháng · Coming soon',['icon-book'],'Thẻ Tháng đang được chuẩn bị. Quyền lợi và thanh toán sẽ được công bố khi hệ thống máy chủ ra mắt.');
    if(command==='stage'){const index=Number(d.index),p=G.engine.read();if(Number.isInteger(index)&&index>0&&index<=M.WORLD.MAX_STAGES&&chapterOpen(p,M.WORLD.chapterForStage(index).index)){state.mapStage=index;state.mapHero=state.mapHero&&p.heroes[state.mapHero]?state.mapHero:fighter(p);state.mapRewards=false;state.chapterGuide=false;ctx.render();}}
    if(command==='close-stage'){state.mapStage=null;ctx.render();}
    if(command==='goto-next'){state.mapStage=null;if(state.mapScroll)state.mapScroll[state.chapter]=null;ctx.render();}
    if(command==='choose-hero'){if(state.mapStage&&G.engine.read().heroes[d.hero]){state.mapHero=d.hero;ctx.render();}}
    if(command==='challenge'){const index=Number(d.index),p=G.engine.read();if(index===state.mapStage&&index<=p.campaign.cleared+1&&p.heroes[state.mapHero]){G.engine.select(state.mapHero);delegate('do:battle',{dataset:{mode:'campaign',index:String(index)}},ctx,state);}}
    if(command==='rewards'){state.mapRewards=!state.mapRewards;ctx.render();}
    if(command==='featured-gear')ctx.showModal(M.SLOTS[d.slot]+' · '+M.RARITIES[d.rarity].name,[d.asset],'Vũ khí Thần mang một hiệu ứng ngẫu nhiên: Chấn kích, Hút sinh lực hoặc Xuyên giáp. Xem bảng tỷ lệ để biết cơ hội nhận được.');
    if(command==='atlas'){state.mapStage=null;state.mapRewards=false;state.mapMessage='';state.mapView='atlas';ctx.render();}
    if(command==='region'){const n=Number(d.chapter),p=G.engine.read();
      if(chapterOpen(p,n)){state.mapView='chapter';state.chapter=n;state.atlasLocked=null;ctx.render();}
      // A locked chapter answers on its own label, brought to the middle of the view.
      else{state.atlasLocked=n;const [x]=atlasPoint(n-1);state.atlasScroll=[x-941/2,0];ctx.render();}}
    if(command==='chapter'){state.mapStage=null;state.chapter=Math.max(1,Math.min(M.WORLD.CHAPTERS.length,state.chapter+Number(d.delta)));ctx.render();}
    if(command==='claim-stars'){try{const r=G.engine.claimChapter(Number(d.chapter),Number(d.milestone));state.mapMessage=resourceText(r);ctx.render();}catch(error){state.mapMessage=error.message;ctx.render();}}
    if(command==='chat-tab'){state.chatTab=d.tab;ctx.render();}
    return true;
  };
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    // The chosen hero is always in view in the stage card's swipeable roster.
    {const chosen=document.querySelector('.sc-roster .chosen'),row=chosen?.parentElement;if(row)row.scrollLeft=Math.max(0,chosen.offsetLeft-(row.clientWidth-chosen.offsetWidth)/2);}
    const map=document.querySelector('.exploration-map');if(map){map.scrollTop=Number(map.dataset.scrollTarget);if(map.dataset.scrollLeftTarget)map.scrollLeft=Number(map.dataset.scrollLeftTarget);map.alignNames?.();
      // The hero walks from the stage it stood on last time to the one just beaten.
      const hero=map.querySelector('.map-hero[data-walk-from]');if(hero&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const [dx,dy]=JSON.parse(hero.dataset.walkFrom);hero.animate([{translate:`${dx}px ${dy}px`},{translate:'0 0'}],{duration:1100,easing:'ease-in-out'});}}
    mount(state,ctx);
    // The stage card shows everything without scrolling: its foe's ground (410px when there is room, 340px for a boss) shrinks until
    // the goals and rewards fit, the foe with it once the ground is lower than 370px.
    {const card=document.querySelector('.foe-card'),stage=card?.querySelector('.sc-stage');
      if(stage){let h=stage.offsetHeight;while(card.scrollHeight>card.clientHeight+1&&h>220){h-=10;stage.style.height=h+'px';stage.style.setProperty('--k',Math.min(1,h/370).toFixed(3));}}}
    const audioForm=document.getElementById('home-audio-form');
    if(audioForm){
      function saveAudio(){const levels=Object.fromEntries(Object.keys(audioDefaults).map(key=>[key,Number(audioForm.elements.namedItem(key).value)]));try{localStorage.setItem(AUDIO_KEY,JSON.stringify(levels));localStorage.setItem(MUTE_KEY,JSON.stringify(audioForm.elements.namedItem('muted').checked));}catch{}for(const [key,value]of Object.entries(levels))document.getElementById('home-output-'+key).value=value+'%';playHomeMusic(state);}
      audioForm.addEventListener('input',saveAudio);audioForm.addEventListener('change',saveAudio);document.getElementById('home-audio-reset').onclick=()=>{for(const [key,value]of Object.entries(audioDefaults))audioForm.elements.namedItem(key).value=value;audioForm.elements.namedItem('muted').checked=false;saveAudio();};
    }
    const form=document.getElementById('town-chat-form');
    if(form){const input=form.elements.namedItem('message'),counter=form.querySelector('.chat-counter'),tray=form.querySelector('.emoji-tray');
      const count=()=>counter.textContent=input.value.length+' / 240';input.addEventListener('input',count);
      form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(!value)return;const messages=chatRows();messages.push({text:value.slice(0,240),at:Date.now(),hero:G.engine.read().selected});try{localStorage.setItem(CHAT_KEY,JSON.stringify(messages.slice(-80)));}catch{}ctx.render();};
      input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}};
      document.getElementById('chat-emoji-toggle').onclick=()=>{tray.hidden=!tray.hidden;};for(const b of tray.querySelectorAll('button'))b.onclick=()=>{input.value=(input.value+b.dataset.emoji).slice(0,240);count();input.focus();};
    }
    const history=document.querySelector('.chat-history');if(history)history.scrollTop=history.scrollHeight;
  };
  document.addEventListener('pointerdown',()=>{const key=location.hash.slice(1)||'home';playHomeMusic({screen:key});},{once:true});
})();
