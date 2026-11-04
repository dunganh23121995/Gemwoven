/* Dẫn Đường: a new player's first ten minutes (Claude + Codex 04/11, docs/GAME_DESIGN.md §20 "Vòng Tính năng kế tiếp").
 * Rules and order live in progression.js (GUIDE_STEPS, guideView); this module only points. One target at a time: the
 * Miu Dẫn Lối (the plaza guide NPC) bust with a drawn parchment line, a drawn glove and a drawn ring around the real control, no dimming and
 * nothing blocked (Codex mockups assets/gemwoven/raw/guide/mockup-home.png, mockup-fight.png; pieces in
 * assets/gemwoven/guide). The overlay sits in #stage (941x1672 units) beside #scene, or inside an open dialog whose
 * button it points at, and follows the target as the screen scrolls or resizes. Words are the HTML layer.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression;
  if(!G?.engine?.guide||!M?.GUIDE_STEPS)return;
  const W=941,H=1672,HOME_TOP=1040,A=window.GEMWOVEN_ASSETS||{},file=k=>A['guide-'+k]?.file||'',CAT=file('cat');
  for(const k of ['plaque','count','tab','ring','cat'])document.documentElement.style.setProperty('--g-'+k,`url("${new URL(file(k),document.baseURI).href}")`);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let ctxRef=null,stateRef=null,layer=null,tick=0,lastHtml='';
  const shown=el=>{if(!el?.isConnected)return false;const r=el.getBoundingClientRect();if(r.width<4||r.height<4)return false;const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity!==0;};
  const pick=(sel,root=document.getElementById('scene'))=>root?[...root.querySelectorAll(sel)].find(shown)||null:null;
  const openDialog=()=>[...document.querySelectorAll('dialog[open]')].filter(d=>!d.classList.contains('guide-skip-dialog')).pop()||null;
  const node=id=>pick(`[data-node="${id}"]`)||pick(`[data-node$=".${id}"]`);

  // The way back to town from wherever the player wandered: the nav's Trang Chủ, or the screen's own back control.
  const homeward=()=>{const n=node('nav-home');if(n)return {el:n,text:'Về Trang Chủ',cue:true};const b=pick('[data-node$=".back"]')||pick('[data-action="journey:atlas"]');return b?{el:b,text:'Quay lại',cue:true}:null;};
  function fight(stage){
    const card=pick('[data-action="journey:challenge"]');
    if(card)return Number(card.dataset.index)===stage?{el:card,text:'Bấm Khiêu Chiến',over:pick('.sc-roster'),compact:true}:{el:pick('.encounter-close')||card,text:'Đóng thẻ ải này'};
    const seal=node('stage-'+stage);if(seal&&seal.dataset.node.startsWith('campaign.'))return {el:seal,text:`Chọn ải ${stage}`};
    const region=node('region-1');if(region)return {el:region,text:'Chọn Chương 1: '+(M.WORLD?.CHAPTERS?.[0]?.name||'')};
    const go=node('explore');if(go)return {el:go,text:stage===1?'Bấm Khám Phá để vào ải đầu tiên':`Bấm Khám Phá · vượt ải ${stage}`,at:HOME_TOP};
    return homeward();
  }
  function visit(){
    const accept=node('quest-accept'),name=node('quest-name');
    if(accept&&/Ghé thăm/i.test(name?.textContent||''))return {el:accept,text:'Bấm Nhận Thưởng',over:node('quest-heading-board')};
    const tab=node('tavern-tab-0');if(tab)return {el:tab,text:'Chọn Ghé Thăm'};
    const inn=node('place-tavern');if(inn)return {el:inn,text:'Vào Quán Bia nhận quà'};
    return homeward();
  }
  function newbie(){
    const day=pick('button[data-action="growth:newbie"][data-day="1"]');if(day)return {el:day,text:'Nhận quà Tân Thủ ngày 1',scroll:true,over:day.closest('article')};
    const ev=node('feature-events');if(ev)return {el:ev,text:'Mở Sự Kiện'};
    return homeward();
  }
  function level(){
    const act=node('upgrade-action');
    if(act)return /Tăng Cấp/i.test(act.textContent)?{el:act,text:'Bấm Tăng Cấp',mini:[346,154,300,92],glove:'left'}:{el:node('upgrade-tab-0')||act,text:'Chọn thẻ Cấp'};
    const nav=node('nav-upgrade');if(nav)return {el:nav,text:'Mở Tướng',cue:true};
    return homeward();
  }
  function summon(){
    const quote=save().q;if(quote.payment!=='tickets'||!quote.enough)return null;   // never point at a Đá Ngọc payment
    const d=openDialog();
    if(d?.id==='summon-confirm'){const ok=[...d.querySelectorAll('.gw-actions button:not(.secondary):not(:disabled)')].find(shown);return ok&&/×1/.test(d.getAttribute('aria-label')||'')?{el:ok,text:'Dùng 1 vé',root:d,cue:true}:null;}
    const one=node('summon-one');if(one&&one.dataset.node.startsWith('summon.'))return {el:one,text:'Triệu hồi ×1 bằng vé'};
    const nav=node('nav-summon');if(nav)return {el:nav,text:'Mở Triệu Hồi',cue:true};
    return homeward();
  }
  function gear(){
    const p=save().p,piece=p.equipment[0];if(!piece)return null;
    const wear=pick('[data-action="do:equip"]:not(:disabled)');if(wear)return {el:wear,text:'Mặc món này'};
    const item=pick('[data-action="outfit:item"]');if(item)return {el:item,text:'Chọn một món'};
    const slot=node('gear-'+piece.slot);if(slot&&slot.dataset.node.startsWith('upgrade.'))return {el:slot,text:'Chạm ô '+(M.SLOTS[piece.slot]||'trang bị')};
    const nav=node('nav-upgrade');if(nav)return {el:nav,text:'Mở Tướng',cue:true};
    return homeward();
  }
  // A lesson speaks only on its own screen (never over another screen's actions); elsewhere it waits.
  function lessonTarget(id){
    if(id==='skills'&&stateRef?.screen==='skills'){
      const p=save().p,shown=stateRef.hero,ok=k=>p.heroes[k]?.level>=10,eligible=Object.keys(p.heroes).find(ok);
      if(!ok(shown)&&eligible){const chip=pick(`[data-action="do:hero"][data-hero="${eligible}"]`);if(chip)return {el:chip,text:'Chọn '+(M.HEROES[eligible]?.name||'tướng')+' (cấp 10+)',ack:true,at:196};}
      return {el:pick('[data-action="do:skill-node"][data-index="1"]'),text:'Chạm Bị Động để xem',ack:true,at:196,trim:.3};}
    if(id==='forge'&&stateRef?.screen==='forge')return {el:null,text:'Rèn Đồ đã mở thêm phôi Tốt',ack:true};
    return null;
  }
  function target(v){
    if(v.closing)return {el:null,text:'Giỏi lắm! Giờ tự khám phá nhé',ack:'close',at:HOME_TOP};
    if(v.lesson)return lessonTarget(v.lesson);
    if(!v.active)return null;
    const cleared=save().p.campaign.cleared;
    return ({win1:()=>fight(1),visit,newbie1:newbie,level,win3:()=>fight(Math.min(3,cleared+1)),summon,gear,win5:()=>fight(Math.min(5,cleared+1))})[v.step]?.()||null;
  }

  // ----- drawing -----
  function ensureLayer(root){
    const host=root||document.getElementById('stage');if(!host)return null;
    if(!layer||layer.parentNode!==host){layer?.remove();layer=document.createElement('div');layer.className='guide-layer'+(root?' in-dialog':'');layer.setAttribute('aria-live','polite');host.append(layer);lastHtml='';
      layer.addEventListener('click',onClick);}
    return layer;
  }
  function hide(){if(layer){layer.remove();layer=null;lastHtml='';}}
  // The save is read at most about once a second (the pointer itself follows the target every 250 ms).
  let cache={at:0,v:null,p:null};
  const fresh=()=>{cache={at:0,v:null,p:null};};
  const save=()=>{if(!cache.p||performance.now()-cache.at>900){cache={at:performance.now(),v:G.engine.guide(),p:G.engine.read(),q:G.engine.summonQuote(1)};}return cache;};
  function place(){
    if(!stateRef||document.body.classList.contains('page-hidden'))return;
    let v;try{v=save().v;}catch{return hide();}
    const t=target(v);
    const d=openDialog();if(!t||(d&&t.root!==d)||(!t.el&&!t.ack))return hide();
    const stage=document.getElementById('stage'),S=stage.getBoundingClientRect(),k=S.width/W;if(!k)return hide();
    const root=t.root||null,host=ensureLayer(root);if(!host)return;
    // Stage units relative to the host (the stage itself, or the dialog the target lives in).
    const origin=root?root.getBoundingClientRect():S;
    if(t.el&&t.scroll){const r=t.el.getBoundingClientRect();if(r.top<S.top+180*k||r.bottom>S.bottom-200*k){
      let box=t.el.parentElement;while(box&&box.id!=='scene'&&!(box.scrollHeight>box.clientHeight+4&&/auto|scroll/.test(getComputedStyle(box).overflowY)))box=box.parentElement;
      if(box&&box.id!=='scene'){const b=box.getBoundingClientRect();box.scrollTop+=r.top+r.height/2-(b.top+b.height/2);}}}
    const r=t.el?.getBoundingClientRect(),box=r?[(r.left-origin.left)/k,(r.top-origin.top)/k,r.width/k,r.height/k]:null;
    host.style.setProperty('--k',root?k:1);
    const counter=v.active&&!v.lesson&&!v.closing?`<span class="guide-count"><b>${v.index}/${v.total}</b></span>`:'';
    const action=t.ack?`<button type="button" class="guide-tab" data-guide="${t.ack==='close'?'close':'ack'}">${t.ack==='close'?'Xong':'Đã hiểu'}</button>`:`<button type="button" class="guide-tab" data-guide="skip" aria-label="Bỏ qua hướng dẫn">Bỏ qua</button>`;
    // The line sits above a low target and below a high one, clear of the HUD (top 150) and the nav bar (bottom 182).
    const hostH=root?origin.height/k:H,hostW=root?origin.width/k:W,talkH=t.compact?116:150,catW=t.compact?140:166;
    const ov=t.over?.getBoundingClientRect?.(),overTop=ov&&ov.height?(ov.top-origin.top)/k:null;
    let top;if(t.mini)top=t.mini[1];else if(t.at!=null)top=t.at;else if(overTop!=null&&overTop-talkH-8>=(root?8:150))top=overTop-talkH-8;else if(!box)top=root?8:640;else if(box[1]+box[3]/2>hostH*.42)top=Math.max(root?8:150,box[1]-talkH-(root?20:86));else top=Math.min(hostH-(root?talkH+8:182+talkH),box[1]+box[3]+(root?20:64));
    const talkW=Math.min(702,hostW-catW-40),left=Math.max(8,(hostW-talkW-catW+30)/2);
    // Away from the path (pointing at the nav or a back control) only the ring and the glove show: no plank over this
    // screen's own actions.
    const m=t.mini,talk=m?{l:m[0]-104,w:m[2]+104,h:m[3],pw:m[2]}:{l:left,w:talkW+catW-30,h:talkH,pw:talkW};
    let html=t.cue?'':`<div class="guide-talk${t.compact?' compact':''}${m?' mini':''}" style="left:${talk.l}px;top:${top}px;width:${talk.w}px;height:${talk.h}px"><span class="guide-cat" aria-hidden="true"></span>`+
      `<div class="guide-plaque" style="width:${talk.pw}px">${m?'':counter}<p>${esc(t.text)}</p>${action}</div></div>`;
    // A nav item is ringed above its painted label (the label band starts about 1620).
    if(box&&/\.nav-/.test(t.el.dataset.node||'')){box[3]=Math.min(box[3],1612-box[1]);}
    if(box&&t.trim)box[3]*=1-t.trim;   // ring the medallion, not the plate painted under it
    if(box){const pad=/\.nav-/.test(t.el.dataset.node||'')?4:12;html+=`<span class="guide-ring" style="left:${box[0]-pad}px;top:${box[1]-pad}px;width:${box[2]+pad*2}px;height:${box[3]+pad*2}px"></span>`;
      // The glove's fingertip (its lower-left) rests on the target's upper-right edge.
      // From the left (mirrored), its fingertip on the target's upper-left edge, when the right side holds counts.
      if(t.glove==='left'){const tipX=box[0]+box[2]*.12,tipY=box[1]+Math.min(14,box[3]*.25);html+=`<img class="guide-glove flip" src="${file('glove-left')}" alt="" draggable="false" style="left:${Math.max(0,tipX-118)}px;top:${Math.max(0,tipY-84)}px">`;}
      else{const tipX=box[0]+box[2]*(box[2]>300?.86:.7),tipY=box[1]+Math.min(14,box[3]*.25),gx=Math.min(hostW-124,tipX-6),gy=Math.max(0,tipY-84);html+=`<img class="guide-glove" src="${file('glove-left')}" alt="" draggable="false" style="left:${gx}px;top:${gy}px">`;}}
    if(html!==lastHtml){host.innerHTML=html;lastHtml=html;}
  }
  function onClick(e){
    const b=e.target.closest('[data-guide]');if(!b)return;e.preventDefault();e.stopPropagation();
    const what=b.dataset.guide;
    if(what==='close'){G.engine.guideClose();fresh();place();return;}
    if(what==='ack'){const v=G.engine.guide();if(v.lesson)G.engine.guideLesson(v.lesson);fresh();place();return;}
    const modal=window.GemwovenUI.makeDialog('guide-skip','Bỏ hướng dẫn?','guide-skip-dialog');
    modal.body.innerHTML='<p class="guide-skip-note">Bật lại lúc nào cũng được ở Cài Đặt.</p>';
    const keep=document.createElement('button');keep.type='button';keep.className='gw-btn secondary';keep.textContent='Tiếp tục';keep.onclick=()=>modal.close();
    const skip=document.createElement('button');skip.type='button';skip.className='gw-btn';skip.textContent='Bỏ qua';skip.onclick=()=>{G.engine.guideSkip();fresh();modal.close();hide();};
    modal.actions.append(keep,skip);modal.present();
  }
  // Cài Đặt: "Hướng dẫn · Xem lại" clears the skip and resumes the first unmet goal (nothing to repeat: the guide gives nothing).
  function settingsRow(){
    const form=document.getElementById('home-audio-form');if(!form||form.querySelector('[data-guide-row]'))return;
    const v=G.engine.guide(),row=document.createElement('div');row.className='mute-control guide-row';row.dataset.guideRow='1';
    row.innerHTML=`<img class="kit-ico" src="${CAT}" alt=""><span>Hướng dẫn</span>`+(v.finished&&!v.lesson?'<small>Đã hoàn tất</small>':`<button type="button" class="game-btn guide-replay"${v.skipped?'':' disabled'}>${v.skipped?'Xem lại':'Đang bật'}</button>`);
    row.querySelector('.guide-replay')?.addEventListener('click',e=>{e.preventDefault();G.engine.guideReplay();fresh();row.remove();settingsRow();});
    (form.querySelector('.kit-game')||form).append(row);
  }
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    const out=mount(state,ctx);stateRef=state;ctxRef=ctx;fresh();
    try{if(G.engine.guide().stale)G.engine.guideSync();}catch{}
    if(state.screen==='settings')settingsRow();
    place();clearInterval(tick);tick=setInterval(place,250);
    return out;
  };
  window.addEventListener('resize',()=>place());document.addEventListener('scroll',()=>place(),true);
  window.GemwovenGuideUI={place,target};
})();
