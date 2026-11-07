/* Redrawn basic-attack hit effects (owner 07/11: "chỉ làm lại hiệu ứng đánh thường" for Mika 1-2, Yuki 1-3, Nori 1-3
 * and Lumi 1; Nori's "mạnh mẽ, không phải cây mọc"). Each is a 4-frame painted strip (assets/fx/heroes/basic, drawn
 * in assets/gemwoven/raw/basic-fx-2611) played on the foe instead of the shared vector cut, ice lance, bolt or the
 * growing roots; the poses, timing and damage of the strike stay as they were. Only the player's hero, never a foe.
 *  - mika1: the katana's arc from behind her head over the top to the strike (her attack sheet's swing);
 *  - mika2: the broadsword chopped down from overhead, the trail bulging toward the foe, a burst where it lands;
 *  - yuki1, yuki2: an ice-lance shatter and a moon-frost burst on the foe;
 *  - yuki3: the fan gust (her six-star attack sheet waves the fan): drawn from her side to the foe, it blooms into
 *    an ice flower on it (the foe sits 75% across the strip);
 *  - nori1-3: the hammer smash's shockwave, rocks (and jade for the star forms) at the foe's feet;
 *  - lumi1orb, lumi1pop: (owner 07/11: "không phù hợp với form 2 và 3") like her higher forms' star and orbit bolts, a
 *    crackling spark orb thrown from her staff that bursts on the foe; no star, no rings (theirs). */
const BASIC_FX={
  fire:{1:'mika1',2:'mika2'},
  ice:{1:'yuki1',2:'yuki2',3:'yuki3'},
  earth:{1:'nori1',2:'nori2',3:'nori3'},
  lightning:{1:'lumi1orb'}
};
// How each strip sits on the foe: its anchor (fraction of the strip cell) on the foe's centre or feet, and its size.
const BASIC_FX_LOOK={
  mika1:{anchor:[.62,.6],on:'centre',size:1.7},
  mika2:{anchor:[.62,.62],on:'centre',size:1.8},
  yuki1:{anchor:[.5,.5],on:'centre',size:1.55},
  yuki2:{anchor:[.5,.5],on:'centre',size:1.6},
  nori1:{anchor:[.5,.85],on:'feet',size:1.85},
  nori2:{anchor:[.5,.85],on:'feet',size:1.95},
  nori3:{anchor:[.5,.86],on:'feet',size:2.1}
};
// Set while an ultimate plays through attack(): its own staging stays.
let basicFxUltimate=false;
const basicFxAttack=attack;
attack=async function(side,raw,options={}){
  const was=basicFxUltimate;basicFxUltimate=!!options?.ultimate;
  try{return await basicFxAttack(side,raw,options);}finally{basicFxUltimate=was;}
};
function basicFxName(side,key){
  if(side!=='hero'||state.key!==key||basicFxUltimate)return null;
  const name=BASIC_FX[key]?.[combatHeroForm(key)];
  return name&&ART.heroFx?.basic?.[name]?name:null;
}
function basicFxNode(name,x,y,width,height){
  const sheet=ART.heroFx.basic[name],node=document.createElement('span');
  node.className='mika-fx basic-fx basic-'+name;node.setAttribute('aria-hidden','true');
  node.style.cssText=`background-image:url('${sheet.src}');background-size:${sheet.count*100}% 100%;left:${x}px;top:${y}px;width:${width}px;height:${height}px;opacity:0;z-index:3`;
  $('combatEffects').append(node);return node;
}
function basicFxFrame(node,sheet,i){node.style.backgroundPosition=`${i/(sheet.count-1)*100}% 0`;}
// Plays the strip: hidden until `delay` ms, then its frames, a short hold on the peak and a fade.
function basicFxPlay(node,sheet,delay,pending,{frames=[0,1,1,2,3],transform=''}={}){
  pending.push((async()=>{
    try{
      await wait(delay);node.style.opacity='1';
      for(const [i,f] of frames.entries()){
        basicFxFrame(node,sheet,f);node.style.transform=`translate(-50%,-50%) ${transform} scale(${1+i*.03})`;
        await wait(sheet.frameDuration);
      }
      await animate(node,[{opacity:1},{opacity:0}],{duration:140,fill:'forwards'});
    }finally{node.remove();}
  })());
}
// The foe's drawn body, measured as Mika's kit measures it (forms-mika.js).
function basicFxPlace(name,origin){
  const sheet=ART.heroFx.basic[name],foe=mikaFoeBody(),scene=$('scene').getBoundingClientRect();
  if(name==='yuki3'){
    // From her fan (just ahead of her) to the foe, which the strip draws 75% across.
    // A quarter smaller than the full span (Codex, owner 07/11: too big), the flower still on the foe.
    const startX=origin.x+origin.width*.22,width=Math.max(120,(foe.x-startX)/.75*.74),height=width*sheet.height/sheet.width;
    return {x:foe.x-.25*width,y:foe.y,width,height};
  }
  // sized on the foe, never smaller than a readable hit on a small foe nor wider than the arena allows
  const look=BASIC_FX_LOOK[name],side=Math.min(Math.max(Math.max(foe.height,foe.width)*look.size,125),260);
  const ax=foe.x,ay=look.on==='feet'?foe.bottom:foe.y;
  return {x:ax+(.5-look.anchor[0])*side,y:ay+(.5-look.anchor[1])*side,width:side,height:side};
}
const basicFxBaseVisual=castAttackVisual;
castAttackVisual=function(side,key,origin,contact,index,pending){
  const name=basicFxName(side,key);
  if(!name)return basicFxBaseVisual(side,key,origin,contact,index,pending);
  if(reduced)return true;
  const contactAt=combatV3Duration(COMBAT_V3_STRIKES[key].contact);
  if(name==='lumi1orb')return basicFxSparkOrb(origin,contactAt,pending),true;
  const sheet=ART.heroFx.basic[name],place=basicFxPlace(name,origin),node=basicFxNode(name,place.x,place.y,place.width,place.height);
  // A cut's trail runs into the contact; a hit bursts on it; the fan gust leaves her fan at once and blooms on contact.
  const cut=name==='mika1'||name==='mika2';
  basicFxPlay(node,sheet,name==='yuki3'?0:Math.max(0,contactAt-(cut?sheet.frameDuration:0)),pending,
    name==='yuki3'?{frames:[0,1,1,2,2,3]}:{});
  return true;
};
// Lumi's one-star bolt: the spark orb flies from her staff to the foe's chest by the contact, then bursts there.
function basicFxSparkOrb(origin,contactAt,pending){
  const orb=ART.heroFx.basic.lumi1orb,pop=ART.heroFx.basic.lumi1pop,foe=mikaFoeBody();
  const from={x:origin.x+origin.width*.28,y:origin.y-origin.height*.12},to={x:foe.x-foe.width*.08,y:foe.top+foe.height*.45};
  const size=Math.min(104,foe.height*.7+30),node=basicFxNode('lumi1orb',from.x,from.y,size,size),angle=Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI;
  node.style.opacity='1';let frame=0;const flicker=setInterval(()=>basicFxFrame(node,orb,frame++%orb.count),orb.frameDuration);basicFxFrame(node,orb,0);
  const flight=Math.max(120,contactAt);
  pending.push(animate(node,[{transform:`translate(-50%,-50%) rotate(${angle}deg) scale(.7)`},{transform:`translate(calc(-50% + ${to.x-from.x}px),calc(-50% + ${to.y-from.y}px)) rotate(${angle}deg) scale(1)`}],
    {duration:flight,easing:'cubic-bezier(.3,.1,.7,1)',fill:'forwards'}).finally(()=>{clearInterval(flicker);node.remove();}));
  const side=Math.min(Math.max(foe.height*1.15,110),190),burst=basicFxNode('lumi1pop',to.x,to.y,side,side);
  basicFxPlay(burst,pop,flight,pending,{frames:[0,1,1,2,3]});
}
// The hammer's ground crater (and Nori's growing roots) after contact, and the shared contact star, give way to the
// redrawn hit.
const basicFxBaseEarth=combatV3Earth;
combatV3Earth=function(point,ultimate,pending){if(!ultimate&&basicFxName('hero','earth'))return;return basicFxBaseEarth(point,ultimate,pending);};
const basicFxBaseImpact=combatV3Impact;
combatV3Impact=function(target,key,direction,strong,pending){
  if(target==='enemy'&&direction>0&&basicFxName('hero',key))return;
  return basicFxBaseImpact(target,key,direction,strong,pending);
};
// Lumi's spark orb is its own flight: no shared streak from her spot to the foe under it.
const basicFxBaseTrail=combatV3AttackTrail;
combatV3AttackTrail=function(sourcePoint,targetPoint,key,direction,...rest){
  if(direction>0&&basicFxName('hero',key)==='lumi1orb')return;
  return basicFxBaseTrail(sourcePoint,targetPoint,key,direction,...rest);
};
