const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const{pathToFileURL}=require('node:url');
const{chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({offline:true,viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');await page.locator('[data-class="shadow"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  const manifest=JSON.parse(fs.readFileSync('assets/audio/noct-sfx-manifest.json'));
  assert.equal(Object.keys(manifest).length,9);
  for(const [id,meta] of Object.entries(manifest)){
   assert.ok(meta.peak<=.78&&meta.rms>0&&meta.duration<=1.1);
   assert.equal(await page.evaluate(async id=>{gameQA.stopNoctSounds();return gameQA.playNoctSound(id);},id),true);
  }
  const result=await page.evaluate(async()=>{
   gameQA.configure({key:'shadow',enemyKey:'earth',enemyHp:10000,enemyMax:10000,enemyArmor:0});gameQA.setReduced(false);await gameQA.warmNoctSounds();
   const samples=[],voices=[];const root=document.querySelector('#heroActor');
   const timer=setInterval(()=>{samples.push(gameQA.noctSounds);if(root.dataset.voiceClip)voices.push(root.dataset.voiceClip);},10);
   const start=performance.now();await gameQA.heroUltimate();clearInterval(timer);
   return {samples,voices:[...new Set(voices)],damage:10000-gameQA.state.enemyHp,duration:performance.now()-start};
  });
  assert.equal(result.damage,150);assert.ok(result.duration>=2950&&result.duration<3350);
  assert.ok(result.samples.every(s=>s.length<=8));
  const sounds=result.samples.flat(),ids=new Set(sounds.map(s=>s.id));
  for(const id of ['charge','slash1','slash2','slash3','dash','hit','finish','sheath'])assert.ok(ids.has(id),id);
  assert.ok(sounds.some(s=>s.id.startsWith('slash')&&s.pan<0));assert.ok(sounds.some(s=>s.id.startsWith('slash')&&s.pan>0));
  assert.ok(result.voices.includes('noct-cast')&&result.voices.includes('noct-release'));
  await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>gameQA.noctSounds.length),0);
  await page.evaluate(async()=>{gameQA.setReduced(true);await Promise.all(Array.from({length:20},()=>gameQA.playNoctSound('hit')));});
  assert.ok(await page.evaluate(()=>gameQA.noctSounds.length<=8));
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.noctSounds.length),0);
  assert.equal(await page.evaluate(()=>gameQA.playNoctSound('charge')),false);
  await page.locator('#soundBtn').click();
  await page.evaluate(async()=>{await gameQA.playNoctSound('charge');gameQA.configure({stage:2,key:'fire'});});
  assert.equal(await page.evaluate(()=>gameQA.noctSounds.length),0);assert.deepEqual(errors,[]);
  fs.writeFileSync('qa/noct-swordsman-audio-results.json',JSON.stringify({passed:true,soundIds:[...ids],voices:result.voices,damage:result.damage,duration:result.duration,errors},null,2));
  console.log('PASS: nine offline effects, directional ultimate slashes, both voice cues, 150 damage / 3 seconds, bounded mix, mute and stage cleanup.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
