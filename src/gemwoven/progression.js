/* Shared local progression model. Rewards never contain premium currency.
 * Browser + Node export allows the same rules to drive the hub and combat.
 * This client save is a playable prototype; multiplayer/payment authority belongs on a server.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenProgression=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const WORLD=typeof module==='object'&&module.exports?require('./world.js'):globalThis.GemwovenWorld;
  const VERSION=1,KEY='gemwoven.progression.v1',MAX_LEVEL=500,DAILY_SEAL_CAP=1600;
  const HEROES={
    novice:{name:'Tân',title:'Lữ Khách Tập Sự',element:'Thường',hp:145,attack:.85,rarity:'common',skills:['Nhát Kiếm Cơ Bản','Giữ Thế','Bước Tiến','Ý Chí Lữ Khách']},
    fire:{name:'Mika',title:'Viêm Kiếm Sĩ',element:'Hỏa',hp:170,attack:1,rarity:'legendary',skills:['Viêm Long Trảm','Liệt Hỏa Kiếm Tâm','Hỏa Luân','Cửu Vĩ Viêm Hồn']},
    ice:{name:'Yuki',title:'Băng Tâm Vệ',element:'Băng',hp:200,attack:1,rarity:'legendary',skills:['Thiên Băng Giáng','Băng Tâm Hộ Thuẫn','Tuyết Liên Kết Giới','Nguyệt Thố Băng Linh']},
    earth:{name:'Nori',title:'Thiết Giáp Vệ',element:'Mộc',hp:320,attack:1,rarity:'legendary',skills:['Mộc Linh Hộ Thể','Đại Khiên Tích Lực','Căn Mạch Trói Buộc','Cổ Thụ Thần Vệ']},
    lightning:{name:'Lumi',title:'Lôi Cuồng Sư',element:'Lôi',hp:200,attack:1,rarity:'legendary',skills:['Ngũ Tinh Lôi','Tinh Điện Cộng Hưởng','Lôi Vân Xoáy','Thiên Tinh Pháp Sư']},
    shadow:{name:'Noct',title:'Ảnh Kiếm Sĩ',element:'Ảnh',hp:190,attack:1,rarity:'legendary',skills:['Ngũ Ảnh Trảm','Vô Diện Ảnh Bộ','Tàn Ảnh Phân Thân','Dạ Hành Vô Tướng']}
  };
  const RARITIES={common:{name:'Thường',color:'#b7b3a3',factor:1},uncommon:{name:'Tốt',color:'#93c487',factor:1.6},rare:{name:'Hiếm',color:'#74b6f0',factor:2.5},epic:{name:'Sử Thi',color:'#c28aff',factor:4},legendary:{name:'Huyền Thoại',color:'#ffc55b',factor:7},divine:{name:'Thần',color:'#ff8585',factor:11}};
  const AFFIXES={stun:{name:'Chấn kích',desc:'12% gây choáng; tối đa một lần mỗi lượt.'},steadfast:{name:'Bất động',desc:'25% kháng mất lượt/đóng băng.'},lifesteal:{name:'Hút sinh lực',desc:'Hồi 6% sát thương gây ra.'},pierce:{name:'Xuyên giáp',desc:'8% bỏ qua một nửa giáp mục tiêu.'},ward:{name:'Hộ thân',desc:'Đầu mỗi lượt nhận lá chắn bằng 3% HP tối đa.'}};
  const SLOTS={weapon:'Vũ khí',armor:'Áo',helmet:'Mũ',boots:'Giày',pants:'Quần',glasses:'Kính'};
  const SLOT_ART={weapon:'fire-sword',armor:'gear-armor',helmet:'gear-helmet',boots:'boots',pants:'gear-pants',glasses:'gear-glasses'};
  const RELICS={novice:'La Bàn Lữ Hành',fire:'Hồ Lô Viêm Hồ',ice:'Chuông Tuyết Nguyệt',earth:'Hạt Cổ Thụ',lightning:'Tinh Cầu Thiên Lôi',shadow:'Ấn Nguyệt Vô Diện'};
  // Relics belong to their hero; five visible forms, twenty training levels per form.
  const relicSave=()=>({level:1,evolution:1});
  function relicLevelCost(r){check(r.level<100,'Bảo bối đã đạt cấp 100.');return {gold:Math.ceil(1800*r.level**1.45),essence:Math.ceil(r.level/5),ore:Math.ceil(r.level/3)};}
  function relicEvolveCost(r){check(r.evolution<5,'Bảo bối đã đạt dạng cuối.');return {gold:50000*r.evolution**2,essence:40*r.evolution,divineOre:5*r.evolution};}
  const RESOURCES={gold:['Đồng vàng','coins'],gems:['Đá Ngọc','mana'],tickets:['Vé triệu hồi','ticket'],exp:['Sách kinh nghiệm','exp-book'],seals:['Ấn tu luyện','crest'],skillBooks:['Bí kíp kỹ năng','skill-book'],essence:['Tinh hoa tiến hóa','fire-essence'],ore:['Quặng sắt','ore'],wood:['Gỗ mềm','wood'],cloth:['Vải thô','cloth'],divineOre:['Mảnh thần thạch','lightning-essence']};
  const SUMMON_TABLE=[['hero',1500],['fragments',13500],['novice',60000],['commonGear',285000],['rareGear',20000],['epicGear',1500],['legendaryGear',200],['divineGear',10],['material',618290]];
  // One released featured hero per banner. Other unreleased heroes stay out of
  // this pool; owning an earlier hero is unaffected when the next banner ships.
  const SUMMON_BANNER={id:'ember-pact',hero:'fire',title:'Khế Ước Hỏa Hồ'};
  const STAR_MILESTONES=[50,100,150];
  const CREATURES=[{id:'slime',name:'Slime Rêu',skill:'Nảy Mầm'},{id:'acorn',name:'Mầm Hạt Dẻ',skill:'Hạt Nảy'},{id:'bat',name:'Dơi Hang',skill:'Cánh Đêm'}];
  const EVOLUTION=[
    {level:50,stars:1,gold:12000,essence:15,ore:20,piece:'weapon',name:'Vũ khí thức tỉnh'},
    {level:100,stars:2,gold:40000,essence:40,ore:50,piece:'shoulders',name:'Giáp vai linh lực'},
    {level:180,stars:3,gold:120000,essence:90,ore:100,piece:'gloves',name:'Găng tay cộng hưởng'},
    {level:280,stars:4,gold:350000,essence:180,ore:180,piece:'boots',name:'Giáp chân chuyển hóa'},
    {level:400,stars:5,gold:900000,essence:360,ore:300,piece:'crest',name:'Dấu ấn chân thân'},
    {level:500,stars:6,gold:2200000,essence:800,ore:500,piece:'aura',name:'Lột xác toàn thân'}
  ];
  const VIP=[0,100000,300000,600000,1000000,2000000,4000000,7000000,12000000,20000000,35000000,60000000,100000000].map((spend,level)=>({level,spend,dailyGold:level*500,offlineHours:12+Math.floor(level/3),avatar:level>=1,entryEffect:level>=3,chatEffect:level>=5,specialEquipment:level>=8,specialHero:level>=10}));
  const DAILY=[{id:'login',name:'Ghé thăm thị trấn',target:1,reward:{gold:500,exp:10,seals:80,tickets:1}}, {id:'campaign',name:'Hoàn thành 3 trận vượt ải',target:3,reward:{gold:1500,exp:20,seals:120}}, {id:'boss',name:'Đánh bại 2 boss',target:2,reward:{gold:2000,exp:25,seals:150}}, {id:'spend',name:'Dùng 1.000 vàng',target:1000,reward:{gold:800,skillBooks:1,seals:80}}];
  const EVENT_TEMPLATE={id:'new-event',title:'Sự kiện sắp ra mắt',description:'Cuộc phiêu lưu mới đang được chuẩn bị.',enabled:false,status:'coming-soon',startsAt:'',endsAt:'',banner:'icon-event',order:0};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const day=ms=>new Date(ms+7*3600000).toISOString().slice(0,10);
  const int=(n,min,max)=>Number.isFinite(n)&&Number.isInteger(n)&&n>=min&&n<=max;
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const heroSave=()=>({level:1,stars:1,evolution:0,copies:1,skills:[1,0,0,0],gear:{},relic:relicSave(),ticketMilestones:[]});
  function fresh(now){return {version:VERSION,revision:0,created:now,updated:now,selected:'novice',wallet:{gold:1200,gems:0,tickets:0},materials:{exp:12,seals:0,skillBooks:0,essence:0,ore:5,wood:5,cloth:5,divineOre:0},heroes:{novice:heroSave()},fragments:{},equipment:[],campaign:{cleared:0},boss:{best:0,wins:0,damageBest:0},pvp:{wins:0,losses:0,rating:1000},daily:{date:day(now),progress:{login:1,campaign:0,boss:0,spend:0},claimed:[],seals:0,bossWins:0},offlineAt:now,summon:{total:0,dry:0,fragmentDry:0,last:[]},events:[],pending:null,receipts:[],vip:{level:0,paidTotal:0},log:[]};}
  function levelCost(level){check(int(level,1,499),'Cấp này không thể tăng thêm.');return {gold:Math.ceil(60+level*level*1.9),exp:Math.ceil(2+level*.6),seals:Math.ceil(6+level*.04+level*level*.014)};}
  function starCost(stars){check(int(stars,1,5),'Tướng đã đạt 6 sao.');return {copies:[0,1,2,3,5,8][stars],gold:[0,10000,35000,100000,300000,1000000][stars],essence:[0,10,25,60,140,300][stars]};}
  function skillUnlock(h,index){return index===0||index===1&&h.level>=10||index===2&&h.level>=100&&h.evolution>=2||index===3&&h.level>=400&&h.evolution>=5;}
  function skillCost(h,index){check(int(index,0,3),'Kỹ năng không hợp lệ.');check(skillUnlock(h,index),'Chưa đủ cấp hoặc tiến hóa để mở kỹ năng.');const rank=h.skills[index];check(rank<10,'Kỹ năng đã đạt cấp 10.');return {gold:(rank+1)*1800,skillBooks:rank+1,essence:index>=2?(rank+1)*3:0};}
  function stats(p,key,normalized=false){
    const h=p.heroes[key];check(h&&HEROES[key],'Bạn chưa sở hữu tướng này.');const data=HEROES[key];let attack=data.attack*(1+.018*(h.level-1))*(1+.09*(h.stars-1))*(1+.07*h.evolution),hp=data.hp*(1+.045*(h.level-1))*(1+.12*(h.stars-1))*(1+.1*h.evolution),defense=0;const affixes=[];
    for(const id of Object.values(h.gear)){const g=p.equipment.find(x=>x.id===id);if(!g)continue;const f=RARITIES[g.rarity].factor*(1+g.level*.08);if(g.slot==='weapon')attack+=f*.035;else if(g.slot==='armor')hp+=f*25;else if(g.slot==='helmet')hp+=f*15;else if(g.slot==='pants')hp+=f*10,defense+=f*.004;else if(g.slot==='glasses')attack+=f*.02;else defense+=f*.012;if(g.affix)affixes.push(g.affix);}
    const relic=h.relic||relicSave(),relicBonus=(relic.level-1)*.0025+(relic.evolution-1)*.025;attack*=1+relicBonus;hp*=1+relicBonus;
    if(h.skills[1]){const r=h.skills[1];if(key==='fire')attack*=1+r*.025;if(key==='ice')defense+=r*.008;if(key==='earth')hp*=1+r*.015;if(key==='shadow')attack*=1+r*.012;if(key==='novice')defense+=.02+(r-1)*.002;}
    const active=1+Math.max(0,h.skills[0]-1)*.08,mutation=h.skills[2]>0,awakened=h.skills[3]>0;
    if(awakened){attack*=1.12+h.skills[3]*.01;hp*=1.1;}
    if(normalized){hp=data.hp*2;attack=data.attack*1.8;defense=Math.min(.06,defense);}
    return {hp:Math.round(hp),attack:Number(attack.toFixed(4)),defense:Math.min(.5,defense),active,mutation,awakened,skills:h.skills.slice(),evolution:h.evolution,affixes:normalized?[]:affixes,power:Math.round(hp*attack*(1+defense))};
  }
  function offline(p,now){const level=Math.max(...Object.values(p.heroes).map(h=>h.level));const hours=Math.min(12,Math.max(0,now-p.offlineAt)/3600000);const goldPerHour=80+level*8+p.campaign.cleared*15;return {hours,goldPerHour,capHours:12,gold:Math.floor(hours*goldPerHour),exp:Math.floor(hours*(2+Math.floor(p.campaign.cleared/20))),seals:Math.floor(hours*60)};}
  function summonQuote(p,count){
    check(count===1||count===10,'Chọn triệu hồi 1 hoặc 10 lần.');
    const payment=p.wallet.tickets>=count?'tickets':'gems',cost=count*(payment==='gems'?120:1);
    return {count,payment,cost,available:p.wallet[payment],enough:p.wallet[payment]>=cost,tickets:p.wallet.tickets};
  }
  function encounter(mode,index){
    check(['campaign','boss','pvp','duel'].includes(mode),'Chế độ chưa phát hành.');check(int(index,1,mode==='campaign'?WORLD.MAX_STAGES:1000000),'Ải không hợp lệ.');
    const chapter=mode==='campaign'?WORLD.chapterForStage(index):WORLD.CHAPTERS[(index-1)%WORLD.CHAPTERS.length],bossDef=WORLD.BOSSES[chapter.boss];
    const recommended=mode==='campaign'?Math.min(500,Math.ceil(index/2)):Math.ceil(index*1.8),boss=mode==='boss'||mode==='campaign'&&index%50===0;
    const tier=boss?'boss':mode==='campaign'&&index%10===0?'elite':'normal';
    const local=(index-1)%50+1,creatureId=mode==='campaign'&&!boss?(chapter.ordinary?tier==='elite'?chapter.elites[(local/10-1)%2]:chapter.ordinary[Math.floor((local-1)/10)%3]:chapter.creatures[tier==='elite'?chapter.creatures.length-1:(index-1)%chapter.creatures.length]):null;
    const creature=creatureId?CREATURES.find(c=>c.id===creatureId)||{id:creatureId,name:chapter.ordinary?WORLD.CREATURE_NAMES[chapter.id][creatureId]:WORLD.CREATURE_NAMES[chapter.id][creatureId.endsWith('-b')?1:0],skill:tier==='elite'?'Đòn Cường Hóa':'Tấn Công'}:null;
    const hp=mode==='campaign'?(88+recommended*15)*(tier==='boss'?2.25:tier==='elite'?1.5:1):(120+recommended*18)*(boss?1.7:1);
    return {mode,index,recommended,boss,tier,chapter:chapter.index,theme:chapter.id,bossId:chapter.boss,music:boss?chapter.music:chapter.element,creature:creature?.id||null,enemyName:boss?bossDef.name:creature?.name||'Vệ Binh Tinh Anh',turnLimit:tier==='boss'?20:tier==='elite'?16:12,
      enemyKey:mode==='pvp'||mode==='duel'?'fire':chapter.element,enemyHp:Math.round(hp*(1+index*.003)),enemyAttack:(mode==='campaign'?.65:1)+recommended*.012+(tier==='elite'?.2:tier==='boss'?.35:0),
      skills:tier==='boss'?bossDef.skills.map(s=>s.name):tier==='elite'?['Đòn Cường Hóa','Hộ Giáp']:[creature?.skill||'Đánh Thường'],
      skillSet:boss?bossDef.skills:[],tactical:!!bossDef.tactical,variant:chapter.ordinary?(tier==='elite'?(local/10-1)%2:Math.floor((local-1)/10)%3):0,name:mode==='duel'?'PvP cục bộ 1vs1':mode==='pvp'?'Đấu tập 1vs1':mode==='boss'?`Boss vô hạn · Tầng ${index}`:`Chương ${chapter.index} · Ải ${local}`};
  }
  function stageStars(b,won,performance={}){
    if(!won)return 0;
    const healthy=Number.isFinite(performance.hpRatio)&&performance.hpRatio>=.5&&performance.hpRatio<=1;
    const quick=int(performance.turns,1,b.turnLimit||12);
    return 1+Number(healthy)+Number(healthy&&quick);
  }
  function campaignLoot(p,b){
    const first=b.index>p.campaign.cleared;
    return {gold:300+b.index*25+(first?500:0),exp:8+Math.floor(b.index/3),seals:first?80:10,ore:b.boss?5:2,essence:b.boss?3:0};
  }
  function campaignRewardPreview(p,index,stars){
    check(int(stars,1,3),'Số sao không hợp lệ.');
    const b=encounter('campaign',index),first=index>p.campaign.cleared,reward=campaignLoot(p,b),best=p.campaign.stars?.[index]||0;
    reward.seals=Math.min(reward.seals,Math.max(0,DAILY_SEAL_CAP-(p.daily.seals||0)));
    const counter=counterProgress(p,b.chapter),local=(index-1)%50+1;
    const counterReward=stars===3&&b.tier==='elite'&&counter&&!counter.claimed.includes(local)?{key:counter.key,name:counter.name,count:3}:null;
    const addedStars=Math.max(0,stars-best),chapter=chapterProgress(p,b.chapter);
    return {first,reward,addedStars,totalStars:chapter.total+addedStars,counterReward,
      heroFragments:first&&b.boss?{hero:SUMMON_BANNER.hero,count:3}:null,
      chests:STAR_MILESTONES.filter(n=>chapter.total+addedStars>=n&&!chapter.claimed.includes(n))};
  }
  function chapterProgress(p,chapter){
    check(int(chapter,1,WORLD.CHAPTERS.length),'Chương không hợp lệ.');
    const start=(chapter-1)*50+1,total=Array.from({length:50},(_,i)=>p.campaign.stars?.[start+i]||0).reduce((a,b)=>a+b,0);
    return {chapter,total,max:150,claimed:STAR_MILESTONES.filter(n=>p.campaign.claimedStars?.includes(`world2:${chapter}:${n}`))};
  }
  function chapterReward(chapter,milestone){
    check(int(chapter,1,WORLD.CHAPTERS.length)&&STAR_MILESTONES.includes(milestone),'Mốc sao không hợp lệ.');const rank=milestone/50;
    return {gold:chapter*2000*rank,exp:25*rank,essence:5*rank,ore:10*rank,seals:50*rank};
  }
  function counterProgress(p,chapter){
    const d=WORLD.EXPANSION.definitions.find(d=>d.chapter===chapter);if(!d)return null;
    const claimed=(p.campaign.artifacts?.[d.theme]?.claimed||[]).filter(n=>d.eliteMilestones.includes(n));
    const milestones=[...new Set(claimed)],shards=milestones.length*3,rank=shards/3;
    return {theme:d.theme,chapter,name:d.counter,key:d.counterKey,claimed:milestones,shards,required:12,rank,reduction:d.artifactRanks[rank],description:d.counterText};
  }
  function makeEngine(storage,{now=()=>Date.now(),random=()=>{if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}return Math.random();}}={}){
    let memory,sequence=0;
    function load(){const raw=storage?.getItem(KEY);if(raw){let p;try{p=JSON.parse(raw);}catch{throw new Error('Bản lưu bị lỗi. Hãy giữ bản lưu và khôi phục từ bản sao.');}check(p.version===VERSION,'Phiên bản bản lưu chưa được hỗ trợ.');for(const h of Object.values(p.heroes))h.relic??=relicSave();if(!p.campaign.stars)p.campaign.stars=Object.fromEntries(Array.from({length:p.campaign.cleared},(_,i)=>[i+1,1]));p.campaign.claimedStars??=[];p.campaign.artifacts??={};if(p.pending)p.pending={...encounter(p.pending.mode,p.pending.index),...p.pending};return p;}const p=memory?clone(memory):fresh(now());p.campaign.stars??={};p.campaign.claimedStars??=[];p.campaign.artifacts??={};return p;}
    function save(p){p.updated=now();p.revision++;if(storage)storage.setItem(KEY,JSON.stringify(p));else memory=clone(p);return p;}
    function daily(p){if(day(now())>p.daily.date)p.daily={date:day(now()),progress:{login:1,campaign:0,boss:0,spend:0},claimed:[],seals:0,bossWins:0};}
    function tx(fn){const p=load();daily(p);const value=fn(p);save(p);return value;}
    function read(){const p=load();daily(p);return clone(p);}
    function amount(p,id){return id in p.wallet?p.wallet[id]:p.materials[id]||0;}
    function spend(p,cost){for(const [id,n] of Object.entries(cost)){check(Number.isSafeInteger(n)&&n>=0,'Chi phí không hợp lệ.');check(amount(p,id)>=n,`Thiếu ${RESOURCES[id]?.[0]||id}: cần ${n.toLocaleString('vi-VN')}.`);}for(const [id,n]of Object.entries(cost)){if(id in p.wallet)p.wallet[id]-=n;else p.materials[id]-=n;}p.daily.progress.spend+=cost.gold||0;}
    function grant(p,reward){const actual={};for(const [id,requested]of Object.entries(reward)){check(id!=='gems','Đá Ngọc chỉ nhận từ giao dịch nạp được máy chủ xác nhận.');check(id in RESOURCES&&Number.isSafeInteger(requested)&&requested>=0,'Phần thưởng không hợp lệ.');const n=id==='seals'?Math.min(requested,Math.max(0,DAILY_SEAL_CAP-p.daily.seals)):requested;if(id==='seals')p.daily.seals+=n;if(id in p.wallet)p.wallet[id]+=n;else p.materials[id]=(p.materials[id]||0)+n;actual[id]=n;}return actual;}
    function note(p,message){p.log.unshift({at:now(),message});p.log=p.log.slice(0,60);}
    function id(){return `${now().toString(36)}-${load().revision.toString(36)}-${(++sequence).toString(36)}-${Math.floor(random()*1e12).toString(36)}`;}
    function addHero(p,key){if(p.heroes[key])p.heroes[key].copies++;else p.heroes[key]=heroSave();}
    function gear(p,rarity,slot){check(p.equipment.length<500,'Túi trang bị đã đầy (500). Hãy phân rã trước.');const slots=Object.keys(SLOTS);slot=slot||slots[Math.floor(random()*slots.length)];const options=slot==='weapon'?['stun','lifesteal','pierce']:['steadfast','ward'];const g={id:id(),slot,rarity,level:0,affix:rarity==='divine'?options[Math.floor(random()*options.length)]:null};p.equipment.push(g);return g;}
    const api={read,stats:(key,normal=false)=>stats(read(),key,normal),offline:()=>offline(read(),now()),select:key=>tx(p=>{check(p.heroes[key],'Bạn chưa sở hữu tướng này.');p.selected=key;}),
      summonQuote:count=>summonQuote(read(),count),
      claimChapter:(chapter,milestone)=>tx(p=>{const progress=chapterProgress(p,chapter),reward=chapterReward(chapter,milestone);check(progress.total>=milestone,'Chưa đủ sao của chương này.');const key=`world2:${chapter}:${milestone}`;check(!p.campaign.claimedStars.includes(key),'Mốc sao này đã nhận.');const actual=grant(p,reward);p.campaign.claimedStars.push(key);note(p,`Nhận thưởng chương ${chapter} · ${milestone} sao`);return actual;}),
      claimOffline:()=>tx(p=>{const pending=offline(p,now());check(pending.hours>=1/60,'Cần ít nhất một phút để nhận thưởng.');const actual=grant(p,{gold:pending.gold,exp:pending.exp,seals:pending.seals});p.offlineAt=Math.max(now(),p.offlineAt);note(p,'Nhận thưởng offline');return actual;}),
      claimDaily:quest=>tx(p=>{const q=DAILY.find(q=>q.id===quest);check(q,'Nhiệm vụ không tồn tại.');check(!p.daily.claimed.includes(quest),'Bạn đã nhận thưởng hôm nay.');check(p.daily.progress[quest]>=q.target,'Chưa hoàn thành nhiệm vụ.');const actual=grant(p,q.reward);p.daily.claimed.push(quest);note(p,'Nhiệm vụ: '+q.name);return actual;}),
      levelUp:(key,count=1)=>tx(p=>{check(int(count,1,10),'Chỉ tăng 1–10 cấp mỗi lần.');const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const rewards={tickets:0};for(let i=0;i<count;i++){check(h.level<500,'Đã đạt cấp tối đa 500.');spend(p,levelCost(h.level));h.level++;if((h.level===10||h.level===25||h.level%50===0)&&!h.ticketMilestones.includes(h.level)){h.ticketMilestones.push(h.level);grant(p,{tickets:1});rewards.tickets++;}}note(p,`${HEROES[key].name} đạt cấp ${h.level}`);return rewards;}),
      starUp:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const cost=starCost(h.stars);check(h.copies-1>=cost.copies,`Cần ${cost.copies} bản sao cùng tướng (ngoài bản chính).`);spend(p,{gold:cost.gold,essence:cost.essence});h.copies-=cost.copies;h.stars++;note(p,`${HEROES[key].name} đạt ${h.stars} sao`);}),
      evolve:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const e=EVOLUTION[h.evolution];check(e,'Đã tiến hóa tối đa.');check(h.level>=e.level&&h.stars>=e.stars,`Cần cấp ${e.level} và ${e.stars} sao.`);spend(p,{gold:e.gold,essence:e.essence,ore:e.ore});h.evolution++;note(p,HEROES[key].name+': '+e.name);}),
      train:(key,index)=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');spend(p,skillCost(h,index));h.skills[index]++;note(p,'Nâng '+HEROES[key].skills[index]);}),
      fuse:key=>tx(p=>{check(HEROES[key],'Tướng không hợp lệ.');check((p.fragments[key]||0)>=80,'Cần 80 mảnh cùng tướng.');p.fragments[key]-=80;addHero(p,key);note(p,'Ghép tướng '+HEROES[key].name);}),
      summon:(count=1,payment='tickets')=>tx(p=>{
        check(count===1||count===10,'Chọn triệu hồi 1 hoặc 10 lần.');check(payment==='tickets'||payment==='gems','Nguồn thanh toán không hợp lệ.');check(p.equipment.length+count<=500,'Cần thêm chỗ trống trong túi trang bị.');spend(p,{[payment]:count*(payment==='gems'?120:1)});const results=[];
        for(let i=0;i<count;i++){
          let roll=Math.floor(random()*1000000),kind='material';for(const [k,weight]of SUMMON_TABLE){if(roll<weight){kind=k;break;}roll-=weight;}
          p.summon.total++;p.summon.dry++;p.summon.fragmentDry++;
          if(p.summon.dry>=300)kind='hero';else if(p.summon.fragmentDry>=30&&!['hero','fragments'].includes(kind))kind='fragments';
          const key=SUMMON_BANNER.hero;let result;
          if(kind==='hero'){addHero(p,key);p.summon.dry=0;result={kind,hero:key,rarity:'legendary',name:HEROES[key].name};}
          else if(kind==='novice'){addHero(p,'novice');result={kind:'hero',hero:'novice',rarity:'common',name:'Tân'};}
          else if(kind==='fragments'){const count=2+Math.floor(random()*4);p.fragments[key]=(p.fragments[key]||0)+count;p.summon.fragmentDry=0;result={kind,hero:key,count,rarity:'rare',name:`${count} mảnh ${HEROES[key].name}`};}
          else if(kind.endsWith('Gear')){const rarity={commonGear:'common',rareGear:'rare',epicGear:'epic',legendaryGear:'legendary',divineGear:'divine'}[kind],g=gear(p,rarity);result={kind:'gear',gear:g,rarity,name:SLOTS[g.slot]+' '+RARITIES[rarity].name};}
          else{const resource=['exp','ore','wood','cloth'][Math.floor(random()*4)],count=resource==='exp'?5:8;grant(p,{[resource]:count});result={kind:'material',resource,count,rarity:'common',name:`${RESOURCES[resource][0]} ×${count}`};}
          results.push(result);
        }
        p.summon.last=results;note(p,'Triệu hồi '+count+' lần');return results;
      }),
      begin:(mode,index)=>tx(p=>{check(p.heroes[p.selected],'Chưa chọn tướng.');if(mode==='campaign')check(index<=p.campaign.cleared+1,'Chưa mở ải này.');if(mode==='boss')check(index<=p.boss.best+1,'Chưa mở tầng boss này.');if(['pvp','duel'].includes(mode))check(index===1,'Trận đấu tập không hợp lệ.');const e=encounter(mode,index),hero=mode==='duel'?'novice':p.selected;const token=id();p.pending={...e,token,hero,started:now(),counter:counterProgress(p,e.chapter),stats:stats(p,hero,['pvp','duel'].includes(mode))};if(mode==='duel')p.pending.stats={...p.pending.stats,hp:290,attack:1.53,defense:0,active:1,mutation:false,awakened:false,evolution:0,skills:[1,0,0,0],affixes:[]};return clone(p.pending);}),
      settle:(token,won,damage=0,performance={})=>tx(p=>{check(p.pending&&p.pending.token===token,'Trận đã kết thúc hoặc mã trận không hợp lệ.');check(typeof won==='boolean'&&Number.isFinite(damage)&&damage>=0,'Kết quả không hợp lệ.');const b=p.pending;p.pending=null;let counterReward=null;p.receipts.push(token);p.receipts=p.receipts.slice(-100);let reward={};
        if(won&&b.mode==='campaign'){const first=b.index>p.campaign.cleared;reward=campaignLoot(p,b);if(first)p.campaign.cleared=b.index;p.daily.progress.campaign++;if(first&&b.index%50===0){const target=SUMMON_BANNER.hero;p.fragments[target]=(p.fragments[target]||0)+3;}}
        if(won&&b.mode==='campaign')p.campaign.stars[b.index]=Math.max(p.campaign.stars[b.index]||0,stageStars(b,won,performance));
        if(won&&b.mode==='campaign'&&b.tier==='elite'&&stageStars(b,true,performance)===3){const counter=counterProgress(p,b.chapter),local=(b.index-1)%50+1;if(counter&&!counter.claimed.includes(local)){p.campaign.artifacts[counter.theme]={claimed:[...counter.claimed,local]};counterReward={...counterProgress(p,b.chapter),earned:3};}}
        if(b.mode==='boss'){p.boss.damageBest=Math.max(p.boss.damageBest,Math.floor(damage));if(won){p.boss.best=Math.max(p.boss.best,b.index);p.boss.wins++;p.daily.progress.boss++;p.daily.bossWins++;const diminishing=p.daily.bossWins>12?.25:1;reward={gold:Math.floor((1200+b.index*130)*diminishing),exp:Math.max(2,Math.floor((16+b.index)*diminishing)),seals:p.daily.bossWins<=24?65:0,essence:1+Number(b.index%5===0),ore:3};if(b.index>=60&&random()<.01)reward.divineOre=1;}}
        if(b.mode==='pvp'){p.pvp[won?'wins':'losses']++;p.pvp.rating=Math.max(0,p.pvp.rating+(won?15:-10));}
        const actual=grant(p,reward);if(counterReward)actual.counterReward=counterReward;note(p,`${b.name}: ${won?'thắng':'thua'}`);return actual;
      }),
      buy:(resource,count=1)=>tx(p=>{const prices={exp:120,ore:80,wood:55,cloth:55,skillBooks:1800};check(resource in prices&&int(count,1,20),'Mặt hàng không bán bằng vàng.');spend(p,{gold:prices[resource]*count});return grant(p,{[resource]:count});}),
      purchase:(productId,count=1)=>tx(p=>{const product=WORLD.SHOP.find(item=>item.id===productId);check(product&&int(count,1,product.kind==='gear'?1:20),'Vật phẩm hoặc số lượng mua không hợp lệ.');if(product.kind==='gear')check(p.equipment.length<500,'Túi trang bị đã đầy.');spend(p,{[product.currency]:product.price*count});let item;if(product.kind==='resource')grant(p,{[product.target]:count});else item=gear(p,product.rarity,product.target);note(p,`Mua ${product.name} ×${count}`);return {product:product.id,count,currency:product.currency,price:product.price*count,gear:item};}),
      craft:(slot,rarity='uncommon')=>tx(p=>{check(slot in SLOTS&&['uncommon','rare','epic','legendary','divine'].includes(rarity),'Công thức không hợp lệ.');const rank=['uncommon','rare','epic','legendary','divine'].indexOf(rarity)+1;check(p.campaign.cleared>=rank*20,`Cần vượt ải ${rank*20}.`);const cost={gold:rank*rank*8000,ore:rank*25,wood:rank*15,cloth:rank*15,essence:rank*10};if(rarity==='divine'){check(p.campaign.cleared>=300,'Trang bị Thần cần vượt ải 300.');cost.divineOre=50;}spend(p,cost);return gear(p,rarity,slot);}),
      equip:(key,gearId)=>tx(p=>{const h=p.heroes[key],g=p.equipment.find(g=>g.id===gearId);check(h&&g,'Tướng hoặc trang bị không tồn tại.');for(const owned of Object.values(p.heroes))for(const [slot,id]of Object.entries(owned.gear))if(id===gearId)delete owned.gear[slot];h.gear[g.slot]=g.id;}),
      strengthen:gearId=>tx(p=>{const g=p.equipment.find(g=>g.id===gearId);check(g&&g.level<20,'Trang bị đã +20 hoặc không tồn tại.');spend(p,{gold:(g.level+1)*900,ore:(g.level+1)*2});g.level++;}),
      trainRelic:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const r=h.relic;check(r.level<r.evolution*20,'Tiến hóa bảo bối để mở giới hạn cấp mới.');spend(p,relicLevelCost(r));r.level++;note(p,`${RELICS[key]} đạt cấp ${r.level}`);}),
      evolveRelic:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const r=h.relic,c=relicEvolveCost(r);check(r.level>=r.evolution*20,'Cần đạt giới hạn cấp của dạng hiện tại.');check(h.level>=r.evolution*50,`Cần tướng cấp ${r.evolution*50}.`);spend(p,c);r.evolution++;note(p,`${RELICS[key]} tiến hóa dạng ${r.evolution}`);}),
      salvage:gearId=>tx(p=>{const g=p.equipment.find(g=>g.id===gearId);check(g,'Trang bị không tồn tại.');check(!Object.values(p.heroes).some(h=>Object.values(h.gear).includes(gearId)),'Tháo trang bị trước khi phân rã.');p.equipment=p.equipment.filter(g=>g.id!==gearId);return grant(p,{ore:Math.ceil(RARITIES[g.rarity].factor*3),gold:Math.ceil(RARITIES[g.rarity].factor*80)});}),
      unequip:(key,slot)=>tx(p=>{check(p.heroes[key]&&slot in SLOTS,'Ô trang bị không hợp lệ.');delete p.heroes[key].gear[slot];}),
      saveEvent:draft=>tx(p=>{const e=normalizeEvent(draft);const i=p.events.findIndex(x=>x.id===e.id);if(i>=0)p.events[i]=e;else{check(p.events.length<100,'Tối đa 100 sự kiện.');p.events.push(e);}return e;}),
      removeEvent:eventId=>tx(p=>{p.events=p.events.filter(e=>e.id!==eventId);}),
      exportSave:()=>JSON.stringify(read(),null,2),
      pending:()=>read().pending
    };
    // Persist the starter once. Reloading never repeats the starter grant.
    if(!storage?.getItem(KEY)&&!memory)save(fresh(now()));
    return api;
  }
  function normalizeEvent(draft){check(draft&&typeof draft==='object','Cấu hình không hợp lệ.');const e={...EVENT_TEMPLATE,...draft};check(typeof e.id==='string'&&/^[a-z0-9-]{1,50}$/.test(e.id),'ID chỉ gồm chữ thường, số, dấu gạch ngang.');for(const [key,max]of [['title',80],['description',1200]])check(typeof e[key]==='string'&&e[key].length<=max,`${key} quá dài.`);check(typeof e.enabled==='boolean'&&e.status==='coming-soon','Sự kiện hiện chỉ hỗ trợ trạng thái coming-soon.');check(['icon-event','icon-gift','icon-arena','chest'].includes(e.banner),'Banner không hợp lệ.');check(int(Number(e.order),0,999),'Thứ tự không hợp lệ.');e.order=Number(e.order);for(const k of ['startsAt','endsAt'])check(e[k]===''||Number.isFinite(Date.parse(e[k])),'Ngày giờ không hợp lệ.');check(!e.startsAt||!e.endsAt||Date.parse(e.endsAt)>Date.parse(e.startsAt),'Ngày kết thúc phải sau ngày bắt đầu.');return Object.fromEntries(Object.keys(EVENT_TEMPLATE).map(k=>[k,e[k]]));}
  return {VERSION,KEY,MAX_LEVEL,DAILY_SEAL_CAP,WORLD,HEROES,RARITIES,AFFIXES,SLOTS,SLOT_ART,RELICS,relicLevelCost,relicEvolveCost,RESOURCES,SUMMON_TABLE,SUMMON_BANNER,STAR_MILESTONES,CREATURES,EVOLUTION,VIP,DAILY,EVENT_TEMPLATE,makeEngine,levelCost,starCost,skillCost,skillUnlock,stats,offline,encounter,summonQuote,stageStars,campaignRewardPreview,chapterProgress,chapterReward,counterProgress,normalizeEvent};
});
