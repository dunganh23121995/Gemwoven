**CHƯA DUYỆT vòng 5.** Tiến bộ rõ, nhưng Lõi+Lõi và độ rõ của vỡ ngọc vẫn chưa đạt.

Áp dụng ý chủ dự án **06/11**: lệch **500 ms giữa các lần bắt đầu, cho phép chồng hiệu ứng**. Mã đã thể hiện lịch này; Sao+Sao/Sao+Bom cũng khởi động ngang sau dọc **500 ms**. Bỏ yêu cầu vòng 4 bắt chờ xong hẳn. Không trừ điểm vì mất khung; ảnh không xác nhận âm thanh hay hiệu năng GPU.

| Trường hợp | Vòng 4 → 5 /10 | Nhận xét |
|---|---:|---|
| Sao | **8,0 → 8,0** | Lưỡi quét rõ, có lực; tàn vẫn giống lưới chấm hơn bụi sao bung. |
| Bom | **7,5 → 8,0** | Xoáy–co đọc tốt. Đã sửa đường cong cầu lửa; ảnh bắt được vẫn thiên về vòng vàng. |
| Lõi | **7,5 → 8,0** | Nguồn–đích rõ hơn, bớt trắng hóa; đuôi nhiều màu chưa thật nổi ở cỡ điện thoại. |
| Sao+Sao | **8,0 → 8,5** | Dọc rồi ngang rõ, nhịp nối gọn; mã đúng khoảng lệch mới. |
| Sao+Bom | **8,0 → 8,5** | Bề rộng có khác biệt, quét mạnh; giữ được hướng giữa vùng xóa lớn. |
| Bom+Bom | **7,0 → 8,0** | Xoáy đủ uy lực, nhịp co tốt hơn; độ rõ mảnh vỡ còn sát sàn. |
| Lõi+Sao | **6,5 → 8,0** | Chuỗi chạy dồn tiến bộ lớn; khoảng **6 s** chấp nhận được, cuối hơi loãng. |
| Lõi+Bom | **6,0 → 8,0** | Khoảng **7 s**, giảm mạnh phần chuẩn bị lặp; từng Bom vẫn nhận ra được. |
| Lõi+Lõi | **6,5 → 7,5** | Đủ bốn đợt, nguồn đổi rõ; **10–11 s** vẫn dai, chưa đủ tăng tốc ở đợt sau. |
| Chuỗi Sao → Bom | **8,0 → 8,5** | Quan hệ chạm–kích hoạt rõ; nhịp nối giữ được lực và thứ tự. |

Còn **4 lỗi**, theo mức ưu tiên:

1. **Lõi+Lõi còn dài:** từ **14,9 xuống 10–11 s** là tốt, chưa đạt mốc **≤8 s** vòng trước. Rút phần chuyển/nạp và đuôi chặn; giữ đủ **4 đợt, 4 nguồn**.
2. **Vỡ ngọc vẫn bị giảm cấu trúc khi đông:** mã còn **4 → 2 mảnh tại ngưỡng 320**. Nâng ngưỡng chỉ dời điểm suy giảm; chưa đáp ứng yêu cầu giữ **4 mảnh/viên**.
3. **Tia kết vẫn bị bỏ khi đông:** `glints=live<160`. Đây chính là phần vòng 4 yêu cầu giữ; sửa ngưỡng mảnh chưa sửa lỗi này.
4. **Bụi sao còn quá đều:** Sao **1751–2101 ms**, Sao+Bom **2417–2684 ms** thấy mạng chấm phủ ô nhiều hơn hình sao đang bung. Cần rõ thân sao và lệch hướng hơn, không tăng thêm mật độ.

**9/10 dòng đạt ≥8. Lõi+Lõi 7,5: chưa duyệt.**
