Thiết kế "ô vật phẩm theo độ hiếm" cho Gemwoven (match-3 RPG mobile dọc, khung 941×1672, mỹ thuật gỗ + đồng vẽ tay).

Chủ dự án (08/11): "Các item đặc biệt xịn như mảnh tướng xịn, vũ khí xịn, nhân vật xịn thì phải có viền đặc biệt như các game khác hoặc item đó trong túi đồ thì có background đặc biệt."

Ảnh đính kèm:
- ref-bag-phone.png: Túi Đồ hiện tại (điện thoại 470×836 DPR2). Mọi ô đều cùng một ô gỗ `inventory-slot` nền nâu trơn: vàng, Đá Ngọc, vé triệu hồi, sách, tinh hoa, quặng, gỗ, vải, quặng Thần, mảnh Hiro, mảnh Mika, mảnh Noct… không phân biệt quý hiếm. Ô to bên trái bảng chi tiết cũng là `inventory-slot`.
- ref-summon-phone.png: màn Triệu Hồi (màn ĐÃ KHÓA, chỉ chủ cho sửa từng điểm). Bảng "Phần Thưởng Hiếm" có ba ô `kit-socket-on` giống hệt nhau: Tướng (chân dung Mika), Mảnh (mảnh Mika), Thần (vũ khí Thần).
- ref-slots.png: các ô vẽ sẵn, từ trái: `inventory-slot` (Túi Đồ), `hall-socket-none/uncommon/rare/epic/legendary/divine` (Sảnh Anh Hùng, viền màu theo độ hiếm, có tấm tên phía dưới, lòng ô nâu trơn), `kit-socket-on`.

Độ hiếm trong game (progression.js RARITIES): Thường #b7b3a3, Tốt #93c487, Hiếm #74b6f0, Sử Thi #c28aff, Huyền Thoại #ffc55b, Thần #ff8585. Trang bị mang độ hiếm riêng; đã có tranh trang bị theo bậc `gear-<rarity>-<slot>`.

== ĐỀ XUẤT CỦA CLAUDE (phản biện từng điểm) ==
R1. Bộ ô mới vẽ cùng dáng `inventory-slot` (khung gỗ + đồng, cùng kích thước 341×319 để thay thẳng), 4 bậc: Hiếm (lòng xanh dương), Sử Thi (lòng tím), Huyền Thoại (lòng vàng cam, tia sáng mờ toả từ tâm), Thần (lòng đỏ thẫm + vàng, tia sáng, viền đồng có góc trang trí). Lòng ô là nền phát sáng hướng tâm, đậm dần ra mép để hình vật phẩm nổi; viền có đá quý cùng màu bậc. Thường/Tốt giữ ô gỗ hiện tại (không thêm gì, để bậc cao thật sự nổi).
R2. Hiệu ứng: Huyền Thoại và Thần có một vệt sáng quét chéo chậm (mỗi ~4 s) và 1–2 ánh lấp lánh (tái dùng sprite `summon-sparkle`); Sử Thi chỉ có nền. Tắt khi người chơi bật giảm chuyển động.
R3. Gán bậc: trang bị theo độ hiếm của nó; mảnh tướng triệu hồi (Mika, Yuki, Nori, Lumi, Noct) = Huyền Thoại; mảnh Hiro = Hiếm; Đá Ngọc = Sử Thi; vé triệu hồi = Sử Thi; tinh hoa tiến hóa = Sử Thi; quặng Thần = Thần; vàng, sách, quặng, gỗ, vải = Thường. Ô chi tiết lớn dùng cùng bậc với vật phẩm đang chọn.
R4. Màn Triệu Hồi: ba ô Phần Thưởng Hiếm đổi sang bậc tương ứng (Tướng = Thần hoặc Huyền Thoại? Mảnh = Huyền Thoại, Vũ khí Thần = Thần). Thẻ lật trong đoạn phim triệu hồi đã có mặt đồng/bạc/vàng, giữ nguyên.
R5. Chỉ một bộ art dùng chung cho Túi Đồ, bảng Phần Thưởng Hiếm, và sau này popup phần thưởng.

Luật dự án: ít chữ, hình thay chữ; không dùng hộp CSS trơn — khung/nền là ẢNH VẼ; hiệu ứng là lớp phủ nhẹ; không đụng tranh nền đã duyệt; vẽ bằng image_gen từ ảnh tham chiếu để đúng phong cách.

Hãy trả lời (tiếng Việt, ngắn gọn, đánh số):
(1) Chấm hiện trạng /10 về khả năng đọc độ quý của vật phẩm (Túi Đồ và bảng Phần Thưởng Hiếm), 3 lỗi chính.
(2) Đồng ý / phản biện R1–R5, chốt phương án cuối (bậc nào có nền, bậc nào có hiệu ứng, gán bậc cho từng loại vật phẩm, ô Tướng trên màn Triệu Hồi dùng bậc nào). Nói rõ có cần Thường/Tốt/Hiếm có ô riêng không, và viền hay nền nên mang màu.
(3) Prompt tiếng Anh cho MOCKUP: sửa ref-bag-phone.png thành Túi Đồ với các ô đã theo bậc (giữ nguyên mọi thứ khác), để Claude và bạn duyệt trước khi vẽ art.
(4) Prompt tiếng Anh cho ART: một tấm sheet nền magenta #FF00FF, 4 ô (Hiếm, Sử Thi, Huyền Thoại, Thần) cùng dáng `inventory-slot`, không có vật phẩm bên trong, không chữ, cách nhau rộng để cắt.
