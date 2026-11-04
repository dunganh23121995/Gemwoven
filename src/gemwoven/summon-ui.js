/* Triệu Hồi — the screen's UI layers, redrawn (owner 04/11: "Trong triệu hồi cho review những cái này đi").
 * Claude + Codex summon round (assets/gemwoven/raw/summon-ui/: critique-1, approved mockup-1.png 8,6/8,8, pieces sheet).
 * The painting, the two crystals, their motion, the NPC and the reveal stay exactly as approved; only these change:
 * the banner sign hangs on its own chains under the arch (one line, tap = rates), the slogan pennant is gone, the
 * fragment chest carries a medallion with the banner hero's fragment and "n/80", the balance is a ticket icon + number,
 * the two summon buttons say only ×1 / ×10 with the price (icon + number) on a drawn pedestal, and one honey-wood
 * board holds the rare prizes (picture + one word), the next banner tag, an "i" for the rates and the pity bar.
 * Every frame is drawn (assets/gemwoven/summon-ui + ui-kit); words and numbers are HTML on top.
 * Rules are untouched: progression.js SUMMON_* / summonQuote, liveops BANNER; the confirm popup is journey-ui.js.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!M||!L?.screens?.summon||!A?.['summon-ui-sign'])return;
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN');
  const file=k=>A[k]?.file||'';
  document.documentElement.style.setProperty('--su-panel',`url("${new URL(file('summon-ui-panel'),document.baseURI).href}")`);
  // Layers this module draws itself (from screens.js and art-screens.js summon()); everything else is kept in order.
  const REPLACED=/^summon\.(subtitle-board|subtitle|story-flag|story|fragments|summon-one|summon-ten|guarantee|ticket-balance|featured-.+|next-banner|pity-.+|summon-details|banner|prize-plaque)$/;
  // Every layer gets 'su' so it sits above the portal's light and mist (living-motion / scene-life), which stay as they are.
  const node=(id,kind,rect,extra={})=>({id:'summon.'+id,kind,rect,...extra,className:('su '+(extra.className||'')).trim()});
  const copy=(id,value)=>{C['summon.'+id]=String(value);return 'summon.'+id;};
  const button=(id,asset,rect,value,action,extra={})=>node(id,'button',rect,{asset,fit:'fill',text:copy(id,value),action,...extra});
  const text=(id,value,rect,size,extra={})=>node(id,'text',rect,{text:copy(id,value),size,...extra});
  function nextBanner(){
    const plan=window.GemwovenLiveOps?.BANNER?M.bannerPlan(Date.now()):null,next=plan?.next;
    return next?{hero:next.hero,name:M.HEROES[next.hero].name,date:new Date(next.start+7*3600000).toISOString().slice(5,10).split('-').reverse().join('/')}:null;
  }
  const PRICE={tickets:'ticket',gems:'mana'};
  function quote(count){const q=G.engine.summonQuote(count);return {...q,icon:PRICE[q.enough?q.payment:'tickets'],shown:q.enough?q.cost:count};}
  function layers(p){
    const star=M.SUMMON_BANNER.hero,name=M.HEROES[star].name,frags=p.fragments[star]||0,next=nextBanner(),out=[];
    // 1. The banner's name on a red sign hung from the arch board (Codex: one line; the Mika crystal already says "featured").
    out.push(button('banner','summon-ui-sign',[268,245,405,117],M.SUMMON_BANNER.title,'do:rates',{labelRect:[30,57,345,56],size:36,tone:'gold',className:'su-sign single-line'}));
    // 2. The fragment chest: the banner hero's fragment in a brass medallion, owned/needed on a leather tab.
    out.push(button('fragments','kit-round',[762,916,148,134],`${frags}/80`,'art:fragments',{icon:'fragment-'+star,iconRect:[39,8,70,70],labelAsset:'kit-badge-leather',labelRect:[10,80,128,50],size:32,className:'su-frag single-line'}));
    // 3. Tickets held: icon + number under the portal.
    out.push(button('ticket-balance','kit-badge-leather',[362,986,217,60],`${fmt(p.wallet.tickets)} Vé Triệu Hồi`,'item:ticket',{labelHidden:true,className:'su-balance hit-slop'}));
    // 4. The two pulls: ×1 / ×10 on the faces, the price on the pedestal (filled in by dress()).
    [['summon-one',1,'blue',148],['summon-ten',10,'gold',493]].forEach(([id,count,tone,x])=>out.push(button(id,'button-'+tone,[x,1036,300,196],`×${count}`,'do:summon',{data:{count},icon:'summon-ui-price-'+tone,iconRect:[24,138,252,50],labelRect:[0,18,300,104],size:60,className:`su-call ${tone} single-line`})));
    // 5. One board for what the banner can give and how close the guarantee is.
    out.push(node('featured-board','frame',[50,1226,841,258],{className:'su-panel'}));
    out.push(node('prize-plaque','image',[74,1240,368,64],{asset:'kit-plaque',fit:'fill'}));
    out.push(text('featured-title','Phần Thưởng Hiếm',[86,1241,344,62],34,{tone:'gold',className:'single-line'}));
    out.push(button('next-banner','kit-badge-leather',next?[508,1232,258,80]:[544,1241,222,62],next?`Kỳ sau: ${next.name}\n${next.date}`:'Kỳ sau: ?','summon-ui:next',{labelRect:next?[10,4,238,72]:[10,0,202,62],size:next?27:32,className:'su-next'}));
    out.push(button('summon-details','kit-round',[786,1222,100,100],'Tỷ lệ và bảo đảm','do:rates',{labelHidden:true,className:'su-info'}));
    const owned=star in p.heroes;
    [['hero','portrait-'+star,'Tướng','hero:'+star,{},`Tướng ${name}${owned?' · đã có':''}`],
     ['fragment','fragment-'+star,'Mảnh','art:fragments',{},`Mảnh ${name}`],
     ['weapon',M.SLOT_ART.weapon,'Thần','journey:featured-gear',{slot:'weapon',rarity:'divine',asset:M.SLOT_ART.weapon},`Vũ khí ${M.RARITIES.divine.name}`]].forEach(([id,icon,word,act,data,aria],i)=>
      out.push(button('featured-'+id,'kit-socket-on',[76+i*274,1306,250,96],word,act,{data,icon,iconRect:[9,9,78,78],labelRect:[110,0,138,96],size:36,tone:'gold',align:'left',aria,className:`featured-equipment su-prize single-line${id==='hero'&&owned?' su-owned':''}`})));
    // 6. Owner 04/11 (the one change allowed on this locked screen): a small evolution-preview stand beside the arch, the
    // banner hero's locked form-3 showcase in a drawn frame, "Hình thái 3" / "Mở tại 6★". A pull still gives 1★ form 1;
    // the stand reads as a gallery preview (no stars, lock, glow or link to the pull buttons) and opens the form gallery.
    if(M.HERO_FORMS[star]&&A[`show-${star}-3`]&&A['su-form-preview-frame'])
      out.push(button('form-preview','su-form-preview-frame',[732,430,194,300],'Hình thái 3','forms:gallery',{data:{hero:star},labelHidden:true,className:'su-form3'}));
    const dry=Math.min(p.summon.dry,M.SUMMON_PITY);
    out.push(text('pity-label','Bảo đảm tướng hiếm',[80,1408,348,44],32,{align:'left',className:'single-line'}));
    out.push(node('pity-board','image',[436,1412,424,38],{asset:'kit-progress',fit:'fill'}));
    out.push(node('pity-meter','bar',[446,1418,404,26],{value:dry/M.SUMMON_PITY,className:'su-meter'}));
    out.push(text('pity-value',`${fmt(p.summon.dry)}/${M.SUMMON_PITY}`,[436,1406,424,50],30,{className:'single-line su-pity-value'}));
    return out;
  }
  // The stand's inside, added after render under the drawn frame: a dark well, the locked art at its head-based size (same
  // rule as every screen, scaled with the whole stand) and the two words on the frame's planks.
  function formPreview(el,star){
    if(!el||el.querySelector('.su-f3-hero'))return;const name=M.HEROES[star].name,show=A[`show-${star}-3`],art=el.querySelector('.art');
    const well=document.createElement('i');well.className='su-f3-well';
    const hero=document.createElement('span');hero.className='su-f3-hero';hero.innerHTML=`<img class="art" src="${file(`show-${star}-3`)}" alt="">`;
    el.insertBefore(hero,art);el.insertBefore(well,hero);window.GEMWOVEN_FORMS?.fitBody(hero,show,138);
    el.insertAdjacentHTML('beforeend','<b class="su-f3-top">Hình thái 3</b><b class="su-f3-bottom">Mở tại 6★</b>');
    el.setAttribute('aria-label',`Xem hình thái 3 của ${name}, mở tại 6 sao. Triệu hồi nhận tướng 1 sao, hình thái 1.`);
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='summon')return p;
    const save=G.engine.read(),nodes=L.screens.summon.nodes.filter(n=>!REPLACED.test(n.id));
    const at=nodes.findIndex(n=>/^summon\.(footer-|nav-)/.test(n.id));
    nodes.splice(at<0?nodes.length:at,0,...layers(save));
    L.screens.summon.nodes=nodes;return p;
  };
  // After render: the price on each pedestal (icon + number, red when short), names for screen readers, the "i".
  function dress(){
    const scene=document.getElementById('scene');if(!scene)return;
    const save=G.engine.read(),star=M.SUMMON_BANNER.hero,name=M.HEROES[star].name;
    for(const [id,count] of [['summon-one',1],['summon-ten',10]]){
      const el=scene.querySelector(`[data-node="summon.${id}"]`);if(!el)continue;const q=quote(count);
      el.classList.toggle('su-short',!q.enough);const price=document.createElement('span');price.className='su-price'+(q.enough?'':' short');
      price.innerHTML=`<img src="${file(q.icon)}" alt=""><b>${fmt(q.shown)}</b>${q.enough?'':`<img class="su-lock" src="${file('kit-lock')}" alt="">`}`;el.append(price);
      el.setAttribute('aria-label',`Triệu Hồi ×${count} · ${q.enough?`${fmt(q.cost)} ${q.payment==='tickets'?'Vé Triệu Hồi':'Đá Ngọc'}`:`thiếu, cần ${fmt(count)} Vé Triệu Hồi hoặc ${fmt(count*120)} Đá Ngọc`}`);
    }
    const named=(id,label)=>{const el=scene.querySelector(`[data-node="summon.${id}"]`);if(el)el.setAttribute('aria-label',label);return el;};
    const held=scene.querySelector('[data-node="summon.ticket-balance"]');
    if(held&&!held.querySelector('.su-price')){const s=document.createElement('span');s.className='su-price su-held';s.innerHTML=`<img src="${file('ticket')}" alt=""><b>${fmt(save.wallet.tickets)}</b>`;held.append(s);}
    formPreview(scene.querySelector('[data-node="summon.form-preview"]'),star);
    named('fragments',`Mảnh ${name} · ${fmt(save.fragments[star]||0)}/80 · ghép 80 mảnh thành tướng`);
    named('banner',`${M.SUMMON_BANNER.title} · tướng nổi bật ${name} · xem tỷ lệ`);
    const info=named('summon-details','Xem chi tiết tỷ lệ và bảo đảm');if(info&&!info.querySelector('.su-i')){const i=document.createElement('b');i.className='su-i';i.textContent='i';info.append(i);}
    for(const el of scene.querySelectorAll('[data-node^="summon.featured-"].su-prize')){const n=L.screens.summon.nodes.find(x=>x.id===el.dataset.node);if(n?.aria)el.setAttribute('aria-label',n.aria);}
    const owned=scene.querySelector('.su-prize.su-owned');if(owned&&!owned.querySelector('.su-check')){const c=document.createElement('img');c.className='su-check';c.src=file('vip-pass-claimed-check');c.alt='';owned.append(c);}
  }
  const mount=G.mount;
  G.mount=(state,ctx)=>{const r=mount(state,ctx);if(state?.screen==='summon')dress();return r;};
  const handle=G.handle;
  G.handle=(act,el,ctx,state)=>{
    if(act!=='summon-ui:next')return handle(act,el,ctx,state);
    const next=nextBanner(),save=G.engine.read();
    ctx.showModal(next?`Kỳ sau: ${next.name}`:'Kỳ sau',[next?'portrait-'+next.hero:'summon-crystal'],`${next?`Từ ${next.date}.`:'Chưa công bố.'} Bảo đảm ${fmt(save.summon.dry)}/${M.SUMMON_PITY} giữ sang kỳ sau.`);
    return true;
  };
})();
