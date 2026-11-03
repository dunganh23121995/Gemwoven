1. **Hiện trạng: 5/10.**

   Nền, nhân vật và chất liệu UI hợp bộ đã duyệt; riêng cây vẫn giống các biểu tượng đặt tạm:

   - Hình thoi không thể hiện tiến trình; đường nối quá mảnh, chìm vào vỏ cây.
   - Năm ổ khóa trang trí khiến người chơi tưởng còn nhiều kỹ năng thật.
   - Các ô nền kem quanh biểu tượng làm cây rời khỏi thân cây.
   - Chưa phân biệt rõ **đang chọn**, **nâng được**, **chưa học**, **chưa đủ điều kiện**.
   - Bảng chi tiết đủ thông tin nhưng chữ và các dải số đang cạnh tranh với hình.

   Dời lên 110px chỉ đổi vị trí, chưa giải quyết cấu trúc này.

2. **Phản biện sáu đề xuất của Claude.**

   1. **Đồng ý cây đi từ dưới lên:** Chủ Động → Bị Động → Biến Dị → Chân Thân. Dùng một cành gỗ uốn so le, có lá và đai đồng. Tuy nhiên, đây là **thứ tự các mốc mở**, không phải quan hệ bắt buộc nâng nhánh trước. Không vẽ mũi tên nối hoặc chuỗi “hoàn thành”.
   2. **Đồng ý khung vẽ theo trạng thái**, nhưng tách trạng thái nền khỏi trạng thái chọn:
      - Đã học: vòng đồng, hình đủ màu.
      - Đủ điều kiện nhưng cấp 0: vòng đồng, chồi lá nhỏ; chạm hiện **Học**.
      - Khóa: vòng gỗ đá tối, hình vẫn nhận ra được; ổ khóa nhỏ ở mép dưới.
      - Đang chọn: thêm vòng vàng kép và dấu lá cố định. Không dùng cùng hiệu ứng với “kế tiếp”.
   3. **Đồng ý bảng cấp bằng gỗ.** Đã học chỉ hiện `4/10`; khóa hiện hai dòng `Cấp 100` / `· TH2`. Giải nghĩa “tiến hóa” trong bảng chi tiết sau khi chạm.
   4. **Đồng ý một gợi ý kế tiếp duy nhất.** Ưu tiên kỹ năng vừa đủ điều kiện nhưng chưa học, sau đó kỹ năng nâng được có giá thấp nhất. Phải đủ **mọi** nguyên liệu; không đủ thì không phát sáng. Với ảnh này: Bị Động 2/10, giá kế tiếp 5.400 vàng + 3 sách. Dùng chồi lá chỉ vào nút và nhịp sáng nhẹ khoảng 2,5 giây.
   5. **Đồng ý bỏ năm ổ khóa.** Thay bằng một nụ ngủ nhỏ ở nhánh phụ trên cao, ghi **Sắp ra mắt**. Không nối nó thành mốc thứ năm của đường tiến trình.
   6. **Đồng ý chỉnh bảng chi tiết**, giữ giấy kem và bổ sung mép gỗ, khay nguyên liệu như Lò Rèn. Rút tiêu đề thành “Nguyên liệu”, “Cấp kế”; không lặp lại cả câu mô tả ở cột hiệu quả.

   **Bổ sung:** nút cây rộng 144px ≈ 60px trên điện thoại 390px; vùng chạm tối thiểu 108×108px logic ≈ 45×45px. Chữ phụ khoảng 32px logic; mô tả được xuống tối đa hai dòng. Chạm một lần cập nhật bảng dưới, không mở thêm hộp xác nhận. Khi giảm chuyển động, giữ dấu lá nhưng dừng nhịp sáng. Mọi điều kiện và giá lấy từ `progression.js`.

3. **Bố cục đề xuất — tọa độ logic 941×1672.**

   Quy ước `[x, y, rộng, cao]`; tọa độ tính từ góc trái trên. Nút cây gồm vòng 144×144, biểu tượng 108×108 đặt giữa.

   | Phần tử | Hộp / vị trí |
   |---|---|
   | Tiêu đề “Con Đường Kỹ Năng” | Giữ `[535,147,359,113]` |
   | Toàn bộ tranh cành và trang trí | `[435,270,459,624]`, kết thúc y=894 |
   | **Chủ Động**, gốc cây, đang chọn | Vòng `[553,710,144,144]`, tâm **625,782** |
   | Bảng `4/10` | `[553,850,144,44]` |
   | **Bị Động**, gợi ý kế tiếp | Vòng `[726,559,144,144]`, tâm **798,631** |
   | Bảng `2/10` | `[726,699,144,44]` |
   | Chồi lá chỉ vào Bị Động | `[860,574,32,44]` |
   | **Biến Dị**, khóa | Vòng `[538,405,144,144]`, tâm **610,477** |
   | Thẻ `Cấp 100` / `· TH2` | `[514,545,192,70]` |
   | **Chân Thân**, khóa | Vòng `[726,270,144,144]`, tâm **798,342** |
   | Thẻ `Cấp 180` / `· TH3` | `[702,410,192,70]` |
   | Nụ ngủ trên nhánh phụ | `[486,270,112,90]` |
   | Ruy băng “Sắp ra mắt” | `[435,354,216,44]` |

   Cành đi qua bốn tâm **(625,782) → (798,631) → (610,477) → (798,342)**, cong mềm, bề ngang khoảng 24–32px. Đoạn nối hai kỹ năng đã học có sắc hổ phách; phần đi tới hai mốc khóa khô và tối hơn. Nhánh phụ nối từ cạnh trái nút cao nhất tới nụ ngủ, hoàn toàn dưới y=260.

   Cây cách vùng người hùng ít nhất 44px theo chiều ngang; phần thấp nhất dừng ở y=894, cách dải chân dung 12px. **Giữ người hùng, bảng tên, dải chân dung y=906–1004 và mây trôi.**

   | Bảng chi tiết | Hộp |
   |---|---|
   | Bảng giấy kem viền gỗ | `[18,1004,905,484]` |
   | Hình kỹ năng lớn | `[52,1034,164,164]` |
   | Bảng `Lv.4/10` | `[56,1190,160,42]` |
   | Tên “Kiếm Nhiệt Huyết” | `[242,1030,640,46]` |
   | Thẻ “Chủ Động” | `[244,1080,190,40]` |
   | Mô tả, tối đa hai dòng | `[242,1128,630,88]` |
   | Tiêu đề “Nguyên liệu” | `[54,1234,410,36]` |
   | Khay nguyên liệu | `[48,1268,420,102]` |
   | Hai ô vàng/sách | Tâm x=158 và 356; hình y=1272, số y=1336 |
   | Khi cần tinh hoa: ba ô | Tâm x=118, 258, 398; cùng hàng |
   | Tiêu đề “Cấp kế” | `[500,1234,370,36]` |
   | Biểu tượng sát thương | `[508,1284,72,72]` |
   | Hiệu quả `87 → 92` | `[590,1294,274,48]` |
   | Tranh nút “Tăng Cấp” | `[310,1380,322,84]` |
   | Vùng chạm nút | `[310,1368,322,108]` |

   Khi chọn kỹ năng khóa: khay trái đổi thành điều kiện và tiến độ hiện tại; cột phải hiện hiệu quả lúc học. Nút dùng tranh tối, chữ **Chưa Mở**, không nhấp nháy.

4. **Mảnh tranh cần vẽ.**

   Theo hướng dẫn **imagegen** và **generate2dsprite**: tất cả kích thước dưới đây là kích thước đích logic; bản raw có nền đặc **#FF00FF**, **không chữ, không số**, không bóng đổ chạm mép. Các lớp cùng cành phải khớp đăng ký tọa độ.

   | Mảnh | Kích thước | Nội dung |
   |---|---:|---|
   | Cành nền | 459×624 | Gỗ chạm khắc uốn qua bốn tâm; nhánh phụ tới nụ, lá thưa, không chứa vòng nút |
   | Ba lớp đoạn cành sáng, xuất riêng | Mỗi lớp 459×624 | Mỗi ảnh chỉ chứa một đoạn nối có ánh hổ phách, để bật theo trạng thái |
   | Vòng đã học | 144×144 | Đồng vàng cũ, lá nhỏ; giữa để magenta |
   | Vòng khóa | 144×144 | Gỗ đá tối, ổ khóa nhỏ tích hợp mép dưới; giữa để magenta |
   | Lớp đang chọn | 144×144 | Viền vàng kép, dấu lá cố định; không che biểu tượng |
   | Chồi gợi ý | 32×44 | Lá xanh vàng chỉ vào nút; hình gọn, không chứa quầng sáng |
   | Bảng cấp | 144×44 | Gỗ tối, mặt giữa trống, viền đồng |
   | Thẻ điều kiện khóa | 192×70 | Gỗ đá có mặt chữ sáng vừa đủ cho hai dòng |
   | Nụ ngủ + ruy băng, xuất riêng | 112×90; 216×44 | Nụ khép có đai lá; ruy băng giấy kem trống |
   | Bảng chi tiết | 905×484 | Giấy kem, viền gỗ và lá, trung tâm thoáng |
   | Thẻ nhánh; bảng cấp lớn | 190×40; 160×42 | Hai bảng vẽ trống, cùng chất liệu UI |
   | Khay; ô nguyên liệu dùng lại | 420×102; 108×102 | Khay gỗ trống; ô riêng có chỗ hình và dải số |
   | Nút thao tác, hai trạng thái | Mỗi bản 322×84 | Vàng cam và đồng tối; cùng hình dáng, mặt chữ trống |

   Dùng lại nền, bốn hình kỹ năng, người hùng, bảng tiêu đề, chân dung, icon nguyên liệu và thanh điều hướng. Ánh sáng nhịp thở thực hiện bằng CSS trên tranh đã vẽ.

5. **Prompt tiếng Anh cho một mockup.** Chưa chạy image_gen; đây là prompt để duyệt trước khi dựng.

```text
Use case: ui-mockup.
Create ONE polished full-screen redesign mockup for Gemwoven, a Vietnamese portrait mobile match-3 RPG.

REFERENCE ROLES
- Attached bg-skills.png / Image 5: exact environmental background and spatial foundation. Preserve its giant tree trunk, left stone platform, sky opening, mountains, stonework and roots.
- Attached refs.png / Image 4: approved UI art direction. Match the hand-painted wood, cream parchment, aged brass, small leaves, material richness and restrained ornament.
- Attached phone-1.png / Image 1: preserve Hiro's identity, pose, HUD, hero nameplate, portrait roster and bottom navigation.
Do not copy the existing diamond-shaped skill tree.

OUTPUT AND STAGE
Portrait 2:3 composition. Use a 1200×1800 composition with the complete, undistorted 941×1672 logical game stage centered at offset (129.5,64). Fill the surrounding margins with a quiet dark matte. All coordinates below are local to the 941×1672 stage. Show the entire stage, including bottom navigation. No phone hardware, perspective or Studio browser frame.

ART DIRECTION
A finished, cohesive illustrated fantasy game interface. Warm carved wood and brass integrate naturally into the giant tree. Every frame, plaque, ribbon, tray and button is painted artwork. Crisp silhouettes and readable Vietnamese typography at phone size. Keep the sky spacious and Hiro clearly visible on the left. No flat translucent square cards behind the skill icons.

PRESERVE
The existing top HUD: Hiro level 40, gold 900.000, premium currency 120.000, mail badge 2.
The left “Kỹ Năng” title and its existing short motto.
The “Con Đường Kỹ Năng” title board at [535,147,359,113].
Hiro standing on the left platform, within x=133–391, with his existing nameplate.
The exact hero portrait roster at y=906–1004.
The existing illustrated bottom navigation and selected “Kỹ Năng” tab.
Soft distant clouds; represent one natural moment of their movement.

NEW SKILL TREE
Place exactly FOUR large skill medallions on one ascending, gently zigzagging carved wooden bough on the right trunk. The order from bottom to top is Active, Passive, Mutation, True Form.
The bough represents unlock milestones, not mandatory skill-rank prerequisites. Use no connecting arrows.
Keep all tree artwork within [435,270,459,624]. Nothing enters the roster at y>=906 or the title board ending at y=260.

Each medallion has a 144×144 painted frame and a recognizable 108×108 skill illustration:
1. Active sword, center (625,782), frame [553,710,144,144].
   Learned and SELECTED. Full-color sword, aged golden frame, steady double gold outline with a small fixed leaf seal.
   Wooden rank plaque [553,850,144,44], exact text “4/10”.
2. Passive shield, center (798,631), frame [726,559,144,144].
   Learned, recommended NEXT UPGRADE. Full-color shield, bronze frame, one restrained warm highlight and a small green-gold leaf pointer at [860,574,32,44].
   Rank plaque [726,699,144,44], exact text “2/10”.
   Its recommendation treatment must differ clearly from the selected sword.
3. Mutation ruby heart, center (610,477), frame [538,405,144,144].
   Locked. Dark wood-and-stone frame, subdued but recognizable colored heart, small lock at the lower rim.
   Gate plaque [514,545,192,70], exact text on two lines:
   “Cấp 100”
   “· TH2”
4. True Form laurel crest, center (798,342), frame [726,270,144,144].
   Locked with the same treatment.
   Gate plaque [702,410,192,70], exact text on two lines:
   “Cấp 180”
   “· TH3”

Draw a substantial, softly curving wooden bough behind those four centers. The learned Active-to-Passive connection has warm amber details; connections towards locked milestones are darker, dry wood. No thin straight CSS-like lines.

On a short auxiliary twig extending left from the highest medallion, add ONE small sleeping flower bud at [486,270,112,90], with a parchment ribbon at [435,354,216,44].
Ribbon text: “Sắp ra mắt”.
This is a quiet future ornament, not a fifth progression node. Remove all five old decorative lock nodes.

DETAIL PANEL
At [18,1004,905,484], paint a cream parchment panel with a carved wooden rim and restrained corner leaves, matching the approved Forge and Inventory screens.
Selected skill: Hiro's Active sword, rank 4/10.
Large sword illustration [52,1034,164,164].
Rank plaque [56,1190,160,42]: “Lv.4/10”.
Name [242,1030,640,46]: “Kiếm Nhiệt Huyết”.
Small painted category plaque [244,1080,190,40]: “Chủ Động”.
Description [242,1128,630,88]:
“Một nhát kiếm gỗ gây 87 sát thương cơ bản.”
Use up to two readable lines.

Lower left heading: “Nguyên liệu”.
Paint a wooden material tray at [48,1268,420,102].
Two centered material icons: gold and a red skill book.
Readable counters beneath: “900 N/9 N” and “40/5”.
Lower right heading: “Cấp kế”.
Show a small attack icon and the large concise value “87 → 92”.
Paint a gold-orange action button at [310,1380,322,84], exact text “Tăng Cấp”.

FINAL QUALITY
Prioritize the four-node reading order, distinction between selected and recommended states, clear locked gates, and generous separation from Hiro and the roster.
Use no extra skill nodes, no duplicated labels, no extra currencies, no modern flat UI cards, no oversized glow obscuring artwork, and no watermark.
Render one coherent finished game screen, not an asset sheet or annotated wireframe.
```