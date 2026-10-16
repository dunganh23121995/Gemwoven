// Board impacts grant resources immediately; one actor-action queue prevents
// attacks, recoil and authored buff poses from overwriting each other.
function createLiveCombat(){
  const queue=[],seen=new Set(),counts={hero:[0,0,0,0,0],enemy:[0,0,0,0,0]};
  const feedback=new Map(),receiveJobs=new Set();
  const attackChains={hero:0,enemy:0};
  const damageLedger={hero:{raw:0,applied:0},enemy:{raw:0,applied:0}};
  let running=null,failure=null,closed=false,wave=0,heroTiles=0;
  const alive=side=>state[side==='hero'?'hp':'enemyHp']>0;
  function queueUltimates(){
    if(closed||failure||!alive('hero')||!alive('enemy'))return;
    for(const side of ['enemy','hero']){
      if(side==='enemy'&&state.noriStunTurns>0)continue;
      const key=side==='hero'?'energy':'enemyEnergy';
      if(state[key]<100)continue;
      state[key]-=100;queue.unshift({side,kind:'ultimate',value:0});
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
        const job=queue.shift();
        if(!alive(job.side))continue;
        if(job.side==='enemy'&&state.noriStunTurns>0&&(job.kind==='attack'||job.kind==='ultimate')){
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
  function receipt(side,kind,value){
    if(reduced||!value)return;
    const id=side+kind,existing=feedback.get(id);
    if(existing){existing.value+=value;existing.node.textContent=label(kind,existing.value);return;}
    const point=combatV3Point(side),node=document.createElement('span');
    node.className='combat-v3-number live-loot '+(kind==='heal'?'heal':kind==='armor'?'armor':'energy');
    node.dataset.lootSide=side;node.dataset.lootKind=kind;
    node.style.left=(point.x+(kind==='armor'?25:kind==='energy'?-25:0))+'px';
    node.style.top=Math.max(20,point.y-point.height*.12+(kind==='energy'?25:0))+'px';
    node.textContent=label(kind,value);$('combatEffects').append(node);
    const item={node,value,job:null};feedback.set(id,item);
    item.job=animate(node,[{opacity:0,transform:'translate(-50%,8px) scale(.8)'},{opacity:1,transform:'translate(-50%,0) scale(1.05)',offset:.2},{opacity:1,offset:.72},{opacity:0,transform:'translate(-50%,-20px) scale(1)'}],{duration:440,easing:'ease-out'}).finally(()=>{node.remove();feedback.delete(id);});
  }
  function label(kind,value){return '+'+Math.round(value)+(kind==='heal'?' HP':kind==='armor'?' GIÁP':' NL');}
  return {
    beginWave(chain,plan,owner){
      for(const side of ['hero','enemy']){
        const swords=plan.targets.some(t=>t.type===0&&(owner==='hero'||plan.playerTiles.has(t)?'hero':'enemy')===side);
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
      if(hero){heroTiles++;state.score+=10*chain;}
      const energyKey=hero?'energy':'enemyEnergy',before=state[energyKey];
      const energy=hero?([7,2,5,2,2][type]*(key==='lightning'?2:1)):3+(type===2&&own[2]===1?25:0);
      state[energyKey]=Math.min(alive('hero')&&alive('enemy')?199:100,before+energy);
      receipt(side,'energy',state[energyKey]-before);
      if(hero&&own[3]>=3)state.frozen=true;
      if(!hero&&type===3&&own[3]===1)state.energy=Math.max(0,state.energy-20);
      if(type===0){
        const raw=8*(hero&&key==='fire'?1.6:1)*(hero?1:state.boss?1.15:.55);
        enqueue(side,'attack',raw);
      }else if(type===1||type===4){
        const kind=type===1?'heal':'armor',stat=type===1?(hero?'hp':'enemyHp'):(hero?'armor':'enemyArmor');
        const cap=type===1?(hero?HEROES[key].hp:state.enemyMax):999;
        const amount=type===1?6:hero?(key==='ice'?8:4):5,gained=Math.max(0,Math.min(amount,cap-state[stat]));
        state[stat]+=gained;receipt(side,kind,gained);enqueue(side,kind,gained);
      }
      update();
      queueUltimates();
    },
    async finish(){
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
