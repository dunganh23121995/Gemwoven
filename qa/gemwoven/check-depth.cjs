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
{ // Growth map gear row (Codex round 2): six worn items below +20 with gold and ore to spare are "ready".
  clock=Date.UTC(2026,10,3,6);const {engine:e,edit}=fixture();edit(p=>{p.campaign.cleared=100;p.wallet.gold=5e6;p.materials={...p.materials,ore:10000,wood:500,cloth:500,essence:500};});
  for(const slot of Object.keys(M.SLOTS))e.equip('novice',e.craft(slot,'uncommon').id);
  const row=()=>M.growthMap(e.read(),'novice').find(r=>r.id==='gear');assert.equal(row().state,'ready');
  edit(p=>{for(const g of p.equipment)g.level=20;});assert.equal(row().state,'max');
}
console.log('gear row ok');
{ // Sân Thử Luyện: today's boss only (all on weekends), at the hero's level, two rewarded runs a day, best kept.
  clock=Date.UTC(2026,10,3,6);const {engine:e,edit}=fixture(); // Tuesday: Băng Nguyệt Linh Hồ (index 2)
  assert.deepEqual(M.trialOpen(clock),[2]);assert.throws(()=>e.begin('trial',1),/boss khác/);
  edit(p=>{p.heroes.novice.level=60;});const b=e.begin('trial',2);assert.equal(b.recommended,60);assert.equal(b.turnLimit,15);assert.equal(b.boss,true);assert.equal(b.enemyKey,'ice');
  const r1=e.settle(b.token,false,b.enemyHp*2.5);assert.equal(r1.trial.tier,3);assert.ok(r1.gold>0&&r1.essence===1);assert.equal(r1.gems,undefined);
  const b2=e.begin('trial',2),r2=e.settle(b2.token,true,b2.enemyHp*.6);assert.equal(r2.trial.tier,1);assert.ok(r2.gold>0&&!r2.essence);
  const b3=e.begin('trial',2),r3=e.settle(b3.token,true,b3.enemyHp*9);assert.equal(r3.trial.rewarded,false);assert.equal(r3.gold,undefined,'Third run is free practice');
  assert.equal(e.read().trial.best[2],Math.floor(b3.enemyHp*9));
  clock=Date.UTC(2026,10,7,6);assert.deepEqual(M.trialOpen(clock),[1,2,3,4,5],'Weekend opens every boss');
  const reload=e.read();assert.equal(reload.pending,null);
}
console.log('trial ok');
{ // Owner review 2026-11-03: no lifetime card; the pass has a third (jewel) track without gems or Hiro fragments.
  const O=require('../../src/gemwoven/liveops.js');
  assert.ok(!O.PRODUCTS.some(p=>p.id==='lifetime-card'),'No lifetime card');
  assert.deepEqual(O.PASS.tracks.map(t=>t.id),['free','gold','jewel']);
  for(let l=1;l<=O.PASS.levels;l++)assert.equal(O.PASS.jewel(l).gems,undefined,'No Đá Ngọc in the jewel track');
  assert.ok(O.PASS.fragmentRule.exclude.includes('novice')&&O.PASS.fragmentRule.ownedOnly,'Paid fragment chests skip Hiro and unowned heroes');
  assert.ok(O.PASS.boughtIncludesJewel&&O.PASS.jewelBonusLevels<=O.PASS.boughtLevelsMax,'Jewel levels count toward the bought-level cap');
  const jewel=O.PRODUCTS.find(p=>p.id==='journey-pass-jewel');assert.equal(jewel.upgradePrice,jewel.price-O.PRODUCTS.find(p=>p.id==='journey-pass').price);
}
{ // Plaza friendly fight: an AI copy with normalized stats, never a reward.
  const {engine:e}=fixture();const before=JSON.stringify(e.read().wallet);
  const b=e.begin('spar',1,{opponent:{hero:'fire',name:'Bạn',look:2}});assert.equal(b.mode,'spar');assert.match(b.name,/bản sao · AI · Không thưởng/);
  assert.equal(b.enemyHp,M.HEROES.fire.hp*2);const r=e.settle(b.token,true,999);assert.deepEqual(Object.keys(r),['spar']);assert.equal(JSON.stringify(e.read().wallet),before,'No reward');
  assert.throws(()=>e.begin('spar',1,{opponent:{hero:'nobody'}}),/không hợp lệ/);
}
{ // Social protocol shared by the plaza and the social server.
  const S=require('../../src/gemwoven/social-protocol.js'),geo=require('../../assets/gemwoven/plaza/plaza.json');
  assert.equal(S.cleanText('chào đm bạn').text,'chào ** bạn');assert.equal(S.cleanText('Các bạn đi du lịch, đeo kính, mua lon bia').text,'Các bạn đi du lịch, đeo kính, mua lon bia','ordinary words untouched');assert.equal(S.cleanText('ĐM thật').text,'** thật');
  assert.ok(!S.cleanText('x'.repeat(S.LIMITS.chat+1)).ok);assert.ok(!S.checkName('admin').ok);assert.ok(S.checkName('Lữ Khách').ok);
  assert.ok(S.checkGuild('Hội Dệt Ngọc','dn').ok&&S.checkGuild('Hội Dệt Ngọc','dn').tag==='DN');assert.ok(!S.checkGuild('Hội','D').ok);
  assert.equal(S.guildLevel(0),1);assert.equal(S.guildLevel(45000),10);assert.equal(S.guildCap(10),38);
  assert.equal(S.lanternTier({red:5,blue:0,gold:0}),0,'every colour is needed');assert.equal(S.lanternTier({red:5,blue:5,gold:15}),3);
  for(const z of geo.zones)assert.ok(S.walkable(geo,z.x,z.y)||z.id==='fountain','zone centres are reachable');
  // Walking from the gate reaches every place by steering round the fountain and the board.
  for(const z of geo.zones.filter(z=>z.id!=='fountain')){let p=[...geo.spawn],side=0;for(let i=0;i<600;i++){const r=S.step(geo,p,[z.x,z.y],.1,side);p=r.pos;side=r.side;if(r.arrived)break;}assert.ok(Math.hypot(p[0]-z.x,p[1]-z.y)<3,'reach '+z.id);}
}
console.log('plaza, pass tracks, spar ok');
