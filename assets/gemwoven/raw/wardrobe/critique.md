**Chốt: mở từ avatar HUD; dùng một popup “Trang trí”, xem thử trước rồi mới trang bị.** Người nhận khung Hỏa Hồ dùng theo đường: **avatar → Khung trận → Hỏa Hồ → Trang bị**. Bảng nhận thưởng có thêm đường tắt **Trang bị ngay**.

1. **Đồng ý điểm vào avatar.** Áp dụng ở các màn có HUD, không thêm nút vào combat. Đổi tên “Trang phục” thành **“Trang trí”**, tránh hiểu là đổi áo tướng.

2. **Bỏ bố cục xem trước mọi thứ cùng lúc.** Avatar, danh hiệu, bong bóng và trận mini chen nhau sẽ khiến khung trận vẫn quá nhỏ. Vùng xem trước **đổi theo loại đang chọn**: nhóm hồ sơ hiện avatar cùng tên; Bong bóng hiện hội thoại; Khung trận/Vào trận hiện cảnh combat. Chỉ Vào trận có ▶ để phát lại hiệu ứng.

3. **Giữ bảy loại, có nhãn ngắn.** Thứ tự: Avatar → Khung → Danh hiệu → Thẻ tên → Bong bóng → Khung trận → Vào trận. Biểu tượng loại giữ ổn định, tránh thay toàn bộ bằng món đang đeo khiến khó nhận diện. Chấm đỏ nghĩa là **chưa xem**, hết khi đã xem; không ép người chơi đeo để xóa chấm.

4. **Đồng ý gom các mùa đã phát hành.** Phân biệt rõ **đang chọn** và **đang đeo**: `socket-on` chỉ món đang chọn; `medal-worn` chỉ món đang đeo. Món khóa dùng `socket-locked`, giữ hình đủ rõ để muốn xem thử. Bỏ tên dài và nút trên từng ô; tên món chỉ hiện một lần cạnh vùng xem trước. Nguồn khóa dùng huy hiệu mùa + icon nhánh + ★ cấp; chi tiết hiện khi chọn.

5. **Footer một hành động.** Có món, chưa đeo: **Trang bị**; đang đeo: **Gỡ** nếu loại đó cho phép. Món khóa chỉ có **Đi tới** khi nguồn còn truy cập được. Nguồn đã hết hoặc chưa mở: ghi ngắn **Đã kết thúc / Sắp ra mắt**, bỏ footer. Chọn món chỉ đổi bản xem thử; đóng popup không lưu lựa chọn thử.

6. **Đồng ý “Trang bị ngay”.** Nút áp dụng đúng món đang được giới thiệu; nhận nhiều món thì chọn một món để thao tác. Trang bị xong có phản hồi trực quan trên hình thưởng.

7. **Đồng ý dùng chung popup từ Sổ.** Vào từ Sổ có chip mùa kèm **× trong chip** để bỏ lọc; vào từ HUD mặc định mọi mùa. Sau khi nhận khung trận, mở đúng loại và chọn sẵn khung đó.

**Bố cục chốt — tọa độ trên sân 941×1672:**

| Vùng | Vị trí / kích thước |
|---|---|
| Popup | `x40, y112, w860, h1468`; giữ khung dây leo hiện có |
| Tiêu đề | `y136..216`; × tại `x804, y136, 72×72`, nằm trong khung |
| Xem trước | `x80, y240, 780×410`, nền `parchment`; ưu tiên hình lớn |
| Bảy loại | `y674`, mỗi vùng chạm `108×120`, cách `4`; x bắt đầu `80`; icon `88×88`, nhãn dưới |
| Tên món / chip mùa | `x80, y812, 780×48`; chip chỉ khi đang lọc |
| Lưới cuộn | `x80, y884, 780×528`; ba cột **244×244**, cách **24**; thấy hai hàng |
| Footer có hành động | `x270, y1436, 400×104`, `btn-gold` hoặc `btn-steel` |

Hình trong ô khoảng **168×168**; huy hiệu trạng thái khoảng **44×44**. Chữ chính **30–32px**, nhãn loại **26px**. Dùng kit đúng tỷ lệ hoặc cắt ghép mép, không kéo méo socket/plaque. Không thêm dòng “Trang trí · không chỉ số”, mô tả dài hay nút từng ô. Chỉ dùng số xanh/đỏ cho điều kiện tiến độ thật, dạng `12/30`.

**Prompt mockup để Claude dùng trực tiếp** — đính kèm ảnh hiện tại, ảnh kit và art Mika có sẵn:

```text
Create ONE polished portrait UI mockup, 1024×1536, for Gemwoven, matching the supplied approved game screenshot and existing illustrated UI kit.

Fit the complete 941×1672 game stage proportionally into the canvas, centered horizontally. Do not stretch the stage. Show one screen only: the “Trang trí” popup over a dimmed existing hub.

Reuse the supplied painted assets faithfully: leafy wooden outer frame, parchment, plaque, round, tab/tab-on, socket/socket-on/socket-locked, medal-worn, season badges, lock, btn-gold and btn-steel. No new ornamental design, generic CSS cards, wireframes, gradients replacing artwork, device frame, annotations or comparison panels.

All following coordinates refer to the original 941×1672 stage:
Popup x40 y112 w860 h1468. Wooden title “Trang trí”; close × fully inside the upper-right frame at x804 y136, size72.

Large parchment preview x80 y240 w780 h410. The selected category is “Khung trận”. Show the existing combat scene with the supplied Hỏa Hồ combat-corner artwork at the same positions and proportions as the real game. Make the cosmetic clearly visible. Do not invent extra corner ornaments or turn it into a picture-frame border. This is an owned, unequipped item being previewed. No play button in this category.

Below, seven equal category controls, x80 onward, y674, each108×120 with4px gaps. Use stable illustrated category symbols inside88×88 round kit controls, with concise Vietnamese labels beneath:
“Avatar”, “Khung”, “Danh hiệu”, “Thẻ tên”, “Bong bóng”, “Khung trận”, “Vào trận”.
Highlight the sixth category using existing selected kit artwork.

At y812 show the selected item name once: “Khung trận Hỏa Hồ”. No season filter chip in this HUD-opened state.

Scrollable item grid x80 y884 w780 h528: three columns of244×244 illustrated sockets with24px gaps. Use only existing released combat-frame assets from the supplied references. Keep natural empty parchment if fewer items exist; do not fabricate cosmetics to fill six positions. Hỏa Hồ is selected with socket-on, without a worn medal. A different equipped item, if available, has medal-worn independently of selection. Locked items use socket-locked with readable artwork, a small lock and compact source badges. No repeated long item names or per-item buttons.

One centered painted gold footer button x270 y1436 w400 h104, labeled “Trang bị”.

Warm readable parchment, crisp painted assets, restrained decoration, generous spacing. Main Vietnamese text30–32px and category labels26px in original stage units. The combat preview and cosmetic artwork dominate. No explanatory paragraphs, extra currencies, invented progress counters or red notification dots in this state.
```