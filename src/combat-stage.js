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
    // While the other actor attacks, its body passes in front of this HUD (unless the attacker
    // keeps the foe's HUD over its effects, like Noct vanishing into his smoke).
    const other=actor(side==='hero'?'enemy':'hero');
    box.hud.style.zIndex=other.classList.contains('combat-v3-acting')&&!other.dataset.foeHudOver?'3':'';
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
  for(const side of ['hero','enemy'])placeCombatPopupColumn(side,points[side]);
}
// ---- Combat popups: damage, crits, heals, armour, energy, statuses and callouts -------------------
// One column per actor, beside the body on its outer side. Every popup pops in, holds long enough to
// read (about 1.3 s, crits 1.65 s) and fades; a newer popup pushes the older ones up instead of
// covering them, and only the newest few stay. Turn pacing never waits for that whole life: callers'
// `pending` lists (and the returned promise) get only the short beat each popup always had.
const COMBAT_POPUP_LIFE={damage:1300,crit:1650,blocked:1250,heal:1350,armor:1350,energy:1250,stored:1350,miss:1200,status:1500,callout:1400,ultimate:1700};
const COMBAT_POPUP_KEEP=4,COMBAT_POPUP_GAP=2;
const combatPopupColumns={hero:[],enemy:[]};
// Warm the crit art so the first critical hit shows its burst on the very frame it lands.
if(typeof ART!=='undefined'&&ART.uiFx)for(const src of Object.values(ART.uiFx)){const img=new Image();img.decoding='async';img.src=src;}
// The column's foot sits low on the body (a quarter of the way up from the boots), on the outer
// side, so a fresh number or crit stays clear of the head HUD; older ones rise above it and fade.
function combatPopupAnchor(side,p=combatIdleHead(side)){
  const root=actor(side),s=root?.querySelector('.sprite-body'),H=$('scene').clientHeight||300,out=side==='hero'?-1:1;
  const footY=s?spriteDefinition(s.dataset.family,s.dataset.key,'idle').sheet.footY||.94:.94;
  const feet=root?.offsetHeight?root.offsetTop+footY*root.offsetHeight:p.y+p.height*.6,body=Math.max(40,feet-p.y);
  return {x:p.x+out*Math.min(40,p.width*.14),y:Math.max(70,Math.min(H-16,feet-body*.25))};
}
function placeCombatPopupColumn(side,p){
  const column=combatPopupColumns[side];if(!column.length||!p)return;
  const W=$('scene').clientWidth||375,a=combatPopupAnchor(side,p);
  for(const pop of column){
    if(!pop.node.isConnected)continue;
    const w=pop.node.offsetWidth||80;
    pop.node.style.left=Math.max(w/2+6,Math.min(W-w/2-6,a.x+pop.dx))+'px';pop.node.style.top=a.y+'px';
  }
}
function combatPopupMarkup(kind,text){
  const body=document.createElement('span');body.className='combat-pop-body';
  if(kind==='crit'&&ART.uiFx){
    // Critical hits: the generated starburst/slash behind a bigger number, under a 'CHÍ MẠNG' ribbon.
    body.innerHTML=`<img class="crit-burst" src="${ART.uiFx.critBurst}" alt=""><span class="crit-ribbon"><img src="${ART.uiFx.critRibbon}" alt=""><b>CHÍ MẠNG</b></span><strong></strong>`;
  }else body.innerHTML='<strong></strong>';
  body.querySelector('strong').textContent=text;
  return body;
}
function combatPopupLife(pop,frames,duration){
  const generation=++pop.generation;
  for(const a of pop.body.getAnimations?.()||[])a.cancel();
  animate(pop.body,frames,{duration,easing:'linear',fill:'both'}).then(()=>{if(generation===pop.generation)retireCombatPopup(pop,true);});
}
// Newest at the bottom: each popup rises by the heights of the ones that came after it. Only the
// newest few stay; older ones fade out early.
function restackCombatPopups(side){
  const column=combatPopupColumns[side]=combatPopupColumns[side].filter(pop=>pop.node.isConnected&&!pop.retired);
  while(column.length>COMBAT_POPUP_KEEP)retireCombatPopup(column[0]);
  let shift=0;
  for(let i=column.length-1;i>=0;i--){column[i].node.style.translate=`0 ${-shift}px`;shift+=(column[i].node.offsetHeight||28)+COMBAT_POPUP_GAP;}
}
function retireCombatPopup(pop,now=false){
  if(pop.retired)return;pop.retired=true;pop.generation++;
  const column=combatPopupColumns[pop.side],i=column.indexOf(pop);if(i>=0)column.splice(i,1);
  const end=()=>{pop.node.remove();pop.resolve();};
  if(now||reduced)return end();
  pop.node.classList.add('is-retiring');setTimeout(end,200);
}
// kind: damage | crit | blocked | heal | armor | energy | stored | miss | status | callout | ultimate.
// tone (optional): a colour family for statuses and callouts (good, ward, energy, control, advantage).
function combatPopup(side,text,{kind='damage',tone='',index=0,beat=360,pending,life}={}){
  const ready=wait(beat);if(pending)pending.push(ready);
  const root=$('combatEffects');
  if(reduced||!root)return {ready,done:ready,update(){}};
  // The same callout again while it is still up (KHẮC HỆ on each of nine bolts, a repeated stun)
  // refreshes that one instead of stacking copies.
  if(!['damage','crit','blocked','heal','armor','energy','stored'].includes(kind)){
    const twin=combatPopupColumns[side].find(other=>!other.retired&&other.kind===kind&&other.text===text&&other.node.isConnected);
    if(twin){
      const column=combatPopupColumns[side];column.splice(column.indexOf(twin),1);column.push(twin);
      restackCombatPopups(side);twin.update(text);return {ready,done:twin.done,node:twin.node,update:twin.update};
    }
  }
  const node=document.createElement('span');node.className='combat-pop is-'+kind+(tone?' tone-'+tone:'');node.setAttribute('aria-hidden','true');
  node.dataset.popSide=side;node.dataset.popKind=kind;
  node.style.setProperty('--skill-color',combatV3Palette[side==='hero'?state.key:state.enemyKey]?.main||'#ffd36b');
  const body=combatPopupMarkup(kind,text);node.append(body);root.append(node);
  const pop={side,node,body,kind,text,generation:0,dx:index?((index%2?1:-1)*Math.min(14,4+index*3)):0,retired:false};
  pop.done=new Promise(resolve=>pop.resolve=resolve);
  // The new popup takes the bottom slot; the column above it rises by its height.
  combatPopupColumns[side].push(pop);
  restackCombatPopups(side);
  placeCombatPopupColumn(side,combatIdleHead(side));
  const total=life||COMBAT_POPUP_LIFE[kind]||1300,pop_in=kind==='crit'?.13:.11;
  combatPopupLife(pop,kind==='crit'?[
    {opacity:0,transform:'translateY(6px) scale(.35) rotate(-8deg)'},
    {opacity:1,transform:'translateY(-4px) scale(1.28) rotate(3deg)',offset:.07},
    {opacity:1,transform:'translateY(0) scale(.96) rotate(0deg)',offset:pop_in},
    {opacity:1,transform:'translateY(-2px) scale(1)',offset:.2},
    {opacity:1,transform:'translateY(-8px) scale(1)',offset:.8},
    {opacity:0,transform:'translateY(-20px) scale(.97)'}
  ]:[
    {opacity:0,transform:'translateY(8px) scale(.6)'},
    {opacity:1,transform:'translateY(-3px) scale(1.14)',offset:pop_in*.6},
    {opacity:1,transform:'translateY(0) scale(1)',offset:pop_in},
    {opacity:1,transform:'translateY(-7px) scale(1)',offset:.78},
    {opacity:0,transform:'translateY(-18px) scale(.98)'}
  ],total);
  // Board receipts merge into one popup while it is on screen: new total, small bump, fresh hold.
  pop.update=value=>{
    if(pop.retired)return false;
    pop.text=value;body.querySelector('strong').textContent=value;
    combatPopupLife(pop,[{opacity:1,transform:'scale(1.16)'},{opacity:1,transform:'scale(1)',offset:.1},{opacity:1,transform:'translateY(-5px) scale(1)',offset:.75},{opacity:0,transform:'translateY(-16px) scale(.98)'}],total*.85);
    return true;
  };
  return {ready,done:pop.done,node,update:pop.update};
}
// Colour families for statuses and callouts, read from their text (hero kits pass only the words).
function combatPopupTone(text){
  return /NĂNG LƯỢNG/i.test(text)?'energy':/GIÁP|MIỄN|TRƯỢT|^NÉ$/i.test(text)?'ward':/CHOÁNG|Choáng|ĐÓNG BĂNG|Đóng băng|PHONG ẤN|mất lượt/.test(text)?'control':/HỒI PHỤC|Hồi phục/.test(text)?'good':/KHẮC HỆ/.test(text)?'advantage':'';
}
// `away` used to move a callout off the attacker's lunge; callouts now live in the actor's column.
function popActorSkill(side,title,ultimate=false,pending,{away=false}={}){
  const pop=combatPopup(side,title,{kind:ultimate?'ultimate':'callout',tone:ultimate?'':combatPopupTone(title),beat:ultimate?850:540,pending});
  return pop.ready;
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
    if(side==='hero'&&foeSilenced()){message('Bị phong ấn: tuyệt kỹ chưa thể dùng.');continue;}
    state[key]-=100;update();
    if(side==='hero')await heroUltimate();else await enemySkill({reserved:true});
  }
}
function startReadyUltimates(){
  if(state.energy<100&&state.enemyEnergy<100)return;
  return perform(async()=>{await castReadyUltimates();return false;});
}
requestAnimationFrame(followCombatHeads);
