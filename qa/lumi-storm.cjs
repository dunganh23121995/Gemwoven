const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:!process.env.GAME_TEST_URL});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  const run=page.evaluate(async()=>{
   gameQA.configure({key:'lightning',enemyKey:'earth',stage:5,hp:200,armor:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,energy:0});gameQA.setReduced(false);
   const start=performance.now(),samples=[],strikes=new Set(),thunder=new Set();
   const timer=setInterval(()=>{
    document.querySelectorAll('.lumi-storm-bolt').forEach(n=>strikes.add(n.dataset.strike));
    const sounds=gameQA.castSounds.filter(id=>id.includes('thunder-'));sounds.forEach(id=>thunder.add(id));
    samples.push({t:performance.now()-start,cloud:!!document.querySelector('.lumi-storm-cloud'),hp:gameQA.state.enemyHp,bolts:document.querySelectorAll('.lumi-storm-bolt').length,thunder:sounds.filter(id=>!id.endsWith('-rumble')).length,rumble:sounds.includes('lightning-thunder-rumble'),oldCharge:gameQA.castSounds.includes('lightning-charge')});
   },20);
   await gameQA.heroUltimate();clearInterval(timer);
   return {duration:performance.now()-start,samples,strikes:[...strikes],thunder:[...thunder],hp:gameQA.state.enemyHp,effects:gameQA.effects,nodes:document.querySelectorAll('.lumi-storm-cloud,.lumi-storm-bolt,.lumi-charge-mantle').length};
  });
  await page.waitForTimeout(1350);await page.screenshot({path:'qa/lumi-storm-chant.png'});
  assert.equal(await page.locator('#heroActor .lumi-charge-mantle[data-electric-mode="mantle"]').count(),1);
  assert.equal(await page.locator('.cast-channel[data-caster="hero"][data-electric-mode="corona"]').count(),0);
  await page.waitForFunction(()=>!!document.querySelector('.lumi-storm-bolt[data-strike="2"]'));await page.screenshot({path:'qa/lumi-storm-strikes.png'});
  const result=await run;
  assert.equal(result.strikes.length,5);assert.equal(result.hp,9860);assert.equal(result.effects,0);assert.equal(result.nodes,0);
  assert.ok(result.duration>=2950&&result.duration<3400,`Duration ${result.duration}`);
  assert.ok(result.samples.some(s=>s.t<1500&&s.cloud&&s.hp===10000&&s.bolts===0));
  assert.ok(result.samples.some(s=>s.bolts>=3));
  assert.deepEqual(result.thunder.sort(),['lightning-thunder-crack','lightning-thunder-open','lightning-thunder-rumble','lightning-thunder-tail']);
  assert.ok(result.samples.filter(s=>s.t<1800).every(s=>s.thunder===0),'Thunder starts at impact, not during chanting');
  assert.ok(result.samples.some(s=>s.t<1400&&s.rumble&&s.hp===10000),'Rumble accompanies chanting');
  assert.ok(result.samples.filter(s=>s.t>1900).every(s=>!s.rumble),'Chant rumble ends before the strikes');
  assert.ok(result.samples.every(s=>!s.oldCharge),'Old electrical charge tone does not mask the natural rumble');
  assert.ok((await page.evaluate(()=>gameQA.castSounds)).includes('lightning-thunder-tail'),'Natural thunder decay continues after the 3-second skill finishes');
  await page.waitForTimeout(4300);
  assert.equal((await page.evaluate(()=>gameQA.castSounds)).filter(id=>id.includes('thunder-')).length,0,'Recorded decay finishes and releases audio sources naturally');
  await page.evaluate(()=>gameQA.stopCastSounds());
  const fast=await page.evaluate(async()=>{gameQA.configure({key:'lightning',enemyKey:'earth',stage:5,hp:200,enemyHp:10000,enemyMax:10000,enemyArmor:0});gameQA.setReduced(true);const start=performance.now();await gameQA.heroUltimate();return {duration:performance.now()-start,hp:gameQA.state.enemyHp,nodes:document.querySelectorAll('.lumi-storm-cloud,.lumi-storm-bolt').length};});
  assert.ok(fast.duration<500);assert.equal(fast.hp,9860);assert.equal(fast.nodes,0);assert.deepEqual(errors,[]);
  await page.waitForTimeout(80);
  assert.deepEqual(await page.evaluate(()=>gameQA.castSounds.filter(id=>id.includes('thunder-'))),['lightning-thunder-open']);
  await page.evaluate(()=>gameQA.stopCastSounds());
  await page.locator('#soundBtn').click();
  await page.evaluate(()=>gameQA.heroUltimate());
  assert.deepEqual(await page.evaluate(()=>gameQA.castSounds),[]);
  const report={passed:true,duration:result.duration,strikes:result.strikes.length,damage:10000-result.hp,thunder:result.thunder,noFx:fast,errors};fs.writeFileSync('qa/lumi-storm-results.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
