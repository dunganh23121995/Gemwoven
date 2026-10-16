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
// Feathered light retains the established special-match propagation rhythm.
const BOARD_V12_SPREAD=Object.freeze({fade:BOARD_V5_PACING.beamTail,easing:'linear'});
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
function boardV12Feather(parent,deviation){
  const defs=boardV3Child(parent,'defs',{}),id='board-feather-'+(++boardV4GradientId);
  const filter=boardV3Child(defs,'filter',{id,x:'-80%',y:'-80%',width:'260%',height:'260%','color-interpolation-filters':'sRGB'});
  boardV3Child(filter,'feGaussianBlur',{stdDeviation:deviation});
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

function boardSpecialEffectKind(kind){return kind==='bolt'?'bomb':kind==='bomb'?'bolt':kind;}

boardBurst = async function boardBurstV3(t,color=boardV3Color(t),kind='normal'){
  if(reduced)return;
  const {x,y}=boardV3Point(t),group=boardV3Group('burst',t,kind),tasks=[];
  kind=boardSpecialEffectKind(kind);
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
  const sourceKind=act.kind;act={...act,kind:boardSpecialEffectKind(act.kind)};
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

function boardV4TargetMark(act,target,duration,tails){
  if(reduced)return;
  const {x,y}=boardV3Point(target),group=boardV3Group('target-mark',target,act.kind);
  if(act.kind==='core'){
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,b=a+.7;
      boardV3Child(group,'path',{d:`M${x+Math.cos(a)*34} ${y+Math.sin(a)*34}A34 34 0 0 1 ${x+Math.cos(b)*34} ${y+Math.sin(b)*34}`,fill:'none',stroke:boardV4Prism[i],'stroke-width':3});
    }
  }else{
    boardV3Child(group,'circle',{cx:x,cy:y,r:32,fill:'none',stroke:boardV3Color(target),'stroke-width':1.5,opacity:.7});
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;
      boardV3Child(group,'circle',{cx:x+Math.cos(a)*32,cy:y+Math.sin(a)*32,r:2.5,fill:'#fff4d8'});
    }
  }
  boardV3Origin(group,x,y);
  tails.push(animate(group,[{opacity:0,transform:'scale(1.25)'},{opacity:.65,transform:'scale(.95)',offset:.3},{opacity:.7,transform:'scale(.9)',offset:.65},{opacity:0,transform:'scale(1.25)'}],{duration:duration+BOARD_V12_SPREAD.fade,easing:BOARD_V12_SPREAD.easing}).finally(()=>group.remove()));
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
function boardV15Shimmer(particle,duration,delay=0){
  return animate(particle.querySelector('[data-particle-glint]'),[
    {opacity:.15,transform:'rotate(-25deg) scale(.35)'},
    {opacity:1,transform:'rotate(10deg) scale(1.15)',offset:.42},
    {opacity:.55,transform:'rotate(30deg) scale(.7)',offset:.72},
    {opacity:0,transform:'rotate(48deg) scale(.25)'}
  ],{duration,delay,easing:'ease-in-out',fill:'both'});
}
async function boardV3Beam(act,target,duration,tails){
  if(reduced)return;
  const from=boardV3Point(act.tile),to=boardV3Point(target),{x,y}=from,{x:tx,y:ty}=to;
  const group=boardV3Group('beam',target,act.kind),electric=act.kind==='bomb',tailLife=420;
  group.setAttribute('data-travel-ms',duration);group.setAttribute('data-source-id',act.tile.id);
  group.setAttribute('data-connection',electric?'electric-particle-stream':'prismatic-particle-stream');
  boardV4TargetMark(act,target,duration,tails);
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
  const bend=Math.min(electric?65:110,length*.28)*((target.r+target.c)%2?1:-1);
  const c1={x:x+dx*.28+nx*bend,y:y+dy*.28+ny*bend},c2={x:x+dx*.72+nx*bend,y:y+dy*.72+ny*bend};
  const trail=boardV3Child(group,'g',{'data-board-glitter':'particle-trail'});
  for(let i=0;i<14;i++){
    const spread=(i%3-1)*7,offset1={x:c1.x+nx*spread,y:c1.y+ny*spread},offset2={x:c2.x+nx*spread,y:c2.y+ny*spread};
    const color=electric?['#94ddff','#d3b7ff','#b9f5ff'][i%3]:boardV4Prism[i%6];
    const particle=boardV13Particle(trail,color,i%4===0?8:4+i%3);
    tails.push(boardV15Shimmer(particle,220,i*(tailLife-220)/13));
    tails.push(animate(particle,boardV13Flight(from,offset1,offset2,to),{duration:220,delay:i*(tailLife-220)/13,easing:'linear',fill:'backwards'}));
  }
  // A drifting wake outlives each passing particle within the existing tail beat.
  const wake=boardV3Child(group,'g',{'data-board-glitter':'star-wake'});
  const wakeGlow=boardV6Gradient(wake,[['#fffbed',.6],['#b9caff',.2],['#b9caff',0]],true);
  for(let i=0;i<10;i++){
    const p=(i+1)/11,point=boardV13Point(from,c1,c2,to,p),side=i%2?1:-1;
    const drift=26+i%4*11,ex=point.x+nx*drift*side+dx/length*(i%3-1)*10,ey=point.y+ny*drift*side+14+i%3*6;
    const star=boardV3Child(wake,'g',{'data-wake-star':i}),color=i%3===0?'#fff6cf':boardV4Prism[(i+target.c)%6];
    boardV3Child(star,'circle',{r:22,fill:wakeGlow});
    boardV9Star(star,0,0,8+i%3*2,color);boardV9Star(star,0,0,3.5,'#fffbed');
    tails.push(animate(star,[
      {opacity:0,transform:`translate(${point.x}px,${point.y}px) rotate(-15deg) scale(.3)`},
      {opacity:.95,transform:`translate(${point.x+(ex-point.x)*.2}px,${point.y+(ey-point.y)*.2}px) rotate(5deg) scale(1.1)`,offset:.2},
      {opacity:.7,transform:`translate(${point.x+(ex-point.x)*.75}px,${point.y+(ey-point.y)*.75}px) rotate(32deg) scale(.75)`,offset:.65},
      {opacity:0,transform:`translate(${ex}px,${ey}px) rotate(55deg) scale(.2)`}
    ],{duration:400,delay:duration*p,easing:'ease-out',fill:'both'}));
  }
  if(electric){
    const channel=boardV3Child(group,'g',{'data-electric-channel':'continuous'});
    const shapes=Array.from({length:9},(_,phase)=>{
      let d='';
      for(let i=0;i<=16;i++){
        const p=i/16,point=boardV13Point(from,c1,c2,to,p),jitter=Math.sin(i*2.1+phase*1.7)*Math.sin(p*Math.PI)*9;
        d+=(i?'L':'M')+(point.x+nx*jitter)+' '+(point.y+ny*jitter)+' ';
      }
      return d.trim();
    });
    const halo=boardV3Child(channel,'path',{d:shapes[0],fill:'none',stroke:'#89cfff','stroke-width':11,opacity:.34,'stroke-linecap':'round','stroke-linejoin':'round',filter:boardV12Feather(group,2)});
    const core=boardV3Child(channel,'path',{d:shapes[0],fill:'none',stroke:'#c2f4ff','stroke-width':3.2,opacity:.95,'stroke-linecap':'round','stroke-linejoin':'round'});
    const filament=boardV3Child(channel,'path',{d:shapes[0],fill:'none',stroke:'#fffbed','stroke-width':1,opacity:.95,'stroke-linecap':'round','stroke-linejoin':'round'});
    for(const [path,opacity]of [[halo,.34],[core,.95],[filament,.95]])tails.push(animate(path,shapes.map(d=>({d:`path("${d}")`,opacity})),{duration:duration+tailLife,easing:'linear'}));
  }
  const head=boardV13Particle(group,electric?'#c2f1ff':boardV3Color(target),9);
  tails.push(boardV15Shimmer(head,duration+tailLife));
  head.setAttribute('data-comet-head','true');
  const flight=boardV13Flight(from,c1,c2,to);flight[flight.length-1].opacity=1;
  await animate(head,flight,{duration,easing:'linear',fill:'forwards'});
  head.setAttribute('transform',`translate(${tx} ${ty})`);
  group.setAttribute('data-arrived','true');
  tails.push(animate(group,[{opacity:1},{opacity:.8,offset:.45},{opacity:0}],{duration:tailLife,easing:'ease-in-out'}).finally(()=>group.remove()));
}

function boardV3BombWave(act,radius,duration,tails){
  if(reduced)return;
  const {x,y}=boardV3Point(act.tile),group=boardV3Group('blast-wave',act.tile,act.kind);
  const palette=act.fullBoard?boardV4Prism:['#ffe5a5','#ffbb79','#fff4d9'],color=palette[radius%palette.length];
  group.setAttribute('data-blast-radius',radius);
  if(act.fullBoard)group.setAttribute('data-full-board','true');
  const feather=boardV12Feather(group,2);
  const ring=boardV3Child(group,'circle',{cx:x,cy:y,r:radius*100+30,fill:'none',stroke:color,'stroke-width':7,filter:feather,opacity:.6});
  const inner=boardV3Child(group,'circle',{cx:x,cy:y,r:radius*100+13,fill:'none',stroke:'#fff0cd','stroke-width':1.5,opacity:.4});
  const bandGradient=boardV6Gradient(group,[[color,0],[color,0],[color,.04],[color,.23],[color,0]],true);
  const band=boardV3Child(group,'circle',{cx:x,cy:y,r:radius*100+45,fill:bandGradient,'data-board-glitter':'aurora-wave'});
  boardV3Origin(ring,x,y);
  boardV3Origin(inner,x,y);
  boardV3Origin(band,x,y);
  tails.push(Promise.all([
    animate(ring,[{opacity:0,transform:'scale(.65)',strokeWidth:'10px'},{opacity:.65,offset:.2},{opacity:0,transform:'scale(1.12)',strokeWidth:'1px'}],{duration,easing:BOARD_V12_SPREAD.easing}),
    animate(inner,[{opacity:0,transform:'scale(.65)'},{opacity:.5,offset:.2},{opacity:0,transform:'scale(1.13)'}],{duration,easing:BOARD_V12_SPREAD.easing}),
    animate(band,[{opacity:0,transform:'scale(.65)'},{opacity:.65,offset:.3},{opacity:0,transform:'scale(1.15)'}],{duration,easing:BOARD_V12_SPREAD.easing}),
    boardV9Glitter(group,x,y,palette,duration,{count:12,radius:radius*100+24,start:.76,end:1.1,rotation:radius*13})
  ]).finally(()=>group.remove()));
}

specialEffect = async function specialEffectV3(act,sequence){
  // Keeping this callable without a clear context is useful for previews.
  if(!sequence){await boardV3Charge(act,BOARD_V5_PACING.charge);return;}
  const {targets,cleared,sources,primed,tails,charge,beat,detonate}=sequence;
  await boardV3Charge(act,charge);
  const effectKind=boardSpecialEffectKind(act.kind);
  boardItemSound(act.tile.type,effectKind);tails.push(boardImpactShake({bolt:2,bomb:4,core:5}[effectKind]||2));
  tails.push(boardItemRecoil(act.tile,{bolt:2,bomb:4,core:5}[effectKind]||2),specialStarNova(act.tile,effectKind));
  detonate(act.tile,act.kind);
  await boardV3Pause(beat);
  const hits=act.hits.filter(t=>t!==act.tile&&targets.has(t)&&!cleared.has(t)&&!primed.has(t));
  const distance=t=>Math.max(Math.abs(t.r-act.tile.r),Math.abs(t.c-act.tile.c));
  hits.sort((a,b)=>distance(a)-distance(b)||a.r-b.r||a.c-b.c);
  if(act.fullBoard){
    // A full-board blast travels in visible rings, then gravity refills all
    // cells before the next blast. No hidden instant duplicate clears.
    const rings=[...new Set(hits.map(distance))];
    for(const ring of rings){
      boardV3BombWave(act,ring,BOARD_V5_PACING.shockwave,tails);
      await boardV3Pause(110);
      for(const t of hits)if(distance(t)===ring)detonate(t,'core');
    }
    return;
  }
  let previousRing=-1;
  for(const t of hits){
    if(cleared.has(t))continue;
    if(act.kind==='bolt'){
      const ring=distance(t);
      if(ring!==previousRing){boardV3BombWave(act,ring,BOARD_V5_PACING.shockwave,tails);previousRing=ring;}
      await boardV3Pause(beat*.7);
    }else await boardV3Beam(act,t,beat*.7,tails);
    if(sources.has(t)){
      primed.add(t);
      // A chained special remains on the board until it gets its own charge.
      tails.push(animate(t.el.firstElementChild,[{filter:'brightness(1)'},{filter:'brightness(2)',offset:.35},{filter:'brightness(1)'}],{duration:BOARD_V5_PACING.primed,easing:'linear'}));
    }else detonate(t,act.kind);
    await boardV3Pause(beat*.3);
  }
};

clearPlan = async function clearPlanV3(plan,chain,onImpact=()=>{}){
  const focused=document.activeElement,hadFocus=focused?.classList.contains('tile');
  const focusRow=hadFocus?Number(focused.getAttribute('aria-rowindex'))-1:0,focusCol=hadFocus?Number(focused.getAttribute('aria-colindex'))-1:0;
  if(typeof boardComboStart==='function')await boardComboStart(plan,chain);
  const targets=new Set(plan.targets),cleared=new Set(),sources=new Set(plan.acts.map(a=>a.tile)),primed=new Set(),tails=[];
  const affected=new Set(plan.acts.flatMap(a=>a.hits));
  const beat=boardV5ImpactBeat(targets.size),charge=BOARD_V5_PACING.charge;
  $('comboLabel').textContent=plan.fusion?'Toàn bàn '+plan.fusion.wave+'/'+plan.fusion.total:'Combo ×'+chain;
  let comboShaken=false;
  const detonate=(t,kind='normal')=>{
    if(!targets.has(t)||cleared.has(t))return;
    cleared.add(t);
    boardItemSound(t.type,'normal',chain);
    if(!comboShaken&&(chain>=3||targets.size>=12)){comboShaken=true;tails.push(boardImpactShake(chain,true),boardItemRecoil(t,1+comboPower(chain)*4));}
    onImpact(t);
    t.el.dataset.clearing='true';
    const gem=t.el.firstElementChild;
    tails.push(boardBurst(t,boardV3Color(t),kind));
    tails.push(animate(gem,[
      {transform:'scale(1)',opacity:1,filter:'brightness(1)'},
      {transform:'scale(1.06)',opacity:1,filter:'brightness(1.2)',offset:.25},
      {transform:'translateY(-3px) scale(1.1)',opacity:0,filter:'brightness(1.05)'}
    ],{duration:BOARD_V5_PACING.dissolve,easing:'ease-out'}).then(()=>{t.el.style.visibility='hidden';}));
  };
  const ordinary=plan.targets.filter(t=>!sources.has(t)&&!affected.has(t)).sort((a,b)=>a.r-b.r||a.c-b.c);
  if(ordinary.length){
    await Promise.all(ordinary.map(t=>animate(t.el.firstElementChild,[{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.3)',transform:'scale(.94)'}],{duration:BOARD_V5_PACING.anticipation,easing:'ease-in-out'})));
    for(const t of ordinary){detonate(t);await boardV3Pause(beat);}
  }
  const sequence={targets,cleared,sources,primed,tails,charge,beat,detonate};
  for(const act of plan.acts)await specialEffect(act,sequence);
  // Covers any unusual plan while preserving the exactly-once clear rule.
  for(const t of plan.targets)if(!cleared.has(t)){detonate(t);await boardV3Pause(beat);}
  await Promise.all(tails);
  for(const t of plan.targets){if(board[t.r][t.c]===t)board[t.r][t.c]=null;t.el.remove();}
  for(const x of plan.creates){
    x.tile.special=x.kind;if(x.kind==='core')x.tile.type=-1;paintTile(x.tile);
    await boardV3Charge({tile:x.tile,kind:x.kind},BOARD_V5_PACING.creation[x.kind]||BOARD_V5_PACING.creation.bolt,'creation');
  }
  await boardV3Pause(BOARD_V5_PACING.settle);
  await gravity();
  if(typeof boardComboSettle==='function')await boardComboSettle(plan,chain);
  if(hadFocus)focusTile(board[Math.max(0,Math.min(SIZE-1,focusRow))][Math.max(0,Math.min(SIZE-1,focusCol))]);
  else if(!all().some(t=>t.el.tabIndex===0))board[0][0].el.tabIndex=0;
};
