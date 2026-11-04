**Vòng 5 chưa đạt ngưỡng 8,5.** Bỏ qua các biểu tượng nhỏ trên thanh máu:

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **8,0/10** |
| Điện thoại ngang | **7,7/10** |
| Studio | **8,3/10** |

Tướng vẫn sắc, mặt và vũ khí rõ, HUD thoáng. Nhưng so với chuẩn Mika, ba trạng thái chưa tách đủ mạnh:

- **Bùng 240–330ms:** cổ thụ đọc thành cây cảnh phía sau; ba cụm tán và chồi phải chìm vào nền rừng. Sửa **`spirit.webp`**: giữ lõi `#172B22`, tăng các mảng vỏ `#9EAA69`, thêm cạnh chọn lọc `#DBCD92`, nét chính đạt **2px CSS trên điện thoại**. Giữ `--peak:1`; tăng opacity không còn giúp.
- **Duy trì:** hai dải quá giống lá nền, hình thái 3 khó phân biệt với dư âm nếu che huy hiệu. Thử H3 **`--sl:.50; --sr:.52`** thay `.54/.56`; H1 **`.41/.43`** thay `.44/.46`. Giữ `--sideop:1`. Vẽ lại cạnh ngoài **`side-left/right.webp`** thành vài phiến vỏ lớn, sáng tối rõ hơn; tránh thêm gân nhỏ.
- **Dư âm:** mầm quá nhỏ và lệch phải, dễ đọc thành cây cỏ sân. Đổi vị trí `.tf-earth .tf-mark` từ **`x+.30H → x+.15H`**, **`t+.96H → t+.93H`**; giữ rộng `.26H`, thêm một cạnh màu `#DBCD92`.

**Giữ `--fw --fh --fx --ft` hiện tại cho lượt thử tiếp.** Điểm nghẽn chính là tương phản và khả năng nhận diện mảnh vẽ khi thu nhỏ, đặc biệt ở màn ngang.