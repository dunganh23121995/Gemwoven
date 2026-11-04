// Dẫn Đường in the first fight (Claude + Codex 04/11, docs/GAME_DESIGN.md §20 "Vòng Tính năng kế tiếp"; Codex mockup
// assets/gemwoven/raw/guide/mockup-fight.png). Only the guided stage-1 fight: the pending encounter carries `coach`
// (progression.js begin) and the guide must still be on its first goal. After 1.5 s idle on the player's turn the drawn
// glove slides across the two gems of legalMoves()[0] (the hint button's pick, without pressing it) under one line in the
// sky; it comes back after 6 s idle until the first match, and the first real ultimate says once that it fires by itself.
// Read-only: no await, no pause, no RNG, no combat state is touched.
(()=>{
  let on=false;
  try{const b=progressionBattle,v=progressionStore?.guide?.();on=!!(b&&b.coach&&b.mode==='campaign'&&b.index===1&&v&&v.active&&v.step==='win1');}catch{on=false;}
  if(!on)return;
  const ART='assets/gemwoven/guide/',MOVE='Đổi 2 ngọc cạnh nhau, xếp 3 cùng màu',ULT='Đủ 100 nộ: tuyệt kỹ tự tung';
  const root=document.createElement('div');root.className='coach-layer';root.setAttribute('aria-live','polite');document.body.append(root);
  let idleSince=performance.now(),matched=false,ultSaid=false,lineTimer=0,shown='',everShown=false;
  const touch=()=>{idleSince=performance.now();hide();};
  for(const ev of ['pointerdown','pointerup','pointercancel','keydown'])document.addEventListener(ev,touch,true);
  // Rotation or resize: rebuild the visible cue from fresh measurements.
  addEventListener('resize',()=>{if(shown==='move'){const g=gesture();root.innerHTML=g?plaque(MOVE)+g:'';}else if(shown==='line')root.innerHTML=plaque(ULT);});
  function hide(){if(shown!=='line'){root.innerHTML='';shown='';}}
  function plaque(text){
    const scene=$('scene').getBoundingClientRect(),head=$('heroHeadHud').getBoundingClientRect();
    const room=Math.max(48,Math.min(head.top,$('enemyHeadHud').getBoundingClientRect().top)-scene.top-10),h=Math.min(room,scene.width*.2,118),w=Math.min(scene.width*.92,h*7.2);
    return `<div class="coach-talk" style="left:${scene.left+scene.width*.04}px;top:${scene.top+8}px;width:${w}px;height:${h}px;--h:${h}px">`+
      `<span class="coach-cat" style="background-image:url(assets/gemwoven/plaza/npc-guide.webp)"></span><div class="coach-plaque" style="background-image:url(${ART}plaque.webp)"><p>${text}</p></div></div>`;
  }
  function gesture(){
    const move=legalMoves()[0];if(!move)return '';
    const a=move.a.el.getBoundingClientRect(),b=move.b.el.getBoundingClientRect(),size=a.width;
    const ring=r=>`<span class="coach-ring" style="left:${r.left+2}px;top:${r.top+2}px;width:${r.width-4}px;height:${r.height-4}px;border-image-source:url(${ART}ring.webp)"></span>`;
    const dx=b.left-a.left,dy=b.top-a.top,angle=Math.atan2(dy,dx)*180/Math.PI;
    const cx=(a.left+b.left)/2+size/2,cy=(a.top+b.top)/2+size/2;
    return ring(a)+ring(b)+`<img class="coach-swipe" src="${ART}swipe.webp" alt="" style="left:${cx-size*.55}px;top:${cy-size*.42}px;width:${size*1.1}px;transform:rotate(${angle}deg)">`+
      `<img class="coach-glove" src="${ART}glove-down.webp" alt="" style="left:${a.left+size*.5-size*.8*.42}px;top:${a.top+size*.5-size*.8*1.55}px;width:${size*.8}px;--dx:${dx}px;--dy:${dy}px">`;
  }
  function frame(){
    if(ended){root.remove();return;}
    if(!matched&&state.score>0)matched=true;
    const busy=locked||turn!=='player'||!!pointer||!!document.querySelector('dialog[open]');   // a held press counts as interaction
    if(shown==='line'){requestAnimationFrame(frame);return;}
    if(matched||busy){if(shown)hide();if(busy)idleSince=performance.now();requestAnimationFrame(frame);return;}
    const idle=performance.now()-idleSince,wait=everShown?6000:1500;
    if(!shown&&idle>=wait){const g=gesture();if(g){root.innerHTML=plaque(MOVE)+g;shown='move';everShown=true;}}
    requestAnimationFrame(frame);
  }
  // The first real ultimate (queued when the bar reaches 100) explains itself once, then the coach is done.
  const ult=heroUltimate;
  heroUltimate=function(...args){
    const out=ult.apply(this,args);
    // Said once, after the ultimate's own staging (its name banner uses the same sky), without delaying combat.
    if(!ultSaid){ultSaid=true;Promise.resolve(out).finally(()=>{if(ended)return;root.innerHTML=plaque(ULT);shown='line';clearTimeout(lineTimer);lineTimer=setTimeout(()=>{shown='';root.innerHTML='';},3200);});}
    return out;
  };
  requestAnimationFrame(frame);
})();
