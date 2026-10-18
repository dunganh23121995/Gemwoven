GEMWOVEN — GIAO DIỆN VÀ VÒNG CHƠI CÓ LƯU TIẾN ĐỘ

CHẠY
python build.py
python scripts/build_gemwoven.py
python -m http.server 8765
Mở http://localhost:8765/Gemwoven.html. Home và Game phải chạy cùng origin để
chia sẻ localStorage. Gemwoven_6_Man.html vẫn giữ tên cũ, hiện là bản nhúng hub.
Game.html là bản nhúng combat. ZIP chứa cả hai và ảnh/source giao diện.

PHẦN CHƠI ĐÃ CÓ
20 màn trong hub. Trang Tướng quản lý luôn trang bị; Khám Phá ẩn menu và có nút back riêng.
Tân là tướng miễn phí ban đầu; kỳ triệu hồi đầu phát hành Mika. Mỗi kỳ chỉ
có một tướng hiếm trong pool; các tướng khác hiện có trang xem trước.
30 chương × 50 ải = 1.500 ải; boss vô hạn theo tầng; nhiệm vụ ngày, thưởng offline 12 giờ.
Chương 21–30 bổ sung 10 boss theo ảnh tham khảo, giữ nguyên 14 boss và 20 chương trước.
Mỗi boss mới có 3 pha HP, 6 chiêu chủ động, nội tại chủ đề, vỏ và hộ vệ có HP riêng.
Tinh anh mốc 10/20/30/40 lần đầu đạt 3 sao cho 3 mảnh đồ khắc chế của đúng chương.
Đủ 3/6/9/12 mảnh tự nâng 4 bậc hiệu lực 35/50/65/80%; không hao khi thua.
Thiếu đồ vẫn vào boss được; cần xử lý cơ chế hoặc có chỉ số rất mạnh.
Thiết kế đầy đủ: docs/BOSS_CHAPTERS.html; dữ liệu xuất: docs/boss-chapters.json.
Cấp tối đa 500, 6 sao, 6 bậc tiến hóa từng phần, kỹ năng tối đa 10 cấp.
Túi tài nguyên, ghép mảnh, trang bị theo phẩm chất, rèn/cường hóa/phân rã.
Triệu hồi có vé/Đá Ngọc, tỷ lệ và bảo đảm công khai, hoạt ảnh trước kết quả.
Popup trước khi chi: ưu tiên đủ vé, thiếu vé mới đề xuất Đá Ngọc; hủy không trừ.
Bản đồ Khám Phá có 20 nền chủ đề; quái thường/tinh anh/boss, 1–3 sao/ải,
rương 50/100/150 sao. Đợt trước thêm 10 boss và 38 quái theo chủ đề.
Đợt này thêm 10 boss, 30 quái thường, 20 tinh anh, 10 đồ khắc chế và 10 nhạc chủ đề;
giữ nguyên nhạc Home. Các vùng mới dùng lại nền cùng chủ đề, có quái và boss mới.
Sáu ô đồ quanh tướng: áo, mũ, vũ khí, giày, quần, kính; đồ dùng chung giữa tướng.
Ô bảo bối giữa dưới nhân vật: sáu bảo bối riêng, mỗi loại có năm dạng tiến hóa,
nâng tối đa cấp 100. Chọn đồ và cường hóa ngay trong trang, không popup hồ sơ tướng.
Cửa hàng bán vật liệu thường bằng vàng, đồ quý bằng Ngọc; không bán tướng.
Home giữ Nhiệm Vụ riêng; rương offline ở thanh phải; âm thanh chỉ mở từ Home.
Chat có soạn tin, biểu cảm, lưu tin cục bộ và tab nhật ký hệ thống.
Chỉ số, kỹ năng, hiệu ứng đồ Thần và hình tiến hóa được nối vào combat.
PvP cục bộ 1vs1 hai người cùng thiết bị dùng Tân chuẩn hóa; có đấu tập AI riêng.
Kết quả trận có mã biên nhận, không cộng thưởng lặp khi gọi lại kết quả đó.

KINH TẾ
Đá Ngọc khởi đầu 0, không có trong bất kỳ thưởng gameplay nào.
Chỉ được nhận Đá Ngọc từ nạp tiền xác thực, hệ thống này chưa mở.
Vàng từ ải/boss/nhiệm vụ/offline. Vé từ nhiệm vụ ngày và các mốc cấp tướng.
Từ cấp 1 lên 500 cần 589.804 Ấn. Trần toàn tài khoản 1.600 Ấn/ngày cho cận
dưới 369 ngày khi tập trung một tướng; thiếu vàng/EXP hoặc nghỉ ngày sẽ lâu hơn.
Chi tiết công thức, tỷ lệ, mốc và thiết kế: GEMWOVEN_SYSTEMS.txt.

COMING SOON
Nạp/VIP, sự kiện có thưởng, chat trực tuyến, PvP online, 3vs3 và BXH liên máy chủ.
Trang Sự kiện nhận cấu hình từ Studio local: ID, lịch, banner, mô tả, bật/tắt.
Studio có xuất JSON; schema trong docs/event.schema.json.
docs/server-contract.json mô tả ranh giới và API dự kiến, chưa phải backend.
VIP hiện chỉ hiển thị các mốc dự kiến, không thu tiền hoặc trao đặc quyền.
Không xem client save là dữ liệu đáng tin cho giao dịch hoặc xếp hạng online.

SOURCE CHÍNH
src/gemwoven/progression.js — mô hình kinh tế/progression dùng chung hub/combat.
src/gemwoven/progression-ui.js và progression.css — các màn có dữ liệu thật.
src/progression-combat.js và progression-combat.css — nối mô hình với combat.
src/gemwoven/screens.js, expansion.js — các lớp bố cục và ảnh mẫu ban đầu.
src/gemwoven/copy.json — chữ cho lớp bố cục mẫu; build tạo lại copy.js.
Nội dung tương tác mới lấy từ progression.js và progression-ui.js, không từ
số liệu demo trong copy.json. Toàn bộ chữ là HTML, độc lập với ảnh.

ASSET
assets/gemwoven/backgrounds/ — 9 nền PNG và bản WebP chạy thực tế.
assets/gemwoven/items/ — các PNG rời, gồm tướng/portrait, menu, item và đồ tiến hóa.
assets/gemwoven/raw/ — atlas nguồn sản xuất; không phải ảnh overview để trình bày.
assets/heroes/novice/ — idle/attack/cast/hurt/run của Tân, frame và metadata/QC.
Run có chu kỳ riêng 4 tư thế, 100ms/frame; không dùng lại động tác đánh kiếm.
Hurt hiện dùng lại pose attack kèm chuyển động recoil của runtime.
assets/gemwoven/novice-items.json — các entry tích hợp Tân và overlay tiến hóa.
assets/gemwoven/novice-prompts.json — prompt ImageGen được thực hiện bởi Astra High.
Noct tiếp tục dùng bộ combat gốc, mặt che kín chỉ lộ mắt xanh.

TÁI XUẤT ẢNH
python scripts/prepare_gemwoven.py
python scripts/prepare_gemwoven_expansion.py
python scripts/prepare_novice_art.py
python build.py
python scripts/build_gemwoven.py
Cần Pillow, NumPy và SciPy. Build hub hợp nhất novice-items.json vào manifest.
Các atlas, master và metadata giữ trong repo để tái xuất không cần tạo ảnh lại.

KIỂM TRA
cd qa/gemwoven/runtime
npm ci
npm test
npm run test:art
npm run test:offline
test: mô hình kinh tế/giới hạn, DOM của 20 màn, combat lưu chỉ số và PvP cục bộ.
test:art: regression bố cục 9 concept cũ. test:offline: smoke test HTML nhúng.
DOM không kiểm tra pixel/layout của browser. Phiên hiện tại không có browser
kết nối nên chưa xác nhận bố cục bằng trình duyệt thật.
art-screens.js gắn dữ liệu thật vào các lớp ảnh của 9 màn gốc, giữ cây kỹ năng,
cột danh mục túi đồ, cổng triệu hồi, bảng nhiệm vụ và menu có nhãn chữ riêng.
python qa/gemwoven/render-layers.py ghép preview lớp ảnh từ layout.json do
check-live-ui.cjs xuất ra; chỉ dùng xem bố cục tĩnh, không thay QA trình duyệt.

GIT
Conventional Commits. Giữ source/asset game, atlas, metadata, test và lockfile.
Không commit HTML hub nhúng, ZIP, node_modules hoặc ảnh QA/contact-sheet.
