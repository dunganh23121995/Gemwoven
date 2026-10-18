// Each redesigned actor has its own visual vocabulary and sound palette.
// These presentation hooks leave board timing, damage ledgers and Noct intact.
const castSoundBuffers=new Map(),castSoundSources=new Set();
let castSoundEpoch=0;
function stopCastSounds(){
  castSoundEpoch++;
  for(const entry of castSoundSources)try{entry.source.stop();}catch{}
  castSoundSources.clear();
}
function decodeCastSound(context,id){
  if(!castSoundBuffers.has(id))castSoundBuffers.set(id,(async()=>{
    const data=Uint8Array.from(atob(ART.castSounds[id].src.split(',')[1]),c=>c.charCodeAt(0));
    return context.decodeAudioData(data.buffer);
  })().catch(error=>{castSoundBuffers.delete(id);throw error;}));
  return castSoundBuffers.get(id);
}
async function playCastSound(key,kind,{volume=.27,pan=0}={}){
  const context=combatV3AudioContext(),id=key+'-'+kind;if(!context||!ART.castSounds[id])return false;
  const epoch=castSoundEpoch;
  try{
    const buffer=await decodeCastSound(context,id);if(!sound||epoch!==castSoundEpoch)return false;
    if(castSoundSources.size>=8){const oldest=castSoundSources.values().next().value;try{oldest.source.stop();}catch{}castSoundSources.delete(oldest);}
    const source=context.createBufferSource(),gain=context.createGain(),stereo=context.createStereoPanner();
    source.buffer=buffer;gain.gain.value=volume;stereo.pan.value=Math.max(-.5,Math.min(.5,pan));
    source.connect(gain);gain.connect(stereo);stereo.connect(audioOutput(context,'effects'));
    const entry={source,id};castSoundSources.add(entry);
    source.onended=()=>{castSoundSources.delete(entry);source.disconnect();gain.disconnect();stereo.disconnect();};
    source.start();return true;
  }catch{return false;}
}
function castFx(key,kind,p,size,html,duration,pending,frames){
  if(reduced)return null;
  const node=combatV3Element('cast-fx cast-'+kind+' cast-'+key,p,size,html,combatV3Palette[key]);
  node.dataset.signature=key;node.dataset.effect=kind;
  const job=animate(node,frames||[
    {opacity:0,transform:'translate(-50%,-50%) scale(.5)'},
    {opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.24},
    {opacity:.8,offset:.56},{opacity:0,transform:'translate(-50%,-50%) scale(1.22)'}
  ],{duration,easing:'ease-out'}).finally(()=>node.remove());
  if(pending)pending.push(job);return node;
}
// Local deterministic noise: visual discharges never consume board RNG.
let lumiDischargeSeed=0;
function lumiElectricField(node,width=180,height=180,mode='corona'){
  if(!node||reduced)return;
  node.classList.add('lumi-electric');node.dataset.electricMode=mode;
  node.innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><path class="electric-haze"/><path class="electric-halo"/><path class="electric-branches"/><path class="electric-core"/></svg>`;
  const paths=[...node.querySelectorAll('path')],seed=++lumiDischargeSeed;
  let last=-100,frame=0;
  function redraw(now){
    if(!node.isConnected)return;
    if(now-last>=75){
      last=now;let noise=(seed*7919+(frame++%9)*104729)>>>0;
      const random=()=>{noise=(Math.imul(noise,1664525)+1013904223)>>>0;return noise/4294967296;};
      const line=(a,b,spread,steps=24)=>{
        const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
        let drift=0;
        return Array.from({length:steps+1},(_,i)=>{
          const t=i/steps;drift=drift*.48+(random()-.5)*spread;
          const jitter=drift*Math.sin(Math.PI*t);
          return [a[0]+dx*t-dy/length*jitter,a[1]+dy*t+dx/length*jitter];
        });
      };
      const path=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
      const mains=[],branches=[];
      const append=(points,spread)=>{
        mains.push(path(points));
        for(const index of [7,13,19]){
          const a=points[index],sign=random()<.5?-1:1;
          const end=mode==='beam'?[a[0]+18+random()*27,a[1]+sign*(14+random()*30)]:[a[0]+sign*(16+random()*spread),a[1]+12+random()*38];
          branches.push(path(line(a,end,9,9)));
        }
      };
      if(mode==='mantle'){
        // Disconnected, rising surface arcs leave the face and torso readable.
        // Slowly drifting paths retain their shape between electrical flickers.
        for(let i=0;i<4;i++){
          const side=i%2?1:-1,phase=Math.sin(now/1200+i)*.2,points=[];
          for(let j=0;j<=20;j++){
            const t=j/20,angle=(side===1?0:Math.PI)+(i<2?-.72:.62)+phase+(t-.5)*.62;
            const x=width*.5+Math.cos(angle)*width*.33;
            points.push([x+Math.sin(j*2.7+frame*.45+i)*1.2,height*.53+Math.sin(angle)*height*.4]);
          }
          mains.push(path(points));
          const tip=points[20];
          branches.push(path(line(tip,[tip[0]+side*7,tip[1]-12],3,6)));
        }
      }
      else if(mode==='sky')append(line([width*Number(node.dataset.skySource||.5),0],[width*.5,height-20],43,30),44);
      else if(mode==='beam')append(line([10,height*.5],[width-10,height*.5],24),24);
      else{
        for(let i=0;i<5;i++){
          const angle=i*2.39996+seed*.3,reach=Math.min(width,height)*(.3+random()*.14);
          const a=[width*.5+Math.cos(angle)*12,height*.5+Math.sin(angle)*12];
          const b=[width*.5+Math.cos(angle)*reach,height*.5+Math.sin(angle)*reach];
          append(line(a,b,19),16);
        }
      }
      paths[0].setAttribute('d',mains.join(''));paths[1].setAttribute('d',mains.join(''));
      paths[2].setAttribute('d',branches.join(''));paths[3].setAttribute('d',mains.join(''));
      node.dataset.electricFrame=String(frame);
    }
    requestAnimationFrame(redraw);
  }
  redraw(performance.now());
}
function lumiChargeMantle(node){
  if(!node||reduced)return;
  node.classList.add('lumi-charge-mantle');
  node.style.left='50%';node.style.top='61%';node.style.width='92%';node.style.height='76%';
  actor('hero').append(node);
  lumiElectricField(node,180,220,'mantle');
}
function prepareLumiThunder(){
  const context=combatV3AudioContext();if(!context)return;
  for(const kind of ['rumble','open','crack','tail'])decodeCastSound(context,'lightning-thunder-'+kind).catch(()=>{});
  if(!reduced)playCastSound('lightning','thunder-rumble',{volume:.5,pan:-.12});
}
function lumiThunderStrike(index){
  // No FX resolves all five hits together; avoid stacking five loud sounds.
  if(reduced&&index>0)return;
  if(index===0)for(const entry of castSoundSources){
    if(entry.id==='lightning-thunder-rumble'){try{entry.source.stop();}catch{}castSoundSources.delete(entry);}
  }
  return playCastSound('lightning','thunder-'+(index===0?'open':index===4?'tail':'crack'),
    {volume:index===0?.62:index===4?.68:.30,pan:.22+(index%2?.08:-.08)});
}
// Pin long charge effects to the skill clock even while a new sprite/image decodes.
function castTimelineAnimate(node,frames,options){
  if(reduced)return Promise.resolve();
  const animation=node.animate(frames,options);animation.startTime=document.timeline.currentTime;
  activeAnimations.add(animation);
  return animation.finished.catch(()=>{}).finally(()=>{activeAnimations.delete(animation);animation.cancel();});
}
function lumiStormCloud(pending){
  if(reduced)return {strike(){},remove(){}};
  const cloud=document.createElement('div');cloud.className='lumi-storm-cloud';cloud.setAttribute('aria-hidden','true');
  for(let i=0;i<12;i++){
    const puff=document.createElement('i');
    puff.style.cssText=`--puff-x:${-8+i*9}%;--puff-y:${i%3*12}px;--puff-size:${70+i%4*17}px;--puff-delay:${-i*.21}s;`;
    cloud.append(puff);
  }
  const light=document.createElement('b');cloud.append(light);$('combatEffects').append(cloud);
  pending.push(castTimelineAnimate(cloud,[{opacity:0,transform:'translateY(-30px) scaleX(.65)'},{opacity:.9,transform:'translateY(0) scaleX(1)',offset:.35},{opacity:1,offset:.78},{opacity:0,transform:'translateY(-12px) scaleX(1.12)'}],{duration:2850,easing:'ease-in-out'}).finally(()=>cloud.remove()));
  return {remove(){cloud.remove();},strike(point,index,jobs){
    const bolt=document.createElement('span'),width=170,top=24;
    bolt.className='rage-skyfall cast-skyfall lightning lumi-storm-bolt';bolt.dataset.caster='hero';
    bolt.dataset.strike=String(index);bolt.dataset.skySource=String([.16,.84,.3,.7,.5][index%5]);
    bolt.style.cssText=`left:${point.x}px;top:${top}px;width:${width}px;height:${point.y-top+20}px;`;
    $('combatEffects').append(bolt);lumiElectricField(bolt,width,point.y-top+20,'sky');
    jobs.push(animate(bolt,[{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0% 0)',offset:.06},{opacity:.65,offset:.23},{opacity:1,offset:.36},{opacity:.45,offset:.62},{opacity:0}],{duration:420,easing:'linear'}).finally(()=>bolt.remove()));
    jobs.push(animate(light,[{opacity:.2},{opacity:.85,offset:.12},{opacity:0}],{duration:210,easing:'ease-out'}));
  }};
}
function castEmblem(key){
  const paths={
    fire:'<path d="M110 184C50 161 36 111 62 65c-2 36 20 47 31 48-9-47 17-74 34-94-6 54 46 61 37 105-3 23-24 46-54 60Z"/><path d="M110 170c-25-21-22-44 0-72 4 28 25 45 0 72Z" class="emblem-core"/>',
    earth:'<path d="m110 22 74 44v88l-74 44-74-44V66Z"/><path d="m110 45 54 31v65l-54 32-54-32V76Zm0 0v128M56 76l54 33 54-33M56 141l54-32 54 32" class="emblem-lines"/>',
    ice:'<path d="M140 29a83 83 0 1 0 0 162A72 72 0 0 1 140 29Z"/><path d="m137 58 10 39 38 13-38 13-10 39-11-39-38-13 38-13Z" class="emblem-core"/>',
    lightning:'<path d="m132 20-69 100h42l-18 80 72-113h-43Z"/><circle cx="110" cy="110" r="85" class="emblem-lines"/><path d="M32 73 65 44m91 135 31-33" class="emblem-lines"/>'
  };return combatV3Svg(paths[key]);
}
function castScatter(key,p,strong,pending,receive=false){
  if(reduced)return;
  const count=strong?18:10;
  for(let i=0;i<count;i++){
    const angle=i*2.399963,reach=(strong?70:42)+(i%3)*12;
    const dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach;
    castFx(key,'particle',p,key==='earth'?10+i%3*3:6+i%3*3,'',420+(i%3)*55,pending,[
      {opacity:0,transform:`translate(calc(-50% + ${receive?dx:0}px),calc(-50% + ${receive?dy:0}px)) rotate(${i*27}deg) scale(.4)`},
      {opacity:1,offset:.15},{opacity:.9,offset:.45},
      {opacity:0,transform:`translate(calc(-50% + ${receive?0:dx}px),calc(-50% + ${receive?-12:dy+(key==='earth'?28:-8)}px)) rotate(${i*27+100}deg) scale(.1)`}
    ]);
  }
}
function castAttackVisual(side,key,origin,contact,index,pending){
  if(key==='shadow'||key==='novice'||(side==='enemy'&&!state.boss)||key==='fire')return false;
  if(reduced)return true;
  if(key==='earth'){
    if(side==='hero')castFx(key,'hammer-weight',contact,115,combatV3Svg('<path d="M43 45Q131 12 171 121" stroke="var(--combat-main)" stroke-width="12" opacity=".45"/><path d="M43 45Q131 12 171 121" stroke="var(--combat-light)" stroke-width="3"/>'),230,pending);
    else castFx(key,'root-fist',contact,130,combatV3Svg('<path d="M23 202Q73 145 58 100q20 22 27 50Q92 73 136 36q-12 69-5 96 36-48 70-59-37 55-47 104" stroke="#b7d375" stroke-width="7"/><path d="M75 180Q92 113 124 62" stroke="#fff5bd" stroke-width="2"/>'),320,pending);
    return true;
  }
  if(key==='ice'&&side==='hero')return false;
  if(key==='lightning'&&side==='hero'){
    const dx=contact.x-origin.x,dy=contact.y-origin.y,width=Math.hypot(dx,dy)+20;
    const node=castFx(key,'discharge',origin,width,'',270,pending,[
      {opacity:0},{opacity:1,offset:.2},{opacity:.85,offset:.65},{opacity:0}
    ]);
    if(node){
      node.style.width=width+'px';node.style.height='120px';node.style.transformOrigin='10px 50%';
      node.style.transform=`translate(-10px,-50%) rotate(${Math.atan2(dy,dx)}rad)`;
      lumiElectricField(node,width,120,'beam');
    }
    return true;
  }
  const direction=side==='hero'?1:-1,dx=contact.x-origin.x,dy=contact.y-origin.y;
  const shape=key==='ice'?combatV3Svg('<path d="M22 173Q35 55 192 31q-31 122-170 142Z" fill="#b1efff"/><path d="M29 165 181 42m-92 95 10-43m26 11 8-35m-69 91 7-39" stroke="#fff" stroke-width="3"/>'):combatV3Svg(side==='hero'?'<circle cx="110" cy="110" r="34" fill="#fff2b5"/><ellipse cx="110" cy="110" rx="81" ry="34" stroke="#c4a1ff" stroke-width="5"/><path d="m40 113 35-35 23 31 24-30 24 33 30-15" stroke="#fff" stroke-width="3"/>':'<path d="M50 25Q83 91 40 181M104 18Q141 91 101 197M157 32Q196 110 153 186" stroke="#c2a0ff" stroke-width="12"/><path d="M50 25Q83 91 40 181M104 18Q141 91 101 197M157 32Q196 110 153 186" stroke="#fff8ce" stroke-width="3"/>');
  const count=key==='ice'?3:1,duration=key==='ice'?310:220,contactAt=key==='ice'?combatV3Duration(320):combatV3Duration(115);
  for(let i=0;i<count;i++){
    const p={x:origin.x,y:origin.y+(i-1)*10},node=castFx(key,side==='hero'?'conductor-orb':key==='ice'?'royal-feather':'thunder-claw',p,key==='ice'?70:side==='hero'?74:110,shape,duration,pending,[
      {opacity:0,transform:`translate(-50%,-50%) scale(.4) scaleX(${direction})`},
      {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1) scaleX(${direction})`,offset:contactAt/duration},
      {opacity:.8,offset:.65},
      {opacity:0,transform:`translate(calc(-50% + ${dx+direction*14}px),calc(-50% + ${dy}px)) scale(1.3) scaleX(${direction})`}
    ]);if(node)node.dataset.caster=side;
  }
  return true;
}
const originalCastCharge=combatV3Charge;
combatV3Charge=function(side,key,ultimate,pending){
  if(key==='shadow'||(side==='enemy'&&!state.boss))return originalCastCharge(side,key,ultimate,pending);
  if(!(side==='hero'&&key==='lightning'&&ultimate))playCastSound(key,ultimate?'charge':'launch',{volume:ultimate?.25:.12,pan:side==='hero'?-.2:.2});
  if(reduced)return;
  const p=combatV3Point(side),duration=ultimate?900:380;
  const crest=castFx(key,'channel',p,Math.min(150,p.width*.8),castEmblem(key),duration,pending);
  if(crest)crest.dataset.caster=side;
  if(key==='lightning'&&side==='hero')lumiChargeMantle(crest);
  castScatter(key,p,ultimate,pending,true);
};
const originalCastImpact=combatV3Impact;
combatV3Impact=function(target,key,direction,strong,pending){
  if(key==='shadow'||(target==='hero'&&!state.boss))return originalCastImpact(target,key,direction,strong,pending);
  const p=combatV3Point(target);
  castFx(key,'bloom',p,strong?145:95,'',350,pending);
  if(key==='fire'){
    for(let i=0;i<3;i++)castFx(key,'flame-petal',p,(strong?110:75)+i*13,combatV3Svg('<path d="M28 179C55 144 32 94 89 46c-12 43 21 59 27 74 31-25 45-50 42-86 62 75 18 141-71 155 37-19 35-48 22-64-15 26-46 32-81 54Z" fill="var(--combat-main)"/><path d="M65 176c49-20 54-51 41-82 42 46 16 70-41 82Z" fill="var(--combat-light)"/>'),380+i*25,pending,[{opacity:0,transform:`translate(-50%,-50%) rotate(${i*120}deg) scale(.3)`},{opacity:.95,offset:.2},{opacity:0,transform:`translate(-50%,-60%) rotate(${i*120+30}deg) scale(1.1)`}]);
  }else if(key==='earth'){
    const ground={x:p.x,y:p.foot-12};
    castFx(key,'fault',ground,strong?200:120,combatV3Svg('<path d="m10 120 40-25 29 12 31-48 17 42 37-9 45 28M34 143l41-18 35-18 16 34 47 18M110 107l-5 85" stroke="var(--combat-light)" stroke-width="3"/><path d="m10 120 40-25 29 12 31-48 17 42 37-9 45 28" stroke="var(--combat-main)" stroke-width="9" opacity=".4"/>'),500,pending);
    for(let i=0;i<(strong?5:3);i++)castFx(key,'monolith',{x:p.x+(i-(strong?2:1))*22,y:p.foot-22},42+i%2*14,combatV3Svg('<path d="m76 196-9-123 44-53 44 58-7 118Z" fill="var(--combat-deep)"/><path d="m111 20 6 170 31 6 7-118Z" fill="var(--combat-main)"/><path d="m111 20-44 53 23 50 27 67" stroke="var(--combat-light)" stroke-width="3"/>'),460,pending,[{opacity:0,transform:'translate(-50%,0%) scaleY(.1)'},{opacity:1,transform:'translate(-50%,-70%) scaleY(1)',offset:.3},{opacity:.8,offset:.62},{opacity:0,transform:'translate(-50%,-55%) scaleY(.7)'}]);
  }else if(key==='ice'){
    const petals=Array.from({length:6},(_,i)=>`<path transform="rotate(${i*60} 110 110)" d="m110 110-24-48 24-43 24 43Z" fill="var(--combat-main)" opacity=".65"/><path transform="rotate(${i*60} 110 110)" d="M110 110V27m0 43-17-17m17 17 17-17" stroke="var(--combat-light)" stroke-width="2"/>`).join('');
    castFx(key,'snow-bloom',p,strong?170:100,combatV3Svg(petals),530,pending);
  }else if(target==='enemy'){
    const node=castFx(key,'electric-impact',p,strong?175:115,'',430,pending);
    lumiElectricField(node);
  }else{
    const node=castFx(key,'electric-crown',p,strong?165:105,combatV3Svg('<ellipse cx="110" cy="110" rx="90" ry="44" stroke="var(--combat-main)" stroke-width="3"/><ellipse cx="110" cy="110" rx="42" ry="88" stroke="var(--combat-light)" stroke-width="2"/><path class="living-arc" d="m25 102 25-26 18 34 25-30 22 42 27-28 20 24 31-18" stroke="white" stroke-width="3"/>'),430,pending);
    if(node)node.classList.add('living-electricity');
  }
  castScatter(key,p,strong,pending);
};
const originalCastChargeSound=combatV3ChargeSound,originalCastWhoosh=combatV3Whoosh,originalCastHitSound=combatV3HitSound;
combatV3ChargeSound=function(key,ultimate){if(key==='shadow')return originalCastChargeSound(key,ultimate);return playCastSound(key,'charge',{volume:ultimate?.24:.13});};
combatV3Whoosh=function(key,strong,contact){if(key==='shadow')return originalCastWhoosh(key,strong,contact);return playCastSound(key,'launch',{volume:strong?.25:.18});};
combatV3HitSound=function(key,strong){if(key==='shadow')return originalCastHitSound(key,strong);return playCastSound(key,strong?'finish':'impact',{volume:strong?.30:.23});};
const originalCastRage=rageChoreography;
rageChoreography=async function(side,raw,options={}){
  const key=side==='hero'?state.key:state.enemyKey,pending=[];
  if(key!=='shadow'&&!(side==='hero'&&key==='fire')&&(side==='hero'||state.boss)&&!reduced){
    const p=combatV3Point(side),node=castFx(key,'channel',p,145,castEmblem(key),1050,pending);
    if(node)node.dataset.caster=side;
    if(key==='lightning'&&side==='hero')lumiChargeMantle(node);
    castScatter(key,p,true,pending,true);
  }
  try{return await originalCastRage(side,raw,options);}finally{await Promise.allSettled(pending);}
};
const originalCastSkyfall=rageSkyfall;
rageSkyfall=function(side,key,pending){
  if(!['ice','lightning'].includes(key))return originalCastSkyfall(side,key,pending);
  if(reduced)return;
  const p=combatV3Point(side==='hero'?'enemy':'hero'),node=document.createElement('span');
  node.className='rage-skyfall cast-skyfall '+key;node.dataset.caster=side;node.dataset.skyOrigin='-220';
  node.style.cssText=`left:${p.x}px;top:-220px;height:${p.y+255}px;--rage-color:${combatV3Palette[key].main};`;
  node.innerHTML=key==='ice'?combatV3Svg('<path d="m30 0-8 66 28 34 28-34-8-66Z" fill="#7ae5ff" opacity=".65"/><path d="m50 0-5 76 5 24 5-24Z" fill="#efffff"/><path d="m8 15-4 45 13 20 7-21-6-44Zm74-5-7 49 9 25 13-22-4-52Z" fill="#c3f9ff" opacity=".8"/>','0 0 100 100'):combatV3Svg('<path class="storm-column" d="M50 0 38 20 58 33 31 49 62 63 43 80 50 100" stroke="#a68aff" stroke-width="16" opacity=".4"/><path class="storm-column" d="M50 0 38 20 58 33 31 49 62 63 43 80 50 100" stroke="#deceff" stroke-width="7"/><path class="storm-column" d="M50 0 38 20 58 33 31 49 62 63 43 80 50 100" stroke="#fffcec" stroke-width="2"/><path d="m42 23-25 11 7 18m31 14 27 5-6 17" stroke="#dac2ff" stroke-width="2"/>','0 0 100 100');
  node.firstElementChild.setAttribute('preserveAspectRatio','none');$('combatEffects').append(node);
  if(key==='lightning'&&side==='hero'){
    node.style.width='180px';lumiElectricField(node,180,p.y+255,'sky');
    pending.push(animate(node,[{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0% 0)',offset:.5},{opacity:.88,offset:.8},{opacity:0}],{duration:620,easing:'ease-out'}).finally(()=>node.remove()));
    return;
  }
  pending.push(animate(node,[{opacity:0,transform:'translateX(-50%) scaleY(.03)'},{opacity:1,transform:'translateX(-50%) scaleY(1)',offset:.65},{opacity:.95,offset:.85},{opacity:0,transform:'translateX(-50%) scaleY(1.02)'}],{duration:620,easing:'cubic-bezier(.35,0,.6,1)'}).finally(()=>node.remove()));
};
// Blessings share the same stat path, but each hero receives an elemental ward.
const originalCastRestoration=restorationEffect;
restorationEffect=function(side,kind){
  const key=side==='hero'?state.key:state.enemyKey;
  if(key==='shadow'||side==='enemy')return originalCastRestoration(side,kind);
  if(reduced)return Promise.resolve();
  const pending=[],p=combatV3Point(side);
  playCastSound(key,'receive',{volume:.21,pan:-.2});
  const node=castFx(key,'ward',p,kind==='heal'?115:140,castEmblem(key),620,pending);
  if(node){node.classList.add('restoration-field');node.dataset.ward=kind;}
  if(key==='lightning')lumiElectricField(node);
  castScatter(key,p,true,pending,true);
  return Promise.all(pending);
};
// The clean fire cuts are still alternate right/left, now with ember remnants.
const originalCastBladeCut=quickBladeCut;
quickBladeCut=function(point,key,index,direction,pending){
  const result=originalCastBladeCut(point,key,index,direction,pending);
  if(key==='fire')castScatter('fire',point,false,pending);
  return result;
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCastSounds();});
$('soundBtn').addEventListener('click',()=>{if(!sound)stopCastSounds();});
// Levitation is an independent translation, so attack/recoil transforms cannot
// put Lumi's feet back on the floor. Her head anchor inherits the same motion.
function updateLumiLevitation(now){
  requestAnimationFrame(updateLumiLevitation);
  const root=actor('hero');
  if(state.key!=='lightning'){
    if(root.dataset.floating){delete root.dataset.floating;root.style.translate='';}
    return;
  }
  const alive=state.hp>0;root.dataset.floating=String(alive);
  root.style.translate=alive?`0px ${reduced?-12:-14+Math.sin(now/650)*2.5}px`:'0px 0px';
}
requestAnimationFrame(updateLumiLevitation);
async function departLumiHero(){
  const root=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children];
  root.dataset.departing='true';
  try{
    setSpriteFrame('hero','hover',0);
    const start=performance.now(),duration=reduced?1:2400;
    await new Promise(resolve=>{
      function tick(now){
        const p=Math.min(1,(now-start)/duration),camera=width*.95*p;
        root.style.transform=`translateX(${width*1.65*p-camera}px)`;
        root.dataset.worldX=String(width*1.65*p);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','hover',Math.floor((now-start)/160)%6);
        layers.forEach(layer=>layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`);
        if(p<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    await animate(root,[{opacity:1},{opacity:0}],{duration:180});root.style.opacity='0';
  }finally{delete root.dataset.departing;delete root.dataset.worldX;root.style.transform='';setSpriteAction('hero','idle');}
}
