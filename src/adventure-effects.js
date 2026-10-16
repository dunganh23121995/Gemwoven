// Feedback has its own audio randomness and never alters board generation.
let boardShakeAnimation=null,boardSoundAt=-1;
function boardItemSound(type,kind='normal',chain=1){
  const context=combatV3AudioContext();if(!context)return;
  const now=context.currentTime;
  // Bound voices when NO FX resolves many tiles in a single task.
  if(kind==='normal'&&now-boardSoundAt<.025)return;
  boardSoundAt=now;
  if(kind!=='normal'){
    const notes={bolt:[880,1320,1760],bomb:[110,165,220],core:[523,659,784,1047,1568]}[kind]||[660,990];
    notes.forEach((frequency,i)=>combatV3Tone(context,{frequency,end:frequency*(kind==='bomb'?.5:1.01),at:now+i*.055,duration:kind==='core'?.5:.28,volume:.026,type:kind==='bomb'?'triangle':'sine'}));
    combatV3Noise(context,{duration:kind==='bomb'?.38:.2,volume:kind==='bomb'?.06:.025,frequency:kind==='bolt'?4200:kind==='bomb'?500:2600,end:100});
    return;
  }
  const frequencies=[740,523,1047,1568,330],frequency=frequencies[Math.max(0,type)]*(1+Math.min(chain-1,6)*.035);
  combatV3Tone(context,{frequency,end:frequency*(type===0?.65:1.025),duration:type===3?.2:.13,volume:.017,type:type===0||type===4?'triangle':'sine'});
  if(type===0||type===4)combatV3Noise(context,{duration:.065,volume:.012,frequency:type===0?3200:850,end:220});
  else combatV3Tone(context,{frequency:frequency*1.5,at:now+.035,duration:.16,volume:.009});
}
function boardImpactShake(strength=1,combo=false){
  if(reduced)return Promise.resolve();
  boardShakeAnimation?.finish();
  const growth=combo?comboPower(strength):0,power=combo?2+growth*6:Math.min(6,2+strength),frame=$('boardFrame');
  const animation=frame.animate([{transform:'translate(0,0)'},{transform:`translate(${-power}px,${power*.45}px)`,offset:.16},{transform:`translate(${power*.8}px,${-power*.4}px)`,offset:.38},{transform:`translate(${-power*.45}px,${power*.2}px)`,offset:.62},{transform:'translate(0,0)'}],{duration:combo?250+growth*160:230+strength*25,easing:'ease-out'});
  boardShakeAnimation=animation;activeAnimations.add(animation);
  return animation.finished.catch(()=>{}).finally(()=>{activeAnimations.delete(animation);animation.cancel();if(boardShakeAnimation===animation)boardShakeAnimation=null;});
}
const ENCOUNTER_SCENES={
  fire:{name:'Miệng núi tro tàn'},
  earth:{name:'Phế điện rêu phong'},
  ice:{name:'Thánh điện băng nguyệt'},
  lightning:{name:'Đỉnh tháp giông'},
};
function renderEncounterScene(){
  const key=state.enemyKey,land=$('landscape');
  $('scene').dataset.biome=key;
  land.innerHTML=ART.parallax[key].map((src,i)=>`<img class="encounter-scenery parallax-layer" data-depth="${i}" data-speed="${[.18,.52,1][i]}" src="${src}" alt="" draggable="false">`).join('');
  $('scene').dataset.cameraX='0';
  mountSceneAmbience();
  land.classList.toggle('boss-landscape',state.boss);
}
function mountBossGloom(){
  if(!state.boss)return;
  const veil=document.createElement('span');veil.className='boss-gloom';veil.setAttribute('aria-hidden','true');
  veil.innerHTML='<i></i><i></i><i></i><b></b>';
  $('enemyActor').prepend(veil);
}
let stageTransition=false;
async function departVictoriousHero(){
  if(state.key==='shadow')return departShadowHero();
  if(state.key==='lightning')return departLumiHero();
  const hero=actor('hero'),width=$('scene').clientWidth,layers=[...$('landscape').children];
  hero.dataset.departing='true';
  try{
    setSpriteFrame('hero','run',0);await wait(reduced?0:200);
    setSpriteFrame('hero','run',1);await wait(reduced?0:220);
    const start=performance.now(),duration=reduced?1:2400;
    await new Promise(resolve=>{
      function tick(now){
        const p=Math.min(1,(now-start)/duration),camera=width*.95*p;
        hero.style.transform=`translateX(${width*1.65*p-camera}px)`;
        hero.dataset.worldX=String(width*1.65*p);$('scene').dataset.cameraX=String(camera);
        setSpriteFrame('hero','run',2+Math.floor((now-start)/100)%4);
        layers.forEach(layer=>{layer.style.transform=`translateX(${-camera*Number(layer.dataset.speed)}px)`;});
        if(p<1)requestAnimationFrame(tick);else resolve();
      }requestAnimationFrame(tick);
    });
    await animate(hero,[{opacity:1},{opacity:0}],{duration:180});hero.style.opacity='0';
  }finally{delete hero.dataset.departing;delete hero.dataset.worldX;hero.style.transform='';setSpriteAction('hero','idle');}
}
async function previewNextEncounter(initial=false){
  startStage();locked=true;ended=true;updateTurn();actor('hero').style.opacity='0';$('heroHeadHud').style.visibility='hidden';
  const card=document.createElement('div');card.className='encounter-intro';card.setAttribute('role','status');
  card.innerHTML=`<small>${state.boss?'BOSS':'ĐỐI THỦ TIẾP THEO'} · ${String(state.stage).padStart(2,'0')}</small><strong>${state.boss?MONSTERS[state.enemyKey].boss:MONSTERS[state.enemyKey].name}</strong><span>${ENCOUNTER_SCENES[state.enemyKey].name}</span>`;
  $('scene').append(card);$('scene').dataset.preview='true';
  try{
    await animate(card,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)',offset:.23},{opacity:1,offset:.88},{opacity:0}],{duration:1700,easing:'ease-out'});
    if(reduced)await wait(500);
  }finally{card.remove();delete $('scene').dataset.preview;}
  showSelection(initial);
}
function attackChainMultiplier(chain){return 1+Math.min(6,Math.max(0,chain-1))*.15;}
