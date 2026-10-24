/* Yuki's star forms (hero-kits.js). Form 1 keeps Thiên Băng Giáng, the glacier boulder falling from
 * the sky (yuki-ultimate.js). The later forms stage their own ultimates with their own art
 * (assets/fx/heroes/ice, ART.heroFx.ice) and their own skill poses ("skill" sheets in forms.json):
 *  - four-star Nguyệt Sương Băng Giáng: she raises the moon staff, a frozen crescent moon rises
 *    behind her, a column of frozen moonlight falls on the foe, frost spikes bloom at its feet and
 *    seal it in ice as she plants the staff, then the ice prison shatters;
 *  - six-star Thiên Nguyệt Tuyết Liên: an ice-plate aegis spirals up around her (armour ×1.6), she
 *    sweeps the frost fan (a gust of snow), a giant ice lotus opens under the foe, her moon halberd
 *    draws a crescent, the lotus closes around the foe and bursts into snow petals.
 * The rules are form 1's, unchanged: the same armour gain, ONE hit of progressionKit('ice').base,
 * the stun and (third form) the energy drain. Both run inside the progression wrapper, as form 1. */

// The forms reach their staging through yukiGlacierUltimate, which combat-stage's heroUltimate calls
// inside progression-combat's wrapper, so the kit's power and Biến Dị armour still apply.
const yukiGlacierForm1=yukiGlacierUltimate;
yukiGlacierUltimate=async function(){
  const form=combatHeroForm('ice');
  if(form===2)return yukiMoonfrostUltimate();
  if(form===3)return yukiSnowLotusUltimate();
  return yukiGlacierForm1();
};
const yukiStarUltimate=()=>formOriginalUltimate();
HERO_KITS.ice={forms:{
  2:{ultimate:yukiStarUltimate},
  // The six-star halberd sends its own crescent (yukiCrescentWave), not the shared form-3 arc.
  3:{ultimate:yukiStarUltimate,attack:(raw,options)=>formOriginalAttack('hero',raw,options)}
}};

// ---- Placement ------------------------------------------------------------------------------------
// A foe's drawn body (sheet span/footY/bodyHeight) in scene pixels, as Noct's fog measures it, so
// ground effects stand on its feet and closing effects fit its size, not the sprite cell.
function yukiFoeBody(){
  const target=actor('enemy'),scene=$('scene').getBoundingClientRect(),cell=target.getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,feet=cell.top-scene.top+cell.height*foot;
  return {x:(left+right)/2,feet,top,width:right-left,height:feet-top,y:(top+feet)/2};
}
// Yuki's own drawn body (her idle sheet) in scene pixels.
function yukiHeroBody(){
  const sprite=actor('hero').querySelector('.sprite-body'),scene=$('scene').getBoundingClientRect(),r=sprite.getBoundingClientRect();
  const look=spriteDefinition('hero','ice','idle').sheet,foot=look.footY||.94,height=r.height*(look.bodyHeight||.75);
  const feet=r.top-scene.top+r.height*foot;
  return {x:r.left-scene.left+r.width*(look.feetX??.5),feet,top:feet-height,height,width:r.width*.6};
}
// One authored FX strip (ART.heroFx.ice[name]) placed by its width: on a ground line (`feet`, the
// strip's own foot line lands there) or centred on `y`. Frames are stepped explicitly so a sequence
// can pause on a pose (the closed prison, the closed lotus).
function yukiStrip(name,{x,y,feet,width,parent=null,className=''}){
  const sheet=ART.heroFx?.ice?.[name];if(!sheet||reduced)return null;
  const height=width/sheet.aspect,top=feet!=null?feet-height*(sheet.foot??1):y-height/2;
  const node=document.createElement('span');node.className=`yuki-fx yuki-fx-${name} ${className}`;node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${x-width/2}px;top:${top}px;width:${width}px;height:${height}px;--fx-count:${sheet.count};background-image:url('${sheet.src}')`;
  (parent||$('combatEffects')).append(node);
  let frame=0,token=0;
  const set=i=>{frame=Math.max(0,Math.min(sheet.count-1,i));node.style.backgroundPosition=`${sheet.count>1?frame/(sheet.count-1)*100:0}% 0`;};set(0);
  return {node,sheet,height,top,set,
    async play(from,to,ms=sheet.frameDuration){const mine=++token;for(let i=from;i<=to&&node.isConnected&&mine===token;i++){set(i);if(i<to)await wait(ms);}},
    loop(from,to,ms=sheet.frameDuration){const mine=++token;(async()=>{let i=from;while(node.isConnected&&mine===token){set(i);await wait(ms);i=i>=to?from:i+1;}})();},
    stop(){token++;},
    fade(ms,pending,extra={}){const job=animate(node,[{opacity:getComputedStyle(node).opacity},{opacity:0,...extra}],{duration:ms,easing:'ease-in'}).finally(()=>node.remove());pending?.push(job);return job;},
    remove(){token++;node.remove();}};
}
// Moves a placed strip to another layer without moving it on screen (the lotus opens under the
// foe, inside its actor, and closes over it in the effects layer).
function yukiReparent(strip,parent){
  if(!strip?.node.isConnected)return;
  const from=strip.node.getBoundingClientRect(),to=parent.getBoundingClientRect();
  strip.node.style.left=from.left-to.left+'px';strip.node.style.top=from.top-to.top+'px';parent.append(strip.node);
}
// The foe turns to ice while it is held in the prison or the lotus.
function yukiFreezeFoe(on){actor('enemy').classList.toggle('yuki-frozen',on);}

// ---- Sounds ---------------------------------------------------------------------------------------
// Four or five well-spaced cues, each ONE natural recording (scripts/prepare_yuki_form_sounds.py,
// assets/audio/hero-forms/ice-manifest.json -> ART.castSounds['ice-<name>']). With reduced motion the
// timeline collapses, so only the hit is heard. window.yukiSoundLog (QA) records when each one fires.
// Decoded up front, as form 1's glacier audio, so the first beats are not late.
function yukiPrepareSounds(names){
  const context=combatV3AudioContext();if(!context)return;
  for(const name of names)decodeCastSound(context,'ice-'+name).catch(()=>{});
}
// Damage-hit volumes, balanced against the deep boom ringing under them (simulated mix peak <= 0.8).
const YUKI_HIT_VOLUME={'f2-shatter':.72,'f3-burst':.52};
function yukiScore(at,pending,hit,cues){
  yukiPrepareSounds([...new Set([hit,...cues.map(c=>c[1])])]);
  if(reduced)return;
  for(const [ms,name,volume,pan] of cues)pending.push(at(ms).then(()=>yukiSound(name,{volume,pan})));
}
function yukiSound(name,{volume=.5,pan=0,hit=false}={}){
  if(reduced&&!hit)return;
  window.yukiSoundLog?.push([name,Math.round(performance.now())]);
  playCastSound('ice',name,{volume,pan});
}

// ---- Shared rules: exactly form 1's armour gain and single hit -------------------------------------
function yukiUltimateOpening(kit,pending){
  const armor=Math.max(0,Math.min(kit.armor,combatArmorCap('hero')-state.armor));state.armor+=armor;update();
  if(armor)combatV3Number('hero','+'+armor+' GIÁP','armor',0,pending);
  pending.push(selfBuffSpiral('armor',1100));popActorSkill('hero',HEROES.ice.skill,true,pending);
  combatVoice('hero','cast');
}
function yukiUltimateHit(kit,pending,sound){
  const result=damage('hero',kit.base);if(state.enemyHp>0)state.stunned=true;
  // Third form: the foe also loses energy.
  if(kit.enemyDrain&&state.enemyHp>0){state.enemyEnergy=Math.max(0,state.enemyEnergy-kit.enemyDrain);popActorSkill('enemy','−'+kit.enemyDrain+' NĂNG LƯỢNG',false,pending);}
  update();
  combatVoice('enemy','hurt');yukiSound(sound,{volume:YUKI_HIT_VOLUME[sound]??.7,pan:.24,hit:true});setSpriteAction('enemy','hurt',350);
  combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',0,pending);
  if(state.enemyHp>0)pending.push(wait(kit.enemyDrain?420:0).then(()=>popActorSkill('enemy','CHOÁNG',false,pending)));
  hitAccents('hero',result,false,pending);
  return result;
}
function yukiUltimateTimer(){
  const start=performance.now();
  return async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
}

// ---- Four-star: Nguyệt Sương Băng Giáng -----------------------------------------------------------
// The crescent moon rises behind her (inside her actor, under the body), a halo round her shoulders.
function yukiRisingMoon(pending){
  const root=actor('hero'),hero=yukiHeroBody(),scene=$('scene').getBoundingClientRect(),box=root.getBoundingClientRect();
  const size=hero.height*1.08,ox=box.left-scene.left,oy=box.top-scene.top;
  const moon=yukiStrip('moon',{x:hero.x-hero.width*.1-ox,y:hero.top+hero.height*.3-oy,width:size,parent:root,className:'yuki-moon'});
  if(!moon)return null;
  moon.loop(0,3);
  pending.push(animate(moon.node,[{opacity:0,translate:`0 ${hero.height*.6}px`,scale:'.6'},{opacity:1,translate:'0 0',scale:'1'}],{duration:620,easing:'cubic-bezier(.2,.8,.3,1)'}));
  return moon;
}
async function yukiMoonfrostUltimate(){
  if(state.hp<=0||state.enemyHp<=0)return;
  const root=actor('hero'),target=actor('enemy'),oldTarget=target.style.transform,pending=[],at=yukiUltimateTimer();
  const kit=progressionKit('ice'),foe=yukiFoeBody();
  let result={amount:0,blocked:0},moon=null,beam=null,seal=null;
  // Score: a bed under every continuous effect, a synced hit on every crack and burst (ms from the start).
  yukiScore(at,pending,'f2-shatter',[
    [0,'f2-gather',.4,-.25],     // chant and moonrise: bell-tree shimmer blooming and decaying (0-2.0 s)
    [1250,'f2-beam',.5,.25],     // the moonbeam falls; whoosh peaks as it lands (1.42 s), natural decay
    [1420,'f2-freeze',.3,.3],    // spikes grow, prison holds (crackling bed, 1.42-2.42 s)
    [1640,'crack',.42,.3],       // the prison locks (1.70 s)
    [2090,'crack',.4,.3],        // white cracks run through the spikes (2.15 s)
    [2200,'boom',.4,.15]]);     // form 1's deep boom, full 3.1 s sustain under the shatter (2.24 s, 4.4 s glass tail)  // shards rain down, moon fades (2.40-3.2 s)
  root.dataset.ragePhase='chant';root.classList.add('combat-v3-acting');
  try{
    yukiUltimateOpening(kit,pending);
    setSpriteFrame('hero','skill',0);await at(260);setSpriteFrame('hero','skill',1);
    await at(560);root.dataset.ragePhase='moonrise';setSpriteFrame('hero','skill',2);moon=yukiRisingMoon(pending);
    await at(900);setSpriteFrame('hero','skill',3);
    if(moon)pending.push(animate(moon.node,[{filter:'brightness(1) drop-shadow(0 0 4px #bdf3ff)'},{filter:'brightness(1.5) drop-shadow(0 0 14px #e8fdff)',offset:.5},{filter:'brightness(1.15) drop-shadow(0 0 7px #bdf3ff)'}],{duration:420,fill:'forwards'}));
    await at(1130);combatVoice('hero','release');
    await at(1250);root.dataset.ragePhase='moonbeam';setSpriteFrame('hero','skill',4);
    // The column of frozen moonlight falls from the top of the sky onto the foe's feet.
    const sheet=ART.heroFx?.ice?.beam;
    if(sheet&&!reduced){
      const height=(foe.feet+8)/sheet.foot;
      beam=yukiStrip('beam',{x:foe.x,feet:foe.feet+8,width:height*sheet.aspect});beam?.loop(0,3);
      if(beam)pending.push(animate(beam.node,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],{duration:170,easing:'cubic-bezier(.5,0,.9,.6)'}));
    }
    await at(1420);root.dataset.ragePhase='seal';
    combatV3Camera(1,false,state.boss,pending);setSpriteAction('enemy','hurt',260);
    // Frost spikes bloom in a ring round the foe's feet and close into an ice prison.
    seal=yukiStrip('seal',{x:foe.x,feet:foe.feet+4,width:Math.min($('scene').clientWidth*.6,Math.max(foe.width*1.55,foe.height*.95,90))});
    seal?.play(0,3,85);
    await at(1600);setSpriteFrame('hero','skill',5);
    await at(1700);yukiFreezeFoe(true);seal?.set(4);
    beam?.stop();beam?.fade(260,pending);beam=null;
    await at(2150);seal?.set(5);
    await at(2240);root.dataset.ragePhase='shatter';
    seal?.play(6,7,90);yukiFreezeFoe(false);
    result=yukiUltimateHit(kit,pending,'f2-shatter');
    yukiMeteorShake(true,pending);
    pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(4px,6px) rotate(2deg)',offset:.25},{transform:oldTarget||'none'}],{duration:350,easing:'ease-out'}));
    if(moon){moon.stop();moon.fade(420,pending,{translate:`0 ${-10}px`});moon=null;}
    await at(2460);seal?.fade(300,pending);seal=null;
    await at(2600);root.dataset.ragePhase='recover';setSpriteFrame('hero','skill',0);
    await at(3000);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);moon?.remove();beam?.remove();seal?.remove();yukiFreezeFoe(false);target.style.transform=oldTarget;
    delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Six-star: Thiên Nguyệt Tuyết Liên ------------------------------------------------------------
// The imperial frost aegis: crystal armour plates spiral up round her from her boots to her ears.
function yukiAegis(pending){
  const root=actor('hero'),hero=yukiHeroBody(),scene=$('scene').getBoundingClientRect(),box=root.getBoundingClientRect();
  const aegis=yukiStrip('aegis',{x:hero.x-(box.left-scene.left),feet:hero.feet+4-(box.top-scene.top),width:hero.height*1.12*(ART.heroFx?.ice?.aegis?.aspect||.73),parent:root,className:'yuki-aegis'});
  if(!aegis)return null;
  aegis.loop(0,5);
  pending.push(animate(aegis.node,[{clipPath:'inset(100% -10% 0 -10%)',opacity:.4},{clipPath:'inset(0% -10% 0 -10%)',opacity:.92}],{duration:560,easing:'cubic-bezier(.25,.7,.3,1)',fill:'forwards'}));
  return aegis;
}
async function yukiSnowLotusUltimate(){
  if(state.hp<=0||state.enemyHp<=0)return;
  const root=actor('hero'),target=actor('enemy'),oldTarget=target.style.transform,pending=[],at=yukiUltimateTimer();
  const kit=progressionKit('ice'),foe=yukiFoeBody(),hero=yukiHeroBody();
  let result={amount:0,blocked:0},aegis=null,gust=null,lotus=null,cut=null;
  yukiScore(at,pending,'f3-burst',[
    [0,'f3-aegis',.38,-.25],     // plates clink as the aegis spirals up, natural ring-out (0-1.15 s)
    [640,'f3-fan',.5,-.05],      // fan sweep and snowy gust, natural rise and fall (0.64-1.9 s)
    [840,'f3-lotus',.28,.3],     // the lotus blooms, stands open, closes (creaking bed, 0.84-2.24 s)
    [1360,'f3-halberd',.5,.1],   // halberd swing, swish peaks on the cut (1.50 s)
    [1440,'crack',.4,.3],        // the crescent cuts the foe (1.50 s)
    [2020,'crack',.4,.3],        // the bud cracks (2.08 s)
    [2200,'boom',.4,.15]]);     // form 1's deep boom, full 3.1 s sustain under the burst (2.24 s, 2.8 s of falling glass)      // weight under the burst; the burst itself plays on the hit (2.24 s)
  root.dataset.ragePhase='chant';root.classList.add('combat-v3-acting');
  try{
    yukiUltimateOpening(kit,pending);
    setSpriteFrame('hero','skill',0);aegis=yukiAegis(pending);
    await at(300);setSpriteFrame('hero','skill',1);
    await at(640);root.dataset.ragePhase='fan';setSpriteFrame('hero','skill',2);
    // The fan's gust of snow carries from her open fan to the foe.
    const gustWidth=Math.max(hero.height*1.35,foe.height);
    gust=yukiStrip('fan',{x:hero.x+hero.width*.55,y:hero.top+hero.height*.42,width:gustWidth});
    if(gust){
      gust.play(0,5,80);
      pending.push(animate(gust.node,[{translate:'0 0'},{translate:`${foe.x-hero.x-hero.width*.55}px ${foe.y-hero.top-hero.height*.42}px`}],{duration:480,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'}));
    }
    // The lotus blooms on the foe's feet; once closed it must hide the whole body.
    const sheet=ART.heroFx?.ice?.lotus,lotusHeight=Math.max(foe.height*1.3,foe.width*1.5/((sheet?.aspect)||.83)),lotusWidth=Math.min($('scene').clientWidth*.62,lotusHeight*((sheet?.aspect)||.83));// a boss is closed in up to its shoulders
    // It opens under the foe (inside its actor, behind the body), so the foe stands in the flower.
    const cell=target.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
    await at(840);lotus=yukiStrip('lotus',{x:foe.x-(cell.left-scene.left),feet:foe.feet+6-(cell.top-scene.top),width:lotusWidth,parent:target,className:'yuki-under'});
    lotus?.play(0,2,95);
    await at(1130);gust?.fade(120,pending);gust=null;
    await at(1150);root.dataset.ragePhase='raise';setSpriteFrame('hero','skill',3);
    await at(1400);combatVoice('hero','release');
    await at(1500);root.dataset.ragePhase='crescent';setSpriteFrame('hero','skill',4);
    // The halberd's crescent cuts across the foe as the lotus closes round it.
    cut=yukiStrip('crescent',{x:foe.x,y:foe.y,width:Math.min($('scene').clientWidth*.7,Math.max(foe.height,foe.width)*1.45)});
    cut?.play(0,5,55);combatV3Camera(1,true,state.boss,pending);setSpriteAction('enemy','hurt',300);
    await at(1600);yukiReparent(lotus,$('combatEffects'));lotus?.node.classList.remove('yuki-under');lotus?.play(3,4,95);
    await at(1800);yukiFreezeFoe(true);cut?.remove();cut=null;
    await at(1960);root.dataset.ragePhase='bloom-hold';setSpriteFrame('hero','skill',5);
    await at(2080);lotus?.set(5);
    await at(2240);root.dataset.ragePhase='bloom-burst';yukiFreezeFoe(false);
    lotus?.play(6,7,110);
    result=yukiUltimateHit(kit,pending,'f3-burst');
    yukiMeteorShake(true,pending);
    const flash=document.createElement('span');flash.className='yuki-lotus-flash';flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
    pending.push(animate(flash,[{opacity:0},{opacity:.7,offset:.2},{opacity:0}],{duration:460}).finally(()=>flash.remove()));
    pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(4px,6px) rotate(2deg)',offset:.25},{transform:oldTarget||'none'}],{duration:350,easing:'ease-out'}));
    await at(2460);lotus?.fade(420,pending,{translate:'0 14px'});lotus=null;
    await at(2550);root.dataset.ragePhase='recover';
    if(aegis){aegis.stop();aegis.fade(380,pending);aegis=null;}
    await at(3000);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);aegis?.remove();gust?.remove();lotus?.remove();cut?.remove();yukiFreezeFoe(false);target.style.transform=oldTarget;
    delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Basic attacks ---------------------------------------------------------------------------------
// Form 1 throws the ice lance (combat-v3.js). The four-star moon staff shoots a moon-frost crescent
// bolt that pins the foe with a snap of frost spikes; the six-star halberd's chop sends a moonlit
// crescent that cuts across the foe. Timing and damage stay the shared attack()'s (contact 320 ms).
const yukiForm1Lance=combatV3Ice;
combatV3Ice=function(sourcePoint,targetPoint,ultimate,index,direction,pending){
  const form=direction>0&&!ultimate&&state.key==='ice'?combatHeroForm('ice'):1;
  if(form===2&&ART.heroFx?.ice?.bolt)return yukiMoonBolt(sourcePoint,pending);
  if(form===3&&ART.heroFx?.ice?.crescent)return yukiCrescentWave(sourcePoint,pending);
  return yukiForm1Lance(sourcePoint,targetPoint,ultimate,index,direction,pending);
};
function yukiMoonBolt(source,pending){
  if(reduced)return;
  const timing=COMBAT_V3_STRIKES.ice,foe=yukiFoeBody();
  const start={x:source.x+source.width*.24,y:source.y-13},end={x:foe.x-foe.width*.08,y:foe.y};
  const width=Math.min(150,Math.max(90,foe.height*.85)),bolt=yukiStrip('bolt',{x:start.x,y:start.y,width});if(!bolt)return;
  bolt.loop(0,3,60);
  const angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
  const flight=combatV3Animate(bolt.node,[
    {opacity:0,transform:`rotate(${angle}deg) scale(.5)`},
    {opacity:1,transform:`rotate(${angle}deg) scale(1)`,offset:.18},
    {opacity:1,transform:`translate(${end.x-start.x}px,${end.y-start.y}px) rotate(${angle}deg) scale(1)`,offset:timing.contact/timing.duration},
    {opacity:0,transform:`translate(${end.x-start.x+14}px,${end.y-start.y}px) rotate(${angle}deg) scale(1.15)`}
  ],{duration:timing.duration,easing:'linear'}).finally(()=>bolt.remove());
  pending.push(flight);
  // On contact a low ring of frost spikes snaps up round the foe's feet and melts at once.
  pending.push(wait(combatV3Duration(timing.contact)).then(async()=>{
    const spikes=yukiStrip('seal',{x:foe.x,feet:foe.feet+3,width:Math.max(foe.width*1.1,64),className:'yuki-snap'});if(!spikes)return;
    await spikes.play(0,2,50);await wait(70);spikes.set(7);await spikes.fade(200);
  }));
}
function yukiCrescentWave(source,pending){
  if(reduced)return;
  const timing=COMBAT_V3_STRIKES.ice,foe=yukiFoeBody();
  const start={x:source.x+source.width*.3,y:source.y-source.height*.12},end={x:foe.x,y:foe.y};
  const width=Math.min(190,Math.max(100,Math.max(foe.height,foe.width)*1.05)),wave=yukiStrip('crescent',{x:start.x,y:start.y,width});if(!wave)return;
  const contact=combatV3Duration(timing.contact);
  wave.play(0,3,contact/4);
  pending.push(combatV3Animate(wave.node,[
    {opacity:0,transform:'scale(.55)'},{opacity:1,transform:'scale(.8)',offset:.2},
    {opacity:1,transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(1)`,offset:timing.contact/timing.duration},
    {opacity:.9,transform:`translate(${end.x-start.x+10}px,${end.y-start.y+4}px) scale(1.05)`}
  ],{duration:timing.duration,easing:'cubic-bezier(.35,.1,.6,1)',fill:'forwards'}));
  pending.push(wait(contact).then(async()=>{await wave.play(4,5,70);await wave.fade(120);}));
}
