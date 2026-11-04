Bố cục cũ lỗi ở vùng chơi chính: **844×390 mất toàn bộ bàn ngọc**; **932×430 tràn cột phải, cắt nút Tuyệt kỹ và HUD chen nhau**.

Bản mới đã giữ đủ bàn **8×8 ở cả bốn kích thước**. Điểm dưới đây dựa trên ảnh; số px quy về CSS, ước lượng từ ảnh ×2.

| Kích thước | Đủ bàn | Cỡ chạm | Hai cột | HUD/hiệu ứng/tên | Không cắt | Tổng |
|---|---:|---:|---:|---:|---:|---:|
| 844×390 | 10 | 8.5 | 9 | 7.5 | 9 | **8.8** |
| 932×430 | 10 | 9 | 9 | 9 | 10 | **9.4** |
| 667×375 | 10 | 8 | 8 | 6.5 | 8.5 | **8.2** |
| 740×360 | 10 | 7.5 | 9 | 8* | 10 | **8.9*** |

Ô ngọc thực tế khoảng **40 / 44 / 38 / 36px** tương ứng.  
\*Ảnh 740 không có hàng hiệu ứng/tên PvP nên chưa xác nhận được hai phần này.

Ưu tiên sửa để mọi kích thước đạt ≥8.5:

1. **667: HUD hai bên đè nhau.** Tim địch tại khoảng **(164,150)** che cuối thanh năng lượng người chơi. Dịch cả HUD người chơi và hàng hiệu ứng **lên 22–24px**; giữ khoảng hở giữa hai cụm **≥8px**.
2. **740: ô 36px hơi nhỏ để vuốt chính xác.** Giảm padding khung bàn **10→6px**, dành thêm **8px chiều cao** cho bàn bằng cách giảm thanh trên **40→36px** và tổng khe dọc **4px**. Mục tiêu ô **≈38px**.
3. **844 và 667: tên PvP dài bị rút quá nhiều.** Dành **150–160px** cho tên dài, chữ **11–12px**; ở 844 nên đưa tên lên thanh trên như 932/667 để vị trí nhất quán.

**Giữ bộ art hiện tại.** Lỗi còn lại nằm ở khoảng cách và kích thước bố cục. Ảnh này chưa đủ chứng minh dọc, Studio và iPad giữ nguyên.