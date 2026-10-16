const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:!process.env.GAME_TEST_URL});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{
   window.fixture=(options={})=>{gameQA.configure({key:'ice',enemyKey:'fire',stage:5,boss:true,hp:100,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,stunned:false,...options});gameQA.setReduced(false);};
   fixture();window.audioCues={};window.skill=(async()=>{
    const start=performance.now(),timer=setInterval(()=>{
     for(const id of gameQA.castSounds)if(!audioCues[id])audioCues[id]={at:performance.now()-start,phase:document.querySelector('#heroActor').dataset.ragePhase,hp:gameQA.state.enemyHp};
    },10);
    try{await gameQA.heroUltimate();return performance.now()-start;}finally{clearInterval(timer);}
   })();
  });
  await page.locator('.yuki-glacier[data-phase="summoning"]').waitFor({state:'attached'});
  const earlyTop=await page.locator('.yuki-glacier').evaluate(n=>n.getBoundingClientRect().top);
  await page.waitForTimeout(900);assert.equal(await page.locator('.yuki-staff-light').count(),1);
  const peek=await page.locator('.yuki-glacier').evaluate(n=>{const b=n.getBoundingClientRect(),s=document.querySelector('#scene').getBoundingClientRect();return {top:b.top,bottom:b.bottom,edge:s.top,height:b.height};});
  assert.ok(peek.top>earlyTop&&peek.top<peek.edge&&peek.bottom>peek.edge&&peek.bottom-peek.edge<peek.height*.4,'Ice gradually peeks over the top during chanting');
  assert.deepEqual(await page.evaluate(()=>({armor:gameQA.state.armor,hp:gameQA.state.hp,enemyHp:gameQA.state.enemyHp,stunned:gameQA.state.stunned})),{armor:25,hp:100,enemyHp:10000,stunned:false});
  await page.screenshot({path:'qa/yuki-glacier-chant.png'});
  await page.waitForFunction(()=>document.querySelector('.yuki-glacier')?.dataset.phase==='falling');
  assert.ok(await page.locator('.app').evaluate(n=>n.getAnimations().some(a=>a.effect.getKeyframes().some(f=>f.translate==='2.8px -1.8px'))),'Descent shakes the entire game');
  const initial=await page.locator('.yuki-glacier').evaluate(n=>n.getBoundingClientRect().y);
  await page.waitForTimeout(150);assert.ok(await page.locator('.yuki-glacier').evaluate(n=>n.getBoundingClientRect().y)>initial);
  assert.equal(await page.evaluate(()=>gameQA.state.enemyHp),10000);await page.screenshot({path:'qa/yuki-glacier-fall.png'});
  await page.waitForFunction(()=>gameQA.state.enemyHp===9940);
  assert.ok(await page.locator('.app').evaluate(n=>n.getAnimations().some(a=>a.effect.getTiming().duration===850&&a.effect.getKeyframes().some(f=>f.translate==='0px 16px'))),'Impact triggers a heavy vertical jolt and 850ms aftershock');
  await page.waitForTimeout(65);
  assert.notEqual(await page.locator('.app').evaluate(n=>getComputedStyle(n).translate),'none');
  await page.screenshot({path:'qa/yuki-glacier-impact.png'});
  assert.equal(await page.evaluate(()=>gameQA.state.stunned),true);assert.ok(await page.locator('.yuki-ice-fragment').count()>0);
  const duration=await page.evaluate(()=>skill);assert.ok(duration>=2950&&duration<3400,`Yuki duration: ${duration}ms`);
  assert.equal(await page.locator('.yuki-glacier,.yuki-staff-light,.yuki-ice-fragment,.yuki-frost-mist').count(),0);assert.equal(await page.evaluate(()=>gameQA.effects),0);
  assert.equal(await page.locator('.app').evaluate(n=>getComputedStyle(n).translate),'none');
  checks.push('Whole-screen descent tremor, heavy impact and fading aftershock restore the original screen position');
  checks.push('25 armor before chanting; ice slowly peeks above the arena during charge, then drops rapidly before one 60-damage hit and stun; 3-second cleanup');
  const cues=await page.evaluate(()=>audioCues);
  assert.deepEqual(Object.keys(cues).filter(id=>id.startsWith('ice-')).sort(),['ice-glacier-charge','ice-glacier-fall','ice-glacier-impact']);
  assert.equal(cues['ice-glacier-charge'].phase,'chant');
  assert.equal(cues['ice-glacier-fall'].phase,'skyfall');assert.equal(cues['ice-glacier-fall'].hp,10000);
  assert.ok(cues['ice-glacier-impact'].at>=2050&&cues['ice-glacier-impact'].at<2450);assert.equal(cues['ice-glacier-impact'].hp,9940);
  assert.ok((await page.evaluate(()=>gameQA.castSounds)).includes('ice-glacier-impact'),'Ice debris continues after the animation');
  await page.waitForTimeout(3800);
  assert.equal((await page.evaluate(()=>gameQA.castSounds)).filter(id=>id.startsWith('ice-glacier-')).length,0);
  checks.push('Separate chant, descent and impact sounds follow the skill phases; impact decay survives animation cleanup and finishes naturally');
  await page.evaluate(()=>gameQA.enemyAction());assert.equal(await page.evaluate(()=>gameQA.state.stunned),false);assert.equal(await page.evaluate(()=>gameQA.state.hp),100);
  checks.push('Stun skips the next enemy turn once without healing Yuki');
  const cases=[];
  for(const options of [{enemyKey:'earth'},{enemyArmor:80},{armor:990},{enemyHp:1}])cases.push(await page.evaluate(async options=>{fixture(options);gameQA.setReduced(true);const start=performance.now();await gameQA.heroUltimate();return {time:performance.now()-start,hp:gameQA.state.hp,armor:gameQA.state.armor,enemyHp:gameQA.state.enemyHp,enemyArmor:gameQA.state.enemyArmor,stunned:gameQA.state.stunned,nodes:document.querySelectorAll('.yuki-glacier,.yuki-staff-light').length};},options));
  assert.equal(cases[0].enemyHp,9910);assert.equal(cases[1].enemyHp,10000);assert.equal(cases[1].enemyArmor,20);assert.equal(cases[1].stunned,true);assert.equal(cases[2].armor,999);assert.equal(cases[3].enemyHp,0);assert.equal(cases[3].stunned,false);
  assert.ok(cases.every(c=>c.time<500&&c.hp===100&&c.nodes===0));
  const auto=await page.evaluate(async()=>{fixture({energy:100});gameQA.setReduced(true);await gameQA.activateSkill();return {energy:gameQA.state.energy,enemyHp:gameQA.state.enemyHp,armor:gameQA.state.armor,hp:gameQA.state.hp,stunned:gameQA.state.stunned};});
  assert.deepEqual(auto,{energy:0,enemyHp:9940,armor:25,hp:100,stunned:false});
  checks.push('Elemental multiplier, absorption, armor cap, lethal damage and NO FX parity; full rage spends 100 and resolves a complete turn');
  await page.evaluate(()=>{gameQA.stopCastSounds();fixture();gameQA.setReduced(true);});
  await page.evaluate(()=>gameQA.heroUltimate());await page.waitForTimeout(60);
  assert.deepEqual((await page.evaluate(()=>gameQA.castSounds)).filter(id=>id.startsWith('ice-glacier-')),['ice-glacier-impact']);
  await page.locator('#soundBtn').click();await page.evaluate(()=>gameQA.heroUltimate());
  assert.deepEqual(await page.evaluate(()=>gameQA.castSounds),[]);
  checks.push('NO FX plays only impact; mute stops the full sound kit');
  assert.deepEqual(errors,[]);const report={passed:true,duration,checks,errors};fs.writeFileSync('qa/yuki-glacier-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
