const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href;
  if(!process.env.GAME_TEST_URL)await page.context().setOffline(true);
  await page.goto(url+'?qa');
  assert.equal(await page.locator('#heroList').isVisible(),true);assert.equal(await page.locator('#startBtn').isVisible(),false);
  await page.screenshot({path:'qa/hero-details-list.png'});
  const heroes=[['fire','Mika',170,'135'],['earth','Nori',320,'×3'],['ice','Yuki',200,'60'],['lightning','Lumi',200,'140'],['shadow','Noct',190,'150']];
  for(const [key,name,hp,skill] of heroes){
   await page.locator(`[data-class="${key}"]`).click();
   assert.equal(await page.locator('#heroList').isVisible(),false);assert.equal(await page.locator('#selectTitle').textContent(),name);
   assert.match(await page.locator('#heroDetailStats').textContent(),new RegExp(hp+' HP'));
   assert.ok((await page.locator('#heroSkillDescription').textContent()).includes(skill));
   assert.equal(await page.locator('#heroShowcase .sprite-body').getAttribute('data-key'),key);
   assert.equal(await page.locator('#heroCarryover').isVisible(),false);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'selectTitle');
   assert.equal(await page.locator('#heroSelectionScroll').evaluate(e=>e.scrollTop),0);
   await page.waitForTimeout(160);await page.screenshot({path:`qa/hero-details-${key}.png`});
   // The back action restores focus to the hero that opened the details.
   if(key==='shadow')await page.keyboard.press('Escape');else await page.locator('#heroBackBtn').click();
   assert.equal(await page.locator('#heroList').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.class),key);
  }
  checks.push('All five gem avatars open full-body animated details with correct HP and skills; back/Escape restore list and focus');
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:width===320?568:844});await page.locator('[data-class="earth"]').click();
   const layout=await page.locator('#selectDialog').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth,screen:document.body.scrollWidth>innerWidth}));
   assert.deepEqual(layout,{overflow:false,screen:false});
   const corners=()=>page.locator('#selectDialog .antique-corner').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));const before=await corners();
   await page.locator('#heroStatNote').scrollIntoViewIfNeeded();assert.deepEqual(await corners(),before,'All four carvings stay on the modal frame while details scroll');assert.ok(await page.locator('#heroSelectionScroll').evaluate(e=>e.scrollTop>0));assert.equal(await page.locator('#selectDialog').evaluate(e=>e.scrollTop),0);await page.screenshot({path:`qa/hero-details-${width}-scrolled.png`});
   await page.locator('#heroBackBtn').click();
  }
  checks.push('Readable scrolling and reachable back/start actions at 320, 390 and 768px without horizontal overflow; all four ornamental corners remain fixed during scrolling');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-class="earth"]').focus();await page.keyboard.press('Enter');
  await page.locator('#startBtn').click();assert.equal(await page.locator('#selectDialog').evaluate(e=>e.open),false);
  assert.equal(await page.evaluate(()=>gameQA.state.key),'earth');assert.equal(await page.evaluate(()=>gameQA.state.hp),320);assert.equal(await page.locator('.tile').count(),64);
  await page.evaluate(async()=>{gameQA.setReduced(true);gameQA.configure({key:'earth',hp:240,armor:27,energy:42,enemyHp:0});await gameQA.finishBattle();});
  await page.locator('#nextBtn').click();await page.locator('#heroList').waitFor({state:'visible'});
  await page.locator('[data-class="fire"]').click();assert.match(await page.locator('#heroCarryover').textContent(),/170\/170 HP · 27 giáp · 42\/100 nộ/);
  await page.locator('#heroBackBtn').click();await page.locator('[data-class="earth"]').click();assert.match(await page.locator('#heroCarryover').textContent(),/240\/320 HP/);
  assert.equal(await page.evaluate(()=>gameQA.state.hp),240);await page.locator('#startBtn').click();
  assert.deepEqual(await page.evaluate(()=>[gameQA.state.key,gameQA.state.hp,gameQA.state.armor,gameQA.state.energy]),['earth',240,27,42]);
  checks.push('Explicit deployment starts chosen hero; next-stage preview preserves HP/armor/rage and hero browsing never mutates combat state');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
