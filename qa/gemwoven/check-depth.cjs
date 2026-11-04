/* Depth pass (docs/GAME_DESIGN.md): town looks, Hiro's fragment path, stat breakdown, growth map. */
const assert=require('node:assert/strict');
const M=require('../../src/gemwoven/progression.js');
const DAY=86400000;let clock=Date.UTC(2026,10,3,6);
function fixture(){const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const engine=M.makeEngine(storage,{now:()=>clock,random:()=>.7});const edit=fn=>{const p=engine.read();fn(p);storage.setItem(M.KEY,JSON.stringify(p));};return {engine,edit};}

{ // Forms: stars unlock them, combat keeps the highest, any unlocked one can be worn in town.
  const {engine:e,edit}=fixture();edit(p=>{p.heroes.fire={level:1,stars:4,evolution:0,copies:3,skills:[1,0,0,0],gear:{},relic:{level:1,evolution:1},ticketMilestones:[]};p.wallet.gold=5e6;p.materials.essence=1000;});
  assert.equal(M.heroForm('fire',e.read().heroes.fire),2);assert.equal(M.lookForm('fire',e.read().heroes.fire),2);
  assert.throws(()=>e.chooseLook('fire',3),/6 sao/);assert.throws(()=>e.chooseLook('novice',2),/4 sao|Chưa mở|chưa mở/);
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
  assert.deepEqual(rows.map(r=>r.id),['level','stars','forms','evolution','skill-0','skill-1','skill-2','skill-3','gear','relic'],'Hiro has forms too (2026-11-03)');
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
{ // Too much gear (Codex round 3): refunds, all-or-nothing bulk salvage, locks, auto-salvage, best gear.
  assert.deepEqual(M.salvageValue({rarity:'common',level:20}),{ore:3+294,gold:80+132300},'70% of the 189.000 gold / 420 ore +20 cost');
  assert.deepEqual(M.salvageValue({rarity:'divine',level:0}),{ore:33,gold:880});
  const {engine:e,edit}=fixture();
  edit(p=>{for(let i=0;i<8;i++)p.equipment.push({id:'x'+i,slot:i%2?'armor':'weapon',rarity:i<6?'common':'epic',level:i===1?5:0,affix:null});p.equipment[0].locked=true;p.heroes.novice.gear.weapon='x2';});
  const pv=e.salvagePreview({rarities:['common']});assert.deepEqual(pv.ids.sort(),['x1','x3','x4','x5'],'locked and worn pieces are left out');
  assert.throws(()=>e.salvageMany(['x1','x0']),/khóa/);assert.equal(e.read().equipment.length,8,'all or nothing');
  const ore=e.read().materials.ore,got=e.salvageMany(pv.ids);assert.equal(got.ore,pv.ore);assert.equal(e.read().materials.ore,ore+pv.ore);
  assert.throws(()=>e.salvageMany(pv.ids),/không còn/,'a repeat cannot pay twice');assert.equal(e.read().salvageLog[0].count,4);
  assert.throws(()=>e.salvage('x0'),/khóa/);e.lockGear('x0',false);e.salvage('x0');
  // Best gear: the epic weapon replaces the worn common one; another hero's gear is never taken.
  edit(p=>{p.heroes.fire={...p.heroes.novice,gear:{armor:'x7'}};});
  const plan=e.bestGear('novice');assert.equal(plan.weapon.to,'x6');assert.equal(plan.armor,undefined,'x7 is worn by Mika');
  e.equipBest('novice');assert.equal(e.read().heroes.novice.gear.weapon,'x6');assert.throws(()=>e.equipBest('novice'),/tốt nhất/);
  // Auto-salvage is off until turned on; a drop better than the worn piece is kept.
  assert.equal(e.read().settings?.autoSalvage?.common,undefined);
  e.setAutoSalvage('common',true);assert.throws(()=>e.setAutoSalvage('epic',true),/Thường hoặc Tốt/);
}
console.log('gear overflow ok');
{ // Badges: red counts only free rewards to take now; green hints come from the growth map.
  const {engine:e,edit}=fixture();let n=e.notices();
  assert.equal(n.claim.quests,1,'the visit quest');assert.equal(n.claim.events,1,'newbie day 1');assert.deepEqual(n.hint.upgrade,[],'a new account cannot pay for anything');
  e.claimDaily('login');e.claimNewbie(1);n=e.notices();assert.equal(n.claim.quests,0);assert.equal(n.claim.events,0);
  edit(p=>{p.wallet.gold=1e6;p.materials.exp=1e3;p.materials.seals=1e4;p.fragments.novice=85;});n=e.notices();
  assert.ok(n.hint.upgrade.some(s=>s.startsWith('novice:level:')));assert.deepEqual(n.hint.inventory,['fuse:novice:1']);
  assert.ok(!('gems' in n.claim)&&!n.claim.vip,'never a red dot for paying (VIP counts only pass rewards to take)');
}
console.log('badges ok');
{ // Titles: cosmetic, earned from play; only an unlocked one can be worn; server titles stay locked here.
  const {engine:e,edit}=fixture();assert.throws(()=>e.wearTitle('ember'),/Chưa đạt/);
  edit(p=>{p.campaign.cleared=100;});assert.ok(e.titles().find(t=>t.id==='ember').unlocked);e.wearTitle('ember');assert.equal(e.read().title,'ember');
  const before=e.stats('novice');e.wearTitle(null);assert.equal(e.read().title,undefined);assert.deepEqual(e.stats('novice'),before,'no stat from titles');
  assert.ok(e.titles().filter(t=>t.server).every(t=>!t.unlocked));assert.throws(()=>e.wearTitle('patron'),/Chưa đạt/);
}
console.log('titles ok');
{ // Dệt Ngọc (Codex round 6): sockets by rarity, caps, fuse 3→1, return on salvage, off in normalized play, drops.
  const {engine:e,edit}=fixture();
  edit(p=>{p.equipment.push({id:'w',slot:'weapon',rarity:'divine',level:0,affix:null},{id:'r',slot:'armor',rarity:'rare',level:0,affix:null},{id:'c',slot:'helmet',rarity:'common',level:0,affix:null});p.heroes.novice.gear.weapon='w';p.gems={'atk-5':4,'hp-1':3,'resist-5':4};p.wallet.gold=1e5;});
  const base=e.stats('novice');for(let i=0;i<4;i++)e.socketGem('w',i,'atk-5');
  assert.equal(M.gemTotals(e.read(),'novice').atk,.36,'Công% capped at 36%');assert.ok(Math.abs(e.stats('novice').attack/base.attack-1.36)<.01,'multiplied once');
  assert.throws(()=>e.socketGem('c',0,'hp-1'),/lỗ/);assert.throws(()=>e.socketGem('r',1,'hp-1'),/lỗ/);
  e.unsocketGem('w',3);e.unsocketGem('w',2);e.socketGem('w',2,'resist-5');e.socketGem('w',3,'resist-5');assert.equal(e.stats('novice').resist,.4,'resistance capped at 40%');
  assert.equal(e.stats('novice',true).resist,0,'off in normalized play');assert.equal(e.stats('novice',true).attack,M.HEROES.novice.attack*1.8);
  e.fuseGems('hp-1');assert.equal(e.read().gems['hp-2'],1);assert.throws(()=>e.fuseGems('hp-2'),/3 viên/);
  edit(p=>{delete p.heroes.novice.gear.weapon;});const before={...e.read().gems};e.salvage('w');const after=e.read().gems;
  assert.equal((after['atk-5']||0)-(before['atk-5']||0),2);assert.equal((after['resist-5']||0)-(before['resist-5']||0),2,'socketed gems come back');
  e.claimWeekly&&0;edit(p=>{p.gemChoices=1;});e.pickGem('def');assert.equal(e.read().gems['def-1'],1);assert.throws(()=>e.pickGem('def'),/phiếu/);
}
console.log('gems ok');
{ // Shop limits (GAME_DESIGN §8): per day / per week, counted on the server-side rule copy.
  const {engine:e,edit}=fixture();edit(p=>{p.wallet.gold=1e7;p.wallet.gems=1e5;});
  e.purchase('skillBooks',5);assert.throws(()=>e.purchase('skillBooks',1),/hết lượt/);assert.equal(e.shopLeft('exp'),Infinity);
  edit(p=>{p.campaign.cleared=20;});e.purchase('uncommon-weapon',1);assert.throws(()=>e.purchase('uncommon-weapon',1),/tuần này/);assert.throws(()=>e.purchase('rare-weapon',1),/ải 40/);
}
console.log('shop limits ok');
{ // Báu vật trial (round 9): only the trial copy earns, shops and wears; caps; the real save stays untouched.
  const map=new Map(),raw={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  let e=M.makeEngine(M.storageFor(raw),{now:()=>clock,random:()=>.7});e.read();const before=raw.getItem(M.KEY);
  assert.throws(()=>e.treasureGift('mountain'),/thử nghiệm/,'not in the real save');
  e.trialMode(true);e=M.makeEngine(M.storageFor(raw),{now:()=>clock,random:()=>.7});
  const a=e.treasureGift('mountain'),b=(()=>{const p=JSON.parse(raw.getItem('gemwoven.treasure.v1'));p.treasure.points=9600;p.treasure.items.push({id:'x2',family:'borrow',quality:'blue'});p.treasure.gifted=true;raw.setItem('gemwoven.treasure.v1',JSON.stringify(p));return 'x2';})();
  for(let i=0;i<4;i++){e.treasureUpgrade(a.id);e.treasureUpgrade(b);}assert.equal(e.treasure().points,0,'two divine = 9.600 points');
  e.treasureEquip('novice',0,a.id);assert.throws(()=>e.treasureEquip('novice',1,b),/tiến hóa 3/);
  const p=JSON.parse(raw.getItem('gemwoven.treasure.v1'));p.heroes.novice.evolution=3;raw.setItem('gemwoven.treasure.v1',JSON.stringify(p));e.treasureEquip('novice',1,b);
  assert.equal(M.treasureTotals(e.read(),'novice').atk,.3,'Công capped at +30%');assert.equal(M.treasureTotals(e.read(),'novice').def,.1,'Thủ capped at +10');
  assert.equal(e.stats('novice',true).treasure,null,'off in normalized play');assert.equal(raw.getItem(M.KEY),before,'real save untouched');
  e.trialMode(false);e=M.makeEngine(M.storageFor(raw));assert.equal(e.treasure().trial,false);
}
console.log('treasure trial ok');
{ // Lò Rèn (review 19): several strengthen levels are priced and paid in one go, or not at all.
  const map=new Map(),raw={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const e=M.makeEngine(raw,{now:()=>clock,random:()=>.7});e.read();const p=JSON.parse(raw.getItem(M.KEY));
  p.campaign.cleared=40;p.wallet.gold=200000;Object.assign(p.materials,{ore:300,wood:60,cloth:60,essence:40});raw.setItem(M.KEY,JSON.stringify(p));
  const g=e.craft('weapon','rare'),gold=e.read().wallet.gold,plan=e.strengthenPlan(g.id);
  assert.ok(plan.to>0&&plan.to<=20,'the purse reaches some level');assert.ok(plan.cost.gold<=gold,'never more than the purse');
  const r=e.strengthenTo(g.id,3);assert.deepEqual([r.from,r.to],[0,3]);assert.equal(e.read().wallet.gold,gold-(900+1800+2700),'three levels at once');
  const q=JSON.parse(raw.getItem(M.KEY));q.wallet.gold=100;raw.setItem(M.KEY,JSON.stringify(q));
  assert.throws(()=>e.strengthenTo(g.id,10));assert.equal(e.read().equipment.find(x=>x.id===g.id).level,3,'nothing half done');
}
console.log('forge ok');
{ // Nâng Phẩm (GAME_DESIGN §3, Claude + Codex 04/11): one rarity up, always succeeds, cost = craft(target) − craft(source).
  const {engine:e,edit}=fixture();
  const want={common:{gold:8000,ore:25,wood:15,cloth:15,essence:10},uncommon:{gold:24000,ore:25,wood:15,cloth:15,essence:10},rare:{gold:40000,ore:25,wood:15,cloth:15,essence:10},epic:{gold:56000,ore:25,wood:15,cloth:15,essence:10},legendary:{gold:72000,ore:25,wood:15,cloth:15,essence:10,divineOre:50}};
  for(const [r,c] of Object.entries(want))assert.deepEqual(M.rarityUpCost(r),c,'Nâng Phẩm from '+r);
  assert.deepEqual([M.rarityUpGate('common'),M.rarityUpGate('uncommon'),M.rarityUpGate('rare'),M.rarityUpGate('epic'),M.rarityUpGate('legendary')],[20,40,60,80,300]);
  const sum={};for(const r of Object.keys(want))for(const [k,n] of Object.entries(M.rarityUpCost(r)))sum[k]=(sum[k]||0)+n;assert.deepEqual(sum,M.craftCost('divine'),'Thường → Thần step by step = crafting Thần');
  for(const r of M.CRAFT_RARITIES.slice(1)){const a=M.craftCost(r),b=M.craftCost(M.CRAFT_RARITIES[M.CRAFT_RARITIES.indexOf(r)-1]),c=M.rarityUpCost(M.CRAFT_RARITIES[M.CRAFT_RARITIES.indexOf(r)-1]);for(const k of Object.keys(a))assert.equal(c[k]||0,a[k]-(b[k]||0),'difference of craft costs');}
  assert.throws(()=>M.rarityUpCost('divine'),/Thần/);
  edit(p=>{p.campaign.cleared=60;p.wallet.gold=1e6;Object.assign(p.materials,{ore:500,wood:500,cloth:500,essence:500,divineOre:0});p.gems={};
    p.equipment.push({id:'u',slot:'armor',rarity:'rare',level:7,affix:null,sockets:['hp-3'],locked:true},{id:'s',slot:'weapon',rarity:'epic',level:0,affix:null,signature:'fire'});p.heroes.novice.gear.armor='u';});
  const pre=e.upgradeRarityPreview('u');assert.deepEqual([pre.from,pre.to,pre.gate,pre.open,pre.affordable],['rare','epic',60,true,true]);assert.deepEqual(pre.sockets,{from:1,to:2});
  const before=e.read(),hp0=e.stats('novice').hp,r=e.upgradeRarity('u'),after=e.read(),g=after.equipment.find(x=>x.id==='u');
  assert.deepEqual([r.from,r.to],['rare','epic']);assert.equal(g.rarity,'epic');assert.equal(g.level,7,'strengthen level kept');assert.equal(g.locked,true,'lock kept');
  assert.deepEqual(g.sockets,['hp-3',null],'gems kept, one more socket open');assert.equal(after.heroes.novice.gear.armor,'u','still worn by the same hero');
  assert.deepEqual(after.gems,{},'no gem spent or granted');assert.equal(after.equipment.length,before.equipment.length,'no piece made or used up');
  assert.equal(before.wallet.gold-after.wallet.gold,40000);assert.equal(before.materials.ore-after.materials.ore,25);assert.ok(e.stats('novice').hp>hp0,'stats grow');
  assert.throws(()=>e.upgradeRarity('u'),/ải 80/,'gate: the target rarity craft gate');assert.equal(e.read().equipment.find(x=>x.id==='u').rarity,'epic','nothing half done');
  assert.throws(()=>e.upgradeRarity('s'),/bản mệnh/);assert.equal(e.upgradeRarityPreview('s').signature,true);assert.throws(()=>e.upgradeRarity('nope'),/không tồn tại/);
  edit(p=>{p.campaign.cleared=299;});e.upgradeRarity('u');assert.equal(e.read().equipment.find(x=>x.id==='u').rarity,'legendary');
  assert.throws(()=>e.upgradeRarity('u'),/ải 300/);edit(p=>{p.campaign.cleared=300;});assert.equal(e.upgradeRarityPreview('u').affordable,false);assert.throws(()=>e.upgradeRarity('u'),/thần thạch/,'short of thần thạch');
  edit(p=>{p.materials.divineOre=50;});const top=e.upgradeRarity('u').gear;assert.equal(top.rarity,'divine');assert.ok(M.AFFIXES[top.affix]&&['steadfast','ward'].includes(top.affix),'reaching Thần rolls an armor affix');
  assert.deepEqual(top.sockets,['hp-3',null,null,null],'four sockets at Thần, the gem still in the first');assert.equal(top.level,7);assert.equal(e.read().materials.divineOre,0);
  assert.throws(()=>e.upgradeRarity('u'),/Thần/,'cannot go past Thần');assert.equal(e.upgradeRarityPreview('u').max,true);
  edit(p=>{p.equipment.push({id:'c',slot:'weapon',rarity:'common',level:3,affix:null});});const c=e.upgradeRarity('c').gear;assert.equal(c.rarity,'uncommon');assert.equal(c.sockets,undefined,'Tốt has no socket');assert.equal(c.level,3);
  edit(p=>{p.equipment.find(x=>x.id==='c').rarity='legendary';p.materials.divineOre=50;});assert.ok(['stun','lifesteal','pierce'].includes(e.upgradeRarity('c').gear.affix),'a weapon gets a weapon affix');
  edit(p=>{delete p.heroes.novice.gear.armor;p.equipment.find(x=>x.id==='u').locked=false;});const v=M.salvageValue(e.read().equipment.find(x=>x.id==='u'));assert.equal(v.gold,Math.ceil(11*80)+Math.floor(900*28*.7),'salvage refunds strengthen cost only, not the upgrade');
}
{ // After stage 300 the weekly Trùm Vô Tận quest adds 10 thần thạch.
  clock=Date.UTC(2026,10,4,6);const {engine:e,edit}=fixture();
  assert.equal(e.weekly().find(q=>q.id==='boss').reward.divineOre,undefined);edit(p=>{p.campaign.cleared=300;p.weekly.progress.boss=8;});
  assert.equal(e.weekly().find(q=>q.id==='boss').reward.divineOre,10);const d0=e.read().materials.divineOre||0;const got=e.claimWeekly('boss');assert.equal(got.divineOre,10);assert.equal(e.read().materials.divineOre,d0+10);
  assert.equal(M.WEEKLY.find(q=>q.id==='boss').reward.divineOre,undefined,'the base table is untouched');
}
console.log('rarity up ok');
{ // Đồ hiến (owner + Codex 04/11): 0–3 same-rarity pieces cut 20% each of ore/wood/cloth (cap 60%, rounded up); gold,
  // essence and thần thạch stay; each refunds 70% of its strengthen gold/ore (rounded down) and all its gems; one transaction.
  assert.deepEqual(M.rarityUpCostWith('rare',3),{gold:40000,ore:10,wood:6,cloth:6,essence:10},'25/15/15 → 10/6/6 with 3 pieces, essence stays');
  assert.deepEqual(M.rarityUpCostWith('rare',1),{gold:40000,ore:20,wood:12,cloth:12,essence:10});
  assert.deepEqual(M.rarityUpCostWith('rare',2),{gold:40000,ore:15,wood:9,cloth:9,essence:10});
  assert.deepEqual(M.rarityUpCostWith('rare',5),M.rarityUpCostWith('rare',3),'cap 60%');
  const thần=M.rarityUpCostWith('legendary',3);assert.equal(thần.divineOre,50,'Thần still needs 50 thần thạch');assert.equal(thần.gold,72000);
  assert.deepEqual(M.fodderRefund([{level:4},{level:0}]),{gold:Math.floor(900*10*.7),ore:Math.floor(2*10*.7)});
  const {engine:e,edit}=fixture();
  edit(p=>{p.campaign.cleared=60;p.wallet.gold=1e6;p.wallet.gems=7;Object.assign(p.materials,{ore:500,wood:500,cloth:500,essence:500,divineOre:0});p.gems={};
    p.heroes.fire={level:1,stars:1,evolution:0,copies:1,skills:[1,0,0,0],gear:{},relic:{level:1,evolution:1},ticketMilestones:[]};
    p.equipment.push({id:'main',slot:'weapon',rarity:'rare',level:5,affix:null,sockets:['atk-2']},
      {id:'f1',slot:'boots',rarity:'rare',level:4,affix:null,sockets:['hp-3']},{id:'f2',slot:'helmet',rarity:'rare',level:0,affix:null},{id:'f3',slot:'armor',rarity:'rare',level:2,affix:null},
      {id:'worn',slot:'pants',rarity:'rare',level:0,affix:null},{id:'lock',slot:'glasses',rarity:'rare',level:0,affix:null,locked:true},{id:'sig',slot:'weapon',rarity:'rare',level:0,affix:null,signature:'fire'},
      {id:'epic',slot:'boots',rarity:'epic',level:0,affix:null},{id:'f4',slot:'boots',rarity:'rare',level:1,affix:null});
    p.heroes.novice.gear.weapon='main';p.heroes.fire.gear.pants='worn';});
  const cand=e.upgradeRarityPreview('main').candidates.map(g=>g.id);assert.deepEqual(cand.sort(),['f1','f2','f3','f4'],'only same rarity, unworn, unlocked, not signature, not itself');
  assert.equal(e.upgradeRarityPreview('main').fodder.length,0,'never pre-selected');
  for(const bad of [['worn'],['lock'],['sig'],['epic'],['main'],['f1','f1'],['f1','f2','f3','f4'],['nope']])assert.throws(()=>e.upgradeRarity('main',bad),/hiến/,'rejects '+bad);
  assert.equal(e.read().equipment.find(x=>x.id==='main').rarity,'rare','nothing half done');assert.equal(e.read().equipment.length,9);
  const pre=e.upgradeRarityPreview('main',['f1','f2','f3']);assert.equal(pre.cut,60);assert.deepEqual(pre.cost,{gold:40000,ore:10,wood:6,cloth:6,essence:10});assert.equal(pre.gems,1);
  assert.deepEqual(pre.refund,{gold:Math.floor(900*10*.7)+Math.floor(900*3*.7),ore:Math.floor(20*.7)+Math.floor(6*.7)});
  // Atomicity: short of essence → nothing consumed, nothing refunded.
  edit(p=>{p.materials.essence=9;});const snap=JSON.stringify(e.read().equipment);assert.throws(()=>e.upgradeRarity('main',['f1','f2','f3']),/Tinh hoa/);
  assert.equal(JSON.stringify(e.read().equipment),snap,'a failed upgrade keeps every piece');edit(p=>{p.materials.essence=500;});
  // Locked between preview and confirm: rechecked.
  edit(p=>{p.equipment.find(x=>x.id==='f3').locked=true;});assert.throws(()=>e.upgradeRarity('main',['f1','f2','f3']),/hiến/);edit(p=>{p.equipment.find(x=>x.id==='f3').locked=false;});
  const b=e.read(),r=e.upgradeRarity('main',['f1','f2','f3']),a=e.read(),g=a.equipment.find(x=>x.id==='main');
  assert.deepEqual([g.rarity,g.level],['epic',5]);assert.deepEqual(g.sockets,['atk-2',null],'the main piece keeps level and gems');assert.equal(r.consumed,3);
  assert.equal(a.equipment.length,b.equipment.length-3);for(const id of ['f1','f2','f3'])assert.ok(!a.equipment.some(x=>x.id===id),'consumed');
  assert.equal(a.gems['hp-3'],1,'socketed gems return to the bag');
  assert.equal(b.wallet.gold-a.wallet.gold,40000-pre.refund.gold,'gold: full price, refund of strengthening');assert.equal(b.materials.ore-a.materials.ore,10-pre.refund.ore);
  assert.equal(b.materials.wood-a.materials.wood,6);assert.equal(b.materials.cloth-a.materials.cloth,6);assert.equal(b.materials.essence-a.materials.essence,10);
  assert.equal(a.wallet.gems,7,'no Đá Ngọc granted or spent');assert.equal(a.heroes.fire.gear.pants,'worn');
  assert.deepEqual(e.upgradeRarityPreview('main').candidates.map(x=>x.id),['epic'],'next step offers the new rarity');
}
console.log('rarity up fodder ok');
{ // Sổ Hành Trình timeline (owner 2026-11-04): quest points raise levels, free nodes open as reached, the gold and
  // jewel tracks only after a server-recorded purchase, jewel gear chests wait for their stage. No Đá Ngọc anywhere.
  const O=require('../../src/gemwoven/liveops.js');const {engine:e,edit}=fixture();
  let v=e.pass();assert.equal(v.level,0);assert.equal(v.points,0);assert.equal(v.rows.length,50);assert.equal(v.ready,0);
  assert.equal(typeof e.setPassOwned,'undefined','the client cannot activate a paid track');
  e.claimDaily('login');assert.equal(e.pass().points,O.PASS.points.daily,'a daily quest gives pass points');
  edit(p=>{p.weekly.progress.campaign=15;});e.claimWeekly('campaign');v=e.pass();assert.equal(v.points,50+150);assert.equal(v.level,2);assert.equal(v.into,0);
  assert.deepEqual(v.rows.slice(0,3).map(r=>r.free.state),['ready','ready','level']);assert.equal(v.rows[0].gold.state,'track');assert.equal(v.rows[0].jewel.state,'track');
  assert.equal(e.notices().claim.vip,2,'red dot = free nodes to take now, not the locked paid ones');
  const gold=e.read().wallet.gold;assert.deepEqual(e.claimPass(1,'free'),{gold:3200});assert.equal(e.read().wallet.gold,gold+3200);
  assert.throws(()=>e.claimPass(1,'free'),/Đã nhận/);assert.throws(()=>e.claimPass(3,'free'),/cấp sổ 3/);assert.throws(()=>e.claimPass(2,'gold'),/kích hoạt/);
  assert.equal(e.notices().claim.vip,1);
  // A purchase recorded by the server mid-season opens every reached node of that track.
  edit(p=>{p.pass.owned.gold=true;p.pass.points=2600;});v=e.pass();assert.equal(v.level,26);assert.ok(v.owned.gold&&!v.owned.jewel);
  assert.equal(v.rows.filter(r=>r.gold.state==='ready').length,26);assert.equal(v.rows[24].jewel.state,'track');
  // Jewel includes gold; its level-25 Sử Thi chest waits for stage 60; claim-all skips it and takes the rest.
  edit(p=>{p.pass.owned={gold:false,jewel:true};p.campaign.cleared=20;});v=e.pass();assert.ok(v.owned.gold&&v.owned.jewel);assert.equal(v.rows[24].jewel.state,'stage');assert.equal(v.rows[24].jewel.gate,60);
  assert.throws(()=>e.claimPass(25,'jewel'),/ải 60/);
  const all=e.claimPassAll();assert.equal(all.gems,undefined);assert.equal(all.fragmentChoice,40,'levels 10 and 20 give hero fragment vouchers');
  v=e.pass();assert.equal(v.ready,0);assert.equal(v.rows[24].jewel.state,'stage');assert.equal(v.vouchers.fragmentChoice,40);assert.throws(()=>e.claimPassAll(),/Chưa có mốc/);
  edit(p=>{p.campaign.cleared=60;});assert.deepEqual(e.claimPass(25,'jewel'),{epicGearChoice:1,divineOre:2});
  for(let l=1;l<=O.PASS.levels;l++)for(const t of ['free','gold','jewel'])assert.equal(O.PASS[t](l).gems,undefined);
  // A new season (00:00 GMT+7, 28 days from the anchor Monday) starts at zero and grants what was left to take.
  edit(p=>{p.pass.points=2700;});assert.equal(e.pass().ready,3);
  clock=O.passSeason(clock).end+3600000;v=e.pass();assert.equal(v.season,1);assert.equal(v.level,0);assert.ok(!v.owned.gold&&!v.owned.jewel,'a purchase covers one season');
  assert.equal(v.last.count,3,'leftover rewards are granted, not lost');
  // VIP progress: 1 point per 1.000 ₫ verified, one cumulative scale, VIP 12 is the top.
  assert.deepEqual(M.vipProgress(0),{level:0,points:0,from:0,next:{level:1,points:100},need:100,ratio:0,max:false});
  const mid=M.vipProgress(450000);assert.equal(mid.level,2);assert.equal(mid.need,150);assert.equal(mid.ratio,.5);
  assert.ok(M.vipProgress(1e9).max);assert.equal(M.vipProgress(1e9).level,12);assert.equal(e.vip().level,0);
  assert.equal(e.monthlyCard().active,false,'no local card purchase');
}
console.log('journey pass ok');
{ // Cúp Đấu Trường (§12.5, Codex arena rounds 1–2): month calendar, symmetric Elo, daily matches, AI field, knockout, no rewards.
  const O=require('../../src/gemwoven/liveops.js'),H7=7*3600000;
  const s=M.cupSeason(Date.UTC(2026,10,3,20));assert.deepEqual([s.key,s.date,s.raceDays,s.phase],['2026-11',4,27,'race'],'UTC+7 calendar day');
  assert.deepEqual([M.cupSeason(Date.UTC(2026,10,28)-H7).phase,M.cupSeason(Date.UTC(2026,10,28)-H7).round,M.cupSeason(Date.UTC(2026,10,30,16,59)).round],['finals',1,3],'quarter D−2 … final D');
  assert.equal(M.cupDelta(1000,1000,1),20);assert.equal(M.cupDelta(1000,1000,0),-20,'symmetric at equal ratings');
  assert.equal(M.cupDelta(1000,2000,1),M.cupDelta(1000,1240,1),'gap capped at ±240');assert.equal(M.cupDelta(5,1000,0),-5,'nobody drops below 0');
  const field=M.cupField('2026-11');assert.equal(field.length,31);assert.deepEqual(M.cupField('2026-11'),field,'same field on every device');
  assert.ok(field.every(f=>M.heroAvailable(f.hero)),'AI copies use released heroes only');
  const sim=M.cupSimulate('2026-11',27);assert.equal(sim.reduce((n,r)=>n+r.points,0),31*1000,'AI matches only move points between them');
  assert.ok(sim.every(r=>r.played<=27*5),'an AI plays at most 5 matches a day');
  const map=new Map(),st={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};let at=Date.UTC(2026,10,4,5);
  const e=M.makeEngine(st,{now:()=>at,random:()=>.3}),before=JSON.stringify(e.read().wallet);
  assert.equal(e.cupSync().tickets,5);const b=e.begin('cup',1,{hero:'fire'});assert.equal(b.mode,'cup');assert.equal(b.hero,'fire','any released hero can be borrowed');
  assert.deepEqual([b.stats.form,b.stats.evolution,b.stats.skills.join(),b.stats.affixes.length,b.stats.treasure],[1,0,'1,0,0,0',0,null],'Chuẩn Hóa: base form, rank-1 skills, no gear/treasure');
  assert.throws(()=>e.begin('cup',1,{hero:'ice'}),/chưa phát hành/);
  const r=e.settle(b.token,true,0);assert.ok(r.cup.won&&r.cup.delta>0);assert.equal(JSON.stringify(e.read().wallet),before,'the prototype grants nothing');
  const q=e.begin('cup',1,{});const lost=e.cup().you.points;e.begin('cup',1,{});assert.equal(e.cup().you.played,3,'leaving a started match keeps it as a loss');assert.ok(lost<1000+r.cup.delta);
  for(let i=0;i<2;i++)e.settle(e.begin('cup',1,{}).token,false,0);assert.throws(()=>e.begin('cup',1,{}),/Hết lượt/);
  at+=86400000*3;assert.equal(e.cupSync().tickets,10,'unused matches bank to 10');
  for(let d=7;d<=27;d++){at=Date.UTC(2026,10,d,5);e.cupSync();for(let i=0;i<5;i++)e.settle(e.begin('cup',1,{}).token,true,0);}
  const v=e.cup();assert.ok(v.you.ranked&&v.you.eligible,'30+ matches, 5 in the last 7 days');
  at=Date.UTC(2026,10,28,5);const f=e.cupSync();assert.equal(f.tickets,0);assert.ok(f.match&&f.match.round===1,'your quarter-final today');
  assert.deepEqual(f.finals.seeds.slice(0,1).map(x=>x.you),[true]);
  for(let i=0;i<2;i++)e.settle(e.begin('cup',1,{}).token,true,0);assert.equal(e.cup().match,null,'BO3 decided at 2 wins');
  at=Date.UTC(2026,10,29,14);e.cupSync();for(let i=0;i<2;i++)e.settle(e.begin('cup',1,{}).token,false,0);
  at=Date.UTC(2026,11,1,5);const next=e.cupSync();assert.equal(next.season.key,'2026-12');assert.equal(next.history[0].finish,'semi');assert.equal(next.history[0].champion.ai,true,'an AI copy won the local final');
  assert.equal(next.you.points,1000,'a new month starts from 1.000');
  for(const z of O.CUP_PRIZES){assert.equal(z.reward?.gems,undefined,'No Đá Ngọc in cup prizes');assert.equal(z.reward?.treasurePoints,undefined);}
  assert.deepEqual(O.CUP_PRIZES.filter(z=>z.reward).map(z=>z.id),['done'],'only the completion pack holds resources');
  assert.ok(M.TITLE_RULES.filter(t=>t.id.startsWith('cup-')).every(t=>t.server),'cup titles are server titles');
}
console.log('cup ok');
{ // D3 (Claude + Codex): Bụi Ký Ức, Cửa Hàng Ký Ức, the free day-28 chest and banner rotation rules. No Đá Ngọc anywhere.
  const O=require('../../src/gemwoven/liveops.js'),X=O.MEMORY,six=(o={})=>({level:1,stars:6,evolution:0,copies:1,skills:[1,0,0,0],gear:{},relic:{level:1,evolution:1},ticketMilestones:[],...o});
  assert.deepEqual([X.copyDust,X.fragmentDust,X.weeklyDust,X.cupDust,X.cupLocalDust,X.price,X.bundle,X.capPerHeroWeek,X.heroesPerWeek,X.minDaysSinceFirstBanner,X.chest.fragments],[80,1,40,30,0,8,10,40,2,42,20]);
  assert.ok(!Object.keys(M.RESOURCES).includes('memoryDust')&&!M.MAIL_RESOURCES.includes('memoryDust'),'dust is not a wallet resource and cannot be mailed');
  assert.ok(!M.WORLD.SHOP.some(r=>r.target==='memoryDust'),'dust is never sold');assert.equal(M.WEEKLY.find(q=>q.id==='daily').reward.memoryDust,X.weeklyDust);
  clock=Date.UTC(2026,10,4,6);let {engine:e,edit}=fixture();
  // Conversion: spare copies 80 and spare fragments 1 each, once, the main copy kept; Hiro and preview heroes are outside.
  edit(p=>{p.heroes.novice=six({copies:4});p.fragments.novice=50;p.heroes.fire=six({copies:3});p.fragments.fire=25;});
  e.claimDaily('login');let p=e.read();assert.equal(p.memory.dust,2*80+25);assert.deepEqual([p.heroes.fire.copies,p.fragments.fire],[1,0],'main copy kept');
  assert.deepEqual([p.heroes.novice.copies,p.fragments.novice],[4,50],'Hiro gives no dust');
  e.select('novice');assert.equal(e.read().memory.dust,185,'converted once');
  edit(p=>{p.fragments.fire=5;p.heroes.fire.copies=2;});e.select('novice');assert.equal(e.read().memory.dust,185+85,'later gains convert too');
  edit(p=>{p.previewGrants=['noct-preview-2026-10'];p.heroes.shadow=six({copies:5});});e.select('novice');assert.equal(e.read().heroes.shadow.copies,5,'test heroes never feed the economy');
  // Reaching 6★ converts what is left after the star cost.
  edit(p=>{p.heroes.earth=six({stars:5,copies:1+8+3});p.wallet.gold=2e6;p.materials.essence=500;});e.starUp('earth');assert.equal(e.read().heroes.earth.copies,1);assert.equal(e.read().memory.dust,270+3*80);
  // Weekly milestone: 40 dust once a week from the third weekly quest.
  edit(p=>{p.weekly.progress.daily=12;});assert.equal(e.claimWeekly('daily').memoryDust,40);assert.throws(()=>e.claimWeekly('daily'),/Đã nhận/);assert.equal(e.read().memory.dust,550);
  // Today only Mika is released and she is on the banner: an empty shelf, dust kept.
  let v=e.memory();assert.ok(v.empty);assert.equal(v.dust,550);assert.equal(v.banner,'fire');assert.throws(()=>e.buyMemory('fire'),/không có trên kệ/);assert.throws(()=>e.buyMemory('novice'),/không có trên kệ/);
  assert.equal(e.read().wallet.gems,0,'no Đá Ngọc');
  // Banner rules: 14-day periods from 02/11/2026, reruns 3+ periods apart, rotation only with 3+ released rare heroes.
  const rel={fire:'2026-11-02',ice:'2026-11-16',earth:'2026-11-30'};
  assert.equal(M.bannerPeriod(Date.parse('2026-11-16T00:00:00+07:00')).index,1);assert.equal(M.bannerPeriod(Date.parse('2026-11-15T23:59:00+07:00')).index,0);
  assert.equal(M.bannerCheck([{period:0,hero:'fire'},{period:1,hero:'ice'},{period:2,hero:'fire'}],rel).length,1,'a rerun after 2 periods is refused');
  assert.deepEqual(M.bannerCheck([{period:0,hero:'fire'},{period:1,hero:'ice'},{period:2,hero:'earth'},{period:3,hero:'fire'}],rel),[],'A → B → C → A');
  assert.equal(M.bannerCheck([{period:1,hero:'shadow'}],rel).length,1,'an unreleased hero cannot be scheduled');
  const sched=[{period:0,hero:'fire'},{period:1,hero:'ice'},{period:2,hero:'earth'},{period:3,hero:'fire'}];
  assert.equal(M.bannerPlan(clock,{releases:{fire:'2026-11-02',ice:'2026-11-16'},schedule:sched}).rotating,false,'two rare heroes: Mika stays permanent');
  let plan=M.bannerPlan(Date.parse('2026-11-20T12:00:00+07:00'),{releases:rel,schedule:sched});assert.deepEqual([plan.rotating,plan.hero,plan.next.hero],[true,'ice','earth']);
  plan=M.bannerPlan(Date.parse('2026-12-20T12:00:00+07:00'),{releases:rel,schedule:sched});assert.equal(plan.next,null,'nothing announced: "Chưa công bố"');
  assert.equal(M.bannerPlan(clock).next,null);assert.ok(O.BANNER.pityCarries);
  edit(p=>{p.summon.dry=57;});const keep=clock;clock+=15*DAY;assert.equal(e.read().summon.dry,57,'pity carries into the next period');clock=keep;
  // Shelf: released, off the banner, 42+ days past the first banner, never Hiro; two a week in turn, fixed at Monday 00:00 GMT+7.
  assert.deepEqual(M.memoryOffer(Date.parse('2027-01-06T12:00:00+07:00'),{releases:rel,schedule:sched}).heroes,['ice'],'Nori is only 35 days past her first banner');
  const four={fire:'2026-11-02',ice:'2026-11-02',earth:'2026-11-02',lightning:'2026-11-02',novice:'2026-11-02'},weeks=['2026-12-16','2026-12-23','2026-12-30'].map(d=>M.memoryOffer(Date.parse(d+'T12:00:00+07:00'),{releases:four,schedule:[]}).heroes);
  assert.deepEqual(weeks,[['earth','ice'],['lightning','earth'],['ice','lightning']],'every eligible hero comes round; Mika on the banner and Hiro never');
  assert.deepEqual(M.memoryOffer(Date.parse('2026-12-13T23:59:00+07:00'),{releases:four,schedule:[]}).heroes,[],'the week before day 42 is still empty');
  // Buying (simulated release of Yuki and Nori): 80 dust for 10, 40 a hero a week, unowned allowed, 6★ refused, weekly reset.
  Object.assign(M.RELEASES,{ice:'2026-09-01',earth:'2026-09-15'});
  try{({engine:e,edit}=fixture());edit(p=>{p.memory={dust:500,week:'',bought:{},season:-1,chest:false,vouchers:0,log:[]};p.heroes.earth=six();});
    v=e.memory();assert.deepEqual(v.heroes.map(h=>h.hero),['ice','earth']);assert.ok(v.heroes[0].canBuy&&!v.heroes[1].canBuy);
    assert.throws(()=>e.buyMemory('earth'),/6★/);for(let i=0;i<4;i++)e.buyMemory('ice');assert.throws(()=>e.buyMemory('ice'),/40 mảnh/);
    p=e.read();assert.deepEqual([p.memory.dust,p.fragments.ice,p.wallet.gems],[500-320,40,0]);
    clock=Date.UTC(2026,10,8,17,1);assert.equal(e.memory().heroes[0].left,40,'Monday 00:01 GMT+7: a new week');e.buyMemory('ice');e.buyMemory('ice');
    edit(p=>{p.memory.dust=300;p.fragments.ice=80;});e.fuse('ice');assert.ok(e.read().heroes.ice,'80 fragments fuse an unowned hero');
    edit(p=>{p.memory.dust=0;});assert.throws(()=>e.buyMemory('ice'),/Cần 80/);
  }finally{delete M.RELEASES.ice;delete M.RELEASES.earth;clock=Date.UTC(2026,10,4,6);}
  // Day-28 chest: 20 fragments of an owned hero (not Hiro, not 6★), otherwise a voucher that never expires.
  ({engine:e,edit}=fixture());const s0=O.passSeason(clock);assert.throws(()=>e.claimMemoryChest(),/ngày 28/);
  clock=s0.start+27*DAY+3600000;assert.ok(e.memory().chest.ready);assert.ok(e.notices().claim.events>=1,'the chest lights the Sự Kiện dot');
  assert.throws(()=>e.claimMemoryChest('novice'),/Hiro/);assert.deepEqual(e.claimMemoryChest(),{voucher:1},'Hiro only: a voucher');assert.throws(()=>e.claimMemoryChest(),/Đã nhận/);
  edit(p=>{p.heroes.fire=six({stars:3});p.heroes.shadow=six();});assert.deepEqual(e.memory().chest.choices,['fire'],'owned, not Hiro, not 6★');
  assert.throws(()=>e.useMemoryVoucher('shadow'),/6★/);assert.deepEqual(e.useMemoryVoucher('fire'),{hero:'fire',fragments:20});assert.throws(()=>e.useMemoryVoucher('fire'),/Không có phiếu/);
  clock=s0.end+3600000;e.select('novice');assert.equal(e.memory().vouchers,0,'claimed season: nothing carried');
  clock=O.passSeason(clock).end+3600000;e.select('novice');assert.equal(e.memory().vouchers,1,'an unclaimed chest is kept as a voucher');
  clock=O.passSeason(clock).start+27*DAY+60000;assert.throws(()=>e.claimMemoryChest(),/chọn một tướng/);assert.equal(e.claimMemoryChest('fire').fragments,20);
  // Cúp Đấu Trường dust is server-only: the local prototype gives none.
  assert.deepEqual(O.CUP_PRIZES.find(z=>z.id==='done').serverReward,{memoryDust:30});
  clock=Date.UTC(2026,10,4,6);({engine:e}=fixture());const cb=e.begin('cup',1,{hero:'fire'});e.settle(cb.token,true,0);assert.equal(e.memory().dust,0);
}
console.log('memory dust ok');
{ // Vàng đổi bằng Đá Ngọc (owner 04/11, Claude + Codex topup round): 3 packs of 2R / 6R / 12R gold, R = offlineRate(p).gold,
  // one shared daily cap of 12 R per account reset 00:00 GMT+7, no VIP multiplier, spends Đá Ngọc and never grants it.
  const O=require('../../src/gemwoven/liveops.js');
  clock=Date.UTC(2026,10,4,6);const {engine:e,edit}=fixture();edit(p=>{p.wallet.gems=1000;p.wallet.gold=0;});
  assert.deepEqual(M.GOLD_PACKS.map(x=>[x.gems,x.units]),[[20,2],[60,6],[120,12]]);assert.equal(M.GOLD_DAILY_UNITS,12);
  const R=M.offlineRate(e.read()).gold,v=e.goldShop();assert.equal(v.rate,R);assert.deepEqual(v.packs.map(x=>x.gold),[2*R,6*R,12*R],'the shop shows the real gold amount');
  let r=e.buyGold('gold-pack-1');assert.equal(r.gold,2*R);assert.equal(e.read().wallet.gems,980,'spends Đá Ngọc');assert.equal(e.read().wallet.gold,2*R);
  e.buyGold('gold-pack-2');assert.equal(e.goldShop().left,4);assert.throws(()=>e.buyGold('gold-pack-2'),/hạn mức/,'the small and medium packs share one cap');
  e.buyGold('gold-pack-1');e.buyGold('gold-pack-1');assert.equal(e.goldShop().left,0);assert.throws(()=>e.buyGold('gold-pack-1'),/đủ vàng/);
  assert.equal(e.read().wallet.gold,12*R);assert.equal(e.read().wallet.gems,1000-20*3-60,'no gems ever come back');
  clock=Date.UTC(2026,10,4,16,59);assert.equal(e.goldShop().left,0,'23:59 GMT+7 is still the same day');
  clock=Date.UTC(2026,10,4,17,1);assert.equal(e.goldShop().left,12,'00:00 GMT+7 resets the cap');
  // The rate follows account progress (highest hero level, stages cleared), not the selected hero or VIP.
  edit(p=>{p.campaign.cleared=200;p.heroes.novice.level=120;p.vip={...p.vip,level:9};});const R2=M.offlineRate(e.read()).gold;
  assert.equal(R2,80+120*8+200*10);assert.equal(e.buyGold('gold-pack-3').gold,12*R2,'no VIP multiplier');
  edit(p=>{p.wallet.gems=10;});clock+=DAY;assert.throws(()=>e.buyGold('gold-pack-1'),/Thiếu Đá Ngọc/);assert.equal(e.goldShop().packs[0].canBuy,false);
  assert.throws(()=>e.buyGold('gems-1'),/không hợp lệ/);
  // Nạp page packs: config only; payment is Coming soon and nothing in this client grants gems or VIP.
  assert.deepEqual(O.GEM_PACKS.map(x=>[x.price,x.gems]),[[22000,60],[109000,300],[349000,980],[699000,1980],[1149000,3280],[2199000,6480]]);
  for(const x of O.GEM_PACKS){assert.equal(x.firstBonus,x.gems,'Lần đầu ×2 per tier');assert.equal(x.status,'coming-soon');assert.ok(O.PRODUCTS.includes(x));}
  assert.equal(O.TOPUP.vndPerVipPoint,1000);assert.equal(O.TOPUP.bonusAddsVip,false);assert.equal(M.vipProgress(22000).points,22,'VIP counts money paid, not bonus gems');
  assert.equal(typeof e.topup,'undefined','no client-side top-up');
}
console.log('gold for gems ok');
