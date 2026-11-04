/* Mika's season (owner 04/11, Claude + Codex "Vòng Mùa của tướng", GAME_DESIGN §20): the Sổ Hành Trình tab as
 * "Hành Trình Của X" (layout F, mockup assets/gemwoven/raw/season-mika/mockup/pass-mockup-1.png, Codex 8/10), the
 * "Đồng Hành Cùng X" event page opened from Sự Kiện (event-mockup-1.png, Codex 8.5/10), and the cosmetics collection
 * with "Trang bị". Rules live in progression.js (pass, companion, cosmetics) and liveops.js (SEASONS, HERO_PASS,
 * COMPANION, COSMETICS); every frame here is drawn art in assets/gemwoven/season/<hero>, words and numbers are the HTML
 * layer on top. Boxes are in the 941x1672 stage. Payment is a future server feature: paid tracks stay Sắp ra mắt.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS;
  if(!G?.decorate||!G.engine?.companion||!O?.COMPANION)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),file=k=>A[k]?.file||'',vnd=n=>fmt(n)+'đ';
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  // The active season's own art (assets/gemwoven/season/<art>), shared pieces fall back to the first season's set.
  let ART='mika',HERO='fire';const use=season=>{const h=O.seasonHero(season);ART=h?.art||'mika';HERO=h?.hero||'fire';};const S=k=>file('season-'+ART+'-'+k)||file('season-mika-'+k),artOf=season=>O.seasonHero(season)?.art||'mika',VP=k=>`assets/gemwoven/vip-pass/${k}.webp`;
  const heroArt=key=>`assets/gemwoven/items/hero-${key}.png`;
  const heroName=key=>M.HEROES[key]?.name||'';
  const cos=id=>O.COSMETICS.find(c=>c.id===id);
  const playerName=()=>{try{return JSON.parse(localStorage.getItem('gemwoven.plaza.v1')||'{}').name||'Lữ Khách';}catch{return 'Lữ Khách';}};
  // Green when enough, red when short (owner: numbers, not words).
  const pair=(a,b)=>`<b class="sz-num ${a>=b?'ok':'short'}">${fmt(a)}/${fmt(b)}</b>`;

  // ----- Pictures of the season's rewards -----
  // mini: a thumbnail without the sample words.
  function look(slot,c,big,mini){
    const f=c?.file||'';
    if(slot==='avatar')return `<span class="sz-look sz-ava"><img src="${f}" alt=""></span>`;
    if(slot==='frame')return `<span class="sz-look sz-frame"><img class="in" src="${S('avatar')}" alt=""><img src="${f}" alt=""></span>`;
    if(slot==='title')return `<span class="sz-look sz-title"><img src="${f}" alt="">${mini?'':`<b>${esc(c.name)}</b>`}</span>`;
    if(slot==='nameplate')return `<span class="sz-look sz-plate"><img src="${f}" alt="">${mini?'':`<b>${esc(playerName())}</b>`}</span>`;
    if(slot==='bubble')return `<span class="sz-look sz-bubble"><img src="${f}" alt="">${mini?'':'<b>Chào!</b>'}</span>`;
    if(slot==='combatFrame')return `<span class="sz-look sz-combat"><img class="bg" src="${file('battle-card-forest')||'assets/gemwoven/backgrounds/battles/bamboo.webp'}" alt=""><img class="hero" src="${heroArt(HERO)}" alt=""><img class="tl" src="${f}" alt=""><img class="tr" src="${f}" alt=""></span>`;
    if(slot==='entry')return `<span class="sz-look sz-entry"><img class="bg" src="${file('battle-card-abyss')||file('battle-card-forest')||'assets/gemwoven/backgrounds/battles/bamboo.webp'}" alt=""><span class="fx" style="background-image:url('${f}')"></span>${big?'':`<img class="play" src="${S('play')}" alt="">`}</span>`;
    return '';
  }
  const fragPic=(hero,n)=>`<span class="sz-frag"><img src="${file('fragment-'+hero)||file('hero-fragment')}" alt=""><b>×${fmt(n)}</b></span>`;
  const resPic=(id,n)=>`<span class="sz-res"><img src="${file(M.RESOURCES[id]?.[1]||id)||file('chest')}" alt=""><b>${n>=10000?M.compact(n,10000):fmt(n)}</b></span>`;
  const EXTRA={epicGearChoice:'chest',legendaryGearChoice:'chest'};

  // ----- Sổ Hành Trình: "Hành Trình Của X" -----
  const VX=22,VY=956,VW=897,VH=380,LANE=[106,360,614],CW=244,ROW=112,STAR=166;
  function cell(v,r,track,lane){
    const c=r[track],rw=c.reward,star=v.milestones.includes(r.level),hero=v.hero.hero;
    const h=(star?STAR:ROW)-12,ready=c.state==='ready';
    const main=rw.cosmetic?look(rw.cosmetic,O.seasonCosmetic(v.season,rw.cosmetic)):rw.seasonFragments&&star?fragPic(hero,rw.seasonFragments):'';
    const rest=Object.entries(rw).filter(([k,n])=>k!=='cosmetic'&&!(k==='seasonFragments'&&main)&&n>0);
    const items=rest.map(([k,n])=>k==='seasonFragments'?fragPic(hero,n):EXTRA[k]?resPic(EXTRA[k],n):resPic(k,n));
    const name=rw.cosmetic?O.seasonCosmetic(v.season,rw.cosmetic)?.name:'';
    return `<button type="button" class="pv-socket sz-socket lane-${lane} is-${c.state} ${main?'has-pic':''}" data-action="${ready?'pass:claim':'season:detail'}" data-level="${r.level}" data-track="${track}" style="${box(LANE[lane],6,CW,h)}" aria-label="Cấp ${r.level}${name?' · '+esc(name):''}">`+
      `<span class="pv-tray" style="border-image-source:url('${VP('cell-'+track)}')"></span>`+
      (main?`<span class="sz-main">${main}</span>`:'')+`<span class="sz-items n${items.length} ${main?'small':''}">${items.slice(0,main?3:2).join('')}</span>`+
      (c.state==='claimed'?`<img class="pv-mark" src="${VP('claimed-check')}" alt="Đã nhận">`:'')+
      (c.state==='stage'?`<span class="pv-gate"><img src="${VP('gate-tag')}" alt=""><b>Ải ${c.gate}</b></span>`:'')+
      (ready?`<span class="pv-claim"><img src="${VP('claim-button')}" alt=""><b>Nhận</b></span>`:'')+`</button>`;
  }
  function rows(v){
    let y=0;const out=[],at={};
    for(const r of v.rows){const star=v.milestones.includes(r.level),h=star?STAR:ROW,cur=r.level===v.level;at[r.level]=y;
      out.push(`<div class="pv-row sz-row ${star?'is-star':''} ${r.reached?'is-reached':''} ${cur?'is-current':''}" style="${box(0,y,VW,h)}">`+
        `<span class="pv-medal ${cur?'is-current':''}" style="${box(4,h/2-(star?44:32),92,star?88:64)}"><img src="${VP(cur?'medal-current':'medal')}" alt=""><b>${star?'★':''}${r.level}</b></span>`+
        ['free','gold','jewel'].map((t,i)=>cell(v,r,t,i)).join('')+`</div>`);
      y+=h;}
    return {html:out.join(''),height:y+12,at};
  }
  function passTab(state){
    const v=G.engine.pass();if(!v?.hero)return null;use(v.season);
    const hero=v.hero.hero,list=rows(v),next=v.milestones.find(l=>l>v.level)||50;
    const jewelPrice=O.PRODUCTS.find(p=>p.id==='journey-pass-jewel')?.price,goldPrice=O.PRODUCTS.find(p=>p.id==='journey-pass')?.price;
    const nextCos=v.rows[next-1]?.gold.reward.cosmetic||v.rows[next-1]?.jewel.reward.cosmetic||v.rows[next-1]?.free.reward.cosmetic;
    const first=v.rows.find(r=>['free','gold','jewel'].some(t=>r[t].state==='ready')),focus=first?first.level:Math.max(1,v.level);
    const top=state['vipScroll-season']??Math.max(0,list.at[focus]-4);
    const lockFrom=!v.owned.gold&&!v.owned.jewel?1:!v.owned.jewel?2:0;
    const bandX=VX+LANE[lockFrom||1];
    return `<button type="button" class="sz-banner" data-action="season:offer" style="${box(40,472,861,222)}" aria-label="${esc(v.hero.name)} · Diệu Ngọc nhận ${esc(heroName(hero))} ngay · Sắp ra mắt">`+
        `<img class="pv-art" src="${S('banner')}" alt=""><img class="sz-hero" src="${heroArt(hero)}" alt="">`+
        `<b class="sz-name">${esc(v.hero.name).replace(/^(Hành Trình) /,'$1<br>')}</b>`+
        `<span class="sz-seal"><img src="${S('emblem')}" alt=""></span><span class="sz-mua"><img src="${VP('status-plaque')}" alt=""><b>Mùa ${v.season+1}</b></span>`+
        `<span class="sz-days"><img src="${VP('hourglass')}" alt=""><b>${v.daysLeft} ngày</b></span>`+
        `<span class="sz-offer"><img src="${S('offer')}" alt=""><b>Diệu Ngọc · nhận ${esc(heroName(hero))} ngay</b><em><img src="assets/gemwoven/forge/lock.webp" alt="">Sắp ra mắt</em></span></button>`+
      `<button type="button" class="sz-level" data-action="pass:season" style="${box(40,700,861,58)}" aria-label="Cấp ${v.level}/${v.max} · ${v.into}/${v.per} điểm">`+
        `<span class="sz-lv"><img src="${file('kit-plaque')||VP('status-plaque')}" alt=""><b>Cấp ${v.level}/${v.max}</b></span>`+
        `<span class="sz-trough ${v.level>=v.max?'full':'short'}"><img src="${VP('activity-trough')}" alt=""><em style="width:${(v.level>=v.max?100:v.into/v.per*100).toFixed(1)}%"><img src="${VP('activity-fill')}" alt=""></em>${v.level>=v.max?'<b class="sz-num ok">Tối đa</b>':pair(v.into,v.per)}</span>`+
        `<span class="sz-next">${nextCos?look(nextCos,O.seasonCosmetic(v.season,nextCos),false,nextCos==='title'):fragPic(hero,0)}<b>★${next}</b></span></button>`+
      `<div class="sz-pills" style="${box(40,764,620,56)}">${v.milestones.map(l=>`<button type="button" class="sz-pill ${l<=v.level?'on':''}" data-action="season:jump" data-level="${l}" aria-label="Đến mốc ${l}"><img src="${S(l<=v.level?'pill-on':'pill')}" alt=""><b>${l}</b></button>`).join('')}</div>`+
      `<button type="button" class="sz-wardrobe-btn" data-action="season:wardrobe" style="${box(668,760,233,62)}"><img class="pv-art" src="${VP('action-secondary')}" alt=""><img class="ic" src="${S('wardrobe')}" alt=""><b>Bộ sưu tập</b></button>`+
      `<span class="pv-head2 head-free sz-head" style="${box(VX+LANE[0],828,CW,96)}"><img class="pv-art" src="${VP('head2-free')}" alt=""><b>Thường</b></span>`+
      `<button type="button" class="pv-head2 head-gold sz-head" data-action="pass:buy" data-product="journey-pass" style="${box(VX+LANE[1],824,CW,104)}" aria-label="Nhánh Vàng · ${vnd(goldPrice)}"><img class="pv-art" src="${VP('head2-gold')}" alt=""><b>Vàng</b><small class="${v.owned.gold?'own':''}">${v.owned.gold?'Đã mở':vnd(goldPrice)}</small></button>`+
      `<button type="button" class="pv-head2 head-jewel sz-head" data-action="pass:buy" data-product="journey-pass-jewel" style="${box(VX+LANE[2],824,CW,104)}" aria-label="Nhánh Diệu Ngọc · gồm Vàng · ${vnd(jewelPrice)}"><img class="pv-art" src="${VP('head2-jewel')}" alt=""><b>Diệu Ngọc</b><small class="${v.owned.jewel?'own':''}">${v.owned.jewel?'Đã mở':vnd(jewelPrice)}</small><img class="sz-nested" src="${S('tier-nested')}" alt=""><i class="sz-incl">Gồm Vàng</i></button>`+
      (lockFrom?`<button type="button" class="pv-band sz-band" data-action="pass:buy" data-product="${lockFrom===2?'journey-pass-jewel':'journey-pass'}" style="${box(bandX,926,VX+LANE[2]+CW-bandX,30)};border-image-source:url('${VP('lock-band')}')"><b><img src="assets/gemwoven/forge/lock.webp" alt="">Sắp ra mắt</b></button>`:'')+
      `<div class="pv-viewport sz-viewport" style="${box(VX,VY,VW,VH)}"><div class="pv-scroll" data-scroll="vipScroll-season" data-top="${top}" style="${box(0,0,VW,VH)}">`+
        `<div class="pv-rows sz-rows" style="height:${list.height}px;background-image:url('${VP('trunk-tile')}')">${list.html}</div></div>`+
        `<span class="pv-rail" style="${box(868,6,14,VH-12)}"><img class="pv-railbar" src="${VP('scroll-rail')}" alt=""><img class="pv-up" src="${VP('scroll-arrow')}" alt=""><img class="pv-down" src="${VP('scroll-arrow')}" alt=""><img class="pv-thumb" src="${VP('scroll-thumb')}" alt=""></span></div>`+
      `<button type="button" class="pv-action secondary" data-action="route:quests" style="${box(52,1350,300,104)}"><img class="pv-art" src="${VP('action-secondary')}" alt=""><img class="pv-actionicon" src="${VP('journey-book')}" alt=""><b>Nhiệm vụ</b></button>`+
      `<button type="button" class="pv-action primary" data-action="pass:claim-all" ${v.ready?'':'disabled'} style="${box(372,1346,524,112)}"><img class="pv-art" src="${VP('action-primary')}" alt=""><img class="pv-actionicon" src="${VP('gift')}" alt=""><b>${v.ready?`Nhận tất cả · ${v.ready}`:'Chưa có quà'}</b></button>`;
  }
  function jump(state,level,el){
    const v=G.engine.pass(),list=rows(v),s=el.closest('.exploration-map')?.querySelector('[data-scroll="vipScroll-season"]');
    const y=Math.max(0,list.at[level]-4);state['vipScroll-season']=y;if(s)s.scrollTo({top:y,behavior:window.GemwovenMotion?.reduced?'auto':'smooth'});
  }
  function detailDialog(level,track){
    const v=G.engine.pass(),r=v.rows[level-1],c=r[track],t=O.PASS.tracks.find(x=>x.id===track),hero=v.hero.hero;use(v.season);
    const modal=window.GemwovenUI.makeDialog('season-detail',`Cấp ${level} · ${t.name}`,'growth-dialog pv-dialog sz-dialog');
    const parts=Object.entries(c.reward).map(([k,n])=>k==='cosmetic'?(()=>{const x=O.seasonCosmetic(v.season,n);return `<span class="sz-big">${look(n,x,true)}<small>${esc(x?.name||'')}</small><i>Trang trí · không chỉ số</i></span>`;})():
      k==='seasonFragments'?`<span>${fragPic(hero,n)}<small>Mảnh ${esc(heroName(hero))}</small></span>`:`<span>${resPic(EXTRA[k]||k,n)}<small>${esc(M.RESOURCES[k]?.[0]||({epicGearChoice:'Rương Sử Thi tự chọn',legendaryGearChoice:'Rương Huyền Thoại tự chọn'})[k]||k)}</small></span>`);
    const why={claimed:'Đã nhận.',level:`Đạt cấp sổ ${level} (còn ${fmt(Math.max(0,level*v.per-v.points))} điểm).`,track:`Nhánh ${t.name} · thanh toán Sắp ra mắt.`,stage:`Qua ải ${c.gate} để mở rương.`,ready:''}[c.state];
    modal.body.innerHTML=`<div class="sz-detail">${parts.join('')}</div>${why?`<p class="pv-why">${esc(why)}</p>`:''}`;
    modal.present();
  }
  function offerDialog(){
    const v=G.engine.pass(),x=O.PRODUCTS.find(p=>p.id==='journey-pass-jewel'),hero=v.hero.hero;use(v.season);
    const modal=window.GemwovenUI.makeDialog('season-offer',`Diệu Ngọc · ${heroName(hero)}`,'growth-dialog pv-dialog sz-dialog');
    modal.body.innerHTML=`<div class="sz-offer-sheet"><img class="hero" src="${heroArt(hero)}" alt=""><ul>`+
      `<li><img src="${file('fragment-'+hero)}" alt=""><b>${esc(heroName(hero))} ngay khi mua</b></li>`+
      `<li><img src="${S('tier-nested')}" alt=""><b>Gồm nhánh Vàng</b></li>`+
      `<li>${look('combatFrame',O.seasonCosmetic(v.season,'combatFrame'))}<b>Khung trận · cấp 25</b></li>`+
      `<li>${look('entry',O.seasonCosmetic(v.season,'entry'),true)}<b>Hiệu ứng vào trận · cấp 40</b></li>`+
      `<li>${fragPic(hero,80)}<b>Cấp 50</b></li></ul></div>`+
      `<p class="pv-price">${vnd(x.price)} · đã có Vàng bù ${vnd(x.upgradePrice)}</p><p class="pv-why"><img src="${VP('status-plaque')}" alt="">Sắp ra mắt · chưa thu tiền. ${esc(heroName(hero))} được giao khi máy chủ xác nhận thanh toán.</p>`;
    modal.present();
  }

  // ----- Bộ sưu tập: the season's seven pieces, "Trang bị" for the owned ones -----
  const SOURCE={free:'Thường',gold:'Vàng',jewel:'Diệu Ngọc'};
  function wardrobe(ctx){
    const modal=window.GemwovenUI.makeDialog('season-wardrobe','Bộ sưu tập','growth-dialog pv-dialog sz-dialog sz-wardrobe');
    const draw=()=>{const list=G.engine.cosmetics();
      modal.body.innerHTML=`<p class="sz-tag"><img src="${S('emblem')}" alt="">Trang trí · không chỉ số</p><div class="sz-grid">${list.map(c=>
        `<div class="sz-card ${c.owned?'owned':'locked'} ${c.worn?'worn':''}">${look(c.slot,c,true,true)}<b>${esc(c.name)}</b>`+
        (c.owned?`<button type="button" class="game-btn ${c.worn?'secondary':'kp-gold'}" data-wear="${c.worn?'':c.id}" data-slot="${c.slot}">${c.worn?'Tháo':'Trang bị'}</button>`:
          `<small><img src="assets/gemwoven/forge/lock.webp" alt="">${SOURCE[c.track]} · ★${c.level}</small>`)+`</div>`).join('')}</div>`;
      modal.body.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{try{G.engine.wearCosmetic(b.dataset.wear||null,b.dataset.slot);draw();ctx.render();}catch(e){ctx.showModal('Chưa thể trang bị',[],e.message);}});};
    draw();modal.present();
  }

  // ----- Đồng Hành Cùng X (a page of Sự Kiện) -----
  const TILE=[118,112],TX=i=>44+(i%7)*(TILE[0]+5);
  const MARK={taken:'mark-claimed',missed:'mark-missed',future:'mark-future',today:'mark-today'};
  function tile(s,i,y,hero,mat){
    const st=s.state;
    const reward=mat?Object.entries(s.reward).map(([k,n])=>`<span class="m"><img src="${file(M.RESOURCES[k]?.[1]||k)}" alt=""><b>${n}</b></span>`).join(''):`<img class="f" src="${file('fragment-'+hero)}" alt=""><b class="x">×${s.reward.heroFragments}</b>`;
    return `<span class="sz-day is-${st} ${mat?'mat':''}" style="${box(TX(i),y,TILE[0],TILE[1])}" aria-label="Ngày ${s.day}"><img class="pv-art" src="${S(st==='ready'?'day-ready':'day')}" alt="">`+
      `<b class="n">${s.day}</b><span class="r">${reward}</span>`+
      (MARK[st]?`<img class="mk" src="${S(MARK[st])}" alt="">`:'')+(s.catchup?`<img class="mk cu" src="${S('mark-catchup')}" alt="Đã bù">`:'')+`</span>`;
  }
  function taskRow(t,y,hero,from,today,mat){
    const open=today>=from,icon=t.id==='campaign'?file('icon-quest'):file('nav-arena');
    const reward=mat?Object.entries(t.reward).map(([k,n])=>`<img src="${file(M.RESOURCES[k]?.[1]||k)}" alt=""><b>${n>=1000?M.compact(n,1000):n}</b>`).join(''):`<img src="${file('fragment-'+hero)}" alt=""><b>×${t.reward.heroFragments}</b>`;
    return `<span class="sz-task is-${t.state} ${open?'':'is-soon'}" style="${box(196,y,690,60)}"><img class="ic" src="${icon}" alt=""><b class="t">${t.id==='campaign'?'Vượt ải':'Trùm Vô Tận'}</b>`+
      (open?pair(t.progress,t.target):`<b class="sz-num">0/${t.target}</b>`)+`<i class="arr">»</i><span class="rw">${reward}</span>`+
      (t.state==='taken'?`<img class="mk" src="${S('mark-claimed')}" alt="Đã nhận">`:t.state==='ready'?`<img class="mk" src="${VP('claim-button')}" alt="Sẵn sàng">`:!open?`<img class="mk" src="${S('mark-future')}" alt="Chưa mở">`:'')+`</span>`;
  }
  function companionPage(state){
    const v=G.engine.companion();if(v)use(v.season);if(!v||!v.hero&&v.phase!=='materials')return `<p class="sz-empty">Mùa này chưa có sự kiện tướng.</p>`;
    const hero=v.hero||'fire',p=G.engine.read(),tab=state.seasonTab||(v.phase==='materials'?'mat':'hero'),mat=tab==='mat';
    const daily=Math.min(3,p.daily.claimed.length),pv=G.engine.pass();
    const passFr=pv?.rows.filter(r=>r.free.reward.seasonFragments&&r.free.state==='claimed').length*4||0;
    const slots=mat?v.materials.slots:v.slots,tasks=mat?v.materials.tasks:v.tasks,chFrom=mat?O.COMPANION.materials.chapters:O.COMPANION.chapters;
    const held=v.fragments.held,can=held>=80;
    const missed=v.slots.find(s=>s.state==='missed');
    return `<img class="sz-ribbon" src="${S('title')}" alt="" style="${box(110,116,620,124)}"><h2 class="sz-pagetitle" style="${box(240,138,470,70)}">${esc(v.name||'Sự kiện mùa')}</h2>`+
      `<div class="sz-goal" style="${box(40,246,861,282)}"><img class="pv-art" src="${S('banner')}" alt=""><img class="sz-hero" src="${heroArt(hero)}" alt="">`+
        `<img class="frag" src="${file('fragment-'+hero)}" alt="">${pair(held,80).replace('sz-num','sz-num big')}`+
        `<button type="button" class="sz-fuse ${can?'on':''}" data-action="season:fuse" ${can?'':'disabled'}><img src="${file(can?'kit-btn-gold':'kit-btn-steel')||VP('action-secondary')}" alt=""><b>${v.fragments.owned?'Ghép bản sao':'Ghép '+esc(heroName(hero))}</b></button>`+
        `<button type="button" class="sz-src a" data-action="season:sources"><img src="${S('src-pass')}" alt=""><b>${passFr}/20</b></button>`+
        `<button type="button" class="sz-src b" data-action="season:sources"><img src="${S('src-event')}" alt=""><b>${v.fragments.taken}/${v.fragments.total}</b></button></div>`+
      `<button type="button" class="sz-phase ${mat?'':'on'}" data-action="season:tab" data-tab="hero" style="${box(40,536,424,66)}"><img src="${file(mat?'kit-tab':'kit-tab-on')||VP('tab-idle')}" alt=""><b>1–14 · ${esc(heroName(hero))}</b></button>`+
      `<button type="button" class="sz-phase ${mat?'on':''}" data-action="season:tab" data-tab="mat" style="${box(477,536,424,66)}"><img src="${file(mat?'kit-tab-on':'kit-tab')||VP('tab-idle')}" alt=""><b>15–28 · Nguyên liệu</b>${v.day<O.COMPANION.materials.from?`<img class="clk" src="${S('mark-future')}" alt="">`:''}</button>`+
      `<div class="sz-strip" style="${box(40,610,861,54)}"><b class="d">Ngày ${Math.min(v.day,v.until)}/${v.until}</b><img class="ic" src="${file('icon-quest')}" alt="">${pair(daily,3)}<i class="arr">»</i>`+
        (mat?Object.entries(O.COMPANION.materials.daily).map(([k,n])=>`<img class="rw" src="${file(M.RESOURCES[k]?.[1]||k)}" alt=""><b class="x">×${n}</b>`).join(''):`<img class="rw" src="${file('fragment-'+hero)}" alt=""><b class="x">×${O.COMPANION.daily.fragments}</b>`)+`</div>`+
      slots.map((s,i)=>tile(s,i,672+Math.floor(i/7)*(TILE[1]+6),hero,mat)).join('')+
      (!mat&&v.phase!=='done'?`<div class="sz-catch" style="${box(40,912,861,64)}"><img class="ic" src="${S('mark-catchup')}" alt=""><b class="t">Làm bù</b>`+
        (v.catchup.usedToday?`<b class="sz-num ok">✓</b>`:pair(v.catchup.wins,v.catchup.need))+`<img class="sw" src="${file('kit-icon-swords')||file('nav-arena')}" alt=""><i class="arr">»</i>`+
        (missed?`<span class="miss"><img src="${S('mark-missed')}" alt=""><b>${missed.day}</b></span>`:`<img class="ok" src="${S('mark-claimed')}" alt="Không có ngày lỡ">`)+`</div>`:'')+
      chFrom.map((from,i)=>{const y=986+i*170,list=tasks.filter(t=>t.chapter===i);
        return `<div class="sz-chapter" style="${box(40,y,861,160)}"><img class="pv-art" src="${file('kit-parchment')||VP('cell-free')}" alt=""><span class="med"><img src="${S('emblem')}" alt=""><b>Chương ${i+1}</b><small>Ngày ${from}</small></span></div>`+
          list.map((t,k)=>taskRow(t,y+16+k*68,hero,from,v.day,mat)).join('');}).join('')+
      `<button type="button" class="pv-action primary" data-action="season:claim" ${v.ready?'':'disabled'} style="${box(206,1346,530,112)}"><img class="pv-art" src="${VP('action-primary')}" alt=""><img class="pv-actionicon" src="${file('fragment-'+hero)}" alt=""><b>${v.ready?`Nhận · ${v.ready}`:'Chưa có quà'}</b></button>`;
  }
  // Sự Kiện list: the season's event card above the other sections.
  function entryCard(){
    const v=G.engine.companion();if(!v||!v.hero||v.phase==='done')return '';const hero=v.hero;use(v.season);
    return `<button type="button" class="sz-entry" data-action="season:companion" aria-label="${esc(v.name)}"><img class="bg" src="${S('banner')}" alt=""><img class="hero" src="${heroArt(hero)}" alt="">`+
      `<b class="t">${esc(v.name)}</b><span class="fr"><img src="${file('fragment-'+hero)}" alt="">${v.fragments.owned?'<b class="sz-num ok">✓</b>':pair(v.fragments.held,80)}</span>`+
      `<span class="dl"><img src="${VP('hourglass')}" alt=""><b>${v.daysLeft} ngày</b></span>${v.ready?`<em class="kp-seal">${v.ready}</em>`:''}</button>`;
  }
  function sourcesDialog(){
    const v=G.engine.companion(),pv=G.engine.pass(),hero=v.hero;
    const passFr=pv?.rows.filter(r=>r.free.reward.seasonFragments&&r.free.state==='claimed').length*4||0;
    const modal=window.GemwovenUI.makeDialog('season-sources',`Mảnh ${heroName(hero)}`,'growth-dialog pv-dialog sz-dialog');
    modal.body.innerHTML=`<ul class="sz-sources"><li><img src="${S('src-pass')}" alt=""><b>Sổ Hành Trình</b>${pair(passFr,20)}</li><li><img src="${S('src-event')}" alt=""><b>${esc(v.name)}</b>${pair(v.fragments.taken,v.fragments.total)}</li>`+
      `<li><img src="${file('fragment-'+hero)}" alt=""><b>Đang giữ</b>${pair(v.fragments.held,80)}</li></ul>`;
    const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent='Sổ Hành Trình';go.onclick=()=>{modal.close();stateRef.vipTab='pass';ctxRef.navigate('vip');};
    modal.actions.append(go);modal.present();
  }

  // ----- Wiring -----
  let ctxRef=null,stateRef=null;
  window.GemwovenSeasonUI={passTab,look};
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);
    if(state.screen!=='events'){state.seasonPage=null;return p;}
    const screen=L.screens.events;
    if(state.seasonPage==='companion'){
      // Its own drawn courtyard (ui.js reads background-<backgroundKey>); the list keeps the Sự Kiện painting.
      const bg=A[`season-${artOf(G.engine.companion()?.season)}-event-bg`]||A['season-mika-event-bg'];if(bg){A['background-season-companion']=bg;screen.backgroundKey='season-companion';}
      screen.nodes=screen.nodes.filter(n=>!/^events\.(live|back)$/.test(n.id));
      screen.nodes.push({id:'events.live',kind:'content',rect:[0,0,941,1490],className:'exploration-map pv sz-page',build:el=>{el.innerHTML=companionPage(state);}});
      screen.nodes.push({id:'events.season-back',kind:'button',rect:[790,120,112,112],asset:A['kit-back']?'kit-back':'map-back',fit:'contain',text:'events.season-back',labelHidden:true,action:'season:back',className:'panel-back'});
      return p;
    }
    if(screen.backgroundKey==='season-companion')delete screen.backgroundKey;
    const live=screen.nodes.find(n=>n.id==='events.live');
    if(live){const build=live.build;live.build=el=>{build(el);const card=entryCard();if(card)(el.querySelector('.game-heading')||el.firstElementChild)?.insertAdjacentHTML('afterend',card);};}
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    ctxRef=ctx;stateRef=state;
    if(!action.startsWith('season:'))return handle(action,el,ctx,state);
    const d=el?.dataset||{},cmd=action.slice(7);
    try{
      if(cmd==='companion'){state.seasonPage='companion';state.seasonTab=null;ctx.render();}
      if(cmd==='back'){state.seasonPage=null;ctx.render();}
      if(cmd==='tab'){state.seasonTab=d.tab;ctx.render();}
      if(cmd==='claim'){const got=G.engine.claimCompanion();ctx.render();G.showRewards?.(ctx,got,G.engine.companion()?.name||'Sự kiện mùa');}
      if(cmd==='fuse'){const v=G.engine.companion(),had=v.fragments.owned;G.engine.fuse(v.hero);ctx.render();ctx.showModal(had?`+1 bản sao ${heroName(v.hero)}`:`${heroName(v.hero)} đã gia nhập!`,[],'');}
      if(cmd==='sources')sourcesDialog();
      if(cmd==='jump')jump(state,Number(d.level),el);
      if(cmd==='wardrobe'){if(window.GemwovenWardrobe)window.GemwovenWardrobe.open(ctx,{season:G.engine.pass()?.season??null,state});else wardrobe(ctx);}
      if(cmd==='detail')detailDialog(Number(d.level),d.track);
      if(cmd==='offer')offerDialog();
    }catch(e){ctx.showModal('Chưa thể thực hiện',[],e.message);}
    return true;
  };
})();
