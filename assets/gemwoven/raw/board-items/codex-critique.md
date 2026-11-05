**Chốt: đồng ý hướng Claude, nhưng cần bớt chi tiết vàng và bổ sung hình ảnh lúc kích hoạt.** Chỉ làm idle đẹp sẽ chưa truyền được sức mạnh của cơ chế.

**(a) Hiện trạng — chấm theo ảnh tĩnh**

| Tiêu chí | Điểm | Nhận xét |
|---|---:|---|
| Rõ ràng | **4/10** | Special gần giống ngọc thường; IV/V quá nhỏ. Ba trạng thái boss khó phân biệt. |
| Mạnh | **3/10** | Hình chưa báo được quét 3 dải, nổ 5×5 hay mất lượt. |
| Đã mắt | **6/10** | Art nền, nhân vật và ngọc tốt; phần cơ chế mới thiếu điểm nhấn. |

Tham khảo cách phân vai **Rocket/TNT/Light Ball** của [Royal Match](https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/6-creating-and-using-the-power-ups/) và **Striped/Wrapped/Color Bomb** của [Candy Crush](https://candycrush.zendesk.com/hc/en-us/articles/211939685-Creating-and-combining-Special-Candies). Tôi chọn áp dụng nguyên tắc: **hình dáng riêng → báo vùng tác động → bùng nổ → trả lại bàn rõ**, giữ mỹ thuật Gemwoven.

**(b) Chốt từng mục**

1. **Special — đồng ý, sửa hình và thêm activation.**
   - **Sao băng:** giữ ngọc khoảng 74%; giá rune hai mũi tên lớn, ít nét. Thêm **ba vệt song song** để gợi quét ba dải. Chỉ xoay giá, ngọc đứng nguyên. Khi nổ, ba luồng sao chổi chạy xuyên vùng bị xóa.
   - **Bom:** vỏ cầu dạng khung mở, còn thấy rõ màu/ngọc gốc; ngòi nổi bật hơn đinh tán. Khi nổ: co sáng ngắn → sóng xung kích vuông bo góc phủ **5×5**. Lửa chỉ làm điểm nhấn.
   - **Lõi:** duyệt nhân trắng, các mảng lăng kính lớn, một vòng rune. Khi đổi: nối sáng tới đúng màu rồi hút/vỡ đồng loạt.
   - **Bỏ IV/V.** Quầng nền nhẹ; vòng chọn chỉ xuất hiện khi tương tác. Pop 1,35 chỉ dành lúc tạo, tránh cả bàn nhấp nháy.

2. **Thanh băng — duyệt.** Sáu tinh thể riêng dưới máu boss, bốn đầy/hai rỗng phải đọc được khi đứng yên; thêm **4/6**. Dùng tinh thể dài, khác silhouette ngọc bông tuyết trên bàn. Viên mới đầy nảy một lần.

3. **Đóng băng — duyệt, tăng độ rõ.** Băng bọc từ chân lên nửa thân, vài cạnh băng ôm hai bên; giữ mặt và dáng boss. Dừng fidget, phủ sắc lạnh, hiện **“Đóng băng · Mất lượt”** khi áp dụng. Sương nằm thấp, không che hình; lúc giải băng mới vỡ mảnh.

4. **Kháng — sửa.** Vòng rune mờ ở chân chưa đủ. Thêm **cung khiên hổ phách đứt đoạn** quanh thân dưới và nhãn “Kháng khống chế” lúc bắt đầu. Hình tĩnh cũng phải khác đóng băng; không chỉ đổi màu biểu tượng.

5. **Nộ — duyệt, gom hiệu ứng.** Ngọc tím tạo tia bay vào thanh nộ; nhiều viên thì gom thành vài luồng. Điểm cộng vẫn đúng **7/viên**. Bonus combo hiện riêng **+3/+6/+10/+15**, tránh hiểu nhầm là tổng nộ của lượt.

6. **Preview — duyệt, bắt buộc khớp runtime.** Kéo tới special kề thì tô các ô bị tác động, giữ ngọc nhìn xuyên được. Lõi tô đúng màu mục tiêu. Lấy vùng từ bộ tính luật chung; chú thích đầu `board-specials.js` đang mô tả một số phạm vi cũ.

**Hai tờ art A/B dùng được cho bộ phận hình tĩnh.** Tách lớp ngọc, giá, ngòi, vòng để chuyển động độc lập; bổ sung vệt quét, xung kích và tia nối màu cho activation. Giảm chuyển động vẫn giữ hướng, vùng tác động và trạng thái rõ.

**(c) Prompt mockup để vẽ**

> Vẽ một mockup màn hình game Gemwoven dọc, khung nhìn logic **390×844**, tràn khung, không vẽ điện thoại. Ảnh 1 là tham chiếu bố cục, nhân vật, nền và khung đồng vàng; ảnh 2 là tham chiếu ngọc. Mỹ thuật fantasy vẽ tay sắc nét, chất liệu đồng cổ và đá quý, đúng phong cách hai ảnh.
>
> Bố cục: thanh trên y=0–54; đấu trường y=64–374; điều khiển y=382–444; bàn 8×8 tại x=16, y=466, kích thước 358×358, mỗi ô khoảng 45px. Giữ nữ chiến binh lửa bên trái, boss golem rêu bên phải. Dưới máu boss đặt sáu tinh thể băng: **bốn đầy xanh sáng, hai rỗng tối**, kèm “4/6”. Boss chính đang tích băng, thân chưa phủ băng.
>
> Bàn chứa đúng **ba special**: hàng 2 cột 3 là Sao băng ngọc tím, giá rune ngang với hai mũi tên vàng lớn và ba vệt sáng song song; hàng 5 cột 6 là Bom ngọc tim đỏ trong khung cầu đồng mở, ngòi cháy rõ; hàng 7 cột 3 là Lõi lăng kính cầu vồng, nhân trắng, một vòng rune. Ngọc thường giữ nguyên thiết kế tham chiếu. Special phân biệt bằng silhouette, vẫn đọc rõ màu gốc, không có chữ IV/V, ánh sáng không tràn sang ô cạnh.
>
> Thêm ô minh họa nhỏ **102×78 tại x=22, y=76**, viền đồng mảnh, nhãn “Đóng băng”: cùng boss bị băng trong xanh bọc chân tới nửa thân, mặt còn rõ, sương thấp. Đây là ảnh trạng thái phụ riêng.
>
> Chụp trạng thái đang chờ thao tác: ba special có hình dáng rõ, hiệu ứng tiết chế. Ưu tiên đọc ở kích thước điện thoại; rune ít nét, tương phản sáng tối rõ, không phủ bloom trắng, không thêm bảng chú giải lớn.

**Điều kiện duyệt:** ở đúng kích thước 390×844, nhìn 0,3 giây phân biệt được ba special và hướng Sao băng; phân biệt được tích băng, đóng băng, kháng khi tắt chuyển động. Mockup này kiểm tra hình tĩnh; độ “mạnh” phải duyệt tiếp bằng clip kích hoạt trong trận.