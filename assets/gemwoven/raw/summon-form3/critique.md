**Chốt bệ trưng bày bên phải vòm.** Giữ nguyên toàn bộ nền, hai pha lê và hoạt cảnh. Phần tử phải đọc như **xem trước hình thái tiến hóa**, tách khỏi phần thưởng triệu hồi.

1. **Vị trí và trình bày**

   Rect sân khấu: **[738,430,188,300]** — khoảng **78×124 px** trên điện thoại 390×844.

   - Trên: “Hình thái 3”.
   - Giữa: poster Mika đã khóa, đủ người, vũ khí và đuôi; dùng `fitBody` rồi thu nhỏ đồng đều cả khung, không cắt tranh.
   - Dưới: bệ đá thấp và `kit-plaque` ghi “Mở tại 6★”.
   - Khung vòm gỗ, viền đồng mảnh, ít chi tiết; tối nhẹ **chỉ trong lòng khung**, không phủ tối hoặc làm mờ cảnh.
   - Giữ Mika đủ màu. **Bỏ dãy sáu sao, bóng nhân vật và biểu tượng khóa**: sao dễ thành độ hiếm kết quả quay; bóng che mất tranh; khóa có thể sai với tài khoản đã mở.
   - Chạm cả phần tử → `forms:gallery` của Mika. Không nối sáng, mũi tên hay hiệu ứng giữa bệ và pha lê/nút quay.

2. **Nhãn tối thiểu**

   Hai dòng luôn hiện: **“Hình thái 3”** và **“Mở tại 6★”**. Chữ khoảng **28 đơn vị sân khấu**, tương đương 11,6 px trên điện thoại; không thêm chú thích li ti.

   Tên truy cập: **“Xem hình thái 3 của Mika, mở tại 6 sao. Triệu hồi nhận tướng 1 sao, hình thái 1.”** Không dùng chữ “nhận”, “trúng” hoặc “phần thưởng” trên bệ.

3. **Prompt mockup — tiếng Anh**

   ```text
   Edit target: phone-before.png, the existing Gemwoven summon screen.
   Exact character insert: Mika's approved form-3 showcase/poster.png.
   Context reference only: studio-before.png.

   Add exactly one small, static evolution-preview display at stage rect
   [738,430,188,300] on the 941×1672 game stage. Coordinates exclude
   screenshot letterboxing. Keep the original screenshot dimensions.

   Create a restrained hand-painted wooden arch with thin aged-brass trim,
   a shallow stone pedestal, and a softly darkened interior confined to
   this new display. Composite the supplied Mika artwork unchanged:
   preserve her identity, pose, colors, complete weapon and tails.
   Scale the entire character uniformly; do not crop or redraw her.

   Top label, verbatim: “Hình thái 3”.
   Bottom wooden plaque label, verbatim: “Mở tại 6★”.
   Both labels must remain readable at a 390×844 phone viewport.

   This is an evolution-gallery preview, subordinate to the central
   crystals. Summoning always grants a 1-star, form-1 hero.
   No star row, lock icon, reward badge, price, glow, particles, arrows
   or visual connection to the summon controls.

   Change only this new display area. Preserve the background, both
   crystals and their existing character art, banner, chest, NPC,
   buttons, reward board, navigation, lighting and layout exactly.
   Do not blur, relight or repaint the existing scene.
   ```

4. **Prompt khung — cần vẽ mới, tái dùng plaque hiện có**

   ```text
   Create one isolated hand-painted fantasy RPG display frame matching
   Gemwoven's existing warm wooden and aged-brass UI.

   A narrow upright wooden arch, thin restrained brass edging, a shallow
   stone pedestal, and a clear open center for a separately composited
   full-body character. Design for a final 188×300 stage-unit footprint.
   Reserve space above the opening for an HTML title and below the
   pedestal for an existing wooden plaque; do not paint either label.

   Clean HD painted game art, crisp readable silhouette at small phone
   size, modest ornament, soft static material shading, straight-on view.

   Use a completely uniform solid #FF00FF background, including the open
   center, for later chroma-key removal. No magenta in the object.
   Keep all parts inside the canvas with generous extraction padding.
   No character, lettering, numbers, stars, lock, crystals, glow,
   particles, scenery, backdrop panel or cast shadow on the magenta.
   ```