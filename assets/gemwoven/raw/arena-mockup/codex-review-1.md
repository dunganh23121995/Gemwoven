**1. Màn hiện tại: 6/10**, so với khoảng 8–8,5/10 của bốn màn đã duyệt. Nền và chất liệu đúng Gemwoven; cách tổ chức nội dung làm màn yếu đi.

Năm lỗi chính:

- **Trung tâm dành cho tính năng chưa chơi được:** bục trống và Đấu Hạng “Sắp ra mắt” chiếm vị trí đẹp nhất.
- **Hành động thiếu liên kết:** chọn cờ rồi bấm “Chiến Đấu” ở xa; khó biết nút sẽ mở chế độ nào.
- **Thứ bậc thị giác lệch:** huy hiệu kiếm quá lớn, hai Hiro lặp nhau, phần thông tin hữu ích lại nhỏ.
- **“Thưởng Boss” đứng lạc chỗ:** tấm giấy bên phải phá bố cục đối xứng và dễ bị hiểu là nhận thưởng ngay.
- **Popup thiên về văn bản:** thẻ kem, đường kẻ và danh sách chữ chưa đạt mức kể chuyện bằng hình của Túi Đồ hay Lò Rèn; chữ càng khó đọc khi thu trong Studio.

**2. Phản biện và thông số tôi đề nghị chốt**

**A — Tên: chọn “Cúp Đấu Trường”.**

- “Giải Đấu Tháng”: rõ nghĩa nhất, nhưng giống tên chức năng.
- “Cúp Nguyệt Ngọc”: đẹp âm, nhưng chưa nói rõ đây là thi đấu.
- “Tranh Bá Tháng”: hiểu ngay, hơi nặng sắc thái tranh lực chiến.
- “Nguyệt Hội Đấu Trường”: dài và khó đọc nhanh.
- **“Cúp Đấu Trường”**: ba từ, dễ nhận diện bằng chiếc cúp; dòng phụ ghi **“Tháng 11”**. Tách rõ với tên trang trọng của giải quý.

**B — Bản máy chủ**

| Điểm | Kết luận và thông số chốt |
|---|---|
| **B1 — Lịch** | **Đồng ý.** Tháng dương lịch, `Asia/Ho_Chi_Minh` — UTC+7. Tháng có D ngày: đua điểm từ ngày 1 đến hết ngày D−3; tứ kết D−2, bán kết D−1, chung kết D. Tháng 11: **1–27 / 28 / 29 / 30**. Các vòng loại trực tiếp bắt đầu **20:00**, BO3, có xem lại. Lịch này độc lập mùa Đấu Hạng 28 ngày và giải quý. |
| **B2 — Công bằng** | **Đồng ý Chuẩn Hóa; bỏ xoay bốn tướng.** Mọi người được mượn toàn bộ tướng hợp lệ trong giải, không cần sở hữu. Hiện chỉ Hiro và Mika; không thêm chúng vào bộ sưu tập tài khoản. Khóa danh sách và phiên bản cân bằng đầu tháng; tướng mới chờ kỳ sau. Không trang bị, báu vật, ngọc khảm, VIP, hình thái nâng cấp hoặc Biến Thân. Dùng bộ chiêu cơ bản, kỹ năng cấp 1. Không buff riêng Hiro. |
| **B3 — Điều kiện** | **Đồng ý:** miễn phí, **đã vượt ải 30**, tài khoản xác thực. Xác thực không đồng nghĩa ngăn được mọi tài khoản phụ; vẫn cần giám sát thi đấu. |
| **B4 — Lượt và điểm** | **Giữ 5 lượt/ngày, tích tối đa 10; đổi sang Elo đối xứng.** Khởi đầu 1.000, `K=40`, ngang điểm thắng +20/thua −20. Công thức ở dưới. Không bán lượt, không thêm lượt VIP, không thưởng điểm đăng nhập. |
| **B5 — BXH** | **Top 100 + hàng của mình**, nhưng chỉ xếp chính thức sau **10 trận hợp lệ**. Điều kiện vào Top 8: **30 trận**, trong đó **5 trận thuộc 7 ngày cuối vòng đua điểm**. Không dùng “ít trận hơn → đạt sớm hơn” để phá hòa. |
| **B6 — Thưởng** | **Không đồng ý tài nguyên tăng theo hạng.** Thưởng thứ hạng là mỹ thuật; mọi người hoàn thành 10 trận nhận cùng một gói nhỏ. Bảng cụ thể bên dưới. |
| **B7 — Vinh danh** | **Đồng ý 12 tháng gần nhất** trong giao diện; máy chủ giữ lịch sử lâu dài. Ghi tên, tháng/năm, tướng dùng thắng ván quyết định và nút xem lại chung kết. Bản thử có kho lịch sử riêng. |

**Công thức điểm**

Đề xuất thắng khoảng +20 nhưng thua chỉ −10 tạo ra **+10 điểm sau một thắng, một thua trước đối thủ ngang sức**. Nó thưởng việc đánh nhiều hơn.

Chốt:

```text
gap = clamp(R_đối_thủ − R_bạn, −240, 240)
E   = 1 / (1 + 10^(gap / 400))
Δ   = round(40 × (S − E))

S = 1 khi thắng; 0,5 khi hòa; 0 khi thua.
Hai người nhận biến động đối nhau.
```

Thắng/thua khoảng **8–32 điểm**. Nếu biến động làm một người xuống dưới 0, giảm lượng chuyển điểm cho cả hai tương ứng. Không tạo thêm điểm ở sàn.

Nguyên tắc “kết quả thực tế trừ kết quả kỳ vọng” dựa trên cách tính rating phổ biến; `K=40` và giới hạn chênh lệch trên là lựa chọn riêng cho Gemwoven. [Tham khảo quy định rating FIDE](https://handbook.fide.com/chapter/B022024).

Ghép trận trong **±100 điểm**, sau 30 giây mở ±200, sau 60 giây mở ±300; sau 90 giây cho tiếp tục chờ hoặc hủy, không mất lượt. Không tự thay người thật bằng AI.

Phá hòa: **điểm → trung bình điểm đối thủ tại lúc bắt đầu trận → số thắng**. Nếu vẫn hòa tại ranh giới vào Top 8, tổ chức trận phụ; các vị trí khác dùng bốc thăm máy chủ có lưu nhật ký. Điểm vòng đua **đóng băng trước chung kết**.

**Thưởng chốt**

Repo đã chốt mạnh hơn câu “không sức mạnh độc quyền”: **thưởng đua top/mùa là trang trí**, nhằm tránh vòng thắng rồi mạnh hơn. Xem [GAME_DESIGN.md](D:/Project/Gemwoven/docs/GAME_DESIGN.md:159).

400 điểm báu vật bằng **hai phần ba ngân sách PvE một kỳ**; hai ngọc cấp 3 tương đương **18 ngọc cấp 1**, chưa kể vàng và tinh hoa. Gói Claude đề xuất không độc quyền vật phẩm, nhưng vẫn tạo lợi thế tiến trình đáng kể.

| Thành tích | Thưởng thêm theo hạng |
|---|---|
| **Vô địch** | Danh hiệu bậc 5 **“Quán Quân Tháng”**, ghi tháng/năm; khung chân dung động; cúp lưu niệm trong hồ sơ; chân dung vinh danh ở Quảng Trường tháng sau |
| **Á quân** | Danh hiệu bậc 4; khung vàng tĩnh |
| **Hạng 3–4** | Danh hiệu bậc 4; khung bạc |
| **Hạng 5–8** | Danh hiệu bậc 3; khung đồng |
| **Top 10%** | Huy chương hồ sơ có tháng/năm |
| **Hoàn thành 10 trận** | Dấu tham dự; **20.000 vàng + 20 Sách EXP + 5 tinh hoa** |

Mỗi người nhận **một gói thành tích cao nhất**, cộng gói hoàn thành. Không thưởng riêng từng trận.

**Chốt bằng 0:** Đá Ngọc, điểm báu vật, ngọc khảm và tài nguyên tăng theo thứ hạng. Danh hiệu đều `server:true`, không chỉ số. Mỹ thuật vô địch cần đủ nổi bật để “thưởng xịn” có giá trị nhìn thấy được; giữ tượng lớn và quyền đặt danh hiệu theo khuôn cho giải quý.

Bỏ mốc thưởng **Top 100 tuyệt đối** vì quy mô người chơi chưa biết; BXH vẫn hiển thị 100 người.

**Các luật còn thiếu**

- **Chọn tướng:** khóa lựa chọn trước khi ghép, chỉ lộ sau khi ghép xong; được đổi giữa các ván BO3. Chưa cấm/chọn khi mới có hai tướng.
- **Lượt đi trước:** bốc thăm ván 1, đảo ở ván 2, bốc thăm lại ván 3. Reset HP, năng lượng và trạng thái mỗi ván.
- **Hòa:** tối đa **30 lượt/người**; hết lượt so tỷ lệ HP còn lại, bằng nhau tính hòa. BO3 tính thắng 1, hòa 0,5; nếu bằng tổng điểm sau ba ván, đánh tối đa hai ván phụ, vẫn bằng thì hạt giống cao đi tiếp. Phải công bố trước giải.
- **Bỏ trận/mất mạng:** giữ luật chung **20 giây/lượt, ba lần hết giờ xử thua, 60 giây kết nối lại**. Chủ động thoát sau khi trận bắt đầu vẫn mất lượt và điểm.
- **Lỗi máy chủ:** hủy kết quả, hoàn lượt đúng một lần; không nhận kết quả thắng/thua do client tự khai.
- **Thông đồng:** không gặp cùng tài khoản quá **hai trận/ngày**; phát hiện chuỗi nhường điểm, bỏ trận bất thường, cụm tài khoản. Không kết luận gian lận chỉ vì chung IP.
- **Chung kết:** Top 16 dự bị; xác nhận trước **12:00 ngày tứ kết**, thay người đến 18:00. Nhánh **1–8, 4–5, 2–7, 3–6**; không đến sau giờ đấu 10 phút xử thua.
- **Quy mô nhỏ:** cần ít nhất **32 người đủ điều kiện chung kết** để trao ngôi vô địch chính thức. Thiếu người thì vẫn trao gói hoàn thành, không dựng nhà vô địch bằng AI.
- **Người vào giữa tháng:** khởi đầu 1.000, nhận 5 lượt, tích tối đa 10 như mọi người; không truy lĩnh lượt cả tháng. Hiển thị ngay còn đủ thời gian đạt 30 trận hay không.
- **Chốt thưởng:** giữ kết quả **48 giờ** để kiểm tra trước khi trao, nhận một lần qua thư.
- **Thời gian:** máy chủ quyết định lịch UTC+7; không đổi theo đồng hồ hoặc múi giờ thiết bị.

Đây là bộ thông số thiết kế v1 tôi đồng ý. `liveops.js` giữ lịch, thể thức, thưởng; `progression.js` dùng chung phép tính và trạng thái bản thử, tránh tính lại trong UI. Quyết toán phát hành thuộc máy chủ.

**C — Bản thử cục bộ**

| Điểm | Phản biện/chốt |
|---|---|
| **C1** | **Đồng ý 31 AI + bạn.** Tên luôn có nhãn AI, chỉ dùng tướng đã phát hành. Không cho điểm AI tự tăng tùy ý theo ngày: sinh lịch trận AI–AI bằng seed rồi cập nhật cùng công thức điểm. |
| **C2** | **Đồng ý 5 lượt/ngày, tích 10, Elo như trên.** Tuy nhiên không chỉ gọi `begin('spar')` rồi coi như đã có giải Chuẩn Hóa: phải kiểm đúng bộ chiêu, chỉ số và đối thủ AI. Giao hữu hiện tại là nền để tái dùng, chưa phải bằng chứng hai chế độ tương đương. |
| **C3** | **Giữ Top 8, đề nghị cũng BO3** để thử đúng trải nghiệm dự định phát hành. Studio có điều khiển ngày mô phỏng; không cần chờ cuối tháng mới kiểm nhánh. Kết quả các cặp AI sinh từ seed và độ mạnh mô phỏng, không sửa ngược theo kết quả của bạn. |
| **C4** | **Không thưởng thật, kể cả vàng nhỏ.** Không tính nhiệm vụ, thành tích, điểm báu vật hay danh hiệu tài khoản. Chỉ lưu kết quả trong kho bản thử trên máy này. Tab Thưởng ghi **“Thưởng máy chủ · Sắp ra mắt”**. |

Tài khoản mới chỉ Hiro nhưng đã “hạng 14, 1.000 điểm” phải được hiểu là **dữ liệu dựng sẵn của bản thử**, không phải tài khoản mới đã vượt điều kiện ải 30. Bản thử cho trải nghiệm ngay trong kho riêng; phát hành thật vẫn giữ cổng ải 30.

**3. Bố cục cuối cùng — tọa độ `[x, y, rộng, cao]`**

**Màn Đấu Trường, 941×1672**

| Thành phần | Tọa độ | Nội dung/hành động |
|---|---:|---|
| HUD chung | `[0,0,941,150]` | Giữ mẫu đã duyệt; tài khoản mới **1.200 vàng, 0 Đá Ngọc** |
| Biển tên nhỏ | `[270,160,401,96]` | “Đấu Trường”; kiếm chéo thu thành huy hiệu nhỏ |
| Bảng giải treo trong cổng | `[125,270,691,238]` | Cúp, “Cúp Đấu Trường”, “Tháng 11 · Vòng Đua Điểm”, thời gian còn lại; chạm mở popup |
| Cụm Top 3 | `[164,535,613,310]` | Thứ tự **2–1–3**; chân dung đặt trên bục, hạng 1 cao nhất; từng chân dung có nhãn AI |
| Thanh của bạn | `[95,860,751,74]` | Chân dung Hiro, “Bạn · Hạng 14 · 1.000 điểm” |
| Nút hành động giải | `[265,950,411,104]` | Bản thử: **“Đấu thử · 5 lượt”**; máy chủ: “Thi đấu” |
| Rương thưởng giải | `[720,939,130,132]` | “Thưởng”; mở thẳng tab Thưởng, không nhận ngay |
| Nhãn trạng thái | `[70,1072,801,80]` | Hai dòng: “Bản thử cục bộ · Không thưởng” / “Kết quả không lên bảng toàn cầu” |
| Ba chế độ | `[39,1176,863,304]` | Ba bảng vẽ rộng 277, cách 16: **1v1 / Cùng máy**, **Đấu Hạng / Sắp ra mắt**, **Boss / Vô Hạn** |
| Điều hướng đáy | `[0,1510,941,162]` | Giữ mỹ thuật và cấu trúc hiện có |

Ba chế độ có hành động riêng:

- **1v1 Cùng máy:** vào trận hai người trên cùng thiết bị.
- **Đấu Hạng:** mở luật dự kiến, không có nút giả vờ ghép trận.
- **Boss Vô Hạn:** tới màn Boss.

Bỏ hai Hiro toàn thân, bảng “Đấu Hạng Sắp ra mắt” và nút “Chiến Đấu” dùng chung. Chỉ đưa giải tháng làm trung tâm khi **bản thử đã chơi được**; một bảng Coming soon lớn sẽ lặp lại lỗi hiện tại.

**Popup giải — dùng khung popup dọc chung**

| Thành phần | Tọa độ |
|---|---:|
| Khung gỗ, giấy, dây leo chung | `[32,90,877,1492]` |
| Tiêu đề | `[140,130,620,64]` |
| Nút đóng | `[795,118,106,106]` |
| Tháng, giai đoạn, trạng thái bản thử | `[78,224,784,88]` |
| Bốn tab ảnh | `[78,326,784,112]` |
| Vùng nội dung cuộn | `[78,454,784,786]` |
| Hàng ghim của bạn | `[78,1252,784,76]` |
| Trạng thái/ghi chú ngắn | `[78,1340,784,76]` |
| Nút hành động cố định | `[195,1432,550,112]` |

Tab rộng **190**, cách **8**: **Đua Điểm · Top 8 · Thưởng · Vinh Danh**.

- **Đua Điểm:** mỗi hàng gỗ cao 112; hạng, chân dung, tên, điểm. Hàng bạn có dấu đánh dấu bằng hình, không chỉ đổi màu.
- **Top 8:** ba cột trái→phải, rộng 232, tại x=78/354/630; bốn cặp tứ kết, hai bán kết, một chung kết. Chạm cặp xem giờ, tỷ số, xem lại. Không ép tám người vào một hàng ngang.
- **Thưởng:** từng mốc bằng huy chương, khung và biểu tượng; chạm xem mô tả. Luôn thấy nhãn phần thưởng máy chủ chưa phát hành.
- **Vinh Danh:** một nhà vô địch nổi bật, danh sách tháng cuộn phía dưới. Chưa có dữ liệu thì hiện bục trống có chủ đích và “Chưa có nhà vô địch”, không tạo người thắng giả.

Chữ chính **40–48**, nội dung **36**, nhãn phụ **32**, giãn dòng đủ cho dấu tiếng Việt. Vùng chạm quan trọng tối thiểu **106×106**, tương đương khoảng 44 px khi khung rộng 390 px.

**4. Mảnh ảnh cần vẽ**

Kích thước dưới đây là bản gốc gợi ý; **ảnh runtime không chứa chữ/số**.

| Mảnh | Kích thước | Tái dùng/vẽ |
|---|---:|---|
| Bảng giải treo, chừa chỗ cho cúp và ba dòng chữ | 768×288 | **Vẽ mới**; gỗ, đồng vàng, chút vải đỏ, không thêm kiếm lớn |
| Cúp của giải tháng | 256×256 | **Vẽ mới**; hình dáng dễ đọc ở 80–100 px, khác vương miện giải quý |
| Cụm ba bảng chế độ trên giá gỗ | 896×320 | **Vẽ mới phần giá/khung**; gắn cờ xanh/đỏ và icon hiện có |
| Thanh thông tin của bạn | 800×96 | Ưu tiên bảng gỗ/thanh chỉ số có sẵn; vẽ thêm nếu không vừa |
| Hàng BXH thường + lớp đánh dấu bản thân | 800×112 | **Vẽ mới một mẫu**, thêm dấu lá/kim loại rời |
| Khung cặp đấu hai người | 256×160 | **Vẽ mới**, dùng lặp cho bảy cặp |
| Khung chân dung vô địch tháng, các lớp chuyển động rời | 384×384 | **Vẽ mới**, là phần thưởng mỹ thuật chủ lực |
| Cúp lưu niệm và huy chương tháng | 192×192 mỗi loại | Dẫn xuất từ cúp mới, không cần một bộ phong cách khác |

Tái dùng trực tiếp:

- Nền `arena-calm.webp`; **không vẽ lại địa điểm**.
- `rank-gold/silver/bronze.png`, `flag-blue/red.png`, `chest.png`, `icon-crown.png`.
- Tab và khóa trong `assets/gemwoven/forge/`.
- `titles/plate-3.webp`, `plate-4.webp`, `plate-5.webp`.
- Khung popup, nút vàng, vòng chân dung, ảnh Hiro/Mika, HUD và thanh điều hướng đã có.

Ảnh nguồn, prompt và raw phải giữ trong repo khi bước sản xuất được thực hiện. Chưa cần sheet sprite mới cho thiết kế này.

**5. Prompt image_gen tiếng Anh**

Khung 941×1672 gần 9:16, khác tỷ lệ 2:3. Prompt dùng **một ảnh trình bày 1200×1800**, chứa nguyên màn game 941×1672 ở giữa; phần dư chỉ nối nền để không bóp méo tọa độ.

```text
OUTPUT

Create one polished, production-quality UI mockup for Gemwoven, a
portrait mobile match-3 RPG. Deliver one opaque portrait image with a
2:3 aspect ratio, ideally 1200 × 1800.

The actual game screen is a precisely centered 941 × 1672 rectangle,
with its top-left corner at approximately (130, 64) on the output.
All coordinates below are LOCAL to this inner game screen.
Fill the outer margins only with a subdued extension of the arena
background. No extra interface, device bezel, captions, or presentation
labels outside the game screen. Do not stretch the game layout.

This is a visual approval mockup. Render the specified Vietnamese text
in this mockup. In production, all text and numbers will be separate
HTML layers over text-free painted assets.

REFERENCES

Image 8, arena-calm:
PRIMARY LOCATION REFERENCE. Preserve the recognizable sunlit stone
archway, curved castle walls, red and blue banners, twin braziers,
circular arena platform, stairs, foliage, and blue sky.

Images 4–7, approved Hero Hall, Inventory, Shop, and Forge:
PRIMARY ART AND UI REFERENCES. Match their painted wood, warm metal,
parchment, fabric, foliage accents, illustration detail, and established
Gemwoven proportions. Use only the game viewport within these images
as a reference; exclude the surrounding desktop Studio interface.

Images 1–2:
CURRENT ARENA REFERENCE. Reuse the established HUD and bottom navigation
language, but replace the current content arrangement.

Image 3:
SHARED MODAL MATERIAL REFERENCE ONLY. Do not render an open modal in
this image.

ART DIRECTION

A shippable, readable illustrated fantasy game interface, not a loose
concept painting. Cheerful daylight, warm stone, rich blue and red
fabric, restrained gold highlights. Tangible painted frames and signs
with believable thickness, mounting, contact shadows, and perspective.

The monthly tournament is the visual focus. The stone arena remains
clearly visible between interface groups. Use ornament to establish
hierarchy, with quieter materials behind text.

SCREEN STATE

This is an explicitly labeled, playable LOCAL TOURNAMENT DEMO.
The real server tournament is not released.

Use a staged demo date of 4 November 2026, noon, UTC+7.
Tournament name: "Cúp Đấu Trường".
Month and phase: "Tháng 11 · Vòng Đua Điểm".
Countdown: "Còn 23 ngày".
Server status: "Máy chủ · Sắp ra mắt".

The account owns ONLY Hiro. Show Hiro's canonical portrait in the HUD
and in the player's tournament strip.
Account level: "1".
Gold: "1.200".
Premium currency: "0".
Do not copy the 120,000 premium-currency balance from the old screenshots.

The player's staged LOCAL demo standing is:
"Bạn · Hạng 14 · 1.000 điểm".
There are five available demo attempts.

The three leading contestants are explicitly AI copies.
Use canonical Hiro portraits for these three demo contestants.
Each portrait must have a clearly readable "AI" tag.
These are leaderboard portrait medallions, not three full-body Hiro
characters. Do not invent unreleased heroes or reinterpret the shop NPC
as a playable hero.

VISUAL HIERARCHY — LOCAL 941 × 1672 COORDINATES

1. SHARED HUD: x0–941, y0–150.
Preserve the approved avatar, resource bars, and envelope arrangement.
Render the account values specified above.

2. COMPACT SCREEN TITLE: x270, y160, width401, height96.
A small painted hanging sign reading "Đấu Trường".
A modest crossed-swords emblem may accompany it.
The screen title must remain subordinate to the tournament.

3. TOURNAMENT SIGN: x125, y270, width691, height238.
A painted wooden tournament sign suspended naturally inside the arch.
Include a distinctive gold cup with restrained red and blue fabric.
Arrange these exact lines with comfortable spacing:
"Cúp Đấu Trường"
"Tháng 11 · Vòng Đua Điểm"
"Còn 23 ngày"
Use a small, readable secondary ribbon:
"Máy chủ · Sắp ra mắt"

4. TOP THREE: x164, y535, width613, height310.
A balanced 2–1–3 podium composition.
Reuse the existing silver, gold, and bronze rank-pedestal vocabulary.
Place a large portrait medallion ABOVE each pedestal.
The gold first-place portrait is highest and slightly larger.
Show the rank numerals "2", "1", "3" and an "AI" tag for every contestant.
No empty thrones, no full-body duel scene, no central VS lettering.

5. PLAYER STRIP: x95, y860, width751, height74.
A quiet painted wood strip with Hiro's portrait and the exact text:
"Bạn · Hạng 14 · 1.000 điểm"

6. TOURNAMENT ACTION: x265, y950, width411, height104.
One prominent painted gold button:
"Đấu thử · 5 lượt"

7. REWARD CHEST: x720, y939, width130, height132.
Reuse the established purple-and-gold chest with a small painted label:
"Thưởng"
It clearly belongs to the monthly tournament.
No reward-available notification dot.

8. DEMO DISCLOSURE: x70, y1072, width801, height80.
Two readable lines on a subtle painted backing:
"Bản thử cục bộ · Không thưởng"
"Kết quả không lên bảng toàn cầu"
Keep this disclosure visible and legible.

9. OTHER MODES: x39, y1176, total width863, height304.
Three equally sized illustrated hanging plaques, each width277,
with 16-pixel gaps. Each plaque is its own direct action.

LEFT: blue cloth, crossed swords, exact two-line label:
"1v1"
"Cùng máy"

CENTER: subdued tournament crest and an explicit lock,
exact two-line label:
"Đấu Hạng"
"Sắp ra mắt"

RIGHT: red cloth, crown, exact two-line label:
"Boss"
"Vô Hạn"

Integrate the three plaques into one believable painted wooden support.
No selected-mode checkmark and no separate shared battle button.

10. BOTTOM NAVIGATION: x0–941, y1510–1672.
Match the approved illustrated navigation bar.
Exact labels:
"Trang Chủ", "Tướng", "Túi Đồ", "Kỹ Năng",
"Triệu Hồi", "Đấu Trường", "Thêm".
Show "Đấu Trường" as the active destination.

TYPOGRAPHY

Render Vietnamese accents accurately and use the exact quoted strings.
Use the established warm fantasy serif style with clear letterforms.
Main headings: approximately 44–48 local pixels.
Action labels: approximately 40 local pixels.
Main information: approximately 36 local pixels.
Secondary labels: approximately 32 local pixels.
Keep established bottom-navigation typography consistent with references.

Use dark brown text on light signs and warm ivory on dark wood.
Reserve luminous gold primarily for the main action and cup.
Allow generous vertical clearance for Vietnamese diacritics.
Preserve readability when the inner screen is reduced to 390 pixels wide.

AVOID

Flat CSS-style cream cards, generic dashboard panels, tiny paragraphs,
accordion lists, excessive gold ornament, oversized crossed swords,
two large identical Hiro fighters, a detached universal battle button,
an unrelated Boss Rewards card, unlabeled AI contestants, fake human
leaderboard claims, premium-currency rewards, unreleased playable heroes,
stat bonuses on titles, random notification dots, watermarks, desktop
Studio chrome, device mockups, extra copy, or an open popup.

Keep all information within the specified game-screen bounds.
```

Không sửa file và chưa tạo ảnh.