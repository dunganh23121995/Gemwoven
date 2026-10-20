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
function followCombatHeads(){
  requestAnimationFrame(followCombatHeads);
  if(document.hidden)return;
  const points={hero:combatHeadPoint('hero'),enemy:combatHeadPoint('enemy')};
  for(const side of ['hero','enemy']){
    const hud=$(side+'HeadHud');if(!hud)continue;
    hud.style.left=points[side].x+'px';hud.style.top=points[side].y-9+'px';
    hud.style.visibility='visible';
    hud.style.opacity=actor(side).style.opacity==='0'?'0':state[side==='hero'?'hp':'enemyHp']>0?'1':'.35';
  }
  for(const popup of $('scene').querySelectorAll('[data-follow-actor]')){
    const p=points[popup.dataset.followActor];if(!p)continue;
    popup.style.left=p.x+'px';popup.style.top=p.y+Number(popup.dataset.headOffset||18)+'px';
  }
}
function popActorSkill(side,title,ultimate=false,pending){
  const node=document.createElement('div');node.className='actor-skill-pop'+(ultimate?' is-ultimate':'');
  node.dataset.followActor=side;node.dataset.headOffset=ultimate?'36':'24';node.textContent=title;
  node.style.setProperty('--skill-color',combatV3Palette[side==='hero'?state.key:state.enemyKey].main);
  const p=combatHeadPoint(side);node.style.left=p.x+'px';node.style.top=p.y+Number(node.dataset.headOffset)+'px';
  $('combatEffects').append(node);
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
  await rageChoreography('hero',{fire:135,earth:110,ice:100,lightning:140,shadow:150}[key],{
    hits:key==='lightning'||key==='shadow'?5:1,onRelease(pending){
    }
  });
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
