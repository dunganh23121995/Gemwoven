Đã đọc lại bản chốt. **Đồng ý kế hoạch; giữ nguyên màn và banner Triệu Hồi theo yêu cầu mới.** Cần khóa thêm:

- **Giữ diện mạo đã chọn:** nghi thức trình diễn hình thái mới mở; sau “Tiếp tục”, giữ lựa chọn diện mạo trước đó.
- **Thứ tự lớp:** màn Tướng → lớp tối → vòng phép/bệ → tướng → ánh sáng tiền cảnh → sao/chữ/nút. Ẩn bản tướng nền để không thấy hai Mika. Ánh sáng lộ hình phải nhường mặt và kiếm.
- **Sao:** 3→4★ chỉ sao thứ tư bật sáng; 5→6★ chỉ sao thứ sáu. Mỗi lần đúng một tiếng bell nhỏ.
- **Bỏ qua:** hủy các nhịp hình/âm còn chờ, hiện kết quả ngay; không phát dồn âm. Khôi phục nhạc nền khi kết thúc.
- **Giảm chuyển động:** dừng cả vòng nghỉ 24 khung; dùng ảnh tĩnh, cross-fade 0,6 giây và bảng kết quả.
- **Lưu thành công mới chạy cảnh.** Bảng kết quả và xem lại chỉ đọc dữ liệu đã mở, không thực hiện giao dịch.
- **Vòng phép tách khỏi glow:** vẽ nét rõ trên magenta; hào quang dùng asset sẵn. Cách này tránh viền hồng sau tách nền.

**Prompt mockup — tiếng Anh**

Dùng ảnh đính kèm làm tham chiếu màn/phong cách; thêm [tranh Mika hình thái 2 đã khóa](/D:/Project/Gemwoven/assets/heroes/forms/fire/form-2/showcase/poster.png) làm tham chiếu nhân vật bắt buộc. Ảnh màn hiện tại chỉ có hình thái 1, không đủ để khóa hình thái 2.

```text
Create a production-quality UI mockup for Gemwoven's form-unlock ceremony.

OUTPUT: Two portrait screens side by side, each 941×1672; total canvas 1882×1672, without a gutter, device frames or presentation captions.

REFERENCES:
Image 1: the supplied Heroes / Star Upgrade screen. Use it directly for the existing hall, layout, painted UI materials, typography and art style. Remove only the external letterboxing; preserve proportions.
Image 2: the approved Mika form-2 showcase artwork. Preserve her exact face, fox ears, orange hair, tail, red-and-black gold-trimmed armor, sword and pose. Composite this artwork rather than redesigning her.

BOTH SCREENS:
This is a full-screen overlay on the existing Heroes screen. Keep the hall and interface recognizable beneath a dark translucent scrim, without blur. Suppress the underlying hero and duplicate star row. Keep Mika's established head-based body scale and feet anchored to the existing pedestal. Match the reference's crisp hand-painted fantasy style, bronze-gold ornament, carved wood and warm parchment.

LEFT — FORM-2 REVEAL:
Show Mika clearly revealed, full body and entire sword visible. Place a bronze-gold elliptical magic circle beneath her feet, projected at 2:1 width to height. Add restrained warm golden rays, a halo behind her and sparse sparks. Keep her face and weapon unobscured.
Show exactly four foreground stars above her: three steady gold stars, the fourth newly igniting with a compact amber bloom.
Place a clearly readable illustrated kit button labelled “Bỏ qua” at the upper right, above all effects.
Use warm gold, never a white flash. Even at peak light, retain visible artwork beneath the veil; maximum veil opacity 85%.

RIGHT — RESULT, SAME CEREMONY:
Keep Mika visible above a compact lower result panel, with calm lighting and no active burst. Build the panel from illustrated parchment, a bronze-edged wooden plaque and a ribbon matching Image 1.
Display these exact Vietnamese texts with correct diacritics:
“Mở hình thái mới”
“★★★★”
“Hồ Diễm Kiếm Vệ”
“Tuyệt kỹ mới: Hồ Diễm Long Trảm”
“Tuyệt kỹ ×1,1”
One prominent illustrated button: “Tiếp tục”.
Keep the panel below her feet, with generous readable spacing.

No extra rewards, currencies, summon crystals, additional characters or additional action buttons. Leave the Summon navigation item unchanged. No flat modern cards or generic wireframe UI.
```

**Prompt vòng phép — tiếng Anh**

```text
Generate one standalone game VFX asset: a bronze-gold ritual magic circle for Gemwoven, matching the supplied screenshot's crisp hand-painted fantasy ornament and warm gilded materials.

Use the attached screenshot directly as the style reference.

Canvas: 1536×1024. One centered circle projected onto a horizontal ground plane, appearing as an ellipse with an exact 2:1 outer width-to-height ratio. Show the complete ellipse with generous padding. This is a ground marking seen obliquely, not an upright portal.

Design: delicate concentric bronze-gold bands, clean engraved geometric filigree and four evenly spaced gemstone emblems representing Fire, Ice, Wood and Lightning. Use small ruby-red, icy-blue, leaf-green and violet accents. Project all ornament consistently onto the same ground plane. Keep a sparse open center so a hero can stand above it without visual clutter.

BACKGROUND: perfectly uniform, opaque solid magenta #FF00FF. All open spaces, including the center and gaps between lines, must show the same exact magenta. No transparency in this raw image.

Render crisp, well-defined painted edges and restrained metallic highlights. No baked bloom, soft glow, fog, particles, cast shadow, floor, stone disc, pedestal, character, text, letters, numbers or watermark. No magenta or pink details inside the asset itself. One static asset, not an animation sheet.
```