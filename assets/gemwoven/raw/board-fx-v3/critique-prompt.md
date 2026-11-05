Gemwoven (Codex) — vòng ITEM ĐẶC BIỆT + HIỆU ỨNG NỔ trên board. Read-only. Trả lời tiếng Việt, ngắn, quyết định rõ, có số.

Chủ dự án (05/11): "Các item đặc biệt đang hơi tệ, nhất là item quét toàn bộ cột và hàng. Item đặc biệt có thể làm lại. Hiệu ứng tương ứng khi nổ chưa có, chỉ mới dừng lại là item nào bị ảnh hưởng và biến mất. Ví dụ Bom: khi kích hoạt thì có hoạt ảnh vùng bị ảnh hưởng có xoáy lửa, xoáy gì đó co lại rồi bùm, các item trong phạm vi mới bị nổ mất. Item quét dọc/ngang: phép quét có tiếng như đàn piano bị miết phím. Tương tự với các item khác: bổ sung hoạt ảnh tương tác board."

Luật (giữ nguyên, src/board-specials.js): Sao băng (ghép 4 thẳng) quét dải 3 hàng (hoặc 3 cột) theo hướng ghép; Bom (L/T) xóa 5×5; Lõi (5 thẳng / cụm 6+) xóa mọi viên một màu; combo khi đổi 2 item: Sao+Sao 3 hàng+3 cột, Sao+Bom 5+5, Bom+Bom 7×7, Lõi+Sao/Bom biến màu đó thành Sao/Bom rồi nổ, Lõi+Lõi cả bàn. FX hiện tại: src/special-fx.js, item trên board: src/board-items.js + board-items.css.

Ảnh: 1 ref-items-now.png = 3 item hiện tại trên board (Sao ngang/dọc: viên ngọc thu nhỏ trên thanh mũi tên đồng + vạch xanh; Bom: viên ngọc trong lồng đồng + ngòi lửa; Lõi: cầu cầu vồng + vành vàng). 2–4 = khung hình mỗi ~60ms của Sao (ref-bolt-now), Bom (ref-bomb-now), Lõi (ref-core-now) trong trận thật, điện thoại 430×932 (lưu ý: tia sáng chỉ ~150ms rồi ngọc biến mất; Bom một vòng vàng mảnh; Lõi gần như không thấy gì).

Đề xuất của Claude (phê bình thẳng, sửa, chốt):
A. Item vẽ lại (ngọc giữ NGUYÊN kích thước, không thu nhỏ; lớp vẽ ánh sáng, không phải đồ kim loại):
 - Sao băng: một dải sao chổi năng lượng xanh-trắng chạy ngang sau viên ngọc, hai mũi tên ánh sáng nhô ra hai bên mép ô, vài tia sao; bản dọc = xoay 90° chỉ lớp sáng. Nhịp thở, mũi tên đẩy ra mép.
 - Bom: vòng lửa xoáy nhỏ quanh viên ngọc (quay chậm), báo trước xoáy lửa khi nổ.
 - Lõi: giữ cầu cầu vồng, to hơn; thay vành vàng bằng quầng cầu vồng xoay.
B. Hiệu ứng nổ (mỗi pha rõ ràng, đọc được trên điện thoại):
 - Sao băng (~0,75s): tích 150ms (item lóe, mũi tên vươn); một "lưỡi sáng" (sóng trăng khuyết xanh cao bằng dải 3 hàng) quét từ item ra hai mép trong ~420ms; mỗi viên trong dải lún xuống như phím đàn (dịch 6px + sáng) rồi vỡ khi lưỡi đi qua, theo thứ tự; âm: một bản thu thật tiếng piano miết phím (glissando, barrel piano CC0) khớp nhịp quét; kết thúc lấp lánh.
 - Bom (~1,0s): kích 120ms (item phồng, vòng lửa quay nhanh); xoáy lửa (hình vẽ xoắn ốc lửa phủ đúng vùng 5×5) xoay và co dần về tâm trong ~450ms, các viên trong vùng bị hút 15% về tâm, nhỏ lại, ửng cam, âm vù lửa; BÙM ~300ms: hình nổ cầu lửa + sóng xung kích + rung màn, các viên văng ra theo hướng tỏa tròn rồi tắt; âm nổ thật.
 - Lõi (~1,1s): cầu bay lên xoay 200ms; tia cầu vồng (dải sáng lăng kính vẽ) bắn từ Lõi tới từng viên cùng màu lần lượt (40ms/viên), đánh dấu; tất cả bị kéo dọc tia về Lõi (~300ms); Lõi co lại rồi nổ sao; âm chuông gió thật.
 - Combo: ghép các pha trên (Sao+Sao hai lưỡi hàng+cột; Sao+Bom xoáy lửa rồi lưỡi dày; Bom+Bom xoáy 7×7; Lõi+X tia cầu vồng biến viên thành X rồi nổ).
 - Trận phía trên vẫn chạy song song (sát thương/giáp/nộ nhận ngay khi viên vỡ), nên FX dài hơn không làm chậm đòn đánh.
C. Mảnh vẽ cần (Codex image_gen, 1 tấm 3×2 nền ĐEN, ghép screen): dải sao chổi cho Sao băng; lưỡi sáng quét; vòng lửa nhỏ quanh Bom; xoáy lửa xoắn ốc (vuông); cầu lửa nổ (vuông); dải tia cầu vồng ngang.

Cần:
1. Phê bình item + FX hiện tại (≤6 ý, có điểm /10 cho từng loại).
2. Chốt/sửa đề xuất A–C: thứ gì sai, thứ gì thiếu, nhịp ms từng pha, độ lớn/độ sáng tối thiểu ở 430×932 (ví dụ xoáy lửa phải phủ ≥ 90% vùng 5×5, lưỡi sáng cao ≥ 2,6 ô...). Viết thành DANH SÁCH KIỂM TRA CỨNG để chấm bản dựng sau này (đạt/không đạt), theo đúng ý chủ dự án: thấy rõ "co lại rồi bùm", thấy rõ "quét như miết phím".
3. Viết lại prompt cho tấm sheet 3×2 nền đen (khối ```PROMPT_FX), đúng 6 mảnh, mỗi mảnh nằm trong ô của nó, không chạm mép ô.
