/* The reward transaction completes before this presentation starts: nothing here rolls, spends
 * or grants. Cards are dealt in reveal order (common cards first, premium cards last, the whole
 * hero at the very end): each card grows out of a star above the lake, drops into the water with
 * a splash and bounces up into its slot on the board. Premium cards (whole heroes, hero fragments
 * and weapons) shimmer; opening a whole-hero card plays that hero's own summoning entrance.
 * All art is generated (assets/gemwoven/summon); code only moves, scales and fades it. */
(() => {
  const A=window.GEMWOVEN_ASSETS,M=window.GemwovenProgression;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=key=>A[key]?new URL(A[key].file,document.baseURI).href:'';
  const img=(key,cls='')=>A[key]?`<img class="${cls}" src="${esc(url(key))}" alt="" draggable="false">`:'';
  const sprite=(key,cls,style='')=>{const s=A[key];if(!s)return '';
    return `<i class="sm-sprite ${cls}" aria-hidden="true" style="--sheet:url('${url(key).replace(/'/g,'%27')}');--count:${s.count};--cycle:${s.count*s.frameDuration}ms;${style}"></i>`;};
  const RANK={common:0,uncommon:1,rare:2,epic:3,legendary:4,divine:5};
  // Three card types. Diamond: whole heroes and legendary/divine weapons. Gold: hero fragments
  // and rare/epic weapons. Bronze: everything else (materials, other gear, plain weapons).
  const weapon=r=>r.kind==='gear'&&r.gear?.slot==='weapon';
  const cardType=r=>r.kind==='hero'||(weapon(r)&&RANK[r.rarity]>=4)?'diamond':r.kind==='fragments'||(weapon(r)&&RANK[r.rarity]>=2)?'gold':'bronze';
  const premium=r=>cardType(r)!=='bronze';
  // Reveal order: bronze by rarity, then gold (weapons, then fragments), then diamond with the
  // whole hero at the very end.
  const order=r=>({bronze:0,gold:10,diamond:20})[cardType(r)]+(r.kind==='hero'?9:r.kind==='fragments'?8:RANK[r.rarity]||0);
  const rewardArt=r=>r.kind==='hero'?'hero-'+r.hero:r.kind==='fragments'?(A['fragment-'+r.hero]?'fragment-'+r.hero:'portrait-'+r.hero)
    :r.kind==='gear'?M.SLOT_ART[r.gear.slot]:M.RESOURCES[r.resource]?.[1]||'summon-crystal';
  const sparkles=n=>Array.from({length:n},(_,i)=>sprite('summon-sparkle','sm-twinkle',`--x:${[8,92,14,86,50][i%5]}%;--y:${[6,12,94,88,-3][i%5]}%;--s:${[26,20,22,18,24][i%5]}px;--d:${-(i*.73).toFixed(2)}s;--wait:${(2.4+i*.6).toFixed(1)}s`)).join('');

  // The living lake: drifting light, aurora, twinkling stars, moonlight glinting on the water.
  function sky(){
    const stars=[[12,14,22],[23,6,16],[38,19,26],[47,9,14],[58,24,18],[78,5,20],[88,18,24],[6,30,16],[31,33,14],[72,32,18],[93,36,14],[64,13,12],[17,41,12],[83,44,14]]
      .map(([x,y,s],i)=>sprite('summon-sparkle','sm-star',`left:${x}%;top:${y}%;--s:${s}px;--d:${-(i*.91).toFixed(2)}s;--wait:${(3.2+(i%5)*.9).toFixed(1)}s`)).join('');
    const glints=[[52,49,30,.55],[50,55,44,.6],[54,62,58,.7],[48,71,74,.75],[53,82,92,.6],[30,90,46,.35],[76,88,44,.35]]
      .map(([x,y,w,o],i)=>sprite('summon-glints','sm-glint',`left:${x}%;top:${y}%;width:${w}%;--o:${o};--d:${-(i*.37).toFixed(2)}s;--drift:${i%2?-1:1}`)).join('');
    const orbs=[[18,86,26],[36,78,14],[63,90,20],[82,80,30],[47,96,12],[27,64,10],[71,66,16]]
      .map(([x,y,s],i)=>`<img class="sm-orb" src="${esc(url('summon-orb'))}" alt="" style="left:${x}%;top:${y}%;--s:${s}px;--d:${-(i*2.3).toFixed(1)}s;--t:${(11+i%3*3)}s">`).join('');
    return `<div class="celestial-sky" aria-hidden="true"><div class="celestial-lake"></div>
      ${img('summon-halo','sm-moon')}${img('summon-aurora','sm-aurora')}${img('summon-aurora','sm-aurora second')}
      ${stars}${glints}${A['summon-orb']?orbs:''}${img('summon-halo','sm-gate')}</div>`;
  }

  window.GemwovenSummonReveal=input=>new Promise(resolve=>{
    document.getElementById('summon-reveal')?.close();
    const results=input.map((r,i)=>({r,i})).sort((a,b)=>order(a.r)-order(b.r)||a.i-b.i).map(x=>x.r);
    const modal=document.createElement('dialog');modal.id='summon-reveal';modal.className='celestial-reveal';
    modal.dataset.phase='sky';modal.dataset.count=results.length;
    modal.style.setProperty('--lake',`url("${url('summon-lake')}")`);
    modal.setAttribute('aria-label','Hồ Tinh Tú · Triệu hồi');
    modal.innerHTML=`${sky()}
      <header><small>GIAO ƯỚC DƯỚI NGÂN HÀ</small><h2>Hồ Tinh Tú</h2><p class="celestial-status" role="status">Tinh tú đang đáp lời…</p></header>
      <button type="button" class="celestial-close" aria-label="Đóng kết quả">×</button>
      <div class="celestial-deck" hidden></div><div class="celestial-fx" aria-hidden="true"></div>
      <button type="button" class="celestial-skip">Bỏ qua ›</button>
      <footer><button type="button" class="celestial-open-all gw-btn" disabled>Mở tất cả</button><p>Phần thưởng đã được lưu vào túi đồ</p></footer>`;
    document.body.append(modal);
    const deck=modal.querySelector('.celestial-deck'),fx=modal.querySelector('.celestial-fx'),status=modal.querySelector('.celestial-status'),
      all=modal.querySelector('.celestial-open-all'),skipButton=modal.querySelector('.celestial-skip');
    const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    let opened=0,dealt=false,closed=false,heroStage=null;const timers=[],flights=[];
    const play=(el,frames,opts)=>el.animate?el.animate(frames,opts):null;
    const later=(ms,fn)=>timers.push(setTimeout(()=>{if(!closed)fn();},ms));
    function layout(){
      // Card size follows the free board area: 5 across on wide frames, 3 across on phones.
      const box=deck.getBoundingClientRect(),n=results.length,cols=n<=1?1:modal.clientWidth<480?3:5,rows=Math.ceil(n/cols),gap=n>1?9:0;
      const width=Math.min(n<=1?200:150,(box.width-gap*(cols-1))/cols,(box.height-gap*(rows-1))/rows*.66);
      deck.style.setProperty('--cols',cols);deck.style.setProperty('--cw',Math.max(40,Math.floor(width))+'px');
    }
    function finish(){
      if(closed)return;closed=true;timers.forEach(clearTimeout);observer.disconnect();heroStage?.stop();modal.remove();resolve();
    }
    modal.addEventListener('close',finish,{once:true});
    modal.querySelector('.celestial-close').onclick=()=>modal.close();
    const cards=results.map((r,i)=>{
      const card=document.createElement('button'),art=cardType(r),top=premium(r),R=M.RARITIES[r.rarity];
      card.type='button';card.className=`celestial-card rarity-${r.rarity} card-${art} tier-${top?'premium':'common'} is-waiting`;
      card.dataset.tier=top?'premium':'common';card.dataset.card=art;card.style.setProperty('--rarity',R.color);
      const win=A['summon-front-'+art]?.window||[.14,.18,.86,.72];
      card.style.setProperty('--win',`${win[1]*100}% ${(1-win[2])*100}% ${(1-win[3])*100}% ${win[0]*100}%`);
      card.setAttribute('aria-label',`Thẻ ${i+1} · ${({bronze:'Thẻ đồng',gold:'Thẻ vàng',diamond:'Thẻ kim cương'})[art]} · Chưa mở`);card.setAttribute('aria-pressed','false');
      const shine=top?`<span class="card-shine" aria-hidden="true">${img('summon-streak')}</span>`:'';
      card.innerHTML=`${top?img('summon-halo','card-halo'):''}<span class="celestial-card-turn">
        <span class="celestial-back">${img('summon-back-'+art,'card-art')}${shine}<small>Chạm để mở</small></span>
        <span class="celestial-front" aria-hidden="true"><span class="card-window">${img('summon-back-'+art,'card-panel')}${img(rewardArt(r),'card-reward')}</span>${img('summon-front-'+art,'card-art')}${shine}
          <small>${esc(r.kind==='fragments'?'Mảnh ghép tướng':R.name)}</small><strong>${esc(r.name)}</strong></span></span>${top?`<span class="card-sparkles" aria-hidden="true">${sparkles(4)}</span>`:''}`;
      card.onclick=()=>open(card,r,0);deck.append(card);return card;
    });
    function open(card,r,delay){
      if(!dealt||card.classList.contains('is-open'))return;
      card.style.setProperty('--flip-delay',delay+'ms');card.classList.add('is-open');card.setAttribute('aria-pressed','true');
      card.setAttribute('aria-label',r.name+' · '+M.RARITIES[r.rarity].name);
      card.querySelector('.celestial-front').setAttribute('aria-hidden','false');card.querySelector('.celestial-back').setAttribute('aria-hidden','true');
      opened++;status.textContent=`Đã mở ${opened} / ${results.length} thẻ`;
      if(card.dataset.tier==='premium'&&!reduced())later(delay+380,()=>burst(card,6));
      if(r.kind==='hero'&&cardType(r)==='diamond')later(delay+(reduced()?0:850),()=>showHero(r));
      if(opened===results.length){all.disabled=true;status.textContent='Tinh tú đã tìm được chủ nhân';modal.dataset.phase='complete';}
    }
    // Opening everything turns the common cards first and the premium ones last.
    all.onclick=()=>{let wait=0;cards.forEach((card,i)=>{if(card.classList.contains('is-open'))return;open(card,results[i],wait);wait+=card.dataset.tier==='premium'?420:70;});};

    // ---- one-shot effects, placed in the modal's own coordinates ----
    function fxAt(html,x,y,ms){
      const holder=document.createElement('div');holder.className='sm-at';holder.style.cssText=`left:${x}px;top:${y}px`;holder.innerHTML=html;
      fx.append(holder);setTimeout(()=>holder.remove(),ms);return holder;
    }
    function splash(x,y,size,sparks){
      const drops=Array.from({length:sparks},(_,i)=>sprite('summon-sparkle','sm-fly',`--a:${-150+i*120/Math.max(1,sparks-1)}deg;--r:${size*.55}px;--s:${16+i%3*7}px`)).join('');
      fxAt(sprite('summon-splash','sm-splash')+img('summon-ripple','sm-ripple')+drops,x,y,1500).style.setProperty('--s',size+'px');
    }
    function burst(card,n){
      const m=modal.getBoundingClientRect(),c=card.getBoundingClientRect();
      fxAt(img('summon-halo','sm-flash')+Array.from({length:n},(_,i)=>sprite('summon-sparkle','sm-fly',`--a:${i*360/n+15}deg;--r:${c.width*.75}px;--s:${18+i%3*6}px`)).join(''),
        c.left-m.left+c.width/2,c.top-m.top+c.height/2,1100);
    }
    // ---- dealing ----
    function fly(card,index){
      const top=card.dataset.tier==='premium',m=modal.getBoundingClientRect(),c=card.getBoundingClientRect();
      const cx=c.left-m.left+c.width/2,cy=c.top-m.top+c.height/2;
      const sx=m.width*.5,sy=spawnY(c.height),ix=cx+(m.width*.5-cx)*.3,iy=m.height*.885;
      const spawn=`translate(${sx-cx}px,${sy-cy}px)`,impact=`translate(${ix-cx}px,${iy-cy}px)`,under=`translate(${ix-cx}px,${iy-cy+16}px)`;
      const diamond=card.dataset.card==='diamond',tilt=(index%2?1:-1)*(top?4:9),dur=diamond?2800:top?2400:1500,glow=diamond?1.7:top?1.5:1.35;
      card.classList.remove('is-waiting');card.classList.add('is-flying');
      const anim=play(card,[
        {transform:`${spawn} scale(.04)`,opacity:0,filter:`brightness(3)`},
        {transform:`${spawn} scale(1)`,opacity:1,filter:`brightness(${glow})`,offset:top?.3:.22,easing:'ease-in-out'},
        {transform:`${spawn} translateY(-8px) scale(1)`,opacity:1,filter:'brightness(1.2)',offset:top?.4:.3,easing:'cubic-bezier(.5,0,.9,.6)'},
        {transform:`${impact} rotate(${tilt}deg) scale(.7)`,opacity:1,filter:'brightness(1)',offset:.6},
        {transform:`${under} rotate(${tilt}deg) scale(.5)`,opacity:0,filter:'brightness(1)',offset:.65},
        {transform:`${under} scale(.5)`,opacity:0,filter:'brightness(1.6)',offset:.7,easing:'cubic-bezier(.2,.8,.3,1.1)'},
        {transform:'translateY(-22px) scale(1.06)',opacity:1,filter:`brightness(${glow*.8})`,offset:.87,easing:'ease-in-out'},
        {transform:'translateY(5px) scale(.98)',opacity:1,filter:'brightness(1)',offset:.94},
        {transform:'none',opacity:1,filter:'none'}],{duration:dur,fill:'backwards'});
      if(anim)flights.push(anim);
      fxAt(sprite('summon-sparkle','sm-spawn',`--s:${diamond?130:top?96:60}px`)+(top?img('summon-halo','sm-flash'):''),sx,sy,900);
      later(dur*.6,()=>splash(ix,iy,Math.max(90,c.width*(diamond?2.5:top?2:1.5)),diamond?7:top?4:0));
      const land=()=>{if(card.classList.contains('is-landed'))return;card.classList.remove('is-flying');card.classList.add('is-landed');if(top&&!closed&&!dealt)burst(card,diamond?8:5);};
      if(anim)anim.onfinish=land;else later(dur,land);
    }
    // The star gate sits just below the title so a growing card never covers the header text.
    function spawnY(cardHeight){
      const m=modal.getBoundingClientRect(),head=status.getBoundingClientRect().bottom-m.top;
      return Math.max(m.height*.3,head+10+cardHeight/2);
    }
    function deal(){
      if(dealt||closed)return;dealt=true;timers.forEach(clearTimeout);timers.length=0;
      flights.forEach(a=>a.playState!=='finished'&&a.finish());fx.replaceChildren();
      cards.forEach(card=>{card.classList.remove('is-waiting','is-flying');card.classList.add('is-landed');});
      modal.classList.remove('is-suspense');skipButton.hidden=true;all.disabled=!results.length;
      modal.dataset.phase='cards';status.textContent='Chạm từng thẻ để khám phá';cards[0]?.focus({preventScroll:true});
    }
    function start(){
      deck.hidden=false;layout();modal.dataset.phase='falling';
      if(cards[0])modal.style.setProperty('--gate-y',spawnY(cards[0].getBoundingClientRect().height)+'px');
      if(reduced()){
        // Reduced motion: no fall, no splash; the cards simply fade in place.
        cards.forEach((card,i)=>{card.classList.remove('is-waiting');play(card,[{opacity:0},{opacity:1}],{duration:260,delay:i*40,fill:'backwards'});});
        deal();return;
      }
      status.textContent='Những lá bài rơi xuống mặt hồ…';
      // Common cards come quickly; then a pause of suspense; then each premium card on its own.
      let t=350,end=0;const firstTop=cards.findIndex(c=>c.dataset.tier==='premium');
      const suspense=()=>{modal.classList.add('is-suspense');status.textContent='Mặt hồ rung động… ánh sáng lạ đang tụ lại!';};
      cards.forEach((card,i)=>{
        const top=card.dataset.tier==='premium';
        if(i===firstTop){if(i){later(t+200,suspense);t+=1300;}else{later(t,suspense);t+=700;}}
        if(top&&i===cards.length-1&&i>firstTop)t+=350;   // one more breath before the very best card
        later(t,()=>fly(card,i));end=Math.max(end,t+(card.dataset.card==='diamond'?2800:top?2400:1500));
        t+=top?700:220;
      });
      later(end+80,deal);
    }
    skipButton.onclick=e=>{e.stopPropagation();deal();};
    modal.addEventListener('click',e=>{if(!dealt&&modal.dataset.phase==='falling'&&!e.target.closest('.celestial-close'))deal();});

    // ---- the whole hero steps out: its own showcase entrance plus a shimmer of light ----
    function showHero(r){
      if(closed)return;heroStage?.stop();
      const G=window.GEMWOVEN_GAME,form=M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),show=A[`show-${r.hero}-${form}`],H=M.HEROES[r.hero];
      const stage=document.createElement('div');stage.className='summon-hero-stage';stage.setAttribute('role','dialog');stage.setAttribute('aria-label',`${H.name} · ${H.title}`);
      stage.innerHTML=`<div class="summon-hero-light" aria-hidden="true">${img('summon-halo','sh-halo')}${img('summon-halo','sh-halo back')}${img('summon-orb','sh-orb')}</div>
        <div class="summon-hero-body"><img class="art" src="${esc(url(show?.sheets?`show-${r.hero}-${form}`:'hero-'+r.hero))}" alt=""></div>
        <div class="summon-hero-sparkles" aria-hidden="true">${Array.from({length:10},(_,i)=>sprite('summon-sparkle','sh-spark',`--x:${[12,86,24,74,50,8,92,34,64,46][i]}%;--y:${[30,26,58,62,14,78,74,84,86,40][i]}%;--s:${[30,26,22,34,28,20,24,18,22,16][i]}px;--d:${-(i*.41).toFixed(2)}s`)).join('')}</div>
        <div class="summon-hero-name"><small>${esc(M.RARITIES[r.rarity].name)} · Tướng mới</small><strong>${esc(H.name)}</strong><span>${esc(H.title)}</span></div>
        <p class="summon-hero-hint">Chạm để tiếp tục</p>`;
      modal.append(stage);
      const body=stage.querySelector('.summon-hero-body');
      const asset=show?.sheets?show:A['hero-'+r.hero];
      window.GEMWOVEN_FORMS?.fitBody?.(body,asset,body.clientHeight*.86);
      const handle=show?.sheets?window.GemwovenHeroShow?.attach(body,r.hero,form):null;
      if(handle&&form>1&&r.hero!=='novice'){
        body.classList.add('has-hero-form');body.dataset.heroElement=r.hero;body.dataset.heroForm=form;
        if(form===3&&window.GemwovenFormEffects&&A['form-aura-'+r.hero]){const aura=document.createElement('span');aura.className='hero-form-effects';aura.setAttribute('aria-hidden','true');aura.innerHTML=window.GemwovenFormEffects.markup(r.hero,form,A['form-aura-'+r.hero]);body.append(aura);}
      }
      if(!reduced())play(stage,[{opacity:0},{opacity:1}],{duration:420,fill:'backwards'});
      if(handle)setTimeout(()=>{if(stage.isConnected)handle.summon();},reduced()?0:450);
      else if(!reduced())play(body,[{transform:'scale(.6)',opacity:0,filter:'brightness(3)'},{transform:'scale(1)',opacity:1,filter:'none'}],{duration:900,easing:'cubic-bezier(.2,.9,.3,1)'});
      const close=()=>{if(!stage.isConnected)return;handle?.stop();stage.remove();heroStage=null;all.focus?.({preventScroll:true});};
      heroStage={stop(){handle?.stop();stage.remove();}};
      stage.addEventListener('click',close);
      stage.tabIndex=-1;stage.focus({preventScroll:true});stage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();close();}});
    }

    const observer=new ResizeObserver(()=>{if(!closed&&!deck.hidden)layout();});observer.observe(modal);
    modal.showModal();
    // Preload the premium art and any hero entrance so nothing pops in mid-reveal.
    for(const r of results)if(r.kind==='hero'){const G=window.GEMWOVEN_GAME,f=M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),s=A[`show-${r.hero}-${f}`]?.sheets;
      for(const src of [s?.entrance,s?.rift,s?.idle])if(src){const im=new Image();im.src=new URL(src,document.baseURI).href;}}
    if(reduced())start();else later(700,start);
  });
})();
