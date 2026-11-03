/* Depth pass in the hub (docs/GAME_DESIGN.md): the growth map ("Lộ trình"), the power breakdown
 * behind every Lực Chiến, greyed unowned heroes, the newbie week, and the Coming-soon VIP, card and
 * pass pages read from liveops.js. Rules and numbers come from progression.js; nothing is computed here.
 */
(() => {
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,A=window.GEMWOVEN_ASSETS,L=window.GEMWOVEN_LAYOUT,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G||!M)return;
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const img=(asset,cls='')=>`<img class="${cls}" src="${esc((A[asset]||A['icon-hero']).file)}" alt="" draggable="false">`;
  const vnd=n=>fmt(n)+' ₫',pct=x=>(x*100).toLocaleString('vi-VN',{maximumFractionDigits:1})+'%';
  const STATE={ready:'Làm được ngay',short:'Thiếu nguyên liệu',locked:'Chưa đủ điều kiện',max:'Đã tối đa'};
  const signed=(n,f)=>n>0?'+'+f(n):n<0?'−'+f(-n):'—';

  // ----- Dialogs -----
  function powerDialog(ctx,state,key){
    const p=G.engine.read();if(!p.heroes[key])return;
    const b=M.statBreakdown(p,key),t=b.total,name=M.HEROES[key].name;
    const modal=window.GemwovenUI.makeDialog('power-detail',name+' · Chi tiết lực chiến','growth-dialog');
    const rows=b.rows.map((r,i)=>`<tr class="${i&&!r.hp&&!r.attack&&!r.defense?'is-zero':''}"><td>${esc(r.label)}</td><td>${i?signed(r.hp,fmt):fmt(r.hp)}</td><td>${i?signed(r.attack,v=>'×'+v.toFixed(2)):'×'+r.attack.toFixed(2)}</td><td>${i?signed(r.defense,pct):pct(r.defense)}</td></tr>`).join('');
    modal.body.innerHTML=`<div class="power-hero">${img('portrait-'+key,'power-portrait')}<div><b>${fmt(t.power)}</b><small>${esc(b.formula)}</small></div></div>`+
      `<table class="gw-table power-table"><thead><tr><th>Nguồn</th><th>HP</th><th>Công</th><th>Thủ</th></tr></thead><tbody>${rows}</tbody>`+
      `<tfoot><tr><td>Tổng</td><td>${fmt(t.hp)}</td><td>×${t.attack.toFixed(2)}</td><td>${pct(t.defense)}</td></tr></tfoot></table>`+
      (b.capped?'<p class="growth-note">Thủ tối đa 50%: phần vượt không còn tác dụng.</p>':'')+
      `<p class="growth-note">Công là hệ số nhân sát thương mỗi viên ngọc kiếm và tuyệt kỹ. Thủ giảm sát thương nhận vào. Trong trận dùng đúng các số này.</p>`+
      `<h3 class="growth-sub">Cách tăng tiếp</h3>`+tips(p,key);
    const map=document.createElement('button');map.type='button';map.className='gw-btn';map.textContent='Lộ trình phát triển';map.onclick=()=>{modal.close();growthDialog(ctx,state,key);};
    modal.actions.append(map);wire(modal,ctx,state,key);modal.present();
  }
  function tips(p,key){
    const rows=M.growthMap(p,key).filter(r=>r.state==='ready').slice(0,3);
    if(!rows.length)return '<p class="growth-note">Chưa có bước nào làm được ngay: cày thêm nguyên liệu ở Khám Phá, Boss Vô Hạn và Kho Offline.</p>';
    return `<ul class="growth-tips">${rows.map(r=>`<li><span><b>${esc(r.name)}</b> ${esc(r.next)}</span><button type="button" class="gw-btn secondary" data-go="${esc(r.id)}">Đi tới</button></li>`).join('')}</ul>`;
  }
  function growthDialog(ctx,state,key){
    const p=G.engine.read();if(!p.heroes[key])return;
    const modal=window.GemwovenUI.makeDialog('growth-map',M.HEROES[key].name+' · Lộ trình phát triển','growth-dialog');
    modal.body.innerHTML=`<p class="growth-lead">Cấp và Sao là hai đường riêng. Tiến hóa cần cả hai, rồi mở nhánh kỹ năng. Sao mở hình thái. Trang bị, bảo bối chỉ cộng chỉ số, không đổi hình thái hay kỹ năng.</p>`+
      `<ol class="growth-map">${M.growthMap(p,key).map(r=>`<li class="growth-row is-${r.state}"><div class="growth-head"><b>${esc(r.name)}</b><em>${STATE[r.state]}</em></div>`+
        `<p class="growth-now">${esc(r.current)}</p><p class="growth-next">Tiếp theo: ${esc(r.next)}</p><p class="growth-opens">Mở ra: ${esc(r.opens)}</p>${r.need?`<p class="growth-need">${esc(r.need)}</p>`:''}`+
        (r.state==='max'?'':`<button type="button" class="gw-btn secondary" data-go="${esc(r.id)}">Đi tới</button>`)+`</li>`).join('')}</ol>`;
    wire(modal,ctx,state,key);modal.present();
  }
  // "Đi tới" lands on the screen and tab where that step is taken.
  function wire(modal,ctx,state,key){
    modal.body.addEventListener('click',e=>{
      const b=e.target.closest('[data-go]');if(!b)return;const row=M.growthMap(G.engine.read(),key).find(r=>r.id===b.dataset.go);if(!row)return;
      modal.close();state.hero=key;state.outfitSlot=null; // an open gear panel would cover the destination tab
      if(row.route==='forms'){G.handle('forms:gallery',{dataset:{hero:key}},ctx,state);return;}
      if(row.tab)state.upgradeTab=row.tab;if(row.skill!=null){state.skill=row.skill;state.skillFilter=String(row.skill);}
      ctx.navigate(row.route);
    });
  }

  // ----- Pages -----
  function newbieSection(){
    const days=G.engine.newbie();if(days.every(d=>d.claimed))return '';
    const name=id=>M.RESOURCES[id]?.[0]||id;
    return `<section class="newbie-week"><h3>Hành Trình Tân Thủ · 7 ngày</h3><p class="hint">Mỗi ngày một phần quà; lỡ ngày thì nhận bù. Đủ 80 Mảnh Hiro trong tuần đầu là lên 2 sao.</p>`+
      `<div class="newbie-days">${days.map(d=>`<article class="newbie-day${d.claimed?' is-claimed':d.open?' is-open':''}"><b>Ngày ${d.day}</b>${img('portrait-novice','newbie-portrait')}`+
        `<ul>${Object.entries(d.reward).map(([id,n])=>`<li>${esc(name(id))} ×${fmt(n)}</li>`).join('')}</ul>`+
        `<button type="button" class="game-btn" data-action="growth:newbie" data-day="${d.day}" ${d.open&&!d.claimed?'':'disabled'}>${d.claimed?'Đã nhận':d.open?'Nhận':'Chưa mở'}</button></article>`).join('')}</div></section>`;
  }
  function weeklySection(){
    const name=id=>M.RESOURCES[id]?.[0]||id,rows=G.engine.weekly();
    return `<section class="weekly-quests"><h3>Nhiệm Vụ Tuần</h3><p class="hint">Làm mới Thứ Hai 00:00 (GMT+7) · tuần từ ${esc(rows[0]?.week.split('-').reverse().join('/'))}</p>`+
      `<div class="cadence-grid">${rows.map(q=>`<article class="${q.claimed?'is-claimed':''}"><b>${esc(q.name)}</b><small>Tiến độ ${fmt(q.progress)} / ${fmt(q.target)}</small>`+
        `<ul>${Object.entries(q.reward).map(([id,n])=>`<li>${esc(name(id))} ×${fmt(n)}</li>`).join('')}</ul>`+
        `<button type="button" class="game-btn" data-action="growth:weekly" data-quest="${esc(q.id)}" ${!q.claimed&&q.progress>=q.target?'':'disabled'}>${q.claimed?'Đã nhận':q.progress>=q.target?'Nhận':'Chưa xong'}</button></article>`).join('')}</div></section>`;
  }
  // Sân Thử Luyện on the Boss Vô Hạn screen: today's tanky boss at the selected hero's level.
  function trialSection(p){
    const open=M.trialOpen(Date.now()),runs=p.daily.trialRuns||0,left=Math.max(0,M.TRIAL.rewarded-runs),hero=p.heroes[p.selected];
    const cards=M.TRIAL.chapters.map((c,i)=>{const e=M.trialEncounter(i+1,hero.level),today=open.includes(i+1),best=p.trial?.best?.[i+1]||0;
      return `<article class="trial-card${today?' is-open':''}"><b>${esc(e.enemyName)}</b><small>${['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu'][i]} · hệ ${esc({fire:'Hỏa',ice:'Băng',earth:'Mộc',lightning:'Lôi'}[e.enemyKey]||e.enemyKey)}</small>`+
        `<p>Kỷ lục: ${best?fmt(best)+` (${(best/e.enemyHp).toLocaleString('vi-VN',{maximumFractionDigits:1})} thanh)`:'chưa có'}</p>`+
        `<button type="button" class="game-btn" data-action="do:battle" data-mode="trial" data-index="${i+1}" ${today?'':'disabled'}>${today?'Thử sức':'Ngày khác'}</button></article>`;}).join('');
    return `<section class="trial-ground"><h3>Sân Thử Luyện</h3><p class="hint">Boss trâu không bao giờ ngã: hết thanh máu thì đứng dậy với thanh mới. ${M.TRIAL.turns} lượt, tính tổng sát thương. Boss ở đúng cấp tướng đang xuất chiến (${esc(M.HEROES[p.selected].name)} cấp ${hero.level}). `+
      `Lượt có thưởng hôm nay: <b>${left}/${M.TRIAL.rewarded}</b>, sau đó đánh thoải mái để thử tướng, vẫn ghi kỷ lục. Mốc thưởng: ½, 1, 2, 3, 5 thanh máu.</p><div class="cadence-grid">${cards}</div></section>`;
  }
  function cadenceSection(){
    if(!O)return '';
    return `<section class="cadence"><h3>Lịch sự kiện dự kiến · Sắp ra mắt</h3><div class="cadence-grid">${O.CADENCE.map(c=>`<article><b>${esc(c.name)}</b><small>Làm mới ${esc(c.reset)} (GMT+7)</small><ul>${c.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;
  }
  function vipPage(p){
    const card=id=>O.PRODUCTS.find(x=>x.id===id);
    const product=x=>`<article class="product-card"><header><b>${esc(x.name)}</b><span>${vnd(x.price)}</span></header><ul>${x.perks.map(k=>`<li>${esc(k)}</li>`).join('')}</ul><em>Sắp ra mắt</em></article>`;
    return `<header class="game-heading"><h2>VIP & Nạp</h2><p>Sắp ra mắt · Thanh toán và quyền lợi do máy chủ xác nhận. Chưa thu tiền.</p></header>`+
      `<p class="vip-now">VIP hiện tại: <b>${p.vip.level}</b> · Tổng nạp đã xác thực: <b>${vnd(p.vip.paidTotal)}</b></p>`+
      `<div class="product-grid">${['monthly-card','journey-pass','journey-pass-jewel','growth-fund'].map(id=>card(id)).filter(Boolean).map(product).join('')}</div>`+
      `<h3 class="growth-sub">Bậc VIP</h3><p class="hint">VIP chỉ thêm tiện lợi, tài nguyên ngày và trang trí, không cộng chỉ số chiến đấu. Giao dịch bị hoàn tiền sẽ bị thu hồi và tính lại VIP.</p>`+
      `<table class="gw-table vip-table"><thead><tr><th>VIP</th><th>Quyền lợi thêm</th><th>Tổng nạp</th></tr></thead><tbody>${O.VIP.map(v=>`<tr class="${p.vip.level>=v.level?'is-reached':''}"><td>${v.level}</td><td>${v.perks.map(esc).join(' · ')}</td><td>${vnd(v.spend)}</td></tr>`).join('')}</tbody></table>`+
      `<h3 class="growth-sub">Quỹ Trưởng Thành</h3><p class="hint">Mua một lần; mỗi mốc cấp tướng cao nhất mở một phần Đá Ngọc của gói đã mua.</p>`+
      `<div class="fund-row">${O.GROWTH_FUND.map(f=>`<span><b>Cấp ${f.level}</b>${fmt(f.gems)}</span>`).join('')}</div>`+
      `<h3 class="growth-sub">Sổ Hành Trình · 3 nhánh</h3><p class="hint">Mùa ${O.PASS.seasonDays} ngày, ${O.PASS.levels} cấp từ điểm nhiệm vụ (chơi đều đạt cấp 50 sau khoảng 20 ngày). Mua giữa mùa vẫn nhận ngay mọi phần thưởng của các cấp đã đạt. Sổ không chứa Đá Ngọc.</p>`+passTable();
  }
  // The three pass tracks at their milestone levels (every fifth level; the others give small materials).
  function passTable(){
    const label=r=>Object.entries(r).map(([k,n])=>`${fmt(n)} ${({fragmentChoice:'mảnh tướng tự chọn',epicGearChoice:'rương Sử Thi tự chọn',legendaryGearChoice:'rương Huyền Thoại tự chọn',seasonFrame:'khung mùa'})[k]||M.RESOURCES[k]?.[0]||k}`).join(' · ');
    const rows=[5,10,15,20,25,30,35,40,45,50].map(l=>`<tr><td>${l}</td>${O.PASS.tracks.map(t=>`<td>${esc(label(O.PASS[t.id](l)))}</td>`).join('')}</tr>`).join('');
    return `<table class="gw-table pass-table"><thead><tr><th>Cấp</th>${O.PASS.tracks.map(t=>`<th>${esc(t.name)}${t.product?`<small>${vnd(O.PRODUCTS.find(x=>x.id===t.product).price)}</small>`:'<small>Miễn phí</small>'}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`+
      `<p class="hint">Diệu Ngọc: +${O.PASS.jewelBonusLevels} cấp ngay khi mua (tính vào giới hạn ${O.PASS.boughtLevelsMax} cấp mua), danh hiệu mùa "${esc(O.PASS.seasonTitle)}". Mảnh tướng tự chọn chỉ cho tướng đã sở hữu, trừ Hiro. Rương Sử Thi/Huyền Thoại nhận khi đã qua ải ${O.PASS.gearGates.epicGearChoice}/${O.PASS.gearGates.legendaryGearChoice}.</p>`;
  }
  // Danh Hiệu: the collection with progress; wear one (shown over your head in Quảng Trường). Cosmetic only.
  function titlesSection(p){
    const list=M.titleList(p),got=list.filter(t=>t.unlocked).length;
    return `<section class="titles"><h3>Danh Hiệu <small>${got}/${list.length}</small></h3><p class="hint">Danh hiệu chỉ để trang trí và khoe ở Quảng Trường, không cộng chỉ số. Đeo một danh hiệu; danh hiệu đấu trường, mùa và Thư Hùng do máy chủ trao.</p>`+
      `<div class="title-grid">${list.map(t=>`<article class="title-card tier-${t.tier} ${t.unlocked?'is-open':''} ${t.worn?'is-worn':''}"><b class="title-name">${esc(t.name)}</b><small>${esc(t.source)}</small>`+
        (t.server?'<em>Máy chủ · Sắp ra mắt</em>':`<div class="title-bar"><i style="width:${Math.round(t.progress[0]/t.progress[1]*100)}%"></i><span>${fmt(t.progress[0])}/${fmt(t.progress[1])}</span></div>`)+
        (t.unlocked?`<button type="button" class="game-btn" data-action="growth:title" data-id="${t.worn?'':t.id}">${t.worn?'Bỏ đeo':'Đeo'}</button>`:'')+`</article>`).join('')}</div></section>`;
  }
  function monthlyCard(ctx){
    const x=O?.PRODUCTS.find(x=>x.id==='monthly-card');if(!x)return false;
    const modal=window.GemwovenUI.makeDialog('monthly-card','Thẻ Tháng · Sắp ra mắt','growth-dialog');
    modal.body.innerHTML=`<p class="growth-lead">${vnd(x.price)} cho ${x.days} ngày. Mua thêm khi còn hạn sẽ cộng dồn, tối đa ${x.stackMaxDays} ngày.</p><ul class="growth-tips">${x.perks.map(k=>`<li><span>${esc(k)}</span></li>`).join('')}</ul><p class="growth-note">Thanh toán mở cùng máy chủ. Đá Ngọc của thẻ là hàng của giao dịch, được ghi sổ cái máy chủ.</p>`;
    const more=document.createElement('button');more.type='button';more.className='gw-btn secondary';more.textContent='Xem VIP & gói nạp';more.onclick=()=>{modal.close();ctx.navigate('vip');};
    modal.actions.append(more);modal.present();return true;
  }

  // ----- Hooks -----
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state),screen=L.screens[state.screen];if(!screen)return p;
    const nodes=screen.nodes;
    if(state.screen==='home'){const power=nodes.find(n=>n.id==='home.power');if(power){power.action='growth:power';power.data={hero:p.selected};}}
    if(state.screen==='upgrade'&&p.heroes[state.hero]){
      for(const [flag,label,action,text,labelRect] of [['upgrade.left-story-flag','upgrade.upgrade-story','growth:map','Lộ trình\nphát triển\n›',[16,62,140,190]],['upgrade.right-story-flag','upgrade.potential','growth:power','Chỉ số\nchi tiết\n›',[10,48,92,140]]]){
        const n=nodes.find(x=>x.id===flag);if(!n)continue;const key=flag+'-label';C[key]=text;
        Object.assign(n,{kind:'button',action,data:{hero:state.hero},text:key,labelRect,size:24,className:((n.className||'')+' growth-flag').trim()});
        screen.nodes=screen.nodes.filter(x=>x.id!==label);
      }
    }
    // Unowned heroes stay listed (they are what you collect) but read as locked.
    for(const n of screen.nodes){
      const key=/^(upgrade\.choose-|skills\.roster-)/.test(n.id)?n.data?.hero||n.id.split(/choose-|roster-/)[1]:null;
      if(key&&M.HEROES[key]&&!p.heroes[key]&&!/hero-unowned/.test(n.className||''))n.className=((n.className||'')+' hero-unowned').trim();
    }
    const live=screen.nodes.find(n=>n.id===state.screen+'.live');
    if(live&&state.screen==='events'){const build=live.build;live.build=el=>{build(el);const sub=el.querySelector('.game-heading p'),week=newbieSection();if(sub&&week)sub.textContent='Hành Trình Tân Thủ đang mở · Sự kiện theo mùa sắp ra mắt.';el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',week+weeklySection());el.insertAdjacentHTML('beforeend',cadenceSection());};}
    if(live&&state.screen==='boss'){const build=live.build;live.build=el=>{build(el);el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',trialSection(G.engine.read()));};}
    if(live&&state.screen==='vip'&&O)live.build=el=>{el.innerHTML=vipPage(G.engine.read());};
    if(live&&state.screen==='rankings'){const build=live.build;live.build=el=>{build(el);el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',titlesSection(G.engine.read()));};}
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    const hero=el?.dataset?.hero||state.hero||G.engine.read().selected;
    if(action==='growth:power'){powerDialog(ctx,state,hero);return true;}
    if(action==='growth:map'){growthDialog(ctx,state,hero);return true;}
    if(action==='growth:newbie'){try{const got=G.engine.claimNewbie(Number(el.dataset.day));ctx.render();G.showRewards(ctx,got,'Quà Tân Thủ');}catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}return true;}
    if(action==='growth:title'){try{G.engine.wearTitle(el.dataset.id||null);ctx.render();}catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}return true;}
    if(action==='growth:weekly'){try{const got=G.engine.claimWeekly(el.dataset.quest);ctx.render();G.showRewards(ctx,got,'Thưởng nhiệm vụ tuần');}catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}return true;}
    if(action==='journey:monthly'&&monthlyCard(ctx))return true;
    return handle(action,el,ctx,state);
  };
  window.GemwovenGrowthUI={powerDialog,growthDialog};
})();
