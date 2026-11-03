// Hiro's star-form ultimates (src/forms-hiro.js): the same damage as the plain ultimate, their own FX, poses and
// recorded sounds, a heavy finishing shake, clean-up; basic attacks keep their numbers and draw the form's arc.
// Frames for review: qa/out/hiro/<form>-<foe>-NN.png (every 120 ms).  node qa/hiro-forms.cjs [--frames]
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.resolve('qa/gemwoven/runtime/node_modules/playwright'));
const frames=process.argv.includes('--frames');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:!process.env.GAME_TEST_URL});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  // Foes staged as the hero studio stages them: a campaign creature (slime, an elite) wears the 'fire' slot's art.
  await page.evaluate(()=>{
   const art=gameQA.art,mob=art.enemies.fire;
   window.fixture=(form,{creature='slime',elite=false,...options}={})=>{
    art.enemies.fire=creature?gameQA.creatureSheets(art.campaignCreatures[creature]):mob;
    gameQA.configure({key:'novice',form,enemyKey:'fire',stage:creature?4:5,boss:false,qaElite:elite,qaBossArt:'',qaFoeFx:null,hp:1000,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,stunned:false,...options});
   };
  });
  // 1. Damage parity with the plain ultimate (attack('hero',kit.base,{hits})), staged and reduced, on several foes.
  const cases=[{},{enemyArmor:30},{creature:null,enemyKey:'earth',boss:true},{creature:'forest-stagchief',elite:true},{enemyHp:20}];
  for(const form of [2,3])for(const options of cases){
   const run=async(plain,reduced)=>page.evaluate(async([form,options,plain,reduced])=>{
    window.hiroQAPlain=plain;fixture(form,options);gameQA.setReduced(reduced);
    try{await gameQA.heroUltimate();}finally{window.hiroQAPlain=false;}
    return {enemyHp:gameQA.state.enemyHp,enemyArmor:gameQA.state.enemyArmor,hp:gameQA.state.hp};
   },[form,options,plain,reduced]);
   const plain=await run(true,true),staged=await run(false,true),full=await run(false,false);
   assert.deepEqual(staged,plain,`form ${form} ${JSON.stringify(options)} reduced`);assert.deepEqual(full,plain,`form ${form} ${JSON.stringify(options)} staged`);
   checks.push(`form ${form} ${JSON.stringify(options)}: enemy HP ${10000-plain.enemyHp>=0?plain.enemyHp:''} as the plain ultimate`);
  }
  // 2. The staging: its FX strips, skill poses, sounds by phase, the shake on the hit, clean-up.
  const expect={2:{fx:['f2-gale','f2-slash','f2-cross'],sounds:['novice-f2-gust','novice-charge-cry','novice-dash-steps','novice-dash-rush','novice-f2-swing','novice-f2-swing-up','novice-f2-hit'],hit:'novice-f2-hit',phase:'burst'},
   3:{fx:['f3-gems','f3-crest','f3-crescent'],sounds:['novice-f3-gather','novice-charge-cry','novice-dash-steps','novice-f3-crest','novice-f3-swing','novice-f3-shatter'],hit:'novice-f3-shatter',phase:'shatter'}};
  if(frames)fs.mkdirSync('qa/out/hiro',{recursive:true});
  for(const form of [2,3])for(const [foe,options] of [['slime',{}],['elite',{creature:'forest-stagchief',elite:true}],['boss',{creature:null,enemyKey:'fire',boss:true}]]){
   await page.evaluate(([form,options])=>{
    fixture(form,options);gameQA.setReduced(false);gameQA.setSound?.(true);
    window.seen={fx:new Set(),sounds:{},frames:new Set(),shake:false};const start=performance.now();window.hiroSoundLog=[];
    const obs=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.classList?.contains('hiro-fx'))seen.fx.add([...n.classList].find(c=>c.startsWith('hiro-fx-')).slice(8));});
    obs.observe(document.querySelector('#scene'),{childList:true,subtree:true});
    const timer=setInterval(()=>{
     for(const [name,at,phase] of hiroSoundLog)if(!seen.sounds['novice-'+name])seen.sounds['novice-'+name]={at:Math.round(at-start),phase,hp:gameQA.state.enemyHp};
     if(document.querySelector('#scene').getAnimations().some(a=>a.effect.getKeyframes().some(f=>/^-?\d+(\.\d+)?px -?\d/.test(f.translate||''))))seen.shake=true;
    },10);
    window.ult=(async()=>{try{await gameQA.heroUltimate();return performance.now()-start;}finally{clearInterval(timer);obs.disconnect();}})();
   },[form,options]);
   if(frames)for(let i=0;i<26;i++){await page.screenshot({path:`qa/out/hiro/${form}-${foe}-${String(i).padStart(2,'0')}.png`,clip:{x:0,y:40,width:390,height:330}});await page.waitForTimeout(95);}
   const ms=await page.evaluate(()=>ult);
   const r=await page.evaluate(()=>({fx:[...seen.fx],sounds:seen.sounds,frames:[...seen.frames],shake:seen.shake,left:document.querySelectorAll('.hiro-fx,.hiro-echo,.hiro-flash,.hiro-jeweled,.hiro-jewel-blade').length,acting:document.querySelector('#heroActor').classList.contains('combat-v3-acting')}));
   const e=expect[form];
   for(const name of e.fx)assert.ok(r.fx.includes(name),`form ${form} ${foe}: ${name} shown (${r.fx})`);
   for(const id of e.sounds)assert.ok(r.sounds[id],`form ${form} ${foe}: ${id} played (${Object.keys(r.sounds)})`);
   assert.equal(r.sounds[e.hit].phase,e.phase,`form ${form}: the hit sound plays on the hit`);
   assert.ok(r.shake,`form ${form} ${foe}: the stage shakes on the hit`);
   assert.equal(r.left,0,'cleaned up');assert.equal(r.acting,false);assert.ok(ms>2400&&ms<3600,`form ${form} ${foe} ${Math.round(ms)}ms`);
   checks.push(`form ${form} vs ${foe}: ${Math.round(ms)} ms, fx ${r.fx.join(' ')}, hit sound at ${r.sounds[e.hit].at} ms`);
  }
  // 3. Basic attacks: the shared numbers, the form's own arc.
  for(const form of [1,2,3]){
   const r=await page.evaluate(async form=>{
    fixture(form);gameQA.setReduced(false);const seen=new Set();
    const obs=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes){if(n.classList?.contains('hiro-basic'))seen.add('own');if(n.classList?.contains('combat-v3-slash'))seen.add('shared');if(n.classList?.contains('cast-fx'))seen.add('cast');}});
    obs.observe(document.querySelector('#combatEffects'),{childList:true});
    await gameQA.heroStrike(40);obs.disconnect();return {seen:[...seen],hp:gameQA.state.enemyHp};
   },form);
   if(form===1)assert.ok(!r.seen.includes('own'),'form 1 keeps its attack');else assert.deepEqual(r.seen.filter(s=>s!=='cast'),['own'],`form ${form} draws its own arc`);
   checks.push(`basic attack form ${form}: ${r.seen.join(',')} -${10000-r.hp}`);
  }
  const hits=await page.evaluate(async()=>{const out=[];for(const form of [1,2,3]){fixture(form);gameQA.setReduced(true);await gameQA.heroStrike(40);out.push(gameQA.state.enemyHp);}return out;});
  checks.push(`basic attack (reduced) enemy HP by form: ${hits}`);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks},null,1));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
