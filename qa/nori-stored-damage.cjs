const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(require('node:url').pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{window.fixture=(extra={})=>{gameQA.configure({key:'earth',enemyKey:'fire',stage:5,boss:true,hp:100,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,...extra});gameQA.setReduced(true);};fixture();});
  assert.equal(await page.evaluate(()=>gameQA.damage('hero',100).amount),60);
  const turns=await page.evaluate(async()=>{
   fixture({enemyArmor:30,enemyEnergy:100});const board=gameQA.board.map(r=>r.map(t=>t.id));
   await gameQA.heroUltimate();const initial={hp:gameQA.state.enemyHp,armor:gameQA.state.enemyArmor,turns:gameQA.state.noriStunTurns};
   const hit=gameQA.damage('hero',100);await gameQA.enemyAction();const one={...gameQA.state};
   gameQA.damage('hero',50);await gameQA.enemyAction();
   return {initial,hit,one,two:{...gameQA.state},sameBoard:JSON.stringify(board)===JSON.stringify(gameQA.board.map(r=>r.map(t=>t.id)))};
  });
  assert.deepEqual(turns.initial,{hp:10000,armor:30,turns:2});assert.deepEqual(turns.hit,{amount:0,blocked:0,stored:60});
  assert.equal(turns.one.enemyHp,10000);assert.equal(turns.one.enemyArmor,30);assert.equal(turns.one.noriStoredDamage,60);assert.equal(turns.one.noriStunTurns,1);assert.equal(turns.one.hp,140);
  assert.equal(turns.two.enemyHp,9760);assert.equal(turns.two.enemyArmor,0);assert.equal(turns.two.hp,180);assert.equal(turns.two.noriStunTurns,0);assert.equal(turns.two.noriStoredDamage,0);assert.equal(turns.two.stunned,false);assert.equal(turns.two.enemyEnergy,100);assert.ok(turns.sameBoard);
  checks.push('60% base damage; no instant ult damage; two skipped enemy turns including full-rage boss; 90 stored bursts for 270 against armor once; healing retained');
  const refresh=await page.evaluate(async()=>{fixture();await gameQA.heroUltimate();gameQA.damage('hero',100);await gameQA.enemyAction();await gameQA.heroUltimate();return {turns:gameQA.state.noriStunTurns,pool:gameQA.state.noriStoredDamage,hp:gameQA.state.enemyHp};});
  assert.deepEqual(refresh,{turns:2,pool:60,hp:10000});
  const critical=await page.evaluate(async()=>{fixture();await gameQA.heroUltimate();const result=await gameQA.attack('hero',100,{attackChain:3,hits:3,damageLedger:{raw:0,applied:0}});return {result,pool:gameQA.state.noriStoredDamage,hp:gameQA.state.enemyHp};});
  assert.equal(critical.result.stored,117);assert.equal(critical.pool,117);assert.equal(critical.hp,10000);
  const element=await page.evaluate(async()=>{fixture({enemyKey:'lightning'});await gameQA.heroUltimate();gameQA.damage('hero',100);await gameQA.enemyAction();await gameQA.enemyAction();return gameQA.state.enemyHp;});assert.equal(element,9730);
  checks.push('Recast preserves stored damage and refreshes duration; multi-hit critical ledger and elemental advantage apply only once');
  const live=await page.evaluate(async()=>{
   fixture({energy:100,enemyEnergy:100});const queue=gameQA.createLiveCombat();
   const swords=gameQA.board.flat().filter(t=>t.type===0).slice(0,3);
   if(swords.length!==3)throw Error('Expected three sword tiles');
   queue.beginWave(1,{targets:swords,playerTiles:new Set()},'hero');
   swords.forEach(t=>queue.collect(t,'hero',1));await queue.finish();
   return {hp:gameQA.state.hp,enemyHp:gameQA.state.enemyHp,pool:gameQA.state.noriStoredDamage,turns:gameQA.state.noriStunTurns,enemyEnergy:gameQA.state.enemyEnergy};
  });
  assert.deepEqual(live,{hp:100,enemyHp:10000,pool:14,turns:2,enemyEnergy:100});
  checks.push('Live board queue stores matched-sword damage and refunds an enemy ultimate reserved before the stun');
  const lethal=await page.evaluate(async()=>{fixture({enemyHp:100});await gameQA.heroUltimate();gameQA.damage('hero',100);await gameQA.enemyAction();await gameQA.enemyAction();return {hp:gameQA.state.enemyHp,pool:gameQA.state.noriStoredDamage,turns:gameQA.state.noriStunTurns};});assert.deepEqual(lethal,{hp:0,pool:0,turns:0});
  const death=await page.evaluate(async()=>{fixture();await gameQA.heroUltimate();gameQA.damage('hero',100);gameQA.damage('enemy',9999);return {hp:gameQA.state.hp,pool:gameQA.state.noriStoredDamage,turns:gameQA.state.noriStunTurns};});assert.deepEqual(death,{hp:0,pool:0,turns:0});
  const reset=await page.evaluate(()=>{fixture({key:'fire'});return {pool:gameQA.state.noriStoredDamage,turns:gameQA.state.noriStunTurns,nodes:document.querySelectorAll('.nori-damage-seal,.nori-shield-aura').length};});assert.deepEqual(reset,{pool:0,turns:0,nodes:0});
  checks.push('Lethal burst, defeat, new stage and hero changes clear all stored state');
  await page.evaluate(()=>{fixture();gameQA.setReduced(false);gameQA.setSpriteFrame('hero','idle',0);});await page.waitForTimeout(450);assert.equal(await page.locator('.nori-shield-aura:not([hidden])').count(),1);await page.screenshot({path:'qa/nori-curved-idle.png'});
  await page.evaluate(()=>gameQA.setSpriteFrame('hero','run',0));assert.equal(await page.locator('.nori-shield-aura:not([hidden])').count(),0);
  const spell=page.evaluate(async()=>{const start=performance.now();await gameQA.heroUltimate();return performance.now()-start;});await page.waitForTimeout(2050);await page.screenshot({path:'qa/nori-seal-cast.png'});const duration=await spell;assert.ok(duration>=2950&&duration<3400);
  await page.evaluate(()=>gameQA.damage('hero',100));assert.match(await page.locator('.nori-damage-seal b').textContent(),/60 ×3/);await page.screenshot({path:'qa/nori-seal-stored.png'});
  await page.evaluate(()=>gameQA.enemyAction());const burst=page.evaluate(()=>gameQA.enemyAction());await page.locator('.cast-seal-burst').waitFor({state:'attached'});await page.waitForTimeout(210);await page.screenshot({path:'qa/nori-seal-burst.png'});await burst;
  assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),9820);assert.equal(await page.locator('.nori-damage-seal,.cast-seal-burst').count(),0);assert.equal(await page.evaluate(()=>gameQA.effects),0);
  checks.push('Curved shield aura follows actor, disappears for unarmed run; 3-second ult and visible seal/burst clean up');
  assert.deepEqual(errors,[]);const report={passed:true,duration,checks,errors};fs.writeFileSync('qa/nori-stored-damage-results.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
