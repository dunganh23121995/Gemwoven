**1. Phê bình**

Bố cục đúng chất Lò Rèn, nhưng cần sửa ba điểm:

- **Thứ tự đọc:** tướng/ô đang mặc → phẩm sẽ đổi → lợi ích → phí → hành động. Giữ cách dùng hình lớn, nhãn ngắn như Sảnh Anh Hùng, Túi Đồ và Cửa Hàng; không thêm một bảng giải thích.
- **Dễ lẫn Cường Hóa:** bỏ hàng “×1 / Tối đa”; làm **Hiếm → Sử Thi** nổi bật hơn **+7**. Hai ô đều giữ độ rõ, không làm món hiện tại mờ như sắp bị tiêu hủy.
- **Giữ cấp/ngọc bằng hình:** hai bên có huy hiệu **+7** giống hệt nhau; viên ngọc Công xuất hiện cùng vị trí, cùng hình ở cả hai bên. Bên phải chỉ thêm **một ổ trống phát sáng**. Chân dung Hiro vẫn ở thanh chọn tướng, ô Vũ khí vẫn được chọn.

Không đưa thêm “lỗ khảm 1 → 2” lên dải chỉ số: các ổ dưới món đồ đã nói được điều đó.

**2. Quyết định cụ thể**

- **Bốn tab:** cùng hàng, cùng kích thước; tên một dòng, biểu tượng nhỏ. Trong khung 941, mỗi nút khoảng 210×108; chữ khoảng 30–32. Nâng Phẩm chọn bằng mặt gỗ sáng và viền vàng, ba tab còn lại trầm.
- **Kệ phôi:** chọn **hai phôi Hiếm → Sử Thi**, có tên phẩm, chỉ để xem. Không dùng thang sáu nấc: chật và dễ bị hiểu là bộ chọn công thức Chế Tạo. Với phẩm Thường, dùng biểu tượng chung của ô trong thẻ da trung tính; không cần vẽ phôi Thường.
- **Hai ô lõm:** “Hiện tại” / “Sau nâng”; hình đồ lớn, tên phẩm nổi bật, +7 nhỏ và đồng nhất. Hàng ổ khảm nằm trong mỗi ô, căn cùng mốc bên trái. Ổ mới rỗng, viền sáng, nhãn nhỏ “Mới”; không có khóa.
- **Khay:** giữ năm ngăn. Hiện số **đang có/cần** và dấu ✓; thiếu thì ghi “Thiếu N” ngay dưới đúng nguyên liệu. Khi lên Thần, thêm thẻ da phụ cho **50 thần thạch** dưới khay, không ép sáu ngăn. Khi ấy cũng có một dòng xem trước “Thuộc tính ngẫu nhiên” với biểu tượng bí ẩn.
- **Sẵn sàng:** tấm búa vàng, nhãn **“Nâng lên Sử Thi”** — rõ kết quả hơn chỉ “Nâng Phẩm”.
- **Khóa ải:** ưu tiên trên trạng thái thiếu; tấm thép kèm khóa, “Mở sau ải N”, nút “Khám Phá”.
- **Thiếu:** tấm thép không khóa, “Thiếu nguyên liệu”; từng ngăn cho biết thiếu gì. Tránh “Thiếu N nguyên liệu” vì không rõ N là số loại hay số lượng.
- **Tối đa:** “Phẩm cao nhất”, bỏ mũi tên và phí; hiển thị món Thần cùng toàn bộ ngọc.
- **Vừa nâng:** giữ cặp trước/sau, nhãn phải đổi “Vừa nâng”, lóe sáng ngắn; nút thành “Tiếp tục”. Chỉ sau đó mới chuyển sang xem phẩm kế tiếp, tránh bấm liên tiếp ngoài ý muốn.

**3. Mảnh hình mới**

- **Một biểu tượng Nâng Phẩm:** hai phôi kim loại lam → tím nối bằng mũi tên vàng, đọc rõ ở cỡ nhỏ; nền trong suốt, không chữ.

Các khung, tab, thẻ, ổ khảm, ánh sáng và tấm hành động dùng lại. Không cần vẽ lại bàn rèn.

**4. Prompt image_gen**

```text
Use case: ui-mockup.

Create ONE complete, polished portrait mobile game screen for Gemwoven, a fantasy match-3 RPG. Target canvas: 941 × 1672. Full bleed, no phone bezel, no outer letterboxing, no Studio interface.

REFERENCE IMAGES:
- current-strengthen-phone.png: primary reference for the actual portrait screen proportions, HUD, equipment selector, blacksmith placement, workbench structure, action plate, and bottom navigation. Ignore the outer letterboxing in this reference.
- mockup-1.png: approved reference for the painted forge environment, warm lighting, expressive elderly blacksmith, carved timber, gold hardware, parchment, leather, foliage, stone anvil, and richly illustrated interface materials.

Preserve this exact forge identity and visual language. Keep the smiling white-haired blacksmith with goggles and raised hammer on the right, glowing furnace behind him, blue banners, wooden beams, stone walls, and weapon preview above the anvil. Preserve the existing workbench: upper ingot shelf, two recessed comparison panels, parchment stat strip, and five-compartment material tray. Do not redesign the environment.

PRODUCTION INTENT:
This is a visual mockup for an interface built from painted image assets with separate HTML text. In this mockup, render all labels and numbers as crisp, clean overlay typography, visually separate from the painted surfaces. Frames, buttons, panels, icons, and sockets must look illustrated, matching the references. No modern flat dashboard cards.

EXACT GAME STATE:
Hiro is wearing the selected weapon: Hiếm +7.
It contains one attack gem.
The player has cleared stage 85.
Preview exactly one rarity upgrade: Hiếm → Sử Thi.
The same weapon remains equipped to Hiro.
Enhancement remains +7.
The existing attack gem remains in socket one.
The target gains one additional EMPTY socket.
All required materials are available.
This is the READY preview, before the upgrade.
There is no chance mechanic. Do not display any percent symbol anywhere.

READING ORDER AND LAYOUT:

1. TOP:
Preserve the familiar portrait HUD, gold balance, premium currency balance, and mail icon from current-strengthen-phone.png.
Use the forge title “Rèn Đồ”.
Keep the Hiro portrait selector labeled “Hiro”.
Keep all six equipment slots in their existing order:
“Vũ khí”, “Áo”, “Mũ”, “Giày”, “Quần”, “Kính”.
Select “Vũ khí”. Its thumbnail has the +7 badge.
Keep the forge scene and blacksmith clearly visible.
Above the anvil, show the purple Epic weapon as a preview, with the small label “Xem trước”.

2. FOUR WOODEN TABS ON ONE ROW:
Exact labels:
“Chế Tạo” | “Cường Hóa” | “Khảm Ngọc” | “Nâng Phẩm”
Equal widths, approximately 210 design pixels each, about 108 pixels tall.
Keep every label on one line, with a small painted icon.
Select only “Nâng Phẩm”: brighter wood and gold edging.
Use a two-ingot upgrade icon for this tab.
Keep the inactive tabs darker but readable.

3. UPPER WORKBENCH SHELF:
Two large existing-style metal ingots: blue Rare on the left, purple Epic on the right, with one gold arrow between them.
Exact captions: “Hiếm” and “Sử Thi”.
This is a non-interactive transition summary, not a six-tier selector.
Do not include quantity or maximum-upgrade controls.

4. RECESSED COMPARISON PANELS:
Left heading: “Hiện tại”.
Right heading: “Sau nâng”.
A gold arrow connects the panels.

Left: the blue Rare sword, clearly readable label “Hiếm +7”.
Right: the matching purple Epic sword, clearly readable label “Sử Thi +7”.
Make the rarity names visually dominant.
The +7 badges must have identical size, color, and placement on both sides.
Keep the left panel fully legible; do not fade the current item away.

Inside each panel, below the item label, show the socket row.
Left: one socket containing the attack gem.
Right: the identical attack gem in the identical first position, followed by one EMPTY socket.
Use the exact same gem appearance on both sides.
Only the newly added empty socket receives a restrained warm glow and the tiny overlay label “Mới”.
Do not put a lock on the new socket.
Do not fill the second socket with a gem.
The Epic item should be the strongest focal point on the workbench.

5. PARCHMENT STAT STRIP:
Use a painted sword icon and the short exact overlay:
“Công tăng”
This communicates the benefit without inventing numerical combat values.
Keep socket information in the comparison panels, not duplicated here.

6. FIVE-COMPARTMENT MATERIAL TRAY:
Small shared heading: “Đang có / Cần”.
Use the established painted icons and this exact order:
gold, ore, wood, cloth, essence.

Exact values:
“900.000/40.000”
“50/25”
“30/15”
“30/15”
“20/10”

Each compartment has a small green check and “Đủ”.
Keep the quantities readable at phone size.
This Rare-to-Epic upgrade requires no divine stone.
Do not show any divine-stone compartment.
Do not show a stage lock or an Explore button in this ready state.

7. PRIMARY ACTION:
One large illustrated gold hammer plate above the bottom navigation.
Exact label: “Nâng lên Sử Thi”.
This is the only dominant action.
No confirmation dialog, success animation, insurance control, or probability text.

8. BOTTOM NAVIGATION:
Preserve the painted navigation bar and established icon style.
Exact labels:
“Trang Chủ”, “Tướng”, “Túi Đồ”, “Kỹ Năng”, “Triệu Hồi”, “Đấu Trường”, “Thêm”.

TEXT AND QUALITY:
Render Vietnamese accents exactly as supplied.
Use bold, readable, dark-brown fantasy serif lettering on parchment and warm gold lettering on dark surfaces.
Keep tab labels approximately 30–32 pixels high at the target canvas size.
Maintain generous separation between pictures, labels, sockets, and material amounts.
Reserve the strongest glow for the target item and primary action; the new socket glow is secondary.
Everything fits in one portrait viewport without scrolling or overlapping the bottom navigation.
No extra explanatory paragraphs, no six-tier ladder, no random reward preview in this Rare-to-Epic state, and no additional characters.
```