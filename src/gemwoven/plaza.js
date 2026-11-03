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

  function myProfile(){
    const p=G.engine.read(),key=p.selected,h=p.heroes[key];
    const title=p.title&&M.titleList?M.titleList(p).find(t=>t.id===p.title&&t.unlocked)?.name||'':'';
    return {hero:key,look:M.lookForm?M.lookForm(key,h):1,level:h?.level||1,stars:h?.stars||1,power:M.stats(p,key).power,title,frame:''};
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
      case 'welcome':clearTimeout(timer);P.retry=0;P.status='online';P.you=m.you;P.friends=m.friends;P.guild=m.guild;status();badges();
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
    el.innerHTML=`<div class="pz-shadow"></div><div class="pz-body"></div><button type="button" class="pz-hit" aria-label="${esc(name)}"></button><div class="pz-plate"><span class="pz-title"></span><span class="pz-name"></span></div><div class="pz-bubbles"></div><div class="pz-emote"></div>`;
    const a={id,el,name,hero,look,npc,tag,title,pos:[x,y],target:[x,y],side:0,dir:1,moving:false,frame:0,sheet:null,bubbles:[]};
    el.querySelector('.pz-hit').addEventListener('click',e=>{e.stopPropagation();talkTo(a);});
    setLook(a,hero,look,npc);setPlate(a);P.world.append(el);P.actors.set(id,a);return a;
  }
  function setLook(a,hero,look,npc){
    a.hero=hero;a.look=look;const body=a.el.querySelector('.pz-body');
    if(npc){a.npcImg=npc.img;body.style.cssText=`background-image:url("${npc.img}");background-size:contain;background-repeat:no-repeat;background-position:center bottom;width:${npc.w}px;height:${npc.h}px;left:${-npc.w/2}px;top:${-npc.h}px`;a.headY=-npc.h;return;}
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
    a.el.querySelector('.pz-name').innerHTML=(a.tag?`<b>[${esc(a.tag)}]</b> `:'')+esc(a.name)+(a.npc?' <i>NPC</i>':'');
    const t=a.el.querySelector('.pz-title');t.textContent=a.title||'';t.hidden=!a.title;
    a.el.querySelector('.pz-plate').style.top=`${a.headY-30}px`;a.el.querySelector('.pz-bubbles').style.bottom=`${-a.headY+40}px`;a.el.querySelector('.pz-emote').style.bottom=`${-a.headY+36}px`;
    a.el.querySelector('.pz-hit').style.cssText=`width:${Math.max(70,a.cell*.42||90)}px;height:${Math.max(90,-a.headY+10)}px;left:${-Math.max(70,a.cell*.42||90)/2}px;top:${a.headY}px`;
    a.el.classList.toggle('is-friend',!!P.friends.friends.some(f=>f.id===a.id));a.el.classList.toggle('is-guildmate',!!P.guild?.members?.some(m=>m.id===a.id));
  }
  function spawnMe(pos,keep){
    const prof=myProfile(),name=P.you?.name||'Bạn';
    if(P.me&&keep){P.me.name=name;setLook(P.me,prof.hero,prof.look);refreshMyTag();return;}
    if(P.me)removeActor('me');P.me=makeActor('me',{name,hero:prof.hero,look:prof.look,x:pos[0],y:pos[1]});refreshMyTag();
  }
  function refreshMyTag(){if(!P.me)return;P.me.name=P.you?.name||'Bạn';P.me.tag=P.guild?.tag||'';P.me.title=myProfile().title;setPlate(P.me);for(const a of P.actors.values())if(!a.npc&&a!==P.me)setPlate(a);}
  function upsert(p){
    if(p.id===P.you?.id)return;let a=P.actors.get(p.id);
    if(!a)a=makeActor(p.id,{name:p.name,hero:p.p?.hero,look:p.p?.look,tag:p.tag,title:p.p?.title,x:p.x,y:p.y});
    else{if(a.hero!==p.p?.hero||a.look!==p.p?.look)setLook(a,p.p?.hero,p.p?.look);a.name=p.name;a.tag=p.tag;a.title=p.p?.title||'';a.target=[p.x,p.y];}
    a.profile=p.p;a.guildName=p.guild;setPlate(a);
  }
  function removeActor(id){const a=P.actors.get(id);if(!a)return;a.el.remove();P.actors.delete(id);}
  function spawnNpcs(){
    for(const n of geo.npcs||[]){if(P.actors.has('npc-'+n.id))continue;const img=asset('plaza-npc-'+n.id)||`assets/gemwoven/plaza/npc-${n.id}.webp`;
      const a=makeActor('npc-'+n.id,{name:n.name,npc:{img,w:118,h:150},x:n.x,y:n.y});a.npcId=n.id;a.headY=-150;setPlate(a);}
  }

  // ---------- Speech ----------
  function bubble(a,text){
    const box=a.el.querySelector('.pz-bubbles'),b=document.createElement('p');b.className='pz-bubble';
    b.textContent=text.length>96?text.slice(0,95)+'…':text;box.append(b);while(box.children.length>2)box.firstChild.remove();
    const all=[...P.world.querySelectorAll('.pz-bubble')];if(all.length>4)all.slice(0,all.length-4).forEach(x=>x.remove());
    setTimeout(()=>{b.classList.add('fade');setTimeout(()=>b.remove(),500);},Math.min(6000,4000+text.length*25));
  }
  function emote(a,id){const e=S.EMOTES.find(x=>x[0]===id);if(!e)return;const box=a.el.querySelector('.pz-emote');box.textContent=e[2];box.classList.remove('show');void box.offsetWidth;box.classList.add('show');}
  function addLog(m){
    P.log.push({...m,at:m.at||Date.now()});if(P.log.length>150)P.log.shift();
    const ticker=P.root?.querySelector('.pz-ticker');if(ticker){const rows=P.log.filter(x=>x.ch!=='whisper'||x.from===P.you?.id||x.to===P.you?.id).slice(-3);
      ticker.innerHTML=rows.map(r=>`<p class="ch-${r.ch}"><b>${chLabel(r)}${who(r)}</b> ${esc(r.text)}</p>`).join('');}
    if(P.sheet==='log')openSheet('log',P.sheetTab);
  }
  const who=r=>r.ch==='system'?'':`${esc(r.tag?`[${r.tag}] `:'')}${esc(r.name)}:`;
  const chLabel=r=>r.ch==='guild'?'<em class="tag-guild">Bang</em>':r.ch==='whisper'?`<em class="tag-whisper">${r.from===P.you?.id?'→ '+esc(r.toName):'Riêng'}</em>`:r.ch==='system'?'<em class="tag-system">Hệ thống</em>':'';

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
      if(a.npc){a.el.style.transform=`translate(${a.pos[0]}px,${a.pos[1]}px)`;a.el.style.zIndex=String(Math.round(a.pos[1]));continue;}
      const before=a.pos;let moving=false;
      if(a===P.me){const r=S.step(geo,a.pos,a.target,dt,a.side);a.side=r.side;moving=Math.hypot(r.pos[0]-before[0],r.pos[1]-before[1])>.2;if(moving&&Math.abs(r.pos[0]-before[0])>.3)a.dir=r.pos[0]>before[0]?1:-1;a.pos=r.pos;}
      else{const d=Math.hypot(a.target[0]-a.pos[0],a.target[1]-a.pos[1]);if(d>200)a.pos=[...a.target];else if(d>.5){const k=Math.min(1,dt*12);const nx=a.pos[0]+(a.target[0]-a.pos[0])*k;if(Math.abs(nx-a.pos[0])>.3)a.dir=nx>a.pos[0]?1:-1;a.pos=[nx,a.pos[1]+(a.target[1]-a.pos[1])*k];moving=d>2;}}
      a.moving=moving;applySheet(a,moving?'move':'idle');
      const s=a.sheet;if(s&&!reduced()){a.frameAt=(a.frameAt||0)+dt*1000;const dur=s.frameDuration||(moving?90:120);if(a.frameAt>=dur){a.frameAt%=dur;a.frame=(a.frame+1)%s.count;}}
      if(s){const c=a.frame%s.cols,r=Math.floor(a.frame/s.cols),body=a.el.querySelector('.pz-body');body.style.backgroundPosition=`${s.cols>1?c/(s.cols-1)*100:0}% ${s.rows>1?r/(s.rows-1)*100:0}%`;body.style.transform=a.dir<0?'scaleX(-1)':'';}
      a.el.style.transform=`translate(${a.pos[0].toFixed(1)}px,${a.pos[1].toFixed(1)}px)`;a.el.style.zIndex=String(Math.round(a.pos[1]));
    }
    if(P.me){camera();zone();if(P.pendingTalk){const t=P.pendingTalk;if(performance.now()>t.until||!P.actors.has(t.a.id))P.pendingTalk=null;else if(S.near(P.me.pos,t.a.pos,geo.interact||S.MAP.interact)){P.pendingTalk=null;goTo(P.me.pos);openCard(t.a);}}arrows();}
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
    const label={guild:'Vào Sảnh Bang',lantern:'Dệt Đèn Bang',ring:'Sẵn sàng giao hữu',board:'Xem Bảng Tin'}[z];
    btn.hidden=!label;if(label){btn.textContent=label;btn.dataset.zone=z;}
    P.root.querySelector('.pz-place').textContent=info&&z!=='fountain'?info.name:'Quảng Trường';
  }
  // Up to three arrows at the edge for friends and guild mates outside the view (optional).
  function arrows(){
    const box=P.root.querySelector('.pz-arrows');if(!prefs.arrows){box.innerHTML='';return;}
    const vh=viewH(),out=[];for(const a of P.actors.values()){if(a.npc||a===P.me)continue;const friend=P.friends.friends.some(f=>f.id===a.id),mate=P.guild?.members?.some(m=>m.id===a.id);if(!friend&&!mate)continue;
      const sx=a.pos[0]*WORLD_K-P.cam[0],sy=a.pos[1]*WORLD_K-P.cam[1];if(sx>40&&sx<FRAME_W-40&&sy>200&&sy<vh-40)continue;out.push({a,sx,sy,d:Math.hypot(a.pos[0]-P.me.pos[0],a.pos[1]-P.me.pos[1])});}
    out.sort((x,y)=>x.d-y.d);
    box.innerHTML=out.slice(0,3).map(({a,sx,sy})=>{const x=Math.max(40,Math.min(FRAME_W-40,sx)),y=Math.max(230,Math.min(vh-50,sy)),ang=Math.atan2(sy-y,sx-x)*180/Math.PI;
      return `<span style="left:${x}px;top:${y}px"><i style="transform:rotate(${ang}deg)"></i><b>${esc(a.name)}</b></span>`;}).join('');
  }

  // ---------- Interaction ----------
  function talkTo(a){
    if(a===P.me)return openSheet('me');
    if(a.npc)return npcTalk(a);
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
  function sheetHtml(kind,tab){
    const online=P.status==='online',needNet=online?'':'<p class="pz-note">Cần kết nối máy chủ Quảng Trường.</p>';
    switch(kind){
      case 'name':return `<h3>Tên của bạn ở Quảng Trường</h3><p class="pz-note">Tên hiện trên đầu nhân vật, ${S.LIMITS.name[0]}–${S.LIMITS.name[1]} ký tự, không đổi được trong bản thử nghiệm.</p>
        <form class="pz-form" data-form="name"><input name="name" maxlength="${S.LIMITS.name[1]}" autocomplete="off" value="${esc(P.suggest||='Lữ Khách '+Math.floor(1000+Math.random()*9000))}"><button class="gw-btn" type="submit">Vào Quảng Trường</button></form><p class="pz-name-error"></p>`;
      case 'card':{const a=P.cardFor;if(!a)return '';const p=a.profile||{},friend=isFriend(a.id),pending=P.friends.outgoing.some(f=>f.id===a.id);
        const inviteGuild=can('approve')&&!a.tag;
        return `<header class="pz-card-head">${face(a.hero)}<div><h3>${a.tag?`<b>[${esc(a.tag)}]</b> `:''}${esc(a.name)}</h3><p>${esc(M.HEROES[a.hero]?.name||'')} · cấp ${p.level||1} · ${'★'.repeat(p.stars||1)}</p>
          <p>Lực chiến ${fmt(p.power)} <small>(chưa xác thực)</small>${a.guildName?` · Bang ${esc(a.guildName)}`:''}</p></div></header>
          <div class="pz-actions">${friend?`<button class="gw-btn" data-do="whisper" data-id="${a.id}">Nhắn riêng</button>`:`<button class="gw-btn" data-do="friend" data-id="${a.id}" ${pending?'disabled':''}>${pending?'Đã gửi lời mời':'Kết bạn'}</button>`}
          <button class="gw-btn" data-do="duel" data-id="${a.id}">Giao hữu</button>${inviteGuild?`<button class="gw-btn secondary" data-do="ginvite" data-id="${a.id}">Mời vào bang</button>`:''}</div>
          <details class="pz-more"><summary>Thêm</summary><div class="pz-actions small">${friend?`<button class="gw-btn secondary" data-do="heart" data-id="${a.id}">Tặng tim</button>`:''}<button class="gw-btn secondary" data-do="whisper" data-id="${a.id}">Nhắn riêng</button><button class="gw-btn secondary" data-do="block" data-id="${a.id}">Chặn</button><button class="gw-btn secondary" data-do="report" data-id="${a.id}">Báo cáo</button></div></details>
          <p class="pz-note">Giao hữu: bạn đấu với bản sao tướng của họ do máy điều khiển, chỉ số chuẩn hóa, không thưởng.</p>${needNet}`;}
      case 'friends':{const f=P.friends,t=tab||'list';
        const tabs=`<nav class="pz-tabs">${[['list',`Bạn bè ${f.friends.length}/${S.LIMITS.friends}`],['incoming',`Lời mời${f.incoming.length?` (${f.incoming.length})`:''}`],['blocks','Đã chặn']].map(([k,l])=>`<button data-tab="${k}" class="${t===k?'on':''}">${l}</button>`).join('')}</nav>`;
        const body=t==='incoming'?(f.incoming.map(x=>`<li><b>${esc(x.name)}</b><span><button class="gw-btn" data-do="accept" data-id="${x.id}">Đồng ý</button><button class="gw-btn secondary" data-do="decline" data-id="${x.id}">Từ chối</button></span></li>`).join('')+f.outgoing.map(x=>`<li><b>${esc(x.name)}</b><small>Đã gửi lời mời</small><span><button class="gw-btn secondary" data-do="cancel" data-id="${x.id}">Hủy</button></span></li>`).join('')||'<li class="empty">Chưa có lời mời. Đứng gần ai đó và chạm vào nhân vật của họ để kết bạn.</li>')
          :t==='blocks'?(f.blocks.map(x=>`<li><b>${esc(x.name)}</b><span><button class="gw-btn secondary" data-do="unblock" data-id="${x.id}">Bỏ chặn</button></span></li>`).join('')||'<li class="empty">Chưa chặn ai.</li>')
          :(f.friends.map(x=>`<li class="${x.online?'on':''}">${face(x.hero)}<b>${esc(x.name)}</b><small>${x.online?`Trực tuyến · Kênh ${x.channel}`:'Ngoại tuyến'} · cấp ${x.level}</small><span>${x.online?`<button class="gw-btn" data-do="goto" data-id="${x.id}">Đến chỗ</button>`:''}<button class="gw-btn secondary" data-do="whisper" data-id="${x.id}">Nhắn</button><button class="gw-btn secondary" data-do="heart" data-id="${x.id}" ${x.heart?'disabled':''}>${x.heart?'Đã tặng':'Tặng tim'}</button></span></li>`).join('')||'<li class="empty">Chưa có bạn bè. Ra giữa quảng trường làm quen nhé!</li>');
        return `<h3>Bạn bè</h3><p class="pz-note">Điểm Bằng Hữu: <b>${fmt(f.friendPoints)}</b> (tặng tim mỗi ngày; cửa hàng bằng hữu mở khi có máy chủ kinh tế).</p>${tabs}<ul class="pz-list">${body}</ul>${needNet}`;}
      case 'guild':return guildHtml(tab);
      case 'lantern':return lanternHtml();
      case 'log':{const t=tab||'all',rows=P.log.filter(r=>t==='all'||r.ch===t).slice(-60);
        return `<h3>Nhật ký trò chuyện</h3><nav class="pz-tabs">${[['all','Tất cả'],['area','Khu vực'],['guild','Bang'],['whisper','Riêng'],['system','Hệ thống']].map(([k,l])=>`<button data-tab="${k}" class="${t===k?'on':''}">${l}</button>`).join('')}</nav>
          <ul class="pz-list pz-log">${rows.map(r=>`<li class="ch-${r.ch}"><time>${new Date(r.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</time><p><b>${chLabel(r)}${who(r)}</b> ${esc(r.text)}</p></li>`).join('')||'<li class="empty">Chưa có tin nhắn.</li>'}</ul>`;}
      case 'emotes':return `<h3>Biểu cảm</h3><div class="pz-emotes">${S.EMOTES.map(([id,name,icon])=>`<button data-do="emote" data-id="${id}"><span>${icon}</span>${esc(name)}</button>`).join('')}</div>`;
      case 'near':{const list=[...P.actors.values()].filter(a=>a!==P.me).map(a=>({a,d:Math.hypot(a.pos[0]-P.me.pos[0],a.pos[1]-P.me.pos[1])})).sort((x,y)=>x.d-y.d).slice(0,20);
        return `<h3>Người ở gần</h3><ul class="pz-list">${list.map(({a,d})=>`<li>${a.npc?'':face(a.hero)}<b>${a.tag?`[${esc(a.tag)}] `:''}${esc(a.name)}${a.npc?' <i>NPC</i>':''}</b><small>${Math.round(d/10)} bước</small><span><button class="gw-btn secondary" data-do="talk" data-id="${a.id}">Đến gặp</button></span></li>`).join('')||'<li class="empty">Chưa có ai ở gần.</li>'}</ul>`;}
      case 'board':{const O=window.GemwovenLiveOps,open=P.guilds.filter(g=>g.policy!=='closed').slice(0,8);
        return `<h3>Bảng Tin</h3><h4>Bang đang tuyển</h4><ul class="pz-list">${open.map(g=>`<li><b>[${esc(g.tag)}] ${esc(g.name)}</b><small>Cấp ${g.level} · ${g.members}/${g.cap} · ${g.policy==='open'?'Vào ngay':'Cần duyệt'} · từ cấp ${g.minLevel}</small><span>${P.guild?'':`<button class="gw-btn" data-do="apply" data-id="${g.id}">Xin vào</button>`}</span></li>`).join('')||'<li class="empty">Chưa có bang nào tuyển. Hãy lập bang đầu tiên!</li>'}</ul>
          ${O?`<h4>Lịch sự kiện</h4><ul class="pz-list">${O.CADENCE.map(c=>`<li><b>${esc(c.name)}</b><small>${esc(c.items.slice(0,2).join(' · '))}</small></li>`).join('')}</ul>`:''}${needNet}`;}
      case 'help':return `<header class="pz-card-head"><img class="pz-face" src="assets/gemwoven/plaza/npc-guide.webp" alt=""><div><h3>Mèo Hướng Dẫn <i>NPC</i></h3><p>Chào mừng tới Quảng Trường, meo!</p></div></header>
        <ol class="pz-help"><li><b>Đi lại:</b> kéo ngón tay trên mặt đất (cần điều hướng hiện ngay chỗ chạm), chạm một chỗ để đi tới đó, hoặc WASD / phím mũi tên.</li>
        <li><b>Trò chuyện:</b> gõ ở ô dưới cùng, tin nhắn hiện trên đầu bạn. Đổi kênh Khu vực / Bang / Riêng bằng nút bên trái ô chat.</li>
        <li><b>Làm quen:</b> đứng gần ai đó rồi chạm vào nhân vật của họ để kết bạn, nhắn riêng hoặc mời giao hữu.</li>
        <li><b>Sàn Giao Hữu</b> (vòng đá bên phải): hai người cùng đứng trong vòng và bấm Sẵn sàng để đấu bản sao.</li>
        <li><b>Sảnh Bang</b> (cửa lớn phía trên): lập hoặc xin vào bang. Bà Dệt Đèn cạnh sảnh cho bang dệt đèn mỗi tuần.</li>
        <li><b>Bảng Tin</b> (bên trái): bang đang tuyển và lịch sự kiện.</li></ol>
        <label class="pz-check"><input type="checkbox" data-pref="arrows" ${prefs.arrows?'checked':''}> Mũi tên chỉ bạn bè và người cùng bang ngoài màn hình</label>
        <label class="pz-check"><input type="checkbox" data-pref="fixed" ${prefs.stick==='fixed'?'checked':''}> Cần điều hướng cố định ở góc</label>
        <label class="pz-check"><input type="checkbox" data-pref="right" ${prefs.side==='right'?'checked':''}> Cần điều hướng bên phải</label>`;
      case 'me':{const p=myProfile();return `<header class="pz-card-head">${face(p.hero)}<div><h3>${P.guild?`<b>[${esc(P.guild.tag)}]</b> `:''}${esc(P.you?.name||'Bạn')}</h3><p>${esc(M.HEROES[p.hero]?.name)} · cấp ${p.level} · Lực chiến ${fmt(p.power)}</p><p>Kênh ${P.channel||'—'} · ${P.status==='online'?'Trực tuyến':'Ngoại tuyến'}</p></div></header>
        <p class="pz-note">Đổi tướng xuất chiến hoặc diện mạo ở trang Tướng; Quảng Trường hiện đúng diện mạo bạn đang khoác.</p><div class="pz-actions"><button class="gw-btn secondary" data-do="channels">Đổi kênh</button><button class="gw-btn secondary" data-do="help">Hướng dẫn</button></div>`;}
      case 'channels':{const list=Object.entries(P.counts).map(([n,c])=>[Number(n),c]);if(!list.some(([n])=>n===P.channel))list.push([P.channel||1,1]);const next=Math.max(1,...list.map(([n])=>n))+1;
        return `<h3>Kênh Quảng Trường</h3><p class="pz-note">Mỗi kênh tối đa ${S.LIMITS.channelCap} người. Kênh đông vui hơn; bạn bè có thể "Đến chỗ" bạn ở kênh nào cũng được.</p><ul class="pz-list">${list.sort((a,b)=>a[0]-b[0]).map(([n,c])=>`<li class="${n===P.channel?'on':''}"><b>Kênh ${n}</b><small>${c}/${S.LIMITS.channelCap} người</small><span>${n===P.channel?'<em>Đang ở</em>':`<button class="gw-btn" data-do="channel" data-id="${n}" ${c>=S.LIMITS.channelCap?'disabled':''}>Vào</button>`}</span></li>`).join('')}<li><b>Kênh ${next}</b><small>Kênh mới</small><span><button class="gw-btn secondary" data-do="channel" data-id="${next}">Vào</button></span></li></ul>${needNet}`;}
    }
    return '';
  }
  function guildHtml(tab){
    const g=P.guild,online=P.status==='online';
    if(!online)return `<h3>Bang Hội</h3><p class="pz-note">Cần kết nối máy chủ Quảng Trường.</p>`;
    if(!g){const t=tab||'find';const emb=P.emblem||'sword';
      return `<h3>Bang Hội</h3><nav class="pz-tabs"><button data-tab="find" class="${t==='find'?'on':''}">Tìm bang</button><button data-tab="create" class="${t==='create'?'on':''}">Lập bang</button></nav>`+
        (t==='create'?`<form class="pz-form pz-guild-form" data-form="guild"><label>Tên bang<input name="name" maxlength="${S.LIMITS.guildName[1]}" autocomplete="off" required></label><label>Thẻ (2–4 chữ in hoa)<input name="tag" maxlength="4" autocomplete="off" required style="text-transform:uppercase"></label>
          <fieldset class="pz-emblems"><legend>Biểu tượng</legend>${S.GUILD_EMBLEMS.map(e=>`<label><input type="radio" name="emblem" value="${e}" ${e===emb?'checked':''}><span class="emblem emblem-${e}"></span></label>`).join('')}</fieldset>
          <button class="gw-btn" type="submit">Lập bang</button><p class="pz-note">Cần tướng cấp ${S.LIMITS.guildMinLevel}. Phí 100.000 vàng sẽ thu khi kinh tế chuyển lên máy chủ; bản thử nghiệm miễn phí.</p></form>`
        :`<ul class="pz-list">${P.guilds.map(x=>`<li><span class="emblem emblem-${esc(x.emblem)}"></span><b>[${esc(x.tag)}] ${esc(x.name)}</b><small>Cấp ${x.level} · ${x.members}/${x.cap} · ${x.policy==='open'?'Vào ngay':x.policy==='closed'?'Đóng':'Cần duyệt'} · từ cấp ${x.minLevel}</small><span><button class="gw-btn" data-do="apply" data-id="${x.id}" ${x.policy==='closed'||x.members>=x.cap?'disabled':''}>Xin vào</button></span></li>`).join('')||'<li class="empty">Chưa có bang nào. Hãy lập bang đầu tiên!</li>'}</ul>`);}
    const t=tab||'info',lvlNext=g.next?`${fmt(g.exp)}/${fmt(g.next)}`:'Tối đa',pct=g.next?Math.min(100,(g.exp-(S.GUILD_EXP[g.level-1]||0))/(g.next-(S.GUILD_EXP[g.level-1]||0))*100):100;
    const tabs=[['info','Thông tin'],['members',`Thành viên ${g.members.length}/${g.cap}`],...(g.applications.length||can('approve')?[['apps',`Đơn xin${g.applications.length?` (${g.applications.length})`:''}`]]:[]),['events','Hoạt động'],['log','Nhật ký']];
    const head=`<header class="pz-guild-head"><span class="emblem emblem-${esc(g.emblem)}"></span><div><h3>[${esc(g.tag)}] ${esc(g.name)}</h3><p>Cấp ${g.level} · ${S.RANKS[g.me.rank].name}</p><div class="pz-bar"><i style="width:${pct}%"></i><span>${lvlNext}</span></div></div></header>`;
    let body='';
    if(t==='info')body=`<blockquote class="pz-notice">${esc(g.notice)}</blockquote>${can('notice')?`<form class="pz-form" data-form="notice"><input name="text" maxlength="${S.LIMITS.guildNotice}" placeholder="Thông báo mới"><button class="gw-btn secondary" type="submit">Đổi</button></form>
        <form class="pz-form" data-form="policy"><select name="policy">${[['open','Vào ngay'],['approval','Cần duyệt'],['closed','Đóng']].map(([v,l])=>`<option value="${v}" ${g.policy===v?'selected':''}>${l}</option>`).join('')}</select><input name="minLevel" type="number" min="1" max="500" value="${g.minLevel}"><button class="gw-btn secondary" type="submit">Lưu</button></form>`:''}
      <div class="pz-actions"><button class="gw-btn" data-do="checkin" ${g.me.checked?'disabled':''}>${g.me.checked?'Đã điểm danh':`Điểm danh (+${S.CHECKIN.contribution} cống hiến)`}</button><button class="gw-btn secondary" data-do="lantern">Đèn bang · bậc ${g.lantern.tier}/3</button></div>
      ${g.leaderAway>=S.LIMITS.leaderWarnDays?`<p class="pz-note">Bang Chủ vắng ${g.leaderAway} ngày; tới ${S.LIMITS.leaderTransferDays} ngày quyền Bang Chủ chuyển cho cán bộ hoạt động nhất.</p>`:''}
      <button class="gw-btn danger" data-do="leave">Rời bang</button>`;
    if(t==='members')body=`<ul class="pz-list">${g.members.map(m=>{const higher=S.RANK_ORDER.indexOf(m.rank)>S.RANK_ORDER.indexOf(g.me.rank);const ctl=m.id!==P.you?.id&&higher&&can('promote');
      return `<li class="${m.online?'on':''}">${face(m.hero)}<b>${esc(m.name)}</b><small>${S.RANKS[m.rank].name} · cấp ${m.level} · tuần ${fmt(m.week)} / tổng ${fmt(m.contribution)}${m.checked?' · ✓':''}</small><span>${ctl?`<button class="gw-btn secondary" data-do="promote" data-id="${m.id}">Thăng</button><button class="gw-btn secondary" data-do="demote" data-id="${m.id}">Giáng</button>`:''}${m.id!==P.you?.id&&higher&&can('kick')?`<button class="gw-btn danger" data-do="kick" data-id="${m.id}">Mời ra</button>`:''}${g.me.rank==='leader'&&m.rank==='vice'?`<button class="gw-btn secondary" data-do="promote" data-id="${m.id}">Nhường chủ</button>`:''}</span></li>`;}).join('')}</ul>
      <p class="pz-note">Cán bộ: ${S.LIMITS.officers.vice} Phó Bang, ${S.LIMITS.officers.elder} Trưởng Lão. Chỉ thao tác được với người chức thấp hơn mình.</p>`;
    if(t==='apps')body=`<ul class="pz-list">${g.applications.map(x=>`<li><b>${esc(x.name)}</b><small>cấp ${x.level}</small><span>${can('approve')?`<button class="gw-btn" data-do="approve" data-id="${x.id}">Nhận</button><button class="gw-btn secondary" data-do="reject" data-id="${x.id}">Từ chối</button>`:''}</span></li>`).join('')||'<li class="empty">Chưa có đơn.</li>'}</ul>`;
    if(t==='events')body=`<ul class="pz-list pz-events"><li class="on"><b>Dệt Đèn Bang · hằng tuần</b><small>Mỗi người dệt 1 sợi/ngày tại Bà Dệt Đèn (tối đa ${S.LIMITS.lanternPerWeek}/tuần). Đèn sáng bậc 1/2/3 ở ${S.LANTERN.tiers.join('/')} sợi khi đủ cả ba màu.</small><span><button class="gw-btn" data-do="lantern">Xem đèn</button></span></li>
      <li><b>Boss Bang · hằng tuần</b><small>Chung một thanh máu, xếp hạng sát thương trong bang. Sắp ra mắt (cần máy chủ trận).</small></li>
      <li><b>Viễn Chinh · cuối tuần</b><small>Cả bang cùng đi một chuỗi ải. Sắp ra mắt.</small></li><li><b>Chiến Trường Bang · theo mùa</b><small>Bang đấu bang. Sắp ra mắt.</small></li>
      <li><b>Cửa Hàng Bang</b><small>Đổi cống hiến lấy nguyên liệu, mảnh tướng cũ giới hạn tuần. Sắp ra mắt (cần máy chủ kinh tế).</small></li></ul>`;
    if(t==='log')body=`<ul class="pz-list pz-log">${g.log.slice().reverse().map(r=>`<li><time>${new Date(r.at).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time><p>${esc(r.text)}</p></li>`).join('')||'<li class="empty">Chưa có gì.</li>'}</ul>`;
    return head+`<nav class="pz-tabs">${tabs.map(([k,l])=>`<button data-tab="${k}" class="${t===k?'on':''}">${l}</button>`).join('')}</nav>`+body;
  }
  function lanternHtml(){
    const g=P.guild,tier=g?.lantern?.tier||0,threads=g?.lantern?.threads||{};
    const at=P.zone==='lantern';
    return `<header class="pz-card-head"><img class="pz-face" src="assets/gemwoven/plaza/npc-weaver.webp" alt=""><div><h3>Bà Dệt Đèn <i>NPC</i></h3><p>Mỗi ngày một sợi, cả bang cùng dệt nên ngọn đèn.</p></div></header>
      <div class="pz-lantern"><img src="assets/gemwoven/plaza/lantern-${tier}.webp" alt="Đèn bang bậc ${tier}"><div><p>Đèn bang tuần này: <b>bậc ${tier}/3</b></p>
      <ul class="pz-threads">${S.LANTERN.colors.map(([c,name,color])=>`<li style="--c:${color}"><i></i>${esc(name)} <b>${threads[c]||0}</b></li>`).join('')}</ul>
      <p class="pz-note">Bậc 1/2/3 ở ${S.LANTERN.tiers.join(' / ')} sợi và mỗi màu ít nhất 1 / 3 / 5 sợi. Đèn sáng hiện ở sảnh bang cả tuần. Chưa trao tài nguyên trong bản thử nghiệm.</p></div></div>
      ${!g?'<p class="pz-note">Vào một bang để cùng dệt đèn.</p>':g.me.wove?'<p class="pz-note">Hôm nay bạn đã dệt. Quay lại vào ngày mai nhé!</p>':g.me.woven>=S.LIMITS.lanternPerWeek?'<p class="pz-note">Tuần này bạn đã dệt đủ 5 sợi.</p>':!at?'<p class="pz-note">Lại gần Bà Dệt Đèn (cạnh sảnh bang) để dệt.</p><div class="pz-actions"><button class="gw-btn" data-do="walk-weaver">Đi tới Bà Dệt Đèn</button></div>'
      :`<div class="pz-actions">${S.LANTERN.colors.map(([c,name,color])=>`<button class="gw-btn thread" style="--c:${color}" data-do="weave" data-id="${c}">${esc(name)}</button>`).join('')}</div><p class="pz-note">Bàn với bang chọn màu đang thiếu để đèn lên bậc.</p>`}`;
  }
  function openSheet(kind,tab){
    P.sheet=kind;P.sheetTab=tab;const box=P.root.querySelector('.pz-sheet');box.hidden=false;box.dataset.kind=kind;
    box.querySelector('.pz-sheet-body').innerHTML=sheetHtml(kind,tab);
    if(kind==='name')setTimeout(()=>box.querySelector('input')?.focus(),50);
    if(kind==='guild'&&!P.guild&&P.status==='online')send({t:'guild',op:'list'});
    if(kind==='board'&&P.status==='online')send({t:'guild',op:'list'});
  }
  function closeSheet(){P.sheet=null;const box=P.root.querySelector('.pz-sheet');box.hidden=true;}
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
    P.chatCh=ch;const b=P.root.querySelector('.pz-chan');b.textContent={area:'Khu vực',guild:'Bang',whisper:P.whisperTo?`→ ${P.whisperTo.name}`:'Riêng'}[ch];b.dataset.ch=ch;
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
    const paint=()=>{box.innerHTML=`<p><b>${esc(m.name)}</b> mời bạn giao hữu (${esc(M.HEROES[m.p?.hero]?.name||'')})</p><small>Đấu bản sao tướng của họ · AI · không thưởng · ${left}s</small><div><button class="gw-btn" data-duel="accept">Đồng ý</button><button class="gw-btn secondary" data-duel="decline">Từ chối</button></div>`;};
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
    const box=P.root?.querySelector('.pz-toast');if(!box)return;box.innerHTML=`<span>${esc(text)}</span>${label?`<button class="gw-btn secondary">${esc(label)}</button>`:''}`;box.className='pz-toast show'+(error?' error':'');
    if(label)box.querySelector('button').onclick=()=>{box.className='pz-toast';run();};clearTimeout(P.toastTimer);P.toastTimer=setTimeout(()=>{box.className='pz-toast';},label?6000:3200);
  }
  function status(){
    if(!P.root)return;const s=P.root.querySelector('.pz-status');const n=[...P.actors.values()].filter(a=>!a.npc).length;
    s.className='pz-status '+P.status;s.innerHTML=P.status==='online'?`<i></i>Kênh ${P.channel||'—'} · ${n} người`:P.status==='connecting'?'<i></i>Đang kết nối…':P.status==='naming'?'<i></i>Đặt tên':'<i></i>Ngoại tuyến · Thử lại';
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
      <header class="pz-top"><button type="button" class="pz-back" data-action="route:home" aria-label="Về thị trấn">‹</button><div><b class="pz-place">Quảng Trường</b><button type="button" class="pz-status" data-open="channels"></button></div></header>
      <nav class="pz-side" aria-label="Quảng Trường">
        <button type="button" data-open="friends"><img src="${esc(asset('icon-friends'))}" alt=""><span>Bạn bè</span><b class="pz-badge" hidden></b></button>
        <button type="button" data-open="guild"><img src="${esc(asset('icon-crown'))}" alt=""><span>Bang hội</span><b class="pz-badge" hidden></b></button>
        <button type="button" data-open="emotes"><span class="pz-emoji">😄</span><span>Biểu cảm</span></button>
        <button type="button" data-open="near"><img src="${esc(asset('icon-hero'))}" alt=""><span>Người gần</span></button>
        <button type="button" data-open="help"><img src="${esc(asset('icon-settings'))}" alt=""><span>Hướng dẫn</span></button></nav>
      <button type="button" class="pz-context" hidden></button>
      <div class="pz-stick ${stickSide} ${prefs.stick==='fixed'?'fixed':''}" aria-hidden="true"><i></i></div>
      <button type="button" class="pz-ticker" data-open="log" aria-label="Mở nhật ký trò chuyện"></button>
      <form class="pz-chat"><button type="button" class="pz-chan" data-ch="area">Khu vực</button><label class="pz-field"><input class="pz-input" maxlength="${S.LIMITS.chat}" placeholder="Nhắn gì đó…" autocomplete="off" enterkeyhint="send" aria-label="Tin nhắn"><small class="pz-count">0/${S.LIMITS.chat}</small></label><button type="submit" class="gw-btn pz-send">Gửi</button></form>
      <div class="pz-invite" hidden></div><div class="pz-toast" role="status" aria-live="polite"></div>
      <section class="pz-sheet" hidden><button type="button" class="pz-close" aria-label="Đóng">×</button><div class="pz-sheet-body"></div></section>`;
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
