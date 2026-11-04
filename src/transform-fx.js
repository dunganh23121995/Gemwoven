// Biến Thân looks (docs/GAME_DESIGN.md §2.4, owner 04/11 option A): each hero's own drawn element transformation, shared
// by its three forms and sized from the body (--evo-top / --evo-h / --evo-x on the actor). Mika first; a hero without a
// look keeps the plain golden glow. Presentation only: the bonus, the turns and the afterglow stay in progression-combat.js.
// Plan and timings (Codex): assets/gemwoven/raw/transform-fire/critique.md.
//   flare (1 s): the fox spirit opens from her feet, peaks at ~320 ms and is gone by ~720 ms while two side flames rise;
//   transformed turns: the two side flames drift slowly out of phase, two low flames at her ankles, a few embers rise;
//   afterglow: the flames go out in 320 ms and only a small coal flourish stays behind her heels.
// Every piece is one still drawing moved as a whole (no frame-swapped sheets). NO FX hides the look; sound keeps its own switch.
const TRANSFORM_LOOK_PIECES=['spirit','side-left','side-right','ground','mote','mote-2','after'];
// files.bodies is not a piece; only these names become --tf-<i> images.
function transformLook(){const key=state.key;return ART.transformLooks?.[key]?key:null;}
function transformLookBuild(key){
  const files=ART.transformLooks[key],url=name=>`url("${files[name]}")`;
  const back=document.createElement('span');back.className='tf-look tf-'+key;back.setAttribute('aria-hidden','true');
  const front=document.createElement('span');front.className='tf-front tf-'+key;front.setAttribute('aria-hidden','true');
  for(const [i,name] of TRANSFORM_LOOK_PIECES.entries())back.style.setProperty('--tf-'+i,url(name));
  front.style.setProperty('--tf-3',url('ground'));
  back.innerHTML='<i class="tf-spirit"></i><i class="tf-side tf-left"><b></b></i><i class="tf-side tf-right"><b></b></i>'+
    '<span class="tf-motes">'+[0,1,2,3,4,5].map(i=>`<i style="--e:${i}"><b></b></i>`).join('')+'</span><i class="tf-mark"></i>';
  front.innerHTML='<i class="tf-ground"><b></b></i>';
  const form=String(progressionBattle?.stats?.form||1);back.dataset.form=form;front.dataset.form=form;
  // The form's own body box from its resting frame (build.py transform_body) over the sheet's, which some forms lack.
  const body=files.bodies?.[form];if(body)for(const el of [back,front]){el.style.setProperty('--t',body[0]);el.style.setProperty('--h',body[1]);el.style.setProperty('--x',body[2]);}
  return [back,front];
}
// Puts the look on the hero for the current phase; the actor is redrawn often, so it is put back whenever missing.
function transformLookSync(flare=false){
  const hero=actor('hero');if(!hero)return;
  const key=transformLook(),phase=!key||!progressionTransform?null:progressionTransform.left>0?'active':'after';
  hero.classList.toggle('has-tf-look',!!phase);
  let back=hero.querySelector(':scope > .tf-look'),front=hero.querySelector(':scope > .tf-front');
  if(!phase){back?.remove();front?.remove();return;}
  if(!back||!front){back?.remove();front?.remove();[back,front]=transformLookBuild(key);
    const glow=hero.querySelector(':scope > .combat-evo-glow');if(glow)glow.after(back);else hero.prepend(back);hero.append(front);}
  for(const el of [back,front])el.classList.toggle('tf-after',phase==='after');
  if(flare&&!reduced){for(const el of [back,front]){el.classList.remove('tf-flare');void el.offsetWidth;el.classList.add('tf-flare');}
    setTimeout(()=>{for(const el of [back,front])el.classList.remove('tf-flare');},1000);}
}
const transformLookActivate=progressionActivateTransform;
progressionActivateTransform=function(){
  const key=transformLook(),was=progressionTransform;if(!key)return transformLookActivate();
  // The look brings its own flare sound in place of the generic buff chime.
  const plain=sfx;sfx=kind=>{if(kind!=='buff')plain(kind);};
  try{transformLookActivate();}finally{sfx=plain;}
  if(was||!progressionTransform)return;
  transformLookSync(true);
  if(sound&&typeof playCastSound==='function')setTimeout(()=>playCastSound(key,'transform',{volume:.3,pan:-.2}),80);
};
const transformLookTurn=progressionTransformTurn;
progressionTransformTurn=function(){
  const before=progressionTransform?.left;transformLookTurn();
  const key=transformLook();if(!key||!(before>0)||progressionTransform?.left!==0)return;
  transformLookSync();if(sound&&typeof playCastSound==='function')playCastSound(key,'transform-end',{volume:.3,pan:-.2});
};
const transformLookUpdate=update;
update=function(){transformLookUpdate();transformLookSync();};
// QA: run the transformed turns down (the studio and the screenshot checks), and replay the flare.
setTimeout(()=>{if(window.gameQA)Object.assign(window.gameQA,{
  transformTurns(n=1){for(let i=0;i<n;i++)progressionTransformTurn();update();},
  transformFlare(){transformLookSync(true);}});},0);
