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
  for(const id of fs.readdirSync(path.join(root,'assets/gemwoven/elites')))if(fs.existsSync(path.join(root,'assets/gemwoven/elites',id,'idle.webp'))){const idle={src:`assets/gemwoven/elites/${id}/idle.webp`,cols:2,rows:4,count:8,frameDuration:150,heads:Array(8).fill([128,48])};a.campaignCreatures[id]={idle,still:{...idle,count:1,heads:[[128,48]]}};}else if(fs.existsSync(path.join(root,'assets/gemwoven/elites',id,'master.png')))a.campaignCreatures[id]={src:`assets/gemwoven/elites/${id}/master.png`,cols:1,rows:1,count:1,heads:[[128,48]]};
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
  const files=['audio-settings','hero-kits','sprite-runtime','combo-v4','opponent-ai','opponent-turn','board-sequence','combat-v3','live-combat','antique-trim','combat-stage','adventure-effects','noct-audio','recorded-voices','restoration','cinematic','scene-ambience','shadow-combat','hero-departures','cast-redesign','self-buffs','yuki-ultimate','mika-ultimate','foe-skills'];
  const extensions=read('src/gemwoven/boss-chapters.js')+'\n'+read('src/gemwoven/boss-tactics.js')+'\n'+read('src/gemwoven/world.js')+'\n'+read('src/gemwoven/progression.js')+'\nconst ART='+JSON.stringify(art())+';\n'+files.map(f=>read('src/'+f+'.js')).join('\n')+'\n'+read('src/progression-combat.js')+'\n'+read('src/expedition-combat.js');
  w.eval(read('src/game.js').replace('/* GAME_EXTENSIONS */',extensions));
  const qa=w.gameQA;assert.ok(qa);qa.setReduced(true);d.getElementById('soundBtn').click();
  assert.equal(d.getElementById('volume-music').value,'37','Combat uses the same audio settings as Home');assert.equal(d.getElementById('audioSettingsBtn').hidden,true);
  assert.equal(d.querySelectorAll('#classGrid button').length,1,'Only pinned owned hero may fight');
  d.querySelector('#classGrid button').click();d.getElementById('startBtn').click();
  assert.equal(qa.state.key,hero);assert.equal(qa.state.hp,encounter.stats.hp);assert.equal(qa.state.enemyMax,mode==='duel'?encounter.stats.hp:mode==='pvp'?Math.round(encounter.stats.hp*1.15):encounter.enemyHp);
  const kit=encounter.stats.kit;assert.ok(kit,'Battle snapshot carries the skill kit');assert.equal(qa.state.energy,kit.startEnergy,'Evolution start energy');
  if(['pvp','duel'].includes(mode)){assert.equal(kit.power,1);assert.equal(kit.mutation,false);assert.equal(kit.awakened,false);assert.deepEqual(encounter.stats.affixes,[]);}
  qa.state.enemyHp=10000;qa.state.enemyMax=10000;qa.state.enemyArmor=0;
  const originalRandom=w.Math.random;w.Math.random=()=>0;
  const before=qa.state.enemyHp,wardBefore=qa.expedition?.ward||0,hit=qa.damage('hero',10),beats={fire:'ice',ice:'earth',earth:'lightning',lightning:'fire'};if(wardBefore)assert.ok(qa.expedition.ward<wardBefore,'Initial crystal shell absorbs real damage');else assert.equal(hit.amount,Math.round(10*encounter.stats.attack*(hero==='earth'?encounter.stats.kit.attackScale:1)*(beats[hero]===encounter.enemyKey?1.5:1)));assert.equal(before-qa.state.enemyHp,hit.amount);
  if(hero==='fire'&&mode!=='pvp')assert.equal(qa.state.stunned,true,'Divine weapon stun proc reaches combat');
  w.Math.random=originalRandom;
  if(encounter.creature)assert.equal(qa.spriteInfo('enemy',encounter.enemyKey,'idle').count,qa.art.campaignCreatures[encounter.creature]?.idle?8:1,'Campaign foes are rendered in combat (elites with their 8-frame idle): '+encounter.creature);
  if(encounter.boss&&index===50){qa.state.hp=10000;qa.state.energy=50;qa.state.enemyArmor=0;for(let i=0;i<3;i++)await qa.enemySkill({reserved:true});assert.ok(qa.state.enemyArmor>0,'Boss uses its armor skill');assert.equal(qa.state.energy,30,'Boss uses its energy-drain skill');assert.ok(qa.state.hp<10000,'Boss also uses a damaging skill');qa.state.hp=encounter.stats.hp;qa.state.enemyArmor=0;}
  if(mode==='boss'&&!encounter.tactical){
    assert.ok(encounter.skillSet.length===4&&encounter.skillSet[3].ult,'Three skills and a signature ultimate');for(const skill of encounter.skillSet){qa.resetFoeStatuses();qa.state.hp=10000;qa.state.enemyHp=5000;qa.state.enemyMax=10000;qa.state.energy=100;qa.state.armor=0;qa.state.enemyArmor=0;await qa.enemySkill({reserved:true});
      if(skill.kind==='guard')assert.ok(qa.state.enemyArmor>0,'Guard creates real armor');
      else if(skill.kind==='heal')assert.ok(qa.state.enemyHp>5000,'Healing restores actual HP');
      else {assert.ok(qa.state.hp<10000,'Boss attack reaches saved HP');if(skill.drain)assert.equal(qa.state.energy,100-skill.drain);if(skill.leech)assert.ok(qa.state.enemyHp>5000);if(skill.dot)assert.ok(qa.progressionEnemyEffects.dot?.turns>0);if(skill.charge)assert.ok(qa.progressionEnemyEffects.charge>1);}
      if(skill.status){const s=skill.status;if(s.id==='stun')assert.equal(qa.state.playerFrozen,true,'Stun costs the hero a turn');else if(s.id==='haste')assert.ok(qa.foeHaste>0);else assert.ok(qa.foeStatuses[s.id]?.turns===s.turns,`${skill.name} lays ${s.id}`);qa.state.playerFrozen=false;}
    }qa.resetFoeStatuses();qa.state.hp=encounter.stats.hp;qa.state.enemyHp=10000;qa.state.enemyMax=10000;qa.state.armor=0;qa.state.enemyArmor=0;
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
  qa.state.enemyArmor=0;qa.state.energy=0;qa.state.enemyEnergy=60;qa.state.armor=0;const ultimateBefore=qa.state.enemyHp,beatsUlt={fire:'ice',ice:'earth',earth:'lightning',lightning:'fire'};await qa.heroUltimate();
  if(hero!=='earth'&&!encounter.tactical&&!(qa.expedition?.ward>0)){const mult=beatsUlt[hero]===qa.state.enemyKey?1.5:1,expected=Math.round(kit.base*encounter.stats.attack*kit.power*mult)+(kit.mutation&&hero==='shadow'?Math.round(kit.echo*encounter.stats.attack):0);assert.ok(Math.abs(ultimateBefore-qa.state.enemyHp-expected)<=1,`${hero} ultimate deals the kit damage (${ultimateBefore-qa.state.enemyHp} vs ${expected})`);}
  if(hero==='earth'){assert.equal(qa.state.noriStunTurns,kit.stun);assert.equal(qa.state.noriRegenTurns,kit.regenTurns);assert.equal(qa.state.armor,Math.round(encounter.stats.hp*kit.mutationArmor),'Nori Biến Dị armor scales with rank');}
  if(hero==='ice')assert.equal(qa.state.armor,Math.min(Math.max(999,Math.round(encounter.stats.hp*.5)),kit.armor+Math.round(encounter.stats.hp*kit.mutationArmor)),'Yuki armor follows kit');
  if(hero==='lightning'){assert.equal(qa.state.enemyEnergy,60-kit.drain);assert.equal(qa.state.energy,kit.energyReturn);}
  if(hero==='fire'&&kit.burn&&!encounter.tactical){qa.state.energy=0;qa.state.enemyEnergy=0;const ticks=[];for(let i=0;i<kit.burn.turns+1;i++){const b=qa.state.enemyHp;qa.state.stunned=true;await qa.enemyAction();ticks.push(b-qa.state.enemyHp);}assert.deepEqual(ticks,[...Array(kit.burn.turns).fill(Math.round(kit.burn.base*encounter.stats.attack)),0],'Mika burn lasts the kit turns');}
if(hero==='earth'){assert.equal(qa.state.noriStunTurns,2);assert.ok(qa.state.armor>0);}else assert.ok(qa.state.enemyHp<ultimateBefore,'Unlocked active skill damages enemy');
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
  if(hero!=='earth'&&!(qa.expedition?.ward>0)){const keep=qa.state.enemyHp;qa.state.enemyArmor=0;qa.state.enemyHp=5;const over=qa.damage('hero',100000);assert.equal(over.amount,5,'Overkill numbers show only the HP that remained');qa.state.enemyHp=keep;}
  qa.state.enemyHp=0;await qa.finishBattle();const rewardSave=JSON.parse(w.localStorage.getItem(M.KEY));assert.equal(rewardSave.campaign.cleared,mode==='campaign'?index:0);if(mode==='campaign')assert.equal(rewardSave.campaign.stars[index],3);assert.equal(rewardSave.pending,null);assert.equal(rewardSave.wallet.gems,0);
  const gold=rewardSave.wallet.gold;await qa.finishBattle();assert.equal(JSON.parse(w.localStorage.getItem(M.KEY)).wallet.gold,gold,'Result cannot grant twice');
  if(hero==='fire'&&mode==='campaign'&&index===1){ // Foe statuses change the real rules, then expire.
    qa.resetFoeStatuses();qa.state.enemyArmor=0;qa.state.armor=0;qa.state.enemyHp=qa.state.enemyMax=100000;qa.state.hp=1000;
    const plain=qa.damage('hero',100).amount;qa.state.enemyHp=100000;
    await qa.applyFoeStatus({id:'weaken',turns:2,value:.5});assert.ok(Math.abs(qa.damage('hero',100).amount-plain/2)<=1,'Weaken halves hero damage');
    await qa.applyFoeStatus({id:'stealth',turns:1,target:'self'});assert.equal(qa.damage('hero',100).amount,0,'Stealth makes hero attacks miss');
    await qa.tickFoeStatuses();assert.equal(qa.foeStatuses.stealth,undefined,'One-turn stealth ends at the next foe turn');assert.equal(qa.foeStatuses.weaken.turns,1);
    qa.resetFoeStatuses();await qa.applyFoeStatus({id:'undying',turns:2,target:'self'});qa.state.enemyHp=50;qa.damage('hero',100000);assert.equal(qa.state.enemyHp,1,'Undying keeps the foe at 1 HP');
    qa.resetFoeStatuses();qa.state.hp=500;await qa.applyFoeStatus({id:'antiheal',turns:3});assert.equal(await qa.buff('hero','heal',100),0,'Anti-heal blocks healing');
    qa.resetFoeStatuses();await qa.applyFoeStatus({id:'silence',turns:2});qa.state.energy=100;await qa.castReadyUltimates();assert.equal(qa.state.energy,100,'Silence keeps the ultimate from firing');
    qa.resetFoeStatuses();qa.state.hp=1000;await qa.applyFoeStatus({id:'dot',turns:2,value:.5},40);await qa.tickFoeStatuses();assert.ok(qa.state.hp<1000,'Damage over time ticks at the foe turn');
    qa.resetFoeStatuses();qa.state.hp=1000;qa.state.enemyHp=100000;await qa.applyFoeStatus({id:'confuse',turns:2,value:.5});const hit=qa.damage('hero',100).amount;assert.ok(qa.state.hp<1000&&hit>0,'Confusion turns part of the hero damage back on the hero');
    qa.resetFoeStatuses();
  }
  assert.deepEqual(errors,[]);w.close();return hero+':'+mode+':'+index;
}
// Enemy pressure has a single linear scaling and stays survivable on deep endless floors.
{const maxed=M.stats({heroes:{fire:{level:500,stars:6,evolution:6,skills:[1,1,0,0],gear:{},relic:{level:1,evolution:1}}},equipment:[]},'fire');
  for(const floor of [278,600,1000]){const e=M.encounter('boss',floor);assert.equal(e.recommended,500);assert.ok(e.enemySkillBase*e.enemyAttack<maxed.hp*.5,`Endless floor ${floor} cannot one-shot a maxed hero`);}
  const first=M.encounter('campaign',1);assert.ok(3*8*.55*first.enemyAttack<145*.08&&first.enemySkillBase*first.enemyAttack<145*.1,'Stage 1 stays gentle');
  for(const i of [99,491,999])assert.equal(M.encounter('campaign',i).enemySkillBase,18,'Skill bases are flat; enemyAttack carries the level');
  for(const [i,hp] of [[1,103],[50,1198],[100,2451],[200,5717]])assert.equal(M.encounter('campaign',i).enemyHp,hp,'Early stage HP is unchanged');
  assert.equal(M.encounter('campaign',1200).turnLimit,35,'Expedition bosses allow a longer phase fight');assert.equal(M.encounter('campaign',500).turnLimit,20);}
(async()=>{const heroes=[];for(const h of ['novice','fire','ice','earth','lightning','shadow'])heroes.push(await run(h));heroes.push(await run('novice','duel'));heroes.push(await run('fire','pvp'));heroes.push(await run('novice','campaign',10));heroes.push(await run('novice','campaign',50));heroes.push(await run('novice','campaign',250));for(let tier=1;tier<=14;tier++)heroes.push(await run('novice','boss',tier));for(const d of M.WORLD.EXPANSION.definitions)heroes.push(await run('novice','campaign',d.chapter*50));heroes.push(await run('earth','campaign',750));heroes.push(await run('novice','campaign',710));console.log(JSON.stringify({passed:true,heroes,checks:'Pinned ownership, saved stats, starter run cycle, regular/elite/boss encounters, three boss skills, star result, six active skills matching their kits, rank-scaled mutations, Mika burn turns, normalized practice, divine stun, facing PvP players, local player-2 turn choice, one-time reward, and no premium reward'},null,2));})().catch(e=>{console.error(e);for(const dom of sessions)dom.window.close();process.exitCode=1;});
