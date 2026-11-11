/* Depth pass in the hub (docs/GAME_DESIGN.md): the growth map ("Lộ trình"), the power breakdown
 * behind every Lực Chiến, greyed unowned heroes, the newbie week and the event cadence read from liveops.js. Rules and numbers come from progression.js; nothing is computed here.
 */
(() => {
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,A=window.GEMWOVEN_ASSETS,L=window.GEMWOVEN_LAYOUT,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G||!M)return;
  // A title's name always sits inside its plate (owner 08/11: long season names ran past their ribbon in Gặp Gỡ). The plate
  // is drawn in three parts (owner 08/11: "bị kéo dài"): its two ends (a season ribbon's medallion and tail, a rarity plate's
  // wings) keep their drawn proportions and only the plain middle grows. It starts at its drawn length; a long name first
  // shrinks to 75% of its size (smaller is unreadable on a phone), then the middle lengthens.
  // A season ribbon is a straight banner (owner 10/11: "thẳng tuột rồi nhét chữ vào; để sau này đổi ngôn ngữ được"): the
  // name is plain text centred on its plain cloth (manifest 'cloth', build_gemwoven.py title_cloth), no taller than the cloth
  // allows, so any language fits the same way.
  // Every plate that appears (Gặp Gỡ, Trang trí, the titles list) is fitted once it is laid out; season pages place the
  // name on their own ribbon pictures (placeTitle).
  const clothOf=art=>art&&Object.values(A||{}).find(x=>x.cloth&&x.file===art.getAttribute('src'))?.cloth;
  function fitTitle(plate,tries=0){
    const b=plate.querySelector(':scope > b'),art=plate.querySelector(':scope > img');if(!b||!plate.isConnected)return;
    if(!plate.offsetHeight||(art&&!art.naturalWidth)){if(tries<60)requestAnimationFrame(()=>fitTitle(plate,tries+1));return;}
    b.style.fontSize='';b.style.translate='';
    const cloth=clothOf(art);
    if(cloth){
      // Every season ribbon shows its cloth at the same height (0.42 of the plate's box), the name at a fixed share of it;
      // the plain middle lengthens for a long name; where the whole ribbon would pass the space it has, ribbon and name
      // shrink together, so the name always stays on the cloth.
      plate.style.height='';const h0=plate.clientHeight,frac=cloth[3]-cloth[2],host=plate.parentElement;
      const max=host?.matches('.pz-title')?300:host?.clientWidth||Infinity;   // over a head in Gặp Gỡ the label wraps the plate: up to 300 px
      const lay=h=>{const k=h/art.naturalHeight,l=cloth[0],r=1-cloth[1],capL=Math.round(art.naturalWidth*l*k),capR=Math.round(art.naturalWidth*r*k);
        Object.assign(plate.style,{height:h+'px',borderStyle:'solid',borderColor:'transparent',borderWidth:`0 ${capR}px 0 ${capL}px`,
          borderImage:`url("${art.src}") 0 ${r*100}% 0 ${l*100}% fill / 0 ${capR}px 0 ${capL}px stretch`,width:Math.round(art.naturalWidth*k)+'px',maxWidth:'none'});
        Object.assign(b.style,{paddingLeft:'2px',paddingRight:'2px',fontSize:(frac*h*.56).toFixed(1)+'px',translate:`0 ${((cloth[2]+cloth[3])/2-.5)*h}px`});
        const text=b.scrollWidth,room=plate.clientWidth;if(text+6>room)plate.style.width=Math.ceil(plate.offsetWidth+text+6-room)+'px';
        return plate.offsetWidth;};
      art.style.display='none';
      const h=h0*Math.max(.8,Math.min(1.25,.42/frac)),w=lay(h);
      if(w>max)lay(h*max/w);
      return;
    }
    if(art){
      const [l,r]=[.21,.21],h=plate.clientHeight,k=h/art.naturalHeight;
      const capL=Math.round(art.naturalWidth*l*k),capR=Math.round(art.naturalWidth*r*k);
      Object.assign(plate.style,{borderStyle:'solid',borderColor:'transparent',borderWidth:`0 ${capR}px 0 ${capL}px`,
        borderImage:`url("${art.src}") 0 ${r*100}% 0 ${l*100}% fill / 0 ${capR}px 0 ${capL}px stretch`,width:Math.round(art.naturalWidth*k)+'px',maxWidth:'none'});
      art.style.display='none';Object.assign(b.style,{paddingLeft:'2px',paddingRight:'2px'});
    }else plate.style.width='';
    const cs=getComputedStyle(b),pad=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight),base=parseFloat(cs.fontSize),room=plate.clientWidth-pad,text=b.scrollWidth-pad;
    if(text<=room+1)return;
    b.style.fontSize=Math.max(base*.75,base*room/text).toFixed(1)+'px';
    const now=b.scrollWidth-pad,edges=plate.offsetWidth-plate.clientWidth;
    if(now>room+1)plate.style.width=Math.ceil(now+pad+edges+6)+'px';
  }
  window.GemwovenFitTitle=fitTitle;
  // A season page's ribbon picture (an <img> drawn contained): its name sits on the plain cloth, straight and centred.
  function placeTitle(el,tries=0){
    const b=el.querySelector(':scope > b'),art=el.querySelector(':scope > img'),cloth=clothOf(art);if(!b||!cloth||!el.isConnected)return;
    if(!art.naturalWidth||!art.clientWidth){if(tries<60)requestAnimationFrame(()=>placeTitle(el,tries+1));return;}
    const W=art.clientWidth,H=art.clientHeight,k=Math.min(W/art.naturalWidth,H/art.naturalHeight),dw=art.naturalWidth*k,dh=art.naturalHeight*k,x0=art.offsetLeft+(W-dw)/2,y0=art.offsetTop+(H-dh)/2;
    const band=(cloth[3]-cloth[2])*dh;
    Object.assign(b.style,{left:(x0+cloth[0]*dw)+'px',right:'auto',width:((cloth[1]-cloth[0])*dw)+'px',top:(y0+(cloth[2]+cloth[3])/2*dh)+'px',translate:'0 -50%',padding:'0',
      fontSize:'',overflow:'hidden',textOverflow:'ellipsis',lineHeight:'1'});
    b.style.fontSize=Math.min(parseFloat(getComputedStyle(b).fontSize),band*.56).toFixed(1)+'px';
  }
  // A season avatar frame on a round face (centre cx,cy and radius r in the given unit): the frame's measured opening
  // (build_gemwoven.py frame_opening) is centred on the face, its inner rim just over the face edge, so no frame sits off-centre.
  // face (optional): an element holding the avatar <img>; it is laid on the frame's own box, masked by the frame's opening
  // (holeFile), its picture covering the opening's whole circle, so the face fills any frame and the frame clips it.
  window.GemwovenFrameFit=(img,file,cx,cy,r,unit='px',face=null)=>{
    const a=Object.values(window.GEMWOVEN_ASSETS||{}).find(x=>x.file===file&&x.opening);if(!img||!a)return null;
    const [ox,oy,or]=a.opening,w=r*.92/or,h=w*a.height/a.width,box={left:(cx-ox*w)+unit,top:(cy-oy*h)+unit,width:w+unit,height:h+unit};
    Object.assign(img.style,box,{objectFit:'fill',translate:'none'});
    if(face&&a.hole&&a.holeFile){const [hx,hy,hr]=a.hole,mask=`url("${new URL(a.holeFile,document.baseURI).href}")`,pic=face.querySelector('img');
      Object.assign(face.style,{inset:'auto'},box,{position:'absolute',borderRadius:'0',overflow:'visible',background:'none',maskImage:mask,webkitMaskImage:mask,maskSize:'100% 100%',webkitMaskSize:'100% 100%',maskRepeat:'no-repeat',webkitMaskRepeat:'no-repeat'});
      if(pic)Object.assign(pic.style,{position:'absolute',left:(hx-hr)*100+'%',top:(hy-hr*a.width/a.height)*100+'%',width:hr*200+'%',height:hr*200*a.width/a.height+'%',objectFit:'cover',borderRadius:'50%',maxWidth:'none'});}
    return {r:or*w,w,h,opening:[ox,oy],hole:a.hole,groove:a.groove,overFile:a.overFile,fillFile:a.fillFile};};
  // A frame picture marked data-frame-fit="cx,cy,r,unit" (the face it rings) is centred on that face as it appears.
  // Its face (the sibling img.in) is wrapped once and laid under the frame's opening mask.
  const fitFrame=img=>{const [cx,cy,r,u]=img.dataset.frameFit.split(',');let face=img.parentElement?.querySelector(':scope > img.in, :scope > .fa-face');
    if(face?.tagName==='IMG'){const wrap=document.createElement('span');wrap.className='fa-face';face.replaceWith(wrap);wrap.append(face);face=wrap;}
    window.GemwovenFrameFit(img,img.getAttribute('src'),+cx,+cy,+r,u||'px',face);};
  new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1){
    for(const el of [n,...n.querySelectorAll('.title-plate,.wd-title')])if(el.matches('.title-plate,.wd-title'))fitTitle(el);
    for(const el of [n,...n.querySelectorAll('.sz-title')])if(el.matches('.sz-title'))placeTitle(el);
    for(const el of [n,...n.querySelectorAll('img[data-frame-fit]')])if(el.matches('img[data-frame-fit]'))fitFrame(el);}})
    .observe(document.documentElement,{childList:true,subtree:true});
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const img=(asset,cls='')=>`<img class="${cls}" src="${esc((A[asset]||A['icon-hero']).file)}" alt="" draggable="false">`;
  const pct=x=>(x*100).toLocaleString('vi-VN',{maximumFractionDigits:1})+'%';
  const STATE={ready:'Làm được ngay',short:'Thiếu nguyên liệu',locked:'Chưa đủ điều kiện',max:'Đã tối đa'};
  const signed=(n,f)=>n>0?'+'+f(n):n<0?'−'+f(-n):'—';

  // ----- Dialogs -----
  function powerDialog(ctx,state,key){
    const p=G.engine.read();if(!p.heroes[key])return;
    const b=M.statBreakdown(p,key),t=b.total,name=M.HEROES[key].name;
    const modal=window.GemwovenUI.makeDialog('power-detail','Lực Chiến · '+name,'growth-dialog');
    const rows=b.rows.map((r,i)=>`<tr class="${i&&!r.hp&&!r.attack&&!r.defense?'is-zero':''}"><td>${esc(r.label)}</td><td>${i?signed(r.hp,fmt):fmt(r.hp)}</td><td>${i?signed(r.attack,v=>'×'+v.toFixed(2).replace('.',',')):'×'+r.attack.toFixed(2).replace('.',',')}</td><td>${i?signed(r.defense,pct):pct(r.defense)}</td></tr>`).join('');
    modal.body.innerHTML=`<div class="power-hero">${img('portrait-'+key,'power-portrait')}<div><b>${fmt(t.power)}</b></div></div>`+
      `<table class="gw-table power-table"><thead><tr><th>Nguồn</th><th>HP</th><th>Công</th><th>Thủ</th></tr></thead><tbody>${rows}</tbody>`+
      `<tfoot><tr><td>Tổng</td><td>${fmt(t.hp)}</td><td>×${t.attack.toFixed(2).replace('.',',')}</td><td>${pct(t.defense)}</td></tr></tfoot></table>`+
      (b.capped?'<p class="growth-note">Thủ tối đa 50%: phần vượt không còn tác dụng.</p>':'')+
      `<details class="hint"><summary>ⓘ Cách tính lực chiến</summary><p>${esc(b.formula)}</p><p>Công nhân sát thương mỗi viên ngọc kiếm và tuyệt kỹ. Thủ giảm sát thương nhận vào. Trong trận dùng đúng các số này.</p></details>`+
      `<h3 class="growth-sub">Cách tăng tiếp</h3>`+tips(p,key);
    const map=document.createElement('button');map.type='button';map.className='gw-btn';map.textContent='Lộ trình phát triển';map.onclick=()=>{modal.close();growthDialog(ctx,state,key);};
    modal.actions.append(map);wire(modal,ctx,state,key);modal.present();
  }
  function tips(p,key){
    const rows=M.growthMap(p,key).filter(r=>r.state==='ready').slice(0,3);
    if(!rows.length)return '<p class="growth-note">Cần thêm nguyên liệu · Khám Phá, Trùm Vô Tận, Tích Lũy</p>';
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
    const got=days.filter(d=>d.claimed).length,ready=days.filter(d=>d.open&&!d.claimed).length;
    return `<section class="newbie-week"><h3>Hành Trình Tân Thủ · đã nhận ${got}/7${ready?` · <span class="newbie-ready">${ready} quà chờ nhận</span>`:''}</h3><p class="hint">Mỗi ngày 1 quà · nhận bù được</p><details class="hint"><summary aria-label="Chi tiết">ⓘ</summary><p>Đủ 80 Mảnh Hiro trong tuần đầu là lên 2 sao.</p></details>`+
      `<div class="newbie-days">${days.map(d=>`<article class="newbie-day${d.claimed?' is-claimed':d.open?' is-open':''}"><b>Ngày ${d.day}</b>${img('portrait-novice','newbie-portrait')}`+
        `<ul>${Object.entries(d.reward).map(([id,n])=>id==='cosmetic'?'<li>Khung Hiro ×1</li>':`<li>${esc(name(id))} ×${fmt(n)}</li>`).join('')}</ul>`+
        `<button type="button" class="game-btn" data-action="growth:newbie" data-day="${d.day}" ${d.open&&!d.claimed?'':'disabled'}>${d.claimed?'Đã nhận':d.open?'Nhận':`Mở sau ${d.day-days.filter(x=>x.open).length} ngày`}</button></article>`).join('')}</div></section>`;
  }
  function weeklySection(){
    const name=id=>M.RESOURCES[id]?.[0]||({gemChoices:'Phiếu chọn ngọc',noviceFragments:'Mảnh Hiro'}[id])||id,rows=G.engine.weekly();
    return `<section class="weekly-quests"><h3>Nhiệm Vụ Tuần</h3><p class="hint">Làm mới Thứ Hai 00:00 (GMT+7) · tuần từ ${esc(rows[0]?.week.split('-').reverse().join('/'))}</p>`+
      `<div class="cadence-grid">${rows.map(q=>`<article class="${q.claimed?'is-claimed':''}"><b>${esc(q.name)}</b><small>Tiến độ ${fmt(q.progress)} / ${fmt(q.target)}</small>`+
        `<ul>${Object.entries(q.reward).map(([id,n])=>`<li>${esc(name(id))} ×${fmt(n)}</li>`).join('')}</ul>`+
        `<button type="button" class="game-btn" data-action="growth:weekly" data-quest="${esc(q.id)}" ${!q.claimed&&q.progress>=q.target?'':'disabled'}>${q.claimed?'Đã nhận':q.progress>=q.target?'Nhận':'Chưa xong'}</button></article>`).join('')}</div></section>`;
  }
  // Sân Thử Luyện on the Trùm Vô Tận screen: today's tanky boss at the selected hero's level.
  // Sân Thử Luyện (Codex UI review): today's boss first, with runs left and the button; the other days in one row
  // with their day; the rules folded under "Cách chơi".
  function trialSection(p){
    const open=M.trialOpen(Date.now()),runs=p.daily.trialRuns||0,left=Math.max(0,M.TRIAL.rewarded-runs),hero=p.heroes[p.selected];
    const days=['T2','T3','T4','T5','T6'],el=k=>({fire:'Hỏa',ice:'Băng',earth:'Mộc',lightning:'Lôi'}[k]||k);
    const bosses=M.TRIAL.chapters.map((c,i)=>({i:i+1,e:M.trialEncounter(i+1,hero.level),today:open.includes(i+1),best:p.trial?.best?.[i+1]||0,day:days[i]}));
    const card=b=>`<article class="trial-today"><div><b>${esc(b.e.enemyName)}</b><small>Hôm nay · hệ ${esc(el(b.e.enemyKey))} · cấp ${hero.level}</small>`+
      `<p>Kỷ lục: <strong>${b.best?fmt(b.best)+` · ${(b.best/b.e.enemyHp).toLocaleString('vi-VN',{maximumFractionDigits:1})} thanh`:'chưa có'}</strong></p></div>`+
      `<div class="trial-go"><span class="trial-left ${left?'':'is-out'}">${left?`Lượt nhận thưởng: <b>${left}/${M.TRIAL.rewarded}</b>`:'Hết lượt thưởng · vẫn ghi kỷ lục'}</span><button type="button" class="game-btn" data-action="do:battle" data-mode="trial" data-index="${b.i}">Thử sức</button></div></article>`;
    const others=bosses.filter(b=>!b.today);
    return `<section class="trial-ground"><h3>Sân Thử Luyện</h3>${bosses.filter(b=>b.today).map(card).join('')}`+
      (others.length?`<ul class="trial-week">${others.map(b=>`<li class="${b.best?'done':''}" title="${esc(b.e.enemyName)}">${A['boss-'+b.e.bossId]?img('boss-'+b.e.bossId,'trial-boss'):''}<b>${esc(b.day)}</b>${b.best?'<i>✓</i>':''}</li>`).join('')}</ul>`:'')+
      `<details class="trial-rules"><summary aria-label="Cách chơi">ⓘ Cách chơi</summary><p>Boss trâu không bao giờ ngã: hết thanh máu thì đứng dậy với thanh mới. ${M.TRIAL.turns} lượt, tính tổng sát thương. Boss ở đúng cấp tướng đang xuất chiến (${esc(M.HEROES[p.selected].name)} cấp ${hero.level}). ${M.TRIAL.rewarded} lượt có thưởng mỗi ngày theo mốc ½, 1, 2, 3, 5 thanh máu; sau đó đánh thoải mái để thử tướng, vẫn ghi kỷ lục. Cuối tuần mở cả 5 boss.</p></details></section>`;
  }
  function cadenceSection(){
    if(!O)return '';
    return `<section class="cadence"><h3>Lịch sự kiện dự kiến · Sắp ra mắt</h3><div class="cadence-grid">${O.CADENCE.map(c=>`<article><b>${esc(c.name)}</b><small>Làm mới ${esc(c.reset)} (GMT+7)</small><ul>${c.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;
  }
  // VIP & Nạp, Sổ Hành Trình, Thẻ Tháng and Quỹ live in pass-ui.js (owner 2026-11-04: timeline tree).
  // Danh Hiệu (owner 2026-11-03): only the name, on a plate drawn per rarity; tap it to see how to earn it and
  // to wear or take it off. The worn one shows over your head in combat and in Gặp Gỡ. Cosmetic only.
  const plate=(t,big=false)=>`<span class="title-plate tier-${t.tier}${big?' big':''}"><img src="assets/gemwoven/titles/plate-${t.tier}.webp" alt=""><b>${esc(t.name)}</b></span>`;
  window.GemwovenTitlePlate=plate;
  // Full review 4 (Codex: "toàn khóa, thiếu tiến độ"): every title earned on this save shows a short condition and
  // its progress on the kit trough, the nearest ones first and the closest one marked "Gần đạt"; titles the server
  // will give sit apart under "Sắp ra mắt". Numbers come from progression.js titleList.
  const NEED={newcomer:['Tân Thủ',' ngày'],ember:['Vượt ải',''],'hunter-1':['Boss vô hạn',''],trial:['Thử Luyện',' boss'],smith:['Cường hóa','',v=>'+'+v],
    'hiro-star':['Hiro',' sao'],collector:['Hình thái',''],pathfinder:['Vượt ải',''],'boss-hunter':['Boss vô hạn','']};
  const SOON={'season-gold':'Đấu Hạng','cup-champion':'Cúp Đấu Trường','cup-final':'Cúp Đấu Trường','cup-semi':'Cúp Đấu Trường','cup-eight':'Cúp Đấu Trường',champion:'Thư Hùng',patron:'VIP 11'};
  function titleCell(t,near){
    const [cur,target]=t.progress,[what,unit,f=fmt]=NEED[t.id]||['',''],ratio=target?cur/target:0;
    const meter=t.server?`<span class="title-need is-soon"><span>${esc(SOON[t.id]||'Máy chủ')}</span><b>Sắp ra mắt</b></span>`:t.unlocked?'':
      `<span class="title-need"><span>${esc(what)}</span><b>${esc(f(cur))}/${esc(f(target))}${esc(unit)}</b></span><span class="kp-bar title-meter"><i style="width:${Math.max(3,Math.round(ratio*100))}%"></i></span>`;
    return `<button type="button" class="title-cell ${t.unlocked?'is-open':'is-locked'} ${t.worn?'is-worn':''}${near?' is-near':''}${t.server?' is-soon':''}" data-action="growth:title-open" data-id="${t.id}" aria-label="${esc(t.name)}${t.worn?' · đang đeo':t.unlocked?' · đã đạt':t.server?' · sắp ra mắt':` · ${what} ${f(cur)}/${f(target)}${unit}`}">${plate(t)}${t.worn?'<em>Đang đeo</em>':t.unlocked?'':'<i aria-hidden="true">🔒</i>'}${near?'<strong class="title-near">Gần đạt</strong>':''}${meter}</button>`;
  }
  function titlesSection(p){
    const list=M.titleList(p),got=list.filter(t=>t.unlocked).length,r=t=>t.progress[1]?t.progress[0]/t.progress[1]:0;
    const open=list.filter(t=>t.unlocked).sort((a,b)=>b.worn-a.worn),local=list.filter(t=>!t.unlocked&&!t.server).sort((a,b)=>r(b)-r(a)),soon=list.filter(t=>t.server);
    return `<section class="titles"><h3>Danh Hiệu <small>${got}/${list.length}</small></h3>`+
      `<div class="title-grid">${open.concat(local).map((t,i)=>titleCell(t,!t.unlocked&&t===local[0])).join('')}</div>`+
      `<h4 class="title-soon-head">Sắp ra mắt · máy chủ trao</h4><div class="title-grid is-soon">${soon.map(t=>titleCell(t,false)).join('')}</div></section>`;
  }
  function titleDialog(ctx,id){
    const t=M.titleList(G.engine.read()).find(x=>x.id===id);if(!t)return;
    const modal=window.GemwovenUI.makeDialog('title-detail','Danh Hiệu','growth-dialog title-dialog');
    const [cur,target]=t.progress;
    modal.body.innerHTML=`<div class="title-hero">${plate(t,true)}</div><p class="title-rarity">${['','Thường','Hiếm','Sử Thi','Huyền Thoại','Thần Thoại'][t.tier]}</p>`+
      `<h3 class="growth-sub">Cách nhận</h3><p class="growth-lead">${esc(t.source)}</p>`+
      (t.server?'<p class="growth-note">Danh hiệu này do máy chủ trao (đấu hạng, mùa, Thư Hùng, VIP) · Sắp ra mắt.</p>':`<div class="title-bar"><i style="width:${Math.round(cur/target*100)}%"></i><span>${fmt(cur)} / ${fmt(target)}</span></div>`)+
      `<p class="growth-note">Chỉ để trang trí: hiện trên đầu tướng trong trận và ở Gặp Gỡ, không cộng chỉ số.</p>`;
    if(t.unlocked){const b=document.createElement('button');b.type='button';b.className='gw-btn';b.textContent=t.worn?'Bỏ đeo':'Đeo danh hiệu';
      b.onclick=()=>{try{G.engine.wearTitle(t.worn?null:t.id);modal.close();ctx.render();}catch(e){ctx.showModal('Chưa thể thực hiện',[],e.message);}};modal.actions.append(b);}
    modal.present();
  }
  // Đấu Hạng (docs/GAME_DESIGN.md §12): what ranked play will be, plainly marked Coming soon; nothing here plays or ranks.
  function arenaDialog(){
    if(!O)return;const modal=window.GemwovenUI.makeDialog('arena-info','Đấu Hạng · Sắp ra mắt','growth-dialog arena-dialog');
    const tiers=[...new Map(O.LEAGUES.map(l=>[l.tier,l])).values()];
    modal.body.innerHTML=`<div class="arena-cards">${O.ARENA_RULES.queues.map((q,i)=>`<details class="arena-card"><summary>${img(i?'icon-crown':'icon-arena')}<b>${esc(q.name)}</b></summary><p>${esc(q.desc)}</p></details>`).join('')}</div>`+
      `<details class="arena-more"><summary>⏱ Luật trận</summary><p>Lượt ${O.ARENA_RULES.turnSeconds} giây · ${O.ARENA_RULES.timeoutsToLose} lần hết giờ là thua · mất kết nối ${O.ARENA_RULES.reconnectSeconds} giây thì máy tạm đánh rồi xử thua. Máy chủ giữ bàn ngọc, xúc xắc và kết quả.</p></details>`+
      `<details class="arena-more"><summary>🏅 Bậc và thưởng tuần</summary><table class="gw-table"><thead><tr><th>Bậc</th><th>Vàng</th><th>Huy hiệu</th><th>Bí kíp</th></tr></thead><tbody>${tiers.map(l=>`<tr><td>${esc(l.name.replace(/ (III|II|I)$/,''))}${l.top?` · top ${l.top}`:''}</td><td>${fmt(l.weekly.gold)}</td><td>${fmt(l.weekly.arenaMedals)}</td><td>${fmt(l.weekly.skillBooks)}</td></tr>`).join('')}</tbody></table>`+
      `<p class="growth-note">Mùa 28 ngày, cuối mùa hạ mềm bậc. ${esc(O.ARENA_RULES.seasonRewards)} Không Đá Ngọc.</p></details>`+
      `<details class="arena-more"><summary>🏆 Thư Hùng Đại Hội</summary><ul class="growth-tips"><li><span>Đăng ký 1 tuần → vòng Thụy Sĩ 7 vòng → top 64 loại trực tiếp, xem trực tiếp (trễ 10 giây).</span></li><li><span>Hai hạng: Chuẩn Hóa và Tự Do.</span></li><li><span>Thưởng: danh hiệu Thư Hùng Vô Địch (tên riêng theo khuôn, có kiểm duyệt), trang phục vô địch, tượng ở Quảng Trường mùa sau. Không sức mạnh độc quyền.</span></li></ul></details>`;
    modal.present();
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
    if(live&&state.screen==='rankings'){const build=live.build;live.build=el=>{build(el);el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',titlesSection(G.engine.read()));};}
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    const hero=el?.dataset?.hero||state.hero||G.engine.read().selected;
    if(action==='growth:power'){powerDialog(ctx,state,hero);return true;}
    if(action==='growth:map'){growthDialog(ctx,state,hero);return true;}
    if(action==='growth:newbie'){try{const got=G.engine.claimNewbie(Number(el.dataset.day));ctx.render();G.showRewards(ctx,got,'Quà Tân Thủ');}catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}return true;}
    if(action==='growth:arena'){arenaDialog();return true;}
    if(action==='growth:title-open'){titleDialog(ctx,el.dataset.id);return true;}
    if(action==='growth:weekly'){try{const got=G.engine.claimWeekly(el.dataset.quest);ctx.render();G.showRewards(ctx,got,'Thưởng nhiệm vụ tuần');}catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}return true;}
    return handle(action,el,ctx,state);
  };
  window.GemwovenGrowthUI={powerDialog,growthDialog};
})();
