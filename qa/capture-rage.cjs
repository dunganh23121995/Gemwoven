// Visual regression: descending spells remain bright through contact.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(require('node:url').pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  for(const key of ['ice','lightning']){
   await page.evaluate(key=>{gameQA.configure({key,enemyKey:'earth',stage:5,hp:150,enemyHp:1000,enemyMax:1000,enemyArmor:0,energy:0});gameQA.setReduced(false);window.rage=gameQA.heroUltimate();},key);
   const sample=await page.evaluate(()=>new Promise(resolve=>{
    const until=performance.now()+3000;
    function tick(){const n=document.querySelector('.rage-skyfall'),time=n?.getAnimations()[0]?.currentTime;
     if(time>=390)return resolve({time,opacity:Number(getComputedStyle(n).opacity)});
     if(performance.now()>until)return resolve({time:-1,opacity:0});requestAnimationFrame(tick);
    }tick();
   }));
   assert.ok(sample.opacity>.95,JSON.stringify(sample));
   await page.screenshot({path:`qa/cinematic-rage-${key}.png`});await page.evaluate(()=>rage);
   assert.equal(await page.evaluate(()=>gameQA.effects),0);
  }
  console.log('PASS: ice/lightning skyfall stays bright at contact, then cleans up.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
