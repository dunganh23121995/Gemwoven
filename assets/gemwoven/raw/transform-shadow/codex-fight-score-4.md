**Vòng 4 chưa đạt ngưỡng 8,5.** Chấm trên ảnh trận thật, bỏ qua biểu tượng thanh máu:

| Khung nhìn | Điểm |
|---|---:|
| Điện thoại dọc | **8,0/10** |
| Điện thoại ngang | **7,7/10** |
| Studio | **8,2/10** |

Áo, mặt và liềm vẫn rõ; màu tiết chế hợp Noct. Tuy nhiên, **đỉnh bùng 240/330ms gần giống trạng thái duy trì**: ấn bóng và nút thắt phải-trên chưa đọc được độc lập. Hình thái 1 cũng gặp lỗi này. Dải phải còn giống một miếng bóng xám rời khỏi người; ngang thấy rõ nhất.

Đề nghị thử các số sau, chỉ trên `.tf-shadow`:

- **Tách spirit khỏi thân/hào quang:** H3 đặt `--fw:1.40; --fh:1.00; --fx:.42; --ft:.02; --peak:.85`. H1 đặt `--fw:1.22; --fh:1.02; --fx:.40; --ft:0`. Giữ đỉnh sáng ở **nút phải-trên**, không nâng sáng toàn mảng.
- **Ôm sườn và giảm cạnh tranh:** H3 `--sl:.42; --sr:.40`; H1 `.40/.38`; `--sideop:.68` thay `.82`. Giữ thân dải `#514367`, cạnh `#817297`.
- **Dư âm:** dấu sau gót quá chìm trên nền đá. Vẽ hai nét đặc hơn, dày tối thiểu **2px CSS ở điện thoại**, dùng `#817297`, một điểm nhỏ `#B5A7C7`.

Nếu chỉnh vị trí mà đỉnh bùng vẫn chìm, **vẽ lại riêng `spirit.webp`**: nút phải-trên lớn hơn khoảng **30%**, hai nếp chính rộng hơn **20%**, giữ khoảng giữa rỗng. Hào quang đã khóa giữ nguyên.