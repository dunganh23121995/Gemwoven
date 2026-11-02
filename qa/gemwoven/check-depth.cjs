/* Depth pass (docs/GAME_DESIGN.md): town looks, Hiro's fragment path, stat breakdown, growth map. */
const assert=require('node:assert/strict');
const M=require('../../src/gemwoven/progression.js');
const DAY=86400000;let clock=Date.UTC(2026,10,3,6);
function fixture(){const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const engine=M.makeEngine(storage,{now:()=>clock,random:()=>.7});const edit=fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));};return {engine,edit};}

{ // Forms: stars unlock them, combat keeps the highest, any unlocked one can be worn in town.
  const {engine:e,edit}=fixture();edit(p=>{p.heroes.fire={level:1,stars:4,evolution:0,copies:3,skills:[1,0,0,0],gear:{},relic:{level:1,evolution:1},ticketMilestones:[]};p.wallet.gold=5e6;p.materials.essence=1000;});
  assert.equal(M.heroForm('fire',e.read().heroes.fire),2);assert.equal(M.lookForm('fire',e.read().heroes.fire),2);
  assert.throws(()=>e.chooseLook('fire',3),/6 sao/);assert.throws(()=>e.chooseLook('novice',1),/một hình thái/);
  assert.equal(e.chooseLook('fire',1),1);const h=e.read().heroes.fire;
  assert.equal(M.lookForm('fire',h),1,'Town look follows the choice');assert.equal(M.heroForm('fire',h),2,'Combat keeps the highest form');
  assert.equal(e.stats('fire').form,2);assert.equal(e.stats('fire').kit.formPower,1.1);
  assert.equal(e.chooseLook('fire',2),2);assert.equal(e.read().heroes.fire.look,undefined,'Choosing the highest clears the override');
  e.chooseLook('fire',1);edit(p=>{p.heroes.fire.stars=5;p.heroes.fire.copies=20;});e.starUp('fire');
  assert.equal(M.heroForm('fire',e.read().heroes.fire),3);assert.equal(M.lookForm('fire',e.read().heroes.fire),3,'A newly unlocked form is shown');
}
{ // Hiro's copies come from play: newbie week, daily campaign quest, chapter chests, endless floors.
  const {engine:e,edit}=fixture();
  const week=e.newbie();assert.equal(week.length,7);assert.equal(week.reduce((n,r)=>n+r.reward.noviceFragments,0),80);
  for(const r of M.NEWBIE)assert.equal(r.gems,undefined,'No premium currency in the newbie week');
  assert.deepEqual(week.map(r=>r.open),[true,false,false,false,false,false,false]);
  assert.equal(e.claimNewbie(1).noviceFragments,10);assert.throws(()=>e.claimNewbie(1),/Đã nhận/);assert.throws(()=>e.claimNewbie(2),/Chưa đến/);
  clock+=3*DAY;assert.equal(e.newbie().filter(r=>r.open).length,4,'Missed days can be caught up');
  for(const d of [2,3,4])e.claimNewbie(d);assert.equal(e.read().fragments.novice,40);
  edit(p=>{p.daily.progress.campaign=3;});const q=e.claimDaily('campaign');assert.equal(q.noviceFragments,6);assert.equal(e.read().fragments.novice,46);
  edit(p=>{p.campaign.stars=Object.fromEntries(Array.from({length:50},(_,i)=>[i+1,3]));p.campaign.cleared=50;});
  assert.equal(e.claimChapter(1,50).noviceFragments,undefined);assert.equal(e.claimChapter(1,100).noviceFragments,10);assert.equal(e.claimChapter(1,150).noviceFragments,20);
  edit(p=>{p.boss.best=9;});const b=e.begin('boss',10);assert.equal(e.settle(b.token,true,1000).noviceFragments,10);
  const again=e.begin('boss',10);assert.equal(e.settle(again.token,true,1000).noviceFragments,undefined,'Only the first clear of a tenth floor');
  assert.equal(e.read().fragments.novice,86);e.fuse('novice');assert.equal(e.read().heroes.novice.copies,2,'80 Mảnh Hiro fuse into a copy');
  edit(p=>{p.wallet.gold=1e6;p.materials.essence=100;});e.starUp('novice');assert.equal(e.read().heroes.novice.stars,2,'Hiro can now reach his second star');
}
{ // Breakdown rows rebuild the totals; power is effective HP times attack.
  const {engine:e,edit}=fixture();edit(p=>{p.heroes.novice.level=120;p.heroes.novice.evolution=2;p.heroes.novice.skills=[3,4,1,0];p.campaign.cleared=300;p.wallet.gold=5e6;p.materials={...p.materials,ore:500,wood:500,cloth:500,essence:500,divineOre:100};});
  for(const slot of ['weapon','pants','boots'])e.equip('novice',e.craft(slot,'epic').id);
  const p=e.read(),b=M.statBreakdown(p,'novice'),s=e.stats('novice');
  assert.deepEqual(b.rows.map(r=>r.id),['base','level','stars','evolution','gear','relic','skills']);
  assert.ok(Math.abs(b.rows.reduce((n,r)=>n+r.hp,0)-s.hp)<=b.rows.length,'HP rows add up');
  assert.ok(Math.abs(b.rows.reduce((n,r)=>n+r.attack,0)-s.attack)<1e-3,'Công rows add up');
  assert.ok(Math.abs(b.rows.reduce((n,r)=>n+r.defense,0)-s.defense)<1e-3,'Thủ rows add up');
  assert.equal(s.power,Math.round(M.statParts(p,'novice').hp*M.statParts(p,'novice').attack/(1-s.defense)));
}
{ // Growth map: one row per axis, honest states, every row routes somewhere.
  const {engine:e,edit}=fixture();const rows=M.growthMap(e.read(),'novice');
  assert.deepEqual(rows.map(r=>r.id),['level','stars','evolution','skill-0','skill-1','skill-2','skill-3','gear','relic'],'Hiro has no form row');
  const by=id=>rows.find(r=>r.id===id);
  assert.equal(by('level').state,'short','A new account has no Ấn yet');assert.equal(by('stars').state,'locked');assert.match(by('stars').need,/Mảnh Hiro/);
  assert.equal(by('skill-1').state,'locked');assert.match(by('skill-1').next,/cấp 10/);assert.equal(by('evolution').state,'locked');
  for(const r of rows)assert.ok(['max','ready','short','locked'].includes(r.state)&&r.route&&r.name&&r.current,r.id);
  edit(p=>{p.heroes.shadow={level:400,stars:6,evolution:5,copies:1,skills:[10,10,10,1],gear:{},relic:{level:1,evolution:1},ticketMilestones:[]};});
  const noct=M.growthMap(e.read(),'shadow');assert.equal(noct.find(r=>r.id==='forms').state,'max');assert.equal(noct.find(r=>r.id==='stars').state,'max');assert.equal(noct.find(r=>r.id==='skill-0').state,'max');
}
{ // Summon: 1% banner hero, guaranteed by the 100th pull.
  assert.equal(M.SUMMON_TABLE.reduce((n,[,w])=>n+w,0),1000000);assert.equal(M.SUMMON_TABLE.find(r=>r[0]==='hero')[1],10000);assert.equal(M.SUMMON_PITY,100);
  assert.equal(M.skillKit('novice',null).damage,70,'Hiro\'s ultimate base is 70');
}
console.log(JSON.stringify({passed:true,checks:'Town looks vs combat form, Hiro fragment path (newbie week, daily, chests, endless, fuse, second star), stat breakdown sums, growth map states, summon 1%/100, Hiro ultimate 70'},null,2));
{ // Live-ops config: no Đá Ngọc as a reward anywhere, VIP never adds combat stats, PvE-reachable treasures.
  const O=require('../../src/gemwoven/liveops.js');
  for(let l=1;l<=O.PASS.levels;l++)for(const track of ['free','gold'])assert.equal(O.PASS[track](l).gems,undefined,'No Đá Ngọc in the pass');
  for(const l of O.LEAGUES)assert.equal(l.weekly.gems,undefined,'No Đá Ngọc in arena rewards');
  for(const v of O.VIP)assert.equal(v.combatStats,false);for(const v of M.VIP)assert.equal(v.combatStats,false);
  assert.deepEqual(O.VIP.map(v=>v.spend),M.VIP.slice(1).map(v=>v.spend),'One VIP ladder');
  assert.ok(O.TREASURE_FAMILIES.find(f=>f.id==='mountain').pveOnly);assert.ok(O.TITLES.filter(t=>t.paid).length<=1);
}
console.log('liveops ok');
{ // Asset packs: a new account needs core, chapter 1 and Hiro only; ownership and progress add packs.
  const P=require('../../src/gemwoven/asset-packs.js'),catalog=require('../../assets/packs.json');
  const {engine:e,edit}=fixture();const fresh=P.packsFor(e.read());
  assert.deepEqual(fresh.need.sort(),['chapter-1','core','hero-novice-f1','summon']);assert.ok(fresh.prefetch.includes('chapter-2'));assert.ok(fresh.prefetch.includes('hero-fire-f1'));
  edit(p=>{p.campaign.cleared=120;p.heroes.shadow={level:1,stars:6,evolution:0,copies:1,skills:[1,0,0,0],gear:{},relic:{level:1,evolution:1},ticketMilestones:[]};});
  const later=P.packsFor(e.read());for(const id of ['chapter-2','chapter-3','hero-shadow-f1','hero-shadow-f2','hero-shadow-f3'])assert.ok(later.need.includes(id),id);
  assert.ok(!later.need.includes('chapter-4')&&later.prefetch.includes('chapter-4'));assert.ok(!later.need.includes('hero-ice-f1'),'Unowned heroes are not downloaded');
  const ids=new Set(catalog.packs.map(p=>p.id));for(const id of [...later.need,...later.prefetch])assert.ok(ids.has(id),'Pack exists in packs.json: '+id);
  assert.ok(P.download(e.read(),catalog,['core']).bytes>0);
}
console.log('asset packs ok');
{ // Weekly quests: Monday reset (GMT+7), progress from campaign/boss wins and daily claims, one ticket each.
  clock=Date.UTC(2026,10,4,6);const {engine:e,edit}=fixture(); // Wednesday
  const w=e.weekly();assert.equal(w.length,3);assert.equal(w[0].week,'2026-11-02','Week starts Monday');assert.equal(M.WEEKLY.reduce((n,q)=>n+(q.reward.tickets||0),0),3);
  for(const q of M.WEEKLY)assert.equal(q.reward.gems,undefined);
  assert.throws(()=>e.claimWeekly('campaign'),/Chưa hoàn thành/);
  for(let i=0;i<15;i++){const b=e.begin('campaign',1);e.settle(b.token,true,10,{hpRatio:.9,turns:3});}
  assert.equal(e.weekly()[0].progress,15);const before=e.read().wallet.tickets;e.claimWeekly('campaign');assert.equal(e.read().wallet.tickets,before+1);assert.throws(()=>e.claimWeekly('campaign'),/Đã nhận/);
  edit(p=>{p.daily.progress.campaign=3;});e.claimDaily('login');e.claimDaily('campaign');assert.equal(e.weekly()[2].progress,2);
  clock=Date.UTC(2026,10,8,0);assert.equal(e.weekly()[0].week,'2026-11-02','Sunday 07:00 GMT+7 is still the same week');
  clock=Date.UTC(2026,10,8,17,1);assert.equal(e.weekly()[0].week,'2026-11-09','Monday 00:01 GMT+7 starts a new week');assert.equal(e.weekly()[0].progress,0);
}
console.log('weekly ok');
