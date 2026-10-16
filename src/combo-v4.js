// One combo belongs to one board resolution, including a boss's board turn.
// Every cue is awaited, so input and the next combat action share its lifetime.
let boardComboSession=null;
const BATTLE_V5_PACING=Object.freeze({pauseScale:.3,cueScale:.35/1.5});
const battleBeat=ms=>reduced?Promise.resolve():wait(Math.round(ms*BATTLE_V5_PACING.pauseScale));
function battleCueAnimate(node,frames,options={}){
  const scale=reduced?1:BATTLE_V5_PACING.cueScale;
  return animate(node,frames,{...options,duration:Math.round((options.duration??300)*scale),delay:Math.round((options.delay??0)*scale)});
}
const COMBO_V12_SOFT=Object.freeze({scale:1.65,easing:'cubic-bezier(.42,0,.58,1)'});
function comboSoftAnimate(node,frames,options={}){
  return battleCueAnimate(node,frames,{...options,duration:(options.duration??300)*COMBO_V12_SOFT.scale,delay:(options.delay??0)*COMBO_V12_SOFT.scale,easing:COMBO_V12_SOFT.easing});
}
function comboAnnouncement(cue,chain){
  const fromY=Math.max(65,($('board').clientHeight-58)/2),power=comboPower(chain);
  const type=cue.querySelector('strong'),shake=power*10;
  cue.dataset.shake=shake.toFixed(2);
  // One entrance, one readable hold, one exit. No persistent clone or replay.
  return Promise.all([
    animate(cue,[
      {opacity:0,transform:`translate(-50%,${fromY}px) scale(.64)`},
      {opacity:1,transform:`translate(-50%,${fromY-16}px) scale(1.08)`,offset:.14,easing:'cubic-bezier(.2,.75,.25,1)'},
      {opacity:1,transform:'translate(-50%,-4px) scale(1.025)',offset:.48,easing:'ease-out'},
      {opacity:1,transform:'translate(-50%,0px) scale(1)',offset:.58},
      {opacity:1,transform:'translate(-50%,0px) scale(1)',offset:.82},
      {opacity:0,transform:'translate(-50%,-10px) scale(.97)'}
    ],{duration:620,easing:'linear'}),
    animate(type,[
      {translate:'0px 0px',rotate:'0deg'},
      {translate:`${-shake}px ${shake*.3}px`,rotate:`${-power*2}deg`,offset:.49},
      {translate:`${shake*.8}px ${-shake*.25}px`,rotate:`${power*1.5}deg`,offset:.55},
      {translate:`${-shake*.55}px ${shake*.16}px`,rotate:`${-power}deg`,offset:.61},
      {translate:`${shake*.3}px 0px`,rotate:'0deg',offset:.67},
      {translate:'0px 0px',rotate:'0deg',offset:.74},
      {translate:'0px 0px',rotate:'0deg'}
    ],{duration:620,easing:'ease-out'})
  ]);
}
function resetBoardCombo(){
  document.querySelectorAll('.combo-layer,.combo-transfer,.combo-hero-aura').forEach(e=>e.remove());
  delete $('boardFrame').dataset.comboChain;
  for(const name of ['--combo-accent','--combo-number-size','--combo-color','--combo-glow-size','--combo-halo-size','--combo-glow-mix','--combo-gain','--combo-core','--combo-aura-opacity','--combo-aura-scale'])$('boardFrame').style.removeProperty(name);
  boardComboSession=null;
}
function beginBoardCombo(owner){
  resetBoardCombo();
  boardComboSession={owner,waves:0,total:0};
}
// The count is never clamped. Cosmetic intensity approaches a readable limit.
function comboPower(chain){return 1-Math.exp(-Math.max(0,chain-1)/12);}
function comboColor(chain){return `hsl(${(190+34*Math.log2(Math.max(1,chain)))%360} 96% 72%)`;}
function comboAppearance(frame,chain){
  const power=comboPower(chain);
  frame.style.setProperty('--combo-color',comboColor(chain));
  frame.style.setProperty('--combo-accent',`hsl(${(230+34*Math.log2(Math.max(1,chain)))%360} 98% 62%)`);
  frame.style.setProperty('--combo-glow-size',7+power*24+'px');
  frame.style.setProperty('--combo-halo-size',16+power*32+'px');
  frame.style.setProperty('--combo-gain',String(1+power*.16));
  frame.style.setProperty('--combo-aura-opacity',String(.2+power*.46));
  frame.style.setProperty('--combo-number-size',Math.max(22,44+power*6-Math.max(0,String(chain).length-3)*3)+'px');
}
function comboLayer(){
  let layer=$('boardFrame').querySelector('.combo-layer');
  if(!layer){layer=document.createElement('div');layer.className='combo-layer';layer.setAttribute('aria-hidden','true');$('boardFrame').append(layer);}
  return layer;
}
function comboSound(chain){
  if(!sound)return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const root=440*Math.pow(2,Math.min(chain-2,5)/12);
    [1,1.25,1.5,2].forEach((ratio,i)=>{
      const osc=audioContext.createOscillator(),gain=audioContext.createGain(),at=audioContext.currentTime+i*.13;
      osc.type='sine';osc.frequency.setValueAtTime(root*ratio,at);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.028,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.4);
      osc.connect(gain);gain.connect(audioOutput(audioContext,'effects'));osc.start(at);osc.stop(at+.42);
    });
  }catch{sound=false;updateSettings();}
}

function comboSvgChild(parent,tag,attrs={}){
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);
  parent.append(node);return node;
}
async function comboConstellation(layer,plan,chain,finale=false){
  if(reduced)return;
  const svg=comboSvgChild(layer,'svg',{viewBox:'0 0 800 800','aria-hidden':'true','data-combo-flourish':chain,'data-combo-destination':'badge'});
  svg.classList.add('combo-celestial');
  const color=comboColor(chain),tasks=[];
  // Matched gems feed the COMBO badge. No unrelated lines cross the board.
  const targets=(plan?.targets||[]).filter(t=>t.el?.isConnected).slice(0,8);
  const glow=boardV6Gradient(svg,[['#fff2d1',.8],[color,.35],[color,0]],true);
  for(let i=0;i<targets.length;i++){
    const tile=targets[i],x=tile.c*100+50,y=tile.r*100+50,tx=400,ty=105,mx=(x+tx)/2+(i%2?28:-28),my=(y+ty)/2-30;
    const pickup=comboSvgChild(svg,'g',{'data-combo-pickup':tile.id,'data-source-cell':tile.r+','+tile.c});
    comboSvgChild(pickup,'circle',{r:28,fill:glow});
    comboSvgChild(pickup,'circle',{r:7,fill:boardV3Color(tile),opacity:.85});
    const glint=boardV9Star(pickup,0,0,11,'#fff6dc',{opacity:.8});
    tasks.push(comboSoftAnimate(glint,[{opacity:.2,transform:'rotate(-20deg) scale(.45)'},{opacity:1,transform:'rotate(15deg) scale(1.1)',offset:.45},{opacity:0,transform:'rotate(45deg) scale(.4)'}],{duration:900,delay:80+i*18}));
    const flight=Array.from({length:13},(_,j)=>{
      const p=j/12,q=1-p,px=q*q*x+2*q*p*mx+p*p*tx,py=q*q*y+2*q*p*my+p*p*ty;
      return {transform:`translate(${px}px,${py}px) scale(${1-p*.25})`,opacity:j===0||j===12?0:.8,offset:p};
    });
    tasks.push(comboSoftAnimate(pickup,flight,{duration:900,delay:80+i*18}));
  }
  try{await Promise.all(tasks);}finally{svg.remove();}
}
async function boardComboStart(plan,chain){
  const session=boardComboSession||(boardComboSession={owner:'hero',waves:0,total:0});
  session.waves=chain;session.total+=plan.targets.length;
  $('comboLabel').textContent='Combo ×'+chain;
  if(reduced)return;
  const frame=$('boardFrame'),color=comboColor(chain),layer=comboLayer();
  frame.dataset.comboChain=chain;comboAppearance(frame,chain);
  layer.dataset.intensity=chain;
  if(chain>=2)comboSound(chain);
  const cue=document.createElement('div');cue.className='combo-cue';cue.dataset.comboWave=chain;
  cue.innerHTML=`<strong>COMBO <b>×${chain}</b></strong>`;
  layer.append(cue);
  const jobs=[
    comboConstellation(layer,plan,chain),
    comboAnnouncement(cue,chain)
  ];
  for(const t of plan.targets){
    if(!t.el?.isConnected)continue;
    jobs.push(comboSoftAnimate(t.el.firstElementChild,[{filter:'brightness(1)'},{filter:'brightness(1.12)',boxShadow:`inset 0 0 5px ${color}22`,offset:.5},{filter:'brightness(1)'}],{duration:850}));
  }
  await Promise.all(jobs).finally(()=>cue.remove());
}
async function boardComboSettle(){await battleBeat(420);}
async function finishBoardCombo(){
  const session=boardComboSession;
  if(!session||session.waves<2){await battleBeat(340);return;}
  if(reduced)return;
  const color=comboColor(session.waves);
  // Keep the gem-to-hero transfer, without announcing the final count again.
  {
    const b=$('board').getBoundingClientRect(),a=actor(session.owner).getBoundingClientRect();
    const sx=b.left+b.width*.5,sy=b.top+b.height*.24,tx=a.left+a.width*.5,ty=a.top+a.height*.65;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('combo-transfer');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);svg.setAttribute('aria-hidden','true');document.body.append(svg);
    const trails=[],count=Math.min(42,20+session.waves*4);
    for(let i=0;i<count;i++){
      const bend=(i%7-3)*13,from={x:sx+bend,y:sy+(i%3-1)*6},c1={x:sx+bend*2,y:sy-70},c2={x:tx+bend,y:ty+100},to={x:tx,y:ty};
      const particle=boardV13Particle(svg,boardV4Prism[i%6],i%7===0?4.5:2+i%3*.5);
      particle.setAttribute('data-combo-comet',i);
      trails.push(comboSoftAnimate(particle,boardV13Flight(from,c1,c2,to),{duration:850,delay:i*280/Math.max(1,count-1)}));
    }
    await Promise.all(trails).finally(()=>svg.remove());
    const aura=document.createElement('span');aura.className='combo-hero-aura';aura.style.setProperty('--combo-color',color);
    const scene=$('scene').getBoundingClientRect();aura.style.left=tx-scene.left+'px';aura.style.top=ty-scene.top+'px';$('combatEffects').append(aura);
    await comboSoftAnimate(aura,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},{opacity:.9,transform:'translate(-50%,-50%) scale(1)',offset:.35},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:600}).finally(()=>aura.remove());
  }
}
