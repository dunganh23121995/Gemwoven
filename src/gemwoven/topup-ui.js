/* Nạp (#topup) and the resource popup (owner 04/11: "Đơn vị tiền tệ thì không cần giải thích, cho phép mua thêm trong cửa
 * hàng bằng ngọc. Ngọc thì phải nạp."; Claude + Codex topup round, docs/GAME_DESIGN.md §10 and §20).
 * - Resource popup (tap any resource): picture, name, held count; one main button "Mua thêm" that opens the shop on the
 *   right tab with that product picked (a back arrow returns), "Nạp" for Đá Ngọc; free sources folded under "Cách kiếm ›"
 *   (at most three, icon + short name, tap goes there). Resources the shop never sells show only their sources.
 * - Nạp page: Đá Ngọc packs (liveops.js GEM_PACKS) with "Lần đầu ×2" written as "60 + 60 = 120"; each pack carries a lock on its
 *   price and a "Sắp ra mắt" tag, and "Thanh toán sắp ra mắt" sits right above the packs (Codex review 4), a compact VIP bar
 *   (progression.js vipProgress) and entries to Thẻ Tháng / Sổ Hành Trình / Quỹ on the VIP page. Payment is a future server
 *   feature: a pack opens a Coming-soon sheet and nothing is charged, granted, counted toward VIP or marked as used.
 * Every frame is drawn art (Codex mockup assets/gemwoven/raw/topup/mockup-page.png, pieces in assets/gemwoven/topup and
 * reused vip-pass pieces); words and numbers are the HTML layer. Boxes are in the 941x1672 stage.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS;
  if(!G?.decorate||!M||!O?.GEM_PACKS||!L?.screens)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),vnd=n=>fmt(n)+'₫',file=k=>A[k]?.file||'';
  const T='assets/gemwoven/topup/',P='assets/gemwoven/vip-pass/',tp=n=>T+n+'.webp',pv=n=>P+n+'.webp';
  const LOCK='assets/gemwoven/forge/lock.webp',TAG='assets/gemwoven/forge/tag.webp';
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;

  // ----- The Nạp screen (registered here; progression-ui.js gives it the HUD, the nav bar and the back arrow) -----
  L.names.topup='Nạp';
  L.screens.topup={key:'topup',name:'Nạp',background:A['background-vip']?.file||pv('room'),backgroundKey:'vip',nodes:[]};
  if(Array.isArray(L.order)&&!L.order.includes('topup'))L.order.splice(L.order.indexOf('vip')+1||L.order.length,0,'topup');

  function vipBar(){
    const v=M.vipProgress(G.engine.read().vip?.paidTotal||0),fill=Math.round((v.max?1:v.ratio)*100);
    return `<button type="button" class="tp-vip" data-action="topup:vip" style="${box(44,268,852,132)}" aria-label="VIP ${v.level} · ${v.points} điểm">`+
      `<img class="tp-art" src="${pv('vip-strip')}" alt=""><span class="tp-crest" style="${box(26,-8,148,148)}"><img src="${pv('vip-crest')}" alt=""><i>VIP</i><b>${v.level}</b></span>`+
      `<span class="tp-trough" style="${box(196,38,370,56)}"><img src="${pv('vip-trough')}" alt=""><em style="width:${fill}%"></em><b>${v.max?fmt(v.points)+' điểm':`${fmt(v.points)} / ${fmt(v.next.points)} điểm`}</b></span>`+
      `<span class="tp-rate" style="${box(584,36,240,60)}"><img src="${pv('next-vip-tag')}" alt=""><b>1.000₫ = 1 điểm</b></span></button>`;
  }
  const ENTRIES=[['monthly','Thẻ Tháng','calendar'],['pass','Sổ Hành Trình','journey-book'],['fund','Quỹ','fund-pouch']];
  function entries(){
    return ENTRIES.map(([tab,name,icon],i)=>{const x=[44,334,636][i],w=[282,294,260][i];
      return `<button type="button" class="tp-entry" data-action="topup:entry" data-tab="${tab}" style="${box(x,414,w,88)}" aria-label="${esc(name)}">`+
        `<img class="tp-art" src="${pv('tab-idle')}" alt=""><img class="tp-icon" src="${pv(icon)}" alt=""><b>${esc(name)}</b></button>`;}).join('');
  }
  function card(x,i){
    const col=i%2,row=Math.floor(i/2),left=col?480:46,top=650+row*262,total=`${fmt(x.gems)} + ${fmt(x.firstBonus)} = ${fmt(x.gems+x.firstBonus)}`;
    return `<button type="button" class="tp-card" data-action="topup:buy" data-pack="${x.id}" style="${box(left,top,414,246)}" aria-label="${fmt(x.gems)} Đá Ngọc · ${vnd(x.price)} · lần đầu ${fmt(x.gems)} + ${fmt(x.firstBonus)} = ${fmt(x.gems+x.firstBonus)} · sắp ra mắt">`+
      `<img class="tp-art" src="${tp('card-wide')}" alt="">`+
      `<img class="tp-pack" src="${tp('pack-'+x.tier)}" alt="" style="${box(18,40,182,150)}">`+
      `<span class="tp-amount" style="${box(196,30,206,82)}"><img src="${file('mana')}" alt=""><b${fmt(x.gems).length>3?' class="long"':''}>${fmt(x.gems)}</b></span>`+
      `<span class="tp-price" style="${box(198,112,206,64)}"><img src="${tp('price-plate')}" alt=""><b${vnd(x.price).length>9?' class="long"':''}>${vnd(x.price)}</b><img class="tp-lock" src="${LOCK}" alt=""></span>`+
      `<span class="tp-locktag" style="${box(14,146,186,44)}"><img src="${TAG}" alt=""><b>Sắp ra mắt</b></span>`+
      `<span class="tp-total" style="${box(58,186,298,44)}"><b${total.length>17?' class="long"':''}>${total}</b></span>`+
      `<span class="tp-ribbon" style="${box(-10,-14,214,62)}"><img src="${tp('ribbon')}" alt=""><b>Lần đầu ×2</b></span></button>`;
  }
  function build(el){
    el.innerHTML=`<img class="tp-sign" src="${pv('title-sign')}" alt="" style="${box(262,112,416,122)}"><h2 class="tp-title" style="${box(312,160,316,60)}">Nạp</h2>`+
      vipBar()+entries()+
      `<span class="tp-head" style="${box(76,520,370,108)}"><img src="${pv('head2-free')}" alt=""><b>Đá Ngọc</b></span>`+
      `<button type="button" class="tp-soon" data-action="topup:soon" style="${box(462,540,436,84)}" aria-label="Thanh toán sắp ra mắt"><img class="tp-art" src="${TAG}" alt=""><img class="tp-soonlock" src="${LOCK}" alt=""><b>Thanh toán sắp ra mắt</b></button>`+
      O.GEM_PACKS.map(card).join('');
  }

  // Coming-soon sheet: what the pack will give, and that nothing happens yet.
  function packSheet(id){
    const x=O.GEM_PACKS.find(p=>p.id===id);if(!x)return;
    const modal=window.GemwovenUI.makeDialog('topup-pack',fmt(x.gems)+' Đá Ngọc','growth-dialog tp-dialog');
    modal.body.innerHTML=`<div class="tp-sheet"><img class="tp-sheet-pack" src="${tp('pack-'+x.tier)}" alt="">`+
      `<p class="tp-sheet-total"><img src="${file('mana')}" alt=""><b>${fmt(x.gems)} + ${fmt(x.firstBonus)} = ${fmt(x.gems+x.firstBonus)}</b><small>Lần đầu ×2</small></p>`+
      `<p class="tp-sheet-price"><b>${vnd(x.price)}</b><small>+${fmt(x.price/O.TOPUP.vndPerVipPoint)} điểm VIP</small></p>`+
      `<p class="tp-sheet-soon"><img src="${file('kit-lock')}" alt=""><b>Sắp ra mắt</b><span>Chưa thu tiền</span></p></div>`;
    const ok=document.createElement('button');ok.type='button';ok.className='gw-btn';ok.textContent='Đã hiểu';ok.onclick=()=>modal.close();modal.actions.append(ok);
    modal.present();
  }

  // ----- Resource popup -----
  // Free sources, at most three each: short name, icon and where a tap goes (progression.js rewards and tables).
  const WAY={campaign:['Vượt Ải','kit-icon-swords','campaign'],boss:['Trùm Vô Tận','kit-icon-skull','boss'],offline:['Tích Lũy','kit-icon-hourglass','offline'],
    quests:['Nhiệm Vụ','icon-quest','quests'],weekly:['Nhiệm Vụ Tuần','icon-quest','quests'],summon:['Triệu Hồi','icon-summon','summon'],salvage:['Phân Rã','icon-bag','inventory'],
    chapter:['Rương Sao','chest','campaign'],levels:['Mốc Cấp Tướng','kit-icon-up','upgrade'],hero6:['Tướng 6★','icon-hero','upgrade'],trial:['Thử Luyện','kit-icon-trophy','events']};
  const WAYS={gold:['campaign','boss','offline'],tickets:['quests','levels'],exp:['campaign','boss','offline'],seals:['quests','campaign','offline'],skillBooks:['quests','trial'],
    essence:['boss','chapter','trial'],ore:['campaign','boss','salvage'],wood:['summon','campaign'],cloth:['summon','campaign'],divineOre:['boss'],memoryDust:['weekly','hero6']};
  // What "Mua thêm" opens: the shop product, or the gold packs in the Đá Ngọc tab for gold.
  function offer(id){
    if(id==='gems')return {topup:true};
    if(id==='gold')return {tab:'gems',product:'gold-pack-1'};
    const row=M.WORLD.SHOP.find(r=>r.kind==='resource'&&r.target===id);
    return row?{tab:row.currency==='gold'?'gold':'gems',product:row.id}:null;
  }
  const KEYS=Object.keys(M.RESOURCES),resourceOf=id=>KEYS.includes(id)?id:KEYS.find(k=>M.RESOURCES[k][1]===id)||(id==='memory-dust'||id==='memoryDust'?'memoryDust':null);
  const held=(p,id)=>id==='memoryDust'?p.memory?.dust||0:id in p.wallet?p.wallet[id]:p.materials[id]||0;
  function itemPopup(id,ctx,state){
    const p=G.engine.read(),[name,asset]=id==='memoryDust'?['Bụi Ký Ức','memory-dust']:M.RESOURCES[id],buy=offer(id),ways=(WAYS[id]||[]).slice(0,3).map(k=>WAY[k]);
    const body=document.createElement('div');body.className='tp-pop';
    body.innerHTML=`<span class="tp-have"><small>Đang có</small><b>${fmt(held(p,id))}</b></span>`+
      (buy?`<button type="button" class="tp-buy" data-go="buy">${buy.topup?`<img src="${file('mana')}" alt="">Nạp`:'Mua thêm'}</button>`:'')+
      (ways.length?`<details class="tp-ways"${buy?'':' open'}><summary>Cách kiếm <i aria-hidden="true">›</i></summary>`+
        '<div class="tp-way-list">'+ways.map(([label,icon,route])=>`<button type="button" class="tp-way" data-route="${route}"><img src="${esc(file(icon)||file('icon-quest'))}" alt=""><b>${esc(label)}</b><i aria-hidden="true">›</i></button>`).join('')+`</div></details>`:'');
    body.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;document.getElementById('preview-dialog')?.close();
      if(b.dataset.go==='buy'){if(buy.topup){ctx.navigate('topup');return;}
        state.shopTab=buy.tab;state.shopProduct=buy.product;state.shopPick=buy.product;state.shopBack=state.screen!=='shop';state.quantity=1;state.shopMessage='';ctx.navigate('shop');if(state.screen==='shop')ctx.render();return;}
      if(b.dataset.route)ctx.navigate(b.dataset.route);
    });
    ctx.showModal(name,[asset],'',[],{kind:'item',content:body});
    document.getElementById('preview-dialog')?.classList.add('tp-item');
  }
  // The popup's own class is dropped when another popup opens in the same shell.
  new MutationObserver(()=>{const d=document.getElementById('preview-dialog');if(d&&!d.querySelector('#dialog-extra .tp-pop'))d.classList.remove('tp-item');})
    .observe(document.documentElement,{childList:true,subtree:true});

  // ----- Hooks -----
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='shop')state.shopBack=false;if(state.screen!=='topup')return p;
    const screen=L.screens.topup;if(A['background-vip'])screen.background=A['background-vip'].file;
    const back=screen.nodes.find(n=>n.id==='topup.back');
    screen.nodes=screen.nodes.filter(n=>n.id!=='topup.live'&&n.id!=='topup.back');
    screen.nodes.push({id:'topup.live',kind:'content',rect:[0,0,941,1490],className:'exploration-map tp',build:el=>build(el)});
    // The Nạp sign sits higher than the other panels' title planks: the back medallion follows it.
    if(back){back.rect=[790,96,112,112];screen.nodes.push(back);}
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action.startsWith('item:')){const id=resourceOf(action.slice(5));if(id){itemPopup(id,ctx,state);return true;}}
    if(!action.startsWith('topup:'))return handle(action,el,ctx,state);
    const d=el.dataset||{},cmd=action.slice(6);
    if(cmd==='open'){ctx.navigate('topup');return true;}
    if(cmd==='entry'){state.vipTab=d.tab;ctx.navigate('vip');return true;}
    if(cmd==='vip'){state.vipTab=state.vipTab||'pass';ctx.navigate('vip');return true;}
    // "Mua thêm" from the bag's detail panel: the same destination as the resource popup's button.
    if(cmd==='more'){const buy=offer(d.resource);if(!buy)return true;if(buy.topup){ctx.navigate('topup');return true;}
      state.shopTab=buy.tab;state.shopProduct=buy.product;state.shopPick=buy.product;state.shopBack=true;state.quantity=1;state.shopMessage='';ctx.navigate('shop');return true;}
    if(cmd==='buy')packSheet(d.pack);
    if(cmd==='soon')ctx.showModal('Nạp · Sắp ra mắt',[],'Thanh toán mở cùng máy chủ. Hiện chưa thu tiền, chưa nhận Đá Ngọc, chưa tính VIP; ưu đãi Lần đầu ×2 vẫn còn nguyên.');
    return true;
  };
  window.GemwovenTopup={itemPopup,offer};
})();
