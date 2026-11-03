Thiết kế lại các phần GIAO DIỆN của màn Triệu Hồi (Gemwoven, match-3 RPG mobile dọc, khung 941×1672).

Chủ dự án: "Trong triệu hồi cho review những cái này đi." Ông đánh dấu đúng các phần sau:
(1) bảng dưới tiêu đề "Khế Ước Hỏa Hồ · Tướng nổi bật kỳ này";
(2) cờ dọc góc phải "Ngọc Kết Nối Những Tâm Hồn";
(3) hai nút "Triệu Hồi ×1 · 1 vé" và "Triệu Hồi ×10 · 10 vé";
(4) nhãn "Mảnh tướng" trên rương bên phải;
(5) bảng "Phần Thưởng Hiếm · Kỳ sau: Chưa công bố" với Tướng Mika / Mảnh Mika / Vũ Khí Thần; cùng dòng bảo đảm "Còn 100 lần tới bảo đảm tướng hiếm" + thanh 0/100 và nút "Xem Chi Tiết".
GIỮ NGUYÊN (đã duyệt, không đụng): tranh nền, cổng vòm, viên pha lê trung tâm + pha lê Mika phía trên và hiệu ứng của chúng, cô bé NPC bên trái, đoạn phim triệu hồi. HUD trên và thanh menu dưới cũng giữ.

Ảnh đính kèm:
- summon.png (điện thoại 390×844 DPR2, khung 941×1672 thu về ~390×693 CSS px) và studio-summon.png (trang Studio 1920×911, khung thu về ~512 px rộng): màn hiện tại.
- studio-upgrade.png (Sảnh Anh Hùng), studio-inventory.png (Túi Đồ), studio-shop.png (Cửa Hàng), studio-forge.png (Lò Rèn): màn ĐÃ DUYỆT, chuẩn mỹ thuật.
- summon-bg.png: tranh nền sạch của màn Triệu Hồi (không chữ, không nút). Chú ý: bảng gỗ trên vòm (y≈190–300) có sẵn trong tranh, hai sợi xích treo (x≈395 và 540, y≈300–390), rương pha lê tím vẽ sẵn trong tranh ở x≈735–930, y≈830–1010; bậc thang đá trống từ y≈1150 xuống.
- ref-kit.png: các mảnh vẽ đã có, được phép tái dùng (bộ ui-kit: plaque, plaque-on, btn-gold, btn-steel, tab, tab-on, tab-dark, badge-brass, badge-leather, seal, ribbon-info/warn/done, stat, stat-on, socket, socket-on, round, medal, progress + progress-fill, row-on, setrow, parchment; forge tag/tab/action-ready; biểu tượng ticket (vé), mana (Đá Ngọc), chest, fragment-fire (mảnh Mika), portrait-fire; button-blue, button-gold, flag-gold, tab-wood, nameplate, inventory-slot, title-parchment).

Hiện trạng (tọa độ khung 941×1672; src/gemwoven/screens.js 'summon' + art-screens.js summon()):
- Tiêu đề "Triệu Hồi" chữ vàng trên bảng gỗ có sẵn của vòm. Dưới đó tab-wood [284,268,373,96] ghi 2 dòng "Khế Ước Hỏa Hồ / Tướng nổi bật kỳ này" (chữ 28).
- Cờ vàng dọc [735,135,101,300] với 4 từ xếp dọc "Ngọc / Kết Nối / Những / Tâm Hồn" (chữ 23, mực nâu) — trang trí, không bấm được.
- Pha lê Mika [350,366,240,285] (chạm = xem tướng Mika); pha lê trung tâm [365,579,211,326] (chạm = triệu hồi ×1).
- Nhãn "Mảnh Tướng" (title-parchment [756,919,163,95]) đè lên rương vẽ sẵn; chạm = mở Túi Đồ ở mục Mảnh.
- Hai nút: button-blue [191,991,273,130] "Triệu Hồi ×1 / 1 vé", button-gold [484,991,273,130] "Triệu Hồi ×10 / 10 vé" (chữ 29, chật). Giá: đủ vé → "N vé"; thiếu vé nhưng đủ Đá Ngọc → "120 Đá Ngọc" / "1.200 Đá Ngọc"; thiếu cả hai → "Thiếu N vé". Chạm → popup xác nhận (giữ nguyên).
- Dưới hai nút: nameplate [290,1121,361,60] "1.000 Vé Triệu Hồi" (số vé đang có; chạm = popup vé).
- Bảng tối card-dark [50,1178,842,174]: "Phần Thưởng Hiếm" (trái) + "Kỳ sau: Chưa công bố" (phải, khi có lịch sẽ thành "Kỳ sau: Yuki · 18/11"); ba ô inventory-slot có ảnh + 2 dòng chữ "Tướng / Mika", "Mảnh / Mika", "Vũ Khí / Thần" (chạm = xem tướng / mở mục Mảnh / popup vũ khí Thần).
- Bảng bảo đảm card-dark [51,1348,626,102]: vé + "Còn 100 lần tới bảo đảm tướng hiếm" + thanh 0/100. Nút tab-wood "Xem Chi Tiết" [701,1370,198,67] → popup tỷ lệ (bảng tỷ lệ + luật bảo đảm).
- Luật (không đổi): 1 vé/lượt hoặc 120 Đá Ngọc/lượt; bảo đảm tướng hiếm trong 100 lượt (đếm dry 0..100, mang sang kỳ sau); mảnh tướng sau tối đa 30 lượt không có mảnh; 80 mảnh = 1 tướng. Ảnh chụp là tài khoản thử trên máy dev (1.000 vé, 120.000 Đá Ngọc); tài khoản mới thật có 0 vé, 0 Đá Ngọc (Đá Ngọc là tiền nạp), vé đến từ nhiệm vụ ngày/tuần và quà tân thủ.

Luật dự án (bắt buộc): chữ ít, hình thay chữ, chi tiết sau một chạm; tiền tệ là BIỂU TƯỢNG + SỐ, không viết chữ "vé" / "Đá Ngọc"; không dùng hộp CSS trơn làm thiết kế — khung/nút/bảng là ẢNH VẼ (tái dùng ui-kit hoặc Codex vẽ mới), chữ/số là lớp HTML trên ảnh; nút quay lại luôn bên phải (màn này không có nút quay lại); không đụng tranh nền và pha lê.

== ĐỀ XUẤT CỦA CLAUDE (hãy phản biện từng điểm) ==
P1. Bảng kỳ: bỏ tab-wood hai dòng. Thay bằng một dải băng/biển đỏ-vàng (lửa, hợp Mika) treo đúng vào hai sợi xích có sẵn của tranh, ghi một dòng "Khế Ước Hỏa Hồ" (chữ ~34). Dòng "Tướng nổi bật kỳ này" bỏ (pha lê Mika ngay dưới đã nói điều đó); có thể thêm một con dấu nhỏ "Kỳ này". Chạm biển = popup tỷ lệ/chi tiết kỳ.
P2. Cờ dọc: bỏ khẩu hiệu 4 từ (khó đọc, không có chức năng). Cờ giữ lại nhưng chỉ là HÌNH: huy hiệu lửa/hồ ly của kỳ (không chữ), chạm = xem Mika. Hoặc bỏ hẳn cờ để vòm thoáng. Bạn chọn.
P3. Nút: vẽ mới hai nút lớn hơn (~300×150), xanh pha lê (×1) và vàng (×10), mỗi nút có một ô giá lõm phía dưới. Mặt nút ghi to "×1" / "×10" (có thể kèm chữ nhỏ "Triệu Hồi"); ô giá: biểu tượng vé + "1" / "10"; khi dùng Đá Ngọc: biểu tượng Đá Ngọc + "120"/"1.200"; khi thiếu: số đỏ. Số vé đang có (1.000) chuyển thành một huy hiệu nhỏ "biểu tượng vé + 1.000" giữa hai nút (bỏ chữ "Vé Triệu Hồi").
P4. Mảnh tướng: bỏ nhãn giấy chữ. Đặt trên rương một huy hiệu tròn/khiên nhỏ có hình mảnh ghép Mika + "0/80" (số mảnh của tướng kỳ này / cần để ghép). Chạm = mở mục Mảnh.
P5. Phần thưởng hiếm: một khung vẽ mới (gỗ mật ong + đồng, nhẹ hơn khối tối hiện tại) chứa ba ô ảnh lớn (socket) KHÔNG có chữ dài: chân dung Mika, mảnh Mika, vũ khí Thần; dưới mỗi ô một nhãn rất ngắn ("Tướng", "Mảnh", "Thần") hoặc bỏ nhãn, dùng viền màu bậc hiếm. Tiêu đề nhỏ "Phần Thưởng Hiếm" trên một plaque. "Kỳ sau" thành một tag da nhỏ ở góc: "Kỳ sau: ?" khi chưa công bố (hoặc "Kỳ sau: Yuki 18/11").
P6. Bảo đảm: gộp vào cùng khung với P5 thành một bảng duy nhất ở bậc thang (y≈1180–1460): hàng trên ba phần thưởng, hàng dưới thanh bảo đảm vẽ (ui-kit progress) với chân dung tướng hiếm ở cuối thanh + số "0/100" và chữ ngắn "Bảo đảm tướng hiếm"; nút "Xem Chi Tiết" thành nút tròn "i" (ui-kit round) hoặc cuộn giấy nhỏ ở góc bảng.

Hãy trả lời (tiếng Việt, ngắn gọn, đánh số):
(1) Chấm màn hiện tại /10 (riêng điện thoại và Studio) so với 4 màn đã duyệt, nêu 5 lỗi chính trong các phần được đánh dấu.
(2) Đồng ý / phản biện từng điểm P1–P6; nêu phương án cuối. Lưu ý: ở điện thoại chữ 28 px khung ≈ 11,6 CSS px — chữ tối thiểu bao nhiêu? Thêm điều tôi thiếu (trạng thái thiếu vé, khi có lịch kỳ sau, khi đã có tướng Mika: ô "Tướng" có cần dấu "Đã có"?).
(3) Bố cục cuối cùng theo tọa độ 941×1672 cho từng phần (không chạm pha lê [350,366,240,285] và [365,579,211,326], NPC [100,784,214,251], HUD y<150, thanh menu y>1460).
(4) Danh sách mảnh ảnh cần Codex vẽ (mô tả, kích thước gợi ý); ưu tiên tái dùng mảnh có trong ref-kit.png.
(5) Một prompt image_gen TIẾNG ANH hoàn chỉnh (≤ 260 từ) để vẽ MOCKUP màn Triệu Hồi mới: ảnh dọc 941×1672 (2:3 ok), dùng summon-bg.png làm nền y nguyên và summon.png cho vị trí pha lê/NPC/HUD/menu, các màn đã duyệt làm tham chiếu phong cách; trạng thái: 1.000 vé, mảnh Mika 0/80, bảo đảm 0/100, kỳ sau chưa công bố; ghi đúng chữ tiếng Việt có dấu; cấu trúc OUTPUT / REFERENCES / ART DIRECTION / SCREEN STATE / VISUAL HIERARCHY (tọa độ) / TYPOGRAPHY / AVOID.

Không sửa file.
