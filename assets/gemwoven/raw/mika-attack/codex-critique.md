**Chốt: cần nối tư thế và giữ Mika ở phía trước giữa các đòn; chỉ tăng tốc toàn bộ sẽ vẫn giật.** Đây là review read-only, chưa sửa file.

1. **Hiện tại — chưa đạt**
   - **Hình thái 1: 5/10.** Đọc được động tác chém, nhưng cứ lao tới → về gốc → lấy đà lại, khiến chuỗi thành ba đòn rời.
   - **Hình thái 2: 5/10.** Vết chém rõ hơn; thân và kiếm vẫn reset giữa đòn, thiếu chuyển động nối.
   - **Hình thái 3: 4/10.** Vũ khí dài nhưng các nhát gần cùng hướng; quầng cam che thân khoảng **150 ms**, làm mất khả năng đọc tay và cán đao.
   - Chuỗi khoảng **3.300 ms**, có khoảng đứng chờ ước lượng **200–300 ms** giữa nhịp; lực đánh bị ngắt.
   - Popup lặp làm nhiễu. Tuy nhiên, code hiện chỉ gọi tên chiêu khi `chain===1`; cần kiểm tra `job.chain` thực tế. `combatV3Charge()` thường chỉ tạo vòng dưới chân, nên **chưa đủ bằng chứng quy toàn bộ mảng cam che thân cho hàm này**.

2. **Spec đề nghị — dùng chung cả ba hình thái**

   Mọi thời gian dưới đây là **ms thực trên màn hình, sau scale .45**; khoảng cách tính ở viewport **430×932**.

   | Thành phần | Chốt |
   |---|---|
   | Điều kiện nối | Ngay trước pha hồi, xem **phần tử đầu hàng đợi**: phải là đánh thường cùng phía. Không tìm vượt qua buff, tuyệt kỹ hoặc đòn phía khác; giữ FIFO. |
   | Đòn đầu | Lấy đà **100 ms** → lao tới **120 ms** → vung tới chạm **80 ms**. Chạm lần đầu ở **300 ms**. |
   | Mỗi đòn nối | Khoảng cách giữa hai lần chạm **360 ms**: ghìm va chạm **35** → theo đà **105** → chuyển thế **140** → vung tới chạm **80**. Không đứng idle. |
   | Nối tư thế | Đòn sau bắt đầu đúng tư thế kết đòn trước; thân chỉ dịch **2–6 px**, không lùi lấy đà từ gốc. |
   | Hướng chém | **Chéo xuống → hất lên → ngang**, lặp lại. Tay, vũ khí và vệt chém cùng hướng; cần pose phù hợp, không chỉ xoay hiệu ứng. |
   | Vị trí phía trước | Giữ chân quanh điểm áp sát, dao động tối đa **6 px**. Thân không xuyên địch; hình thái 3 giữ khoảng thân **≥12 px**, đầu đao vẫn chạm đúng mục tiêu. |
   | Địch giật | Lùi **6 px trong 45 ms**, trở về trong **100 ms**; không cộng dồn vị trí. Phản ứng bắt đầu tại va chạm. |
   | Kết chuỗi | Sau chạm cuối: theo đà **140 ms** → về gốc **180 ms** → ổn định **60 ms**. Chỉ một lần quay về. |
   | Quầng tích lực | Chỉ đòn đầu, dài **100 ms**, opacity tổng hợp tối đa **0,25**; vùng hiệu ứng chồng lên tối đa **20% diện tích thân**, tránh mặt và tay cầm vũ khí. |
   | Tên chiêu | Hiện **một lần/chuỗi**, tối đa **600 ms**; popup combo không được thay bằng tên chiêu lặp. |
   | Máu, âm thanh | Trừ máu đúng lúc lưỡi vũ khí chạm; âm va chạm đồng thời. Mỗi job giữ nguyên sát thương, hệ số và số lần áp dụng. |

   Với ba đòn đã có sẵn: chạm tại **300 / 660 / 1.020 ms**, về trạng thái nghỉ khoảng **1.400 ms**. Nếu hàng đợi không còn đòn hợp lệ khi bắt đầu quay về, đóng chuỗi; đòn đến sau mở chuỗi mới.

   Lưu ý triển khai: hiện mỗi `attack()` đều trả về gốc và đặt `idle` trong `finally`. Cần giữ trạng thái xuyên các job; **không gộp ba job thành một đòn nhiều hit**, vì có thể đổi hệ số và thứ tự xử lý.

3. **Checklist cứng — chỉ đạt khi tất cả đều đạt**

   Chấm riêng từng hình thái bằng video **60 fps**, ba đòn đã xếp hàng; ảnh cách 100 ms chưa đủ kiểm tra độ mượt.

   - [ ] **Nhịp:** hai khoảng chạm liên tiếp đều **360±30 ms**; toàn chuỗi **1.400±100 ms**.
   - [ ] **Không reset:** giữa các đòn không về gốc, không hiện idle; chân dao động **≤6 px**, không nhảy vị trí giữa hai frame **>3 px** trong pha nối.
   - [ ] **Tư thế liên tục:** cuối đòn trước nối sang đầu đòn sau, không bật về pose lấy đà cũ; ba hướng chém phân biệt được khi tắt VFX.
   - [ ] **Chạm thật:** đầu vũ khí cách đường biên thân địch **≤4 px** tại hit; máu, âm và phản ứng địch lệch tối đa **1 frame ≈17 ms**.
   - [ ] **Giật có kiểm soát:** địch lùi **6±2 px**, hồi trong **145±20 ms**, không trôi sau ba đòn.
   - [ ] **Đọc rõ Mika:** quầng chỉ xuất hiện một lần, **≤100 ms**, opacity **≤0,25**, che thân **≤20%**.
   - [ ] **Kết đúng:** tên chiêu một lần; Mika chỉ quay về sau đòn cuối, sai lệch vị trí gốc **≤2 px**.
   - [ ] **Luật nguyên vẹn:** ca kiểm thử ba đòn ×40 vẫn có đúng **3 lần trừ 40 =120 HP**; thử xen buff/tuyệt kỹ/phía khác vẫn giữ FIFO, chết hoặc kết thúc trận không để Mika mắc phía trước.
