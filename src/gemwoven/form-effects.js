/* Independent aura atlases: their clock and layers do not belong to body actions. */
(() => {
  window.GemwovenFormEffects={
    markup(key,form,asset){
      if(form!==3)return '';
      // Combat embeds the strip as `src` (data URI); the hub manifest uses `file`.
      const source=asset&&(asset.src||asset.file),url=source?new URL(source,document.baseURI).href:'';
      const style=url?`style="--aura-sheet:url('${url.replace(/"/g,'&quot;')}');--aura-cycle:${(asset.frameDuration||160)*(asset.count||8)}ms"`:'';
      const band=url?`<i class="form-aura-band" ${style}></i>`:'';
      return `<span class="hero-form-aura"><i class="form-halo"></i><i class="form-floor"></i>${band}</span>`+
        (band?`<span class="hero-form-aura form-aura-foreground">${band}</span>`:'');
    }
  };
})();
