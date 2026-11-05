**CHƯA DUYỆT vòng 6.** Hình đã khá hơn; điều phối vẫn có lỗi trái yêu cầu mới.

Đo từ **COMBO đầu → bàn nạp đầy cuối chuỗi**, chưa tính bụi tàn. Mốc ảnh thưa nên thời lượng là xấp xỉ.

| Trường hợp | Mốc ảnh (ms) | Thời lượng | Điểm /10 |
|---|---:|---:|---:|
| Lõi+Lõi | 1134→8336 | **7,20 s** | **8,0** |
| Lõi+Sao | 1134→3684 | **2,55 s** | **7,5** |
| Lõi+Bom | 1134→4035 | **2,90 s** | **7,5** |
| Sao+Sao | 1084→2451 | **1,37 s** | **8,5** |
| Sao+Bom | 1100→2634 | **1,53 s** | **8,5** |
| Sao→Bom | 1084→2517 | **1,43 s** | **8,5** |

Lõi+Lõi xuống dưới 8 s, nguồn đổi vị trí, lực kéo còn rõ: **qua nút thắt vòng 5**. Sao+Sao/Sao+Bom giữ được dọc→ngang khi chồng hiệu ứng. Mã đã giữ **4 mảnh/viên, 2 tia/sao**.

Còn **3 lỗi**:

1. **Bỏ nhịp 200 ms ngoài ý muốn.** Trong [board-sequence.js](D:/Project/Gemwoven/src/board-sequence.js:423), `forEach(join)` truyền chỉ số vào tham số `now`. Từ phần tử thứ **2**, `now` thành đúng: item chưa bị chạm cũng chạy ngay. Lõi+Sao/Lõi+Bom chưa được duyệt quy tắc mới.
2. **Item đã đặt lịch chưa chắc được kích hoạt ngay khi chạm.** `started.add(act)` chạy ngay lúc đặt lịch; sau đó `join(act,true)` bị chặn bởi `started.has(act)`. Có thể vẫn phải chờ lịch cũ. Yêu cầu **chạm là kích hoạt** chưa kín.
3. **Bụi vẫn thành thảm chấm:** rõ ở Lõi+Lõi **2834–3418 ms**, Sao+Bom **2084–2367 ms**. Lệch hướng đã đỡ đều, nhưng thân sao ở kích thước này còn yếu. **8/10**, chưa đẹp xuất sắc.

Sao, Bom, Lõi và Bom+Bom giữ **8,0** vòng 5. **8/10 trường hợp đạt; Lõi+Sao và Lõi+Bom bị giữ bởi lỗi điều phối.** Không trừ điểm vì ảnh mất khung; số GPU **56/83 ms** là số bạn cung cấp, tôi chưa tự xác nhận.
