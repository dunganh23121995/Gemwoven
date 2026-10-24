/* Tân (novice, one form): his own ultimate, Kiếm Nhiệt Huyết. The eager rookie plants his feet in
 * a flare of golden fighting spirit, winds up, dashes in with a trail of warm afterimages, rises and
 * brings the wooden sword down in one big earnest overhead chop: a golden crescent sweeps across
 * the foe and a burst of spirit lands on its body. Art: the `skill` sheet beside his other actions
 * (assets/heroes/novice/skill.webp; an alternative drawing may carry its own) and the strips in
 * assets/fx/heroes/novice (ART.heroFx.novice: aura, slash, burst).
 * Damage is the old ultimate's, unchanged: progressionCasting on, then for each of the kit's hits
 * damage('hero',kit.base/kit.hits) exactly as attack('hero',kit.base,{hits:kit.hits}) resolved it
 * (chain 1, no ledger). The basic attack and the departure keep the shared behaviour. */
HERO_KITS.novice={forms:{1:{ultimate:tanSpiritSword}}};
function tanSkillAction(){return spriteDefinition('hero','novice','skill').action==='skill'?'skill':'cast';}
// The foe's drawn body (its idle sheet's span/feet/height), not its whole sprite cell.
function tanFoeBody(){
  const target=actor('enemy'),scene=$('scene').getBoundingClientRect(),cell=target.getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,top=Math.max(0,foot-(look.bodyHeight||.75));
  const body={left:cell.left-scene.left+cell.width*span[0],right:cell.left-scene.left+cell.width*span[1],top:cell.top-scene.top+cell.height*top,bottom:cell.top-scene.top+cell.height*foot};
  body.width=body.right-body.left;body.height=body.bottom-body.top;body.x=(body.left+body.right)/2;
  return body;
}
function tanFx(name,point,size,{rotate=0,duration}={}){
  const sheet=ART.heroFx?.novice?.[name];if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='tan-fx tan-fx-'+name;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size}px;height:${size}px;--fx-count:${sheet.count};background-image:url('${sheet.src}');rotate:${rotate}deg`;
  $('combatEffects').append(node);
  const job=animate(node,[{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0'}],{duration:duration||sheet.count*sheet.frameDuration,easing:`steps(${sheet.count},jump-none)`,fill:'forwards'}).finally(()=>node.remove());
  return {node,job};
}
// The fighting-spirit flare stands behind him (inside his actor, under the sprite), looping.
function tanSpiritAura(){
  const sheet=ART.heroFx?.novice?.aura;if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='tan-spirit-aura';node.setAttribute('aria-hidden','true');
  node.style.cssText=`--fx-count:${sheet.count};--fx-ms:${sheet.count*sheet.frameDuration}ms;background-image:url('${sheet.src}')`;
  actor('hero').prepend(node);return node;
}
// A warm afterimage of his current pose, left behind on the dash.
function tanEcho(pending,delay=0){
  if(reduced)return;
  const root=actor('hero'),rect=root.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const node=document.createElement('span');node.className='tan-echo';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${rect.left-scene.left}px;top:${rect.top-scene.top}px;width:${rect.width}px;height:${rect.height}px`;
  const sprite=root.querySelector('.sprite-body').cloneNode(true);sprite.removeAttribute('role');sprite.removeAttribute('aria-label');node.append(sprite);$('combatEffects').append(node);
  pending.push(animate(node,[{opacity:.55,translate:'0 0'},{opacity:0,translate:'-16px 0'}],{duration:300,delay,easing:'ease-out',fill:'both'}).finally(()=>node.remove()));
}
function tanSpiritSound(){
  const context=combatV3AudioContext();if(!context)return;
  combatV3Tone(context,{frequency:196,end:520,duration:.62,volume:.018,type:'triangle'});
  combatV3Tone(context,{at:context.currentTime+.08,frequency:392,end:880,duration:.5,volume:.01});
}
async function tanSpiritSword(){
  const root=actor('hero'),target=actor('enemy'),pending=[],kit=progressionKit(),act=tanSkillAction();
  const old=root.style.transform,oldZ=root.style.zIndex,start=performance.now();
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const move=async(x,y,duration,easing='ease-in-out')=>{const from=root.style.transform||'translate(0px,0px)',to=`translate(${x}px,${y}px)`;await animate(root,[{transform:from},{transform:to}],{duration,easing});root.style.transform=to;};
  // Dash in until the overhead chop's blade (about 80% across his cell) meets the foe's body.
  const hero=combatV3Point('hero'),body=tanFoeBody();
  const near=Math.max(0,Math.min(body.left+body.width*.3-(hero.x-hero.width*.5+hero.width*.8),$('scene').clientWidth-hero.x-hero.width*.4));
  let aura=null,amount=0,blocked=0;
  progressionCasting=true;
  root.classList.add('combat-v3-acting','tan-spirit');root.style.zIndex='4';root.dataset.ragePhase='plant';
  try{
    combatVoice('hero','cast');tanSpiritSound();popActorSkill('hero',HEROES.novice.skill,true,pending);
    setSpriteFrame('hero',act,0);aura=tanSpiritAura();
    if(aura)pending.push(animate(aura,[{opacity:0,scale:'.6 .4'},{opacity:1,scale:'1 1'}],{duration:320,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'}));
    await at(460);root.dataset.ragePhase='wind-up';setSpriteFrame('hero',act,1);await move(-7,0,220,'ease-out');
    await at(860);root.dataset.ragePhase='dash';setSpriteFrame('hero',act,2);
    if(aura){const a=aura;aura=null;pending.push(animate(a,[{opacity:1},{opacity:0}],{duration:200,fill:'forwards'}).finally(()=>a.remove()));}
    combatV3Whoosh('novice',true,200);
    for(let i=0;i<3;i++)tanEcho(pending,i*60);
    await move(near,0,210,'cubic-bezier(.5,0,.7,1)');
    root.dataset.ragePhase='rise';setSpriteFrame('hero',act,3);await move(near,-9,150,'ease-out');
    await at(1270);root.dataset.ragePhase='slash';setSpriteFrame('hero',act,4);
    // Sized to the foe's drawn body, but a dragon still gets a crescent that fits the arena.
    const foe=tanFoeBody(),W=$('scene').clientWidth,size=Math.max(150,Math.min(250,W*.62,Math.max(foe.width,foe.height)*1.4));
    // The crescent is painted as a downward sweep bulging right; turned a quarter it runs from
    // behind his head over the top and down into the foe, the arc of an overhead chop. It is cut
    // where his blade lands: the front of the foe's body, kept inside the arena.
    const cut={x:Math.min(foe.left+Math.min(foe.width*.42,size*.4),W-size*.45),y:Math.max(size*.4,foe.bottom-Math.min(foe.height*.58,size*.55))};
    const slash=tanFx('slash',cut,size,{rotate:-90});if(slash)pending.push(slash.job);
    combatV3Whoosh('novice',true,110);
    move(near,0,90,'ease-in');await at(1330);
    // Contact: the same hit(s) the old ultimate's attack() dealt.
    for(let i=0;i<kit.hits;i++){
      const result=damage('hero',kit.base/kit.hits,null);amount+=result.amount;blocked+=result.blocked;
      combatVoice('enemy','hurt');hitAccents('hero',result,false,pending);
      combatV3Action('enemy','hurt',560);combatV3HitSound('novice',true);
      combatV3Number('enemy',result.stored?'TÍCH +'+result.stored:result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.stored?'stored':result.amount?'damage':'armor',i,pending);
    }
    const burst=tanFx('burst',{x:cut.x+size*.08,y:cut.y+size*.1},Math.max(120,Math.min(200,foe.height*1.1)));if(burst)pending.push(burst.job);
    combatV3Camera(1,true,state.boss,pending);
    if(!reduced){
      const flash=document.createElement('span');flash.className='tan-flash';flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
      pending.push(animate(flash,[{opacity:0},{opacity:.55,offset:.2},{opacity:0}],{duration:420}).finally(()=>flash.remove()));
      target.style.filter='brightness(1.4) sepia(.35)';
      const recoil=combatOuterMotion('enemy',15,7);
      await combatV3Pose(target,`translate(${recoil.distance}px,-5px) rotate(${recoil.tilt}deg)`,80);
    }
    update();
    await at(1560);target.style.filter='';combatV3Pose(target,'translate(0px,0px) rotate(0deg)',300);
    await at(1760);root.dataset.ragePhase='follow-through';setSpriteFrame('hero',act,5);
    await at(2000);root.dataset.ragePhase='return';
    // A light hop back to his place, sword still raised.
    if(!reduced)await animate(root,[{transform:`translate(${near}px,0px)`},{transform:`translate(${near*.5}px,-16px)`,offset:.5},{transform:'translate(0px,0px)'}],{duration:380,easing:'ease-in-out'});
    root.style.transform=old;
    await at(2620);await Promise.all(pending);
    return {amount,blocked};
  }finally{
    progressionCasting=false;
    await Promise.allSettled(pending);aura?.remove();
    root.style.transform=old;root.style.zIndex=oldZ;target.style.filter='';target.style.transform='';
    delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting','tan-spirit');
    if(state.hp>0)setSpriteAction('hero','idle');if(state.enemyHp>0)setSpriteAction('enemy','idle');update();
  }
}
