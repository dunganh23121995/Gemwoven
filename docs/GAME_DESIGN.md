# Gemwoven · Thiết kế chiều sâu hệ thống

Bản nháp 1 · 03/11/2026 · Claude soạn, Codex phản biện (mục 20).
Phạm vi: toàn bộ vòng phát triển tướng, sát thương, kinh tế, kiếm tiền, sự kiện, đấu trường,
xã hội, tải tài nguyên và đường chuyển sang Godot + máy chủ riêng.
Nguồn số liệu chạy được: `src/gemwoven/progression.js` (luật dùng chung hub + combat) và
`src/gemwoven/liveops.js` (cấu hình VIP, thẻ tháng, sổ hành trình, sự kiện, đấu trường, báu vật,
danh hiệu). Tài liệu này giải thích *vì sao*; khi số trong đây khác số trong code thì code đúng.

Ký hiệu trạng thái: **[Đã có]** chạy trong bản hiện tại · **[Làm đêm nay]** đã thêm ở đợt này ·
**[Đề xuất]** chờ duyệt · **[Máy chủ]** chỉ làm khi có server.

---

## 0. Nguyên tắc nền

1. **Mỗi trục phát triển có đúng một việc.** Người chơi luôn trả lời được câu "nâng cái này để làm gì".
2. **Hai đường độc lập, gặp nhau ở cổng.** Cấp (cày) và Sao (bản sao, trả phí hoặc cày lâu) chạy song song;
   Tiến hóa là cổng nối cả hai; Kỹ năng và Hình thái mở theo cổng đó.
3. **Tướng miễn phí phải có đường lên đỉnh**, chậm hơn nhiều nhưng không bị chặn cứng.
4. **Tiền mua tốc độ, sự tiện lợi, sưu tập và sức mạnh PvE**; PvP có một hàng đợi chuẩn hóa
   nơi tiền không quyết định.
5. **Máy chủ quyết định mọi thứ có giá trị**: số dư, phần thưởng, RNG, bàn ngọc, kết quả trận, thứ hạng.
   Client chỉ hiển thị và gửi ý định.
6. **Đá Ngọc chỉ đến từ nạp tiền đã xác thực** (kể cả thẻ tháng, quỹ trưởng thành giao Đá Ngọc theo
   ngày: đó là giao hàng của một giao dịch, sổ cái máy chủ ghi). Không bao giờ từ ải, nhiệm vụ, offline,
   triệu hồi, sự kiện, đấu trường hay hộp thư.
7. Tính năng chưa phát hành ghi rõ **Sắp ra mắt**. Không giả người chơi, không giả BXH.

---

## 1. Bản đồ phát triển tướng (trả lời "cái nào có tác dụng gì")

| Trục | Việc duy nhất của nó | Tài nguyên | Cổng | Trạng thái |
|---|---|---|---|---|
| **Cấp** 1–500 | Chỉ số thô HP/Công tăng đều | Vàng, Sách EXP, Ấn tu luyện (trần 1.600/ngày) | Không bị khóa bởi sao | [Đã có] |
| **Sao** 1–6★ | Nhân chỉ số nền (+12% HP, +9% Công/sao) **và mở Hình thái** | Bản sao cùng tướng (80 mảnh = 1 bản), vàng, tinh hoa | Bản sao | [Đã có] |
| **Hình thái** 1–3 | Diện mạo + bộ tuyệt kỹ (×1 / ×1,1 / ×1,25 + đặc tính 6★) | Mở bằng sao: 4★ → H2, 6★ → H3 | Sao | [Đã có], chọn hình thái [Làm đêm nay] |
| **Tiến hóa** 0–6 | Mở nhánh kỹ năng, năng lượng đầu trận, mảnh giáp hiển thị, +10% HP/+7% Công mỗi bậc | Vàng, tinh hoa, quặng | **Cấp + Sao** (bậc 2 cần cấp 100 + 2★, bậc 5 cần cấp 400 + 5★) | [Đã có] |
| **Kỹ năng** 4 nhánh × 10 | Đổi *cách* thắng: tuyệt kỹ, thiên phú, hiệu ứng sau tuyệt kỹ, biến thân | Vàng, bí kíp, tinh hoa (2 nhánh cao) | Cấp + Tiến hóa | [Đã có] |
| **Trang bị** 6 ô | Chỉ số phụ, hiệu ứng đồ Thần; dùng chung giữa tướng | Rèn, triệu hồi, cửa hàng | Ải (rèn) | [Đã có] |
| **Bảo bối riêng** | +% HP/Công của riêng tướng đó, 5 dạng | Vàng, tinh hoa, quặng, thần thạch | Cấp tướng 50/100/150/200 | [Đã có] |
| **Ngọc khảm** | Chỉ số hiếm: bạo kích, kháng hiệu ứng, % hệ | Ngọc từ boss vô hạn, sự kiện, cửa hàng | Trang bị Sử thi+ có lỗ | [Đề xuất] |
| **Báu vật** | % chỉ số lớn + một hiệu ứng riêng (mượn nội tại) | Sự kiện nạp, đua top, Thư Hùng | Mỗi tướng 2 ô | [Đề xuất] |
| **Danh hiệu & Sưu tập** | Thưởng nhỏ toàn tài khoản cho việc sưu tầm | Thành tích, mùa giải, sự kiện | — | [Đề xuất] |

### 1.1 Chuỗi ràng buộc (đọc từ trái sang phải)

```
Cấp ──────────────┐
                  ├──► Tiến hóa 1..6 ──► mở Bị động (cấp 10) · Biến Dị (TH2) · Chân Thân (TH5)
Sao (bản sao) ────┤                     · năng lượng đầu trận (TH3: 20, TH6: 40)
                  └──► Hình thái: 4★ → H2 · 6★ → H3 (đổi dáng + tuyệt kỹ mạnh hơn)
Trang bị / Bảo bối / Ngọc / Báu vật ──► chỉ số; KHÔNG đổi hình thái, KHÔNG mở kỹ năng
```

**Các câu hỏi cụ thể:**

- *Khi nào nhân vật biến hình?* Khi đạt 4★ (hình thái 2) và 6★ (hình thái 3). Hình thái là của **sao**,
  không phải của tiến hóa hay trang bị. Tiến hóa chỉ gắn mảnh giáp linh lực lên hình hiện có.
- *Form 2 mang vũ khí Thần thoại được không?* **Được.** Trang bị là "linh khí" cộng chỉ số, không thay
  vũ khí đã vẽ của hình thái. Mọi hình thái mặc được mọi trang bị.
- *Form 3 không có vũ khí thì biến thân được không?* **Được.** Hình thái 3 thuộc về 6★. Thiếu vũ khí
  chỉ thiếu chỉ số Công, không mất hình thái hay tuyệt kỹ.
- *Ngoại lệ có chủ đích (đề xuất):* **Vũ khí bản mệnh** (mục 3.3) là vật phẩm riêng của từng tướng;
  khi tướng đó mang nó, tuyệt kỹ được thêm một hiệu ứng. Không mang thì vẫn đủ mọi thứ khác.
- *Nâng sao lên rồi còn dùng được hình thái cũ?* **Được, miễn phí** [Làm đêm nay]. Hình thái đã mở
  nằm trong bộ sưu tập; người chơi chọn hình thái dùng (diện mạo + tuyệt kỹ của hình thái đó).
  Mặc định là hình thái cao nhất. Chọn hình thái thấp hơn thì tuyệt kỹ yếu theo đúng hình thái đó,
  trang hiển thị nói rõ trước khi chọn. Không phải mua lại hình thái cũ.
- *Có chế độ biến hình trong trận không?* Đề xuất cho nhánh **Chân Thân** (mục 2.4).

### 1.2 Hiro và người chơi miễn phí [Làm đêm nay]

Lỗi thiết kế cũ: Hiro không có trong vòng triệu hồi và không có nguồn mảnh, nên **kẹt ở 1★**, không
qua được tiến hóa 2 (cần 2★), không bao giờ mở Biến Dị hay Chân Thân.

Sửa: **Mảnh Hiro** có nguồn từ gameplay, không bán bằng tiền:
- Rương sao chương: mốc 100 sao +10 mảnh, mốc 150 sao +20 mảnh (30 chương → tối đa 900 mảnh).
- Boss Vô Hạn: lần đầu hạ mỗi tầng chia hết cho 10 → +10 mảnh.
- (Đề xuất) Cửa hàng Thử Luyện và Cửa hàng Đấu Trường bán thêm một ít mỗi tuần.
- 80 mảnh = 1 bản sao như mọi tướng. 6★ cần 19 bản sao = 1.520 mảnh: mục tiêu khoảng 8–12 tháng chơi đều.

(Đề xuất, cần vẽ) Hiro có hình thái riêng theo **tiến hóa** thay vì sao (TH3 → "Lữ Khách Kiếm Sĩ",
TH6 → "Anh Hùng Diệu Ngọc"), để người chơi miễn phí cũng có khoảnh khắc biến hình.

---

## 2. Kỹ năng: giữ bốn nhánh, mỗi nhánh một vai

Câu hỏi "có cần chia Chủ động / Bị động / Biến dị / Chân thân không?" → **Có**, vì bốn nhánh mở ở bốn
thời điểm khác nhau của hành trình, tạo bốn mục tiêu ngắn–dài. Nhưng mỗi nhánh phải đổi *cách chơi*,
không chỉ cộng số.

| Nhánh | Vai trò | Mở | Ví dụ |
|---|---|---|---|
| **Chủ động** (Tuyệt kỹ) | Chiêu khi đầy năng lượng; tên, hình và số đòn theo **hình thái** | Ngay | Ngũ Ảnh Trảm → Hắc Liêm Đoạt Hồn |
| **Bị động** (Thiên phú) | Luôn bật, định hình cách xếp ngọc | Cấp 10 | Lumi: năng lượng ×2; Yuki: giảm 20% sát thương |
| **Biến Dị** | Hiệu ứng nguyên tố đi kèm sau mỗi tuyệt kỹ | Cấp 100 + TH2 | Mika: thiêu đốt; Lumi: hút năng lượng địch |
| **Chân Thân** | Một lần mỗi trận: **Biến thân** | Cấp 400 + TH5 | xem 2.4 |

### 2.1 Cây kỹ năng hiển thị
Bốn nút lọc Chủ Động/Bị Động/Biến Dị/Chân Thân giữ nguyên. Nút chưa mở hiện **điều kiện mở** (cấp,
tiến hóa) và một nút "Đi tới Tiến hóa" để người chơi thấy mối nối.

### 2.2 Tướng chưa sở hữu
Vẫn hiện trong danh sách, làm **xám + khóa**, nhãn nguồn: "Kỳ triệu hồi hiện tại", "Ghép 80 mảnh",
"Sắp ra mắt". Bấm vào xem được kỹ năng, hình thái và cách có tướng (không ẩn, vì đó là mồi sưu tầm).
[Làm đêm nay]

### 2.3 Chân Thân hiện tại [Đã có]
Cộng Công +12..21% và HP +10..14,5% cả trận. Ổn định, nhưng không tạo khoảnh khắc.

### 2.4 Đề xuất: Chân Thân thành **Biến Thân trong trận**
- Khi đã học Chân Thân, thanh năng lượng có thêm vạch **Biến Thân** (một lần mỗi trận).
- Kích hoạt: chạm biểu tượng khi HP ≤ 50% *hoặc* sau tuyệt kỹ thứ hai.
- Hiệu ứng 3 lượt: hào quang hình thái cao nhất bật lên (đã có art), Công +25..40% theo cấp kỹ năng,
  giảm sát thương nhận vào 15%, miễn choáng. Hết 3 lượt giữ lại một nửa thưởng Công đến cuối trận.
- Trong PvP chuẩn hóa: tắt (như mọi nhánh cao).
- Cần làm phía combat: cờ trạng thái, nút, hiệu ứng, cân bằng. Ước tính 1–2 ngày công.

---

## 3. Trang bị, ngọc khảm, vũ khí bản mệnh

### 3.1 Trang bị [Đã có]
Sáu ô (vũ khí, áo, mũ, quần, kính, giày), sáu phẩm (Thường → Thần, hệ số 1/1,6/2,5/4/7/11), cường hóa
+20 luôn thành công. Một món chỉ thuộc một tướng một lúc. Đồ Thần có một thuộc tính đặc biệt.

### 3.2 Bộ và cộng hưởng hệ [Đề xuất]
- Mỗi món Sử thi trở lên có **hệ** (Hỏa/Băng/Mộc/Lôi/Ảnh). Mặc 2/4/6 món cùng hệ của tướng: +5/+12/+20% Công.
- Không khóa: đồ khác hệ vẫn mặc được, chỉ không có thưởng bộ. Tạo lý do giữ nhiều bộ cho nhiều tướng.

### 3.3 Vũ khí bản mệnh [Đề xuất · nguồn thu]
- Mỗi tướng hiếm một vũ khí riêng (ví dụ Mika: Hồ Diễm Thần Kiếm). Chỉ số như vũ khí Huyền thoại.
- Khi đúng chủ mang: tuyệt kỹ +1 hiệu ứng (Mika thiêu đốt lan; Noct +1 nhát; Yuki thêm 1 lượt choáng...).
- Nguồn: banner vũ khí đi kèm banner tướng (2 tuần), mảnh từ sự kiện. Có bảo đảm riêng.
- Tinh luyện 1–5 bằng bản trùng: tăng hiệu ứng. Không đổi hình vẽ vũ khí của hình thái.

### 3.4 Ngọc khảm "Dệt Ngọc" [Đề xuất · hợp tên game]
- Đồ Hiếm: 1 lỗ, Sử thi: 2, Huyền thoại: 3, Thần: 4.
- Ngọc 5 cấp, ghép 3 thành 1 cấp cao hơn. Loại: Hồng ngọc (Công%), Lục bảo (HP%), Lam ngọc (Thủ),
  Hoàng ngọc (bạo kích), Tử ngọc (kháng hiệu ứng / chính xác hiệu ứng).
- Nguồn: Boss Vô Hạn (chính), sự kiện, cửa hàng Thử Luyện. Ngọc cấp 4–5 chỉ từ ghép.
- Tháo ngọc miễn phí (không phạt) để người chơi thử build thoải mái.

---

## 4. Báu vật (mục mới) [Đề xuất · nguồn thu chính cho người chi tiêu cao]

Báu vật là **vật riêng của tài khoản**, gắn vào tướng (2 ô/tướng, ô 2 mở ở TH3). Không phải trang bị.

| Phẩm | Màu | Chỉ số % | Hiệu ứng riêng | Nguồn |
|---|---|---|---|---|
| Lam | xanh | +4% một chỉ số | không | Cửa hàng sự kiện |
| Tím | tím | +8% hai chỉ số | yếu | Đua top sự kiện, tích nạp nhỏ |
| Cam | cam | +12% hai chỉ số | vừa | Tích nạp sự kiện, top 100 mùa |
| Đỏ | đỏ | +16% ba chỉ số | mạnh | Tích nạp mốc cao, top 10 Thư Hùng |
| Thần | cầu vồng | +20% ba chỉ số | mạnh + nâng sao báu vật | Vô địch Thư Hùng, sự kiện kỷ niệm |

**Ba họ hiệu ứng** (mỗi báu vật thuộc một họ, có giới hạn để không phá game):
1. **Phá Sơn** (đánh boss theo % máu): tuyệt kỹ gây thêm X% HP tối đa của mục tiêu,
   **tối đa 8× Công** của tướng và chỉ trong PvE. Rất mạnh với boss vô hạn, vô dụng với quái nhỏ.
2. **Mượn hồn** (mang một phần nội tại của tướng khác): ví dụ "Chuông Tuyết Nguyệt Vỡ" cho tướng
   bất kỳ 30% hiệu lực giảm sát thương của Yuki. Chỉ mượn **bị động**, không mượn tuyệt kỹ, tối đa 50% hiệu lực.
3. **Khắc chế** (nhắm PvP hoặc boss): giảm năng lượng địch khi tuyệt kỹ trúng, kháng choáng...
   Họ này **tắt trong hàng đợi chuẩn hóa**.

Nâng báu vật: cấp 1–60 bằng "Bụi báu vật" (phân rã báu vật thấp), sao 1–5 bằng báu vật trùng.
Có thể **chuyển** báu vật giữa tướng miễn phí (nó thuộc tài khoản).

---

## 5. Sát thương: công thức chuẩn

### 5.1 Công thức hiện tại [Đã có] (đọc từ code)
- Chỉ số tướng: `Công = hệ số tướng × (1 + 1,8%·(cấp−1)) × (1 + 9%·(sao−1)) × (1 + 7%·TH) + đồ`,
  rồi × bảo bối × bị động × Chân Thân. `HP` tương tự với 4,5%/cấp, 12%/sao, 10%/TH.
- Ngọc kiếm: mỗi viên `8 × hệ số kiếm (Mika 1,6) × Công`. Chuỗi kiếm thứ 3, 6, 9... là **chí mạng ×1,5**
  và có nhân chuỗi.
- Khắc hệ: ×1,5 (Lửa > Băng > Đất > Sét > Lửa). Ảnh và Thường không khắc ai; Noct không bị khắc.
- Tuyệt kỹ: `gốc × sức mạnh (cấp kỹ năng × hình thái × tiến hóa) × Công`.
- Nhận đòn: `× (1 − Thủ)`, Thủ tối đa 50%; giáp hấp thụ trước HP.
- Quái: Công quái theo cấp gợi ý; boss chương có hệ số kỹ năng tăng 6%/chương.

### 5.2 Vấn đề đo được
Boss chương 2 (ải 100, cấp gợi ý 50): **2.451 HP**, mỗi viên kiếm boss ≈ 26.
Hiro cấp 100, 1★, TH1: **870 HP**, mỗi viên kiếm ≈ 20, tuyệt kỹ ≈ 139.
→ Hiro cần ~122 viên kiếm, boss cần ~34 viên (chưa kể chiêu). Dù gấp đôi cấp gợi ý, Hiro vẫn rất khó.
Nguyên nhân: HP quái tăng ~15/cấp gợi ý (tuyến tính, nhân 2,25 ở boss), còn Công tướng chỉ +1,8%/cấp,
và tuyệt kỹ Hiro gốc 45 quá nhỏ so với các tướng hiếm (135–150).

### 5.3 Đề xuất công thức v2 (mục tiêu cân bằng có thể kiểm chứng)
Định nghĩa **TTK** (số lượt để hạ) và đặt mục tiêu theo vai trò trận:

| Trận | Tướng ở cấp gợi ý, đồ đúng mức | Tỷ lệ thắng mục tiêu |
|---|---|---|
| Quái thường | 4–6 lượt | ≥ 95% |
| Tinh anh | 8–11 lượt | ~75% |
| Boss chương | 14–18 lượt | ~50% (Hiro), ~70% (tướng hiếm 1★), ~85% (4★) |

Cách đạt (đề xuất, kiểm bằng bộ mô phỏng `qa/gemwoven/balance-sim.cjs`):
1. Hiro: tuyệt kỹ gốc 45 → 70 và Chân Thân Hiro thêm hồi máu; Hiro có đường lên sao (1.2).
2. Boss chương: hệ số HP 2,25 → 1,9 cho chương 1–14; giữ nguyên chương muộn (đã có pha).
3. Thêm chỉ số **Bạo kích** (từ ngọc/báu vật) chồng lên chí mạng chuỗi: tỷ lệ cơ bản 0%, tối đa 40%.
4. Lợi thế tướng hiếm nằm ở **kỹ năng** (choáng, giáp, hút năng lượng) chứ không ở HP gấp đôi:
   mô phỏng cho thấy rõ tỷ lệ thắng tăng thay vì chỉ thắng nhanh hơn.

Mọi hằng số nằm trong `progression.js` và được dùng chung bởi combat; máy chủ sau này nạp đúng bảng đó.

---

## 6. Hồ sơ, chỉ số chi tiết, Lực chiến

- **Lực chiến** = `HP × Công × (1 + Thủ)` (đã có) — giữ, vì nó tỉ lệ đúng với TTK.
- Bấm ô Lực chiến ở Home → mở **Chi tiết lực chiến** [Làm đêm nay]: bảng HP/Công/Thủ theo từng nguồn
  (gốc, cấp, sao, tiến hóa, trang bị, bảo bối, kỹ năng), và hàng "Cách tăng tiếp" dẫn tới đúng trang.
- Trang Tướng có nút **Lộ trình** [Làm đêm nay]: một bảng cho thấy tướng đang ở đâu trên từng trục,
  cổng kế tiếp cần gì, mở ra cái gì.

---

## 7. Túi đồ: bấm vật phẩm thì sao

| Loại | Hành động | Ghi chú |
|---|---|---|
| Sách EXP, Ấn | "Đi tới Tăng cấp" | Tiêu hao qua nút Tăng Level (đúng một chỗ quyết toán) |
| Bí kíp | "Đi tới Kỹ năng" | |
| Mảnh tướng | "Ghép tướng" khi đủ 80 | tiêu hao ngay trong túi |
| Vé | "Đi tới Triệu hồi" | |
| Trang bị | "Trang bị", "Cường hóa", "Phân rã" | |
| **Rương chọn** [Đề xuất] | "Mở" → chọn 1 trong N | ví dụ rương chọn mảnh tướng cũ từ sự kiện |
| **Thẻ thời gian** [Đề xuất] | "Dùng" → nhận ngay 2 giờ thưởng offline | nguồn: nhiệm vụ tuần, sổ hành trình |
| **Rương vật liệu** [Đề xuất] | "Mở" (mở nhiều) | |

Quy tắc: vật phẩm "Dùng" được quyết toán bởi engine (sau này là máy chủ), luôn có xác nhận số lượng.

---

## 8. Cái gì bán ở đâu

| Vật phẩm | Cửa hàng vàng | Cửa hàng Ngọc | Triệu hồi | Sự kiện | Đấu trường / Thử luyện | Không bao giờ |
|---|---|---|---|---|---|---|
| Sách EXP, quặng, gỗ, vải | ✔ | | ✔ | ✔ | ✔ | |
| Bí kíp kỹ năng | ✔ (giới hạn ngày) | ✔ | | ✔ | ✔ | |
| Tinh hoa, thần thạch | | ✔ (giới hạn) | | ✔ | ✔ | bán bằng vàng |
| Trang bị Huyền thoại/Thần | | ✔ (giới hạn tuần) | ✔ | | | |
| **Tướng hiếm** | | | ✔ (banner) | | | bán trực tiếp |
| Mảnh tướng banner hiện tại | | | ✔ | ✔ đổi (tối đa 30/kỳ) | | |
| Mảnh tướng cũ | | | | Cửa hàng Ký Ức | ✔ (giới hạn tuần) | |
| Mảnh Hiro | | | | ✔ | ✔ | bán bằng tiền |
| Vũ khí bản mệnh | | | ✔ banner vũ khí | mảnh | | |
| Báu vật | | | | tích nạp, đua top | top mùa | triệu hồi |
| Ngọc khảm | ✔ cấp 1 | ✔ cấp 2 | | ✔ | ✔ | cấp 4–5 trực tiếp |
| Trang phục / khung / danh hiệu | | ✔ một số | | ✔ | ✔ | ảnh hưởng chỉ số |
| Đá Ngọc, vé | | | | | | bán bằng vàng; thưởng gameplay |

---

## 9. Triệu hồi và chu kỳ banner

- **Banner tướng** (2 tuần): một tướng nổi bật, tỷ lệ công khai, bảo đảm 300 lượt [Đã có], thêm
  **Điểm triệu hồi**: mỗi lượt +1, đủ 300 đổi thẳng tướng banner (điểm không mang sang kỳ sau, đổi
  thành Bụi Ký Ức) [Đề xuất].
- **Banner vũ khí bản mệnh** chạy song song tướng banner [Đề xuất].
- **Banner thường trực** (mọi tướng đã phát hành, tỷ lệ thấp hơn) mở từ khi có ≥ 3 tướng hiếm [Đề xuất].
- **Chạy lại (rerun)**: một tướng quay lại sau ít nhất 3 kỳ (6 tuần). Giữa các lần, mảnh tướng cũ
  có ở **Cửa hàng Ký Ức** (giới hạn tuần) bằng Bụi Ký Ức từ bản trùng sau 6★ và đấu trường.
- Mỗi tướng mới tương lai đi theo `docs/HERO_PIPELINE.md`: 3 hình thái, bộ kỹ năng 4 nhánh, vũ khí bản mệnh.

---

## 10. Kiếm tiền (tất cả qua máy chủ thanh toán, hiện **Sắp ra mắt**)

Giá là gợi ý (VND), chỉnh trước phát hành. Cấu hình: `liveops.js`.

| Sản phẩm | Giá | Nhận | Ghi chú |
|---|---|---|---|
| Gói Đá Ngọc | 22k–2,2tr | 60–6.480 Ngọc | Lần nạp đầu mỗi mốc ×2 |
| **Thẻ Tháng** | 109k / 30 ngày | 300 Ngọc ngay + 100 Ngọc/ngày khi đăng nhập (3.300); +2 giờ trần offline; +1 lượt boss vô hạn có thưởng/ngày; quét ải 3★ không cần vé | Mua lại khi còn hạn thì cộng dồn ngày (tối đa 180) |
| **Thẻ Trọn Đời** | 499k | 980 Ngọc; +20% vàng offline; +1 ô hàng đợi rèn | một lần |
| **Sổ Hành Trình** (season pass) | 199k / mùa 28 ngày | Nhánh Vàng của 50 cấp | xem 10.1 |
| **Quỹ Trưởng Thành** (speed pass) | 299k một lần | Ngọc + tài nguyên ở các mốc cấp tướng cao nhất 10..300 (tổng ~7.000 Ngọc) | trả theo tiến độ, không hết hạn |
| Gói ưu đãi giới hạn | 49k–499k | tài nguyên nâng cấp theo đúng nút người chơi đang kẹt | tối đa 1 lần / 7 ngày mỗi gói; không popup ép |
| Trang phục hình thái | 199k | skin cho một hình thái (không chỉ số) | sưu tập |

### 10.1 Sổ Hành Trình (trả lời "mua vé tháng thì cày đủ mốc nhận thêm không")
- Mùa 28 ngày, 50 cấp, điểm từ nhiệm vụ ngày/tuần (không từ nạp). Nhánh Miễn phí cho mọi người.
- Mua Nhánh Vàng **bất cứ lúc nào trong mùa**: nhận ngay **toàn bộ phần thưởng Vàng của các cấp đã đạt**,
  các cấp sau nhận khi đạt. Hết mùa, phần thưởng chưa nhận tự gửi hộp thư (trừ Đá Ngọc: không có
  Đá Ngọc trong sổ).
- "Tăng tốc": 7 ngày cuối mùa được mua cấp bằng Đá Ngọc, tối đa 10 cấp/mùa.

### 10.2 VIP (theo tổng nạp xác thực, không bao giờ giảm)

| VIP | Tổng nạp | Quyền lợi thêm (cộng dồn) |
|---|---|---|
| 1 | 100k | Khung avatar VIP, quà ngày 500 vàng, +0 giờ offline |
| 2 | 300k | Quét ải 3★ (1 vé quét/lần), quà ngày 1.000 vàng |
| 3 | 600k | Hiệu ứng vào trận, +1 lượt boss vô hạn có thưởng, offline 13 giờ |
| 4 | 1tr | Cửa hàng VIP mở 2 ô, mua gói quà VIP 4 |
| 5 | 2tr | Bong bóng chat VIP, +1 lượt boss, offline 13 giờ |
| 6 | 4tr | Rèn hàng đợi 2, offline 14 giờ |
| 7 | 7tr | +1 lượt boss, cửa hàng VIP 4 ô |
| 8 | 12tr | Trang phục độc quyền một trang bị (không chỉ số) |
| 9 | 20tr | +1 lượt boss, offline 15 giờ |
| 10 | 35tr | Trang phục tướng độc quyền (không chỉ số) |
| 11 | 60tr | Khung + danh hiệu "Đại Phú Hộ" |
| 12 | 100tr | Hậu cần riêng (CSKH), offline 16 giờ |

Nguyên tắc: VIP **không cộng chỉ số chiến đấu**, chỉ thêm tiện lợi, tài nguyên ngày và đồ trang trí.
Mỗi mốc có **Gói Quà VIP** mua một lần bằng Đá Ngọc (giá trị cao). Thay đổi so với bản cũ:
"tướng riêng từ VIP10" → "trang phục tướng riêng" (tặng tướng cho VIP là trả tiền để thắng).

---

## 11. Sự kiện: nhịp tuần / 2 tuần / tháng / quý

| Chu kỳ | Reset | Nội dung | Mục đích |
|---|---|---|---|
| Ngày | 00:00 GMT+7 | Nhiệm vụ ngày, Sân Thử Luyện theo hệ, quà VIP/thẻ tháng | thói quen |
| Tuần | Thứ Hai 00:00 | Nhiệm vụ tuần → rương tuần; thưởng hạng Đấu Trường; cửa hàng tuần; **Cuối tuần x2** (T6–CN, luân phiên: x2 vàng ải / x2 nguyên liệu boss / x2 điểm đấu trường) | nhịp ngắn |
| 2 tuần | Thứ Hai tuần lẻ | **Kỳ banner** + sự kiện chủ đề của tướng đó: boss sự kiện, cửa hàng đổi mảnh (≤ 30 mảnh/kỳ), tích nạp → báu vật chủ đề, đua top tiêu Ngọc | nguồn thu chính |
| Tháng | Ngày 1 | Mùa Sổ Hành Trình, mùa Đấu Hạng (reset mềm), lịch đăng nhập 28 ngày, BXH tháng boss vô hạn | giữ chân |
| Quý | Tuần đầu quý | **Thư Hùng Đại Hội**, trang phục mới, sự kiện kỷ niệm | đỉnh cảm xúc |

**Vòng lặp lấy mảnh tướng cũ**: mỗi tướng đã phát hành có ít nhất 3 đường: chạy lại banner (≥ 6 tuần
một lần), Cửa hàng Ký Ức (tuần), mốc lịch đăng nhập tháng (rương chọn mảnh). Người chơi luôn có
đường dài để nâng một tướng cũ lên 6★.

**Mẫu sự kiện cho Studio** (mở rộng `docs/event.schema.json` khi có máy chủ): Đăng nhập N ngày, Tích nạp,
Tiêu Ngọc, Đổi vật phẩm, Boss sự kiện, Đua top (điểm do máy chủ tính), Nhiệm vụ mốc, Ghép chữ.
Không có vòng quay may mắn bán bằng tiền (rủi ro pháp lý về cờ bạc).

---

## 12. Đấu trường

### 12.1 Chế độ
1. **Đấu Hạng (thời gian thực 1v1)** — chế độ chính.
   - Hai hàng đợi: **Tự Do** (chỉ số thật, ghép theo MMR và chênh Lực chiến ≤ 25%) và **Chuẩn Hóa**
     (chỉ số chuẩn, kỹ năng cấp 1, không đồ Thần/báu vật/VIP: thuần kỹ năng xếp ngọc + bộ kit tướng).
   - Bậc: Đồng → Bạc → Vàng → Bạch Kim → Kim Cương (mỗi bậc III–I) → Tinh Anh → Cao Thủ (top 500)
     → Thách Đấu (top 50). MMR ẩn Glicko-2; điểm hạng hiển thị.
   - Lượt 20 giây; 3 lần hết giờ = thua; mất kết nối 60 giây = AI tạm điều khiển rồi xử thua.
2. **Thách Đấu Phòng Thủ (bất đồng bộ)** — đánh đội phòng thủ người khác do AI máy chủ điều khiển,
   5 vé/ngày, cho người không chơi thời gian thực được.
3. **Giao Hữu** — mời từ Quảng Trường, không thưởng, chọn Tự Do hoặc Chuẩn Hóa.
4. **PvP cục bộ** 2 người 1 máy [Đã có] giữ lại như chế độ vui.

### 12.2 Thưởng
- **Tuần** (Thứ Hai): theo bậc hiện tại: vàng, Huy hiệu Đấu Trường (tiền cửa hàng đấu trường), bí kíp.
- **Mùa** (tháng): khung avatar theo bậc cao nhất, danh hiệu mùa, top 100 có báu vật Cam, top 10 Đỏ.
- Cửa hàng Đấu Trường: mảnh tướng cũ (giới hạn tuần), mảnh Hiro, ngọc khảm, trang phục.
- Không có Đá Ngọc.

### 12.3 Thư Hùng Đại Hội (hằng quý)
- Đăng ký 1 tuần, vòng Thụy Sĩ trực tuyến 2 ngày (7 vòng) → top 64 loại trực tiếp có xem trực tiếp
  (khán giả vào xem bàn ngọc theo thời gian thực, trễ 10 giây chống mách nước).
- Hai hạng: Chuẩn Hóa (kỹ năng) và Tự Do (sức mạnh) — hai nhà vô địch.
- Thưởng: danh hiệu độc nhất có tên mùa, báu vật Thần, trang phục vô địch, tượng ở Quảng Trường mùa sau.
  (Vô địch được **đặt tên danh hiệu riêng** theo khuôn mẫu, qua kiểm duyệt.)

### 12.4 Máy chủ quyết định (bắt buộc cho mọi chế độ có thưởng)
- Máy chủ sinh **seed bàn ngọc**, áp nước đi, tính rơi ngọc, chuỗi, năng lượng, sát thương, RNG hiệu ứng.
- Client gửi **ý định**: `swap(r1,c1,r2,c2)`, `cast()`, `transform()`, `surrender()`, kèm số lượt.
  Máy chủ trả **nhật ký sự kiện** (deterministic) để client diễn hoạt cảnh.
- Không có cờ "thắng" nào từ client. Phần thưởng, MMR, BXH chỉ ghi sau trạng thái kết thúc của máy chủ.
- Luật combat viết thành **lõi xác định** (không DOM, không `Math.random`, RNG có seed) kèm **bộ vector
  kiểm thử**: cùng seed + cùng nước đi → cùng nhật ký. Lõi này chạy được ở máy chủ, ở client web và
  được chép sang Godot (GDScript/C#) với cùng bộ vector làm chuẩn.

---

## 13. Boss Vô Hạn và Sân Thử Luyện

Mục tiêu (theo yêu cầu): nơi **spam để thử tướng**, nhận thưởng nhỏ đều, nhiều hơn offline một chút.

1. **Tháp Boss Vô Hạn** [Đã có]: tầng tăng dần, xoay vòng boss chương, thưởng giảm sau 12 trận/ngày.
   Thêm: mỗi 10 tầng lần đầu → 10 mảnh Hiro [Làm đêm nay]; tầng 60+ rơi ngọc khảm [Đề xuất].
2. **Sân Thử Luyện** [Đề xuất]: **một đại diện trâu theo hệ mỗi ngày** (T2 Hỏa Long, T3 Nữ Hoàng Tuyết,
   T4 Cổ Thụ Đá, T5 Chúa Tể Giông, T6 Ảnh, T7–CN chọn tự do), HP vô hạn, 15 lượt, đo tổng sát thương.
   - Không cần nhiều quái: 4–5 đại diện dùng lại art boss có sẵn, mỗi con một cơ chế rõ (giáp, hồi máu,
     hút năng lượng, phản đòn) để thử đúng điểm mạnh/yếu của tướng.
   - Thưởng theo mốc sát thương (vàng, EXP, Huy hiệu Thử Luyện), **10 lượt có thưởng/ngày**, sau đó
     vẫn đánh thoải mái không thưởng (để thử build). Tổng thưởng/ngày ≈ 1,5 giờ offline.
   - BXH sát thương tuần theo hệ (máy chủ).

---

## 14. Xã hội: Quảng Trường

- **Quảng Trường** là một cảnh thị trấn 2D: mỗi người chơi xuất hiện bằng **tướng + hình thái + danh
  hiệu** đang khoe, chạy qua lại, bong bóng chat trên đầu, biểu cảm.
- Chạm người khác: xem hồ sơ (tướng, lực chiến, danh hiệu, thành tích), **mời Giao Hữu**, kết bạn, báo cáo.
- Kênh: Thế giới (phòng 50 người, máy chủ chia phòng), Khu vực, Bang hội (sau), Riêng tư.
- Kiểm duyệt: lọc từ, giới hạn tốc độ, tắt tiếng, báo cáo, chặn; mới đăng ký 24 giờ chỉ chat kênh khu vực.
- Bang hội (giai đoạn sau): boss bang, quyên góp, cửa hàng bang.
- Chat hiện tại cục bộ giữ nguyên làm giao diện; trực tuyến cần máy chủ WebSocket.

---

## 15. Danh hiệu, khung, sưu tập

- **Danh hiệu**: sưu tầm từ thành tích (vượt chương 10, hạ 1.000 boss...), mùa đấu trường, sự kiện,
  VIP, Thư Hùng. Đeo 1 danh hiệu hiển thị. Mỗi danh hiệu sưu tập được cộng **+0,2% HP/Công toàn tài
  khoản**, tối đa +6% (30 danh hiệu). Danh hiệu có khung chữ theo phẩm (Codex vẽ khung).
- **Khung avatar**: tương tự, không chỉ số.
- **Sưu tập hình thái**: mỗi hình thái đã mở +0,5% HP toàn tài khoản; đủ 3 hình thái một tướng
  +1% Công toàn tài khoản. Nhỏ, nhưng thưởng cho người sưu tầm và cho việc giữ hình thái cũ.
- **Thiết kế danh hiệu**: không cho tự do (rủi ro nội dung). Chỉ nhà vô địch Thư Hùng được đặt chữ
  theo khuôn, kiểm duyệt trước khi hiển thị.

---

## 16. Tải tài nguyên theo gói (yêu cầu bổ sung) [Làm đêm nay: bản kê gói + quy tắc chọn gói]

Hiện trạng đo được: thư mục `assets/` 7,5 GB (gồm nguồn vẽ), bản hub nhúng một file 342 MB.
Không thể phát hành kiểu này.

- **Gói** = một nhóm file tải/xóa cùng nhau, có mã băm phiên bản.
  - `core`: giao diện, Home, âm thanh chung, Hiro hình thái 1, chương 1.
  - `chapter-N`: bản đồ, cảnh combat, quái, tinh anh, boss, nhạc của chương N.
  - `hero-<tướng>-f<N>`: một hình thái của một tướng (sheet combat, showcase, âm thanh tuyệt kỹ).
  - `summon-<banner>`: cảnh hồ triệu hồi của kỳ hiện tại.
- **Quy tắc chọn** (`packsFor(save)` trong `src/gemwoven/asset-packs.js`): core + chương đã mở + chương kế
  (tải trước) + mọi hình thái đã mở của tướng sở hữu + hình thái 1 của tướng banner hiện tại (để xem
  trước) + gói banner. Chưa sở hữu, chưa mở chương thì chưa tải.
- Tướng chưa tải đủ gói vẫn hiện ở danh sách bằng chân dung nhỏ (trong core).
- Web: Cache Storage theo gói + service worker. Android: Play Asset Delivery (install-time = core,
  fast-follow = chương 1–2, on-demand = phần còn lại). Steam/iOS: tải trong game giống web.
  Godot: mỗi gói một file `.pck` nạp bằng `ProjectSettings.load_resource_pack`.
- Bản kê sinh tự động: `python scripts/build_asset_packs.py` → `assets/packs.json` (dung lượng từng gói).

---

## 17. Đường sang Godot + máy chủ + Android

1. **Dữ liệu trước**: toàn bộ bảng (tướng, hình thái, chi phí, boss, sự kiện) xuất JSON từ `progression.js`
   / `liveops.js` → Godot và máy chủ đọc cùng một nguồn.
2. **Lõi combat xác định** + vector kiểm thử (12.4) trước khi viết client Godot.
3. Máy chủ: tài khoản, sổ cái tiền tệ (idempotent), thanh toán (Google Play Billing trước, xác minh
   receipt phía máy chủ), trận đấu, ghép trận, BXH, hộp thư, sự kiện, chat.
4. Client Godot 4: chỉ hiển thị + gửi ý định; giữ nguyên art đã duyệt.
5. Android trước (Play Asset Delivery), rồi iOS, rồi Steam.
6. Tuân thủ phát hành tại Việt Nam: phân loại độ tuổi, công bố tỷ lệ, quản lý thời gian chơi cho
   người dưới 18 theo quy định hiện hành (cần rà pháp lý trước khi mở).

---

## 18. Lộ trình triển khai

| Giai đoạn | Nội dung |
|---|---|
| **Đêm 03/11** | Tài liệu này + Codex phản biện; chọn hình thái; mảnh Hiro; chi tiết lực chiến; lộ trình tướng; danh sách xám; cấu hình liveops + trang VIP/Thẻ tháng/Sổ hành trình (Sắp ra mắt); bản kê gói tài nguyên; bộ mô phỏng cân bằng |
| Tiếp theo (trên web) | Biến Thân trong trận; ngọc khảm; bộ hệ; Sân Thử Luyện; báu vật (dữ liệu + UI); cân bằng v2 theo mô phỏng |
| Trước máy chủ | Lõi combat xác định + vector kiểm thử; xuất JSON dữ liệu |
| Máy chủ | Tài khoản, sổ cái, thanh toán, Đấu Hạng, Quảng Trường, sự kiện, BXH |
| Godot | Client Android, gói tài nguyên PAD |

---

## 19. Câu hỏi cần chủ game chốt

1. Cho phép **chọn hình thái thấp hơn trong trận** (yếu hơn, vì hoài niệm/phong cách) hay chỉ chọn
   diện mạo ngoài trận? Bản đêm nay: chọn được, áp dụng cả trong trận.
2. Hiro có hình thái riêng theo tiến hóa (cần vẽ 2 bộ) không?
3. Giá thẻ tháng / sổ hành trình / quỹ trưởng thành.
4. Cân bằng v2: hạ HP boss chương sớm hay tăng sức Hiro? (bản đề xuất: cả hai, nhẹ).
5. Báu vật đỏ/Thần chỉ từ nạp + đua top: chấp nhận mức chênh PvE này? PvP Chuẩn Hóa tắt báu vật.

---

## 20. Phản biện của Codex và trả lời

(Điền sau vòng phản biện.)
