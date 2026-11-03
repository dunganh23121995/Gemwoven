/* Calmer screen backgrounds (Codex UI reviews 16–17). The painted backgrounds are as detailed and bright as the UI on
 * top, so nothing leads the eye. A copy of the background, blurred, darkened and desaturated, lies over the original
 * under every node. Ellipses cut it away where the scene itself is the focus (`clear`: the hero's stand, the arena gate,
 * the summon circle); `soft` areas keep their context with a lighter filter (the skill tree's trunk, the tavern table).
 * Boxes are percentages of the 941×1672 stage: [left, right, top, bottom]. Home is approved as it is and stays untouched.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME;if(!G?.mount)return;
  const BASE=[7,.68,.55];
  const SCREENS={
    upgrade:{clear:[[32,66,24,44]]},
    inventory:{clear:[[19,47,13,27]]},
    skills:{clear:[[13,40,30,50]],soft:[[[43,94,24,59],[3,.8,.8]]]},
    arena:{clear:[[30,71,15,29],[32,68,48,58]],soft:[[[28,80,31,49],[2,.85,.85]]]},
    shop:{clear:[[34,69,29,44]]},
    forge:{base:[5,.75,.6],soft:[[[69,97,26,43],[3,.82,.8]]]},
    tavern:{clear:[[28,48,31,44]],soft:[[[12,94,43,69],[3,.84,.8]]]},
    summon:{base:[5,.74,.6],clear:[[35,66,23,55]]}
  };
  // An ellipse around the box, fading over about a tenth of the stage's width; `inside` is what it shows within.
  const ellipse=([l,r,t,b],inside)=>{const cx=(l+r)/2,cy=(t+b)/2,rx=(r-l)/2+5,ry=(b-t)/2+3,[a,z]=inside?['#000','transparent']:['transparent','#000'];
    return `radial-gradient(${rx*1.25}% ${ry*1.25}% at ${cx}% ${cy}%,${a} 72%,${z} 100%)`;};
  const filter=([blur,light,sat])=>`blur(${blur}px) brightness(${light}) saturate(${sat})`;
  const layer=(cls,f,mask)=>{const el=document.createElement('div');el.className='bg-focus '+cls;el.setAttribute('aria-hidden','true');el.style.filter=filter(f);if(mask)el.style.maskImage=el.style.webkitMaskImage=mask;return el;};
  const mount=G.mount;
  G.mount=(state,ctx)=>{
    const r=mount(state,ctx),scene=document.getElementById('scene'),s=SCREENS[state.screen];
    if(scene&&s&&!scene.querySelector(':scope>.bg-focus')){
      const soft=s.soft||[],holes=[...(s.clear||[]),...soft.map(z=>z[0])];
      const strong=layer('bg-strong',s.base||BASE,holes.length?holes.map(z=>ellipse(z,false)).join(','):'');
      scene.prepend(...soft.map(([box,f])=>layer('bg-soft',f,ellipse(box,true))),strong);
    }
    return r;
  };
})();
