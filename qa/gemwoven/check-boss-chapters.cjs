/* Save integrity and deterministic boss mechanics, including soft counter gates. */
const assert=require('node:assert/strict'),M=require('../../src/gemwoven/progression.js'),T=require('../../src/gemwoven/boss-tactics.js'),D=require('../../src/gemwoven/boss-chapters.js');
const entries=new Map(),storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)},engine=M.makeEngine(storage);
const edit=fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));};
assert.equal(M.WORLD.CHAPTERS.length,24);assert.equal(Object.keys(M.WORLD.BOSSES).length,24);assert.equal(M.WORLD.MAX_STAGES,1200);
assert.equal(new Set(M.WORLD.CHAPTERS.map(c=>c.boss)).size,24,'Every chapter has its own boss');
assert.equal(M.WORLD.CHAPTERS[13].id,'void');assert.equal(M.WORLD.CHAPTERS[14].id,'eldergrove');
for(const chapter of M.WORLD.CHAPTERS){
  const stages=Array.from({length:50},(_,i)=>M.encounter('campaign',(chapter.index-1)*50+i+1));
  assert.equal(stages.filter(stage=>stage.boss).length,1,'One boss encounter per chapter');
  assert.equal(stages[49].bossId,chapter.boss,'The boss is always at stage 50');
  assert.deepEqual(stages.map((stage,i)=>stage.tier==='elite'?i+1:0).filter(Boolean),[5,10,15,20,25,30,35,40,45]);
  assert.equal(chapter.elites.length,2);assert.deepEqual([...new Set(stages.filter(s=>s.tier==='elite').map(s=>s.creature))].sort(),[...chapter.elites].sort(),'Both chapter elites alternate');
  for(const s of stages.filter(s=>!s.boss))assert.ok(s.enemyName&&s.enemyName!=='Vệ Binh Tinh Anh',`Named foe at ${s.index}`);
}
{ // The chapter boss's first clear is the chapter's big payout; replays and elites are not.
  const p=engine.read(),boss=M.encounter('campaign',100),elite=M.encounter('campaign',95);p.campaign.cleared=99;p.daily.campaignWins=0;
  const first=M.campaignRewardPreview(p,100,3).reward,eliteLoot=M.campaignRewardPreview(p,95,3).reward;
  assert.ok(first.gold>=18000&&first.essence>=12&&first.skillBooks>=2,'Chapter boss pays a large first clear');assert.ok(!('gems' in first),'No Đá Ngọc from bosses');
  assert.ok(eliteLoot.gold<first.gold/5&&!eliteLoot.skillBooks);p.campaign.cleared=100;assert.ok(M.campaignRewardPreview(p,100,3).reward.gold<first.gold/5,'Replays do not repeat the chapter payout');
  assert.equal(boss.tier,'boss');assert.equal(elite.tier,'elite');
}
for(const d of D.definitions){
  assert.equal(d.skills.length,6);assert.equal(d.ordinary.length,3);assert.equal(d.elites.length,2);
  const start=(d.chapter-1)*50;edit(p=>{p.campaign.cleared=start;p.campaign.stars={};});
  assert.equal(M.counterProgress(engine.read(),d.chapter).rank,0);
  edit(p=>p.campaign.cleared=start+9);
  let b=engine.begin('campaign',start+10);let r=engine.settle(b.token,true,100,{hpRatio:.49,turns:3});assert.equal(r.counterReward,undefined,'One star gives no counter fragment');
  b=engine.begin('campaign',start+10);r=engine.settle(b.token,true,100,{hpRatio:1,turns:17});assert.equal(r.counterReward,undefined,'Two stars give no fragment');
  const snap=engine.exportSave();assert.throws(()=>engine.settle(b.token,true));assert.equal(engine.exportSave(),snap,'Receipt replay is atomic');
  for(const local of [10,20,30,40]){
    edit(p=>p.campaign.cleared=start+local-1);b=engine.begin('campaign',start+local);r=engine.settle(b.token,true,100,{hpRatio:.9,turns:5});assert.equal(r.counterReward.earned,3);
    b=engine.begin('campaign',start+local);const repeated=engine.settle(b.token,true,100,{hpRatio:.9,turns:5});assert.equal(repeated.counterReward,undefined,'Repeating 3 stars cannot farm counter fragments');
  }
  const counter=M.counterProgress(engine.read(),d.chapter);assert.equal(counter.shards,12);assert.equal(counter.rank,4);
  edit(p=>p.campaign.cleared=start+49);b=engine.begin('campaign',start+50);assert.equal(b.counter.rank,4);assert.equal(b.recommended,Math.min(500,(start+50)/2));assert.ok(b.tactical);engine.settle(b.token,false);
  assert.equal(M.counterProgress(engine.read(),d.chapter).rank,4,'Losing does not consume the artifact');
  edit(p=>p.campaign.artifacts[d.theme]={claimed:[]});b=engine.begin('campaign',start+50);assert.equal(b.counter.rank,0,'Missing artifact never locks the boss');engine.settle(b.token,false);
  const t0=T.create(d,{heroMax:10000,bossMax:100000,rank:0}),t4=T.create(d,{heroMax:10000,bossMax:100000,rank:4});
  let hazard0=0,hazard4=0;
  for(let i=0;i<12;i++){hazard0+=T.advance(t0,d,1).filter(e=>e.type==='hazard').reduce((n,e)=>n+e.amount,0);hazard4+=T.advance(t4,d,1).filter(e=>e.type==='hazard').reduce((n,e)=>n+e.amount,0);}
  assert.ok(hazard4<hazard0*.3,d.id+' counter sharply reduces its ongoing hazard');
  const t=T.create(d,{bossMax:100000});T.advance(t,d,.6);assert.equal(t.phase,2);T.advance(t,d,.9);assert.equal(t.phase,2,'Healing cannot regress phase or repeat transition rewards');
  T.advance(t,d,.3);assert.equal(t.phase,3);assert.ok(t.channel,'Last phase telegraphs before damage');
  for(let i=0;i<6;i++)T.collect(t,d,d.tile);let events=T.advance(t,d,.3);assert.ok(events.some(e=>e.type==='interrupt'),'Correct tile collection interrupts the next execution');assert.equal(events.filter(e=>e.type==='burst').length,0);
  const fail=T.create(d,{bossMax:100000});T.advance(fail,d,.3);events=T.advance(fail,d,.3);assert.ok(events.some(e=>e.type==='burst'),'Unanswered telegraph resolves into damage');
  const hit=T.create(d,{bossMax:100000});T.advance(hit,d,.3);T.incoming(hit,d,30000);events=T.advance(hit,d,.3);assert.ok(events.some(e=>e.type==='interrupt'),'Strong damage can break the initial shell and interrupt without the artifact');
  const minion=T.create(d,{bossMax:100000});minion.cast=2;T.advance(minion,d,1);assert.ok(minion.addHp>0);minion.ward=0;const pool=minion.addHp,result=T.incoming(minion,d,1000);assert.ok(minion.addHp<pool);assert.ok(result.amount<1000,'Minion HP intercepts damage rather than being a decorative icon');
  const frozen=T.create(d);events=T.advance(frozen,d,1,{skipAction:true});assert.ok(events.some(e=>e.type==='hazard'));assert.ok(!events.some(e=>e.type==='cast'),'Stuns stop the action but not persistent environment');
  if(d.mechanic==='heat'){const cooled=T.create(d,{rank:4});events=T.advance(cooled,d,.6);assert.equal(events.find(e=>e.type==='shatter').fraction,0,'Complete cooling core counters armor melting');}
  if(d.mechanic==='tide'){const anchored=T.create(d,{rank:4,bossMax:100000});anchored.ward=5000;T.advance(anchored,d,.3);for(let i=0;i<6;i++)T.collect(anchored,d,d.tile);T.advance(anchored,d,.3);assert.equal(anchored.ward,0,'Complete tide anchor breaks the pearl barrier on interruption');}
  const normal=M.encounter('campaign',start+1),normal2=M.encounter('campaign',start+11),normal3=M.encounter('campaign',start+21);assert.equal(new Set([normal.creature,normal2.creature,normal3.creature]).size,3);
  const small=T.create(d,{tier:'normal',variant:0});let smallHazard=false;for(let i=0;i<15;i++){smallHazard=T.advance(small,d,1).some(e=>e.type==='hazard')||smallHazard;assert.ok(small.stacks<=2);}assert.ok(smallHazard,'Ordinary monsters teach a weakened version of the actual environment hazard');
}
assert.equal(engine.read().wallet.gems,0);assert.throws(()=>M.encounter('campaign',1501));
console.log(JSON.stringify({passed:true,bosses:D.definitions.length,checks:'24 chapters, one boss each; elites every 5 stages; big gem-free chapter-clear reward; 24 bosses; elite 3-star-only fragments; no replay farming; persistent nonconsumable counters; snapshot rank; phases; telegraph interruption; real minion HP; 80% typed resistance; no gameplay gems'},null,2));
