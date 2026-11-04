**Chốt hướng: giữ tên “Sao băng / Bom / Lõi”; hiệu ứng phải thể hiện đúng phạm vi xóa.** Dưới đây là spec để hai agent thống nhất trước triển khai; chưa sửa code hoặc vẽ asset.

**1. Phê bình FX hiện tại — 5/10**

1. **Sai ngôn ngữ hình ảnh:** Sao băng nổ vuông 5×5, Bom bắn tia xóa màu; nhìn hình không đoán được tác dụng.
2. **Thiếu chuyển động chủ đạo:** vòng tròn và đường nối mảnh chưa tạo cảm giác “quét”, “nén rồi nổ”, “cộng hưởng”.
3. **Trắng lấn màu:** tâm lóe cháy trắng, trong khi thân tia quá mảnh; mất chất liệu ngọc và dấu hiệu nhận diện.
4. **Nhịp bị vụn:** chờ từng viên, từng special khiến một vụ nổ giống nhiều lần xóa nhỏ. Mã hiện dùng `await` tuần tự.
5. **Hạt thiếu thứ bậc:** nhiều chấm, sao và vòng sáng cùng tranh chú ý; thiếu một nét chính đủ mạnh.
6. **Dư âm không giữ hình:** sau lóe sáng chỉ còn ô trống, thiếu vệt quét hoặc mảnh ngọc giúp mắt nối nguyên nhân với kết quả.
7. **Hai Lõi chưa có khoảnh khắc hợp nhất rõ:** xóa bàn nhiều lần kéo dài sức mạnh bằng thời lượng. Cần một lần hội tụ, một sóng toàn bàn.

Đã xác nhận `boardSpecialEffectKind()` đảo `bolt↔bomb`; phải bỏ lớp đảo này khi đổi cơ chế, đồng bộ cả âm thanh.

**2. Spec cơ chế chốt**

| Trường hợp | Quyết định |
|---|---|
| **4 thẳng** | Tạo **Sao băng**. Ghép ngang → xóa hàng; ghép dọc → xóa cột. Hướng theo **trục hàng ghép**, không theo hướng ngón tay kéo. |
| **5+ thẳng** | Tạo **Lõi**, kể cả cụm đồng thời có nhánh L/T. |
| **L/T hoặc cụm giao nhau ≥5 ô** | Tạo **Bom**, nếu không chứa hàng/cột thẳng ≥5. Chỉ tính các ô thuộc match hợp lệ. |
| **Ưu tiên trong một cụm** | **Lõi > Bom > Sao băng**; tối đa **1 special/cụm giao nhau**. Hai cụm độc lập có thể tạo hai viên. |
| **Vị trí tạo** | Viên người chơi vừa kéo, tại vị trí mới nếu thuộc cụm; nếu không, viên đổi chỗ còn lại thuộc cụm. Cascade: chọn ô gần tâm cụm nhất, hòa thì hàng trước, cột sau. |
| **Thưởng khi tạo** | Viên giữ lại chưa bị thu: ghép 4 thường thu **3 viên**. Không thêm thưởng riêng vì tạo special. |
| **Sao băng** | Ghép theo màu để kích; xóa **8 ô** trên hàng/cột, tính cả chính nó. Lưu hướng trên viên, rơi xuống vẫn giữ hướng. |
| **Bom** | Ghép theo màu để kích; xóa **3×3**, tối đa **9 ô**, cắt tại mép bàn. |
| **Lõi đổi với ngọc** | Xóa màu của viên đổi cùng và tiêu thụ Lõi. |
| **Bấm Lõi** | Chọn **màu nhiều nhất** trên bàn; hòa dùng thứ tự màu cố định. Tính cả Sao/Bom mang màu đó. Hiện dấu chọn màu trước khi xác nhận thao tác. Tốn **1 hành động** như đổi ngọc. |
| **Special bị nổ trúng** | Kích dây chuyền **1 lần/id**. Sao giữ hướng; Lõi chọn màu nhiều nhất từ bàn trước khi bắt đầu đợt nổ. |
| **Special vừa tạo** | Xuất hiện sau đợt xóa, không tự kích trong chính đợt tạo ra nó. |

**Đổi chỗ hai special luôn hợp lệ**, không cần ghép 3. Tâm combo là ô đích của viên người chơi kéo.

| Cặp đổi chỗ | Hiệu ứng trực tiếp, chưa tính dây chuyền |
|---|---|
| **Sao + Sao** | Chữ thập **1 hàng + 1 cột**, tối đa **15 ô**, bất kể hướng cũ. |
| **Sao + Bom** | **3 hàng + 3 cột** qua tâm, tối đa **39 ô**. |
| **Bom + Bom** | Vuông **5×5**, tối đa **25 ô**. |
| **Lõi + Sao** | Các viên thường cùng màu Sao biến thành Sao, **giữ hướng của Sao đối tác**, rồi nổ đồng loạt. Special có sẵn cùng màu giữ loại và kích dây chuyền. |
| **Lõi + Bom** | Các viên thường cùng màu Bom biến thành Bom rồi nổ đồng loạt. Special có sẵn cùng màu giữ loại và kích dây chuyền. |
| **Lõi + Lõi** | Xóa toàn bàn **đúng 1 lần**. Các special trên bàn tan trong cùng sóng, không phát thêm vụ nổ riêng. |

**Trần chung:** chụp trạng thái bàn trước đợt nổ; tối đa **64 id bị xóa**, mỗi special kích **1 lần**, mỗi viên có màu nhận thưởng **1 lần/id**. Biến thành special giữ nguyên id và màu; Lõi không màu không cho thưởng màu. Không rơi bù giữa dây chuyền; rơi bù xong mới xét cascade bình thường. Các nhánh nổ trong cùng đợt **không tự tăng bậc combo**.

**Quyền hưởng:** bên thực hiện nước đi nhận toàn bộ thưởng của đợt xóa. PvE giữ **quái không tạo special**, nhưng quái kích special có sẵn thì quái hưởng. PvP hai bên cùng luật tạo, kích và hưởng; bỏ đặc quyền `playerTiles` hiện tại.

**3. Nhịp chốt**

Đơn vị **ms**, từ lúc chấp nhận đổi chỗ đến khi bàn ổn định sau lần rơi bù đầu tiên; cascade tiếp theo tính riêng.

| Loại | Đổi chỗ | Tụ lực | Quét/nổ | Dư âm | Rơi bù | Tổng |
|---|---:|---:|---:|---:|---:|---:|
| **Sao** | 110 | 90 | 170 | 100 | 230 | **700** |
| **Bom** | 110 | 80 | 100 | 80 | 230 | **600** |
| **Lõi** | 110 | 140 | 260 | 150 | 230 | **890** |
| **Combo đôi** | 110 | 180 | 500 | 180 | 230 | **1.200** |

- Dây chuyền mở theo nhóm cách **40–60 ms**, cùng chia ngân sách; tổng đợt combo **≤1.400 ms**, không cộng thời lượng từng special.
- Sao quét từ tâm ra hai đầu; Bom nổ vùng cùng lúc; Lõi đánh dấu rồi thu các mục tiêu theo **3 nhịp**, không bắn từng viên.
- Lóe tạo special **180 ms**, chạy cùng lúc với rơi bù.

**4. Bộ FX cần vẽ: 2 sheet, 9 mảnh**

Mỗi mảnh là **hình vẽ nguyên khối**; runtime dịch chuyển, xoay, co giãn, đổi độ sáng và phát hạt. **Không ghép các khung AI thành animation.**

| Sheet | Mảnh vẽ | Cách dùng |
|---|---|---|
| **A — 2048×1024** | **1. Dải Sao** | Lõi trắng ngà hẹp, thân xanh điện, đuôi sao; xoay 90° cho cột, tô viền theo màu viên. |
| A | **2. Đầu Sao** | Hai đầu nhọn bay ngược chiều, tạo cảm giác lực quét. |
| A | **3. Vành nổ Bom** | Sóng xung kích dày, mép lửa vàng cam, tâm trong; mở nhanh đến vùng 3×3. |
| A | **4. Vành Lõi** | Dải lụa cầu vồng có ánh vàng; dùng cho chọn màu và sóng hợp nhất hai Lõi. |
| **B — 1024×1024** | **5. Lóe tạo/kích** | Hoa sáng có mặt cắt ngọc, tâm nhỏ; dùng chung với màu và kích thước khác nhau. |
| B | **6. Dấu mục tiêu** | Quầng khuyết ôm viên, giúp đọc màu Lõi sắp xóa. |
| B | **7. Chỉ hướng Sao** | Cặp mũi nhọn ngang; xoay thành dọc, luôn đọc được khi viên đứng yên. |
| B | **8. Sao lấp lánh** | Hạt bốn cánh, chỉ vài hạt lớn làm điểm nhấn. |
| B | **9. Mảnh ngọc ánh kim** | Mảnh có mặt sáng/tối rõ, văng rồi tan sau nổ. |

**Màu và độ sáng:** trắng ngà `#FFF6DA`; Sao xanh điện `#63DFFF`; Bom vàng cam `#FFB34D`; Lõi dùng cầu vồng, vành vàng. Màu viên giữ ở thân và viền; trắng chỉ ở lõi sáng.

**Blend:** thân mảnh vẽ dùng alpha thường; quầng dùng `screen`, lõi/hạt dùng `lighter` có giới hạn. Tối đa **48 hạt đang sống**, **8 quầng mục tiêu rõ**; mục tiêu còn lại chỉ sáng viền. Một đợt chỉ có **1 đỉnh lóe**, không phủ trắng toàn bàn.

**Reduced-motion:** bỏ rung, xoáy, hạt bay và lóe trắng; giữ chỉ hướng, vùng tác động và chuyển sáng/tan **120–180 ms**. Kết quả cơ chế giống hệt.

Review mockup trước coding; chấm bản chạy trên **390×844** và Studio **1920×911**, đạt **≥8/10** về nhận diện, chất liệu, nhịp và độ rõ bàn.

**5. Rủi ro và cách đo**

- **Lõi + Sao/Bom dễ gần bằng toàn bàn:** đo tỷ lệ xóa **≥48 ô**; đặc biệt kiểm tra Sao cùng hướng. Trần 64 ngăn lặp thưởng nhưng không tự bảo đảm cân bằng.
- **Sao 25→8 ô, Bom xóa màu→9 ô:** sức mạnh đơn giảm; cần đo giá trị chuẩn bị combo thay vì tự tăng sát thương bù.
- **Quyền hưởng đổi sang bên đi:** quái tận dụng special tốt hơn; AI phải hiểu cùng luật.
- **Nổ đồng loạt dễ mất thông tin:** đánh dấu phạm vi trước impact, giữ màu viên tới lúc thu thưởng.

`balance-sim.cjs` hiện **chưa có special**, nên chưa thể dùng kết quả đó để kết luận trước–sau. Cần bổ sung bộ giải special dùng chung cho runtime, AI và sim; đồng bộ `legalMoves()` với combo đôi.

Chạy **2.000 seed × 6 tướng × 3 nhóm thường/tinh anh/boss × 2 phiên bản = 72.000 trận**, giữ nguyên luật nộ/băng/combo giữa hai bản:

| Đo | Báo cáo |
|---|---|
| **Nộ/lượt** | Nộ sinh ra và nộ thực nhận sau trần, trung bình/P95 |
| **Sát thương/lượt** | Sát thương bàn và tổng sát thương, trung bình/P95 |
| **Lượt/trận** | Trung vị/P90, gồm thắng–thua; báo riêng trận chạm giới hạn sim |
| **Special** | Tần suất tạo/kích, ô duy nhất bị xóa, tỷ lệ combo gần toàn bàn |
| **FX** | Thời gian khóa thao tác P95; Sao ≤700, Bom ≤600, Lõi ≤1.000, combo ≤1.400 ms |

Đo bản cũ **có đầy đủ special cũ** làm mốc. Nộ hoặc sát thương trung bình lệch **>10%**, lượt/trận lệch **>15%** thì mở vòng cân bằng tiếp; đây là ngưỡng điều tra, chưa phải kết quả đã đo.