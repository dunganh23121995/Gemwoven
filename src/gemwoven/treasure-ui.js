/* Báu vật — local trial (docs/GAME_DESIGN.md §4, §20 round 9). The trial runs the whole game on a copy of the save
 * (progression.js storageFor); this file shows it: a section on Sự Kiện to enter or leave the trial, the treasure
 * collection as pictures (tap one for its numbers, upgrade, Mượn Hồn source), two slots on the Tướng screen, and a
 * label that stays on screen while the trial is on. Rules and numbers live in progression.js (TREASURE).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT;if(!G?.engine?.treasure||!M?.TREASURE)return;
  const T=M.TREASURE,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),pct=x=>Math.round(x*100)+'%';
  const active=()=>{try{return localStorage.getItem('gemwoven.trialActive')==='1';}catch{return false;}};
  const pic=(t,cls='')=>`<img class="${cls}" src="assets/gemwoven/treasures/treasure-${t.family}-${t.quality}.webp" alt="">`;
  const qi=t=>T.qualities.indexOf(t.quality);
  const statLine=s=>[['atk','stat-attack','Công'],['hp','stat-heart','HP'],['def','stat-shield','Thủ']].filter(([k])=>s[k]).map(([k,icon,l])=>`<span><img src="${window.GEMWOVEN_ASSETS[icon]?.file||''}" alt="${l}">+${k==='def'?Math.round(s[k]*100):pct(s[k])}${k==='def'?'':''}</span>`).join('');
  const fail=(ctx,e)=>ctx.showModal('Chưa thể thực hiện',[],e.message);

  function section(){
    const on=active(),d=G.engine.treasure();
    if(!on)return `<section class="treasure-trial"><h3>Kỳ Báu Vật <em class="trial-tag">Bản thử nghiệm cục bộ</em></h3><div class="treasure-row">${['mountain','borrow','counter'].map(f=>pic({family:f,quality:'red'},'treasure-teaser')).join('')}</div>`+
      `<button type="button" class="game-btn" data-action="treasure:enter">Vào bản thử</button><details class="hint"><summary>ⓘ Bản thử là gì</summary><p>Chơi trên một bản sao tài khoản: điểm, báu vật và mọi tiến triển trong bản thử không quay về tài khoản thật. Thoát bất cứ lúc nào. Máy chủ sẽ quyết định khi phát hành.</p></details></section>`;
    return `<section class="treasure-trial is-on"><h3>Kỳ Báu Vật <em class="trial-tag">Bản thử nghiệm cục bộ</em></h3>`+
      `<div class="treasure-points"><b>${fmt(d.points)}</b><small>điểm</small></div>`+
      (d.items.length?`<div class="treasure-grid">${d.items.map(t=>`<button type="button" data-action="treasure:open" data-id="${t.id}" class="treasure-cell q-${t.quality}" aria-label="${esc(T.families[t.family].name)} ${T.names[qi(t)]}">${pic(t)}<i>${T.names[qi(t)]}</i></button>`).join('')}</div>`
        :`<p class="growth-lead">Chọn một báu vật Lam tặng để bắt đầu:</p><div class="treasure-grid">${Object.entries(T.families).map(([f,v])=>`<button type="button" data-action="treasure:gift" data-family="${f}" class="treasure-cell q-blue">${pic({family:f,quality:'blue'})}<i>${esc(v.name)}</i></button>`).join('')}</div>`)+
      `<details class="hint"><summary>ⓘ Cách nhận điểm</summary><p>Mỗi ngày nhận thưởng ít nhất 3 nhiệm vụ ngày: +${T.points.daily}. Mỗi tuần thắng 8 Boss Vô Hạn: +${T.points.boss}. Mỗi tuần có lượt Sân Thử Luyện ≥ 3 thanh: +${T.points.trial}. Khoảng 600 điểm mỗi 14 ngày; Lam → Thần cần 4.800 điểm (≈ 16 tuần).</p></details>`+
      `<button type="button" class="game-btn secondary" data-action="treasure:leave">Thoát bản thử</button></section>`;
  }
  function itemDialog(ctx,id){
    const d=G.engine.treasure(),t=d.items.find(x=>x.id===id);if(!t)return;const q=qi(t),fam=T.families[t.family];
    const modal=window.GemwovenUI.makeDialog('treasure-item',`${fam.name} · ${T.names[q]}`,'growth-dialog treasure-dialog');
    const effect=q<2?'Hiệu ứng mở từ phẩm Cam.':t.family==='mountain'?`Tuyệt kỹ gây thêm ${pct(fam.hp[q])} HP tối đa của mục tiêu (chỉ PvE).`:t.family==='counter'?`Tuyệt kỹ trúng: địch mất ${fam.drain[q]} năng lượng.`:`Mang một nửa phần tăng của Bị Động một tướng khác${t.borrow?` (đang mượn: ${esc(M.HEROES[t.borrow]?.name)})`:''}.`;
    const next=q<4?(T.shards[q+1]?`${T.shards[q+1]} mảnh · ${fmt(T.shards[q+1]*(q+1===3?150:175))} điểm`:`${fmt(T.price[q+1])} điểm`):null;
    modal.body.innerHTML=`<div class="treasure-hero">${pic(t)}</div><p class="stat-chips">${statLine(t.stats)}</p><p class="growth-lead">${effect}</p>`+
      (next?`<div class="treasure-up">${pic(t)}<i>→</i>${pic({...t,quality:T.qualities[q+1]})}<small>${next}</small></div>`:'')+
      (t.family==='borrow'&&q>=2?`<div class="treasure-borrow">${Object.keys(G.engine.read().heroes).map(k=>`<button type="button" data-borrow="${k}" class="${t.borrow===k?'on':''}" aria-label="Mượn ${esc(M.HEROES[k].name)}"><img src="${window.GEMWOVEN_ASSETS['face-'+k]?.file||''}" alt=""></button>`).join('')}</div>`:'');
    modal.body.querySelectorAll('[data-borrow]').forEach(b=>b.onclick=()=>{try{G.engine.treasureBorrow(t.id,b.dataset.borrow);modal.close();ctx.render();itemDialog(ctx,id);}catch(e){fail(ctx,e);}});
    if(next){const up=document.createElement('button');up.type='button';up.className='gw-btn';up.textContent='Nâng phẩm';up.onclick=()=>{try{G.engine.treasureUpgrade(t.id);modal.close();ctx.render();itemDialog(ctx,id);}catch(e){fail(ctx,e);}};modal.actions.append(up);}
    modal.present();
  }
  function slotDialog(ctx,hero,slot){
    const d=G.engine.treasure(),cur=(d.slots[hero]||[])[slot];
    const modal=window.GemwovenUI.makeDialog('treasure-slot',`${M.HEROES[hero].name} · ô báu vật ${slot+1}`,'growth-dialog treasure-dialog');
    modal.body.innerHTML=d.items.length?`<div class="treasure-grid">${d.items.map(t=>`<button type="button" data-pick="${t.id}" class="treasure-cell q-${t.quality} ${t.id===cur?'on':''}">${pic(t)}<i>${T.names[qi(t)]}</i></button>`).join('')}</div>`:'<p class="growth-lead">Chưa có báu vật. Nhận ở Sự Kiện → Kỳ Báu Vật.</p>';
    modal.body.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{try{G.engine.treasureEquip(hero,slot,b.dataset.pick);modal.close();ctx.render();}catch(e){fail(ctx,e);}});
    if(cur){const off=document.createElement('button');off.type='button';off.className='gw-btn secondary';off.textContent='Tháo';off.onclick=()=>{try{G.engine.treasureEquip(hero,slot,null);modal.close();ctx.render();}catch(e){fail(ctx,e);}};modal.actions.append(off);}
    modal.present();
  }

  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state),screen=L.screens[state.screen];if(!screen)return p;
    const live=screen.nodes.find(n=>n.id===state.screen+'.live');
    if(live&&state.screen==='events'){const build=live.build;live.build=el=>{build(el);el.querySelector('.game-heading')?.insertAdjacentHTML('afterend',section());};}
    // Two slots under the hero on the Tướng screen, only in the trial.
    if(active()&&state.screen==='upgrade'&&p.heroes[state.hero]&&!state.outfitSlot){
      const d=G.engine.treasure(),h=p.heroes[state.hero],worn=d.slots[state.hero]||[];
      screen.nodes.push({id:'upgrade.treasure',kind:'content',rect:[792,560,124,240],className:'exploration-map treasure-slots-host',build:el=>{
        el.innerHTML=`<div class="treasure-slots">${[0,1].map(i=>{const t=d.items.find(x=>x.id===worn[i]),locked=i===1&&(h.evolution||0)<3;return `<button type="button" data-action="treasure:slot" data-hero="${state.hero}" data-slot="${i}" ${locked?'disabled':''} class="treasure-slot ${t?'q-'+t.quality:''}" aria-label="Ô báu vật ${i+1}${locked?' · mở ở tiến hóa 3':''}">${t?pic(t):locked?'🔒':'+'}</button>`;}).join('')}</div>`;}});
    }
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    try{
      if(action==='treasure:enter'){G.engine.trialMode(true);location.reload();return true;}
      if(action==='treasure:leave'){if(!confirm('Thoát bản thử Báu Vật? Tài khoản thật vẫn như trước khi vào; bản thử được giữ lại.'))return true;G.engine.trialMode(false);location.reload();return true;}
      if(action==='treasure:gift'){G.engine.treasureGift(el.dataset.family);ctx.render();return true;}
      if(action==='treasure:open'){itemDialog(ctx,el.dataset.id);return true;}
      if(action==='treasure:slot'){slotDialog(ctx,el.dataset.hero,Number(el.dataset.slot));return true;}
    }catch(e){fail(ctx,e);return true;}
    return handle(action,el,ctx,state);
  };
  // The trial label never leaves the screen while the trial is on.
  if(active()){const tag=document.createElement('div');tag.className='trial-banner';tag.textContent='BẢN THỬ BÁU VẬT · không lưu vào tài khoản thật';document.addEventListener('DOMContentLoaded',()=>document.body.append(tag));if(document.body)document.body.append(tag);}
})();
