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
| **Sao** 1–6★ | HP +12%, Công +9% mỗi sao; **mở Hình thái** | Bản sao (80 mảnh = 1), vàng, tinh hoa | Bản sao | [Có] |
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
                  ├──► Tiến hóa 1..6 ──► Bị động (cấp 10) · Biến Dị (cấp 100 + TH2) · Chân Thân (cấp 400 + TH5)
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
  của từng hình thái; trộn dáng cũ với kỹ năng mới sẽ sai hình. Lên sao mở hình thái mới thì tự khoác hình mới.
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
| **Chân Thân** | Hiện: +Công/HP cả trận. Đề xuất: **Biến Thân** | Cấp 400 + TH5 | xem 2.4 |

### 2.1 Hiển thị
Bảng **Lộ trình phát triển** [Đêm nay] cho thấy từng nhánh: đã mở chưa, cần cấp/tiến hóa nào, nút "Đi tới".

### 2.2 Tướng chưa sở hữu [Đêm nay]
Vẫn hiện trong danh sách (đó là mồi sưu tầm), làm **xám + biểu tượng khóa**. Bấm vào xem được kỹ năng, hình
thái, số mảnh và cách có tướng.

### 2.4 Biến Thân (đề xuất cho nhánh Chân Thân)
- Một lần mỗi trận: thanh năng lượng có vạch **Biến Thân**; kích hoạt khi HP ≤ 50% hoặc sau tuyệt kỹ thứ hai.
- 3 lượt: hào quang hình thái cao nhất bật lên (art đã có), Công +25..40% theo cấp kỹ năng, giảm 15% sát
  thương nhận vào, miễn choáng; hết 3 lượt giữ một nửa thưởng Công đến cuối trận.
- **Cổng mới khi làm Biến Thân: cấp 180 + TH3** (Codex: cấp 400 cần tối thiểu 190 ngày theo trần Ấn —
  khoảnh khắc hay nhất không được đến muộn vậy). Cấp 400 + TH5 nâng hiệu quả Biến Thân.
- Tắt trong hàng PvP Chuẩn Hóa. Cần làm phía combat, ước 1–2 ngày công.

---

## 3. Trang bị, vũ khí bản mệnh, ngọc khảm

- **Trang bị [Có]:** 6 ô, 6 phẩm (hệ số 1/1,6/2,5/4/7/11), +20 luôn thành công, chuyển chủ tự tháo.
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
| Trang bị Huyền thoại/Thần | | ✔ (giới hạn tuần) | ✔ | | | |
| **Tướng hiếm** | | | ✔ banner | | | bán trực tiếp |
| Mảnh tướng banner | | | ✔ | ✔ đổi ≤ 30/kỳ | | |
| Mảnh tướng cũ | | | | Cửa hàng Ký Ức | ✔ (giới hạn tuần) | |
| Mảnh Hiro | | | | ✔ | ✔ | bán bằng tiền |
| Vũ khí bản mệnh | | | ✔ banner vũ khí | mảnh | | |
| Báu vật | | | | PvE + tích nạp | | triệu hồi |
| Ngọc khảm | ✔ cấp 1 | ✔ cấp 2 | | ✔ | ✔ | cấp 4–5 trực tiếp |
| Trang phục, khung, danh hiệu | | ✔ một số | | ✔ | ✔ | — (không chỉ số) |
| **Đá Ngọc** | | | | | | thưởng gameplay; bán bằng vàng |
| **Vé triệu hồi** | | | | ✔ | ✔ | bán bằng vàng |

---

## 9. Triệu hồi và chu kỳ banner

- [Đêm nay] **Tỷ lệ tướng banner 1%, bảo đảm ở lượt 100** (trước: 0,15% và 300 lượt). Codex: 300 lượt =
  36.000 Đá Ngọc ≈ 12 triệu đồng mới chắc ra một tướng — quá đắt để xây đội. Bây giờ ≈ 4 triệu tối đa, trung
  bình ~63 lượt. Tiến độ bảo đảm **giữ nguyên khi đổi banner**. Không cần thêm "điểm đổi".
- Ngân sách vé miễn phí mục tiêu ≈ **40 vé/28 ngày** (đang có ~1/ngày + mốc cấp; thiếu phần nhiệm vụ tuần).
- Banner tướng 2 tuần; banner vũ khí bản mệnh song song; banner thường trực khi có ≥ 3 tướng hiếm.
- Chạy lại một tướng sau ít nhất 3 kỳ (6 tuần); giữa các lần có **Cửa hàng Ký Ức** (Bụi Ký Ức từ bản trùng
  sau 6★ và đấu trường).
- 6★ cần 20 bản (1 chính + 19) ≈ 1.260 lượt trung bình — mục tiêu chi tiêu cao, đúng định hướng
  "kiếm tiền từ tướng có hình thái".

---

## 10. Kiếm tiền (máy chủ thanh toán, hiện **Sắp ra mắt**)

| Sản phẩm | Giá gợi ý | Nhận |
|---|---|---|
| Gói Đá Ngọc | 22k–2,2tr | 60–6.480; lần đầu mỗi mốc ×2 |
| **Thẻ Tháng** | 109k / 30 ngày | 300 ngay + 100/ngày (quên đăng nhập thì vào Hòm Thư, không mất), +2 giờ offline, +1 lượt boss có thưởng, quét ải 3★; cộng dồn tối đa 180 ngày |
| **Sổ Hành Trình · Vàng** | 149k / mùa 28 ngày | nhánh Vàng 50 cấp; **mua giữa mùa nhận ngay mọi phần thưởng đã đạt**; không có Đá Ngọc trong sổ; 7 ngày cuối mua tối đa 10 cấp |
| **Sổ Hành Trình · Diệu Ngọc** (chủ dự án 03/11) | 299k / mùa (đã có Vàng: bù 150k) | gồm Vàng + nhánh Diệu Ngọc: 80 mảnh tướng tự chọn (tướng đã sở hữu, **trừ Hiro**; tài khoản chỉ có Hiro nhận phiếu chọn không hết hạn), rương Sử Thi (cấp 25, nhận khi qua ải 60) và Huyền Thoại (cấp 50, qua ải 80) tự chọn ô, 20 thần thạch, khung + danh hiệu mùa; +10 cấp khi mua **tính vào** giới hạn 10 cấp mua; không Đá Ngọc; tắt ở Chuẩn Hóa |
| **Quỹ Trưởng Thành** (speed pass) | 299k một lần | 7.000 Ngọc trả theo mốc cấp tướng cao nhất 10..300 |
| Gói ưu đãi | 49k–499k | đúng nút người chơi đang kẹt; tối đa 1 lần/7 ngày mỗi gói; không popup ép |
| Trang phục hình thái | 199k | skin, không chỉ số |

### 10.1 VIP (theo tổng nạp xác thực)
12 bậc 100k → 100tr (bảng đầy đủ trong `liveops.js`, hiển thị ở trang VIP [Đêm nay]).
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
- **Vòng lấy mảnh tướng cũ:** chạy lại banner (≥ 6 tuần), Cửa hàng Ký Ức (tuần), rương chọn mảnh ở lịch 28 ngày.
- **Giảm nghĩa vụ đăng nhập** (Codex): nhận bù ngày lỡ ở Tân Thủ; thẻ tháng tự gửi thư; Sân Thử Luyện chỉ 2 lượt
  có thưởng.
- **Mẫu sự kiện cho Studio** (mở rộng `docs/event.schema.json` khi có máy chủ): Đăng nhập N ngày, Tích nạp, Tiêu
  Ngọc, Đổi vật phẩm, Boss sự kiện, Đua top (điểm do máy chủ tính), Nhiệm vụ mốc. Không có vòng quay bán bằng tiền.
- [Đêm nay] Trang **Sự Kiện** chạy thật **Hành Trình Tân Thủ 7 ngày** và hiển thị lịch dự kiến ở trên.

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
- **Mèo Hướng Dẫn** (NPC) — giải thích Quảng Trường; NPC luôn có nhãn NPC.
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
  **Bà Dệt Đèn** cạnh sảnh (máy chủ kiểm tra đứng đúng chỗ), tối đa 5 sợi/người/tuần. Đèn bang sáng bậc 1/2/3 ở 5/15/25
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
- Bản đồ, Mèo Hướng Dẫn, Bà Dệt Đèn, đèn bang 4 bậc: Codex vẽ (`gpt-6.1-sol` low), `assets/gemwoven/plaza/`.
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
