const assert=require('node:assert/strict');
const {chromium}=require(require('path').join(require('os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{let seed=91234;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
await page.goto('http://127.0.0.1:8000/Game.html?qa');await page.locator('[data-class="ice"]').click();if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
assert.equal(await page.evaluate(()=>gameQA.state.key),'ice');checks.push('Choose a hero and start');
await page.evaluate(()=>gameQA.setReduced(true));
const assertBoard=async(label)=>{
 const s=await page.evaluate(()=>({locked:gameQA.locked,effects:gameQA.effects,count:gameQA.board.flat().length,ids:new Set(gameQA.board.flat().map(t=>t.id)).size,dom:document.querySelectorAll('.tile').length,matches:gameQA.matches().tiles.length,moves:gameQA.legalMoves().length,valid:gameQA.board.every((row,r)=>row.every((t,c)=>t.r===r&&t.c===c&&t.el.isConnected)),fx:document.querySelectorAll('#boardEffects>*').length}));
 assert.equal(s.locked,false,label);assert.equal(s.count,64,label);assert.equal(s.ids,64,label);assert.equal(s.dom,64,label);assert.equal(s.matches,0,label);assert.equal(s.valid,true,label);assert.equal(s.effects,0,label);assert.equal(s.fx,0,label);assert.ok(s.moves>0,label);checks.push(label);
};
await assertBoard('Initial stable playable board');
const invalid=await page.evaluate(async()=>{
 const before=JSON.stringify(gameQA.board.map(row=>row.map(t=>t.id))),turn=gameQA.state.enemyTurn,hp=gameQA.state.hp,score=gameQA.state.score;
 const types=gameQA.board.map(row=>row.map(t=>t.type));
 const hasMatch=a=>a.some((row,r)=>row.some((v,c)=>c<6&&v===row[c+1]&&v===row[c+2]||r<6&&v===a[r+1][c]&&v===a[r+2][c]));
 let pair;for(let r=0;r<8&&!pair;r++)for(let c=0;c<7&&!pair;c++){const clone=types.map(x=>x.slice());[clone[r][c],clone[r][c+1]]=[clone[r][c+1],clone[r][c]];if(!hasMatch(clone))pair=[gameQA.board[r][c],gameQA.board[r][c+1]];}
 await gameQA.trySwap(...pair);return {same:before===JSON.stringify(gameQA.board.map(row=>row.map(t=>t.id))),turn:gameQA.state.enemyTurn===turn,hp:gameQA.state.hp===hp,score:gameQA.state.score===score};
});assert.deepEqual(invalid,{same:true,turn:true,hp:true,score:true});await assertBoard('Invalid swap reverses without consuming turn');
await page.evaluate(async()=>{const m=gameQA.legalMoves()[0];await Promise.all([gameQA.trySwap(m.a,m.b),gameQA.trySwap(m.a,m.b),gameQA.activateSkill()]);});await assertBoard('Rapid duplicate input is locked until cascade and enemy finish');
for(const [size,kind]of [[4,'bolt'],[5,'bomb'],[6,'core']]){
 const result=await page.evaluate(({size,kind})=>{
   gameQA.configure({key:'ice',stage:1,enemyKey:'earth',hp:200,enemyHp:100000,enemyMax:100000});
   const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));for(let c=0;c<size;c++)types[3][c]=1;types[3][size]=3;
   gameQA.setBoard(types);const plan=gameQA.makePlan(gameQA.matches(),gameQA.board[3][1],'hero');return {kind:plan.creates[0]?.kind,protected:!plan.targets.includes(plan.creates[0]?.tile),size:plan.targets.length};
 },{size,kind});assert.equal(result.kind,kind);assert.ok(result.protected);assert.equal(result.size,size-1);checks.push(`Match ${size} creates ${kind} and preserves its tile`);
 await page.evaluate(async()=>{await gameQA.resolveBoard('hero');await gameQA.settle();});await assertBoard(`Match ${size} resolves with clean gravity`);
}
const chain=await page.evaluate(async()=>{
 gameQA.configure({stage:1,key:'ice',enemyKey:'earth',hp:200,enemyHp:100000,enemyMax:100000});
 const a=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));a[3][1]=a[3][2]=a[3][3]=0;
 gameQA.setBoard(a,[{r:3,c:2,kind:'bomb'},{r:4,c:3,kind:'bolt'},{r:2,c:3,kind:'core'}]);
 const p=gameQA.makePlan(gameQA.matches(),null,'enemy');const kinds=p.acts.map(a=>a.kind);const own=p.playerTiles.size;await gameQA.resolveBoard('enemy');await gameQA.settle();return {kinds,own};
});assert.ok(chain.kinds.includes('bomb')&&chain.kinds.includes('bolt')&&chain.kinds.includes('core'));assert.ok(chain.own>20);await assertBoard('Bomb, lightning and rainbow chain with player ownership on boss turn');
await page.evaluate(async()=>{gameQA.configure({stage:1,key:'earth',enemyKey:'fire',hp:320,enemyHp:100000,enemyMax:100000});gameQA.board[3][3].special='core';gameQA.board[3][3].type=-1;await gameQA.activateCore(gameQA.board[3][3]);});await assertBoard('Tap rainbow clears a type and consumes one action');
for(const key of ['fire','earth','ice','lightning']){
 const result=await page.evaluate(async key=>{gameQA.configure({stage:1,key,enemyKey:'fire',hp:80,energy:100,armor:0,enemyHp:10000,enemyMax:10000,enemyArmor:0});await gameQA.activateSkill();return {...gameQA.state};},key);
 assert.equal(result.energy,0);if(key==='ice'){assert.equal(result.armor,25);assert.equal(result.hp,80);assert.equal(result.enemyHp,9940);assert.equal(result.stunned,false);}else if(key==='earth'){assert.equal(result.noriRegenTurns,2);assert.equal(result.noriStunTurns,1);assert.equal(result.stunned,true);}else assert.ok(result.enemyHp<10000);
 await assertBoard(`Hero ${key} ultimate, hit/buff animation and energy spending`);
}
for(const key of ['fire','earth','ice','lightning']){
 const result=await page.evaluate(async key=>{gameQA.configure({stage:1,key:'earth',enemyKey:key,hp:320,energy:70,enemyEnergy:100,enemyTurn:2,enemyHp:350,enemyMax:350});await gameQA.enemyAction();return {...gameQA.state};},key);
 assert.ok(result.hp<320);if(key==='ice')assert.equal(result.playerFrozen,true);if(key==='lightning'){assert.ok(result.energy<=55);assert.ok((await page.locator('#logEntries').textContent()).includes('15 năng lượng'));}if(key==='earth')assert.ok(result.enemyArmor>0);checks.push(`Monster ${key} board move and elemental skill`);
}
const frozen=await page.evaluate(async()=>{gameQA.configure({stage:1,key:'earth',enemyKey:'fire',hp:320,playerFrozen:true,energy:0});const move=gameQA.legalMoves()[0];await gameQA.trySwap(move.a,move.b);return {energy:gameQA.state.energy,frozen:gameQA.state.playerFrozen,turn:gameQA.state.enemyTurn};});assert.equal(frozen.frozen,false);assert.equal(frozen.turn,1);await assertBoard('Frozen player skips exactly one board action');
const boss=await page.evaluate(async()=>{gameQA.configure({stage:5,boss:true,key:'earth',hp:320,armor:999,enemyKey:'lightning',enemyHp:1000,enemyMax:3000,enemyEnergy:100});await gameQA.enemyAction();await gameQA.settle();return {...gameQA.state};});assert.equal(boss.enraged,true);assert.ok(boss.enemyEnergy>=0&&boss.enemyEnergy<100);assert.ok(boss.enemyArmor>=0);await assertBoard('Boss automatically casts full rage, plays a board move and enrages');
await page.evaluate(async()=>{gameQA.configure({stage:1,key:'earth',hp:320,enemyKey:'fire'});gameQA.setBoard(Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5)));if(gameQA.legalMoves().length)throw Error('Fixture should be dead');await gameQA.settle();});await assertBoard('Dead board reshuffles into a match-free playable board');
await page.evaluate(async()=>{gameQA.configure({stage:4,key:'fire',hp:170,energy:100,enemyKey:'earth',enemyHp:1,enemyMax:350});await gameQA.activateSkill();});assert.equal(await page.locator('#resultDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>gameQA.ended),true);await page.locator('#nextBtn').click();assert.equal(await page.evaluate(()=>gameQA.state.stage),5);assert.equal(await page.evaluate(()=>gameQA.state.boss),true);await page.locator('#selectDialog').waitFor({state:'visible'});if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await assertBoard('Victory previews stage 5 boss before hero selection');
await page.evaluate(async()=>{gameQA.configure({stage:1,key:'fire',hp:1,armor:0,energy:100,enemyKey:'earth',enemyHp:100000,enemyMax:100000,enemyEnergy:100,enemyTurn:2});await gameQA.activateSkill();});assert.equal(await page.locator('#resultDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>gameQA.state.hp),0);await page.locator('#nextBtn').click();await page.locator('#selectDialog').waitFor({state:'visible'});assert.equal(await page.locator('#selectDialog').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>gameQA.state.stage),1);assert.equal(await page.evaluate(()=>gameQA.state.score),0);checks.push('Defeat and restart reset the run');
if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.locator('#helpBtn').click();assert.equal(await page.locator('#helpDialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#helpDialog').evaluate(e=>e.open),false);checks.push('Help dialog and Escape dismissal');
await page.locator('.tile').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-colindex')),'2');await page.keyboard.press('Enter');assert.equal(await page.locator('.tile.selected').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.tile.selected').count(),0);checks.push('Keyboard navigation, selection and cancellation');
for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false,'Overflow '+width);checks.push(`No horizontal overflow at ${width}px`);}
const offline=await browser.newPage();await offline.context().setOffline(true);await offline.goto('file:///'+require('path').resolve('Game.html').replaceAll('\\','/'));assert.equal(await offline.locator('#selectDialog').evaluate(e=>e.open),true);if(await offline.locator('#heroList').isVisible())await offline.locator('.gem-choice.chosen').click();await offline.locator('#startBtn').click();assert.equal(await offline.locator('.tile').count(),64);checks.push('Standalone file opens and plays offline');
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
