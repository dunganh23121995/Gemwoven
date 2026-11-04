/* Live-ops configuration (docs/GAME_DESIGN.md §9–15): VIP, cards, pass, growth fund, event cadence,
 * arena leagues, treasures and titles. One source for the hub's Coming-soon pages, the tests and the
 * future server. Nothing here grants anything: every purchase and reward is settled by the server.
 * Đá Ngọc appears only as delivery of a verified purchase (cards, fund, gem packs), never as a reward.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenLiveOps=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const STATUS='coming-soon';
  // VIP from verified top-ups (VND). Perks are convenience, daily resources and cosmetics: never combat stats.
  // A refunded or charged-back purchase is reversed in the server ledger and VIP is recomputed from it.
  const VIP=[
    {level:1,spend:100000,perks:['Khung avatar VIP','Quà ngày 500 vàng']},
    {level:2,spend:300000,perks:['Quét ải 3★','Quà ngày 1.000 vàng']},
    {level:3,spend:600000,perks:['Hiệu ứng vào trận','+1 lượt Trùm Vô Tận có thưởng','Tích lũy 13 giờ']},
    {level:4,spend:1000000,perks:['Cửa hàng VIP 2 ô','Gói Quà VIP 4']},
    {level:5,spend:2000000,perks:['Bong bóng chat VIP','+1 lượt Trùm Vô Tận có thưởng']},
    {level:6,spend:4000000,perks:['Hàng đợi rèn thứ hai','Tích lũy 14 giờ']},
    {level:7,spend:7000000,perks:['+1 lượt Trùm Vô Tận có thưởng','Cửa hàng VIP 4 ô']},
    {level:8,spend:12000000,perks:['Trang phục trang bị độc quyền (không chỉ số)']},
    {level:9,spend:20000000,perks:['+1 lượt Trùm Vô Tận có thưởng','Tích lũy 15 giờ']},
    {level:10,spend:35000000,perks:['Trang phục tướng độc quyền (không chỉ số)']},
    {level:11,spend:60000000,perks:['Khung và danh hiệu Đại Phú Hộ']},
    {level:12,spend:100000000,perks:['Chăm sóc khách hàng riêng','Tích lũy 16 giờ']}
  ].map(v=>({...v,dailyGold:v.level>=2?1000:500,combatStats:false}));
  // Payment products (suggested prices, Codex review: 109k card, 149k pass, 299k fund). No lifetime card
  // (owner, 2026-11-03): the pass has a third, higher track instead.
  const PRODUCTS=[
    {id:'monthly-card',name:'Thẻ Tháng',price:109000,days:30,stackMaxDays:180,gemsNow:300,gemsDaily:100,
      perks:['300 Đá Ngọc ngay khi mua','100 Đá Ngọc mỗi ngày trong 30 ngày (tự vào Hòm Thư nếu quên đăng nhập)','Trần offline +2 giờ','+1 lượt Trùm Vô Tận có thưởng mỗi ngày','Quét ải 3★ không cần vé quét']},
    {id:'journey-pass',name:'Sổ Hành Trình · Nhánh Vàng',price:149000,perks:['Mở nhánh Vàng của mùa hiện tại','Nhận ngay mọi phần thưởng Vàng của các cấp đã đạt','Không có Đá Ngọc trong sổ']},
    {id:'journey-pass-jewel',name:'Sổ Hành Trình · Nhánh Diệu Ngọc',price:299000,upgradeFrom:'journey-pass',upgradePrice:150000,
      perks:['Gồm nhánh Vàng, thêm nhánh Diệu Ngọc (đã mua Vàng thì bù 150.000₫, không mua trùng)','+10 cấp sổ ngay khi mua (tính vào giới hạn 10 cấp mua mỗi mùa)','80 Mảnh tướng tự chọn mỗi mùa: tướng đã sở hữu, trừ Hiro; tài khoản chỉ có Hiro nhận phiếu chọn không hết hạn','Rương trang bị Sử Thi (cấp 25, nhận khi đã qua ải 60) và Huyền Thoại (cấp 50, nhận khi đã qua ải 80) tự chọn ô','Khung avatar và danh hiệu mùa (không chỉ số)','Không có Đá Ngọc; sức mạnh mua tắt ở hàng Chuẩn Hóa']},
    {id:'growth-fund',name:'Quỹ Trưởng Thành',price:299000,perks:['Đá Ngọc và tài nguyên ở các mốc cấp tướng cao nhất','Trả theo tiến độ, không hết hạn']}
  ];
  // Đá Ngọc packs on the Nạp page (owner 04/11, Claude + Codex topup round; trial prices). "Lần đầu ×2": the first verified
  // purchase of each tier delivers the same amount again as a bonus, once per tier, gem packs only. VIP counts only the
  // money actually paid (1 point per 1.000 ₫); bonus gems and spending gems never add VIP. Payment is a future server
  // feature: until then every pack opens a Coming-soon sheet and nothing is charged, granted or marked as used.
  const GEM_PACKS=[[22000,60],[109000,300],[349000,980],[699000,1980],[1149000,3280],[2199000,6480]]
    .map(([price,gems],i)=>({id:'gems-'+(i+1),kind:'gems',tier:i+1,name:gems.toLocaleString('vi-VN')+' Đá Ngọc',price,gems,firstBonus:gems,status:STATUS}));
  PRODUCTS.push(...GEM_PACKS);
  const TOPUP={vndPerVipPoint:1000,firstBonus:'once-per-tier',bonusAddsVip:false,status:STATUS};
  // Growth fund ("speed pass"): delivery of a purchase, unlocked by the highest hero level.
  const GROWTH_FUND=[[10,300],[20,300],[30,400],[50,500],[70,500],[100,600],[130,600],[160,700],[200,800],[250,900],[300,1400]].map(([level,gems])=>({level,gems}));
  // Journey pass: 28-day season, 50 levels from daily/weekly activity points (never from payment, apart from
  // the jewel track's 10 levels at purchase). Three tracks: free, gold (149k), jewel (299k, includes gold).
  // Jewel: fragments only for heroes already owned (summons stay the way to a new hero), choice gear chests.
  // Codex round 3: the jewel track's +10 levels count toward the 10 bought levels; fragment chests never hold
  // Hiro (his fragments are not sold) or a hero not owned; gear chests open at the forge gates (stages 60/80).
  const PASS={seasonDays:28,levels:50,pointsPerLevel:100,boughtLevelsMax:10,boughtLevelsLastDays:7,jewelBonusLevels:10,boughtIncludesJewel:true,
    fragmentRule:{ownedOnly:true,exclude:['novice'],hiroOnlyVoucher:true},gearGates:{epicGearChoice:60,legendaryGearChoice:80},seasonTitle:'Lữ Khách Diệu Ngọc',
    tracks:[{id:'free',name:'Thường'},{id:'gold',name:'Vàng',product:'journey-pass'},{id:'jewel',name:'Diệu Ngọc',product:'journey-pass-jewel'}],
    free:level=>level%10===0?{tickets:2,essence:20}:level%5===0?{skillBooks:2,ore:20}:{gold:3000+level*200},
    gold:level=>level%10===0?{tickets:5,divineOre:2}:level%5===0?{essence:15,skillBooks:3}:{exp:20+level,ore:10},
    jewel:level=>level===50?{legendaryGearChoice:1,divineOre:10,seasonFrame:1}:level===25?{epicGearChoice:1,divineOre:2}:level%10===0?{fragmentChoice:20}:level%5===0?{divineOre:2,skillBooks:4}:{essence:6,ore:15}};
  // Event cadence (GMT+7). Each window lists what renews; the server owns the calendar. Two-week banner
  // periods and 28-day seasons count from the anchor Monday (period 0 / season 0).
  const CADENCE_ANCHOR='2026-11-02';
  // Pass points come only from claiming quests (owner 2026-11-04, Codex round 1): 4 daily quests a day and 3 weekly
  // ones a week give about 264 points a day, level 50 in about 19-20 days. Seasons start at 00:00 GMT+7 on the anchor
  // Monday and last 28 days; dates before the anchor count as season 0.
  PASS.points={daily:50,weekly:150};
  const SEASON_START=Date.parse(CADENCE_ANCHOR+'T00:00:00+07:00'),SEASON_MS=PASS.seasonDays*86400000;
  function passSeason(at){const index=Math.max(0,Math.floor((at-SEASON_START)/SEASON_MS)),start=SEASON_START+index*SEASON_MS;return {index,start,end:start+SEASON_MS};}
  // Hero seasons (owner 04/11, Claude + Codex "Vòng Mùa của tướng", GAME_DESIGN §20): a season may carry one newly
  // released hero X ("Hành Trình Của X"). Its pass swaps in the hero table below; seasons without an entry keep the generic
  // tables above. `rerun` is the hero re-run in days 15-28 once three rare heroes are out; until then weeks 3-4 are a
  // material event. Season one (index 0, from the anchor Monday) is Mika; every new account still starts with Hiro only.
  const SEASONS=[{index:0,hero:'fire',name:'Hành Trình Của Mika',event:'Đồng Hành Cùng Mika',rerun:null}];
  const seasonHero=index=>SEASONS.find(s=>s.index===index)||null;
  // The season's cosmetics: no stats, usable without owning X. Free-track pieces can be earned locally; paid ones arrive
  // only with a server-recorded purchase. `cosmetic` in a reward names the slot; the season resolves the item.
  const COSMETIC_SLOTS=[['avatar','Avatar'],['frame','Khung avatar'],['title','Danh hiệu'],['nameplate','Thẻ tên'],['bubble','Bong bóng chat'],['combatFrame','Khung trận'],['entry','Hiệu ứng vào trận']];
  const COSMETICS=[
    {id:'mika-avatar',slot:'avatar',season:0,name:'Mika Hỏa Hồ',track:'free',level:10},
    {id:'mika-frame',slot:'frame',season:0,name:'Khung Hỏa Hồ',track:'gold',level:10},
    {id:'mika-title',slot:'title',season:0,name:'Bạn Đồng Hành Hỏa Hồ',track:'gold',level:20},
    {id:'mika-nameplate',slot:'nameplate',season:0,name:'Thẻ tên Hỏa Hồ',track:'gold',level:30},
    {id:'mika-bubble',slot:'bubble',season:0,name:'Bong bóng Hỏa Hồ',track:'gold',level:40},
    {id:'mika-combat-frame',slot:'combatFrame',season:0,name:'Khung trận Hỏa Hồ',track:'jewel',level:25},
    {id:'mika-entry',slot:'entry',season:0,name:'Hồ Hỏa Khai Trận',track:'jewel',level:40}];
  const seasonCosmetic=(season,slot)=>COSMETICS.find(c=>c.season===season&&c.slot===slot)||null;
  // Hero pass (Codex rounds 1-2): free 4 X fragments at levels 5-25 (20 a season, so the free track alone needs several
  // seasons), the avatar at 10; gold the frame/title/nameplate/bubble at 10/20/30/40; jewel the combat frame at 25, the
  // entry effect at 40 and 80 X fragments at 50 (replaces the old 80 choice fragments). The jewel activation gift, one copy
  // of X, is delivered by the server with the purchase (never by this client). Owned X → fragments; X at 6★ → Bụi Ký Ức.
  const HERO_PASS={
    free:level=>({...(level%10===0?{tickets:2,essence:20}:level%5===0?{skillBooks:2,ore:20}:{gold:3000+level*200}),...(level<=25&&level%5===0?{seasonFragments:4}:{}),...(level===10?{cosmetic:'avatar'}:{})}),
    gold:level=>level===50?{tickets:10,divineOre:2}:level%10===0?{tickets:5,divineOre:2,cosmetic:{10:'frame',20:'title',30:'nameplate',40:'bubble'}[level]}:level%5===0?{essence:15,skillBooks:3}:{exp:20+level,ore:10},
    jewel:level=>level===50?{seasonFragments:80,legendaryGearChoice:1,divineOre:10}:level===40?{cosmetic:'entry',essence:60,ore:70}:level===30?{essence:50,ore:60}:
      level===25?{cosmetic:'combatFrame',epicGearChoice:1,divineOre:2}:level===20?{essence:40,ore:50}:level===10?{essence:30,ore:40}:level%5===0?{divineOre:2,skillBooks:4}:{essence:6,ore:15}};
  PASS.activation={jewel:{seasonCopy:1},serverOnly:true};
  PASS.milestones=[10,20,25,30,40,50];
  PASS.reward=(season,track,level)=>(seasonHero(season)?HERO_PASS:PASS)[track](level);
  // Đồng Hành Cùng X (Codex round 2, owner approved catch-up): days 1-14, 30 X fragments a week, 60 in all. Each day the
  // third claimed daily quest stamps that day (2 fragments); weekly tasks count wins from their chapter's first day to
  // day 28 (15 campaign wins → 8, 8 Trùm Vô Tận wins → 8). Catch-up to day 28: a day with 6 PvE wins stamps the earliest
  // missed day 1-14, at most one a day, never more than the 14 day slots. With the 20 free pass fragments a player who
  // plays fully fuses X on day 14. Weeks 3-4 hold a material event while the season has no re-run hero.
  const COMPANION={days:14,until:28,daily:{quests:3,fragments:2},catchup:{wins:6,perDay:1},chapters:[1,8],
    tasks:[{id:'campaign',name:'Thắng 15 trận vượt ải',target:15,fragments:8},{id:'boss',name:'Thắng 8 trận Trùm Vô Tận',target:8,fragments:8}],
    materials:{from:15,chapters:[15,22],daily:{ore:15,essence:5},tasks:{campaign:{skillBooks:2,gold:5000},boss:{essence:15,ore:20}}}};
  COMPANION.total=COMPANION.days*COMPANION.daily.fragments+COMPANION.chapters.length*COMPANION.tasks.reduce((n,t)=>n+t.fragments,0);
  const CADENCE=[
    {id:'daily',name:'Ngày',reset:'00:00',items:['Nhiệm vụ ngày','Sân Thử Luyện theo hệ (2 lượt có thưởng, thử lại thoải mái)','Quà VIP và Thẻ Tháng']},
    {id:'weekly',name:'Tuần',reset:'Thứ Hai 00:00',items:['Nhiệm vụ tuần: 3 vé + 40 Bụi Ký Ức (đang chạy); Mảnh Hiro ~42/tuần từ nhiệm vụ vượt ải hằng ngày','Thưởng hạng Đấu Trường','Cửa hàng tuần làm mới; Cửa Hàng Ký Ức bày 2 tướng','Cuối tuần ×2 luân phiên: vàng ải / nguyên liệu boss']},
    {id:'banner',name:'Kỳ 2 tuần',reset:'Thứ Hai tuần lẻ',items:['Banner tướng (+ vũ khí bản mệnh)','Boss sự kiện theo tướng banner','Cửa hàng đổi mảnh (tối đa 30 mảnh/kỳ)','Báu vật chủ đề: tích nạp nhanh hơn, PvE vẫn đạt được']},
    {id:'season',name:'Mùa 28 ngày',reset:'Thứ Hai đầu mùa',items:['Sổ Hành Trình mới','Mùa Đấu Hạng (reset mềm)','Lịch 28 ngày: rương ngày 28 = 20 mảnh tự chọn (đang chạy)','BXH Trùm Vô Tận']},
    {id:'quarter',name:'Quý',reset:'Tuần đầu quý',items:['Thư Hùng Đại Hội','Trang phục mới','Sự kiện kỷ niệm']}
  ];
  // Kỳ banner (D3, Claude + Codex 04/11): 14-day periods from the anchor, the 100-pull pity carries across periods. A hero
  // runs again only 3+ periods after its last run (two starts at least 42 days apart: A → B → C → A). Rotation is on only
  // once 3+ rare heroes are released; until then Mika stays permanent. `schedule` is what the server has announced
  // ({period, hero}); the summon screen shows the next entry or "Chưa công bố", never a guessed countdown.
  const BANNER={periodDays:14,anchor:CADENCE_ANCHOR,pityCarries:true,rerunGap:3,minRareForRotation:3,schedule:[]};
  // Bụi Ký Ức (D3): "Vật liệu không bán trực tiếp", never bought with money or Đá Ngọc and never mailed. Sources: each spare
  // copy of a 6★ hero 80, each spare fragment of a 6★ hero 1 (converted when the hero reaches 6★ and on every later gain;
  // the main copy stays); the weekly quest milestone 40 a week; Cúp Đấu Trường 30 a month for 10 finished matches, server
  // only (the local prototype gives 0). Hiro is outside the memory system: no dust from Hiro, no Hiro on the shelf.
  // Cửa Hàng Ký Ức: weekly (Monday 00:00 GMT+7), at most 2 heroes in turn among those released, off the current banner and
  // 42+ days past their first banner; 8 dust a fragment, sold 10 at a time, 40 fragments per hero per week; unowned heroes
  // allowed (80 fragments fuse a hero). The free day-28 chest: 20 fragments of an owned hero (not Hiro, not 6★), otherwise
  // a voucher that never expires. The jewel pass track is separate and unchanged.
  const MEMORY={name:'Bụi Ký Ức',desc:'Vật liệu không bán trực tiếp',copyDust:80,fragmentDust:1,weeklyDust:40,cupDust:30,cupServerOnly:true,cupLocalDust:0,
    price:8,bundle:10,capPerHeroWeek:40,heroesPerWeek:2,minDaysSinceFirstBanner:42,chest:{day:28,fragments:20},exclude:['novice']};
  // Ranked arena leagues; MMR (Glicko-2) is hidden, league points are shown. Rewards hold no Đá Ngọc.
  const LEAGUES=['Đồng','Bạc','Vàng','Bạch Kim','Kim Cương'].flatMap((name,t)=>['III','II','I'].map((d,i)=>({id:`${t}-${i}`,name:`${name} ${d}`,tier:t,points:(t*3+i)*100})))
    .concat([{id:'elite',name:'Tinh Anh',tier:5,points:1500},{id:'master',name:'Cao Thủ',tier:6,top:500},{id:'challenger',name:'Thách Đấu',tier:7,top:50}])
    .map(l=>({...l,weekly:{gold:20000+l.tier*15000,arenaMedals:100+l.tier*60,skillBooks:1+Math.floor(l.tier/2)}}));
  const ARENA_RULES={turnSeconds:20,timeoutsToLose:3,reconnectSeconds:60,queues:[
    {id:'open',name:'Tự Do',desc:'Chỉ số thật; ghép theo MMR và chênh Lực chiến tối đa 25%.'},
    {id:'normalized',name:'Chuẩn Hóa',desc:'Mọi người chọn trong cùng danh sách tướng đã phát hành, chỉ số chuẩn, kỹ năng cấp 1; không trang bị, báu vật, VIP.'}],
    seasonRewards:'Khung avatar, danh hiệu mùa, trang phục; top mùa nhận đồ trang trí, không nhận sức mạnh độc quyền.'};
  // Cúp Đấu Trường (monthly cup, docs/GAME_DESIGN.md §12.5; Claude + Codex arena round 1). Rules and the local
  // prototype live in progression.js (CUP, cupView). Ranking prizes are cosmetic only; everyone with 10 matches gets
  // the same small pack. One best ranking pack per player plus the completion pack; prizes are mailed 48 hours after
  // the final once the server has checked the results. No Đá Ngọc, treasure points, socket gems or rank-scaled resources.
  const CUP_PRIZES=[
    {id:'champion',name:'Vô địch',title:'cup-champion',items:['Danh hiệu Quán Quân Tháng (ghi tháng/năm)','Khung chân dung động','Cúp lưu niệm trong hồ sơ','Chân dung vinh danh ở Quảng Trường tháng sau'],frame:'gold'},
    {id:'final',name:'Á quân',title:'cup-final',items:['Danh hiệu Á Quân Tháng','Khung vàng'],frame:'gold'},
    {id:'semi',name:'Hạng 3–4',title:'cup-semi',items:['Danh hiệu Tứ Kiệt Tháng','Khung bạc'],frame:'silver'},
    {id:'eight',name:'Hạng 5–8',title:'cup-eight',items:['Danh hiệu Bát Hùng Tháng','Khung đồng'],frame:'bronze'},
    {id:'top10',name:'Top 10%',items:['Huy chương hồ sơ có tháng/năm']},
    {id:'done',name:'Đủ 10 trận',items:['Dấu tham dự','30 Bụi Ký Ức (máy chủ)'],reward:{gold:20000,exp:20,essence:5},serverReward:{memoryDust:30}}];
  const CUP_SCHEDULE={finalsHour:20,mailAfterHours:48,minField:32,status:STATUS,
    server:['Ghép người thật ±100 điểm, 30 giây mở ±200, 60 giây ±300; 90 giây cho hủy, không mất lượt','Không gặp cùng người quá 2 trận/ngày','Chung kết BO3 20:00; Top 16 dự bị, xác nhận trước 12:00 ngày tứ kết','Cần ít nhất 32 người đủ điều kiện mới trao ngôi vô địch','Lượt 20 giây · 3 lần hết giờ xử thua · 60 giây kết nối lại']};
  // Treasures: account-owned, two slots per hero (the second at evolution 3). Every quality is reachable
  // through PvE in 12–16 weeks; top-ups only make it faster. Boss %HP damage is PvE only and capped.
  const TREASURE_QUALITIES=[{id:'blue',name:'Lam',stat:.04,stats:1},{id:'purple',name:'Tím',stat:.08,stats:2},{id:'orange',name:'Cam',stat:.12,stats:2},{id:'red',name:'Đỏ',stat:.16,stats:3},{id:'divine',name:'Thần',stat:.2,stats:3}];
  const TREASURE_FAMILIES=[
    {id:'mountain',name:'Phá Sơn',desc:'Tuyệt kỹ gây thêm % HP tối đa của mục tiêu, tối đa 8× Công. Chỉ trong PvE.',pveOnly:true},
    {id:'borrow',name:'Mượn Hồn',desc:'Mang tối đa 50% hiệu lực một nội tại (Bị động) của tướng khác. Không mượn tuyệt kỹ.',pveOnly:false},
    {id:'counter',name:'Khắc Chế',desc:'Giảm năng lượng địch khi tuyệt kỹ trúng, kháng choáng. Tắt ở hàng Chuẩn Hóa.',pveOnly:false}];
  // Titles are cosmetic. Achievement titles may later count toward a small account bonus; paid ones never do.
  const TITLES=[
    {id:'pathfinder',name:'Người Mở Lối',source:'Vượt chương 10',paid:false},
    {id:'boss-hunter',name:'Thợ Săn Boss',source:'Hạ 1.000 boss vô hạn',paid:false},
    {id:'collector',name:'Nhà Sưu Tầm',source:'Mở 9 hình thái',paid:false},
    {id:'season-gold',name:'Kiếm Khách Hoàng Kim',source:'Mùa Đấu Hạng · bậc Vàng',paid:false},
    {id:'champion',name:'Thư Hùng Vô Địch',source:'Vô địch Thư Hùng Đại Hội (tên riêng theo khuôn, qua kiểm duyệt)',paid:false},
    {id:'patron',name:'Đại Phú Hộ',source:'VIP 11',paid:true}];
  // Top-up events with a special reward: their hub icon rings twice when the hub opens, then stays still (Codex
  // round 3). Payment is not live yet, so each one is labelled Coming soon and grants nothing.
  const TOPUP_EVENTS=[{id:'first-topup',name:'Nạp Đầu Nhân Đôi',tag:'Nạp đầu ×2',start:'2026-11-02T00:00:00+07:00',end:'2026-12-28T00:00:00+07:00',
    desc:'Lần nạp đầu mỗi mốc gói Đá Ngọc nhận gấp đôi (một lần mỗi mốc).',status:STATUS}];
  return {SEASONS,seasonHero,COSMETIC_SLOTS,COSMETICS,seasonCosmetic,HERO_PASS,COMPANION,GEM_PACKS,TOPUP,BANNER,MEMORY,CUP_PRIZES,CUP_SCHEDULE,passSeason,TOPUP_EVENTS,STATUS,CADENCE_ANCHOR,VIP,PRODUCTS,GROWTH_FUND,PASS,CADENCE,LEAGUES,ARENA_RULES,TREASURE_QUALITIES,TREASURE_FAMILIES,TITLES};
});
