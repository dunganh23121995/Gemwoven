/* Lò Rèn — "Bàn rèn" (owner 03/11: the first rebuild did not pass as a design; Codex art direction review 21 and
 * the approved mockup assets/gemwoven/raw/forge-mockup/mockup-1.png). The interface is made of objects in the smithy,
 * all drawn by Codex (assets/gemwoven/forge): a tool rack with the hero's six worn slots, the piece floating over the
 * anvil, four wooden tabs, one workbench (ingot shelf, two display recesses, a parchment strip, an ingredient tray)
 * and a hammer plate for the one action. Words and numbers are the HTML layer on top of the art.
 * Reading order: for whom (hero badge) → which piece (rack) → what it gives (recesses + strip) → what it costs (tray)
 * → do it (hammer plate). Rules stay in progression.js (craft, strengthenTo, strengthenPlan, socketGem, fuseGems, upgradeRarity).
 * Boxes below are in the 941x1672 stage; the bench art is 1524x994 and its parts are placed by its own pixels.
 * Readability pass (full review 3): the bench sits 24 units lower so the piece on the pedestal can stand larger.
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
  const BENCH={x:20,y:766,w:900,src:1524},bx=v=>BENCH.x+v*BENCH.w/BENCH.src,by=v=>BENCH.y+v*BENCH.w/BENCH.src,bs=v=>v*BENCH.w/BENCH.src;
  const part=(x0,y0,x1,y1)=>box(bx(x0),by(y0),bs(x1-x0),bs(y1-y0));
  const SHELF=[150,75,1370,262],LEFT=[250,335,675,530],RIGHT=[850,335,1275,530],STRIP=[360,555,1160,620],TRAY=[175,680,1352,840];
  const RACK={x:164,y:356,w:613,h:126};
  function stats(p,hero,mutate){const q=JSON.parse(JSON.stringify(p));mutate?.(q);return M.stats(q,hero);}
  // The stats that change, before → after (the strip shows at most two).
  function changes(a,b,max=2){
    return [['stat-attack','Công',a.attack,b.attack,v=>'×'+v.toFixed(2).replace('.',',')],['stat-heart','HP',a.hp,b.hp,v=>M.compact(v,10000)],['stat-shield','Thủ',a.defense,b.defense,v=>Math.round(v*100)+'%']]
      .filter(([, ,x,y])=>Math.abs(y-x)>1e-9).slice(0,max)
      .map(([icon,name,x,y,f])=>`<span class="${y>x?'up':'down'}"><img src="${file(icon)}" alt="">${name} ${f(x)} <i>→</i> <b>${f(y)}</b></span>`).join('')||'<span>Không đổi chỉ số</span>';
  }
  function tray(p,c,note='',cut=[]){
    const rows=Object.entries(c||{}).filter(([,n])=>n>0),[x0,y0,x1,y1]=TRAY,w=(x1-x0)/Math.max(5,rows.length);
    const spare=5-rows.length;
    // Readability pass (full review 3): each compartment shows what it needs, icon beside the number, and one
    // status line under it, ✓ or 'Thiếu N' on a red-lit compartment; what is held is one tap away (item detail).
    return `<b class="fg2-caption" style="${box(bx(x0)+bs(x1-x0)/2-70,by(y0)-22,140,34)}">Cần</b>`+(spare>0&&note?`<p class="fg2-traynote" style="${part(x0+rows.length*w,y0,x1,y1)}">${note}</p>`:'')+rows.map(([id,n],i)=>{const have=owned(p,id);
      return `<button type="button" class="fg2-mat fg3-mat ${have>=n?'ok':'short'}${tight(n).length>5||(have<n&&tight(n-have).length>4)?' long':''}${cut.includes(id)?' cut':''}" data-action="item:${id}" style="${part(x0+i*w,y0,x0+(i+1)*w,y1)}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)} · có ${tight(have)} · cần ${tight(n)}"><span><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><b>${tight(n)}</b></span>${have>=n?'<i class="ok">✓ Đủ</i>':`<i>Thiếu ${tight(n-have)}</i>`}</button>`;}).join('');
  }
  // Nâng Phẩm to Thần: the five drawn compartments keep gold → essence; thần thạch rides on a leather tag at the right
  // shoulder of the tray (Codex: no sixth squeezed compartment), lit red while short.
  function trayUp(p,c,cut){const {divineOre=0,...rest}=c;if(!divineOre)return tray(p,c,'',cut);const [,y0,x1]=TRAY,have=owned(p,'divineOre');
    return tray(p,rest,'',cut)+`<button type="button" class="fg2-caption fg4-extra ${have>=divineOre?'ok':'short'}" data-action="item:divineOre" style="${box(bx(x1)-200,by(y0)-26,190,42)}" aria-label="${esc(M.RESOURCES.divineOre[0])} · có ${have} · cần ${divineOre}"><img src="${file(M.RESOURCES.divineOre[1])}" alt="">${divineOre}<i>${have>=divineOre?'✓':`Thiếu ${divineOre-have}`}</i></button>`;}
  const fit=c=>{const n=String(c).split(' +')[0].length;return n>14?' xlong':n>7?' long':'';};
  // Full review 5 (Codex 8.3: "tăng phân cấp giữa món đang dùng → món sau rèn → nguyên liệu thiếu"): the left recess
  // (what is worn now) steps back, the right one (the result) carries the light.
  const recess=(where,label,img,caption,cls='')=>{const k=`${cls}${where===LEFT?' cur':''}`;return `<div class="fg2-recess ${k}${fit(caption)}" style="${part(...where)}">${img?`<img src="${img}" alt="">`:''}<small>${String(caption).replace(' +','<br>+')}</small></div><b class="fg2-tag ${k}" style="${box(bx(where[0])+bs(where[2]-where[0])/2-90,by(where[1])-26,180,44)}">${label}</b>`;};
  // How many ingredients are short (the locked plate names the count; each short compartment is lit red).
  const shortCount=(p,c)=>Object.entries(c||{}).filter(([id,n])=>n>0&&owned(p,id)<n).length;
  // The action plate: centred and wider when it stands alone, beside a small button otherwise; short of materials
  // it says so on the plate itself.
  const plate=(ready,text,act,data='',enabled=true,alone=false)=>`<button type="button" class="fg2-plate ${ready?'ready':'locked'}${alone?' alone':''}" data-action="${act}" ${data} ${enabled?'':'disabled'} style="${alone?box(130,1340,680,128):box(96,1354,560,112)}"><span>${text}</span></button>`;
  function craftTab(p,state){
    const hero=state.forgeHero,slot=state.forgeSlot,rarity=state.forgeRarity,cur=worn(p,hero,slot),gate=M.craftGate(rarity),open=p.campaign.cleared>=gate,c=M.craftCost(rarity);
    const result=state.forgeResult&&p.equipment.find(g=>g.id===state.forgeResult);
    const [x0,y0,x1,y1]=SHELF,w=(x1-x0)/5;
    let html=M.CRAFT_RARITIES.map((r,i)=>{const g=M.craftGate(r),lock=p.campaign.cleared<g;return `<button type="button" class="fg2-ingot ${r===rarity?'on':''} ${lock?'locked':''}" data-action="forge:rarity" data-rarity="${r}" style="${part(x0+i*w,y0-10,x0+(i+1)*w,y1+12)}"><img src="${F}ingot-${r}.webp" alt="">${lock?`<em><img src="${F}lock.webp" alt="">${g}</em>`:''}<small>${esc(M.RARITIES[r].name)}</small></button>`;}).join('');
    if(result){const on=worn(p,hero,result.slot)?.id===result.id;
      html+=recess(LEFT,'Đang dùng',cur&&cur.id!==result.id?pic(slot,cur.rarity):pic(slot,'uncommon'),cur&&cur.id!==result.id?`${esc(M.RARITIES[cur.rarity].name)} +${cur.level}`:'Trống',cur&&cur.id!==result.id?'':'empty')+
        recess(RIGHT,'Vừa rèn',pic(result.slot,result.rarity),`${esc(M.RARITIES[result.rarity].name)} +0${result.affix?' · '+esc(M.AFFIXES[result.affix].name):''}`,'new')+
        `<p class="fg2-strip" style="${part(...STRIP)}">${changes(stats(p,hero,q=>{if(on)delete q.heroes[hero].gear[result.slot];}),stats(p,hero,q=>{q.heroes[hero].gear[result.slot]=result.id;}))}</p>`+tray(p,c)+
        (on?`<div class="fg2-done" style="${box(96,1354,560,112)}">✓ Đang dùng</div>`:plate(true,'Mặc ngay','forge:wear',`data-id="${result.id}"`))+
        `<button type="button" class="fg2-small" data-action="forge:again" style="${box(672,1370,190,82)}">Rèn tiếp</button>`;
      return html;}
    const next=stats(p,hero,q=>{q.equipment.push({id:'__forge',slot,rarity,level:0,affix:null});q.heroes[hero].gear[slot]='__forge';});
    html+=recess(LEFT,'Đang dùng',cur?pic(slot,cur.rarity):pic(slot,'uncommon'),cur?`${esc(M.RARITIES[cur.rarity].name)} +${cur.level}`:'Trống',cur?'':'empty')+`<i class="fg2-arrow" style="${box(bx(690),by(395),bs(140),bs(80))}">→</i>`+
      recess(RIGHT,'Sau rèn',pic(slot,rarity),`${esc(M.RARITIES[rarity].name)} +0${rarity==='divine'?' · ✦':''}`,'new')+
      `<p class="fg2-strip" style="${part(...STRIP)}">${changes(M.stats(p,hero),next)}</p>`+tray(p,c);
    if(!open)return html+plate(false,`Mở sau ải ${gate}`,'forge:noop','',true)+`<button type="button" class="fg2-small gold" data-action="route:campaign" style="${box(672,1370,190,82)}">Khám Phá</button>`;
    return html+(affordable(p,c)?plate(true,'Rèn','forge:craft','',true,true):plate(false,`Thiếu ${shortCount(p,c)} nguyên liệu`,'forge:craft','',false,true));
  }
  function strengthenTab(p,state){
    const hero=state.forgeHero,g=worn(p,hero,state.forgeSlot);
    if(!g)return recess(LEFT,'Đang dùng',pic(state.forgeSlot,'uncommon'),'Trống','empty')+recess(RIGHT,'Cần món đồ',pic(state.forgeSlot,'uncommon'),'Rèn hoặc lấy từ túi','empty')+
      plate(true,'Chế tạo','forge:tab','data-index="0"')+`<button type="button" class="fg2-small" data-action="route:equipment" style="${box(672,1370,190,82)}">Chọn từ túi</button>`;
    const [x0,y0,x1,y1]=SHELF,mid=(x0+x1)/2,max=!!state.forgeMax;
    let html=[['×1',false],['Tối đa',true]].map(([t,on],i)=>`<button type="button" class="fg2-mode ${max===on?'on':''}" data-action="forge:max" data-on="${on?1:0}" style="${part(i?mid+20:x0+60,y0+40,i?x1-60:mid-20,y1-20)}">${t}</button>`).join('');
    if(g.level>=20)return html+recess(LEFT,'Đang dùng',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +20`)+recess(RIGHT,'Đã tối đa',pic(g.slot,g.rarity),'+20','new')+`<div class="fg2-done" style="${box(96,1354,560,112)}">✓ Đã tối đa</div>`;
    const plan=max?G.engine.strengthenPlan(g.id):null,to=plan&&plan.to>g.level?plan.to:g.level+1,c=plan&&plan.to>g.level?plan.cost:M.strengthenCost(g);
    html+=recess(LEFT,'Hiện tại',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +${g.level}`)+`<i class="fg2-arrow" style="${box(bx(690),by(395),bs(140),bs(80))}">→</i>`+
      recess(RIGHT,'Sau khi nâng',pic(g.slot,g.rarity),`${esc(M.RARITIES[g.rarity].name)} +${to}`,'new')+
      `<p class="fg2-strip" style="${part(...STRIP)}">${changes(M.stats(p,hero),stats(p,hero,q=>{q.equipment.find(x=>x.id===g.id).level=to;}))}</p>`+tray(p,c,`<b>+${g.level} → +${to}</b><small>${to-g.level} cấp · trả một lần</small>`);
    return html+(affordable(p,c)?plate(true,`Nâng +${to}`,'forge:strengthen',`data-id="${g.id}" data-to="${to}"`,true,true):plate(false,`Thiếu ${shortCount(p,c)} nguyên liệu`,'forge:strengthen',`data-id="${g.id}" data-to="${to}"`,false,true));
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
  // Nâng Phẩm (Claude + Codex 04/11, mockups assets/gemwoven/raw/forge-rarity/mockup-1..3.png, 8,6 / 8,8 / 8,7): the
  // worn piece goes one rarity up and always succeeds, so no percentage anywhere. Both recesses carry the same +N and
  // the same gems in the same places; the new rarity's empty sockets glow with "Mới". The shelf holds the optional
  // Đồ hiến: three drawn sockets for 0–3 spare pieces of the same rarity (chosen by the player, never pre-filled), the
  // cut they give (ore, wood, cloth) and what they refund (70% of their strengthening, their gems) on a drawn plaque.
  const ingot=(slot,r)=>r==='common'?pic(slot,'common'):`${F}ingot-${r}.webp`;
  const sockets=(g,rarity,had)=>{const n=M.SOCKETS[rarity]||0;if(!n)return '';const fresh=had!=null;
    return `<span class="fg4-sockets">${Array.from({length:n},(_,i)=>{const k=g.sockets?.[i],d=k&&M.gemParse(k),isNew=fresh&&i>=had;
      return `<i class="${k?'full':''}${isNew?' new':''}"><img class="ring" src="${F}socket.webp" alt="">${k?`<img src="assets/gemwoven/gems/gem-${k}.webp" alt="${esc(M.GEMS[d.type].name)}">`:''}${isNew?'<u>Mới</u>':''}</i>`;}).join('')}</span>`;};
  const upRecess=(where,label,g,rarity,cls,had=null)=>`<div class="fg2-recess fg4-recess ${cls}" style="${part(...where)};--rc:${M.RARITIES[rarity].color}"><span class="fg4-pic"><img src="${pic(g.slot,rarity)}" alt=""><em>+${g.level}</em></span><span class="fg4-cap${M.RARITIES[rarity].name.length>7?' long':''}"><b>${esc(M.RARITIES[rarity].name)}</b>${sockets(g,rarity,had)}</span></div>`+
    `<b class="fg2-tag ${cls}" style="${box(bx(where[0])+bs(where[2]-where[0])/2-90,by(where[1])-26,180,44)}">${label}</b>`;
  const plaque=(slot,x,r,cls='')=>{const [,y0,,y1]=SHELF;return `<div class="fg4-plaque ${cls}" style="${part(x,y0+6,x+470,y1-6)}"><img src="${ingot(slot,r)}" alt=""><b>${esc(M.RARITIES[r].name)}</b></div>`;};
  const arrow=()=>`<i class="fg2-arrow" style="${box(bx(690),by(395),bs(140),bs(80))}">→</i>`;
  const icon=id=>`<img src="${file(M.RESOURCES[id]?.[1]||id)}" alt="${esc(M.RESOURCES[id]?.[0]||id)}">`;
  const gemCount=g=>(g.sockets||[]).filter(Boolean).length;
  // What the sacrificed pieces give back, as icons: gold, ore, gems.
  const refundRow=(r,gems)=>[r.gold?`<span>${icon('gold')}${tight(r.gold)}</span>`:'',r.ore?`<span>${icon('ore')}${tight(r.ore)}</span>`:'',gems?`<span><img src="assets/gemwoven/gems/gem-atk-2.webp" alt="Ngọc">${gems}</span>`:''].join('');
  const fodderTile=(g,extra='')=>`<span class="fg4-tile"><img class="frame" src="${F}fodder-slot.webp" alt=""><img src="${pic(g.slot,g.rarity)}" alt="${esc(M.SLOTS[g.slot]+' '+M.RARITIES[g.rarity].name)}"><em>+${g.level}</em>${gemCount(g)?`<s><img src="assets/gemwoven/gems/gem-atk-2.webp" alt="">${gemCount(g)}</s>`:''}${extra}</span>`;
  // The shelf: three sacrifice sockets, then the cut and the refund on the plaque.
  function fodderShelf(pre){
    const [x0,y0,x1,y1]=SHELF,size=176,top=y0+(y1-y0-size)/2,chosen=pre.fodder,none=!pre.candidates.length;
    let html=[0,1,2].map(i=>{const g=chosen[i],x=x0+16+i*(size+18);
      return g?`<button type="button" class="fg4-slot full" data-action="forge:unfodder" data-id="${g.id}" style="${part(x,top,x+size,top+size)}" aria-label="Bỏ ${esc(M.SLOTS[g.slot])} +${g.level}">${fodderTile(g,'<b class="x">×</b>')}</button>`
        :`<button type="button" class="fg4-slot${none?' none':''}" data-action="forge:fodder" style="${part(x,top,x+size,top+size)}" ${none?'disabled':''} aria-label="Thêm đồ hiến"><img class="frame" src="${F}fodder-slot.webp" alt=""><i>+</i></button>`;}).join('');
    const ix=x0+16+3*(size+18)+10,cut=['ore','wood','cloth'].map(icon).join('');
    html+=`<div class="fg4-info${chosen.length?' on':''}" style="${part(ix,y0+4,x1-10,y1-4)}"><b>${chosen.length?`${chosen.length} món · −${pre.cut}%`:none?'Không có đồ cùng phẩm':'Đồ hiến · −20% mỗi món'}</b>`+
      (chosen.length&&(pre.refund.gold||pre.refund.ore||pre.gems)?`<p class="fg4-refund"><i>↩</i>${refundRow(pre.refund,pre.gems)}</p>`:`<p class="fg4-refund cut"><i>−</i>${cut}</p>`)+`</div>`;
    return html;
  }
  function rarityTab(p,state){
    const hero=state.forgeHero,g=worn(p,hero,state.forgeSlot);
    if(!g)return recess(LEFT,'Đang dùng',pic(state.forgeSlot,'uncommon'),'Trống','empty')+recess(RIGHT,'Cần món đồ',pic(state.forgeSlot,'uncommon'),'Rèn hoặc lấy từ túi','empty')+
      plate(true,'Chế tạo','forge:tab','data-index="0"')+`<button type="button" class="fg2-small" data-action="route:equipment" style="${box(672,1370,190,82)}">Chọn từ túi</button>`;
    const [x0,y0,x1,y1]=SHELF,mid=(x0+x1)/2,done=state.forgeUp&&state.forgeUp.id===g.id?state.forgeUp:null;
    if(done){const before={...g,rarity:done.from};
      return (done.consumed?`<div class="fg4-info on done" style="${part(mid-330,y0+4,mid+330,y1-4)}"><b>Đã hiến ${done.consumed} món</b>${done.refund.gold||done.refund.ore||done.gems?`<p class="fg4-refund"><i>↩</i>${refundRow(done.refund,done.gems)}</p>`:''}</div>`:plaque(g.slot,mid-235,g.rarity,'on'))+
        upRecess(LEFT,'Trước',before,done.from,'cur keep')+arrow()+upRecess(RIGHT,'Vừa nâng',g,g.rarity,'new done',M.SOCKETS[done.from]||0)+
        `<p class="fg2-strip${g.affix&&g.rarity==='divine'?' fg4-tight':''}" style="${part(...STRIP)}">${changes(stats(p,hero,q=>{q.equipment.find(x=>x.id===g.id).rarity=done.from;}),M.stats(p,hero),g.affix&&g.rarity==='divine'?1:2)}${g.affix&&g.rarity==='divine'?`<span class="fg4-affix">✦ ${esc(M.AFFIXES[g.affix].name)}</span>`:''}</p>`+
        tray(p,{},`<b>${esc(M.RARITIES[done.from].name)} → ${esc(M.RARITIES[g.rarity].name)}</b><small>Giữ +${g.level}${gemCount(g)?' · giữ ngọc':''}</small>`)+plate(true,'Tiếp tục','forge:upnext','',true,true);}
    const pre=G.engine.upgradeRarityPreview(g.id,state.forgeFodder||[]);
    if(!pre||pre.max)return plaque(g.slot,mid-235,g.rarity,'on')+upRecess(LEFT,'Hiện tại',g,g.rarity,'cur keep')+arrow()+upRecess(RIGHT,'Cao nhất',g,g.rarity,'new')+`<div class="fg2-done" style="${box(130,1340,680,128)}">✓ Phẩm cao nhất</div>`;
    if(pre.signature)return plaque(g.slot,mid-235,g.rarity,'on')+upRecess(LEFT,'Hiện tại',g,g.rarity,'cur keep')+`<p class="fg2-note fg4-note" style="${part(...RIGHT)}">Vũ khí bản mệnh<br>nâng riêng</p>`;
    state.forgeFodder=pre.fodder.map(f=>f.id);
    const to=pre.to,c=pre.cost,cut=Object.keys(c).filter(k=>c[k]<pre.base[k]);
    const html=fodderShelf(pre)+upRecess(LEFT,'Hiện tại',g,g.rarity,'cur keep')+arrow()+upRecess(RIGHT,'Sau nâng',g,to,'new',M.SOCKETS[g.rarity]||0)+
      `<p class="fg2-strip${pre.affix?' fg4-tight':''}" style="${part(...STRIP)}">${changes(M.stats(p,hero),stats(p,hero,q=>{q.equipment.find(x=>x.id===g.id).rarity=to;}),pre.affix?1:2)}${pre.affix?'<span class="fg4-affix">✦ Thuộc tính</span>':''}</p>`+trayUp(p,c,cut);
    if(!pre.open)return html+plate(false,`Mở sau ải ${pre.gate}`,'forge:noop','',true)+`<button type="button" class="fg2-small gold" data-action="route:campaign" style="${box(672,1370,190,82)}">Khám Phá</button>`;
    return html+(pre.affordable?plate(true,`Nâng lên ${esc(M.RARITIES[to].name)}`,'forge:rarityup',`data-id="${g.id}"`,true,true):plate(false,`Thiếu ${shortCount(p,c)} nguyên liệu`,'forge:rarityup',`data-id="${g.id}"`,false,true));
  }
  // Chọn đồ hiến: only valid pieces (same rarity, not worn, not locked, not signature, not the piece itself), up to 3.
  function fodderDialog(ctx,state,gearId){
    const pre=G.engine.upgradeRarityPreview(gearId,state.forgeFodder||[]);if(!pre||!pre.candidates)return;let pick=pre.fodder.map(f=>f.id);
    const modal=window.GemwovenUI.makeDialog('forge-fodder','Chọn đồ hiến','growth-dialog fg4-dialog');
    modal.body.innerHTML=`<p class="fg4-count"></p><div class="fg4-grid">${pre.candidates.map(g=>`<button type="button" data-id="${g.id}" aria-label="${esc(M.SLOTS[g.slot])} +${g.level}">${fodderTile(g,'<b class="ok">✓</b>')}<small>${esc(M.SLOTS[g.slot])}</small></button>`).join('')}</div>`;
    const count=modal.body.querySelector('.fg4-count'),sync=()=>{count.innerHTML=`Đã chọn <b>${pick.length}/3</b>`;modal.body.querySelectorAll('[data-id]').forEach(b=>{const on=pick.includes(b.dataset.id);b.classList.toggle('on',on);b.disabled=!on&&pick.length>=3;});};
    modal.body.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;pick=pick.includes(id)?pick.filter(x=>x!==id):pick.length<3?[...pick,id]:pick;sync();});
    const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent='Xong';go.onclick=()=>{state.forgeFodder=pick;modal.close();ctx.render();};
    modal.actions.append(go);sync();modal.present();
  }
  // Tiêu hao N món?: the pieces that go, what comes back, then the upgrade.
  function confirmDialog(ctx,state,gearId){
    const pre=G.engine.upgradeRarityPreview(gearId,state.forgeFodder||[]);if(!pre)return;
    const modal=window.GemwovenUI.makeDialog('forge-fodder-ok',`Tiêu hao ${pre.fodder.length} món?`,'growth-dialog fg4-dialog');
    modal.body.innerHTML=`<div class="fg4-grid confirm">${pre.fodder.map(g=>`<span>${fodderTile(g)}</span>`).join('')}</div>`+
      (pre.refund.gold||pre.refund.ore||pre.gems?`<p class="fg4-back"><b>Hoàn trả</b><span class="fg4-refund"><i>↩</i>${refundRow(pre.refund,pre.gems)}</span></p>`:'');
    const no=document.createElement('button');no.type='button';no.className='gw-btn secondary';no.textContent='Hủy';no.onclick=()=>modal.close();
    const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent='Xác nhận nâng phẩm';
    go.onclick=()=>{modal.close();upgrade(state,gearId);ctx.render();};modal.actions.append(no,go);modal.present();
  }
  function upgrade(state,gearId){
    try{const ids=state.forgeFodder||[],pre=G.engine.upgradeRarityPreview(gearId,ids),r=G.engine.upgradeRarity(gearId,ids);state.forgeUp={id:gearId,from:r.from,consumed:r.consumed,refund:r.refund||{},gems:pre.gems||0};state.forgeFodder=[];}
    catch(e){state.forgeMessage=e.message;}
  }
  function build(el,p,state){
    const tab=state.forgeTab||0,hero=state.forgeHero,list=Object.keys(p.heroes),slot=state.forgeSlot,g=worn(p,hero,slot);
    const sw=RACK.w*272/2128,step=RACK.w*322/2128;
    const up=tab===3&&g&&!g.signature&&!(state.forgeUp&&state.forgeUp.id===g.id)?M.nextRarity(g.rarity):null;
    const preview=tab===0?pic(slot,state.forgeResult?p.equipment.find(x=>x.id===state.forgeResult)?.rarity||state.forgeRarity:state.forgeRarity):g?pic(slot,up||g.rarity):'';
    // The frames' pictures as absolute URLs: a url() in the stylesheet would resolve against the stylesheet.
    for(const k of ['tag','tab','action-ready','action-locked','lock','plaque'])el.style.setProperty('--fg-'+k,`url("${new URL(F+k+'.webp',document.baseURI).href}")`);document.documentElement.style.setProperty('--fg-plaque-abs',`url("${new URL(F+'plaque.webp',document.baseURI).href}")`);
    el.innerHTML=`<div class="fg2-who" style="${box(320,298,300,60)}">${list.length>1?'<button type="button" data-action="forge:hero" data-step="-1" aria-label="Tướng trước">‹</button>':''}<img src="${file('face-'+hero)}" alt=""><b>${esc(M.HEROES[hero].name)}</b>${list.length>1?'<button type="button" data-action="forge:hero" data-step="1" aria-label="Tướng sau">›</button>':''}</div>`+
      `<img class="fg2-rack" src="${F}rack.webp" alt="" style="${box(RACK.x,RACK.y,RACK.w,RACK.h)}">`+
      SLOT_ORDER.map((s,i)=>{const w=worn(p,hero,s);return `<button type="button" class="fg2-slot ${w?'':'empty'} ${s===slot?'on':''}" data-action="forge:slot" data-slot="${s}" style="${box(RACK.x+RACK.w*108/2128+i*step,RACK.y+RACK.h*.15,sw,RACK.h*.64)}" aria-label="${esc(M.SLOTS[s])}"><img src="${w?pic(s,w.rarity):pic(s,'uncommon')}" alt="">${w?`<b>+${w.level}</b>`:''}<small>${esc(M.SLOTS[s])}</small></button>`;}).join('')+
      (preview?`<i class="fg2-glow${tab===3?' soft':''}" style="${box(250,420,440,300)}"></i><img class="fg2-pedestal" src="${F}pedestal.webp" alt="" style="${box(300,640,340,158)}"><img class="fg2-preview" src="${preview}" alt="" style="${box(350,480,240,240)}">${(tab===0&&!state.forgeResult)||up?`<b class="fg2-tag small" style="${box(395,676,150,38)}">Xem trước</b>`:''}`:'')+
      `<img class="fg2-bench" src="${F}bench.webp" alt="" style="${box(BENCH.x,BENCH.y,BENCH.w,bs(994))}">`+
      [['Chế Tạo',file('icon-forge')],['Cường Hóa',file('hammer')],['Khảm Ngọc','assets/gemwoven/gems/gem-atk-2.webp'],['Nâng Phẩm',F+'rarityup-icon.webp']].map(([name,icon],i)=>`<button type="button" class="fg2-tab fg4-tab ${i===tab?'on':''}" data-action="forge:tab" data-index="${i}" style="${box(30+i*222,714,214,76)}"><img src="${icon}" alt="">${name}</button>`).join('')+
      [craftTab,strengthenTab,gemTab,rarityTab][tab](p,state)+
      (state.forgeMessage?`<p class="fg2-msg" style="${box(96,1312,560,40)}">${esc(state.forgeMessage)}</p>`:'');
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
      if(cmd==='tab'){state.forgeTab=+d.index;state.forgeResult=null;state.forgeUp=null;state.forgeFodder=[];}
      if(cmd==='slot'){state.forgeSlot=d.slot;state.forgeResult=null;state.forgeUp=null;state.forgeFodder=[];}
      if(cmd==='rarity'){state.forgeRarity=d.rarity;state.forgeResult=null;}
      if(cmd==='hero'){const list=Object.keys(G.engine.read().heroes),i=list.indexOf(state.forgeHero);state.forgeHero=list[(i+Number(d.step)+list.length)%list.length];state.forgeResult=null;state.forgeUp=null;state.forgeFodder=[];}
      if(cmd==='max')state.forgeMax=d.on==='1';
      if(cmd==='craft'){const g=G.engine.craft(state.forgeSlot,state.forgeRarity);state.forgeResult=g.id;}
      if(cmd==='again')state.forgeResult=null;
      if(cmd==='wear')G.engine.equip(state.forgeHero,d.id);
      if(cmd==='rarityup'){if((state.forgeFodder||[]).length){confirmDialog(ctx,state,d.id);return true;}upgrade(state,d.id);}
      if(cmd==='fodder'){const g=worn(G.engine.read(),state.forgeHero,state.forgeSlot);if(g)fodderDialog(ctx,state,g.id);return true;}
      if(cmd==='unfodder')state.forgeFodder=(state.forgeFodder||[]).filter(x=>x!==d.id);
      if(cmd==='upnext')state.forgeUp=null;
      if(cmd==='strengthen'){const r=G.engine.strengthenTo(d.id,Number(d.to));state.forgeMessage=`+${r.from} → +${r.to}`;}
    }catch(e){state.forgeMessage=e.message;}
    ctx.render();return true;
  };
})();
