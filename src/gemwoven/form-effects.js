/* Independent aura atlases: their clock and layers do not belong to body actions. */
(() => {
  // One clock drives every aura: the current frame (::before) fades out while the next frame
  // (::after) fades in, both set in the same tick so the two layers can never drift apart.
  const reduced=()=>document.body?.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const ease=t=>t*t*(3-2*t),position=frame=>`${frame/7*100}% 0`;
  let ticking=false;
  function tick(now){
    const bands=document.querySelectorAll('.form-aura-band');
    if(!bands.length){ticking=false;return;}
    requestAnimationFrame(tick);
    if(document.hidden)return;
    for(const band of bands){
      const ms=Number(band.dataset.frameMs)||260,t=reduced()||band.dataset.still?0:now/ms,frame=Math.floor(t)%8,mix=ease(t%1);
      band.style.setProperty('--aura-a',position(frame));band.style.setProperty('--aura-b',position((frame+1)%8));
      band.style.setProperty('--aura-in',mix.toFixed(3));band.style.setProperty('--aura-out',(1-mix**3).toFixed(3));
    }
  }
  const start=()=>{if(!ticking){ticking=true;requestAnimationFrame(tick);}};
  window.GemwovenFormEffects={
    markup(key,form,asset){
      if(form!==3)return '';
      // Combat embeds the strip as `src` (data URI); the hub manifest uses `file`.
      const source=asset&&(asset.src||asset.file),url=source?new URL(source,document.baseURI).href:'';
      // Slower than the authored strip: each frame melts into the next instead of stepping.
      const frameMs=Math.max(300,Math.round((asset?.frameDuration||160)*(key==='shadow'?2.6:1.8)));
      // Noct's generated cloud frames do not line up; he keeps a single cloud that floats.
      const style=url?`data-frame-ms="${frameMs}"${key==='shadow'?' data-still="1"':''} style="--aura-sheet:url('${url.replace(/"/g,'&quot;')}')"`:'';
      const band=url?`<i class="form-aura-band" ${style}></i>`:'';if(band)setTimeout(start);
      // Optional front strip on the same clock (Noct's waist sash), drawn over the body.
      const frontSource=asset&&(asset.frontSrc||asset.front),frontUrl=frontSource?new URL(frontSource,document.baseURI).href:'';
      const front=frontUrl?`<span class="hero-form-aura form-aura-foreground form-aura-front"><i class="form-aura-band" ${style.replace(url,frontUrl)}></i></span>`:'';
      return `<span class="hero-form-aura"><i class="form-halo"></i><i class="form-floor"></i>${band}</span>`+
        (band?`<span class="hero-form-aura form-aura-foreground">${band}</span>`:'')+front;
    }
  };
})();
