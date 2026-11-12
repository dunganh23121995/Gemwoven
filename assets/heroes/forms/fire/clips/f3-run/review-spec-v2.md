**R: 8,3/10 — DUYỆT dáng. Spec-v2: 7/10 — LÀM LẠI cấu hình/prompt trước khi chạy clip; giữ tranh R.**

1. **Khung R — nhận diện và tỷ lệ:** mặt, mắt, tóc tết, hoa cài, giáp đỏ–trắng–vàng và đao nguyệt vẫn đúng Mika dạng 3. Cỡ đầu nhìn tương xứng khung nghỉ sau hệ số 0,91; chưa thấy phóng đầu rõ. Đuôi chồng lấp nhiều, **chưa xác nhận đủ chín đuôi riêng biệt**; khi duyệt clip phải kiểm tra gốc và thứ tự đuôi, tránh mọc/mất đuôi.

2. **Khung R — dáng chạy:** thân nghiêng, tay trước co, chân mở và đao kéo sau tạo lực tốt hơn dáng đứng thẳng. Hợp tinh thần dạng 2 qua ảnh `pose-ref-f2run30.png` trong repo. Không cần vẽ lại R.

3. **A, khung 0–16 — nguy cơ trôi/khựng:** “breaks into a fast run toward screen-right” còn dễ bị hiểu thành chạy ngang màn hình. Đổi thành **“accelerates into an in-place run facing screen-right; pelvis/root remains horizontally anchored”**. Thêm: chuyển động liên tục tới R, không giảm tốc hoặc giữ dáng ở cuối A; A16 nối L0 đúng pha và hướng chuyển động.

4. **L, khung 0–16 — nhịp và đuôi:** “two full running strides” mơ hồ. Nếu muốn một chu kỳ 16 khung × 55 ms = **880 ms**, ghi rõ **“one complete gait cycle: two alternating steps, one per leg”**. Thay “tails never rotate” bằng: gốc đuôi cố định, giữ thứ tự, không xoay cả quạt đuôi; từng đuôi vẫn uốn và trễ tự nhiên. “Steady” của đao nên là giữ hình dạng cứng, chuyển động theo tay/thân, tránh đóng băng vũ khí.

5. **R, mép trái lưỡi đao:** lề khoảng **4%** quá mỏng cho dao động và đường hạ đao trong A. Tăng canvas chung cho cả rest/R để có lề trái khoảng **8–10%**, giữ cỡ đầu và cập nhật đồng bộ scale/footY. Không chỉ đẩy R sang phải vì sẽ tăng dịch chuyển thân giữa hai mốc.

6. **Ghép vòng:** `loop:[22,35]` và `introTimes` 21 phần tử là dữ liệu cũ, chưa khớp A/L mới. Ví dụ đánh số từ 0: ghép **A0–15 + L0–15**, bỏ A16 trùng L0 và L16 trùng L0 → **32 khung, loop:[16,31]**. Chốt lại thời gian đoạn vào theo clip thực tế.

**Chưa có clip A/L mới nên chưa thể kết luận khung nào thực sự giật, trôi hay xoay đuôi.** Các mục trên là lỗi cấu hình và rủi ro cần sửa trước khi gen.