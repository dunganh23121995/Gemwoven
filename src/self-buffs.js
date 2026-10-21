// Actor-local spirals: back strands pass behind the body, front strands over it.
// Cosmetic motion uses deterministic phases, never the board's random stream.
const selfBuffJobs=new Map();
const selfBuffColors={fire:[255,187,113],earth:[124,237,164],ice:[161,235,255],lightning:[203,177,255],shadow:[148,201,224],novice:[194,174,139]};
function createSelfBuffFlow(kind,{persistent=false,duration=950}={}){
  const root=actor('hero'),key=state.key,field=document.createElement('span'),back=document.createElement('canvas'),front=document.createElement('canvas');
  field.className='restoration-field self-buff-flow';field.dataset.buffKind=kind;
  if(persistent)field.dataset.regeneration='true';
  field.setAttribute('aria-hidden','true');back.setAttribute('aria-hidden','true');
  back.className='self-buff-back';field.append(front);root.prepend(back);root.append(field);
  const contexts=[back,front].map(canvas=>{canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.scale(2,2);return c;});
  const color=kind==='heal'?[113,244,165]:selfBuffColors[key],start=performance.now();
  let stopped=false,request=0,last=0;
  const rgba=(a,white=false)=>`rgba(${white?'228,255,241':color.join(',')},${a})`;
  function stop(){if(stopped)return;stopped=true;cancelAnimationFrame(request);field.remove();back.remove();}
  function draw(now){
    if(stopped)return;
    if(!field.isConnected||root!==actor('hero')||state.key!==key||state.hp<=0||ended||reduced){stop();return;}
    request=requestAnimationFrame(draw);if(document.hidden||now-last<30)return;last=now;
    const elapsed=now-start,fade=persistent?Math.min(1,elapsed/250):Math.min(1,elapsed/130,Math.max(0,(duration-elapsed)/220));
    for(const c of contexts)c.clearRect(0,0,256,256);
    const sprite=root.querySelector('.sprite-body'),def=spriteDefinition('hero',key,sprite?.dataset.action||'idle').sheet;
    const head=def.heads?.[Number(sprite?.dataset.frame)||0]?.[1]??90;
    const top=Math.max(45,head-8),rise=242-top;
    const position=(t,phase)=>{const a=t*Math.PI*4+phase;return {x:128+Math.cos(a)*(51-t*15),y:242-t*rise,z:Math.sin(a)};};
    // Short tapered ribbon trails, not solid rings or a large icon.
    for(let strand=0;strand<3;strand++){
      const lead=(elapsed/1900+strand/3)%1,phase=strand*2.1+elapsed*.00035;
      for(let j=0;j<40;j++){
        const t=lead-j*.009;if(t<0)break;
        const a=position(t,phase),b=position(Math.max(0,t-.009),phase),frontSide=a.z>0;
        const c=contexts[frontSide?1:0],alpha=fade*(1-j/40)*Math.sin(Math.PI*t)*(frontSide?.85:.45);
        c.lineCap='round';c.lineWidth=1.4+(1-j/40)*1.8;c.strokeStyle=rgba(alpha);c.shadowColor=rgba(.8);c.shadowBlur=7;
        c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
      }
    }
    const count=persistent?42:36;
    for(let i=0;i<count;i++){
      const t=(elapsed/(1550+i%5*140)+i/count)%1,p=position(t,i*2.39996),frontSide=p.z>0;
      p.x+=Math.sin(i*12.1)*8;
      const c=contexts[frontSide?1:0],alpha=fade*Math.pow(Math.sin(Math.PI*t),.8)*(frontSide?.9:.4);
      c.shadowColor=rgba(.9);c.shadowBlur=7;c.fillStyle=rgba(alpha,i%4===0);
      c.beginPath();c.ellipse(p.x,p.y,1.1+i%3*.4,1.3+i%3*.5,0,0,Math.PI*2);c.fill();
    }
  }
  request=requestAnimationFrame(draw);
  return {field,stop};
}
function selfBuffSpiral(kind,duration=950){
  if(reduced||state.hp<=0)return Promise.resolve();
  if(selfBuffJobs.has(kind))return selfBuffJobs.get(kind);
  const flow=createSelfBuffFlow(kind,{duration});
  const job=animate(flow.field,[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.75},{opacity:0}],{duration,easing:'linear'})
    .finally(()=>{flow.stop();if(selfBuffJobs.get(kind)===job)selfBuffJobs.delete(kind);});
  selfBuffJobs.set(kind,job);return job;
}
const originalSelfRestoration=restorationEffect;
restorationEffect=function(side,kind){
  if(side!=='hero')return originalSelfRestoration(side,kind);
  return selfBuffSpiral(kind);
};

// Shield sockets are local to the authored 256px body frames; actor movement
// carries both the shield and its light, including the shield-rush ultimate.
const NORI_SHIELD_SOCKETS={
  idle:[[148,189,53,108,0],[148,189,53,108,0],[149,190,53,108,-2],[148,190,53,108,-2]],
  attack:[[146,189,48,106,0],[146,189,48,106,-2],[149,187,48,105,-10],[145,185,44,93,-13],[144,193,40,84,-19],[146,189,48,106,0]],
  cast:[[148,183,45,108,0],[157,188,43,108,0],[160,188,43,108,0],[158,184,44,110,0],[157,185,44,110,0],[148,183,45,108,0]],
  hurt:[[147,186,49,108,0],[150,182,48,108,-10],[148,190,48,108,-10],[149,191,48,108,-10],[151,187,47,108,0],[151,185,47,108,-8]],
  buff:[[143,189,50,108,-8],[144,187,50,108,-8],[143,189,52,108,-14],[148,186,46,108,0],[146,193,46,102,-8],[149,188,46,108,-5]],
  smash:[[142,189,45,108,-5],[146,189,45,108,-10],[151,187,45,108,-7],null,null,[147,190,45,108,-7]]
};
function updateNoriShieldAura(sprite){
  const root=sprite.parentElement;if(!root?.classList.contains('actor'))return;
  let aura=root.querySelector('.nori-shield-aura');
  const action=spriteDefinition('hero','earth',sprite.dataset.action).action;
  const pin=NORI_SHIELD_SOCKETS[action]?.[Number(sprite.dataset.frame)||0];
  if(!pin||state.hp<=0||reduced){if(aura)aura.hidden=true;return;}
  if(!aura){aura=document.createElement('span');aura.className='nori-shield-aura';aura.setAttribute('aria-hidden','true');aura.innerHTML='<i></i><b></b><em></em>';root.append(aura);}
  aura.hidden=false;
  const socket=action+':'+sprite.dataset.frame;
  if(aura.dataset.socket===socket)return;aura.dataset.socket=socket;
  const [x,y,w,h,angle]=pin;
  aura.style.left=x/256*100+'%';aura.style.top=y/256*100+'%';
  aura.style.width=w/256*100+'%';aura.style.height=h/256*100+'%';aura.style.rotate=angle+'deg';
}
let noriRenewalFlow=null;
function clearNoriRenewal(){noriRenewalFlow?.stop();noriRenewalFlow=null;delete actor('hero').dataset.regenTurns;}
function syncNoriRenewal(){
  const active=state.key==='earth'&&state.noriRegenTurns>0&&state.hp>0&&state.enemyHp>0&&!ended;
  if(!active){clearNoriRenewal();return;}
  actor('hero').dataset.regenTurns=String(state.noriRegenTurns);
  if(reduced){noriRenewalFlow?.stop();noriRenewalFlow=null;return;}
  if(!noriRenewalFlow?.field.isConnected)noriRenewalFlow=createSelfBuffFlow('heal',{persistent:true});
}
const originalBuffUpdate=update;
update=function(){originalBuffUpdate();syncNoriRenewal();syncNoriDamageSeal();};
const originalBuffSettings=updateSettings;
updateSettings=function(){originalBuffSettings();syncNoriRenewal();};

async function noriRenewalUltimate(){
  if(state.hp<=0)return;
  const audio=combatV3AudioContext();if(audio)decodeCastSound(audio,'earth-shield-bash').catch(()=>{});
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),old=root.style.transform,oldTarget=target.style.transform,oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  root.dataset.ragePhase='chant';root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    combatVoice('hero','cast');playCastSound('earth','charge',{volume:.2});
    popActorSkill('hero',HEROES.earth.skill,true,pending);
    pending.push(selfBuffSpiral('heal',1250));
    setSpriteFrame('hero','cast',0);await at(350);setSpriteFrame('hero','cast',1);
    await at(750);setSpriteFrame('hero','cast',2);await at(1200);setSpriteFrame('hero','cast',3);
    root.dataset.ragePhase='shield-rush';
    const from=combatV3Point('hero'),to=combatV3Point('enemy'),travel=Math.max(0,to.x-from.x-from.width*.42);
    pending.push(animate(root,[{transform:old||'none'},{transform:`translate(${travel}px,0px)`}],{duration:350,easing:'cubic-bezier(.5,0,.2,1)'}));
    root.style.transform=`translate(${travel}px,0px)`;playCastSound('earth','launch',{volume:.22});
    await at(1550);root.dataset.ragePhase='renewal';setSpriteFrame('hero','cast',4);
    if(state.enemyHp>0){
      state.noriStunTurns=kit.stun;state.noriStoredDamage=state.noriStoredDamage||0;state.stunned=true;setSpriteAction('enemy','hurt',330);combatVoice('enemy','hurt');
      playCastSound('earth','shield-bash',{volume:.62,pan:.2});popActorSkill('enemy','CHOÁNG · '+kit.stun+' LƯỢT',false,pending);
      castFx('earth','bloom',combatV3Point('enemy'),90,'',300,pending);
      combatV3Camera(1,true,false,pending);
      pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(12px,-2px) rotate(4deg)',offset:.25},{transform:oldTarget||'none'}],{duration:330,easing:'ease-out'}));
    }
    state.noriRegenTurns=kit.regenTurns;update();combatVoice('hero','release');combatV3BuffSound('heal');
    popActorSkill('hero','Hồi phục · '+kit.regenTurns+' lượt',false,pending);
    await at(2450);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',5);
    pending.push(animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:400,easing:'ease-in-out'}));root.style.transform=old;
    await at(3000);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{await Promise.allSettled(pending);delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting');root.style.transform=old;root.style.zIndex=oldZ;target.style.transform=oldTarget;setSpriteAction('hero','idle');setSpriteAction('enemy','idle');}
}
async function tickNoriRenewal(){
  if(state.key!=='earth'||!(state.noriRegenTurns>0)||state.hp<=0||state.enemyHp<=0||ended)return;
  // One pulse at the beginning of the next player turn, even if the enemy skipped.
  // Refreshing the skill replaces the remaining duration; it never stacks ticks.
  state.noriRegenTurns--;
  const gained=Math.max(0,Math.min(progressionHeal(progressionKit('earth').heal),HEROES.earth.hp-state.hp));state.hp+=gained;
  update();const pending=[];
  if(gained){combatV3BuffSound('heal');combatV3Number('hero','+'+gained+' HP','heal',0,pending);}
  if(!state.noriRegenTurns)pending.push(selfBuffSpiral('heal',650));
  await Promise.all(pending);
}
function syncNoriDamageSeal(){
  const target=actor('enemy');let seal=target.querySelector('.nori-damage-seal');
  if(state.key!=='earth'||state.hp<=0||state.enemyHp<=0||ended){
    if(state.noriStunTurns>0)state.stunned=false;
    state.noriStunTurns=0;state.noriStoredDamage=0;
  }
  if(!(state.noriStunTurns>0)){seal?.remove();return;}
  if(!seal){seal=document.createElement('span');seal.className='nori-damage-seal';seal.setAttribute('aria-hidden','true');seal.innerHTML='<i></i><b></b>';target.append(seal);}
  seal.style.setProperty('--seal-power',String(Math.min(1,(state.noriStoredDamage||0)/100)));
  const burst=progressionKit('earth').burst,times='×'+burst.toLocaleString('vi-VN');
  seal.querySelector('b').textContent='TÍCH '+(state.noriStoredDamage||0)+' '+times;
  const status=document.createElement('span');status.className='status-pill nori-seal-status';status.textContent=state.noriStunTurns+' lượt';status.title='Choáng của Nori · hết choáng nổ '+times+' sát thương tích trữ';
  $('enemyStatuses').append(status);
}
async function consumeNoriStunTurn(){
  const remaining=state.noriStunTurns;
  const pending=[];popActorSkill('enemy','CHOÁNG · '+remaining+' LƯỢT',false,pending);
  await Promise.all(pending);
  state.noriStunTurns=Math.max(0,remaining-1);state.stunned=state.noriStunTurns>0;state.frozen=false;
  if(state.noriStunTurns>0){update();return;}
  // Store post-element/critical damage before armor. Apply armor exactly once
  // to the burst, without multiplying elemental or Nori's base damage again.
  const stored=state.noriStoredDamage||0,burst=progressionKit('earth').burst,total=Math.round(stored*burst),times='×'+burst.toLocaleString('vi-VN');state.noriStoredDamage=0;update();
  if(!stored||state.enemyHp<=0||state.hp<=0)return;
  const target=actor('enemy'),jobs=[],point=combatV3Point('enemy');
  const flare=castFx('earth','seal-burst',point,150,'',650,jobs,[
    {opacity:0,transform:'translate(-50%,-50%) scale(.2)'},
    {opacity:1,transform:'translate(-50%,-50%) scale(.6)',offset:.25},
    {opacity:.9,transform:'translate(-50%,-50%) scale(1.3)',offset:.4},
    {opacity:0,transform:'translate(-50%,-50%) scale(2)'}
  ]);
  if(flare)flare.dataset.stored=String(stored);
  await wait(reduced?0:160);
  const result=applyCombatDamage('enemy',total);
  playCastSound('earth','finish',{volume:.34});if(state.enemyHp>0)combatVoice('enemy','hurt');
  popActorSkill('enemy','BỘC PHÁ '+times,true,jobs);
  combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',0,jobs);
  castScatter('earth',point,true,jobs);combatV3Camera(1,true,false,jobs);setSpriteAction('enemy','hurt',400);
  const old=target.style.transform;
  jobs.push(animate(target,[{transform:old||'none'},{transform:'translate(9px,-5px) rotate(4deg)',offset:.2},{transform:old||'none'}],{duration:400}));
  try{await Promise.all(jobs);}finally{target.style.transform=old;setSpriteAction('enemy','idle');}
  message('Mộc Linh bộc phá: '+stored+' '+times+' = '+total+' sát thương'+(result.blocked?' · chặn '+result.blocked+' bởi giáp':'')+'.');
}
const originalRenewalEnemyAction=enemyAction;
enemyAction=async function(){
  if(state.hp<=0||state.enemyHp<=0)return;
  await originalRenewalEnemyAction();
  if(state.hp>0&&state.enemyHp>0){turn='player';await tickNoriRenewal();}
};
