/* Released encounter themes, boss mechanics and the item-only shop catalog. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const EXPANSION=typeof module==='object'&&module.exports?require('./boss-chapters.js'):globalThis.GemwovenBossChapters;
  const skill=(name,kind,power=1,extra={})=>({name,kind,power,...extra});
  const BOSSES={
    earth:{name:'Cổ Thụ Thần Vệ',element:'earth',skills:[skill('Nanh Vuốt','strike',1.1),skill('Giáp Cổ Thụ','guard',0,{shield:.1}),skill('Hút Linh Lực','drain',.75,{drain:20})]},
    fire:{name:'Hỏa Long Tro Tàn',element:'fire',skills:[skill('Tam Liên Hỏa Tức','strike',1.25,{hits:3}),skill('Vảy Dung Nham','guard',0,{shield:.09}),skill('Tro Tàn Thiêu Đốt','burn',.8,{turns:2,dot:.22})]},
    ice:{name:'Nữ Vương Băng Nguyệt',element:'ice',skills:[skill('Băng Thương','strike',1.15,{hits:2}),skill('Kết Giới Băng','guard',0,{shield:.12}),skill('Hàn Phong','drain',.85,{drain:25})]},
    lightning:{name:'Lôi Vương Thiên Đỉnh',element:'lightning',skills:[skill('Ngũ Lôi','strike',1.3,{hits:5}),skill('Điện Trường','drain',.8,{drain:25}),skill('Tụ Điện','charge',.7,{charge:1.35})]},
    mire:{name:'Mẫu Nấm Độc',element:'earth',skills:[skill('Bào Tử Độc','poison',.65,{turns:3,dot:.18}),skill('Tán Nấm Hồi Sinh','heal',0,{heal:.08}),skill('Rễ Bào Tử','drain',.95,{drain:18})]},
    scarab:{name:'Bọ Vương Hoàng Kim',element:'fire',skills:[skill('Giáp Cát Hoàng Kim','guard',0,{shield:.15}),skill('Lưỡi Cưa Sa Mạc','pierce',1.15,{pierce:.5}),skill('Cơn Lốc Cát','strike',1.25,{hits:3})]},
    leviathan:{name:'Hải Long San Hô',element:'ice',skills:[skill('Sóng Nghiền','strike',1.2,{hits:2}),skill('Dòng Triều Hồi Phục','heal',0,{heal:.1}),skill('Xoáy Biển Sâu','drain',.9,{drain:30})]},
    colossus:{name:'Cự Tượng Bánh Răng',element:'lightning',skills:[skill('Nạp Lõi Hơi Nước','charge',.5,{charge:1.5}),skill('Búa Tạ Cơ Khí','strike',1.4),skill('Giáp Bánh Răng','guard',0,{shield:.13})]},
    prism:{name:'Nữ Vương Tinh Thể',element:'ice',skills:[skill('Lăng Kính Liên Kích','strike',1.2,{hits:4}),skill('Vỏ Tinh Thể','guard',0,{shield:.1}),skill('Quang Phổ Rạn Nứt','pierce',1.1,{pierce:.65})]},
    reaper:{name:'Tử Thần Nguyệt Ảnh',element:'ice',skills:[skill('Liềm Hồn','lifesteal',1.1,{leech:.35}),skill('Hút Hồn','drain',.9,{drain:35}),skill('Nguyệt Trảm','execute',1.1,{threshold:.4,bonus:1.5})]},
    roc:{name:'Đại Bàng Thiên Phong',element:'lightning',skills:[skill('Phong Vũ','strike',1.2,{hits:3}),skill('Lông Vũ Hộ Thể','guard',0,{shield:.08}),skill('Lốc Cướp Linh','drain',1,{drain:20})]},
    briar:{name:'Nữ Hoàng Gai',element:'earth',skills:[skill('Gai Độc','poison',.8,{turns:2,dot:.25}),skill('Hoa Ăn Linh','lifesteal',1,{leech:.3}),skill('Rừng Gai','guard',0,{shield:.12})]},
    seraph:{name:'Hộ Vệ Nhật Quang',element:'fire',skills:[skill('Nhật Kiếm','pierce',1.2,{pierce:.4}),skill('Ánh Dương Tái Sinh','heal',0,{heal:.08}),skill('Hào Quang Phán Quyết','strike',1.35,{hits:3})]},
    eclipse:{name:'Long Đế Hư Không',element:'lightning',skills:[skill('Nhật Thực','drain',1.1,{drain:30}),skill('Hư Không Phán Quyết','execute',1.15,{threshold:.35,bonus:1.6}),skill('Tinh Vân Bạo Phát','burn',1,{turns:2,dot:.3})]}
  };
  // Each chapter belongs to one boss; ordinary foes take turns stage by stage, the two
  // humanoid elites alternate on stages 5, 10, ... 45 and the boss holds stage 50.
  const CHAPTERS=[
    ['forest','Cổ Lâm Nguyên Sơ','earth',['slime','acorn','bat','bamboo-a','bamboo-b'],[['rootknight','Hiệp Sĩ Rễ Cổ'],['leafarcher','Xạ Thủ Lá Rừng']]],
    ['volcano','Miệng Núi Lửa','fire',['volcano-a','volcano-b','obsidian-a','obsidian-b'],[['flamelancer','Thương Binh Hỏa Long'],['ashcultist','Tư Tế Tro Tàn']]],
    ['ice','Băng Nguyệt Phế Tích','ice',['ice-a','ice-b','pine-a','pine-b'],[['frostguard','Vệ Binh Băng Nguyệt'],['snowwitch','Phù Thủy Tuyết']]],
    ['thunder','Thiên Thành Lôi Vũ','lightning',['thunder-a','thunder-b','coast-a','coast-b'],[['stormblade','Kiếm Sĩ Lôi Đình'],['sparkmage','Pháp Sư Tia Chớp']]],
    ['marsh','Đầm Bào Tử','mire',['marsh-a','marsh-b'],[['bogstalker','Thợ Săn Đầm Lầy'],['sporewitch','Phù Thủy Bào Tử']]],
    ['desert','Thánh Điện Cát Vàng','scarab',['desert-a','desert-b'],[['scarabguard','Vệ Binh Bọ Vàng'],['sandpriest','Tư Tế Cát Vàng']]],
    ['abyss','Vực San Hô','leviathan',['abyss-a','abyss-b'],[['reefcorsair','Hải Tặc San Hô'],['tidecaller','Pháp Sư Triều Dâng']]],
    ['foundry','Lò Rèn Cơ Khí','colossus',['foundry-a','foundry-b'],[['gearknight','Hiệp Sĩ Bánh Răng'],['tinkerer','Thợ Máy Hơi Nước']]],
    ['crystal','Động Tinh Thể','prism',['crystal-a','crystal-b','dream-a','dream-b'],[['shardblade','Kiếm Sĩ Lăng Tinh'],['gemsage','Hiền Giả Ngọc']]],
    ['haunted','Nghĩa Địa Nguyệt Ảnh','reaper',['haunted-a','haunted-b'],[['gravewarden','Thủ Mộ Nhân'],['bonepaladin','Hiệp Sĩ Xương']]],
    ['sky','Thiên Không Phong Thành','roc',['sky-a','sky-b'],[['windknight','Kỵ Sĩ Phong Vũ'],['cloudmonk','Tăng Nhân Mây']]],
    ['thorns','Vườn Gai Nguyền','briar',['thorns-a','thorns-b'],[['briarduelist','Kiếm Khách Gai Hồng'],['vinehexer','Phù Thủy Dây Leo']]],
    ['celestial','Nhật Quang Thánh Cung','seraph',['celestial-a','celestial-b'],[['sunpaladin','Thánh Kỵ Nhật Quang'],['dawncleric','Giáo Sĩ Bình Minh']]],
    ['void','Nhật Thực Hư Không','eclipse',['void-a','void-b','astral-a','astral-b'],[['voidknight','Hắc Kỵ Hư Không'],['starseer','Tiên Tri Tinh Thực']]]
  ].map(([id,name,boss,ordinary,elites],i)=>({id,name,boss,index:i+1,size:50,element:BOSSES[boss].element,music:'boss-'+id,ordinary,elites:elites.map(([e])=>id+'-'+e),creatures:[...ordinary,...elites.map(([e])=>id+'-'+e)],eliteNames:elites}));
  const ORDINARY_NAMES={volcano:['Quỷ Than','Thạch Dung'],ice:['Thỏ Tuyết','Sói Băng'],thunder:['Sứa Điện','Ưng Sấm'],marsh:['Ốc Độc','Cóc Bào Tử'],desert:['Sói Cát','Bọ Cạp Cát'],abyss:['Cua San Hô','Sứa Triều'],foundry:['Bọ Dây Cót','Phi Cơ Bánh Răng'],crystal:['Nhện Ngọc','Slime Tinh Thể'],haunted:['Đèn Hồn','Quạ Xương'],sky:['Cáo Gió','Cú Mây'],thorns:['Lợn Rừng Gai','Mầm Dây Leo'],celestial:['Bướm Nhật Quang','Sư Tử Ánh Vàng'],void:['Mắt Hư Không','Khuyển Nhật Thực'],pine:['Lợn Tùng Băng','Cú Tuyết'],obsidian:['Khuyển Hắc Thạch','Mạt Dung Nham'],bamboo:['Thằn Lằn Trúc','Cá Chép Ngọc'],coast:['Cua Bão','Hải Âu Sóng'],dream:['Bướm Mộng','U Linh Gối'],astral:['Ấu Long Sao','Tinh Cầu Linh']};
  // CREATURE_NAMES[chapter][creature id] for every foe without a hand-made CREATURES entry.
  const CREATURE_NAMES={};
  for(const c of CHAPTERS){
    CREATURE_NAMES[c.id]=Object.fromEntries(c.eliteNames.map(([e,name])=>[c.id+'-'+e,name]));
    for(const o of c.ordinary){const [theme,side]=o.split('-');if(ORDINARY_NAMES[theme])CREATURE_NAMES[c.id][o]=ORDINARY_NAMES[theme][side==='b'?1:0];}
    delete c.eliteNames;
  }
  for(const d of EXPANSION.definitions){
    BOSSES[d.id]={name:d.name,element:d.element,skills:d.skills,tactical:true};
    const ordinary=d.ordinary.map(([id])=>d.theme+'-'+id),elites=d.elites.map(([id])=>d.theme+'-'+id);
    CHAPTERS.push({id:d.theme,name:d.chapterName,boss:d.id,index:d.chapter,size:50,element:d.element,music:'boss-'+d.theme,creatures:[...ordinary,...elites],ordinary,elites,backdrop:d.backdrop,counterKey:d.counterKey});
    CREATURE_NAMES[d.theme]=Object.fromEntries([...d.ordinary,...d.elites].map(([id,name])=>[d.theme+'-'+id,name]));
  }
  // Every common foe has the same single skill; each elite has two skills of its own, themed on
  // its chapter but weaker than the chapter boss (lower power, smaller shields/heals/drains).
  const COMMON_SKILL=skill('Vồ Hung Bạo','strike',1.3);
  const ELITE_SKILLS=Object.fromEntries(Object.entries({
    'forest-rootknight':[['Chùy Đá Rễ','strike',.95],['Khiên Rễ Cổ','guard',0,{shield:.05}]],
    'forest-leafarcher':[['Mưa Tên Lá','strike',.85,{hits:3}],['Tên Gai Độc','poison',.55,{turns:2,dot:.12}]],
    'volcano-flamelancer':[['Thương Hỏa Long Xuyên','pierce',.9,{pierce:.35}],['Giáp Vảy Đỏ','guard',0,{shield:.05}]],
    'volcano-ashcultist':[['Lư Hương Tro Tàn','burn',.6,{turns:2,dot:.15}],['Khói Tế Lễ','drain',.6,{drain:12}]],
    'ice-frostguard':[['Kích Băng Nguyệt','strike',.9,{hits:2}],['Tường Băng','guard',0,{shield:.06}]],
    'ice-snowwitch':[['Gió Tuyết Cuốn','drain',.65,{drain:15}],['Trăng Băng Hồi Phục','heal',0,{heal:.04}]],
    'thunder-stormblade':[['Song Kiếm Lôi Đình','strike',.85,{hits:4}],['Tích Lôi','charge',.5,{charge:1.25}]],
    'thunder-sparkmage':[['Tia Chớp Nối','strike',.8,{hits:3}],['Điện Trường Nhỏ','drain',.6,{drain:15}]],
    'marsh-bogstalker':[['Giáo Xương Gai','pierce',.9,{pierce:.3}],['Bẫy Bùn Độc','poison',.55,{turns:2,dot:.12}]],
    'marsh-sporewitch':[['Mưa Bào Tử','poison',.5,{turns:3,dot:.1}],['Nấm Hồi Sinh','heal',0,{heal:.05}]],
    'desert-scarabguard':[['Khopesh Mặt Trời','strike',.95],['Khiên Bọ Vàng','guard',0,{shield:.06}]],
    'desert-sandpriest':[['Lời Nguyền Cát','drain',.6,{drain:15}],['Ankh Hồi Sinh','heal',0,{heal:.05}]],
    'abyss-reefcorsair':[['Đường Kiếm San Hô','strike',.85,{hits:2}],['Cướp Linh Hải Tặc','lifesteal',.8,{leech:.2}]],
    'abyss-tidecaller':[['Đinh Ba Triều Dâng','strike',.8,{hits:3}],['Vòng Nước Hộ Thân','guard',0,{shield:.05}]],
    'foundry-gearknight':[['Búa Piston','strike',1],['Giáp Hơi Nước','guard',0,{shield:.06}]],
    'foundry-tinkerer':[['Cờ Lê Xoáy','strike',.8,{hits:2}],['Drone Sửa Chữa','heal',0,{heal:.05}]],
    'crystal-shardblade':[['Kiếm Lăng Tinh','pierce',.9,{pierce:.35}],['Vỏ Pha Lê','guard',0,{shield:.05}]],
    'crystal-gemsage':[['Ngọc Cầu Phân Quang','strike',.8,{hits:3}],['Ngọc Hấp Linh','drain',.6,{drain:15}]],
    'haunted-gravewarden':[['Xẻng Đào Mộ','strike',.95],['Đèn Hồn Hút Khí','drain',.6,{drain:15}]],
    'haunted-bonepaladin':[['Kiếm Ấn Xương','execute',.85,{threshold:.35,bonus:1.4}],['Khiên Xương','guard',0,{shield:.06}]],
    'sky-windknight':[['Thương Phong Xuyên','pierce',.9,{pierce:.3}],['Lông Vũ Hộ Giáp','guard',0,{shield:.05}]],
    'sky-cloudmonk':[['Chưởng Mây','strike',.8,{hits:2}],['Mây Lành','heal',0,{heal:.05}]],
    'thorns-briarduelist':[['Kiếm Gai Hồng','strike',.85,{hits:3}],['Hồng Hút Máu','lifesteal',.8,{leech:.2}]],
    'thorns-vinehexer':[['Dây Leo Siết','poison',.55,{turns:2,dot:.14}],['Vương Miện Gai','guard',0,{shield:.05}]],
    'celestial-sunpaladin':[['Nhật Kiếm Thánh','strike',.95,{hits:2}],['Khiên Mặt Trời','guard',0,{shield:.06}]],
    'celestial-dawncleric':[['Lư Hương Thánh','burn',.55,{turns:2,dot:.13}],['Thánh Quang Bình Minh','heal',0,{heal:.05}]],
    'void-voidknight':[['Đại Kiếm Hư Vô','execute',.9,{threshold:.35,bonus:1.4}],['Áo Choàng Tinh Tú','guard',0,{shield:.05}]],
    'void-starseer':[['Mưa Sao Băng','strike',.8,{hits:3}],['Cầu Tinh Thực','drain',.65,{drain:15}]],
    'eldergrove-rootwarden':[['Rễ Trói Buộc','drain',.6,{drain:15}],['Vỏ Cây Cổ Mộc','guard',0,{shield:.06}]],
    'eldergrove-blossomranger':[['Song Đao Bạch Hoa','strike',.85,{hits:2}],['Phấn Hoa Ký Sinh','poison',.5,{turns:2,dot:.12}]],
    'caldera-basaltbrute':[['Quyền Huyền Nham','strike',.95,{hits:2}],['Da Đá Nung','guard',0,{shield:.06}]],
    'caldera-furnacepriest':[['Lửa Lò Thiêu','burn',.6,{turns:2,dot:.15}],['Tế Lửa Hồi Nguyên','heal',0,{heal:.04}]],
    'glacier-rimeknight':[['Trảm Sương Giá','strike',.9,{hits:2}],['Giáp Sương','guard',0,{shield:.06}]],
    'glacier-blizzardmage':[['Mưa Băng Vụn','strike',.75,{hits:3}],['Cầu Bão Tuyết','drain',.65,{drain:15}]],
    'stormspire-voltlancer':[['Thương Lôi Dực','pierce',.9,{pierce:.35}],['Tụ Sấm','charge',.5,{charge:1.25}]],
    'stormspire-stormshaman':[['Trụ Sét Tế','strike',.8,{hits:3}],['Mưa Bão Hút Linh','drain',.6,{drain:15}]],
    'soulcrypt-cagekeeper':[['Xích Giam Hồn','drain',.65,{drain:15}],['Lồng Sắt Hộ Thân','guard',0,{shield:.06}]],
    'soulcrypt-veilassassin':[['Dao Bóng','strike',.8,{hits:3}],['Ám Sát Hắc Màn','execute',.85,{threshold:.35,bonus:1.45}]],
    'mycelium-plagueherald':[['Ôn Bào Lan Tràn','poison',.55,{turns:3,dot:.1}],['Chuông Dịch','drain',.6,{drain:12}]],
    'mycelium-mycoknight':[['Chùy Nấm Bào Tử','strike',.9,{hits:2}],['Giáp Mũ Nấm','guard',0,{shield:.06}]],
    'geode-rampartgolem':[['Đấm Thành Lũy','strike',1],['Tường Tinh Thạch','guard',0,{shield:.07}]],
    'geode-prismseer':[['Tia Lăng Kính','pierce',.85,{pierce:.35}],['Tinh Quang Hồi Phục','heal',0,{heal:.04}]],
    'hourglass-dunesentinel':[['Giáo Cồn Cát','strike',.9,{hits:2}],['Khiên Cát Lún','guard',0,{shield:.06}]],
    'hourglass-chronoweaver':[['Sợi Thời Khắc','drain',.65,{drain:18}],['Ngưng Đọng','charge',.5,{charge:1.3}]],
    'coralreef-tidemarshal':[['Đinh Ba Thủy Triều','strike',.9,{hits:2}],['Giáp Ngọc Trai','guard',0,{shield:.06}]],
    'coralreef-coraloracle':[['Sóng Ngầm','drain',.6,{drain:15}],['Lời Tiên Tri San Hô','heal',0,{heal:.05}]],
    'moonkeep-lunarknight':[['Nguyệt Kiếm','strike',.9,{hits:2}],['Giáp Trăng Bạc','guard',0,{shield:.06}]],
    'moonkeep-eclipsehuntress':[['Song Dao Lưỡi Liềm','strike',.8,{hits:4}],['Vết Cắn Nhật Thực','lifesteal',.8,{leech:.2}]]
  }).map(([id,list])=>[id,list.map(([name,kind,power,extra])=>skill(name,kind,power,extra))]));
  // The same skills as phase-fight effects (expansion chapters run on boss-tactics.js).
  function tacticalSkill(s){
    const hit={type:'hit',power:s.power,hits:s.hits||1},effects={guard:[{type:'ward',pct:s.shield}],heal:[{type:'heal',pct:s.heal}],drain:[{type:'drain',amount:s.drain},hit],
      burn:[hit,{type:'stack',count:1}],poison:[hit,{type:'stack',count:1}],pierce:[{type:'shatter',fraction:s.pierce*.5},hit],lifesteal:[hit,{type:'heal',pct:.02}]}[s.kind]||[hit];
    return {name:s.name,kind:s.kind,effects};
  }
  const chapterForStage=n=>CHAPTERS[Math.max(0,Math.min(CHAPTERS.length-1,Math.floor((n-1)/50)))];
  const SHOP=[
    ['exp','Sách EXP','resource','exp','common','gold',120,'exp-book','Kinh nghiệm để tăng cấp tướng.'],
    ['ore','Quặng Sắt','resource','ore','common','gold',80,'ore','Dùng rèn và cường hóa trang bị.'],
    ['wood','Gỗ Mềm','resource','wood','common','gold',55,'wood','Nguyên liệu rèn thông dụng.'],
    ['cloth','Vải Thô','resource','cloth','common','gold',55,'cloth','Nguyên liệu may giáp thông dụng.'],
    ['skillBooks','Bí Kíp','resource','skillBooks','uncommon','gold',1800,'skill-book','Dùng học và tăng cấp kỹ năng.'],
    ['essence','Tinh Hoa','resource','essence','rare','gems',20,'fire-essence','Nguyên liệu quý để tăng sao và tiến hóa.'],
    ['divineOre','Thần Thạch','resource','divineOre','divine','gems',120,'lightning-essence','Mảnh nguyên liệu dùng rèn trang bị Thần.'],
    ['legendary-weapon','Kiếm Huyền Thoại','gear','weapon','legendary','gems',2500,'fire-sword','Vũ khí phẩm Huyền Thoại, có thể cường hóa đến +20.'],
    ['legendary-armor','Giáp Huyền Thoại','gear','armor','legendary','gems',2200,'helmet','Giáp phẩm Huyền Thoại, tăng HP của tướng.'],
    ['legendary-boots','Ủng Huyền Thoại','gear','boots','legendary','gems',1800,'boots','Giày phẩm Huyền Thoại, tăng phòng thủ.'],
    ['divine-weapon','Kiếm Thần','gear','weapon','divine','gems',6000,'fire-sword','Vũ khí Thần có một hiệu ứng ngẫu nhiên: choáng, hút máu hoặc xuyên giáp.'],
    ['divine-armor','Giáp Thần','gear','armor','divine','gems',5500,'helmet','Giáp Thần có hiệu ứng kháng mất lượt hoặc hộ thân.'],
    ['divine-boots','Ủng Thần','gear','boots','divine','gems',5000,'boots','Giày Thần có hiệu ứng kháng mất lượt hoặc hộ thân.']
  ].map(([id,name,kind,target,rarity,currency,price,asset,description])=>({id,name,kind,target,rarity,currency,price,asset,description}));
  for(const [slot,name]of [['helmet','Mũ'],['pants','Quần'],['glasses','Kính']])for(const [rarity,label,price]of [['legendary','Huyền Thoại',2000],['divine','Thần',5200]])SHOP.push({id:rarity+'-'+slot,name:name+' '+label,kind:'gear',target:slot,rarity,currency:'gems',price,asset:'gear-'+slot,description:name+' dùng chung giữa các tướng. Cường hóa tối đa +20.'});
  for(const row of SHOP)if(row.kind==='gear'&&row.target==='armor')row.asset='gear-armor';
  return {BOSSES,CHAPTERS,CREATURE_NAMES,SHOP,chapterForStage,EXPANSION,MAX_STAGES:CHAPTERS.length*50,ELITE_EVERY:5,COMMON_SKILL,ELITE_SKILLS,tacticalSkill};
});
