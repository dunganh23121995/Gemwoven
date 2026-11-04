**Vòng 6: dọc 8,3/10 · ngang 8,1/10 · Studio 8,6/10. Chưa đạt cả ba.** Hình thái 1: **8,3/10 dọc**.

Hai dải đã tách nền tốt hơn; mặt, trang phục và kiếm vẫn rõ. Chất nâu đất hợp Hiro không hệ. Studio đạt, nhưng khi thu nhỏ, **đỉnh bùng 240–330ms còn quá giống trạng thái duy trì**; dư âm gần như mất trên nền đá.

Sửa tập trung:

- **Spirit:** nút thoi phải-trên chưa đủ nổi để nhận ra khoảnh khắc thức tỉnh. Thử H3 `--fw:1.26; --fx:.28` thay `1.20/.22`; H1 `--fw:1.08; --fx:.18` thay `1.02/.12`. Giữ `--fh`, `--ft`, `--peak:1`. Nếu vẫn chìm, sửa riêng `spirit.webp`: tăng nút thoi **20%**, thêm cạnh `#F0D6A1` đọc được **2px CSS trên điện thoại**.
- **Viền:** code hiện dùng `drop-shadow(0 0 2px ...)`, tạo quầng mềm, chưa phải nét sáng đặc 2px. Đưa nét sáng vào **một số cạnh ngoài của mảnh**, giữ viền tối **1px**; không tăng quầng toàn bộ.
- **Dư âm:** hai gạch còn lẫn với đá và kiếm. Giữ hộp `.26H × .07H`, dịch tâm sang phải **`.08H`**, bảo đảm mỗi gạch dày tối thiểu **2px CSS**, mặt sáng `#C7A16A`, cạnh nhỏ `#F0D6A1`.

**Giữ `--sl/--sr` và `--sideop:.86` hiện tại.** Hai dải duy trì đã đủ; phần cần cải thiện là dấu bùng và dấu dư âm.