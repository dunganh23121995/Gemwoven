const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/audio/music-manifest.json','utf8'));
 assert.equal(Object.keys(manifest).length,4);assert.equal(new Set(Object.values(manifest).map(v=>v.sha256)).size,4);
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[],metrics=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('Scene music unavailable'))errors.push(m.text());});
  await page.addInitScript(()=>{
   window.musicRecords=[];
   const create=AudioContext.prototype.createBufferSource;
   AudioContext.prototype.createBufferSource=function(...args){
    const source=create.apply(this,args),start=source.start,stop=source.stop,connect=source.connect;
    let output,entry;
    source.connect=function(node,...args){output=node;return connect.call(this,node,...args);};
    source.start=function(...args){if(source.loop){entry={source,output,offset:args[1]||0,stopped:false};musicRecords.push(entry);}return start.apply(this,args);};
    source.stop=function(...args){if(entry)entry.stopped=true;return stop.apply(this,args);};return source;
   };
  });
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  assert.equal(await page.evaluate(()=>musicRecords.length),0);
  if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.waitForFunction(()=>document.querySelector('#scene').dataset.music);
  checks.push('Music waits for the Start gesture; all audio works offline');
  for(const key of Object.keys(manifest)){
   await page.evaluate(key=>gameQA.configure({key:'fire',enemyKey:key,stage:5,energy:0,enemyEnergy:0}),key);
   await page.waitForFunction(key=>document.querySelector('#scene').dataset.music===key,key);
   const sample=await page.evaluate(()=>{
    const entry=musicRecords.at(-1),buffer=entry.source.buffer,data=buffer.getChannelData(0);let sum=0,peak=0;
    for(const v of data){sum+=v*v;peak=Math.max(peak,Math.abs(v));}
    return {duration:buffer.duration,channels:buffer.numberOfChannels,rms:Math.sqrt(sum/data.length),peak,seam:Math.abs(data[0]-data.at(-1)),loop:entry.source.loop};
   });
   assert.ok(sample.duration>55&&sample.duration<65);assert.equal(sample.channels,2);assert.equal(sample.loop,true);
   assert.ok(sample.rms>.05&&sample.rms<.15);assert.ok(sample.peak<.8);assert.ok(sample.seam<.04);metrics.push({key,...sample});
  }
  checks.push('Four distinct stereo loops decode correctly with headroom and smooth loop seams');
  await page.waitForTimeout(1600);
  assert.ok(Math.abs(await page.evaluate(()=>musicRecords.at(-1).output.gain.value)-.24)<.001);
  const starts=await page.evaluate(()=>musicRecords.length);
  await page.evaluate(()=>{gameQA.configure({enemyKey:'lightning'});gameQA.configure({enemyKey:'lightning'});});
  assert.equal(await page.evaluate(()=>musicRecords.length),starts);
  await page.evaluate(()=>{gameQA.configure({enemyKey:'fire'});gameQA.configure({enemyKey:'ice'});gameQA.configure({enemyKey:'earth'});});
  await page.waitForFunction(()=>document.querySelector('#scene').dataset.music==='earth');
  assert.equal(await page.evaluate(()=>musicRecords.filter(v=>!v.stopped).length),1);
  checks.push('Soft gain reaches 24%; same-scene rerenders do not restart; rapid changes leave only the last theme');
  await page.locator('#soundBtn').click();
  assert.equal(await page.evaluate(()=>musicRecords.filter(v=>!v.stopped).length),0);
  assert.equal(await page.locator('#scene').getAttribute('data-music'),null);
  await page.locator('#soundBtn').click();await page.waitForFunction(()=>document.querySelector('#scene').dataset.music==='earth');
  assert.ok(await page.evaluate(()=>musicRecords.at(-1).offset>0));
  checks.push('Speaker toggle stops music and resumes its position without duplicate playback');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.evaluate(()=>musicRecords.filter(v=>!v.stopped).length),0);
  assert.equal(await page.locator('.ambient-speck').first().evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>document.querySelector('#scene').dataset.music==='earth');
  checks.push('Hidden tab stops audio and pauses scenery; returning restores one music loop');
  assert.equal(await page.locator('#sceneAtmosphere').count(),1);assert.equal(await page.locator('.ambient-speck').count(),12);
  const position=await page.locator('.parallax-layer').first().evaluate(n=>getComputedStyle(n).translate);
  await page.waitForTimeout(900);
  assert.notEqual(await page.locator('.parallax-layer').first().evaluate(n=>getComputedStyle(n).translate),position);
  const musicCount=await page.evaluate(()=>musicRecords.length);
  await page.evaluate(()=>gameQA.setReduced(true));
  assert.equal(await page.locator('#sceneAtmosphere').evaluate(n=>getComputedStyle(n).display),'none');
  assert.equal(await page.locator('.parallax-layer').first().evaluate(n=>getComputedStyle(n).animationName),'none');
  assert.equal(await page.evaluate(()=>musicRecords.length),musicCount);
  assert.equal(await page.evaluate(()=>gameQA.effects),0);
  await page.evaluate(()=>gameQA.setReduced(false));
  checks.push('Scenery moves subtly; NO FX removes ambient motion while preserving music and the effect queue');
  for(const key of Object.keys(manifest)){
   await page.evaluate(key=>gameQA.configure({enemyKey:key,stage:5}),key);
   await page.locator('.parallax-layer').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
   await page.screenshot({path:`qa/ambience-${key}.png`,fullPage:true});
  }
  await page.evaluate(()=>{window.departure=gameQA.departVictoriousHero();});
  await page.waitForTimeout(1200);
  const layers=await page.locator('.parallax-layer').evaluateAll(nodes=>nodes.map(n=>({camera:n.style.transform,ambient:getComputedStyle(n).translate})));
  assert.equal(new Set(layers.map(v=>v.camera)).size,3);assert.ok(layers[0].camera.startsWith('translateX(-'));
  await page.screenshot({path:'qa/ambience-departure.png',fullPage:true});await page.evaluate(()=>departure);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  checks.push('All four environments render on a phone; three-speed departure camera still works alongside ambient motion');
  assert.deepEqual(errors,[]);
  const result={passed:checks.length,checks,metrics,errors};fs.writeFileSync('qa/scene-ambience-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
