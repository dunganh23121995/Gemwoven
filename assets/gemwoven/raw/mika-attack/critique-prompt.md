Gemwoven (Codex) — ĐÒN ĐÁNH THƯỜNG của Mika khi đánh LIÊN TIẾP. Read-only. Tiếng Việt, ngắn, quyết định rõ, có số (ms, px).

Chủ dự án (06/11): "Đánh thường Mika khi đánh liên tiếp động tác có vấn đề. Cho Codex review cùng. Tôi muốn động tác đánh mượt mà hơn. Làm thử với Mika trước."

Bối cảnh: mỗi đợt ngọc Kiếm trên board tạo một "đòn đánh" xếp hàng (src/live-combat.js, vào trước ra trước); một chuỗi combo nhiều đợt → nhiều đòn liên tiếp. Đòn đánh thường: src/combat-v3.js attack() (lùi lấy đà → lao tới → chém → địch giật lùi → quay về vị trí, + COMBAT_V3_PACING scale .45, anticipationHold 150, recoveryHold 90), Mika hình thái 2/3 vẽ lại vết chém và (hình thái 3) chọn khung "slash" riêng trong src/forms-mika.js (combatV3Frame/combatV3Action/combatV3Pose bọc lại, mikaGlaiveShortening). combatV3Charge() phủ một quầng lửa lúc tích lực đòn thường.

Ảnh (điện thoại 430×932, sân đấu, khung cách 100 ms, 3 đòn liên tiếp, mỗi đòn 40 sát thương):
- now-form1.jpg, now-form2.jpg, now-form3.jpg; now-form3-windup.png: cận cảnh 133–267 ms của hình thái 3.
Quan sát của Claude: (1) mỗi đòn đều lùi về hẳn vị trí cũ rồi đứng ~200–300 ms mới lao lại → giật cục; (2) lúc tích lực mỗi đòn có quầng lửa cam phủ kín người Mika ~150 ms, nhìn như tướng mờ/bóng ma; (3) tên chiêu "Liệt diễm trảm" bật lại mỗi đòn; (4) cả chuỗi 3 đòn ~3,3 s.

Cần:
1. Phê bình ngắn (≤6 ý, điểm /10 cho từng hình thái hiện tại).
2. Spec "đánh liên tiếp mượt" cho Mika (áp dụng cả 3 hình thái), có số: khi còn đòn đánh thường của cùng phía nối ngay sau (trong hàng), Mika ở lại phía trước (không quay về), đòn sau bắt đầu từ tư thế kết của đòn trước, đổi hướng chém xen kẽ (ví dụ chém xuống / chém hất lên / chém ngang), nhịp mỗi đòn nối (ms), lực giật của địch, chỉ quay về sau đòn cuối; quầng tích lực chỉ ở đòn đầu và nhẹ hơn (độ mờ tối đa, không che quá X% thân); tên chiêu chỉ hiện một lần cho cả chuỗi; giữ đúng thời điểm trừ máu lúc vũ khí chạm. Không đổi luật/sát thương.
3. Danh sách kiểm tra cứng (đạt/không) để chấm bản dựng sau, theo ý "mượt mà".
