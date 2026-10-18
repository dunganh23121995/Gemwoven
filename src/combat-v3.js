// Combat direction: preparation -> contact -> hit stop -> recoil -> recovery.
// Included inside the game closure; all combat mutations still use damage().
const COMBAT_V3_PACING=Object.freeze({scale:.45,anticipationHold:150,recoveryHold:90});
const COMBAT_V3_STRIKES=Object.freeze({
  fire:{duration:470,ultimateDuration:530,contact:115},
  earth:{duration:470,contact:160},
  ice:{duration:460,contact:320},
  lightning:{duration:410,contact:115},
  novice:{duration:470,contact:115},
  breath:{duration:560,contact:180}
});
// These wrappers are deliberately combat-local. Board and turn timing have
// their own pacing, while reduced-motion continues using the fast primitives.
function combatV3Duration(milliseconds){return reduced?milliseconds:Math.round(milliseconds*COMBAT_V3_PACING.scale);}
function combatV3Wait(milliseconds){return wait(combatV3Duration(milliseconds));}
function combatV3Animate(node,frames,options={}){
  return animate(node,frames,{...options,duration:combatV3Duration(options.duration??300),delay:combatV3Duration(options.delay??0)});
}
const combatV3Palette={
  fire:{main:'#ff8b38',light:'#fff0a7',deep:'#e14532'},
  earth:{main:'#c6e768',light:'#f8ffd1',deep:'#5aa16d'},
  ice:{main:'#67ddff',light:'#e5ffff',deep:'#448ed9'},
  lightning:{main:'#c19aff',light:'#fff4ac',deep:'#8254ec'},
  shadow:{main:'#81b8cf',light:'#dcffff',deep:'#171126'},
  novice:{main:'#c4a376',light:'#f6e6c6',deep:'#745d43'}
};
function combatV3Action(side,action,duration=0){
  actor(side).dataset.state=action;
  if(typeof setSpriteAction==='function')setSpriteAction(side,action,combatV3Duration(duration));
}
function combatV3Frame(side,action,index){
  if(typeof setSpriteFrame==='function')setSpriteFrame(side,action,index);
}
function combatV3Point(side){
  const scene=$('scene').getBoundingClientRect(),r=actor(side).getBoundingClientRect();
  return {x:r.left-scene.left+r.width*.5,y:r.top-scene.top+r.height*.62,foot:r.bottom-scene.top-r.height*.06,width:r.width,height:r.height};
}
function combatV3Element(className,point,size,html='',palette=combatV3Palette.fire){
  const node=document.createElement('span');
  node.className='combat-v3-effect '+className;
  node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size}px;height:${size}px;--combat-main:${palette.main};--combat-light:${palette.light};--combat-deep:${palette.deep};`;
  node.innerHTML=html;$('combatEffects').append(node);return node;
}
function combatV3Svg(content,view='0 0 220 220'){
  return `<svg viewBox="${view}" fill="none" aria-hidden="true">${content}</svg>`;
}
function combatV3Fx(node,frames,options,pending){
  const job=combatV3Animate(node,frames,options).finally(()=>node.remove());
  if(pending)pending.push(job);return job;
}
// Actor movement stays rigid: drawn poses carry the motion, never an extra zoom.
async function combatV3Pose(node,transform,duration,easing='cubic-bezier(.22,.7,.3,1)'){
  const previous=node.style.transform||'translate(0px,0px) rotate(0deg) scale(1)';
  await combatV3Animate(node,[{transform:previous},{transform}],{duration,easing});
  node.style.transform=transform;
}
function combatV3Cue(side,key,ultimate,hits,pending){
  const title=side==='hero'?(ultimate?HEROES[key].skill:({fire:'Liệt diễm trảm',earth:'Trọng chùy',ice:'Băng thương',lightning:'Lôi kích',novice:'Kiếm gỗ'})[key]):(ultimate?MONSTERS[key].skill:MONSTERS[key].attack);
  return popActorSkill(side,title,ultimate,pending);
}
function combatV3Charge(side,key,ultimate,pending){
  const p=combatV3Point(side),color=combatV3Palette[key],size=Math.min(p.width*.85,170);
  combatV3ChargeSound(key,ultimate);
  const seal=combatV3Element('combat-v3-seal',{x:p.x,y:p.foot-9},size,combatV3Svg('<ellipse cx="110" cy="110" rx="94" ry="94" stroke="currentColor" stroke-width="3"/><ellipse cx="110" cy="110" rx="77" ry="77" stroke="currentColor" stroke-width="1" stroke-dasharray="5 9"/><path d="m110 22 76 132H34Zm0 176L34 66h152Z" stroke="currentColor" stroke-width="1.5" opacity=".8"/>'),color);
  combatV3Fx(seal,[{opacity:0,transform:'translate(-50%,-50%) scale(.55) rotateX(64deg) rotate(-16deg)'},{opacity:.85,transform:'translate(-50%,-50%) scale(1) rotateX(64deg) rotate(12deg)',offset:.45},{opacity:0,transform:'translate(-50%,-50%) scale(1.2) rotateX(64deg) rotate(32deg)'}],{duration:ultimate?1150:690},pending);
  if(!ultimate)return;
  const glow=combatV3Element('combat-v3-charge',p,size*.9,'',color);
  combatV3Fx(glow,[{opacity:0,transform:'translate(-50%,-50%) scale(.35)'},{opacity:.7,transform:'translate(-50%,-50%) scale(1)',offset:.7},{opacity:0,transform:'translate(-50%,-50%) scale(.5)'}],{duration:780},pending);
  if(reduced)return;
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4,spark=combatV3Element('combat-v3-mote',{x:p.x+Math.cos(angle)*size*.5,y:p.y+Math.sin(angle)*size*.45},i%2?5:8,'',color);
    combatV3Fx(spark,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:1,offset:.25},{opacity:0,transform:`translate(calc(-50% + ${-Math.cos(angle)*size*.5}px),calc(-50% + ${-Math.sin(angle)*size*.45}px)) scale(.3)`}],{duration:620,delay:i*35},pending);
  }
}
function combatV3Slash(point,key,index,ultimate,direction,pending){
  const color=combatV3Palette[key],size=Math.min(point.width*(ultimate?1.05:.9),210),rotation=[38,-70,100][index%3]*direction;
  const timing=COMBAT_V3_STRIKES[key],duration=ultimate&&timing.ultimateDuration?timing.ultimateDuration:timing.duration;
  const svg=combatV3Svg('<path d="M10 180C-5 71 105-7 217 27C116 13 43 92 10 180Z" fill="var(--combat-deep)" opacity=".4"/><path d="M20 183C10 82 114 9 211 32C119 29 54 91 20 183Z" fill="var(--combat-main)"/><path d="M28 171C36 83 120 28 205 34C124 44 68 91 28 171Z" fill="var(--combat-light)"/><path d="M39 148C66 88 134 46 194 40" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 145C25 76 73 27 145 17" stroke="var(--combat-main)" stroke-width="3" opacity=".5"/>');
  const arc=combatV3Element('combat-v3-slash',point,size,svg,color);
  combatV3Fx(arc,[{opacity:0,transform:`translate(-50%,-50%) rotate(${rotation-45*direction}deg) scale(.58) scaleX(${direction})`,easing:'cubic-bezier(.12,.75,.25,1)'},{opacity:1,transform:`translate(-50%,-50%) rotate(${rotation}deg) scale(1) scaleX(${direction})`,offset:timing.contact/duration},{opacity:.95,transform:`translate(-50%,-50%) rotate(${rotation+15*direction}deg) scale(1.08) scaleX(${direction})`,offset:.6},{opacity:0,transform:`translate(-50%,-50%) rotate(${rotation+29*direction}deg) scale(1.17) scaleX(${direction})`}],{duration,easing:'linear'},pending);
  if(ultimate&&index===2){
    const cross=combatV3Element('combat-v3-finisher',point,size*1.02,combatV3Svg('<path d="m35 35 150 150M185 35 35 185" stroke="var(--combat-main)" stroke-width="17"/><path d="m35 35 150 150M185 35 35 185" stroke="var(--combat-light)" stroke-width="5"/>'),color);
    combatV3Fx(cross,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}],{duration:560,delay:90},pending);
  }
}
function combatV3Bolt(point,key,index,ultimate,pending){
  const color=combatV3Palette[key],x=point.x+(index%2?-10:10),height=Math.max(90,point.y+10),width=ultimate?110:78;
  const timing=COMBAT_V3_STRIKES.lightning;
  const paths=[`M50 0 36 24 58 28 31 54 54 53 44 78 55 100`,`M58 0 39 20 55 33 27 48 47 56 32 80 55 100`,`M39 0 59 18 35 31 57 46 30 65 57 76 55 100`];
  const d=paths[index%3];
  const beam=combatV3Element('combat-v3-lightning',{x,y:height*.5},width,combatV3Svg(`<path d="${d}" stroke="var(--combat-deep)" stroke-width="15" opacity=".45"/><path d="${d}" stroke="var(--combat-main)" stroke-width="8"/><path d="${d}" stroke="var(--combat-light)" stroke-width="3"/><path d="M40 28 19 39 28 54M45 62 76 54 71 76" stroke="var(--combat-main)" stroke-width="2"/>`,'0 0 100 100'),color);
  beam.style.height=height+'px';
  beam.firstElementChild.setAttribute('preserveAspectRatio','none');
  combatV3Fx(beam,[{opacity:0,transform:'translate(-50%,-50%) scaleY(.05)',easing:'cubic-bezier(.16,.75,.25,1)'},{opacity:1,transform:'translate(-50%,-50%) scaleY(1)',offset:timing.contact/timing.duration},{opacity:.9,offset:.65},{opacity:0,transform:'translate(-50%,-50%) scaleY(1.04)'}],{duration:timing.duration,easing:'linear'},pending);
  const cloud=combatV3Element('combat-v3-storm',{x,y:9},width*1.5,'',color);
  combatV3Fx(cloud,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:.8,transform:'translate(-50%,-50%) scale(1)',offset:.25},{opacity:0,transform:'translate(-50%,-50%) scale(1.3)'}],{duration:500},pending);
}
function combatV3Ice(sourcePoint,targetPoint,ultimate,index,direction,pending){
  const color=combatV3Palette.ice,size=ultimate?116:90;
  const timing=COMBAT_V3_STRIKES.ice;
  const start={x:sourcePoint.x+direction*sourcePoint.width*.24,y:sourcePoint.y-13},end={x:targetPoint.x,y:targetPoint.y};
  const angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
  const lance=combatV3Element('combat-v3-ice-lance',start,size,combatV3Svg('<path d="m8 110 131-22 72 22-72 22Z" fill="var(--combat-main)"/><path d="m20 110 119-15 72 15-72 3Z" fill="var(--combat-light)"/><path d="m54 99 32-18 59 18m-91 22 32 18 59-18" stroke="var(--combat-light)" stroke-width="3"/><path d="M4 110h100" stroke="#fff" stroke-width="3"/>'),color);
  combatV3Fx(lance,[{opacity:0,transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(.3)`},{opacity:1,transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(1)`,offset:.15,easing:'cubic-bezier(.32,.02,.85,.55)'},{opacity:1,transform:`translate(calc(-50% + ${end.x-start.x}px),calc(-50% + ${end.y-start.y}px)) rotate(${angle}deg) scaleX(1.2)`,offset:timing.contact/timing.duration},{opacity:0,transform:`translate(calc(-50% + ${end.x-start.x+direction*19}px),calc(-50% + ${end.y-start.y}px)) rotate(${angle}deg) scaleX(.5)`}],{duration:timing.duration,easing:'linear'},pending);
  if(ultimate){
    for(let n=0;n<3;n++){
      const spike=combatV3Element('combat-v3-ice-spike',{x:end.x+(n-1)*30,y:targetPoint.foot-20},55+n%2*20,combatV3Svg('<path d="m110 12 43 144-43 49-43-49Z" fill="var(--combat-main)"/><path d="m110 12 3 163-38-22Z" fill="var(--combat-light)"/><path d="m113 175 40-19-43 49Z" fill="var(--combat-deep)"/>'),color);
      combatV3Fx(spike,[{opacity:0,transform:'translate(-50%,-12%) scaleY(.1)'},{opacity:1,transform:`translate(-50%,-65%) rotate(${(n-1)*13}deg) scaleY(1)`,offset:.3},{opacity:.9,offset:.64},{opacity:0,transform:`translate(-50%,-73%) rotate(${(n-1)*13}deg) scaleY(1.05)`}],{duration:760,delay:230+n*80},pending);
    }
  }
}
function combatV3Earth(point,ultimate,pending){
  const color=combatV3Palette.earth,size=Math.min(point.width*1.25,230);
  const ground=combatV3Element('combat-v3-crater',{x:point.x,y:point.foot-12},size,combatV3Svg('<path d="m110 110-49-26-25 12M110 110l18-46 30-14M110 110l55 8 23 22M110 110l-10 56-31 22M110 110l-47 33-30-4" stroke="var(--combat-deep)" stroke-width="5" stroke-linecap="round"/><ellipse cx="110" cy="110" rx="88" ry="72" stroke="var(--combat-main)" stroke-width="5"/><ellipse cx="110" cy="110" rx="60" ry="45" stroke="var(--combat-light)" stroke-width="3"/>'),color);
  combatV3Fx(ground,[{opacity:0,transform:'translate(-50%,-50%) scale(.15) scaleY(.35)'},{opacity:1,transform:'translate(-50%,-50%) scale(.85) scaleY(.35)',offset:.22},{opacity:.8,transform:'translate(-50%,-50%) scale(1.15) scaleY(.35)',offset:.65},{opacity:0,transform:'translate(-50%,-50%) scale(1.5) scaleY(.35)'}],{duration:ultimate?900:660},pending);
  if(reduced)return;
  for(let i=0;i<(ultimate?7:4);i++){
    const x=(i-(ultimate?3:1.5))*18,rock=combatV3Element('combat-v3-rock',{x:point.x+x*.3,y:point.foot-20},12+i%3*5,'',color);
    combatV3Fx(rock,[{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:1,transform:`translate(calc(-50% + ${x*.5}px),${-48-(i%3)*15}px) rotate(${i*38}deg)`,offset:.35},{opacity:0,transform:`translate(calc(-50% + ${x*1.1}px),-7px) rotate(${i*60+70}deg)`}],{duration:680,delay:i*24},pending);
  }
}
function combatV3Breath(sourcePoint,targetPoint,ultimate,pending){
  const direction=targetPoint.x>sourcePoint.x?1:-1,start=sourcePoint.x+direction*sourcePoint.width*.22;
  const timing=COMBAT_V3_STRIKES.breath;
  const width=Math.abs(targetPoint.x-start)+35;
  const flame=combatV3Element('combat-v3-breath',{x:(start+targetPoint.x)/2,y:targetPoint.y-2},width,combatV3Svg('<path d="M8 49C27 34 43 42 58 27L52 43C73 35 82 27 96 20L86 42 115 38 104 53 116 70C93 75 79 62 67 73L70 58 51 68 53 54 29 60Z" fill="var(--combat-deep)"/><path d="M8 49C30 43 52 48 74 40L70 49 99 44 88 56 102 65 68 57 55 62 47 53Z" fill="var(--combat-main)"/><path d="m8 49 67 1 19 6-27-2-19 2Z" fill="var(--combat-light)"/>','0 0 120 90'),combatV3Palette.fire);
  flame.style.height=(ultimate?115:85)+'px';
  flame.firstElementChild.setAttribute('preserveAspectRatio','none');
  combatV3Fx(flame,[{opacity:0,transform:`translate(-50%,-50%) scaleX(${direction*.15}) scaleY(.5)`,easing:'cubic-bezier(.22,.7,.3,1)'},{opacity:1,transform:`translate(-50%,-50%) scaleX(${direction}) scaleY(1)`,offset:timing.contact/timing.duration},{opacity:.9,offset:.6},{opacity:0,transform:`translate(-50%,-50%) scaleX(${direction*1.03}) scaleY(.3)`}],{duration:timing.duration,easing:'linear'},pending);
}
function combatV3Impact(side,key,direction,strong,pending){
  const p=combatV3Point(side),color=combatV3Palette[key],size=strong?125:91;
  const star=combatV3Element('combat-v3-contact',p,size,combatV3Svg('<path d="m110 5 15 73 52-38-30 56 68 14-69 14 31 56-52-38-15 73-15-73-52 38 30-56-68-14 69-14-31-56 52 38Z" fill="var(--combat-main)"/><path d="m110 28 9 68 63 14-63 10-9 72-10-72-62-10 62-14Z" fill="var(--combat-light)"/>'),color);
  combatV3Fx(star,[{opacity:0,transform:'translate(-50%,-50%) scale(.35) rotate(-13deg)'},{opacity:1,transform:'translate(-50%,-50%) scale(1) rotate(0deg)',offset:.17},{opacity:.9,offset:.4},{opacity:0,transform:'translate(-50%,-50%) scale(1.35) rotate(14deg)'}],{duration:430},pending);
  const ring=combatV3Element('combat-v3-impact-ring',p,strong?120:86,'',color);
  combatV3Fx(ring,[{opacity:.95,transform:'translate(-50%,-50%) scale(.3)'},{opacity:.7,offset:.35},{opacity:0,transform:'translate(-50%,-50%) scale(1.8)'}],{duration:550},pending);
  if(!reduced)for(let i=0;i<(strong?10:6);i++){
    const count=strong?10:6,angle=(direction>0?0:Math.PI)+(i/(count-1)-.5)*Math.PI*.9,length=strong?88:62;
    const shard=combatV3Element('combat-v3-spark',p,i%2?5:8,'',color);
    combatV3Fx(shard,[{opacity:1,transform:`translate(-50%,-50%) rotate(${angle*180/Math.PI}deg) scaleX(.5)`},{opacity:1,offset:.3},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(angle)*length}px),calc(-50% + ${Math.sin(angle)*length}px)) rotate(${angle*180/Math.PI}deg) scaleX(2)`}],{duration:470+i%3*40},pending);
  }
}
function combatV3AttackTrail(sourcePoint,targetPoint,key,direction,contactDelay,pending){
  if(reduced)return;
  const start={x:sourcePoint.x+direction*sourcePoint.width*.16,y:sourcePoint.y-9};
  const dx=targetPoint.x-start.x,dy=targetPoint.y-start.y,length=Math.hypot(dx,dy);
  if(length<14)return;
  const angle=Math.atan2(dy,dx)*180/Math.PI,duration=contactDelay+340;
  const node=combatV3Element('combat-v3-direction-trail',{x:(start.x+targetPoint.x)/2,y:(start.y+targetPoint.y)/2},length,combatV3Svg('<path d="M1 26Q44 10 99 26" stroke="var(--combat-main)" stroke-width="10" opacity=".32"/><path d="M1 26Q44 10 99 26" stroke="var(--combat-light)" stroke-width="2.5"/><path d="M9 34Q50 22 91 33" stroke="var(--combat-main)" stroke-width="1.5" opacity=".65"/>','0 0 100 48'),combatV3Palette[key]);
  node.style.height='48px';node.firstElementChild.setAttribute('preserveAspectRatio','none');
  const transform=`translate(-50%,-50%) rotate(${angle}deg)`;
  combatV3Fx(node,[{opacity:0,transform,clipPath:'inset(0 100% 0 0)'},{opacity:.9,transform,clipPath:'inset(0 0 0 0)',offset:contactDelay/duration},{opacity:0,transform,clipPath:'inset(0 0 0 65%)'}],{duration,easing:'linear'},pending);
}
function combatV3Camera(direction,strong,boss,pending){
  if(reduced)return;
  const force=boss?(strong?8:6):(strong?6:3.5),scene=$('scene');
  pending.push(combatV3Animate(scene,[
    {transform:'translate(0px,0px)'},
    {transform:`translate(${-direction*force}px,${force*.28}px)`,offset:.16},
    {transform:`translate(${direction*force*.72}px,${-force*.2}px)`,offset:.38},
    {transform:`translate(${-direction*force*.35}px,${force*.12}px)`,offset:.64},
    {transform:'translate(0px,0px)'}
  ],{duration:210,easing:'ease-out'}));
}
function combatV3Number(side,value,kind,index,pending){
  const p=combatV3Point(side),node=document.createElement('span');
  node.className='combat-v3-number '+kind;node.textContent=value;
  node.style.left=(p.x+(index%2?17:-12))+'px';node.style.top=Math.max(24,p.y-p.height*.22)+'px';
  $('combatEffects').append(node);
  combatV3Fx(node,[{opacity:0,transform:'translate(-50%,8px) scale(.7)'},{opacity:1,transform:'translate(-50%,-8px) scale(1.1)',offset:.18},{opacity:1,transform:'translate(-50%,-17px) scale(1)',offset:.66},{opacity:0,transform:'translate(-50%,-43px) scale(.95)'}],{duration:790},pending);
}
function combatV3AudioContext(){
  if(!sound)return null;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    return audioContext;
  }catch{sound=false;updateSettings();return null;}
}
function combatV3Tone(context,{frequency,end=frequency,at=context.currentTime,duration=.2,volume=.025,type='sine'}){
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+Math.min(.018,duration*.15));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(gain);gain.connect(audioOutput(context,'effects'));osc.start(at);osc.stop(at+duration+.025);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
let combatV3NoiseSeed=0x4d595df4;
function combatV3Noise(context,{at=context.currentTime,duration=.16,volume=.025,frequency=2200,end=frequency,type='lowpass'}){
  const buffer=context.createBuffer(1,Math.max(1,Math.ceil(context.sampleRate*duration)),context.sampleRate),data=buffer.getChannelData(0);
  // Audio may overlap board refills; it must never consume gameplay randomness.
  for(let i=0;i<data.length;i++){
    combatV3NoiseSeed^=combatV3NoiseSeed<<13;combatV3NoiseSeed^=combatV3NoiseSeed>>>17;combatV3NoiseSeed^=combatV3NoiseSeed<<5;
    data[i]=(combatV3NoiseSeed>>>0)/2147483648-1;
  }
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=buffer;filter.type=type;filter.frequency.setValueAtTime(frequency,at);filter.frequency.exponentialRampToValueAtTime(Math.max(40,end),at+duration);
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+duration*.25);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(filter);filter.connect(gain);gain.connect(audioOutput(context,'effects'));source.start(at);source.stop(at+duration+.015);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
function combatV3ChargeSound(key,ultimate){
  if(key==='shadow')return playNoctSound(ultimate?'charge':'draw',{volume:ultimate?.26:.18});
  const context=combatV3AudioContext();if(!context)return;
  const frequency={fire:155,earth:105,ice:440,lightning:310,shadow:125}[key];
  combatV3Tone(context,{frequency,end:frequency*(ultimate?2.4:1.55),duration:combatV3Duration(ultimate?620:350)/1000,volume:ultimate?.019:.009,type:key==='lightning'?'triangle':'sine'});
}
function combatV3Whoosh(key,strong,contactDelay){
  if(key==='shadow')return playNoctSound('slash'+(noctSlashVariant++%3+1),{volume:strong?.36:.30,pan:Number(actor('hero').dataset.facing||1)*.32});
  const context=combatV3AudioContext();if(!context)return;
  // The sweep finishes at the same scaled contact time as the visual weapon.
  const duration=Math.max(.03,combatV3Duration(contactDelay)/1000);
  combatV3Noise(context,{duration,volume:strong?.034:.024,frequency:key==='earth'?320:650,end:key==='ice'?5200:3400,type:'bandpass'});
}
function combatV3HitSound(key,strong=false){
  if(key==='shadow')return playNoctSound(strong?'finish':'hit',{volume:strong?.42:.30,pan:Number(actor('hero').dataset.facing||1)*.18});
  const context=combatV3AudioContext();if(!context)return;
  // Impact transients stay crisp; only charge and travel audio follow pacing.
  const at=context.currentTime,power=strong?1.2:1;
  combatV3Tone(context,{frequency:key==='earth'?100:155,end:40,duration:key==='earth'?.3:.21,volume:.042*power,type:'triangle'});
  if(key==='ice'){
    combatV3Tone(context,{at,frequency:1420,end:950,duration:.18,volume:.021*power});
    combatV3Tone(context,{at:at+.025,frequency:2100,end:1600,duration:.13,volume:.013*power});
    combatV3Noise(context,{duration:.17,volume:.025*power,frequency:4600,end:1800,type:'highpass'});
  }else if(key==='lightning'){
    combatV3Tone(context,{frequency:260,end:85,duration:.13,volume:.014*power,type:'sawtooth'});
    combatV3Noise(context,{duration:.18,volume:.036*power,frequency:4800,end:1500,type:'bandpass'});
  }else if(key==='earth'){
    combatV3Noise(context,{duration:.28,volume:.04*power,frequency:1100,end:250});
  }else{
    combatV3Noise(context,{duration:.24,volume:.034*power,frequency:2100,end:450});
    combatV3Noise(context,{at:at+.04,duration:.09,volume:.014*power,frequency:4200,end:2000,type:'highpass'});
  }
}
function combatV3BuffSound(kind){
  const context=combatV3AudioContext();if(!context)return;
  const notes=kind==='heal'?[523,659,784]:[392,523,784];
  notes.forEach((frequency,index)=>combatV3Tone(context,{frequency,end:frequency*1.01,at:context.currentTime+combatV3Duration(index*110)/1000,duration:.32,volume:.024}));
}
attack=async function(side,raw,{ultimate=false,hits=1,damageLedger=null,charged=false,attackChain=1}={}){
  if(ultimate)return rageChoreography(side,raw,{hits});
  if(side==='hero'&&state.key==='shadow')return shadowAttack(raw,{hits,damageLedger,attackChain});
  const targetSide=side==='hero'?'enemy':'hero',source=actor(side),target=actor(targetSide);
  const key=progressionIsDuel()?'novice':side==='hero'?state.key:state.enemyKey,direction=side==='hero'?1:-1;
  const melee=key==='earth'||(['fire','novice'].includes(key)&&side==='hero');
  const sourceOrigin=combatV3Point(side),targetOrigin=combatV3Point(targetSide);
  const travel=melee?Math.max(0,Math.abs(targetOrigin.x-sourceOrigin.x)-sourceOrigin.width*.43):0;
  const sourceTransform=source.style.transform,targetTransform=target.style.transform,sourceZ=source.style.zIndex,targetFilter=target.style.filter;
  const pending=[];let total=0,blocked=0,stored=0;
  const chain=ultimate?1:Math.max(1,Math.floor(attackChain)),variant=(chain-1)%3;
  const poses=[{windup:0,ready:1,launch:2,contact:3,recover:4,tilt:7,lift:-3},{windup:4,ready:2,launch:1,contact:2,recover:3,tilt:-10,lift:-15},{windup:1,ready:0,launch:2,contact:4,recover:3,tilt:12,lift:5}];
  const critical=chain>=3&&chain%3===0;
  const opening=poses[variant];raw*=attackChainMultiplier(chain)*(critical?1.5:1);
  source.dataset.attackChain=chain;source.dataset.attackStance=['sweep','rising','overhead'][variant];
  hits=Math.max(1,Math.min(8,Math.round(hits)||1));
  source.classList.add('combat-v3-acting');source.style.zIndex='4';$('scene').classList.add('combat-v3-active');
  try{
    combatVoice(side,'attack');
    const preparationAction=ultimate?'cast':'attack';
    combatV3Action(side,preparationAction,ultimate?900:620);combatV3Frame(side,preparationAction,ultimate?0:opening.windup);
    if(chain>1)popActorSkill(side,'ĐÒN ×'+chain+' · +'+Math.round((attackChainMultiplier(chain)-1)*100)+'%',false,pending);
    if(!ultimate&&chain===1)combatV3Cue(side,key,false,hits,pending);
    combatV3Charge(side,key,ultimate,pending);
    await combatV3Pose(source,`translate(${-direction*(ultimate?7:4)}px,0px) rotate(${-direction*(melee?3:1)}deg)`,ultimate?290:150);
    combatV3Frame(side,preparationAction,ultimate?1:opening.ready);
    await combatV3Pose(source,`translate(${-direction*(ultimate?13:8)}px,${ultimate?-4:1}px) rotate(${-direction*(melee?7:2)}deg)`,ultimate?330:200);
    if(!ultimate)await combatV3Wait(COMBAT_V3_PACING.anticipationHold);
    combatV3Frame(side,preparationAction,ultimate?2:opening.launch);
    if(melee){
      combatV3Action(side,'attack',ultimate?1000:700);
      if(ultimate){combatV3Frame(side,'attack',0);await combatV3Wait(70);combatV3Frame(side,'attack',1);await combatV3Wait(100);}
      combatV3Frame(side,'attack',opening.launch);
      await combatV3Pose(source,`translate(${direction*travel}px,${opening.lift}px) rotate(${direction*opening.tilt*.5}deg)`,ultimate?250:210,'cubic-bezier(.18,.65,.25,1)');
    }else await combatV3Wait(ultimate?130:75);
    for(let i=0;i<hits;i++){
      const last=i===hits-1,strong=ultimate&&last,boss=side==='enemy'&&state.boss;
      const strike=poses[(variant+i)%3],strikeIndex=(variant+i)%3;
      // Each cut has a distinct wind-up and a held contact pose.
      const action=melee||!ultimate?'attack':'cast';
      combatV3Action(side,action,500);combatV3Frame(side,action,i?strike.windup:strike.launch);
      if(i){
        await combatV3Wait(melee?45:30);
        combatV3Frame(side,action,strike.ready);
        await combatV3Pose(source,`translate(${direction*(travel-7)}px,${melee?-7:-3}px) rotate(${-direction*(i%2?8:4)}deg)`,melee?130:85);
        combatV3Frame(side,action,strike.launch);await combatV3Wait(melee?45:35);
      }
      const origin=combatV3Point(side),contact=combatV3Point(targetSide);
      const contactDelay=COMBAT_V3_STRIKES[key==='fire'&&side==='enemy'?'breath':key].contact;
      combatV3Whoosh(key,strong||boss,contactDelay);
      if(melee||key==='lightning')combatV3AttackTrail(origin,contact,key,direction,contactDelay,pending);
      if(castAttackVisual(side,key,origin,contact,strikeIndex,pending)){}
      else if(key==='fire'&&side==='hero')combatV3Slash(contact,key,strikeIndex,ultimate,direction,pending);
      else if(key==='fire')combatV3Breath(origin,contact,ultimate,pending);
      else if(key==='ice')combatV3Ice(origin,contact,ultimate,i,direction,pending);
      else if(key==='lightning')combatV3Bolt(contact,key,i,ultimate,pending);
      else{
        combatV3Slash({x:contact.x-direction*15,y:contact.y+5,width:contact.width},key,strikeIndex,false,direction,pending);
      }
      await combatV3Pose(source,`translate(${direction*(travel+(melee?8:3))}px,${strike.lift}px) rotate(${direction*strike.tilt}deg)`,contactDelay,'cubic-bezier(.2,.8,.35,1)');
      // HP changes only once the visual weapon actually reaches its target.
      combatV3Frame(side,action,strike.contact);
      const result=damage(side,raw/hits,damageLedger);total+=result.amount;blocked+=result.blocked;stored+=result.stored||0;
      combatVoice(targetSide,'hurt');hitAccents(side,result,critical,pending);
      combatV3Action(targetSide,'hurt',strong||boss?560:410);combatV3HitSound(key,strong||boss);
      combatV3Impact(targetSide,key,direction,strong||boss,pending);
      if(key==='earth')combatV3Earth(contact,ultimate,pending);
      combatV3Number(targetSide,result.stored?'TÍCH +'+result.stored:result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.stored?'stored':result.amount?(critical?'crit':'damage'):'armor',i,pending);
      if(hits>1){
        const count=document.createElement('span');count.className='combat-v3-hit-count';count.textContent=String(i+1).padStart(2,'0')+' / '+String(hits).padStart(2,'0');$('combatEffects').append(count);
        combatV3Fx(count,[{opacity:0,transform:'translate(-50%,5px)'},{opacity:1,transform:'translate(-50%,0)',offset:.2},{opacity:0,transform:'translate(-50%,-3px)'}],{duration:520},pending);
      }
      combatV3Camera(direction,strong,boss,pending);
      target.style.filter='brightness(1.35)';
      await combatV3Pose(target,`translate(${direction*(strong||boss?15:9)}px,${strong||boss?-5:-2}px) rotate(${direction*(strong||boss?7:4)}deg)`,75);
      await combatV3Wait(strong?105:melee?75:65); // restrained hit stop, no full-screen strobe
      target.style.filter='';
      combatV3Frame(side,action,strike.recover);
      await combatV3Pose(target,'translate(0px,0px) rotate(0deg)',last?300:melee?175:130);
      combatV3Frame(side,action,5);
      combatV3Action(targetSide,'idle');
      if(!last)await combatV3Wait(melee?85:55);
    }
    await combatV3Pose(source,'translate(0px,0px) rotate(0deg)',ultimate?390:310);
    if(!ultimate)await combatV3Wait(COMBAT_V3_PACING.recoveryHold);
    await Promise.all(pending);
    return {amount:total,blocked,...(stored?{stored}:{} )};
  }finally{
    await Promise.allSettled(pending);
    source.style.transform=sourceTransform;target.style.transform=targetTransform;source.style.zIndex=sourceZ;target.style.filter=targetFilter;
    source.classList.remove('combat-v3-acting');$('scene').classList.remove('combat-v3-active');
    delete source.dataset.attackChain;delete source.dataset.attackStance;
    combatV3Action(side,'idle');combatV3Action(targetSide,'idle');
  }
};
buff=async function(side,kind,value,{alreadyApplied=false}={}){
  const isHero=side==='hero',hpKey=isHero?'hp':'enemyHp',armorKey=isHero?'armor':'enemyArmor',maximum=isHero?HEROES[state.key].hp:state.enemyMax;
  const gained=alreadyApplied?value:Math.min(value,kind==='heal'?maximum-state[hpKey]:999-state[armorKey]);if(gained<=0)return 0;
  const f=actor(side),transform=f.style.transform,pending=[],key=side==='hero'?state.key:state.enemyKey;
  const color=kind==='heal'?{main:'#79e3a9',light:'#ecffce',deep:'#388e77'}:combatV3Palette[key];
  const handSeal=isHero&&key==='shadow';
  combatV3Action(side,'buff',1300);
  combatV3Frame(side,'buff',0);
  try{
    if(!isHero)combatV3Charge(side,key,true,pending);
    await combatV3Pose(f,handSeal?'translate(0px,0px)':'translate(0px,-3px) rotate(0deg)',170);combatV3Frame(side,'buff',1);
    await combatV3Pose(f,handSeal?'translate(0px,0px)':'translate(0px,-6px) rotate(0deg)',170);combatV3Frame(side,'buff',2);await combatV3Wait(70);
    const p=combatV3Point(side);pending.push(restorationEffect(side,kind));
    if(!alreadyApplied){if(kind==='heal')state[hpKey]+=gained;else state[armorKey]+=gained;}
    combatV3Frame(side,'buff',3);
    update();combatV3BuffSound(kind);if(!alreadyApplied)combatV3Number(side,'+'+gained+(kind==='heal'?' HP':' GIÁP'),kind==='heal'?'heal':'armor',0,pending);
    if(!reduced&&!isHero)for(let i=0;i<7;i++){
      const mote=combatV3Element('combat-v3-heal-mote',{x:p.x+(i-3)*15,y:p.foot},5+i%2*3,'',color);
      combatV3Fx(mote,[{opacity:0,transform:'translate(-50%,0)'},{opacity:.9,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${Math.sin(i)*13}px),${-80-i%3*20}px)`}],{duration:850,delay:i*45},pending);
    }
    await combatV3Wait(250);combatV3Frame(side,'buff',4);await combatV3Pose(f,'translate(0px,0px) rotate(0deg)',400);combatV3Frame(side,'buff',5);await Promise.all(pending);return gained;
  }finally{await Promise.allSettled(pending);f.style.transform=transform;combatV3Action(side,'idle');}
};
