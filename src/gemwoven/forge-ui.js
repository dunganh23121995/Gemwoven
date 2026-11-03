/* Lò Rèn (owner 03/11: the forge did not pass; Codex design review 19). The forge serves one hero at a time:
 * - who: the hero chip under the HUD (owned heroes, default the one fighting; choosing here never changes the team);
 * - what: the hero's six gear slots, the chosen one floats over the anvil (a preview when crafting);
 * - how: three tabs in one panel — Chế Tạo (rarity ingots, the new piece against the worn one, ingredients, Rèn;
 *   the result offers "Mặc ngay"), Cường Hóa (the worn piece, ×1 or the highest level the purse reaches, the total
 *   price shown on the button, one transaction), Khảm Ngọc (the piece's sockets and the gem bag, real gem rules).
 * Rules stay in progression.js (craft, strengthenTo, strengthenPlan, socketGem, fuseGems); this file only shows them.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!G.engine?.strengthenPlan)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),tight=n=>M.compact(n,1000);
  const file=k=>A[k]?.file||'';
  const owned=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const affordable=(p,c)=>c&&Object.entries(c).every(([id,n])=>owned(p,id)>=n);
  const SLOT_ORDER=Object.keys(M.SLOTS),ROMAN=['','I','II','III','IV','V'];
  const TABS=[['Chế Tạo','icon-forge'],['Cường Hóa','hammer'],['Khảm Ngọc','gem']];
  const worn=(p,hero,slot)=>p.equipment.find(g=>g.id===p.heroes[hero]?.gear?.[slot]);
  function stats(p,hero,mutate){const q=JSON.parse(JSON.stringify(p));mutate?.(q);return M.stats(q,hero);}
  // Up to three changed stats, before → after, green or red.
  function diff(a,b){
    return [['stat-heart',a.hp,b.hp,v=>fmt(v)],['stat-attack',a.attack,b.attack,v=>'×'+v.toFixed(2)],['stat-shield',a.defense,b.defense,v=>Math.round(v*100)+'%']]
      .map(([icon,x,y,f])=>`<span class="${y>x+1e-9?'up':y<x-1e-9?'down':''}"><img src="${file(icon)}" alt="">${Math.abs(y-x)>1e-9?`${f(x)}<i>→</i>${f(y)}`:f(y)}</span>`).join('');
  }
  function cost(p,c){
    return `<div class="fg-cost">${Object.entries(c||{}).filter(([,n])=>n>0).map(([id,n])=>{const have=owned(p,id);return `<button type="button" class="fg-mat ${have>=n?'':'short'}" data-action="item:${id}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)}"><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><b>${tight(have)}/${tight(n)}</b></button>`;}).join('')}</div>`;
  }
  const gearPic=(g,slot)=>`<img src="${file(M.SLOT_ART[slot||g.slot])}" alt="">`;
  function slots(p,state){
    return `<div class="fg-slots">${SLOT_ORDER.map(slot=>{const g=worn(p,state.forgeHero,slot);return `<button type="button" class="fg-slot ${g?'':'empty'} ${state.forgeSlot===slot?'on':''}" data-action="forge:slot" data-slot="${slot}" style="--q:${g?M.RARITIES[g.rarity].color:'#8a7a5a'}" aria-label="${esc(M.SLOTS[slot])}">${gearPic(g,slot)}${g?`<b>+${g.level}</b>`:''}<small>${esc(M.SLOTS[slot])}</small></button>`;}).join('')}</div>`;
  }
  function craftTab(p,state){
    const hero=state.forgeHero,slot=state.forgeSlot,rarity=state.forgeRarity,cur=worn(p,hero,slot),gate=M.craftGate(rarity),open=p.campaign.cleared>=gate,c=M.craftCost(rarity);
    if(state.forgeResult){const g=p.equipment.find(g=>g.id===state.forgeResult);if(g){const on=worn(p,hero,g.slot)?.id===g.id;
      return `<div class="fg-result" style="--q:${M.RARITIES[g.rarity].color}">${gearPic(g)}<div><b>${esc(M.SLOTS[g.slot])} · ${esc(M.RARITIES[g.rarity].name)}</b>${g.affix?`<small>${esc(M.AFFIXES[g.affix].name)}</small>`:''}<p class="stat-chips">${diff(M.stats(p,hero),stats(p,hero,q=>{q.heroes[hero].gear[g.slot]=g.id;}))}</p></div></div>`+
        `<div class="fg-actions">${on?'<span class="fg-done">✓ Đang mặc</span>':`<button type="button" class="game-btn" data-action="forge:wear" data-id="${g.id}">Mặc ngay</button>`}<button type="button" class="game-btn secondary" data-action="forge:again">Rèn tiếp</button></div>`;}}
    const ingots=M.CRAFT_RARITIES.map(r=>{const g=M.craftGate(r),lock=p.campaign.cleared<g;return `<button type="button" class="fg-ingot ${r===rarity?'on':''} ${lock?'locked':''}" data-action="forge:rarity" data-rarity="${r}" style="--q:${M.RARITIES[r].color}" aria-label="${esc(M.RARITIES[r].name)}${lock?' · ải '+g:''}"><img src="${file('ingot')}" alt=""><small>${esc(M.RARITIES[r].name)}</small>${lock?`<em>🔒 Ải ${g}</em>`:''}</button>`;}).join('');
    const next=stats(p,hero,q=>{q.equipment.push({id:'__forge',slot,rarity,level:0,affix:null});q.heroes[hero].gear[slot]='__forge';});
    return `<div class="fg-ingots">${ingots}</div>`+
      `<div class="fg-compare"><div class="fg-piece ${cur?'':'empty'}" style="--q:${cur?M.RARITIES[cur.rarity].color:'#8a7a5a'}">${gearPic(cur,slot)}<small>${cur?`${esc(M.RARITIES[cur.rarity].name)} +${cur.level}`:'Trống'}</small></div><i>→</i><div class="fg-piece new" style="--q:${M.RARITIES[rarity].color}">${gearPic(null,slot)}<small>${esc(M.RARITIES[rarity].name)} +0${rarity==='divine'?' · ✦':''}</small></div>`+
      `<p class="stat-chips">${diff(M.stats(p,hero),next)}</p></div>`+cost(p,c)+
      `<button type="button" class="game-btn fg-go" data-action="forge:craft" ${open&&affordable(p,c)?'':'disabled'}>${open?'Rèn':'🔒 Ải '+gate}</button>`;
  }
  function strengthenTab(p,state){
    const hero=state.forgeHero,g=worn(p,hero,state.forgeSlot);
    if(!g)return `<p class="fg-empty">${gearPic(null,state.forgeSlot)}Ô trống</p><div class="fg-actions"><button type="button" class="game-btn" data-action="forge:tab" data-index="0">Chế tạo</button><button type="button" class="game-btn secondary" data-action="route:equipment">Chọn từ túi</button></div>`;
    if(g.level>=20)return `<div class="fg-result" style="--q:${M.RARITIES[g.rarity].color}">${gearPic(g)}<div><b>${esc(M.SLOTS[g.slot])} +20</b><p class="fg-done">✓ Đã tối đa</p></div></div>`;
    const max=state.forgeMax,plan=max?G.engine.strengthenPlan(g.id):{from:g.level,to:g.level+1,cost:M.strengthenCost(g)};
    const to=Math.max(plan.to,g.level+1),c=plan.to>g.level?plan.cost:M.strengthenCost(g);
    const after=stats(p,hero,q=>{q.equipment.find(x=>x.id===g.id).level=to;});
    return `<div class="fg-compare"><div class="fg-piece" style="--q:${M.RARITIES[g.rarity].color}">${gearPic(g)}<small>+${g.level} <i>→</i> +${to}</small></div><p class="stat-chips">${diff(M.stats(p,hero),after)}</p></div>`+
      `<div class="fg-mode"><button type="button" class="${max?'':'on'}" data-action="forge:max" data-on="0">×1</button><button type="button" class="${max?'on':''}" data-action="forge:max" data-on="1">Tối đa</button></div>`+cost(p,c)+
      `<button type="button" class="game-btn fg-go" data-action="forge:strengthen" data-id="${g.id}" data-to="${to}" ${affordable(p,c)?'':'disabled'}>Nâng +${to}</button>`;
  }
  function gemTab(p,state){
    const g=worn(p,state.forgeHero,state.forgeSlot),n=g?(M.SOCKETS?.[g.rarity]||0):0;
    const sockets=!g?`<p class="fg-empty">${gearPic(null,state.forgeSlot)}Ô trống</p>`:!n?`<p class="fg-empty">${gearPic(g)}Phẩm ${esc(M.RARITIES[g.rarity].name)} chưa có lỗ khảm · Hiếm trở lên</p>`:
      `<div class="fg-sockets">${gearPic(g)}${Array.from({length:n},(_,i)=>{const k=g.sockets?.[i],d=k&&M.gemParse(k);return `<button type="button" class="gem-socket ${k?'is-full':''}" data-action="gem:socket" data-gear="${g.id}" data-index="${i}" aria-label="${k?esc(M.GEMS[d.type].name+' '+d.level):'Lỗ trống'}">${k?`<img src="assets/gemwoven/gems/gem-${k}.webp" alt=""><u>${ROMAN[d.level]}</u>`:'<i>+</i>'}</button>`;}).join('')}</div><p class="fg-hint">Chạm <b>+</b> để khảm</p>`;
    const bag=Object.entries(p.gems||{}).filter(([,c])=>c>0).sort(([a],[b])=>a.localeCompare(b));
    return `<div class="fg-gems">`+sockets+(bag.length?`<p class="fg-hint">Chạm ngọc để ghép 3 → 1</p>`:'')+`<div class="fg-gembag">${bag.length?bag.map(([k,c])=>{const d=M.gemParse(k);return `<button type="button" data-action="gem:detail" data-gem="${k}" aria-label="${esc(M.GEMS[d.type].name)} ${d.level}"><img src="assets/gemwoven/gems/gem-${k}.webp" alt=""><u>${ROMAN[d.level]}</u><b>×${c}</b></button>`;}).join(''):'<p class="fg-empty small">Chưa có ngọc · Boss Vô Hạn tầng 20+, Sân Thử Luyện</p>'}</div></div>`;
  }
  function panel(el,p,state){
    const tab=state.forgeTab||0;
    el.innerHTML=`<div class="fg-tabs">${TABS.map(([name,icon],i)=>`<button type="button" class="${i===tab?'on':''}" data-action="forge:tab" data-index="${i}"><img src="${icon==='gem'?'assets/gemwoven/gems/gem-atk-2.webp':file(icon)}" alt="">${name}</button>`).join('')}</div>`+slots(p,state)+
      `<div class="fg-body">${[craftTab,strengthenTab,gemTab][tab](p,state)}</div>${state.forgeMessage?`<p class="fg-msg">${esc(state.forgeMessage)}</p>`:''}`;
  }
  function heroChip(el,p,state){
    const list=Object.keys(p.heroes),key=state.forgeHero;
    el.innerHTML=`<div class="fg-hero"><button type="button" data-action="forge:hero" data-step="-1" aria-label="Tướng trước" ${list.length<2?'disabled':''}>‹</button><img src="${file('face-'+key)}" alt=""><b>${esc(M.HEROES[key].name)}</b><button type="button" data-action="forge:hero" data-step="1" aria-label="Tướng sau" ${list.length<2?'disabled':''}>›</button></div>`;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='forge')return p;
    if(!p.heroes[state.forgeHero])state.forgeHero=p.selected;
    // Default slot: the first empty one of this hero, then the weapon; it never jumps after an action.
    if(!state.forgeSlot)state.forgeSlot=SLOT_ORDER.find(s=>!p.heroes[state.forgeHero].gear[s])||'weapon';
    if(!M.CRAFT_RARITIES.includes(state.forgeRarity))state.forgeRarity=[...M.CRAFT_RARITIES].reverse().find(r=>p.campaign.cleared>=M.craftGate(r))||'uncommon';
    let nodes=L.screens.forge.nodes.filter(n=>!/^forge\.(forge-subtitle|forge-story|forge-tab-|forge-panel|weapon-card|weapon-stars|forge-level|attack-strip|attack-preview|materials-title|forge-materials|success-rate|forge-action|slot-|rarity-)/.test(n.id));
    // What the panel works on floats over the anvil: the worn piece, or the piece about to be forged.
    const sword=nodes.find(n=>n.id==='forge.floating-sword');
    if(sword){const g=worn(p,state.forgeHero,state.forgeSlot);Object.assign(sword,{asset:M.SLOT_ART[state.forgeSlot],rect:[330,480,180,180],action:'forge:noop',className:((sword.className||'')+' fg-float q-'+((state.forgeTab||0)===0?state.forgeRarity:g?.rarity||'none')).trim()});}
    nodes.push({id:'forge.hero',kind:'content',rect:[20,262,300,108],className:'exploration-map fg-hero-host',build:el=>heroChip(el,p,state)});
    nodes.push({id:'forge.board',kind:'content',rect:[20,740,901,752],className:'crafted-panel fg-panel',backgroundAsset:'panel-parchment',build:el=>panel(el,p,state)});
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
      if(cmd==='rarity'){state.forgeRarity=d.rarity;}
      if(cmd==='hero'){const list=Object.keys(G.engine.read().heroes),i=list.indexOf(state.forgeHero);state.forgeHero=list[(i+Number(d.step)+list.length)%list.length];state.forgeResult=null;}
      if(cmd==='max')state.forgeMax=d.on==='1';
      if(cmd==='craft'){const g=G.engine.craft(state.forgeSlot,state.forgeRarity);state.forgeResult=g.id;}
      if(cmd==='again')state.forgeResult=null;
      if(cmd==='wear'){G.engine.equip(state.forgeHero,d.id);}
      if(cmd==='strengthen'){const r=G.engine.strengthenTo(d.id,Number(d.to));state.forgeMessage=`+${r.from} → +${r.to}`;}
    }catch(e){state.forgeMessage=e.message;}
    ctx.render();return true;
  };
})();
