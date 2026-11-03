/* VIP & Nạp (#vip) — VIP progress, Sổ Hành Trình as a timeline tree, Thẻ Tháng and Quỹ Trưởng Thành (owner 2026-11-04:
 * "thanh tiến độ vip; thẻ thì phải dạng cây time line; mỗi nốt đạt là nhận thưởng, mở khóa bằng mua thẻ để nhận ở những
 * thanh có thưởng cao hơn"). Codex discussed the rules and drew the approved mockup (assets/gemwoven/raw/vip-pass/
 * mockup-1.png); every frame is drawn art in assets/gemwoven/vip-pass, words and numbers are the HTML layer on top.
 * Rules live in progression.js (pass, claimPass, claimPassAll, vipProgress, monthlyCard) and liveops.js (VIP, PRODUCTS,
 * PASS, GROWTH_FUND). Payment is a future server feature: every activation opens a Coming-soon sheet and changes nothing.
 * Boxes are in the 941x1672 stage.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!G.engine?.pass||!O||!L?.screens?.vip)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),vnd=n=>fmt(n)+'đ',file=k=>A[k]?.file||'';
  const F='assets/gemwoven/vip-pass/',art=n=>F+n+'.webp';
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const product=id=>O.PRODUCTS.find(x=>x.id===id);
  // Pictures for reward ids: game resources use their own art; vouchers and cosmetics have their own names.
  const EXTRA={fragmentChoice:['Mảnh tướng tự chọn','hero-fragment'],epicGearChoice:['Rương Sử Thi tự chọn','chest'],legendaryGearChoice:['Rương Huyền Thoại tự chọn','chest'],seasonFrame:['Khung avatar mùa',null],gems:['Đá Ngọc','mana']};
  const rname=id=>M.RESOURCES[id]?.[0]||EXTRA[id]?.[0]||id;
  const rpic=id=>id==='seasonFrame'?art('avatar-frame'):file(M.RESOURCES[id]?.[1]||EXTRA[id]?.[1])||file('chest');
  const short=n=>n>=10000?M.compact(n,10000):fmt(n);
  // VIP perks as pictures with a short caption (the full line behind a tap).
  const PERK=[[/Khung và danh hiệu/,'icon-crown','','Danh hiệu'],[/Khung avatar/,'@avatar-frame','','Khung'],[/Quà ngày ([\d.]+) vàng/,'@gift','$1','Quà ngày'],[/Quét ải/,'icon-quest','3★','Quét ải'],[/Hiệu ứng vào trận/,'evo-aura','','Vào trận'],
    [/lượt Trùm Vô Tận/,'nav-arena','+1','Lượt Trùm'],[/Tích lũy (\d+) giờ/,'chest','$1h','Tích lũy'],[/Cửa hàng VIP (\d+) ô/,'icon-shop','$1 ô','Shop VIP'],[/Gói Quà VIP/,'icon-gift','','Gói quà'],[/Bong bóng chat/,'icon-chat','','Chat'],
    [/Hàng đợi rèn/,'icon-forge','×2','Lò rèn'],[/Trang phục trang bị/,'gear-armor','','Áo đồ'],[/Trang phục tướng/,'icon-hero','','Áo tướng'],[/Chăm sóc khách hàng/,'icon-mail','','Hỗ trợ']];
  function perk(text){for(const [re,icon,cap,name] of PERK){const m=re.exec(text);if(m)return {icon:icon[0]==='@'?art(icon.slice(1)):file(icon),cap:cap.replace('$1',m[1]||''),name,text};}return {icon:file('icon-crown'),cap:'',name:'',text};}

  // ----- VIP strip (all tabs) -----
  function vipStrip(){
    const v=G.engine.vip(),next=v.next&&O.VIP.find(x=>x.level===v.next.level),perks=(next?.perks||[]).slice(0,2).map(perk);
    return `<button type="button" class="pv-vip" data-action="pass:vip" style="${box(44,218,852,162)}" aria-label="VIP ${v.level} · xem các bậc VIP"><img class="pv-art" src="${art('vip-strip')}" alt="">`+
      `<span class="pv-crest" style="${box(20,6,150,150)}"><img src="${art('vip-crest')}" alt=""><i>VIP</i><b>${v.level}</b></span>`+
      `<span class="pv-trough" style="${box(184,40,330,40)}"><img src="${art('vip-trough')}" alt=""><em style="width:${(v.ratio*100).toFixed(1)}%"></em><b>${v.max?'Tối đa':`${fmt(v.points)} / ${fmt(v.next.points)} điểm`}</b></span>`+
      (next?`<span class="pv-nexttag" style="${box(520,36,104,48)}"><img src="${art('next-vip-tag')}" alt=""><b>VIP ${next.level}</b></span>`:'')+
      `<span class="pv-plaque" style="${box(218,96,360,48)}"><img src="${art('status-plaque')}" alt=""><b>Nạp: Sắp ra mắt</b></span>`+
      perks.map((k,i)=>`<span class="pv-perk" style="${box(636+i*104,22,96,118)}" title="${esc(k.text)}"><img src="${k.icon}" alt="">${k.cap?`<b>${esc(k.cap)}</b>`:''}</span>`).join('')+`</button>`;
  }
  function vipDialog(){
    const v=G.engine.vip(),modal=window.GemwovenUI.makeDialog('vip-ladder','Bậc VIP','growth-dialog pv-dialog');
    modal.body.innerHTML=`<p class="pv-lead">1 điểm VIP = 1.000đ nạp đã xác thực. VIP chỉ thêm tiện lợi, quà ngày và trang trí, không cộng chỉ số chiến đấu.</p>`+
      `<ol class="pv-ladder">${O.VIP.map(x=>`<li class="${v.level>=x.level?'is-reached':''} ${v.next?.level===x.level?'is-next':''}"><span class="pv-lv"><img src="${art('vip-crest')}" alt=""><b>${x.level}</b></span>`+
        `<small>${fmt(x.spend/1000)} điểm</small><span class="pv-icons">${x.perks.map(perk).map(k=>`<span title="${esc(k.text)}"><img src="${k.icon}" alt="">${k.cap?`<b>${esc(k.cap)}</b>`:''}<i>${esc(k.name)}</i></span>`).join('')}</span>`+
        `<details><summary aria-label="Chi tiết VIP ${x.level}">ⓘ</summary><ul>${x.perks.map(k=>`<li>${esc(k)}</li>`).join('')}</ul></details></li>`).join('')}</ol>`+
      `<p class="pv-note">Giao dịch bị hoàn tiền sẽ bị thu hồi và tính lại VIP. Thanh toán mở cùng máy chủ.</p>`;
    modal.present();
  }

  // ----- Tabs -----
  const TABS=[['pass','Sổ Hành Trình','journey-book'],['monthly','Thẻ Tháng','calendar'],['fund','Quỹ','fund-pouch']];
  const tabs=state=>TABS.map(([id,name,icon],i)=>{const on=state.vipTab===id,x=[46,378,670][i],w=[322,284,228][i];
    return `<button type="button" class="pv-tab ${on?'on':''}" data-action="pass:tab" data-tab="${id}" style="${box(x,404,w,80)}" aria-pressed="${on}"><img class="pv-art" src="${art(on?'tab-selected':'tab-idle')}" alt=""><img class="pv-tabicon" src="${art(icon)}" alt=""><b>${name}</b></button>`;}).join('');

  // ----- Timeline tree (shared by the three tabs) -----
  // A lane holds one reward socket per row; the drawn row's trunk sits at x 329 of its 840-wide box, the sockets at 132 / 494 / 712.
  const ROW=158,VX=40,TREE_X=12,STAGE_X=VX+TREE_X,TRUNK=329,LANE_X=[128,494,712],SOCKET=[214,124];
  function socket(cell,lane,row){
    const [w,h]=SOCKET,x=LANE_X[lane]-w/2,items=Object.entries(cell.reward||{}).filter(([,n])=>n>0).slice(0,2);
    const state=cell.state,ready=state==='ready';
    const label=cell.picture?`${row.title} · ${cell.picture.cap}`:`${row.title} · ${items.map(([k,n])=>rname(k)+' ×'+fmt(n)).join(', ')}`;
    return `<button type="button" class="pv-socket lane-${lane} is-${state}" data-action="${ready?cell.claim:'pass:detail'}" ${cell.data} style="${box(x,ROW/2-h/2-4,w,h)}" aria-label="${esc(label)}">`+
      `<img class="pv-art" src="${art(cell.frame)}" alt="">`+
      (cell.picture?`<span class="pv-items n1"><span><img class="${cell.picture.cls||''}" src="${cell.picture.src}" alt=""><b>${esc(cell.picture.cap)}</b></span></span>`:
        `<span class="pv-items n${items.length}">${items.map(([k,n])=>`<span><img src="${rpic(k)}" alt=""><b>${short(n)}</b></span>`).join('')}</span>`)+
      (state==='claimed'?`<img class="pv-mark" src="${art('claimed-check')}" alt="Đã nhận">`:'')+
      (state==='track'?`<img class="pv-mark" src="${art('ownership-lock')}" alt="Cần kích hoạt">`:'')+
      (state==='stage'?`<em class="pv-gate">Ải ${cell.gate}</em>`:'')+
      (ready?`<span class="pv-claim"><img src="${art('claim-button')}" alt=""><b>Nhận</b></span>`:'')+`</button>`;
  }
  function tree(rows,current){
    return `<div class="pv-rows" style="height:${rows.length*ROW+24}px">${rows.map((r,i)=>`<div class="pv-row ${r.reached?'is-reached':''}" style="${box(TREE_X,i*ROW,840,ROW)}">`+
      `<img class="pv-trunk ${i%2?'flip':''}" src="${art('tree-row')}" alt="" style="${box(0,0,840,ROW)}">`+
      `<span class="pv-medal ${r.level===current?'is-current':''}" style="${box(TRUNK-(r.level===current?56:52),ROW/2-(r.level===current?50:44),r.level===current?112:104,r.level===current?100:88)}"><img src="${art(r.level===current?'medal-current':'medal')}" alt=""><b>${esc(r.badge)}</b></span>`+
      r.cells.map(c=>c&&socket(c,c.lane,r)).join('')+`</div>`).join('')}</div>`;
  }
  // The scroll box keeps its place across renders; the first visit lands on the earliest node to take, or the level.
  function scroller(id,rows,current,state){
    const first=rows.findIndex(r=>r.cells.some(c=>c?.state==='ready')),at=first>=0?first:Math.max(0,rows.findIndex(r=>r.level===current));
    const key='vipScroll-'+id,top=state[key]??Math.max(0,at*ROW-12);
    return {html:`<div class="pv-scroll" data-scroll="${key}" data-top="${top}" style="${box(0,0,872,556)}">${tree(rows,current)}</div>`+
      `<span class="pv-rail" style="${box(848,6,16,544)}"><img class="pv-railbar" src="${art('scroll-rail')}" alt=""><img class="pv-up" src="${art('scroll-arrow')}" alt=""><img class="pv-down" src="${art('scroll-arrow')}" alt=""><img class="pv-thumb" src="${art('scroll-thumb')}" alt=""></span>`};
  }

  // ----- Sổ Hành Trình -----
  function passRows(v){
    return v.rows.map(r=>({level:r.level,badge:String(r.level),reached:r.reached,title:`Cấp ${r.level}`,
      cells:['free','gold','jewel'].map((t,lane)=>({...r[t],lane,frame:'reward-'+t,claim:'pass:claim',data:`data-level="${r.level}" data-track="${t}"`}))}));
  }
  // The crown's trunk (x 0.317 of its art, 0.085 of its width) is scaled to the rows' trunk and laps over the top of
  // the scroll box, so the tree reads as one piece while the rows scroll under it.
  const crown=()=>`<img class="pv-crown" src="${art('tree-crown')}" alt="" style="${box(STAGE_X+TRUNK-249,540,787,252)}">`;
  // Headers over the first two lanes on the card tabs: what is reached, what it delivers.
  const laneHeads=list=>list.map(([name,sub,frame],i)=>`<span class="pv-head head-${frame}" style="${box(STAGE_X+LANE_X[i]-112,610,224,110)}"><img class="pv-art" src="${art('header-'+frame)}" alt=""><b>${esc(name)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span>`).join('');
  function passTab(state){
    const v=G.engine.pass();if(!v)return '';
    const head=(t,i)=>{const x=STAGE_X+LANE_X[i]-112,own=t.id==='free'||v.owned[t.id],price=t.product&&product(t.product)?.price;
      return `<button type="button" class="pv-head head-${t.id}" data-action="${t.product?'pass:buy':'pass:detail-track'}" data-product="${t.product||''}" style="${box(x,610,224,110)}" aria-label="Nhánh ${esc(t.name)}${own?'':' · cần kích hoạt'}">`+
        `<img class="pv-art" src="${art('header-'+t.id)}" alt=""><b>${esc(t.name)}</b>${t.product&&!own?'<small>Chưa kích hoạt</small>':''}</button>`+
        (t.product&&!own?`<button type="button" class="pv-soon" data-action="pass:buy" data-product="${t.product}" style="${box(x+8,708,208,48)}" aria-label="Kích hoạt · ${vnd(price)} · sắp ra mắt"><img class="pv-art" src="${art('status-plaque')}" alt=""><b>${vnd(price)}</b></button>`:'')+
        (t.product&&own?`<em class="pv-owned" style="${box(x+40,712,144,36)}">Đã mở</em>`:'');};
    const s=scroller('pass',passRows(v),v.level,state);
    return `<div class="pv-viewport" style="${box(40,768,872,556)}">${s.html}</div>`+crown()+`<button type="button" class="pv-season" data-action="pass:season" style="${box(54,500,840,90)}" aria-label="Mùa ${v.season+1} · cấp ${v.level}/${v.max} · cách kiếm điểm">`+
        `<img class="pv-art" src="${art('season-strip')}" alt=""><b class="pv-mua" style="${box(48,14,150,56)}">Mùa ${v.season+1}</b>`+
        `<b class="pv-lvl" style="${box(236,16,180,56)}">Cấp ${v.level} / ${v.max}</b>`+
        `<span class="pv-trough green" style="${box(420,24,300,40)}"><img src="${art('activity-trough')}" alt=""><em style="width:${(v.level>=v.max?100:v.into/v.per*100).toFixed(1)}%"><img src="${art('activity-fill')}" alt=""></em><b>${v.level>=v.max?'Tối đa':`${v.into} / ${v.per}`}</b></span>`+
        `<img class="pv-hourglass" src="${art('hourglass')}" alt="" style="${box(736,6,60,76)}"><small class="pv-days" style="${box(712,56,108,30)}"><img src="${art('quantity-pill')}" alt="">${v.daysLeft} ngày</small></button>`+
      O.PASS.tracks.map(head).join('')+
      `<button type="button" class="pv-action secondary" data-action="route:quests" style="${box(70,1350,300,96)}"><img class="pv-art" src="${art('action-secondary')}" alt=""><img class="pv-actionicon" src="${art('journey-book')}" alt=""><b>Nhiệm vụ</b></button>`+
      `<button type="button" class="pv-action primary" data-action="pass:claim-all" ${v.ready?'':'disabled'} style="${box(414,1346,456,104)}"><img class="pv-art" src="${art('action-primary')}" alt=""><img class="pv-actionicon" src="${art('gift')}" alt=""><b>${v.ready?`Nhận tất cả · ${v.ready}`:'Chưa có quà'}</b></button>`;
  }
  function seasonDialog(){
    const v=G.engine.pass(),modal=window.GemwovenUI.makeDialog('pass-season',`Sổ Hành Trình · Mùa ${v.season+1}`,'growth-dialog pv-dialog');
    const end=new Date(v.end).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
    modal.body.innerHTML=`<ul class="pv-facts"><li><img src="${art('journey-book')}" alt=""><span><b>+${O.PASS.points.daily}</b> điểm mỗi nhiệm vụ ngày đã nhận</span></li>`+
      `<li><img src="${file('icon-quest')}" alt=""><span><b>+${O.PASS.points.weekly}</b> điểm mỗi nhiệm vụ tuần đã nhận</span></li>`+
      `<li><img src="${art('medal')}" alt=""><span><b>${v.per}</b> điểm = 1 cấp · tối đa ${v.max}</span></li>`+
      `<li><img src="${art('hourglass')}" alt=""><span>Mùa ${O.PASS.seasonDays} ngày · hết ${end} · quà chưa nhận tự vào túi khi sang mùa</span></li></ul>`+
      `<p class="pv-note">Sổ không chứa Đá Ngọc. Nhánh Vàng và Diệu Ngọc mở khi mua sổ của mùa (thanh toán sắp ra mắt); mua giữa mùa vẫn nhận mọi nốt đã đạt.</p>`;
    const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent='Làm nhiệm vụ';go.onclick=()=>{modal.close();G.handle('route:quests',{dataset:{}},ctxRef,stateRef);};
    modal.actions.append(go);modal.present();
  }
  function detailDialog(el){
    const d=el.dataset;let title,lines=[],why='';
    if(d.track){const v=G.engine.pass(),r=v.rows[Number(d.level)-1],c=r[d.track],t=O.PASS.tracks.find(x=>x.id===d.track);
      title=`Cấp ${r.level} · ${t.name}`;lines=Object.entries(c.reward);
      why={claimed:'Đã nhận.',level:`Đạt cấp sổ ${r.level} để nhận (còn ${Math.max(0,r.level*v.per-v.points)} điểm).`,track:`Cần kích hoạt nhánh ${t.name}. Thanh toán sắp ra mắt.`,stage:`Qua ải ${c.gate} để nhận.`,ready:''}[c.state];}
    else{title=d.title;lines=JSON.parse(d.reward||'{}');lines=Object.entries(lines);why=d.why||'';}
    const modal=window.GemwovenUI.makeDialog('pass-detail',title,'growth-dialog pv-dialog');
    modal.body.innerHTML=`<div class="pv-detail">${lines.map(([k,n])=>`<span><img src="${rpic(k)}" alt=""><b>${fmt(n)}</b><small>${esc(rname(k))}</small></span>`).join('')}</div>${why?`<p class="pv-why">${esc(why)}</p>`:''}`;
    modal.present();
  }
  // Activation: payment is a server feature, so this only shows the offer and says it is coming.
  function buyDialog(id){
    const x=product(id);if(!x)return;const modal=window.GemwovenUI.makeDialog('pass-buy',x.name,'growth-dialog pv-dialog');
    modal.body.innerHTML=`<p class="pv-price">${vnd(x.price)}${x.days?` · ${x.days} ngày (cộng dồn tối đa ${x.stackMaxDays})`:''}</p><ul class="pv-perklist">${x.perks.map(k=>`<li>${esc(k)}</li>`).join('')}</ul>`+
      `<p class="pv-why"><img src="${art('status-plaque')}" alt="">Sắp ra mắt · thanh toán mở cùng máy chủ, chưa thu tiền.</p>`;
    modal.present();
  }

  // ----- Thẻ Tháng and Quỹ: the same tree, one day or one hero level per node -----
  function monthlyTab(state){
    const x=product('monthly-card'),card=G.engine.monthlyCard(),own=card.active,day=own?x.days-card.daysLeft+1:0;
    const gift={src:art('gift'),cap:'Khi mua'},cal=n=>({src:art('calendar'),cap:'Ngày '+n});
    const boss={src:file('nav-arena'),cap:'+1 Trùm'},perksNow={src:file('chest'),cap:'+2h · 3★'};
    const lock=own?'claimed':'track';
    const rows=[{level:0,badge:'✦',title:'Khi mua',reached:own,cells:[{picture:gift,state:'info',lane:0,frame:'reward-free',claim:'pass:detail',data:`data-title="Thẻ Tháng" data-why="Ngay khi thẻ được kích hoạt."`},{reward:{gems:x.gemsNow},state:own?'claimed':'track',lane:1,frame:'reward-gold',claim:'pass:detail',data:`data-title="Thẻ Tháng · khi mua" data-reward='${JSON.stringify({gems:x.gemsNow})}' data-why="${own?'Đã giao.':'Giao ngay khi mua thẻ · thanh toán sắp ra mắt.'}"`},
        {picture:perksNow,state:lock,lane:2,frame:'reward-jewel',claim:'pass:detail',data:`data-title="Thẻ Tháng · đặc quyền" data-why="Tích lũy +2 giờ và quét ải 3★ không cần vé suốt thời hạn thẻ."`}]}]
      .concat(Array.from({length:x.days},(_,i)=>({level:i+1,badge:String(i+1),title:`Ngày ${i+1}`,reached:own&&i+1<=day,
        cells:[{picture:cal(i+1),state:'info',lane:0,frame:'reward-free',claim:'pass:detail',data:`data-title="Thẻ Tháng · ngày ${i+1}" data-why="Mỗi ngày thẻ còn hạn, Đá Ngọc tự vào Hòm Thư nếu quên đăng nhập."`},{reward:{gems:x.gemsDaily},state:own?(i+1<day?'claimed':'level'):'track',lane:1,frame:'reward-gold',claim:'pass:detail',data:`data-title="Thẻ Tháng · ngày ${i+1}" data-reward='${JSON.stringify({gems:x.gemsDaily})}' data-why="Giao qua Hòm Thư mỗi ngày khi thẻ còn hạn · thanh toán sắp ra mắt."`},
          {picture:boss,state:own?(i+1<day?'claimed':'level'):'track',lane:2,frame:'reward-jewel',claim:'pass:detail',data:`data-title="Thẻ Tháng · ngày ${i+1}" data-why="+1 lượt Trùm Vô Tận có thưởng trong ngày khi thẻ còn hạn."`}]})));
    const s=scroller('monthly',rows,own?day:-1,state),perks=[['chest','+2h','Tích lũy +2 giờ'],['nav-arena','+1','+1 lượt Trùm Vô Tận có thưởng mỗi ngày'],['icon-quest','3★','Quét ải 3★ không cần vé quét']];
    return `<div class="pv-viewport" style="${box(40,768,872,556)}">${s.html}</div>`+crown()+productStrip('monthly-card',own?`Còn ${card.daysLeft} ngày`:`${x.days} ngày`,[],own)+
      laneHeads([['Mỗi ngày',`${x.days} ngày`,'free'],['Đá Ngọc','Giao dịch','gold'],['Đặc quyền','','jewel']])+
      buyButton('monthly-card','calendar',own?'Gia hạn':'Kích hoạt');
  }
  function fundTab(state){
    const x=product('growth-fund'),p=G.engine.read(),own=!!p.cards?.fund,[best,{level:top}]=Object.entries(p.heroes).sort((a,b)=>b[1].level-a[1].level)[0];
    let sum=0;const rows=O.GROWTH_FUND.map(f=>(sum+=f.gems,{level:f.level,badge:String(f.level),title:`Cấp tướng ${f.level}`,reached:top>=f.level,
      cells:[{picture:{src:file('face-'+best)||file('portrait-'+best),cap:'Cấp '+f.level,cls:'face'},state:top>=f.level?'claimed':'info',lane:0,frame:'reward-free',claim:'pass:detail',data:`data-title="Cấp tướng ${f.level}" data-reward='{}' data-why="${top>=f.level?'Đã đạt mốc.':`Tướng cao nhất cần cấp ${f.level} (đang ${top}).`}"`,level:f.level},
        {reward:{gems:f.gems},state:own?(top>=f.level?'ready':'level'):'track',lane:1,frame:'reward-gold',claim:'pass:detail',data:`data-title="Quỹ · cấp ${f.level}" data-reward='${JSON.stringify({gems:f.gems})}' data-why="Giao khi tướng cao nhất đạt cấp ${f.level}, sau khi mua quỹ · thanh toán sắp ra mắt."`},
        {picture:{src:art('fund-pouch'),cap:'Σ '+fmt(sum)},state:'info',lane:2,frame:'reward-jewel',claim:'pass:detail',data:`data-title="Quỹ · tới cấp ${f.level}" data-reward='${JSON.stringify({gems:sum})}' data-why="Tổng Đá Ngọc của quỹ tính tới mốc này."`}]}));
    const s=scroller('fund',rows,null,state),total=O.GROWTH_FUND.reduce((n,f)=>n+f.gems,0);
    return `<div class="pv-viewport" style="${box(40,768,872,556)}">${s.html}</div>`+crown()+productStrip('growth-fund',`${fmt(total)} Đá Ngọc`,[],own)+
      laneHeads([['Cấp tướng','Cao nhất','free'],['Đá Ngọc','Giao dịch','gold'],['Tích lũy','','jewel']])+buyButton('growth-fund','fund-pouch','Kích hoạt');
  }
  const buyButton=(id,icon,text)=>`<button type="button" class="pv-action primary two" data-action="pass:buy" data-product="${id}" style="${box(242,1346,456,104)}"><img class="pv-art" src="${art('action-primary')}" alt=""><img class="pv-actionicon" src="${art(icon)}" alt=""><span><b>${text} · ${vnd(product(id).price)}</b><small>Sắp ra mắt</small></span></button>`;
  // The season strip slot on the card tabs: name and price on the left, benefits as pictures, the plaque on the right.
  function productStrip(id,sub,perks,own){
    const x=product(id);
    return `<button type="button" class="pv-season pv-offer" data-action="pass:buy" data-product="${id}" style="${box(54,500,840,90)}" aria-label="${esc(x.name)} · ${vnd(x.price)}">`+
      `<img class="pv-art" src="${art('season-strip')}" alt=""><b class="pv-mua" style="${box(48,14,150,56)}">${esc(vnd(x.price).replace('.000đ','k'))}</b>`+
      `<b class="pv-lvl small" style="${box(236,16,560,56)}">${esc(x.name)}<small class="pv-sub">${esc(own?'Đang có hiệu lực':sub)}</small></b>`+
      perks.map(([icon,cap,t],i)=>`<span class="pv-perk small" style="${box(800-perks.length*86+i*86,4,80,82)}" title="${esc(t)}"><img src="${file(icon)}" alt=""><b>${esc(cap)}</b></span>`).join('')+`</button>`;
  }

  function build(el,state){
    if(!TABS.some(t=>t[0]===state.vipTab))state.vipTab='pass';
    el.innerHTML=`<img class="pv-sign" src="${art('title-sign')}" alt="" style="${box(262,112,416,122)}"><h2 class="pv-title" style="${box(312,160,316,60)}">VIP & Nạp</h2>`+
      vipStrip()+tabs(state)+({pass:passTab,monthly:monthlyTab,fund:fundTab}[state.vipTab])(state);
    requestAnimationFrame(()=>{for(const s of el.querySelectorAll('.pv-scroll')){const thumb=s.parentNode.querySelector('.pv-rail .pv-thumb');
      const sync=()=>{state[s.dataset.scroll]=s.scrollTop;if(thumb){const room=s.scrollHeight-s.clientHeight;thumb.style.top=(34+(room>0?s.scrollTop/room:0)*(544-68-80))+'px';}};
      s.scrollTop=Number(s.dataset.top)||0;sync();s.addEventListener('scroll',sync,{passive:true});}});
  }

  let ctxRef=null,stateRef=null;
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='vip')return p;
    const screen=L.screens.vip;screen.backgroundKey='vip';if(A['background-vip'])screen.background=A['background-vip'].file;
    screen.nodes=screen.nodes.filter(n=>n.id!=='vip.live'&&n.id!=='vip.back');
    screen.nodes.push({id:'vip.live',kind:'content',rect:[0,0,941,1490],className:'exploration-map pv',build:el=>build(el,state)});
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    ctxRef=ctx;stateRef=state;
    if(action==='journey:monthly'){state.vipTab='monthly';ctx.navigate('vip');return true;}
    if(!action.startsWith('pass:'))return handle(action,el,ctx,state);
    const d=el.dataset||{},cmd=action.slice(5);
    try{
      if(cmd==='tab'){state.vipTab=d.tab;ctx.render();}
      if(cmd==='vip')vipDialog();
      if(cmd==='season')seasonDialog();
      if(cmd==='detail')detailDialog(el);
      if(cmd==='detail-track'){const t=O.PASS.tracks.find(x=>x.id==='free');ctx.showModal('Nhánh '+t.name,[],'Miễn phí: mỗi cấp sổ đạt được mở một phần quà ở nhánh này.');}
      if(cmd==='buy')buyDialog(d.product);
      if(cmd==='claim'){const got=G.engine.claimPass(Number(d.level),d.track);ctx.render();G.showRewards?.(ctx,got,`Sổ Hành Trình · cấp ${d.level}`);}
      if(cmd==='claim-all'){const got=G.engine.claimPassAll();ctx.render();G.showRewards?.(ctx,got,'Sổ Hành Trình');}
    }catch(e){ctx.showModal('Chưa thể thực hiện',[],e.message);}
    return true;
  };
  window.GemwovenPassUI={vipDialog,buyDialog};
})();
