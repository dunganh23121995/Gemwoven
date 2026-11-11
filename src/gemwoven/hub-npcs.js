/* Hub NPCs that move at rest (owner 03/11): the painted background has the NPC painted out and a baked mesh-rig
 * sheet (assets/gemwoven/npc/npc_rig.py) or a drawn sheet (the forge's smith and fire, raw/forge-life) stands where the
 * NPC was. Assets named npc-<id> carry the sheet, the
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
    // NPCs belong to a painting, not a screen: Nhiệm Vụ Hằng Ngày shows the tavern's painting, so its guests too.
    const theme=window.GEMWOVEN_LAYOUT?.screens?.[state.screen]?.backgroundKey||state.screen;
    // Gặp Gỡ (chat) lays its own plaza over the whole painting, so nobody stands there.
    const here=state.screen==='chat'?[]:npcs.filter(([,v])=>v.screen===theme);
    if(!scene||!here.length)return r;
    // Painted order: a higher layer stands in front (the tavern's fox before Mika).
    here.sort((a,b)=>(a[1].layer||0)-(b[1].layer||0));
    const els=here.map(([k,v])=>{
      const el=document.createElement('i');el.className='hub-npc';el.dataset.npc=k.slice(4);el.setAttribute('aria-hidden','true');
      const {x,y,size,w=size,h=size,z}=v.stage;Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',zIndex:z??'',backgroundImage:`url("${v.file}")`,backgroundSize:`${v.cols*100}% ${v.rows*100}%`});
      // a sheet that burns or stands inside the painting (the forge fire in its furnace) is clipped to that opening
      if(v.stage.clip)el.style.clipPath=v.stage.clip;
      return [el,v];});
    scene.prepend(...els.map(([el])=>el));
    // A sheet may name the order its frames play in (seq), so a pose can hold (the smith rests between blows), and the frame
    // its loop starts at (phase), so neighbours do not breathe together.
    const show=t=>els.forEach(([el,v])=>{const k=Math.floor(t/(v.frameDuration||100))+(v.phase||0),i=v.seq?v.seq[k%v.seq.length]:k%v.count;el.style.backgroundPosition=`${(i%v.cols)/(v.cols-1)*100}% ${Math.floor(i/v.cols)/(v.rows-1)*100}%`;});
    show(0);
    // One clock for all of them; each NPC steps at its own frame duration.
    if(!reduced()){const start=performance.now();timer=setInterval(()=>{if(!els[0][0].isConnected){clearInterval(timer);return;}show(performance.now()-start);},40);}
    return r;
  };
})();
