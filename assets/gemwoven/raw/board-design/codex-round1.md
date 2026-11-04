**Đề xuất của tôi: chốt luật board trước, rồi thiết kế tướng quanh những nước ghép có chủ đích.** Tím phải cho nhiều nộ nhất; Băng kiểm soát lượt; combo thưởng có trần. Giữ ghép 3 Băng đóng băng ngay với quái thường, còn boss cần tích đủ 6 Băng.

Các số ở **A là code hiện tại**; **B–D là đề xuất để thử nghiệm**, chưa phải cân bằng đã được chứng minh.

**A. Luật hiện tại đã kiểm chứng**

Quy ước: `A` = chỉ số Công; `H` = HP tối đa của bên nhận; sát thương dưới đây còn chịu khắc hệ, phòng thủ, giáp và kỹ năng.

| Ngọc | Người chơi trong PvE | Quái trong PvE |
|---|---|---|
| **Kiếm** | `8 × hệ số Kiếm × A` sát thương; **7 nộ/ngọc** | Sát thương gốc **4,4/ngọc** thường, **9,2/ngọc** boss, rồi nhân Công quái; **3 nộ/ngọc** |
| **Tím** | **5 nộ/ngọc**, không có hiệu ứng khác trực tiếp | **3 nộ/ngọc +25 nộ ở viên tím đầu tiên** của lần giải board |
| **Tim** | Hồi `max(round(6 × max(1,√A)), round(1,2% H))`; **2 nộ/ngọc** | Hồi `max(6, round(0,2% H))`; **3 nộ/ngọc** |
| **Băng** | **2 nộ/ngọc**; thu đủ **3 viên trong cả lần giải board** đặt trạng thái đóng băng quái | **3 nộ/ngọc**; viên Băng đầu tiên **hút 20 nộ người chơi**, có thể bị Kháng chống lại |
| **Khiên** | Giáp `max(g, round(1,5% H × g/4))`, với `g=4`, **Yuki=8**; **2 nộ/ngọc** | Giáp `max(5, round(0,3% H))`; **3 nộ/ngọc** |

Nguồn: [collect: nộ, Băng, sát thương](/D:/Project/Gemwoven/src/live-combat.js:76), [sản lượng Tim/Khiên](/D:/Project/Gemwoven/src/progression-combat.js:36).

Các ngoại lệ đáng chú ý:

- **Lumi nhân toàn bộ nộ từ ngọc ×2**, tăng đến ×2,5 theo Bị Động; không chỉ tím.
- **Mika Kiếm ×1,6**. **Hiro Kiếm ×1,2 trong PvE**. **Nori sát thương ×0,75**. **Yuki giảm 20% sát thương nhận**.
- Giáp tối đa: người chơi `max(999, 50% H)`; quái `max(999, 8% H)`.
- Cấm hồi và Giáp tan chảy có thể làm Tim/Khiên người chơi nhận **0**.

Nguồn: [skillKit](/D:/Project/Gemwoven/src/gemwoven/progression.js:191), [trần giáp](/D:/Project/Gemwoven/src/game.js:297), [chặn hồi/giáp](/D:/Project/Gemwoven/src/foe-skills.js:150).

| Hình ghép/đặc biệt | Luật đang chạy |
|---|---|
| **Ghép 3** | Hàng/cột ≥3 cùng loại; nhận thưởng từ các viên bị xóa |
| **Ghép 4** | Người chơi tạo **Sao băng**; giữ lại 1 viên làm special, nên thường chỉ thu thưởng **3 viên** |
| **Ghép 5** | Tạo **Bom**, thường thu thưởng **4 viên** |
| **L/T** | Gộp các hàng/cột giao nhau theo số ô duy nhất: **5 ô → Bom; ≥6 ô → Lõi** |
| **Sao băng** | Xóa vùng **5×5**, bị cắt ở mép board |
| **Bom** | Xóa **mọi viên cùng màu** trên board |
| **Lõi** | Đổi với ngọc bên cạnh để xóa màu đó; bấm riêng chọn màu **ngẫu nhiên** |
| **Hai Lõi** | Xóa toàn board **N lần**, với N = tổng special lúc ghép; số lần cố định từ đầu |
| **Quái ghép 4/5** | **Không tạo special** |
| **Quái kích special** | Ngọc trúng hiệu ứng special được tính thưởng cho **người chơi** |
| **Special nổ nối nhau** | Có kích hoạt dây chuyền; mỗi viên được thu tối đa một lần trong lần giải board |

Nguồn: [nhận diện ghép](/D:/Project/Gemwoven/src/game.js:146), [tạo và kích special](/D:/Project/Gemwoven/src/game.js:192), [hai Lõi](/D:/Project/Gemwoven/src/game.js:210), [phân thưởng hai bên](/D:/Project/Gemwoven/src/game.js:326). Bản `clearPlan` thực sự gọi thu thưởng nằm ở [board-sequence.js](/D:/Project/Gemwoven/src/board-sequence.js:379).

| Nội dung | Kết quả kiểm chứng |
|---|---|
| **Cascade có thêm nộ?** | Có nộ từ **các viên mới được xóa**; **không có thưởng/hệ số nộ riêng theo combo** |
| **Combo có tăng sát thương?** | Có: các sóng **liên tiếp có Kiếm** tăng **15%/sóng**, tối đa +90%; sóng Kiếm thứ **3/6/9… chí mạng ×1,5** |
| **Sóng không có Kiếm** | Ngắt chuỗi Kiếm, dù số “Combo” trên màn hình vẫn tăng |
| **Tim/Khiên có nhân combo?** | Không |
| **Điểm hành trình** | Có nhân theo tổng số sóng; không phải nộ hay tiền |
| **Ghép sai** | Trả ngọc về, **không mất lượt** |
| **Ghép 4/5, cascade** | **Không cho thêm lượt đổi ngọc**; vẫn thuộc một hành động |
| **Giới hạn lượt** | Combat thường không có trần chung; Thử Luyện có trần riêng |

Nguồn: [đếm chuỗi và điểm](/D:/Project/Gemwoven/src/live-combat.js:67), [hệ số chuỗi](/D:/Project/Gemwoven/src/adventure-effects.js:97), [chí mạng](/D:/Project/Gemwoven/src/combat-v3.js:258), [xử lý lượt](/D:/Project/Gemwoven/src/game.js:403).

**Đóng băng chính xác:** đủ **3 Băng thu được trong một `resolveBoard`**, cộng xuyên cascade và nổ special; không bắt buộc là một hàng 3 Băng tự ghép. Không tích sang lần đổi ngọc sau. Quái bỏ một hành động khi đến bước kiểm tra đóng băng; hiện **chưa có miễn khống chế sau đó**, kể cả boss. Tuy nhiên, tuyệt kỹ đủ nộ có thể được xử lý **trước bước bỏ lượt**. [Điều kiện Băng](/D:/Project/Gemwoven/src/live-combat.js:89), [thứ tự lượt quái](/D:/Project/Gemwoven/src/game.js:370).

Trong nhóm chế độ `duel/spar/cup`, hai bên nhận nộ theo `[7,2,5,2,2]`; Băng đủ 3 cũng đóng băng người chơi, thay cho hút 20 nộ; Khiên cho 4 giáp. Không nên coi toàn bộ runtime PvP hiện tại đã đối xứng chỉ vì chỉ số được chuẩn hóa. [Nhánh PvP](/D:/Project/Gemwoven/src/live-combat.js:86), [sản lượng PvP](/D:/Project/Gemwoven/src/progression-combat.js:41).

**Những điểm tôi đánh giá cần sửa trước:**

| Điểm | Hệ quả |
|---|---|
| **3 Kiếm = 21 nộ + sát thương; 3 tím = 15 nộ** | Tím thiếu vai trò riêng. Tím vẫn hữu ích khi thiếu nước Kiếm, nhưng thua về giá trị trực tiếp |
| Lumi nhân nộ mọi màu | Lumi vẫn thích Kiếm hơn tím; bản sắc pháp sư chưa nằm ở cách chọn màu |
| Băng không có chống khóa lượt | Có thể liên tục tước hành động quái/boss |
| Chuỗi Kiếm khác bộ đếm combo hiển thị | Người chơi khó đoán chính xác phần thưởng |
| Special vừa rất rộng vừa có quyền hưởng riêng cho hero | Khó cân bằng AI và chuyển sang PvP |
| Hai Lõi xóa nhiều board | Có thể tạo lượng tài nguyên và tuyệt kỹ rất lớn trong một hành động |
| Tài liệu ghi boss **80 nộ**, runtime tự tung chiêu dùng **100** | Mô phỏng và trận thật đang lệch luật |

Ngưỡng runtime: [hàng đợi tuyệt kỹ](/D:/Project/Gemwoven/src/live-combat.js:10), [castReadyUltimates](/D:/Project/Gemwoven/src/combat-stage.js:353). `OpponentAI.loot()` là **bản ước lượng để chọn nước**, không phải nơi trao thưởng thật; hiện vẫn dùng Tim 6, giáp phẳng, trần nộ 100 và thiếu nhiều hệ số tiến trình. [loot()](/D:/Project/Gemwoven/src/opponent-ai.js:147).

**B. Cơ chế board đề xuất**

**Chọn một bộ luật chung, dễ đọc, không đổi tỷ lệ xuất hiện màu theo tướng ở bản đầu.**

| Ngọc | Thưởng cơ bản mỗi viên | Một ghép 3 thông thường |
|---|---|---|
| **Kiếm** | Giữ sát thương gốc **8 × Công**, trước hệ số tướng; **2 nộ** | 24 sát thương cơ bản + **6 nộ** |
| **Tím** | **8 nộ**, không gây sát thương | **24 nộ** |
| **Băng** | **1 điểm Băng +1 nộ** | 3 điểm Băng +3 nộ |
| **Tim** | Giữ công thức hồi theo Công/HP ở A; **1 nộ** | 3 lần hồi +3 nộ |
| **Khiên** | Giữ công thức giáp theo HP ở A; **1 nộ** | 3 lần giáp +3 nộ |

Như vậy **mọi màu vẫn tăng nộ**, nhưng tím cho **gấp 4 Kiếm, gấp 8 màu hỗ trợ**.

| Quy tắc | Số đề xuất |
|---|---|
| **Băng với quái thường/tinh anh** | Thu **3 Băng trong lượt → đóng băng 1 lượt ngay** |
| **Băng với boss** | Thanh **0/6**; tích xuyên lượt, đủ 6 → đóng băng 1 lượt rồi reset |
| **Chống khóa thường/tinh anh** | Sau khống chế phải được thực hiện **1 lượt đầy đủ** trước khi bị lại |
| **Chống khóa boss** | Phải được thực hiện **2 lượt đầy đủ** trước khi bị lại |
| **Băng trong thời gian miễn** | Vẫn nhận nộ; **không tích Băng dự trữ** |
| **Choáng và đóng băng** | Chung giới hạn; không nối hai trạng thái để vượt miễn |
| **Khi bị đóng băng** | Hoãn board và tuyệt kỹ chưa tung; DoT và hiệu ứng theo lượt vẫn chạy |
| **Quái dùng Băng** | Dùng cùng luật trên; **bỏ hút 20 nộ mặc định**. Hút nộ thuộc kỹ năng riêng |

Tôi **không chọn tích tầng cho mọi quái**: ghép 3 Băng rồi thấy đối thủ đóng băng ngay là phản hồi rõ nhất. Boss cần thanh 6 điểm để tránh một ghép nhỏ chặn một hành động có giá trị quá lớn.

| Sóng trong một lượt | Sát thương Kiếm của sóng | Tổng thưởng nộ combo khi kết thúc ở bậc này |
|---|---:|---:|
| 1 | ×1,00 | +0 |
| 2 | ×1,10 | +3 |
| 3 | ×1,20 | +6 |
| 4 | ×1,30 | +10 |
| ≥5 | ×1,40 | **+15 tối đa** |

Thưởng nộ cột cuối **chỉ nhận một mức**, không cộng `3+6+10+15`. Đếm mọi sóng cascade; Tim/Khiên/Băng không nhân hiệu lực. **Bỏ chí mạng chung mỗi sóng Kiếm thứ ba**, dành cơ chế đó cho tướng phù hợp.

| Hình ghép | Phần thưởng đề xuất |
|---|---|
| **3** | Thưởng màu |
| **4 thẳng** | **Sao băng**, xóa một hàng/cột theo hướng ghép, tối đa 8 ô |
| **5 thẳng hoặc dài hơn** | **Lõi**, đổi với màu muốn xóa |
| **L/T** | **Bom 3×3** |
| **Hai Lõi** | Xóa toàn board **đúng 1 lần** |
| **Ô giữ lại tạo special** | Vẫn nhận thưởng ghép ban đầu; không nhận lại nếu nổ ngay trong cùng lượt |
| **Quyền hưởng** | Bên đang đi nhận thưởng và tạo special; áp dụng như nhau cho hero/quái |

Giới hạn chung: thanh nộ **199**, tuyệt kỹ tốn **100**; nộ kiếm được tối đa **50/lượt** sau mọi thưởng, tối đa **1 tuyệt kỹ/lượt của mình**, tự tung sau khi board giải xong. Nộ dư giữ lại. Lumi Biến Thân có ngoại lệ trần 75 ở C.

**Đo bằng bot:**

Tôi đã chạy `node qa/gemwoven/balance-sim.cjs 200`, không sửa code:

| Boss, cấp gợi ý | Hiro 1★ có đồ | Mika 1★ có đồ |
|---|---:|---:|
| **Ải 100, cấp 50** | **54% thắng; 49 lượt** | **96%; 22 lượt** |
| **Ải 250, cấp 125** | **16%; 53 lượt** | **80%; 25 lượt** |

Số lượt là **trung bình các trận thắng**. Đây là mô phỏng giản lược, chưa chứng minh cân bằng trận thật.

- Đồng bộ mô phỏng với luật mới trước: special, ngưỡng 100 nộ, quyền hưởng, khống chế, Biến Thân.
- Dùng [real-fights.cjs](/D:/Project/Gemwoven/qa/gemwoven/real-fights.cjs:1), hiện cần server cổng 8080 và Edge; mở bộ case từ Hiro/Mika sang đủ **6 tướng**, các mốc **1/4/6★**, mở nhánh **100/180/400**.
- Chạy **100 trận/ô để lọc**, **500 trận/ô để chốt**; cùng seed khi có thể. So bot ưu tiên Kiếm, tím, khống chế và bot chọn theo trạng thái. Bot hiện dựa vào điểm gợi ý cũ nên chưa đo được lợi ích chọn Băng/tím mới.
- Ghi: thắng, P50/P90 lượt, nộ theo từng nguồn, lượt/tuyệt kỹ, tỷ lệ lượt bị khóa, lượng hồi/giáp bị phí, số special. Mục tiêu tím đóng góp **≥50% nộ từ ngọc** khi bot chủ động chọn tím.

**C. Cân bằng tướng gắn với board**

Các số dưới đây là **bậc kỹ năng 1**, sát thương ghi `×A`. Đây là phương án **thay hiệu ứng tương ứng**, không cộng nguyên bộ mới lên bộ cũ.

| Tướng / cách chơi | Bị Động, bản sắc board | Biến Dị sau tuyệt kỹ | Tuyệt kỹ đề xuất |
|---|---|---|---|
| **Hiro — Kiếm, dễ dùng** | Giữ Kiếm PvE ×1,2; Bị Động giảm sát thương như hiện tại | Giữ hồi **1% HP/lượt** ở bậc 1 | Giữ **70×A**, một đòn |
| **Mika — Kiếm, ghép dài** | Giữ Kiếm ×1,6; nhóm Kiếm **4+ dùng ×1,75 thay ×1,6**; thay phần cộng Công phẳng | Trong 2 lượt, ghép Kiếm kế tiếp đặt thiêu đốt **8×A/lượt ×2 lượt**, một lần | Giữ **135×A** |
| **Yuki — Băng/Khiên** | Giữ Khiên 8 và giảm sát thương 20%; thu 3 Băng cho giáp **2% HP**, tối đa một lần/lượt | Hai lượt kế: Băng cho thêm **1% HP giáp/viên**, trần **3% HP/lượt** | **60×A +25 giáp +3 điểm Băng**, thay cho choáng trực tiếp |
| **Nori — Tim/Khiên** | Giữ sát thương ×0,75; Tim/Khiên **×1,2 hiệu lực**, thay cộng HP phẳng của nhánh | Hai lượt kế: ghép Tim/Khiên đầu lượt thêm **2% HP giáp/lượt** | Phong ấn **2 lượt**, tích sát thương Kiếm rồi nổ **×3**; chỉ khống chế **1 lượt** nếu mục tiêu hợp lệ; giữ hồi **40×√A ×3 lượt** |
| **Lumi — tím, chuẩn bị tuyệt kỹ** | Tím **10 nộ/viên thay 8**; màu khác theo luật chung; bỏ ×2 toàn màu | Trong 2 lượt: ghép tím kế tiếp hút **15 nộ**, một lần; không tự hoàn nộ | Giữ **140×A**, tổng 5 tia |
| **Noct — cascade, ghép 4/5** | Không bị khắc hệ; ở cascade ≥3, nhóm Kiếm đầu tiên chí mạng **×1,25**, tối đa một lần/lượt | Trong 2 lượt: tạo special kế tiếp gây tàn ảnh **15×A**, một lần | Giữ **150×A**, tổng 5 nhát |

Nori: sát thương tích **thay sát thương trực tiếp**, không tích DoT/proc; vụ nổ không tự tích lại. Nếu đối thủ đang miễn khống chế, phong ấn tích sát thương vẫn hoạt động nhưng không tước lượt.

**Biến Thân:** giữ mở ở **cấp 180 + TH3**, một lần/trận, kích khi HP ≤50% hoặc sau tuyệt kỹ thứ hai; không tốn lượt. Giữ phần chung **miễn choáng/đóng băng mới + giảm 15% sát thương nhận**.

| Tướng | Lợi ích riêng trong 3 lượt Biến Thân |
|---|---|
| **Hiro** | Nhóm Kiếm đầu mỗi lượt **+10% sát thương**; thay thưởng Công chung hiện tại; không dư âm sức mạnh |
| **Mika** | Nhóm Kiếm đầu lượt đặt thiêu đốt **16×A/lượt ×2 lượt**; thay mức 8 của Biến Dị, không cộng hai vết |
| **Yuki** | Ngưỡng Băng thành **2 với thường/tinh anh, 4 với boss**; vẫn chịu miễn khống chế chung |
| **Nori** | Tim/Khiên **×1,5 thay ×1,2**; 25% hồi dư chuyển thành giáp, trần **4% HP/lượt** |
| **Lumi** | Tím **16 nộ/viên thay 10**; trần nộ kiếm được **75/lượt**; vẫn tối đa một tuyệt kỹ/lượt |
| **Noct** | Cascade ≥2 cho chí mạng Kiếm **×1,5 thay ×1,25**; đạt cascade ≥3 được né một đòn thường kế tiếp, tối đa **một lần mỗi lần Biến Thân** |

**Yuki không được ghép đôi:** vẫn cần match ≥3; ngưỡng 2 có ích khi special chỉ thu được 2 Băng.

Ở cấp 400 + TH5, giữ nâng thời gian thành **4 lượt**. Tôi đề xuất bỏ dư âm **+Công vĩnh viễn** ở cả sáu tướng; dư âm chỉ còn hình ảnh. Những hiệu ứng 6★ hiện tại như Hóa mờ/Xuyên giáp phải được xét lại trong ngân sách tướng, tránh cộng thêm nguyên bộ.

**Hiro không được buff:** giữ Công nền, Kiếm ×1,2, tuyệt kỹ 70 và đường tăng trưởng hiện tại. Phiên bản Biến Thân trên khiêm tốn hơn bộ +Công đang chạy. Tác động từ board chung vẫn phải đo riêng; không tăng hệ số Hiro để bù.

**D. Hướng phát triển kỹ năng**

Giữ bốn nhánh đúng tinh thần [§2](/D:/Project/Gemwoven/docs/GAME_DESIGN.md:104), nhưng mỗi nhánh phải tạo một quyết định trên board.

| Nhánh | Hướng phát triển | Ví dụ tương lai |
|---|---|---|
| **Chủ Động** | Tiêu nộ để gây hiệu ứng và chuẩn bị nước tiếp | Mika đánh dấu tối đa **3 Kiếm đang có**; ghép chúng trong 2 lượt mới kích lửa |
| **Bị Động** | Thưởng hành động lặp lại có chủ đích | Noct ghép **ba màu khác nhau trong một lượt** để chuẩn bị chí mạng |
| **Biến Dị** | Sau tuyệt kỹ mở một cửa sổ khai thác board | Nori có **2 lượt** dùng Tim/Khiên để dựng giáp; bỏ qua cửa sổ thì mất |
| **Chân Thân** | Tạm đổi một quy tắc của tướng | Yuki giảm ngưỡng Băng; Lumi đổi hiệu suất tím; Mika đổi Kiếm thành nguồn thiêu đốt |

Nguyên tắc phát triển:

- Tăng bậc chủ yếu tăng **giá trị thưởng**; không đồng thời tăng sức mạnh, số lần kích, thời gian và giảm điều kiện.
- Kỹ năng tạo/đổi màu giới hạn **2–3 ô/lần**, không tự thưởng nộ cho hành động sinh ra nó.
- Chuyển màu, tạo special hoặc tích ấn phải có dấu hiệu nhìn thấy trên board.
- PvP Chuẩn Hóa dùng bộ kỹ năng cố định do chế độ cấp; tắt sức mạnh từ mua, cấp, sao, đồ, Báu Vật và Biến Thân tiến trình. Tướng chưa phát hành vẫn ghi **Sắp ra mắt**.

**E. Thứ tự làm, rủi ro và điểm cần chốt**

| Thứ tự | Việc | Điều kiện qua |
|---|---|---|
| **1** | Chốt bảng luật B; gom công thức board thành dữ liệu dùng chung cho combat, AI và mô phỏng | Không còn ba bản tính thưởng khác nhau |
| **2** | Làm nộ, thời điểm tuyệt kỹ, Băng và miễn khống chế | Không khóa liên tục, không tung nhiều tuyệt kỹ trong một lượt |
| **3** | Đổi special và quyền hưởng đối xứng | Mỗi ô nhận thưởng đúng một lần; hai Lõi chỉ một vụ nổ |
| **4** | Đo đủ sáu tướng với luật chung, chưa thêm toàn bộ hiệu ứng mới | Xác định tướng yếu vì board hay vì bộ kỹ năng |
| **5** | Thay Biến Thân, rồi Bị Động/Biến Dị từng tướng | So trước/sau, không cộng chồng bộ cũ |
| **6** | Dựng biểu tượng, thanh Băng, xem trước thưởng; review điện thoại và Studio | ≥8/10 theo quy trình dự án |

Rủi ro lớn nhất là **trận kéo dài hơn khi giảm nộ Kiếm**, Yuki/Nori hồi thủ quá mạnh, Lumi quay tuyệt kỹ quá nhanh, và Noct dựa quá nhiều vào may rủi cascade. Cần kiểm tra thêm: hàng đợi tuyệt kỹ trong `collect` chưa kiểm tra Phong ấn như `castReadyUltimates`; bộ đếm Biến Thân hiện giảm trước phản đòn quái, nên phải làm rõ thời điểm hết bảo vệ.

Mốc [§5.3](/D:/Project/Gemwoven/docs/GAME_DESIGN.md:263) vẫn dùng để đánh giá: thường **4–8 lượt**, tinh anh **8–12**, boss **14–25**. Hiro hiện chưa đạt mốc boss trong mô phỏng; muốn rút trận phải cân chỉnh board/quái, giữ luật **không buff Hiro**.

**Bốn quyết định tôi đề nghị chủ dự án chốt:**

1. **Nộ:** Kiếm/Tim/Tím/Băng/Khiên = **2/1/8/1/1**, có trần thưởng combo và một tuyệt kỹ/lượt.
2. **Khống chế:** thường 3 Băng ngay; boss tích 6; miễn sau đó lần lượt **1/2 lượt thực sự được hành động**.
3. **Special:** 4 thẳng → Sao băng; 5 thẳng → Lõi; L/T → Bom; **hai bên cùng luật**.
4. **Biến Thân:** giữ miễn khống chế + giảm 15%; thay +Công chung bằng hiệu ứng riêng, **bỏ dư âm sức mạnh**, Hiro không tăng sức mạnh.

Tôi nghiêng về cả bốn phương án trên. Đây là đề xuất của Codex để Claude phản biện và hai bên thống nhất trước khi triển khai; không thay đổi quy định Đá Ngọc hay thanh toán.