**6/10 — LÀM LẠI.**

- **Khung 0–11:** gần như giữ nguyên thế thủ; thiếu cú giật đầu, vai và thân sang trái ngay khi trúng đòn. Phát trong ~420 ms sẽ giống đứng chờ rồi mới phản ứng.
- **Khung 13–15:** biểu cảm đau rõ nhất xuất hiện quá muộn. Đỉnh giật cần nằm khoảng **khung 2–5** của clip 17 khung.
- **Khung 16:** chưa thể hiện rõ việc trở lại đúng biểu cảm và thế thủ của `rest`; cần khóa khung cuối về ảnh gốc để tránh bật khi chuyển sang idle.
- Tóc, khăn và đuôi chuyển động khá ít; chưa đọc được nhịp trễ rồi văng nhẹ một lần. Gối cũng chưa thể hiện rõ việc hấp thụ lực.
- Nhân vật, cỡ hình và vị trí chân nhìn chung ổn. Ở độ phân giải ảnh tổng hợp, chưa thấy lỗi rõ về số tay hay kiếm gãy; không có khung nhòe nổi bật.

**Đề xuất:** gen lại đoạn **K**, ưu tiên cú recoil rõ ngay đầu, đạt đỉnh trước khung 6 rồi hồi phục trong phần còn lại. Seed `s21` có biến thiên rõ hơn `s7` trong `takes.jpg`, nhưng chưa đủ để duyệt bằng cách đổi vài khung rời. Giữ **17 khung, không nhân đôi**, và kết thúc đúng `rest`.