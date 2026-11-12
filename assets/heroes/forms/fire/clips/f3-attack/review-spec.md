**6/10 — LÀM LẠI spec trước khi gen.** Ý đâm thẳng đúng, nhưng còn lỗi:

- **Ảnh #3 — thrust:** toàn bộ lưỡi đao ra ngoài mép phải; #1 — guard cũng sát mép. Mâu thuẫn “whole weapon always inside”. Cần nới canvas chung cho cả ba key, giữ cùng tỉ lệ và điểm neo chân, đủ chứa đầu đao khi đâm.
- **P/Q/R/S:** câu “Motion affects only hair, cloth and tails” khóa cả tay và vũ khí, trái hành động chính. Thay bằng: **“Arms and the rigid glaive perform the described action; hair, cloth and tails follow with secondary motion.”**
- **P/S — chân:** rest có thế chân hẹp hơn guard. “Feet remain planted at the reference positions” không khớp hai đầu mút. Đổi: **“Feet adjust minimally between the supplied poses; no walking, no root translation.”**
- **Q/R:** thêm **“The shaft stays horizontal, the right hand keeps gripping the butt end, the left hand supports the sliding shaft; no swing, rotation, bending or weapon morphing.”** Trang phục nên ghi **“red, white and gold armour matching the reference”**.
- **Nhịp game:** 13/9/9/13 ở 40 ms/khung xấp xỉ **1,6–1,8 giây**, quá chậm nếu phát nguyên chuỗi mỗi đòn. Giữ độ dài để gen, nhưng khi tích hợp phải retime Q theo thời gian lao tới/chạm; damage và `pierce3` trùng thrust. Combo lặp **guard → thrust → guard**, P/S chỉ vào/ra chuỗi. Mã hiện tại gọi các pose rời, chưa tự chạy mọi khung giữa.

Không bỏ máy móc khung cuối: nếu nhòe, chọn khung rõ gần nhất **vẫn đạt đúng tư thế mốc**, tránh giật ở chỗ nối.