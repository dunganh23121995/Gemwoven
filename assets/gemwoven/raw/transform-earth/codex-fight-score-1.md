**Chưa đạt ngưỡng 8,5.** Nori vẫn rõ mặt, búa và khiên; nhưng ba trạng thái chưa tách rõ như Mika đã duyệt.

| Khung nhìn | Điểm | Lỗi chính |
|---|---:|---|
| Điện thoại dọc | **7,5/10** | Đỉnh 240–330ms chìm vào cây nền và giáp xanh. Hình thái 1 cũng khó nhận ra khoảnh khắc bùng. |
| Điện thoại ngang | **7,0/10** | Tán cổ thụ và hai dải thu thành nét nhỏ; mất nhận diện khi bỏ qua chữ, huy hiệu. |
| Studio | **8,0/10** | Mảnh đủ nét, nhưng dải bên giống dây leo phụ kiện; cổ thụ chưa thành điểm nhấn riêng. |

**Sửa lượt tiếp theo:**

- **Vẽ lại `spirit.webp`:** giữ ba cụm tán nhưng gộp lá thành mảng lớn, giảm khoảng **50% chi tiết lá**; nhấn hai thân tách đôi và chồi phải-trên. Hiện tán quá giống cây phông nền. Giữ lõi `#172B22`, thân `#31513A`, cạnh `#9EAA69`; `#DBCD92` chỉ chiếm **≤10%**.
- **Hai `side-*.webp`:** tăng cảm giác **phiến vỏ cây**, giảm dáng lá/dây leo. Nét nhận diện chính phải còn **≥2px CSS trên điện thoại ngang**; chỉ tăng opacity không giải quyết được hòa màu.
- Thử bộ CSS sau để hình thái 1 gọn hơn và chồi bùng bớt lệch xa thân:

| Hình thái | `--sl` | `--sr` | `--fw` | `--fh` | `--fx` | `--ft` | `--peak` | `--sideop` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | .48 | .49 | 1.20 | 1.06 | .16 | 0 | 1 | 1 |
| 3 | .56 | .58 | 1.36 | 1.10 | .18 | -.02 | 1 | 1 |

- **Dư âm:** mầm hiện quá khó thấy. Thử hộp **`.30H × .08H`**, tại **`t+.90h`**, sau gót; giữ hai lá đơn giản. Kiểm tra đỉnh FX luôn cách HUD **≥6px CSS**.

Đây là điểm phần hình từ strip; chưa xác nhận âm thanh và độ mượt chuyển động.