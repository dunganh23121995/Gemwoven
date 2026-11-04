/* Nghi thức biến hình (owner 04/11, Claude + Codex; brief assets/gemwoven/raw/form-ceremony/design-round.md, approved mockup
 * mockup-1.png). When the main hero goes 3→4★ or 5→6★ a new form opens: the hero's old form stands on a rune circle over the
 * darkened Tướng screen, light gathers and the new star ignites, warm light covers the body and the new form's locked showcase
 * fades in (same head-based size, no warping), then its name, the stars, the new ultimate and one line of what changed. Form 2
 * runs 4.8 s, form 3 6 s; the result plate waits for the player. "Bỏ qua" is there from the start. The star-up transaction is
 * saved before the scene starts (the scene grants and spends nothing), a hub look the player chose stays as it is, and "Xem lại
 * nghi thức" in the form gallery replays an opened form. This is not the in-combat Biến Thân skill.
 * Light shares the summon's language (its halo, streak, sparkle and element glows; the rune circle is drawn for this scene);
 * sounds are the summon's own single CC0 recordings (assets/audio/summon), played at the hub's effects volume. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,A=window.GEMWOVEN_ASSETS;
  if(!G?.engine?.starUp||!M?.HERO_FORMS)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=key=>A[key]?new URL(A[key].file,document.baseURI).href:'';
  const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Element light of each hero (the summon realm colours).
  const RGB={novice:'255,214,120',fire:'255,140,70',ice:'150,225,255',earth:'170,230,120',lightning:'180,170,255',shadow:'190,140,255'};
  // Where things stand on the 941×1672 stage (mockup): feet at 800 on the circle (CSS), stars above the head, the plate below.
  const BODY=430,STARS_Y=330;

  // ---- sound: one real recording per beat, the hub's effects volume and mute ----
  const Sound={live:[],
    level(){const H=window.GemwovenHubAudio;if(H?.muted?.())return 0;const v=H?.levels?.().effects;return Number.isFinite(v)?v/100:1;},
    src(name){return window.GEMWOVEN_SUMMON_SOUNDS?.[name]||`assets/audio/summon/${name}.ogg`;},
    play(name,volume=1){const v=this.level()*volume;if(!v)return;try{const a=new Audio(this.src(name));a.volume=Math.min(1,v);a.play().catch(()=>{});this.live.push(a);}catch{}},
    stop(){for(const a of this.live){try{a.pause();}catch{}}this.live=[];}};

  function heroHost(key,form,cls){
    const asset=A[`show-${key}-${form}`]||A[`form-${key}-${form}`]||A['hero-'+key];
    const host=document.createElement('span');host.className='fc-hero '+cls;host.setAttribute('aria-hidden','true');
    const image=document.createElement('img');image.className='art';image.alt='';image.src=asset?.file||'';host.append(image);
    window.GEMWOVEN_FORMS?.fitBody(host,asset,BODY);
    return host;
  }
  const stars=(count,lit)=>Array.from({length:count},(_,i)=>`<img class="fc-star${i<lit?' on':''}${i===count-1?' new':''}" src="${url('reward-star')}" alt="" style="--i:${i}">`).join('');

  let open=null;
  // play(key, form): form is the newly opened form (2 or 3); replay only reads data.
  function play(key,form){
    const stage=document.getElementById('stage');const forms=M.HERO_FORMS[key];if(!stage||!forms?.[form-1])return;
    open?.finish(true);
    const info=forms[form-1],count=M.FORM_STARS[form-1],six=form===3,still=reduced(),T=six?6000:4800,reveal=six?3800:2300;
    const root=document.createElement('div');root.className='fc-root'+(six?' is-six':'')+(still?' is-still':'');root.setAttribute('role','dialog');root.setAttribute('aria-label','Mở hình thái mới: '+info.name);
    root.style.setProperty('--el',RGB[key]||RGB.novice);root.style.setProperty('--fc-sign',`url('${url('summon-ui-sign')}')`);
    root.innerHTML=`<i class="fc-veil"></i><img class="fc-glow" src="${url('summon-glow-a-'+key)||url('summon-glow-a-fire')}" alt=""><img class="fc-halo" src="${url('summon-halo')}" alt="">`+
      `<img class="fc-circle" src="${url('fc-rune-circle')}" alt="">`+
      // The form-3 aura burns behind the body, never over the face or the weapon.
      (six&&A['form-aura-'+key]?`<i class="fc-aura" style="--sheet:url('${url('form-aura-'+key)}')"></i>`:'')+`<img class="fc-streak" src="${url('summon-streak')}" alt=""><span class="fc-heroes"></span>`+
      `<img class="fc-cover" src="${url('summon-halo')}" alt="">`+
      
      `<i class="fc-sparks">${Array.from({length:10},(_,i)=>`<i style="--x:${(i*37)%100}%;--d:${(i*173)%900}ms;--s:${14+(i%3)*8}px;background-image:url('${url('summon-sparkle')}')"></i>`).join('')}</i>`+
      `<div class="fc-stars" style="top:${six?STARS_Y-80:STARS_Y}px">${stars(count,count-1)}</div>`+
      `<b class="fc-name">${esc(info.name)}</b>`+
      `<button type="button" class="fc-skip">Bỏ qua</button>`+
      `<div class="fc-plate" hidden><b class="fc-head">Mở hình thái mới</b><div class="fc-plate-stars">${stars(count,count)}</div>`+
      `<b class="fc-form">${esc(info.name)}</b><div class="fc-skill"><img src="${url('skill-'+key+'-0')}" alt=""><span><small>Tuyệt kỹ mới</small><b>${esc(info.skill)}</b>`+
      `<em>Tuyệt kỹ ×${String(info.power).replace('.',',')}</em>${info.signature?`<q>${esc(info.signature)}</q>`:''}</span></div>`+
      `<button type="button" class="fc-go">Tiếp tục</button></div>`;
    const heroes=root.querySelector('.fc-heroes'),before=heroHost(key,form-1,'old'),after=heroHost(key,form,'new');heroes.append(before,after);
    stage.append(root);stage.classList.add('fc-open');
    if(!still){window.GemwovenHeroShow?.attach(before,key,form-1);window.GemwovenHeroShow?.attach(after,key,form);}
    const timers=[],at=(ms,fn)=>timers.push(setTimeout(fn,ms)),beat=(...names)=>root.classList.add(...names);
    const showPlate=()=>{root.querySelector('.fc-skip').hidden=true;const plate=root.querySelector('.fc-plate');plate.hidden=false;beat('done');plate.querySelector('.fc-go').focus({preventScroll:true});};
    function finish(silent){
      for(const t of timers)clearTimeout(t);Sound.stop();document.removeEventListener('keydown',onKey,true);root.remove();stage.classList.remove('fc-open');open=null;
      if(!silent)document.dispatchEvent(new CustomEvent('gemwoven:form-ceremony-end',{detail:{hero:key,form}}));
    }
    // Skip: cancel every waiting beat and sound, show the result at once (no sounds pile up).
    function skip(){for(const t of timers)clearTimeout(t);timers.length=0;Sound.stop();root.classList.add('skipped','gather','ignite','cover','swap','clear','reveal');showPlate();}
    root.querySelector('.fc-skip').onclick=skip;root.querySelector('.fc-go').onclick=()=>finish(false);
    function onKey(e){if(e.key!=='Escape')return;e.preventDefault();e.stopPropagation();root.classList.contains('done')?finish(false):skip();}
    document.addEventListener('keydown',onKey,true);root.querySelector('.fc-skip').focus({preventScroll:true});
    open={finish};
    requestAnimationFrame(()=>beat('in'));Sound.play('bell',.55);
    if(still){at(300,()=>beat('swap','clear'));at(900,()=>{beat('reveal');showPlate();Sound.play('touch',.6);});return;}
    at(600,()=>{beat('gather');Sound.play('rise',.75);});
    at(1500,()=>{beat('ignite');Sound.play('bell',.42);});
    at(1800,()=>{beat('cover');Sound.play('sting-'+key,.8);});
    at(2050,()=>beat('swap'));
    at(2350,()=>beat('clear'));   // the light leaves the body: face and weapon read again before the reveal
    at(reveal,()=>{beat('reveal');Sound.play(six?'strike':'gold',six?.55:.7);});
    at(T-1000,()=>beat('settle'));
    at(T,()=>{showPlate();Sound.play('touch',.6);});
  }

  // The engine's star-up runs (and saves) first; a newly opened form then gets its scene.
  const starUp=G.engine.starUp;
  G.engine.starUp=key=>{
    const h0=G.engine.read().heroes[key],before=h0&&M.HERO_FORMS[key]?M.formMax(key,h0):0;
    const result=starUp(key);
    const h1=G.engine.read().heroes[key],now=h1&&M.HERO_FORMS[key]?M.formMax(key,h1):0;
    if(now>before)setTimeout(()=>play(key,now),60);
    return result;
  };
  // Fusing spares by hand: a short merge pulse on the new spare (no ceremony).
  document.addEventListener('gemwoven:spare-merged',e=>{const el=e.detail?.el;if(el&&!reduced())el.animate([{transform:'scale(.82)',filter:'brightness(1.6)'},{transform:'scale(1.08)',filter:'brightness(1.25)',offset:.55},{transform:'scale(1)',filter:'none'}],{duration:500,easing:'cubic-bezier(.2,.9,.3,1)'});});
  // Form gallery: "Xem lại nghi thức" under every opened form 2/3 (replays only, grants nothing).
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    const done=handle(action,el,ctx,state);
    if(action==='forms:gallery'){
      const key=el?.dataset?.hero||state.hero,dialog=document.getElementById('hero-form-gallery');
      dialog?.querySelectorAll('article[data-form][data-unlocked="true"]').forEach(card=>{const form=Number(card.dataset.form);if(form<2||card.querySelector('.fc-replay'))return;
        const b=document.createElement('button');b.type='button';b.className='gw-btn fc-replay';b.textContent='Xem lại nghi thức';
        b.onclick=()=>{dialog.close?.();play(key,form);};card.append(b);});
    }
    return done;
  };
  window.GemwovenFormCeremony={play};
})();
