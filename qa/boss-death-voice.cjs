const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const{pathToFileURL}=require('node:url');
const{chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({offline:true,viewport:{width:390,height:844}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  for(const enemyKey of ['fire','earth','ice','lightning']){
   await page.evaluate(key=>gameQA.configure({key:'shadow',enemyKey:key,stage:5,boss:true,enemyHp:50,enemyArmor:100}),enemyKey);
   await page.evaluate(()=>gameQA.damage('hero',40));
   assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),50);
   assert.equal(await page.locator('#enemyActor').getAttribute('data-voice-clip'),null);
   await page.evaluate(async()=>{await gameQA.combatVoice('enemy','cast');gameQA.damage('hero',200);});
   await page.waitForFunction(key=>document.querySelector('#enemyActor').dataset.voiceClip===`boss-${key}-death`,enemyKey);
   const result=await page.evaluate(async()=>{
    const before=document.querySelector('#enemyActor').dataset.voiceClip;
    gameQA.damage('hero',100);gameQA.damage('hero',100);
    const hurt=await gameQA.combatVoice('enemy','hurt'),repeated=await gameQA.combatVoice('enemy','death');
    return {before,after:document.querySelector('#enemyActor').dataset.voiceClip,hurt,repeated,hp:gameQA.state.enemyHp};
   });
   assert.equal(result.hp,0);assert.equal(result.hurt,false);assert.equal(result.repeated,false);assert.equal(result.before,result.after);
   await page.waitForFunction(()=>!document.querySelector('#enemyActor').dataset.voiceClip);
   assert.equal(await page.evaluate(()=>gameQA.combatVoice('enemy','death')),false);
   checks.push(`${enemyKey}: lethal damage replaces active cast with one roar; further hits cannot interrupt or replay it`);
  }
  await page.evaluate(()=>{gameQA.configure({key:'shadow',enemyKey:'fire',stage:1,boss:false,enemyHp:1,enemyArmor:0});gameQA.damage('hero',10);});
  assert.equal(await page.evaluate(()=>gameQA.combatVoice('enemy','death')),false);
  await page.evaluate(()=>gameQA.configure({key:'shadow',enemyKey:'fire',stage:5,boss:true,enemyHp:1,enemyArmor:0}));
  await page.locator('#soundBtn').click();await page.evaluate(()=>gameQA.damage('hero',10));await page.waitForTimeout(100);
  assert.equal(await page.locator('#enemyActor').getAttribute('data-voice-clip'),null);
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.combatVoice('enemy','death')),false);
  checks.push('Normal monsters do not use the boss roar; mute suppresses it without a delayed replay');
  await page.evaluate(()=>{gameQA.configure({key:'shadow',enemyKey:'earth',stage:10,boss:true,enemyHp:1,enemyArmor:0});gameQA.setReduced(true);gameQA.damage('hero',10);});
  await page.waitForFunction(()=>document.querySelector('#enemyActor').dataset.voiceClip==='boss-earth-death');
  await page.evaluate(()=>gameQA.configure({stage:11,boss:false,enemyKey:'ice',enemyHp:200}));
  assert.equal(await page.locator('#enemyActor').getAttribute('data-voice-clip'),null);
  checks.push('New encounter resets roar eligibility; NO FX preserves audio; stage change cancels old voices');
  assert.deepEqual(errors,[]);fs.writeFileSync('qa/boss-death-voice-results.json',JSON.stringify({passed:checks.length,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
