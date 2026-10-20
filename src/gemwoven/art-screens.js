/* Bind progression to the existing illustrated screens, preserving every art layer. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY,H=window.GEMWOVEN_HEROES;
  const originals=Object.fromEntries(Object.entries(L.screens).map(([key,s])=>[key,s.nodes.map(n=>({...n}))]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),short=n=>n>=1000000?(n/1000000).toFixed(1)+'M':n>=10000?(n/1000).toFixed(1)+'K':fmt(n);
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
  function materials(nodes,key,p,cost,rect,prefix){
    nodes=remove(nodes,new RegExp('\\.'+prefix+'-'));
    const entries=Object.entries(cost||{}).filter(([,n])=>n>0),[x,y,w,h]=rect,cw=w/Math.max(1,entries.length);
    entries.forEach(([id,n],i)=>{
      const available=id==='copies'?p.copies:owned(p,id),icon=id==='copies'?'portrait-'+(p.materialHero||p.selected):M.RESOURCES[id]?.[1]||'hero-fragment',well=h*.67,iconSize=Math.min(66,h*.52,cw-25);
      nodes.push(button(key,prefix+'-'+i,`${short(available)} / ${short(n)}`,[x+i*cw+7,y,cw-14,h],'item:'+id,{}, {asset:'inventory-slot',icon,iconRect:[(cw-14-iconSize)/2,(well-iconSize)/2,iconSize,iconSize],labelRect:[0,well+3,cw-14,h-well-3],size:Math.min(entries.length>3?19:23,h*.22),tone:'gold',className:'material-tile '+(available>=n?'material-enough':'material-missing')}));
    });return nodes;
  }
  H.novice={...M.HEROES.novice,color:'#d3bd8b',weapon:'stat-attack',skills:[
    ['Nhát Kiếm Cơ Bản','Một nhát kiếm gỗ gây 45 sát thương cơ bản. Mỗi cấp sau cấp 1 tăng 8% sức mạnh tuyệt kỹ.','Sức mạnh tuyệt kỹ +8% mỗi cấp'],
    ['Giữ Thế','Giảm 2% sát thương nhận vào; mỗi cấp sau tăng thêm 0,2%.','Phòng thủ thêm 0,2% mỗi cấp'],
    ['Bước Tiến','Khi mở biến dị, mỗi lượt hồi 1% HP tối đa.','Hồi phục 1% HP tối đa mỗi lượt'],
    ['Ý Chí Lữ Khách','Thức tỉnh sức bền và tăng sức mạnh trong toàn trận.','Tăng HP và sức tấn công toàn trận']
  ]};
  ['stat-attack','stat-shield','stat-heart','crest'].forEach((asset,i)=>A['skill-novice-'+i]=A[asset]);
  const inventory=window.GEMWOVEN_INVENTORY,resourceFor={},gearFor={};
  function prepare(state){
    const p=G.engine.read();state.hero=state.hero in M.HEROES?state.hero:p.selected;
    const descriptions={gold:'Vàng từ nhiệm vụ, vượt ải, boss và tích lũy offline.',gems:'Đá Ngọc chỉ nhận qua nạp tiền. Tính năng nạp sắp ra mắt.',tickets:'Vé nhận từ nhiệm vụ ngày và các mốc cấp tướng.',exp:'Sách kinh nghiệm dùng tăng cấp tướng.',seals:'Ấn tu luyện dùng tăng cấp tướng, tối đa 1.600 ấn mỗi ngày.',skillBooks:'Bí kíp dùng học và tăng cấp kỹ năng.',essence:'Tinh hoa dùng tăng sao, tiến hóa và phát triển kỹ năng.',ore:'Quặng dùng rèn và cường hóa trang bị.',wood:'Gỗ dùng rèn trang bị.',cloth:'Vải dùng rèn trang bị.',divineOre:'Ghép đủ 50 mảnh để rèn trang bị Thần sau ải 300.'};
    const rows=Object.entries(M.RESOURCES).map(([id,[name,asset]])=>{resourceFor[asset]=id;return [asset,name,fmt(owned(p,id)),['exp','skillBooks'].includes(id)?'book':['ore','wood','cloth','essence','divineOre','seals'].includes(id)?'material':id==='tickets'?'other':'item',descriptions[id]];});
    for(const [hero,h]of Object.entries(M.HEROES)){const asset='fragment-'+hero;A[asset]=A['portrait-'+hero];rows.push([asset,'Mảnh '+h.name,fmt(p.fragments[hero]||0),'fragment','Ghép 80 mảnh cùng loại thành một tướng hoặc bản sao.']);}
    for(const gear of p.equipment){const asset='gear-'+gear.id;A[asset]=A[M.SLOT_ART[gear.slot]]||A['helmet'];gearFor[asset]=gear;rows.push([asset,M.SLOTS[gear.slot]+' +'+gear.level,'1','gear',M.RARITIES[gear.rarity].name+(gear.affix?' · '+M.AFFIXES[gear.affix].desc:'')]);}
    for(const d of M.WORLD.EXPANSION.definitions){const c=M.counterProgress(p,d.chapter);if(c.shards)rows.push([d.counterKey,d.counter,c.shards+'/12','other',d.counterText+' Tự dùng đúng chủ đề; bậc '+c.rank+'/4.']);}
    inventory.splice(0,inventory.length,...rows);
    if(state.screen==='inventory'){
      const visible=rows.filter(r=>state.category==='all'||r[3]===state.category);
      if(!visible.some(r=>r[0]===state.bagItem))state.bagItem=visible[0]?.[0]||'';
    }
  }
  const rebuild=window.GEMWOVEN_REBUILD;
  window.GEMWOVEN_REBUILD=state=>{prepare(state);rebuild(state);};
  function skills(nodes,p,state){
    const key='skills',hero=state.hero,h=p.heroes[hero],i=state.skill||0,filter=state.skillFilter??'all';
    nodes=remove(nodes,/\.skill-materials-/);
    for(const n of nodes){
      const id=n.id.split('.').slice(1).join('.');
      if(/^branch-\d$/.test(id)){const branch=+id.slice(-1);n.action='do:skill-filter';n.data={filter:branch};n.selected=String(filter)===String(branch);}
      if(/^roster-/.test(id)){n.action='do:hero';n.data={hero:id.slice(7)};n.selected=id==='roster-'+hero;}
      if(/^node-\d$/.test(id)){const index=+id.slice(-1);n.action='do:skill-node';n.data={index};n.className+=' skill-live'+(!h||!M.skillUnlock(h,index)?' skill-unavailable':'');}
      if(/^node-level-/.test(id))C[n.text]=`${h?.skills[+id.slice(-1)]||0}/10`;
    }
    if(filter!=='all')nodes=nodes.filter(n=>!(/\.(link-|locked-)/.test(n.id)||/\.(node-|node-level-)\d$/.test(n.id)&&!n.id.endsWith('-'+filter)));
    label(nodes,'hero-name-'+hero,`${h?'Lv.'+h.level:'Chưa sở hữu'} · ${M.HEROES[hero].name}`);
    label(nodes,'skill-level',`Lv.${h?.skills[i]||0} / 10`);
    const unlock=h&&M.skillUnlock(h,i),requirement=!h?'Cần sở hữu tướng.':i===1?'Mở ở cấp 10.':i===2?'Mở ở cấp 100, tiến hóa 2.':i===3?'Mở ở cấp 400, tiến hóa 5.':'';
    label(nodes,'next-effect-'+hero+'-'+i,unlock?H[hero].skills[i][2]:requirement);
    let c;try{if(h)c=M.skillCost(h,i);}catch{}
    label(nodes,'materials-title',c?'Nguyên liệu tăng cấp':h?.skills[i]>=10?'Đã đạt cấp tối đa':'Điều kiện mở kỹ năng');
    nodes=materials(nodes,key,p,c,[59,1277,409,110],'skill-materials');
    action(nodes,'upgrade-skill','do:train',{hero,index:i},!affordable(p,c));label(nodes,'upgrade-skill',h?.skills[i]>=10?'Đã Tối Đa':'Tăng Cấp');
    if(!c)nodes.push(text(key,'unlock-requirement',requirement,[70,1285,390,80],25));
    nodes.push(button(key,'tree-all','Cây kỹ năng',[658,926,230,45],'do:skill-filter',{filter:'all'},{asset:'nameplate',selected:filter==='all',size:23}));
    return nodes;
  }
  function bag(nodes,p,state){
    for(const n of nodes){if(n.id.startsWith('inventory.category-')){n.rect=[15,n.rect[1],215,85];n.labelRect=[58,24,150,35];n.size=21;n.className='inventory-category';}if(n.action?.startsWith('bag-item:')){n.labelHidden=true;delete n.labelAsset;n.iconRect=[24,12,107,107];}}
    const asset=state.bagItem,item=inventory.find(r=>r[0]===asset);if(!item)return nodes;
    nodes=remove(nodes,/\.(recipe-|held-|source-icon$)/);
    label(nodes,'source',resourceFor[asset]==='gems'?'Nạp tiền\nComing soon':item[3]==='fragment'?'Triệu hồi\nBoss chương':item[3]==='gear'?'Triệu hồi\nLò rèn':'Nhiệm vụ · Vượt ải\nBoss · Offline');
    nodes.push(text('inventory','held-label','Số lượng đang có',[599,1310,260,32],23),text('inventory','held-count',item[2],[599,1347,260,39],31));
    if(item[3]==='fragment'){const hero=asset.slice(9);action(nodes,'item-action','do:fuse',{hero},(p.fragments[hero]||0)<80);label(nodes,'item-action','Ghép Tướng');}
    else{const route=item[3]==='gear'?'equipment':item[3]==='book'?(asset==='exp-book'?'upgrade':'skills'):asset==='ticket'?'summon':asset==='mana'?'vip':'campaign';action(nodes,'item-action','route:'+route);label(nodes,'item-action',item[3]==='gear'?'Trang Bị':item[3]==='book'?'Sử Dụng':asset==='mana'?'Coming Soon':'Đi Tới');}
    const product=M.WORLD.SHOP.find(row=>row.kind==='resource'&&row.target===resourceFor[asset]);
    const counterDef=M.WORLD.EXPANSION.definitions.find(d=>d.counterKey===asset);
    if(counterDef){action(nodes,'item-action','guide:chapter',{chapter:counterDef.chapter});label(nodes,'item-action','Đến Chương');label(nodes,'source','Tinh anh 3 sao\nMốc 10 / 20 / 30 / 40');}
    if(product)nodes.push(button('inventory','purchase','Mua thêm',[590,1395,280,62],'art:shop-product',{product:product.id},{size:24}));
    return nodes;
  }
  function summon(nodes,p,state){
    nodes=remove(nodes,/\.(guarantee|one-cost|ten-cost|featured-(?:fire|ice|earth|lightning|shadow)|portrait-(?:ice|earth|lightning|shadow))$/);
    action(nodes,'summon-one','do:summon',{count:1});action(nodes,'summon-ten','do:summon',{count:10});action(nodes,'central-crystal','do:summon',{count:1});action(nodes,'summon-details','do:rates');action(nodes,'fragments','art:fragments');
    for(const id of ['summon-one','summon-ten']){const n=find(nodes,id);n.labelRect=[24,48,225,35];n.size=31;}
    const featured=find(nodes,'portrait-fire');featured.icon='portrait-'+M.SUMMON_BANNER.hero;featured.action='hero:'+M.SUMMON_BANNER.hero;featured.rect=[350,366,240,285];featured.iconRect=[38,55,164,165];
    label(nodes,'subtitle',M.SUMMON_BANNER.title+'\nMột tướng nổi bật trong kỳ này');
    find(nodes,'featured-board').rect=[55,1170,832,170];label(nodes,'featured-title','Trang Bị Nổi Bật');label(nodes,'featured-note','Huyền Thoại · Thần\nTỷ lệ chi tiết bên dưới');find(nodes,'featured-note').rect=[575,1210,270,85];
    [['fire-sword','Kiếm Huyền Thoại','weapon','legendary'],['helmet','Giáp Thần','armor','divine'],['boots','Ủng Huyền Thoại','boots','legendary']].forEach(([asset,name,slot,rarity],i)=>nodes.push(button('summon','featured-gear-'+i,name,[85+i*150,1220,133,96],'journey:featured-gear',{slot,rarity,asset}, {asset:'inventory-slot',icon:asset,iconRect:[31,2,70,65],labelRect:[5,68,123,24],size:17,tone:'gold',className:'featured-equipment'})));
    label(nodes,'pity-label',`Còn ${300-p.summon.dry} lần tới bảo đảm tướng hiếm`);label(nodes,'pity-value',`${p.summon.dry} / 300`);find(nodes,'pity-meter').value=p.summon.dry/300;
    nodes.push(button('summon','ticket-balance',`${fmt(p.wallet.tickets)} Vé Triệu Hồi`,[320,1130,301,40],'item:ticket',{},
      {asset:'nameplate',icon:'ticket',iconRect:[14,3,36,34],labelRect:[53,5,234,28],size:21}));
    return nodes;
  }
  function quests(nodes,p,state,key){
    const index=Math.max(0,Math.min(M.DAILY.length-1,state.dailyQuest||0)),q=M.DAILY[index],progress=p.daily.progress[q.id]||0,claimed=p.daily.claimed.includes(q.id);
    label(nodes,'quest-heading','Nhiệm Vụ Ngày');find(nodes,'quest-heading').size=24;
    label(nodes,'quest-name',q.name);label(nodes,'quest-description',`Tiến độ: ${fmt(Math.min(progress,q.target))} / ${fmt(q.target)} · Làm mới 00:00 GMT+7`);
    label(nodes,'quest-accept',claimed?'Đã Nhận':progress>=q.target?'Nhận Thưởng':'Chưa Hoàn Thành');action(nodes,'quest-accept','do:daily',{quest:q.id},claimed||progress<q.target);
    action(nodes,'quest-dismiss','route:home');
    ['Ghé Thăm','Vượt Ải','Boss','Chi Tiêu'].forEach((name,i)=>{label(nodes,'tavern-tab-'+i,name);action(nodes,'tavern-tab-'+i,'art:quest',{index:i});find(nodes,'tavern-tab-'+i).selected=index===i;});
    nodes=materials(nodes,key,p,q.reward,[288,1320,305,84],'quest-rewards');
    // Rewards show the awarded amount, rather than a material cost ratio.
    Object.entries(q.reward).forEach(([id,n],i)=>label(nodes,'quest-rewards-'+i,short(n)));
    return nodes;
  }
  function upgrade(nodes,p,state){
    const hero=state.hero,h=p.heroes[hero],tab=state.upgradeTab||'level';let c=null,disabled=true;
    for(const [i,t]of ['level','stars','evolution'].entries()){action(nodes,'upgrade-tab-'+i,'do:upgrade-tab',{tab:t});find(nodes,'upgrade-tab-'+i).selected=tab===t;}
    for(const n of nodes){if(n.id.startsWith('upgrade.choose-')){n.action='do:hero';n.data={hero:n.id.slice(15)};n.selected=n.data.hero===hero;}}
    action(nodes,'evolution-next','do:upgrade-tab',{tab:'evolution'});
    if(h){
      const stats=M.stats(p,hero),preview=JSON.parse(JSON.stringify(p));if(h.level<500)preview.heroes[hero].level++;const next=M.stats(preview,hero);
      label(nodes,'stat-value-0',`${fmt(stats.hp)} → ${fmt(next.hp)}`);label(nodes,'stat-value-1',`×${stats.attack.toFixed(2)} → ×${next.attack.toFixed(2)}`);label(nodes,'stat-value-2',`${Math.round(stats.defense*100)}%`);label(nodes,'hero-stars','★'.repeat(h.stars)+'☆'.repeat(6-h.stars));label(nodes,'exp-value',`Cấp ${h.level} / 500`);find(nodes,'exp-meter').value=h.level/500;
      if(tab==='level'){if(h.level<500)c=M.levelCost(h.level);label(nodes,'level-preview',`Lv.${h.level} → Lv.${Math.min(500,h.level+1)}`);label(nodes,'upgrade-material-title','Nguyên liệu tăng cấp');disabled=!affordable(p,c);action(nodes,'upgrade-action','do:level',{hero},disabled);label(nodes,'upgrade-action',h.level===500?'Đã Tối Đa':'Tăng Level');}
      if(tab==='stars'){const s=h.stars<6?M.starCost(h.stars):null;c=s?{copies:s.copies,gold:s.gold,essence:s.essence}:null;label(nodes,'level-preview',`${h.stars} sao → ${Math.min(6,h.stars+1)} sao`);label(nodes,'upgrade-material-title','Bản sao · Vàng · Tinh hoa');disabled=!s||h.copies-1<s.copies||!affordable(p,{gold:s.gold,essence:s.essence});action(nodes,'upgrade-action','do:star',{hero},disabled);label(nodes,'upgrade-action','Tăng Sao');}
      if(tab==='evolution'){const e=M.EVOLUTION[h.evolution];c=e?{gold:e.gold,essence:e.essence,ore:e.ore}:null;label(nodes,'level-preview',`Tiến hóa ${h.evolution} / 6`);label(nodes,'upgrade-material-title',e?`Cần cấp ${e.level} · ${e.stars} sao`:'Đã lột xác toàn thân');disabled=!e||h.level<e.level||h.stars<e.stars||!affordable(p,c);action(nodes,'upgrade-action','do:evolve',{hero},disabled);label(nodes,'upgrade-action','Tiến Hóa');}
      find(nodes,'upgrade-material-panel').rect=[200,1096,541,230];
      find(nodes,'upgrade-material-title').rect=[236,1124,469,35];
      nodes=materials(nodes,'upgrade',{...p,copies:h.copies-1,materialHero:hero},c,[237,1170,467,130],'upgrade-materials');
      nodes.push(button('upgrade','select-active',p.selected===hero?'Đang xuất chiến':'Xuất chiến',[582,636,174,59],'do:select',{hero},{size:21,disabled:p.selected===hero}));
    }else{
      nodes=remove(nodes,/\.(stat-value-|upgrade-materials-)/);label(nodes,'level-preview','Chưa sở hữu');label(nodes,'exp-value',`${p.fragments[hero]||0} / 80 mảnh`);label(nodes,'hero-stars','☆☆☆☆☆☆');label(nodes,'upgrade-material-title','Ghép 80 mảnh để mở tướng');action(nodes,'upgrade-action','do:fuse',{hero},(p.fragments[hero]||0)<80);label(nodes,'upgrade-action','Ghép Tướng');find(nodes,'exp-meter').value=(p.fragments[hero]||0)/80;
    }
    label(nodes,'exp-label','CẤP');find(nodes,'exp-crystal').asset='exp-book';
    nodes.push(button('upgrade','choose-novice','Tân',[660,711,61,66],'do:hero',{hero:'novice'},{asset:'avatar-ring',icon:'portrait-novice',iconRect:[12,8,37,48],labelHidden:true,selected:hero==='novice'}));
    return nodes;
  }
  function shop(nodes,p,state){
    const tab=state.shopTab||'gold',catalog=M.WORLD.SHOP.filter(row=>tab==='equipment'?row.kind==='gear':row.kind==='resource'&&row.currency===(tab==='gold'?'gold':'gems'));
    const product=catalog.find(row=>row.id===state.shopProduct)||catalog[0],quantity=product.kind==='gear'?1:state.quantity||1;state.shopProduct=product.id;
    nodes=remove(nodes,/\.(product-(?!name$|description$|preview$)|price-)/);
    catalog.forEach((row,i)=>nodes.push(button('shop','product-'+row.id,row.name,[105+i%6*123,846+Math.floor(i/6)*126,115,120],'art:shop-product',{product:row.id},{asset:'inventory-slot',icon:row.asset,iconRect:[15,7,87,94],labelHidden:true,selected:row.id===product.id})));
    label(nodes,'product-name',product.name);label(nodes,'product-description',state.shopMessage||product.description);find(nodes,'product-preview').asset=product.asset;
    action(nodes,'product-preview','art:shop-product',{product:product.id});label(nodes,'quantity',quantity);label(nodes,'purchase-price',fmt(product.price*quantity)+(product.currency==='gold'?' vàng':' Ngọc'));action(nodes,'quantity-minus','art:quantity',{delta:-1},quantity<=1);action(nodes,'quantity-plus','art:quantity',{delta:1},product.kind==='gear'||quantity>=20);action(nodes,'buy','art:purchase',{product:product.id,count:quantity},p.wallet[product.currency]<product.price*quantity||product.kind==='gear'&&p.equipment.length>=500);
    [['gold','Đồng Vàng'],['gems','Đá Ngọc'],['equipment','Trang Bị']].forEach(([id,name],i)=>{label(nodes,'shop-tab-'+i,name);action(nodes,'shop-tab-'+i,'art:shop-tab',{tab:id});find(nodes,'shop-tab-'+i).selected=tab===id;});
    return nodes;
  }
  function arena(nodes,p,state){
    const mode=state.arenaMode||'duel';
    find(nodes,'fighter-fire').asset='hero-novice';find(nodes,'fighter-ice').asset='hero-novice';label(nodes,'fighter-fire','Người chơi 1 · Tân');label(nodes,'fighter-ice','Người chơi 2 · Tân');
    action(nodes,'mode-solo','art:arena-mode',{mode:'duel'});action(nodes,'mode-team','art:arena-mode',{mode:'team'});find(nodes,'mode-solo').selected=mode==='duel';find(nodes,'mode-team').selected=mode==='team';
    action(nodes,'battle',mode==='duel'?'do:battle':'do:soon',mode==='duel'?{mode:'duel',index:1}:{feature:'Đội 3vs3'});label(nodes,'battle',mode==='duel'?'Chiến Đấu':'Coming Soon');
    nodes.push(button('arena','boss-mode','Boss Vô Hạn',[332,1340,303,72],'route:boss',{}, {size:30}),button('arena','practice-ai','Đấu tập AI',[332,1423,303,49],'do:battle',{mode:'pvp',index:1},{asset:'tab-wood',tone:'gold',size:23}));
    find(nodes,'reward-gem').asset='exp-book';action(nodes,'rewards','route:boss');label(nodes,'rewards','Thưởng Boss');
    return nodes;
  }
  function forge(nodes,p,state){
    const tab=state.forgeTab||0,slot=state.forgeSlot||'weapon',rarity=state.forgeRarity||'uncommon',rank=['uncommon','rare','epic','legendary','divine'].indexOf(rarity)+1;
    for(let i=0;i<3;i++){action(nodes,'forge-tab-'+i,'art:forge-tab',{index:i});find(nodes,'forge-tab-'+i).selected=i===tab;}
    const gear=p.equipment.find(g=>g.slot===slot),name=M.SLOTS[slot];
    find(nodes,'floating-sword').asset=M.SLOT_ART[slot];find(nodes,'weapon-card').icon=find(nodes,'floating-sword').asset;action(nodes,'weapon-card','route:equipment');
    let c,level=0;
    if(tab===0){c={gold:rank*rank*8000,ore:rank*25,wood:rank*15,cloth:rank*15,essence:rank*10};if(rarity==='divine')c.divineOre=50;label(nodes,'weapon-card',name+' · '+M.RARITIES[rarity].name);label(nodes,'forge-level','Rèn '+M.RARITIES[rarity].name);label(nodes,'attack-preview','Mở sau ải '+(rarity==='divine'?300:rank*20));action(nodes,'forge-action','do:craft',{slot,rarity},p.campaign.cleared<(rarity==='divine'?300:rank*20)||!affordable(p,c));label(nodes,'forge-action','CHẾ TẠO');}
    else if(tab===1){level=gear?.level||0;c=gear?{gold:(level+1)*900,ore:(level+1)*2}:null;label(nodes,'weapon-card',gear?name+' · '+M.RARITIES[gear.rarity].name:'Chưa có trang bị');label(nodes,'forge-level',gear?`+${level} → +${Math.min(20,level+1)}`:'Chưa có trang bị');label(nodes,'attack-preview','Chỉ số trang bị +8% mỗi cấp');action(nodes,'forge-action','do:strengthen',{id:gear?.id||''},!gear||level>=20||!affordable(p,c));label(nodes,'forge-action','CƯỜNG HÓA');}
    else{label(nodes,'forge-level','Khảm Ngọc');label(nodes,'attack-preview','Tính năng sắp ra mắt');action(nodes,'forge-action','do:soon',{feature:'Khảm ngọc'});label(nodes,'forge-action','COMING SOON');}
    label(nodes,'weapon-stars',tab===0?M.RARITIES[rarity].name:gear?M.RARITIES[gear.rarity].name:'');label(nodes,'success-rate',tab===2?'Coming soon':'Tỷ lệ thành công: 100%');
    nodes=materials(nodes,'forge',p,c,[411,1166,394,125],'forge-materials');
    Object.entries(M.SLOTS).forEach(([id,name],i)=>nodes.push(button('forge','slot-'+id,name,[147+i*113,755,109,49],'do:forge-slot',{slot:id},{asset:'tab-wood',size:22,tone:'gold',selected:slot===id})));
    if(tab===0)['uncommon','rare','epic','legendary','divine'].forEach((r,i)=>nodes.push(button('forge','rarity-'+r,M.RARITIES[r].name,[147+i*136,812,132,45],'art:forge-rarity',{rarity:r},{asset:'tab-wood',size:21,tone:'gold',selected:rarity===r})));
    return nodes;
  }
  function footer(nodes,key){
    nodes=remove(nodes,/\.(nav-label-board|nav-active-label)$/);
    const order=['home','upgrade','inventory','skills','summon','arena','more'],selected=order.includes(key)?key:'more',index=order.indexOf(selected),name=['Trang Chủ','Tướng','Túi Đồ','Kỹ Năng','Triệu Hồi','Đấu Trường','Thêm'][index];
    for(const n of nodes)if(n.role==='nav')n.selected=n.action==='route:'+selected;
    nodes.push(image(key,'nav-label-board','nameplate',[10+index*130,1607,143,53],{fit:'fill'}),text(key,'nav-active-label',name,[20+index*130,1614,123,34],23));return nodes;
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
      if(suffix==='gems-plus')n.action='route:vip';if(suffix==='profile')n.icon='portrait-'+p.selected;
      if(n.action==='route:tavern')n.action='route:quests';
      if(key==='home'&&n.id.startsWith('home.feature-')){n.labelHidden=false;n.labelRect=[3,79,90,26];n.iconRect=[26,15,45,54];n.size=18;}
    }
    L.screens[key].nodes=nodes;return p;
  };
  const oldHandle=G.handle;
  G.handle=(act,el,ctx,state)=>{
    if(act.startsWith('item:')){
      const id=act.slice(5),asset=M.RESOURCES[id]?.[1]||id,item=inventory.find(row=>row[0]===asset);
      if(item){ctx.showModal(item[1],[asset],item[4]+'\nSố lượng: '+item[2]);return true;}
    }
    if(!act.startsWith('art:'))return oldHandle(act,el,ctx,state);
    const d=el.dataset,command=act.slice(4);
    if(command==='quest')state.dailyQuest=+d.index;
    if(command==='fragments'){state.category='fragment';state.bagPage=0;ctx.navigate('inventory');return true;}
    if(command==='shop-resource'){state.shopResource=d.resource;state.quantity=1;}
    if(command==='shop-tab'){state.shopTab=d.tab;state.shopProduct=null;state.quantity=1;state.shopMessage='';}
    if(command==='shop-product'){const product=M.WORLD.SHOP.find(row=>row.id===d.product);if(!product)return true;state.shopProduct=product.id;state.shopTab=product.kind==='gear'?'equipment':product.currency;state.quantity=1;state.shopMessage='';if(state.screen!=='shop'){ctx.navigate('shop');return true;}}
    if(command==='purchase'){try{const r=G.engine.purchase(d.product,Number(d.count));state.shopMessage='Đã nhận '+M.WORLD.SHOP.find(row=>row.id===r.product).name+' ×'+r.count+'.';}catch(error){state.shopMessage=error.message;}}
    if(command==='quantity')state.quantity=Math.max(1,Math.min(20,(state.quantity||1)+Number(d.delta)));
    if(command==='arena-mode')state.arenaMode=d.mode;
    if(command==='forge-tab')state.forgeTab=+d.index;
    if(command==='forge-rarity')state.forgeRarity=d.rarity;
    ctx.render();return true;
  };
})();
