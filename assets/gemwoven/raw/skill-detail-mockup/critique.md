**1. A — Phê bình bảng hiện tại**

1. Khay nâu tối chiếm nhiều diện tích nhưng icon 50 quá nhỏ; khó nhận ra nguyên liệu.
2. “Có/Cần” chưa thành cặp so sánh rõ; người chơi phải tự tính thiếu bao nhiêu.
3. Khay nguyên liệu, ô Cấp kế và nút dùng ba kiểu nền, viền, độ đậm khác nhau; thiếu tính thống nhất.
4. Huy hiệu và trang trí nổi hơn thông tin quyết định nâng cấp.
5. Mô tả vừa bị rút gọn trong `summary()`, vừa bị clamp trong CSS. Tăng chiều cao đơn thuần vẫn không giải quyết nội dung dài.

**2. B — Bố cục đề xuất**

Giữ bảng **[15,1004,911,484]**. Tất cả tọa độ dưới đây là **tọa độ sân khấu**, chưa trừ gốc bảng.

| Thành phần | x, y, w, h | Thiết kế |
|---|---|---|
| Huy hiệu | 42, 1022, 136, 136 | Icon 96, socket và vòng chọn hiện có |
| Lv | 42, 1150, 136, 36 | `Lv.1/10`, chữ 24 |
| Tên kỹ năng | 198, 1022, 686, 50 | Chữ 42 |
| Nhánh | 198, 1076, 220, 32 | Chữ 24, plaque gọn |
| Mô tả cuộn | 198, 1112, 668, **101,4** | **3 dòng**, chữ 26, line-height **33,8** |
| Rãnh cuộn | 876, 1112, 10, 101,4 | Thumb nhỏ, chỉ hiện khi tràn |
| Nhãn Nguyên liệu | 204, 1218, 222, 34 | Chữ 32 |
| Khay nguyên liệu | 40, 1246, 550, 164 | Gỗ bao ngoài, từng ngăn giấy da sáng |
| Nhãn Cấp kế | 638, 1218, 230, 34 | Chữ 32 |
| Ô Cấp kế | 606, 1246, 294, 164 | Cùng giấy, viền và màu chữ với nguyên liệu |
| Nút hành động | 250, 1418, 440, 56 | Chữ 32, trạng thái rõ |

**Ngăn nguyên liệu:** lề ngang khay 12, khoảng cách 8; hai ngăn rộng **259**, ba ngăn rộng **170**. Không chia sẵn ba ô khi chỉ có hai nguyên liệu.

- Icon **64×64**, giữa ngăn, `y=1258`.
- `Có 11,7 N`: chữ 24, hộp dòng `y=1322, h=28`.
- `Cần 3,6 N`: chữ 24, hộp dòng `y=1350, h=28`.
- `✓ Đủ` xanh hoặc **`Thiếu 2` đỏ**: chữ 24, `y=1378, h=28`.
- Có tên nguyên liệu trong nhãn truy cập và khi chạm icon. Không chỉ dùng màu để báo thiếu.

**Cấp kế:** nhãn `Sát thương` chữ 24; dòng **`169 → 182` chữ 56**, số mới xanh. Bỏ icon trang trí trong ô này để dành chỗ cho số.

**Cuộn mô tả:** dùng toàn bộ `t.description`, bỏ `summary()` và line-clamp. Chạm kéo và lăn chuột chỉ cuộn vùng mô tả; giữ nguyên phần nguyên liệu và nút. Các dòng nằm trên lưới 33,8, không có margin đoạn chen giữa; khi dừng cuộn, căn về đầu dòng để luôn thấy ba dòng trọn vẹn. Gợi ý/mờ nằm ở mép ngoài vùng chữ, chỉ xuất hiện ở phía còn nội dung ẩn; hết nội dung thì tắt. Đổi kỹ năng thì về đầu mô tả.

| Trạng thái | Nội dung và hành động |
|---|---|
| Thiếu nguyên liệu | Giữ chi phí; ghi đúng `Thiếu N` từng ngăn. Nút khóa `Thiếu nguyên liệu` |
| Đủ nguyên liệu | Tất cả ngăn `✓ Đủ`; nút vàng `Nâng cấp` hoặc `Học kỹ năng` |
| Chưa mở | Khay đổi thành `Điều kiện`, từng dòng yêu cầu kèm hiện tại và dấu đạt/chưa đạt; ô phải là `Khi mở`; nút `Chưa mở` |
| Tối đa | Khay ghi `Đã đạt cấp tối đa`, bỏ chi phí; ô phải là `Hiện tại`; nút khóa `Đã tối đa` |

**3. C — Mảnh vẽ**

- **Dùng lại:** khung bảng, huy hiệu/socket, `rank-plate`, `category-plate`, `header-tag`; `tray-wide` làm **viền ngoài** khay.
- **Dùng `ui-kit/stat`** làm mặt giấy từng ngăn; `next-card2` cho ô Cấp kế. Đồng bộ sắc giấy và độ dày viền. Co giãn bằng lát cắt giữ góc, tránh kéo méo hoa văn.
- **Dùng lại `button-ready/locked`**, cùng hình dáng và kích thước; dùng `scroll-track/thumb` cho mô tả.
- **Chưa cần vẽ asset mới.** Nếu thử ghép cho thấy viền `stat` quá nặng, Codex chỉ cần vẽ một **ngăn giấy da viền gỗ mảnh, không chữ, hỗ trợ ghép 2–3 ngăn**. Không cần progress bar.

**4. D — Prompt mockup tiếng Anh**

Phần mô tả trong prompt là chữ minh họa bố cục, chưa xác lập cơ chế Mika.

> Edit the supplied Gemwoven screenshot to create a high-fidelity design mockup of ONLY the skill detail panel. Preserve the existing tree background and outer wood-and-parchment frame. The panel occupies stage rectangle [15,1004,911,484] on a 941×1672 stage. Output a tight 911×484 crop of this panel. All coordinates below are relative to its top-left corner.
>
> Match the reference’s hand-painted fantasy wood, warm ivory parchment, restrained brass trim and small leafy corners. Reuse the supplied Gemwoven UI kit and skill-tree assets wherever possible. Use dark brown Vietnamese serif typography with accurate accents. Keep decorative borders thin enough to preserve reading space.
>
> Place Mika’s fiery skill medallion at [27,18,136,136], with “Lv.1/10” below at [27,146,136,36]. Set the title “Cửu Dương Hồ Diêm” at [183,18,686,50], font size 42; the branch plaque “Chủ Động” at [183,72,220,32], font size 24.
>
> Create an independent scrollable description viewport at [183,108,668,101.4], using font size 26 and exact 33.8 line height: three complete visible lines. Use this illustrative multi-point copy, with each item on its own line: “• Cửu dương hội tụ, hồ diễm bùng lên.” “• Sát thương kỹ năng hiện tại: 169.” “• Xem hiệu ứng bổ sung ở phần dưới.” “• Chi tiết hiệu ứng của kỹ năng.” “• Quy tắc tương tác và ghi chú bổ sung.” Show only the first three lines. Add a subtle scroll thumb in the right gutter and a downward hint outside the text because more content remains below. Never obscure or crop half a visible line.
>
> Place the “Nguyên liệu” header at [189,214,222,34] and its wooden tray at [25,242,550,164]. Inside, create two equal light-parchment compartments, not a dark empty leather field. Each has a prominent 64×64 resource icon, two clearly readable rows and a final status row. Gold compartment: “Có 11,7 N”, “Cần 3,6 N”, green “✓ Đủ”. Skill-book compartment: “Có 0”, “Cần 2”, red “Thiếu 2”. Use font size 24 for these rows.
>
> Place “Cấp kế” at [623,214,230,34], with a matching parchment card at [591,242,294,164]. Show “Sát thương” at size 24 and “169 → 182” at size 56, with 182 green. Omit an extra decorative stat icon.
>
> Place the disabled wooden action button at [235,414,440,56], labelled “Thiếu nguyên liệu” at size 32. Match its trim and materials to the tray and next-level card. Preserve clean spacing, complete Vietnamese diacritics and all specified values. Add no other interface elements.