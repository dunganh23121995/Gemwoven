/* Equipment stays in the illustrated hero scene, including selection and costs. */
(()=>{
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  L.order=L.order.filter(key=>key!=='equipment');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n).toLocaleString('vi-VN');
  const art=(key,cls='')=>`<img class="${cls}" src="${esc((A[key]||A['crest']).file)}" alt="" draggable="false">`;
  function node(id,label,rect,action,data,asset,icon){const key='upgrade.'+id;C[key]=label;return {id:key,text:key,kind:'button',rect,action,data,asset:asset||'inventory-slot',fit:'fill',icon,iconRect:[21,4,68,68],labelRect:[0,74,110,36],size:27,tone:'gold',className:'hero-gear-slot'};}
  const b=(label,action,data={},disabled=false)=>`<button class="game-btn" data-action="outfit:${action}" ${Object.entries(data).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')} ${disabled?'disabled':''}>${esc(label)}</button>`;
  const cost=(p,c)=>Object.entries(c||{}).map(([id,n])=>`<span class="${(p.wallet[id]??p.materials[id]??0)>=n?'':'short'}">${art(M.RESOURCES[id][1])}${fmt(n)}</span>`).join('');
  const afford=(p,c)=>c&&Object.entries(c).every(([id,n])=>(p.wallet[id]??p.materials[id]??0)>=n);
  function picker(el,p,state){
    const hero=state.hero,h=p.heroes[hero],slot=state.outfitSlot;
    if(slot==='relic'){
      const r=h.relic,next=r.evolution<5?M.relicEvolveCost(r):null,training=r.level<Math.min(100,r.evolution*20)?M.relicLevelCost(r):null;
      el.innerHTML=`<header><h2>${M.RELICS[hero]}</h2><button type="button" class="gw-close" data-action="outfit:close" aria-label="Đóng">×</button></header><div class="relic-forms">${[1,2,3,4,5].map(i=>`<div class="${i===r.evolution?'active':i>r.evolution?'unreached':''}">${art(`relic-${hero}-${i}`)}<small>Dạng ${i}</small></div>`).join('')}</div><p class="outfit-summary">Cấp ${r.level}/${r.evolution*20} · HP và Công +${(M.relicBonus(r)*100).toFixed(2).replace('.',',')}%</p><div class="relic-controls"><div><b>Nâng cấp</b><div class="outfit-cost">${training?cost(p,training):'Đạt giới hạn dạng'}</div>${b('Nâng cấp','train-relic',{},!afford(p,training))}</div><div><b>Tiến hóa · Dạng ${r.evolution}/5</b><div class="outfit-cost">${next?cost(p,next):'Đã đạt dạng cuối'}</div>${b('Tiến hóa','evolve-relic',{},!next||r.level<r.evolution*20||h.level<r.evolution*50||!afford(p,next))}</div></div><p class="outfit-message" role="status">${esc(state.outfitMessage|| (next?`Dạng kế: bảo bối cấp ${r.evolution*20}, tướng cấp ${r.evolution*50}. Mỗi dạng mở thêm 20 cấp.`:'Dạng cuối đã thức tỉnh.'))}</p>`;
      return;
    }
    const gears=p.equipment.filter(g=>g.slot===slot),selected=gears.find(g=>g.id===state.outfitItem)||gears.find(g=>g.id===h.gear[slot])||gears[0];
    state.outfitItem=selected?.id;
    el.innerHTML=`<header><h2>${M.SLOTS[slot]}</h2><button type="button" class="game-btn outfit-best" data-action="gear:best" data-hero="${esc(hero)}">Mặc tốt nhất</button><button type="button" class="gw-close" data-action="outfit:close" aria-label="Đóng">×</button></header><div class="outfit-items">${gears.length?gears.map(g=>`<button data-action="outfit:item" data-id="${esc(g.id)}" class="outfit-piece ${g.id===selected?.id?'active':''}" style="--rarity:${M.RARITIES[g.rarity].color};background-image:url('${A['inventory-slot'].file}')" aria-label="${M.RARITIES[g.rarity].name} ${M.SLOTS[slot]} +${g.level}">${art(M.SLOT_ART[slot])}<span>+${g.level}</span>${h.gear[slot]===g.id?'<small>Đang dùng</small>':''}</button>`).join(''):'<p class="empty-outfit">Chưa có đồ trong ô này.<br>Tìm qua triệu hồi hoặc chế tạo tại lò rèn.</p>'}</div><div class="outfit-detail">${selected?detail(p,h,selected):'<p>Trang bị cùng loại dùng được cho mọi tướng.</p>'}</div><p class="outfit-message" role="status">${esc(state.outfitMessage||(selected?'':'Chọn một món để xem chỉ số và nguyên liệu cường hóa.'))}</p>`;
  }
  function detail(p,h,g){
    const owner=Object.keys(p.heroes).find(k=>p.heroes[k].gear[g.slot]===g.id),equipped=h.gear[g.slot]===g.id,c=g.level<20?M.strengthenCost(g):null;
    const preview=JSON.parse(JSON.stringify(p));for(const k of Object.keys(preview.heroes))if(preview.heroes[k].gear[g.slot]===g.id)delete preview.heroes[k].gear[g.slot];const key=Object.keys(p.heroes).find(k=>p.heroes[k]===h);preview.heroes[key].gear[g.slot]=g.id;
    const current=M.stats(p,key),next=M.stats(preview,key);
    return `<b style="color:${M.RARITIES[g.rarity].color}">${M.RARITIES[g.rarity].name} · +${g.level}</b><span class="gear-owner">${owner?'Đang dùng: '+M.HEROES[owner].name:'Chưa trang bị'}</span><p class="stat-chips">${[['stat-heart',fmt(current.hp),fmt(next.hp),next.hp-current.hp],['stat-attack',current.attack.toFixed(2).replace('.',','),next.attack.toFixed(2).replace('.',','),next.attack-current.attack],['stat-shield',Math.round(current.defense*100)+'%',Math.round(next.defense*100)+'%',next.defense-current.defense]].map(([icon,a,b,d])=>`<span class="${d>0?'up':d<0?'down':''}">${art(icon)}${d?`${a}<i>→</i>${b}`:b}</span>`).join('')}</p>${g.affix?`<p>${esc(M.AFFIXES[g.affix].desc)}</p>`:''}${(M.SOCKETS?.[g.rarity]||0)?`<div class="gem-sockets" aria-label="Lỗ khảm ngọc">${Array.from({length:M.SOCKETS[g.rarity]},(_,i)=>{const k=g.sockets?.[i];return `<button type="button" class="gem-socket ${k?'is-full':''}" data-action="gem:socket" data-gear="${esc(g.id)}" data-index="${i}" aria-label="${k?esc(M.GEMS[M.gemParse(k).type].name+' cấp '+M.gemParse(k).level):'Lỗ trống'}">${k?`<img src="assets/gemwoven/gems/gem-${k}.webp" alt="">`:'<i>+</i>'}</button>`;}).join('')}</div>`:''}<div class="outfit-actions">${b(equipped?'Tháo ra':owner?'Chuyển sang tướng này':'Trang bị',equipped?'unequip':'equip',{id:g.id,slot:g.slot})}<div><div class="outfit-cost">${g.level<20?cost(p,c):'+20 tối đa'}</div>${b('Cường hóa','strengthen',{id:g.id},g.level>=20||!afford(p,c))}</div></div><div class="outfit-manage"><button type="button" class="gear-lock-inline" data-action="gear:lock" data-id="${esc(g.id)}" data-on="${g.locked?0:1}">${g.locked?'🔒 Đã khóa':'🔓 Khóa'}</button>${owner?'':`<button type="button" class="game-btn" data-action="do:salvage" data-id="${esc(g.id)}" ${g.locked?'disabled':''}>Phân rã · ${fmt(M.salvageValue(g).ore)} quặng</button>`}</div>`;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    if(state.screen==='equipment'){state.screen='upgrade';state.outfitSlot=state.outfitSlot||'weapon';}
    const p=decorate(state);if(state.screen!=='upgrade')return p;
    const hero=state.hero,h=p.heroes[hero];let nodes=L.screens.upgrade.nodes.filter(n=>!/^upgrade\.(evolution-|locked-label|hero-stars|stat-|select-active)/.test(n.id));
    const model=nodes.find(n=>n.id==='upgrade.hero-model');model.rect=[321,396,300,304];model.action='outfit:close';
    const heading=nodes.find(n=>n.id==='upgrade.title');if(heading)C[heading.text]='Tướng';
    // Owner 04/11 (Codex mockup raw/hall-gear): drawn sockets with the rarity inlaid in the frame, the item's own art,
    // the slot name on the socket's wooden foot and the enhancement on a leather tag in the corner; two columns that
    // stay clear of every hero form (its aura is confined in hall-gear rules) and of the waiting pedestals.
    const slots=[['helmet',182,362],['armor',182,484],['weapon',182,606],['glasses',639,362],['pants',639,484],['boots',639,606]];
    for(const [slot,x,y]of slots){const g=p.equipment.find(g=>g.id===h?.gear[slot]),rim=g&&g.rarity!=='common'?g.rarity:'none',pic=g&&A[`gear-${g.rarity}-${slot}`]?`gear-${g.rarity}-${slot}`:M.SLOT_ART[slot];
      nodes.push(node('gear-'+slot,M.SLOTS[slot],[x,y,120,118],'outfit:slot',{slot},A['hall-socket-'+rim]?'hall-socket-'+rim:'inventory-slot',pic));const n=nodes.at(-1);
      Object.assign(n,{iconRect:[24,14,72,68],labelAsset:A['hall-label-wood']?'hall-label-wood':undefined,labelRect:[0,86,120,40],size:29,disabled:!h});n.className+=(g?' filled is-'+g.rarity:' empty')+(state.outfitSlot===slot?' selected':'');
      if(g){const k='upgrade.gear-level-'+slot;C[k]='+'+g.level;nodes.push({id:k,text:k,kind:'text',rect:[x+70,y-8,56,32],size:24,className:'hall-gear-level'});}}
    nodes.push(node('relic',h?'Dạng '+h.relic.evolution+'/5':'Bảo bối',[419,720,104,100],'outfit:slot',{slot:'relic'},'avatar-ring',`relic-${hero}-${h?.relic.evolution||1}`));
    Object.assign(nodes.at(-1),{disabled:!h,iconRect:[22,12,60,60],labelAsset:A['hall-label-wood']?'hall-label-wood':undefined,labelRect:[-12,70,128,34],size:25,className:'hero-gear-slot hall-relic'});
    for(const [i,key]of Object.keys(M.HEROES).entries()){const n=nodes.find(n=>n.id==='upgrade.choose-'+key);if(n){n.rect=[140+i*110,824,105,100];n.iconRect=[17,10,71,76];}}
    const skillLink=nodes.find(n=>n.action==='route:skills'&&n.role!=='nav');if(skillLink)Object.assign(skillLink,{rect:[182,742,206,66],asset:A['kit-plaque']?'kit-plaque':skillLink.asset,fit:'fill',icon:'skill-book',iconRect:[16,8,50,50],labelRect:[62,12,134,40],size:29,className:((skillLink.className||'')+' hall-skills').trim()});
    nodes.push(node('deploy',p.selected===hero?'Đang xuất chiến':'Xuất chiến',[553,742,206,66],'do:select',{hero},'button-gold'));Object.assign(nodes.at(-1),{icon:undefined,labelRect:[16,13,174,38],size:p.selected===hero?23:29,disabled:!h||p.selected===hero});
    C['upgrade.hero-caption']=M.HEROES[hero].name+(h?' · Lv.'+h.level:' · Chưa sở hữu');nodes.push({id:'upgrade.hero-caption',text:'upgrade.hero-caption',kind:'text',rect:[328,338,290,37],size:25,tone:'gold',className:'text-backing'});
    C['upgrade.equipped-stars']=h?'★'.repeat(h.stars)+'☆'.repeat(6-h.stars):'☆☆☆☆☆☆';nodes.push({id:'upgrade.equipped-stars',text:'upgrade.equipped-stars',kind:'text',rect:[311,362,320,38],size:30,tone:'gold'});
    const st=h?M.stats(p,hero):null;
    C['upgrade.gear-stats']=h?`HP ${fmt(st.hp)}    Công ×${st.attack.toFixed(2).replace('.',',')}    Thủ ${Math.round(st.defense*100)}%`:'Chưa sở hữu tướng';
    nodes.push({id:'upgrade.gear-stats',text:'upgrade.gear-stats',kind:'text',rect:[207,922,535,38],size:25,tone:'gold',className:'text-backing'});
    if(state.outfitSlot&&h){nodes=nodes.filter(n=>n.rect[1]<824||n.role==='nav'||n.id.includes('nav-')||n.id.endsWith('.footer-board'));nodes.push({id:'upgrade.outfit-picker',kind:'content',rect:[70,838,800,638],className:'outfit-panel',backgroundAsset:'panel-parchment',build:el=>picker(el,p,state)});}
    L.screens.upgrade.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='route:equipment'){state.outfitSlot='weapon';state.hero=G.engine.read().selected;ctx.navigate('upgrade');return true;}
    if(!action.startsWith('outfit:')){if(action==='do:hero'){state.outfitItem=null;state.outfitMessage='';}if(action==='do:upgrade-tab')state.outfitSlot=null;return handle(action,el,ctx,state);}
    const cmd=action.slice(7),d=el.dataset;state.outfitMessage='';
    try{
      if(cmd==='slot'){state.outfitSlot=d.slot;state.outfitItem=null;}
      if(cmd==='close')state.outfitSlot=null;
      if(cmd==='item')state.outfitItem=d.id;
      if(cmd==='equip')G.engine.equip(state.hero,d.id);
      if(cmd==='unequip')G.engine.unequip(state.hero,d.slot);
      if(cmd==='strengthen')G.engine.strengthen(d.id);
      if(cmd==='train-relic')G.engine.trainRelic(state.hero);
      if(cmd==='evolve-relic')G.engine.evolveRelic(state.hero);
      if(['equip','unequip','strengthen','train-relic','evolve-relic'].includes(cmd))state.outfitMessage='Đã cập nhật cho '+M.HEROES[state.hero].name+'.';
    }catch(error){state.outfitMessage=error.message;}
    ctx.render();return true;
  };
})();
