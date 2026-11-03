/* Too much gear (docs/GAME_DESIGN.md §3, agreed with Codex in round 3): lock a piece, auto-salvage drops
 * (off by default), "Mặc tốt nhất" with a preview, and bulk salvage with filters and the total shown before
 * confirming. Rules and numbers: progression.js (salvageValue, salvagePreview, bestGear, BAG).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression;if(!G||!M?.salvagePreview)return;
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gearName=g=>`${M.SLOTS[g.slot]} ${M.RARITIES[g.rarity].name} +${g.level}`;
  const fail=(ctx,error)=>ctx.showModal('Chưa thể thực hiện',[],error.message);

  function bestDialog(ctx,hero){
    const modal=window.GemwovenUI.makeDialog('gear-best',M.HEROES[hero].name+' · Mặc tốt nhất','growth-dialog gear-dialog');let goal='attack';
    const paint=()=>{
      const p=G.engine.read(),plan=M.bestGear(p,hero,goal),find=id=>p.equipment.find(g=>g.id===id);
      // Stats before and after, on a copy of the save with the plan applied.
      const after=JSON.parse(JSON.stringify(p));for(const [slot,{to}] of Object.entries(plan))after.heroes[hero].gear[slot]=to;
      const a=M.stats(p,hero),b=M.stats(after,hero),row=(label,x,y,f=fmt)=>`<tr><td>${label}</td><td>${f(x)}</td><td>${f(y)}</td><td class="${y>x?'up':y<x?'down':''}">${y>x?'+':''}${f(y-x)}</td></tr>`;
      modal.body.innerHTML=`<div class="gear-goal" role="radiogroup">${[['attack','Ưu tiên Công'],['survive','Ưu tiên Sinh tồn']].map(([k,l])=>`<button type="button" data-goal="${k}" class="${goal===k?'on':''}" aria-pressed="${goal===k}">${l}</button>`).join('')}</div>`+
        (Object.keys(plan).length?`<ul class="gear-plan">${Object.entries(plan).map(([slot,{from,to}])=>`<li><b>${M.SLOTS[slot]}</b><span>${from?esc(gearName(find(from))):'Trống'}</span><i>→</i><span style="color:${M.RARITIES[find(to).rarity].color}">${esc(gearName(find(to)))}</span></li>`).join('')}</ul>`
          :'<p class="growth-lead">Tướng đã mặc đồ tốt nhất trong túi.</p>')+
        `<table class="gw-table"><thead><tr><th></th><th>Hiện tại</th><th>Sau khi mặc</th><th></th></tr></thead><tbody>${row('Lực chiến',a.power,b.power)}${row('HP',a.hp,b.hp)}${row('Công',a.attack,b.attack,x=>(Math.round(x*100)/100).toLocaleString('vi-VN'))}</tbody></table>`+
        `<p class="growth-note">Chỉ dùng đồ của tướng này và đồ chưa ai mặc; không lấy đồ của tướng khác. Đồ có hiệu ứng Thần được tính theo mục tiêu bạn chọn.</p>`;
      modal.actions.innerHTML='';const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent=Object.keys(plan).length?`Mặc ${Object.keys(plan).length} món`:'Đóng';
      go.onclick=()=>{if(!Object.keys(plan).length)return modal.close();try{G.engine.equipBest(hero,goal);modal.close();ctx.render();}catch(e){fail(ctx,e);}};modal.actions.append(go);
      modal.body.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{goal=b.dataset.goal;paint();});
    };
    paint();modal.present();
  }

  function bulkDialog(ctx){
    const modal=window.GemwovenUI.makeDialog('gear-bulk','Phân giải hàng loạt','growth-dialog gear-dialog');
    const f={rarities:['common','uncommon'],slots:null,maxLevel:0};
    const paint=()=>{
      const p=G.engine.read(),pv=M.salvagePreview(p,f),pick=new Set(pv.ids),list=p.equipment.filter(g=>pick.has(g.id));
      const locked=p.equipment.filter(g=>g.locked).length;
      modal.body.innerHTML=`<fieldset class="gear-filter"><legend>Phẩm</legend>${['common','uncommon','rare','epic','legendary'].map(r=>`<label style="--rarity:${M.RARITIES[r].color}"><input type="checkbox" data-r="${r}" ${f.rarities.includes(r)?'checked':''}> ${M.RARITIES[r].name}</label>`).join('')}</fieldset>`+
        `<fieldset class="gear-filter"><legend>Ô</legend><label><input type="radio" name="slot" value="" ${!f.slots?'checked':''}> Tất cả</label>${Object.entries(M.SLOTS).map(([k,l])=>`<label><input type="radio" name="slot" value="${k}" ${f.slots?.[0]===k?'checked':''}> ${l}</label>`).join('')}</fieldset>`+
        `<label class="gear-level">Chỉ món cường hóa tới <select data-max>${[0,5,10,20].map(n=>`<option value="${n}" ${f.maxLevel===n?'selected':''}>+${n}</option>`).join('')}</select></label>`+
        `<div class="gear-total"><b>${fmt(pv.count)} món</b><span>Nhận ${fmt(pv.ore)} quặng · ${fmt(pv.gold)} vàng</span></div>`+
        `<ul class="gear-chips">${list.slice(0,12).map(g=>`<li style="--rarity:${M.RARITIES[g.rarity].color}">${esc(gearName(g))}</li>`).join('')}${list.length>12?`<li>… và ${list.length-12} món</li>`:''}</ul>`;
      modal.body.querySelectorAll('[data-r]').forEach(b=>b.onchange=()=>{f.rarities=[...modal.body.querySelectorAll('[data-r]:checked')].map(x=>x.dataset.r);paint();});
      modal.body.querySelectorAll('[name=slot]').forEach(b=>b.onchange=()=>{f.slots=b.value?[b.value]:null;paint();});
      modal.body.querySelector('[data-max]').onchange=e=>{f.maxLevel=Number(e.target.value);paint();};
      // The rule sits right above the confirm button, never scrolled away.
      modal.actions.innerHTML=`<p class="gear-rule">Không phân giải món đang mặc, đang khóa${locked?` (${locked})`:''}, vũ khí bản mệnh. Đồ đã cường hóa hoàn ${Math.round(M.SALVAGE_REFUND*100)}% chi phí.</p>`;
      const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent=pv.count?`Phân giải ${fmt(pv.count)} món`:'Không có món nào';go.disabled=!pv.count;
      // Rare and better ask once more: those pieces cannot be bought back.
      go.onclick=()=>{if(f.rarities.some(r=>!['common','uncommon'].includes(r))&&!confirm(`Phân giải cả đồ ${f.rarities.filter(r=>!['common','uncommon'].includes(r)).map(r=>M.RARITIES[r].name).join(', ')}? Không lấy lại được.`))return;
        try{const got=G.engine.salvageMany(pv.ids);modal.close();ctx.render();G.showRewards?.(ctx,got,`Phân giải ${pv.count} món`);}catch(e){fail(ctx,e);}};modal.actions.append(go);
    };
    paint();modal.present();
  }

  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='gear:lock'){try{G.engine.lockGear(el.dataset.id,el.dataset.on==='1');ctx.render();}catch(e){fail(ctx,e);}return true;}
    if(action==='gear:best'){bestDialog(ctx,el.dataset.hero||G.engine.read().selected);return true;}
    if(action==='gear:bulk'){bulkDialog(ctx);return true;}
    return handle(action,el,ctx,state);
  };
  document.addEventListener('change',e=>{const r=e.target?.dataset?.gearAuto;if(!r)return;try{G.engine.setAutoSalvage(r,e.target.checked);}catch(error){e.target.checked=!e.target.checked;}});
})();
