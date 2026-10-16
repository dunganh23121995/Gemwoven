const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[],timings=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  assert.equal(await page.locator('.class-card').count(),5);await page.locator('[data-class="shadow"]').click();
  await page.screenshot({path:'qa/noct-selection.png',fullPage:true});if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  assert.equal(await page.evaluate(()=>gameQA.state.key),'shadow');assert.equal(await page.evaluate(()=>gameQA.state.hp),190);
  await page.screenshot({path:'qa/noct-idle.png',fullPage:true});
  checks.push('Fifth hero Noct is selectable offline; 190 HP, dedicated hooded sprite and shadow aura');
  await page.evaluate(()=>window.fixture=(key='shadow',enemyKey='fire')=>{gameQA.configure({key,enemyKey,stage:5,hp:10000,enemyHp:10000,enemyMax:10000,armor:0,enemyArmor:0,energy:0,enemyEnergy:0});gameQA.setReduced(false);});
  for(const key of ['shadow','fire']){
   const resultPromise=page.evaluate(async key=>{
    fixture(key);const root=document.querySelector('#heroActor'),start=performance.now(),samples=[],cuts=[],contacts=[];
    const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.dataset?.cutDirection){cuts.push(node.dataset.cutDirection);contacts.push(new DOMMatrix(getComputedStyle(root).transform).m41);}});observer.observe(document.querySelector('#combatEffects'),{childList:true});
    const timer=setInterval(()=>samples.push({t:performance.now()-start,x:new DOMMatrix(getComputedStyle(root).transform).m41,phase:root.dataset.ragePhase,hit:root.dataset.rageHit,hp:gameQA.state.enemyHp,action:root.querySelector('.sprite-body').dataset.action,frame:root.querySelector('.sprite-body').dataset.frame,echoes:document.querySelectorAll('.shadow-afterimage').length}),16);
    await gameQA.heroUltimate();clearInterval(timer);observer.disconnect();return {ms:performance.now()-start,samples,cuts,contacts,damage:10000-gameQA.state.enemyHp,effects:gameQA.effects,transform:root.style.transform};
   },key);
   await page.waitForTimeout(1850);await page.screenshot({path:`qa/${key}-rage.png`,fullPage:true});
   const result=await resultPromise;fs.writeFileSync(`qa/${key}-rage-samples.json`,JSON.stringify(result,null,2));assert.ok(result.ms>=2950&&result.ms<3350,`${key}: ${result.ms}`);
   assert.equal(result.damage,key==='shadow'?150:135);assert.equal(result.effects,0);assert.equal(result.transform,'');
   assert.deepEqual(result.cuts,key==='shadow'?['right','left','right','left','right']:['right','left','right','left','right','left']);
   assert.equal(new Set(result.samples.map(s=>s.hp)).size,key==='shadow'?6:7);assert.ok(result.samples.filter(s=>s.t<1500).every(s=>s.hp===10000));
   if(key==='shadow'){
    assert.ok(result.samples.some(s=>s.phase==='slow-glide'));assert.ok(result.samples.some(s=>s.echoes>=8));assert.ok(result.samples.every(s=>s.action!=='run'));
    const contacts=result.contacts;
    assert.ok(contacts[0]>contacts[1]+30&&contacts[2]>contacts[3]+30&&contacts[4]>contacts[3]+30);
    assert.ok(result.samples.filter(s=>s.t>2890).every(s=>Math.abs(s.x)<1));
   }
   timings.push({key,ms:Math.round(result.ms),damage:result.damage,cuts:result.cuts});
  }
  checks.push('Noct: slow glide then exactly five alternating dash hits with afterimages; Mika: six quick alternating cuts; both return home in 3 seconds');
  const normal=await page.evaluate(async()=>{
   fixture();const root=document.querySelector('#heroActor'),poses=[],start=performance.now();const timer=setInterval(()=>poses.push(root.querySelector('.sprite-body').dataset.action),10);
   await gameQA.attack('hero',100,{attackChain:3});clearInterval(timer);return {ms:performance.now()-start,damage:10000-gameQA.state.enemyHp,poses,effects:gameQA.effects};
  });
  assert.equal(normal.damage,195);assert.ok(normal.ms<1200);assert.ok(normal.poses.every(p=>p!=='run'));assert.equal(normal.effects,0);
  const reduced=await page.evaluate(async()=>{fixture();gameQA.setReduced(true);const start=performance.now();await gameQA.heroUltimate();return {ms:performance.now()-start,damage:10000-gameQA.state.enemyHp,effects:gameQA.effects};});
  assert.equal(reduced.damage,150);assert.ok(reduced.ms<500);assert.equal(reduced.effects,0);
  checks.push('Normal Noct attack dashes out/back quickly; chain crit damage preserved; NO FX retains exact ultimate damage');
  for(const key of ['ice','lightning']){
   await page.evaluate(key=>{fixture(key);window.skill=gameQA.heroUltimate();},key);
   await page.locator('.rage-skyfall').waitFor({state:'attached'});const top=Number(await page.locator('.rage-skyfall').getAttribute('data-sky-origin'));assert.ok(top<=-180);
   await page.waitForTimeout(300);await page.screenshot({path:`qa/skyfall-${key}.png`,fullPage:true});await page.evaluate(()=>skill);
  }
  checks.push('Ice and lightning rage originate above the combat viewport and descend to the enemy');
  await page.evaluate(()=>{fixture('shadow','fire');window.breath=gameQA.enemySkill();});
  await page.locator('.dragon-flame-plume').first().waitFor({state:'attached'});
  assert.ok(await page.locator('.dragon-flame-plume').count()>=24);
  const flame=await page.locator('.dragon-flame-plume').first().evaluate(n=>({background:getComputedStyle(n).backgroundImage,transform:getComputedStyle(n).transform,animations:n.getAnimations().length}));
  assert.ok(flame.background.includes('radial-gradient'));assert.equal(flame.animations,1);
  await page.waitForTimeout(160);await page.screenshot({path:'qa/dragon-soft-breath.png',fullPage:true});await page.evaluate(()=>breath);
  assert.equal(await page.locator('.dragon-flame-plume,.dragon-flame-ember').count(),0);
  checks.push('Dragon breath uses layered animated soft plumes and drifting embers; cleans up after skill');
  await page.evaluate(()=>{fixture();window.depart=gameQA.departVictoriousHero();});await page.waitForTimeout(1100);
  assert.equal(await page.locator('#heroActor .sprite-body').getAttribute('data-action'),'hover');
  assert.ok(Number(await page.locator('#scene').getAttribute('data-camera-x'))>0);
  await page.screenshot({path:'qa/noct-departure.png',fullPage:true});await page.evaluate(()=>depart);
  assert.equal(await page.locator('.shadow-afterimage').count(),0);checks.push('Noct glides through stage departure with no running frames; camera parallax remains intact');
  await page.evaluate(()=>{fixture();gameQA.setReduced(true);});
  const move=await page.evaluate(()=>{const m=gameQA.legalMoves()[0];return {a:{r:m.a.r,c:m.a.c},b:{r:m.b.r,c:m.b.c}};});
  await page.evaluate(async({a,b})=>gameQA.trySwap(gameQA.board[a.r][a.c],gameQA.board[b.r][b.c]),move);
  assert.equal(await page.evaluate(()=>gameQA.locked),false);assert.equal(await page.locator('.tile').count(),64);
  await page.evaluate(async()=>{gameQA.stopCombatVoices();await gameQA.combatVoice('hero','attack');});assert.ok((await page.locator('#heroActor').getAttribute('data-voice-clip')).startsWith('noct-'));
  checks.push('New hero resolves a complete board turn and uses the male voice bank');
  assert.deepEqual(errors,[]);const result={passed:checks.length,checks,timings,errors};fs.writeFileSync('qa/shadow-combat-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
