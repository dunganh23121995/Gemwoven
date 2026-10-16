const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
const keys=['fire','earth','ice','lightning'];
function art(file){return JSON.parse(fs.readFileSync(file,'utf8').match(/^const ART=(.*);$/m)[1]);}
(async()=>{
 const old=art('Game.backup-2026-10-15_19-13-26.html'),current=art('Game.html');
 assert.deepEqual(current.heroes.shadow,old.heroes.shadow,'Approved Noct art unchanged');
 assert.deepEqual(current.noctSounds,old.noctSounds,'Approved Noct SFX unchanged');
 for(const [id,value]of Object.entries(old.voices))if(id.startsWith('noct-'))assert.deepEqual(current.voices[id],value);
 const manifest=JSON.parse(fs.readFileSync('assets/reimagined/manifest.json','utf8'));
 assert.equal(manifest.actions.length,42);assert.equal(manifest.actions.reduce((n,a)=>n+a.frames,0),236);
 for(const item of manifest.actions){
  const m=JSON.parse(fs.readFileSync(`assets/reimagined/${item.family}/${item.key}/${item.action}/runtime-meta.json`,'utf8'));
  assert.equal(m.uniqueFrames,m.frames);assert.equal(m.headAnchors.length,m.frames);
  assert.equal(m.qc.edge_touch_count,0);assert.equal(m.qc.paste_clamped_count,0);assert.ok(m.qc.body_scale_cv<=.08);
 }
 for(const key of keys){assert.notEqual(current.heroes[key].idle.src,old.heroes[key].idle.src);assert.equal(current.bosses[key].cast.count,6);assert.equal(current.heroes[key].buff.count,6);}
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],checks=['42 accepted sheets / 236 frames; all approved Noct assets unchanged'],timings=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{
   window.fixture=(key='fire',boss=true)=>{gameQA.configure({key,enemyKey:key,stage:5,boss,hp:10000,armor:0,energy:0,enemyHp:10000,enemyMax:10000,enemyArmor:0,enemyEnergy:0,stunned:false,playerFrozen:false});gameQA.setReduced(false);};
  });
  for(const key of keys){
   const normal=await page.evaluate(async key=>{
    fixture(key);let seen=false;const observer=new MutationObserver(()=>{if(document.querySelector(`[data-signature="${key}"]`))seen=true;});observer.observe(document.querySelector('#combatEffects'),{childList:true,subtree:true});
    await gameQA.attack('hero',100);observer.disconnect();return {damage:10000-gameQA.state.enemyHp,seen,effects:gameQA.effects};
   },key);
   assert.equal(normal.damage,key==='earth'?60:100);assert.ok(normal.seen,key+' signature effect');assert.equal(normal.effects,0);
   await page.evaluate(key=>{fixture(key);window.rageResult=(async()=>{const start=performance.now();await gameQA.heroUltimate();return {time:performance.now()-start,damage:10000-gameQA.state.enemyHp,effects:gameQA.effects};})();},key);
   await page.waitForTimeout(key==='earth'?2110:1940);await page.screenshot({path:`qa/redesign-combat-${key}.png`});
   const rage=await page.evaluate(()=>rageResult);assert.ok(rage.time>=2950&&rage.time<3400,`${key}: ${rage.time}`);
   assert.equal(rage.damage,{fire:135,earth:0,ice:60,lightning:140}[key]);assert.equal(rage.effects,0);timings.push({key,side:'hero',ms:Math.round(rage.time)});
   await page.evaluate(key=>{fixture(key);window.bossResult=(async()=>{const start=performance.now();await gameQA.enemySkill();return {time:performance.now()-start,damage:10000-gameQA.state.hp,effects:gameQA.effects};})();},key);
   await page.waitForTimeout(1960);await page.screenshot({path:`qa/redesign-boss-${key}.png`});
   const boss=await page.evaluate(()=>bossResult);assert.ok(boss.time>=2950&&boss.time<3400,`${key} boss: ${boss.time}`);assert.ok(boss.damage>0);assert.equal(boss.effects,0);timings.push({key,side:'boss',ms:Math.round(boss.time)});
   const voices=await page.evaluate(async key=>{
    fixture(key);const ids=[];
    for(const side of ['hero','enemy'])for(const kind of ['attack','attack','attack','hurt','hurt','hurt','cast','release']){
     gameQA.stopCombatVoices();await gameQA.combatVoice(side,kind);ids.push(document.querySelector('#'+side+'Actor').dataset.voiceClip);
    }
    gameQA.stopCombatVoices();gameQA.state.enemyHp=1;gameQA.damage('hero',100);await new Promise(r=>setTimeout(r,80));ids.push(document.querySelector('#enemyActor').dataset.voiceClip);
    return ids;
   },key);
   assert.equal(new Set(voices).size,17);assert.ok(voices.slice(8).every(id=>id?.startsWith('boss-'+key+'-')));assert.equal(voices.at(-1),'boss-'+key+'-death');
   const fast=await page.evaluate(async key=>{fixture(key);gameQA.setReduced(true);const start=performance.now();await gameQA.heroUltimate();return {time:performance.now()-start,damage:10000-gameQA.state.enemyHp};},key);
   assert.ok(fast.time<500);assert.equal(fast.damage,{fire:135,earth:0,ice:60,lightning:140}[key]);
  }
  checks.push('Four hero / four boss skills: 3 seconds, correct damage, dedicated voices and FX, NO FX parity');
  for(const key of keys){
   await page.evaluate(key=>{fixture(key);window.depart=gameQA.departVictoriousHero();},key);await page.waitForTimeout(1100);
   const pose=await page.evaluate(()=>({action:document.querySelector('#heroActor .sprite-body').dataset.action,camera:+document.querySelector('#scene').dataset.cameraX,floating:document.querySelector('#heroActor').dataset.floating,translate:getComputedStyle(document.querySelector('#heroActor')).translate}));
   assert.equal(pose.action,key==='lightning'?'hover':'run');assert.ok(pose.camera>25);if(key==='lightning'){assert.equal(pose.floating,'true');assert.notEqual(pose.translate,'0px');}
   await page.screenshot({path:`qa/redesign-depart-${key}.png`});await page.evaluate(()=>depart);
  }
  await page.evaluate(()=>fixture('lightning'));
  const hover=[];for(let i=0;i<4;i++){await page.waitForTimeout(240);hover.push(await page.locator('#heroActor').evaluate(n=>({translate:getComputedStyle(n).translate,head:n.querySelector('.actor-head-anchor').getBoundingClientRect().y})));}
  assert.ok(new Set(hover.map(h=>h.translate)).size>2);assert.ok(new Set(hover.map(h=>h.head)).size>2);
  await page.evaluate(()=>{gameQA.state.hp=1;gameQA.damage('enemy',100);});await page.waitForTimeout(280);
  assert.equal(await page.locator('#heroActor').getAttribute('data-floating'),'false');
  const deadTranslate=await page.locator('#heroActor').evaluate(n=>getComputedStyle(n).translate);assert.ok(['0px','0px 0px'].includes(deadTranslate),deadTranslate);
  checks.push('Weapon-free departures; Lumi floats through combat and glides between stages, falls only at zero HP; head HUD follows');
  await page.evaluate(()=>{fixture();gameQA.stopCombatVoices();});
  for(const key of keys)for(const kind of ['charge','launch','impact','finish','receive'])assert.equal(await page.evaluate(async({key,kind})=>gameQA.playCastSound(key,kind),{key,kind}),true);
  assert.ok(await page.evaluate(()=>gameQA.castSounds.length<=8));await page.evaluate(()=>gameQA.stopCombatVoices());assert.equal(await page.evaluate(()=>gameQA.castSounds.length),0);
  checks.push('20 original SFX decode offline, capped overlap and stage/mute cleanup');
  assert.deepEqual(errors,[]);fs.writeFileSync('qa/cast-redesign-results.json',JSON.stringify({passed:true,checks,timings,errors},null,2));console.log('PASS',checks.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
