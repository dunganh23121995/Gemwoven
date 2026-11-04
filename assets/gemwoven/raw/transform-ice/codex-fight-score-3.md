**Vòng 3: chưa đạt đồng loạt ngưỡng 8,5.** Chấm hình ảnh từ các dải đã gửi:

| Khung nhìn | Điểm | Kết quả |
|---|---:|---|
| Điện thoại dọc, H3 | **8,3** | Chưa đạt |
| Điện thoại ngang | **8,1** | Chưa đạt |
| Studio | **8,6** | Đạt |
| Điện thoại dọc, H1 | **8,5** | Đạt |

Hai dải sương đã gọn, giữ rõ mặt và trang phục. Duy trì khác dư âm đủ rõ; màu xanh sẫm đúng kế hoạch. Studio gần chuẩn Mika. **Điểm còn thiếu nằm ở khoảnh khắc bùng H3:** đầu và tai thỏ chồng vùng trượng, tóc và tai Yuki; thu nhỏ dễ đọc thành cuộn sương hơn là linh thỏ. Ngang mất nhận diện mạnh nhất.

Sửa tập trung:

- **H3:** thử `--fx:.35 → .43`; giữ `--fh:1.04; --ft:.02; --peak:1`. Dịch ngang thêm `.08H` để mõm và tai thoát trượng. Tăng riêng `--fw` hiện không giúp phóng lớn vì ảnh đang bị giới hạn theo chiều cao bởi `contain`.
- Nếu hai tai vẫn nhập silhouette: sửa riêng **`spirit.webp`**, gom hai tai về phía phải-trên, mở khe giữa tai khoảng **6–8% chiều cao mảnh**, giảm các nét xoắn quanh má. Giữ lõi `#122C49/#285A7E`, dùng `#A7D8E5` làm cạnh nhận diện tai–mõm; tránh tăng trắng toàn thân.
- Giữ `--sl:.46; --sr:.47; --sideop:.88` của H3 và bộ H1. Sườn, ground và dư âm hiện không cần vẽ lại.

Chấm lại **240/330ms ở dọc và ngang** sau dịch spirit; đó là phần quyết định đạt.