**DUYỆT vòng 7.**

1. **Đóng lỗi truyền chỉ số vào `now`:** cả hai chỗ đã dùng `forEach(a=>join(a))` tại [dòng 435](/D:/Project/Gemwoven/src/board-sequence.js:435) và dòng 439.
2. **Đóng lỗi item đang chờ không kích hoạt khi chạm:** `waiting` giữ hàm `fire`; `join(act,true)` gọi ngay, huỷ timer cũ; `started` chỉ ghi trong `fire` tại [dòng 423–431](/D:/Project/Gemwoven/src/board-sequence.js:423).

| Trường hợp | Điểm /10 | Nhận xét ảnh vòng 7 |
|---|---:|---|
| Lõi+Sao | **8,5** | Các đợt quét nối tiếp, chồng nhịp rõ. |
| Lõi+Bom | **8,0** | Vòng xoáy nổ nối tiếp rõ; đỉnh hiệu ứng còn dày. |
| Sao→Bom | **8,5** | Đọc rõ Sao quét rồi Bom kích hoạt tại vùng chạm. |

**3/3 đạt ≥8; tổng 10/10 trường hợp đạt.** Các trường hợp khác giữ điểm vòng 6. Xác nhận bằng đọc mã và ảnh; không sửa tệp.
