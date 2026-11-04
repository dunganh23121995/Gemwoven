**Vòng 5 chưa đạt ngưỡng 8,5.** Chấm hình ảnh trong trận, bỏ qua các biểu tượng trên thanh máu:

| Khung hình | Điểm |
|---|---:|
| Điện thoại dọc | **8,2/10** |
| Điện thoại ngang | **8,0/10** |
| Studio | **8,4/10** |

Đúng hướng Hiro không hệ: gam đất tiết chế, mặt và trang phục rõ, hai dải bất đối xứng. Hình thái 1 cũng hợp tướng khởi đầu.

Còn ba điểm cần sửa:

- **Đỉnh bùng 240–330ms chưa tách rõ khỏi duy trì.** Spirit chìm vào thân cây và dải phải; nút thoi chưa thành điểm nhận diện khi thu nhỏ. Sửa `spirit.webp`: phần nâu tối giữ `#30251D/#5B4932`, cạnh chính dùng `#C7A16A`, dày khoảng **.02–.025H**; nút thoi khoảng **.07H**, lõi nhỏ `#F0D6A1`. Giảm bề rộng mảng tối bên phải **15%**, giữ khoảng rỗng. `--peak` đã **1**, cần sửa mảnh vẽ.
- **Duy trì hơi giống hai lá nâu**, nhất là ngang; cạnh sáng chưa liên tục. Thử `--sideop: .78 → .86`; nếu vẫn chìm, làm rõ một cạnh ngoài bằng `#C7A16A`, tránh phủ vàng cả mảng.
- **Dư âm quá khó nhận ra ở điện thoại.** Giữ hộp **.26H × .07H**, nhưng hai gạch phải lộ ngoài gót, nét sáng tối thiểu **2px CSS** ở dọc; dùng `#C7A16A` với ít `#F0D6A1`.

**Giữ nguyên `--sl --sr --fw --fh --fx --ft` vòng này.** Ưu tiên sửa tương phản và phân biệt ba trạng thái, chưa cần tăng kích thước toàn bộ FX.