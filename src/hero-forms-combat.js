/* Star forms change the authored body, weapon and spell presentation.
 * Damage/status resolution remains in the established combat/progression paths. */
let heroFormCasting=false;
function combatHeroForm(key){
  if(key==='novice')return 1;
  if(progressionBattle?.hero===key)return progressionBattle.stats.form||progressionRules.heroForm(key,{stars:progressionBattle.stats.stars||1});
  return progressionSandbox&&key===state.key?Math.max(1,Math.min(3,state.form||1)):1;
}
const formBaseSkills=Object.fromEntries(Object.entries(HEROES).map(([key,hero])=>[key,hero.skill]));
for(const key of Object.keys(progressionRules.HERO_FORMS))HEROES[key].skill=progressionRules.HERO_FORMS[key][combatHeroForm(key)-1].skill;
const formOriginalRender=renderActors;
renderActors=function(){
  const key=state.key,form=combatHeroForm(key);
  HEROES[key].skill=progressionRules.HERO_FORMS[key]?.[form-1].skill||formBaseSkills[key];
  formOriginalRender();
  const root=actor('hero');root.dataset.heroForm=form;root.dataset.heroElement=key;
  const body=spriteDefinition('hero',key,'idle').sheet;
  root.style.setProperty('--hero-art-scale',Math.max(1,(form===3?.82:.75)/(body.bodyHeight||.75)));
  root.style.setProperty('--hero-visible-height',`calc(var(--actor-size) * ${body.bodyHeight||.75})`);
  root.style.setProperty('--form-color',key==='shadow'?'#7955a5':combatV3Palette[key].light);
  // Evolution pieces stay visible on every form; CSS re-anchors them per form body.
  if(form<3)return;
  const aura=document.createElement('span');aura.className='hero-form-effects combat-form-aura';aura.setAttribute('aria-hidden','true');
  aura.innerHTML=window.GemwovenFormEffects.markup(key,form,ART.formAuras?.[key]);
  root.append(aura);
};
function heroFormMotif(key,form){
  const strong=form===3,n=strong?9:5;
  if(key==='fire')return Array.from({length:n},(_,i)=>`<path d="M110 175 Q${15+i*22} 100 ${25+i*20} 25 Q${95+i*6} 80 110 175" fill="var(--combat-main)" opacity=".5"/><path d="M110 175 Q${25+i*21} 98 ${25+i*20} 25" stroke="var(--combat-light)" stroke-width="2"/>`).join('');
  if(key==='ice')return Array.from({length:n},(_,i)=>`<path d="M110 18 126 71 110 105 94 71Z" transform="rotate(${i*360/n} 110 110)" fill="var(--combat-main)" fill-opacity=".5" stroke="var(--combat-light)" stroke-width="2"/>`).join('')+'<circle cx="110" cy="110" r="78" stroke="var(--combat-light)" stroke-width="1"/>';
  if(key==='earth')return Array.from({length:n},(_,i)=>`<path d="M110 190 Q${10+i*23} 145 ${20+i*22} 70 Q${50+i*16} 100 ${25+i*20} 28" stroke="var(--combat-main)" stroke-width="6"/><ellipse cx="${25+i*20}" cy="45" rx="7" ry="18" fill="var(--combat-light)" transform="rotate(${i%2?25:-25} ${25+i*20} 45)"/>`).join('');
  if(key==='lightning'){
    const points=Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n-Math.PI/2;return [110+Math.cos(a)*80,110+Math.sin(a)*80];});
    return `<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('')}Z" stroke="var(--combat-light)" stroke-width="1.5"/>`+points.map(([x,y])=>`<path d="M${x} ${y} 105 103 118 115 110 180" stroke="var(--combat-main)" stroke-width="2"/><path d="m${x} ${y-8} 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="var(--combat-light)"/>`).join('');
  }
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
  const key=state.key,form=combatHeroForm(key);
  if(form<3)return formOriginalUltimate();
  const pending=[];heroFormCasting=true;
  try{
    setSpriteAction('hero','cast',650);
    heroFormSpell(key,form,combatV3Point('hero'),pending,true);
    await wait(reduced?0:420);
    heroFormSpell(key,form,combatV3Point('enemy'),pending);
    await formOriginalUltimate();await Promise.all(pending);
  }finally{heroFormCasting=false;if(state.hp>0)setSpriteAction('hero','idle');}
};
const formOriginalAttack=attack;
attack=async function(side,raw,options={}){
  const form=combatHeroForm(state.key),pending=[];
  if(side==='hero'&&form===3&&!heroFormCasting&&!options.ultimate){
    const p=combatV3Point('enemy');
    const shadow=state.key==='shadow';
    castFx(state.key,'form-weapon-'+form,p,Math.min(190,p.width),combatV3Svg(
      `<path d="M20 170Q45 40 200 35Q70 70 20 170Z" fill="${shadow?'#090311':'var(--combat-light)'}" ${shadow?'stroke="var(--combat-light)" stroke-width="1.5"':''}/>`+
      (form===3?`<path d="M20 35Q175 60 200 170Q150 65 20 35Z" fill="${shadow?'#190927':'var(--combat-main)'}" opacity=".8"/>`:'')),420,pending);
  }
  const result=await formOriginalAttack(side,raw,options);await Promise.all(pending);return result;
};
