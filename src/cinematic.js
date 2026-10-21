const receivingLoot=new Map();
function combatLootReceive(side,type){
  if(reduced)return Promise.resolve();
  if(type===1||type===4)return restorationEffect(side,type===1?'heal':'armor');
  const id=side+':'+type;if(receivingLoot.has(id))return receivingLoot.get(id);
  const node=document.createElement('span'),color=boardV3Color({type});node.className='loot-reception loot-'+itemNames[type];node.dataset.lootType=type;
  node.style.setProperty('--loot-color',color);
  node.innerHTML=`<i class="loot-seal"></i><img class="loot-token" src="${itemImage(type)}" alt="">`+Array.from({length:8},(_,i)=>`<b style="--angle:${i*45}deg;--distance:${30+i%3*9}px"></b>`).join('');
  actor(side).append(node);
  const jobs=[animate(node.querySelector('.loot-token'),[{opacity:0,transform:'translate(-50%,65px) scale(.55)'},{opacity:1,transform:'translate(-50%,10px) scale(1.1)',offset:.35},{opacity:.8,transform:'translate(-50%,-8px) scale(.75)',offset:.65},{opacity:0,transform:'translate(-50%,-20px) scale(.15)'}],{duration:580,easing:'ease-out'})];
  jobs.push(animate(node.querySelector('.loot-seal'),[{opacity:0,transform:'scale(.25) rotate(-30deg)'},{opacity:.85,transform:'scale(1) rotate(0deg)',offset:.35},{opacity:0,transform:'scale(1.4) rotate(25deg)'}],{duration:680}));
  for(const [i,mote]of [...node.querySelectorAll('b')].entries())jobs.push(animate(mote,[{opacity:0,transform:`rotate(${i*45}deg) translateY(12px) scale(.3)`},{opacity:1,transform:`rotate(${i*45+25}deg) translateY(38px) scale(1)`,offset:.35},{opacity:0,transform:`rotate(${i*45+65}deg) translateY(58px) scale(.2)`}],{duration:640,easing:'ease-out'}));
  const job=Promise.all(jobs).finally(()=>{node.remove();receivingLoot.delete(id);});receivingLoot.set(id,job);return job;
}
function hitAccents(side,result,critical,pending){
  const target=side==='hero'?'enemy':'hero',attacker=side==='hero'?state.key:state.enemyKey,defender=side==='hero'?state.enemyKey:state.key;
  // Callouts go to the far side of the target, away from the attacker's lunge.
  if(critical)popActorSkill(target,'CHÍ MẠNG!',true,pending,{away:true});
  else if(mult(attacker,defender)>1)popActorSkill(target,'KHẮC HỆ ×1,5',false,pending,{away:true});
}
function boardItemRecoil(center,strength=2){
  if(reduced)return Promise.resolve();
  const jobs=[];
  for(const tile of all()){
    if(tile.el.dataset.clearing==='true')continue;
    const distance=Math.hypot(tile.r-center.r,tile.c-center.c);if(distance>5)continue;
    const item=tile.el.querySelector('.item-art');if(!item)continue;
    // Animate the art, not the gem/tile transforms used by dissolve and gravity.
    const power=Math.max(.7,(strength+2)*(1-distance/6)),sign=tile.c<center.c?-1:1;
    jobs.push(animate(item,[{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${sign*power}px,${-power*.6}px) rotate(${sign*power*1.3}deg)`,offset:.25},{transform:`translate(${-sign*power*.6}px,${power*.35}px) rotate(${-sign*power*.8}deg)`,offset:.55},{transform:'translate(0,0) rotate(0deg)'}],{duration:300,delay:distance*22,easing:'ease-out'}));
  }return Promise.all(jobs);
}
function specialStarNova(tile,kind){
  if(reduced)return Promise.resolve();
  const p=boardV3Point(tile),g=boardV3Group('special-nova',tile,kind),tier={bolt:0,bomb:1,core:2}[kind]||0;
  const colors=kind==='core'?boardV4Prism:[boardV3Color(tile),'#fff2ad','#d6ecff','#e0bbff'];
  const jobs=[],glow=boardV6Gradient(g,[['#fffced',1],[colors[0],.7],[colors[0],0]],true);
  const flash=boardV3Child(g,'circle',{cx:p.x,cy:p.y,r:100+tier*30,fill:glow});boardV3Origin(flash,p.x,p.y);
  jobs.push(animate(flash,[{opacity:1,transform:'scale(.45)'},{opacity:.95,transform:'scale(1.15)',offset:.18},{opacity:.35,offset:.45},{opacity:0,transform:'scale(1.8)'}],{duration:800}));
  for(let i=0;i<24+tier*8;i++){
    const angle=i*2.39996,distance=140+tier*55+(i%4)*25,s=boardV3Child(g,'g',{'data-nova-star':i});
    boardV9Star(s,0,0,9+i%3*4,colors[i%colors.length]);boardV9Star(s,0,0,4,'#fffef4');
    jobs.push(animate(s,[{opacity:1,transform:`translate(${p.x}px,${p.y}px) scale(1.15)`},{opacity:1,transform:`translate(${p.x+Math.cos(angle)*distance*.4}px,${p.y+Math.sin(angle)*distance*.4}px) rotate(30deg) scale(1.3)`,offset:.22},{opacity:.55,offset:.6},{opacity:0,transform:`translate(${p.x+Math.cos(angle)*distance}px,${p.y+Math.sin(angle)*distance}px) rotate(100deg) scale(.15)`}],{duration:850+tier*90,easing:'cubic-bezier(.15,.55,.35,1)'}));
  }return Promise.all(jobs).finally(()=>g.remove());
}
function rageSkyfall(side,key,pending){
  const target=combatV3Point(side==='hero'?'enemy':'hero');
  const node=document.createElement('span');node.className='rage-skyfall '+key;node.style.left=target.x+'px';node.style.top=Math.max(10,target.y-170)+'px';node.style.height=(target.y-Math.max(10,target.y-170)+35)+'px';
  node.style.setProperty('--rage-color',combatV3Palette[key].main);node.innerHTML='<i></i><b></b><em></em>';$('combatEffects').append(node);
  pending.push(animate(node,[{opacity:0,transform:'translateX(-50%) scaleY(.08)'},{opacity:1,transform:'translateX(-50%) scaleY(1)',offset:.36},{opacity:1,offset:.82},{opacity:0,transform:'translateX(-50%) scaleY(1.1)'}],{duration:650,easing:'linear'}).finally(()=>node.remove()));
}
// One absolute timeline for every rage skill: 0..3000 ms, independent of hit count.
async function rageChoreography(side,raw,{hits=1,onRelease=()=>{}}={}){
  if(side==='hero'&&state.key==='fire')return mikaFlameRage(raw,onRelease);
  if(side==='hero'&&state.key==='shadow')return bladeRage(state.key,raw,onRelease);
  const key=side==='hero'?state.key:state.enemyKey,targetSide=side==='hero'?'enemy':'hero',source=actor(side),target=actor(targetSide),direction=side==='hero'?1:-1;
  const caster=key==='ice'||key==='lightning',hammer=key==='earth',sword=key==='fire'&&side==='hero';
  const start=performance.now(),pending=[],old=source.style.transform,oldTarget=target.style.transform;
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const fx=(el,frames,duration)=>{const p=animate(el,frames,{duration,fill:'forwards',easing:'ease-in-out'});pending.push(p);return p;};
  let amount=0,blocked=0;const ledger={raw:0,applied:0};
  const lumiStorm=side==='hero'&&key==='lightning'?lumiStormCloud(pending):null;
  if(lumiStorm)prepareLumiThunder();
  const aura=document.createElement('span');aura.className='ultimate-aura rage-aura';aura.dataset.auraSide=side;aura.style.setProperty('--aura-color',combatV3Palette[key].main);aura.innerHTML='<i class="aura-halo"></i><i class="aura-ring"></i><i class="aura-ring second"></i>';source.append(aura);
  source.dataset.ragePhase='chant';source.classList.add('charging-ultimate','combat-v3-acting');source.style.zIndex='4';
  try{
    combatVoice(side,'cast');if(!lumiStorm)combatV3ChargeSound(key,true);popActorSkill(side,side==='hero'?HEROES[key].skill:MONSTERS[key].skill,true,pending);
    fx(aura,[{opacity:0,transform:'scale(.5)'},{opacity:.9,transform:'scale(1.1)',offset:.6},{opacity:0,transform:'scale(1.4)'}],1200);
    setSpriteFrame(side,'cast',0);await at(300);setSpriteFrame(side,'cast',1);await at(650);setSpriteFrame(side,'cast',2);await at(1000);
    aura.remove();source.classList.remove('charging-ultimate');
    const from=combatV3Point(side),to=combatV3Point(targetSide),travel=Math.max(0,Math.abs(to.x-from.x)-from.width*.43);
    if(hammer){
      source.dataset.ragePhase='hammer-spin';const action=side==='hero'?'smash':'attack';
      for(const [i,frame]of [0,1,2,3,1,2,3].entries()){setSpriteFrame(side,action,frame);combatV3Whoosh('earth',false,110);await at(1100+i*100);}
      fx(source,[{transform:old||'none'},{transform:`translate(${direction*travel*.7}px,-12px) rotate(-6deg)`,offset:.65},{transform:`translate(${direction*travel}px,0px)`}],280);
      source.style.transform=`translate(${direction*travel}px,0px)`;
    }else if(sword){source.dataset.ragePhase='lunge';setSpriteFrame(side,'attack',1);fx(source,[{transform:old||'none'},{transform:`translate(${direction*travel*.6}px,-7px)`,offset:.6},{transform:`translate(${direction*travel}px,0px)`}],350);source.style.transform=`translate(${direction*travel}px,0px)`;}
    else{source.dataset.ragePhase='channel';setSpriteFrame(side,'cast',3);combatV3Charge(side,key,true,pending);}
    await at(1500);
    if(caster){source.dataset.ragePhase='skyfall';if(!lumiStorm)rageSkyfall(side,key,pending);setSpriteFrame(side,'cast',4);}
    const times=sword?[1600,1900,2200]:caster?(hits>1?Array.from({length:hits},(_,i)=>1850+i*75):[2000]):key==='fire'?Array.from({length:hits},(_,i)=>1700+i*180):[2050];
    for(let i=0;i<times.length;i++){
      await at(times[i]);source.dataset.ragePhase='impact';if(i===0)combatVoice(side,'release');
      const contact=combatV3Point(targetSide);
      lumiStorm?.strike(contact,i,pending);
      setSpriteFrame(side,hammer&&side==='hero'?'smash':caster?'cast':'attack',hammer?4:caster?4:key==='fire'&&side==='enemy'?[3,2,3][i%3]:[3,2,4][i%3]);
      if(sword)combatV3Slash(contact,key,i,true,direction,pending);
      else if(hammer)combatV3Earth(contact,true,pending);
      else if(!caster)combatV3Breath(combatV3Point(side),contact,true,pending);
      const result=damage(side,raw/times.length,ledger);amount+=result.amount;blocked+=result.blocked;
      combatVoice(targetSide,'hurt');if(lumiStorm)lumiThunderStrike(i);else combatV3HitSound(key,true);combatV3Impact(targetSide,key,direction,true,pending);combatV3Camera(direction,true,side==='enemy'&&state.boss,pending);
      combatV3Number(targetSide,result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',i,pending);hitAccents(side,result,false,pending);
      setSpriteAction(targetSide,'hurt',230);const recoil=combatOuterMotion(targetSide,13,5);fx(target,[{transform:oldTarget||'none'},{transform:`translate(${direction*recoil.distance}px,-3px) rotate(${direction*recoil.tilt}deg)`,offset:.25},{transform:oldTarget||'none'}],230);
      if(i===times.length-1){onRelease(pending);update();}
      if(sword&&i<times.length-1){await at(times[i]+130);setSpriteFrame(side,'attack',i?1:4);}
    }
    await at(2450);source.dataset.ragePhase='recover';setSpriteFrame(side,hammer&&side==='hero'?'smash':caster?'cast':'attack',5);
    fx(source,[{transform:source.style.transform||'none'},{transform:old||'none'}],400);
    source.style.transform=old;
    await at(3000);await Promise.all(pending);return {amount,blocked};
  }finally{await Promise.allSettled(pending);lumiStorm?.remove();aura.remove();delete source.dataset.ragePhase;source.classList.remove('charging-ultimate','combat-v3-acting');source.style.transform=old;target.style.transform=oldTarget;source.style.zIndex='';setSpriteAction(side,'idle');setSpriteAction(targetSide,'idle');}
}
