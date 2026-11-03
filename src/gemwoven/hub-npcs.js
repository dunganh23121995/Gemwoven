/* Hub NPCs that move at rest (owner 03/11): the painted background has the NPC painted out and a baked mesh-rig
 * sheet (assets/gemwoven/npc/npc_rig.py) stands where the NPC was. Assets named npc-<id> carry the sheet, the
 * screen and the stage box; the layer sits behind every control. Reduced motion keeps the resting frame. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,A=window.GEMWOVEN_ASSETS;if(!G?.mount)return;
  const npcs=Object.entries(A).filter(([k,v])=>k.startsWith('npc-')&&v.stage);
  const reduced=()=>document.body.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let timer=0;
  // The shop's slogan pennant is gone (owner 03/11): the stall's own wares carry the mood.
  const decorate=G.decorate;
  G.decorate=state=>{const p=decorate(state);if(state.screen==='shop'){const L=window.GEMWOVEN_LAYOUT;L.screens.shop.nodes=L.screens.shop.nodes.filter(n=>!/^shop\.shop-story(-flag)?$/.test(n.id));}return p;};
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    const r=mount(state,ctx),scene=document.getElementById('scene');
    clearInterval(timer);timer=0;
    const here=npcs.filter(([,v])=>v.screen===state.screen);
    if(!scene||!here.length)return r;
    const els=here.map(([k,v])=>{
      const el=document.createElement('i');el.className='hub-npc';el.dataset.npc=k.slice(4);el.setAttribute('aria-hidden','true');
      const {x,y,size}=v.stage;Object.assign(el.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px',backgroundImage:`url("${v.file}")`,backgroundSize:`${v.cols*100}% ${v.rows*100}%`});
      scene.prepend(el);return [el,v];});
    const show=t=>els.forEach(([el,v])=>{const i=Math.floor(t/(v.frameDuration||100))%v.count;el.style.backgroundPosition=`${(i%v.cols)/(v.cols-1)*100}% ${Math.floor(i/v.cols)/(v.rows-1)*100}%`;});
    show(0);
    // One clock for all of them; each NPC steps at its own frame duration.
    if(!reduced()){const start=performance.now();timer=setInterval(()=>{if(!els[0][0].isConnected){clearInterval(timer);return;}show(performance.now()-start);},40);}
    return r;
  };
})();
