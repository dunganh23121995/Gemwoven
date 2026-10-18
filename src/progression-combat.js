/* Connect the authored combat choreography to persistent progression. */
const progressionRules=window.GemwovenProgression;
const progressionSandbox=new URLSearchParams(location.search).has('qa')&&!new URLSearchParams(location.search).has('encounter');
let progressionStore=null,progressionBattle=null,progressionError='',progressionReported=false,progressionReward={},progressionCasting=false,progressionTurn=0,progressionDot=0,progressionBossCast=0;
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
function progressionPassiveEnabled(key){return !progressionBattle||key!==progressionBattle.hero||progressionBattle.stats.skills[1]>0;}
function progressionHeal(amount){return progressionBattle?Math.round(amount*Math.max(1,Math.sqrt(progressionBattle.stats.attack))):amount;}
function progressionIsDuel(){return progressionBattle?.mode==='duel';}
function progressionRecordTurn(){if(progressionBattle?.mode==='campaign')progressionTurn++;}
function progressionEnergyMultiplier(key){if(key!=='lightning'||!progressionPassiveEnabled(key))return 1;return progressionBattle?2+.05*Math.max(0,progressionBattle.stats.skills[1]-1):2;}
if(progressionBattle)HEROES[progressionBattle.hero].hp=progressionBattle.stats.hp;

const progressionOriginalVoices=combatVoice;
combatVoice=function(side,...args){if(progressionIsDuel()||side==='hero'&&state.key==='novice')return Promise.resolve(false);return progressionOriginalVoices(side,...args);};
const progressionOriginalStart=startStage;
startStage=function(){
  if(progressionError){$('startBtn').disabled=true;message(progressionError);return;}
  if(progressionBattle){state.key=progressionBattle.hero;state.enemyKey=progressionBattle.enemyKey;state.stage=Math.max(1,Math.ceil(progressionBattle.recommended/5));HEROES[state.key].hp=progressionBattle.stats.hp;}
  progressionOriginalStart();
  progressionProcs.clear();progressionTurn=0;progressionDot=0;progressionBossCast=0;progressionEnemyDot=null;progressionEnemyCharge=1;
  if(progressionBattle){state.hp=HEROES[state.key].hp;state.boss=progressionBattle.boss;state.enemyMax=progressionIsDuel()?HEROES[state.key].hp:progressionBattle.mode==='pvp'?Math.round(HEROES[state.key].hp*1.15):progressionBattle.enemyHp;state.enemyHp=state.enemyMax;state.enemyEnergy=0;state.armor=0;state.energy=0;renderActors();update();message(progressionBattle.name+' · '+(progressionIsDuel()?'Hai người luân phiên; người 1 dùng bàn chính, người 2 chọn trong bảng chuyển lượt.':progressionBattle.mode==='pvp'?'Đấu tập AI; chỉ số chuẩn hóa.':'Chiến thắng để nhận vàng và nguyên liệu.'));}
};
const progressionOriginalRender=renderActors;
renderActors=function(){
  progressionOriginalRender();
  if(progressionIsDuel()){
    const enemy=actor('enemy');enemy.classList.add('duel-facing-left');enemy.dataset.facing='-1';
    const sprite=enemy.querySelector('.sprite-body');updateActorHead(sprite,sprite.dataset.action,+sprite.dataset.frame);
  }
  if(!progressionBattle)return;
  const root=actor('hero');root.dataset.evolution=progressionBattle.stats.evolution;
  for(const e of progressionRules.EVOLUTION.slice(0,progressionBattle.stats.evolution)){
    const piece=document.createElement('img');piece.className='combat-evo combat-evo-'+e.piece;piece.src=ART.evolution[e.piece];piece.alt='';piece.setAttribute('aria-hidden','true');root.append(piece);
  }
};
const progressionOriginalUpdate=update;
update=function(){progressionOriginalUpdate();if(progressionBattle){$('stageLabel').textContent=progressionBattle.name;$('footerStage').textContent=progressionBattle.name;const index=progressionBattle.index,start=Math.floor((index-1)/5)*5;$('journeyTrack').innerHTML=Array.from({length:5},(_,i)=>{const n=start+i+1;return (i?'<span class="journey-line"></span>':'')+'<span class="journey-step '+(n===index?'active':n<index?'done':'')+'" aria-label="Chặng '+n+'">'+(n<index?'✓':n)+'</span>';}).join('');}};
const progressionOriginalDetail=showHeroDetail;
showHeroDetail=function(){
  progressionOriginalDetail();if(!progressionBattle)return;
  const s=progressionBattle.stats,key=progressionBattle.hero;
  const sword=8*s.attack*(key==='fire'&&progressionPassiveEnabled(key)?1.6:key==='earth'?.6:1);
  const values=[['HP tối đa',s.hp+' HP'],['Sát thương / ngọc kiếm',sword.toFixed(1)],['Giáp / ngọc khiên',key==='ice'&&progressionPassiveEnabled(key)?'8':'4'],['Hồi máu / ngọc tim',progressionHeal(6)+' HP']];
  $('heroDetailStats').innerHTML=values.map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
  $('heroStatNote').textContent='Chỉ số đã tính cấp, sao, tiến hóa và trang bị của trận này; sát thương còn chịu khắc hệ và liên hoàn.';
};
const progressionOriginalDamage=damage;
damage=function(side,raw,ledger=null){
  if(!progressionBattle)return progressionOriginalDamage(side,raw,ledger);
  const s=progressionBattle.stats;
  const factor=side==='hero'?s.attack*(progressionCasting?s.active:1):progressionIsDuel()?s.attack:progressionBattle.mode==='pvp'?1.8:progressionBattle.enemyAttack;
  let bypassed=0;
  if(side==='hero'&&s.affixes.includes('pierce')&&!progressionProcs.has('pierce')&&Math.random()<.08){progressionProcs.add('pierce');bypassed=Math.floor(state.enemyArmor*.5);state.enemyArmor-=bypassed;}
  const iceReduction=side==='enemy'&&state.key==='ice'&&progressionPassiveEnabled('ice')?.8:1;
  const defenseMultiplier=Math.max(.5,(1-s.defense)*iceReduction)/iceReduction;
  const result=progressionOriginalDamage(side,raw*factor*(side==='enemy'?defenseMultiplier:1),ledger);
  if(bypassed)state.enemyArmor+=bypassed;
  if(side==='hero'&&result.amount>0){
    if(s.affixes.includes('lifesteal'))state.hp=Math.min(HEROES[state.key].hp,state.hp+Math.floor(result.amount*.06));
    if(s.affixes.includes('stun')&&!progressionProcs.has('stun')&&Math.random()<.12&&state.enemyHp>0){progressionProcs.add('stun');state.stunned=true;message('Chấn kích · Mục tiêu mất lượt kế tiếp.');}
  }
  update();return result;
};
const progressionOriginalUltimate=heroUltimate;
heroUltimate=async function(){
  progressionCasting=true;
  try{
    if(state.key==='novice'){
      const pending=[];popActorSkill('hero','Nhát Kiếm Cơ Bản',true,pending);setSpriteAction('hero','cast',700);await wait(reduced?0:350);await attack('hero',45,{hits:1});await Promise.all(pending);
    }else await progressionOriginalUltimate();
    if(progressionBattle?.stats.mutation&&state.enemyHp>0){
      const rank=progressionBattle.stats.skills[2];
      if(state.key==='fire')progressionDot=2;
      if(state.key==='ice')state.armor=Math.min(999,state.armor+Math.round(HEROES.ice.hp*.06));
      if(state.key==='earth')state.armor=Math.min(999,state.armor+Math.round(HEROES.earth.hp*.04));
      if(state.key==='lightning'){state.enemyEnergy=Math.max(0,state.enemyEnergy-20-rank);state.energy=Math.min(99,state.energy+5);}
      if(state.key==='shadow')applyCombatDamage('enemy',Math.round((12+rank*3)*progressionBattle.stats.attack));
      update();
    }
  }finally{progressionCasting=false;}
};
const progressionOriginalEnemy=enemyAction;
enemyAction=async function(){
  if(progressionIsDuel()){
    if(state.hp<=0||state.enemyHp<=0)return;turn='enemy';update();await castReadyUltimates();if(state.hp<=0||state.enemyHp<=0)return;
    if(state.frozen||state.stunned){state.frozen=false;state.stunned=false;message('Người chơi 2 bị đóng băng, bỏ qua lượt.');return;}
    await opponentBoardTurn();await castReadyUltimates();plannedIntent=intent();return;
  }
  if(progressionBattle&&progressionDot>0&&state.enemyHp>0){progressionDot--;const amount=Math.round(8*progressionBattle.stats.attack*(1+progressionBattle.stats.skills[2]*.1));applyCombatDamage('enemy',amount);await floating('enemy','Thiêu đốt −'+amount);}
  if(progressionEnemyDot&&state.hp>0){const dot=progressionEnemyDot;const result=damage('enemy',dot.raw);await floating('hero',dot.name+' −'+result.amount);if(--dot.turns<=0)progressionEnemyDot=null;if(state.hp<=0)return;}
  if(progressionBattle?.tactical&&typeof expeditionEnemyTurn==='function')await expeditionEnemyTurn();else await progressionOriginalEnemy();
  if(!progressionBattle)return;
  const s=progressionBattle.stats;
  if(state.playerFrozen&&s.affixes.includes('steadfast')&&Math.random()<.25){state.playerFrozen=false;message('Bất động · Kháng mất lượt.');}
  if(state.hp>0&&state.enemyHp>0){
    if(s.affixes.includes('ward'))state.armor=Math.min(999,state.armor+Math.round(HEROES[state.key].hp*.03));
    if(state.key==='novice'&&s.mutation)state.hp=Math.min(HEROES.novice.hp,state.hp+Math.round(HEROES.novice.hp*.01));
  }
  progressionProcs.clear();update();
};
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
  if(creature)ART.enemies[key]={idle:creature,attack:creature,cast:creature,hurt:creature};
  if(battle.boss&&ART.worldBosses?.[battle.bossId])ART.bosses[key]=ART.worldBosses[battle.bossId];
  const backdrop=progressionRules.WORLD.CHAPTERS[battle.chapter-1]?.backdrop||battle.theme;
  if(ART.worldScenes?.[backdrop])ART.parallax[key]=[ART.worldScenes[backdrop]];
  MONSTERS[key]={...MONSTERS[key],name:battle.enemyName,boss:battle.enemyName,skill:battle.skills[0],support:'Hộ Giáp',heal:'Hồi Sức'};
  const campaignSkill=enemySkill;
  enemySkill=async function({reserved=false}={}){
    if(progressionBattle?.tactical)return;
    if(!progressionBattle||!['campaign','boss'].includes(progressionBattle.mode))return campaignSkill({reserved});
    if(!reserved)state.enemyEnergy=0;
    const phase=progressionBossCast++%battle.skills.length,name=battle.skills[phase];message(battle.enemyName+' dùng '+name);popActorSkill('enemy',name,true,[]);
    const skill=battle.skillSet?.[phase],base=14+battle.recommended*(battle.boss?1.1:.65);
    if(!skill){if(battle.tier==='elite'&&phase===1)await buff('enemy','armor',Math.round(state.enemyMax*.04));else await attack('enemy',base);}
    else if(skill.kind==='guard')await buff('enemy','armor',Math.round(state.enemyMax*skill.shield));
    else if(skill.kind==='heal')await buff('enemy','heal',Math.round(state.enemyMax*skill.heal));
    else{
      if(skill.drain)state.energy=Math.max(0,state.energy-skill.drain);
      let raw=base*(skill.power||1)*progressionEnemyCharge;progressionEnemyCharge=1;
      if(skill.kind==='execute'&&state.hp/HEROES[state.key].hp<skill.threshold)raw*=skill.bonus;
      const reservedArmor=skill.pierce?Math.floor(state.armor*skill.pierce):0;state.armor-=reservedArmor;
      const previous=state.hp;
      try{await attack('enemy',raw,{hits:skill.hits||1});}finally{state.armor+=reservedArmor;}
      if(skill.leech&&previous>state.hp)await buff('enemy','heal',Math.round((previous-state.hp)*skill.leech));
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
