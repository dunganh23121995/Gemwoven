const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const{pathToFileURL}=require('node:url');
const{chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({offline:true}),errors=[],layouts=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[320,640],[390,844],[768,900]]){
   await page.setViewportSize({width,height});await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
   assert.equal(await page.locator('.avatar-gem').count(),5);
   assert.equal(await page.locator('.class-trait,.class-hp,.class-subtitle').count(),0);
   for(const key of ['fire','earth','ice','lightning','shadow']){
    const button=page.locator(`[data-class="${key}"]`);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.class-card[aria-pressed="true"]').count(),1);
   }
   const layout=await page.locator('#selectDialog').evaluate(n=>({height:n.clientHeight,scrollHeight:n.scrollHeight,width:n.clientWidth,scrollWidth:n.scrollWidth}));
   assert.ok(layout.scrollWidth<=layout.width+1);assert.ok(layout.scrollHeight<=layout.height+1);layouts.push({viewport:width,...layout});
   await page.screenshot({path:`qa/gem-selection-${width}.png`,fullPage:true});
  }
  await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>gameQA.state.key),'shadow');
  const voices=[];
  for(const kind of ['attack','attack','attack','hurt','hurt','hurt','cast','release']){
   const id=await page.evaluate(async kind=>{gameQA.stopCombatVoices();await gameQA.combatVoice('hero',kind);return document.querySelector('#heroActor').dataset.voiceClip;},kind);
   assert.ok(id?.startsWith('noct-'));voices.push(id);
  }
  assert.equal(new Set(voices).size,8);
  const manifest=JSON.parse(fs.readFileSync('assets/audio/noct-manifest.json','utf8'));
  assert.ok(Object.values(manifest).every(m=>m.peak<=.80&&m.rms>=.10&&m.duration>0&&m.duration<2));
  await page.evaluate(()=>{gameQA.stopCombatVoices();gameQA.setReduced(true);});
  assert.deepEqual(errors,[]);
  fs.writeFileSync('qa/gem-selection-results.json',JSON.stringify({passed:true,layouts,voices,errors},null,2));
  console.log('PASS: five selectable avatar jewels, mobile layouts without scrolling, keyboard start, eight offline Noct voice variants.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
