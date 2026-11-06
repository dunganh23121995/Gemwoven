Gemwoven (Codex) — CHẤM đòn đánh thường liên tiếp của Mika (vòng 1). Read-only. Tiếng Việt, ngắn, có số, gắt theo ý chủ dự án ("động tác đánh mượt mà hơn"; "làm lại bộ đánh thường xuất phát từ ảnh nghỉ trong trận"; "tư thế vung đao lạ") và checklist của bạn (codex-critique.md) + review tư thế (codex-pose-review.md).

Đã làm:
- Đánh liên tiếp (src/combat-v3.js combatV3Link, src/live-combat.js): khi đòn kế trong hàng là đòn đánh thường cùng phía, Mika đứng lại phía trước, đòn sau bắt đầu từ tư thế kết đòn trước (xoay thân ~112 ms, không lùi lấy đà, không quầng tích lực, không tên chiêu lặp, không vệt kéo từ chỗ gốc), địch bật về 67 ms; chỉ đòn cuối mới về chỗ. Sát thương/thời điểm trừ máu giữ nguyên (3 × 40 = 120 cả hai cách). Hàng hành động FIFO (đến trước làm trước).
- Bỏ biểu tượng lửa phủ người Mika lúc tích lực đòn thường (cast-redesign.js; trước đây che người 0,38 s ở độ mờ 0,94), giữ âm và tia lửa nhỏ.
- Hình thái 3: vẽ lại sheet chém từ ảnh nghỉ trong trận theo prompt tư thế của bạn (build2-slash2-sheet.png: nghỉ → rút đao sau vai → tăng tốc → chạm → đi tiếp → về nghỉ), cắt cùng một tỉ lệ cho mọi khung, khóa chân theo dáng nghỉ. Thứ tự khung đòn đầu: rút đao, tăng tốc, chạm, đi tiếp; đòn nối: thu đao lên (khung 6) → rút → tăng tốc → chạm → đi tiếp. Bỏ độ nghiêng/nhún riêng từng nhát (+7°/−10°/+12°) của hình thái 3.
- Đo nhịp (hình thái 3): chạm ở 613 / 1017 / 1416 ms → khoảng 404 / 399 ms; toàn chuỗi về nghỉ ~1,8 s.
Ảnh: build3-form1.jpg, build3-form2.jpg, build3-form3.jpg (khung cách ~55 ms, sân đấu điện thoại; ba đòn ×40), build2-slash2-sheet.png (sheet thô hình thái 3).
Cần: (1) điểm /10 từng hình thái + từng mục checklist đạt/không; (2) tối đa 5 sửa đổi có số; (3) "DUYỆT" nếu cả ba ≥ 8.
