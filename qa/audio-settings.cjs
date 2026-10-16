const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},offline:true});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.audioConnections=[];
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(to,...args){audioConnections.push({from:this,to});return connect.call(this,to,...args);};
  });
  await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
  if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.waitForFunction(()=>document.querySelector('#scene').dataset.music);
  await page.evaluate(()=>gameQA.combatVoice('hero','attack'));
  const buses=()=>page.evaluate(()=>audioConnections.filter(c=>c.to instanceof AudioDestinationNode).map(c=>c.from.gain.value));
  assert.deepEqual((await buses()).map(v=>Math.round(v*100)).sort((a,b)=>a-b),[10,29,100]);
  await page.locator('#audioSettingsBtn').click();assert.equal(await page.locator('#audioSettingsTitle').textContent(),'Âm thanh');
  assert.equal(await page.locator('#volume-music').inputValue(),'10');
  checks.push('Default levels are music 10%, effects 100%, voices 29%');
  const set=async(key,value)=>{
   await page.locator('#volume-'+key).fill(String(value));
   // Suspended audio deliberately keeps the new ramp pending until unmuted.
   if(await page.locator('#soundBtn').getAttribute('aria-pressed')==='true')await page.waitForFunction(value=>audioConnections.some(c=>c.to instanceof AudioDestinationNode&&Math.abs(c.from.gain.value-value/100)<.001),value);
  };
  await set('music',13);await set('effects',27);await set('voices',61);
  assert.deepEqual((await buses()).map(v=>Math.round(v*100)).sort((a,b)=>a-b),[13,27,61]);
  const routing=await page.evaluate(()=>{
   const buses=audioConnections.filter(c=>c.to instanceof AudioDestinationNode).map(c=>c.from);
   const voice=buses.find(b=>Math.round(b.gain.value*100)===61);
   return {outputs:buses.length,voiceInputs:audioConnections.filter(c=>c.to===voice).length,onlyGainOutputs:buses.every(b=>b instanceof GainNode)};
  });
  assert.equal(routing.outputs,3);assert.equal(routing.onlyGainOutputs,true);assert.equal(routing.voiceInputs,2);
  await set('voices',0);assert.equal(await page.locator('#volume-voices-value').textContent(),'Tắt');
  assert.deepEqual((await buses()).map(v=>Math.round(v*100)).sort((a,b)=>a-b),[0,13,27]);
  checks.push('Three independent live gain controls; direct voice and echo share the voice control; zero mutes only its channel');
  await page.locator('#audioSettingsDialog .primary-button').click();
  assert.equal(await page.locator('#audioSettingsBtn').evaluate(n=>n===document.activeElement),true);
  await page.reload();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.locator('#audioSettingsBtn').click();
  assert.deepEqual(await page.locator('.audio-level input').evaluateAll(nodes=>nodes.map(n=>n.value)),['13','27','0']);
  await page.locator('#volume-effects').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#volume-effects').inputValue(),'28');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#audioSettingsDialog').evaluate(n=>n.open),false);
  checks.push('Settings persist across offline reloads; keyboard sliders, Escape and focus return work');
  await page.locator('#soundBtn').click();await page.locator('#audioSettingsBtn').click();
  assert.equal(await page.locator('#audioMutedNote').isVisible(),true);
  await set('music',22);assert.equal(await page.locator('#scene').getAttribute('data-music'),null);
  await page.locator('#audioResetBtn').click();assert.deepEqual(await page.locator('.audio-level input').evaluateAll(nodes=>nodes.map(n=>n.value)),['10','100','29']);
  await page.locator('#audioSettingsDialog .primary-button').click();await page.locator('#soundBtn').click();
  await page.waitForFunction(()=>document.querySelector('#scene').dataset.music);
  checks.push('Master mute remains effective while editing; reset restores the quieter defaults');
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});await page.locator('#audioSettingsBtn').click();
   const layout=await page.evaluate(()=>{
    const brand=document.querySelector('.brand').getBoundingClientRect(),tools=document.querySelector('.header-tools').getBoundingClientRect(),dialog=document.querySelector('#audioSettingsDialog');
    return {overlap:brand.right>tools.left,overflow:document.documentElement.scrollWidth>innerWidth,dialogOverflow:dialog.scrollWidth>dialog.clientWidth};
   });
   assert.deepEqual(layout,{overlap:false,overflow:false,dialogOverflow:false});
   await page.screenshot({path:`qa/audio-settings-${width}.png`,fullPage:true});await page.keyboard.press('Escape');
  }
  checks.push('Audio panel and four header controls fit 320px and 390px phones');
  await page.evaluate(()=>localStorage.setItem('mam-phep-audio-v1','{"music":-100,"effects":999,"voices":"bad"}'));
  await page.reload();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.locator('#audioSettingsBtn').click();
  assert.deepEqual(await page.locator('.audio-level input').evaluateAll(nodes=>nodes.map(n=>n.value)),['0','100','29']);
  assert.deepEqual(errors,[]);checks.push('Invalid stored values are clamped or replaced safely; no JavaScript errors');
  const result={passed:checks.length,checks,errors};fs.writeFileSync('qa/audio-settings-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
