const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  await page.locator('[data-class="fire"]').click();assert.match(await page.locator('#heroSkillDescription').textContent(),/một nhát/);await page.locator('#startBtn').click();
  await page.evaluate(()=>{gameQA.configure({key:'fire',enemyKey:'earth',hp:170,enemyHp:10000,enemyMax:10000,enemyArmor:20,energy:0});gameQA.setReduced(false);});
  const casting=page.evaluate(async()=>{
   const start=performance.now(),hits=[],frames=new Set(),positions=[],flight=[];let last=gameQA.state.enemyHp;
   const sample=setInterval(()=>{const root=document.querySelector('#heroActor');positions.push(new DOMMatrix(getComputedStyle(root).transform).m41);const wave=document.querySelector('.mika-sword-wave');if(wave)flight.push({x:wave.getBoundingClientRect().x,hp:gameQA.state.enemyHp});if(gameQA.state.enemyHp!==last){hits.push({at:performance.now()-start,hp:gameQA.state.enemyHp});last=gameQA.state.enemyHp;}const el=document.querySelector('#heroActor .sprite-body');if(el.dataset.action==='smash')frames.add(+el.dataset.frame);},8);
   await gameQA.heroUltimate();clearInterval(sample);return {duration:performance.now()-start,hits,frames:[...frames],armor:gameQA.state.enemyArmor,hp:gameQA.state.enemyHp,travel:Math.max(...positions)-Math.min(...positions),flight};
  });
  await page.waitForTimeout(850);const early=await page.locator('.mika-blade-pivot').getAttribute('data-length');await page.screenshot({path:'qa/mika-cleave-raising.png'});
  await page.waitForFunction(()=>document.querySelector('.mika-blade-pivot')?.dataset.length==='1.95');await page.screenshot({path:'qa/mika-cleave-charged.png'});
  assert.ok(+early<1.95);assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),10000);
  await page.locator('.mika-sword-wave').waitFor({state:'attached'});await page.waitForTimeout(130);await page.screenshot({path:'qa/mika-cleave-wave.png'});assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),10000);
  await page.locator('.mika-impact-flare').waitFor({state:'attached'});await page.waitForFunction(()=>document.querySelector('.mika-impact-explosion')?.dataset.frame==='2');await page.screenshot({path:'qa/mika-cleave-impact.png'});await page.waitForFunction(()=>document.querySelector('.mika-impact-explosion')?.dataset.frame==='4');await page.screenshot({path:'qa/mika-cleave-afterglow.png'});
  const result=await casting;assert.ok(result.duration>=2950&&result.duration<3400,JSON.stringify(result));assert.equal(result.hits.length,1);assert.ok(result.hits[0].at>=2290&&result.hits[0].at<2550);assert.equal(result.hp,9885);assert.equal(result.armor,0);
  assert.ok(result.travel<.1,'Mika must remain planted');assert.ok(result.flight.length>3);assert.ok(result.flight.at(-1).x-result.flight[0].x>80);assert.ok(result.flight.every(s=>s.hp===10000),'Damage waits for projectile arrival');
  assert.deepEqual(result.frames,[0,1,2,3,4,5]);
  assert.equal(await page.locator('.mika-blade-pivot,.mika-impact,.mika-sword-wave').count(),0);assert.equal(await page.evaluate(()=>gameQA.effects),0);assert.equal(await page.locator('#heroActor .sprite-body').getAttribute('data-action'),'idle');
  const nofx=await page.evaluate(async()=>{gameQA.configure({key:'fire',enemyKey:'ice',enemyHp:1000,enemyMax:1000,enemyArmor:0});gameQA.setReduced(true);await gameQA.heroUltimate();return {hp:gameQA.state.enemyHp,effects:gameQA.effects,remnants:document.querySelectorAll('.mika-blade-pivot,.mika-impact,.mika-sword-wave').length};});
  assert.deepEqual(nofx,{hp:797,effects:0,remnants:0});
  // A lethal single strike still enters the normal victory flow.
  await page.evaluate(async()=>{gameQA.configure({key:'fire',enemyKey:'earth',enemyHp:1,enemyMax:350,enemyArmor:0});await gameQA.heroUltimate();await gameQA.finishBattle();});assert.equal(await page.locator('#resultDialog').evaluate(e=>e.open),true);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,result:{...result,flightSamples:result.flight.length,flight:undefined},nofx,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
