// Foe skills on screen. Every chapter boss owns a signature effect (ART.bossFx[bossId]) and each
// kind of skill stages it differently: multi-hit volleys fly at the hero, single blows erupt on
// the hero, drains pull a spark back to the foe, burns and poisons smoulder, guards and heals
// burst around the foe itself. Elites wield their chapter boss's effect, smaller and quicker;
// common foes have no skill effect of their own and pounce (attack()).
function foeSkillSheet(){
  const battle=progressionBattle;if(!battle||battle.tier==='normal'||reduced)return null;
  return ART.bossFx?.[battle.bossId]||null;
}
function foeFx(sheet,point,size,{loop=false,rotate=0,duration=0,z=6}={}){
  const node=document.createElement('span');node.className='foe-fx';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size}px;height:${size}px;z-index:${z};--fx-count:${sheet.count};background-image:url('${sheet.src}');rotate:${rotate}deg`;
  $('combatEffects').append(node);
  const run=animate(node,[{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0'}],{duration:duration||sheet.count*sheet.frameDuration,easing:`steps(${sheet.count},jump-none)`,iterations:loop?Infinity:1});
  if(!loop)run.finally(()=>node.remove());
  return {node,run};
}
// One hit of a foe skill landing on the hero: same rules and feedback as a basic attack.
function foeSkillContact(raw,ledger,index,strong,pending){
  const direction=-1,evade=noctEvades('hero'),result=damage('enemy',raw,ledger);
  if(evade)noctDodge(direction,pending);
  else{
    combatVoice('hero','hurt');hitAccents('enemy',result,false,pending);
    combatV3Action('hero','hurt',strong?560:410);combatV3HitSound(state.enemyKey,strong);
    combatV3Impact('hero',state.enemyKey,direction,strong,pending);combatV3Camera(direction,strong,state.boss,pending);
    const recoil=combatOuterMotion('hero',strong?14:8,strong?6:3);
    pending.push(animate(actor('hero'),[{translate:'0 0'},{translate:`${direction*recoil.distance}px -3px`,offset:.3},{translate:'0 0'}],{duration:320,easing:'cubic-bezier(.2,.8,.35,1)'}));
  }
  combatV3Number('hero',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',index,pending);
  return result;
}
async function foeSkillStrike(skill,raw,hits=1){
  const sheet=foeSkillSheet();
  if(!sheet)return attack('enemy',raw,{hits});
  const elite=progressionBattle.tier==='elite',scale=elite?.68:1,pace=elite?.8:1,pending=[],ledger={raw:0,applied:0};
  const source=combatV3Point('enemy'),target=combatV3Point('hero'),body=Math.max(target.width,target.height);
  const hero=actor('hero'),enemy=actor('enemy');let amount=0,blocked=0;
  hits=Math.max(1,Math.min(8,Math.round(hits)||1));
  enemy.classList.add('combat-v3-acting');
  try{
    combatVoice('enemy','cast');combatV3Action('enemy','cast',900);
    await combatV3Wait(220*pace);
    const kind=skill?.kind||'strike',volley=hits>1&&!['burn','poison','drain'].includes(kind);
    for(let i=0;i<hits;i++){
      const last=i===hits-1,spot={x:target.x+(Math.random()-.5)*target.width*.25,y:target.y-target.height*(.05+Math.random()*.15)};
      if(volley){
        // A shard of the boss's effect flies from the foe to the hero, then bursts on contact.
        const start={x:source.x-source.width*.25,y:source.y-source.height*.12},angle=Math.atan2(spot.y-start.y,spot.x-start.x)*180/Math.PI;
        const bolt=foeFx(sheet,start,body*.42*scale,{loop:true,rotate:angle+180,duration:sheet.count*sheet.frameDuration*.6,z:7});
        combatV3Whoosh(state.enemyKey,false,150);
        const lift=-target.height*(.25+.1*(i%2));
        await animate(bolt.node,[{left:start.x+'px',top:start.y+'px'},{left:(start.x+spot.x)/2+'px',top:(start.y+spot.y)/2+lift+'px',offset:.5},{left:spot.x+'px',top:spot.y+'px'}],{duration:260*pace,easing:'cubic-bezier(.35,.1,.6,1)'});
        bolt.run.cancel();bolt.node.remove();
        foeFx(sheet,spot,body*.85*scale,{duration:sheet.count*sheet.frameDuration*.7});
      }else{
        // The effect erupts on the hero and reaches its peak as the blow lands.
        foeFx(sheet,spot,body*(last?1.35:1.05)*scale);
        await combatV3Wait(sheet.frameDuration*2.6*pace);
      }
      const result=foeSkillContact(raw/hits,ledger,i,last&&!elite,pending);amount+=result.amount;blocked+=result.blocked;
      if(kind==='drain'&&last){
        // A spark of stolen energy streams back into the foe.
        const spark=foeFx(sheet,spot,body*.3*scale,{loop:true,z:7});
        pending.push(animate(spark.node,[{left:spot.x+'px',top:spot.y+'px',opacity:1},{left:source.x+'px',top:source.y-source.height*.2+'px',opacity:.2}],{duration:420,easing:'ease-in'}).finally(()=>{spark.run.cancel();spark.node.remove();}));
      }
      if((kind==='burn'||kind==='poison')&&last){
        const ember=foeFx(sheet,{x:target.x,y:target.y+target.height*.12},body*.55*scale,{loop:true,z:5});
        pending.push(animate(ember.node,[{opacity:0},{opacity:.85,offset:.2},{opacity:0}],{duration:900}).finally(()=>{ember.run.cancel();ember.node.remove();}));
      }
      update();
      if(!last)await combatV3Wait((volley?60:140)*pace);
    }
    await combatV3Wait(260);await Promise.all(pending);
    return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);enemy.classList.remove('combat-v3-acting');hero.style.translate='';
    combatV3Action('enemy','idle');combatV3Action('hero','idle');
  }
}
// Guards and heals: the foe's effect bursts around the foe itself before the buff is applied.
async function foeSkillAura(){
  const sheet=foeSkillSheet();if(!sheet)return;
  const elite=progressionBattle.tier==='elite',source=combatV3Point('enemy');
  combatVoice('enemy','cast');combatV3Action('enemy','cast',800);
  foeFx(sheet,{x:source.x,y:source.y},Math.max(source.width,source.height)*(elite?1.05:1.3),{z:3});
  await combatV3Wait(sheet.frameDuration*3);
}
