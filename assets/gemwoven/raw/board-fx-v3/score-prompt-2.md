Gemwoven (Codex) — CHẤM vòng 2 ITEM ĐẶC BIỆT + FX board. Read-only. Tiếng Việt, ngắn, có số, GẮT theo ý chủ dự án và checklist của bạn (codex-critique.md, codex-score-1.md trong thư mục này).

Đã sửa theo 6 điểm vòng 1 (mã: src/special-fx.js, src/board-sequence.js clearPlan, src/board-items.css, scripts/prepare_board_special_sounds.py):
1. Bom: xoáy giữ đủ cỡ phủ vùng (scale ~1,0) tới 300ms rồi co liên tục 150ms cuối về 0,8 ô, tắt đúng lúc cầu lửa nở; flash 50ms; xung kích trễ 40ms; rung riêng board 3px/120ms. Bom đứng yên không còn phồng ngọc (chỉ vòng lửa quay 3,5s).
2. Sao: một đồng hồ duy nhất — tâm lưỡi qua ô d tại d×66ms (bỏ +0,5 ô và ×1,08), phím lún 0,11 ô trong 55ms kết thúc đúng lúc lưỡi tới (transform, cùng compositor), rồi vỡ.
3. Chuỗi: item bị chạm kích hoạt sau 50ms kể từ lúc bị chạm (không chờ cả thế hệ trước), vẫn mỗi viên một lần (có dự phòng theo thế hệ). Xem build2-chain.jpg: Sao quét trúng Bom → Bom xoáy ngay.
4. Âm: Sao = 420ms cuối của bản piano thật miết phím đi lên (+ tiếng nhả nốt), phát lúc lưỡi bắt đầu (sau tích 150ms); vù lửa Bom 470ms, hết đúng lúc nổ.
5. Lõi: nâng 0,2 ô; nhóm tia cuối xuất phát ở 240ms, chạm đích trước 320ms; bỏ giới hạn 40 bản sao.
6. Lõi+X: từng nhóm đổi thành item ngay khi tia nhóm đó chạm (trong 240ms), giữ 90ms rồi kích hoạt.
Giới hạn ghi hình như vòng 1 (không GPU, có quãng nhảy khung do sân đấu phía trên vẽ lại).

Ảnh: build2-items.png, build2-bolt.jpg, build2-bomb.jpg, build2-core.jpg, build2-chain.jpg, build2-core-bolt.jpg.

Cần: (1) điểm /10 từng mục như vòng 1; (2) A–E đạt/không đạt, một dòng lý do khi không; (3) nếu còn dưới 8 ở mục nào: tối đa 4 sửa cụ thể có số. Nếu tất cả ≥ 8: ghi "DUYỆT".
