**7/10 — LÀM LẠI mô tả trước khi gen.** Đúng ý chạy tại chỗ, giữ vũ khí và khóa camera, nhưng còn ba điểm:

- **Prompt tự mâu thuẫn:** “Motion affects only hair, cloth and tails” có thể khiến Wan giữ chân, tay và thân đứng yên. Đổi thành: **“Her legs alternate in a clear running gait, her free arm pumps and her torso bobs subtly. Secondary motion affects hair, cloth and tails. No flames, aura or particles.”**
- **Khung 8 → 9 và 24 → 9:** kế hoạch 8 khung vào chạy + 16 khung lặp hợp lý, nhưng chưa có mốc xác định pha chân. Cần chỉ rõ khung 9 bắt đầu chu kỳ; khung 24 nối về 9 liên tục về chân, thân và vị trí cán đao. `keys: {}` chưa đủ để kiểm soát bằng first/last frame; đừng ép cuối đoạn chạy trở về tư thế nghỉ.
- **Lưỡi đao và chín đuôi:** “blade up behind her” dễ che mặt hoặc vượt mép trên. Sửa: **“Keep the rigid glaive diagonally behind her right shoulder, its entire crescent blade inside the frame and clear of her face. Preserve nine distinct tails with restrained overlapping motion.”**

**Nhịp game:** 55 ms/khung → đoạn vào chạy **0,44 giây**, vòng chạy **0,88 giây**: phù hợp chạy đều. Cần ghi rõ 49 khung nguồn sẽ được chọn thành 24 khung xuất; dùng khung gần cuối còn sắc nét và đúng pha, không mặc định chọn khung cuối.

Chưa có clip nên chưa thể chỉ lỗi thực tế theo số khung. Sửa các câu và mốc trên rồi duyệt lại.