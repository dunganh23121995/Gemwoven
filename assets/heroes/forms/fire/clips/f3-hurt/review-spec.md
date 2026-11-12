**7/10 — LÀM LẠI mô tả trước khi gen.**

- **Khung `recoil` so với `rest`:** chủ yếu đổi mắt nhắm, miệng đau; đầu, vai và thân gần như giữ nguyên. Chưa thể hiện cú giật mạnh. Với key hiện tại, nên mô tả **choáng nhẹ rồi hồi phục**, bỏ “head and shoulders snap back” vì sẽ tạo thêm cú giật trong đoạn hồi.
- **Prompt tự mâu thuẫn:** vừa yêu cầu đầu/vai chuyển động, gối chùng, vừa ghi “Motion affects only hair, cloth and tails”. Bỏ câu giới hạn này.
- **Nhịp:** nếu xuất đủ 13 khung × 40 ms thì thành **520 ms**, chưa tính rest/recoil, dài hơn ~420 ms. Cần chốt tổng sheet khoảng **10–11 khung ở 40 ms**, hoặc runtime phát trọn sheet trong 420 ms. Không giữ rest ở đầu làm chậm phản ứng trúng đòn.

Đề xuất thay phần chuyển động trong K2:

> Starting exactly from the first-frame hurt pose, she immediately begins recovering: her closed eyes open, her head and shoulders settle gently into the final guard pose. No second recoil or backward snap. Both feet stay fixed; body scale and camera remain constant. Hair, cloth and tails follow with one small damped sway, settling into the exact final reference. Keep the glaive rigid, with unchanged shape and grip; no independent weapon swing.

Giữ phần nhận diện, nền magenta và cấm hiệu ứng hiện có. **Chưa có clip nên chưa thể chỉ lỗi theo số khung chuyển động.**