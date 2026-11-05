**Chốt: duyệt hướng A–C sau khi sửa. Bản hiện tại chưa đạt; ưu tiên tương tác với ngọc, rồi mới tăng độ rực của FX.** Đánh giá dựa trên ảnh và mã đã đọc; không sửa file.

**1. Phê bình hiện tại**

| Loại | Item /10 | FX /10 | Vấn đề chính |
|---|---:|---:|---|
| Sao băng | **4** | **3** | Ngọc bị thu còn 74%; thanh đồng lấn át hướng phép. Ba vạch sáng chưa diễn tả một dải quét rộng; thiếu nhịp ngọc lún rồi vỡ tuần tự. |
| Bom | **5** | **2** | Lồng và ngòi nhận ra được, nhưng che ngọc. Vòng vàng mảnh không có sức hút, không có pha co; cảm giác ngọc biến mất nhiều hơn bị nổ. |
| Lõi | **7** | **3** | Cầu cầu vồng dễ phân biệt nhất. FX thiếu đường nối nguồn–đích; khó đọc việc chọn một màu và thu hồi năng lượng. |

Mã xác nhận vấn đề nhịp: Sao quét **180ms**, Bom nở **110ms** rồi bắt đầu xóa từ khoảng **50ms** trong pha nở. Lõi hiện đánh dấu tối đa **24 viên**. Các nhãn “review đạt” trong CSS không thay thế việc chấm bản đang chạy.

**2. Danh sách kiểm tra cứng cho bản dựng**

Tất cả mục dưới đây phải **đạt**. Chấm tại **430×932, tốc độ thật 1×**. Gọi **S** là cạnh ô thực tế tính bằng CSS px; ví dụ S=50px.

**A — Item đứng yên**

- [ ] **Sao/Bom giữ kích thước ngọc thường ±5%**, giữ nguyên chiều đứng và màu. Bỏ launcher đồng, lồng đồng và ngòi; ánh sáng nằm chủ yếu sau ngọc.
- [ ] Sao có dải sáng ngang dài **1,05–1,15S**; hai đầu nhọn đọc được khi thu về kích thước thật. Bản dọc chỉ xoay lớp sáng **90°**. Dao động đầu mũi tối đa **0,04S**, chu kỳ **1.200–1.600ms**.
- [ ] Bom có **vòng lửa đứt đoạn**, đường kính **0,95–1,05S**, ít nhất **3 lưỡi lửa** rõ hình; chu kỳ quay **3–4 giây**. Không dùng vòng mờ đều giống trạng thái chọn.
- [ ] Lõi có cầu đường kính **0,75–0,85S**, quầng cầu vồng tối đa **1,05S**. So kích thước hình cầu thực, không so khoảng trống trong file.
- [ ] Mỗi item vẫn nhận ra sau khi tắt animation và xem ảnh thang xám: Sao bằng trục, Bom bằng lửa xoắn, Lõi bằng cầu/quầng. Glow không che quá **20% diện tích ngọc**.

**B — Sao băng: 750ms, phải thấy “miết phím”**

- [ ] **0–150ms:** tích sáng, hai đầu vươn; ngọc mục tiêu chưa biến mất.
- [ ] **150–570ms:** hai lưỡi quét từ tâm ra hai phía, tốc độ theo quãng đường. Cùng cột/hàng khoảng cách với tâm thì trúng cùng nhịp; không chạy hai animation khiến đầu gần mép bò chậm.
- [ ] Lưỡi cong cao **2,6–3S**, tương đương **130–150px nếu S=50**; thân sáng dày ít nhất **0,08S**. Cả ba làn đọc rõ, không chỉ làn giữa sáng.
- [ ] Mỗi nhóm ngọc theo mặt quét **lún 0,10–0,12S trong 50–70ms**, lóe đúng màu rồi vỡ trong **80–120ms**. Mặt sáng tới đâu, ngọc phản ứng tới đó; tuyệt đối không xóa cả dải một lượt.
- [ ] **570–750ms:** tàn sáng tắt; không chặn rơi ngọc để chờ tàn.
- [ ] Piano glissando kéo dài **420ms**, vào đúng lúc quét; nhịp nốt bám tiến trình chạm ngọc, sai lệch âm–hình **≤50ms**. Chọn bản thu có quyền sử dụng đã kiểm chứng; tên “barrel piano CC0” chưa đủ để chốt nguồn.

**C — Bom: 1.000ms, phải thấy “co lại rồi bùm”**

- [ ] **0–120ms:** ngọc phồng lên **1,12×**, lửa tăng tốc.
- [ ] **120–570ms:** xoáy lửa phủ bề ngang lẫn chiều cao **≥90% vùng 5×5** lúc mở lớn; có lưỡi lửa chạm tới bốn góc vùng. Một vòng tròn nội tiếp hình vuông **không đủ** mô tả phạm vi.
- [ ] Xoáy quay **180–270°**, co từ khoảng **4,5S xuống ≤0,8S**. Ít nhất **150ms cuối** phải thấy rõ đang co, không chỉ mờ dần.
- [ ] Trong pha hút, ngọc dịch **15% khoảng cách về tâm**, thu còn **85%**, nhuộm cam nhẹ; vẫn nhìn rõ hình ngọc. **Không viên nào bị xóa trước 570ms.**
- [ ] **570–650ms:** cầu lửa bật nổ tới vùng ảnh hưởng; xung kích theo sau **30–50ms**. Chớp trắng tối đa **50ms**, giữ thân lửa vàng–cam.
- [ ] **570–870ms:** ngọc vỡ/văng hướng tỏa tâm **0,25–0,6S** rồi tắt; phần còn lại dọn trước **1.000ms**.
- [ ] Âm hút tăng dần rồi ngắt ở **570ms**; tiếng nổ vào đúng đỉnh. Rung **board 2–3px trong 100–140ms**; không rung HUD và toàn màn hình.

**D — Lõi: 1.100ms, đọc rõ nguồn–đích**

- [ ] **0–180ms:** cầu nâng **0,2S**, tích quầng.
- [ ] **180–500ms:** tia nối tới **mọi viên mục tiêu**; mỗi đầu trúng để lại dấu sáng. Bỏ giới hạn hiển thị 24 viên.
- [ ] **Không dùng 40ms × số viên:** 32 viên đã mất 1.280ms riêng phần đánh dấu. Chia nhóm cách **40ms**, hoàn tất toàn bộ trong **320ms**.
- [ ] Tia có lõi sáng rộng **≥2px**, quầng màu rộng **4–6px** ở viewport kiểm tra; dấu đích tồn tại tới lúc hút.
- [ ] **500–800ms:** bản sao hình ngọc được kéo dọc tia về cầu, thu nhỏ; không kéo các ô nền. **800–900ms:** cầu co rõ; **900–1.100ms:** nổ sao cầu vồng rồi tắt.
- [ ] Chuông gió đi cùng các nhóm tia, có tiếng kết rõ khi nổ. Không phát một tiếng cho từng viên dồn thành tiếng rè.

**E — Combo, cơ chế và nghiệm thu**

- [ ] Giữ nguyên luật trong `board-specials.js`: **3 hàng/cột; 5×5; một màu; combo 3+3, 5+5, 7×7, chuyển màu thành item, cả bàn**. Phạm vi cắt đúng mép board.
- [ ] Sao+Sao dùng hai trục quét **cùng một nhịp**; Sao+Bom hút rồi quét **dải 5 hàng + 5 cột**, không minh họa thành một vụ nổ vuông.
- [ ] Bom+Bom mở xoáy **7×7**. Lõi+X phải thấy tia → đổi hình thành X trong **≥120ms** → kích hoạt; không hút ngọc về Lõi như Lõi thường.
- [ ] Mỗi viên chỉ vỡ và cộng tài nguyên **một lần**, kể cả giao hai dải. Chuỗi sau bắt đầu khi mặt quét/vụ nổ chạm item, được chồng tàn FX; không nối tuần tự nguyên thời lượng từng item.
- [ ] Combat nhận tài nguyên đúng lúc viên vỡ và chạy song song. **Sửa khẳng định của Claude:** kéo dài pha tích/hút vẫn trì hoãn lần nhận tài nguyên đầu tiên; chỉ tránh chờ thêm tàn FX.
- [ ] FX sáng nhất phải có lõi nhìn rõ ở ảnh thu đúng kích thước; không chấp nhận tăng opacity của một đám mờ. Ngoài chớp nổ, luôn nhận ra **≥80% ngọc chưa vỡ** trong vùng.
- [ ] Kiểm tra giữa bàn, sát góc và chuỗi nhiều item; quay **60fps**, xuất khung cách **50ms**. Giảm chuyển động vẫn báo đúng vùng và thời điểm xóa. Bản thường cần đạt **≥8/10 cho từng loại**, không lấy trung bình để bù lỗi.

**F — Chốt sheet C**

**Đúng 6 mảnh là đủ cho bộ FX nền, chưa phải toàn bộ art item.** Quầng Lõi lấy từ dải cầu vồng bằng dựng hình runtime; sao vụn, xung kích và dấu đích dựng thêm bằng code. Nếu muốn chúng là art vẽ riêng, cần sheet khác.

Không vẽ cả hoạt ảnh vào một mảnh: co, quay, hút và văng phải do runtime điều khiển. Xoáy cần có vùng tâm rỗng; cầu lửa cần đặc hơn để hai pha phân biệt rõ.

**3. Prompt sheet**

```PROMPT_FX
Create ONE production VFX texture atlas for Gemwoven, a polished jewel fantasy match-3 game viewed on a phone.

Canvas: 3072 × 2048 pixels, opaque pure black (#000000), exactly 3 columns × 2 rows of equal 1024 × 1024 cells. No visible grid, borders, labels, text, numbers, UI, gems, weapons, metal, scenery, or extra assets.

Exactly ONE isolated effect per cell, centered within its own cell. Keep ALL visible glow and particles inside an 8% safe margin on every side. Cells must remain completely separated by pure black space. Screen-blend-ready: no grey background, dark painted smoke, shadows, or rectangular haze. Saturated colored shapes with crisp luminous cores and restrained soft glow, readable at small phone size.

TOP LEFT — Special-item comet aura:
A compact horizontal cyan-white energy band with two unmistakable luminous arrow tips pointing outward, left and right. Symmetrical silhouette, three short comet streaks, a few integrated star glints. Leave the central area relatively open for a full-size jewel placed above it at runtime. No jewel and no metal.

TOP MIDDLE — Sweep blade:
ONE tall vertical crescent of cyan-white light, moving conceptually toward the RIGHT. A strong convex leading edge on the right, short tapering energy trails extending left. Height approximately three times its width. Continuous, bold white-cyan edge with a visibly thick blue body, sharp tips, no second crescent. It will be mirrored for the opposite sweep and rotated for vertical sweeps.

TOP RIGHT — Small bomb fire ring:
ONE compact, broken circular wreath of orange-gold fire, viewed straight down. Clearly visible clockwise curling flame tongues, at least three strong flame tips. Wide open black center for a jewel. Bright yellow cores and red-orange edges; no fuse, cage, jewel, or explosion.

BOTTOM LEFT — Large contracting fire vortex:
ONE top-down clockwise spiral vortex made of several bold orange-gold flame arms. Open black center and clear black gaps between the arms. Overall footprint is a soft square: four outer flame tongues reach toward the four corners, while the inner arms curl toward the center. Designed to be rotated and scaled inward as one texture at runtime. No explosion, no temporal duplicates, no concentric thin gold circles.

BOTTOM MIDDLE — Fireball detonation:
ONE dense radial fireball explosion at its impact peak, viewed straight down. Compact bright yellow-white center, substantial saturated orange flame lobes radiating outward, red-orange outer tips and a few attached embers. Strong filled silhouette distinct from the hollow vortex. No separate shockwave ring, no smoke cloud, no debris objects.

BOTTOM RIGHT — Rainbow targeting beam:
ONE horizontal prismatic energy ribbon extending LEFT to RIGHT, approximately five times wider than tall. Clearly separated cyan, violet, magenta, red, gold, and green light strands around a narrow bright core. Compact luminous origin on the left and a pointed destination tip on the right. Controlled glow, long continuous readable body. No orb, ring, jewel, branching beams, or additional effects.

Treat these as six reusable single-state textures, NOT animation frames. Maintain a consistent hand-painted high-fantasy VFX style. Prioritize strong silhouettes and colored energy over diffuse bloom. No effect may touch a cell edge or cross into another cell.
```
