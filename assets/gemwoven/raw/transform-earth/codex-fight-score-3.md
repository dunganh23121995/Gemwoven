**Vòng 3 chưa đạt ngưỡng 8,5.** Tướng rõ, HUD thoáng; điểm yếu vẫn là nhận diện ba trạng thái bằng hình ảnh.

| Khung | Điểm | Lỗi chính |
|---|---:|---|
| Điện thoại dọc | **8,0/10** | Đỉnh bùng thấy khối cây, nhưng ba tán/chồi chưa đọc rõ; duy trì gần giống dư âm. |
| Điện thoại ngang | **7,7/10** | Khi thu nhỏ, dải vỏ cây lẫn vào giáp và nền; mất dấu Biến Thân. |
| Studio | **8,3/10** | Nét mảnh tốt; tán vẫn giống bụi cây sau lưng hơn một ấn cổ thụ. |

**Sửa tập trung:**

- **Ấn bùng:** H3 đổi `--fx:.26→.32`; H1 `.24→.30`. Giữ `--fw --fh --ft`, `--peak:1`: tăng kích thước/opacity tiếp không giải quyết được tương phản. Vẽ lại **`spirit`**: tách ba cụm tán bằng khe rõ, giảm lá vụn; cạnh ngoài dùng `#9EAA69`, chồi nhấn `#DBCD92`, nét chính đạt **2px CSS ở điện thoại**. Giữ khoảng HUD ≥6px.
- **Duy trì:** H3 thử `--sl:.54; --sr:.56`; H1 `.44/.46`. Giữ `--sideop:1`. Hai **`side-*`** cần cạnh vỏ cây màu đất `#9EAA69` rõ hơn, thân tối `#31513A`; tránh tăng vàng toàn mảnh. H1 hiện cũng mắc lỗi chìm dải như H3.
- **Dư âm:** mầm đang lẫn vào cụm sáng cạnh chân. Đổi `.tf-earth .tf-mark`: mép trái từ `x+.09h` sang **`x+.18h`**, top **`t+.96h`**, hộp **`.26H×.08H`**; giữ opacity `.95`. Chưa cần vẽ lại `after`.

Ưu tiên **tương phản và khoảng tách**, giữ nguyên độ nét tướng. Điểm trên chấm hình ảnh; ảnh tĩnh chưa xác nhận độ mượt và âm thanh.