/* Live screens built from separated artwork and the shared progression model. */
(() => {
  const M=window.GemwovenProgression,A=window.GEMWOVEN_ASSETS,L=window.GEMWOVEN_LAYOUT,C=window.GEMWOVEN_DEFAULT_COPY;
  let storage;try{storage=window.localStorage;}catch{storage=null;}
  // Preview tickets/gems/sample mail only for a local dev server; a portable HTML opened from disk is a real save.
  // Local test server: this machine, or a phone on the same private network (192.168.x.x / 10.x.x.x).
  const localPreview=/^https?:$/.test(location.protocol)&&(['localhost','127.0.0.1','[::1]'].includes(location.hostname)||/^(192\.168|10)\.\d+\.\d+(\.\d+)?$/.test(location.hostname));
  const engine=M.makeEngine(storage,{previewTickets:localPreview,previewGems:localPreview,previewMail:localPreview,previewHeroes:localPreview});
  const extra={campaign:['Vượt Ải','icon-quest','home'],boss:['Boss Vô Hạn','nav-arena','arena'],quests:['Nhiệm Vụ Ngày','icon-quest','tavern'],offline:['Kho Offline','chest','home'],equipment:['Trang Bị','helmet','forge'],events:['Sự Kiện','icon-event','home'],vip:['VIP','icon-crown','shop'],rankings:['Bảng Xếp Hạng','rank-gold','arena'],admin:['Studio Sự Kiện','icon-settings','home'],mail:['Hòm Thư','icon-mail','tavern'],settings:['Cài Đặt','icon-settings','home'],chat:['Cộng Đồng','icon-chat','tavern']};
  const baseNodes=Object.fromEntries(Object.entries(L.screens).map(([key,v])=>[key,v.nodes.slice()]));
  for(const [key,[name,,bg]]of Object.entries(extra)){L.names[key]=name;L.screens[key]={key,name,background:`assets/gemwoven/backgrounds/${bg}.webp`,backgroundKey:bg,nodes:[]};}
  L.order=['home','campaign','boss','upgrade','skills','summon','inventory','equipment','forge','shop','quests','offline','arena','rankings','events','vip','tavern','mail','settings','admin','chat'];
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const img=(asset,cls='',alt='')=>`<img class="${cls}" src="${esc((A[asset]||A['icon-hero']).file)}" alt="${esc(alt)}" draggable="false">`;
  const button=(label,action,data={},disabled=false,cls='')=>`<button type="button" class="game-btn ${cls}" data-action="${esc(action)}" ${Object.entries(data).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')} ${disabled?'disabled':''}>${esc(label)}</button>`;
  const route=(label,key)=>button(label,'route:'+key);
  const remaining=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const cost=(p,c)=>`<div class="cost-grid">${Object.entries(c).filter(([,n])=>n>0).map(([id,n])=>`<div class="cost ${remaining(p,id)>=n?'enough':'missing'}">${img(M.RESOURCES[id]?.[1]||'crest')}<span>${esc(M.RESOURCES[id]?.[0]||id)}<b>${fmt(remaining(p,id))} / ${fmt(n)}</b></span></div>`).join('')}</div>`;
  const canPay=(p,c)=>Object.entries(c).every(([id,n])=>remaining(p,id)>=n);
  const stars=n=>'★'.repeat(n)+'☆'.repeat(6-n);
  const heroArt=(key,h)=>`<div class="hero-live evo-${h?.evolution||0}" data-evolution="${h?.evolution||0}">${img('hero-'+key,'hero-body',M.HEROES[key]?.name)}${M.EVOLUTION.slice(0,h?.evolution||0).map(e=>img('evo-'+e.piece,'evo-piece evo-'+e.piece)).join('')}</div>`;
  const heroTabs=(p,selected)=>`<div class="roster-live">${Object.entries(M.HEROES).map(([key,h])=>`<button type="button" data-action="do:hero" data-hero="${key}" class="${key===selected?'chosen':''} ${p.heroes[key]?'':'locked'}" aria-label="${esc(h.name)}${p.heroes[key]?'':' · chưa sở hữu'}">${img('portrait-'+key)}<span>${h.name}</span>${p.heroes[key]?'':'<small>Chưa có</small>'}</button>`).join('')}</div>`;
  const heading=(title,sub='')=>`<header class="game-heading"><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</header>`;
  function panel(key,build,rect=[41,188,859,1291]){return {id:key+'.live',kind:'content',rect,build,className:key==='mail'?'mail-panel':undefined};}
  function skeleton(key){const original=baseNodes[key]||baseNodes[extra[key]?.[2]||'home'];return original.filter(n=>/\.(profile|level-|level$|gold-|gold$|gem-|gems|mail$|settings$|footer-|nav-)/.test(n.id)&&!n.id.endsWith('.nav-label-board')&&!n.id.endsWith('.nav-active-label')).map(n=>{const x={...n,id:n.id.replace(/^[^.]+/,key)};if(x.text){x.text=n.text;C[x.text]=C[n.text]||'';}if(x.role==='nav')x.selected=x.action==='route:'+key;return x;});}
  // ----- Mailbox ("Hòm Thư"): list, letter, rewards and the local studio form. -----
  const mailIcon=m=>m.attachments.length?'icon-gift':m.kind==='system'?'crest':'scroll';
  const resourceName=id=>M.RESOURCES[id]?.[0]||id,resourceArt=id=>M.RESOURCES[id]?.[1]||'crest';
  function mailRow(m,now){
    const expiry=m.claimed?'':M.mailExpiry(m.expiresAt,now),gift=m.attachments.length>0;
    const thumbs=m.attachments.slice(0,4).map(a=>`<span class="mail-thumb">${img(resourceArt(a.resource),'',resourceName(a.resource))}<i>${esc(M.compact(a.count,1000))}</i></span>`).join('');
    return `<button type="button" class="mail-row${m.read?'':' unread'}${gift?' is-gift':''}${m.claimed?' is-claimed':''}" data-action="do:mail-open" data-id="${esc(m.id)}" aria-label="${esc(m.title)}${m.read?' · đã đọc':' · thư mới'}${gift&&!m.claimed?' · có quà':''}">`+
      `<span class="mail-icon">${img(mailIcon(m))}</span><span class="mail-main"><span class="mail-title-line"><b>${esc(m.title)}</b>${m.read?'':'<em class="mail-new">Mới</em>'}</span>`+
      `<small class="mail-meta"><span class="mail-from">${esc(m.from)}</span><span class="mail-age">· ${esc(M.mailAge(m.sentAt,now))}</span></small>`+
      (gift?`<span class="mail-thumbs">${thumbs}${m.claimed?'<span class="mail-claimed">✓ Đã nhận</span>':''}</span>`:'')+
      (expiry?`<small class="mail-expiry">⏳ ${esc(expiry)}</small>`:'')+`</span></button>`;
  }
  function mailLetter(m,now){
    const expiry=m.claimed?'':M.mailExpiry(m.expiresAt,now),gift=m.attachments.length>0;
    const tag=m.source==='local-studio'?' · Studio local (thử nghiệm)':'';
    const tiles=m.attachments.map(a=>{const name=resourceName(a.resource);return `<button type="button" class="mail-gift${m.claimed?' is-claimed':''}" data-action="item:${esc(a.resource)}" aria-label="${esc(name)} ×${fmt(a.count)} · xem thông tin"><span class="mail-slot">${img(resourceArt(a.resource),'',name)}</span><b>${esc(name)}</b><span class="mail-gift-count">×${fmt(a.count)}</span></button>`;}).join('');
    return `<div class="mail-detail">${button('‹ Hộp thư','do:mail-back',{},false,'secondary mail-back')}<article class="mail-letter">`+
      `<header class="mail-letter-head">${img(mailIcon(m),'mail-letter-icon')}<div><h3>${esc(m.title)}</h3><small>Từ: ${esc(m.from)}${esc(tag)}</small><small>${esc(M.mailAge(m.sentAt,now))}${expiry?' · '+esc(expiry):''}</small></div></header>`+
      (m.body?`<p class="mail-body">${esc(m.body)}</p>`:'')+`</article>`+
      // Attachments stay in view under the scrolling letter, right above the claim button.
      (gift?`<section class="mail-attachments"><h4 class="mail-gifts-title">Quà đính kèm${m.claimed?' · <span class="mail-claimed">✓ Đã nhận</span>':' <small>· chạm để xem</small>'}</h4><div class="mail-gifts">${tiles}</div></section>`:'')+
      `<div class="mail-footer">${m.pending?button('Nhận quà','do:mail-claim',{id:m.id}):''}${button('Xóa thư','do:mail-delete',{id:m.id},m.pending,'secondary')}</div>`+
      (m.pending?'<p class="hint mail-tip">Nhận quà trước khi xóa thư.</p>':'')+`</div>`;
  }
  function mailPage(state){
    const box=engine.mailbox(),tab=state.mailTab||'all',open=state.mailOpen&&box.mails.find(m=>m.id===state.mailOpen);
    const sub=box.unread?`${box.unread} thư chưa đọc`:'Không có thư chưa đọc';
    if(open)return heading('Hòm Thư')+mailLetter(open,box.now);
    const list=box.mails.filter(m=>tab==='all'||(tab==='gift'?m.gift:!m.gift));
    const empty=`<div class="mail-empty">${img('icon-mail','mail-empty-art')}<h3>${box.mails.length&&tab!=='all'?(tab==='gift'?'Chưa có thư quà':'Chưa có thông báo'):'Hòm thư trống'}</h3><p>Thông báo và quà từ Ban Quản Trị sẽ xuất hiện tại đây.</p></div>`;
    return heading('Hòm Thư',sub)+`<div class="live-tabs mail-tabs">${[['all','Tất cả'],['gift','Quà'],['notice','Thông báo']].map(([id,label])=>button(label,'do:mail-tab',{tab:id},false,tab===id?'active':'')).join('')}</div>`+
      `<div class="mail-list">${list.length?list.map(m=>mailRow(m,box.now)).join(''):empty}</div>`+
      `<div class="mail-footer">${button('Nhận tất cả','do:mail-claim-all',{},!box.pending)}${button('Xóa thư đã đọc','do:mail-delete-read',{},!box.deletable,'secondary')}</div>`;
  }
  // Local studio prototype: mail lands only in this save; Đá Ngọc is not offered.
  function mailStudio(){
    const box=engine.mailbox(),options=M.MAIL_RESOURCES.map(id=>`<option value="${id}">${esc(resourceName(id))}</option>`).join('');
    const sent=box.mails.filter(m=>m.source==='local-studio');
    return `<section class="mail-studio"><h3>Gửi thư (bản thử nghiệm local)</h3><p class="hint">Studio chạy cục bộ trên thiết bị này, không phải trang quản trị đã xác thực. Thư chỉ vào Hòm Thư của bản lưu hiện tại; gửi thư thật cho người chơi cần máy chủ. Không thể đính kèm Đá Ngọc.</p>`+
      `<form id="mail-form"><label>Tiêu đề<input name="title" required maxlength="${M.MAIL_TITLE_MAX}" placeholder="Ví dụ: Quà bảo trì"></label><label>Nội dung<textarea name="body" maxlength="${M.MAIL_BODY_MAX}" placeholder="Lời nhắn gửi người chơi"></textarea></label>`+
      `<label>Người gửi<input name="from" maxlength="${M.MAIL_FROM_MAX}" value="Ban Quản Trị"></label><label>Loại thư<select name="kind"><option value="notice">Thông báo</option><option value="gift">Quà</option></select></label>`+
      `<fieldset class="mail-attach"><legend>Vật phẩm đính kèm · tối đa ${M.MAIL_ATTACHMENTS} (thư Quà)</legend>${Array.from({length:M.MAIL_ATTACHMENTS},(_,i)=>`<div class="mail-attach-row"><select name="resource${i}" aria-label="Vật phẩm ${i+1}"><option value="">— Không —</option>${options}</select><input name="count${i}" type="number" min="1" max="${M.MAIL_COUNT_MAX}" step="1" inputmode="numeric" placeholder="Số lượng" aria-label="Số lượng ${i+1}"></div>`).join('')}</fieldset>`+
      `<label>Thời hạn (ngày)<input name="expiryDays" type="number" min="${M.MAIL_EXPIRY_DAYS[0]}" max="${M.MAIL_EXPIRY_DAYS[1]}" value="7" inputmode="numeric"></label><button class="game-btn" type="submit">Gửi thư</button></form>`+
      `<h3>Thư đã gửi từ studio</h3>${sent.length?sent.map(m=>`<article class="mail-sent"><div><b>${esc(m.title)}</b><small>${m.gift?'Quà':'Thông báo'} · ${m.claimed?'Đã nhận quà':m.read?'Đã đọc':'Chưa đọc'} · ${esc(M.mailExpiry(m.expiresAt,box.now))}</small></div>${button('Thu hồi','do:mail-recall',{id:m.id},false,'secondary')}</article>`).join(''):'<p class="hint">Chưa gửi thư nào.</p>'}</section>`;
  }
  // One reward sheet for every claim: each granted item as its picture in a slot, name and amount.
  function showRewards(ctx,reward,title='Đã nhận',note=''){
    const rows=Object.entries(reward||{}).filter(([id,n])=>M.RESOURCES[id]&&Number(n)>0);if(!rows.length)return false;
    const wrap=document.createElement('div');wrap.className='reward-sheet';
    wrap.innerHTML=`<div class="reward-grid">${rows.map(([id,n],i)=>`<div class="reward-tile" style="--i:${i}"><span class="reward-slot">${img(resourceArt(id),'',resourceName(id))}</span><b>${esc(resourceName(id))}</b><span>+${fmt(n)}</span></div>`).join('')}</div>`;
    ctx.showModal(title,[],note,[],{kind:'rewards',content:wrap});return true;
  }
  function page(key,p,state,ctx){
    const selected=state.hero||p.selected,h=p.heroes[selected],data=M.HEROES[selected];
    if(key==='upgrade'){
      if(!h)return heading(data.name,'Tướng chưa sở hữu')+heroTabs(p,selected)+heroArt(selected)+`<p>Ghép 80 mảnh hoặc triệu hồi để mở tướng.</p><p>Mảnh hiện có: ${p.fragments[selected]||0} / 80</p>`+button('Ghép tướng','do:fuse',{hero:selected},(p.fragments[selected]||0)<80)+route('Tới triệu hồi','summon');
      const current=M.stats(p,selected),tab=state.upgradeTab||'level';let detail='';
      if(tab==='level'){
        const c=h.level<500?M.levelCost(h.level):null,preview=JSON.parse(JSON.stringify(p));if(c)preview.heroes[selected].level++;
        const next=M.stats(preview,selected);detail=`<h3>Cấp ${h.level} → ${Math.min(500,h.level+1)}</h3><div class="stat-grid"><p>HP<b>${fmt(current.hp)} → ${fmt(next.hp)}</b></p><p>Sức tấn công<b>×${current.attack.toFixed(2)} → ×${next.attack.toFixed(2)}</b></p><p>Giới hạn<b>500 cấp</b></p></div>${c?cost(p,c):'<p>Đã chạm đỉnh tu luyện.</p>'}${button('Tăng 1 cấp','do:level',{hero:selected},!c||!canPay(p,c||{}))}<p class="hint">Vé thưởng ở cấp 10, 25, 50 và mỗi 50 cấp sau đó; chỉ nhận một lần mỗi mốc. Ấn tu luyện: tối đa ${fmt(M.DAILY_SEAL_CAP)}/ngày cho toàn tài khoản.</p>`;
      }else if(tab==='stars'){
        const c=h.stars<6?M.starCost(h.stars):null;detail=`<h3>${stars(h.stars)}</h3><p>Mỗi sao: +12% HP nền và +9% tấn công nền. Cấp tướng được giữ nguyên.</p><p>Bản sao có thể dùng: <b>${h.copies-1}</b>${c?` / ${c.copies} cần thiết`:''}</p>${c?cost(p,{gold:c.gold,essence:c.essence}):'<p>Đã đạt 6 sao.</p>'}${button('Ghép bản sao · Tăng sao','do:star',{hero:selected},!c||h.copies-1<c.copies||!canPay(p,c?{gold:c.gold,essence:c.essence}:{}))}<p class="hint">Giữ lại bản chính; chỉ tiêu hao bản sao cùng tướng. Có thể ghép 80 mảnh thành một bản sao.</p>${button('Ghép 80 mảnh','do:fuse',{hero:selected},(p.fragments[selected]||0)<80)}`;
      }else{
        const e=M.EVOLUTION[h.evolution];detail=`<h3>Tiến hóa ${h.evolution}/6</h3><div class="evolution-road">${M.EVOLUTION.map((e,i)=>`<span class="${i<h.evolution?'done':''}">${img('evo-'+e.piece)}<b>${i+1}. ${e.name}</b><small>Cấp ${e.level} · ${e.stars}★</small></span>`).join('')}</div>${e?`<p>Mốc kế: ${e.name}. Mỗi bậc +10% HP nền, +7% tấn công nền. Bậc 2 mở Biến dị; bậc 5 mở Chân thân; bậc 6 có hào quang.</p>${cost(p,{gold:e.gold,essence:e.essence,ore:e.ore})}${button('Tiến hóa','do:evolve',{hero:selected},h.level<e.level||h.stars<e.stars||!canPay(p,{gold:e.gold,essence:e.essence,ore:e.ore}))}`:'<p>Đã lột xác toàn thân.</p>'}`;
      }
      return heading('Phát triển tướng',`${data.name} · ${data.title}`)+heroTabs(p,selected)+`<div class="hero-summary">${heroArt(selected,h)}<div><h3>${data.name}</h3><p>Cấp ${h.level}/500 · ${stars(h.stars)}</p><p>Lực chiến ${fmt(current.power)}</p><p>Tiến hóa ${h.evolution}/6</p>${button(p.selected===selected?'Đang xuất chiến':'Chọn xuất chiến','do:select',{hero:selected},p.selected===selected)}</div></div><div class="live-tabs">${[['level','Level'],['stars','Tăng Sao'],['evolution','Tiến Hóa']].map(([id,label])=>button(label,'do:upgrade-tab',{tab:id},false,tab===id?'active':'')).join('')}</div>${detail}`+route('Bộ kỹ năng','skills')+route('Trang bị','equipment');
    }
    if(key==='skills'){
      const levels=h?.skills||[0,0,0,0],filter=state.skillFilter??'all',index=state.skill||0,types=['Chủ Động','Bị Động','Biến Dị','Chân Thân'];let c=null;try{if(h)c=M.skillCost(h,index);}catch{}
      const unlocked=h&&M.skillUnlock(h,index),text=M.skillText(selected,h,index),description=text.description;
      return heading('Con Đường Kỹ Năng','Chọn loại để lọc; Cây kỹ năng hiển thị toàn bộ nhánh.')+heroTabs(p,selected)+`<div class="live-tabs skill-filters">${button('Cây kỹ năng','do:skill-filter',{filter:'all'},false,filter==='all'?'active':'')}${types.map((t,i)=>button(t,'do:skill-filter',{filter:i},false,String(filter)===String(i)?'active':'')).join('')}</div><div class="skill-showcase">${heroArt(selected,h)}<div class="skill-tree ${filter==='all'?'full-tree':''}">${types.map((t,i)=>filter!=='all'&&String(i)!==String(filter)?'':`<button class="skill-live ${index===i?'chosen':''} ${h&&M.skillUnlock(h,i)?'':'locked'}" data-action="do:skill-node" data-index="${i}">${img(selected==='novice'?['stat-attack','stat-shield','stat-heart','crest'][i]:`skill-${selected}-${i}`)}<span>${esc(t)}</span><b>${levels[i]}/10</b></button>`).join('')}</div></div><section class="skill-info"><h3>${esc(data.skills[index])} · Lv.${levels[index]}</h3><p>${esc(description)}</p><p>${esc(text.next||'')}</p>${unlocked?'':`<p class="missing">${esc(h?M.skillGateText(index):'Cần sở hữu tướng.')}</p>`}${c?cost(p,c):''}${button(levels[index]>=10?'Đã tối đa':'Học / Tăng cấp','do:train',{hero:selected,index},!c||!canPay(p,c||{}))}</section>`;
    }
    if(key==='campaign')return ''; // The illustrated scrolling map is owned by journey-ui.
    if(key==='boss'){
      const next=Math.max(1,p.boss.best+1),farm=Math.max(1,p.boss.best);
      return heading('Vực Boss Vô Hạn','Lặp lại để kiếm vàng, sách EXP và nguyên liệu.')+img('nav-arena','feature-art')+`<div class="stat-grid"><p>Kỷ lục<b>Tầng ${p.boss.best}</b></p><p>Tổng boss hạ<b>${p.boss.wins}</b></p><p>Boss hôm nay<b>${p.daily.bossWins}</b></p></div><h3>Tầng kế tiếp: ${next}</h3><p>Cấp gợi ý ${M.encounter('boss',next).recommended}. Thua không mất tầng đã ghi nhận.</p>${button('Thách đấu tầng '+next,'do:battle',{mode:'boss',index:next})}${button('Farm tầng '+farm,'do:battle',{mode:'boss',index:farm})}<h3>Nhịp phần thưởng</h3><p>12 boss đầu/ngày nhận đủ vàng và EXP. Từ boss 13 còn 25%, tối thiểu 2 sách EXP. 24 boss đầu có Ấn tu luyện và vẫn chịu trần ${fmt(M.DAILY_SEAL_CAP)}/ngày. Nguyên liệu rèn/tiến hóa tiếp tục rơi.</p><p>Từ tầng 60: 1% cơ hội rơi mảnh thần thạch. 50 mảnh dùng rèn trang bị Thần sau ải 300.</p>`+route('Xếp hạng boss','rankings');
    }
    if(key==='quests'||key==='tavern')return heading('Nhiệm Vụ Hàng Ngày','Làm mới lúc 00:00 GMT+7. Vé được trao ở nhiệm vụ ghé thăm mỗi ngày.')+M.DAILY.map(q=>`<article class="quest-live">${img(q.id==='boss'?'nav-arena':'icon-quest')}<div><h3>${q.name}</h3><p>${fmt(Math.min(q.target,p.daily.progress[q.id]||0))}/${fmt(q.target)}</p><small>${Object.entries(q.reward).map(([k,n])=>`${fmt(n)} ${M.RESOURCES[k][0]}`).join(' · ')}</small></div>${button(p.daily.claimed.includes(q.id)?'Đã nhận':'Nhận','do:daily',{quest:q.id},p.daily.claimed.includes(q.id)||(p.daily.progress[q.id]||0)<q.target)}</article>`).join('')+route('Tới vượt ải','campaign')+route('Tới boss','boss');
    if(key==='offline'){
      const r=engine.offline();return heading('Kho Tích Lũy Offline','Tính theo cấp tướng cao nhất và số ải đã vượt.')+img('chest','feature-art')+`<h3>${r.hours.toFixed(2)} / ${r.capHours} giờ</h3><p>${fmt(r.goldPerHour)} vàng/giờ = 80 + cấp cao nhất ×8 + ải đã vượt ×15.</p><div class="stat-grid"><p>Vàng<b>${fmt(r.gold)}</b></p><p>Sách EXP<b>${fmt(r.exp)}</b></p><p>Ấn tu luyện<b>${fmt(Math.min(r.seals,M.DAILY_SEAL_CAP-p.daily.seals))}</b></p></div>${button('Nhận thưởng','do:offline',{},r.hours<1/60)}<p class="hint">Tối đa 12 giờ mỗi lượt tích lũy. Nhận thưởng sẽ bắt đầu lượt tích mới; không có Đá Ngọc hay vé trong thưởng offline. Giờ máy quay lùi không sinh thêm thưởng.</p>`;
    }
    if(key==='summon'){
      const pay=state.summonPayment||'tickets';return heading('Triệu Hồi Ánh Ngọc')+`<div class="summon-balances"><span>${img('ticket')}<b>${fmt(p.wallet.tickets)}</b> vé</span><span>${img('mana')}<b>${fmt(p.wallet.gems)}</b> Đá Ngọc</span></div><div class="live-tabs">${button('Dùng vé','do:summon-payment',{payment:'tickets'},false,pay==='tickets'?'active':'')}${button('Dùng Đá Ngọc','do:summon-payment',{payment:'gems'},false,pay==='gems'?'active':'')}</div>${button('Triệu Hồi','do:summon',{count:1,payment:pay},p.wallet[pay]<(pay==='gems'?120:1),'summon-call')}${button('Triệu Hồi ×10','do:summon',{count:10,payment:pay},p.wallet[pay]<(pay==='gems'?1200:10),'summon-call')}<p>${pay==='gems'?'Đá Ngọc: 120/lần; 1.200/10 lần.':'Vé triệu hồi lấy từ nhiệm vụ ngày và mốc cấp tướng.'} Mốc bảo đảm tướng hiếm: ${p.summon.dry}/300.</p><div class="live-tabs">${button('Tỷ lệ & ghép mảnh','do:rates')}${button('Xem kết quả gần nhất','do:last-summon',{},!p.summon.last.length)}</div>`;
    }
    if(key==='inventory')return heading('Túi Đồ','Tài nguyên hiện có và mảnh tướng.')+`<div class="resource-grid">${Object.entries(M.RESOURCES).map(([id,[name,asset]])=>`<article>${img(asset)}<b>${esc(name)}</b><span>${fmt(remaining(p,id))}</span></article>`).join('')}</div><h3>Mảnh Tướng · Ghép 80 mảnh cùng loại</h3><div class="fragment-grid">${Object.entries(M.HEROES).map(([id,h])=>`<article>${img('portrait-'+id)}<b>${h.name}</b><p>${p.fragments[id]||0}/80</p>${button('Ghép','do:fuse',{hero:id},(p.fragments[id]||0)<80)}</article>`).join('')}</div>`+route('Xem trang bị','equipment');
    if(key==='equipment'){
      const owned=p.equipment.filter(g=>!state.gearFilter||g.slot===state.gearFilter);
      return heading('Trang Bị',`Đang có ${p.equipment.length}/500 · Chọn tướng nhận trang bị`)+heroTabs(p,selected)+`<div class="live-tabs">${button('Tất cả','do:gear-filter',{slot:''})}${Object.entries(M.SLOTS).map(([id,label])=>button(label,'do:gear-filter',{slot:id})).join('')}</div>${!owned.length?'<p>Chưa có trang bị trong mục này. Rèn sau ải 20 hoặc tìm trong triệu hồi.</p>':''}<div class="equipment-grid">${owned.map(g=>{const owner=Object.keys(p.heroes).find(k=>Object.values(p.heroes[k].gear).includes(g.id));return `<article class="equipment-card" style="--rarity:${M.RARITIES[g.rarity].color}">${img(g.slot==='weapon'?'fire-sword':g.slot==='armor'?'stat-shield':'boots')}<h3>${M.SLOTS[g.slot]} +${g.level}</h3><p>${M.RARITIES[g.rarity].name}</p>${g.affix?`<p>${M.AFFIXES[g.affix].name}: ${M.AFFIXES[g.affix].desc}</p>`:''}<p>${owner?'Đang dùng: '+M.HEROES[owner].name:'Chưa trang bị'}</p>${button('Trang bị','do:equip',{id:g.id,hero:selected},!h||owner===selected)}${button('Cường hóa','do:strengthen',{id:g.id},g.level>=20)}${button(owner?'Tháo ra':'Phân rã','do:'+ (owner?'unequip':'salvage'),{id:g.id,hero:owner||selected,slot:g.slot})}</article>`;}).join('')}</div><p class="hint">Cường hóa tối đa +20, luôn thành công; tăng 8% chỉ số trang bị mỗi cấp. Vàng cần = (cấp+1)×900; quặng = (cấp+1)×2.</p>`+route('Lò rèn','forge');
    }
    if(key==='forge')return heading('Lò Rèn','Rèn bằng vàng và nguyên liệu; cường hóa không có xác suất thất bại.')+`<div class="live-tabs">${Object.entries(M.SLOTS).map(([id,label])=>button(label,'do:forge-slot',{slot:id},false,(state.forgeSlot||'weapon')===id?'active':'')).join('')}</div>`+['uncommon','rare','epic','legendary','divine'].map((rarity,i)=>`<article class="recipe-live"><h3 style="color:${M.RARITIES[rarity].color}">${M.SLOTS[state.forgeSlot||'weapon']} · ${M.RARITIES[rarity].name}</h3><p>Mở sau ải ${rarity==='divine'?300:(i+1)*20} · ${fmt((i+1)**2*8000)} vàng · ${(i+1)*25} quặng · ${(i+1)*15} gỗ/vải · ${(i+1)*10} tinh hoa${rarity==='divine'?' · 50 mảnh thần thạch':''}.</p>${button('Chế tạo','do:craft',{rarity,slot:state.forgeSlot||'weapon'},p.campaign.cleared<(rarity==='divine'?300:(i+1)*20))}</article>`).join('')+`<details><summary>Phẩm chất và hiệu ứng Thần</summary>${Object.values(M.AFFIXES).map(a=>`<p><b>${a.name}</b>: ${a.desc}</p>`).join('')}<p>Hiệu ứng chỉ kích hoạt tối đa một lần mỗi lượt khi có xác suất; PvP đấu tập chuẩn hóa chỉ số và vô hiệu hiệu ứng Thần để so tài ghép ngọc.</p></details>`+route('Trang bị / Cường hóa','equipment');
    if(key==='shop')return heading('Cửa Hàng Vàng','Mua nguyên liệu thông dụng; Đá Ngọc và vé không bán bằng vàng.')+`<div class="resource-grid">${[['exp',120],['ore',80],['wood',55],['cloth',55],['skillBooks',1800]].map(([id,price])=>`<article>${img(M.RESOURCES[id][1])}<b>${M.RESOURCES[id][0]}</b><span>${fmt(price)} vàng</span>${button('Mua 1','do:buy',{resource:id},p.wallet.gold<price)}</article>`).join('')}</div><p>Các gói nạp, vé trả phí và ưu đãi sự kiện sẽ phát hành riêng.</p>`+route('VIP / Nạp · Sắp ra mắt','vip');
    if(key==='arena')return heading('Đấu Trường','Chọn kiểu chiến đấu và mục tiêu của bạn.')+`<div class="mode-cards"><article>${img('nav-arena')}<h3>Solo PvP 1vs1</h3><p>Hai người luân phiên trên cùng thiết bị, dùng Tân với chỉ số bằng nhau và cùng bàn ngọc. Không trao tài nguyên hoặc điểm xếp hạng.</p>${button('PvP · Cùng thiết bị','do:battle',{mode:'duel',index:1})}${button('Đấu tập với AI','do:battle',{mode:'pvp',index:1})}${button('PvP online · Coming soon','do:soon',{feature:'PvP online'})}</article><article>${img('icon-friends')}<h3>Đội 3vs3</h3><p>Dự kiến ba vị trí luân phiên, kỹ năng phối hợp và giới hạn hệ trùng. Đang thiết kế.</p>${button('Coming soon','do:soon',{feature:'Đội 3vs3'})}</article><article>${img('nav-summon')}<h3>Boss vô hạn</h3><p>Thử sức theo tầng, kiếm vàng và nguyên liệu. Có thể farm lại tầng đã hạ.</p>${route('Vào vực boss','boss')}</article></div>`+route('Xếp hạng','rankings');
    if(key==='rankings')return heading('Bảng Xếp Hạng','Kỷ lục trên thiết bị này · BXH liên máy chủ sắp ra mắt.')+`<table><thead><tr><th>Hạng mục</th><th>Thành tích của bạn</th></tr></thead><tbody><tr><td>Boss cao nhất</td><td>Tầng ${p.boss.best}</td></tr><tr><td>Sát thương boss cao nhất</td><td>${fmt(p.boss.damageBest)}</td></tr><tr><td>Tổng boss hạ</td><td>${fmt(p.boss.wins)}</td></tr><tr><td>Ải đã vượt</td><td>${p.campaign.cleared}</td></tr><tr><td>Điểm đấu tập cá nhân</td><td>${p.pvp.rating} · ${p.pvp.wins} thắng / ${p.pvp.losses} thua</td></tr></tbody></table><p class="hint">BXH chung dự kiến xếp theo tầng boss, rồi số lượt kết thúc trận và thời điểm lập kỷ lục. Chỉ kết quả được máy chủ xác thực mới được xếp hạng.</p>`+route('Boss vô hạn','boss');
    if(key==='events'){
      const items=p.events.filter(e=>e.enabled&&(!e.startsAt||Date.parse(e.startsAt)<=Date.now())&&(!e.endsAt||Date.parse(e.endsAt)>Date.now())).sort((a,b)=>a.order-b.order);
      return heading('Sự Kiện','Coming soon · Những chuyến phiêu lưu mới đang được chuẩn bị.')+(!items.length?`<div class="coming-soon">${img('icon-event')}<h3>Sắp có sự kiện đầu tiên</h3><p>Lịch sự kiện sẽ hiển thị tại đây khi được công bố.</p></div>`:items.map(e=>`<article class="event-live">${img(e.banner)}<h3>${esc(e.title)}</h3><p>${esc(e.description)}</p><span>Coming soon</span></article>`).join(''));
    }
    if(key==='vip')return heading('VIP & Nạp','Coming soon · Chưa mở thanh toán hoặc cấp quyền VIP.')+`<p>VIP hiện tại: ${p.vip.level} · Tổng nạp đã xác thực: ${fmt(p.vip.paidTotal)} ₫</p><p>Dự kiến: quà vàng hằng ngày, avatar, hiệu ứng vào trận/chat; mốc cao nhận trang bị và tướng riêng. Nội dung tướng riêng sẽ phát hành cùng VIP.</p><table><thead><tr><th>VIP</th><th>Tổng nạp dự kiến</th><th>Quà / đặc quyền dự kiến</th></tr></thead><tbody>${M.VIP.slice(1).map(v=>`<tr><td>${v.level}</td><td>${fmt(v.spend)} ₫</td><td>${fmt(v.dailyGold)} vàng/ngày${v.entryEffect?' · Hiệu ứng vào trận':''}${v.chatEffect?' · Hiệu ứng chat':''}${v.specialEquipment?' · Trang bị riêng':''}${v.specialHero?' · Tướng riêng':''}</td></tr>`).join('')}</tbody></table><p class="hint">Đấu tập/PvP chuẩn hóa không áp dụng lợi thế chỉ số VIP. Chưa có nút thanh toán hoạt động.</p>`;
    if(key==='admin')return heading('Studio cấu hình sự kiện','Bản thử nghiệm local, không phải trang quản trị đã xác thực. Xuất JSON để tích hợp máy chủ sau này.')+`<form id="event-form"><label>ID<input name="id" required pattern="[a-z0-9-]{1,50}" value="new-event"></label><label>Tiêu đề<input name="title" required maxlength="80" value="Sự kiện sắp ra mắt"></label><label>Mô tả<textarea name="description" maxlength="1200">Cuộc phiêu lưu mới đang được chuẩn bị.</textarea></label><label>Banner<select name="banner"><option value="icon-event">Lịch sự kiện</option><option value="icon-gift">Quà tặng</option><option value="icon-arena">Đấu trường</option><option value="chest">Rương</option></select></label><label>Bắt đầu<input name="startsAt" type="datetime-local"></label><label>Kết thúc<input name="endsAt" type="datetime-local"></label><label>Thứ tự<input name="order" type="number" min="0" max="999" value="0"></label><label><input name="enabled" type="checkbox"> Hiện trên trang Sự kiện (Coming soon)</label><button class="game-btn" type="submit">Lưu cấu hình</button></form>${button('Xuất JSON sự kiện','do:export-events')}<h3>Các bản nháp</h3>${p.events.map(e=>`<article><b>${esc(e.title)}</b><small> ${esc(e.id)} · ${e.enabled?'Hiện':'Ẩn'}</small>${button('Sửa','do:edit-event',{id:e.id})}${button('Gỡ khỏi danh sách','do:remove-event',{id:e.id})}</article>`).join('')}`+route('Xem trang sự kiện','events')+mailStudio();
    if(key==='settings')return heading('Cài Đặt & Bản Lưu')+`<p>Tiến độ được lưu trên trình duyệt hiện tại. Để chia sẻ tiến độ giữa Home và combat, hãy chạy cùng một địa chỉ HTTP (ví dụ localhost).</p>${button('Xuất bản sao tiến độ','do:backup')}<p>Không nhập bản lưu tùy ý hoặc chỉnh Đá Ngọc từ giao diện. Thanh toán và đồng bộ tài khoản sẽ nối máy chủ ở giai đoạn sau.</p>`+route('Studio cấu hình sự kiện','admin')+`<h3>Nhật ký gần đây</h3><ol class="activity-log">${p.log.slice(0,15).map(l=>`<li>${esc(l.message)}</li>`).join('')}</ol>`;
    if(key==='mail')return mailPage(state);
    return heading('Cộng Đồng','Coming soon')+`<p>Chat và hiệu ứng VIP sẽ được mở cùng tài khoản trực tuyến.</p>`;
  }
  // Screens visited, so a panel's back arrow returns where the player came from.
  const trail=[];let goingBack=false;
  function remember(key){
    if(trail[trail.length-1]===key)return;
    // Only the back arrow unwinds the trail; ordinary navigation (even A→B→A) always records forward.
    if(goingBack){goingBack=false;trail.pop();if(trail[trail.length-1]!==key)trail.push(key);return;}
    trail.push(key);if(trail.length>20)trail.shift();
  }
  addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(L.screens[key])remember(key);});
  function backNode(key){
    const text=key+'.back';C[text]='Quay lại';
    return {id:text,kind:'button',rect:[12,170,112,112],asset:A['map-back']?'map-back':'nav-tile',fit:'contain',text,labelHidden:true,action:'nav:back',className:'panel-back'};
  }
  function decorate(state){
    const p=engine.read();state.hero=state.hero in M.HEROES?state.hero:p.selected;const key=state.screen;remember(key);
    if(key==='home'){
      const removed=/home\.(shortcut-|right-|soul-)/;L.screens.home.nodes=baseNodes.home.filter(n=>!removed.test(n.id)).map(n=>{const x={...n};if(x.id==='home.hero'){x.kind='image';delete x.action;}if(x.id==='home.place-tavern')x.action='route:quests';if(x.id==='home.quests'){x.action='route:campaign';C[x.text]='Vượt Ải';}return x;});
      [['events','Sự Kiện','icon-event'],['vip','VIP','icon-crown'],['mail','Hòm Thư','icon-mail'],['settings','Cài Đặt','icon-settings']].forEach(([route,label,asset],i)=>{const text=`home.feature-${route}`;C[text]=label;L.screens.home.nodes.push({id:text,kind:'button',rect:[10,157+i*113,96,109],asset:'side-pennant',icon:asset,iconRect:[22,22,55,59],text,labelHidden:true,action:'route:'+route});});
      L.screens.home.nodes.push(panel('home',el=>{const r=engine.offline();el.innerHTML=`<div class="offline-short">${img('chest')}<div><b>Kho offline · ${fmt(r.gold)} vàng</b><p>${fmt(r.goldPerHour)} vàng/giờ · ${r.hours.toFixed(1)}/12h</p></div>${route('Nhận','offline')}</div>`;},[215,1318,525,145]));
    }else if(key==='summon'){
      L.screens.summon.nodes=baseNodes.summon.filter(n=>/\.(profile|level-|level$|gold-|gold$|gem-|gems|mail$|settings$|footer-|nav-|portrait-|central-crystal|guide$|title$|subtitle)/.test(n.id)).map(n=>n.id==='summon.central-crystal'?{...n,action:'do:summon',count:1}:n);
      L.screens.summon.nodes.push(panel(key,el=>el.innerHTML=page(key,p,state),[52,976,837,500]));
    }else{
      L.screens[key].nodes=skeleton(key);L.screens[key].nodes.push(panel(key,el=>el.innerHTML=page(key,p,state)),backNode(key));
    }
    for(const n of L.screens[key].nodes){
      if(n.text){const suffix=n.id.split('.').slice(1).join('.');if(suffix==='gold')C[n.text]=fmt(p.wallet.gold);if(suffix==='gems')C[n.text]=fmt(p.wallet.gems);if(suffix==='level')C[n.text]=String(p.heroes[p.selected].level);}
      if(n.id.endsWith('.gems-plus'))n.action='route:vip';if(n.id.endsWith('.profile'))n.action='route:upgrade';
    }
    return p;
  }
  const cooldown={summoning:false};
  // Rates read the shared summon table (out of 1,000,000) so the popup never drifts from the engine.
  function ratesContent(p){
    const table=M.SUMMON_TABLE||[['hero',1500],['fragments',13500],['novice',60000],['commonGear',285000],['rareGear',20000],['epicGear',1500],['legendaryGear',200],['divineGear',10],['material',618290]];
    const R=M.RARITIES||{},gear=(rarity,fallback)=>'Trang bị '+(R[rarity]?.name||fallback);
    const label={hero:['Tướng hiếm','portrait-fire','top'],fragments:['Mảnh tướng (2–5)','hero-fragment',''],novice:['Bản sao Tân','portrait-novice',''],
      commonGear:[gear('common','Thường'),'helmet',''],rareGear:[gear('rare','Hiếm'),'helmet',''],epicGear:[gear('epic','Sử Thi'),'fire-sword','rare'],
      legendaryGear:[gear('legendary','Huyền Thoại'),'fire-sword','top'],divineGear:[gear('divine','Thần'),'fire-sword','top'],material:['Nguyên liệu','ore','']};
    const pct=n=>(n/10000).toLocaleString('vi-VN',{maximumFractionDigits:3})+'%';
    const wrap=document.createElement('div');wrap.className='rates-sheet';
    wrap.innerHTML=`<table class="gw-table"><thead><tr><th>Phần thưởng</th><th>Tỷ lệ</th></tr></thead><tbody>${table.map(([id,n])=>{const [name,asset,tone]=label[id]||[id,'crest',''];return `<tr class="${tone}"><td>${img(asset)}${esc(name)}</td><td>${pct(n)}</td></tr>`;}).join('')}</tbody></table>
      <div class="gw-note"><b>Bảo đảm</b><p>• Tướng hiếm chắc chắn trong 300 lần kể từ tướng hiếm gần nhất · của bạn: ${fmt(p.summon.dry)}/300.</p><p>• Mảnh tướng xuất hiện sau tối đa 30 lần không có mảnh.</p><p>Ghép 80 mảnh cùng loại thành 1 tướng. Mốc bảo đảm thay kết quả thường nên tỷ lệ dài hạn cao hơn bảng.</p></div>`;
    return wrap;
  }
  function resultsDialog(results){return window.GemwovenSummonReveal(results);}
  function download(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function handle(action,el,ctx,state){
    if(action==='nav:back'){
      // An open letter closes first; otherwise return to the previous screen (Home if none).
      if(state.screen==='mail'&&state.mailOpen){state.mailOpen=null;ctx.render();return true;}
      const target=trail[trail.length-2],next=target&&target!==state.screen&&L.screens[target]?target:'home';goingBack=next===target;ctx.navigate(next);return true;
    }
    if(action.startsWith('preview:')){const route={event:'events',gift:'vip',book:'vip',chat:'chat',mail:'mail',settings:'settings',trophy:'rankings',crown:'rankings',ranking:'rankings'}[action.slice(8)];if(route){ctx.navigate(route);return true;}}
    if(!action.startsWith('do:'))return false;
    (async()=>{try{
      const command=action.slice(3),d=el.dataset,p=engine.read();let result;
      if(command==='hero'){state.hero=d.hero;state.skill=state.skillFilter&&state.skillFilter!=='all'?Number(state.skillFilter):0;ctx.render();return;}
      if(command==='select'){engine.select(d.hero);state.hero=d.hero;}
      else if(command==='upgrade-tab'){state.upgradeTab=d.tab;}
      else if(command==='skill-filter'){state.skillFilter=d.filter;if(d.filter!=='all')state.skill=Number(d.filter);}
      else if(command==='skill-node'){state.skill=Number(d.index);}
      else if(command==='level')result=engine.levelUp(d.hero);
      else if(command==='star')engine.starUp(d.hero);
      else if(command==='evolve')engine.evolve(d.hero);
      else if(command==='train')engine.train(d.hero,Number(d.index));
      else if(command==='fuse')engine.fuse(d.hero);
      else if(command==='offline')result=engine.claimOffline();
      else if(command==='daily')result=engine.claimDaily(d.quest);
      else if(command==='chapter'){state.chapter=Math.max(1,Math.min(M.WORLD.CHAPTERS.length,(state.chapter||Math.floor(p.campaign.cleared/50)+1)+Number(d.delta)));}
      else if(command==='battle'){const battle=engine.begin(d.mode,Number(d.index));location.href='Game.html?encounter='+encodeURIComponent(battle.token);return;}
      else if(command==='gear-filter')state.gearFilter=d.slot;
      else if(command==='forge-slot')state.forgeSlot=d.slot;
      else if(command==='craft'){const g=engine.craft(d.slot,d.rarity);result={message:'Đã rèn '+M.SLOTS[g.slot]+' '+M.RARITIES[g.rarity].name};}
      else if(command==='equip')engine.equip(d.hero,d.id);
      else if(command==='unequip')engine.unequip(d.hero,d.slot);
      else if(command==='strengthen')engine.strengthen(d.id);
      else if(command==='salvage')result=engine.salvage(d.id);
      else if(command==='buy')result=engine.buy(d.resource,Number(d.count||1));
      else if(command==='summon-payment')state.summonPayment=d.payment;
      else if(command==='summon'){
        if(cooldown.summoning)return;cooldown.summoning=true;
        try{const results=engine.summon(Number(d.count||1),d.payment||state.summonPayment||'tickets');ctx.render();await resultsDialog(results);}finally{cooldown.summoning=false;}return;
      }else if(command==='last-summon'){await resultsDialog(p.summon.last);return;}
      else if(command==='rates'){ctx.showModal('Tỷ lệ triệu hồi',[],'',[],{kind:'rates',content:ratesContent(p)});return;}
      else if(command==='soon'){ctx.showModal(d.feature+' · Coming soon',[],'Tính năng sẽ được phát hành riêng khi hệ thống máy chủ sẵn sàng.');return;}
      else if(command==='export-events'){download('gemwoven-events.json',{version:1,events:p.events});return;}
      else if(command==='backup'){download('gemwoven-save.json',p);return;}
      else if(command==='remove-event')engine.removeEvent(d.id);
      else if(command==='mail-tab'){state.mailTab=d.tab;state.mailOpen=null;}
      else if(command==='mail-open'){engine.readMail(d.id);state.mailOpen=d.id;}
      else if(command==='mail-back')state.mailOpen=null;
      else if(command==='mail-claim'){const got=engine.claimMail(d.id);ctx.render();showRewards(ctx,got,'Đã nhận quà');return;}
      else if(command==='mail-claim-all'){const count=engine.mailbox().pending,got=engine.claimAllMail();ctx.render();showRewards(ctx,got,'Đã nhận quà',`Quà từ ${count} thư đã vào Túi Đồ.`);return;}
      else if(command==='mail-delete'){engine.deleteMail(d.id);state.mailOpen=null;}
      else if(command==='mail-delete-read'){const removed=engine.deleteReadMail();state.mailOpen=null;ctx.render();ctx.showModal('Đã dọn hòm thư',[],removed?`Đã xóa ${removed} thư đã đọc.`:'Không có thư nào để xóa.');return;}
      else if(command==='mail-recall')engine.recallMail(d.id);
      else if(command==='edit-event'){const e=p.events.find(e=>e.id===d.id),f=document.getElementById('event-form');for(const [k,v]of Object.entries(e)){const field=f.elements.namedItem(k);if(field){if(field.type==='checkbox')field.checked=v;else field.value=v;}}f.scrollIntoView({block:'start'});return;}
      ctx.render();
      if(result){if(result.message)ctx.showModal('Đã nhận',[],result.message);else showRewards(ctx,result);}
    }catch(error){ctx.showModal('Chưa thể thực hiện',[],error.message);}})();return true;
  }
  function mount(state,ctx){
    const p=engine.read();for(const id of ['gold','gems','level']){const node=document.querySelector(`[data-node="${state.screen}.${id}"]`);if(node)node.textContent=id==='gold'?fmt(p.wallet.gold):id==='gems'?fmt(p.wallet.gems):p.heroes[p.selected].level;}
    if(state.screen!=='mail')state.mailOpen=null;
    // Unread count sits on the painted red dot of the HUD envelope.
    const box=engine.mailbox();for(const node of document.querySelectorAll('#scene [data-node$=".mail"]')){node.querySelector('.mail-count')?.remove();if(!box.unread)continue;const count=document.createElement('span');count.className='mail-count';count.setAttribute('aria-hidden','true');count.textContent=box.unread>99?'99+':String(box.unread);node.append(count);node.setAttribute('aria-label',`Hòm thư · ${box.unread} thư chưa đọc`);}
    const mailForm=document.getElementById('mail-form');if(mailForm)mailForm.addEventListener('submit',e=>{e.preventDefault();try{
      const f=new FormData(mailForm),attachments=[];
      for(let i=0;i<M.MAIL_ATTACHMENTS;i++){const resource=String(f.get('resource'+i)||''),count=String(f.get('count'+i)||'').trim();if(!resource&&!count)continue;if(!resource)throw new Error(`Chọn vật phẩm cho dòng ${i+1}.`);attachments.push({resource,count:count?Number(count):0});}
      engine.sendMail({title:String(f.get('title')||''),body:String(f.get('body')||''),from:String(f.get('from')||''),kind:String(f.get('kind')),expiryDays:Number(f.get('expiryDays')),attachments});
      ctx.render();ctx.showModal('Đã gửi thư',['icon-mail'],'Thư đã vào Hòm Thư của bản lưu này (bản thử nghiệm local).',[{label:'Mở Hòm Thư',route:'mail'}]);
    }catch(error){ctx.showModal('Thư chưa hợp lệ',[],error.message);}});
    const form=document.getElementById('event-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();try{const draft=Object.fromEntries(new FormData(form));draft.enabled=form.elements.namedItem('enabled').checked;draft.status='coming-soon';engine.saveEvent(draft);ctx.render();ctx.showModal('Đã lưu bản nháp',[],'Mở Sự kiện để xem nội dung được bật hiển thị.');}catch(e){ctx.showModal('Cấu hình chưa hợp lệ',[],e.message);}});
  }
  window.GEMWOVEN_GAME={engine,decorate,handle,mount,extra,showRewards,initialHero:engine.read().selected};
})();
