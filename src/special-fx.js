// Special gem FX v2 (owner 05/11: "đẹp hơn, lung linh hơn, xịn hơn"; Claude + Codex spec and reviews in
// assets/gemwoven/raw/board-specials/). Each kind shows what it clears: a Sao băng sweeps its 3-lane band from the centre
// out, a Bom blooms over its 5×5, a Lõi marks every gem of its colour and gathers them in three beats, a combo pulls the
// two specials together first. Drawn pieces (ART.specialFx) move as whole images plus a few particles; without them the
// same motions use plain SVG shapes. One star nova per clear, so the drawn light stays the brightest thing on the board.
// Reduced motion keeps only the result.
const SPECIAL_FX=Object.freeze({
  bolt:{charge:90,sweep:180,after:140},
  bomb:{charge:80,bloom:110,after:90},
  core:{charge:140,beats:3,gap:85,hold:170,after:150},
  combo:{charge:170,blast:420,after:180,preview:80,offset:45},
  chainCharge:40,stagger:50,
  colors:{bolt:'#63dfff',bomb:'#ffb34d',ivory:'#fff6da'}
});
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
boardBurst=function(t,color,kind){return kind==='mass'?specialFxMassBurst(t,color):specialFxBaseBurst(t,color,kind);};
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
  await Promise.all(tasks).finally(()=>group.remove());
}
function specialFxHit(t,sequence,kind){
  const {targets,cleared,sources,primed,tails,detonate}=sequence;
  if(!targets.has(t)||cleared.has(t)||primed.has(t))return;
  if(sources.has(t)){
    // A special the blast reaches waits, lit, for its own generation.
    primed.add(t);
    tails.push(fxAnimate(t.el.firstElementChild,[{filter:'brightness(1)'},{filter:'brightness(2.1)',offset:.35},{filter:'brightness(1.4)'}],{duration:BOARD_V5_PACING.primed,easing:'linear',fill:'forwards'}));
  }else detonate(t,'mass');
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
  sequence.tails.push(Promise.all(tasks).finally(()=>group.remove()));
}
// One lane of light across a row or column, opening from the origin to both ends; gems pop as the light reaches them.
function specialFxLane(origin,dir,hits,sequence,{duration=SPECIAL_FX.bolt.sweep,thick=84,color=SPECIAL_FX.colors.bolt,kind='bolt',heads=true,delay=0,dim=heads?1:.55}={}){
  const {x,y}=boardV3Point(origin),line=hits.filter(t=>dir==='col'?t.c===origin.c:t.r===origin.r);
  const distance=t=>dir==='col'?Math.abs(t.r-origin.r):Math.abs(t.c-origin.c);
  const pops=line.map(t=>boardV3Pause(delay+distance(t)/7*duration).then(()=>specialFxHit(t,sequence,kind)));
  if(reduced)return Promise.all(pops);
  const group=boardV3Group('sweep',origin,kind),tasks=[];
  group.setAttribute('data-sweep-axis',dir);
  // Drawn as a horizontal band through the origin; a column is the same band turned 90° about the origin.
  const along=dir==='col',start=along?y:x,lane=boardV3Child(group,'g',{...(along?{transform:`rotate(90 ${x} ${y})`}:{}),opacity:dim});
  const left=x-start,right=left+800;
  const beam=specialFxImage(lane,'beam',(left+right)/2,y,800,thick,{style:'mix-blend-mode:screen'})
    ||boardV3Child(lane,'rect',{x:left,y:y-thick/2,width:800,height:thick,fill:boardV6Gradient(lane,[[color,0],[color,.55],[SPECIAL_FX.colors.ivory,1],[color,.55],[color,0]],false,{x1:0,y1:y-thick/2,x2:0,y2:y+thick/2})});
  boardV3Origin(beam,x,y);
  tasks.push(fxAnimate(beam,[{opacity:0,transform:'scaleX(0) scaleY(1)'},{opacity:1,transform:'scaleX(1) scaleY(1.05)',offset:.5},{opacity:.8,transform:'scaleX(1) scaleY(.8)',offset:.75},{opacity:0,transform:'scaleX(1) scaleY(.25)'}],{duration:duration+SPECIAL_FX.bolt.after,delay,easing:'cubic-bezier(.2,.7,.3,1)',fill:'backwards'}));
  if(heads)for(const sign of [-1,1]){
    // A comet head flies to each end, four large sparkles ride its wake and fade behind it.
    const travel=sign<0?left-x:right-x,flip=sign<0?' scaleX(-1)':'';
    const head=specialFxImage(lane,'head',x,y,143,67,{style:'mix-blend-mode:screen'})||boardV3Child(lane,'circle',{cx:x,cy:y,r:16,fill:SPECIAL_FX.colors.ivory});
    boardV3Origin(head,x,y);
    tasks.push(fxAnimate(head,[{opacity:0,transform:`translate(0px,0px)${flip} scale(.6)`},{opacity:1,offset:.12},{opacity:.95,transform:`translate(${travel}px,0px)${flip} scale(1.1)`,offset:.85},{opacity:0,transform:`translate(${travel}px,0px)${flip} scale(.7)`}],{duration:duration+60,delay,easing:'cubic-bezier(.3,.6,.4,1)',fill:'backwards'}));
    for(let i=0;i<4;i++){
      const star=specialFxImage(lane,'sparkle',x,y,40,40,{style:'mix-blend-mode:screen'})||boardV9Star(lane,x,y,9,'#fff4cf');
      boardV3Origin(star,x,y);const at=travel*(.3+i*.18),drift=(i%2?1:-1)*(10+i*4);
      tasks.push(fxAnimate(star,[{opacity:0,transform:'translate(0px,0px) scale(.4)'},{opacity:1,transform:`translate(${at}px,${drift}px) scale(1.1)`,offset:.55},{opacity:0,transform:`translate(${at}px,${drift*1.5}px) scale(.3)`}],{duration:duration+150,delay:delay+i*22,easing:'ease-out',fill:'backwards'}));
    }
  }
  sequence.tails.push(Promise.all(tasks).finally(()=>group.remove()));
  return Promise.all(pops);
}
// A Sao's band: its own lane bright with comet heads, the lanes beside it a softer beam (3 lanes in the shipped tuning).
function specialFxSweep(origin,dir,hits,sequence,{lanes=specialFxRules().boltMode==='wide'?1:0,duration=SPECIAL_FX.bolt.sweep,kind='bolt',delay=0}={}){
  const jobs=[];
  for(let d=-lanes;d<=lanes;d++){
    const o=dir==='col'?tileAtOr(origin.r,origin.c+d):tileAtOr(origin.r+d,origin.c);if(!o)continue;
    // Codex review 5: outer lanes fall off (1, .5, .3) so a wide combo reads as one beam, not a grid.
    jobs.push(specialFxLane(o,dir,hits,sequence,{duration,kind,delay,thick:d?62:96,heads:!d,dim:[1,.5,.3][Math.min(2,Math.abs(d))]}));
  }
  return Promise.all(jobs);
}
// A square bloom over the cells (radius 2 = 5×5); every gem inside pops together, shards fly out.
function specialFxBloom(origin,radius,hits,sequence,{duration=SPECIAL_FX.bomb.bloom,kind='bomb'}={}){
  const inside=hits.filter(t=>Math.abs(t.r-origin.r)<=radius&&Math.abs(t.c-origin.c)<=radius);
  const pop=boardV3Pause(duration*.45).then(()=>inside.forEach(t=>specialFxHit(t,sequence,kind)));
  if(reduced)return pop;
  const {x,y}=boardV3Point(origin),size=(radius*2+1)*100,group=boardV3Group('bloom',origin,kind),tasks=[];
  group.setAttribute('data-bloom-radius',radius);
  const ring=specialFxImage(group,'blast',x,y,size*1.15,size*1.15,{style:'mix-blend-mode:screen'})
    ||boardV3Child(group,'circle',{cx:x,cy:y,r:size*.5,fill:'none',stroke:SPECIAL_FX.colors.bomb,'stroke-width':18});
  boardV3Origin(ring,x,y);
  tasks.push(fxAnimate(ring,[{opacity:0,transform:'scale(.15) rotate(-14deg)'},{opacity:1,transform:'scale(.92) rotate(0deg)',offset:.45},{opacity:.6,transform:'scale(1.02) rotate(4deg)',offset:.75},{opacity:0,transform:'scale(1.1) rotate(8deg)'}],{duration:duration+SPECIAL_FX.bomb.after+180,easing:'cubic-bezier(.15,.8,.3,1)',fill:'forwards'}));
  // A small ivory core (under one cell) so the gems and the ring keep their colour.
  const core=specialFxImage(group,'flash',x,y,70,70,{style:'mix-blend-mode:screen',opacity:.55})||boardV3Child(group,'circle',{cx:x,cy:y,r:30,fill:SPECIAL_FX.colors.ivory,opacity:.6});
  boardV3Origin(core,x,y);
  tasks.push(fxAnimate(core,[{opacity:0,transform:'scale(.3) rotate(0deg)'},{opacity:.7,transform:'scale(1) rotate(20deg)',offset:.3},{opacity:0,transform:'scale(1.2) rotate(35deg)'}],{duration:duration+140,easing:'ease-out',fill:'forwards'}));
  const count=10+radius*4;
  for(let i=0;i<count;i++){
    const angle=(i/count)*Math.PI*2+radius*.3,dist=size*.45+(i%3)*18;
    const shard=specialFxImage(group,'shard',x,y,34,45)||boardV6Mote(group,x,y,Math.max(0,origin.type),i%2?SPECIAL_FX.colors.bomb:'#fff2c8',i);
    boardV3Origin(shard,x,y);
    tasks.push(fxAnimate(shard,[{opacity:0,transform:'translate(0px,0px) rotate(0deg) scale(.5)'},{opacity:1,offset:.22},{opacity:0,transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) rotate(${i*40}deg) scale(.85)`}],{duration:duration+300,easing:'cubic-bezier(.2,.7,.35,1)',fill:'forwards'}));
  }
  sequence.tails.push(Promise.all(tasks).finally(()=>group.remove()));
  return pop;
}
function specialFxMark(t,sequence,duration){
  const {x,y}=boardV3Point(t),group=boardV3Group('core-mark',t,'core');
  const mark=specialFxImage(group,'mark',x,y,108,108,{style:'mix-blend-mode:screen'})
    ||boardV3Child(group,'circle',{cx:x,cy:y,r:38,fill:'none',stroke:boardV3Color(t),'stroke-width':3});
  boardV3Origin(mark,x,y);
  sequence.tails.push(fxAnimate(mark,[{opacity:0,transform:'scale(1.4) rotate(-30deg)'},{opacity:1,transform:'scale(1) rotate(0deg)',offset:.3},{opacity:1,transform:'scale(.96) rotate(20deg)',offset:.75},{opacity:0,transform:'scale(.6) rotate(40deg)'}],{duration:duration+140,easing:'ease-out',fill:'forwards'}).finally(()=>group.remove()));
}
function specialFxRing(t,sequence,{size=280,duration=520,spin=240}={}){
  if(reduced)return;
  const {x,y}=boardV3Point(t),group=boardV3Group('core-ring',t,'core');
  const ring=specialFxImage(group,'ring',x,y,size,size,{style:'mix-blend-mode:screen'});
  if(!ring){group.remove();return;}
  boardV3Origin(ring,x,y);
  sequence.tails.push(fxAnimate(ring,[{opacity:0,transform:'scale(.3) rotate(0deg)'},{opacity:1,transform:`scale(1) rotate(${spin/2}deg)`,offset:.4},{opacity:0,transform:`scale(1.5) rotate(${spin}deg)`}],{duration,easing:'ease-out'}).finally(()=>group.remove()));
}
// The Lõi marks every gem of its colour, holds a beat, then gathers them in three beats (nearest first).
async function specialFxGather(act,sequence){
  const hits=act.hits.filter(t=>t!==act.tile),distance=t=>Math.max(Math.abs(t.r-act.tile.r),Math.abs(t.c-act.tile.c));
  hits.sort((a,b)=>distance(a)-distance(b)||a.r-b.r||a.c-b.c);
  const F=SPECIAL_FX.core;
  if(!reduced){specialFxRing(act.tile,sequence,{duration:F.hold+F.beats*F.gap+F.after+200,fill:'forwards'});hits.slice(0,24).forEach(t=>specialFxMark(t,sequence,F.hold+F.beats*F.gap));}
  await boardV3Pause(F.hold);
  const per=Math.ceil(hits.length/F.beats);
  for(let b=0;b<F.beats;b++){hits.slice(b*per,(b+1)*per).forEach(t=>specialFxHit(t,sequence,'core'));await boardV3Pause(F.gap);}
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
// Faint lanes show where a combo will sweep, a beat before it fires.
function specialFxPreview(t,lanes,sequence){
  if(reduced)return;
  const group=boardV3Group('combo-preview',t,'combo'),tasks=[];
  for(let d=-lanes;d<=lanes;d++)for(const dir of ['row','col']){
    const r=dir==='row'?t.r+d:null,c=dir==='col'?t.c+d:null;if(r!=null&&(r<0||r>=SIZE)||c!=null&&(c<0||c>=SIZE))continue;
    const band=boardV3Child(group,'rect',dir==='row'?{x:0,y:r*100+8,width:800,height:84,rx:18,fill:SPECIAL_FX.colors.bolt}:{x:c*100+8,y:0,width:84,height:800,rx:18,fill:SPECIAL_FX.colors.bolt});
    tasks.push(fxAnimate(band,[{opacity:0},{opacity:.22,offset:.6},{opacity:0}],{duration:SPECIAL_FX.combo.preview+40,easing:'ease-in-out',fill:'forwards'}));
  }
  sequence.tails.push(Promise.all(tasks).finally(()=>group.remove()));
}
specialEffect = async function specialEffectV4(act,sequence){
  if(!sequence){await boardV3Charge(act,BOARD_V5_PACING.charge);return;}
  const {tails,detonate}=sequence,t=act.tile,T=specialFxRules();
  if(act.kind==='combo'){
    const [x,y]=act.name.split('+'),soundKind=x==='core'||y==='core'?'core':x==='bomb'||y==='bomb'?'bomb':'bolt';
    if(act.name==='core+core'||act.name==='core+bolt'||act.name==='core+bomb')specialFxRing(t,sequence,{size:340,duration:SPECIAL_FX.combo.charge+SPECIAL_FX.core.hold+300});
    await specialFxMerge(act,SPECIAL_FX.combo.charge,soundKind);
    boardItemSound(t.type,soundKind);tails.push(boardImpactShake(5),boardItemRecoil(t,5));specialFxNova(t,soundKind,sequence);
    detonate(t,'combo');if(act.partner)detonate(act.partner,'combo');
    if(act.turn){
      // Lõi + Sao / Lõi + Bom: the colour's gems turn into the partner kind under rainbow marks, then fire together.
      for(const g of act.turn.tiles){g.special=act.turn.kind;g.dir=act.turn.dir;paintTile(g);if(!reduced)specialFxMark(g,sequence,SPECIAL_FX.core.hold+80);}
      await boardV3Pause(SPECIAL_FX.core.hold);return;
    }
    if(x==='bomb'&&y==='bomb')await specialFxBloom(t,T.bombRadius+1,act.hits,sequence,{duration:SPECIAL_FX.combo.blast*.45,kind:'combo',fill:'forwards'});
    else{
      // Sao+Sao: a band of 3 rows and 3 columns; Sao+Bom: 5 and 5. Rows sweep first, columns a beat after.
      const lanes=(T.boltMode==='wide'?1:0)+(x==='bomb'||y==='bomb'?1:0);
      specialFxPreview(t,lanes,sequence);await boardV3Pause(SPECIAL_FX.combo.preview);
      await Promise.all([specialFxSweep(t,'row',act.hits,sequence,{lanes,duration:SPECIAL_FX.combo.blast*.5,kind:'combo'}),
        specialFxSweep(t,'col',act.hits,sequence,{lanes,duration:SPECIAL_FX.combo.blast*.5,kind:'combo',delay:SPECIAL_FX.combo.offset})]);
    }
    act.hits.forEach(h=>specialFxHit(h,sequence,'combo'));
    return;
  }
  if(act.fullBoard){
    // Two Lõi: they pull together, the light compresses, then one drawn rainbow ring sweeps the board and clears it once.
    await boardV3Charge({tile:t,kind:'core'},SPECIAL_FX.combo.charge);
    boardItemSound(t.type,'core');tails.push(boardImpactShake(5),boardItemRecoil(t,5));specialFxNova(t,'core',sequence);
    detonate(t,'core');
    specialFxRing(t,sequence,{size:1500,duration:520,spin:180});
    const distance=g=>Math.max(Math.abs(g.r-t.r),Math.abs(g.c-t.c)),hits=act.hits.filter(g=>g!==t);
    for(const ring of [...new Set(hits.map(distance))].sort((a,b)=>a-b)){await boardV3Pause(55);for(const g of hits)if(distance(g)===ring)detonate(g,'mass');}
    return;
  }
  // A special a chain set off fires quicker and without its own nova.
  const chained=(act.gen||0)>0;
  await boardV3Charge(act,chained?SPECIAL_FX.chainCharge:SPECIAL_FX[act.kind]?.charge||BOARD_V5_PACING.charge);
  boardItemSound(t.type,act.kind);
  const strength={bolt:2,bomb:4,core:5}[act.kind]||2;
  tails.push(boardImpactShake(strength),boardItemRecoil(t,strength));if(!chained)specialFxNova(t,act.kind,sequence);
  detonate(t,act.kind);
  if(act.kind==='bolt')await specialFxSweep(t,act.dir||'row',act.hits,sequence);
  else if(act.kind==='bomb')await specialFxBloom(t,T.bombRadius,act.hits,sequence);
  else if(act.kind==='core')await specialFxGather(act,sequence);
  act.hits.forEach(h=>specialFxHit(h,sequence,act.kind));
};
function tileAtOr(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE?board[r][c]:null;}
