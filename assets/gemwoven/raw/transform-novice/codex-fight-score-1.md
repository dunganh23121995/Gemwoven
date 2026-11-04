**Chưa đạt ngưỡng 8,5 của Mika.** Hiro vẫn rõ mặt, trang phục; duy trì và dư âm phân biệt được. Điểm yếu chính là **khoảnh khắc bùng chưa khác đủ rõ với duy trì**.

| Màn hình | Điểm |
|---|---:|
| Điện thoại dọc | **8,0/10** |
| Điện thoại ngang | **7,6/10** |
| Studio | **8,3/10** |

- **Bùng 240–330ms:** biểu tượng đường hành hương bị thân che nhiều; nút thoi phải-trên khó nhận ra. Trên ngang, gần như chỉ thấy hai dải sườn. Thử H3: `--fw:1.14; --fh:1.00; --fx:.16; --ft:.03; --peak:1` thay `1.01/1.13/.08/-.07/.95`. Mở rộng sang phải, hạ đỉnh khỏi HUD; giữ khoảng cách **≥6px CSS**.
- **Duy trì:** hai dải vàng khá dày, đọc hơi giống cánh trang trí; H1 cũng có sức nặng gần H3. Thử H1 `--sl:.32; --sr:.34; --sideop:.78`; H3 `--sl:.36; --sr:.38; --sideop:.85`. Giữ bất đối xứng trái dài, phải ngắn.
- **Mảnh cần sửa nếu chỉnh CSS vẫn yếu:** ưu tiên `spirit.webp`: làm nút thoi lớn **1,4 lần**, đơn giản hóa nét bao thành **2–3 mảng lớn**, cạnh chính đạt **≥2px CSS trên điện thoại ngang**. Hai mảnh `side-left/right` giảm diện tích vàng sáng khoảng **25%**, tăng trung sắc `#947246` và tối `#5B4932`; `#F0D6A1` chỉ làm điểm nhấn.

**Dư âm giữ nguyên:** nhỏ, yên, đúng ý đồ. Các số trên là cấu hình thử để chụp lại, chưa phải nghiệm thu.