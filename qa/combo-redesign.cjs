const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],snapshots=[];
 try{
  const page=await browser.newPage({viewport:{width:320,height:800}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.evaluate(()=>{gameQA.setReduced(false);gameQA.beginBoardCombo('hero');window.cueCount=0;window.cueObserver=new MutationObserver(records=>{for(const record of records)for(const n of record.addedNodes)if(n instanceof Element&&n.classList.contains('combo-cue'))cueCount++;});cueObserver.observe(document.querySelector('#boardFrame'),{childList:true,subtree:true});});
  for(const chain of [1,10,11,20,81,125,1000]){
   await page.evaluate(chain=>{window.preview=gameQA.boardComboStart({targets:[]},chain);},chain);
   const snapshot=await page.evaluate(()=>{
    const cue=document.querySelector('.combo-cue'),frame=document.querySelector('#boardFrame');
    for(const a of cue.getAnimations({subtree:true})){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.78;}
    const r=cue.getBoundingClientRect(),f=frame.getBoundingClientRect();
    return {text:cue.textContent,chain:+cue.dataset.comboWave,shake:+cue.dataset.shake,glow:parseFloat(frame.style.getPropertyValue('--combo-glow-size')),color:frame.style.getPropertyValue('--combo-color'),fits:r.left>=f.left&&r.right<=f.right,clones:document.querySelectorAll('.combo-cue,.combo-meter,.combo-finale').length};
   });
   assert.equal(snapshot.text,'COMBO ×'+chain);assert.equal(snapshot.clones,1);assert.ok(snapshot.fits);snapshots.push(snapshot);
   if([1,11,81].includes(chain))await page.screenshot({path:`qa/combo-redesign-${chain}.png`});
   await page.evaluate(async()=>{for(const a of document.querySelector('.combo-cue').getAnimations({subtree:true}))a.finish();await preview;});
   assert.equal(await page.locator('.combo-cue,.combo-meter').count(),0);
  }
  assert.ok(snapshots[2].shake>snapshots[1].shake&&snapshots[2].glow>snapshots[1].glow,'Appearance keeps progressing past x10');
  await page.evaluate(()=>gameQA.finishBoardCombo());assert.equal(await page.evaluate(()=>cueCount),7,'Finishing does not replay the last number');
  await page.evaluate(()=>gameQA.resetBoardCombo());assert.equal(await page.evaluate(()=>gameQA.effects),0);
  // Real cascade with a finite stream of heart refills, then ordinary randomness.
  const cascade=await page.evaluate(async()=>{
   gameQA.configure({key:'earth',enemyKey:'earth',hp:320,armor:999,enemyHp:100000,enemyMax:100000});gameQA.setReduced(true);
   const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));types[7][0]=types[7][1]=types[7][2]=1;gameQA.setBoard(types);
   const saved=Math.random;let calls=0,seed=481;
   Math.random=()=>{if(++calls<1800)return .25;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   try{await gameQA.resolveBoard('hero');return {label:document.querySelector('#comboLabel').textContent,calls,remaining:gameQA.matches().tiles.length,tiles:gameQA.board.flat().length,effects:gameQA.effects};}finally{Math.random=saved;}
  });
  assert.ok(+cascade.label.split('×')[1]>10,JSON.stringify(cascade));assert.equal(cascade.remaining,0);assert.equal(cascade.tiles,64);assert.equal(cascade.effects,0);
  assert.equal(await page.locator('.combo-layer,.combo-cue,.combo-meter').count(),0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,snapshots,cascade,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
