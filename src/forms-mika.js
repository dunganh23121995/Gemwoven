/* Mika's star forms (hero-kits.js). Form 1 keeps Hỏa Kiếm Cuồng Nộ, the charged sword and its flying
 * wave (mika-ultimate.js). The later forms no longer borrow it: Mika stands her ground and her weapon
 * grows into fox-fire long enough to reach across the arena, with her own skill poses ("skill"
 * sheets in forms.json) and her own art (assets/fx/heroes/fire, ART.heroFx.fire):
 *  - four-star Hồ Diễm Long Trảm: she raises the broadsword, its blade blazes up into a fox-fire
 *    sword taller than the sky, and one overhead cleave brings it down to lie across the whole stage
 *    through the foe, leaving a quarter-circle of fire and a horizontal cut of flame on the foe;
 *  - six-star Cửu Dương Hồ Diễm: the nine tails flare, she draws the moon glaive back, then spins it
 *    flat round her: a ring of fox-fire sweeps the stage, the glaive grows into a colossal crescent
 *    that cuts through the foe, a nine-tailed sun bursts on it and nine fox-fire spirits race in.
 * The rules are form 1's, unchanged: ONE damage() of the kit's base with onRelease right after it,
 * inside progression-combat's wrapper (power, burn), exactly as mikaFlameRage deals it.
 * Basic attacks keep the lunge and the form's own attack poses, with the form's own slash art.
 * Six-star Mika leaves a cleared stage in a fox-like dash, the glaive laid back over her shoulder
 * and the nine tails streaming, the fox-fire spirit at her heels ("dash" sheet). */

// rageChoreography -> mikaFlameRage is reached through combat-stage's heroUltimate inside the
// progression wrapper; the star forms take over the staging there.
const mikaFlameRageForm1=mikaFlameRage;
mikaFlameRage=function(raw,onRelease=()=>{}){
  const form=combatHeroForm('fire');
  if(form===2)return mikaLongCleave(raw,onRelease);
  if(form===3)return mikaNineSunSweep(raw,onRelease);
  return mikaFlameRageForm1(raw,onRelease);
};
let mikaSlashForm=0;
const mikaStarUltimate=()=>formOriginalUltimate();
const mikaStarAttack=form=>async(raw,options)=>{
  mikaSlashForm=form;mikaSlashCalls=0;mikaSlashOrder=MIKA_SLASH_FIRST;mikaSlashShorten=form===3?mikaGlaiveShortening():0;
  try{return await formOriginalAttack('hero',raw,options);}finally{mikaSlashForm=0;mikaSlashShorten=0;}
};
HERO_KITS.fire={forms:{
  2:{ultimate:mikaStarUltimate,attack:mikaStarAttack(2)},
  3:{ultimate:mikaStarUltimate,attack:mikaStarAttack(3),depart:()=>mikaFoxDash()}
}};

// ---- Placement ------------------------------------------------------------------------------------
// Where the weapon's grip is in each "skill" pose (x, y in the 512px cell) and which way the drawn
// weapon points (degrees, 0 = right, -90 = up). The giant fox-fire weapon grows out of that grip.
// Form 2's skill sheet holds the whole cleave in the order it is played (tools/merge_ult2.py): 0 draw,
// 1 raise, 2 dip, 3-6 backswing (6: blade straight back), 7 chop, 8 contact, 9 follow-through, 10 recover.
const MIKA_GRIPS={
  2:[[317,286,-97],[254,181,-106],[274,201,-75],[223,197,-116],[229,209,-144],[227,211,-150],[210,248,-174],[326,239,-46],[312,305,0],[325,351,43],[303,320,-57]],
  3:[[270,390,0],[215,380,180],[269,397,180],[300,382,0],[249,377,0],[300,380,-60]]
};
// The drawing box is read without its lean (offsets), then the grip turns with the lean about her feet
// (the cleave leans her back on the backswing and forward on the chop: sprite.dataset.lean, degrees).
function mikaGrip(form,frame){
  const el=actor('hero').querySelector('.sprite-body'),parent=el.offsetParent.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const left=parent.left+el.offsetLeft-scene.left,top=parent.top+el.offsetTop-scene.top,w=el.offsetWidth,h=el.offsetHeight;
  const [x,y,angle]=MIKA_GRIPS[form][frame],lean=Number(el.dataset.lean)||0;
  const px=left+w/2,py=top+h*.94,dx=left+x/512*w-px,dy=top+y/512*h-py,r=lean*Math.PI/180;
  return {x:px+dx*Math.cos(r)-dy*Math.sin(r),y:py+dx*Math.sin(r)+dy*Math.cos(r),angle:angle+lean};
}
// The foe's drawn body (sheet span/footY/bodyHeight), as Noct's fog measures it.
function mikaFoeBody(){
  const target=actor('enemy'),scene=$('scene').getBoundingClientRect(),cell=target.getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const body={left:cell.left-scene.left+cell.width*span[0],right:cell.left-scene.left+cell.width*span[1],top:cell.top-scene.top+cell.height*crown,bottom:cell.top-scene.top+cell.height*foot};
  body.width=body.right-body.left;body.height=body.bottom-body.top;body.x=(body.left+body.right)/2;body.y=body.bottom-body.height*.45;
  return body;
}

// ---- Art ------------------------------------------------------------------------------------------
function mikaSheet(name){return ART.heroFx?.fire?.[name]||null;}
// One element showing a strip frame; transform-origin is the strip's anchor (a weapon's base knot).
function mikaFxNode(name,className=''){
  const sheet=mikaSheet(name);if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className=`mika-fx mika-${name} ${className}`;node.setAttribute('aria-hidden','true');
  node.style.cssText=`background-image:url('${sheet.src}');background-size:${sheet.count*100}% 100%;--ratio:${sheet.height/sheet.width}`;
  $('combatEffects').append(node);return node;
}
function mikaFxFrame(node,name,frame){
  const sheet=mikaSheet(name);if(!node||!sheet)return;
  const i=Math.max(0,Math.min(sheet.count-1,frame));node.style.backgroundPosition=`${sheet.count>1?i/(sheet.count-1)*100:0}% 0`;node.dataset.frame=String(i);
}
// A strip played once at a point, centred, then removed.
function mikaBurst(name,point,size,pending,{rotate=0,flip=1,hold=1,fade=180,className=''}={}){
  const sheet=mikaSheet(name),node=mikaFxNode(name,className);if(!node)return null;
  node.style.cssText+=`;left:${point.x}px;top:${point.y}px;width:${size}px;height:${size*sheet.height/sheet.width}px;transform:translate(-50%,-50%) rotate(${rotate}deg) scaleY(${flip})`;
  mikaFxFrame(node,name,0);
  const steps=sheet.count*sheet.frameDuration*hold,log={name,from:Math.round(performance.now())};
  (window.mikaFxLog||=[]).push(log);// the studio reads it to fit each sound to what is on screen
  pending.push((async()=>{
    for(let i=1;i<sheet.count;i++){await wait(sheet.frameDuration*hold);mikaFxFrame(node,name,i);}
    await animate(node,[{opacity:1},{opacity:0}],{duration:fade,fill:'forwards'});
  })().finally(()=>{node.remove();log.to=Math.round(performance.now());}));
  return {node,duration:steps};
}
// A giant weapon pinned at its base knot (sheet.base) to a point, turned and grown about it.
function mikaWeapon(name,length){
  const sheet=mikaSheet(name),node=mikaFxNode(name,'mika-giant');if(!node)return null;
  const span=1-sheet.base[0]-.04,width=length/span,height=width*sheet.height/sheet.width;
  node.style.width=width+'px';node.style.height=height+'px';node.style.transformOrigin=`${sheet.base[0]*100}% 50%`;
  return {node,place(x,y,angle,scale){node.style.left=x-width*sheet.base[0]+'px';node.style.top=y-height/2+'px';node.style.transform=`rotate(${angle}deg) scale(${scale})`;},frame:i=>mikaFxFrame(node,name,i),remove:()=>node.remove()};
}
const mikaLerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
const mikaEase=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);

// ---- Shared contact (mikaFlameRage's hit, unchanged rules) ----------------------------------------
function mikaContact(raw,onRelease,pending){
  const target=actor('enemy'),oldTarget=target.style.transform;
  const result=damage('hero',raw);onRelease(pending);update();
  combatVoice('enemy','hurt');
  combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',0,pending);
  hitAccents('hero',result,false,pending);setSpriteAction('enemy','hurt',420);
  pending.push(castTimelineAnimate(target,[{transform:oldTarget||'none'},{transform:'translate(12px,4px) rotate(5deg)',offset:.2},{transform:oldTarget||'none'}],{duration:360,easing:'ease-out'}));
  return result;
}
function mikaShake(pending,force=1){
  if(reduced)return;
  const f=force;
  pending.push(castTimelineAnimate($('scene'),[{translate:'0px 0px'},{translate:`${-8*f}px ${10*f}px`,offset:.07},{translate:`${8*f}px ${-6*f}px`,offset:.18},{translate:`${-5*f}px ${4*f}px`,offset:.32},{translate:`${3*f}px ${-2*f}px`,offset:.5},{translate:'0px 0px'}],{duration:520,easing:'ease-out'}));
}
function mikaFlash(pending,kind){
  if(reduced)return;
  const flash=document.createElement('span');flash.className='mika-flash '+kind;flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
  pending.push(animate(flash,[{opacity:0},{opacity:.8,offset:.18},{opacity:0}],{duration:460}).finally(()=>flash.remove()));
}

// ---- Sound: one clip per beat (assets/audio/hero-forms/fire, scripts/prepare_mika_form_sounds.py) ----
// A few well-spaced cues, each one natural recording (never more than two sounding at once).
// One real recording per cue, each the literal sound of its motion (scripts/prepare_mika_form_sounds.py);
// the damage hit is the loudest clip and a long natural tail rings out after it. Form 3 is built on form 1's
// own recordings (her fire whoosh gathers and, in full, rings out from the hit; her katana draws and cuts).
const MIKA_SOUNDS={2:['f2-rise','f2-dipbody','f2-dip','f2-flyby','f2-boom','f2-floor'],3:['gather','f3-flare','draw','f3-sweep','cut','f3-sun','finale','f3-wave','flame-whoosh','f3-engulf']};
function mikaWarmSounds(form){
  const audio=combatV3AudioContext();if(audio)for(const name of MIKA_SOUNDS[form])decodeCastSound(audio,'fire-'+name).catch(()=>{});
}
// The studio reads window.mikaSoundLog to check each clip fires on its beat.
function mikaSound(name,volume,pan=0){
  if(reduced)return;
  (window.mikaSoundLog||=[]).push({name,at:Math.round(performance.now())});
  playCastSound('fire',name,{volume,pan});
}

// ---- Four-star: Hồ Diễm Long Trảm -----------------------------------------------------------------
// The drawn pose (skill frame) whose sword is nearest a blade angle, from straight back (-185) to level (0).
const MIKA_SWING_POSES=[[6,-174],[5,-150],[4,-144],[3,-116],[1,-106],[7,-46],[8,0]];
// The backswing picks only the raised and backswing poses (never the chop's, whose blade is near the dip's angle).
function mikaSwingPose(angle,back=false){return MIKA_SWING_POSES.filter(p=>!back||p[0]<7).reduce((best,p)=>Math.abs(p[1]-angle)<Math.abs(best[1]-angle)?p:best)[0];}
// Hồ Diễm Long Trảm: she raises the sword and its fox-fire blade towers; one short heavy dip of the blade
// ("uỳnh"); she swings it back behind her (the blade roaring past like a starship) and brings it down hard
// in one fast chop through the foe, which bursts like a planet exploding. Damage: one damage() at the chop.
// The cleave's sheet is kept decoded (held here) so its first frame is never blank while the browser
// decodes it.
const mikaHeldSheets=[];
async function mikaHoldSheets(names){
  const sheets=names.map(n=>ART.heroForms?.fire?.['2']?.[n]).filter(Boolean);
  const jobs=sheets.map(sheet=>{const img=new Image();img.src=sheet.src;mikaHeldSheets.push(img);return img.decode?.().catch(()=>{});});
  await Promise.race([Promise.all(jobs),wait(250)]);
}
async function mikaLongCleave(raw,onRelease){
  mikaWarmSounds(2);if(!mikaHeldSheets.length)await mikaHoldSheets(['skill']);
  const root=actor('hero'),oldZ=root.style.zIndex,oldTransform=root.style.transform,pending=[],start=performance.now();
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  let result={amount:0,blocked:0},blade=null,frameId=0,arc=null;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.ragePhase='raise';root.dataset.state='cast';
  try{
    combatVoice('hero','cast');mikaSound('f2-rise',.46,-.15);popActorSkill('hero',HEROES.fire.skill,true,pending);
    setSpriteFrame('hero','skill',0);
    // The blade must reach past the foe's far side once it lies level across the stage.
    const foe=mikaFoeBody(),reach=Math.max(140,foe.right+8-mikaGrip(2,8).x);
    blade=mikaWeapon('blade2',reach);
    const RAISE=300,DIP=950,BACK=1270,HOLD=1600,CHOP=1660,HIT=1880,DIP_TO=-74,LEAN_BACK=5,LEAN_FORWARD=8;
    const track=now=>{
      if(!blade?.node.isConnected)return;
      const t=now-start,sprite=root.querySelector('.sprite-body'),frame=Number(sprite?.dataset.frame)||0;
      // Her lean about her feet: back a little as the blade swings behind her, forward into the chop,
      // held through the contact and the follow-through, upright again as she recovers.
      const lean=t<BACK?0:t<HOLD?mikaLerp(0,-LEAN_BACK,mikaEase((t-BACK)/(HOLD-BACK))):t<CHOP?-LEAN_BACK:
        t<HIT?mikaLerp(-LEAN_BACK,LEAN_FORWARD,mikaEase((t-CHOP)/(HIT-CHOP))):t<HIT+680?LEAN_FORWARD:mikaLerp(LEAN_FORWARD,0,mikaEase(Math.min(1,(t-HIT-680)/320)));
      if(sprite){sprite.style.transformOrigin='50% 94%';sprite.style.rotate=`${lean}deg`;sprite.dataset.lean=String(lean);}
      let grip=mikaGrip(2,frame),angle=grip.angle,scale=1,strip=3,opacity=1;
      const pose=fr=>{if(frame!==fr)setSpriteFrame('hero','skill',fr);return mikaGrip(2,fr);};
      if(t<RAISE){scale=mikaLerp(.2,.36,t/RAISE);strip=0;opacity=mikaLerp(0,1,t/140);}
      else if(t<DIP){scale=mikaLerp(.36,1,mikaEase((t-RAISE)/420));strip=t<RAISE+200?0:1+Math.floor(t/90)%2;}
      else if(t<BACK){
        // One short heavy dip: the blade forced down a little from upright, held with strain.
        const u=Math.min(1,(t-DIP)/220);angle=mikaLerp(-93,DIP_TO,mikaEase(u));
        grip=pose(2);strip=1+Math.floor(t/70)%2;
        root.style.transform=`translate(${Math.sin(t/23)*1.4}px,${Math.cos(t/31)*.7}px)`;
      }else if(t<CHOP){
        // The backswing: up past vertical and on back behind her, the blade following her hands.
        root.style.transform=oldTransform;
        const u=Math.min(1,(t-BACK)/(HOLD-BACK));angle=mikaLerp(DIP_TO,-185,u*u*(3-2*u));
        grip=pose(mikaSwingPose(angle-lean,true));strip=1+Math.floor(t/60)%2;
      }else if(t<HIT){
        // The strong chop: from straight back over her head and down to level through the foe, fast.
        const u=Math.min(1,(t-CHOP)/(HIT-CHOP));angle=mikaLerp(-185,LEAN_FORWARD,u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2);
        grip=pose(mikaSwingPose(angle-lean));strip=1+Math.floor(t/50)%2;
      }else{
        // Follow-through: the giant blade rides the sword on down into the ground beyond the foe.
        const p=(t-HIT-110)/140,c=mikaGrip(2,8),d=mikaGrip(2,9),follow=frame>=9;strip=1+Math.floor(t/80)%2;
        grip=follow?{x:mikaLerp(c.x,d.x,p),y:mikaLerp(c.y,d.y,p)}:c;angle=(follow?mikaLerp(0,32,mikaEase(p)):0)+lean;
        opacity=t<HIT+260?1:Math.max(0,1-(t-HIT-260)/240);
      }
      blade.frame(strip);blade.place(grip.x,grip.y,angle,scale);blade.node.style.opacity=String(opacity);
      frameId=requestAnimationFrame(track);
    };
    if(blade){blade.place(0,0,-90,.18);frameId=requestAnimationFrame(track);}
    await at(RAISE);setSpriteFrame('hero','skill',1);root.dataset.ragePhase='blaze';
    // Uỳnh: one short heavy dip of the blade.
    await at(DIP);root.dataset.ragePhase='dip';setSpriteFrame('hero','skill',2);mikaShake(pending,.4);
    // The backswing and the chop: the blade roars past like a starship flying by (peaking on the chop).
    await at(BACK);root.dataset.ragePhase='backswing';mikaSound('f2-flyby',.7,-.1);
    // The blade's fiery roar comes when it lies fully back, ready to be brought down.
    await at(HOLD);mikaSound('f2-dipbody',.48,.05);
    await at(CHOP);root.dataset.ragePhase='cleave';combatVoice('hero','release');
    // The swing's quarter-circle of fire, pivoting on the grip, tracing the blade's outer half.
    // The swing's half-circle of fire (arc2s): the blade's path from straight back, over her head, down to
    // level through the foe, centred between her hands' positions along the swing, tracing the blade's
    // outer part. The art's pivot is the bottom centre of its cell (92% down), radius 45% of its width.
    if(!reduced){const sheet=mikaSheet('arc2s');if(sheet){
      const g=[mikaGrip(2,6),mikaGrip(2,1),mikaGrip(2,8)],px=(g[0].x+g[1].x+g[2].x)/3,py=(g[0].y+g[1].y+g[2].y)/3;
      const w=reach*.62/.45,h=w*sheet.height/sheet.width;
      arc={node:mikaFxNode('arc2s','mika-arc')};arc.node.style.cssText+=`;left:${px-w/2}px;top:${py-h*.92}px;width:${w}px;height:${h}px`;mikaFxFrame(arc.node,'arc2s',0);}}
    await at(CHOP+110);if(arc)mikaFxFrame(arc.node,'arc2s',1);
    await at(HIT);root.dataset.ragePhase='impact';root.dataset.rageHit='1';setSpriteFrame('hero','skill',8);
    // The hit: one deep round "uỳnh" (the loudest moment) that rings out with its own long rumble.
    result=mikaContact(raw,onRelease,pending);mikaSound('f2-dip',.48,.3);mikaSound('f2-boom',.62,.3);
    // The cleave scorches the floor: a burning cut along the ground through the foe's feet, as the
    // follow-through drives the blade down (the cut's line is drawn at 53% of its cell's height).
    const cut=Math.min($('scene').clientWidth*.9,Math.max(foe.width*2.4,150));
    pending.push(wait(reduced?0:80).then(()=>mikaSound('f2-floor',.28,.25)));
    pending.push(wait(reduced?0:80).then(()=>mikaBurst('impact2',{x:foe.x-foe.width*.1,y:foe.bottom-cut*.03},cut,pending,{hold:1.15,className:'mika-floor-cut'})));
    mikaShake(pending,1);mikaFlash(pending,'cleave');combatV3Camera(1,true,state.boss,pending);
    if(arc){const node=arc.node;pending.push((async()=>{await wait(90);mikaFxFrame(node,'arc2s',2);await wait(110);mikaFxFrame(node,'arc2s',3);await animate(node,[{opacity:1},{opacity:0}],{duration:220,fill:'forwards'});})().finally(()=>node.remove()));}
    await at(HIT+110);setSpriteFrame('hero','skill',9);root.dataset.ragePhase='follow';
    await at(HIT+680);setSpriteFrame('hero','skill',10);root.dataset.ragePhase='recover';
    await at(HIT+1130);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);cancelAnimationFrame(frameId);blade?.remove();arc?.node?.remove();root.style.zIndex=oldZ;root.style.transform=oldTransform;
    const sprite=root.querySelector('.sprite-body');if(sprite){sprite.style.rotate='';sprite.style.transformOrigin='';delete sprite.dataset.lean;}
    delete root.dataset.ragePhase;delete root.dataset.rageHit;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Six-star: Cửu Dương Hồ Diễm ------------------------------------------------------------------
// Nine fox-fire spirits (the departure fox, assets/fx/depart) race from Mika to the foe and burst.
// After the last wave the foe is engulfed: fox-fire bursts up all around its drawn body from the feet
// line, wraps it, burns down to embers and goes out (ART.heroFx.fire.engulf3, the fire stands on 88% of
// its cell and is at most 80% of the cell wide).
function mikaEngulf(foe,pending){
  const sheet=mikaSheet('engulf3');if(!sheet||reduced)return;
  const size=Math.max(foe.width*1.35,foe.height*1.05),node=mikaFxNode('engulf3','mika-engulf');
  node.style.cssText+=`;left:${foe.x}px;top:${foe.bottom-size*.91}px;width:${size}px;height:${size}px;transform:translateX(-50%)`;
  mikaSound('f3-engulf',.32,.3);mikaShake(pending,.35);(window.mikaFxLog||=[]).push({name:'engulf3',from:Math.round(performance.now())});
  pending.push((async()=>{
    for(let i=0;i<sheet.count;i++){mikaFxFrame(node,'engulf3',i);await wait(sheet.frameDuration);}
    await animate(node,[{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});
  })().finally(()=>node.remove()));
}
const MIKA_SPIRIT_WAVE=300;// the waves' booms land 300 ms apart: thùng, thùng, thùng
function mikaFoxSpirits(from,foe,pending){
  const sheet=ART.departFx?.fox;if(!sheet||reduced)return;
  const ground=Math.max(from.foot,foe.bottom);
  for(let i=0;i<9;i++){
    const size=Math.max(54,Math.min(84,foe.height*.7))*(.82+(i%3)*.12),lane=(i%3-1)*9,y=ground-size*.42+lane-(i%2)*6;
    const node=document.createElement('span');node.className='mika-fox-spirit';node.setAttribute('aria-hidden','true');
    node.style.cssText=`left:${from.x}px;top:${y}px;width:${size}px;height:${size}px;--fx-count:${sheet.count};--fx-ms:${sheet.count*sheet.frameDuration*.7}ms;background-image:url('${sheet.src}')`;
    $('combatEffects').append(node);
    const dx=foe.x-from.x+(i%3-1)*foe.width*.18;
    // Three waves of three (one lane each), so each wave's bursts land together with one fireball sound.
    const delay=Math.floor(i/3)*MIKA_SPIRIT_WAVE+i%3*20;
    pending.push(animate(node,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},{opacity:1,transform:`translate(calc(-50% + ${dx*.25}px),-50%) scale(1)`,offset:.25},{opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% - ${6+i%3*5}px)) scale(1)`,offset:.86},{opacity:0,transform:`translate(calc(-50% + ${dx+12}px),calc(-50% - 14px)) scale(1.35)`}],{duration:520,delay,easing:'cubic-bezier(.35,.1,.55,1)',fill:'backwards'}).finally(()=>node.remove()));
    pending.push(wait(delay+450).then(()=>{if(!reduced){// Each wave bursts with the main sun burst's own sound; after the last, form 1's flame whoosh rings out
    // exactly as form 1 plays it (mika-ultimate.js: 'flame-whoosh', volume .48, pan .12).
    if(i%3===0){mikaSound('f3-wave',.56,.3);mikaShake(pending,.6);if(i===6){mikaSound('flame-whoosh',.48,.12);pending.push(wait(140).then(()=>mikaEngulf(foe,pending)));}}mikaBurst('impact3',{x:foe.x+(i%3-1)*foe.width*.15,y:foe.y-(i%2)*foe.height*.15},foe.width*.55,pending,{hold:.6,fade:120});}}));
  }
}
// The nine tails flare: a nine-tailed sun of fox-fire (impact3) opens behind her back.
function mikaTailFlare(root,pending){
  const sheet=mikaSheet('impact3');if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='mika-tail-flare';node.setAttribute('aria-hidden','true');
  node.style.cssText=`background-image:url('${sheet.src}');background-size:${sheet.count*100}% 100%`;root.prepend(node);
  pending.push((async()=>{
    for(const f of [0,1,2]){mikaFxFrame(node,'impact3',f);await wait(110);}
    await animate(node,[{opacity:1,rotate:'0deg'},{opacity:.9,rotate:'14deg'}],{duration:420,fill:'forwards'});
  })());
  return node;
}
async function mikaNineSunSweep(raw,onRelease){
  mikaWarmSounds(3);
  const root=actor('hero'),oldZ=root.style.zIndex,pending=[],start=performance.now();
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  let result={amount:0,blocked:0},back=null,front=null,ring=null,flare=null,frameId=0;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.ragePhase='flare';root.dataset.state='cast';root.dataset.mikaFlare='true';
  try{
    combatVoice('hero','cast');mikaSound('gather',.34,-.15);mikaSound('f3-flare',.38,-.25);popActorSkill('hero',HEROES.fire.skill,true,pending);
    setSpriteFrame('hero','skill',0);flare=mikaTailFlare(root,pending);
    const foe=mikaFoeBody(),hero=combatV3Point('hero'),reach=Math.max(150,foe.right+10-mikaGrip(3,3).x);
    // Drawn back, the glaive reaches off the stage behind her; swung round, past the foe.
    back=mikaWeapon('glaive3',reach*.75);front=mikaWeapon('glaive3',reach);
    const WIND=650,SWEEP=1250,HIT=1420;
    const track=now=>{
      if(!back?.node.isConnected)return;
      const t=now-start;
      if(t>=WIND&&t<SWEEP+80){
        const g=mikaGrip(3,1),grow=mikaEase((t-WIND)/480);
        back.frame(t<WIND+260?0:1+Math.floor(t/90)%2);back.place(g.x,g.y,180,mikaLerp(.35,1,grow));
        back.node.style.opacity=String(t<SWEEP?mikaLerp(0,1,(t-WIND)/120):Math.max(0,1-(t-SWEEP)/80));
      }else back.node.style.opacity='0';
      if(t>=SWEEP+100){
        const g=mikaGrip(3,3),p=(t-SWEEP-100)/90;
        front.frame(1+Math.floor(t/80)%2);front.place(g.x,g.y,mikaLerp(-8,0,p),mikaLerp(.55,1,mikaEase(p)));
        front.node.style.opacity=String(t<1700?Math.min(1,p*2):Math.max(0,1-(t-1700)/300));
      }else front.node.style.opacity='0';
      if(ring?.isConnected){const g=mikaGrip(3,3);ring.style.left=g.x+'px';ring.style.top=g.y+'px';}
      frameId=requestAnimationFrame(track);
    };
    if(back&&front){back.node.style.opacity='0';front.node.style.opacity='0';frameId=requestAnimationFrame(track);}
    await at(WIND);setSpriteFrame('hero','skill',1);root.dataset.ragePhase='draw';mikaSound('draw',.34,-.3);
    if(flare){const node=flare;mikaFxFrame(node,'impact3',3);pending.push(animate(node,[{opacity:.9,rotate:'14deg'},{opacity:0,rotate:'30deg',scale:'1.15'}],{duration:320,fill:'forwards'}).finally(()=>node.remove()));}
    await at(SWEEP);setSpriteFrame('hero','skill',2);root.dataset.ragePhase='sweep';combatVoice('hero','release');mikaSound('f3-sweep',.48,0);
    // The flat ring of the spin, centred on the grip, as wide as the sweep.
    if(!reduced&&mikaSheet('ring3')){ring=mikaFxNode('ring3','mika-ring');const width=reach*2/.94;ring.style.cssText+=`;width:${width}px;height:${width*mikaSheet('ring3').height/mikaSheet('ring3').width}px`;mikaFxFrame(ring,'ring3',0);}
    await at(SWEEP+100);setSpriteFrame('hero','skill',3);if(ring)mikaFxFrame(ring,'ring3',1);mikaSound('cut',.34,.2);
    await at(HIT);root.dataset.ragePhase='impact';root.dataset.rageHit='1';delete root.dataset.mikaFlare;
    result=mikaContact(raw,onRelease,pending);mikaSound('f3-sun',.56,.3);mikaSound('finale',.4,.25);
    mikaBurst('impact3',{x:foe.x,y:foe.y},Math.min($('scene').clientWidth*.85,Math.max(foe.width,foe.height)*1.9),pending,{hold:1.25,fade:240});
    mikaShake(pending,1.6);mikaFlash(pending,'sun');combatV3Camera(1,true,state.boss,pending);
    if(ring){const node=ring;pending.push((async()=>{await wait(110);mikaFxFrame(node,'ring3',2);await wait(170);mikaFxFrame(node,'ring3',3);await animate(node,[{opacity:1},{opacity:0}],{duration:260,fill:'forwards'});})().finally(()=>node.remove()));}
    await at(HIT+130);setSpriteFrame('hero','skill',4);root.dataset.ragePhase='spirits';
    mikaFoxSpirits({x:mikaGrip(3,4).x,foot:hero.foot},foe,pending);
    await at(2350);setSpriteFrame('hero','skill',5);root.dataset.ragePhase='recover';
    await at(2850);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);cancelAnimationFrame(frameId);back?.remove();front?.remove();ring?.remove();flare?.remove();root.style.zIndex=oldZ;
    delete root.dataset.mikaFlare;delete root.dataset.ragePhase;delete root.dataset.rageHit;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}

// ---- Basic attack: the form's own slash art -------------------------------------------------------
// The lunge and the attack poses are the form's (forms.json "attack"); only the cut is redrawn: a
// heavy fox-fire broadsword arc (form 2) or a moon-glaive crescent (form 3), peaking at contact.
const mikaBaseSlash=combatV3Slash;
combatV3Slash=function(point,key,index,ultimate,direction,pending){
  // Six-star: the long glaive's own crescent sweep (sweep3), drawn from upper left down to the strike.
  const form=mikaSlashForm,name=form===3?'sweep3':'slash'+form,sheet=mikaSheet(name);
  if(!form||key!=='fire'||!sheet||reduced)return mikaBaseSlash(point,key,index,ultimate,direction,pending);
  const foe=mikaFoeBody(),size=form===3?Math.min(Math.max(foe.height*1.3,foe.width*1.1),point.width*1.3,230):Math.min(foe.height*1.25,point.width*1.15,220);
  // Three cuts in a chain: a falling diagonal, a rising one, an overhead (form 2). Form 3's crescent
  // trail is drawn from upper left bulging to lower left; mirrored across its diagonal (rotate 90 after
  // flipping vertically) it bulges OUTWARD to the upper right, away from her hands, as the glaive tip
  // sweeps from overhead down onto the foe, its bright end landing on the foe's near side.
  const pose=form===2?[[0,1],[0,-1],[28,1]][index%3]:[[90,-1],[80,-1],[100,-1]][index%3];
  const node=mikaFxNode(name,'mika-slash');
  const aim=Math.min(foe.x,foe.left+Math.min(foe.width*.35,70));
  const at=form===3?{x:aim-direction*size*.2,y:foe.y-size*.15}:{x:foe.x-direction*6,y:foe.y};
  node.style.cssText+=`;left:${at.x}px;top:${at.y}px;width:${size}px;height:${size}px`;
  const frames=[0,1,1,2,3],contact=COMBAT_V3_STRIKES.fire.contact;
  pending.push((async()=>{
    for(const [i,f] of frames.entries()){
      mikaFxFrame(node,name,f);
      node.style.transform=`translate(-50%,-50%) rotate(${pose[0]*direction}deg) scale(${direction*(1+i*.03)},${pose[1]})`;
      await wait(i===0?contact:sheet.frameDuration);
    }
    await animate(node,[{opacity:1},{opacity:0}],{duration:120,fill:'forwards'});
  })().finally(()=>node.remove()));
};

// ---- Six-star basic attack: the long glaive swung from the butt of its shaft -------------------------
// The shared lunge (combat-v3.js) asks for "attack" frames by role (wind-up, ready, launch, contact,
// recover, rest) with indices that differ per chain stance. Six-star Mika plays her own "slash" sheet
// in that order instead: ready with both hands at the shaft's end, the glaive swung back behind her,
// swept forward low, held out at full reach on contact, carried up past the foe, then settling.
const MIKA_SLASH_FIRST=[0,1,2,2,3,4],MIKA_SLASH_NEXT=[1,1,2,3,4];
let mikaSlashCalls=0,mikaSlashOrder=MIKA_SLASH_FIRST,mikaSlashShorten=0;
const mikaBaseFrame=combatV3Frame,mikaBaseAction=combatV3Action,mikaBasePose=combatV3Pose;
combatV3Frame=function(side,action,index){
  if(mikaSlashForm!==3||side!=='hero'||action!=='attack')return mikaBaseFrame(side,action,index);
  // Index 5 is always the rest after a cut; the next cut of a multi-hit chain starts from wind-up.
  if(index===5){mikaSlashCalls=0;mikaSlashOrder=MIKA_SLASH_NEXT;return mikaBaseFrame(side,'slash',5);}
  return mikaBaseFrame(side,'slash',mikaSlashOrder[Math.min(mikaSlashCalls++,mikaSlashOrder.length-1)]);
};
combatV3Action=function(side,action,duration){
  return mikaBaseAction(side,mikaSlashForm===3&&side==='hero'&&action==='attack'?'slash':action,duration);
};
// The glaive reaches far: the lunge stops short, so the crescent (not her body) meets the foe.
function mikaGlaiveShortening(){
  const sheet=mikaSheet('sweep3')&&ART.heroForms?.fire?.['3']?.slash;if(!sheet)return 0;
  const from=combatV3Point('hero'),to=combatV3Point('enemy'),travel=Math.max(0,Math.abs(to.x-from.x)-from.width*.43);
  // Contact pose ("strike" frame 3): the crescent's middle sits 0.34 of the drawn cell right of its
  // centre, her body's front (boots, skirt) 0.17.
  const cell=from.width*(sheet.scale||1),reach=cell*.34,front=cell*.17,foe=mikaFoeBody();
  // The crescent lands on the foe's near side (a big foe's middle can be far beyond its front), and her
  // body stops short of the foe's drawn edge, so she never overlaps any foe.
  const aim=Math.min(foe.x,foe.left+Math.min(foe.width*.35,70));
  // (the contact pose adds 8px and a lean to the planned travel; measured overshoot ~26px)
  const advance=Math.min(travel,aim-from.x-reach,foe.left-34-from.x-front);
  window.mikaLungeLog={foeLeft:Math.round(foe.left),heroX:Math.round(from.x),front:Math.round(front),travel:Math.round(travel),advance:Math.round(advance)};// studio QA
  return Math.max(0,Math.min(travel,travel-Math.max(0,advance)));
}
combatV3Pose=function(node,transform,...rest){
  if(mikaSlashShorten&&node===actor('hero')){
    const m=/^translate\((-?[\d.]+)px,/.exec(transform);
    if(m&&+m[1]>0)transform=transform.replace(m[0],`translate(${Math.max(0,+m[1]-mikaSlashShorten)}px,`);
  }
  return mikaBasePose(node,transform,...rest);
};

// ---- Six-star departure: a fox-like dash ----------------------------------------------------------
// Like the shared walk off (adventure-effects.js), but on the "dash" loop (every frame is a stride;
// no anticipation poses) with the glaive over her shoulder; the fox-fire spirit runs at her heels.
async function mikaFoxDash(){
  const hero=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children],dash=spriteDefinition('hero','fire','dash').sheet;
  hero.dataset.departing='true';
  let fx=null;
  try{
    setSpriteFrame('hero','dash',0);fx=departFx('fire');
    await wait(reduced?0:160);
    const start=performance.now(),duration=reduced?1:2300;
    await new Promise(resolve=>{
      function tick(now){
        // A short burst off the mark, then the shared pace (the same distance as everyone's walk off).
        const p=Math.min(1,(now-start)/duration),camera=width*.95*p,eased=(p<.15?p*p/.3:p-.075)/.925;
        hero.style.transform=`translateX(${width*1.65*eased-camera}px)`;
        hero.dataset.worldX=String(width*1.65*eased);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','dash',Math.floor((now-start)/(dash.frameDuration||90))%dash.count);fx?.tick(now,camera);
        layers.forEach(layer=>{layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`;});
        if(p<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    await animate(hero,[{opacity:1},{opacity:0}],{duration:180});hero.style.opacity='0';
  }finally{fx?.remove();delete hero.dataset.departing;delete hero.dataset.worldX;hero.style.transform='';setSpriteAction('hero','idle');}
}
