/* Hiro's star forms (hero-kits.js). Form 1 keeps Kiếm Nhiệt Huyết (forms-tan.js, locked). The later forms stage
 * their own ultimates with their own skill poses ("skill" sheets in assets/heroes/forms/novice/forms.json) and
 * their own art (assets/fx/heroes/novice f2-*, f3-*: ART.heroFx.novice):
 *  - four-star Lữ Kiếm Liên Trảm, the wandering swordsman: the traveller's wind whirls leaves round his boots as he
 *    drops into a low stance, he dashes in on the wind, cuts across the foe, cuts up through it, and brings the
 *    steel sword down into a cross cut that bursts into wind and leaves;
 *  - six-star Diệu Ngọc Tứ Hệ Trảm, the plain knight (no element of his own: four small dull stones in his guard):
 *    he raises the longsword and four dull motes ride thin wind lines into its tip; the ground cracks under the
 *    foe, he steps in and sweeps a big steel crescent down through it, a ring of dust rises round the foe and the
 *    blow lands. Plain since the redesign (owner 07/11: "cơ bản, không rực rỡ", the free starter): no glow on the
 *    blade or the foe, no gold flash, no crystal.
 * The rules are the plain ultimate's, unchanged (progressionNoviceUltimate in progression-combat.js, reached through
 * formOriginalUltimate() inside the progression wrapper, so form power, the Tứ Hệ signature and the Báu vật effects
 * still apply): for each of the kit's hits, damage('hero',kit.base/hits) exactly as attack('hero',kit.base,{hits})
 * resolved it (attack chain 1, no ledger). Only the staging is new; Hiro is the free starter and gains no power.
 * The basic attacks keep the shared attack() and its numbers; only the drawn arc is the form's own. The departure
 * keeps the shared run (six-star footprints: DEPART_FX.novice.byForm in hero-departures.js). */
HERO_KITS.novice={forms:{...HERO_KITS.novice.forms,
  2:{ultimate:()=>formOriginalUltimate(),attack:(raw,options)=>hiroStarAttack(2,raw,options)},
  // The six-star longsword draws its own steel crescent (hiroBasicSlash), not the shared form-3 arc.
  3:{ultimate:()=>formOriginalUltimate(),attack:(raw,options)=>hiroStarAttack(3,raw,options)}
}};
const hiroPlainUltimate=progressionNoviceUltimate;
progressionNoviceUltimate=async function(kit){
  const form=state.key==='novice'?combatHeroForm('novice'):1;
  if(window.hiroQAPlain)return hiroPlainUltimate(kit);   // QA: the unstaged ultimate, to compare the damage
  if(form===2)return hiroChainSlash(kit);
  if(form===3)return hiroJewelSlash(kit);
  return hiroPlainUltimate(kit);
};

// ---- Placement ------------------------------------------------------------------------------------
// The foe's drawn body (its idle sheet's span/feet/height) in scene pixels, not its whole sprite cell.
function hiroFoeBody(){
  const target=actor('enemy'),scene=$('scene').getBoundingClientRect(),cell=target.getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,feet=cell.top-scene.top+cell.height*foot;
  return {x:(left+right)/2,left,right,feet,top,width:right-left,height:feet-top,y:(top+feet)/2};
}
// The lowest scene pixel of an actor's name and HP bars (they follow its head; the foe's by default): tall effects
// stay under it.
function hiroHudFloor(id='enemyHeadHud'){
  const hud=$(id),scene=$('scene').getBoundingClientRect(),r=hud?.getBoundingClientRect();
  return r&&r.height?r.bottom-scene.top+4:0;   // also while it is about to show (right after a stage starts)
}
// Hiro's own sprite cell and drawn body in scene pixels; `at(fx,fy)` turns a point of his 512 px cell into the scene.
function hiroHeroBody(){
  const sprite=actor('hero').querySelector('.sprite-body'),scene=$('scene').getBoundingClientRect(),r=spriteBaseRect(sprite);
  const look=spriteDefinition('hero','novice','idle').sheet,foot=look.footY||.94,height=r.height*(look.bodyHeight||.69);
  const feet=r.top-scene.top+r.height*foot;
  return {x:r.left-scene.left+r.width*(look.feetX??.47),feet,top:feet-height,height,width:r.width*.55,
    at:(fx,fy)=>({x:r.left-scene.left+r.width*fx,y:r.top-scene.top+r.height*fy})};
}
// One authored FX strip (ART.heroFx.novice[name]) placed by its width: on a ground line (`feet`: the strip's own
// foot line lands there) or centred on `y`; `rotate` turns it about its centre. Frames are stepped explicitly
// so a sequence can hold a pose (the X before it bursts, the dust ring at its height).
function hiroStrip(name,{x,y,feet,width,rotate=0,parent=null,className=''}){
  const sheet=ART.heroFx?.novice?.[name];if(!sheet||reduced)return null;
  const height=width/sheet.aspect,top=feet!=null?feet-height*(sheet.foot??1):y-height/2;
  const node=document.createElement('span');node.className=`hiro-fx hiro-fx-${name} ${className}`;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x-width/2}px;top:${top}px;width:${width}px;height:${height}px;--fx-count:${sheet.count};background-image:url('${sheet.src}');rotate:${rotate}deg`;
  (parent||$('combatEffects')).append(node);
  let token=0;
  const set=i=>{const f=Math.max(0,Math.min(sheet.count-1,i));node.style.backgroundPosition=`${sheet.count>1?f/(sheet.count-1)*100:0}% 0`;};set(0);
  return {node,sheet,height,top,set,
    async play(from,to,ms=sheet.frameDuration){const mine=++token;for(let i=from;i<=to&&node.isConnected&&mine===token;i++){set(i);if(i<to)await wait(ms);}},
    loop(from,to,ms=sheet.frameDuration){const mine=++token;(async()=>{let i=from;while(node.isConnected&&mine===token){set(i);await wait(ms);i=i>=to?from:i+1;}})();},
    stop(){token++;},
    fade(ms,pending,extra={}){token++;const job=animate(node,[{opacity:getComputedStyle(node).opacity},{opacity:0,...extra}],{duration:ms,easing:'ease-in',fill:'forwards'}).finally(()=>node.remove());pending?.push(job);return job;},
    remove(){token++;node.remove();}};
}
// An afterimage of his current pose left behind on the dash, tinted by the form (wind green, plain steel grey).
function hiroEcho(pending,delay,kind){
  if(reduced)return;
  const root=actor('hero'),rect=root.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const node=document.createElement('span');node.className='hiro-echo '+kind;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${rect.left-scene.left}px;top:${rect.top-scene.top}px;width:${rect.width}px;height:${rect.height}px`;
  const sprite=root.querySelector('.sprite-body').cloneNode(true);sprite.removeAttribute('role');sprite.removeAttribute('aria-label');node.append(sprite);$('combatEffects').append(node);
  pending.push(animate(node,[{opacity:.5,translate:'0 0'},{opacity:0,translate:'-18px 0'}],{duration:300,delay,easing:'ease-out',fill:'both'}).finally(()=>node.remove()));
}
function hiroFlash(kind,pending){
  if(reduced)return;
  const flash=document.createElement('span');flash.className='hiro-flash '+kind;flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
  pending.push(animate(flash,[{opacity:0},{opacity:.6,offset:.2},{opacity:0}],{duration:440}).finally(()=>flash.remove()));
}
// The whole stage jolts on the finishing blow (heavier for the six-star cut).
function hiroShake(force,pending){
  if(reduced)return;
  const f=force;
  pending.push(animate($('scene'),[{translate:'0px 0px'},{translate:`${-7*f}px ${9*f}px`,offset:.07},{translate:`${7*f}px ${-5*f}px`,offset:.18},{translate:`${-4*f}px ${4*f}px`,offset:.32},{translate:`${3*f}px ${-2*f}px`,offset:.5},{translate:'0px 0px'}],{duration:500,easing:'ease-out'}));
}
// A cut lands: the foe flinches under it (four-star cuts resolve their part of the damage with it, 14/11).
function hiroFlinch(target,pending){
  setSpriteAction('enemy','hurt',240);
  if(reduced)return;
  const old=target.style.transform||'translate(0px,0px)';
  pending.push(animate(target,[{transform:old},{transform:'translate(6px,-2px) rotate(1.5deg)',offset:.3},{transform:old}],{duration:220,easing:'ease-out'}));
}

// ---- Sounds ---------------------------------------------------------------------------------------
// A few well-spaced cues, each ONE natural recording: form 1's own (novice-charge-cry, dash-steps, dash-rush) as
// the backbone, plus the forms' new ones (scripts/prepare_hiro_star_form_sounds.py, novice-stars-manifest.json).
// With reduced motion the timeline collapses, so only the hit is heard. window.hiroSoundLog (QA) records each
// with the phase it fell in.
function hiroScore(at,pending,hit,cues){
  const context=combatV3AudioContext();   // decoded up front, as form 1's, so the first beats are not late
  if(context)for(const name of new Set([hit,...cues.map(c=>c[1])].filter(Boolean)))decodeCastSound(context,'novice-'+name).catch(()=>{});
  if(reduced)return;
  for(const [ms,name,volume,pan] of cues)pending.push(at(ms).then(()=>hiroSound(name,{volume,pan})));
}
function hiroSound(name,{volume=.5,pan=0,hit=false}={}){
  if(reduced&&!hit)return;
  window.hiroSoundLog?.push([name,Math.round(performance.now()),actor('hero').dataset.ragePhase]);
  playCastSound('novice',name,{volume,pan});
}

// ---- Shared staging and the plain ultimate's hits ------------------------------------------------------
function hiroTimeline(){
  const start=performance.now();
  return async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
}
function hiroMover(root){
  return async(x,y,duration,easing='ease-in-out')=>{
    if(reduced){root.style.transform=`translate(${x}px,${y}px)`;return;}
    const from=root.style.transform||'translate(0px,0px)',to=`translate(${x}px,${y}px)`;
    await animate(root,[{transform:from},{transform:to}],{duration,easing});root.style.transform=to;
  };
}
// How far he dashes: until a cut about 80% across his cell meets the front of the foe's drawn body.
function hiroReach(share=.3){
  const hero=combatV3Point('hero'),body=hiroFoeBody();
  return Math.max(0,Math.min(body.left+body.width*share-(hero.x-hero.width*.5+hero.width*.8),$('scene').clientWidth-hero.x-hero.width*.4));
}
// The plain ultimate's hits, unchanged: attack('hero',kit.base,{hits}) resolved each as damage('hero',kit.base/hits).
// `share` (four-star chain, owner 14/11: "Tuyệt kỹ tung nhiều đòn đánh, khi cuối lại mới có âm thanh địch bị thương thì hơi vô
// lý") resolves only that part of the total on this blow, so every cut that lands hurts and is heard (the parts sum to 1).
function hiroHits(kit,pending,sound,share=1,index=0){
  const hits=Math.max(1,Math.min(8,Math.round(kit.hits)||1));let amount=0,blocked=0;
  for(let i=0;i<hits;i++){
    const result=damage('hero',kit.base*share/hits,null);amount+=result.amount;blocked+=result.blocked;
    combatVoice('enemy','hurt');hitAccents('hero',result,false,pending);setSpriteAction('enemy','hurt',560);
    combatV3Number('enemy',result.stored?'TÍCH +'+result.stored:result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.stored?'stored':result.amount?'damage':'armor',index+i,pending);
  }
  if(sound)hiroSound(sound,{volume:.8,pan:.25,hit:true});
  update();
  return {amount,blocked};
}
function hiroOpen(root,form,pending){
  root.classList.add('combat-v3-acting','hiro-star','hiro-f'+form);root.style.zIndex='4';
  popActorSkill('hero',HEROES.novice.skill,true,pending);combatVoice('hero','cast');
}
function hiroClose(root,target,old,oldZ,form){
  root.style.transform=old;root.style.zIndex=oldZ;target.style.filter='';target.style.transform='';
  delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting','hiro-star','hiro-f'+form);
  if(state.hp>0)setSpriteAction('hero','idle');if(state.enemyHp>0)setSpriteAction('enemy','idle');update();
}
// A light hop back to his place, sword still out.
async function hiroHopBack(root,from){
  if(!reduced)await animate(root,[{transform:`translate(${from}px,0px)`},{transform:`translate(${from*.5}px,-16px)`,offset:.5},{transform:'translate(0px,0px)'}],{duration:380,easing:'ease-in-out'});
  root.style.transform='translate(0px,0px)';
}

// ---- Four-star: Lữ Kiếm Liên Trảm ------------------------------------------------------------------
async function hiroChainSlash(kit){
  if(state.hp<=0||state.enemyHp<=0)return;
  const root=actor('hero'),target=actor('enemy'),pending=[],at=hiroTimeline(),move=hiroMover(root),W=$('scene').clientWidth;
  const old=root.style.transform,oldZ=root.style.zIndex;
  let gale=null,cuts=[],cross=null,result={amount:0,blocked:0};
  // ms from the cast; the swings peak 100 ms in, the body hit 80 ms in (prepare_hiro_star_form_sounds.py PLAYS[2]).
  hiroScore(at,pending,null,[
    [0,'f2-gust',.5,-.2],        // the traveller's wind whirls up round his boots
    [60,'charge-cry',.55,-.2],   // form 1's battle cry as he plants his feet
    [740,'dash-steps',.5,0],     // form 1's strides: the dash
    [760,'dash-rush',.5,.1],     // form 1's rush of his clothes over the dash
    [930,'f2-swing',.5,.2],      // first cut (1000 ms)
    [1190,'f2-swing-up',.5,.2],  // rising cut (1260 ms)
    [1450,'f2-swing',.55,.25]]); // the finishing cut (1520 ms); the cross bursts on the damage (1780 ms) without a body thud (owner 13/11)
  root.dataset.ragePhase='stance';
  try{
    hiroOpen(root,2,pending);setSpriteFrame('hero','skill',0);
    // The wind whirls round his boots (inside his actor, so it moves with him until he dashes off it).
    const hero=hiroHeroBody(),box=root.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
    gale=hiroStrip('f2-gale',{x:hero.x-(box.left-scene.left),feet:hero.feet+6-(box.top-scene.top),width:hero.height*1.3,parent:root,className:'hiro-gale'});
    if(gale){gale.loop(0,5,80);pending.push(animate(gale.node,[{opacity:0,scale:'.7 .5'},{opacity:1,scale:'1 1'}],{duration:300,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'}));}
    await at(420);root.dataset.ragePhase='ready';setSpriteFrame('hero','skill',1);await move(-6,0,200,'ease-out');
    const near=hiroReach(.32);
    await at(760);root.dataset.ragePhase='dash';
    if(gale){const g=gale;gale=null;g.fade(160,pending);}
    for(let i=0;i<3;i++)hiroEcho(pending,i*55,'wind');
    await move(near,0,200,'cubic-bezier(.5,0,.7,1)');
    const foe=hiroFoeBody(),size=Math.min(W*.62,Math.max(150,foe.width*1.5,foe.height*1.1));
    // First cut: straight across the foe's chest.
    await at(980);root.dataset.ragePhase='cut';setSpriteFrame('hero','skill',2);
    const inside=(x,w)=>Math.min(x,W-6-w/2);   // a cut's tapered tip stays inside the arena
    // His pose is the follow-through of a wide sweep (skill frame 2: the blade drawn level across his body at waist
    // height, his sword hand at about 72% x 62% of his cell): the arc starts at his hand and sweeps on through the foe.
    const blade=hiroHeroBody().at(.645,.563),cutWidth=Math.max(size,(foe.right-blade.x)*1.25);
    const cut1=hiroStrip('f2-slash',{x:inside(blade.x+cutWidth*.36,cutWidth),y:blade.y-cutWidth/ART.heroFx.novice['f2-slash'].aspect*.4,width:cutWidth,rotate:4});
    if(cut1){cuts.push(cut1);cut1.play(0,5,45).then(()=>cut1.fade(90,pending));}
    hiroFlinch(target,pending);let landed=hiroHits(kit,pending,null,.25,0);
    // Second cut: up through it from low behind to high in front.
    await at(1240);root.dataset.ragePhase='rise';setSpriteFrame('hero','skill',3);await move(near,-6,90,'ease-out');
    const cut2=hiroStrip('f2-slash',{x:inside(foe.x+foe.width*.04,size*.8),y:foe.top+foe.height*.42,width:size,rotate:-38});
    if(cut2){cuts.push(cut2);cut2.play(0,5,45).then(()=>cut2.fade(90,pending));}
    hiroFlinch(target,pending);const second=state.enemyHp>0?hiroHits(kit,pending,null,.25,1):{amount:0,blocked:0};
    // The finishing cut lays an X over the foe; it holds, then bursts on the hit.
    await at(1500);root.dataset.ragePhase='finish';setSpriteFrame('hero','skill',4);move(near,0,80,'ease-in');
    const crossY=foe.top+foe.height*.5;
    cross=hiroStrip('f2-cross',{x:foe.x,y:crossY,width:Math.min(W*.6,Math.max(130,foe.height*1.15,foe.width*1.2),2*(crossY-hiroHudFloor()))});
    cross?.play(0,3,70);
    await at(1780);root.dataset.ragePhase='burst';
    cross?.play(4,7,75);
    const last=state.enemyHp>0?hiroHits(kit,pending,null,.5,2):{amount:0,blocked:0};
    result={amount:landed.amount+second.amount+last.amount,blocked:landed.blocked+second.blocked+last.blocked};
    combatV3Camera(1,true,state.boss,pending);hiroShake(state.boss?1.1:.85,pending);hiroFlash('wind',pending);
    if(!reduced){
      target.style.filter='brightness(1.35)';
      const recoil=combatOuterMotion('enemy',14,6);
      await combatV3Pose(target,`translate(${recoil.distance}px,-4px) rotate(${recoil.tilt}deg)`,80);
    }
    await at(2000);target.style.filter='';combatV3Pose(target,'translate(0px,0px) rotate(0deg)',280);
    root.dataset.ragePhase='settle';setSpriteFrame('hero','skill',5);
    await at(2200);root.dataset.ragePhase='return';cross?.fade(160,pending);cross=null;
    await hiroHopBack(root,near);
    await at(2700);await Promise.all(pending);
    return result;
  }finally{
    await Promise.allSettled(pending);gale?.remove();cross?.remove();for(const c of cuts)c.remove();
    hiroClose(root,target,old,oldZ,2);
  }
}

// ---- Six-star: Diệu Ngọc Tứ Hệ Trảm ----------------------------------------------------------------
async function hiroJewelSlash(kit){
  if(state.hp<=0||state.enemyHp<=0)return;
  const root=actor('hero'),target=actor('enemy'),pending=[],at=hiroTimeline(),move=hiroMover(root),W=$('scene').clientWidth;
  const old=root.style.transform,oldZ=root.style.zIndex;
  let hilt=null,cleave=null,split=null,result={amount:0,blocked:0};
  // (redo 13/11, owner: "Làm lại cả hiro 3 ... Âm thanh nghe không hay, xấu ... Hình ảnh hoạt ảnh cũng sơ sài"; Codex's
  // design: the weight of a steel longsword) the four hilt stones wake with a steel ring, he draws the sword back, steps
  // in and a giant translucent steel blade cleaves down: the blow lands at 1400 ms (the damage, moved from 1950 so it
  // falls on the cut: same hits, same total), the ground splits and a low dust wave throws stones; he holds, then guards.
  hiroScore(at,pending,'f3-bhit',[
    [0,'f3-steel',.45,-.2],      // the long blade rings as the hilt stones wake (peaks ~160 ms)
    [60,'charge-cry',.55,-.2],   // form 1's battle cry as he raises the sword
    [1150,'dash-steps',.45,0],   // form 1's strides: he steps in
    [1250,'f3-heavy',.5,.15]]);  // the heavy blade tears the air, peaking just before the blow (the blow plays with the damage)
  root.dataset.ragePhase='raise';
  try{
    hiroOpen(root,3,pending);setSpriteFrame('hero','skill',0);
    // The four hilt stones wake in turn at his hands (his raised guard), small and restrained.
    const hero=hiroHeroBody(),guard=hero.at(.555,.5),hiltWidth=hero.height*.62;
    hilt=hiroStrip('f3-hilt',{x:guard.x,y:guard.y,width:hiltWidth,className:'hiro-hilt'});
    if(hilt)pending.push((async()=>{await wait(reduced?0:140);await hilt?.play(0,5,95);})());
    await at(620);root.dataset.ragePhase='salute';setSpriteFrame('hero','skill',1);
    await at(860);hilt?.play(6,7,90);
    await at(900);root.dataset.ragePhase='coil';setSpriteFrame('hero','skill',2);hilt?.fade(120,pending);hilt=null;await move(-6,0,160,'ease-out');
    // He steps in, the sword loaded behind his shoulder; a puff of dust off his rear boot.
    const near=hiroReach(.05)*.75;
    await at(1150);root.dataset.ragePhase='step';setSpriteFrame('hero','skill',3);
    const boots=hiroHeroBody(),dust=hiroStrip('f3-dust',{x:boots.x-boots.width*.2,feet:boots.feet+2,width:boots.height*.75,className:'hiro-dust'});
    if(dust){const d=dust;d.play(0,7,55).then(()=>d.remove());}
    hiroEcho(pending,0,'steel');
    await move(near,-6,220,'cubic-bezier(.4,0,.6,1)');
    // 1300: the steel blade-aura sweeps down from above him through the foe (its lower end lands on the foe).
    const foe=hiroFoeBody(),hud=hiroHudFloor();
    const size=Math.min(W*.86,Math.max(foe.height*2,boots.height*1.9,200),(foe.feet+16-hud)*1.12);
    // (Codex 13/11) its contact frame (3: the blade's tip bursts into sparks) shows at 1400, with the damage
    await at(1270);root.dataset.ragePhase='cut';
    cleave=hiroStrip('f3-cleave',{x:foe.x-size*.2,y:foe.feet+16-size*.56,width:size,className:'hiro-cleave'});
    if(cleave){const c=cleave;pending.push((async()=>{await c.play(0,2,40);await wait(50);if(!c.node.isConnected)return;c.set(3);await wait(130);await c.play(4,7,70);await wait(70);if(c.node.isConnected)c.fade(120,pending);})());}
    // 1400: the blow lands (the damage, the strongest beat): the ground splits under the foe, a low dust wave.
    await at(1400);root.dataset.ragePhase='hit';setSpriteFrame('hero','skill',4);move(near,0,90,'ease-in');
    const splitWidth=Math.min(W*.78,Math.max(foe.width*1.9,170));
    split=hiroStrip('f3-split',{x:foe.x,feet:foe.feet+4,width:splitWidth,className:'hiro-split'});
    if(split){const t=split;pending.push((async()=>{await t.play(0,1,35);await wait(35);await t.play(2,7,95);})());}
    result=hiroHits(kit,pending,'f3-bhit');   // the ringing steel hit (owner 14/11: the ultimate's and the basic cut's hits swapped)
    combatV3Camera(1,true,state.boss,pending);hiroShake(state.boss?1.1:.9,pending);
    if(!reduced){
      const recoil=combatOuterMotion('enemy',15,7);
      await combatV3Pose(target,`translate(${recoil.distance}px,-4px) rotate(${recoil.tilt}deg)`,80);
    }
    await at(1650);combatV3Pose(target,'translate(0px,0px) rotate(0deg)',300);
    await at(1950);split?.fade(260,pending);split=null;
    await at(2240);root.dataset.ragePhase='finish';setSpriteFrame('hero','skill',5);
    await at(2440);root.dataset.ragePhase='return';await hiroHopBack(root,near);
    await at(3000);await Promise.all(pending);
    return result;
  }finally{
    await Promise.allSettled(pending);hilt?.remove();cleave?.remove();split?.remove();
    hiroClose(root,target,old,oldZ,3);
  }
}

// ---- Basic attacks ---------------------------------------------------------------------------------
// The shared attack() (its timing, chain bonus and damage) with the form's own drawn arc in place of the shared
// slash: the four-star steel cut, the six-star steel crescent.
let hiroSlashForm=0;
async function hiroStarAttack(form,raw,options){
  hiroSlashForm=form;$('combatEffects').classList.add('hiro-strike');
  try{return await formOriginalAttack('hero',raw,options);}finally{hiroSlashForm=0;$('combatEffects').classList.remove('hiro-strike');}
}
const hiroSharedSlash=combatV3Slash;
combatV3Slash=function(point,key,index,ultimate,direction,pending){
  if(hiroSlashForm&&key==='novice'&&direction>0&&!ultimate&&!reduced)return hiroBasicSlash(hiroSlashForm,index,pending);
  return hiroSharedSlash(point,key,index,ultimate,direction,pending);
};
// Six stars: the basic down-cut's own short swing and the short steel-on-rock strike (prepare_hiro_star_form_sounds.py
// f3-bswing, f3-blow; owner 14/11: "Hiro3 đổi âm thanh lúc đánh trúng của tuyệt kỹ và đánh thường cho nhau").
const hiroSharedWhoosh=combatV3Whoosh,hiroSharedHitSound=combatV3HitSound;
combatV3Whoosh=function(key,strong,contactDelay){
  if(hiroSlashForm===3&&key==='novice'){if(!reduced)wait(Math.max(0,(contactDelay||0)-160)).then(()=>playCastSound('novice','f3-bswing',{volume:.5,pan:.1}));return;}
  return hiroSharedWhoosh(key,strong,contactDelay);
};
combatV3HitSound=function(key,strong=false){
  if(hiroSlashForm===3&&key==='novice')return playCastSound('novice','f3-blow',{volume:strong?.8:.7,pan:.25});
  return hiroSharedHitSound(key,strong);
};
// The strike's caption names the form's own sword (HERO_FORMS weapon), not form 1's wooden one.
const hiroSharedCue=combatV3Cue;
combatV3Cue=function(side,key,ultimate,hits,pending){
  const weapon=hiroSlashForm&&side==='hero'&&key==='novice'&&!ultimate?progressionRules.HERO_FORMS.novice?.[hiroSlashForm-1]?.weapon:null;
  if(weapon)return popActorSkill(side,weapon,false,pending);
  return hiroSharedCue(side,key,ultimate,hits,pending);
};
// Six-star basic attack (redo 13/11): a compact steel down-cut from above and in front of the foe to low behind it,
// three to five warm steel sparks where it lands; the cut sweeps in over the contact time, then its tail breaks up.
function hiroDownCut(pending){
  const sheet=ART.heroFx?.novice?.['f3-downcut'];if(!sheet)return;
  const foe=hiroFoeBody(),height=Math.min(190,Math.max(120,foe.height*1.05)),width=height*sheet.aspect;
  const strip=hiroStrip('f3-downcut',{x:foe.x-foe.width*.05,y:foe.y-height*.08,width,className:'hiro-basic'});if(!strip)return;
  const contact=combatV3Duration(COMBAT_V3_STRIKES.novice.contact);
  // its sweep rides the drawn blade: the cut steps from the raised sword down ~50 ms after the contact pose is asked for
  // (owner 13/11: the cut flashed while the sword was still up)
  pending.push((async()=>{strip.node.style.opacity='0';await wait(reduced?0:50);strip.node.style.opacity='';await strip.play(0,2,Math.max(20,contact/3));await strip.play(3,7,45);await strip.fade(90);})());
}
function hiroBasicSlash(form,index,pending){
  const foe=hiroFoeBody(),stance=index%3;   // the shared attack's sweep, rising and overhead strikes
  if(form===3)return hiroDownCut(pending);
  const name='f2-slash',sheet=ART.heroFx?.novice?.[name];if(!sheet)return;
  // f2-slash is drawn sweeping left to right; every combo step plays the same drawn diagonal down-slash (owner 14/11: "Động
  // tác đánh thường của Hiro2 làm lại"), so the arc runs one way, from high behind the foe's front down through it
  const rotate=[38,42,46][stance];
  const width=Math.min(200,Math.max(120,foe.width*1.2,foe.height*.9));
  const strip=hiroStrip(name,{x:foe.x-foe.width*.06,y:foe.top+foe.height*.46,width,rotate,className:'hiro-basic'});if(!strip)return;
  const contact=combatV3Duration(COMBAT_V3_STRIKES.novice.contact);
  pending.push((async()=>{await strip.play(0,2,Math.max(25,contact/3));await strip.play(3,5,55);await strip.fade(90);})());
}
