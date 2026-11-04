**Chưa đạt đồng loạt ngưỡng 8,5.** Đối chiếu mockup và `critique.md`:

| Bố cục | Điểm | Nhận xét |
|---|---:|---|
| Điện thoại | **8,0/10** | Glyph rõ, hàng 5 ô và `+3` gọn; không che máu, bàn, kỹ năng. Nhưng chú giải tràn lên thanh đầu, che hoàn toàn biển tên trái. |
| Ngang | **7,5/10** | Đưa tên lên thanh trên hợp lý khi khung thấp; hàng hiệu ứng cân đối. Chú giải che gần hết nhân vật trái, mất khả năng quan sát trận. Không trừ điểm phần bàn ngọc. |
| Studio | **8,4/10** | Hiệu ứng dễ đọc, hai phe rõ, chú giải nằm trong vùng trống. Biển tên hợp kit nhưng biển trái dài hơn mức critique; PvP vẫn hiện **“Ải 1” và điểm 0**, sai ngữ cảnh. |

**Sửa cụ thể** — tọa độ theo px CSS, tính từ góc màn hình:

- **Điện thoại 390×844:** chuyển chú giải sang vùng trên HUD phải, thử **(198,110), 184×68**, chữ **12–13 px**; thêm mũi chỉ về glyph đang chọn. Giữ cách biển tên và hàng hiệu ứng ít nhất **4 px**. Kiểm tra lại cả trạng thái đủ 5 ô.
- **Ngang 844×390:** tận dụng lề trái trống: chú giải khoảng **(8,92), 182×90**; tránh phủ nhân vật. Giữ tên trên thanh đầu như hiện tại.
- **Studio:** giới hạn biển tên **160×30**, chữ **14 px**, cắt bằng `…`; thêm mũi chỉ cho chú giải.
- **PvP mọi cỡ:** thay “Ải 1” bằng đúng **Cùng máy / AI**, ẩn điểm PvE.

Bộ glyph **đúng hướng kit**: khối màu rõ, khung đỏ/vàng phân biệt tốt; kiếm chúc xuống cho **Suy yếu** đúng critique. `×2` và `×1,25` tách khỏi số lượt tốt. Huy hiệu hệ cạnh đầu phải thanh nộ theo mockup hiện chưa thấy.

Ảnh tĩnh chưa xác nhận được cách đếm `+N`, tương tác mở/đóng và tên đầy đủ khi chạm.