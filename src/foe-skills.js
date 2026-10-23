// Foe skills on screen and in the rules.
//  * Statuses: lasting effects that bosses put on the hero or on themselves (damage over time,
//    stun, silence, weaken, stealth, undying...). They tick down at the start of every foe turn.
//  * Moves: how a skill is staged. Every boss skill names a move that suits its body (a beast
//    lunges and slams, a dragon breathes, a mage casts volleys and beams) and plays it with that
//    boss's own effect sheet (ART.bossFx). Elites use their chapter boss's effect, smaller.
//  * castFoeSkill: one skill from announcement to damage, shields, heals and statuses, shared by
//    classic chapters (progression-combat.js) and phase fights (expedition-combat.js).
// Common foes have no skill effect of their own: their one skill is a pounce (attack()).

// ---- Statuses ---------------------------------------------------------------------------------
const FOE_STATUS={
  dot:{label:'Thiêu đốt',side:'hero'},curse:{label:'Nguyền rủa',side:'hero'},mark:{label:'Ấn sấm',side:'hero'},
  weaken:{label:'Suy yếu',side:'hero'},vulnerable:{label:'Vỡ giáp',side:'hero'},silence:{label:'Phong ấn',side:'hero'},
  confuse:{label:'Hỗn loạn',side:'hero'},blind:{label:'Mù',side:'hero'},antiheal:{label:'Cấm hồi',side:'hero'},
  armorlock:{label:'Giáp tan chảy',side:'hero'},chill:{label:'Hàn ấn',side:'hero'},
  stealth:{label:'Tàng hình',side:'self'},invulnerable:{label:'Miễn thương',side:'self'},undying:{label:'Bất tử',side:'self'},
  reflect:{label:'Gai phản',side:'self'},regen:{label:'Tái sinh',side:'self'},frenzy:{label:'Cuồng huyết',side:'self'}
};
let foeStatuses={},foeDamageTaken=0,foeHaste=0;
const foeHas=id=>(foeStatuses[id]?.turns||0)>0;
function foeStatusReset(){foeStatuses={};foeDamageTaken=0;foeHaste=0;const enemy=$('enemyActor');if(enemy)delete enemy.dataset.foeVeil;}
// Instant statuses (stun, wash, haste, rewind, drainAll) act at once and never become badges.
async function applyFoeStatus(s,base=20,pending=[]){
  if(!s||state.hp<=0||state.enemyHp<=0)return;
  const elite=foeSkillOwner()?.tier==='elite',turns=Math.max(1,s.turns||1),value=s.value||0;
  if(s.id==='stun'){state.playerFrozen=true;popActorSkill('hero','Choáng · mất lượt',false,pending);update();return;}
  if(s.id==='haste'){foeHaste++;popActorSkill('enemy','Hành động thêm',false,pending);return;}
  if(s.id==='wash'){state.armor=0;state.energy=0;update();popActorSkill('hero','Cuốn trôi giáp & năng lượng',false,pending);return;}
  if(s.id==='rewind'){const back=Math.round(foeDamageTaken*(value||.5));foeDamageTaken=0;popActorSkill('enemy','Nghịch thời',false,pending);if(back)await buff('enemy','heal',back);return;}
  if(s.id==='drainAll'){state.energy=0;update();return;}
  const def=FOE_STATUS[s.id];if(!def)return;
  foeStatuses[s.id]={turns,value:value*(elite?.6:1),raw:base*(value||.2),stage:0};
  popActorSkill(def.side==='self'?'enemy':'hero',def.label,false,pending);
  if(s.id==='stealth'||s.id==='invulnerable')actor('enemy').dataset.foeVeil=s.id;
  update();
}
// Start of every foe turn: lasting damage and healing land, then every status loses a turn.
async function tickFoeStatuses(){
  for(const [id,s] of Object.entries(foeStatuses)){
    if(state.hp<=0||state.enemyHp<=0)break;
    if(id==='dot'){const r=damage('enemy',s.raw);await floating('hero','Thiêu đốt −'+r.amount);}
    if(id==='curse'){s.stage++;const r=damage('enemy',s.raw*s.stage);await floating('hero','Nguyền rủa −'+r.amount);}
    if(id==='regen')await buff('enemy','heal',Math.round(state.enemyMax*s.value));
    if(--s.turns<=0){
      if(id==='mark'){const r=applyCombatDamage('hero',Math.round(HEROES[state.key].hp*s.value));await floating('hero','Ấn sấm nổ −'+r.amount);}
      delete foeStatuses[id];
    }
  }
  if(!foeHas('stealth')&&!foeHas('invulnerable'))delete actor('enemy').dataset.foeVeil;
  update();
}
function renderFoeStatuses(){
  for(const side of ['hero','enemy']){
    const row=$(side+'Statuses');if(!row)continue;row.querySelectorAll('.foe-status').forEach(n=>n.remove());
    for(const [id,s] of Object.entries(foeStatuses)){
      const def=FOE_STATUS[id];if(!def||(def.side==='self')!==(side==='enemy'))continue;
      const pill=document.createElement('span');pill.className='status-pill foe-status';pill.dataset.status=id;pill.title=def.label+' · còn '+s.turns+' lượt';pill.textContent=def.label+' '+s.turns;row.append(pill);
    }
  }
}
const foeStatusUpdate=update;update=function(){foeStatusUpdate();renderFoeStatuses();};
const foeStatusStart=startStage;startStage=function(){foeStatusReset();return foeStatusStart();};

// The rules side of the statuses, at the existing damage, heal, armour and energy hooks.
const foeBaseDamage=damage;
damage=function(side,raw,ledger=null){
  if(side==='hero'&&state.enemyHp>0){
    if(foeHas('stealth')||foeHas('invulnerable')){floating('enemy',foeHas('stealth')?'TRƯỢT':'MIỄN','armor');return {amount:0,blocked:0};}
    if(foeHas('blind')&&!ledger&&Math.random()<foeStatuses.blind.value){floating('enemy','TRƯỢT','armor');return {amount:0,blocked:0};}
    if(foeHas('weaken'))raw*=1-foeStatuses.weaken.value;
    const result=foeBaseDamage(side,raw,ledger);
    for(const id of ['confuse','reflect'])if(foeHas(id)&&result.amount>0&&state.hp>0){
      const back=applyCombatDamage('hero',Math.max(1,Math.round(result.amount*foeStatuses[id].value)));
      floating('hero',(id==='confuse'?'Tự đánh −':'Gai phản −')+back.amount);
    }
    return result;
  }
  if(side==='enemy'&&foeHas('vulnerable'))raw*=1+foeStatuses.vulnerable.value;
  const result=foeBaseDamage(side,raw,ledger);
  if(side==='enemy'&&foeHas('frenzy')&&result.amount>0)buff('enemy','heal',Math.round(result.amount*foeStatuses.frenzy.value));
  return result;
};
const foeBaseApply=applyCombatDamage;
applyCombatDamage=function(target,n){
  if(target==='enemy'&&foeHas('undying'))n=Math.min(n,Math.max(0,state.enemyArmor+state.enemyHp-1));
  const result=foeBaseApply(target,n);
  if(target==='enemy')foeDamageTaken+=result.amount;
  return result;
};
const foeBaseBuff=buff;
buff=function(side,kind,value,options){
  if(side==='hero'&&((kind==='heal'&&foeHas('antiheal'))||(kind==='armor'&&foeHas('armorlock')))){floating('hero',kind==='heal'?'Cấm hồi':'Giáp tan chảy','armor');return Promise.resolve(0);}
  return foeBaseBuff(side,kind,value,options);
};
const foeBaseTileYield=combatTileYield;
combatTileYield=function(side,type){
  if(side==='hero'&&((type===1&&foeHas('antiheal'))||(type===4&&foeHas('armorlock'))))return 0;
  return foeBaseTileYield(side,type);
};
// Silence is checked where ultimates start (castReadyUltimates, activateSkill): later layers
// replace heroUltimate itself.
const foeSilenced=()=>typeof foeHas==='function'&&foeHas('silence');

// ---- Effect sheets ----------------------------------------------------------------------------
// Whose effect a foe wields: the campaign battle's chapter boss (or a test build's override).
function foeSkillOwner(){
  if(state.qaFoeFx)return state.qaFoeFx;
  return progressionBattle?{boss:progressionBattle.bossId,tier:progressionBattle.tier}:null;
}
function foeSkillSheet(){
  const owner=foeSkillOwner();if(!owner||owner.tier==='normal'||reduced)return null;
  return ART.bossFx?.[owner.boss]||null;
}
// Plays one strip; a looping strip lives until stop(). behind:true draws it behind the actors;
// frame:n holds one frame (a beam stretches it along its length).
function foeFx(sheet,point,size,{loop=false,rotate=0,duration=0,z=6,behind=false,squash=1,frame=null,stretch=1}={}){
  const node=document.createElement('span');node.className='foe-fx';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size*stretch}px;height:${size*squash}px;z-index:${behind?1:z};--fx-count:${sheet.count};background-image:url('${sheet.src}');rotate:${rotate}deg`;
  (behind?$('scene'):$('combatEffects')).append(node);
  if(frame!==null){node.style.backgroundPosition=`${frame/(sheet.count-1)*100}% 0`;return {node,stop(){node.remove();}};}
  const run=node.animate([{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0'}],{duration:duration||sheet.count*sheet.frameDuration,easing:`steps(${sheet.count},jump-none)`,iterations:loop?Infinity:1});
  if(!loop)run.finished.then(()=>node.remove(),()=>node.remove());
  return {node,stop(){run.cancel();node.remove();}};
}
// One hit of a foe skill landing on the hero: same rules and feedback as a basic attack.
function foeSkillContact(raw,ledger,index,strong,pending,{knock=1}={}){
  const direction=-1,evade=noctEvades('hero'),result=damage('enemy',raw,ledger);
  if(evade)noctDodge(direction,pending);
  else{
    combatVoice('hero','hurt');hitAccents('enemy',result,false,pending);
    combatV3Action('hero','hurt',strong?560:410);combatV3HitSound(state.enemyKey,strong);
    combatV3Impact('hero',state.enemyKey,direction,strong,pending);combatV3Camera(direction,strong,state.boss,pending);
    const recoil=combatOuterMotion('hero',(strong?14:8)*knock,strong?6:3);
    pending.push(animate(actor('hero'),[{translate:'0 0'},{translate:`${direction*recoil.distance}px -3px`,offset:.3},{translate:'0 0'}],{duration:320*Math.min(1.6,knock),easing:'cubic-bezier(.2,.8,.35,1)'}));
  }
  combatV3Number('hero',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',index,pending);
  return result;
}

// ---- Moves ------------------------------------------------------------------------------------
// Geometry shared by the moves: where the foe's drawn body reaches, its mouth, the hero's front.
function foeGeometry(){
  const source=combatV3Point('enemy'),target=combatV3Point('hero'),span=spriteDefinition('enemy',state.enemyKey,'attack').sheet.span||[.15,.85];
  const front=source.x-source.width*(.5-span[0]),heroFront=target.x+target.width*.3;
  return {source,target,body:Math.max(target.width,target.height),travel:Math.max(0,front-heroFront),mouth:{x:front+source.width*.04,y:source.y-source.height*.16}};
}
const foePose=(transform,ms,easing='cubic-bezier(.2,.8,.3,1)')=>combatV3Pose(actor('enemy'),transform,ms,easing);
const FOE_MOVES={
  // Lunge: dash to the hero and strike in place (claws, bites, blades).
  async lunge(c){
    setSpriteFrame('enemy','attack',1);await foePose('translate(14px,0)',160);
    setSpriteFrame('enemy','attack',2);await foePose(`translate(${-c.g.travel}px,-6px)`,190*c.pace,'cubic-bezier(.3,.6,.2,1)');
    for(let i=0;i<c.hits;i++){
      setSpriteFrame('enemy','attack',3+(i%2));
      foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.12,y:c.g.target.y-c.g.target.height*(.05+.08*(i%2))},c.g.body*.85*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.6,rotate:i%2?20:-15});
      c.contact(i);
      if(i<c.hits-1){await foePose(`translate(${-c.g.travel+10}px,0)`,70);await foePose(`translate(${-c.g.travel}px,-4px)`,80);}
    }
    await combatV3Wait(140);setSpriteFrame('enemy','attack',5);await foePose('translate(0,0)',280);
  },
  // Charge: a long wind-up, then a blurred rush that bowls through the hero.
  async charge(c){
    setSpriteFrame('enemy','attack',0);await foePose('translate(26px,2px)',260);
    const enemy=actor('enemy');enemy.style.filter='blur(1.2px)';
    for(let k=1;k<=3;k++)foeFx(c.sheet,{x:c.g.source.x-c.g.travel*k/4,y:c.g.target.y+c.g.target.height*.12},c.g.body*.6*c.scale,{squash:.6,duration:420});
    setSpriteFrame('enemy','attack',3);await foePose(`translate(${-c.g.travel-24}px,0)`,150*c.pace,'cubic-bezier(.5,0,.8,.6)');
    enemy.style.filter='';foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.y},c.g.body*1.25*c.scale);
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.8});
    await combatV3Wait(220);setSpriteFrame('enemy','attack',5);await foePose('translate(0,0)',360);
  },
  // Slam: leap into the air and crash down in front of the hero; a ground shockwave erupts.
  async slam(c){
    setSpriteFrame('enemy','attack',1);await foePose('translate(8px,6px) scale(1.03,.95)',150);
    setSpriteFrame('enemy','attack',2);await foePose(`translate(${-c.g.travel*.8}px,${-c.g.source.height*.34}px)`,280*c.pace,'cubic-bezier(.2,.7,.4,1)');
    setSpriteFrame('enemy','attack',3);await foePose(`translate(${-c.g.travel*.85}px,0)`,120,'cubic-bezier(.6,0,1,.6)');
    foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.1,y:c.g.target.foot-c.g.body*.12},c.g.body*1.7*c.scale,{squash:.55});
    combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.4});
    await combatV3Wait(240);setSpriteFrame('enemy','attack',5);await foePose('translate(0,0)',380);
  },
  // Breath: a stream of the boss's effect pours from its mouth across the arena.
  async breath(c){
    setSpriteFrame('enemy','attack',1);await foePose('translate(10px,-4px) rotate(3deg)',220);
    setSpriteFrame('enemy','attack',3);
    const from=c.g.mouth,to={x:c.g.target.x,y:c.g.target.y-c.g.target.height*.05},count=9,per=Math.ceil(count/Math.max(1,c.hits));
    for(let k=0;k<count;k++){
      const t=(k+1)/count;
      foeFx(c.sheet,{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+Math.sin(k*1.7)*6},c.g.body*(.35+.75*t)*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.75,rotate:k*37});
      if(c.hits&&(k%per===per-1||k===count-1)&&Math.floor(k/per)<c.hits)c.contact(Math.floor(k/per));
      await combatV3Wait(45*c.pace);
    }
    await combatV3Wait(200);setSpriteFrame('enemy','attack',5);await foePose('translate(0,0)',260);
  },
  // Volley: shards of the effect fly in arcs from the caster and burst on contact.
  async volley(c){
    setSpriteAction('enemy','cast',900);await combatV3Wait(200*c.pace);
    for(let i=0;i<c.hits;i++){
      const spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.25,y:c.g.target.y-c.g.target.height*(.05+Math.random()*.15)};
      const start={x:c.g.source.x-c.g.source.width*.25,y:c.g.source.y-c.g.source.height*.12},angle=Math.atan2(spot.y-start.y,spot.x-start.x)*180/Math.PI;
      const bolt=foeFx(c.sheet,start,c.g.body*.42*c.scale,{loop:true,rotate:angle+180,duration:c.sheet.count*c.sheet.frameDuration*.6,z:7});
      combatV3Whoosh(state.enemyKey,false,150);
      await animate(bolt.node,[{left:start.x+'px',top:start.y+'px'},{left:(start.x+spot.x)/2+'px',top:(start.y+spot.y)/2-c.g.target.height*(.25+.1*(i%2))+'px',offset:.5},{left:spot.x+'px',top:spot.y+'px'}],{duration:260*c.pace,easing:'cubic-bezier(.35,.1,.6,1)'});
      bolt.stop();foeFx(c.sheet,spot,c.g.body*.85*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.7});
      c.contact(i);if(i<c.hits-1)await combatV3Wait(60*c.pace);
    }
    await combatV3Wait(200);
  },
  // Beam: a charge gathers at the foe, then a long ray of the effect cuts across to the hero.
  async beam(c){
    setSpriteAction('enemy','cast',1200);
    const gather=foeFx(c.sheet,c.g.mouth,c.g.body*.5*c.scale,{loop:true,duration:c.sheet.count*c.sheet.frameDuration*.5});
    await animate(gather.node,[{scale:'.3',opacity:.4},{scale:'1.2',opacity:1}],{duration:420});gather.stop();
    const from=c.g.mouth,to={x:c.g.target.x,y:c.g.target.y-c.g.target.height*.08},dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI,thick=c.g.body*.42*c.scale;
    const ray=foeFx(c.sheet,{x:(from.x+to.x)/2,y:(from.y+to.y)/2},thick,{frame:Math.floor(c.sheet.count/2),stretch:len/thick,rotate:angle,z:7});
    c.pending.push(animate(ray.node,[{opacity:0,scale:'1 .2'},{opacity:1,scale:'1 1.15',offset:.15},{opacity:1,scale:'1 .8',offset:.6},{opacity:0,scale:'1 .1'}],{duration:620}).finally(()=>ray.stop()));
    foeFx(c.sheet,to,c.g.body*1.3*c.scale);combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.3});if(i<c.hits-1)await combatV3Wait(90);}
    await combatV3Wait(420);
  },
  // Eruption: the effect bursts out of the ground under the hero.
  async eruption(c){
    setSpriteAction('enemy','cast',900);await combatV3Wait(220*c.pace);
    for(let i=0;i<c.hits;i++){
      const last=i===c.hits-1,spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.25,y:c.g.target.y-c.g.target.height*(.05+Math.random()*.15)};
      foeFx(c.sheet,spot,c.g.body*(last?1.35:1.05)*c.scale);
      await combatV3Wait(c.sheet.frameDuration*2.6*c.pace);c.contact(i);
      if(!last)await combatV3Wait(140*c.pace);
    }
    await combatV3Wait(200);
  },
  // Rain: the effect falls from the sky onto the hero, one piece per hit.
  async rain(c){
    setSpriteAction('enemy','cast',1000);await combatV3Wait(240*c.pace);
    for(let i=0;i<c.hits;i++){
      const spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.5,y:c.g.target.y-c.g.target.height*(Math.random()*.2)},sky={x:spot.x+40,y:-30};
      const drop=foeFx(c.sheet,sky,c.g.body*.5*c.scale,{loop:true,rotate:200,duration:c.sheet.count*c.sheet.frameDuration*.5,z:7});
      await animate(drop.node,[{left:sky.x+'px',top:sky.y+'px'},{left:spot.x+'px',top:spot.y+'px'}],{duration:180*c.pace,easing:'cubic-bezier(.55,0,1,.45)'});
      drop.stop();foeFx(c.sheet,spot,c.g.body*.95*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.7});
      c.contact(i);await combatV3Wait(70*c.pace);
    }
    await combatV3Wait(220);
  },
  // Roar: the foe bellows; a ring of its effect swells around it and a shockwave rolls along the ground.
  async roar(c){
    setSpriteFrame('enemy','attack',3);
    c.pending.push(animate(actor('enemy'),[{translate:'0 0'},{translate:'3px -2px'},{translate:'-3px 1px'},{translate:'2px -1px'},{translate:'0 0'}],{duration:520}));
    const ring=foeFx(c.sheet,c.g.mouth,c.g.body*.6*c.scale,{duration:520});
    c.pending.push(animate(ring.node,[{scale:'.5',opacity:1},{scale:'2.4',opacity:0}],{duration:560,easing:'ease-out'}));
    combatV3Camera(-1,true,state.boss,c.pending);await combatV3Wait(160);
    if(c.hits){
      const wave=foeFx(c.sheet,{x:c.g.source.x,y:c.g.target.foot-c.g.body*.18},c.g.body*.9*c.scale,{loop:true,squash:.5,duration:c.sheet.count*c.sheet.frameDuration*.6});
      await animate(wave.node,[{left:c.g.source.x+'px'},{left:c.g.target.x+'px'}],{duration:300*c.pace,easing:'ease-in'});wave.stop();
      for(let i=0;i<c.hits;i++)c.contact(i);
    }
    await combatV3Wait(300);setSpriteAction('enemy','idle');
  },
  // Tether: a chain of the effect binds the hero and pulls their strength into the foe.
  async tether(c){
    setSpriteAction('enemy','cast',1100);await combatV3Wait(160);
    const from=c.g.target,to=c.g.mouth,links=[];
    for(let k=0;k<6;k++){const t=k/5;links.push(foeFx(c.sheet,{x:from.x+(to.x-from.x)*t,y:from.y-from.height*.05+(to.y-from.y+from.height*.05)*t},c.g.body*.32*c.scale,{loop:true,duration:c.sheet.count*c.sheet.frameDuration*.5,rotate:k*45}));}
    for(let i=0;i<c.hits;i++){c.contact(i);await combatV3Wait(120);}
    for(const [k,link] of links.entries())c.pending.push(animate(link.node,[{opacity:1},{opacity:0,left:to.x+'px',top:to.y+'px'}],{duration:320,delay:k*40,easing:'ease-in'}).finally(()=>link.stop()));
    await combatV3Wait(360);
  },
  // Vanish: the foe dissolves, reappears at the hero's side to strike, and fades back.
  async vanish(c){
    const enemy=actor('enemy');foeFx(c.sheet,{x:c.g.source.x,y:c.g.source.y},c.g.body*1.1*c.scale);
    await animate(enemy,[{opacity:1,filter:'blur(0px)'},{opacity:0,filter:'blur(4px)'}],{duration:260});enemy.style.opacity='0';
    await combatV3Wait(160);
    enemy.style.transform=`translate(${-c.g.travel}px,0)`;setSpriteFrame('enemy','attack',3);
    await animate(enemy,[{opacity:0},{opacity:1}],{duration:120});enemy.style.opacity='';
    foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.1,y:c.g.target.y},c.g.body*1.05*c.scale);
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(180);await animate(enemy,[{opacity:1},{opacity:0}],{duration:160});
    enemy.style.transform='';await animate(enemy,[{opacity:0},{opacity:1}],{duration:260});
  },
  // Aura: the effect bursts around the foe itself (guards, heals, self buffs).
  async aura(c){
    setSpriteAction('enemy','cast',800);
    foeFx(c.sheet,{x:c.g.source.x,y:c.g.source.y-c.g.source.height*.05},Math.max(c.g.source.width,c.g.source.height)*(c.scale<1?1.25:1.55),{behind:true});
    await combatV3Wait(c.sheet.frameDuration*3);
    for(let i=0;i<c.hits;i++)c.contact(i);
  }
};
// Plays a move; contact(i) applies hit i. Without an effect sheet (reduced motion, common foes,
// missing art) the damage still lands through the ordinary attack.
async function foeSkillStrike(skill,raw,hits=1){
  const sheet=foeSkillSheet(),move=FOE_MOVES[skill?.move]?skill.move:hits>1?'volley':'eruption';
  if(!sheet){if(raw>0)return attack('enemy',raw,{hits});return {amount:0,blocked:0};}
  const elite=foeSkillOwner().tier==='elite',pending=[],ledger={raw:0,applied:0},enemy=actor('enemy');
  hits=raw>0?Math.max(1,Math.min(9,Math.round(hits)||1)):0;
  let amount=0,blocked=0;
  const c={sheet,hits,pace:elite?.8:1,scale:elite?.68:1,g:foeGeometry(),pending,
    contact(i,options){const r=foeSkillContact(raw/hits,ledger,i,i===hits-1&&!elite,pending,options);amount+=r.amount;blocked+=r.blocked;update();}};
  enemy.classList.add('combat-v3-acting');enemy.style.zIndex='4';
  try{
    combatVoice('enemy',move==='aura'?'cast':'attack');
    await FOE_MOVES[move](c);
    await Promise.all(pending);
    return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);enemy.classList.remove('combat-v3-acting');enemy.style.zIndex='';enemy.style.transform='';enemy.style.filter='';enemy.style.opacity='';
    actor('hero').style.translate='';combatV3Action('enemy','idle');combatV3Action('hero','idle');
  }
}
async function foeSkillAura(){return foeSkillStrike({move:'aura'},0,0);}

// ---- One whole skill --------------------------------------------------------------------------
// base: the foe's skill damage before the skill's own power (enemySkillBase × level scaling).
async function castFoeSkill(skill,base,{charge=1,announce=true}={}){
  const name=skill.name,pending=[],who=progressionBattle?.enemyName||MONSTERS[state.enemyKey]?.name||'';
  if(announce){
    if(skill.ult){message(who+' · TUYỆT CHIÊU · '+name);popActorSkill('enemy','TUYỆT CHIÊU · '+name,true,pending);}
    else{message(who+' dùng '+name);popActorSkill('enemy',name,true,pending);}
  }
  const selfFirst=skill.status&&skill.status.target==='self'&&['stealth','invulnerable'].includes(skill.status.id);
  if(selfFirst)await applyFoeStatus(skill.status,base,pending);
  let result={amount:0,blocked:0};const previous=state.hp;
  if(skill.power>0){
    if(skill.drain)state.energy=Math.max(0,state.energy-skill.drain);
    let raw=base*skill.power*charge;
    if(skill.kind==='execute'&&state.hp/HEROES[state.key].hp<skill.threshold)raw*=skill.bonus;
    if(skill.shatter)state.armor=Math.round(state.armor*(1-skill.shatter));
    const reserved=skill.pierce?Math.floor(state.armor*skill.pierce):0;state.armor-=reserved;
    try{result=await foeSkillStrike(skill,raw,skill.hits||1);}finally{state.armor+=reserved;}
  }else if(skill.shield||skill.heal)await foeSkillStrike({move:skill.move||'aura'},0,0);
  if(skill.leech&&previous>state.hp)await buff('enemy','heal',Math.round((previous-state.hp)*skill.leech));
  if(skill.shield)await buff('enemy','armor',Math.round(state.enemyMax*skill.shield));
  if(skill.heal)await buff('enemy','heal',Math.round(state.enemyMax*skill.heal));
  if(skill.status&&!selfFirst)await applyFoeStatus(skill.status,base,pending);
  await Promise.allSettled(pending);update();
  return result;
}
