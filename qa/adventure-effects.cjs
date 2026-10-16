const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',e=>errors.push(e.stack));
  await page.addInitScript(()=>{
   window.soundNotes=[];
   const create=AudioContext.prototype.createOscillator;
   AudioContext.prototype.createOscillator=function(...args){const o=create.apply(this,args),start=o.start,set=o.frequency.setValueAtTime;let pitch=0;o.frequency.setValueAtTime=function(value,...args){pitch=value;return set.call(this,value,...args);};o.start=function(...args){soundNotes.push({frequency:pitch,type:o.type});return start.apply(this,args);};return o;};
  });
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  const signatures=[];
  for(const [type,kind]of [[0,'normal'],[1,'normal'],[2,'normal'],[3,'normal'],[4,'normal'],[0,'bolt'],[0,'bomb'],[0,'core']]){
   await page.waitForTimeout(40);
   signatures.push(await page.evaluate(({type,kind})=>{soundNotes.length=0;gameQA.boardItemSound(type,kind);return JSON.stringify(soundNotes);},{type,kind}));
  }
  assert.equal(new Set(signatures).size,8);assert.ok(signatures.every(s=>s!=='[]'));
  await page.locator('#soundBtn').click();
  assert.equal(await page.evaluate(()=>{soundNotes.length=0;gameQA.boardItemSound(0,'bomb');return soundNotes.length;}),0);
  checks.push('Five item sounds and three special signatures differ; mute prevents new voices');
  await page.evaluate(()=>{window.shake=gameQA.boardImpactShake(5);});
  await page.waitForTimeout(80);
  assert.notEqual(await page.locator('#boardFrame').evaluate(n=>getComputedStyle(n).transform),'none');
  await page.evaluate(()=>shake);
  assert.equal(await page.locator('#boardFrame').evaluate(n=>getComputedStyle(n).transform),'none');
  await page.evaluate(async()=>{gameQA.setReduced(true);await gameQA.boardImpactShake(5);});
  assert.equal(await page.locator('#boardFrame').evaluate(n=>getComputedStyle(n).transform),'none');
  checks.push('Board shake moves only its own frame, settles cleanly and is disabled by NO FX');
  const scenes=[];
  for(const key of ['fire','earth','ice','lightning']){
   await page.evaluate(key=>{gameQA.configure({key:'fire',enemyKey:key,stage:5});gameQA.setReduced(false);},key);
   await page.locator('.encounter-scenery').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
   scenes.push(await page.locator('.encounter-scenery').first().getAttribute('src'));
   assert.equal(await page.locator('#enemyActor .boss-gloom').count(),1);
   await page.screenshot({path:`qa/encounter-${key}.png`,fullPage:true});
  }
  assert.equal(new Set(scenes).size,4);
  checks.push('Four distinct boss environments render with attached gloom; mobile captures saved');
  async function chainRun(reduced){return page.evaluate(async reduced=>{
   gameQA.configure({key:'earth',enemyKey:'earth',stage:1,hp:50,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0});gameQA.setReduced(reduced);
   const live=gameQA.createLiveCombat();let id=9000;
   const stances=[];const observer=new MutationObserver(()=>{const n=document.querySelector('#heroActor');if(n.dataset.attackStance)stances.push(n.dataset.attackStance);});
   observer.observe(document.querySelector('#heroActor'),{attributes:true,attributeFilter:['data-attack-stance']});
   for(const [i,type]of [0,0,1,0,0].entries()){
    const targets=Array.from({length:3},()=>({id:++id,type}));
    live.beginWave(i+1,{targets,playerTiles:new Set()},'hero');targets.forEach(t=>live.collect(t,'hero',i+1));
   }
   await live.finish();await live.cancel();observer.disconnect();
   return {damage:10000-gameQA.state.enemyHp,energy:gameQA.state.energy,hp:gameQA.state.hp,stances,effects:gameQA.effects};
  },reduced);}
  const full=await chainRun(false),none=await chainRun(true);
  assert.equal(full.damage,103);assert.equal(none.damage,103);assert.equal(full.energy,none.energy);assert.equal(full.hp,none.hp);assert.equal(full.effects,0);assert.equal(none.effects,0);
  assert.deepEqual(full.stances,['sweep','rising','sweep','rising']);
  checks.push('Sword waves gain +15%; a healing-only wave resets the chain; full FX and NO FX both deal 103 damage with identical resources');
  const damage=[];
  for(const attackChain of [1,2,3,7,9]){
   damage.push(await page.evaluate(async attackChain=>{gameQA.configure({key:'earth',enemyKey:'earth',stage:1,hp:170,enemyHp:10000,enemyMax:10000,enemyArmor:0});gameQA.setReduced(true);await gameQA.attack('hero',100,{attackChain});return 10000-gameQA.state.enemyHp;},attackChain));
  }
  assert.deepEqual(damage,[100,115,195,190,285]);
  checks.push('Attack chain multiplier rises per sword wave and caps at +90%');
  await page.evaluate(()=>{gameQA.configure({stage:4,key:'fire',enemyKey:'earth',hp:170,enemyHp:0,energy:22});gameQA.setReduced(false);window.victory=gameQA.finishBattle();});
  await page.locator('#heroActor[data-departing]').waitFor({state:'attached'});
  assert.equal(await page.locator('#resultDialog').evaluate(n=>n.open),false);
  await page.waitForTimeout(200);await page.screenshot({path:'qa/hero-departure.png',fullPage:true});
  await page.evaluate(()=>victory);
  await page.locator('#nextBtn').click();
  await page.locator('.encounter-intro').waitFor({state:'visible'});
  assert.equal(await page.locator('#selectDialog').evaluate(n=>n.open),false);
  assert.equal(await page.evaluate(()=>gameQA.locked),true);
  await page.screenshot({path:'qa/next-boss-preview.png',fullPage:true});
  await page.locator('#selectDialog').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>gameQA.state.stage),5);
  await page.locator('[data-class="ice"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  assert.deepEqual(await page.evaluate(()=>({key:gameQA.state.key,boss:gameQA.state.boss,energy:gameQA.state.energy,locked:gameQA.locked})),{key:'ice',boss:true,energy:22,locked:false});
  checks.push('Victory departure precedes result; next boss appears before selection, input stays locked, and hero choice works on boss stages');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,chain:full,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
