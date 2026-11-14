// Action atlases retain their authored poses. Sparse idle sheets use a stable
// ready pose with continuous, foot-anchored breathing instead of hard pose jumps.
const spritePlayback=new WeakMap();
let spriteFrameClock=0;
function spriteDefinition(family,key,action){
  const set=family==='hero'?(ART.heroForms?.[key]?.[combatHeroForm(key)]||ART.heroes[key]):state.boss&&ART.bosses?.[key]?ART.bosses[key]:ART.enemies[key];
  const armored=family!=='hero'&&state.enemyArmor>0;
  // A hit with no hurt sheet: a foe recoils on its attack sheet's last frames; a hero holds its resting pose and the hit's
  // knock-back moves it (owner 08/11: forms 2-3 have no hurt sheet, and their redrawn attacks end in the strike itself).
  const mapped=action==='buff'?(set.buff?'buff':'cast'):action==='victory'?'cast':action==='hurt'?(set.hurt||armored&&set.hurt_armored?'hurt':family==='hero'?'idle':'attack'):action;
  // A boss that grows armour of its own (the fire dragon's lava scales) rests in it while the armour holds.
  if(mapped==='idle'&&armored&&set.armoridle)return {sheet:set.armoridle,action:'armoridle'};
  // Its actions too: each has an armoured drawing (<action>_armored) it fights in while the armour holds.
  if(armored&&set[mapped+'_armored'])return {sheet:set[mapped+'_armored'],action:mapped+'_armored'};
  return {sheet:set[mapped]||set.attack||set.idle,action:set[mapped]?mapped:mapped==='idle'?'idle':'attack'};
}
function spriteMarkup(family,key,action='idle'){
  const {sheet}=spriteDefinition(family,key,action),name=family==='hero'?HEROES[key].name:MONSTERS[key].name;
  // Six-star Noct's scythe catches a travelling glint now and then (CSS, masked to the blade).
  const rig=family==='hero'&&key==='shadow'?'<i class="scythe-glint"></i>':'';
  return `<span class="sprite-body" role="img" aria-label="${name}" data-family="${family}" data-key="${key}" data-action="${action}" data-frame="0" data-loop="true" style="background-image:url('${sheet.src}');background-size:${sheet.cols*100}% ${sheet.rows*100}%;background-position:0% 0%">${rig}</span>`;
}
// Foes at rest now and then play one of their own short actions ("fidgets": an 8-frame sheet that
// starts and ends in the resting pose), then go back to the idle loop. Returns true while one plays.
// A sheet is shown only once its image has been decoded: switching to a sheet still decoding blanks
// the body for a frame or two (a foe vanishing mid-fidget, its shadow left behind).
const spriteDecoded=new Set();
function spriteReady(src){
  if(spriteDecoded.has(src))return true;
  if(spriteDecoded.has('pending:'+src))return false;
  spriteDecoded.add('pending:'+src);
  const img=typeof Image==='function'?new Image():null;if(img)img.src=src;
  // Without a decoder (a headless test page) the sheet counts as ready.
  if(typeof img?.decode!=='function'){spriteDecoded.add(src);return true;}
  img.decode().then(()=>spriteDecoded.add(src),()=>spriteDecoded.add(src));
  return false;
}
function spriteFidget(el,def,playback,now){
  playback.fidgetAt??=now+3000+Math.random()*4000;
  if(!playback.fidget){
    if(now<playback.fidgetAt)return false;
    const sheet=def.fidgets[Math.floor(Math.random()*def.fidgets.length)];
    if(!spriteReady(sheet.src)){playback.fidgetAt=now+400;return false;}
    playback.fidget={sheet,start:now};
  }
  const f=playback.fidget,frame=Math.floor((now-f.start)/(f.sheet.frameDuration||130));
  if(frame>=f.sheet.count){playback.fidget=null;playback.fidgetAt=now+4000+Math.random()*4000;el.dataset.sheet='';return false;}
  if(el.dataset.sheet!=='fidget'){el.style.backgroundImage=`url('${f.sheet.src}')`;el.style.backgroundSize=`${f.sheet.cols*100}% ${f.sheet.rows*100}%`;el.dataset.sheet='fidget';}
  el.style.backgroundPosition=spriteCellPosition(f.sheet,frame);el.style.setProperty('--tween','0');el.dataset.frame=frame;el.dataset.action='idle';
  return true;
}
function spriteCellPosition(sheet,frame){
  const col=frame%sheet.cols,row=Math.floor(frame/sheet.cols);
  return `${sheet.cols===1?0:col/(sheet.cols-1)*100}% ${sheet.rows===1?0:row/(sheet.rows-1)*100}%`;
}
// A big clip-route sheet comes in row bands too (chunkRows rows each, <sheet>.r<k>.webp; assets/heroes/clip_pipeline.py):
// the browser decodes a whole picture before showing any of it, so the game draws the band holding the frame
// (owner 12/11: a 20-megapixel sheet stalled each strike's start by ~180 ms). {src, size, position, band} of a frame.
function spriteSheetCell(sheet,frame){
  const per=sheet.chunkRows;
  if(!per)return {src:sheet.src,size:`${sheet.cols*100}% ${sheet.rows*100}%`,position:spriteCellPosition(sheet,frame),band:''};
  const row=Math.floor(frame/sheet.cols),band=Math.floor(row/per),rows=Math.min(per,sheet.rows-band*per);
  return {src:sheet.bands?.[band]||sheet.src?.replace(/(\.[a-z]+)$/i,`.r${band}$1`),size:`${sheet.cols*100}% ${rows*100}%`,
    position:spriteCellPosition({cols:sheet.cols,rows},frame-band*per*sheet.cols),band:':'+band};
}
// Every picture a sheet is drawn from (its bands, or the sheet itself).
function spriteSheetSources(sheet){
  if(!sheet?.chunkRows)return sheet?.src?[sheet.src]:[];
  return Array.from({length:Math.ceil(sheet.rows/sheet.chunkRows)},(_,k)=>spriteSheetCell(sheet,k*sheet.chunkRows*sheet.cols).src);
}
// Every sheet of a character (actions, fidgets) starts decoding the first time it is drawn, so later
// switches find them ready.
const spriteWarmed=new WeakSet();
function spriteWarm(family,key){
  const set=family==='hero'?(ART.heroForms?.[key]?.[combatHeroForm(key)]||ART.heroes[key]):state.boss&&ART.bosses?.[key]?ART.bosses[key]:ART.enemies[key];
  if(!set||spriteWarmed.has(set))return;spriteWarmed.add(set);
  // Painted (nearly invisibly) in a 2px layer so the browser keeps every sheet of the characters on the
  // stage decoded: a sheet it dropped would blank the character for a frame when switched back to.
  if(typeof document!=='undefined'&&!reduced){
    let keep=document.getElementById('spriteKeep');
    if(!keep){keep=document.createElement('div');keep.id='spriteKeep';keep.setAttribute('aria-hidden','true');keep.style.cssText='position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1;background-size:2px 2px;background-repeat:no-repeat';document.body.append(keep);}
    const srcs=[...Object.values(set).flatMap(s=>[...spriteSheetSources(s),...(s?.fidgets||[]).map(f=>f.src)])].filter(Boolean);
    // One set per side: the hero on the stage and the foe it faces.
    (keep.__sets??={})[family]=srcs;
    keep.style.backgroundImage=[...new Set(Object.values(keep.__sets).flat())].map(s=>`url('${s}')`).join(',');
  }
  for(const sheet of Object.values(set||{})){for(const src of spriteSheetSources(sheet))spriteReady(src);for(const f of sheet?.fidgets||[])spriteReady(f.src);}
}
// Where a sheet is drawn in its actor's cell (fractions of the cell). A sheet drawn smaller than the idle
// (its scale) grows about its feet; a chapter boss's poses stand on the resting pose's feet (build.py
// feetX, footY of each sheet's first frame), so switching to a skill's pose never shifts the body
// sideways or up, and an elite's combat sheets do the same (those carry a peak; common foes never do). Airborne
// loops keep their own framing.
function spriteBox(family,key,sheet,grow=(sheet.scale||1)-1){
  const width=1+grow,foot=sheet.footY||.94,idle=family==='enemy'&&(state.boss||sheet.peak!=null)&&!sheet.airborne&&sheet.feetX!=null?(state.boss?ART.bosses?.[key]:ART.enemies?.[key])?.idle:null;
  // originX: a clip-route sheet drawn with the body off-centre in its padded cell (room ahead for a long thrust).
  if(!idle?.feetX)return {left:-grow*(sheet.originX??.5),top:-grow*foot,width};
  return {left:idle.feetX-sheet.feetX*width,top:(idle.footY||.94)-foot*width,width};
}
// A chapter boss stands near the edge by its resting body (combat-stage.js combatKeepInside); a wider pose
// of its own (fists raised, wings spread, tail coiled out) that would come closer to the edge than its rest
// (COMBAT_BOSS_EDGE; the stage's frame trim hides anything nearer) steps in to that line. Returns that inward
// shift (px) for a sheet drawn in box.
function spriteInset(el,sheet,box){
  const root=el?.closest('.actor');if(!root?.offsetWidth||el.dataset.family!=='enemy'||!(state.boss||sheet.peak!=null)||sheet.airborne||!sheet.span)return 0;
  const W=root.offsetParent?.clientWidth||0,right=root.offsetLeft+(box.left+sheet.span[1]*box.width)*root.offsetWidth;
  return W?Math.max(0,Math.round(right-(W-Math.max(4,W*COMBAT_BOSS_EDGE)))):0;
}
// While another sheet plays, the resting sheet stays painted at its own size, nearly invisible, behind the body
// (owner 14/11: six-star Mika "thu đao về bị khựng"): unpainted for the length of a strike, the browser drops its decoded
// pixels and the way back to rest waited ~130 ms on a 3072 px sheet being decoded again.
function spriteKeepIdle(el,sheet){
  const root=el.closest('.actor');if(!root||reduced)return;
  const idle=spriteDefinition(el.dataset.family,el.dataset.key,'idle').sheet;
  let keep=root.querySelector(':scope > .sprite-keep-idle');
  if(!idle||idle===sheet){if(keep)keep.hidden=true;return;}
  if(!keep){keep=document.createElement('span');keep.className='sprite-keep-idle';keep.setAttribute('aria-hidden','true');el.before(keep);}
  const cell=spriteSheetCell(idle,0),image=`url('${cell.src}')`;if(!cell.src){if(keep)keep.hidden=true;return;}
  if(keep.dataset.src!==cell.src){keep.dataset.src=cell.src;keep.style.backgroundImage=image;keep.style.backgroundSize=cell.size;keep.style.backgroundPosition=cell.position;}
  keep.hidden=false;
}
function spriteApply(el,action,index){
  if(!el)return;
  spriteWarm(el.dataset.family,el.dataset.key);
  const {sheet,action:mapped}=spriteDefinition(el.dataset.family,el.dataset.key,action);
  const frame=Math.max(0,Math.min(sheet.count-1,Number.isFinite(index)?index:0)),col=frame%sheet.cols,row=Math.floor(frame/sheet.cols);
  const previous={image:el.style.backgroundImage,size:el.style.backgroundSize,position:el.style.backgroundPosition,frame:el.dataset.frame,action:el.dataset.action};
  const cell=spriteSheetCell(sheet,frame);
  if(el.dataset.sheet!==mapped+cell.band){el.style.backgroundImage=`url('${cell.src}')`;el.style.backgroundSize=cell.size;el.dataset.sheet=mapped+cell.band;}
  el.style.backgroundPosition=cell.position;
  // Sheets drawn smaller than the idle carry a scale: grow the drawing box about the feet so the
  // character keeps one size across actions (the cell always fills the box).
  let grow=(sheet.scale||1)-1;const foot=sheet.footY||.94;
  // A boss pose reaching higher than the stage allows (a sword or scythe raised overhead, wings spread)
  // is drawn just small enough, about its feet, that its highest point (build.py peak) stays under the
  // boss's HUD; the whole pose keeps one size.
  const root=el.closest('.actor');
  if(root&&el.dataset.family==='enemy'&&sheet.peak!=null&&!sheet.airborne&&root.offsetHeight){
    const H=root.offsetHeight,fit=(root.offsetTop+H*foot-8)/(H*Math.max(.05,foot-sheet.peak));
    if(fit<1+grow)grow=Math.max(fit,(1+grow)*.6)-1;
  }
  const box=spriteBox(el.dataset.family,el.dataset.key,sheet,grow),moved=grow||box.left||box.top;
  for(const [k,v] of Object.entries(moved?{left:box.left*100+'%',top:box.top*100+'%',width:box.width*100+'%',height:box.width*100+'%'}:{left:'',top:'',width:'',height:''}))el.style.setProperty(k,v,moved?'important':'');
  el.dataset.box=box.left+','+box.width;el.dataset.boxTop=String(box.top);
  // The step in (and back out at rest) is a short slide, never a jump.
  const inset=spriteInset(el,sheet,box),was=+(el.dataset.inset||0);
  if(inset!==was){el.dataset.inset=inset;el.style.translate=inset?`${-inset}px 0`:'';if(!reduced&&el.isConnected)el.animate([{translate:`${-was}px 0`},{translate:`${-inset}px 0`}],{duration:220,easing:'ease-out'});}
  if(action!=='idle')el.style.setProperty('--tween','0');
  // The idle's own cross-fade is always drawn at the idle's size (a resized fading pose is an action's).
  else for(const k of ['--tw-l','--tw-t','--tw-w'])el.style.removeProperty(k);
  el.style.setProperty('--tween-img',el.style.backgroundImage);el.style.setProperty('--tween-size',el.style.backgroundSize);el.style.setProperty('--cell-pos',el.style.backgroundPosition);
  spriteKeepIdle(el,sheet);
  // Noct moves like black mist: outside idle, each pose change leaves the previous pose
  // dissolving over the new one instead of snapping (idle has its own continuous cross-fade).
  if(el.dataset.key==='shadow'&&el.closest('.actor')&&!reduced&&previous.image&&(previous.frame!==String(frame)||previous.action!==action)&&action!=='idle'){
    el.style.setProperty('--tween-img',previous.image);el.style.setProperty('--tween-size',previous.size);el.style.setProperty('--tween-pos',previous.position);
    // The fading pose keeps its own size: a sheet drawn in larger cells (a scale) grows its box about
    // the feet, so the previous pose is drawn in a box of its own scale over the new one (Noct form 2;
    // six-star Noct is locked as approved and keeps the box as it was).
    const was=+(el.dataset.scale||1),now=sheet.scale||1,r=was/now,tune=r!==1&&combatHeroForm('shadow')!==3;
    for(const [k,v] of Object.entries({'--tw-l':(1-r)*50+'%','--tw-t':(1-r)*foot*100+'%','--tw-w':r*100+'%'}))tune?el.style.setProperty(k,v):el.style.removeProperty(k);
    el.getAnimations({subtree:true}).filter(a=>a.id==='mist-dissolve').forEach(a=>a.cancel());
    const fade=el.animate([{opacity:.9,filter:'blur(0px)'},{opacity:0,filter:'blur(2.5px)'}],{duration:240,easing:'ease-out',pseudoElement:'::after'});fade.id='mist-dissolve';
  }
  el.dataset.action=action;el.dataset.frame=frame;el.dataset.scale=String(sheet.scale||1);
  updateActorHead(el,action,frame);
  if(el.dataset.family==='hero'&&el.dataset.key==='earth')updateNoriShieldAura(el);
}
// The body's own box on screen, whatever sheet is showing: a sheet drawn in a bigger cell (scale) grows its drawing box
// about the feet, so its rect is bigger and lower-reaching than the body's. Effects measure from this one (owner 13/11:
// Yuki's aegis was placed 35% too big and off her body while her padded skill sheet showed; Nori's shield changed size).
function spriteBaseRect(el){
  const r=el.getBoundingClientRect(),[l,w]=(el.dataset.box||'0,1').split(',').map(Number),t=+(el.dataset.boxTop||0),k=w||1;
  const width=r.width/k,height=r.height/k,left=r.left-l*width,top=r.top-t*height;
  return {left,top,width,height,right:left+width,bottom:top+height,x:left,y:top};
}
// Whether the body has a hurt sheet of its own (plain or armoured) rather than the attack sheet's recoil frames.
function spriteOwnHurt(el){return /^hurt(_armored)?$/.test(spriteDefinition(el.dataset.family,el.dataset.key,'hurt').action);}
function setSpriteAction(side,action,duration=0){
  const root=actor(side),el=root.querySelector('.sprite-body');if(!el)return;
  root.dataset.state=action;
  // A clip-route sheet already playing this action keeps its pose: restarting it would flash frame 0 (the guard)
  // between the staging's pose calls (combat-v3 restarts "attack" before the launch).
  const playing=spritePlayback.get(el);if(playing?.clip&&playing.action===action&&el.dataset.action===action)return;
  const idle=action==='idle';el.dataset.loop=String(idle);
  // Back to rest from the middle of a clip sheet with roles (its last frame is the rest): it plays on to that frame
  // first, a thrust pulled all the way back, never a jump to the resting pose (owner 12/11).
  if(idle&&playing?.clip&&!reduced&&el.dataset.action===playing.action&&!playing.finishing){
    const sheet=spriteDefinition(el.dataset.family,el.dataset.key,playing.action).sheet,from=+el.dataset.frame;
    // (a pose held in its living loop shows a loop frame: it finishes from the pose itself)
    const shown=playing.target!=null&&sheet.holds?.[playing.target]?Math.min(from,playing.target):from;
    if(sheet.roles&&!sheet.clock&&shown<spriteClipEnd(sheet)){spriteClipFinish(el,playing.action,sheet,shown,duration);return;}
  }
  spritePlayback.set(el,{action,start:performance.now(),duration:duration||1200,manual:false});
  spriteApply(el,action,action==='hurt'&&!spriteOwnHurt(el)&&el.dataset.family!=='hero'?4:0);
  // A hurt sheet drawn close to its resting pose (sheet recoil: {deg, ms}) is thrown back about its feet on the hit and
  // eases back upright, so the blow reads at phone size (owner 12/11, six-star Mika's hurt).
  const recoil=action==='hurt'&&!reduced&&spriteDefinition(el.dataset.family,el.dataset.key,action).sheet?.recoil;
  if(recoil&&el.animate){el.style.transformOrigin=`50% ${(((s=>s.feetY||s.footY||.94)(spriteDefinition(el.dataset.family,el.dataset.key,action).sheet))*100).toFixed(1)}%`;
    el.animate([{rotate:'0deg',translate:'0 0'},{rotate:`${recoil.deg}deg`,translate:`${recoil.deg*.6}% 0`,offset:.16},{rotate:`${recoil.deg*.35}deg`,translate:`${recoil.deg*.2}% 0`,offset:.5},{rotate:'0deg',translate:'0 0'}],{duration:recoil.ms||340,easing:'cubic-bezier(.2,.7,.3,1)',composite:'add'});}
}
function setSpriteFrame(side,action,index){
  const el=actor(side).querySelector('.sprite-body');if(!el)return;
  const sheet=spriteDefinition(el.dataset.family,el.dataset.key,action).sheet;
  if(sheet.baked)return;   // a baked rig one-shot plays on setSpriteAction's clock
  el.dataset.loop='false';
  // Clip-route sheets (assets/heroes/clip_pipeline.py, owner 12/11): many frames drawn from one video clip.
  if(sheet.clock&&!reduced){if(index===0||spritePlayback.get(el)?.action!==action)spriteClipClock(el,action,sheet);return;}
  if(sheet.roles){spriteClipStep(el,action,sheet,Math.max(0,Math.min(sheet.roles.length-1,index|0)));return;}
  spritePlayback.set(el,{action,manual:true});spriteApply(el,action,index);
}
// A clip sheet with a clock plays on the action's own clock from its frame 0: segments {t:[from,to] ms, f:[first,last]}
// run through their frames (a slow one never skips a pose; a fast one, a strike, may drop a frame on a busy device),
// {t, loop:[first,last], step, endOnFirst} repeats a held pose's living loop (hair and cloth keep moving) and lands on its
// first frame as the next segment begins. The staging's later pose calls are ignored while it plays.
function spriteClockFrame(clock,t,last){
  for(const s of clock){
    const [t0,t1]=s.t;if(t>t1&&s!==clock[clock.length-1])continue;const u=Math.max(0,Math.min(t,t1)-t0),span=Math.max(1,t1-t0);
    if(s.loop){const [a,b]=s.loop,n=b-a+1,want=s.step||70,k=s.endOnFirst?Math.max(n,n*Math.round(span/(n*want)))+1:Math.round(span/want),step=span/k;
      return a+Math.floor(u/step)%n;}
    // {t, seq:[frames in play order]}: in-betweens added to a sheet after its numbering was fixed (appended cells).
    if(s.seq)return s.seq[Math.min(s.seq.length-1,Math.floor(s.seq.length*u/span))];
    const [f0,f1]=s.f,f=Math.round(f0+(f1-f0)*u/span);
    return span/Math.max(1,Math.abs(f1-f0))>=30&&last>=f0&&f>last+1?last+1:f;
  }
  return 0;
}
function spriteClipClock(el,action,sheet){
  const playback={action,manual:true,clip:true},start=performance.now();spritePlayback.set(el,playback);
  const end=sheet.clock[sheet.clock.length-1].t[1];let last=-1;
  const tick=now=>{
    if(spritePlayback.get(el)!==playback||!el.isConnected)return;
    const f=spriteClockFrame(sheet.clock,now-start,last);if(f!==last){last=f;spriteApply(el,action,f);}
    if(now-start<end)requestAnimationFrame(tick);
  };tick(start);
}
// A clip sheet with roles: the staging asks for its usual six poses (0..5); each maps to a clip frame, reached through
// every frame between (forward, sheet.stepMs apart); a pose behind the current one is shown at once.
function spriteClipStep(el,action,sheet,role){
  // From the pose on screen (a setSpriteAction between two pose calls restarts the playback but leaves the frame shown).
  const old=spritePlayback.get(el);let from=old?.clip&&old.action===action?old.shown:el.dataset.sheet?.split(':')[0]===spriteDefinition(el.dataset.family,el.dataset.key,action).action?+el.dataset.frame:-1;
  let target=sheet.roles[role];
  // A pose behind the current one: a sheet with rolesBack goes on forward to its drawn way back (a thrust pulled back
  // to guard, then to rest); from the sheet's last frame (back at rest) a new strike starts over from frame 0.
  let viaBack=false;
  if(from>=0&&target<from){const back=sheet.rolesBack?.[role];
    // Already on that pose's way-back frame (back on guard after the thrust): stay; going "back" to the first guard would
    // play the whole thrust again on the way to rest (owner 12/11: six-star Mika thrust twice).
    if(back===from)return;
    if(back!=null&&back>from){target=back;viaBack=true;}else if(from===spriteClipEnd(sheet))from=0;}
  // Asked again for the pose it is already stepping to (a swing that names its pose every animation frame): carry on.
  if(old?.clip&&old.action===action&&old.target===target)return;
  const playback={action,manual:true,clip:true,shown:from,target};
  spritePlayback.set(el,playback);
  // Coming from another sheet (the idle) to a first pose that is not the sheet's frame 0 (Hiro's skill opens on a raised
  // sword): the clip's lead-in from the resting frame plays, not a jump (owner 12/11 review, Hiro).
  if(!reduced&&from<0&&target>0&&target<=spriteClipEnd(sheet)/2){from=0;playback.shown=0;spriteApply(el,action,0);}
  if(reduced||from<0||target<=from||(!viaBack&&target-from>spriteClipEnd(sheet)/2)){playback.shown=target;spriteApply(el,action,target);spriteClipHold(el,action,sheet,playback);return;}
  let at=performance.now();const step=sheet.stepMs||17;
  const tick=now=>{
    if(spritePlayback.get(el)!==playback||!el.isConnected)return;
    if(now-at>=step){at=now;playback.shown++;spriteApply(el,action,playback.shown);}
    if(playback.shown<target)requestAnimationFrame(tick);else spriteClipHold(el,action,sheet,playback);
  };requestAnimationFrame(tick);
}
// Resolves once the side's clip sheet has stepped through to the pose last asked for (at most `limit` ms): staging that
// fires a projectile on a pose waits for the drawn swing to reach it (owner 13/11: Lumi's bolt flew before her staff).
function spriteArrival(side,limit=420){
  const el=actor(side)?.querySelector('.sprite-body');if(!el||reduced)return Promise.resolve();
  const t0=performance.now();
  return new Promise(resolve=>{const tick=now=>{const p=spritePlayback.get(el);
    if(!p?.clip||p.finishing||p.shown==null||p.shown>=p.target||now-t0>=limit)return resolve();requestAnimationFrame(tick);};requestAnimationFrame(tick);});
}
// The sheet's last frame of its own sequence (the resting frame): a sheet with living holds keeps their loop frames after it.
function spriteClipEnd(sheet){return sheet.end??sheet.count-1;}
// A pose the staging holds until its next call (owner 12/11: a held pose is a living loop, never a frozen frame): a sheet
// with holds {pose frame: [first, last]} cycles the pose and its drawn loop (hair, cloth moving, the body still) every
// ~70 ms until the next call; the pose stays the frame the next step starts from.
function spriteClipHold(el,action,sheet,playback){
  const loop=sheet.holds?.[playback.target];if(!loop||reduced)return;
  const frames=[playback.target];for(let f=loop[0];f<=loop[1];f++)frames.push(f);
  let at=performance.now(),i=0;
  const tick=now=>{
    if(spritePlayback.get(el)!==playback||!el.isConnected)return;
    if(now-at>=(sheet.holdMs||70)){at=now;i=(i+1)%frames.length;spriteApply(el,action,frames[i]);}
    requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
}
function spriteClipFinish(el,action,sheet,from,duration){
  const playback={action,manual:true,clip:true,finishing:true,shown:Math.min(from,spriteClipEnd(sheet)),target:spriteClipEnd(sheet)};spritePlayback.set(el,playback);
  let at=performance.now();const step=sheet.stepMs||17;
  const tick=now=>{
    if(spritePlayback.get(el)!==playback||!el.isConnected)return;
    if(now-at>=step){at=now;playback.shown++;spriteApply(el,action,playback.shown);}
    if(playback.shown<playback.target){requestAnimationFrame(tick);return;}
    spritePlayback.set(el,{action:'idle',start:performance.now(),duration:duration||1200,manual:false});el.dataset.loop='true';spriteApply(el,'idle',0);
  };requestAnimationFrame(tick);
}
function spriteTick(now){
  requestAnimationFrame(spriteTick);
  if(now-spriteFrameClock<30||document.hidden)return;
  spriteFrameClock=now;
  const modalOpen=$('selectDialog').open||$('resultDialog').open;
  document.querySelectorAll('.sprite-body').forEach(el=>{
    const inScene=el.closest('.actor');if(inScene&&modalOpen)return;
    if(inScene&&el.dataset.family==='hero'&&el.dataset.key==='earth')updateNoriShieldAura(el);
    if(!inScene&&!el.closest('dialog[open]'))return;
    let playback=spritePlayback.get(el);
    if(!playback){playback={action:'idle',start:now,manual:false};spritePlayback.set(el,playback);}
    if(playback.manual)return;
    if(reduced){if(el.dataset.frame!=='0')spriteApply(el,playback.action,0);return;}
    const def=spriteDefinition(el.dataset.family,el.dataset.key,playback.action).sheet;
    if(el.dataset.loop==='true'&&def.fidgets?.length&&!reduced&&spriteFidget(el,def,playback,now))return;
    if(el.dataset.loop==='true'){
      // Only dense, authored loops advance at rest. One/two/four-pose atlases
      // otherwise pop at shoulders, eyes and weapons; CSS supplies a smooth breath.
      const progress=def.count>=8?Math.max(0,now-playback.start)/(def.frameDuration||90):0,frame=Math.floor(progress)%def.count;
      if(+el.dataset.frame!==frame||el.dataset.action!=='idle')spriteApply(el,'idle',frame);
      // Idle breathes continuously: the next pose fades in over the current one (::after layer).
      if(def.count>=8){const t=progress%1;el.style.setProperty('--tween-pos',spriteCellPosition(def,(frame+1)%def.count));el.style.setProperty('--tween',(t*t*(3-2*t)).toFixed(3));}
    }else{
      const elapsed=Math.max(0,now-playback.start);
      const fallbackHurt=playback.action==='hurt'&&!spriteOwnHurt(el);if(fallbackHurt&&el.dataset.family==='hero'){if(el.dataset.frame!=='0')spriteApply(el,'hurt',0);return;}
      const frame=fallbackHurt?Math.min(def.count-1,4+Math.floor(elapsed/Math.max(1,playback.duration)*2)):Math.min(spriteClipEnd(def),Math.floor(elapsed/(playback.duration||1000)*(spriteClipEnd(def)+1)));
      if(+el.dataset.frame!==frame)spriteApply(el,playback.action,frame);
    }
  });
}
heroArt=key=>spriteMarkup('hero',key);
monsterArt=(key,boss=false)=>(boss?'<span class="boss-sigil" aria-hidden="true">'+icon('crown')+'</span>':'')+spriteMarkup('enemy',key);
landscapeArt=()=>`<img src="${ART.landscape}" alt="" draggable="false">`;
renderActors=function(){
  for(const side of ['hero','enemy'])$(side+'HeadHud').style.visibility='hidden';
  $('heroActor').innerHTML=heroArt(state.key);$('enemyActor').innerHTML=monsterArt(state.enemyKey,state.boss);
  $('enemyActor').classList.toggle('boss',state.boss);$('enemyActor').style.setProperty('--element',ELEMENTS[state.enemyKey].color);
  $('heroActor').style.setProperty('--element',ELEMENTS[state.key].color);
  $('heroActor').dataset.hero=state.key;
  $('enemyActor').dataset.element=state.enemyKey;
  const enemy=$('enemyActor'),tier=state.boss?'boss':progressionBattle?.tier==='elite'||state.qaElite?'elite':'normal';// qaElite: test builds (Noct Studio)
  enemy.dataset.tier=progressionIsDuel()?'duel':tier;
  // Which boss sheet is shown: a world boss id, or "base" for the element's own boss (fire = the dragon king).
  enemy.dataset.bossArt=!state.boss?'':state.qaBossArt||(progressionBattle?.bossId&&ART.worldBosses?.[progressionBattle.bossId]?progressionBattle.bossId:'base');
  enemy.dataset.idleMotion=/bat|roc|wing|wisp|moth/.test(progressionBattle?.creature||progressionBattle?.bossId||'')?'hover':'breathe';
  mountElementalBossAura(enemy);
  if(state.key==='shadow')mountShadowVeil();
  renderEncounterScene();
  mountActorHead('hero');mountActorHead('enemy');
  setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
};
function mountElementalBossAura(root){
  if(!state.boss||progressionIsDuel())return;
  const aura=document.createElement('span');aura.className='boss-element-aura';aura.setAttribute('aria-hidden','true');
  aura.style.setProperty('--element',({fire:'#ffad55',earth:'#b4de78',ice:'#9deaff',lightning:'#d7b3ff',shadow:'#bc9aef'})[state.enemyKey]||ELEMENTS[state.enemyKey].color);
  aura.innerHTML='<i class="boss-aura-halo"></i><i class="boss-aura-ground"></i><i class="boss-aura-arc"></i><i class="boss-aura-arc second"></i>'+
    Array.from({length:9},(_,i)=>`<b style="--delay:${-i*.47}s;--x:${i%2?96-i:4+i}%"></b>`).join('');
  root.append(aura);
}
const itemNames=['sword','heart','crystal','snow','shield'];
function itemImage(type,special=null){const name=special==='core'?'core':itemNames[type]+(special?'-'+special:'');return ART.items[name];}
paintTile=function(t){
  const p=TYPES[Math.max(0,t.type)],e=t.el;e.className='tile'+(t.special?' special '+t.special:'');
  e.setAttribute('aria-label',tileLabel(t));e.setAttribute('aria-rowindex',t.r+1);e.setAttribute('aria-colindex',t.c+1);e.setAttribute('aria-selected','false');
  e.dataset.type=itemNames[Math.max(0,t.type)];e.dataset.tier=t.special||'normal';
  e.style.setProperty('--tile-light',p.light);e.style.setProperty('--tile-bg',p.bg);e.style.setProperty('--tile-edge',p.edge);e.style.setProperty('--item-glow',p.color);
  e.innerHTML=`<span class="gem"><img class="item-art" src="${itemImage(t.type,t.special)}" alt="" draggable="false">${t.special&&t.special!=='core'?`<span class="special-tier" aria-hidden="true">${t.special==='bolt'?'IV':'V'}</span>`:''}${t.special==='bolt'&&ART.specialFx?.arrows?`<img class="special-dir" src="${ART.specialFx.arrows}" alt="" aria-hidden="true" draggable="false">`:''}</span>`;e.dataset.dir=t.special==='bolt'?t.dir||'row':'';
};
function finishArtSetup(){
  $('tileLegend').innerHTML=TYPES.map((t,i)=>`<div class="legend-item"><span class="legend-icon"><img src="${itemImage(i)}" alt=""></span><span>${t.name}</span><small>${t.effect}</small></div>`).join('');
  $('helpLegend').innerHTML=TYPES.map((t,i)=>`<div><img class="help-item-art" src="${itemImage(i)}" alt=""><span><b>${t.name}</b> · ${['8 sát thương và 3 nộ mỗi ngọc, trước hệ số nhân vật và nguyên tố','Hồi 1,2% HP tối đa mỗi ngọc (ít nhất 6 HP), 2 nộ','Ngọc nộ chính: 7 nộ mỗi ngọc để dùng tuyệt kỹ','Gom 3 Băng trong lượt để đóng băng quái 1 lượt; trùm có thanh 6 Băng','Giáp bằng 1,5% HP tối đa mỗi ngọc (ít nhất 4); Yuki nhận gấp đôi'][i]}</span></div>`).join('');
  const gallery=document.createElement('div');gallery.className='special-gallery';gallery.innerHTML='<div class="special-gallery-head"><span>Item</span><span>Ghép 4 thẳng · Sao băng (dải 3 hàng/cột)</span><span>Ghép chữ L/T · Bom 5×5</span></div>'+'<p class="special-gallery-note">Ghép 5 thẳng hoặc cụm từ 6 ngọc tạo Lõi: đổi với một ngọc để xóa cả màu đó. Đổi hai ngọc đặc biệt cho nhau: Sao+Sao 3 hàng và 3 cột, Sao+Bom 5 hàng và 5 cột, Bom+Bom 7×7, Lõi+Sao/Bom biến cả màu thành Sao/Bom, Lõi+Lõi xóa cả bàn.</p>'+TYPES.map((t,i)=>`<div class="special-gallery-row"><span><img src="${itemImage(i)}" alt="${t.name}"></span><span><img src="${itemImage(i,'bolt')}" alt="${t.name} Sao băng"></span><span><img src="${itemImage(i,'bomb')}" alt="${t.name} Bùng nổ"></span></div>`).join('');
  $('helpLegend').after(gallery);
  $('helpTitle').textContent='Kết nối. Tích lực. Bùng nổ.';
  requestAnimationFrame(spriteTick);
}
