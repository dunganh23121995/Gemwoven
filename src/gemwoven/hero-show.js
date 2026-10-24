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
  // A few faint wisps of smoke thrown out when the cloud ring bursts.
  function wisps(host){
    const puffs=A['noct-puffs'];if(!puffs)return;
    const cloud=document.createElement('span');cloud.className='hero-show-smoke';cloud.setAttribute('aria-hidden','true');
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2+Math.random()*.4,p=document.createElement('i');
      p.style.cssText=`left:50%;top:62%;width:${34+Math.random()*16}%;--cell:${i%4};--r:${Math.round(Math.random()*120-60)}deg;--dx:${Math.round(Math.cos(a)*120)}%;--dy:${Math.round(Math.sin(a)*70)}%;background-image:url('${url(puffs.file)}')`;
      cloud.append(p);
    }
    host.append(cloud);setTimeout(()=>cloud.remove(),1600);
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
    function play(src,ms,done,from=0){playing={src,ms,frame:from,last:0,done};sheet(src);stage.style.backgroundPosition=cell(from);}
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
      // The summoning entrance: the hero's cloud ring spins small, round and fast, then bursts
      // open, and in that burst the hero takes shape out of the dark.
      summon(){
        if(!show.sheets.emerge||reduced())return;
        stage.style.opacity='0';
        setTimeout(()=>{
          if(!stage.isConnected)return;
          const ring=host.querySelector('.hero-form-effects'),total=2200,burst=.62;
          if(ring){ring.style.transformOrigin='50% 66%';ring.animate([
            {transform:'scale(.22) rotate(0deg)',opacity:0},{opacity:1,offset:.08},
            {transform:'scale(.46) rotate(1080deg)',offset:burst,easing:'cubic-bezier(.15,.9,.3,1)'},
            {transform:'scale(1.3) rotate(1440deg)',opacity:1,offset:.76},
            {transform:'scale(1) rotate(1440deg)',opacity:1}],{duration:total,easing:'cubic-bezier(.5,0,.75,1)'});}
          setTimeout(()=>{
            if(!stage.isConnected)return;
            wisps(host);stage.style.opacity='';
            stage.animate([{opacity:0,filter:'brightness(3) blur(3px)'},{opacity:1,filter:'brightness(1.4) blur(0px)',offset:.35},{opacity:1,filter:'brightness(1) blur(0px)'}],{duration:650,easing:'ease-out'});
            play(show.sheets.emerge,75,null,3);
          },ring?total*burst:0);
        },60);
      },
      stop(){stopped=true;cancelAnimationFrame(timer);stage.remove();image.classList.remove('hero-show-under');image.style.opacity='';host.classList.remove('has-hero-show');}
    };
  }
  window.GemwovenHeroShow={attach};
})();
