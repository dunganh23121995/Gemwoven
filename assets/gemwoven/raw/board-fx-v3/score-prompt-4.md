Gemwoven (Codex) — CHẤM vòng 4 toàn bộ ITEM ĐẶC BIỆT: kích hoạt riêng và ghép với nhau. Read-only. Tiếng Việt, ngắn, có số, GẮT theo ý chủ dự án (dưới đây) và checklist của bạn (codex-critique.md, codex-score-3.md).

Ý chủ dự án từ vòng 3 tới nay (05–06/11), đã làm (mã: src/special-fx.js, src/board-sequence.js clearPlan):
- Bom: xoáy lửa TRÒN (không vuông) co lại rồi BÙM; ngọc vỡ theo vòng từ tâm ra (35 ms/vòng).
- Ngọc bị item phá: phồng sáng, tách 4 mảnh văng ra, rồi bụi sao NHIỀU MÀU (6 ngôi sao vẽ: hồng, vàng, xanh lá, xanh trời, tím, cầu vồng) bung ra từ chỗ vỡ, lơ lửng nhấp nháy, trôi ra rồi vỡ thành tia nhỏ và tan (2,2–3 s).
- Sao băng: sau khi quét, vệt sáng mờ dần trên làn.
- Lõi: vành dải lụa cầu vồng quay quanh xích đạo (elip); chuỗi sao cong nhiều màu bay LẦN LƯỢT tới từng viên (~1,1 s, cách nhau ~0,1 s, chồng lên nhau), viên bị kéo về theo đường cong.
- Lõi + Lõi: nổ toàn bàn SỐ LẦN = số item đặc biệt trên bàn, mỗi đợt khởi từ một item (hóa Lõi tại chỗ).
- Item đặc biệt kích hoạt LẦN LƯỢT, không song song; Sao băng sau một item khác chờ 0,5 s.
- Sao + Sao, Sao + Bom: quét DỌC trước, xong 0,5 s sau mới quét NGANG (không còn ô xoáy chạy trước).
- Lõi + Bom / Lõi + Sao: viên hóa Bom/Sao khi tia sao chạm, rồi nổ từng cái theo thứ tự.
- Hiệu năng: đã sửa đứng hình (Bom+Bom 0,79 s → không còn tác vụ dài; Lõi+Lõi 0,51 s → ~55 ms) bằng hàng đợi hạt + ngân sách hạt.
Giới hạn ghi hình: trình duyệt không GPU, khung cách đều theo thời gian, có quãng mất khung; chấm hình ảnh và nhịp.

Ảnh (điện thoại 430×932): build4-bolt (Sao), build4-bomb (Bom), build4-core (Lõi), build4-ss (Sao+Sao), build4-sb (Sao+Bom), build4-bb (Bom+Bom), build4-cs (Lõi+Sao), build4-cb (Lõi+Bom), build4-cc (Lõi+Lõi, 4 item trên bàn → 4 đợt), build4-chain (Sao chạm Bom → nổ dây chuyền).

Cần:
1. Bảng điểm /10 cho từng trường hợp (10 dòng) + một dòng nhận xét; không lấy trung bình.
2. Lỗi theo mức nghiêm trọng (tối đa 8), mỗi lỗi chỉ rõ trường hợp, khung (ms) và con số sửa (ms, cỡ, số hạt...). Chỉ những gì sửa được bằng code hoặc cắt lại mảnh đã có.
3. Đánh giá riêng nhịp tổng: trường hợp nào QUÁ DÀI cho trải nghiệm (s) và đề xuất trần thời gian.
4. Nếu mọi trường hợp ≥ 8: ghi "DUYỆT".
