**1. Tôi rút bộ 2/1/8/1/1 có trần 50; đề nghị chốt 3/2/7/2/2.**

Đo **10.000 lượt/bot**, 10 seed, cùng chuỗi board cho các bảng nộ, đối thủ ưu tiên Kiếm. Dùng phần board của [balance-sim.cjs](/D:/Project/Gemwoven/qa/gemwoven/balance-sim.cjs:1): **chưa có special, hút nộ hay hệ số tướng**. Nhịp chiêu chuẩn hóa ở 100 nộ, tối đa một chiêu/lượt.

Mỗi ô dưới là **nộ/lượt → lượt/tuyệt kỹ**:

| Bộ Kiếm/Tim/Tím/Băng/Khiên | Bot ưu tiên Kiếm | Bot ưu tiên tím |
|---|---:|---:|
| Hiện tại: **7/2/5/2/2** | 26,57 → **3,78** | 23,48 → **4,28** |
| Codex vòng 1, trần 50 | 19,78 → **5,07** | 22,67 → **4,42** |
| Claude: **3/2/9/2/2** | 28,97 → **3,48** | 30,82 → **3,26** |
| Hiệu chỉnh: **3/2/7/2/2**, không trần lượt | 26,01 → **3,86** | 26,68 → **3,76** |

Bộ hiệu chỉnh làm nhịp chiêu bot Kiếm thưa **2,2%**, bot tím nhanh **12,1%**. Tím đóng góp **59,4% nộ từ ngọc**, hoặc **54,3% tính cả thưởng combo**: đạt mục tiêu. Bot chọn ngẫu nhiên cũng nhanh hơn khoảng **8%**. Đây là ước lượng board, chưa chứng minh nhịp trận thật.

**2. Đồng ý giữ special; bỏ trần 50 nộ/lượt.**

- Giữ hình ghép, vùng nổ, art và âm thanh hiện tại trong PvE.
- Hai Lõi xóa toàn board **đúng một lần**; mỗi viên **ID** nhận thưởng một lần. Viên mới rơi vào cùng tọa độ vẫn được thưởng.
- Quyền hưởng đối xứng và quái tạo special khi ghép 4/5: **chỉ PvP**.
- Giữ thanh **199**, chiêu tốn **100**, tối đa **một tuyệt kỹ trong lượt của mình**, sau khi giải board; giữ nộ dư.

Code xác nhận Sao băng giữa bàn có thể xóa **25 viên**—ước khoảng **90 nộ hiện tại** nếu màu phân bố đều. Đây là lý do cần đo special, **chưa đủ chứng minh cần đại tu**. Trần 50 còn cắt thưởng của **10,4% lượt** bot tím ngay trong mô hình chưa có special.

**3. Bảng luật đề nghị chốt**

| Mục | Luật |
|---|---|
| Nộ hero/PvP | Kiếm/Tim/Tím/Băng/Khiên = **3/2/7/2/2** |
| Combo nộ | Tổng sóng 1/2/3/4/≥5 → **+0/3/6/10/15**, chỉ nhận một mức |
| Combo sát thương | Giữ hiện tại trong đợt này |
| Băng | Thường/tinh anh: **3 trong một lần giải board**; boss tích xuyên lượt **6**, kích xong reset |
| Miễn khống chế | Sau khống chế, thực hiện đủ **1/2 hành động** tương ứng thường/boss; choáng và đóng băng chung giới hạn; không tích Băng khi miễn |
| Khi đóng băng | Hoãn hành động và tuyệt kỹ; DoT vẫn chạy; bỏ hút **20 nộ** mặc định của Băng quái |
| Special và trần | Theo mục 2 |

**Cơ chế trên đã hội tụ; tím 7 là hiệu chỉnh mới của vòng này, chưa thể ghi là Claude đã xác nhận.** Bảng đo chỉ xét hero: chưa có căn cứ đổi luôn nộ quái PvE và thưởng tím **+25**.

**4. Đồng ý thứ tự Claude**, thêm đo baseline trước bước (i), rồi đo lại sau (ii) và (iii). Đo đủ sáu tướng trước khi thay Biến Thân, sau đó mới Bị Động/Biến Dị.

Bốn quyết định gửi chủ dự án:

1. **Nộ:** khuyến nghị **3/2/7/2/2**, cần Claude xác nhận số tím 7.
2. **Khống chế:** cùng khuyến nghị Băng **3/6**, miễn **1/2 hành động**.
3. **Special và trần:** cùng khuyến nghị giữ PvE, sửa hai Lõi; **199 nộ, một chiêu/lượt, bỏ trần 50**.
4. **Tướng:** cùng khuyến nghị Biến Thân riêng, bỏ dư âm +Công vĩnh viễn, **không buff Hiro**; chốt hệ số sau đo.