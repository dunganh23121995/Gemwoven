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
  function home(nodes){
    nodes=nodes.filter(n=>!/^home\.(live|feature-mail|feature-settings)$/.test(n.id));
    const quest=nodes.find(n=>n.id==='home.quests');quest.action='route:quests';C[quest.text]='Nhiệm Vụ';
    const hero=nodes.find(n=>n.id==='home.hero');if(hero){hero.rect=[391,1040,184,270];hero.kind='button';hero.text='home.hero';hero.labelHidden=true;C['home.hero']='Tướng';}
    nodes.push(button('home','feature-chat','Trò Chuyện','side-pennant',[10,383,96,109],'route:chat',{}, {icon:'icon-chat',iconRect:[26,15,45,54],labelRect:[3,79,90,26],size:17}));
    [['offline','Kho Offline','chest'],['boss','Boss Vô Hạn','nav-arena'],['rankings','Xếp Hạng','rank-gold']].forEach(([route,name,asset],i)=>nodes.push(button('home','right-'+route,name,asset,[844,172+i*116,85,92],'route:'+route,{}, {labelHidden:true,fit:'contain',className:'home-right-icon'})));
    nodes.push(button('home','explore','Khám Phá',A['journey-button']?'journey-button':'title-parchment',[215,1338,525,140],'route:campaign',{}, {labelRect:[130,44,265,56],size:43,tone:'ink',className:'explore-entry'}));
    return nodes;
  }
  const mapTop=180,mapViewport=1672-mapTop,mapPitch=mapViewport/8;
  // The opening stretch previews stages 1–7; stage 8 starts under the clouds.
  // Afterwards only the next unbeaten stage remains visible above the player's marker.
  const revealedStage=p=>Math.min(M.WORLD.MAX_STAGES,Math.max(Math.floor(p.campaign.cleared/50)*50+7,p.campaign.cleared+1));
  const rankedHeroes=p=>Object.keys(p.heroes).filter(key=>M.HEROES[key]).map(key=>({key,stats:M.stats(p,key)})).sort((a,b)=>b.stats.power-a.stats.power||p.heroes[b.key].level-p.heroes[a.key].level||a.key.localeCompare(b.key));
  function mapProfile(chapter){
    const fresh=['forest','bamboo','eldergrove'].includes(chapter.id),assetKey=fresh?'journey-eight-landings':'chapter-'+(chapter.backdrop||chapter.id),asset=A[assetKey];
    const anchors=asset.stageCenters.slice(0,8),topDown=[...anchors].reverse(),scaleX=941/asset.width;
    const bounds=asset.registration?.sourceBounds||[topDown[0][1]-65,anchors[0][1]+80];
    // Register the artwork and actors together: each measured floor point maps to its row's foot line.
    const bleed=16,controls=[[bounds[0],0],...topDown.map(([,y],i)=>[y,(i+.68)*mapPitch+bleed]),[bounds[1],mapViewport+bleed*2]];
    const bands=controls.slice(0,-1).map(([sourceTop,top],i)=>{const [sourceBottom,bottom]=controls[i+1],scaleY=(bottom-top)/(sourceBottom-sourceTop);return {top,height:bottom-top,sourceTop,sourceBottom,artSize:[941,asset.height*scaleY],artOffset:[0,-sourceTop*scaleY]};});
    return {background:asset.file,assetKey,places:anchors.map(([x],i)=>[x*scaleX,(7-i+.68)*mapPitch]),sourceAnchors:anchors,sourceSize:[asset.width,asset.height],safeFloors:asset.safeFloorPolygons||[],bands,bleed,tileHeight:mapViewport+bleed*2,stride:mapViewport,artSize:[941,asset.height*scaleX],artOffset:[0,0]};
  }
  function terrainTile(profile,top){
    const tile=document.createElement('div');tile.className='map-island registered-terrain';tile.style.cssText=`top:${top-profile.bleed}px;height:${profile.tileHeight}px`;
    for(const band of profile.bands){const part=document.createElement('div');part.className='terrain-band';part.style.cssText=`top:${band.top}px;height:${band.height+.4}px;background-size:${band.artSize.map(n=>n+'px').join(' ')};background-position:${band.artOffset.map(n=>n+'px').join(' ')}`;tile.append(part);}
    return tile;
  }
  function mapContent(el,p,state,chapter){
    const start=(chapter.index-1)*50+1,profile=mapProfile(chapter),{background,places,tileHeight,stride}=profile,islandCount=Math.ceil(50/places.length),mapHeight=islandCount*stride;
    const visible=Math.max(0,Math.min(50,revealedStage(p)-start+1)),leader=rankedHeroes(p)[0]?.key;
    const stageY=i=>(islandCount-1-Math.floor(i/places.length))*stride+places[i%places.length][1];
    // Trim undiscovered terrain out of the scroll range, rather than dimming 50 existing pins.
    const shown=visible+(visible<50?1:0),origin=Math.max(0,mapHeight-Math.max(8,shown)*mapPitch);
    el.style.setProperty('--map-background',`url("${background}")`);
    el.style.setProperty('--map-art-size',profile.artSize.map(n=>n+'px').join(' '));el.style.setProperty('--map-art-position',profile.artOffset.map(n=>n+'px').join(' '));
    const world=document.createElement('div');world.className='map-world close-map eight-step-map';world.style.height=mapHeight-origin+'px';world.dataset.origin=origin;world.dataset.islands=islandCount;world.dataset.profile=JSON.stringify(profile);el.append(world);
    for(let section=0;section<islandCount;section++){if(section*stride+tileHeight<=origin)continue;world.append(terrainTile(profile,section*stride-origin));}
    for(let i=0;i<visible;i++){
      const n=start+i,e=M.encounter('campaign',n),open=n<=p.campaign.cleared+1,stars=p.campaign.stars[n]||0,[x]=places[i%places.length],top=stageY(i),size=e.boss?132:e.tier==='elite'?118:108;
      const asset=e.boss?'boss-'+e.bossId:A['creature-'+e.creature]?'creature-'+e.creature:'monster-'+e.creature;
      const pin=document.createElement('button');pin.type='button';pin.className='world-pin '+e.tier+(n<=p.campaign.cleared?'':' locked')+(x>550?' label-left':'');pin.style.cssText=`left:${x-size/2}px;top:${top-origin-size*.835}px;width:${size}px;height:${size}px`;
      pin.dataset.groundX=x;pin.dataset.groundY=top-origin;pin.dataset.sourceAnchor=JSON.stringify(profile.sourceAnchors[i%places.length]);
      pin.dataset.action='journey:stage';pin.dataset.index=n;pin.dataset.node='campaign.stage-'+n;pin.setAttribute('aria-label',`${e.name} · ${e.enemyName} · ${stars} sao · Xem thông tin`);
      pin.innerHTML=img(A['stage-platform']?'stage-platform':'avatar-ring','pin-platform')+((!e.boss||open)?img(A[asset]?asset:'nav-arena','pin-creature'):img('map-cloud','pin-creature pin-mist'))+`<b>${n}</b>`+(n<=p.campaign.cleared?`<span class="pin-stars">${'★'.repeat(stars)+'☆'.repeat(3-stars)}</span>`:'');
      if(n>p.campaign.cleared)pin.innerHTML+=`<span class="pin-name">${esc(open?e.enemyName:'Chưa mở khóa')}</span>`;
      if(n>p.campaign.cleared){pin.innerHTML+=img('skill-lock','pin-lock');pin.setAttribute('aria-label',`${e.name} · ${open?'Chưa vượt · Có thể xuất chiến':'Chưa mở khóa'} · Xem thông tin`);}
      if(n===p.campaign.cleared&&leader){pin.classList.add('cleared-hero');pin.dataset.hero=leader;pin.querySelector('.pin-creature')?.remove();pin.insertAdjacentHTML('beforeend',img('hero-'+leader,'pin-creature journey-hero')+`<span class="pin-name">${esc(M.HEROES[leader].name)} · Đã vượt</span>`);}
      if(n===p.campaign.cleared+1)pin.classList.add('next-stage');
      world.append(pin);
    }
    // A compact cloud band hides only the highest undiscovered platform.
    if(visible<50){
      const top=0,height=mapPitch,cloud=document.createElement('div');cloud.className='frontier-cloud';cloud.setAttribute('aria-hidden','true');
      cloud.dataset.firstHidden=start+visible;cloud.style.cssText=`left:0px;top:${top}px;width:941px;height:${height}px`;
      for(let bottom=height+36;bottom>-400;bottom-=150){const layer=document.createElement('img');layer.src=A['map-cloud'].file;layer.alt='';layer.draggable=false;layer.style.cssText=`left:-280px;top:${bottom-491}px;width:1500px;height:491px`;cloud.append(layer);}
      world.append(cloud);
    }
    // Save absolute map coordinates so revealing more terrain does not shift the remembered view.
    const advanced=state.mapProgress?.[chapter.index]!==p.campaign.cleared;
    const maxScroll=mapHeight-origin-mapViewport;
    const scroll=Math.max(0,Math.min(maxScroll,!advanced&&state.mapScroll?.[chapter.index]!=null?state.mapScroll[chapter.index]-origin:0));
    state.mapProgress??={};state.mapProgress[chapter.index]=p.campaign.cleared;
    el.scrollTop=scroll;
    const alignHeader=()=>{
      const scene=el.closest('#scene');if(!scene)return;const absolute=el.scrollTop+origin,section=Math.floor(absolute/stride);
      let header=scene.querySelector('.map-header-terrain');
      if(!header){header=document.createElement('div');header.className='map-header-terrain';header.setAttribute('aria-hidden','true');header.style.setProperty('--map-background',`url("${background}")`);header.append(terrainTile(profile,0),terrainTile(profile,0));scene.prepend(header);}
      [...header.children].forEach((tile,i)=>tile.style.top=`${mapTop+(section-1+i)*stride-absolute-profile.bleed}px`);
      const bank=world.querySelector('.frontier-cloud');let sky=scene.querySelector('.map-header-cloud');
      if(bank&&!sky){
        sky=document.createElement('div');sky.className='map-header-cloud';sky.setAttribute('aria-hidden','true');
        const layers=document.createElement('div');for(const layer of bank.children)layers.append(layer.cloneNode(true));sky.append(layers);
        // Clouds sit above terrain and below every HUD control in the scene's paint order.
        header.after(sky);
      }
      if(sky){sky.hidden=!bank||parseFloat(bank.style.height)+mapTop-el.scrollTop<=0;sky.firstElementChild.style.transform=`translateY(${mapTop-el.scrollTop}px)`;}
    };
    el.onscroll=()=>{el.scrollTop=Math.max(0,Math.min(maxScroll,el.scrollTop));state.mapScroll??={};state.mapScroll[chapter.index]=el.scrollTop+origin;alignHeader();};el.alignHeader=alignHeader;
    // scrollTop needs the connected box height; initialize again after mounting.
    el.dataset.scrollTarget=scroll;
  }
  function campaign(nodes,p,state){
    const key='campaign',chapter=Math.max(1,Math.min(M.WORLD.CHAPTERS.length,state.chapter||Math.floor(p.campaign.cleared/50)+1)),def=M.WORLD.CHAPTERS[chapter-1],progress=M.chapterProgress(p,chapter);
    state.chapter=chapter;nodes=nodes.filter(n=>n.rect[1]<125&&!n.id.endsWith('.settings'));
    L.screens.campaign.backgroundKey=mapProfile(def).assetKey;L.screens.campaign.background=mapProfile(def).background;
    nodes.unshift({id:'campaign.map',kind:'content',rect:[0,mapTop,941,mapViewport],className:'exploration-map',backgroundAsset:'panel-parchment',build:el=>mapContent(el,p,state,def)});
    nodes.push(image(key,'title-board',A['chapter-banner']?'chapter-banner':'title-wood',[220,111,500,128]),text(key,'title',`Chương ${chapter} · ${def.name}`,[265,135,410,43],30));
    nodes.push(button(key,'rewards',`${progress.total}/150 ★`,'button-gold',[340,183,260,51],'journey:rewards',{}, {size:23,icon:'chest',iconRect:[12,4,38,40],labelRect:[56,8,190,32],tone:'ink'}));
    nodes.push(button(key,'previous','‹','nav-tile',[12,765,95,120],'journey:chapter',{delta:-1},{size:65,disabled:chapter===1}),button(key,'next','›','nav-tile',[834,765,95,120],'journey:chapter',{delta:1},{size:65,disabled:chapter===M.WORLD.CHAPTERS.length||p.campaign.cleared<chapter*50}));
    nodes.push(button(key,'back','Về Thị Trấn',A['map-back']?'map-back':'journey-button',[759,1485,164,161],'route:home',{}, {labelHidden:true,fit:'contain',className:'exploration-back'}));
    if(state.mapRewards){
      nodes.push(image(key,'rewards-board','panel-parchment',[70,1100,800,325]),text(key,'rewards-title',`Rương sao · ${progress.total}/150 ★`,[130,1140,680,45],34,'ink'));
      M.STAR_MILESTONES.forEach((milestone,i)=>nodes.push(button(key,'reward-'+milestone,progress.claimed.includes(milestone)?'Đã nhận':milestone+' ★','button-gold',[130+i*230,1212,218,102],'journey:claim-stars',{chapter,milestone},{icon:'chest',iconRect:[20,9,65,62],labelRect:[83,22,124,48],size:26,tone:'ink',disabled:progress.total<milestone||progress.claimed.includes(milestone)})));
      nodes.push(text(key,'reward-note',state.mapMessage||'Tích lũy sao qua 50 ải để mở rương',[120,1334,700,42],23,'ink'));
    }
    if(state.mapStage&&M.WORLD.chapterForStage(state.mapStage).index===chapter){
      nodes=nodes.filter(n=>!['campaign.previous','campaign.next','campaign.rewards'].includes(n.id));
      nodes.push({id:'campaign.encounter-sheet',kind:'content',rect:[28,280,885,1270],backgroundAsset:'panel-parchment',className:'encounter-sheet',build:el=>stagePreview(el,p,state.mapStage,state)});
    }
    return nodes;
  }
  function makeDialog(id,title){
    document.getElementById(id)?.remove();const modal=document.createElement('dialog');modal.id=id;modal.className='journey-dialog';modal.setAttribute('aria-label',title);
    const heading=document.createElement('h2');heading.textContent=title;modal.append(heading);const close=document.createElement('button');close.className='close';close.textContent='×';close.setAttribute('aria-label','Đóng');close.onclick=()=>modal.close();modal.append(close);modal.addEventListener('close',()=>modal.remove());document.body.append(modal);return modal;
  }
  function modalButton(modal,label,callback,disabled=false){const b=document.createElement('button');b.type='button';b.className='game-btn';b.textContent=label;b.disabled=disabled;b.onclick=callback;modal.append(b);return b;}
  function paragraph(modal,value){const p=document.createElement('p');p.textContent=value;modal.append(p);return p;}
  const delegate=G.handle;
  function confirmSummon(count,ctx,state){
    const quote=G.engine.summonQuote(count),modal=makeDialog('summon-confirm',`Triệu Hồi ×${count}`),currency=quote.payment==='tickets'?'Vé Triệu Hồi':'Đá Ngọc';
    const art=document.createElement('div');art.className='confirm-cost';art.innerHTML=img(quote.payment==='tickets'?'ticket':'mana')+`<strong>${fmt(quote.cost)} ${currency}</strong>`;modal.append(art);
    paragraph(modal,quote.payment==='tickets'?'Vé trong túi đủ cho lượt này. Xác nhận sử dụng vé để triệu hồi.':`Bạn có ${fmt(quote.tickets)} vé, chưa đủ cho lượt ×${count}. Lượt này sẽ dùng ${fmt(quote.cost)} Đá Ngọc.`);
    if(!quote.enough)paragraph(modal,`Chưa đủ tài nguyên. Cần ${count} vé hoặc ${fmt(count*120)} Đá Ngọc. Bạn chưa bị trừ vật phẩm.`);
    const confirm=modalButton(modal,quote.enough?'Xác Nhận Dùng '+currency:'Chưa Đủ Tài Nguyên',()=>{
      const fresh=G.engine.summonQuote(count);
      if(fresh.payment!==quote.payment||fresh.enough!==quote.enough){modal.close();confirmSummon(count,ctx,state);return;}
      confirm.disabled=true;modal.close();delegate('do:summon',{dataset:{count:String(count),payment:quote.payment}},ctx,state);
    },!quote.enough);confirm.id='confirm-summon';modalButton(modal,'Để Sau',()=>modal.close());modal.showModal();
  }
  function stagePreview(el,p,index,state){
    const e=M.encounter('campaign',index),open=index<=p.campaign.cleared+1,quote=M.campaignRewardPreview(p,index,1),best=p.campaign.stars[index]||0;
    const roster=rankedHeroes(p),hero=p.heroes[state.mapHero]?state.mapHero:roster[0].key,heroStats=M.stats(p,hero);state.mapHero=hero;
    const asset=e.boss?'boss-'+e.bossId:A['creature-'+e.creature]?'creature-'+e.creature:'monster-'+e.creature;
    const loot=(id,n)=>`<span class="encounter-loot" title="${esc(M.RESOURCES[id][0])}">${img(M.RESOURCES[id][1])}<b>${fmt(n)}</b></span>`;
    el.innerHTML=`<header class="encounter-heading"><div><small>${esc(e.name)}</small><h2>${esc(e.enemyName)}</h2></div><button class="encounter-close" data-action="journey:close-stage" aria-label="Đóng thông tin quái">×</button></header>
      <div class="encounter-body"><section class="encounter-identity">${img(asset,'encounter-monster')}<div><span class="encounter-tier">${e.boss?'Boss cuối chương':e.tier==='elite'?'Tinh anh':'Quái thường'}</span><p>Cấp gợi ý <strong>${e.recommended}</strong></p><p>Sinh lực <strong>${fmt(e.enemyHp)}</strong></p><p class="encounter-record">${'★'.repeat(best)+'☆'.repeat(3-best)} <small>Kỷ lục</small></p></div></section>
      <div class="encounter-skills"><b>Kỹ năng</b><p>${e.skills.map(esc).join(' · ')}</p></div>
      <div class="encounter-rewards-heading"><h3>Thưởng dự kiến</h3><span>${quote.first?'Lần thắng đầu':'Đánh lại'}</span></div>
      <p class="encounter-common">Mỗi lần thắng ${Object.entries(quote.reward).filter(([id,n])=>!['gold','exp'].includes(id)&&n>0).map(([id,n])=>loot(id,n)).join('')}${quote.heroFragments?`<span class="encounter-loot" title="Mảnh ${M.HEROES[quote.heroFragments.hero].name}">${img('portrait-'+quote.heroFragments.hero)}<b>+3 mảnh</b></span>`:''}</p>
      <div class="encounter-star-rewards">${[1,2,3].map(stars=>{const q=M.campaignRewardPreview(p,index,stars);return `<article data-stars="${stars}"><div class="encounter-condition"><b>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</b><span>${stars===1?'Chiến thắng':stars===2?'Thắng, còn ≥50% HP':`Thắng, còn ≥50% HP · ≤${e.turnLimit} lượt`}</span></div><div class="encounter-row-loot">${loot('gold',q.reward.gold)}${loot('exp',q.reward.exp)}<small>${q.addedStars?`+${q.addedStars} sao chương`:'Đã đạt mốc sao này'}</small></div>${q.counterReward?`<div class="encounter-counter">${img(q.counterReward.key)}<span>+3 mảnh ${esc(q.counterReward.name)}<small>Chỉ nhận một lần tại mốc này</small></span></div>`:''}</article>`;}).join('')}</div>
      <p class="encounter-reward-note">Nhận thưởng theo kết quả đạt được, không cộng dồn ba dòng. Sao mới tích vào rương chương 50 / 100 / 150 sao.</p>${quote.reward.seals===0?'<p class="encounter-reward-note">Ấn tu luyện đã đạt giới hạn ngày.</p>':''}
      ${e.tactical&&e.boss?'<button class="encounter-guide-link" data-action="guide:open">Xem nội tại và cách khắc chế boss ›</button>':''}</div>
      <footer><div class="encounter-roster-heading"><b>Chọn tướng</b><span>${esc(M.HEROES[hero].name)} · LC ${fmt(heroStats.power)}</span></div><div class="encounter-roster" aria-label="Tướng xuất chiến">${roster.map(({key},i)=>`<button data-action="journey:choose-hero" data-hero="${key}" class="${key===hero?'chosen':''}" aria-pressed="${key===hero}" aria-label="Chọn ${M.HEROES[key].name}">${img('portrait-'+key)}<span>${esc(M.HEROES[key].name)}</span>${i===0?'<i title="Lực chiến cao nhất">★</i>':''}</button>`).join('')}</div><button class="encounter-deploy" data-action="journey:challenge" data-index="${index}" ${open?'':'disabled'}>${open?'Xuất Chiến':'Vượt ải trước để mở'}</button><small>${open?`Cấp ${p.heroes[hero].level} · ${fmt(heroStats.hp)} HP`:`Cần vượt ải ${index-1}`}</small></footer>`;
  }
  const AUDIO_KEY='mam-phep-audio-v1',MUTE_KEY='gemwoven.audio-muted.v1',CHAT_KEY='gemwoven.chat.v1',audioDefaults={music:10,effects:100,voices:29};
  function readStorage(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
  function audioLevels(){const stored=readStorage(AUDIO_KEY,{});return Object.fromEntries(Object.entries(audioDefaults).map(([key,value])=>[key,Number.isFinite(stored[key])?Math.round(Math.max(0,Math.min(100,stored[key]))):value]));}
  let homeMusic=null;
  function playHomeMusic(state){
    if(!(window.AudioContext||window.webkitAudioContext))return;
    if(!homeMusic){homeMusic=new Audio(window.GEMWOVEN_HOME_MUSIC||'assets/audio/music/earth.ogg');homeMusic.loop=true;}
    homeMusic.volume=audioLevels().music/100;
    if(readStorage(MUTE_KEY,false)||!['home','settings'].includes(state.screen)||homeMusic.volume===0)homeMusic.pause();else homeMusic.play().catch(()=>{});
  }
  function settings(el){
    const levels=audioLevels(),muted=readStorage(MUTE_KEY,false);
    el.innerHTML=`<header class="crafted-heading"><h2>Âm Thanh</h2><p>Điều chỉnh âm lượng cho cả thị trấn và chiến đấu</p></header><div class="sound-emblem">${img('icon-settings')}</div><form id="home-audio-form"><label class="mute-control"><input type="checkbox" name="muted" ${muted?'checked':''}> Tắt toàn bộ âm thanh</label>${[['music','Nhạc nền','Giai điệu của thị trấn và các vùng đất'],['effects','Hiệu ứng','Ghép ngọc, vũ khí và kỹ năng'],['voices','Lời thoại','Giọng nói của nhân vật trong trận']].map(([key,label,hint])=>`<label class="audio-slider"><span>${label}<output for="home-volume-${key}" id="home-output-${key}">${levels[key]}%</output></span><small>${hint}</small><input id="home-volume-${key}" name="${key}" type="range" min="0" max="100" value="${levels[key]}" aria-label="${label}"></label>`).join('')}<button type="button" class="game-btn" id="home-audio-reset">Mặc Định</button><p class="audio-save-note" role="status">Tự lưu khi điều chỉnh</p></form><button type="button" class="game-btn crafted-return" data-action="route:home">Về Thị Trấn</button>`;
  }
  function chatRows(){const rows=readStorage(CHAT_KEY,[]);return Array.isArray(rows)?rows.filter(r=>typeof r.text==='string'&&r.text.trim()&&r.text.length<=240&&Number.isFinite(r.at)&&Math.abs(r.at)<=8.64e15&&M.HEROES[r.hero]).slice(-80):[];}
  function chat(el,p,state){
    const system=state.chatTab==='system',rows=system?p.log.slice(0,40).reverse().map(r=>({text:r.message,at:r.at,system:true})):chatRows();
    el.innerHTML=`<header class="crafted-heading"><h2>Trò Chuyện</h2><p>Thị trấn · Trực tuyến Coming soon</p></header><div class="chat-tabs"><button class="game-btn ${system?'':'active'}" data-action="journey:chat-tab" data-tab="town">Thị Trấn</button><button class="game-btn ${system?'active':''}" data-action="journey:chat-tab" data-tab="system">Hệ Thống</button></div><div class="chat-history" role="log" aria-live="polite"><div class="chat-notice">${img('icon-chat')}<p>Góc trò chuyện trên thiết bị của bạn.<br>Tin nhắn trực tuyến sẽ mở khi máy chủ ra mắt.</p></div>${rows.map(row=>`<article class="chat-message ${row.system?'system':''}">${img(row.system?'icon-event':'portrait-'+row.hero,'chat-avatar')}<div><header><b>${row.system?'Hệ Thống':esc(M.HEROES[row.hero].name)+' · Bạn'}</b><time>${new Date(row.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})}</time></header><p>${esc(row.text)}</p></div></article>`).join('')}</div>${system?'<p class="chat-system-note">Nhật ký hành trình và phần thưởng gần đây</p>':`<form id="town-chat-form"><div class="chat-composer"><button type="button" id="chat-emoji-toggle" aria-label="Biểu cảm">☺</button><textarea name="message" maxlength="240" rows="2" aria-label="Tin nhắn" placeholder="Nhắn điều gì đó…"></textarea><button type="submit" class="game-btn">Gửi</button></div><div class="emoji-tray" hidden>${['✨','🌿','⚔️','❤️','😊','👍'].map(e=>`<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`).join('')}</div><small class="chat-counter">0 / 240</small></form>`}<button type="button" class="game-btn crafted-return" data-action="route:home">Về Thị Trấn</button>`;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state),key=state.screen;let nodes=L.screens[key].nodes;
    if(key!=='campaign')state.mapStage=null;
    if(key==='home')nodes=home(nodes);
    else nodes=nodes.filter(n=>!n.id.endsWith('.settings'));
    nodes=nodes.filter(n=>!n.id.endsWith('.side-mail'));
    for(const n of nodes)if(n.id.endsWith('.side-chat')){n.action='route:chat';C[n.text]='Trò Chuyện';}
    if(key==='campaign')nodes=campaign(nodes,p,state);
    if(key==='settings'||key==='chat'){
      nodes=nodes.filter(n=>n.kind!=='content');nodes.push(frame(key,key==='chat'?'chat-frame':'settings-frame',el=>key==='chat'?chat(el,p,state):settings(el),key==='chat'?'chat-panel':'settings-panel'));
    }
    if(key==='arena'){const enemy=nodes.find(n=>n.id==='arena.fighter-ice');if(enemy)enemy.className=((enemy.className||'')+' facing-left').trim();}
    L.screens[key].nodes=nodes;playHomeMusic(state);return p;
  };
  G.handle=(action,el,ctx,state)=>{
    if(action.startsWith('route:')&&action!=='route:campaign')state.mapStage=null;
    if(action.startsWith('hero:')){state.hero=action.slice(5);state.skill=0;ctx.navigate('upgrade');return true;}
    if(action==='route:upgrade'&&el.dataset.node?.endsWith('.profile')){state.hero=G.engine.read().selected;ctx.navigate('upgrade');return true;}
    if(action==='do:summon'){confirmSummon(Number(el.dataset.count||1),ctx,state);return true;}
    if(!action.startsWith('journey:'))return delegate(action,el,ctx,state);
    const command=action.slice(8),d=el.dataset;
    if(command==='stage'){const index=Number(d.index),p=G.engine.read();if(Number.isInteger(index)&&index>0&&index<=revealedStage(p)){state.mapStage=index;state.mapHero=rankedHeroes(p)[0]?.key;state.mapRewards=false;state.chapterGuide=false;ctx.render();}}
    if(command==='choose-hero'){if(state.mapStage&&G.engine.read().heroes[d.hero]){state.mapHero=d.hero;ctx.render();}}
    if(command==='close-stage'){state.mapStage=null;ctx.render();}
    if(command==='challenge'){const index=Number(d.index),p=G.engine.read();if(index===state.mapStage&&index<=p.campaign.cleared+1&&p.heroes[state.mapHero]){G.engine.select(state.mapHero);delegate('do:battle',{dataset:{mode:'campaign',index:String(index)}},ctx,state);}}
    if(command==='rewards'){state.mapRewards=!state.mapRewards;ctx.render();}
    if(command==='featured-gear')ctx.showModal(M.SLOTS[d.slot]+' · '+M.RARITIES[d.rarity].name,[d.asset],d.rarity==='divine'?'Trang bị Thần có một hiệu ứng đặc biệt ngẫu nhiên: kháng mất lượt hoặc tạo lá chắn đầu lượt. Xem bảng tỷ lệ để biết cơ hội ra phẩm chất.':'Trang bị Huyền Thoại có chỉ số cao, có thể cường hóa đến +20. Xem bảng tỷ lệ để biết cơ hội ra phẩm chất.');
    if(command==='chapter'){state.mapStage=null;state.chapter=Math.max(1,Math.min(M.WORLD.CHAPTERS.length,state.chapter+Number(d.delta)));ctx.render();}
    if(command==='claim-stars'){try{const r=G.engine.claimChapter(Number(d.chapter),Number(d.milestone));state.mapMessage=resourceText(r);ctx.render();}catch(error){state.mapMessage=error.message;ctx.render();}}
    if(command==='chat-tab'){state.chatTab=d.tab;ctx.render();}
    return true;
  };
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    const map=document.querySelector('.exploration-map');if(map){map.scrollTop=Number(map.dataset.scrollTarget);map.alignHeader?.();}
    mount(state,ctx);
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
