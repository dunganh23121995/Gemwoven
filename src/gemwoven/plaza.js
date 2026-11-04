/* Quảng Trường (docs/GAME_DESIGN.md §14): the Trò Chuyện screen is a place. Your hero (its town look)
 * walks the square; others are live players from the social server (server/social), never fakes; chat
 * pops up over heads; standing close you tap someone for friends, whispers, a friendly fight or a guild
 * invite. The server decides positions, chat, friends and guilds; this file shows them and sends
 * intents. Without the server the square opens offline with only you and the labelled NPCs.
 * Rules shared with the server: src/gemwoven/social-protocol.js (window.GemwovenSocial).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,S=window.GemwovenSocial,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS;
  if(!G||!S||!L?.screens?.chat)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN');
  const asset=key=>A[key]?.file||'';
  // Drawn plaza pieces (assets/gemwoven/plaza/ui, cut from Codex sheets by assets/gemwoven/raw/plaza-ui/cut.py).
  const ui=name=>asset('plaza-ui-'+name)||`assets/gemwoven/plaza/ui/${name}.webp`;
  const icon=(name,cls='pz-ico')=>`<img class="${cls}" src="${esc(ui(name))}" alt="" draggable="false">`;
  const CSS_PIECES=['back','sign','strip','plaque','seal','action','ledge','rail','chan','field','send','plate','plate-me','npc-tag','bubble','bubble-tail',
    'stick-ring','stick-thumb','close','socket','tile','tile-on','tile-off','switch-on','switch-off','knob-off','tab','tab-on','tag','switch','knob','field-form','notice','trough','fill','lamp-on','lamp-wait','lamp-off','lamp-dark','knot','crest','arrow'];
  const EMBLEM=e=>`<img class="pz-emblem" src="${esc(ui('g-'+(S.GUILD_EMBLEMS.includes(e)?e:'sword')))}" alt="">`;
  const empty=text=>`<li class="empty">${icon('x-empty','pz-empty-art')}<span>${text}</span></li>`;
  const ACCOUNT_KEY='gemwoven.social.v1',PREFS_KEY='gemwoven.plaza.v1';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f;}catch{return f;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
  const FRAME_W=941,FRAME_H=1672,CHAT_H=150,WORLD_K=1.24,HEAD_PX=13;
  const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Dev hub on :8080 talks to the social server on :8091 of the same host; a release build is served with
  // the social server behind the same domain at /social.
  function serverUrl(){
    if(window.GEMWOVEN_SOCIAL_URL)return window.GEMWOVEN_SOCIAL_URL;
    const l=location;if(l.protocol==='file:')return 'ws://127.0.0.1:8091/social';
    if(l.port==='8080')return `ws://${l.hostname}:8091/social`;
    return `${l.protocol==='https:'?'wss':'ws'}://${l.host}/social`;
  }

  // ---------- Data the square needs (geometry, hero sprites) ----------
  let geo=S.DEFAULT_GEO,sprites={},ready=null;
  function load(){return ready??=Promise.all([
    fetch('assets/gemwoven/plaza/plaza.json').then(r=>r.json()).then(j=>{geo=j;}).catch(()=>{}),
    fetch('assets/gemwoven/plaza/sprites.json').then(r=>r.json()).then(j=>{sprites=j;}).catch(()=>{})]);}

  // ---------- State ----------
  const P={root:null,world:null,actors:new Map(),me:null,net:null,status:'idle',channel:null,counts:{},friends:{friends:[],incoming:[],outgoing:[],blocks:[],friendPoints:0},
    guild:null,guilds:[],log:[],chatCh:'area',whisperTo:null,sheet:null,active:false,keys:new Set(),stick:null,pendingTalk:null,zone:null,lastSend:0,raf:0,toastTimer:0,seenHelp:false};
  const prefs=Object.assign({stick:'free',side:'left',arrows:true},read(PREFS_KEY,{}));

  // Worn season looks (progression.js cosmetics), drawn only on this device for now.
  function myLook(slot){const id=G.engine.looks?.()?.[slot];return id&&window.GemwovenLiveOps?.COSMETICS?.find(c=>c.id===id)||null;}
  function myProfile(){
    const p=G.engine.read(),key=p.selected,h=p.heroes[key];
    const worn=p.title&&M.titleList?M.titleList(p).find(t=>t.id===p.title&&t.unlocked):null;
    // A worn season title rides like any title; owning it is checked by the server later (Sắp ra mắt), so other players
    // see its name on a common plate while this device shows the season's own art.
    const season=myLook('title');
    return {hero:key,look:M.lookForm?M.lookForm(key,h):1,level:h?.level||1,stars:h?.stars||1,power:M.stats(p,key).power,title:season?.name||worn?.name||'',titleTier:season?3:worn?.tier||0,frame:''};
  }

  // ---------- Network ----------
  function connect(){
    if(P.net&&P.net.readyState<=1)return;
    P.status='connecting';status();
    let ws;try{ws=new WebSocket(serverUrl());}catch{return offline();}
    P.net=ws;const timer=setTimeout(()=>{if(P.status!=='online'){try{ws.close();}catch{}offline();}},4000);
    ws.onopen=()=>{const acc=read(ACCOUNT_KEY,{});send({t:'hello',id:acc.id,token:acc.token,p:myProfile()});};
    ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}onMessage(m,timer);};
    ws.onclose=()=>{clearTimeout(timer);if(P.net!==ws)return;P.net=null;if(P.active){if(P.status==='online')toast('Mất kết nối. Đang nối lại…');P.status='offline';status();setTimeout(()=>{if(P.active&&!P.net)connect();},Math.min(15000,(P.retry=(P.retry||0)+1)*2000));}};
    ws.onerror=()=>{};
  }
  function send(m){if(P.net?.readyState===1)P.net.send(JSON.stringify(m));}
  function offline(){
    P.status='offline';status();
    if(!P.me)spawnMe([...(geo.spawn||S.MAP.spawn)]);
    if(!P.offlineNoted){P.offlineNoted=true;addLog({ch:'system',name:'Hệ thống',text:'Chưa kết nối được máy chủ Quảng Trường. Bạn vẫn đi dạo và trò chuyện với NPC; người chơi khác sẽ hiện khi kết nối lại.'});}
  }
  function onMessage(m,timer){
    switch(m.t){
      case 'needName':clearTimeout(timer);P.status='naming';status();return openSheet('name');
      case 'registered':write(ACCOUNT_KEY,{id:m.id,token:m.token});return;
      case 'welcome':clearTimeout(timer);P.retry=0;P.status='online';P.you=m.you;if(m.you?.name)write(ACCOUNT_KEY,{...read(ACCOUNT_KEY,{}),name:m.you.name});P.friends=m.friends;P.guild=m.guild;status();badges();
        if(P.sheet==='name')closeSheet();addLog({ch:'system',name:'Hệ thống',text:`Chào ${m.you.name}! Đứng gần ai đó rồi chạm vào nhân vật của họ để kết bạn hoặc giao hữu.`});return;
      case 'channel':{P.channel=m.n;P.counts=m.counts||{};for(const [id,a] of [...P.actors])if(!a.npc&&id!=='me')removeActor(id);
        spawnMe(P.me?.pos||[...(geo.spawn||S.MAP.spawn)],true);for(const p of m.players)upsert(p);status();return;}
      case 'join':upsert(m.p);return status();
      case 'player':return upsert(m.p);
      case 'leave':removeActor(m.id);return status();
      case 'pos':for(const [id,x,y] of m.p){if(id===P.you?.id){const me=P.me;if(!me)continue;const d=Math.hypot(me.pos[0]-x,me.pos[1]-y);if(d>60){me.pos=[x,y];}else if(d>6&&!me.moving){me.pos=[me.pos[0]+(x-me.pos[0])*.3,me.pos[1]+(y-me.pos[1])*.3];}continue;}
        const a=P.actors.get(id);if(a){a.target=[x,y];a.lastMove=performance.now();}}return;
      case 'say':{addLog(m);const a=P.actors.get(m.from===P.you?.id?'me':m.from);if(a&&m.ch!=='system')bubble(a,m.text);return;}
      case 'emote':{const a=P.actors.get(m.from===P.you?.id?'me':m.from);if(a)emote(a,m.id);return;}
      case 'friends':P.friends=m;badges();if(P.sheet==='friends')openSheet('friends');return;
      case 'friendReq':toast(`${m.name} muốn kết bạn với bạn.`,{label:'Xem',run:()=>openSheet('friends','incoming')});return;
      case 'guild':P.guild=m.guild;badges();if(['guild','lantern'].includes(P.sheet))openSheet(P.sheet,P.sheetTab);refreshMyTag();return;
      case 'guilds':P.guilds=m.list;if(P.sheet==='guild')openSheet('guild',P.sheetTab);return;
      case 'duelInvite':return duelPrompt(m);
      case 'duelStart':return startSpar(m);
      case 'toast':return toast(m.text);
      case 'err':if(m.ref==='register'&&P.sheet==='name'){const e=P.root.querySelector('.pz-name-error');if(e)e.textContent=m.text;return;}return toast(m.text,{error:true});
    }
  }

  // ---------- Actors ----------
  function heroSheet(hero,look){const forms=sprites[hero]||sprites.novice||{};return forms[String(look)]||forms['1']||null;}
  function makeActor(id,{name,hero='novice',look=1,npc=null,tag='',title='',x,y}){
    const el=document.createElement('div');el.className='pz-actor'+(npc?' is-npc':'')+(id==='me'?' is-me':'');el.dataset.id=id;
    el.innerHTML=`<div class="pz-shadow"></div><div class="pz-body"></div><button type="button" class="pz-hit" aria-label="${esc(name)}"></button>`;
    // Name plate, speech and emotes ride in a layer above every body so nobody's sprite hides them.
    const lab=document.createElement('div');lab.className='pz-actor pz-labels'+(npc?' is-npc':'')+(id==='me'?' is-me':'');lab.innerHTML=`<div class="pz-plate"><span class="pz-title"></span><span class="pz-name"></span></div><div class="pz-bubbles"></div><div class="pz-emote"></div>`;
    const a={id,el,lab,name,hero,look,npc,tag,title,pos:[x,y],target:[x,y],side:0,dir:1,moving:false,frame:0,sheet:null,bubbles:[]};
    el.querySelector('.pz-hit').addEventListener('click',e=>{e.stopPropagation();talkTo(a);});
    setLook(a,hero,look,npc);setPlate(a);P.world.append(el);labels().append(lab);P.actors.set(id,a);return a;
  }
  function setLook(a,hero,look,npc){
    a.hero=hero;a.look=look;const body=a.el.querySelector('.pz-body');
    if(npc){a.npcImg=npc.img;const r=npc.rig,st=r?.plaza;
      // A rigged NPC plays its baked resting loop (sheet cell sized so her crown stands st.height map px above her soles).
      if(r?.cols&&st){a.cell=st.height/st.bodyHeight;a.headY=-st.height-4;a.el.querySelector('.pz-shadow').style.cssText='left:-40px;top:-11px;width:80px;height:22px';a.sheets={idle:{src:r.file,cols:r.cols,rows:r.rows,count:r.count,frameDuration:r.frameDuration,footY:st.footY,feetX:st.feetX}};a.sheet=null;applySheet(a,'idle');return;}
      body.style.cssText=`background-image:url("${npc.img}");background-size:contain;background-repeat:no-repeat;background-position:center bottom;width:${npc.w}px;height:${npc.h}px;left:${-npc.w/2}px;top:${-npc.h}px`;a.headY=-npc.h;return;}
    a.sheets=heroSheet(hero,look);const idle=a.sheets?.idle;if(!idle)return;
    const head=a.sheets.head||.053,cell=HEAD_PX/head;a.cell=cell;a.headY=-(idle.bodyHeight||.7)*cell-4;
    for(const s of [a.sheets.idle,a.sheets.move])if(s&&!s.img){s.img=new Image();s.img.src=s.src;}
    a.sheet=null;applySheet(a,'idle');
  }
  function applySheet(a,kind){
    const s=a.sheets?.[kind];if(!s||a.sheet===s)return;a.sheet=s;a.frame=0;a.frameAt=0;const body=a.el.querySelector('.pz-body');
    const size=a.cell*(kind==='move'&&s.scale?Math.min(1.8,s.scale):1)*(kind==='move'&&!s.scale&&a.sheets.idle.bodyHeight?1:1),foot=s.footY||.94,fx=s.feetX||.5;
    body.style.cssText=`background-image:url("${s.src}");background-size:${s.cols*100}% ${s.rows*100}%;width:${size}px;height:${size}px;left:${-fx*size}px;top:${-foot*size}px;transform-origin:${fx*100}% ${foot*100}%`;
  }
  function setPlate(a){
    const friend=!a.npc&&a!==P.me&&P.friends.friends.some(f=>f.id===a.id),mate=!a.npc&&a!==P.me&&!!P.guild?.members?.some(m=>m.id===a.id);
    // Drawn plate (own plate has blue clasps); a friendship knot or a guild crest rides in front of the name.
    a.lab.querySelector('.pz-name').innerHTML=(friend?icon('knot','pz-mark'):'')+(mate?icon('crest','pz-mark'):'')+(a.tag?`<b>[${esc(a.tag)}]</b>`:'')+`<span>${esc(a.name)}</span>`+(a.npc?'<i>NPC</i>':'');
    // The worn title rides above the name on its rarity plate (assets/gemwoven/titles), as in combat.
    const t=a.lab.querySelector('.pz-title'),own=a===P.me?myLook('title'):null;t.hidden=!a.title;t.innerHTML=a.title?`<span class="title-plate tier-${a.titleTier||1}${own?' is-season':''}"><img src="${own?own.file:`assets/gemwoven/titles/plate-${a.titleTier||1}.webp`}" alt=""><b>${esc(a.title)}</b></span>`:'';
    const plate=a===P.me?myLook('nameplate'):null;a.lab.querySelector('.pz-name').classList.toggle('is-season',!!plate);a.lab.querySelector('.pz-name').style.setProperty('--season-plate',plate?`url("${new URL(plate.file,document.baseURI).href}")`:'');
    a.lab.querySelector('.pz-plate').style.top=`${a.headY-(a.title?84:30)}px`;a.lab.querySelector('.pz-bubbles').style.bottom=`${-a.headY+40}px`;a.lab.querySelector('.pz-emote').style.bottom=`${-a.headY+36}px`;
    a.el.querySelector('.pz-hit').style.cssText=`width:${Math.max(70,a.cell*.42||90)}px;height:${Math.max(90,-a.headY+10)}px;left:${-Math.max(70,a.cell*.42||90)/2}px;top:${a.headY}px`;
    for(const e of [a.el,a.lab]){e.classList.toggle('is-friend',friend);e.classList.toggle('is-guildmate',mate);}
  }
  function spawnMe(pos,keep){
    const prof=myProfile(),name=P.you?.name||'Bạn';
    if(P.me&&keep){P.me.name=name;setLook(P.me,prof.hero,prof.look);refreshMyTag();return;}
    if(P.me)removeActor('me');P.me=makeActor('me',{name,hero:prof.hero,look:prof.look,x:pos[0],y:pos[1]});refreshMyTag();
  }
  function refreshMyTag(){if(!P.me)return;P.me.name=P.you?.name||'Bạn';P.me.tag=P.guild?.tag||'';const mine=myProfile();P.me.title=mine.title;P.me.titleTier=mine.titleTier;setPlate(P.me);for(const a of P.actors.values())if(!a.npc&&a!==P.me)setPlate(a);}
  function upsert(p){
    if(p.id===P.you?.id)return;let a=P.actors.get(p.id);
    if(!a){a=makeActor(p.id,{name:p.name,hero:p.p?.hero,look:p.p?.look,tag:p.tag,title:p.p?.title,x:p.x,y:p.y});a.titleTier=p.p?.titleTier||0;}
    else{if(a.hero!==p.p?.hero||a.look!==p.p?.look)setLook(a,p.p?.hero,p.p?.look);a.name=p.name;a.tag=p.tag;a.title=p.p?.title||'';a.titleTier=p.p?.titleTier||0;a.target=[p.x,p.y];}
    a.profile=p.p;a.guildName=p.guild;setPlate(a);
  }
  function labels(){let l=P.world.querySelector('.pz-label-layer');if(!l){l=document.createElement('div');l.className='pz-label-layer';P.world.append(l);}return l;}
  function removeActor(id){const a=P.actors.get(id);if(!a)return;a.el.remove();a.lab.remove();P.actors.delete(id);}
  // NPCs (Miu Dẫn Lối, Tơ Đèn) move at rest on a baked mesh rig (assets/gemwoven/npc/npc_rig.py plaza-<id>): the asset
  // plaza-npc-<id> is that sheet with its anchors; the still portrait npc-<id>.webp rides in cards and lists.
  function spawnNpcs(){
    for(const n of geo.npcs||[]){if(P.actors.has('npc-'+n.id))continue;const img=`assets/gemwoven/plaza/npc-${n.id}.webp`,rig=A['plaza-npc-'+n.id];
      const a=makeActor('npc-'+n.id,{name:n.name,npc:{img,w:118,h:150,rig},x:n.x,y:n.y});a.npcId=n.id;setPlate(a);}
  }

  // ---------- Speech ----------
  function bubble(a,text){
    const box=a.lab.querySelector('.pz-bubbles'),b=document.createElement('p'),cos=a===P.me?myLook('bubble'):null;b.className='pz-bubble'+(cos?' is-season':'');if(cos)b.style.setProperty('--season-bubble',`url("${new URL(cos.file,document.baseURI).href}")`);
    b.innerHTML=`<span>${esc(text.length>120?text.slice(0,119)+'…':text)}</span><i class="pz-tail"></i>`;box.append(b);while(box.children.length>2)box.firstChild.remove();
    const all=[...P.world.querySelectorAll('.pz-bubble')];if(all.length>4)all.slice(0,all.length-4).forEach(x=>x.remove());
    setTimeout(()=>{b.classList.add('fade');setTimeout(()=>b.remove(),500);},Math.min(6000,4000+text.length*25));
  }
  function emote(a,id){const e=S.EMOTES.find(x=>x[0]===id);if(!e)return;const box=a.lab.querySelector('.pz-emote');box.innerHTML=icon('e-'+id,'');box.classList.remove('show');void box.offsetWidth;box.classList.add('show');}
  function addLog(m){
    P.log.push({...m,at:m.at||Date.now()});if(P.log.length>150)P.log.shift();
    const ticker=P.root?.querySelector('.pz-ticker');if(ticker){const rows=P.log.filter(x=>x.ch!=='whisper'||x.from===P.you?.id||x.to===P.you?.id).slice(-3);
      ticker.innerHTML=rows.map(r=>`<p class="ch-${r.ch}">${chLabel(r)}<b>${who(r)}</b> ${esc(r.text)}</p>`).join('');}
    if(P.sheet==='log')openSheet('log',P.sheetTab);
  }
  const who=r=>r.ch==='system'?'':`${esc(r.tag?`[${r.tag}] `:'')}${esc(r.name)}:`;
  // Channel tags ride on a small drawn parchment tag (plaza-ui-tag); the colour of the word tells the channel.
  const chLabel=r=>r.ch==='guild'?'<em class="pz-chtag tag-guild">Bang</em>':r.ch==='whisper'?`<em class="pz-chtag tag-whisper">${r.from===P.you?.id?'→ '+esc(r.toName):'Riêng'}</em>`:r.ch==='system'?'<em class="pz-chtag tag-system">Hệ thống</em>':'';

  // ---------- Movement: intents to the server, the same steering locally ----------
  function goTo(world){if(!P.me)return;P.me.target=S.clampTarget(geo,world);send({t:'move',to:P.me.target});}
  function steer(dx,dy){if(!P.me)return;const len=Math.hypot(dx,dy);if(len<.15){if(P.me.steering){P.me.steering=false;goTo(P.me.pos);}return;}
    P.me.steering=true;const reach=95;const t=[P.me.pos[0]+dx/len*reach*Math.min(1,len),P.me.pos[1]+dy/len*reach*Math.min(1,len)];P.me.target=S.clampTarget(geo,t);
    const now=performance.now();if(now-P.lastSend>100){P.lastSend=now;send({t:'move',to:P.me.target});}}
  function tick(now){
    P.raf=requestAnimationFrame(tick);if(!P.active||!P.root)return;
    const dt=Math.min(.05,(now-(P.last||now))/1000);P.last=now;
    // Keyboard
    if(!P.typing&&P.keys.size){const k=P.keys;steer((k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0));P.pendingTalk=null;}
    for(const a of P.actors.values()){
      if(a.npc){const s=a.sheet;
        // Reduced motion holds the resting first frame.
        if(s){if(reduced())a.frame=0;else{a.frameAt=(a.frameAt||0)+dt*1000;const dur=s.frameDuration||100;if(a.frameAt>=dur){a.frameAt%=dur;a.frame=(a.frame+1)%s.count;}}
          if(a.shown!==a.frame){a.shown=a.frame;a.el.querySelector('.pz-body').style.backgroundPosition=`${a.frame%s.cols/(s.cols-1)*100}% ${Math.floor(a.frame/s.cols)/(s.rows-1)*100}%`;}}
        a.el.style.transform=a.lab.style.transform=`translate(${a.pos[0]}px,${a.pos[1]}px)`;a.el.style.zIndex=a.lab.style.zIndex=String(Math.round(a.pos[1]));continue;}
      const before=a.pos;let moving=false;
      if(a===P.me){const r=S.step(geo,a.pos,a.target,dt,a.side);a.side=r.side;moving=Math.hypot(r.pos[0]-before[0],r.pos[1]-before[1])>.2;if(moving&&Math.abs(r.pos[0]-before[0])>.3)a.dir=r.pos[0]>before[0]?1:-1;a.pos=r.pos;}
      else{const d=Math.hypot(a.target[0]-a.pos[0],a.target[1]-a.pos[1]);if(d>200)a.pos=[...a.target];else if(d>.5){const k=Math.min(1,dt*12);const nx=a.pos[0]+(a.target[0]-a.pos[0])*k;if(Math.abs(nx-a.pos[0])>.3)a.dir=nx>a.pos[0]?1:-1;a.pos=[nx,a.pos[1]+(a.target[1]-a.pos[1])*k];moving=d>2;}}
      a.moving=moving;applySheet(a,moving?'move':'idle');
      const s=a.sheet;if(s&&!reduced()){a.frameAt=(a.frameAt||0)+dt*1000;const dur=s.frameDuration||(moving?90:120);if(a.frameAt>=dur){a.frameAt%=dur;a.frame=(a.frame+1)%s.count;}}
      if(s){const c=a.frame%s.cols,r=Math.floor(a.frame/s.cols),body=a.el.querySelector('.pz-body');body.style.backgroundPosition=`${s.cols>1?c/(s.cols-1)*100:0}% ${s.rows>1?r/(s.rows-1)*100:0}%`;body.style.transform=a.dir<0?'scaleX(-1)':'';}
      a.el.style.transform=a.lab.style.transform=`translate(${a.pos[0].toFixed(1)}px,${a.pos[1].toFixed(1)}px)`;a.el.style.zIndex=a.lab.style.zIndex=String(Math.round(a.pos[1]));
    }
    // Name plates of people standing close step up so they never overlap (a few times a second).
    if(now-(P.declutterAt||0)>200){P.declutterAt=now;const list=[...P.actors.values()].filter(a=>!a.npc).sort((a,b)=>b.pos[1]-a.pos[1]);
      const near=(a,b,w,h)=>Math.abs(a.pos[0]-b.pos[0])<w&&Math.abs(a.pos[1]-b.pos[1])<h;
      for(let i=0;i<list.length;i++){const a=list[i];let lift=0;a.pdx??=0;for(let j=0;j<i;j++)if(near(a,list[j],130,50))lift=Math.max(lift,(list[j].lift||0)+44);
        a.bubbleH=a.lab.querySelector('.pz-bubbles').offsetHeight;
        if(lift!==(a.lift||0)){a.lift=lift;a.lab.querySelector('.pz-emote').style.translate=`0 ${-lift}px`;}}
      // Speech never covers a name plate or other speech: measured on screen, front people first, later speech steps up.
      const k=P.world.getBoundingClientRect().width/1024*WORLD_K||1,plates=list.map(a=>a.lab.querySelector('.pz-plate').getBoundingClientRect()),placed=[];
      for(let i=0;i<list.length;i++){const a=list[i],box=a.lab.querySelector('.pz-bubbles');if(!a.bubbleH){if(a.blift){a.blift=0;box.style.translate='';}continue;}
        const r=box.getBoundingClientRect(),base=r.bottom+(a.blift||0)*k,h=r.height,over=q=>q.right>r.left+4&&q.left<r.right-4;let need=0;
        for(const q of plates)if(over(q)&&q.bottom>base-h-4&&q.top<base+2)need=Math.max(need,(base-q.top+6)/k);
        for(let pass=0;pass<2;pass++)for(const q of placed)if(over(q)&&base-need*k>q.top-4&&base-need*k-h<q.bottom)need=Math.max(need,(base-q.top+8)/k);
        need=Math.round(need);placed.push({left:r.left,right:r.right,top:base-need*k-h,bottom:base-need*k});
        if(need!==(a.blift||0)){a.blift=need;box.style.translate=`${a.bdx||0}px ${-need}px`;}}
      // Plates and speech slide sideways to stay clear of the right-hand plaques and the frame edges.
      const side=P.root.querySelector('.pz-side').getBoundingClientRect(),root=P.root.getBoundingClientRect();
      const clear=(el,cur,ty)=>{const r=el.getBoundingClientRect(),left=r.left-cur*k,right=r.right-cur*k,top=r.top,bottom=r.bottom;
        const edge=side.width&&bottom>side.top&&top<side.bottom?side.left-6:root.right-6;let dx=0;if(right>edge)dx=(edge-right)/k;if(left+dx*k<root.left+6)dx=(root.left+6-left)/k;
        dx=Math.round(dx);const t=`${dx}px ${-ty}px`;if(el.style.translate!==t)el.style.translate=t;return dx;};
      for(const a of P.actors.values()){a.pdx=clear(a.lab.querySelector('.pz-plate'),a.pdx||0,a.lift||0);if(a.bubbleH)a.bdx=clear(a.lab.querySelector('.pz-bubbles'),a.bdx||0,a.blift||0);}}
    if(P.me){camera();zone();if(P.pendingTalk){const t=P.pendingTalk;if(performance.now()>t.until||!P.actors.has(t.a.id))P.pendingTalk=null;else if(S.near(P.me.pos,t.a.pos,geo.interact||S.MAP.interact)){P.pendingTalk=null;goTo(P.me.pos);if(t.npc)npcTalk(t.npc);else openCard(t.a);}}arrows();}
  }
  function viewH(){return FRAME_H-CHAT_H-(P.typing?520:0);}
  function camera(){
    const w=geo.width*WORLD_K,h=geo.height*WORLD_K,vh=viewH(),me=P.me.pos;
    const cx=Math.max(0,Math.min(w-FRAME_W,me[0]*WORLD_K-FRAME_W/2)),cy=Math.max(0,Math.min(h-vh,me[1]*WORLD_K-vh*(P.typing?.5:.58)));
    P.cam=[cx,cy];P.world.style.transform=`translate(${-cx}px,${-cy}px) scale(${WORLD_K})`;
  }
  function zone(){
    const z=S.zoneAt(geo,P.me.pos[0],P.me.pos[1]);if(z===P.zone)return;P.zone=z;
    const btn=P.root.querySelector('.pz-context'),info=(geo.zones||[]).find(x=>x.id===z);
    const label={guild:'Vào Sảnh Bang',lantern:'Dệt Đèn Bang',ring:'Sẵn sàng',board:'Xem Bảng Tin'}[z],pic={guild:'i-gate',lantern:'i-lantern',ring:'i-swords',board:'i-board'}[z];
    btn.hidden=!label;if(label){btn.innerHTML=`${icon(pic)}<span>${label}</span>`;btn.dataset.zone=z;btn.setAttribute('aria-label',z==='ring'?'Sẵn sàng giao hữu':label);}
    P.root.querySelector('.pz-place').textContent=info&&z!=='fountain'?info.name:'Gặp Gỡ · Quảng Trường';
  }
  // Up to three arrows at the edge for friends and guild mates outside the view (optional).
  function arrows(){
    const box=P.root.querySelector('.pz-arrows');if(!prefs.arrows){box.innerHTML='';return;}
    const vh=viewH(),out=[];for(const a of P.actors.values()){if(a.npc||a===P.me)continue;const friend=P.friends.friends.some(f=>f.id===a.id),mate=P.guild?.members?.some(m=>m.id===a.id);if(!friend&&!mate)continue;
      const sx=a.pos[0]*WORLD_K-P.cam[0],sy=a.pos[1]*WORLD_K-P.cam[1];if(sx>40&&sx<FRAME_W-40&&sy>200&&sy<vh-40)continue;out.push({a,sx,sy,d:Math.hypot(a.pos[0]-P.me.pos[0],a.pos[1]-P.me.pos[1])});}
    out.sort((x,y)=>x.d-y.d);
    box.innerHTML=out.slice(0,3).map(({a,sx,sy})=>{const x=Math.max(40,Math.min(FRAME_W-40,sx)),y=Math.max(230,Math.min(vh-50,sy)),ang=Math.atan2(sy-y,sx-x)*180/Math.PI;
      const friend=P.friends.friends.some(f=>f.id===a.id);
      return `<span style="left:${x}px;top:${y}px"><i style="transform:rotate(${ang}deg)"></i><b>${icon(friend?'knot':'crest','pz-mark')}${esc(a.name)}</b></span>`;}).join('');
  }

  // ---------- Interaction ----------
  function talkTo(a){
    if(a===P.me)return openSheet('me');
    if(a.npc)return npcTalk(a);
    // Several players on one spot: let the player choose who they meant.
    if([...P.actors.values()].some(b=>!b.npc&&b!==P.me&&b!==a&&Math.hypot(b.pos[0]-a.pos[0],b.pos[1]-a.pos[1])<40))return openSheet('near');
    if(S.near(P.me.pos,a.pos,geo.interact||S.MAP.interact))return openCard(a);
    P.pendingTalk={a,until:performance.now()+5000};const dx=P.me.pos[0]-a.pos[0],dy=P.me.pos[1]-a.pos[1],d=Math.hypot(dx,dy)||1;goTo([a.pos[0]+dx/d*90,a.pos[1]+dy/d*60]);
  }
  function npcTalk(a){
    if(!S.near(P.me.pos,a.pos,(geo.interact||S.MAP.interact)+40)){P.pendingTalk={a:{...a,npc:false,id:a.id,pos:a.pos},until:performance.now()+5000,npc:a};goTo([a.pos[0],a.pos[1]+70]);setTimeout(()=>{if(P.me&&S.near(P.me.pos,a.pos,(geo.interact||S.MAP.interact)+40))npcTalk(a);},2600);return;}
    if(a.npcId==='weaver')return openSheet('lantern');return openSheet('help');
  }
  function openCard(a){P.cardFor=a;openSheet('card');}

  // ---------- Sheets (bottom panels) ----------
  const isFriend=id=>P.friends.friends.some(f=>f.id===id);
  const myRank=()=>P.guild?.me?.rank;const can=k=>myRank()&&S.RANKS[myRank()][k];
  function face(hero){return `<img class="pz-face" src="${esc(asset('face-'+hero)||asset('portrait-'+hero))}" alt="">`;}
  // Every sheet starts with <h3>: openSheet moves it onto the frame's wooden title plank.
  const tabs=(list,t)=>`<nav class="pz-tabs">${list.map(([k,l])=>`<button type="button" data-tab="${k}" class="${t===k?'on':''}">${l}</button>`).join('')}</nav>`;
  const tile=(kind,id,pic,label,{off=false,cls=''}={})=>`<button type="button" class="pz-tile ${cls}" data-do="${kind}" ${id!=null?`data-id="${esc(id)}"`:''} aria-label="${esc(label)}" title="${esc(label)}" ${off?'disabled':''}>${icon(pic)}</button>`;
  const lamp=(on,cls='')=>icon(on===true?'lamp-on':on==='wait'?'lamp-wait':on==='off'?'lamp-off':'lamp-dark','pz-lamp '+cls);
  const socket=html=>`<span class="pz-socket">${html}</span>`;
  const stars=n=>`<span class="pz-stars">${'★'.repeat(Math.max(1,n||1))}</span>`;
  function sheetHtml(kind,tab){
    const online=P.status==='online',needNet=online?'':`<p class="pz-note pz-offline">${lamp('off')}Cần kết nối máy chủ Quảng Trường.</p>`;
    switch(kind){
      case 'name':return `<h3>Đặt tên</h3><header class="pz-card-head">${socket('<img src="assets/gemwoven/plaza/npc-guide.webp" alt="">')}<div><b class="pz-card-name">Chào bạn mới, meo!</b><p>Tên hiện trên đầu nhân vật · ${S.LIMITS.name[0]}–${S.LIMITS.name[1]} ký tự · không đổi được trong bản thử nghiệm.</p></div></header>
        <form class="pz-form" data-form="name"><span class="pz-input-wrap"><input name="name" maxlength="${S.LIMITS.name[1]}" autocomplete="off" aria-label="Tên của bạn" value="${esc(P.suggest||='Lữ Khách '+Math.floor(1000+Math.random()*9000))}"></span><button class="gw-btn" type="submit">Vào Quảng Trường</button></form><p class="pz-name-error"></p>`;
      case 'card':{const a=P.cardFor;if(!a)return '';const p=a.profile||{},friend=isFriend(a.id),pending=P.friends.outgoing.some(f=>f.id===a.id);
        const inviteGuild=can('approve')&&!a.tag;
        return `<h3>Hồ sơ</h3><header class="pz-card-head">${socket(face(a.hero))}<div><b class="pz-card-name">${a.tag?`<em>[${esc(a.tag)}]</em> `:''}${esc(a.name)}</b><p>${esc(M.HEROES[a.hero]?.name||'')} · cấp ${p.level||1} ${stars(p.stars)}</p>
          <p>Lực chiến <b>${fmt(p.power)}</b> <small>chưa xác thực</small>${a.guildName?` · ${icon('crest','pz-mark')}${esc(a.guildName)}`:''}</p></div></header>
          <div class="pz-actions">${friend?`<button class="gw-btn" data-do="whisper" data-id="${a.id}">${icon('i-letter')}Nhắn riêng</button>`:`<button class="gw-btn" data-do="friend" data-id="${a.id}" ${pending?'disabled':''}>${icon('i-friends')}${pending?'Đã mời':'Kết bạn'}</button>`}
          <button class="gw-btn" data-do="duel" data-id="${a.id}">${icon('i-swords')}Giao hữu</button>${inviteGuild?`<button class="gw-btn secondary" data-do="ginvite" data-id="${a.id}">${icon('i-invite')}Mời vào bang</button>`:''}</div>
          <p class="pz-note pz-center">${icon('i-swords','pz-ico-s')}Đấu bản sao AI · chỉ số chuẩn hóa · Không thưởng</p>
          <details class="pz-more"><summary>Thêm</summary><div class="pz-tiles">${friend?`<span>${tile('heart',a.id,'i-heart','Tặng tim')}<small>Tặng tim</small></span>`:''}${friend?'':`<span>${tile('whisper',a.id,'i-letter','Nhắn riêng')}<small>Nhắn riêng</small></span>`}<span>${tile('block',a.id,'i-block','Chặn')}<small>Chặn</small></span><span>${tile('report',a.id,'i-report','Báo cáo')}<small>Báo cáo</small></span></div></details>${needNet}`;}
      case 'friends':{const f=P.friends,t=tab||'list';
        const head=tabs([['list',`Bạn bè ${f.friends.length}/${S.LIMITS.friends}`],['incoming',`Lời mời${f.incoming.length?` (${f.incoming.length})`:''}`],['blocks','Đã chặn']],t);
        const body=t==='incoming'?(f.incoming.map(x=>`<li>${icon('i-friends','pz-row-ico')}<div class="pz-who"><b>${esc(x.name)}</b><small>Muốn kết bạn</small></div><span><button class="gw-btn" data-do="accept" data-id="${x.id}">Đồng ý</button><button class="gw-btn secondary" data-do="decline" data-id="${x.id}">Từ chối</button></span></li>`).join('')+f.outgoing.map(x=>`<li>${icon('i-letter','pz-row-ico')}<div class="pz-who"><b>${esc(x.name)}</b><small>Đã gửi lời mời</small></div><span><button class="gw-btn secondary" data-do="cancel" data-id="${x.id}">Hủy</button></span></li>`).join('')||empty('Chưa có lời mời. Chạm vào nhân vật đứng gần để kết bạn.'))
          :t==='blocks'?(f.blocks.map(x=>`<li>${icon('i-block','pz-row-ico')}<div class="pz-who"><b>${esc(x.name)}</b></div><span><button class="gw-btn secondary" data-do="unblock" data-id="${x.id}">Bỏ chặn</button></span></li>`).join('')||empty('Chưa chặn ai.'))
          :(f.friends.map(x=>`<li class="${x.online?'on':''}">${socket(face(x.hero))}<div class="pz-who"><b>${esc(x.name)}</b><small>${lamp(!!x.online)}${x.online?`Kênh ${x.channel}`:'Ngoại tuyến'} · cấp ${x.level}</small></div><span>${tile('goto',x.id,x.online?'i-goto':'i-goto-off','Đến chỗ',{off:!x.online})}${tile('whisper',x.id,'i-letter','Nhắn')}${tile('heart',x.id,x.heart?'i-heart-done':'i-heart',x.heart?'Đã tặng tim':'Tặng tim',{off:!!x.heart})}</span></li>`).join('')||empty('Chưa có bạn bè. Ra giữa quảng trường làm quen nhé!'));
        return `<h3>Bạn bè</h3>${head}<ul class="pz-list">${body}</ul><p class="pz-note pz-center">${icon('i-heart','pz-ico-s')}Điểm Bằng Hữu <b>${fmt(f.friendPoints)}</b> · tặng tim mỗi ngày · cửa hàng bằng hữu: Sắp ra mắt</p>${needNet}`;}
      case 'guild':return guildHtml(tab);
      case 'lantern':return lanternHtml();
      case 'log':{const t=tab||'all',rows=P.log.filter(r=>t==='all'||r.ch===t).slice(-60);
        return `<h3>Nhật ký chat</h3>${tabs([['all','Tất cả'],['area','Khu vực'],['guild','Bang'],['whisper','Riêng'],['system','Hệ thống']],t).replace('pz-tabs','pz-tabs many')}
          <ul class="pz-list pz-log">${rows.map(r=>`<li class="ch-${r.ch}"><time>${new Date(r.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</time><p>${chLabel(r)}<b>${who(r)}</b> ${esc(r.text)}</p></li>`).join('')||empty('Chưa có tin nhắn.')}</ul>`;}
      case 'more':return `<h3>Thêm</h3><div class="pz-grid two">${[['open-near','i-near','Người ở gần'],['channels','i-map','Đổi kênh'],['open-log','i-log','Nhật ký chat'],['help','i-help','Hướng dẫn']].map(([k,pic,l])=>`<button type="button" class="pz-cell" data-do="${k}">${icon(pic)}<span>${l}</span></button>`).join('')}</div>`;
      case 'emotes':return `<h3>Biểu cảm</h3><div class="pz-grid">${S.EMOTES.map(([id,name])=>`<button type="button" class="pz-cell" data-do="emote" data-id="${id}">${icon('e-'+id)}<span>${esc(name)}</span></button>`).join('')}</div>`;
      case 'near':{const list=[...P.actors.values()].filter(a=>a!==P.me).map(a=>({a,d:Math.hypot(a.pos[0]-P.me.pos[0],a.pos[1]-P.me.pos[1])})).sort((x,y)=>x.d-y.d).slice(0,20);
        return `<h3>Người ở gần</h3><ul class="pz-list">${list.map(({a,d})=>`<li>${socket(a.npc?`<img src="${esc(a.npcImg)}" alt="">`:face(a.hero))}<div class="pz-who"><b>${a.tag?`<em>[${esc(a.tag)}]</em> `:''}${esc(a.name)}${a.npc?' <i class="pz-npc">NPC</i>':''}</b><small>${Math.round(d/10)} bước</small></div><span>${tile('talk',a.id,'i-goto','Đến gặp')}</span></li>`).join('')||empty('Chưa có ai ở gần.')}</ul>`;}
      case 'board':{const O=window.GemwovenLiveOps,open=P.guilds.filter(g=>g.policy!=='closed').slice(0,8);
        return `<h3>Bảng Tin</h3><h4>${icon('x-recruit','pz-ico-s')}Bang đang tuyển</h4><ul class="pz-list">${open.map(g=>`<li>${EMBLEM(g.emblem)}<div class="pz-who"><b><em>[${esc(g.tag)}]</em> ${esc(g.name)}</b><small>Cấp ${g.level} · ${g.members}/${g.cap} · ${g.policy==='open'?'Vào ngay':'Cần duyệt'} · từ cấp ${g.minLevel}</small></div><span>${P.guild?'':`<button class="gw-btn" data-do="apply" data-id="${g.id}">Xin vào</button>`}</span></li>`).join('')||empty('Chưa có bang nào tuyển. Hãy lập bang đầu tiên!')}</ul>
          ${O?`<h4>${icon('x-calendar','pz-ico-s')}Lịch sự kiện</h4><ul class="pz-list pz-compact">${O.CADENCE.map(c=>`<li><div class="pz-who"><b>${esc(c.name)}</b><small>${esc(c.items.slice(0,2).join(' · '))}</small></div></li>`).join('')}</ul>`:''}${needNet}`;}
      case 'help':{const rules=[['h-walk','Đi lại','Kéo ngón tay trên mặt đất (cần điều hướng hiện ngay chỗ chạm), chạm một chỗ để đi tới đó, hoặc WASD / phím mũi tên.'],
          ['h-chat','Trò chuyện','Gõ ở ô dưới cùng, tin nhắn hiện trên đầu bạn. Đổi kênh Khu vực / Bang / Riêng bằng nút bên trái ô chat.'],
          ['h-meet','Làm quen','Đứng gần ai đó rồi chạm vào nhân vật của họ để kết bạn, nhắn riêng hoặc mời giao hữu.'],
          ['h-spar','Sàn Giao Hữu','Vòng đá bên phải: hai người cùng đứng trong vòng và bấm Sẵn sàng để đấu bản sao AI (không thưởng).'],
          ['h-guild','Sảnh Bang','Cửa lớn phía trên: lập hoặc xin vào bang. Tơ Đèn cạnh sảnh giúp bang dệt đèn mỗi tuần.'],
          ['i-board','Bảng Tin','Bên trái: bang đang tuyển và lịch sự kiện.']];
        const sw=(k,on,l)=>`<label class="pz-switch"><input type="checkbox" data-pref="${k}" ${on?'checked':''}><i></i><span>${l}</span></label>`;
        return `<h3>Hướng dẫn</h3><header class="pz-card-head">${socket('<img src="assets/gemwoven/plaza/npc-guide.webp" alt="">')}<div><b class="pz-card-name">Miu Dẫn Lối <i class="pz-npc">NPC</i></b><p>Chào mừng tới Quảng Trường, meo! Chạm từng mục để xem.</p></div></header>
          <div class="pz-rules">${rules.map(([pic,t,txt])=>`<details>${`<summary>${icon(pic)}<b>${t}</b></summary>`}<p>${txt}</p></details>`).join('')}</div>
          <div class="pz-switches">${sw('arrows',prefs.arrows,'Mũi tên chỉ bạn bè, người cùng bang')}${sw('fixed',prefs.stick==='fixed','Cần điều hướng cố định ở góc')}${sw('right',prefs.side==='right','Cần điều hướng bên phải')}</div>`;}
      case 'me':{const p=myProfile();return `<h3>Của bạn</h3><header class="pz-card-head">${socket(face(p.hero))}<div><b class="pz-card-name">${P.guild?`<em>[${esc(P.guild.tag)}]</em> `:''}${esc(P.you?.name||'Bạn')}</b><p>${esc(M.HEROES[p.hero]?.name)} · cấp ${p.level} ${stars(p.stars)}</p><p>Lực chiến <b>${fmt(p.power)}</b></p><p>${lamp(P.status==='online'?true:'off')}Kênh ${P.channel||'—'} · ${P.status==='online'?'Trực tuyến':'Ngoại tuyến'}</p></div></header>
        <div class="pz-actions"><button class="gw-btn secondary" data-do="channels">${icon('i-map')}Đổi kênh</button><button class="gw-btn secondary" data-do="help">${icon('i-help')}Hướng dẫn</button></div><p class="pz-note pz-center">Đổi tướng hoặc diện mạo ở trang Tướng.</p>`;}
      case 'channels':{const list=Object.entries(P.counts).map(([n,c])=>[Number(n),c]);if(!list.some(([n])=>n===P.channel))list.push([P.channel||1,1]);const next=Math.max(1,...list.map(([n])=>n))+1;
        return `<h3>Kênh</h3><ul class="pz-list">${list.sort((a,b)=>a[0]-b[0]).map(([n,c])=>`<li class="${n===P.channel?'on':''}">${icon('i-map','pz-row-ico')}<div class="pz-who"><b>Kênh ${n}</b><small>${lamp(c<S.LIMITS.channelCap?true:'off')}${c}/${S.LIMITS.channelCap} người</small></div><span>${n===P.channel?'<em class="pz-here">Đang ở</em>':`<button class="gw-btn" data-do="channel" data-id="${n}" ${c>=S.LIMITS.channelCap?'disabled':''}>Vào</button>`}</span></li>`).join('')}<li>${icon('i-map','pz-row-ico')}<div class="pz-who"><b>Kênh ${next}</b><small>Kênh mới</small></div><span><button class="gw-btn secondary" data-do="channel" data-id="${next}">Vào</button></span></li></ul>
          <p class="pz-note pz-center">Mỗi kênh tối đa ${S.LIMITS.channelCap} người · bạn bè "Đến chỗ" được ở mọi kênh.</p>${needNet}`;}
    }
    return '';
  }
  function guildHtml(tab){
    const g=P.guild,online=P.status==='online';
    if(!online)return `<h3>Bang Hội</h3><ul class="pz-list">${empty('Cần kết nối máy chủ Quảng Trường.')}</ul>`;
    if(!g){const t=tab||'find';const emb=P.emblem||'sword';
      return `<h3>Bang Hội</h3>${tabs([['find','Tìm bang'],['create','Lập bang']],t)}`+
        (t==='create'?`<form class="pz-form pz-guild-form" data-form="guild"><label><span>Tên bang</span><span class="pz-input-wrap"><input name="name" maxlength="${S.LIMITS.guildName[1]}" autocomplete="off" required></span></label><label><span>Thẻ · 2–4 chữ in hoa</span><span class="pz-input-wrap"><input name="tag" maxlength="4" autocomplete="off" required style="text-transform:uppercase"></span></label>
          <fieldset class="pz-emblems"><legend>Biểu tượng</legend>${S.GUILD_EMBLEMS.map(e=>`<label><input type="radio" name="emblem" value="${e}" ${e===emb?'checked':''}><span class="pz-tile">${EMBLEM(e)}</span></label>`).join('')}</fieldset>
          <button class="gw-btn" type="submit">Lập bang</button><p class="pz-note pz-center">Cần tướng cấp ${S.LIMITS.guildMinLevel} · bản thử nghiệm miễn phí (sau này 100.000 vàng khi kinh tế lên máy chủ)</p></form>`
        :`<ul class="pz-list">${P.guilds.map(x=>`<li>${EMBLEM(x.emblem)}<div class="pz-who"><b><em>[${esc(x.tag)}]</em> ${esc(x.name)}</b><small>Cấp ${x.level} · ${x.members}/${x.cap} · ${x.policy==='open'?'Vào ngay':x.policy==='closed'?'Đóng':'Cần duyệt'} · từ cấp ${x.minLevel}</small></div><span><button class="gw-btn" data-do="apply" data-id="${x.id}" ${x.policy==='closed'||x.members>=x.cap?'disabled':''}>Xin vào</button></span></li>`).join('')||empty('Chưa có bang nào. Hãy lập bang đầu tiên!')}</ul>`);}
    const t=tab||'info',lvlNext=g.next?`${fmt(g.exp)}/${fmt(g.next)}`:'Tối đa',pct=g.next?Math.min(100,(g.exp-(S.GUILD_EXP[g.level-1]||0))/(g.next-(S.GUILD_EXP[g.level-1]||0))*100):100;
    const list=[['info','Thông tin'],['members',`Thành viên ${g.members.length}/${g.cap}`],...(g.applications.length||can('approve')?[['apps',`Đơn xin${g.applications.length?` (${g.applications.length})`:''}`]]:[]),['events','Hoạt động'],['log','Nhật ký']];
    const head=`<h3>Bang Hội</h3><header class="pz-guild-head">${EMBLEM(g.emblem)}<div><b class="pz-card-name"><em>[${esc(g.tag)}]</em> ${esc(g.name)}</b><p>Cấp ${g.level} · ${S.RANKS[g.me.rank].name}</p><div class="pz-bar"><i style="width:${pct}%"></i><span>${lvlNext}</span></div></div></header>`;
    let body='';
    if(t==='info')body=`<blockquote class="pz-notice">${esc(g.notice)}</blockquote>${can('notice')?`<form class="pz-form" data-form="notice"><span class="pz-input-wrap"><input name="text" maxlength="${S.LIMITS.guildNotice}" placeholder="Thông báo mới"></span><button class="gw-btn secondary" type="submit">Đổi</button></form>
        <form class="pz-form" data-form="policy"><span class="pz-input-wrap"><select name="policy">${[['open','Vào ngay'],['approval','Cần duyệt'],['closed','Đóng']].map(([v,l])=>`<option value="${v}" ${g.policy===v?'selected':''}>${l}</option>`).join('')}</select></span><span class="pz-input-wrap pz-num"><input name="minLevel" type="number" min="1" max="500" value="${g.minLevel}" aria-label="Cấp tối thiểu"></span><button class="gw-btn secondary" type="submit">Lưu</button></form>`:''}
      <div class="pz-actions"><button class="gw-btn" data-do="checkin" ${g.me.checked?'disabled':''}>${icon('i-checkin')}${g.me.checked?'Đã điểm danh':`Điểm danh +${S.CHECKIN.contribution}`}</button><button class="gw-btn secondary" data-do="lantern">${icon('i-lantern')}Đèn bang ${g.lantern.tier}/3</button></div>
      ${g.leaderAway>=S.LIMITS.leaderWarnDays?`<p class="pz-note">Bang Chủ vắng ${g.leaderAway} ngày; tới ${S.LIMITS.leaderTransferDays} ngày quyền Bang Chủ chuyển cho cán bộ hoạt động nhất.</p>`:''}
      <div class="pz-actions pz-end"><button class="gw-btn secondary danger" data-do="leave">Rời bang</button></div>`;
    if(t==='members')body=`<ul class="pz-list">${g.members.map(m=>{const higher=S.RANK_ORDER.indexOf(m.rank)>S.RANK_ORDER.indexOf(g.me.rank);const ctl=m.id!==P.you?.id&&higher&&can('promote');
      return `<li class="${m.online?'on':''}">${socket(face(m.hero))}<div class="pz-who"><b>${esc(m.name)}</b><small>${lamp(!!m.online)}${S.RANKS[m.rank].name} · cấp ${m.level} · tuần ${fmt(m.week)} / tổng ${fmt(m.contribution)}${m.checked?' · ✓':''}</small></div><span>${ctl?`<button class="gw-btn secondary" data-do="promote" data-id="${m.id}">Thăng</button><button class="gw-btn secondary" data-do="demote" data-id="${m.id}">Giáng</button>`:''}${m.id!==P.you?.id&&higher&&can('kick')?`<button class="gw-btn secondary danger" data-do="kick" data-id="${m.id}">Mời ra</button>`:''}${g.me.rank==='leader'&&m.rank==='vice'?`<button class="gw-btn secondary" data-do="promote" data-id="${m.id}">Nhường chủ</button>`:''}</span></li>`;}).join('')}</ul>
      <p class="pz-note pz-center">Cán bộ: ${S.LIMITS.officers.vice} Phó Bang, ${S.LIMITS.officers.elder} Trưởng Lão · chỉ thao tác với người chức thấp hơn.</p>`;
    if(t==='apps')body=`<ul class="pz-list">${g.applications.map(x=>`<li>${icon('i-invite','pz-row-ico')}<div class="pz-who"><b>${esc(x.name)}</b><small>cấp ${x.level}</small></div><span>${can('approve')?`<button class="gw-btn" data-do="approve" data-id="${x.id}">Nhận</button><button class="gw-btn secondary" data-do="reject" data-id="${x.id}">Từ chối</button>`:''}</span></li>`).join('')||empty('Chưa có đơn.')}</ul>`;
    if(t==='events')body=`<ul class="pz-list pz-events"><li class="on">${icon('i-lantern','pz-row-ico')}<div class="pz-who"><b>Dệt Đèn Bang · hằng tuần</b><small>1 sợi/ngày cùng Tơ Đèn (tối đa ${S.LIMITS.lanternPerWeek}/tuần) · bậc 1/2/3 ở ${S.LANTERN.tiers.join('/')} sợi đủ ba màu</small></div><span>${tile('lantern',null,'i-lantern','Xem đèn')}</span></li>
      ${[['Boss Bang · hằng tuần','Chung một thanh máu, xếp hạng sát thương trong bang'],['Viễn Chinh · cuối tuần','Cả bang cùng đi một chuỗi ải'],['Chiến Trường Bang · theo mùa','Bang đấu bang'],['Cửa Hàng Bang','Đổi cống hiến lấy nguyên liệu, mảnh tướng cũ giới hạn tuần']].map(([n,d])=>`<li class="soon">${icon('i-guild','pz-row-ico')}<div class="pz-who"><b>${n}</b><small>${d}</small></div><span><em class="pz-soon">Sắp ra mắt</em></span></li>`).join('')}</ul>`;
    if(t==='log')body=`<ul class="pz-list pz-log">${g.log.slice().reverse().map(r=>`<li><time>${new Date(r.at).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time><p>${esc(r.text)}</p></li>`).join('')||empty('Chưa có gì.')}</ul>`;
    return head+tabs(list,t).replace('pz-tabs','pz-tabs scroll')+body;
  }
  function lanternHtml(){
    const g=P.guild,tier=g?.lantern?.tier||0,threads=g?.lantern?.threads||{};
    const at=P.zone==='lantern',total=S.LANTERN.colors.reduce((n,[c])=>n+(threads[c]||0),0),goal=S.LANTERN.tiers[Math.min(tier,S.LANTERN.tiers.length-1)];
    const spool={red:'t-red',blue:'t-blue',gold:'t-gold'};
    return `<h3>Dệt Đèn Bang</h3><header class="pz-card-head">${socket('<img src="assets/gemwoven/plaza/npc-weaver.webp" alt="">')}<div><b class="pz-card-name">Tơ Đèn <i class="pz-npc">NPC</i></b><p>Mỗi ngày một sợi, cả bang cùng dệt nên ngọn đèn.</p></div></header>
      <div class="pz-lantern"><img src="assets/gemwoven/plaza/lantern-${tier}.webp" alt="Đèn bang bậc ${tier}"><div><p class="pz-card-name">Bậc ${tier}/3</p>
      <ul class="pz-threads">${S.LANTERN.colors.map(([c,name])=>`<li title="${esc(name)}">${icon(spool[c]||'t-gold')}<b>${threads[c]||0}</b></li>`).join('')}</ul>
      <div class="pz-bar"><i style="width:${tier>=3?100:Math.min(100,total/goal*100)}%"></i><span>${tier>=3?'Đèn sáng tối đa':`${total}/${goal} sợi`}</span></div></div></div>
      <details class="pz-more"><summary>Luật dệt</summary><p class="pz-note">Bậc 1/2/3 ở ${S.LANTERN.tiers.join(' / ')} sợi và mỗi màu ít nhất 1 / 3 / 5 sợi. Đèn sáng hiện ở sảnh bang cả tuần. Chưa trao tài nguyên trong bản thử nghiệm.</p></details>
      ${!g?'<p class="pz-note pz-center">Vào một bang để cùng dệt đèn.</p>':g.me.wove?'<p class="pz-note pz-center">Hôm nay bạn đã dệt. Quay lại vào ngày mai nhé!</p>':g.me.woven>=S.LIMITS.lanternPerWeek?'<p class="pz-note pz-center">Tuần này bạn đã dệt đủ 5 sợi.</p>':!at?`<div class="pz-actions"><button class="gw-btn" data-do="walk-weaver">${icon('i-goto')}Đi tới Tơ Đèn</button></div>`
      :`<div class="pz-actions">${S.LANTERN.colors.map(([c,name])=>`<button class="gw-btn" data-do="weave" data-id="${c}">${icon(spool[c]||'t-gold')}${esc(name.replace('Sợi ',''))}</button>`).join('')}</div><p class="pz-note pz-center">Chọn màu bang đang thiếu để đèn lên bậc.</p>`}`;
  }
  function openSheet(kind,tab){
    P.sheet=kind;P.sheetTab=tab;const box=P.root.querySelector('.pz-sheet');box.hidden=false;box.dataset.kind=kind;P.root.classList.add('sheet-open');
    const body=box.querySelector('.pz-sheet-body');body.innerHTML=sheetHtml(kind,tab);
    // The sheet's title rides on the painted frame's wooden plank.
    // A sideways tab rail fades at its edge until the last tab is in view.
    for(const rail of body.querySelectorAll('.pz-tabs.scroll')){const on=rail.querySelector('.on');if(on)rail.scrollLeft=Math.max(0,on.offsetLeft-120);const end=()=>rail.classList.toggle('end',rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4);end();rail.addEventListener('scroll',end,{passive:true});}
    const h=body.querySelector(':scope>h3');box.querySelector('.pz-sheet-title').textContent=h?.textContent||'';h?.remove();
    if(kind==='name')setTimeout(()=>box.querySelector('input')?.focus(),50);
    if(kind==='guild'&&!P.guild&&P.status==='online')send({t:'guild',op:'list'});
    if(kind==='board'&&P.status==='online')send({t:'guild',op:'list'});
  }
  function closeSheet(){P.sheet=null;const box=P.root.querySelector('.pz-sheet');box.hidden=true;P.root.classList.remove('sheet-open');}
  function act(kind,id){
    const go=m=>{if(P.status!=='online')return toast('Cần kết nối máy chủ Quảng Trường.',{error:true});send(m);};
    switch(kind){
      case 'friend':return go({t:'friend',op:'request',id});
      case 'accept':case 'decline':case 'cancel':return go({t:'friend',op:kind,id});
      case 'heart':return go({t:'heart',id});
      case 'unblock':return go({t:'block',id,on:false});
      case 'block':closeSheet();return go({t:'block',id,on:true});
      case 'report':closeSheet();return go({t:'report',id,reason:'Hành vi không phù hợp'});
      case 'whisper':{const name=P.actors.get(id)?.name||P.friends.friends.find(f=>f.id===id)?.name||'';P.whisperTo={id,name};setChannel('whisper');closeSheet();return P.root.querySelector('.pz-input').focus();}
      case 'duel':closeSheet();return go({t:'duel',op:'invite',id});
      case 'goto':closeSheet();return go({t:'goto',id});
      case 'emote':closeSheet();if(P.status==='online')send({t:'emote',id});else if(P.me)emote(P.me,id);return;
      case 'talk':{const a=P.actors.get(id);closeSheet();if(a)talkTo(a);return;}
      case 'channel':closeSheet();return go({t:'channel',n:Number(id)});
      case 'channels':return openSheet('channels');
      case 'open-near':return openSheet('near');
      case 'open-log':return openSheet('log');
      case 'help':return openSheet('help');
      case 'apply':return go({t:'guild',op:'apply',id});
      case 'approve':case 'reject':case 'kick':case 'promote':case 'demote':return go({t:'guild',op:kind,id});
      case 'checkin':return go({t:'guild',op:'checkin'});
      case 'leave':if(!confirm('Rời bang? Bạn phải chờ 12 giờ mới vào bang khác.'))return;return go({t:'guild',op:'leave'});
      case 'lantern':return openSheet('lantern');
      case 'weave':return go({t:'guild',op:'weave',color:id});
      case 'walk-weaver':{closeSheet();const n=(geo.npcs||[]).find(x=>x.id==='weaver');if(n)goTo([n.x,n.y+60]);return;}
      case 'ginvite':{const a=P.actors.get(id);if(!a)return;send({t:'say',ch:'whisper',to:id,text:`Mời bạn vào bang [${P.guild.tag}] ${P.guild.name}! Xin vào ở Bảng Tin hoặc Sảnh Bang.`});return toast('Đã gửi lời mời vào bang qua tin nhắn riêng.');}
    }
  }

  // ---------- Chat ----------
  function setChannel(ch){
    P.chatCh=ch;const b=P.root.querySelector('.pz-chan');b.querySelector('span').textContent={area:'Khu vực',guild:'Bang',whisper:P.whisperTo?`→ ${P.whisperTo.name}`:'Riêng'}[ch];b.dataset.ch=ch;
  }
  function cycleChannel(){const order=['area',...(P.guild?['guild']:[]),...(P.whisperTo?['whisper']:[])];setChannel(order[(order.indexOf(P.chatCh)+1)%order.length]);}
  function sendChat(){
    const input=P.root.querySelector('.pz-input'),raw=input.value,c=S.cleanText(raw);if(!c.ok){if(raw.trim())toast(c.error,{error:true});return;}
    if(P.status!=='online'){addLog({ch:'area',name:P.me?.name||'Bạn',text:c.text,from:'me'});if(P.me)bubble(P.me,c.text);input.value='';counter();return;}
    send({t:'say',ch:P.chatCh,text:c.text,...(P.chatCh==='whisper'?{to:P.whisperTo?.id}:{})});input.value='';counter();
  }
  function counter(){const i=P.root.querySelector('.pz-input');P.root.querySelector('.pz-count').textContent=`${i.value.length}/${S.LIMITS.chat}`;}

  // ---------- Friendly fight ----------
  function duelPrompt(m){
    const box=P.root.querySelector('.pz-invite');box.hidden=false;let left=Math.round(S.LIMITS.duelReplyMs/1000);
    const mine=myProfile();
    const paint=()=>{box.innerHTML=`<span class="pz-sheet-crest" aria-hidden="true"></span><div class="pz-duel-faces"><span class="pz-socket">${face(m.p?.hero)}</span>${icon('i-swords','pz-duel-swords')}<span class="pz-socket">${face(mine.hero)}</span></div><p><b>${esc(m.name)}</b> mời bạn giao hữu</p><strong>Đấu bản sao AI · Không thưởng</strong><small>${esc(M.HEROES[m.p?.hero]?.name||'')} · còn <b>${left}s</b></small><div><button class="gw-btn" data-duel="accept">Đồng ý</button><button class="gw-btn secondary" data-duel="decline">Từ chối</button></div>`;};
    paint();clearInterval(P.inviteTimer);P.inviteTimer=setInterval(()=>{left--;if(left<=0){clearInterval(P.inviteTimer);box.hidden=true;}else paint();},1000);
    box.onclick=e=>{const b=e.target.closest('[data-duel]');if(!b)return;clearInterval(P.inviteTimer);box.hidden=true;send({t:'duel',op:b.dataset.duel,id:m.from});};
  }
  function startSpar(m){
    toast(`Vào trận giao hữu với bản sao của ${m.opponent.name}…`);
    try{const b=G.engine.begin('spar',1,{opponent:{hero:m.opponent.hero,name:m.opponent.name,look:m.opponent.look}});setTimeout(()=>{location.href='Game.html?encounter='+encodeURIComponent(b.token);},700);}
    catch(e){toast(e.message,{error:true});}
  }

  // ---------- Small UI ----------
  function toast(text,{error=false,label,run}={}){
    const box=P.root?.querySelector('.pz-toast');if(!box)return;box.innerHTML=`<span>${esc(text)}</span>${label?`<button type="button" class="gw-btn">${esc(label)}</button>`:''}`;box.className='pz-toast show'+(error?' error':'');
    if(label)box.querySelector('button').onclick=()=>{box.className='pz-toast';run();};clearTimeout(P.toastTimer);P.toastTimer=setTimeout(()=>{box.className='pz-toast';},label?6000:3200);
  }
  function status(){
    if(!P.root)return;const s=P.root.querySelector('.pz-status');const n=[...P.actors.values()].filter(a=>!a.npc).length;
    const lampOf={online:'lamp-on',connecting:'lamp-wait',naming:'lamp-wait'}[P.status]||'lamp-off';
    s.className='pz-status '+P.status;s.innerHTML=icon(lampOf,'pz-lamp')+`<span>${P.status==='online'?`Kênh ${P.channel||'—'} · ${n} người`:P.status==='connecting'?'Đang kết nối…':P.status==='naming'?'Đặt tên':'Ngoại tuyến · Thử lại'}</span>`;
  }
  function badges(){
    if(!P.root)return;const inc=P.friends.incoming.length,apps=P.guild?.applications?.length||0,unchecked=P.guild&&!P.guild.me?.checked;
    const set=(sel,n,kind)=>{const b=P.root.querySelector(sel+' .pz-badge');b.textContent=n?String(n):'';b.dataset.kind=kind;b.hidden=!n;};
    set('[data-open="friends"]',inc,'info');set('[data-open="guild"]',apps+(unchecked?1:0),unchecked?'claim':'info');
  }

  // ---------- Build ----------
  function build(){
    const root=document.createElement('div');root.className='plaza';root.setAttribute('role','application');root.setAttribute('aria-label','Quảng Trường');
    const stickSide=prefs.side==='right'?'right':'left';
    root.innerHTML=`<div class="pz-view"><div class="pz-world"><img class="pz-map" src="${esc(asset('plaza-map')||'assets/gemwoven/plaza/map.webp')}" alt="" draggable="false"></div></div>
      <div class="pz-arrows" aria-hidden="true"></div>
      <header class="pz-top"><button type="button" class="pz-back" data-action="route:home" aria-label="Về thị trấn">‹</button><div><b class="pz-place">Gặp Gỡ · Quảng Trường</b><button type="button" class="pz-status" data-open="channels"></button></div></header>
      <nav class="pz-side" aria-label="Quảng Trường">
        <button type="button" data-open="friends">${icon('i-friends')}<span>Bạn bè</span><b class="pz-badge" hidden></b></button>
        <button type="button" data-open="guild">${icon('i-guild')}<span>Bang hội</span><b class="pz-badge" hidden></b></button>
        <button type="button" data-open="emotes">${icon('i-emote')}<span>Biểu cảm</span></button>
        <button type="button" data-open="more"><img class="pz-ico" src="${esc(asset('icon-grid'))}" alt=""><span>Thêm</span></button></nav>
      <button type="button" class="pz-context" hidden></button>
      <div class="pz-stick ${stickSide} ${prefs.stick==='fixed'?'fixed':''}" aria-hidden="true"><i></i></div>
      <button type="button" class="pz-ticker" data-open="log" aria-label="Mở nhật ký trò chuyện"></button>
      <form class="pz-chat"><button type="button" class="pz-chan" data-ch="area" aria-label="Đổi kênh chat"><span>Khu vực</span></button><label class="pz-field"><input class="pz-input" maxlength="${S.LIMITS.chat}" placeholder="Nhắn gì đó…" autocomplete="off" enterkeyhint="send" aria-label="Tin nhắn"><small class="pz-count">0/${S.LIMITS.chat}</small></label><button type="submit" class="pz-send">${icon('i-letter')}<span>Gửi</span></button></form>
      <div class="pz-invite" hidden></div><div class="pz-toast" role="status" aria-live="polite"></div>
      <section class="pz-sheet" hidden><span class="pz-sheet-crest" aria-hidden="true"></span><h2 class="pz-sheet-title"></h2><button type="button" class="pz-close" aria-label="Đóng">×</button><div class="pz-sheet-body"></div></section>`;
    // Drawn pieces reach the stylesheet as variables (absolute URLs, so the inlined build resolves them too).
    for(const n of CSS_PIECES)root.style.setProperty('--pz-'+n,`url("${new URL(ui(n),document.baseURI).href}")`);
    for(const [n,k] of [['frame','settings-frame'],['crest','crest'],['row','ui-row']])if(asset(k))root.style.setProperty('--pz-'+n,`url("${new URL(asset(k),document.baseURI).href}")`);
    P.root=root;P.world=root.querySelector('.pz-world');
    const view=root.querySelector('.pz-view');
    // Pointer: a drag on the ground is a joystick at the touch point (or the fixed corner stick); a short tap walks there.
    const toFrame=e=>{const r=root.getBoundingClientRect(),k=r.width/FRAME_W;return [(e.clientX-r.left)/k,(e.clientY-r.top)/k];};
    view.addEventListener('pointerdown',e=>{if(e.button||e.target.closest('.pz-hit'))return;const [fx,fy]=toFrame(e);P.drag={id:e.pointerId,x:fx,y:fy,at:performance.now(),stick:false};view.setPointerCapture(e.pointerId);});
    view.addEventListener('pointermove',e=>{const d=P.drag;if(!d||d.id!==e.pointerId)return;const [fx,fy]=toFrame(e),dx=fx-d.x,dy=fy-d.y;
      if(!d.stick&&Math.hypot(dx,dy)>18){d.stick=true;P.pendingTalk=null;const st=root.querySelector('.pz-stick');st.classList.add('on');if(prefs.stick!=='fixed'){st.style.left=`${d.x}px`;st.style.top=`${d.y}px`;}}
      if(d.stick){const len=Math.min(90,Math.hypot(dx,dy)),ang=Math.atan2(dy,dx);root.querySelector('.pz-stick i').style.transform=`translate(${Math.cos(ang)*len}px,${Math.sin(ang)*len}px)`;steer(Math.cos(ang)*len/90,Math.sin(ang)*len/90);}});
    const end=e=>{const d=P.drag;if(!d||d.id!==e.pointerId)return;P.drag=null;const st=root.querySelector('.pz-stick');st.classList.remove('on');st.querySelector('i').style.transform='';
      if(d.stick){steer(0,0);return;}if(performance.now()-d.at<450){const [fx,fy]=toFrame(e);P.pendingTalk=null;goTo([(fx+P.cam[0])/WORLD_K,(fy+P.cam[1])/WORLD_K]);ripple(fx,fy);}};
    view.addEventListener('pointerup',end);view.addEventListener('pointercancel',end);
    root.addEventListener('click',e=>{
      const open=e.target.closest('[data-open]');if(open){if(open.dataset.open==='channels'&&P.status==='offline'){connect();return;}openSheet(open.dataset.open);return;}
      const tab=e.target.closest('.pz-tabs [data-tab]');if(tab){openSheet(P.sheet,tab.dataset.tab);return;}
      const d=e.target.closest('[data-do]');if(d){act(d.dataset.do,d.dataset.id);return;}
      if(e.target.closest('.pz-close'))closeSheet();
    });
    root.addEventListener('change',e=>{const k=e.target.dataset?.pref;if(!k)return;if(k==='arrows')prefs.arrows=e.target.checked;if(k==='fixed')prefs.stick=e.target.checked?'fixed':'free';if(k==='right')prefs.side=e.target.checked?'right':'left';write(PREFS_KEY,prefs);
      const st=root.querySelector('.pz-stick');st.className=`pz-stick ${prefs.side==='right'?'right':'left'} ${prefs.stick==='fixed'?'fixed':''}`;st.style.left=st.style.top='';});
    root.addEventListener('submit',e=>{e.preventDefault();const f=e.target,data=Object.fromEntries(new FormData(f));
      if(f.classList.contains('pz-chat'))return sendChat();
      if(f.dataset.form==='name'){const c=S.checkName(data.name);if(!c.ok){root.querySelector('.pz-name-error').textContent=c.error;return;}send({t:'register',name:c.name,p:myProfile()});return;}
      if(f.dataset.form==='guild'){P.emblem=data.emblem;return send({t:'guild',op:'create',name:data.name,tag:String(data.tag).toUpperCase(),emblem:data.emblem});}
      if(f.dataset.form==='notice')return send({t:'guild',op:'notice',text:data.text});
      if(f.dataset.form==='policy')return send({t:'guild',op:'policy',policy:data.policy,minLevel:Number(data.minLevel)});});
    root.querySelector('.pz-chan').onclick=cycleChannel;
    const input=root.querySelector('.pz-input');input.addEventListener('input',counter);
    // The keyboard shrinks the map instead of pushing the frame: the joystick and ticker hide, the camera keeps you in view.
    input.addEventListener('focus',()=>{P.typing=true;root.classList.add('typing');P.keys.clear();});input.addEventListener('blur',()=>{P.typing=false;root.classList.remove('typing');});
    root.querySelector('.pz-context').onclick=e=>{const z=e.currentTarget.dataset.zone;if(z==='guild')openSheet('guild');else if(z==='lantern')openSheet('lantern');else if(z==='board')openSheet('board');
      else if(z==='ring'){if(P.status!=='online')return toast('Cần kết nối máy chủ Quảng Trường.',{error:true});send({t:'ring',ready:true});}};
    return root;
  }
  function ripple(x,y){const r=document.createElement('span');r.className='pz-ripple';r.style.left=x+'px';r.style.top=y+'px';P.root.append(r);setTimeout(()=>r.remove(),600);}
  const keyName=e=>e.key.toLowerCase();
  window.addEventListener('keydown',e=>{if(!P.active||P.typing||e.target.closest?.('input,textarea,select'))return;const k=keyName(e);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){P.keys.add(k);e.preventDefault();}
    if(k==='enter'&&P.root){e.preventDefault();P.root.querySelector('.pz-input').focus();}if(k==='escape'&&P.sheet)closeSheet();});
  window.addEventListener('keyup',e=>{const k=keyName(e);if(P.keys.delete(k)&&!P.keys.size)steer(0,0);});
  window.addEventListener('blur',()=>{if(P.keys.size){P.keys.clear();steer(0,0);}});

  function mount(el){
    if(!P.root)build();el.append(P.root);P.active=true;
    load().then(()=>{if(!P.active)return;spawnNpcs();if(!P.me)spawnMe([...(geo.spawn||S.MAP.spawn)]);status();badges();connect();
      if(!P.seenHelp&&!read(PREFS_KEY,{}).helped){P.seenHelp=true;write(PREFS_KEY,{...prefs,helped:true});setTimeout(()=>{if(P.active&&!P.sheet)openSheet('help');},900);}});
    if(!P.raf)P.raf=requestAnimationFrame(tick);
  }
  function suspend(){if(!P.active)return;P.active=false;P.keys.clear();if(P.net){const ws=P.net;P.net=null;try{ws.close();}catch{}}for(const id of [...P.actors.keys()])if(!id.startsWith('npc-')&&id!=='me')removeActor(id);P.status='idle';}
  window.GemwovenPlaza={mount,suspend,state:P};

  // ---------- Hub hook: Trò Chuyện is the square, full frame, the resource HUD stays on top ----------
  const KEEP=/\.(profile|gold-plate|gold-icon|gold|gold-plus|gem-plate|gem-icon|gems|gems-plus|mail)$/;
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);
    if(state.screen!=='chat'){suspend();return p;}
    const screen=L.screens.chat;screen.nodes=[{id:'chat.plaza',kind:'content',rect:[0,0,FRAME_W,FRAME_H],className:'exploration-map plaza-host',build:mount},...screen.nodes.filter(n=>KEEP.test(n.id))];
    return p;
  };
})();
