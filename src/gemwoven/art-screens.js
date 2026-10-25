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
    const rows=entries.map(([id,n])=>{const available=id==='copies'?p.copies:owned(p,id);return {id,n,available,label:reward?tight(n):`${tight(available)}/${tight(n)}`};});
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
  const inventory=window.GEMWOVEN_INVENTORY,resourceFor={},gearFor={};
  function prepare(state){
    const p=G.engine.read();state.hero=state.hero in M.HEROES?state.hero:p.selected;
    const descriptions={gold:'Vàng từ nhiệm vụ, vượt ải, boss và tích lũy offline.',gems:'Đá Ngọc chỉ nhận qua nạp tiền. Tính năng nạp sắp ra mắt.',tickets:'Vé nhận từ nhiệm vụ ngày và các mốc cấp tướng.',exp:'Sách kinh nghiệm dùng tăng cấp tướng.',seals:'Ấn tu luyện dùng tăng cấp tướng, tối đa 1.600 ấn mỗi ngày.',skillBooks:'Bí kíp dùng học và tăng cấp kỹ năng.',essence:'Tinh hoa dùng tăng sao, tiến hóa, kỹ năng Biến Dị/Chân Thân và bảo bối.',ore:'Quặng dùng rèn, cường hóa trang bị, tiến hóa tướng và bảo bối.',wood:'Gỗ dùng rèn trang bị.',cloth:'Vải dùng rèn trang bị.',divineOre:'Rèn trang bị Thần (50 mảnh, sau ải 300) và tiến hóa bảo bối.'};
    const rows=Object.entries(M.RESOURCES).map(([id,[name,asset]])=>{resourceFor[asset]=id;return [asset,name,fmt(owned(p,id)),['exp','skillBooks'].includes(id)?'book':['ore','wood','cloth','essence','divineOre','seals'].includes(id)?'material':id==='tickets'?'other':'item',descriptions[id]];});
    for(const [hero,h]of Object.entries(M.HEROES)){const asset='fragment-'+hero;if(!A[asset]?.brick)A[asset]=A['portrait-'+hero];rows.push([asset,'Mảnh '+h.name,fmt(p.fragments[hero]||0),'fragment',hero==='novice'?'Ghép 80 mảnh thành một bản sao Hiro. Hiro là tướng khởi đầu: không rơi mảnh và không có trong triệu hồi.':unreleased(hero)?`Ghép 80 mảnh thành ${h.name}. Tướng xuất hiện ở kỳ triệu hồi sau.`:'Ghép 80 mảnh cùng loại thành một tướng hoặc bản sao.']);}
    refreshSkillCopy(p);
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
    const key='skills',hero=state.hero,h=p.heroes[hero],i=state.skill||0,filter=state.skillFilter??'all',t=M.skillText(hero,h,i);
    nodes=remove(nodes,/\.skill-materials-/);
    for(const n of nodes){
      const id=n.id.split('.').slice(1).join('.');
      if(/^branch-\d$/.test(id)){const branch=+id.slice(-1);n.action='do:skill-filter';n.data={filter:branch};n.selected=String(filter)===String(branch);}
      if(/^roster-/.test(id)){n.action='do:hero';n.data={hero:id.slice(7)};n.selected=id==='roster-'+hero;}
      if(/^node-\d$/.test(id)){const index=+id.slice(-1);n.action='do:skill-node';n.data={index};n.className+=' skill-live'+(!h||!M.skillUnlock(h,index)?' skill-unavailable':'');}
      if(/^node-level-/.test(id))C[n.text]=`${h?.skills[+id.slice(-1)]||0}/${M.SKILL_MAX}`;
      // Decorative outer locks are future branches, not part of the current tree.
      if(/^locked-\d$/.test(id)){n.action='art:skill-soon';n.data={};C[n.text]='Nhánh kỹ năng mở rộng · Sắp ra mắt';}
    }
    if(filter!=='all')nodes=nodes.filter(n=>!(/\.(link-|locked-)/.test(n.id)||/\.(node-|node-level-)\d$/.test(n.id)&&!n.id.endsWith('-'+filter)));
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
    // Sits under the outer locks, level with the hero roster, so it never covers a lock.
    nodes.push(button(key,'tree-all','Cây kỹ năng',[664,903,240,98],'do:skill-filter',{filter:'all'},{asset:'nameplate',selected:filter==='all',size:29,labelRect:[24,22,192,50]}));
    return nodes;
  }
  // Where each resource really comes from (progression.js rewards, shop and summon tables).
  const SOURCES={gold:'Nhiệm vụ · Vượt ải\nBoss · Offline',tickets:'Nhiệm vụ Ghé thăm\nMốc cấp tướng',exp:'Vượt ải · Boss · Offline\nNhiệm vụ · Cửa hàng',seals:'Nhiệm vụ · Vượt ải\nBoss · Offline',
    skillBooks:'Nhiệm vụ Chi tiêu\nCửa hàng',essence:'Boss Vô Hạn · Boss chương\nRương sao chương',ore:'Vượt ải · Boss · Phân rã\nCửa hàng · Triệu hồi',wood:'Cửa hàng\nTriệu hồi',cloth:'Cửa hàng\nTriệu hồi',divineOre:'Boss Vô Hạn tầng 60+\nCửa hàng Đá Ngọc'};
  function bag(nodes,p,state){
    for(const n of nodes){if(n.id.startsWith('inventory.category-')){n.rect=[15,n.rect[1],215,85];n.labelRect=[56,14,150,56];n.size=28;n.className='inventory-category';}if(n.action?.startsWith('bag-item:')){n.labelHidden=true;delete n.labelAsset;n.iconRect=[24,12,107,107];}}
    const asset=state.bagItem,item=inventory.find(r=>r[0]===asset);if(!item)return nodes;
    nodes=remove(nodes,/\.(recipe-|held-|source-icon$)/);
    const fragmentHero=item[3]==='fragment'?asset.slice(9):null;
    label(nodes,'source',resourceFor[asset]==='gems'?'Nạp tiền\nComing soon':fragmentHero==='novice'?'Tướng khởi đầu\nKhông có trong triệu hồi':fragmentHero&&unreleased(fragmentHero)?'Kỳ triệu hồi sau\nComing soon':fragmentHero?'Triệu hồi\nBoss chương':item[3]==='gear'?'Triệu hồi\nLò rèn':SOURCES[resourceFor[asset]]||'Nhiệm vụ · Vượt ải\nBoss · Offline');
    Object.assign(find(nodes,'source'),{rect:[307,1336,250,108],size:26});Object.assign(find(nodes,'source-title'),{rect:[307,1296,250,36],size:28});
    nodes.push(text('inventory','held-label','Số lượng đang có',[566,1296,340,36],28),text('inventory','held-count',item[2],[566,1332,340,44],34));
    if(item[3]==='fragment'){const hero=asset.slice(9);action(nodes,'item-action','do:fuse',{hero},(p.fragments[hero]||0)<80);label(nodes,'item-action','Ghép Tướng');}
    else{const route=item[3]==='gear'?'equipment':item[3]==='book'?(asset==='exp-book'?'upgrade':'skills'):asset==='ticket'?'summon':asset==='mana'?'vip':'campaign';action(nodes,'item-action','route:'+route);label(nodes,'item-action',item[3]==='gear'?'Trang Bị':item[3]==='book'?'Sử Dụng':asset==='mana'?'Coming Soon':'Đi Tới');}
    const product=M.WORLD.SHOP.find(row=>row.kind==='resource'&&row.target===resourceFor[asset]);
    const counterDef=M.WORLD.EXPANSION.definitions.find(d=>d.counterKey===asset);
    if(counterDef){action(nodes,'item-action','guide:chapter',{chapter:counterDef.chapter});label(nodes,'item-action','Đến Chương');label(nodes,'source','Tinh anh 3 sao\nMốc 10 / 20 / 30 / 40');}
    // The item's action and "buy more" sit side by side under the held count.
    const act=find(nodes,'item-action');Object.assign(act,{rect:product?[548,1378,178,98]:[636,1378,196,98],size:27,labelRect:[22,0,(product?178:196)-44,98]});
    if(product)nodes.push(button('inventory','purchase','Mua thêm',[736,1378,178,98],'art:shop-product',{product:product.id},{size:27,labelRect:[22,0,134,98]}));
    return nodes;
  }
  function summon(nodes,p,state){
    nodes=remove(nodes,/\.(guarantee|one-cost|ten-cost|featured-(?:fire|ice|earth|lightning|shadow)|portrait-(?:ice|earth|lightning|shadow))$/);
    action(nodes,'summon-one','do:summon',{count:1});action(nodes,'summon-ten','do:summon',{count:10});action(nodes,'central-crystal','do:summon',{count:1});action(nodes,'summon-details','do:rates');action(nodes,'fragments','art:fragments');
    for(const id of ['summon-one','summon-ten']){const n=find(nodes,id);n.labelRect=[24,48,225,35];n.size=31;}
    const featured=find(nodes,'portrait-fire');featured.icon='portrait-'+M.SUMMON_BANNER.hero;featured.action='hero:'+M.SUMMON_BANNER.hero;featured.rect=[350,366,240,285];featured.iconRect=[38,55,164,165];
    // Banner name + one short line on a board sized for two readable lines.
    label(nodes,'subtitle',M.SUMMON_BANNER.title+'\nTướng nổi bật kỳ này');Object.assign(find(nodes,'subtitle'),{rect:[300,276,341,80],size:28});find(nodes,'subtitle-board').rect=[284,268,373,96];
    Object.assign(find(nodes,'featured-board'),{rect:[50,1178,842,174]});label(nodes,'featured-title','Trang Bị Nổi Bật');Object.assign(find(nodes,'featured-title'),{rect:[84,1194,400,38],size:31});
    nodes=remove(nodes,/\.featured-note$/);
    [['fire-sword','Kiếm\nHuyền Thoại','weapon','legendary'],['helmet','Giáp\nThần','armor','divine'],['boots','Ủng\nHuyền Thoại','boots','legendary']].forEach(([asset,name,slot,rarity],i)=>nodes.push(button('summon','featured-gear-'+i,name,[80+i*250,1233,240,98],'journey:featured-gear',{slot,rarity,asset}, {asset:'inventory-slot',icon:asset,iconRect:[13,12,70,72],labelRect:[94,0,146,96],size:25,tone:'gold',align:'left',className:'featured-equipment'})));
    label(nodes,'pity-label',`Còn ${300-p.summon.dry} lần tới bảo đảm tướng hiếm`);label(nodes,'pity-value',`${p.summon.dry} / 300`);find(nodes,'pity-meter').value=p.summon.dry/300;
    nodes.push(button('summon','ticket-balance',`${fmt(p.wallet.tickets)} Vé Triệu Hồi`,[290,1121,361,60],'item:ticket',{},
      {asset:'nameplate',icon:'ticket',iconRect:[22,7,52,46],labelRect:[74,6,266,48],size:28}));
    return nodes;
  }
  function quests(nodes,p,state,key){
    const index=Math.max(0,Math.min(M.DAILY.length-1,state.dailyQuest||0)),q=M.DAILY[index],progress=p.daily.progress[q.id]||0,claimed=p.daily.claimed.includes(q.id);
    label(nodes,'quest-heading','Nhiệm Vụ Ngày');find(nodes,'quest-heading').size=24;
    // Reward tiles show what claiming pays now: Ấn is limited by today's remaining cap.
    const preview=M.dailyRewardPreview(p,q.id),capNote=!claimed&&preview.sealCapped?'Đã đạt giới hạn Ấn hôm nay':'Làm mới 00:00 GMT+7';
    label(nodes,'quest-name',q.name);label(nodes,'quest-description',`Tiến độ: ${fmt(Math.min(progress,q.target))} / ${fmt(q.target)} · ${capNote}`);
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
    const a=r.before,b=r.after,parts=[`HP ${fmt(a.hp)} → ${fmt(b.hp)}`,`Công ×${a.attack.toFixed(2)} → ×${b.attack.toFixed(2)}`];
    if(Math.round(a.defense*100)!==Math.round(b.defense*100))parts.push(`Thủ ${Math.round(a.defense*100)}% → ${Math.round(b.defense*100)}%`);
    return parts.join(' · ')+(r.unlock?'\n'+r.unlock:'');
  }
  function upgrade(nodes,p,state){
    const hero=state.hero,h=p.heroes[hero],tab=state.upgradeTab||'level';let c=null,disabled=true,gain='',side=null;
    for(const [i,t]of ['level','stars','evolution'].entries()){action(nodes,'upgrade-tab-'+i,'do:upgrade-tab',{tab:t});find(nodes,'upgrade-tab-'+i).selected=tab===t;}
    for(const n of nodes){if(n.id.startsWith('upgrade.choose-')){n.action='do:hero';n.data={hero:n.id.slice(15)};n.selected=n.data.hero===hero;}}
    action(nodes,'evolution-next','do:upgrade-tab',{tab:'evolution'});
    if(h){
      const stats=M.stats(p,hero),step=state.levelStep===10?10:1,range=h.level<M.MAX_LEVEL?M.levelCostRange(h.level,step):null,levelGain=range?M.upgradePreview(p,hero,'level',range.levels):null;
      label(nodes,'stat-value-0',levelGain?`${fmt(stats.hp)} → ${fmt(levelGain.after.hp)}`:fmt(stats.hp));label(nodes,'stat-value-1',levelGain?`×${stats.attack.toFixed(2)} → ×${levelGain.after.attack.toFixed(2)}`:`×${stats.attack.toFixed(2)}`);label(nodes,'stat-value-2',`${Math.round(stats.defense*100)}%`);label(nodes,'hero-stars','★'.repeat(h.stars)+'☆'.repeat(6-h.stars));label(nodes,'exp-value',`Cấp ${h.level} / ${M.MAX_LEVEL}`);find(nodes,'exp-meter').value=h.level/M.MAX_LEVEL;
      if(tab==='level'){
        const max=!range;if(range)c=range.cost;
        label(nodes,'level-preview',max?`Lv.${h.level} · Tối đa`:`Lv.${h.level} → Lv.${h.level+range.levels}`);label(nodes,'upgrade-material-title',max?'Đã đạt cấp tối đa':range.levels>1?`Nguyên liệu tăng ${range.levels} cấp`:'Nguyên liệu tăng cấp');
        disabled=max||!affordable(p,c);
        if(step===10&&range)action(nodes,'upgrade-action','art:level',{hero,count:range.levels},disabled);else action(nodes,'upgrade-action','do:level',{hero},disabled);
        label(nodes,'upgrade-action',max?'Đã Tối Đa':range.levels>1?`Tăng ${range.levels} Level`:'Tăng Level');
        gain=max?'Đã đạt cấp tối đa 500.':gainText(levelGain);
        if(!max)side=button('upgrade','level-step',step===10?'×10 ✓':'×10',[664,1344,118,58],'art:level-step',{},{asset:'nameplate',size:24,selected:step===10,className:'upgrade-side-toggle'});
      }
      if(tab==='stars'){
        const s=h.stars<6?M.starCost(h.stars):null;c=s?{copies:s.copies,gold:s.gold,essence:s.essence}:null;
        label(nodes,'level-preview',s?`${h.stars} sao → ${h.stars+1} sao`:'6 sao · Tối đa');label(nodes,'upgrade-material-title',s?'Bản sao · Vàng · Tinh hoa':'Đã đạt 6 sao');
        disabled=!s||h.copies-1<s.copies||!affordable(p,{gold:s.gold,essence:s.essence});action(nodes,'upgrade-action','do:star',{hero},disabled);label(nodes,'upgrade-action',s?'Tăng Sao':'Đã Tối Đa');
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
      nodes=materials(nodes,'upgrade',{...p,copies:h.copies-1,materialHero:hero},c,[226,1166,489,132],'upgrade-materials',false,31);
      nodes.push(button('upgrade','select-active',p.selected===hero?'Đang xuất chiến':'Xuất chiến',[582,636,174,59],'do:select',{hero},{size:21,disabled:p.selected===hero}));
    }else{
      const frags=p.fragments[hero]||0,soon=unreleased(hero)&&frags<80;
      nodes=remove(nodes,/\.(stat-value-|upgrade-materials-)/);label(nodes,'level-preview','Chưa sở hữu');label(nodes,'exp-value',`${frags} / 80 mảnh`);label(nodes,'hero-stars','☆☆☆☆☆☆');
      label(nodes,'upgrade-material-title',frags>=80?'Đủ 80 mảnh · Ghép để mở tướng':soon?'Xuất hiện ở kỳ triệu hồi sau':'Ghép 80 mảnh để mở tướng');
      action(nodes,'upgrade-action','do:fuse',{hero},frags<80);label(nodes,'upgrade-action',soon?'Sắp Ra Mắt':'Ghép Tướng');find(nodes,'exp-meter').value=frags/80;
      gain=soon?'Coming soon · Kỳ triệu hồi này chưa có mảnh của tướng này.':'Mảnh nhận từ triệu hồi và lần đầu hạ boss chương.';
    }
    // Phone-readable preview: one line of stat changes, a second line only for unlocks.
    Object.assign(find(nodes,'upgrade-action'),{rect:[311,1320,326,98]});Object.assign(find(nodes,'exp-value'),{rect:[296,1058,350,38],size:31});
    if(gain)nodes.push(text('upgrade','gain-preview',gain,[70,1422,800,70],31,'gold',{className:'text-backing upgrade-gain'}));
    if(side)nodes.push(side);
    label(nodes,'exp-label','CẤP');find(nodes,'exp-crystal').asset='exp-book';
    nodes.push(button('upgrade','choose-novice','Hiro',[660,711,61,66],'do:hero',{hero:'novice'},{asset:'avatar-ring',icon:'portrait-novice',iconRect:[12,8,37,48],labelHidden:true,selected:hero==='novice'}));
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
    find(nodes,'fighter-fire').asset='hero-novice';find(nodes,'fighter-ice').asset='hero-novice';label(nodes,'fighter-fire','Người chơi 1 · Hiro');label(nodes,'fighter-ice','Người chơi 2 · Hiro');
    action(nodes,'mode-solo','art:arena-mode',{mode:'duel'});action(nodes,'mode-team','art:arena-mode',{mode:'team'});find(nodes,'mode-solo').selected=mode==='duel';find(nodes,'mode-team').selected=mode==='team';
    action(nodes,'battle',mode==='duel'?'do:battle':'do:soon',mode==='duel'?{mode:'duel',index:1}:{feature:'Đội 3vs3'});label(nodes,'battle',mode==='duel'?'Chiến Đấu':'Coming Soon');
    // Two finger-sized secondary modes side by side under "Chiến Đấu".
    nodes.push(button('arena','boss-mode','Boss Vô Hạn',[150,1352,310,98],'route:boss',{}, {size:31,labelRect:[30,0,250,98]}),button('arena','practice-ai','Đấu tập AI',[482,1352,310,98],'do:battle',{mode:'pvp',index:1},{asset:'tab-wood',tone:'gold',size:31,labelRect:[30,0,250,98]}));
    // Fighters stay clear of the hanging menu on the left.
    find(nodes,'fighter-fire').rect=[166,559,250,215];find(nodes,'fighter-ice').rect=[528,559,250,215];
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
    nodes.push(image(key,'nav-label-board','nameplate',[4+index*130,1600,156,60],{fit:'fill'}),text(key,'nav-active-label',name,[14+index*130,1608,136,42],28));return nodes;
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
      // Item card: picture, use, where it comes from and how many are owned.
      if(item){const source=SOURCES[resourceFor[asset]];ctx.showModal(item[1],[asset],item[4]+(source?'\nNguồn: '+source.replace(/\n/g,' · '):'')+'\nĐang có: '+item[2]);return true;}
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
    if(command==='level-step')state.levelStep=state.levelStep===10?1:10;
    if(command==='level'){try{const r=G.engine.levelUp(d.hero,Number(d.count));ctx.render();if(r.tickets)G.showRewards(ctx,{tickets:r.tickets});}catch(error){ctx.render();ctx.showModal('Chưa thể tăng cấp',[],error.message);}return true;}
    if(command==='skill-soon'){ctx.showModal('Nhánh kỹ năng mở rộng · Sắp ra mắt',['skill-lock'],'Các nhánh này chưa phát hành. Hiện mỗi tướng có 4 kỹ năng: Chủ Động, Bị Động, Biến Dị và Chân Thân.');return true;}
    if(command==='evolution-perks'){
      const hero=d.hero||state.hero,h=G.engine.read().heroes[hero],now=h?.evolution||0;
      ctx.showModal('Mốc tiến hóa · '+M.HEROES[hero].name,[],M.EVOLUTION.map((e,i)=>`${i<now?'✓':'○'} Tiến hóa ${i+1} · cấp ${e.level}, ${e.stars} sao: ${e.perk}. ${e.name}.`).join('\n'));return true;
    }
    ctx.render();return true;
  };
})();
