/* Nori's star forms (hero-kits.js). Form 1 keeps Mộc Linh Hộ Thể as self-buffs.js stages it. The later forms
 * stage their ultimate with Nori's own moves and art (assets/fx/heroes/earth, ART.heroFx.earth), redesigned on the
 * owner's request 12/11 ("đổi kiểu hiệu ứng ulti theo hướng mạnh mẽ"; assets/fx/heroes/earth/ult-v2-design.md, agreed
 * with Codex): six stars (noriAegisUltimate) plants the shield, a giant spectral tree-shield rises with a healing aura,
 * he stomps on the spot and the ground cracks open to the foe, where an earth shockwave erupts (the stun); four stars
 * (noriHammerThrowUltimate, owner 13/11 "dùng búa ném lên trời rơi xuống hóa to vào địch rồi gọi búa về") hurls the hammer
 * into the sky, brings it down as a giant hammer on the foe (the stun) and calls it back to his hand (the renewal). Nori
 * stays on his spot in both.
 * The rules are noriRenewalUltimate's, unchanged: the same stun, damage seal and renewal turns from
 * progressionKit('earth'), no direct damage; Biến Dị's armour still comes from the progression wrapper, which these
 * forms run inside (as Yuki's do). A foe that resists control shows PHONG ẤN and is not thrown about.
 * The basic attack keeps the shared hammer leap; its ground crater becomes a jade quake at the foe's
 * feet, and the six-star sword crescent of the shared form wrapper is left out (Nori swings a hammer). */
const noriRenewalForm1=noriRenewalUltimate;
noriRenewalUltimate=async function(){
  const form=combatHeroForm('earth');
  return form===3?noriAegisUltimate():form===2?noriHammerThrowUltimate():noriWardenForm1();
};
// A pose from another sheet (cast -> attack -> run) must be decoded before it is shown, or the body
// blinks out for a frame when the sheet is swapped: decode a form's sheets once, and keep them.
const noriDecoded=new Map();
function noriWarmSheets(form){
  if(noriDecoded.has(form))return;
  const images=Object.values(ART.heroForms?.earth?.[form]||{}).map(sheet=>{const image=new Image();image.src=sheet.src;image.decode?.().catch(()=>{});return image;});
  noriDecoded.set(form,images);
}
let noriKitAttacking=false;
async function noriHammerAttack(raw,options){
  noriWarmSheets(combatHeroForm('earth'));noriKitAttacking=true;
  try{return await formOriginalAttack('hero',raw,options);}finally{noriKitAttacking=false;}
}
const noriStarUltimate=()=>formOriginalUltimate();
const noriFormRender=renderActors;
renderActors=function(){noriFormRender();if(state.key==='earth'&&combatHeroForm('earth')>=2)noriWarmSheets(combatHeroForm('earth'));};
// The run sheets are clip-route sheets (a lead-in, then a closed loop, clips/f*-run): the shared departure plays them.
HERO_KITS.earth={forms:{
  1:{attack:noriHammerAttack},
  2:{ultimate:noriStarUltimate,attack:noriHammerAttack},
  3:{ultimate:noriStarUltimate,attack:noriHammerAttack}
}};

// ---- Placement ------------------------------------------------------------------------------------
// The foe's drawn body (sheet span/footY/bodyHeight, as Noct's fog measures it) in scene pixels, so the
// roots grow from its feet and the cage fits its size, not the sprite cell.
function noriFoeBody(){
  const target=actor('enemy'),scene=$('scene').getBoundingClientRect(),cell=target.getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,feet=cell.top-scene.top+cell.height*foot;
  // feetX: the point between its feet (build.py measures it on the idle), else the body's middle
  const x=look.feetX!=null?cell.left-scene.left+cell.width*look.feetX:(left+right)/2;
  return {x,left,right,feet,top,width:right-left,height:feet-top};
}
// A drawing that encloses the foe (a cage, walls, a lock): centred on its body's middle (not the point between its feet),
// as wide as asked but never past either arena edge: it shrinks round that centre instead of moving off it (owner 13/11).
function noriAround(foe,want,sceneWidth,spread=.96){
  const x=(foe.left+foe.right)/2,room=2*Math.max(20,Math.min(x-4,sceneWidth-x-4))/spread;
  return {x,width:Math.max(60,Math.min(want,room))};
}
// One authored strip (ART.heroFx.earth[name]) standing on a ground point: the strip's own anchor
// (anchorX, foot) lands on (x, feet). Behind=true puts it under the actors (the world-tree rises
// behind the foe); otherwise it is drawn over them.
// under: an actor (actor('hero'), actor('enemy')): drawn inside it, behind its body and in front of the landscape (13/11:
// the guardian tree on the behind layer sank under the far scenery, which cut its crown flat).
function noriStrip(name,{x,feet,width,height:tall=0,behind=false,under=null,className=''}){
  const sheet=ART.heroFx?.earth?.[name];if(!sheet||reduced)return null;
  let parent=$('combatEffects');
  if(under){
    const scene=$('scene').getBoundingClientRect(),box=under.getBoundingClientRect();
    x-=box.left-scene.left;feet-=box.top-scene.top;parent=under;
  }else if(behind){
    parent=$('scene').querySelector('.nori-fx-back');
    if(!parent){parent=document.createElement('span');parent.className='nori-fx-back';parent.setAttribute('aria-hidden','true');$('scene').append(parent);}
  }
  const height=tall||width/(sheet.aspect||1);
  const node=document.createElement('span');node.className=`nori-fx nori-fx-${name} ${className}`;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x-width*(sheet.anchorX??.5)}px;top:${feet-height*(sheet.foot??1)}px;width:${width}px;height:${height}px;--fx-count:${sheet.count};background-image:url('${sheet.src}')`;
  if(under){node.classList.add('under');parent.prepend(node);}else parent.append(node);
  const set=i=>{node.style.backgroundPosition=`${sheet.count>1?Math.max(0,Math.min(sheet.count-1,i))/(sheet.count-1)*100:0}% 0`;};set(0);
  // frames: [[index, ms], ...] played in order, then the node fades and is removed
  const play=async(frames,fade=160)=>{
    for(const [i,ms] of frames){if(!node.isConnected)return;set(i);await wait(ms);}
    if(node.isConnected)await animate(node,[{opacity:1},{opacity:0}],{duration:reduced?1:fade}).catch(()=>{});
    node.remove();
  };
  return {node,sheet,set,play};
}
const NORI_SEQUENCE={
  // ultimate v2: ground bursts (one-shot)
  stomp:[[0,40],[1,45],[2,55],[3,70],[4,70],[5,70],[6,70],[7,80]],
  shockwave:[[0,50],[1,60],[2,70],[3,130],[4,170],[5,130],[6,110],[7,120]]
};

// The basic attack's ground crater (combat-v3 calls it at the hammer's contact) becomes the jade quake
// strip on the foe's real feet for the star forms.
const noriCraterBase=combatV3Earth;
combatV3Earth=function(point,ultimate,pending){
  const form=combatHeroForm('earth'),name='hit'+form;
  if(!noriKitAttacking||!ART.heroFx?.earth?.[name]||reduced)return noriCraterBase(point,ultimate,pending);
  // (whole-kit redo 13/11, Codex) a dent / jade-seamed stone burst / two-stage blast under the hammer, by form, centred on
  // the foe's body; the drawn burst fills ~75/90/95% of its cell
  const foe=noriFoeBody(),width=Math.min(foe.width*[0,1.35,1.5,1.65][form]+40,[0,200,220,240][form]);
  const strip=noriStrip(name,{x:(foe.left+foe.right)/2,feet:foe.feet+2,width,className:'form-'+form});
  if(strip)pending.push(strip.play([[0,40],[1,45],[2,50],[3,60],[4,60],[5,60],[6,55],[7,55]],120));
};

// The hammer's contact draws nothing of its own (no shared slash): the impact under the foe (combatV3Earth above) is
// the whole hit (whole-kit redo 13/11; basic-fx.js no longer draws Nori's).
const noriBaseVisual=castAttackVisual;
castAttackVisual=function(side,key,origin,contact,index,pending){
  if(side==='hero'&&key==='earth'&&state.key==='earth'&&noriKitAttacking)return true;
  return noriBaseVisual(side,key,origin,contact,index,pending);
};

// Sounds (scripts/prepare_nori_form_sounds.py), built like Yuki's: a few clean real recordings, each the literal
// sound of its motion with its natural attack and decay (leaves swirling up, the whoosh, the hammer thudding into
// the earth, splintering roots, the jade shatter, the creaking tree, falling leaves; form 1's own shield bash), and
// the slam is the loudest moment, a deep boom ringing out ~4 s under it to the end of the ultimate.
function noriWarmSounds(names){const audio=combatV3AudioContext();if(audio)for(const name of names)decodeCastSound(audio,'earth-'+name).catch(()=>{});}
// a cue `delay` ms from now (its own clock, so a beat never waits on the staging's awaits)
function noriCue(pending,name,delay,volume,pan=.3){pending.push(wait(reduced?0:delay).then(()=>playCastSound('earth',name,{volume,pan})));}


// ---- Ngọc Thụ Hộ Thể (four stars) -----------------------------------------------------------------
// The squeezed foe trembles inside the closing jade roots (whole-element motion on the CSS `translate` property,
// which composes with the transforms other effects set).
function noriSqueeze(target,ms){
  const frames=[];
  for(let i=0;i<=16;i++){const k=i/16,amp=1+1.8*k;frames.push({translate:i===16?'0px 0px':`${(i%2?1:-1)*amp}px ${((i%3)-1)*.7}px`,offset:k});}
  return animate(target,frames,{duration:ms,easing:'linear'}).catch(()=>{});
}


// ---- Ultimate v2 placement (owner 12/11, ult-v2-design.md) ----------------------------------------------------------
// Nori's drawn body at rest, measured before the skill sheet (a bigger padded cell) is shown: ground line, the point
// between his feet, his front (the shield side) and his drawn height, in scene pixels.
function noriHeroBody(){
  const scene=$('scene').getBoundingClientRect(),cell=spriteBaseRect(actor('hero').querySelector('.sprite-body'));
  const look=spriteDefinition('hero','earth','idle').sheet,foot=look.footY||.94,span=look.span||[.15,.85],crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  return {x:(left+right)/2,left,right,ground:cell.top-scene.top+cell.height*foot,height:cell.height*(foot-crown),cellLeft:cell.left-scene.left,cellWidth:cell.width,sceneWidth:scene.width,sceneHeight:scene.height};
}
// A strip held on frames of its own (index, ms) list; `loop` repeats it until `until` ms from now, then plays `tail`.
async function noriPlay(strip,frames,{loop=false,until=0,tail=[],fade=160}={}){
  if(!strip)return;const end=performance.now()+until;
  do{for(const [i,ms] of frames){if(!strip.node.isConnected)return;strip.set(i);await wait(ms);if(loop&&performance.now()>=end)break;}}while(loop&&performance.now()<end);
  for(const [i,ms] of tail){if(!strip.node.isConnected)return;strip.set(i);await wait(ms);}
  if(strip.node.isConnected)await animate(strip.node,[{opacity:getComputedStyle(strip.node).opacity},{opacity:0}],{duration:reduced?1:fade}).catch(()=>{});
  strip.node.remove();
}
// The ground crack (one wide picture) laid from one ground point to another and opened from the first to the second.
function noriCrack(x0,y0,x1,y1,ms,pending){
  const sheet=ART.heroFx?.earth?.crack;if(!sheet||reduced)return;
  const length=Math.hypot(x1-x0,y1-y0),height=Math.max(16,Math.min(34,length/8)),angle=Math.atan2(y1-y0,x1-x0)*180/Math.PI;
  const node=document.createElement('span');node.className='nori-fx nori-fx-crack';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x0}px;top:${y0-height*(sheet.foot??.5)}px;width:${length}px;height:${height}px;background-image:url('${sheet.src}');background-size:auto 100%;background-position:0 0;transform-origin:0 ${(sheet.foot??.5)*100}%;transform:rotate(${angle}deg)`;
  $('combatEffects').append(node);
  pending.push(animate(node,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:ms,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'})
    .then(()=>wait(650)).then(()=>animate(node,[{opacity:1},{opacity:0}],{duration:400})).catch(()=>{}).finally(()=>node.remove()));
}
// The foe takes the stun: a jolt up and a tremble (or, resisting control, only the seal: PHONG ẤN, no throw).
function noriStun(kit,pending,{jolt=true}={}){
  if(!(state.enemyHp>0))return false;
  const target=actor('enemy');
  // Form 3 (owner 14/11): a further ultimate in the same turn raises the seal's burst (Fibonacci, progression.js); a seal
  // still running keeps the higher multiplier it already holds.
  if(kit.form===3){const nth=Math.max(1,boardUltTurn.hero||1),chain=progressionRules.noriChainBurst(kit.burst,nth);
    state.noriBurst=state.noriStunTurns>0?Math.max(state.noriBurst||kit.burst,chain):chain;
    if(nth>1)popActorSkill('hero','BỘC PHÁ ×'+state.noriBurst.toLocaleString('vi-VN'),true,pending);}
  else state.noriBurst=0;
  state.noriStunTurns=kit.stun;state.noriStoredDamage=state.noriStoredDamage||0;state.noriSealFree=controlBlocked();state.stunned=!state.noriSealFree;
  combatVoice('enemy','hurt');
  popActorSkill('enemy',(state.noriSealFree?'PHONG ẤN · ':'CHOÁNG · ')+kit.stun+' LƯỢT',false,pending);
  if(!state.noriSealFree){setSpriteAction('enemy','hurt',360);if(jolt&&!reduced)pending.push(animate(target,[{translate:'0px 0px'},{translate:'4px -14px',offset:.22},{translate:'-2px 1px',offset:.5},{translate:'1px -2px',offset:.7},{translate:'0px 0px'}],{duration:480,easing:'ease-out'}).catch(()=>{}));}
  return true;
}
function noriRenewal(kit,pending){
  state.noriRegenTurns=kit.regenTurns;update();combatVoice('hero','release');combatV3BuffSound('heal');
  popActorSkill('hero','Hồi phục · '+kit.regenTurns+' lượt',false,pending);
}

// ---- Whole-kit redo (owner 13/11: "làm lại toàn bộ hình ảnh và hiệu ứng của nori ... khống chế, mạnh mẽ và bộc phát") --
// Codex's "warden knight": the hammer drives force into the ground, the shield gives the order to lock, old wood and jade
// stone force the foe to stand still; the three forms escalate pin the feet -> clamp the body -> wall it in, each with
// ONE peak (the lock, when the stun/seal lands). The owner's own beats stay: form 3's giant shield charges into the foe
// and bursts; form 2's roots wrap the whole foe, centred on it. Sounds (prepare_nori_form_sounds.py): A creak (gathering
// force), B f2-strike (stone thump: impacts and locks), D bell (the renewal); the four-star throw adds f2-swing, f2-fall, f2-return, f2-catch.
// A drawing that locks the foe: centred on its body (noriAround), `want` the cell width it asks for; one copy behind the
// foe (inside its actor), one in front (`.front`, a CSS mask keeps its middle clear so the foe's face shows).
function noriLock(name,foe,want,sceneWidth,{front=true,back:behind=true,cls=''}={}){
  const target=actor('enemy'),at=noriAround(foe,want,sceneWidth),feet=foe.feet+at.width*.01;
  const back=behind?noriStrip(name,{x:at.x,feet,width:at.width,height:at.width,under:target,className:cls}):null;
  const fore=front?noriStrip(name,{x:at.x,feet,width:at.width,height:at.width,className:cls+' front'}):null;
  return {back,front:fore,play:(frames,fade,pending)=>{for(const s of [back,fore])if(s)pending.push(s.play(frames,fade));}};
}
// The renewal: a thin stream of emerald sap-light flows into his shield (no tree, no ring round his whole body).
function noriRenewalStream(me,pending){
  const s=noriStrip('renewal',{x:me.x+me.height*.08,feet:me.ground-me.height*.45,width:me.height*1.15,className:'renewal'});
  if(s)pending.push(s.play([[0,60],[1,70],[2,80],[3,90],[4,100],[5,100],[6,110],[7,120]],180));
  playCastSound('earth','bell',{volume:.5,pan:-.2});
}
const NORI_LOCK=[[0,45],[1,55],[2,65],[3,120],[4,150],[5,150],[4,140],[5,130],[6,120],[7,140]];

// ---- Mộc Linh Hộ Thể (form 1): "Ấn trấn chân" -------------------------------------------------------------------------
// The approved form-1 staging (self-buffs.js: shield raised 0-1200, the shield rush 1200-1550), with the lock: on contact
// two stone-and-wood wedges snap onto the foe's feet and the shield sigil stamps the ground (the stun, its one peak);
// 1850 the renewal stream flows into his shield; 2450 he walks back.
async function noriWardenForm1(){
  if(state.hp<=0)return;
  noriWarmSounds(['creak','f2-strike','bell','shield-bash']);
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),old=root.style.transform,oldTarget=target.style.transform,oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  root.dataset.ragePhase='chant';root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    combatVoice('hero','cast');popActorSkill('hero',HEROES.earth.skill,true,pending);
    setSpriteFrame('hero','cast',0);await at(300);playCastSound('earth','creak',{volume:.45,pan:-.2});
    await at(350);setSpriteFrame('hero','cast',1);await at(750);setSpriteFrame('hero','cast',2);
    await at(1200);setSpriteFrame('hero','cast',3);root.dataset.ragePhase='shield-rush';
    const from=combatV3Point('hero'),to=combatV3Point('enemy'),travel=Math.max(0,to.x-from.x-from.width*.42);
    pending.push(animate(root,[{transform:old||'none'},{transform:`translate(${travel}px,0px)`}],{duration:350,easing:'cubic-bezier(.5,0,.2,1)'}));
    root.style.transform=`translate(${travel}px,0px)`;
    await at(1550);root.dataset.ragePhase='lock';setSpriteFrame('hero','cast',4);
    if(state.enemyHp>0){
      playCastSound('earth','shield-bash',{volume:.5,pan:.2});playCastSound('earth','f2-strike',{volume:.85,pan:.25});combatV3Camera(1,true,false,pending);
      const foe=noriFoeBody();noriLock('footlock',foe,Math.max(foe.width/.42,110),$('scene').clientWidth,{back:false,cls:'form-1 whole'}).play(NORI_LOCK,200,pending);
      if(noriStun(kit,pending,{jolt:false})&&!state.noriSealFree&&!reduced)pending.push(animate(target,[{translate:'0px 0px'},{translate:'0px 3px',offset:.25},{translate:'0px 1px'}],{duration:260,easing:'ease-out'}).catch(()=>{}));
    }
    await at(1850);root.dataset.ragePhase='renewal';noriRenewalStream(noriHeroBody(),pending);noriRenewal(kit,pending);
    await at(2450);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',5);
    pending.push(animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:400,easing:'ease-in-out'}));root.style.transform=old;
    await at(3000);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{
    await Promise.allSettled(pending);delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting');root.style.transform=old;root.style.zIndex=oldZ;target.style.transform=oldTarget;target.style.translate='';
    $('combatEffects').querySelectorAll('.nori-fx').forEach(n=>n.remove());document.querySelectorAll('.actor > .nori-fx.under').forEach(n=>n.remove());setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Vạn Mộc Thiên Thành (six stars): "Thành khiên trấn ngục" ------------------------------------------------------------
// 0 he plants the shield (A); 400 the monumental spectral shield rises beside him; 850 knee up; 1100 the stomp (B, small):
// the crack runs to the foe and the giant shield charges after it (owner 13/11); 1400 it slams into the foe and bursts
// apart, three shield-ramparts burst up round the foe and the antler lintel slams onto them (B full, the strongest shake:
// the stun); 1750 the renewal stream (D); 2300 the walls sink, guard. Sheet `skill` on its own clock (clips/f3-skill).
async function noriAegisUltimate(){
  if(state.hp<=0)return;
  noriWarmSheets(3);noriWarmSounds(['f2-strike','slam','bell','roots']);
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const me=noriHeroBody(),foe=noriFoeBody();
  root.dataset.ragePhase='chant';root.dataset.noriUltimate='3';root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    combatVoice('hero','cast');popActorSkill('hero',HEROES.earth.skill,true,pending);
    setSpriteFrame('hero','skill',0);
    // The monumental shield rises beside him: 1.25x his height (the drawing fills 86% of its cell), out in front of him.
    await at(400);root.dataset.ragePhase='aegis';
    const tall=Math.max(me.height*1.15,Math.min(me.height*1.25,me.ground-me.sceneHeight*.08)),width=tall/.86;
    const shieldX=Math.min(me.sceneWidth-width*.3,me.right+width*.12);
    const shield=noriStrip('bigshield2',{x:shieldX,feet:me.ground+2,width,className:'form-3'});
    if(shield&&!reduced)pending.push((async()=>{for(const [i,ms] of [[0,90],[1,100],[2,120],[3,150]]){shield.set(i);await wait(ms);}if(shield.node.isConnected)shield.set(4);})());
    await at(850);root.dataset.ragePhase='stomp';
    // 1100: the stomp (small): the crack runs to the foe; the giant shield pulses, leans in and charges after it.
    await at(1100);playCastSound('earth','f2-strike',{volume:.45,pan:-.1});combatV3Camera(1,false,false,pending);
    const stomp=noriStrip('stomp',{x:me.x,feet:me.ground+2,width:Math.max(80,me.height*.9),className:'form-3'});
    if(stomp)pending.push(stomp.play(NORI_SEQUENCE.stomp,140));
    const foeAim=noriFoeBody(),hitX=Math.max(shieldX+40,(foeAim.left+foeAim.right)/2-foeAim.width*.55);
    if(shield&&!reduced){shield.set(5);wait(90).then(()=>shield.node.isConnected&&shield.set(6));wait(180).then(()=>shield.node.isConnected&&shield.set(7));
      pending.push(animate(shield.node,[{translate:'0px 0px',rotate:'0deg'},{translate:`${(hitX-shieldX)*.12}px 0px`,rotate:'3deg',offset:.3},{translate:`${hitX-shieldX}px 0px`,rotate:'6deg'}],{duration:300,easing:'cubic-bezier(.55,0,.85,.4)',fill:'forwards'}).catch(()=>{}));}
    playCastSound('earth','roots',{volume:.5,pan:.2});
    noriCrack(me.x+me.height*.12,me.ground,Math.max(me.x+40,(foeAim.left+foeAim.right)/2-foeAim.width*.2),foeAim.feet,330,pending);
    // 1400: the peak: the shield bursts on the foe, the walls rise round it and the antler lock slams shut (the stun).
    await at(1400);root.dataset.ragePhase='lock';
    playCastSound('earth','f2-strike',{volume:.95,pan:.25});playCastSound('earth','slam',{volume:.5,pan:.3});combatV3Camera(1,true,state.boss,pending);
    const foeNow=noriFoeBody();
    if(shield&&!reduced){
      const size=Math.min(me.sceneWidth*.5,width*.95),burst=noriStrip('shieldburst',{x:Math.min(hitX,me.sceneWidth-size*.4),feet:me.ground+2,width:size,className:'form-3'});
      shield.node.remove();if(burst)pending.push(burst.play([[0,45],[1,55],[2,65],[3,80],[4,90],[5,100],[6,110],[7,120]],180));
    }
    const want=Math.max(foeNow.width/.44,foeNow.height*1.05/.72);
    noriLock('citadel',foeNow,want,me.sceneWidth,{front:false,cls:'form-3'}).play(NORI_LOCK,220,pending);
    noriLock('antlerlock',foeNow,want,me.sceneWidth,{front:true,cls:'form-3 antler'}).play(NORI_LOCK,220,pending);
    noriStun(kit,pending,{jolt:false});
    if(!state.noriSealFree&&!reduced)pending.push(noriSqueeze(target,420));
    await at(1750);root.dataset.ragePhase='renewal';noriRenewalStream(me,pending);noriRenewal(kit,pending);
    await at(2300);root.dataset.ragePhase='recover';
    await at(2800);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{
    await Promise.allSettled(pending);delete root.dataset.ragePhase;delete root.dataset.noriUltimate;root.classList.remove('combat-v3-acting');root.style.zIndex=oldZ;target.style.translate='';
    $('combatEffects').querySelectorAll('.nori-fx').forEach(n=>n.remove());document.querySelectorAll('.actor > .nori-fx.under').forEach(n=>n.remove());setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Ngọc Thụ Hộ Thể (four stars): the hammer throw (owner 13/11: "dùng búa ném lên trời rơi xuống hóa to vào địch rồi
// gọi búa về") ------------------------------------------------------------------------------------------------------------
// 0 the hammer rises overhead (no opening creak: owner 13/11 "lúc tung tuyệt kỹ ban đầu có âm thanh gì ... bỏ đi"); 520 he hurls it into the sky (the swing), it spins up off the stage and his hand
// is empty; he points it down onto the foe, a shadow gathering under it; 1120-1400 it plunges, growing into a giant
// hammer, head first; 1400 it lands on the foe (B, the stun: dust, cracks both ways, the shake); 1750 it shrinks and
// rises, 1950-2400 spins back to his raised hand (one whoosh a turn); 2400 he catches it (the thunk) and the renewal
// flows into him (D). Sheet `skill` (clips/f2-skill, its own clock); the flying hammer is ART.heroFx.earth.hammer2.
const NORI_THROW={launch:520,fall:1120,impact:1400,lift:1750,fly:1950,catch:2400,
  // measured on the skill sheet (shares of its cell): the hammer leaving his right hand in the last frame that draws it
  // (its centre, tilt and drawn height; one-handed since 14/11, the shield arm stays low), and the hammer caught overhead
  // (its centre), drawn .32 of the cell tall
  leave:{x:.37,y:.2,angle:0,height:.26},caught:{x:.433,y:.36},height:.32};
// A point of the shown hero sheet's cell in scene pixels (the cell as drawn on screen, transforms included).
function noriCellPoint(u,v){
  const scene=$('scene').getBoundingClientRect(),box=actor('hero').querySelector('.sprite-body').getBoundingClientRect();
  return {x:box.left-scene.left+u*box.width,y:box.top-scene.top+v*box.height,cell:box.height};
}
// The hammer on its own, placed by the centre of its box; turned about that centre (angle 0 = head up).
function noriHammer(){
  const sheet=ART.heroFx?.earth?.hammer2;if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='nori-fx nori-hammer';node.setAttribute('aria-hidden','true');
  node.style.backgroundImage=`url('${sheet.src}')`;$('combatEffects').append(node);
  const place=(x,y,height,angle=0)=>{const width=height*sheet.aspect;node.style.cssText+=`;left:${x-width/2}px;top:${y-height/2}px;width:${width}px;height:${height}px;transform:rotate(${angle}deg)`;};
  return {node,sheet,place};
}
// Drive a hammer along a path for `ms`: at(k) gives {x,y,height,angle} for k from 0 to 1. trail: two fading copies follow
// its path a little behind (the hammer called back, Codex 13/11: a short curved streak into his hand).
function noriFly(hammer,ms,at,{trail=false}={}){
  const ghosts=trail&&!reduced?[.4,.2].map(o=>{const g=noriHammer();if(g){g.node.classList.add('ghost');g.node.style.opacity=String(o);}return g;}).filter(Boolean):[];
  return new Promise(resolve=>{
    const t0=performance.now();
    const tick=now=>{if(!hammer.node.isConnected){ghosts.forEach(g=>g.node.remove());return resolve();}
      const k=Math.min(1,(now-t0)/ms),p=at(k);hammer.place(p.x,p.y,p.height,p.angle);
      ghosts.forEach((g,i)=>{const q=at(Math.max(0,k-.07*(i+1)));g.place(q.x,q.y,q.height,q.angle);});
      if(k<1)requestAnimationFrame(tick);else{ghosts.forEach(g=>g.node.remove());resolve();}};
    tick(t0);
  });
}
async function noriHammerThrowUltimate(){
  if(state.hp<=0)return;
  noriWarmSheets(2);noriWarmSounds(['f2-swing','f2-fall','f2-strike','f2-return','f2-catch','bell']);
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const me=noriHeroBody(),foe=noriFoeBody(),T=NORI_THROW;
  let thrown=null,giant=null,shadow=null;
  root.dataset.ragePhase='chant';root.dataset.noriUltimate='2';root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    combatVoice('hero','cast');popActorSkill('hero',HEROES.earth.skill,true,pending);
    setSpriteFrame('hero','skill',0);
    await at(400);root.dataset.ragePhase='hurl';playCastSound('earth','f2-swing',{volume:.45,pan:-.2});
    // 520: the hammer leaves his open hand and spins up off the top of the stage.
    await at(T.launch);root.dataset.ragePhase='throw';
    const leave=noriCellPoint(T.leave.x,T.leave.y),small=leave.cell*T.height,flung=leave.cell*T.leave.height;
    thrown=noriHammer();
    if(thrown)pending.push(noriFly(thrown,320,k=>{const e=1-(1-k)*(1-k);return {x:leave.x+e*10,y:leave.y-e*(leave.y+flung*1.2),height:noriLerp(flung,small,k),angle:T.leave.angle-k*540};}).then(()=>thrown?.node.remove()));
    // the shadow of what is coming gathers under the foe
    if(!reduced){
      shadow=document.createElement('span');shadow.className='nori-fx nori-fall-shadow';shadow.setAttribute('aria-hidden','true');
      const w=Math.max(foe.width*1.5,90);shadow.style.cssText=`left:${foe.x-w/2}px;top:${foe.feet-w*.11}px;width:${w}px;height:${w*.22}px`;
      $('combatEffects').append(shadow);
      shadow.animate([{opacity:0,transform:'scale(.35)'},{opacity:.75,transform:'scale(1)'}],{duration:T.impact-760,delay:Math.max(0,start+760-performance.now()),easing:'ease-in',fill:'forwards'});
    }
    noriCue(pending,'f2-fall',Math.max(0,start+T.impact-420-performance.now()),.6,.3);
    // 1120-1400: it plunges onto the foe head first, growing into a giant hammer as it falls.
    await at(T.fall);root.dataset.ragePhase='fall';
    // centred on the foe; its head (as wide as the drawing) kept inside the stage: shrunk about that centre, never under 60%
    const want=Math.min(me.sceneHeight*.85,Math.max(foe.height*1.65,foe.width*1.85,150)),aspect=ART.heroFx?.earth?.hammer2?.aspect||.56;
    const G=Math.max(want*.6,Math.min(want,2*(Math.min(foe.x,me.sceneWidth-foe.x)-4)/aspect)),landY=foe.feet+4-G/2;
    giant=noriHammer();
    if(giant){giant.node.classList.add('giant');await noriFly(giant,reduced?1:T.impact-T.fall,k=>{const e=k*k;return {x:foe.x,y:noriLerp(-G*.6,landY,e),height:G*(.4+.6*e),angle:180};});}
    // 1400: the giant hammer lands on the foe (the stun).
    await at(T.impact);root.dataset.ragePhase='impact';
    playCastSound('earth','f2-strike',{volume:.95,pan:.3});combatV3Camera(1,true,state.boss,pending);
    shadow?.remove();shadow=null;
    const dust=noriStrip('stomp',{x:foe.x,feet:foe.feet+3,width:Math.min(me.sceneWidth*.9,G*.95),className:'form-2 impact'});
    if(dust)pending.push(dust.play(NORI_SEQUENCE.stomp,160));
    const reach=Math.min(G*.9,me.sceneWidth*.4);
    noriCrack(foe.x,foe.feet+1,Math.min(me.sceneWidth-4,foe.x+reach),foe.feet+6,260,pending);
    noriCrack(foe.x,foe.feet+1,Math.max(me.right+10,foe.x-reach),foe.feet+6,260,pending);
    if(giant&&!reduced)pending.push(animate(giant.node,[{translate:'0 0'},{translate:'0 -7px',offset:.35},{translate:'0 0'}],{duration:180,easing:'ease-out'}).catch(()=>{}));
    if(noriStun(kit,pending,{jolt:false})&&!state.noriSealFree&&!reduced)pending.push(wait(40).then(()=>noriSqueeze(target,520)));
    // 1750: it shrinks and rises off the foe; 1950-2400 it spins back to his raised hand.
    await at(T.lift);root.dataset.ragePhase='recall';
    noriCue(pending,'f2-return',Math.max(0,start+T.catch-510-performance.now()),.5,.1);
    if(giant){
      const g=giant,lift=k=>({x:foe.x,y:noriLerp(landY,landY-G*.25,k),height:G*noriLerp(1,.42,k),angle:180+k*180});
      await noriFly(g,reduced?1:T.fly-T.lift,k=>lift(1-(1-k)*(1-k)));g.node.classList.remove('giant');
      const from=lift(1),hold=noriCellPoint(T.caught.x,T.caught.y),end={x:hold.x,y:hold.y,height:small};
      const apex={x:(from.x+end.x)/2,y:Math.min(from.y,end.y)-me.height*.9};
      await noriFly(g,reduced?1:T.catch-T.fly,k=>{const u=1-k,e=k<.5?2*k*k:1-2*u*u;
        return {x:u*u*from.x+2*u*k*apex.x+k*k*end.x,y:u*u*from.y+2*u*k*apex.y+k*k*end.y,height:noriLerp(from.height,end.height,e),angle:720*(1-e)};},{trail:true});
    }
    // 2400: caught (the sheet's clock shows the catch now); the renewal flows into him.
    await at(T.catch);root.dataset.ragePhase='catch';giant?.node.remove();giant=null;
    playCastSound('earth','f2-catch',{volume:.6,pan:-.2});
    await at(T.catch+60);noriRenewalStream(me,pending);noriRenewal(kit,pending);
    await at(3000);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{
    await Promise.allSettled(pending);thrown?.node.remove();giant?.node.remove();shadow?.remove();
    delete root.dataset.ragePhase;delete root.dataset.noriUltimate;root.classList.remove('combat-v3-acting');root.style.zIndex=oldZ;target.style.translate='';
    $('combatEffects').querySelectorAll('.nori-fx').forEach(n=>n.remove());document.querySelectorAll('.actor > .nori-fx.under').forEach(n=>n.remove());setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
const noriLerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
