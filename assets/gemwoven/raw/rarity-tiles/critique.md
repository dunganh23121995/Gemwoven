1. **Hiện trạng: Túi Đồ 3/10; Phần Thưởng Hiếm 4/10.** Ba lỗi chính:
   - Khung giống nhau khiến gỗ, mảnh tướng và vũ khí Thần có cùng trọng lượng thị giác.
   - Màu trong tranh vật phẩm dễ bị hiểu thành độ hiếm: tinh thể đỏ nổi hơn mảnh tướng dù chưa chắc quý hơn.
   - Bảng Phần Thưởng Hiếm có nhãn phân loại nhưng không cho thấy chênh lệch độ quý giữa ba phần thưởng.

2. **Chốt R1–R5:**
   - **R1 — Đồng ý, giảm độ rực.** Vẽ bốn ô mới **Hiếm / Sử Thi / Huyền Thoại / Thần**, canvas 341×319, giữ đúng dáng, lòng chứa vật phẩm và vị trí neo của `inventory-slot`. **Viền và đá quý mang màu bậc chính**; nền chỉ nhuộm màu nhẹ, tâm sáng vừa, mép tối. Huyền Thoại có tia mờ; Thần thêm góc đồng chạm và tia rõ hơn một chút. Tránh nền phát sáng trắng làm mất nét vật phẩm.
     
     **Thường:** dùng ô hiện tại. **Tốt:** chưa cần thêm một ô hoàn chỉnh; dùng ô hiện tại kèm một dấu đá xanh lá vẽ sẵn, không chỉ báo bằng chữ. **Hiếm:** cần ô riêng. Như vậy vẫn nhận ra Tốt, đồng thời dành phần lớn độ nổi cho bốn bậc cao.
   - **R2 — Đồng ý có giới hạn.** Hiếm/Sử Thi tĩnh. Huyền Thoại quét sáng nhẹ mỗi 5–6 giây; Thần thêm 1–2 điểm lấp lánh. Chỉ chạy trên ô đang chọn hoặc ô giới thiệu phần thưởng, tránh cả túi cùng nhấp nháy. Tôn trọng giảm chuyển động; chỉ tái dùng `summon-sparkle` nếu thử ở kích thước thật thấy đủ nhỏ và dịu.
   - **R3 — Chấp nhận bảng gán cho đợt này:** trang bị theo độ hiếm thực; mảnh Mika/Yuki/Nori/Lumi/Noct = **Huyền Thoại**; mảnh Hiro = **Hiếm**; Đá Ngọc, vé triệu hồi, tinh hoa tiến hóa = **Sử Thi**; quặng Thần = **Thần**; vàng, sách thường, quặng thường, gỗ, vải = **Thường**. Đây là phân bậc trình bày, không đổi cơ chế hay nguồn nhận. Về sau, sách hoặc nguyên liệu có bậc riêng phải lấy bậc từ dữ liệu vật phẩm. Ô chi tiết lớn dùng đúng bậc ô nhỏ, kể cả dấu chọn.
   - **R4 — Tướng Mika = Huyền Thoại**, Mảnh Mika = Huyền Thoại, Vũ khí Thần = Thần. Nhân vật nguyên vẹn khác mảnh bằng tranh và hình dáng vật phẩm, không nâng lên Thần chỉ vì là tướng. Màn Triệu Hồi đã khóa: chỉ thay ảnh ba ô trong đúng phạm vi được chủ duyệt; giữ bố cục và thẻ lật.
   - **R5 — Đồng ý dùng chung ngôn ngữ và bộ art.** Mỗi nơi dùng cùng bậc; được xuất kích thước phù hợp, không ép co méo ô 341×319 vào mọi socket.

3. **Prompt MOCKUP — dùng `ref-bag-phone.png` làm ảnh chỉnh sửa chính, `ref-slots.png` để tham chiếu chất liệu:**

   ```text
   Edit ref-bag-phone.png into an approval mockup for Gemwoven's inventory rarity slots. Preserve the exact 941×1672 portrait composition, all Vietnamese text, item artwork, quantities, item positions, character, scenery, currency bars, navigation, buttons and detail panel layout. Change only the item-slot frames and their interior backgrounds, including the large selected-item slot in the detail panel.

   Match the existing hand-painted wood, aged brass, warm fantasy mobile RPG style. Use the original inventory-slot silhouette and visual footprint. Rarity must be readable mainly through colored frame inlays and matching small gemstones. Keep most of each frame warm brass and wood. Interior color is subdued, with a softly lit center and darker edges; preserve strong item readability.

   Apply these exact tiers:
   COMMON, original brown wooden slot: gold coins, ordinary books, ordinary ore, logs and cloth.
   RARE, blue accents and a muted blue interior: Hiro's portrait fragment.
   EPIC, purple accents and a muted violet interior: premium blue crystal currency, summon tickets, red evolution book, red evolution essence.
   LEGENDARY, amber-gold accents, a subdued amber interior and faint broad radial rays: Mika's fragment and Noct's fragment.
   DIVINE, crimson gemstone accents, richer engraved brass corner details, a dark crimson interior and restrained golden radial rays: the purple divine ore.

   The selected red evolution essence in the large detail-panel slot must use EPIC purple framing, despite the item's red artwork. Preserve its existing selection treatment and every item quantity plaque.

   Keep every slot aligned and exactly the same size as before. Do not recolor the items. Do not add rarity labels, UI elements, particles or animated-effect streaks. This is a static design-review mockup with restrained, clearly differentiated rarity art.
   ```

4. **Prompt ART — tham chiếu riêng ô `inventory-slot` trong `ref-slots.png`:**

   ```text
   Create one production UI asset sheet containing exactly FOUR empty inventory rarity slots for Gemwoven, a hand-painted wood-and-brass fantasy mobile RPG.

   Use the LEFTMOST inventory-slot in ref-slots.png as the exact structural reference. Ignore the other socket silhouettes and their separate nameplates. Match its rounded square shape, bevels, aged golden brass rim, dark wooden recessed interior, small diamond ornaments and restrained lower-left foliage.

   Arrange four complete slots in one horizontal row, left to right:
   1. RARE: blue frame inlays and blue gemstones; subdued deep-blue interior.
   2. EPIC: violet frame inlays and violet gemstones; subdued deep-violet interior.
   3. LEGENDARY: amber-gold inlays and gemstones; subdued warm amber interior with faint broad radial rays.
   4. DIVINE: crimson inlays and gemstones; dark crimson interior with restrained golden radial rays and slightly richer engraved brass corner ornaments.

   All four must have IDENTICAL outer dimensions, silhouette, inner opening, ornament anchor positions, viewing angle and lighting. Each slot must fit the same 341×319 target canvas without stretching. Keep the central item area empty and spacious. Rarity color belongs primarily on frame inlays and gemstones; the interior tint must remain dark and quiet enough for colorful item icons. Keep the brass warm and consistent across all four.

   Background: perfectly flat solid magenta #FF00FF. Leave generous clean magenta gutters between slots and around the sheet. Keep all painted pixels inside each slot's footprint, with crisp antialiased edges and no external glow, shadows, particles or floating sparkles. Avoid magenta in the slot artwork.

   No items, portraits, text, letters, numbers, rarity labels, quantity plaques or separate nameplates. No perspective tilt, cropping or overlapping. Preserve the reference's polished hand-painted material detail and readability at small mobile sizes.
   ```