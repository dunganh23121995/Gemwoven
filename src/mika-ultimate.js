// Authored guard sockets in the shared 256px body atlas. Angle is from vertical.
const MIKA_SWORD_SOCKETS=[[117,113,-40],[120,113,-40],[121,112,-40],[167,112,-66],[190,199,115],[176,197,117]];
function mikaFlameSword(root,start){
  if(reduced)return {stop(){}};
  const pivot=document.createElement('span'),blade=document.createElement('span');
  pivot.className='mika-blade-pivot';blade.className='mika-flame-blade';
  pivot.setAttribute('aria-hidden','true');blade.style.backgroundImage=`url('${ART.skillFx.mikaBlade}')`;
  pivot.append(blade);root.append(pivot);let frameId;
  const tick=now=>{
    if(!pivot.isConnected)return;
    const elapsed=now-start,frame=Number(root.querySelector('.sprite-body')?.dataset.frame)||0;
    let [x,y,angle]=MIKA_SWORD_SOCKETS[Math.min(frame,5)];
    // A continuous forward sweep connects the three separately drawn chop poses.
    if(elapsed>=1700&&elapsed<1920){
      const p=(elapsed-1700)/220,from=MIKA_SWORD_SOCKETS[p<.5?2:3],to=MIKA_SWORD_SOCKETS[p<.5?3:4],t=p<.5?p*2:(p-.5)*2;
      [x,y,angle]=from.map((v,i)=>v+(to[i]-v)*t);
    }
    const charge=Math.max(0,Math.min(1,(elapsed-300)/1250)),fade=elapsed>1920?Math.max(0,1-(elapsed-1920)/260):1;
    pivot.style.left=x/256*100+'%';pivot.style.top=y/256*100+'%';pivot.style.transform=`rotate(${angle}deg)`;
    const size=root.clientWidth*.34;
    blade.style.width=size+'px';blade.style.height=size+'px';
    blade.style.transform=`translate(-50%,-95.3125%) scale(${1+charge*1.2},${.9+charge*1.05})`;
    blade.style.opacity=String(Math.min(1,Math.max(0,(elapsed-180)/400))*fade);
    const flicker=Math.floor(elapsed/80)%4;blade.style.backgroundPosition=`${flicker%2*100}% ${Math.floor(flicker/2)*100}%`;
    pivot.dataset.length=(.9+charge*1.05).toFixed(2);
    frameId=requestAnimationFrame(tick);
  };frameId=requestAnimationFrame(tick);
  return {stop(){cancelAnimationFrame(frameId);pivot.remove();}};
}
async function mikaSwordWave(){
  if(reduced)return;
  const from=combatV3Point('hero'),to=combatV3Point('enemy');
  const launch={x:from.x+from.width*.26,y:from.foot-from.height*.25};
  const size=Math.min(145,$('scene').clientWidth*.38),dx=to.x-size*.18-launch.x,dy=to.y-launch.y;
  const wave=combatV3Element('mika-sword-wave',launch,size,'',combatV3Palette.fire);
  wave.style.backgroundImage=`url('${ART.skillFx.mikaWave}')`;wave.dataset.phase='flying';
  const start=performance.now();let frameId;
  const flicker=now=>{if(!wave.isConnected)return;const frame=Math.floor((now-start)/65)%4;wave.style.backgroundPosition=`${frame%2*100}% ${Math.floor(frame/2)*100}%`;frameId=requestAnimationFrame(flicker);};
  frameId=requestAnimationFrame(flicker);
  try{
    await castTimelineAnimate(wave,[
      {opacity:0,transform:'translate(-50%,-50%) scale(.4,.7)'},
      {opacity:1,transform:`translate(calc(-50% + ${dx*.12}px),calc(-50% + ${dy*.12}px)) scale(.8,1)`,offset:.12},
      {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1,1.12)`}
    ],{duration:400,easing:'linear'});
  }finally{cancelAnimationFrame(frameId);wave.remove();}
}
// A single contact bloom: ignition -> fire crown -> broken ring -> embers.
function mikaHeavyImpact(pending){
  if(reduced)return;
  const p=combatV3Point('enemy'),scene=$('scene'),ground={x:p.x,y:p.foot-5};
  const contact={x:p.x-10,y:p.y-4},size=Math.min(280,scene.clientWidth*.76);
  const blast=combatV3Element('mika-impact mika-impact-explosion',contact,size,'',combatV3Palette.fire);
  blast.style.backgroundImage=`url('${ART.skillFx.mikaExplosion}')`;
  const start=performance.now();let frameId;
  const tick=now=>{
    if(!blast.isConnected)return;
    const elapsed=now-start,frame=elapsed<65?0:elapsed<140?1:elapsed<300?2:elapsed<410?3:elapsed<515?4:5;
    blast.dataset.frame=String(frame);blast.style.backgroundPosition=`${frame%3*50}% ${Math.floor(frame/3)*100}%`;
    frameId=requestAnimationFrame(tick);
  };tick(start);
  pending.push(castTimelineAnimate(blast,[{opacity:1},{opacity:1,offset:.68},{opacity:.65,offset:.88},{opacity:0}],{duration:630,easing:'linear'}).finally(()=>{cancelAnimationFrame(frameId);blast.remove();}));
  const core=combatV3Element('mika-impact mika-impact-burst',contact,size*.75,'',combatV3Palette.fire);
  pending.push(castTimelineAnimate(core,[{opacity:0,transform:'translate(-50%,-50%) scale(.12)'},{opacity:.95,transform:'translate(-50%,-50%) scale(.65)',offset:.15},{opacity:.6,offset:.35},{opacity:0,transform:'translate(-50%,-50%) scale(1.1)'}],{duration:280,easing:'ease-out'}).finally(()=>core.remove()));
  const flare=combatV3Element('mika-impact mika-impact-flare',ground,size*1.2,'',combatV3Palette.fire);
  pending.push(castTimelineAnimate(flare,[{opacity:0,transform:'translate(-50%,-50%) scale(.15,.1)'},{opacity:.95,transform:'translate(-50%,-50%) scale(.75,.24)',offset:.18},{opacity:.5,offset:.48},{opacity:0,transform:'translate(-50%,-50%) scale(1.35,.3)'}],{duration:610,easing:'ease-out'}).finally(()=>flare.remove()));
  for(let i=0;i<2;i++){
    const ring=combatV3Element('mika-impact mika-impact-shockwave',ground,size*1.15,'',combatV3Palette.fire);
    pending.push(castTimelineAnimate(ring,[{opacity:0,transform:'translate(-50%,-50%) scale(.08,.035)'},{opacity:i?.6:.9,offset:.14},{opacity:.5,offset:.4},{opacity:0,transform:`translate(-50%,-50%) scale(${1.25+i*.2},${.3+i*.08})`}],{duration:540,delay:i*65,easing:'cubic-bezier(.15,.65,.25,1)'}).finally(()=>ring.remove()));
  }
  // Cosmetic deterministic trajectories leave board randomness untouched.
  for(let i=0;i<26;i++){
    const angle=i*2.399963,reach=55+i%6*16,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach*.7-20;
    const ember=combatV3Element('mika-impact mika-impact-ember',contact,3+i%4*1.5,'',combatV3Palette.fire);
    const pose=(x,y,scale,rotation)=>`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) rotate(${rotation}deg) scale(${scale})`;
    pending.push(castTimelineAnimate(ember,[{opacity:0,transform:pose(0,0,.4,i*37)},{opacity:1,transform:pose(dx*.35,dy*.5,1.25,i*37+25),offset:.18},{opacity:.85,transform:pose(dx*.8,dy,.85,i*37+70),offset:.5},{opacity:0,transform:pose(dx,dy+40,.15,i*37+140)}],{duration:510+i%4*25,delay:i%3*12,easing:'ease-out'}).finally(()=>ember.remove()));
  }
  pending.push(castTimelineAnimate(scene,[{translate:'0px 0px'},{translate:'-7px 11px',offset:.07},{translate:'7px -6px',offset:.18},{translate:'-5px 4px',offset:.32},{translate:'3px -2px',offset:.5},{translate:'-1px 1px',offset:.7},{translate:'0px 0px'}],{duration:520,easing:'ease-out'}));
}
async function mikaFlameRage(raw,onRelease=()=>{}){
  const audio=combatV3AudioContext();if(audio)for(const kind of ['charge','whoosh'])decodeCastSound(audio,'fire-flame-'+kind).catch(()=>{});
  const root=actor('hero'),target=actor('enemy'),oldZ=root.style.zIndex,oldTarget=target.style.transform,pending=[];
  const start=performance.now(),at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  const sword=mikaFlameSword(root,start);let result={amount:0,blocked:0};
  root.classList.add('combat-v3-acting');root.style.zIndex='4';root.dataset.ragePhase='raise-sword';
  try{
    combatVoice('hero','cast');if(!reduced)playCastSound('fire','flame-charge',{volume:.38,pan:-.2});popActorSkill('hero',HEROES.fire.skill,true,pending);
    setSpriteFrame('hero','smash',0);
    await at(300);setSpriteFrame('hero','smash',1);
    await at(700);setSpriteFrame('hero','smash',2);root.dataset.ragePhase='flame-charge';
    await at(1700);root.dataset.ragePhase='heavy-cleave';combatVoice('hero','release');playCastSound('fire','flame-whoosh',{volume:.48,pan:.12});
    await at(1810);setSpriteFrame('hero','smash',3);
    await at(1920);setSpriteFrame('hero','smash',4);root.dataset.ragePhase='sword-wave';
    await mikaSwordWave();root.dataset.ragePhase='impact';root.dataset.rageHit='1';
    result=damage('hero',raw);onRelease(pending);update();
    combatVoice('enemy','hurt');combatV3HitSound('fire',true);mikaHeavyImpact(pending);
    combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',0,pending);
    hitAccents('hero',result,false,pending);setSpriteAction('enemy','hurt',330);
    pending.push(castTimelineAnimate(target,[{transform:oldTarget||'none'},{transform:'translate(10px,5px) rotate(5deg)',offset:.2},{transform:oldTarget||'none'}],{duration:330,easing:'ease-out'}));
    await at(2550);root.dataset.ragePhase='recover';setSpriteFrame('hero','smash',5);
    await at(3000);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);sword.stop();root.style.zIndex=oldZ;target.style.transform=oldTarget;
    delete root.dataset.ragePhase;delete root.dataset.rageHit;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
