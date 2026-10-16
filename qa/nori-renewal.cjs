const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const checks=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(require('node:url').pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{
   window.fixture=(key='earth',hp=100)=>{gameQA.configure({key,hp,armor:0,energy:0,enemyKey:'earth',enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,stage:5,boss:true,stunned:false,playerFrozen:false});gameQA.setReduced(false);};
   window.nextTurn=async()=>{gameQA.state.stunned=true;await gameQA.enemyAction();return {hp:gameQA.state.hp,turns:gameQA.state.noriRegenTurns};};
   fixture();gameQA.state.enemyArmor=77;window.cast=(async()=>{const start=performance.now();await gameQA.heroUltimate();return performance.now()-start;})();
  });
  await page.waitForTimeout(2200);await page.screenshot({path:'qa/nori-renewal-cast.png'});
  const duration=await page.evaluate(()=>cast);assert.ok(duration>=2950&&duration<3400);
  assert.deepEqual(await page.evaluate(()=>({hp:gameQA.state.hp,enemyHp:gameQA.state.enemyHp,stunned:gameQA.state.stunned,turns:gameQA.state.noriRegenTurns})),{hp:100,enemyHp:10000,stunned:true,turns:3});
  assert.equal(await page.locator('[data-regeneration]').count(),1);
  assert.equal(await page.evaluate(()=>gameQA.state.enemyArmor),77);
  await page.waitForTimeout(2000);assert.equal(await page.evaluate(()=>gameQA.state.hp),100);
  assert.equal(await page.locator('[data-regeneration]').count(),1);await page.screenshot({path:'qa/nori-renewal-active.png'});
  await page.evaluate(async()=>{
   const types=gameQA.board.map(row=>row.map(t=>t.type));
   const matched=a=>a.some((row,r)=>row.some((v,c)=>c<6&&v===row[c+1]&&v===row[c+2]||r<6&&v===a[r+1][c]&&v===a[r+2][c]));
   for(let r=0;r<8;r++)for(let c=0;c<7;c++){
    const a=types.map(row=>row.slice());[a[r][c],a[r][c+1]]=[a[r][c+1],a[r][c]];
    if(!matched(a)){await gameQA.trySwap(gameQA.board[r][c],gameQA.board[r][c+1]);return;}
   }throw Error('Expected an invalid swap');
  });
  assert.equal(await page.evaluate(()=>gameQA.state.noriRegenTurns),3);assert.equal(await page.evaluate(()=>gameQA.state.hp),100);
  const pulses=[await page.evaluate(async()=>{await gameQA.enemyAction();return {hp:gameQA.state.hp,turns:gameQA.state.noriRegenTurns};})];
  assert.equal(await page.evaluate(()=>gameQA.state.stunned),true);assert.equal(await page.evaluate(()=>gameQA.state.noriStunTurns),1);assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),10000);
  for(let i=1;i<4;i++)pulses.push(await page.evaluate(()=>nextTurn()));
  assert.deepEqual(pulses,[{hp:140,turns:2},{hp:180,turns:1},{hp:220,turns:0},{hp:220,turns:0}]);
  assert.equal(await page.locator('.self-buff-flow,.self-buff-back').count(),0);
  checks.push('3-second shield rush, stun without damage; exactly 40 HP on each of 3 subsequent player turns; persistent particles expire');
  const refresh=await page.evaluate(async()=>{fixture();gameQA.setReduced(true);await gameQA.heroUltimate();await nextTurn();await gameQA.heroUltimate();const result=[];for(let i=0;i<4;i++)result.push(await nextTurn());return result;});
  assert.deepEqual(refresh.map(x=>x.hp),[180,220,260,260]);assert.deepEqual(refresh.map(x=>x.turns),[2,1,0,0]);
  const cap=await page.evaluate(async()=>{fixture('earth',310);gameQA.setReduced(true);await gameQA.heroUltimate();return [await nextTurn(),await nextTurn(),await nextTurn()];});
  assert.deepEqual(cap.map(x=>x.hp),[320,320,320]);assert.deepEqual(cap.map(x=>x.turns),[2,1,0]);
  checks.push('Recast refreshes instead of stacking; max HP clamp; NO FX preserves all pulses');
  await page.evaluate(async()=>{fixture();gameQA.setReduced(true);await gameQA.heroUltimate();gameQA.setReduced(false);});
  assert.equal(await page.locator('[data-regeneration]').count(),1);
  await page.evaluate(()=>{gameQA.damage('enemy',1000);});assert.equal(await page.locator('[data-regeneration]').count(),0);
  assert.equal(await page.evaluate(async()=>{await nextTurn();return gameQA.state.hp;}),0);
  await page.evaluate(()=>fixture('fire'));assert.equal(await page.evaluate(()=>gameQA.state.noriRegenTurns),0);
  assert.equal(await page.locator('.self-buff-flow,.self-buff-back').count(),0);
  checks.push('Death cannot resurrect; switching hero/stage clears buff; NO FX toggle remounts active particles');
  for(const key of ['fire','earth','ice','lightning','shadow'])for(const kind of ['heal','armor']){
   await page.evaluate(({key,kind})=>{fixture(key);window.buffJob=gameQA.buff('hero',kind,12);},{key,kind});
   await page.waitForTimeout(540);
   const flow=page.locator('.self-buff-flow');assert.equal(await flow.count(),1);
   const filled=await flow.locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,512,512).data.some((v,i)=>i%4===3&&v>0));assert.ok(filled);
   assert.equal(await page.locator('.cast-channel,.cast-ward,.electric-crown,.sanctuary-crystal,.restoration-petal').count(),0);
   await page.screenshot({path:`qa/self-buff-${key}-${kind}.png`});await page.evaluate(()=>buffJob);
   assert.equal(await page.locator('.self-buff-flow,.self-buff-back').count(),0);assert.equal(await page.evaluate(()=>gameQA.effects),0);
   assert.equal(await page.evaluate(kind=>kind==='heal'?gameQA.state.hp:gameQA.state.armor,kind),kind==='heal'?112:12);
  }
  checks.push('All five heroes: heal and armor spiral around the body, retain resource gains, clean up without old emblem FX');
  assert.deepEqual(errors,[]);fs.writeFileSync('qa/nori-renewal-results.json',JSON.stringify({passed:true,duration,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
