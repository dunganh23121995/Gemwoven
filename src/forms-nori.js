/* Nori's star forms (hero-kits.js). Form 1 keeps Mộc Linh Hộ Thể as self-buffs.js stages it. The later
 * forms stage their ultimate with Nori's own moves and art (assets/fx/heroes/earth, ART.heroFx.earth):
 * he raises the hammer to the sky (the healing spiral), charges in behind the shield, bashes the foe,
 * then brings the hammer down on the ground and roots burst up from the foe's own feet and lock it in
 * a cage (the stun) while the world-tree rises behind it (six stars). Four stars (noriJadeUltimate) is its
 * own, lighter jade skill: one blow on the spot, a jade fissure and a jade sapling binding the foe.
 * He steps back in guard as the renewal starts. The rules are noriRenewalUltimate's, unchanged: the same stun, damage seal and
 * renewal turns from progressionKit('earth'), no direct damage; Biến Dị's armour still comes from the
 * progression wrapper, which these forms run inside (as Yuki's do).
 * The basic attack keeps the shared hammer leap; its ground crater becomes a jade quake at the foe's
 * feet, and the six-star sword crescent of the shared form wrapper is left out (Nori swings a hammer). */
const noriRenewalForm1=noriRenewalUltimate;
noriRenewalUltimate=async function(){
  const form=combatHeroForm('earth');
  return form===3?noriFormUltimate(3):form===2?noriJadeUltimate():noriRenewalForm1();
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
HERO_KITS.earth={forms:{
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
// One authored strip (ART.heroFx.earth[name]) standing on a ground point: the strip's own anchor
// (anchorX, foot) lands on (x, feet). Behind=true puts it under the actors (the world-tree rises
// behind the foe); otherwise it is drawn over them.
function noriStrip(name,{x,feet,width,behind=false,className=''}){
  const sheet=ART.heroFx?.earth?.[name];if(!sheet||reduced)return null;
  let parent=$('combatEffects');
  if(behind){
    parent=$('scene').querySelector('.nori-fx-back');
    if(!parent){parent=document.createElement('span');parent.className='nori-fx-back';parent.setAttribute('aria-hidden','true');$('scene').append(parent);}
  }
  const height=width/(sheet.aspect||1);
  const node=document.createElement('span');node.className=`nori-fx nori-fx-${name} ${className}`;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x-width*(sheet.anchorX??.5)}px;top:${feet-height*(sheet.foot??1)}px;width:${width}px;height:${height}px;--fx-count:${sheet.count};background-image:url('${sheet.src}')`;
  parent.append(node);
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
  // erupt fast, hold the closed cage, crumble
  roots:[[0,60],[1,60],[2,70],[3,90],[4,150],[3,120],[4,150],[3,110],[4,140],[5,90],[6,90],[7,90]],
  tree:[[0,80],[1,80],[2,90],[3,110],[4,170],[3,110],[4,170],[5,110],[6,110],[7,110]],
  quake:[[0,50],[1,50],[2,55],[3,65],[4,65],[5,65],[6,60],[7,60]],
  fissure:[[1,45],[2,45],[3,55],[5,55],[6,50],[7,45]],
  // burst, bind and hold (vines tight, sapling open), shatter
  jade:[[0,50],[1,60],[2,70],[3,90],[4,170],[3,90],[4,190],[5,110],[6,100],[7,90]]
};

// The basic attack's ground crater (combat-v3 calls it at the hammer's contact) becomes the jade quake
// strip on the foe's real feet for the star forms.
const noriCraterBase=combatV3Earth;
combatV3Earth=function(point,ultimate,pending){
  if(!noriKitAttacking||!ART.heroFx?.earth?.quake||reduced)return noriCraterBase(point,ultimate,pending);
  const foe=noriFoeBody(),form=combatHeroForm('earth'),width=Math.max(90,Math.min(foe.width*.95,170))*(form===3?1.1:1);
  const strip=noriStrip('quake',{x:foe.x,feet:foe.feet,width,className:'form-'+form});
  if(strip)pending.push(strip.play(NORI_SEQUENCE.quake,120));
};

// Sounds (scripts/prepare_nori_form_sounds.py), built like Yuki's: a few clean real recordings, each the literal
// sound of its motion with its natural attack and decay (leaves swirling up, the whoosh, the hammer thudding into
// the earth, splintering roots, the jade shatter, the creaking tree, falling leaves; form 1's own shield bash), and
// the slam is the loudest moment, a deep boom ringing out ~4 s under it to the end of the ultimate.
function noriWarmSounds(names){const audio=combatV3AudioContext();if(audio)for(const name of names)decodeCastSound(audio,'earth-'+name).catch(()=>{});}
// a cue `delay` ms from now (its own clock, so a beat never waits on the staging's awaits)
function noriCue(pending,name,delay,volume,pan=.3){pending.push(wait(reduced?0:delay).then(()=>playCastSound('earth',name,{volume,pan})));}

// ---- Ngọc Thụ Hộ Thể (four stars) -----------------------------------------------------------------
// Nori stays in his place: he raises the hammer in the healing spiral and drives it into the ground;
// a jade fissure runs along the ground to the foe, and a jade sapling bursts at the foe's feet, its
// glossy jade vines binding it (the stun) among jade crystal shards. Quicker and lighter than the six-
// star world-tree: no shield rush, one blow, the bind and the renewal. Same rules as noriFormUltimate.
async function noriJadeUltimate(){
  if(state.hp<=0)return;
  noriWarmSheets(2);noriWarmSounds(['f2-swirl','f2-swing','f2-strike','f2-rubble','f2-vines','f2-clink','f2-shatter']);
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),oldTarget=target.style.transform,oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  root.dataset.ragePhase='chant';root.dataset.noriUltimate='2';root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    // Four-star sounds (f2-*): stone/jade wind chimes, a swish, a heavy thump on stone with stone debris
    // crumbling under it to the end, a plant stalk snapping, a ringing ceramic clink, pottery shattering and
    // settling (scripts/prepare_nori_form_sounds.py).
    combatVoice('hero','cast');playCastSound('earth','f2-swirl',{volume:.55,pan:-.2});
    popActorSkill('hero',HEROES.earth.skill,true,pending);
    pending.push(selfBuffSpiral('heal',1100));
    setSpriteFrame('hero','cast',0);await at(220);setSpriteFrame('hero','cast',1);
    await at(480);setSpriteFrame('hero','cast',2);
    // One blow into the ground in front of him.
    await at(760);root.dataset.ragePhase='hammer';setSpriteFrame('hero','attack',2);
    playCastSound('earth','f2-swing',{volume:.45,pan:-.2});
    await at(900);root.dataset.ragePhase='slam';setSpriteFrame('hero','attack',3);
    // the strike, and the ground cracking open under it as the crack runs to the foe (rings out to the end)
    playCastSound('earth','f2-strike',{volume:.95,pan:-.1});playCastSound('earth','f2-rubble',{volume:.5,pan:.1});combatV3Camera(1,true,false,pending);
    const scene=$('scene').getBoundingClientRect(),sprite=root.querySelector('.sprite-body').getBoundingClientRect();
    const ground=sprite.top-scene.top+sprite.height*(spriteDefinition('hero','earth','idle').sheet.footY||.94),hammerX=sprite.left-scene.left+sprite.width*.86;
    const slam=noriStrip('quake',{x:hammerX,feet:ground,width:Math.min(100,sprite.width*.7),className:'form-2'});
    if(slam)pending.push(slam.play(NORI_SEQUENCE.quake,120));
    // The jade fissure: small crystal bursts racing along the ground line to the foe's feet.
    const foe=noriFoeBody(),reach=foe.x-foe.width*.35-hammerX,steps=Math.max(1,Math.min(4,Math.round(reach/55)));
    for(let i=1;i<=steps;i++){
      const x=hammerX+reach*i/(steps+.4),y=ground+(foe.feet-ground)*i/(steps+.4);
      pending.push(wait(reduced?0:70*i).then(()=>{const shard=noriStrip('quake',{x,feet:y,width:Math.min(70,sprite.width*.5),className:'form-2 fissure'});return shard?.play(NORI_SEQUENCE.fissure,90);}));
    }
    // The jade sapling bursts at the foe's feet and binds it.
    await at(900+70*steps+60);root.dataset.ragePhase='bind';setSpriteFrame('hero','attack',4);
    // the vines snap up, lock with a jade clink as the sapling opens (strip frame 4), then shatter and settle (frame 5)
    playCastSound('earth','f2-vines',{volume:.9,pan:.3});noriCue(pending,'f2-clink',270,.7);noriCue(pending,'f2-shatter',710,.65);
    const foeNow=noriFoeBody(),width=Math.max(110,Math.min(foeNow.width*1.45,scene.width*.6));
    const jade=noriStrip('jade',{x:foeNow.x,feet:foeNow.feet,width,className:'form-2'});
    if(jade)pending.push(jade.play(NORI_SEQUENCE.jade,200));
    if(state.enemyHp>0){
      state.noriStunTurns=kit.stun;state.noriStoredDamage=state.noriStoredDamage||0;state.stunned=true;setSpriteAction('enemy','hurt',330);combatVoice('enemy','hurt');
      popActorSkill('enemy','CHOÁNG · '+kit.stun+' LƯỢT',false,pending);
      if(!reduced)pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(0px,-5px)',offset:.25},{transform:'translate(0px,1px)',offset:.55},{transform:oldTarget||'none'}],{duration:420,easing:'ease-out'}));
    }
    // Renewal: he rises back into guard as the healing turns start.
    await at(1500);root.dataset.ragePhase='renewal';setSpriteFrame('hero','attack',5);
    state.noriRegenTurns=kit.regenTurns;update();combatVoice('hero','release');combatV3BuffSound('heal');
    popActorSkill('hero','Hồi phục · '+kit.regenTurns+' lượt',false,pending);
    await at(1900);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',5);
    await at(2700);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{
    await Promise.allSettled(pending);delete root.dataset.ragePhase;delete root.dataset.noriUltimate;root.classList.remove('combat-v3-acting');root.style.zIndex=oldZ;target.style.transform=oldTarget;
    setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Vạn Mộc Thiên Thành (six stars) --------------------------------------------------------------
async function noriFormUltimate(form){
  if(state.hp<=0)return;
  noriWarmSheets(form);
  noriWarmSounds(['gather','rush','bash','swing','slam','boom','roots','tree','leaves']);
  const start=performance.now(),pending=[],root=actor('hero'),target=actor('enemy'),old=root.style.transform,oldTarget=target.style.transform,oldZ=root.style.zIndex,kit=progressionKit('earth');
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const six=form===3;
  root.dataset.ragePhase='chant';root.dataset.noriUltimate=String(form);root.classList.add('combat-v3-acting');root.style.zIndex='4';
  try{
    // Chant: the hammer rises to the sky inside the healing spiral.
    combatVoice('hero','cast');playCastSound('earth','gather',{volume:.55,pan:-.2});
    popActorSkill('hero',HEROES.earth.skill,true,pending);
    pending.push(selfBuffSpiral('heal',1250));
    setSpriteFrame('hero','cast',0);await at(260);setSpriteFrame('hero','cast',1);
    await at(560);setSpriteFrame('hero','cast',2);
    // Shield charge: he stops with his shield on the foe's drawn front, however big the foe is.
    await at(950);root.dataset.ragePhase='shield-rush';setSpriteFrame('hero','cast',3);
    const scene=$('scene').getBoundingClientRect(),cell=root.getBoundingClientRect(),foe=noriFoeBody();
    const shieldFront=cell.left-scene.left+cell.width*.84,travel=Math.max(0,foe.left+foe.width*.06-shieldFront);
    pending.push(animate(root,[{transform:old||'none'},{transform:`translate(${travel}px,0px)`}],{duration:reduced?1:300,easing:'cubic-bezier(.5,0,.2,1)'}));
    root.style.transform=`translate(${travel}px,0px)`;playCastSound('earth','rush',{volume:.4,pan:0});
    // Shield bash.
    await at(1250);root.dataset.ragePhase='bash';setSpriteFrame('hero','cast',4);
    playCastSound('earth','bash',{volume:.6,pan:.2});combatV3Camera(1,false,false,pending);
    if(state.enemyHp>0&&!reduced)pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(10px,-2px) rotate(3deg)',offset:.3},{transform:oldTarget||'none'}],{duration:300,easing:'ease-out'}));
    // The hammer comes down: roots burst from the foe's feet and cage it (the stun).
    await at(1390);root.dataset.ragePhase='hammer';setSpriteFrame('hero','attack',1);
    await at(1500);setSpriteFrame('hero','attack',2);playCastSound('earth','swing',{volume:.5,pan:.1});
    await at(1620);root.dataset.ragePhase='slam';setSpriteFrame('hero','attack',3);
    // the slam with the deep boom under it (faded within ~1 s: no long ring-out); the roots splinter up and lock (cage frames 0-4), the tree
    // creaks up (tree frames 0-4), the crown sheds its leaves (tree frame 5 on)
    playCastSound('earth','slam',{volume:.9,pan:.15});playCastSound('earth','boom',{volume:.8,pan:.1});combatV3Camera(1,true,state.boss,pending);
    noriCue(pending,'roots',70,.75);noriCue(pending,'tree',60,.5);noriCue(pending,'leaves',810,.5);
    const hammerX=cell.left-scene.left+travel+cell.width*(six?.84:.88),ground=cell.top-scene.top+cell.height*.93;
    const quake=noriStrip('quake',{x:hammerX,feet:ground,width:Math.min(110,cell.width*.75),className:'form-'+form});
    if(quake)pending.push(quake.play(NORI_SEQUENCE.quake,120));
    const foeNow=noriFoeBody();
    const cage=noriStrip('roots',{x:foeNow.x,feet:foeNow.feet,width:Math.max(120,Math.min(foeNow.width*1.35,scene.width*.6)),className:'form-'+form});
    if(cage)pending.push(wait(reduced?0:70).then(()=>cage.play(NORI_SEQUENCE.roots,220)));
    if(six){
      // A tree well above the foe (the foe's name and health bar stay drawn over it), its crown under the arena top.
      const height=Math.max(150,Math.min(foeNow.feet-scene.height*.04,Math.max(foeNow.height*2.1,scene.height*.62))),sheet=ART.heroFx?.earth?.tree;
      const tree=noriStrip('tree',{x:foeNow.x,feet:foeNow.feet,width:height/(sheet?.foot??.94),behind:true});
      if(tree)pending.push(tree.play(NORI_SEQUENCE.tree,260));
      const flash=document.createElement('span');flash.className='form-skill-flash earth';flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
      pending.push(animate(flash,[{opacity:0},{opacity:.55,offset:.25},{opacity:0}],{duration:reduced?1:520}).finally(()=>flash.remove()));
    }
    if(state.enemyHp>0){
      state.noriStunTurns=kit.stun;state.noriStoredDamage=state.noriStoredDamage||0;state.stunned=true;setSpriteAction('enemy','hurt',330);combatVoice('enemy','hurt');
      popActorSkill('enemy','CHOÁNG · '+kit.stun+' LƯỢT',false,pending);
    }
    await at(1780);setSpriteFrame('hero','attack',4);
    // Renewal: the healing turns start as he rises back into guard.
    await at(1960);root.dataset.ragePhase='renewal';setSpriteFrame('hero','attack',5);
    state.noriRegenTurns=kit.regenTurns;update();combatVoice('hero','release');combatV3BuffSound('heal');
    popActorSkill('hero','Hồi phục · '+kit.regenTurns+' lượt',false,pending);
    await at(2300);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',5);
    pending.push(animate(root,[{transform:root.style.transform},{transform:old||'none'}],{duration:reduced?1:420,easing:'ease-in-out'}));root.style.transform=old;
    await at(3000);await Promise.all(pending);
    return {amount:0,blocked:0};
  }finally{
    await Promise.allSettled(pending);delete root.dataset.ragePhase;delete root.dataset.noriUltimate;root.classList.remove('combat-v3-acting');root.style.transform=old;root.style.zIndex=oldZ;target.style.transform=oldTarget;
    $('scene').querySelector('.nori-fx-back')?.replaceChildren();setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
