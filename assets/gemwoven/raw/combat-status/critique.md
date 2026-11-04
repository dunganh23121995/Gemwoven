**A. Đồng ý bỏ biển tên và đưa hiệu ứng lên trên máu**, sửa đề xuất Claude ở các điểm sau:

- Hiện tại: biển tên nổi hơn hiệu ứng; chip dưới nộ quá nhỏ, chip chữ boss làm hàng dài không đều. Ảnh ngang còn **không thấy bàn ngọc** trong khung chụp; đây là vấn đề bố cục cần xử lý riêng.
- Mỗi nhân vật có **1 hàng hiệu ứng**, cách thanh máu **4 px**, đi cùng HUD của nhân vật. Bỏ hàng status cũ dưới nộ. Không có hiệu ứng thì không vẽ ô trống.
- **Không tách hai cụm trái/phải**: thiếu chỗ và dễ nhầm với hai phe. Trong cùng hàng: mất lượt → bất lợi khác → có lợi; thứ tự cố định, không đảo theo lượt còn lại.
- Tối đa **5 ô tổng cộng**. Có 6 hiệu ứng: **4 glyph + “+2”**. “+N” đếm loại hiệu ứng bị ẩn, không đếm tầng.

Tất cả kích thước dưới đây là **px CSS**, điện thoại quy về **390×844**, ngang **844×390**, Studio **1920×911**:

| Thành phần | Dọc | Ngang | Studio |
|---|---:|---:|---:|
| Ô hiệu ứng | 28 | 28 | 32 |
| Glyph bên trong | 20–22 | 20–22 | 24 |
| Khoảng cách ô | 2 | 2 | 4 |
| Bề rộng 5 ô | 148 | 148 | 176 |
| Chữ số lượt/tầng | 10 | 10 | 12 |

HUD hiện rộng **124 px**: cần cho hàng hiệu ứng rộng riêng **148 px**, không ép 5 ô vào chiều rộng thanh máu.

**Số và tương tác:**

- Lượt còn lại: góc **phải trên**, luôn hiện cả số **1**.
- Tầng: góc **trái dưới**, ghi **×3**; không dùng một con số chung cho cả lượt lẫn tầng.
- Hệ số sát thương: nhãn dưới glyph, ví dụ **×1,5**. Chỉ hiện **×2** khi cơ chế thực sự cho ×2.
- Hiệu ứng hết trận không cần số lượt; chú giải ghi “Đến hết trận”.
- Chạm mở chú giải, chạm ngoài đóng; giữ **350 ms** cũng mở. Desktop hỗ trợ rê chuột và focus.
- Chú giải rộng **200–220 px**, chữ **13 px**, gồm tên, tác dụng thực tế, lượt/tầng. Neo cạnh hàng, tránh thanh máu; “+N” mở danh sách đầy đủ với mỗi dòng cao **44 px**.

Huy hiệu hệ dùng lại `em-<hệ>.webp`, cỡ **16/16/20 px**, đặt cạnh **đầu phải thanh nộ**. Đây là thông tin cố định, không chiếm ô hiệu ứng. Giáp tiếp tục hiện số cạnh máu.

**B. Chốt 26 glyph, khung vẽ riêng.**

| Nhóm | Glyph và hình nhận diện |
|---|---|
| Khống chế — **5** | **Choáng:** sao xoay; **Đóng băng:** khối băng; **Phong ấn:** ổ khóa trên ấn phép; **Hỗn loạn:** hai mũi tên rối; **Mù:** mắt bị gạch |
| Sát thương/ấn — **6** | **Thiêu đốt:** ngọn lửa; **Độc:** giọt độc; **Nguyền rủa:** đầu lâu mang ấn; **Ấn sấm:** rune sét trong vòng đếm; **Hàn ấn:** rune trên mảnh băng; **Tê liệt:** tia điện kẹp bình năng lượng |
| Suy giảm — **4** | **Suy yếu:** kiếm chúc xuống; **Vỡ giáp:** khiên nứt; **Cấm hồi:** tim bị gạch; **Giáp tan chảy:** giáp nhỏ giọt |
| Có lợi — **11** | **Biến Thân:** hình người tỏa sáng; **Dư âm:** bóng người kèm tia sáng sót lại; **Hóa mờ:** bóng người nhòe; **Hồi phục/Tái sinh:** lá ôm dấu cộng; **Khắc hệ:** kiếm trên mũi tên tăng; **Cuồng nộ:** mặt thú gầm; **Tàng hình:** mắt khuất sau màn; **Miễn thương:** khiên kín; **Bất tử:** tim trong vòng vô cực; **Gai phản:** khiên gai; **Cuồng huyết:** nanh ôm giọt máu |

Dùng chung glyph Choáng, Đóng băng, Thiêu đốt giữa hai phía; ấn choáng Nori dùng glyph Choáng. **Hồi phục/Tái sinh dùng chung hình**, nhưng chú giải giữ đúng tên và cơ chế. Không gộp Hóa mờ/Tàng hình, Miễn thương/Bất tử, Cuồng nộ/Cuồng huyết.

Phong cách: vẽ tay như kit hiện có, khối màu rõ, viền tối **1–1,5 px ở cỡ 24 px**, mỗi glyph tối đa **2–3 chi tiết chính**. Chất đồng ở viền; tránh nhồi vân gỗ vào glyph.

Vẽ **2 khung tái sử dụng**, tách khỏi glyph:

- Có lợi: đồng vàng, góc tròn.
- Bất lợi: đồng đỏ sẫm, góc vát.

Màu và hình góc cùng phân biệt hai nhóm. Chữ, lượt, tầng, hệ số và “+N” ghép khi chạy để luôn sắc nét.

**C. Tên PvP: chọn plaque da–đồng nhỏ từ kit.**

Neo theo **khung trận**, không theo nhân vật. Tọa độ là góc trái trên của plaque, tính từ góc trái trên màn hình; plaque phải đối xứng phía đối thủ.

| Khung hình | Plaque trái | Plaque phải | Cỡ tối đa | Chữ |
|---|---|---|---|---:|
| Dọc 390×844 | **(24, 82)** | **(242, 82)** | **124×24** | 12 |
| Ngang 844×390 | **(226, 82)** | **(494, 82)** | **124×24** | 12 |
| Studio 1920×911 | **(52, 110)** | **(960, 110)** | **160×30** | 14 |

Giữ khoảng hở dọc ít nhất **12 px** giữa plaque và hàng hiệu ứng; khi nhân vật nhảy, HUD không được xâm phạm vùng tên.

Tên **1 dòng**, cắt theo chiều rộng bằng **“…”**, không thu nhỏ chữ; chạm hiện tên đầy đủ. Áp dụng cho cả 4 loại trận đã nêu; AI dùng **tên hiển thị của đối thủ**, không thay bằng tên tướng. Nhãn chế độ phân biệt **Cùng máy / AI / Trực tuyến** theo trạng thái thật; trực tuyến chưa phát hành giữ **Sắp ra mắt**. PvE không có plaque tên.

**D. Prompt mockup điện thoại**

> **Use case: ui-mockup — chỉnh ảnh tham chiếu.**  
> Tạo mockup Gemwoven ở kích thước thiết kế **390×844**, có thể xuất **780×1688**. Image #1 là ảnh cần chỉnh; giữ nguyên khung trận gỗ–đồng, cảnh hoàng hôn, hình và vị trí Noct/Hỏa Long, thanh máu/nộ, thanh hành động, toàn bộ bàn ngọc 8×8 và phong cách vẽ tay. Dùng cặp nhân vật trong ảnh để minh họa bố cục.
>
> Bỏ hai biển tên nhân vật và chip hiệu ứng cũ dưới thanh nộ. Thay mỗi biển tên bằng **5 ô hiệu ứng 28×28 px**, cách nhau **2 px**, nằm trên thanh máu **4 px**. Glyph lớn, đọc rõ khi thu về 390×844; khung đồng đỏ góc vát cho bất lợi, đồng vàng góc tròn cho có lợi.
>
> Phía Noct: Choáng **1**, Thiêu đốt **2**, Nguyền rủa **3 lượt / ×2 tầng**, Suy yếu **2**, Hóa mờ **2**. Phía Hỏa Long: Choáng **1**, Đóng băng **1**, Thiêu đốt **3**, Tàng hình **2**, Miễn thương **2**. Số lượt ở phải trên; tầng ×2 ở trái dưới. Giữ máu **170/190**, giáp **41**, máu đối thủ **350/350**, nộ hai phía **0/100**. Thêm huy hiệu hệ nhỏ cạnh đầu phải thanh nộ.
>
> Minh họa biến thể có tên tài khoản hai góc trên trong khung trận: plaque trái **(24,82), 124×24**, chữ “NgọcLữKhách…”; plaque phải **(242,82), 124×24**, chữ “RồngĐỏ”. Đổi nhãn “Ải 1” trên thanh đầu thành “Cùng máy”. Hai plaque không đè hiệu ứng.
>
> Mở **một** chú giải giấy da viền đồng, khoảng **210×72 px**, trong khoảng cảnh trống dưới hai plaque, có mũi chỉ tới glyph Suy yếu. Chữ chính xác: **“Suy yếu”**, **“Giảm sát thương gây ra”**, **“Còn 2 lượt”**. Không che máu, nhân vật hoặc bàn ngọc.
>
> Giữ nguyên kích thước và vị trí khung trận hiện có; không thêm bảng lớn, không dùng emoji hay ô giao diện phẳng. Đây là ảnh duyệt bố cục; chữ và số khi triển khai sẽ được ghép riêng.

Chưa sửa mã, chưa tạo ảnh.