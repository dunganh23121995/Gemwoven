/* Economy invariants, transaction boundaries, progression, and reward receipts. */
const assert=require('node:assert/strict');
const M=require('../../src/gemwoven/progression.js');
let clock=Date.UTC(2026,9,18,6),roll=.7;
function fixture(){const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const engine=M.makeEngine(storage,{now:()=>clock,random:()=>roll});const edit=fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));};return {engine,storage,edit};}
const f=fixture(),e=f.engine;
for(const [index,best,cleared,seals]of [[1,0,0,0],[1,1,1,1598],[50,0,49,0],[1010,0,1009,0],[1010,2,1010,0],[1010,3,1010,0]])for(const stars of [1,2,3]){
  const sample=fixture();sample.edit(p=>{p.campaign.cleared=cleared;p.campaign.stars[index]=best;p.daily.seals=seals;if(best===3&&index===1010)p.campaign.artifacts.eldergrove={claimed:[10]};});
  const before=sample.engine.read(),quote=M.campaignRewardPreview(before,index,stars),b=sample.engine.begin('campaign',index);
  const actual=sample.engine.settle(b.token,true,100,{hpRatio:stars===1?.4:.9,turns:stars===3?1:b.turnLimit+1});
  for(const [key,value]of Object.entries(quote.reward))assert.equal(actual[key],value,'Preview matches settlement: '+key);
  assert.equal(actual.counterReward?.earned||0,quote.counterReward?.count||0);
  assert.equal(sample.engine.read().campaign.stars[index]-best,quote.addedStars);
  if(quote.heroFragments)assert.equal((sample.engine.read().fragments[quote.heroFragments.hero]||0)-(before.fragments[quote.heroFragments.hero]||0),quote.heroFragments.count);
  assert.equal(quote.reward.gems,undefined);
}
assert.deepEqual(Object.keys(e.read().heroes),['novice']);assert.equal(e.read().wallet.gems,0);
const reload=M.makeEngine(f.storage,{now:()=>clock,random:()=>roll});assert.equal(reload.read().heroes.novice.copies,1);
e.claimDaily('login');assert.equal(e.read().wallet.tickets,1);assert.throws(()=>e.claimDaily('login'));
const before=e.exportSave();assert.throws(()=>e.summon(10));assert.equal(e.exportSave(),before,'Failed spending must be atomic');
assert.throws(()=>e.summon(1,'gold'));assert.throws(()=>e.buy('gems'));assert.throws(()=>e.buy('tickets'));
assert.throws(()=>e.begin('campaign',2));assert.throws(()=>e.begin('boss',2));
let b=e.begin('campaign',1),reward=e.settle(b.token,true,100);assert.equal(e.read().campaign.cleared,1);assert.equal(reward.gems,undefined);assert.throws(()=>e.settle(b.token,true,100));
b=e.begin('campaign',2);e.settle(b.token,false,20);assert.equal(e.read().campaign.cleared,1);
b=e.begin('campaign',1);const replay=e.settle(b.token,true,100);assert.ok(replay.gold<reward.gold);
clock+=24*3600000;const off=e.offline();assert.equal(off.hours,12);const offReward=e.claimOffline();assert.equal(offReward.gems,undefined);assert.throws(()=>e.claimOffline());assert.equal(e.read().wallet.gems,0);
const old=clock;clock-=1000;assert.equal(e.offline().hours,0);clock=old;
e.claimDaily('login');assert.equal(e.read().wallet.tickets,2);
f.edit(p=>{p.wallet.gold=1e10;p.materials={...p.materials,exp:1e7,seals:1e7,essence:1e7,ore:1e7,wood:1e7,cloth:1e7,skillBooks:1e7,divineOre:100};p.heroes.novice.level=499;});
e.levelUp('novice');assert.equal(e.read().heroes.novice.level,500);assert.throws(()=>e.levelUp('novice'));assert.equal(e.read().wallet.tickets,3);
f.edit(p=>{p.heroes.novice.copies=20;});for(let i=0;i<5;i++)e.starUp('novice');assert.equal(e.read().heroes.novice.stars,6);assert.equal(e.read().heroes.novice.copies,1);assert.throws(()=>e.starUp('novice'));
for(let i=0;i<6;i++)e.evolve('novice');assert.equal(e.read().heroes.novice.evolution,6);assert.throws(()=>e.evolve('novice'));
e.train('novice',2);assert.equal(e.read().heroes.novice.skills[2],1);assert.ok(e.stats('novice').mutation);
f.edit(p=>{p.fragments.fire=80;});e.fuse('fire');assert.equal(e.read().fragments.fire,0);assert.equal(e.read().heroes.fire.copies,1);assert.throws(()=>e.fuse('fire'));
assert.throws(()=>e.train('fire',2));
f.edit(p=>{p.campaign.cleared=300;});const g=e.craft('weapon','divine');assert.ok(g.affix);e.equip('novice',g.id);assert.equal(e.stats('novice').affixes.length,1);assert.deepEqual(e.stats('novice',true).affixes,[]);assert.throws(()=>e.salvage(g.id));e.strengthen(g.id);e.unequip('novice','weapon');e.salvage(g.id);
const lower=fixture();lower.edit(p=>{p.wallet.gold=100000;p.materials.exp=100;p.materials.seals=0;});const snap=lower.engine.exportSave();assert.throws(()=>lower.engine.levelUp('novice'));assert.equal(lower.engine.exportSave(),snap);
const sum=M.SUMMON_TABLE.reduce((s,[,n])=>s+n,0);assert.equal(sum,1e6);
let sealTotal=0;for(let i=1;i<500;i++)sealTotal+=M.levelCost(i).seals;assert.equal(sealTotal,589804);assert.equal(Math.ceil(sealTotal/1600),369);
const capped=fixture();capped.edit(p=>{p.daily.seals=1599;});const token=capped.engine.begin('campaign',1).token;assert.equal(capped.engine.settle(token,true).seals,1);assert.equal(capped.engine.read().daily.seals,1600);
const s=fixture();s.edit(p=>{p.wallet.tickets=100;p.summon.dry=299;});roll=.9;const pity=s.engine.summon(1);assert.equal(pity[0].kind,'hero');assert.notEqual(pity[0].hero,'novice');assert.equal(s.engine.read().summon.dry,0);
s.edit(p=>{p.summon.fragmentDry=29;});const fragment=s.engine.summon(1);assert.equal(fragment[0].kind,'fragments');assert.ok(fragment[0].count>=2&&fragment[0].count<=5);
roll=.999;const trash=s.engine.summon(1);assert.equal(trash[0].kind,'material');assert.equal(s.engine.read().wallet.gems,0);
roll=.025;const starter=s.engine.summon(1);assert.equal(starter[0].hero,'novice');
const configured=e.saveEvent({...M.EVENT_TEMPLATE,id:'harvest',enabled:true,title:'Lễ hội <img onerror=alert(1)>'});assert.equal(configured.status,'coming-soon');assert.equal(e.read().events.length,1);assert.throws(()=>e.saveEvent({...M.EVENT_TEMPLATE,id:'bad',status:'live'}));assert.throws(()=>e.saveEvent({...M.EVENT_TEMPLATE,id:'bad',startsAt:'2027-02-02',endsAt:'2027-01-01'}));
const boss=fixture();let firstBoss,lastBoss;
for(let i=1;i<=25;i++){const b=boss.engine.begin('boss',1);const r=boss.engine.settle(b.token,true,200);if(i===1)firstBoss=r;if(i===25)lastBoss=r;}
assert.equal(firstBoss.gold,1330);assert.equal(lastBoss.gold,332);assert.equal(lastBoss.seals,0);assert.ok(boss.engine.read().daily.seals<=1600);assert.equal(boss.engine.read().boss.best,1);
const duel=boss.engine.begin('duel',1);assert.equal(duel.stats.hp,290);assert.deepEqual(duel.stats.affixes,[]);const beforeDuel=boss.engine.read().wallet.gold;boss.engine.settle(duel.token,true,290);assert.equal(boss.engine.read().wallet.gold,beforeDuel);
const journey=fixture(),j=journey.engine;
assert.equal(M.encounter('campaign',1).tier,'normal');assert.equal(M.encounter('campaign',10).tier,'elite');assert.equal(M.encounter('campaign',20).tier,'elite');assert.equal(M.encounter('campaign',50).tier,'boss');assert.equal(M.encounter('campaign',50).skills.length,3);
assert.equal(M.stageStars(M.encounter('campaign',1),true,{hpRatio:.8,turns:12}),3);assert.equal(M.stageStars(M.encounter('campaign',1),true,{hpRatio:.8,turns:13}),2);assert.equal(M.stageStars(M.encounter('campaign',1),true,{hpRatio:.49,turns:3}),1);assert.equal(M.stageStars(M.encounter('campaign',1),false,{hpRatio:1,turns:1}),0);
assert.throws(()=>j.claimChapter(1,10));
for(let i=1;i<=50;i++){const b=j.begin('campaign',i);j.settle(b.token,true,100,{hpRatio:.8,turns:3});}
assert.equal(M.chapterProgress(j.read(),1).total,150);let again=j.begin('campaign',1);j.settle(again.token,true,100,{hpRatio:.1,turns:30});assert.equal(j.read().campaign.stars[1],3,'A worse replay cannot remove stars');
for(const n of [50,100,150]){const reward=j.claimChapter(1,n);assert.ok(reward.gold>=2000);assert.equal(reward.gems,undefined);assert.throws(()=>j.claimChapter(1,n));}assert.throws(()=>j.claimChapter(2,10));
journey.edit(p=>{delete p.campaign.stars;delete p.campaign.claimedStars;p.campaign.cleared=3;});assert.deepEqual(j.read().campaign.stars,{'1':1,'2':1,'3':1},'Old clears migrate without free three-star awards');
const legacyBattle=j.begin('campaign',4);journey.edit(p=>{for(const key of ['tier','skills','creature','enemyName','turnLimit'])delete p.pending[key];});const migratedBattle=j.pending();assert.equal(migratedBattle.token,legacyBattle.token);assert.equal(migratedBattle.stats.hp,legacyBattle.stats.hp);assert.ok(migratedBattle.skills.length);j.settle(migratedBattle.token,false);
journey.edit(p=>{p.wallet.tickets=10;p.wallet.gems=1200;});assert.equal(j.summonQuote(10).payment,'tickets');journey.edit(p=>p.wallet.tickets=9);assert.equal(j.summonQuote(10).payment,'gems');assert.equal(j.summonQuote(10).cost,1200);journey.edit(p=>p.wallet.gems=1199);assert.equal(j.summonQuote(10).enough,false);
const banner=fixture();banner.edit(p=>p.wallet.tickets=10);roll=0;assert.equal(banner.engine.summon(1)[0].hero,M.SUMMON_BANNER.hero);roll=.005;assert.equal(banner.engine.summon(1)[0].hero,M.SUMMON_BANNER.hero);
// Six shared slots, transfer replaces the old owner, and relic evolution is capped.
const gearTest=fixture();gearTest.edit(p=>{p.campaign.cleared=1000;p.wallet.gold=1e12;p.wallet.gems=100000;p.materials={...p.materials,ore:100000,wood:100000,cloth:100000,essence:100000,divineOre:100000};p.heroes.fire=JSON.parse(JSON.stringify(p.heroes.novice));p.heroes.novice.level=500;});
const ge=gearTest.engine;assert.equal(Object.keys(M.SLOTS).length,6);const basePower=ge.stats('novice').power;
for(const slot of Object.keys(M.SLOTS)){const g=ge.craft(slot,'legendary');ge.equip('novice',g.id);assert.equal(ge.read().heroes.novice.gear[slot],g.id);ge.equip('fire',g.id);assert.equal(ge.read().heroes.novice.gear[slot],undefined);assert.equal(ge.read().heroes.fire.gear[slot],g.id);ge.equip('novice',g.id);}
assert.ok(ge.stats('novice').power>basePower);const basicRelic=ge.read().heroes.novice.relic;assert.equal(basicRelic.evolution,1);assert.throws(()=>ge.evolveRelic('novice'));
for(let form=1;form<=5;form++){while(ge.read().heroes.novice.relic.level<form*20)ge.trainRelic('novice');assert.throws(()=>ge.trainRelic('novice'));if(form<5)ge.evolveRelic('novice');}
assert.equal(ge.read().heroes.novice.relic.evolution,5);assert.equal(ge.read().heroes.novice.relic.level,100);assert.throws(()=>ge.evolveRelic('novice'));assert.equal(ge.read().heroes.fire.relic.evolution,1,'Relics do not transfer between heroes');
gearTest.edit(p=>delete p.heroes.fire.relic);assert.equal(ge.read().heroes.fire.relic.evolution,1,'Legacy heroes receive their own basic relic without losing equipment');
for(const product of M.WORLD.SHOP){assert.ok(['resource','gear'].includes(product.kind));assert.equal(product.currency,product.rarity==='common'||product.rarity==='uncommon'?'gold':'gems');}
const beforeGems=ge.read().wallet.gems;const purchase=ge.purchase('divine-glasses');assert.equal(purchase.gear.slot,'glasses');assert.equal(ge.read().wallet.gems,beforeGems-5200);assert.throws(()=>ge.purchase('fire'));const failed=ge.exportSave();assert.throws(()=>ge.purchase('divine-glasses',2));assert.equal(ge.exportSave(),failed);
assert.equal(M.WORLD.CHAPTERS.length,30);assert.equal(Object.keys(M.WORLD.BOSSES).length,24);for(let chapter=1;chapter<=20;chapter++){assert.equal(M.encounter('campaign',chapter*50).tier,'boss');assert.equal(M.encounter('campaign',chapter*50).chapter,chapter);assert.equal(M.encounter('campaign',chapter*50-10).tier,'elite');}
console.log(JSON.stringify({passed:true,sealTotal,minDaysTo500:369,checks:'Starter persistence, premium isolation, atomic spending, stage gates, battle receipts, daily reset, offline caps, level/star/evolution limits, skills, equipment, summon rates/pity, and event validation'},null,2));
