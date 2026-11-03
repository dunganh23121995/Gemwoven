/* Hub NPCs that move at rest (owner 03/11): the painted background has the NPC painted out and a baked mesh-rig
 * sheet (assets/gemwoven/npc/npc_rig.py) stands where the NPC was. Assets named npc-<id> carry the sheet, the
 * screen and the stage box; the layer sits behind every control. Reduced motion keeps the resting frame. */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,A=window.GEMWOVEN_ASSETS;if(!G?.mount)return;
  const npcs=Object.entries(A).filter(([k,v])=>k.startsWith('npc-')&&v.stage);
  const reduced=()=>document.body.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let timer=0;
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
    const show=f=>els.forEach(([el,v])=>{const i=f%v.count;el.style.backgroundPosition=`${(i%v.cols)/(v.cols-1)*100}% ${Math.floor(i/v.cols)/(v.rows-1)*100}%`;});
    show(0);
    if(!reduced()){let f=0;const ms=els[0][1].frameDuration||100;timer=setInterval(()=>{if(!els[0][0].isConnected){clearInterval(timer);return;}show(++f);},ms);}
    return r;
  };
})();
