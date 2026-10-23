// Layered effects and rigid actor translations; authored frames carry each pose.
function mountShadowVeil(){
  const veil=document.createElement('span');veil.className='shadow-veil';veil.setAttribute('aria-hidden','true');
  veil.innerHTML=Array.from({length:5},(_,i)=>`<i style="--i:${i}"></i>`).join('');actor('hero').append(veil);
}
function bladeFacing(direction){
  const root=actor('hero'),sprite=root.querySelector('.sprite-body');root.dataset.facing=String(direction);
  sprite.style.scale=direction+' 1';updateActorHead(sprite,sprite.dataset.action,+sprite.dataset.frame);
}
function shadowEcho(x,y,pending,direction=1,delay=0){
  if(reduced)return;
  const root=actor('hero'),rect=root.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const node=document.createElement('span');node.className='shadow-afterimage';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x??rect.left-scene.left}px;top:${y??rect.top-scene.top}px;width:${rect.width}px;height:${rect.height}px`;
  const sprite=root.querySelector('.sprite-body').cloneNode(true);sprite.removeAttribute('role');sprite.removeAttribute('aria-label');node.append(sprite);$('combatEffects').append(node);
  pending.push(animate(node,[{opacity:.58,translate:'0 0'},{opacity:.3,translate:`${-direction*9}px -2px`,offset:.4},{opacity:0,translate:`${-direction*23}px -7px`}],{duration:380,delay,easing:'ease-out',fill:'both'}).finally(()=>node.remove()));
}
function shadowTransitEchoes(fromX,toX,pending){
  if(reduced)return;
  const rect=actor('hero').getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const count=actor('hero').classList.contains('shadow-burst')?8:3;
  for(let i=0;i<count;i++)shadowEcho(rect.left-scene.left+(toX-fromX)*i/count,rect.top-scene.top,pending,toX>fromX?1:-1,i*7);
}
function quickBladeCut(point,key,index,direction,pending){
  if(reduced)return;
  const color=combatV3Palette[key],size=Math.min(230,point.width*1.18),angle=index%2?-24:25;
  const node=combatV3Element('quick-blade-cut '+key,point,size,combatV3Svg('<path d="M9 138Q95 29 212 81Q119 49 9 138Z" fill="var(--combat-deep)" opacity=".8"/><path d="M12 129Q106 35 213 80Q117 57 12 129Z" fill="var(--combat-main)"/><path d="M17 120Q118 45 210 79Q121 64 17 120Z" fill="var(--combat-light)"/><path d="M28 112Q119 52 205 77" stroke="white" stroke-width="2" stroke-linecap="round"/>'),color);
  node.dataset.cutDirection=direction>0?'right':'left';node.dataset.cutIndex=index;
  pending.push(animate(node,[{opacity:0,transform:`translate(-50%,-50%) rotate(${angle-20}deg) scaleX(${direction*.5})`},{opacity:1,transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(${direction})`,offset:.2},{opacity:.85,offset:.5},{opacity:0,transform:`translate(calc(-50% + ${direction*22}px),-50%) rotate(${angle+15}deg) scaleX(${direction*1.12})`}],{duration:210,easing:'ease-out'}).finally(()=>node.remove()));
  for(let i=0;i<5;i++){
    const ember=combatV3Element('blade-ember '+key,{x:point.x,y:point.y},4+i%2*3,'',color);
    pending.push(animate(ember,[{opacity:.9,transform:'translate(-50%,-50%)'},{opacity:0,transform:`translate(${direction*(25+i*11)}px,${(i-2)*17}px) scale(.2)`}],{duration:290+i*15,easing:'ease-out'}).finally(()=>ember.remove()));
  }
}
// Six-star Noct is the Grim Reaper: scythe crescents, run-sheet glides and a soul harvest.
function reaperForm(){return state.key==='shadow'&&typeof combatHeroForm==='function'&&combatHeroForm('shadow')===3;}
function reaperDashFrame(i){setSpriteFrame('hero','run',i%6);}
function reaperCut(point,index,direction,pending,size=Math.min(250,point.width*1.3)){
  if(reduced)return;
  const angle=index%2?-38:32;
  const node=combatV3Element('reaper-cut',point,size,combatV3Svg('<path d="M24 172C30 82 98 22 196 30C122 46 66 98 52 178Z" fill="#07030e" opacity=".88"/><path d="M34 166C44 88 104 36 194 33C126 54 76 102 62 170Z" fill="#2a2a2e"/><path d="M48 158C62 94 112 48 192 36C132 62 92 104 78 160Z" fill="#9a9aa2" opacity=".7"/><path d="M60 150C76 100 118 58 190 38" stroke="#f2f2f4" stroke-width="2.4" stroke-linecap="round"/>'),combatV3Palette.shadow);
  node.dataset.cutDirection=direction>0?'right':'left';node.dataset.cutIndex=index;
  pending.push(animate(node,[{opacity:0,transform:`translate(-50%,-50%) rotate(${angle-55*direction}deg) scaleX(${direction})`},{opacity:1,transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(${direction})`,offset:.32},{opacity:.75,offset:.6},{opacity:0,transform:`translate(-50%,-50%) rotate(${angle+25*direction}deg) scaleX(${direction*1.08})`}],{duration:260,easing:'cubic-bezier(.2,.7,.3,1)'}).finally(()=>node.remove()));
}
// Hắc Liêm Đoạt Hồn finale: a pale soul is torn out of the target and drawn into the reaper,
// then one giant crescent falls across it. "ĐOẠT HỒN" marks the execute bonus (target under 30% HP).
function reaperHarvest(pending,executed){
  if(executed)popActorSkill('enemy','ĐOẠT HỒN',false,pending);
  if(reduced)return;
  const target=combatV3Point('enemy'),hero=combatV3Point('hero'),size=Math.min(320,target.width*1.7);
  const scythe=combatV3Element('reaper-cut reaper-finale',{x:target.x,y:target.y-target.height*.1},size,combatV3Svg('<path d="M16 96C40 30 130 6 206 46C140 34 70 52 40 118Z" fill="#05020b" opacity=".92"/><path d="M28 94C58 38 134 18 202 48C138 44 82 62 52 112Z" fill="#2e2e33"/><path d="M40 92C70 48 136 28 200 50" stroke="#f4f4f6" stroke-width="3" stroke-linecap="round"/>'),combatV3Palette.shadow);
  pending.push(animate(scythe,[{opacity:0,transform:'translate(-50%,-50%) rotate(-70deg) scale(.7)'},{opacity:1,transform:'translate(-50%,-50%) rotate(10deg) scale(1)',offset:.35},{opacity:.85,offset:.65},{opacity:0,transform:'translate(-50%,-38%) rotate(35deg) scale(1.08)'}],{duration:560,easing:'cubic-bezier(.3,.8,.3,1)'}).finally(()=>scythe.remove()));
  const soul=combatV3Element('reaper-soul',{x:target.x,y:target.y-target.height*.12},Math.min(70,target.width*.42),'<i></i>',combatV3Palette.shadow);
  const dx=hero.x-target.x,dy=(hero.y-hero.height*.18)-(target.y-target.height*.12);
  pending.push(animate(soul,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.25},{opacity:.95,transform:`translate(calc(-50% + ${dx*.45}px),calc(-50% + ${dy*.45-34}px)) scale(.85)`,offset:.6},{opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.25)`}],{duration:820,delay:180,easing:'ease-in-out',fill:'both'}).finally(()=>soul.remove()));
}
function bladeContact(raw,ledger,index,direction,critical,pending){
  const key=state.key,result=damage('hero',raw,ledger);
  combatVoice('enemy','hurt');combatV3HitSound(key,index===4);
  if(key==='shadow'&&!reduced){
    const pulse=combatV3Element('shadow-contact',combatV3Point('enemy'),85,'',combatV3Palette.shadow);
    pending.push(animate(pulse,[{opacity:.85,transform:'translate(-50%,-50%) scale(.4)'},{opacity:.6,transform:'translate(-50%,-50%) scale(.9)',offset:.25},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:240}).finally(()=>pulse.remove()));
  }else if(key!=='shadow')combatV3Impact('enemy',key,direction,index===4,pending);
  combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?(critical?'crit':'damage'):'armor',index,pending);
  hitAccents('hero',result,critical,pending);combatV3Camera(direction,index===4,false,pending);setSpriteAction('enemy','hurt',220);
  return result;
}
async function shadowAttack(raw,{hits=1,damageLedger=null,attackChain=1}={}){
  const root=actor('hero'),old=root.style.transform,oldZ=root.style.zIndex,pending=[];
  const from=combatV3Point('hero'),to=combatV3Point('enemy'),travel=Math.max(0,to.x-from.x-from.width*.25);
  const chain=Math.max(1,Math.floor(attackChain)),critical=chain>=3&&chain%3===0,reaper=reaperForm();
  raw*=attackChainMultiplier(chain)*(critical?1.5:1);hits=Math.max(1,Math.min(8,Math.round(hits)||1));
  const ledger=damageLedger||{raw:0,applied:0};let amount=0,blocked=0;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.attackChain=chain;root.dataset.attackStance='shadow-draw';
  try{
    combatVoice('hero','attack');playNoctSound('draw',{volume:.18});setSpriteFrame('hero','attack',0);await wait(70);
    if(reaper)reaperDashFrame(1);else setSpriteFrame('hero','cast',3);shadowTransitEchoes(0,travel,pending);playNoctSound('dash',{volume:.22,pan:.28});
    await animate(root,[{transform:old||'none'},{transform:`translateX(${travel}px)`}],{duration:120,easing:'cubic-bezier(.12,.8,.3,1)'});root.style.transform=`translateX(${travel}px)`;
    for(let i=0;i<hits;i++){
      const direction=i%2?-1:1;setSpriteFrame('hero','attack',i%2?3:2);
      if(reaper)reaperCut(combatV3Point('enemy'),i,direction,pending);else quickBladeCut(combatV3Point('enemy'),'shadow',i,direction,pending);combatV3Whoosh('shadow',critical,100);
      const result=bladeContact(raw/hits,ledger,i,direction,critical,pending);amount+=result.amount;blocked+=result.blocked;
      await wait(85);
    }
    if(reaper)reaperDashFrame(4);else setSpriteFrame('hero','cast',4);bladeFacing(-1);shadowTransitEchoes(travel,0,pending);
    await animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:180,easing:'ease-out'});root.style.transform=old;
    bladeFacing(1);setSpriteFrame('hero','attack',5);playNoctSound('sheath',{volume:.18});await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);root.style.transform=old;root.style.zIndex=oldZ;bladeFacing(1);delete root.dataset.facing;delete root.dataset.attackChain;delete root.dataset.attackStance;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
async function bladeRage(key,raw,onRelease=()=>{}){
  if(key==='shadow'&&reaperForm())return reaperVeilRage(raw,onRelease);
  const shadow=key==='shadow',root=actor('hero'),target=actor('enemy'),old=root.style.transform,oldZ=root.style.zIndex,pending=[];
  const from=combatV3Point('hero'),to=combatV3Point('enemy'),near=Math.max(0,to.x-from.x-from.width*.27),far=Math.min(to.x-from.x+32,$('scene').clientWidth-from.width*.44-from.x);
  const start=performance.now(),at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const move=async(x,duration)=>{const previous=root.style.transform||'none';await animate(root,[{transform:previous},{transform:`translateX(${x}px)`}],{duration,easing:'ease-in-out'});root.style.transform=`translateX(${x}px)`;};
  const ledger={raw:0,applied:0};let amount=0,blocked=0,currentX=0;
  const aura=document.createElement('span');aura.className='ultimate-aura rage-aura'+(shadow?' shadow-rage-aura':'');aura.style.setProperty('--aura-color',combatV3Palette[key].main);aura.innerHTML='<i class="aura-halo"></i><i class="aura-ring"></i>';root.append(aura);
  root.classList.add('combat-v3-acting','charging-ultimate');root.style.zIndex='4';root.dataset.ragePhase='chant';
  try{
    combatVoice('hero','cast');combatV3ChargeSound(key,true);popActorSkill('hero',HEROES[key].skill,true,pending);
    pending.push(animate(aura,[{opacity:0,transform:'scale(.5)'},{opacity:.95,transform:'scale(1)',offset:.65},{opacity:0,transform:'scale(1.25)'}],{duration:1100}).finally(()=>aura.remove()));
    setSpriteFrame('hero','cast',0);await at(300);setSpriteFrame('hero','cast',1);await at(shadow?550:650);setSpriteFrame('hero','cast',2);
    if(shadow){root.dataset.ragePhase='slow-glide';setSpriteFrame('hero','cast',3);await move(near*.55,800);currentX=near*.55;}
    else{await at(1000);root.dataset.ragePhase='lunge';setSpriteFrame('hero','attack',1);await move(near,350);currentX=near;}
    root.classList.remove('charging-ultimate');aura.remove();
    if(shadow)root.classList.add('shadow-burst');
    const times=shadow?[1560,1740,1920,2100,2280]:[1600,1730,1860,1990,2120,2250];
    for(let i=0;i<times.length;i++){
      await at(times[i]-(shadow?110:55));root.dataset.ragePhase=shadow?'shadow-dash':'rapid-slash';root.dataset.rageHit=String(i+1);
      const direction=i%2?-1:1,endX=shadow?(direction>0?far:near):near+(direction>0?5:-5);
      if(shadow){bladeFacing(direction);setSpriteFrame('hero','cast',4);shadowTransitEchoes(currentX,endX,pending);playNoctSound('dash',{volume:.18,pan:direction*.35});}
      else setSpriteFrame('hero','attack',i%2?4:1);
      combatV3Whoosh(key,true,110);await move(endX,shadow?110:55);currentX=endX;
      setSpriteFrame('hero','attack',shadow?2:[3,2,4,3,2,4][i]);root.dataset.ragePhase='impact';
      if(i===0)combatVoice('hero','release');
      quickBladeCut(combatV3Point('enemy'),key,i,direction,pending);
      if(shadow)shadowEcho(null,null,pending,direction);
      const result=bladeContact(raw/times.length,ledger,i,direction,false,pending);amount+=result.amount;blocked+=result.blocked;
      if(i===times.length-1){onRelease(pending);update();}
    }
    await at(2450);root.dataset.ragePhase='recover';root.classList.remove('shadow-burst');
    if(shadow){setSpriteFrame('hero','cast',4);bladeFacing(-1);shadowTransitEchoes(currentX,0,pending);}else setSpriteFrame('hero','attack',5);
    await move(0,350);root.style.transform=old;bladeFacing(1);setSpriteFrame('hero',shadow?'cast':'attack',5);if(shadow)playNoctSound('sheath',{volume:.24});
    await at(3000);await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);aura.remove();root.style.transform=old;root.style.zIndex=oldZ;bladeFacing(1);delete root.dataset.facing;delete root.dataset.ragePhase;delete root.dataset.rageHit;root.classList.remove('combat-v3-acting','charging-ultimate','shadow-burst');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
// Hắc Liêm Đoạt Hồn (six-star Noct): an outstretched hand smothers the foe in cursed fog, the
// reaper vanishes, nine unseen scythe cuts (two of them hooks that rip the foe upward) land
// inside the fog, the soul is harvested, and Noct returns veiled (the veil itself is rules-side).
function reaperFx(name,point,size,{rotate=0,flip=1,loop=false}={}){
  const sheet=ART.reaperFx?.[name];if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='reaper-fx reaper-fx-'+name+(name==='mist'?' reaper-mist':'');node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size}px;height:${size}px;--fx-count:${sheet.count};background-image:url('${sheet.src}');transform:rotate(${rotate}deg) scaleX(${flip})`;
  $('combatEffects').append(node);
  const frames=animate(node,[{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0'}],{duration:sheet.count*sheet.frameDuration,easing:`steps(${sheet.count},jump-none)`,iterations:loop?Infinity:1});
  if(!loop)frames.finally(()=>node.remove());
  return node;
}
// A cut parts every fog layer along the blade's line for a moment, then the fog closes again.
const FOGCUT_BASE=-28;// chord of the fogcut crescent, drawn lower-left up to the right
// Volumetric smoke: dozens of soft photographic puffs (assets/fx/noct/puffs) layered over a dark
// core, each one slowly billowing, rolling, swelling and drifting on its own clock, so the fog
// churns like real smoke instead of looping one painted shape.
function reaperSmoke(box){
  const sheet=ART.reaperFx?.puffs;if(!sheet||reduced)return null;
  // The element is padded well beyond the smoke so the cut mask never squares off its edges.
  const unit=Math.min(box.w,box.h),pad=unit*.45,W=box.w+pad*2,H=box.h+pad*2;
  const cloud=document.createElement('span');cloud.className='reaper-smoke';cloud.setAttribute('aria-hidden','true');
  cloud.style.cssText=`left:${box.x-pad}px;top:${box.y-pad}px;width:${W}px;height:${H}px;--puffs:url('${sheet.src}')`;
  const rnd=(a,b)=>a+Math.random()*(b-a),puffs=[];
  // Rows from the ground up: wide low banks, a dense body, smaller rising crowns. Every puff,
  // at its largest swell and drift, stays inside the box (a masked box clips its children).
  const rows=[[.9,8,.36,.46],[.72,8,.34,.44],[.52,7,.32,.42],[.32,7,.28,.36],[.17,5,.17,.23]];
  for(const [yy,count,min,max] of rows)for(let i=0;i<count;i++){
    const size=rnd(min,max)*unit,reach=size*.5*1.3+unit*.06,dx=rnd(-.05,.05)*unit,dy=-rnd(.02,.07)*unit;
    const x=pad+Math.max(reach-pad,Math.min(box.w-reach+pad,((i+.5)/count+rnd(-.05,.05))*box.w));
    const y=pad+Math.max(reach-dy-pad,Math.min(box.h-reach+pad,(yy+rnd(-.04,.04))*box.h));
    puffs.push(`<i style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;--cell:${Math.floor(Math.random()*4)};--flip:${Math.random()<.5?-1:1};--r0:${rnd(-30,30)}deg;--r1:${rnd(-70,70)}deg;--s0:${rnd(.75,.92)};--s1:${rnd(1.08,1.3)};--dx:${dx}px;--dy:${dy}px;--dur:${rnd(2.4,4.2)}s;--delay:${-rnd(0,4)}s;--o:${rnd(.8,1)}"></i>`);
  }
  cloud.innerHTML=`<b class="smoke-core"></b>`+puffs.join('');
  $('combatEffects').append(cloud);return cloud;
}
function reaperFogGap(fogs,spot,angle,pending){
  if(reduced)return;
  const theta=angle*Math.PI/180,dir=[Math.sin(theta),-Math.cos(theta)];
  for(const fog of fogs){
    if(!fog?.isConnected)continue;
    const box=fog.getBoundingClientRect(),scene=$('scene').getBoundingClientRect(),cx=box.left-scene.left+box.width/2,cy=box.top-scene.top+box.height/2;
    const span=Math.abs(box.width*dir[0])+Math.abs(box.height*dir[1]),at=50+((spot.x-cx)*dir[0]+(spot.y-cy)*dir[1])/span*100;
    const mask=gap=>gap?`linear-gradient(${angle}deg,#000 0 ${at-gap}%,transparent ${at-gap/3}% ${at+gap/3}%,#000 ${at+gap}% 100%)`:'none';
    [[0,4.5],[90,3],[180,1.6],[260,0]].forEach(([delay,gap])=>pending.push(wait(delay).then(()=>{if(fog.isConnected){fog.style.maskImage=mask(gap);fog.style.webkitMaskImage=mask(gap);}})));
  }
}
async function reaperVeilRage(raw,onRelease){
  const root=actor('hero'),target=actor('enemy'),pending=[],ledger={raw:0,applied:0},hits=9,hooks=new Set([3,7]);
  const start=performance.now(),at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  // The fog's flat base (88% of its cell) sinks below the boots and the dome clears the head and wings.
  const enemy=combatV3Point('enemy'),scene=$('scene').getBoundingClientRect(),body=target.getBoundingClientRect();
  const feet=body.bottom-scene.top-body.height*(1-(Number(getComputedStyle(target).getPropertyValue('--foot-y'))||.94));
  const fogSize=Math.max(body.width,body.height)*1.25,fogPoint={x:body.left-scene.left+body.width/2-fogSize*.08,y:feet+fogSize*.06-fogSize*.38};// foes face left: lean the dome toward the head
  // The smoke box covers the foe's whole sprite with margin, its floor just below the feet.
  const smokeBox={w:Math.max(body.width*1.12,fogSize*.75),h:Math.max(body.height*.95,fogSize*.72)};smokeBox.x=fogPoint.x-smokeBox.w*.54;smokeBox.y=feet+smokeBox.h*.1-smokeBox.h;
  let amount=0,blocked=0,mist=null,ground=null;
  root.classList.add('combat-v3-acting');root.dataset.ragePhase='chant';
  try{
    combatVoice('hero','cast');playNoctSound('charge',{volume:.26});popActorSkill('hero',HEROES.shadow.skill,true,pending);
    setSpriteFrame('hero','cast',0);await at(260);setSpriteFrame('hero','cast',2);await at(460);
    root.dataset.ragePhase='smother';setSpriteFrame('hero','cast',3);playNoctSound('mist',{volume:.4,pan:.3});
    mist=reaperSmoke(smokeBox);
    if(mist)pending.push(animate(mist,[{opacity:0,scale:'.35 .2',translate:`${-smokeBox.w*.35}px 0`},{opacity:1,scale:'1 1',translate:'0 0'}],{duration:620,easing:'cubic-bezier(.2,.8,.3,1)'}));
    target.classList.add('reaper-smothered');
    await at(900);setSpriteFrame('hero','cast',4);
    root.dataset.ragePhase='vanish';shadowEcho(null,null,pending,1);
    await animate(root,[{opacity:1},{opacity:0}],{duration:reduced?1:220});root.style.opacity='0';
    for(let i=0;i<hits;i++){
      await at(1150+i*165);root.dataset.rageHit=String(i+1);
      const hook=hooks.has(i),direction=i%2?-1:1,last=i===hits-1;
      if(hook){
        reaperFx('hook',{x:enemy.x,y:enemy.y-enemy.height*.05},enemy.width*1.15);playNoctSound('hook',{volume:.36,pan:.3});
        if(!reduced)pending.push(animate(target,[{translate:'0 0'},{translate:'0 -34px',offset:.35},{translate:'0 -30px',offset:.6},{translate:'0 0'}],{duration:420,easing:'cubic-bezier(.2,.9,.4,1)'}));
      }else{
        // Scythe crescents about half the smoke's size, landing anywhere on the shrouded body.
        const unit=Math.min(smokeBox.w,smokeBox.h),spot={x:smokeBox.x+smokeBox.w*(.3+Math.random()*.4),y:smokeBox.y+smokeBox.h*(.3+Math.random()*.4)},rotate=-40+Math.random()*80;
        reaperFx('fogcut',spot,unit*(.5+Math.random()*.14),{rotate,flip:direction});
        reaperFogGap([mist,ground],spot,direction>0?FOGCUT_BASE+rotate:-FOGCUT_BASE+rotate,pending);
        playNoctSound('slash'+(1+i%3),{volume:.24,pan:.3});
      }
      const kit=last&&progressionBattle?progressionKit():null,executed=!!kit?.execute&&state.enemyHp<state.enemyMax*kit.execute.threshold;
      const result=bladeContact(raw/hits,ledger,i,direction,false,pending);amount+=result.amount;blocked+=result.blocked;
      if(last){reaperHarvest(pending,executed);onRelease(pending);update();}
    }
    await at(2750);root.dataset.ragePhase='return';
    for(const fog of [mist,ground])if(fog){fog.style.opacity='0';pending.push(animate(fog,[{opacity:1},{opacity:0,scale:1.15}],{duration:380}).finally(()=>fog.remove()));}
    target.classList.remove('reaper-smothered');
    setSpriteAction('hero','idle');playNoctSound('veil',{volume:.22});
    await animate(root,[{opacity:0},{opacity:1}],{duration:reduced?1:320});root.style.opacity='';
    await at(3200);await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);mist?.remove();ground?.remove();target.classList.remove('reaper-smothered');
    root.style.opacity='';
    delete root.dataset.ragePhase;delete root.dataset.rageHit;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
async function departShadowHero(){
  const root=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children],pending=[];root.dataset.departing='true';
  try{
    setSpriteFrame('hero','hover',0);
    await animate(root,[{transform:'translateY(0px)'},{transform:'translateY(-12px)'}],{duration:reduced?1:260,easing:'ease-out'});
    const start=performance.now(),duration=reduced?1:2400;let lastEcho=0;
    await new Promise(resolve=>{
      function tick(now){
        const p=Math.min(1,(now-start)/duration),camera=width*.95*p;
        root.style.transform=`translate(${width*1.65*p-camera}px,${-12-Math.sin(p*Math.PI*3)*2}px)`;root.dataset.worldX=String(width*1.65*p);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','hover',Math.floor((now-start)/180)%6);
        if(now-lastEcho>320){shadowEcho(null,null,pending);lastEcho=now;}
        layers.forEach(layer=>layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`);
        if(p<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    await animate(root,[{opacity:1},{opacity:0}],{duration:180});root.style.opacity='0';await Promise.all(pending);
  }finally{delete root.dataset.departing;delete root.dataset.worldX;root.style.transform='';setSpriteAction('hero','idle');}
}
// A stream of overlapping curved, feathered plumes instead of a rigid polygon.
combatV3Breath=function(sourcePoint,targetPoint,ultimate,pending){
  if(reduced)return;
  const direction=targetPoint.x>sourcePoint.x?1:-1,frame=+actor('enemy').querySelector('.sprite-body').dataset.frame;
  const mouth=[[54,154],[66,181],[47,168],[42,162],[60,166],[65,153]][frame]||[44,162];
  const start={x:sourcePoint.x-sourcePoint.width*.5+sourcePoint.width*mouth[0]/256,y:sourcePoint.y-sourcePoint.height*.62+sourcePoint.height*mouth[1]/256};
  const dx=targetPoint.x-start.x,dy=targetPoint.y-start.y,count=ultimate?24:15;
  for(let i=0;i<count;i++){
    const lane=(i%5-2)/2,size=(ultimate?44:32)+i%3*7;
    const node=combatV3Element('dragon-flame-plume',start,size,'',combatV3Palette.fire);node.dataset.flameLayer=i%3;
    const angle=Math.atan2(dy,dx)*180/Math.PI;
    const pose=(p,scale)=>`translate(calc(-50% + ${dx*p}px),calc(-50% + ${dy*p+Math.sin(p*Math.PI*1.5+i*.65)*lane*(ultimate?22:14)*p}px)) rotate(${angle+Math.sin(p*5+i)*15}deg) scale(${scale*1.8},${scale*.7})`;
    pending.push(animate(node,[{opacity:0,transform:pose(0,.15)},{opacity:.6,transform:pose(.15,.4),offset:.13},{opacity:.65,transform:pose(.6,.8),offset:.5},{opacity:.4,transform:pose(1,1.15),offset:.8},{opacity:0,transform:pose(1.18,1.5)}],{duration:ultimate?540:390,delay:i*(ultimate?12:10),easing:'linear'}).finally(()=>node.remove()));
  }
  for(let i=0;i<8;i++){
    const node=combatV3Element('dragon-flame-ember',start,3+i%3,'',combatV3Palette.fire);
    pending.push(animate(node,[{opacity:0,transform:'translate(-50%,-50%)'},{opacity:.9,offset:.2},{opacity:0,transform:`translate(${dx*(.8+i%3*.13)}px,${dy-22-i*7}px) scale(.1)`}],{duration:520,delay:i*28,easing:'ease-out'}).finally(()=>node.remove()));
  }
};
rageSkyfall=function(side,key,pending){
  if(reduced)return;
  const target=combatV3Point(side==='hero'?'enemy':'hero'),top=-Math.max(180,$('scene').clientHeight*.65),height=target.y-top+30;
  const node=document.createElement('span');node.className='rage-skyfall '+key;node.dataset.skyOrigin=String(top);node.style.cssText=`left:${target.x}px;top:${top}px;height:${height}px;--rage-color:${combatV3Palette[key].main}`;
  node.innerHTML='<i></i><b></b><em></em>';$('combatEffects').append(node);
  pending.push(animate(node,[{opacity:0,transform:`translate(-50%,${-height}px)`},{opacity:1,offset:.12},{opacity:1,transform:'translate(-50%,0)',offset:.56},{opacity:.9,offset:.78},{opacity:0,transform:'translate(-50%,8px)'}],{duration:650,easing:'cubic-bezier(.3,0,.75,1)'}).finally(()=>node.remove()));
};
