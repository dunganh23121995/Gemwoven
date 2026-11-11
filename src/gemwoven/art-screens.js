/* Bind progression to the existing illustrated screens, preserving every art layer. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY,H=window.GEMWOVEN_HEROES;
  const originals=Object.fromEntries(Object.entries(L.screens).map(([key,s])=>[key,s.nodes.map(n=>({...n}))]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),short=M.compact;
  const owned=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const affordable=(p,c)=>c&&Object.entries(c).every(([id,n])=>owned(p,id)>=n);
  const clone=nodes=>nodes.map(n=>({...n}));
  const find=(nodes,id)=>nodes.find(n=>n.id.endsWith('.'+id));
  function label(nodes,id,value){const n=find(nodes,id);if(n?.text)C[n.text]=String(value);return n;}
  function action(nodes,id,value,data={},disabled=false){const n=find(nodes,id);if(n)Object.assign(n,{action:value,data,disabled});return n;}
  function text(key,id,value,rect,size=25,tone='ink',extra={}){const name=key+'.'+id;C[name]=String(value);return {id:name,kind:'text',text:name,rect,size,tone,...extra};}
  function button(key,id,value,rect,act,data={},extra={}){return {...text(key,id,value,rect,26,'ink'),kind:'button',asset:'button-gold',fit:'fill',action:act,data,...extra};}
  function image(key,id,asset,rect,extra={}){return {id:key+'.'+id,kind:'image',asset,rect,...extra};}
  function remove(nodes,pattern){return nodes.filter(n=>!pattern.test(n.id));}
  // Cost tiles show "owned / needed" with enough/missing state; reward tiles
  // (reward=true) show only the amount received and never a shortage colour.
  // Tile counts use the shared Vietnamese compact formatter from 1.000 up ("1,2 N/8 N").
  const tight=n=>M.compact(n,1000);
  const ems=s=>[...String(s)].reduce((w,c)=>w+(/[.,:' ]/.test(c)?.28:c==='/'?.42:/[A-ZĐ]/.test(c)?.7:.55),0);
  function materials(nodes,key,p,cost,rect,prefix,reward=false,size=26){
    nodes=remove(nodes,new RegExp('\\.'+prefix+'-'));
    const entries=Object.entries(cost||{}).filter(([,n])=>reward?n>=0:n>0),[x,y,w,h]=rect,gap=10;
    if(!entries.length)return nodes;
    const rows=entries.map(([id,n])=>{const available=id==='copies'?p.copies:owned(p,id);return {id,n,available,label:reward?tight(n):`${tight(available)}/${tight(n)}`.replace(/\s/g,'')};});
    // Each tile is at least as wide as its count at the readable size; spare room is shared evenly.
    const room=w-gap*(rows.length-1),need=rows.map(r=>Math.max(76,ems(r.label)*size+16)),total=need.reduce((a,b)=>a+b,0);
    const widths=total<=room?(need.every(v=>v<=room/rows.length)?need.map(()=>room/rows.length):need.map(v=>v+(room-total)/rows.length)):need.map(v=>v*room/total);
    let left=x;
    rows.forEach(({id,n,available,label},i)=>{
      const tw=widths[i],icon=id==='copies'?'portrait-'+(p.materialHero||p.selected):M.RESOURCES[id]?.[1]||'hero-fragment',well=h*.67,iconSize=Math.min(66,h*.55,tw-20);
      nodes.push(button(key,prefix+'-'+i,label,[left,y,tw,h],'item:'+id,{}, {asset:'inventory-slot',icon,iconRect:[(tw-iconSize)/2,(well-iconSize)/2,iconSize,iconSize],labelRect:[0,well+2,tw,h-well-2],size,tone:'gold',className:'material-tile '+(reward?'reward-tile':available>=n?'material-enough':'material-missing')}));
      left+=tw+gap;
    });return nodes;
  }
  // Skill names, descriptions and next-rank effects are generated from the shared
  // kit for the current save (see refreshSkillCopy), never written by hand.
  H.novice={...M.HEROES.novice,color:'#d3bd8b',weapon:'stat-attack',skills:M.HEROES.novice.skills.map(name=>[name,'',''])};
  const listValues=rows=>rows.map(([label,value,unit])=>`${label} ${value}${unit}`).join(' · ');
  function refreshSkillCopy(p){
    for(const key of Object.keys(M.HEROES))if(H[key])H[key].skills=[0,1,2,3].map(i=>{const t=M.skillText(key,p.heroes[key],i);return [t.name,t.description,t.next];});
  }
  const unreleased=hero=>!M.heroAvailable(hero);
  ['stat-attack','stat-shield','stat-heart','crest'].forEach((asset,i)=>A['skill-novice-'+i]=A[asset]);
  const inventory=window.GEMWOVEN_INVENTORY,resourceFor={},gearFor={},tierFor={};
  // Owner 08/11: precious things read as precious (Codex critique + approved mockup, raw/rarity-tiles): a drawn slot per
  // tier, colour on the rim and gems, a quiet tinted well. A display tier only; it changes no rule or source.
  const CURRENCY={gold:'Dùng để tăng cấp, rèn và mua đồ.',gems:'Đá Ngọc chỉ nhận qua nạp tiền. Tính năng nạp sắp ra mắt.'};
  const RESOURCE_TIER={tickets:'epic',essence:'epic',divineOre:'divine'};
  const slotFor=asset=>{const t=tierFor[asset];return t&&A['rarity-slot-'+t]?'rarity-slot-'+t:'inventory-slot';};
  function prepare(state){
    const p=G.engine.read();state.hero=state.hero in M.HEROES?state.hero:p.selected;
    const descriptions={tickets:'Vé nhận từ nhiệm vụ ngày và các mốc cấp tướng.',exp:'Sách kinh nghiệm dùng tăng cấp tướng.',seals:'Ấn tu luyện dùng tăng cấp tướng, tối đa 1.600 ấn mỗi ngày.',skillBooks:'Bí kíp dùng học và tăng cấp kỹ năng.',essence:'Dùng tăng sao, tiến hóa, kỹ năng và bảo bối.',ore:'Quặng dùng rèn, cường hóa trang bị, tiến hóa tướng và bảo bối.',wood:'Gỗ dùng rèn trang bị.',cloth:'Vải dùng rèn trang bị.',divineOre:'Rèn trang bị Thần (50 mảnh, sau ải 300) và tiến hóa bảo bối.'};
    // Gold and Đá Ngọc live in the top bar with their own +, not in the bag (owner 08/11).
    const rows=Object.entries(M.RESOURCES).filter(([id])=>id!=='gold'&&id!=='gems').map(([id,[name,asset]])=>{resourceFor[asset]=id;return [asset,name,fmt(owned(p,id)),['exp','skillBooks'].includes(id)?'book':['ore','wood','cloth','essence','divineOre','seals'].includes(id)?'material':'item',descriptions[id]];});
    for(const [hero,h]of Object.entries(M.HEROES)){if(unreleased(hero)&&!p.heroes[hero]&&!p.fragments[hero])continue;const asset='fragment-'+hero;if(!A[asset]?.fragmentArt)A[asset]=A['portrait-'+hero];rows.push([asset,'Mảnh '+h.name,fmt(p.fragments[hero]||0),'fragment',hero==='novice'?'Ghép 80 mảnh thành một bản sao Hiro để tăng sao. Hiro không có trong triệu hồi: mảnh đến từ Hành Trình Tân Thủ, nhiệm vụ vượt ải hằng ngày, rương sao chương và mỗi 10 tầng Trùm Vô Tận.':unreleased(hero)?`Ghép 80 mảnh thành ${h.name}. Tướng xuất hiện ở kỳ triệu hồi sau.`:'Ghép 80 mảnh cùng loại thành một tướng hoặc bản sao.']);}
    refreshSkillCopy(p);
    for(const gear of p.equipment){const asset='gear-'+gear.id;A[asset]=A[`gear-${gear.rarity}-${gear.slot}`]||A[M.SLOT_ART[gear.slot]]||A['helmet'];gearFor[asset]=gear;const sv=M.salvageValue(gear);rows.push([asset,M.SLOTS[gear.slot]+' +'+gear.level,'+'+gear.level,'gear',M.RARITIES[gear.rarity].name+(gear.locked?' · đang khóa':'')+(gear.affix?' · '+M.AFFIXES[gear.affix].desc:'')+` · phân rã ${fmt(sv.ore)} quặng, ${fmt(sv.gold)} vàng`]);}
    // Dệt Ngọc: each gem as its picture with a count (Khác); the weekly choice token.
    for(const [k,n] of Object.entries(p.gems||{}).filter(([,n])=>n>0).sort(([a],[b])=>a.localeCompare(b))){const g=M.gemParse(k);if(!g)continue;const asset='gem-'+k;A[asset]={file:`assets/gemwoven/gems/gem-${k}.webp`,width:160,height:160};rows.push([asset,`${M.GEMS[g.type].name} ${g.level}`,fmt(n),'other',`${M.GEMS[g.type].stat} +${Math.round(M.GEMS[g.type].values[g.level-1]*100)}%`]);}
    if(p.gemChoices>0){A['gem-choice']={file:'assets/gemwoven/gems/gem-precision-1.webp',width:160,height:160};rows.push(['gem-choice','Phiếu chọn ngọc',fmt(p.gemChoices),'other','Đổi lấy một viên ngọc cấp 1 tự chọn.']);}
    // Bụi Ký Ức and the day-28 voucher (D3), shown once owned.
    if(p.memory?.dust>0)rows.push(['memory-dust','Bụi Ký Ức',fmt(p.memory.dust),'other','Vật liệu không bán trực tiếp. Đổi mảnh tướng ở Cửa Hàng · Ký Ức.']);
    if(p.memory?.vouchers>0){A['memory-voucher']=A['ticket'];rows.push(['memory-voucher','Phiếu 20 mảnh',fmt(p.memory.vouchers),'other','Đổi 20 mảnh một tướng đã sở hữu, chưa 6★ (không phải Hiro). Không hết hạn.']);}
    for(const d of M.WORLD.EXPANSION.definitions){const c=M.counterProgress(p,d.chapter);if(c.shards)rows.push([d.counterKey,d.counter,c.shards+'/12','other',d.counterText+' Tự dùng đúng chủ đề; bậc '+c.rank+'/4.']);}
    for(const k of Object.keys(tierFor))delete tierFor[k];
    for(const [asset,,,kind] of rows)tierFor[asset]=kind==='gear'?gearFor[asset].rarity:kind==='fragment'?(asset==='fragment-novice'?'rare':'legendary'):RESOURCE_TIER[resourceFor[asset]];
    inventory.splice(0,inventory.length,...rows);
    if(state.screen==='inventory'){
      const visible=rows.filter(r=>state.category==='all'||r[3]===state.category);
      if(!visible.some(r=>r[0]===state.bagItem))state.bagItem=visible[0]?.[0]||'';
    }
  }
  const rebuild=window.GEMWOVEN_REBUILD;
  window.GEMWOVEN_REBUILD=state=>{prepare(state);rebuild(state);};
  function skills(nodes,p,state){
    // The skill map alone (owner 03/11): no branch filters and no 'Cây kỹ năng' button; every node stays on the tree.
    const key='skills',hero=state.hero,h=p.heroes[hero],i=state.skill||0,filter='all',t=M.skillText(hero,h,i);
    nodes=remove(nodes,/\.skill-materials-|\.branch-\d$/);
    for(const n of nodes){
      const id=n.id.split('.').slice(1).join('.');
      if(/^branch-\d$/.test(id)){const branch=+id.slice(-1);n.action='do:skill-filter';n.data={filter:branch};n.selected=String(filter)===String(branch);}
      if(/^roster-/.test(id)){n.action='do:hero';n.data={hero:id.slice(7)};n.selected=id==='roster-'+hero;}
      if(/^node-\d$/.test(id)){const index=+id.slice(-1);n.action='do:skill-node';n.data={index};n.className+=' skill-live'+(!h||!M.skillUnlock(h,index)?' skill-unavailable':'');}
      // A locked branch says how it opens (Codex UI review) instead of 0/10.
      if(/^node-level-/.test(id)){const index=+id.slice(-1),g=M.SKILL_GATES?.[index];C[n.text]=h&&M.skillUnlock(h,index)?`${h.skills[index]||0}/${M.SKILL_MAX}`:g?`Cấp ${g.level}${g.evolution?' · TH'+g.evolution:''}`:'Khóa';}
    }
    if(filter!=='all')nodes=nodes.filter(n=>!(/\.(node-|node-level-)\d$/.test(n.id)&&!n.id.endsWith('-'+filter)));
    label(nodes,'hero-name-'+hero,`${h?'Lv.'+h.level:'Chưa sở hữu'} · ${M.HEROES[hero].name}`);
    label(nodes,'skill-level',`Lv.${t.rank}${t.bonusRank?' (+'+t.bonusRank+')':''} / ${t.max}`);
    const open=h&&t.unlocked;
    label(nodes,'next-title',!open?'Hiệu quả khi mở':t.maxed?'Cấp tối đa':t.rank===0?'Hiệu quả khi học':'Hiệu quả cấp kế tiếp');
    label(nodes,'next-effect-'+hero+'-'+i,!open?listValues(t.values):t.rank===0?listValues(t.values):t.next);
    let c;try{if(open&&!t.maxed)c=M.skillCost(h,i);}catch{}
    label(nodes,'materials-title',c?(t.rank===0?'Nguyên liệu học':'Nguyên liệu tăng cấp'):t.maxed?'Kỹ năng đã hoàn thiện':'Điều kiện mở kỹ năng');
    nodes=materials(nodes,key,p,c,[56,1276,420,108],'skill-materials');
    action(nodes,'upgrade-skill','do:train',{hero,index:i},!c||!affordable(p,c));label(nodes,'upgrade-skill',t.maxed?'Đã Tối Đa':!open?'Chưa Mở':t.rank===0?'Học':'Tăng Cấp');
    const requirement=!h?(unreleased(hero)?'Tướng xuất hiện ở kỳ triệu hồi sau.':'Cần sở hữu tướng.'):`${t.gate}\nHiện tại: cấp ${h.level} · tiến hóa ${h.evolution}.`;
    if(!c&&!t.maxed)nodes.push(text(key,'unlock-requirement',requirement,[70,1285,390,80],24));
    return nodes;
  }
  // Where each resource really comes from (progression.js rewards, shop and summon tables).
  const SOURCES={tickets:'Nhiệm vụ Ghé thăm\nMốc cấp tướng',exp:'Vượt ải · Trùm · Tích lũy\nNhiệm vụ · Cửa hàng',seals:'Nhiệm vụ · Vượt ải\nTrùm · Tích lũy',
    skillBooks:'Nhiệm vụ Chi tiêu\nCửa hàng',essence:'Trùm Vô Tận\nTrùm chương\nRương sao chương',ore:'Vượt ải · Boss · Phân rã\nCửa hàng · Triệu hồi',wood:'Cửa hàng\nTriệu hồi',cloth:'Cửa hàng\nTriệu hồi',divineOre:'Trùm Vô Tận tầng 60+\nCửa hàng Đá Ngọc'};
  function bag(nodes,p,state){
    for(const n of nodes){if(n.id.startsWith('inventory.category-')){n.rect=[15,n.rect[1],215,85];n.labelRect=[56,14,150,56];n.size=28;n.className='inventory-category';}if(n.action?.startsWith('bag-item:')){n.labelHidden=true;delete n.labelAsset;n.iconRect=[36,18,80,80];const a=n.action.slice(9);n.asset=slotFor(a);if(tierFor[a])n.className=((n.className||'')+' rarity-'+tierFor[a]).trim();if(a.startsWith('fragment-'))n.iconRect=[35,18,82,82];}}
    const asset=state.bagItem,item=inventory.find(r=>r[0]===asset);if(!item)return nodes;
    const well=find(nodes,'detail-slot');if(well){well.asset=slotFor(asset);if(tierFor[asset])well.className=((well.className||'')+' rarity-'+tierFor[asset]).trim();}
    // Items sit a little inside their slot so its tier background shows (owner 08/11); a fragment is a solid puzzle piece, smaller still.
    const art=find(nodes,'detail-art');if(art)art.rect=item[3]==='fragment'?[90,1214,148,148]:[92,1216,144,144];
    nodes=remove(nodes,/\.(recipe-|held-|source-icon$)/);
    const fragmentHero=item[3]==='fragment'?asset.slice(9):null;
    label(nodes,'source',fragmentHero==='novice'?'Tân Thủ · Nhiệm vụ\nRương sao · Boss':fragmentHero&&unreleased(fragmentHero)?'Kỳ triệu hồi sau\nComing soon':fragmentHero?'Triệu hồi\nTrùm chương':item[3]==='gear'?'Triệu hồi\nLò rèn':SOURCES[resourceFor[asset]]||'Nhiệm vụ · Vượt ải\nTrùm · Tích lũy');
    Object.assign(find(nodes,'source'),{rect:[307,1336,250,108],size:26});Object.assign(find(nodes,'source-title'),{rect:[307,1296,250,36],size:28});
    nodes.push(text('inventory','held-label','Đang có',[566,1296,340,36],28),text('inventory','held-count',item[2],[566,1332,340,44],34));
    if(item[3]==='fragment'){const hero=asset.slice(9);action(nodes,'item-action','do:fuse',{hero},(p.fragments[hero]||0)<80);label(nodes,'item-action','Ghép Tướng');}
    else{const route=item[3]==='gear'?'equipment':item[3]==='book'?(asset==='exp-book'?'upgrade':'skills'):asset==='ticket'?'summon':'campaign';action(nodes,'item-action','route:'+route);label(nodes,'item-action',item[3]==='gear'?'Trang Bị':item[3]==='book'?'Sử Dụng':'Đi Tới');}
    const product=M.WORLD.SHOP.find(row=>row.kind==='resource'&&row.target===resourceFor[asset]);
    if(asset.startsWith('gem-')&&asset!=='gem-choice'){action(nodes,'item-action','gem:detail',{gem:asset.slice(4)});label(nodes,'item-action','Ghép');label(nodes,'source','Trùm Vô Tận 20+\nThử Luyện · Tuần');}
    if(asset==='gem-choice'){action(nodes,'item-action','gem:choice');label(nodes,'item-action','Chọn');}
    if(asset==='memory-dust'){action(nodes,'item-action','art:memory-open');label(nodes,'item-action','Đổi Mảnh');label(nodes,'source','Tướng 6★ dư\nNhiệm vụ tuần');}
    if(asset==='memory-voucher'){action(nodes,'item-action','memory:chest');label(nodes,'item-action','Dùng');label(nodes,'source','Lịch 28 ngày\nSự Kiện');}
    const counterDef=M.WORLD.EXPANSION.definitions.find(d=>d.counterKey===asset);
    if(counterDef){action(nodes,'item-action','guide:chapter',{chapter:counterDef.chapter});label(nodes,'item-action','Đến Chương');label(nodes,'source','Tinh anh 3 sao\nMốc 10 / 20 / 30 / 40');}
    // The item's action and "buy more" sit side by side under the held count.
    const act=find(nodes,'item-action');Object.assign(act,{rect:product?[552,1384,162,86]:[670,1384,196,86],size:27,labelRect:[22,0,(product?162:196)-44,86]});
    if(product)nodes.push(button('inventory','purchase','Mua thêm',[716,1384,162,86],'art:shop-product',{product:product.id},{size:27,labelRect:[16,0,130,86]}));
    // A piece of gear: its salvage value beside "Trang Bị", and a lock so it is never salvaged by mistake.
    if(item[3]==='gear'){const g=gearFor[asset],worn=Object.values(p.heroes).some(h=>Object.values(h.gear).includes(g.id));
      Object.assign(act,{rect:[552,1374,162,100],labelRect:[16,0,130,100]});
      nodes.push(button('inventory','salvage',worn?'Đang mặc':g.locked?'Đang khóa':'Phân rã',[716,1374,162,100],'do:salvage',{id:g.id},{size:27,labelRect:[16,0,130,100],disabled:worn||!!g.locked}));
      nodes=remove(nodes,/\.item-type$/);nodes.push(button('inventory','lock',g.locked?'Mở khóa':'Khóa',[712,1158,186,66],'gear:lock',{id:g.id,on:g.locked?'0':'1'},{size:25,icon:'kit-lock',iconRect:[14,13,34,40],labelRect:[48,0,128,66],asset:'button-gold',className:'kit-plate'}));label(nodes,'held-label','Cường hóa');}
    // Codex review 27 (Túi Đồ 7/10): one clear reading order in the detail panel — name, one line of use, then
    // "Đang có" and where it comes from on one row, the actions as large gold plates; the type tag stays small.
    for(const [id,rect,size] of [['item-title-'+asset,[300,1158,430,50],38],['item-description-'+asset,[300,1212,590,70],29],['held-label',[300,1290,180,36],27],['held-count',[300,1324,180,46],38],['source-title',[490,1290,200,36],27],['source',[490,1328,220,118],26]]){const n=find(nodes,id);if(n)Object.assign(n,{rect,size,align:'left',className:((n.className||'').replace(/\bitem-detail\b/,'')+' item-detail').trim()});}
    for(const n of nodes)if(/\.(item-action|purchase|salvage)$/.test(n.id)&&n.rect[1]>1300){const i=['item-action','purchase','salvage'].findIndex(k=>n.id.endsWith('.'+k));n.rect=[712,1290+(i?1:0)*96,184,88];n.labelRect=[10,0,164,88];n.size=29;n.className=((n.className||'')+' bag-plate').trim();}
    // The gear tab: bag fill and bulk salvage.
    if(state.category==='gear'){const full=p.equipment.length>=M.BAG.warn;
      nodes.push(button('inventory','bulk-salvage',`Phân giải hàng loạt · ${p.equipment.length}/${M.BAG.cap}`,[232,418,372,74],'gear:bulk',{},{size:24,labelRect:[18,0,336,74],className:'kit-plate'+(full?' bag-full':'')}));}
    return nodes;
  }
  function summon(nodes,p,state){
    nodes=remove(nodes,/\.(guarantee|one-cost|ten-cost|featured-(?:fire|ice|earth|lightning|shadow)|portrait-(?:ice|earth|lightning|shadow))$/);
    action(nodes,'summon-one','do:summon',{count:1});action(nodes,'summon-ten','do:summon',{count:10});action(nodes,'central-crystal','do:summon',{count:1});action(nodes,'summon-details','do:rates');action(nodes,'fragments','art:fragments');
    // The price on each button, and what is missing when tickets run short (Codex UI review): 1 ticket, or 120 Đá Ngọc a pull.
    for(const [id,count] of [['summon-one',1],['summon-ten',10]]){const n=find(nodes,id);n.labelRect=[24,30,225,70];n.size=29;
      const t=p.wallet.tickets,price=t>=count?`${count} vé`:p.wallet.gems>=count*120?`${fmt(count*120)} Đá Ngọc`:`Thiếu ${count-t} vé`;label(nodes,id,`Triệu Hồi ×${count}
${price}`);}
    const featured=find(nodes,'portrait-fire');featured.icon=(A['form-portrait-'+M.SUMMON_BANNER.hero+'-1']?'form-portrait-'+M.SUMMON_BANNER.hero+'-1':'portrait-'+M.SUMMON_BANNER.hero);featured.action='hero:'+M.SUMMON_BANNER.hero;featured.rect=[350,366,240,285];featured.iconRect=[38,55,164,165];
    // Banner name + one short line on a board sized for two readable lines.
    label(nodes,'subtitle',M.SUMMON_BANNER.title+'\nTướng nổi bật kỳ này');Object.assign(find(nodes,'subtitle'),{rect:[300,276,341,80],size:28});find(nodes,'subtitle-board').rect=[284,268,373,96];
    Object.assign(find(nodes,'featured-board'),{rect:[50,1178,842,174]});label(nodes,'featured-title','Phần Thưởng Hiếm');Object.assign(find(nodes,'featured-title'),{rect:[84,1194,400,38],size:31});
    nodes=remove(nodes,/\.featured-note$/);
    // D3: the only change allowed on the locked summon screen, one small line about the next banner (never a guessed countdown).
    const plan=window.GemwovenLiveOps?.BANNER?M.bannerPlan(Date.now()):null,next=plan?.next;
    nodes.push(text('summon','next-banner',next?`Kỳ sau: ${M.HEROES[next.hero].name} · ${new Date(next.start+7*3600000).toISOString().slice(5,10).split('-').reverse().join('/')}`:'Kỳ sau: Chưa công bố',[450,1195,396,40],28,'gold',{align:'right',className:'next-banner'}));
    const star=M.SUMMON_BANNER.hero,name=M.HEROES[star].name;
    // Only the banner's prizes: its hero, that hero's fragments, and a top-rarity weapon.
    [['hero',`portrait-${star}`,'Tướng\n'+name,'hero:'+star,{}],['fragment',`fragment-${star}`,'Mảnh\n'+name,'art:fragments',{}],['weapon',M.SLOT_ART.weapon,'Vũ Khí\n'+M.RARITIES.divine.name,'journey:featured-gear',{slot:'weapon',rarity:'divine',asset:M.SLOT_ART.weapon}]].forEach(([id,asset,text,act,data],i)=>nodes.push(button('summon','featured-'+id,text,[80+i*272,1233,256,98],act,data,{asset:'inventory-slot',icon:asset,iconRect:[13,12,70,72],labelRect:[100,0,156,96],size:30,tone:'gold',align:'left',className:'featured-equipment'})));
    label(nodes,'pity-label',`Còn ${Math.max(1,M.SUMMON_PITY-p.summon.dry)} lần tới bảo đảm tướng hiếm`);label(nodes,'pity-value',`${p.summon.dry} / ${M.SUMMON_PITY}`);find(nodes,'pity-meter').value=Math.min(1,p.summon.dry/M.SUMMON_PITY);
    nodes.push(button('summon','ticket-balance',`${fmt(p.wallet.tickets)} Vé Triệu Hồi`,[290,1121,361,60],'item:ticket',{},
      {asset:'nameplate',icon:'ticket',iconRect:[22,7,52,46],labelRect:[74,6,266,48],size:28,tone:'ink'}));
    return nodes;
  }
  function quests(nodes,p,state,key){
    const index=Math.max(0,Math.min(M.DAILY.length-1,state.dailyQuest||0)),q=M.DAILY[index],progress=p.daily.progress[q.id]||0,claimed=p.daily.claimed.includes(q.id);
    label(nodes,'quest-heading','Nhiệm Vụ Hằng Ngày');find(nodes,'quest-heading').size=24;
    // Reward tiles show what claiming pays now: Ấn is limited by today's remaining cap.
    // "Hoàn thành" only once the target is reached (Codex review: 0 / 3 read as done).
    const preview=M.dailyRewardPreview(p,q.id),capNote=!claimed&&preview.sealCapped?'Đã đạt giới hạn Ấn hôm nay':progress>=q.target?'Hoàn thành':'';
    label(nodes,'quest-name',q.name);label(nodes,'quest-description',`Tiến độ: ${fmt(Math.min(progress,q.target))} / ${fmt(q.target)}${capNote?' · '+capNote:''}`);
    label(nodes,'quest-accept',claimed?'Đã Nhận':progress>=q.target?'Nhận Thưởng':'Chưa Hoàn Thành');action(nodes,'quest-accept','do:daily',{quest:q.id},claimed||progress<q.target);
    action(nodes,'quest-dismiss','route:home');
    ['Ghé Thăm','Vượt Ải','Boss','Chi Tiêu'].forEach((name,i)=>{label(nodes,'tavern-tab-'+i,name.replace(' ','\n'));action(nodes,'tavern-tab-'+i,'art:quest',{index:i});find(nodes,'tavern-tab-'+i).selected=index===i;});
    nodes=materials(nodes,key,p,claimed?q.reward:preview.reward,[282,1312,336,104],'quest-rewards',true,27);
    // Readable header plaque, subtitle board and tab flags (two-line names on the flags).
    Object.assign(find(nodes,'quest-heading-board'),{rect:[66,1122,306,82]});Object.assign(find(nodes,'quest-heading'),{rect:[96,1136,246,54],size:29});
    label(nodes,'tavern-subtitle','Cùng bạn tốt đi xa hơn');Object.assign(find(nodes,'tavern-subtitle'),{rect:[62,394,286,50],size:28});find(nodes,'tavern-subtitle-board').rect=[38,376,334,90];
    for(let i=0;i<4;i++)Object.assign(find(nodes,'tavern-tab-'+i),{labelRect:[0,166,108,76],size:30});
    return nodes;
  }
  // Compact "what this step gives" line, computed by progression.js.
  function gainText(r){
    if(!r)return '';
    const a=r.before,b=r.after,parts=[`HP ${fmt(a.hp)} → ${fmt(b.hp)}`,`Công ×${a.attack.toFixed(2).replace('.',',')} → ×${b.attack.toFixed(2).replace('.',',')}`];
    if(Math.round(a.defense*100)!==Math.round(b.defense*100))parts.push(`Thủ ${Math.round(a.defense*100)}% → ${Math.round(b.defense*100)}%`);
    return parts.join(' · ')+(r.unlock?'\n'+r.unlock:'');
  }
  // Tăng Sao for starred spares: the five spare stamps (1★..5★ ×n) replace the level strip, the stamp of the star needed
  // lit; small brass arrows join only the stars the plan fuses. The spare tile carries its star seal and the forge badge
  // (lit when the plan fuses), and opens the fusion sheet.
  function spareStrip(nodes,hero,plan){
    nodes=remove(nodes,/\.(level-strip|level-preview|exp-meter|exp-value|exp-crystal|exp-label)$/);
    const used=new Set(plan.refines.map(r=>r.to-1)),w=90,gap=18,x0=210,y=1022;
    for(let st=1;st<=5;st++){const x=x0+(st-1)*(w+gap);
      nodes.push(button('upgrade','spare-'+st,`${st}★ ×${plan.stock[st]}`,[x,y,w,56],'art:spares',{hero},{asset:'kit-badge-leather',size:22,tone:'gold',className:'spare-stamp'+(st===plan.fodderStar?' is-need':'')+(used.has(st)?' is-used':'')}));
      if(st<5&&used.has(st))nodes.push(image('upgrade','spare-arrow-'+st,'vip-pass-scroll-arrow',[x+w-2,y+16,gap+4,24],{fit:'contain',className:'spare-arrow'}));}
    const tile=find(nodes,'upgrade-materials-0');
    if(tile){tile.action='art:spares';tile.data={hero};const [tx,ty,tw]=tile.rect;
      nodes.push(button('upgrade','spare-seal',`${plan.fodderStar}★`,[tx+tw-66,ty-8,64,34],'art:spares',{hero},{asset:'kit-badge-brass',size:20,tone:'ink',className:'spare-seal'}));
      nodes.push(button('upgrade','spare-forge','',[tx-22,ty+42,52,52],'art:spares',{hero},{asset:'icon-forge',fit:'contain',labelHidden:true,className:'spare-forge'+(plan.ok&&plan.refines.length?' is-lit':'')}));}
    return nodes;
  }
  function upgrade(nodes,p,state){
    const hero=state.hero,h=p.heroes[hero],tab=state.upgradeTab||'level';let c=null,disabled=true,gain='',side=null,plan=null;
    for(const [i,t]of ['level','stars','evolution'].entries()){action(nodes,'upgrade-tab-'+i,'do:upgrade-tab',{tab:t});find(nodes,'upgrade-tab-'+i).selected=tab===t;}
    for(const n of nodes){if(n.id.startsWith('upgrade.choose-')){n.action='do:hero';n.data={hero:n.id.slice(15)};n.selected=n.data.hero===hero;}}
    action(nodes,'evolution-next','do:upgrade-tab',{tab:'evolution'});
    if(h){
      const stats=M.stats(p,hero),step=state.levelStep===10?10:1,range=h.level<M.MAX_LEVEL?M.levelCostRange(h.level,step):null,levelGain=range?M.upgradePreview(p,hero,'level',range.levels):null;
      label(nodes,'stat-value-0',levelGain?`${fmt(stats.hp)} → ${fmt(levelGain.after.hp)}`:fmt(stats.hp));label(nodes,'stat-value-1',levelGain?`×${stats.attack.toFixed(2).replace('.',',')} → ×${levelGain.after.attack.toFixed(2).replace('.',',')}`:`×${stats.attack.toFixed(2).replace('.',',')}`);label(nodes,'stat-value-2',`${Math.round(stats.defense*100)}%`);label(nodes,'hero-stars','★'.repeat(h.stars)+'☆'.repeat(6-h.stars));label(nodes,'exp-value',`Cấp ${h.level} / ${M.MAX_LEVEL}`);find(nodes,'exp-meter').value=h.level/M.MAX_LEVEL;
      if(tab==='level'){
        const max=!range;if(range)c=range.cost;
        label(nodes,'level-preview',max?`Cấp ${h.level} · Tối đa`:`Cấp ${h.level} → ${h.level+range.levels}`);label(nodes,'upgrade-material-title',max?'Đã đạt cấp tối đa':range.levels>1?`Nguyên liệu tăng ${range.levels} cấp`:'Nguyên liệu tăng cấp');
        disabled=max||!affordable(p,c);
        if(step===10&&range)action(nodes,'upgrade-action','art:level',{hero,count:range.levels},disabled);else action(nodes,'upgrade-action','do:level',{hero},disabled);
        label(nodes,'upgrade-action',max?'Đã Tối Đa':range.levels>1?`Tăng ${range.levels} Cấp`:'Tăng Cấp');
        gain=max?'Đã đạt cấp tối đa 500.':gainText(levelGain);
        if(!max)side=button('upgrade','level-step',step===10?'×10 ✓':'×10',[664,1344,118,58],'art:level-step',{},{asset:'nameplate',size:24,selected:step===10,className:'upgrade-side-toggle'});
      }
      if(tab==='stars'){
        // Starred spares (owner 04/11, Claude + Codex, mockup assets/gemwoven/raw/star-spares-mockup): the spare needed is one
        // of the hero's current star; Tăng Sao fuses it from lower spares when it can (fees included). Hiro keeps plain copies.
        const s=M.starPlan(hero,h);plan=s;c=s?(s.legacy?{copies:s.need,gold:s.gold,essence:s.essence}:{copies:s.need,gold:s.gold,essence:s.essence}):null;
        label(nodes,'level-preview',s?`${h.stars} sao → ${h.stars+1} sao`:'6 sao · Tối đa');label(nodes,'upgrade-material-title',s?(s.legacy?'Bản sao · Vàng · Tinh hoa':''):'Đã đạt 6 sao');
        const fuse=s&&!s.legacy&&s.ok&&s.refines.length>0;
        disabled=!s||!s.ok||!affordable(p,{gold:s.gold,essence:s.essence});action(nodes,'upgrade-action','do:star',{hero},disabled);label(nodes,'upgrade-action',!s?'Đã Tối Đa':fuse?'Luyện & Tăng Sao':'Tăng Sao');
        gain=s?gainText(M.upgradePreview(p,hero,'stars')):'Đã mở mọi hình thái.';
        if(M.HERO_FORMS[hero])side=button('upgrade','form-gallery','Hình thái',[664,1344,118,58],'forms:gallery',{hero},{asset:'nameplate',size:21,className:'upgrade-side-toggle'});
      }
      if(tab==='evolution'){
        const e=M.EVOLUTION[h.evolution];c=e?{gold:e.gold,essence:e.essence,ore:e.ore}:null;
        label(nodes,'level-preview',e?`Tiến hóa ${h.evolution} → ${h.evolution+1}`:`Tiến hóa ${h.evolution} / ${M.EVOLUTION.length} · Tối đa`);label(nodes,'upgrade-material-title',e?`Cần cấp ${e.level} · ${e.stars} sao`:'Đã lột xác toàn thân');
        disabled=!e||h.level<e.level||h.stars<e.stars||!affordable(p,c);action(nodes,'upgrade-action','do:evolve',{hero},disabled);label(nodes,'upgrade-action',e?'Tiến Hóa':'Đã Tối Đa');
        gain=e?gainText(M.upgradePreview(p,hero,'evolution')):'Đã mở mọi mốc tiến hóa.';
        side=button('upgrade','perk-list','Mốc',[664,1344,118,58],'art:evolution-perks',{hero},{asset:'nameplate',size:23,className:'upgrade-side-toggle'});
      }
      find(nodes,'upgrade-material-panel').rect=[200,1096,541,230];
      find(nodes,'upgrade-material-title').rect=[236,1124,469,35];
      nodes=materials(nodes,'upgrade',{...p,copies:plan?plan.have:h.copies-1,materialHero:hero},c,[226,1166,489,132],'upgrade-materials',false,31);
      if(plan&&!plan.legacy)nodes=spareStrip(nodes,hero,plan);
      nodes.push(button('upgrade','select-active',p.selected===hero?'Đang xuất chiến':'Xuất chiến',[582,636,174,59],'do:select',{hero},{size:21,disabled:p.selected===hero}));
    }else{
      const frags=p.fragments[hero]||0,soon=unreleased(hero)&&frags<80;
      nodes=remove(nodes,/\.(stat-value-|upgrade-materials-)/);label(nodes,'level-preview','Chưa sở hữu');label(nodes,'exp-value',`${frags} / 80 mảnh`);label(nodes,'hero-stars','☆☆☆☆☆☆');
      label(nodes,'upgrade-material-title',frags>=80?'Đủ 80 mảnh · Ghép để mở tướng':soon?'Xuất hiện ở kỳ triệu hồi sau':'Ghép 80 mảnh để mở tướng');
      action(nodes,'upgrade-action','do:fuse',{hero},frags<80);label(nodes,'upgrade-action',soon?'Sắp Ra Mắt':'Ghép Tướng');find(nodes,'exp-meter').value=frags/80;
      gain=soon?'Coming soon · Kỳ triệu hồi này chưa có mảnh của tướng này.':'Mảnh nhận từ triệu hồi và lần đầu hạ boss chương.';
    }
    // Phone-readable preview: one line of stat changes, a second line only for unlocks.
    Object.assign(find(nodes,'upgrade-action'),{rect:[311,1320,326,98]});const ev=find(nodes,'exp-value');if(ev)Object.assign(ev,{rect:[296,1058,350,38],size:31});
    if(gain)nodes.push(text('upgrade','gain-preview',gain,[70,1422,800,70],31,'gold',{className:'text-backing upgrade-gain'}));
    if(side)nodes.push(side);
    nodes=remove(nodes,/\.exp-label$/);const crystal=find(nodes,'exp-crystal');if(crystal)crystal.asset='exp-book';
    nodes.push(button('upgrade','choose-novice','Hiro',[660,711,61,66],'do:hero',{hero:'novice'},{asset:'avatar-ring',icon:'portrait-novice',iconRect:[12,8,37,48],labelHidden:true,selected:hero==='novice'}));
    return nodes;
  }
  // Cửa Hàng on the painted shelf (owner 04/11: "tràn ra khỏi background", "vàng, ngọc có hình thì sao phải dùng chữ";
  // Codex mockup assets/gemwoven/raw/shop-shelf, 8.8). Goods stand as cards, three a bay, on the two real boards of
  // shop-calm.webp (inner posts x≈102–826 upper, 82–844 middle; board tops y≈980 / 1128): never over a post or a board
  // front. Prices are pictures: {gold} {gems} {dust} {lock} in the copy become the coin, gem, vial and lock icons at
  // mount (shopIcons). A tab holds at most six goods (qa check-progression).
  const SHELF_X=[114,352,590],SHELF_Y=[868,1016],CARD=[226,112],PER={day:'ngày',week:'tuần'},LEFT_WHEN={day:'hôm nay',week:'tuần này'};
  const money=(currency,n)=>'{'+currency+'}'+fmt(n);
  const SHELF_NAME={exp:'Sách EXP'};
  const GEAR_TIERS=['uncommon','rare','epic'];
  function shelfCard(i,id,name,price,rect,act,data,extra={}){
    const [x,y]=rect||[SHELF_X[i%3],SHELF_Y[Math.floor(i/3)]];
    return button('shop','product-'+id,name+'\n'+price,[x,y,...CARD],act,data,{asset:'inventory-slot',iconRect:[18,13,56,56],labelRect:[0,0,...CARD],size:26,...extra,className:['shop-card',extra.className].filter(Boolean).join(' ')});
  }
  // Cửa Hàng · Ký Ức (D3): the week's two heroes as cards on the upper board, the dust balance beside them, 10 fragments
  // for 80 dust (no stepper), the rules behind ⓘ. Rules: progression.js memory().
  function memoryShop(nodes,p,state){
    const v=G.engine.memory(),pick=v.heroes.find(h=>h.hero===state.memoryHero)||v.heroes[0],key='shop';state.memoryHero=pick?.hero||null;
    nodes=remove(nodes,/\.(product-(?!name$|description$|preview$)|price-|quantity(-minus|-plus)?$|purchase-price$)/);
    nodes.push(button(key,'memory-balance',fmt(v.dust),[SHELF_X[2]+8,888,210,72],'art:memory-info',{},{asset:'kit-ribbon-info',fit:'fill',icon:'memory-dust',iconRect:[14,6,60,60],labelRect:[72,0,124,72],size:34,tone:'ink',className:'memory-balance'}));
    if(!pick){nodes.push(image(key,'memory-empty-row','kit-row-read',[SHELF_X[0],872,464,104],{fit:'fill'}),image(key,'memory-empty-icon','kit-icon-hourglass',[SHELF_X[0]+22,886,76,76]),
        text(key,'memory-empty','Chưa có tướng đủ\nđiều kiện · kỳ sau',[SHELF_X[0]+100,876,354,96],29,'ink',{className:'memory-empty'}));}
    else v.heroes.slice(0,2).forEach((h,i)=>{const tag=h.maxed?'6★':h.left<v.bundle?'Hết':'';
      nodes.push(shelfCard(i,'memory-'+h.hero,`${h.name} ×${v.bundle}`,money('dust',v.bundlePrice),null,'art:memory-pick',{hero:h.hero,...(tag?{tag}:{})},{icon:'fragment-'+h.hero,selected:h.hero===pick.hero,className:tag?'is-out':''}));});
    label(nodes,'product-name',pick?pick.name:'Bụi Ký Ức');
    label(nodes,'product-description',state.shopMessage||(pick?`${v.bundle} mảnh/lần\n${pick.owned?'Đang có '+fmt(pick.fragments):`Có ${fmt(pick.fragments)}/80`}`:'Vật liệu không bán trực tiếp'));
    const preview=find(nodes,'product-preview');preview.asset=pick?'fragment-'+pick.hero:'memory-dust';preview.rect=[384,1180,200,250];
    for(const id of ['product-name','product-description']){const n=find(nodes,id);if(n)n.className=((n.className||'')+' memory-copy').trim();}action(nodes,'product-preview','art:memory-info');
    nodes.push(button(key,'memory-info','i',[298,1222,54,54],'art:memory-info',{},{asset:'kit-round',fit:'fill',size:32,tone:'ink',className:'memory-info'}));
    if(pick)nodes.push(text(key,'memory-left',`Còn ${pick.left}/${v.cap} mảnh\ntuần này`,[632,1238,232,96],32,'ink',{className:'memory-left'}));
    if(!pick){action(nodes,'buy','art:memory-info',{},true);label(nodes,'buy','Kỳ sau');nodes=remove(nodes,/\.purchase-board$/);}
    else{action(nodes,'buy','art:memory-buy',{hero:pick.hero},!pick.canBuy);label(nodes,'buy',pick.maxed?'Đã 6★':pick.left<v.bundle?'Hết lượt':'Mua\n'+money('dust',v.bundlePrice));}
    return nodes;
  }
  function shop(nodes,p,state){
    const tab=state.shopTab||'gold';
    if(tab==='memory'&&window.GemwovenLiveOps?.MEMORY){nodes=memoryShop(nodes,p,state);shopTabs(nodes,tab);return shopExtras(shopPlates(nodes),state);}
    // Đá Ngọc tab: the three gold packs (progression.js GOLD_PACKS) beside Tinh Hoa and Thần Thạch, showing the real gold amount.
    const packs=tab==='gems'&&G.engine.goldShop?G.engine.goldShop():null;
    const goldRows=packs?packs.packs.map((x,i)=>({id:x.id,name:money('gold',x.gold),kind:'goldpack',currency:'gems',price:x.gems,asset:A['topup-coins-'+(i+1)]?'topup-coins-'+(i+1):'coins',pack:x})):[];
    // Trang Bị: one rarity at a time (Tốt / Hiếm / Sử Thi), chosen on the purchase board; it opens with the stage gate
    // of the forge (progression.js craftGate). Default: the best rarity already open.
    const gateOpen=r=>p.campaign.cleared>=M.craftGate(r);
    if(tab==='equipment'&&!GEAR_TIERS.includes(state.shopTier))state.shopTier=[...GEAR_TIERS].reverse().find(gateOpen)||GEAR_TIERS[0];
    const catalog=M.WORLD.SHOP.filter(row=>tab==='equipment'?row.kind==='gear'&&row.rarity===state.shopTier:row.kind==='resource'&&row.currency===(tab==='gold'?'gold':'gems')).concat(goldRows);
    const product=catalog.find(row=>row.id===state.shopProduct)||catalog[0],gear=product.kind==='gear',pack=product.kind==='goldpack';state.shopProduct=product.id;
    const left=product.limit?G.engine.shopLeft(product.id):Infinity,locked=gear&&!gateOpen(product.rarity);
    const quantity=product.kind==='resource'?Math.max(1,Math.min(state.quantity||1,20,left)):1,total=product.price*quantity;
    nodes=remove(nodes,/\.(product-(?!name$|description$|preview$)|price-|purchase-price$)/);
    nodes=shopShelf(nodes,catalog,product,p,state);
    state.shopPick=null;
    const preview=find(nodes,'product-preview');if(preview){preview.rect=[384,1180,200,250];preview.asset=product.asset;}
    action(nodes,'product-preview','art:shop-product',{product:product.id});
    label(nodes,'product-name',product.name);
    const limitNote=product.limit&&left<product.limit.n?`\nCòn ${left}/${product.limit.n} ${LEFT_WHEN[product.limit.per]}`:'';
    label(nodes,'product-description',state.shopMessage||(gear&&locked?`Mở khi vượt ải ${M.craftGate(product.rarity)}.`:product.description+limitNote));
    label(nodes,'quantity',quantity);
    action(nodes,'quantity-minus','art:quantity',{delta:-1},quantity<=1);action(nodes,'quantity-plus','art:quantity',{delta:1},quantity>=Math.min(20,left));
    const short=p.wallet[product.currency]<total;
    action(nodes,'buy','art:purchase',{product:product.id,count:quantity},short||left<1||locked||gear&&p.equipment.length>=500);
    label(nodes,'buy',locked?'{lock}Ải '+M.craftGate(product.rarity):left<1?'Hết lượt':'Mua\n'+money(product.currency,total));
    if(pack){const x=product.pack;label(nodes,'product-description',state.shopMessage||(packs.left?`Còn hôm nay\n${money('gold',packs.leftGold)}`:'Đã đổi đủ.\nMới lúc 00:00.'));
      action(nodes,'buy','art:gold-pack',{pack:x.id},!x.canBuy);label(nodes,'buy',x.fits?'Mua\n'+money('gems',x.gems):'Hết lượt');}
    // Gear is bought one at a time and the goldpack has no count: the stepper gives way (gear: to the rarity switch).
    if(gear||pack)nodes=remove(nodes,/\.quantity(-minus|-plus)?$/);
    if(gear)nodes.push(button('shop','rarity-switch',M.RARITIES[state.shopTier].name,[636,1238,224,82],'art:shop-rarity-open',{},{asset:'kit-row-on',icon:'forge-ingot-'+state.shopTier,iconRect:[10,12,72,56],labelRect:[80,0,114,82],size:29,className:'shop-rarity-switch r-'+state.shopTier+(state.shopRarityOpen?' is-open':'')}));
    if(gear&&state.shopRarityOpen)nodes=rarityChooser(nodes,p,state,gateOpen);
    shopTabs(nodes,tab);nodes=shopPlates(nodes);
    if(pack)find(nodes,'buy').rect=[630,1282,236,104];
    return shopExtras(nodes,state);
  }
  function shopShelf(nodes,catalog,product,p,state){
    catalog.slice(0,6).forEach((row,i)=>{
      const left=row.limit?G.engine.shopLeft(row.id):null,out=left===0,gear=row.kind==='gear',locked=gear&&p.campaign.cleared<M.craftGate(row.rarity);
      const packOut=row.kind==='goldpack'&&!row.pack.fits,tag=out||packOut?(gear?'Đã mua':'Hết'):row.limit&&!locked?`${row.limit.n}/${PER[row.limit.per]}`:'';
      const short=!out&&!packOut&&!locked&&p.wallet[row.currency]<row.price;
      nodes.push(shelfCard(i,row.id,gear?M.SLOTS[row.target]:SHELF_NAME[row.id]||row.name,money(row.currency,row.price),null,'art:shop-product',{product:row.id,...(tag?{tag}:{})},
        {icon:row.asset,iconRect:row.kind==='goldpack'?[12,16,68,50]:[18,13,56,56],selected:row.id===product.id,className:[row.kind==='goldpack'&&'shop-goldpack',(out||packOut)&&'is-out',locked&&'is-locked',short&&'is-short',row.id===state.shopPick&&'shop-pick'].filter(Boolean).join(' ')}));});
    return nodes;
  }
  // Trang Bị rarity chooser (Codex study raw/shop-shelf/mockup-gear-raw.png): below both shelves, over the purchase area,
  // the shelf left bright. A choice picks and closes; a locked one shows its stage and stays; a tap outside closes.
  function rarityChooser(nodes,p,state,gateOpen){
    nodes.push(button('shop','rarity-scrim','',[0,0,941,1672],'art:shop-rarity-close',{},{labelHidden:true,className:'shop-rarity-scrim'}),
      image('shop','rarity-panel','kit-parchment',[480,1144,420,336],{fit:'fill',className:'shop-rarity-panel'}));
    GEAR_TIERS.forEach((r,i)=>{const open=gateOpen(r),price=M.WORLD.SHOP.find(row=>row.kind==='gear'&&row.rarity===r)?.price||0;
      nodes.push(button('shop','rarity-'+r,M.RARITIES[r].name+'\n'+(open?money('gold',price):'{lock}Ải '+M.craftGate(r)),[500,1164+i*100,380,94],'art:shop-tier',{tier:r},{asset:'kit-row-read',icon:'forge-ingot-'+r,iconRect:[14,10,100,74],labelRect:[124,0,240,94],size:30,selected:r===state.shopTier,className:'shop-rarity-choice r-'+r+(open?'':' is-locked')}));});
    return nodes;
  }
  // Nạp (topup-ui.js) from the shop; a back arrow when the shop was opened from a resource popup ("Mua thêm").
  function shopExtras(nodes,state){
    nodes.push(button('shop','topup','Nạp',[724,560,180,86],'topup:open',{},{icon:'mana',iconRect:[18,14,52,58],labelRect:[64,0,104,86],size:32,className:'shop-topup'}));
    if(state.shopBack)nodes.push({...text('shop','back','Quay lại',[812,150,112,112]),kind:'button',asset:A['kit-back']?'kit-back':'map-back',fit:'contain',labelHidden:true,action:'nav:back',className:'panel-back'});
    return nodes;
  }
  // Four equal tabs on the wooden strip (Ký Ức joins Vàng / Đá Ngọc / Trang Bị).
  function shopTabs(nodes,tab){
    const base=find(nodes,'shop-tab-0');if(base&&!find(nodes,'shop-tab-3'))nodes.splice(nodes.indexOf(base)+3,0,{...base,id:'shop.shop-tab-3',text:'shop.shop-tab-3'});
    [['gold','Vàng'],['gems','Đá Ngọc'],['equipment','Trang Bị'],['memory','Ký Ức']].forEach(([id,name],i)=>{label(nodes,'shop-tab-'+i,name);action(nodes,'shop-tab-'+i,'art:shop-tab',{tab:id});Object.assign(find(nodes,'shop-tab-'+i),{selected:tab===id,rect:[112+i*186,758,181,82],size:29});});
  }
  // Codex review 27: larger round −/+ around the count; the buy plate carries "Mua" over the total in pictures.
  function shopPlates(nodes){
    for(const [id,rect] of [['quantity-minus',[634,1244,70,70]],['quantity-plus',[786,1244,70,70]],['quantity',[704,1252,82,52]],['buy',[630,1330,236,104]]]){const n=find(nodes,id);if(n)n.rect=rect;}
    return nodes;
  }
  // {gold} {gems} {dust} {lock} → the drawn icon, each line its own span (cards style the first as the name, the last
  // as the price). The accessible name keeps the words.
  const CUR_ICON={gold:'coins',gems:'mana',dust:'memory-dust',lock:'kit-lock'},CUR_WORD={gold:'vàng',gems:'Đá Ngọc',dust:'Bụi Ký Ức',lock:'Khóa'};
  const CUR_TOKEN=/\{(gold|gems|dust|lock)\}/;
  function shopIcons(){
    for(const el of document.querySelectorAll('#scene [data-node^="shop."] .copy-layer,#scene .node-text[data-node^="shop."]')){
      const raw=el.textContent;if(!CUR_TOKEN.test(raw))continue;
      el.replaceChildren(...raw.split('\n').map(line=>{const s=document.createElement('span');s.className='ln';
        for(const part of line.split(/(\{(?:gold|gems|dust|lock)\})/)){const m=/^\{(\w+)\}$/.exec(part);
          if(m&&A[CUR_ICON[m[1]]]){const img=document.createElement('img');img.src=A[CUR_ICON[m[1]]].file;img.alt='';img.draggable=false;img.className='cur cur-'+m[1];s.append(img);}else if(part)s.append(part);}
        return s;}));
      el.classList.add('has-cur');
      const host=el.closest('button');if(host)host.setAttribute('aria-label',raw.replace(/\{(\w+)\}/g,(_,k)=>(CUR_WORD[k]||'')+' ').replace(/\n/g,' · '));
    }
  }
  {const mount=G.mount;G.mount=(state,ctx)=>{const r=mount(state,ctx);if(state.screen==='shop')shopIcons();return r;};}
  function arena(nodes,p,state){
    const mode=state.arenaMode||'duel';
    find(nodes,'fighter-fire').asset='hero-novice';find(nodes,'fighter-ice').asset='hero-novice';label(nodes,'fighter-fire','Người chơi 1 · Hiro');label(nodes,'fighter-ice','Người chơi 2 · Hiro');
    action(nodes,'mode-solo','art:arena-mode',{mode:'duel'});action(nodes,'mode-boss','art:arena-mode',{mode:'boss'});find(nodes,'mode-solo').selected=mode==='duel';find(nodes,'mode-boss').selected=mode==='boss';
    action(nodes,'battle',mode==='duel'?'do:battle':'route:boss',mode==='duel'?{mode:'duel',index:1}:{});
    // Fighters stay clear of the hanging menu on the left.
    find(nodes,'fighter-fire').rect=[166,559,250,215];find(nodes,'fighter-ice').rect=[528,559,250,215];
    // Say what these really are (Codex UI review): a local duel on one device, and records kept on this device.
    // The podium opens what ranked play will be (Coming soon).
    for(const id of ['ranking','rank-one','rank-two','rank-three'])action(nodes,id,'growth:arena');
    label(nodes,'mode-solo','1v1\nCùng máy');label(nodes,'ranking','Đấu Hạng\nSắp ra mắt');label(nodes,'versus','VS · Cục bộ');
    find(nodes,'reward-gem').asset='exp-book';action(nodes,'rewards','route:boss');label(nodes,'rewards','Thưởng\nBoss');Object.assign(find(nodes,'rewards'),{labelRect:[6,190,151,66],size:28,iconRect:[38,20,88,86]});find(nodes,'reward-coins').rect=[774,1112,62,62];find(nodes,'reward-gem').rect=[842,1112,48,62];
    return nodes;
  }
  function forge(nodes,p,state){
    const tab=state.forgeTab||0,slot=state.forgeSlot||'weapon',rarity=state.forgeRarity||'uncommon';
    for(let i=0;i<3;i++){action(nodes,'forge-tab-'+i,'art:forge-tab',{index:i});find(nodes,'forge-tab-'+i).selected=i===tab;find(nodes,'forge-tab-'+i).rect=[73+i*271,852,267,98];}
    const gear=p.equipment.find(g=>g.slot===slot),name=M.SLOTS[slot];
    find(nodes,'floating-sword').asset=M.SLOT_ART[slot];find(nodes,'weapon-card').icon=find(nodes,'floating-sword').asset;action(nodes,'weapon-card','route:equipment');
    let c,level=0;
    if(tab===0){c=M.craftCost(rarity);const gate=M.craftGate(rarity);label(nodes,'weapon-card',name+' · '+M.RARITIES[rarity].name);label(nodes,'forge-level','Rèn '+M.RARITIES[rarity].name);label(nodes,'attack-preview','Mở sau ải '+gate);action(nodes,'forge-action','do:craft',{slot,rarity},p.campaign.cleared<gate||!affordable(p,c));label(nodes,'forge-action','CHẾ TẠO');}
    else if(tab===1){level=gear?.level||0;c=gear&&level<20?M.strengthenCost(gear):null;label(nodes,'weapon-card',gear?name+' · '+M.RARITIES[gear.rarity].name:'Chưa có trang bị');label(nodes,'forge-level',gear?`+${level} → +${Math.min(20,level+1)}`:'Chưa có trang bị');label(nodes,'attack-preview','Chỉ số trang bị +8% mỗi cấp');action(nodes,'forge-action','do:strengthen',{id:gear?.id||''},!gear||level>=20||!affordable(p,c));label(nodes,'forge-action','CƯỜNG HÓA');}
    else{label(nodes,'forge-level','Khảm Ngọc');label(nodes,'attack-preview','Tính năng sắp ra mắt');action(nodes,'forge-action','do:soon',{feature:'Khảm ngọc'});label(nodes,'forge-action','COMING SOON');}
    label(nodes,'weapon-stars',tab===0?M.RARITIES[rarity].name:gear?M.RARITIES[gear.rarity].name:'');label(nodes,'success-rate',tab===2?'Coming soon':'Tỷ lệ thành công: 100%');
    // The card caption already names the rarity; the old line under it overlapped the frame.
    nodes=remove(nodes,/\.weapon-stars$/);
    Object.assign(find(nodes,'floating-sword'),{rect:[368,414,200,200]});
    Object.assign(find(nodes,'forge-subtitle-board'),{rect:[286,326,304,104]});Object.assign(find(nodes,'forge-subtitle'),{rect:[312,342,252,72],size:27});
    Object.assign(find(nodes,'materials-title'),{rect:[400,1124,462,38],size:29});Object.assign(find(nodes,'success-rate'),{rect:[400,1284,462,36],size:28});
    Object.assign(find(nodes,'forge-action'),{rect:[440,1322,332,100]});
    nodes=materials(nodes,'forge',p,c,[396,1164,470,118],'forge-materials');
    // Slot and rarity chips: 96-stage-px touch rows (40 CSS px on a phone), plank art inset.
    const row=(items,y,make)=>{const gap=6,need=items.map(([,label])=>Math.max(104,ems(label)*28+44)),room=756-gap*(items.length-1),total=need.reduce((a,b)=>a+b,0);let x=162;
      items.forEach((item,i)=>{const w=need[i]+(room-total)/items.length;nodes.push(make(item,[x,y,w,98]));x+=w+gap;});};
    row(Object.entries(M.SLOTS),616,([id,name],rect)=>button('forge','slot-'+id,name,rect,'do:forge-slot',{slot:id},{asset:'tab-wood',size:28,tone:'gold',selected:slot===id,className:'forge-chip'}));
    if(tab===0)row(M.CRAFT_RARITIES.map(r=>[r,M.RARITIES[r].name]),716,([r,name],rect)=>button('forge','rarity-'+r,name,rect,'art:forge-rarity',{rarity:r},{asset:'tab-wood',size:28,tone:'gold',selected:rarity===r,className:'forge-chip'}));
    return nodes;
  }
  function footer(nodes,key){
    nodes=remove(nodes,/\.(nav-label-board|nav-active-label)$/);
    const order=['home','upgrade','inventory','skills','summon','arena','more'],selected=order.includes(key)?key:'more',index=order.indexOf(selected),name=['Trang Chủ','Tướng','Túi Đồ','Kỹ Năng','Triệu Hồi','Đấu Trường','Thêm'][index];
    for(const n of nodes)if(n.role==='nav')n.selected=n.action==='route:'+selected;
    // Only the tab you are on shows its name, on a plate; the others are their icons alone (owner 08/11).
    nodes.push(image(key,'nav-label-board','nameplate',[4+index*130,1600,156,60],{fit:'fill'}),text(key,'nav-active-label',name,[14+index*130,1608,136,42],28));
    return nodes;
  }
  const oldDecorate=G.decorate;
  G.decorate=state=>{
    const key=state.screen,p=G.engine.read();let nodes;
    if(key==='skills'||key==='inventory')nodes=clone(L.screens[key].nodes);
    else if(key==='quests'){nodes=clone(originals.tavern).map(n=>{const id=n.id.replace(/^tavern\./,'quests.');if(n.text)C[id]=C[n.text];return {...n,id,text:n.text?id:undefined};});L.screens.quests.backgroundKey='tavern';}
    else if(key==='home'){oldDecorate(state);nodes=L.screens.home.nodes;}
    else if(originals[key]?.length)nodes=clone(originals[key]);
    else{oldDecorate(state);nodes=L.screens[key].nodes;}
    if(key==='skills')nodes=skills(nodes,p,state);
    if(key==='inventory')nodes=bag(nodes,p,state);
    if(key==='summon')nodes=summon(nodes,p,state);
    if(key==='quests'||key==='tavern')nodes=quests(nodes,p,state,key);
    if(key==='upgrade')nodes=upgrade(nodes,p,state);
    if(key==='shop')nodes=shop(nodes,p,state);
    if(key==='arena')nodes=arena(nodes,p,state);
    if(key==='forge')nodes=forge(nodes,p,state);
    nodes=footer(nodes,key);
    for(const n of nodes){
      const suffix=n.id.split('.').slice(1).join('.');
      if(suffix==='gold')C[n.text]=short(p.wallet.gold);if(suffix==='gems')C[n.text]=short(p.wallet.gems);if(suffix==='level')C[n.text]=p.heroes[p.selected].level;
      if(suffix==='gems-plus')n.action='route:topup';if(suffix==='profile')n.icon=A['face-'+p.selected]?'face-'+p.selected:'portrait-'+p.selected;
      if(n.action==='route:tavern')n.action='route:quests';
      if(key==='home'&&n.id.startsWith('home.feature-')){n.labelHidden=false;n.labelRect=[3,79,90,26];n.iconRect=[26,15,45,54];n.size=18;}
    }
    L.screens[key].nodes=nodes;return p;
  };
  // Fusion sheet: each step shows two spares of a star becoming one of the next, its fee as icons + numbers (green/red),
  // and a Luyện button. Words kept to the title, Luyện and the shortfall.
  function sparesDialog(ctx,hero){
    const modal=window.GemwovenUI.makeDialog('star-spares','Luyện bản dư','growth-dialog spares-dialog');
    const face=`<img src="${A['portrait-'+hero]?.file||''}" alt="">`,need=(have,n)=>`<b class="${have>=n?'ok':'short'}">${tight(n)}</b>`;
    const draw=()=>{const p=G.engine.read(),h=p.heroes[hero];if(!h){modal.close();return;}const st=M.spares(h),plan=M.starPlan(hero,h);
      const card=s=>`<span class="sp-card${plan&&s===plan.fodderStar?' is-need':''}">${face}<i>${s}★</i><em>×${st[s]}</em></span>`;
      modal.body.innerHTML=[1,2,3,4].map(s=>{const f=M.REFINE[s],ok=st[s]>=2&&owned(p,'gold')>=f.gold&&owned(p,'essence')>=f.essence;
        return `<div class="sp-step">${card(s)}<span class="sp-two">×2</span><img class="sp-arrow" src="${A['vip-pass-scroll-arrow']?.file||''}" alt="">${card(s+1)}`+
          `<span class="sp-fee"><span><img src="${A[M.RESOURCES.gold[1]]?.file||''}" alt="">${need(owned(p,'gold'),f.gold)}</span><span><img src="${A[M.RESOURCES.essence[1]]?.file||''}" alt="">${need(owned(p,'essence'),f.essence)}</span></span>`+
          `<button type="button" class="gw-btn sp-go" data-to="${s+1}" ${ok?'':'disabled'}>Luyện</button></div>`;}).join('')+
        (plan&&!plan.ok?`<p class="sp-short">Thiếu ${plan.rawShort} bản 1★</p>`:'');
      modal.body.querySelectorAll('.sp-go').forEach(b=>b.onclick=()=>{const to=+b.dataset.to;let ok=false;try{G.engine.refineCopy(hero,to);ok=true;}catch(e){ctx.toast?.(e.message);}draw();ctx.render();
        if(ok)document.dispatchEvent(new CustomEvent('gemwoven:spare-merged',{detail:{el:modal.body.querySelectorAll('.sp-step')[to-2]?.querySelector('.sp-card:last-of-type')}}));});};
    draw();modal.present();
  }
  const oldHandle=G.handle;
  G.handle=(act,el,ctx,state)=>{
    if(act.startsWith('item:')){
      const id=act.slice(5),asset=M.RESOURCES[id]?.[1]||id,item=inventory.find(row=>row[0]===asset);
      // Item card: picture, use, where it comes from and how many are owned.
      if(item){const source=SOURCES[resourceFor[asset]];ctx.showModal(item[1],[asset],item[4]+(source?'\nNguồn: '+source.replace(/\n/g,' · '):'')+'\nĐang có: '+item[2]);return true;}
      // Gold and Đá Ngọc are not bag items; a reward tile still opens their card, read from the wallet.
      const cur=Object.keys(CURRENCY).find(k=>k===id||M.RESOURCES[k][1]===id);
      if(cur){ctx.showModal(M.RESOURCES[cur][0],[M.RESOURCES[cur][1]],CURRENCY[cur]+'\nĐang có: '+fmt(G.engine.read().wallet[cur]));return true;}
    }
    if(!act.startsWith('art:'))return oldHandle(act,el,ctx,state);
    const d=el.dataset,command=act.slice(4);
    if(command==='quest')state.dailyQuest=+d.index;
    if(command==='fragments'){state.category='fragment';state.bagPage=0;ctx.navigate('inventory');return true;}
    if(command==='shop-resource'){state.shopResource=d.resource;state.quantity=1;}
    if(command==='memory-open'){state.shopTab='memory';state.shopMessage='';if(state.screen!=='shop'){ctx.navigate('shop');return true;}}
    if(command==='memory-pick'){state.memoryHero=d.hero;state.shopMessage='';}
    if(command==='memory-buy'){try{const r=G.engine.buyMemory(d.hero);state.shopMessage=`Đã nhận ${r.fragments} mảnh ${M.HEROES[r.hero].name}.`;}catch(error){state.shopMessage=error.message;}}
    if(command==='memory-info'){const X=window.GemwovenLiveOps?.MEMORY,v=G.engine.memory();if(!X)return true;
      ctx.showModal('Bụi Ký Ức',['memory-dust'],`${X.desc} · đang có ${fmt(v.dust)}.\nNguồn: bản dư tướng 6★ ${X.copyDust} · mảnh dư 6★ ${X.fragmentDust} · nhiệm vụ tuần ${X.weeklyDust} · Cúp Đấu Trường ${X.cupDust}/tháng (máy chủ, sắp ra mắt). Hiro không đổi bụi.\nKệ làm mới Thứ Hai 00:00 (GMT+7): tối đa ${X.heroesPerWeek} tướng lần lượt, không Hiro, không tướng đang banner, đã qua ${X.minDaysSinceFirstBanner} ngày từ banner đầu.\n${X.bundle} mảnh = ${X.price*X.bundle} bụi · tối đa ${X.capPerHeroWeek} mảnh/tướng/tuần · 80 mảnh ghép một tướng.`);return true;}
    // Trang Bị rarity: an open rarity keeps the chosen slot and closes the chooser; a locked one only shows its stage.
    if(command==='shop-rarity-open')state.shopRarityOpen=!state.shopRarityOpen;
    if(command==='shop-rarity-close')state.shopRarityOpen=false;
    if(command==='shop-tier'){if(G.engine.read().campaign.cleared<M.craftGate(d.tier))return true;const slot=M.WORLD.SHOP.find(row=>row.id===state.shopProduct)?.target||'weapon';
      state.shopTier=d.tier;state.shopProduct=d.tier+'-'+slot;state.shopRarityOpen=false;state.shopMessage='';}
    if(command==='shop-tab'){state.shopTab=d.tab;state.shopTier=null;state.shopProduct=null;state.quantity=1;state.shopMessage='';state.shopRarityOpen=false;}
    if(command==='shop-product'&&/^gold-pack-/.test(d.product)){state.shopProduct=d.product;state.shopTab='gems';state.quantity=1;state.shopMessage='';if(state.screen!=='shop'){ctx.navigate('shop');return true;}}
    else if(command==='shop-product'){const product=M.WORLD.SHOP.find(row=>row.id===d.product);if(!product)return true;state.shopProduct=product.id;state.shopTab=product.kind==='gear'?'equipment':product.currency;if(product.kind==='gear')state.shopTier=product.rarity;state.quantity=1;state.shopMessage='';state.shopRarityOpen=false;if(state.screen!=='shop'){ctx.navigate('shop');return true;}}
    if(command==='purchase'){try{const r=G.engine.purchase(d.product,Number(d.count));state.shopMessage='Đã nhận '+M.WORLD.SHOP.find(row=>row.id===r.product).name+' ×'+r.count+'.';}catch(error){state.shopMessage=error.message;}}
    if(command==='gold-pack'){try{const r=G.engine.buyGold(d.pack);state.shopMessage=`Đã nhận ${money('gold',r.gold)}`;}catch(error){state.shopMessage=error.message;}}
    if(command==='quantity')state.quantity=Math.max(1,Math.min(20,(state.quantity||1)+Number(d.delta)));
    if(command==='arena-mode')state.arenaMode=d.mode;
    if(command==='forge-tab')state.forgeTab=+d.index;
    if(command==='forge-rarity')state.forgeRarity=d.rarity;
    if(command==='level-step')state.levelStep=state.levelStep===10?1:10;
    if(command==='level'){try{const r=G.engine.levelUp(d.hero,Number(d.count));ctx.render();if(r.tickets)G.showRewards(ctx,{tickets:r.tickets});}catch(error){ctx.render();ctx.showModal('Chưa thể tăng cấp',[],error.message);}return true;}
    if(command==='skill-soon'){ctx.showModal('Nhánh Kỹ Năng · Sắp ra mắt',['skill-lock'],'Các nhánh này chưa phát hành. Hiện mỗi tướng có 4 kỹ năng: Chủ Động, Bị Động, Biến Dị và Chân Thân.');return true;}
    if(command==='spares'){sparesDialog(ctx,d.hero||state.hero);return true;}
    if(command==='evolution-perks'){
      const hero=d.hero||state.hero,h=G.engine.read().heroes[hero],now=h?.evolution||0;
      ctx.showModal('Mốc tiến hóa · '+M.HEROES[hero].name,[],M.EVOLUTION.map((e,i)=>`${i<now?'✓':'○'} Tiến hóa ${i+1} · cấp ${e.level}, ${e.stars} sao: ${e.perk}. ${e.name}.`).join('\n'));return true;
    }
    ctx.render();return true;
  };
})();
