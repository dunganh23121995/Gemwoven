/* Star forms change the authored body, weapon and spell presentation.
 * Damage/status resolution remains in the established combat/progression paths. */
let heroFormCasting=false;
if(ART.scytheGlint)document.documentElement.style.setProperty('--scythe-mask',`url('${ART.scytheGlint}')`);
function combatHeroForm(key){
  if(key==='novice')return 1;
  if(progressionBattle?.hero===key)return progressionBattle.stats.form||progressionRules.heroForm(key,{stars:progressionBattle.stats.stars||1});
  return progressionSandbox&&key===state.key?Math.max(1,Math.min(3,state.form||1)):1;
}
const formBaseSkills=Object.fromEntries(Object.entries(HEROES).map(([key,hero])=>[key,hero.skill]));
for(const key of Object.keys(progressionRules.HERO_FORMS))HEROES[key].skill=progressionRules.HERO_FORMS[key][combatHeroForm(key)-1].skill;
const formOriginalRender=renderActors;
renderActors=function(){
  const key=state.key,form=combatHeroForm(key);heroKitPreload(key);
  HEROES[key].skill=progressionRules.HERO_FORMS[key]?.[form-1].skill||formBaseSkills[key];
  formOriginalRender();
  const root=actor('hero');root.dataset.heroForm=form;root.dataset.heroElement=key;
  const body=spriteDefinition('hero',key,'idle').sheet;
  // One body size in every form, measured by the head (assets/heroes/head-scale.json): form 1 keeps
  // its size and every other form is scaled so its head matches form 1's; tails, auras and weapons
  // reach wherever they go. A form not measured yet keeps the old whole-silhouette fit.
  const head=ART.heroHead?.[key],first=Math.max(1,.75/(ART.heroes[key]?.idle?.bodyHeight||.75));
  // A form whose head is drawn larger than form 1's would come out shorter: it grows until it stands
  // as tall as form 1, crown to soles (a higher form never looks smaller, nor zoomed in).
  const rest=ART.heroes[key]?.idle;
  const tall=form>1&&rest?.bodyHeight&&body.bodyHeight?first*rest.bodyHeight/body.bodyHeight:0;
  root.style.setProperty('--hero-art-scale',head?.[1]&&head?.[form]?Math.max(first*head[1]/head[form],tall):Math.max(1,(form===3?.82:.75)/(body.bodyHeight||.75)));
  root.style.setProperty('--hero-visible-height',`calc(var(--actor-size) * ${body.bodyHeight||.75})`);
  root.style.setProperty('--form-color',key==='shadow'?'#8d8d94':combatV3Palette[key].light);
  // The aura's floor cloud stands between the boots, which need not be the cell's centre.
  root.style.setProperty('--aura-floor-shift',`calc(var(--actor-size) * ${((body.feetX??.5)-.5).toFixed(4)})`);
  // Evolution pieces stay visible on every form; CSS re-anchors them per form body.
  mountHeroMotes(root,key,form);
  if(form<3)return;
  const aura=document.createElement('span');aura.className='hero-form-effects combat-form-aura';aura.setAttribute('aria-hidden','true');
  aura.innerHTML=window.GemwovenFormEffects.markup(key,form,ART.formAuras?.[key]);
  root.append(aura);
};
// At rest, the hero's own element drifts around them (like the ambient spirits of mobile RPG
// battle idles): Mika's embers circle her waist, Yuki's snowflakes fall, Nori's leaves spiral up, Lumi's stars
// twinkle, Hiro's leaves blow past on the wind. More of them as the hero gains forms.
function mountHeroMotes(root,key,form){
  const art=ART.heroMotes?.[key];if(!art)return;
  const layer=document.createElement('span');layer.className='hero-idle-motes';layer.setAttribute('aria-hidden','true');
  // A few, not a swarm: form 3 already wears its own aura (Nori's six-star grove sends up its own leaves).
  // Mika's embers grow with her forms (a couple at first, a blaze at form 3).
  const count=key==='novice'?4:key==='fire'?[2,3,6][form-1]:key==='lightning'?2+form:key==='earth'&&form===3?2:3+form;
  layer.innerHTML=Array.from({length:count},(_,i)=>{
    const r=k=>((Math.sin((i+1)*12.9898+k*78.233)*43758.5453)%1+1)%1;// stable per mote
    return `<b style="--img:url('${art[i%art.length]}');--x:${(8+r(1)*84).toFixed(1)}%;--y:${(12+r(2)*62).toFixed(1)}%;--size:${(9+r(3)*6+form).toFixed(1)}%;--dur:${(3.2+r(4)*2.6).toFixed(2)}s;--delay:${(-r(5)*6).toFixed(2)}s;--drift:${((r(6)-.5)*30).toFixed(1)}px;--spin:${((r(7)-.5)*400).toFixed(0)}deg;--phase:${(i/count).toFixed(3)}"></b>`;
  }).join('');
  root.append(layer);
}
function heroFormMotif(key,form){
  const strong=form===3,n=strong?9:5;
  if(key==='fire')return Array.from({length:n},(_,i)=>`<path d="M110 175 Q${15+i*22} 100 ${25+i*20} 25 Q${95+i*6} 80 110 175" fill="var(--combat-main)" opacity=".5"/><path d="M110 175 Q${25+i*21} 98 ${25+i*20} 25" stroke="var(--combat-light)" stroke-width="2"/>`).join('');
  if(key==='ice')return Array.from({length:n},(_,i)=>`<path d="M110 18 126 71 110 105 94 71Z" transform="rotate(${i*360/n} 110 110)" fill="var(--combat-main)" fill-opacity=".5" stroke="var(--combat-light)" stroke-width="2"/>`).join('')+'<circle cx="110" cy="110" r="78" stroke="var(--combat-light)" stroke-width="1"/>';
  if(key==='earth')return Array.from({length:n},(_,i)=>`<path d="M110 190 Q${10+i*23} 145 ${20+i*22} 70 Q${50+i*16} 100 ${25+i*20} 28" stroke="var(--combat-main)" stroke-width="6"/><ellipse cx="${25+i*20}" cy="45" rx="7" ry="18" fill="var(--combat-light)" transform="rotate(${i%2?25:-25} ${25+i*20} 45)"/>`).join('');
  if(key==='lightning'){
    const points=Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n-Math.PI/2;return [110+Math.cos(a)*80,110+Math.sin(a)*80];});
    return `<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('')}Z" stroke="var(--combat-light)" stroke-width="1.5"/>`+points.map(([x,y])=>`<path d="M${x} ${y} 105 103 118 115 110 180" stroke="var(--combat-main)" stroke-width="2"/><path d="m${x} ${y-8} 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="var(--combat-light)"/>`).join('');
  }
  // Reaper sigil: crescent scythe blades turning around a dark soul ring.
  if(key==='shadow'&&strong)return `<circle cx="110" cy="110" r="70" fill="#06020dee" stroke="var(--combat-light)" stroke-width="1.5"/><circle cx="110" cy="110" r="34" stroke="var(--combat-light)" stroke-width="1" stroke-dasharray="4 6"/>`+
    Array.from({length:6},(_,i)=>`<path d="M110 22C150 30 176 62 178 98C160 70 136 56 110 52Z" transform="rotate(${i*60} 110 110)" fill="#1b0c2be6" stroke="var(--combat-light)" stroke-width="1.4"/>`).join('');
  return `<circle cx="110" cy="110" r="66" fill="#06020dee" stroke="var(--combat-main)" stroke-width="2"/>`+
    Array.from({length:strong?8:4},(_,i)=>`<path d="M110 12C16 30 27 159 110 200C56 149 81 72 110 12Z" transform="rotate(${i*360/(strong?8:4)} 110 110)" fill="#10071be6" stroke="var(--combat-light)" stroke-width="1.2"/>`).join('');
}
function heroFormSpell(key,form,point,pending,opening=false){
  const size=Math.min(point.width*(form===3?1.3:1.05),270);
  return castFx(key,'star-form-'+form,point,size,combatV3Svg(heroFormMotif(key,form)),opening?650:1150,pending,[
    {opacity:0,transform:'translate(-50%,-50%) scale(.25) rotate(-20deg)'},
    {opacity:opening?.6:.95,transform:'translate(-50%,-50%) scale(.92) rotate(0deg)',offset:.3},
    {opacity:.8,transform:'translate(-50%,-50%) scale(1.05) rotate(10deg)',offset:.62},
    {opacity:0,transform:'translate(-50%,-50%) scale(1.28) rotate(20deg)'}
  ]);
}
const formOriginalUltimate=heroUltimate;
heroUltimate=async function(){
  const key=state.key,form=combatHeroForm(key),own=heroKit(key,form,'ultimate');
  if(own)return own();
  // Six-star Noct's ultimate stages its own cast (outstretched hand and cursed fog).
  if(form<2||(form===3&&key==='shadow'))return formOriginalUltimate();
  const pending=[];heroFormCasting=true;
  try{
    if(form===3){setSpriteAction('hero','cast',650);heroFormSpell(key,form,combatV3Point('hero'),pending,true);await wait(reduced?0:420);}
    formSkillStrike(key,form,pending);
    await formOriginalUltimate();await Promise.all(pending);
  }finally{heroFormCasting=false;if(state.hp>0)setSpriteAction('hero','idle');}
};
// Four- and six-star signature: a generated skill FX bursts on the foe just before the
// ultimate's hits land (every rage skill shares the 0-3000 ms timeline), with its own sound;
// the six-star strike is larger and adds an element flash and a heavier camera hit.
function formSkillStrike(key,form,pending){
  const sheet=ART.formSkillFx?.[key]?.[form];if(!sheet||reduced)return;
  const delay=form===3?820:1250;
  pending.push(wait(delay-120).then(()=>playCastSound(key,'form'+form,{volume:form===3?.36:.3,pan:.3})));
  pending.push(wait(delay).then(()=>{
    const target=combatV3Point('enemy'),size=Math.min($('scene').clientWidth*(form===3?.95:.75),target.width*(form===3?2.1:1.6));
    const node=document.createElement('span');node.className=`form-skill-fx form-skill-${form} ${key}`;node.setAttribute('aria-hidden','true');
    node.style.cssText=`left:${target.x}px;top:${target.y-target.height*.1}px;width:${size}px;height:${size}px;--fx-count:${sheet.count};background-image:url('${sheet.src}')`;
    $('combatEffects').append(node);
    const run=animate(node,[{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0'}],{duration:sheet.count*sheet.frameDuration*(form===3?1.25:1),easing:`steps(${sheet.count},jump-none)`});
    pending.push(run.finally(()=>node.remove()));
    if(form===3){
      const flash=document.createElement('span');flash.className='form-skill-flash '+key;flash.setAttribute('aria-hidden','true');$('combatEffects').append(flash);
      pending.push(animate(flash,[{opacity:0},{opacity:.75,offset:.25},{opacity:0}],{duration:520}).finally(()=>flash.remove()));
      pending.push(wait(sheet.frameDuration*3).then(()=>combatV3Camera(1,true,state.boss,pending)));
    }else combatV3Camera(1,false,false,pending);
  }));
}
const formOriginalAttack=attack;
attack=async function(side,raw,options={}){
  const form=combatHeroForm(state.key),pending=[],own=side==='hero'&&!options.ultimate&&!heroFormCasting?heroKit(state.key,form,'attack'):null;
  if(own)return own(raw,options);
  // Six-star Noct draws his own scythe crescents (shadow-combat.js reaperCut).
  if(side==='hero'&&form===3&&!heroFormCasting&&!options.ultimate&&state.key!=='shadow'){
    const p=combatV3Point('enemy');
    const shadow=state.key==='shadow';
    castFx(state.key,'form-weapon-'+form,p,Math.min(190,p.width),combatV3Svg(
      `<path d="M20 170Q45 40 200 35Q70 70 20 170Z" fill="${shadow?'#090311':'var(--combat-light)'}" ${shadow?'stroke="var(--combat-light)" stroke-width="1.5"':''}/>`+
      (form===3?`<path d="M20 35Q175 60 200 170Q150 65 20 35Z" fill="${shadow?'#190927':'var(--combat-main)'}" opacity=".8"/>`:'')),420,pending);
  }
  const result=await formOriginalAttack(side,raw,options);await Promise.all(pending);return result;
};
