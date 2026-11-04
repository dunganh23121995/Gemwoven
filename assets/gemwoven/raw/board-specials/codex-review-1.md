**Tổng: 6/10 — chưa đạt “đẹp hơn, lung linh hơn, xịn hơn”.** Đã đối chiếu ảnh `before-*.png`: tia Sao và vành Bom tiến bộ, nhưng chớp trắng cũ vẫn át chất liệu mới. Giữ nguyên nhịp COMBO có sẵn; không trừ điểm phần đó. Điểm dưới đây dành cho hình ảnh trong dải gửi, chưa gồm âm thanh.

| Loại | Điểm | Việc sửa cụ thể để đạt ≥8 |
|---|---:|---|
| **Sao** | **6,5** | Tia còn giống sợi laser; tâm nổ nổi hơn đường quét. Tăng **bề dày phần sáng nhìn thấy ×1,5**, đầu sao ×1,3; giữ xanh điện và lõi ngà hẹp. Thêm 4–6 hạt lớn chạy theo hai đầu, đuôi tan 120–160 ms. |
| **Bom** | **7** | Vành vàng đẹp nhất bộ, nhưng tâm trắng che mất ngọc và mảnh vỡ. Giảm sáng tâm **40–50%**, thu đường kính vùng trắng còn **0,7–0,9 ô**; giữ vành phủ 3×3, tăng sắc cam và kích thước mảnh ×1,4. |
| **Sao+Bom** | **6** | Có quy mô nhưng thành nhiều đường mảnh chồng quanh một cục trắng. Báo trước **3 hàng+3 cột** bằng dải xanh mờ 80 ms; quét ngang rồi dọc lệch 40–50 ms, chung một đỉnh sáng. Giảm lóe giữa 50%. |
| **Lõi+Sao** | **5,5** | Chưa thấy rõ khoảnh khắc “cả màu hóa Sao”; các vụ lóe giống special thường nối tiếp. Giữ dấu cầu vồng **150–180 ms**, làm mũi hướng trên các viên vừa đổi sáng rõ; cho các tia nổ cùng đợt, giảm lóe từng nguồn khoảng 60%. |
| **Lõi+Lõi** | **5** | Cao trào chưa vượt bản cũ: vẫn chủ yếu là nổ tâm và vòng mờ. Cho **hai Lõi hút vào nhau rõ ràng**, nén 150–180 ms rồi bung **một vành cầu vồng vẽ sẵn** quét toàn bàn trong 350–450 ms; giữ tâm trong, để màu và mảnh ngọc mang sức mạnh. |

**Nguyên nhân chung cần sửa trước:** `specialStarNova()` vẫn phủ chớp và 24–40 sao mỗi nguồn, kéo dài khoảng 850–1.030 ms; combo nhiều nguồn làm lớp này lấn át art mới. Giới hạn **một nova chính/đợt**, tổng ≤48 hạt; chuyển độ rực sang thân tia, vành và mặt cắt mảnh ngọc. Nhánh Lõi+Lõi hiện vẫn gọi `boardV3BombWave()` cũ, chưa dùng vành cầu vồng mới.

**Chọn gói thử a+d, bù vừa phải:**

- **Sao:** hàng/cột như đã duyệt, thêm dư chấn ở **hai đầu bàn**, mỗi đầu một ô phía mỗi bên: tối đa **12 ô thay vì 8**, cắt tại biên.
- **Bom:** 3×3 nổ **hai nhịp tại cùng tọa độ**, nhịp hai sau rơi bù. Chỉ Bom kích bằng ghép màu được nhịp hai, tối đa một lần/lượt; Bom từ combo hoặc dây chuyền giữ một nhịp. Nhịp hai không tự tăng bậc combo.
- Giữ các combo hiện tại trong vòng thử đầu để tránh khuếch đại Lõi+Sao/Bom gần toàn bàn.

Đây là thay đổi spec cần hai agent thống nhất: dư chấn mở thêm phạm vi; Bom hai nhịp tạo ngoại lệ rơi bù giữa hai nhịp.

**Ước lượng chưa đo:** tổng nộ/sát thương tăng khoảng **10–25% so với v1**; lượt hạ quái có thể từ 19,3 xuống khoảng **15–18** trong mô hình hiện tại. Chưa đủ phục hồi mức cũ, nhưng không nên lấy mức cũ làm đích tuyệt đối: sim cũ còn tính Lõi+Lõi xóa bàn nhiều lần. Bảng nộ mới cũng không mặc nhiên bù được −42%.

**Thứ tự đo:** mốc cũ → cũ đã sửa lỗi hai Lõi → v1 → v1+a → v1+a+d, cùng seed và bảng thưởng. Sau đó chạy lại với **3/2/7/2/2**, tính trần một tuyệt kỹ/lượt theo runtime. Báo trung bình/P95, lượt hạ quái trung vị/P90, tỷ lệ xóa ≥48 ô và thời gian khóa tới lần rơi bù đầu. Chỉ tăng tiếp khi vẫn chậm hơn mốc cũ đã sửa lỗi trên 15%.