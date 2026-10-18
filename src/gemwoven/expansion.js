/* Nine layered screens. Skill proposals are presentation data, not combat rules. */
(() => {
  const {begin,image,text,button,panel,title,footer,add,materials}=window.GEMWOVEN_COMPONENTS;
  const layout=window.GEMWOVEN_LAYOUT;
  const heroes={
    fire:{name:'Mika',title:'Viêm Kiếm Sĩ',element:'Hỏa',color:'#ff9a39',weapon:'fire-sword',skills:[
      ['Viêm Long Trảm','Tụ lửa kéo dài lưỡi kiếm, phóng kiếm khí phát nổ. Gây 135 sát thương cơ bản.','135 → 150 sát thương'],
      ['Liệt Hỏa Kiếm Tâm','Kiếm gây thêm 60% sát thương. Ngọn lửa theo từng nhịp chém của Mika.','60% → 65% sát thương kiếm'],
      ['Hỏa Luân','Kiếm khí cuộn thành vòng lửa, để lại vùng thiêu đốt sau khi phát nổ.','Vùng thiêu đốt: 2 → 3 lượt'],
      ['Cửu Vĩ Viêm Hồn','Hợp nhất với hỏa hồ, cường hóa lưỡi kiếm và ánh lửa quanh cơ thể.','Sức mạnh hỏa hồ: +15% → +20%']
    ]},
    ice:{name:'Yuki',title:'Băng Tâm Vệ',element:'Băng',color:'#8de4ff',weapon:'ice-essence',skills:[
      ['Thiên Băng Giáng','Nhận 25 giáp; triệu hồi băng gây 60 sát thương và làm choáng mục tiêu 1 lượt.','60 → 70 sát thương băng'],
      ['Băng Tâm Hộ Thuẫn','Ngọc khiên cho 8 giáp. Yuki giảm 20% sát thương nhận vào.','20% → 24% giảm sát thương'],
      ['Tuyết Liên Kết Giới','Hoa băng nở quanh đồng đội, giữ lại một phần giáp khi kết giới tan.','Giáp giữ lại: 10 → 15'],
      ['Nguyệt Thố Băng Linh','Đánh thức linh thỏ dưới trăng; băng thương tỏa sáng và lớp giáp trở nên bền hơn.','Hiệu lực giáp: +15% → +20%']
    ]},
    earth:{name:'Nori',title:'Thiết Giáp Vệ',element:'Mộc',color:'#a5d672',weapon:'stat-shield',skills:[
      ['Mộc Linh Hộ Thể','Choáng 2 lượt; tích sát thương rồi bùng nổ ×3. Hồi 40 HP mỗi lượt trong 3 lượt.','Hồi phục: 40 → 45 HP/lượt'],
      ['Đại Khiên Tích Lực','Đánh thường còn 60% sát thương gốc. Đại khiên tích lực để phản công.','Sức mạnh đại khiên: +5%'],
      ['Căn Mạch Trói Buộc','Rễ cây lan từ mặt khiên, níu chân kẻ địch và bảo vệ vùng đất sau lưng Nori.','Thời gian trói: 1 → 2 lượt'],
      ['Cổ Thụ Thần Vệ','Linh hồn cổ thụ bao bọc giáp xanh và đại khiên, tăng khả năng bảo vệ đồng đội.','Lá chắn đồng đội: 20 → 30']
    ]},
    lightning:{name:'Lumi',title:'Lôi Cuồng Sư',element:'Lôi',color:'#dcacff',weapon:'lightning-essence',skills:[
      ['Ngũ Tinh Lôi','Gọi 5 tia sét liên tiếp từ pháp trận ngôi sao, gây tổng cộng 140 sát thương.','140 → 155 tổng sát thương'],
      ['Tinh Điện Cộng Hưởng','Tích năng lượng nhanh gấp đôi. Các vì sao quanh trượng giữ lại điện tích.','Hiệu quả tích năng lượng: +10%'],
      ['Lôi Vân Xoáy','Sét hợp thành vòng mây, lan điện giữa các mục tiêu đứng gần nhau.','Mục tiêu lan điện: 2 → 3'],
      ['Thiên Tinh Pháp Sư','Thức tỉnh pháp sư thiên tinh; mũ trăng và trượng cộng hưởng giữa cơn bão.','Sát thương thiên tinh: +15% → +20%']
    ]},
    shadow:{name:'Noct',title:'Ảnh Kiếm Sĩ',element:'Ảnh',color:'#8cdde9',weapon:'stat-attack',skills:[
      ['Ngũ Ảnh Trảm','Lướt qua mục tiêu bằng 5 nhát chém katana liên tiếp, gây tổng cộng 150 sát thương.','150 → 165 tổng sát thương'],
      ['Vô Diện Ảnh Bộ','Lướt chém tốc độ cao, không chịu khắc hệ. Bóng tối luôn che kín khuôn mặt.','Tốc độ ảnh bộ: +5% → +8%'],
      ['Tàn Ảnh Phân Thân','Để lại phân thân tại điểm lướt qua; bóng kiếm nối tiếp nhát chém cuối.','Sức mạnh tàn ảnh: 15% → 20%'],
      ['Dạ Hành Vô Tướng','Hòa vào bóng đêm, chỉ còn đôi mắt xanh và đường kiếm lóe sáng dưới mũ trùm.','Sát thương kết liễu: +15% → +20%']
    ]}
  };
  const branches=['Chủ Động','Bị Động','Biến Dị','Chân Thân'];
  const inventory=[
    ['coins','Đồng vàng','125.6K','item','Tiền vàng dùng tại cửa hàng, lò rèn và trên những chuyến hành trình.'],
    ['mana','Lam ngọc','3.480','item','Tinh thể lưu giữ ánh sáng, dùng để kết nối những người bạn mới.'],
    ['exp-book','Sách EXP','248','book','Sách ghi chép kinh nghiệm giúp tướng trưởng thành.'],
    ['skill-book','Bí kíp kỹ năng','36','book','Những ghi chép cổ giúp mài giũa các kỹ năng.'],
    ['hero-fragment','Mảnh tướng','42','fragment','Mảnh ký ức của Mika, có thể ghép thành một cuộc gặp gỡ.'],
    ['crest','Chân ấn','18','other','Ấn ký hiếm dùng để đánh thức sức mạnh tiềm ẩn.'],
    ['fire-essence','Tinh hoa Hỏa','64','material','Tinh hoa nguyên tố Hỏa, chứa sức mạnh rực cháy. Dùng để chế tạo trang bị và thức tỉnh tướng.'],
    ['potion','Bình hồi phục','120','item','Bình thuốc phục hồi mang theo trong những chuyến phiêu lưu.'],
    ['lightning-essence','Tinh hoa Lôi','96','material','Tinh thể tím chứa những dòng điện từ cơn bão.'],
    ['ice-essence','Tinh hoa Thủy','58','material','Tinh thể xanh mát, nguyên liệu của các trang bị hệ Băng.'],
    ['herbs','Thảo dược','231','material','Lá thuốc tươi từ khu vườn bên thác, dùng để pha chế.'],
    ['wood','Gỗ mềm','176','material','Những khúc gỗ nhẹ và bền, thích hợp để chế tác.'],
    ['ore','Quặng sắt','203','material','Quặng thô thu được từ các mỏ trên đảo nổi.'],
    ['cloth','Vải thô','89','material','Vải dệt thủ công dùng để may trang phục và túi.'],
    ['leather','Da thú','67','material','Da bền dùng để chế tạo giày, đai và giáp nhẹ.'],
    ['ingot','Thỏi kim loại','54','material','Kim loại đã được tinh luyện tại lò rèn.'],
    ['fire-sword','Kiếm Hỏa Ngục','1','gear','Lưỡi kiếm rực lửa của chiến binh hệ Hỏa.'],
    ['helmet','Mũ chiến binh','1','gear','Mũ giáp thép với viền vàng và dấu ấn Hỏa.'],
    ['boots','Ủng chiến binh','1','gear','Đôi ủng chắc chắn cho những hành trình dài.'],
    ['ticket','Vé triệu hồi','12','other','Tấm vé mở cánh cổng triệu hồi.']
  ];
  const categories=[['all','Tất Cả','nav-bag'],['item','Vật Phẩm','potion'],['material','Nguyên Liệu','herbs'],['gear','Trang Bị','fire-sword'],['fragment','Mảnh Tướng','hero-fragment'],['book','Sách','exp-book'],['other','Khác','chest']];

  function home(){
    begin('home');
    const sites=[
      ['summon',133,120,356,364,'Triệu Hồi',.80],['arena',544,207,319,311,'Đấu Trường',.73],
      ['shop',16,500,340,395,'Cửa Hàng',.83],['upgrade',359,493,310,373,'Nâng Cấp',.79],
      ['forge',606,700,330,408,'Rèn Đồ',.30],['tavern',19,953,378,372,'Quán Bia',.27]
    ];
    sites.forEach(([key,x,y,w,h,label,ly])=>button('place-'+key,'home-'+key,[x,y,w,h],label,'route:'+key,{size:28,tone:'ink',labelRect:[w*.27,h*ly,w*.48,38],className:'home-place',fit:'fill'}));
    [['fire',284,265,51,62],['ice',288,176,43,54],['earth',242,306,37,47],['lightning',242,232,36,46],['shadow',354,233,38,49]].forEach(([key,x,y,w,h])=>button('soul-'+key,'portrait-'+key,[x,y,w,h],heroes[key].name,'hero:'+key,{labelHidden:true,className:'home-soul'}));
    button('hero','hero-fire',[391,1065,184,285],'Mika · Kỹ năng','hero:fire',{labelHidden:true});
    button('quests','title-parchment',[716,1132,196,203],'Nhiệm Vụ','route:tavern',{icon:'icon-quest',iconRect:[58,20,85,92],labelRect:[15,120,166,42],size:29,tone:'ink',fit:'fill'});
    [['upgrade','Tướng','helmet'],['inventory','Túi Đồ','nav-bag'],['skills','Kỹ Năng','nav-skills'],['forge','Rèn Đồ','icon-forge']].forEach(([route,label,icon],i)=>button('shortcut-'+route,'side-pennant',[10,155+i*111,98,118],label,'route:'+route,{icon,iconRect:[23,27,54,59],labelHidden:true}));
    [['quest','icon-quest'],['event','icon-event'],['gift','icon-gift'],['friends','icon-friends']].forEach(([id,icon],i)=>button('right-'+id,'title-parchment',[843,158+i*112,91,108],id==='quest'?'Nhiệm Vụ':id==='gift'?'Quà Tặng':id==='event'?'Sự Kiện':'Bạn Bè',id==='quest'?'route:tavern':'preview:'+id,{icon,iconRect:[20,20,52,58],labelHidden:true}));
    footer();
  }

  function bag(category='all',selected='fire-essence',page=0){
    begin('inventory');
    title('Túi Đồ',[564,302,346,114],true);
    text('motto','Những điều nhỏ bé\nlàm nên hành trình vĩ đại.',[595,412,286,48],21,{className:'text-backing'});
    categories.forEach(([id,label,icon],i)=>button('category-'+id,id===category?'nameplate':'tab-wood',[16,484+i*87,205,85],label,'bag-category:'+id,{icon,iconRect:[17,19,45,46],labelRect:[63,14,128,56],size:25,tone:id===category?'ink':'gold',selected:id===category,fit:'fill'}));
    const list=inventory.filter(p=>category==='all'||p[3]===category);
    const pages=Math.max(1,Math.ceil(list.length/16));page=Math.min(page,pages-1);
    list.slice(page*16,page*16+16).forEach(([asset,label,count],i)=>{
      const x=241+(i%4)*165,y=490+Math.floor(i/4)*159;
      button('item-'+asset,'inventory-slot',[x,y,151,149],label,'bag-item:'+asset,{icon:asset,iconRect:[26,12,103,94],labelRect:[8,112,135,30],labelAsset:'panel-parchment',size:20,tone:'ink',selected:asset===selected,fit:'fill'});
      add('quantity-plate-'+asset,'surface',[x+79,y+87,65,28],{style:'quantity'});
      text('count-'+asset,count,[x+77,y+86,67,30],21);
    });
    if(pages>1){button('previous','nav-tile',[726,463,30,27],'‹','bag-page:-1',{size:23});text('page',`${page+1} / ${pages}`,[762,463,73,27],19);button('next','nav-tile',[842,463,30,27],'›','bag-page:1',{size:23});}
    const item=list.find(p=>p[0]===selected)||list[0];
    panel('detail-panel',[18,1130,906,351]);
    if(!item){text('empty','Chưa có vật phẩm trong mục này',[275,670,590,90],30);footer();return {page,pages,visible:[]};}
    image('detail-slot','inventory-slot',[50,1170,226,231],{fit:'fill'});
    button('detail-art',item[0],[68,1190,192,192],item[1],'item:'+item[0],{labelHidden:true});
    text('item-title-'+selected,item[1],[307,1162,401,48],35,{tone:'ink',align:'left'});
    text('item-type',categories.find(c=>c[0]===item[3])[1],[745,1171,145,34],21,{tone:'ink'});
    text('item-description-'+selected,item[4],[308,1216,564,75],24,{tone:'ink',align:'left'});
    text('source-title','Cách nhận',[307,1300,200,31],24,{tone:'ink',align:'left'});
    image('source-icon','chest',[311,1341,50,50]);
    text('source','Hành trình\nCửa hàng',[373,1332,195,62],22,{tone:'ink',align:'left'});
    if(selected==='fire-essence'){
      text('recipe-title','Chế tạo có thể nhận',[585,1299,293,31],23,{tone:'ink'});
      [['ore','12/10'],['herbs','5/5'],['fire-essence','1']].forEach(([asset,count],i)=>{
        image('recipe-slot-'+i,'inventory-slot',[589+i*100,1333,61,61],{fit:'fill'});
        image('recipe-art-'+i,asset,[598+i*100,1338,43,43]);
        text('recipe-count-'+i,count,[590+i*100,1393,60,24],18,{tone:'ink'});
      });
      text('recipe-arrow','→',[750,1345,34,35],26,{tone:'ink'});
    }else{text('held-label','Số lượng đang có',[599,1310,260,32],23,{tone:'ink'});text('held-count',item[2],[599,1347,260,39],31,{tone:'ink'});}
    button('item-action','button-gold',[666,1410,211,58],item[3]==='gear'?'Rèn Đồ':item[3]==='book'?'Kỹ Năng':item[3]==='fragment'?'Triệu Hồi':'Chế Tạo','route:'+(item[3]==='book'?'skills':item[3]==='fragment'?'summon':'forge'),{size:29,tone:'ink'});
    footer();return {page,pages,visible:list.map(p=>p[0])};
  }

  function skills(hero='fire',selected=0){
    const h=heroes[hero]||heroes.fire,skill=h.skills[selected]||h.skills[0];
    begin('skills');
    title('Kỹ Năng',[23,148,244,112],true);
    text('motto','Sức mạnh được dệt\ntừ những mảnh hồn',[44,266,200,67],24,{className:'text-backing'});
    image('path-title-board','nameplate',[535,147,359,113],{fit:'fill'});
    text('path-title','Con Đường Kỹ Năng',[560,177,309,51],32,{tone:'ink'});
    // Tab banners and all nodes own their independent raster art.
    branches.forEach((label,i)=>button('branch-'+i,'skill-banner',[517+i*100,247,100,139],label,'skill:'+i,{icon:`skill-${hero}-${i}`,iconRect:[28,14,45,45],labelRect:[5,65,90,45],size:21,selected:selected===i,className:'skill-branch'}));
    const equipment=[h.weapon,'helmet','stat-shield','crest','mana','boots'];
    equipment.forEach((asset,i)=>{
      const x=i<3?22:390,y=407+(i%3)*125;
      button('equipment-'+i,'inventory-slot',[x,y,110,116],['Vũ khí','Mũ','Giáp','Ấn','Ngọc','Ủng'][i],'item:'+asset,{icon:asset,iconRect:[18,10,77,78],labelRect:[9,89,92,22],size:18,fit:'fill'});
    });
    button('hero-model','hero-'+hero,[133,405,258,407],h.name,'hero:'+hero,{labelHidden:true,className:'hero-standing'});
    image('hero-name-board','nameplate',[126,821,283,96],{fit:'fill'});
    text('hero-name-'+hero,`Lv.32 · ${h.name}`,[147,834,241,35],29,{tone:'ink'});
    text('hero-title-'+hero,h.title,[147,872,241,28],23,{tone:'ink'});
    const positions=[[647,383],[529,510],[767,510],[647,641]];
    [[708,488,588,570],[708,488,826,570],[588,580,708,702],[826,580,708,702],[708,720,590,802],[708,720,823,802],[590,807,708,885],[823,807,708,885]].forEach(([x1,y1,x2,y2],i)=>add('link-'+i,'connector',[x1,y1,Math.hypot(x2-x1,y2-y1),4],{angle:Math.atan2(y2-y1,x2-x1)*180/Math.PI,color:h.color}));
    positions.forEach(([x,y],i)=>{
      button('node-'+i,`skill-${hero}-${i}`,[x,y,123,123],h.skills[i][0],'skill:'+i,{labelHidden:true,selected:selected===i,className:'skill-node'});
      text('node-level-'+i,['3/5','2/5','1/5','1/5'][i],[x+27,y+103,70,28],22,{className:'text-backing'});
    });
    [[540,755],[772,755],[656,838],[550,889],[773,889]].forEach(([x,y],i)=>button('locked-'+i,'skill-lock',[x,y,88,88],'Nhánh kỹ năng chưa mở','skill-locked:'+i,{labelHidden:true}));
    panel('detail-panel',[15,973,911,503]);
    image('selected-icon',`skill-${hero}-${selected}`,[52,1002,205,205]);
    text('skill-name-'+hero+'-'+selected,skill[0],[281,1006,566,47],35,{tone:'ink',align:'left'});
    text('skill-category',branches[selected],[284,1064,179,36],24,{tone:'ink',className:'skill-tag'});
    text('skill-level',['Lv.3 / 5','Lv.2 / 5','Lv.1 / 5','Lv.1 / 5'][selected],[75,1168,156,35],26,{className:'text-backing'});
    text('skill-description-'+hero+'-'+selected,skill[1],[281,1112,573,99],26,{tone:'ink',align:'left'});
    text('materials-title','Nguyên liệu tăng cấp',[74,1232,353,35],26,{tone:'ink',align:'left'});
    materials('skill-materials',[[hero==='fire'?'fire-essence':hero==='ice'?'ice-essence':hero==='earth'?'herbs':hero==='lightning'?'lightning-essence':'mana','12/8'],['skill-book','6/4'],['scroll','3/2'],['coins','125.6K / 20K']],[59,1277,409,110]);
    text('next-title','Hiệu quả cấp kế tiếp',[509,1233,337,35],27,{tone:'ink',align:'left'});
    text('next-effect-'+hero+'-'+selected,skill[2],[509,1283,337,71],26,{tone:'ink',align:'left'});
    button('upgrade-skill','button-gold',[335,1382,304,81],'Tăng Cấp','skill-upgrade',{size:35,tone:'ink'});
    footer();
    // The roster sits below the hero name; all five heroes stay available.
    Object.entries(heroes).forEach(([key,data],i)=>button('roster-'+key,'avatar-ring',[135+i*70,914,63,60],data.name,'select-hero:'+key,{icon:'portrait-'+key,iconRect:[11,8,42,43],labelHidden:true,selected:hero===key}));
  }

  home();bag();skills();
  // Add roster and a direct skills link to the original hero upgrade screen.
  const upgrade=layout.screens.upgrade;
  Object.entries(heroes).forEach(([key,h],i)=>{
    const id='upgrade.choose-'+key;window.GEMWOVEN_DEFAULT_COPY[id]=h.name;
    upgrade.nodes.push({id,kind:'button',rect:[266+i*66,711,60,66],asset:'avatar-ring',icon:'portrait-'+key,iconRect:[12,8,37,48],text:id,labelHidden:true,action:'select-hero:'+key});
  });
  window.GEMWOVEN_DEFAULT_COPY['upgrade.skills-link']='Kỹ Năng';
  upgrade.nodes.push({id:'upgrade.skills-link',kind:'button',rect:[608,723,141,48],asset:'nameplate',text:'upgrade.skills-link',action:'route:skills',size:23,tone:'ink',fit:'fill'});
  layout.order=['home','inventory','skills','summon','arena','shop','forge','upgrade','tavern'];
  window.GEMWOVEN_HEROES=heroes;
  window.GEMWOVEN_INVENTORY=inventory;
  window.GEMWOVEN_REBUILD=state=>{
    if(state.screen==='skills')skills(state.hero,state.skill);
    if(state.screen==='inventory'){
      const result=bag(state.category,state.bagItem,state.bagPage);
      state.bagPage=result.page;state.bagPages=result.pages;
    }
  };
})();
