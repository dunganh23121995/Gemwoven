1. **Bản hiện tại chưa đáng tiền vì 3 lỗi**

   - **Không đổi dáng khung:** vẫn cùng góc, cạnh và thanh ngang; thu nhỏ trên điện thoại gần như chỉ thấy đổi màu.
   - **Thiếu điểm nhận diện mùa:** chưa có linh vật, tượng góc hay biểu tượng đủ lớn để người chơi nhận ra ngay.
   - **Thiếu chiều sâu và sức sống:** họa tiết nằm phẳng trên viền, chưa tạo cảm giác sở hữu một bộ trang trí được chế tác riêng. Mockup Ảnh Nguyệt đã có hướng tốt hơn nhờ góc nhọn và trăng, nhưng cần thêm điểm nhấn tạo hình.

2. **Phương án “khung trận cao cấp”**

   Mỗi mùa là **một bộ khung có dáng riêng**, giữ mỹ thuật gỗ + đồng vẽ tay:

   | Mảnh | Thiết kế |
   |---|---|
   | Thanh trên | Giữ nguyên các nút; thêm chạm khắc sâu và phụ kiện quanh mép ngoài |
   | Khung cảnh đánh | Bốn góc khác nhau, cạnh có lớp nổi; huy hiệu giữa cạnh trên |
   | Dải giữa | Hai đầu mang hình dáng mùa; bệ Tuyệt kỹ riêng, không dịch chuyển nút |
   | Khung bàn ngọc | Góc có tượng hoặc phụ kiện nổi; cạnh dưới có biểu tượng kết bộ |
   | Trang trí gắn thêm | Một linh vật chính, một chi tiết đối trọng, đuôi/cánh/sừng ôm theo viền |
   | Nền và viền ô | Nền tối có hoa văn chìm; đường ô mảnh, tương phản thấp |

   **Nhận diện và chuyển động từng mùa:**

   - **Hỏa Hồ:** cáo lửa chín đuôi bằng gỗ sơn đỏ và đồng; tượng cáo ở góc, chín đuôi trải dọc mép ngoài. Đầu đuôi cháy nhẹ, vài tàn lửa tan nhanh.
   - **Tuyết Thỏ:** thỏ trăng băng, tai dài và trăng khuyết ôm góc; băng kết thành gờ nổi. Tuyết thưa, ánh băng lướt chậm.
   - **Lộc Thần:** hươu rừng thiêng, sừng phân nhánh ôm cạnh trên; rễ và lá đan quanh đồng cổ. Đom đóm chớp nhẹ, lá khẽ rung.
   - **Tinh Lôi:** phù thủy sao/sấm với mũ nhọn, trượng và vòng sao bằng đồng. Sao nhấp nháy lệch nhịp, tia điện ngắn chạy trong rãnh viền.
   - **Ảnh Nguyệt:** tử thần trăng xanh, áo choàng ôm góc và lưỡi hái chạy theo mép ngoài. Trăng sáng theo nhịp thở, sương mỏng sát viền.

   **Giá trị trả phí:** nhận ra mùa ngay khi nhìn bóng dáng tổng thể; có linh vật nổi, chất liệu nhiều lớp và chuyển động riêng.

   **Giới hạn bắt buộc:** khóa nguyên vùng chữ, máu, nút và 64 ô ngọc; trang trí chỉ tràn vào khoảng trống ngoài khung. Không phủ hiệu ứng lên bàn, không sáng ngang ngọc, không chớp toàn màn hình. Chỉ một điểm động chính và tối đa hai điểm phụ; giảm hoặc dừng khi ngọc đang nổ.

3. **Bộ sheet cho một mùa**

   Lấy **W = chiều rộng màn hình**; kích thước dưới đây là vùng đặt tương đối, xuất art khoảng **2× kích thước hiển thị**:

   | Sheet | Số mảnh | Kích thước tương đối |
   |---|---:|---|
   | Khung cảnh đánh + khung bàn | 16 | Mỗi khung: 4 góc riêng khoảng 6–9% W; 4 cạnh rộng khoảng 2–3% W |
   | Thanh giao diện | 3 | Thanh trên, dải giữa, bệ Tuyệt kỹ; hai thanh giữ nguyên hộp bố cục mặc định |
   | Trang trí nổi | 5 | Linh vật chính 12–16% W, chi tiết đối trọng 8–12% W, huy hiệu trên/dưới và cụm phụ kiện |
   | Nền bàn + đường ô | 2 | Một nền vuông phủ bàn; một ô viền lặp, dùng chung ảnh cho 64 ô |
   | Hiệu ứng | 2 dải × 8 frame | Một chuyển động chính, một hiệu ứng phụ; mỗi frame bao vừa chi tiết cần động |

   Tổng: **26 mảnh tĩnh + 16 frame động**, đóng thành 5 sheet. Giữ bản gốc và prompt.

   **Dùng chung giữa các mùa:** tọa độ, vùng chạm, vùng cấm che, điểm neo, độ dày viền và quy tắc kéo giãn. **Vẽ riêng:** hình dáng góc, linh vật, huy hiệu, đầu thanh và hoa văn. Tượng, mặt linh vật, huy hiệu không được kéo giãn.

4. **Prompt tiếng Anh — mockup Hỏa Hồ để duyệt**

   > Edit ref-default.png into an approval mockup for Gemwoven’s premium seasonal combat frame, “Hỏa Hồ — Nine-Tailed Fire Fox.” Preserve the exact portrait canvas, layout, coordinates and sizes of all gameplay elements. Preserve every Vietnamese label and number exactly as in the reference. Keep the battlefield, characters, health bars, tutorial portrait and speech bubble, tutorial hand, all 64 gem positions, gem artwork, buttons and touch areas unchanged.
   >
   > Redesign the surrounding frame as a bespoke hand-painted fantasy collectible made of carved warm wood, aged brass and vermilion lacquer. Give it a clearly new silhouette and substantial sculptural depth. Place a small sculpted nine-tailed fire fox on the outer upper-left corner of the gem-board frame, below the turn strip. Arrange its nine distinct tails as layered flame-shaped ornaments following the outside left and bottom borders. Add a smaller matching fox-mask ornament at the opposite lower corner, a brass fox-flame crest centered above the battlefield, and restrained flame carvings around the top bar and turn strip. Fit every ornament within the existing canvas and outside gameplay content.
   >
   > Keep broad surfaces dark and quiet. Use warm brass highlights, carved joints, convincing contact shadows and selective ember accents. Keep the board background deep dark teal with a barely visible fox-tail pattern and thin subdued cell borders. Preserve strong gem readability. Suggest gentle animated flames only through a few glowing tail tips and sparse embers along the exterior border; no particles over gems, text or buttons.
   >
   > Match the reference’s polished hand-painted mobile RPG art. The frame must feel valuable through unique sculptural forms, craftsmanship and a recognizable fox mascot. Preserve the original interface hierarchy and spacing. No additional text, no new controls, no layout changes, no oversized mascot, no ornament covering any gem, label, health bar or tutorial element. Deliver one complete portrait gameplay mockup, not an asset sheet.