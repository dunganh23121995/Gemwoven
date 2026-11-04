**Chưa đạt ngưỡng 8,5.** Viền giúp tách nền, nhưng khoảnh khắc bùng vẫn chưa khác trạng thái duy trì đủ rõ như Mika.

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **8,1/10** — H1: **8,2** |
| Điện thoại ngang | **7,8/10** |
| Studio | **8,3/10** |

Tướng, mặt và lưỡi liềm vẫn rõ; màu tím xám hợp Noct. Dải phải đọc được tốt nhất. Điểm còn thiếu:

- **Spirit ở 240/330ms chìm vào vùng lưỡi liềm và hào quang**, nút thắt phải-trên chưa thành điểm nhấn riêng. H3 thử `--fx:.26→.38`, `--ft:.06→.10`; giữ `--fw:1.44`, `--fh:.92`, `--peak:.85`. Không tăng opacity toàn bộ.
- **Dải trái nhập áo choàng**, nhất là trên điện thoại ngang. Thử H1/H2/H3: `--sl:.44/.45/.46`; giữ `--sr:.38/.39/.40`, `--sideop:.76`. Chỉ sáng các cạnh ngoài bằng `#B5A7C7`, giữ ruột tối.
- **Viền hiện tại là quầng mềm:** `drop-shadow(0 0 2px …)` chưa tạo viền cứng 2px. Đổi riêng Noct sang cạnh sáng cứng **1px `#B5A7C7`**, ngoài tối **1px `#151924`**; tránh quầng trắng quanh toàn mảnh.
- **Dư âm quá khó nhận trên điện thoại.** Giữ hộp `.30H × .08H`, dịch tâm từ `x+.28H` sang `x+.34H`; tăng sáng một cạnh của dấu khuyết.

**Chưa cần vẽ lại cả bộ.** Nếu dịch spirit vẫn không lộ nút thắt, vẽ lại riêng `spirit.webp`: nút phải-trên lớn hơn **25%**, giảm chi tiết vụn. Giữ nguyên hào quang đã khóa.