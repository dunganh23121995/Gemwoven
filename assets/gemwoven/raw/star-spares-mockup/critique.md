**Chấm đề xuất Claude: 7,5/10.** Đúng hướng, nhưng cần làm rõ “đang có” và “có thể luyện”, đồng thời giảm chi tiết ở dải kho vốn rất thấp.

Tôi chốt sửa như sau:

- **Dải kho:** năm dấu da nhỏ `1★ ×4`…`5★ ×0`, số tồn màu trung tính; bậc cần có viền vàng. Chỉ đánh mũi tên ở bậc **thực sự bị tiêu hao** theo kế hoạch. Không biến năm dấu thành năm nút bé; chạm chân dung để mở kho/luyện.
- **Ô chân dung:** huy hiệu ghi **sao bản dư cần dùng**, chẳng hạn `3★`, không phải sao đích của tướng chính. Số luôn phản ánh tồn thực: chưa có bản 3★ vẫn là **`0/1` đỏ**, dù đủ nguyên liệu luyện. Thêm búa sáng để báo có thể luyện; không giả thành `1/1`.
- **Nút chính:** `Tăng Sao` khi có sẵn bản; `Luyện & Tăng Sao` khi phải luyện. Chỉ sáng khi đủ cả bản dư lẫn tổng phí. Đủ bản để luyện nhưng thiếu tiền vẫn hiện búa, nút khóa.
- **Vàng/tinh hoa:** hiển thị tổng phí từ `starPlan`, mỗi tỷ lệ tự xanh/đỏ theo khả năng chi trả. Bỏ dòng chữ “Bản sao · Vàng · Tinh hoa”; giữ biểu tượng.
- **Popup:** dùng chuỗi chân dung **kèm số lượng**, ví dụ `1★ ×4 → 2★ ×2 → 3★ ×1`; mỗi bước có phí và nút `Luyện`. Đặt dấu búa dễ thấy trên ô chân dung để người chơi tìm được thao tác thủ công.
- **Hiro:** giữ số bản thường và phí cũ; không hiện dải kho sao hay búa luyện.

Ba trạng thái phải đọc được như sau:

| Trạng thái | Ô bản dư | Phí vàng / tinh hoa | Nút chính |
|---|---|---|---|
| **fuse** | `3★`, `0/1` đỏ + búa sáng | **125.000 / 82**, đã gồm luyện | `Luyện & Tăng Sao`, sáng |
| **short** | `5★`, `0/1` đỏ | Theo kế hoạch tổng | Khóa; popup báo **thiếu 1 bản 1★** |
| **ready** | `3★`, `1/1` xanh | **100.000 / 60** | `Tăng Sao`, sáng |

**Cần mockup vẽ trước khi code.** Điểm cần kiểm chứng là năm dấu kho trong vùng cao **35 px sân khấu**, cùng độ rõ của búa và tỷ lệ trên điện thoại. Vẽ trạng thái **fuse** trước; sau đó kiểm tra đủ ba trạng thái trên điện thoại và Studio, đạt ≥8/10. Giữ nguyên các tọa độ đã chỉ định.

Prompt tiếng Anh:

> Create a 941×1672 portrait UI mockup using the supplied Gemwoven screenshot as reference. Render only the materials panel at [200,1096,541,230] and the existing buttons below, preserving their positions. Match the painted wood, brass, leather and parchment kit. Fit five leather inventory stamps into [236,1124,469,35]: “1★ ×4”, then zero stock through 5★; gold outline on 3★. Below: Mika portrait with 3★ seal, red “0/1”, glowing forge hammer; gold “900 N/125 N” and essence “400/82” in green. Main button: “Luyện & Tăng Sao”. Preserve “Hình thái”. Crisp mobile readability, illustrated components throughout.

**Nhãn tối thiểu:** màn chính chỉ cần `1★…5★`, `×n`, `có/cần`, `Tăng Sao` / `Luyện & Tăng Sao`; giữ `Hình thái`. Popup thêm `Luyện bản dư`, `Luyện`, `Thiếu n bản 1★`. Vàng, tinh hoa và đóng popup dùng hình.