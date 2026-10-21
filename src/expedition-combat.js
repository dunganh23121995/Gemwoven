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
  expeditionState=expeditionRules.create(expeditionDef,{rank:progressionBattle.counter?.rank||0,heroMax:HEROES[state.key].hp,bossMax:state.enemyMax,tier:progressionBattle.tier,variant:progressionBattle.variant});
  document.body.classList.add('expedition-combat');plannedIntent=intent();update();
};
const expeditionApplyDamage=applyCombatDamage;
applyCombatDamage=function(target,n){
  if(!expeditionState||target!=='enemy')return expeditionApplyDamage(target,n);
  const intercepted=expeditionRules.incoming(expeditionState,expeditionDef,n),result=expeditionApplyDamage(target,intercepted.amount);
  if(expeditionState.channel)expeditionState.channel.damage=Math.max(0,expeditionState.channel.damage-result.blocked);
  result.blocked+=intercepted.absorbed;return result;
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
  for(const e of events){
    if(state.hp<=0||state.enemyHp<=0)break;
    if(e.type==='phase'){message(expeditionDef.name+' · '+expeditionDef.phaseNames[e.phase-1]);actor('enemy').dataset.bossPhase=e.phase;await combatParticles('enemy',state.enemyKey,12);}
    if(e.type==='cast'){message(progressionBattle.enemyName+' · '+e.name);popActorSkill('enemy',e.name,true,[]);setSpriteAction('enemy','cast',760);}
    if(e.type==='windup'){message('Đang niệm '+e.name+'! Phá niệm trong lượt kế tiếp.');await floating('enemy','NIỆM CHIÊU','armor');}
    if(e.type==='interrupt'){message('Đã phá '+e.name+' · Lộ điểm yếu!');await floating('enemy','PHÁ NIỆM','good');}
    if(e.type==='hazard'){
      // Persistent theme damage bypasses armor, but retains the saved defense.
      const armor=state.armor;state.armor=0;const result=applyCombatDamage('hero',Math.round(e.amount*(1-progressionBattle.stats.defense)));state.armor=armor;
      await floating('hero',expeditionDef.status+' −'+result.amount);
    }
    if(e.type==='hit'||e.type==='burst')await attack('enemy',base*e.power,{hits:e.hits||1});
    if(e.type==='heal')await buff('enemy','heal',Math.round(state.enemyMax*e.pct));
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
  if(t.addHp>0)for(const [id,name]of d.elites){const src=ART.campaignCreatures?.[d.theme+'-'+id]?.src;if(!src)continue;const image=document.createElement('img');image.src=src;image.alt=name;minions.append(image);}
}
const expeditionUpdate=update;
update=function(){expeditionUpdate();expeditionHud();};
