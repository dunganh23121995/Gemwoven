Tôi chốt đề xuất: **tướng triệu hồi dùng bản sao có sao; Hiro giữ bảng cũ; chỉ luyện cùng tướng; mặc định tự luyện khi lên sao.** Đồng ý hướng Claude, nhưng không đồng ý tăng Hiro lên 31 bản hoặc coi Mika được nhận đều 80 mảnh mỗi mùa.

Các số dưới đây dựa trên [progression.js](D:/Project/Gemwoven/src/gemwoven/progression.js:165), [liveops.js](D:/Project/Gemwoven/src/gemwoven/liveops.js:85) và [vòng mùa tướng §20](D:/Project/Gemwoven/docs/GAME_DESIGN.md:972). Đây là đề xuất thiết kế, chưa sửa mã.

**1. Bảng chốt**

Bản dư là vật liệu có sao, không phải nuôi thêm cấp, kỹ năng hay trang bị. Triệu hồi/ghép 80 mảnh luôn nhận bản 1★.

| Luyện cùng tướng | Bản thô trong thành phẩm | Vàng/lần | Tinh hoa/lần |
|---|---:|---:|---:|
| 2 bản 1★ → 1 bản 2★ | 2 | 5.000 | 5 |
| 2 bản 2★ → 1 bản 3★ | 4 | 15.000 | 12 |
| 2 bản 3★ → 1 bản 4★ | 8 | 50.000 | 30 |
| 2 bản 4★ → 1 bản 5★ | 16 | 150.000 | 70 |

Bảng sau tính từ nguyên liệu toàn bản 1★; tổng bước đã gồm mọi lần luyện trung gian.

| Tướng chính | Nguyên liệu | Bản thô | Phí lên sao chính: vàng / tinh hoa | Tổng bước: vàng / tinh hoa |
|---|---|---:|---:|---:|
| 1→2★ | 1 bản 1★ | 1 | 10.000 / 10 | 10.000 / 10 |
| 2→3★ | 1 bản 2★ | 2 | 35.000 / 25 | 40.000 / 30 |
| 3→4★ | 1 bản 3★ | 4 | 100.000 / 60 | 125.000 / 82 |
| 4→5★ | 1 bản 4★ | 8 | 300.000 / 140 | 400.000 / 214 |
| 5→6★ | 1 bản 5★ | 16 | 1.000.000 / 300 | 1.350.000 / 518 |

Tổng từ tướng chính 1★; **bản dư không gồm bản chính**, không gồm phí tiến hóa/kỹ năng:

| Mốc | Luật | Bản dư thô | Vàng | Tinh hoa |
|---|---|---:|---:|---:|
| 4★, hình thái 2 | Cũ | 6 | 145.000 | 95 |
| 4★, hình thái 2 | Mới | **7** | **175.000** | **122** |
| 6★, hình thái 3 | Cũ | 19 | 1.445.000 | 535 |
| 6★, hình thái 3 | Mới | **31** | **1.925.000** | **854** |

6★ tăng **63% bản dư, 33% vàng, 60% tinh hoa**. Phần tăng lớn nằm ở cuối, đúng yêu cầu nâng sao cao cần nguyên liệu đã luyện cao.

**2. Chốt (a)–(d)**

| Câu | Quyết định | Lý do |
|---|---|---|
| (a) Dùng tướng khác? | **Không**, kể cả luyện 2★/3★ | Tránh banner tướng dễ kiếm nuôi tướng đắt. Bản trùng dùng cho chính tướng đó; khi 6★ mới chuyển bụi. |
| (b) Hiro? | **Giữ 1/2/3/5/8 bản dư và phí cũ**, không thu phí luyện | Giữ đường miễn phí đã thiết kế. Không tăng chỉ số, nguồn mảnh hay tốc độ hiện tại nên không phải buff. Đây là ngoại lệ cần chủ dự án duyệt rõ. |
| (c) Thủ công/tự động? | **Tự động mặc định**, có nút Luyện riêng | Xem trước chuỗi luyện và tổng phí; một lần bấm thực hiện trọn giao dịch. Không tự luyện quá bậc đang cần. |
| (d) Mùa Mika? | **Giữ ngày 14 và 299k = hai bản thô** | Ngày 14 mở bản đầu không đổi. Hai bản trả phí không đồng nghĩa hai bản cao sao hoặc được lên thẳng 3★. |

Người mua Diệu Ngọc, hoàn thành cấp 50 và sự kiện miễn phí nhận **ba bản tổng cộng**: một khi mua, một từ 80 mảnh trả phí, một từ sự kiện miễn phí. Chưa tính quay, đủ lên 2★ và còn một bản 1★.

Lưu cũ: giữ nguyên sao, không truy thu; **`copies - 1`** thành kho bản 1★. Hiro giữ dữ liệu cũ.

Tướng triệu hồi đã 6★: bản dư sao `s` đổi **`80 × 2^(s−1)` bụi**; mảnh dư vẫn 1 bụi/mảnh. Chuyển một lần, xóa nguồn cùng giao dịch; không hoàn phí luyện. Hiro tiếp tục ngoài hệ Ký Ức.

**3. Thời gian và chi phí**

So sánh trước/sau dùng cùng gói mùa Mika dự kiến, tránh trộn thay đổi phần thưởng với thay đổi sao.

| Nguồn miễn phí | Mika nhận được | Điều kiện |
|---|---:|---|
| Mùa ra mắt | 20 mảnh sổ + 60 sự kiện = **80** | Ghép bản chính ngày 14 khi chơi đủ |
| Bụi tuần | 160 bụi/28 ngày → **20 mảnh** | Chỉ tiêu được khi Mika lên kệ hợp lệ |
| Rương ngày 28 | **20 mảnh/mùa** | Đã sở hữu Mika |
| Vé | Dùng **40/28 ngày** để dự toán | Runtime hiện đạt **50** nếu hoàn thành sổ |

**Không cộng 80 mảnh Mika mỗi mùa tiếp theo:** chủ đề đổi tướng. Sự kiện chạy lại Mika chỉ cộng khi có lịch thật. Hiện Mika thường trực trên banner nên chưa mua được mảnh Mika bằng bụi; bụi vẫn tích lũy.

Dự toán dưới dùng ~63 lượt/bản nguyên, dành toàn bộ vé và mảnh tự chọn cho Mika; chưa tính mảnh rơi từ quay, boss hoặc sự kiện chạy lại:

| Kịch bản miễn phí | 4★ cũ → mới | 6★ cũ → mới |
|---|---:|---:|
| Mika thường trực, bụi chưa tiêu được | ~190 → **222 ngày** | ~601 → **981 ngày** |
| Về lâu dài đổi đủ bụi cho Mika, dành vé chờ banner | ~148 → **173 ngày** | ~469 → **765 ngày** |
| Hiro, chỉ 80 mảnh tân thủ + 6/ngày | **67 → 67 ngày** | **240 → 240 ngày** |

Đây là **ước tính theo nguồn**, còn phụ thuộc vàng/tinh hoa và lịch banner/kệ. Kịch bản có bụi chưa cộng thời gian chờ lịch chưa công bố. Không dựa vào bụi Cúp vì bản cục bộ nhận 0.

Nếu bỏ kết quả quay ngẫu nhiên, riêng 40 mảnh/28 ngày từ bụi + rương cần **392 ngày cho 7 bản dư**, **1.736 ngày cho 31 bản dư**, cộng điều kiện chờ kệ. Vì vậy không được quảng bá Mika 6★ miễn phí trong vài tháng.

Nếu áp nhị phân cho Hiro, mốc chỉ làm nhiệm vụ sẽ thành **80 ngày/400 ngày** cho 4★/6★. Tôi bác phần kéo 6★ Hiro từ khoảng tám tháng lên hơn mười ba tháng.

Với người chi tiền, bảng sau bắt đầu khi **đã có bản chính**, dùng toàn Đá Ngọc:

| Mốc | Lượt quay cũ → mới | Đá Ngọc cũ → mới | Quy tiền tham khảo |
|---|---:|---:|---:|
| 4★ | 378 → **441** | 45.360 → **52.920** | ~15,4 → **18,0 triệu** |
| 6★ | 1.197 → **1.953** | 143.640 → **234.360** | ~48,7 → **79,5 triệu** |

Quy theo tỷ lệ gói 2.199.000đ/6.480 ngọc, chưa thưởng nạp đầu, vé, thẻ tháng hoặc sổ; chưa làm tròn số gói. **Đây là dự toán, không phải giá bảo đảm.** Trần bảo đảm bản nguyên là 100 lượt/bản.

Mã còn rơi mảnh khi quay: mô phỏng 3 triệu lượt cho thông lượng dài hạn khoảng **57 lượt/bản quy đổi**, nên bảng 63 ở trên hơi cao. Có đủ ngân sách và tài nguyên thì người trả tiền gom được trong một kỳ banner; chưa có căn cứ hứa số ngày farm vàng/tinh hoa. Thanh toán vẫn là tính năng máy chủ tương lai.

**4. Bố cục tab Tăng Sao để vẽ mockup**

- **Điện thoại 390×844:** tướng chính chiếm khoảng 40% phía trên, đứng trên bệ vẽ; sao hiện tại ngay dưới chân. Phía sau là bóng hình thái kế tiếp nếu sắp đạt 4★/6★.
- **Giữa màn:** công thức bằng hình: `[tướng chính 5★] + [thẻ bản dư 5★ ×1] → [tướng chính 6★]`. Thẻ nguyên liệu dùng chân dung, dải sao và khung vật liệu riêng.
- **Kho bản dư:** năm thẻ 1★–5★ trên một hàng; mỗi thẻ có số lượng. Ô đang cần sáng viền; `1/1` xanh kèm ✓ hoặc `0/1` đỏ kèm dấu thiếu.
- **Khi cần luyện:** chạm thẻ mở cây ghép bằng chân dung và mũi tên. Ví dụ `12/16` bản thô màu đỏ; bản 5★ đích hiện mờ. Không thay số bản cao sao bằng tổng bản thô gây hiểu nhầm.
- **Đáy ghim:** biểu tượng vàng/tinh hoa và số có/cần, nút nhỏ **Luyện**, nút chính **Lên sao** hoặc **Luyện & Lên sao**. Hiện tổng phí ngay trước khi bấm.
- **Studio 1920×911:** tướng bên trái, công thức và kho bên phải; cùng tranh nền, khung và bệ vẽ. Chưa dựng cho tới khi mockup được duyệt và chấm đạt ≥8/10 ở cả hai viewport.

**5. Chỉ chủ dự án quyết**

| Điểm cần duyệt | Đề nghị của tôi |
|---|---|
| Độ dài đích 6★ tướng triệu hồi | Chấp nhận **31 bản dư**, tương ứng khoảng **2–3 năm miễn phí** theo các nguồn đang xét |
| Ngoại lệ Hiro | Giữ **19 bản dư**, nguyên chỉ số và nguồn mảnh |
| Cam kết mùa Mika đang chờ duyệt | Giữ **bản đầu ngày 14**, **299k = hai bản**, bù miễn phí tới ngày 28 |
| Quyền lợi người đã nâng theo luật cũ | Giữ sao đã đạt, không truy thu; chính sách bù thêm nếu có do chủ dự án quyết |

Tôi duyệt cấu trúc này về thiết kế. Phần cần chủ dự án chấp nhận rõ nhất là **độ dài và chi phí mới của 6★**, cùng ngoại lệ giữ đường Hiro.