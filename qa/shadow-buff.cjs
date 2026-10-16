const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  await page.locator('[data-class="shadow"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{gameQA.configure({key:'shadow',hp:100,armor:0});gameQA.setReduced(false);});
  const results=[];
  for(const kind of ['heal','armor']){
   const job=page.evaluate(async kind=>{
    const el=document.querySelector('#heroActor .sprite-body'),seen=[],positions=[],frames=new Set();
    const observer=new MutationObserver(records=>{for(const r of records)if(r.attributeName==='data-frame'&&r.oldValue!==null)frames.add(Number(r.oldValue));});
    observer.observe(el,{attributes:true,attributeOldValue:true,attributeFilter:['data-frame']});
    const timer=setInterval(()=>{seen.push([el.dataset.action,el.dataset.sheet,Number(el.dataset.frame)]);positions.push(new DOMMatrix(getComputedStyle(el.parentElement).transform).m42);},10);
    const gained=await gameQA.buff('hero',kind,12);clearInterval(timer);await Promise.resolve();observer.disconnect();
    return {kind,gained,seen,frames:[...frames],positions,action:el.dataset.action,hp:gameQA.state.hp,armor:gameQA.state.armor,effects:gameQA.effects};
   },kind);
   await page.waitForTimeout(480);
   await page.screenshot({path:`qa/noct-hand-seal-${kind}.png`,fullPage:true});
   const result=await job;results.push(result);
   assert.equal(result.gained,12);assert.equal(result.action,'idle');assert.equal(result.effects,0);
   assert.ok([0,1,2,3,4,5].every(f=>result.frames.includes(f)));
   assert.ok(result.seen.some(p=>p[0]==='buff'&&p[1]==='buff'));
   assert.ok(result.positions.every(y=>Math.abs(y)<.1));
  }
  assert.equal(results[0].hp,112);assert.equal(results[1].armor,12);
  await page.evaluate(async()=>{gameQA.setReduced(true);await gameQA.buff('hero','armor',12);});
  assert.equal(await page.evaluate(()=>gameQA.state.armor),24);
  await page.evaluate(async()=>{gameQA.configure({key:'fire',hp:100});await gameQA.buff('hero','heal',12);});
  assert.equal(await page.evaluate(()=>gameQA.state.hp),112);assert.deepEqual(errors,[]);
  fs.writeFileSync('qa/shadow-buff-results.json',JSON.stringify({passed:true,checks:['Six authored hand-seal frames for healing and armor','Feet remain planted; returns to idle and cleans up effects','Correct resource gains in FX and NO FX modes','Original hero cast fallback still works'],results,errors},null,2));
  console.log('PASS: hand-seal frames, planted feet, resources, NO FX, original hero fallback; no JavaScript errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
