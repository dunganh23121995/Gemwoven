/* Drawn UI kit on the remaining panel screens (Codex mockups assets/gemwoven/raw/ui-kit/panels/mockup-A/B/C-raw.png):
 * Thành Tích, Sự Kiện, Tích Lũy, Trùm Vô Tận, the Quán Bia quest board and the shared popups. The markup comes from
 * progression-ui.js, growth-ui.js, treasure-ui.js, hero-hall.js and art-screens.js; this module only regroups it after
 * mount (icons beside numbers, reward text as reward sockets, long notes folded behind ⓘ) and ui-kit-panels.css dresses
 * it with the kit pieces. Nothing here computes rules or rewards.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,A=window.GEMWOVEN_ASSETS;if(!G?.mount||!M)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const src=k=>(A[k]||A['kit-icon-sparkle']||A['icon-hero']).file;
  const img=(k,cls='')=>`<img class="${cls}" src="${esc(src(k))}" alt="" draggable="false">`;
  const kit=n=>img('kit-icon-'+n,'kp-ico');
  const lock=()=>img('kit-lock','kp-lock');
  // Reward names as printed by growth-ui.js → their item art.
  const byName={'Mảnh Hiro':'portrait-novice',gemChoices:'gem-choice','Phiếu chọn ngọc':'gem-choice'};
  for(const [name,asset] of Object.values(M.RESOURCES||{}))byName[name]=asset;
  const shortName={gemChoices:'Phiếu chọn ngọc','Sách kinh nghiệm':'Sách KN','Tinh hoa tiến hóa':'Tinh hoa','Bí kíp kỹ năng':'Bí kíp'};
  const assetFile=k=>k==='gem-choice'?'assets/gemwoven/gems/gem-precision-1.webp':src(k);
  const sockets=ul=>{
    if(!ul||ul.dataset.kp)return;ul.dataset.kp='1';ul.classList.add('kp-sockets');
    for(const li of ul.querySelectorAll('li')){const m=li.textContent.match(/^(.*?)\s*×\s*([\d.]+)$/);if(!m)continue;const [,name,n]=m;
      li.className='kp-socket';li.title=shortName[name]||name;li.setAttribute('aria-label',`${shortName[name]||name} ×${n}`);
      li.innerHTML=`<img src="${esc(assetFile(byName[name]))}" alt="" draggable="false"><b>${esc(n)}</b>`;}
  };
  const info=(details,label)=>{ // a details block becomes a round ⓘ with a short label
    if(!details||details.dataset.kp)return;details.dataset.kp='1';details.classList.add('kp-info');
    const s=details.querySelector('summary');if(s)s.innerHTML=`<i aria-hidden="true">i</i>${label?`<span>${esc(label)}</span>`:''}`;
  };
  const plaque=(h,text)=>{if(!h)return;h.classList.add('kp-plaque');if(text!=null)h.textContent=text;};
  const fold=(nodes,label,after)=>{ // move paragraphs behind a ⓘ
    nodes=nodes.filter(Boolean);if(!nodes.length)return;const d=document.createElement('details');d.className='hint';d.innerHTML='<summary></summary>';
    (after||nodes[0]).before(d);for(const n of nodes)d.append(n);info(d,label);return d;
  };

  function rankings(body){
    const titles=body.querySelector('.titles');
    if(titles){const h=titles.querySelector('h3'),count=h?.querySelector('small')?.textContent||'',[got]=count.split('/').map(Number);
      if(h){h.classList.add('kp-head');h.innerHTML=`<span class="kp-medal ${got?'':'is-locked'}" aria-hidden="true"></span><span>Danh Hiệu</span><small>${esc(count)}</small>`;}
      for(const c of titles.querySelectorAll('.title-cell')){const i=c.querySelector(':scope>i');if(i)i.outerHTML=lock();
        if(c.classList.contains('is-open'))c.insertAdjacentHTML('beforeend',`<span class="kp-title-mark${c.classList.contains('is-worn')?' is-worn':''}" aria-hidden="true"></span>`);}}
    const table=body.querySelector(':scope>table');
    if(table){const icons=['helm','swords','skull','stairs'],labels=['Boss cao nhất','Sát thương cao nhất','Tổng boss hạ','Ải đã vượt'];
      const grid=document.createElement('div');grid.className='kp-stats kp-stats-2';
      grid.innerHTML=[...table.querySelectorAll('tbody tr')].map((tr,i)=>`<p class="kp-stat">${kit(icons[i]||'sparkle')}<span>${esc(labels[i]||tr.cells[0].textContent)}</span><b>${esc(tr.cells[1].textContent)}</b></p>`).join('');
      table.replaceWith(grid);}
    const sub=body.querySelector('.gw-sub');if(sub)sub.textContent='Trên thiết bị này';
    const hint=body.querySelector(':scope>p.hint');if(hint)fold([hint],'BXH toàn cầu: Sắp ra mắt');
    const go=body.querySelector('[data-action="route:boss"]');if(go){go.classList.add('kp-gold');go.innerHTML=kit('helm')+'<span>Boss vô hạn</span>';}
  }

  const nw0=b=>b.querySelector('.newbie-week');
  function events(body){
    const tt=body.querySelector('.treasure-trial');
    if(tt){const h=tt.querySelector('h3');h?.classList.add('kp-sec');const tag=h?.querySelector('.trial-tag');
      if(h&&!h.querySelector('.kp-plaque-in')){const t=document.createElement('span');t.className='kp-plaque-in';t.textContent='Kỳ Báu Vật';h.firstChild?.nodeType===3&&h.firstChild.remove();h.prepend(t);}
      const b=tt.querySelector('[data-action="treasure:enter"]'),d=tt.querySelector(':scope>details');
      if(b&&!b.parentElement.classList.contains('kp-row')){const row=document.createElement('div');row.className='kp-row';b.before(row);row.append(b);if(d)row.append(d);b.classList.add('kp-gold');}
      info(d);}
    const sub=body.querySelector('.gw-sub');if(sub&&nw0(body))sub.textContent='Hành Trình Tân Thủ đang mở';
    const nw=body.querySelector('.newbie-week');
    if(nw){const h=nw.querySelector('h3'),t=h?.textContent||'',got=(t.match(/(\d+)\/7/)||[])[1]||'0',ready=(t.match(/(\d+) quà chờ/)||[])[1];
      if(h){h.className='kp-sec';h.innerHTML=`<span class="kp-plaque-in">Hành Trình Tân Thủ</span><small>Đã nhận ${got}/7</small>${ready?`<em class="kp-seal">${ready} quà</em>`:''}`;}
      const hint=nw.querySelector(':scope>p.hint'),d=nw.querySelector(':scope>details');
      if(hint&&d&&!d.dataset.kp){info(d,hint.textContent);hint.remove();}
      for(const day of nw.querySelectorAll('.newbie-day')){sockets(day.querySelector('ul'));const b=day.querySelector('.game-btn');
        if(b&&!b.dataset.kp){b.dataset.kp='1';if(b.disabled&&!day.classList.contains('is-claimed'))b.insertAdjacentHTML('afterbegin',lock());else if(!b.disabled)b.insertAdjacentHTML('afterbegin',kit('gift'));}}
      const open=nw.querySelector('.newbie-day.is-open');const row=nw.querySelector('.newbie-days');if(open&&row)requestAnimationFrame(()=>{row.scrollLeft=Math.max(0,open.offsetLeft-row.offsetLeft-8);});}
    const wq=body.querySelector('.weekly-quests');
    if(wq){const h=wq.querySelector('h3');if(h&&!h.querySelector('.kp-plaque-in')){h.className='kp-sec';h.innerHTML='<span class="kp-plaque-in">Nhiệm Vụ Tuần</span>';}
      const hint=wq.querySelector(':scope>p.hint');if(hint)hint.textContent=hint.textContent.replace(/\s*·\s*tuần từ.*$/,'').replace('Làm mới ','Làm mới ');
      for(const q of wq.querySelectorAll('.cadence-grid>article')){q.classList.add('kp-quest');sockets(q.querySelector('ul'));
        const s=q.querySelector('small'),m=s?.textContent.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        if(m&&!q.querySelector('.kp-bar')){const n=+m[1].replace(/\./g,''),t=+m[2].replace(/\./g,'')||1;s.textContent=`${m[1]}/${m[2]}`;s.insertAdjacentHTML('afterend',`<span class="kp-bar"><i style="width:${Math.min(100,n/t*100)}%"></i></span>`);}}}
    const soon=body.querySelector(':scope>.coming-soon');if(soon){soon.classList.add('kp-ribbon');soon.querySelector('p')?.remove();}
    const cad=body.querySelector(':scope>.cadence');
    if(cad&&!cad.dataset.kp){cad.dataset.kp='1';const h=cad.querySelector('h3');const d=document.createElement('details');d.className='kp-cadence';
      d.innerHTML='<summary><i aria-hidden="true">i</i><span>Lịch dự kiến · Sắp ra mắt</span></summary>';h?.remove();d.append(...cad.childNodes);cad.append(d);}
  }

  function offline(body){
    const sub=body.querySelector('.gw-sub');sub?.classList.add('kp-rate');
    const h=body.querySelector(':scope>h3');if(h&&!h.dataset.kp){h.dataset.kp='1';h.classList.add('kp-time');h.innerHTML=kit('hourglass')+`<span>${esc(h.textContent.replace(/^Đã tích:\s*/,''))}</span>`;}
    const bar=body.querySelector('.offline-bar');bar?.classList.add('kp-bar');
    const icons=['coins','exp-book','crest'],names=['Vàng','Sách KN','Ấn tu luyện'];
    body.querySelectorAll('.stat-grid>p').forEach((p,i)=>{if(p.dataset.kp)return;p.dataset.kp='1';p.classList.add('kp-stat','kp-res');const b=p.querySelector('b')?.textContent||'';
      p.innerHTML=`${img(icons[i]||'coins','kp-ico')}<span>${esc(names[i]||'')}</span><b>${esc(b)}</b>`;});
    body.querySelector('.stat-grid')?.classList.add('kp-stats','kp-stats-3');
    const btn=body.querySelector('[data-action="do:offline"]'),d=body.querySelector(':scope>details');
    if(btn&&!btn.parentElement.classList.contains('kp-row')){const row=document.createElement('div');row.className='kp-row';btn.before(row);row.append(btn);if(d)row.append(d);
      btn.classList.add('kp-gold');if(!btn.disabled)btn.insertAdjacentHTML('afterbegin',kit('gift'));}
    info(d);
  }

  const headRow=(h,d)=>{if(!h||!d||h.parentElement.classList.contains('kp-headrow'))return;const w=document.createElement('div');w.className='kp-headrow';h.before(w);w.append(h,d);};
  function boss(body){
    const p=G.engine.read();
    const tg=body.querySelector('.trial-ground');
    if(tg){plaque(tg.querySelector('h3'));const card=tg.querySelector('.trial-today'),go=card?.querySelector('[data-mode="trial"]');
      if(card&&go&&!card.querySelector('.kp-boss')){let id;try{id=M.trialEncounter(Number(go.dataset.index),p.heroes[p.selected]?.level||1).bossId;}catch{}
        if(id&&A['boss-'+id])card.insertAdjacentHTML('afterbegin',img('boss-'+id,'kp-boss'));
        const small=card.querySelector('small');if(small)small.textContent=small.textContent.replace('hệ ','').replace('cấp','Cấp');
        const left=card.querySelector('.trial-left');if(left)left.innerHTML=left.innerHTML.replace('Lượt nhận thưởng:','Lượt thưởng');
        go.classList.add('kp-gold');}
      const rules=tg.querySelector('.trial-rules');info(rules,'');headRow(tg.querySelector('h3'),rules);}
    const art=body.querySelector(':scope>.feature-art'),grid=body.querySelector(':scope>.stat-grid');
    if(art&&grid&&!body.querySelector('.kp-endless')){
      const head=document.createElement('h3');head.className='kp-plaque kp-endless';head.textContent='Tầng vô tận';art.before(head);
      const row=document.createElement('div');row.className='kp-floor';head.after(row);row.append(art,grid);art.classList.add('kp-emblem-art');
      grid.classList.add('kp-stats','kp-stats-3');grid.querySelectorAll('p').forEach(x=>x.classList.add('kp-stat'));
      const h=[...body.querySelectorAll(':scope>h3')],next=h.find(x=>/Tầng kế tiếp/.test(x.textContent)),rhythm=h.find(x=>/Nhịp phần thưởng/.test(x.textContent));
      if(next){const tip=next.nextElementSibling;const lv=tip?.textContent.match(/Cấp gợi ý (\d+)/)?.[1];next.className='kp-next';next.textContent=next.textContent.replace(': ',' ')+(lv?` · Cấp gợi ý ${lv}`:'');
        if(tip?.tagName==='P'){tip.textContent=tip.textContent.replace(/^Cấp gợi ý \d+\.\s*/,'');tip.remove();}
        const btns=[...body.querySelectorAll(':scope>[data-mode="boss"]')];
        if(btns.length){const r=document.createElement('div');r.className='kp-row kp-row-2';btns[0].before(r);r.append(...btns);
          btns[0].classList.add('kp-gold');btns[0].innerHTML=kit('swords')+`<span>${esc(btns[0].textContent)}</span>`;
          const farm=btns[1];if(farm){farm.classList.add('kp-wood');farm.innerHTML=kit('farm')+`<span>${esc(farm.textContent)}</span>`;
            if(!(p.boss?.best>0)){farm.disabled=true;farm.title='Thắng tầng 1 để farm';farm.querySelector('.kp-ico').outerHTML=lock();}}
          const extra=[];if(tip)extra.push(tip);
          if(rhythm){let n=rhythm.nextElementSibling;rhythm.remove();while(n&&n.tagName==='P'){const x=n.nextElementSibling;extra.push(n);n=x;}}
          if(extra.length){const d=fold(extra,'',r);headRow(head,d);}}}
      const rank=body.querySelector(':scope>[data-action="route:rankings"]');
      if(rank){const w=document.createElement('div');w.className='kp-row kp-rank';rank.before(w);w.append(rank);rank.classList.add('kp-steel');rank.innerHTML=kit('trophy')+'<span>Xếp hạng boss</span>';
        w.insertAdjacentHTML('beforeend','<small>Trên thiết bị<br>Toàn cầu: Sắp ra mắt</small>');}
    }
  }

  function tavern(scene){
    for(const f of scene.querySelectorAll('[data-group="tavern-tab"]')){f.querySelector('.kp-check')?.remove();if(f.classList.contains('selected'))f.insertAdjacentHTML('beforeend','<span class="kp-check" aria-hidden="true">✓</span>');}
    const n=scene.querySelectorAll('[data-node^="tavern.quest-rewards-"]').length;scene.querySelector('[data-node="tavern.quest-panel"]')?.style.setProperty('--n',n);
    scene.dataset.kpRewards=n;
  }

  const SCREENS={rankings,events,offline,boss};
  function dress(state){
    const s=state?.screen;document.getElementById('scene')?.toggleAttribute('data-kp',!!(SCREENS[s]||s==='tavern'));
    if(s==='tavern'){const sc=document.getElementById('scene');if(sc)tavern(sc);return;}
    const fn=SCREENS[s];if(!fn)return;const live=document.querySelector(`#scene [data-node="${s}.live"]`);const body=live?.querySelector('.gw-body');if(!body)return;
    live.classList.add('kp-panel','kp-'+s);try{fn(body);}catch(e){console.warn('ui-kit-panels',s,e);}
  }
  const mount=G.mount;
  G.mount=(state,ctx)=>{const r=mount(state,ctx);dress(state);return r;};

  // ----- Popups: hero profile, all heroes, power detail, title detail, item detail and received rewards -----
  const POPS=new Set(['hero-profile','hero-all','power-detail','growth-map','title-detail','preview-dialog']);
  function pop(d){
    if(!POPS.has(d.id))return;d.classList.add('kp-pop');
    if(d.id==='preview-dialog'){const kind=d.dataset.kind;d.classList.toggle('kp-item',kind==='item');d.classList.toggle('kp-rewards',kind==='rewards');
      const copy=d.querySelector('#dialog-copy');
      if(kind==='item'&&copy&&!copy.querySelector('.kp-have')&&/Đang có:/.test(copy.textContent)){const lines=copy.textContent.split('\n').map(x=>x.trim()).filter(Boolean);
        const have=lines.find(x=>/^Đang có:/.test(x)),from=lines.find(x=>/^Nguồn:/.test(x)),rest=lines.filter(x=>x!==have&&x!==from);
        copy.innerHTML=(have?`<span class="kp-have"><small>Đang có</small><b>${esc(have.replace(/^Đang có:\s*/,''))}</b></span>`:'')+(rest.length?`<span class="kp-use">${esc(rest.join(' '))}</span>`:'')+
          (from?`<span class="kp-from"><small>Nguồn</small>${from.replace(/^Nguồn:\s*/,'').split(/\s*·\s*/).map(x=>`<i>${esc(x)}</i>`).join('')}</span>`:'');}
      return;}
    if(d.id==='hero-profile'){for(const s of d.querySelectorAll('.hp-skills small'))if(s.textContent.includes('🔒')&&!s.querySelector('img')){
        const need=s.closest('details')?.querySelector('.missing')?.textContent.match(/cấp (\d+)/i)?.[1];
        s.innerHTML=lock()+esc(s.textContent.replace(/\s*·\s*🔒/,'').replace('🔒','')+(need?` · Cấp ${need}`:''));s.parentElement.classList.add('is-locked');}
      for(const sum of d.querySelectorAll('.hp-skills summary'))if(!sum.querySelector('.kp-sk')){const b=sum.querySelector('b'),sm=sum.querySelector('small');if(b&&sm){const w=document.createElement('span');w.className='kp-sk';b.before(w);w.append(b,sm);}}
      const face=d.querySelector('.hp-head>img')?.getAttribute('src');
      const stars=M.FORM_STARS||[1,4,6];
      d.querySelectorAll('.hp-forms>span').forEach((f,i)=>{if(f.dataset.kp)return;f.dataset.kp='1';const name=f.querySelector('small')?.textContent||'';f.title=name;
        f.innerHTML=(f.classList.contains('locked')?lock():face?`<img class="kp-face" src="${esc(face)}" alt="">`:`<b>${i+1}</b>`)+`<small>${f.classList.contains('locked')?`${stars[i]||''}★`:'Dạng '+(i+1)}</small>`;});}
    if(d.id==='power-detail'){const b=d.querySelector('.power-hero b');if(b&&!b.nextElementSibling)b.insertAdjacentHTML('afterend','<small>Lực chiến</small>');
      const note=[...d.querySelectorAll('.growth-note')].find(x=>/Cần thêm nguyên liệu/.test(x.textContent));
      if(note&&!note.dataset.kp){note.dataset.kp='1';note.classList.add('kp-ways');note.innerHTML=[['icon-quest','Khám Phá'],['kit-icon-helm','Trùm'],['chest','Tích Lũy']].map(([k,l])=>`<span>${img(k)}<b>${l}</b></span>`).join('');}
      const s=d.querySelector('details.hint summary');if(s&&!s.dataset.kp){s.dataset.kp='1';d.querySelector('details.hint').classList.add('kp-info');s.innerHTML='<i aria-hidden="true">i</i><span>Cách tính</span>';}}
    if(d.id==='title-detail'){d.querySelector('.title-bar')?.classList.add('kp-bar');}
  }
  const scan=()=>{for(const d of document.querySelectorAll('dialog'))if(d.open)pop(d);};
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['open','data-kind']});
})();
