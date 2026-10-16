const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=1631;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  await page.evaluate(()=>{
   window.fixture=(options={})=>{gameQA.configure({key:'earth',stage:1,boss:false,enemyKey:'fire',hp:320,armor:999,energy:0,enemyHp:100000,enemyMax:100000,enemyArmor:0,enemyEnergy:0,enemyTurn:0,playerFrozen:false,...options});gameQA.setReduced(true);};
   window.turns=[];new MutationObserver(()=>turns.push({label:document.querySelector('#turnChip').textContent,locked:gameQA.locked,frozen:gameQA.state.playerFrozen})).observe(document.querySelector('#turnChip'),{childList:true});
   fixture();
  });
  // A real touch on an ordinary tile must only select it.
  await page.locator('.tile').first().tap();
  assert.equal(await page.locator('.tile.selected').count(),1);
  assert.deepEqual(await page.evaluate(()=>({locked:gameQA.locked,turn:gameQA.state.enemyTurn,score:gameQA.state.score})),{locked:false,turn:0,score:0});
  checks.push('Mobile tap selects without handing the turn to the enemy');
  const invalid=await page.evaluate(async()=>{
   fixture();const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
   // Add a remote legal move so ensurePlayable does not reshuffle the fixture.
   types[5][0]=1;types[5][1]=1;types[5][2]=2;types[4][2]=1;
   gameQA.setBoard(types);const ids=()=>gameQA.board.flat().map(t=>t.id).join(',');const before=ids();
   await gameQA.trySwap(gameQA.board[0][0],gameQA.board[0][1]);
   return {same:before===ids(),turn:gameQA.state.enemyTurn,score:gameQA.state.score};
  });
  assert.deepEqual(invalid,{same:true,turn:0,score:0});checks.push('Invalid swap restores tiles and does not consume a turn');
  const normal=await page.evaluate(async()=>{
   fixture();const m=gameQA.legalMoves().find(m=>m.a.type!==3&&m.b.type!==3)||gameQA.legalMoves()[0];
   await Promise.all([gameQA.trySwap(m.a,m.b),gameQA.trySwap(m.a,m.b)]);
   return {locked:gameQA.locked,score:gameQA.state.score,turn:gameQA.state.enemyTurn};
  });
  assert.equal(normal.locked,false);assert.ok(normal.score>0);assert.ok(normal.turn<=1);
  checks.push('Duplicate swaps remain inside one locked transaction');
  // Full real ice ultimate + board turn: no second user input to thaw.
  const frozen=await page.evaluate(async()=>{
   fixture({enemyKey:'ice',enemyEnergy:100});gameQA.setReduced(false);turns.length=0;
   const m=gameQA.legalMoves()[0];await gameQA.trySwap(m.a,m.b);
   return {frozen:gameQA.state.playerFrozen,locked:gameQA.locked,label:document.querySelector('#turnChip').textContent,turns:turns.slice(),score:gameQA.state.score};
  });
  assert.equal(frozen.frozen,false);assert.equal(frozen.locked,false);assert.equal(frozen.label,'Lượt bạn');assert.ok(frozen.score>0);
  const skips=frozen.turns.filter(t=>t.label==='Đóng băng · mất lượt');assert.ok(skips.length>0);assert.ok(skips.every(t=>t.locked));
  assert.ok(!frozen.turns.some(t=>t.label==='Lượt bạn'&&t.frozen));
  assert.equal(await page.locator('.tile.selected').count(),0);
  checks.push('Ice ultimate automatically resolves the frozen turn while the board stays locked; ready label only appears after thaw');
  // The next action really belongs to the player, not the deferred freeze.
  await page.locator('.tile:not(.selected)').first().tap();assert.equal(await page.locator('.tile.selected').count(),1);
  assert.equal(await page.evaluate(()=>gameQA.locked),false);
  checks.push('First tap after thaw selects normally');
  const repeated=await page.evaluate(async()=>{
   fixture({enemyKey:'ice',enemyEnergy:100});turns.length=0;
   // Supply a second ice ultimate during the first skipped turn, then let the
   // real combat code handle both freezes without overlapping transactions.
   let repeats=0;const observer=new MutationObserver(()=>{
    if(!repeats&&document.querySelector('#turnChip').textContent==='Đóng băng · mất lượt'){
     repeats++;gameQA.state.enemyEnergy=100;
    }
   });observer.observe(document.querySelector('#turnChip'),{childList:true});
   const m=gameQA.legalMoves()[0];try{await gameQA.trySwap(m.a,m.b);}finally{observer.disconnect();}
   return {repeats,frozen:gameQA.state.playerFrozen,locked:gameQA.locked,skips:turns.filter(t=>t.label==='Đóng băng · mất lượt'&&t.frozen).length,badReady:turns.some(t=>t.label==='Lượt bạn'&&t.frozen)};
  });
  assert.equal(repeated.repeats,1);assert.ok(repeated.skips>=2);assert.equal(repeated.frozen,false);assert.equal(repeated.locked,false);assert.equal(repeated.badReady,false);
  checks.push('Consecutive ice freezes settle automatically without exposing a false player turn');
  assert.deepEqual(errors,[]);const result={passed:true,checks,errors};fs.writeFileSync('qa/frozen-turn-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
