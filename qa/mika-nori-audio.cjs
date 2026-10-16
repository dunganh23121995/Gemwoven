const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],reports=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:!process.env.GAME_TEST_URL});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  for(const key of ['earth','fire']){
   const result=await page.evaluate(async key=>{
    gameQA.stopCastSounds();gameQA.configure({key,enemyKey:key==='earth'?'fire':'earth',hp:100,enemyHp:10000,enemyMax:10000,enemyArmor:0,energy:0});gameQA.setReduced(false);
    const start=performance.now(),cues={};
    const sample=setInterval(()=>{for(const id of gameQA.castSounds)if(!cues[id])cues[id]={at:performance.now()-start,hp:gameQA.state.enemyHp,phase:document.querySelector('#heroActor').dataset.ragePhase};},8);
    try{await gameQA.heroUltimate();return {key,duration:performance.now()-start,cues,hp:gameQA.state.enemyHp,stun:gameQA.state.noriStunTurns,regen:gameQA.state.noriRegenTurns,effects:gameQA.effects,sounds:gameQA.castSounds};}finally{clearInterval(sample);}
   },key);
   assert.ok(result.duration>=2950&&result.duration<3400);assert.equal(result.effects,0);
   if(key==='earth'){
    const hit=result.cues['earth-shield-bash'];assert.ok(hit&&hit.at>=1500&&hit.at<1750);assert.equal(hit.phase,'renewal');
    assert.equal(result.hp,10000);assert.equal(result.stun,2);assert.equal(result.regen,3);assert.ok(!result.cues['earth-impact']);
   }else{
    const charge=result.cues['fire-flame-charge'],whoosh=result.cues['fire-flame-whoosh'];
    assert.ok(charge&&charge.at<500);assert.ok(whoosh&&whoosh.at>=1650&&whoosh.at<1900);assert.equal(whoosh.hp,10000);
    assert.equal(result.hp,9865);assert.ok(!result.cues['fire-charge']&&!result.cues['fire-launch']);
    assert.ok(result.sounds.includes('fire-flame-whoosh'),'Flame tail survives visual cleanup');
    await page.waitForTimeout(2800);assert.ok(!(await page.evaluate(()=>gameQA.castSounds)).includes('fire-flame-whoosh'));
   }
   reports.push(result);
  }
  await page.evaluate(()=>{gameQA.stopCastSounds();gameQA.setReduced(true);});
  for(const key of ['earth','fire']){
   const sounds=await page.evaluate(async key=>{gameQA.stopCastSounds();gameQA.configure({key,enemyKey:'ice',hp:100,enemyHp:10000,enemyMax:10000,enemyArmor:0});await gameQA.heroUltimate();await new Promise(r=>setTimeout(r,70));return gameQA.castSounds;},key);
   assert.ok(sounds.includes(key==='earth'?'earth-shield-bash':'fire-flame-whoosh'));
   if(key==='fire')assert.ok(!sounds.includes('fire-flame-charge'));
  }
  await page.locator('#soundBtn').click();await page.evaluate(()=>gameQA.heroUltimate());assert.deepEqual(await page.evaluate(()=>gameQA.castSounds),[]);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,reports,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
