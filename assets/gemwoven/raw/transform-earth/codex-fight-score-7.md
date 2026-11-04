**Vòng 7: chưa đạt ngưỡng 8,5 trên cả ba khung.** Đã bỏ qua biểu tượng trên thanh máu.

| Khung | Điểm |
|---|---:|
| Điện thoại dọc | **8,2/10** |
| Điện thoại ngang | **8,0/10** |
| Studio | **8,6/10** |

Viền cứng sạch hơn; mặt, vũ khí và HUD rõ. Studio đọc được cổ thụ lúc bùng. Tuy nhiên, khi thu nhỏ, **tán spirit lẫn cây cảnh; hai dải duy trì giống phần giáp/cành của Nori**. Bùng–duy trì chưa tách rõ bằng Mika. Hình thái 1 cũng còn lỗi này.

Sửa tập trung vào màu:

- **`spirit.webp`:** tô lại mặt sáng ba cụm tán thành mảng liền `#9EAA69`, chiếm khoảng **25–30% diện tích tán**; chồi phải-trên dùng `#DBCD92`. Giữ khe tối `#172B22` giữa ba cụm.
- **`side-left/right.webp`:** mở rộng mặt sáng `#9EAA69` lên **30% diện tích mỗi dải**; thêm một nếp chính `#DBCD92` rộng **2px CSS ở điện thoại**, chạy khoảng **⅓ chiều dài**.
- Đổi riêng `.tf-earth` **`--rim:#DBCD92`**, giữ **`--edge:#172B22`** và nét cứng hiện tại.
- Giữ các số vị trí/kích thước vòng 7, **`--peak:1; --sideop:1`**.

**Cần tô lại ba mảnh trên**, ưu tiên mảng sáng có hình rõ; nâng gamma toàn ảnh thêm sẽ khó giải quyết việc lẫn nền.