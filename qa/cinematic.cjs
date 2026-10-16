const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[],timings=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{
   window.fixture=(key='fire',side='hero',noFx=false)=>{gameQA.configure({key:side==='hero'?key:'earth',enemyKey:side==='enemy'?key:'fire',stage:5,hp:10000,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,enraged:false,stunned:false,playerFrozen:false});gameQA.setReduced(noFx);};
   window.voiceStarts=[];const create=AudioContext.prototype.createOscillator;
   AudioContext.prototype.createOscillator=function(...args){const o=create.apply(this,args),start=o.start,set=o.frequency.setValueAtTime;let pitch=0;o.frequency.setValueAtTime=function(value,...args){pitch=value;return set.call(this,value,...args);};o.start=function(...args){voiceStarts.push({pitch,type:o.type});return start.apply(this,args);};return o;};
  });
  for(const side of ['hero','enemy'])for(const key of ['fire','earth','ice','lightning']){
   const pendingResult=page.evaluate(async({side,key})=>{
    fixture(key,side);const start=performance.now(),samples=[];
    const timer=setInterval(()=>samples.push({t:performance.now()-start,hp:gameQA.state.hp,enemyHp:gameQA.state.enemyHp,phase:document.querySelector('#'+side+'Actor').dataset.ragePhase,action:document.querySelector('#'+side+'Actor .sprite-body').dataset.action,sky:!!document.querySelector('.rage-skyfall')}),35);
    if(side==='hero')await gameQA.heroUltimate();else await gameQA.enemySkill();
    clearInterval(timer);return {ms:performance.now()-start,samples,state:{...gameQA.state},effects:gameQA.effects,nodes:document.querySelectorAll('.rage-aura,.rage-skyfall,.loot-reception,#combatEffects>*').length};
   },{side,key});
   if(side==='hero'){await page.waitForTimeout(key==='earth'?2080:1900);await page.screenshot({path:`qa/cinematic-rage-${key}.png`});}
   const result=await pendingResult;
   assert.ok(result.ms>=2950&&result.ms<3250,`${side}/${key}: ${result.ms}`);
   assert.ok(result.samples.filter(s=>s.t<1500).every(s=>s.hp===10000&&s.enemyHp===10000));
   assert.ok(result.samples.some(s=>s.phase===(side==='hero'&&key==='earth'?'renewal':'impact')));
   if(key==='ice'||key==='lightning')assert.ok(result.samples.some(s=>s.sky));
   if(side==='hero'&&key==='earth'){assert.ok(result.samples.some(s=>s.action==='cast'));assert.equal(result.state.noriRegenTurns,3);assert.equal(result.state.enemyHp,10000);}
   if(side==='hero'&&key==='ice'){assert.equal(result.state.armor,25);assert.equal(result.state.enemyHp,9940);assert.equal(result.state.hp,10000);assert.equal(result.state.stunned,true);}
   assert.equal(result.effects,0);assert.equal(result.nodes,0);timings.push({side,key,ms:Math.round(result.ms)});
  }
  checks.push('All eight rage skills last 3 seconds, charge before damage, use distinct melee/caster poses and clean up');
  const positions=await page.evaluate(async()=>{
   fixture('fire');const root=document.querySelector('#heroActor'),start=performance.now(),positions=[];
   const timer=setInterval(()=>positions.push({t:performance.now()-start,x:new DOMMatrix(getComputedStyle(root).transform).m41}),20);
   await gameQA.heroUltimate();clearInterval(timer);return positions;
  });
  const hold=positions,rest=positions.filter(p=>p.t>2900);
  assert.ok(Math.max(...hold.map(p=>p.x))-Math.min(...hold.map(p=>p.x))<=.1,'Mika stays planted while charging, slashing and launching the sword wave');
  assert.ok(rest.every(p=>Math.abs(p.x-positions[0].x)<1),'Recovery stays at home');
  const fast=await page.evaluate(async()=>{fixture('fire','hero',true);const start=performance.now();await gameQA.heroUltimate();return {time:performance.now()-start,damage:10000-gameQA.state.enemyHp};});
  assert.ok(fast.time<500);assert.equal(fast.damage,135);checks.push('NO FX skips cinematic waits while preserving skill damage');
  const damage=[];
  for(const [key,enemyKey,attackChain]of [['fire','ice',1],['ice','earth',1],['earth','lightning',1],['lightning','fire',1],['fire','fire',1],['fire','fire',3],['fire','ice',3]]){
   damage.push(await page.evaluate(async options=>{fixture(options.key,'hero',true);Object.assign(gameQA.state,options);await gameQA.attack('hero',100,{attackChain:options.attackChain});return 10000-gameQA.state.enemyHp;},{key,enemyKey,attackChain}));
  }
  assert.deepEqual(damage,[150,150,90,150,100,195,293]);checks.push('All four elemental advantages are ×1.5; each third attack-chain wave crits ×1.5 and stacks correctly');
  await page.evaluate(()=>{fixture('earth');window.crit=gameQA.attack('hero',100,{attackChain:3});});
  await page.locator('.combat-v3-number.crit').waitFor({state:'visible'});await page.screenshot({path:'qa/cinematic-crit.png'});await page.evaluate(()=>crit);
  assert.equal(await page.evaluate(()=>10000-gameQA.state.enemyHp),117);
  await page.evaluate(()=>{fixture();window.recoil=gameQA.boardItemRecoil(gameQA.board[3][3],5);});await page.waitForTimeout(100);
  const motions=await page.locator('.item-art').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).transform));assert.ok(new Set(motions).size>5);
  await page.evaluate(()=>recoil);assert.equal(await page.locator('.item-art').evaluateAll(nodes=>nodes.some(n=>n.getAnimations().length)),false);
  checks.push('Items recoil individually with distance-based movement and restore their transforms');
  for(const [kind,count]of [['bolt',24],['bomb',32],['core',40]]){
   await page.evaluate(kind=>{window.nova=gameQA.specialStarNova(gameQA.board[3][3],kind);},kind);await page.waitForTimeout(180);
   assert.equal(await page.locator('[data-nova-star]').count(),count);await page.screenshot({path:`qa/cinematic-nova-${kind}.png`});await page.evaluate(()=>nova);
   assert.equal(await page.locator('[data-nova-star]').count(),0);
  }
  checks.push('Special tiers create 24/32/40 bright spreading stars, then fade and remove all nodes');
  for(let type=0;type<5;type++){
   await page.evaluate(type=>{window.loot=gameQA.combatLootReceive('hero',type);},type);
   assert.equal(await page.locator('.loot-reception,.restoration-field').count(),1);
   await page.evaluate(()=>loot);assert.equal(await page.locator('.loot-reception,.restoration-field').count(),0);
  }
  checks.push('Five gem reception effects attach to the actor and settle cleanly');
  for(const key of ['fire','earth','ice','lightning']){
   await page.evaluate(key=>{fixture(key);window.depart=gameQA.departVictoriousHero();},key);await page.waitForTimeout(1400);
   const travel=await page.evaluate(()=>({camera:+document.querySelector('#scene').dataset.cameraX,world:+document.querySelector('#heroActor').dataset.worldX,action:document.querySelector('#heroActor .sprite-body').dataset.action,frame:+document.querySelector('#heroActor .sprite-body').dataset.frame,transforms:[...document.querySelectorAll('.parallax-layer')].map(n=>getComputedStyle(n).transform)}));
   assert.equal(travel.action,key==='lightning'?'hover':'run');assert.ok(travel.frame>=0&&travel.frame<=5);assert.ok(travel.world>travel.camera&&travel.camera>40);assert.equal(new Set(travel.transforms).size,3);
   await page.screenshot({path:`qa/cinematic-run-${key}.png`});await page.evaluate(()=>depart);
  }
  checks.push('Three unarmed run cycles and Lumi hover drive a longer world and three distinct parallax speeds');
  const voices=await page.evaluate(async()=>{gameQA.stopCombatVoices();return [await gameQA.combatVoice('hero','attack'),await gameQA.combatVoice('enemy','hurt')];});
  assert.deepEqual(voices,[true,true]);
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.combatVoice('hero','cast')),false);
  checks.push('Recorded hero/monster voices play independently and respect mute');
  assert.deepEqual(errors,[]);const report={passed:checks.length,checks,timings,damage,errors};fs.writeFileSync('qa/cinematic-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
