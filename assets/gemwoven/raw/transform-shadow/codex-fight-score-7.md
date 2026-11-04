**Chưa đạt 8,5.** Chấm phần Biến Thân trong ảnh gửi:

| Khung | Điểm |
|---|---:|
| Điện thoại dọc | **7,8** |
| Điện thoại ngang | **7,3** |
| Studio | **8,0** |

Noct vẫn rõ mặt, áo và lưỡi liềm; màu tím xám đúng hướng, không lấn hào quang khóa. Nhưng **240/330ms chưa có màn bóng bùng đủ khác trạng thái duy trì**. Hai dải còn giống bóng mờ; dư âm khó nhận trên điện thoại. Hình thái 1 cũng gặp lỗi này.

**Cần đồng bộ bản dựng trước khi chỉnh tiếp:** `Game.html` hiện vẫn chứa thông số H3 cũ `--sl:.42; --fw:1.40; --fh:1; --fx:.42; --ft:.02`, khác source vòng 7 `.46 / 1.44 / .92 / .38 / .10`. Chạy `python build.py`, tải lại sạch rồi chụp lại.

Nếu bản đồng bộ vẫn như ảnh:

- Giữ sáu biến vị trí/kích thước vòng 7; tăng `--peak:.85→.95`, `--sideop:.76→.84`.
- Nâng **mặt gấp chọn lọc** `#514367→#66557D`, giữ vùng tối `#151924`; chưa tăng viền sáng.
- Dư âm cần hai nét tím xám đọc được ở **2px CSS** trên điện thoại.

**Chưa cần vẽ lại mảnh; chưa nghiệm thu vòng 7 từ bộ ảnh này.**