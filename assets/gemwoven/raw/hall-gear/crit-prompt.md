Bạn là giám đốc nghệ thuật/UX của Gemwoven (game match-3 RPG dọc, chibi fantasy vẽ tay). Màn cần rà: **Tướng / Sảnh Anh Hùng (#upgrade)**, nửa trên (mọi thứ phía trên dải tướng). Nửa dưới (bảng Cấp, nguyên liệu, nút Tăng Cấp) đã duyệt, giữ nguyên.

Chủ dự án (xem trên Studio, chọn Mika hình thái 3, bật bản thử Báu vật): "Review chỗ này thêm các ô trang bị vũ khí nữa." Ông khoanh hai lá cờ treo: trái "Lộ trình ›", phải "Chỉ số ›" — chữ nhỏ trên tấm vải lớn trống, trông như đồ trang trí chứ không phải nút. Và ông muốn rà sáu ô trang bị (Mũ, Áo, Vũ khí, Kính, Quần, Giày).
Các lỗi chúng tôi thấy thêm: hàng tab Cấp / Tăng Sao / Tiến Hóa — tab "Cấp" bị hào quang lửa của Mika hình thái 3 che; lửa Mika phủ các ô bên trái và nhãn ("Áo" bị cắt); hai ô "Báu vật" của bản thử nằm đè lên tướng chờ trên bệ phải và sát cột ô phải; tấm "Kỹ Năng" và "Xuất chiến" chen chúc dưới cột ô phải (Kỹ Năng đè lên ô Giày); ô đã mặc đồ chỉ ghi "+12 Vũ khí" tràn chữ, không có màu phẩm.

Luật cứng:
- Art tướng và hiệu ứng hình thái đã khóa: không vẽ lại tướng. Được phép giới hạn/cắt (mask) vùng hào quang, đặt lớp UI lên trên hào quang, hoặc dời UI quanh tướng.
- Không dùng hộp CSS làm thiết kế: khung, nút, tấm, icon phải là hình vẽ (Codex image_gen); chữ/số là lớp HTML phía trên. Có thể dùng lại mảnh vẽ sẵn (bộ kit gỗ/da/đồng: kit-round, kit-badge-brass, kit-badge-leather, kit-plaque, kit-btn-gold, kit-socket; inventory-slot; avatar-ring; hình đồ gear-<phẩm>-<ô> cho 5 phẩm Tốt→Thần; forge-socket; hall-flag-tall/short).
- Ít chữ, tiếng Việt ngắn, ưu tiên hình. Bệ tướng chờ hai bên (chạm để chọn) và băng rôn nguyên tố trên tường là thiết kế đã duyệt, giữ.
- Phải không va chạm trong MỌI trường hợp: Hiro hình thái 1 (mảnh), Mika hình thái 3 (hào quang lửa rất rộng), bản thử Báu vật bật/tắt, ô trống/ô có đồ.

Toạ độ sân khấu logic 941×1672 hiện tại (x,y,w,h):
HUD y 0–100; bảng tiêu đề "Tướng" [246,104,449,166] với nút ⓘ hồ sơ [678,146,92,92]; cờ trái Lộ trình [16,159,173,330]; cờ phải Chỉ số [819,141,112,255]; tab [226,268,160,76]×3 (bước 164); tên/hình thái "Mika · Hình thái 3/3 ›" [300,334,342,60]; tướng [309,350,324,346] (hào quang Mika rộng ~1,85× chiều cao thân, lan ra x≈190–750, lên tới y≈110); ô trang bị 110×112: trái x194 (Mũ y354, Áo y476, Vũ khí y598), phải x638 (Kính, Quần, Giày); bảo bối "Dạng 1/5" [415,703,110,112]; sao [184,740,200,38]; Kỹ Năng [586,692,194,66]; Xuất chiến [586,760,194,64]; bệ chờ trái [61,476,140,200], phải [736,476,140,200]; báu vật (chỉ bản thử) [790,530,130,300] gồm nhãn + 2 ô (ô 2 khóa tới tiến hóa 3); dải tướng [60,824,676,116] + nút Tất cả [748,820,124,120]; bảng Cấp từ y 946 trở xuống (giữ).
Trên điện thoại 390 CSS px rộng: 1 đơn vị sân khấu ≈ 0,41 CSS px (chữ 30 đơn vị ≈ 12 CSS px). Studio 1920×911 hiển thị sân khấu cao ~830 px nên còn nhỏ hơn.

Ảnh đính kèm theo thứ tự:
1 phone-hiro.png (điện thoại, Hiro, không bản thử)
2 phone-mika-trial.png (Mika hình thái 3, bản thử bật)
3 phone-mika-gear-trial.png (như 2, có 4 món đồ: Vũ khí Huyền Thoại +12, Áo Sử Thi +5, Mũ Hiếm +3, Giày Tốt +0)
4 studiocrop-mika-trial.png (Studio 1920×911, cắt vùng game)
5 studiocrop-hiro.png (Studio, Hiro)
6 studio-mika-trial.png (Studio toàn trang)
7 ref-forge.png, 8 ref-inventory.png: màn đã duyệt (Lò Rèn, Túi Đồ) làm chuẩn chất liệu/độ hoàn thiện.

Việc cần làm (tiếng Việt, gọn; không sửa file):
A. Chấm hiện trạng /10 cho từng trường hợp: điện thoại Hiro, điện thoại Mika+bản thử, Studio Mika+bản thử, Studio Hiro. Liệt kê lỗi theo mức nặng.
B. Chọn hướng cho hai lá cờ: (1) giữ cờ treo nhưng vẽ lại thành nút rõ ràng (biểu tượng lớn: bản đồ/la bàn cho Lộ trình, cán cân/bảng chỉ số cho Chỉ số, nhãn đọc được trên tấm), hay (2) bỏ cờ, thay bằng hai nút kit (huy chương tròn đồng có icon + nhãn) cạnh bảng tiêu đề, hay hướng khác. Nêu lý do, và nếu bỏ cờ thì vùng tường trống làm gì.
C. Đề xuất bố cục mới nửa trên với toạ độ sân khấu cụ thể cho từng phần tử: tab, tên hình thái, tướng, 6 ô trang bị (ổ vẽ có viền màu phẩm, "+cấp" dạng huy hiệu nhỏ, nhãn tên ô đọc được và không chồng hình đồ), bảo bối, sao, Kỹ Năng, Xuất chiến, bệ chờ, 2 ô báu vật (bản thử). Nói rõ thứ tự lớp (z) so với hào quang tướng, và có cần mask/giới hạn hào quang không (vùng nào).
D. Danh sách mảnh cần Codex vẽ mới (ít nhất có thể; dùng lại kit nếu đủ), mỗi mảnh 1 dòng mô tả.
E. Viết prompt image_gen (tiếng Anh) để vẽ MỘT MOCKUP màn hoàn chỉnh (dọc, giữ tỉ lệ 941×1672 ở giữa ảnh 2:3, nền là sảnh hiện tại), trạng thái: Mika hình thái 3 (cáo chín đuôi lửa, váy đỏ trắng, gậy trăng lưỡi liềm — vẽ gần giống ảnh 2) với hào quang lửa, bản thử Báu vật bật, 4 món đồ như ảnh 3, nửa dưới giữ như ảnh 2. Mockup để duyệt bố cục và chất liệu trước khi dựng.
