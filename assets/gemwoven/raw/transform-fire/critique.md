Chốt hướng Mika: **bóng hồ linh đỏ sẫm bùng một lần; ba lượt giữ hai dải lửa ôm sườn; dư âm còn một dấu than hồng nhỏ.** Chuyển động bằng các mảnh vẽ cố định, không đổi khung AI.

**1. Phê bình bản hiện tại**

- Vầng vàng và `brightness` làm trắng thêm đuôi, giáp; dấu hiệu “đang Biến Thân” yếu hơn chính chín đuôi sẵn có. Trên điện thoại, gần như chỉ huy hiệu **3** giúp nhận trạng thái.
- Khung “bấm” có chữ BIẾN THÂN nhưng thiếu một khoảnh khắc hình ảnh đủ rõ để cảm thấy sức mạnh vừa thức tỉnh.
- Dải lửa Trang Chủ cũ đổi cả hình dáng giữa các khung. Làm chậm hoặc hòa khung vẫn tạo cảm giác bóng kép, nhòe; cần thay nguồn chuyển động.

Có một chỗ lệch về luật: §2.4 viết “giữ một nửa”, nhưng [luật đang chạy](/D:/Project/Gemwoven/src/gemwoven/progression.js:206) và quyết định tại §20 dùng **dư âm +10%, nâng cấp +15%**. Trong phạm vi mỹ thuật này, tôi giữ nguyên `t.after`. Mức dư âm nhìn nhỏ đi không phải phép tính thưởng Công.

**2. Mảnh vẽ, chuyển động và nhịp biến thân**

Quy ước dùng trực tiếp số đo hiện có:

- `t = --evo-top`, `h = --evo-h`, `x = --evo-x`.
- `H` là chiều cao thân thực tế: `h × chiều cao khung actor`.
- Tọa độ dưới đây viết theo **tâm ngang / mép trên**; kích thước theo `H`. Giữ tỉ lệ ảnh, không kéo méo để lấp hộp.
- Tất cả bám actor hiện tại; không lấy kích thước cửa sổ để đoán vị trí.

**Sáu mảnh nguồn, dùng chung cho cả ba hình thái:**

| Tên file | Nội dung, kích thước nguồn | Vị trí và hộp hiển thị |
|---|---|---|
| `mika-tf-fox-back.png` | **1536×1536**. Một bóng cáo có đầu, tai, mắt và chín nhánh đuôi rõ; hình phẳng đỏ sẫm, viền lửa san hô. Đầu cáo lệch phải để không trùng đầu Mika. | Sau thân. Tâm `x`, trên `t+.02h`; tối đa `1.08H × .96H`. Chỉ dùng lúc bùng. |
| `mika-tf-flame-left.png` | **512×1536**. Dải lửa trái dài, ba đầu lửa lớn, giữa dải có khoảng rỗng. | Sau thân. Tâm `x−.40h`, trên `t+.18h`; hộp `.22H × .76H`. |
| `mika-tf-flame-right.png` | **512×1536**. Dải phải ngắn hơn, khác nét trái, không lật gương. | Sau thân. Tâm `x+.40h`, trên `t+.24h`; hộp `.22H × .70H`. |
| `mika-tf-forecurl.png` | **1024×512**. Hai lưỡi lửa thấp, giữa để trống; không thành vòng tròn khép kín. | Trước thân, chỉ ngang cổ chân. Tâm `x`, trên `t+.83h`; hộp `.58H × .15H`. |
| `mika-tf-ember.png` | **128×128**. Một tàn lửa hình giọt, lõi cam, cạnh sắc. | Tái sử dụng 4–6 hạt ở hai sườn; mỗi hạt `.014–.024H`. |
| `mika-tf-after-coal.png` | **512×256**. Hai nét than đỏ và một điểm cam, đọc được khi thu nhỏ. | Sau gót. Tâm `x`, trên `t+.92h`; hộp `.26H × .07H`. |

Nền nguồn FX: **magenta phẳng `#FF00FF`** theo pipeline sprite; xuất runtime thành **PNG RGBA nền trong suốt**, giữ cạnh chống răng cưa sạch. Không vẽ nền đất, bóng nền hay quầng mờ vào ảnh. Giữ nguyên raw và prompt trong repo.

**Chuyển động được chọn:**

- **Bóng cáo:** một ảnh cố định; mở từ gốc gần chân, tăng kích thước và hiện dần. Không xoay cả quạt đuôi, không biến thành cáo chạy.
- **Dải trái:** chu kỳ **2.8 giây**, `ease-in-out`; dịch lên tối đa `.008H`, nghiêng ±0.7°, scale Y `1→1.018→1`.
- **Dải phải:** **3.4 giây**, lệch pha ban đầu 1.1 giây; dịch tối đa `.006H`, nghiêng ±0.5°, scale Y tối đa 1.014. Hai ảnh khác nhau giúp tránh hình nhân đôi.
- **Lửa cổ chân:** **3.8 giây**, scale X ±1%, opacity `.65→.75→.65`; không quay quanh người.
- **Tàn lửa:** đi lên `.10–.16H` trong **1.6–2.2 giây**, vị trí chạy liên tục với tốc độ gần đều; hiện/tắt mềm ở hai đầu đường đi. Không qua mặt, thanh máu hay chữ kỹ năng.
- **Than dư âm:** đứng yên. Không nhấp nháy.

Ở `H≈144px`, dải lửa chỉ trôi khoảng **1px**; ở `H≈423px`, khoảng **3.4px**. Đây là mức chuyển động đủ sống mà không thấy cả mảnh bị kéo qua lại.

**Nhịp kích hoạt, tổng 1.000ms:**

| Thời điểm | Hình ảnh |
|---|---|
| **0–80ms** | Ghi nhận Biến Thân và huy hiệu lượt ngay. Lửa thấp hiện ở gót; không nháy trắng cả tướng. |
| **80–240ms** | Bóng cáo mở từ khoảng 86% lên kích thước chuẩn; hai sườn lửa dựng lên. Dùng `cubic-bezier(.16,1,.3,1)`. |
| **240–380ms** | Đỉnh bùng: bóng cáo đạt opacity khoảng `.8`, chín nhánh đọc rõ ở đường bao; 6 tàn lửa tách ra. |
| **380–720ms** | Bóng cáo thu nhẹ rồi tan hết; hai dải sườn hạ về mức duy trì. Dùng `cubic-bezier(.4,0,.2,1)`. |
| **720–1.000ms** | Chuyển êm sang chu kỳ duy trì; không còn bóng cáo lớn. |

Thưởng được áp dụng tại **0ms** như hiện tại. Một giây này là trình diễn, không thêm lượt, hồi máu hoặc cho địch đánh thêm. Nếu người chơi bắt đầu hành động tiếp theo, phần bùng nhường chỗ cho tín hiệu hành động ấy.

**Trong ba lượt:** hai dải sườn + lửa cổ chân + tối đa 4 tàn lửa cùng lúc. Huy hiệu **3 → 2 → 1** tiếp tục là thông tin chính xác; hoạt cảnh không tự trừ lượt. Bộ nâng cấp đọc `t.turns` để hỗ trợ bốn lượt.

Khi Mika đánh hoặc tung tuyệt kỹ, giảm dải duy trì xuống khoảng **35% cường độ** trong 100ms, phục hồi trong 200ms sau động tác. Giữ nguyên art tuyệt kỹ.

**Sang dư âm:** trong **320ms**, hai dải tắt và lửa chân nhường cho dấu than nhỏ. Huy hiệu hiện thưởng thực tế từ `t.after`. Dư âm không giữ bóng cáo, hạt bay hoặc hình gợi còn lá chắn.

**NO FX / giảm chuyển động:** bỏ toàn bộ các mảnh FX kể trên và bỏ thời gian chờ trình diễn; giữ huy hiệu lượt, số thưởng và thông báo trạng thái. Bật NO FX giữa chừng phải hủy ngay hoạt cảnh và lịch phát tiếng chưa chạy.

**Đọc được trên ba cỡ màn hình:**

- Điện thoại dọc: ưu tiên **mảng lửa lớn và khoảng rỗng**; nét chính tối thiểu khoảng **2px CSS**, không trông chờ chi tiết nhỏ.
- Điện thoại ngang: tính lại từ `H`; nếu thiếu khoảng trống thì thu đồng đều phần bùng, giữ nguyên thân.
- Studio 1920×911: nguồn đủ nét ở thân khoảng 423px, không dùng blur để giấu ảnh thiếu độ phân giải.
- FX nằm trong vùng sân, dưới các lớp thanh máu/chữ kỹ năng. Giữ cách HUD tối thiểu **6px CSS**, mép sân tối thiểu 4px; khi thiếu chỗ thì giảm kích thước FX. Không tràn xuống bàn ngọc.
- Chỉ thay lớp Biến Thân của Mika; không cộng thêm quầng vàng hiện tại vào bộ mới.

**3. Màu và phân biệt với tuyệt kỹ**

Tôi chọn **hồ hỏa đỏ son**, có chiều sâu tối:

| Thành phần | Màu chủ đạo |
|---|---|
| Lõi bóng cáo | Đỏ rượu `#591923` |
| Thân lửa | Đỏ son `#C93628` |
| Cạnh nóng | San hô `#F36338` |
| Điểm sáng nhỏ | Cam đào `#FFB06A` |

Không dùng lõi trắng hoặc phủ vàng toàn thân.

Chín đuôi hình thái 3 vẫn là **trắng kem–cam**, mềm và đầy. Bóng cáo mới là **một con cáo có đầu rõ, chín nhánh sẫm có khe hở**, xuất hiện thoáng qua phía sau; không vẽ thêm chín đuôi trắng gắn vào Mika. Hình thái 1–2 cũng chỉ nhận bóng linh lúc kích hoạt, không được thêm đuôi thường trực.

Tuyệt kỹ hiện có dùng vũ khí khổng lồ, vòng quét ngang, mặt trời và cáo lao về địch. Biến Thân dùng **chuyển động dựng lên quanh bản thân**, không có đường chém, sóng xung kích, mặt trời hay cáo phóng ra.

**4. Âm thanh**

Chốt **hai lần phát cho toàn bộ quá trình**, không có nền lửa chạy suốt ba lượt.

| Nhịp | Quyết định |
|---|---|
| **80ms — bùng** | Dùng **637533 — flame burst ignite bbq**, một đoạn liền khoảng **0.84 giây**, giữ tiếng bắt lửa và đuôi tắt tự nhiên. Thấp hơn tiếng va chạm tuyệt kỹ khoảng 4–6dB. |
| **Hết lượt cuối — hạ xuống dư âm** | Dùng **181563 — fire crackling**, một đoạn ngắn khoảng **0.35–0.5 giây**, nhỏ hơn tiếng bùng khoảng 10dB. Phát một lần. |
| Duy trì, giảm số lượt, dư âm | Im lặng. |

`637533` là lựa chọn chốt cho bản thử; điểm cắt cuối cần nghe trên loa điện thoại trước nghiệm thu. Mỗi nhịp giữ **một nguồn thu thật**, chỉ cắt, chỉnh gain, fade mép ngắn; lọc trầm nhẹ khi cần. Không ghép nhiều tiếng, đổi cao độ hoặc kéo thời gian.

Các nguồn còn lại:

- **260555:** đã dùng cho vòng quét tuyệt kỹ Mika; không dùng lại ở đây.
- **675772:** dự phòng thay tiếng bùng nếu `637533` nghe quá nhỏ hoặc quá “bếp”; không chồng hai nguồn.
- **447941:** không chọn cho bản đầu vì phần blast/cooldown dễ khiến người chơi nghe thành một đòn tấn công.
- **169449:** không thêm nhịp mồi riêng; một giây không cần cả tiếng bật gas rồi tiếng bùng.

Thay `sfx('buff')` hiện tại bằng tiếng mới để tránh phát đúp. NO FX chỉ giữ tiếng bùng một lần nếu âm thanh đang bật; nút tắt tiếng vẫn quyết định độc lập.

**5. Đưa trở lại Trang Chủ / màn Tướng: có, nhưng dùng bản nghỉ riêng**

Tôi đồng ý **sau khi chủ dự án duyệt**, sau cờ `.mika-rest-aura-enabled`, mặc định tắt.

Bản nghỉ lấy hai mảnh sườn đã duyệt, thu thành **hai lưỡi lửa thấp từ gót tới khoảng đầu gối**, đặt sau thân:

- Hình thái 2: opacity khoảng `.28`; hình thái 3 khoảng `.38`.
- Chu kỳ **6 và 7.3 giây**, trôi tối đa `.004H`, scale tối đa 1%.
- Không bóng cáo, không vòng quanh eo, không hạt bay liên tục, không tiếng.
- NO FX hoặc giảm chuyển động: ẩn.

Không bê nguyên cường độ Biến Thân về Trang Chủ; như vậy trạng thái chiến đấu vẫn có sức nặng riêng.

**6. Mockup để duyệt và prompt ImageGen**

Một ảnh gồm **ba khung điện thoại dọc đặt cạnh nhau**, cùng sân, cùng Mika hình thái 3, cùng kích thước và chỉ số. Chọn ba thời điểm:

1. **320ms:** bóng hồ linh đạt đỉnh.
2. **Sau 1 giây:** hai dải lửa duy trì, huy hiệu 3.
3. **Dư âm:** dấu than nhỏ, huy hiệu +10% theo fixture luật hiện tại.

Giữ cả bàn ngọc để thấy hiệu ứng không lấn xuống dưới. Ảnh 2 làm chuẩn nét và màu tướng; ảnh 3 chỉ là ví dụ cần tránh. Khi dựng nghiệm thu, ghép art Mika gốc đã khóa.

Prompt tiếng Anh:

```text
Use case: ui-mockup.
Asset type: Gemwoven combat VFX approval mockup.

Create one high-resolution comparison board, approximately 2400 × 1800
pixels, containing three equally sized portrait phone combat panels
placed side by side. Preserve the reference phone screen proportions.
Place short captions outside the game panels, never over gameplay.

Reference roles:
- Image 1 is the layout reference: preserve the ornate wooden and gold
  combat frame, forest ruin battlefield, HUD placement, enemy placement,
  turn controls, and complete 8 × 8 gem board.
- Image 2 is the locked Mika form-3 appearance and sharpness reference.
  Preserve her face, pose, red and gold costume, crescent weapon, and
  existing cream-white and orange nine tails.
- Image 3 is a negative VFX reference only. Do not reproduce its blurred
  swirling fire band, doubled contours, or washed-out appearance.

Primary request:
Show the same form-3 Mika in three transformation states. Treat her
existing artwork as an immutable insert. Add only separate painted VFX
around and behind her. Keep identical camera, hero scale, battlefield,
enemy, health bars, energy bars, and gem arrangement in all three panels.
Do not enlarge Mika to make the effect easier to see.

Visual language:
Match Gemwoven's crisp, richly painted fantasy game art. Use bold flame
shapes, clean antialiased edges, controlled highlights, and deliberate
negative space. Effects must remain readable when Mika is approximately
144 CSS pixels tall on a portrait phone.

Transformation palette:
Deep wine red #591923, vermilion #C93628, coral #F36338, and tiny peach-orange
highlights #FFB06A. Keep this clearly separate from Mika's existing pale
cream and orange tails. No broad yellow glow, white flame mass, bloom,
fog, or overall brightening of the hero.

LEFT PANEL — caption “IGNITION · 320 ms”
Show the peak of a brief transformation ignition.
Behind Mika, place one distinct spectral nine-tailed fox silhouette,
rendered as deep wine-red painted flame with a restrained coral edge.
Give the spirit a recognizable fox head, pointed ears, a small eye, and
nine separated broad tail lobes. Offset its head slightly to Mika's upper
right so it does not merge with her face.
The spirit is independent of Mika's physical tails: do not attach more
tails to her body.
Keep the spirit within roughly 1.08 times her visible body height in
width, below the HUD and inside the battlefield.
Add two rising side flames, a small open curl at her ankles, and six
sparse embers. Preserve clear visibility of her face, weapon, and costume.
Show the existing round transformation counter with “3”.

CENTRE PANEL — caption “ACTIVE · 3 TURNS”
Remove the large spectral fox completely.
Keep two distinct, asymmetrical painted flame ribbons hugging the outer
left and right edges of Mika's silhouette. The left ribbon is slightly
longer. Place both behind the hero, with open space through the centre.
Add only two low flame tips in front of her ankles and four sparse embers
near the sides. No flame belt across her waist, no rotating ring, and no
second pale tail fan.
The effect should suggest slow, smooth drifting of two stable painted
pieces, without motion blur, ghosting, or multiple animation poses.
Show the round counter with “3”.

RIGHT PANEL — caption “AFTERGLOW”
Remove the spectral fox, tall side flames, and airborne embers.
Keep only a tiny, crisp ember-red coal flourish behind Mika's heels,
approximately one quarter of her body height in width.
Show the existing residual-bonus badge with “+10%”.
Her original nine tails remain unchanged and fully visible.
This state must read as quiet remaining attack power.

Composition and invariants:
Keep Mika's HP at 1584 / 3520, energy at 20 / 100, and the enemy HP at
811 / 811 in all panels.
Preserve existing Vietnamese interface labels from the layout reference.
Keep every new effect below health and energy bars, clear of skill
announcements, clear of the enemy, and entirely above the gem board.
Do not add interface controls, character redesigns, new weapons,
screen flashes, camera shake, damage numbers, attack projectiles,
giant swords, a sun explosion, or foxes charging toward the enemy.
Do not produce an animation sheet. This is a three-state comparison
mockup showing three clean, individually readable snapshots.
```

Bản duyệt cần đạt **≥8/10 trên điện thoại và Studio**, với ba điều kiện bắt buộc: phân biệt được ba trạng thái khi thu nhỏ, Mika giữ nguyên độ nét, và không hiệu ứng nào che thông tin chiến đấu.