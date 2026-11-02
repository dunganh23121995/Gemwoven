/* Adapt the pure boss state to existing combat choreography and real HP. */
const expeditionRules=window.GemwovenBossTactics,expeditionCatalog=window.GemwovenBossChapters;
let expeditionState=null;
const expeditionDef=progressionBattle?.tactical?expeditionCatalog.byId[progressionBattle.bossId]:null;
function expeditionCollect(type){if(expeditionState)expeditionRules.collect(expeditionState,expeditionDef,type);}
const expeditionStart=startStage;
startStage=function(){
  expeditionState=null;
  expeditionStart();
  if(!expeditionDef||progressionError)return;
  const own=progressionBattle.tier==='boss'?null:progressionBattle.tier==='elite'&&progressionRules.WORLD.ELITE_BASIC[progressionBattle.creature]?[...progressionRules.WORLD.tacticalElite(progressionBattle.creature),...(progressionBattle.eliteUlt?progressionBattle.skillSet.filter(s=>s.ult):[])]:(progressionBattle.skillSet||[]).map(progressionRules.WORLD.tacticalSkill);
  expeditionState=expeditionRules.create(expeditionDef,{rank:progressionBattle.counter?.rank||0,heroMax:HEROES[state.key].hp,bossMax:state.enemyMax,tier:progressionBattle.tier,variant:progressionBattle.variant,skills:own?.length?own:null});
  document.body.classList.add('expedition-combat');plannedIntent=intent();update();
};
const expeditionApplyDamage=applyCombatDamage;
applyCombatDamage=function(target,n){
  if(!expeditionState||target!=='enemy')return expeditionApplyDamage(target,n);
  // Blows on the summoned guards are shown on the front one (its number, a flinch, its bar), and the first
  // time the player learns that the guards fall before the boss can be hurt.
  const guardsBefore=expeditionState.addHp,front=$('foeGuards')?.querySelector('.foe-guard:not(.falling)');
  const intercepted=expeditionRules.incoming(expeditionState,expeditionDef,n),result=expeditionApplyDamage(target,intercepted.amount);
  const onGuards=Math.round(guardsBefore-expeditionState.addHp);
  if(onGuards>0){foeGuardStruck(front,onGuards);if(!expeditionState.guardHint){expeditionState.guardHint=true;message('Hộ vệ chắn trước boss · hạ hết hộ vệ mới đánh được boss!');}}
  expeditionGuardOnly=onGuards>0&&!intercepted.amount&&intercepted.absorbed-onGuards<1;
  if(expeditionState.channel)expeditionState.channel.damage=Math.max(0,expeditionState.channel.damage-result.blocked);
  result.blocked+=intercepted.absorbed;return result;
};
// While summoned guards stand, the hero's basic attack runs at the front guard (its point stands in for the
// boss's) and the boss does not flinch from a blow the guards took.
let expeditionAiming=null;
const expeditionPoint=combatV3Point;
combatV3Point=function(side){
  if(side!=='enemy'||!expeditionAiming?.isConnected)return expeditionPoint(side);
  const scene=$('scene').getBoundingClientRect(),r=expeditionAiming.getBoundingClientRect();
  return {x:r.left-scene.left+r.width*.5,y:r.top-scene.top+r.height*.62,foot:r.bottom-scene.top-r.height*.06,width:r.width,height:r.height};
};
const expeditionAction=combatV3Action;
combatV3Action=function(side,action,...rest){if(side==='enemy'&&action==='hurt'&&expeditionAiming&&expeditionState?.addHp>0)return;return expeditionAction(side,action,...rest);};
const expeditionAttack=attack;
attack=async function(side,raw,options={}){
  const front=side==='hero'&&!options.ultimate&&expeditionState?.addHp>0?$('foeGuards')?.querySelector('.foe-guard:not(.falling)'):null;
  if(!front)return expeditionAttack(side,raw,options);
  expeditionAiming=front;try{return await expeditionAttack(side,raw,options);}finally{expeditionAiming=null;}
};
// A blow the guards took whole shows its number over the guard (foeGuardStruck), not "CHẶN" on the boss.
let expeditionGuardOnly=false;
const expeditionNumber=combatV3Number;
combatV3Number=function(side,text,...rest){
  if(side==='enemy'&&expeditionGuardOnly&&/^CHẶN /.test(String(text))){expeditionGuardOnly=false;return;}
  return expeditionNumber(side,text,...rest);
};
const expeditionIntent=intent;
intent=function(){
  if(!expeditionState)return expeditionIntent();
  const next=expeditionRules.forecast(expeditionState,expeditionDef);
  return {kind:next.channel?'skill':'board',name:next.name,icon:ELEMENTS[state.enemyKey].icon,detail:next.description};
};
async function expeditionEnemyTurn(){
  if(!expeditionState||state.hp<=0||state.enemyHp<=0)return;
  const skipAction=state.frozen||state.stunned||state.noriStunTurns>0;
  if(state.noriStunTurns>0)await consumeNoriStunTurn();
  if(skipAction){state.frozen=false;state.stunned=false;message('Ngắt nhịp đối thủ · cơ chế môi trường vẫn tiếp diễn.');}
  turn='enemy';
  const events=expeditionRules.advance(expeditionState,expeditionDef,state.enemyHp/state.enemyMax,{skipAction}),base=(progressionBattle.enemySkillBase??(progressionBattle.boss?30:18))*(progressionBattle.boss?.45:1); // expedition bosses act every turn (plus hazards), so each hit carries less than a classic boss skill
  // Hits that belong to a cast skill are staged with the foe's own effect (foe-skills.js).
  const skills=[...(expeditionState.own||[]),...expeditionDef.skills];let casting=null;
  for(const e of events){
    if(state.hp<=0||state.enemyHp<=0)break;
    if(e.type==='phase'){message(expeditionDef.name+' · '+expeditionDef.phaseNames[e.phase-1]);actor('enemy').dataset.bossPhase=e.phase;await combatParticles('enemy',state.enemyKey,12);}
    if(e.type==='cast'){
      message(progressionBattle.enemyName+' · '+e.name);popActorSkill('enemy',e.name,true,[]);setSpriteAction('enemy','cast',760);
      casting=skills.find(s=>s.name===e.name)||null;
      if(casting?.ult)popActorSkill('enemy','TUYỆT CHIÊU',true,[]);
      // A boss skill with its own look draws it once: with its hits, or here when it lands none.
      if(casting&&bossSkillLook(casting)){
        const shield=casting.effects?.some(x=>x.type==='ward'),heal=casting.effects?.some(x=>x.type==='heal');
        if(!casting.effects?.some(x=>x.type==='hit'||x.type==='burst'))await foeSkillStrike({name:casting.name,move:casting.move,shield,heal},0,0);
        // The shell it raised circles it as its own armour plates while the shell holds.
        if(shield)foeGuardAura(bossSkillLook(casting),()=>expeditionState?.ward>0||state.enemyArmor>0);
      }
      else if(casting?.effects?.some(x=>x.type==='ward'||x.type==='heal'))await foeSkillAura();
    }
    if(e.type==='windup'){message('Đang niệm '+e.name+'! Phá niệm trong lượt kế tiếp.');const look=bossSkillLook(skills.find(s=>s.name===e.name));if(look?.channel)await foeChannel(look);await floating('enemy','NIỆM CHIÊU','armor');}
    if(e.type==='interrupt'){message('Đã phá '+e.name+' · Lộ điểm yếu!');await floating('enemy','PHÁ NIỆM','good');}
    if(e.type==='hazard'){
      // Persistent theme damage bypasses armor, but retains the saved defense.
      const armor=state.armor;state.armor=0;const result=applyCombatDamage('hero',Math.round(e.amount*(1-progressionBattle.stats.defense)));state.armor=armor;
      await floating('hero',expeditionDef.status+' −'+result.amount);
    }
    if(e.type==='hit'||e.type==='burst'){
      if(casting&&!e.addAttack&&expeditionState.tier!=='normal')await foeSkillStrike({name:casting.name,kind:casting.kind,move:casting.move},base*e.power,e.hits||1);
      else if(e.addAttack)await foeGuardsAttack(base*e.power);
      else await attack('enemy',base*e.power,{hits:e.hits||1});
    }
    if(e.type==='heal')await buff('enemy','heal',Math.round(state.enemyMax*e.pct),{plain:!!(casting&&bossSkillLook(casting))});
    if(e.type==='status')await applyFoeStatus(e,base);
    if(e.type==='drain')state.energy=Math.max(0,state.energy-e.amount);
    if(e.type==='shatter')state.armor=Math.max(0,Math.round(state.armor*(1-e.fraction)));
    update();
  }
  if(state.hp>0&&state.enemyHp>0)await tickNoriRenewal();
  state.enemyEnergy=Math.min(99,Math.round(expeditionState.gauge));plannedIntent=intent();update();
}
function expeditionHud(){
  if(!expeditionState)return;
  const t=expeditionState,d=expeditionDef,f=expeditionRules.forecast(t,d);
  let panel=$('expeditionHud');
  if(!panel){panel=document.createElement('section');panel.id='expeditionHud';panel.className='expedition-hud';panel.setAttribute('aria-label','Cơ chế chủ đề');$('message').after(panel);}
  const relic=ART.counterItems?.[d.theme],stars=progressionBattle.counter?.shards||0;
  panel.innerHTML=`<div class="expedition-phase"><b>${d.phaseNames[t.phase-1]} · ${t.turn} lượt</b><span>${d.status} <strong>${t.stacks}/5</strong></span></div><div class="expedition-gauge"><label>${d.gauge} ${Math.round(t.gauge)}%</label><meter min="0" max="100" value="${t.gauge}"></meter></div><div class="expedition-counter">${relic?`<img src="${relic}" alt="">`:''}<span>${d.counter} · ${stars}/12 mảnh<br><b>${t.rank?'Giảm '+Math.round(expeditionRules.resist(t)*100)+'% cơ chế chủ đề':'Chưa có khắc chế · Có thể quay lại tinh anh'}</b></span></div><div class="expedition-pools"><span>Vỏ bảo hộ ${Math.ceil(t.ward)}</span><span>Hộ vệ ${Math.ceil(t.addHp)}/${Math.ceil(t.addMax)}</span></div><p class="expedition-forecast ${f.channel?'channeling':''}"><b>${f.name}</b> · ${f.description}</p>`;
  let minions=$('expeditionMinions');if(!minions){minions=document.createElement('div');minions.id='expeditionMinions';minions.className='expedition-minions';$('scene').append(minions);}
  minions.replaceChildren();
  // The boss's own guards stand on the stage (foe-skills.js); the elites' portraits are the fallback.
  if(ART.bossFx?.[foeSkillOwner()?.boss+'/minion'])foeGuardsRender(t.addHp>0?t.adds:[]);
  else if(t.addHp>0)for(const [id,name]of d.elites.slice(0,2)){const art=ART.campaignCreatures?.[d.theme+'-'+id],src=art?.portrait||art?.src;if(!src)continue;const image=document.createElement('img');image.src=src;image.alt=name;minions.append(image);}
}
const expeditionUpdate=update;
update=function(){expeditionUpdate();expeditionHud();};
