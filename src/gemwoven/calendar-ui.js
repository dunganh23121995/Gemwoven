/* Lịch 28 ngày (Claude + Codex 04/11, docs/GAME_DESIGN.md §20 "Vòng Tính năng kế tiếp"; Codex mockup
 * assets/gemwoven/raw/calendar/mockup.png): Sự Kiện's calendar row becomes the season's 4×7 calendar of the Ghé thăm
 * reward. Rules: progression.js calendarView (only today, through the same claimDaily('login') as Quán Bia; no catch-up).
 * Day 28 keeps the separate memory chest (memory-ui.js picker, action memory:chest). Cells, stamps, tray and lock are
 * drawn by Codex (assets/gemwoven/calendar); the gift, chest, resource icons and the gold button are reused; words and
 * numbers are HTML.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,A=window.GEMWOVEN_ASSETS||{},L=window.GEMWOVEN_LAYOUT;
  if(!G?.engine?.calendar||!L?.screens)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const file=k=>(A[k]||A['chest']||{}).file||'',img=(k,cls='')=>`<img class="${cls}" src="${esc(file(k))}" alt="" draggable="false">`;
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),DAY=86400000;
  const date=ms=>new Date(ms+7*3600000).toISOString().slice(5,10).split('-').reverse().join('/');
  for(const k of ['tray','cell','cell-claimed','cell-today','cell-dim'])document.documentElement.style.setProperty('--cal-'+k,`url("${new URL(file('cal-'+k),document.baseURI).href}")`);
  const icon=id=>M.RESOURCES?.[id]?.[1]||'chest';

  function block(){
    const v=G.engine.calendar(),c=v.chest,vouchers=G.engine.memory?.().vouchers||0;
    const tray=Object.entries(v.reward).filter(([,n])=>n>0).map(([id,n])=>`<span class="cal-gift" title="${esc(M.RESOURCES?.[id]?.[0]||id)}">${img(icon(id))}<b>${fmt(n)}</b></span>`).join('');
    const cells=v.cells.map(x=>{
      const last=x.day===v.cells.length,mark=x.state==='claimed'?img('cal-check','cal-mark'):x.state==='missed'?img('cal-cross','cal-mark'):x.state==='today'?img('icon-gift','cal-mark gift'):x.state==='future'&&!last?img('cal-lock','cal-mark lock'):'';
      const chest=last?`<span class="cal-chest${c.claimed?' is-done':c.ready?' is-ready':''}">${img('chest')}${c.claimed?img('cal-check','cal-chest-done'):c.ready?'':img('cal-lock','cal-chest-lock')}</span><b class="cal-qty">${c.fragments}</b>`:'';
      return `<button type="button" class="cal-cell is-${x.state}${last?' is-last':''}" data-action="cal:cell" data-day="${x.day}" aria-label="Ngày ${x.day}">`+
        `<b class="cal-n">${x.day}</b>${last?chest+(x.state==='claimed'?img('cal-check','cal-mark small'):''):mark}</button>`;}).join('');
    const btn=v.claimedToday?`<button type="button" class="game-btn cal-claim is-done" disabled>Đã nhận hôm nay</button>`:
      `<button type="button" class="game-btn kp-gold cal-claim" data-action="cal:claim"${v.canClaim?'':' disabled'}>Nhận hôm nay</button>`;
    return `<section class="cal${v.canClaim?' is-ready':''}"><div class="cal-head"><h3 class="kp-sec"><span class="kp-plaque-in">Lịch 28 ngày</span></h3>`+
      `<b class="cal-day">Ngày ${v.today}/${v.cells.length}</b><details class="hint kp-info" data-kp="1"><summary aria-label="Cách nhận"><i aria-hidden="true">i</i></summary>`+
      `<p>Mùa 28 ngày ${date(v.start)} – ${date(v.end-DAY)}, làm mới 00:00 (GMT+7). Mỗi ngày nhận một lần quà Ghé thăm (chung với Quán Bia); ngày đã lỡ không nhận bù. Ngày ${c.openDay} có thêm rương ${c.fragments} mảnh tự chọn (tướng đã sở hữu, chưa 6★, không phải Hiro).</p></details></div>`+
      `<div class="cal-tray">${tray}</div><div class="cal-grid">${cells}</div><div class="cal-foot">${btn}${vouchers?`<button type="button" class="game-btn cal-voucher" data-action="memory:chest" data-voucher="1">${img('ticket','cal-ticket')}<span>Phiếu 20 mảnh · ${vouchers}</span></button>`:''}</div></section>`;
  }
  // A day's note: claimed, missed (no catch-up), before this account, or when it opens.
  function cellNote(ctx,day){
    const v=G.engine.calendar(),x=v.cells[day-1];if(!x)return;
    if(x.state==='today'&&v.canClaim)return claim(ctx);
    const text={claimed:'Đã nhận',missed:'Đã lỡ · không nhận bù',none:'Trước khi bắt đầu',future:'Mở ngày '+date(x.date),today:v.claimedToday?'Đã nhận':'Hôm nay'}[x.state];
    const modal=window.GemwovenUI.makeDialog('cal-day','Ngày '+day,'kp-pop cal-pop');
    modal.body.innerHTML=`<p class="cal-pop-date">${date(x.date)}</p><p class="cal-pop-state is-${x.state}">${esc(text)}</p>`;modal.present();
  }
  function claim(ctx){try{const got=G.engine.claimDaily('login');ctx.render();G.showRewards(ctx,got,'Quà Ghé thăm');}catch(e){ctx.showModal('Chưa thể nhận',[],e.message);}}

  // Sự Kiện: replace memory-ui's calendar row (after it is built) with the calendar; the weekly quests follow.
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='events')return p;
    const live=L.screens.events?.nodes.find(n=>n.id==='events.live');if(!live||live.calendarWrapped)return p;
    const build=live.build;live.calendarWrapped=true;
    live.build=el=>{build(el);const old=el.querySelector('.mem-cal'),html=block();if(old)old.outerHTML=html;else(el.querySelector('.weekly-quests')||el).insertAdjacentHTML('beforebegin',html);};
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='cal:claim'){claim(ctx);return true;}
    if(action==='cal:cell'){const day=Number(el.dataset.day),v=G.engine.calendar();
      if(day===v.cells.length)return handle('memory:chest',el,ctx,state);   // day 28 is the chest; its daily reward is the wide button
      cellNote(ctx,day);return true;}
    return handle(action,el,ctx,state);
  };
  window.GemwovenCalendarUI={block};
})();
