**7/10 — LÀM LẠI spec trước khi gen.**

- **S2–S4 chưa mô tả rõ đường vũ khí:** ảnh cho thấy k1 lưỡi đao sang trái, k2 thu sát thân, k3 vươn ngang sang phải; k4 vẫn hướng phải nhưng thu gần người. Sửa prompt theo đúng đường này; S4 nên là “hãm đà, thu đao nhẹ về thân”, tránh tiếp tục một vòng quét rộng.
- **S6:** “glaive upright” dễ khiến model dựng cán thẳng khác mốc rest, vốn đao nghiêng lên phải. Sửa thành “match the exact weapon angle and hand positions of the resting reference”.
- **Nhịp chưa khớp game:** các đoạn 13/9/9/9/13/13 chưa có quy tắc ánh xạ về mốc **0/650/1250/1350/1550/2350 ms**, rồi rest từ 2850 ms. Cần ghi rõ retime từng đoạn và giữ hit **1420 ms**; `gripKeys` riêng chưa đảm bảo FX đúng nhịp.
- **FX bám tay:** mã hiện dùng grip cố định k1, k3 trong cả khoảng hiệu ứng chạy. Khi thêm chuyển động trung gian, cần nội suy grip theo clip hoặc giữ tay tại grip đã duyệt trong khoảng đó.

**Chỗ/cỡ:** chưa thấy mốc nào lệch rõ trong ảnh; chân và tỷ lệ thân khá ổn. Giữ các mốc đã duyệt.