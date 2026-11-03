**Chốt: bỏ toàn bộ bảng tên và điều kiện cạnh nút; giữ cành hiện tại, mở rộng bằng chu kỳ hai ổ và chỉ cuộn vùng cây.** Không thu nhỏ huy hiệu, không đổi điều kiện mở kỹ năng.

**1. Đánh giá bản hiện tại**

| Bản xem | Điểm | Nhận xét |
|---|---:|---|
| Điện thoại, chọn Biến Dị | **8,5/10** | Tranh nền, Hiro, cây và bảng chi tiết đã thống nhất. Bảng điều kiện cạnh Biến Dị chiếm gần hết khoảng thở giữa Hiro và cành. |
| Điện thoại, chọn Chủ Động | **8,7/10** | Vòng chọn và đường sáng dẫn mắt tốt. Hai bảng tên của kỹ năng đã học làm cây giống các thẻ thông tin xếp cạnh nhau. |
| Studio | **8,3/10** | Hình khối và lựa chọn vẫn rõ, nhưng chữ nhỏ cạnh nút trở thành nhiễu ở kích thước chủ duyệt. |

Bỏ các bảng sẽ giúp thấy rõ đường cong, khoảng cách và biểu tượng của từng kỹ năng. Cây sẽ gần chất lượng các màn đã duyệt hơn: **hình ảnh để chọn, bảng dưới để đọc**. Mục tiêu sau chỉnh là khoảng **9/10 điện thoại, 8,8/10 Studio**; đây là mục tiêu, chưa phải điểm của bản đã dựng.

Trạng thái còn lại nên dùng đúng ba cách:

- **Đã học:** huy hiệu màu, socket gỗ, bảng hạng `4/10`.
- **Có thể học:** huy hiệu màu, bảng `Học` và **mầm xanh**. Đây là khả năng học, không đồng nghĩa đủ nguyên liệu; bảng dưới quyết định nút hành động.
- **Chưa mở:** **khung ổ khóa hiện có là đủ**. Không thêm bảng nhỏ, dấu chấm than hay khóa thứ hai. Giữ biểu tượng bên trong tối và giảm màu, nhưng đừng tối đến mức mất hình ổ khóa.

Khi chọn kỹ năng khóa, giữ vòng vàng dịu; không dùng quầng sáng mạnh như nút mở. Bảng dưới tiếp tục ghi `Cần`, `Hiện tại`, hiệu ứng và `Chưa Mở`.

Lá chỉ hướng vẫn dành cho **một gợi ý tiếp theo**. Mầm và lá có vai trò khác nhau: mầm báo “chưa học nhưng đã mở”; lá báo “nên xem nút này”.

**2. Thiết kế cây mở rộng**

**Chọn phương án ghép cành của bạn.** Nó giữ được hình đã được chủ duyệt và thêm chiều dài mà không phải thiết kế lại màn.

| Phương án | Quyết định |
|---|---|
| Ghép lại chu kỳ hai ổ từ `bough2` | **Dùng ngay.** Với 8 kỹ năng chỉ có hai đoạn chèn, độ lặp chấp nhận được; huy hiệu che phần lớn các đĩa gỗ. |
| Vẽ thêm đoạn chu kỳ A/B bằng Codex | Chưa cần cho bản này. Có thể bổ sung sau, cùng kích thước và điểm nối, nếu cây dài khiến các mắt gỗ và đai đồng lặp quá rõ. |
| Thêm nhánh bên | Giữ khả năng trong dữ liệu, chưa dùng để chứa kỹ năng tuần tự. Nhánh bên dễ bị hiểu là một nhánh lựa chọn hoặc hệ khác. |
| Carousel ngang | Không chọn: rời cách đọc “từ gốc lên ngọn”, đồng thời tranh chỗ với Hiro. |
| Chia trang | Không chọn: làm đứt cành và đường sáng, khó so sánh các mốc mở. |

**Lưu ý khi ghép:** đặt đường cắt dưới socket là đúng, nhưng `146 > 136` chưa tự bảo đảm kín. Khung khóa chỉ dư khoảng **5 đơn vị mỗi phía**. Từ số đo hiện tại, hai tâm ổ trái dùng để nối lệch nhau khoảng **7,8 đơn vị theo x**. Phải cắt/mask phần đĩa gỗ thừa nằm sau khung, bảo đảm cả hai nửa đều nằm trong vùng bị che. Không kéo giãn cả đoạn cành, không để sai lệch này cộng dồn qua mỗi lần lặp.

**a. Quy tắc slot**

Dùng danh sách kỹ năng theo thứ tự ổn định của từng tướng:

`skillId → slotIndex → tâm ổ → trạng thái / tranh / nội dung`

Bốn kỹ năng hiện tại tiếp tục dùng đúng `SKILL_GATES`. Các kỹ năng bổ sung nhận điều kiện từ dữ liệu sau này; **không suy ra điều kiện hoặc quan hệ tiên quyết từ vị trí trên cành**.

Với các tướng hiện tại và mở rộng từ 4 kỹ năng trở lên:

- Số ổ vật lý: `P = 2 × ceil(N / 2)`.
- Số chu kỳ chèn: `k = (P − 4) / 2`.
- Kỹ năng chiếm lần lượt slot `1…N`, từ gốc lên ngọn.
- Nếu N lẻ, ổ cuối cùng được che bằng **chùm lá kết ngọn**, không có socket, khóa, bảng hạng hay vùng chạm.

Như vậy N = 5 dùng cành 6 ổ, N = 7 dùng cành 8 ổ. Chùm lá che đĩa gỗ dư để nó không giống một kỹ năng bị mất dữ liệu. Không ghi `?`, `0/10` hoặc `Sắp ra mắt` trên ổ này.

**b. Nụ “Sắp ra mắt”**

Giữ **một nụ duy nhất trên nhánh nhỏ của đoạn ngọn**. Nụ, nhánh nhỏ và ribbon di chuyển cùng ngọn khi cây dài và khi cuộn.

Không nhân nụ theo từng chu kỳ. Không ghim ribbon trên màn hình khi nhánh đã đi khỏi viewport. Chạm nụ vẫn mở thông báo ngắn `Sắp ra mắt`; không mở một kỹ năng giả.

**c. Viewport, fade và dấu cuộn**

- **N = 4:** `[370,230,550,676]`, không cuộn. Không có cue cuộn. Hình nhìn như hiện tại sau khi bỏ bảng.
- **N > 4:** `[370,120,550,786]`.

Ở dải x này, y = 120 nằm dưới thanh tiền và thư; avatar cao hơn nằm bên trái viewport. Bảng tên màn và Hiro vẫn đứng yên.

Với cây cuộn:

- Fade trên: `[370,120,550,88]`, từ trong suốt ở y = 120 đến rõ hoàn toàn tại y = 208.
- Fade dưới: `[370,830,550,76]`, từ rõ ở y = 830 đến trong suốt tại y = 906.
- Fade chỉ tác động **cành, huy hiệu và phụ kiện của cây**, không phủ màu lên tranh nền.
- Tắt fade trên khi đã tới ngọn; tắt fade dưới khi đã về gốc. Phần chân cành vẫn giữ độ tan hiện có.

Cue là **hai lá gỗ viền đồng xếp thành dấu hướng lên hoặc xuống**, nằm trên một đế nhỏ, cùng chất liệu socket. Không có chữ.

| Cue | Vùng chạm | Tranh bên trong |
|---|---|---|
| Xem phía trên | `[398,124,108,108]` | `[424,148,56,60]` |
| Xem phía dưới | `[398,786,108,108]` | `[424,810,56,60]` |

Chỉ hiện cue ở phía còn nội dung. Chạm cuộn khoảng **một chu kỳ 305,44 đơn vị**, giới hạn tại đầu cây; chuyển động khoảng 240 ms. Cue nổi nhẹ 4 đơn vị, không phát sáng mạnh như lựa chọn.

**d. Điều khiển**

- Điện thoại: kéo dọc trong vùng cây; có quán tính nhẹ, không kéo cả trang.
- Studio: wheel/trackpad và kéo bằng chuột đều hoạt động khi con trỏ nằm trong viewport.
- Kéo lên đưa người xem về gốc; kéo xuống đưa người xem lên ngọn, đúng chuyển động của nội dung dưới ngón tay.
- Wheel xuống đi về gốc; wheel lên đi về ngọn.
- Qua ngưỡng khoảng 12 đơn vị mới nhận là kéo; thao tác kéo không kích hoạt chạm nút.
- Cue luôn dùng được khi người xem không muốn kéo.

**e. Mở màn, học và đổi tướng**

Lần đầu mở một tướng: chọn kỹ năng đầu tiên ở gốc, đặt cây tại gốc. Ghi nhớ lựa chọn bằng `skillId`, không bằng chỉ số đơn thuần.

Khi mở lại tướng đã xem, khôi phục lựa chọn và vị trí nếu nút vẫn hiện; nếu không, cuộn tối thiểu để đưa nó vào vùng rõ. Học hoặc tăng cấp giữ nguyên nút được chọn và vị trí xem; cập nhật hạng, mầm, lá gợi ý và bảng dưới, không tự nhảy sang kỹ năng tiếp theo.

Để đáp ứng **“nút chọn luôn trong tầm nhìn”** cả khi cuộn thủ công: trước khi nút đang chọn rời viewport, chuyển lựa chọn sang nút hiện rõ gần nhất theo hướng đang khám phá. Bảng dưới cập nhật cùng lựa chọn, nhưng không tự cuộn ngược lại. Hành vi này chỉ đổi nội dung đang xem, tuyệt đối không tự học hoặc tăng cấp.

**f. Đường sáng và sợi chỉ**

Ghép hoàn chỉnh cành thường và bản sáng bằng cùng bộ đoạn, cùng tọa độ. Mask bản sáng trong **hệ tọa độ nội dung**, từ gốc đến ổ đang chọn; sau đó cuộn cả hai cùng nhau. Không tính điểm cắt theo phần trăm chiều cao viewport.

Đường sáng là dấu tập trung thị giác, không biểu thị phải học nút dưới trước.

Sợi chỉ xuống bảng là một lớp riêng, **không nằm trong nội dung cuộn**:

- Thân sáng khoảng `[647,850,8,156]`.
- Tia sáng cuối `[635,994,24,24]`.

Khi gốc đi khỏi màn hình, sợi chỉ vẫn đứng yên ở vị trí nối dưới cùng. Không kéo nó chạy theo nút được chọn và không vẽ đường chéo xuyên Hiro.

**g. Chỉ báo số lượng**

**Không thêm `5/8` hoặc chấm trang.** `3/10` đã là thông tin hạng; một phân số thứ hai dễ bị đọc nhầm. Hai cue, phần cành bị fade và huy hiệu lộ ở mép đủ báo còn nội dung.

**3. Bảng tọa độ**

Tất cả là đơn vị stage. Gọi `d` là độ dịch nội dung **xuống dưới** khi xem các ổ cao hơn:

- Gốc: `d = 0`.
- Ngọn: `d = k × 305,44`.
- N = 8: `dmax = 610,88`.
- Tâm hiển thị: `(cx, cy + d)`.

Bảng dưới làm tròn 0,1; lúc dựng dùng số đo đầy đủ.

**Các lớp cố định và các đoạn cành**

| Thành phần `[x,y,w,h]` | N = 4 | N = 8, gốc | N = 8, ngọn |
|---|---|---|---|
| Viewport | `[370,230,550,676]` | `[370,120,550,786]` | như cột trước |
| Toàn bộ cành, trước clip | `[490,7,248,5,395,1,691,8]` | `[490,7,-362,4,395,1,1302,7]` | `[490,7,248,5,395,1,1302,7]` |
| Đoạn gốc | `[490,7,493,7,395,1,446,7]` | như N = 4 | `[490,7,1104,6,395,1,446,7]` |
| Chu kỳ chèn thấp | — | `[490,7,188,3,395,1,305,4]` | `[490,7,799,1,395,1,305,4]` |
| Chu kỳ chèn cao | — | `[490,7,-117,2,395,1,305,4]` | `[490,7,493,7,395,1,305,4]` |
| Đoạn ngọn | `[490,7,248,5,395,1,245,2]` | `[490,7,-362,4,395,1,245,2]` | như N = 4 |
| Nụ: vùng chạm | `[395,285,1,124,128]` | `[395,-325,8,124,128]` | như N = 4 |
| Ribbon nụ | `[377,239,1,196,44]` | `[377,-371,8,196,44]` | như N = 4 |
| Cue trên | ẩn | `[398,124,108,108]` | ẩn |
| Cue dưới | ẩn | ẩn | `[398,786,108,108]` |
| Sợi chỉ | `[647,850,8,156]` | giữ nguyên | giữ nguyên |
| Tia sáng cuối | `[635,994,24,24]` | giữ nguyên | giữ nguyên |
| Roster | `[24,906,893,98]` | giữ nguyên | giữ nguyên |
| Bảng chi tiết | `[15,1004,911,484]` | giữ nguyên | giữ nguyên |

*Trong các bảng tọa độ, dấu phẩy ngăn thành phần; số thập phân dưới đây dùng dấu chấm để tránh nhầm.*

Viết lại ba kích thước cành chính theo dạng máy đọc:

- N4: `[490.7,248.5,395.1,691.8]`.
- N8 tại gốc: `[490.7,-362.4,395.1,1302.7]`.
- N8 tại ngọn: `[490.7,248.5,395.1,1302.7]`.

**N = 4 — giữ đúng bốn tâm hiện tại**

Vùng nút bao cả huy hiệu và bảng hạng: `176 × 192`.

| Nút | Tâm `(cx,cy)` | Vùng nút `[x,y,w,h]` |
|---|---|---|
| 1 — Chủ Động | `(629.2,799.1)` | `[541.2,711.1,176,192]` |
| 2 — Bị Động | `(805,633)` | `[717,545,176,192]` |
| 3 — Biến Dị | `(621.4,493.7)` | `[533.4,405.7,176,192]` |
| 4 — Chân Thân | `(808.6,340.1)` | `[720.6,252.1,176,192]` |

**N = 8 — tọa độ trước clip**

| Nút | Tâm tại gốc | Vùng nút tại gốc | Vùng nút tại ngọn |
|---|---|---|---|
| 1 | `(629.2,799.1)` | `[541.2,711.1,176,192]` | `[541.2,1322,176,192]` |
| 2 | `(805,633)` | `[717,545,176,192]` | `[717,1155.9,176,192]` |
| 3 | `(621.4,493.7)` | `[533.4,405.7,176,192]` | `[533.4,1016.6,176,192]` |
| 4 | `(805,327.6)` | `[717,239.6,176,192]` | `[717,850.5,176,192]` |
| 5 | `(621.4,188.3)` | `[533.4,100.3,176,192]` | `[533.4,711.2,176,192]` |
| 6 | `(805,22.2)` | `[717,-65.8,176,192]` | `[717,545.1,176,192]` |
| 7 | `(621.4,-117.2)` | `[533.4,-205.2,176,192]` | `[533.4,405.7,176,192]` |
| 8 | `(808.6,-270.8)` | `[720.6,-358.8,176,192]` | `[720.6,252.1,176,192]` |

Slot 4 của cây dài thuộc đoạn lặp nên lệch nhẹ so với slot 4 thuộc ngọn của cây bốn kỹ năng. **Không thay tọa độ cây N = 4 để ép dùng một công thức chung.**

**Mọi thành phần tại một tâm hiển thị `(cx,cy)`**

| Thành phần | Rect `[x,y,w,h]` |
|---|---|
| Mặt huy hiệu | `[cx−72,cy−72,144,144]` |
| Socket, chỉ nút mở | `[cx−82,cy−82,164,164]` |
| Khung đã học | khoảng `[cx−72,cy−75,144,147]` |
| Khung chọn cho nút mở | khoảng `[cx−74,cy−76,149,147]` |
| Khung khóa, gồm ổ khóa | khoảng `[cx−73,cy−74,146,162]` |
| Vòng chọn | `[cx−97,cy−97,194,194]` |
| Quầng sáng, chỉ nút mở được chọn | `[cx−160,cy−160,320,320]` |
| Bảng hạng hoặc `Học`, chỉ nút mở | `[cx−78,cy+52,156,50]` |
| Mầm, nút mở chưa học | `[cx+30,cy−86,46,33]` |
| Lá gợi ý | `[cx−166,cy−17,76,34]` |
| Vùng chạm nút | `[cx−88,cy−88,176,192]` |
| Chùm lá che ổ dư khi N lẻ | `[cx−82,cy−82,164,164]` |

Dùng điểm neo thực của khung đã đo trong asset để canh lỗ khung; không canh bằng tâm hình chữ nhật. Mặt huy hiệu 144 và vùng chạm 176 đều vượt mức tối thiểu yêu cầu.

**4. Prompt hoàn chỉnh cho mockup**

Đây là prompt để dùng với ImageGen, **chưa chạy tạo ảnh**. Chữ trong mockup mô phỏng lớp HTML để duyệt; asset dùng trong build vẫn hoàn toàn không chữ.

```text
Use case: ui-mockup.

Create one polished FULL-SCREEN MOCKUP of the Vietnamese portrait
mobile RPG Gemwoven, showing the expanded “Kỹ Năng” screen.

OUTPUT AND COORDINATE SYSTEM
Canvas: exactly 1200 × 1800 pixels.
Place the complete, uncropped 941 × 1672 logical game stage at
canvas offset (129.5, 64), at 1:1 scale.
Thus every coordinate below is a stage coordinate; add (129.5,64)
to locate it on the output canvas.
Fill only the outside margins with a quiet dark brown surround.
Do not add a phone frame, browser chrome, captions or annotations.

REFERENCE ROLES
- bg-skills.png: exact environment and composition reference.
  Preserve the giant trunk on the right, blue sky and clouds,
  stone platform on the left, stone steps and foreground roots.
- phone-sel0.png: preserve Hiro’s identity, pose, costume and scale;
  preserve the HUD, screen title board, hero roster, bottom navigation,
  and the illustrated construction of the bottom detail panel.
- bough2-view.png: reference for the honey-gold carved wooden bough,
  brass bands, round mounting pads and the crown’s side twig.
- bough-n8.png: construction reference for an eight-pad extended bough.
  Its magenta is a production background and must not appear here.
- approved-refs.png: match the approved hand-painted UI quality.

STYLE
Warm, detailed hand-painted fantasy game illustration.
Honey wood, beveled brass, parchment, foliage and soft contact shadows.
Preserve the existing visual language. All frames, sockets, plaques,
buttons, scroll cues and branches must look like painted game art.
No flat rectangular UI substitutes.
Typography should look like a separate crisp UI overlay.
No words belong to the reusable artwork itself.

FIXED COMPOSITION
Keep Hiro on his left-hand platform, approximately within x=100–390.
Keep his existing name board.
Keep the “Kỹ Năng” title board at the upper left.
Keep the HUD in its original position.
Keep the roster at [24,906,893,98].
Keep the detail panel at [15,1004,911,484].
Keep the illustrated bottom navigation from the reference.
The background, Hiro, HUD, title, roster, detail panel and navigation
do not scroll.

EXPANDED TREE
This is a QA-only hero fixture with eight skills.
It is not a new-account screen or a proposal for new unlock rules.
Show one continuous carved bough with eight ordered mounting slots,
ascending in a gentle left-right zigzag.
Use the same bough material and scale as the approved four-skill tree.
Extend the bough using its repeating two-pad period.
Hide all assembly seams beneath the node frames.
No prerequisite arrows and no connection arrows between skills.

Tree viewport: [370,120,550,786], clipped at y=120 and y=906.
Show the tree scrolled to a middle position:
the complete tree content has been translated DOWN by 320 units
from its root-view position.

Displayed skill centres after this translation:
1: (629.2,1119.1)
2: (805,953)
3: (621.4,813.7)
4: (805,647.6)
5: (621.4,508.3)
6: (805,342.2)
7: (621.4,202.8)
8: (808.6,49.2)

Respect these centres and clipping.
Do not compress the tree to show all eight complete nodes.
Skill 1 is fully below the viewport.
Only the upper portion of skill 2 enters the bottom edge.
Skill 3 and its rank plaque are partly faded/cropped at the bottom.
Skill 4 is clearly visible below skill 5.
Skill 7 is partly affected by the upper fade.
Only a small lower edge of skill 8’s locked frame enters the top edge;
do not invent a second full locked node inside the viewport.

NODE STATES
Skills 1–4 are learned, with full-colour skill artwork and wooden sockets.
Their logical ranks are respectively “4/10”, “2/10”, “1/10”, “1/10”.
Show rank text only where its plaque actually falls inside the viewport.

Skill 5 is OPEN, LEARNED and SELECTED, rank “3/10”.
Give it the existing 164-unit wooden socket, a gold selection ring
194 units across, and a broad soft warm selection halo.
Its skill icon is a clearly readable silver sword with a small amber
energy accent on a crimson well.
Use the same icon in the detail panel.

Skill 6 is OPEN but NOT YET LEARNED.
Show its blue shield icon, a normal wooden socket, the existing rank
plaque reading exactly “Học”, and the small green sprout.
Place the existing suggested-step pointer leaf to the left of skill 6.
Do not give skill 6 the selected gold halo.

Skills 7 and 8 are LOCKED.
Use the existing dark metal padlock frame and subdued skill artwork.
No rank plaque on locked nodes.
Do not add any second padlock badge.

All medallion faces are 144 units across.
Normal sockets are 164 units across.
Rank plaques are 156 × 50, centred at (cx,cy+77).
No skill name plaques and no requirement plaques anywhere on the tree.
No “Cần Cấp…”, branch labels or skill names beside nodes.

LIGHT AND SCROLL CLIPPING
Keep the normal bough visible.
Overlay a brighter copy of the same assembled bough, lit from the root
up to selected skill 5; the section above skill 5 remains subdued.
Do not turn this into a prerequisite diagram.

Top fade: tree art transitions from transparent at y=120
to fully visible at y=208.
Bottom fade: fully visible at y=830 to transparent at y=906.
Apply these fades to tree content only, not to the background.

Add two illustrated scroll cues:
- upward cue: small carved wood and brass leaf-chevron artwork
  at [424,148,56,60], within an invisible [398,124,108,108] hit area;
- downward cue: matching downward-facing artwork
  at [424,810,56,60], within an invisible [398,786,108,108] hit area.
These are scroll controls in the left gutter of the tree.
No text, counters, dots or scrollbar.

The future-branch bud and its parchment ribbon remain attached
to the crown’s side twig and scroll with the crown.
At this particular middle scroll they are above the viewport:
do not relocate them into view and do not add a floating ribbon.

Keep the thin vertical amber-white thread FIXED at approximately
[647,850,8,156], with its small spark at [635,994,24,24].
It does not move with the bough and does not connect diagonally to skill 5.

DETAIL PANEL
Preserve the existing illustrated parchment panel, icon socket,
branch plaque, material tray, next-level card and orange upgrade button.

Selected icon/socket area: approximately [34,1010,152,152].
Rank plaque: [40,1152,140,42].
Skill name: [198,1022,686,50].
Branch plaque: [198,1072,220,40].
Description area: [198,1112,692,84].
Material header: [198,1200,250,46].
Material tray: [40,1228,566,140].
Next-card header: [646,1200,230,46].
Next-level card: [624,1228,274,140].
Upgrade button: [300,1376,340,100].

Use a gold coin and a red skill book as the two material pictures.
Use readable dark brown text on parchment, cream text on dark wood,
green “Cần” values because this QA fixture has enough materials.
The upgrade button is ready and warmly illuminated.
Do not add unlock conditions to this open skill’s panel.

EXACT VISIBLE TEXT — NO ADDITIONAL COPY
HUD:
“24”
“5.200.000”
“120.000”
“2” on the mail badge
“+” on the two currency controls

Screen title:
“Kỹ Năng”

Hiro name board:
“Lv.24 · Hiro”
“Lữ Khách Tập Sự”

Roster:
“24”, “24”, “1”
Use padlocks rather than text for the three unowned portraits.

Visible tree plaques, subject to the clipping described above:
“1/10” for skill 3, partly clipped
“1/10” for skill 4
“3/10” for selected skill 5
“Học” for skill 6

Detail panel:
“Kỹ năng thử 5”
“Mở rộng”
“Lv.3/10”
“Kỹ năng thử để kiểm tra cây mở rộng.”
“Nguyên liệu”
“Có 5,2 Tr”
“Cần 9 N”
“Có 40”
“Cần 5”
“Cấp kế”
“Sát thương”
“91 → 97”
“Tăng Cấp”

Bottom navigation:
“Trang Chủ”
“Tướng”
“Túi Đồ”
“Kỹ Năng”
“Triệu Hồi”
“Đấu Trường”
“Thêm”
“3” on the More badge

Keep the existing green upward symbol on the hero navigation item
as a symbol, without adding explanatory text.

Use Vietnamese diacritics exactly as written.
Main panel title approximately 44 units; description approximately
33 units; tree rank text approximately 38 units.
Wrap the description naturally within two lines if needed.
Do not paint layout guides, coordinates, hit-area outlines,
skill numbers, English labels, QA labels or watermarks.
```

**5. Các mảnh dùng cho build**

Kích thước dưới đây là kích thước hiển thị ở stage. Với mảnh vẽ mới, yêu cầu bản gốc ít nhất **2×**, có lề magenta sạch quanh tranh. Mỗi mảnh mới nằm trên sheet **#FF00FF**, không chữ, không số, không bóng sáng bị dính nền.

| Mảnh | Kích thước đích | Xử lý |
|---|---:|---|
| `bough2` nguyên bản | `395.1 × 691.8` | **Giữ nguyên** cho N = 4. |
| Gốc cành | canvas `395.1 × 446.7` | Cắt từ bản gốc; giữ chân và chỗ nối. |
| Chu kỳ hai ổ | canvas `395.1 × 305.44` | Tái sử dụng bản gốc; xử lý phần bị che tại hai đầu nối. Không cần vẽ mới ngay. |
| Ngọn cành, gồm twig | canvas `395.1 × 245.2` | Cắt từ bản gốc; chỉ dùng một lần ở đầu cây. |
| Socket | `164 × 164` | Tái sử dụng. |
| Khung đã học / khung chọn | khoảng `144 × 147` / `149 × 147` | Tái sử dụng, giữ điểm neo. |
| Khung khóa | khoảng `146 × 162` | Tái sử dụng; không thêm cue khóa mới. |
| Vòng chọn | `194 × 194` | Tái sử dụng. |
| Bảng hạng | `156 × 50` | Tái sử dụng cho hạng và `Học`; chữ là HTML. |
| Nụ trên twig | tranh rộng khoảng `112`, vùng chạm `124 × 128` | Tái sử dụng. |
| Ribbon | `196 × 44` | Tái sử dụng; `Sắp ra mắt` là HTML. |
| Mầm | `46 × 33` | Tái sử dụng. |
| Lá gợi ý | `76 × 34` | Tái sử dụng. |
| **Cue cuộn lên** | **`56 × 60`** | **Vẽ mới**, sheet gợi ý `192 × 192`. Đế gỗ nhỏ, viền đồng, hai phiến lá hướng lên. |
| **Cue cuộn xuống** | **`56 × 60`** | **Vẽ mới**, sheet `192 × 192`. Giữ ánh sáng từ trên trái; không lật dọc cả tranh vì sẽ đảo bóng. |
| **Chùm lá che ổ dư** | **`164 × 164`** | **Vẽ mới**, sheet `384 × 384`. Che kín đĩa khoảng 136; không hoa, khóa, viền huy hiệu hoặc mặt tròn trống. |
| Panel, bảng nhánh, tray, card, header tag, nút | Theo tọa độ bảng chi tiết ở trên | Tái sử dụng toàn bộ. |

Bản sáng của cành, halo, fade và sợi chỉ dùng lại tranh cùng CSS light/mask; không cần thêm sheet. Bốn biểu tượng QA bổ sung có thể dùng tranh kỹ năng hiện có để kiểm tra bố cục; chúng không phải nội dung kỹ năng được phát hành.

**Phần tranh mới bắt buộc chỉ gồm hai cue cuộn và chùm lá che ổ dư.** Giữ raw sheet và prompt khi triển khai. Không sửa tệp trong lượt review này.