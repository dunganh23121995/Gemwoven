GEMWOVEN — BỘ GHÉP 9 MÀN GIAO DIỆN

Mở Gemwoven.html để xem mã nguồn cùng ảnh rời, không cần server.
Gemwoven_6_Man.html là bản nhúng ngoại tuyến, tên cũ được giữ để tiện mở.
Mở Gemwoven_Assets.html để xem/tải từng background và PNG thành phần.
Chạy python scripts/build_gemwoven.py để tạo lại HTML ngoại tuyến và
Gemwoven_UI_Kit.zip. Hai file đầu ra giữ local, không commit vào Git.

PHẠM VI
9 màn: Trang chủ, Túi đồ, Kỹ năng, Triệu hồi, Đấu trường, Cửa hàng,
Rèn đồ, Tướng/Nâng cấp và Quán bia. Menu dưới gồm đúng 7 biểu tượng:
Trang chủ, Tướng, Túi đồ, Kỹ năng, Triệu hồi, Đấu trường, Thêm.
Các công trình tại Home là từng PNG độc lập có vùng bấm chuyển màn.
Túi đồ có 20 vật phẩm, 7 danh mục, phân trang và xem mô tả vật phẩm.
Kỹ năng có thể đổi 5 tướng và chọn 4 nhánh, tổng cộng 20 thiết kế kỹ năng.
Chỉ ghép giao diện và tương tác cơ bản; chưa triển khai kinh tế, triệu hồi,
nâng cấp thật hay mở khóa kỹ năng. Nút Tăng cấp mở bản xem thông tin.
Game.html giữ nguyên gameplay. Nút Vào trận dẫn đến Game.html;
file game combat không nằm trong ZIP giao diện.

THỐNG NHẤT NHÂN VẬT
Mika, Yuki, Nori và Lumi lấy ảnh từ raw-sheet-clean.png của bộ combat
assets/reimagined/heroes/<hệ>/idle/. Noct lấy từ assets/heroes/shadow/idle/.
Chỉ cắt ảnh toàn thân và chân dung từ bản nguồn, không vẽ đổi khuôn mặt.
Noct luôn đội mũ trùm kín mặt, chỉ thấy mắt xanh; áp dụng cả Quán bia.
Yuki có tai thỏ và trượng băng; Nori có sừng và đại khiên; Lumi tóc vàng,
mũ phù thủy tím; Mika giáp đỏ, khăn sáng màu và đuôi cáo cam.
Manifest ghi nguồn ảnh để truy lại đúng sprite combat.

THIẾT KẾ KỸ NĂNG
Tuyệt kỹ và đặc trưng hiện có giữ theo src/game.js:
Mika: Viêm Long Trảm / Liệt Hỏa Kiếm Tâm.
Yuki: Thiên Băng Giáng / Băng Tâm Hộ Thuẫn.
Nori: Mộc Linh Hộ Thể / Đại Khiên Tích Lực.
Lumi: Ngũ Tinh Lôi / Tinh Điện Cộng Hưởng.
Noct: Ngũ Ảnh Trảm / Vô Diện Ảnh Bộ.
Hai nhánh Biến dị, Chân thân cùng các chỉ số cấp kế tiếp là đề xuất thiết kế,
chưa tích hợp logic combat. Dữ liệu nằm trong src/gemwoven/expansion.js.

ASSET DÙNG CHO GAME
assets/gemwoven/backgrounds/ — 9 nền PNG gốc và 9 WebP chạy thực tế.
assets/gemwoven/items/ — 122 ảnh riêng, gồm 20 biểu tượng kỹ năng,
6 công trình Home, menu, khung, vật phẩm, toàn thân và chân dung tướng.
assets/gemwoven/raw/ — atlas nguồn để cắt/xuất lại asset.
assets/gemwoven/manifest.json — file, kích thước, nguồn và tọa độ cắt.
assets/gemwoven/prompts.json và prompts-v2.json — prompt built-in image_gen.
Atlas nguồn là đầu vào sản xuất; ảnh overview/QA không đưa vào Git.
Ảnh nút/khung không chứa nhãn chữ. Tên, số lượng và mô tả là HTML độc lập.
Nhân vật NPC và trang trí không bấm được thuộc tranh nền.

CHỈNH CHỮ VÀ BỐ CỤC
1. Sửa src/gemwoven/copy.json rồi chạy python scripts/build_gemwoven.py.
2. Sửa bố cục 6 màn gốc tại src/gemwoven/screens.js; 3 màn bổ sung, dữ liệu
   kỹ năng và túi đồ tại src/gemwoven/expansion.js. Canvas 941 × 1672.
3. “Kiểm tra bản ghép → Sửa chữ trực tiếp” cho phép sửa và xuất JSON.
   Thay copy.json bằng JSON vừa xuất để lưu bền; sửa trong UI chỉ giữ phiên.
   Tên/mô tả kỹ năng có khóa riêng cho từng tướng và từng nhánh.
4. Nút “Ẩn toàn bộ chữ” và “Hiện viền vùng bấm” giúp xem các lớp độc lập.

TÁI XUẤT
python scripts/prepare_gemwoven.py
python scripts/prepare_gemwoven_expansion.py
python scripts/build_gemwoven.py
Cần Pillow, NumPy và SciPy. Chạy expansion sau script gốc để giữ bản v2.
ZIP giao diện chứa ảnh cuối và mã nguồn; muốn tái cắt atlas cần checkout repo.

KIỂM TRA
cd qa/gemwoven/runtime
npm ci
npm test
Bài kiểm tra jsdom bao gồm 9 màn, menu 7 mục, 20 kỹ năng/5 tướng, túi đồ,
chuyển màn, chọn item/tab, sửa chữ và các nút xem trước.
Kết quả local: qa/gemwoven/dom-results.json (không commit).
python scripts/render_gemwoven_layers.py tạo bản đối chiếu bố cục theo lớp;
đây không phải screenshot trình duyệt. Phiên làm việc này không có trình
duyệt kết nối nên chưa xác nhận hiển thị thực tế bằng browser.

QUY ƯỚC GIT
Conventional Commits: feat(ui): ..., fix(ui): ..., chore(repo): ...
Commit source, asset game, atlas nguồn, dependency lockfile.
Không commit node_modules, ảnh QA, báo cáo tạm, HTML nhúng hoặc ZIP đầu ra.
Push bình thường; không force push hoặc sửa lịch sử đã chia sẻ.
