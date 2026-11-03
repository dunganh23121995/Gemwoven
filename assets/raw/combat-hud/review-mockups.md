**1. Điểm và quyết định**

- **Phone: 8/10.** Duyệt hướng thiết kế; cần sửa tỷ lệ chiều cao, huy chương điểm và cách thể hiện tuyệt kỹ.
- **Desktop: 8,5/10.** Duyệt bố cục hai cột; cần tăng bàn cờ và thay hình trong huy chương tuyệt kỹ.

Cả hai đã gần Lò Rèn về gỗ, da, đồng và giấy da. Những chỉnh sửa dưới đây là điều kiện trước khi build.

**2. Giữ và sửa**

| Chi tiết | Chốt trước khi build |
|---|---|
| Ngôn ngữ hình ảnh | Giữ khung gỗ, góc đồng, da khâu và giấy da; giảm độ dày trang trí trên phone. |
| Header | Giữ **Về**, **Ải 1**, một bánh răng. Âm thanh, hiệu ứng và trợ giúp nằm trong bảng cài đặt. |
| Gợi ý | Phone đổi **“?” thành bóng đèn**, giống desktop. Chạm mở gợi ý và chú giải gem; bỏ câu hướng dẫn thường trực. |
| Điểm hành trình | Phone đặt **huy chương + số ngay bên phải “Ải 1”** trên header. Desktop giữ vị trí cạnh tên ải. |
| HP và năng lượng | Hiện **HP hiện tại/tối đa**, chữ nhỏ tương phản tốt ngay trên thanh. Năng lượng dùng tia chớp và màu hổ phách thống nhất. |
| Tuyệt kỹ | Thay toàn bộ chân dung/vũ khí bằng **biểu tượng nguyên tố chung**. Vòng lấp theo năng lượng; đạt 100 thì lóe sáng và tự thi triển, sau đó cập nhật theo năng lượng thực tế. Chạm chỉ mở ghi chú: **“Tự thi triển khi đủ 100 năng lượng.”** |
| Kích thước huy chương | Phone khoảng **64–72 px**, cố định trong dải giữa chiến trường và bàn cờ. Thêm nhãn nhỏ **“Tự động”** để tránh hiểu là nút tung chiêu. |
| Biến Thân | Chừa ô riêng ở **góc dưới trái bên trong chiến trường**, vùng chạm tối thiểu 44 px; không bị huy chương, khung hoặc FX che thao tác. |
| Phone 390×844 | Mockup hiện khá dài. Thu mái/header, dải tuyệt kỹ và bỏ khoảng sàn trang trí cuối; giữ bàn cờ vuông, lòng bàn khoảng **352 px**, ô khoảng **44 px**. Toàn bộ thao tác chính phải vừa màn hình. |
| Desktop 1920×911 | Giữ hai cột; tăng lòng bàn cờ lên khoảng **600–620 px**, ô 75–77,5 px. Thu khoảng da trống quanh tuyệt kỹ để vừa chiều cao. |
| Art chiến đấu | Dùng nguyên hero, foe, FX, gem và nền hiện có; không cắt nhân vật từ mockup hoặc vẽ lại để giống mockup. |

**3. Sprite cần chuẩn bị**

Đã kiểm tra UI kit hiện có. Mỗi thành phần dưới đây là **sprite riêng**, chữ Việt đặt bằng HTML.

| Nhóm | Tái sử dụng / vẽ mới |
|---|---|
| Về, Biến Thân, bảng tên | Dùng `btn-gold`, `badge-leather`/`plaque`; **vẽ mới mũi tên lùi**. |
| Nhãn ải, lượt bạn | Dùng `tab`, `ribbon-info`; giữ vùng giữa trống cho chữ. |
| Cài đặt, gợi ý, điểm | Dùng `round`, `icon-emblem-gear`, `medal`; **vẽ mới icon bóng đèn**. |
| HP/năng lượng | Dùng `progress` + `progress-fill` xanh; **vẽ mới đầu tim, đầu tia chớp và fill hổ phách khớp lòng thanh**. |
| Kết cấu HUD — **sheet A** | **Mới:** thanh gỗ header, cạnh khung ngang, cạnh khung dọc, tấm da dải hành động. |
| Khung và bàn — **sheet B** | **Mới:** bốn góc đồng có gỗ, nền da bàn cờ, một ô xanh cổ vịt lõm. |
| Chi tiết nhỏ — **sheet C** | **Mới:** mũi tên, đầu tim, đầu tia chớp, bóng đèn, fill hổ phách. |
| Tuyệt kỹ — **sheet D + E** | **Mới:** khung đồng, đĩa nền, vòng năng lượng và quầng sáng tách lớp; sáu emblem lửa/băng/đất/sét/bóng tối/trung tính. |
| Bảng cài đặt và ghi chú | Dùng `parchment`, `tab`, `toggle-*`, `slider-*`, `round` cùng icon âm thanh/hiệu ứng hiện có. **Không cần sheet mới.** |

Khung và panel dùng các đoạn co giãn/9-slice; không kéo méo góc đồng. Giữ raw sheet và prompt trong repository.

**4. Prompt cho từng sheet**

Khi chạy, đính kèm **Forge làm tham chiếu phong cách** và **UI-kit làm tham chiếu vật liệu**. Mỗi sheet dưới đây dùng nền magenta để tách thành PNG riêng.

**A — Kết cấu HUD**

```text
Create a production sprite sheet for Gemwoven's combat HUD. Match the attached approved Forge and UI-kit references: polished hand-painted fantasy game art, warm carved wood, aged brass, stitched brown leather, soft upper-left highlights. Front view, orthographic, no perspective.

Use four separate horizontal rows: a plain wooden header rail; a horizontal wooden frame rail; a vertical wooden frame rail lying vertically in its own row; a wide stitched leather action panel with a thin wooden rim. Keep straight stretchable middle sections and undecorated text areas. No text, symbols, characters, scenery or foliage.

Solid uniform #FF00FF background, including all empty areas. Separate every sprite with generous magenta gutters; nothing touching or cropped.
```

**B — Góc khung và bàn cờ**

```text
Create a 2-column by 3-row sheet of six separate UI sprites. Match the attached Forge and UI-kit: hand-painted warm wood, aged brass rivets, brown stitched leather, soft upper-left lighting, front orthographic view.

Reading order: top-left frame corner, top-right corner, bottom-left corner, bottom-right corner, a square leather board backing with a narrow brass rim, one square recessed dark-teal gem cell with softly rounded corners. Corners must connect cleanly to straight wooden rails. The backing needs a quiet stretchable center. The cell must remain dark enough for existing colorful gems.

No gems, text, characters or scenery. Flat #FF00FF background and empty cutouts; generous gutters and padding, no clipped edges.
```

**C — Chi tiết thanh và nút**

```text
Create a 2-column by 3-row sheet matching the attached Forge/UI-kit's hand-painted fantasy materials and soft upper-left lighting.

Reading order: a brass left arrow; a red enamel heart in a small brass gauge end-cap; an amber lightning spark in a matching gauge end-cap; a brass lightbulb icon; a long horizontal amber energy fill matching the attached UI-kit green progress fill's proportions; leave the sixth slot empty. Icons and end-caps are separate sprites, not attached to buttons or bars. Keep the amber fill free of a frame.

Front orthographic view, crisp readable silhouettes at small sizes. No text or numerals. Uniform #FF00FF background, generous gutters, no cropped edges or magenta-colored details.
```

**D — Các lớp huy chương tuyệt kỹ**

```text
Create a 2x2 sheet of four separate, concentric UI layers for an AUTOMATIC ultimate energy indicator. Match the attached Forge/UI-kit's hand-painted aged brass and soft upper-left lighting.

Reading order: an open-center brass circular frame; a dark leather circular inset; a thin complete luminous gold energy ring; an isolated full-charge golden halo with restrained sparks. All layers share the exact same center and nominal outer diameter. The energy ring must be uniform and suitable for runtime radial clipping. Keep the frame visually readable without glow.

No portrait, weapon, element icon, text, numerals or play-button symbols. Solid #FF00FF background and empty centers. Keep all glow and sparks contained within each cell, with generous padding.
```

**E — Sáu biểu tượng nguyên tố**

```text
Create a 2-column by 3-row sheet of six standalone elemental emblems for Gemwoven's ultimate indicator. Match the attached Forge/UI-kit's polished hand-painted enamel and brass style, front orthographic view, soft upper-left highlights.

Reading order: orange-red flame; cyan ice crystal; green-and-ochre rock; amber lightning bolt; deep indigo shadow crescent with a dark core; ivory neutral four-point star. Use equally bold silhouettes and identical visual scale, readable at 32 pixels. These are generic elemental symbols shared by all heroes.

No characters, faces, weapons, circular frames, text or numbers. Uniform solid #FF00FF background; avoid magenta in the artwork. Each emblem centered with generous padding, no overlap or cropped edges.
```