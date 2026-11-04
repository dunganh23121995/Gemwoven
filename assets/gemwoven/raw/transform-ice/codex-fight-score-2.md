**Chưa đạt ngưỡng 8,5 ở cả ba khung.** Bỏ qua các biểu tượng trên thanh máu như yêu cầu.

| Khung | Điểm |
|---|---:|
| Điện thoại dọc | **8,2/10** |
| Điện thoại ngang | **7,9/10** |
| Studio | **8,5/10** |

Thỏ linh mới đúng hướng: xanh sẫm, nhận ra dáng ngồi, không thành khối trắng; mặt và trang phục Yuki vẫn rõ. Studio đạt. So với chuẩn Mika, điểm yếu còn ở khả năng đọc khi thu nhỏ:

- **Đỉnh bùng:** tai thỏ nhập vào tai Yuki và vũ khí, nhất là H3; thân thỏ đọc rõ hơn đầu. Thử H3 `--fx:.28→.35`, H1 `.26→.32`; giữ `--fh:1.04; --ft:.02`, tăng `--peak:.95→1`. Chưa cần vẽ lại spirit.
- **Đang Biến Thân:** hai sườn cùng màu với áo và hiệu ứng băng có sẵn, khiến trạng thái yếu trên điện thoại ngang. Thử H3 `--sl:.42→.46; --sr:.43→.47; --sideop:.80→.88`; H1 `.39/.40→.42/.43`, opacity `.82→.88`. Giữ mảng chính `#285A7E`, cạnh `#A7D8E5`; tránh tăng trắng toàn mảnh.
- **Dư âm:** dấu chân quá khó nhận ra trong ảnh thu nhỏ. Thử hộp `.26H×.07H→.30H×.08H`, tâm `x+.04h`, đỉnh `t+.92h`. Nếu vẫn chìm, vẽ lại **after** với hai nét liền dày hơn, cạnh sáng tối thiểu **2px CSS trên điện thoại**, giữa vẫn trống.

**H1 dễ đọc hơn H3.** Các số trên là bước chỉnh để chụp duyệt lại; strip tĩnh chưa xác nhận được độ mượt hay âm thanh.