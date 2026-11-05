// Board impacts grant resources immediately; one actor-action queue prevents
// attacks, recoil and authored buff poses from overwriting each other.
function createLiveCombat(){
  const queue=[],seen=new Set(),counts={hero:[0,0,0,0,0],enemy:[0,0,0,0,0]};
  const feedback=new Map(),receiveJobs=new Set();
  const attackChains={hero:0,enemy:0};
  const damageLedger={hero:{raw:0,applied:0},enemy:{raw:0,applied:0}};
  let running=null,failure=null,closed=false,wave=0,heroTiles=0,owner=null,comboPaid=false;
  // Per resolution: hero rage earned (Lumi's Biến Thân cap), the first hero sword wave, armour from overflow healing.
  const turnGain={rage:0,firstSwordWave:0,overflowArmor:0,burned:false};
  const alive=side=>state[side==='hero'?'hp':'enemyHp']>0;
  // An ultimate casts the moment its side's rage is full in its own turn, while the board keeps resolving (owner 05/11:
  // "đầy nộ thì thi triển luôn", no waiting for the board); still at most one per own turn (board-control.js). Rage that
  // fills on the other side's turn waits for that side's turn (castReadyUltimates after the board).
  function queueUltimates(){
    if(closed||failure||!alive('hero')||!alive('enemy'))return;
    const R=GemwovenBoardRules,allowed=typeof boardUltAllowed==='function'?boardUltAllowed:()=>false;
    for(const side of ['hero','enemy']){
      if(side==='enemy'&&noriSealHolds())continue;
      if(side==='hero'&&state.playerFrozen)continue;
      if(queue.some(job=>job.kind==='ultimate'&&job.side===side))continue;
      const key=side==='hero'?'energy':'enemyEnergy';
      if(state[key]<R.ULTIMATE.cost||!allowed(side))continue;
      if(side==='hero'&&typeof foeSilenced==='function'&&foeSilenced())continue;
      state[key]-=R.ULTIMATE.cost;boardUltTurn[side]++;queue.unshift({side,kind:'ultimate',value:0});
      update();
    }
    if(queue.length)start();
  }
  function start(){
    if(running||closed)return;
    running=(async()=>{
      // A short gathering window combines adjacent impacts into one gesture.
      await boardV3Pause(150);
      while(queue.length&&!closed){
        // The fight never waits on board gains (owner 05/11: "bên trên nhận được gì thì phải chạy luôn"): a queued strike
        // goes first, and a heal or armour job with a strike still waiting behind it only flashes its light (the number
        // is already shown) instead of holding the fighter in its buff pose.
        // An ultimate goes first of all, then strikes.
        const ult=queue.findIndex(j=>j.kind==='ultimate'),strike=queue.findIndex(j=>j.kind==='attack'),job=queue.splice(ult>=0?ult:strike>=0?strike:0,1)[0];
        if(!alive(job.side))continue;
        if((job.kind==='heal'||job.kind==='armor')&&queue.some(j=>j.kind==='attack')){
          if(!reduced)restorationEffect(job.side,job.kind);if(typeof combatV3BuffSound==='function')combatV3BuffSound(job.kind);continue;}
        if(job.side==='enemy'&&noriSealHolds()&&(job.kind==='attack'||job.kind==='ultimate')){
          if(job.kind==='ultimate'){state.enemyEnergy=Math.min(199,state.enemyEnergy+100);update();}
          continue;
        }
        if(job.kind==='ultimate'){
          if(alive(job.side==='hero'?'enemy':'hero')){
            if(job.side==='hero')await heroUltimate();else await enemySkill({reserved:true});
          }else{
            const key=job.side==='hero'?'energy':'enemyEnergy';state[key]=Math.min(100,state[key]+100);update();
          }
        }else if(job.kind==='attack'){
          if(!alive(job.side==='hero'?'enemy':'hero'))continue;
          const hit=await attack(job.side,job.value,{damageLedger:damageLedger[job.side],attackChain:job.chain});
          message((job.side==='hero'?HEROES[state.key].name:MONSTERS[state.enemyKey].name)+': '+(hit.stored?'tích '+hit.stored+' sát thương':hit.amount+' sát thương')+(hit.blocked?' · phá '+hit.blocked+' giáp':'')+'.');
        }else await buff(job.side,job.kind,job.value,{alreadyApplied:true});
        queueUltimates();
      }
    })().catch(error=>{failure=error;queue.length=0;}).finally(()=>{running=null;if(queue.length&&!closed&&!failure)start();});
  }
  function enqueue(side,kind,value){
    if(!value||closed||failure)return;
    const pending=queue.find(job=>job.side===side&&job.kind===kind&&(kind!=='attack'||job.wave===wave));
    if(pending)pending.value+=value;
    else queue.push({side,kind,value,wave,chain:attackChains[side]||1});
    start();
  }
  // Board receipts (+HP, +GIÁP, +NL) join the actor's popup column; while one is still on screen
  // further gains of that kind add to it. finish() waits only for each receipt's short beat.
  function receipt(side,kind,value){
    if(reduced||!value)return;
    const id=side+kind,existing=feedback.get(id);
    if(existing){existing.value+=value;if(existing.popup.update(label(kind,existing.value)))return;}
    const popup=combatPopup(side,label(kind,value),{kind:kind==='heal'?'heal':kind==='armor'?'armor':'energy',beat:440});
    const item={popup,value,job:popup.ready};feedback.set(id,item);
    popup.done.then(()=>{if(feedback.get(id)===item)feedback.delete(id);});
  }
  function label(kind,value){return '+'+Math.round(value)+(kind==='heal'?' HP':kind==='armor'?' GIÁP':' NL');}
  return {
    beginWave(chain,plan,mover){
      owner=mover;
      for(const side of ['hero','enemy']){
        const swords=plan.targets.some(t=>t.type===0&&(mover==='hero'||plan.playerTiles.has(t)?'hero':'enemy')===side);
        attackChains[side]=swords?attackChains[side]+1:0;
      }
      // Preserve the existing final-combo score multiplier as waves arrive.
      if(chain>wave){state.score+=heroTiles*10*(chain-wave);wave=chain;update();}
      queueUltimates();
    },
    collect(tile,side,chain){
      if(closed||seen.has(tile.id)||tile.type<0)return;
      seen.add(tile.id);
      if(!alive(side))return; // Cleared hearts cannot revive a defeated actor.
      const type=tile.type,hero=side==='hero',key=hero?state.key:state.enemyKey,own=counts[side];
      const reception=combatLootReceive(side,type);receiveJobs.add(reception);reception.finally(()=>receiveJobs.delete(reception));
      own[type]++;
      if(hero&&typeof expeditionCollect==='function')expeditionCollect(type);
      if(hero){heroTiles++;state.score+=10*chain;}
      // Rage by the shared board table (board-rules.js): heroes and duel players 3/2/7/2/2 (Lumi's purple from her kit,
      // more in her Biến Thân, capped per turn); a PvE foe 3 a gem and 25 for its first purple.
      const R=GemwovenBoardRules,tf=hero?transformEffect():null,energyKey=hero?'energy':'enemyEnergy',before=state[energyKey];
      let energy=progressionIsDuel()?R.heroRage(type):hero?R.heroRage(type,{purple:tf?.purple||progressionKit(key).purple||0,factor:progressionEnergyMultiplier(key)}):R.FOE_RAGE.perGem+(type===2&&own[2]===1?R.FOE_RAGE.firstCrystal:0);
      if(hero&&tf?.rageCap)energy=Math.max(0,Math.min(energy,tf.rageCap-turnGain.rage));
      state[energyKey]=Math.min(alive('hero')&&alive('enemy')?R.ULTIMATE.cap:R.ULTIMATE.cost,before+energy);
      if(hero)turnGain.rage+=state[energyKey]-before;
      receipt(side,'energy',state[energyKey]-before);
      // Ice builds up on the opponent across turns (6, a boss 9); the control guard applies. In PvP both players build it;
      // a PvE foe's ice no longer drains rage (that is now a skill of the foes that have it).
      if(hero&&type===3)boardIceGem();
      if(!hero&&type===3&&progressionIsDuel())boardIceOnHero();
      if(type===0){
        let raw=8*(hero?progressionSwordFactor(key):1)*(progressionIsDuel()?1:hero?1:state.boss?R.FOE_SWORD.boss:R.FOE_SWORD.common);
        // Biến Thân board effects on swords: Hiro's first group, Noct's cascade crit, Mika's burn from her first group.
        if(hero&&tf){
          if(!turnGain.firstSwordWave)turnGain.firstSwordWave=chain;
          const first=turnGain.firstSwordWave===chain;
          if(tf.firstSword&&first)raw*=1+tf.firstSword;
          if(tf.cascadeCrit&&chain>=tf.cascadeCrit.waves)raw*=tf.cascadeCrit.mult;
          if(tf.burn&&first&&!turnGain.burned&&alive('enemy')){turnGain.burned=true;const amount=Math.max(1,Math.round(tf.burn.base*(progressionBattle?.stats.attack||1)));
            if(!(progressionDot?.turns>0&&progressionDot.amount>=amount))progressionDot={turns:tf.burn.turns,amount};popActorSkill('enemy','THIÊU ĐỐT · '+tf.burn.turns+' LƯỢT',false);}
        }
        enqueue(side,'attack',raw);
      }else if(type===1||type===4){
        const kind=type===1?'heal':'armor',stat=type===1?(hero?'hp':'enemyHp'):(hero?'armor':'enemyArmor');
        const cap=type===1?(hero?HEROES[key].hp:state.enemyMax):combatArmorCap(side);
        const tf=hero?transformEffect():null,amount=Math.round(combatTileYield(side,type)*(tf?.support||1)),gained=Math.max(0,Math.min(amount,cap-state[stat]));
        state[stat]+=gained;receipt(side,kind,gained);enqueue(side,kind,gained);
        // Nori's Biến Thân: a share of the healing past full HP becomes armour (capped a turn).
        if(tf?.overflowArmor&&type===1&&amount>gained){const room=Math.round(HEROES[key].hp*tf.overflowCap)-turnGain.overflowArmor,add=Math.max(0,Math.min(room,Math.round((amount-gained)*tf.overflowArmor),combatArmorCap('hero')-state.armor));
          if(add>0){state.armor+=add;turnGain.overflowArmor+=add;receipt('hero','armor',add);}}
      }
      update();
      queueUltimates();
    },
    async finish(){
      // Combo rage: one bonus for the mover by the number of waves (heroes, and both players in duels).
      if(!comboPaid&&owner&&!closed&&!failure){comboPaid=true;
        const side=owner==='hero'?'hero':progressionIsDuel()?'enemy':null,bonus=side&&alive('hero')&&alive('enemy')?GemwovenBoardRules.comboRage(wave):0;
        if(bonus){const key=side==='hero'?'energy':'enemyEnergy',tf=side==='hero'?transformEffect():null,before=state[key];
          const add=tf?.rageCap?Math.max(0,Math.min(bonus,tf.rageCap-turnGain.rage)):bonus;
          state[key]=Math.min(GemwovenBoardRules.ULTIMATE.cap,before+add);receipt(side,'energy',state[key]-before);
          if(state[key]>before)popActorSkill(side,'COMBO ×'+wave+' · +'+(state[key]-before)+' NỘ',false);update();
          // The combo bonus can fill the gauge: the ultimate goes at once, not after the board.
          queueUltimates();}
        // Noct's Biến Thân: three waves let him slip the next basic hit (once per Biến Thân).
        const tf=owner==='hero'?transformEffect():null;
        if(tf?.dodge&&wave>=tf.dodge.waves&&!progressionTransform.dodged){progressionTransform.dodged=true;state.tfDodge=true;popActorSkill('hero','SẴN SÀNG NÉ',false);update();}
      }
      while(running)await running;
      await Promise.all([...feedback.values()].map(item=>item.job));
      await Promise.all(receiveJobs);
      if(failure)throw failure;
    },
    async cancel(){
      closed=true;queue.length=0;
      if(running)await running;
      await Promise.allSettled([...feedback.values()].map(item=>item.job));
      await Promise.allSettled(receiveJobs);
    }
  };
}
