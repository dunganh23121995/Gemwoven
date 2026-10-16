const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=71131;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  await page.goto((process.env.GAME_TEST_URL||require('node:url').pathToFileURL(path.resolve('Game.html')).href)+'?qa');
  await page.evaluate(()=>{
   window.base=()=>Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
   window.fixture=(specials=[],types=base())=>{
    gameQA.configure({key:'earth',enemyKey:'fire',stage:1,boss:false,hp:320,armor:999,energy:0,enemyHp:1000000,enemyMax:1000000,enemyArmor:0,enemyEnergy:0,enemyTurn:0});
    gameQA.setReduced(true);gameQA.setBoard(types,specials);
   };
   window.observeWaves=()=>{
    window.waves=[];let current=null;
    const label=new MutationObserver(()=>{
     const match=document.querySelector('#comboLabel').textContent.match(/^Toàn bàn (\d+)\/(\d+)$/);
     if(match){const number=+match[1];if(current?.number!==number){current={number,total:+match[2],ids:gameQA.board.flat().map(t=>t.id),removed:[],locked:gameQA.locked};waves.push(current);}}
     else current=null;
    });label.observe(document.querySelector('#comboLabel'),{childList:true});
    const board=new MutationObserver(records=>{if(current)for(const r of records)for(const node of r.removedNodes)if(node.matches?.('.tile'))current.removed.push(+node.dataset.id);});
    board.observe(document.querySelector('#board'),{childList:true});
    window.stopObserving=()=>{label.disconnect();board.disconnect();};
   };
  });
  const ranges=await page.evaluate(()=>{
   const result={};
   for(const kind of ['bolt','bomb']){
    const types=base();types[3][2]=types[3][3]=types[3][4]=0;types[0][0]=0;
    fixture([{r:3,c:3,kind}],types);
    const plan=gameQA.makePlan(gameQA.matches(),null,'enemy'),act=plan.acts[0];
    result[kind]={hits:act.hits.map(t=>[t.r,t.c]),type:act.tile.type};
   }
   return result;
  });
  assert.equal(ranges.bolt.hits.length,25);assert.ok(ranges.bolt.hits.every(([r,c])=>Math.abs(r-3)<=2&&Math.abs(c-3)<=2));
  assert.ok(ranges.bomb.hits.some(([r,c])=>r===0&&c===0));
  assert.ok(ranges.bomb.hits.length<25);checks.push('Tier 4 hits the 5×5 area; tier 5 reaches matching items across the whole board');
  for(const count of [2,4,5]){
   const result=await page.evaluate(async count=>{
    const specials=[{r:3,c:3,kind:'core'},{r:3,c:4,kind:'core'}];
    if(count>=4)specials.push({r:0,c:0,kind:'bolt'},{r:7,c:7,kind:'bomb'});
    if(count===5)specials.push({r:1,c:6,kind:'core'});
    fixture(specials);observeWaves();const score=gameQA.state.score;
    try{await gameQA.trySwap(gameQA.board[3][3],gameQA.board[3][4]);}finally{stopObserving();}
    return {waves,score:gameQA.state.score-score,locked:gameQA.locked,count:document.querySelectorAll('.tile').length,matches:gameQA.matches().tiles.length,effects:gameQA.effects};
   },count);
   assert.equal(result.waves.length,count);const seen=new Set();
   for(const [index,wave]of result.waves.entries()){
    assert.equal(wave.number,index+1);assert.equal(wave.total,count);assert.equal(wave.locked,true);
    assert.equal(wave.ids.length,64);assert.equal(wave.removed.length,64);assert.equal(new Set(wave.removed).size,64);
    assert.deepEqual([...wave.ids].sort((a,b)=>a-b),[...wave.removed].sort((a,b)=>a-b));
    for(const id of wave.ids){assert.ok(!seen.has(id));seen.add(id);}
   }
   assert.ok(result.score>0);assert.equal(result.locked,false);assert.equal(result.count,64);assert.equal(result.matches,0);assert.equal(result.effects,0);
   checks.push(`${count} initial specials produce exactly ${count} full clears of distinct refilled boards, without duplicate tile rewards`);
  }
  // A core paired with an ordinary item retains the selected-colour behavior.
  const single=await page.evaluate(async()=>{
   fixture([{r:3,c:3,kind:'core'}]);observeWaves();
   try{await gameQA.trySwap(gameQA.board[3][3],gameQA.board[3][4]);}finally{stopObserving();}
   return {waves:waves.length,locked:gameQA.locked,count:gameQA.board.flat().length};
  });assert.deepEqual(single,{waves:0,locked:false,count:64});checks.push('A single core swap keeps its existing colour-clear behavior');
  const boss=await page.evaluate(async()=>{
   fixture([{r:3,c:3,kind:'core'},{r:3,c:4,kind:'core'},{r:0,c:0,kind:'bolt'}]);observeWaves();
   const choose=gameQA.opponentAI.choose,score=gameQA.state.score;
   gameQA.opponentAI.choose=async()=>({from:27,to:28,reason:'Fusion QA',coreType:null});
   try{await gameQA.enemyAction();}finally{gameQA.opponentAI.choose=choose;stopObserving();}
   return {waves:waves.map(w=>w.removed.length),score:gameQA.state.score-score,hp:gameQA.state.hp,enemyHp:gameQA.state.enemyHp,stored:gameQA.state.noriStoredDamage||0};
  });
  assert.deepEqual(boss.waves,[64,64,64]);assert.ok(boss.score>0);assert.equal(boss.hp,320);assert.ok(boss.enemyHp<1000000||boss.stored>0);
  checks.push('Enemy dual-core swap uses the same counted blasts and preserves player ownership of special-item loot');
  // Exercise actual touch drag with the full effects path, not a direct API swap.
  await page.evaluate(()=>{fixture([{r:3,c:3,kind:'core'},{r:3,c:4,kind:'core'}]);gameQA.setReduced(false);observeWaves();});
  const ids=await page.evaluate(()=>[gameQA.board[3][3].id,gameQA.board[3][4].id]);
  await page.locator(`[data-id="${ids[0]}"]`).scrollIntoViewIfNeeded();
  const boxes=await Promise.all(ids.map(id=>page.locator(`[data-id="${id}"]`).boundingBox()));
  const cdp=await page.context().newCDPSession(page),point=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(boxes[0])]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(boxes[1])]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.locator('[data-full-board="true"]').first().waitFor({state:'attached',timeout:15000});
  await page.screenshot({path:'qa/core-fusion-mobile.png'});
  await page.waitForFunction(()=>!gameQA.locked,null,{timeout:120000});
  const visual=await page.evaluate(()=>{stopObserving();return {waves:waves.map(w=>({number:w.number,total:w.total,removed:w.removed.length})),fx:document.querySelector('#boardEffects').childElementCount,selected:document.querySelectorAll('.tile.selected').length};});
  assert.deepEqual(visual,{waves:[{number:1,total:2,removed:64},{number:2,total:2,removed:64}],fx:0,selected:0});
  checks.push('Real mobile drag triggers two visible prismatic waves with full refill between them and no leftover FX');
  assert.deepEqual(errors,[]);const result={passed:true,checks,errors};fs.writeFileSync('qa/special-fusion-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
