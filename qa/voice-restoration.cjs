const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(require('node:url').pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>gameQA.warmCombatVoices());
  for(const key of ['fire','earth','ice','lightning']){
   const result=await page.evaluate(async key=>{
    gameQA.stopCombatVoices();gameQA.configure({key,enemyKey:'earth',stage:5,hp:80,armor:0,energy:0,enemyHp:3000,enemyMax:3000});gameQA.setReduced(false);
    const played=await gameQA.combatVoice('hero','attack'),first=document.querySelector('#heroActor').dataset.voiceClip;
    await new Promise(r=>setTimeout(r,150));const duplicate=await gameQA.combatVoice('hero','attack'),held=document.querySelector('#heroActor').dataset.voiceClip;
    return {played,duplicate,first,held};
   },key);
   assert.equal(result.played,true);assert.equal(result.duplicate,false);assert.equal(result.held,result.first);
   await page.waitForFunction(()=>!document.querySelector('#heroActor').dataset.voiceClip);
   assert.equal(await page.evaluate(()=>gameQA.combatVoice('hero','hurt')),true);
  }
  checks.push('Four recorded character voices decode offline; hit bursts preserve the complete syllable; hurt can play afterward');
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.combatVoice('hero','cast')),false);
  assert.equal(await page.locator('[data-voice-clip]').count(),0);await page.locator('#soundBtn').click();
  checks.push('Mute stops active speech and prevents new voice playback; re-enable starts cleanly');
  for(const side of ['hero','enemy'])for(const kind of ['heal','armor']){
   await page.evaluate(({side,kind})=>{gameQA.stopCombatVoices();gameQA.configure({key:'ice',enemyKey:'earth',stage:5,hp:80,armor:0,energy:0,enemyHp:1000,enemyMax:2000,enemyArmor:0});window.restore=gameQA.buff(side,kind,20);},{side,kind});
   await page.locator('.restoration-field').waitFor({state:'attached'});
   assert.equal(await page.locator('.combat-v3-buff-shield').count(),0);
   assert.equal(await page.locator(kind==='heal'?'.restoration-petal':'.sanctuary-crystal').count(),kind==='heal'?12:8);
   await page.waitForTimeout(100);await page.screenshot({path:`qa/restoration-${side}-${kind}.png`});await page.evaluate(()=>restore);
   const state=await page.evaluate(()=>({s:{...gameQA.state},effects:gameQA.effects}));assert.equal(state.effects,0);
   assert.equal(state.s[kind==='heal'?(side==='hero'?'hp':'enemyHp'):(side==='hero'?'armor':'enemyArmor')],kind==='heal'?(side==='hero'?100:1020):20);
   assert.equal(await page.locator('.restoration-field').count(),0);
  }
  checks.push('Healing petals and crystal domes replace the old icons on both actors; stats apply once and effects clean up');
  await page.evaluate(()=>{window.first=gameQA.combatLootReceive('hero',4);window.second=gameQA.combatLootReceive('hero',4);});assert.equal(await page.locator('.restoration-field').count(),1);
  await page.evaluate(()=>Promise.all([first,second]));
  await page.evaluate(()=>gameQA.setReduced(true));await page.evaluate(()=>gameQA.restorationEffect('hero','heal'));assert.equal(await page.locator('.restoration-field').count(),0);
  checks.push('Repeated pickups share an aura; NO FX skips the new artwork');
  assert.deepEqual(errors,[]);const result={passed:checks.length,checks,errors};fs.writeFileSync('qa/voice-restoration-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
