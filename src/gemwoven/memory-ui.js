/* D3 "Chu kỳ lặp để lấy thêm mảnh tướng" in the hub (Codex mockup assets/gemwoven/raw/memory-shop/mockup-raw.png):
 * the "Lịch 28 ngày" row on Sự Kiện with the free day-28 chest, and the chest's hero picker (also opened from a
 * voucher in Túi Đồ). Cửa Hàng · Ký Ức lives in art-screens.js shop(). Rules and numbers: progression.js memory(),
 * liveops.js MEMORY. Markup uses the shared kit classes (kp-*) that ui-kit-panels.css dresses; memory.css adds the rest.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,A=window.GEMWOVEN_ASSETS,L=window.GEMWOVEN_LAYOUT;
  if(!G||!M||!O?.MEMORY||!G.engine?.memory)return;
  const X=O.MEMORY,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const src=k=>(A[k]||A['chest']).file,img=(k,cls='')=>`<img class="${cls}" src="${esc(src(k))}" alt="" draggable="false">`;
  const DAY=86400000,date=ms=>new Date(ms+7*3600000).toISOString().slice(5,10).split('-').reverse().join('/');

  function calendar(){
    const v=G.engine.memory(),c=v.chest,left=Math.max(0,Math.ceil((c.opensAt-Date.now())/DAY));
    const state=c.claimed?'is-claimed':c.ready?'is-ready':'is-wait';
    const tag=c.claimed?'<em class="mem-tag is-done">Đã nhận</em>':c.ready?'<em class="mem-go">Miễn phí</em>':`<em class="mem-tag">${left} ngày</em>`;
    return `<section class="mem-cal ${state}"><div class="mem-head"><h3 class="kp-sec"><span class="kp-plaque-in">Lịch 28 ngày</span></h3>`+
      `<details class="hint kp-info" data-kp="1"><summary aria-label="Cách nhận"><i aria-hidden="true">i</i></summary><p>Mùa 28 ngày từ ${date(c.start)}. Ngày ${c.openDay} mở rương miễn phí: ${c.fragments} mảnh một tướng đã sở hữu, chưa 6★ (không phải Hiro). Chưa có tướng hợp lệ thì cất phiếu không hết hạn; lỡ ngày ${c.openDay} cũng thành phiếu.</p></details>`+
      `<b class="mem-day">Ngày ${c.day}/${O.PASS.seasonDays}</b></div>`+
      `<span class="kp-bar mem-bar"><i style="width:${Math.min(100,c.day/O.PASS.seasonDays*100)}%"></i></span>`+
      `<button type="button" class="mem-chest" data-action="memory:chest" aria-label="Rương ngày ${c.openDay}: ${c.fragments} mảnh tự chọn"><span class="mem-socket">${img('chest')}</span>`+
      `<span class="mem-what"><b>${c.fragments} mảnh<br>tự chọn</b>${c.ready?'':`<small>Miễn phí · ngày ${c.openDay}</small>`}</span>${tag}</button>`+
      (v.vouchers?`<button type="button" class="game-btn kp-gold mem-voucher" data-action="memory:chest" data-voucher="1">${img('ticket','mem-ticket')}<span>Dùng phiếu · ${v.vouchers}</span></button>`:'')+`</section>`;
  }

  // The picker: owned heroes below 6★ (never Hiro); a voucher when none qualifies. Before day 28 it only tells the day.
  function picker(ctx,state,voucher){
    const v=G.engine.memory(),c=v.chest,useVoucher=voucher||(!c.ready&&v.vouchers>0);
    const modal=window.GemwovenUI.makeDialog('memory-chest',useVoucher||c.ready?'Chọn tướng':'Rương ngày '+c.openDay,'kp-pop memory-dialog');
    const done=got=>{modal.close();ctx.render();if(got.voucher)ctx.showModal('Đã cất phiếu',['ticket'],'Phiếu 20 mảnh không hết hạn, nằm trong Túi Đồ · Khác.');
      else ctx.showModal(`+${got.fragments} mảnh ${M.HEROES[got.hero].name}`,['fragment-'+got.hero],`Đang có ${G.engine.read().fragments[got.hero]||0} mảnh.`);};
    if(!useVoucher&&!c.ready){
      modal.body.innerHTML=`<div class="mem-pop-chest">${img('chest')}</div><p class="mem-pop-tag">${c.fragments} mảnh tự chọn</p><p class="mem-pop-note">${c.claimed?'Đã nhận mùa này · mùa sau ngày '+c.openDay:`Mở ngày ${c.openDay} · ${date(c.opensAt)}`}</p>`;
      modal.present();return;}
    let pick=c.choices[0]||null;
    if(!c.choices.length){
      modal.body.innerHTML=`<p class="mem-pop-tag">${c.fragments} mảnh</p><div class="mem-pop-chest">${img('ticket')}</div><p class="mem-pop-note">Chưa có tướng hợp lệ · Phiếu không hết hạn</p>`;
      if(!useVoucher){const b=document.createElement('button');b.type='button';b.className='gw-btn';b.textContent='Cất phiếu';
        b.onclick=()=>{try{done(G.engine.claimMemoryChest());}catch(e){ctx.showModal('Chưa thể nhận',[],e.message);}};modal.actions.append(b);}
      modal.present();return;}
    const grid=c.choices.map(k=>{const h=G.engine.read().heroes[k];return `<button type="button" class="mem-hero${k===pick?' is-picked':''}" data-hero="${esc(k)}" aria-pressed="${k===pick}"><span class="mem-socket">${img('portrait-'+k)}</span><b>${esc(M.HEROES[k].name)}</b><small>${'★'.repeat(h.stars)}</small></button>`;}).join('');
    modal.body.innerHTML=`<p class="mem-pop-tag">${c.fragments} mảnh</p><div class="mem-heroes">${grid}</div>`;
    modal.body.addEventListener('click',e=>{const b=e.target.closest('.mem-hero');if(!b)return;pick=b.dataset.hero;for(const x of modal.body.querySelectorAll('.mem-hero')){x.classList.toggle('is-picked',x===b);x.setAttribute('aria-pressed',String(x===b));}});
    const b=document.createElement('button');b.type='button';b.className='gw-btn';b.textContent=`Nhận ${c.fragments} mảnh`;
    b.onclick=()=>{try{done(useVoucher?G.engine.useMemoryVoucher(pick):G.engine.claimMemoryChest(pick));}catch(e){ctx.showModal('Chưa thể nhận',[],e.message);}};
    modal.actions.append(b);modal.present();
  }

  // Sự Kiện: the row sits under Hành Trình Tân Thủ, before the weekly quests.
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='events')return p;
    const live=L.screens.events?.nodes.find(n=>n.id==='events.live');if(!live||live.memoryWrapped)return p;
    const build=live.build;live.memoryWrapped=true;
    live.build=el=>{build(el);const html=calendar(),wq=el.querySelector('.weekly-quests');if(wq)wq.insertAdjacentHTML('beforebegin',html);else el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',html);};
    return p;
  };
  // Weekly-quest reward sockets show the dust vial (ui-kit-panels maps wallet resources only).
  const mount=G.mount;
  G.mount=(state,ctx)=>{const r=mount(state,ctx);if(state?.screen==='events')for(const s of document.querySelectorAll('#scene .kp-socket[title="Bụi Ký Ức"] img'))s.src=src('memory-dust');return r;};
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='memory:chest'){picker(ctx,state,el?.dataset?.voucher==='1'||state.screen==='inventory');return true;}
    return handle(action,el,ctx,state);
  };
  window.GemwovenMemoryUI={calendar,picker};
})();
