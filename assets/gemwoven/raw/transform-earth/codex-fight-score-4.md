**Vòng 4 chưa đạt ngưỡng 8,5.** Nori giữ nét, mặt và vũ khí rõ; điểm thiếu vẫn là phân biệt ba trạng thái bằng chính hiệu ứng.

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **8,0/10** |
| Điện thoại ngang | **7,7/10** |
| Studio 1920×911 | **8,3/10** |

- **Bùng 240–330ms:** Studio thấy cổ thụ, nhưng trên điện thoại tán nhập vào cây nền và giáp. H3 thử `--fw:1.42` từ `1.36`, `--fx:.40` từ `.32`; giữ `--fh:1.04`, `--ft:0`, `--peak:1`. H1 thử `--fw:1.26; --fx:.36`. Đây là số cho lượt kiểm tiếp.
- **Cần sửa nét `spirit.webp`:** giữ ba cụm tán và chồi phải, làm viền đất sáng `#9EAA69` thành nét lớn liên tục; điểm `#DBCD92` chỉ khoảng **10% diện tích**. Nét nhận diện chính cần dày **≥2px CSS** trên điện thoại. Hiện mảng xanh rêu quá gần nền.
- **Duy trì:** hai dải trông như lá phụ của trang phục; ngang khó đọc nhất. Sửa `side-left/right` thành **vỏ cây có mặt gãy rộng**, chồi nhỏ hơn. Giữ `--sl:.54; --sr:.56; --sideop:1` ở H3; tăng opacity không giải quyết được vì đã bằng 1.
- **Dư âm:** mầm chìm vào hào quang xanh sẵn có. Giữ rộng `.26H`, chuyển mép trái từ `x+.18H` sang **`x+.30H`**, giữ trên `t+.96H`; thêm cạnh đất sáng cho hai lá.

H1 cũng còn lỗi hòa màu này. So với chuẩn Mika đã duyệt, Nori cần đọc rõ **bùng → duy trì → dư âm khi che chữ và huy hiệu** trước khi chốt.