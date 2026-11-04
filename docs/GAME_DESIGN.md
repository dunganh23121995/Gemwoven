# Gemwoven · Thiết kế chiều sâu hệ thống

Bản 2 · 03/11/2026 · Claude soạn và triển khai, Codex phản biện (mục 20 ghi lại tranh luận và quyết định).
Phạm vi: vòng phát triển tướng, sát thương, kinh tế, kiếm tiền, sự kiện, đấu trường, xã hội, tải tài
nguyên theo gói và đường chuyển sang Godot + máy chủ riêng (Android trước).

Nguồn chạy được (khi số ở đây khác code thì code đúng):
- `src/gemwoven/progression.js` — luật dùng chung hub + combat (cấp, sao, hình thái, tiến hóa, kỹ năng,
  trang bị, mảnh Hiro, triệu hồi, chi tiết chỉ số, lộ trình).
- `src/gemwoven/liveops.js` — cấu hình VIP, thẻ, sổ hành trình, quỹ trưởng thành, nhịp sự kiện,
  hạng đấu trường, báu vật, danh hiệu (chưa trao gì; máy chủ sẽ quyết toán).
- `src/gemwoven/asset-packs.js` + `assets/packs.json` — gói tài nguyên theo tài khoản.
- `qa/gemwoven/balance-sim.cjs` — mô phỏng trận để đo tỷ lệ thắng.
- Kiểm thử: `qa/gemwoven/check-depth.cjs` (chạy trong `npm test`).

Ký hiệu: **[Có]** đã chạy · **[Đêm nay]** thêm ở đợt 03/11 · **[Đề xuất]** chờ làm · **[Máy chủ]** chỉ làm khi có server.

---

## 0. Nguyên tắc nền

1. **Mỗi trục phát triển có đúng một việc.** Người chơi luôn trả lời được "nâng cái này để làm gì".
2. **Hai đường độc lập, gặp nhau ở cổng.** Cấp (cày) và Sao (bản sao) chạy song song; Tiến hóa cần cả hai;
   Kỹ năng mở theo Tiến hóa; Hình thái mở theo Sao.
3. **Tướng miễn phí (Hiro) có đường lên đỉnh**, chậm hơn nhưng không bị chặn cứng.
4. **Tiền mua tốc độ, tiện lợi, sưu tập và sức mạnh PvE.** Mọi sức mạnh đều có đường PvE đạt được
   (chậm hơn). PvP có hàng Chuẩn Hóa nơi tiền không quyết định.
5. **Máy chủ quyết định mọi thứ có giá trị**: số dư, RNG, bàn ngọc, kết quả trận (kể cả PvE), phần thưởng,
   thứ hạng. Client chỉ hiển thị và gửi ý định.
6. **Đá Ngọc chỉ đến từ giao dịch nạp đã xác thực.** Thẻ tháng, quỹ trưởng thành giao Đá Ngọc theo ngày/mốc
   là *giao hàng của giao dịch* (sổ cái máy chủ, gắn mã giao dịch). Không bao giờ từ ải, nhiệm vụ, offline, triệu hồi,
   sự kiện, đấu trường, sổ hành trình hay **thư quà của admin**. Phần thẻ tháng chưa nhận có thể hiện trong Hòm Thư
   ở mục *Giao dịch* (thư hệ thống do máy chủ thanh toán tạo, không phải quà admin). Vé triệu hồi thì được thưởng từ gameplay.
7. Tính năng chưa phát hành ghi rõ **Sắp ra mắt**. Không giả người chơi, không giả BXH.

---

## 1. Bản đồ phát triển tướng

| Trục | Việc duy nhất | Tài nguyên | Cổng | Trạng thái |
|---|---|---|---|---|
| **Cấp** 1–500 | HP +4,5%, Công +1,8% mỗi cấp | Vàng, Sách EXP, Ấn (trần 1.600/ngày) | Không khóa bởi sao | [Có] |
| **Sao** 1–6★ | HP +12%, Công +9% mỗi sao; **mở Hình thái** | **Bản dư có sao** (80 mảnh = 1 bản 1★; 2 bản s★ luyện thành 1 bản (s+1)★), vàng, tinh hoa; s→s+1 cần 1 bản s★ (Hiro: bản thường 1/2/3/5/8) | Bản dư | [Có · 04/11] |
| **Hình thái** 1–3 | Dáng + bộ tuyệt kỹ (×1 / ×1,1 / ×1,25 + đặc tính 6★) | 4★ → H2, 6★ → H3 | Sao | [Có]; diện mạo tùy chọn [Đêm nay] |
| **Tiến hóa** 0–6 | Mở nhánh kỹ năng, năng lượng đầu trận, mảnh giáp; HP +10%, Công +7%/bậc | Vàng, tinh hoa, quặng | **Cấp + Sao** | [Có] |
| **Kỹ năng** 4 × 10 | Đổi *cách* thắng | Vàng, bí kíp, tinh hoa | Cấp + Tiến hóa | [Có] |
| **Trang bị** 6 ô | Chỉ số; đồ Thần có thuộc tính | Rèn, triệu hồi, cửa hàng | Ải | [Có] |
| **Bảo bối riêng** | +0,25% HP/Công mỗi cấp, 5 dạng | Vàng, tinh hoa, quặng, thần thạch | Cấp tướng | [Có] |
| **Ngọc khảm** | Chỉ số hiếm | Boss Vô Hạn, sự kiện | Đồ Hiếm+ có lỗ | [Đề xuất] |
| **Báu vật** | % chỉ số + một hiệu ứng riêng | Sự kiện (PvE + nạp), mùa | 2 ô/tướng | [Đề xuất] |
| **Danh hiệu, khung** | Trang trí, khoe | Thành tích, mùa, sự kiện | — | [Đề xuất] |

### 1.1 Chuỗi ràng buộc

```
Cấp ──────────────┐
                  ├──► Tiến hóa 1..6 ──► Bị động (cấp 10) · Biến Dị (cấp 100 + TH2) · Chân Thân/Biến Thân (cấp 180 + TH3)
Sao (bản sao) ────┤                     · năng lượng đầu trận (TH3: 20, TH6: 40)
                  └──► Hình thái: 4★ → H2 · 6★ → H3
Trang bị / Bảo bối / Ngọc / Báu vật ──► chỉ số; KHÔNG đổi hình thái, KHÔNG mở kỹ năng
```

**Trả lời các câu hỏi cụ thể:**
- *Khi nào biến hình?* Ở 4★ (hình thái 2) và 6★ (hình thái 3). Hình thái thuộc **sao**, không thuộc tiến hóa
  hay trang bị. Tiến hóa chỉ gắn mảnh giáp linh lực lên hình hiện có.
- *Form 2 mang vũ khí Thần thoại được không?* **Được.** Trang bị là linh khí cộng chỉ số, không thay vũ khí
  đã vẽ của hình thái. Mọi hình thái mặc được mọi trang bị.
- *Form 3 không có vũ khí thì biến thân được không?* **Được.** Thiếu vũ khí chỉ thiếu Công.
- *Ngoại lệ có chủ đích:* **Vũ khí bản mệnh** (3.3) — khi đúng chủ mang, tuyệt kỹ thêm một hiệu ứng.
- *Nâng sao rồi còn dùng hình thái cũ?* **Có, miễn phí** [Đêm nay]. Hình thái đã mở không mất. Chọn
  **diện mạo ở thị trấn** (Home, Tướng, bản đồ, sau này Quảng Trường) bằng nút "Khoác diện mạo này" trong
  bảng Hình thái. **Trong trận luôn là hình thái cao nhất** — vì hoạt cảnh tuyệt kỹ gắn với bộ kỹ năng
  của từng hình thái; trộn dáng cũ với kỹ năng mới sẽ sai hình. Lên sao mở hình thái mới: chưa chọn diện mạo thì tự khoác hình mới; đã chọn diện mạo cũ thì giữ lựa chọn ấy (vòng Nghi thức biến hình).
- *Chế độ biến hình trong trận?* Có, qua nhánh **Chân Thân** (2.4).

### 1.2 Hiro và người chơi miễn phí [Đêm nay]

Lỗi cũ: Hiro không có trong triệu hồi và không có nguồn mảnh → **kẹt 1★**, không qua tiến hóa 2,
không bao giờ mở Biến Dị/Chân Thân.

Nguồn **Mảnh Hiro** (không bán bằng tiền), 80 mảnh = 1 bản sao:
| Nguồn | Lượng | Ghi chú |
|---|---|---|
| Hành Trình Tân Thủ 7 ngày (trang Sự Kiện) | 80 (10×6 + 20) | lỡ ngày nhận bù → **2★ trong tuần đầu** |
| Nhiệm vụ ngày "Thắng 3 trận vượt ải" | 6/ngày ≈ 42/tuần | PvE, không cần PvP |
| Rương sao chương | 100 sao: 10 · 150 sao: 20 | 24 chương → 720 |
| Boss Vô Hạn | 10 mỗi tầng chia hết cho 10 (lần đầu) | |

6★ cần 19 bản sao = 1.520 mảnh → khoảng 7–9 tháng chơi đều (80 + ~2.200/năm từ nhiệm vụ + rương + tầng).
**Hình thái Hiro** (Codex đồng ý): hai hình thái mới ở **4★/6★** như mọi tướng. **Concept chờ duyệt** [Đêm nay]
(Codex vẽ, `gpt-6.1-sol` low, từ ảnh Hiro hình thái 1 đã khóa; chưa đưa vào game):

![Hiro hình thái 1 · 2 · 3](assets/heroes/forms/novice/concepts/lineup.webp)

- **Hình thái 2 · Lữ Khách Kiếm Sĩ (4★):** kiếm thép có ngọc lục ở chuôi, áo choàng nửa vai màu rêu, giáp vai thép
  bên tay kiếm, khăn dài cài khoen đồng, túi bản đồ. Vẫn gam đất — vẫn là cậu lữ khách, chỉ mạnh hơn.
- **Hình thái 3 · Anh Hùng Diệu Ngọc (6★):** giáp bạch kim viền vàng, ngực khảm vòng ngọc bốn hệ (hồng, lam, lục,
  tím), khăn thành áo choàng xanh thêu vàng hoa văn dệt ngọc, trường kiếm lưỡi khảm dải ngọc bốn màu.
- Duyệt xong mới làm theo `docs/HERO_PIPELINE.md` (sheet trận, showcase, rig, tuyệt kỹ, âm thanh). Gợi ý tuyệt kỹ:
  H2 "Lữ Kiếm Liên Trảm" (2 nhát), H3 "Diệu Ngọc Tứ Hệ Trảm" (4 nhát, mỗi nhát một hệ, nhát cuối khắc hệ đối thủ).

---

## 2. Kỹ năng: giữ bốn nhánh

Có cần chia Chủ động / Bị động / Biến Dị / Chân Thân? **Có** — bốn nhánh mở ở bốn thời điểm, tạo bốn mục tiêu
ngắn–dài. Mỗi nhánh phải đổi *cách chơi*, không chỉ cộng số.

| Nhánh | Vai trò | Mở | Ví dụ |
|---|---|---|---|
| **Chủ động** (Tuyệt kỹ) | Chiêu khi đầy năng lượng; tên, hình, số đòn theo hình thái | Ngay | Ngũ Ảnh Trảm → Hắc Liêm Đoạt Hồn |
| **Bị động** (Thiên phú) | Luôn bật, định hình cách xếp ngọc | Cấp 10 | Lumi năng lượng ×2; Yuki giảm 20% sát thương |
| **Biến Dị** | Hiệu ứng nguyên tố sau mỗi tuyệt kỹ | Cấp 100 + TH2 | Mika thiêu đốt; Lumi hút năng lượng |
| **Chân Thân** | **Biến Thân** một lần mỗi trận [Có] | Cấp 180 + TH3 (cấp 400 + TH5 mạnh hơn) | xem 2.4 |

### 2.1 Hiển thị
Bảng **Lộ trình phát triển** [Đêm nay] cho thấy từng nhánh: đã mở chưa, cần cấp/tiến hóa nào, nút "Đi tới".

### 2.2 Tướng chưa sở hữu [Đêm nay]
Vẫn hiện trong danh sách (đó là mồi sưu tầm), làm **xám + biểu tượng khóa**. Bấm vào xem được kỹ năng, hình
thái, số mảnh và cách có tướng.

### 2.3 Cây kỹ năng khi tướng có thêm kỹ năng [Có · Claude + Codex, 04/11]
Chủ dự án (04/11): "bỏ phần mô tả yêu cầu và tên ngay cạnh kỹ năng … tướng sau này phát triển thêm kỹ năng thì sao?".
- **Trên cây chỉ còn hình**: huy hiệu + bảng hạng `4/10` (đã học), `Học` + mầm (mở mà chưa học), khung ổ khóa (chưa
  mở). Tên, nhánh, điều kiện "Cần … / Hiện tại …" chỉ ở bảng chi tiết bên dưới.
- **Cây đọc từ danh sách kỹ năng của tướng** (`skill-tree.js` `skillList`), N nút xếp từ gốc lên ngọn theo thứ tự mở.
  Hôm nay mọi tướng có 4 (Chủ Động → Bị Động → Biến Dị → Chân Thân, cổng ở `SKILL_GATES`); kỹ năng thêm sau này mang
  điều kiện của riêng nó trong dữ liệu, **không suy điều kiện hay quan hệ học trước từ vị trí trên cành**.
- **Cành mọc theo chu kỳ hai ổ**: cành `bough2` cắt qua tâm ổ thành gốc (ổ 1, 2), chu kỳ (nửa trên ổ 1 → ổ 2 → nửa dưới
  ổ 3) và ngọn (nửa trên ổ 3 → ổ 4, nhánh nụ). Số ổ = `2 × ceil(N/2)`, số chu kỳ chèn `k = ceil((N−4)/2)`, mỗi chu kỳ
  cao 305,44 đơn vị; N = 4 là đúng tranh cũ. Đường cắt luôn nằm dưới ổ gỗ / khung khóa nên không thấy mối nối; mỗi chu
  kỳ đặt lệch 7,8 đơn vị sang trái (cành hơi nghiêng) thay vì lộ mối nối. **N lẻ**: ổ ngọn dư được che bằng chùm lá
  (không ổ, không chạm). Nhánh bên để dành cho sau, không dùng cho kỹ năng nối tiếp (dễ đọc thành nhánh lựa chọn).
- **Một nụ "Sắp ra mắt"** duy nhất, luôn ở nhánh nhỏ của ngọn, đi theo ngọn khi cây dài ra.
- **Cuộn**: N ≤ 4 không cuộn (vùng cây `[370,230,550,676]`); N > 4 vùng cây `[370,120,571,786]` cuộn dọc (kéo tay,
  kéo chuột, lăn chuột), mờ dần ở mép trên/dưới chỉ khi phía đó còn cây, hai nút lá chạm (lên / xuống) cuộn đúng một chu
  kỳ, ẩn khi đã tới đầu. Không có số trang hay chấm. Mở màn: kỹ năng gốc được chọn, cây ở gốc; về lại thì giữ vị trí.
  **Nút đang chọn luôn trong tầm nhìn**: chọn một nút ở mép thì cây cuộn tới nó; tự cuộn đi xa thì khi dừng, nút gần
  nhất còn thấy được chọn (bảng dưới đổi theo, không học, không tiêu gì).
- Đường sáng từ gốc tới nút chọn và sợi sáng xuống bảng giữ nguyên; sợi sáng không cuộn.
- Kiểm tra bằng tướng QA giả (`window.GEMWOVEN_QA_SKILLS = 8` chỉ trong QA; game không bao giờ đặt), không thêm kỹ
  năng cho tướng thật, không đổi luật; `node qa/gemwoven/check-skill-tree.cjs` kiểm tra trên trình duyệt (4 kỹ năng thật,
  QA 8 và QA 7). Codex: phác thảo, mockup và chấm bản dựng ở `assets/gemwoven/raw/skill-tree/pass3`.

### 2.4 Biến Thân (nhánh Chân Thân) [Có · Codex vòng 4]
- Một lần mỗi trận: thanh năng lượng có vạch **Biến Thân**; kích hoạt khi HP ≤ 50% hoặc sau tuyệt kỹ thứ hai.
- 3 lượt (cấp 400 + TH5: 4): giảm 15% sát thương nhận (+1% mỗi cấp Chân Thân), miễn choáng/đóng băng mới, và **hiệu ứng
  bàn ngọc riêng của tướng** (vòng Bàn ngọc, chủ dự án 05/11; thay Công +25..40% chung; **không còn dư âm sức mạnh**,
  dư âm chỉ là hình). Cấp 1, mỗi cấp thêm chút: Hiro nhóm Kiếm đầu lượt +10% (+0,5%/cấp, vẫn yếu hơn +25% cũ);
  Mika nhóm Kiếm đầu lượt đặt thiêu đốt 16×Công/lượt × 2 lượt (+4%/cấp); Yuki 2 Băng đủ đóng băng (trùm: thanh 4);
  Nori Tim/Khiên ×1,5 (+0,02/cấp), 25% máu hồi dư thành giáp (trần 4% HP/lượt); Lumi tím 16 nộ/viên (+0,3/cấp),
  tối đa 75 nộ/lượt; Noct combo từ đợt 2 Kiếm chí mạng ×1,5 (+0,02/cấp), combo 3 đợt né đòn thường kế tiếp (một lần).
  Số trong `progression.js` `transformEffect`, áp dụng ở `live-combat.js` / `board-control.js`.
- **Cổng mới khi làm Biến Thân: cấp 180 + TH3** (Codex: cấp 400 cần tối thiểu 190 ngày theo trần Ấn —
  khoảnh khắc hay nhất không được đến muộn vậy). Cấp 400 + TH5 nâng hiệu quả Biến Thân.
- Tắt trong hàng PvP Chuẩn Hóa, 1vs1 cùng máy và giao hữu. **Đã làm:** nút "BIẾN THÂN" cạnh tướng hiện khi HP ≤ 50% hoặc sau tuyệt kỹ thứ hai; bấm không tốn lượt; đếm theo lượt của tướng; miễn choáng/đóng băng mới; hào quang vàng; dư âm sau đó; bỏ thưởng Công/HP Chân Thân cũ. Bot trận thật tự bấm Biến Thân.
- **Diện mạo Biến Thân vẽ theo hệ (chủ dự án 04/11, phương án A; Codex lên kế hoạch, mockup 8,4, bản dựng điện thoại 8,5 / Studio 8,8):** mỗi tướng một bộ 7 mảnh vẽ (spirit, hai dải sườn, vật ở chân, hai hạt, dấu dư âm) dùng chung 3 hình thái, đặt theo thân (`--evo-top/h/x`), cỡ và độ rộng chỉnh theo hình thái. Bùng 1 giây khi bấm (linh thú hiện từ chân, giữ 240–380ms, tan ở 720ms; hai dải sườn dựng lên), 3 lượt hai dải trôi chậm lệch pha (2,8 / 3,4 giây) + lửa ở chân + vài hạt bay, lùi còn 35% khi tướng ra đòn; dư âm còn một dấu nhỏ sau gót. Mỗi mảnh là một ảnh vẽ chuyển động nguyên khối, không sheet đổi khung. Hai tiếng thu thật (bùng; hạ xuống dư âm), thay tiếng buff chung. NO FX ẩn toàn bộ. Luật không đổi. Mika: cáo chín đuôi đỏ rượu bùng lên. **Đủ 6 tướng (chủ dự án: "vẽ luôn cho các nhân vật khác")**, mỗi tướng Codex chấm trong trận thật ≥8,5 ở điện thoại dọc, ngang và Studio: Hiro — ấn đường hành hương gam đất, nút thoi phải-trên (chỉ hình ảnh, không thêm sức mạnh); Yuki — thỏ tuyết linh bằng sương băng, tuyết rơi chậm; Nori — ấn cổ thụ ba tán lệch phải, dải vỏ cây, lá bay chậm; Lumi — tinh ấn điện bốn mũi tím, sao trôi ngang, không chớp; Noct — ấn màn bóng khuyết tím xám, hào quang khóa giữ nguyên. Vị trí theo hộp thân của từng hình thái (khung nghỉ), sườn đặt ngoài bề rộng thân; Hiro/Nori/Noct có viền cứng 1px tối + 1px sáng theo hệ để tách khỏi nền đá, lá và hào quang tối. Tướng chưa phát hành đã có bộ sẵn cho live-ops mở sau. Code `src/transform-fx.js/.css`, mảnh `assets/heroes/forms/<hero>/transform/`, xử lý `assets/heroes/forms/transform_prep.py`, âm `scripts/prepare_transform_sounds.py`, thô + kế hoạch + điểm `assets/gemwoven/raw/transform-<hero>/`. Hào quang nghỉ của Mika (hai lưỡi lửa thấp, H2/H3, ở Trang Chủ / Tướng) đã dựng sau cờ `html.mika-rest-aura-enabled`, tắt mặc định, chờ chủ dự án duyệt (xem trước: `?restaura`).

- **Biến Thân v2 · linh thần + hào quang (chủ dự án 04/11, Mika trước; đã duyệt):** bấm BIẾN THÂN thì sân quanh tướng tối đi, một **linh thần khổng lồ trong suốt** (Mika: nữ thần cáo chín đuôi bằng nét lửa sáng, không vũ khí) mọc lên đứng trên chân tướng, mặt thẳng trên đầu tướng, hai tay ôm vòng xuống; cao tới 2,5 thân, tự co để cả hình nằm trong sân (mép trái được che một ít); hiện → giữ → thở → tan tại chỗ trong 2,6 giây. Lúc linh thần hiện, thanh máu và hàng hiệu ứng **giữ nguyên chỗ, mờ còn 30%** rồi hiện lại. Khi linh thần tan, **hào quang mịn bám sát thân** (dựng từ chính hình bóng khung hiện tại của tướng: viền sáng vàng-cam ôm đường viền, lớp sáng rộng với dải sáng trôi chậm dọc thân, quầng sáng mềm ở chân; không lưỡi lửa, không hình đuôi) giữ suốt 3 lượt; dư âm là viền đó mỏng và mờ hơn. Âm thanh: tiếng của hệ tướng + **một tiếng chung cho mọi tướng** (gió vút nhẹ rồi tiếng va trầm, ngân dài; 2 bản ghi CC0, `assets/audio/hero-forms/transform/spirit-rise.wav`); bản dự phòng "gió vút trầm" để trong Kho dự phòng của thư viện âm thanh. Linh thần: `assets/heroes/forms/transform_spirit.py`, bật bằng `transform/v2.json`. Codex soát khắt khe 7 vòng → dọc 8,5 / ngang 8,6 / Studio 8,6. Các tướng khác chờ chủ dự án duyệt Mika.
- **Linh thần tan thành sương, hào quang theo mọi tư thế (chủ dự án 04–05/11, Mika đã duyệt):** mốc thời gian tính từ lúc bấm: linh thần đầy đủ ở 600 ms; ở **880 ms** (`TRANSFORM_DISSOLVE_MS`) linh thần loé sáng rồi nhoè, nở và tan, năm làn sương vẽ tay của chính tướng (`transform/mist.webp`: một làn xoắn bay lên từ đầu, hai dải tách sang hai bên từ vai, hai cụm từ hai tay) trôi ra ngoài và lên trên rồi mỏng dần tới ~2,2 s; hào quang bùng lên cùng nhịp 880 ms. Tiếng chung bắt đầu ở 880 + `TRANSFORM_SOUND_AFTER_DISSOLVE_MS` (−450, chủ dự án chọn) = **430 ms**, tiếng va mạnh nhất của nó ở ~1.310 ms. Studio tướng có thanh "Âm (ms)" để thử lệch khác (chỉ để thử, không lưu). Hào quang (bóng sáng dựng từ hình tướng) chép mọi khung và mọi chuyển động của thân ở từng nhịp vẽ, nên theo tướng khi chém, tung tuyệt kỹ, bị đánh, lướt, nhận buff; dư âm cũng vậy. Sửa kèm: nhát chém của địch có mốc chạm muộn làm lỗi thứ tự khung hoạt cảnh (`combatV3Slash`).
- **Các tướng còn lại (05/11):** Yuki (nữ thần thỏ tuyết, sương băng, hào quang xanh băng), Nori (thần hươu rừng **nam** gạc cổ thụ, sương lá, hào quang xanh lá-vàng), Lumi (nữ thần sao-bão, sương sao, hào quang tím), Noct (u hồn trăng đội mũ trùm, sương tối, hào quang tím; bản hào quang đen đã thử và bị bỏ, vẫn giữ trong code: `NOCT_AURA='black'` trong `src/transform-fx.js`). **Hiro không có linh thần**: chỉ hào quang ánh đất bùng ngay khi bấm, theo mọi tư thế, không sương, không tiếng linh thần (chỉ để nhìn, không cộng sức mạnh). Màu hào quang từng hệ ở cuối `src/transform-fx.css`; `transform/v2.json` có `"spirit": false` cho tướng không linh thần.
---

## 3. Trang bị, vũ khí bản mệnh, ngọc khảm

- **Trang bị [Có]:** 6 ô, 6 phẩm (hệ số 1/1,6/2,5/4/7/11), +20 luôn thành công, chuyển chủ tự tháo.
- **Nâng Phẩm [Có · Claude + Codex 04/11, chủ dự án duyệt]:** một món + nguyên liệu → phẩm kế (Thường → … → Thần),
  **luôn thành công**, không thất bại, không bảo hiểm (Codex: thất bại làm công cày khó đoán; bán bảo hiểm thành trả tiền
  tránh mất mát; ngẫu nhiên đã có ở triệu hồi và thuộc tính Thần). Giữ ô, tướng đang mặc, cấp cường hóa và mọi ngọc; phẩm
  mới mở thêm lỗ (Hiếm 1 … Thần 4); lên Thần nhận một thuộc tính ngẫu nhiên. **Phí = phí rèn phẩm đích − phẩm nguồn**
  (`rarityUpCost` tính từ `craftCost`, nên nâng tuần tự Thường → Thần tốn đúng phí rèn Thần); cổng ải = cổng rèn phẩm đích:

  | Nâng | Ải | Vàng | Quặng / Gỗ / Vải / Tinh hoa | Thần thạch |
  |---|---:|---:|---|---:|
  | Thường → Tốt | 20 | 8.000 | 25 / 15 / 15 / 10 | — |
  | Tốt → Hiếm | 40 | 24.000 | 25 / 15 / 15 / 10 | — |
  | Hiếm → Sử Thi | 60 | 40.000 | 25 / 15 / 15 / 10 | — |
  | Sử Thi → Huyền Thoại | 80 | 56.000 | 25 / 15 / 15 / 10 | — |
  | Huyền Thoại → Thần | 300 | 72.000 | 25 / 15 / 15 / 10 | 50 |

  **Đồ hiến (tùy chọn):** 0–3 món cùng phẩm với món đang nâng, ô bất kỳ, chủ bất kỳ; không phải chính món đó; loại món đang
  mặc, đã khóa, vũ khí bản mệnh (kiểm lại lúc xác nhận); người chơi tự chọn, không chọn sẵn. Mỗi món giảm 20% quặng/gỗ/vải
  của phí gốc, cộng thẳng, trần 60%, làm tròn lên từng loại (3 món: 25/15/15 → 10/6/6); vàng, tinh hoa, thần thạch không
  giảm (lên Thần vẫn 50). Món hiến hoàn 70% vàng/quặng cường hóa đã trả (làm tròn xuống) và trả 100% ngọc về túi; không
  có giá phân rã cơ bản, không hoàn phí rèn/nâng. Tiêu hao, nâng và hoàn trong một giao dịch (`upgradeRarity(id, hiến)`).
  Phân rã vẫn hoàn 70% **phí cường hóa** (không hoàn phí nâng phẩm). Rèn trực tiếp mọi phẩm giữ nguyên; cường hóa vẫn 100%.
  Sau ải 300, nhiệm vụ tuần "Thắng 8 trận Trùm Vô Tận" thêm **10 thần thạch** (riêng nguồn này đủ 50 sau 5 tuần).
  Giao diện: Lò Rèn → tab thứ tư **Nâng Phẩm**, không có "%" nào (luôn thành công). Vũ khí bản mệnh dùng hệ riêng.
- **Bộ hệ [Đề xuất]:** đồ Sử thi+ có hệ; 2/4/6 món cùng hệ tướng: +5/+12/+20% Công. Không khóa.
- **Vũ khí bản mệnh [Đề xuất · nguồn thu]:** mỗi tướng hiếm một món riêng; đúng chủ mang thì tuyệt kỹ thêm một
  hiệu ứng (Mika thiêu lan, Noct +1 nhát, Yuki +1 lượt choáng). Banner vũ khí chạy song song banner tướng,
  có bảo đảm riêng; tinh luyện 1–5 bằng bản trùng.
- **Ngọc khảm "Dệt Ngọc" [Đề xuất]:** Hiếm 1 lỗ → Thần 4 lỗ. 5 loại (Công%, HP%, Thủ, kháng hiệu ứng, chính
  xác hiệu ứng), 5 cấp, ghép 3→1. Tháo miễn phí. Nguồn chính: Boss Vô Hạn.
  Không thêm bạo kích ngẫu nhiên lúc này (Codex: chồng lên chí mạng chuỗi sẽ khó đọc và khó cân bằng).

---

## 4. Báu vật [Đề xuất]

Vật của tài khoản, gắn vào tướng (2 ô, ô 2 mở ở TH3), chuyển giữa tướng miễn phí.

| Phẩm | Chỉ số | Nguồn |
|---|---|---|
| Lam | +4% một chỉ số | cửa hàng sự kiện |
| Tím | +8% hai chỉ số | sự kiện PvE, tích nạp nhỏ |
| Cam | +12% hai chỉ số | sự kiện PvE (tích điểm), tích nạp |
| Đỏ | +16% ba chỉ số | sự kiện PvE dài (12–16 tuần), tích nạp mốc cao |
| Thần | +20% ba chỉ số | mảnh từ nhiều mùa PvE, tích nạp lớn |

**Quyết định với Codex:** không có sức mạnh độc quyền cho người nạp. Mọi phẩm đều đạt được qua PvE trong
khoảng 12–16 tuần; nạp chỉ nhanh hơn. Thưởng đua top/mùa là **trang trí**, không phải báu vật mạnh
(tránh vòng "thắng → mạnh hơn → thắng tiếp").

**Ngân sách PvE (mục tiêu kiểm bằng dữ liệu khi có máy chủ):** mỗi kỳ sự kiện 2 tuần cho ~600 Điểm Báu Vật từ boss
sự kiện + nhiệm vụ (không nạp). Đổi: Tím 300 · Cam 900 (≈ 3 kỳ) · mảnh Đỏ 150/mảnh, 10 mảnh (≈ 6 kỳ = 12 tuần) · mảnh Thần
200/mảnh, 12 mảnh (≈ 8 kỳ = 16 tuần). Tích nạp cho thêm điểm và mảnh, không cho vật phẩm khác loại.

Ba họ hiệu ứng (`liveops.js`):
1. **Phá Sơn** — tuyệt kỹ thêm % HP tối đa của mục tiêu, **tối đa 8× Công**, chỉ PvE.
2. **Mượn Hồn** — mang tối đa 50% hiệu lực một **bị động** của tướng khác; không mượn tuyệt kỹ.
3. **Khắc Chế** — giảm năng lượng địch khi trúng tuyệt kỹ, kháng choáng; tắt ở Chuẩn Hóa.

---

## 5. Sát thương

### 5.1 Công thức hiện tại [Có]
- `Công = hệ số × (1+1,8%·(cấp−1)) × (1+9%·(sao−1)) × (1+7%·TH) + đồ`, rồi × bảo bối × bị động × Chân Thân.
  `HP` tương tự (4,5%/cấp, 12%/sao, 10%/TH). Bảng nguồn: `statParts()` — hub hiển thị đúng phép tính này.
- Viên kiếm: `8 × hệ số kiếm (Mika 1,6) × Công`; sóng kiếm liên tiếp +15% mỗi sóng (tối đa +90%), sóng thứ
  3/6/9 **chí mạng ×1,5**.
- Khắc hệ ×1,5 (Lửa > Băng > Đất > Sét > Lửa); Noct không bị khắc.
- Tuyệt kỹ: `gốc × (cấp kỹ năng × hình thái × tiến hóa) × Công`. Hiro gốc **45 → 70** [Đêm nay].
- Nhận đòn × (1 − Thủ), Thủ tối đa 50%; giáp hấp thụ trước HP.
- Boss chương: chiêu khi đủ 80 năng lượng, mạnh thêm 6%/chương; quái thường/tinh anh theo chu kỳ 4 lượt
  (giáp, chiêu, hồi máu). Tinh anh cuối chương (ải 45) mang tuyệt kỹ boss (AGENTS.md).

### 5.2 Đo bằng mô phỏng [Đêm nay]
`node qa/gemwoven/balance-sim.cjs 200` — bàn 8×8 có seed, rơi ngọc, sóng, chí mạng, năng lượng, tuyệt kỹ,
chiêu boss. Là bản giản lược (không có hộ vệ, pha boss muộn) nên dùng để **so sánh**, không phải con số tuyệt đối.
"Trần" = chỉ lên cấp (không đồ, kỹ năng cấp 1). "Có đồ" = đồ theo cổng rèn, kỹ năng theo cấp.

| Boss | Cấp | Hiro trần | Hiro 1★ có đồ | Hiro 2★ có đồ | Mika trần | Mika 1★ có đồ | Mika 4★ |
|---|---|---|---|---|---|---|---|
| Chương 2 (ải 100, gợi ý 50) | 50 | 6% | 54% | 70% | 57% | 96% | 100% |
| | 75 | 36% | 100% | 100% | 92% | 100% | 100% |
| | 100 | 75% | 100% | 100% | 99% | 100% | 100% |
| Chương 5 (ải 250, gợi ý 125) | 125 | 0% | 16% | 81% | 2% | 80% | 100% |
| | 188 | 1% | 92% | 100% | 35% | 100% | 100% |
| | 250 | 17% | 100% | 100% | 82% | 100% | 100% |

Số liệu sau khi áp tuyệt kỹ Hiro 70 và kiếm ×1,2, 200 trận mỗi ô, không giới hạn lượt (vòng 2: Codex phát hiện bản đầu
xử thua ở lượt 60 trong khi combat thật không có luật đó). Số lượt khi thắng: Hiro 1★ 26–53, Mika 1★ 11–25, Mika 4★ 8–18.

**Kết luận:**
1. "Hiro cấp 100 khó qua boss chương 2" là **do chỉ lên cấp**: Hiro trần cấp 50 thắng 6%, cấp 100 vẫn chỉ 75% và mất
   hơn 40 lượt. Trang bị + kỹ năng quan trọng gần ngang cấp, và trước đây không có gì dẫn người chơi tới đó →
   **Lộ trình** và **Chi tiết lực chiến** [Đêm nay].
2. Có đồ, Hiro 1★ ở cấp gợi ý thắng boss chương 2 ~54% — đúng mục tiêu ~50%. Chương 5 tụt còn 16%: boss mạnh thêm
   6%/chương, nên người chơi miễn phí cần **2★ (81%)** hoặc vượt cấp gợi ý ~1,5× — Mảnh Hiro được thiết kế cho đúng chỗ này.
3. Tướng hiếm 1★ có đồ ~80–96% ở cấp gợi ý: **kỹ năng đặc biệt tăng xác suất qua ải**, đúng định hướng.
4. **Đã áp [Đêm nay]:** tuyệt kỹ Hiro 70 và **kiếm lữ khách ×1,2** (ngoài PvP chuẩn hóa). Chưa hạ HP boss (Codex: chỉ
   hạ tối đa 10% nếu vẫn hụt mục tiêu). Codex chưa đồng ý *chốt* cân bằng cho tới khi mô phỏng được đối chiếu với combat
   thật (hộ vệ, pha boss muộn, ngọc đặc biệt) — đó là việc kế tiếp số 1.

### 5.3 Mục tiêu cân bằng
| Trận | Ở cấp gợi ý, có đồ | Thắng |
|---|---|---|
| Quái thường | 4–8 lượt | ≥ 95% |
| Tinh anh | 8–12 lượt | ~75% |
| Boss chương | 14–25 lượt | Hiro ~50%, tướng hiếm 1★ ~75–90%, 4★ ~95% |

### 5.4 Đặc tả lõi trận (cần cho máy chủ)
- **Lượt** = một nước đổi ngọc của một bên + toàn bộ sóng rơi + tuyệt kỹ/chiêu sau đó.
- **Thứ tự đầu lượt:** hiệu ứng theo thời gian (thiêu đốt, độc) → hồi máu theo lượt → kiểm tra choáng/đóng
  băng → hành động → hiệu ứng trang bị cuối lượt (Hộ thân, Bất động).
- **Chống khóa choáng:** sau khi hết choáng, mục tiêu miễn choáng 1 lượt (đề xuất, chưa có trong combat).
- **Hòa:** hai bên cùng về 0 trong một lượt → bên đang hành động thua (PvP); PvE tính thua.
- **Lợi thế đi trước (PvP):** người đi sau bắt đầu với +15 năng lượng (đề xuất, đo bằng mô phỏng).
- Mỗi trận ghi **phiên bản luật**; đổi luật không áp lên trận đang chạy.

---

### 5.4b Luật bàn ngọc chung [Có · vòng Bàn ngọc, chủ dự án 05/11]
Một bảng dữ liệu dùng chung cho trận (`src/live-combat.js`, `src/board-control.js`), AI đối thủ (`src/opponent-ai.js`) và mô
phỏng (`qa/gemwoven/balance-sim.cjs`): `src/gemwoven/board-rules.js`.

| Luật | Số |
|---|---|
| Nộ người chơi (và hai bên trong PvP) mỗi viên Kiếm/Tim/Tím/Băng/Khiên | **3/2/7/2/2**; Lumi tím 10 (+0,2/cấp Bị Động), màu khác theo bảng |
| Nộ combo (số đợt trong một lần giải bàn) 1/2/3/4/≥5 | **+0/3/6/10/15**, nhận một mức |
| Nộ quái PvE | 3/viên, +25 ở viên tím đầu; Băng quái **không** hút nộ nữa |
| Tuyệt kỹ | 100 nộ, thanh tối đa 199, **một tuyệt kỹ mỗi lượt của mình**, tung sau khi bàn giải xong |
| Băng | thường/tinh anh: 3 Băng trong một lần giải bàn → đóng băng; trùm: thanh **0/6 cộng dồn qua các lượt** |
| Chống khóa | sau choáng/đóng băng, quái phải hành động đủ **1** lượt (trùm **2**) mới bị khống chế lại; Phong ấn Nori lúc đó chỉ tích sát thương |
| Kiếm quái | thường ×0,55, trùm **×0,82** (trước 1,15; trùm mất phần lớn lượt bị khóa nên đánh nhẹ lại) |

Ô trạng thái: "Tích băng n/6" trên trùm, "Kháng khống chế" khi đang được bảo hộ. Đo (200–300 trận/ô, cấp gợi ý, có đồ):
khóa lượt quái 35% → 14% (trùm), Hiro trùm ải 100 54% → 51%, ải 50 89% → 94%; tướng hiếm 1★ trùm 96–100%; nhịp
tuyệt kỹ ~4,7 → ~4,2 lượt (Lumi 2,1 → 3,5). Chưa đạt: Nori trận trùm 120–140 lượt (1★ 72–75%), chờ chủ dự án chốt.

### 5.5 Biểu tượng hiệu ứng trên đầu nhân vật, tên tài khoản PvP [Có · Claude + Codex, 04/11]
Chủ dự án: "Không cần hiện tên… thay bằng biểu tượng băng, ×2, suy kiệt, thiêu đốt, choáng… các hiệu ứng buff, bất lợi"; "Sau PvP thì tên
tài khoản hiển thị góc trên màn combat (không đè lên các hiệu ứng)".
- Biển tên trên thanh máu thành **một hàng ô vẽ** (`src/combat-status.js/.css`, ảnh `assets/combat-status/`): mất lượt → bất lợi khác →
  có lợi, thứ tự cố định; tối đa 5 ô (4 ô + "+N" khi nhiều hơn). Lượt còn lại góc phải trên, tầng ×N góc trái dưới, hệ số (×1,5 khắc hệ,
  ×1,25 cuồng nộ) dưới hình; hiệu ứng đến hết trận không có số. Khung vàng góc tròn = có lợi, đồng đỏ góc vát = bất lợi.
- 28 hình: Choáng, Đóng băng, Phong ấn, Hỗn loạn, Mù, Thiêu đốt, Độc, Nguyền rủa, Ấn sấm, Hàn ấn, Tê liệt, Suy yếu, Vỡ giáp, Cấm hồi,
  Giáp tan chảy, Hút năng lượng (dự phòng); Biến Thân, Dư âm, Hóa mờ, Hồi phục/Tái sinh, Khắc hệ, Cuồng nộ, Tàng hình, Miễn thương, Bất
  tử, Gai phản, Cuồng huyết, Tăng công (dự phòng). Huy hiệu hệ nhỏ ở đầu phải thanh nộ. Tên nhân vật chỉ còn cho trình đọc màn hình.
- Chạm / rê / focus một ô: chú giải giấy da (tên, tác dụng, lượt còn); "+N" mở cả danh sách. Chú giải tự chọn chỗ trống không che ô, máu,
  nộ, giáp; màn ngang có lề thì nằm ở lề. Máu/nộ và hàng ô tự trượt vào trong khung khi nhân vật đứng sát mép.
- PvP (1v1 cùng máy, giao hữu, Cúp, trực tuyến sau này): tên tài khoản hai góc trên khung trận (tên dài "…", chạm xem đủ); khung thấp
  (màn ngang) thì lên thanh trên. Nhãn "Ải N" thành "Cùng máy" / "AI", ẩn điểm hành trình. PvE không có tên. Tên tài khoản lấy từ
  Quảng Trường (`gemwoven.social.v1`), chưa đặt thì "Bạn"; AI hiện tên hiển thị của bản sao.
- Codex: phê bình + mockup 8,2; bản dựng 8,0/7,5/8,4 → 8,3/8,7/8,6 → 8,3/8,7/8,8 → **8,7 / 8,8 / 8,9** (điện thoại / ngang / Studio).
  Tất cả ở `assets/gemwoven/raw/combat-status/`. Màn ngang không thấy bàn ngọc là bố cục có từ trước (ngoài phạm vi).

## 6. Hồ sơ, chỉ số chi tiết, Lực chiến [Đêm nay]

- **Lực chiến = HP × Công ÷ (1 − Thủ)** (trước đây × (1 + Thủ)). Codex: sức chịu đòn thật là `HP/(1−Thủ)`,
  nên tích "máu hiệu dụng × sát thương" mới tỉ lệ với khả năng thắng.
- Bấm **Lực chiến ở Home** hoặc **cờ phải "Chỉ số chi tiết" ở trang Tướng** → bảng HP/Công/Thủ theo từng
  nguồn (gốc, cấp, sao, tiến hóa, trang bị, bảo bối, kỹ năng) + "Cách tăng tiếp" (các bước làm được ngay).
- **Cờ trái "Lộ trình phát triển"** ở trang Tướng → mọi trục: đang ở đâu, bước tiếp, mở ra gì,
  trạng thái (làm được ngay / thiếu nguyên liệu / chưa đủ điều kiện / tối đa), nút "Đi tới".

---

## 7. Túi đồ: bấm vật phẩm

| Loại | Hành động |
|---|---|
| Sách EXP, Ấn | Đi tới Tăng cấp (một chỗ quyết toán) |
| Bí kíp | Đi tới Kỹ năng |
| Mảnh tướng (cả Mảnh Hiro) | Ghép tướng khi đủ 80, ngay trong túi |
| Vé | Đi tới Triệu hồi |
| Trang bị | Trang bị / cường hóa / phân rã |
| Rương chọn, Thẻ thời gian (2 giờ offline), Rương vật liệu | [Đề xuất] "Mở/Dùng" có xác nhận số lượng; engine (sau là máy chủ) quyết toán |

---

## 8. Cái gì bán ở đâu

| Vật phẩm | Vàng | Ngọc | Triệu hồi | Sự kiện | Đấu trường / Thử luyện | Không bao giờ |
|---|---|---|---|---|---|---|
| Sách EXP, quặng, gỗ, vải | ✔ | | ✔ | ✔ | ✔ | |
| Bí kíp | ✔ (giới hạn) | ✔ | | ✔ | ✔ | |
| Tinh hoa, thần thạch | | ✔ (giới hạn) | | ✔ | ✔ | bán bằng vàng |
| Trang bị Tốt / Hiếm / Sử Thi | ✔ 12.000 / 48.000 / 108.000, 1 món mỗi ô mỗi phẩm mỗi tuần, mở theo ải như Lò Rèn (20 / 40 / 60) | | ✔ | | | bán bằng Đá Ngọc |
| Trang bị Huyền Thoại / Thần | | | ✔ | | | bán ở Cửa Hàng (chỉ Lò Rèn, Nâng Phẩm, triệu hồi) |
| **Tướng hiếm** | | | ✔ banner | | | bán trực tiếp |
| Mảnh tướng banner | | | ✔ | ✔ đổi ≤ 30/kỳ | | |
| Mảnh tướng cũ | | | | Cửa Hàng Ký Ức (Bụi Ký Ức) · rương ngày 28 | ✔ (giới hạn tuần) | |
| **Bụi Ký Ức** | | | bản/mảnh dư tướng 6★ | ✔ nhiệm vụ tuần | ✔ Cúp (máy chủ) | bán bằng tiền, Đá Ngọc, vàng; gửi thư |
| Mảnh Hiro | | | | ✔ | ✔ | bán bằng tiền |
| Vũ khí bản mệnh | | | ✔ banner vũ khí | mảnh | | |
| Báu vật | | | | PvE + tích nạp | | triệu hồi |
| Ngọc khảm | ✔ cấp 1 | ✔ cấp 2 | | ✔ | ✔ | cấp 4–5 trực tiếp |
| Trang phục, khung, danh hiệu | | ✔ một số | | ✔ | ✔ | — (không chỉ số) |
| **Đá Ngọc** | | | | | | thưởng gameplay; bán bằng vàng (chỉ nạp, trang Nạp) |
| **Vàng** | | ✔ 3 gói, hạn mức 12R/ngày | | ✔ | ✔ | nhân VIP |
| **Vé triệu hồi** | | | | ✔ | ✔ | bán bằng vàng |

---

## 9. Triệu hồi và chu kỳ banner

- [Đêm nay] **Tỷ lệ tướng banner 1%, bảo đảm ở lượt 100** (trước: 0,15% và 300 lượt). Codex: 300 lượt =
  36.000 Đá Ngọc ≈ 12 triệu đồng mới chắc ra một tướng — quá đắt để xây đội. Bây giờ ≈ 4 triệu tối đa, trung
  bình ~63 lượt. Tiến độ bảo đảm **giữ nguyên khi đổi banner**. Không cần thêm "điểm đổi".
- Ngân sách vé miễn phí mục tiêu ≈ **40 vé/28 ngày** (đang có ~1/ngày + mốc cấp; thiếu phần nhiệm vụ tuần).
- Banner tướng 2 tuần; banner vũ khí bản mệnh song song; banner thường trực khi có ≥ 3 tướng hiếm.
- **Kỳ banner [Có · D3, Claude + Codex 04/11]:** kỳ **14 ngày** neo **02/11/2026 00:00 GMT+7**; bảo đảm 100 lượt mang
  sang kỳ sau. Chạy lại: **kỳ chạy lại − kỳ trước ≥ 3** (hai lần bắt đầu cách ≥ 42 ngày, ví dụ A → B → C → A). Lịch xoay
  chỉ bật khi có **≥ 3 tướng hiếm đã phát hành**; hiện Mika thường trực. Lịch do máy chủ công bố (`liveops.js` BANNER.schedule,
  kiểm bằng `bannerCheck`); màn Triệu Hồi giữ nguyên hình, chỉ thêm dòng nhỏ "Kỳ sau: …" hoặc "Kỳ sau: Chưa công bố", không đếm
  ngược suy đoán. Phát hành = ngày mở banner đầu (`RELEASES` trong `progression.js`).
- **Bụi Ký Ức [Có · D3]** — "Vật liệu không bán trực tiếp" (người chi tiền vẫn nhận gián tiếp từ bản trùng; không hứa độc lập
  với chi tiêu). Nguồn: mỗi **bản dư** của tướng đã 6★ = **80**, mỗi **mảnh dư** của tướng 6★ = **1** (đổi tự động khi lên 6★
  và mỗi lần nhận thêm, luôn giữ bản chính, nguồn bị xóa cùng lúc nên không đổi hai lần); **mốc nhiệm vụ tuần 40/tuần** (nhiệm
  vụ "Nhận thưởng nhiệm vụ ngày 12 lần", một lần); **Cúp Đấu Trường đủ 10 trận 30/tháng chỉ từ máy chủ** (bản thử cục bộ 0).
  **Hiro ngoài hẳn hệ Ký Ức**: không đổi bụi từ Hiro, không bán mảnh Hiro. Tướng của quà thử nghiệm không đổi bụi. Không mua
  bằng tiền/Đá Ngọc, không gửi qua thư, không có trong cửa hàng thường. Bụi và mảnh không hết hạn.
- **Cửa Hàng · Ký Ức [Có]** (tab thứ 4): làm mới **Thứ Hai 00:00 GMT+7**; tối đa **2 tướng/tuần**, xoay lần lượt theo thứ tự
  phát hành trong các tướng: đã phát hành, ngoài banner hiện tại, **đã qua ≥ 42 ngày từ lần mở banner đầu**, không Hiro. Thiếu
Cửa Hàng (04/11, Claude + Codex, `codex-gear` + review kệ hàng): Cửa Hàng chỉ bán trang bị đến Sử Thi; Huyền Thoại và Thần đến từ Lò Rèn, Nâng Phẩm và triệu hồi. Mỗi tab tối đa 6 món, xếp 3 món một tầng trên hai tầng kệ vẽ sẵn (không đè cột, không che mép ván); giá luôn là biểu tượng + số (đồng vàng, viên Đá Ngọc, lọ Bụi Ký Ức), hạn mức là thẻ da nhỏ "5/ngày". Luật mua: `progression.js` `purchase` (cổng ải `craftGate`), bảng hàng `world.js` SHOP. Mô phỏng cân bằng trước/sau giống hệt (cửa hàng không nằm trong mô phỏng trận).

  tướng thì bày ít hơn, bụi vẫn tích. **8 bụi/mảnh, mua 10 mảnh = 80 bụi**, tối đa **40 mảnh/tướng/tuần**; mua được tướng chưa sở
  hữu (80 mảnh ghép một tướng); tướng đã 6★ không mua (mảnh sẽ thành bụi). Hiện Mika đang ở banner nên kệ trống:
  "Chưa có tướng đủ điều kiện · kỳ sau".
- **Rương miễn phí ngày 28 [Có]** (Sự Kiện → Lịch 28 ngày): ngày 28 của mỗi mùa 28 ngày, **20 mảnh tự chọn** một tướng đã sở
  hữu, không Hiro, chưa 6★; không có lựa chọn hợp lệ thì cất **phiếu không hết hạn** (Túi Đồ → Khác); lỡ ngày 28 của một mùa
  đã chơi thì sang mùa mới tự thành phiếu. Sổ nhánh Diệu Ngọc (80 mảnh/mùa, trả phí) giữ nguyên, là nguồn riêng.
- **Nhịp bổ sung miễn phí (Codex):** bụi tuần 20 mảnh/28 ngày + rương ngày 28 20 mảnh = **80 mảnh/56 ngày** cho tướng đã có;
  mở tướng chưa có chỉ bằng bụi tuần ≈ 16 tuần cộng thời gian chờ hàng. Triệu hồi vẫn là đường mở bộ sưu tập. Người mua Diệu
  Ngọc: 120 so với 40 mảnh/mùa; tỷ lệ 8 bản dư đổi 1 bản đích cần theo dõi khi có số liệu thật.
- 6★ cần 20 bản (1 chính + 19) ≈ 1.260 lượt trung bình — mục tiêu chi tiêu cao, đúng định hướng
  "kiếm tiền từ tướng có hình thái".

---

## 10. Kiếm tiền (máy chủ thanh toán, hiện **Sắp ra mắt**)

**Mùa của tướng (04/11):** mùa có tướng mới X dùng bảng sổ riêng (§20 "Vòng Mùa của tướng"): Diệu Ngọc giao 1 bản X khi máy chủ xác nhận
thanh toán + 80 mảnh X ở cấp 50 (thay 80 mảnh tự chọn); Vàng có khung/danh hiệu/thẻ tên/bong bóng; Thẻ Tháng và Quỹ không đổi.

| Sản phẩm | Giá gợi ý | Nhận |
|---|---|---|
| Gói Đá Ngọc | 22k / 109k / 349k / 699k / 1.149k / 2.199k | 60 / 300 / 980 / 1.980 / 3.280 / 6.480; lần đầu mỗi mốc ×2 (ghi "60 + 60 = 120") |
| **Thẻ Tháng** | 109k / 30 ngày | 300 ngay + 100/ngày (quên đăng nhập thì vào Hòm Thư, không mất), +2 giờ offline, +1 lượt boss có thưởng, quét ải 3★; cộng dồn tối đa 180 ngày |
| **Sổ Hành Trình · Vàng** | 149k / mùa 28 ngày | nhánh Vàng 50 cấp; **mua giữa mùa nhận ngay mọi phần thưởng đã đạt**; không có Đá Ngọc trong sổ; 7 ngày cuối mua tối đa 10 cấp |
| **Sổ Hành Trình · Diệu Ngọc** (chủ dự án 03/11) | 299k / mùa (đã có Vàng: bù 150k) | gồm Vàng + nhánh Diệu Ngọc: 80 mảnh tướng tự chọn (tướng đã sở hữu, **trừ Hiro**; tài khoản chỉ có Hiro nhận phiếu chọn không hết hạn), rương Sử Thi (cấp 25, nhận khi qua ải 60) và Huyền Thoại (cấp 50, qua ải 80) tự chọn ô, 20 thần thạch, khung + danh hiệu mùa; +10 cấp khi mua **tính vào** giới hạn 10 cấp mua; không Đá Ngọc; tắt ở Chuẩn Hóa |
| **Quỹ Trưởng Thành** (speed pass) | 299k một lần | 7.000 Ngọc trả theo mốc cấp tướng cao nhất 10..300 |
| Gói ưu đãi | 49k–499k | đúng nút người chơi đang kẹt; tối đa 1 lần/7 ngày mỗi gói; không popup ép |
| Trang phục hình thái | 199k | skin, không chỉ số |

**Sổ Hành Trình trong game (04/11, Codex vòng 1):** điểm sổ chỉ từ nhận thưởng nhiệm vụ (ngày +50, tuần +150 ≈ 264/ngày → cấp 50 sau ~20 ngày), 100 điểm/cấp; mùa 28 ngày tính từ 00:00 GMT+7 ngày neo; mỗi mốc đạt nhận nhánh Thường, nhánh Vàng/Diệu Ngọc chỉ khi máy chủ ghi giao dịch của mùa (client không tự mở được); rương chọn chờ ải 60/80, mảnh/rương tự chọn thành phiếu; sang mùa mới tự cất quà còn sót. Chấm đỏ chỉ đếm mốc nhận được ngay. Màn: `pass-ui.js` (cây mốc dọc; Thẻ Tháng và Quỹ cùng dạng cây).

**Trang Nạp và vàng đổi bằng ngọc (chủ dự án 04/11, Claude + Codex vòng Nạp) [Có · thanh toán Sắp ra mắt]:**
- **Một trang Nạp** (`topup-ui.js`, `#topup`), hai lối vào: nút **"+" cạnh Đá Ngọc trên HUD** và nút **Nạp** trong Cửa Hàng.
  Mục mặc định là 6 gói Đá Ngọc (`liveops.js` GEM_PACKS, giá thử ở bảng trên), mỗi thẻ: ảnh túi/rương lớn dần, lượng ngọc, giá,
  nhãn **"Lần đầu ×2"** và tổng nhận rõ ràng "60 + 60 = 120". Lần đầu ×2 **một lần mỗi mốc, chỉ gói ngọc**. Trên cùng có thanh
  VIP gọn (`vipProgress`) và ba lối sang Thẻ Tháng / Sổ Hành Trình / Quỹ (mở đúng tab màn VIP; màn VIP vẫn chuyên xem quyền lợi).
- **VIP:** 1 điểm = 1.000₫ **thực trả**; ngọc thưởng lần đầu và tiêu ngọc không cộng điểm (`TOPUP.bonusAddsVip=false`).
- **Thanh toán Sắp ra mắt:** chạm gói mở bảng "Sắp ra mắt · chưa thu tiền": không trừ tiền, không cấp ngọc, không cộng VIP,
  không đánh dấu đã dùng lần đầu. Client không có hàm nạp; máy chủ thanh toán giao hàng sau.
- **Vàng đổi bằng Đá Ngọc** (Cửa Hàng → tab Đá Ngọc, cạnh Tinh Hoa và Thần Thạch): 3 gói **20 / 60 / 120 ngọc → 2R / 6R / 12R
  vàng**, R = `offlineRate(p).gold` (một giờ vàng tích lũy, theo cấp tướng cao nhất và số ải đã qua, không theo tướng đang chọn).
  **Hạn mức chung 12R/ngày/tài khoản**, gói nhỏ cũng trừ cùng hạn mức, làm mới 00:00 GMT+7. Màn hiện **số vàng thực nhận** và
  "Hôm nay còn đổi N vàng", không bắt người chơi hiểu công thức. **Không nhân VIP, không khuyến mại vàng.** Chỉ tiêu ngọc, không
  bao giờ cấp ngọc. Luật chung: `progression.js` GOLD_PACKS / GOLD_DAILY_UNITS / goldShop / buyGold. Tỷ giá là **mức thử**: vàng
  đổi tiếp thành sách/nguyên liệu nên đây là bán tốc độ trên nhiều hệ thống; đo đầu–giữa–cuối game trước phát hành.
- **Popup tài nguyên** (chạm bất kỳ tài nguyên): ảnh, tên, số đang có; **bỏ câu công dụng**. Nút chính **"Mua thêm"** mở đúng
  tab Cửa Hàng và làm nổi đúng món (vàng → gói vàng ở tab Đá Ngọc), có mũi tên quay về màn trước; Đá Ngọc là nút **"Nạp"**.
  Nguồn miễn phí gập dưới **"Cách kiếm ›"**: tối đa 3 nguồn, biểu tượng + tên ngắn, chạm để đến nơi. Tài nguyên không bán (Ấn tu
  luyện, Vé, Bụi Ký Ức) chỉ hiện nguồn, không có nút mua. Nguyên liệu bán bằng vàng vẫn mua bằng vàng; không thêm bảng giá ngọc song song.

### 10.1 VIP (theo tổng nạp xác thực)
12 bậc 100k → 100tr (bảng đầy đủ trong `liveops.js`). Thanh tiến độ: 1 điểm VIP = 1.000đ nạp xác thực, một thang cộng dồn (`vipProgress` trong `progression.js`).
- VIP **không cộng chỉ số chiến đấu**: tiện lợi (quét ải, offline 12→16 giờ, lượt boss có thưởng, hàng đợi
  rèn), quà ngày, cửa hàng VIP, trang trí.
- "Tướng riêng VIP10" → **trang phục tướng riêng** (tặng tướng cho VIP là trả tiền để thắng).
- **Hoàn tiền / chargeback:** máy chủ thu hồi giao dịch trong sổ cái, trừ Đá Ngọc còn lại (âm nếu đã tiêu, chặn
  nạp-rút), tính lại VIP. Mỗi giao dịch chỉ giao hàng một lần (idempotent theo mã giao dịch của cổng thanh toán).

---

## 11. Sự kiện: nhịp ngày / tuần / 2 tuần / mùa / quý (`liveops.js` CADENCE)

| Chu kỳ | Reset (GMT+7) | Nội dung |
|---|---|---|
| Ngày | 00:00 | Nhiệm vụ ngày, Sân Thử Luyện (2 lượt có thưởng), quà VIP/thẻ |
| Tuần | Thứ Hai 00:00 | **Nhiệm vụ tuần** [Đêm nay] (3 vé + vàng/EXP/tinh hoa/bí kíp), thưởng hạng Đấu Trường, cửa hàng tuần, cuối tuần ×2 (vàng ải / nguyên liệu boss — **không** ×2 điểm xếp hạng) |
| 2 tuần | Thứ Hai tuần lẻ | Banner tướng + vũ khí, boss sự kiện theo tướng, cửa hàng đổi mảnh (≤ 30/kỳ), báu vật chủ đề |
| Mùa 28 ngày | Thứ Hai đầu mùa | Sổ Hành Trình, mùa Đấu Hạng (reset mềm), lịch đăng nhập 28 ngày, BXH boss |
| Quý | Tuần đầu quý | Thư Hùng Đại Hội, trang phục mới, kỷ niệm |

- **Ngày neo:** kỳ 2 tuần và mùa 28 ngày tính từ **Thứ Hai 02/11/2026 00:00 GMT+7** (kỳ 0 / mùa 0), máy chủ giữ lịch.
- **Ngân sách miễn phí mỗi 28 ngày:** vé = 28 (Ghé thăm) + 12 (nhiệm vụ tuần) + 10 (sổ miễn phí, khi có) + mốc cấp
  tướng ≈ **50**; tuần đầu thêm 9 từ Tân Thủ. Mảnh Hiro = ~168 (nhiệm vụ vượt ải ngày) + rương sao/tầng boss theo tiến độ.
  6★ Hiro chỉ bằng nhiệm vụ ngày cần ~240 ngày; rương và tầng boss rút ngắn còn khoảng 6–8 tháng với người chơi đều.
- **Vòng lấy mảnh tướng cũ [Có · D3]:** chạy lại banner (≥ 42 ngày), Cửa Hàng Ký Ức (tuần), rương 20 mảnh ngày 28 (§9).
- **Giảm nghĩa vụ đăng nhập** (Codex): nhận bù ngày lỡ ở Tân Thủ; thẻ tháng tự gửi thư; Sân Thử Luyện chỉ 2 lượt
  có thưởng.
- **Mẫu sự kiện cho Studio** (mở rộng `docs/event.schema.json` khi có máy chủ): Đăng nhập N ngày, Tích nạp, Tiêu
  Ngọc, Đổi vật phẩm, Boss sự kiện, Đua top (điểm do máy chủ tính), Nhiệm vụ mốc. Không có vòng quay bán bằng tiền.
- [Đêm nay] Trang **Sự Kiện** chạy thật **Hành Trình Tân Thủ 7 ngày** và hiển thị lịch dự kiến ở trên.
- **Sự kiện ngày đặc biệt [Đề xuất · live-ops sau, chủ dự án 04/11]:** vào các ngày đặc biệt (lễ, kỷ niệm, sinh nhật tướng…)
  có nhiệm vụ cho thêm **bản dư 1★ hoặc mảnh tướng** để bù đường 6★ (31 bản dư, §20 "Vòng Nâng Sao"). Nhận bằng chơi; **không
  bao giờ có Đá Ngọc từ gameplay**; Hiro ngoài phạm vi (nguồn riêng §1.2); máy chủ giữ lịch, Studio cấu hình, đếm vào ngân sách
  mảnh miễn phí khi đo.

---

## 12. Đấu trường

### 12.1 Chế độ
1. **Đấu Hạng thời gian thực 1v1:**
   - **Tự Do:** chỉ số thật; ghép theo MMR (Glicko-2, ẩn) và chênh Lực chiến ≤ 25%.
   - **Chuẩn Hóa** (Codex): **mọi người chọn trong cùng danh sách tướng đã phát hành** (không cần sở hữu), chỉ số
     chuẩn, kỹ năng cấp 1; không trang bị, báu vật, VIP. Thuần kỹ năng xếp ngọc.
   - Bậc: Đồng → Bạc → Vàng → Bạch Kim → Kim Cương (III–I) → Tinh Anh → Cao Thủ (top 500) → Thách Đấu (top 50).
   - Lượt 20 giây; 3 lần hết giờ thua; mất kết nối 60 giây → AI tạm điều khiển rồi xử thua.
2. **Thách Đấu Phòng Thủ (bất đồng bộ):** đánh đội phòng thủ do AI máy chủ điều khiển, 5 vé/ngày.
3. **Giao Hữu** từ Quảng Trường, không thưởng.
4. **PvP cục bộ** 2 người 1 máy [Có].

### 12.2 Thưởng
- Tuần theo bậc: vàng, Huy hiệu Đấu Trường, bí kíp (`liveops.js` LEAGUES). Không Đá Ngọc.
- Mùa: khung, danh hiệu, trang phục. **Không sức mạnh độc quyền cho top.**
- Cửa hàng Đấu Trường: mảnh tướng cũ (giới hạn), Mảnh Hiro, ngọc khảm, trang phục.

### 12.3 Thư Hùng Đại Hội (quý)
Đăng ký 1 tuần → vòng Thụy Sĩ 7 vòng → top 64 loại trực tiếp, có xem trực tiếp (trễ 10 giây). Hai hạng Chuẩn
Hóa và Tự Do. Thưởng: danh hiệu có tên mùa (vô địch đặt chữ theo khuôn, kiểm duyệt), trang phục vô địch, tượng ở
Quảng Trường mùa sau.

### 12.4 Máy chủ quyết định — mọi chế độ có thưởng, **kể cả PvE**
- Hiện `settle()` nhận thắng/thua, sát thương và thành tích từ client; mã trận chỉ chống quyết toán lặp. Khi lên
  máy chủ: **máy chủ tự chạy trận** từ nước đi của người chơi, không nhập số dư/thành tích từ bản lưu local.
- Máy chủ giữ **seed bí mật**, chỉ gửi ngọc đã rơi (client không đoán trước được ngọc sắp rơi).
- Client gửi ý định: `swap(r1,c1,r2,c2)`, `cast()`, `transform()`, `surrender()` + số lượt. Máy chủ trả nhật ký sự
  kiện để client diễn.
- Lõi trận xác định (không DOM, RNG có seed) + **bộ vector kiểm thử** (cùng seed + nước đi → cùng nhật ký), dùng
  chung cho máy chủ, web và Godot.
- Chống bot/thông đồng: giới hạn tốc độ thao tác, phát hiện cặp đấu lặp, đánh dấu tài khoản thắng-thua đổi điểm.

### 12.5 Cúp Đấu Trường (tháng) [Bản thử cục bộ · máy chủ Sắp ra mắt]
Chủ dự án (04/11): "chưa có chỗ tổ chức thi đấu mỗi tháng xem ai mạnh nhất để nhận thưởng xịn." Claude và Codex thống nhất
(vòng Đấu Trường 1–2, `assets/gemwoven/raw/arena-mockup/`). Luật và bản thử: `progression.js` (`CUP`, `cupView`,
`begin('cup')`); thưởng: `liveops.js` `CUP_PRIZES`, `CUP_SCHEDULE`.
- **Lịch:** tháng dương lịch, UTC+7. Tháng D ngày: **đua điểm** ngày 1 → hết D−3; **tứ kết** D−2, **bán kết** D−1, **chung kết** D
  (BO3, 20:00, có xem lại). Độc lập với mùa Đấu Hạng 28 ngày và Thư Hùng (quý).
- **Công bằng:** luật Chuẩn Hóa. **Mượn mọi tướng đã phát hành** (không cần sở hữu, không thêm vào bộ sưu tập), hình thái gốc, kỹ
  năng cấp 1; không trang bị, báu vật, ngọc, VIP, Biến Thân. Không xoay nhóm tướng; danh sách và bản cân bằng khóa đầu tháng.
- **Điều kiện:** miễn phí, qua ải 30, tài khoản xác thực (bản thử bỏ cổng ải để thử ngay).
- **Lượt:** 5 trận tính điểm/ngày, lượt chưa dùng dồn tối đa 10; không bán lượt, không lượt VIP. Người vào giữa tháng bắt đầu như mọi người.
- **Điểm:** Elo đối xứng từ 1.000, `K = 40`, chênh lệch kẹp ±240: `E = 1/(1+10^(gap/400))`, `Δ = round(40·(S−E))` (ngang sức ±20,
  khoảng 8–32); hai bên nhận biến động đối nhau; không ai xuống dưới 0. Thoát sau khi trận bắt đầu tính thua.
- **Bảng:** xếp hạng từ **10 trận**; Top 8 cần **30 trận, 5 trận trong 7 ngày cuối** vòng đua. Phá hòa: điểm → điểm trung bình đối
  thủ → số thắng. Nhánh **1–8, 4–5, 2–7, 3–6**; không đến = thua.
- **Thưởng (không Đá Ngọc, không điểm báu vật, không ngọc khảm, không tài nguyên theo hạng):** Vô địch — danh hiệu bậc 5 **Quán Quân
  Tháng** (ghi tháng/năm), khung chân dung động, cúp lưu niệm, chân dung vinh danh ở Quảng Trường tháng sau; Á quân — **Á Quân Tháng**
  (bậc 4) + khung vàng; hạng 3–4 — **Tứ Kiệt Tháng** (bậc 4) + khung bạc; hạng 5–8 — **Bát Hùng Tháng** (bậc 3) + khung đồng; top 10% —
  huy chương tháng; **đủ 10 trận — dấu tham dự + 20.000 vàng, 20 sách kinh nghiệm, 5 tinh hoa** (như nhau cho mọi người). Mỗi người
  nhận gói cao nhất + gói 10 trận, qua Hòm Thư 48 giờ sau chung kết. "Thưởng xịn" là thứ nhìn thấy được, không phải sức mạnh.
- **Máy chủ (Sắp ra mắt):** ghép người thật ±100 điểm, 30 giây mở ±200, 60 giây ±300, 90 giây cho hủy không mất lượt; không gặp
  cùng người quá 2 trận/ngày; Top 16 dự bị, xác nhận trước 12:00 ngày tứ kết; cần ≥ 32 người đủ điều kiện mới trao ngôi; 30 lượt/người,
  hết lượt so tỷ lệ HP (bằng nhau = hòa, 0,5); lượt 20 giây, 3 lần hết giờ thua, 60 giây kết nối lại; lỗi máy chủ hủy trận, hoàn lượt
  một lần; theo dõi nhường điểm, bỏ trận bất thường, cụm tài khoản.
- **Bản thử cục bộ** (ghi "Bản thử cục bộ · kết quả không lên bảng toàn cầu" ở màn, popup và kết quả trận): 31 bản sao AI (tên, tướng,
  sức mạnh ẩn sinh theo mã tháng, giống nhau trên mọi máy) tự đấu với nhau theo seed bằng cùng công thức (mỗi AI ≤ 5 trận/ngày); bạn
  đấu bản sao gần điểm nhất (cửa sổ ±100/200/300, tối đa 2 lần/ngày cùng một AI) trong trận thật (AI điều khiển); chung kết BO3 với AI,
  cặp AI phân định lúc 20:00 theo seed. **Không trao gì** (kể cả vàng); lịch sử 12 tháng lưu trên máy này (Vinh Danh).
- **Màn Đấu Trường** (Codex 6/10 → mockup 8,5 → bản dựng 8/10): bảng Cúp treo trong cổng (tháng, giai đoạn, đếm ngược tới hết giai
  đoạn) → bục 2–1–3 chân dung người dẫn đầu (nhãn AI) → dải "Bạn · Hạng n · điểm" (chưa đủ 10 trận: "Chưa xếp hạng · n/10") → chọn
  tướng + nút "Đấu thử · n lượt" + rương "Xem thưởng" → giá ba cờ: 1v1 Cùng máy (vào trận ngay), Đấu Hạng (khóa, Sắp ra mắt), Trùm Vô
  Tận. Popup: Đua Điểm · Top 8 · Thưởng · Vinh Danh, hàng của bạn ghim ở đáy, ⓘ luật.

---

## 13. Boss Vô Hạn và Sân Thử Luyện

1. **Tháp Boss Vô Hạn [Có]:** tầng tăng dần, xoay vòng boss chương; thưởng giảm sau 12 trận/ngày.
   [Đêm nay] mỗi 10 tầng lần đầu: 10 Mảnh Hiro. [Đề xuất] tầng 60+ rơi ngọc khảm.
2. **Sân Thử Luyện [Đêm nay]** — nơi spam thử tướng (khu trên màn Boss Vô Hạn):
   - **Không cần nhiều quái: một đại diện trâu mỗi ngày**, dùng lại boss chương có sẵn với bộ chiêu riêng:
     T2 Hỏa Long Tro Tàn (Hỏa), T3 Băng Nguyệt Linh Hồ (Băng), T4 Thạch Mộc Cự Vệ (Mộc), T5 Lôi Sư Thiên Đỉnh (Lôi),
     T6 Tử Thần Nguyệt Ảnh; T7–CN chọn bất kỳ.
   - Boss ở **đúng cấp tướng đang xuất chiến**, **không bao giờ ngã**: hết thanh máu thì đứng dậy với thanh mới (đếm
     số thanh). **15 lượt**, điểm = tổng sát thương. Tướng gục giữa chừng vẫn tính điểm đã gây.
   - **2 lượt có thưởng/ngày** theo mốc ½ / 1 / 2 / 3 / 5 thanh máu (vàng + EXP = 0,3–0,75 giờ offline mỗi lượt, mốc
     3+ thêm 1 tinh hoa); sau đó đánh thoải mái không thưởng; **giữ kỷ lục từng boss**.
   - Đã kiểm trong combat thật (thanh máu hồi lại, hết 15 lượt, tướng gục) và có test engine.
   - Sau này: BXH tuần theo boss (máy chủ), Huy hiệu Thử Luyện cho cửa hàng.

---

## 14. Xã hội: Quảng Trường, bạn bè, bang hội [Có · máy chủ xã hội chạy thật]

Trò Chuyện **là một không gian**, không phải khung chat. Người chơi vào Quảng Trường bằng tướng đang xuất chiến (diện
mạo đã khoác), tự đi lại, nhắn tin thì bong bóng hiện trên đầu, đứng gần ai thì bấm vào nhân vật của nhau để kết bạn,
nhắn riêng, mời giao hữu, mời vào bang.

### 14.1 Kiến trúc: máy chủ xã hội trực tuyến (không phải LAN)
- **Tiến trình riêng** `server/social/` (Node + WebSocket), là máy chủ xã hội của bản phát hành; bản dev chạy nó trên
  máy dev (cổng 8091), bản phát hành chạy sau Cloudflare Tunnel ở đường dẫn `/social` cùng tên miền với game
  (`wss://<miền>/social`). Client chỉ đổi địa chỉ, không đổi giao thức.
- **Máy chủ quyết định**: vị trí (giới hạn tốc độ, va chạm, biên bản đồ), kênh/phòng, chat (độ dài, tốc độ, lọc từ,
  chặn), bạn bè, bang hội, lời mời. Client gửi *ý định* (đích đến, câu chat), nhận *trạng thái*.
- **Giao thức dùng chung** `src/gemwoven/social-protocol.js` (UMD như progression.js): hằng số bản đồ, tốc độ, bán
  kính tương tác, giới hạn chat, kiểm tra hợp lệ từng loại tin. Client và máy chủ chạy cùng một mã kiểm tra.
- **Danh tính:** trước khi có máy chủ tài khoản, **máy chủ cấp mã tài khoản + token** (lưu băm, thu hồi được; thiết bị giữ token), tối đa 5 tài khoản mới/giờ/địa chỉ; máy chủ gắn tên hiển thị
  duy nhất 3–14 ký tự. Hồ sơ tướng (cấp, lực chiến) do client gửi là **chưa xác thực** — chỉ để khoe, không dùng xếp
  hạng; khi có máy chủ tài khoản, hồ sơ do máy chủ ký.
- **Lưu trữ:** bạn bè, bang, tên, danh sách chặn ghi file JSON trên máy chủ (dev); bản phát hành chuyển SQLite/Postgres
  và sao lưu hằng ngày theo luật máy chủ. Vị trí và chat kênh không lưu (chỉ nhật ký kiểm duyệt 7 ngày).
- **Không có máy chủ** (mất mạng): Quảng Trường mở ở chế độ **Ngoại tuyến** — chỉ có bạn và các NPC thị trấn ghi rõ NPC;
  không giả người chơi.

### 14.2 Màn hình dọc (khung 941×1672)
```
┌──────────────────────────────┐ HUD hub (avatar, vàng, ngọc)
│ ← Quảng Trường · Kênh 3 (27) │ thanh đầu: quay lại, tên khu, kênh + số người, nút đổi kênh
│                              │
│      bản đồ (camera theo     │ tên + danh hiệu + [TAG] bang trên đầu; bong bóng chat 4 giây
│      tướng của mình)         │ người ngoài tầm nhìn hiện mũi tên ở mép (bạn bè, thành viên bang)
│                     [Bạn]    │ cột nút phải: Bạn bè (chấm đỏ lời mời), Bang hội, Biểu cảm
│                     [Bang]   │
│                     [😀]     │
│ ◯ cần điều hướng    (ticker) │ 3 dòng chat gần nhất mờ dần, chạm để mở nhật ký đầy đủ
│ [Kênh▾][ Nhắn gì đó…  ][Gửi] │ ô chat (bàn phím thu vùng bản đồ, ẩn cần/ticker/cột nút, camera giữ mình trong vùng còn thấy)
└──────────────────────────────┘ thanh điều hướng hub ẩn trong Quảng Trường (toàn màn hình)
```
- **Điều khiển:** cần điều hướng ảo hiện nơi ngón cái chạm ở nửa dưới-trái; chạm mặt đất ở chỗ khác → đi tới đó;
  bàn phím WASD/mũi tên trên máy tính; Enter mở ô chat. Nhân vật dùng sheet chạy khi đi, vòng nghỉ khi đứng, quay
  mặt theo hướng đi.
- **Chạm một nhân vật:** trong bán kính tương tác (220 đơn vị bản đồ) → **thẻ hồ sơ** trượt từ dưới: chân dung, tên,
  cấp, lực chiến (chưa xác thực), danh hiệu, bang; nút *Kết bạn · Nhắn riêng · Giao hữu · Mời vào bang · Chặn · Báo
  cáo*. Ngoài bán kính → nhân vật tự đi tới gần người đó rồi mở thẻ.
- **Mật độ:** tối đa 40 người/kênh; ưu tiên vẽ bạn bè và người đang tương tác. Tối đa 4 bong bóng cùng lúc, 2 dòng mỗi bong bóng, hiện 4–6 giây, phần dài xem ở nhật ký. Thẻ hồ sơ chiếm ~45% màn hình, ba nút chính; Chặn/Báo cáo nằm trong "Thêm". Danh sách **Người gần** cho trình đọc màn hình; giảm chuyển động theo cài đặt.

### 14.3 Bản đồ và khu vực (Codex vẽ, dọc 1024×1536, hiển thị ×1,35, camera cuộn hai chiều)
- **Đài phun nước** giữa quảng trường (vật cản tròn) — chỗ tụ tập.
- **Sảnh Bang Hội** (cửa phía bắc) — bước vào cửa mở bảng bang.
- **Sàn Giao Hữu** (vòng đá phía đông) — hai người cùng đứng trong vòng và bấm Sẵn sàng thì vào trận.
- **Bảng Tin** (phía tây) — sự kiện, thông báo bang, bảng xếp hạng (từ máy chủ).
- **Miu Dẫn Lối** (NPC, cô gái tai mèo) — giải thích Quảng Trường; NPC luôn có nhãn NPC.
- Vùng đi được khai báo bằng đa giác + vật cản tròn trong `assets/gemwoven/plaza/plaza.json`, đo trên ảnh đã vẽ.

### 14.4 Chat
- Kênh: **Khu vực** (cùng kênh Quảng Trường), **Bang**, **Riêng** (bạn bè hoặc người đang đứng gần), **Hệ thống**.
- Tối đa 120 ký tự; 1 tin/2 giây, dồn tối đa 3; lặp nguyên văn 3 lần bị chặn 30 giây; lọc từ thô tục (che `***`);
  ẩn tin của người đã chặn; báo cáo gửi 20 tin gần nhất của người đó vào nhật ký kiểm duyệt.
- Tài khoản mới (< 24 giờ) chỉ chat Khu vực và Bang. Biểu cảm (8 cái) không bị giới hạn chữ, vẫn chịu giới hạn tốc độ.

### 14.5 Bạn bè
- Tối đa 50. **Lời mời kết bạn chỉ gửi khi hai người đứng gần nhau** (máy chủ kiểm tra khoảng cách) hoặc từ thẻ hồ
  sơ trong kênh bang; chấp nhận từ danh sách bất cứ lúc nào.
- Danh sách: trực tuyến/ngoại tuyến, đang ở kênh nào (*Đến chỗ bạn*: đổi kênh và đặt mình cạnh họ), nhắn riêng,
  mời giao hữu, xóa bạn.
- **Tặng Tim** mỗi ngày một lần cho mỗi bạn: Điểm Bằng Hữu (tối đa 30/ngày) đổi vé triệu hồi/nguyên liệu ở cửa hàng
  bằng hữu (không Đá Ngọc). Phần thưởng chỉ giao khi có máy chủ kinh tế; bản hiện tại đếm điểm.

### 14.6 Giao hữu
- Mời từ thẻ hồ sơ hoặc Sàn Giao Hữu; người được mời có 20 giây đồng ý. Trận **không thưởng, không xếp hạng**.
- Trước khi có máy chủ trận PvP thời gian thực: mỗi bên đấu với **bản sao tướng của người kia do máy điều khiển**
  (ảnh chụp chỉ số máy chủ gửi), ghi rõ "Giao hữu với bản sao". Kết quả gửi lại kênh như tin hệ thống.
- Khi có máy chủ trận: cùng bàn ngọc, lượt 20 giây, máy chủ giữ bàn và RNG (§12.4).

### 14.7 Bang hội
- **Lập bang:** tên 3–16 ký tự (duy nhất), thẻ 2–4 chữ in hoa, biểu tượng chọn từ bộ có sẵn, cổng cấp tướng 20,
  phí 100.000 vàng (thu khi kinh tế chuyển lên máy chủ). Mỗi người một bang; rời bang chờ 12 giờ mới vào bang khác.
- **Chức vụ** (Codex vòng 3): Bang Chủ (1), Phó Bang (1), Trưởng Lão (2), Thành Viên. Duyệt đơn: Bang Chủ, Phó Bang, Trưởng Lão.
  Đuổi, thăng chức, đổi thông báo: Bang Chủ, Phó Bang; chỉ thao tác với người **chức thấp hơn mình**. Bang Chủ vắng 7 ngày → bang
  được báo; vắng **14 ngày** → quyền chuyển cho cán bộ hoạt động nhất, không còn cán bộ thì thành viên cống hiến nhiều nhất còn hoạt động.
  Cống hiến cá nhân giữ lại khi rời bang.
- **Gia nhập:** Mở / Cần duyệt / Đóng; cấp tối thiểu. Tối đa 20 người, +2 mỗi cấp bang (cấp 10: 38).
- **Điểm danh** mỗi ngày: +10 cống hiến cá nhân, +10 kinh nghiệm bang. **Quyên góp** vàng (3 lần/ngày) khi có kinh tế máy chủ.
- **Cấp bang 1–10** từ kinh nghiệm (lên cấp n+1 cần thêm 1.000×n; điểm danh một lần/ngày/tài khoản do máy chủ chốt): tăng chỗ, mở bậc Cửa Hàng Bang (cống hiến đổi nguyên liệu, mảnh tướng cũ
  giới hạn tuần), mở hoạt động.
- **Dệt Đèn Bang** [Có] — hoạt động bang đầu tiên (Codex đề xuất): mỗi ngày mỗi người chọn một trong ba màu sợi tại
  **Tơ Đèn** cạnh sảnh (máy chủ kiểm tra đứng đúng chỗ), tối đa 5 sợi/người/tuần. Đèn bang sáng bậc 1/2/3 ở 5/15/25
  sợi khi mỗi màu đạt ít nhất 1/3/5 sợi — bang nhỏ vẫn làm được, cần bàn nhau chọn màu, không cần hẹn giờ. Chưa trao
  tài nguyên (chỉ trang trí sảnh tuần) cho tới khi có máy chủ kinh tế.
- **Hoạt động khác** (theo lịch máy chủ): *Boss Bang* hằng tuần (chung một thanh máu, xếp hạng sát thương trong bang),
  *Viễn Chinh* cuối tuần, *Chiến Trường Bang* theo mùa. Bản hiện tại: chưa có (Sắp ra mắt), hiển thị lịch.
- **Bảng bang:** thông tin, thông báo, thành viên (chức vụ, cấp, trực tuyến, cống hiến tuần), đơn xin vào, nhật ký,
  kênh chat bang; thẻ [TAG] hiện cạnh tên ở Quảng Trường.

### 14.8 Đã làm [Có]
- `server/social/server.js` (Node + `ws`, cổng 8091, `/social`; sức khỏe ở `/social/health`), `npm test` trong `server/social`
  chạy hai máy khách thật qua đăng ký, di chuyển, kết bạn khi đứng gần, chat, chặn, bang, Dệt Đèn, giao hữu.
- `src/gemwoven/social-protocol.js` dùng chung; `src/gemwoven/plaza.js` + `plaza.css` là màn Trò Chuyện.
- Bản đồ, đèn bang 4 bậc: Codex vẽ (`gpt-6.1-sol` low), `assets/gemwoven/plaza/`. NPC (chủ dự án 04/11: dễ thương, xinh đẹp, đầy đặn, idle tĩnh chất lượng cao): **Miu Dẫn Lối** và **Tơ Đèn** là hai cô gái trưởng thành (~25 tuổi), cao ~4 đầu như phong cách tướng, mặc kín, Codex vẽ và duyệt (8,7 / 8,6, `assets/gemwoven/raw/plaza-npc/`); mỗi người một vòng nghỉ rig 24 khung (`assets/gemwoven/npc/npc_rig.py plaza-<id>`: tóc, tai, đuôi, khăn, dải lụa, gấu váy đung đưa; chân đứng yên; đồ cầm cứng theo tay), Codex duyệt 8,7 / 8,6; giảm chuyển động giữ khung đầu.
- Nhân vật đi bằng vòng nghỉ rig 24 khung và sheet chạy của đúng hình thái đang khoác; cỡ thân theo đầu như trong trận
  (`build.py` xuất `assets/gemwoven/plaza/sprites.json`).
- Giao hữu = chế độ `spar` trong `progression.js` + combat: tướng của bạn đấu bản sao tướng đối thủ do AI điều khiển,
  chỉ số chuẩn hóa, nhãn "Giao hữu với bản sao · AI · Không thưởng", không công bố kết quả.
- Giao thức cho Godot: `docs/SOCIAL_PROTOCOL.md`.

### 14.9 An toàn
- Chặn: không thấy chat, lời mời, bong bóng của người bị chặn. Báo cáo: lý do có sẵn + 20 tin gần nhất.
- Giới hạn: 10 lời mời kết bạn/giờ, 20 lời mời giao hữu/giờ; vị trí gửi tối đa 10 lần/giây, máy chủ phát lại 10 lần/giây.
- Trẻ vị thành niên (khi có xác minh tuổi): chỉ chat với bạn bè, theo luật §17.

---

## 15. Danh hiệu, khung, sưu tập

- **Danh hiệu là trang trí** (Codex: tránh danh hiệu VIP gián tiếp cộng sức mạnh). Nguồn: thành tích, mùa, sự
  kiện, VIP, Thư Hùng (`liveops.js` TITLES). Đeo 1 danh hiệu; khung chữ theo phẩm (Codex vẽ).
- **Sưu tập hình thái** [Đề xuất]: chỉ huy hiệu và thành tích, không chỉ số.
- **Thiết kế danh hiệu:** không cho tự do; chỉ nhà vô địch Thư Hùng đặt chữ theo khuôn, kiểm duyệt.
- **Trang trí (chạm avatar trên HUD) [Có · Claude + Codex, 04/11]:** một bảng cho mọi cài đặt cá nhân: Avatar (chân dung tướng
  đã có + avatar mùa; "—" = theo tướng đang chọn), Khung (công tắc **Theo tướng**: khung HUD tự theo khung của tướng đang chọn nếu
  đã có), Danh hiệu, Thẻ tên, Bong bóng, Khung trận, Vào trận. Xem trước theo loại đang chọn (hồ sơ / chat / trận mini, ▶ phát lại
  hiệu ứng vào trận), lưới ô vẽ (chọn = socket sáng, đang dùng = huy hiệu đồng), món khóa ghi nguồn (mùa · nhánh ★cấp, Tân Thủ ·
  Ngày 7), footer một nút: Trang bị / Gỡ / Đi tới. Sổ "Bộ sưu tập" mở cùng bảng lọc theo mùa; nhận món mới có "Trang bị ngay".
- **Mỗi tướng một khung avatar:** Mika/Yuki/Nori/Lumi/Noct trong bộ mùa (nhánh Vàng ★10); **Hiro: Khung Lữ Khách**, miễn phí ở ngày 7
  Hành Trình Tân Thủ (cùng 20 mảnh Hiro), không mốc sao, không Đá Ngọc (`liveops.js` COSMETICS `hiro-frame`).
- **Thử (chỉ máy chủ thử / LAN, `previewLooks`):** đeo thử mọi món của mọi bộ, kể cả mùa chưa mở, để kiểm tra HUD, Quảng Trường và
  trận; không bao giờ ghi là đã sở hữu, tắt Thử là về bộ đã lưu. Tên miền thật không bật được.

---

## 16. Tải tài nguyên theo gói [Đêm nay]

Đo được: `assets/` 7,5 GB (gồm nguồn vẽ); bản hub nhúng một file 342 MB — không phát hành kiểu này được.

`node scripts/build_asset_packs.cjs` lập `assets/packs.json` từ mọi file mà combat và hub thực sự tải (bỏ ảnh
nguồn `raw/`, `sources/`):

| Gói | Nội dung | Dung lượng hiện tại |
|---|---|---|
| `core` | giao diện, Home, item, âm thanh chung | ~128 MB |
| `chapter-N` (24) | bản đồ, cảnh trận, quái, tinh anh, boss, nhạc của chương | 23–37 MB mỗi chương |
| `hero-<tướng>-f<N>` | sheet, showcase, âm thanh một hình thái | 4–17 MB |
| `summon` | hồ triệu hồi | ~4 MB |
| **Cài đặt** (`core` + `chapter-1` + Hiro) | | **~166 MB** (tổng mọi gói ~1,06 GB) |

- **Chọn gói** (`asset-packs.js` `packsFor(save)`): cần = core + chương đã mở + chương các tầng boss đã hạ + mọi
  hình thái đã mở của tướng sở hữu + gói triệu hồi; tải trước = chương kế, chương tầng boss kế, hình thái 1 tướng
  banner. Chưa sở hữu, chưa mở thì không tải. Có test.
- **Giảm dung lượng (việc tiếp):** âm thanh boss/quái đang là WAV → Ogg/Opus (~10× nhỏ hơn); icon PNG trong `core`
  (~46 MB) → WebP; ước tính cài đặt còn < 100 MB.
- **Vận hành (Codex):** giới hạn bộ nhớ đệm, tự xóa gói chương cũ ít dùng (giữ chương hiện tại ± 1), tải tiếp khi
  mất mạng, kiểm tra băm từng file, quay lui khi gói lỗi, phiên bản gói gắn với phiên bản client.
- Web: Cache Storage + service worker. Android: Play Asset Delivery (install-time = cài đặt, fast-follow = chương 2–3,
  on-demand = phần còn lại). Godot: mỗi gói một `.pck` nạp bằng `ProjectSettings.load_resource_pack`.

---

## 17. Đường sang Godot + máy chủ + Android

1. **Dữ liệu trước:** xuất JSON mọi bảng từ `progression.js` / `liveops.js` / `world.js` → Godot và máy chủ đọc chung.
2. **Lõi trận xác định + vector kiểm thử** (12.4) trước khi viết client Godot.
3. **Máy chủ:** tài khoản; sổ cái tiền tệ (mọi thay đổi số dư trong một giao dịch DB, khóa chống nhận trùng,
   idempotency key); thanh toán Google Play Billing (xác minh receipt phía máy chủ, xử lý refund/void); trận, ghép
   trận, BXH, hộp thư, sự kiện (admin có phân quyền + nhật ký audit), chat.
4. **Client Godot 4:** chỉ hiển thị + gửi ý định; giữ nguyên art đã duyệt; gói tài nguyên PAD.
5. Android trước, rồi iOS, rồi Steam.
6. **Pháp lý (điều kiện phát hành, không phải ghi chú):** thủ tục phát hành game tại Việt Nam, xác thực tài khoản và
   tuổi; người dưới 18 tuổi tối đa **60 phút/một game/ngày, tổng 180 phút/ngày** (theo quy định hiện hành, cần rà lại
   trước khi mở); công bố tỷ lệ ngay cạnh nút triệu hồi (Google Play yêu cầu với vật phẩm ngẫu nhiên); tuân thủ
   Play Billing.
7. **Chỉ số cần đo khi mở thử:** giữ chân D1/D7/D30, thời lượng phiên, phễu chương, thu–chi từng tài nguyên, tỷ lệ
   chuyển đổi nạp; tiêu chí dừng mở thêm hệ thống khi D7 chưa đạt.

---

## 18. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| **Đêm 03/11 (xong)** | Tài liệu + Codex phản biện 2 vòng; nhiệm vụ tuần; Sân Thử Luyện; concept hình thái Hiro 2–3; diện mạo hình thái; đường Mảnh Hiro (Tân Thủ, nhiệm vụ, rương, boss); Chi tiết lực chiến; Lộ trình; tướng chưa sở hữu xám; Lực chiến mới; triệu hồi 1%/100; Hiro tuyệt kỹ 70 + kiếm ×1,2; liveops + trang VIP/Thẻ tháng/Sự Kiện; gói tài nguyên + `packsFor`; mô phỏng cân bằng |
| Kế tiếp (web) | Đối chiếu mô phỏng với combat thật; Biến Thân (cổng cấp 180 + TH3); ngọc khảm; bộ hệ; báu vật; hình thái Hiro (vẽ); nén âm thanh/icon |
| Trước máy chủ | Lõi trận xác định + vector kiểm thử; xuất JSON dữ liệu |
| Máy chủ | Tài khoản, sổ cái, thanh toán, Đấu Hạng, Quảng Trường, sự kiện, BXH |
| Godot | Client Android + PAD |

---

## 19. Câu hỏi đã chốt (Claude + Codex, theo yêu cầu "tự bàn và xử lý")

| Câu hỏi | Chốt |
|---|---|
| Chọn hình thái thấp hơn trong trận? | Không. Chọn diện mạo ở thị trấn; trận dùng hình thái cao nhất. |
| Hình thái Hiro? | Có, ở 4★/6★ như mọi tướng; cần vẽ. |
| Giá | Thẻ tháng 109k, Sổ Vàng 149k, Sổ Diệu Ngọc 299k, Quỹ 299k. **Bỏ Thẻ Trọn Đời** (chủ dự án 03/11). |
| Cân bằng | Hiro tuyệt kỹ 70 và kiếm ×1,2 (đã áp, đo bằng mô phỏng); dẫn người chơi tới đồ + kỹ năng (Lộ trình); chưa hạ HP boss. |
| Báu vật độc quyền nạp? | Không. PvE đạt được trong 12–16 tuần; nạp chỉ nhanh hơn. |

---

## 20. Phản biện của Codex (vòng 1, `gpt-6.1-sol` high) và cách xử lý

| Codex nêu | Xử lý |
|---|---|
| Nhãn "đã thêm" sai thực tế lúc review | Đã triển khai và test đúng các mục ghi [Đêm nay] |
| Bảng mục 8 cấm vé từ gameplay — sai | Sửa: chỉ cấm Đá Ngọc; vé vẫn thưởng từ gameplay |
| Danh hiệu cộng chỉ số → VIP gián tiếp cộng sức mạnh | Danh hiệu chỉ trang trí |
| Hàng Chuẩn Hóa vẫn lợi thế người sở hữu tướng gacha | Chuẩn Hóa dùng chung danh sách tướng |
| Thưởng top là báu vật mạnh → vòng lặp người thắng | Thưởng top là trang trí |
| `settle()` tin client cả PvE | Ghi rõ máy chủ tự chạy mọi trận có thưởng; seed bí mật |
| VIP "không bao giờ giảm" → gian lận hoàn tiền | Thêm xử lý refund/chargeback, idempotency |
| Pháp lý chưa là điều kiện phát hành | Thêm mục 17.6 (giờ chơi dưới 18, công bố tỷ lệ, Billing) |
| Gacha 0,15% / 300 quá đắt (~12 triệu) | Đổi 1% / 100, giữ bảo đảm qua banner |
| Mảnh Hiro không có lịch chắc chắn | Thêm 80 mảnh tuần đầu + 6/ngày từ nhiệm vụ PvE |
| Biến Thân đến quá muộn (cấp 400 ≥ 190 ngày) | Cổng Biến Thân cấp 180 + TH3 khi làm |
| Lực chiến × (1+Thủ) không tỉ lệ TTK | Đổi ÷ (1 − Thủ) |
| Đo trước khi chỉnh; không chồng bạo kích ngẫu nhiên | Làm bộ mô phỏng; bỏ bạo kích ngẫu nhiên |
| Bỏ ×2 điểm xếp hạng cuối tuần; Thử Luyện 2 lượt | Áp dụng |
| Thiếu: thứ tự hiệu ứng, lượt, chống khóa choáng, hòa, đi trước; vận hành gói; KPI | Thêm 5.4, 16, 17.7 |
| Hiro hình thái theo tiến hóa (TH3/TH6)? | Codex không đồng ý → giữ 4★/6★ |

Điểm Claude không theo Codex: Codex đề xuất "diện mạo cũ nhưng sức mạnh bộ kỹ năng cao nhất" — Claude giữ đúng tinh
thần đó nhưng chỉ cho đổi diện mạo **ngoài trận**, vì trong trận hoạt cảnh tuyệt kỹ thuộc về từng hình thái.

### Vòng 2 (Codex soát code + tài liệu bản 2)

| Codex nêu | Xử lý |
|---|---|
| Màn triệu hồi vẫn ghi bảo đảm 300 | Sửa, đọc `SUMMON_PITY` |
| Lộ trình: đủ 6 món thì hàng Trang bị luôn "thiếu" | Xét cường hóa: còn món < +20 trả được phí → "làm được ngay"; cả 6 món +20 → "tối đa"; có test |
| "Đi tới" để bảng trang bị che tab đích | Đóng bảng trang bị khi đi tới |
| Mô phỏng xử thua ở lượt 60 | Bỏ; combat không có giới hạn lượt; số liệu 5.2 đo lại |
| Gói tải lẫn ảnh nguồn, prompt | Bộ quét bỏ trường source/prompt/raw và file raw-, prompt, .txt |
| Ngân sách vé/mảnh chưa khép | Ghi rõ ở mục 11 (≈ 50 vé/28 ngày; Mảnh Hiro theo nguồn) |
| Hòm Thư vs Đá Ngọc thẻ tháng mâu thuẫn | Phân biệt thư giao dịch (máy chủ thanh toán) với thư quà admin (0.6) |
| Thiếu ngày neo, bảng thu–chi báu vật | Ngày neo 02/11/2026; bảng điểm báu vật PvE (mục 4) |
| Chưa đồng ý chốt cân bằng | Giữ trạng thái "đo, chưa chốt"; việc kế tiếp số 1: đối chiếu mô phỏng với combat thật |
| Việc tiếp theo nên làm | 1) đối chiếu mô phỏng; 2) khép ngân sách 28/90 ngày; 3) Sân Thử Luyện |

### Vòng 3 (03/11, sau phản hồi của chủ dự án; luật mới: hai bên cùng quan điểm mới làm)

| Mục | Codex | Claude | Chốt chung |
|---|---|---|---|
| A. Quảng Trường dọc | Đồng ý nếu sửa bàn phím, điều khiển, mật độ, tiếp cận | Đồng ý cả | Bàn phím thu vùng bản đồ; kéo = cần điều hướng tại chỗ chạm (tùy chọn cố định, đổi bên); chạm = đi; WASD dừng khi gõ; chạm người xa tự đi tới (hết hạn 5 giây, hủy khi kéo); tối đa 4 bong bóng × 2 dòng; thẻ 45% với 3 nút chính; Người gần; tối đa 3 mũi tên chỉ bạn/bang (tắt được); hướng dẫn 30 giây do Mèo Hướng Dẫn |
| B. Máy chủ xã hội | Đồng ý nếu sửa danh tính, xác thực, lưu trữ, giao thức Godot | Đồng ý | Máy chủ cấp token (băm, thu hồi được); máy chủ tính chuyển động từ ý định; tick 10 Hz + số thứ tự; nhịp tim 30 giây; payload 4 KB; giới hạn theo loại tin; Origin cho web (SOCIAL_ORIGINS); JSON chỉ dev, SQLite trước thử công khai; giao thức có phiên bản (`docs/SOCIAL_PROTOCOL.md`) |
| C. Bang hội | Đồng ý nếu sửa phân quyền, kế vị; làm Dệt Đèn trước | Đồng ý | 1 Phó + 2 Trưởng Lão; chỉ thao tác người chức thấp hơn; kế vị 14 ngày (báo ở ngày 7); cấp kế cần 1.000×cấp; Dệt Đèn Bang làm thật |
| D. Giao hữu | Đồng ý nếu ghi nhãn, bỏ công bố kết quả | Đồng ý | "Giao hữu với bản sao · AI · Không thưởng"; chỉ số chuẩn hóa; không công bố thắng/thua |
| E. Trang bị dư | **Không đồng ý** gói số liệu của Claude | Đồng ý với Codex | Giữ túi 500 (cảnh báo 450), quặng phân giải hiện tại 3/5/8/12/21/33; hoàn 70% chi phí cường hóa thực trả, ghi lịch sử, chống nhận trùng; loại món khóa, đang mặc, vũ khí bản mệnh; tự phân giải mặc định tắt (gợi ý bật Thường ở cấp 30, bảo vệ món tốt hơn bộ đang dùng); lọc ô/phẩm/chủ, xem trước tổng thu hồi; **bỏ dung luyện 3→1**; "Mặc tốt nhất" chọn mục tiêu Công/Sinh tồn, xem trước, không lấy đồ tướng khác |
| F. Chấm đỏ | Đồng ý nếu sửa nghĩa màu | Đồng ý | Đỏ = quà nhận ngay, miễn phí; xanh lá = gợi ý nâng được (tắt được); xanh dương = số thư/lời mời; hợp nhất theo ID ở nút cha; sự kiện nạp: viền sáng 2 nhịp khi vào hub rồi đứng yên, tắt được, không chấm đỏ vì "có thể nạp" |
| G. Sổ 3 nhánh | Đồng ý nếu sửa điều kiện, Hiro, cấp mua | Đồng ý | Xem §10: không Mảnh Hiro trong rương trả phí, phiếu cho tài khoản chỉ có Hiro, rương đồ theo cổng ải 60/80, +10 cấp tính vào giới hạn mua; bỏ Thẻ Trọn Đời |

### Vòng 4 (03/11, dữ liệu trận thật từ bot `qa/gemwoven/real-fights.cjs`)

| Mục | Codex | Claude | Chốt chung |
|---|---|---|---|
| A. Cân bằng | Đồng ý giữ số; chỉ chốt "v1 cho chương 1–2"; không dùng một hệ số hiệu chỉnh chung cho mô phỏng; chưa duyệt kiếm ×1,25 | Đồng ý | Bot trận thật là phép thử nghiệm thu: 80 trận/ô để bắt hồi quy, ~400 trận/ô trọng yếu khi nghiệm thu (±5 điểm); ghi riêng trận hết giờ với trận thua. Mô phỏng chỉ để quét nhanh. Hiro 1★ 43% (KTC 33–54%) chưa chứng minh dưới mục tiêu. **Còn mở:** quái thường 11–20 lượt so với mục tiêu 4–8 — thống nhất cách đếm lượt rồi xử lý ở vòng sau |
| B. Báu vật | Đồng ý nếu sửa lịch, giá Thần, quy tắc đổi | Đồng ý | 600 điểm/kỳ PvE (đạt được khi chưa có báu vật, không phụ thuộc xếp hạng); Tím 300, Cam 900, mảnh Đỏ 150×10, **mảnh Thần 175×12 = 2.100**; **nâng phẩm tiêu hao món trước** → tổng 4.800 điểm = 8 kỳ = **16 tuần**; tích nạp tối đa +1.500/kỳ (100k: +300, 500k: tổng +1.000) → ~6 tuần; điểm và mảnh giữ qua kỳ; Phá Sơn trần 8× Công **tổng cho một lần tuyệt kỹ**; **mọi báu vật tắt ở Chuẩn Hóa** |
| C. Ngân sách miễn phí | Đồng ý nếu sửa phần ổn định và mốc bảo đảm | Đồng ý | Vé nền **50/28 ngày** (28 đăng nhập + 12 tuần + 10 sổ); tháng đầu ~62 (thêm tân thủ, mốc cấp hữu hạn); 100 vé ≈ 56 ngày → bảo đảm **tướng của banner đang quay** mỗi ~2 tháng (không phải tướng chưa sở hữu); Mảnh Hiro chắc chắn: ngày 28: 248 (3★), ngày 90: 620 (đủ 4★), 6★ ≈ **ngày 240** từ tân thủ + nhiệm vụ ngày (nhanh hơn nhờ rương/tầng); cần đủ vàng, tinh hoa |
| D. Biến Thân | Đồng ý nếu chốt lượt, kích hoạt, thay nội tại cũ | Đồng ý | Cấp 180 + TH3; một lần/trận, người chơi bấm khi HP ≤ 50% hoặc sau tuyệt kỹ thứ hai; **không tốn lượt, không cho địch đánh thêm, không hồi máu**; 3 **lượt của chủ sở hữu**: Công +25% (Chân Thân cấp 1) → +40% (cấp 10), giảm 15% sát thương nhận, miễn choáng/đóng băng mới (không giải hiệu ứng đang có); hết hạn giữ +10% Công (thay thế, không cộng dồn); cấp 400 + TH5: 4 lượt, dư âm +15%; **bỏ thưởng Công/HP Chân Thân cũ**; hào quang chỉ của hình thái đã mở; tắt ở Chuẩn Hóa/giao hữu |

### Vòng 5 — soát giao diện (Codex xem ảnh chụp mọi màn điện thoại)

Codex nêu 25 điểm theo màn và 15 sửa đổi ưu tiên; Claude đồng ý. Đã sửa: vùng bấm HUD (+, thư, cài đặt ~44 px);
tên cho mọi tab thanh đáy; nền mờ của màn phủ phần thừa chiều cao điện thoại; chữ tối thiểu trong các bảng (≈12,5 px);
nút Triệu Hồi ghi giá (1 vé / 10 vé / Đá Ngọc / "Thiếu 3 vé"); Đấu Trường ghi "Cùng máy", "Kỷ lục thiết bị", "Cục bộ";
"Bảng Xếp Hạng" đổi thành "Thành Tích" (kỷ lục của bạn); kỹ năng khóa ghi điều kiện mở trên cây ("Cấp 100 · TH2");
"46/150 sao"; Sân Thử Luyện đưa boss hôm nay lên đầu, lịch các ngày khác, luật thu vào "Cách chơi"; Kho Offline chỉ còn
tốc độ, thời gian, thưởng, nút có lý do, công thức thu gọn; Sự Kiện ghi "đã nhận x/7" và "Mở sau n ngày"; VIP mỗi gói
3 quyền lợi chính + "Xem đủ"; Hòm Thư nút ghi lý do; Túi Đồ khóa có chỗ riêng, nút cao hơn; phân giải hàng loạt mặc định
+0, luật nằm trên nút xác nhận; Gặp Gỡ: chữ, bong bóng 3 dòng, ticker nền đặc, cột phải 3 nút + Thêm (hướng dẫn "?"), nút
"Giao hữu · bản sao AI", bảng tên người đứng gần tự giãn; chấm: xanh "↑" còn hiện khi còn nâng được (Codex đổi ý so với
vòng 3, Claude đồng ý), thư chưa đọc màu xanh dương, chấm chỉ trên nút điều hướng; VIP nhãn tĩnh "Ưu đãi nạp".
**Còn lại** (mức trung/thấp): chú giải trạng thái ải trên bản đồ, gọn Lò Rèn/Cửa Hàng/Quán Bia, tách thanh cấp và EXP ở
màn Tướng, hướng nhìn cho trình đọc màn hình.

### Vòng 6 (ngọc khảm, báu vật thử nghiệm, độ dài trận quái thường, thứ tự làm)

| Mục | Codex | Claude | Chốt chung |
|---|---|---|---|
| A. Dệt Ngọc | Đồng ý nếu sửa cộng dồn và nghiệm thu | Đồng ý | Lỗ: Hiếm 1 · Sử Thi 2 · Huyền Thoại 3 · Thần 4; tháo miễn phí, phân rã/đổi đồ trả ngọc; Công%/HP% cộng giữa các viên rồi nhân **một lần** sau Trang bị (trần 36% / 54%); Thủ cộng điểm (trần 12% từ ngọc, tổng vẫn ≤ 50%); **kháng ≤ 40%, chính xác ≤ 30%**: xác suất cuối = min(100%, p×(1+chính xác))×(1−kháng), chính xác chỉ cho hiệu ứng Thần có xác suất; Boss Vô Hạn tầng 20–79: 15% cấp 1, tầng 80+: 15% cấp 1 + 5% cấp 2 (tối đa 1 viên/trận, 12 trận đầu/ngày); Sân Thử Luyện mốc ≥3 thanh: 1 viên cấp 1; nhiệm vụ tuần chọn loại; ~3,9 viên/ngày → 1 viên cấp 5 ≈ 81 viên ≈ 100 ngày; tắt ở Chuẩn Hóa/giao hữu/1vs1; nghiệm thu lại cân bằng chương 1–2 |
| B. Báu vật thử nghiệm | Đồng ý nếu sửa nguồn điểm | Đồng ý | Làm **sau** ngọc và Hiro; nguồn chia lại cho đúng **600/kỳ có lịch** (không phải 25 điểm × 12 trận × 14 ngày = 4.200); 16 tuần cho một món Thần; lưu riêng bản thử, không chuyển sang phát hành; đổi điểm nguyên khối, chống nhận trùng; chốt cộng hai ô, % Thủ, Khắc Chế hai ô; Phá Sơn trần trên tổng tuyệt kỹ; Mượn Hồn không mượn bộ chiêu boss; tắt ở Chuẩn Hóa |
| C. Quái thường | Đồng ý mục tiêu 8–12 lượt, đo chưa có ngọc, không chờ ngọc | Đồng ý | Nghiệm thu: trung vị **8–12 nước**, P90 ≤ 16, thắng ≥ 95% ở cấp và đồ gợi ý; nếu vượt, thử giảm **20% HP nhóm quái thường** (giữ boss/tinh anh), đo bằng bot 80 trận/ô sàng lọc, ~400 trận/ô nghiệm thu |
| D. Thứ tự | Đồng ý nếu đổi | Đồng ý | Đo/chốt C → trang Đấu Hạng [Có] → ngọc thử → đo hồi quy → Hiro 2/3 → báu vật thử |

### Vòng 7 — soát giao diện (ít chữ, dùng hình, bấm xem chi tiết)

Chủ dự án yêu cầu (03/11): hạn chế chữ, dùng hình; thông tin quan trọng để dạng bấm xem; mọi giao diện và hình đều qua
Codex. Codex soát ảnh ngọc khảm, Danh Hiệu, Biến Thân, Đấu Hạng, Gặp Gỡ, Home, Boss; Claude đồng ý và đã sửa: lưới ngọc
3 cột có dấu cấp I–V, chạm ngọc hiện tác dụng rồi mới "Khảm"; ghép ngọc vẽ "I I I → II"; chỉ số trang bị thành biểu tượng
tim/kiếm/khiên kèm mũi tên; lỗ khảm và nút ≥ 44 px; biển danh hiệu trong trận nhỏ lại, giữ trong khung; Biến Thân: sẵn sàng
= nhãn sáng, đang hiệu lực = huy hiệu tròn đếm lượt, dư âm = huy hiệu nhỏ; Đấu Hạng = 2 thẻ hình + 3 mục bấm mở; lịch Sân Thử
Luyện = ảnh boss có dấu ✓; Gặp Gỡ "Thêm" dùng biểu tượng lưới. Hình Codex vẽ: không cần vẽ lại.

### Đo quái thường (vòng 6, mục C) — bot trận thật, 40 trận/ô, chưa có ngọc

| Ải (cấp) | Hiro 1★ 100% HP: trung vị/P90/thắng | Hiro 1★ 80% HP | Mika 1★ 100% HP | Mika 1★ 80% HP |
|---|---|---|---|---|
| 12 (6) | 9 / 16 / 100% | 8 / 18 / 100% | 4 / 9 / 100% | 5 / 9 / 100% |
| 37 (19) | 12 / 21 / 100% | 10 / 18 / 100% | 6 / 10 / 100% | 6 / 10 / 100% |
| 63 (32) | 12 / 23 / 100% | 11 / 18 / 100% | 7 / 10 / 100% | 7 / 12 / 100% |
| 88 (44) | 11 / 22 / 93% | 11 / 20 / 98% | 8 / 16 / 100% | 6 / 11 / 100% |
| 126 (63) | 14 / 22 / 95% | 13 / 20 / 100% | 6 / 10 / 100% | 6 / 10 / 100% |
| 163 (82) | 15 / 26 / 93% | 13 / 20 / 95% | 8 / 13 / 93% | 8 / 14 / 90% |

Giảm 20% đồng loạt chưa đủ cho Hiro (P90 vẫn 18–20) và làm Mika dưới 8 nước. **Chưa áp** — chờ Claude và Codex chốt
(vòng 8). `NORMAL_HP` trong `progression.js` vẫn là 1.

### Vòng 8 (độ dài trận quái thường) — đã thống nhất cách đo

Codex chọn đo **P2** (kiếm Hiro ×1,3 chỉ PvE) và **P1** (P2 + quái thường −10% HP) cùng đối chứng, 80 trận/ô xen kẽ; **không**
nới mục tiêu cho Hiro (P3). Tiêu chí nghiệm thu từng ô (chưa ngọc, cấp/đồ gợi ý): Hiro 1★ quái thường trung vị 8–12, P90 ≤ 16,
thắng ≥ 95%; Mika 1★ quái thường trung vị ≥ 4 (ải 12) / ≥ 6 (từ ải 37), ≤ 12, P90 ≤ 16, thắng ≥ 95%; Hiro 1★ boss chương 1
thắng 50–70%, boss chương 2 45–55% (cận trên KTC ≤ 60%); Mika 1★ boss không giảm quá 5 điểm, nước thắng không tăng quá 10%.
Trận hết giờ tính vào mẫu. Đã làm: kiếm Hiro tách thành `pveSword` (chỉ ải, boss vô hạn, Thử Luyện; 1vs1, giao hữu, PvP luôn ×1);
bot nhận phương án qua `?gwv=` (chỉ QA).

### Vòng 9 (báu vật thử nghiệm) — đã thống nhất, làm sau Hiro 2/3

- **Điểm 600/kỳ** (neo 00:00 02/11/2026 GMT+7, tuần từ thứ Hai): mỗi ngày nhận thưởng **ít nhất 3 nhiệm vụ ngày khác nhau** → 30;
  mỗi tuần thắng 8 Boss Vô Hạn → 60; mỗi tuần có lượt Sân Thử Luyện **≥ 3 thanh** (sát thương ≥ 3× HP một thanh) → 30. Khóa
  nhận theo ngày/tuần/loại; tuần mới đếm lại; điểm giữ qua kỳ. Phải chứng minh tài khoản chỉ Hiro, chưa báu vật đạt đủ lịch.
- **Ô:** ô 1 ngay, ô 2 ở TH3 của tướng nhận; chuyển miễn phí, một món một nơi, khóa cấu hình khi vào trận. Công/HP: Lam 4% →
  Thần 20%; **Thủ +1/+2/+3/+4/+5 điểm**; hai ô cộng rồi nhân một lần sau Ngọc; trần báu vật Công/HP +30%, Thủ +10 điểm; bảng
  chi tiết hiện cả phần bị trần cắt.
- **Hiệu ứng** (từ Cam): Phá Sơn 2/3/4% HP tối đa boss, trần 8× Công cho tổng cả lần tuyệt kỹ, Công chốt lúc tung, không tự kích
  lại; Mượn Hồn 50% **phần tăng thêm** của bị động đã học của tướng khác đang sở hữu (×1,6 → ×1,3), không mượn Chân/Biến Thân, bộ
  chiêu boss; Khắc Chế trừ năng lượng một lần khi tuyệt kỹ trúng, sàn 0 (chốt có chịu kháng hay không khi làm). Cùng họ lấy món
  mạnh hơn, khác họ cùng hoạt động. Tắt cả chỉ số lẫn hiệu ứng ở Chuẩn Hóa/giao hữu/1vs1.
- **Lưu thử** tách riêng `gemwoven.treasure.v1` (bản sao tiến trình thử + báu vật), không chuyển về bản chính; đổi nguyên khối,
  nâng phẩm tiêu hao món trước, 4.800 điểm ≈ 16 tuần; Lam tặng miễn phí để giới thiệu.
- **Giao diện:** 15 biểu tượng (họ × phẩm) do Codex vẽ, dấu bậc, nhãn "Bản thử nghiệm cục bộ" luôn thấy, chạm xem chi tiết, Codex soát.
- **Trần chung** ngọc + báu vật: chưa thêm; đo Công +76,8%, HP +100,2% trước. **Đo trước khi bật:** sim rồi bot thật theo từng họ/phẩm.
- Sửa kèm: rơi ngọc Sân Thử Luyện dùng đúng mốc ≥ 3 thanh (tier ≥ 4).

### Vòng 10–12 (Hiro hình thái 2/3, Mika chạy)

- **Đặc tính Hiro H3:** Codex đề nghị thử ×1,5 có đo A/B; chủ dự án (03/11) yêu cầu không buff mạnh tướng miễn phí → chốt nhẹ:
  tuyệt kỹ +15% (≈ +5% cả trận). Phương án kiếm ×1,3 (vòng 8, P1/P2) bị loại vì cùng lý do; độ dài trận quái thường của Hiro
  sẽ xử lý ngoài sức Hiro (mở lại với Codex).
- **Mika H3 chạy:** chủ dự án thấy mặt khi chạy to hơn khi nghỉ; Claude và Codex đo mắt–cằm độc lập (to hơn 20–28%), cùng
  chốt `run`/`dash` scale 1,6957 → **1,38**; H2 (1,6172) không lỗi.
- **Hiro H2/H3 (Codex soát ảnh):** đúng concept, tỉ lệ ba hình thái nhất quán (mắt–cằm 13,5/14,3/15,0 trên ô 256), chạy H3 giữ
  scale 0,90, không chạm biên; đã khử vài điểm ám hồng ở khung nghỉ H3. Đạt.

### Vòng 13 (quái thường, không buff Hiro) — đã thống nhất

Dữ liệu 80 trận/ô (bot trận thật, bản gốc): Hiro 1★ quái thường thắng 93–100%, trung vị 8–16, P90 19–26; boss chương 1 76%, chương 2
44%. Mika 1★ quái thường trung vị 5–8; **ải 163 chỉ thắng 86%**. Chốt: giữ Hiro gốc; mục tiêu là **khoảng mềm** (Mika 1★: thắng
≥ 95%, P90 ≤ 16, trung vị định hướng 6–10; Hiro 1★: thắng ≥ 93%, trung vị ≤ 16, P90 ≤ 26 — chậm hơn có chủ đích, cách nhanh hơn là
trang bị/ngọc/Lộ trình); chương 4 **điều tra nguyên nhân** (quái nào, chết vì gì) rồi sửa đúng điểm, chỉ giảm diện rộng khi
nhiều ải cùng xác nhận; boss chương 1 giữ (ngoại lệ nhập môn); boss chương 2 xét riêng.
- **Nguyên nhân ải 163 (điều tra vòng 13):** HP và Công quái thường tăng đều qua chương 3→4→5 (Công/cấp gợi ý 0,0773→0,0786, HP/cấp
  23,5→25,4), không có bước nhảy. Chương 4 là hệ **Lôi**, và Lôi khắc Hỏa (`BEATS.lightning='fire'`) → quái gây ×1,5 lên Mika; Hiro
  không hệ nên không bị (93%). Đúng thiết kế khắc hệ: người chơi đổi tướng (Nori hệ Mộc khắc Lôi). **Không chỉnh số.** Gợi ý cho
  giao diện: thẻ ải nên báo "Bất lợi hệ" khi tướng đang chọn bị khắc.


### Vòng 14 (boss chương 2 cho Hiro, không buff Hiro) — đã thống nhất

Codex: 44% ở 80 trận nằm trong KTC Wilson 33–55%, chưa đủ bằng chứng; giữ boss, đo lại mẫu lớn trước khi chỉnh (ứng viên duy nhất
nếu vẫn thấp: Long Vĩ Quật 1,25 → 1,22, đo xen kẽ). **Đo lại (04/11, bot trận thật, ải 100, cấp + đồ gợi ý, chưa ngọc, 200 trận/ô):
Hiro 1★ thắng 48% (trung vị 21 nước, P90 32, không hết giờ); Mika 1★ 75% (14 / 21).** Hiro nằm trong mục tiêu 45–55% → **giữ nguyên,
không chỉnh số**.
### Vòng Đấu Trường 1–2 (04/11, Cúp Đấu Trường) — đã thống nhất
- **Tên:** Codex chọn "Cúp Đấu Trường" (dễ nhận bằng chiếc cúp, khác hẳn tên trang trọng của giải quý). Đồng ý.
- **Điểm:** Claude đề xuất thắng +20 / thua −10 → Codex phản biện: một thắng một thua trước đối thủ ngang sức vẫn +10, thưởng đánh nhiều.
  Chốt **Elo đối xứng K 40**. Đồng ý.
- **Xoay 4 tướng/tháng:** Codex bỏ (mới có 2 tướng; mượn mọi tướng đã phát hành). Đồng ý.
- **Thưởng:** Claude đề xuất 400 điểm báu vật, 2 ngọc cấp 3, vàng/tinh hoa theo hạng → Codex: tạo vòng thắng-rồi-mạnh-hơn, trái §20 vòng 1
  ("thưởng top là trang trí"). Chốt: hạng chỉ trang trí (danh hiệu, khung, cúp, vinh danh), gói 10 trận như nhau. Đồng ý.
- **Top 8:** thêm điều kiện 30 trận, 5 trong 7 ngày cuối (chống ngồi điểm). **Bản thử:** không trao thưởng, kể cả vàng nhỏ (cả hai cùng ý).
- **Bản thử khác máy chủ:** không cổng ải 30, không áp ≥ 32 người, trận AI–AI phân định lúc 20:00; tỷ số hòa chưa có (trận cục bộ chỉ thắng/thua).

### Vòng D3 (04/11, chu kỳ lặp lấy thêm mảnh tướng) — đã thống nhất, đã làm
- **Tỷ lệ bụi:** Claude đề xuất 50 bụi/bản dư, 1/mảnh → Codex: cùng 80 mảnh sẽ có giá trị khác nhau tùy đã ghép hay chưa.
  Chốt **80/bản, 1/mảnh**. Đồng ý.
- **Bụi tuần:** Claude đề xuất 10 → Codex: với giá 8/mảnh cần 64 tuần mới đủ 80 mảnh. Chốt **40/tuần** từ một mốc nhiệm vụ tuần. Đồng ý.
- **Cúp:** 30 bụi/tháng khi đủ 10 trận, không theo thắng/hạng, chỉ máy chủ; bản thử 0. **Hiro** ngoài hẳn hệ Ký Ức (nếu đổi
  được, mảnh Hiro từ nhiệm vụ ngày thành nguồn nuôi tướng hiếm thường trực). Đồng ý.
- **Kệ Ký Ức:** cho mua tướng chưa sở hữu nhưng chỉ tướng đã qua ≥ 42 ngày từ banner đầu, ngoài banner hiện tại; 2 tướng/tuần
  xoay lần lượt (không bốc ngẫu nhiên khiến người chơi chờ vô hạn). Đồng ý.
- **Chạy lại banner:** viết bằng công thức "kỳ chạy lại − kỳ trước ≥ 3" (câu "không lặp trong ba kỳ trước" đòi tối thiểu 8 tuần).
  Lịch xoay chỉ khi ≥ 3 tướng hiếm đã phát hành; tướng có dữ liệu chưa phát hành không tự vào lịch. Đồng ý.
- **Rương ngày 28:** Claude định coi nhánh Diệu Ngọc là thay thế → Codex không đồng ý (Diệu Ngọc là nhánh trả phí, hai nhóm
  người chơi khác nhau). Chốt rương **miễn phí 20 mảnh** tự chọn, phiếu khi chưa có lựa chọn. Đồng ý.
- **Giao diện:** Codex phê bình màn Cửa Hàng/Sự Kiện, viết prompt và vẽ mockup (`assets/gemwoven/raw/memory-shop/mockup-raw.png`,
  8,5/10), vẽ icon Bụi Ký Ức; dựng bằng UI kit có sẵn, rồi Codex chấm bản dựng (điểm ghi ở `docs/REQUEST_TRACKER.md` D3).
- **Chờ máy chủ:** thưởng Cúp, xác thực thời gian/giao dịch, chống nhận lặp, công bố lịch banner. Tài khoản thử cục bộ không
  chuyển số dư sang bản phát hành. Kiểm thử: `qa/gemwoven/check-depth.cjs` ("memory dust ok").

### Vòng Nạp (04/11, đơn vị tiền tệ và nơi bán gói) — đã thống nhất, đã làm
- **Chủ dự án:** "Đơn vị tiền tệ thì không cần giải thích, cho phép mua thêm trong cửa hàng bằng ngọc. Ngọc thì phải nạp. Còn có
  nên cho vào cửa hàng hay không thì tôi chưa rõ, cần các bạn thẩm định hoặc tạo trang riêng để bán các gói khác nhau."
- **Popup:** bỏ câu công dụng; giữ ảnh, tên, số đang có; "Mua thêm" mở đúng món, Đá Ngọc "Nạp"; nguồn miễn phí gập ở "Cách
  kiếm ›" (≤ 3). Tài nguyên không bán chỉ hiện nguồn. Đồng ý.
- **Vàng bằng ngọc:** Claude hỏi có nên bán; Codex: được, nhưng theo đơn vị R = vàng tích lũy một giờ để giá trị theo tiến độ,
  hạn mức chung 12R/ngày, không nhân VIP. Rủi ro là bán tốc độ trên nhiều hệ thống (vàng → sách/nguyên liệu → nâng cấp, rèn):
  đo trước phát hành, gói phải hữu ích nhưng không thành việc bắt buộc mỗi ngày. Đồng ý; `balance-sim` không mua vàng nên kết
  quả không đổi (đã chạy trước/sau).
- **Nơi bán:** một trang Nạp riêng, hai lối vào (HUD "+" và nút Nạp trong Cửa Hàng), giống tiền lệ Genshin (Crystal Top-Up trong
  Shop, trạng thái thưởng lần đầu trên từng gói). Màn VIP giữ quyền lợi; Thẻ Tháng / Sổ / Quỹ có lối vào từ trang Nạp. Đồng ý.
- **Giao diện:** Codex phê bình, viết prompt và vẽ mockup trang Nạp và popup (`assets/gemwoven/raw/topup/mockup-page.png`,
  `mockup-popup.png`, cả hai 8/10 điện thoại, 8,5/10 Studio), vẽ túi/rương ngọc 6 mốc, khung thẻ, ruy băng, bảng giá, 3 chồng
  vàng; bản dựng 8,4 / 8,5 → **8,7 / 8,6** (điện thoại / Studio). Thanh toán vẫn Sắp ra mắt. Kiểm thử: `check-depth.cjs` ("gold for gems ok").

### Vòng Nâng Phẩm (04/11, nâng/ghép trang bị, tỉ lệ thành công) — đã thống nhất, đã làm
- **Chủ dự án:** trang bị có nâng/ghép lên đồ tốt hơn được không, có nên có tỉ lệ thành công?
- **Ghép 3 món → 1** (Claude cân nhắc) → Codex: phải tích ba món cùng ô, mất món đang đầu tư. Chốt **một món + nguyên liệu
  → phẩm kế**, giữ +N, ngọc, chủ. Đồng ý.
- **Tỉ lệ:** Codex: không thêm thất bại lúc này, kể cả +16→+20 (phương án dự phòng nếu thử: 50% → 75% → 100% sau mỗi lần
  trượt, không vỡ đồ/tụt cấp, không bán bảo hiểm). Chốt **100%**, giao diện không hiện "%" để đồ hiến không bị hiểu là
  tăng tỉ lệ. Đồng ý.
- **Phí:** hiệu phí rèn phẩm đích − phẩm nguồn, tính từ `craftCost` (bảng §3); phân rã không hoàn phí nâng. Đồng ý.
- **Đồ hiến** (chủ dự án duyệt thêm): Codex: ô bất kỳ đúng phẩm nguồn (ép cùng ô gây tích đồ chờ; cho phẩm cao hơn dễ đốt
  món tốt); 20%/món quặng/gỗ/vải, trần 60%; hoàn 70% cường hóa + 100% ngọc. Đồng ý.
- **Thần thạch:** sau ải 300, nhiệm vụ tuần Trùm Vô Tận +10. Không Đá Ngọc, không buff Hiro. `balance-sim` không mô phỏng
  trang bị nâng nên kết quả trước/sau giống hệt (đã chạy).
- **Giao diện:** Codex phê bình bố cục, viết prompt và vẽ 3 mockup (`assets/gemwoven/raw/forge-rarity/mockup-1..3.png`:
  8,6 / 8,8 / 8,7), vẽ biểu tượng tab, khung ô hiến, tấm gỗ hoàn trả; bản dựng 8,4 / 8,3 → 8,6 / 8,5 → **8,8 / 8,6** (điện
  thoại / Studio). Kiểm thử: `check-depth.cjs` ("rarity up ok", "rarity up fodder ok").

### Vòng Tính năng kế tiếp (04/11, Dẫn Đường + Lịch 28 ngày) — đã thống nhất
- **Chọn việc:** Codex soát toàn bộ tài liệu + code (`assets/gemwoven/raw/feature-pick/survey.md`), xếp theo giá trị/công sức những
  phần đã thiết kế mà chưa làm và làm được cục bộ: **1. Dẫn Đường** (hướng dẫn tân thủ 10 phút đầu, 5/M), **2. Lịch 28 ngày**
  đầy đủ (4/M), rồi album hình thái, khung chân dung, ×2 cuối tuần, mở rương/thẻ thời gian, bộ hệ, mẫu sự kiện chạy thật, thư
  thưởng sự kiện. Để sau: vũ khí bản mệnh (chưa chốt giá, tỷ lệ, tinh luyện; thêm lớp sức mạnh trước khi có hướng dẫn), quét ải 3★
  (quyền lợi trả phí), trang phục (cần vẽ thân tướng mới, tướng đang khóa). Không phải việc dở: thành tích ngoài danh hiệu, đội hai
  tướng, Bách khoa quái (chưa có thiết kế); ngọc tầng 60+ và "Bất lợi hệ" đã có. Claude đồng ý thứ tự này.
- **Dẫn Đường** (Claude đề xuất, Codex sửa 6 điểm, Claude nhận cả 6 — `agree.md`):
  1. Không thưởng riêng, không Đá Ngọc, không đổi số trận, Hiro giữ nguyên; tướng, Trang Chủ, Triệu Hồi giữ nguyên hình (chỉ lớp phủ).
  2. Lưu `p.guide={v:1,skipped,done:[],lessons:[]}`; `done` là bước **đã xong hoặc đã bỏ qua tự động**, chốt rồi không mở lại.
     Luật ở `progression.js` (`GUIDE_STEPS`, `guideView`), đồng bộ trong mọi giao dịch; giao diện `guide-ui.js`, trận `combat-coach.js`.
  3. Tám bước theo thứ tự **Thắng ải 1 → Ghé thăm → Tân Thủ ngày 1 → Tăng cấp → Thắng ải 3 → Triệu hồi → Mặc đồ → Thắng ải 5**:
     ải đã qua ≥ 1; đã nhận "Ghé thăm thị trấn" (chốt ngay khi nhận, kể cả trước lượt của bước, giữ qua ngày mới); Tân Thủ ngày 1 đã
     nhận; một tướng sở hữu cấp ≥ 2; ải ≥ 3; đã triệu hồi ≥ 1 lần; một tướng mặc ≥ 1 món có thật; ải ≥ 5. Điều kiện đúng lúc nào
     thì bước đó xong lúc đó, dù làm theo thứ tự nào. **Bỏ qua tự động chỉ xét khi tới lượt bước**: Triệu hồi khi 0 vé, Mặc đồ khi
     không có món nào. Xong cả tám mới kết thúc (một câu chào, không quà). Bộ đếm cố định `n/8`.
  4. Đường đi: Trang Chủ → Khám Phá → bản đồ thế giới → chương 1 → ải → Khiêu Chiến; Quán Bia → Nhận Thưởng; Sự Kiện → Ngày 1;
     Tướng → Tăng Cấp; Triệu Hồi → ×1 **chỉ khi còn vé**, cả ở bảng xác nhận; nếu bảng đổi sang trả Đá Ngọc thì thôi chỉ; Tướng →
     ô đồ / Mặc tốt nhất.
  5. Bản lưu cũ chưa có `guide` mà đã qua ≥ 5 ải → hoàn tất im lặng (không câu chào); còn lại tiếp từ bước chưa xong đầu tiên.
     **Bỏ qua** (xác nhận) tắt cả hướng dẫn lẫn bài học; Cài Đặt → **Hướng dẫn · Xem lại** bỏ trạng thái bỏ qua và tiếp từ bước
     chưa xong (không đặt lại tiến độ hay bước đã chốt); đã hoàn tất thì ghi "Hướng dẫn đã hoàn tất".
  6. **Bài học một lần** sau khi hướng dẫn chính hoàn tất (không hiện khi đang bỏ qua, mỗi lúc một chỉ dẫn): *Bị Động* khi một tướng
     cấp ≥ 10 — chọn đúng tướng và nút Bị Động, chỉ vào "Học" chỉ khi học được (1.800 vàng + 1 bí kíp), đã học thì tự xong;
     *Rèn Đồ* khi qua ải 20 — chỉ vào Rèn Đồ xem phôi Tốt (mở không có nghĩa là đủ tiền). Ghi một lần khi đóng hoặc làm xong. Bài học **chỉ hiện trên đúng màn của nó** (Kỹ Năng / Rèn Đồ), không
     bao giờ đè hành động của màn khác; bản lưu cũ hoàn tất im lặng thì bài học đã tới hạn cũng chốt luôn (người chơi lâu năm không bị dạy lại).
  7. Hình: Miu Dẫn Lối (NPC dẫn đường của Quảng Trường, dùng lại nguyên chân dung) + tấm giấy da lời thoại, găng chỉ, vòng sáng (Codex vẽ), chữ HTML một dòng; không làm tối màn,
     một đích mỗi lúc, bám theo cuộn/đổi cỡ, không che nút, tôn trọng giảm chuyển động. Khi người chơi lạc đường (đích là thanh điều
     hướng hay nút quay lại) chỉ còn vòng sáng + găng, không có tấm lời thoại đè màn đó; trong bảng xác nhận cũng vậy.
  8. **Trận ải 1**: quyền dẫn ghi trên trận đang chờ (gắn mã trận), kiểm lại lúc combat mở (ải 1, bước Thắng ải 1, không bỏ qua).
     Sau 1,5 giây rảnh ở lượt mình (bàn mở, không kéo, không bảng) găng trượt giữa hai ngọc của `legalMoves()[0]` (như nút gợi ý,
     không gọi nút đó) với "Đổi 2 ngọc cạnh nhau, xếp 3 cùng màu"; nhắc lại sau 6 giây tới khi ghép thành công; chạm là ẩn. Lần đầu
     đủ nộ thật (bắt đúng lúc xếp tuyệt kỹ) nói một lần "Đủ 100 nộ: tuyệt kỹ tự tung". Không chờ, không dừng, không gọi RNG, không
     đổi trạng thái trận.
  9. Kiểm thử: bỏ qua tự động chỉ khi tới lượt; chốt bền sau khi tiêu vé, tháo đồ, qua nửa đêm; bỏ qua → xem lại; làm theo hướng
     dẫn và tự làm cho cùng ví, nguyên liệu, mảnh, tiến độ; tải lại, thua/đánh lại, cờ trận cũ, mất vé trước xác nhận; câu nộ và bài
     học chỉ một lần; đường đi trên điện thoại qua bản đồ, thẻ ải, xác nhận triệu hồi, chọn đồ.
- **Lịch 28 ngày** (Claude đề xuất, Codex sửa 3 điểm, Claude nhận cả 3):
  1. Sự Kiện → "Lịch 28 ngày" thành lịch 4 hàng × 7 ngày của **mùa 28 ngày chung** (`passSeason`, neo 02/11/2026 00:00 GMT+7;
     ngày mùa, không phải ngày tạo tài khoản), ngày giờ theo đồng hồ đã chặn lùi của engine.
  2. **Chỉ hôm nay nhận được**, và là đúng phần thưởng "Ghé thăm thị trấn" (500 vàng, 10 sách, 80 Ấn theo trần, 1 vé): hai lối vào
     (lịch, Quán Bia) gọi cùng `claimDaily('login')`, giao dịch đó đóng dấu ngày trên lịch; giữ nguyên +1 nhiệm vụ tuần, +50 điểm sổ.
  3. Lưu `p.calendar={season,from,days:[]}`: ngày đã nhận và mốc bắt đầu ghi; ngày lỡ sau mốc là "lỡ", ngày trước mốc (chưa có dữ
     liệu, trước khi tạo tài khoản) để trung tính. Chỉ suy từ bằng chứng chắc (`daily.date` hôm nay đã nhận `login`). **Không nhận
     bù, không chuỗi, không quà ngày 7/14/21.**
  4. **Ngày 28** có hai phần độc lập: phần Ghé thăm của ngày đó và **rương 20 mảnh** có sẵn (tướng sở hữu, không Hiro, chưa 6★; không
     có thì phiếu không hết hạn; rương chưa nhận sang mùa thành phiếu như cũ). Không cần đăng nhập đủ ngày.
  5. Tổng 28 ngày như cũ: 14.000 vàng, 280 sách, 2.240 Ấn (theo trần), 28 vé + rương. Kiểm thử: hai lối vào cùng một dấu, nhận
     lần hai lỗi, qua mùa, vào giữa mùa, nửa đêm GMT+7, lùi đồng hồ, trần Ấn, nhiệm vụ tuần/sổ, rương và phiếu ngày 28 độc lập.
- Giao diện cả hai: mockup Codex trước, rồi vẽ mảnh, dựng, Codex chấm ≥ 8,5 trên điện thoại 390×844 và Studio 1920×911 (cả lớp dẫn
  trong trận và lịch).

### Vòng Mùa của tướng (04/11, Thẻ Tháng / Sổ Hành Trình / Quỹ theo tướng ra mắt) — Claude + Codex thống nhất, chủ dự án chốt, đã làm

Yêu cầu: "Thẻ tháng mở theo tướng được ra mắt… bán kèm danh hiệu, thẻ tên, popup chat, khung, avatar, sách kỹ năng, khung màn combat,
hiệu ứng trên battle, tướng làm phần thưởng cho các mốc quan trọng… Xem cả Sổ Hành Trình, Thẻ Tháng và Quỹ." Sau đó: "Miễn phí thì có
lấy được mảnh tướng, nhưng phải nhiều mùa mới ghép được; có sự kiện tuần để miễn phí trong 2 tuần chơi đủ nhiệm vụ sẽ ghép được tướng."

- **Chủ đề tướng đặt ở Sổ Hành Trình**, không ở Thẻ Tháng: mỗi mùa 28 ngày là "Hành Trình Của X", tối đa **một tướng mới mỗi mùa**.
  Ngày 1–14 banner ra mắt X, ngày 15–28 chạy lại một tướng cũ Y đủ điều kiện (luật D3 giữ nguyên: cách ≥42 ngày, cần ≥3 tướng hiếm).
- **Thẻ Tháng giữ nguyên** (109k, 300 + 100/ngày, cộng dồn 180 ngày; không thêm quà theo tướng: thời hạn 30 ngày lệch mùa 28 ngày).
  **Quỹ Trưởng Thành giữ nguyên** (299k một lần/tài khoản, 7.000 ngọc theo cấp tướng cao nhất; không chia theo tướng hay mùa).
- **Ba nhánh, giữ giá:** Thường / Vàng 149k / Diệu Ngọc 299k (gồm Vàng, nâng bù 150k). Mốc ★ 10·20·25·30·40·50:
  Thường cấp 10 avatar X; Vàng 10 khung avatar X, 20 danh hiệu mùa, 30 thẻ tên X, 40 bong bóng chat X, 50 10 vé;
  Diệu Ngọc 25 khung màn combat X + rương Sử Thi, 40 hiệu ứng vào trận X, 50 **80 mảnh X** + rương Huyền Thoại + 10 thần thạch.
  Sách kỹ năng rải ở cả ba nhánh (mốc 5/15/35/45). Bảng mốc là cấu hình thử, đo thu–chi trước khi gọi là cân bằng.
- **Tướng X:** Diệu Ngọc giao **một bản X ngay khi kích hoạt** (quà kích hoạt riêng, một lần mỗi mùa; nâng từ Vàng cũng nhận) + 80 mảnh
  ở cấp 50; thay gói 80 mảnh tự chọn cũ. Đã có X → 80 mảnh X; X đã 6★ → 80 Bụi Ký Ức. Giá trị trả tiền là có sớm, thêm bản sao, trang trí.
- **Miễn phí ghép X ngày 14 khi chơi đủ:** nhánh Thường 4 mảnh X ở cấp 5/10/15/20/25 (20 mảnh) + sự kiện tuần **"Đồng Hành Cùng X"**
  ngày 1–14, 30 mảnh/tuần (ngày: xong 3 nhiệm vụ ngày → 2 mảnh × 7; tuần: thắng 15 trận vượt ải → 8; thắng 8 trận Trùm Vô Tận → 8)
  = 60. Bù miễn phí đến hết ngày 28: mỗi suất ngày lỡ làm bù bằng 6 trận PvE thắng, tối đa 1 suất bù/ngày, tổng vẫn ≤14 suất.
  Không bán lượt bù. Riêng nhánh Thường (20/mùa) phải nhiều mùa mới đủ 80. Tuần 3–4: cùng cấu trúc, 60 mảnh Y.
- **Sửa luật cũ:** quà chỉ định X của mùa được mở tướng chưa sở hữu (rương ngày 28 và Cửa Hàng Ký Ức giữ điều kiện cũ; trần 30 mảnh/kỳ
  là của cửa hàng đổi mảnh, sự kiện nhiệm vụ là nguồn riêng). Mảnh mùa gắn cố định `seasonHero`, không theo banner đang chạy.
- **Bộ trang trí mùa đầu (7 món, không chỉ số, dùng được khi chưa có X):** avatar, khung avatar, danh hiệu, thẻ tên, bong bóng chat
  (Quảng Trường), khung màn combat (viền HUD, không che bàn ngọc/máu), hiệu ứng vào trận (một lần đầu trận, có tùy chọn giảm hiệu ứng).
  Cần thêm kho trang trí + thao tác Trang bị. Codex vẽ bộ nhận diện của X rồi xuất từng món (khuôn chung + biểu tượng, chất liệu,
  họa tiết riêng của tướng, không chỉ đổi màu). Làm sau: avatar động, hào quang, đổi hiệu ứng đánh, skin, giọng.
- **Màn Sổ:** tranh mùa 240–280 đơn vị (X lớn bên phải, tên mùa, ngày còn lại, "Diệu Ngọc · nhận X ngay"), thanh cấp gọn kèm quà quan
  trọng kế tiếp, đầu ba cột ghim, mốc ★ cao 1,5 lần hiện đúng hình món trang trí, nút nhảy 10·20·25·30·40·50, đáy ghim Nhận tất cả.
  Mockup duyệt phone + Studio ≥8/10 trước khi dựng.
- Đã sửa ngay: rương Diệu Ngọc chờ ải 60/80 không còn mất khi hết mùa, cất thành phiếu.
- **Chủ dự án chốt (04/11):** mùa đầu là **Mika**; tài khoản mới vẫn chỉ có Hiro; tướng chưa phát hành ẩn hết; làm bù đến ngày 28
  "ok"; bộ 7 món "đúng rồi làm đi". (Luật lên sao đổi riêng ở "Vòng Nâng Sao"; mùa chỉ giao bản/mảnh qua luật chung.)
- **Đã làm [Có · thanh toán Sắp ra mắt]:** luật trong `liveops.js` (SEASONS, HERO_PASS, COMPANION, COSMETICS) và `progression.js`
  (pass theo mùa, `companion`/`claimCompanion`, `cosmetics`/`wearCosmetic`/`looks`; danh hiệu và đồ trận đi theo trận qua `pending`).
  Màn: tab Sổ "Hành Trình Của Mika" (`season-ui.js`, tranh mùa, mốc ★ hiện đúng món, nút nhảy mốc, Bộ sưu tập + Trang bị), trang
  "Đồng Hành Cùng Mika" từ Sự Kiện (14 ô ngày, làm bù tự động, 2 chương nhiệm vụ, giai đoạn nguyên liệu 15–28), avatar/khung trên
  HUD, danh hiệu/thẻ tên/bong bóng của mình ở Quảng Trường (chỉ máy này, máy chủ xác nhận quyền sở hữu: Sắp ra mắt), góc khung
  trận và hiệu ứng vào trận trong combat (giảm chuyển động thì bỏ qua). Codex vẽ: bộ nhận diện + 7 món + tranh mùa + nền sự kiện +
  các mảnh giao diện (`assets/gemwoven/raw/season-mika/`, runtime `assets/gemwoven/season/mika/`). Mockup Sổ 8/10, sự kiện 8,5/10;
  bản dựng vòng 1 7,5/7,9 → vòng 2 **8,5 điện thoại / 8,6 Studio**. Test `check-depth` "mika season ok"; balance sim không đổi.
- **Mùa cho mọi tướng hiếm (chủ dự án 04/11: "Vẽ luôn cho các nhân vật khác đi. Sau vận hành thời gian đầu chỉ cần active dần các
  sự kiện") [Có · chờ kích hoạt]:** Yuki (Tuyết Thỏ), Nori (Lộc Thần), Lumi (Tinh Lôi), Noct (Ảnh Nguyệt) có bộ mùa sẵn sàng như Mika:
  7 món trang trí + tranh mùa, nền sự kiện, ô ngày, huy hiệu, dải ưu đãi (Codex vẽ, `assets/gemwoven/raw/season-<tên>/`, runtime
  `assets/gemwoven/season/<tên>/`; Codex chấm so với Mika: Yuki 8,7, Nori 8,6, Lumi 8,7, Noct 8,4 → 8,7 sau khi vẽ lại nền và hiệu ứng).
  `liveops.js` SEASON_KITS giữ tên, chủ đề, tên món; sổ, sự kiện "Đồng Hành Cùng X" và bộ trang trí sinh từ đó. **Kích hoạt = thêm
  `{index, hero}` vào SEASONS**, không cần code hay hình mới. Tướng chưa phát hành ẩn trong hub cho tới ngày đầu mùa của mình
  (`heroAvailable` theo lịch SEASONS). Hiro không có mùa (tướng miễn phí ban đầu). Test `check-depth` "season kits ok".

### Vòng Nâng Sao (04/11, "phải có bản sao cấp cao mới đủ nguyên liệu để nâng sao cao") — Claude + Codex thống nhất, đã làm

- **Bản dư có sao** (tướng triệu hồi, không phải Hiro): bản dư mới (triệu hồi, ghép 80 mảnh) là **1★**. **Luyện**: 2 bản s★ cùng
  tướng → 1 bản (s+1)★, phí lên 2★ 5.000 vàng/5 tinh hoa, 3★ 15.000/12, 4★ 50.000/30, 5★ 150.000/70. Chỉ cùng tướng (không dùng
  tướng khác cùng độ hiếm, tránh tướng dễ kiếm nuôi tướng đắt).
- **Lên sao tướng chính s→s+1 cần 1 bản s★** + phí cũ (10k/35k/100k/300k/1M vàng, 10/25/60/140/300 tinh hoa). Bản thô 1/2/4/8/16:
  **4★ (hình thái 2) = 7 bản dư, 175.000 vàng, 122 tinh hoa** (cũ 6 · 145.000 · 95); **6★ (hình thái 3) = 31 bản dư, 1.925.000 vàng,
  854 tinh hoa** (cũ 19 · 1.445.000 · 535). Phần tăng nằm ở cuối.
- **Bấm Tăng Sao tự luyện** từ bản thấp nếu đủ, một giao dịch, chỉ luyện tới bậc cần; nút đổi thành "Luyện & Tăng Sao", vàng/tinh hoa
  hiện tổng gồm phí luyện. Ô bản dư luôn ghi tồn thật (0/1 đỏ dù luyện được). Luyện thủ công trong bảng "Luyện bản dư".
- **Hiro giữ bảng cũ** (1/2/3/5/8 bản thường, 6★ = 19 bản ≈ 8 tháng): đường miễn phí không đổi, không phải buff (chỉ số, nguồn mảnh
  giữ nguyên). Áp nhị phân sẽ kéo 6★ Hiro lên ~13 tháng nên bác.
- **6★ đổi Bụi Ký Ức theo bản thô**: bản dư s★ = 80 × 2^(s−1) bụi; không hoàn phí luyện. Lưu cũ: bản dư hiện có thành bản 1★, giữ sao.
- **Mùa Mika giữ nguyên**: miễn phí ghép bản đầu ngày 14; Diệu Ngọc 299k = hai bản thô (đủ 1★→2★).
- **Thời gian ước tính** (Codex, ~63 lượt/bản, mảnh từ quay làm thực tế ~57): người chi tiền từ bản chính tới 4★ 378 → 441 lượt
  (~15,4 → 18,0 triệu), 6★ 1.197 → 1.953 lượt (~48,7 → 79,5 triệu). Miễn phí Mika (Mika thường trực, bụi chưa tiêu được) 4★ ~190 →
  222 ngày, 6★ ~601 → 981 ngày; không hứa Mika 6★ miễn phí trong vài tháng. Hiro 67/240 ngày không đổi. Mô phỏng trận
  (`balance-sim`) không đổi vì chỉ số mỗi sao giữ nguyên.
- **Giao diện Tăng Sao** (mockup `assets/gemwoven/raw/star-spares-mockup/`, Codex 8,2 → 8,3 mockup, bản dựng 8,2/8,4 → **8,6/8,7**
  điện thoại/Studio): dải 5 dấu da "1★ ×4 … 5★ ×0" thay dải cấp, dấu bậc cần viền vàng, mũi tên đồng chỉ nối các bậc đem luyện; ô
  chân dung có ấn "3★" và búa rèn (sáng khi luyện được), chạm mở bảng Luyện bản dư (hai bản → một bản, phí bằng hình + số xanh/đỏ,
  nút Luyện, "Thiếu n bản 1★").
- **Chủ dự án đã duyệt (04/11)**: (1) 6★ tướng triệu hồi = 31 bản dư; sau này bù bằng sự kiện ngày đặc biệt (§11); (2) Hiro giữ
  bảng cũ 19 bản; (3) sao đã lên theo luật cũ giữ nguyên, không truy thu.

### Vòng Nghi thức biến hình (04/11, "triệu hồi có nên ra hình thái cao? mở hình thái có hiệu ứng như triệu hồi?") — Claude + Codex thống nhất, đã làm

- **Triệu hồi luôn ra 1★ hình thái 1.** Chủ dự án duyệt (04/11) đây là **thay đổi duy nhất** trên màn Triệu Hồi đã khóa (nền,
  pha lê, hoạt cảnh giữ nguyên): **bệ trưng bày "Hình thái 3 · Mở tại 6★"** cạnh vòm [732,430,194,300], khung gỗ-đồng Codex vẽ
  (`assets/gemwoven/summon-ui/form-preview-frame.webp`), tranh showcase hình thái 3 đã khóa qua fitBody, tối chỉ trong lòng khung;
  không sao, khóa, ánh sáng hay liên kết với nút quay; chạm mở thư viện Hình thái. Codex mockup 8,0 → 8,4 (chỉ còn kích thước,
  sửa khi dựng), bản dựng **8,7 / 8,5** (điện thoại/Studio); `assets/gemwoven/raw/summon-form3/`.
- **Nghi thức** (`src/gemwoven/form-ceremony.js`, mockup `assets/gemwoven/raw/form-ceremony/`): chạy toàn màn khi tướng chính
  3→4★ (hình thái 2, 4,8 giây) hoặc 5→6★ (hình thái 3, 6 giây), dựng riêng, màn Triệu Hồi không đổi. Nhịp: hình thái cũ trên
  vòng phép (Codex vẽ `assets/gemwoven/ceremony/rune-circle.webp`) → vòng gom sáng, chỉ sao mới bật → sáng ấm che thân, chuyển
  sang showcase đã khóa của hình thái mới (fitBody, giữ cỡ thân theo đầu, không kéo méo) → sáng rút, lộ toàn thân, tia sáng sau
  lưng, tên hình thái (6★ thêm hào quang sau lưng) → bảng kết quả: sao, tên hình thái, tuyệt kỹ mới, hệ số, đặc tính 6★, "Tiếp tục".
- **Âm:** đúng các bản ghi CC0 của triệu hồi, mỗi nhịp một bản (bell, rise, bell cho sao mới, sting của tướng, gold / strike 6★,
  touch), theo âm lượng hiệu ứng và nút tắt âm của hub.
- **Bỏ qua** hiện ngay, hủy mọi nhịp, âm và vòng lặp, mở thẳng bảng kết quả; Esc cũng vậy. **Giảm chuyển động:** ảnh tĩnh,
  cross-fade 0,6 giây rồi bảng. Ánh sáng vàng ấm, không chớp trắng, lớp tối tối đa 85%; ẩn tướng, sao, bảo bối và tên hình thái
  của màn nền để không thấy hai tướng.
- **Giao dịch lưu trước khi chạy cảnh** (tải lại không trừ lần nữa, không chạy lại cảnh). **Diện mạo đã chọn giữ nguyên**
  (trước đây lên sao tự khoác hình mới). Bảng Hình thái có "Xem lại nghi thức" cho hình thái đã mở, không cấp gì. Không gọi là
  kỹ năng Biến Thân trong trận. Luyện bản dư bằng tay chỉ có nhịp ghép 0,5 giây trên thẻ mới.
- Codex: mockup 8,6; bản dựng 8,1/8,4 → **8,6/8,8** (điện thoại/Studio).

### Vòng Bàn ngọc (05/11, nộ, đóng băng, combo, Biến Thân riêng) — Claude + Codex thống nhất, chờ chủ dự án chốt

Yêu cầu: "Ghép băng có đóng băng luôn không, ghép tím tăng nộ, các mảnh khác có tăng nộ không, combo có tăng nộ không? Cân bằng
board trước, rồi phát triển tính năng tướng vào những thứ người chơi làm được trên board." Hai vòng (`assets/gemwoven/raw/board-design/`).

**Luật hiện tại (đã kiểm chứng trong code):** nộ người chơi Kiếm/Tim/Tím/Băng/Khiên = 7/2/5/2/2 (Lumi ×2 mọi màu) → Kiếm vừa
sát thương vừa nhiều nộ nhất, tím không có vai trò; quái 3 nộ/ngọc +25 ở viên tím đầu. Thu 3 Băng trong một lần giải board (cả
cascade, special) → quái mất lượt, **không có miễn**, kể cả boss. Combo chỉ nhân sát thương Kiếm +15%/sóng có Kiếm (tối đa +90%,
sóng thứ 3/6/9 chí mạng), **không cộng nộ**. Băng quái hút 20 nộ. Hai Lõi xóa toàn board nhiều lần. Tài liệu ghi boss 80 nộ, game dùng 100.

**Đề xuất chốt:**

| Mục | Luật |
|---|---|
| Nộ người chơi | Kiếm/Tim/Tím/Băng/Khiên = **3/2/7/2/2** (đo 10.000 lượt: nhịp tuyệt kỹ gần như cũ, bot chọn tím nhanh hơn 12%, tím ≈ 59% nộ từ ngọc) |
| Combo nộ | Tổng sóng 1/2/3/4/≥5 → **+0/3/6/10/15**, nhận một mức; combo sát thương giữ như cũ |
| Băng | Thường/tinh anh: 3 Băng trong một lần giải board → đóng băng ngay; boss: thanh 0/6 tích xuyên lượt |
| Chống khóa | Sau khống chế phải hành động đủ 1 (thường) / 2 (boss) lượt; choáng + đóng băng chung giới hạn; không tích Băng khi đang miễn |
| Băng quái | Bỏ hút 20 nộ mặc định (thành kỹ năng riêng của quái nào cần) |
| Tuyệt kỹ | Thanh 199, tốn 100, tối đa 1 tuyệt kỹ trong lượt của mình, nộ dư giữ; không trần nộ/lượt |
| Special | Giữ nguyên trong PvE (hình, vùng nổ, art); sửa: hai Lõi nổ đúng 1 lần, mỗi viên thưởng 1 lần; quái tạo special + quyền hưởng đối xứng chỉ trong PvP |
| Biến Thân | Giữ miễn choáng/đóng băng + giảm 15% sát thương; thay +Công chung bằng hiệu ứng riêng (Hiro: Kiếm đầu lượt +10%, không mạnh hơn; Mika: Kiếm đặt thiêu đốt; Yuki: 2 Băng đủ đóng băng thường, 4 với boss; Nori: Tim/Khiên ×1,5, hồi dư thành giáp; Lumi: tím 16 nộ/viên; Noct: cascade cho chí mạng, né một đòn); bỏ dư âm +Công vĩnh viễn |

Thứ tự: đo baseline → gom luật thưởng board thành một bảng dữ liệu chung (combat, AI, mô phỏng) → Băng/miễn/1 tuyệt kỹ/combo nộ/hai
Lõi → bảng nộ mới → đo 6 tướng (bot trận thật, 1/4/6★) → Biến Thân riêng → Bị Động/Biến Dị theo hướng board (bảng D vòng 1).
Hệ số từng tướng chỉ chốt sau khi đo; không buff Hiro.

### Vòng Ngọc đặc biệt (05/11, làm thử theo hướng Codex + bộ hiệu ứng mới) — Claude + Codex, đang thử

Chủ dự án: "Ngọc đặc biệt: làm thử theo hướng Codex (ghép 4 xóa một hàng, ghép 5 ra Lõi, chữ L/T ra Bom). Cùng Codex xây dựng bộ
hiệu ứng đẹp hơn, lung linh hơn, cơ chế item đặc biệt xịn hơn." Luật dùng chung một nơi: `src/board-specials.js` (bàn thật, AI, mô
phỏng); hiệu ứng `src/special-fx.js` + `src/special-fx.css`; spec, hai tấm vẽ và các vòng chấm ở `assets/gemwoven/raw/board-specials/`.

| Tạo | Kích hoạt |
|---|---|
| **Ghép 4 thẳng → Sao băng** (hướng theo trục ghép, có mũi tên vẽ trên ngọc) | Quét **dải 3 làn** hàng (hoặc cột) của nó, làn giữa sáng nhất |
| **Ghép chữ L/T → Bom** | Nổ **5×5** |
| **Ghép 5 thẳng, hoặc cụm giao từ 6 ngọc → Lõi** | Đổi với một ngọc: xóa cả màu đó; bấm riêng: màu nhiều nhất trên bàn |
| Đổi **hai ngọc đặc biệt** cho nhau (luôn hợp lệ) | Sao+Sao 3 hàng + 3 cột · Sao+Bom 5 + 5 · Bom+Bom 7×7 · Lõi+Sao/Bom: cả màu đó thành Sao/Bom rồi nổ cùng lúc · Lõi+Lõi xóa cả bàn **đúng 1 lần** |

- Ưu tiên trong một cụm: Lõi > Bom > Sao, một special/cụm; đặt ở viên vừa kéo (hoặc viên đổi chỗ kia), cascade thì gần tâm cụm.
- Special bị nổ trúng kích dây chuyền **1 lần/ngọc**, theo **thế hệ** (cùng thế hệ nổ cùng lúc, cách 50 ms); mỗi ngọc thưởng 1 lần.
- PvE: chỉ người chơi tạo special; ngọc do special xóa trong lượt quái vẫn tính cho người chơi (như cũ). PvP: hai bên cùng luật, ai đi
  người đó hưởng.
- **Cân bằng** (`qa/gemwoven/special-sim.cjs`, 20.000 lượt, chỉ khác luật special): bản đầu (Sao 1 hàng, Bom 3×3) làm nộ/sát thương
  mỗi lượt −42%, trận dài +66% → bù trong luật special: Sao dải 3 làn, Bom 5×5, cụm 6+ ra Lõi. Kết quả so với special cũ: bảng nộ
  cũ −9,3% nộ / −9,6% sát thương / +9% lượt hạ quái; bảng 3/2/7/2/2 −8,9% / −9,2% / +9,3%. Sát biên ±10%: theo dõi khi chơi thật.
- **Hiệu ứng:** Codex vẽ 2 tấm (10 mảnh sáng: tia sao, đầu sao chổi, vành nổ, vành cầu vồng, hoa sáng, dấu mục tiêu, mũi tên hướng,
  sao lấp lánh, mảnh ngọc, quầng), mỗi mảnh chuyển động nguyên khối + vài hạt; một nova/lần xóa; ngọc bị special xóa phồng sáng chính
  art của nó rồi tan thành hạt màu; combo kéo hai ngọc vào nhau trước khi nổ; giảm chuyển động chỉ giữ kết quả. Codex chấm: v1 6/10 →
  v2 8/10 (điện thoại 8,1, ngang 7,9, Studio 8,0) → sửa thêm 3 điểm cuối (tan sạch không vòng xám, giữ màu ngọc, làn bên dịu hơn).
