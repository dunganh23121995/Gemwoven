/* Coordinates use the 941 x 1672 concept canvas. Every hit target owns its art. */
(() => {
  const W=941,H=1672, screens={}, copy={};
  const names={home:'Trang Chủ',inventory:'Túi Đồ',skills:'Kỹ Năng',arena:'Đấu Trường',summon:'Triệu Hồi',shop:'Cửa Hàng',forge:'Rèn Đồ',upgrade:'Tướng',tavern:'Quán Bia'};
  const nav=[['home','Trang Chủ','nav-home'],['upgrade','Tướng','nav-heroes'],['inventory','Túi Đồ','nav-bag'],['skills','Kỹ Năng','nav-skills'],['summon','Triệu Hồi','nav-summon'],['arena','Đấu Trường','nav-arena'],['more','Thêm','nav-more']];
  let active;
  function add(id,kind,rect,options={}) { const n={id:`${active}.${id}`,kind,rect,...options};screens[active].nodes.push(n);return n; }
  function image(id,asset,rect,options={}) { return add(id,'image',rect,{asset,...options}); }
  function text(id,value,rect,size=28,options={}) { const key=`${active}.${id}`;copy[key]=value;return add(id,'text',rect,{text:key,size,...options}); }
  function button(id,asset,rect,label,action,options={}) {
    const key=`${active}.${id}`;copy[key]=label;
    const fit=['title-wood','title-parchment','tab-wood','button-gold','button-blue','card-dark','nav-tile','side-pennant','panel-parchment'].includes(asset)?'fill':'contain';
    return add(id,'button',rect,{asset,text:key,action,size:options.size||28,fit,...options});
  }
  function panel(id,rect,dark=false){image(id,dark?'card-dark':'panel-parchment',rect,{fit:'fill'});}
  function title(label,rect,light=false,icon){
    image('title-board',light?'nameplate':'title-wood',rect,{fit:'fill'});
    text('title',label,[rect[0]+20,rect[1]+rect[3]*(light?.24:.42),rect[2]-40,rect[3]*(light?.5:.4)],49,{tone:light?'ink':'gold'});
    if(icon)image('title-icon',icon,[rect[0]+rect[2]*.39,rect[1]-22,rect[2]*.22,rect[3]*.5]);
  }
  function header(){
    button('profile','avatar-ring',[25,8,128,128],'Hồ sơ tướng','route:upgrade',{icon:'portrait-fire',iconRect:[22,13,88,100],labelHidden:true});
    add('level-plate','surface',[155,45,187,39],{style:'currency'});
    add('level-meter','bar',[198,53,130,23],{value:.64});
    add('level-badge','surface',[154,25,53,59],{style:'currency'});
    text('level','32',[157,32,47,44],30);
    add('gold-plate','surface',[368,36,174,48],{style:'currency'});
    image('gold-icon','coins',[355,26,59,60]);text('gold','125.6K',[412,38,104,40],25);
    button('gold-plus','hud-plus',[511,35,39,43],'+','route:shop',{size:30});
    add('gem-plate','surface',[591,36,178,48],{style:'currency'});
    image('gem-icon','mana',[577,22,54,70]);text('gems','3,480',[625,38,99,40],25);
    button('gems-plus','hud-plus',[729,35,39,43],'+','route:shop',{size:30});
    button('mail','icon-mail',[795,30,62,61],'Hòm thư','preview:mail',{labelHidden:true});
    button('settings','icon-settings',[868,30,59,59],'Cài đặt','preview:settings',{labelHidden:true});
  }
  function footer(){
    image('footer-board','footer-wood',[0,1490,941,182],{fit:'fill'});
    nav.forEach(([route,label,icon],i)=>{
      const selected=route===active;
      button(`nav-${route}`,icon,[21+i*130,1510,119,126],label,`route:${route}`,{labelHidden:true,selected,role:'nav',className:'bottom-nav'});
      if(selected){image('nav-label-board','nameplate',[10+i*130,1607,143,53],{fit:'fill'});text('nav-active-label',label,[20+i*130,1614,123,34],23,{tone:'ink'});}
    });
  }
  function sides(left=true,right=true){
    const a=left?[['event','Sự Kiện','icon-event'],['gift','Phúc Lợi','icon-gift'],['book','Thẻ Tháng','icon-book'],['chat','Cộng Đồng','icon-chat']]:[];
    const b=right?[['quest','Nhiệm Vụ','icon-quest'],['mail','Hòm Thư','icon-mail'],['trophy','Thành Tựu','icon-trophy'],['crown','BXH','icon-crown']]:[];
    [a,b].forEach((list,col)=>list.forEach(([id,label,icon],i)=>button(`side-${id}`,'side-pennant',[col?840:10,145+i*125,95,137],label,id==='quest'?'route:tavern':`preview:${id}`,{icon,iconRect:[25,35,48,48],labelRect:[5,89,85,29],size:20,fit:'fill'})));
  }
  function materials(id,items,rect){
    const [x,y,w,h]=rect;const cw=w/items.length;
    items.forEach(([asset,label],i)=>button(`${id}-${i}`,'card-dark',[x+i*cw+5,y,cw-10,h],label,`item:${asset}`,{icon:asset,iconRect:[cw*.18,15,cw*.59,h*.62],labelRect:[5,h*.75,cw-20,h*.19],size:24,fit:'fill'}));
  }
  function begin(key,number){active=key;screens[key]={key,name:names[key],background:`assets/gemwoven/backgrounds/${key}.webp`,nodes:[]};header();}

  begin('arena',1);
  sides();
  image('crest','icon-arena',[357,172,224,210]);
  image('arena-sign','title-wood',[335,335,280,117],{fit:'fill'});
  text('title','Đấu Trường',[349,375,252,57],36);
  button('fighter-fire','hero-fire',[124,559,289,215],'Mika','route:upgrade',{labelHidden:true});
  button('fighter-ice','hero-ice',[535,559,280,215],'Yuki','route:upgrade',{labelHidden:true});
  text('versus','VS',[406,635,124,114],91,{className:'versus'});
  button('rank-two','rank-silver',[289,852,130,121],'2','preview:ranking',{size:43,labelRect:[25,34,80,54]});
  button('rank-one','rank-gold',[405,790,142,173],'1','preview:ranking',{size:53,labelRect:[25,60,92,65]});
  button('rank-three','rank-bronze',[550,855,130,121],'3','preview:ranking',{size:43,labelRect:[25,34,80,54]});
  button('ranking','title-wood',[354,946,239,98],'Xếp Hạng','preview:ranking',{size:32,labelRect:[20,32,199,45],fit:'fill'});
  button('mode-solo','flag-blue',[265,1031,174,193],'1v1','mode:solo',{icon:'icon-arena',iconRect:[48,28,82,79],labelRect:[32,113,110,43],size:39,group:'arena-mode',selected:true});
  button('mode-team','flag-red',[529,1031,174,193],'3v3','mode:team',{icon:'icon-friends',iconRect:[45,28,84,78],labelRect:[32,113,110,43],size:39,group:'arena-mode'});
  button('rewards','panel-parchment',[757,992,163,279],'Phần thưởng','preview:rewards',{icon:'chest',iconRect:[33,32,95,94],labelRect:[16,203,132,42],size:24,tone:'ink',fit:'fill'});
  image('reward-coins','coins',[774,1130,65,65]);image('reward-gem','mana',[842,1130,48,65]);
  button('battle','button-gold',[322,1203,303,134],'Chiến Đấu','battle',{size:40});
  footer();

  begin('summon',2);sides();
  // The portal's blank decorative wood remains scenery; title is editable DOM.
  text('title','Triệu Hồi',[320,200,308,73],52);
  image('subtitle-board','tab-wood',[341,285,270,66],{fit:'fill'});
  text('subtitle','Gặp gỡ những người bạn mới\ntrên hành trình diệu ngọc',[359,295,236,46],18);
  image('story-flag','flag-gold',[735,135,101,300],{fit:'fill'});
  text('story','Ngọc\nKết Nối\nNhững\nTâm Hồn',[748,184,75,176],23,{tone:'ink'});
  const gems=[['fire',391,379,163,217],['ice',224,498,162,208],['earth',578,493,162,208],['lightning',228,697,170,214],['shadow',573,697,170,214]];
  gems.forEach(([hero,x,y,w,h])=>button(`portrait-${hero}`,'summon-crystal',[x,y,w,h],hero==='fire'?'Mika':hero==='ice'?'Yuki':hero==='earth'?'Nori':hero==='lightning'?'Lumi':'Noct',`hero:${hero}`,{icon:`portrait-${hero}`,iconRect:[w*.16,h*.21,w*.68,h*.59],labelHidden:true,className:`portrait-gem element-${hero}`}));
  button('central-crystal','summon-crystal',[365,579,211,326],'Ngọc triệu hồi','summon:one',{labelHidden:true});
  image('guide','hero-guide',[100,784,214,251]);
  button('fragments','title-parchment',[756,919,163,95],'Mảnh Tướng','item:hero-fragment',{size:23,labelRect:[15,30,133,40],fit:'fill'});
  button('summon-one','button-blue',[191,991,273,130],'Triệu Hồi ×1','summon:one',{size:35,labelRect:[25,29,223,46]});
  text('one-cost','1 vé',[249,1063,155,35],26);
  button('summon-ten','button-gold',[484,991,273,130],'Triệu Hồi ×10','summon:ten',{size:33,labelRect:[25,29,223,46]});
  text('ten-cost','10 vé',[542,1063,155,35],26,{tone:'ink'});
  text('guarantee','Đảm bảo nhận tướng ★4+',[511,1120,246,33],23,{className:'text-backing'});
  panel('featured-board',[45,1160,853,189],true);
  text('featured-title','Tướng Nổi Bật',[69,1177,270,32],25,{align:'left'});
  ['fire','ice','earth','lightning','shadow'].forEach((hero,i)=>button(`featured-${hero}`,`gem-${hero}`,[71+i*94,1217,88,104],['Mika','Yuki','Nori','Lumi','Noct'][i],`hero:${hero}`,{labelHidden:true}));
  text('featured-note','Những số phận\nđang chờ được gặp gỡ…',[562,1229,270,73],25,{className:'italic'});
  panel('pity-board',[51,1348,626,102],true);
  image('pity-ticket','ticket',[73,1365,80,65]);
  text('pity-label','Triệu hồi thêm 70 lần để nhận tướng ★5',[163,1365,469,30],24);
  add('pity-meter','bar',[163,1410,462,18],{value:.3,gold:true});text('pity-value','30 / 100',[290,1401,180,35],22);
  button('summon-details','tab-wood',[701,1370,198,67],'Xem Chi Tiết','preview:summon',{size:26});
  footer();

  begin('shop',3);sides();
  title('Cửa Hàng',[320,258,404,176],true);
  image('shop-story-flag','flag-gold',[131,155,112,310],{fit:'fill'});
  text('shop-story','Vạn Vật\nNgọc Kết\nSức Mạnh\nĐồng Hành\nCùng Bạn!',[145,187,84,218],23,{tone:'ink'});
  add('speech-bubble','surface',[487,589,163,76],{style:'speech'});
  text('shopkeeper-line','Có thứ gì\ncần không nè?',[500,598,135,58],22,{tone:'ink'});
  ['Vật Phẩm','Nguyên Liệu','Trang Bị'].forEach((label,i)=>button(`shop-tab-${i}`,'tab-wood',[120+i*247,768,239,67],label,`shop-tab:${i}`,{size:28,selected:i===0,group:'shop-tab'}));
  const products=[['coins','Đồng Vàng','100'],['mana','Đá Ngọc','300'],['fire-essence','Tinh Hoa Hỏa','1,200'],['amber','Đá Nâng Cấp','800'],['scroll','Sách Kỹ Năng','2,000'],['hero-fragment','Mảnh Tướng','1,500'],['ticket','Vé Triệu Hồi','2,500'],['chest','Rương Hiếm','3,000'],['hammer','Búa Rèn','1,800'],['potion','Thuốc Đột Phá','1,000']];
  screens.shop.products=products;
  products.forEach(([asset,label,price],i)=>{
    let x=121+(i%5)*141,y=847+Math.floor(i/5)*159;
    button(`product-${asset}`,'card-dark',[x,y,135,143],label,`product:${asset}`,{icon:asset,iconRect:[25,5,85,83],labelRect:[4,91,127,24],size:20,fit:'fill',selected:i===2,group:'products'});
    text(`price-${asset}`,`● ${price}`,[x+5,y+117,125,24],19);
  });
  panel('description-board',[66,1215,290,220]);
  text('product-name','Tinh Hoa Hỏa',[91,1236,236,41],29,{tone:'ink'});
  text('product-description','Nguyên liệu quý hiếm,\nchứa sức mạnh của\nngọn lửa vĩnh hằng.\nDùng để nâng cấp kỹ năng\nvà đột phá tướng hệ Hỏa.',[91,1283,234,125],23,{tone:'ink',align:'left'});
  button('product-preview','fire-essence',[366,1153,232,276],'Xem vật phẩm','selected-product',{labelHidden:true});
  panel('purchase-board',[625,1230,245,202]);
  button('quantity-minus','nav-tile',[658,1251,44,43],'−','quantity:-1',{size:31});
  text('quantity','1',[711,1256,67,37],27,{tone:'ink'});
  button('quantity-plus','nav-tile',[797,1251,44,43],'+','quantity:1',{size:31});
  text('purchase-price','● 1,200',[661,1302,182,42],30,{tone:'ink'});
  button('buy','button-gold',[650,1351,199,67],'Mua','selected-product',{size:32});
  footer();

  begin('forge',4);sides(true,false);
  title('Rèn Đồ',[279,135,319,200],true,'icon-forge');
  image('forge-subtitle-board','tab-wood',[329,335,217,69],{fit:'fill'});
  text('forge-subtitle','Vũ khí tốt\nĐồng hành vạn dặm',[345,345,184,45],21);
  text('forge-story','Rèn\nlà một dạng\nkể chuyện',[834,265,80,110],24);
  button('floating-sword','fire-sword',[328,457,261,278],'Kiếm Hỏa Ngục','item:fire-sword',{labelHidden:true});
  ['Chế Tạo','Cường Hóa','Khảm Ngọc'].forEach((label,i)=>button(`forge-tab-${i}`,'tab-wood',[73+i*271,867,267,83],label,`forge-tab:${i}`,{size:29,selected:i===1,group:'forge-tab',icon:['icon-forge','hammer','mana'][i],iconRect:[24,22,43,41],labelRect:[78,20,164,47]}));
  panel('forge-panel',[63,947,820,491]);
  button('weapon-card','card-dark',[124,988,255,379],'Kiếm Hỏa Ngục','item:fire-sword',{icon:'fire-sword',iconRect:[25,12,205,266],labelRect:[10,283,235,43],size:25,fit:'fill'});
  text('weapon-stars','★★★★☆',[143,1316,215,38],36,{tone:'gold'});
  text('forge-level','+8  →  +9',[473,1012,329,47],39,{tone:'ink'});
  image('attack-strip','tab-wood',[409,1065,405,58],{fit:'fill'});
  text('attack-preview','⚔  Tấn Công   128 → 142',[427,1075,367,38],27);
  text('materials-title','Nguyên Liệu Cần Thiết',[416,1128,396,38],27,{tone:'ink'});
  materials('forge-materials',[['mana','12/8'],['ingot','8/5'],['coins','125.6K / 2K']],[411,1166,394,125]);
  text('success-rate','Tỷ lệ thành công: 100%',[424,1297,373,37],24,{tone:'green'});
  button('forge-action','button-gold',[445,1335,322,91],'CƯỜNG HÓA','forge-preview',{size:35});
  footer();

  begin('upgrade',5);
  title('Nâng Cấp',[246,104,449,166]);
  image('left-story-flag','flag-blue',[16,159,173,330],{fit:'fill'});
  text('upgrade-story','Mạnh hơn\nHơn nữa\nCùng nhau\nviết tiếp\nchuyến phiêu lưu!',[40,218,126,192],24);
  image('right-story-flag','flag-blue',[819,141,112,255],{fit:'fill'});
  text('potential','Tiềm năng\nvẫn còn\nrất nhiều…',[835,192,81,132],23);
  ['Level','Tăng Sao','Tiến Hóa'].forEach((label,i)=>button(`upgrade-tab-${i}`,'tab-wood',[245+i*151,278,148,62],label,`upgrade-tab:${i}`,{size:25,selected:i===0,group:'upgrade-tab'}));
  button('hero-model','hero-fire',[292,351,330,366],'Mika','hero:fire',{labelHidden:true});
  panel('evolution-panel',[767,395,166,508],true);
  button('evolution-now','gem-fire',[793,416,116,129],'Mika hiện tại','hero:fire',{labelHidden:true});
  text('hero-stars','★★★☆☆',[788,545,125,32],28,{tone:'gold'});
  button('evolution-next','gem-fire',[802,590,98,118],'Tiến Hóa','upgrade-tab:2',{labelHidden:true,className:'silhouette'});
  text('evolution-label','Tiến Hóa',[780,708,143,31],23);
  button('evolution-locked','gem-fire',[802,753,98,108],'Chân Thân','preview:evolution',{labelHidden:true,className:'silhouette'});
  text('locked-label','Chân Thân',[780,860,143,31],23);
  [['stat-heart','Máu','1,240 → 1,285'],['stat-attack','Công','182 → 190'],['stat-shield','Thủ','96 → 101']].forEach(([asset,label,value],i)=>{
    let x=214+i*185;panel(`stat-${i}`,[x,779,176,174],true);image(`stat-icon-${i}`,asset,[x+57,769,64,68]);
    text(`stat-label-${i}`,label,[x+15,853,146,39],29);text(`stat-value-${i}`,value,[x+8,898,160,35],24,{tone:'green'});
  });
  image('level-strip','tab-wood',[306,956,334,58],{fit:'fill'});text('level-preview','Lv.32  ➜  Lv.33',[325,966,296,38],32);
  image('exp-crystal','mana',[228,1016,61,68]);text('exp-label','EXP',[233,1035,61,39],27);
  add('exp-meter','bar',[288,1027,411,29],{value:.625});text('exp-value','1,250 / 2,000',[338,1066,284,28],22,{className:'text-backing'});
  panel('upgrade-material-panel',[235,1096,487,213]);
  text('upgrade-material-title','Nguyên liệu cần',[273,1127,409,29],26,{tone:'ink'});
  materials('upgrade-materials',[['icon-book','12/5'],['emerald','26/10'],['coins','125.6K / 1K']],[274,1155,409,130]);
  button('upgrade-action','button-gold',[301,1320,346,105],'Tăng Level','upgrade-preview',{size:39});
  footer();

  begin('tavern',6);
  title('Quán Bia',[27,139,332,237],false,'icon-tavern');
  image('tavern-subtitle-board','tab-wood',[55,375,268,83],{fit:'fill'});
  text('tavern-subtitle','Bạn tốt\nNhững hành trình vĩ đại hơn!',[74,390,229,51],22);
  [['Tin Đồn','icon-event','flag-gold'],['Nhiệm Vụ','icon-quest','flag-gold'],['Tình Thân','stat-heart','flag-red'],['Chiêu Mộ','hero-fragment','flag-blue']].forEach(([label,icon,flag],i)=>button(`tavern-tab-${i}`,flag,[479+i*109,214,108,297],label,`tavern-tab:${i}`,{icon,iconRect:[21,79,66,84],labelRect:[5,188,98,44],size:25,fit:'fill',selected:i===0,group:'tavern-tab'}));
  image('left-chalkboard','card-dark',[-8,640,157,249],{fit:'fill'});
  text('tavern-menu','Hôm nay có:\n• Bia Ngọc\n• Thịt Nướng\n• Kể Chuyện\n• Kết Bạn\n• Và nhiều hơn thế!',[13,665,118,186],23,{align:'left'});
  image('right-chalkboard','card-dark',[799,560,137,198],{fit:'fill'});
  text('friendship-note','Những người\nbạn tốt\nSẽ cùng ta\nđi xa hơn',[817,589,100,136],22);
  panel('quest-panel',[23,1151,895,280]);
  image('quest-heading-board','tab-wood',[109,1139,205,65],{fit:'fill'});text('quest-heading','Tin Đồn',[142,1150,144,42],32);
  button('quest-art','quest-scene',[62,1220,204,170],'Người lữ hành bí ẩn','quest-preview',{labelHidden:true});
  text('quest-name','Người lữ hành bí ẩn',[286,1206,540,42],30,{tone:'ink',align:'left'});
  text('quest-description','Nghe nói có một thương nhân kỳ lạ xuất hiện ở rìa rừng…',[286,1252,568,35],23,{tone:'ink',align:'left'});
  text('reward-heading','Thưởng:',[286,1285,170,30],24,{tone:'ink',align:'left'});
  materials('quest-rewards',[['coins','1,500'],['mana','50'],['avatar-fire','3']],[288,1320,305,84]);
  button('quest-accept','button-gold',[647,1309,231,88],'Nhận Nhiệm Vụ','quest-preview',{size:29});
  button('quest-dismiss','nav-tile',[859,1171,41,42],'×','quest-dismiss',{size:31});
  footer();

  window.GEMWOVEN_LAYOUT={width:W,height:H,screens,names};
  window.GEMWOVEN_DEFAULT_COPY=copy;
  window.GEMWOVEN_COMPONENTS={begin,image,text,button,panel,title,header,footer,add,materials};
})();
