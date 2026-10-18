/* Run source combat in a DOM, with real metadata and local saves, without audio. */
const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../../src/gemwoven/progression.js'),root=path.resolve(__dirname,'../..');
const sessions=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function art(){
  const a={heroes:{},enemies:{},bosses:{},campaignCreatures:{},items:{},voices:{},noctSounds:{},castSounds:{},music:{},landscape:'assets/landscape.webp',parallax:{},scenes:{},skillFx:{},evolution:{}};
  for(const {id}of M.CREATURES)a.campaignCreatures[id]={src:`assets/gemwoven/items/monster-${id}.png`,cols:1,rows:1,count:1,heads:[[128,60]]};
  for(const key of ['fire','ice','earth','lightning','shadow','novice']){
    a.heroes[key]={};for(const action of ['idle','attack','cast','hurt','buff','run','hover','smash']){
      let meta;try{if(key==='novice')meta=JSON.parse(read('assets/heroes/novice/meta.json')).actions[action];else if(key!=='shadow')meta=JSON.parse(read(`assets/reimagined/heroes/${key}/${action}/runtime-meta.json`));}catch{}
      a.heroes[key][action]={src:`assets/heroes/${key}/${action}.webp`,cols:meta?.columns||2,rows:meta?.rows||2,count:meta?.frames||4,heads:meta?.headAnchors||[[128,78],[128,78],[128,78],[128,78]],frameDuration:meta?.frameDuration};
    }
    if(!['shadow','novice'].includes(key)){a.enemies[key]=a.heroes[key];a.bosses[key]=a.heroes[key];a.parallax[key]=['','',''];a.scenes[key]='';}
  }
  for(const [id,m] of Object.entries(JSON.parse(read('assets/gemwoven/theme-creature-items.json')).items))a.campaignCreatures[id.slice(9)]={src:'assets/gemwoven/'+m.file,cols:1,rows:1,count:1,heads:[[128,60]]};
  a.worldBosses={};for(const [id,m]of Object.entries(JSON.parse(read('assets/gemwoven/boss-items.json')).items)){const sheet={src:'assets/gemwoven/'+m.file,cols:1,rows:1,count:1,heads:[[128,40]]};a.worldBosses[id.slice(5)]={idle:sheet,attack:sheet,cast:sheet,hurt:sheet};}
  a.counterItems={};for(const [id,m]of Object.entries(JSON.parse(read('assets/gemwoven/chapter-ecosystem-items.json')).items)){if(id.startsWith('creature-'))a.campaignCreatures[id.slice(9)]={src:'assets/gemwoven/'+m.webp,cols:1,rows:1,count:1,heads:[[128,60]]};else a.counterItems[id.slice(9)]='assets/gemwoven/'+m.webp;}
  for(const file of ['boss-expansion-a','boss-expansion-b'])for(const [id,m]of Object.entries(JSON.parse(read('assets/gemwoven/'+file+'.json')).bosses))a.worldBosses[id]=m;
  for(const name of ['sword','heart','crystal','snow','shield','core'])for(const suffix of ['', '-bolt','-bomb'])a.items[name+suffix]='assets/items/'+name+'.webp';
  for(const e of M.EVOLUTION)a.evolution[e.piece]=`assets/gemwoven/items/evo-${e.piece}.png`;
  return a;
}
async function run(hero,mode='campaign',index=1){
  const entries=new Map(),storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};
  const engine=M.makeEngine(storage),p=engine.read();
  if(hero!=='novice')p.heroes[hero]={...p.heroes.novice,level:100,stars:2,evolution:2,skills:[3,1,1,0]};
  if(hero==='fire'){p.equipment.push({id:'qa-stun',slot:'weapon',rarity:'divine',level:0,affix:'stun'});p.heroes.fire.gear={weapon:'qa-stun'};}
  p.selected=hero;if(mode==='boss')p.boss.best=index-1;if(mode==='campaign')p.campaign.cleared=index-1;storage.setItem(M.KEY,JSON.stringify(p));const encounter=engine.begin(mode,index);
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(String(e)));vc.on('error',e=>errors.push(String(e)));
  const dom=new JSDOM(read('src/template.html'),{url:`http://localhost/Game.html?qa&encounter=${encounter.token}`,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
  sessions.push(dom);
  w.localStorage.setItem(M.KEY,storage.getItem(M.KEY));w.ResizeObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:true,addEventListener(){}});
  w.localStorage.setItem('mam-phep-audio-v1',JSON.stringify({music:37,effects:55,voices:24}));
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.HTMLElement.prototype.animate=function(){return {finished:Promise.resolve(),cancel(){},finish(){},effect:{target:this}};};
  const files=['audio-settings','sprite-runtime','combo-v4','opponent-ai','opponent-turn','board-sequence','combat-v3','live-combat','antique-trim','combat-stage','adventure-effects','noct-audio','recorded-voices','restoration','cinematic','scene-ambience','shadow-combat','cast-redesign','self-buffs','yuki-ultimate','mika-ultimate'];
  const extensions=read('src/gemwoven/boss-chapters.js')+'\n'+read('src/gemwoven/boss-tactics.js')+'\n'+read('src/gemwoven/world.js')+'\n'+read('src/gemwoven/progression.js')+'\nconst ART='+JSON.stringify(art())+';\n'+files.map(f=>read('src/'+f+'.js')).join('\n')+'\n'+read('src/progression-combat.js')+'\n'+read('src/expedition-combat.js');
  w.eval(read('src/game.js').replace('/* GAME_EXTENSIONS */',extensions));
  const qa=w.gameQA;assert.ok(qa);qa.setReduced(true);d.getElementById('soundBtn').click();
  assert.equal(d.getElementById('volume-music').value,'37','Combat uses the same audio settings as Home');assert.equal(d.getElementById('audioSettingsBtn').hidden,true);
  assert.equal(d.querySelectorAll('#classGrid button').length,1,'Only pinned owned hero may fight');
  d.querySelector('#classGrid button').click();d.getElementById('startBtn').click();
  assert.equal(qa.state.key,hero);assert.equal(qa.state.hp,encounter.stats.hp);assert.equal(qa.state.enemyMax,mode==='duel'?encounter.stats.hp:encounter.enemyHp);
  qa.state.enemyHp=10000;qa.state.enemyMax=10000;qa.state.enemyArmor=0;
  const originalRandom=w.Math.random;w.Math.random=()=>0;
  const before=qa.state.enemyHp,wardBefore=qa.expedition?.ward||0,hit=qa.damage('hero',10),beats={fire:'ice',ice:'earth',earth:'lightning',lightning:'fire'};if(wardBefore)assert.ok(qa.expedition.ward<wardBefore,'Initial crystal shell absorbs real damage');else assert.equal(hit.amount,Math.round(10*encounter.stats.attack*(hero==='earth'?.6:1)*(beats[hero]===encounter.enemyKey?1.5:1)));assert.equal(before-qa.state.enemyHp,hit.amount);
  if(hero==='fire')assert.equal(qa.state.stunned,true,'Divine weapon stun proc reaches combat');
  w.Math.random=originalRandom;
  if(encounter.creature)assert.equal(qa.spriteInfo('enemy',encounter.enemyKey,'idle').count,1,'New regular monsters are rendered in combat');
  if(encounter.boss&&index===50){qa.state.hp=10000;qa.state.energy=50;qa.state.enemyArmor=0;for(let i=0;i<3;i++)await qa.enemySkill({reserved:true});assert.ok(qa.state.enemyArmor>0,'Boss uses its armor skill');assert.equal(qa.state.energy,30,'Boss uses its energy-drain skill');assert.ok(qa.state.hp<10000,'Boss also uses a damaging skill');qa.state.hp=encounter.stats.hp;qa.state.enemyArmor=0;}
  if(mode==='boss'&&!encounter.tactical){
    assert.ok(encounter.skillSet.length===3);for(const skill of encounter.skillSet){qa.state.hp=10000;qa.state.enemyHp=5000;qa.state.enemyMax=10000;qa.state.energy=100;qa.state.armor=0;qa.state.enemyArmor=0;await qa.enemySkill({reserved:true});
      if(skill.kind==='guard')assert.ok(qa.state.enemyArmor>0,'Guard creates real armor');
      else if(skill.kind==='heal')assert.ok(qa.state.enemyHp>5000,'Healing restores actual HP');
      else {assert.ok(qa.state.hp<10000,'Boss attack reaches saved HP');if(skill.drain)assert.equal(qa.state.energy,100-skill.drain);if(skill.leech)assert.ok(qa.state.enemyHp>5000);if(skill.dot)assert.ok(qa.progressionEnemyEffects.dot?.turns>0);if(skill.charge)assert.ok(qa.progressionEnemyEffects.charge>1);}
    }qa.state.hp=encounter.stats.hp;qa.state.enemyHp=10000;qa.state.enemyMax=10000;qa.state.armor=0;qa.state.enemyArmor=0;
  }
  if(encounter.tactical&&encounter.boss){
    assert.equal(qa.spriteInfo('enemy',encounter.enemyKey,'idle').count,4,'New boss uses authored animation instead of the legacy boss');
    qa.state.hp=1000000;qa.state.enemyMax=100000;qa.state.enemyHp=100000;qa.state.armor=999;qa.state.stunned=false;qa.state.frozen=false;
    await qa.enemyAction();assert.equal(qa.expedition.phase,1);assert.ok(d.getElementById('expeditionHud').textContent.includes(M.WORLD.EXPANSION.byId[encounter.bossId].status));
    qa.state.enemyHp=65000;await qa.enemyAction();assert.equal(qa.expedition.phase,2);
    qa.state.enemyHp=30000;await qa.enemyAction();assert.equal(qa.expedition.phase,3);assert.ok(qa.expedition.channel);
    for(let i=0;i<6;i++)qa.expeditionCollect(M.WORLD.EXPANSION.byId[encounter.bossId].tile);await qa.enemyAction();assert.ok(qa.expedition.events.some(e=>e.type==='interrupt'));assert.equal(qa.expedition.channel,null);assert.ok(qa.state.enemyEnergy<100);
    qa.state.hp=encounter.stats.hp;qa.state.enemyMax=10000;qa.state.enemyHp=10000;qa.state.armor=0;qa.state.enemyArmor=0;qa.expedition.ward=0;qa.expedition.addHp=0;
  }
  const ultimateBefore=qa.state.enemyHp;await qa.heroUltimate();if(hero==='earth'){assert.equal(qa.state.noriStunTurns,2);assert.ok(qa.state.armor>0);}else assert.ok(qa.state.enemyHp<ultimateBefore,'Unlocked active skill damages enemy');
  if(encounter.tactical&&hero==='earth'){qa.damage('hero',10);assert.ok(qa.state.noriStoredDamage>0);await qa.enemyAction();await qa.enemyAction();assert.equal(qa.state.noriStunTurns,0,'Tactical bosses still consume both Nori stun turns');assert.equal(qa.state.noriStoredDamage,0,'Stored damage bursts instead of staying locked');qa.state.hp=encounter.stats.hp;}
  if(hero==='ice')assert.ok(qa.state.armor>25,'Ice mutation adds the promised shield');
  if(hero==='lightning')assert.ok(qa.state.energy>=5,'Lightning mutation returns energy');
  if(hero==='novice'&&mode==='campaign'&&index===1){qa.state.hp=10000;for(let i=0;i<2;i++){const move=qa.legalMoves()[0];await qa.trySwap(move.a,move.b);}assert.equal(qa.progressionTurns,2,'Each accepted player move counts once');qa.state.hp=encounter.stats.hp;}
  if(hero==='novice'&&mode==='campaign'){
    const runMeta=JSON.parse(read('assets/heroes/novice/meta.json')).actions.run;
    assert.ok(runMeta?.accepted&&runMeta.loop,'Starter must have an accepted looping run asset');
    assert.notDeepEqual(fs.readFileSync(path.join(root,'assets/heroes/novice/run.webp')),fs.readFileSync(path.join(root,'assets/heroes/novice/attack.webp')),'Run art must be distinct from swinging a sword');
    const raf=w.requestAnimationFrame,clock=w.performance.now,queued=[],frames=new Set(),positions=[];
    let now=clock.call(w.performance);w.performance.now=()=>now;w.requestAnimationFrame=callback=>(queued.push(callback),queued.length);
    Object.defineProperty(d.getElementById('scene'),'clientWidth',{configurable:true,value:390});
    qa.setReduced(false);const departure=qa.departVictoriousHero();
    for(let elapsed=0;elapsed<=2700;elapsed+=30){
      now+=30;const callbacks=queued.splice(0);callbacks.forEach(callback=>callback(now));
      const heroRoot=d.getElementById('heroActor'),sprite=heroRoot.querySelector('.sprite-body');
      if(sprite.dataset.action==='run')frames.add(+sprite.dataset.frame);
      if(heroRoot.dataset.worldX)positions.push(+heroRoot.dataset.worldX);
      await Promise.resolve();
    }
    await departure;
    assert.deepEqual([...frames].sort((a,b)=>a-b),Array.from({length:runMeta.frames},(_,i)=>i),'Departure must play every stride, including frames 0 and 1');
    assert.ok(positions.length>20&&positions.at(-1)>600&&positions.every((x,i)=>!i||x>=positions[i-1]),'Run advances smoothly through the stage');
    assert.equal(d.getElementById('heroActor').dataset.departing,undefined);assert.equal(d.querySelector('#heroActor .sprite-body').dataset.action,'idle');
    w.performance.now=clock;w.requestAnimationFrame=raf;qa.setReduced(true);d.getElementById('heroActor').style.opacity='1';
  }
  if(mode==='duel'){
    assert.equal(d.getElementById('enemyActor').dataset.facing,'-1');assert.ok(d.getElementById('enemyActor').classList.contains('duel-facing-left'));
    qa.state.hp=10000;qa.state.enemyHp=10000;qa.state.energy=0;qa.state.enemyEnergy=0;
    const turn=qa.enemyAction();await new Promise(r=>setTimeout(r,30));const board=d.querySelector('.duel-board');assert.ok(board,'Player 2 chooses a real move');const move=qa.legalMoves()[0];board.querySelector(`[data-r="${move.a.r}"][data-c="${move.a.c}"]`).click();board.querySelector(`[data-r="${move.b.r}"][data-c="${move.b.c}"]`).click();await turn;assert.equal(d.querySelector('.duel-board'),null);
  }
  qa.state.enemyHp=0;await qa.finishBattle();const rewardSave=JSON.parse(w.localStorage.getItem(M.KEY));assert.equal(rewardSave.campaign.cleared,mode==='campaign'?index:0);if(mode==='campaign')assert.equal(rewardSave.campaign.stars[index],3);assert.equal(rewardSave.pending,null);assert.equal(rewardSave.wallet.gems,0);
  const gold=rewardSave.wallet.gold;await qa.finishBattle();assert.equal(JSON.parse(w.localStorage.getItem(M.KEY)).wallet.gold,gold,'Result cannot grant twice');
  assert.deepEqual(errors,[]);w.close();return hero+':'+mode+':'+index;
}
(async()=>{const heroes=[];for(const h of ['novice','fire','ice','earth','lightning','shadow'])heroes.push(await run(h));heroes.push(await run('novice','duel'));heroes.push(await run('novice','campaign',10));heroes.push(await run('novice','campaign',50));heroes.push(await run('novice','campaign',250));for(let tier=1;tier<=14;tier++)heroes.push(await run('novice','boss',tier));for(const d of M.WORLD.EXPANSION.definitions)heroes.push(await run('novice','campaign',d.chapter*50));heroes.push(await run('earth','campaign',1050));heroes.push(await run('novice','campaign',1010));console.log(JSON.stringify({passed:true,heroes,checks:'Pinned ownership, saved stats, starter run cycle, regular/elite/boss encounters, three boss skills, star result, six active skills, elemental mutations, divine stun, facing PvP players, local player-2 turn choice, one-time reward, and no premium reward'},null,2));})().catch(e=>{console.error(e);for(const dom of sessions)dom.window.close();process.exitCode=1;});
