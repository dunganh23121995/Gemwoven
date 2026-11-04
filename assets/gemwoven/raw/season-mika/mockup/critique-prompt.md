Bạn là Codex, đồng thiết kế giao diện Gemwoven (game match-3 nhập vai dọc, khung sân khấu 941×1672, điện thoại 390×844). Trả lời tiếng Việt, gọn.

Việc: thiết kế lại tab Sổ Hành Trình (màn VIP) thành "Hành Trình Của Mika" (mùa 1 là mùa của Mika, theo bố cục F bạn đề xuất ở vòng "Mùa của tướng") và một trang sự kiện mới "Đồng Hành Cùng Mika" mở từ màn Sự Kiện.
Luật (đã cài trong src/gemwoven/liveops.js SEASONS/HERO_PASS/COMPANION, progression.js companionView/pass): 
- Sổ 50 cấp, 3 nhánh Thường/Vàng 149k/Diệu Ngọc 299k (gồm Vàng). Mốc ★ 10·20·25·30·40·50: Thường 10 avatar Mika; Vàng 10 khung avatar, 20 danh hiệu "Bạn Đồng Hành Hỏa Hồ", 30 thẻ tên, 40 bong bóng chat, 50 10 vé; Diệu Ngọc 25 khung trận, 40 hiệu ứng vào trận, 50 80 mảnh Mika. Thường có 4 mảnh Mika ở cấp 5/10/15/20/25. Diệu Ngọc: nhận ngay 1 bản Mika khi mua (máy chủ giao, thanh toán Sắp ra mắt). 
- Sự kiện ngày 1–14: mỗi ngày xong 3 nhiệm vụ ngày → 2 mảnh (14 ô ngày); mỗi chương (ngày 1 và ngày 8) 2 nhiệm vụ: thắng 15 trận vượt ải → 8 mảnh, thắng 8 trận Trùm Vô Tận → 8 mảnh; tổng 60. Làm bù đến ngày 28: ngày có 6 trận PvE thắng lấp 1 ngày lỡ sớm nhất, mỗi ngày 1 lần. Sổ 20 + sự kiện 60 = 80 mảnh = ghép Mika ngày 14. Ngày 15–28 là sự kiện nguyên liệu (ô ngày cho quặng + tinh hoa; 2 nhiệm vụ cho sách/vàng/tinh hoa).
- Đồ trang trí không chỉ số, có "Bộ sưu tập" để xem và Trang bị.
Luật chủ dự án: ít chữ, hình thay chữ, số dạng 123/456 xanh khi đủ đỏ khi thiếu, chi tiết sau một chạm; nút back luôn bên phải; không làm mờ nền; mọi khung là tranh vẽ (không hộp CSS); popup có × trong khung.
Ảnh: 1) màn Sổ hiện tại (điện thoại), 2) bộ đồ trang trí mùa Mika Codex đã vẽ (khung avatar, băng danh hiệu, thẻ tên, bong bóng chat, góc khung trận, huy hiệu mùa), 3) Mika (đã khóa, không đổi).

Cần:
A. Phê bình màn Sổ hiện tại khi thành "mùa của Mika" (≤6 ý).
B. Bố cục chi tiết cho Sổ mới (toạ độ gần đúng trong 941×1672: từ HUD đến thanh điều hướng, giữ thanh VIP gọn + 3 tab Sổ/Thẻ Tháng/Quỹ), gồm tranh mùa có Mika, đích "Diệu Ngọc · nhận Mika ngay", thanh cấp, đầu 3 cột ghim, mốc ★ cao hơn hiện đúng hình món trang trí, nút nhảy mốc, nút Bộ sưu tập, đáy Nhiệm vụ/Nhận tất cả.
C. Bố cục trang "Đồng Hành Cùng Mika" (toàn màn, nền vẽ, back phải): tiến độ mảnh tới 80 (ghép Mika), 14 ô ngày (trạng thái: đã nhận/ sẵn sàng/ hôm nay/ lỡ/ tương lai/ đã bù), làm bù, 4 nhiệm vụ chương, nút Nhận; giai đoạn nguyên liệu ngày 15–28.
D. Hai prompt tiếng Anh để vẽ mockup bằng image_gen (mỗi cái một màn dọc 941×1672, phong cách tranh vẽ ấm như ảnh hiện tại, dùng đúng các món trang trí và Mika trong ảnh tham chiếu, chữ tiếng Việt ngắn có dấu đúng).
