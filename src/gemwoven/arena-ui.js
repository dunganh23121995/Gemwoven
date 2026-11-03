/* Đấu Trường — Cúp Đấu Trường first (owner 04/11: "các item sắp xếp chưa hợp lý; chưa có chỗ thi đấu mỗi tháng").
 * Claude + Codex arena rounds 1–2 (assets/gemwoven/raw/arena-mockup/: critique, approved mockup-1.png 8,5/10, sheets
 * A/B). Reading order: the month's cup (sign) → who leads (2–1–3 podium of portraits) → where you stand (strip) → play
 * (one button) → the other modes as three banners on one rack, each its own action (1v1 cùng máy, Đấu Hạng Sắp ra mắt,
 * Trùm Vô Tận). Every frame is drawn (assets/gemwoven/arena + existing items); words and numbers are HTML on top.
 * Rules and the local prototype are progression.js (CUP, cupView, begin('cup')); prizes are liveops.js CUP_PRIZES.
 * The prototype plays AI copies, grants nothing and is labelled as local everywhere it shows a result.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS;
  if(!G?.decorate||!M?.cupView||!G.engine?.cup)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.round(n||0).toLocaleString('vi-VN'),file=k=>A[k]?.file||'',P='assets/gemwoven/arena/';
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const face=hero=>file('face-'+hero)||file('portrait-'+hero);
  const ROUND=['','Tứ Kết','Bán Kết','Chung Kết'],FINISH={champion:'Vô địch',final:'Á quân',semi:'Bán kết',quarter:'Tứ kết'};
  const url=f=>new URL(f,document.baseURI).href;
  function left(s){const ms=Math.max(0,s.msLeft),d=Math.floor(ms/86400000),h=Math.floor(ms/3600000);return d>=1?`Còn ${d} ngày`:h>=1?`Còn ${h} giờ`:'Sắp hết giờ';}
  function phase(v){const s=v.season;return `Tháng ${s.month} · ${s.phase==='race'?'Vòng Đua Điểm':ROUND[s.round]}`;}
  // The play button: what one tap does right now.
  function action(v){
    const s=v.season;
    if(s.phase==='race')return v.tickets>0?{text:`Đấu thử · ${v.tickets} lượt`,on:true}:{text:'Hết lượt · mai thêm 5',on:false};
    if(v.match)return {text:`Vào ${ROUND[v.match.round]} · ${v.match.wins[0]}–${v.match.wins[1]}`,on:true};
    return {text:'Xem nhánh Top 8',on:true,view:'finals'};
  }
  function standing(v){const y=v.you;return y.ranked?`Bạn · Hạng ${y.rank} · ${fmt(y.points)} điểm`:`Bạn · Chưa xếp hạng · ${y.played}/${M.CUP.rankedAfter} trận`;}
  const cupHero=(state,v)=>v.pool.includes(state.cupHero)?state.cupHero:v.pool.includes(G.engine.read().selected)?G.engine.read().selected:v.pool[0];
  function build(el,state){
    const v=G.engine.cup(),a=action(v),hero=cupHero(state,v);
    for(const [k,f] of [['row',P+'row.webp'],['slot',P+'slot.webp'],['match',P+'match.webp'],['tab','assets/gemwoven/forge/tab.webp'],['tag','assets/gemwoven/forge/tag.webp'],...['tab-wood','button-gold','nameplate','panel-parchment'].map(k=>[k,file(k)])])document.documentElement.style.setProperty('--ar-'+k,`url("${url(f)}")`);
    const pod=[[1,'silver',[228,604,150,150],[243,722,120,154]],[0,'gold',[381,552,178,178],[395,680,150,173]],[2,'bronze',[563,604,150,150],[578,722,120,154]]];
    el.innerHTML=
      `<button type="button" class="ar-sign" data-action="cup:open" style="${box(150,212,641,275)}" aria-label="Cúp Đấu Trường · mở bảng giải"><img src="${P}cup-sign.webp" alt=""><b>${esc(M.CUP.name)}</b><span>${esc(phase(v))}</span><em><img src="${file('icon-trophy')}" alt="">${esc(left(v.season))}</em></button>`+
      `<div class="ar-ribbon" style="${box(300,468,341,77)}"><img src="${P}ribbon.webp" alt=""><span>${esc(M.CUP.server)}</span></div>`+
      pod.map(([i,tone,f,t])=>{const r=v.top[i];return `<button type="button" class="ar-podium ${tone}" data-action="cup:open" data-tab="race" style="${box(t[0],t[1],t[2],t[3])}" aria-label="Hạng ${i+1}${r?' · '+esc(r.name):''}"><img src="${file('rank-'+tone)}" alt=""><b>${i+1}</b></button>`+
        `<div class="ar-frame ${tone} ${r?'':'empty'}" style="${box(...f)}">${r?`<img class="ar-face" src="${face(r.hero)}" alt="">`:''}<img src="${P}frame-${tone}.webp" alt=""><small>${r?(r.ai?'AI':'Bạn'):'—'}</small></div>`+
        `<p class="ar-name" style="${box(t[0]-30,t[1]+t[3]-4,t[2]+60,38)}">${r?esc(r.name):'Chưa có'}</p>`;}).join('')+
      `<button type="button" class="ar-strip" data-action="cup:open" data-tab="race" style="${box(95,925,751,76)}"><img src="${face(hero)}" alt=""><span>${esc(standing(v))}</span></button>`+
      `<button type="button" class="ar-hero" data-action="cup:hero" style="${box(108,1012,108,108)}" aria-label="Tướng thi đấu: ${esc(M.HEROES[hero].name)} · chạm để đổi"><img class="ar-face" src="${face(hero)}" alt=""><img src="${file('avatar-ring')}" alt=""><small>${esc(M.HEROES[hero].name)}</small></button>`+
      `<button type="button" class="ar-go ${a.on?'':'off'}" data-action="${a.view?'cup:open':'cup:play'}" ${a.view?`data-tab="${a.view}"`:''} ${a.on?'':'disabled'} style="${box(230,1004,466,122)}"><span>${esc(a.text)}</span></button>`+
      `<button type="button" class="ar-chest" data-action="cup:open" data-tab="prizes" style="${box(708,996,160,140)}"><img src="${file('chest')}" alt=""><span>Xem thưởng</span></button>`+
      `<p class="ar-note" style="${box(70,1146,801,76)}"><span>Bản thử cục bộ · 31 AI + bạn · Không thưởng</span><span>Kết quả không lên bảng toàn cầu</span></p>`+
      `<img class="ar-rack" src="${P}mode-rack.webp" alt="" style="${box(39,1232,863,228)}">`+
      [['duel','flag-blue','icon-arena','1v1','Cùng máy','cup:duel'],['ranked','flag-blue','icon-arena','Đấu Hạng','Sắp ra mắt','growth:arena'],['boss','flag-red','icon-crown','Trùm','Vô Tận','route:boss']].map(([id,flag,icon,a1,a2,act],i)=>
        `<button type="button" class="ar-mode ${id}" data-action="${act}" style="${box(39+863*[.204,.498,.793][i]-100,1236,200,240)}" aria-label="${a1} ${a2}"><img src="${file(flag)}" alt=""><i><img src="${file(icon)}" alt="">${id==='ranked'?`<img class="ar-lock" src="assets/gemwoven/forge/lock.webp" alt="">`:''}</i><b>${a1}</b><small>${a2}</small></button>`).join('');
  }
  // ----- The cup popup: Đua Điểm · Top 8 · Thưởng · Vinh Danh -----
  const TABS=[['race','Đua Điểm','icon-arena'],['finals','Top 8','icon-trophy'],['prizes','Thưởng','chest'],['hall','Vinh Danh','icon-crown']];
  function row(r,v){return `<li class="ar-row ${r.you?'you':''} ${r.rank&&r.rank<=3?'top':''}"><b class="ar-rank">${r.rank&&r.rank<=3?`<img src="${file(['','rank-gold','rank-silver','rank-bronze'][r.rank])}" alt="">`:''}<span>${r.rank||'–'}</span></b><img class="ar-face" src="${face(r.hero)}" alt=""><span class="ar-who"><b>${esc(r.name)}</b><small>${r.ai?'AI · ':''}${esc(M.HEROES[r.hero]?.name||'')} · ${r.played} trận</small></span><b class="ar-pts">${fmt(r.points)}</b>${r.you?'<i class="ar-me" aria-label="Bạn">◆</i>':''}</li>`;}
  function raceTab(v){
    const y=v.you,need=[[`${y.played}/${M.CUP.rankedAfter}`,'trận để xếp hạng',y.played>=M.CUP.rankedAfter],[`${y.played}/${M.CUP.finalsMatches}`,'trận vào Top 8',y.played>=M.CUP.finalsMatches],[`${Math.min(y.late,M.CUP.lateMatches)}/${M.CUP.lateMatches}`,`trận trong 7 ngày cuối (từ ngày ${v.season.lateFrom})`,y.late>=M.CUP.lateMatches]];
    return `<div class="ar-goals">${need.map(([n,t,ok])=>`<span class="${ok?'ok':''}"><b>${n}</b>${t}</span>`).join('')}</div><ol class="ar-table">${v.table.map(r=>row(r,v)).join('')}</ol>`;
  }
  function card(m,label){const side=(r,w,win)=>`<div class="${r?.you?'you':''} ${win?'win':''}">${r?`<img class="ar-face" src="${face(r.hero)}" alt=""><b>${esc(r.name)}${r.ai?' <small>AI</small>':''}</b>`:'<b>—</b>'}<em>${m.decided||m.wins[0]+m.wins[1]?w:''}</em></div>`;
    return `<div class="ar-match ${m.live?'live':''}">${side(m.a,m.wins[0],m.winner&&m.winner===m.a)}${side(m.b,m.wins[1],m.winner&&m.winner===m.b)}<small>${label}</small></div>`;}
  function finalsTab(v){
    const f=v.finals,s=v.season;
    if(!f.ready){const pairs=[[0,7],[3,4],[1,6],[2,5]].map(([a,b])=>({a:f.seeds[a],b:f.seeds[b],wins:[0,0],decided:false}));
      return `<p class="ar-lead small">Top 8 hiện tại · chốt hết ngày ${s.raceDays}/${s.month}<br>Tứ kết ${s.raceDays+1} · Bán kết ${s.raceDays+2} · Chung kết ${s.days}/${s.month} · BO3 ${M.CUP.finalsHour}:00</p><div class="ar-bracket"><section><h4>Tứ Kết</h4>${pairs.map(m=>card(m,'Dự kiến')).join('')}</section></div>`;}
    return `<div class="ar-bracket">${f.rounds.map(r=>`<section><h4>${ROUND[r.round]} · ${r.day}/${s.month}</h4>${r.matches.map(m=>card(m,m.decided?'Xong':m.live?'Hôm nay':'Chờ')).join('')}</section>`).join('')}</div>`+
      (f.champion?`<p class="ar-lead">Vô địch: <b>${esc(f.champion.name)}</b>${f.champion.ai?' (AI)':''}</p>`:'');
  }
  function prizesTab(){
    const titles=M.titleList(G.engine.read());
    return `<p class="ar-server">Thưởng do máy chủ trao · Sắp ra mắt · bản thử chỉ xem trước</p><div class="ar-prizes">${O.CUP_PRIZES.map(z=>{const t=titles.find(x=>x.id===z.title);
      const pic=z.frame?`<img src="${P}frame-${z.frame}.webp" alt="">`:z.reward?Object.keys(z.reward).map(k=>`<img src="${file(M.RESOURCES[k][1])}" alt="">`).join(''):`<img src="${file('icon-trophy')}" alt="">`;
      return `<details class="ar-prize"><summary><span class="ar-slot">${pic}</span><span><b>${esc(z.name)}</b>${t?window.GemwovenTitlePlate?.(t)||'':''}</span></summary><ul>${z.items.map(i=>`<li>${esc(i)}</li>`).join('')}${z.reward?`<li>${Object.entries(z.reward).map(([k,n])=>`${fmt(n)} ${esc(M.RESOURCES[k][0])}`).join(' · ')}</li>`:''}</ul></details>`;}).join('')}</div>`+
      `<p class="ar-lead">Thưởng hạng chỉ trang trí: không Đá Ngọc, điểm báu vật, ngọc khảm hay tài nguyên theo hạng. Mỗi người nhận gói cao nhất của mình + gói 10 trận, qua Hòm Thư 48 giờ sau chung kết.</p>`;
  }
  function hallTab(v){
    const h=v.history,top=h.find(x=>x.champion);
    const hero=top?`<div class="ar-champ"><div class="ar-frame gold"><img class="ar-face" src="${face(top.champion.hero)}" alt=""><img src="${P}frame-gold.webp" alt=""><small>${top.champion.ai?'AI':'Bạn'}</small></div><b>${esc(top.champion.name)}</b><span>Tháng ${esc(top.season.slice(5).replace(/^0/,''))}/${esc(top.season.slice(0,4))}</span></div>`
      :`<div class="ar-champ empty"><div class="ar-frame gold empty"><img src="${P}frame-gold.webp" alt=""><small>—</small></div><b>Chưa có nhà vô địch</b></div>`;
    return `<p class="ar-server">Lịch sử bản thử trên máy này · không phải bảng toàn cầu</p>${hero}<ol class="ar-table">${h.map(x=>`<li class="ar-row"><b class="ar-rank"><span>${esc(x.season.slice(5))}</span></b><span class="ar-who"><b>${esc(x.champion?x.champion.name+(x.champion.ai?' (AI)':''):'—')}</b><small>Bạn: ${x.rank?'hạng '+x.rank:'chưa xếp hạng'}${x.finish?' · '+FINISH[x.finish]:''} · ${fmt(x.points)} điểm</small></span></li>`).join('')}</ol>`;
  }
  const RULES=()=>`<details class="ar-rules"><summary>ⓘ Luật giải</summary><ul>
    <li>Chuẩn Hóa: mượn mọi tướng đã phát hành, chỉ số chuẩn, kỹ năng cấp 1; không trang bị, báu vật, ngọc, VIP, hình thái nâng cấp, Biến Thân.</li>
    <li>${M.CUP.daily} trận mỗi ngày (dồn tối đa ${M.CUP.bank}). Điểm Elo từ ${fmt(M.CUP.start)}: ngang sức thắng +20, thua −20. Thoát giữa trận tính thua.</li>
    <li>Xếp hạng từ ${M.CUP.rankedAfter} trận. Top 8 cần ${M.CUP.finalsMatches} trận, ${M.CUP.lateMatches} trận trong 7 ngày cuối. Hòa điểm: điểm đối thủ trung bình, rồi số thắng.</li>
    <li>3 ngày cuối tháng: tứ kết, bán kết, chung kết BO3 lúc ${M.CUP.finalsHour}:00 (UTC+7).</li>
    <li>Máy chủ (Sắp ra mắt): mở sau ải ${M.CUP.stage}, ghép người thật theo điểm, cần ≥ ${M.CUP.minField} người đủ điều kiện để trao ngôi.</li></ul></details>`;
  function openCup(ctx,state,tab=state.cupTab||'race'){
    state.cupTab=tab;let v;try{v=G.engine.cupSync();}catch{v=G.engine.cup();}
    const modal=window.GemwovenUI.makeDialog('cup-dialog',`${M.CUP.name} · Tháng ${v.season.month}`,'cup-dialog');
    const a=action(v),hero=cupHero(state,v);
    modal.body.innerHTML=`<p class="ar-head"><b>${esc(phase(v))}</b> · ${esc(left(v.season))}<span>${esc(M.CUP.label)}</span></p>`+
      `<nav class="ar-tabs">${TABS.map(([id,name,icon])=>`<button type="button" class="${id===tab?'on':''}" data-tab="${id}"><img src="${file(icon)}" alt="">${name}</button>`).join('')}</nav>`+
      `<div class="ar-pane">${{race:raceTab,finals:finalsTab,prizes:prizesTab,hall:hallTab}[tab](v)}</div>`+
      `<ol class="ar-table pinned">${row(v.you,v)}</ol>`+RULES();
    modal.body.querySelectorAll('.ar-tabs [data-tab]').forEach(b=>b.onclick=()=>openCup(ctx,state,b.dataset.tab));
    const pick=document.createElement('div');pick.className='ar-pick';
    pick.innerHTML=v.pool.map(k=>`<button type="button" class="${k===hero?'on':''}" data-hero="${k}" aria-label="${esc(M.HEROES[k].name)}"><img src="${face(k)}" alt=""><small>${esc(M.HEROES[k].name)}</small></button>`).join('');
    pick.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>{state.cupHero=b.dataset.hero;openCup(ctx,state,tab);ctx.render();});
    const go=document.createElement('button');go.type='button';go.className='gw-btn ar-play';go.textContent=a.text;go.disabled=!a.on||!!a.view;go.onclick=()=>play(ctx,state);
    modal.actions.append(pick,go);modal.present();
    if(v.you.ranked)modal.querySelector('.ar-pane .ar-row.you')?.scrollIntoView({block:'center'});
  }
  function play(ctx,state){
    try{const v=G.engine.cup(),b=G.engine.begin('cup',1,{hero:cupHero(state,v)});document.getElementById('cup-dialog')?.close();
      ctx.showModal?.(`${M.CUP.name} · bản thử`,['icon-arena'],`Gặp bản sao ${b.cup.opponent.name} (AI). Thoát giữa trận tính thua.`);
      setTimeout(()=>{location.href='Game.html?encounter='+encodeURIComponent(b.token);},700);}
    catch(e){ctx.showModal('Chưa thể vào trận',[],e.message);}
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='arena')return p;
    if(state.cupSynced!==M.cupSeason(Date.now()).key+':'+new Date().getDate()){try{G.engine.cupSync();}catch{}state.cupSynced=M.cupSeason(Date.now()).key+':'+new Date().getDate();}
    const keep=/^arena\.(?!crest|fighter-|versus|rank-|ranking|mode-|rewards|reward-|battle)/;
    const nodes=L.screens.arena.nodes.filter(n=>keep.test(n.id));
    // The screen title: a small hanging sign above the cup (Codex round 1).
    for(const n of nodes){if(n.id==='arena.arena-sign')n.rect=[320,126,301,82];if(n.id==='arena.title'){n.rect=[336,144,269,48];n.size=36;}}
    nodes.push({id:'arena.cup',kind:'content',rect:[0,0,941,1490],className:'exploration-map ar',build:el=>build(el,state)});
    L.screens.arena.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(act,el,ctx,state)=>{
    if(!act.startsWith('cup:'))return handle(act,el,ctx,state);
    const cmd=act.slice(4);
    if(cmd==='open'){openCup(ctx,state,el.dataset.tab||state.cupTab||'race');return true;}
    if(cmd==='play'){play(ctx,state);return true;}
    if(cmd==='hero'){const v=G.engine.cup(),i=v.pool.indexOf(cupHero(state,v));state.cupHero=v.pool[(i+1)%v.pool.length];ctx.render();return true;}
    // Hai người một máy: straight into the local duel (Hiro against Hiro, no reward, no ranking).
    if(cmd==='duel'){try{const b=G.engine.begin('duel',1);location.href='Game.html?encounter='+encodeURIComponent(b.token);}catch(e){ctx.showModal('Chưa thể vào trận',[],e.message);}return true;}
    return true;
  };
  window.GemwovenArenaUI={openCup};
})();
