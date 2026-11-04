**Chưa đạt ngưỡng 8,5.** Đối chiếu kế hoạch và chuẩn Mika:

| Khung hình | Điểm |
|---|---:|
| Điện thoại dọc | **7,8/10** |
| Điện thoại ngang | **7,4/10** |
| Studio | **8,1/10** |

Nori vẫn sắc nét, mặt và vũ khí rõ, HUD sạch. Nhưng **240/330ms chưa đọc thành một lần thức tỉnh**: tán spirit giống cây cảnh phía sau; trạng thái duy trì và dư âm khó phân biệt nếu bỏ huy hiệu. Hình thái 1 cũng mắc lỗi này.

- **Spirit:** giữ bố cục ba tán và chồi phải, **vẽ lại mảng màu**. Tăng phần trung sáng `#5C8050`/`#9EAA69` lên khoảng **40% diện tích nét**, giữ lõi `#172B22`; viền `#DBCD92` chỉ ở cạnh ngoài, dày **2–3px CSS trên điện thoại**. Hiện tán tối chìm vào nền. `--peak:1` đã tối đa, tăng opacity không giải quyết.
- **Vị trí spirit:** thử H1 `--fw:1.20; --fh:1.02; --fx:.24; --ft:.02`; H3 `--fw:1.36; --fh:1.04; --fx:.26; --ft:0`. Đẩy chồi khỏi sừng/khiên, giữ cách HUD ≥6px.
- **Hai sườn:** hiện giống hai lá treo rời, nhất là bên trái Studio. Thu vào: H1 `--sl:.40; --sr:.42`; H2 `.45/.47`; H3 `.49/.51`; giữ `--sideop:1`. Vẽ rõ **hai nếp vỏ trái, ba phiến phải**, thêm mảng nâu rêu `#31513A`, giảm cảm giác lá dài.
- **Dư âm:** mầm gần như mất trong hào quang chân. Thử tâm `x+.24H`, trên `t+.92H`, hộp `.30H × .09H`; giữ hai lá đặc, cạnh sáng rõ, không thêm quầng.

Các số trên là **mốc thử vòng kế tiếp**, chưa phải thông số đã nghiệm thu. Ưu tiên sửa tương phản spirit và dấu dư âm trước; đây là hai điểm kéo bản dựng xuống dưới Mika.