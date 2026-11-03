/* Shared local progression model. Rewards never contain premium currency.
 * Browser + Node export allows the same rules to drive the hub and combat.
 * This client save is a playable prototype; multiplayer/payment authority belongs on a server.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenProgression=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const WORLD=typeof module==='object'&&module.exports?require('./world.js'):globalThis.GemwovenWorld;
  const VERSION=1,KEY='gemwoven.progression.v1',MAX_LEVEL=500,DAILY_SEAL_CAP=1600,CLOCK_TOLERANCE=10*60000;
  const HEROES={
    novice:{name:'Hiro',title:'Lữ Khách Tập Sự',element:'Thường',hp:145,attack:.85,rarity:'common',skills:['Kiếm Nhiệt Huyết','Giữ Thế','Bước Tiến','Ý Chí Lữ Khách']},
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
  // Star forms: 4★ and 6★ change body, weapon and the active skill. `power`
  // multiplies the active skill; form 3 adds the signature listed in skillKit.
  const HERO_FORMS={
    fire:[{name:'Viêm Kiếm Sĩ',weapon:'Kiếm Hỏa Hồ',skill:'Viêm Long Trảm',power:1},
      {name:'Hồ Diễm Kiếm Vệ',weapon:'Kiếm Hỏa Hồ khắc ấn',skill:'Hồ Diễm Long Trảm',power:1.1},
      {name:'Cửu Vĩ Viêm Đế',weapon:'Nguyệt đao Cửu Vĩ',skill:'Cửu Dương Hồ Diễm',power:1.25,signature:'Luôn gây thiêu đốt; thiêu đốt kéo dài thêm 1 lượt.'}],
    ice:[{name:'Băng Tâm Vệ',weapon:'Khiên Băng Tâm',skill:'Thiên Băng Giáng',power:1},
      {name:'Nguyệt Sương Hộ Vệ',weapon:'Trượng trăng khắc băng văn',skill:'Nguyệt Sương Băng Giáng',power:1.1},
      {name:'Tuyết Nguyệt Nữ Đế',weapon:'Nguyệt kích và quạt sương',skill:'Thiên Nguyệt Tuyết Liên',power:1.25,signature:'Giáp từ tuyệt kỹ ×1,6; địch mất 25 năng lượng.'}],
    earth:[{name:'Thiết Giáp Vệ',weapon:'Trọng chùy và mộc thuẫn',skill:'Mộc Linh Hộ Thể',power:1},
      {name:'Ngọc Thụ Hộ Vệ',weapon:'Chùy và khiên gia cố cổ mộc',skill:'Ngọc Thụ Hộ Thể',power:1.1},
      {name:'Thế Giới Thụ Thần Vệ',weapon:'Thần chùy và khiên cổ thụ',skill:'Vạn Mộc Thiên Thành',power:1.25,signature:'Bộc phá thêm ×0,5; hồi máu kéo dài 4 lượt.'}],
    lightning:[{name:'Lôi Cuồng Sư',weapon:'Tinh điện trượng',skill:'Ngũ Tinh Lôi',power:1},
      {name:'Tinh Lôi Sứ Giả',weapon:'Tinh điện trượng khắc sao',skill:'Tinh Lôi Ngũ Phạt',power:1.1},
      {name:'Thiên Tinh Lôi Chủ',weapon:'Thương quỹ đạo thiên hà',skill:'Cửu Thiên Tinh Phạt',power:1.25,signature:'Giáng 9 tia sét thay vì 5.'}],
    shadow:[{name:'Ảnh Kiếm Sĩ',weapon:'Kiếm vô diện',skill:'Ngũ Ảnh Trảm',power:1},
      {name:'Dạ Ảnh Kiếm Sĩ',weapon:'Bạt kiếm Nguyệt Ảnh',skill:'Dạ Ảnh Ngũ Trảm',power:1.1},
      {name:'Tử Thần Vô Diện',weapon:'Lưỡi liềm Thần Chết',skill:'Hắc Liêm Đoạt Hồn',power:1.25,signature:'Tuyệt kỹ xuyên giáp, +50% khi địch dưới 30% HP; sau đó hóa mờ, né mọi đòn và hiệu ứng bất lợi 1 lượt.'}]
  };
  // Stars unlock forms (4★ form 2, 6★ form 3) and an unlocked form is never lost. Combat always
  // fights in the highest unlocked form (its art and kit belong together); the player may pick
  // any unlocked form as the hero's look in town (h.look), free. Unset means the highest.
  const FORM_STARS=[1,4,6];
  function formMax(key,h){return key==='novice'||!HERO_FORMS[key]?1:h?.stars>=6?3:h?.stars>=4?2:1;}
  const heroForm=formMax;
  function lookForm(key,h){const max=formMax(key,h),chosen=Math.floor(Number(h?.look)||0);return chosen>=1&&chosen<=max?chosen:max;}
  // Relics belong to their hero; five visible forms, twenty training levels per form.
  const relicSave=()=>({level:1,evolution:1});
  // Relic: +0,25% HP/Công per level and +2,5% per form after the first.
  function relicBonus(r){r=r||relicSave();return (r.level-1)*.0025+(r.evolution-1)*.025;}
  function relicLevelCost(r){check(r.level<100,'Bảo bối đã đạt cấp 100.');return {gold:Math.ceil(1800*r.level**1.45),essence:Math.ceil(r.level/5),ore:Math.ceil(r.level/3)};}
  function relicEvolveCost(r){check(r.evolution<5,'Bảo bối đã đạt dạng cuối.');return {gold:50000*r.evolution**2,essence:40*r.evolution,divineOre:5*r.evolution};}
  const RESOURCES={gold:['Đồng vàng','coins'],gems:['Đá Ngọc','mana'],tickets:['Vé triệu hồi','ticket'],exp:['Sách kinh nghiệm','exp-book'],seals:['Ấn tu luyện','crest'],skillBooks:['Bí kíp kỹ năng','skill-book'],essence:['Tinh hoa tiến hóa','fire-essence'],ore:['Quặng sắt','ore'],wood:['Gỗ mềm','wood'],cloth:['Vải thô','cloth'],divineOre:['Mảnh thần thạch','lightning-essence']};
  // Summons give the banner hero whole or as fragments, gear and materials. Hiro is the starter
  // hero every account begins with and is not in the pool (his old share went to materials).
  const SUMMON_TABLE=[['hero',10000],['fragments',13500],['commonGear',285000],['rareGear',20000],['epicGear',1500],['legendaryGear',200],['divineGear',10],['material',669790]];
  // One released featured hero per banner. Other unreleased heroes stay out of
  // this pool; owning an earlier hero is unaffected when the next banner ships.
  // Hard pity: the banner hero at the latest on the 100th pull without one (carried across banners).
  const SUMMON_PITY=100;
  const SUMMON_BANNER={id:'ember-pact',hero:'fire',title:'Khế Ước Hỏa Hồ'};
  // Display-only label so battle results can list chapter-boss fragments beside
  // resources. Non-enumerable: never a wallet/material and never accepted by grant().
  Object.defineProperty(RESOURCES,'heroFragments',{value:['Mảnh '+HEROES[SUMMON_BANNER.hero].name,'portrait-'+SUMMON_BANNER.hero],enumerable:false});
  Object.defineProperty(RESOURCES,'noviceFragments',{value:['Mảnh Hiro','portrait-novice'],enumerable:false});
  const STAR_MILESTONES=[50,100,150];
  // Hiro is never summoned, so his copies come from play (newbie week, campaign daily quest, chapter star chests and first clears of
  // every tenth endless floor). 80 fragments fuse into a copy, as for every hero.
  const HIRO_FRAGMENTS={chest:{50:0,100:10,150:20},endlessEvery:10,endless:10};
  const CREATURES=[{id:'slime',name:'Slime Rêu',skill:'Nảy Mầm'},{id:'acorn',name:'Mầm Hạt Dẻ',skill:'Hạt Nảy'},{id:'bat',name:'Dơi Hang',skill:'Cánh Đêm'}];
  const EVOLUTION=[
    {level:50,stars:1,gold:12000,essence:15,ore:20,piece:'weapon',name:'Vũ khí thức tỉnh',perk:'Tuyệt kỹ +5% sức mạnh'},
    {level:100,stars:2,gold:40000,essence:40,ore:50,piece:'shoulders',name:'Giáp vai linh lực',perk:'Mở kỹ năng Biến Dị'},
    {level:180,stars:3,gold:120000,essence:90,ore:100,piece:'gloves',name:'Găng tay cộng hưởng',perk:'Vào trận với 20 năng lượng; mở kỹ năng Chân Thân (Biến Thân)'},
    {level:280,stars:4,gold:350000,essence:180,ore:180,piece:'boots',name:'Giáp chân chuyển hóa',perk:'Biến Dị mạnh thêm 1 cấp'},
    {level:400,stars:5,gold:900000,essence:360,ore:300,piece:'crest',name:'Dấu ấn chân thân',perk:'Biến Thân 4 lượt, dư âm Công +15%'},
    {level:500,stars:6,gold:2200000,essence:800,ore:500,piece:'aura',name:'Lột xác toàn thân',perk:'Tuyệt kỹ thêm +10%; vào trận với 40 năng lượng'}
  ];
  // Mechanical value of the evolution perks above; combat reads it through skillKit.
  function evolutionBonus(evolution){const e=evolution|0;return {power:Number((1+(e>=1?.05:0)+(e>=6?.1:0)).toFixed(4)),startEnergy:e>=6?40:e>=3?20:0,mutationRank:e>=4?1:0};}
  const SKILL_MAX=10,SKILL_BRANCHES=['Chủ Động','Bị Động','Biến Dị','Chân Thân'];
  // The fourth branch (Chân Thân → Biến Thân) opens at level 180 + evolution 3 (Codex round 1 and 4: the best moment
  // must not wait 190+ days); level 400 + evolution 5 strengthens it.
  const SKILL_GATES=[{level:1,evolution:0},{level:10,evolution:0},{level:100,evolution:2},{level:180,evolution:3}];
  function skillGateText(index){const g=SKILL_GATES[index];return !g||index===0?'':`Mở ở cấp ${g.level}`+(g.evolution?` · tiến hóa ${g.evolution}`:'')+'.';}
  // Base numbers of each active skill; ranks, forms and evolution scale them in skillKit.
  const SKILL_KIT={novice:{base:70,hits:1},fire:{base:135,hits:1},ice:{base:60,hits:1,armor:25},earth:{base:0,hits:0,heal:40,burst:3,stun:2,regen:3},lightning:{base:140,hits:5},shadow:{base:150,hits:5}};
  const VIP=[0,100000,300000,600000,1000000,2000000,4000000,7000000,12000000,20000000,35000000,60000000,100000000].map((spend,level)=>({level,spend,dailyGold:level>=2?1000:level?500:0,offlineHours:12+Math.floor(level/3),avatar:level>=1,entryEffect:level>=3,chatEffect:level>=5,equipmentSkin:level>=8,heroSkin:level>=10,combatStats:false}));
  const DAILY=[{id:'login',name:'Ghé thăm thị trấn',target:1,reward:{gold:500,exp:10,seals:80,tickets:1}}, {id:'campaign',name:'Hoàn thành 3 trận vượt ải',target:3,reward:{gold:1500,exp:20,seals:120,noviceFragments:6}}, {id:'boss',name:'Thắng 2 trận Boss Vô Hạn',target:2,reward:{gold:2000,exp:25,seals:150}}, {id:'spend',name:'Dùng 1.000 vàng',target:1000,reward:{gold:800,skillBooks:1,seals:80}}];
  // Hành Trình Tân Thủ: seven gifts, one per GMT+7 day since the account was made (missed days
  // can be caught up). 80 Mảnh Hiro in the first week = his second star.
  const NEWBIE=[{noviceFragments:10,gold:2000,tickets:2},{noviceFragments:10,exp:30},{noviceFragments:10,tickets:2},{noviceFragments:10,essence:10},{noviceFragments:10,skillBooks:3},{noviceFragments:10,ore:30},{noviceFragments:20,tickets:5}];
  function newbieState(p,at){const days=Math.round((Date.parse(day(at))-Date.parse(day(p.created||at)))/DAY_MS)+1,claimed=p.newbie?.claimed||[];
    return NEWBIE.map((reward,i)=>({day:i+1,reward,claimed:claimed.includes(i+1),open:i+1<=days}));}
  // Weekly quests (reset Monday 00:00 GMT+7): one ticket each, so play gives about 40 tickets per 28 days
  // (one a day from the visit quest plus three a week here).
  const WEEKLY=[{id:'campaign',name:'Thắng 15 trận vượt ải',target:15,reward:{tickets:1,gold:8000,exp:40}},{id:'boss',name:'Thắng 8 trận Boss Vô Hạn',target:8,reward:{tickets:1,essence:15,ore:20}},{id:'daily',name:'Nhận thưởng nhiệm vụ ngày 12 lần',target:12,reward:{tickets:1,skillBooks:3,gold:5000}}];
  const week=ms=>{const d=new Date(ms+7*3600000),back=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-back)).toISOString().slice(0,10);};
  const EVENT_TEMPLATE={id:'new-event',title:'Sự kiện sắp ra mắt',description:'Cuộc phiêu lưu mới đang được chuẩn bị.',enabled:false,status:'coming-soon',startsAt:'',endsAt:'',banner:'icon-event',order:0};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const day=ms=>new Date(ms+7*3600000).toISOString().slice(0,10);
  const int=(n,min,max)=>Number.isFinite(n)&&Number.isInteger(n)&&n>=min&&n<=max;
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  // Mailbox: notices and gifts from the administrators. Attachments are ordinary resources
  // paid through grant(); Đá Ngọc can never be attached. Ấn tu luyện is not mailable either:
  // its account-wide daily cap would silently shrink a gift.
  const MAIL_LIMIT=50,MAIL_ATTACHMENTS=4,MAIL_COUNT_MAX=999999,MAIL_TITLE_MAX=60,MAIL_BODY_MAX=600,MAIL_FROM_MAX=40,MAIL_EXPIRY_DAYS=[1,30],DAY_MS=86400000;
  const MAIL_RESOURCES=Object.keys(RESOURCES).filter(id=>id!=='gems'&&id!=='seals');
  const MAIL_ADMIN='Ban Quản Trị Gemwoven';
  function welcomeMail(at){return {id:'welcome-mailbox',kind:'notice',from:MAIL_ADMIN,title:'Chào mừng đến Hòm Thư',
    body:'Chào mừng lữ khách đến với Gemwoven!\nHòm Thư là nơi Ban Quản Trị gửi thông báo và quà tặng cho bạn. Thư có quà mang biểu tượng hộp quà: mở thư và chọn “Nhận quà” để cất vật phẩm vào Túi Đồ.\nMột số thư có thời hạn và tự biến mất khi hết hạn, hãy nhận quà kịp thời. Thư đã đọc và đã nhận quà có thể xóa bất cứ lúc nào.',
    sentAt:at,expiresAt:null,attachments:[],read:false,claimed:false,source:'system'};}
  function mailText(value,max,label,required){
    check(typeof value==='string',label+' không hợp lệ.');const text=value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();
    check(!required||text.length>0,label+' không được để trống.');check(text.length<=max,`${label} tối đa ${max} ký tự.`);return text;
  }
  function mailAttachments(list){
    check(Array.isArray(list)&&list.length<=MAIL_ATTACHMENTS,`Tối đa ${MAIL_ATTACHMENTS} vật phẩm đính kèm.`);const seen=new Set();
    return list.map(a=>{
      check(a&&typeof a==='object','Vật phẩm đính kèm không hợp lệ.');check(a.resource!=='gems','Đá Ngọc không thể gửi qua thư.');
      check(MAIL_RESOURCES.includes(a.resource),'Vật phẩm này không thể gửi qua thư.');check(!seen.has(a.resource),'Mỗi loại vật phẩm chỉ đính kèm một lần.');seen.add(a.resource);
      const count=Number(a.count);check(int(count,1,MAIL_COUNT_MAX),`Số lượng mỗi vật phẩm từ 1 đến ${MAIL_COUNT_MAX.toLocaleString('vi-VN')}.`);return {resource:a.resource,count};
    });
  }
  // A studio draft becomes a stored mail; ids and the box limit are added by the engine.
  function normalizeMailDraft(draft,at){
    check(draft&&typeof draft==='object','Thư không hợp lệ.');check(['notice','gift'].includes(draft.kind),'Loại thư không hợp lệ.');
    const title=mailText(draft.title,MAIL_TITLE_MAX,'Tiêu đề',true),body=mailText(draft.body??'',MAIL_BODY_MAX,'Nội dung',false),from=mailText(draft.from||'Ban Quản Trị',MAIL_FROM_MAX,'Người gửi',true);
    const attachments=mailAttachments(draft.attachments||[]);
    check(draft.kind==='gift'?attachments.length>0:!attachments.length,draft.kind==='gift'?'Thư quà cần ít nhất 1 vật phẩm.':'Thư thông báo không kèm vật phẩm. Hãy chọn loại “Quà”.');
    const days=Number(draft.expiryDays);check(int(days,MAIL_EXPIRY_DAYS[0],MAIL_EXPIRY_DAYS[1]),`Thời hạn từ ${MAIL_EXPIRY_DAYS[0]} đến ${MAIL_EXPIRY_DAYS[1]} ngày.`);
    return {id:'',kind:draft.kind,from,title,body,sentAt:at,expiresAt:at+days*DAY_MS,attachments,read:false,claimed:false,source:'local-studio'};
  }
  const mailLive=(m,at)=>m.expiresAt==null||m.expiresAt>at;
  const mailPending=m=>m.attachments.length>0&&!m.claimed;
  function mailReward(m){const reward={};for(const a of mailAttachments(m.attachments))reward[a.resource]=a.count;return reward;}
  // Display helpers (Vietnamese, GMT+7 calendar days) shared by the hub and tests.
  function mailAge(sentAt,at){
    const d=Math.max(0,at-sentAt);if(d<60000)return 'Vừa xong';if(d<3600000)return Math.floor(d/60000)+' phút trước';
    const days=Math.round((Date.parse(day(at))-Date.parse(day(sentAt)))/DAY_MS);
    if(days===0||d<6*3600000)return Math.floor(d/3600000)+' giờ trước';if(days===1)return 'Hôm qua';if(days<7)return days+' ngày trước';
    const [y,mo,dd]=day(sentAt).split('-');return `${dd}/${mo}/${y}`;
  }
  function mailExpiry(expiresAt,at){if(expiresAt==null)return '';const left=expiresAt-at;if(left<=0)return 'Đã hết hạn';return left<DAY_MS?`Còn ${Math.max(1,Math.ceil(left/3600000))} giờ`:`Còn ${Math.ceil(left/DAY_MS)} ngày`;}
  const heroSave=()=>({level:1,stars:1,evolution:0,copies:1,skills:[1,0,0,0],gear:{},relic:relicSave(),ticketMilestones:[]});
  function fresh(now){return {version:VERSION,revision:0,created:now,updated:now,selected:'novice',wallet:{gold:1200,gems:0,tickets:0},materials:{exp:12,seals:0,skillBooks:0,essence:0,ore:5,wood:5,cloth:5,divineOre:0},heroes:{novice:heroSave()},fragments:{},equipment:[],campaign:{cleared:0},boss:{best:0,wins:0,damageBest:0},daily:{date:day(now),progress:{login:1,campaign:0,boss:0,spend:0},claimed:[],seals:0,bossWins:0,campaignWins:0},offlineAt:now,offlineBank:null,clock:{max:now,behind:false},summon:{total:0,dry:0,fragmentDry:0,last:[]},events:[],mail:[welcomeMail(now)],pending:null,receipts:[],vip:{level:0,paidTotal:0},log:[]};}
  function levelCost(level){check(int(level,1,499),'Cấp này không thể tăng thêm.');return {gold:Math.ceil(60+level*level*1.9),exp:Math.ceil(2+level*.6),seals:Math.ceil(6+level*.04+level*level*.014)};}
  function starCost(stars){check(int(stars,1,5),'Tướng đã đạt 6 sao.');return {copies:[0,1,2,3,5,8][stars],gold:[0,10000,35000,100000,300000,1000000][stars],essence:[0,10,25,60,140,300][stars]};}
  function skillUnlock(h,index){const g=SKILL_GATES[index];return !!(g&&h&&h.level>=g.level&&(h.evolution||0)>=g.evolution);}
  function skillCost(h,index){check(int(index,0,3),'Kỹ năng không hợp lệ.');check(skillUnlock(h,index),'Chưa đủ cấp hoặc tiến hóa để mở kỹ năng.');const rank=h.skills[index];check(rank<SKILL_MAX,'Kỹ năng đã đạt cấp 10.');return {gold:(rank+1)*1800,skillBooks:rank+1,essence:index>=2?(rank+1)*3:0};}
  const round=(n,d=4)=>Number(n.toFixed(d));
  // One resolved skill kit per hero save. Combat reads these numbers directly and
  // the hub prints them, so descriptions cannot drift from the rules.
  // Innate traits (Mika's sword, Yuki's 20% guard, Nori's 75% strikes, Lumi's
  // double energy, Noct's immunity to weakness) are always on; ranks add on top.
  function skillKit(key,h,normalized=false){
    check(HEROES[key],'Tướng không hợp lệ.');
    const base=SKILL_KIT[key],save=h||heroSave();
    const ranks=normalized?[1,0,0,0]:[0,1,2,3].map(i=>Math.max(0,Math.min(SKILL_MAX,Math.floor(Number(save.skills?.[i])||0))));
    const evolution=normalized?0:Math.max(0,Math.min(EVOLUTION.length,Math.floor(Number(save.evolution)||0))),form=normalized?1:heroForm(key,save),bonus=evolutionBonus(evolution);
    const formPower=HERO_FORMS[key]?.[form-1]?.power||1;
    const active=Math.max(1,ranks[0]),passive=ranks[1],mutation=ranks[2]?Math.min(SKILL_MAX+1,ranks[2]+bonus.mutationRank):0,awaken=ranks[3];
    const activePower=1+.08*(active-1),power=round(activePower*formPower*bonus.power);
    const kit={key,form,evolution,ranks,levels:[active,passive,mutation,awaken],activePower:round(activePower),formPower,evolutionPower:round(bonus.power),power,startEnergy:bonus.startEnergy,
      base:base.base,hits:base.hits,damage:Math.round(base.base*power),sword:1,attackScale:1,shieldGem:4,energy:1,damageReduction:0,attackBonus:0,hpBonus:0,defenseBonus:0,
      mutation:mutation>0,awakened:awaken>0,awaken:{attack:0,hp:0},
      // Biến Thân (docs/GAME_DESIGN.md §2.4, Codex round 4): once a battle, pressed by the player when HP ≤ 50% or after
      // the second ultimate; for its owner's next turns Công +25% (rank 1) → +40% (rank 10) and 15% less damage taken,
      // immune to new stun/freeze; afterwards +10% Công to the end (it replaces the bonus, never adds). Level 400 +
      // evolution 5: 4 turns and +15% afterwards. Not in normalized play (Chuẩn Hóa, local duel, friendly fights).
      transform:awaken&&!normalized?{turns:save.level>=400&&evolution>=5?4:3,attack:round(.25+(awaken-1)*.15/9),reduce:.15,after:save.level>=400&&evolution>=5?.15:.1}:null};
    // Hiro's traveller's edge: sword gems +20% (balance-sim: geared Hiro wins about half of chapter bosses at the
    // recommended level). Normalized play (local PvP, practice) keeps both sides even.
    if(key==='novice'){if(!normalized)kit.sword=1.2;kit.defenseBonus=passive?round(.02+.002*(passive-1)):0;kit.regen=mutation?round(.01+.001*(mutation-1)):0;}
    if(key==='fire'){kit.sword=1.6;kit.attackBonus=round(.025*passive);if(mutation||form===3)kit.burn={base:round(8*(1+.1*mutation),2),turns:(mutation>=10?4:mutation>=5?3:2)+(form===3?1:0)};}
    if(key==='ice'){kit.shieldGem=8;kit.damageReduction=.2;kit.defenseBonus=round(.008*passive);kit.armor=Math.round((base.armor+3*(active-1))*(form===3?1.6:1));kit.enemyDrain=form===3?25:0;kit.mutationArmor=mutation?round(.06+.005*(mutation-1)):0;}
    if(key==='earth'){kit.attackScale=.75;kit.hpBonus=round(.015*passive);kit.heal=Math.round((base.heal+5*(active-1))*formPower*bonus.power);kit.burst=round(base.burst+.1*(active-1)+(form===3?.5:0),2);kit.stun=base.stun;kit.regenTurns=base.regen+(form===3?1:0);kit.mutationArmor=mutation?round(.04+.005*(mutation-1)):0;}
    if(key==='lightning'){kit.energy=round(2+.05*passive);kit.hits=form===3?9:base.hits;kit.drain=mutation?20+mutation:0;kit.energyReturn=mutation?5:0;}
    // Six-star Noct: nine reaping cuts that ignore armour, then one enemy turn of untouchable veil.
    if(key==='shadow'){kit.attackBonus=round(.012*passive);kit.echo=mutation?12+3*mutation:0;kit.execute=form===3?{threshold:.3,bonus:1.5}:null;kit.hits=form===3?9:base.hits;kit.pierceArmor=form===3;kit.veil=form===3?1:0;}
    return kit;
  }
  const vi=(n,d=1)=>Number(n).toLocaleString('vi-VN',{maximumFractionDigits:d});
  const pct=x=>vi(x*100,1)+'%';
  // Vietnamese compact amounts (N = nghìn, Tr = triệu, T = tỷ). Floors, so a balance never reads higher than owned.
  // min lowers the threshold for tight labels (e.g. 1.200 -> "1,2 N" with min=1000).
  const compact=(n,min=10000)=>{n=Math.floor(Number(n)||0);if(n<(min>=1000?min:10000))return n.toLocaleString('vi-VN');const [d,u]=n>=1e9?[1e9,' T']:n>=1e6?[1e6,' Tr']:[1e3,' N'];return (Math.floor(n/d*10)/10).toLocaleString('vi-VN',{maximumFractionDigits:1})+u;};
  // [label, value, unit] rows that change with rank; "next level" text diffs them.
  function skillValues(kit,slot){
    const k=kit.key;
    if(slot===0)return k==='earth'?[['Hồi',vi(kit.heal),' HP/lượt'],['Bộc phá','×'+vi(kit.burst,2),'']]:[['Sát thương',vi(kit.damage),''],...(k==='ice'?[['Giáp',vi(kit.armor),'']]:[])];
    if(slot===1)return [{novice:()=>['Giảm sát thương',pct(kit.defenseBonus),''],fire:()=>['Công','+'+pct(kit.attackBonus),''],ice:()=>['Phòng thủ','+'+pct(kit.defenseBonus),''],earth:()=>['HP','+'+pct(kit.hpBonus),''],lightning:()=>['Năng lượng','×'+vi(kit.energy,2),''],shadow:()=>['Công','+'+pct(kit.attackBonus),'']}[k]()];
    if(slot===2){
      if(!kit.mutation)return [];
      return {novice:()=>[['Hồi',pct(kit.regen),' HP/lượt']],fire:()=>[['Thiêu đốt',vi(kit.burn.base),'/lượt'],['Thời gian',String(kit.burn.turns),' lượt']],ice:()=>[['Giáp',pct(kit.mutationArmor),' HP']],earth:()=>[['Giáp',pct(kit.mutationArmor),' HP']],lightning:()=>[['Hút',String(kit.drain),' năng lượng']],shadow:()=>[['Tàn ảnh',String(kit.echo),' sát thương']]}[k]();
    }
    return kit.transform?[['Công','+'+pct(kit.transform.attack),''],['Lượt',String(kit.transform.turns),''],['Dư âm','+'+pct(kit.transform.after),' Công']]:[];
  }
  function skillDescription(kit,slot){
    const k=kit.key;
    if(slot===0){
      const signature=k==='fire'&&kit.form===3?` Luôn thiêu đốt ${vi(kit.burn.base)} sát thương cơ bản/lượt trong ${kit.burn.turns} lượt.`:k==='shadow'&&kit.execute?' Xuyên giáp; Đoạt Hồn: thêm 50% khi địch dưới 30% HP. Sau đó hóa mờ: né mọi đòn và hiệu ứng bất lợi trong 1 lượt.':k==='ice'&&kit.enemyDrain?` Địch mất ${kit.enemyDrain} năng lượng.`:'';
      return {novice:()=>`Một nhát kiếm gỗ gây ${vi(kit.damage)} sát thương cơ bản.`,fire:()=>`Kiếm khí rực lửa phát nổ, gây ${vi(kit.damage)} sát thương cơ bản.`,ice:()=>`Nhận ${kit.armor} giáp; băng giáng gây ${vi(kit.damage)} sát thương cơ bản và choáng 1 lượt.`,
        earth:()=>`Choáng ${kit.stun} lượt; sát thương tích trong lúc choáng nổ ×${vi(kit.burst,2)}. Hồi ${kit.heal} HP/lượt trong ${kit.regenTurns} lượt.`,lightning:()=>`Gọi ${kit.hits} tia sét liên tiếp, tổng ${vi(kit.damage)} sát thương cơ bản.`,shadow:()=>kit.form===3?`Sương đen trùm lấy địch, ${kit.hits} nhát liềm vô hình, tổng ${vi(kit.damage)} sát thương cơ bản.`:`${kit.hits} lần lướt chém, tổng ${vi(kit.damage)} sát thương cơ bản.`}[k]()+signature;
    }
    if(slot===1){
      const learned=kit.levels[1]>0;
      return {novice:()=>'Ngọc kiếm gây thêm 20% sát thương.'+(learned?` Giảm ${pct(kit.defenseBonus)} sát thương nhận vào.`:' Học để giảm sát thương nhận vào.'),fire:()=>'Ngọc kiếm gây thêm 60% sát thương.'+(learned?` Công +${pct(kit.attackBonus)}.`:''),ice:()=>'Giảm 20% sát thương nhận vào; ngọc khiên cho 8 giáp.'+(learned?` Phòng thủ +${pct(kit.defenseBonus)}.`:''),
        earth:()=>`Đánh thường còn ${pct(kit.attackScale)} sát thương; đổi lại HP rất cao.`+(learned?` HP +${pct(kit.hpBonus)}.`:''),lightning:()=>`Năng lượng từ ngọc ×${vi(kit.energy,2)}.`,shadow:()=>'Không bị khắc hệ.'+(learned?` Công +${pct(kit.attackBonus)}.`:'')}[k]();
    }
    if(slot===2){
      if(!kit.mutation)return 'Sau tuyệt kỹ, kích hoạt hiệu ứng nguyên tố.';
      return {novice:()=>`Mỗi lượt hồi ${pct(kit.regen)} HP tối đa.`,fire:()=>`Sau tuyệt kỹ, thiêu đốt địch ${kit.burn.turns} lượt, mỗi lượt ${vi(kit.burn.base)} sát thương cơ bản.`,ice:()=>`Sau tuyệt kỹ, nhận thêm giáp bằng ${pct(kit.mutationArmor)} HP tối đa.`,
        earth:()=>`Rễ cây hóa giáp: sau tuyệt kỹ nhận giáp bằng ${pct(kit.mutationArmor)} HP tối đa.`,lightning:()=>`Sau tuyệt kỹ, hút ${kit.drain} năng lượng của địch và hồi ${kit.energyReturn} năng lượng.`,shadow:()=>`Sau tuyệt kỹ, tàn ảnh chém thêm ${kit.echo} sát thương cơ bản.`}[k]();
    }
    return kit.transform?`Biến Thân một lần mỗi trận (bấm khi HP ≤ 50% hoặc sau tuyệt kỹ thứ hai, không tốn lượt): ${kit.transform.turns} lượt Công +${pct(kit.transform.attack)}, giảm 15% sát thương nhận, miễn choáng và đóng băng mới; sau đó giữ Công +${pct(kit.transform.after)} tới hết trận. Cấp 400 + tiến hóa 5: 4 lượt, dư âm +15%.`:'Biến Thân một lần mỗi trận: Công tăng mạnh, giảm sát thương nhận và miễn choáng trong vài lượt, sau đó giữ một phần Công tới hết trận.';
  }
  function skillText(key,h,slot){
    check(HEROES[key]&&int(slot,0,3),'Kỹ năng không hợp lệ.');
    const save=h||heroSave(),owned=!!h,rank=owned?Math.max(0,Math.min(SKILL_MAX,save.skills?.[slot]||0)):(slot===0?1:0),unlocked=owned&&skillUnlock(save,slot);
    const form=heroForm(key,save),name=slot===0&&HERO_FORMS[key]?HERO_FORMS[key][form-1].skill:HEROES[key].skills[slot];
    const at=r=>{const s={...save,skills:(save.skills||[1,0,0,0]).slice()};s.skills[slot]=r;return skillKit(key,s);};
    const shown=at(slot===1?rank:Math.max(1,rank)),values=skillValues(at(Math.max(1,rank)),slot),list=rows=>rows.map(([l,v,u])=>`${l} ${v}${u}`).join(' · ');
    let next;
    if(!owned)next='Cần sở hữu tướng.';
    else if(!unlocked)next=skillGateText(slot);
    else if(rank>=SKILL_MAX)next='Đã đạt cấp tối đa.';
    else if(rank===0)next='Học: '+list(values);
    else{const a=skillValues(at(rank),slot),b=skillValues(at(rank+1),slot);next=b.map(([l,v,u],i)=>a[i]&&a[i][1]!==v?`${l} ${a[i][1]} → ${v}${u}`:'').filter(Boolean).join(' · ');}
    return {name,branch:SKILL_BRANCHES[slot],rank,max:SKILL_MAX,owned,unlocked,maxed:rank>=SKILL_MAX,gate:skillGateText(slot),effectiveRank:shown.levels[slot],bonusRank:slot===2&&rank>0?shown.levels[2]-rank:0,description:skillDescription(shown,slot),next,values};
  }
  // Every source of a hero's HP, Công and Thủ in the order the rules apply them; stats() is
  // built from it, so the breakdown the hub shows is the arithmetic combat uses.
  function statParts(p,key,normalized=false){
    const h=p.heroes[key];check(h&&HEROES[key],'Bạn chưa sở hữu tướng này.');const data=HEROES[key];let attack=data.attack,hp=data.hp,defense=0;const affixes=[],rows=[{id:'base',label:'Gốc tướng',hp,attack,defense:0}];
    const step=(id,label,fn)=>{const a=attack,b=hp,d=defense;fn();rows.push({id,label,hp:hp-b,attack:attack-a,defense:defense-d});};
    step('level',`Cấp ${h.level}`,()=>{attack*=1+.018*(h.level-1);hp*=1+.045*(h.level-1);});
    step('stars',`${h.stars} sao`,()=>{attack*=1+.09*(h.stars-1);hp*=1+.12*(h.stars-1);});
    step('evolution',`Tiến hóa ${h.evolution}`,()=>{attack*=1+.07*h.evolution;hp*=1+.1*h.evolution;});
    step('gear',`Trang bị (${Object.keys(h.gear).length}/6)`,()=>{for(const id of Object.values(h.gear)){const g=p.equipment.find(x=>x.id===id);if(!g)continue;const f=RARITIES[g.rarity].factor*(1+g.level*.08);if(g.slot==='weapon')attack+=f*.035;else if(g.slot==='armor')hp+=f*25;else if(g.slot==='helmet')hp+=f*15;else if(g.slot==='pants')hp+=f*10,defense+=f*.004;else if(g.slot==='glasses')attack+=f*.02;else defense+=f*.012;if(g.affix)affixes.push(g.affix);}});
    step('relic',`${RELICS[key]} · cấp ${h.relic.level}`,()=>{const relic=relicBonus(h.relic);attack*=1+relic;hp*=1+relic;});
    const kit=skillKit(key,h,normalized);
    step('skills','Kỹ năng (Bị động, Chân Thân)',()=>{attack*=(1+kit.attackBonus)*(1+kit.awaken.attack);hp*=(1+kit.hpBonus)*(1+kit.awaken.hp);defense+=kit.defenseBonus;});
    return {rows,hp,attack,defense,affixes,kit};
  }
  function stats(p,key,normalized=false){
    const h=p.heroes[key],parts=statParts(p,key,normalized),data=HEROES[key],kit=parts.kit,affixes=parts.affixes;let {hp,attack,defense}=parts;
    // Practice is normalized: base HP/Công, rank-1 active, innate traits only, no gear.
    if(normalized){hp=data.hp*2;attack=data.attack*1.8;defense=0;}
    return {hp:Math.round(hp),attack:Number(attack.toFixed(4)),defense:Math.min(.5,defense),active:kit.activePower,mutation:kit.mutation,awakened:kit.awakened,skills:normalized?kit.ranks.slice():h.skills.slice(),evolution:h.evolution,form:heroForm(key,h),stars:h.stars,affixes:normalized?[]:affixes,power:Math.round(hp*attack/(1-Math.min(.5,defense))),kit};
  }
  // The hub's "Chi tiết lực chiến": rows per source (HP, Công, Thủ added by it) and what power is.
  function statBreakdown(p,key){
    const parts=statParts(p,key),total=stats(p,key);
    return {rows:parts.rows.map(r=>({...r,hp:Math.round(r.hp),attack:round(r.attack),defense:round(r.defense)})),total,capped:parts.defense>.5,formula:'Lực chiến = HP × Công ÷ (1 − Thủ)'};
  }
  // The growth map ("Lộ trình"): every axis of one hero, where it stands, the next step, what that
  // step opens and whether it can be done now. state: 'max' | 'ready' | 'short' (resources) | 'locked' (a gate).
  function growthMap(p,key){
    const h=p.heroes[key];check(h&&HEROES[key],'Bạn chưa sở hữu tướng này.');
    const have=id=>id==='copies'?h.copies-1:id in p.wallet?p.wallet[id]:p.materials[id]||0,pay=c=>Object.entries(c).every(([id,n])=>have(id)>=n);
    const forms=HERO_FORMS[key],max=formMax(key,h),form=heroForm(key,h),rows=[];
    const lv=h.level<MAX_LEVEL?levelCost(h.level):null,nextTicket=[10,25,...Array.from({length:10},(_,i)=>50*(i+1))].find(l=>l>h.level&&!h.ticketMilestones.includes(l));
    const gate=SKILL_GATES.map((g,i)=>({g,i})).find(({g,i})=>i&&h.level<g.level);
    rows.push({id:'level',name:'Cấp',current:`Cấp ${h.level} / ${MAX_LEVEL}`,next:lv?`Cấp ${h.level+1}`:'Đã tối đa',
      opens:[nextTicket&&`Vé triệu hồi ở cấp ${nextTicket}`,gate&&`${SKILL_BRANCHES[gate.i]} ở cấp ${gate.g.level}`].filter(Boolean).join(' · ')||'HP +4,5%, Công +1,8% mỗi cấp',
      state:!lv?'max':pay(lv)?'ready':'short',route:'upgrade',tab:'level'});
    const sc=h.stars<6?starCost(h.stars):null,formAt=forms?FORM_STARS.findIndex(s=>s>h.stars):-1;
    rows.push({id:'stars',name:'Sao',current:'★'.repeat(h.stars)+` · ${h.copies-1} bản sao dư · ${p.fragments[key]||0}/80 mảnh`,next:sc?`${h.stars+1} sao: ${sc.copies} bản sao, ${sc.gold.toLocaleString('vi-VN')} vàng, ${sc.essence} tinh hoa`:'Đã 6 sao',
      opens:formAt>=0?`Hình thái ${formAt+1} ở ${FORM_STARS[formAt]} sao`:'HP +12%, Công +9% mỗi sao',state:!sc?'max':h.copies-1>=sc.copies&&pay({gold:sc.gold,essence:sc.essence})?'ready':h.copies-1<sc.copies?'locked':'short',
      need:sc&&h.copies-1<sc.copies?(key==='novice'?'Mảnh Hiro: Hành Trình Tân Thủ, nhiệm vụ vượt ải hằng ngày, rương sao chương, Boss Vô Hạn mỗi 10 tầng':'Bản sao: triệu hồi, ghép 80 mảnh'):'',route:'upgrade',tab:'stars'});
    if(forms)rows.push({id:'forms',name:'Hình thái',current:`${forms[form-1].name} (${form}/3) · đã mở ${max}`,next:max<3?`${forms[max].name} ở ${FORM_STARS[max]} sao`:'Đã mở cả ba',
      opens:'Diện mạo và tuyệt kỹ; chọn lại hình thái cũ bất cứ lúc nào',state:max>=3?'max':'locked',route:'forms'});
    const e=EVOLUTION[h.evolution];
    rows.push({id:'evolution',name:'Tiến hóa',current:`Bậc ${h.evolution} / ${EVOLUTION.length}`,next:e?`Bậc ${h.evolution+1}: cấp ${e.level}, ${e.stars} sao`:'Đã tối đa',opens:e?e.perk:'Đã lột xác toàn thân',
      state:!e?'max':h.level<e.level||h.stars<e.stars?'locked':pay({gold:e.gold,essence:e.essence,ore:e.ore})?'ready':'short',need:e&&(h.level<e.level||h.stars<e.stars)?`Thiếu ${[h.level<e.level&&`cấp ${e.level}`,h.stars<e.stars&&`${e.stars} sao`].filter(Boolean).join(' và ')}`:'',route:'upgrade',tab:'evolution'});
    SKILL_BRANCHES.forEach((branch,i)=>{const rank=h.skills[i]||0,open=skillUnlock(h,i),c=open&&rank<SKILL_MAX?skillCost(h,i):null;
      rows.push({id:'skill-'+i,name:branch,current:open?`Cấp ${rank} / ${SKILL_MAX}`:'Chưa mở',next:!open?skillGateText(i):c?`Cấp ${rank+1}`:'Đã tối đa',opens:skillText(key,h,i).name,
        state:!open?'locked':!c?'max':pay(c)?'ready':'short',route:'skills',skill:i});});
    const worn=Object.keys(h.gear).length;
    const spare=p.equipment.some(g=>!h.gear[g.slot]&&!Object.values(p.heroes).some(o=>Object.values(o.gear).includes(g.id)));
    const worn6=Object.values(h.gear).map(id=>p.equipment.find(g=>g.id===id)).filter(Boolean),below=worn6.filter(g=>g.level<20);
    rows.push({id:'gear',name:'Trang bị',current:`${worn} / 6 ô`+(worn?` · thấp nhất +${Math.min(...worn6.map(g=>g.level))}`:''),next:worn<6?'Mặc đủ 6 ô':below.length?'Cường hóa đến +20':'Đã +20 cả 6 món',opens:'Chỉ số; không đổi hình thái hay kỹ năng',
      state:worn<6?(spare||below.some(g=>pay(strengthenCost(g)))?'ready':'short'):!below.length?'max':below.some(g=>pay(strengthenCost(g)))?'ready':'short',route:'upgrade'});
    const r=h.relic,cap=r.evolution*20;
    rows.push({id:'relic',name:'Bảo bối',current:`${RELICS[key]} · cấp ${r.level} · dạng ${r.evolution}/5`,next:r.level<cap?`Cấp ${r.level+1}`:r.evolution<5?`Dạng ${r.evolution+1} (tướng cấp ${r.evolution*50})`:'Đã tối đa',opens:'+0,25% HP/Công mỗi cấp',
      state:r.level>=100&&r.evolution>=5?'max':r.level<cap?(pay(relicLevelCost(r))?'ready':'short'):h.level<r.evolution*50?'locked':pay(relicEvolveCost(r))?'ready':'short',route:'upgrade'});
    return rows;
  }
  // Release state: Hiro is always available and only the current banner hero drops.
  function heroAvailable(key){return key==='novice'||key===SUMMON_BANNER.hero;}
  function levelCostRange(level,count=1){check(int(count,1,10),'Chỉ tăng 1–10 cấp mỗi lần.');const total={gold:0,exp:0,seals:0};let steps=0;for(let l=level;l<MAX_LEVEL&&steps<count;l++,steps++)for(const [id,n]of Object.entries(levelCost(l)))total[id]+=n;return steps?{cost:total,levels:steps}:null;}
  const CRAFT_RARITIES=['uncommon','rare','epic','legendary','divine'];
  function craftGate(rarity){const rank=CRAFT_RARITIES.indexOf(rarity)+1;check(rank>0,'Công thức không hợp lệ.');return rarity==='divine'?300:rank*20;}
  function craftCost(rarity){const rank=CRAFT_RARITIES.indexOf(rarity)+1;check(rank>0,'Công thức không hợp lệ.');const cost={gold:rank*rank*8000,ore:rank*25,wood:rank*15,cloth:rank*15,essence:rank*10};if(rarity==='divine')cost.divineOre=50;return cost;}
  // Too much gear (docs/GAME_DESIGN.md §3, Codex round 3): the bag holds 500 (warning at 450). Salvage gives the
// rarity's ore and gold back plus 70% of what strengthening actually cost; locked, worn and signature gear is
// never salvaged. Auto-salvage on drops is off by default and keeps anything better than the selected hero wears.
const BAG={cap:500,warn:450},SALVAGE_REFUND=.7;
function strengthenPaid(level){const n=(level|0)*((level|0)+1)/2;return {gold:900*n,ore:2*n};}
function salvageValue(g){const f=RARITIES[g.rarity].factor,paid=strengthenPaid(g.level);return {ore:Math.ceil(f*3)+Math.floor(paid.ore*SALVAGE_REFUND),gold:Math.ceil(f*80)+Math.floor(paid.gold*SALVAGE_REFUND)};}
function wornBy(p,gearId){return Object.keys(p.heroes).find(k=>Object.values(p.heroes[k].gear).includes(gearId))||null;}
function salvageable(p,g){return !!g&&!g.locked&&!g.signature&&!wornBy(p,g.id);}
function salvagePreview(p,{slots=null,rarities=['common','uncommon'],maxLevel=20}={}){
  const list=p.equipment.filter(g=>salvageable(p,g)&&(!slots||slots.includes(g.slot))&&rarities.includes(g.rarity)&&g.level<=maxLevel);
  const total=list.reduce((t,g)=>{const v=salvageValue(g);t.ore+=v.ore;t.gold+=v.gold;return t;},{ore:0,gold:0});
  return {ids:list.map(g=>g.id),count:list.length,...total};
}
// How much a piece adds where it is worn (the same rule as statParts' gear step).
function gearScore(g,goal='attack'){const f=RARITIES[g.rarity].factor*(1+g.level*.08),attackAffix=['stun','lifesteal','pierce'].includes(g.affix),surviveAffix=['steadfast','ward'].includes(g.affix);
  return f*(g.affix?(goal==='attack'?(attackAffix?1.25:1.1):(surviveAffix?1.25:1.1)):1);}
// "Mặc tốt nhất": per slot the best piece among the hero's own and unworn gear (never another hero's).
function bestGear(p,key,goal='attack'){const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const out={};
  for(const slot of Object.keys(SLOTS)){const own=h.gear[slot]&&p.equipment.find(g=>g.id===h.gear[slot]);
    const pool=p.equipment.filter(g=>g.slot===slot&&(g.id===own?.id||!wornBy(p,g.id)));let best=own||null;
    for(const g of pool)if(!best||gearScore(g,goal)>gearScore(best,goal)+1e-9)best=g;
    if(best&&best.id!==own?.id)out[slot]={from:own?.id||null,to:best.id};}
  return out;}
// Titles (docs/GAME_DESIGN.md §15): cosmetic only, never a stat. Earned from play on this save; arena, season
// and tournament titles come from the server later and show as locked with their source.
const TITLE_RULES=[
  {id:'newcomer',name:'Lữ Khách Tân Thủ',tier:1,source:'Nhận đủ 7 ngày Hành Trình Tân Thủ',at:p=>[(p.newbie?.claimed||[]).length,7]},
  {id:'ember',name:'Kẻ Vượt Núi Lửa',tier:1,source:'Vượt ải 100 (boss chương 2)',at:p=>[Math.min(p.campaign.cleared,100),100]},
  {id:'hunter-1',name:'Thợ Săn Tập Sự',tier:1,source:'Hạ 50 boss vô hạn',at:p=>[Math.min(p.boss.wins,50),50]},
  {id:'trial',name:'Người Thử Mọi Boss',tier:2,source:'Có kỷ lục ở cả 5 boss Sân Thử Luyện',at:p=>[Object.keys(p.trial?.best||{}).length,5]},
  {id:'smith',name:'Bậc Thầy Cường Hóa',tier:2,source:'Cường hóa một trang bị lên +20',at:p=>[Math.max(0,...p.equipment.map(g=>g.level)),20]},
  {id:'hiro-star',name:'Ngôi Sao Lữ Khách',tier:3,source:'Hiro đạt 6 sao',at:p=>[p.heroes.novice?.stars||1,6]},
  {id:'collector',name:'Nhà Sưu Tầm',tier:3,source:'Mở 9 hình thái tướng',at:p=>[Object.entries(p.heroes).reduce((n,[k,h])=>n+(k==='novice'?0:formMax(k,h)),0),9]},
  {id:'pathfinder',name:'Người Mở Lối',tier:3,source:'Vượt chương 10 (ải 500)',at:p=>[Math.min(p.campaign.cleared,500),500]},
  {id:'boss-hunter',name:'Thợ Săn Boss',tier:4,source:'Hạ 1.000 boss vô hạn',at:p=>[Math.min(p.boss.wins,1000),1000]},
  {id:'season-gold',name:'Kiếm Khách Hoàng Kim',tier:4,source:'Mùa Đấu Hạng · bậc Vàng (máy chủ)',server:true},
  {id:'champion',name:'Thư Hùng Vô Địch',tier:5,source:'Vô địch Thư Hùng Đại Hội (máy chủ)',server:true},
  {id:'patron',name:'Đại Phú Hộ',tier:4,source:'VIP 11 (trang trí, không chỉ số)',server:true,paid:true}];
function titleList(p){return TITLE_RULES.map(t=>{const [cur,target]=t.at?t.at(p):[0,1];return {id:t.id,name:t.name,tier:t.tier,source:t.source,server:!!t.server,paid:!!t.paid,progress:[Math.min(cur,target),target],unlocked:!t.server&&cur>=target,worn:p.title===t.id};});}
function strengthenCost(g){check(g&&g.level<20,'Trang bị đã +20 hoặc không tồn tại.');return {gold:(g.level+1)*900,ore:(g.level+1)*2};}
  // What one upgrade step gives, for the hub preview. Never mutates the save.
  function upgradePreview(p,key,kind,count=1){
    const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const next=clone(p),n=next.heroes[key];let unlock='';
    if(kind==='level'){if(h.level>=MAX_LEVEL)return null;n.level=Math.min(MAX_LEVEL,h.level+count);}
    else if(kind==='stars'){if(h.stars>=6)return null;n.stars++;const form=heroForm(key,n);if(form>heroForm(key,h)){const f=HERO_FORMS[key][form-1];unlock=`${n.stars} sao: ${f.name} · tuyệt kỹ ×${vi(f.power,2)}`+(f.signature?' · đặc tính mới':'');}}
    else if(kind==='evolution'){const e=EVOLUTION[h.evolution];if(!e)return null;n.evolution++;unlock=`Tiến hóa ${n.evolution}: ${e.perk}`;}
    else throw new Error('Kiểu nâng cấp không hợp lệ.');
    return {before:stats(p,key),after:stats(next,key),unlock};
  }
  // Idle income: rate from the highest hero level and stages cleared; cap from VIP (12 h at VIP 0).
  // Pending income earned at an older rate is banked (p.offlineBank) before the rate rises,
  // so a level-up or first clear never re-prices hours that already passed.
  function offlineRate(p){const level=Math.max(...Object.values(p.heroes).map(h=>h.level)),cleared=p.campaign.cleared;return {gold:80+level*8+cleared*10,exp:2+Math.floor(cleared/20),seals:60};}
  function offlineCap(p){return (VIP[p.vip?.level|0]||VIP[0]).offlineHours;}
  function offlineRaw(p,now){const cap=offlineCap(p),bank=p.offlineBank||{hours:0,gold:0,exp:0,seals:0},rate=offlineRate(p),hours=Math.min(Math.max(0,cap-bank.hours),Math.max(0,now-p.offlineAt)/3600000);return {cap,rate,hours:bank.hours+hours,gold:bank.gold+hours*rate.gold,exp:bank.exp+hours*rate.exp,seals:bank.seals+hours*rate.seals};}
  function offline(p,now){const r=offlineRaw(p,now);return {hours:r.hours,goldPerHour:r.rate.gold,capHours:r.cap,gold:Math.floor(r.gold),exp:Math.floor(r.exp),seals:Math.floor(r.seals)};}
  function summonQuote(p,count){
    check(count===1||count===10,'Chọn triệu hồi 1 hoặc 10 lần.');
    const payment=p.wallet.tickets>=count?'tickets':'gems',cost=count*(payment==='gems'?120:1);
    return {count,payment,cost,available:p.wallet[payment],enough:p.wallet[payment]>=cost,tickets:p.wallet.tickets};
  }
  // Enemy pressure has one scaling: enemyAttack tracks the HP of a hero at the
  // recommended level with typical stars/evolution, so the share of HP an enemy
  // hit removes stays steady from stage 50 to 1500 (combat skill bases are flat).
  // Stage 1 stays gentle; endless floors past the level cap grow logarithmically.
  // A chapter boss's skills hit harder each chapter (6% per chapter: x2.38 by chapter 24), so later
  // campaign bosses stay a threat to heroes upgraded far past them (endless floors keep their own curve);
  // skill texts give power as % of this base.
  const ENEMY_SKILL_BASE={normal:18,elite:18,boss:30},CHAPTER_POWER=chapter=>1+(chapter-1)*.06,ENDLESS_LEVEL_FLOOR=Math.ceil(MAX_LEVEL/1.8);
  function enemyAttackFor(mode,index,tier,recommended){
    const level=Math.min(MAX_LEVEL,recommended),reference=(1+.045*(level-1))*(1+level/MAX_LEVEL),ramp=.65+.55*Math.min(1,(level-1)/80);
    const beyond=mode==='boss'?1.1*(1+.6*Math.log2(1+Math.max(0,index-ENDLESS_LEVEL_FLOOR)/ENDLESS_LEVEL_FLOOR)):1+Math.max(0,index-1000)*.0006;
    return round(ramp*reference*(tier==='elite'?1.1:tier==='boss'?.8:1)*beyond,4);
  }
  // Endless rewards grow linearly to floor 500, then with the square root of
  // further depth: deep floors stay a ranking challenge, not a gold faucet.
  function endlessRewardFloor(index){return index<=500?index:Math.floor(500+10*Math.sqrt(index-500));}
  // A chapter's nine elite rounds (stages 5, 10, ... 45): which of its five elites stands there and how strong. Each of the
  // first four fights twice, weaker the first time; the last fights once, the strongest, with its boss's ultimate.
  const ELITE_ROUNDS=[[0,.9],[0,1],[1,.9],[1,1],[2,.9],[2,1],[3,.9],[3,1],[4,1.1]];
  // Sân Thử Luyện: one tanky chapter boss a day (Mon Hỏa Long, Tue Băng Nguyệt Linh Hồ, Wed Thạch Mộc Cự Vệ,
  // Thu Lôi Sư, Fri Tử Thần Nguyệt Ảnh; the weekend any of them) at the hero's own level. It never falls: each
  // emptied health bar refills, 15 rounds, total damage is the score. Two rewarded runs a day (about 1.5 hours
  // of offline income at the top tier), then free practice; the best damage per boss is kept.
  const TRIAL={chapters:[2,3,1,4,10],turns:15,rewarded:2,tiers:[.5,1,2,3,5],pay:[0,.4,.6,.8,.9,1]};
  function trialOpen(at){const weekday=(new Date(at+7*3600000).getUTCDay()+6)%7;return weekday<5?[weekday+1]:[1,2,3,4,5];}
  function trialEncounter(index,level=1){
    check(int(index,1,TRIAL.chapters.length),'Sân thử luyện không hợp lệ.');
    const chapter=WORLD.CHAPTERS[TRIAL.chapters[index-1]-1],bossDef=WORLD.BOSSES[chapter.boss],recommended=Math.max(1,Math.min(MAX_LEVEL,Math.floor(level)||1));
    return {mode:'trial',index,recommended,boss:true,tier:'boss',chapter:chapter.index,theme:chapter.id,bossId:chapter.boss,music:chapter.music,creature:null,enemyName:bossDef.name,turnLimit:TRIAL.turns,
      enemyKey:chapter.element,enemyHp:Math.round((88+recommended*15)*2.25*(1+recommended*.006)),enemyAttack:enemyAttackFor('campaign',recommended*2,'boss',recommended),enemySkillBase:ENEMY_SKILL_BASE.boss,
      skills:bossDef.skills.map(s=>s.name),skillSet:bossDef.skills,eliteUlt:false,tactical:false,variant:0,name:`Sân Thử Luyện · ${bossDef.name}`};
  }
  // What a trial run pays for its total damage (a share of one health bar), and whether it is still a rewarded run today.
  function trialReward(p,b,damage){
    const tier=TRIAL.tiers.filter(t=>damage>=t*b.enemyHp).length,runs=(p.daily.trialRuns||0)+1,rate=offlineRate(p),f=TRIAL.pay[tier];
    const reward=runs<=TRIAL.rewarded&&tier?{gold:Math.round(rate.gold*.75*f),exp:Math.max(1,Math.round(rate.exp*.75*f)),...(tier>=3?{essence:1}:{})}:{};
    return {tier,rewarded:runs<=TRIAL.rewarded,reward};
  }
  // Giao hữu (plaza, docs/GAME_DESIGN.md §14.6): an AI copy of another player's hero, both sides with the
  // normalized stats of the Chuẩn Hóa queue (the other's profile is unverified); no reward, no ranking.
  const SPAR_LABEL='Giao hữu với bản sao · AI · Không thưởng';
  function sparEncounter(opponent){
    const hero=HEROES[opponent?.hero]?opponent.hero:'novice',data=HEROES[hero],name=String(opponent?.name||'Lữ khách').slice(0,14);
    return {mode:'spar',index:1,recommended:1,boss:false,tier:'normal',chapter:1,theme:WORLD.CHAPTERS[0].id,bossId:null,music:'fire',creature:null,enemyName:`Bản sao ${name}`,turnLimit:30,
      enemyKey:['fire','ice','earth','lightning'].includes(hero)?hero:'fire',enemyHp:Math.round(data.hp*2),enemyAttack:Math.round(data.attack*1.8*1e4)/1e4,enemySkillBase:45,
      skills:[data.ultimate||'Tuyệt kỹ'],skillSet:[],eliteUlt:false,tactical:false,variant:0,name:SPAR_LABEL,opponent:{hero,name,look:Math.max(1,Math.min(3,Math.round(Number(opponent?.look)||1)))}};
  }
  function encounter(mode,index){
    if(mode==='trial')return trialEncounter(index);
    check(['campaign','boss','duel'].includes(mode),'Chế độ chưa phát hành.');check(int(index,1,mode==='campaign'?WORLD.MAX_STAGES:1000000),'Ải không hợp lệ.');
    const chapter=mode==='campaign'?WORLD.chapterForStage(index):WORLD.CHAPTERS[(index-1)%WORLD.CHAPTERS.length],bossDef=WORLD.BOSSES[chapter.boss];
    const depth=mode==='campaign'?Math.ceil(index/2):Math.ceil(index*1.8),recommended=Math.min(MAX_LEVEL,depth),boss=mode==='boss'||mode==='campaign'&&index%50===0;
    const every=WORLD.ELITE_EVERY,tier=boss?'boss':mode==='campaign'&&index%every===0?'elite':'normal';
    const local=(index-1)%50+1,round=tier==='elite'?ELITE_ROUNDS[local/every-1]:null,variant=mode!=='campaign'||boss?0:round?round[0]:(local-1)%chapter.ordinary.length;
    const creatureId=mode==='campaign'&&!boss?(tier==='elite'?chapter.elites:chapter.ordinary)[variant]:null;
    const creature=creatureId?CREATURES.find(c=>c.id===creatureId)||{id:creatureId,name:WORLD.CREATURE_NAMES[chapter.id][creatureId]}:null;
    // Bosses and elites fight with their own skills; every common foe shares one skill.
    const eliteUlt=tier==='elite'&&local===45;
    const skillSet=boss?bossDef.skills:tier==='elite'?[...(WORLD.ELITE_SKILLS[creatureId]||[WORLD.COMMON_SKILL]),...(eliteUlt?bossDef.skills.filter(s=>s.ult):[])]:mode==='campaign'?[WORLD.COMMON_SKILL]:[];
    // Campaign HP growth halves after stage 200 (stages 1–200 unchanged) so late
    // stages track hero damage; expedition bosses (stages 750+) are longer
    // phase fights (×3 → ×4 HP by stage 1200) with a 35-turn limit. Endless
    // keeps its steeper ranking curve.
    const lateBoss=mode==='campaign'&&tier==='boss'&&!!bossDef.tactical,growth=mode==='campaign'&&index>200?1.6+(index-200)*.0013:1+index*.003;
    const hp=mode==='campaign'?(88+recommended*15)*(tier==='boss'?(lateBoss?3+Math.max(0,index-700)/500:2.25):tier==='elite'?1.5:1):(120+depth*18)*(boss?1.7:1);
    return {mode,index,recommended,boss,tier,chapter:chapter.index,theme:chapter.id,bossId:chapter.boss,music:boss?chapter.music:chapter.element,creature:creature?.id||null,enemyName:boss?bossDef.name:creature?.name||'Vệ Binh Tinh Anh',turnLimit:tier==='boss'?(lateBoss?35:20):tier==='elite'?16:12,
      enemyKey:mode==='duel'?'fire':chapter.element,enemyHp:Math.round(hp*growth*(round?.[1]||1)),enemyAttack:Math.round(enemyAttackFor(mode,index,tier,recommended)*(round?.[1]||1)*1e4)/1e4,enemySkillBase:Math.round(ENEMY_SKILL_BASE[tier]*(round?.[1]||1)*(tier==='boss'&&mode==='campaign'?CHAPTER_POWER(chapter.index):1)),
      skills:skillSet.length?skillSet.map(s=>s.name):['Đánh Thường'],
      skillSet,eliteUlt,tactical:!!bossDef.tactical,variant,name:mode==='duel'?'PvP cục bộ 1vs1':mode==='boss'?`Boss vô hạn · Tầng ${index}`:`Chương ${chapter.index} · Ải ${local}`};
  }
  function stageStars(b,won,performance={}){
    if(!won)return 0;
    const healthy=Number.isFinite(performance.hpRatio)&&performance.hpRatio>=.5&&performance.hpRatio<=1;
    const quick=int(performance.turns,1,b.turnLimit||12);
    return 1+Number(healthy)+Number(healthy&&quick);
  }
  // First clears pay in full. Replays pay half the base gold/EXP and 1 Tinh hoa on a
  // chapter boss; after REPLAY_DAILY_WINS campaign wins in a day they pay 15% and 1 quặng.
  // Beating a chapter boss the first time is the chapter's big payout (gold and materials).
  const chapterClear=chapter=>({gold:10000+chapter*4000,exp:60+chapter*10,essence:10+chapter,ore:30+chapter*3,skillBooks:2+Math.floor(chapter/4),divineOre:chapter>=8?1+Math.floor((chapter-8)/6):0});
  const REPLAY_DAILY_WINS=20,BOSS_DAILY_WINS=12;
  function campaignLoot(p,b){
    const first=b.index>p.campaign.cleared,late=!first&&(p.daily.campaignWins||0)>=REPLAY_DAILY_WINS,k=first?1:late?.15:.5;
    const loot={gold:Math.floor((300+b.index*25)*k)+(first?500:0),exp:Math.max(1,Math.floor((8+Math.floor(b.index/3))*k)),seals:first?80:10,ore:late?1:b.boss?5:b.tier==='elite'?3:2,essence:!b.boss||late?0:first?3:1};
    if(first&&b.boss)for(const [key,value]of Object.entries(chapterClear(b.chapter)))if(value)loot[key]=(loot[key]||0)+value;
    return loot;
  }
  const sealRoom=p=>Math.max(0,DAILY_SEAL_CAP-(p.daily.seals||0));
  // What claiming a daily quest pays right now: Ấn is limited by today's remaining cap.
  function dailyRewardPreview(p,quest){
    const q=DAILY.find(q=>q.id===quest);check(q,'Nhiệm vụ không tồn tại.');const reward={...q.reward};
    if('seals' in reward)reward.seals=Math.min(reward.seals,sealRoom(p));
    return {quest:q.id,reward,listed:{...q.reward},sealCapped:(reward.seals||0)<(q.reward.seals||0)};
  }
  function campaignRewardPreview(p,index,stars){
    check(int(stars,1,3),'Số sao không hợp lệ.');
    const b=encounter('campaign',index),first=index>p.campaign.cleared,reward=campaignLoot(p,b),best=p.campaign.stars?.[index]||0;
    reward.seals=Math.min(reward.seals,sealRoom(p));
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
  // Saves from the 30-chapter map (1500 stages) keep their progress up to the current last stage.
  function clampCampaign(p){p.campaign.cleared=Math.min(p.campaign.cleared,WORLD.MAX_STAGES);for(const n of Object.keys(p.campaign.stars))if(Number(n)>WORLD.MAX_STAGES)delete p.campaign.stars[n];if(p.pending?.mode==='campaign'&&p.pending.index>WORLD.MAX_STAGES)p.pending=null;}
  function makeEngine(storage,{previewTickets=false,previewGems=false,previewMail=false,previewHeroes=false,now=()=>Date.now(),random=()=>{if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}return Math.random();}}={}){
    let memory,sequence=0;
    function load(){const raw=storage?.getItem(KEY);if(raw){let p;try{p=JSON.parse(raw);}catch{throw new Error('Bản lưu bị lỗi. Hãy giữ bản lưu và khôi phục từ bản sao.');}check(p.version===VERSION,'Phiên bản bản lưu chưa được hỗ trợ.');for(const h of Object.values(p.heroes))h.relic??=relicSave();if(!p.campaign.stars)p.campaign.stars=Object.fromEntries(Array.from({length:p.campaign.cleared},(_,i)=>[i+1,1]));p.campaign.claimedStars??=[];p.campaign.artifacts??={};clampCampaign(p);if(p.pending)p.pending={...(p.pending.mode==='spar'?sparEncounter(p.pending.opponent):encounter(p.pending.mode,p.pending.index)),...p.pending};if(!Array.isArray(p.mail))p.mail=[welcomeMail(p.updated||p.created||now())];return p;}const p=memory?clone(memory):fresh(now());p.campaign.stars??={};p.campaign.claimedStars??=[];p.campaign.artifacts??={};if(!Array.isArray(p.mail))p.mail=[welcomeMail(p.created||now())];return p;}
    function save(p){p.updated=now();p.revision++;if(storage)storage.setItem(KEY,JSON.stringify(p));else memory=clone(p);return p;}
    // Device-clock guard (stopgap until server time): the save remembers the latest time it
    // has seen. Setting the clock back never re-opens daily resets, Ấn caps or idle income;
    // the game simply waits at that latest time (p.clock.behind tells the UI). Forward jumps
    // are indistinguishable from a closed app client-side: they still give at most one daily
    // reset and one capped offline claim per jump. Only server time can stop them.
    let current=0;
    // Only transactions move the stored maximum, so read()/exportSave() stay stable snapshots.
    function clockNow(p,write){const raw=now();p.clock??={max:Math.max(p.updated||0,p.offlineAt||0)};p.clock.behind=raw<p.clock.max-CLOCK_TOLERANCE;current=Math.max(p.clock.max,raw);if(write)p.clock.max=current;return current;}
    const onTime=p=>check(!p.clock.behind,'Giờ thiết bị đang sớm hơn lần chơi trước. Hãy chỉnh lại ngày giờ để nhận thưởng theo thời gian.');
    function weekly(p){if(!p.weekly||week(current)>p.weekly.week)p.weekly={week:week(current),progress:{campaign:0,boss:0,daily:0},claimed:[]};}
    function daily(p){weekly(p);if(day(current)>p.daily.date)p.daily={date:day(current),progress:{login:1,campaign:0,boss:0,spend:0},claimed:[],seals:0,bossWins:0,campaignWins:0};}
    function bankOffline(p){const r=offlineRaw(p,current);p.offlineBank={hours:r.hours,gold:r.gold,exp:r.exp,seals:r.seals};p.offlineAt=Math.max(current,p.offlineAt);}
    // Expired mail (and any unclaimed gift in it) leaves the box at the next transaction.
    function tx(fn){const p=load();clockNow(p,true);daily(p);p.mail=p.mail.filter(m=>mailLive(m,current));const value=fn(p);save(p);return value;}
    function findMail(p,mailId){const m=p.mail.find(m=>m.id===mailId&&mailLive(m,current));check(m,'Thư không tồn tại hoặc đã hết hạn.');return m;}
    function read(){const p=load();clockNow(p,false);daily(p);return clone(p);}
    function amount(p,id){return id in p.wallet?p.wallet[id]:p.materials[id]||0;}
    function spend(p,cost){for(const [id,n] of Object.entries(cost)){check(Number.isSafeInteger(n)&&n>=0,'Chi phí không hợp lệ.');check(amount(p,id)>=n,`Thiếu ${RESOURCES[id]?.[0]||id}: cần ${n.toLocaleString('vi-VN')}.`);}for(const [id,n]of Object.entries(cost)){if(id in p.wallet)p.wallet[id]-=n;else p.materials[id]-=n;}p.daily.progress.spend+=cost.gold||0;}
    function grant(p,reward){const actual={};for(const [id,requested]of Object.entries(reward)){check(id!=='gems','Đá Ngọc chỉ nhận từ giao dịch nạp được máy chủ xác nhận.');check(Object.keys(RESOURCES).includes(id)&&Number.isSafeInteger(requested)&&requested>=0,'Phần thưởng không hợp lệ.');const n=id==='seals'?Math.min(requested,Math.max(0,DAILY_SEAL_CAP-p.daily.seals)):requested;if(id==='seals')p.daily.seals+=n;if(id in p.wallet)p.wallet[id]+=n;else p.materials[id]=(p.materials[id]||0)+n;actual[id]=n;}return actual;}
    // grant() plus Mảnh Hiro, which are fragments, not a wallet resource.
    function grantAll(p,reward){const {noviceFragments=0,...rest}=reward;const actual=grant(p,rest);if(noviceFragments){p.fragments.novice=(p.fragments.novice||0)+noviceFragments;actual.noviceFragments=noviceFragments;}return actual;}
    function note(p,message){p.log.unshift({at:now(),message});p.log=p.log.slice(0,60);}
    function id(){return `${now().toString(36)}-${load().revision.toString(36)}-${(++sequence).toString(36)}-${Math.floor(random()*1e12).toString(36)}`;}
    function addHero(p,key){if(p.heroes[key])p.heroes[key].copies++;else p.heroes[key]=heroSave();}
    // A dropped piece (summon) the player chose to auto-salvage is turned into ore at once, unless it is better
    // than what the selected hero wears in that slot (or the slot is empty).
    function dropGear(p,rarity,slot){const g=gear(p,rarity,slot);if(!p.settings?.autoSalvage?.[rarity])return g;
      const h=p.heroes[p.selected],worn=h?.gear[g.slot]&&p.equipment.find(x=>x.id===h.gear[g.slot]);if(!worn||gearScore(g)>gearScore(worn))return g;
      const v=salvageValue(g);p.equipment=p.equipment.filter(x=>x!==g);grant(p,v);return {...g,autoSalvaged:v};}
    function gear(p,rarity,slot){check(p.equipment.length<BAG.cap,'Túi trang bị đã đầy (500). Hãy phân rã trước.');const slots=Object.keys(SLOTS);slot=slot||slots[Math.floor(random()*slots.length)];const options=slot==='weapon'?['stun','lifesteal','pierce']:['steadfast','ward'];const g={id:id(),slot,rarity,level:0,affix:rarity==='divine'?options[Math.floor(random()*options.length)]:null};p.equipment.push(g);return g;}
    const api={read,stats:(key,normal=false)=>stats(read(),key,normal),offline:()=>{const p=read(),r=offline(p,current);return p.clock.behind?{...r,gold:0,exp:0,seals:0,behind:true}:r;},clock:()=>({...read().clock}),dailyReward:quest=>dailyRewardPreview(read(),quest),select:key=>tx(p=>{check(p.heroes[key],'Bạn chưa sở hữu tướng này.');p.selected=key;}),
      summonQuote:count=>summonQuote(read(),count),
      claimChapter:(chapter,milestone)=>tx(p=>{const progress=chapterProgress(p,chapter),reward=chapterReward(chapter,milestone);check(progress.total>=milestone,'Chưa đủ sao của chương này.');const key=`world2:${chapter}:${milestone}`;check(!p.campaign.claimedStars.includes(key),'Mốc sao này đã nhận.');const actual=grant(p,reward);p.campaign.claimedStars.push(key);const hiro=HIRO_FRAGMENTS.chest[milestone]||0;if(hiro){p.fragments.novice=(p.fragments.novice||0)+hiro;actual.noviceFragments=hiro;}note(p,`Nhận thưởng chương ${chapter} · ${milestone} sao`);return actual;}),
      claimOffline:()=>tx(p=>{onTime(p);const pending=offline(p,current);check(pending.hours>=1/60,'Cần ít nhất một phút để nhận thưởng.');const actual=grant(p,{gold:pending.gold,exp:pending.exp,seals:pending.seals});p.offlineAt=Math.max(current,p.offlineAt);p.offlineBank=null;note(p,'Nhận thưởng offline');return actual;}),
      claimDaily:quest=>tx(p=>{onTime(p);const q=DAILY.find(q=>q.id===quest);check(q,'Nhiệm vụ không tồn tại.');check(!p.daily.claimed.includes(quest),'Bạn đã nhận thưởng hôm nay.');check(p.daily.progress[quest]>=q.target,'Chưa hoàn thành nhiệm vụ.');const actual=grantAll(p,q.reward);p.daily.claimed.push(quest);p.weekly.progress.daily++;note(p,'Nhiệm vụ: '+q.name);return actual;}),
      weekly:()=>{const p=read();return WEEKLY.map(q=>({...q,progress:Math.min(q.target,p.weekly.progress[q.id]||0),claimed:p.weekly.claimed.includes(q.id),week:p.weekly.week}));},
      claimWeekly:quest=>tx(p=>{onTime(p);const q=WEEKLY.find(q=>q.id===quest);check(q,'Nhiệm vụ không tồn tại.');check(!p.weekly.claimed.includes(quest),'Đã nhận thưởng tuần này.');check((p.weekly.progress[quest]||0)>=q.target,'Chưa hoàn thành nhiệm vụ tuần.');const actual=grantAll(p,q.reward);p.weekly.claimed.push(quest);note(p,'Nhiệm vụ tuần: '+q.name);return actual;}),
      newbie:()=>{const p=read();return newbieState(p,current);},
      claimNewbie:dayIndex=>tx(p=>{const row=newbieState(p,current).find(r=>r.day===dayIndex);check(row,'Ngày quà không hợp lệ.');check(row.open,'Chưa đến ngày nhận quà này.');check(!row.claimed,'Đã nhận quà ngày này.');const actual=grantAll(p,row.reward);(p.newbie??={claimed:[]}).claimed.push(dayIndex);note(p,`Hành Trình Tân Thủ · ngày ${dayIndex}`);return actual;}),
      levelUp:(key,count=1)=>tx(p=>{check(int(count,1,10),'Chỉ tăng 1–10 cấp mỗi lần.');const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');bankOffline(p);const rewards={tickets:0};for(let i=0;i<count;i++){check(h.level<500,'Đã đạt cấp tối đa 500.');spend(p,levelCost(h.level));h.level++;if((h.level===10||h.level===25||h.level%50===0)&&!h.ticketMilestones.includes(h.level)){h.ticketMilestones.push(h.level);grant(p,{tickets:1});rewards.tickets++;}}note(p,`${HEROES[key].name} đạt cấp ${h.level}`);return rewards;}),
      starUp:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const cost=starCost(h.stars);check(h.copies-1>=cost.copies,`Cần ${cost.copies} bản sao cùng tướng (ngoài bản chính).`);spend(p,{gold:cost.gold,essence:cost.essence});const before=formMax(key,h);h.copies-=cost.copies;h.stars++;if(formMax(key,h)>before)delete h.look;note(p,`${HEROES[key].name} đạt ${h.stars} sao`);}),
      // Any unlocked form can be worn again in town, free; combat keeps the highest form.
      chooseLook:(key,form)=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');check(HERO_FORMS[key],'Tướng này chỉ có một hình thái.');check(int(form,1,3),'Hình thái không hợp lệ.');check(form<=formMax(key,h),`Cần ${FORM_STARS[form-1]} sao để mở hình thái này.`);if(form===formMax(key,h))delete h.look;else h.look=form;note(p,`${HEROES[key].name} khoác diện mạo ${HERO_FORMS[key][form-1].name}`);return lookForm(key,h);}),
      evolve:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const e=EVOLUTION[h.evolution];check(e,'Đã tiến hóa tối đa.');check(h.level>=e.level&&h.stars>=e.stars,`Cần cấp ${e.level} và ${e.stars} sao.`);spend(p,{gold:e.gold,essence:e.essence,ore:e.ore});h.evolution++;note(p,HEROES[key].name+': '+e.name);}),
      train:(key,index)=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');spend(p,skillCost(h,index));h.skills[index]++;note(p,'Nâng '+HEROES[key].skills[index]);}),
      fuse:key=>tx(p=>{check(HEROES[key],'Tướng không hợp lệ.');check((p.fragments[key]||0)>=80,'Cần 80 mảnh cùng tướng.');p.fragments[key]-=80;addHero(p,key);note(p,'Ghép tướng '+HEROES[key].name);}),
      // TEMPORARY (player testing): with test=true (only ?summonTest=1 on localhost/LAN, see
      // progression-ui.js) every card is a whole hero, walking through every summonable hero (not
      // Hiro, the starter) and every form in turn (each pull goes on where the last stopped), so each summoning entrance and ultimate can be
      // checked. Test heroes are shown only, never granted. Costs, the wallet and SUMMON_TABLE are
      // unchanged; normal play never passes test. Remove when testing is done.
      summon:(count=1,payment='tickets',test=false)=>tx(p=>{
        check(count===1||count===10,'Chọn triệu hồi 1 hoặc 10 lần.');check(payment==='tickets'||payment==='gems','Nguồn thanh toán không hợp lệ.');check(p.equipment.length+count<=500,'Cần thêm chỗ trống trong túi trang bị.');spend(p,{[payment]:count*(payment==='gems'?120:1)});const results=[];
        for(let i=0;i<count;i++){
          let roll=Math.floor(random()*1000000),kind='material';for(const [k,weight]of SUMMON_TABLE){if(roll<weight){kind=k;break;}roll-=weight;}
          const forced=test===true?'hero':null;
          p.summon.total++;p.summon.dry++;p.summon.fragmentDry++;
          if(p.summon.dry>=SUMMON_PITY)kind='hero';else if(p.summon.fragmentDry>=30&&!['hero','fragments'].includes(kind))kind='fragments';
          if(forced)kind=forced;
          const key=SUMMON_BANNER.hero;let result;
          if(kind==='hero'&&test===true){const all=Object.keys(HEROES).filter(h=>h!=='novice').flatMap(h=>[1,2,3].map(form=>[h,form])),[hero,form]=all[(p.summon.total-1)%all.length];
            p.summon.dry=0;result={kind,hero,form,rarity:'legendary',name:HERO_FORMS[hero]?.[form-1]?.name||HEROES[hero].name,test:true};}
          else if(kind==='hero'){addHero(p,key);p.summon.dry=0;result={kind,hero:key,rarity:'legendary',name:HEROES[key].name};}
          else if(kind==='fragments'){const count=2+Math.floor(random()*4);p.fragments[key]=(p.fragments[key]||0)+count;p.summon.fragmentDry=0;result={kind,hero:key,count,rarity:'rare',name:`${count} mảnh ${HEROES[key].name}`};}
          else if(kind.endsWith('Gear')){const rarity={commonGear:'common',rareGear:'rare',epicGear:'epic',legendaryGear:'legendary',divineGear:'divine'}[kind],g=dropGear(p,rarity,forced?'weapon':undefined);result={kind:'gear',gear:g,rarity,name:SLOTS[g.slot]+' '+RARITIES[rarity].name+(g.autoSalvaged?` (tự phân giải: +${g.autoSalvaged.ore} quặng)`:'')};}
          else{const resource=['exp','ore','wood','cloth'][Math.floor(random()*4)],count=resource==='exp'?5:8;grant(p,{[resource]:count});result={kind:'material',resource,count,rarity:'common',name:`${RESOURCES[resource][0]} ×${count}`};}
          results.push(result);
        }
        p.summon.last=results;note(p,'Triệu hồi '+count+' lần');return results;
      }),
      begin:(mode,index,opts={})=>tx(p=>{check(p.heroes[p.selected],'Chưa chọn tướng.');const wornTitle=p.title?titleList(p).find(t=>t.id===p.title&&t.unlocked):null,title=wornTitle?{name:wornTitle.name,tier:wornTitle.tier}:null;
        if(mode==='spar'){check(HEROES[opts.opponent?.hero],'Đối thủ giao hữu không hợp lệ.');const e=sparEncounter(opts.opponent),token=id();p.pending={...e,token,hero:p.selected,started:now(),counter:null,stats:stats(p,p.selected,true),title};return clone(p.pending);}if(mode==='campaign')check(index<=p.campaign.cleared+1,'Chưa mở ải này.');if(mode==='boss')check(index<=p.boss.best+1,'Chưa mở tầng boss này.');if(mode==='duel')check(index===1,'Trận 1vs1 không hợp lệ.');if(mode==='trial')check(trialOpen(current).includes(index),'Hôm nay Sân Thử Luyện mở boss khác.');const e=mode==='trial'?trialEncounter(index,p.heroes[p.selected].level):encounter(mode,index),hero=mode==='duel'?'novice':p.selected;const token=id();p.pending={...e,token,hero,started:now(),counter:counterProgress(p,e.chapter),stats:stats(p,hero,mode==='duel'),title:mode==='duel'?null:title};if(mode==='duel'){const kit=skillKit('novice',null,true);p.pending.stats={...p.pending.stats,hp:290,attack:1.53,defense:0,active:1,mutation:false,awakened:false,evolution:0,form:1,stars:1,skills:kit.ranks.slice(),affixes:[],kit};}return clone(p.pending);}),
      settle:(token,won,damage=0,performance={})=>tx(p=>{check(p.pending&&p.pending.token===token,'Trận đã kết thúc hoặc mã trận không hợp lệ.');check(typeof won==='boolean'&&Number.isFinite(damage)&&damage>=0,'Kết quả không hợp lệ.');const b=p.pending;p.pending=null;let counterReward=null;p.receipts.push(token);p.receipts=p.receipts.slice(-100);let reward={};
        let heroFragments=0;
        if(won&&b.mode==='campaign'){const first=b.index>p.campaign.cleared;reward=campaignLoot(p,b);if(first){bankOffline(p);p.campaign.cleared=b.index;}p.daily.progress.campaign++;p.weekly.progress.campaign++;p.daily.campaignWins=(p.daily.campaignWins||0)+1;if(first&&b.boss){const target=SUMMON_BANNER.hero;heroFragments=3;p.fragments[target]=(p.fragments[target]||0)+heroFragments;}}
        if(won&&b.mode==='campaign')p.campaign.stars[b.index]=Math.max(p.campaign.stars[b.index]||0,stageStars(b,won,performance));
        if(won&&b.mode==='campaign'&&b.tier==='elite'&&stageStars(b,true,performance)===3){const counter=counterProgress(p,b.chapter),local=(b.index-1)%50+1;if(counter&&!counter.claimed.includes(local)){p.campaign.artifacts[counter.theme]={claimed:[...counter.claimed,local]};counterReward={...counterProgress(p,b.chapter),earned:3};}}
        let hiroFragments=0,trial=null;
        if(b.mode==='spar'){note(p,`${b.name}: ${won?'thắng':'thua'} bản sao ${b.opponent.name}`);return {spar:{won,opponent:b.opponent}};}
        if(b.mode==='trial'){const dmg=Math.floor(damage),t=trialReward(p,b,dmg);p.daily.trialRuns=(p.daily.trialRuns||0)+1;p.trial??={best:{}};p.trial.best[b.index]=Math.max(p.trial.best[b.index]||0,dmg);reward=t.reward;trial={damage:dmg,bar:b.enemyHp,tier:t.tier,rewarded:t.rewarded,best:p.trial.best[b.index]};}
        if(b.mode==='boss'){p.boss.damageBest=Math.max(p.boss.damageBest,Math.floor(damage));if(won){if(b.index>p.boss.best&&b.index%HIRO_FRAGMENTS.endlessEvery===0){hiroFragments=HIRO_FRAGMENTS.endless;p.fragments.novice=(p.fragments.novice||0)+hiroFragments;}p.boss.best=Math.max(p.boss.best,b.index);p.boss.wins++;p.daily.progress.boss++;p.weekly.progress.boss++;p.daily.bossWins++;const late=p.daily.bossWins>BOSS_DAILY_WINS,diminishing=late?.25:1;const floor=endlessRewardFloor(b.index);reward={gold:Math.floor((1200+floor*130)*diminishing),exp:Math.max(2,Math.floor((16+floor)*diminishing)),seals:p.daily.bossWins<=24?65:0,essence:late?0:1+Number(b.index%5===0),ore:late?1:3};if(b.index>=60&&random()<.01)reward.divineOre=1;}}
        // heroFragments is listed with the resources (label in RESOURCES) so the result popup shows it.
        const actual=grant(p,reward);if(heroFragments){actual.heroFragments=heroFragments;actual.fragmentHero=SUMMON_BANNER.hero;}if(hiroFragments)actual.noviceFragments=hiroFragments;if(trial)actual.trial=trial;if(counterReward)actual.counterReward=counterReward;note(p,`${b.name}: ${won?'thắng':'thua'}`);return actual;
      }),
      buy:(resource,count=1)=>tx(p=>{const prices={exp:120,ore:80,wood:55,cloth:55,skillBooks:1800};check(resource in prices&&int(count,1,20),'Mặt hàng không bán bằng vàng.');spend(p,{gold:prices[resource]*count});return grant(p,{[resource]:count});}),
      purchase:(productId,count=1)=>tx(p=>{const product=WORLD.SHOP.find(item=>item.id===productId);check(product&&int(count,1,product.kind==='gear'?1:20),'Vật phẩm hoặc số lượng mua không hợp lệ.');if(product.kind==='gear')check(p.equipment.length<500,'Túi trang bị đã đầy.');spend(p,{[product.currency]:product.price*count});let item;if(product.kind==='resource')grant(p,{[product.target]:count});else item=gear(p,product.rarity,product.target);note(p,`Mua ${product.name} ×${count}`);return {product:product.id,count,currency:product.currency,price:product.price*count,gear:item};}),
      craft:(slot,rarity='uncommon')=>tx(p=>{check(slot in SLOTS&&CRAFT_RARITIES.includes(rarity),'Công thức không hợp lệ.');const gate=craftGate(rarity);check(p.campaign.cleared>=gate,rarity==='divine'?'Trang bị Thần cần vượt ải 300.':`Cần vượt ải ${gate}.`);spend(p,craftCost(rarity));return gear(p,rarity,slot);}),
      equip:(key,gearId)=>tx(p=>{const h=p.heroes[key],g=p.equipment.find(g=>g.id===gearId);check(h&&g,'Tướng hoặc trang bị không tồn tại.');for(const owned of Object.values(p.heroes))for(const [slot,id]of Object.entries(owned.gear))if(id===gearId)delete owned.gear[slot];h.gear[g.slot]=g.id;}),
      strengthen:gearId=>tx(p=>{const g=p.equipment.find(g=>g.id===gearId);spend(p,strengthenCost(g));g.level++;}),
      trainRelic:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const r=h.relic;check(r.level<r.evolution*20,'Tiến hóa bảo bối để mở giới hạn cấp mới.');spend(p,relicLevelCost(r));r.level++;note(p,`${RELICS[key]} đạt cấp ${r.level}`);}),
      evolveRelic:key=>tx(p=>{const h=p.heroes[key];check(h,'Chưa sở hữu tướng.');const r=h.relic,c=relicEvolveCost(r);check(r.level>=r.evolution*20,'Cần đạt giới hạn cấp của dạng hiện tại.');check(h.level>=r.evolution*50,`Cần tướng cấp ${r.evolution*50}.`);spend(p,c);r.evolution++;note(p,`${RELICS[key]} tiến hóa dạng ${r.evolution}`);}),
      salvage:gearId=>tx(p=>{const g=p.equipment.find(g=>g.id===gearId);check(g,'Trang bị không tồn tại.');check(!wornBy(p,gearId),'Tháo trang bị trước khi phân rã.');check(!g.locked,'Trang bị đang khóa.');check(!g.signature,'Vũ khí bản mệnh không phân rã được.');
        const v=salvageValue(g);p.equipment=p.equipment.filter(x=>x.id!==gearId);(p.salvageLog??=[]).unshift({at:now(),count:1,...v});p.salvageLog=p.salvageLog.slice(0,30);return grant(p,v);}),
      // All or nothing: every piece must still be salvageable; ids are removed in the same transaction, so a repeat cannot pay twice.
      salvageMany:ids=>tx(p=>{check(Array.isArray(ids)&&ids.length>=1&&ids.length<=BAG.cap,'Danh sách trang bị không hợp lệ.');const set=new Set(ids),list=p.equipment.filter(g=>set.has(g.id));
        check(list.length===set.size,'Có trang bị không còn trong túi.');for(const g of list)check(salvageable(p,g),'Có trang bị đang mặc, đang khóa hoặc là vũ khí bản mệnh.');
        const total=list.reduce((t,g)=>{const v=salvageValue(g);t.ore+=v.ore;t.gold+=v.gold;return t;},{ore:0,gold:0});
        p.equipment=p.equipment.filter(g=>!set.has(g.id));(p.salvageLog??=[]).unshift({at:now(),count:list.length,...total});p.salvageLog=p.salvageLog.slice(0,30);note(p,`Phân rã ${list.length} trang bị`);return grant(p,total);}),
      salvagePreview:filter=>salvagePreview(read(),filter),
      titles:()=>titleList(read()),
      wearTitle:id=>tx(p=>{if(id==null||id===''){delete p.title;return {title:null};}const t=titleList(p).find(x=>x.id===id);check(t,'Danh hiệu không tồn tại.');check(t.unlocked,'Chưa đạt danh hiệu này.');p.title=id;note(p,'Đeo danh hiệu '+t.name);return {title:id};}),
      lockGear:(gearId,on=true)=>tx(p=>{const g=p.equipment.find(g=>g.id===gearId);check(g,'Trang bị không tồn tại.');if(on)g.locked=true;else delete g.locked;return {locked:!!g.locked};}),
      setAutoSalvage:(rarity,on)=>tx(p=>{check(['common','uncommon'].includes(rarity),'Chỉ tự phân giải đồ Thường hoặc Tốt.');p.settings??={};p.settings.autoSalvage??={};p.settings.autoSalvage[rarity]=!!on;return {...p.settings.autoSalvage};}),
      bestGear:(key,goal='attack')=>bestGear(read(),key,goal),
      equipBest:(key,goal='attack')=>tx(p=>{const plan=bestGear(p,key,goal),h=p.heroes[key];check(Object.keys(plan).length,'Tướng đã mặc đồ tốt nhất có thể.');for(const [slot,{to}] of Object.entries(plan))h.gear[slot]=to;note(p,`${HEROES[key].name} mặc đồ tốt nhất (${Object.keys(plan).length} món)`);return {changed:Object.keys(plan).length};}),
      unequip:(key,slot)=>tx(p=>{check(p.heroes[key]&&slot in SLOTS,'Ô trang bị không hợp lệ.');delete p.heroes[key].gear[slot];}),
      saveEvent:draft=>tx(p=>{const e=normalizeEvent(draft);const i=p.events.findIndex(x=>x.id===e.id);if(i>=0)p.events[i]=e;else{check(p.events.length<100,'Tối đa 100 sự kiện.');p.events.push(e);}return e;}),
      removeEvent:eventId=>tx(p=>{p.events=p.events.filter(e=>e.id!==eventId);}),
      // Mailbox, newest first. Claims are atomic: one failed grant leaves every mail unchanged.
      // Badges (docs/GAME_DESIGN.md §20 round 3): `claim` counts rewards to take now for free (red); `hint` lists
      // what can be raised now (green, the UI hides those already seen until they change); `count` is unread mail (blue).
      notices:()=>{const p=read();daily(p);const at=current,claim={},hint={};
        claim.quests=DAILY.filter(q=>!p.daily.claimed.includes(q.id)&&(p.daily.progress[q.id]||0)>=q.target).length;
        claim.events=newbieState(p,at).filter(r=>r.open&&!r.claimed).length+WEEKLY.filter(q=>!p.weekly.claimed.includes(q.id)&&(p.weekly.progress[q.id]||0)>=q.target).length;
        claim.offline=offline(p,at).hours>=1?1:0;
        let chests=0;for(let c=1;c<=Math.min(WORLD.CHAPTERS.length,Math.floor(p.campaign.cleared/50)+1);c++){const pr=chapterProgress(p,c);chests+=STAR_MILESTONES.filter(m=>pr.total>=m&&!pr.claimed.includes(m)).length;}claim.campaign=chests;
        const live=p.mail.filter(m=>mailLive(m,at));claim.mail=live.filter(m=>mailPending(m)).length;
        hint.upgrade=[];hint.skills=[];for(const key of Object.keys(p.heroes)){for(const r of growthMap(p,key))if(r.state==='ready'){const sig=`${key}:${r.id}:${r.current}`;(r.id.startsWith('skill')?hint.skills:hint.upgrade).push(sig);}}
        hint.inventory=Object.entries(p.fragments).filter(([k,n])=>n>=80&&HEROES[k]).map(([k,n])=>`fuse:${k}:${Math.floor(n/80)}`);
        return {claim,hint,count:{mail:live.filter(m=>!m.read).length}};},
      mailbox:()=>{const p=read(),at=current,mails=p.mail.filter(m=>mailLive(m,at)).sort((a,b)=>b.sentAt-a.sentAt||(a.id<b.id?1:-1)).map(m=>({...m,gift:m.attachments.length>0,pending:mailPending(m)}));
        return {now:at,mails,unread:mails.filter(m=>!m.read).length,pending:mails.filter(m=>m.pending).length,deletable:mails.filter(m=>m.read&&!m.pending).length,limit:MAIL_LIMIT};},
      readMail:mailId=>tx(p=>{const m=findMail(p,mailId);m.read=true;return clone(m);}),
      claimMail:mailId=>tx(p=>{const m=findMail(p,mailId);check(m.attachments.length,'Thư này không có quà đính kèm.');m.read=true;if(m.claimed)return {};const actual=grant(p,mailReward(m));m.claimed=true;note(p,'Nhận quà từ thư: '+m.title);return actual;}),
      claimAllMail:()=>tx(p=>{const total={};let count=0;for(const m of p.mail)if(mailPending(m)){for(const [k,n]of Object.entries(grant(p,mailReward(m))))total[k]=(total[k]||0)+n;m.claimed=true;m.read=true;count++;}check(count,'Không có quà nào để nhận.');note(p,`Nhận quà từ ${count} thư`);return total;}),
      deleteMail:mailId=>tx(p=>{const m=findMail(p,mailId);check(!mailPending(m),'Hãy nhận quà trước khi xóa thư.');p.mail=p.mail.filter(x=>x!==m);}),
      deleteReadMail:()=>tx(p=>{const before=p.mail.length;p.mail=p.mail.filter(m=>!m.read||mailPending(m));return before-p.mail.length;}),
      // Local studio prototype only; real administrator mail needs the server.
      sendMail:draft=>tx(p=>{const m=normalizeMailDraft(draft,current);check(p.mail.length<MAIL_LIMIT,`Hòm thư đã đầy (${MAIL_LIMIT} thư). Hãy xóa bớt thư cũ.`);m.id='mail-'+id();p.mail.push(m);note(p,'Studio local gửi thư: '+m.title);return clone(m);}),
      recallMail:mailId=>tx(p=>{const m=p.mail.find(m=>m.id===mailId);check(m&&m.source==='local-studio','Chỉ thu hồi được thư gửi từ studio local.');p.mail=p.mail.filter(x=>x!==m);}),
      exportSave:()=>JSON.stringify(read(),null,2),
      pending:()=>read().pending
    };
    // Persist the starter once. Reloading never repeats the starter grant.
    if(!storage?.getItem(KEY)&&!memory)save(fresh(now()));
    // Explicit local preview allowance. Never part of gameplay or premium rewards.
    if(previewTickets&&!load().previewGrants?.includes('summon-preview-2026-10')){
      tx(p=>{grant(p,{tickets:1000});(p.previewGrants??=[]).push('summon-preview-2026-10');note(p,'Bản thử nghiệm · Cấp 1.000 vé để thử triệu hồi');});
    }
    // Explicitly requested test balance, opt-in for the local preview only.
    // Keep the ordinary reward pipeline's premium-currency rejection intact.
    if(previewGems&&!load().previewGrants?.includes('summon-gems-preview-2026-10')){
      tx(p=>{p.wallet.gems+=120000;(p.previewGrants??=[]).push('summon-gems-preview-2026-10');note(p,'Bản thử nghiệm · Cấp 120.000 Đá Ngọc để thử triệu hồi');});
    }
    // Test builds: Noct and Mika owned at six stars so their three forms can be played. Never gameplay.
    for(const [key,grantId,name] of [['shadow','noct-preview-2026-10','Noct'],['fire','mika-preview-2026-10','Mika']])
      if(previewHeroes&&!load().previewGrants?.includes(grantId))
        tx(p=>{p.heroes[key]={...heroSave(),...p.heroes[key],stars:6};(p.previewGrants??=[]).push(grantId);note(p,`Bản thử nghiệm · Sở hữu ${name} 6 sao để thử`);});
    // One sample gift so the local preview can exercise claiming; never sent to a real save.
    if(previewMail&&!load().previewGrants?.includes('mail-preview-2026-10')){
      tx(p=>{if(p.mail.length<MAIL_LIMIT)p.mail.push({id:'preview-gift-2026-10',kind:'gift',from:MAIL_ADMIN,title:'Quà thử nghiệm',
        body:'(bản thử nghiệm local)\nThư quà mẫu để thử nhận quà trong Hòm Thư. Thư này chỉ xuất hiện khi chạy trên máy chủ local và chỉ gửi một lần.',
        sentAt:current,expiresAt:current+7*DAY_MS,attachments:mailAttachments([{resource:'gold',count:5000},{resource:'tickets',count:10},{resource:'ore',count:20},{resource:'skillBooks',count:2}]),read:false,claimed:false,source:'preview'});
        (p.previewGrants??=[]).push('mail-preview-2026-10');note(p,'Bản thử nghiệm · Gửi thư quà thử nghiệm');});
    }
    return api;
  }
  function normalizeEvent(draft){check(draft&&typeof draft==='object','Cấu hình không hợp lệ.');const e={...EVENT_TEMPLATE,...draft};check(typeof e.id==='string'&&/^[a-z0-9-]{1,50}$/.test(e.id),'ID chỉ gồm chữ thường, số, dấu gạch ngang.');for(const [key,max]of [['title',80],['description',1200]])check(typeof e[key]==='string'&&e[key].length<=max,`${key} quá dài.`);check(typeof e.enabled==='boolean'&&e.status==='coming-soon','Sự kiện hiện chỉ hỗ trợ trạng thái coming-soon.');check(['icon-event','icon-gift','icon-arena','chest'].includes(e.banner),'Banner không hợp lệ.');check(int(Number(e.order),0,999),'Thứ tự không hợp lệ.');e.order=Number(e.order);for(const k of ['startsAt','endsAt'])check(e[k]===''||Number.isFinite(Date.parse(e[k])),'Ngày giờ không hợp lệ.');check(!e.startsAt||!e.endsAt||Date.parse(e.endsAt)>Date.parse(e.startsAt),'Ngày kết thúc phải sau ngày bắt đầu.');return Object.fromEntries(Object.keys(EVENT_TEMPLATE).map(k=>[k,e[k]]));}
  return {TITLE_RULES,titleList,BAG,SALVAGE_REFUND,strengthenPaid,salvageValue,salvagePreview,bestGear,gearScore,MAIL_LIMIT,MAIL_ATTACHMENTS,MAIL_COUNT_MAX,MAIL_TITLE_MAX,MAIL_BODY_MAX,MAIL_FROM_MAX,MAIL_EXPIRY_DAYS,MAIL_RESOURCES,mailAge,mailExpiry,normalizeMailDraft,VERSION,KEY,MAX_LEVEL,DAILY_SEAL_CAP,CLOCK_TOLERANCE,REPLAY_DAILY_WINS,BOSS_DAILY_WINS,compact,dailyRewardPreview,offlineRate,WORLD,HEROES,HERO_FORMS,heroForm,RARITIES,AFFIXES,SLOTS,SLOT_ART,RELICS,FORM_STARS,formMax,lookForm,HIRO_FRAGMENTS,relicLevelCost,relicEvolveCost,relicBonus,SKILL_KIT,SKILL_GATES,SKILL_MAX,SKILL_BRANCHES,skillKit,skillText,skillValues,skillGateText,evolutionBonus,heroAvailable,levelCostRange,CRAFT_RARITIES,craftGate,craftCost,strengthenCost,upgradePreview,statParts,statBreakdown,growthMap,RESOURCES,SUMMON_TABLE,SUMMON_PITY,SUMMON_BANNER,STAR_MILESTONES,CREATURES,EVOLUTION,TRIAL,trialOpen,trialEncounter,trialReward,VIP,DAILY,WEEKLY,NEWBIE,EVENT_TEMPLATE,makeEngine,levelCost,starCost,skillCost,skillUnlock,stats,offline,encounter,summonQuote,stageStars,campaignRewardPreview,chapterProgress,chapterReward,counterProgress,normalizeEvent};
});
