// Head landmarks are authored per 256px atlas frame, excluding raised weapons.
const HEAD_LANDMARKS={
  hero:{
    fire:{idle:[[144,91],[142,89],[143,91],[144,91]],attack:[[142,85],[155,96],[149,100],[118,101],[137,104],[145,86]],cast:[[144,96],[143,100],[143,98],[138,98],[140,99],[143,91]]},
    earth:{idle:[[132,85],[130,84],[131,86],[131,86]],attack:[[130,95],[142,96],[136,101],[163,113],[148,112],[132,95]],cast:[[132,98],[132,96],[137,100],[127,102],[136,103],[131,98]]},
    ice:{idle:[[134,70],[134,70],[132,74],[134,72]],attack:[[143,76],[139,83],[150,85],[155,83],[151,88],[145,78]],cast:[[138,78],[141,79],[137,80],[142,83],[143,82],[138,78]]},
    lightning:{idle:[[124,79],[125,79],[122,80],[124,79]],attack:[[126,87],[126,86],[125,87],[133,95],[139,94],[128,87]],cast:[[127,82],[129,78],[124,81],[122,90],[131,86],[125,81]]}
  },
  enemy:{
    fire:{idle:[[88,90],[88,92]],attack:[[88,90],[82,111],[72,100],[66,104],[75,96],[90,90]]},
    earth:{idle:[[78,99],[80,98]],attack:[[78,99],[111,126],[111,114],[108,111],[122,94],[83,98]]},
    ice:{idle:[[92,103],[93,105]],attack:[[92,103],[102,120],[94,105],[85,104],[96,111],[95,105]]},
    lightning:{idle:[[105,115],[105,117]],attack:[[105,115],[107,133],[108,122],[111,126],[111,121],[106,115]]}
  }
};
function mountActorHead(side){
  const pin=document.createElement('span');pin.className='actor-head-anchor';pin.setAttribute('aria-hidden','true');actor(side).append(pin);
}
function updateActorHead(sprite,action,frame){
  const root=sprite.parentElement;if(!root?.classList.contains('actor'))return;
  root.style.setProperty('--foot-y',spriteDefinition(sprite.dataset.family,sprite.dataset.key,'idle').sheet.footY||.94);
  const pin=root.querySelector('.actor-head-anchor');if(!pin)return;
  const frames=HEAD_LANDMARKS[sprite.dataset.family][sprite.dataset.key]||{};
  const mapped=spriteDefinition(sprite.dataset.family,sprite.dataset.key,action).action;
  const points=spriteDefinition(sprite.dataset.family,sprite.dataset.key,action).sheet.heads||frames[mapped]||frames.attack,point=points[Math.min(frame,points.length-1)];
  pin.style.left=(root.dataset.facing==='-1'?256-point[0]:point[0])/256*100+'%';pin.style.top=point[1]/256*100+'%';
}
function combatHeadPoint(side){
  const scene=$('scene').getBoundingClientRect(),pin=actor(side).querySelector('.actor-head-anchor');
  const r=pin?.getBoundingClientRect()||actor(side).getBoundingClientRect();
  return {x:r.left-scene.left,y:r.top-scene.top};
}
// HUDs, numbers and callouts use the actor's resting (idle) head: the layout box
// ignores lunge/recoil transforms, so bars never ride along with an attack.
function combatIdleHead(side){
  const root=actor(side),s=root?.querySelector('.sprite-body');
  if(!s||!root.offsetWidth||root.offsetParent!==$('scene'))return {...combatHeadPoint(side),width:root?.offsetWidth||200,height:root?.offsetHeight||200};
  const sheet=spriteDefinition(s.dataset.family,s.dataset.key,'idle').sheet,frames=HEAD_LANDMARKS[s.dataset.family]?.[s.dataset.key]||{};
  const head=(sheet.heads||frames.idle||[[128,78]])[0],crown=sheet.crown;
  // Guessed anchors (x=128) use the painted body centre; the crown keeps the HUD above weapons, hoods and horns.
  let x=head[0]===128&&sheet.bodyX?sheet.bodyX:head[0];const y=crown?Math.min(head[1],crown[1]):head[1];
  if(root.dataset.facing==='-1'||root.classList.contains('duel-facing-left'))x=256-x;
  // Lumi's levitation lifts her whole actor with `translate`; follow its resting height, not the bob.
  const lift=root.dataset.floating==='true'?Math.round(parseFloat((root.style.translate||'').split(' ')[1])||0):0;
  return {x:root.offsetLeft+x/256*root.offsetWidth,y:root.offsetTop+y/256*root.offsetHeight+lift,width:root.offsetWidth,height:root.offsetHeight};
}
// Floating numbers sit beside the body on the outer side, below the HUD.
function combatNumberPoint(side,index=0,lift=0){
  const p=combatIdleHead(side),scene=$('scene'),W=scene.clientWidth||375,H=scene.clientHeight||300,out=side==='hero'?-1:1;
  const x=p.x+out*Math.min(64,p.width*.22)+(index%2?12:-8);
  return {x:Math.max(34,Math.min(W-34,x)),y:Math.max(30,Math.min(H-34,p.y+Math.min(48,p.height*.3)+(index%3)*7+lift))};
}
function placeCombatHuds(points){
  const scene=$('scene'),W=scene.clientWidth||375,boxes={};
  for(const side of ['hero','enemy']){
    const hud=$(side+'HeadHud');if(!hud)continue;
    const w=hud.offsetWidth||108,h=hud.offsetHeight||48;
    boxes[side]={hud,w,h,x:Math.max(w/2+4,Math.min(W-w/2-4,points[side].x)),bottom:Math.max(h+4,points[side].y-9)};
  }
  const a=boxes.hero,b=boxes.enemy;
  // Resting HUDs never overlap: separate horizontally first, then vertically.
  if(a&&b&&Math.abs(a.x-b.x)<(a.w+b.w)/2+6&&Math.abs(a.bottom-b.bottom)<Math.max(a.h,b.h)+4){
    const need=(a.w+b.w)/2+6-Math.abs(a.x-b.x),left=a.x<=b.x?a:b,right=left===a?b:a;
    left.x=Math.max(left.w/2+4,left.x-need/2);right.x=Math.min(W-right.w/2-4,left.x+(left.w+right.w)/2+6);
    if(right.x-left.x<(left.w+right.w)/2+6){const low=a.bottom>=b.bottom?a:b,high=low===a?b:a;high.bottom=Math.max(high.h+4,low.bottom-low.h-4);}
  }
  for(const [side,box] of Object.entries(boxes)){
    box.hud.style.left=box.x+'px';box.hud.style.top=box.bottom+'px';
    // While the other actor attacks, its body passes in front of this HUD.
    box.hud.style.zIndex=actor(side==='hero'?'enemy':'hero').classList.contains('combat-v3-acting')?'3':'';
  }
}
// Free space between the arena's outer edge and the widest opaque pose of an
// actor (all action frames, from build.py spans), measured at its resting box.
function combatEdgeRoom(side){
  const root=actor(side),s=root?.querySelector('.sprite-body'),W=$('scene').clientWidth;
  if(!s||!root.offsetWidth||!W)return 99;
  let lo=1,hi=0;
  for(const action of ['idle','attack','cast','hurt']){const span=spriteDefinition(s.dataset.family,s.dataset.key,action).sheet.span;if(span){lo=Math.min(lo,span[0]);hi=Math.max(hi,span[1]);}}
  if(hi<=lo)return 99;
  if(root.dataset.facing==='-1'||root.classList.contains('duel-facing-left'))[lo,hi]=[1-hi,1-lo];
  return side==='hero'?root.offsetLeft+lo*root.offsetWidth:W-(root.offsetLeft+hi*root.offsetWidth);
}
// Resting actors keep every pose at least 8px inside the arena (wide hammers,
// enlarged star forms); attack motions then spend only the remaining room.
const COMBAT_EDGE_MARGIN=8;
function combatKeepInside(){
  for(const side of ['hero','enemy']){
    const root=actor(side);if(!root||root.classList.contains('combat-v3-acting')||(root.dataset.state&&root.dataset.state!=='idle'))continue;
    const prop=side==='hero'?'marginLeft':'marginRight',current=parseFloat(root.style[prop])||0;
    const base=combatEdgeRoom(side)-current,nudge=Math.min(48,Math.max(0,Math.ceil(COMBAT_EDGE_MARGIN-base)));
    if(nudge!==current)root.style[prop]=nudge?nudge+'px':'';
  }
}
function combatOuterMotion(side,distance,tilt){
  const room=Math.max(0,combatEdgeRoom(side)-COMBAT_EDGE_MARGIN);
  return {distance:Math.min(distance,room),tilt:tilt*Math.min(1,room/30)};
}
function followCombatHeads(){
  requestAnimationFrame(followCombatHeads);
  if(document.hidden)return;
  combatKeepInside();
  const points={hero:combatIdleHead('hero'),enemy:combatIdleHead('enemy')};
  placeCombatHuds(points);
  for(const side of ['hero','enemy']){
    const hud=$(side+'HeadHud');if(!hud)continue;
    hud.style.visibility='visible';
    hud.style.opacity=actor(side).style.opacity==='0'?'0':state[side==='hero'?'hp':'enemyHp']>0?'1':'.35';
  }
  for(const popup of $('scene').querySelectorAll('[data-follow-actor]'))placeCombatPopup(popup,points[popup.dataset.followActor]);
}
function placeCombatPopup(node,p){
  if(!p)return;
  const W=$('scene').clientWidth||375,w=node.offsetWidth||80,shift=Number(node.dataset.shift||0);
  node.style.left=Math.max(w/2+4,Math.min(W-w/2-4,p.x+shift*p.width))+'px';node.style.top=Math.max(8,p.y+Number(node.dataset.headOffset||18))+'px';
}
// `away` moves a callout to the far side of the target, off the incoming attacker.
function popActorSkill(side,title,ultimate=false,pending,{away=false}={}){
  const node=document.createElement('div');node.className='actor-skill-pop'+(ultimate?' is-ultimate':'');
  node.dataset.followActor=side;node.dataset.headOffset=away?'4':ultimate?'36':'24';node.textContent=title;
  if(away)node.dataset.shift=String(side==='hero'?-.3:.3);
  node.style.setProperty('--skill-color',combatV3Palette[side==='hero'?state.key:state.enemyKey].main);
  $('combatEffects').append(node);placeCombatPopup(node,combatIdleHead(side));
  const job=animate(node,[{opacity:0,transform:'translate(-50%,10px) scale(.7)'},{opacity:1,transform:'translate(-50%,0) scale(1.08)',offset:.2},{opacity:1,transform:'translate(-50%,-5px) scale(1)',offset:.72},{opacity:0,transform:'translate(-50%,-17px) scale(.98)'}],{duration:ultimate?850:540,easing:'ease-out'}).finally(()=>node.remove());
  if(pending)pending.push(job);return job;
}
async function ultimateAura(side){
  const root=actor(side),key=side==='hero'?state.key:state.enemyKey;
  const aura=document.createElement('span');aura.className='ultimate-aura';aura.dataset.auraSide=side;
  aura.style.setProperty('--aura-color',combatV3Palette[key].main);
  aura.innerHTML='<i class="aura-halo"></i><i class="aura-ring"></i><i class="aura-ring second"></i>'+Array.from({length:8},(_,i)=>`<b style="--ray:${i*45}deg"></b>`).join('');
  root.append(aura);root.classList.add('charging-ultimate');
  const title=side==='hero'?HEROES[key].skill:MONSTERS[key].skill;
  combatV3Action(side,'cast',850);combatV3Frame(side,'cast',0);combatV3ChargeSound(key,true);
  const popup=popActorSkill(side,title,true);
  const glow=animate(aura,[{opacity:0,transform:'scale(.55)'},{opacity:.65,transform:'scale(.9)',offset:.35},{opacity:1,transform:'scale(1.13)',offset:.78},{opacity:0,transform:'scale(1.3)'}],{duration:700,easing:'ease-in-out'});
  try{
    await wait(reduced?0:220);combatV3Frame(side,'cast',1);
    await wait(reduced?0:260);combatV3Frame(side,'cast',2);
    await Promise.all([glow,popup]);
  }finally{aura.remove();root.classList.remove('charging-ultimate');}
}
async function heroUltimate(){
  const key=state.key;sfx('special');
  if(key==='earth')return noriRenewalUltimate();
  if(key==='ice')return yukiGlacierUltimate();
  const kit=progressionKit(key);
  await rageChoreography('hero',kit.base,{hits:Math.max(1,kit.hits),onRelease(pending){}});
}
async function castReadyUltimates(){
  for(const side of ['hero','enemy']){
    if(state.hp<=0||state.enemyHp<=0)return;
    if(side==='enemy'&&state.noriStunTurns>0)continue;
    const key=side==='hero'?'energy':'enemyEnergy';if(state[key]<100)continue;
    state[key]-=100;update();
    if(side==='hero')await heroUltimate();else await enemySkill({reserved:true});
  }
}
function startReadyUltimates(){
  if(state.energy<100&&state.enemyEnergy<100)return;
  return perform(async()=>{await castReadyUltimates();return false;});
}
requestAnimationFrame(followCombatHeads);
