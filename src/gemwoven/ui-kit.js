/* Shared drawn UI kit for the panel screens (Codex review 26; mockup assets/gemwoven/raw/ui-kit/mockup-raw.png). The pieces
 * in assets/gemwoven/ui-kit (rows, tabs, plates, toggles, slider track/fill/knob, reward sockets, seals, ribbons) are exposed
 * as CSS variables (absolute URLs, so the inlined stylesheet resolves them) and ui-kit.css dresses the existing markup with them:
 * Hòm Thư rows, tabs and footer; Cài Đặt switches and sliders. Sliders also get --v (their value in %) for the drawn fill.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,A=window.GEMWOVEN_ASSETS;if(!G?.mount)return;
  for(const [k,v] of Object.entries(A))if(k.startsWith('kit-'))document.documentElement.style.setProperty('--'+k,`url("${new URL(v.file,document.baseURI).href}")`);
  const fill=r=>r.style.setProperty('--v',((r.value-r.min)/((r.max-r.min)||100)*100)+'%');
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    const r=mount(state,ctx);
    // Sliders and switches live in forms built after mount; dress them on the next frame.
    requestAnimationFrame(()=>{for(const s of document.querySelectorAll('#scene input[type=range]')){fill(s);s.addEventListener('input',()=>fill(s));}
      for(const c of document.querySelectorAll('#scene input[type=checkbox]'))c.closest('label')?.classList.add('kit-switch');});
    return r;
  };
})();
