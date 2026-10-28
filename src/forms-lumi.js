/* Lumi's star forms (HERO_KITS.lightning, see hero-kits.js).
 * Four-star "Tinh Lôi Sứ Giả" flings crackling stars from her staff and, for Tinh Lôi Ngũ Phạt, calls
 * five stars into a pentagram over the foe that each fire a star bolt. Six-star "Thiên Tinh Lôi Chủ"
 * fires orbit-ring bolts from her spear and, for Cửu Thiên Tinh Phạt, spins its rings out into a galaxy
 * that rains nine star bolts; she leaves a cleared stage sitting on her spear like a witch's broom.
 * In every form small gold stars circle her while she rests.
 * Art: ART.heroFx.lightning (assets/fx/heroes/lightning) and her form sheets hover/skill/ride
 * (assets/heroes/forms/lightning/form-N). Damage keeps the existing maths: the basic attack is
 * attack()'s chain/critical/raw-per-hit through damage(); the ultimate is rageChoreography's
 * raw/hits per bolt through damage() with the same ledger and onRelease. Only the staging changes. */
// Orb / star-head of her weapon in a frame, as a share of the drawn cell (measured on the sheets).
const LUMI_TIP={
  2:{attack:{1:[.33,.26],3:[.81,.39],4:[.76,.79]},skill:{2:[.41,.35],3:[.75,.41],4:[.81,.61]}},
  3:{attack:{1:[.27,.37],2:[.82,.44],3:[.83,.44]},skill:{2:[.38,.34],3:[.40,.36],4:[.81,.61]}}
};
function lumiTip(form,action,frame){
  const sprite=actor('hero').querySelector('.sprite-body'),r=sprite.getBoundingClientRect(),s=$('scene').getBoundingClientRect();
  const [u,v]=LUMI_TIP[form]?.[action]?.[frame]||[.72,.35];
  return {x:r.left-s.left+r.width*u,y:r.top-s.top+r.height*v};
}
// The foe's drawn body (sheet span, feet and body height), not its sprite cell, as Noct measures it.
function lumiFoeBody(){
  const cell=actor('enemy').getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,bottom=cell.top-scene.top+cell.height*foot;
  return {left,right,top,bottom,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};
}
// One generated strip on the effects layer. anchorY: the point of the cell placed on `point`.
function lumiFx(name,point,size,{rotate=0,anchorY=.5,loop=false,frames=null,frameMs=null,cls=''}={}){
  const sheet=ART.heroFx?.lightning?.[name];if(!sheet||reduced)return null;
  const node=document.createElement('span');node.className='lumi-fx lumi-fx-'+name+(cls?' '+cls:'');node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size}px;height:${size}px;--fx-count:${sheet.count};background-image:url('${sheet.src}');translate:-50% ${-anchorY*100}%;transform-origin:50% ${anchorY*100}%;rotate:${rotate}deg`;
  $('combatEffects').append(node);
  lumiPlay(node,sheet,frames||Array.from({length:sheet.count},(_,i)=>i),frameMs||sheet.frameDuration,loop);
  return node;
}
// Steps a strip through `order` (frame indices); a loop repeats the tail from `loop` (index into order, true=0).
function lumiPlay(node,sheet,order,ms,loop=false){
  const set=i=>{node.style.backgroundPosition=`${sheet.count>1?i/(sheet.count-1)*100:0}% 0`;};
  const start=performance.now(),from=loop===true?0:loop===false?-1:loop;set(order[0]);
  return new Promise(resolve=>{
    function tick(now){
      if(!node.isConnected)return resolve();
      let k=Math.floor((now-start)/ms);
      if(k>=order.length){if(from<0){if(!node.dataset.keep)node.remove();return resolve();}k=from+(k-order.length)%(order.length-from);}
      set(order[k]);requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
function lumiFade(node,pending,duration=320,extra={}){
  if(!node)return;
  pending.push(animate(node,[{opacity:1},{opacity:0,...extra}],{duration,easing:'ease-in',fill:'forwards'}).finally(()=>node.remove()));
}
// A projectile strip flying from `from` to `to`, its frames looping, nose along its path.
function lumiThrow(name,from,to,size,duration){
  const node=lumiFx(name,from,size,{loop:true,cls:'lumi-projectile'});if(!node)return Promise.resolve();
  const dx=to.x-from.x,dy=to.y-from.y,angle=Math.atan2(dy,dx)*180/Math.PI;node.style.rotate=angle+'deg';
  return animate(node,[{translate:'-50% -50%',scale:'.55',opacity:0},{opacity:1,scale:'1',offset:.18},{translate:`calc(-50% + ${dx*.5}px) calc(-50% + ${dy*.5-10}px)`,offset:.5},{translate:`calc(-50% + ${dx}px) calc(-50% + ${dy}px)`,scale:'1',opacity:1}],{duration,easing:'cubic-bezier(.3,0,.75,1)'}).finally(()=>node.remove());
}
function lumiHitCount(i,hits,pending){
  if(hits<2)return;
  const count=document.createElement('span');count.className='combat-v3-hit-count';count.textContent=String(i+1).padStart(2,'0')+' / '+String(hits).padStart(2,'0');$('combatEffects').append(count);
  combatV3Fx(count,[{opacity:0,transform:'translate(-50%,5px)'},{opacity:1,transform:'translate(-50%,0)',offset:.2},{opacity:0,transform:'translate(-50%,-3px)'}],{duration:520},pending);
}
function lumiRecoil(target,oldTarget,strong,pending){
  if(reduced)return;
  const recoil=combatOuterMotion('enemy',strong?13:9,strong?5:4);
  pending.push(animate(target,[{transform:oldTarget||'none',filter:'brightness(1.35)'},{transform:`translate(${recoil.distance}px,-3px) rotate(${recoil.tilt}deg)`,filter:'brightness(1.2)',offset:.25},{transform:oldTarget||'none',filter:'none'}],{duration:strong?260:230,easing:'ease-out'}));
}
/* Basic attack: four-star throws a crackling star from the staff orb, six-star fires an orbit-ring
 * bolt from the spear head. Same maths as attack(): chain bonus, every third chained blow critical,
 * raw split over the hits, damage() at contact. She stays where she floats (a caster never dashes). */
async function lumiStarAttack(form,raw,{hits=1,damageLedger=null,attackChain=1}={}){
  const root=actor('hero'),target=actor('enemy'),scene=$('scene'),pending=[],old=root.style.transform,oldZ=root.style.zIndex,oldTarget=target.style.transform;
  const chain=Math.max(1,Math.floor(attackChain)),critical=chain>=3&&chain%3===0;
  raw*=attackChainMultiplier(chain)*(critical?1.5:1);hits=Math.max(1,Math.min(8,Math.round(hits)||1));
  const pose=form===3?{windup:1,launch:2,follow:3}:{windup:1,launch:3,follow:4},projectile=form===3?'orbitbolt':'star',burst=form===3?'ringburst':'starpop';
  let amount=0,blocked=0,stored=0;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';scene.classList.add('combat-v3-active');root.dataset.attackChain=chain;root.dataset.attackStance='lumi-star';
  try{
    combatVoice('hero','attack');warmLumiSounds(form);
    popActorSkill('hero',chain>1?'ĐÒN ×'+chain+' · +'+Math.round((attackChainMultiplier(chain)-1)*100)+'%':form===3?'Quỹ Đạo Lôi':'Tinh Lôi Tiêu',false,pending);
    for(let i=0;i<hits;i++){
      setSpriteFrame('hero','attack',pose.windup);
      if(!reduced)pending.push(animate(root,[{transform:old||'none'},{transform:'translate(-6px,-2px)'}],{duration:150,easing:'ease-out',fill:'forwards'}));
      await wait(i?110:170);
      setSpriteFrame('hero','attack',pose.launch);lumiSound(form===3?'shot':'throw',{volume:.34,pan:-.15},true);
      const body=lumiFoeBody(),from=lumiTip(form,'attack',pose.launch),to={x:body.x-body.width*.08,y:body.top+body.height*.45};
      if(!reduced)pending.push(animate(root,[{transform:'translate(-6px,-2px)'},{transform:'translate(3px,0px)'},{transform:old||'none'}],{duration:320,easing:'ease-out'}));
      await lumiThrow(projectile,from,to,form===3?Math.min(118,body.height*.85+30):Math.min(104,body.height*.7+30),reduced?1:230);
      setSpriteFrame('hero','attack',pose.follow);
      lumiFx(burst,to,Math.min(190,Math.max(110,body.height*1.15)));
      const result=damage('hero',raw/hits,damageLedger);amount+=result.amount;blocked+=result.blocked;stored+=result.stored||0;
      combatVoice('enemy','hurt');hitAccents('hero',result,critical,pending);
      combatV3Action('enemy','hurt',critical?560:410);if(form===3)lumiSound('ring',{volume:critical?.45:.38,pan:.25},true);else combatV3HitSound('lightning',critical);// form 1's own hit
      combatV3Number('enemy',result.stored?'TÍCH +'+result.stored:result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.stored?'stored':result.amount?(critical?'crit':'damage'):'armor',i,pending);
      lumiHitCount(i,hits,pending);combatV3Camera(1,critical,false,pending);lumiRecoil(target,oldTarget,critical,pending);
      await wait(170);setSpriteFrame('hero','attack',5);await wait(i<hits-1?90:200);
    }
    await Promise.all(pending);
    return {amount,blocked,...(stored?{stored}:{})};
  }finally{
    await Promise.allSettled(pending);
    root.style.transform=old;root.style.zIndex=oldZ;target.style.transform=oldTarget;target.style.filter='';
    root.classList.remove('combat-v3-acting');scene.classList.remove('combat-v3-active');delete root.dataset.attackChain;delete root.dataset.attackStance;
    combatV3Action('hero','idle');combatV3Action('enemy','idle');
  }
}
/* Ultimate (Tinh Lôi Ngũ Phạt / Cửu Thiên Tinh Phạt). rageChoreography's contract: a 0-3000 ms
 * timeline, `hits` blows of raw/hits each through damage() with one ledger, onRelease on the last. */
function lumiBoltHit(form,i,count,raw,ledger,target,oldTarget,pending){
  const result=damage('hero',raw/count,ledger),last=i===count-1;
  combatVoice('enemy','hurt');
  lumiFormThunder(i,count);
  combatV3Camera(1,true,false,pending);
  combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',i,pending);hitAccents('hero',result,false,pending);
  setSpriteAction('enemy','hurt',230);lumiRecoil(target,oldTarget,last,pending);
  return result;
}
// A star bolt from `from` (its star) down to `to` (where it strikes), plus the strike at the feet.
function lumiStarBolt(from,to,strike,big=false){
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),size=length/.88;// the bolt runs 6%..94% of its cell
  lumiFx('starbolt',{x:(from.x+to.x)/2,y:(from.y+to.y)/2},size,{rotate:Math.atan2(dy,dx)*180/Math.PI-90,cls:'lumi-bolt'+(big?' big':'')});
  lumiFx('groundstrike',to,strike,{anchorY:.82});
}
async function lumiStarRage(form,raw,{hits=1,onRelease=()=>{}}={}){
  const root=actor('hero'),target=actor('enemy'),pending=[],ledger={raw:0,applied:0},old=root.style.transform,oldZ=root.style.zIndex,oldTarget=target.style.transform;
  const start=performance.now(),at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const count=Math.max(1,hits),body=lumiFoeBody(),scene=$('scene'),W=scene.clientWidth,H=scene.clientHeight;
  // The sky sign hangs over the foe, clear of its head, inside the stage; over a towering foe
  // (a boss) there is little sky left, so the sign shrinks rather than hiding its whole body.
  const sign=Math.max(110,Math.min(form===3?190:200,Math.max(body.width,body.height)*(form===3?1.3:1.25),Math.max(0,body.top)*1.2+40));
  const sky={x:Math.max(sign*.5+6,Math.min(W-sign*.5-6,body.x)),y:Math.max(sign*.45,Math.min(body.top-sign*.6,H*.3))};
  const strike=Math.max(84,Math.min(150,body.width*.95));
  let amount=0,blocked=0,seal=null,galaxy=null,spin=null;
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.ragePhase='chant';root.dataset.foeHudOver='true';
  try{
    combatVoice('hero','cast');warmLumiSounds(form);popActorSkill('hero',HEROES.lightning.skill,true,pending);
    setSpriteFrame('hero','skill',0);await at(200);setSpriteFrame('hero','skill',1);await at(460);setSpriteFrame('hero','skill',2);
    root.dataset.ragePhase='summon';root.dataset.lumiSky='true';if(form===2)lumiSound('stars',{volume:.4,pan:.1},true);
    const tip=lumiTip(form,'skill',2);
    // Five stars on the seal's circle (its drawn radius is .36 of the cell), top first, clockwise.
    const stars=Array.from({length:5},(_,k)=>{const a=-Math.PI/2+k*2*Math.PI/5;return {x:sky.x+Math.cos(a)*sign*.36,y:sky.y+Math.sin(a)*sign*.36};});
    if(form===2){
      // Five stars leave her raised orb one after another and fly up to their places in the sky; each
      // lands (a mark-tree run, form 2's "stars" cue), then the seal draws itself and locks with a ring.
      const motes=[];
      stars.forEach((p,k)=>{
        const leave=520+k*85,land=leave+460;
        const mote=lumiFx('idlestar',tip,sign*.17,{loop:true,cls:'lumi-mote'});if(!mote)return;motes.push(mote);
        const to={translate:`calc(-50% + ${p.x-tip.x}px) calc(-50% + ${p.y-tip.y}px)`,scale:'1.15'};
        mote.style.opacity='0';
        pending.push(animate(mote,[{translate:'-50% -50%',scale:'.4',opacity:0},{opacity:1,scale:'1',offset:.2},{translate:`calc(-50% + ${(p.x-tip.x)*.55}px) calc(-50% + ${(p.y-tip.y)*.55-30}px)`,offset:.6},{...to,opacity:1}],{duration:460,delay:Math.max(0,start+leave-performance.now()),easing:'cubic-bezier(.35,.1,.3,1)',fill:'both'}).then(()=>{Object.assign(mote.style,to);mote.style.opacity='1';}));
      });
      await at(1100);root.dataset.ragePhase='channel';setSpriteFrame('hero','skill',3);
      await at(1320);
      seal=lumiFx('pentagram',sky,sign,{frames:[0,1,2,3,4,5],frameMs:80,loop:3,cls:'lumi-sky'});motes.forEach(mote=>mote.remove());
      lumiSound('seal',{volume:.4,pan:.2},true);// the pentagram locks with a ring
      await at(1500);setSpriteFrame('hero','skill',4);combatVoice('hero','release');
    }else{
      // The rings around her spear's star spin off it and open into a galaxy over the foe (a real
      // slinky-laser foley), stars stream along its arms (mark tree) as it glides into place.
      galaxy=lumiFx('galaxy',tip,sign,{frames:[0,1,0,1,2,3],frameMs:140,loop:5,cls:'lumi-sky'});
      // The laser's attack (90 ms into the clip) lands as the sphere is born: the galaxy disc's first frame (strip
      // frame 2) shows 4 x 140 ms after the rings start spinning at the spear head (measured in the studio).
      pending.push(at(performance.now()-start+560-90).then(()=>lumiSound('laser',{volume:.42,pan:.1},true)));
      if(galaxy){
        galaxy.style.scale='.6';
        spin=galaxy.animate([{rotate:'0deg'},{rotate:'-360deg'}],{duration:4200,iterations:Infinity});
        pending.push(animate(galaxy,[{translate:'-50% -50%',scale:'.6'},{translate:`calc(-50% + ${sky.x-tip.x}px) calc(-50% + ${sky.y-tip.y}px)`,scale:'1'}],{duration:640,delay:480,easing:'cubic-bezier(.45,.05,.3,1)',fill:'both'}).then(()=>{galaxy.style.left=sky.x+'px';galaxy.style.top=sky.y+'px';galaxy.style.scale='1';}));
      }
      pending.push(at(1000).then(()=>lumiSound('stream',{volume:.34,pan:.15})));// stars stream along its arms
      await at(1080);root.dataset.ragePhase='channel';setSpriteFrame('hero','skill',3);
      await at(1340);setSpriteFrame('hero','skill',4);combatVoice('hero','release');
    }
    // Bolts: the seal's stars fire in its drawing order; the galaxy rains from all over its disc,
    // the last bolt the biggest, straight from its heart. They land along the foe's feet.
    const first=form===2?1620:1450,step=form===2?Math.min(130,600/count):Math.min(150,880/count),order=[0,2,4,1,3];
    root.dataset.ragePhase='skyfall';
    for(let i=0;i<count;i++){
      await at(first+i*step);
      const last=i===count-1,lane=count>1?(i*.618)%1-.5:0;
      let from;
      if(form===2)from=stars[order[i%5]];
      else{const a=i*2.39996,r=last?0:sign*(.12+.16*((i*.37)%1));from={x:sky.x+Math.cos(a)*r,y:sky.y+Math.sin(a)*r*.9};}
      const to={x:body.x+(last?0:lane*body.width*.62),y:body.bottom-2};
      if(form===2)lumiFx('starpop',from,sign*.42,{frameMs:45});// the star that fires flares
      lumiStarBolt(from,to,last?strike*1.3:strike,last);
      if(last){lumiFx(form===3?'ringburst':'starpop',{x:body.x,y:body.top+body.height*.5},Math.min(240,body.height*1.6+40),{cls:'lumi-finale'});lumiFlash(pending);}
      const result=lumiBoltHit(form,i,count,raw,ledger,target,oldTarget,pending);amount+=result.amount;blocked+=result.blocked;
      if(last){onRelease(pending);update();}
    }
    await at(2450);root.dataset.ragePhase='recover';delete root.dataset.lumiSky;setSpriteFrame('hero','skill',5);
    lumiFade(seal,pending,380,{scale:'1.08'});
    if(galaxy){pending.push(animate(galaxy,[{opacity:1,scale:'1'},{opacity:0,scale:'.2'}],{duration:420,easing:'ease-in',fill:'forwards'}).finally(()=>{spin?.cancel();galaxy.remove();}));}
    await at(3000);await Promise.all(pending);return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);seal?.remove();spin?.cancel();galaxy?.remove();
    root.style.transform=old;root.style.zIndex=oldZ;target.style.transform=oldTarget;target.style.filter='';
    delete root.dataset.ragePhase;delete root.dataset.foeHudOver;delete root.dataset.lumiSky;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
// Her kit's own sounds (assets/audio/hero-forms/lightning, scripts/prepare_lumi_form_sounds.py).
const LUMI_THUNDER=['thunder-open','thunder-crack','thunder-tail'];// form 1's per-bolt strikes (decoded only: no opening rumble)
const LUMI_SOUNDS={2:['stars','seal','throw',...LUMI_THUNDER],3:['laser','stream','shot','ring',...LUMI_THUNDER]};
/* The bolts sound exactly like form 1's storm (cast-redesign.js lumiThunderStrike, its own clips and volumes): the
 * first bolt opens with 'thunder-open', the middle bolts 'thunder-crack', the last 'thunder-tail'. Forms 2-3 do NOT
 * play form 1's opening rumble (player's request): their own stars/seal/laser/stream lead in instead.
 * Five bolts (four-star) are form 1's exact calls. Nine bolts (six-star) keep the pattern; as the 4.8 s clips pile up, the oldest middle crack is stopped to make room, so the
 * game's 8-sound cap never cuts the opening strike or the tail. */
function lumiFormThunder(index,count){
  if(count===5)return lumiThunderStrike(index);
  if(reduced&&index>0&&index<count-1)return;
  const last=index===count-1,kind=index===0?'open':last?'tail':'crack';
  if(index===0)for(const entry of castSoundSources)if(entry.id==='lightning-thunder-rumble'){try{entry.source.stop();}catch{}castSoundSources.delete(entry);}
  while(castSoundSources.size>=8){
    const oldest=[...castSoundSources].find(entry=>entry.id==='lightning-thunder-crack');if(!oldest)break;
    try{oldest.source.stop();}catch{}castSoundSources.delete(oldest);
  }
  return playCastSound('lightning','thunder-'+kind,{volume:index===0?.62:last?.68:.30,pan:.22+(index%2?.08:-.08)});
}
function warmLumiSounds(form){
  const context=combatV3AudioContext();if(!context)return;
  for(const name of LUMI_SOUNDS[form]||[])if(ART.castSounds['lightning-'+name])decodeCastSound(context,'lightning-'+name).catch(()=>{});
}
// NO FX keeps only the essential beats so stacked cues never play all at once.
function lumiSound(name,options,essential=false){if(reduced&&!essential)return;playCastSound('lightning',name,options);}
function lumiFlash(pending){
  if(reduced)return;
  const flash=document.createElement('span');flash.className='form-skill-flash lightning';flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
  pending.push(animate(flash,[{opacity:0},{opacity:.7,offset:.2},{opacity:0}],{duration:480}).finally(()=>flash.remove()));
}
const lumiFormRage=rageChoreography;
rageChoreography=async function(side,raw,options={}){
  if(side==='hero'&&state.key==='lightning'&&combatHeroForm('lightning')>=2)return lumiStarRage(combatHeroForm('lightning'),raw,options);
  return lumiFormRage(side,raw,options);
};
/* Six-star departure: she lifts her spear, hops onto it in a pop of stars and flies off on it like a
 * witch on a broom, the comet trail (hero-departures.js) streaming from it. */
async function departLumiRide(){
  const root=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children];
  root.dataset.departing='true';
  let fx=null;
  try{
    setSpriteFrame('hero','skill',1);await wait(reduced?0:220);
    const p=combatV3Point('hero');lumiFx('starpop',{x:p.x,y:p.y-p.height*.08},p.width*.8);lumiSound('stream',{volume:.26,pan:-.2});
    root.dataset.riding='true';setSpriteFrame('hero','ride',0);fx=departFx('lightning');
    await animate(root,[{transform:'translate(0px,0px)'},{transform:'translate(0px,-8px)'}],{duration:reduced?1:260,easing:'ease-out'});
    const start=performance.now(),duration=reduced?1:2400;
    await new Promise(resolve=>{
      function tick(now){
        const t=Math.min(1,(now-start)/duration),camera=width*.95*t;
        root.style.transform=`translate(${width*1.65*t-camera}px,${-8-38*t*t+Math.sin((now-start)/170)*1.6}px)`;
        root.dataset.worldX=String(width*1.65*t);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','ride',Math.floor((now-start)/110)%6);fx?.tick(now,camera);
        layers.forEach(layer=>layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`);
        if(t<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    await animate(root,[{opacity:1},{opacity:0}],{duration:180});root.style.opacity='0';
  }finally{fx?.remove();delete root.dataset.departing;delete root.dataset.worldX;delete root.dataset.riding;root.style.transform='';setSpriteAction('hero','idle');}
}
HERO_KITS.lightning={forms:{
  2:{ultimate:()=>formOriginalUltimate(),attack:(raw,options)=>lumiStarAttack(2,raw,options)},
  3:{ultimate:()=>formOriginalUltimate(),attack:(raw,options)=>lumiStarAttack(3,raw,options),depart:()=>departLumiRide()}
}};
/* Resting stars: a few small gold stars circle her on tilted orbits in every form, passing in front of
 * and behind her (CSS: x and y swing a quarter period apart; z-index flips at the near half). */
const LUMI_IDLE_STARS=[[17,3.2,0,40,10,50],[13,2.6,1.1,34,8,30],[15,3.8,2.3,44,12,64],[11,2.9,.6,30,7,20],[14,3.5,1.7,38,9,76],[10,2.4,2.9,26,6,40]];
function mountLumiIdleStars(){
  const sheet=ART.heroFx?.lightning?.idlestar,root=actor('hero');root.querySelector('.lumi-idle-stars')?.remove();
  if(!sheet||state.key!=='lightning')return;
  const box=document.createElement('span');box.className='lumi-idle-stars';box.setAttribute('aria-hidden','true');
  box.style.cssText=`--star-src:url('${sheet.src}');--star-ms:${sheet.count*sheet.frameDuration}ms`;
  // Fewer before her six-star form: two, then three, then all six (the player found forms 1-2 too busy).
  const count=[2,3,6][combatHeroForm('lightning')-1]||6;
  box.innerHTML=LUMI_IDLE_STARS.slice(0,count).map(([size,dur,delay,rx,ry,y])=>`<i style="--dur:${dur}s;--delay:${-delay}s;--ry:${ry}"><u style="--rx:${rx}"><b style="--s:${size}%;--y:${y}%"></b></u></i>`).join('');
  root.append(box);
}
// Her form sheets and skill strips are decoded up front and kept painted (a 2px, nearly transparent
// swatch inside her actor) so the first throw or cast never shows an empty frame while one decodes.
function warmLumiArt(){
  const form=combatHeroForm('lightning'),sheets=[...Object.values(ART.heroForms?.lightning?.[form]||{}),...Object.values(ART.heroFx?.lightning||{})];
  const urls=[...new Set(sheets.map(sheet=>sheet?.src).filter(Boolean))];if(!urls.length)return;
  const swatch=document.createElement('span');swatch.className='lumi-warm';swatch.setAttribute('aria-hidden','true');
  swatch.style.backgroundImage=urls.map(url=>`url('${url}')`).join(',');actor('hero').append(swatch);
}
const lumiFormRender=renderActors;
renderActors=function(){lumiFormRender();mountLumiIdleStars();if(state.key==='lightning'){warmLumiArt();if(sound)warmLumiSounds(combatHeroForm('lightning'));}};
