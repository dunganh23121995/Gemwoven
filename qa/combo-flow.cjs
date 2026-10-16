const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],checks=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.GAME_TEST_URL||pathToFileURL(path.resolve('Game.html')).href)+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    await page.evaluate(()=>{
      window.flowEvents=[];
      const append=Element.prototype.append;
      Element.prototype.append=function(...nodes){
        for(const n of nodes)if(n instanceof Element){
          if(n.dataset.comboWave)flowEvents.push({kind:'combo',wave:+n.dataset.comboWave,time:performance.now()});
          if(n.dataset.comboTotal)flowEvents.push({kind:'summary',wave:+n.dataset.comboTotal,time:performance.now()});
          if(n.classList.contains('combo-transfer'))flowEvents.push({kind:'transfer',time:performance.now()});
          if(n.classList.contains('combat-v3-number')&&n.classList.contains('damage'))flowEvents.push({kind:'hit',time:performance.now()});
          if(n.classList.contains('self-buff-flow'))flowEvents.push({kind:'receive',time:performance.now()});
          if(n.dataset.boardPhase==='enemy-choice')flowEvents.push({kind:'enemy-choice',time:performance.now()});
        }
        return append.apply(this,nodes);
      };
      gameQA.configure({key:'earth',enemyKey:'earth',hp:150,armor:0,enemyHp:10000,enemyMax:10000});
      gameQA.setReduced(false);
      const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
      types[4][3]=types[5][3]=types[6][3]=1;types[3][3]=types[6][2]=types[6][4]=0;
      gameQA.setBoard(types);
      let seed=1029;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      window.comboRun=gameQA.resolveBoard('hero');
    });
    // Fast cues can disappear between driver polls; observe the recorded event.
    await page.waitForFunction(()=>flowEvents.some(e=>e.kind==='combo'&&e.wave===2),null,{timeout:20000});
    if(!process.argv.includes('--no-capture'))await page.screenshot({path:'qa/mobile-combo-v4.png',fullPage:true});
    await page.evaluate(()=>window.comboRun);
    const combo=await page.evaluate(()=>({events:flowEvents,clean:!document.querySelector('.combo-layer,.combo-transfer,.combo-hero-aura'),effects:gameQA.effects,chain:document.querySelector('#boardFrame').dataset.comboChain,labels:document.querySelector('#comboLabel').textContent}));
    const waves=combo.events.filter(e=>e.kind==='combo');assert.ok(waves.length>=2);assert.deepEqual(waves.map(e=>e.wave),waves.map((_,i)=>i+1));
    assert.ok(!combo.events.some(e=>e.kind==='summary'),'No duplicate end-of-combo announcement');
    assert.ok(combo.events.find(e=>e.kind==='transfer').time> waves.at(-1).time);
    // This fixture heals first, then queues a sword attack. The heal must begin
    // during the cascade; the queued attack may land after its visual transfer.
    assert.ok(combo.events.find(e=>e.kind==='receive'||e.kind==='hit').time<combo.events.find(e=>e.kind==='transfer').time,'Combat starts during the cascade, before its transfer');
    assert.ok(combo.events.some(e=>e.kind==='hit'),'Queued sword damage resolves before returning control');
    assert.ok(combo.clean);assert.equal(combo.effects,0);assert.equal(combo.chain,undefined);checks.push('A real multi-wave cascade announces each wave while combat is already running, then finishes and cleans up');
    await page.evaluate(async()=>{
      gameQA.setReduced(true);gameQA.configure({stage:1,key:'earth',enemyKey:'earth',hp:320,armor:999,enemyHp:10000,enemyMax:10000});
      flowEvents.length=0;const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));types[4][1]=types[4][2]=types[4][3]=2;gameQA.setBoard(types);await gameQA.resolveBoard('hero');
    });
    assert.equal(await page.locator('.combo-layer,.combo-transfer,.combo-hero-aura').count(),0);assert.equal(await page.evaluate(()=>flowEvents.some(e=>e.kind==='combo'||e.kind==='transfer')),false);checks.push('A fresh single-wave/reduced-motion resolution does not inherit the previous combo');
    for(const stage of [1,5,15,25]){
      const turn=await page.evaluate(async stage=>{
        gameQA.configure({stage,key:'earth',enemyKey:'earth',hp:320,armor:999,enemyHp:100000,enemyMax:100000,enemyEnergy:0});
        const before=JSON.stringify(gameQA.board.map(row=>row.map(t=>t.id)));flowEvents.length=0;
        const level=gameQA.enemyThinkingLevel();await gameQA.enemyAction();await gameQA.settle();
        return {changed:before!==JSON.stringify(gameQA.board.map(row=>row.map(t=>t.id))),choices:flowEvents.filter(e=>e.kind==='enemy-choice').length,count:gameQA.board.flat().length,matches:gameQA.matches().tiles.length,moves:gameQA.legalMoves().length,effects:gameQA.effects,level};
      },stage);
      assert.ok(turn.changed);assert.equal(turn.choices,1);assert.equal(turn.count,64);assert.equal(turn.matches,0);assert.ok(turn.moves>0);assert.equal(turn.effects,0);checks.push(`Stage ${stage}: opponent chooses and plays a visible board move, then leaves a playable board (${turn.level.label})`);
    }
    assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');checks.push('Sound starts enabled on the first user gesture and remains mutable');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
