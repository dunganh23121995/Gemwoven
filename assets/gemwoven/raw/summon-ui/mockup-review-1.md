**(1) Điện thoại 390 px: 8,6/10; Studio khoảng 512 px: 8,8/10. Đạt để dựng**, với các chỉnh sửa dưới đây. So với màn hiện tại (6,5/7), bố cục gọn và thứ tự đọc rõ hơn; vật liệu gỗ–đồng hợp Shop/Forge đã duyệt. Đây là điểm duyệt thiết kế; bản dựng cần kiểm tra lại chữ HTML ở hai cỡ.

**(2) Bảy điểm phải sửa khi dựng** — tọa độ tính trên khung **941×1672**:

1. **Đúng tỷ lệ:** ảnh mockup thực tế là **1024×1536**, có viền mờ ngoài. Dựng lại các lớp trên nền hiện tại; không kéo giãn ảnh hay lấy vị trí pha lê/NPC trong mockup làm chuẩn.
2. **Biển kỳ:** khoảng `[268,294,405,68]`, một dòng, đỏ nâu trầm, viền đồng mảnh. Hai xích móc lên vòm; đáy biển cách đỉnh pha lê Mika ít nhất **16–20 px**.
3. **Nút và vé:** hai cụm rộng khoảng **310 px**, cách nhau **31 px**; mặt chỉ ghi ×1/×10, đế riêng chứa biểu tượng vé + số. Huy hiệu số vé căn giữa phía trên, không che tâm vòng triệu hồi.
4. **Rương:** cụm mảnh + 0/80 khoảng `[754,904,160,126]`, neo vào mặt trước rương hiện có; giữ thấy nắp và pha lê, không thêm nền rương mới.
5. **Bảng chung:** khoảng `[52,1194,837,254]`; gỗ mật ong tối hơn tranh nền, giảm vàng sáng ở viền. Giữ khoảng **20–24 px** với đế nút phía trên; không lấn menu.
6. **Chữ và ô thưởng:** chữ phụ tối thiểu **34 px**, giá **40 px**, ×1/×10 khoảng **54–60 px**; màu kem, bóng nâu gọn, tránh nét viền đen dày. Ba socket khoảng **112×112 px**; dùng chân dung Mika rõ mặt, nhãn Tướng/Mảnh/Thần một dòng.
7. **Thanh bảo đảm và nút i:** thanh nền tối, viền đồng mảnh, **0/100 thì rỗng**; không thêm chân dung Mika. Nút i có thể vẽ nhỏ nhưng vùng chạm tối thiểu **106×106 px** ≈44 CSS px; áp dụng tương tự cho biển kỳ và rương.

**(3) Vẽ mới bốn mảnh**, tất cả không chữ, không số, nền **#FF00FF**:

| Thứ tự | Mảnh mới | Kích thước thân gợi ý |
|---|---|---:|
| Hàng 1 | Biển gỗ đỏ nâu, viền đồng, hai đoạn xích ngắn phía trên | 810×136, chưa tính xích |
| Hàng 2 | Đế giá vé cho nút xanh, gỗ tối viền đồng | 540×96 |
| Hàng 3 | Đế giá vé cho nút vàng, cùng hình dáng | 540×96 |
| Hàng 4 | Bảng gỗ chung, góc đồng và ít lá; lòng bảng trống | 1674×508 |

**Tái dùng ref-kit:** `button-blue/gold`; `plaque` cho tiêu đề và kỳ sau; `tag/badge-leather` cho số vé và 0/80; `round` cho i; `socket-on` cho ba ô thưởng; `progress/progress-fill`; `ticket`, `fragment-fire`, `portrait-fire`. Vũ khí Thần dùng ảnh hiện có. Giữ nguyên nền, rương, pha lê, NPC, HUD và menu hiện tại. Mọi chữ/số là HTML.

Prompt tiếng Anh cho **một sheet, một cột × bốn hàng cố định**:

```text
Create one production UI pieces sheet, 2048×2560 pixels, one column and four equal 2048×640 cells. References: mockup-1 defines component shapes; ref-kit and approved Shop/Forge define painted materials.

Use perfectly flat solid #FF00FF background, including gaps and chain openings. Cozy hand-painted fantasy, honey wood, restrained brass, crisp mobile silhouettes, consistent upper-left lighting.

Fixed order, top to bottom:
Row 1: dark reddish-brown wooden contract sign, thin brass bevel, blank face, two short gold chains attached above. Sign body approximately 810×136 pixels, excluding chains.
Row 2: recessed dark wooden price pedestal with brass trim, approximately 540×96, shaped to attach beneath the existing blue summon button.
Row 3: matching price pedestal for the gold summon button, approximately 540×96.
Row 4: wide honey-wood reward panel, approximately 1674×508, brass corner fittings and sparse small corner leaves; uninterrupted blank interior.

Center each complete piece within its cell. Preserve these proportions. Generous clear magenta margins; no overlap or clipping. No text, letters, numerals, labels, currency icons, sockets, progress bars, button faces, characters, scenery, guides, watermark, external glow, or cast shadows.
```