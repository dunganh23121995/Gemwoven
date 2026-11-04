// Special gem rules (src/board-specials.js; owner 05/11, Claude + Codex): shapes, blasts, combos, chains, once per gem.
const assert=require('node:assert/strict'),S=require('../../src/board-specials.js'),N=8,P=(r,c)=>r*N+c;
const row=(r,c0,n)=>Array.from({length:n},(_,i)=>P(r,c0+i)),col=(c,r0,n)=>Array.from({length:n},(_,i)=>P(r0+i,c));
// Shapes: straight 4 -> Sao băng on its axis, straight 5+ -> Lõi, L/T -> Bom, 3 -> nothing.
assert.deepEqual(S.shape(row(2,1,4),[row(2,1,4)]),{kind:'bolt',dir:'row'});
assert.deepEqual(S.shape(col(5,0,4),[col(5,0,4)]),{kind:'bolt',dir:'col'});
assert.equal(S.shape(row(2,1,5),[row(2,1,5)]).kind,'core');
assert.equal(S.shape(row(2,1,3),[row(2,1,3)]).kind,null);
const L=[...row(4,2,3),P(5,2),P(6,2)];assert.equal(S.shape(L,[row(4,2,3),col(2,4,3)]).kind,'bomb');
const T=[...row(4,2,5),P(5,4),P(6,4)];assert.equal(S.shape(T,[row(4,2,5),col(4,4,3)]).kind,'core','a straight 5 with a branch is still a Lõi');
// Where: the dragged gem first, else the one nearest the centre.
assert.equal(S.createAt(row(2,1,4),[P(2,3)],()=>true),P(2,3));
assert.equal(S.createAt(row(2,1,4),[],()=>true),P(2,2));
// Blasts (tuned: a 3-lane Sao band, a 5×5 Bom; 'line' mode kept for trials).
S.TUNE.boltMode='line';S.TUNE.bombRadius=1;S.TUNE.coreSize=0;
assert.deepEqual(S.blast('bolt',P(3,3),'row').sort((a,b)=>a-b),row(3,0,8));
assert.deepEqual(S.blast('bolt',P(3,3),'col').sort((a,b)=>a-b),col(3,0,8));
assert.equal(S.blast('bomb',P(3,3)).length,9);assert.equal(S.blast('bomb',P(0,0)).length,4,'3×3 is cut at the edge');
const types=Array.from({length:64},(_,p)=>(Math.floor(p/8)*2+p%8)%5),typeAt=p=>types[p];
assert.deepEqual(S.blast('core',P(0,0),null,typeAt,2).slice(1).every(p=>types[p]===2),true);
const none=()=>null;
assert.equal(S.combo({p:P(3,3),kind:'bolt',dir:'row'},{p:P(3,4),kind:'bolt',dir:'row'},P(3,4),typeAt,none).clear.length,15,'line mode: a cross');
// The shipped tuning.
S.TUNE.boltMode='wide';S.TUNE.bombRadius=2;S.TUNE.coreSize=6;
assert.equal(S.blast('bolt',P(3,3),'row').length,24,'a Sao sweeps 3 rows');assert.equal(S.blast('bolt',P(0,3),'row').length,16,'cut at the edge');
assert.equal(S.blast('bomb',P(3,3)).length,25,'a Bom clears 5×5');
assert.equal(S.shape([...row(4,2,4),P(5,3),P(6,3)],[row(4,2,4),col(3,4,3)]).kind,'core','a crossing cluster of 6 makes a Lõi');
assert.equal(S.combo({p:P(3,3),kind:'bolt',dir:'row'},{p:P(3,4),kind:'bolt',dir:'row'},P(3,4),typeAt,none).clear.length,64-25,'Sao+Sao: three rows and three columns');
assert.equal(S.combo({p:P(3,3),kind:'bolt',dir:'row'},{p:P(3,4),kind:'bomb'},P(3,4),typeAt,none).clear.length,64-9,'Sao+Bom: five rows and five columns');
assert.equal(S.combo({p:P(3,3),kind:'bomb'},{p:P(3,4),kind:'bomb'},P(3,4),typeAt,none).clear.length,49,'Bom+Bom: 7×7');
assert.equal(S.combo({p:P(3,3),kind:'core'},{p:P(3,4),kind:'core'},P(3,4),typeAt,none).full,true);
const cb=S.combo({p:P(3,3),kind:'core'},{p:P(3,4),kind:'bolt',dir:'col',type:1},P(3,4),typeAt,none);
assert.equal(cb.kind,'bolt');assert.equal(cb.dir,'col');assert.ok(cb.turn.length>=10&&cb.turn.every(p=>types[p]===1));
S.TUNE.boltMode='line';S.TUNE.bombRadius=1;
// Chains: each special fires once, a Bom set off by a Sao fires in the next generation.
const specials={[P(3,6)]:{kind:'bomb'},[P(3,1)]:{kind:'bolt',dir:'col'}};
const run=S.chain([{p:P(3,3),kind:'bolt',dir:'row'}],[P(3,3)],typeAt,p=>specials[p]||null);
assert.equal(run.fired.length,3);assert.deepEqual(run.fired.map(f=>f.gen),[0,1,1]);
assert.equal(new Set(run.fired.map(f=>f.p)).size,3,'each special fires once');
assert.ok(run.cleared.has(P(7,1))&&run.cleared.has(P(4,7)));
console.log('specials ok');
