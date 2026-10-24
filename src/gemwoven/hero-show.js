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
  // A whirlwind of Noct's soft smoke (the puffs of his reaper fog): puffs orbit a funnel that is
  // narrow at the ground and wide at the top, spinning up, then tightening into a thin column.
  // done() fires when the column is tightest (the moment space is cut open).
  function whirlwind(host,stage,done){
    const puffs=A['noct-puffs'];if(!puffs){done();return;}
    // Layout units of the hero's own drawing box (the hub scales the whole scene with a transform).
    const W=stage.offsetWidth,H=stage.offsetHeight,cx=stage.offsetLeft+W/2,ground=stage.offsetTop+H*.94,tall=H*.82;
    const wind=document.createElement('span');wind.className='hero-show-whirl';wind.setAttribute('aria-hidden','true');host.append(wind);
    const parts=Array.from({length:34},(_,i)=>{
      const el=document.createElement('i');el.style.backgroundImage=`url('${url(puffs.file)}')`;el.style.setProperty('--cell',i%4);wind.append(el);
      return {el,t:i/33,a:Math.random()*Math.PI*2,size:(.3+.24*(i/33))*W*(.8+Math.random()*.4),spin:(Math.random()-.5)*2};
    });
    const start=performance.now(),T=1900,cut=.72;let fired=false;
    function frame(now){
      const k=Math.min(1,(now-start)/T);
      const open=k<.55?k/.55:1,squeeze=k<.55?1:1-(k-.55)/.45*.85;    // spin up, then tighten
      const speed=5+11*k,fade=k<.12?k/.12:k>.86?(1-k)/.14:1;
      for(const p of parts){
        p.a+=speed*.016*(1.4-p.t*.6);
        const r=(.05+.33*p.t)*W*open*squeeze,depth=Math.sin(p.a);
        const x=cx+Math.cos(p.a)*r,y=ground-p.t*tall*(.35+.65*open)+depth*r*.18,sc=.75+.25*(depth+1)/2;
        p.el.style.cssText=`background-image:${p.el.style.backgroundImage};--cell:${p.el.style.getPropertyValue('--cell')};left:${x}px;top:${y}px;width:${p.size}px;opacity:${(.5+.4*(depth+1)/2)*fade};transform:translate(-50%,-50%) scale(${sc}) rotate(${p.a*40+p.spin*90}deg);z-index:${depth>0?2:1}`;
      }
      if(!fired&&k>=cut){fired=true;done();}
      if(k<1&&wind.isConnected)requestAnimationFrame(frame);else wind.remove();
    }
    requestAnimationFrame(frame);
  }
  // Every sheet is fetched and decoded before it is shown: swapping to a sheet that is still
  // loading leaves the hero blank for a frame (the flicker seen when an action starts or ends).
  const decoded=new Map();
  function preload(src){
    if(!src)return Promise.resolve();
    if(!decoded.has(src)){const img=new Image();img.src=url(src);decoded.set(src,{img,ready:false,promise:(img.decode?img.decode():Promise.resolve()).then(()=>{decoded.get(src).ready=true;},()=>{decoded.get(src).ready=true;})});}
    return decoded.get(src).promise;
  }
  const isReady=src=>!!decoded.get(src)?.ready;
  function attach(host,hero,form){
    const show=A[`show-${hero}-${form}`];if(!show?.sheets)return null;
    const image=host.querySelector('.art,img');if(!image)return null;
    for(const src of [show.sheets.idle,...(show.sheets.fidgets||[]),show.sheets.rift])preload(src);
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
        // An action may hold some frames longer (show.sheets.timing: ms per frame).
        const p=playing,hold=show.sheets.timing?.[p.src]?.[Math.max(0,p.frame-1)]??p.ms;if(p.frame&&now-p.last<hold)return;p.last=now;stage.style.backgroundPosition=cell(p.frame);
        if(++p.frame>=8){playing=null;sheet(show.sheets.idle);next=now+5000+Math.random()*4000;p.done?.();}
        return;
      }
      if(reduced())return;
      if(now-(tick.last||0)>=150){tick.last=now;frame=(frame+1)%8;stage.style.backgroundPosition=cell(frame);}
      const fidgets=show.sheets.fidgets||[];
      if(fidgets.length&&now>next){
        const pick=fidgets[Math.floor(Math.random()*fidgets.length)];
        if(isReady(pick)&&isReady(show.sheets.idle))play(pick,130);else next=now+1000;
      }
    }
    timer=requestAnimationFrame(tick);
    // A hero's own drawn entrance (its element gathers and it takes shape); the form aura, if
    // any, bursts out once the hero stands.
    function entrance(){
      if(reduced())return;
      const ring=host.querySelector('.hero-form-effects');if(ring)ring.style.opacity='0';
      preload(show.sheets.entrance).then(()=>play(show.sheets.entrance,140,()=>{
        if(!ring||!stage.isConnected)return;
        ring.style.opacity='';ring.style.transformOrigin='50% 66%';
        ring.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1.25)',opacity:1,offset:.45},{transform:'scale(1)',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.9,.3,1)'});
      }));
    }
    return {
      // The summoning entrance: Noct's soft smoke whirls up into a gloomy whirlwind and tightens
      // into a column; in it a cut opens in space and he steps out of the rift; only then does his
      // cloud ring burst out around him.
      summon(){
        if(show.sheets.entrance&&!show.sheets.rift)return entrance();
        if(!show.sheets.rift||reduced())return;
        stage.style.opacity='0';
        setTimeout(()=>{
          if(!stage.isConnected)return;
          const ring=host.querySelector('.hero-form-effects');if(ring)ring.style.opacity='0';
          whirlwind(host,stage,()=>{
            if(!stage.isConnected)return;
            stage.style.opacity='';
            play(show.sheets.rift,150,()=>{
              if(!ring||!stage.isConnected)return;
              ring.style.opacity='';wisps(host);
              ring.style.transformOrigin='50% 66%';
              ring.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1.3)',opacity:1,offset:.45},{transform:'scale(1)',opacity:1}],{duration:700,easing:'cubic-bezier(.2,.9,.3,1)'});
            });
          });
        },60);
      },
      // Play one of the hero's occasional actions now (index into show.sheets.fidgets).
      act(i){const src=(show.sheets.fidgets||[])[i];if(src)preload(src).then(()=>play(src,130));},
      fidgets:(show.sheets.fidgets||[]).length,
      stop(){stopped=true;cancelAnimationFrame(timer);stage.remove();image.classList.remove('hero-show-under');image.style.opacity='';host.classList.remove('has-hero-show');}
    };
  }
  window.GemwovenHeroShow={attach};
})();
