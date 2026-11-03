1. **Đạt 8,5/10 — duyệt dựng, không cần vẽ lại mockup.** Thứ bậc Cúp → Top 3 → lượt đấu rõ; chất liệu gỗ, đá, vải hợp Lò Rèn và Sảnh Anh Hùng.

   Những điểm bắt buộc khi dựng:

   - Giữ **“Trùm Vô Tận”**. Ba cờ là ba hành động riêng; Đấu Hạng khóa, ghi “Sắp ra mắt”.
   - Top 3 phải ghi AI; thêm **“BXH cục bộ · 31 AI + bạn”**. Giữ thông báo không thưởng thật, không lên bảng toàn cầu. Rương ghi **“Xem thưởng”**, không có chấm báo nhận.
   - Chưa đủ 10 trận: hiện **“Chưa xếp hạng · n/10 trận”**, không dựng sẵn “Hạng 14”. Lượt đấu, tháng, giai đoạn và đếm ngược lấy từ trạng thái thực; đếm tới **mốc kết thúc giai đoạn**.
   - Thể hiện điều kiện **qua ải 30**; giải thích Chuẩn Hóa và mượn tướng trong popup.
   - Giữ HUD/nav chung, Đá Ngọc đúng tài khoản; không đưa Đá Ngọc vào thưởng.
   - Chữ/số hoàn toàn HTML. Ở rộng 390 px: thông tin chính ≥16 px, phụ ≥14 px; vùng chạm ≥44 px. Chấm lại bản dựng trên điện thoại và Studio 1920×911, đạt ≥8/10.

2. **Chốt 9 mảnh mới, chia 2 sheet.** Kích thước dưới đây là kích thước mảnh cắt mục tiêu, chưa tính khoảng magenta.

   | Sheet | Mảnh | Kích thước px |
   |---|---|---:|
   | A | Bảng Cúp: gỗ viền vàng, cúp đỉnh, vải đỏ và nguyệt quế; lòng bảng trống | 1152×576 |
   | A | Dải lụa xanh, viền vàng, trống | 640×160 |
   | A | Khung chân dung vàng, nguyệt quế, ngọc đỏ, nhãn AI trống | 384×448 |
   | A | Khung chân dung bạc, nguyệt quế, ngọc xanh, nhãn AI trống | 384×448 |
   | A | Khung chân dung đồng, nguyệt quế, ngọc cam, nhãn AI trống | 384×448 |
   | A | Giá gỗ đỡ ba cờ: mặt ván, thanh treo và hai trụ; chưa gắn cờ | 1536×320 |
   | B | Nền hàng BXH: giấy sáng, viền gỗ/vàng mảnh; không chia cột cố định | 1408×192 |
   | B | Thẻ cặp đấu: hai hàng người chơi, viền gỗ, lòng giấy trống | 896×320 |
   | B | Ô thưởng vuông: giấy sáng, viền vàng/gỗ | 320×320 |

   **Tái dùng:**

   - `arena-calm.webp`: nền; không vẽ lại sân hay bậc thang.
   - `rank-gold/silver/bronze`: bệ 1–2–3; số HTML. Ghép ba khung chân dung mới phía trên.
   - `chest`: rương; `flag-blue/red`: cờ hai chế độ. Cờ Đấu Hạng dùng bản xanh giảm bão hòa riêng lớp vải, ghép `forge/lock`.
   - `icon-arena`, `icon-crown`: biểu tượng trên cờ; `avatar-ring`: HUD và chân dung nhỏ.
   - `button-gold`: Đấu thử; `nameplate`: nhãn nhỏ; `tab-wood`: dòng hạng của bạn và bảng tên.
   - `forge/tab`: tab popup, nền đếm ngược; `panel-parchment`: thông báo bản thử. Dùng **9-slice**, giữ nguyên góc và độ dày viền.
   - `title plate-1..5`: xem trước danh hiệu trang trí trong tab Thưởng/Vinh Danh; không dùng thay bảng chức năng.
   - Khung vô địch popup dùng **khung vàng mới + bảng tên có sẵn**; chân dung lấy từ ảnh tướng hiện có.

3. **Prompt cho hai sheet.** Khi gọi ImageGen, đính kèm ảnh 1 làm tham chiếu thật. Tọa độ chỉ dẫn bố cục, không được in lên ảnh.

   **Sheet A — 2048×1536, 6 mảnh:**

   ```text
   Create a production UI cutout sheet, 2048x1536 pixels.
   Reference Image 1 (mockup-1.png) defines the art style and ornament
   vocabulary only. Do not reproduce the complete screen.

   Match its polished hand-painted fantasy game art: warm carved wood,
   restrained beveled gold, rich cloth, sculpted laurel leaves, soft
   daylight, crisp silhouettes. Front-facing UI objects, minimal perspective.

   Use a custom three-row layout with exactly SIX separate assets:

   TOP ROW, y=0–640:
   Left cell x=0–1280: one 1152x576 tournament sign, including a centered
   golden trophy above the board, attached red drapery, gold edge fittings
   and side laurels. Keep the dark wooden writing area broad and empty,
   with room for three HTML text lines. All ornament stays inside the cell.
   Right cell x=1280–2048: one 640x160 royal-blue horizontal ribbon with
   gold edging and folded ends, centered in the cell, blank face.

   MIDDLE ROW, y=640–1152, three equal-width cells:
   Left: one 384x448 gold portrait frame with gold laurels and a red gem.
   Center: one 384x448 silver portrait frame with silver laurels and a blue gem.
   Right: one 384x448 bronze portrait frame with bronze laurels and an amber gem.
   Each frame has the same circular portrait opening and an attached small
   blank red cartouche below it. Openings must be solid magenta for keying.
   No portraits. No rank pedestals.

   BOTTOM ROW, y=1152–1536:
   One centered 1536x320 wooden support for three hanging mode banners:
   a quiet plank backing, horizontal hanging rail and two short end posts.
   Leave the banner attachment positions unobstructed.
   No flags, icons, locks or text attached.

   Background: perfectly flat opaque #FF00FF, including all cutout openings.
   Keep at least 32 pixels of clear magenta around every asset.
   Assets must remain separated and fully contained, with no overlaps.
   No background gradients, magenta reflections, cast shadows outside
   silhouettes, grid lines, cell borders or labels.
   Absolutely no text, letters, numerals, pseudo-writing, logos or watermarks.
   ```

   **Sheet B — 1536×1024, 3 mảnh:**

   ```text
   Create a production popup UI cutout sheet, 1536x1024 pixels.
   Use Reference Image 1 (mockup-1.png) for the same polished hand-painted
   fantasy materials, warm palette, carved wood and restrained gold edging.
   These are quiet reusable content frames inside an existing ornate dialog,
   so use thinner borders and less decoration than the main tournament sign.
   Front-facing, crisp silhouettes, soft daylight.

   Use exactly THREE separate assets in this custom layout:

   TOP CELL, x=0–1536, y=0–320:
   One centered 1408x192 leaderboard row backing.
   Pale parchment interior, slim wooden rim, modest gold corner fittings.
   Broad uninterrupted writing area; no fixed columns, portraits or icons.
   Left and right ends must remain distinct for later nine-slice resizing.

   LOWER LEFT CELL, x=0–1024, y=320–1024:
   One centered 896x320 match card.
   Warm wood and gold rim, pale parchment interior, two stacked blank
   participant rows separated by one subtle horizontal rule.
   Leave room at the left for HTML portrait overlays and at the right
   for HTML scores. Do not draw portrait circles, names, scores or connectors.

   LOWER RIGHT CELL, x=1024–1536, y=320–1024:
   One centered 320x320 reward slot.
   Pale parchment center, softly beveled wooden rim with restrained gold.
   Empty center for a separate reward icon; no item, chest or badge.

   Background: perfectly flat opaque #FF00FF.
   All three pieces must be separate, fully contained, with at least
   48 pixels of clean magenta padding. No overlapping ornaments.
   No gradients on the background, magenta spill, external cast shadows,
   grid lines, cell labels or extra objects.
   Absolutely no text, letters, numerals, pseudo-writing, logos or watermarks.
   ```

4. **Popup không cần mockup ImageGen riêng** nếu giữ khung `gw-dialog` hiện có; ghép sheet B, tab Lò Rèn và khung vàng sheet A là đủ. Cần duyệt đủ bốn trạng thái sau khi lắp:

   - **Đua Điểm:** hàng BXH lặp lại; ghim hàng của bạn, tiến độ 10/30 trận và điều kiện 5 trận trong 7 ngày cuối.
   - **Top 8:** thẻ cặp đấu; điện thoại chia Tứ kết/Bán kết/Chung kết, tránh thu toàn bộ nhánh đấu thành chữ nhỏ.
   - **Thưởng:** ô thưởng + icon/tấm danh hiệu có sẵn. Tách thưởng hạng trang trí với gói 10 trận **20.000 vàng + 20 sách kinh nghiệm + 5 tinh hoa**; bản thử ghi rõ **chỉ xem trước, không nhận thật**.
   - **Vinh Danh:** khung vàng + chân dung + bảng tên/tháng; lịch sử thử cục bộ ghi nhãn riêng. Chưa có nhà vô địch thì hiện trạng thái trống, không dựng người thắng giả.

   Giữ tab và thông báo bản thử nhìn thấy khi cuộn; kiểm tra cả điện thoại và Studio.