// Special gem FX v3 (owner 05/11: "hiệu ứng khi nổ chưa có, chỉ mới dừng lại là item nào bị ảnh hưởng và biến mất"; Bom:
// "xoáy lửa co lại rồi bùm"; Sao băng: "phép quét có tiếng như đàn piano bị miết phím"). Codex critique, hard checks and
// the drawn pieces: assets/gemwoven/raw/board-fx-v3/. Each kind plays readable phases on the board itself:
//   Sao băng: a charge, then two drawn blades sweep its 3-lane band from the gem to both edges; each gem dips like a key
//   as the blade reaches it, flashes and breaks (a real piano glissando runs with the sweep).
//   Bom: the gem swells, a drawn fire vortex covering its 5×5 turns and closes in while the gems are pulled toward it,
//   then a drawn fireball bursts, the gems break outward and the board shakes.
//   Lõi: the orb lifts in its round prism halo, beams reach every gem of its colour in eight groups, copies of them fly
//   down the beams into the orb, which shrinks and bursts in a star and a ring wave (a spell swell, then a crystal cast).
//   Lõi + Lõi clears the whole board once for every special on it, each wave starting from one of those specials, turned into a Lõi.
// Drawn pieces (ART.specialFx) move as whole images; without them the same timing still clears the gems. Reduced motion
// keeps only the result.
const SPECIAL_FX=Object.freeze({
  bolt:{charge:150,cell:66,press:55,after:180},
  bomb:{arm:120,vortex:450,blast:300,after:130},
  // Lõi (owner 05/11, twice: "từ từ + lần lượt, tổng ~2 s, cho phép đè lên nhau"): one beam after another around the
  // orb over `span`, each growing out softly over `grow`; each gem is drawn in down its own beam as soon as it lands.
  core:{lift:320,span:2000,grow:460,pull:620,shrink:220,nova:360},
  wave:{appear:260,span:1200,grow:360,pull:480,shrink:180},
  turn:{span:2000,grow:460,prime:280},
  chainCharge:70,stagger:50,
  colors:{bolt:'#63dfff',bomb:'#ffb34d',ivory:'#fff6da'}
});
// Light-only pieces (blades, vortex, fireball, beams, stars) play out on their own: the refill never waits for a fading
// trail (Codex hard check). Only what moves a tile or a gem stays in the sequence's tails.
const specialFxLoose=job=>{job?.catch?.(()=>{});};
// A pose the gem keeps until it breaks (a pressed key, a pull toward the vortex, a lifted orb): animate() cancels a
// finished animation and the gem would snap back, so these hold their last frame.
function specialFxHold(el,frames,options){
  if(!el||!el.isConnected||reduced)return Promise.resolve();
  return el.animate(frames,{fill:'forwards',...options}).finished.catch(()=>{});
}
// One board cell in CSS px (the tiles' own size), for poses given in cells (Codex: 0.11 cell dip, 0.2 cell lift).
const specialFxCell=t=>t?.el?.offsetHeight||48;
// Held poses move the gem's picture, not the gem: the board's own break animation (scale and fade on the gem) then
// plays on top of the pose instead of snapping the picture back to its rest size for a frame.
const specialFxArtOf=t=>t?.el?.querySelector('.item-art')||t?.el?.firstElementChild;
// The bang shakes the board only: 3 px for 120 ms.
function specialFxShake(px=3){
  const frame=$('boardFrame');if(reduced||!frame)return Promise.resolve();
  return frame.animate([{translate:'0 0'},{translate:`${-px}px ${px*.5}px`,offset:.25},{translate:`${px*.8}px ${-px*.4}px`,offset:.55},{translate:`${-px*.4}px 0`,offset:.8},{translate:'0 0'}],{duration:120,easing:'linear'}).finished.catch(()=>{});
}
// Decode the drawn pieces once, so the first fireball or vortex of a fight does not stall a frame.
setTimeout(()=>{for(const src of Object.values(ART.specialFx||{})){const img=new Image();img.src=src;img.decode?.().catch(()=>{});}},0);
// One real recording per cue (scripts/prepare_board_special_sounds.py).
const specialFxSound=cue=>{if(!reduced&&typeof playCastSound==='function')playCastSound('board',cue,{volume:.42});};
// A cue cut short at a given moment with a 40 ms fade (the vortex's rush stops on the bang, whatever its length).
async function specialFxSoundFor(cue,ms,volume=.42){
  const context=!reduced&&typeof combatV3AudioContext==='function'?combatV3AudioContext():null,id='board-'+cue;
  if(!context||!ART.castSounds?.[id]||typeof decodeCastSound!=='function')return;
  try{
    const buffer=await decodeCastSound(context,id),source=context.createBufferSource(),gain=context.createGain(),end=context.currentTime+ms/1000;
    source.buffer=buffer;gain.gain.setValueAtTime(volume,context.currentTime);gain.gain.setValueAtTime(volume,Math.max(context.currentTime,end-.04));gain.gain.linearRampToValueAtTime(0,end);
    source.connect(gain);gain.connect(audioOutput(context,'effects'));source.start();source.stop(end+.01);
    source.onended=()=>{source.disconnect();gain.disconnect();};
  }catch{}
}
// The drawn kinds now match the clears: no more swapped bolt/bomb looks.
boardSpecialEffectKind=kind=>kind;
// fxAnimate() cancels a finished animation, which snaps a piece back to its base look (a fully visible gem copy) until its
// group is removed. FX pieces therefore take their final opacity as their base before they play (Codex review 4).
function fxAnimate(el,frames,options){const end=frames[frames.length-1];if(el&&end&&end.opacity!=null)el.style.opacity=end.opacity;return animate(el,frames,options);}
const specialFxArt=name=>ART.specialFx?.[name]||null;
const specialFxRules=()=>globalThis.GemwovenSpecials.TUNE;
function specialFxImage(group,name,x,y,w,h,attrs={}){
  const href=specialFxArt(name);if(!href)return null;
  return boardV3Child(group,'image',{href,x:x-w/2,y:y-h/2,width:w,height:h,preserveAspectRatio:'none',...attrs});
}
// Gems a special clears in bulk pop as their own art (a quick bright swell into a few sparkles), not the grey halo and
// ring the one-by-one match clear uses, which turned a 5×5 into a grid of circles (Codex review 2).
const specialFxBaseBurst=boardBurst;
boardBurst=function(t,color,kind){return kind==='mass'?specialFxMassBurst(t,color):kind==='quiet'?Promise.resolve():specialFxBaseBurst(t,color,kind);};
async function specialFxMassBurst(t,color){
  if(reduced)return;
  const {x,y}=boardV3Point(t),group=boardV3Group('mass-burst',t,'mass'),tasks=[];
  const art=boardV3Child(group,'image',{x:x-44,y:y-44,width:88,height:88,href:itemImage(Math.max(0,t.type),t.special),preserveAspectRatio:'xMidYMid meet'});
  boardV3Origin(art,x,y);
  tasks.push(fxAnimate(art,[{opacity:1,transform:'scale(1)',filter:'brightness(1) saturate(1)'},{opacity:1,transform:'scale(1.14)',filter:'brightness(1.2) saturate(1.3)',offset:.35},{opacity:0,transform:'scale(.45)',filter:'brightness(1.35) saturate(1.2)'}],{duration:240,easing:'ease-out',fill:'forwards'}));
  // Codex review 3: keep the gem's colour; a coloured mote and one sparkle carry it away, no white veil.
  for(let i=0;i<2;i++){
    const star=i?specialFxImage(group,'sparkle',x,y,30,30,{style:'mix-blend-mode:screen'})||boardV9Star(group,x,y,8,'#fff4cf'):boardV6Mote(group,x,y,Math.max(0,t.type),color||boardV3Color(t),i);
    boardV3Origin(star,x,y);const a=(t.r*3+t.c*5+i*3)%6*Math.PI/3,d=26+i*10;
    tasks.push(fxAnimate(star,[{opacity:0,transform:'translate(0px,0px) scale(.3)'},{opacity:1,transform:`translate(${Math.cos(a)*d*.5}px,${Math.sin(a)*d*.5}px) scale(1)`,offset:.4},{opacity:0,transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.3)`}],{duration:320,delay:i*40,easing:'ease-out',fill:'forwards'}));
  }
  // The sparkles fade on their own; the refill waits only for the gem's own pop.
  specialFxLoose(Promise.all(tasks).finally(()=>group.remove()));
  await boardV3Pause(120);
}
function specialFxHit(t,sequence,kind,burst='mass'){
  const {targets,cleared,sources,primed,tails,detonate}=sequence;
  if(!targets.has(t)||cleared.has(t)||primed.has(t))return;
  if(sources.has(t)){
    // A special the blast reaches waits, lit, for its own generation.
    primed.add(t);
    tails.push(fxAnimate(t.el.firstElementChild,[{filter:'brightness(1)'},{filter:'brightness(2.1)',offset:.35},{filter:'brightness(1.4)'}],{duration:BOARD_V5_PACING.primed,easing:'linear',fill:'forwards'}));
  }else detonate(t,burst);
}
// The big star nova (cinematic.js) once per clear; chained sources only get their own light.
// Codex review 4: no soft round blob at the peak; a small drawn starburst and a ring of sparkles that break up and go out.
function specialFxNova(t,kind,sequence){
  if(sequence.novaDone||reduced)return;sequence.novaDone=true;
  const {x,y}=boardV3Point(t),group=boardV3Group('special-nova-v2',t,kind),tasks=[],big=kind==='core'||kind==='combo'?1.35:kind==='bomb'?1.15:1;
  const burst=specialFxImage(group,'flash',x,y,120*big,120*big,{style:'mix-blend-mode:screen'});
  if(burst){boardV3Origin(burst,x,y);tasks.push(fxAnimate(burst,[{opacity:0,transform:'scale(.3) rotate(0deg)'},{opacity:.9,transform:'scale(1) rotate(25deg)',offset:.25},{opacity:0,transform:'scale(1.25) rotate(45deg)'}],{duration:380,easing:'ease-out',fill:'forwards'}));}
  const count=kind==='core'||kind==='combo'?14:10,colors=kind==='core'?boardV4Prism:[boardV3Color(t),'#fff2ad','#bfefff'];
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2+.3,d=(120+(i%3)*40)*big;
    const spark=i%2?specialFxImage(group,'sparkle',x,y,30,30,{style:'mix-blend-mode:screen'})||boardV9Star(group,x,y,7,'#fff4cf'):boardV9Star(group,x,y,6,colors[i%colors.length]);
    boardV3Origin(spark,x,y);
    tasks.push(fxAnimate(spark,[{opacity:0,transform:'translate(0px,0px) scale(.4)'},{opacity:1,transform:`translate(${Math.cos(a)*d*.45}px,${Math.sin(a)*d*.45}px) scale(1.1)`,offset:.3},{opacity:0,transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.2)`}],{duration:560,easing:'cubic-bezier(.2,.7,.35,1)',fill:'forwards'}));
  }
  specialFxLoose(Promise.all(tasks).finally(()=>group.remove()));
}
// The dragged special pulls its partner in before a combo fires.
async function specialFxMerge(act,duration,kind){
  const partner=act.partner;
  if(reduced||!partner?.el)return;
  const dx=(act.tile.c-partner.c)*partner.el.offsetWidth,dy=(act.tile.r-partner.r)*partner.el.offsetHeight;
  await Promise.all([
    animate(partner.el.firstElementChild,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx*.6}px,${dy*.6}px) scale(.75)`,filter:'brightness(1.9)'}],{duration,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'}),
    boardV3Charge({tile:act.tile,kind},duration)
  ]);
}

// The big drawn pieces (blades, trails, vortex, fireball, prism beams, flying gem copies) play on an HTML layer over the
// board, not in the SVG: there they only move and fade, which the compositor does without repainting, whereas the SVG
// (filtered as a whole) repainted every frame and stalled the bang for ~180 ms. The layer is an 800×800-unit stage
// scaled to the board, so pieces use the same board units as the SVG.
function specialFxStageEl(){
  let layer=$('specialFxLayer');
  if(!layer){const effects=$('boardEffects');if(!effects)return null;
    layer=document.createElement('div');layer.id='specialFxLayer';layer.className='board-effects special-fx-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="sfx-stage"></div>';effects.after(layer);}
  const stage=layer.firstElementChild;stage.style.transform=`scale(${(layer.clientWidth||800)/800})`;return stage;
}
// A piece centred on (x,y), or starting there when anchor is 'left' (a trail or beam that grows from its origin).
function specialFxSprite(name,x,y,w,h,{anchor='center',src=null}={}){
  const href=src||specialFxArt(name),stage=href&&!reduced?specialFxStageEl():null;if(!stage)return null;
  const img=document.createElement('img');img.src=href;img.alt='';img.draggable=false;img.className='sfx-piece'+(src?' sfx-gem':'');
  img.style.cssText=`left:${anchor==='left'?x:x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;transform-origin:${anchor==='left'?'0 50%':'50% 50%'}`;
  stage.append(img);return img;
}
// Plays a piece once and removes it. fill both: hidden through its delay, held at its end until removed.
function specialFxPlay(img,frames,options){
  if(!img)return;
  const a=img.animate(frames,{fill:'both',...options});specialFxLoose(a.finished.finally(()=>img.remove()));
}
// A gem the blade reaches dips like a pressed key, flashes its colour, then breaks.
function specialFxPress(t,sequence,kind,delay=0){
  const {targets,cleared,primed}=sequence;
  if(!targets.has(t)||cleared.has(t)||primed.has(t))return Promise.resolve();
  if(reduced||sequence.sources.has(t))return boardV3Pause(delay).then(()=>specialFxHit(t,sequence,kind));
  // The wait is part of the animation, on the same clock as the blade, so a busy frame cannot put the dip behind it.
  const gem=specialFxArtOf(t),F=SPECIAL_FX.bolt;
  // Transform only, so the compositor plays it in step with the blade even while the fight above is busy.
  return specialFxHold(gem,[{transform:'translateY(0) scale(1)'},{transform:`translateY(${specialFxCell(t)*.11}px) scale(.94)`}],{duration:F.press,delay,easing:'ease-in'})
    .then(()=>specialFxHit(t,sequence,kind));
}
// A blade: the drawn crescent leads, a beam stretches behind it from the origin. It travels from the origin cell to the
// edge. axis 'row' sweeps along a row (sign 1 right, -1 left), 'col' along a column; half: lanes either side it covers.
function specialFxBlade(origin,axis,sign,half,sequence,{delay=0}={}){
  if(reduced)return;
  const F=SPECIAL_FX.bolt,{x,y}=boardV3Point(origin),along=axis==='col';
  const at=along?origin.r:origin.c,cells=sign>0?SIZE-1-at:at;if(cells<=0)return;
  // One clock for blade and keys: the blade's centre crosses cell d at d·cell ms, then runs on half a cell and fades.
  const travel=cells*100,duration=cells*F.cell,out=F.cell*.6,height=(half*2+1)*100*.95,edge=duration/(duration+out);
  // Drawn along +x through the origin; a column turns it 90°, the other side mirrors it.
  const turn=`rotate(${along?90:0}deg) scaleX(${sign})`;
  const trail=specialFxSprite('beam',x,y,travel+50,Math.min(height*.42,150),{anchor:'left'});
  specialFxPlay(trail,[{opacity:0,transform:`${turn} scaleX(0)`},{opacity:.95,transform:`${turn} scaleX(1)`,offset:.85},{opacity:0,transform:`${turn} scaleX(1) scaleY(.3)`}],{duration:duration+F.after,delay,easing:'linear'});
  const blade=specialFxSprite('blade',x,y,height*.625,height);
  specialFxPlay(blade,[{opacity:0,transform:`${turn} translateX(0px) scale(.8)`},{opacity:1,transform:`${turn} translateX(${travel*.08}px) scale(1)`,offset:.08*edge},{opacity:1,transform:`${turn} translateX(${travel}px) scale(1.05)`,offset:edge},{opacity:0,transform:`${turn} translateX(${travel+50}px) scale(1.1)`}],{duration:duration+out,delay,easing:'linear'});
  for(let i=0;i<3;i++){
    const star=specialFxSprite('sparkle',x,y,38,38),to=travel*(.35+i*.25),drift=(i-1)*height*.3;
    specialFxPlay(star,[{opacity:0,transform:`${turn} translate(0px,0px) scale(.4)`},{opacity:1,transform:`${turn} translate(${to}px,${drift}px) scale(1.1)`,offset:.6},{opacity:0,transform:`${turn} translate(${to+30}px,${drift}px) scale(.3)`}],{duration:duration*(.4+i*.25)+160,delay,easing:'ease-out'});
  }
}
// The sweep of one or two axes; the gems of its band are hit in order of their distance from the origin.
async function specialFxSweep(origin,axes,half,hits,sequence,{kind='bolt',delay=0}={}){
  const F=SPECIAL_FX.bolt,jobs=[];
  for(const axis of axes){
    specialFxBlade(origin,axis,1,half,sequence,{delay});specialFxBlade(origin,axis,-1,half,sequence,{delay});
    const band=hits.filter(t=>axis==='col'?Math.abs(t.c-origin.c)<=half:Math.abs(t.r-origin.r)<=half);
    for(const t of band){const d=axis==='col'?Math.abs(t.r-origin.r):Math.abs(t.c-origin.c);
      // The key dips just before the blade reaches its centre, so it breaks under the blade.
      jobs.push(specialFxPress(t,sequence,kind,delay+Math.max(0,d*F.cell-F.press)));}
  }
  await Promise.all(jobs);
}
// The fire vortex over a (2·radius+1)² area: it turns and closes in on the origin while the gems are drawn toward it.
async function specialFxVortex(origin,radius,hits,sequence,{duration=SPECIAL_FX.bomb.vortex}={}){
  const inside=hits.filter(t=>t!==origin&&Math.abs(t.r-origin.r)<=radius&&Math.abs(t.c-origin.c)<=radius);
  if(reduced)return inside;
  // A round whirlpool of fire (owner 05/11: a floating effect, round rather than square), a little wider than the area.
  const {x,y}=boardV3Point(origin),size=(radius*2+1)*100*1.15,end=Math.min(.18,80/size);
  // Full size over the area for most of its life, then it closes in without a
  // break in its last 150 ms and is gone exactly as the fireball blooms.
  const close=Math.max(.45,1-150/duration);
  specialFxPlay(specialFxSprite('vortex',x,y,size,size),[{opacity:0,transform:'rotate(0deg) scale(.9)'},{opacity:1,transform:'rotate(35deg) scale(1.03)',offset:.14},{opacity:1,transform:`rotate(${Math.round(150*close)}deg) scale(.95)`,offset:close,easing:'cubic-bezier(.55,0,.9,.6)'},{opacity:1,transform:`rotate(225deg) scale(${end})`,offset:.98},{opacity:0,transform:`rotate(230deg) scale(${end*.8})`}],
    {duration,easing:'linear'});
  // Pulled 15% toward the centre at 85% size with a warm tint: still clearly the same gems.
  inside.filter(t=>!sequence.cleared.has(t)&&!sequence.sources.has(t)).forEach(t=>{const dx=(origin.c-t.c)*.15*t.el.offsetWidth,dy=(origin.r-t.r)*.15*t.el.offsetHeight;
    specialFxHold(specialFxArtOf(t),[{transform:'translate(0px,0px) scale(1)',filter:'none'},{transform:`translate(${dx}px,${dy}px) scale(.85)`,filter:'sepia(.45) saturate(1.7) hue-rotate(-12deg) brightness(1.18)'}],{duration,easing:'cubic-bezier(.5,0,.8,.5)'});});
  // The bomb itself shrinks into the eye as the vortex closes.
  specialFxHold(specialFxArtOf(origin),[{transform:'scale(1.12)',filter:'brightness(1.3)'},{transform:'scale(.7)',filter:'brightness(2.2)'}],{duration,easing:'ease-in'});
  await boardV3Pause(duration);
  return inside;
}
// The bang: a drawn fireball blooms over the area, a shockwave ring follows, the gems break and fly outward.
function specialFxFireball(origin,radius,inside,sequence){
  if(!reduced){
    const {x,y}=boardV3Point(origin),size=(radius*2+1)*100*1.05;
    specialFxPlay(specialFxSprite('fireball',x,y,size,size),[{opacity:0,transform:'scale(.3) rotate(0deg)'},{opacity:1,transform:'scale(1.02) rotate(8deg)',offset:.27},{opacity:.85,transform:'scale(1.08) rotate(12deg)',offset:.55},{opacity:0,transform:'scale(1.16) rotate(16deg)'}],{duration:SPECIAL_FX.bomb.blast,easing:'cubic-bezier(.15,.8,.3,1)'});
    specialFxPlay(specialFxSprite('flash',x,y,150,150),[{opacity:0,transform:'scale(.4)'},{opacity:.85,transform:'scale(1)',offset:.4},{opacity:0,transform:'scale(1.2)'}],{duration:50,easing:'ease-out'});
    specialFxPlay(specialFxSprite('blast',x,y,size*1.12,size*1.12),[{opacity:0,transform:'scale(.35)'},{opacity:.9,transform:'scale(.85)',offset:.4},{opacity:0,transform:'scale(1.1)'}],{duration:260,delay:40,easing:'ease-out'});
  }
  for(const t of inside){
    const fresh=!sequence.cleared.has(t)&&!sequence.primed.has(t)&&!sequence.sources.has(t);
    // The fireball covers the area, so its gems only pop (no sparkle burst each): one bright moment, no stalled frame.
    specialFxHit(t,sequence,'bomb','quiet');
    if(fresh&&!reduced){
      // Thrown outward 0.25–0.6 cell from the centre: the tile moves while its gem fades.
      const dx=t.c-origin.c,dy=t.r-origin.r,len=Math.hypot(dx,dy)||1,push=(.25+.35*Math.min(1,len/radius))*t.el.offsetWidth;
      sequence.tails.push(specialFxHold(t.el,[{transform:'translate(0,0)'},{transform:`translate(${dx/len*push}px,${dy/len*push}px)`}],{duration:220,easing:'cubic-bezier(.2,.8,.3,1)'}));
    }
  }
}
// A soft arc from (x0,y0) to (x1,y1), bowed sideways by `bend` × its length: points along it for keyframes, so a piece
// follows the curve on the compositor (owner 05/11: the straight beams looked stiff; "dải cong kiểu chấm sao, tia phép").
function specialFxArc(x0,y0,x1,y1,bend,steps=14){
  const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy)||1,cx=(x0+x1)/2-dy/len*bend*len,cy=(y0+y1)/2+dx/len*bend*len;
  return Array.from({length:steps+1},(_,i)=>{const t=i/steps,u=1-t;return {x:u*u*x0+2*u*t*cx+t*t*x1,y:u*u*y0+2*u*t*cy+t*t*y1,offset:t};});
}
// Rainbow tints for the star wisps (hue turns of the drawn ivory sparkle).
const SPECIAL_FX_HUES=[0,40,90,170,210,270,320];
// A wisp of stars: a bright star in a soft coloured glow flies along the arc from the orb, eight smaller stars trail it
// closely on the same path and fade, so it reads as a flowing ribbon of light (a fairy's flight) rather than a line.
function specialFxWisp(x0,y0,x1,y1,{bend=.3,duration=460,delay=0,hue=0,size=70}={}){
  const arc=specialFxArc(x0,y0,x1,y1,bend),glow=specialFxSprite('glow',x0,y0,size*1.7,size*1.7);
  if(glow){glow.style.filter=`hue-rotate(${hue}deg) saturate(2) brightness(1.2)`;
    specialFxPlay(glow,arc.map(({x,y,offset})=>({transform:`translate(${x-x0}px,${y-y0}px) scale(${.7+Math.sin(offset*Math.PI)*.4})`,opacity:offset===1?0:.75,offset})),{duration,delay,easing:'cubic-bezier(.4,0,.3,1)'});}
  for(let k=0;k<9;k++){
    const side=k?size*(.72-k*.055):size,star=specialFxSprite('sparkle',x0,y0,side,side);if(!star)return;
    star.style.filter=`hue-rotate(${hue+k*10}deg) saturate(2.2) brightness(1.45) drop-shadow(0 0 6px #fff)`;
    specialFxPlay(star,arc.map(({x,y,offset})=>({transform:`translate(${x-x0}px,${y-y0}px) rotate(${offset*300}deg) scale(${k?1-offset*.3:1+Math.sin(offset*Math.PI)*.3})`,opacity:offset===1?0:k?(.95-k*.08):1,offset})),
      {duration:duration+k*16,delay:delay+k*22,easing:'cubic-bezier(.4,0,.3,1)'});
  }
}
// Star wisps from the orb, one after another around it (clockwise from the top) over `span` ms, each flying a soft arc
// over `grow` ms and overlapping the next; onLand(gem) runs as each reaches its gem. Resolves when the last lands.
function specialFxBeams(origin,targets,sequence,{span=SPECIAL_FX.core.span,grow=SPECIAL_FX.core.grow,stay=SPECIAL_FX.core.pull,onLand=null}={}){
  if(!targets.length)return Promise.resolve();
  const {x,y}=boardV3Point(origin),angle=t=>(Math.atan2(t.c-origin.c,origin.r-t.r)+Math.PI*2)%(Math.PI*2);
  const order=targets.slice().sort((a,b)=>angle(a)-angle(b)||Math.hypot(a.r-origin.r,a.c-origin.c)-Math.hypot(b.r-origin.r,b.c-origin.c));
  const gap=order.length>1?span/(order.length-1):0;
  return Promise.all(order.map((t,i)=>{
    const delay=Math.round(i*gap),land=reduced?0:delay+grow;
    // Each arc bows to alternate sides and by a different amount, so the wisps fan out like a flight of fairies.
    t.fxBend=(i%2?1:-1)*(.22+(i*7%5)*.04);
    if(!reduced){
      const p=boardV3Point(t);
      specialFxWisp(x,y,p.x,p.y,{bend:t.fxBend,duration:grow,delay,hue:SPECIAL_FX_HUES[i%SPECIAL_FX_HUES.length]});
      specialFxPlay(specialFxSprite('mark',p.x,p.y,96,96),[{opacity:0,transform:'scale(1.6) rotate(-30deg)'},{opacity:1,transform:'scale(1) rotate(0deg)',offset:.3},{opacity:0,transform:'scale(.6) rotate(30deg)'}],{duration:stay+200,delay:land-60,easing:'ease-out'});
    }
    return boardV3Pause(land).then(()=>onLand?.(t));
  }));
}
// One gem drawn in: a copy glides back along its wisp's arc into the orb (easing in, like being reeled), trailing a few
// stars; the gem breaks where it was.
function specialFxPullOne(origin,t,sequence,pull=SPECIAL_FX.core.pull){
  if(!reduced){
    const {x,y}=boardV3Point(origin),p=boardV3Point(t),copy=specialFxSprite('gem',p.x,p.y,84,84,{src:itemImage(Math.max(0,t.type),null)});
    const arc=specialFxArc(p.x,p.y,x,y,-(t.fxBend||.25));
    specialFxPlay(copy,arc.map(({x:ax,y:ay,offset})=>({transform:`translate(${ax-p.x}px,${ay-p.y}px) scale(${offset<.2?1+offset*.4:1.08-offset*.88})`,opacity:offset===1?0:1,offset})),{duration:pull,easing:'cubic-bezier(.5,0,.75,.4)'});
    specialFxWisp(p.x,p.y,x,y,{bend:-(t.fxBend||.25),duration:pull,delay:60,size:40,hue:SPECIAL_FX_HUES[(t.r+t.c)%SPECIAL_FX_HUES.length]});
  }
  specialFxHit(t,sequence,'core');
}
// A ring wave of prism light opening from a point (a Lõi's burst, each full-board wave).
function specialFxWave(x,y,size,duration){
  specialFxPlay(specialFxSprite('prism-wave',x,y,size,size),[{opacity:0,transform:'scale(.15) rotate(0deg)'},{opacity:1,transform:'scale(.7) rotate(40deg)',offset:.35},{opacity:0,transform:'scale(1.15) rotate(80deg)'}],{duration,easing:'cubic-bezier(.2,.7,.35,1)'});
}
// The parts of a Lõi on the board that move together: the orb and its orbit ring (back and front halves).
const specialFxOrbParts=t=>[...(t?.el?.querySelectorAll('.item-art,.bi-orbit')||[])];
// The item flares before its blast; a Lõi lifts with its orbit ring, which spins faster while it charges.
function specialFxLift(t,duration,kind){
  if(reduced||!t.el)return Promise.resolve();
  if(kind==='core'){
    t.el.classList.add('bi-charging');
    return Promise.all(specialFxOrbParts(t).map(part=>specialFxHold(part,[{transform:'translateY(0) scale(1)',filter:'brightness(1)'},{transform:`translateY(${-specialFxCell(t)*.2}px) scale(1.1)`,filter:'brightness(1.4)'}],{duration,easing:'ease-out'})));
  }
  return specialFxHold(specialFxArtOf(t),[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.12)',filter:'brightness(1.6)'}],{duration,easing:'ease-out'});
}
async function specialFxCoreShrink(t,sequence,{shrink=SPECIAL_FX.core.shrink,wave=420,shake=2}={}){
  const F=SPECIAL_FX.core;
  if(!reduced&&t.el)await Promise.all(specialFxOrbParts(t).map(part=>specialFxHold(part,[{transform:`translateY(${-specialFxCell(t)*.2}px) scale(1.1)`,filter:'brightness(1.4)'},{transform:`translateY(${-specialFxCell(t)*.12}px) scale(.4)`,filter:'brightness(2.6)'}],{duration:shrink,easing:'ease-in'})));
  specialFxSound('core-burst');sequence.tails.push(specialFxShake(shake));specialFxNova(t,'core',sequence);
  // The burst: a large star flash and a ring wave of prism light opening over the orb.
  const {x,y}=boardV3Point(t);
  specialFxPlay(specialFxSprite('flash',x,y,300,300),[{opacity:0,transform:'scale(.3) rotate(0deg)'},{opacity:1,transform:'scale(1) rotate(20deg)',offset:.3},{opacity:0,transform:'scale(1.3) rotate(40deg)'}],{duration:F.nova,easing:'ease-out'});
  specialFxWave(x,y,wave,F.nova+120);
  sequence.detonate(t,'core');
}
// The Lõi's sweep: lift, beams one after another (each gem drawn in as its beam lands), shrink, burst.
async function specialFxCoreSweep(t,hits,sequence,{F=SPECIAL_FX.core,wave=420,shake=2}={}){
  specialFxSound('core-gather');
  // A second swell halfway through the beams, so the long gather is not silent at its end.
  boardV3Pause(F.span*.55).then(()=>specialFxSound('core-gather'));
  await specialFxBeams(t,hits,sequence,{span:F.span,grow:F.grow,stay:F.pull,onLand:g=>specialFxPullOne(t,g,sequence,F.pull)});
  await boardV3Pause(F.pull*.85);
  await specialFxCoreShrink(t,sequence,{shrink:F.shrink,wave,shake});
}
specialEffect = async function specialEffectV5(act,sequence){
  if(!sequence){await boardV3Charge(act,BOARD_V5_PACING.charge);return;}
  const {tails,detonate}=sequence,t=act.tile,T=specialFxRules(),chained=(act.gen||0)>0;
  if(act.kind==='combo'){
    const [x,y]=act.name.split('+');
    await specialFxMerge(act,170,x==='core'||y==='core'?'core':x==='bomb'||y==='bomb'?'bomb':'bolt');
    if(act.turn){
      // Lõi + Sao / Lõi + Bom: beams reach the colour's gems, each turns into the partner kind, then they all fire.
      specialFxSound('core-gather');detonate(t,'combo');if(act.partner)detonate(act.partner,'combo');
      // One beam after another (owner 05/11: "ghép với boom thì nổ cũng cần lần lượt"): each gem turns into the partner
      // kind as its beam lands and fires on its own a moment later, so the blasts follow one another and overlap.
      const F=SPECIAL_FX.turn;
      await specialFxBeams(t,act.turn.tiles,sequence,{span:F.span,grow:F.grow,stay:F.prime,onLand:g=>{g.special=act.turn.kind;g.dir=act.turn.dir;paintTile(g);
        boardV3Pause(F.prime).then(()=>sequence.primed.add(g));}});
      await boardV3Pause(F.prime);
      return;
    }
    const lanes=T.boltMode==='wide'?1:0;
    if(x==='bomb'&&y==='bomb'){
      // Bom + Bom: one 7×7 vortex, then the fireball.
      const r=T.bombRadius+1;specialFxSoundFor('bomb-swirl',SPECIAL_FX.bomb.vortex);
      const inside=await specialFxVortex(t,r,act.hits,sequence,{kind:'combo'});
      specialFxSound('bomb-boom');specialFxNova(t,'bomb',sequence);
      detonate(t,'combo');if(act.partner)detonate(act.partner,'combo');specialFxFireball(t,r,inside,sequence,'combo');tails.push(specialFxShake(3),boardItemRecoil(t,5));
      await boardV3Pause(SPECIAL_FX.bomb.after);
    }else if(x==='bomb'||y==='bomb'){
      // Sao + Bom: the vortex draws in, then two thick blades sweep 5 rows and 5 columns.
      specialFxSoundFor('bomb-swirl',SPECIAL_FX.bomb.vortex*.8);await specialFxVortex(t,lanes+1,act.hits,sequence,{kind:'combo',duration:SPECIAL_FX.bomb.vortex*.8});
      specialFxSound('bomb-boom');specialFxSound('bolt-sweep');tails.push(specialFxShake(3));specialFxNova(t,'combo',sequence);
      detonate(t,'combo');if(act.partner)detonate(act.partner,'combo');
      await specialFxSweep(t,['row','col'],lanes+1,act.hits,sequence,{kind:'combo'});
    }else{
      // Sao + Sao: both axes sweep together.
      specialFxSound('bolt-sweep');tails.push(boardImpactShake(1));specialFxNova(t,'combo',sequence);
      detonate(t,'combo');if(act.partner)detonate(act.partner,'combo');
      await specialFxSweep(t,['row','col'],lanes,act.hits,sequence,{kind:'combo'});
    }
    act.hits.forEach(h=>specialFxHit(h,sequence,'combo'));
    return;
  }
  if(act.fullBoard){
    // Lõi + Lõi, wave n of N (one per special on the board): each wave draws the whole board into a Lõi, the later ones a
    // little quicker and harder.
    const hits=act.hits.filter(g=>g!==t),wave=act.wave||1,W=SPECIAL_FX.wave,F=SPECIAL_FX.core;
    if(wave>1&&t.el&&!t.special){
      // Each later wave starts at another special that was on the board (game.js makeCoreFusionPlan): the gem there turns
      // into a Lõi first, then the wave plays from it (owner 05/11: not stacked on one spot, not a ghost over a gem).
      t.special='core';paintTile(t);await boardV3Pause(W.appear);
    }
    await specialFxLift(t,wave===1?F.lift:W.appear,'core');
    await specialFxCoreSweep(t,hits,sequence,{F:wave===1?F:{...F,...W},wave:1500,shake:Math.min(5,2+wave)});
    return;
  }
  if(act.kind==='bolt'){
    const F=SPECIAL_FX.bolt,half=T.boltMode==='wide'?1:0;
    await specialFxLift(t,chained?SPECIAL_FX.chainCharge:F.charge,'bolt');
    // The 420 ms glissando starts with the blades, so its keys climb while they cross the board.
    specialFxSound('bolt-sweep');tails.push(boardItemRecoil(t,2));if(!chained)specialFxNova(t,'bolt',sequence);
    detonate(t,'bolt');
    await specialFxSweep(t,[act.dir||'row'],half,act.hits.filter(h=>h!==t),sequence);
  }else if(act.kind==='bomb'){
    const F=SPECIAL_FX.bomb,r=T.bombRadius;
    await specialFxLift(t,chained?SPECIAL_FX.chainCharge:F.arm,'bomb');
    const spin=chained?F.vortex*.7:F.vortex;specialFxSoundFor('bomb-swirl',spin);
    const inside=await specialFxVortex(t,r,act.hits,sequence,{duration:spin});
    specialFxSound('bomb-boom');if(!chained)specialFxNova(t,'bomb',sequence);
    detonate(t,'bomb');specialFxFireball(t,r,inside,sequence);tails.push(specialFxShake(3),boardItemRecoil(t,4));
    await boardV3Pause(F.after);
  }else if(act.kind==='core'){
    const F=SPECIAL_FX.core,hits=act.hits.filter(h=>h!==t);
    await specialFxLift(t,chained?SPECIAL_FX.chainCharge:F.lift,'core');
    await specialFxCoreSweep(t,hits,sequence);
  }
  act.hits.forEach(h=>specialFxHit(h,sequence,act.kind));
};
function tileAtOr(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE?board[r][c]:null;}
