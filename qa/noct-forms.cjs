// Noct star forms in combat: form 2 moon-blade swordsman, form 3 Grim Reaper.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.resolve('qa/gemwoven/runtime/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  await page.locator('[data-class="shadow"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  fs.mkdirSync('qa/out',{recursive:true});
  for(const form of [2,3]){
   const fixture=()=>page.evaluate(form=>{gameQA.configure({key:'shadow',enemyKey:'fire',form,stage:5,hp:10000,enemyHp:10000,enemyMax:10000,armor:0,enemyArmor:0,energy:0,enemyEnergy:0});gameQA.setReduced(false);},form);
   await fixture();
   const idle=await page.evaluate(()=>{const r=document.querySelector('#heroActor');return {form:r.dataset.heroForm,aura:!!r.querySelector('.combat-form-aura .form-aura-band'),bg:getComputedStyle(r.querySelector('.sprite-body')).backgroundImage.slice(0,30)};});
   assert.equal(idle.form,String(form));assert.equal(idle.aura,form===3,'cloud aura only on the six-star form');
   await page.waitForTimeout(400);await page.screenshot({path:`qa/out/noct-form${form}-idle.png`});
   const ult=page.evaluate(async()=>{
    const root=document.querySelector('#heroActor'),start=performance.now(),actions=new Set(),cuts=[];
    const observer=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.classList?.contains('reaper-cut')||n.classList?.contains('quick-blade-cut'))cuts.push([...n.classList].find(c=>c==='reaper-cut'||c==='quick-blade-cut')+(n.classList.contains('reaper-finale')?':finale':''));});
    observer.observe(document.querySelector('#combatEffects'),{childList:true});
    const timer=setInterval(()=>{const s=root.querySelector('.sprite-body');actions.add(s.dataset.action+':'+s.dataset.frame);},12);
    await gameQA.heroUltimate();clearInterval(timer);observer.disconnect();
    return {ms:performance.now()-start,damage:10000-gameQA.state.enemyHp,actions:[...actions],cuts,souls:document.querySelectorAll('.reaper-soul').length};
   });
   await page.waitForTimeout(2300);await page.screenshot({path:`qa/out/noct-form${form}-ultimate.png`});
   const r=await ult;
   assert.ok(r.ms>=2900&&r.ms<4800,`form ${form} ultimate ${r.ms}`);
   assert.equal(r.souls,0,'effects cleaned up');
   if(form===3){
    assert.ok(r.actions.some(a=>a.startsWith('run:')),'reaper glides on the run sheet');
    assert.equal(r.cuts.filter(c=>c==='reaper-cut').length,5);assert.ok(r.cuts.includes('reaper-cut:finale'));
    assert.ok(!r.cuts.includes('quick-blade-cut'));
   }else{
    assert.ok(r.actions.every(a=>!a.startsWith('run:')));assert.equal(r.cuts.filter(c=>c==='quick-blade-cut').length,5);
   }
   await fixture();
   const normal=await page.evaluate(async()=>{const root=document.querySelector('#heroActor'),seen=new Set(),start=performance.now();const t=setInterval(()=>seen.add(root.querySelector('.sprite-body').dataset.action),10);await gameQA.attack('hero',100,{attackChain:1});clearInterval(t);return {ms:performance.now()-start,damage:10000-gameQA.state.enemyHp,seen:[...seen]};});
   assert.ok(normal.ms<1200);assert.ok(normal.damage>0);assert.equal(normal.seen.includes('run'),form===3);
   checks.push(`form ${form}: ultimate ${Math.round(r.ms)}ms, ${r.damage} damage, cuts ${r.cuts.join(',')}; attack ${normal.damage} damage`);
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
