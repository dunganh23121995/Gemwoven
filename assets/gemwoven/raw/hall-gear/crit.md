**Chốt hướng: bỏ hai cờ chức năng, thay bằng nút huy chương; giữ hai cột trang bị, khoanh riêng vùng hào quang và đưa Báu vật lên trên bệ phải.** Chất liệu hiện tại hợp Gemwoven, nhưng nửa trên chưa đạt mức hoàn thiện của Lò Rèn và Túi Đồ.

**A. Chấm hiện trạng**

Điểm chỉ tính phần phía trên dải tướng.

| Trường hợp | Điểm | Nhận xét chính |
|---|---:|---|
| Điện thoại — Hiro | **7/10** | Tướng rõ, bố cục tương đối thoáng; cờ thiếu tính nút, cụm Giày/Kỹ Năng còn dính nhau. |
| Điện thoại — Mika + bản thử | **4,5/10** | Lửa che tab và trang bị; Báu vật tranh chỗ với bệ phải. |
| Studio — Mika + bản thử | **4/10** | Thu nhỏ khiến chữ và chức năng càng khó phân biệt; hình tướng lấn át toàn bộ điều khiển. |
| Studio — Hiro | **6,5/10** | Không bị lửa phá bố cục, nhưng nhãn nhỏ và các nút phụ chưa đủ rõ. |

Lỗi theo mức nặng:

1. **Chặn duyệt:** hào quang che “Cấp”, phủ ô trang bị và cắt nhãn “Áo”; người chơi khó nhận ra đủ sáu ô.
2. **Chặn duyệt:** Báu vật chiếm vùng tướng chờ phải; Kỹ Năng chồng Giày, Xuất chiến chen sát bên dưới.
3. **Nặng:** hai cờ có diện tích lớn nhưng điểm nhấn nhỏ, giống trang trí; chức năng Lộ trình/Chỉ số khó khám phá.
4. **Nặng:** `+12 Vũ khí` gộp hai thông tin vào một dòng, tràn chữ; thiếu viền phẩm nên món quý không nổi bật.
5. **Vừa:** tên, sao, bảo bối và hành động chưa thành nhóm rõ ràng; độ đọc giảm mạnh trong Studio.

**B. Hai lá cờ**

Chọn **hướng 2: huy chương đồng có icon lớn và nhãn trên tấm gỗ nhỏ**, đặt hai bên tiêu đề.

- **Lộ trình:** bản đồ cuộn với la bàn.
- **Chỉ số:** bảng chỉ số với kiếm/khiên; tránh cán cân vì dễ gợi giao dịch.
- Cả icon và nhãn là **một nút**, có trạng thái nhấn bằng art.
- Hai nhãn cùng cỡ chữ, cùng kích thước nút.

Cờ treo vẫn có thể sửa, nhưng tiếp tục chiếm nhiều chiều cao quanh sáu ô trang bị. Huy chương hợp bộ kit và tạo chức năng rõ hơn.

Vùng tường sau khi bỏ cờ để lộ gỗ, đá và ánh sáng sảnh; **giữ nguyên băng rôn nguyên tố**. Không thêm bảng hay nút để lấp khoảng trống. Khi bật bản thử, phần tường phải phía trên bệ dành cho Báu vật.

**C. Bố cục đề xuất**

Tất cả tọa độ là **`[x, y, w, h]` trong sân khấu 941×1672**, tính cả nhãn và huy hiệu. HUD, dải tướng và toàn bộ phần dưới giữ nguyên.

| Phần tử | Tọa độ mới | Cách thể hiện |
|---|---|---|
| Tiêu đề Tướng | `[246,104,449,128]` | Bảng gỗ gọn hơn, giữ chất liệu hiện tại. |
| Hồ sơ ⓘ | `[607,128,80,80]` | Gắn trên mép phải bảng tiêu đề. |
| Lộ trình | `[36,132,164,132]` | Huy chương + nhãn. |
| Chỉ số | `[741,132,164,132]` | Huy chương + nhãn. |
| Tab Cấp | `[226,240,160,60]` | Tab chọn sáng vàng, chữ rõ. |
| Tab Tăng Sao | `[390,240,160,60]` | Cùng hình học với Cấp. |
| Tab Tiến Hóa | `[554,240,160,60]` | Cùng hình học với Cấp. |
| Tên/hình thái | `[300,304,342,44]` | Rút thành **“Mika · 3/3 ›”**; Hiro là “Hiro · 1/3 ›”. |
| Sao | `[365,352,212,32]` | Đặt ngay dưới tên, không chen ở chân bệ. |
| Thân tướng | `[321,390,300,320]` | Giữ tỷ lệ, không kéo giãn; thu khoảng 7,5% so với khung hiện tại. |
| Mũ | `[176,366,128,112]` | Cột trái. |
| Áo | `[176,484,128,112]` | Cột trái. |
| Vũ khí | `[176,602,128,112]` | Cột trái. |
| Kính | `[637,366,128,112]` | Cột phải. |
| Quần | `[637,484,128,112]` | Cột phải. |
| Giày | `[637,602,128,112]` | Cột phải. |
| Bệ chờ trái | `[20,518,140,200]` | Giữ art và thao tác chạm chọn; dịch ra ngoài và xuống nhẹ. |
| Bệ chờ phải | `[781,518,140,200]` | Giữ art và thao tác chạm chọn. |
| Nhãn Báu vật | `[781,270,140,36]` | Chỉ hiện trong bản thử. |
| Báu vật 1 | `[795,310,112,96]` | Ổ vẽ, biểu tượng bùa xanh. |
| Báu vật 2 | `[795,414,112,96]` | Ổ vẽ tối, khóa rõ ở giữa. |
| Kỹ Năng | `[176,734,212,72]` | Nút riêng dưới cột trái. |
| Bảo bối | `[419,718,104,100]` | Giữa sân khấu; icon và “Dạng 1/5”. |
| Xuất chiến | `[553,734,212,72]` | Nút vàng dưới cột phải; Hiro giữ trạng thái “Đang xuất chiến”. |

Báu vật bật/tắt **không làm các phần khác dịch chuyển**. Khóa ô thứ hai theo **Tiến hóa 3**, không suy ra mở khóa từ Hình thái 3.

**Cấu trúc mỗi ô trang bị**

Trong ô `128×112`, tọa độ sau tính tương đối với góc ô:

| Thành phần | Vùng |
|---|---|
| Hình đồ hoặc silhouette trống | `[6,8,66,66]` |
| Huy hiệu cấp | `[76,8,48,32]` |
| Nhãn tên ô | `[4,80,120,32]` |

- Nhãn chỉ ghi **Mũ / Áo / Vũ khí / Kính / Quần / Giày**, cỡ khoảng **30–32 đơn vị**.
- Huy hiệu riêng ghi **+3, +5, +12, +0**, cỡ **28**; không ghép vào tên ô.
- Ô trống: da nâu, silhouette chìm, không có huy hiệu.
- Ô có đồ: dùng hình `gear-<phẩm>-<ô>` và **viền phẩm được vẽ**, theo màu hiện có: Tốt xanh lá, Hiếm xanh lam, Sử Thi tím, Huyền Thoại vàng cam, Thần đỏ.
- Phẩm còn thể hiện qua hình đồ và chi tiết viền; không chỉ dựa vào màu.

**Lớp và hào quang**

Thứ tự từ dưới lên:

`nền/băng rôn → bệ và tướng chờ → FX sau → thân tướng → FX trước → toàn bộ art UI → chữ/số`.

**Cần mask riêng FX**, với biên ngoài `[310,386,321,332]`, chuyển mềm khoảng 12 đơn vị ở mép và trong suốt hoàn toàn bên ngoài. Áp dụng cho cả lửa sau, lửa trước, hạt và ánh sáng phụ.

Thân, đuôi, gậy và trang phục **không nằm trong mask FX**. Vòng lửa ngoài bị giới hạn có chủ đích; không cho bay lên tab hoặc tràn sang trang bị. FX của tướng chờ cũng giới hạn trong vùng bệ tương ứng. Các lớp FX không nhận thao tác chạm.

Các khung trên không giao nhau về hình học; vẫn cần đối chiếu mockup và render điện thoại/Studio trước khi chấm đạt ≥8/10.

**D. Mảnh cần vẽ mới**

- **Icon Lộ trình:** bản đồ cuộn và la bàn đồng, nét lớn, không chữ, dùng trong `kit-round`.
- **Icon Chỉ số:** bảng da với kiếm/khiên và ba vạch lớn, không chữ, cùng nét với icon Lộ trình.
- **Một bộ overlay viền trang bị, 5 biến thể phẩm:** cùng khuôn ổ `128×112`, giữ lòng ổ và chân nhãn thoáng, màu phẩm nằm trong chất liệu vẽ, không chữ/số.

Còn lại dùng kit sẵn: `kit-round`, `kit-plaque`, `kit-badge-leather`, `kit-btn-gold`, `inventory-slot`, `kit-socket`/`forge-socket`, hình gear và khóa. Không cần vẽ lại tướng, bệ, hiệu ứng hay toàn bộ nền.

**E. Prompt image_gen**

Dùng ảnh 2 làm ảnh nền cần chỉnh; ảnh 3 làm chuẩn trang bị; ảnh 7–8 làm chuẩn chất liệu. Chỉ tạo **một mockup hoàn chỉnh**.

```text
Use case: ui-mockup.

Create ONE polished, full-screen layout approval mockup for Gemwoven,
a portrait hand-painted chibi fantasy match-3 RPG.

OUTPUT AND COORDINATES
Use a portrait 2:3 canvas. Center the complete game stage at its exact
941:1672 aspect ratio, fitting the canvas height, with equal narrow
muted side gutters. Do not crop or stretch the stage.
All coordinates below are [x,y,width,height] relative to that inner
941×1672 stage, not the outer canvas. Do not draw coordinates or guides.

REFERENCE ROLES
Image 2: primary edit target for the existing hall, HUD, lower upgrade
panel, hero roster and bottom navigation.
Image 3: equipment state and item appearance.
Images 7 and 8: approved craftsmanship reference for wood, leather,
brass, parchment, painted buttons and item sockets.
Images 4 and 6: compact Studio viewing context; all controls must
remain visually distinct when the game is reduced.

PRESERVE
Preserve the existing warm timber-and-stone hero hall, lighting,
elemental wall pennants, and both selectable waiting-hero pedestals.
Preserve the HUD at y=0–100.
Preserve the hero roster and All button at their current positions.
Everything from y=946 to the bottom must be copied unchanged from
Image 2: level panel, materials, upgrade button, stat ribbon and
bottom navigation. Composite that original lower region rather than
reinterpreting it.

HERO IDENTITY
Reuse the locked Mika form-3 character artwork from the reference:
the same red-haired nine-tailed fire fox heroine, red-and-white dress,
crescent staff, face, pose, tails and costume.
Do not redesign or repaint the character.
Place her complete character silhouette inside [321,390,300,320],
uniformly scaled, with no cropped staff, ears, feet or tails.

Retain her original fire aura artwork. Confine all aura layers,
embers and glow to [310,386,321,332], with a soft inward feather
at the boundary. Keep body artwork outside this FX-only mask.
Fire may cross in front of the dress inside that region, but must
never cover tabs, labels, equipment, relics or action buttons.

UPPER LAYOUT
Title plaque "Tướng": [246,104,449,128].
Profile information medallion: [607,128,80,80].

Remove only the two large interactive cloth flags.
Replace them with matching illustrated brass medallion buttons,
each with a large icon above a short painted label plaque:
"Lộ trình" at [36,132,164,132], using a map-and-compass icon;
"Chỉ số" at [741,132,164,132], using a stat tablet and sword/shield icon.
Reveal the original hall wall behind the removed flags.
Keep the approved elemental wall pennants.

Three clearly separated painted tabs:
"Cấp" [226,240,160,60], selected;
"Tăng Sao" [390,240,160,60];
"Tiến Hóa" [554,240,160,60].

Name plaque "Mika · 3/3 ›": [300,304,342,44].
Keep the reference star count in a centered row: [365,352,212,32].

SIX EQUIPMENT CELLS
Each complete cell is 128×112, including its footer label and badge.
Left column:
"Mũ" [176,366,128,112];
"Áo" [176,484,128,112];
"Vũ khí" [176,602,128,112].
Right column:
"Kính" [637,366,128,112];
"Quần" [637,484,128,112];
"Giày" [637,602,128,112].

Use illustrated leather-and-brass sockets, with a distinct painted
rarity rim on occupied cells.
Within each cell, reserve separate areas:
item artwork [6,8,66,66],
small leather enhancement badge [76,8,48,32],
slot-name footer [4,80,120,32].
These local coordinates are relative to each cell.
Do not combine enhancement numbers with slot names.

Equipment state:
Mũ: Rare, blue rim, reference helmet, badge "+3".
Áo: Epic, purple rim, reference armor, badge "+5".
Vũ khí: Legendary, amber-gold rim, reference weapon, badge "+12".
Giày: Good, green rim, reference boots, badge "+0".
Kính and Quần: empty neutral sockets with faint slot silhouettes,
no enhancement badges.

WAITING HEROES AND TRIAL RELICS
Reuse the same waiting-hero artwork and pedestal designs.
Left pedestal group: [20,518,140,200].
Right pedestal group: [781,518,140,200].
Their silhouettes and any FX must stay inside their own allocated
areas and clear of equipment.

Trial relic feature is enabled.
Label "Báu vật": [781,270,140,36].
First relic socket: [795,310,112,96], blue talisman.
Second relic socket: [795,414,112,96], dark with a clear painted lock.
Both relic sockets sit ABOVE the right waiting pedestal.
The second socket remains locked in this mockup.

BOTTOM OF HERO DISPLAY
Painted "Kỹ Năng" button: [176,734,212,72].
Central companion/artifact medallion with the reference red icon
and "Dạng 1/5": [419,718,104,100].
Gold "Xuất chiến" button: [553,734,212,72].
Keep these three controls separate from each other and from boots.

VISUAL HIERARCHY AND MATERIALS
Match the approved Forge and Inventory screens:
warm painted wood grain, aged brass, dark leather socket interiors,
restrained foliage and readable cream lettering.
All frames, buttons, plaques, badges and icons must look illustrated.
No flat CSS-style cards, generic rounded rectangles or vector UI.

Render Vietnamese labels with correct diacritics.
Use approximately 30–32 logical units for short functional labels
and 28 for enhancement numerals. Keep text clear of item artwork.
Treat labels and numbers as clean overlay typography; production
art assets will be textless.

Layer every UI frame and label above all hero aura layers.
Keep visible breathing room around each control.
Retain the purple trial notice in the reference's outer margin,
outside the active game stage.

ONE complete finished screen, no alternatives, no annotations,
no device frame, no arrows and no extra controls.
```