(1) **Hiện tại: điện thoại 6,5/10; Studio 7/10.** Tranh đẹp, nhưng các lớp giao diện chưa gọn và rõ như bốn màn đã duyệt. Năm lỗi chính:

- Bảng kỳ hai dòng chen sát tiêu đề; chữ nhỏ và thông tin lặp với hình Mika.
- Cờ khẩu hiệu dài, khó đọc, chiếm khoảng thoáng của vòm.
- Hai nút nhiều chữ; hành động và giá chưa tách rõ, đặc biệt khi giá đổi sang Đá Ngọc.
- Nhãn giấy “Mảnh Tướng” che rương nhưng không cho biết tiến độ ghép.
- Cụm dưới thành nhiều bảng tối nối nhau; thông tin kỳ sau cạnh tranh với phần thưởng, còn bảo đảm và chi tiết bị tách rời.

(2) **Chốt P1–P6:**

- **P1 — Đồng ý, chỉnh cách treo.** Biển gỗ đỏ trầm, viền đồng mảnh, một dòng “Khế Ước Hỏa Hồ”. Móc vào **đoạn trên của hai xích**; treo dưới đầu xích y≈390 sẽ chạm pha lê Mika. Bỏ con dấu “Kỳ này”. Chạm mở chi tiết kỳ/tỷ lệ.
- **P2 — Chọn bỏ cờ.** Biểu tượng hồ ly sẽ lặp hình Mika, thêm một điểm sáng cạnh pha lê mà không cần thiết.
- **P3 — Đồng ý cấu trúc, chưa cần vẽ lại toàn bộ nút.** Tái dùng mặt `button-blue/gold`, thêm đế giá lõm vẽ riêng. Mặt chỉ ghi **×1 / ×10**; dưới là biểu tượng tiền + số. Huy hiệu số vé đặt **giữa trục màn, phía trên hai nút**; khe giữa hai nút không đủ rộng.
- **P4 — Đồng ý.** Huy hiệu mảnh Mika + **0/80**, đặt trên mặt rương. Không thêm chữ “Mảnh Tướng”.
- **P5 — Đồng ý, giữ nhãn ngắn.** Ba ảnh lớn kèm “Tướng / Mảnh / Thần”; giữ ảnh và màu bậc hiện có. Tag “Kỳ sau: ?” chạm được để giải thích chưa công bố.
- **P6 — Đồng ý gộp bảng.** Dòng cuối: “Bảo đảm tướng hiếm” + thanh **0/100**. **Bỏ chân dung Mika ở cuối thanh**: dễ khiến người chơi hiểu bảo đảm riêng Mika. Dùng nút tròn **i** mở popup hiện có.

**Chữ mới tối thiểu 34 px khung ≈14,1 CSS px**; giá nên 40 px ≈16,6 CSS px, ×1/×10 khoảng 54 px. Vùng chạm tối thiểu **106×106 px khung ≈44×44 CSS px**.

Các trạng thái cần có:

- Đủ vé: biểu tượng vé + **1/10**. Thiếu vé nhưng đủ ngọc: biểu tượng ngọc + **120/1.200**. Thiếu cả hai: giữ giá yêu cầu, số đỏ + khóa; popup giải thích thiếu tài nguyên, không chỉ dựa vào màu đỏ.
- Giữ thứ tự chọn tiền và popup xác nhận hiện có; không tự thêm cách trộn vé/ngọc.
- Có lịch: tag hai dòng **“Kỳ sau: Yuki” / “18/11”**; không thu nhỏ chữ. Chạm xem đầy đủ.
- Đã có Mika: thêm dấu ✓ nhỏ trên ô chân dung; **không cần chữ “Đã có”**, không làm xám ô. Popup ghi “Đã sở hữu” và giải thích kết quả trùng theo luật hiện có.
- Popup giữ đủ luật: bảo đảm 100 lượt, mang sang kỳ sau; tối đa 30 lượt không có mảnh; 80 mảnh ghép tướng. Tài khoản mới hiển thị đúng **0**, không dùng số tài khoản thử.

(3) **Bố cục cuối — `[x,y,rộng,cao]`, khung 941×1672:**

| Phần | Tọa độ |
|---|---|
| Biển “Khế Ước Hỏa Hồ” | `[268,294,405,68]` |
| Cờ dọc | Bỏ lớp cờ |
| Huy hiệu mảnh Mika, 0/80 | `[754,904,160,126]` |
| Huy hiệu số vé đang có | `[358,955,225,62]`; vùng chạm `[358,933,225,106]` |
| Nút ×1 | `[145,1043,310,140]` |
| Nút ×10 | `[486,1043,310,140]` |
| Bảng chung phần thưởng + bảo đảm | `[52,1194,837,254]` |
| Plaque “Phần Thưởng Hiếm” | `[78,1200,390,72]` |
| Tag kỳ sau | `[493,1198,276,80]` |
| Nút i | `[799,1208,64,64]`; vùng chạm `[778,1187,106,106]` |
| Ba socket phần thưởng | `[82,1280,112,112]`, `[350,1280,112,112]`, `[618,1280,112,112]` |
| Nhãn cạnh từng socket | x=`202/470/738`, y=`1314`, rộng `122`, cao `44` |
| “Bảo đảm tướng hiếm” | `[80,1398,350,42]` |
| Thanh bảo đảm, số ở giữa | `[450,1398,408,42]` |

Tiêu đề trên vòm giữ nguyên. Bố cục này tránh hai vùng pha lê, NPC, HUD y<150 và menu y>1460.

(4) **Chỉ cần vẽ mới ba nhóm mảnh**, xuất PNG trong suốt, không chữ; kích thước dưới đây ở mức 2×:

| Mảnh mới | Kích thước gợi ý |
|---|---|
| Biển kỳ gỗ đỏ trầm, đồng mảnh; hai điểm móc tại xích | `810×136` |
| Đế giá lõm cho hai nút, hợp mặt xanh/vàng hiện có | Mỗi bản `540×96` |
| Khung chung gỗ mật ong, đồng nhẹ; chừa khoảng cho header, phần thưởng và bảo đảm | `1674×508` |

Tái dùng `button-blue/gold`, `plaque`, `badge-leather`, `round/badge-brass`, `inventory-slot`, `progress/progress-fill`, biểu tượng vé/ngọc/mảnh Mika và ảnh phần thưởng hiện có. **Không vẽ lại nền, rương, NPC, pha lê hoặc hiệu ứng.** Chữ/số sản phẩm vẫn là lớp HTML.

(5) **Prompt image_gen tiếng Anh, dưới 260 từ:**

```text
OUTPUT
Portrait UI mockup, 941×1672; preserve the reference canvas ratio.

REFERENCES
summon-bg.png: immutable background. summon.png: preserve crystals/effects/NPC/HUD/menu placement; exclude outer letterboxing. studio-upgrade.png, studio-inventory.png, studio-shop.png, studio-forge.png: approved style. ref-kit.png: reusable components.

ART DIRECTION
Painted cozy fantasy, honey wood, parchment, restrained brass; crisp mobile readability. Red accents only on the contract sign. Overlay permitted UI only; preserve protected artwork exactly.

SCREEN STATE
Ticket icon + “1.000”; Mika fragments “0/80”; pity “0/100”; next banner unannounced.

VISUAL HIERARCHY
Coordinates are x,y,w,h. Preserve “Triệu Hồi” title. Remove vertical flag. Contract sign (268,294,405,68), attached to upper chain links: “Khế Ước Hỏa Hồ”. Blue summon button (145,1043,310,140): “×1”, recessed ticket-icon price “1”. Gold button (486,1043,310,140): “×10”, ticket-icon “10”. Balance badge (358,955,225,62). Chest fragment badge (754,904,160,126).
Unified reward/pity panel (52,1194,837,254): “Phần Thưởng Hiếm”; leather tag (493,1198,276,80) “Kỳ sau: ?”; information medallion (799,1208,64,64) “i”. Reward sockets at x=82/350/618, y=1280, size112; existing Mika portrait/fragment/divine weapon, labels “Tướng”, “Mảnh”, “Thần” beside them. Bottom row y=1398: “Bảo đảm tướng hiếm”, empty progress bar “0/100”.

TYPOGRAPHY
Exact Vietnamese diacritics; secondary text≥34px, prices40px, multipliers54px.

AVOID
Background repainting, moved characters/crystals, extra glow, CSS boxes, currency names, additional copy, full progress fill, Mika portrait on pity bar.
```