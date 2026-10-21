/* Nine layered screens. Skill copy below is the rank-1 default; art-screens.js
 * replaces it at runtime with text generated from progression.js skill kits. */
(() => {
  const {begin,image,text,button,panel,title,footer,add,materials}=window.GEMWOVEN_COMPONENTS;
  const layout=window.GEMWOVEN_LAYOUT;
  const heroes={
    fire:{name:'Mika',title:'Viêm Kiếm Sĩ',element:'Hỏa',color:'#ff9a39',weapon:'fire-sword',skills:[
      ['Viêm Long Trảm','Kiếm khí rực lửa phát nổ, gây 135 sát thương cơ bản.','Sát thương 135'],
      ['Liệt Hỏa Kiếm Tâm','Ngọc kiếm gây thêm 60% sát thương. Công +2,5%.','Công +2,5%'],
      ['Hỏa Luân','Sau tuyệt kỹ, thiêu đốt địch 2 lượt, mỗi lượt 8,8 sát thương cơ bản.','Thiêu đốt 8,8/lượt · Thời gian 2 lượt'],
      ['Cửu Vĩ Viêm Hồn','Thức tỉnh chân thân: Công +13%, HP +10% toàn trận.','Công +13% · HP +10%']
    ]},
    ice:{name:'Yuki',title:'Băng Tâm Vệ',element:'Băng',color:'#8de4ff',weapon:'ice-essence',skills:[
      ['Thiên Băng Giáng','Nhận 25 giáp; băng giáng gây 60 sát thương cơ bản và choáng 1 lượt.','Sát thương 60 · Giáp 25'],
      ['Băng Tâm Hộ Thuẫn','Giảm 20% sát thương nhận vào; ngọc khiên cho 8 giáp. Phòng thủ +0,8%.','Phòng thủ +0,8%'],
      ['Tuyết Liên Kết Giới','Sau tuyệt kỹ, nhận thêm giáp bằng 6% HP tối đa.','Giáp 6% HP'],
      ['Nguyệt Thố Băng Linh','Thức tỉnh chân thân: Công +13%, HP +10% toàn trận.','Công +13% · HP +10%']
    ]},
    earth:{name:'Nori',title:'Thiết Giáp Vệ',element:'Mộc',color:'#a5d672',weapon:'stat-shield',skills:[
      ['Mộc Linh Hộ Thể','Choáng 2 lượt; sát thương tích trong lúc choáng nổ ×3. Hồi 40 HP/lượt trong 3 lượt.','Hồi 40 HP/lượt · Bộc phá ×3'],
      ['Đại Khiên Tích Lực','Đánh thường còn 75% sát thương; đổi lại HP rất cao. HP +1,5%.','HP +1,5%'],
      ['Căn Mạch Trói Buộc','Rễ cây hóa giáp: sau tuyệt kỹ nhận giáp bằng 4% HP tối đa.','Giáp 4% HP'],
      ['Cổ Thụ Thần Vệ','Thức tỉnh chân thân: Công +13%, HP +10% toàn trận.','Công +13% · HP +10%']
    ]},
    lightning:{name:'Lumi',title:'Lôi Cuồng Sư',element:'Lôi',color:'#dcacff',weapon:'lightning-essence',skills:[
      ['Ngũ Tinh Lôi','Gọi 5 tia sét liên tiếp, tổng 140 sát thương cơ bản.','Sát thương 140'],
      ['Tinh Điện Cộng Hưởng','Năng lượng từ ngọc ×2,05.','Năng lượng ×2,05'],
      ['Lôi Vân Xoáy','Sau tuyệt kỹ, hút 21 năng lượng của địch và hồi 5 năng lượng.','Hút 21 năng lượng'],
      ['Thiên Tinh Pháp Sư','Thức tỉnh chân thân: Công +13%, HP +10% toàn trận.','Công +13% · HP +10%']
    ]},
    shadow:{name:'Noct',title:'Ảnh Kiếm Sĩ',element:'Ảnh',color:'#8cdde9',weapon:'stat-attack',skills:[
      ['Ngũ Ảnh Trảm','5 lần lướt chém, tổng 150 sát thương cơ bản.','Sát thương 150'],
      ['Vô Diện Ảnh Bộ','Không bị khắc hệ. Công +1,2%.','Công +1,2%'],
      ['Tàn Ảnh Phân Thân','Sau tuyệt kỹ, tàn ảnh chém thêm 15 sát thương cơ bản.','Tàn ảnh 15 sát thương'],
      ['Dạ Hành Vô Tướng','Thức tỉnh chân thân: Công +13%, HP +10% toàn trận.','Công +13% · HP +10%']
    ]}
  };
  const branches=['Chủ Động','Bị Động','Biến Dị','Chân Thân'];
  const inventory=[
    ['coins','Đồng vàng','125,6 N','item','Tiền vàng dùng tại cửa hàng, lò rèn và trên những chuyến hành trình.'],
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
    categories.forEach(([id,label,icon],i)=>button('category-'+id,id===category?'nameplate':'tab-wood',[16,484+i*87,205,85],label,'bag-category:'+id,{icon,iconRect:[17,19,45,46],labelRect:[63,14,128,56],size:25,tone:id===category?'ink':'gold',selected:id===category,fit:'fill'}));
    const list=inventory.filter(p=>category==='all'||p[3]===category);
    const pages=Math.max(1,Math.ceil(list.length/16));page=Math.min(page,pages-1);
    // The pager takes the motto's place under the title when a category spans pages.
    if(pages<2)text('motto','Những điều nhỏ bé\nlàm nên hành trình vĩ đại.',[586,414,304,70],26,{className:'text-backing'});
    const compact=n=>/^\d{1,3}(\.\d{3})+$|^\d+$/.test(n)&&window.GemwovenProgression?window.GemwovenProgression.compact(Number(n.replace(/\./g,''))):n;
    list.slice(page*16,page*16+16).forEach(([asset,label,count],i)=>{
      const x=241+(i%4)*165,y=490+Math.floor(i/4)*159;
      button('item-'+asset,'inventory-slot',[x,y,151,149],label,'bag-item:'+asset,{icon:asset,iconRect:[26,12,103,94],labelRect:[8,112,135,30],labelAsset:'panel-parchment',size:20,tone:'ink',selected:asset===selected,fit:'fill'});
      add('quantity-plate-'+asset,'surface',[x+60,y+100,86,40],{style:'quantity'});
      text('count-'+asset,compact(count),[x+60,y+100,86,40],30);
    });
    if(pages>1){button('previous','nav-tile',[618,420,64,56],'‹','bag-page:-1',{size:40});text('page',`${page+1} / ${pages}`,[690,420,96,56],31,{className:'text-backing'});button('next','nav-tile',[794,420,64,56],'›','bag-page:1',{size:40});}
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
    // Two-line banner labels stay readable on a phone (31 stage px ~ 13 CSS px).
    branches.forEach((label,i)=>button('branch-'+i,'skill-banner',[517+i*100,247,100,139],label.replace(' ','\n'),'skill:'+i,{icon:`skill-${hero}-${i}`,iconRect:[32,6,36,36],labelRect:[0,42,100,70],size:29,selected:selected===i,className:'skill-branch'}));
    const equipment=[h.weapon,'helmet','stat-shield','crest','mana','boots'];
    equipment.forEach((asset,i)=>{
      const x=i<3?22:390,y=407+(i%3)*125;
      button('equipment-'+i,'inventory-slot',[x,y,110,116],['Vũ khí','Mũ','Giáp','Ấn','Ngọc','Ủng'][i],'item:'+asset,{icon:asset,iconRect:[23,8,64,64],labelRect:[0,74,110,38],size:29,fit:'fill',className:'gear-slot-label'});
    });
    button('hero-model','hero-'+hero,[133,405,258,407],h.name,'hero:'+hero,{labelHidden:true,className:'hero-standing'});
    image('hero-name-board','nameplate',[108,800,319,108],{fit:'fill'});
    text('hero-name-'+hero,`Lv.32 · ${h.name}`,[140,827,255,34],28,{tone:'ink'});
    text('hero-title-'+hero,h.title,[140,861,255,30],25,{tone:'ink'});
    const positions=[[647,383],[529,510],[767,510],[647,641]];
    [[708,488,588,570],[708,488,826,570],[588,580,708,702],[826,580,708,702],[708,720,584,800],[708,720,832,800],[584,800,708,848],[832,800,708,848]].forEach(([x1,y1,x2,y2],i)=>add('link-'+i,'connector',[x1,y1,Math.hypot(x2-x1,y2-y1),4],{angle:Math.atan2(y2-y1,x2-x1)*180/Math.PI,color:h.color}));
    positions.forEach(([x,y],i)=>{
      button('node-'+i,`skill-${hero}-${i}`,[x,y,123,123],h.skills[i][0],'skill:'+i,{labelHidden:true,selected:selected===i,className:'skill-node'});
      text('node-level-'+i,['3/5','2/5','1/5','1/5'][i],[x+19,y+100,86,34],29,{className:'text-backing'});
    });
    // Future branches: a V under the last node plus one lock beside it on each side.
    [[536,752],[784,752],[660,800],[536,650],[784,650]].forEach(([x,y],i)=>button('locked-'+i,'skill-lock',[x,y,97,97],'Nhánh kỹ năng mở rộng · Sắp ra mắt','skill-locked:'+i,{labelHidden:true}));
    panel('detail-panel',[15,1004,911,484]);
    image('selected-icon',`skill-${hero}-${selected}`,[56,1030,184,184]);
    text('skill-name-'+hero+'-'+selected,skill[0],[268,1030,586,47],35,{tone:'ink',align:'left'});
    text('skill-category',branches[selected],[270,1082,190,38],28,{tone:'ink',className:'skill-tag'});
    text('skill-level',['Lv.3 / 5','Lv.2 / 5','Lv.1 / 5','Lv.1 / 5'][selected],[64,1180,168,38],29,{className:'text-backing'});
    text('skill-description-'+hero+'-'+selected,skill[1],[268,1126,590,96],29,{tone:'ink',align:'left'});
    text('materials-title','Nguyên liệu tăng cấp',[62,1234,400,38],29,{tone:'ink',align:'left'});
    materials('skill-materials',[[hero==='fire'?'fire-essence':hero==='ice'?'ice-essence':hero==='earth'?'herbs':hero==='lightning'?'lightning-essence':'mana','12/8'],['skill-book','6/4'],['scroll','3/2'],['coins','125,6 N / 20 N']],[59,1277,409,110]);
    text('next-title','Hiệu quả cấp kế tiếp',[500,1234,370,38],29,{tone:'ink',align:'left'});
    text('next-effect-'+hero+'-'+selected,skill[2],[500,1278,370,100],29,{tone:'ink',align:'left'});
    button('upgrade-skill','button-gold',[318,1386,304,90],'Tăng Cấp','skill-upgrade',{size:35,tone:'ink'});
    footer();
    // The roster sits below the hero name; all five heroes stay available.
    Object.entries(heroes).forEach(([key,data],i)=>button('roster-'+key,'avatar-ring',[14+i*106,903,100,100],data.name,'select-hero:'+key,{icon:'portrait-'+key,iconRect:[17,13,66,68],labelHidden:true,selected:hero===key}));
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
