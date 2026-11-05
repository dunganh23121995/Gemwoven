// Loaded inside the game closure, before its first render.
// A clear has distinct anticipation, impact, and settling phases. Only the
// impact advances the next target; trailing sparks can finish in parallel.
const boardV3Point = t => ({x:t.c*100+50,y:t.r*100+50});
const boardV3Color = t => ['#ff7559','#ff71b0','#b386ff','#65d7ff','#ffd16a'][Math.max(0,t.type)];
const boardV3Pause = ms => reduced ? Promise.resolve() : new Promise(resolve=>setTimeout(resolve,ms));
// Default playback is 1.5x faster again; impacts still resolve in order.
const BOARD_V5_PACING=Object.freeze({
  impact:70,largeImpact:85/1.5,largeClearThreshold:40,charge:250,anticipation:137.5/1.5,
  dissolve:190/1.5,swap:162.5/1.5,fallBase:250/1.5,fallPerRow:7.5,fallMax:350/1.5,
  halo:287.5/1.5,ring:312.5/1.5,branch:275/1.5,shockwave:325/1.5,facet:312.5/1.5,flash:150,
  shard:275/1.5,shardSpread:12.5,targetTail:250/1.5,beamTail:150,primed:162.5/1.5,settle:87.5/1.5,
  creation:{bolt:350/1.5,bomb:250,core:400/1.5}
});
function boardV5ImpactBeat(targetCount){return targetCount>=BOARD_V5_PACING.largeClearThreshold?BOARD_V5_PACING.largeImpact:BOARD_V5_PACING.impact;}
const boardV4Prism=['#ff758e','#ffc66d','#f7ee8a','#80edb4','#77d8ff','#b69aff'];
let boardV4GradientId=0;
function boardV3Group(phase,t,kind=t.special||'normal'){
  return svgNode('g',{'data-board-phase':phase,'data-tile-id':t.id,'data-fx-kind':kind,'data-special-tier':{bolt:4,bomb:5,core:6}[kind]||3});
}
function boardV3Child(parent,tag,attrs){const node=svgNode(tag,attrs);parent.append(node);return node;}
function boardV3Origin(node,x,y){node.style.transformOrigin=x+'px '+y+'px';}
function boardV6Gradient(group,colors,radial=false,coords={}){
  const defs=boardV3Child(group,'defs',{}),id='board-bloom-'+(++boardV4GradientId);
  const gradient=boardV3Child(defs,radial?'radialGradient':'linearGradient',{id,...(radial?{}:{gradientUnits:'userSpaceOnUse',...coords})});
  colors.forEach((color,i)=>boardV3Child(gradient,'stop',{offset:i/(colors.length-1),'stop-color':color[0],'stop-opacity':color[1]}));
  return `url(#${id})`;
}
function boardV6Mote(group,x,y,type,color,index){
  const shapes=[
    `M${x-6} ${y+6}Q${x-4} ${y-8} ${x+7} ${y-8}Q${x} ${y-3} ${x-6} ${y+6}Z`,
    `M${x} ${y+6}C${x-13} ${y-2} ${x-6} ${y-10} ${x} ${y-4}C${x+6} ${y-10} ${x+13} ${y-2} ${x} ${y+6}Z`,
    `M${x} ${y-7}Q${x+2} ${y-2} ${x+5} ${y}Q${x+2} ${y+2} ${x} ${y+7}Q${x-2} ${y+2} ${x-5} ${y}Q${x-2} ${y-2} ${x} ${y-7}Z`,
    `M${x-5} ${y}h10M${x-2.5} ${y-4.3}l5 8.6M${x+2.5} ${y-4.3}l-5 8.6`,
    `M${x} ${y-6}l5 3v6l-5 3-5-3v-6Z`
  ];
  return boardV3Child(group,'path',{d:shapes[Math.max(0,type)],fill:type===3?'none':color,stroke:type===3?color:'none','stroke-width':1.6,'stroke-linecap':'round','data-mote':itemNames[Math.max(0,type)],opacity:index%2?.85:.6});
}

function boardV9Star(parent,x,y,size,color,attrs={}){
  return boardV3Child(parent,'path',{
    d:`M${x} ${y-size}Q${x+size*.18} ${y-size*.18} ${x+size} ${y}Q${x+size*.18} ${y+size*.18} ${x} ${y+size}Q${x-size*.18} ${y+size*.18} ${x-size} ${y}Q${x-size*.18} ${y-size*.18} ${x} ${y-size}Z`,
    fill:color,...attrs
  });
}

// Decorative layers share their parent's lifetime; they never add a match beat
// or consume gameplay randomness. Radial gradients avoid expensive SVG blur.
function boardV9Glitter(parent,x,y,colors,duration,{count=6,radius=57,start=.22,end=1,rotation=0}={}){
  const dust=boardV3Child(parent,'g',{'data-board-glitter':'stardust'}),tasks=[];
  const glow=boardV6Gradient(dust,[['#fff9e8',.85],[colors[0],.25],[colors[0],0]],true);
  for(let i=0;i<count;i++){
    const angle=(i*360/count+rotation+(i%2?9:-6))*Math.PI/180;
    const distance=radius*(.86+(i%3)*.09),sx=x+Math.cos(angle)*distance*start,sy=y+Math.sin(angle)*distance*start;
    const ex=x+Math.cos(angle+.13)*distance*end,ey=y+Math.sin(angle+.13)*distance*end-5;
    const sparkle=boardV3Child(dust,'g',{'data-sparkle':i}),size=(i%3===0?9:5+i%2)*1.7;
    boardV3Child(sparkle,'circle',{cx:0,cy:0,r:size*1.9,fill:glow,opacity:.6});
    boardV9Star(sparkle,0,0,size,i%3===0?'#fff5d5':colors[i%colors.length]);
    boardV9Star(sparkle,0,0,size*.48,'#fffbed');
    const rotate=i%2?22:-22;
    tasks.push(animate(sparkle,[
      {opacity:0,transform:`translate(${sx}px,${sy}px) rotate(${-rotate}deg) scale(.3)`},
      {opacity:.95,transform:`translate(${sx+(ex-sx)*.26}px,${sy+(ey-sy)*.26}px) rotate(0deg) scale(1)`,offset:.25},
      {opacity:.72,transform:`translate(${sx+(ex-sx)*.67}px,${sy+(ey-sy)*.67}px) rotate(${rotate*.6}deg) scale(.65)`,offset:.62},
      {opacity:0,transform:`translate(${ex}px,${ey}px) rotate(${rotate}deg) scale(.2)`}
    ],{duration,easing:'ease-out'}));
    const bead=boardV3Child(dust,'circle',{cx:sx,cy:sy,r:i%2?3:4.5,fill:colors[i%colors.length]});
    tasks.push(animate(bead,[{opacity:0,transform:'translate(0,0)'},{opacity:.8,offset:.2},{opacity:0,transform:`translate(${(ex-sx)*.72}px,${(ey-sy)*.72-8}px)`}],{duration,easing:'ease-out'}));
  }
  return Promise.all(tasks);
}

function boardV9Gleam(parent,x,y,color,duration,radius=38){
  const gleam=boardV3Child(parent,'g',{'data-board-glitter':'halo-lace'}),tasks=[];
  for(let i=0;i<2;i++){
    const arc=boardV3Child(gleam,'path',{
      d:`M${x-radius} ${y}A${radius} ${radius} 0 0 1 ${x} ${y-radius}A${radius} ${radius} 0 0 1 ${x+radius*.82} ${y-radius*.57}`,
      fill:'none',stroke:i?'#fff1c6':color,'stroke-width':i?1:2.2,'stroke-linecap':'round'
    });
    boardV3Origin(arc,x,y);
    tasks.push(animate(arc,[{opacity:0,transform:`rotate(${i*180-20}deg) scale(.8)`},{opacity:i?.65:.55,offset:.22},{opacity:0,transform:`rotate(${i*180+38}deg) scale(1.45)`}],{duration,easing:'ease-out'}));
  }
  return Promise.all(tasks);
}

moveTile = async function moveTileV3(t,fromR,fromC,delay=0,movement='swap'){
  place(t);
  const cell=$('board').clientWidth/SIZE,dx=(fromC-t.c)*cell,dy=(fromR-t.r)*cell;
  if(!dx&&!dy)return;
  const falling=movement==='fall'&&fromC===t.c&&fromR<t.r;
  const duration=falling?Math.min(BOARD_V5_PACING.fallMax,BOARD_V5_PACING.fallBase+Math.abs(fromR-t.r)*BOARD_V5_PACING.fallPerRow):BOARD_V5_PACING.swap;
  await animate(t.el,falling?[
    {transform:`translate(${dx}px,${dy}px)`},
    {transform:'translate(0,5px)',offset:.78},
    {transform:'translate(0,-2px)',offset:.91},
    {transform:'translate(0,0)'}
  ]:[{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{
    duration,delay,
    easing:falling?'cubic-bezier(.32,.05,.52,1)':'cubic-bezier(.4,0,.45,1)',fill:'backwards'
  });
};


boardBurst = async function boardBurstV3(t,color=boardV3Color(t),kind='normal'){
  if(reduced)return;
  const {x,y}=boardV3Point(t),group=boardV3Group('burst',t,kind),tasks=[];
  group.setAttribute('data-dissolve-style','artifact-petals');
  const accent=kind==='core'?'#cbb0ff':kind==='bomb'?'#ffcd89':color;
  const bloom=boardV6Gradient(group,[['#fff8e3',.8],[accent,.35],[accent,0]],true);
  const halo=boardV3Child(group,'circle',{cx:x,cy:y,r:63,fill:bloom});
  boardV3Origin(halo,x,y);
  tasks.push(animate(halo,[{opacity:0,transform:'scale(.5)'},{opacity:.8,transform:'scale(.9)',offset:.2},{opacity:0,transform:'scale(1.35)'}],{duration:BOARD_V5_PACING.halo,easing:'ease-out'}));
  const ring=boardV3Child(group,'circle',{cx:x,cy:y,r:24,fill:'none',stroke:accent,'stroke-width':1.8});
  boardV3Origin(ring,x,y);
  tasks.push(animate(ring,[{opacity:.65,transform:'scale(.8)'},{opacity:0,transform:'scale(2)',strokeWidth:'.5px'}],{duration:BOARD_V5_PACING.ring,easing:'ease-out'}));
  const comboWave=Math.max(1,boardComboSession?.waves||1),comboBoost=Math.min(4,comboWave-1);
  group.setAttribute('data-chain-intensity',comboWave);
  tasks.push(boardV9Gleam(group,x,y,accent,BOARD_V5_PACING.ring,38+comboBoost*3));
  tasks.push(boardV9Glitter(group,x,y,kind==='core'||comboWave>=5?boardV4Prism:[accent,'#ffe8ae','#9beaff','#d3b1ff','#ffb8dd'],BOARD_V5_PACING.ring,{count:kind==='normal'?6+comboBoost*2:10+comboBoost,radius:(kind==='normal'?68:84)+comboBoost*6,rotation:t.r*17+t.c*29}));
  // Four curved petals carry the original artifact art as it opens and fades.
  const defs=boardV3Child(group,'defs',{});
  for(let i=0;i<4;i++){
    const id='board-petal-'+(++boardV4GradientId),clip=boardV3Child(defs,'clipPath',{id,clipPathUnits:'userSpaceOnUse'});
    boardV3Child(clip,'path',{d:`M${x} ${y}Q${x-37} ${y-5} ${x-42} ${y-42}Q${x-5} ${y-37} ${x} ${y}Z`,transform:`rotate(${i*90} ${x} ${y})`});
    const fragment=boardV3Child(group,'g',{'clip-path':`url(#${id})`,'data-art-fragment':i});
    boardV3Child(fragment,'image',{x:x-45,y:y-45,width:90,height:90,href:itemImage(t.type,t.special),preserveAspectRatio:'xMidYMid meet'});
    boardV3Origin(fragment,x,y);
    const angle=(i*90+225)*Math.PI/180,dx=Math.cos(angle)*24,dy=Math.sin(angle)*24;
    tasks.push(animate(fragment,[{opacity:0,transform:'scale(.95)'},{opacity:.75,transform:'scale(1)',offset:.18},{opacity:0,transform:`translate(${dx}px,${dy}px) rotate(${i%2?9:-9}deg) scale(.72)`}],{duration:BOARD_V5_PACING.shard,easing:'cubic-bezier(.2,.65,.3,1)'}));
  }
  if(kind==='bolt'){
    for(let i=0;i<3;i++){
      const arc=boardV3Child(group,'path',{d:`M${x-36} ${y-10}C${x-28} ${y-44} ${x+26} ${y-44} ${x+36} ${y-8}`,fill:'none',stroke:accent,'stroke-width':2,'stroke-linecap':'round'});
      boardV3Origin(arc,x,y);tasks.push(animate(arc,[{opacity:.8,transform:`rotate(${i*120}deg) scale(.75)`},{opacity:0,transform:`rotate(${i*120+35}deg) scale(1.6)`}],{duration:BOARD_V5_PACING.branch,easing:'ease-out'}));
    }
  }else if(kind==='bomb'){
    const shock=boardV3Child(group,'circle',{cx:x,cy:y,r:21,fill:'none',stroke:'#ffe7a5','stroke-width':8});
    boardV3Origin(shock,x,y);tasks.push(animate(shock,[{opacity:.95,transform:'scale(.2)'},{opacity:0,transform:'scale(2.7)'}],{duration:BOARD_V5_PACING.shockwave,easing:'linear'}));
  }else if(kind==='core'){
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,cx=x+Math.cos(a)*26,cy=y+Math.sin(a)*26;
      const facet=boardV3Child(group,'path',{d:`M${cx} ${cy-8}l5 8-5 8-5-8Z`,fill:boardV4Prism[i]});
      boardV3Origin(facet,x,y);tasks.push(animate(facet,[{opacity:1,transform:'scale(.4) rotate(-25deg)'},{opacity:0,transform:'scale(2.1) rotate(35deg)'}],{duration:BOARD_V5_PACING.facet,easing:'linear'}));
    }
  }
  const flash=boardV3Child(group,'path',{d:`M${x} ${y-12}Q${x+2} ${y-2} ${x+12} ${y}Q${x+2} ${y+2} ${x} ${y+12}Q${x-2} ${y+2} ${x-12} ${y}Q${x-2} ${y-2} ${x} ${y-12}Z`,fill:'#fff8e4'});
  boardV3Origin(flash,x,y);
  tasks.push(animate(flash,[{opacity:0,transform:'scale(.3)'},{opacity:.9,transform:'scale(1)',offset:.25},{opacity:0,transform:'scale(.4)'}],{duration:BOARD_V5_PACING.flash,easing:'ease-out'}));
  for(let i=0;i<6;i++){
    const angle=(i*60+22)*Math.PI/180,dist=34+(i%3)*8;
    const shard=boardV6Mote(group,x,y,Math.max(0,t.type),kind==='core'?boardV4Prism[i]:i%3===0?'#fff5cf':accent,i);
    boardV3Origin(shard,x,y);
    tasks.push(animate(shard,[{opacity:0,transform:'translate(0,0) scale(.7)'},{opacity:.9,transform:`translate(${Math.cos(angle)*dist*.3}px,${Math.sin(angle)*dist*.3-2}px) rotate(${i*7}deg) scale(1.45)`,offset:.3},{opacity:0,transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist-8}px) rotate(${i*23}deg) scale(.65)`}],{duration:BOARD_V5_PACING.shard+i%3*BOARD_V5_PACING.shardSpread,easing:'ease-out'}));
  }
  await Promise.all(tasks).finally(()=>group.remove());
};

async function boardV3Charge(act,duration,phase='charge'){
  if(reduced)return;
  const sourceKind=act.kind;
  const t=act.tile,{x,y}=boardV3Point(t),color=act.kind==='bomb'?'#ffba57':act.kind==='core'?'#dba9ff':boardV3Color(t);
  const group=boardV3Group(phase,t,sourceKind),tasks=[];
  group.setAttribute('data-charge-motif',act.kind==='core'?'prismatic-vortex':act.kind==='bomb'?'pressure-rings':'comet-orbit');
  tasks.push(boardV9Glitter(group,x,y,act.kind==='core'?boardV4Prism:[color,'#fff1c6'],duration,{count:act.kind==='core'?12:8,radius:79,start:1,end:.28,rotation:t.r*21+t.c*11}));
  tasks.push(boardV9Gleam(group,x,y,color,duration,52));
  if(act.kind==='core'){
    for(let i=0;i<6;i++){
      const arm=boardV3Child(group,'path',{d:`M${x} ${y-68}C${x+64} ${y-66} ${x+60} ${y+29} ${x+8} ${y+18}C${x-7} ${y+10} ${x-3} ${y+2} ${x} ${y}`,fill:'none',stroke:boardV4Prism[i],'stroke-width':3.5,'stroke-linecap':'round'});
      boardV3Origin(arm,x,y);
      tasks.push(animate(arm,[{opacity:0,transform:`rotate(${i*60-70}deg) scale(1.2)`},{opacity:.95,transform:`rotate(${i*60+20}deg) scale(.95)`,offset:.65},{opacity:0,transform:`rotate(${i*60+105}deg) scale(.32)`}],{duration,easing:'linear'}));
    }
    const star=boardV3Child(group,'path',{d:`M${x} ${y-30}l9 21 21 9-21 9-9 21-9-21-21-9 21-9Z`,fill:'#fff5d5',opacity:.6});
    boardV3Origin(star,x,y);tasks.push(animate(star,[{opacity:0,transform:'scale(.35) rotate(-45deg)'},{opacity:.9,transform:'scale(1.05) rotate(35deg)',offset:.8},{opacity:0,transform:'scale(.5) rotate(90deg)'}],{duration,easing:'linear'}));
  }else if(act.kind==='bomb'){
    for(let i=0;i<3;i++){
      const ring=boardV3Child(group,'circle',{cx:x,cy:y,r:39+i*13,fill:'none',stroke:i===1?'#fff4bb':'#ffad59','stroke-width':i===1?2:4,'stroke-dasharray':i===1?'5 9':'none'});
      boardV3Origin(ring,x,y);tasks.push(animate(ring,[{opacity:0,transform:`scale(${1.1+i*.12}) rotate(0deg)`},{opacity:.9,transform:'scale(.8) rotate(25deg)',offset:.7},{opacity:0,transform:'scale(.3) rotate(45deg)'}],{duration,easing:'linear'}));
    }
    const heat=boardV3Child(group,'circle',{cx:x,cy:y,r:34,fill:color,opacity:.2});
    boardV3Origin(heat,x,y);tasks.push(animate(heat,[{opacity:0,transform:'scale(.6)'},{opacity:.55,transform:'scale(1.35)',offset:.8},{opacity:0,transform:'scale(.7)'}],{duration,easing:'linear'}));
  }else{
    const glow=boardV6Gradient(group,[['#fff5dd',.4],[color,.2],[color,0]],true);
    const aura=boardV3Child(group,'circle',{cx:x,cy:y,r:68,fill:glow});
    boardV3Origin(aura,x,y);tasks.push(animate(aura,[{opacity:0,transform:'scale(1.2)'},{opacity:.85,transform:'scale(.85)',offset:.7},{opacity:0,transform:'scale(.45)'}],{duration,easing:'ease-in-out'}));
    for(let i=0;i<3;i++){
      const orbit=boardV3Child(group,'g',{});
      boardV3Child(orbit,'path',{d:`M${x-48} ${y+6}C${x-60} ${y-26} ${x-8} ${y-53} ${x+30} ${y-33}`,fill:'none',stroke:i===1?'#fff2cc':color,'stroke-width':2,'stroke-linecap':'round'});
      boardV3Child(orbit,'circle',{cx:x+30,cy:y-33,r:3.5,fill:'#fff4d2'});
      boardV3Origin(orbit,x,y);tasks.push(animate(orbit,[{opacity:0,transform:`rotate(${i*120-70}deg) scale(1.2)`},{opacity:.9,transform:`rotate(${i*120+15}deg) scale(.95)`,offset:.65},{opacity:0,transform:`rotate(${i*120+80}deg) scale(.45)`}],{duration,easing:'ease-in-out'}));
    }
  }
  tasks.push(animate(t.el?.firstElementChild,phase==='creation'?[
    {transform:'scale(.65)',opacity:0,filter:'brightness(1.3)'},
    {transform:'scale(1.12)',opacity:1,filter:'brightness(1.2)',offset:.72},
    {transform:'scale(1)',opacity:1,filter:'brightness(1)'}
  ]:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(.95)',filter:'brightness(1.16)',offset:.65},{transform:'scale(1.08)',filter:'brightness(1.3)'}],{duration,easing:'ease-in-out'}));
  await Promise.all(tasks).finally(()=>group.remove());
}


function boardV13Point(from,c1,c2,to,p){
  const q=1-p;
  return {x:q*q*q*from.x+3*q*q*p*c1.x+3*q*p*p*c2.x+p*p*p*to.x,y:q*q*q*from.y+3*q*q*p*c1.y+3*q*p*p*c2.y+p*p*p*to.y};
}
function boardV13Flight(from,c1,c2,to){
  return Array.from({length:17},(_,i)=>{
    const p=i/16,point=boardV13Point(from,c1,c2,to,p);
    return {transform:`translate(${point.x}px,${point.y}px)`,opacity:i===0||i===16?0:.9,offset:p};
  });
}
function boardV13Particle(parent,color,size=5){
  size*=1.8;
  const particle=boardV3Child(parent,'g',{'data-stream-particle':'true'});
  boardV3Child(particle,'circle',{r:size*2.6,fill:color,opacity:.11});
  boardV3Child(particle,'circle',{r:size*1.45,fill:color,opacity:.32});
  boardV3Child(particle,'circle',{r:size*.72,fill:color,opacity:.95});
  boardV3Child(particle,'circle',{r:size*.32,fill:'#fffbed',opacity:1});
  boardV9Star(particle,0,0,size*1.2,'#fff8df',{'data-particle-glint':'true',opacity:.7});
  return particle;
}



clearPlan = async function clearPlanV3(plan,chain,onImpact=()=>{}){
  const focused=document.activeElement,hadFocus=focused?.classList.contains('tile');
  const focusRow=hadFocus?Number(focused.getAttribute('aria-rowindex'))-1:0,focusCol=hadFocus?Number(focused.getAttribute('aria-colindex'))-1:0;
  // A special fires at once: its COMBO intro (about 850 ms) plays alongside the blast instead of before it (owner 05/11).
  // Plain matches keep the intro first, so nothing else changes pace.
  const special=plan.acts.length>0||!!plan.fusion,intro=typeof boardComboStart==='function'?boardComboStart(plan,chain):null;
  // The overlapping intro is never waited on, so the refill is not held back by it; it removes its own cue.
  if(intro&&!special)await intro;else intro?.catch(()=>{});
  // While a special plays, the COMBO cue is small and up out of the blast's way (Codex review 4).
  $('boardFrame')?.classList.toggle('special-playing',special);
  const targets=new Set(plan.targets),cleared=new Set(),sources=new Set(plan.acts.map(a=>a.tile)),primed=new Set(),tails=[];
  const affected=new Set(plan.acts.flatMap(a=>a.hits));
  const beat=boardV5ImpactBeat(targets.size),charge=BOARD_V5_PACING.charge;
  $('comboLabel').textContent=plan.fusion?'Toàn bàn '+plan.fusion.wave+'/'+plan.fusion.total:'Combo ×'+chain;
  let comboShaken=false;
  const detonate=(t,kind='normal')=>{
    if(!targets.has(t)||cleared.has(t))return;
    cleared.add(t);
    boardItemSound(t.type,'normal',chain);
    // A special shakes the board itself (special-fx.js); the combo shake is for plain cascades only.
    if(!comboShaken&&!special&&(chain>=3||targets.size>=12)){comboShaken=true;tails.push(boardImpactShake(chain,true),boardItemRecoil(t,1+comboPower(chain)*4));}
    onImpact(t);
    t.el.dataset.clearing='true';
    const gem=t.el.firstElementChild;
    tails.push(boardBurst(t,boardV3Color(t),kind));
    tails.push(animate(gem,[
      {transform:'scale(1)',opacity:1,filter:'brightness(1)'},
      {transform:'scale(1.06)',opacity:1,filter:'brightness(1.2)',offset:.25},
      {transform:'translateY(-3px) scale(1.1)',opacity:0,filter:'brightness(1.05)'}
    // Held at its end (fill), so a busy frame between the fade and the hide never shows the gem again.
    ],{duration:BOARD_V5_PACING.dissolve,easing:'ease-out',fill:'forwards'}).then(()=>{t.el.style.visibility='hidden';}));
  };
  const ordinary=plan.targets.filter(t=>!sources.has(t)&&!affected.has(t)).sort((a,b)=>a.r-b.r||a.c-b.c);
  if(ordinary.length){
    await Promise.all(ordinary.map(t=>animate(t.el.firstElementChild,[{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.3)',transform:'scale(.94)'}],{duration:BOARD_V5_PACING.anticipation,easing:'ease-in-out'})));
    for(const t of ordinary){detonate(t);await boardV3Pause(beat);}
  }
  // A special inside a blast fires the moment the blast reaches it (owner 06/11: "nằm trong phạm vi bị phá hủy thì khi
  // bị phá cũng kích hoạt luôn, không chờ đến lượt"). The others (the move's own, or one no visible blast reached) never
  // start together: each starts SPECIAL_FX.gap (0.2 s) after the one before it started, and they overlap.
  const sequence={targets,cleared,sources,primed,tails,charge,beat,detonate};
  const started=new Set(),primedAdd=primed.add.bind(primed),byTile=new Map(plan.acts.map(a=>[a.tile,a])),runs=[],waiting=new Map();
  let nextAt=0;
  // join(act) books a start; join(act,true) (a blast reached it) starts it at once, even when it was already booked.
  const join=(act,now=false)=>{
    if(!act)return;
    if(waiting.has(act)){if(now)waiting.get(act)();return;}
    if(started.has(act))return;
    let done,timer=0;const finished=new Promise(r=>done=r);runs.push(finished);
    const fire=()=>{if(started.has(act))return;started.add(act);waiting.delete(act);clearTimeout(timer);
      specialEffect(act,sequence).catch(error=>console.error(error)).finally(done);};
    const t=performance.now(),at=now?t:Math.max(t,nextAt);nextAt=Math.max(nextAt,at+(reduced?0:SPECIAL_FX.gap));
    waiting.set(act,fire);if(at>t)timer=setTimeout(fire,at-t);else fire();};
  primed.add=t=>{const r=primedAdd(t);const act=byTile.get(t);if(act&&(act.gen||0)>0)join(act,true);return r;};
  const drain=async()=>{let n;do{n=runs.length;await Promise.all(runs.slice());}while(runs.length!==n);};
  const gens=[...new Set(plan.acts.map(a=>a.gen||0))].sort((a,b)=>a-b);
  plan.acts.filter(a=>(a.gen||0)===gens[0]).forEach(a=>join(a));
  for(let guard=0;guard<plan.acts.length+1;guard++){
    await drain();
    const next=gens.map(g=>plan.acts.filter(a=>(a.gen||0)===g&&!started.has(a)&&!waiting.has(a))).find(list=>list.length);
    if(!next)break;next.forEach(a=>join(a));
  }
  await drain();
  // Covers any unusual plan while preserving the exactly-once clear rule.
  for(const t of plan.targets)if(!cleared.has(t)){detonate(t);await boardV3Pause(beat);}
  await Promise.all(tails);
  for(const t of plan.targets){if(board[t.r][t.c]===t)board[t.r][t.c]=null;t.el.remove();}
  for(const x of plan.creates){
    x.tile.special=x.kind;x.tile.dir=x.dir;if(x.kind==='core')x.tile.type=-1;paintTile(x.tile);
    await boardV3Charge({tile:x.tile,kind:x.kind},BOARD_V5_PACING.creation[x.kind]||BOARD_V5_PACING.creation.bolt,'creation');
  }
  await boardV3Pause(BOARD_V5_PACING.settle);
  $('boardFrame')?.classList.remove('special-playing');
  await gravity();
  // Between Lõi + Lõi's full-board waves only a short beat (Codex round 5: the 4 waves ran 10–11 s, aim ≤ 8 s).
  if(plan.fusion&&plan.fusion.wave<plan.fusion.total)await boardV3Pause(120);
  else if(typeof boardComboSettle==='function')await boardComboSettle(plan,chain);
  if(hadFocus)focusTile(board[Math.max(0,Math.min(SIZE-1,focusRow))][Math.max(0,Math.min(SIZE-1,focusCol))]);
  else if(!all().some(t=>t.el.tabIndex===0))board[0][0].el.tabIndex=0;
};
