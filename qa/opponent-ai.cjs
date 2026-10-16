const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const heroes = {fire:{hp:170},earth:{hp:320},ice:{hp:200},lightning:{hp:200}};
const defaults = {stage:10,key:'fire',enemyKey:'earth',hp:170,armor:0,energy:0,enemyHp:350,enemyMax:350,enemyArmor:0,enemyEnergy:0,boss:false,enraged:false,frozen:false,stunned:false,playerFrozen:false};
let randomCalls = 0;
const privateMath = Object.create(Math);
privateMath.random = () => {randomCalls++; throw Error('AI consumed the gameplay RNG');};
const sandbox = {HEROES:heroes,state:{...defaults},board:[],performance,setTimeout,Math:privateMath};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'src/opponent-ai.js'),'utf8')+'\nglobalThis.api={OpponentAI,chooseEnemyMove,enemyThinkingLevel};',sandbox);
const AI=sandbox.api.OpponentAI;
const checks=[];
const plain=x=>JSON.parse(JSON.stringify(x));
function grid(values,specials=[]){const cells=values.map((row,r)=>row.map((type,c)=>({type,r,c,id:r*8+c+1,special:null})));for(const s of specials){cells[s.r][s.c].special=s.kind;if(s.kind==='core')cells[s.r][s.c].type=-1;}return cells;}
function base(){return Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));}
let seed=1337;function rng(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function playable(){for(;;){const a=Array.from({length:8},()=>Array(8));for(let r=0;r<8;r++)for(let c=0;c<8;c++){let t;do{t=Math.floor(rng()*5);}while(c>1&&a[r][c-1]===t&&a[r][c-2]===t||r>1&&a[r-1][c]===t&&a[r-2][c]===t);a[r][c]=t;}const data=AI.snapshot(grid(a),defaults);if(AI.legal(data.cells,data.state).length>3)return a;}}
function reference(board,current=defaults){const src=fs.readFileSync(path.join(root,'src/game.js'),'utf8');const r={SIZE:8,state:{...current},board,rand:()=>2,tileType:t=>t&&t.special!=='core'?t.type:null};r.all=()=>r.board.flat();vm.createContext(r);vm.runInContext(src.slice(src.indexOf('function matches()'),src.indexOf('function seedBoard()'))+src.slice(src.indexOf('function makePlan('),src.indexOf('function svgNode(')),r);return r;}

(async()=>{
  assert.deepEqual([1,5,10,20].map(s=>sandbox.api.enemyThinkingLevel(s).depth),[1,1,2,3]);checks.push('Stage progression 1/1/2/3 plies');
  const fixtures=[];for(let i=0;i<14;i++)fixtures.push(playable());
  for(const values of fixtures){const live=grid(values), data=AI.snapshot(live,defaults), ref=reference(grid(values));const expected=ref.legalMoves().map(m=>[m.a.id-1,m.b.id-1].sort((a,b)=>a-b).join(':')).sort();const got=AI.legal(data.cells,data.state).map(m=>[m.from,m.to].sort((a,b)=>a-b).join(':')).sort();assert.deepEqual(plain(got),plain(expected));}
  checks.push('Legal swaps match live game reference across 14 stable boards');
  for(const side of ['enemy','hero'])for(const specialList of [[],[{r:3,c:2,kind:'bolt'}],[{r:3,c:2,kind:'bomb'},{r:4,c:3,kind:'bolt'}],[{r:2,c:2,kind:'core'}]]){
    const values=base();values[3][1]=values[3][2]=values[3][3]=0;
    const live=grid(values,specialList), ref=reference(live), data=AI.snapshot(live,defaults);
    const core=specialList.some(s=>s.kind==='core')?live[2][2]:null;
    const referencePlan=ref.makePlan(core?null:ref.matches(),live[3][2],side,core,2);
    const empty={groups:[],marked:new Uint8Array(64),count:0};
    const numeric=AI.plan(data.cells,core?empty:AI.matches(data.cells),side,26,core?18:null,2,data.state);
    const expectedTargets=referencePlan.targets.map(t=>t.r*8+t.c).sort((a,b)=>a-b);
    const expectedGifts=[...referencePlan.playerTiles].map(t=>t.r*8+t.c).sort((a,b)=>a-b);
    assert.deepEqual([...numeric.targets].flatMap((v,p)=>v?[p]:[]),plain(expectedTargets));
    assert.deepEqual([...numeric.gifts].flatMap((v,p)=>v?[p]:[]),plain(expectedGifts));
    assert.deepEqual(plain(numeric.creates.map(c=>[c.at,c.special])),plain(referencePlan.creates.map(c=>[c.tile.r*8+c.tile.c,{bolt:1,bomb:2,core:3}[c.kind]])));
  }
  checks.push('Initial targets, special chains, protected creations and ownership match live makePlan for both sides');

  const values=base();values[0][0]=values[0][1]=0;values[1][2]=0;values[0][2]=1;
  values[5][3]=values[5][4]=1;values[6][5]=1;values[5][5]=0;
  const healthy=AI.snapshot(grid(values),{...defaults,stage:5,enemyHp:350});
  const injured=AI.snapshot(grid(values),{...defaults,stage:5,enemyHp:15});
  const attack=AI.analyze(healthy.cells,healthy.state,2,10),healHealthy=AI.analyze(healthy.cells,healthy.state,45,53),healInjured=AI.analyze(injured.cells,injured.state,45,53);
  assert(attack&&healHealthy&&healInjured);assert(attack.score>healHealthy.score);assert(healInjured.score>attack.score);checks.push('Recovery value changes with actual missing health; healthy enemy prefers damage');

  const guarded=base();guarded[0][0]=guarded[0][1]=guarded[1][2]=4;guarded[0][2]=1;
  const bare=AI.snapshot(grid(guarded),{...defaults,enemyArmor:0}),armored=AI.snapshot(grid(guarded),{...defaults,enemyArmor:90});
  assert(AI.analyze(bare.cells,bare.state,2,10).score>AI.analyze(armored.cells,armored.state,2,10).score);
  const charged=base();charged[0][0]=charged[0][1]=charged[1][2]=2;charged[0][2]=1;
  const chargeLow=AI.snapshot(grid(charged),{...defaults,boss:true,enemyEnergy:0}),chargeHigh=AI.snapshot(grid(charged),{...defaults,boss:true,enemyEnergy:95});
  assert(AI.analyze(chargeHigh.cells,chargeHigh.state,2,10).score>AI.analyze(chargeLow.cells,chargeLow.state,2,10).score);
  checks.push('Armor need and imminent boss ultimate change tactical values');

  const gifted=AI.snapshot(grid(values,[{r:0,c:1,kind:'bolt'}]),{...defaults,stage:5});
  const giftedMove=AI.analyze(gifted.cells,gifted.state,2,10);
  assert(giftedMove.heroCounts[0]>0);assert(giftedMove.score<attack.score);
  checks.push('A player-owned sword bolt is penalized instead of treated as enemy damage');

  const coreGrid=grid(fixtures[0],[{r:3,c:3,kind:'core'}]);const coreData=AI.snapshot(coreGrid,defaults);
  const coreMove=AI.analyze(coreData.cells,coreData.state,27,28);
  assert.equal(coreMove.coreType,coreGrid[3][4].type);assert(coreMove.heroCounts[coreMove.coreType]>=coreGrid.flat().filter(t=>t.type===coreMove.coreType).length);assert(coreMove.hero.value>0);assert(coreMove.score<coreMove.enemy.value);checks.push('Enemy core swap targets selected neighbour and subtracts player special rewards from its score');

  const pair=[{r:3,c:3,kind:'core'},{r:3,c:4,kind:'core'}];
  let previousFusionValue=0;
  for(const specialList of [pair,[...pair,{r:0,c:0,kind:'bolt'},{r:7,c:7,kind:'bomb'}]]){
    const data=AI.snapshot(grid(base(),specialList),{...defaults,enemyHp:1000000,enemyMax:1000000});
    const before=JSON.stringify(data),move=AI.analyze(data.cells,data.state,27,28);
    assert.equal(move.fusionWaves,specialList.length);
    assert.equal(move.heroCounts.reduce((a,b)=>a+b,0),62);
    assert.equal(move.enemyCounts.reduce((a,b)=>a+b,0),0);
    assert(move.next.every(cell=>cell===0));assert(move.hero.value>previousFusionValue);
    previousFusionValue=move.hero.value;assert.equal(JSON.stringify(data),before);assert.equal(randomCalls,0);
    assert.equal(AI.legal(data.cells,data.state).filter(m=>m.from===27&&m.to===28).length,1);
  }
  checks.push('Dual cores count all initial specials, give full-board rewards to hero and estimate unknown refills without RNG or duplicate colour choices');

  const frozen=grid(fixtures[1]);for(const row of frozen){row.forEach(Object.freeze);Object.freeze(row)}Object.freeze(frozen);sandbox.board=frozen;sandbox.state={...defaults,stage:22};
  const before=JSON.stringify({board:sandbox.board,state:sandbox.state});const one=await sandbox.api.chooseEnemyMove();const two=await sandbox.api.chooseEnemyMove();
  assert(one&&two);assert.equal(one.a,frozen.flat()[one.a.id-1]);assert.equal(one.b,frozen.flat()[one.b.id-1]);assert.equal(one.a.id,two.a.id);assert.equal(one.b.id,two.b.id);assert.equal(one.score,two.score);assert.equal(JSON.stringify({board:sandbox.board,state:sandbox.state}),before);assert.equal(randomCalls,0);checks.push('Frozen live board and state remain unchanged; advanced choices deterministic with zero gameplay RNG calls');

  const easy=AI.snapshot(grid(fixtures[3]),{...defaults,stage:1});const easyFirst=await AI.choose(easy,{random:()=>0});const easyLast=await AI.choose(easy,{random:()=>.99999});assert.notEqual(easyFirst.from+':'+easyFirst.to,easyLast.from+':'+easyLast.to);await AI.choose(easy);assert.equal(randomCalls,0);checks.push('Early stages vary among top candidates using isolated AI randomness');

  let improved=0,deepened=0;const timings=[];
  for(const values of fixtures){const tactical=AI.snapshot(grid(values),{...defaults,stage:5});const advanced=AI.snapshot(grid(values),{...defaults,stage:20});const greedy=await AI.choose(tactical);const deep=await AI.choose(advanced);timings.push(deep.stats.elapsedMs);assert(deep.stats.depth===3&&deep.stats.nodes<=320);if(deep.responseScore!==undefined)deepened++;if(greedy.from!==deep.from||greedy.to!==deep.to)improved++;}
  assert(deepened>0);assert(improved>0);checks.push('Response/follow-up search changes decisions compared with greedy tactical scoring');
  for(const values of fixtures){const data=AI.snapshot(grid(values),defaults),limited=AI.legal(data.cells,data.state,'hero',{nodes:0,maxNodes:3});for(let i=1;i<limited.length;i++)assert(limited[i-1].score<=limited[i].score);}
  checks.push('Exhausted search budgets still rank player replies adversarially');
  const dead=AI.snapshot(grid(base()),defaults);assert.equal(AI.legal(dead.cells,dead.state).length,0);assert.equal(await AI.choose(dead),null);checks.push('Dead board returns null for the game to reshuffle');
  console.log(JSON.stringify({passed:checks.length,checks,advancedDecisionsChanged:improved,gameplayRandomCalls:randomCalls,maxSearchMs:Math.max(...timings),meanSearchMs:timings.reduce((a,b)=>a+b,0)/timings.length},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
