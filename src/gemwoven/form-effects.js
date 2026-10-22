/* Independent aura atlases: their clock and layers do not belong to body actions. */
(() => {
  window.GemwovenFormEffects={
    markup(key,form,asset){
      if(form!==3)return '';
      // Combat embeds the strip as `src` (data URI); the hub manifest uses `file`.
      const source=asset&&(asset.src||asset.file),url=source?new URL(source,document.baseURI).href:'';
      const style=url?`style="--aura-sheet:url('${url.replace(/"/g,'&quot;')}');--aura-cycle:${(asset.frameDuration||160)*(asset.count||8)}ms"`:'';
      const band=url?`<i class="form-aura-band" ${style}></i>`:'';
      // Optional front strip on the same clock (Noct's waist sash), drawn over the body.
      const frontSource=asset&&(asset.frontSrc||asset.front),frontUrl=frontSource?new URL(frontSource,document.baseURI).href:'';
      const front=frontUrl?`<span class="hero-form-aura form-aura-foreground form-aura-front"><i class="form-aura-band" ${style.replace(url,frontUrl)}></i></span>`:'';
      return `<span class="hero-form-aura"><i class="form-halo"></i><i class="form-floor"></i>${band}</span>`+
        (band?`<span class="hero-form-aura form-aura-foreground">${band}</span>`:'')+front;
    }
  };
})();
