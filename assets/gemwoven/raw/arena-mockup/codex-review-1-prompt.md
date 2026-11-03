Thiết kế lại màn Đấu Trường (Gemwoven, match-3 RPG mobile dọc, khung 941×1672) và thiết kế một GIẢI ĐẤU THÁNG mới.

Chủ dự án: "Màn đấu trường các item sắp xếp chưa hợp lý. Chưa có chỗ tổ chức cho thi đấu mỗi tháng xem ai mạnh nhất để nhận thưởng xịn."

Ảnh đính kèm:
- arena-phone.png / studio-arena.png: màn hiện tại (điện thoại 390×844 và trang Studio). arena-dialog.png: popup Đấu Hạng hiện tại (các thẻ kem + danh sách <details> chữ).
- studio-upgrade.png (Sảnh Anh Hùng), studio-inventory.png (Túi Đồ), studio-shop.png (Cửa Hàng), studio-forge.png (Lò Rèn): các màn ĐÃ DUYỆT, chuẩn mỹ thuật.
- arena-calm.webp: nền sạch hiện tại của Đấu Trường (cổng vòm, bậc thang, bục, đuốc).

Hiện trạng (src/gemwoven/screens.js 'arena' + art-screens.js arena()):
- Huy hiệu kiếm chéo + bảng "Đấu Trường"; hai Hiro đứng hai bên "VS · Cục bộ"; bục 1-2-3 (bấm mở popup Đấu Hạng · Sắp ra mắt); bảng gỗ nhỏ "Đấu Hạng Sắp ra mắt"; hai cờ chọn chế độ "1v1 Cùng máy" / "Boss Vô Hạn"; nút "Chiến Đấu" (chạy chế độ đang chọn); thẻ giấy bên phải "Thưởng Boss" (chest) dẫn tới Boss Vô Hạn.
- Vấn đề tôi thấy: bục 1-2-3 trống, chẳng ai đứng; "Đấu Hạng" (chưa có) chiếm vị trí trung tâm; cờ chọn chế độ + nút Chiến Đấu tách rời nên không rõ bấm gì sẽ đánh gì; "Thưởng Boss" là thẻ CSS-ish lạc chỗ; không có chỗ cho giải tháng; chữ nhỏ.

Luật dự án: chữ ít, dùng hình, chi tiết sau một chạm; khung/nút/bảng phải là ẢNH VẼ (Codex), chữ/số là lớp HTML; không bao giờ thưởng Đá Ngọc (tiền nạp) từ gameplay/giải đấu; phần chưa phát hành ghi "Sắp ra mắt"; kết quả cục bộ không phải bảng toàn cầu; Hiro là tướng miễn phí, không buff. Đã có: Đấu Hạng (Tự Do / Chuẩn Hóa, bậc Đồng→Thách Đấu, thưởng tuần, mùa 28 ngày, liveops.js LEAGUES/ARENA_RULES) — chưa có máy chủ trận; Thư Hùng Đại Hội theo QUÝ (Thụy Sĩ 7 vòng → top 64 loại trực tiếp); Giao hữu ở Quảng Trường = đánh bản sao AI của tướng người kia, chỉ số chuẩn hóa, không thưởng (engine begin('spar')). Tướng đã phát hành: Hiro (miễn phí) và Mika (banner hiện tại); 5 tướng khác "kỳ triệu hồi sau". Danh hiệu (TITLE_RULES) là trang trí; các danh hiệu do máy chủ trao có cờ server. Điểm báu vật: 600/kỳ 2 tuần từ PvE, Lam→Thần cần 4.800 điểm (~16 tuần). Ngọc khảm 5 loại × 5 cấp.

== ĐỀ XUẤT CỦA CLAUDE (hãy phản biện từng điểm) ==

A. Tên: chọn một trong "Giải Đấu Tháng", "Cúp Nguyệt Ngọc", "Tranh Bá Tháng", "Nguyệt Hội Đấu Trường" — hoặc đề xuất tên Việt hay hơn (ngắn, ≤ 3 từ, khác hẳn "Thư Hùng Đại Hội" của quý).

B. Thể thức (bản máy chủ):
1. Mùa = tháng dương lịch, GMT+7. Từ ngày 1 đến ngày cuối−3: VÒNG ĐUA ĐIỂM. 3 ngày cuối: TOP 8 LOẠI TRỰC TIẾP (tứ kết / bán kết / chung kết, mỗi ngày một vòng, BO3, có xem lại).
2. Công bằng: chỉ chơi theo luật Chuẩn Hóa (chỉ số chuẩn, kỹ năng cấp 1, không trang bị/báu vật/ngọc/VIP). Nhóm tướng của tháng: mọi tướng đã phát hành, không cần sở hữu (khi có ≥ 5 tướng: xoay vòng 4 tướng/tháng). Mỗi trận chọn tướng trước khi ghép.
3. Điều kiện: miễn phí, mở sau ải 30; một tài khoản đã xác thực.
4. Số trận: 5 trận tính điểm mỗi ngày (lượt không dùng cộng dồn tối đa 10). Điểm kiểu Elo: thắng +20 ± chênh lệch (8–32), thua −(8–32)·0,5, không xuống dưới 0; 1.000 điểm khởi đầu. Ghép theo điểm gần nhất. Đứng bằng điểm: ít trận hơn → đạt điểm sớm hơn.
5. Bảng xếp hạng: top 100 + vị trí của mình; người chơi ≥ 10 trận mới được xếp thưởng.
6. Thưởng (KHÔNG Đá Ngọc): Vô địch — danh hiệu "Quán Quân Tháng" (bậc 5, ghi tháng), khung chân dung tháng, tượng ở Quảng Trường tháng sau, 400 điểm báu vật, 2 ngọc khảm cấp 3 tự chọn, 300.000 vàng, 60 tinh hoa. Á quân / Top 4 / Top 8 / Top 100 / Top 10% / Hoàn thành 10 trận: giảm dần (danh hiệu bậc 4 cho top 4, khung cho top 8, phần còn lại tài nguyên vừa phải). Không sức mạnh độc quyền.
7. Sảnh Vinh Danh: 12 tháng gần nhất — nhà vô địch (tên, tướng, danh hiệu).

C. Bản thử cục bộ (chưa có máy chủ), ghi rõ "Bản thử cục bộ · kết quả không lên bảng toàn cầu":
1. Sân đấu tháng gồm 31 bản sao AI (tên + tướng sinh theo mã tháng, điểm của chúng tăng theo ngày theo seed) + bạn.
2. Bạn đánh bản sao có điểm gần nhất (giống giao hữu: chỉ số chuẩn hóa, AI điều khiển), 5 trận/ngày, điểm Elo như trên.
3. 3 ngày cuối: nếu bạn ở top 8 → đánh nhánh loại trực tiếp với AI (một trận/vòng trong bản thử); các cặp AI khác phân thắng thua theo seed + điểm.
4. Bản thử KHÔNG trao phần thưởng (chỉ hiện "Thưởng khi giải chạy trên máy chủ · Sắp ra mắt"), lịch sử vô địch ghi trên máy này.
   Câu hỏi: nên để bản thử trao một chút thưởng thật (vàng nhỏ) không? Tôi nghiêng về KHÔNG (đánh AI không phải thi đấu; tránh lệch kinh tế).

D. Màn Đấu Trường mới (thứ bậc):
- Y 0–150 HUD chung. Y 150–330 bảng "Đấu Trường" nhỏ gọn.
- Y 330–900 TRỌNG TÂM = GIẢI THÁNG: trong lòng cổng vòm treo một băng-rôn/bảng đấu giải (vẽ) có cúp, tên giải + "Tháng 11", đếm ngược, điểm và hạng của bạn; bục 1-2-3 đặt chân dung 3 người dẫn đầu tháng (bản thử: bản sao AI/bạn) — bục không còn trống. Nút chính "Thi Đấu" ngay dưới bục.
- Y 940–1300 HÀNG CHẾ ĐỘ: ba tấm vẽ đều nhau: "1v1 Cùng Máy" (chạm là vào trận luôn), "Đấu Hạng" (ổ khóa + "Sắp ra mắt", chạm xem luật), "Boss Vô Hạn" (đi tới). Bỏ cơ chế chọn-cờ-rồi-bấm-Chiến-Đấu.
- Rương thưởng: đặt cạnh bảng giải (rương = xem bảng thưởng tháng), không còn "Thưởng Boss".
- Popup giải (chạm bảng giải): 4 tab vẽ: Đua Điểm (bảng xếp hạng dạng tấm gỗ từng hàng, mình được đánh dấu) · Chung Kết (nhánh 8) · Thưởng (hàng mốc hạng + biểu tượng thưởng) · Vinh Danh. Nút "Đánh trận kế" ở đáy.

Hãy trả lời (tiếng Việt, ngắn gọn, đánh số):
(1) Chấm màn hiện tại /10 so với 4 màn đã duyệt, nêu 5 lỗi chính.
(2) Đồng ý / phản biện từng điểm A, B1–B7, C1–C4 (đặc biệt: Elo hay điểm tích lũy? số trận? có nên xoay nhóm tướng? bản thử có nên trao thưởng? thưởng top có quá mạnh hay quá yếu với luật "không sức mạnh độc quyền"?). Đưa ra con số cuối cùng bạn đồng ý để tôi ghi vào progression.js/liveops.js. Thêm điều tôi thiếu (chống thông đồng/bỏ trận, hòa, mất kết nối, người mới vào giữa tháng, múi giờ).
(3) Bố cục cuối cùng theo tọa độ 941×1672 cho màn Đấu Trường và cho popup giải (khung popup dọc chung của game).
(4) Danh sách mảnh ảnh cần Codex vẽ (mỗi mảnh: mô tả, kích thước gợi ý), ưu tiên tái dùng ảnh đã có (cờ xanh/đỏ, rank-gold/silver/bronze, chest, icon-crown, tab gỗ của Lò Rèn, biển danh hiệu theo bậc).
(5) Một prompt image_gen TIẾNG ANH hoàn chỉnh để vẽ MOCKUP màn Đấu Trường mới (một ảnh dọc 2:3, giữ nền arena-calm làm tham chiếu địa điểm, các màn đã duyệt làm tham chiếu phong cách; trạng thái: tài khoản mới chỉ có Hiro, giải tháng 11 đang ở Vòng Đua Điểm, bạn hạng 14 với 1.000 điểm, top 3 là bản sao AI; ghi chữ tiếng Việt có dấu), theo mẫu cấu trúc OUTPUT / REFERENCES / ART DIRECTION / SCREEN STATE / VISUAL HIERARCHY (tọa độ) / TYPOGRAPHY / AVOID.

Không sửa file.
