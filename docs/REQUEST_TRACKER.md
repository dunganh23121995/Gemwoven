# Đối chiếu yêu cầu của chủ dự án

Mỗi câu hỏi và yêu cầu của chủ dự án (đợt thiết kế chiều sâu, từ 03/11/2026) có một dòng ở đây: câu trả lời,
những gì đã chạy trong game và việc còn lại. Bảng được cập nhật mỗi khi một phần được làm xong.
Thiết kế chi tiết nằm ở `docs/GAME_DESIGN.md` (tab Studio "Thiết kế hệ thống").

**Trạng thái:** ✅ chạy trong game · 🔨 đang làm đợt này · 📐 đã thiết kế, cần máy chủ thật (làm khi có máy chủ) ·
🎨 cần vẽ (Codex) · 🤝 chờ Claude và Codex thống nhất (luật chủ dự án: hai bên cùng quan điểm mới làm).

## A. Phát triển tướng

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| A1 | Cấp, sao, tiến hóa, bộ kỹ năng liên hệ thế nào? | Cấp và Sao là hai đường riêng. Tiến hóa cần cả hai. Tiến hóa mở các nhánh kỹ năng. Sao mở hình thái. | ✅ | Tướng → cờ trái **Lộ trình phát triển**; GAME_DESIGN §1 |
| A2 | Khi nào nhân vật biến hình? | Hình thái 2 ở 4★, hình thái 3 ở 6★ (thuộc Sao). Biến Thân trong trận là nhánh Chân Thân. | ✅ hình thái · ✅ Biến Thân (cấp 180 + TH3, nút trong trận) | Tướng → nút Hình thái; trận → nút BIẾN THÂN; §2.4 |
| A3 | Trang bị có ảnh hưởng hình thái? Form 2 mang vũ khí thần thoại? Form 3 không vũ khí? | Trang bị chỉ cộng chỉ số, không đổi hay khóa hình thái. Form 2 mang đồ Thần được. Form 3 không vũ khí vẫn biến thân, chỉ thiếu Công. Vũ khí bản mệnh thêm hiệu ứng khi đúng chủ. | ✅ luật · 📐 vũ khí bản mệnh | §1.1, §3 |
| A4 | Ràng buộc chặt hay độc lập? | Hai đường độc lập (Cấp, Sao) gặp nhau ở cổng Tiến hóa. Trang bị, báu vật, ngọc độc lập với hình thái. | ✅ | §0, §1.1 |
| A5 | Có cần chia Chủ động / Bị động / Biến Dị / Chân Thân? | Có. Bốn nhánh mở ở bốn thời điểm và mỗi nhánh đổi cách chơi. | ✅ | Kỹ Năng; §2 |
| A6 | Form cũ còn dùng được sau khi nâng? Có chế độ biến hình? | Còn, miễn phí: chọn diện mạo ở thị trấn. Trận luôn dùng hình thái cao nhất. Biến Thân 3 lượt trong trận. | ✅ diện mạo · ✅ Biến Thân | Hình thái → "Khoác diện mạo"; trận → BIẾN THÂN |
| A7 | Tướng chưa sở hữu có hiện trong danh sách? | Có, xám kèm khóa; bấm vào xem được cách có tướng. | ✅ | Tướng, Kỹ Năng |
| A8 | Xem chỉ số tướng đang sở hữu ở đâu? | Bảng chi tiết HP/Công/Thủ theo từng nguồn. | ✅ | Tướng → cờ phải; Lực Chiến |
| A9 | Bấm tổng Lực chiến đi đâu? | Mở bảng Lực chiến: công thức, từng nguồn, gợi ý nâng tiếp. | ✅ | Home → Lực Chiến |
| A10 | Hình thái Hiro | H2 Lữ Khách Kiếm Sĩ (4★) và H3 Anh Hùng Diệu Ngọc (6★) đã duyệt và **đã vào game**: sheet trận (nghỉ, đánh, thi triển, chạy), chân dung, trình diễn ở hub (2 hành động + màn xuất hiện), cỡ đầu khớp dạng 1, bảng Hình thái, khoác diện mạo. Tuyệt kỹ ×1,1 / ×1,25 như mọi tướng; đặc tính H3 nhẹ (+15% tuyệt kỹ) vì Hiro là tướng miễn phí (chủ dự án 03/11). Tuyệt kỹ riêng (03/11, chủ dự án báo "không pass"): H2 **Lữ Kiếm Liên Trảm** (gió lữ khách cuốn lá quanh chân, lướt tới, chém ngang, chém hất, chém chéo chữ X nổ gió lá) và H3 **Diệu Ngọc Tứ Hệ Trảm** (bốn ánh ngọc tụ vào mũi kiếm, ấn ngọc nở dưới chân địch, trăng lưỡi liềm ánh ngọc chém xuống, lồng pha lê vỡ thành mảnh ngọc); tư thế tuyệt kỹ vẽ riêng cho mỗi dạng, hiệu ứng `assets/fx/heroes/novice/f2-*, f3-*`, âm thanh bản thu thật lấy âm dạng 1 làm xương sống (`scripts/prepare_hiro_star_form_sounds.py`), rung màn hình khi trúng, đánh thường vẽ vệt kiếm riêng, H3 có hào quang ngọc và dấu chân ánh ngọc khi rời sân, rig nghỉ 24 khung (trận + sảnh) và rig nhận buff. **Không đổi số**: sát thương đúng như tuyệt kỹ cũ (`qa/hiro-forms.cjs` so từng ca). Codex soi khung hình 4 vòng, vòng cuối đạt. | ✅ hình · ✅ tuyệt kỹ, hiệu ứng, âm thanh (chờ chủ dự án thử) | Tướng → Hiro (4★/6★) · `src/forms-hiro.js` |
| A11 | Tướng mặc định rất khó qua boss chương 2 cấp 100 | Nguyên nhân là chỉ lên cấp, không đồ, không kỹ năng. Đã tăng tuyệt kỹ Hiro (70), kiếm ×1,2, thêm đường Mảnh Hiro, Lộ trình. Đang đối chiếu mô phỏng với trận thật bằng bot. | ✅ · ✅ "cân bằng v1" chương 1–2 (Codex vòng 4; còn mở: số lượt quái thường) | §5, §20; `qa/gemwoven/real-fights.cjs` |
| A12 | Cơ chế tính sát thương | Công thức đầy đủ, hệ số, khắc hệ, chí mạng chuỗi, giáp, thủ. | ✅ | §5.1 |

## B. Túi đồ, trang bị, cửa hàng, triệu hồi

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| B1 | Bấm dùng vật phẩm trong túi thì sao? | Mỗi loại một nút ở khung chi tiết: mảnh tướng → **Ghép**; sách EXP/bí kíp → **Sử Dụng** (mở màn nâng); vé → triệu hồi; ngọc → **Ghép 3→1**; phiếu chọn ngọc → **Chọn**; trang bị → **Trang Bị / Phân rã / Khóa**; nguyên liệu → **Đi Tới** nơi kiếm, **Mua thêm** nếu cửa hàng có. Rương tự chọn của Sổ Hành Trình sẽ mở bằng lưới hình khi sổ chạy (cần máy chủ thanh toán). | ✅ | Túi Đồ |
| B2 | Quá nhiều vũ khí, trang bị cấp thấp thì xử lý thế nào? | Thống nhất với Codex: túi 500 (cảnh báo 450), phân giải hàng loạt có lọc ô/phẩm và xem trước tổng thu hồi, hoàn 70% chi phí cường hóa, khóa món, tự phân giải mặc định tắt, "Mặc tốt nhất"; không dung luyện. | ✅ | Túi Đồ → Trang Bị (nút Phân giải hàng loạt, Khóa, Phân rã) · Tướng → ô đồ (Mặc tốt nhất) |
| B3 | Cái gì bán ở cửa hàng, cái gì không? | Bảng §8: không bán tướng, Mảnh Hiro, Đá Ngọc, vé bằng vàng. Cửa hàng Vàng: nguyên liệu, bí kíp (5/ngày); Đá Ngọc: tinh hoa (10/ngày), thần thạch (5/tuần), đồ Huyền Thoại/Thần (1 món/tuần mỗi loại); số lượt còn lại hiện cạnh giá. Ngọc khảm bằng vàng chờ Codex chốt (ảnh hưởng nhịp 100 ngày tới ngọc cấp 5). | ✅ | Cửa Hàng |
| B4 | Cái gì cần triệu hồi, mở rộng cho sự kiện | Tướng hiếm qua banner 2 tuần; vũ khí bản mệnh banner riêng; cửa hàng đổi mảnh; mẫu sự kiện cho Studio. | ✅ tỉ lệ 1%/100 · 📐 banner | §9 |

## C. Kiếm tiền, VIP, thẻ, sổ

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| C1 | Kiếm tiền từ tướng có form, nguyên liệu, nâng cấp | Banner tướng và vũ khí, trang phục hình thái, gói ưu đãi đúng chỗ kẹt, Quỹ Trưởng Thành, Sổ Hành Trình. | ✅ trang VIP (Sắp ra mắt) | VIP & Nạp; §10 |
| C2 | VIP: tính thế nào, thưởng gì, mốc nào, tối đa? | 12 bậc theo tổng nạp xác thực (100k đến 100 triệu). Tiện lợi, quà ngày, trang trí; không chỉ số chiến đấu. | ✅ | VIP & Nạp |
| C3 | Thẻ tháng có lợi ích gì? | 109k: 300 Ngọc ngay + 100/ngày, offline +2 giờ, +1 lượt boss có thưởng, quét ải. | ✅ | Home → Thẻ Tháng |
| C4 | Có nên mở speed pass? | Quỹ Trưởng Thành 299k: 7.000 Ngọc theo mốc cấp. | ✅ | VIP & Nạp |
| C5 | Mua vé tháng, cày đủ mốc nhận thêm? | Sổ Hành Trình 50 cấp. Chủ dự án duyệt giá 03/11; **bỏ Thẻ Trọn Đời**; thêm **nhánh Diệu Ngọc 299k** nhận đồ xịn hơn (mảnh tướng tự chọn, rương Sử Thi/Huyền Thoại, khung mùa, +10 cấp). | ✅ cây mốc 3 nhánh, nhận nhánh Thường thật (I9); nhánh trả phí Sắp ra mắt; Codex đồng ý có điều kiện, đã áp (không Mảnh Hiro, cổng ải 60/80, +10 cấp tính vào giới hạn) | VIP & Nạp → Sổ Hành Trình |
| C6 | Sự kiện nạp có thưởng đặc biệt cần hiệu ứng quanh biểu tượng | Thống nhất với Codex: viền sáng 2 nhịp khi vào hub rồi đứng yên, tắt được theo cài đặt giảm hiệu ứng, không chấm đỏ vì "có thể nạp". Sự kiện mẫu "Nạp Đầu ×2" (Sắp ra mắt). | ✅ | Home → VIP |
| C7 | Chấm đỏ cho chỗ nhận quà ngay | Thống nhất với Codex: đỏ = quà nhận ngay, miễn phí; xanh lá = gợi ý nâng được (tắt được); xanh dương = số thư/lời mời; lan lên nút cha (Thêm cộng các màn phía sau), gợi ý đã xem thì ẩn tới khi đổi, tắt được ở Cài Đặt. | ✅ | Toàn hub |

## D. Sự kiện và nhịp chơi

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| D1 | Sự kiện đều theo tuần | Nhiệm vụ tuần (thứ Hai 00:00 GMT+7) | ✅ | Sự Kiện |
| D2 | Thay đổi hoàn toàn theo 2 tuần, 1 tháng | Kỳ banner 2 tuần, mùa 28 ngày, ngày neo 02/11/2026. | ✅ lịch · 📐 nội dung kỳ | Sự Kiện → Lịch |
| D3 | Chu kỳ lặp để lấy thêm mảnh tướng | Chạy lại banner (≥ 6 tuần), Cửa hàng Ký Ức, rương chọn mảnh, Sổ nhánh Diệu Ngọc. | 📐 · 🔨 sổ | §11 |
| D4 | Boss vô hạn: xử lý, thưởng, quái nào, cần nhiều hay đại diện trâu? | Giữ Boss Vô Hạn theo tầng; thêm **Sân Thử Luyện**: một boss trâu không bao giờ ngã, 15 lượt, tính sát thương, 2 lượt có thưởng/ngày, thử tướng thoải mái. | ✅ | Boss Vô Hạn |

## E. Đấu trường

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| E1 | Cơ chế đấu trường, máy chủ tự quyết | Hai hàng Tự Do và Chuẩn Hóa; máy chủ giữ bàn ngọc, RNG, kết quả, kể cả PvE. | 📐 máy chủ trận · ✅ trang giới thiệu (Đấu Trường → bục Đấu Hạng) | §12 |
| E2 | Thưởng hạng tuần, tháng | Bậc Đồng → Thách Đấu, thưởng tuần (không Ngọc), mùa 28 ngày đồ trang trí. | 📐 · ✅ bảng bậc và thưởng tuần | §12.2 |
| E3 | Trận Thư Hùng | Thư Hùng Đại Hội theo quý: vòng loại, 64 người, chung kết phát trực tiếp. | 📐 · ✅ thể thức trong trang Đấu Hạng | §12.3 |
| E4 | Màn Đấu Trường sắp xếp chưa hợp lý; chưa có chỗ thi đấu mỗi tháng xem ai mạnh nhất để nhận thưởng xịn (chủ dự án 04/11) | Màn sắp lại theo thứ bậc (Codex 6/10 → mockup 8,5 → bản dựng **8/10 Đạt** cả điện thoại và Studio): bảng **Cúp Đấu Trường** treo trong cổng → bục 2–1–3 chân dung người dẫn đầu → hàng của bạn → nút Đấu thử → giá ba cờ (1v1 Cùng máy · Đấu Hạng Sắp ra mắt · Trùm Vô Tận). Giải tháng: đua điểm Elo Chuẩn Hóa (mượn mọi tướng đã phát hành) ngày 1 → D−3, Top 8 loại trực tiếp BO3 3 ngày cuối; thưởng xịn là danh hiệu Quán Quân/Á Quân/Tứ Kiệt/Bát Hùng Tháng, khung động, vinh danh ở Quảng Trường; không Đá Ngọc. Bản thử cục bộ đấu 31 bản sao AI, không thưởng, không lên bảng toàn cầu. | ✅ bản thử · 📐 máy chủ (Sắp ra mắt) | Đấu Trường → bảng Cúp; §12.5 |

## F. Xã hội

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| F1 | Trò chuyện (đổi tên **Gặp Gỡ**, 03/11) là một **không gian/bản đồ**: điều khiển nhân vật đi lại, nhắn tin thì bong bóng hiện trên đầu | **Quảng Trường** trực tuyến (máy chủ xã hội riêng `server/social`, không phải LAN): bản đồ Codex vẽ, camera theo tướng; kéo = cần điều hướng, chạm = đi, WASD; bong bóng chat, nhật ký theo kênh Khu vực/Bang/Riêng/Hệ thống; kênh 40 người. | ✅ | Trò Chuyện |
| F2 | Khoe tướng xịn | Mỗi người hiện bằng tướng đang xuất chiến, đúng hình thái đang khoác (vòng nghỉ rig + sheet chạy); bấm vào xem cấp, sao, lực chiến (ghi "chưa xác thực"). | ✅ (danh hiệu: F6) | Quảng Trường |
| F3 | Kết bạn khi đứng gần nhau, bấm vào nhân vật của nhau | Máy chủ kiểm tra khoảng cách. Thẻ hồ sơ: Kết bạn / Nhắn riêng, Giao hữu, Mời vào bang; Thêm: Tặng tim, Chặn, Báo cáo. Danh sách bạn: trực tuyến, kênh, Đến chỗ, Nhắn, Tặng tim. | ✅ | Quảng Trường → Bạn bè |
| F4 | Giao lưu rồi vào trận đấu với nhau | Mời từ thẻ hồ sơ hoặc Sàn Giao Hữu (hai người cùng Sẵn sàng). Trước khi có máy chủ trận: đấu bản sao tướng của người kia do AI điều khiển, chỉ số chuẩn hóa, "Không thưởng", không công bố kết quả. | ✅ | Quảng Trường |
| F5 | Bang hội (guild) | Lập/tìm/xin vào/duyệt/rời/mời ra, Bang Chủ · 1 Phó · 2 Trưởng Lão, thông báo, chế độ nhận người, điểm danh, cống hiến tuần/tổng, cấp bang 1–10, kế vị khi Bang Chủ vắng 14 ngày, nhật ký, kênh chat bang, thẻ [TAG] trên đầu. Hoạt động thật: **Dệt Đèn Bang**. Boss Bang, Viễn Chinh, Chiến Trường, Cửa Hàng Bang: Sắp ra mắt. | ✅ | Quảng Trường → Bang hội / Sảnh Bang |
| F6 | Danh hiệu: sưu tập, thiết kế; chỉ hiện tên trên biển rực rỡ theo độ hiếm, bấm xem cách nhận, đeo/bỏ đeo, hiện trên đầu trong trận và ở Gặp Gỡ (chủ dự án 03/11) | 12 danh hiệu; 5 mẫu biển do Codex vẽ (gỗ lá · bạc lam ngọc · vàng tím cánh nhỏ · vàng ròng cánh lớn · đỏ lửa vương miện), chữ chuyển màu theo bậc, bậc 4–5 lấp lánh. Lưới chỉ có biển tên (chưa đạt: xám + khóa); bấm mở bảng: độ hiếm, cách nhận, tiến độ, Đeo/Bỏ đeo. Đeo thì biển hiện trên thanh tên trong trận (mọi chế độ trừ 1vs1 cùng máy) và trên đầu nhân vật ở Gặp Gỡ. Trang trí, không chỉ số. | ✅ | Thêm → Xếp Hạng → Danh Hiệu |

## G. Báu vật, ngọc khảm

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| G1 | Gắn ngọc | **Dệt Ngọc** (Codex vòng 6): lỗ theo phẩm đồ (Hiếm 1 → Thần 4), 5 loại ngọc × 5 cấp do Codex vẽ (Công, Sinh Lực, Hộ Thể, Kháng, Chuẩn), cộng có trần (36% / 54% / 12% / 40% / 30%), ghép 3→1, tháo miễn phí, phân rã đồ trả ngọc; rơi ở Boss Vô Hạn tầng 20+, Sân Thử Luyện mốc 3, phiếu chọn từ nhiệm vụ tuần; Kháng chống choáng/đóng băng/hút năng lượng, Chuẩn tăng hiệu ứng Thần; tắt ở Chuẩn Hóa/giao hữu/1vs1. Giao diện bằng hình: hàng lỗ khảm, lưới ngọc, ghép 3→1. | ✅ | Tướng → ô đồ → lỗ khảm · Túi Đồ → Khác |
| G2 | Báu vật % chỉ số, từ sự kiện nạp và đua top; hiệu ứng % máu boss, mượn kỹ năng | **Bản thử nghiệm cục bộ** (Codex vòng 9): Sự Kiện → Kỳ Báu Vật → "Vào bản thử" (chơi trên bản sao tài khoản, nhãn luôn hiện, thoát lúc nào cũng được). 3 họ × 5 phẩm do Codex vẽ: Phá Sơn (%HP mục tiêu khi tuyệt kỹ, PvE), Mượn Hồn (nửa phần tăng Bị Động của tướng khác), Khắc Chế (trừ năng lượng địch). Công/HP +4→20%, Thủ +1→5; 2 ô (ô 2 ở TH3), trần +30%/+30%/+10. Điểm 600/kỳ từ nhiệm vụ ngày, Boss Vô Hạn, Thử Luyện; Lam → Thần 4.800 điểm ≈ 16 tuần. Không độc quyền cho người nạp; tích nạp/đua top cần máy chủ. Tắt ở Chuẩn Hóa/giao hữu/1vs1. | ✅ thử nghiệm · 📐 máy chủ | Sự Kiện → Kỳ Báu Vật · Tướng → 2 ô bên phải |

## H. Kỹ thuật, phát hành

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| H1 | Godot, máy chủ riêng, iOS/Android/Steam (Android trước) | Lõi trận tất định, vector kiểm thử chung, Play Billing, giới hạn giờ chơi trẻ vị thành niên. | 📐 | §17 |
| H2 | Chưa mở map/chưa sở hữu thì chưa tải tài nguyên | Gói theo tài khoản: cài ~166 MB / 1,06 GB. | ✅ | `assets/packs.json` |
| H3 | Rà giao diện, thiết kế giao diện, Codex cùng review | Chụp mọi màn hình (điện thoại + máy tính), Claude tự rà, Codex soát, sửa, chụp lại. | 🔨 | §22 của GAME_DESIGN |
| H4 | Claude và Codex cùng quan điểm mới làm | Mọi điểm tranh luận ghi ở §20 GAME_DESIGN, mỗi vòng có kết luận chung. Vòng 3 thống nhất cả 7 mục (Quảng Trường, máy chủ, bang, giao hữu, trang bị dư, chấm đỏ, Sổ). | ✅ vòng 3 · 🔨 vòng cân bằng (đã có số liệu trận thật) | §20 |
| H5 | Nền các màn nhiều chi tiết, rối, không làm nổi mục chính (chủ dự án 03/11) | Lớp làm mờ đã thử và **bị chủ dự án loại**. Trang Chủ và Triệu Hồi giữ nguyên. **Vẽ lại nền 7 màn** (Tướng, Túi Đồ, Kỹ Năng, Đấu Trường, Cửa Hàng, Rèn Đồ, Quán Bia) bằng Codex: giữ vật neo của UI (bục tướng, NPC, thân cây kỹ năng, kệ hàng, cổng và bục đấu trường, bàn tiệc), bỏ đồ lặt vặt, bề mặt trơn dưới bảng. Codex soát: Đạt cả 7 màn. | ✅ | `assets/gemwoven/backgrounds/*-calm.webp` |
| H6 | Màn Tướng là nơi tụ họp nhiều tướng; nền phải có chuyển động; danh sách tướng mở rộng được; xem thông tin, kỹ năng tướng; cờ đồng bộ nền (03/11) | **Sảnh Anh Hùng** (Codex vòng 18): nền đại sảnh có giếng trời, bục chính, 2 bục chờ với 2 tướng khác đang nghỉ (chạm để chọn), cờ 5 hệ đung đưa; dải tướng cuộn ngang + lưới "Tất cả" (lọc hệ, sắp theo cấp/sao); ⓘ hồ sơ tướng (chỉ số, từng kỹ năng chạm xem, hình thái, nút Kỹ năng); cờ Lộ trình / Chỉ số vẽ lại tông đỏ đô–kem. Mọi nền mới có chuyển động đặt lại theo hình (lửa, mây, đèn, chim, lá). | ✅ | Tướng |
| H7 | Cô bán hàng và con thỏ ở Cửa Hàng cử động nhẹ (03/11) | Codex vẽ riêng từng nhân vật và nền quầy không có họ; khung nghỉ 24 hình bằng lưới biến dạng (`assets/gemwoven/npc/npc_rig.py`), không vẽ lại. | ✅ | Cửa Hàng |
| H8 | Rèn Đồ không đạt: logic và bố cục; phải review thiết kế cùng Codex (03/11) | Bản dựng đầu (bảng CSS) bị chủ dự án loại. Làm lại theo quy trình mới: Codex chấm thiết kế (3/10), viết prompt và vẽ **mockup** đã duyệt (`assets/gemwoven/raw/forge-mockup/mockup-1.png`), rồi vẽ từng mảnh (bàn rèn, giá 6 ô, 5 phôi, tab gỗ, tấm búa, thẻ da, khóa, ổ khảm) và hình đồ riêng cho 6 ô × 5 phẩm. Dựng xong Codex chấm lại 6,5 → 7,5 → **8/10 Đạt** trên cả điện thoại lẫn Studio. Logic: rèn cho một tướng, so món đang mặc → món mới, cường hóa đúng món đang mặc, ×1/Tối đa một giao dịch, Khảm Ngọc thật. | ✅ | Rèn Đồ |
| H9 | Nút bên chỉ ở Trang Chủ; cột phải có nền như cột trái (03/11) | Cột phải là thẻ treo có tên (Kho Offline, Boss Vô Hạn, Xếp Hạng); các màn khác không còn cờ bên. | ✅ | Trang Chủ |

## I. Yêu cầu 03–04/11 (đợt rà soát giao diện)

| # | Câu hỏi / yêu cầu | Trả lời | Trạng thái | Xem ở đâu |
|---|---|---|---|---|
| I1 | Luôn phải review thiết kế cùng Codex | Quy trình: Codex chấm → mockup đã duyệt → hình vẽ thật → chấm lại trên điện thoại và Studio, ≥ 8/10. Ghi trong `AGENTS.md`. | ✅ | `AGENTS.md` |
| I2 | Viền popup mỏng đi | Khung gỗ dây leo cũ vẽ mỏng hơn (trên 70%, cạnh và đáy 50%); bảng tên, huy hiệu, lề theo khung. | ✅ | mọi popup |
| I3 | Rà chữ mọi màn: nội dung, kiểu, độ dài | Codex vòng 25 (~50 điểm). Đã sửa: một tên cho mỗi tính năng (**Trùm Vô Tận**, **Tích Lũy**, **Thành Tích**, Sách kinh nghiệm), Cấp thay Level, số thập phân dấu phẩy, câu dài vào ⓘ, nhãn rút gọn. Chưa đổi: viết hoa kiểu câu toàn game (giữ kiểu tiêu đề như hiện tại), số rút gọn "N". | ✅ đợt 1 · 🔨 | mọi màn |
| I4 | Icon thẻ treo Trang Chủ to lên; chữ hợp lý | Icon chiếm ~2/3 thẻ, chữ 28; bỏ nhãn "Ưu đãi nạp" (giữ viền sáng); bảng Lực chiến số lớn. Codex 8,7/10. | ✅ | Trang Chủ |
| I5 | Xích cột phải treo thẳng, nằm sau Hòm thư / Cài đặt | Hai cột hai giàn xích riêng; cột phải treo từ mép trên, sau nút HUD. | ✅ | Trang Chủ |
| I6 | Cô gái Túi Đồ, cô bán hàng, thỏ cử động; Cửa Hàng bỏ băng rôn, thêm đồ phía sau | Codex vẽ riêng từng nhân vật + nền không có họ; khung nghỉ 24 hình. Codex 8,3 / 8,5. | ✅ | Túi Đồ, Cửa Hàng |
| I7 | Gặp Gỡ: nút và popup còn là hộp CSS | Đang làm lại bằng hình vẽ theo mockup Codex. | 🔨 | Gặp Gỡ |
| I8 | Đấu Trường sắp xếp lại; giải đấu tháng tìm người mạnh nhất, thưởng xịn | Đang thiết kế cùng Codex: bố cục mới + Giải Đấu Tháng (luật, thưởng không có Đá Ngọc; bản thử cục bộ, phần toàn cầu Sắp ra mắt). | 🔨 | Đấu Trường |
| I9 | Thanh tiến độ VIP; thẻ dạng cây mốc, mốc cao mở bằng thẻ kích hoạt | Màn VIP & Nạp vẽ lại theo mockup Codex (phòng đọc, cây gỗ): **thanh VIP thật** (1 điểm = 1.000đ nạp xác thực, bậc kế bằng hình, chạm xem 12 bậc); **Sổ Hành Trình là cây mốc dọc** 50 cấp: điểm sổ từ nhiệm vụ (ngày +50, tuần +150, ~20 ngày tới cấp 50), mỗi mốc đạt thì nhận nhánh Thường, nhánh Vàng/Diệu Ngọc có ổ khóa "Chưa kích hoạt" tới khi mua thẻ mùa (mua giữa mùa nhận ngay mọi mốc đã đạt; rương Sử Thi/Huyền Thoại chờ ải 60/80); Nhận tất cả, chấm đỏ đếm mốc nhận được; sang mùa tự cất quà còn sót. **Thẻ Tháng** và **Quỹ** cùng dạng cây (ngày / mốc cấp tướng). Thanh toán vẫn Sắp ra mắt: nút kích hoạt chỉ mở giá + quyền lợi, không có mua thử, không Đá Ngọc từ gameplay. Codex 8,2 điện thoại / 8,1 Studio. | ✅ | VIP & Nạp (Thêm → VIP; Trang Chủ → Thẻ Tháng) |
| I10 | Dựng lại cây kỹ năng | Cây vẽ lại theo mockup Codex: một cành chạm leo thân cây từ gốc lên theo thứ tự mở (Chủ Động → Bị Động → Biến Dị → Chân Thân), phần đã mở sáng, phần chưa mở khô; khung nút theo trạng thái (đồng đã học, vàng nguyệt quế đang chọn, đá có ổ khóa), bảng cấp gỗ, thẻ điều kiện "Cấp 100 / Tiến hóa 2", lá chỉ một bước nên làm tiếp, chồi + "Học" khi học được; 5 ổ khóa cũ thay bằng một nụ ngủ "Sắp ra mắt". Bảng dưới: khay nguyên liệu, thẻ Cấp kế (số lớn), nút mới. Codex 8,4 / 8,2. | ✅ | Kỹ Năng |

