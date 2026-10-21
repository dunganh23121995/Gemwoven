/* Light and motion layered over the painted hub. No new art: only light, existing
 * sprites and gentle movement of nodes that already exist. Coordinates are in the
 * 941x1672 design space of each painted background. */
(() => {
  const A=window.GEMWOVEN_ASSETS;
  // [x,y] lights, [x,y,w,h] water columns; authored against the painted backgrounds.
  const SPOTS={
    home:{
      lamps:[[182,272],[442,268],[415,612],[583,620],[712,560],[330,712],[18,925],[632,935],[133,1120],[270,1125]],
      torches:[[612,212],[728,212],[777,212],[806,222],[593,285],[612,348],[790,348]],
      hearths:[[785,935]],
      crystals:[[315,200],[262,252],[368,310],[258,305]],
      water:[[522,400,24,75],[778,175,16,55],[383,835,30,165],[573,885,26,95],[700,1095,30,75],[150,1400,32,80],[215,1400,28,70]],
      beams:true
    },
    upgrade:{
      lamps:[[822,170],[70,897],[912,615]],
      crystals:[[17,756],[60,755],[909,800],[862,842]],
      rune:'upgrade.hero-model',beams:true
    },
    inventory:{
      lamps:[[240,138],[527,362],[78,355]],crystals:[[117,410],[826,140]],water:[[568,212,14,52]]
    }
  };
  const motes=(n,cls)=>Array.from({length:n},(_,i)=>`<b class="${cls}" style="--i:${i};--delay:${(-i*0.37).toFixed(2)}s"></b>`).join('');
  function spot(cls,[x,y,w,h],extra=''){
    return `<i class="${cls}" style="left:${x}px;top:${y}px${w?`;width:${w}px;height:${h}px`:''};--seed:${((x*7+y*3)%17)/17}">${extra}</i>`;
  }
  function lights(theme){
    const s=SPOTS[theme];if(!s)return '';
    return (s.lamps||[]).map(p=>spot('lh-lamp',p)).join('')+
      (s.torches||[]).map(p=>spot('lh-torch',p,motes(3,'lh-ember'))).join('')+
      (s.candles||[]).map(p=>spot('lh-candle',p)).join('')+
      (s.hearths||[]).map(p=>spot('lh-hearth',p,motes(6,'lh-ember'))).join('')+
      (s.crystals||[]).map(p=>spot('lh-crystal',p)).join('')+
      (s.water||[]).map(r=>spot('lh-water',r)).join('')+
      (s.beams?'<i class="lh-beam"></i><i class="lh-beam second"></i><i class="lh-beam third"></i>':'');
  }
  // The rune circle sits directly beneath the hero model so it never covers the hero.
  function rune(scene,id){
    const node=scene.querySelector(`[data-node="${id}"]`);if(!node)return;
    const left=parseFloat(node.style.left),top=parseFloat(node.style.top),width=parseFloat(node.style.width),height=parseFloat(node.style.height);
    const ring=document.createElement('div');ring.className='living-hub-rune';ring.setAttribute('aria-hidden','true');
    ring.innerHTML=`<i class="lh-rune" style="left:${left+width/2}px;top:${top+height*.97}px"><b class="lh-ring"></b><b class="lh-ring inner"></b>${motes(8,'lh-rune-mote')}</i>`;
    node.before(ring);
  }
  // The hanging card column is chained to the avatar: sway it as one rigid rig so links stay attached.
  function swayRig(scene){
    const profile=scene.querySelector('.hud-profile'),parts=[...scene.querySelectorAll('.home-feature-card,.home-chain-link')];
    if(!profile||!parts.length)return;
    const rig=document.createElement('div');rig.className='lh-rig';
    rig.style.transformOrigin=`${parseFloat(profile.style.left)+72}px ${parseFloat(profile.style.top)+138}px`;
    parts[0].before(rig);parts.forEach(part=>rig.append(part));
  }
  function emphasize(scene){
    for(const el of scene.querySelectorAll('[data-node="home.explore"],[data-action="do:summon"],[data-node="upgrade.upgrade-action"],[data-node="forge.craft"],[data-action="art:purchase"]'))
      if(!el.disabled)el.classList.add('lh-call');
  }
  function mount(scene,state){
    scene.querySelector('.living-hub')?.remove();
    const theme=(window.GEMWOVEN_LAYOUT.screens[state.screen]?.backgroundKey)||state.screen;
    const layer=document.createElement('div');layer.className='living-hub';layer.dataset.theme=theme;layer.setAttribute('aria-hidden','true');
    layer.innerHTML=lights(theme);
    // Light-only layer above the composed scene; spots avoid controls and it never takes input.
    scene.append(layer);
    scene.querySelector('.living-hub-rune')?.remove();
    if(SPOTS[theme]?.rune)rune(scene,SPOTS[theme].rune);
    if(state.screen==='home')swayRig(scene);
    emphasize(scene);
    if(!scene.dataset.livingTap){
      scene.dataset.livingTap='1';
      scene.addEventListener('pointerdown',event=>{
        if(document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
        const burst=document.createElement('div');burst.className='lh-tap';burst.setAttribute('aria-hidden','true');
        burst.style.cssText=`left:${event.clientX}px;top:${event.clientY}px`;
        burst.innerHTML=Array.from({length:8},(_,i)=>`<b style="--a:${i*45+((i*17)%20)}deg;--d:${22+(i*7)%16}px"></b>`).join('');
        document.body.append(burst);setTimeout(()=>burst.remove(),700);
      },{passive:true});
    }
  }
  window.GemwovenLivingHub={mount,SPOTS};
})();
