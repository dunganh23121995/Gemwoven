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
{ // Local preview test balance: opt-in only, granted once, never through the reward pipeline.
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},opts={previewTickets:true,previewGems:true,now:()=>clock,random:()=>roll};
  const preview=M.makeEngine(storage,opts);assert.equal(preview.read().wallet.gems,120000);assert.equal(preview.read().wallet.tickets,1000);
  const again=M.makeEngine(storage,opts);assert.equal(again.read().wallet.gems,120000,'Preview gems are granted once');assert.equal(again.read().wallet.tickets,1000);
}
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
roll=.025;const starter=s.engine.summon(1);assert.notEqual(starter[0].hero,'novice','Hiro is not in the summon pool');assert.ok(!M.SUMMON_TABLE.some(([k])=>k==='novice'));
const configured=e.saveEvent({...M.EVENT_TEMPLATE,id:'harvest',enabled:true,title:'Lễ hội <img onerror=alert(1)>'});assert.equal(configured.status,'coming-soon');assert.equal(e.read().events.length,1);assert.throws(()=>e.saveEvent({...M.EVENT_TEMPLATE,id:'bad',status:'live'}));assert.throws(()=>e.saveEvent({...M.EVENT_TEMPLATE,id:'bad',startsAt:'2027-02-02',endsAt:'2027-01-01'}));
const boss=fixture();let firstBoss,lastBoss;
for(let i=1;i<=25;i++){const b=boss.engine.begin('boss',1);const r=boss.engine.settle(b.token,true,200);if(i===1)firstBoss=r;if(i===25)lastBoss=r;}
assert.equal(firstBoss.gold,1330);assert.equal(lastBoss.gold,332);assert.equal(lastBoss.seals,0);assert.ok(boss.engine.read().daily.seals<=1600);assert.equal(boss.engine.read().boss.best,1);
const duel=boss.engine.begin('duel',1);assert.equal(duel.stats.hp,290);assert.deepEqual(duel.stats.affixes,[]);const beforeDuel=boss.engine.read().wallet.gold;boss.engine.settle(duel.token,true,290);assert.equal(boss.engine.read().wallet.gold,beforeDuel);
const journey=fixture(),j=journey.engine;
assert.equal(M.encounter('campaign',1).tier,'normal');assert.equal(M.encounter('campaign',10).tier,'elite');assert.equal(M.encounter('campaign',20).tier,'elite');assert.equal(M.encounter('campaign',50).tier,'boss');assert.equal(M.encounter('campaign',50).skills.length,4);assert.ok(M.encounter('campaign',50).skillSet[3].ult,'Every boss has a signature ultimate');
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
assert.equal(M.WORLD.CHAPTERS.length,24);assert.equal(Object.keys(M.WORLD.BOSSES).length,24);for(let chapter=1;chapter<=24;chapter++){assert.equal(M.encounter('campaign',chapter*50).tier,'boss');assert.equal(M.encounter('campaign',chapter*50).chapter,chapter);assert.equal(M.encounter('campaign',chapter*50-10).tier,'elite');}
{ // Skill kits: every hero, every rank path to max; texts are generated from the same numbers.
  const finite=(v,where)=>{if(typeof v==='number')assert.ok(Number.isFinite(v),where);else if(v&&typeof v==='object')for(const [k,x]of Object.entries(v))finite(x,where+'.'+k);else assert.notEqual(v,undefined,where);};
  for(const key of Object.keys(M.HEROES)){
    for(const [stars,evolution] of [[1,0],[2,2],[4,4],[6,6]]){
      let lastDamage=0,lastHeal=0;
      for(let r=1;r<=M.SKILL_MAX;r++){
        const h={level:500,stars,evolution,skills:[r,r,r,r]},kit=M.skillKit(key,h);finite(kit,`${key}:${stars}:${r}`);
        assert.ok(kit.damage>=lastDamage&&(kit.heal||0)>=lastHeal,'Active power never drops with rank');lastDamage=kit.damage;lastHeal=kit.heal||0;
        for(let slot=0;slot<4;slot++){
          const t=M.skillText(key,h,slot);for(const field of ['name','description','next','gate'])assert.equal(typeof t[field],'string');assert.ok(!/undefined|NaN/.test(t.description+t.next),`${key} slot ${slot}: ${t.description} | ${t.next}`);
          if(!t.unlocked)assert.equal(t.next,M.skillGateText(slot));
          else if(r<M.SKILL_MAX){assert.ok(t.next.includes('→'),`${key} slot ${slot} rank ${r} changes something: ${t.next}`);
            const nextKit=M.skillKit(key,{...h,skills:h.skills.map((x,i)=>i===slot?r+1:x)});const after=M.skillValues(nextKit,slot).map(([,v])=>v);for(const [i,v]of after.entries())if(t.values[i]?.[1]!==v&&!t.next.includes(t.values[i][1]+' → '+v))assert.fail(`${key} slot ${slot} next text "${t.next}" must show ${v}`);}
          else assert.equal(t.next,'Đã đạt cấp tối đa.');
          for(const [,v]of t.values)assert.ok(t.description.includes(v.replace(/^[+×]/,'')),`${key} slot ${slot} description shows ${v}: ${t.description}`);
        }
      }
    }
    // Innate traits hold at rank 0, ranks add on top.
    const base=M.skillKit(key,{level:1,stars:1,evolution:0,skills:[1,0,0,0]});
    assert.equal(base.sword,key==='fire'?1.6:1);assert.equal(base.damageReduction,key==='ice'?.2:0);assert.equal(base.attackScale,key==='earth'?.75:1);assert.equal(base.energy,key==='lightning'?2:1);
    assert.equal(base.mutation,false);assert.equal(base.awakened,false);assert.equal(base.power,1);
  }
  // Published table (rank 1/5/10, base form, no evolution).
  const at=(key,r,slot)=>M.skillKit(key,{level:500,stars:1,evolution:0,skills:[0,1,2,3].map(i=>i===slot?r:1)});
  assert.deepEqual([1,5,10].map(r=>at('novice',r,0).damage),[45,59,77]);assert.deepEqual([1,5,10].map(r=>at('fire',r,0).damage),[135,178,232]);
  assert.deepEqual([1,5,10].map(r=>at('ice',r,0).armor),[25,37,52]);assert.deepEqual([1,5,10].map(r=>at('earth',r,0).heal),[40,60,85]);assert.deepEqual([1,5,10].map(r=>at('earth',r,0).burst),[3,3.4,3.9]);
  assert.deepEqual([1,5,10].map(r=>at('fire',r,2).burn.turns),[2,3,4]);assert.deepEqual([1,5,10].map(r=>at('ice',r,2).mutationArmor),[.06,.08,.105]);assert.deepEqual([1,5,10].map(r=>at('earth',r,2).mutationArmor),[.04,.06,.085]);
  assert.deepEqual([1,5,10].map(r=>at('lightning',r,2).drain),[21,25,30]);assert.deepEqual([1,5,10].map(r=>at('shadow',r,2).echo),[15,27,42]);assert.deepEqual([1,5,10].map(r=>at('novice',r,2).regen),[.01,.014,.019]);
  assert.deepEqual([1,5,10].map(r=>at('fire',r,3).awaken),[{attack:.13,hp:.1},{attack:.17,hp:.12},{attack:.22,hp:.145}]);
  // Forms and evolution perks.
  for(const forms of Object.values(M.HERO_FORMS)){assert.deepEqual(forms.map(f=>f.power),[1,1.1,1.25]);assert.equal(new Set(forms.map(f=>f.skill)).size,3,'Each form has its own skill name');assert.ok(forms[2].signature);}
  const f3=key=>M.skillKit(key,{level:500,stars:6,evolution:0,skills:[1,1,0,0]});
  assert.equal(f3('fire').burn.turns,3);assert.equal(f3('ice').armor,40);assert.equal(f3('ice').enemyDrain,25);assert.equal(f3('earth').burst,3.5);assert.equal(f3('earth').regenTurns,4);assert.equal(f3('lightning').hits,9);assert.deepEqual(f3('shadow').execute,{threshold:.3,bonus:1.5});
  assert.equal(M.skillKit('fire',{level:500,stars:4,evolution:0,skills:[1,1,0,0]}).power,1.1);
  assert.deepEqual([0,1,2,3,4,5,6].map(e=>M.evolutionBonus(e).startEnergy),[0,0,0,20,20,20,40]);assert.deepEqual([0,1,5,6].map(e=>M.evolutionBonus(e).power),[1,1.05,1.05,1.15]);
  assert.equal(M.skillKit('ice',{level:500,stars:4,evolution:4,skills:[1,1,3,0]}).levels[2],4,'Evolution 4 adds one Biến Dị rank');assert.equal(M.skillKit('ice',{level:500,stars:4,evolution:4,skills:[1,1,0,0]}).mutation,false,'The bonus never unlocks Biến Dị by itself');
  assert.ok(M.EVOLUTION.every(e=>typeof e.perk==='string'&&e.perk));
  // Gates are one table for rules and text.
  assert.deepEqual(M.SKILL_GATES.map(g=>g.level),[1,10,100,400]);
  for(const [h,expected]of [[{level:9,evolution:6},[true,false,false,false]],[{level:10,evolution:0},[true,true,false,false]],[{level:100,evolution:1},[true,true,false,false]],[{level:100,evolution:2},[true,true,true,false]],[{level:400,evolution:4},[true,true,true,false]],[{level:400,evolution:5},[true,true,true,true]]])assert.deepEqual([0,1,2,3].map(i=>M.skillUnlock(h,i)),expected);
  assert.equal(M.skillGateText(2),'Mở ở cấp 100 · tiến hóa 2.');assert.equal(M.skillText('fire',{level:1,stars:1,evolution:0,skills:[1,0,0,0]},1).next,'Mở ở cấp 10.');
  assert.equal(M.skillText('fire',null,0).next,'Cần sở hữu tướng.');
  // Practice is normalized: rank-1 active, innate traits only, no gear, no Biến Dị/Chân Thân/forms.
  const strong={heroes:{fire:{level:500,stars:6,evolution:6,copies:1,skills:[10,10,10,10],gear:{},relic:{level:100,evolution:5}}},equipment:[]},practice=M.stats(strong,'fire',true);
  assert.equal(practice.kit.power,1);assert.equal(practice.kit.mutation,false);assert.equal(practice.kit.awakened,false);assert.equal(practice.kit.burn,undefined);assert.equal(practice.kit.startEnergy,0);assert.equal(practice.kit.sword,1.6);
  assert.equal(practice.hp,340);assert.equal(practice.attack,1.8);assert.equal(practice.defense,0);assert.deepEqual(practice.skills,[1,0,0,0]);assert.ok(!practice.mutation&&!practice.awakened&&practice.active===1);
  const full=M.stats(strong,'fire');assert.equal(full.kit.power,Number((1.72*1.25*1.15).toFixed(4)));assert.ok(full.attack>practice.attack);
  // Upgrade previews and max states.
  assert.equal(M.upgradePreview(strong,'fire','level'),null);assert.equal(M.upgradePreview(strong,'fire','stars'),null);assert.equal(M.upgradePreview(strong,'fire','evolution'),null);
  const mid={heroes:{fire:{level:100,stars:3,evolution:3,copies:1,skills:[1,1,1,0],gear:{},relic:{level:1,evolution:1}}},equipment:[]};
  const starStep=M.upgradePreview(mid,'fire','stars');assert.ok(starStep.after.hp>starStep.before.hp&&starStep.after.attack>starStep.before.attack);assert.match(starStep.unlock,/^4 sao: Hồ Diễm Kiếm Vệ/);
  assert.equal(M.upgradePreview(mid,'fire','evolution').unlock,'Tiến hóa 4: '+M.EVOLUTION[3].perk);assert.equal(M.upgradePreview(mid,'fire','level',10).after.hp,M.stats({...mid,heroes:{fire:{...mid.heroes.fire,level:110}}},'fire').hp);
  assert.equal(mid.heroes.fire.level,100,'Previews never mutate the save');
  const ten=M.levelCostRange(100,10);assert.equal(ten.levels,10);for(const id of ['gold','exp','seals'])assert.equal(ten.cost[id],Array.from({length:10},(_,i)=>M.levelCost(100+i)[id]).reduce((a,b)=>a+b,0));assert.equal(M.levelCostRange(495,10).levels,5);assert.equal(M.levelCostRange(500,1),null);
  // Shared costs keep their audited values.
  assert.deepEqual(M.craftCost('rare'),{gold:32000,ore:50,wood:30,cloth:30,essence:20});assert.equal(M.craftCost('divine').divineOre,50);assert.deepEqual(['uncommon','legendary','divine'].map(M.craftGate),[20,80,300]);
  assert.deepEqual(M.strengthenCost({level:4}),{gold:4500,ore:10});assert.throws(()=>M.strengthenCost({level:20}));assert.ok(Math.abs(M.relicBonus({level:21,evolution:2})-.075)<1e-9);
  assert.deepEqual(Object.keys(M.HEROES).filter(M.heroAvailable),['novice',M.SUMMON_BANNER.hero]);
}
{ // Economy guards: clock rollback, offline banking, replay/boss diminishing, quest display, premium isolation.
  const HOUR=3600000,DAY=24*HOUR;
  const fx=start=>{let t=start;const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const engine=M.makeEngine(storage,{now:()=>t,random:()=>.5});
    return {engine,storage,at:v=>{t=v;},get now(){return t;},edit:fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));}};};
  const t0=Date.UTC(2026,9,18,3);
  // Clock rollback never re-opens daily resets, the Ấn cap, or idle income.
  const c=fx(t0),ce=c.engine;ce.claimDaily('login');c.at(t0+DAY);ce.claimDaily('login');assert.equal(ce.read().wallet.tickets,2);
  c.edit(p=>{p.daily.seals=1500;});c.at(t0+HOUR);
  assert.equal(ce.read().clock.behind,true);assert.equal(ce.read().clock.max,t0+DAY);assert.equal(ce.read().daily.date,'2026-10-19');assert.equal(ce.read().daily.seals,1500,'Rollback keeps the Ấn cap');
  assert.throws(()=>ce.claimDaily('login'));assert.throws(()=>ce.claimOffline(),'No idle claims while the clock is behind');assert.equal(ce.offline().gold,0);assert.equal(ce.offline().behind,true);
  c.at(t0+DAY+HOUR);assert.equal(ce.read().clock.behind,false);assert.throws(()=>ce.claimDaily('login'),'Same day after returning: no second reset');assert.equal(ce.claimOffline().seals,100,'Idle claims resume; the Ấn cap from the forward day still holds');
  c.at(t0+2*DAY);ce.claimDaily('login');assert.equal(ce.read().wallet.tickets,3,'Next real day resets normally');
  c.at(t0+2*DAY-5*60000);assert.equal(ce.read().clock.behind,false,'Small drift inside tolerance is not flagged');
  const legacy=fx(t0);legacy.edit(p=>{delete p.clock;p.updated=t0+DAY;});legacy.at(t0+HOUR);assert.equal(legacy.engine.read().clock.max,t0+DAY,'Legacy saves start the guard at their last save time');assert.equal(legacy.engine.read().clock.behind,true);
  // Offline: 80 + 8×level + 10×stages per hour; pending hours are banked at the old rate.
  const o=fx(t0),oe=o.engine;o.at(t0+6*HOUR);const early=oe.offline();assert.equal(early.goldPerHour,88);assert.equal(early.gold,528);assert.equal(early.capHours,12);
  o.edit(p=>{p.wallet.gold=1e9;p.materials.exp=1e6;p.materials.seals=1e6;});oe.levelUp('novice',10);for(let i=1;i<=50;i++){const b=oe.begin('campaign',i);oe.settle(b.token,true,1,{hpRatio:.9,turns:3});}
  const banked=oe.offline();assert.equal(banked.gold,528,'Level-ups and first clears never re-price hours already passed');assert.equal(banked.goldPerHour,80+11*8+50*10);assert.equal(M.offlineRate(oe.read()).gold,banked.goldPerHour);
  o.at(t0+7*HOUR);assert.equal(oe.offline().gold,528+banked.goldPerHour);
  o.at(t0+40*HOUR);assert.equal(oe.offline().hours,12,'Banked + current hours share the 12 h cap');assert.equal(oe.offline().gold,528+6*banked.goldPerHour);
  assert.equal(oe.claimOffline().gold,528+6*banked.goldPerHour);assert.equal(oe.read().offlineBank,null);assert.throws(()=>oe.claimOffline());
  o.edit(p=>{p.vip.level=3;});o.at(t0+60*HOUR);assert.equal(oe.offline().capHours,M.VIP[3].offlineHours,'VIP offline hours are wired (VIP needs payment, so 0 today)');assert.equal(oe.offline().hours,13);
  // Campaign replays: 50% base gold/EXP, then 15% and 1 quặng after 20 wins today; first clears stay full.
  const r=fx(t0),re=r.engine;r.edit(p=>{p.campaign.cleared=100;});const replay=[];
  for(let i=0;i<22;i++){const quote=M.campaignRewardPreview(re.read(),100,3),b=re.begin('campaign',100),got=re.settle(b.token,true,1,{hpRatio:.9,turns:3});for(const [k,v]of Object.entries(quote.reward))assert.equal(got[k],v,'Replay preview matches settlement: '+k);replay.push(got);}
  assert.deepEqual([replay[0].gold,replay[0].exp,replay[0].essence,replay[0].ore],[1400,20,1,5],'Chapter-boss replay: half gold/EXP, 1 Tinh hoa');
  assert.deepEqual([replay[20].gold,replay[20].exp,replay[20].essence,replay[20].ore],[420,6,0,1],'21st win of the day: 15%');assert.equal(re.read().daily.campaignWins,22);
  const firstLate=re.settle(re.begin('campaign',101).token,true,1,{hpRatio:.9,turns:3});assert.equal(firstLate.gold,300+101*25+500,'First clears are never diminished');assert.equal(firstLate.seals,80);
  r.at(t0+DAY);assert.equal(re.read().daily.campaignWins,0);assert.equal(re.settle(re.begin('campaign',100).token,true,1).gold,1400,'Replay value returns with the daily reset');
  // Chapter boss first clear reports Mika's fragments with the other resources.
  const cb=fx(t0);cb.edit(p=>{p.campaign.cleared=49;});const firstBossClear=cb.engine.settle(cb.engine.begin('campaign',50).token,true,1);
  assert.equal(firstBossClear.heroFragments,3);assert.equal(firstBossClear.fragmentHero,M.SUMMON_BANNER.hero);assert.equal(cb.engine.read().fragments[M.SUMMON_BANNER.hero],3);
  assert.equal(M.RESOURCES.heroFragments[0],'Mảnh '+M.HEROES[M.SUMMON_BANNER.hero].name);assert.ok(!Object.keys(M.RESOURCES).includes('heroFragments'),'Fragment label is display-only');
  assert.equal(cb.engine.settle(cb.engine.begin('campaign',50).token,true,1).heroFragments,undefined,'Replays give no fragments');assert.throws(()=>cb.engine.buy('heroFragments'));
  // Endless boss: after the 12th win of the day, 0 Tinh hoa and 1 quặng.
  const eb=fx(t0);eb.edit(p=>{p.boss.best=5;});const wins=[];for(let i=0;i<14;i++)wins.push(eb.engine.settle(eb.engine.begin('boss',5).token,true,1));
  assert.deepEqual([wins[11].essence,wins[11].ore],[2,3]);assert.deepEqual([wins[12].essence,wins[12].ore],[0,1]);assert.equal(wins[12].gold,Math.floor((1200+5*130)*.25));
  assert.equal(M.DAILY.find(q=>q.id==='boss').name,'Thắng 2 trận Boss Vô Hạn');
  // Quest tiles show what claiming pays now (Ấn limited by today's cap).
  const q=fx(t0),qe=q.engine;assert.deepEqual(qe.dailyReward('login'),{quest:'login',reward:M.DAILY[0].reward,listed:M.DAILY[0].reward,sealCapped:false});
  q.edit(p=>{p.daily.seals=1550;});const capped=qe.dailyReward('login');assert.equal(capped.reward.seals,50);assert.equal(capped.listed.seals,80);assert.equal(capped.sealCapped,true);assert.equal(qe.claimDaily('login').seals,50);
  q.edit(p=>{p.daily.progress.campaign=3;});assert.equal(qe.dailyReward('campaign').reward.seals,0);assert.equal(qe.claimDaily('campaign').seals,0);assert.equal(M.dailyRewardPreview(qe.read(),'spend').reward.gold,800);
  // Vietnamese compact numbers, floored so a balance never reads higher than owned.
  assert.deepEqual([999,9999,12345,19999,125600,1500000,9999999,2500000000].map(M.compact),['999','9.999','12,3 N','19,9 N','125,6 N','1,5 Tr','9,9 Tr','2,5 T']);
  // Premium isolation: no gameplay path, quest or idle claim adds Đá Ngọc; preview gems need an explicit flag.
  const g=fx(t0),ge=g.engine;g.edit(p=>{p.boss.best=1;});ge.claimDaily('login');ge.settle(ge.begin('campaign',1).token,true,1);ge.settle(ge.begin('boss',1).token,true,1);ge.settle(ge.begin('boss',1).token,true,1);ge.claimDaily('boss');
  g.at(t0+13*HOUR);ge.claimOffline();g.edit(p=>{p.wallet.tickets=10;});ge.summon(10);assert.equal(ge.read().wallet.gems,0);
  for(const quest of M.DAILY)assert.equal(quest.reward.gems,undefined);assert.ok(!M.WORLD.SHOP.some(row=>row.kind==='resource'&&row.target==='gems'));
  assert.equal(M.makeEngine(null,{now:()=>t0}).read().wallet.gems,0,'No preview gems unless requested');
}
{ // Mailbox: welcome notice, migration, studio validation, atomic idempotent claims, delete rules, expiry, preview once-only.
  const HOUR=3600000,DAY=24*HOUR,t0=Date.UTC(2026,9,18,3);
  const fx=(opts={})=>{let t=t0;const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const make=()=>M.makeEngine(storage,{now:()=>t,random:()=>.5,...opts});const engine=make();
    return {engine,storage,make,at:v=>{t=v;},edit:fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));}};};
  const a=fx(),ae=a.engine;let box=ae.mailbox();
  assert.equal(box.mails.length,1);assert.equal(box.unread,1);assert.equal(box.pending,0);
  const welcome=box.mails[0];assert.equal(welcome.kind,'notice');assert.equal(welcome.from,'Ban Quản Trị Gemwoven');assert.deepEqual(welcome.attachments,[]);assert.equal(welcome.expiresAt,null);assert.equal(welcome.source,'system');
  assert.throws(()=>ae.claimMail(welcome.id),/không có quà/);ae.readMail(welcome.id);assert.equal(ae.mailbox().unread,0);
  // Old saves without a mailbox get the single welcome notice, dated at their last save.
  a.edit(p=>{delete p.mail;p.updated=t0-5*HOUR;});const migrated=ae.read().mail;assert.equal(migrated.length,1);assert.equal(migrated[0].id,'welcome-mailbox');assert.equal(migrated[0].sentAt,t0-5*HOUR);assert.equal(ae.read().mail[0].sentAt,migrated[0].sentAt,'Migration is stable across reads');
  assert.ok(!M.MAIL_RESOURCES.includes('gems'));assert.ok(!M.MAIL_RESOURCES.includes('seals'));
  const draft=(over={})=>({kind:'gift',title:'Quà bảo trì',body:'Cảm ơn bạn.',from:'Ban Quản Trị',expiryDays:7,attachments:[{resource:'gold',count:1000}],...over});
  const snapshot=ae.exportSave();
  for(const bad of [draft({attachments:[{resource:'gems',count:1}]}),draft({attachments:[{resource:'gold',count:1},{resource:'gems',count:5}]}),draft({attachments:[{resource:'seals',count:10}]}),draft({attachments:[{resource:'heroFragments',count:1}]}),
    draft({attachments:['gold','exp','ore','wood','cloth'].map(resource=>({resource,count:1}))}),draft({attachments:[{resource:'gold',count:0}]}),draft({attachments:[{resource:'gold',count:1000000}]}),draft({attachments:[{resource:'gold',count:1.5}]}),
    draft({attachments:[{resource:'gold',count:1},{resource:'gold',count:2}]}),draft({attachments:[]}),draft({kind:'notice'}),draft({kind:'system'}),draft({title:'x'.repeat(61)}),draft({title:'   '}),draft({body:'x'.repeat(601)}),draft({expiryDays:0}),draft({expiryDays:31}),draft({expiryDays:'abc'})])
    assert.throws(()=>ae.sendMail(bad),undefined,JSON.stringify(bad).slice(0,90));
  assert.equal(ae.exportSave(),snapshot,'Rejected drafts never touch the save');
  assert.equal(ae.sendMail(draft({title:'x'.repeat(60),body:'y'.repeat(600)})).title.length,60);
  const notice=ae.sendMail(draft({kind:'notice',attachments:[],title:'Bảo trì',expiryDays:1}));assert.equal(notice.expiresAt,t0+DAY);assert.equal(notice.source,'local-studio');
  const gift=ae.sendMail(draft({attachments:[{resource:'gold',count:5000},{resource:'tickets',count:10},{resource:'skillBooks',count:2},{resource:'divineOre',count:999999}],expiryDays:30}));
  box=ae.mailbox();assert.equal(box.mails[0].id,gift.id,'Newest first');assert.equal(box.pending,2);
  // Claims are idempotent and pay exactly the attachments through grant().
  let before=ae.read();const got=ae.claimMail(gift.id);assert.deepEqual(got,{gold:5000,tickets:10,skillBooks:2,divineOre:999999});
  let after=ae.read();assert.equal(after.wallet.gold,before.wallet.gold+5000);assert.equal(after.wallet.tickets,before.wallet.tickets+10);assert.equal(after.materials.divineOre,before.materials.divineOre+999999);assert.equal(after.wallet.gems,0);
  const claimed=after.mail.find(m=>m.id===gift.id);assert.ok(claimed.claimed&&claimed.read);
  assert.deepEqual(ae.claimMail(gift.id),{},'Second claim grants nothing');assert.equal(ae.read().wallet.gold,after.wallet.gold);
  // Delete rules: pending gifts are protected; read-and-settled mail can go.
  const pendingGift=ae.sendMail(draft({title:'Quà chưa nhận'}));assert.throws(()=>ae.deleteMail(pendingGift.id),/nhận quà trước/);ae.readMail(pendingGift.id);
  const unreadNotice=ae.sendMail(draft({kind:'notice',attachments:[],title:'Chưa đọc'}));ae.readMail('welcome-mailbox');
  const removed=ae.deleteReadMail();assert.equal(removed,2,'Read welcome + claimed gift');const left=ae.read().mail.map(m=>m.id);assert.ok(left.includes(pendingGift.id),'Unclaimed gifts survive bulk delete');assert.ok(left.includes(unreadNotice.id),'Unread mail survives bulk delete');assert.ok(!left.includes(gift.id));
  ae.deleteMail(unreadNotice.id);assert.throws(()=>ae.deleteMail(unreadNotice.id));
  // Tampered gems in a stored mail: the whole claim (and claim-all) aborts.
  a.edit(p=>p.mail.push({id:'forged',kind:'gift',from:'X',title:'Forged',body:'',sentAt:t0,expiresAt:null,attachments:[{resource:'gems',count:500}],read:false,claimed:false,source:'system'}));
  const forgedSave=ae.exportSave();assert.throws(()=>ae.claimMail('forged'),/Đá Ngọc/);assert.throws(()=>ae.claimAllMail(),/Đá Ngọc/);assert.equal(ae.exportSave(),forgedSave,'Failed claims are atomic');
  a.edit(p=>{p.mail=p.mail.filter(m=>m.id!=='forged');});
  before=ae.read();const all=ae.claimAllMail();assert.deepEqual(all,{gold:2000},'Two pending gifts in one claim');assert.equal(ae.read().wallet.gold,before.wallet.gold+2000);assert.equal(ae.mailbox().pending,0);assert.throws(()=>ae.claimAllMail(),/Không có quà/);
  assert.throws(()=>ae.recallMail('welcome-mailbox'),/studio/);const recalled=ae.sendMail(draft({title:'Thu hồi'}));ae.recallMail(recalled.id);assert.ok(!ae.read().mail.some(m=>m.id===recalled.id),'Studio can recall its own gift without granting it');
  // Expiry: hidden at the deadline, unclaimable, and purged by the next transaction.
  const e2=fx(),ex=e2.engine,short=ex.sendMail(draft({expiryDays:1}));assert.equal(M.mailExpiry(short.expiresAt,t0),'Còn 1 ngày');assert.equal(M.mailExpiry(short.expiresAt,t0+DAY-2*HOUR),'Còn 2 giờ');
  e2.at(t0+DAY);assert.ok(!ex.mailbox().mails.some(m=>m.id===short.id));assert.throws(()=>ex.claimMail(short.id),/hết hạn/);ex.readMail('welcome-mailbox');assert.ok(!ex.read().mail.some(m=>m.id===short.id),'Expired mail is purged by the next transaction');assert.equal(ex.read().wallet.gold,1200);
  // Box limit.
  const full=fx(),fe=full.engine;for(let i=fe.read().mail.length;i<M.MAIL_LIMIT;i++)fe.sendMail(draft({kind:'notice',attachments:[],title:'Thư '+i}));assert.throws(()=>fe.sendMail(draft()),/đầy/);
  // Relative dates (GMT+7 days).
  assert.equal(M.mailAge(t0,t0+30000),'Vừa xong');assert.equal(M.mailAge(t0,t0+5*60000),'5 phút trước');assert.equal(M.mailAge(t0,t0+2*HOUR),'2 giờ trước');assert.equal(M.mailAge(t0,t0+DAY),'Hôm qua');assert.equal(M.mailAge(t0,t0+3*DAY),'3 ngày trước');assert.equal(M.mailAge(t0,t0+10*DAY),'18/10/2026');assert.equal(M.mailExpiry(null,t0),'');
  // Local preview gift: explicit flag, granted once, ordinary resources only.
  const pv=fx({previewMail:true});let pmails=pv.engine.mailbox().mails;assert.equal(pmails.length,2);const sample=pmails.find(m=>m.source==='preview');
  assert.equal(sample.title,'Quà thử nghiệm');assert.ok(sample.body.includes('(bản thử nghiệm local)'));assert.ok(sample.attachments.length>=3&&sample.attachments.every(x=>M.MAIL_RESOURCES.includes(x.resource)));assert.ok(pv.engine.read().previewGrants.includes('mail-preview-2026-10'));
  pv.engine.claimMail(sample.id);pv.engine.deleteMail(sample.id);const reopened=pv.make();assert.ok(!reopened.mailbox().mails.some(m=>m.source==='preview'),'Preview gift is sent once, even after deletion');assert.equal(reopened.read().wallet.gems,0);
  assert.ok(!fx().engine.mailbox().mails.some(m=>m.source==='preview'),'No preview mail without the flag');
}
console.log(JSON.stringify({passed:true,sealTotal,minDaysTo500:369,checks:'Starter persistence, mailbox (welcome, migration, studio validation, idempotent atomic claims, delete rules, expiry, preview once), premium isolation, atomic spending, stage gates, battle receipts, daily reset, offline caps, level/star/evolution limits, skill kits (ranks, gates, forms, evolution perks, generated text, normalized practice, upgrade previews), equipment, summon rates/pity, and event validation'},null,2));
