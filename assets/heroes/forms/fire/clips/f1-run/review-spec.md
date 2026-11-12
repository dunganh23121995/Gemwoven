**6/10 — LÀM LẠI spec trước khi gen.** Đúng hướng nhân vật và chuyển động phụ, nhưng chưa bảo đảm nối mượt và chưa khớp runtime.

- **Khung 0–7, kiếm và hai tay:** “so it disappears from view” dễ khiến kiếm tan biến. Sửa thành: “Her right hand guides the intact katana into the scabbard at her left hip while her left hand steadies it; the blade progressively slides inside, then both hands release and begin pumping. No fading, shrinking or weapon morphing.” Cất kiếm xong mới chạy; không ép đổi tay hoặc sinh thêm bao kiếm.

- **Mối nối 7→8:** V kết thúc ở `run0`, W bắt đầu ở `stride`. Hai ảnh khác độ duỗi chân trước, góc tay sau và vị trí đuôi; cắt thẳng có nguy cơ bật dáng. Nên cho **V kết thúc ở `stride`**, dùng `run0` làm tham chiếu trung gian. Giữ vị trí hông, tỷ lệ cơ thể và mặt đất nhất quán.

- **Đoạn W:** bỏ “The camera follows her”, vì mâu thuẫn camera khóa. Thay bằng: “Locked stationary camera. She runs in place facing screen-right, with no horizontal drift, pan, zoom or turn. One complete gait cycle with two alternating footfalls; arms counter-swing naturally. She is already running at full speed at both endpoints, with no pause or deceleration.”

- **Nối 23→8, tóc/khăn/đuôi:** cùng tư thế đầu–cuối chưa bảo đảm cùng vận tốc. Bổ sung: “Braid, scarf ends, ribbons and tail continue periodic overlapping motion through the loop boundary, matching position and motion direction without settling.” Cần kiểm tra khi có clip; hiện chưa thể kết luận khung nào thực sự khựng.

- **Nhịp game đang sai:** [departVictoriousHero](D:/Project/Gemwoven/src/adventure-effects.js:60) giữ khung 0 **200 ms**, khung 1 **220 ms**, rồi chỉ lặp **2–5 ở 100 ms/khung**. Vì vậy sheet mới sẽ bỏ qua phần lớn hoạt ảnh. [mikaFoxDash](D:/Project/Gemwoven/src/forms-mika.js:448) dùng sheet `dash`, không trực tiếp dùng `run`.

**Giữ kế hoạch 24 khung được**, với điều kiện runtime phát 0–7 một lần ở 40 ms/khung (**320 ms**), rồi lặp 8–23 (**640 ms/vòng**). W lấy 16 mẫu cách đều trên chu kỳ, bỏ endpoint trùng; tại nối V→W cũng chỉ giữ một bản khung mốc chung. Cần ghi rõ FPS/thời lượng nguồn: `length:13/25` tự nó chưa xác định được nhịp sau chọn khung.