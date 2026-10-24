/* Hero showcase for the screens outside combat (home, hero, skills, and later the reveal after a
 * summon or a fusion). A hero with a showcase (assets/heroes/forms/<hero>/form-N/showcase, listed in
 * the manifest as show-<hero>-<form>) stands in its finest pose: a drawn 8-frame resting loop,
 * now and then one of its own actions, and on request its summoning entrance (it steps out of
 * darkness while a cloud of smoke covers it and slowly thins away).
 * Usage: GemwovenHeroShow.attach(bodyElement, hero, form) -> {summon(), stop()} or null. */
(() => {
  const A=window.GEMWOVEN_ASSETS;
  const url=file=>new URL(file,document.baseURI).href;
  const reduced=()=>document.documentElement.classList.contains('reduced-motion');
  const cell=(i)=>`${(i%2)*100}% ${Math.floor(i/2)/3*100}%`;
  function smoke(stage){
    // Soft photographic puffs (the same ones as Noct's reaper fog) piled over the hero.
    const puffs=A['noct-puffs'];if(!puffs)return null;
    const cloud=document.createElement('span');cloud.className='hero-show-smoke';cloud.setAttribute('aria-hidden','true');
    const rnd=(a,b)=>a+Math.random()*(b-a);
    for(let i=0;i<22;i++){
      const p=document.createElement('i');
      p.style.cssText=`left:${rnd(8,92)}%;top:${rnd(18,96)}%;width:${rnd(38,62)}%;--cell:${i%4};--r:${rnd(-60,60)}deg;--dx:${rnd(-18,18)}%;--dy:${rnd(-30,-8)}%;--delay:${rnd(0,.5)}s;background-image:url('${url(puffs.file)}')`;
      cloud.append(p);
    }
    stage.append(cloud);return cloud;
  }
  function attach(host,hero,form){
    const show=A[`show-${hero}-${form}`];if(!show?.sheets)return null;
    const image=host.querySelector('.art,img');if(!image)return null;
    host.querySelector('.hero-show')?.remove();
    const stage=document.createElement('span');stage.className='hero-show';stage.setAttribute('aria-hidden','true');
    // The essentials are inline so a stale cached stylesheet can never show both bodies at once.
    stage.style.cssText=image.style.cssText;
    Object.assign(stage.style,{display:'block',position:'absolute',pointerEvents:'none',zIndex:'1',backgroundRepeat:'no-repeat',backgroundSize:'200% 400%',backgroundPosition:cell(0),backgroundImage:`url('${url(show.sheets.idle)}')`});
    image.after(stage);image.classList.add('hero-show-under');image.style.opacity='0';host.classList.add('has-hero-show');
    host.querySelector('.scythe-glint')?.remove();
    let timer=0,playing=null,frame=0,next=performance.now()+4000+Math.random()*3000,stopped=false;
    const sheet=src=>{stage.style.backgroundImage=`url('${url(src)}')`;};
    function play(src,ms,done){playing={src,ms,frame:0,last:0,done};sheet(src);stage.style.backgroundPosition=cell(0);}
    function tick(now){
      if(stopped)return;timer=requestAnimationFrame(tick);
      if(stage.isConnected)tick.seen=true;else if(tick.seen){stopped=true;return;}   // the screen was re-rendered
      if(playing){
        const p=playing;if(now-p.last<p.ms)return;p.last=now;stage.style.backgroundPosition=cell(p.frame);
        if(++p.frame>=8){playing=null;sheet(show.sheets.idle);next=now+5000+Math.random()*4000;p.done?.();}
        return;
      }
      if(reduced())return;
      if(now-(tick.last||0)>=150){tick.last=now;frame=(frame+1)%8;stage.style.backgroundPosition=cell(frame);}
      const fidgets=show.sheets.fidgets||[];
      if(fidgets.length&&now>next)play(fidgets[Math.floor(Math.random()*fidgets.length)],130);
    }
    timer=requestAnimationFrame(tick);
    return {
      // The summoning entrance: smoke covers the spot, the hero steps out of the dark as it thins.
      summon(){
        if(!show.sheets.emerge||reduced())return;
        const cloud=smoke(stage.parentElement);stage.classList.add('is-emerging');
        setTimeout(()=>play(show.sheets.emerge,170,()=>stage.classList.remove('is-emerging')),450);
        if(cloud)setTimeout(()=>cloud.classList.add('is-thinning'),700),setTimeout(()=>cloud.remove(),3600);
      },
      stop(){stopped=true;cancelAnimationFrame(timer);stage.remove();image.classList.remove('hero-show-under');image.style.opacity='';host.classList.remove('has-hero-show');}
    };
  }
  window.GemwovenHeroShow={attach};
})();
