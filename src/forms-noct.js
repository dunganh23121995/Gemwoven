/* Noct's four-star form, the moon ronin "Dạ Ảnh Kiếm Sĩ" (HERO_KITS.shadow, see hero-kits.js).
 * Forms 1 and 3 keep their staging in shadow-combat.js. Form 2 has its own sheets (forms.json:
 * attack, cast, run, hover and "skill", his iai poses) and art (assets/fx/heroes/shadow, ART.heroFx.shadow):
 *  - Dạ Ảnh Ngũ Trảm: night falls and a crescent moon rises behind the foe; Noct sinks into a deep
 *    iai stance and vanishes; five shadows of him appear round the foe one after another, each
 *    leaving a straight samurai cut hanging across the foe; the real Noct stands behind the foe, blade out, and
 *    sheathes it: on the click of the guard the five cuts burst together. The rules are bladeRage's,
 *    unchanged: the kit's hits each deal raw/hits through bladeContact, with onRelease after the last.
 *  - basic attack (noctDrawCut): a dash in, one battōjutsu draw-cut with one straight cut line, sheathed on the way back.
 * Sounds are form 1's katana recordings (noct-audio.js): draw, dash, slash, sheath, finish. */
function noctMoonForm(){return state.key==='shadow'&&combatHeroForm('shadow')===2;}
// One straight samurai cut (lines.webp, four drawings, one per row) laid across the foe; it is drawn
// along its length in a flash and stays until `hold` ends. Five cuts cross the foe at these angles.
const NOCT_CUT_ANGLES=[-30,22,-6,48,-56];
function noctCut(point,index,direction,pending,{length=null,hold=0,shift=[0,0],angle=null}={}){
  const sheet=ART.heroFx?.shadow?.lines;if(!sheet||reduced)return null;
  const len=length||Math.min(230,point.width*1.5),variant=index%sheet.count;angle??=NOCT_CUT_ANGLES[index%NOCT_CUT_ANGLES.length]*direction;
  const node=document.createElement('span');node.className='noct-cut';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x+shift[0]}px;top:${point.y+shift[1]}px;width:${len}px;height:${len*sheet.height/sheet.count/sheet.width}px;background-image:url('${sheet.src}');background-size:100% ${sheet.count*100}%;background-position:0 ${variant/(sheet.count-1)*100}%`;
  $('combatEffects').append(node);
  // animate() cancels its animation when done: the end state is set inline first.
  node.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;node.style.opacity='1';
  const drawn=animate(node,[{opacity:1,clipPath:direction>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:70,easing:'cubic-bezier(.2,.9,.3,1)'});
  if(!hold)pending.push(drawn.then(()=>animate(node,[{opacity:1,scale:'1 1'},{opacity:0,scale:'1.06 .4'}],{duration:200,easing:'ease-in'})).finally(()=>node.remove()));
  return node;
}
const quickBladeCutBase=quickBladeCut;
quickBladeCut=function(point,key,index,direction,pending){
  if(key==='shadow'&&noctMoonForm()&&ART.heroFx?.shadow?.lines)return noctCut(point,index,direction,pending);
  return quickBladeCutBase(point,key,index,direction,pending);
};
// A shadow of Noct: his own sprite in a pose, darkened to a silhouette with a violet rim.
// depth places him round the foe on the ground: below 0 he stands behind the foe (under it, a
// little smaller), above 0 in front of it (a little larger).
function noctShadowClone(at,frame,facing,action='attack',depth=0){
  const root=actor('hero'),body=root.querySelector('.sprite-body'),rect=root.getBoundingClientRect();
  const keep=[body.dataset.action,+body.dataset.frame];setSpriteFrame('hero',action,frame);
  const sprite=body.cloneNode(true);setSpriteFrame('hero',keep[0]||'idle',keep[1]||0);
  sprite.removeAttribute('role');sprite.removeAttribute('aria-label');sprite.style.scale=facing+' 1';
  const node=document.createElement('span');node.className='noct-shadow-clone';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${at.x-rect.width/2}px;top:${at.y-rect.height*.62}px;width:${rect.width}px;height:${rect.height}px;transform-origin:50% 94%;scale:${1+depth*.08}`;
  if(depth<-.3)node.classList.add('behind');
  node.append(sprite);(depth<-.3?$('scene'):$('combatEffects')).append(node);return node;
}
// The path a shadow takes from one strike to the next: a run of fading afterimages of him
// dashing along it and a thin blade streak (a cut line) drawn from a to b as he goes, which
// then pulls in behind him toward b (the cut drawing as a mask, violet fading back to a white head). Starts `delay` ms from now and lasts `duration` ms.
function noctShadowTransit(a,b,pending,delay=0,duration=130){
  const sheet=ART.heroFx?.shadow?.lines;if(reduced)return;
  const dir=b.x>=a.x?1:-1,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<8)return;
  for(let i=1;i<=4;i++){
    const t=i/5,clone=noctShadowClone({x:a.x+dx*t,y:a.y+dy*t},(i+1)%6,dir,'run');
    clone.classList.add('trail');clone.style.opacity='0';
    pending.push(animate(clone,[{opacity:0},{opacity:.6,offset:.12},{opacity:0}],{duration:320,delay:delay+t*duration,easing:'ease-out',fill:'both'}).finally(()=>clone.remove()));
  }
  if(!sheet)return;
  const rect=actor('hero').getBoundingClientRect(),y=-rect.height*.06,variant=len%sheet.count|0;
  const node=document.createElement('span');node.className='noct-trail';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${(a.x+b.x)/2}px;top:${(a.y+b.y)/2+y}px;width:${len}px;height:${Math.max(16,Math.min(26,len*sheet.height/sheet.count/sheet.width))}px;--trail-mask:url('${sheet.src}');--trail-size:100% ${sheet.count*100}%;--trail-at:0 ${variant/(sheet.count-1)*100}%;transform:translate(-50%,-50%) rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
  $('combatEffects').append(node);
  pending.push(animate(node,[{opacity:.9,clipPath:'inset(0 100% 0 0)'},{opacity:.9,clipPath:'inset(0 0 0 0)',offset:.4},{opacity:0,clipPath:'inset(0 0 0 100%)'}],{duration:duration/.4+60,delay,easing:'linear',fill:'both'}).finally(()=>node.remove()));
}
// The foe's drawn body on the stage (its sheet's span, feet line and height), not its cell.
function noctFoeBody(){
  const cell=actor('enemy').getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,bottom=cell.top-scene.top+cell.height*foot;
  return {left,right,top,bottom,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};
}
// The night and the moon (in the middle of the stage) sit behind both fighters (the scene's own layers, under the actors).
function noctNight(body,art='moon'){
  const scene=$('scene'),sheet=ART.heroFx?.shadow?.[art],night=document.createElement('span');
  night.className='noct-night';night.setAttribute('aria-hidden','true');scene.append(night);
  let moon=null;
  if(sheet&&!reduced){
    // A large moon, inside the stage.
    const size=Math.max(120,Math.min(scene.clientHeight*.7,scene.clientWidth*.5));
    moon=document.createElement('span');moon.className='noct-moon '+art;moon.setAttribute('aria-hidden','true');
    // In the middle of the stage, between the two fighters.
    const x=scene.clientWidth/2,y=Math.max(size*.5+4,scene.clientHeight*.42);
    moon.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px;background-image:url('${sheet.src}')`;
    scene.append(moon);
  }
  return {night,moon};
}
async function noctMoonRage(raw,{hits=5,onRelease=()=>{}}={}){
  const root=actor('hero'),target=actor('enemy'),old=root.style.transform,oldZ=root.style.zIndex,pending=[],ledger={raw:0,applied:0};
  const start=performance.now(),at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const from=combatV3Point('hero'),foe=combatV3Point('enemy'),body=noctFoeBody();
  const behind=Math.min(foe.x-from.x+Math.max(46,body.width*.62),$('scene').clientWidth-from.width*.4-from.x);
  const count=Math.max(1,Math.round(hits)||1);let amount=0,blocked=0,sky=null;const cuts=[],clones=[];
  root.classList.add('combat-v3-acting','charging-ultimate');root.style.zIndex='4';root.dataset.ragePhase='chant';
  try{
    combatVoice('hero','cast');popActorSkill('hero',HEROES.shadow.skill,true,pending);playNoctSound('charge',{volume:.22});
    // 0-700: the iai stance; night falls and the moon rises behind the foe.
    setSpriteFrame('hero','cast',2);await at(220);setSpriteFrame('hero','skill',0);
    sky=noctNight(body);
    sky.night.style.opacity='1';pending.push(animate(sky.night,[{opacity:0},{opacity:1}],{duration:650,easing:'ease-out'}));
    if(sky.moon){sky.moon.style.opacity='.6';pending.push(animate(sky.moon,[{opacity:0,transform:'translate(-50%,-30%) scale(.86)'},{opacity:.6,transform:'translate(-50%,-50%) scale(1)'}],{duration:900,easing:'cubic-bezier(.2,.8,.3,1)'}));}
    await at(720);root.classList.remove('charging-ultimate');root.dataset.ragePhase='vanish';
    // 720: he is gone in a blur of shadow.
    playNoctSound('dash',{volume:.2,pan:.2});shadowEcho(null,null,pending,1);
    // Five shadows strike from five sides of the foe; one shadow dashes from each strike to the
    // next (his afterimages and a blade streak link them), from where he vanished to where he reappears.
    // The shadows close round the foe in a tilted ring sized to its body: the upper ones leap at it
    // from behind (drawn behind it, at its head), the lower ones strike in front of it (at its legs),
    // none straight behind (where the foe would hide him). They strike in a star (every second
    // point), so each dash runs through the foe to its other side.
    const step=count>=5&&count%2?2:1,stageWidth=$('scene').clientWidth,ringX=Math.max(from.width*.42,body.width/2+from.width*.14),ringY=Math.max(from.height*.18,body.height*.36),ringAt=body.top+body.height*.56;
    const spots=Array.from({length:count},(_,k)=>{const a=-Math.PI/2+Math.PI/count+(k*step%count)*2*Math.PI/count,depth=Math.sin(a);
      return {x:Math.min(stageWidth-from.width*.28,Math.max(from.width*.28,body.x+Math.cos(a)*ringX)),y:Math.max(from.height*.5,ringAt+depth*ringY),side:Math.cos(a)>=.05?-1:1,depth};});
    noctShadowTransit(from,spots[0],pending,40,140);
    root.style.opacity='0';await animate(root,[{opacity:1,filter:'blur(0)'},{opacity:0,filter:'blur(3px)'}],{duration:140});
    root.style.transform=`translateX(${behind}px)`;
    // 900-1800: a straight cut hangs after each strike.
    for(let k=0;k<count;k++){
      await at(900+k*190);root.dataset.ragePhase='shadow-cut';root.dataset.rageHit=String(k+1);
      noctShadowTransit(spots[k],k<count-1?spots[k+1]:{x:from.x+behind,y:from.y},pending,k<count-1?60:110,130);
      const spot=spots[k],clone=reduced?null:k===0?noctShadowClone(spot,0,spot.side,'skill',spot.depth):noctShadowClone(spot,k%2?3:2,spot.side,'attack',spot.depth);   // the first waits in the iai stance, about to draw
      // Each shadow stays where it struck until the ultimate is over.
      if(clone){clones.push(clone);clone.style.opacity='.85';pending.push(animate(clone,[{opacity:0,translate:`${-spot.side*14}px 0`},{opacity:.95,translate:'0 0',offset:.4},{opacity:.85,translate:'0 0'}],{duration:240,easing:'ease-out'}));}
      playNoctSound('slash'+(k%3+1),{volume:.2,pan:spot.side*-.3});
      const cut=noctCut({x:body.x,y:body.y,width:body.width},k,1,pending,{length:Math.min(280,Math.max(130,Math.max(body.width,body.height)*1.5)),hold:1,shift:[(k-2)*body.width*.05,(k%2?-1:1)*body.height*.06]});
      if(cut)cuts.push(cut);
    }
    // 1900: Noct stands behind the foe as a shadow (dark, violet-rimmed like his clones), back turned,
    // blade out; he flicks it and starts to sheathe it.
    await at(1900);root.dataset.ragePhase='reveal';root.classList.add('noct-shadowed');setSpriteFrame('hero','skill',1);
    root.style.opacity='';root.style.filter='';await animate(root,[{opacity:0},{opacity:1}],{duration:120});
    await at(2060);setSpriteFrame('hero','skill',2);
    await at(2200);setSpriteFrame('hero','skill',3);playNoctSound('draw',{volume:.12,pan:.3});
    // 2260: still a shadow, he glides back to his ready place.
    await at(2260);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',4);bladeFacing(-1);shadowTransitEchoes(behind,0,pending);playNoctSound('dash',{volume:.16,pan:-.2});
    await animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:240,easing:'ease-out'});root.style.transform=old;
    bladeFacing(1);setSpriteFrame('hero','skill',3);
    // 2540: home, the guard clicks home and every cut bursts at once.
    await at(2540);setSpriteFrame('hero','skill',4);playNoctSound('sheath',{volume:.32,pan:-.1});root.dataset.ragePhase='impact';
    combatVoice('hero','release');playNoctSound('finish',{volume:.3});
    const bursts=[];
    for(let i=0;i<count;i++){
      const cut=cuts[i];
      // Each cut flares white and splits open wide, then is gone.
      if(cut){cut.classList.add('bright');const run=animate(cut,[{opacity:1,scale:'1 1',filter:'brightness(1)'},{opacity:1,scale:'1.08 2.6',filter:'brightness(2.4)',offset:.22},{opacity:0,scale:'1.12 .2',filter:'brightness(1.4)'}],{duration:380,delay:i*45,easing:'ease-out'}).finally(()=>cut.remove());pending.push(run);bursts.push(run);}
      if(i)await wait(reduced?0:45);
      const result=bladeContact(raw/count,ledger,i,i%2?-1:1,false,pending);amount+=result.amount;blocked+=result.blocked;
      if(i===count-1){onRelease(pending);update();}
    }
    // The night lifts while the cuts burst; once they are gone, the shadow turns back into Noct.
    for(const layer of [sky?.night,sky?.moon,...clones].filter(Boolean)){const from=layer.style.opacity;layer.style.opacity='0';pending.push(animate(layer,[{opacity:from},{opacity:0}],{duration:420}));}
    await Promise.all(bursts);setSpriteFrame('hero','skill',5);
    const sprite=root.querySelector('.sprite-body');root.classList.remove('noct-shadowed');
    if(sprite)pending.push(animate(sprite,[{filter:'brightness(.18) saturate(.5) drop-shadow(0 0 3px #a58bff)'},{filter:'none'}],{duration:300,easing:'ease-out'}));
    await at(3000);await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);for(const cut of cuts)cut.remove();for(const clone of clones)clone.remove();sky?.night.remove();sky?.moon?.remove();
    root.style.opacity='';root.style.filter='';root.style.transform=old;root.style.zIndex=oldZ;bladeFacing(1);delete root.dataset.facing;delete root.dataset.ragePhase;delete root.dataset.rageHit;
    root.classList.remove('combat-v3-acting','charging-ultimate','noct-shadowed');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
// Basic attack: he dashes in close with the sword sheathed, then one battōjutsu draw-cut: the left
// hand keeps the scabbard, the right hand rips the blade out and flings it forward in a single
// horizontal cut (one straight cut line), and he sheathes it on the way back. The rules are
// shadowAttack's, unchanged: the chain multiplier, the critical third, raw/hits per hit through
// bladeContact (every hit lands on the one cut).
async function noctDrawCut(raw,{hits=1,damageLedger=null,attackChain=1}={}){
  const root=actor('hero'),old=root.style.transform,oldZ=root.style.zIndex,pending=[];
  const from=combatV3Point('hero'),to=combatV3Point('enemy'),travel=Math.max(0,to.x-from.x-from.width*.42);
  const chain=Math.max(1,Math.floor(attackChain)),critical=chain>=3&&chain%3===0;
  raw*=attackChainMultiplier(chain)*(critical?1.5:1);hits=Math.max(1,Math.min(8,Math.round(hits)||1));
  const ledger=damageLedger||{raw:0,applied:0};let amount=0,blocked=0;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.attackChain=chain;root.dataset.attackStance='iai';
  try{
    combatVoice('hero','attack');setSpriteFrame('hero','attack',1);await wait(90);
    // The dash, sword still sheathed.
    setSpriteFrame('hero','cast',3);shadowTransitEchoes(0,travel,pending);playNoctSound('dash',{volume:.22,pan:.28});
    await animate(root,[{transform:old||'none'},{transform:`translateX(${travel}px)`}],{duration:150,easing:'cubic-bezier(.12,.8,.3,1)'});root.style.transform=`translateX(${travel}px)`;
    setSpriteFrame('hero','attack',1);await wait(70);
    // The draw and the cut, in one motion.
    setSpriteFrame('hero','attack',2);playNoctSound('draw',{volume:.2,pan:.3});await wait(50);
    setSpriteFrame('hero','attack',3);combatV3Whoosh('shadow',critical,60);
    const target=combatV3Point('enemy');noctCut(target,critical?1:0,1,pending,{length:Math.min(260,target.width*1.7),angle:critical?-8:-4});
    for(let i=0;i<hits;i++){const result=bladeContact(raw/hits,ledger,i,1,critical,pending);amount+=result.amount;blocked+=result.blocked;if(i<hits-1)await wait(40);}
    await wait(130);setSpriteFrame('hero','attack',4);await wait(120);
    // Back to his place, sheathing.
    setSpriteFrame('hero','cast',4);bladeFacing(-1);shadowTransitEchoes(travel,0,pending);
    await animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:190,easing:'ease-out'});root.style.transform=old;
    bladeFacing(1);setSpriteFrame('hero','attack',5);playNoctSound('sheath',{volume:.22});await wait(120);
    await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);root.style.transform=old;root.style.zIndex=oldZ;bladeFacing(1);delete root.dataset.facing;delete root.dataset.attackChain;delete root.dataset.attackStance;
    root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
const shadowAttackBase=shadowAttack;
shadowAttack=function(raw,options){return noctMoonForm()?noctDrawCut(raw,options):shadowAttackBase(raw,options);};
// A hero facing left (back from a dash, or standing on the right) draws with the same right hand, so
// he shows his front: the form's attackLeft sheet (drawn facing left, stored mirrored) is used then.
const spriteDefinitionBase=spriteDefinition;
spriteDefinition=function(family,key,action){
  const def=spriteDefinitionBase(family,key,action);
  if(family!=='hero'||def.action!=='attack')return def;
  const left=ART.heroForms?.[key]?.[combatHeroForm(key)]?.attackLeft,root=actor('hero');
  // He looks left when his actor is turned (-1) or the whole stage is mirrored (studio), not both.
  const turned=root?.dataset.facing==='-1'||root?.classList.contains('duel-facing-left'),mirrored=document.documentElement.dataset.heroSide==='right';
  return left&&turned!==mirrored?{sheet:left,action:'attackLeft'}:def;
};
// Six-star Noct (Hắc Liêm Đoạt Hồn, shadow-combat.js reaperVeilRage) gets a sky of his own too: the
// stage darkens and a huge blood moon rises over the stage, gone when he returns.
const reaperVeilRageBase=reaperVeilRage;
reaperVeilRage=async function(raw,onRelease){
  const sky=noctNight(noctFoeBody(),'blood');
  for(const [layer,to] of [[sky.night,'1'],[sky.moon,'.55']])if(layer){layer.style.opacity=to;animate(layer,[{opacity:0,...(layer===sky.moon?{transform:'translate(-50%,-30%) scale(.86)'}:{})},{opacity:+to,...(layer===sky.moon?{transform:'translate(-50%,-50%) scale(1)'}:{})}],{duration:900,easing:'cubic-bezier(.2,.8,.3,1)'});}
  try{return await reaperVeilRageBase(raw,onRelease);}
  finally{
    await Promise.all([sky.night,sky.moon].filter(Boolean).map(layer=>{const from=layer.style.opacity;layer.style.opacity='0';return animate(layer,[{opacity:from},{opacity:0}],{duration:420});}));
    sky.night.remove();sky.moon?.remove();
  }
};
const noctFormRage=rageChoreography;
rageChoreography=async function(side,raw,options={}){
  if(side==='hero'&&noctMoonForm())return noctMoonRage(raw,options);
  return noctFormRage(side,raw,options);
};
// Leaving a cleared stage: no floating. He settles his hand on the hilt, then runs off low and fast on
// the ground (his run sheet), and every few strides he steps through shadow: he darkens into a
// silhouette and blinks a stride ahead, leaving afterimages, before the run carries him off.
async function noctRoninDepart(){
  const root=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children],pending=[];root.dataset.departing='true';
  try{
    setSpriteFrame('hero','skill',4);await wait(reduced?0:320);
    setSpriteFrame('hero','cast',2);playNoctSound('dash',{volume:.18,pan:.2});await wait(reduced?0:140);
    const start=performance.now(),duration=reduced?1:2100;let lastEcho=0,blink=0,shift=0,blinkAt=0;
    await new Promise(resolve=>{
      function tick(now){
        const t=now-start,p=Math.min(1,t/duration),eased=p*p*(3-2*p)*.6+p*.4,camera=width*.95*eased;
        // A shadow step every 620 ms: 140 ms dark, then he is a stride further on.
        if(t>blinkAt+620&&p<.85){blinkAt=t;blink=t;root.classList.add('noct-shadowed');shadowEcho(null,null,pending);playNoctSound('dash',{volume:.14,pan:.3});}
        if(blink&&t-blink>140){blink=0;shift+=width*.12;root.classList.remove('noct-shadowed');}
        const x=width*1.6*eased+shift-camera;
        root.style.transform=`translateX(${x}px)`;root.dataset.worldX=String(width*1.6*eased+shift);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','run',Math.floor(t/85)%6);
        if(now-lastEcho>240){shadowEcho(null,null,pending);lastEcho=now;}
        layers.forEach(layer=>layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`);
        if(p<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    root.style.opacity='0';await animate(root,[{opacity:1},{opacity:0}],{duration:180});await Promise.all(pending);
  }finally{root.classList.remove('noct-shadowed');delete root.dataset.departing;delete root.dataset.worldX;root.style.transform='';setSpriteAction('hero','idle');}
}
// Form 2's ultimate stages itself (no shared sigil or burst from hero-forms-combat.js).
HERO_KITS.shadow={forms:{2:{ultimate:()=>formOriginalUltimate(),depart:()=>noctRoninDepart()}}};
