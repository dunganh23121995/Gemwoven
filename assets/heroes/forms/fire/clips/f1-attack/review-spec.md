**7/10 — LÀM LẠI spec trước khi gen.** Ba mốc đúng nhân vật và đọc rõ động tác; chưa duyệt vì nhịp 24 khung chưa khớp game.

- **Khung 7–14:** dành 8 khung × 40ms = **320ms cho nhát chém**, chưa thể hiện “Q, nhanh”. Nếu `cut` ở khung 14 thì chạm lúc 560ms, trễ hơn mốc ~427ms.
- **Toàn clip:** 24 × 40ms = **960ms**, dài hơn nhịp ~760ms. Trong [attack()](/D:/Project/Gemwoven/src/combat-v3.js:249), đòn thường đầu chạm khoảng 427ms sau hệ số `.45`; đòn nối có nhịp riêng.
- **Q, chân và thân:** “stepping into it” dễ tạo bước chân lệch giữa các mốc, cộng thêm chuyển vị do runtime. Giữ bàn chân bám nền, chỉ chuyển trọng lượng theo ảnh.
- **P, tay và kiếm:** “draws the katana” dễ hiểu thành rút kiếm khỏi vỏ. Kiếm đã ở trên tay; nên nói đưa kiếm đang cầm về đúng thế `back`.
- **Khung 0/23 và điểm nối P→Q→R:** ba mốc là ảnh tĩnh, chưa chứng minh tóc/khăn/đuôi chuyển động liên tục. “never frozen” nên thêm biên độ nhỏ và tính liên tục, tránh phụ kiện quẫy quá mạnh hoặc dừng tại mốc.
- **Combo:** một đường chém chéo xuống chỉ đủ cho một biến thể. Ánh xạ sáu role vào clip này chưa đủ tạo `rising/overhead`; phải chốt phạm vi trước khi tích hợp.

**Câu chữ đề xuất** — giữ mô tả nhân vật chung:

- **P:** “With the katana already unsheathed and held in both hands, smoothly bring it into the exact drawn-back pose of the final reference. Coil the torso slightly, keeping both feet planted. No pause at the endpoint.”
- **Q:** “Perform one decisive diagonal downward slash toward screen-right, accelerating sharply through the strike and decelerating into the exact final cut pose. Shift weight without taking a step. Keep both hands on the same rigid katana; no extra slash or rebound.”
- **R:** “Continue the existing momentum with a small follow-through, then smoothly return to the exact guard pose of the final reference. No second attack, flourish, or pause before recovery.”

Thêm vào style: “Preserve face, costume, body scale, sword length and foot placement. Hair, scarf, ribbons and tail follow the body with subtle delayed motion, continuous across segment boundaries; no independent flailing.”

**Kế hoạch 24 khung sửa:** dùng timeline khoảng **760ms**, trung bình ~32ms/khung: `0 rest → 9 back → 10 launch → 13 cut/contact (~427ms) → 16 follow-through → 23 rest`. Q chỉ chiếm khoảng 4 khoảng khung (~130ms); chọn mẫu theo tốc độ động tác, bỏ khung đầu trùng ở các đoạn nối. Role tham khảo: `[0, 9, 10, 13, 16, 23]`; đòn nối cần ánh xạ riêng và không tự quay về thủ khi còn combo.

Chỉ duyệt mô tả sau các sửa này; độ mượt thực tế phải chấm ở clip.