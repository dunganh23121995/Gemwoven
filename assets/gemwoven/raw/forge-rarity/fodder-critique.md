**1. Bố cục**

Đồng ý dùng kệ trên, nhưng **bỏ hai phôi và mũi tên**, không thu nhỏ thành một tấm nữa: hai ô so sánh đã thể hiện Hiếm → Sử Thi. Dành kệ cho:

- **Trái:** ba ô hiến bằng nhau; món đã chọn có hình và `+N`, ô trống có `+`. Chạm món đã chọn để bỏ.
- **Phải:** `2 món · −40%`; bên dưới `↩ [vàng] 6,3 N [quặng] 14 [ngọc] 1`.
- **Khay:** chỉ hiện phí cuối; ba số quặng/gỗ/vải giảm chuyển xanh. Không gạch ngang số gốc vì quá chật. Với phí mẫu trong ảnh: **40 N vàng · 15 quặng · 9 gỗ · 9 vải · 10 tinh hoa**.
- **Không hiện “100%”** trên nút hoặc popup; dễ khiến người chơi hiểu đồ hiến tác động tới xác suất. Giữ nút **“Nâng lên Sử Thi”**.

**2. Hai popup**

- **Chọn:** tiêu đề `Chọn đồ hiến` → `Đã chọn 2/3` → lưới món hợp lệ với hình, `+N`, số ngọc đang khảm và dấu chọn → nút `Xong`. Chỉ đưa vào lưới món cùng phẩm, khác món đang nâng, chưa mặc, chưa khóa, không phải vũ khí bản mệnh; không giới hạn tướng hoặc ô trang bị. Lần đầu không chọn sẵn. Khi đủ ba món, vẫn cho bỏ chọn.
- **Xác nhận:** `Tiêu hao 2 món?` → hình hai món và `+N` → dòng hoàn trả bằng icon → `Hủy` / `Nâng Phẩm`. Chỉ xuất hiện khi có đồ hiến; xác nhận phải dùng đúng phí sau giảm đang hiển thị.

**3. Mảnh hình mới tối thiểu**

Một khung ô hiến tái sử dụng cho ba ô, một khung popup dùng chung, dấu chọn và viền chọn. Tái dùng icon món, nguyên liệu, ngọc, nút và dấu `+` hiện có. Nếu hai tấm phôi đã dính vào ảnh nền, cần thêm **mảnh kệ trống** để thay đúng vùng đó.

**4. Hai prompt mockup**

Các số hoàn trả dưới đây là dữ liệu minh họa; khi tích hợp phải lấy từ lịch sử chi phí của hai món.

**Prompt 1 — màn chính**

```text
Create one polished portrait GAME UI MOCKUP, 941 × 1672 pixels, for Gemwoven’s Vietnamese forge screen, active tab “Nâng Phẩm”.

References: build-1-phone.png is the authoritative reference for the current screen structure and fixed illustrated furniture. mockup-1.png is the approved reference for illustration quality, materials, lighting, and visual hierarchy. Preserve the existing header, hero selector, equipment slots, sword preview, blacksmith, four forge tabs, comparison recesses, stat parchment, five-compartment material tray, large hammer action button, and bottom navigation. No letterboxing, extra panels, or added vertical space.

Modify ONLY the existing upper shelf of the workbench, approximately 720 × 110 design units, currently occupied by the two rarity-ingot plaques. Remove both ingots, their labels, and their arrow. Restore matching illustrated wood behind them.

On the LEFT of this shelf, place three equally sized square sacrifice sockets with illustrated carved wood and restrained gold edging. Show two selected RARE items: blue-accented boots +3 and blue-accented armor +4. The third socket is empty with a clear centered “+”. Keep the item silhouettes and enhancement numbers legible at phone size.

On the RIGHT, show two readable lines:
“2 món · −40%”
then a compact refund row: curved return arrow, gold coin icon “6,3 N”, ore icon “14”, red socketed-gem icon “1”.
Use actual illustrated resource icons, not written resource names.

Preserve the comparison: current “Hiếm” sword +7, upgraded “Sử Thi” sword +7, existing gem retained and new socket highlighted. Retain the existing stat strip.

In the five material compartments, show final required costs only:
gold coin 40 N; ore 15; wood 9; cloth 9; essence crystal 10.
Color only the reduced numbers 15, 9, 9 green. All five requirements are affordable and retain their “✓ Đủ” indicators. Do not show crossed-out original costs.

Keep the main action “Nâng lên Sử Thi”. Do not display “100%” anywhere.
Match the approved hand-painted fantasy artwork; avoid flat generic UI boxes. Prioritize readable Vietnamese typography and generous separation within the fixed shelf. Render the finished screen, without annotations or a device frame.
```

**Prompt 2 — xác nhận**

```text
Create one polished portrait GAME UI MOCKUP, 941 × 1672 pixels, showing Gemwoven’s forge rarity-upgrade confirmation dialog.

References: build-1-phone.png for the existing screen structure; mockup-1.png for the approved illustrated fantasy art direction. Behind the dialog, show the forge “Nâng Phẩm” screen dimmed, with two sacrifice items selected and one empty “+” socket on the upper workbench shelf.

Center a compact illustrated parchment dialog with carved wood and gold trim. Keep it comfortably inside the phone viewport. Arrange its contents vertically:

1. Large Vietnamese title: “Tiêu hao 2 món?”
2. Two clearly separated item portraits: rare blue-accented boots +3 and rare blue-accented armor +4, matching the selected items behind the dialog.
3. A short label “Hoàn trả”, followed by one readable row containing a return arrow, gold coin icon “6,3 N”, ore icon “14”, and red socketed-gem icon “1”.
4. Two large buttons: secondary “Hủy” on the left and primary gold “Nâng Phẩm” on the right.

Do not show probability, “100%”, extra currencies, explanatory paragraphs, or another confirmation step. The consumed items and returned resources must be immediately understandable. Use crisp Vietnamese diacritics, generous spacing, and the same hand-painted materials as the approved forge screen. Render one finished screen without annotations, letterboxing, or a device frame.
```