**Vòng 3: gần đạt; chưa duyệt toàn bộ theo ngưỡng ≥8,5.**

| Màn hình | Điểm | Kết luận |
|---|---:|---|
| Điện thoại dọc | **8,4/10** | Sát chuẩn Mika |
| Điện thoại ngang | **8,1/10** | Tinh ấn khó đọc |
| Studio | **8,6/10** | Đạt |

Nét sạch, tím–vàng hợp Lumi; mặt và trang phục rõ. Hai dải duy trì đã phân biệt được với dư âm, không lấn HUD. **Hình thái 1 thoáng hơn hình thái 3.**

Điểm còn thiếu nằm ở **`spirit` tại 240–330ms**: thân che phần lớn lõi rỗng và các mũi còn lại, nên phần lộ bên phải đọc thành **một lưỡi tím chéo**, chưa rõ tinh ấn điện bốn mũi. Trên ngang, bùng và duy trì vì vậy còn gần nhau.

Sửa tập trung:

- **H3:** thử `--fx:.34 → .40`, `--ft:0 → .02`; giữ `--fw:1.38`, `--fh:1.08`, `--peak:1` để lộ tinh ấn thêm bên phải.
- **Vẽ lại riêng `spirit`** nếu lõi vẫn bị khuất: rút mũi phải-trên **15%**, tăng bề dày hai mũi ngắn **25%**, làm rõ hai nhánh điện phía dưới. Nét chính khi thu xuống ngang cần **≥2px CSS**.
- Dùng `#8A55BD` cho mặt nét chính, `#4B2D78` làm bóng; vàng chỉ ở đầu mũi. **Giữ hai dải hiện tại**, `--sl:.49`, `--sr:.50`, `--sideop:.9`.

Chấm này dành cho hình ảnh; ảnh tĩnh chưa xác nhận được chuyển động và âm thanh.