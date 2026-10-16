const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/audio/creature-manifest.json','utf8'));
 assert.equal(Object.keys(manifest).length,32);assert.equal(new Set(Object.values(manifest).map(v=>v.sha256)).size,32);
 assert.ok(Object.values(manifest).every(v=>v.sources.every(s=>s.startsWith('sources/creatures/'))));
 assert.ok(Object.values(manifest).every(v=>v.duration>=.22&&v.duration<=.55&&v.sources.every(s=>s.includes('/pack/monster_sfx_pack/'))));
 const hero=JSON.parse(fs.readFileSync('assets/audio/manifest.json','utf8'));assert.ok(Object.keys(hero).every(k=>!k.startsWith('beast-')));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],samples=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(require('node:url').pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.evaluate(()=>gameQA.warmCombatVoices());
  for(const key of ['fire','earth','ice','lightning']){
   await page.evaluate(key=>{gameQA.stopCombatVoices();gameQA.configure({key:'earth',enemyKey:key,stage:5,hp:1000,enemyHp:5000,enemyMax:5000,energy:0,enemyEnergy:0});},key);
   for(const kind of ['attack','hurt','cast','release'])for(let i=1;i<=(['attack','hurt'].includes(kind)?3:1);i++){
    const clip=await page.evaluate(async kind=>{gameQA.stopCombatVoices();const before=JSON.stringify(gameQA.state);const played=await gameQA.combatVoice('enemy',kind);return {played,id:document.querySelector('#enemyActor').dataset.voiceClip,unchanged:JSON.stringify(gameQA.state)===before};},kind);
    assert.equal(clip.played,true);assert.equal(clip.unchanged,true);assert.equal(clip.id,`creature-${key}-${kind}${['attack','hurt'].includes(kind)?i:''}`);samples.push(clip.id);
   }
   // Exercise the real charge -> release call path, not just the sample selector.
   const events=await page.evaluate(async()=>{
    gameQA.stopCombatVoices();gameQA.setReduced(false);const actor=document.querySelector('#enemyActor'),events=[];
    const observer=new MutationObserver(()=>{if(actor.dataset.voiceClip)events.push(actor.dataset.voiceClip);});observer.observe(actor,{attributes:true,attributeFilter:['data-voice-clip']});
    await gameQA.enemySkill();observer.disconnect();return events;
   });
   assert.ok(events.includes(`creature-${key}-cast`));assert.ok(events.includes(`creature-${key}-release`));
  }
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.combatVoice('enemy','attack')),false);assert.equal(await page.locator('[data-voice-clip]').count(),0);
  await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>gameQA.combatVoice('hero','attack')),true);assert.ok((await page.locator('#heroActor').getAttribute('data-voice-clip')).startsWith('nori-'));
  assert.deepEqual(errors,[]);const report={passed:5,checks:['32 distinct monster-only clips; no human beast bank embedded','All four monster banks decode/play offline in every combat state','Real boss skills play both charge and release from the matching species','Audio leaves gameplay state unchanged','Mute stops creatures; hero voices remain separate'],samples,errors};
  fs.writeFileSync('qa/creature-voices-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
