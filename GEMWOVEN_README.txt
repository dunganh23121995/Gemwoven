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
Các màn Túi Đồ, Kỹ Năng, Tướng, Triệu Hồi, Cửa Hàng, Rèn Đồ, Quán Bia
và Đấu Trường dùng nền vẽ tay *-painted.webp. Màn phụ kế thừa nền tương ứng.
assets/gemwoven/painted-backgrounds.json giữ đường dẫn ảnh chạy, ảnh gốc và prompt;
build hub hợp nhất catalog này sau manifest để giữ nền đã duyệt khi tái xuất.
Raw và prompt nằm trong assets/gemwoven/raw/screens-painted-a, -b, -c.
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
npm run test:browser
test: mô hình kinh tế/giới hạn, DOM của 20 màn, combat lưu chỉ số và PvP cục bộ.
test:art: regression bố cục 9 concept cũ. test:offline: smoke test HTML nhúng.
DOM không kiểm tra pixel/layout của browser. test:browser chạy Chrome headless
với hồ sơ lưu riêng: 20 màn, 30 chương, thẻ triệu hồi ×1/×10, điểm đứng combat,
camera ba lớp, mobile và giảm chuyển động. Có thể đặt BROWSER_CHANNEL=msedge.
art-screens.js gắn dữ liệu thật vào các lớp ảnh của 9 màn gốc, giữ cây kỹ năng,
cột danh mục túi đồ, cổng triệu hồi, bảng nhiệm vụ và menu có nhãn chữ riêng.
python qa/gemwoven/render-layers.py ghép preview lớp ảnh từ layout.json do
check-live-ui.cjs xuất ra; chỉ dùng xem bố cục tĩnh, không thay QA trình duyệt.

CHI TIẾT GIAO DIỆN — 20/10/2026
Khám Phá ghép cây đậu thần từ thân, cuống và lá độc lập trên cảnh xa.
modular-map-items.json giữ điểm đứng và đầu nối theo pixel ảnh.
Ảnh gốc, prompt và metadata cây ở assets/gemwoven/beanstalk/.
Thư mục beanstalk/themes/ chứa bộ thân kép, lá và cuống riêng theo boss.
Build hợp nhất các art-catalog-*.json; journey-ui chọn bộ theo chapter.boss.
Các chương gặp lại cùng boss dùng chung bộ hình; earth/chương 1 giữ bộ xanh gốc.
Điểm đứng, điểm nối và độ chồng đoạn thân lấy từ metadata của từng bộ.
Build đo footBounds từ alpha sprite; quái, số ải và nhãn thuộc cùng một lá.
Thân và lá nhấp nhô đồng bộ để đầu nối luôn khớp. Home chuyển động từng đảo;
ảnh, chữ và vùng bấm cùng một nút. Reduced motion tắt các chuyển động này.
Sáu bảng hiệu Home và bảng Nhiệm Vụ có đường chữ đo theo pixel của ảnh;
SVG cùng viewBox và tỉ lệ kéo giãn với ảnh nên giữ đúng vị trí khi co màn.
Home có ánh sáng cổng triệu hồi, vòng sáng, than hồng, đuốc và hơi nước,
cùng lá bay nhẹ. Hiệu ứng gắn vào công trình, không chặn nút và dừng khi
tab bị ẩn; tùy chọn giảm chuyển động sẽ tắt các hiệu ứng trang trí.
Các kiểm tra tự động về terrain-band cũ cần chuyển sang cấu trúc bục mới
trước lần chạy bộ regression tiếp theo.
Ô nguyên liệu có hàng số lượng riêng; bản sao dùng chân dung tướng đang xem.
Triệu hồi lưu kết quả trước hoạt ảnh, tạo thẻ úp rồi cho lật từng thẻ/mở tất cả;
đóng sớm vẫn giữ kết quả. Không đổi tỷ lệ, giá hoặc phần thưởng.
Combat dùng 12 ảnh tại assets/scenes/painted/ cho bốn hệ, ba lớp mỗi hệ.
manifest.json và source/ trong thư mục đó giữ hình học, prompt và ảnh gốc.
Mặt đất ở 82% chiều cao; build đo điểm chân từ alpha của sprite idle.
Lớp xa vẫn mang chi tiết chương; mặt đất và tiền cảnh chạy riêng khi rời trận.
Cụm thẻ treo bên trái dùng chung safeRects và tâm x=92 với avatar trên các màn.
Home có Thẻ Tháng (Coming soon). Vòng cấp quanh avatar là cung dày từ 6 giờ
qua bên trái đến huy hiệu cấp; dữ liệu vẫn là cấp tướng / 500.
Hub chạy localhost, 127.0.0.1, ::1 hoặc file nhận một lần 1.000 vé thử triệu hồi,
ghi dấu summon-preview-2026-10 trong previewGrants. Tài khoản cũ giữ nguyên
tài nguyên và tiến độ; không lặp lại khi tải lại trang.
Theo yêu cầu thử triệu hồi, bản local cấp thêm một lần 120.000 Đá Ngọc,
ghi dấu summon-gems-preview-2026-10. Chỉ bật qua tùy chọn previewGems;
luồng thưởng gameplay vẫn từ chối cấp Đá Ngọc.
Combat phân kích thước thường / tinh anh / boss; boss có hào quang nguyên tố.
Idle ít khung dùng tư thế chuẩn và nhịp thở liên tục bám chân; vòng idle từ
8 khung trở lên giữ playback tác giả. Không thay ảnh hoặc khung đánh của tướng.

HÌNH THÁI SAO VÀ HỒ TINH TÚ — 20/10/2026
Mika, Yuki, Nori, Lumi và Noct có ba hình thái: 1–3 sao, 4–5 sao, 6 sao.
Tân giữ hình thái ban đầu. progression.js cung cấp heroForm() cho hub và combat.
Hình thái thay toàn bộ cơ thể, vũ khí, chân dung và bộ đứng/đánh/niệm/di chuyển.
Mỗi hình thái mới có 8 khung idle và 6 khung cho từng hành động còn lại;
khung chân và đỉnh đầu được ghi trong assets/heroes/forms/*/forms.json.
Ảnh gốc, prompt chính xác và công cụ tái xuất được giữ trong cây thư mục art.
Trang Tướng có nút “Hình thái” dưới tên để xem trước cả ba mức.
Màn Home và Tướng dùng idle WebP; tùy chọn giảm chuyển động dùng ảnh tĩnh.
Hình thái cuối có hiệu ứng lửa, sương băng, lá, mây tinh tú hoặc khói nguyệt thực.
Riêng Noct dùng vân khói đen tím chuyển động quanh cơ thể và bóng cuộn dưới chân:
4 sao có bốn dải bóng, 6 sao có tám dải cùng lớp khói dày hơn.
form-effects.js dùng chung hiệu ứng này ở hub và combat; vệt đánh/niệm của Noct
giữ màu tối, không dùng screen blend làm mất phần bóng đen.
Combat dùng bộ động tác mới và hiệu ứng ra chiêu theo hình thái, giữ công thức
sát thương, trạng thái, tỷ lệ triệu hồi và chi phí hiện có.
living-scenes.css và ambientScene() thêm chuyển động theo từng màn:
than hồng ở Rèn, ánh nến/hơi nước ở Quán Bia, ánh ngọc ở Kỹ Năng/Triệu Hồi.
Các lớp trang trí không nhận pointer, tôn trọng reduced motion và dừng khi ẩn tab.
summon-cinematic.js dựng hoạt cảnh thời gian thực khoảng 4,8 giây:
sao rơi xuống hồ, sóng lan, thẻ úp xuất hiện rồi người chơi mở từng thẻ.
Chỉ một nút “Mở tất cả”; dấu × đóng kết quả. Phần thưởng được lưu trước hoạt cảnh.
Viền Huyền Thoại màu vàng, viền Thần ánh kim cương. Ảnh hồ và prompt nằm tại
assets/gemwoven/summon-lake/. Build hub tạo các hub-idle.webp từ atlas idle.

GIT
Conventional Commits. Giữ source/asset game, atlas, metadata, test và lockfile.
Không commit HTML hub nhúng, ZIP, node_modules hoặc ảnh QA/contact-sheet.
