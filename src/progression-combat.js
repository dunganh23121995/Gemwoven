/* Connect the authored combat choreography to persistent progression. */
const progressionRules=window.GemwovenProgression;
const progressionSandbox=new URLSearchParams(location.search).has('qa')&&!new URLSearchParams(location.search).has('encounter');
let progressionVeil=0,progressionStore=null,progressionBattle=null,progressionError='',progressionReported=false,progressionReward={},progressionCasting=false,progressionTurn=0,progressionDot=null,progressionBossCast=0;
const progressionProcs=new Set();
let progressionEnemyDot=null,progressionEnemyCharge=1;
function progressionMusicKey(){const theme=progressionBattle?.music;return theme&&ART.music?.[theme]?theme:state.enemyKey;}
try{
  progressionStore=progressionRules.makeEngine(window.localStorage);
  if(!progressionSandbox){
    const token=new URLSearchParams(location.search).get('encounter');
    if(token){progressionBattle=progressionStore.pending();if(!progressionBattle||progressionBattle.token!==token)throw Error('Trận này đã kết thúc hoặc không còn hợp lệ. Hãy về thị trấn để vào trận mới.');}
    else{const p=progressionStore.read();progressionBattle=progressionStore.begin('boss',Math.max(1,p.boss.best+1));}
  }
}catch(error){progressionError=error.message;}
function progressionHeroKeys(){return progressionSandbox?Object.keys(HEROES):[progressionBattle?.hero||progressionStore?.read().selected||'novice'];}
function progressionInitialHero(fallback){return progressionSandbox?fallback:progressionHeroKeys()[0];}
function progressionSelectionIntro(fallback){return progressionBattle?progressionBattle.name+' · '+HEROES[progressionBattle.hero].name+' · Chỉ số theo bản lưu.':progressionError||fallback;}
// Every skill number comes from the shared kit (progression.js). Saves made before
// kits existed rebuild theirs from the stored ranks; the sandbox uses rank 1.
const progressionKits=new Map();
function progressionKit(key=state.key){
  if(progressionBattle&&key===progressionBattle.hero){
    const s=progressionBattle.stats;
    return s.kit||(s.kit=progressionRules.skillKit(key,{level:1,stars:s.stars||1,evolution:s.evolution||0,skills:s.skills||[1,0,0,0]}));
  }
  const form=progressionSandbox&&key===state.key?Math.max(1,Math.min(3,state.form||1)):1,id=key+':'+form;
  if(!progressionKits.has(id))progressionKits.set(id,progressionRules.skillKit(key,{level:1,stars:[1,4,6][form-1],evolution:0,skills:[1,0,0,0]}));
  return progressionKits.get(id);
}
function progressionHeal(amount){return progressionBattle?Math.round(amount*Math.max(1,Math.sqrt(progressionBattle.stats.attack))):amount;}
// Heart and shield tiles restore a share of the bearer's max HP, never less than
// the early flat 6 HP / 4–8 / 5 armour. Enemies use smaller shares: their HP pool
// is several times the hero's, so equal shares would out-heal a hero's damage.
const COMBAT_HEART_SHARE={hero:.012,enemy:.002},COMBAT_SHIELD_SHARE={hero:.015,enemy:.003};
function combatTileYield(side,type){
  const hero=side==='hero';
  if(progressionIsDuel())return type===1?progressionHeal(6):4;
  const max=hero?HEROES[state.key].hp:state.enemyMax;
  if(type===1)return Math.max(hero?progressionHeal(6):6,Math.round(max*COMBAT_HEART_SHARE[side]));
  const flat=hero?progressionKit().shieldGem:5;
  return Math.max(flat,Math.round(max*COMBAT_SHIELD_SHARE[side]*(hero?flat/4:1)));
}
// Status damage and silent HP/armour changes still get a readable number.
function progressionShowResult(side,result,label='',index=0){
  const pending=[];if(!result)return Promise.resolve();
  if(label&&(result.amount||result.blocked))popActorSkill(side,label,false,pending,{away:true});
  if(result.amount||result.blocked)combatV3Number(side,result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',index,pending);
  return Promise.all(pending);
}
function progressionShowGain(side,kind,amount){
  if(!(amount>0))return;
  const pending=[];combatV3Number(side,'+'+amount+(kind==='heal'?' HP':' GIÁP'),kind==='heal'?'heal':'armor',1,pending);
  // Heal and armour gains landing together stack instead of overlapping.
  const node=$('combatEffects').lastElementChild;if(node&&kind!=='heal')node.style.top=(parseFloat(node.style.top)+26)+'px';
}
function progressionIsDuel(){return progressionBattle?.mode==='duel';}
function progressionRecordTurn(){if(progressionBattle?.mode==='campaign')progressionTurn++;}
function progressionEnergyMultiplier(key){return progressionKit(key).energy*(typeof foeHas==='function'&&foeHas('chill')?1-foeStatuses.chill.value:1);}
function progressionSwordFactor(key){return progressionKit(key).sword;}
if(progressionBattle)HEROES[progressionBattle.hero].hp=progressionBattle.stats.hp;

const progressionOriginalVoices=combatVoice;
combatVoice=function(side,...args){if(progressionIsDuel()||side==='hero'&&state.key==='novice')return Promise.resolve(false);return progressionOriginalVoices(side,...args);};
const progressionOriginalStart=startStage;
startStage=function(){
  if(progressionError){$('startBtn').disabled=true;message(progressionError);return;}
  if(progressionBattle){state.key=progressionBattle.hero;state.enemyKey=progressionBattle.enemyKey;state.stage=Math.max(1,Math.ceil(progressionBattle.recommended/5));HEROES[state.key].hp=progressionBattle.stats.hp;}
  progressionOriginalStart();
  progressionProcs.clear();progressionTurn=0;progressionDot=null;progressionBossCast=0;progressionEnemyDot=null;progressionEnemyCharge=1;progressionVeil=0;delete actor('hero').dataset.veiled;
  if(progressionBattle){state.hp=HEROES[state.key].hp;state.boss=progressionBattle.boss;state.enemyMax=progressionIsDuel()?HEROES[state.key].hp:progressionBattle.mode==='pvp'?Math.round(HEROES[state.key].hp*1.15):progressionBattle.enemyHp;state.enemyHp=state.enemyMax;state.enemyEnergy=0;state.armor=0;state.energy=progressionKit().startEnergy;renderActors();update();message(progressionBattle.name+' · '+(progressionIsDuel()?'Hai người luân phiên; người 1 dùng bàn chính, người 2 chọn trong bảng chuyển lượt.':progressionBattle.mode==='pvp'?'Đấu tập AI; chỉ số chuẩn hóa.':'Chiến thắng để nhận vàng và nguyên liệu.'));}
};
const progressionOriginalRender=renderActors;
renderActors=function(){
  progressionOriginalRender();
  if(progressionIsDuel()){
    const enemy=actor('enemy');enemy.classList.add('duel-facing-left');enemy.dataset.facing='-1';
    const sprite=enemy.querySelector('.sprite-body');updateActorHead(sprite,sprite.dataset.action,+sprite.dataset.frame);
  }
  if(!progressionBattle)return;
  const root=actor('hero'),evolution=Math.max(0,Math.min(6,progressionBattle.stats.evolution|0));root.dataset.evolution=evolution;
  // Evolution reads as light around the current form instead of armour pasted
  // over faces: a back-glow, a ground sigil and rising motes grow with each tier.
  const sheet=spriteDefinition('hero',state.key,'idle').sheet,bodyHeight=sheet.bodyHeight||.75,foot=sheet.footY||.94,centre=sheet.bodyX||sheet.heads?.[0]?.[0];
  root.style.setProperty('--evo-top',String(Math.max(0,foot-bodyHeight)));root.style.setProperty('--evo-h',String(bodyHeight));root.style.setProperty('--evo-x',String(centre?centre/256:.5));
  if(!evolution)return;
  const glow=document.createElement('span');glow.className='combat-evo-glow tier-'+evolution;glow.setAttribute('aria-hidden','true');glow.style.setProperty('--tier',String(evolution));
  glow.innerHTML='<i class="evo-halo"></i><i class="evo-ring"></i>'+Array.from({length:evolution>=3?evolution:0},(_,i)=>`<b style="--i:${i}"></b>`).join('');
  root.prepend(glow);
  if(evolution>=6&&ART.evolution?.aura){const aura=document.createElement('img');aura.className='combat-evo combat-evo-aura';aura.src=ART.evolution.aura;aura.alt='';aura.setAttribute('aria-hidden','true');root.prepend(aura);}
};
const progressionOriginalUpdate=update;
update=function(){progressionOriginalUpdate();if(progressionBattle){$('stageLabel').textContent=progressionBattle.name;$('footerStage').textContent=progressionBattle.name;const index=progressionBattle.index,start=Math.floor((index-1)/5)*5;$('journeyTrack').innerHTML=Array.from({length:5},(_,i)=>{const n=start+i+1;return (i?'<span class="journey-line"></span>':'')+'<span class="journey-step '+(n===index?'active':n<index?'done':'')+'" aria-label="Chặng '+n+'">'+(n<index?'✓':n)+'</span>';}).join('');}};
const progressionOriginalDetail=showHeroDetail;
showHeroDetail=function(){
  progressionOriginalDetail();if(!progressionBattle)return;
  const s=progressionBattle.stats,key=progressionBattle.hero,kit=progressionKit(key),save={level:1,stars:s.stars||1,evolution:s.evolution||0,skills:kit.ranks};
  const sword=8*s.attack*kit.sword*kit.attackScale;
  const values=[['HP tối đa',s.hp+' HP'],['Sát thương / ngọc kiếm',sword.toFixed(1)],['Giáp / ngọc khiên',String(combatTileYield('hero',4))],['Hồi máu / ngọc tim',combatTileYield('hero',1)+' HP']];
  $('heroDetailStats').innerHTML=values.map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
  $('heroSkillName').textContent=HEROES[key].skill;$('heroSkillDescription').textContent=progressionRules.skillText(key,save,0).description;
  $('heroDetailTrait').textContent=progressionRules.skillText(key,save,1).description+(key==='lightning'?' Luôn lơ lửng khi còn sống.':'');
  $('heroStatNote').textContent=progressionBattle.mode==='pvp'||progressionIsDuel()?'Đấu tập dùng chỉ số chuẩn hóa: kỹ năng cấp 1, không trang bị.':'Chỉ số đã tính cấp, sao, tiến hóa, kỹ năng và trang bị của trận này; sát thương còn chịu khắc hệ và liên hoàn.';
};
const progressionOriginalDamage=damage;
// Six-star Noct: a veiled hero takes nothing from the enemy, and the ultimate's cuts ignore armour.
damage=function(side,raw,ledger=null){
  if(side==='enemy'&&progressionVeil>0)return progressionOriginalDamage(side,0,ledger);
  if(side!=='hero'||!progressionCasting||!progressionKit().pierceArmor)return progressionDamage(side,raw,ledger);
  const armor=state.enemyArmor;state.enemyArmor=0;
  try{return progressionDamage(side,raw,ledger);}finally{state.enemyArmor=armor;}
};
const progressionOriginalNumber=combatV3Number;
combatV3Number=function(side,text,kind,...rest){
  if(side==='hero'&&progressionVeil>0&&/^(CHẶN 0|-0)$/.test(String(text)))return progressionOriginalNumber(side,'NÉ','armor',...rest);
  return progressionOriginalNumber(side,text,kind,...rest);
};
function progressionDamage(side,raw,ledger=null){
  if(!progressionBattle)return progressionOriginalDamage(side,raw,ledger);
  const s=progressionBattle.stats,kit=progressionKit(progressionBattle.hero);
  let factor=side==='hero'?s.attack*(progressionCasting?kit.power:1):progressionIsDuel()?s.attack:progressionBattle.mode==='pvp'?1.8:progressionBattle.enemyAttack;
  if(side==='hero'&&progressionCasting&&kit.execute&&state.enemyHp<state.enemyMax*kit.execute.threshold)factor*=kit.execute.bonus;
  let bypassed=0;
  if(side==='hero'&&s.affixes.includes('pierce')&&!progressionProcs.has('pierce')&&Math.random()<.08){progressionProcs.add('pierce');bypassed=Math.floor(state.enemyArmor*.5);state.enemyArmor-=bypassed;}
  const iceReduction=side==='enemy'?1-progressionKit().damageReduction:1;
  const defenseMultiplier=Math.max(.5,(1-s.defense)*iceReduction)/iceReduction;
  const result=progressionOriginalDamage(side,raw*factor*(side==='enemy'?defenseMultiplier:1),ledger);
  if(bypassed)state.enemyArmor+=bypassed;
  if(side==='hero'&&result.amount>0){
    if(s.affixes.includes('lifesteal')&&state.hp>0){const gained=Math.min(HEROES[state.key].hp-state.hp,Math.floor(result.amount*.06));state.hp+=gained;progressionShowGain('hero','heal',gained);}
    if(s.affixes.includes('stun')&&!progressionProcs.has('stun')&&Math.random()<.12&&state.enemyHp>0){progressionProcs.add('stun');state.stunned=true;message('Chấn kích · Mục tiêu mất lượt kế tiếp.');}
  }
  update();return result;
}
const progressionOriginalUltimate=heroUltimate;
heroUltimate=async function(){
  progressionCasting=true;
  try{
    const kit=progressionKit();
    if(state.key==='novice'){
      const pending=[];popActorSkill('hero',HEROES.novice.skill,true,pending);setSpriteAction('hero','cast',700);await wait(reduced?0:350);await attack('hero',kit.base,{hits:kit.hits});await Promise.all(pending);
    }else await progressionOriginalUltimate();
    const attackStat=progressionBattle?.stats.attack||1;
    // Mika's burn comes from Biến Dị or her third form; the other effects need Biến Dị.
    if(state.enemyHp>0&&state.hp>0&&(kit.mutation||kit.burn)){
      if(kit.burn){progressionDot={turns:kit.burn.turns,amount:Math.max(1,Math.round(kit.burn.base*attackStat))};popActorSkill('enemy','THIÊU ĐỐT · '+kit.burn.turns+' LƯỢT',false);}
      if(kit.mutation&&(state.key==='ice'||state.key==='earth')){const before=state.armor;state.armor=Math.min(combatArmorCap('hero'),state.armor+Math.round(HEROES[state.key].hp*kit.mutationArmor));progressionShowGain('hero','armor',state.armor-before);}
      if(kit.mutation&&state.key==='lightning'){state.enemyEnergy=Math.max(0,state.enemyEnergy-kit.drain);state.energy=Math.min(99,state.energy+kit.energyReturn);}
      if(kit.mutation&&state.key==='shadow')await progressionShowResult('enemy',applyCombatDamage('enemy',Math.round(kit.echo*attackStat)),'TÀN ẢNH',1);
      update();
    }
    if(kit.veil&&state.hp>0&&state.enemyHp>0){progressionVeil=kit.veil;actor('hero').dataset.veiled='true';popActorSkill('hero','HÓA MỜ',false);playNoctSound('veil',{volume:.3});}
  }finally{progressionCasting=false;}
};
const progressionOriginalEnemy=enemyAction;
enemyAction=async function(){
  if(progressionIsDuel()){
    if(state.hp<=0||state.enemyHp<=0)return;turn='enemy';update();await castReadyUltimates();if(state.hp<=0||state.enemyHp<=0)return;
    if(state.frozen||state.stunned){state.frozen=false;state.stunned=false;message('Người chơi 2 bị đóng băng, bỏ qua lượt.');return;}
    await opponentBoardTurn();await castReadyUltimates();plannedIntent=intent();return;
  }
  // While veiled, undo every harmful change the enemy turn makes (drain, new damage-over-time, freeze).
  const veiled=progressionVeil>0,guard={energy:state.energy,dot:progressionEnemyDot,statuses:Object.fromEntries(Object.entries(foeStatuses).map(([id,s])=>[id,{...s}]))};
  try{await progressionEnemyTurn();}finally{
    if(veiled){
      if(state.energy<guard.energy)state.energy=guard.energy;
      if(progressionEnemyDot&&progressionEnemyDot!==guard.dot)progressionEnemyDot=guard.dot?.turns>0?guard.dot:null;
      state.playerFrozen=false;
      for(const id of Object.keys(foeStatuses))if(FOE_STATUS[id]?.side==='hero'){if(guard.statuses[id])foeStatuses[id]=guard.statuses[id];else delete foeStatuses[id];}
      if(--progressionVeil<=0){progressionVeil=0;delete actor('hero').dataset.veiled;}
      update();
    }
  }
};
async function progressionEnemyTurn(){
  await tickFoeStatuses();if(state.hp<=0||state.enemyHp<=0)return;
  if(progressionDot?.turns>0&&state.enemyHp>0){progressionDot.turns--;const amount=progressionDot.amount;if(!progressionDot.turns)progressionDot=null;await progressionShowResult('enemy',applyCombatDamage('enemy',amount),'Thiêu đốt');}
  if(progressionEnemyDot&&state.hp>0){const dot=progressionEnemyDot;const result=damage('enemy',dot.raw);await progressionShowResult('hero',result,dot.name);if(--dot.turns<=0)progressionEnemyDot=null;if(state.hp<=0)return;}
  const act=()=>progressionBattle?.tactical&&typeof expeditionEnemyTurn==='function'?expeditionEnemyTurn():progressionOriginalEnemy();
  await act();
  while(foeHaste>0&&state.hp>0&&state.enemyHp>0){foeHaste--;message((progressionBattle?.enemyName||'Địch')+' hành động thêm một lượt!');await act();}
  if(!progressionBattle)return;
  const s=progressionBattle.stats;
  if(state.playerFrozen&&s.affixes.includes('steadfast')&&Math.random()<.25){state.playerFrozen=false;message('Bất động · Kháng mất lượt.');}
  if(state.hp>0&&state.enemyHp>0){
    if(s.affixes.includes('ward')){const before=state.armor;state.armor=Math.min(combatArmorCap('hero'),state.armor+Math.round(HEROES[state.key].hp*.03));progressionShowGain('hero','armor',state.armor-before);}
    const kit=progressionKit();if(kit.regen){const gained=Math.min(HEROES[state.key].hp-state.hp,Math.max(1,Math.round(HEROES[state.key].hp*kit.regen)));state.hp+=gained;progressionShowGain('hero','heal',gained);}
  }
  progressionProcs.clear();update();
}
const progressionOriginalFinish=finishBattle;
finishBattle=async function(){
  if(progressionBattle&&!progressionReported&&(state.hp<=0||state.enemyHp<=0)){
    progressionReported=true;
    try{progressionReward=progressionStore.settle(progressionBattle.token,state.hp>0,Math.max(0,state.enemyMax-state.enemyHp),{hpRatio:Math.max(0,Math.min(1,state.hp/HEROES[state.key].hp)),turns:Math.max(1,progressionTurn)});}catch(error){progressionReward={};message(error.message);}
  }
  const result=await progressionOriginalFinish();
  if(result&&progressionBattle){
    const text=Object.entries(progressionReward).filter(([,n])=>n>0).map(([id,n])=>`${n.toLocaleString('vi-VN')} ${progressionRules.RESOURCES[id][0]}`).join(' · ');
    $('resultDesc').textContent=state.hp>0?(text||'Hoàn tất trận đấu tập. Không có thưởng tài nguyên.'):'Thua trận; tiến độ đã vượt được giữ lại.';
    if(progressionBattle.mode==='campaign'&&state.hp>0){const turns=Math.max(1,progressionTurn),stars=progressionRules.stageStars(progressionBattle,true,{hpRatio:Math.max(0,Math.min(1,state.hp/HEROES[state.key].hp)),turns});$('resultTitle').textContent='★'.repeat(stars)+'☆'.repeat(3-stars)+' · Chiến Thắng';$('resultDesc').textContent+=' · '+turns+' lượt. Sao tốt nhất được giữ lại; nhận rương sao ở bản đồ chương.';}
    if(progressionReward.counterReward){const c=progressionReward.counterReward;$('resultDesc').textContent+=` · +3 mảnh ${c.name} (${c.shards}/12) · Khắc chế bậc ${c.rank}.`;}
    $('resultStage').textContent=String(progressionBattle.index);$('nextBtn').textContent=state.hp>0?'Trận kế tiếp':'Thử lại';
    if(progressionBattle.mode==='campaign'&&state.hp>0&&progressionBattle.index===progressionRules.WORLD.MAX_STAGES)$('nextBtn').textContent='Về bản đồ';
    if(progressionIsDuel()){$('resultTitle').textContent=state.hp>0?'Người chơi 1 thắng':'Người chơi 2 thắng';$('resultDesc').textContent='PvP cục bộ · Không trao tài nguyên hoặc điểm xếp hạng.';}
    if(!$('returnHub')){const a=document.createElement('a');a.id='returnHub';a.href='Gemwoven.html#'+(['pvp','duel'].includes(progressionBattle.mode)?'arena':progressionBattle.mode);a.textContent='Về thị trấn';a.className='progression-return';$('resultDialog').append(a);}
  }return result;
};
$('nextBtn').addEventListener('click',event=>{
  if(!progressionBattle)return;event.stopImmediatePropagation();
  const mode=progressionBattle.mode,won=state.hp>0,index=['pvp','duel'].includes(mode)?1:Math.min(mode==='campaign'?progressionRules.WORLD.MAX_STAGES:1000000,progressionBattle.index+(won?1:0));
  if(mode==='campaign'&&won&&progressionBattle.index===progressionRules.WORLD.MAX_STAGES){location.href='Gemwoven.html#campaign';return;}
  try{const next=progressionStore.begin(mode,index);location.href='Game.html?encounter='+encodeURIComponent(next.token);}catch(error){message(error.message);}
},true);
const progressionBack=document.createElement('a');progressionBack.href='Gemwoven.html#'+(['pvp','duel'].includes(progressionBattle?.mode)?'arena':progressionBattle?.mode||'home');progressionBack.textContent='← Thị trấn';progressionBack.className='progression-back';document.querySelector('.app-header')?.append(progressionBack);
if(progressionError){$('startBtn').disabled=true;progressionBack.textContent='Trận không hợp lệ · Về thị trấn';document.body.append(progressionBack);}

if(['campaign','boss'].includes(progressionBattle?.mode)){
  const battle=progressionBattle,key=battle.enemyKey,creature=ART.campaignCreatures?.[battle.creature];
  // Elites carry a looping idle plus a still pose for strikes; ordinary foes are one painting.
  if(creature)ART.enemies[key]=creature.idle?{idle:creature.idle,attack:creature.still,cast:creature.still,hurt:creature.still}:{idle:creature,attack:creature,cast:creature,hurt:creature};
  if(battle.boss&&ART.worldBosses?.[battle.bossId])ART.bosses[key]=ART.worldBosses[battle.bossId];
  const backdrop=progressionRules.WORLD.CHAPTERS[battle.chapter-1]?.backdrop||battle.theme;
  // The chapter's vista belongs only to the distant layer. Keep the authored
  // horizontal fighting terrace and foreground instead of a vertical map crop.
  if(ART.worldScenes?.[backdrop])ART.chapterVista=ART.worldScenes[backdrop];
  MONSTERS[key]={...MONSTERS[key],name:battle.enemyName,boss:battle.enemyName,skill:battle.skills[0],support:'Hộ Giáp',heal:'Hồi Sức'};
  const campaignSkill=enemySkill;
  enemySkill=async function({reserved=false}={}){
    if(progressionBattle?.tactical)return;
    if(!progressionBattle||!['campaign','boss'].includes(progressionBattle.mode))return campaignSkill({reserved});
    if(!reserved)state.enemyEnergy=0;
    const phase=progressionBossCast++%battle.skills.length;
    // Flat skill base: level scaling lives only in enemyAttack (progression.js).
    const skill=battle.skillSet?.[phase],base=battle.enemySkillBase??(battle.boss?30:18);
    if(!skill){const name=battle.skills[phase];message(battle.enemyName+' dùng '+name);popActorSkill('enemy',name,true,[]);await attack('enemy',base);}
    else{
      const charge=progressionEnemyCharge;progressionEnemyCharge=1;
      await castFoeSkill(skill,base,{charge});
      if(skill.kind==='burn'||skill.kind==='poison')progressionEnemyDot={name:skill.kind==='burn'?'Thiêu đốt':'Độc',turns:skill.turns,raw:base*skill.dot};
      if(skill.charge)progressionEnemyCharge=skill.charge;
    }
    MONSTERS[key].skill=battle.skills[progressionBossCast%battle.skills.length];update();
  };
}

if(progressionIsDuel()){
  // Both players use the novice with identical normalized stats and tile yields.
  ART.enemies.fire=ART.heroes.novice;MONSTERS.fire={...MONSTERS.fire,name:'Người chơi 2 · Tân',skill:'Nhát Kiếm Cơ Bản',attack:'Kiếm gỗ'};MONSTERS.novice=MONSTERS.fire;ELEMENTS.fire={...ELEMENTS.novice};
  const aiMove=chooseEnemyMove;
  chooseEnemyMove=async function(){
    if(!progressionIsDuel())return aiMove();
    const moves=legalMoves();if(!moves.length)return null;
    const modal=document.createElement('dialog');modal.className='duel-dialog';modal.setAttribute('aria-label','Lượt người chơi 2');
    const title=document.createElement('h2');title.textContent='Người chơi 2 · Chọn hai ngọc kề nhau';modal.append(title);
    const note=document.createElement('p');note.textContent='Bàn ngọc chung · Ghép 3 trở lên để thực hiện nước đi.';modal.append(note);
    const grid=document.createElement('div');grid.className='duel-board';modal.append(grid);const exit=document.createElement('a');exit.href='Gemwoven.html#arena';exit.textContent='Thoát trận · Về đấu trường';exit.className='progression-return';modal.append(exit);document.body.append(modal);
    return new Promise(resolve=>{
      let selected=null;modal.addEventListener('cancel',e=>e.preventDefault());
      for(const tile of all()){
        const b=document.createElement('button');b.type='button';b.className='duel-tile';b.setAttribute('aria-label',`Hàng ${tile.r+1} cột ${tile.c+1}`);b.dataset.r=tile.r;b.dataset.c=tile.c;
        const art=document.createElement('img');art.src=itemImage(tile.type<0?2:tile.type);art.alt='';b.append(art);if(tile.special){const badge=document.createElement('small');badge.textContent=tile.special==='core'?'✦':tile.special==='bomb'?'●':'★';b.append(badge);}
        grid.append(b);b.addEventListener('click',()=>{
          if(!selected){selected=tile;b.classList.add('chosen');return;}
          const move=moves.find(m=>m.a===selected&&m.b===tile||m.b===selected&&m.a===tile);
          if(move){modal.close();modal.remove();resolve({...move,reason:'Người chơi 2 tự chọn'});return;}
          for(const n of grid.children)n.classList.remove('chosen');selected=tile;b.classList.add('chosen');note.textContent='Cặp trước chưa tạo được ghép. Chọn một ngọc kề để nối từ 3 ngọc.';
        });
      }modal.showModal();
    });
  };
  const duelEnemySkill=enemySkill;
  enemySkill=async function({reserved=false}={}){if(!progressionIsDuel())return duelEnemySkill({reserved});if(!reserved){if(state.enemyEnergy<100)return;state.enemyEnergy-=100;}return attack('enemy',45,{hits:1});};
}
