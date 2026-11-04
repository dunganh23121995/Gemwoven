**Chưa đạt ngưỡng 8,5**, xét riêng hiệu ứng Biến Thân:

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **7,5/10** |
| Điện thoại ngang | **7,1/10** |
| Studio | **7,8/10** |

Noct vẫn rõ mặt, áo, lưỡi liềm; màu tiết chế, không thấy FX lấn HUD. Nhưng ba trạng thái chưa tách rõ như Mika:

- **Bùng thiếu điểm nhấn:** 240/330ms gần giống khung duy trì; chưa đọc được ấn màn bóng và nút phải-trên. Kiểm tra `.tf-spirit` thực sự hiện ở **240–380ms**, đúng lớp sau thân. `--peak` hiện **.85**, đã vượt kế hoạch **.62**; chưa nên tăng tiếp.
- **Spirit chìm vào hào quang khóa:** thử H3 `--fw:1.16; --fh:1.04; --fx:.30; --ft:0` để đưa nút ra bên phải đầu, dưới HUD ít nhất **6px**. Nếu vẫn khó đọc, **vẽ lại `spirit.webp`**: nút phải-trên rõ hơn, nếp rộng, cạnh chính `#817297`, điểm nhấn nhỏ `#B5A7C7`; nét quan trọng dày **2–3px CSS** trên điện thoại.
- **Duy trì chưa có dấu riêng rõ:** giữ `--sideop:.75` trong vòng sửa đầu; chưa hạ opacity khi dải mới còn lẫn với nền và hào quang.
- **Dư âm gần như chỉ nhận bằng huy hiệu:** vẽ lại `after.webp` thành hai nét tím xám chắc, dày **2px CSS**, giữ hộp **`.26H × .07H`**, tại **`t+.92h`**.

**F1 cũng thiếu phân biệt bùng–duy trì.** Giữ nguyên toàn bộ hào quang sẵn có; sửa riêng lớp Biến Thân rồi chụp lại ba khung nhìn.