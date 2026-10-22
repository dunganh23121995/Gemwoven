// Four- and six-star ultimates: each form plays its own generated strike FX and sound.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.resolve('qa/gemwoven/runtime/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  await page.locator('[data-class="fire"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  fs.mkdirSync('qa/out',{recursive:true});
  for(const key of ['fire','ice','earth','lightning','shadow'])for(const form of [1,2,3]){
   if(key==='shadow'&&form===3)continue;// qa/noct-forms.cjs covers the reaper
   await page.evaluate(([key,form])=>{gameQA.configure({key,enemyKey:key==='fire'?'ice':'fire',form,stage:5,hp:10000,enemyHp:10000,enemyMax:10000,armor:0,enemyArmor:0,energy:0,enemyEnergy:0});gameQA.setReduced(false);gameQA.setSound?.(true);},[key,form]);
   const run=page.evaluate(async form=>{
    const seen=new Set();const obs=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.classList?.contains('form-skill-fx'))seen.add([...n.classList].join(' '));});
    obs.observe(document.querySelector('#combatEffects'),{childList:true});const start=performance.now();
    await gameQA.heroUltimate();obs.disconnect();return {ms:performance.now()-start,fx:[...seen],left:document.querySelectorAll('.form-skill-fx,.form-skill-flash').length};
   },form);
   await page.waitForTimeout(form===3?1300:1550);await page.screenshot({path:`qa/out/skill-${key}-${form}.png`,clip:{x:0,y:60,width:390,height:300}});
   const r=await run;
   if(form===1)assert.equal(r.fx.length,0,`${key} form 1 keeps its original ultimate`);
   else{assert.equal(r.fx.length,1,`${key} form ${form} strike`);assert.ok(r.fx[0].includes(`form-skill-${form}`)&&r.fx[0].includes(key));}
   assert.equal(r.left,0,'strike cleaned up');assert.ok(r.ms<5200,`${key} ${form} ${r.ms}`);
   checks.push(`${key} form ${form}: ${Math.round(r.ms)}ms ${r.fx.join('|')||'original'}`);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
