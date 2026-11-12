**7/10 — LÀM LẠI mô tả trước khi gen.** Ý gồng rồi thu thế phù hợp; prompt hiện có mâu thuẫn:

- **T: rest → raise; U: raise → rest:** câu `Motion affects only hair, cloth and tails` cấm chuyển động tay và vũ khí, trong khi hai mốc đổi rõ tư thế tay, cán và lưỡi đao. Thay bằng:  
  `Animate the arms, shoulders and rigid glaive smoothly between the reference poses. Hair, cloth and tails follow with delayed secondary motion. No attack swing or slash.`
- **Hai khung mốc:** bàn chân bên phải ảnh ở `raise` lệch sang phải so với `rest`; dáng đứng cũng mở hơn. Cần căn lại chân và tỷ lệ thân giữa hai key trước khi yêu cầu `Feet remain planted`. Không căn theo hộp bao vũ khí.
- **T, phần vũ khí:** lưỡi đao chuyển từ phải sang trái ảnh, dễ sinh động tác quét hoặc biến dạng. Bổ sung:  
  `The same hand maintains its grip on the same point of the shaft. Move the glaive as one rigid object; no bending, morphing, duplication or hand switching.`
- **Nhịp ghép:** ghi rõ **33 khung: 0 = rest, 16 = raise, 32 = rest**, nếu mỗi đoạn lấy 17 khung và U bỏ khung đầu trùng raise. Nhịp danh nghĩa là **1,32 giây**, nhưng trong game thời lượng thực theo `setSpriteAction`; `40ms` không bảo đảm nhịp đó.
- **Khung cuối U:** nếu bỏ khung nhòe cuối, phải nối lại `rest` sạch và kiểm tra bước chuyển; lấy khung áp chót chưa chắc khớp thế nghỉ.

Giữ camera khóa, nền magenta, không thêm hiệu ứng như spec hiện tại. Chưa có clip nên chưa thể chấm lỗi ở các khung trung gian.