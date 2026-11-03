/* Released encounter themes, boss mechanics and the item-only shop catalog. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const EXPANSION=typeof module==='object'&&module.exports?require('./boss-chapters.js'):globalThis.GemwovenBossChapters;
  const skill=(name,kind,power=1,extra={})=>({name,kind,power,...extra});
  // Each boss fights with its own kit: three skills and a signature ultimate (ult:true), each
  // staged with a move that suits its body (move: lunge, charge, slam, breath, volley, beam,
  // eruption, rain, roar, tether, vanish, aura) and, for the ultimates, a status nobody else uses.
  const st=(id,turns,value=0,target='hero')=>({id,turns,value,target});
  const BOSSES={
    earth:{name:'Thạch Mộc Cự Vệ',element:'earth',skills:[skill('Nanh Vuốt','strike',1.1,{move:'lunge'}),skill('Giáp Cổ Thụ','guard',0,{shield:.1,move:'aura'}),skill('Hút Linh Lực','drain',.75,{drain:20,move:'tether'}),
      skill('Thần Mộc Bất Tử','strike',.9,{move:'slam',heal:.06,status:st('undying',2,0,'self'),ult:true,description:'Nện đất, hồi 6% HP và bất tử 2 lượt (HP không xuống dưới 1).'})]},
    fire:{name:'Hỏa Long Tro Tàn',element:'fire',skills:[skill('Long Vĩ Quật','strike',1.25,{move:'tailwhip'}),skill('Vảy Dung Nham','guard',0,{shield:.09,move:'aura'}),skill('Long Nha Thiêu Đốt','burn',.8,{turns:2,dot:.22,move:'bite'}),
      skill('Long Viêm Diệt Thế','strike',1.3,{hits:5,move:'flight',status:st('dot',3,.32),ult:true,description:'Rồng bay lên phun lửa liên tục: năm nhịp thiêu, rồi thiêu đốt nặng suốt 3 lượt.'})]},
    ice:{name:'Băng Nguyệt Linh Hồ',element:'ice',skills:[skill('Băng Thương','strike',1.15,{hits:2,move:'volley'}),skill('Kết Giới Băng','guard',0,{shield:.12,move:'aura'}),skill('Hàn Phong','drain',.85,{drain:25,move:'roar'}),
      skill('Nguyệt Băng Phong Ấn','strike',1.1,{hits:3,move:'rain',status:st('stun',1),ult:true,description:'Mưa giáo băng đông cứng tướng: mất 1 lượt.'})]},
    lightning:{name:'Lôi Sư Thiên Đỉnh',element:'lightning',skills:[skill('Ngũ Lôi','strike',1.3,{hits:5,move:'rain'}),skill('Điện Trường','drain',.8,{drain:25,move:'roar'}),skill('Tụ Điện','charge',.7,{charge:1.35,move:'pounce'}),
      skill('Lôi Thần Quang Pháo','strike',2.2,{move:'beam',pierce:1,ult:true,description:'Tia lôi quang xuyên thủng toàn bộ giáp.'})]},
    mire:{name:'Mẫu Nấm Độc',element:'earth',skills:[skill('Bào Tử Độc','poison',.65,{turns:3,dot:.18,move:'eruption'}),skill('Tán Nấm Hồi Sinh','heal',0,{heal:.08,move:'aura'}),skill('Rễ Bào Tử','drain',.95,{drain:18,move:'tether'}),
      skill('Bào Tử Mê Loạn','strike',.7,{hits:4,move:'rain',status:st('confuse',2,.5),ult:true,description:'Bào tử mê hồn: 2 lượt, một nửa sát thương của tướng dội ngược vào chính mình.'})]},
    scarab:{name:'Bọ Vương Hoàng Kim',element:'fire',skills:[skill('Giáp Cát Hoàng Kim','guard',0,{shield:.15,move:'aura'}),skill('Sừng Vàng Xuyên Phá','pierce',1.15,{pierce:.5,move:'gore'}),skill('Hàm Kìm Tam Kẹp','strike',1.25,{hits:3,move:'pincer'}),
      skill('Lời Nguyền Pharaoh','strike',1,{move:'slam',status:st('antiheal',3),ult:true,description:'Ấn nguyền cát vàng: tướng không thể hồi máu trong 3 lượt.'})]},
    // The sea dragon is the rain-and-thunder dragon king: it gathers the sea at its horns, then breathes
    // and calls the storm from afar, alternating damage, exhaustion, healing rain and paralysis.
    leviathan:{name:'Hải Long San Hô',element:'ice',skills:[skill('Thủy Long Tức','strike',1.25,{hits:3,move:'jet'}),skill('Hô Phong Hoán Vũ','heal',0,{heal:.12,shield:.04,move:'pour'}),skill('Hàn Băng Tức','drain',.9,{hits:2,drain:35,move:'breath'}),
      skill('Lôi Vũ Long Thần','strike',1.5,{hits:4,move:'tempest',status:st('paralyze',2,15),ult:true,description:'Mây giông phủ kín: bốn tia sét giáng xuống; tướng tê liệt (mất lượt), rồi bị điện giật hút 15 năng lượng mỗi lượt trong 2 lượt.'})]},
    colossus:{name:'Cự Tượng Bánh Răng',element:'lightning',skills:[skill('Nạp Lõi Hơi Nước','charge',.5,{charge:1.5,move:'roar'}),skill('Búa Tạ Cơ Khí','strike',1.4,{move:'lunge'}),skill('Giáp Bánh Răng','guard',0,{shield:.13,move:'aura'}),
      skill('Trọng Chùy Phá Giáp','strike',1.4,{move:'slam',shatter:1,status:st('vulnerable',3,.3),ult:true,description:'Đập nát toàn bộ giáp; tướng nhận thêm 30% sát thương trong 3 lượt.'})]},
    prism:{name:'Bọ Ngựa Lăng Tinh',element:'ice',skills:[skill('Song Liềm Liên Trảm','strike',1.2,{hits:4,move:'flurry'}),skill('Vỏ Tinh Thể','guard',0,{shield:.1,move:'aura'}),skill('Quang Phổ Rạn Nứt','pierce',1.1,{pierce:.65,move:'beam'}),
      skill('Thiên Liềm Loạn Vũ','strike',1.6,{hits:9,move:'rush',status:st('weaken',3,.4),ult:true,description:'Chém liên hoàn tám nhát từ mọi phía rồi một nhát kết liễu; sát thương của tướng giảm 40% trong 3 lượt.'})]},
    reaper:{name:'Tử Thần Nguyệt Ảnh',element:'ice',skills:[skill('Liềm Hồn','lifesteal',1.1,{leech:.35,move:'lunge'}),skill('Hút Hồn','drain',.9,{drain:35,move:'tether'}),skill('Nguyệt Trảm','execute',1.1,{threshold:.4,bonus:1.5,move:'charge'}),
      skill('Ảnh Hồn Tiêu Biến','strike',.8,{move:'vanish',status:st('stealth',1,0,'self'),ult:true,description:'Tan vào bóng trăng: mọi đòn đánh trượt trong lượt tới.'})]},
    roc:{name:'Đại Bàng Thiên Phong',element:'lightning',skills:[skill('Phong Vũ','strike',1.2,{hits:3,move:'volley'}),skill('Lông Vũ Hộ Thể','guard',0,{shield:.08,move:'aura'}),skill('Lốc Cướp Linh','drain',1,{drain:20,move:'roar'}),
      skill('Đại Bàng Bổ Nhào','drain',1.8,{drain:100,move:'dive',ult:true,description:'Bổ nhào từ trời cao, cuốn sạch năng lượng của tướng.'})]},
    briar:{name:'Nữ Hoàng Gai',element:'earth',skills:[skill('Gai Độc','poison',.8,{turns:2,dot:.25,move:'thrust'}),skill('Hoa Ăn Linh','lifesteal',1,{leech:.3,move:'tether'}),skill('Rừng Gai','guard',0,{shield:.12,move:'aura'}),
      skill('Vương Miện Gai Phản','strike',.6,{move:'eruption',status:st('reflect',2,.35,'self'),ult:true,description:'Vương miện gai: 2 lượt, 35% sát thương tướng gây ra bị dội ngược.'})]},
    seraph:{name:'Thiên Sứ Nhật Quang',element:'fire',skills:[skill('Nhật Kiếm','pierce',1.2,{pierce:.4,move:'lunge'}),skill('Ánh Dương Tái Sinh','heal',0,{heal:.08,move:'aura'}),skill('Hào Quang Phán Quyết','strike',1.35,{hits:3,move:'rain'}),
      skill('Phong Ấn Thánh Quang','strike',1.1,{move:'beam',status:st('silence',2),ult:true,description:'Thánh quang phong ấn: tướng không thể dùng tuyệt kỹ trong 2 lượt.'})]},
    eclipse:{name:'Long Đế Hư Không',element:'lightning',skills:[skill('Nhật Thực','drain',1.1,{drain:30,move:'roar'}),skill('Hư Không Phán Quyết','execute',1.15,{threshold:.35,bonus:1.6,move:'bite'}),skill('Tinh Vân Bạo Phát','burn',1,{turns:2,dot:.3,move:'breath'}),
      skill('Hố Đen Nuốt Chửng','strike',1.2,{move:'tether',status:st('haste',1,0,'self'),ult:true,description:'Hố đen kéo tướng lại gần; Long Đế hành động thêm một lượt.'})]}
  };
  // Each chapter belongs to one boss; ordinary foes take turns stage by stage, the five
  // humanoid elites hold stages 5, 10, ... 45 (progression.js encounter) and the boss holds stage 50.
  const CHAPTERS=[
    ['forest','Cổ Lâm Nguyên Sơ','earth',['slime','acorn','bat','bamboo-a','bamboo-b'],[['rootknight','Hiệp Sĩ Rễ Cổ'],['leafarcher','Xạ Thủ Lá Rừng'],['mossdruid','Đạo Sĩ Rêu Đá'],['boarstalker','Thợ Săn Nanh Lợn'],['stagchief','Thủ Lĩnh Gạc Đá']]],
    ['volcano','Miệng Núi Lửa','fire',['volcano-a','volcano-b','obsidian-a','obsidian-b'],[['flamelancer','Thương Binh Hỏa Long'],['ashcultist','Tư Tế Tro Tàn'],['slagarcher','Cung Thủ Hắc Diệu'],['pyremonk','Võ Tăng Hỏa Diệm'],['drakewarlord','Long Tướng Dung Nham']]],
    ['ice','Băng Nguyệt Phế Tích','ice',['ice-a','ice-b','pine-a','pine-b'],[['frostguard','Vệ Binh Băng Nguyệt'],['snowwitch','Phù Thủy Tuyết'],['foxhuntress','Thợ Săn Hồ Tuyết'],['moonduelist','Kiếm Khách Hàn Nguyệt'],['moonjarl','Tướng Quân Bạch Nguyệt']]],
    ['thunder','Thiên Thành Lôi Vũ','lightning',['thunder-a','thunder-b','coast-a','coast-b'],[['stormblade','Kiếm Sĩ Lôi Đình'],['sparkmage','Pháp Sư Tia Chớp'],['boltgunner','Nỏ Thủ Sấm Sét'],['bellpriest','Giáo Sĩ Chuông Sấm'],['stormmaul','Đại Tướng Lôi Chùy']]],
    ['marsh','Đầm Bào Tử','mire',['marsh-a','marsh-b'],[['bogstalker','Thợ Săn Đầm Lầy'],['sporewitch','Phù Thủy Bào Tử'],['toadshaman','Pháp Sư Cóc Đầm'],['leechblade','Sát Thủ Đỉa Đầm'],['bogwarlord','Thủ Lĩnh Bùn Đen']]],
    ['desert','Thánh Điện Cát Vàng','scarab',['desert-a','desert-b'],[['scarabguard','Vệ Binh Bọ Vàng'],['sandpriest','Tư Tế Cát Vàng'],['sunarcher','Cung Thủ Mặt Trời'],['jarmummy','Xác Ướp Bình Tro'],['sphinxguard','Tướng Nhân Sư']]],
    ['abyss','Vực San Hô','leviathan',['abyss-a','abyss-b'],[['reefcorsair','Hải Tặc San Hô'],['tidecaller','Pháp Sư Triều Dâng'],['harpooner','Thợ Săn Lao Móc'],['sirenblade','Nữ Kiếm Hải Yêu'],['krakenlord','Thuyền Trưởng Xúc Tu']]],
    ['foundry','Lò Rèn Cơ Khí','colossus',['foundry-a','foundry-b'],[['gearknight','Hiệp Sĩ Bánh Răng'],['tinkerer','Thợ Máy Hơi Nước'],['steamgunner','Pháo Thủ Hơi Nước'],['sawbutcher','Đao Phủ Lưỡi Cưa'],['chiefengineer','Kỹ Sư Trưởng Tia Lửa']]],
    ['crystal','Động Tinh Thể','prism',['crystal-a','crystal-b','dream-a','dream-b'],[['shardblade','Kiếm Sĩ Lăng Tinh'],['gemsage','Hiền Giả Ngọc'],['prismarcher','Cung Thủ Lăng Kính'],['shardmonk','Võ Tăng Thạch Anh'],['geodeguard','Tướng Tinh Giáp']]],
    ['haunted','Nghĩa Địa Nguyệt Ảnh','reaper',['haunted-a','haunted-b'],[['gravewarden','Thủ Mộ Nhân'],['bonepaladin','Hiệp Sĩ Xương'],['banshee','Nữ Vong Than Khóc'],['scarecrow','Bù Nhìn Nguyền Rủa'],['necrolord','Vu Sư Xương Trắng']]],
    ['sky','Thiên Không Phong Thành','roc',['sky-a','sky-b'],[['windknight','Kỵ Sĩ Phong Vũ'],['cloudmonk','Tăng Nhân Mây'],['galearcher','Cung Thủ Phong Vân'],['fanblade','Vũ Nữ Quạt Phong'],['tempestmage','Pháp Sư Bão Cánh']]],
    ['thorns','Vườn Gai Nguyền','briar',['thorns-a','thorns-b'],[['briarduelist','Kiếm Khách Gai Hồng'],['vinehexer','Phù Thủy Dây Leo'],['rosearcher','Cung Thủ Hồng Gai'],['shearkeeper','Lão Làm Vườn Nguyền'],['bramblewarden','Thống Lĩnh Bụi Gai']]],
    ['celestial','Nhật Quang Thánh Cung','seraph',['celestial-a','celestial-b'],[['sunpaladin','Thánh Kỵ Nhật Quang'],['dawncleric','Giáo Sĩ Bình Minh'],['choirmaid','Nữ Tu Thánh Ca'],['judgeknight','Thẩm Phán Thánh Đường'],['dawnlegate','Thiên Tướng Bình Minh']]],
    ['void','Nhật Thực Hư Không','eclipse',['void-a','void-b','astral-a','astral-b'],[['voidknight','Hắc Kỵ Hư Không'],['starseer','Tiên Tri Tinh Thực'],['riftstalker','Sát Thủ Khe Nứt'],['gravitymonk','Tu Sĩ Trọng Lực'],['cometlord','Chúa Tể Sao Chổi']]]
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
  // Every common foe has the same single skill. Each elite fights the way it is drawn: its basic blow (ELITE_BASIC:
  // its name, and reach:true for an archer or caster, who shoots from where it stands; the others run in) and two
  // skills of its own, themed on its chapter and weaker than the boss, the first staged like a skill of a boss's kit
  // (echo names it: same mechanic and staging, its own art and sounds, src/foe-skills.js ELITE_LOOKS; docs/ELITE_SKILLS.md).
  const COMMON_SKILL=skill('Vồ Hung Bạo','strike',1.3);
  const ELITE_SKILLS=Object.fromEntries(Object.entries({
    'forest-rootknight':[['Rễ Đá Trói Chân','drain',.65,{drain:15,move:'snare',echo:'Hút Linh Lực'}],['Khiên Rễ Cổ','guard',0,{shield:.05,move:'aura'}]],
    'forest-leafarcher':[['Mưa Tên Lá','strike',.85,{hits:3,move:'rain',echo:'Hào Quang Phán Quyết'}],['Tên Gai Độc','poison',.55,{turns:2,dot:.12,move:'shot'}]],
    'volcano-flamelancer':[['Long Thương Thiêu Đốt','burn',.7,{turns:2,dot:.15,move:'thrust',echo:'Long Nha Thiêu Đốt'}],['Giáp Vảy Đỏ','guard',0,{shield:.05,move:'aura'}]],
    'volcano-ashcultist':[['Lư Hương Tro Tàn','burn',.6,{turns:2,dot:.15,move:'snare',echo:'Bào Tử Độc'}],['Khói Tế Lễ','drain',.6,{drain:12,move:'tether'}]],
    'ice-frostguard':[['Trảm Nguyệt Hàn Phong','drain',.65,{drain:15,move:'sweep',echo:'Hàn Phong'}],['Tường Băng','guard',0,{shield:.06,move:'aura'}]],
    'ice-snowwitch':[['Băng Thương Nguyệt','strike',.85,{hits:2,move:'volley',echo:'Băng Thương'}],['Trăng Băng Hồi Phục','heal',0,{heal:.04,move:'aura'}]],
    'thunder-stormblade':[['Tích Lôi Bổ Kích','charge',.5,{charge:1.25,move:'pounce',echo:'Tụ Điện'}],['Song Kiếm Lôi Đình','strike',.85,{hits:4,move:'flurry'}]],
    'thunder-sparkmage':[['Tia Chớp Nối','strike',.8,{hits:3,move:'strikes',echo:'Ngũ Lôi'}],['Điện Trường Nhỏ','drain',.6,{drain:15,move:'tether'}]],
    'marsh-bogstalker':[['Bẫy Bùn Độc','poison',.55,{turns:2,dot:.12,move:'snare',echo:'Bào Tử Độc'}],['Giáo Xương Gai','pierce',.9,{pierce:.3,move:'charge'}]],
    'marsh-sporewitch':[['Mưa Bào Tử','poison',.5,{turns:3,dot:.1,move:'rain',echo:'Bào Tử Mê Loạn'}],['Nấm Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'desert-scarabguard':[['Xung Phong Bọ Vàng','pierce',.9,{pierce:.35,move:'gore',echo:'Sừng Vàng Xuyên Phá'}],['Khiên Bọ Vàng','guard',0,{shield:.06,move:'aura'}]],
    'desert-sandpriest':[['Lời Nguyền Cát','drain',.6,{drain:15,move:'snare',status:st('antiheal',1),echo:'Lời Nguyền Pharaoh'}],['Ankh Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'abyss-reefcorsair':[['Cướp Linh Hải Tặc','lifesteal',.8,{leech:.2,move:'lunge',echo:'Liềm Hồn'}],['Đường Kiếm San Hô','strike',.85,{hits:2,move:'flurry'}]],
    'abyss-tidecaller':[['Đinh Ba Triều Dâng','strike',.8,{hits:3,move:'beam',echo:'Thủy Long Tức'}],['Vòng Nước Hộ Thân','guard',0,{shield:.05,move:'aura'}]],
    'foundry-gearknight':[['Nạp Hơi Piston','charge',.5,{charge:1.3,move:'roar',echo:'Nạp Lõi Hơi Nước'}],['Búa Piston','strike',1,{move:'lunge'}]],
    'foundry-tinkerer':[['Cờ Lê Xoáy','strike',.8,{hits:2,move:'boomerang',echo:'Nguyệt Trảm'}],['Drone Sửa Chữa','heal',0,{heal:.05,move:'aura'}]],
    'crystal-shardblade':[['Liên Trảm Lăng Tinh','strike',.85,{hits:3,move:'flurry',echo:'Song Liềm Liên Trảm'}],['Vỏ Pha Lê','guard',0,{shield:.05,move:'aura'}]],
    'crystal-gemsage':[['Ngọc Cầu Phân Quang','pierce',.85,{pierce:.35,move:'beam',echo:'Quang Phổ Rạn Nứt'}],['Ngọc Hấp Linh','drain',.6,{drain:15,move:'tether'}]],
    'haunted-gravewarden':[['Đèn Hồn Hút Khí','drain',.6,{drain:15,move:'spiral',echo:'Hút Hồn'}],['Xẻng Đào Mộ','strike',.95,{move:'lunge'}]],
    'haunted-bonepaladin':[['Kiếm Ấn Xương','execute',.85,{threshold:.35,bonus:1.4,move:'boomerang',echo:'Nguyệt Trảm'}],['Khiên Xương','guard',0,{shield:.06,move:'aura'}]],
    'sky-windknight':[['Thương Phong Xuyên','pierce',.9,{pierce:.3,move:'charge',echo:'Đại Bàng Bổ Nhào'}],['Lông Vũ Hộ Giáp','guard',0,{shield:.05,move:'aura'}]],
    'sky-cloudmonk':[['Chưởng Lốc Mây','drain',.7,{drain:15,move:'sweep',echo:'Lốc Cướp Linh'}],['Mây Lành','heal',0,{heal:.05,move:'aura'}]],
    'thorns-briarduelist':[['Hồng Hút Máu','lifesteal',.8,{leech:.2,move:'thrust',echo:'Gai Độc'}],['Kiếm Gai Hồng','strike',.85,{hits:3,move:'lunge'}]],
    'thorns-vinehexer':[['Dây Leo Siết','poison',.55,{turns:2,dot:.14,move:'snare',echo:'Hoa Ăn Linh'}],['Vương Miện Gai','guard',0,{shield:.05,move:'aura'}]],
    'celestial-sunpaladin':[['Nhật Kiếm Thánh','pierce',.85,{pierce:.3,move:'thrust',echo:'Nhật Kiếm'}],['Khiên Mặt Trời','guard',0,{shield:.06,move:'aura'}]],
    'celestial-dawncleric':[['Lư Hương Thánh','burn',.55,{turns:2,dot:.13,move:'column',echo:'Phong Ấn Thánh Quang'}],['Thánh Quang Bình Minh','heal',0,{heal:.05,move:'aura'}]],
    'void-voidknight':[['Đại Kiếm Hư Vô','execute',.9,{threshold:.35,bonus:1.4,move:'lunge',echo:'Hư Không Phán Quyết'}],['Áo Choàng Tinh Tú','guard',0,{shield:.05,move:'aura'}]],
    'void-starseer':[['Cầu Tinh Thực','drain',.65,{drain:15,move:'volley',echo:'Nhật Thực'}],['Mưa Sao Băng','strike',.8,{hits:3,move:'rain'}]],
    'eldergrove-rootwarden':[['Rễ Trói Buộc','drain',.6,{drain:15,move:'snare',echo:'Chưởng Rễ Đâm Xuyên'}],['Vỏ Cây Cổ Mộc','guard',0,{shield:.06,move:'aura'}]],
    'eldergrove-blossomranger':[['Phấn Hoa Ký Sinh','poison',.5,{turns:2,dot:.12,move:'snare',echo:'Nở Hoa Ký Sinh'}],['Song Đao Bạch Hoa','strike',.85,{hits:2,move:'flurry'}]],
    'caldera-basaltbrute':[['Phá Tuyến Nham Chấn','pierce',.85,{pierce:.35,move:'sweep',echo:'Nung Chảy Phòng Tuyến'}],['Da Đá Nung','guard',0,{shield:.06,move:'aura'}]],
    'caldera-furnacepriest':[['Lửa Lò Thiêu','burn',.6,{turns:2,dot:.15,move:'rain',echo:'Mưa Tro Tàn'}],['Tế Lửa Hồi Nguyên','heal',0,{heal:.04,move:'aura'}]],
    'glacier-rimeknight':[['Ngục Sương','drain',.65,{drain:15,move:'bind',echo:'Vương Miện Hàn Ngục'}],['Giáp Sương','guard',0,{shield:.06,move:'aura'}]],
    'glacier-blizzardmage':[['Mưa Băng Vụn','strike',.75,{hits:3,move:'rain',echo:'Mưa Tinh Thể'}],['Cầu Bão Tuyết','drain',.65,{drain:15,move:'tether'}]],
    'stormspire-voltlancer':[['Thương Lôi Dực','pierce',.9,{pierce:.35,move:'charge',echo:'Sấm Xuyên Tầng Mây'}],['Tụ Sấm','charge',.5,{charge:1.25,move:'aura'}]],
    'stormspire-stormshaman':[['Mưa Bão Hút Linh','drain',.6,{drain:15,move:'bind',echo:'Mắt Bão Cướp Linh'}],['Trụ Sét Tế','strike',.8,{hits:3,move:'rain'}]],
    'soulcrypt-cagekeeper':[['Xích Giam Hồn','drain',.65,{drain:15,move:'tether',echo:'Xiềng Xích Hút Sinh'}],['Lồng Sắt Hộ Thân','guard',0,{shield:.06,move:'aura'}]],
    'soulcrypt-veilassassin':[['Ám Sát Hắc Màn','execute',.85,{threshold:.35,bonus:1.45,move:'vanish',echo:'Kiếm Ảnh Truy Hồn'}],['Dao Bóng','strike',.8,{hits:3,move:'flurry'}]],
    'mycelium-plagueherald':[['Ôn Bào Lan Tràn','poison',.55,{turns:3,dot:.1,move:'rain',echo:'Mưa Bào Tử Lục'}],['Chuông Dịch','drain',.6,{drain:12,move:'tether'}]],
    'mycelium-mycoknight':[['Chùy Nấm Bào Tử','strike',.9,{move:'punch',echo:'Gậy Nấm Hoại Sinh'}],['Giáp Mũ Nấm','guard',0,{shield:.06,move:'aura'}]],
    'geode-rampartgolem':[['Chấn Địa Thành Lũy','strike',1,{move:'sweep',echo:'Chấn Địa Tinh Nham'}],['Tường Tinh Thạch','guard',0,{shield:.07,move:'aura'}]],
    'geode-prismseer':[['Tia Lăng Kính','pierce',.85,{pierce:.35,move:'beam',echo:'Pháo Lăng Kính'}],['Tinh Quang Hồi Phục','heal',0,{heal:.04,move:'aura'}]],
    'hourglass-dunesentinel':[['Sa Nhận Cồn Cát','strike',.9,{hits:2,move:'volley',echo:'Sa Nhận Phân Kỳ'}],['Khiên Cát Lún','guard',0,{shield:.06,move:'aura'}]],
    'hourglass-chronoweaver':[['Sợi Thời Khắc','drain',.65,{drain:18,move:'tether',echo:'Lãi Suất Thời Gian'}],['Ngưng Đọng','charge',.5,{charge:1.3,move:'aura'}]],
    'coralreef-tidemarshal':[['Đinh Ba Thủy Triều','strike',.9,{hits:2,move:'sweep',echo:'Vạn Trượng Hải Triều'}],['Giáp Ngọc Trai','guard',0,{shield:.06,move:'aura'}]],
    'coralreef-coraloracle':[['Sóng Ngầm','drain',.6,{drain:15,move:'spiral',echo:'Nghịch Lưu Rút Linh'}],['Lời Tiên Tri San Hô','heal',0,{heal:.05,move:'aura'}]],
    'moonkeep-lunarknight':[['Nguyệt Kiếm Tam Liên','strike',.9,{hits:3,move:'lunge',echo:'Nguyệt Kiếm Tam Trảm'}],['Giáp Trăng Bạc','guard',0,{shield:.06,move:'aura'}]],
    'moonkeep-eclipsehuntress':[['Vết Cắn Nhật Thực','lifesteal',.8,{leech:.2,move:'pincer',echo:'Trăng Máu Hút Sinh'}],['Song Dao Lưỡi Liềm','strike',.8,{hits:4,move:'flurry'}]],
    'forest-mossdruid':[['Rêu Hút Sinh Khí','drain',.6,{drain:15,move:'tether',echo:'Hút Linh Lực'}],['Suối Rêu Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'forest-stagchief':[['Gạc Đá Song Trảm','strike',.9,{hits:2,move:'lunge',echo:'Nanh Vuốt'}],['Giáp Gạc Đá','guard',0,{shield:.06,move:'aura'}]],
    'volcano-slagarcher':[['Mưa Tên Dung Nham','burn',.6,{turns:2,dot:.14,hits:3,move:'rain',echo:'Mưa Tro Tàn'}],['Tên Hắc Diệu','pierce',.85,{pierce:.3,move:'shot'}]],
    'volcano-drakewarlord':[['Long Trảm Quét Lửa','burn',.65,{turns:2,dot:.15,move:'sweep',echo:'Long Vĩ Quật'}],['Giáp Long Lân','guard',0,{shield:.06,move:'aura'}]],
    'ice-foxhuntress':[['Tiễn Sương Liên Hoàn','strike',.85,{hits:3,move:'volley',echo:'Băng Thương'}],['Mặt Nạ Sương','guard',0,{shield:.05,move:'aura'}]],
    'ice-moonjarl':[['Nguyệt Phủ Hàn Trảm','drain',.7,{drain:15,move:'sweep',echo:'Hàn Phong'}],['Giáp Bạch Nguyệt','guard',0,{shield:.06,move:'aura'}]],
    'thunder-boltgunner':[['Nỏ Sấm Liên Phát','strike',.8,{hits:3,move:'volley',echo:'Ngũ Lôi'}],['Mũi Nỏ Xuyên Điện','pierce',.85,{pierce:.3,move:'shot'}]],
    'thunder-stormmaul':[['Chấn Động Lôi Trường','strike',.9,{move:'roar',echo:'Điện Trường'}],['Búa Sấm Truy Kích','pierce',.9,{pierce:.35,move:'charge'}]],
    'marsh-toadshaman':[['Lưỡi Cóc Hút Độc','drain',.6,{drain:15,move:'tether',echo:'Rễ Bào Tử'}],['Bùn Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'marsh-bogwarlord':[['Bùn Đen Nhấn Chìm','poison',.6,{turns:2,dot:.13,move:'snare',echo:'Bào Tử Độc'}],['Giáp Bùn Khô','guard',0,{shield:.06,move:'aura'}]],
    'desert-sunarcher':[['Mưa Tên Mặt Trời','strike',.8,{hits:3,move:'rain',echo:'Hào Quang Phán Quyết'}],['Tên Bọ Cạp','poison',.55,{turns:2,dot:.12,move:'shot'}]],
    'desert-sphinxguard':[['Nhân Sư Xuyên Thánh','pierce',.9,{pierce:.35,move:'thrust',echo:'Sừng Vàng Xuyên Phá'}],['Khiên Nhân Sư','guard',0,{shield:.06,move:'aura'}]],
    'abyss-harpooner':[['Lao Móc Kéo Linh','drain',.65,{drain:15,move:'tether',echo:'Thủy Long Tức'}],['Lao Xuyên Giáp','pierce',.85,{pierce:.3,move:'shot'}]],
    'abyss-krakenlord':[['Xúc Tu Cuộn Sóng','strike',.95,{hits:2,move:'sweep',echo:'Hàn Băng Tức'}],['Giáp Vỏ Sò','guard',0,{shield:.06,move:'aura'}]],
    'foundry-steamgunner':[['Pháo Hơi Cao Áp','strike',.8,{hits:3,move:'beam',echo:'Nạp Lõi Hơi Nước'}],['Van Xả Giáp','guard',0,{shield:.05,move:'aura'}]],
    'foundry-chiefengineer':[['Sét Cuộn Dây','strike',.85,{hits:3,move:'strikes',echo:'Búa Tạ Cơ Khí'}],['Robot Sửa Giáp','heal',0,{heal:.05,move:'aura'}]],
    'crystal-prismarcher':[['Tiễn Lăng Kính Tán Xạ','strike',.85,{hits:3,move:'volley',echo:'Quang Phổ Rạn Nứt'}],['Tên Kim Cương','pierce',.85,{pierce:.35,move:'shot'}]],
    'crystal-geodeguard':[['Song Liềm Tinh Giáp','strike',.9,{hits:2,move:'lunge',echo:'Song Liềm Liên Trảm'}],['Giáp Tinh Động','guard',0,{shield:.06,move:'aura'}]],
    'haunted-banshee':[['Tiếng Than Cướp Hồn','drain',.6,{drain:15,move:'spiral',echo:'Hút Hồn'}],['Màn Sương Vong Hồn','guard',0,{shield:.05,move:'aura'}]],
    'haunted-necrolord':[['Cột Hồn Xương Trắng','strike',.9,{move:'column',echo:'Nguyệt Trảm'}],['Lễ Hồi Xương','heal',0,{heal:.05,move:'aura'}]],
    'sky-galearcher':[['Mưa Lông Vũ Tiễn','strike',.8,{hits:3,move:'rain',echo:'Phong Vũ'}],['Tiễn Gió Xuyên Mây','pierce',.85,{pierce:.3,move:'shot'}]],
    'sky-tempestmage':[['Lốc Xoáy Thiên Không','drain',.65,{drain:15,move:'sweep',echo:'Lốc Cướp Linh'}],['Mây Hộ Thân','guard',0,{shield:.05,move:'aura'}]],
    'thorns-rosearcher':[['Mưa Cánh Hồng Độc','poison',.55,{turns:2,dot:.12,hits:3,move:'rain',echo:'Gai Độc'}],['Mũi Gai Hút Máu','lifesteal',.75,{leech:.2,move:'shot'}]],
    'thorns-bramblewarden':[['Bụi Gai Đại Trảm','strike',.95,{move:'sweep',echo:'Rừng Gai'}],['Giáp Bụi Gai','guard',0,{shield:.06,move:'aura'}]],
    'celestial-choirmaid':[['Thánh Ca Xuyên Không','pierce',.8,{pierce:.3,move:'beam',echo:'Hào Quang Phán Quyết'}],['Khúc Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'celestial-dawnlegate':[['Thiên Kích Xung Phong','pierce',.9,{pierce:.35,move:'charge',echo:'Nhật Kiếm'}],['Khiên Bình Minh','guard',0,{shield:.06,move:'aura'}]],
    'void-riftstalker':[['Ám Bộ Khe Nứt','execute',.85,{threshold:.35,bonus:1.4,move:'vanish',echo:'Hư Không Phán Quyết'}],['Song Chủy Tinh Vân','strike',.8,{hits:3,move:'flurry'}]],
    'void-cometlord':[['Sao Chổi Giáng Thế','strike',.9,{hits:2,move:'rain',echo:'Tinh Vân Bạo Phát'}],['Hào Quang Hư Không','guard',0,{shield:.05,move:'aura'}]],
    'eldergrove-petalarcher':[['Mưa Tên Phấn Hoa','poison',.55,{turns:2,dot:.12,hits:3,move:'rain',echo:'Nở Hoa Ký Sinh'}],['Tên Bạch Dương','pierce',.85,{pierce:.3,move:'shot'}]],
    'eldergrove-birchelder':[['Rễ Bạch Dương Đâm Lên','drain',.65,{drain:15,move:'snare',echo:'Chưởng Rễ Đâm Xuyên'}],['Mùa Xuân Nhỏ','heal',0,{heal:.05,move:'aura'}]],
    'caldera-slagslinger':[['Hố Xỉ Sôi','burn',.6,{turns:2,dot:.14,move:'snare',echo:'Nung Chảy Phòng Tuyến'}],['Xích Xỉ Hút Nhiệt','drain',.6,{drain:12,move:'tether'}]],
    'caldera-obsidianlord':[['Hắc Diệu Trọng Trảm','execute',.9,{threshold:.35,bonus:1.4,move:'lunge',echo:'Song Quyền Nham Chấn'}],['Giáp Hắc Diệu','guard',0,{shield:.06,move:'aura'}]],
    'glacier-frostbolter':[['Nỏ Băng Tam Phát','strike',.85,{hits:3,move:'volley',echo:'Băng Thương Tam Liên'}],['Mũi Nỏ Xuyên Băng','pierce',.85,{pierce:.3,move:'shot'}]],
    'glacier-wintergeneral':[['Đông Chí Đại Trảm','strike',1,{move:'sweep',echo:'Vương Miện Hàn Ngục'}],['Giáp Đông Chí','guard',0,{shield:.06,move:'aura'}]],
    'stormspire-galeduelist':[['Lôi Kiếm Liên Đâm','strike',.85,{hits:4,move:'flurry',echo:'Lôi Trảo Liên Kích'}],['Tụ Điện Kiếm','charge',.5,{charge:1.25,move:'aura'}]],
    'stormspire-thunderarchon':[['Thiên Lôi Chấp Pháp Lệnh','strike',.85,{hits:3,move:'strikes',echo:'Sấm Xuyên Tầng Mây'}],['Lông Lôi Hộ Thể','guard',0,{shield:.05,move:'aura'}]],
    'soulcrypt-wailbinder':[['Xích Tràng Hạt Hút Hồn','drain',.65,{drain:15,move:'tether',echo:'Xiềng Xích Hút Sinh'}],['Hồn Lung Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'soulcrypt-dreadwarden':[['Trảm Hồn Đoạn Ngục','execute',.9,{threshold:.35,bonus:1.4,move:'lunge',echo:'Liềm Cắt Hồn'}],['Giáp Ngục Thần','guard',0,{shield:.06,move:'aura'}]],
    'mycelium-sporearcher':[['Mưa Tên Nấm','poison',.55,{turns:3,dot:.1,hits:3,move:'rain',echo:'Mưa Bào Tử Lục'}],['Tên Sợi Nấm','pierce',.85,{pierce:.3,move:'shot'}]],
    'mycelium-rotchampion':[['Trảm Mục Rữa','lifesteal',.8,{leech:.2,move:'lunge',echo:'Hấp Thu Hoại Chất'}],['Giáp Nấm Thối','guard',0,{shield:.06,move:'aura'}]],
    'geode-lodeshooter':[['Nỏ Tinh Thạch Liên Phát','strike',.85,{hits:2,move:'volley',echo:'Pháo Lăng Kính'}],['Hào Mỏ Hộ Thân','guard',0,{shield:.05,move:'aura'}]],
    'geode-minechief':[['Cuốc Chấn Động','strike',1,{move:'sweep',echo:'Chấn Địa Tinh Nham'}],['Giáp Thạch Anh','guard',0,{shield:.07,move:'aura'}]],
    'hourglass-sandarcher':[['Mưa Tên Cát Chảy','strike',.8,{hits:3,move:'rain',echo:'Sa Nhận Phân Kỳ'}],['Tên Ngưng Thời','pierce',.85,{pierce:.3,move:'shot'}]],
    'hourglass-sandgeneral':[['Đại Chùy Phá Thời','strike',.95,{move:'sweep',echo:'Đảo Chiều Tinh Sa'}],['Giáp Hoàng Sa','guard',0,{shield:.06,move:'aura'}]],
    'coralreef-anemonewitch':[['Xúc Tu Hải Quỳ','poison',.55,{turns:2,dot:.13,move:'snare',echo:'Nghịch Lưu Rút Linh'}],['Nước Thánh Hải Quỳ','heal',0,{heal:.05,move:'aura'}]],
    'coralreef-shellgeneral':[['Búa San Hô Cuộn Sóng','strike',.95,{hits:2,move:'sweep',echo:'Song Trảo Sóng Ngọc'}],['Giáp Mai Rùa','guard',0,{shield:.07,move:'aura'}]],
    'moonkeep-crescentarcher':[['Tiễn Trăng Non Liên Hoàn','strike',.85,{hits:3,move:'volley',echo:'Kiếm Ảnh Truy Hồn'}],['Tên Huyết Nguyệt','lifesteal',.75,{leech:.2,move:'shot'}]],
    'moonkeep-bloodseer':[['Xoáy Huyết Nguyệt','drain',.65,{drain:15,move:'spiral',echo:'Trăng Máu Hút Sinh'}],['Nguyệt Quang Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'forest-boarstalker':[['Vết Nanh Rừng Sâu','lifesteal',.8,{leech:.2,move:'flurry',hits:2,echo:'Nanh Vuốt'}],['Hú Gọi Bầy','charge',.5,{charge:1.25,move:'aura'}]],
    'volcano-pyremonk':[['Liên Quyền Hỏa Long','burn',.65,{turns:2,dot:.14,hits:3,move:'flurry',echo:'Long Nha Thiêu Đốt'}],['Thiền Lửa Hồi Khí','heal',0,{heal:.05,move:'aura'}]],
    'ice-moonduelist':[['Nhất Thức Hàn Nguyệt','pierce',.85,{pierce:.35,move:'thrust',echo:'Băng Thương'}],['Áo Choàng Sương','guard',0,{shield:.05,move:'aura'}]],
    'thunder-bellpriest':[['Hồi Chuông Giáng Lôi','strike',.8,{hits:3,move:'strikes',echo:'Ngũ Lôi'}],['Chuông Hút Điện','drain',.6,{drain:15,move:'tether'}]],
    'marsh-leechblade':[['Đỉa Độc Ám Tập','lifesteal',.8,{leech:.2,move:'vanish',echo:'Rễ Bào Tử'}],['Nhát Cắt Thối Rữa','poison',.55,{turns:2,dot:.12,hits:2,move:'flurry'}]],
    'desert-jarmummy':[['Bão Tro Khâm Liệm','drain',.6,{drain:15,move:'spiral',echo:'Hàm Kìm Tam Kẹp'}],['Băng Quấn Hộ Thân','guard',0,{shield:.05,move:'aura'}]],
    'abyss-sirenblade':[['Vũ Điệu Hải Yêu','strike',.85,{hits:4,move:'flurry',echo:'Thủy Long Tức'}],['Màn Nước Hải Yêu','guard',0,{shield:.05,move:'aura'}]],
    'foundry-sawbutcher':[['Cưa Máy Liên Hoàn','pierce',.9,{pierce:.35,hits:2,move:'lunge',echo:'Búa Tạ Cơ Khí'}],['Tạp Dề Thép','guard',0,{shield:.06,move:'aura'}]],
    'crystal-shardmonk':[['Quyền Phá Lăng Kính','pierce',.85,{pierce:.35,move:'lunge',echo:'Song Liềm Liên Trảm'}],['Tĩnh Tâm Tinh Thể','heal',0,{heal:.04,move:'aura'}]],
    'haunted-scarecrow':[['Chĩa Hồn Đóng Đinh','pierce',.85,{pierce:.3,move:'thrust',echo:'Liềm Hồn'}],['Rơm Hút Hồn','drain',.6,{drain:15,move:'tether'}]],
    'sky-fanblade':[['Quạt Phong Xé Gió','strike',.85,{hits:3,move:'flurry',echo:'Phong Vũ'}],['Gió Lành Thổi Tới','heal',0,{heal:.05,move:'aura'}]],
    'thorns-shearkeeper':[['Kéo Tỉa Máu','lifesteal',.8,{leech:.2,hits:2,move:'lunge',echo:'Hoa Ăn Linh'}],['Tạp Dề Gai','guard',0,{shield:.06,move:'aura'}]],
    'celestial-judgeknight':[['Phán Quyết Giáng Đòn','execute',.85,{threshold:.35,bonus:1.4,move:'sweep',echo:'Nhật Kiếm'}],['Luật Thánh Hộ Thân','guard',0,{shield:.06,move:'aura'}]],
    'void-gravitymonk':[['Trọng Quyền Hố Sao','strike',.9,{move:'lunge',echo:'Hư Không Phán Quyết'}],['Tĩnh Tọa Tinh Không','heal',0,{heal:.04,move:'aura'}]],
    'eldergrove-honeykeeper':[['Mật Dính Ký Sinh','poison',.55,{turns:2,dot:.12,move:'snare',echo:'Nở Hoa Ký Sinh'}],['Mật Hoa Hồi Sinh','heal',0,{heal:.05,move:'aura'}]],
    'caldera-lavadancer':[['Vũ Điệu Dung Nham','burn',.6,{turns:2,dot:.13,hits:3,move:'flurry',echo:'Song Quyền Nham Chấn'}],['Vòng Xỉ Hộ Thân','guard',0,{shield:.05,move:'aura'}]],
    'glacier-mirrorpriestess':[['Gương Băng Phản Quang','pierce',.85,{pierce:.3,move:'beam',echo:'Băng Thương Tam Liên'}],['Hơi Lạnh Hồi Nguyên','heal',0,{heal:.05,move:'aura'}]],
    'stormspire-goldarcher':[['Mưa Tên Bão Vàng','strike',.8,{hits:3,move:'rain',echo:'Thiên Phạt Cửu Lôi'}],['Tên Xuyên Tầng Mây','pierce',.85,{pierce:.3,move:'shot'}]],
    'soulcrypt-cellbolter':[['Nỏ Hồn Xuyên Ngục','drain',.65,{drain:15,move:'volley',echo:'Liềm Cắt Hồn'}],['Khiên Song Sắt','guard',0,{shield:.06,move:'aura'}]],
    'mycelium-sporehag':[['Hố Sợi Nấm','poison',.55,{turns:3,dot:.1,move:'snare',echo:'Hấp Thu Hoại Chất'}],['Nấm Thuốc Bà Đồng','heal',0,{heal:.05,move:'aura'}]],
    'geode-quartzduelist':[['Liên Đâm Thạch Anh','strike',.85,{hits:3,move:'flurry',echo:'Chấn Địa Tinh Nham'}],['Vỏ Sa Thạch','guard',0,{shield:.05,move:'aura'}]],
    'hourglass-stormassassin':[['Ám Sát Cát Chảy','execute',.85,{threshold:.35,bonus:1.4,move:'vanish',echo:'Sa Nhận Phân Kỳ'}],['Lốc Dao Cát','strike',.8,{hits:3,move:'flurry'}]],
    'coralreef-sharkhunter':[['Xé Nát Sóng Ngầm','lifesteal',.8,{leech:.2,hits:2,move:'flurry',echo:'Song Trảo Sóng Ngọc'}],['Da Cá Mập','guard',0,{shield:.05,move:'aura'}]],
    'moonkeep-wolfslayer':[['Rìu Bạc Trừ Tà','pierce',.9,{pierce:.35,move:'lunge',echo:'Nguyệt Kiếm Tam Trảm'}],['Da Sói Bạc','guard',0,{shield:.06,move:'aura'}]]
  }).map(([id,list])=>[id,list.map(([name,kind,power,extra])=>skill(name,kind,power,extra))]));
  const ELITE_BASIC={
    'forest-rootknight':{name:'Chùy Rễ'},'forest-leafarcher':{name:'Bắn Tên',reach:true},'volcano-flamelancer':{name:'Đâm Thương'},'volcano-ashcultist':{name:'Quăng Lư Tro',reach:true},
    'ice-frostguard':{name:'Bổ Kích'},'ice-snowwitch':{name:'Tiễn Băng',reach:true},'thunder-stormblade':{name:'Song Kiếm'},'thunder-sparkmage':{name:'Tia Điện',reach:true},
    'marsh-bogstalker':{name:'Đâm Giáo'},'marsh-sporewitch':{name:'Phun Bào Tử',reach:true},'desert-scarabguard':{name:'Chém Khopesh'},'desert-sandpriest':{name:'Cầu Cát',reach:true},
    'abyss-reefcorsair':{name:'Chém Kiếm'},'abyss-tidecaller':{name:'Tia Nước',reach:true},'foundry-gearknight':{name:'Nện Búa'},'foundry-tinkerer':{name:'Quất Cờ Lê'},
    'crystal-shardblade':{name:'Chém Đại Kiếm'},'crystal-gemsage':{name:'Mảnh Ngọc',reach:true},'haunted-gravewarden':{name:'Bổ Xẻng'},'haunted-bonepaladin':{name:'Chém Đại Kiếm'},
    'sky-windknight':{name:'Đâm Thương'},'sky-cloudmonk':{name:'Chưởng Pháp'},'thorns-briarduelist':{name:'Đâm Kiếm'},'thorns-vinehexer':{name:'Hạt Gai',reach:true},
    'celestial-sunpaladin':{name:'Chém Kiếm'},'celestial-dawncleric':{name:'Hương Thánh',reach:true},'void-voidknight':{name:'Chém Đại Kiếm'},'void-starseer':{name:'Tinh Đạn',reach:true},
    'eldergrove-rootwarden':{name:'Đấm Gỗ'},'eldergrove-blossomranger':{name:'Song Đao'},'caldera-basaltbrute':{name:'Đấm Nham'},'caldera-furnacepriest':{name:'Than Hồng',reach:true},
    'glacier-rimeknight':{name:'Chém Kiếm'},'glacier-blizzardmage':{name:'Đạn Tuyết',reach:true},'stormspire-voltlancer':{name:'Đâm Thương'},'stormspire-stormshaman':{name:'Cầu Sét',reach:true},
    'soulcrypt-cagekeeper':{name:'Quăng Chìa Xích',reach:true},'soulcrypt-veilassassin':{name:'Song Đao'},'mycelium-plagueherald':{name:'Phun Dịch',reach:true},'mycelium-mycoknight':{name:'Nện Chùy'},
    'geode-rampartgolem':{name:'Đấm Đá'},'geode-prismseer':{name:'Tinh Phiến',reach:true},'hourglass-dunesentinel':{name:'Chém Liềm'},'hourglass-chronoweaver':{name:'Hạt Thời Gian',reach:true},
    'coralreef-tidemarshal':{name:'Đâm Đinh Ba'},'coralreef-coraloracle':{name:'Ngọc Trai',reach:true},'moonkeep-lunarknight':{name:'Chém Kiếm'},'moonkeep-eclipsehuntress':{name:'Song Dao'},
    'forest-mossdruid':{name:'Hạt Rêu',reach:true},'forest-stagchief':{name:'Bổ Rìu Đá'},'volcano-slagarcher':{name:'Tên Lửa',reach:true},'volcano-drakewarlord':{name:'Bổ Đại Đao'},
    'ice-foxhuntress':{name:'Tên Sương',reach:true},'ice-moonjarl':{name:'Bổ Rìu Trăng'},'thunder-boltgunner':{name:'Bắn Nỏ Sấm',reach:true},'thunder-stormmaul':{name:'Nện Chùy Sấm'},
    'marsh-toadshaman':{name:'Phun Nhựa Độc',reach:true},'marsh-bogwarlord':{name:'Nện Khúc Gỗ'},'desert-sunarcher':{name:'Tên Vàng',reach:true},'desert-sphinxguard':{name:'Đâm Trường Đao'},
    'abyss-harpooner':{name:'Phóng Lao',reach:true},'abyss-krakenlord':{name:'Quật Mỏ Neo'},'foundry-steamgunner':{name:'Bắn Đạn Hơi',reach:true},'foundry-chiefengineer':{name:'Tia Lửa Cuộn',reach:true},
    'crystal-prismarcher':{name:'Tên Lăng Kính',reach:true},'crystal-geodeguard':{name:'Song Liềm Tinh'},'haunted-banshee':{name:'Hồn Cầu',reach:true},'haunted-necrolord':{name:'Lửa Sọ',reach:true},
    'sky-galearcher':{name:'Tên Gió',reach:true},'sky-tempestmage':{name:'Cầu Gió',reach:true},'thorns-rosearcher':{name:'Tên Gai',reach:true},'thorns-bramblewarden':{name:'Chém Gai'},
    'celestial-choirmaid':{name:'Nốt Thánh',reach:true},'celestial-dawnlegate':{name:'Đâm Kích'},'void-riftstalker':{name:'Song Chủy'},'void-cometlord':{name:'Đạn Sao Chổi',reach:true},
    'eldergrove-petalarcher':{name:'Tên Bạch Hoa',reach:true},'eldergrove-birchelder':{name:'Giọt Nhựa',reach:true},'caldera-slagslinger':{name:'Ném Xỉ',reach:true},'caldera-obsidianlord':{name:'Bổ Hắc Kiếm'},
    'glacier-frostbolter':{name:'Bắn Nỏ Băng',reach:true},'glacier-wintergeneral':{name:'Chém Băng Kiếm'},'stormspire-galeduelist':{name:'Đâm Lôi Kiếm'},'stormspire-thunderarchon':{name:'Ấn Lôi',reach:true},
    'soulcrypt-wailbinder':{name:'Hạt Hồn',reach:true},'soulcrypt-dreadwarden':{name:'Bổ Đầu Rìu'},'mycelium-sporearcher':{name:'Tên Mốc',reach:true},'mycelium-rotchampion':{name:'Bổ Dao Rữa'},
    'geode-lodeshooter':{name:'Bắn Nỏ Tinh',reach:true},'geode-minechief':{name:'Bổ Cuốc Đá'},'hourglass-sandarcher':{name:'Tên Cát',reach:true},'hourglass-sandgeneral':{name:'Nện Búa Cát'},
    'coralreef-anemonewitch':{name:'Gai Nhím Biển',reach:true},'coralreef-shellgeneral':{name:'Nện San Hô'},'moonkeep-crescentarcher':{name:'Tên Trăng',reach:true},'moonkeep-bloodseer':{name:'Cầu Huyết',reach:true},
    'forest-boarstalker':{name:'Song Rìu'},'volcano-pyremonk':{name:'Hỏa Quyền'},'ice-moonduelist':{name:'Đâm Băng Kiếm'},'thunder-bellpriest':{name:'Tiếng Chuông Sét',reach:true},
    'marsh-leechblade':{name:'Song Liềm Xương'},'desert-jarmummy':{name:'Bụi Tro Bình',reach:true},'abyss-sirenblade':{name:'Đâm San Hô'},'foundry-sawbutcher':{name:'Bổ Lưỡi Cưa'},
    'crystal-shardmonk':{name:'Đấm Tinh Thể'},'haunted-scarecrow':{name:'Đâm Chĩa'},'sky-fanblade':{name:'Song Quạt'},'thorns-shearkeeper':{name:'Cắt Kéo Sắt'},
    'celestial-judgeknight':{name:'Nện Búa Xử'},'void-gravitymonk':{name:'Quyền Tinh Thiết'},'eldergrove-honeykeeper':{name:'Giọt Mật',reach:true},'caldera-lavadancer':{name:'Song Đao Lửa'},
    'glacier-mirrorpriestess':{name:'Tia Gương Băng',reach:true},'stormspire-goldarcher':{name:'Tên Lôi',reach:true},'soulcrypt-cellbolter':{name:'Bắn Nỏ Hồn',reach:true},'mycelium-sporehag':{name:'Đèn Bào Tử',reach:true},
    'geode-quartzduelist':{name:'Đâm Thạch Anh'},'hourglass-stormassassin':{name:'Song Dao Cát'},'coralreef-sharkhunter':{name:'Song Hàm Đao'},'moonkeep-wolfslayer':{name:'Bổ Rìu Bạc'}
  };
  // The same skills as phase-fight effects (expansion chapters run on boss-tactics.js).
  function tacticalSkill(s){
    const hit={type:'hit',power:s.power,hits:s.hits||1},effects={guard:[{type:'ward',pct:s.shield}],heal:[{type:'heal',pct:s.heal}],drain:[{type:'drain',amount:s.drain},hit],
      burn:[hit,{type:'stack',count:1}],poison:[hit,{type:'stack',count:1}],pierce:[{type:'shatter',fraction:s.pierce*.5},hit],lifesteal:[hit,{type:'heal',pct:.02}]}[s.kind]||[hit];
    return {name:s.name,kind:s.kind,move:s.move,ult:s.ult,effects};
  }
  // A phase fight has no board turn, so an elite's rotation holds its basic blow too: blow, skill, blow, skill.
  function tacticalElite(id){
    const [first,second]=ELITE_SKILLS[id].map(tacticalSkill),blow=tacticalSkill(skill(ELITE_BASIC[id].name,'strike',.8));
    return [blow,first,blow,second];
  }
  const chapterForStage=n=>CHAPTERS[Math.max(0,Math.min(CHAPTERS.length-1,Math.floor((n-1)/50)))];
  const SHOP=[
    ['exp','Sách kinh nghiệm','resource','exp','common','gold',120,'exp-book','Dùng để tăng cấp tướng.'],
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
  // Limits from the shop table (GAME_DESIGN §8): per GMT+7 day or per week (Monday).
  const LIMITS={skillBooks:['day',5],essence:['day',10],divineOre:['week',5]};
  for(const row of SHOP){if(LIMITS[row.id])row.limit={per:LIMITS[row.id][0],n:LIMITS[row.id][1]};if(row.kind==='gear')row.limit={per:'week',n:1};}
  return {BOSSES,CHAPTERS,CREATURE_NAMES,SHOP,chapterForStage,EXPANSION,MAX_STAGES:CHAPTERS.length*50,ELITE_EVERY:5,COMMON_SKILL,ELITE_SKILLS,ELITE_BASIC,tacticalSkill,tacticalElite};
});
