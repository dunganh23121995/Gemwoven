**CHƯA DUYỆT vòng 4.** Sao và hai tổ hợp quét đạt; các tổ hợp Lõi quá dài, hiệu ứng vỡ còn bị cắt mất khi đông hạt.

Chấm theo ảnh, đối chiếu hai checklist và mã hiện tại. Yêu cầu mới của chủ dự án được ưu tiên: **xoáy tròn, kích hoạt tuần tự, chờ Sao 500 ms**. Không trừ điểm vì mất khung; ảnh không xác nhận được âm thanh hay số đo hiệu năng.

| Trường hợp | Điểm /10 | Nhận xét |
|---|---:|---|
| Sao | **8,0** | Lưỡi quét rõ, ba làn đọc được; có tàn sáng nhưng bụi sao còn nhỏ. |
| Bom | **7,5** | Tròn và co rõ; đỉnh BÙM trong các khung bắt được vẫn thiên về vòng rỗng. |
| Lõi | **7,5** | Có nguồn–đích và hút tuần tự; chuỗi sao còn thành cụm sáng trắng. |
| Sao + Sao | **8,0** | Dọc trước, ngang sau rõ; khoảng nghỉ phân tách được hai nhịp. |
| Sao + Bom | **8,0** | Bề rộng khác Sao+Sao rõ, không còn xoáy chạy trước; hơi lê phần cuối. |
| Bom + Bom | **7,0** | Quy mô mạnh; xoáy che ngọc nhiều, pha nổ chưa tương xứng pha chuẩn bị. |
| Lõi + Sao | **6,5** | Đọc được hóa Sao rồi quét từng cái; chờ quá lâu trên bàn gần trống. |
| Lõi + Bom | **6,0** | Hóa Bom rõ; lặp nguyên bài xoáy–co–nổ khiến tổ hợp mất lực. |
| Lõi + Lõi | **6,5** | Bốn đợt đọc được; đợt sau chưa tăng tốc đủ để giữ hứng thú. |
| Sao → Bom | **8,0** | Quan hệ chạm–kích nổ rõ, thứ tự dễ theo dõi. |

**Nhận xét chung:** hình đã có bản sắc, nhưng chưa đạt đồng đều; điểm yếu chính là **vỡ ngọc bị giản lược và nhịp Lõi kéo dài**.

Các lỗi, xếp theo mức nghiêm trọng; mọi sửa dưới đây dùng code hoặc mảnh hiện có. Gọi **S** là cạnh ô.

1. **Nặng — mất cấu trúc vỡ khi đông hạt.** Bom+Bom **2017–2568 ms**, Lõi+Lõi **2067–3284 ms**: chủ yếu còn chấm sáng, khó đọc bốn mảnh. Mã xác nhận giảm **4 → 2 → 0 mảnh**, đồng thời bỏ tia tách cuối. Giữ **4 mảnh/viên** bằng một nhóm dùng chung animation; giảm glow/hạt phụ trước. Giữ ít nhất **2 sao + 2 tia kết/viên**, sống **2200–3000 ms**.

2. **Nặng — Lõi+Sao/Bom lặp quá nhiều phần chuẩn bị.** Lõi+Sao **4135–9303 ms**, Lõi+Bom **3101–9536 ms**. Sau lần đầu, rút tích Sao xuống **40–60 ms**, quét **220–280 ms**; Bom tích **40 ms**, xoáy **200–240 ms**, co rõ ít nhất **100 ms**. Giữ nguyên tuần tự và khoảng chờ Sao **500 ms**.

3. **Nặng — bốn đợt Lõi+Lõi gần cùng trọng lượng.** **1417–3284**, **5135–6369**, **8236–9486**, **11337–12571 ms**: lặp hút–trống–nạp làm cảm giác chậm hơn cảm giác mạnh. Giữ đủ **4 đợt, 4 nguồn**; giới hạn đợt đầu **2200 ms**, mỗi đợt sau **1500 ms**, phần nạp/chuyển đợt **≤250 ms**.

4. **Vừa — BÙM thiếu khối đặc trong các khung thấy được.** Bom **1651–1817 ms**, Bom+Bom **1784–1951 ms**: vòng vàng nổi hơn thân lửa. Tăng thân `fireball` lên đỉnh opacity **1 trong 80–100 ms**; giảm vòng `blast` từ **0,9 xuống 0,55**, trễ **50 ms**. Chớp trắng vẫn **≤50 ms**. Không kết luận mất nổ ở quãng không có khung.

5. **Vừa — chuỗi sao Lõi bị trắng hóa.** Lõi **1267–2067 ms**, Lõi+Lõi **1417–2684 ms**: thấy đầu sáng nhiều hơn thấy chuỗi cong nhiều màu. Giảm đầu sao xuống **0,45–0,55S**, glow **−35%**, bỏ `drop-shadow` trắng; dùng **5–7 sao đuôi**, lệch nhau **20–25 ms**, phân ba màu rõ trên mỗi chuỗi.

6. **Vừa — bụi sao thành lưới chấm đều.** Sao **1751–2167 ms**, Sao+Bom **2534–2818 ms**: nhiều màu có, nhưng hình cánh sao yếu. Bảo đảm thân sao nhìn thấy rộng **0,12–0,18S**; lệch góc bung **±25°**, bán kính **0,35–0,7S**. Giữ tuổi thọ, cho tàn chạy cùng bàn đã nạp.

Nhịp tổng — các số dưới là **độ dài dải ảnh**, gồm cả cascade; không phải số đo khóa thao tác:

| Trường hợp | Dải ảnh | Đánh giá / trần đề xuất đến khi thao tác lại |
|---|---:|---|
| Sao / Bom / Lõi | **2,08 / 2,37 / 2,83 s** | Chấp nhận; trần **2,2 / 2,5 / 3,0 s** |
| Sao+Sao / Sao+Bom | **3,07 / 3,45 s** | Chấp nhận sát trần **3,2 / 3,5 s** |
| Bom+Bom / dây chuyền | **2,60 / 3,47 s** | Chấp nhận; trần **2,8 / 3,5 s** |
| Lõi+Sao | **8,87 s**, chưa thấy nạp lại ở cuối | **QUÁ DÀI**; mục tiêu **7–8 s** cho bàn này |
| Lõi+Bom | **11,04 s** | **QUÁ DÀI**; mục tiêu **6–7 s** |
| Lõi+Lõi, 4 đợt | **14,87 s** | **QUÁ DÀI**; mục tiêu **≤8 s** |

Trần chỉ tính phần chặn thao tác; **bụi sao 2,2–3 giây được tiếp tục bay sau khi bàn hoạt động lại**. Không rút bằng cách bỏ đợt, chạy song song hoặc cắt khoảng chờ 500 ms đã được chủ dự án chốt.
