GEMWOVEN — BỘ GHÉP 6 MÀN GIAO DIỆN

Mở Gemwoven.html để chạy trực tiếp từ mã nguồn và ảnh rời, không cần server.
Mở Gemwoven_Assets.html để xem/tải từng background và PNG thành phần.
Chạy python scripts/build_gemwoven.py để tạo Gemwoven_6_Man.html và
Gemwoven_UI_Kit.zip. Hai file đầu ra được giữ local và không commit vào Git.

PHẠM VI
Tái tạo bố cục của 6 concept bằng các lớp ảnh và chữ độc lập; chuyển màn,
chọn tab/vật phẩm/chế độ, mở và đóng bảng xem cơ bản. Chưa triển khai kinh tế,
triệu hồi thật, nâng cấp thật hoặc nhiệm vụ. Gameplay cũ trong Game.html
được giữ nguyên. Nút Vào trận dẫn đến Game.html; file game cũ không nằm trong ZIP.

ASSET GIỮ LẠI ĐỂ DÙNG CHO GAME
assets/gemwoven/backgrounds/ — 6 nền PNG gốc và WebP tối ưu để chạy.
assets/gemwoven/items/       — 62 PNG riêng; 61 ảnh có alpha và 1 tranh nhiệm vụ.
assets/gemwoven/raw/         — 5 atlas nguồn để cắt/xuất lại các item.
assets/gemwoven/manifest.json — tên file, kích thước, nguồn và tọa độ cắt.
assets/gemwoven/prompts.json — prompt tạo hình bằng built-in image_gen.

Atlas nguồn là đầu vào tái tạo asset, không phải ảnh overview để trình bày.
Ảnh kiểm tra, contact sheet và 6 ảnh concept đối chiếu đã được loại bỏ.
Chức năng đối chiếu ảnh gốc cũng đã được gỡ để không phụ thuộc ảnh đã xóa.

Ảnh vật phẩm/khung/nút không chứa nhãn chữ. Tên màn, nhãn, giá, số lượng,
chỉ số và nội dung là các lớp HTML. Nhân vật/trang trí không bấm được của
cửa hàng, lò rèn và quán bia thuộc tranh nền.

CHỈNH CHỮ VÀ BỐ CỤC
1. Sửa src/gemwoven/copy.json, mỗi nhãn có khóa màn.item.
2. Chạy python scripts/build_gemwoven.py để cập nhật copy.js và bản đóng gói.
   Có thể sửa nhanh copy.js để Gemwoven.html nhận ngay, nhưng lần build sau
   sẽ lấy nội dung từ copy.json.
3. Sửa tọa độ, kích thước, ảnh và action trong src/gemwoven/screens.js.
   Canvas thiết kế 941 × 1672; mỗi node có id, rect, asset, action.
4. Có thể bật “Kiểm tra bản ghép → Sửa chữ trực tiếp”, sửa trên giao diện,
   xuất JSON, dùng JSON đó thay copy.json rồi build. Chữ sửa trong giao diện
   chỉ giữ trong phiên hiện tại cho đến khi được xuất ra file.

KIỂM TRA
- Hiện viền vùng bấm và ẩn chữ để kiểm tra từng lớp độc lập.
- Điều hướng bằng thanh dưới cùng, menu cạnh khung, Trang Chủ hoặc Thêm.
- Bài kiểm tra jsdom thực thi 178 nút trên 6 màn, kiểm tra asset, nhãn truy cập,
  chuyển màn, chọn vật phẩm/số lượng, tab, đóng/mở bảng và sửa chữ.
- Kết quả local: qa/gemwoven/dom-results.json (không commit).
- Chưa kiểm tra trực tiếp trên trình duyệt vì phiên tạo ban đầu không có
  trình duyệt kết nối. Bài kiểm tra DOM không thay cho kiểm tra hình ảnh.

Cài và chạy kiểm tra từ thư mục dự án:
  cd qa/gemwoven/runtime
  npm ci
  npm test

Tái xuất item từ atlas: python scripts/prepare_gemwoven.py
Cần Pillow, NumPy và SciPy. quest-scene.png là ảnh nguồn cuối đã cắt riêng.
Tạo ảnh kiểm tra local khi cần: python scripts/render_gemwoven_layers.py
Ảnh này là bản ghép theo tọa độ, không phải screenshot trình duyệt.

QUY ƯỚC GIT
- Conventional Commits: feat(ui): ..., fix(ui): ..., chore(repo): ...
- Commit mã nguồn, asset game, atlas nguồn và lockfile dependency.
- Không commit node_modules, ảnh QA, báo cáo tạm, HTML nhúng hoặc ZIP đầu ra.
- Push bình thường; không force push hoặc sửa lịch sử đã chia sẻ.
- Sau clone, mở Gemwoven.html hoặc chạy build để tạo bản HTML ngoại tuyến.
