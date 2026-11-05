Gemwoven (Codex) — vòng 7, chỉ kiểm lại 2 lỗi điều phối bạn nêu ở codex-score-6.md và chấm lại Lõi+Sao, Lõi+Bom, chuỗi Sao→Bom. Read-only. Tiếng Việt, ngắn, có số.
Đã sửa trong src/board-sequence.js (clearPlan, quanh dòng 416–442):
1. forEach(join) → forEach(a=>join(a)) (cả hai chỗ), nên chỉ số mảng không còn lọt vào tham số now.
2. join(act) chỉ đặt lịch (waiting: act → fire); join(act,true) khi vụ nổ chạm item sẽ gọi fire ngay và huỷ hẹn giờ cũ, kể cả item đã đặt lịch; started chỉ ghi khi thật sự bắt đầu.
Ảnh: build7-cs (Lõi+Sao), build7-cb (Lõi+Bom), build7-chain (Sao → Bom).
Cần: (1) xác nhận 2 lỗi đã đóng (đọc mã); (2) điểm /10 ba trường hợp; (3) "DUYỆT" nếu cả ba ≥ 8 (các trường hợp khác giữ điểm vòng 6).
