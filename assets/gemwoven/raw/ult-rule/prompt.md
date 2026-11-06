Gemwoven (Codex) — quyết định luật TUYỆT KỸ. Read-only. Tiếng Việt, ngắn, quyết định rõ, có số.

Chủ dự án (06/11): "Thử cho nổ liên tiếp các item đặc biệt. Thanh nộ đầy thì không thấy thi triển luôn để còn tích nộ mới." Đây là yêu cầu của chủ dự án; cần chốt CÁCH làm, không bàn có làm hay không.

Hiện tại (src/gemwoven/board-rules.js ULTIMATE={cost:100,cap:199,perTurn:1}, src/board-control.js boardUltAllowed, src/live-combat.js queueUltimates): tuyệt kỹ tung ngay khi đầy trong lượt của mình nhưng tối đa 1 lần/lượt; thanh nộ chặn ở 199.
Đo (Chrome thật): Lõi+Bom, nộ bắt đầu 90 → đầy ở 1,39 s, tuyệt kỹ xếp hàng nhưng chờ đòn đánh thường đang diễn xong → chiêu ra ở 2,35 s; sau đó chuỗi nổ bơm nộ lên 199 trong 1,2 s, lần đầy thứ hai bị chặn, nộ thừa mất, phải chờ lượt sau.
Mô phỏng special-sim (bot tham dùng item, bảng nộ 3/2/7/2/2, Bom 5×5, Sao 3 làn): nộ/lượt trung bình 68, P95 210 → ~5% lượt đủ 2 lần đầy. balance-sim (không có item đặc biệt): bỏ trần lượt không đổi gì (tỉ lệ thắng giữ nguyên) vì lượt thường không đầy 2 lần.

Đề xuất của Claude:
1. Bỏ giới hạn 1 tuyệt kỹ/lượt cho bên đang đi lượt: mỗi lần nộ chạm 100 trong lượt của mình là tung ngay (xếp trước mọi đòn đánh), tung xong nộ tích tiếp; nhiều lần thì nối tiếp nhau (không chồng 2 chiêu cùng lúc). Giữ trần 199.
2. Tuyệt kỹ chen ngay sau đòn đánh thường đang diễn (không cắt giữa đòn); không chờ board.
3. Áp dụng như nhau cho người chơi, quái/boss PvE và PvP (cùng luật hai bên).
Cần: (1) đồng ý / sửa từng điểm (kèm số); (2) rủi ro cân bằng chính và một giới hạn mềm nếu cần (ví dụ tối đa N lần/lượt) — chỉ nếu số liệu buộc phải có; (3) câu chốt một dòng ghi vào GAME_DESIGN.
