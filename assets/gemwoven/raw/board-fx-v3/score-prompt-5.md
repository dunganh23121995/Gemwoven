Gemwoven (Codex) — CHẤM vòng 5 ITEM ĐẶC BIỆT (riêng và ghép). Read-only. Tiếng Việt, ngắn, có số, gắt; đối chiếu codex-score-4.md (vòng trước của bạn) và ý chủ dự án.

Ý chủ dự án MỚI (06/11), ưu tiên trên mọi đề xuất trước: "lần lượt" nghĩa là KHÔNG CÁI NÀO CHẠY CÙNG LÚC, nhưng cái sau chỉ TRỄ cái trước một lúc (0,5 s kể từ lúc cái trước BẮT ĐẦU), KHÔNG chờ cái trước xong hẳn; chúng chồng lên nhau. Áp dụng cho chuỗi item và cho Sao+Sao / Sao+Bom (dọc bắt đầu, 0,5 s sau ngang bắt đầu).

Đã sửa theo vòng 4 của bạn:
- Lịch kích hoạt: mỗi item bắt đầu = max(lúc bị chạm, item trước bắt đầu + 500 ms), chạy chồng (board-sequence.js clearPlan).
- Bom trong chuỗi: tích 60 ms, xoáy 240 ms (co liền nổ). Lõi+Lõi đợt sau: hiện 160, lan 600, bay 220, kéo 300, co 140 ms.
- BÙM: thân cầu lửa đạt đỉnh ở 30% (~90 ms), vòng xung kích 0,9 → 0,55, trễ 50 ms; chớp ≤ 50 ms.
- Chuỗi sao Lõi: đầu nhỏ hơn (50 thay 70), quầng −35%, bỏ drop-shadow trắng, 7 sao đuôi lệch 23 ms, màu trải ba sắc trên mỗi chuỗi.
- Vỡ ngọc: giữ 4 mảnh tới khi có 320 hạt đang sống (trước 160).
- Hiệu năng (Chrome thật có GPU): không còn tác vụ dài > 60 ms ở Bom, Bom+Bom, Lõi+Bom; Lõi+Lõi ~55 ms.
Thời lượng mới đo trên ảnh: Lõi+Bom ~7 s (vòng 4: 11 s), Lõi+Sao ~6 s (8,9 s), Lõi+Lõi 4 đợt ~10–11 s (14,9 s).

Ảnh: build5-bolt, build5-bomb, build5-core, build5-ss, build5-sb, build5-bb, build5-cs, build5-cb, build5-cc, build5-chain (điện thoại 430×932; không GPU, có quãng mất khung).
Cần: (1) bảng 10 dòng điểm /10 + nhận xét; (2) tối đa 5 lỗi còn lại có số; (3) "DUYỆT" nếu mọi dòng ≥ 8.
