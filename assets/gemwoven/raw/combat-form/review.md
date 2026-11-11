1. **D1 — Đồng ý có điều kiện:** dùng chung một lựa chọn; nhưng phải migrate `h.look` cũ, tránh biến lựa chọn diện mạo trước đây thành lựa chọn giảm sức mạnh mà người chơi chưa biết.

2. **D2 — Đồng ý:** mở form mới thì tự chuyển; thông báo rõ đã đổi cả bộ kỹ năng, cho phép chọn lại form cũ.

3. **D3 — Đồng ý:** khóa hình thái từ lúc bắt đầu trận đến khi kết thúc, kể cả tải lại hoặc tiếp tục trận dang dở.

4. **D4 — Đồng ý có điều kiện:** chốt hình thái cùng đội hình phòng thủ; trận đang chạy dùng bản chụp đó. Lực chiến phải phản ánh form, nhưng không thể diễn tả hết lợi thế của các bộ kỹ năng khác nhau.

5. **D5 — Phản biện một phần:** miễn phí, không giới hạn là hợp lý; cần phân biệt “chưa chọn” với “đã chủ động chọn form 1”. Balance-sim mặc định cao nhất vẫn cần bổ sung kiểm tra cả ba form và đội hình phối hợp.

6. **D6 — Đồng ý, sửa câu dẫn:** ghi “Dùng bộ kỹ năng riêng, hệ số tuyệt kỹ ×1/×1,1/×1,25; chỉ form 3 có đặc tính riêng”. Không khẳng định form thấp luôn yếu hơn: hiệu ứng khống chế hoặc hỗ trợ có thể hữu dụng hơn dù hệ số thấp.

7. **Rủi ro exploit:** đổi form ngoài trận không được hồi máu, hồi năng lượng, xóa hồi chiêu hoặc làm mới lượt dùng; bộ kỹ năng, hiệu ứng, âm thanh và đặc tính phải cùng lấy từ form đã chốt, tránh ghép sức mạnh form 3 với kỹ năng form 1.

8. **Rủi ro nhiệm vụ/thành tựu:** tách rõ “đã mở form”, “đang dùng form” và “thắng trận bằng form”; ghi nhận theo dữ liệu trận, không theo form đang chọn lúc nhận thưởng. Nhiệm vụ mở form chỉ tính lần đầu.

9. **Rủi ro PvP và nhầm lẫn:** chặn chọn form thấp để hạ lực chiến ghép đối thủ rồi đổi lên trước trận; hiển thị form trong đội hình và lịch sử đấu. Nêu rõ chọn form cũ vẫn giữ cấp, sao, trang bị; tránh khiến người chơi tưởng bị hạ sao.

10. **Chốt — Đồng thuận để làm phương án 2**, với các điều chỉnh trên thành tiêu chí triển khai, đặc biệt migration `h.look`, chốt dữ liệu trận và kiểm tra cân bằng từng bộ kỹ năng.