(() => {
  'use strict';
  const layout=window.GEMWOVEN_LAYOUT,assets=window.GEMWOVEN_ASSETS;
  const copy={...window.GEMWOVEN_DEFAULT_COPY,...window.GEMWOVEN_COPY};
  const state={screen:'arena',mode:'solo',product:'fire-essence',quantity:1,groups:{},questHidden:false};
  const $=id=>document.getElementById(id),scene=$('scene'),stage=$('stage'),dialog=$('preview-dialog');
  const iconFor={arena:'icon-arena',summon:'icon-summon',shop:'icon-shop',forge:'icon-forge',upgrade:'icon-hero',tavern:'icon-tavern'};
  const heroNames={fire:'Mika',ice:'Yuki',earth:'Nori',lightning:'Lumi',shadow:'Noct'};
  const itemNames={'fire-essence':'Tinh Hoa Hỏa',coins:'Đồng Vàng',mana:'Đá Ngọc',amber:'Đá Nâng Cấp',scroll:'Sách Kỹ Năng','hero-fragment':'Mảnh Tướng',ticket:'Vé Triệu Hồi',chest:'Rương Hiếm',hammer:'Búa Rèn',potion:'Thuốc Đột Phá',ingot:'Thỏi Sắt',emerald:'Tinh Thạch Mộc','fire-sword':'Kiếm Hỏa Ngục','icon-book':'Sách Kinh Nghiệm','avatar-fire':'Mảnh Tướng Mika'};
  function art(key){const img=document.createElement('img');img.src=assets[key].file;img.alt='';img.draggable=false;return img;}
  function box(el,r){['left','top','width','height'].forEach((p,i)=>el.style[p]=`${r[i]}px`);}
  function setText(el,key,value){el.dataset.copy=key;el.textContent=value??copy[key]??'';}
  function decorateText(el,node){el.style.fontSize=`${node.size||28}px`;if(node.tone)el.classList.add(`tone-${node.tone}`);if(node.align)el.classList.add(`align-${node.align}`);}
  function makeNode(node){
    let el;
    if(node.kind==='image')el=art(node.asset);
    else if(node.kind==='button'){
      el=document.createElement('button');el.type='button';el.dataset.action=node.action;
      el.setAttribute('aria-label',copy[node.text]);
      const bg=art(node.asset);bg.className='art';bg.style.objectFit=node.fit||'contain';el.append(bg);
      if(node.icon){const icon=art(node.icon);icon.className='icon';box(icon,node.iconRect);el.append(icon);}
      if(!node.labelHidden){const label=document.createElement('span');label.className='copy-layer';setText(label,node.text);decorateText(label,node);if(node.labelRect)box(label,node.labelRect);el.append(label);}
      const selected=node.group?(state.groups[node.group]?state.groups[node.group]===node.id:node.selected):node.selected;
      if(selected)el.classList.add('selected');
      if(node.group){el.dataset.group=node.group;el.setAttribute('aria-pressed',String(!!selected));}
      if(node.role==='nav'&&node.selected)el.setAttribute('aria-current','page');
      el.title=copy[node.text];
    } else {
      el=document.createElement(node.kind==='text'?'span':'div');
      if(node.kind==='text'){setText(el,node.text);decorateText(el,node);}
      if(node.kind==='bar'){const fill=document.createElement('i');fill.style.width=`${node.value*100}%`;el.append(fill);if(node.gold)el.classList.add('gold');}
      if(node.style)el.classList.add(node.style);
    }
    el.classList.add('node',`node-${node.kind}`);if(node.className)el.classList.add(...node.className.split(' '));
    el.dataset.node=node.id;if(node.asset)el.dataset.asset=node.asset;
    box(el,node.rect);if(node.kind==='image')el.style.objectFit=node.fit||'contain';return el;
  }
  function fit(){
    const mobile=innerWidth<=700;
    const availableWidth=mobile?innerWidth:innerWidth-300;
    const availableHeight=mobile?Math.max(500,innerHeight-92):innerHeight-24;
    const scale=Math.max(.18,Math.min(availableWidth/941,availableHeight/1672,1));
    stage.style.transform=`scale(${scale})`;$('viewport').style.width=`${941*scale}px`;$('viewport').style.height=`${1672*scale}px`;
  }
  function nodeBy(id){return scene.querySelector(`[data-node="${state.screen}.${id}"]`);}
  function changeText(id,value){const el=scene.querySelector(`[data-copy="${state.screen}.${id}"]`);if(el)el.textContent=value;}
  function render(){
    const screen=layout.screens[state.screen];scene.replaceChildren();scene.style.backgroundImage=`url("${screen.background}")`;
    const frag=document.createDocumentFragment();for(const node of screen.nodes)frag.append(makeNode(node));scene.append(frag);
    stage.setAttribute('aria-label',screen.name);
    document.title=`Gemwoven · ${screen.name}`;
    document.querySelectorAll('#screen-menu button').forEach(b=>{if(b.dataset.screen===state.screen)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    scene.classList.remove('scene-enter');void scene.offsetWidth;scene.classList.add('scene-enter');
    if(state.screen==='shop')refreshProduct();if(state.screen==='tavern'&&state.questHidden)setQuestHidden(true);
    if(state.screen==='forge'&&state.groups['forge-tab'])changeText('forge-action',['CHẾ TẠO','CƯỜNG HÓA','KHẢM NGỌC'][Number(state.groups['forge-tab'].slice(-1))]);
    if(state.screen==='upgrade'&&state.groups['upgrade-tab'])changeText('upgrade-action',['Tăng Level','Tăng Sao','Tiến Hóa'][Number(state.groups['upgrade-tab'].slice(-1))]);
    setEditMode($('edit-copy').checked);fit();requestAnimationFrame(fitCopy);
  }
  function fitCopy(){
    // A DOM-only test has zero layout metrics; browsers fit replacement copy.
    scene.querySelectorAll('[data-copy]').forEach(el=>{
      if(!el.clientWidth||el.isContentEditable)return;
      let size=parseFloat(el.style.fontSize)||28;
      while(size>12&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1))el.style.fontSize=`${--size}px`;
    });
  }
  function navigate(key){
    if(!layout.screens[key]){showDirectory();return;}
    if(dialog.open)dialog.close();if(location.hash===`#${key}`){state.screen=key;render();}else location.hash=key;
  }
  function showModal(title,images=[],description='',links=[]){
    $('dialog-title').textContent=title;$('dialog-copy').textContent=description;
    $('dialog-art').replaceChildren(...images.filter(k=>assets[k]).map(art));$('dialog-links').replaceChildren();
    for(const link of links){
      const b=document.createElement(link.href?'a':'button');b.textContent=link.label;
      if(link.href)b.href=link.href;else{b.type='button';b.addEventListener('click',()=>navigate(link.route));}
      if(link.icon)b.prepend(art(link.icon));$('dialog-links').append(b);
    }
    if(!dialog.open)dialog.showModal();
  }
  function showDirectory(){showModal('Sáu miền diệu ngọc',[],'',Object.keys(layout.screens).map(key=>({label:layout.names[key],route:key,icon:iconFor[key]})));}
  function chooseGroup(button){
    if(!button.dataset.group)return;state.groups[button.dataset.group]=button.dataset.node;
    scene.querySelectorAll(`[data-group="${button.dataset.group}"]`).forEach(el=>{const selected=el===button;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
  }
  function refreshProduct(){
    const item=layout.screens.shop.products.find(p=>p[0]===state.product),preview=nodeBy('product-preview');
    preview.querySelector('.art').src=assets[state.product].file;preview.dataset.asset=state.product;preview.setAttribute('aria-label',item[1]);
    changeText('product-name',item[1]);changeText('product-description',state.product==='fire-essence'?copy['shop.product-description']:({coins:'Những đồng vàng lấp lánh\ncho hành trình của bạn.',mana:'Ngọc xanh chứa đựng\nánh sáng diệu kỳ.',ticket:'Tấm vé kết nối\nnhững người bạn mới.'}[state.product]||`${item[1]}\nVật phẩm trong cửa hàng.`));
    changeText('quantity',String(state.quantity));const price=Number(item[2].replaceAll(',',''))*state.quantity;changeText('purchase-price',`● ${price.toLocaleString('en-US')}`);
  }
  function setQuestHidden(hidden){
    state.questHidden=hidden;
    for(const n of layout.screens.tavern.nodes){if(n.id.startsWith('tavern.quest-')||n.id==='tavern.reward-heading'){const el=scene.querySelector(`[data-node="${n.id}"]`);if(el)el.hidden=hidden;}}
  }
  function activate(action,button){
    requestAnimationFrame(fitCopy);
    const [type,value]=action.split(':');chooseGroup(button);
    if(type==='route')return navigate(value);
    if(type==='mode'){state.mode=value;return;}
    if(type==='quantity'){state.quantity=Math.min(99,Math.max(1,state.quantity+Number(value)));refreshProduct();return;}
    if(type==='product'){state.product=value;state.quantity=1;refreshProduct();return;}
    if(type==='item')return showModal(itemNames[value]||'Vật phẩm',[value]);
    if(type==='hero')return showModal(heroNames[value],[`gem-${value}`],'',[{label:'Nâng cấp',route:'upgrade'}]);
    if(type==='selected-product')return showModal(itemNames[state.product],[state.product]);
    if(type==='battle')return showModal(`Đấu trường ${state.mode==='solo'?'1v1':'3v3'}`,['hero-fire','hero-ice'],'',[{label:'Vào trận',href:'Game.html'}]);
    if(type==='summon')return showModal(value==='ten'?'Triệu Hồi ×10':'Triệu Hồi ×1',['summon-crystal','gem-fire'],'',[{label:'Xem tướng',route:'upgrade'}]);
    if(type==='forge-preview'){const tab=Number((state.groups['forge-tab']||'1').slice(-1));return showModal(['Chế Tạo','Cường Hóa','Khảm Ngọc'][tab],['fire-sword'],tab===1?'+8  →  +9':'Kiếm Hỏa Ngục');}
    if(type==='upgrade-preview'){const tab=Number((state.groups['upgrade-tab']||'0').slice(-1));return showModal(['Tăng Level','Tăng Sao','Tiến Hóa'][tab],['hero-fire'],tab===0?'Lv.32  →  Lv.33':'Mika');}
    if(type==='forge-tab'){changeText('forge-action',['CHẾ TẠO','CƯỜNG HÓA','KHẢM NGỌC'][value]);return;}
    if(type==='upgrade-tab'){changeText('upgrade-action',['Tăng Level','Tăng Sao','Tiến Hóa'][value]);return;}
    if(type==='shop-tab')return;
    if(type==='quest-dismiss')return setQuestHidden(true);
    if(type==='tavern-tab'){setQuestHidden(false);changeText('quest-heading',['Tin Đồn','Nhiệm Vụ','Tình Thân','Chiêu Mộ'][value]);return;}
    if(type==='quest-preview')return showModal('Người lữ hành bí ẩn',['quest-scene'],'Một cuộc gặp gỡ mới ở rìa rừng.',[{label:'Triệu hồi',route:'summon'}]);
    const previews={mail:['Hòm Thư','icon-mail'],settings:['Cài Đặt','icon-settings'],event:['Sự Kiện','icon-event'],gift:['Phúc Lợi','icon-gift'],book:['Thẻ Tháng','icon-book'],chat:['Cộng Đồng','icon-chat'],trophy:['Thành Tựu','icon-trophy'],crown:['Bảng Xếp Hạng','icon-crown'],ranking:['Xếp Hạng','rank-gold'],rewards:['Phần Thưởng','chest'],summon:['Triệu Hồi','summon-crystal'],evolution:['Chân Thân','gem-fire']};
    if(type==='preview'){const entry=previews[value]||['Gemwoven','mana'];showModal(entry[0],[entry[1]]);}
  }
  function setEditMode(enabled){stage.classList.toggle('edit-copy',enabled);scene.querySelectorAll('[data-copy]').forEach(el=>{el.contentEditable=enabled?'true':'false';el.spellcheck=false;});if(!enabled)requestAnimationFrame(fitCopy);}
  scene.addEventListener('click',e=>{if($('edit-copy').checked&&e.target.closest('[data-copy]'))return;const b=e.target.closest('button[data-action]');if(b)activate(b.dataset.action,b);});
  scene.addEventListener('input',e=>{const el=e.target.closest('[data-copy]');if(el){copy[el.dataset.copy]=el.textContent;const button=el.closest('button');if(button)button.setAttribute('aria-label',el.textContent);}});
  for(const key of Object.keys(layout.screens)){
    const button=document.createElement('button');button.type='button';button.dataset.screen=key;button.append(art(iconFor[key]),document.createTextNode(layout.names[key]));button.addEventListener('click',()=>navigate(key));$('screen-menu').append(button);
  }
  $('show-bounds').addEventListener('change',e=>stage.classList.toggle('show-bounds',e.target.checked));
  $('hide-copy').addEventListener('change',e=>stage.classList.toggle('hide-copy',e.target.checked));
  $('edit-copy').addEventListener('change',e=>setEditMode(e.target.checked));
  $('export-copy').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gemwoven-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('close-dialog').addEventListener('click',()=>dialog.close());$('return-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);state.screen=layout.screens[key]?key:'arena';render();});
  window.addEventListener('resize',fit);
  const initial=location.hash.slice(1);state.screen=layout.screens[initial]?initial:'arena';render();
})();
