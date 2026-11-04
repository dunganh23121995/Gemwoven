**Chưa đạt ngưỡng 8,5.** Hiro giữ đúng chất lữ khách không hệ; mặt, trang phục và kiếm rõ. Điểm yếu vẫn là phân biệt **bùng → duy trì → dư âm** khi bỏ qua chữ và huy hiệu.

| Khung | Điểm |
|---|---:|
| Điện thoại dọc | **8,1/10** |
| Điện thoại ngang | **7,7/10** |
| Studio | **8,3/10** |

- **Bùng 240–330ms chưa nổi hơn duy trì:** nút thoi và đường bao spirit chìm vào đá, sườn phải. `--peak` đã bằng `1`; cần **sửa `spirit.webp`**: nút thoi lớn **×1,35**, nét chính dày **×1,4**, giữ tâm rỗng. Dùng `#5B4932` làm thân, cạnh `#C7A16A`, chỉ chấm nhỏ `#F0D6A1`; nét quan trọng đạt **≥2px CSS trên điện thoại**.
- **Thử vị trí spirit H3:** `--fw:1.20; --fh:1.00; --fx:.22; --ft:.04`, giữ `--peak:1`. H1 thử `--fw:1.02; --fh:1.04; --fx:.12; --ft:.02`. Đây là số cho lượt kiểm tra tiếp; giữ khoảng HUD **≥6px**, đặc biệt khung ngang.
- **Duy trì đã khá:** giữ `--sl/--sr` hiện tại. H3 thử giảm `--sideop:.85 → .78` để đỉnh spirit có tương phản rõ hơn; H1 giữ `.78`.
- **Dư âm gần như mất trên nền sàn:** sửa `after.webp` thành đúng **hai gạch tách nhau**, tổng rộng `.26H`, nét cao khoảng **2px CSS**, màu `#C7A16A`, cạnh tối `#30251D`; giữ vị trí `t+.92h`. Dọn viền magenta còn sót trong mảnh.

**Ưu tiên sửa spirit và after; hai dải sườn chưa cần vẽ lại.** H1 gọn, hợp tướng khởi đầu, nhưng cũng thiếu khoảnh khắc bùng đủ rõ.