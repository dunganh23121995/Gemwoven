const YUKI_GLACIER={armor:25,damage:60};
function prepareYukiGlacierAudio(){
  const context=combatV3AudioContext();if(!context)return;
  for(const kind of ['charge','fall','impact'])decodeCastSound(context,'ice-glacier-'+kind).catch(()=>{});
}
function yukiMeteorShake(impact,pending){
  if(reduced)return;
  const screen=document.querySelector('.app');
  // Move combat and board together. Independent translate preserves layout transforms.
  const points=impact
    ? [[0,0,0],[.045,0,16],[.10,-12,-10],[.17,10,7],[.25,-8,-6],[.34,7,4],[.44,-5,-4],[.55,4,3],[.67,-3,-2],[.80,1.5,1],[1,0,0]]
    : [[0,0,0],[.22,-.5,.4],[.40,.8,-.6],[.56,-1.2,.8],[.69,1.7,-1],[.80,-2.2,1.4],[.90,2.8,-1.8],[1,0,0]];
  pending.push(animate(screen,points.map(([offset,x,y])=>({offset,translate:`${x}px ${y}px`})),{
    duration:impact?850:300,easing:'linear'
  }));
}
// The staff socket is authored in the same 256px coordinate space as each pose.
const YUKI_STAFF_TIPS=[[176,124],[178,123],[179,124],[178,126],[178,124],[177,125]];
function yukiStaffLight(root,pending){
  if(reduced)return {stop(){}};
  const glow=document.createElement('span');glow.className='yuki-staff-light';glow.setAttribute('aria-hidden','true');
  glow.innerHTML='<i></i><b></b>';root.append(glow);let frameId=0;
  const track=()=>{
    if(!glow.isConnected)return;
    const frame=Number(root.querySelector('.sprite-body')?.dataset.frame)||0,p=YUKI_STAFF_TIPS[Math.min(frame,5)];
    glow.style.left=p[0]/256*100+'%';glow.style.top=p[1]/256*100+'%';frameId=requestAnimationFrame(track);
  };track();
  pending.push(animate(glow,[{opacity:0,scale:'.35'},{opacity:.6,scale:'.8',offset:.35},{opacity:1,scale:'1.25',offset:.73},{opacity:.95,scale:'1.05',offset:.85},{opacity:0,scale:'1.6'}],{duration:2300,easing:'ease-in-out'}));
  return {stop(){cancelAnimationFrame(frameId);glow.remove();}};
}
function yukiFallingBoulder(point,pending){
  if(reduced)return {drop(){return Promise.resolve();},shatter(){},remove(){}};
  const size=Math.min(195,$('scene').clientWidth*.52),node=document.createElement('span');
  const start=-size*.88,peek=-size*.68,end=point.foot-size*.88;
  node.className='rage-skyfall yuki-glacier';node.dataset.skyOrigin=String(start);node.dataset.caster='hero';
  node.dataset.phase='summoning';
  node.style.cssText=`left:${point.x}px;top:0;width:${size}px;height:${size}px;transform:translate(-50%,${peek}px);`;
  const rock=document.createElement('img');rock.src=ART.skillFx.yukiBoulder;rock.alt='';rock.draggable=false;node.append(rock);$('combatEffects').append(node);
  const revealed=castTimelineAnimate(node,[
    {transform:`translate(-50%,${start}px)`,opacity:.25},
    {transform:`translate(-50%,${peek-3}px)`,opacity:1,offset:.65},
    {transform:`translate(-50%,${peek}px)`,opacity:1}
  ],{duration:1800,easing:'ease-out'});
  pending.push(revealed);
  return {async drop(){
    await revealed;node.dataset.phase='falling';node.style.transform=`translate(-50%,${end}px)`;
    yukiMeteorShake(false,pending);
    const landed=animate(node,[{transform:`translate(-50%,${peek}px)`},{transform:`translate(-50%,${end}px)`}],{duration:300,easing:'cubic-bezier(.55,.02,.85,.55)'});
    pending.push(landed);await landed;node.dataset.phase='landed';
  },remove(){node.remove();},shatter(){
    node.classList.add('shattering');
    pending.push(animate(rock,[{opacity:1,filter:'brightness(1.25)'},{opacity:.85,filter:'brightness(1.8)',offset:.12},{opacity:0,filter:'brightness(1)',transform:'scale(1.08) translateY(8px)'}],{duration:340,easing:'ease-out'}).finally(()=>node.remove()));
  }};
}
function yukiIceImpact(point,pending){
  if(reduced)return;
  const ground={x:point.x,y:point.foot-12};
  for(let i=0;i<3;i++){
    const mist=combatV3Element('yuki-frost-mist',ground,150+i*32,'',combatV3Palette.ice);
    pending.push(animate(mist,[{opacity:0,transform:'translate(-50%,-50%) scale(.3,.25)'},{opacity:.65,offset:.18},{opacity:0,transform:`translate(-50%,-65%) scale(${1.2+i*.2},.6)`}],{duration:650+i*35,easing:'ease-out'}).finally(()=>mist.remove()));
  }
  // Each fragment reuses the finished ice texture; deterministic motion stays cosmetic.
  for(let i=0;i<16;i++){
    const shard=document.createElement('img'),angle=(i/16)*Math.PI*2,dx=Math.cos(angle)*(40+i%4*16),dy=-22-(i%5)*13;
    shard.src=ART.skillFx.yukiBoulder;shard.alt='';shard.className='yuki-ice-fragment';
    shard.style.cssText=`left:${point.x}px;top:${point.y+20}px;width:${8+i%4*5}px;--shard-tilt:${i*37}deg;`; $('combatEffects').append(shard);
    pending.push(animate(shard,[{opacity:1,transform:'translate(-50%,-50%) scale(.3)'},{opacity:1,transform:`translate(${dx*.55}px,${dy}px) rotate(${i*37+70}deg)`,offset:.43},{opacity:0,transform:`translate(${dx}px,${25+i%3*12}px) rotate(${i*37+150}deg) scale(.4)`}],{duration:550+i%4*35,easing:'ease-out'}).finally(()=>shard.remove()));
  }
}
async function yukiGlacierUltimate(){
  if(state.hp<=0||state.enemyHp<=0)return;
  const start=performance.now(),root=actor('hero'),target=actor('enemy'),oldTarget=target.style.transform,pending=[];
  const at=async ms=>{if(!reduced)await wait(Math.max(0,start+ms-performance.now()));};
  let staff=null,boulder=null,result={amount:0,blocked:0};
  root.dataset.ragePhase='chant';root.classList.add('combat-v3-acting');
  prepareYukiGlacierAudio();
  try{
    const armor=Math.max(0,Math.min(YUKI_GLACIER.armor,999-state.armor));state.armor+=armor;update();
    if(armor)combatV3Number('hero','+'+armor+' GIÁP','armor',0,pending);
    pending.push(selfBuffSpiral('armor',1100));popActorSkill('hero',HEROES.ice.skill,true,pending);
    combatVoice('hero','cast');if(!reduced)playCastSound('ice','glacier-charge',{volume:.48,pan:-.18});
    setSpriteFrame('hero','cast',0);staff=yukiStaffLight(root,pending);
    boulder=yukiFallingBoulder(combatV3Point('enemy'),pending);
    await at(350);setSpriteFrame('hero','cast',1);await at(800);setSpriteFrame('hero','cast',2);
    await at(1250);setSpriteFrame('hero','cast',3);await at(1800);
    root.dataset.ragePhase='skyfall';combatVoice('hero','release');if(!reduced)playCastSound('ice','glacier-fall',{volume:.56,pan:.18});
    setSpriteFrame('hero','cast',4);
    await boulder.drop();root.dataset.ragePhase='impact';
    result=damage('hero',YUKI_GLACIER.damage);if(state.enemyHp>0)state.stunned=true;update();
    boulder.shatter();yukiIceImpact(combatV3Point('enemy'),pending);
    combatVoice('enemy','hurt');playCastSound('ice','glacier-impact',{volume:.68,pan:.24});
    yukiMeteorShake(true,pending);setSpriteAction('enemy','hurt',350);
    combatV3Number('enemy',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',0,pending);
    if(state.enemyHp>0)popActorSkill('enemy','CHOÁNG',false,pending);
    hitAccents('hero',result,false,pending);
    pending.push(animate(target,[{transform:oldTarget||'none'},{transform:'translate(4px,8px) rotate(3deg)',offset:.25},{transform:oldTarget||'none'}],{duration:350,easing:'ease-out'}));
    await at(2500);root.dataset.ragePhase='recover';setSpriteFrame('hero','cast',5);
    await at(3000);await Promise.all(pending);return result;
  }finally{
    await Promise.allSettled(pending);staff?.stop();boulder?.remove();target.style.transform=oldTarget;
    delete root.dataset.ragePhase;root.classList.remove('combat-v3-acting');setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
  }
}
