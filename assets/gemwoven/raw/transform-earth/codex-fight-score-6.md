**Vòng 6 chưa đạt ngưỡng 8,5.**

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **8,0/10** |
| Điện thoại ngang | **7,6/10** |
| Studio | **8,2/10** |

Viền mới giúp tách cạnh; mặt, trang bị và HUD vẫn rõ. Tuy nhiên, **240–330ms chưa đọc thành ấn cổ thụ ba cụm tán**: chủ yếu thấy một khối xanh tối sau vai phải. Hai dải duy trì còn chìm vào giáp, lá nền và hào quang; hình thái 1 cũng mắc lỗi này. Dư âm khó nhận ra nếu bỏ huy hiệu. Chưa đạt độ phân biệt ba trạng thái của Mika.

Cần sửa tập trung:

- **`spirit.webp`: sửa mảng sáng**, giữ lõi `#172B22`, đưa mặt tán ngoài lên `#5C8050`, cạnh chọn lọc `#9EAA69`, chồi `#DBCD92`. Ba cụm tán phải có khe tách rõ **≥3px CSS trên điện thoại**. Không tăng viền sáng toàn bộ.
- **`side-left/right.webp`: tô lại mặt vỏ hướng ra ngoài**, rộng **2–3px CSS** bằng `#9EAA69`; thân vẫn tối. Dải hiện tại quá giống phần giáp/phông.
- Thử vị trí: H1 `--sl:.45; --sr:.47`; H2 `.50/.52`; H3 `.54/.56`. Giữ `--sideop:1; --peak:1` — đã tối đa, tăng opacity không giải quyết được.
- Giữ `--fw --fh --fx --ft` hiện tại trước khi duyệt lại màu. **Không tiếp tục phóng khối cổ thụ.**
- Dư âm: đổi hộp từ `.26H × .08H` thành **`.30H × .10H`**, giữ vị trí phải gót; hai lá cần cạnh sáng `#DBCD92`.

**Ưu tiên sửa mảng màu của spirit và hai dải; riêng viền 2px chưa đủ.**