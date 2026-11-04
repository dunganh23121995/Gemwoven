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
  // v2 (owner 04/11): a huge see-through spirit rises around the hero and fades; a smooth aura built from the hero's own
  // silhouette stays (two copies of the body drawn as light behind it, transformSilMirror keeps them on the current frame).
  if(files.v2){for(const el of [back,front])el.classList.add('tf-v2');
    back.innerHTML='<i class="tf2-dim"></i><i class="tf2-spirit"></i><i class="tf2-pool"></i><i class="tf2-sil"></i><i class="tf2-flowbox"><i class="tf2-sil tf2-flow"></i></i>';
    front.innerHTML='';}
  const form=String(progressionBattle?.stats?.form||state.form||1);back.dataset.form=form;front.dataset.form=form;
  // The form's own body box from its resting frame (build.py transform_body) over the sheet's, which some forms lack.
  const body=files.bodies?.[form];if(body)for(const el of [back,front]){el.style.setProperty('--t',body[0]);el.style.setProperty('--h',body[1]);el.style.setProperty('--x',body[2]);}
  return [back,front];
}
// v2: the spirit may be as tall as the stage allows while its whole top (--stop from the top of the drawing) stays inside the
// stage, 2% under its top edge; nothing of it is clipped. In body heights. --sface is its eye line.
function transformSpiritFit(hero,back){const stage=$('scene')?.getBoundingClientRect(),box=hero.getBoundingClientRect(),cs=getComputedStyle(back),num=(k,d)=>parseFloat(cs.getPropertyValue(k))||d;
  const t=num('--t',.19),h=num('--h',.75),sy=num('--sy',1),top=num('--stop',.15),sp=num('--sp',2.3),sw=num('--sw',.8),spx=num('--spx',0);
  if(!stage?.height||!box.height)return;const bh=box.height*h,feet=box.top+box.height*(t+h*sy),spm=Math.max(1.2,(feet-stage.top-stage.height*.02)/(1-top)/bh);
  back.style.setProperty('--spm',spm.toFixed(3));
  const flip=document.documentElement.dataset.heroSide==='right'?-1:1,sh=bh*Math.min(sp,spm),cx=box.left+box.width*.5+(box.width*(num('--x',.5)-.5)+bh*spx)*flip,half=sh*sw/2,pad=stage.width*.02;
  // Centred on the hero (owner 04/11: its face right above hers, like a giant of her standing behind); a frame edge may cut a
  // little of its side. Only a spirit that would leave the stage by more than a fifth of its width is moved in.
  const dx=Math.max(0,stage.left-half*.4-(cx-half))-Math.max(0,cx+half-(stage.right+half*.4));back.style.setProperty('--spdx',(dx*flip/box.width*100).toFixed(2)+'%');
  // Any gauges the spirit would stand over stay in place and fade back while it is up (owner 04/11), then return.
  const area={left:cx+dx-half,right:cx+dx+half,top:feet-sh,bottom:feet};
  for(const id of ['heroHeadHud','enemyHeadHud']){const el=$(id),r=el?.getBoundingClientRect();
    if(!r?.width||r.right<area.left||r.left>area.right||r.bottom<area.top||r.top>area.bottom)continue;
    el.classList.add('tf2-hud-fade');clearTimeout(el._tf2);el._tf2=setTimeout(()=>el.classList.remove('tf2-hud-fade'),2000);}}
// The aura's two silhouettes follow the body's current frame (the sprite sheet steps by background position).
// The sheets carry a faint alpha haze around the body; this filter cuts it (alpha under ~.4 gone, over ~.65 solid) before the
// glow, so the light follows the drawn contour only (#tf2-cut, used first in the CSS filter chains).
function transformSilFilter(){if(document.getElementById('tf2-cut'))return;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
  svg.innerHTML='<filter id="tf2-cut" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="4" intercept="-1.6"/></feComponentTransfer></filter>';document.body.append(svg);}
function transformSilMirror(hero,back){const body=hero.querySelector('.sprite-body'),sils=back.querySelectorAll('.tf2-sil');if(!body||!sils.length)return;transformSilFilter();
  back.style.setProperty('--u',(hero.offsetHeight*(parseFloat(getComputedStyle(back).getPropertyValue('--h'))||.75)/100).toFixed(2)+'px');
  const copy=()=>{const cs=getComputedStyle(body);for(const el of sils){el.style.backgroundImage=cs.backgroundImage;el.style.backgroundSize=cs.backgroundSize;el.style.backgroundPosition=cs.backgroundPosition;}};
  copy();back._sil?.disconnect();back._sil=new MutationObserver(copy);back._sil.observe(body,{attributes:true,attributeFilter:['style','class']});}
// Biến Thân sounds only the spirit-rise cue every hero shares, exactly the approved preview b3 (owner 04/11: no hero
// flame cue on top of or after it). The hero's own cue is kept for the end of the transformed turns.
function transformSounds(){playCastSound('spirit','rise',{volume:.34,pan:-.1});}
// Puts the look on the hero for the current phase; the actor is redrawn often, so it is put back whenever missing.
function transformLookSync(flare=false){
  const hero=actor('hero');if(!hero)return;
  const key=transformLook(),phase=!key||!progressionTransform?null:progressionTransform.left>0?'active':'after';
  hero.classList.toggle('has-tf-look',!!phase);hero.classList.toggle('has-tf-v2',!!phase&&!!ART.transformLooks[key]?.v2);
  let back=hero.querySelector(':scope > .tf-look'),front=hero.querySelector(':scope > .tf-front');
  if(!phase){back?._sil?.disconnect();back?.remove();front?.remove();return;}
  if(!back||!front){back?.remove();front?.remove();[back,front]=transformLookBuild(key);
    const glow=hero.querySelector(':scope > .combat-evo-glow');if(glow)glow.after(back);else hero.prepend(back);hero.append(front);
    if(back.classList.contains('tf-v2'))transformSilMirror(hero,back);}
  for(const el of [back,front])el.classList.toggle('tf-after',phase==='after');
  if(flare&&back.classList.contains('tf-v2')&&!reduced)transformSpiritFit(hero,back);
  if(flare&&!reduced){for(const el of [back,front]){el.classList.remove('tf-flare');void el.offsetWidth;el.classList.add('tf-flare');}
    setTimeout(()=>{for(const el of [back,front])el.classList.remove('tf-flare');},ART.transformLooks[key].v2?2600:1000);}
}
const transformLookActivate=progressionActivateTransform;
progressionActivateTransform=function(){
  const key=transformLook(),was=progressionTransform;if(!key)return transformLookActivate();
  // The look brings its own flare sound in place of the generic buff chime.
  const plain=sfx;sfx=kind=>{if(kind!=='buff')plain(kind);};
  try{transformLookActivate();}finally{sfx=plain;}
  if(was||!progressionTransform)return;
  transformLookSync(true);
  if(sound&&typeof playCastSound==='function')transformSounds(key);
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
  transformFlare(){transformLookSync(true);},
  // The hero studio's Biến Thân button: the flare and the transformed look on the configured hero and form, outside a hub
  // battle (presentation only; no bonus is applied without a battle kit). transformReset puts the hero back at rest.
  transformTest(){const hero=actor('hero');progressionTransform={left:3};hero.classList.remove('is-afterglow');hero.classList.add('is-transformed');
    hero.querySelector(':scope > .tf-look')?.remove();hero.querySelector(':scope > .tf-front')?.remove();transformLookSync(true);
    const key=transformLook();if(key&&sound&&typeof playCastSound==='function')transformSounds(key);},
  transformAfter(){if(!progressionTransform)this.transformTest();progressionTransform.left=0;const hero=actor('hero');hero.classList.remove('is-transformed');hero.classList.add('is-afterglow');transformLookSync();},
  transformReset(){progressionTransform=null;actor('hero')?.classList.remove('is-transformed','is-afterglow');transformLookSync();}});},0);
