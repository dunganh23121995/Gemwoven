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
    {level:3,spend:600000,perks:['Hiệu ứng vào trận','+1 lượt Boss Vô Hạn có thưởng','Offline 13 giờ']},
    {level:4,spend:1000000,perks:['Cửa hàng VIP 2 ô','Gói Quà VIP 4']},
    {level:5,spend:2000000,perks:['Bong bóng chat VIP','+1 lượt Boss Vô Hạn có thưởng']},
    {level:6,spend:4000000,perks:['Hàng đợi rèn thứ hai','Offline 14 giờ']},
    {level:7,spend:7000000,perks:['+1 lượt Boss Vô Hạn có thưởng','Cửa hàng VIP 4 ô']},
    {level:8,spend:12000000,perks:['Trang phục trang bị độc quyền (không chỉ số)']},
    {level:9,spend:20000000,perks:['+1 lượt Boss Vô Hạn có thưởng','Offline 15 giờ']},
    {level:10,spend:35000000,perks:['Trang phục tướng độc quyền (không chỉ số)']},
    {level:11,spend:60000000,perks:['Khung và danh hiệu Đại Phú Hộ']},
    {level:12,spend:100000000,perks:['Chăm sóc khách hàng riêng','Offline 16 giờ']}
  ].map(v=>({...v,dailyGold:v.level>=2?1000:500,combatStats:false}));
  // Payment products (suggested prices, Codex review: 109k card, 149k pass, 299k fund).
  const PRODUCTS=[
    {id:'monthly-card',name:'Thẻ Tháng',price:109000,days:30,stackMaxDays:180,gemsNow:300,gemsDaily:100,
      perks:['300 Đá Ngọc ngay khi mua','100 Đá Ngọc mỗi ngày trong 30 ngày (tự vào Hòm Thư nếu quên đăng nhập)','Trần offline +2 giờ','+1 lượt Boss Vô Hạn có thưởng mỗi ngày','Quét ải 3★ không cần vé quét']},
    {id:'lifetime-card',name:'Thẻ Trọn Đời',price:499000,gemsNow:980,perks:['980 Đá Ngọc','+20% vàng offline','Thêm một hàng đợi rèn']},
    {id:'journey-pass',name:'Sổ Hành Trình · Nhánh Vàng',price:149000,perks:['Mở nhánh Vàng của mùa hiện tại','Nhận ngay mọi phần thưởng Vàng của các cấp đã đạt','Không có Đá Ngọc trong sổ']},
    {id:'growth-fund',name:'Quỹ Trưởng Thành',price:299000,perks:['Đá Ngọc và tài nguyên ở các mốc cấp tướng cao nhất','Trả theo tiến độ, không hết hạn']}
  ];
  // Growth fund ("speed pass"): delivery of a purchase, unlocked by the highest hero level.
  const GROWTH_FUND=[[10,300],[20,300],[30,400],[50,500],[70,500],[100,600],[130,600],[160,700],[200,800],[250,900],[300,1400]].map(([level,gems])=>({level,gems}));
  // Journey pass: 28-day season, 50 levels from daily/weekly activity points (never from payment).
  const PASS={seasonDays:28,levels:50,pointsPerLevel:100,boughtLevelsMax:10,boughtLevelsLastDays:7,
    free:level=>level%10===0?{tickets:2,essence:20}:level%5===0?{skillBooks:2,ore:20}:{gold:3000+level*200},
    gold:level=>level%10===0?{tickets:5,divineOre:2}:level%5===0?{essence:15,skillBooks:3}:{exp:20+level,ore:10}};
  // Event cadence (GMT+7). Each window lists what renews; the server owns the calendar.
  const CADENCE=[
    {id:'daily',name:'Ngày',reset:'00:00',items:['Nhiệm vụ ngày','Sân Thử Luyện theo hệ (2 lượt có thưởng, thử lại thoải mái)','Quà VIP và Thẻ Tháng']},
    {id:'weekly',name:'Tuần',reset:'Thứ Hai 00:00',items:['Nhiệm vụ tuần: 3 vé (đang chạy); Mảnh Hiro ~42/tuần từ nhiệm vụ vượt ải hằng ngày','Thưởng hạng Đấu Trường','Cửa hàng tuần làm mới','Cuối tuần ×2 luân phiên: vàng ải / nguyên liệu boss']},
    {id:'banner',name:'Kỳ 2 tuần',reset:'Thứ Hai tuần lẻ',items:['Banner tướng (+ vũ khí bản mệnh)','Boss sự kiện theo tướng banner','Cửa hàng đổi mảnh (tối đa 30 mảnh/kỳ)','Báu vật chủ đề: tích nạp nhanh hơn, PvE vẫn đạt được']},
    {id:'season',name:'Mùa 28 ngày',reset:'Thứ Hai đầu mùa',items:['Sổ Hành Trình mới','Mùa Đấu Hạng (reset mềm)','Lịch đăng nhập 28 ngày','BXH Boss Vô Hạn']},
    {id:'quarter',name:'Quý',reset:'Tuần đầu quý',items:['Thư Hùng Đại Hội','Trang phục mới','Sự kiện kỷ niệm']}
  ];
  // Ranked arena leagues; MMR (Glicko-2) is hidden, league points are shown. Rewards hold no Đá Ngọc.
  const LEAGUES=['Đồng','Bạc','Vàng','Bạch Kim','Kim Cương'].flatMap((name,t)=>['III','II','I'].map((d,i)=>({id:`${t}-${i}`,name:`${name} ${d}`,tier:t,points:(t*3+i)*100})))
    .concat([{id:'elite',name:'Tinh Anh',tier:5,points:1500},{id:'master',name:'Cao Thủ',tier:6,top:500},{id:'challenger',name:'Thách Đấu',tier:7,top:50}])
    .map(l=>({...l,weekly:{gold:20000+l.tier*15000,arenaMedals:100+l.tier*60,skillBooks:1+Math.floor(l.tier/2)}}));
  const ARENA_RULES={turnSeconds:20,timeoutsToLose:3,reconnectSeconds:60,queues:[
    {id:'open',name:'Tự Do',desc:'Chỉ số thật; ghép theo MMR và chênh Lực chiến tối đa 25%.'},
    {id:'normalized',name:'Chuẩn Hóa',desc:'Mọi người chọn trong cùng danh sách tướng đã phát hành, chỉ số chuẩn, kỹ năng cấp 1; không trang bị, báu vật, VIP.'}],
    seasonRewards:'Khung avatar, danh hiệu mùa, trang phục; top mùa nhận đồ trang trí, không nhận sức mạnh độc quyền.'};
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
  return {STATUS,VIP,PRODUCTS,GROWTH_FUND,PASS,CADENCE,LEAGUES,ARENA_RULES,TREASURE_QUALITIES,TREASURE_FAMILIES,TITLES};
});
