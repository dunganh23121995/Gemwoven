/* Lò Rèn — "Bàn rèn" (owner 03/11: the first rebuild did not pass as a design; Codex art direction review 21 and
 * the approved mockup assets/gemwoven/raw/forge-mockup/mockup-1.png). The interface is made of objects in the smithy,
 * all drawn by Codex (assets/gemwoven/forge): a tool rack with the hero's six worn slots, the piece floating over the
 * anvil, three wooden tabs, one workbench (ingot shelf, two display recesses, a parchment strip, an ingredient tray)
 * and a hammer plate for the one action. Words and numbers are the HTML layer on top of the art.
 * Reading order: for whom (hero badge) → which piece (rack) → what it gives (recesses + strip) → what it costs (tray)
 * → do it (hammer plate). Rules stay in progression.js (craft, strengthenTo, strengthenPlan, socketGem, fuseGems).
 * Boxes below are in the 941x1672 stage; the bench art is 1524x994 and its parts are placed by its own pixels.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS;
  if(!G?.decorate||!G.engine?.strengthenPlan)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tight=n=>M.compact(n,1000),file=k=>A[k]?.file||'';
  const owned=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const affordable=(p,c)=>c&&Object.entries(c).every(([id,n])=>owned(p,id)>=n);
  const SLOT_ORDER=Object.keys(M.SLOTS),ROMAN=['','I','II','III','IV','V'],F='assets/gemwoven/forge/';
  const worn=(p,hero,slot)=>p.equipment.find(g=>g.id===p.heroes[hero]?.gear?.[slot]);
  // One picture per slot and rarity when drawn (assets/gemwoven/gear), the slot's own picture otherwise.
  const pic=(slot,rarity)=>file(`gear-${rarity}-${slot}`)||file(M.SLOT_ART[slot]);
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  // The bench: stage box and its parts in bench pixels.
  const BENCH={x:20,y:742,w:900,src:1524},bx=v=>BENCH.x+v*BENCH.w/BENCH.src,by=v=>BENCH.y+v*BENCH.w/BENCH.src,bs=v=>v*BENCH.w/BENCH.src;
  const part=(x0,y0,x1,y1)=>box(bx(x0),by(y0),bs(x1-x0),bs(y1-y0));
  const SHELF=[150,75,1370,262],LEFT=[250,335,675,530],RIGHT=[850,335,1275,530],STRIP=[360,555,1160,620],TRAY=[175,680,1352,840];
  const RACK={x:164,y:356,w:613,h:126};
  function stats(p,hero,mutate){const q=JSON.parse(JSON.stringify(p));mutate?.(q);return M.stats(q,hero);}
  // The stats that change, before → after (the strip shows at most two).
  function changes(a,b){
    return [['stat-attack','Công',a.attack,b.attack,v=>'×'+v.toFixed(2)],['stat-heart','HP',a.hp,b.hp,v=>M.compact(v,10000)],['stat-shield','Thủ',a.defense,b.defense,v=>Math.round(v*100)+'%']]
      .filter(([, ,x,y])=>Math.abs(y-x)>1e-9).slice(0,2)
      .map(([icon,name,x,y,f])=>`<span class="${y>x?'up':'down'}"><img src="${file(icon)}" alt="">${name} ${f(x)} <i>→</i> <b>${f(y)}</b></span>`).join('')||'<span>Không đổi chỉ số</span>';
  }
  function tray(p,c,note=''){
    const rows=Object.entries(c||{}).filter(([,n])=>n>0),[x0,y0,x1,y1]=TRAY,w=(x1-x0)/Math.max(5,rows.length);
    const spare=5-rows.length;
    return `<b class="fg2-caption" style="${box(bx(x0)+bs(x1-x0)/2-80,by(y0)-20,160,34)}">Cần</b>`+(spare>0&&note?`<p class="fg2-traynote" style="${part(x0+rows.length*w,y0,x1,y1)}">${note}</p>`:'')+rows.map(([id,n],i)=>{const have=owned(p,id);
      return `<button type="button" class="fg2-mat ${have>=n?'':'short'}" data-action="item:${id}" style="${part(x0+i*w,y0,x0+(i+1)*w,y1)}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)} · có ${tight(have)}"><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><b>${tight(n)}</b><i>${have>=n?'✓':'✕'}</i></button>`;}).join('');
  }
  const recess=(where,label,img,caption,cls='')=>`<div class="fg2-recess ${cls}" style="${part(...where)}">${img?`<img src="${img}" alt="">`:''}<small>${String(caption).replace(' +','<br>+')}</small></div><b class="fg2-tag" style="${box(bx(where[0])+bs(where[2]-where[0])/2-90,by(where[1])-26,180,44)}">${label}</b>`;
  const plate=(ready,text,act,data='',enabled=true)=>`<button type="button" class="fg2-plate ${ready?'ready':'locked'}" data-action="${act}" ${data} ${enabled?'':'disabled'} style="${box(96,1330,560,112)}"><span>${text}</span></button>`;
  function craftTab(p,state){
    const hero=state.forgeHero,slot=state.forgeSlot,rarity=state.forgeRarity,cur=worn(p,hero,slot),gate=M.craftGate(rarity),open=p.campaign.cleared>=gate,c=M.craftCost(rarity);
    const result=state.forgeResult&&p.equipment.find(g=>g.id===state.forgeResult);
    const [x0,y0,x1,y1]=SHELF,w=(x1-x0)/5;
    let html=M.CRAFT_RARITIES.map((r,i)=>{const g=M.craftGate(r),lock=p.campaign.cleared<g;return `<button type="button" class="fg2-ingot ${r===rarity?'on':''} ${lock?'locked':''}" data-action="forge:rarity" data-rarity="${r}" style="${part(x0+i*w,y0-10,x0+(i+1)*w,y1+12)}"><img src="${F}ingot-${r}.webp" alt="">${lock?`<em><img src="${F}lock.webp" alt="">${g}</em>`:''}<small>${esc(M.RARITIES[r].name)}</small></button>`;}).join('');
    if(result){const on=worn(p,hero,result.slot)?.id===result.id;
      html+=recess(LEFT,'Đang dùng',cur&&cur.id!==result.id?pic(slot,cur.rarity):pic(slot,'uncommon'),cur&&cur.id!==result.id?`${esc(M.RARITIES[cur.rarity].name)} +${cur.level}`:'Trống',cur&&cur.id!==result.id?'':'empty')+
        recess(RIGHT,'Vừa rèn',pic(result.slot,result.rarity),`${esc(M.RARITIES[result.rarity].name)} +0${result.affix?' · '+esc(M.AFFIXES[result.affix].name):''}`,'new')+
        `<p class="fg2-strip" style="${part(...STRIP)}">${changes(stats(p,hero,q=>{if(on)delete q.heroes[hero].gear[result.slot];}),stats(p,hero,q=>{q.heroes[hero].gear[result.slot]=result.id;}))}</p>`+tray(p,c)+
        (on?`<div class="fg2-done" style="${box(96,1330,560,112)}">✓ Đang dùng</div>`:plate(true,'Mặc ngay','forge:wear',`data-id="${result.id}"`))+
        `<button type="button" class="fg2-small" data-action="forge:again" style="${box(672,1346,190,82)}">Rèn tiếp</button>`;
      return html;}
    const next=stats(p,hero,q=>{q.equipment.push({id:'__forge',slot,rarity,level:0,affix:null});q.heroes[hero].gear[slot]='__forge';});
    html+=recess(LEFT,'Đang dùng',cur?pic(slot,cur.rarity):pic(slot,'uncommon'),cur?`${esc(M.RARITIES[cur.rarity].name)} +${cur.level}`:'Trống',cur?'':'empty')+`<i class="fg2-arrow" style="${box(bx(690),by(395),bs(140),bs(80))}">→</i>`+
      recess(RIGHT,'Nếu dùng',pic(slot,rarity),`${esc(M.RARITIES[rarity].name)} +0${rarity==='divine'?' · ✦':''}`,'new')+
      `<p class="fg2-strip" style="${part(...STRIP)}">${changes(M.stats(p,hero),next)}</p>`+tray(p,c);
    if(!open)return html+plate(false,`Mở sau ải ${gate}`,'forge:noop','',true)+`<button type="button" class="fg2-small gold" data-action="route:campaign" style="${box(672,1346,190,82)}">Khám Phá</button>`;
    return html+plate(affordable(p,c),'Rèn','forge:craft','',affordable(p,c));
  }
  function strengthenTab(p,state){
    const hero=state.forgeHero,g=worn(p,hero,state.forgeSlot);
    if(!g)return recess(LEFT,'Đang dùng',pic(state.forgeSlot,'uncommon'),'Trống','empty')+recess(RIGHT,'Cần món đồ',pic(state.forgeSlot,'uncommon'),'Rèn hoặc lấy từ túi','empty')+
      plate(true,'Chế tạo','forge:tab','data-index="0"')+`<button type="button" class="fg2-small" data-action="route:equipment" style="${box(672,1346,190,82)}">Chọn từ túi</button>`;
    const [x0,y0,x1,y1]=SHELF,mid=(x0+x1)/2,max=!!state.forgeMax;
    let html=[['×1',false],['Tối đa',true]].map(([t,on],i)=>`<button type="button" class="fg2-mode ${max===on?'on':''}" data-action="forge:max" data-on="${on?1:0}" style="${part(i?mid+20:x0+60,y0+40,i?x1-60:mid-20,y1-20)}">${t}</button>`).join('');
    if(g.level>=20)return html+recess(LEFT,'Đang dùng',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +20`)+recess(RIGHT,'Đã tối đa',pic(g.slot,g.rarity),'+20','new')+`<div class="fg2-done" style="${box(96,1330,560,112)}">✓ Đã tối đa</div>`;
    const plan=max?G.engine.strengthenPlan(g.id):null,to=plan&&plan.to>g.level?plan.to:g.level+1,c=plan&&plan.to>g.level?plan.cost:M.strengthenCost(g);
    html+=recess(LEFT,'Hiện tại',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +${g.level}`)+`<i class="fg2-arrow" style="${box(bx(690),by(395),bs(140),bs(80))}">→</i>`+
      recess(RIGHT,'Sau khi nâng',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +${to}`,'new')+
      `<p class="fg2-strip" style="${part(...STRIP)}">${changes(M.stats(p,hero),stats(p,hero,q=>{q.equipment.find(x=>x.id===g.id).level=to;}))}</p>`+tray(p,c,`<b>+${g.level} → +${to}</b><small>${to-g.level} cấp · trả một lần</small>`);
    return html+plate(affordable(p,c),`Nâng +${to}`,'forge:strengthen',`data-id="${g.id}" data-to="${to}"`,affordable(p,c));
  }
  function gemTab(p,state){
    const g=worn(p,state.forgeHero,state.forgeSlot),n=g?(M.SOCKETS?.[g.rarity]||0):0,[x0,y0,x1,y1]=SHELF;
    let html='';
    if(!g)html+=`<p class="fg2-note" style="${part(x0,y0+40,x1,y1)}">Ô trống · mặc một món để khảm</p>`;
    else if(!n)html+=`<p class="fg2-note" style="${part(x0,y0+40,x1,y1)}">${esc(M.RARITIES[g.rarity].name)} chưa có lỗ · từ Hiếm trở lên</p>`;
    else{const w=Math.min(250,(x1-x0)/n);html+=Array.from({length:n},(_,i)=>{const k=g.sockets?.[i],d=k&&M.gemParse(k),cx=(x0+x1)/2-(n*w)/2+i*w;
      return `<button type="button" class="fg2-socket ${k?'full':''}" data-action="gem:socket" data-gear="${g.id}" data-index="${i}" style="${part(cx+18,y0-4,cx+w-18,y1+8)}" aria-label="${k?esc(M.GEMS[d.type].name+' '+d.level):'Lỗ trống'}"><img class="fg2-ring" src="${F}socket.webp" alt="">${k?`<img src="assets/gemwoven/gems/gem-${k}.webp" alt=""><u>${ROMAN[d.level]}</u>`:'<i>+</i>'}</button>`;}).join('');}
    html+=recess(LEFT,'Món khảm',g?pic(g.slot,g.rarity):pic(state.forgeSlot,'uncommon'),g?`${esc(M.RARITIES[g.rarity].name)} +${g.level}`:'Trống',g?'':'empty')+
      recess(RIGHT,'Ghép ngọc','assets/gemwoven/gems/gem-atk-3.webp','3 viên → 1','new')+
      `<p class="fg2-strip" style="${part(...STRIP)}"><span>Chạm <b>+</b> để khảm</span></p>`;
    const bag=Object.entries(p.gems||{}).filter(([,c])=>c>0).sort(([a],[b])=>a.localeCompare(b)),[t0,t1,t2,t3]=TRAY;
    html+=`<b class="fg2-caption" style="${box(bx(t0)+bs(t2-t0)/2-100,by(t1)-20,200,34)}">Túi ngọc</b><div class="fg2-gembag" style="${part(t0+10,t1+8,t2-10,t3-8)}">${bag.length?bag.map(([k,c])=>{const d=M.gemParse(k);return `<button type="button" data-action="gem:detail" data-gem="${k}" aria-label="${esc(M.GEMS[d.type].name)} ${d.level}"><img src="assets/gemwoven/gems/gem-${k}.webp" alt=""><u>${ROMAN[d.level]}</u><b>×${c}</b></button>`;}).join(''):'<p>Chưa có ngọc · Trùm Vô Tận tầng 20+, Sân Thử Luyện</p>'}</div>`;
    return html;
  }
  function build(el,p,state){
    const tab=state.forgeTab||0,hero=state.forgeHero,list=Object.keys(p.heroes),slot=state.forgeSlot,g=worn(p,hero,slot);
    const sw=RACK.w*272/2128,step=RACK.w*322/2128;
    const preview=tab===0?pic(slot,state.forgeResult?p.equipment.find(x=>x.id===state.forgeResult)?.rarity||state.forgeRarity:state.forgeRarity):g?pic(slot,g.rarity):'';
    // The frames' pictures as absolute URLs: a url() in the stylesheet would resolve against the stylesheet.
    for(const k of ['tag','tab','action-ready','action-locked','lock'])el.style.setProperty('--fg-'+k,`url("${new URL(F+k+'.webp',document.baseURI).href}")`);
    el.innerHTML=`<div class="fg2-who" style="${box(320,298,300,60)}">${list.length>1?'<button type="button" data-action="forge:hero" data-step="-1" aria-label="Tướng trước">‹</button>':''}<img src="${file('face-'+hero)}" alt=""><b>${esc(M.HEROES[hero].name)}</b>${list.length>1?'<button type="button" data-action="forge:hero" data-step="1" aria-label="Tướng sau">›</button>':''}</div>`+
      `<img class="fg2-rack" src="${F}rack.webp" alt="" style="${box(RACK.x,RACK.y,RACK.w,RACK.h)}">`+
      SLOT_ORDER.map((s,i)=>{const w=worn(p,hero,s);return `<button type="button" class="fg2-slot ${w?'':'empty'} ${s===slot?'on':''}" data-action="forge:slot" data-slot="${s}" style="${box(RACK.x+RACK.w*108/2128+i*step,RACK.y+RACK.h*.15,sw,RACK.h*.64)}" aria-label="${esc(M.SLOTS[s])}"><img src="${w?pic(s,w.rarity):pic(s,'uncommon')}" alt="">${w?`<b>+${w.level}</b>`:''}<small>${esc(M.SLOTS[s])}</small></button>`;}).join('')+
      (preview?`<i class="fg2-glow" style="${box(300,470,340,240)}"></i><img class="fg2-preview" src="${preview}" alt="" style="${box(360,488,220,190)}">${tab===0&&!state.forgeResult?`<b class="fg2-tag small" style="${box(395,648,150,38)}">Xem trước</b>`:''}`:'')+
      `<img class="fg2-bench" src="${F}bench.webp" alt="" style="${box(BENCH.x,BENCH.y,BENCH.w,bs(994))}">`+
      [['Chế Tạo','icon-forge'],['Cường Hóa','hammer'],['Khảm Ngọc','gem']].map(([name,icon],i)=>`<button type="button" class="fg2-tab ${i===tab?'on':''}" data-action="forge:tab" data-index="${i}" style="${box(52+i*284,690,268,76)}"><img src="${icon==='gem'?'assets/gemwoven/gems/gem-atk-2.webp':file(icon)}" alt="">${name}</button>`).join('')+
      [craftTab,strengthenTab,gemTab][tab](p,state)+
      (state.forgeMessage?`<p class="fg2-msg" style="${box(96,1290,560,40)}">${esc(state.forgeMessage)}</p>`:'');
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='forge')return p;
    if(!p.heroes[state.forgeHero])state.forgeHero=p.selected;
    // Default slot: the first empty one of this hero, then the weapon; it never jumps after an action.
    if(!state.forgeSlot)state.forgeSlot=SLOT_ORDER.find(s=>!p.heroes[state.forgeHero].gear[s])||'weapon';
    if(!M.CRAFT_RARITIES.includes(state.forgeRarity))state.forgeRarity=[...M.CRAFT_RARITIES].reverse().find(r=>p.campaign.cleared>=M.craftGate(r))||'uncommon';
    const nodes=L.screens.forge.nodes.filter(n=>!/^forge\.(forge-subtitle|forge-story|forge-tab-|forge-panel|weapon-card|weapon-stars|forge-level|attack-strip|attack-preview|materials-title|forge-materials|success-rate|forge-action|slot-|rarity-|floating-sword)/.test(n.id));
    nodes.push({id:'forge.bench',kind:'content',rect:[0,0,941,1490],className:'exploration-map fg2',build:el=>build(el,p,state)});
    L.screens.forge.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(!action.startsWith('forge:'))return handle(action,el,ctx,state);
    const d=el.dataset,cmd=action.slice(6);state.forgeMessage='';
    try{
      if(cmd==='noop')return true;
      if(cmd==='tab'){state.forgeTab=+d.index;state.forgeResult=null;}
      if(cmd==='slot'){state.forgeSlot=d.slot;state.forgeResult=null;}
      if(cmd==='rarity'){state.forgeRarity=d.rarity;state.forgeResult=null;}
      if(cmd==='hero'){const list=Object.keys(G.engine.read().heroes),i=list.indexOf(state.forgeHero);state.forgeHero=list[(i+Number(d.step)+list.length)%list.length];state.forgeResult=null;}
      if(cmd==='max')state.forgeMax=d.on==='1';
      if(cmd==='craft'){const g=G.engine.craft(state.forgeSlot,state.forgeRarity);state.forgeResult=g.id;}
      if(cmd==='again')state.forgeResult=null;
      if(cmd==='wear')G.engine.equip(state.forgeHero,d.id);
      if(cmd==='strengthen'){const r=G.engine.strengthenTo(d.id,Number(d.to));state.forgeMessage=`+${r.from} → +${r.to}`;}
    }catch(e){state.forgeMessage=e.message;}
    ctx.render();return true;
  };
})();
