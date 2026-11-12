**7/10 — LÀM LẠI mô tả trước khi gen.** Ý tưởng đúng, nhưng còn ba điểm dễ khiến clip sai:

- **Toàn đoạn X:** câu “Motion affects only hair, cloth and tails” mâu thuẫn với chạy, có thể khiến chân và thân đứng yên. Đổi thành: “Animate a full-body run with alternating leg strides, clear foot contacts, subtle torso bounce, and secondary motion in hair, scarf and tail. No flames, aura or particles.”
- **Đầu đoạn:** “shifts her grip… breaks into” chưa buộc thứ tự, dễ vừa chạy vừa biến dạng kiếm. Đổi thành: “First lift and settle the rigid greatsword onto her right shoulder, then begin running in place. Her right hand maintains its grip; her left hand releases and pumps naturally.” Giữ lưỡi kiếm nguyên hình, mặt luôn thấy rõ.
- **Mốc nối vòng:** `keys: {}` chưa xác định tư thế chạy đã duyệt. Với **24 khung xuất dự kiến**, ghi rõ **0–7 chuyển từ rest sang chạy; 8–23 chạy đều; 23→8 nối liền pha chân, độ cao thân, góc kiếm và chuyển động vải**. Đây là số khung sheet, chưa phải số khung clip nguồn 49 khung. Không đặt khung cuối về rest.

**Nhịp game:** 55 ms/khung → vào chạy **0,44 giây**, vòng chạy **0,88 giây**: hợp lý để thử. Cần xác nhận code phát **0–7 một lần rồi lặp 8–23**; Quảng Trường dùng riêng vòng 8–23. Nếu lặp cả sheet, Mika sẽ liên tục trở về thế thủ.

Sửa ba điểm trên là đủ để duyệt lại; bước spec chưa thể kết luận khung nào nhòe hay bộ phận nào biến dạng.